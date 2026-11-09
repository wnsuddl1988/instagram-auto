import { createHash } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const ROOT = process.cwd();
const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const CAPTURE_FPS = 15;
const DURATION = 5.2;
const OUTPUT = join(ROOT, "output", "shorts-editorial-os-v2", "pa5c-r2-rig-feasibility");
const FRAMES = join(OUTPUT, "frames");
const SOURCE = join(ROOT, "assets", "editorial-v2", "production-assets", "pa5c-r2", "generated", "RIG_BASE_PRIMARY_A_POSE_REQUEST_02.png");
const BACKGROUND = join(ROOT, "assets", "editorial-v2", "production-assets", "pa5b4", "batch-d", "accepted", "BG_EVENING_DESK_01_replacement_v2.png");
const TRANSPARENT = join(OUTPUT, "derived", "RIG_BASE_PRIMARY_A_POSE_alpha.png");
const VIDEO = join(OUTPUT, "pa5c-r2-rig-motion-spike.mp4");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const ease = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const lerp = (from, to, value) => from + (to - from) * clamp(value);
const dataUri = (buffer) => `data:image/png;base64,${buffer.toString("base64")}`;

function run(command, args, timeoutMs = 300000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: ROOT, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    const stdout = []; const stderr = [];
    const timer = setTimeout(() => child.kill(), timeoutMs);
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code) => { clearTimeout(timer); code === 0 ? resolve(Buffer.concat(stdout)) : reject(new Error(`${command}_FAILED:${Buffer.concat(stderr).toString("utf8").slice(-1000)}`)); });
  });
}

function rigFrame(t, art) {
  const phase = t < 1.4 ? "phone" : t < 2.55 ? "notice" : t < 3.75 ? "reaction" : "explain";
  const phoneReach = ease((t - 0.1) / 1.15);
  const notice = ease((t - 1.35) / 0.65);
  const reaction = ease((t - 2.55) / 0.65);
  const explain = ease((t - 3.75) / 0.7);
  const camera = phase === "phone" ? 1.05 : phase === "notice" ? 1.15 : phase === "reaction" ? 1.08 : 1.18;
  const cameraX = phase === "notice" ? -58 : phase === "reaction" ? 25 : phase === "explain" ? -40 : 0;
  const bodyY = phase === "reaction" ? -20 * reaction : 8 * Math.sin(t * 4);
  const leftArm = phase === "phone" ? lerp(-10, 34, phoneReach) : phase === "reaction" ? lerp(34, -42, reaction) : phase === "explain" ? -32 + 16 * Math.sin(t * 5) : 18;
  const rightArm = phase === "phone" ? lerp(9, -31, phoneReach) : phase === "reaction" ? lerp(-31, 45, reaction) : phase === "explain" ? 26 + 18 * Math.sin(t * 5 + 1) : -13;
  const leftLeg = phase === "reaction" ? -7 * reaction : 3 * Math.sin(t * 3);
  const rightLeg = phase === "reaction" ? 7 * reaction : -3 * Math.sin(t * 3);
  const gazeX = phase === "phone" ? -18 * phoneReach : phase === "notice" ? 20 * notice : phase === "reaction" ? 5 : -8;
  const gazeY = phase === "phone" ? 10 : phase === "notice" ? -5 : 0;
  const blink = (t > 1.92 && t < 2.08) || (t > 3.05 && t < 3.18) || (t > 4.62 && t < 4.74);
  const mouth = phase === "reaction" ? `<ellipse cx="560" cy="581" rx="31" ry="38" fill="#243044"/><ellipse cx="560" cy="597" rx="16" ry="10" fill="#f4a0b5"/>` : phase === "explain" ? `<path d="M528 579 Q560 610 592 579" fill="none" stroke="#243044" stroke-width="15" stroke-linecap="round"/>` : `<path d="M532 580 Q560 591 588 580" fill="none" stroke="#243044" stroke-width="14" stroke-linecap="round"/>`;
  const eye = (x) => `<g data-rig-layer="${x < 560 ? "left_eye" : "right_eye"}"><circle cx="${x + gazeX}" cy="${478 + gazeY}" r="34" fill="#15283c"/><circle cx="${x + gazeX + 10}" cy="${466 + gazeY}" r="9" fill="#fff"/>${blink ? `<rect x="${x - 47}" y="429" width="94" height="99" rx="45" fill="#75e5f2"/>` : ""}</g>`;
  const phone = phase === "phone" ? `<g data-rig-layer="prop_phone" transform="translate(${lerp(195, 285, phoneReach)} ${lerp(1285, 1130, phoneReach)}) rotate(${lerp(-18, 8, phoneReach)})"><rect x="-86" y="-145" width="172" height="290" rx="28" fill="#17263e" stroke="#8cf3ff" stroke-width="10"/><rect x="-67" y="-110" width="134" height="193" rx="14" fill="#3a93bc"/><path d="M-35 -40 H35 M-35 -4 H18" stroke="#cbfbff" stroke-width="12" stroke-linecap="round"/></g>` : "";
  const calendar = phase === "explain" ? `<g data-rig-layer="information_calendar" transform="translate(708 595)" opacity="${explain}"><rect width="248" height="214" rx="26" fill="#fff3cd" stroke="#85553e" stroke-width="8"/><path d="M0 53H248" stroke="#df9569" stroke-width="13"/><text x="124" y="120" text-anchor="middle" font-family="Malgun Gothic,sans-serif" font-size="34" font-weight="800" fill="#26364c">다음 달</text><text x="124" y="163" text-anchor="middle" font-family="Malgun Gothic,sans-serif" font-size="24" font-weight="700" fill="#715140">남은 금액</text></g>` : "";
  const label = phase === "phone" ? "카드값 일부만 냈는데" : phase === "notice" ? "남은 금액은 사라지지 않아요" : phase === "reaction" ? "다음 달로 이어질 수 있어요" : "내 결제일과 청구서를 확인하세요";
  const crop = (id, x, y, width, height, transform = "") => `<g data-rig-layer="${id}" transform="${transform}"><clipPath id="clip-${id}"><rect x="${x}" y="${y}" width="${width}" height="${height}"/></clipPath><image href="${art.character}" width="1122" height="1402" clip-path="url(#clip-${id})"/></g>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden;background:#18243a}svg{display:block;width:${WIDTH}px;height:${HEIGHT}px}</style></head><body><svg viewBox="0 0 ${WIDTH} ${HEIGHT}" aria-label="PA5C R2 articulated character rig feasibility spike"><defs><filter id="shadow"><feGaussianBlur stdDeviation="13"/></filter></defs><image href="${art.background}" width="1080" height="1920" preserveAspectRatio="xMidYMid slice"/><rect width="1080" height="1920" fill="#14233b" opacity=".18"/><g transform="translate(${cameraX} -40) scale(${camera})"><ellipse cx="570" cy="1495" rx="300" ry="47" fill="#131c2e" opacity=".32" filter="url(#shadow)"/><g transform="translate(120 ${320 + bodyY}) scale(.75)">${crop("left_leg", 300, 920, 255, 435, `rotate(${leftLeg} 470 950)`)}${crop("right_leg", 545, 920, 260, 435, `rotate(${rightLeg} 660 950)`)}${crop("body_core", 245, 450, 645, 530)}${crop("head_group", 255, 85, 620, 555, `translate(0 ${phase === "reaction" ? -12 * reaction : 0})`)}${crop("left_arm", 95, 565, 285, 440, `rotate(${leftArm} 350 635)`)}${crop("right_arm", 745, 565, 280, 440, `rotate(${rightArm} 775 635)`)}<g data-rig-layer="face_controls">${eye(457)}${eye(660)}<g data-rig-layer="mouth">${mouth}</g></g></g>${phone}${calendar}</g><g><rect x="50" y="130" width="980" height="138" rx="36" fill="#14223a" opacity=".87"/><text x="540" y="190" text-anchor="middle" font-family="Malgun Gothic,sans-serif" font-size="43" font-weight="900" fill="#fffdf6">${label}</text><text x="540" y="235" text-anchor="middle" font-family="Malgun Gothic,sans-serif" font-size="24" font-weight="700" fill="#a8e8f0">팔·시선·표정·소품을 각각 제어하는 로컬 리그 검증</text></g></svg></body></html>`;
}

async function probe(videoPath) {
  const parsed = JSON.parse((await run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", videoPath], 60000)).toString("utf8"));
  const stream = parsed.streams.find((item) => item.codec_type === "video");
  const [n, d] = String(stream.avg_frame_rate).split("/").map(Number);
  return { width: stream.width, height: stream.height, fps: n / d, durationMs: Math.round(Number(parsed.format.duration) * 1000) };
}

async function main() {
  await rm(OUTPUT, { recursive: true, force: true });
  await mkdir(FRAMES, { recursive: true });
  await mkdir(join(OUTPUT, "derived"), { recursive: true });
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", SOURCE, "-vf", "format=rgba,chromakey=0xb7f800:0.22:0.12", "-frames:v", "1", "-c:v", "png", TRANSPARENT], 120000);
  const art = { character: dataUri(await readFile(TRANSPARENT)), background: dataUri(await readFile(BACKGROUND)) };
  const browser = await chromium.launch({ headless: true, args: ["--disable-background-networking", "--disable-component-update", "--disable-sync"] });
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1, locale: "ko-KR" });
  const page = await context.newPage();
  let externalRequests = 0;
  page.on("request", (request) => { if (!request.url().startsWith("data:") && !request.url().startsWith("about:")) externalRequests += 1; });
  await page.route("**/*", (route) => route.abort("blockedbyclient"));
  try {
    for (let index = 0; index < Math.round(DURATION * CAPTURE_FPS); index += 1) {
      await page.setContent(rigFrame(index / CAPTURE_FPS, art), { waitUntil: "domcontentloaded" });
      await page.screenshot({ path: join(FRAMES, `frame-${String(index).padStart(4, "0")}.png`) });
    }
  } finally { await page.close(); await context.close(); await browser.close(); }
  if (externalRequests !== 0) throw new Error(`RIG_SPIKE_EXTERNAL_REQUESTS:${externalRequests}`);
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(CAPTURE_FPS), "-i", join(FRAMES, "frame-%04d.png"), "-vf", `fps=${FPS}`, "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-an", VIDEO], 300000);
  const qa = {};
  for (const [name, at] of Object.entries({ phone: .8, gaze: 1.8, reaction: 3.15, explain: 4.55 })) {
    const target = join(OUTPUT, "qa", `${name}.png`); await mkdir(join(OUTPUT, "qa"), { recursive: true }); await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-ss", String(at), "-i", VIDEO, "-frames:v", "1", target], 60000); qa[name] = target;
  }
  const report = { schemaVersion: "shorts_editorial_os_v2_pa5c_r2_rig_feasibility_v1", source: { path: SOURCE, sha256: sha256(await readFile(SOURCE)) }, transparency: { path: TRANSPARENT, sha256: sha256(await readFile(TRANSPARENT)), chromaKey: "0xb7f800:0.22:0.12" }, components: ["head_group", "body_core", "left_arm", "right_arm", "left_leg", "right_leg", "left_eye", "right_eye", "mouth", "prop_phone", "information_calendar"], proof: { path: VIDEO, sha256: sha256(await readFile(VIDEO)), probe: await probe(VIDEO), durationSeconds: DURATION, qa }, externalRequests, imageGenerationRequests: 0, ttsRequests: 0, videoProviderRequests: 0, request03Used: false };
  await writeFile(join(OUTPUT, "pa5c-r2-rig-feasibility-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}
main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
