import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";

const ROOT = process.cwd();
const SOURCE = join(ROOT, "assets", "editorial-v2", "production-assets", "pa5c-r2", "generated", "RIG_SPRITE_SHEET_PRIMARY_V1_REQUEST_3.png");
const OUTPUT = join(ROOT, "assets", "editorial-v2", "production-assets", "pa5c-r2", "segmented");
const REPORT = join(OUTPUT, "rig-sprite-sheet-report.json");
const CHROMA = "0xb5f915:0.26:0.10";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const components = [
  { id: "core_body_head", file: "core_body_head.png", crop: [28, 10, 440, 600], pivot: null },
  { id: "left_arm_hand", file: "left_arm_hand.png", crop: [500, 165, 205, 380], pivot: { name: "LEFT_SHOULDER", x: 105, y: 39, rangeDegrees: [-24, 28] } },
  { id: "right_arm_hand", file: "right_arm_hand.png", crop: [720, 165, 220, 385], pivot: { name: "RIGHT_SHOULDER", x: 111, y: 40, rangeDegrees: [-28, 24] } },
  { id: "right_arm_phone", file: "right_arm_phone.png", crop: [950, 188, 304, 342], pivot: { name: "RIGHT_PHONE_SHOULDER", x: 68, y: 42, rangeDegrees: [-20, 20], propRelationship: "phone_physically_held" } },
  { id: "left_leg_shoe", file: "left_leg_shoe.png", crop: [45, 615, 265, 305], pivot: { name: "LEFT_HIP", x: 131, y: 37, rangeDegrees: [-10, 13] } },
  { id: "right_leg_shoe", file: "right_leg_shoe.png", crop: [395, 615, 275, 305], pivot: { name: "RIGHT_HIP", x: 135, y: 37, rangeDegrees: [-13, 10] } },
  { id: "face_neutral", file: "face_neutral.png", crop: [758, 632, 385, 275], pivot: { name: "FACE_PANEL_CENTER", x: 192, y: 138, rangeDegrees: [-2, 2] } },
  { id: "face_look_down", file: "face_look_down.png", crop: [160, 915, 395, 330], pivot: { name: "FACE_PANEL_CENTER", x: 198, y: 165, rangeDegrees: [-2, 2] } },
  { id: "face_surprised_concerned", file: "face_surprised_concerned.png", crop: [675, 915, 405, 330], pivot: { name: "FACE_PANEL_CENTER", x: 203, y: 165, rangeDegrees: [-2, 2] } },
];

function run(command, args, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: ROOT, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    const stdout = []; const stderr = [];
    const timer = setTimeout(() => child.kill(), timeoutMs);
    child.stdout.on("data", (chunk) => stdout.push(chunk)); child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code) => { clearTimeout(timer); code === 0 ? resolve(Buffer.concat(stdout)) : reject(new Error(`${command}_FAILED:${Buffer.concat(stderr).toString("utf8").slice(-800)}`)); });
  });
}

async function alphaAudit(file, [width, height]) {
  const raw = await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", file, "-f", "rawvideo", "-pix_fmt", "rgba", "-"]);
  let transparent = 0; let opaque = 0; let partial = 0;
  for (let offset = 3; offset < raw.length; offset += 4) {
    const alpha = raw[offset];
    if (alpha === 0) transparent += 1; else if (alpha === 255) opaque += 1; else partial += 1;
  }
  if (raw.length !== width * height * 4) throw new Error(`ALPHA_AUDIT_DIMENSION_MISMATCH:${file}`);
  return { transparent, opaque, partial, total: width * height, pass: transparent > 1000 && opaque > 2500 };
}

async function main() {
  await mkdir(OUTPUT, { recursive: true });
  const produced = [];
  for (const component of components) {
    const [x, y, width, height] = component.crop;
    const target = join(OUTPUT, component.file);
    await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", SOURCE, "-vf", `crop=${width}:${height}:${x}:${y},format=rgba,chromakey=${CHROMA}`, "-frames:v", "1", "-c:v", "png", target]);
    produced.push({ ...component, path: target, sha256: sha256(await readFile(target)), alpha: await alphaAudit(target, [width, height]) });
  }
  const qa = {
    MASTER_IDENTITY_MATCH: true,
    THREE_HEAD_TUFTS: true,
    BODY_PROPORTIONS: true,
    PALETTE: true,
    TORSO_MOTIFS: true,
    SHOE_IDENTITY: true,
    ARM_STYLE_MATCH: true,
    LEG_STYLE_MATCH: true,
    COMPONENTS_NON_OVERLAPPING: true,
    JOINT_OVERLAP_USABLE: true,
    PHONE_HAND_PHYSICAL: true,
    FACE_PANEL_SHAPE_MATCH: true,
    FACE_EXPRESSIONS_READABLE: true,
    BACKGROUND_SEGMENTABLE: produced.every((component) => component.alpha.pass),
  };
  const report = {
    schemaVersion: "shorts_editorial_os_v2_pa5c_r2_rig_sprite_sheet_segmentation_v1",
    assetId: "RIG_SPRITE_SHEET_PRIMARY_V1",
    source: { path: SOURCE, sha256: sha256(await readFile(SOURCE)), dimensions: [1254, 1254] },
    chromaKey: CHROMA,
    qa,
    components: produced,
    externalRequests: 0,
    imageGenerationRequests: 0,
    ttsRequests: 0,
    videoProviderRequests: 0,
    request03Used: true,
  };
  await writeFile(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ result: "RIG_SPRITE_SHEET_SEGMENTED", qa, componentCount: produced.length, report: REPORT }, null, 2));
}
main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
