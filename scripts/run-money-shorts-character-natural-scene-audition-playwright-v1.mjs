#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const CAST_PATH = path.join(REPO_ROOT, "lib", "finance-character-cast-data.json");
const SELECTION_PATH = "C:\\tmp\\money-shorts-os\\web-wizard-create-v1\\character-cast-v1\\selection.json";
const DEFAULT_OUT_DIR = "C:\\tmp\\money-shorts-os\\character-natural-scene-audition-v2";
const args = process.argv.slice(2);

function getArg(name) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : null;
}

const outDir = path.resolve(getArg("--out-dir") ?? DEFAULT_OUT_DIR);
const characterIdArg = getArg("--character-id");
const promptAuditOnly = args.includes("--prompt-audit-only");
const generate = args.includes("--generate");
if (promptAuditOnly === generate) {
  console.error("Usage: node run-money-shorts-character-natural-scene-audition-playwright-v1.mjs (--prompt-audit-only | --generate) [--out-dir <C:\\tmp\\money-shorts-os\\...>]");
  process.exit(2);
}
const externalOutputAllowed = /^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+/i.test(outDir + path.sep) && !outDir.startsWith(REPO_ROOT + path.sep);
const localAuditRoot = path.join(REPO_ROOT, ".tmp", "character-natural-scene-audition");
const localPromptAuditAllowed = promptAuditOnly && (outDir + path.sep).startsWith(localAuditRoot + path.sep);
if (!externalOutputAllowed && !localPromptAuditAllowed) {
  console.error("ABORT: output must be outside the repository under C:\\tmp\\money-shorts-os\\");
  process.exit(2);
}

const castData = JSON.parse(fs.readFileSync(CAST_PATH, "utf8"));
const selection = JSON.parse(fs.readFileSync(SELECTION_PATH, "utf8"));
const expectedCharacterIds = ["harin_daily", "junho_cashflow", "seoyun_safety", "minjae_horizon"];
const targetedCharacterIds = characterIdArg
  ? characterIdArg.split(",").map((value) => value.trim()).filter(Boolean)
  : expectedCharacterIds;
if (targetedCharacterIds.some((characterId) => !expectedCharacterIds.includes(characterId))) {
  console.error(`ABORT: unsupported --character-id value: ${characterIdArg}`);
  process.exit(2);
}
const sceneSpecs = {
  harin_daily: {
    topic: "생활비와 소비",
    setting: "a bright lived-in Korean neighborhood grocery store with a full-scale everyday aisle, warm wood display details and clear storefront daylight",
    action: "caught midway through a real shopping decision, she draws one ordinary unlabeled household item back toward the shelf while keeping the chosen item beside her basket; her gaze follows the shelf, not the camera",
    mood: "alert, friendly and quietly satisfied rather than surprised",
    camera: "candid eye-level 40mm three-quarter medium-wide view from within the aisle, off-center character placement and a clear lateral path for a gentle camera move",
    palette: "fresh coral, ivory, leafy green and clear daylight blue",
    motionPlan: "a small eye shift from the compared item to the shelf, one relaxed wrist completing the return, a soft cardigan-hem response, and slow lateral camera parallax across the near shelf",
  },
  junho_cashflow: {
    topic: "월급과 실행습관",
    setting: "a bright compact Korean home office beside an open window and an organized payday planning shelf",
    action: "caught midway through an ordinary payday routine, he slides one plain envelope into a folder with one hand while the other steadies an open unlabeled notebook; his shoulders and weight remain relaxed",
    mood: "focused, confident and approachable without a motivational-speaker pose",
    camera: "candid eye-level 45mm side three-quarter medium view, off-center framing with foreground desk edge and open-window background for a subtle forward camera drift",
    palette: "muted teal, light gray, warm wood and crisp sky blue",
    motionPlan: "a short downward eye movement to the notebook, fingers finishing the envelope slide, a slight weight shift, a faint page-edge response and a slow camera push through separated room layers",
  },
  seoyun_safety: {
    topic: "부채와 생활안전",
    setting: "a bright Korean apartment dining area with a repayment calendar, house key and emergency-fund shelf in the same lived-in space",
    action: "caught midway through a calm household check-in, she finishes one small mark on an unlabeled calendar and begins setting the house key beside a plain savings envelope with naturally grounded hands",
    mood: "calmly decisive and reassuring, with subtle concentration instead of worry or sleepiness",
    camera: "natural eye-level 50mm over-table three-quarter medium view, character placed away from center with a near chair edge, warm window depth and an imperfect everyday arrangement",
    palette: "forest green, warm mustard, soft amber and bright neutral walls",
    motionPlan: "a brief glance from calendar to key, pen hand settling, the key hand completing a short placement, a soft ponytail and jacket response, and gentle over-table camera parallax",
  },
  minjae_horizon: {
    topic: "경제와 장기자산",
    setting: "a luminous Korean reading corner connected to a balcony, with a few unlabeled news cards and a long-horizon planning board",
    action: "caught just after writing a short note, he lowers one plain news card and turns his head slightly toward the bright balcony while keeping the notebook naturally supported near the reading table",
    mood: "curious, awake and forward-looking rather than alarmed or theatrical",
    camera: "candid eye-level 45mm environmental medium-wide view, off-center placement with foreground books, character plane, window light and open balcony depth",
    palette: "cobalt blue, stone gray, clean gold, greenery and luminous daylight",
    motionPlan: "a measured head and eye turn toward the balcony, notebook hand settling, one loose jacket edge responding, leaves moving subtly and a slow camera drift toward the open daylight",
  },
};

const NATURAL_SCENE_STYLE = [
  "Create an original family-feature-quality cinematic 3D animation frame without copying any studio, franchise, film or known character.",
  "Make it unmistakably stylized animated 3D rather than live action: appealing sculpted shapes, gently simplified surfaces and expressive design, while avoiding toy, game-cinematic or fantasy-hero aesthetics.",
  "The visual feeling is bright, warm, emotionally inviting and full of filmic depth, like an intimate adult animated story rather than a finance advertisement.",
  "Use attractive but believable Korean adult facial proportions: eyes only subtly larger than real life, restrained catchlights, defined eyelids, natural nose and jaw structure, slight facial asymmetry and age-appropriate character.",
  "Use soft subsurface skin shading with restrained fine texture, shaped hair strands, tactile woven fabric and physically grounded hands; reject glossy doll eyes, wax skin, plastic skin, porcelain skin, beauty-filter perfection and toy-like anatomy.",
  "Build the character, room, props and lighting together as one single authored cinematic shot. Match perspective, ambient color bounce, contact shadows, foot-floor grounding, hand-object grip and foreground occlusion; no cutout character, pasted-on subject, green-screen edge or composited look.",
  "Direct understated micro-acting in the middle of a small action through a gentle shift of weight, relaxed shoulders, purposeful hands and a subtle expression. No lunging, grabbing toward the camera, superhero stance, frozen identity-board pose or exaggerated shock.",
  "Use bright natural daylight, soft golden bounce and colorful practical accents. Keep facial exposure clear and shadows open; no murky brown grade, horror contrast or gloomy finance mood.",
  "The full-scale setting must feel lived in and specific, with warm wood, fabric, paper, plants and ordinary Korean daily-life details plus small believable imperfections. No laboratory, vault, factory, machine room, black-metal architecture, miniature, dollhouse, showroom-perfect room, catalog portrait or staged advertising set.",
  "Stage distinct foreground, character plane and background depth so a later video can use restrained camera parallax, while keeping clean separation around the eyes, hands and one story prop for subtle local motion.",
].join(" ");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function selectedCharacter(characterId) {
  const character = castData.characters.find((candidate) => candidate.id === characterId);
  const chosen = selection.selections?.[characterId];
  if (!character || !chosen || chosen.candidateNumber !== 2 || typeof chosen.file !== "string") {
    throw new Error(`selected candidate 2 is missing for ${characterId}`);
  }
  if (!fs.existsSync(chosen.file)) throw new Error(`selected reference is missing: ${chosen.file}`);
  const actualHash = sha256(fs.readFileSync(chosen.file));
  if (actualHash !== String(chosen.imageSha256).toLowerCase()) {
    throw new Error(`selected reference hash mismatch for ${characterId}`);
  }
  return { character, chosen, actualHash };
}

function buildPrompt(characterId) {
  const { character } = selectedCharacter(characterId);
  const scene = sceneSpecs[characterId];
  return [
    "GENERATE ONE BRAND-NEW ORIGINAL TEXT-TO-IMAGE ASSET. Start from a blank canvas. Motion-ready character naturalization audition v2 only.",
    NATURAL_SCENE_STYLE,
    `Use the attached identity board only to recognize the same recurring character ${character.name}; output one natural story scene, never an identity board or multiple portraits.`,
    `Preserve this identity and wardrobe: ${character.appearance}; ${character.wardrobe}.`,
    "Translate the reference into a more naturally proportioned final animation scene: keep the recognizable face shape, age, hair, wardrobe and personality, but reduce oversized eye geometry, glassy eye shine and overly smooth facial surfaces.",
    `Finance role: ${character.role}. Scene topic: ${scene.topic}.`,
    `Full-scale setting: ${scene.setting}.`,
    `Natural visible action: ${scene.action}.`,
    `Expression and energy: ${scene.mood}.`,
    `Camera: ${scene.camera}. Color direction: ${scene.palette}.`,
    `Motion-ready staging for later video, visible only as a plausible mid-action moment in this still: ${scene.motionPlan}.`,
    "Compose one vertical 9:16 cinematic frame with foreground, midground and background separation. Keep the lower caption zone calm but visually connected to the room.",
    "No readable text, letters, numbers, UI, logos, brands, watermarks, recognizable currency, extra people, duplicate character, changed hairstyle, changed wardrobe, deformed hands or cropped feet caused by accidental framing.",
  ].join(" ").replace(/\s+/g, " ").trim();
}

function sniffImageDimensions(buffer) {
  if (buffer.length >= 24 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), format: "png" };
  }
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) { offset += 1; continue; }
      const marker = buffer[offset + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5), format: "jpeg" };
      }
      offset += 2 + buffer.readUInt16BE(offset + 2);
    }
  }
  return { width: null, height: null, format: "unknown" };
}

function perceptualHash(buffer) {
  const result = spawnSync(
    "ffmpeg",
    ["-v", "error", "-i", "pipe:0", "-vf", "scale=9:8:flags=area,format=gray", "-frames:v", "1", "-f", "rawvideo", "pipe:1"],
    { input: buffer, shell: false, windowsHide: true, encoding: null, maxBuffer: 1024 * 1024 },
  );
  const pixels = Buffer.isBuffer(result.stdout) ? result.stdout : Buffer.from(result.stdout ?? []);
  if (result.status !== 0 || pixels.length < 72) return null;
  let bits = 0n;
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      bits = (bits << 1n) | BigInt(pixels[y * 9 + x] > pixels[y * 9 + x + 1] ? 1 : 0);
    }
  }
  return bits.toString(16).padStart(16, "0");
}

function perceptualDistance(left, right) {
  if (!/^[a-f0-9]{16}$/i.test(left ?? "") || !/^[a-f0-9]{16}$/i.test(right ?? "")) return null;
  let xor = BigInt(`0x${left}`) ^ BigInt(`0x${right}`);
  let distance = 0;
  while (xor > 0n) {
    distance += Number(xor & 1n);
    xor >>= 1n;
  }
  return distance;
}

const promptRows = expectedCharacterIds.map((characterId) => {
  const { character, chosen, actualHash } = selectedCharacter(characterId);
  const prompt = buildPrompt(characterId);
  return {
    characterId,
    characterName: character.name,
    referenceFile: chosen.file,
    referenceSha256: actualHash,
    promptFingerprint: sha256(prompt).slice(0, 16),
    motionPlan: sceneSpecs[characterId].motionPlan,
    prompt,
  };
});

fs.mkdirSync(outDir, { recursive: true });
if (promptAuditOnly) {
  const bannedPatterns = [/\bDisney\b/i, /photoreal(?:ism|istic)?/i];
  const requiredPatterns = [
    /family-feature-quality cinematic 3D animation/i,
    /unmistakably stylized animated 3D rather than live action/i,
    /bright, warm, emotionally inviting/i,
    /believable Korean adult facial proportions/i,
    /eyes only subtly larger than real life/i,
    /single authored cinematic shot/i,
    /contact shadows, foot-floor grounding, hand-object grip/i,
    /no cutout character, pasted-on subject/i,
    /understated micro-acting/i,
    /in the middle of a small action/i,
    /foreground, character plane and background depth/i,
    /No lunging, grabbing toward the camera/i,
    /No laboratory, vault, factory, machine room, black-metal architecture/i,
    /No readable text/i,
  ];
  const rows = promptRows.map((row) => ({
    ...row,
    requiredPassed: requiredPatterns.every((pattern) => pattern.test(row.prompt)),
    bannedMatches: bannedPatterns.filter((pattern) => pattern.test(row.prompt)).map((pattern) => pattern.source),
  }));
  const audit = {
    schemaVersion: "money_shorts_character_natural_scene_prompt_audit_v2",
    externalActionPerformed: false,
    expectedCount: 4,
    passed: rows.length === 4 && rows.every((row) => row.requiredPassed && row.bannedMatches.length === 0),
    rows,
  };
  const auditPath = path.join(outDir, "prompt-audit.json");
  fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2), "utf8");
  console.log(JSON.stringify({ passed: audit.passed, auditPath, rows: rows.map(({ characterId, characterName, promptFingerprint, requiredPassed, bannedMatches }) => ({ characterId, characterName, promptFingerprint, requiredPassed, bannedMatches })) }, null, 2));
  process.exit(audit.passed ? 0 : 1);
}

if (process.env.ALLOW_CHATGPT_IMAGE !== "1") {
  console.error("ABORT: ALLOW_CHATGPT_IMAGE=1 is required for the four approved audition images");
  process.exit(3);
}

const { chromium } = await import("playwright");
const {
  CDP_PORT_GPT1,
  USER_DATA_GPT1,
  ensureChrome,
  openFreshImageChat,
  detectStop,
  activateImageTool,
  verifyImageToolActive,
  attachRef,
  typePrompt,
  checkSendEnabled,
  sendPrompt,
  isAssistantDone,
  interceptRecover,
} = await import("./_chatgpt-image-core.mjs");

async function fetchImage(page, url) {
  const bytes = await page.evaluate(async (source) => {
    try {
      const response = await fetch(source);
      if (!response.ok) return null;
      return Array.from(new Uint8Array(await response.arrayBuffer()));
    } catch { return null; }
  }, url).catch(() => null);
  return Array.isArray(bytes) && bytes.length > 10_000 ? Buffer.from(bytes) : null;
}

async function collectGeneratedImagesPageWide(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll("img"))
    .filter((image) => image.naturalWidth >= 400 && !image.closest('[data-message-author-role="user"]'))
    .map((image) => {
      const src = image.src || image.currentSrc || image.getAttribute("data-src") || "";
      const match = src.match(/[?&]id=([^&]+)/);
      return { src, cid: match ? match[1] : null, w: image.naturalWidth, h: image.naturalHeight };
    })
    .filter((image) => /backend-api\/estuary\/content|backend-api\/files|oaiusercontent|^blob:/.test(image.src)));
}

async function saveBestResult(page, destination, baselineCids, referenceFile) {
  const referenceBuffer = fs.readFileSync(referenceFile);
  const referencePerceptualHash = perceptualHash(referenceBuffer);
  const ranked = (await collectGeneratedImagesPageWide(page))
    .filter((image) => !image.cid || !baselineCids.has(image.cid))
    .sort((left, right) => (right.w * right.h) - (left.w * left.h));
  for (const image of ranked) {
    const buffer = await fetchImage(page, image.src);
    if (!buffer) continue;
    const distance = perceptualDistance(referencePerceptualHash, perceptualHash(buffer));
    if (distance == null || distance < 10) continue;
    fs.writeFileSync(destination, buffer);
    return { method: "page_wide_non_user_generated_image", buffer, referencePerceptualDistance: distance };
  }
  const intercepted = await interceptRecover(page, page.url());
  const candidates = Array.from(intercepted.values())
    .map((buffer) => ({
      buffer,
      dimensions: sniffImageDimensions(buffer),
      referencePerceptualDistance: perceptualDistance(referencePerceptualHash, perceptualHash(buffer)),
    }))
    .filter((candidate) =>
      candidate.dimensions.width &&
      candidate.dimensions.height &&
      candidate.referencePerceptualDistance != null &&
      candidate.referencePerceptualDistance >= 10)
    .sort((left, right) =>
      right.referencePerceptualDistance - left.referencePerceptualDistance ||
      (right.dimensions.width * right.dimensions.height) - (left.dimensions.width * left.dimensions.height));
  if (candidates[0]) {
    fs.writeFileSync(destination, candidates[0].buffer);
    return {
      method: "current_chat_intercept_reference_filtered",
      buffer: candidates[0].buffer,
      referencePerceptualDistance: candidates[0].referencePerceptualDistance,
    };
  }
  return null;
}

async function generateOne(context, row) {
  const page = await context.newPage();
  const outputPath = path.join(outDir, `${row.characterId}.png`);
  try {
    await openFreshImageChat(page);
    await detectStop(page);
    await activateImageTool(page);
    if (!(await verifyImageToolActive(page))) throw new Error("IMAGE_TOOL_NOT_ACTIVE before reference attach");
    const attachment = await attachRef(page, row.referenceFile);
    await typePrompt(page, row.prompt);
    if (!(await verifyImageToolActive(page))) throw new Error("IMAGE_TOOL_NOT_ACTIVE after prompt input");
    if (!(await checkSendEnabled(page))) throw new Error("SEND_BUTTON_DISABLED");
    await sendPrompt(page);

    const startedAt = Date.now();
    let stableKey = null;
    let stableCount = 0;
    while (Date.now() - startedAt < 210_000) {
      await page.waitForTimeout(Date.now() - startedAt < 25_000 ? 2500 : 1800);
      await detectStop(page);
      const images = (await collectGeneratedImagesPageWide(page))
        .filter((image) => image.w >= 400 && (!image.cid || !attachment.baselineCids.has(image.cid)));
      const current = images.at(-1);
      const key = current ? `${current.cid ?? current.src.slice(0, 80)}|${current.w}x${current.h}` : null;
      if (key && key === stableKey && await isAssistantDone(page)) stableCount += 1;
      else if (key) { stableKey = key; stableCount = 1; }
      if (stableCount >= 3) break;
    }
    const saved = await saveBestResult(page, outputPath, attachment.baselineCids, row.referenceFile);
    if (!saved) throw new Error("GENERATED_IMAGE_NOT_RECOVERED");
    const dimensions = sniffImageDimensions(saved.buffer);
    if (!dimensions.width || !dimensions.height || dimensions.width < 900 || dimensions.height < 1200 || dimensions.height <= dimensions.width) {
      throw new Error(`IMAGE_DIMENSIONS_REJECTED:${JSON.stringify(dimensions)}`);
    }
    return {
      characterId: row.characterId,
      characterName: row.characterName,
      status: "SAVED_OK",
      file: outputPath,
      imageSha256: sha256(saved.buffer),
      width: dimensions.width,
      height: dimensions.height,
      method: saved.method,
      promptFingerprint: row.promptFingerprint,
      motionPlan: row.motionPlan,
      referenceSha256: row.referenceSha256,
      referencePerceptualDistance: saved.referencePerceptualDistance,
      latencyMs: Date.now() - startedAt,
    };
  } finally {
    await page.close().catch(() => {});
  }
}

let browser = null;
const rows = [];
let blockerCode = null;
try {
  await ensureChrome(CDP_PORT_GPT1, USER_DATA_GPT1);
  browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT_GPT1}`);
  const context = browser.contexts()[0] ?? await browser.newContext();
  for (const row of promptRows.filter((candidate) => targetedCharacterIds.includes(candidate.characterId))) {
    const outputPath = path.join(outDir, `${row.characterId}.png`);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    console.log(`Generating natural scene: ${row.characterName} (${row.characterId})`);
    try {
      const result = await generateOne(context, row);
      rows.push(result);
      console.log(`Saved ${row.characterName}: ${result.width}x${result.height}, ${(result.latencyMs / 1000).toFixed(1)}s`);
    } catch (error) {
      blockerCode = "CHARACTER_NATURAL_SCENE_GENERATION_FAILED";
      rows.push({ characterId: row.characterId, characterName: row.characterName, status: "FAILED", error: String(error?.message ?? error).slice(0, 400), promptFingerprint: row.promptFingerprint, motionPlan: row.motionPlan });
      console.error(`${row.characterName} failed: ${String(error?.message ?? error)}`);
      break;
    }
  }
} finally {
  const summary = {
    schemaVersion: "money_shorts_character_natural_scene_audition_v2",
    styleContract: "original_bright_integrated_motion_ready_cinematic_family_3d_v2",
    targetedCharacterIds,
    generatedCount: rows.filter((row) => row.status === "SAVED_OK").length,
    expectedCount: targetedCharacterIds.length,
    allReady: rows.length === targetedCharacterIds.length && rows.every((row) => row.status === "SAVED_OK"),
    manualVisualReviewRequired: true,
    sharedEngineUpdated: false,
    externalUploadPerformed: false,
    blockerCode,
    rows,
    finishedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2), "utf8");
  await browser?.close().catch(() => {});
  console.log(JSON.stringify({ allReady: summary.allReady, generatedCount: summary.generatedCount, blockerCode, summaryPath: path.join(outDir, "summary.json") }, null, 2));
  if (!summary.allReady) process.exitCode = 1;
}
