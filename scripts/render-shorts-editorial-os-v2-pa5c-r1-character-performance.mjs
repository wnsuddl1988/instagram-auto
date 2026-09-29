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
const OUTPUT_ROOT = join(ROOT, "output", "shorts-editorial-os-v2", "pa5c-r1-character-performance");
const DERIVED_ROOT = join(OUTPUT_ROOT, "derived-transparent");
const SPIKE_ROOT = join(OUTPUT_ROOT, "internal-motion-spike");
const PROOF_ROOT = join(OUTPUT_ROOT, "scene01-corrected-proof");
const ASSET_ROOT = join(ROOT, "assets", "editorial-v2", "production-assets", "pa5b4");
const FONT = "'Malgun Gothic','Apple SD Gothic Neo',sans-serif";
const SOURCE = {
  background: join(ASSET_ROOT, "batch-d", "accepted", "BG_EVENING_DESK_01_replacement_v2.png"),
  phone: join(ASSET_ROOT, "accepted", "character", "CHAR_PROP_PHONE_01.png"),
  surprised: join(ASSET_ROOT, "accepted", "character", "CHAR_EXPR_SURPRISED_01.png"),
  explain: join(ASSET_ROOT, "accepted", "character", "CHAR_POSE_OPEN_EXPLAIN_01.png"),
};
const DIMENSIONS = {
  phone: [1122, 1402],
  surprised: [1122, 1402],
  explain: [1370, 1148],
};

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function esc(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
function clamp(value, min = 0, max = 1) { return Math.max(min, Math.min(max, value)); }
function ease(value) { const t = clamp(value); return t * t * (3 - 2 * t); }
function lerp(a, b, t) { return a + (b - a) * clamp(t); }
function dataUri(buffer) { return `data:image/png;base64,${buffer.toString("base64")}`; }

function run(command, args, cwd = ROOT, timeoutMs = 300_000) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    const timer = setTimeout(() => child.kill(), timeoutMs);
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`${command} failed (${code}): ${Buffer.concat(stderr).toString("utf8").slice(-1200)}`));
      else resolvePromise(Buffer.concat(stdout));
    });
  });
}

async function extractTransparency(name, source) {
  const target = join(DERIVED_ROOT, `${name}.png`);
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", source, "-vf", "format=rgba,chromakey=0xf210e5:0.12:0.25", "-frames:v", "1", "-c:v", "png", target], ROOT, 120_000);
  return { source, target, sourceSha256: sha256(await readFile(source)), derivedSha256: sha256(await readFile(target)) };
}

function faceRig(kind, expression, gazeX, gazeY, headX, headY, headTilt) {
  const map = kind === "explain"
    ? { x: 220, y: 245, w: 370, h: 232, left: 326, right: 470, eyeY: 350, browY: 292, mouthX: 399, mouthY: 423, eyeRx: 43, eyeRy: 49 }
    : { x: 405, y: 355, w: 410, h: 277, left: 530, right: 688, eyeY: 490, browY: 423, mouthX: 610, mouthY: 578, eyeRx: 48, eyeRy: 55 };
  const brow = expression === "concern" ? "-12" : expression === "surprise" ? "-18" : "0";
  const mouth = expression === "surprise"
    ? `<ellipse cx="${map.mouthX}" cy="${map.mouthY}" rx="34" ry="42" fill="#243044"/><ellipse cx="${map.mouthX}" cy="${map.mouthY + 16}" rx="18" ry="10" fill="#f597a9"/>`
    : expression === "concern"
      ? `<path d="M ${map.mouthX - 36} ${map.mouthY + 18} Q ${map.mouthX} ${map.mouthY - 12} ${map.mouthX + 36} ${map.mouthY + 18}" fill="none" stroke="#243044" stroke-width="17" stroke-linecap="round"/>`
      : expression === "neutral"
        ? `<path d="M ${map.mouthX - 31} ${map.mouthY} Q ${map.mouthX} ${map.mouthY + 5} ${map.mouthX + 31} ${map.mouthY}" fill="none" stroke="#243044" stroke-width="16" stroke-linecap="round"/>`
        : `<path d="M ${map.mouthX - 38} ${map.mouthY - 6} Q ${map.mouthX} ${map.mouthY + 35} ${map.mouthX + 38} ${map.mouthY - 6} Q ${map.mouthX} ${map.mouthY + 53} ${map.mouthX - 38} ${map.mouthY - 6}" fill="#243044"/><path d="M ${map.mouthX - 17} ${map.mouthY + 27} Q ${map.mouthX} ${map.mouthY + 44} ${map.mouthX + 17} ${map.mouthY + 27}" fill="#f597a9"/>`;
  const eye = (cx) => `<ellipse cx="${cx}" cy="${map.eyeY}" rx="${map.eyeRx}" ry="${map.eyeRy}" fill="#fdfefe" stroke="#5a7894" stroke-width="7"/><circle cx="${cx + gazeX}" cy="${map.eyeY + gazeY}" r="${map.eyeRx * .58}" fill="#15283c"/><circle cx="${cx + gazeX + 10}" cy="${map.eyeY + gazeY - 11}" r="${map.eyeRx * .18}" fill="white"/>`;
  return `<g data-rig-layer="face_panel" transform="translate(${headX} ${headY}) rotate(${headTilt} ${map.x + map.w / 2} ${map.y + map.h / 2})"><rect x="${map.x}" y="${map.y}" width="${map.w}" height="${map.h}" rx="${map.h * .42}" fill="url(#facePanel)" opacity=".94" stroke="#3d7ed0" stroke-width="8"/><g data-rig-layer="left_brow" transform="rotate(${brow} ${map.left} ${map.browY})"><path d="M ${map.left - 33} ${map.browY + 12} Q ${map.left} ${map.browY - 13} ${map.left + 33} ${map.browY + 9}" fill="none" stroke="#263354" stroke-width="18" stroke-linecap="round"/></g><g data-rig-layer="right_brow" transform="rotate(${-Number(brow)} ${map.right} ${map.browY})"><path d="M ${map.right - 33} ${map.browY + 9} Q ${map.right} ${map.browY - 13} ${map.right + 33} ${map.browY + 12}" fill="none" stroke="#263354" stroke-width="18" stroke-linecap="round"/></g><g data-rig-layer="left_eye">${eye(map.left)}</g><g data-rig-layer="right_eye">${eye(map.right)}</g><g data-rig-layer="mouth">${mouth}</g></g>`;
}

function characterLayer(state, art, t) {
  const isPhone = state === "phone";
  const isSurprise = state === "surprise";
  const sourceWidth = DIMENSIONS[state][0];
  const scale = isPhone ? .60 : isSurprise ? .60 : .55;
  const baseX = isPhone ? 4 : isSurprise ? 42 : 0;
  const baseY = isPhone ? 648 : isSurprise ? 540 : 760;
  const phase = isPhone ? t / 2 : isSurprise ? (t - 2) / 2.2 : (t - 4.2) / 2.2;
  const weightShift = Math.sin(phase * Math.PI) * (isSurprise ? 12 : 7);
  const lean = isPhone ? lerp(-2, 4, ease(phase)) : isSurprise ? lerp(2, -6, ease(phase)) : lerp(-4, 1, ease(phase));
  const gaze = isPhone
    ? { x: lerp(-7, -18, ease((t - .35) / .8)), y: 8, expression: t < 1.35 ? "smile" : "neutral" }
    : isSurprise
      ? { x: lerp(-13, 20, ease((t - 2.05) / .65)), y: -3, expression: t < 3.1 ? "surprise" : "concern" }
      : { x: lerp(14, 0, ease((t - 4.6) / 1.1)), y: -2, expression: t < 5.25 ? "neutral" : "smile" };
  const blink = (t > 1.52 && t < 1.66) || (t > 3.55 && t < 3.68) || (t > 5.78 && t < 5.9);
  const headY = blink ? 8 : 0;
  const face = faceRig(state, gaze.expression, gaze.x, blink ? 0 : gaze.y, 0, headY, lean * .45);
  const phoneAngle = lerp(-7, 9, ease((t - .1) / 1.65));
  const phoneGlow = isPhone ? `<g data-rig-layer="prop_layer" transform="rotate(${phoneAngle} 222 650)"><rect x="125" y="455" width="237" height="340" rx="33" fill="#0b4e74" opacity=".20" stroke="#8bf4ff" stroke-width="9"/><path d="M 160 518 H 323" stroke="#baf9ff" stroke-width="10" stroke-linecap="round" opacity="${.45 + .25 * Math.sin(t * 9)}"/></g>` : "";
  const bodyShadow = `<ellipse cx="${sourceWidth / 2}" cy="${DIMENSIONS[state][1] - 55}" rx="255" ry="33" fill="#17233d" opacity=".17"/>`;
  return `<g data-rig-layer="body" transform="translate(${baseX} ${baseY + weightShift}) scale(${scale}) rotate(${lean} ${sourceWidth / 2} ${DIMENSIONS[state][1] - 30})">${bodyShadow}<image href="${art}" width="${sourceWidth}" height="${DIMENSIONS[state][1]}"/><g data-rig-layer="head_tuft_group">${face}</g>${phoneGlow}</g>`;
}

function foregroundPhone(t) {
  if (t < 1.4 || t > 2.45) return "";
  const p = ease((t - 1.4) / 1.05);
  const x = lerp(195, 760, p);
  const y = lerp(1110, 1330, p);
  const rotation = lerp(-8, 18, p);
  const opacity = t > 2.15 ? 1 - ease((t - 2.15) / .3) : 1;
  return `<g data-rig-layer="prop_layer" transform="translate(${x} ${y}) rotate(${rotation})" opacity="${opacity}"><rect x="-70" y="-118" width="140" height="236" rx="20" fill="#20324e" stroke="#88e8f3" stroke-width="9"/><rect x="-54" y="-91" width="108" height="166" rx="10" fill="#175f82"/><path d="M -35 -46 H 35" stroke="#bdf8ff" stroke-width="8" stroke-linecap="round"/></g>`;
}

function calendarCarry(t) {
  const visible = ease((t - 2.45) / .5);
  const flow = ease((t - 3.1) / 1.35);
  return `<g opacity="${visible}"><path d="M 536 990 C 672 920 777 782 905 705" fill="none" stroke="#ffd36f" stroke-width="16" stroke-linecap="round" stroke-dasharray="${Math.round(420 * flow)} 500"/><path d="M 894 710 l 26 -36 l 9 44" fill="none" stroke="#ffd36f" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" opacity="${flow}"/><g transform="translate(770 548)" opacity="${flow}"><path d="M 0 28 Q 0 0 28 0 H 190 Q 218 0 218 28 V 178 H 0 Z" fill="#fff0bf" stroke="#8b5a3b" stroke-width="6"/><path d="M 0 45 H 218" stroke="#d6925d" stroke-width="9"/><text x="109" y="111" text-anchor="middle" font-family="${FONT}" font-size="29" font-weight="800" fill="#2b344b">다음 달</text><text x="109" y="148" text-anchor="middle" font-family="${FONT}" font-size="21" font-weight="700" fill="#78523f">남은 금액</text></g><text x="651" y="940" font-family="${FONT}" font-size="35" font-weight="800" fill="#5c3f27" opacity="${flow}">남은 금액은 다음 달로</text></g>`;
}

function subtitle(t, duration, spike) {
  if (spike) return "";
  const chunks = [
    [0, 1.35, "카드값 일부만 냈는데,"],
    [1.35, 2.4, "연체가 아니라고요?"],
    [2.4, 4.15, "그래도 남은 금액은"],
    [4.15, duration, "다음 달로 넘어갈 수 있어요."],
  ];
  const chunk = chunks.find(([start, end]) => t >= start && t < end) ?? chunks.at(-1);
  const local = chunk ? clamp((t - chunk[0]) / .18) : 1;
  const y = 1714 + (1 - ease(local)) * 20;
  return `<text x="540" y="${y}" text-anchor="middle" font-family="${FONT}" font-size="52" font-weight="800" fill="#fffdf6" stroke="#172237" stroke-width="12" paint-order="stroke" stroke-linejoin="round" opacity="${ease(local)}">${esc(chunk?.[2] ?? "")}</text><text x="540" y="1847" text-anchor="middle" font-family="${FONT}" font-size="21" font-weight="700" fill="#e9d6bd" opacity=".92">금융위원회 안내 기반 · 구조 설명</text>`;
}

function frameMarkup({ t, duration, spike, art }) {
  const camera = 1 + .018 * ease((t - 2.45) / 1.1) - .008 * ease((t - 5.2) / .8);
  const backgroundX = -24 - 12 * ease((t - 2.4) / 1.3);
  const backgroundY = -36 - 14 * ease((t - 2.4) / 1.3);
  const state = t < 2.05 ? "phone" : t < 4.35 ? "surprised" : "explain";
  const wipe1 = t >= 1.78 && t <= 2.1 ? `<path d="M ${-300 + 1700 * ease((t - 1.78) / .32)} 0 H ${-80 + 1700 * ease((t - 1.78) / .32)} L ${240 + 1700 * ease((t - 1.78) / .32)} 1920 H ${20 + 1700 * ease((t - 1.78) / .32)} Z" fill="#fff3d2" opacity=".64"/>` : "";
  const wipe2 = t >= 4.08 && t <= 4.42 ? `<path d="M 1080 ${-280 + 1880 * ease((t - 4.08) / .34)} V ${-70 + 1880 * ease((t - 4.08) / .34)} L 0 ${250 + 1880 * ease((t - 4.08) / .34)} V ${40 + 1880 * ease((t - 4.08) / .34)} Z" fill="#ffe9a6" opacity=".38"/>` : "";
  const hookOpacity = spike ? 0 : 1 - ease((t - 1.85) / .25);
  const hook = `<g opacity="${hookOpacity}"><text x="72" y="137" font-family="${FONT}" font-size="54" font-weight="900" fill="#fffdf7">연체 아님</text><text x="348" y="137" font-family="${FONT}" font-size="54" font-weight="900" fill="#f5c567">≠</text><text x="418" y="137" font-family="${FONT}" font-size="54" font-weight="900" fill="#fffdf7">잔액 없음</text><path d="M 74 159 H 722" stroke="#f5c567" stroke-width="7" stroke-linecap="round"/></g>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden;background:#141c2c}svg{display:block;width:${WIDTH}px;height:${HEIGHT}px}</style></head><body><svg viewBox="0 0 ${WIDTH} ${HEIGHT}" aria-label="PA5C R1 local character performance frame"><defs><radialGradient id="facePanel" cx="45%" cy="25%"><stop offset="0" stop-color="#c6fbff"/><stop offset=".55" stop-color="#76e7f4"/><stop offset="1" stop-color="#49bfe1"/></radialGradient><filter id="shadow"><feGaussianBlur stdDeviation="12"/></filter></defs><g transform="translate(${backgroundX} ${backgroundY}) scale(${camera})"><image href="${art.background}" width="${WIDTH + 72}" height="${HEIGHT + 90}" preserveAspectRatio="xMidYMid slice"/><rect width="1080" height="1920" fill="#311b2f" opacity=".08"/>${calendarCarry(t)}${characterLayer(state, art[state], t)}${foregroundPhone(t)}${wipe1}${wipe2}</g>${hook}${subtitle(t, duration, spike)}</svg></body></html>`;
}

async function renderSequence({ name, duration, spike, art }) {
  const root = spike ? SPIKE_ROOT : PROOF_ROOT;
  const frames = join(root, "frames");
  const output = join(root, `${name}.mp4`);
  await mkdir(frames, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ["--disable-background-networking", "--disable-component-update", "--disable-default-apps", "--disable-sync"] });
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1, locale: "ko-KR", colorScheme: "dark" });
  const page = await context.newPage();
  let externalRequests = 0;
  page.on("request", (request) => { if (!request.url().startsWith("data:") && !request.url().startsWith("about:")) externalRequests += 1; });
  await page.route("**/*", (route) => route.abort("blockedbyclient"));
  try {
    const count = Math.round(duration * CAPTURE_FPS);
    for (let frame = 0; frame < count; frame += 1) {
      const at = frame / CAPTURE_FPS;
      await page.setContent(frameMarkup({ t: at, duration, spike, art }), { waitUntil: "domcontentloaded", timeout: 15_000 });
      await page.screenshot({ path: join(frames, `frame-${String(frame).padStart(4, "0")}.png`), type: "png" });
    }
  } finally {
    await page.close().catch(() => undefined);
    await context.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }
  if (externalRequests !== 0) throw new Error(`PA5C_R1_EXTERNAL_BROWSER_REQUEST_DETECTED:${externalRequests}`);
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(CAPTURE_FPS), "-i", join(frames, "frame-%04d.png"), "-vf", `fps=${FPS}`, "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", output], root, 300_000);
  return { output, frameCount: Math.round(duration * CAPTURE_FPS), captureFps: CAPTURE_FPS, externalRequests };
}

async function ffprobe(path) {
  const parsed = JSON.parse((await run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", path], ROOT, 60_000)).toString("utf8"));
  const video = parsed.streams.find((stream) => stream.codec_type === "video");
  const audio = parsed.streams.find((stream) => stream.codec_type === "audio");
  const [num, den] = String(video?.avg_frame_rate ?? "0/1").split("/").map(Number);
  const result = { width: Number(video?.width), height: Number(video?.height), fps: num / den, hasAudio: Boolean(audio), durationMs: Math.round(Number(parsed.format?.duration ?? 0) * 1000) };
  if (result.width !== WIDTH || result.height !== HEIGHT || Math.abs(result.fps - FPS) > .01 || result.hasAudio) throw new Error(`PA5C_R1_FFPROBE_INVALID:${JSON.stringify(result)}`);
  return result;
}

async function extractQa(video, root, name, at) {
  const path = join(root, "qa", `${name}.png`);
  await mkdir(join(root, "qa"), { recursive: true });
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-ss", String(at), "-i", video, "-frames:v", "1", path], root, 60_000);
  return path;
}

async function main() {
  await rm(OUTPUT_ROOT, { recursive: true, force: true });
  await mkdir(DERIVED_ROOT, { recursive: true });
  const derived = {
    phone: await extractTransparency("CHAR_PROP_PHONE_01", SOURCE.phone),
    surprised: await extractTransparency("CHAR_EXPR_SURPRISED_01", SOURCE.surprised),
    explain: await extractTransparency("CHAR_POSE_OPEN_EXPLAIN_01", SOURCE.explain),
  };
  const art = {
    background: dataUri(await readFile(SOURCE.background)),
    phone: dataUri(await readFile(derived.phone.target)),
    surprised: dataUri(await readFile(derived.surprised.target)),
    explain: dataUri(await readFile(derived.explain.target)),
  };
  const spike = await renderSequence({ name: "internal_character_motion_spike", duration: 5.2, spike: true, art });
  const proof = await renderSequence({ name: "scene01_corrected_character_performance", duration: 6.4, spike: false, art });
  const spikeProbe = await ffprobe(spike.output);
  const proofProbe = await ffprobe(proof.output);
  const qaFrames = {
    relief: await extractQa(proof.output, PROOF_ROOT, "01-relief-phone-gaze", 1.0),
    notice: await extractQa(proof.output, PROOF_ROOT, "02-notice-eye-first", 2.85),
    reaction: await extractQa(proof.output, PROOF_ROOT, "03-reaction-carryover", 3.75),
    settle: await extractQa(proof.output, PROOF_ROOT, "04-settle-explain", 5.45),
  };
  const report = {
    schemaVersion: "shorts_editorial_os_v2_pa5c_r1_character_performance_v1",
    classification: "PA5C_R1_LOCAL_HYBRID_2D_CHARACTER_PERFORMANCE_RIG",
    sceneId: "selected-angle:revolving-balance-not-erased:scene:01",
    sourceAssets: { background: { path: SOURCE.background, sha256: sha256(await readFile(SOURCE.background)) }, derived },
    independentPerformanceChannels: ["face_panel", "left_eye", "right_eye", "left_brow", "right_brow", "mouth", "prop_layer", "body_posture", "camera_reframe"],
    motionArc: ["relief_phone_gaze", "notice_eye_first", "carryover_discovery", "reaction_recoil", "explanation_settle"],
    subtitleStyle: "lower_center_direct_canvas_text_with_dark_outline_no_card",
    externalRequests: 0,
    imageGenerationRequests: 0,
    ttsRequests: 0,
    videoProviderRequests: 0,
    internalSpike: { ...spike, ffprobe: spikeProbe, sha256: sha256(await readFile(spike.output)) },
    correctedProof: { ...proof, ffprobe: proofProbe, sha256: sha256(await readFile(proof.output)), qaFrames },
    pa6aAuthorized: false,
  };
  await writeFile(join(OUTPUT_ROOT, "pa5c-r1-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ spike: spike.output, proof: proof.output, spikeProbe, proofProbe, qaFrames, externalRequests: 0, ttsRequests: 0 }, null, 2));
}

main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
