#!/usr/bin/env node
/**
 * Flow 클립 1개 생성 러너 (2026-10-12, Owner 승인: 무료 6번 Lite 1클립 시험). 로그인된 CDP 프로필에서만 동작한다.
 *
 * 사용: node scripts/flow-run-clip.mjs --port 9236 --project <프로젝트URL> --image <png> --prompt <txt> --model lite|omni \
 *         [--submit] [--approve-credits 10] [--out <mp4경로>] [--shots <폴더>]
 *  - --submit 없으면: 설정(9:16·x1·모델)과 소재·프롬프트 입력까지만 하고 멈춘다.
 *  - --submit 만 있으면: "생성 시작"을 누르고 확인 대화상자를 읽어 출력한 뒤 승인하지 않고 멈춘다.
 *  - --approve-credits N 이 있으면: 대화상자의 크레딧 숫자가 N과 같을 때만 승인하고 완료를 기다려 내려받는다(다르면 중단).
 * 안전: 자격증명·로그인 동작 없음. 크레딧 숫자 불일치·예상 밖 화면이면 즉시 중단.
 */
import fs from "node:fs";
import path from "node:path";

const A = process.argv.slice(2);
const arg = (n, d) => { const i = A.indexOf(n); return i >= 0 ? A[i + 1] : d; };
const PORT = arg("--port"), PROJECT = arg("--project"), IMAGE = arg("--image"), PROMPT_FILE = arg("--prompt");
const MODEL = arg("--model", "lite"), SUBMIT = A.includes("--submit"), APPROVE = arg("--approve-credits");
const OUT = arg("--out"), SHOTS = arg("--shots", "C:/tmp/money-shorts-os/flow-accounts/run");
const MODEL_TEXT = { lite: "Veo 3.1 - Lite", omni: "Omni 1.1 Flash", fast: "Veo 3.1 - Fast", quality: "Veo 3.1 - Quality" }[MODEL];
const EXPECT = { lite: 10, omni: 15 }[MODEL];
if (!PORT || !PROJECT || !IMAGE || !PROMPT_FILE || !MODEL_TEXT) { console.error("필수 인자 부족"); process.exit(2); }
if (!fs.existsSync(IMAGE) || !fs.existsSync(PROMPT_FILE)) { console.error("이미지 또는 프롬프트 파일 없음"); process.exit(2); }
if (APPROVE !== undefined && Number(APPROVE) !== EXPECT) { console.error(`ABORT: 모델 ${MODEL}의 예상 비용은 ${EXPECT}인데 --approve-credits ${APPROVE}`); process.exit(2); }
fs.mkdirSync(SHOTS, { recursive: true });
const log = (m) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);
const { chromium } = await import("playwright");
const browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
const ctx = browser.contexts()[0];
let page = ctx.pages().find((p) => /flow\.google\.com/.test(p.url())) ?? ctx.pages()[0];
for (const p of ctx.pages()) if (p !== page) await p.close().catch(() => {});
const shot = async (n) => page.screenshot({ path: path.join(SHOTS, `${n}.png`) }).catch(() => {});
const bodyText = () => page.evaluate(() => document.body?.innerText ?? "").catch(() => "");
const prompt = fs.readFileSync(PROMPT_FILE, "utf8").trim();

try {
  await page.goto(PROJECT, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(5000);
  // 쿠키 안내는 거절 쪽("나중에")
  await page.getByText("나중에", { exact: true }).first().click({ timeout: 2000 }).catch(() => {});

  // 1) 설정: 동영상 9:16 · x1 · 모델 (기본값은 계정에 저장됨)
  await page.locator('[aria-label="설정"]').first().click({ timeout: 8000 });
  await page.waitForTimeout(1200);
  const nine = page.locator('button[role="radio"]:has-text("9:16")'); // 이미지 구역 첫 번째, 동영상 구역 두 번째
  const x1 = page.locator('button[role="radio"]:has-text("x1")');
  if ((await nine.count()) < 2 || (await x1.count()) < 2) throw new Error("설정 화면 구조가 예상과 다름");
  await nine.nth(1).click(); await x1.nth(1).click();
  await page.locator('[aria-label="동영상 생성 기본 모델"]').first().click({ timeout: 8000 });
  await page.waitForTimeout(600);
  await page.locator(`button[role="menuitem"]:has-text("${MODEL_TEXT}")`).first().click({ timeout: 8000 });
  await page.waitForTimeout(600);
  const modelNow = (await page.locator('[aria-label="동영상 생성 기본 모델"]').first().innerText()).replace(/\s+/g, " ");
  if (!modelNow.includes(MODEL_TEXT)) throw new Error(`모델 선택 실패: ${modelNow}`);
  await page.locator('button:has-text("저장")').last().click({ timeout: 8000 });
  await page.waitForTimeout(1500);
  log(`설정 저장: 동영상 9:16 · x1 · ${modelNow}`);

  // 2) 소재 첨부 + 프롬프트
  await page.locator('[aria-label="프롬프트 상자에 소재 추가"]').first().click({ timeout: 8000 });
  await page.waitForTimeout(1000);
  await page.locator('mat-list-item:has-text("업로드")').first().click({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(800);
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser", { timeout: 10000 }),
    page.locator('button:has-text("미디어 업로드")').first().click({ timeout: 8000 }),
  ]);
  await chooser.setFiles(IMAGE);
  await page.waitForTimeout(7000);
  await page.locator('button:has-text("프롬프트에 추가")').first().click({ timeout: 10000 });
  await page.waitForTimeout(1500);
  const box = page.locator('[contenteditable="true"]:visible').first();
  await box.click({ timeout: 8000 });
  await page.keyboard.insertText(prompt);
  await page.waitForTimeout(1200);
  await shot("1-composed");
  log(`소재·프롬프트 입력 완료(프롬프트 ${prompt.length}자)`);
  if (!SUBMIT) { log("--submit 없음 — 여기서 멈춤"); process.exit(0); }

  // 3) 제출 → 확인 대화상자
  await page.locator('[aria-label="생성 시작"]').first().click({ timeout: 8000 });
  log("생성 시작 클릭 — 에이전트 응답 대기");
  let confirmText = "";
  for (let i = 0; i < 40; i += 1) {
    await page.waitForTimeout(3000);
    const t = await bodyText();
    if (/크레딧/.test(t.slice(t.indexOf("세션") >= 0 ? t.indexOf("세션") : 0)) && /(승인|확인|계속|생성)/.test(t)) { confirmText = t; if (i >= 1) break; }
  }
  await shot("2-after-submit");
  const idx = confirmText.search(/크레딧/);
  console.log("=== 제출 후 화면 텍스트(크레딧 주변) ===");
  console.log(idx >= 0 ? confirmText.slice(Math.max(0, idx - 400), idx + 600) : confirmText.slice(-900));
  const btns = await page.evaluate(() => [...document.querySelectorAll("button,[role=button]")].filter((e) => e.offsetParent !== null).map((e) => (e.getAttribute("aria-label") || (e.innerText || "").trim()).replace(/\s+/g, " ").slice(0, 40)).filter(Boolean));
  console.log("보이는 버튼:", btns.slice(-25).join(" | "));
  if (APPROVE === undefined) { log("--approve-credits 없음 — 승인하지 않고 멈춤(대화상자는 열린 채)"); process.exit(0); }
  // (승인·완료 대기·다운로드는 대화상자 구조 확인 뒤 구현)
  log("승인 단계는 대화상자 구조 확인 후 구현 — 여기서 멈춤");
} catch (e) {
  await shot("error");
  console.error("ERROR:", e.message);
  process.exitCode = 1;
} finally { await browser.close().catch(() => {}); }
