import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.MONEY_SHORTS_BASE_URL ?? "http://localhost:3000";
const evidenceDir = "C:\\tmp\\money-shorts-os\\upload-ready-library-playwright-v1";
const fixtureVideoPath = "C:\\tmp\\money-shorts-os\\web-wizard-create-v1\\gen-finance-editorial-v2-consumption-psychology-warning-04\\real\\video-3d-editorial-sequence-v10\\final-gen-finance-editorial-v2-consumption-psychology-warning-04.mp4";
const fixtureAudioPath = "C:\\tmp\\money-shorts-os\\audio-driven-timing-qa-v1\\scene-01-elevenlabs.mp3";
fs.mkdirSync(evidenceDir, { recursive: true });

const evidence = {
  schemaVersion: "money_shorts_upload_ready_library_playwright_v1",
  baseUrl: BASE_URL,
  checkedAt: new Date().toISOString(),
  noLive: true,
  pendingCount: null,
  injectedUiFixture: false,
  selectedTopicId: null,
  finalVideo: null,
  browserConsoleErrors: [],
  httpErrors: [],
};

let browser;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, locale: "ko-KR" });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") evidence.browserConsoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => evidence.browserConsoleErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) evidence.httpErrors.push(`${response.status()} ${response.url()}`);
  });

  const response = await page.goto(`${BASE_URL}/money-shorts`, { waitUntil: "networkidle", timeout: 60_000 });
  if (!response || response.status() !== 200) throw new Error(`money-shorts page HTTP ${response?.status() ?? "no response"}`);
  await page.getByTestId("wizard-upload-ready-library").waitFor({ state: "visible", timeout: 60_000 });

  const listResponse = await page.evaluate(async () => {
    const result = await fetch("/api/money-shorts/operator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "uploadReadyList" }),
    });
    return result.json();
  });
  if (listResponse.status !== "success" || listResponse.noLive !== true || !Array.isArray(listResponse.raw?.items)) {
    throw new Error(`upload-ready list response invalid: ${JSON.stringify(listResponse)}`);
  }
  const items = listResponse.raw.items;
  evidence.pendingCount = items.length;

  const renderedCount = await page.getByTestId("wizard-upload-ready-item").count();
  if (renderedCount !== items.length) throw new Error(`rendered list count mismatch: ui=${renderedCount}, api=${items.length}`);

  let readyItem = items.find((item) => item.status === "ready");
  if (!readyItem) {
    // 실제 대기 목록이 비어 있어도, 검증된 상태 형태를 UI 응답에만 주입해 불러오기
    // 동선을 검수한다. 실제 파일/게시 원장/API에는 쓰지 않는다.
    readyItem = {
      topicId: "gen-finance-editorial-v2-investing_assets-reversal-01",
      title: "검수용 완성 영상",
      category: "finance",
      totalParts: 2,
      totalDurationSec: null,
      updatedAt: null,
      status: "ready",
      detail: "Playwright UI 복원 검수용 항목",
    };
    const syntheticMedia = {
      production: { strategyVersion: "money_shorts_semantic_prehook_series_v1", mode: "two_part", totalParts: 2 },
      scriptEngine: { finalReady: true, mode: "local_only", note: "검수용", rewriteNotes: [], polishDisabled: false, anthropicKeyPresent: true, elevenLabsKeyPresent: true },
      realTts: { ready: true, audioPath: null, durationSec: 58.1, provider: "elevenlabs", apiCallCount: 1, missingEnv: [] },
      realImages: { ready: true, generatedCount: 15, expectedCount: 15, dir: null, blocked: null },
      finalVideo: { ready: true, mp4Path: null, durationSec: 58.1, width: 1080, height: 1920, hasAudio: true, sizeBytes: 1 },
      mediaQualityGate: { ok: true, reasons: [], blockerCode: null },
      parts: [
        { id: "part-1", partNumber: 1, totalParts: 2, canonicalTitle: "검수용 완성 영상", platformTitle: "검수용 완성 영상 1편", realTts: { ready: true }, realImages: { ready: true }, finalVideo: { ready: true, mp4Path: null }, mediaQualityGate: { ok: true, reasons: [], blockerCode: null } },
        { id: "part-2", partNumber: 2, totalParts: 2, canonicalTitle: "검수용 완성 영상", platformTitle: "검수용 완성 영상 2편", realTts: { ready: true }, realImages: { ready: true }, finalVideo: { ready: true, mp4Path: null }, mediaQualityGate: { ok: true, reasons: [], blockerCode: null } },
      ],
    };
    await page.route("**/api/money-shorts/operator**", async (route) => {
      const url = route.request().url();
      if (route.request().method() === "GET" && url.includes("video=final") && url.includes(readyItem.topicId)) {
        return route.fulfill({ contentType: "video/mp4", body: fs.readFileSync(fixtureVideoPath) });
      }
      if (route.request().method() === "GET" && url.includes("audio=real") && url.includes(readyItem.topicId)) {
        return route.fulfill({ contentType: "audio/mpeg", body: fs.readFileSync(fixtureAudioPath) });
      }
      const body = String(route.request().postData() ?? "");
      if (body.includes("uploadReadyList")) {
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            action: "uploadReadyList",
            status: "success",
            summary: "검수용 목록 1개",
            raw: { items: [readyItem] },
            noLive: true,
          }),
        });
      }
      if (body.includes("realMediaStatus") && body.includes(readyItem.topicId)) {
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ action: "realMediaStatus", status: "success", summary: "검수용 최종 영상", raw: { media: syntheticMedia }, noLive: true }),
        });
      }
      return route.continue();
    });
    await page.getByTestId("wizard-action-refresh-upload-ready").click();
    await page.getByTestId("wizard-upload-ready-item").waitFor({ state: "visible", timeout: 30_000 });
    evidence.injectedUiFixture = true;
  }

  if (readyItem) {
    const item = page.getByTestId("wizard-upload-ready-item").filter({ hasText: readyItem.title }).first();
    const restoreResponsePromise = page.waitForResponse((response) =>
      response.url().includes("/api/money-shorts/operator") &&
      response.request().method() === "POST" &&
      String(response.request().postData() ?? "").includes("realMediaStatus"),
    { timeout: 60_000 });
    await item.getByTestId("wizard-action-load-upload-ready").click();
    await page.waitForURL(new RegExp(`resumeTopicId=${encodeURIComponent(readyItem.topicId)}`), { timeout: 15_000 });
    const restoreResponse = await restoreResponsePromise;
    const restoredMedia = await restoreResponse.json();
    if (restoredMedia.raw?.media?.mediaQualityGate?.ok !== true || restoredMedia.raw?.media?.finalVideo?.ready !== true) {
      throw new Error(`loaded item did not restore verified media: ${JSON.stringify(restoredMedia)}`);
    }
    const video = page.getByTestId("wizard-final-video");
    await video.waitFor({ state: "visible", timeout: 60_000 });
    const videoBox = await video.boundingBox();
    const pageLayout = await page.evaluate(() => ({ viewportWidth: window.innerWidth, documentWidth: document.documentElement.scrollWidth }));
    if (!videoBox || videoBox.width > 281 || pageLayout.documentWidth > pageLayout.viewportWidth + 1) {
      throw new Error(`loaded final player layout invalid: ${JSON.stringify({ videoBox, pageLayout })}`);
    }
    const media = await page.evaluate(async (topicId) => {
      const result = await fetch("/api/money-shorts/operator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "realMediaStatus", topicId }),
      });
      return result.json();
    }, readyItem.topicId);
    if (media.raw?.media?.mediaQualityGate?.ok !== true || media.raw?.media?.finalVideo?.ready !== true) {
      throw new Error("loaded item did not restore a verified final video");
    }
    const uploadButton = page.getByTestId("wizard-action-upload");
    if (await uploadButton.isEnabled()) throw new Error("actual upload must remain blocked before preflight and confirmations");
    evidence.selectedTopicId = readyItem.topicId;
    evidence.finalVideo = { ...media.raw.media.finalVideo, playerWidth: videoBox.width };
  }

  await page.screenshot({ path: path.join(evidenceDir, "upload-ready-library.png"), fullPage: true });
  if (evidence.browserConsoleErrors.length > 0) throw new Error(`browser console errors: ${evidence.browserConsoleErrors.join(" | ")}`);
  fs.writeFileSync(path.join(evidenceDir, "playwright-evidence.json"), JSON.stringify(evidence, null, 2), "utf8");
  console.log(`[upload-ready-library-playwright] PASS: ${path.join(evidenceDir, "playwright-evidence.json")}`);
} catch (error) {
  fs.writeFileSync(path.join(evidenceDir, "playwright-evidence.json"), JSON.stringify({ ...evidence, error: String(error?.stack ?? error) }, null, 2), "utf8");
  console.error(`[upload-ready-library-playwright] FAIL: ${error instanceof Error ? error.stack : String(error)}`);
  process.exitCode = 1;
} finally {
  await browser?.close();
}
