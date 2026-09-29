#!/usr/bin/env node

/**
 * Gemini 영상 생성 — "배치 제출(최대 동시 N개) + 병렬 대기" 방식.
 *
 * 순수 병렬 실행(4탭 동시 시작)은 실패했다: Gemini 의 네이티브 드롭다운 메뉴
 * (세로모드 선택, 업로드 도구)가 OS 레벨 탭 포커스를 요구해서, 백그라운드 탭에서
 * 메뉴를 열면 클릭이 무효화된다(2026-09-16, page.bringToFront() 로도 해결 안 됨).
 *
 * 또한 Gemini 계정당 동시 영상 생성 요청은 최대 2개로 제한된다(2026-09-17 실제
 * 관찰: 3탭 동시 제출 시 3번째가 "You have 2 video generation requests running
 * right now, which is the maximum I can do at one time." 로 거부됨). 그 이상
 * 제출해봐야 거부되므로 MAX_CONCURRENT(기본 2)를 넘는 장면은 앞선 것이 하나
 * 끝날 때까지 제출을 미룬다.
 *
 * 이 스크립트는 그 두 제약을 피하면서도 대기 시간을 겹치게 한다:
 *   1단계 — 각 장면을 "그 차례에만" 포커스를 준 채로 새 탭을 열고 프롬프트
 *           입력·전송까지만 한다. 전송 직후 동시 한도 초과 응답이 왔는지 짧게
 *           확인하고, 걸렸으면 재시도 대상으로 큐에 되돌린다. MAX_CONCURRENT 개가
 *           진행 중이면 하나가 끝날 때까지 기다렸다가 다음 배치를 제출한다.
 *   2단계 — 제출이 끝난 탭들을 순회하며, 완료된 것부터 다운로드한다. 전체
 *           장면 중 가장 늦게 끝나는 것 기준으로 최대 N분(기본 10분) 기다린다.
 *
 * 사용:
 *   node scripts/run-owl-veo-motion-submit-then-collect-v1.mjs \
 *     --scenes s1_hook,s2_loss_aversion,s3_evidence_card,s4_background \
 *     --scene-prompts "scripts/_owl-ep2-veo-scene-prompts.mjs:OWL_EP2_VEO_SCENES" \
 *     --out-dir "C:/tmp/owl-ep2-veo-motion" \
 *     --max-concurrent 2 \
 *     --owner-approved-once
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import {
  activateVideoTool,
  attachRef,
  checkSendEnabled,
  classifyVeoBody,
  detectQuotaOrRefusal,
  ensureChrome,
  typeAndVerify,
  setVerticalMode,
  setModel,
} from "./_gemini-veo-core.mjs";
import { OWL_VEO_SCENES as OWL_VEO_SCENES_EP1 } from "./_owl-veo-scene-prompts.mjs";

if (process.env.ALLOW_GEMINI_VEO !== "1") {
  console.error("ABORT: 차단됨 (fail-closed). 필요한 env: ALLOW_GEMINI_VEO=1");
  process.exit(2);
}
if (!process.argv.includes("--owner-approved-once")) {
  console.error("ABORT: --owner-approved-once 플래그가 필요합니다 (실제 생성·크레딧 소비).");
  process.exit(2);
}

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const scenesArg = getArg("--scenes");
if (!scenesArg) {
  console.error("ABORT: --scenes 가 필요합니다(쉼표 구분).");
  process.exit(2);
}
const SCENE_KEYS = scenesArg.split(",").map((s) => s.trim()).filter(Boolean);

const scenePromptsArg = getArg("--scene-prompts");
const OWL_VEO_SCENES = scenePromptsArg
  ? await (async () => {
      const [modulePath, exportName] = scenePromptsArg.split(":");
      if (!modulePath || !exportName) {
        console.error('ABORT: --scene-prompts 는 "경로:export명" 형식이어야 합니다.');
        process.exit(2);
      }
      const resolved = path.resolve(modulePath);
      if (!fs.existsSync(resolved)) {
        console.error(`ABORT: 프롬프트 모듈을 찾을 수 없습니다: ${resolved}`);
        process.exit(2);
      }
      const mod = await import(pathToFileURL(resolved).href);
      if (!mod[exportName]) {
        console.error(`ABORT: ${resolved} 에 export "${exportName}" 이 없습니다.`);
        process.exit(2);
      }
      return mod[exportName];
    })()
  : OWL_VEO_SCENES_EP1;

const unknown = SCENE_KEYS.filter((s) => !OWL_VEO_SCENES[s]);
if (unknown.length > 0) {
  console.error(`ABORT: 알 수 없는 장면: ${unknown.join(", ")}. 사용 가능: ${Object.keys(OWL_VEO_SCENES).join(", ")}`);
  process.exit(2);
}

const OUT_DIR = getArg("--out-dir") || "C:/tmp/owl-veo-motion";
const COLLECT_TIMEOUT_MIN = Number(getArg("--collect-timeout-min") || "10");
const MODEL = getArg("--model"); // "Pro" | "Flash" | "Flash-Lite" — 생략 시 Gemini 기본값(Pro) 유지
// Gemini 는 계정당 동시 영상 생성 요청을 최대 2개로 제한한다(2026-09-17 실제
// 관찰: "You have 2 video generation requests running right now, which is the
// maximum I can do at one time." 3탭 동시 제출 시 3번째가 거부됨). 그 이상
// 제출해봐야 거부되므로 기본값을 2로 둔다.
const MAX_CONCURRENT = Number(getArg("--max-concurrent") || "2");
fs.mkdirSync(OUT_DIR, { recursive: true });

const PROFILE = {
  cdpPort: 9223,
  userDataDir: "C:/Users/PC/AppData/Local/Google/Chrome/User Data/AI-Gemini-1",
};

function log(message) {
  console.log(`[${new Date().toISOString().slice(11, 19)}][submit-then-collect] ${message}`);
}

async function firstVisible(locator) {
  const count = await locator.count();
  for (let i = 0; i < count; i += 1) {
    const candidate = locator.nth(i);
    if (await candidate.isVisible().catch(() => false)) return candidate;
  }
  return null;
}

async function readStatusText(page) {
  // [role="menu"] 는 제외한다 — 설정/계정 메뉴가 열려 있으면 "사용량 한도" 같은
  // 메뉴 항목 이름이 실제 quota 경고처럼 오판되는 원인이었다(2026-09-16 발견).
  // main 은 응답 영역을 포함하되, 그 안에 떠 있는 메뉴 팝업은 별도로 제외한다.
  const regions = page.locator('[role="dialog"], [role="alert"], [role="status"], [aria-live]');
  const text = [];
  const count = await regions.count();
  for (let i = 0; i < count; i += 1) {
    const region = regions.nth(i);
    if (!(await region.isVisible().catch(() => false))) continue;
    const value = await region.innerText().catch(() => "");
    if (value) text.push(value);
  }

  const mainLocator = page.locator("main").first();
  if (await mainLocator.count() > 0) {
    const mainText = await mainLocator.evaluate((el) => {
      const clone = el.cloneNode(true);
      clone.querySelectorAll('[role="menu"]').forEach((menu) => menu.remove());
      return clone.innerText || "";
    }).catch(() => "");
    if (mainText) text.push(mainText);
  }

  return text.join("\n");
}

await ensureChrome(PROFILE.cdpPort, PROFILE.userDataDir, log);
const browser = await chromium.connectOverCDP(`http://localhost:${PROFILE.cdpPort}`);
const context = browser.contexts()[0];
if (!context) {
  console.error("ABORT: browser_context_missing");
  process.exit(1);
}

const DOWNLOAD_SELECTOR = [
  'button[aria-label*="다운로드"]',
  'button[aria-label*="Download"]',
  'a[download]',
].join(", ");

// sceneKey -> result row(제출 실패/성공 무관하게 채워진다). 배치 루프와 최종
// 수거 루프가 같은 배열을 공유해 상태를 누적한다.
const results = [];
function resultRowFor(sceneKey) {
  let row = results.find((r) => r.scene === sceneKey);
  if (!row) {
    row = { scene: sceneKey, status: "PENDING", failureReason: null, outputVideo: null };
    results.push(row);
  }
  return row;
}

// entry(제출된 탭 하나)의 완료 여부를 한 번 확인한다. 완료돼 다운로드까지
// 끝났으면 true, 아직 진행 중이면 false 를 반환한다. quota/거부/동시한도 등
// 재시도 불가 상태를 만나면 결과를 확정하고 true 를 반환해 슬롯을 반환한다.
async function tryCollectOne(entry) {
  const { sceneKey, page, outputVideo, beforeCounts } = entry;
  const resultRow = resultRowFor(sceneKey);

  // quota/refusal 문구보다 "완료된 영상 응답"을 먼저 확인한다. 실제로 영상은
  // 이미 완성돼 있는데, 같은 페이지 하단에 "다음 요청은 한도 소진으로 지금은
  // 생성할 수 없습니다" 안내가 함께 떠 있는 경우가 있다(2026-09-17 Scene 3
  // 실제 관찰: 완성된 영상 + quota 안내가 한 화면에 공존). 이 순서를 지키지
  // 않으면 이미 완성된 영상을 놓치고 실패로 오판한다.
  const RESPONSE_SELECTORS = Object.keys(beforeCounts || {});
  let newResponse = null;
  for (const selector of RESPONSE_SELECTORS) {
    const afterCount = await page.locator(selector).count();
    if (afterCount > (beforeCounts[selector] ?? 0)) {
      newResponse = page.locator(selector).nth(afterCount - 1);
      break;
    }
  }

  const downloadCandidates = newResponse ? newResponse.locator(DOWNLOAD_SELECTOR) : null;
  const hasDownload = downloadCandidates ? (await downloadCandidates.count()) === 1 : false;

  if (!hasDownload) {
    const state = classifyVeoBody(await readStatusText(page).catch(() => ""));
    if (state?.type === "refusal" || state?.type === "quota") {
      // 오탐 의심 방지용 진단 스크린샷 — 설정 메뉴가 열려 있으면 "사용량 한도"
      // 같은 문구가 메뉴 항목 이름으로 섞여 quota 로 오판될 수 있다(2026-09-16).
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const shotPath = path.join(OUT_DIR, `diag-${state.type}-${sceneKey}-${stamp}.png`);
      await page.screenshot({ path: shotPath }).catch(() => {});
      log(`${sceneKey}: ${state.type} 판정 — 진단 스크린샷: ${shotPath}`);

      resultRow.status = state.type === "refusal" ? "REFUSAL_NO_RETRY" : "POST_SUBMIT_QUOTA";
      resultRow.failureReason = state.text;
      resultRow.diagnosticScreenshot = shotPath;
      if (state.type === "quota") {
        // "9월 17일 오전 10:10에 다시 생성할 수 있습니다" 형태의 재개 시각을
        // 뽑아 로그에 남긴다 — 4~5시간 롤링 한도라 언제 재시도 가능한지가 중요.
        const resumeMatch = state.text.match(/(\d{1,2}월\s*\d{1,2}일\s*(오전|오후)?\s*\d{1,2}:\d{2})/);
        if (resumeMatch) {
          resultRow.resumeAt = resumeMatch[1];
          log(`${sceneKey}: 한도 재개 예정 시각 — ${resumeMatch[1]}`);
        }
      }
      return true;
    }
    return false;
  }

  try {
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30_000 }),
      downloadCandidates.first().click(),
    ]);
    const partialVideo = `${outputVideo}.part`;
    try {
      await download.saveAs(partialVideo);
    } catch {
      // saveAs()가 내부 임시 파일 flush 전에 이동을 시도해 실패하는 사례가
      // 있어, download.path() 로 이미 받아둔 파일을 직접 복사하는 폴백을 쓴다.
      const tempPath = await download.path();
      if (!tempPath) throw new Error("download path unavailable");
      fs.copyFileSync(tempPath, partialVideo);
    }
    fs.renameSync(partialVideo, outputVideo);
    resultRow.status = "DOWNLOADED";
    resultRow.outputVideo = outputVideo;
    log(`${sceneKey}: 저장 완료 → ${outputVideo}`);
    return true;
  } catch (error) {
    log(`${sceneKey}: 다운로드 실패 — ${error?.message ?? error} (다음 순회에서 재시도)`);
    return false;
  }
}

// 한 장면을 제출한다 — 성공하면 { sceneKey, page, outputVideo, beforeCounts, error: null },
// 실패하면 error 사유를 채워 반환한다.
async function submitScene(sceneKey) {
  const SCENE = OWL_VEO_SCENES[sceneKey];
  const outputVideo = path.join(OUT_DIR, SCENE.outputName);
  if (fs.existsSync(outputVideo)) {
    log(`${sceneKey}: 이미 산출물이 있어 건너뜁니다`);
    return null; // 완전히 스킵 — 결과 목록에도 안 남긴다
  }
  if (!fs.existsSync(SCENE.refImage)) {
    log(`${sceneKey}: 참조 이미지 없음(${SCENE.refImage}) — 건너뜁니다`);
    return { sceneKey, page: null, outputVideo, error: "ref_image_missing" };
  }

  log(`${sceneKey}: 제출 시작`);
  const page = await context.newPage();
  await page.bringToFront();

  try {
    await page.goto("https://gemini.google.com/app", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(2_000);

    const url = new URL(page.url());
    const signIn = await firstVisible(page.getByRole("button", { name: /^(로그인|Sign in)$/i }));
    if (/accounts\.google\.com|signin/i.test(url.href) || signIn) {
      log(`${sceneKey}: 로그인이 필요합니다 — 이 탭은 건너뜁니다. 브라우저에서 로그인 후 재실행하세요.`);
      return { sceneKey, page, outputVideo, error: "login_required" };
    }

    const opened = await activateVideoTool(page, log, (m) => console.warn(`[WARN][${sceneKey}] ${m}`));
    if (!opened) {
      log(`${sceneKey}: 동영상 도구를 열지 못했습니다`);
      return { sceneKey, page, outputVideo, error: "video_tool_not_opened" };
    }

    if (MODEL) {
      await setModel(page, MODEL, log, (m) => console.warn(`[WARN][${sceneKey}] ${m}`));
    }

    await setVerticalMode(page, log, (m) => console.warn(`[WARN][${sceneKey}] ${m}`));
    await attachRef(page, SCENE.refImage, log, (m) => console.warn(`[WARN][${sceneKey}] ${m}`));
    await typeAndVerify(page, SCENE.prompt, SCENE.requiredKeywords, log);

    const preSubmitState = await detectQuotaOrRefusal(page);
    if (preSubmitState) {
      log(`${sceneKey}: 전송 전 ${preSubmitState.type} 감지 — 건너뜁니다`);
      return { sceneKey, page, outputVideo, error: `pre_submit_${preSubmitState.type}` };
    }

    const sendEnabled = await checkSendEnabled(page);
    if (!sendEnabled) {
      log(`${sceneKey}: 전송 버튼이 비활성 상태입니다`);
      return { sceneKey, page, outputVideo, error: "send_not_enabled" };
    }

    const RESPONSE_SELECTORS = [
      "main model-response",
      'main [data-test-id^="model-response"]',
      'main [data-testid^="model-response"]',
    ];
    const beforeCounts = {};
    for (const selector of RESPONSE_SELECTORS) beforeCounts[selector] = await page.locator(selector).count();

    const sendBtn = page.locator(
      'button[aria-label="메시지 보내기"], button[aria-label*="전송"], button[aria-label*="Send"]',
    ).first();
    await sendBtn.click();

    // Gemini 는 계정당 동시 생성 2개까지만 허용한다. 전송 직후 짧게 대기한 뒤
    // "동시 개수 초과" 응답이 왔는지 확인한다 — MAX_CONCURRENT 를 지켜도 이전
    // 배치의 탭이 아직 안 끝난 채로 남아있으면(수거 실패 등) 걸릴 수 있다.
    await page.waitForTimeout(2_500);
    const postSubmitState = await detectQuotaOrRefusal(page);
    if (postSubmitState?.type === "concurrency") {
      log(`${sceneKey}: 전송 직후 동시 개수 초과 감지 — 재시도 대상으로 남깁니다: "${postSubmitState.text}"`);
      return { sceneKey, page, outputVideo, error: "concurrency_limit", retryable: true };
    }

    log(`${sceneKey}: 전송 완료 — 이 탭은 백그라운드에서 계속 생성됩니다`);
    return { sceneKey, page, outputVideo, beforeCounts, error: null };
  } catch (error) {
    log(`${sceneKey}: 제출 중 오류 — ${error?.message ?? error}`);
    return { sceneKey, page, outputVideo, error: `submit_exception: ${error?.message ?? error}` };
  }
}

// ── 1단계: 배치 제출 — 한 번에 최대 MAX_CONCURRENT 개만 진행 중 상태를 유지한다 ──────
const submitted = []; // { sceneKey, page, outputVideo, beforeCounts, error }
let inFlight = 0;
const queue = [...SCENE_KEYS];

while (queue.length > 0) {
  const batch = queue.splice(0, Math.max(1, MAX_CONCURRENT - inFlight));
  if (batch.length === 0) break; // 이론상 도달 안 함 — 방어적 탈출

  for (const sceneKey of batch) {
    const entry = await submitScene(sceneKey);
    if (entry === null) continue; // 이미 산출물 있어 스킵
    submitted.push(entry);
    if (!entry.error) inFlight += 1;
    if (entry.retryable) queue.push(sceneKey); // 동시 한도 초과 — 다음 배치에서 재시도
  }

  // inFlight 가 MAX_CONCURRENT 에 도달했고 아직 큐가 남아있으면, 하나가 끝날
  // 때까지 기다린 뒤 다음 배치를 제출한다(2단계 수거 루프가 실제 완료 판정을 한다).
  if (queue.length > 0 && inFlight >= MAX_CONCURRENT) {
    log(`동시 진행 한도(${MAX_CONCURRENT}) 도달 — 하나 이상 완료될 때까지 대기 후 다음 배치 제출`);
    const activeEntries = submitted.filter((s) => !s.error && !s.collected);
    const deadlineForSlot = Date.now() + COLLECT_TIMEOUT_MIN * 60_000;
    while (inFlight >= MAX_CONCURRENT && Date.now() < deadlineForSlot) {
      for (const entry of activeEntries) {
        if (entry.collected) continue;
        const done = await tryCollectOne(entry);
        if (done) {
          entry.collected = true;
          inFlight -= 1;
        }
      }
      if (inFlight >= MAX_CONCURRENT) await new Promise((r) => setTimeout(r, 5_000));
    }
  }
}

const pending = submitted.filter((s) => !s.error);
log(`제출 완료: ${pending.length}/${SCENE_KEYS.length}개 진행 중, ${submitted.length - pending.length}개 제출 실패`);

// 제출 실패 항목의 결과 행을 채운다(성공/재시도 항목은 tryCollectOne 이 채움).
for (const s of submitted) {
  if (!s.error) continue;
  const resultRow = resultRowFor(s.sceneKey);
  resultRow.status = "SUBMIT_FAILED";
  resultRow.failureReason = s.error;
}

// ── 2단계: 배치 루프에서 못다 거둔 나머지를 마저 수거 ────────────────────────────
const deadline = Date.now() + COLLECT_TIMEOUT_MIN * 60_000;
const remaining = new Set(pending.filter((s) => !s.collected).map((s) => s.sceneKey));

while (remaining.size > 0 && Date.now() < deadline) {
  for (const entry of pending) {
    if (!remaining.has(entry.sceneKey)) continue;
    const done = await tryCollectOne(entry);
    if (done) remaining.delete(entry.sceneKey);
  }
  if (remaining.size > 0) await new Promise((r) => setTimeout(r, 5_000));
}

for (const sceneKey of remaining) {
  const resultRow = resultRowFor(sceneKey);
  resultRow.status = "COLLECT_TIMEOUT";
  log(`${sceneKey}: 수거 시간 초과(${COLLECT_TIMEOUT_MIN}분) — 탭은 열어둔 채 종료합니다`);
}

const reportPath = getArg("--report") || path.join(OUT_DIR, "submit-then-collect-report.json");
fs.writeFileSync(
  reportPath,
  JSON.stringify({
    schemaVersion: "owl_veo_submit_then_collect_report_v1",
    scenes: SCENE_KEYS,
    collectTimeoutMin: COLLECT_TIMEOUT_MIN,
    results,
    finishedAt: new Date().toISOString(),
  }, null, 2) + "\n",
  "utf8",
);

log("─".repeat(50));
for (const r of results) log(`  ${r.scene}: ${r.status}${r.failureReason ? ` (${r.failureReason})` : ""}`);
log(`리포트: ${reportPath}`);

const failedCount = results.filter((r) => r.status !== "DOWNLOADED").length;
process.exit(failedCount > 0 ? 1 : 0);
