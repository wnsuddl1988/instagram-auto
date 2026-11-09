/**
 * YouTube Studio 썸네일 등록기 (2026-10-07, Owner "왜 니가 안 올리고 나를 시키냐").
 *
 * 쇼츠는 API `thumbnails.set`이 세로 칸에 반영되지 않는다(§5 10단계 실측). Studio 상세 화면에는 9:16 썸네일 업로더
 * (`ytcp-thumbnail-uploader #file-loader`, jpeg/png, 최대 2160x3840)가 있어, 이미 로그인된 CDP Chrome(9222)에 Playwright로 붙어
 * 파일을 직접 넣고 "저장"을 누른다. 자격증명은 읽지 않는다(브라우저 로그인 세션만 쓴다).
 *
 * 사용: node scripts/set-youtube-studio-thumbnail-once.mjs --video-id <id> --image <커버.png|jpg> [--port 9222] [--arm]
 *   --arm 없으면 페이지가 열리고 업로더가 보이는지만 확인(파일 안 넣음).
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const argv = process.argv.slice(2);
const getArg = (n, d = null) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const VIDEO_ID = getArg("--video-id");
const IMAGE = getArg("--image");
const PORT = getArg("--port", "9222");
const ARM = argv.includes("--arm");
if (!VIDEO_ID || !IMAGE) { console.error("ABORT: --video-id, --image 필요"); process.exit(2); }
if (!fs.existsSync(IMAGE)) { console.error(`ABORT: 이미지 없음 ${IMAGE}`); process.exit(2); }
const size = fs.statSync(IMAGE).size;
if (size > 2 * 1024 * 1024) { console.error(`ABORT: Studio 썸네일은 2MB 이하여야 합니다(${(size / 1048576).toFixed(2)}MB) — jpg로 변환하세요.`); process.exit(2); }
const log = (m) => console.log(`[studio-thumb] ${m}`);

const browser = await chromium.connectOverCDP(`http://localhost:${PORT}`);
const context = browser.contexts()[0];
const page = await context.newPage();
try {
  const url = `https://studio.youtube.com/video/${VIDEO_ID}/edit`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(5000);
  if (/accounts\.google\.com|signin/.test(page.url())) { console.error("ABORT: 이 Chrome에 YouTube 로그인이 없습니다(로그인 화면)."); process.exitCode = 3; throw new Error("not-logged-in"); }
  const loader = page.locator("ytcp-thumbnail-uploader #file-loader");
  await loader.waitFor({ state: "attached", timeout: 30000 });
  log(`업로더 확인 OK (${page.url()})`);
  if (!ARM) { log("--arm 없음: 파일은 넣지 않았습니다."); }
  else {
    await loader.setInputFiles(IMAGE);
    log(`파일 입력: ${path.basename(IMAGE)} (${(size / 1024).toFixed(0)}KB)`);
    await page.waitForTimeout(4000);
    const save = page.locator("ytcp-button#save, #save");
    await save.first().click({ timeout: 15000 });
    log("저장 클릭");
    await page.waitForTimeout(6000);
    const text = await page.locator("body").innerText();
    log(/저장됨|변경사항이 저장|Saved/.test(text) ? "저장 완료 메시지 확인" : "저장 메시지는 못 찾음(화면을 직접 확인하세요)");
    const out = path.join(path.dirname(IMAGE), `studio-thumb-${VIDEO_ID}.png`);
    await page.screenshot({ path: out, fullPage: false });
    log(`화면 저장: ${out}`);
  }
} finally {
  await page.close().catch(() => {});
  await browser.close().catch(() => {});
}
