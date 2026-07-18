import { chromium } from "playwright";

const TOPIC_ID = "gen-finance-editorial-v2-time_retirement-wealth_standard-05";
const DEFAULT_BASE_URL = "http://127.0.0.1:3100";
const FORBIDDEN_ACTIONS = new Set([
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

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

const baseUrl = (readArg("--base-url") ?? DEFAULT_BASE_URL).replace(/\/$/u, "");
if (!/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/iu.test(baseUrl)) {
  throw new Error("pilot_resume_ui_recovery_requires_localhost_http");
}

let browser;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: "ko-KR" });
  const observedActions = [];
  const browserErrors = [];

  page.on("request", (request) => {
    if (!request.url().includes("/api/money-shorts/operator") || request.method() !== "POST") return;
    try {
      observedActions.push(request.postDataJSON()?.action ?? "INVALID_OPERATOR_REQUEST_BODY");
    } catch {
      observedActions.push("INVALID_OPERATOR_REQUEST_BODY");
    }
  });
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  const response = await page.goto(
    `${baseUrl}/money-shorts?resumeTopicId=${encodeURIComponent(TOPIC_ID)}`,
    { waitUntil: "networkidle", timeout: 60_000 },
  );
  if (!response || response.status() !== 200) throw new Error(`money-shorts HTTP ${response?.status() ?? "none"}`);

  await page.getByTestId("wizard-tts-owner-listening-gate").waitFor({ state: "visible", timeout: 60_000 });
  await page.getByTestId("wizard-action-real-images-review-accept").waitFor({ state: "visible", timeout: 60_000 });

  const forbiddenActions = observedActions.filter((action) => FORBIDDEN_ACTIONS.has(action));
  if (forbiddenActions.length > 0) throw new Error(`forbidden action observed: ${forbiddenActions.join(",")}`);
  const nonHmrErrors = browserErrors.filter(
    (message) => !/webpack-hmr.*WebSocket handshake|WebSocket handshake.*webpack-hmr/iu.test(message),
  );
  if (nonHmrErrors.length > 0) throw new Error(`browser errors: ${nonHmrErrors.join(" | ")}`);

  console.log(JSON.stringify({
    status: "PASS",
    topicId: TOPIC_ID,
    ttsOwnerListeningGateVisible: true,
    imageOwnerReviewGateVisible: true,
    observedActions,
    externalActionsInvoked: false,
  }, null, 2));
} finally {
  await browser?.close();
}
