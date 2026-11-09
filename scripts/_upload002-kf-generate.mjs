/**
 * upload_002_copier 키프레임 5장 자동 생성
 * - Playwright CDP (chatgpt.com, GPT-1 프로필)
 * - S1: jun_reference_final.png 첨부 + 프롬프트
 * - S2~S5: 직전 통과 키프레임을 reference로 첨부 (연속성 유지)
 * - 씬당 정확히 1회 생성, 자동 재시도 금지
 * - 실패 시 파일 보존 후 이유 보고 후 종료
 *
 * 저장: output/v2/3d_sitcom_prod_v1/upload_002_copier/keyframes/
 * 사용: node scripts/_upload002-kf-generate.mjs [--dry-run] [--scene N]
 *   --scene N : 특정 씬만 실행 (1~5)
 *   --dry-run : CDP 연결 + 입력창 확인까지만 (생성 0회)
 */

import { chromium } from "playwright";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const CDP_PORT   = 9222;
const CHROME_EXE = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const USER_DATA  = "C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\User Data\\AI-GPT-1";
const DL_DIR     = "C:\\Users\\PC\\Downloads\\AI-Images\\GPT-1";
const KF_DIR     = path.join(ROOT, "output/v2/3d_sitcom_prod_v1/upload_002_copier/keyframes");
const REF_S1     = path.join(ROOT, "output/v2/3d_sitcom_prod_v1/reference/jun_reference_final.png");

const DRY        = process.argv.includes("--dry-run");
const sceneArg   = (() => { const i = process.argv.indexOf("--scene"); return i >= 0 ? parseInt(process.argv[i+1]) : null; })();

// ── fail-closed ChatGPT image allow guard: output write/browser·CDP 전에 반드시 통과 ──
// Owner decision: image_script_allow_guard = add_allow_guard_to_all_paid_image_scripts.
// 이 guard 통과가 이미지 생성 실행 승인을 의미하지 않는다 (no-live 기본). --dry-run도 guard를 거친다.
if (process.env.ALLOW_CHATGPT_IMAGE !== "1") {
  console.error("ABORT: ChatGPT image 경로 차단 (fail-closed). 필요한 env: ALLOW_CHATGPT_IMAGE=1 — browser/CDP/output write 전에 중단.");
  process.exit(2);
}

fs.mkdirSync(KF_DIR, { recursive: true });
fs.mkdirSync(DL_DIR, { recursive: true });

function log(m)    { console.log(`[${new Date().toISOString().slice(11,19)}] ${m}`); }
function warn(m)   { console.warn(`[WARN] ${m}`); }
function abort(code, m) { console.error(`\n[ABORT:${code}] ${m}\n`); process.exit(1); }

// ── 준 외형 고정 설명 (모든 씬 공통) ─────────────────────────────────────
const JUN_DESC = `The main character is Jun: Korean male office worker in his late 20s.
Round face, large brown eyes, black side-parted hair.
Outfit: light blue rolled-sleeve shirt, loose red tie, long navy slacks, black dress shoes, brown crossbody messenger bag.
IMPORTANT: Do NOT draw white shirt. The shirt must be light blue.`;

// ── 씬별 프롬프트 ──────────────────────────────────────────────────────────
const SCENES = [
  {
    id: "S1",
    file: "kf_s1_wide_copier_error.png",
    prompt: `Generate a keyframe illustration for a Korean office sitcom, vertical 9:16 format.
${JUN_DESC}
Scene 1 — Wide shot: A Korean office copy room. A large photocopier is center-frame with a red error light blinking. Jun rushes in from the right holding one sheet of paper, pressing the copy button. His expression is frustrated. Full body visible. No clock needed. 3D animated style, warm office lighting. No text, no subtitles, no speech bubbles, no brand logos.`,
    reference: REF_S1,
  },
  {
    id: "S2",
    file: "kf_s2_jammed_paper.png",
    prompt: `Generate a keyframe illustration for a Korean office sitcom, vertical 9:16 format.
${JUN_DESC}
Scene 2 — Medium shot: Jun stands at the open photocopier lid, carefully pulling jammed paper with both hands. A small torn paper fragment is in his fingers — the rest is stuck inside. He pauses, staring at the torn scrap. Expression: resigned disbelief. Copy room background. 3D animated style, warm office lighting. No text, no subtitles, no speech bubbles.`,
    reference: null, // 직전 통과 키프레임으로 대체 (런타임에 설정)
  },
  {
    id: "S3",
    file: "kf_s3_tapping_relief.png",
    prompt: `Generate a keyframe illustration for a Korean office sitcom, vertical 9:16 format.
${JUN_DESC}
Scene 3 — Medium-wide shot: Jun taps the side panel of the copier with his palm. The machine is running — one sheet of paper coming out of the output tray. Jun's shoulders drop slightly in relief. A second sheet is just beginning to emerge. Expression: relieved but slightly confused. 3D animated style. No text, no subtitles, no speech bubbles.`,
    reference: null,
  },
  {
    id: "S4",
    file: "kf_s4_paper_pile_button.png",
    prompt: `Generate a keyframe illustration for a Korean office sitcom, vertical 9:16 format.
${JUN_DESC}
Scene 4 — Wide shot: The office floor and output tray are already stacked with many printed sheets (paper pile already there from scene start, no explosion). The copier is still running, ejecting one more sheet. Jun stands at the control panel pressing the stop button repeatedly with one finger, leaning slightly forward. Expression: exhausted determination. Paper everywhere on floor and tray. 3D animated style. No text, no subtitles, no speech bubbles.`,
    reference: null,
  },
  {
    id: "S5",
    file: "kf_s5_boss_hand_finale.png",
    prompt: `Generate a keyframe illustration for a Korean office sitcom, vertical 9:16 format.
${JUN_DESC}
Scene 5 — Wide shot: Jun leans against the copier, completely drained, arms at his sides. A large pile of paper sheets covers the floor around him. From the RIGHT EDGE of the frame, only a suit-sleeved arm and hand reach in to pick up a single sheet — NO face or body of the boss is visible anywhere in the frame. Jun stares forward, blank expression. 3D animated style. No text, no subtitles, no speech bubbles.`,
    reference: null,
  },
];

// ── CDP 연결 헬퍼 ──────────────────────────────────────────────────────────
async function isCDPOpen() {
  try {
    const r = await fetch(`http://localhost:${CDP_PORT}/json/version`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch { return false; }
}

async function ensureChrome() {
  if (await isCDPOpen()) return;
  log("Chrome 실행 중...");
  spawn(CHROME_EXE, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${USER_DATA}`,
    "--no-first-run", "--no-default-browser-check",
    "https://chatgpt.com/"
  ], { detached: true, stdio: "ignore" }).unref();
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await isCDPOpen()) { log("✓ Chrome CDP 연결"); return; }
  }
  abort("cdp_timeout", "Chrome CDP 연결 실패 (15초)");
}

// ── 한도/로그인/CAPTCHA 감지 ───────────────────────────────────────────────
async function detectStop(page) {
  const STOP = ["You've reached", "You've hit", "message limit", "rate limit",
                "Try again in", "사용 한도", "잠시 후 다시", "Log in", "Sign in", "로그인"];
  for (const ph of STOP) {
    const el = page.getByText(ph, { exact: false }).first();
    if (await el.isVisible({ timeout: 200 }).catch(() => false)) {
      const txt = await el.textContent().catch(() => ph);
      abort("limit_or_login", `중단 조건: "${txt.trim().slice(0, 80)}"`);
    }
  }
  const cap = await page.locator('iframe[src*="recaptcha"], [class*="captcha"]').count();
  if (cap > 0) abort("captcha", "CAPTCHA 감지 — 수동 해제 필요");
}

// ── 이미지 저장 ────────────────────────────────────────────────────────────
async function saveImage(page, destPath) {
  // 방법 1: blob/oaiusercontent src에서 직접 fetch
  const imgs = page.locator(
    '[data-message-author-role="assistant"] img[src*="oaiusercontent"], ' +
    '[data-message-author-role="assistant"] img[src*="blob"], ' +
    '[data-message-author-role="assistant"] img[src*="files.oaiusercontent"]'
  );
  if (await imgs.count() > 0) {
    const src = await imgs.last().getAttribute("src").catch(() => null);
    if (src) {
      const buf = await page.evaluate(async (u) => {
        const r = await fetch(u);
        const ab = await r.arrayBuffer();
        return Array.from(new Uint8Array(ab));
      }, src).catch(() => null);
      if (buf && buf.length > 10000) {
        fs.writeFileSync(destPath, Buffer.from(buf));
        return true;
      }
    }
  }
  // 방법 2: 다운로드 폴더에 새 파일 등장
  const before = new Set(fs.readdirSync(DL_DIR));
  // 다운로드 버튼 클릭 시도
  const dlBtn = page.locator('button[aria-label*="다운로드" i], button[aria-label*="Download" i], a[download]').first();
  if (await dlBtn.count() > 0) {
    const [dl] = await Promise.all([
      page.waitForEvent("download", { timeout: 15000 }).catch(() => null),
      dlBtn.click(),
    ]);
    if (dl) {
      const tmpPath = await dl.path();
      if (tmpPath) { fs.copyFileSync(tmpPath, destPath); return true; }
    }
  }
  // 방법 3: 폴더 새 파일
  await page.waitForTimeout(3000);
  const after = fs.readdirSync(DL_DIR).filter(f => !before.has(f) && /\.(png|jpg|jpeg|webp)$/i.test(f));
  if (after.length > 0) {
    fs.copyFileSync(path.join(DL_DIR, after[0]), destPath);
    return true;
  }
  return false;
}

// ── 페이지 내 이미지 인벤토리 (estuary 방식) ──────────────────────────────
async function inventory(page) {
  return await page.evaluate(() => {
    function cid(s) { const m = (s||"").match(/[?&]id=([^&]+)/); return m ? m[1] : null; }
    return Array.from(document.querySelectorAll('img'))
      .filter(i => i.naturalWidth >= 200 && !/oaistatic\.com\/images-app/.test(i.src))
      .map(i => ({ src: i.src, cid: cid(i.src), w: i.naturalWidth, h: i.naturalHeight,
        gen: /backend-api\/estuary\/content|oaiusercontent/.test(i.src) }));
  });
}

// ── 단일 씬 생성 ──────────────────────────────────────────────────────────
async function generateScene(browser, scene) {
  log(`\n=== ${scene.id} 생성 시작 ===`);
  const destPath = path.join(KF_DIR, scene.file);

  const ctx = browser.contexts()[0];
  if (!ctx) abort("no_context", "브라우저 컨텍스트 없음");

  // 새 탭에서 ChatGPT 새 대화
  const page = await ctx.newPage();
  await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(1500);

  if (/auth|login/.test(page.url())) abort("login_required", "ChatGPT 로그인 필요");
  await detectStop(page);

  // 입력창 대기
  const ta = page.locator('#prompt-textarea').first();
  await ta.waitFor({ state: "visible", timeout: 15000 }).catch(() =>
    abort("selector_changed", "입력창 미발견")
  );
  log("✓ 입력창 확인");

  if (DRY) {
    log(`[DRY-RUN] ${scene.id} — 입력창 확인 완료. 생성 0회.`);
    await page.close();
    return "dry_run";
  }

  // ── 이미지 첨부 (reference가 있을 때) ────────────────────────────────
  const refPath = scene.reference;
  if (refPath && fs.existsSync(refPath)) {
    log(`이미지 첨부: ${path.basename(refPath)}`);
    let fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() === 0) {
      const plusBtn = page.locator('button[aria-label*="파일 추가" i], button[aria-label*="Attach" i]').first();
      if (await plusBtn.count() > 0) await plusBtn.click();
      await page.waitForTimeout(600);
      fileInput = page.locator('input[type="file"]').first();
    }
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles(refPath);
      log("✓ 파일 첨부 완료");
      await page.waitForTimeout(2000);
    } else {
      warn("file input 미발견 — 첨부 없이 진행");
    }
  }

  // ── 이미지 생성 도구 활성화 ───────────────────────────────────────────
  log("이미지 생성 도구 활성화...");
  const plus = page.locator('button[aria-label="파일 추가 및 기타"]').first();
  if (await plus.count() > 0) {
    await plus.click();
    await page.waitForTimeout(1000);
    const imgTool = page.getByRole("menuitemradio", { name: /이미지 만들기|Create image/i }).first();
    if (await imgTool.count() > 0) {
      await imgTool.click();
      await page.waitForTimeout(1000);
      log("✓ 이미지 도구 활성화");
    } else {
      warn("'이미지 만들기' 메뉴 항목 미발견 — 계속 진행");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }
  } else {
    warn("'파일 추가 및 기타' 버튼 미발견 — 계속 진행");
  }

  // ── 전송 전 이미지 인벤토리 기록 ─────────────────────────────────────
  const preIds = new Set((await inventory(page)).map(x => x.cid).filter(Boolean));

  // ── 프롬프트 입력 ────────────────────────────────────────────────────
  log("프롬프트 입력...");
  const oneLine = scene.prompt.replace(/\s*\n\s*/g, " ").trim();
  await ta.click();
  await ta.fill(oneLine);
  await page.waitForTimeout(800);
  let typed = (await ta.textContent().catch(() => "") || "").trim();
  if (typed.length < 10) {
    log("fill() 실패 — keyboard.type() 재시도");
    await ta.click();
    await page.keyboard.type(oneLine, { delay: 1 });
    await page.waitForTimeout(800);
    typed = (await ta.textContent().catch(() => "") || "").trim();
  }
  log(`입력 확인: ${typed.length}자`);
  if (typed.length < 10) abort("input_failed", `${scene.id} 프롬프트 입력 실패`);

  await detectStop(page);

  // ── 전송 (1회) ────────────────────────────────────────────────────────
  const beforeTurns = await page.locator('[data-testid^="conversation-turn"]').count();
  const sendBtn = page.locator(
    '#composer-submit-button, button[data-testid="send-button"], button[aria-label="Send message"], button[aria-label="메시지 보내기"]'
  ).first();
  if (await sendBtn.count() > 0 && await sendBtn.isEnabled().catch(() => false)) {
    await sendBtn.click();
    log("✓ 전송 버튼 클릭 (1회)");
  } else {
    await ta.press("Enter");
    log("✓ Enter 전송 (1회)");
  }

  // 전송 확인
  let sent = false;
  for (let i = 0; i < 24; i++) {
    await page.waitForTimeout(500);
    if (await page.locator('[data-testid^="conversation-turn"]').count() > beforeTurns) { sent = true; break; }
    if (i === 10) await ta.press("Enter").catch(() => {});
  }
  if (!sent) abort("send_failed", `${scene.id} 전송 실패`);
  log("✓ 전송 확인 — 생성 대기");

  // ── 생성 대기 (최대 300초, 최소 20초 후부터 이미지 인정) ───────────────
  const startTime = Date.now();
  while (Date.now() - startTime < 300_000) {
    await page.waitForTimeout(4000);
    await detectStop(page);
    const elapsed = Date.now() - startTime;

    const lastTxt = await page.locator('[data-testid^="conversation-turn"]').last().textContent().catch(() => "");
    // 텍스트 거절 감지
    if (/텍스트 기반|이미지를 직접 렌더링|이미지를 만들 수 없|이미지를 생성할 수 없|프롬프트를 작성해 드릴/i.test(lastTxt)) {
      await page.close();
      return `text_refused`;
    }

    // 최소 20초 대기 후 이미지 탐색
    if (elapsed < 20000) { log(`  ${scene.id} 대기 ${Math.round(elapsed/1000)}s (최소대기)`); continue; }

    // estuary/oaiusercontent 신규 이미지 감지
    const inv = await inventory(page);
    const cand = inv.filter(x => x.gen && x.w >= 400 && x.h >= x.w && x.cid && !preIds.has(x.cid));
    if (cand.length > 0) {
      log(`✓ 이미지 감지 (${cand.length}개) — 저장 시도`);
      await page.waitForTimeout(1500);
      const src = cand[cand.length - 1].src;
      const buf = await page.evaluate(async (u) => {
        const r = await fetch(u);
        const ab = await r.arrayBuffer();
        return Array.from(new Uint8Array(ab));
      }, src).catch(() => null);
      if (buf && buf.length > 10000) {
        fs.writeFileSync(destPath, Buffer.from(buf));
        const size = fs.statSync(destPath).size;
        log(`✓ 저장 완료: ${scene.file} (${Math.round(size/1024)}KB)`);
        await page.close();
        return "ok";
      }
    }

    const generating = /생성하고 있습니다|만들고 있습니다|Creating image|생성 중|잠시만|이미지를 만드는 중/i.test(lastTxt);
    log(`  ${scene.id} 대기 ${Math.round(elapsed/1000)}s (신규: ${cand?.length ?? 0})${generating ? " (생성 중)" : ""}`);
  }

  await page.close();
  return "timeout";
}

// ── 메인 ──────────────────────────────────────────────────────────────────
async function main() {
  log("=== upload_002_copier 키프레임 생성 시작 ===");
  log(`레퍼런스: ${REF_S1}`);
  if (!fs.existsSync(REF_S1)) abort("ref_missing", `S1 레퍼런스 없음: ${REF_S1}`);

  await ensureChrome();

  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`)
    .catch(e => abort("cdp_connect", e.message));

  // 씬 목록 결정
  const scenesToRun = sceneArg
    ? SCENES.filter(s => s.id === `S${sceneArg}`)
    : SCENES;

  if (scenesToRun.length === 0) abort("invalid_scene", `--scene ${sceneArg} 는 유효하지 않음 (1~5)`);

  const results = [];
  let lastPassedPath = REF_S1; // S1은 레퍼런스 사용, S2~는 직전 통과 키프레임

  for (const scene of scenesToRun) {
    // S2~S5: 직전 통과 키프레임을 reference로 설정
    if (scene.id !== "S1") {
      scene.reference = fs.existsSync(lastPassedPath) ? lastPassedPath : null;
      if (scene.reference) log(`${scene.id} reference: ${path.basename(scene.reference)}`);
      else warn(`${scene.id} reference 없음 — 텍스트 전용`);
    }

    const result = await generateScene(browser, scene);
    const destPath = path.join(KF_DIR, scene.file);
    results.push({ scene: scene.id, file: scene.file, result, exists: fs.existsSync(destPath) });

    if (result === "ok" && fs.existsSync(destPath)) {
      lastPassedPath = destPath; // 다음 씬의 reference로 사용
    } else if (result !== "dry_run") {
      warn(`${scene.id} 결과: ${result} — 다음 씬은 이전 reference 유지`);
    }

    // 씬 간 대기
    if (scenesToRun.indexOf(scene) < scenesToRun.length - 1) {
      log("다음 씬 전 3초 대기...");
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  await browser.close();

  // ── 최종 보고 ────────────────────────────────────────────────────────
  console.log("\n\n=== 키프레임 생성 결과 ===");
  for (const r of results) {
    const mark = r.result === "ok" ? "✅" : r.result === "dry_run" ? "🔵" : "❌";
    console.log(`${mark} ${r.scene}: ${r.file} — ${r.result}`);
  }

  const passed = results.filter(r => r.result === "ok").length;
  const failed = results.filter(r => !["ok","dry_run"].includes(r.result));
  console.log(`\n통과: ${passed}/${results.length}`);
  if (failed.length > 0) {
    console.log("재생성 필요 (Owner 판단):");
    for (const f of failed) console.log(`  - ${f.scene}: ${f.result}`);
  }

  // 결과 JSON 저장
  const logPath = path.join(KF_DIR, "generation_log.json");
  fs.writeFileSync(logPath, JSON.stringify({
    generated_at: new Date().toISOString(),
    total: results.length,
    passed,
    results,
  }, null, 2));
  console.log(`\n로그 저장: ${logPath}`);
  console.log(`키프레임 폴더: ${KF_DIR}`);
}

main().catch(e => { console.error("[FATAL]", e.message); process.exit(1); });
