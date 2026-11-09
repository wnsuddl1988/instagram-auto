/**
 * ChatGPT reference-free anchor 이미지 생성 helper
 *
 * 목적:
 *   reference 이미지 첨부 없이, 텍스트 프롬프트만으로 ChatGPT 이미지 생성을 수행해
 *   ECOS live Yohan Koo 에피소드의 Scene 1/Scene 2 anchor sample을 각 1장씩 생성한다.
 *
 * 설계:
 *   - 기존 scripts/_chatgpt-image-core.mjs 의 안전 로직을 최대한 재사용:
 *     ensureChrome / checkLogin / detectStop / activateImageTool /
 *     typePrompt / checkSendEnabled / collectLastAssistantImages /
 *     isAssistantDone / interceptRecover
 *   - reference attach 단계는 제외 (reference-free)
 *   - 생성 전 baseline 이미지 CID를 수집해 신규 후보만 식별
 *   - 최종 저장: Scene 1 / Scene 2 각 최대 1장
 *   - 모든 산출물은 repo 밖 --out-dir 에만 저장
 *
 * 보안 제약:
 *   - shell:true 없음 (외부 프로세스는 core.ensureChrome 의 chrome spawn 만)
 *   - .money-shorts-local 접근 금지
 *   - .env.local 읽기 금지
 *   - piq_diag_out.txt 접근 금지
 *   - Gemini/Veo/OpenAI API 직접 호출 금지
 *   - fetch 는 기존 core/browser CDP 통신 + estuary 이미지 회수 용도만
 *   - out-dir 은 repo 밖 강제
 *
 * 사용:
 *   node scripts/_chatgpt-image-anchor-generate.mjs \
 *     --scene-set ecos-live-yohan-koo-anchor-sample \
 *     --out-dir C:\tmp\money-shorts-os\visual-anchor-sample-v1 \
 *     [--preflight-only]
 *
 * --preflight-only: 프롬프트 전송 0회. 로그인/이미지툴/composer/send-enabled 게이트만 확인.
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

// ── CLI ─────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
function getArg(name) {
  const i = argv.indexOf(name);
  if (i !== -1 && argv[i + 1]) return argv[i + 1];
  return null;
}
const PREFLIGHT_ONLY = argv.includes("--preflight-only");
const SCENE_SET = getArg("--scene-set") || "ecos-live-yohan-koo-anchor-sample";
const OUT_DIR = getArg("--out-dir");

if (!OUT_DIR) {
  console.error("Usage: node _chatgpt-image-anchor-generate.mjs --scene-set <id> --out-dir <path> [--preflight-only]");
  process.exit(1);
}

const OUT_DIR_ABS = path.resolve(OUT_DIR);

// ── 안전 가드 ────────────────────────────────────────────────────────────────
if (OUT_DIR_ABS.startsWith(REPO_ROOT + "\\") || OUT_DIR_ABS.startsWith(REPO_ROOT + "/")) {
  console.error(`ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out: ${OUT_DIR_ABS}`);
  process.exit(1);
}
if (OUT_DIR_ABS.includes(".money-shorts-local")) {
  console.error("ABORT: .money-shorts-local access forbidden.");
  process.exit(1);
}

// ── fail-closed ChatGPT image allow guard (output write / browser·CDP 전에 반드시 통과) ──
// --preflight-only도 browser/CDP를 실행하므로 예외 없이 guard 대상.
// Owner decision: image_script_allow_guard = add_allow_guard_to_all_paid_image_scripts.
if (process.env.ALLOW_CHATGPT_IMAGE !== "1") {
  console.error("ABORT: ChatGPT image 경로 차단 (fail-closed). 필요한 env: ALLOW_CHATGPT_IMAGE=1 — output write/browser/CDP 전에 중단.");
  process.exit(2);
}

fs.mkdirSync(OUT_DIR_ABS, { recursive: true });

function ts() { return new Date().toISOString().slice(11, 19); }
function log(m) { console.log(`[${ts()}][anchor] ${m}`); }
function warn(m) { console.warn(`[WARN][anchor] ${m}`); }

// ── 이미지 도구 활성화 (현재 ChatGPT UI 대응, core 미수정) ──────────────────
// 현재 UI: composer 아래 "이미지 만들기" 버튼이 직접 노출됨.
// 1순위: 그 직접 버튼 클릭. 2순위: plus 메뉴(data-testid=composer-plus-btn) → 메뉴 항목.
async function activateImageToolCurrentUI(page) {
  // 현재 ChatGPT UI (확인됨): composer plus 버튼(data-testid=composer-plus-btn)을 열면
  // "이미지 만들기 / 무엇이든 시각화하세요" 항목이 뜬다. role=menuitem 이 아니라 텍스트 기반.
  // 이미 활성화된 경우 composer 안에 "이미지 만들기" pill 이 보인다.

  // 직접 버튼이 노출된 변형 UI 우선 시도 (짧게)
  const directBtn = page.getByRole("button", { name: /^이미지 만들기$|^Create image$/i }).first();
  if (await directBtn.count() > 0 && await directBtn.isVisible({ timeout: 1200 }).catch(() => false)) {
    await directBtn.click();
    await page.waitForTimeout(1200);
    log("image tool activated ✅ (direct button)");
    return true;
  }

  // 메인 경로: plus 메뉴 열고 "이미지 만들기" 항목 클릭
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
    // 메뉴 항목: 텍스트 "이미지 만들기" 를 포함하는 클릭 가능한 요소
    const menuItem = page.getByText(/이미지 만들기/).filter({ hasNotText: "무엇을" }).first();
    if (await menuItem.count() > 0 && await menuItem.isVisible({ timeout: 1500 }).catch(() => false)) {
      await menuItem.click();
      await page.waitForTimeout(1200);
      log("image tool activated ✅ (plus-menu → 이미지 만들기)");
      return true;
    }
    // 못 찾으면 메뉴 닫고 재시도
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(600);
  }

  throw new Error("image_tool: '이미지 만들기' menu item not found after plus-menu (3 attempts)");
}

// ── 사실 기준 ────────────────────────────────────────────────────────────────
// 주의: 아래 값은 이미지 분위기/장면 맥락용 참고값일 뿐, 이미지 내부 텍스트는 source of truth 아님.
//   - dataPeriod          : ECOS 월별 데이터 관측 기간
//   - lastPolicyDecisionDate : 기준금리가 2.5%로 마지막 변경된 정책 결정일 (다른 개념)
//   - verifiedPublishedDate 같은 두 개념을 뭉뚱그린 표현은 쓰지 않는다.
const SOURCE_FACT = {
  source: "한국은행 ECOS 722Y001",
  dataPeriod: "202605",
  currentValueText: "2.5%",
  previousDataPeriod: "202604",
  previousValueText: "2.5%",
  direction: "unchanged",
  lastPolicyDecisionDate: "2025-05-29",
  lastPolicyDecisionMeaning: "기준금리가 2.5%로 마지막 변경된 정책 결정일 (ECOS dataPeriod와 구분)",
  noRateDirectionAsserted: true,
};

// ── Scene 프롬프트 ───────────────────────────────────────────────────────────
const FIXED =
  "vertical 9:16, realistic Korean everyday finance scene, face-minimized composition, " +
  "hands and objects centered, premium but not luxury, no exaggerated wealth, no fearmongering, " +
  "no investment promise, keep lower third clear for subtitles, consistent warm-neutral lighting, " +
  "cinematic but natural, high-quality editorial photo style.";

// ── scene-set v1 (기존 동작 보존) ────────────────────────────────────────────
const SCENES_V1 = [
  {
    id: "scene-01-hook-anchor",
    sceneRole: "Scene 1 Hook",
    file: "scene-01-hook-anchor.png",
    prompt:
      `${FIXED} ` +
      "economic signal: checking the current Bank of Korea base rate level; " +
      "scene role: Scene 1 Hook; " +
      "key object: a hand holding a smartphone showing a Korean banking app notification or loan-rate message, " +
      "on a realistic kitchen table or cafe table; " +
      "mood: calm everyday tension, a person quietly checking money-related news; " +
      "overlay: no visible large text, no chart, no data-card.",
  },
  {
    id: "scene-02-signal-anchor",
    sceneRole: "Scene 2 core signal/value",
    file: "scene-02-signal-anchor.png",
    prompt:
      `${FIXED} ` +
      "economic signal: Bank of Korea base rate is 2.5%, unchanged from the previous month; " +
      "scene role: Scene 2 core signal/value; " +
      "key object: a smartphone banking app screen on a desk with a bankbook, receipt, card, " +
      "and household finance notes nearby; " +
      "mood: calm checking and verification; " +
      "overlay: a small supporting visual cue for \"2.5%\" is allowed, but it must not become the main image; " +
      "no hike/cut claim; no dramatic chart.",
  },
];

// ── scene-set v2: 프리미엄 에디토리얼 실사풍 + 고정 금융 그래픽 레이어 ─────────
// 핵심: 순수 스톡사진 금지 / 3D·애니메이션 금지 / data-card 전체화면 금지 /
//       실사 위 보조 금융 그래픽 레이어 필수 / 이미지 내부 숫자·텍스트는 신뢰값 아님.
const SCENES_V2 = [
  {
    id: "scene-01-hook-anchor-v2",
    sceneRole: "Scene 1 Hook v2",
    file: "scene-01-hook-anchor-v2.png",
    prompt:
      "vertical 9:16, premium editorial realistic Korean everyday finance scene, not stock photo, not 3D, " +
      "not animation, face-minimized composition, hands and objects centered, warm-neutral cinematic lighting, " +
      "realistic kitchen table or cafe table, a hand holding a smartphone with a Korean banking app / loan-rate " +
      "notification, coffee cup and small notebook nearby, lower third kept clean for subtitles. " +
      "Add a consistent premium financial graphic layer integrated into the composition: subtle translucent " +
      "overlay panels, small source-label style chip without exact official text, clean line accents, minimal " +
      "numeric UI placeholder elements, modern fintech editorial design. The graphic layer must support the " +
      "image, not dominate it. No exaggerated wealth, no panic, no fearmongering, no investment promise, " +
      "no full-screen data card.",
  },
  {
    id: "scene-02-signal-anchor-v2",
    sceneRole: "Scene 2 Signal v2",
    file: "scene-02-signal-anchor-v2.png",
    prompt:
      "vertical 9:16, premium editorial realistic Korean everyday finance scene, not stock photo, not 3D, " +
      "not animation, face-minimized composition, hands and objects centered, warm-neutral cinematic lighting, " +
      "desk with smartphone banking app, bankbook, receipt, household finance notes, card, and pen, lower third " +
      "kept clean for subtitles. " +
      "Add a consistent premium financial graphic layer over the realistic scene: a compact data chip area " +
      "showing base-rate context, small source-label placeholder area, clean chart-line accent, a " +
      "placeholder-style numeric visual cue area for the base-rate value, but the exact \"2.5%\" text should be " +
      "added later by deterministic overlay, not trusted as image text. The physical desk and smartphone remain " +
      "the main visual. The data chip must be a supporting overlay, not a full-screen card. No hike/cut claim, " +
      "no dramatic chart, no investment promise, no panic.",
  },
];

// ── scene-set scene1-fix-v1: Scene 1 Hook anchor 재생성 (숫자/차트/날짜 제거) ──
// Codex 검토: 기존 Scene 1 v2는 "3.82%"/차트/날짜가 너무 선명해 source-of-truth 오해 위험.
// fix: 정확한 숫자/퍼센트/날짜/차트/공식 출처 텍스트 전면 금지. 스마트폰 화면은 흐릿/추상 알림 느낌만.
//      그래픽 레이어는 숫자/차트가 아니라 브랜드 라인/라벨 자리/placeholder chip 수준만 허용.
const SCENES_SCENE1_FIX = [
  {
    id: "scene-01-hook-anchor-fix-v1",
    sceneRole: "Scene 1 Hook fix v1",
    file: "scene-01-hook-anchor-fix-v1.png",
    prompt:
      "vertical 9:16, premium editorial realistic Korean everyday finance scene, not stock photo, not 3D, " +
      "not animation, face-minimized composition, hands and objects centered, warm-neutral cinematic lighting, " +
      "realistic Korean kitchen table or cafe table, a hand holding a smartphone with a Korean banking app " +
      "notification about checking loan-rate or base-rate related information, coffee cup and small notebook " +
      "nearby, lower third kept clean for subtitles. " +
      "Add a consistent premium financial graphic layer integrated into the composition: subtle translucent " +
      "overlay accents, small source-label placeholder chip without readable official text, clean thin line " +
      "accents, modern fintech editorial design. The graphic layer must support the image, not dominate it. " +
      "Do not show any exact percentage, no specific number, no date, no chart, no graph, no financial value, " +
      "no official source text inside the generated image. Any exact value/source/date will be added later by " +
      "deterministic overlay. No exaggerated wealth, no panic, no fearmongering, no investment promise, " +
      "no full-screen data card.",
  },
];

const SCENE_SET_V2_ID = "ecos-live-yohan-koo-premium-editorial-anchor-sample-v2";
const SCENE_SET_SCENE1_FIX_ID = "ecos-live-yohan-koo-premium-editorial-scene1-anchor-fix-v1";
const IS_SCENE1_FIX = SCENE_SET === SCENE_SET_SCENE1_FIX_ID;
const IS_V2 = SCENE_SET === SCENE_SET_V2_ID || IS_SCENE1_FIX; // fix도 v2 계열 프로필/플래그 적용
const SCENES = IS_SCENE1_FIX ? SCENES_SCENE1_FIX : (SCENE_SET === SCENE_SET_V2_ID ? SCENES_V2 : SCENES_V1);

// ── 새 대화 + 이미지 모드 진입 + 프롬프트 입력 (전송 직전까지) ────────────────
async function prepComposer(ctx, scene) {
  const page = await ctx.newPage();
  await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(1500);

  if (/auth|login/i.test(page.url())) {
    throw new Error("login_required: ChatGPT 로그인 필요");
  }
  await detectStop(page);

  // 이미지 생성 도구 활성화 (reference 첨부 없음, 현재 UI 대응)
  await activateImageToolCurrentUI(page);

  const ta = page.locator("#prompt-textarea").first();
  const taVisible = await ta.isVisible({ timeout: 8000 }).catch(() => false);
  if (!taVisible) throw new Error("composer: #prompt-textarea not visible");

  await typePrompt(page, scene.prompt, log);

  const sendOk = await checkSendEnabled(page);
  if (!sendOk) throw new Error("send_enabled: send button not found/disabled");

  return page;
}

// ── 이미지 다운로드 (estuary/oaiusercontent fetch → intercept fallback) ───────
async function saveGeneratedImage(page, destPath, baselineCids) {
  // 방법 1: 마지막 assistant 응답의 신규 생성 이미지 src 에서 fetch
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

  // 방법 2: page.route intercept + reload (computer-use 금지 정책 준수 방식)
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

// ── 단일 씬 생성 ─────────────────────────────────────────────────────────────
async function generateScene(ctx, scene) {
  log(`=== ${scene.id} 생성 시작 ===`);
  const destPath = path.join(OUT_DIR_ABS, scene.file);
  const page = await prepComposer(ctx, scene);

  // baseline (전송 전 페이지 이미지 CID)
  const baseImgs = await collectLastAssistantImages(page);
  const baselineCids = new Set(baseImgs.map((x) => x.cid).filter(Boolean));

  // 전송
  const sendBtn = page.locator(
    '#composer-submit-button, button[data-testid="send-button"], ' +
    'button[aria-label="Send message"], button[aria-label="메시지 보내기"]'
  ).first();
  await sendBtn.click();
  log(`전송 완료 — 이미지 생성 대기 중...`);

  // 생성 완료 polling (최대 180초)
  let done = false;
  for (let i = 0; i < 90; i++) {
    await page.waitForTimeout(2000);
    if (await isAssistantDone(page)) {
      // 안정화: 생성 직후 src 가 채워질 시간 확보
      await page.waitForTimeout(3000);
      const imgs = await collectLastAssistantImages(page);
      if (imgs.some((x) => x.gen)) { done = true; break; }
    }
  }

  if (!done) {
    warn(`${scene.id}: 생성 완료 감지 timeout — intercept fallback 시도`);
  }

  const saveRes = await saveGeneratedImage(page, destPath, baselineCids);
  await page.close().catch(() => {});

  if (!saveRes.ok) {
    throw new Error(`${scene.id}: 이미지 저장 실패 (${saveRes.method})`);
  }
  log(`${scene.id} 저장 ✅ ${destPath} (${saveRes.method}, ${Math.round((saveRes.bytes || 0) / 1024)}KB)`);
  return { ...scene, destPath, save: saveRes };
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
async function main() {
  log(`=== ChatGPT reference-free anchor generate ===`);
  log(`scene-set: ${SCENE_SET}`);
  log(`out-dir:   ${OUT_DIR_ABS}`);
  log(`mode:      ${PREFLIGHT_ONLY ? "PREFLIGHT_ONLY (send 0)" : `GENERATE (max ${SCENES.length} image${SCENES.length > 1 ? "s" : ""})`}`);

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
      // 프롬프트 입력은 하되 전송하지 않음 (send-enabled 게이트만 확인)
      await typePrompt(page, SCENES[0].prompt, log);
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

  // preflight 실패 또는 preflight-only 모드면 여기서 종료
  if (preflight.result !== "PREFLIGHT_PASS" || PREFLIGHT_ONLY) {
    writeSummary(preflight, []);
    await browser.close().catch(() => {});
    if (preflight.result !== "PREFLIGHT_PASS") process.exit(1);
    log("preflight-only 모드 — 생성 생략, 종료");
    return;
  }

  // ── 생성 (Scene 1/2 각 1장) ────────────────────────────────────────────────
  const generated = [];
  for (const scene of SCENES) {
    try {
      const res = await generateScene(ctx, scene);
      generated.push(res);
    } catch (e) {
      warn(`${scene.id} 실패 — 멈추고 보고: ${e.message}`);
      writeSummary(preflight, generated, e.message);
      await browser.close().catch(() => {});
      process.exit(1);
    }
  }

  writeSummary(preflight, generated);
  await browser.close().catch(() => {});
  log(`완료 — ${generated.length}장 생성`);
}

// ── summary 작성 ─────────────────────────────────────────────────────────────
function writeSummary(preflight, generated, fatalError = null) {
  const visualProfileName = IS_V2
    ? "프리미엄 에디토리얼 생활경제 실사풍 + 고정 금융 그래픽 레이어 (premium editorial life-economy realism with fixed financial graphic layer)"
    : "생활경제 리얼리즘 기반 + 오브젝트 중심 안정화 (life-economy realism with object-stabilized composition)";

  const riskNotes = [
    "ChatGPT-generated text/numbers inside the image are not official facts (not source of truth).",
    "Exact value/source/date/period must be added later through deterministic overlay.",
    "Any visible app text, dates, values, or banking UI labels in the image may be synthetic or inconsistent.",
    "ECOS data period (dataPeriod=202605) and BOK policy decision date (lastPolicyDecisionDate=2025-05-29) are different concepts; do not put the policy decision date inside the image.",
    "No rate hike/cut is asserted; no July 2026 hike mention; no investment promise; no panic.",
  ];

  const summary = {
    schemaVersion: IS_V2
      ? "money_shorts_visual_anchor_sample_summary_v2"
      : "money_shorts_visual_anchor_sample_summary_v1",
    taskId: IS_SCENE1_FIX
      ? "money-shorts-os-premium-editorial-scene1-anchor-fix-v1"
      : (IS_V2
        ? "money-shorts-os-premium-editorial-visual-anchor-sample-v2"
        : "money-shorts-os-ecos-live-yohan-koo-visual-anchor-sample-v1-approval-run"),
    sceneSet: SCENE_SET,
    createdAt: new Date().toISOString(),
    visualProfileName,
    generatedScenes: generated.map((g) => g.id),
    imagePaths: generated.map((g) => g.destPath),
    promptTexts: SCENES.map((s) => ({ id: s.id, sceneRole: s.sceneRole, promptHash: hashText(s.prompt), prompt: s.prompt })),
    sourceFact: SOURCE_FACT,
    generatedTextInImageIsNotSourceOfTruth: true,
    deterministicOverlayRequired: true,
    preflightResult: preflight,
    ownerReviewRequired: true,
    fullSceneExpansionAllowed: false,
    veoUsed: false,
    mp4Generated: false,
    notes: IS_SCENE1_FIX
      ? [
          "reference-free ChatGPT image generation (no attach).",
          "max 1 image: Scene 1 hook fix v1 (regeneration only; Scene 2 v2 is NOT regenerated here).",
          "fix goal: remove exact percentage/number/date/chart/official-source text from the image (previous Scene 1 v2 showed a too-sharp \"3.82%\" + chart).",
          "smartphone screen shows only a blurred/abstract banking-app notification feel; graphic layer is brand line / label placeholder / chip only, NOT numbers or charts.",
          "profile: premium editorial realism with a SUPPORTING financial graphic layer (not pure stock photo, not 3D/animation); not a full-screen data card.",
          "image retrieval via estuary fetch, fallback page.route intercept+reload (no screen automation).",
        ]
      : (IS_V2
      ? [
          "reference-free ChatGPT image generation (no attach).",
          "max 2 images: Scene 1 hook v2 + Scene 2 signal v2.",
          "profile: premium editorial realism with a SUPPORTING financial graphic layer (not pure stock photo, not 3D/animation).",
          "graphic layer is a brand-consistency device; it must NOT become a full-screen data card.",
          "Scene 2 uses a placeholder numeric cue / data chip area only; exact \"2.5%\" is added later by deterministic overlay.",
          "image retrieval via estuary fetch, fallback page.route intercept+reload (no screen automation).",
        ]
      : [
          "reference-free ChatGPT image generation (no attach).",
          "max 2 images: Scene 1 hook + Scene 2 signal.",
          "data-card is NOT main; Scene 2 only allows a small supporting 2.5% cue.",
          "no rate hike/cut asserted; no July 2026 hike mention; no investment promise.",
          "image retrieval via estuary fetch, fallback page.route intercept+reload (no screen automation).",
        ]),
    riskNotes,
    risks: [],
  };
  if (fatalError) summary.risks.push(`fatal: ${fatalError}`);
  const sp = path.join(OUT_DIR_ABS, "visual-anchor-sample-summary.json");
  fs.writeFileSync(sp, JSON.stringify(summary, null, 2));
  log(`summary: ${sp}`);
}

main().catch((e) => {
  console.error("[FATAL][anchor]", e.message);
  process.exit(1);
});
