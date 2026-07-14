#!/usr/bin/env node
/**
 * One-topic, UI-driven Money Shorts production runner.
 *
 * `generate` clicks the localhost wizard from category selection through publish
 * preflight, then stops. `review` resumes an existing final MP4 for playback and
 * preflight only. `publish` clicks the guarded dual-platform upload only after an
 * exact approval token and reviewed MP4 path.
 * It never loops over multiple topics and never calls Instagram/YouTube directly.
 */

import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { chromium } from "playwright";

const GENERATE_APPROVAL = "APPROVE_ONE_PILOT_GENERATION";
const IMAGE_REGEN_APPROVAL = "APPROVE_ONE_PILOT_IMAGE_REGENERATION";
const CAPTION_RERENDER_APPROVAL = "APPROVE_ONE_PILOT_CAPTION_RERENDER";
const PUBLISH_APPROVAL = "APPROVE_ONE_PILOT_DUAL_PUBLISH";
const DEFAULT_BASE_URL = "http://localhost:3000";
const DEFAULT_EVIDENCE_ROOT = "C:\\tmp\\money-shorts-os\\one-pilot-playwright-v1";
const MEDIA_ROOT_RE = /^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+/i;

const argv = process.argv.slice(2);
function arg(name) {
  const index = argv.indexOf(name);
  return index >= 0 && typeof argv[index + 1] === "string" ? argv[index + 1] : null;
}

const mode = arg("--mode") ?? "generate";
const approval = arg("--approval") ?? "";
const baseUrl = (arg("--base-url") ?? DEFAULT_BASE_URL).replace(/\/$/, "");
const requestedTopicId = arg("--topic-id")?.trim() ?? null;
const titleContains = arg("--title-contains")?.trim() ?? null;
const reviewedVideoPath = arg("--reviewed-video")?.trim() ?? null;
const evidenceRoot = path.resolve(arg("--evidence-root") ?? DEFAULT_EVIDENCE_ROOT);

function abort(message, code = 2) {
  console.error(`BLOCKED: ${message}`);
  process.exit(code);
}

if (!["generate", "resume-generate", "regenerate-images", "rerender-captions", "review", "publish"].includes(mode)) {
  abort("--mode must be generate, resume-generate, regenerate-images, rerender-captions, review, or publish");
}
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(baseUrl)) {
  abort("--base-url must be localhost or 127.0.0.1 over http");
}
if (!MEDIA_ROOT_RE.test(evidenceRoot + path.sep)) abort("--evidence-root must stay under C:\\tmp\\money-shorts-os");
if (mode === "generate" && approval !== GENERATE_APPROVAL) abort(`generation requires --approval ${GENERATE_APPROVAL}`);
if (mode === "resume-generate") {
  if (approval !== GENERATE_APPROVAL) abort(`resume generation requires --approval ${GENERATE_APPROVAL}`);
  if (!requestedTopicId) abort("resume generation requires --topic-id");
}
if (mode === "regenerate-images") {
  if (approval !== IMAGE_REGEN_APPROVAL) abort(`image regeneration requires --approval ${IMAGE_REGEN_APPROVAL}`);
  if (!requestedTopicId) abort("image regeneration requires --topic-id");
}
if (mode === "rerender-captions") {
  if (approval !== CAPTION_RERENDER_APPROVAL) {
    abort("caption rerender requires --approval " + CAPTION_RERENDER_APPROVAL);
  }
  if (!requestedTopicId) abort("caption rerender requires --topic-id");
}
if (mode === "review" && !requestedTopicId) abort("review requires --topic-id");
if (mode === "publish") {
  if (approval !== PUBLISH_APPROVAL) abort(`publish requires --approval ${PUBLISH_APPROVAL}`);
  if (!requestedTopicId) abort("publish requires --topic-id");
  if (!reviewedVideoPath || !MEDIA_ROOT_RE.test(path.resolve(reviewedVideoPath))) {
    abort("publish requires --reviewed-video under C:\\tmp\\money-shorts-os");
  }
}

const runId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
const evidenceDir = path.join(evidenceRoot, runId);
fs.mkdirSync(evidenceDir, { recursive: true });
const evidencePath = path.join(evidenceDir, "pilot-evidence.json");

const evidence = {
  schemaVersion: "money_shorts_one_pilot_playwright_v1",
  runId,
  mode,
  startedAt: new Date().toISOString(),
  baseUrl,
  requestedTopicId,
  selectedTopic: null,
  stages: [],
  browserConsoleErrors: [],
  finalVideo: null,
  playback: null,
  externalPublishInvoked: false,
  status: "RUNNING",
  blocker: null,
};

function atomicWriteEvidence() {
  const temporary = `${evidencePath}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(evidence, null, 2), "utf8");
  fs.renameSync(temporary, evidencePath);
}

function normalizePath(value) {
  return path.resolve(String(value ?? "")).replaceAll("/", "\\").toLowerCase();
}

function stageRecord(action, payload) {
  const stage = {
    action,
    at: new Date().toISOString(),
    status: payload?.status ?? "unknown",
    summary: payload?.summary ?? null,
    blockerCode: payload?.blockerCode ?? null,
    noLive: payload?.noLive ?? null,
    raw: payload?.raw ?? null,
  };
  evidence.stages.push(stage);
  atomicWriteEvidence();
  console.log(`[pilot] ${action}: ${stage.status} - ${stage.summary ?? ""}`);
  if (payload?.status !== "success") {
    const error = new Error(`${action} ${stage.status}: ${stage.summary ?? "unknown failure"}`);
    error.blockerCode = payload?.blockerCode ?? `${action}_NOT_SUCCESS`;
    throw error;
  }
  return payload;
}

async function responseForAction(page, action, trigger, timeout) {
  const responsePromise = page.waitForResponse((response) => {
    if (!response.url().includes("/api/money-shorts/operator") || response.request().method() !== "POST") return false;
    try {
      return response.request().postDataJSON()?.action === action;
    } catch {
      return false;
    }
  }, { timeout });
  await trigger();
  const response = await responsePromise;
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`${action} returned non-JSON HTTP ${response.status()}`);
  }
  await page.screenshot({
    path: path.join(evidenceDir, `${String(evidence.stages.length + 1).padStart(2, "0")}-${action}.png`),
    fullPage: true,
  });
  return stageRecord(action, payload);
}

async function clickAction(page, action, testId, timeout) {
  const button = page.getByTestId(testId);
  await button.waitFor({ state: "visible", timeout: 60_000 });
  await page.waitForFunction((id) => {
    const element = document.querySelector(`[data-testid="${id}"]`);
    return element instanceof HTMLButtonElement && !element.disabled;
  }, testId, { timeout: 60_000 });
  return responseForAction(page, action, () => button.click(), timeout);
}

async function readMediaStatus(page, topicId) {
  const payload = await page.evaluate(async (id) => {
    const response = await fetch("/api/money-shorts/operator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "realMediaStatus", topicId: id }),
    });
    return response.json();
  }, topicId);
  return stageRecord("realMediaStatus", payload);
}

function chooseOneTopic(topics) {
  const candidates = Array.isArray(topics) ? topics.filter((topic) => topic && typeof topic.topicId === "string") : [];
  const titleFiltered = titleContains
    ? candidates.filter((topic) => String(topic.title ?? "").includes(titleContains))
    : candidates;
  const pool = titleFiltered.length > 0 ? titleFiltered : candidates;
  if (pool.length === 0) throw new Error("topicRecommend returned no usable topic");
  return [...pool].sort((a, b) => {
    const quality = Number(b.qualityScore ?? 0) - Number(a.qualityScore ?? 0);
    if (quality !== 0) return quality;
    return Number(Boolean(b.recommended)) - Number(Boolean(a.recommended));
  })[0];
}

async function verifyPlayback(page) {
  const video = page.getByTestId("wizard-final-video");
  await video.waitFor({ state: "visible", timeout: 60_000 });
  const playback = await video.evaluate(async (element) => {
    element.muted = true;
    await element.play();
    const started = Date.now();
    while (element.currentTime < 0.35 && Date.now() - started < 15_000) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    element.pause();
    return {
      readyState: element.readyState,
      duration: Number.isFinite(element.duration) ? element.duration : null,
      currentTime: element.currentTime,
      videoWidth: element.videoWidth,
      videoHeight: element.videoHeight,
      errorCode: element.error?.code ?? null,
    };
  });
  if (playback.readyState < 3 || playback.currentTime < 0.25 || playback.errorCode != null) {
    throw Object.assign(new Error(`final video playback failed: ${JSON.stringify(playback)}`), {
      blockerCode: "FINAL_VIDEO_PLAYBACK_FAILED",
    });
  }
  evidence.playback = playback;
  atomicWriteEvidence();
  return playback;
}

async function clickFinalPreview(page) {
  const button = page.getByTestId("wizard-action-preview");
  await button.waitFor({ state: "visible", timeout: 60_000 });
  await page.waitForFunction((id) => {
    const element = document.querySelector(`[data-testid="${id}"]`);
    return element instanceof HTMLButtonElement && !element.disabled;
  }, "wizard-action-preview", { timeout: 60_000 });
  await button.click();
  const playback = await verifyPlayback(page);
  stageRecord("finalPreviewPlayback", {
    status: "success",
    summary: `최종 MP4 브라우저 재생 확인 (${playback.duration ?? "?"}초)`,
    noLive: true,
    raw: { playback },
  });
}

let browser;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") evidence.browserConsoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => evidence.browserConsoleErrors.push(error.message));

  const resumeQuery = mode !== "generate" ? `?resumeTopicId=${encodeURIComponent(requestedTopicId)}` : "";
  const response = await page.goto(`${baseUrl}/money-shorts${resumeQuery}`, { waitUntil: "networkidle", timeout: 60_000 });
  if (!response || response.status() !== 200) throw new Error(`money-shorts page HTTP ${response?.status() ?? "no response"}`);
  await page.getByText("자동 쇼츠 만들기", { exact: true }).waitFor({ state: "visible", timeout: 60_000 });

  let topicId = requestedTopicId;
  if (mode === "generate") {
    await page.getByTestId("wizard-category-finance").click();
    const recommendation = await clickAction(page, "topicRecommend", "wizard-action-topic-recommend", 60_000);
    const selected = chooseOneTopic(recommendation.raw?.topics);
    topicId = selected.topicId;
    evidence.selectedTopic = {
      topicId,
      title: selected.title ?? null,
      qualityScore: selected.qualityScore ?? null,
      financeSubtopic: selected.financeSubtopic ?? null,
      editorialLane: selected.editorialLane ?? null,
    };
    atomicWriteEvidence();
    console.log(`[pilot] selected exactly one topic: ${selected.title} (${topicId})`);

    const card = page.getByTestId("wizard-topic-card").filter({ hasText: String(selected.title) }).first();
    if (selected.requiresEditorialDecision === true && selected.editorialDecision !== "make") {
      await responseForAction(page, "topicPreference", () => card.getByTestId("wizard-topic-make").click(), 60_000);
    } else {
      await card.getByTestId("wizard-topic-select").check();
    }

    await clickAction(page, "scriptPreview", "wizard-action-script", 180_000);
    await clickAction(page, "realTtsCreate", "wizard-action-real-tts", 300_000);
    await clickAction(page, "realSceneImagesCreate", "wizard-action-real-images", 3_600_000);
    const finalVideoResult = await clickAction(page, "finalVideoCreate", "wizard-action-final-video", 900_000);
    await clickFinalPreview(page);
    const mediaPayload = await readMediaStatus(page, topicId);
    const media = mediaPayload.raw?.media;
    if (media?.mediaQualityGate?.ok !== true || media?.finalVideo?.ready !== true) {
      throw Object.assign(new Error("media quality gate did not pass after final render"), {
        blockerCode: "MEDIA_QUALITY_GATE_NOT_READY",
      });
    }
    evidence.finalVideo = {
      ...media.finalVideo,
      sha256: createHash("sha256").update(fs.readFileSync(media.finalVideo.mp4Path)).digest("hex"),
      renderResponse: finalVideoResult.summary ?? null,
    };
    await clickAction(page, "wizardPreflight", "wizard-action-preflight", 180_000);
    evidence.status = "GENERATED_PREFLIGHT_OK_AWAITING_REVIEW";
  } else if (mode === "resume-generate") {
    evidence.selectedTopic = { topicId, title: null };
    await clickAction(page, "scriptPreview", "wizard-action-script", 180_000);
    await clickAction(page, "realTtsCreate", "wizard-action-real-tts", 300_000);
    await clickAction(page, "realSceneImagesCreate", "wizard-action-real-images", 3_600_000);
    const finalVideoResult = await clickAction(page, "finalVideoCreate", "wizard-action-final-video", 900_000);
    await clickFinalPreview(page);
    const mediaPayload = await readMediaStatus(page, topicId);
    const media = mediaPayload.raw?.media;
    if (media?.mediaQualityGate?.ok !== true || media?.finalVideo?.ready !== true) {
      throw Object.assign(new Error("media quality gate did not pass after resumed full generation"), {
        blockerCode: "MEDIA_QUALITY_GATE_NOT_READY",
      });
    }
    evidence.finalVideo = {
      ...media.finalVideo,
      sha256: createHash("sha256").update(fs.readFileSync(media.finalVideo.mp4Path)).digest("hex"),
      renderResponse: finalVideoResult.summary ?? null,
    };
    await clickAction(page, "wizardPreflight", "wizard-action-preflight", 180_000);
    evidence.status = "RESUMED_GENERATED_PREFLIGHT_OK_AWAITING_REVIEW";
  } else if (mode === "regenerate-images") {
    const before = await readMediaStatus(page, topicId);
    if (before.raw?.media?.scriptEngine?.finalReady !== true || before.raw?.media?.realTts?.ready !== true) {
      throw Object.assign(new Error("image regeneration requires an existing final script and real TTS"), {
        blockerCode: "SCRIPT_OR_REAL_TTS_NOT_READY",
      });
    }
    await clickAction(page, "realSceneImagesCreate", "wizard-action-real-images", 3_600_000);
    const finalVideoResult = await clickAction(page, "finalVideoCreate", "wizard-action-final-video", 900_000);
    await clickFinalPreview(page);
    const mediaPayload = await readMediaStatus(page, topicId);
    const media = mediaPayload.raw?.media;
    if (media?.mediaQualityGate?.ok !== true || media?.finalVideo?.ready !== true) {
      throw Object.assign(new Error("media quality gate did not pass after image regeneration"), {
        blockerCode: "MEDIA_QUALITY_GATE_NOT_READY",
      });
    }
    evidence.selectedTopic = { topicId, title: null };
    evidence.finalVideo = {
      ...media.finalVideo,
      sha256: createHash("sha256").update(fs.readFileSync(media.finalVideo.mp4Path)).digest("hex"),
      renderResponse: finalVideoResult.summary ?? null,
    };
    await clickAction(page, "wizardPreflight", "wizard-action-preflight", 180_000);
    evidence.status = "REGENERATED_PREFLIGHT_OK_AWAITING_REVIEW";
  } else if (mode === "rerender-captions") {
    const before = await readMediaStatus(page, topicId);
    if (
      before.raw?.media?.scriptEngine?.finalReady !== true ||
      before.raw?.media?.realTts?.ready !== true ||
      before.raw?.media?.realImages?.ready !== true
    ) {
      throw Object.assign(new Error("caption rerender requires an existing final script, real TTS and real images"), {
        blockerCode: "SCRIPT_TTS_OR_IMAGES_NOT_READY",
      });
    }
    const finalVideoResult = await clickAction(page, "finalVideoCreate", "wizard-action-final-video", 900_000);
    await clickFinalPreview(page);
    const mediaPayload = await readMediaStatus(page, topicId);
    const media = mediaPayload.raw?.media;
    if (media?.mediaQualityGate?.ok !== true || media?.finalVideo?.ready !== true) {
      throw Object.assign(new Error("media quality gate did not pass after caption rerender"), {
        blockerCode: "MEDIA_QUALITY_GATE_NOT_READY",
      });
    }
    evidence.selectedTopic = { topicId, title: null };
    evidence.finalVideo = {
      ...media.finalVideo,
      sha256: createHash("sha256").update(fs.readFileSync(media.finalVideo.mp4Path)).digest("hex"),
      renderResponse: finalVideoResult.summary ?? null,
    };
    await clickAction(page, "wizardPreflight", "wizard-action-preflight", 180_000);
    evidence.status = "CAPTION_RERENDERED_PREFLIGHT_OK_AWAITING_REVIEW";
  } else {
    const mediaPayload = await readMediaStatus(page, topicId);
    const media = mediaPayload.raw?.media;
    if (media?.mediaQualityGate?.ok !== true || media?.finalVideo?.ready !== true || !media.finalVideo.mp4Path) {
      throw Object.assign(new Error("requested topic has no publishable final video"), {
        blockerCode: "MEDIA_QUALITY_GATE_NOT_READY",
      });
    }
    if (mode === "publish" && normalizePath(media.finalVideo.mp4Path) !== normalizePath(reviewedVideoPath)) {
      throw Object.assign(new Error("--reviewed-video does not match the current topic final MP4"), {
        blockerCode: "REVIEWED_VIDEO_MISMATCH",
      });
    }
    evidence.selectedTopic = { topicId, title: null };
    evidence.finalVideo = {
      ...media.finalVideo,
      sha256: createHash("sha256").update(fs.readFileSync(media.finalVideo.mp4Path)).digest("hex"),
    };
    await clickFinalPreview(page);
    await clickAction(page, "wizardPreflight", "wizard-action-preflight", 180_000);
    if (mode === "review") {
      evidence.status = "REVIEWED_PREFLIGHT_OK_AWAITING_OWNER_PUBLISH";
    } else {
      await page.getByTestId("wizard-confirm-discovery").check();
      await page.getByTestId("wizard-confirm-reviewed").check();
      await page.getByTestId("wizard-confirm-publish").check();
      await page.getByTestId("wizard-confirm-text").fill("업로드");
      evidence.externalPublishInvoked = true;
      atomicWriteEvidence();
      const published = await clickAction(page, "actualUpload", "wizard-action-upload", 900_000);
      evidence.publishResult = published.raw ?? null;
      evidence.status = "PUBLISHED_DUAL_PLATFORM_OK";
    }
  }

  evidence.finishedAt = new Date().toISOString();
  atomicWriteEvidence();
  await page.screenshot({ path: path.join(evidenceDir, "final-state.png"), fullPage: true });
  console.log(JSON.stringify({ status: evidence.status, topic: evidence.selectedTopic, finalVideo: evidence.finalVideo, evidencePath }, null, 2));
} catch (error) {
  evidence.status = "BLOCKED";
  evidence.blocker = {
    code: error?.blockerCode ?? "PLAYWRIGHT_PILOT_FAILED",
    message: error instanceof Error ? error.message : String(error),
  };
  evidence.finishedAt = new Date().toISOString();
  atomicWriteEvidence();
  console.error(JSON.stringify({ status: evidence.status, blocker: evidence.blocker, evidencePath }, null, 2));
  process.exitCode = 1;
} finally {
  await browser?.close().catch(() => {});
}
