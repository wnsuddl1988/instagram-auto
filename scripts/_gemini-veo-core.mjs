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
export async function detectQuotaOrRefusal(page) {
  const bodyText = await page.evaluate(() => document.body.innerText || "").catch(() => "");
  const QUOTA_PAT   = ["한도가", "초기화됩니다", "동영상 한도", "video limit", "limit resets", "Try again"];
  const REFUSAL_PAT = ["만들 수 없", "만들어 드릴 수 없", "I can't make", "I cannot create", "unable to create", "can't generate"];
  for (const p of QUOTA_PAT)   if (bodyText.includes(p)) return { type: "quota",   text: p };
  for (const p of REFUSAL_PAT) if (bodyText.includes(p)) return { type: "refusal", text: p };
  return null;
}

// ── Veo compositor 활성화 ─────────────────────────────────────────────────────────
export async function activateVideoTool(page, logFn = console.log, warnFn = console.warn) {
  const toolBtn = page.locator('button[aria-label="업로드 및 도구"]').first();
  if (await toolBtn.count() === 0) { warnFn("Tool button not found"); return false; }
  await toolBtn.click();
  await page.waitForTimeout(1500);

  const quota = await detectQuotaOrRefusal(page);
  if (quota?.type === "quota") throw new Error(`quota_detected: "${quota.text}"`);

  const videoItem = page.getByText("동영상", { exact: false }).first();
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

// ── reference 첨부 ────────────────────────────────────────────────────────────────
export async function attachRef(page, refPath, logFn = console.log, warnFn = console.warn) {
  const toolBtn2 = page.locator('button[aria-label="업로드 및 도구"]').first();
  await toolBtn2.click();
  await page.waitForTimeout(1200);

  const fileItem = page.getByText("파일", { exact: true }).first();
  if (await fileItem.count() === 0) {
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
  await input.click();
  await page.waitForTimeout(400);

  const oneLine = promptText.replace(/\s*\n\s*/g, " ").trim();
  await page.keyboard.type(oneLine, { delay: 3 });
  await page.waitForTimeout(1000);

  // DOM 재확인
  let typed = (await input.textContent().catch(() => "") || "").trim();
  if (typed.length < 10) {
    typed = await page.evaluate(() => {
      const el = document.querySelector(
        'rich-textarea .ql-editor, rich-textarea [contenteditable="true"], [contenteditable="true"]'
      );
      return el ? (el.textContent || el.innerText || "").trim() : "";
    }).catch(() => "");
  }

  if (typed.length < 50) {
    throw new Error(`Prompt DOM verify failed — typed length=${typed.length}`);
  }

  // 키워드 검증
  const kwResults = keywords.map(c => ({ ...c, pass: typed.includes(c.key) }));
  const kwFails   = kwResults.filter(c => !c.pass);
  kwResults.forEach(c => logFn(`  ${c.pass ? "✅" : "❌"} ${c.label}: "${c.key.slice(0, 45)}"`));

  if (kwFails.length > 0) {
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
