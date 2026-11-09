/**
 * Gemini Veo 공용 핵심 모듈
 *
 * 역할: preflight와 실제 submit 실행기가 공유하는 유일한 소스.
 *   - S5 프롬프트 (단일 소스)
 *   - 필수 키워드 목록
 *   - hash 계산
 *   - Chrome CDP 연결·실행
 *   - Veo compositor 진입 (veo_activate)
 *   - 9:16 세로 설정 (setVerticalMode) — locator 재조회로 detach 방지
 *   - reference 첨부 (attachRef)
 *   - 프롬프트 입력 + DOM 검증 (typeAndVerify)
 *   - send enabled 확인 (checkSendEnabled)
 *   - quota/refusal 감지 (detectQuotaOrRefusal)
 *
 * export:
 *   S5_PROMPT          string  — 단일 프롬프트 소스
 *   S5_PROMPT_HASH     string  — S5_PROMPT의 MD5
 *   REQUIRED_KEYWORDS  array   — 키워드 검증 목록
 *   EXPECTED_REF_HASH  string  — kf_s5_boss_hand_finale.png MD5
 *   hashText(s)        string  — 문자열 MD5
 *   hashFile(p)        string  — 파일 MD5
 *   isCDPOpen(port)    bool
 *   ensureChrome(port, userDataDir)
 *   activateVideoTool(page)    bool
 *   setVerticalMode(page)      bool
 *   attachRef(page, refPath)   { thumbnails }
 *   typeAndVerify(page, prompt) { typedLen }
 *   checkSendEnabled(page)     bool
 *   detectQuotaOrRefusal(page) { type, text } | null
 */

import { spawn }  from "child_process";
import fs         from "fs";
import crypto     from "crypto";

// ── S5 프롬프트 (단일 소스) ──────────────────────────────────────────────────────
export const S5_PROMPT = `Animate this 3D scene. Keep the copy room, copier, and Jun exactly as in the reference image. Continuous medium-wide shot — do NOT cut. Camera stays stable throughout.

STARTING STATE (as in reference):
Two separate hands are visible. This distinction is critical:

JUN'S HANDS (HAND A): Jun stands slumped beside the copier, head bowed. Both his hands hang loosely at his sides throughout the entire video. Jun's hands do NOT touch, hold, or move toward any paper at any point.

BOSS'S HAND (HAND B): A suit-sleeved hand with a short partial forearm is already visible at the extreme right edge of the frame. This belongs to an unseen person standing completely off-screen to the right. It is NOT connected to Jun's body. The boss's hand already holds exactly one sheet of paper.

ACTION SEQUENCE:
1. The boss's suited hand (HAND B) holds the sheet still for one to two seconds.
2. The boss's suited hand (HAND B) slowly and smoothly retreats back out through the right edge of the frame, taking the sheet with it.
3. Jun (HAND A) remains slumped throughout — both his hands at his sides, no reaction, no movement.
4. The paper pile on the floor and tray stays unchanged. Copier is quiet.
5. Scene ends with Jun alone, still slumped, both his hands at his sides.

BOSS RULE — ABSOLUTE:
Only the already-visible suit-sleeved hand and short forearm (HAND B) may appear. The boss's body remains completely outside the frame at all times.
NEVER reveal or generate: face, head, hair, neck, shoulder, chest, torso, silhouette, shadow, or reflection of the boss.
The camera must NOT pan, zoom out, or widen toward the right edge.

HAND SEPARATION — CRITICAL:
The suited hand at the right edge (HAND B) is NOT Jun's hand. Keep a clearly visible spatial gap between Jun's body and the suited forearm. Jun never picks up, touches, or holds any paper for the entire duration.

ADDITIONAL RULES:
- No paper explosion or additional printing
- No new person, hand, or arm entering the frame
- No text, subtitle, or logo
- No white shirt (Jun wears light-blue shirt, red tie, navy slacks)
- Jun's brown crossbody messenger bag must remain visible — strap crossing torso, bag at right hip
- Silent, 9:16 vertical format`;

// ── 프롬프트 hash (로드 시점에 계산, 변경 즉시 감지 가능) ─────────────────────────
export const S5_PROMPT_HASH = crypto.createHash("md5").update(S5_PROMPT).digest("hex");

// ── 필수 키워드 목록 (preflight·s5-final 공유) ────────────────────────────────────
export const REQUIRED_KEYWORDS = [
  { key: "HAND A",                               label: "준 손 레이블" },
  { key: "HAND B",                               label: "상사 손 레이블" },
  { key: "Jun never picks up",                   label: "준 종이 미접촉" },
  { key: "NOT connected to Jun",                 label: "신체 연결 분리" },
  { key: "NEVER reveal or generate",             label: "BOSS RULE" },
  { key: "camera must NOT pan",                  label: "카메라 고정" },
  { key: "brown crossbody messenger bag",        label: "가방 연속성" },
  { key: "already holds exactly one sheet",      label: "종이 1장 시작 상태" },
  { key: "slowly and smoothly retreats",         label: "상사 손 퇴장" },
  { key: "both his hands at his sides",          label: "준 양손 결말" },
];

// ── reference 파일 hash (변경 시 PREFLIGHT_STALE 트리거) ─────────────────────────
export const EXPECTED_REF_HASH = "141b348a370374fbe0750fee67a32770";

// ── 유틸 ─────────────────────────────────────────────────────────────────────────
export function hashText(s) {
  return crypto.createHash("md5").update(s).digest("hex");
}

export function hashFile(p) {
  if (!fs.existsSync(p)) return null;
  return crypto.createHash("md5").update(fs.readFileSync(p)).digest("hex");
}

// ── Chrome CDP ────────────────────────────────────────────────────────────────────
export async function isCDPOpen(port) {
  try {
    const r = await fetch(`http://localhost:${port}/json/version`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch { return false; }
}

export async function ensureChrome(port, userDataDir, logFn = console.log) {
  // ── fail-closed 내부 guard: Gemini/Veo browser 경로는 ALLOW_GEMINI_VEO=1 없이는 실행 불가 ──
  // caller(top-level guard 보유 runner)와 무관하게 helper 단에서 이중 차단한다.
  // ALLOW_GEMINI_VEO=1은 local fail-closed 스위치일 뿐, Gemini/Veo 실행 승인이 아니다 (no-live 기본).
  if (process.env.ALLOW_GEMINI_VEO !== "1") {
    throw new Error("ABORT: Gemini/Veo 경로 차단 (fail-closed). 필요한 env: ALLOW_GEMINI_VEO=1 — Chrome launch/CDP probe 전에 중단.");
  }
  if (await isCDPOpen(port)) {
    logFn(`Chrome CDP already open on port ${port}`);
    return;
  }
  const CHROME_EXE = "C:/Program Files/Google/Chrome/Application/chrome.exe";
  logFn(`Launching Chrome on port ${port} (${userDataDir})...`);
  const p = spawn(CHROME_EXE, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "--no-first-run", "--no-default-browser-check",
    "https://gemini.google.com/"
  ], { detached: true, stdio: "ignore" });
  p.unref();
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await isCDPOpen(port)) {
      logFn(`Chrome launched (PID=${p.pid})`);
      return;
    }
  }
  throw new Error(`CDP not available after 20s on port ${port}`);
}

// ── quota / refusal 감지 ──────────────────────────────────────────────────────────
// 정규식 기반 한/영 quota·refusal 감지. 반환값은 기존 호출부 호환을 위해
// { type, text } 를 유지하고, 디버깅용으로 { pattern, snippet } 을 추가한다.
// false positive 방지를 위해 "생성"/"만들기" 같은 일반 단어 단독 매칭은 쓰지 않는다.
// "사용량 한도" 자체는 설정 메뉴의 항목 이름으로도 흔히 쓰이므로(예: 계정
// 메뉴의 "Gemini 사용량 한도" 링크) 단독 매칭하지 않는다. 실제 경고는 항상
// 초과/도달/소진 같은 서술어와 함께 나타나므로 그 문맥을 요구한다.
// "한도...초기화/재설정"만으로는 매칭하지 않는다 — 설정 메뉴의 "사용량 한도"
// 패널은 소진 여부와 무관하게 항상 "N% 사용됨, ~에 초기화"라는 정상 안내
// 문구를 갖고 있어(2026-09-17 실측, 실제 사용량 0~9%인데도 매칭됨) 이
// 패턴 단독으로는 오탐이 발생한다. "초과/도달/소진" 같은 명확한 소진
// 서술어와 결합됐을 때만 quota로 판정한다.
const VEO_QUOTA_PAT = [
  /동영상.{0,12}한도.{0,10}(초과|도달|소진)/,
  /video.{0,12}limit.{0,10}(exceeded|reached)/i, /limit.{0,20}(exceeded|exhausted).{0,20}resets?/i,
  /quota.{0,20}(exceeded|exhausted)/i,
  /사용량.{0,6}(이|가)?.{0,4}(초과|한도를?\s*(초과|도달))/,
  // 4~5시간 롤링 한도 소진 시 실제 문구(2026-09-17 실측): "지금은 동영상을
  // 생성할 수 없습니다. 9월 17일 오전 10:10에 동영상을 다시 생성할 수
  // 있습니다." — "~시에 다시 생성할 수 있습니다" 라는 재개 시각 안내가 핵심
  // 단서이며, 이게 없으면 VEO_REFUSAL_PAT 의 "생성할 수 없" 에 걸려 영구
  // 거부(정책 위반)로 오분류된다. quota 검사가 refusal 보다 먼저 실행되므로
  // 이 패턴을 quota 쪽에 두면 오분류를 막는다.
  /지금은 동영상을 생성할 수 없습니다/, /다시 생성할 수 있습니다/,
  /you (can|will be able to) (create|generate) (a )?video again/i,
];
const VEO_TRANSIENT_PAT = [
  /try again later/i, /잠시 후 다시/, /일시적인 오류/,
  /temporary error/i, /something went wrong/i, /문제가 발생/,
];
// 동시 생성 개수 제한(영구 quota 와 달리 하나가 끝나면 바로 재시도 가능) —
// 2026-09-17 실제로 "You have 2 video generation requests running right now,
// which is the maximum I can do at one time." 문구로 관찰됨(3탭 동시 제출 시).
const VEO_CONCURRENCY_PAT = [
  /video generation requests running.{0,20}maximum/i,
  /동영상 생성.{0,10}(요청|작업).{0,20}(최대|동시)/,
  /최대.{0,10}(동시에|한 번에).{0,10}(진행|생성)/,
];
const VEO_REFUSAL_PAT = [
  // 한국어
  /만들 수 없/, /만들어 드릴 수 없/, /생성할 수 없/, /생성해 드릴 수 없/,
  /처리할 수 없/, /도와드릴 수 없/, /제공할 수 없/, /지원하지 않/,
  /정책에 위반/, /정책을 위반/, /policy를 위반/i, /안전 가이드라인/, /콘텐츠 정책/,
  // 영어
  /can'?t (make|create|generate|help|assist)/i,
  /cannot (make|create|generate|help|assist)/i,
  /(unable|not able) to (create|generate|help|make)/i,
  /won'?t be able to/i,
  /violates? (our )?(policy|policies|guidelines)/i,
  /against (our )?(policy|guidelines)/i,
];

// baselineText에 이미 있던 줄(사이드바 과거 채팅 제목 등)을 제외하고 새로
// 나타난 줄만 남긴다. classifyVeoBody와 detectQuotaOrRefusal이 공유한다.
export function stripBaselineLines(text, baselineText) {
  if (!baselineText) return text;
  const seen = new Set(baselineText.split("\n").map((s) => s.trim()).filter(Boolean));
  return text.split("\n").map((s) => s.trim()).filter((s) => s && !seen.has(s)).join("\n");
}

// bodyText 를 받아 상태를 분류하는 순수 함수. (테스트 용이성 위해 분리)
// baselineText를 넘기면 stripBaselineLines로 먼저 걸러낸 뒤 분류한다.
export function classifyVeoBody(bodyText, baselineText = "") {
  const text = stripBaselineLines(bodyText || "", baselineText);
  const snippet = (re) => {
    const m = text.match(re);
    if (!m) return null;
    const i = Math.max(0, m.index - 30);
    return text.slice(i, m.index + m[0].length + 40).replace(/\s+/g, " ").trim();
  };
  for (const re of VEO_QUOTA_PAT)
    if (re.test(text)) { const s = snippet(re); return { type: "quota",   text: s, pattern: re.source, snippet: s }; }
  for (const re of VEO_CONCURRENCY_PAT)
    if (re.test(text)) { const s = snippet(re); return { type: "concurrency", text: s, pattern: re.source, snippet: s }; }
  for (const re of VEO_TRANSIENT_PAT)
    if (re.test(text)) { const s = snippet(re); return { type: "transient", text: s, pattern: re.source, snippet: s }; }
  for (const re of VEO_REFUSAL_PAT)
    if (re.test(text)) { const s = snippet(re); return { type: "refusal", text: s, pattern: re.source, snippet: s }; }
  return null;
}

// baselineText가 주어지면, 그 문자열에 이미 등장하는 quota/refusal 문구는
// "이 세션 시작 전부터 화면에 있던 것"으로 보고 무시한다. 사이드바(최근 채팅
// 목록)에 과거 세션에서 한도에 걸렸던 대화 제목("Video Generation Limit
// Reached" 등)이 그대로 남아있으면, document.body.innerText 전체 스캔이
// 그 과거 제목을 지금 막 제출한 요청의 결과로 오판한다(2026-09-17, 3편
// 씬1에서 재현 — 실제로는 정상 생성 중이었음, Owner가 화면으로 직접 확인).
// 제출 직전에 한 번 captureQuotaBaseline으로 현재 페이지 텍스트를 찍어두고,
// 그 이후의 모든 quota 체크에 baselineText로 넘기면 새로 나타난 문구만
// 걸러낼 수 있다.
export async function captureQuotaBaseline(page) {
  return await page.evaluate(() => document.body.innerText || "").catch(() => "");
}

export async function detectQuotaOrRefusal(page, baselineText = "") {
  const bodyText = await page.evaluate(() => document.body.innerText || "").catch(() => "");
  return classifyVeoBody(bodyText, baselineText);
}

// ── Veo compositor 활성화 ─────────────────────────────────────────────────────────
// baselineText: captureQuotaBaseline으로 세션 시작 시 찍어둔 스냅샷. 넘기면
// detectQuotaOrRefusal이 baseline에 이미 있던 줄(사이드바 과거 채팅 제목 등)은
// 무시하고 새로 나타난 텍스트만 검사한다 — 오탐의 근본 원인을 없앤다
// (2026-09-17 관찰, Owner가 화면으로 정상 생성 중임을 직접 확인해 발견).
// skipQuotaCheck: baseline을 못 구했거나(구버전 호출부) 그래도 오탐이 남을 때
// 쓰는 마지막 수단 — quota로 보여도 완전히 무시한다. 이 경우도 제출 자체가
// 실제로 거부되면 이후 폴링 단계에서 별도로 감지된다.
export async function activateVideoTool(page, logFn = console.log, warnFn = console.warn, skipQuotaCheck = false, baselineText = "") {
  // 메뉴가 이미 열려 있는 잔여 상태(이전 실패 시도 등)를 먼저 닫는다 — 열린 메뉴가
  // 뒤 버튼을 가려 isVisible() 판정을 그르치는 원인이었다(2026-09-17 관찰).
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(300);

  // 이미 "동영상 만들기" 모드가 선택된 상태(입력창 옆에 "동영상" 칩이 보임)일 수
  // 있다 — 탭을 재사용했거나 이전 시도의 잔여 상태. 그 경우 메뉴를 다시 열 필요가
  // 없다.
  const alreadyActive = await page.locator(
    'button[aria-label*="가로 모드"], button[aria-label*="16:9"], button[aria-label*="세로 모드"]'
  ).first().isVisible().catch(() => false);
  if (alreadyActive) {
    logFn("Veo compositor already active ✅ (재사용)");
    return true;
  }

  const toolBtn = page.locator('button[aria-label="업로드 및 도구"]').first();
  if (await toolBtn.count() === 0) { warnFn("Tool button not found"); return false; }
  await toolBtn.click();
  await page.waitForTimeout(1500);

  const quota = await detectQuotaOrRefusal(page, baselineText);
  if (quota?.type === "quota" && !skipQuotaCheck) throw new Error(`quota_detected: "${quota.text}"`);
  if (quota?.type === "quota" && skipQuotaCheck) {
    warnFn(`quota_detected 무시(skipQuotaCheck): "${quota.text}"`);
  }

  // "동영상 만들기" 는 role="menuitem" 이 아니라 role="menuitemcheckbox" 인
  // <button> 이다(도구 전환 그룹은 체크 가능한 토글 항목 — 2026-09-17 DOM 진단으로
  // 확인). getByText 부분 매치는 사이드바/tooltip 의 다른 "동영상" 텍스트에 잘못
  // 걸릴 수 있어(실제 발생: role="tooltip") role 기반으로 좁혀 찾는다.
  // 문구가 "동영상 만들기"에서 "동영상 아이디어 실현하기"로 바뀐 적이 있다
  // (2026-09-18, Gemini UI 업데이트로 추정 — 새로 생성한 프로필에서 재현,
  // 정확 매치가 전부 실패해 "동영상 만들기" 버튼을 못 찾는 것처럼 보였다).
  // 두 문구 모두, 그리고 향후 재문구화도 커버하도록 "동영상"으로 시작하는
  // 항목을 찾는다.
  let videoItem = page.locator('[role="menuitemcheckbox"]').filter({ hasText: "동영상 만들기" }).first();
  if (await videoItem.count() === 0) {
    videoItem = page.getByText(/^동영상\s*만들기$/).first();
  }
  if (await videoItem.count() === 0) {
    videoItem = page.locator('[role="menuitemcheckbox"]').filter({ hasText: /^동영상/ }).first();
  }
  if (await videoItem.count() === 0) {
    videoItem = page.getByText(/^동영상/).first();
  }
  if (await videoItem.count() === 0) {
    warnFn("Video menu item not found");
    await page.keyboard.press("Escape");
    return false;
  }
  await videoItem.click();
  await page.waitForTimeout(2500);

  const tryBtn = page.getByRole("button").filter({ hasText: /사용해 보기|Try it|Got it/i }).first();
  if (await tryBtn.count() > 0) {
    await tryBtn.click();
    await page.waitForTimeout(800);
    logFn("Intro dialog dismissed");
  }

  // Veo compositor DOM 진입 확인
  const aspectBtnCheck = page.locator(
    'button[aria-label*="가로 모드"], button[aria-label*="16:9"], button[aria-label*="aspect"], button[aria-label*="세로 모드"]'
  ).first();
  const aspectExists = await aspectBtnCheck.count() > 0;
  if (!aspectExists) {
    throw new Error("Veo compositor not entered — aspect ratio button absent after 동영상 click");
  }
  logFn("Veo compositor active ✅");
  return true;
}

// ── 9:16 세로 모드 설정 ──────────────────────────────────────────────────────────
export async function setVerticalMode(page, logFn = console.log, warnFn = console.warn) {
  const anyAspectBtn = page.locator(
    'button[aria-label*="세로 모드"], button[aria-label*="가로 모드"], button[aria-label*="9:16"], button[aria-label*="16:9"]'
  ).first();
  const currentAria = await anyAspectBtn.getAttribute("aria-label").catch(() => "");
  const alreadyVertical = /세로|9:16/i.test(currentAria) && !/가로|16:9/.test(currentAria);

  if (alreadyVertical) {
    logFn(`Vertical 9:16 already set (aria="${currentAria}") ✅`);
    return true;
  }

  const horizBtn = page.locator('button[aria-label*="가로 모드"], button[aria-label*="16:9"]').first();
  if (await horizBtn.count() === 0) {
    warnFn(`Aspect ratio button not found — aria="${currentAria}"`);
    return false;
  }
  await horizBtn.click();
  await page.waitForTimeout(1200);

  const vertByText = page.getByText("세로 모드(9:16)").first();
  const vertByRole = page.getByRole("menuitem").filter({ hasText: /세로|9:16|Portrait/i }).first();
  const vertItem   = (await vertByText.count() > 0) ? vertByText : vertByRole;

  if (await vertItem.count() === 0) {
    warnFn("세로 모드(9:16) menu item not found after aspect click");
    await page.keyboard.press("Escape");
    return false;
  }
  await vertItem.click();
  await page.waitForTimeout(1000);

  // 새 locator로 재조회 — 기존 locator는 aria 변경으로 detach됨
  const newAspectBtn = page.locator('button[aria-label*="세로 모드"], button[aria-label*="9:16"]').first();
  const newAria = await newAspectBtn.getAttribute("aria-label").catch(() => "");
  if (!/세로|9:16/i.test(newAria)) {
    warnFn(`9:16 mode not confirmed — new aria="${newAria}"`);
    return false;
  }
  logFn(`Vertical 9:16 set ✅ (aria="${newAria}")`);
  return true;
}

// ── 모델 전환 (Pro / Flash / Flash-Lite) ────────────────────────────────────────
export async function setModel(page, modelLabel, logFn = console.log, warnFn = console.warn) {
  const modelBtn = page.getByText(new RegExp(`^(Pro|Flash|Flash-Lite)$`)).first();
  if (await modelBtn.count() === 0) {
    warnFn("Model selector button not found");
    return false;
  }
  const currentLabel = (await modelBtn.textContent().catch(() => "") || "").trim();
  if (currentLabel === modelLabel) {
    logFn(`Model already set to ${modelLabel} ✅`);
    return true;
  }

  await modelBtn.click();
  await page.waitForTimeout(800);

  const item = page.locator('[role="menuitem"]').filter({ hasText: modelLabel }).first();
  if (await item.count() === 0) {
    warnFn(`Model menu item not found: ${modelLabel}`);
    await page.keyboard.press("Escape");
    return false;
  }
  await item.click();
  await page.waitForTimeout(1000);

  const confirmBtn = page.getByText(new RegExp(`^${modelLabel}$`)).first();
  const confirmed = await confirmBtn.count() > 0;
  if (!confirmed) {
    warnFn(`Model switch not confirmed — expected "${modelLabel}"`);
    return false;
  }
  logFn(`Model set to ${modelLabel} ✅`);
  return true;
}

// ── reference 첨부 ────────────────────────────────────────────────────────────────
export async function attachRef(page, refPath, logFn = console.log, warnFn = console.warn) {
  const toolBtn2 = page.locator('button[aria-label="업로드 및 도구"]').first();
  await toolBtn2.click();
  await page.waitForTimeout(1200);

  // 텍스트 라벨("파일" / "파일 업로드")은 두 번이나 바뀐 전례가 있어(2026-09-16)
  // 안정적인 data-test-id 로 찾는다. 텍스트 매칭은 폴백으로만 남긴다.
  let fileItem = page.locator('[data-test-id="uploader-images-files-button-advanced"]').first();
  if (await fileItem.count() === 0) {
    fileItem = page.getByText(/^파일\s*(업로드)?$/).first();
  }
  if (await fileItem.count() === 0) {
    // 진단: 메뉴가 실제로 뭘 보여주고 있는지 남긴다. UI 가 바뀌었다면
    // 여기서 실제 메뉴 항목 이름을 확인할 수 있다.
    try {
      const menuItems = await page.evaluate(() =>
        Array.from(document.querySelectorAll('[role="menuitem"], [role="menu"] *'))
          .map((el) => el.textContent?.trim())
          .filter(Boolean)
          .slice(0, 30),
      );
      warnFn(`메뉴 항목 진단: ${JSON.stringify(menuItems)}`);
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const shotPath = `C:/tmp/owl-veo-motion/diag-attachref-${stamp}.png`;
      await page.screenshot({ path: shotPath }).catch(() => {});
      warnFn(`스크린샷 저장: ${shotPath}`);
    } catch {
      // 진단 자체 실패는 무시 — 원래 에러를 그대로 던진다.
    }
    throw new Error("파일 menu item not found in tool menu");
  }

  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser", { timeout: 6000 }).catch(() => null),
    fileItem.click(),
  ]);
  if (!fileChooser) {
    throw new Error("File chooser did not open");
  }
  await fileChooser.setFiles(refPath);
  await page.waitForTimeout(2500);

  const thumbs = await page.evaluate(() =>
    Array.from(document.querySelectorAll("img[src*='blob'], img[src*='data:']")).map(el => el.src?.slice(0, 60))
  );
  if (thumbs.length === 0) {
    throw new Error("No thumbnail after file attach — image may not be accepted");
  }
  logFn(`Reference attached ✅ (thumbnails=${thumbs.length})`);
  return { thumbnails: thumbs.length };
}

// ── 프롬프트 입력 + DOM 검증 ──────────────────────────────────────────────────────
export async function typeAndVerify(page, promptText, keywords = REQUIRED_KEYWORDS, logFn = console.log) {
  const ta   = page.locator('rich-textarea .ql-editor, rich-textarea [contenteditable="true"]').first();
  const taFb = page.locator('[contenteditable="true"]').first();
  const input = (await ta.count() > 0) ? ta : taFb;

  await input.waitFor({ state: "visible", timeout: 15000 });

  const oneLine = promptText.replace(/\s*\n\s*/g, " ").trim();

  async function readTyped() {
    let value = (await input.textContent().catch(() => "") || "").trim();
    if (value.length < 10) {
      value = await page.evaluate(() => {
        const el = document.querySelector(
          'rich-textarea .ql-editor, rich-textarea [contenteditable="true"], [contenteditable="true"]'
        );
        return el ? (el.textContent || el.innerText || "").trim() : "";
      }).catch(() => "");
    }
    return value;
  }

  // page.keyboard.type() 은 ~2000자 분량에서 간헐적으로 중간 구간이 누락되는
  // 현상이 관찰됨(2026-09-16/17, 재현성 낮음 — Quill 에디터의 자동완성/제안
  // 팝업 간섭 추정). insertText 로 한 번에 넣는 방식이 키 입력 유실 경로 자체를
  // 없애므로 1차로 시도하고, 실패 시(길이 부족) type() 로 최대 2회 재시도한다.
  let typed = "";
  const attempts = [
    async () => {
      await input.click();
      await page.waitForTimeout(300);
      await input.evaluate((el) => { el.textContent = ""; });
      await page.keyboard.insertText(oneLine);
    },
    async () => {
      await input.click();
      await page.keyboard.press("Control+A");
      await page.keyboard.press("Delete");
      await page.waitForTimeout(200);
      await page.keyboard.type(oneLine, { delay: 3 });
    },
    async () => {
      await input.click();
      await page.keyboard.press("Control+A");
      await page.keyboard.press("Delete");
      await page.waitForTimeout(200);
      await page.keyboard.type(oneLine, { delay: 8 });
    },
  ];

  for (let i = 0; i < attempts.length; i += 1) {
    await attempts[i]();
    await page.waitForTimeout(1000);
    typed = await readTyped();
    const kwFails = keywords.filter((c) => !typed.includes(c.key));
    if (typed.length >= promptText.length - 30 && kwFails.length === 0) break;
    if (i < attempts.length - 1) {
      logFn(`  재시도 ${i + 1}/${attempts.length - 1}: typed.length=${typed.length} (기대 ${promptText.length}) — 입력 방식 전환`);
    }
  }

  if (typed.length < 50) {
    throw new Error(`Prompt DOM verify failed — typed length=${typed.length}`);
  }

  // 키워드 검증
  const kwResults = keywords.map(c => ({ ...c, pass: typed.includes(c.key) }));
  const kwFails   = kwResults.filter(c => !c.pass);
  kwResults.forEach(c => logFn(`  ${c.pass ? "✅" : "❌"} ${c.label}: "${c.key.slice(0, 45)}"`));

  if (kwFails.length > 0) {
    // 진단: 실제 타이핑된 텍스트 길이와 끝부분을 남긴다. 전체를 로그에 쓰지
    // 않는 이유는 프롬프트가 길어서다 — 끝부분만 봐도 중간에 끊겼는지 알 수 있다.
    logFn(`  진단: typed.length=${typed.length}, promptText.length=${promptText.length}`);
    logFn(`  진단: typed 끝부분(마지막 120자): "${typed.slice(-120)}"`);
    throw new Error(`Keyword check failed: ${kwFails.map(c => c.label).join(", ")}`);
  }
  logFn(`Prompt verified ✅ (len=${typed.length}, kw=${kwResults.length}/${kwResults.length})`);
  return { typedLen: typed.length };
}

// ── send enabled 확인 ─────────────────────────────────────────────────────────────
export async function checkSendEnabled(page) {
  const sendBtn = page.locator(
    'button[aria-label="메시지 보내기"], button[aria-label*="전송"], button[aria-label*="Send"]'
  ).first();
  if (await sendBtn.count() === 0) return false;
  return sendBtn.isEnabled().catch(() => false);
}
