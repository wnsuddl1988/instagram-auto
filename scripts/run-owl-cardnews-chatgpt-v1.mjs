/**
 * 부엉이 카드뉴스(인스타그램 피드 게시물) 이미지 생성 — ChatGPT 이미지 도구.
 *
 * 목적: 이미 배포된 부엉이 쇼츠 영상의 핵심 내용을 번호형 카드뉴스로 재가공한다.
 * 영상과 달리 슬라이드마다 캐릭터 등장 여부·텍스트 내용이 완전히 다르므로,
 * probe-character-consistency-chatgpt-v1.mjs의 "한 대화에서 연속 포즈" 방식이
 * 아니라 슬라이드마다 새 대화(openFreshImageChat)를 여는 방식을 쓴다.
 *
 * 캐릭터가 등장하는 슬라이드(표지·마무리)는 owl3dv5 canonical reference를
 * 첨부해 영상과 동일 캐릭터로 유지한다. 본문 슬라이드는 캐릭터 없이 순수
 * 타이포그래피 + 실사 배경 사진 스타일로 생성한다.
 *
 * 사용:
 *   node scripts/run-owl-cardnews-chatgpt-v1.mjs --spec-module ./_owl-cardnews-ep1-spec.mjs --out-dir C:/tmp/owl-cardnews-ep1
 *   node scripts/run-owl-cardnews-chatgpt-v1.mjs --spec-module ./_owl-cardnews-ep1-spec.mjs --out-dir C:/tmp/owl-cardnews-ep1 --only cover,closing
 */

import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { failFast } from "./_owl-browser-diagnostics.mjs";

import {
  CDP_PORT_GPT1, USER_DATA_GPT1,
  ensureChrome, checkLogin, detectStop,
  typePrompt, checkSendEnabled,
  isAssistantDone, interceptRecover,
  activateImageTool, openFreshImageChat,
  CHATGPT_IMAGE_AUTOMATION_PROMPT_PREFIX, IMAGE_TOOL_PROMPT_ROUTING_FALLBACK,
  PROMPT_COMPOSER_SELECTOR,
} from "./_chatgpt-image-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OWL3DV5_CANONICAL_REFERENCE = path.join(REPO_ROOT, "assets/character-references/owl3dv5-canonical-reference.png");
const COIN3DV1_CANONICAL_REFERENCE = path.join(REPO_ROOT, "assets/character-references/coin3dv1-canonical-reference.png");
const BULL3DV1_CANONICAL_REFERENCE = path.join(REPO_ROOT, "assets/character-references/bull3dv1-canonical-reference.png");
// 스펙의 최상위 character 필드로 참조 이미지를 고른다("geumbaksa"/"bull"이 아니면
// 부엉이 기본값). 캐릭터가 다른데 잘못된 참조를 첨부하면 사고이므로 명시적으로
// 분기한다.
function canonicalReferenceFor(spec) {
  if (spec.character === "geumbaksa") return COIN3DV1_CANONICAL_REFERENCE;
  if (spec.character === "bull") return BULL3DV1_CANONICAL_REFERENCE;
  return OWL3DV5_CANONICAL_REFERENCE;
}

const argv = process.argv.slice(2);
function getArg(name) {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : null;
}

const SPEC_MODULE = getArg("--spec-module");
const OUT_DIR = getArg("--out-dir");
const ONLY = getArg("--only");
const PREFLIGHT_ONLY = argv.includes("--preflight-only");
const MANUAL_ASSIST = argv.includes("--manual-assist");

if (!SPEC_MODULE || !OUT_DIR) {
  console.error("Usage: node scripts/run-owl-cardnews-chatgpt-v1.mjs --spec-module <path> --out-dir <path outside repo> [--only slideId1,slideId2] [--preflight-only]");
  process.exit(1);
}

const OUT_DIR_ABS = path.resolve(OUT_DIR);
if (OUT_DIR_ABS.startsWith(REPO_ROOT + "\\") || OUT_DIR_ABS.startsWith(REPO_ROOT + "/")) {
  console.error(`ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out: ${OUT_DIR_ABS}`);
  process.exit(1);
}
if (OUT_DIR_ABS.includes(".money-shorts-local")) {
  console.error("ABORT: .money-shorts-local access forbidden.");
  process.exit(1);
}
if (process.env.ALLOW_CHATGPT_IMAGE !== "1") {
  console.error("ABORT: ChatGPT image 경로 차단 (fail-closed). 필요한 env: ALLOW_CHATGPT_IMAGE=1");
  process.exit(2);
}

fs.mkdirSync(OUT_DIR_ABS, { recursive: true });

function ts() { return new Date().toISOString().slice(11, 19); }
function log(m) { console.log(`[${ts()}][cardnews] ${m}`); }
function warn(m) { console.warn(`[WARN][cardnews] ${m}`); }

const specModuleUrl = new URL(SPEC_MODULE, import.meta.url);
const specModule = await import(specModuleUrl.href);
const SPEC = specModule.CARDNEWS_SPEC;
if (!SPEC || !Array.isArray(SPEC.slides) || SPEC.slides.length === 0) {
  console.error(`ABORT: ${SPEC_MODULE} 에 CARDNEWS_SPEC.slides 배열이 없습니다.`);
  process.exit(1);
}

const ONLY_IDS = ONLY ? new Set(ONLY.split(",").map((s) => s.trim())) : null;
const SLIDES = ONLY_IDS ? SPEC.slides.filter((s) => ONLY_IDS.has(s.id)) : SPEC.slides;
if (SLIDES.length === 0) {
  console.error(`ABORT: --only "${ONLY}" 에 해당하는 슬라이드를 찾을 수 없습니다. 사용 가능 id: ${SPEC.slides.map((s) => s.id).join(", ")}`);
  process.exit(1);
}

// ── collectGeneratedImages: probe-character-consistency-chatgpt-v1.mjs와 동일 로직 ──
async function collectGeneratedImages(page) {
  return await page.evaluate(() => {
    function cid(s) {
      const m = (s || "").match(/[?&]id=([^&]+)/);
      return m ? m[1] : null;
    }
    const seen = new Set();
    const out = [];
    const previewImgs = new Set();
    document.querySelectorAll('[data-testid="generated-image-preview"] img').forEach((i) => previewImgs.add(i));
    const allImgs = Array.from(document.querySelectorAll("img"));
    allImgs.forEach((i, documentIndex) => {
      const src = i.src || i.currentSrc || "";
      if (!src || i.naturalWidth < 400) return;
      const isGeneratedPreview = previewImgs.has(i);
      const isLegacyUrlMatch = /backend-api\/estuary\/content|oaiusercontent/.test(src);
      if (!isGeneratedPreview && !isLegacyUrlMatch) return;
      let el = i, isUserAttachment = false;
      for (let d = 0; d < 12 && el; d += 1) {
        if (/group\/user-message/.test((el.className || "").toString())) { isUserAttachment = true; break; }
        el = el.parentElement;
      }
      if (isUserAttachment) return;
      const id = cid(src);
      const key = id || src;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({
        src, cid: id, w: i.naturalWidth, h: i.naturalHeight, gen: true,
        documentIndex, top: i.getBoundingClientRect().top,
      });
    });
    return out;
  });
}

async function dismissDuplicateFileModal(page) {
  const modal = page.locator("#modal-duplicate-file");
  if (await modal.count() === 0) return;
  const visible = await modal.isVisible().catch(() => false);
  if (!visible) return;
  warn("중복 파일 확인 모달 감지 — 닫는 중");
  const confirmBtn = modal.getByRole("button", { name: /계속|업로드|확인|Continue|Upload|Confirm/i }).first();
  if ((await confirmBtn.count()) > 0) {
    await confirmBtn.click().catch(() => {});
  } else {
    await page.keyboard.press("Escape").catch(() => {});
  }
  await page.waitForTimeout(500);
}

async function firstVisibleLocatorLocal(candidates) {
  for (const candidate of candidates) {
    const count = await candidate.count();
    for (let i = 0; i < count; i += 1) {
      const item = candidate.nth(i);
      if (await item.isVisible({ timeout: 350 }).catch(() => false)) return item;
    }
  }
  return null;
}

async function attachReferenceImage(page, refPath) {
  // 2026-09-26 확인: 플러스 버튼 testid/aria-label이 바뀌었다(OpenAI 쪽 변경,
  // "파일 등 추가"가 현재 라벨). 여러 후보를 순서대로 시도한다.
  const plusBtn = await firstVisibleLocatorLocal([
    page.locator('[data-testid="composer-plus-btn"]'),
    page.locator('button[aria-label="파일 등 추가"]'),
    page.locator('button[aria-label="파일 추가 및 기타"]'),
    page.locator('button[aria-label*="Attach" i]'),
    page.locator('button[aria-label*="Add" i]'),
  ]);
  if (!plusBtn) { warn("참조 이미지 첨부 실패: 플러스 버튼(파일 등 추가) 없음"); return false; }
  await plusBtn.click();
  await page.waitForTimeout(500);

  const uploadItem = await firstVisibleLocatorLocal([
    page.getByText("사진 및 파일 추가", { exact: false }),
    page.getByText("사진 및 파일", { exact: false }),
    page.getByText("파일 업로드", { exact: false }),
    page.getByText("Add photos & files", { exact: false }),
    page.getByText("Upload from computer", { exact: false }),
  ]);
  if (!uploadItem) {
    warn("참조 이미지 첨부 실패: '사진 및 파일 추가' 메뉴 항목 없음");
    await page.keyboard.press("Escape").catch(() => {});
    return false;
  }

  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser", { timeout: 6000 }).catch(() => null),
    uploadItem.click(),
  ]);
  if (!fileChooser) { warn("참조 이미지 첨부 실패: filechooser 안 열림"); return false; }
  await fileChooser.setFiles(refPath);
  await page.waitForTimeout(1500);
  await dismissDuplicateFileModal(page);
  log(`참조 이미지 첨부 완료: ${refPath}`);
  return true;
}

async function saveGeneratedImage(page, destPath, baselineCids) {
  const imgs = await collectGeneratedImages(page);
  const fresh = imgs.filter((x) => x.gen && x.cid && !baselineCids.has(x.cid));
  const cand = (fresh.length > 0 ? fresh : imgs.filter((x) => x.gen))
    .sort((a, b) => b.documentIndex - a.documentIndex)[0];

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

function buildPrompt(slide, toolMode) {
  const body = slide.prompt;
  return toolMode === IMAGE_TOOL_PROMPT_ROUTING_FALLBACK
    ? `${CHATGPT_IMAGE_AUTOMATION_PROMPT_PREFIX} ${body}`
    : body;
}

async function generateSlide(page, slide, toolMode, savedHashes, { freshChat }) {
  log(`=== ${slide.id} 생성 시작 ===`);
  const destPath = path.join(OUT_DIR_ABS, slide.file);

  let actualToolMode = toolMode;
  if (freshChat) {
    await openFreshImageChat(page, log);
    await detectStop(page);
    const toolResult = await activateImageTool(page, log, warn);
    actualToolMode = toolResult?.mode ?? toolMode;
  }

  const ta = page.locator(PROMPT_COMPOSER_SELECTOR).first();
  const taVisible = await ta.isVisible({ timeout: 8000 }).catch(() => false);
  if (!taVisible) throw new Error(`composer: ${PROMPT_COMPOSER_SELECTOR} not visible`);

  const referenceImage = canonicalReferenceFor(SPEC);
  if (slide.withCharacter && fs.existsSync(referenceImage)) {
    await attachReferenceImage(page, referenceImage);
  }

  const baseImgs = await collectGeneratedImages(page);
  const baselineCids = new Set(baseImgs.map((x) => x.cid || x.src).filter(Boolean));

  await typePrompt(page, buildPrompt(slide, actualToolMode), log);
  const sendOk = await checkSendEnabled(page);
  if (!sendOk) throw new Error("send_enabled: send button not found/disabled");

  const sendBtn = await firstVisibleLocatorLocal([
    page.locator('#composer-submit-button'),
    page.locator('button[data-testid="send-button"]'),
    page.locator('button[aria-label="Send message"]'),
    page.locator('button[aria-label="메시지 보내기"]'),
    page.locator('button[aria-label="보내기"]'),
  ]);
  if (!sendBtn) throw new Error("send_button: no visible send button candidate found");
  await sendBtn.click();
  log(`${slide.id} 전송 완료 — 생성 대기 중...`);

  let done = false;
  for (let i = 0; i < 90; i++) {
    await page.waitForTimeout(2000);
    if (await isAssistantDone(page)) {
      await page.waitForTimeout(4000);
      if (!(await isAssistantDone(page))) continue;
      const imgs = await collectGeneratedImages(page);
      const fresh = imgs.filter((x) => x.gen && (x.cid || x.src) && !baselineCids.has(x.cid || x.src));
      if (fresh.length > 0) { done = true; break; }
    }
  }
  if (!done) warn(`${slide.id}: 생성 완료 감지 timeout — fallback 시도`);

  const saveRes = await saveGeneratedImage(page, destPath, baselineCids);
  if (!saveRes.ok) throw new Error(`${slide.id}: 이미지 저장 실패 (${saveRes.method})`);

  const savedBuf = fs.existsSync(destPath) ? fs.readFileSync(destPath) : null;
  if (savedBuf) {
    const savedHash = crypto.createHash("sha256").update(savedBuf).digest("hex");
    const isRefDuplicate =
      slide.withCharacter &&
      fs.existsSync(referenceImage) &&
      Buffer.compare(savedBuf, fs.readFileSync(referenceImage)) === 0;
    const dupOf = savedHashes.get(savedHash);
    if (isRefDuplicate || dupOf) {
      fs.unlinkSync(destPath);
      const reason = isRefDuplicate
        ? "기준 참조 이미지와 완전히 동일함(생성이 아니라 재반환)"
        : `이미 저장된 "${dupOf}"와 완전히 동일함(다른 슬라이드 이미지 재반환)`;
      throw new Error(`${slide.id}: 저장된 이미지가 ${reason} — 재시도 필요`);
    }
    savedHashes.set(savedHash, slide.id);
  }

  log(`${slide.id} 저장 ✅ ${destPath} (${saveRes.method}, ${Math.round((saveRes.bytes || 0) / 1024)}KB)`);
  return { id: slide.id, destPath, save: saveRes };
}

async function main() {
  log(`=== 부엉이 카드뉴스 생성 (${SPEC.title ?? SPEC_MODULE}) ===`);
  log(`out-dir: ${OUT_DIR_ABS}`);
  log(`mode:    ${PREFLIGHT_ONLY ? "PREFLIGHT_ONLY (전송 0회)" : `GENERATE (최대 ${SLIDES.length}장)`}`);

  await ensureChrome(CDP_PORT_GPT1, USER_DATA_GPT1, log);
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT_GPT1}`);
  const ctx = browser.contexts()[0];
  if (!ctx) { console.error("ABORT: no browser context"); process.exit(1); }

  const page = await ctx.newPage();
  await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(1500);

  if (/auth|login/i.test(page.url())) {
    const resumed = await failFast(page, {
      outDir: OUT_DIR_ABS,
      label: "login-required",
      what: "ChatGPT 로그인이 필요합니다. 브라우저에서 로그인해 주세요",
      selectors: ["URL 에 auth/login 포함"],
      hint: "CDP 프로필의 세션이 만료됐습니다. 한 번 로그인해두면 다음부터는 유지됩니다.",
      manualAssist: MANUAL_ASSIST,
    });
    if (!resumed) process.exit(1);
    await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(1500);
  }
  await checkLogin(page, log);
  await detectStop(page);

  const toolResult = await activateImageTool(page, log, warn);
  const toolMode = toolResult?.mode ?? "unknown";
  log(`image tool mode: ${toolMode}`);

  if (PREFLIGHT_ONLY) {
    log("PREFLIGHT PASS — 로그인/이미지툴 확인 완료. 전송 0회.");
    fs.writeFileSync(
      path.join(OUT_DIR_ABS, "PREFLIGHT.json"),
      JSON.stringify({ schema: "OWL_CARDNEWS_PREFLIGHT_V1", result: "PASS", sent: 0, toolMode }, null, 2),
      "utf-8"
    );
    await page.close().catch(() => {});
    return;
  }

  const savedHashes = new Map();
  for (const entry of fs.readdirSync(OUT_DIR_ABS)) {
    if (!entry.endsWith(".png")) continue;
    const full = path.join(OUT_DIR_ABS, entry);
    const hash = crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex");
    savedHashes.set(hash, entry);
  }

  // 한 대화창에서 2장씩 묶어 생성한다(Owner 규칙, 2026-09-19) — 슬라이드마다
  // 매번 새 대화를 여는 대신, 2장 단위 그룹의 첫 장만 새 대화를 열고 두 번째
  // 장은 같은 대화에서 이어 생성한다. 그룹 경계에서만 openFreshImageChat을
  // 호출해 ChatGPT 대화 수를 줄인다.
  const GROUP_SIZE = 2;
  const results = [];
  for (let i = 0; i < SLIDES.length; i += GROUP_SIZE) {
    const group = SLIDES.slice(i, i + GROUP_SIZE);
    for (let j = 0; j < group.length; j += 1) {
      const slide = group[j];
      try {
        results.push(await generateSlide(page, slide, toolMode, savedHashes, { freshChat: j === 0 }));
      } catch (err) {
        warn(`${slide.id} 실패: ${err.message}`);
        results.push({ id: slide.id, error: err.message });
      }
    }
  }

  await page.close().catch(() => {});

  const okCount = results.filter((r) => !r.error).length;
  log(`=== 완료: ${okCount}/${SLIDES.length} 성공 ===`);
  fs.writeFileSync(
    path.join(OUT_DIR_ABS, "cardnews-generation-summary.json"),
    JSON.stringify({ schema: "OWL_CARDNEWS_GENERATION_SUMMARY_V1", specModule: SPEC_MODULE, results }, null, 2),
    "utf-8"
  );

  if (okCount < SLIDES.length) process.exit(1);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
