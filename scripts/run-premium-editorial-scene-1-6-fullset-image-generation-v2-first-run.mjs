/**
 * Scene 1~6 Full-Set Image Generation Runner (v2 pack consumer) — FIRST RUN
 *
 * 목적:
 *   premium-editorial-scene-image-request-pack.v2.json의 generationTargets 6개를
 *   순서대로 소비해 Scene 1~6 이미지를 각 1회 생성한다 (ChatGPT image flow, reference-free).
 *   이번 실행은 최종 확정이 아니라 first run 검증이다.
 *
 * 설계 원칙 (핸드오프 준수):
 *   - scene props / prompt / role / category를 runner에 하드코딩하지 않는다.
 *     모두 v2 pack에서만 읽는다.
 *   - 정확히 Scene 1~6(order 1..6)만 처리한다.
 *   - 각 scene당 이미지 생성 1회만. 실패해도 자동 재시도 없음.
 *   - 품질이 나빠도 자동 재생성/프롬프트 수정 루프 없음.
 *   - 기존 scripts/_chatgpt-image-core.mjs의 안전한 Chrome CDP / Playwright 공용 함수만 재사용.
 *   - output은 repo output/money-shorts/scene-1-6-fullset-first-run-v1/ 아래에만 저장.
 *   - openaiRequestBody payload 저장 금지. 입력 prompt + 결과 경로 정도만 기록.
 *
 * 보안 제약 (anchor-generate와 동일 수준):
 *   - .money-shorts-local 접근 금지 / .env.local 읽기 금지 / piq_diag_out.txt 접근 금지
 *   - Gemini/Veo/OpenAI API 직접 호출 금지
 *   - fetch는 core/browser CDP 통신 + estuary 이미지 회수 용도만
 *
 * 사용:
 *   node scripts/run-premium-editorial-scene-1-6-fullset-image-generation-v2-first-run.mjs [--preflight-only]
 *
 *   --preflight-only: 프롬프트 전송 0회. 로그인/이미지툴/composer/send-enabled 게이트만 확인.
 */

import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import {
  CDP_PORT_GPT1, USER_DATA_GPT1,
  hashText,
  ensureChrome, checkLogin, detectStop,
  typePrompt, checkSendEnabled,
  collectLastAssistantImages, isAssistantDone, interceptRecover,
} from "./_chatgpt-image-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const V2_PACK_PATH = path.join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-scene-image-request-pack.v2.json");
const OUT_DIR_ABS = path.join(REPO_ROOT, "output", "money-shorts", "scene-1-6-fullset-first-run-v1");

const argv = process.argv.slice(2);
const PREFLIGHT_ONLY = argv.includes("--preflight-only");

// --from-scene N: scene order N부터만 생성 (이전 scene은 보존). 기본 1.
function getArg(name) {
  const i = argv.indexOf(name);
  if (i !== -1 && argv[i + 1]) return argv[i + 1];
  return null;
}
const FROM_SCENE = parseInt(getArg("--from-scene") || "1", 10);
if (!Number.isInteger(FROM_SCENE) || FROM_SCENE < 1 || FROM_SCENE > 6) {
  console.error(`ABORT: --from-scene 값은 1~6이어야 함 — 받은 값: ${getArg("--from-scene")}`);
  process.exit(1);
}

// --only-scene N: scene order N만 단독 재생성 (다른 scene은 절대 건드리지 않음).
// retry 파일명(scene-NN-role-retry-MM.png)으로 저장해 기존 first-run 산출물을 덮어쓰지 않는다.
const ONLY_SCENE_RAW = getArg("--only-scene");
const ONLY_SCENE = ONLY_SCENE_RAW !== null ? parseInt(ONLY_SCENE_RAW, 10) : null;
if (ONLY_SCENE_RAW !== null && (!Number.isInteger(ONLY_SCENE) || ONLY_SCENE < 1 || ONLY_SCENE > 6)) {
  console.error(`ABORT: --only-scene 값은 1~6이어야 함 — 받은 값: ${ONLY_SCENE_RAW}`);
  process.exit(1);
}
// --retry-index MM: retry 파일명 suffix (기본 1). only-scene retry 산출물 구분용.
const RETRY_INDEX = parseInt(getArg("--retry-index") || "1", 10);

function ts() { return new Date().toISOString().slice(11, 19); }
function log(m) { console.log(`[${ts()}][fullset-v2] ${m}`); }
function warn(m) { console.warn(`[WARN][fullset-v2] ${m}`); }

// ── v2 pack load + generationTargets 검증 (정확히 Scene 1~6) ─────────────────
const pack = JSON.parse(fs.readFileSync(V2_PACK_PATH, "utf8"));
if (pack.schemaVersion !== "money_shorts_scene_image_request_pack_v2") {
  console.error(`ABORT: v2 pack schemaVersion 불일치 — ${pack.schemaVersion}`);
  process.exit(1);
}
const targets = (pack.generationTargets || []).slice().sort((a, b) => a.sceneOrder - b.sceneOrder);
if (targets.length !== 6) {
  console.error(`ABORT: generationTargets 기대값 6과 불일치 — 실제 ${targets.length}개`);
  process.exit(1);
}
const orders = targets.map(t => t.sceneOrder);
if (JSON.stringify(orders) !== JSON.stringify([1, 2, 3, 4, 5, 6])) {
  console.error(`ABORT: generationTargets order 불일치 — 기대 [1..6], 실제 [${orders.join(",")}]`);
  process.exit(1);
}

// ── fail-closed ChatGPT image allow guard (output write / browser·CDP 전에 반드시 통과) ──
// --preflight-only도 browser/CDP를 실행하므로 예외 없이 guard 대상.
// Owner decision: image_script_allow_guard = add_allow_guard_to_all_paid_image_scripts.
if (process.env.ALLOW_CHATGPT_IMAGE !== "1") {
  console.error("ABORT: ChatGPT image 경로 차단 (fail-closed). 필요한 env: ALLOW_CHATGPT_IMAGE=1 — output write/browser/CDP 전에 중단.");
  process.exit(2);
}

// 실제 생성 대상 결정:
//   --only-scene N이 있으면 그 scene만 단독 생성 (다른 scene 절대 안 건드림).
//   없으면 FROM_SCENE부터 (이전 scene 이미지 보존).
const genTargets = ONLY_SCENE !== null
  ? targets.filter(t => t.sceneOrder === ONLY_SCENE)
  : targets.filter(t => t.sceneOrder >= FROM_SCENE);

fs.mkdirSync(OUT_DIR_ABS, { recursive: true });

// ── scene별 output 파일명: order/id/role 포함 ────────────────────────────────
// only-scene retry 모드면 -retry-NN suffix를 붙여 기존 first-run 산출물을 덮어쓰지 않는다.
function sceneFileName(t) {
  const base = `scene-${String(t.sceneOrder).padStart(2, "0")}-${t.sceneRole}`;
  if (ONLY_SCENE !== null && t.sceneOrder === ONLY_SCENE) {
    return `${base}-retry-${String(RETRY_INDEX).padStart(2, "0")}.png`;
  }
  return `${base}.png`;
}

// ── Scene별 targeted retry 강화 instruction ──────────────────────────────────
// scene props는 v2 pack에서 읽고, 여기서는 "이번 retry에서 더 강하게 억제할 방향"만
// finalPrompt 뒤에 append한다 (scene 정의 자체를 하드코딩하지 않음).
// Scene 2(signal): first-run에서 stock-photo corporate / tablet dashboard / 차트 과다로 실패.
const RETRY_REINFORCEMENT = {
  2: " RETRY REINFORCEMENT (this regeneration must NOT repeat the previous failure): " +
     "Strictly avoid a stock-photo corporate-office look, a consultant / report-review pose, " +
     "a dominant tablet dashboard, multiple printed chart sheets, a chart wall or chart-only scene, " +
     "a glossy fintech advertisement look, and any business-presentation / investor-deck feel. " +
     "Instead: keep an everyday Korean home / living-space tone where a person quietly checks an " +
     "institutional economic signal (bank / official rate context) in a calm, ordinary moment. " +
     "The signal must appear only as a single subtle supporting graphic chip, never as a full dashboard. " +
     "Do not center a person's face. Keep the lower third clear for subtitles. No exact numbers, dates, " +
     "or source labels as trustworthy text. This must read as a calm signal moment distinct from a " +
     "smartphone-notification hook and distinct from a household-cost scene — quiet, lived-in, not corporate.",
};
function buildPromptForTarget(t) {
  let prompt = t.finalPrompt;
  if (ONLY_SCENE !== null && t.sceneOrder === ONLY_SCENE && RETRY_REINFORCEMENT[t.sceneOrder]) {
    prompt += RETRY_REINFORCEMENT[t.sceneOrder];
  }
  return prompt;
}

// ── 이미지 도구 활성화 (현재 ChatGPT UI 대응) ────────────────────────────────
// anchor-generate.activateImageToolCurrentUI와 동일 검증 경로 (core 미수정).
async function activateImageToolCurrentUI(page) {
  const directBtn = page.getByRole("button", { name: /^이미지 만들기$|^Create image$/i }).first();
  if (await directBtn.count() > 0 && await directBtn.isVisible({ timeout: 1200 }).catch(() => false)) {
    await directBtn.click();
    await page.waitForTimeout(1200);
    log("image tool activated ✅ (direct button)");
    return true;
  }
  const plus = page.locator(
    'button[data-testid="composer-plus-btn"], button[aria-label="파일 등 추가"], ' +
    'button[aria-label="파일 추가 및 기타"], button[aria-label*="Add" i]'
  ).first();
  if (await plus.count() === 0) {
    throw new Error("image_tool: composer plus button not found");
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    await plus.click();
    await page.waitForTimeout(1200);
    const menuItem = page.getByText(/이미지 만들기/).filter({ hasNotText: "무엇을" }).first();
    if (await menuItem.count() > 0 && await menuItem.isVisible({ timeout: 1500 }).catch(() => false)) {
      await menuItem.click();
      await page.waitForTimeout(1200);
      log("image tool activated ✅ (plus-menu → 이미지 만들기)");
      return true;
    }
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(600);
  }
  throw new Error("image_tool: '이미지 만들기' menu item not found after plus-menu (3 attempts)");
}

// ── 새 대화 + 이미지 모드 + 프롬프트 입력 (전송 직전까지) ────────────────────
async function prepComposer(ctx, finalPrompt) {
  const page = await ctx.newPage();
  await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(1500);
  if (/auth|login/i.test(page.url())) {
    throw new Error("login_required: ChatGPT 로그인 필요");
  }
  await detectStop(page);
  await activateImageToolCurrentUI(page);

  const ta = page.locator("#prompt-textarea").first();
  const taVisible = await ta.isVisible({ timeout: 8000 }).catch(() => false);
  if (!taVisible) throw new Error("composer: #prompt-textarea not visible");

  await typePrompt(page, finalPrompt, log);

  const sendOk = await checkSendEnabled(page);
  if (!sendOk) throw new Error("send_enabled: send button not found/disabled");
  return page;
}

// ── 이미지 다운로드 (estuary fetch → intercept fallback) ─────────────────────
async function saveGeneratedImage(page, destPath, baselineCids) {
  const imgs = await collectLastAssistantImages(page);
  const fresh = imgs.filter((x) => x.gen && (!x.cid || !baselineCids.has(x.cid)));
  const cand = (fresh.length > 0 ? fresh : imgs.filter((x) => x.gen)).sort((a, b) => (b.w * b.h) - (a.w * a.h))[0];

  if (cand && cand.src) {
    const buf = await page.evaluate(async (u) => {
      try {
        const r = await fetch(u);
        const ab = await r.arrayBuffer();
        return Array.from(new Uint8Array(ab));
      } catch { return null; }
    }, cand.src).catch(() => null);
    if (buf && buf.length > 10000) {
      fs.writeFileSync(destPath, Buffer.from(buf));
      return { ok: true, method: "estuary_fetch", w: cand.w, h: cand.h, bytes: buf.length };
    }
  }

  const convUrl = page.url();
  const intercepted = await interceptRecover(page, convUrl, log);
  let biggest = null;
  for (const [, body] of intercepted) {
    if (!biggest || body.length > biggest.length) biggest = body;
  }
  if (biggest && biggest.length > 10000) {
    fs.writeFileSync(destPath, Buffer.from(biggest));
    return { ok: true, method: "intercept_reload", bytes: biggest.length };
  }
  return { ok: false, method: "none" };
}

// ── 단일 scene 생성 (1회만, 자동 재시도 없음) ────────────────────────────────
async function generateScene(ctx, t) {
  const fileName = sceneFileName(t);
  log(`=== scene ${t.sceneOrder} (${t.sceneRole}) 생성 시작 → ${fileName} ===`);
  const destPath = path.join(OUT_DIR_ABS, fileName);
  const promptText = buildPromptForTarget(t);
  if (promptText !== t.finalPrompt) {
    log(`scene ${t.sceneOrder}: retry reinforcement instruction 적용 (len ${t.finalPrompt.length} → ${promptText.length})`);
  }
  const page = await prepComposer(ctx, promptText);

  const baseImgs = await collectLastAssistantImages(page);
  const baselineCids = new Set(baseImgs.map((x) => x.cid).filter(Boolean));

  const sendBtn = page.locator(
    '#composer-submit-button, button[data-testid="send-button"], ' +
    'button[aria-label="Send message"], button[aria-label="메시지 보내기"]'
  ).first();
  await sendBtn.click();
  log(`scene ${t.sceneOrder} 전송 완료 — 생성 대기 중...`);

  // polling 제한: only-scene retry는 약 150초(75×2s), 일반 모드는 180초(90×2s).
  const maxPolls = ONLY_SCENE !== null ? 75 : 90;
  let done = false;
  for (let i = 0; i < maxPolls; i++) {
    await page.waitForTimeout(2000);
    if (await isAssistantDone(page)) {
      await page.waitForTimeout(3000);
      const imgs = await collectLastAssistantImages(page);
      if (imgs.some((x) => x.gen)) { done = true; break; }
    }
  }
  if (!done) {
    warn(`scene ${t.sceneOrder}: 생성 완료 감지 timeout — intercept fallback 시도`);
  }

  const saveRes = await saveGeneratedImage(page, destPath, baselineCids);
  await page.close().catch(() => {});

  if (!saveRes.ok) {
    throw new Error(`scene ${t.sceneOrder} (${t.sceneRole}): 이미지 저장 실패 (${saveRes.method})`);
  }
  log(`scene ${t.sceneOrder} 저장 ✅ ${destPath} (${saveRes.method}, ${Math.round((saveRes.bytes || 0) / 1024)}KB)`);
  return {
    sceneOrder: t.sceneOrder,
    sceneId: t.sceneId,
    sceneRole: t.sceneRole,
    selectedVisualCategory: t.selectedVisualCategory,
    selectedObjectFamilies: t.selectedObjectFamilies,
    spaceType: t.spaceType,
    cameraDistance: t.cameraDistance,
    destPath,
    save: saveRes,
    promptHash: hashText(t.finalPrompt),
  };
}

// ── summary 작성 (output 폴더에만) ───────────────────────────────────────────
function writeSummary(preflight, generated, fatalError = null) {
  const summary = {
    schemaVersion: "money_shorts_scene_1_6_fullset_first_run_summary_v1",
    taskId: "money-shorts-os-scene-1-6-fullset-image-generation-runner-and-first-run",
    sourcePack: "scripts/fixtures/premium-editorial-scene-image-request-pack.v2.json",
    sourcePackSchemaVersion: pack.schemaVersion,
    createdAt: new Date().toISOString(),
    runType: "first_run_validation_not_final",
    generatedScenes: generated.map((g) => ({
      sceneOrder: g.sceneOrder,
      sceneId: g.sceneId,
      sceneRole: g.sceneRole,
      selectedVisualCategory: g.selectedVisualCategory,
      selectedObjectFamilies: g.selectedObjectFamilies,
      spaceType: g.spaceType,
      cameraDistance: g.cameraDistance,
      imagePath: g.destPath,
      saveMethod: g.save?.method,
      bytes: g.save?.bytes,
      promptHash: g.promptHash,
    })),
    preflightResult: preflight,
    generatedTextInImageIsNotSourceOfTruth: true,
    deterministicOverlayRequired: true,
    ownerReviewRequired: true,
    autoRegenerationPerformed: false,
    mp4Generated: false,
    veoUsed: false,
    notes: [
      "reference-free ChatGPT image generation (no attach), v2 pack finalPrompt consumer.",
      "Scene 1~6 each generated once; no auto retry; no auto prompt-edit loop.",
      "Scene 1/2 are evaluated as NEW generation results, not legacy anchors.",
      "exact value/source/date must be added later via deterministic overlay; image text is not source of truth.",
      "image retrieval via estuary fetch, fallback page.route intercept+reload (no screen automation).",
    ],
    risks: [],
  };
  if (fatalError) summary.risks.push(`fatal: ${fatalError}`);
  // only-scene retry는 first-run-summary.json을 덮어쓰지 않고 별도 retry summary로 저장.
  const summaryName = ONLY_SCENE !== null
    ? `scene-${String(ONLY_SCENE).padStart(2, "0")}-retry-${String(RETRY_INDEX).padStart(2, "0")}-summary.json`
    : "first-run-summary.json";
  const sp = path.join(OUT_DIR_ABS, summaryName);
  fs.writeFileSync(sp, JSON.stringify(summary, null, 2));
  log(`summary: ${sp}`);
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
async function main() {
  log(`=== Scene image generation (v2 pack consumer) ===`);
  log(`v2 pack: ${V2_PACK_PATH}`);
  log(`out-dir: ${OUT_DIR_ABS}`);
  if (ONLY_SCENE !== null) {
    log(`only-scene: ${ONLY_SCENE} retry-${RETRY_INDEX} (다른 scene 절대 미생성, 기존 산출물 보존)`);
  } else {
    log(`from-scene: ${FROM_SCENE} (이전 scene 이미지 보존)`);
  }
  log(`gen targets: ${genTargets.map(t => `${t.sceneId}(${t.sceneRole})`).join(", ")}`);
  log(`mode:    ${PREFLIGHT_ONLY ? "PREFLIGHT_ONLY (send 0)" : `GENERATE (${genTargets.length} images, 1 each)`}`);

  await ensureChrome(CDP_PORT_GPT1, USER_DATA_GPT1, log);
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT_GPT1}`);
  const ctx = browser.contexts()[0];
  if (!ctx) { console.error("ABORT: no browser context"); process.exit(1); }

  // ── PREFLIGHT (전송 0회) ───────────────────────────────────────────────────
  const preflight = { result: null, stages: {} };
  {
    const page = await ctx.newPage();
    try {
      await checkLogin(page, log);
      preflight.stages.login = "pass";
      await detectStop(page);
      preflight.stages.stop_check = "pass";
      await activateImageToolCurrentUI(page);
      preflight.stages.image_tool = "pass";
      const ta = page.locator("#prompt-textarea").first();
      const taVisible = await ta.isVisible({ timeout: 8000 }).catch(() => false);
      preflight.stages.composer = taVisible ? "pass" : "fail";
      if (!taVisible) throw new Error("composer not visible");
      await typePrompt(page, buildPromptForTarget(genTargets[0]), log);
      const sendOk = await checkSendEnabled(page);
      preflight.stages.send_enabled = sendOk ? "pass" : "fail";
      if (!sendOk) throw new Error("send button disabled");
      preflight.result = "PREFLIGHT_PASS";
      const ssPath = path.join(OUT_DIR_ABS, "preflight_pass.png");
      await page.screenshot({ path: ssPath, fullPage: false }).catch(() => {});
      preflight.screenshot = ssPath;
      log(`PREFLIGHT_PASS ✅`);
    } catch (e) {
      preflight.result = "PREFLIGHT_FAIL";
      preflight.error = e.message;
      const ssPath = path.join(OUT_DIR_ABS, "preflight_fail.png");
      await page.screenshot({ path: ssPath, fullPage: false }).catch(() => {});
      preflight.screenshot = ssPath;
      log(`PREFLIGHT_FAIL ❌ — ${e.message}`);
    } finally {
      await page.close().catch(() => {});
    }
  }

  if (preflight.result !== "PREFLIGHT_PASS" || PREFLIGHT_ONLY) {
    writeSummary(preflight, []);
    await browser.close().catch(() => {});
    if (preflight.result !== "PREFLIGHT_PASS") process.exit(1);
    log("preflight-only 모드 — 생성 생략, 종료");
    return;
  }

  // ── 생성 (FROM_SCENE부터 각 1회, 자동 재시도 없음) ─────────────────────────
  const generated = [];
  for (const t of genTargets) {
    try {
      const res = await generateScene(ctx, t);
      generated.push(res);
    } catch (e) {
      warn(`scene ${t.sceneOrder} 실패 — 자동 재시도 없이 멈추고 보고: ${e.message}`);
      writeSummary(preflight, generated, e.message);
      await browser.close().catch(() => {});
      process.exit(1);
    }
  }

  writeSummary(preflight, generated);
  await browser.close().catch(() => {});
  log(`완료 — ${generated.length}/6 scene 생성`);
}

main().catch((e) => {
  console.error("[FATAL][fullset-v2]", e.message);
  process.exit(1);
});
