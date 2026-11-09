import { chromium } from "playwright";

import {
  buildProductionPlan,
  loadProductionRecords,
} from "./run-money-shorts-500-production-batch.mjs";

const DEFAULT_BASE_URL = "http://127.0.0.1:3100";
const FORBIDDEN_UI_ACTIONS = new Set([
  "topicRecommend",
  "topicPreference",
  "scriptPreview",
  "realTtsCreate",
  "realTtsQualityAccept",
  "realSceneImagesCreate",
  "realSceneImagesReviewAccept",
  "realSceneImagesRegenerateSelected",
  "flowMotionPrepare",
  "flowMotionGenerate",
  "flowMotionQaPass",
  "flowMotionQaFail",
  "finalVideoCreate",
  "finalVideoReviewAccept",
  "wizardPreflight",
  "actualUpload",
]);

let passed = 0;
let failed = 0;

function check(name, ok, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` - ${detail}` : ""}`);
  }
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

const baseUrl = (arg("--base-url") ?? DEFAULT_BASE_URL).replace(/\/$/u, "");
if (!/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/iu.test(baseUrl)) {
  throw new Error("ui_api_smoke_requires_localhost_http");
}

async function postOperator(action, body = {}) {
  const response = await fetch(`${baseUrl}/api/money-shorts/operator`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  return { httpStatus: response.status, body: await response.json() };
}

const records = loadProductionRecords();
const pilotTopicIds = buildProductionPlan(records).batchPolicy.pilotTopicIds;
check(
  "smoke uses the deterministic three-topic finance pilot",
  pilotTopicIds.length === 3 && new Set(pilotTopicIds).size === 3,
);

const landing = await fetch(`${baseUrl}/money-shorts`);
const landingHtml = await landing.text();
check("money-shorts UI is served locally", landing.status === 200);
check(
  "initial UI exposes finance as the only active category",
  landingHtml.includes("자동 쇼츠 만들기") &&
    landingHtml.includes("재테크") &&
    !landingHtml.includes("귀여운동물") &&
    !landingHtml.includes("셀럽엔터"),
);

const status = await postOperator("status");
check(
  "operator status is a no-live read-only response",
  status.httpStatus === 200 &&
    status.body.status === "success" &&
    status.body.noLive === true &&
    status.body.liveRunnerInvoked !== true &&
    status.body.raw?.actualUploadAvailableOnLocalDev === true,
);

const nonFinance = await postOperator("topicRecommend", { category: "animals" });
check(
  "active API rejects every non-finance category before topic work",
  nonFinance.httpStatus === 400 &&
    nonFinance.body.status === "blocked" &&
    nonFinance.body.blockerCode === "FINANCE_CATEGORY_ONLY" &&
    nonFinance.body.noLive === true,
);

const missingTopicId = "finance-ui-api-smoke-missing-topic";
const script = await postOperator("scriptPreview", { topicId: missingTopicId });
check(
  "script API fails closed for an unselected synthetic topic without generation",
  script.body.status === "blocked" &&
    script.body.blockerCode === "SCRIPT_NOT_COMPILED_FOR_TOPIC" &&
    script.body.noLive === true &&
    script.body.liveRunnerInvoked !== true,
);

const tts = await postOperator("realTtsPreflight", { topicId: missingTopicId });
check(
  "TTS preflight fails closed before a missing script can spawn local work",
  tts.body.status === "blocked" &&
    String(tts.body.blockerCode ?? "").startsWith("script_final_missing") &&
    tts.body.noLive === true &&
    tts.body.liveRunnerInvoked !== true,
);

const flow = await postOperator("flowMotionPrepare", { topicId: missingTopicId });
check(
  "Flow packet preparation fails closed without selected-scene images",
  flow.body.status === "blocked" &&
    flow.body.noLive === true &&
    flow.body.liveRunnerInvoked !== true,
);

const upload = await postOperator("actualUpload", { topicId: missingTopicId });
check(
  "upload API rejects missing Owner confirmations without an external runner",
  upload.body.status === "blocked" &&
    upload.body.noLive === true &&
    upload.body.liveRunnerInvoked !== true,
);

let browser;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ locale: "ko-KR", viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const observedActions = [];
  const browserErrors = [];
  page.on("request", (request) => {
    if (!request.url().includes("/api/money-shorts/operator") || request.method() !== "POST") return;
    try {
      const action = request.postDataJSON()?.action;
      if (typeof action === "string") observedActions.push(action);
    } catch {
      observedActions.push("INVALID_OPERATOR_REQUEST_BODY");
    }
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });

  for (const topicId of pilotTopicIds) {
    const response = await page.goto(
      `${baseUrl}/money-shorts?resumeTopicId=${encodeURIComponent(topicId)}`,
      { waitUntil: "networkidle", timeout: 60_000 },
    );
    check(`finance pilot ${topicId} restores in the local wizard`,
      response?.status() === 200 &&
        await page.getByTestId("wizard-category-finance").isVisible() &&
        await page.getByText("자동 쇼츠 만들기", { exact: true }).isVisible(),
    );
  }
  check(
    "resume UI does not invoke a generation, render, Flow, or upload action",
    observedActions.every((action) => !FORBIDDEN_UI_ACTIONS.has(action)),
    observedActions.join(","),
  );
  const nonHmrBrowserErrors = browserErrors.filter(
    (message) => !/webpack-hmr.*WebSocket handshake|WebSocket handshake.*webpack-hmr/iu.test(message),
  );
  check(
    "resume UI has no browser runtime error beyond development HMR transport noise",
    nonHmrBrowserErrors.length === 0,
    nonHmrBrowserErrors.join(" | "),
  );
} finally {
  await browser?.close();
}

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
