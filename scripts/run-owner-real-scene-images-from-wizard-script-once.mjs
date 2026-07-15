#!/usr/bin/env node
/**
 * run-owner-real-scene-images-from-wizard-script-once.mjs
 * task: owner-web-real-script-voice-visual-generation-pipeline-v1
 *
 * 웹 위저드 확정 대본(script-final.json)의 흐름 기반 동적 장면(visualCue) 기준으로
 * ChatGPT+Playwright(로그인된 CDP Chrome) 실제 장면 이미지를 생성한다.
 * 감지/저장 로직은 fresh-image-set-v3에서 실증된 방식 그대로:
 *   · 제출 후 25초 passive(중단 조건만 감시) → 1.8초 간격 active poll
 *   · page-wide estuary/oaiusercontent/blob 수집 (user 첨부 제외, baseline cid 제외)
 *   · 신규 후보 3회 연속 stable(같은 key+크기)이면 즉시 저장
 *   · 150초 미감지: current-page intercept 회수 1회 → 180초 회수 불가: TIMEOUT_BLOCKED
 *
 * fail-closed 계약:
 *   · ALLOW_CHATGPT_IMAGE=1 없으면 즉시 종료(exit 3, summary BLOCKED_GATE) — 어떤 브라우저도 열지 않음
 *   · ChatGPT 미로그인/세션 불가 → exit 3, summary BLOCKED_SESSION
 *   · 기본 장면당 제출 1회. 명시적인 신규/편집 라우팅 오인 응답에만 새 대화 1회 복구 허용
 *   · 이미 저장된 장면 파일은 건너뜀(재실행 시 모자란 장면만 생성)
 *
 * 보안: OpenAI/FLUX2/Gemini/Midjourney/유료 API 금지. .env.local/.money-shorts-local/secret 접근 금지.
 *       fetch는 CDP 확인/estuary 회수 용도만. 업로드/DB/OAuth 없음. out-dir은 repo 밖 필수.
 *
 * exit codes: 0 = 전체 장면 SAVED_OK · 1 = 일부 실패 · 2 = usage 오류 · 3 = gate/session 차단
 */

import path from "path";
import fs from "fs";
import { spawnSync } from "node:child_process";
import { createHash } from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}
const scriptArg = getArg("--script");
const outDirArg = getArg("--out-dir");
const characterReferenceArg = getArg("--character-reference");
const characterReferenceSha256Arg = getArg("--character-reference-sha256");
const characterIdArg = getArg("--character-id");
const characterNameArg = getArg("--character-name");
const regenerateScenesArg = getArg("--regenerate-scenes");
const modeOverridePacketArg = getArg("--mode-override-packet");
const ownerApprovalArg = getArg("--owner-approval");
const promptAuditOnly = args.includes("--prompt-audit-only");
const executeApprovedModeOverride = args.includes("--execute-approved-mode-override");
if (!scriptArg || !outDirArg || !characterReferenceArg || !characterReferenceSha256Arg || !characterIdArg || !characterNameArg) {
  console.error("Usage: node run-owner-real-scene-images-from-wizard-script-once.mjs --script <script-final.json> --out-dir <abs> --character-reference <selected.png> --character-reference-sha256 <sha256> --character-id <id> --character-name <name> [--regenerate-scenes 4,5] [--mode-override-packet <packet.json> (--prompt-audit-only | --execute-approved-mode-override --owner-approval <exact>)]");
  process.exit(2);
}
const scriptAbs = path.resolve(scriptArg);
const OUT_DIR = path.resolve(outDirArg);
const CHARACTER_REFERENCE_ABS = path.resolve(characterReferenceArg);
const MODE_OVERRIDE_PACKET_ABS = modeOverridePacketArg ? path.resolve(modeOverridePacketArg) : null;
const CHARACTER_REFERENCE_SHA256 = String(characterReferenceSha256Arg).toLowerCase();
const CHARACTER_ID = String(characterIdArg);
const CHARACTER_NAME = String(characterNameArg).trim();
const CAST_DATA_PATH = path.join(REPO_ROOT, "lib", "finance-character-cast-data.json");
const castData = JSON.parse(fs.readFileSync(CAST_DATA_PATH, "utf8"));
const CHARACTER_PROFILE = castData.characters?.find((character) => character.id === CHARACTER_ID);
if (!CHARACTER_PROFILE || CHARACTER_PROFILE.name !== CHARACTER_NAME || CHARACTER_PROFILE.selectedCandidateNumber !== 2) {
  console.error("ABORT: Owner-approved fixed character profile does not match the requested character id/name.");
  process.exit(2);
}
if (castData.selectionStatus !== "owner_approved_candidate_2_fixed_v1" || typeof CHARACTER_PROFILE.motionProfile !== "string") {
  console.error("ABORT: Owner-approved candidate-2 selection or character motion profile is missing.");
  process.exit(2);
}
const CHARACTER_MOTION_PROFILE = CHARACTER_PROFILE.motionProfile;
const CAST_SCENE_INTEGRATION_CONTRACT = String(castData.sceneIntegrationContract ?? "");
const CAST_MOTION_READY_CONTRACT = String(castData.motionReadyContract ?? "");
const CAST_FORBIDDEN_VISUAL_CONTRACT = String(castData.forbiddenVisualContract ?? "");

// 산출물 루트 강제 — repo 밖 아무 곳이 아니라 C:\tmp\money-shorts-os\ 하위만 허용(fail-closed).
// 브라우저/Playwright import 이전에 검사하므로 경로가 어긋나면 어떤 외부 접근도 일어나지 않는다.
const MEDIA_ROOT_RE = /^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+/i;
if (!MEDIA_ROOT_RE.test(OUT_DIR + path.sep)) {
  console.error(`ABORT: --out-dir must be under C:\\tmp\\money-shorts-os\\. out-dir: ${OUT_DIR}`);
  process.exit(2);
}
if (!MEDIA_ROOT_RE.test(scriptAbs) || !scriptAbs.toLowerCase().endsWith(".json")) {
  console.error(`ABORT: --script must be a .json under C:\\tmp\\money-shorts-os\\. script: ${scriptAbs}`);
  process.exit(2);
}
if (OUT_DIR.startsWith(REPO_ROOT + "\\") || OUT_DIR.startsWith(REPO_ROOT + "/")) {
  console.error(`ABORT: --out-dir must be outside repo root. out-dir: ${OUT_DIR}`);
  process.exit(2);
}
if ([scriptAbs, OUT_DIR].some((p) => p.includes(".money-shorts-local"))) {
  console.error("ABORT: .money-shorts-local access forbidden.");
  process.exit(2);
}
if (MODE_OVERRIDE_PACKET_ABS && (!MEDIA_ROOT_RE.test(MODE_OVERRIDE_PACKET_ABS) || !MODE_OVERRIDE_PACKET_ABS.toLowerCase().endsWith(".json") || MODE_OVERRIDE_PACKET_ABS.includes(".money-shorts-local"))) {
  console.error("ABORT: --mode-override-packet must be a JSON file under C:\\tmp\\money-shorts-os\\.");
  process.exit(2);
}
if (MODE_OVERRIDE_PACKET_ABS && !promptAuditOnly && !executeApprovedModeOverride) {
  console.error("ABORT: --mode-override-packet requires --prompt-audit-only or the separate Owner-approved execution path.");
  process.exit(3);
}
if (executeApprovedModeOverride && (!MODE_OVERRIDE_PACKET_ABS || promptAuditOnly)) {
  console.error("ABORT: --execute-approved-mode-override requires one mode override packet and cannot be combined with --prompt-audit-only.");
  process.exit(3);
}
const CHARACTER_REFERENCE_ROOT_RE = /^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+web-wizard-create-v1[\\/]+character-cast-v1[\\/]+(?:harin_daily|junho_cashflow|seoyun_safety|minjae_horizon)[\\/]+candidate-2\.png$/i;
if (!CHARACTER_REFERENCE_ROOT_RE.test(CHARACTER_REFERENCE_ABS)) {
  console.error(`ABORT: selected character reference path is outside the approved cast root: ${CHARACTER_REFERENCE_ABS}`);
  process.exit(2);
}
if (!/^(?:harin_daily|junho_cashflow|seoyun_safety|minjae_horizon)$/.test(CHARACTER_ID) || !CHARACTER_NAME) {
  console.error("ABORT: approved character id/name required.");
  process.exit(2);
}
if (!/^[a-f0-9]{64}$/.test(CHARACTER_REFERENCE_SHA256) || !fs.existsSync(CHARACTER_REFERENCE_ABS)) {
  console.error("ABORT: selected character reference file/hash is missing.");
  process.exit(2);
}
const actualCharacterReferenceSha256 = createHash("sha256").update(fs.readFileSync(CHARACTER_REFERENCE_ABS)).digest("hex");
if (actualCharacterReferenceSha256 !== CHARACTER_REFERENCE_SHA256) {
  console.error("ABORT: selected character reference SHA-256 mismatch.");
  process.exit(3);
}

function ts() { return new Date().toISOString().slice(11, 19); }
function log(m) { console.log(`[${ts()}][wizard-scene-img] ${m}`); }
function warn(m) { console.warn(`[WARN][wizard-scene-img] ${m}`); }

fs.mkdirSync(OUT_DIR, { recursive: true });
const SUMMARY_PATH = path.join(OUT_DIR, "scene-images-summary.json");
const EVIDENCE_ENGINE_VERSION = "money_shorts_finance_3d_editorial_sequence_v11";
const VISUAL_STYLE_CONTRACT = "money_shorts_bright_integrated_motion_ready_family_3d_v3";
const CHARACTER_CONTINUITY_VERSION = "money_shorts_selected_character_reference_v1";
const outputVisualEngineVersion = EVIDENCE_ENGINE_VERSION;
const IMAGE_CONTROLLER_VERSION = "chatgpt_picture_v2_character_reference_v8";
const VISUAL_MODALITY_VERSION = "money_shorts_visual_modality_sequence_v1";

function writeSummary(partial) {
  const summary = {
    schemaVersion: "wizard_scene_images_summary_v1",
    mode: "chatgpt_playwright",
    generatedAt: new Date().toISOString(),
    notUploaded: true,
    visualEngineVersion: outputVisualEngineVersion,
    imageControllerVersion: IMAGE_CONTROLLER_VERSION,
    visualModalityVersion: VISUAL_MODALITY_VERSION,
    visualModalityAudit: {
      version: VISUAL_MODALITY_VERSION,
      passed: false,
    },
    characterContinuityAudit: {
      version: CHARACTER_CONTINUITY_VERSION,
      promptCoveragePassed: false,
      targetedRegenerationScenes: [],
      targetedRegenerationPassed: false,
      manualVisualReviewRequired: true,
    },
    motionPlanAudit: {
      version: "money_shorts_scene_motion_plan_v1",
      promptCoveragePassed: false,
      evidenceCoveragePassed: false,
      manualVideoReviewRequired: true,
      passed: false,
    },
    characterReference: {
      characterId: CHARACTER_ID,
      characterName: CHARACTER_NAME,
      referenceFileName: path.basename(CHARACTER_REFERENCE_ABS),
      referenceImageSha256: CHARACTER_REFERENCE_SHA256,
      hashVerified: true,
    },
    expectedCount: 0,
    routingRecoveriesUsed: 0,
    ...partial,
  };
  fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2), "utf8");
  return summary;
}

// ── gate 1: 명시 실행 마커 (없으면 브라우저/네트워크 어떤 것도 열지 않음) ──────
if (!promptAuditOnly && process.env.ALLOW_CHATGPT_IMAGE !== "1") {
  writeSummary({ allReady: false, blockerCode: "BLOCKED_GATE", scenes: [], submissionsUsed: 0,
    note: "ALLOW_CHATGPT_IMAGE=1 실행 마커 없음 — 브라우저를 열지 않고 종료(fail-closed)." });
  console.error("ABORT: ALLOW_CHATGPT_IMAGE=1 이 설정되지 않음 (fail-closed).");
  process.exit(3);
}

// ── 확정 대본 로드 ────────────────────────────────────────────────────────────
let record;
try {
  record = JSON.parse(fs.readFileSync(scriptAbs, "utf8"));
} catch (e) {
  console.error(`ABORT: script-final.json 읽기 실패: ${e.message}`);
  process.exit(2);
}
if (record.schemaVersion !== "wizard_script_final_v1" || !record.script || !Array.isArray(record.script.scenes)) {
  console.error("ABORT: wizard_script_final_v1 스키마가 아님.");
  process.exit(2);
}
const scenes = record.script.scenes;
const MIN_SCENES = 4;
const MAX_SCENES = 18;
if (scenes.length < MIN_SCENES || scenes.length > MAX_SCENES) {
  console.error(`ABORT: scenes ${MIN_SCENES}~${MAX_SCENES}개 기대 — 실제 ${scenes.length}개.`);
  process.exit(2);
}
const sceneCount = scenes.length;
const topicId = record.topicId ?? null;
const rootTopicId = typeof record.production?.rootTopicId === "string" ? record.production.rootTopicId : topicId;
const targetedRegenerationSceneIndexes = new Set();
if (regenerateScenesArg) {
  for (const token of String(regenerateScenesArg).split(",")) {
    const sceneNumber = Number(token.trim());
    if (!Number.isInteger(sceneNumber) || sceneNumber < 1 || sceneNumber > sceneCount) {
      console.error(`ABORT: --regenerate-scenes must contain scene numbers between 1 and ${sceneCount}. received: ${regenerateScenesArg}`);
      process.exit(2);
    }
    targetedRegenerationSceneIndexes.add(sceneNumber);
  }
}
const targetedRegenerationScenes = [...targetedRegenerationSceneIndexes].sort((a, b) => a - b);
const visualEvidenceReady = scenes.every((scene) =>
  scene?.visualEvidence?.version === EVIDENCE_ENGINE_VERSION &&
  scene.visualEvidence.visualStyle === VISUAL_STYLE_CONTRACT &&
  typeof scene.visualEvidence.sceneIdentity === "string" &&
  scene.visualEvidence.sceneIdentity.length === 12 &&
  typeof scene.visualEvidence.mustShow === "string" &&
  typeof scene.visualEvidence.visibleAction === "string" &&
  typeof scene.visualEvidence.editorialProof === "string" &&
  typeof scene.visualEvidence.sceneSpecificSignal === "string" &&
  typeof scene.visualEvidence.sceneSetting === "string" &&
  typeof scene.visualEvidence.visualForm === "string" &&
  typeof scene.visualEvidence.cameraPlan === "string" &&
  typeof scene.visualEvidence.lightingPlan === "string" &&
  typeof scene.visualEvidence.sceneIntegrationPlan === "string" &&
  typeof scene.visualEvidence.motionPlan === "string" &&
  typeof scene.visualEvidence.differenceContract === "string" &&
  typeof scene.visualEvidence.causalComposition === "string" &&
  typeof scene.visualEvidence.continuityState === "string" &&
  typeof scene.visualEvidence.mustNotShow === "string"
);
if (!visualEvidenceReady) {
  writeSummary({
    topicId,
    expectedCount: sceneCount,
    allReady: false,
    blockerCode: "VISUAL_EVIDENCE_V11_REQUIRED",
    scenes: [],
    submissionsUsed: 0,
    note: "장면별 bright integrated motion-ready family 3D sequence v11 계약이 없는 구버전 대본입니다. 대본을 다시 확정한 뒤 이미지를 생성해야 합니다.",
  });
  console.error("ABORT: bright integrated motion-ready family 3D sequence v11이 없는 구버전 대본 — 이미지 전송 없이 차단.");
  process.exit(3);
}

const ADJACENT_CONTRACT_FIELDS = [
  "sceneSetting",
  "visualForm",
  "cameraPlan",
  "lightingPlan",
  "motionPlan",
  "heroSubject",
  "visibleAction",
  "causalComposition",
];
const adjacentContractFailures = scenes.flatMap((scene, index) => {
  if (index === 0) return [];
  const previous = scenes[index - 1].visualEvidence;
  const current = scene.visualEvidence;
  const differences = ADJACENT_CONTRACT_FIELDS.filter((field) => previous[field] !== current[field]);
  return differences.length >= 4 ? [] : [{ previousScene: index, currentScene: index + 1, differences }];
});
if (adjacentContractFailures.length > 0) {
  writeSummary({
    topicId,
    expectedCount: sceneCount,
    allReady: false,
    blockerCode: "VISUAL_SEQUENCE_CONTRACT_FAILED",
    scenes: [],
    submissionsUsed: 0,
    adjacentContractFailures,
    note: "인접 장면은 공간·시각 형식·카메라·조명·주인공·행동·인과 구도 중 최소 4개가 달라야 합니다.",
  });
  console.error("ABORT: 인접 장면 시각 차별화 계약 실패 — 이미지 전송 없이 차단.");
  process.exit(3);
}

// ── 스타일/해상도 지시 — Owner 승인 방향: 밝고 자연스럽게 통합된 생활형 3D 장면 ──
const STYLE_PREFIX =
  "Money Shorts original bright family-feature-quality cinematic 3D animation without copying any studio, franchise, film or known character. " +
  "Make it unmistakably stylized rather than live action, with believable Korean adult facial proportions, eyes only subtly larger than real life, restrained catchlights, defined eyelids, natural jaw structure and gentle facial asymmetry. " +
  "Use shaped hair, tactile woven fabric, physically grounded hands, bright natural daylight, warm color bounce, open facial shadows and rich but controlled color. " +
  "Generate the character, room, props and lighting together as one authored shot in a bright lived-in Korean home, cafe, store or work space. Keep every person, room and furnishing full-size and physically inhabitable. ";
const CHARACTER_CONTINUITY_INSTRUCTION =
  `CHARACTER CONTINUITY CONTRACT ${CHARACTER_CONTINUITY_VERSION}: use the attached ${CHARACTER_NAME} identity board only as a strict identity reference. ` +
  "Whenever a full or upper body person is visible, show the exact same single character with matching face, age, hairstyle, hair color, body proportions and fixed wardrobe. " +
  "Reduce glossy oversized eye geometry and beauty-filter perfection while preserving the recognizable adult identity. Render one natural story view only; never copy the reference board layout, duplicate the character or show multiple portrait views. " +
  `CHARACTER MOTION PROFILE: ${CHARACTER_MOTION_PROFILE}. Hands-only scenes may omit the head. `;
const STYLE_REJECTION =
  "STRICT STYLE REJECTION: no photography, no live action, no documentary realism, no photorealistic room or person, " +
  "no miniature, dollhouse, diorama, cutaway toy room, scale model, tiny house model, desktop house model, showroom-perfect advertising set or catalog portrait. " +
  "No laboratory, vault, factory, machine room, industrial apparatus, black-metal architecture, fantasy battle, energy effect or gloomy finance world. " +
  "No cutout character, pasted-on subject, green-screen edge, composited look, lunging, reaching toward the camera, superhero stance or exaggerated shock. " +
  "Never change the selected character's face, age, hairstyle, hair color, body proportions or fixed wardrobe, and never recreate the multi-view identity-board composition. " +
  `${CAST_SCENE_INTEGRATION_CONTRACT} ${CAST_MOTION_READY_CONTRACT} ${CAST_FORBIDDEN_VISUAL_CONTRACT} `;
const NEW_IMAGE_INSTRUCTION =
  "GENERATE ONE BRAND-NEW ORIGINAL TEXT-TO-IMAGE ASSET. Start from a blank canvas and create the scene described below.";
const RESOLUTION_INSTRUCTION =
  "Output one vertical 9:16 portrait image at the highest available resolution (target 1080x1920 or higher). " +
  "No readable text, letters, numbers, UI, logo, brand or watermark. When a person is required, preserve the exact selected character identity and fixed wardrobe from the attached reference. " +
  "Keep the lower caption area connected to the scene instead of leaving a blank black floor or void.";
const PROMPT_MAX_CHARS = 4800;

const STORYBOARD_ROLES = [
  {
    role: "HOOK",
    event: "an immediate topic-defining event with one unmistakable hero subject and strong depth",
    camera: "candid eye-level medium-wide or human-height medium view, not an overhead desk still life",
    light: "bright natural or practical attention light with warm color bounce, clear facial exposure and open shadows",
    avoid: "no pile of every finance symbol, no generic bank-plus-chain combination",
  },
  {
    role: "HIDDEN PROBLEM",
    event: "a cause-and-effect mechanism becoming visible through a different setting and different hero subject",
    camera: "eye-level side or over-shoulder view in one continuous lived-in space, clearly different from scene 1",
    light: "clear window or practical side light with open shadows and one restrained topic accent",
    avoid: "do not repeat scene 1's hero object, camera or silhouette",
  },
  {
    role: "EVERYDAY REALITY",
    event: "a recognizable home, commute, grocery, office or payment moment that makes the narration feel personal",
    camera: "eye-level environmental scene with human-scale objects and lived-in depth",
    light: "natural daylight or warm practical indoor light",
    avoid: "no classical bank facade, chains, giant percent signs, giant arrows or abstract chart wall",
  },
  {
    role: "ECONOMIC RESULT",
    event: "visible personal evidence of the financial result, such as a changed bill, basket, repayment calendar, wallet or cash-flow comparison",
    camera: "clean before-and-after, split-depth or close evidence shot",
    light: "neutral paper-white analytical light with one meaningful accent",
    avoid: "no decorative finance icon pile and no repeated psychological-pressure silhouette",
  },
  {
    role: "PSYCHOLOGY",
    event: "the recurring Korean adult making, avoiding or delaying one small decision in a recognizable home, cafe, store or work setting",
    camera: "candid eye-level medium-wide or intimate over-shoulder view with a natural adult face and hands, not another object stack",
    light: "soft reflective daylight with restrained contrast and clear facial exposure",
    avoid: "no bank temple, no giant metal key, no receipt mountain and no literal text",
  },
  {
    role: "TURNING POINT",
    event: "the moment confusion becomes a clear standard through one visible reordering, comparison or completed choice in an everyday setting",
    camera: "eye-level three-quarter view with more air and directional depth",
    light: "brighter transitional light entering the frame; visibly clearer than the earlier warning scenes",
    avoid: "no chains, crushing weights, falling arrows or hopeless black-on-black mood",
  },
  {
    role: "PRACTICAL HABIT",
    event: "grounded adult hands or the recurring Korean adult performing the narration's one concrete action in a practical setting",
    camera: "close tactile action shot or calm eye-level three-quarter workspace view",
    light: "clean daylight, warm neutral light or optimistic studio light",
    avoid: "no oversized abstract symbol as the main subject and no disaster imagery",
  },
  {
    role: "SAVE AND RECALL",
    event: "a calm resolved final image with one memorable object or path that represents control and continuation",
    camera: "open balanced composition with meaningful depth and a distinct silhouette from every earlier frame",
    light: "clear hopeful daylight or soft golden light unless the narration explicitly ends in warning",
    avoid: "no repeated opening frame, no heavy chain, no black void and no crowded collage",
  },
  {
    role: "RECOMMENDATION",
    event: "a concise success standard visualized as an organized choice or repeatable system",
    camera: "calm eye-level home, cafe, store or workplace composition with ample but textured caption space",
    light: "bright natural daylight or warm practical light",
    avoid: "no warning-symbol overload and no reuse of the previous scene's main object",
  },
  {
    role: "CLOSING",
    event: "a final forward-moving scene that leaves motivation rather than pressure",
    camera: "wide open finish with a clear visual destination",
    light: "uplifting natural or golden light",
    avoid: "no dark object pile, no chain and no falling market imagery",
  },
];

const STORYBOARD_ROLE_INDEX_BY_SCENE_ID = {
  hook: 0,
  problem: 1,
  situation: 2,
  consequence: 3,
  psychology: 4,
  mindset: 5,
  habit: 6,
  save: 7,
  recommendation: 8,
};

const VISUAL_MODES = {
  CHARACTER_EVENT: {
    presence: "character",
    instruction: "Show the recurring character in the plausible middle of one small topic-defining action inside a bright full-scale everyday environment. Use restrained gaze, hands and weight shift with natural spatial depth; no presenter pose or frozen catalog portrait.",
  },
  ENVIRONMENTAL_CHARACTER: {
    presence: "character",
    instruction: "Show the recurring character naturally completing one small action in a recognizable full-scale everyday place. The room, hands, gaze and story prop must carry the meaning together; never reach toward the camera or force a standing action pose.",
  },
  OBJECT_MECHANISM: {
    presence: "none",
    instruction: "Build a life-size 3D causal chain from the topic-specific everyday objects inside a recognizable lived-in place. Show input, pressure and result through physical connection and depth, with no desk portrait, oversized machinery or generic icon pile.",
  },
  ARCHITECTURAL_CROSS_SECTION: {
    presence: "none",
    instruction: "Use a bright full-scale domestic or workplace room-to-room view to expose the hidden economic mechanism through ordinary objects and natural depth. It must read as warm human-scale space with natural materials, never a technical cutaway, industrial machine room, vault, miniature, dollhouse or tabletop model.",
  },
  SPLIT_EVIDENCE: {
    presence: "none",
    instruction: "Use a clean daylight vertical or depth-based before-versus-after evidence composition with two physically connected life-size everyday states. Make the changed condition obvious without a person, desk portrait, industrial machinery or floating finance icons.",
  },
  SYMBOLIC_CHARACTER: {
    presence: "character",
    instruction: "Place the recurring character in a bright lived-in home, cafe, store or work space where the tempting cue, ignored condition and consequence are all physically present. Use a restrained eye or head turn and relaxed posture, never an abstract corridor, threshold, chamber or theatrical stance.",
  },
  HANDS_ACTION: {
    presence: "hands",
    instruction: "Use a tight tactile action shot of hands completing one concrete step on real full-size objects. No visible head or upper-body portrait; the action and its completed result must fill the frame.",
  },
  OBJECT_CHECKLIST: {
    presence: "none",
    instruction: "Show three distinct full-size everyday evidence stations or tactile physical markers arranged as a usable decision checklist in a bright practical place. No person, no screen UI, no readable text, no industrial machine bank and no generic traffic-light icon row.",
  },
  FUTURE_CHARACTER: {
    presence: "character",
    instruction: "Show the recurring character calmly carrying the changed rule into a clearly different bright everyday setting with directional depth. Use one measured head, eye or hand movement and do not reuse an earlier room silhouette.",
  },
  OBJECT_RESOLUTION: {
    presence: "none",
    instruction: "Resolve the story with a bright person-free full-scale everyday system: protected household cash, a bounded decision object and an open next step. Use natural daylight, warm materials and a new open silhouette, not another desk still life, vault or machine room.",
  },
};

function sceneRoleBeat(scene, sceneIndex) {
  return scenes.slice(0, sceneIndex + 1).filter((candidate) => candidate?.id === scene?.id).length;
}

function visualModeForScene(scene, sceneIndex, totalScenes) {
  const beat = sceneRoleBeat(scene, sceneIndex);
  const id = String(scene?.id ?? "");
  if (id === "hook") return { id: "CHARACTER_EVENT", ...VISUAL_MODES.CHARACTER_EVENT };
  if (id === "problem") return { id: "OBJECT_MECHANISM", ...VISUAL_MODES.OBJECT_MECHANISM };
  if (id === "situation") {
    const modeId = beat % 2 === 1 ? "ENVIRONMENTAL_CHARACTER" : "OBJECT_MECHANISM";
    return { id: modeId, ...VISUAL_MODES[modeId] };
  }
  if (id === "consequence") {
    const modeId = beat % 2 === 1 ? "SPLIT_EVIDENCE" : "OBJECT_MECHANISM";
    return { id: modeId, ...VISUAL_MODES[modeId] };
  }
  if (id === "psychology") return { id: "SYMBOLIC_CHARACTER", ...VISUAL_MODES.SYMBOLIC_CHARACTER };
  if (id === "mindset") return { id: "ENVIRONMENTAL_CHARACTER", ...VISUAL_MODES.ENVIRONMENTAL_CHARACTER };
  if (id === "habit") {
    const modeId = beat % 2 === 1 ? "HANDS_ACTION" : "OBJECT_CHECKLIST";
    return { id: modeId, ...VISUAL_MODES[modeId] };
  }
  if (id === "save") {
    const modeId = beat % 2 === 1 ? "FUTURE_CHARACTER" : "OBJECT_RESOLUTION";
    return { id: modeId, ...VISUAL_MODES[modeId] };
  }
  if (id === "recommendation") return { id: "OBJECT_RESOLUTION", ...VISUAL_MODES.OBJECT_RESOLUTION };
  const fallbackIds = [
    "CHARACTER_EVENT",
    "OBJECT_MECHANISM",
    "ARCHITECTURAL_CROSS_SECTION",
    "SPLIT_EVIDENCE",
    "SYMBOLIC_CHARACTER",
    "HANDS_ACTION",
    "OBJECT_CHECKLIST",
    "FUTURE_CHARACTER",
    "OBJECT_RESOLUTION",
  ];
  const relative = totalScenes <= 1 ? 0 : sceneIndex / (totalScenes - 1);
  const modeId = fallbackIds[Math.min(fallbackIds.length - 1, Math.round(relative * (fallbackIds.length - 1)))];
  return { id: modeId, ...VISUAL_MODES[modeId] };
}

function resolveTopicScopedModeOverride() {
  if (!MODE_OVERRIDE_PACKET_ABS) return null;
  let packet;
  try {
    packet = JSON.parse(fs.readFileSync(MODE_OVERRIDE_PACKET_ABS, "utf8"));
  } catch (error) {
    console.error(`ABORT: mode override packet read failed: ${String(error?.message ?? error)}`);
    process.exit(2);
  }
  const targetIndex = packet?.targetScene?.index;
  const targetScene = Number.isInteger(targetIndex) ? scenes[targetIndex - 1] : null;
  const proposedModeId = packet?.targetScene?.proposed?.visualModeId;
  const proposedPresence = packet?.targetScene?.proposed?.presenceMode;
  const expectedMode = targetScene ? visualModeForScene(targetScene, targetIndex - 1, sceneCount) : null;
  const actualScriptSha256 = createHash("sha256").update(fs.readFileSync(scriptAbs)).digest("hex");
  const packetSha256 = createHash("sha256").update(fs.readFileSync(MODE_OVERRIDE_PACKET_ABS)).digest("hex");
  const packetPartSegment = typeof packet?.productionPartId === "string" ? `${path.sep}${packet.productionPartId}${path.sep}` : "";
  const approvalPrefix = packet?.executionPolicy?.requiredOwnerApprovalPrefix;
  const requiredOwnerApprovalWording = typeof approvalPrefix === "string" ? `${approvalPrefix}${packetSha256}` : null;
  const valid =
    packet?.schemaVersion === "money_shorts_scene_mode_correction_packet_v1" &&
    packet?.status === "data_only_pending_owner_review" &&
    packet?.topicId === rootTopicId &&
    packetPartSegment !== "" && scriptAbs.includes(packetPartSegment) &&
    packet?.sourceBinding?.scriptSha256 === actualScriptSha256 &&
    packet?.sourceBinding?.characterReferenceSha256 === CHARACTER_REFERENCE_SHA256 &&
    packet?.executionPolicy?.imageGenerationExecuted === false &&
    packet?.executionPolicy?.defaultSharedModeMapperMustRemainUnchanged === true &&
    Number.isInteger(targetIndex) && targetIndex >= 1 && targetIndex <= sceneCount &&
    packet?.targetScene?.id === targetScene?.id &&
    packet?.targetScene?.current?.visualModeId === expectedMode?.id &&
    packet?.targetScene?.current?.presenceMode === expectedMode?.presence &&
    typeof proposedModeId === "string" && proposedModeId in VISUAL_MODES &&
    proposedPresence === VISUAL_MODES[proposedModeId].presence &&
    proposedModeId !== expectedMode?.id &&
    typeof packet?.targetScene?.proposed?.promptFingerprint === "string" &&
    /^[a-f0-9]{16}$/.test(packet.targetScene.proposed.promptFingerprint) &&
    typeof approvalPrefix === "string" && approvalPrefix.startsWith("APPROVE_SCENE_MODE_OVERRIDE_IMAGE:") &&
    packet?.executionPolicy?.maxSubmissions === 1 &&
    packet?.executionPolicy?.automaticRetryAllowed === false &&
    packet?.executionPolicy?.existingSceneImageMustBePreserved === true;
  if (!valid) {
    console.error("ABORT: topic-scoped mode override packet does not match the locked script, character reference or default mode mapping.");
    process.exit(3);
  }
  if (
    targetedRegenerationSceneIndexes.size !== 1 ||
    !targetedRegenerationSceneIndexes.has(targetIndex)
  ) {
    console.error("ABORT: a mode override audit or execution requires the single approved regeneration scene.");
    process.exit(3);
  }
  if (executeApprovedModeOverride && ownerApprovalArg !== requiredOwnerApprovalWording) {
    console.error("ABORT: exact Owner approval is missing for the mode override execution.");
    process.exit(3);
  }
  return {
    packetPath: MODE_OVERRIDE_PACKET_ABS,
    packetSha256,
    sceneIndex: targetIndex,
    visualModeId: proposedModeId,
    promptFingerprint: packet.targetScene.proposed.promptFingerprint,
    currentImageSha256: packet.targetScene.current.imageSha256,
    requiredOwnerApprovalWording,
    executionApproved: executeApprovedModeOverride,
  };
}

function presenceInstructionForMode(mode) {
  if (mode.presence === "character") {
    return `PRESENCE GATE: ONE RECURRING CHARACTER IS ALLOWED IN THIS SCENE. ${CHARACTER_CONTINUITY_INSTRUCTION}`;
  }
  if (mode.presence === "hands") {
    return `PRESENCE GATE: HANDS ONLY. Show no head, face, hair, torso portrait, seated person or background person. Use the attached ${CHARACTER_NAME} identity board only to keep the adult hands, skin tone and visible fixed-wardrobe sleeves consistent; crop the head and upper body fully outside the frame and never recreate the identity-board layout.`;
  }
  return "PRESENCE GATE: NO PERSON. Show no human, head, face, hair, hands, body, silhouette, mannequin or background figure. Carry the meaning entirely with full-scale 3D space, objects and causal motion.";
}

function styleRejectionForMode(mode) {
  if (mode.presence === "character") return STYLE_REJECTION;
  return "STRICT STYLE REJECTION: no photography, live action, documentary realism, photorealistic person, miniature, dollhouse, diorama, cutaway toy room, scale model, tiny house model, desktop model, readable text, logo or watermark. No vault, factory, laboratory, machine room, industrial apparatus, black-metal architecture, fantasy energy effect, gloomy finance world, showroom-perfect advertising set or machine-like finance diagram. Obey the current person-free or hands-only PRESENCE GATE exactly.";
}

function stylePrefixForMode(mode) {
  if (mode.presence === "character") return STYLE_PREFIX;
  if (mode.presence === "hands") {
    return "Money Shorts original bright family-feature-quality cinematic 3D animation: naturally grounded hands, full-size everyday topic objects, tactile fabrics, painted wood, paper, glass and warm ceramics, bright natural or warm practical light, open shadows, rich controlled color and cinematic depth. Keep the same stylized render language as the character scenes. Every room, furnishing, hand and object is adult-scale and physically usable. ";
  }
  return "Money Shorts original bright family-feature-quality cinematic 3D animation made from full-size everyday topic objects in recognizable lived-in Korean homes, cafes, stores and work spaces. Use tactile fabrics, painted wood, paper, glass, warm ceramics, bright natural or practical light, open shadows, rich controlled color and cinematic depth. Keep the same stylized render language as the character scenes. Every room, furnishing and object is adult-scale and physically usable. Include no character or human body part. ";
}

function resolutionInstructionForMode(mode) {
  if (mode.presence === "character") return RESOLUTION_INSTRUCTION;
  if (mode.presence === "hands") {
    return "Output one vertical 9:16 portrait image at the highest available resolution (target 1080x1920 or higher). No readable text, letters, numbers, UI, logo, brand or watermark. Show only the required hands and full-size action objects; no head, portrait or background person. Keep the lower caption area connected to the scene instead of leaving a blank void.";
  }
  return "Output one vertical 9:16 portrait image at the highest available resolution (target 1080x1920 or higher). No readable text, letters, numbers, UI, logo, brand or watermark. Show no person or human body part. Keep the lower caption area connected to the full-scale object or architectural scene instead of leaving a blank void.";
}

const MODE_SETTING_OVERRIDES = {
  CHARACTER_EVENT: "use the topic-specific lived-in setting at full scale, with the decision object in the foreground and its household consequence in a separate background zone; place the character off-center in a natural mid-action moment",
  ENVIRONMENTAL_CHARACTER: "use the topic-specific everyday setting at full scale, divided naturally into a decision area, a changed-condition area and a household-cash boundary; let the character complete one small action within the room",
  OBJECT_MECHANISM: "keep the topic-specific lived-in setting recognizable while its everyday objects form one visible input-action-result relationship; no portrait, industrial apparatus or dark architecture",
  ARCHITECTURAL_CROSS_SECTION: "show the topic-specific domestic or workplace setting as a bright full-scale room-to-room view connecting cause, action and result through ordinary objects; use natural materials, no technical cutaway, machine room, tabletop or miniature",
  SPLIT_EVIDENCE: "show two life-size connected evidence areas inside the topic-specific everyday setting with a clearly changed boundary between before and after; no portrait, machine room or vault",
  HANDS_ACTION: "a full-size standing action counter or practical work surface in a distinct location, framed tightly enough that no head enters the image",
  OBJECT_CHECKLIST: "three full-size topic-specific evidence stations arranged across a bright practical wall, counter or floor path using warm tactile materials; no person, machine bank or traffic-light icon row",
  SYMBOLIC_CHARACTER: "a bright lived-in home, cafe, store or work space where the temptation, ignored condition and cash-safety boundary are naturally visible around the character",
  FUTURE_CHARACTER: "an open bright everyday room connected to a balcony, window, doorway or work area that gives protected household cash and the next decision clear directional depth",
  OBJECT_RESOLUTION: "a bright open full-scale everyday room where the protected topic objects lead toward a clear next step; no desk still life, vault or industrial architecture",
};

function topicSpecificSetting(evidence, mode) {
  const sourceSetting = String(evidence?.sceneSetting ?? "").split("; arrange this place specifically for")[0].trim();
  const modeDirection = MODE_SETTING_OVERRIDES[mode.id] ?? "use a distinct bright full-scale everyday setting with natural materials";
  return `${sourceSetting || "a recognizable topic-specific everyday place"}; ${modeDirection}`;
}

const CHARACTER_ACTION_OVERRIDES = {
  CHARACTER_EVENT: "the recurring character pauses in the middle of one small decision, shifts their gaze from the topic object to its household consequence and completes one relaxed hand movement",
  ENVIRONMENTAL_CHARACTER: "the recurring character completes one ordinary topic-specific action with purposeful hands, relaxed shoulders and a gentle weight shift while the changed condition remains visible nearby",
  SYMBOLIC_CHARACTER: "the recurring character makes a restrained eye or head turn from the tempting cue toward the ignored condition, with quiet breathing and no theatrical body movement",
  FUTURE_CHARACTER: "the recurring character calmly settles one story prop and makes a measured head or eye turn toward the bright next step",
};

const CHARACTER_CAMERA_OVERRIDES = {
  CHARACTER_EVENT: "candid eye-level three-quarter medium-wide view with off-center placement, a near everyday object for parallax and clear room depth",
  ENVIRONMENTAL_CHARACTER: "eye-level environmental medium-wide view showing the character, purposeful hands, story prop and three natural depth planes in one coherent room",
  SYMBOLIC_CHARACTER: "intimate eye-level or over-shoulder composition where the character, tempting cue and ignored condition remain visible in one lived-in setting",
  FUTURE_CHARACTER: "wide side or rear three-quarter view with a relaxed character silhouette, foreground room texture and a clear everyday destination",
};

function evidenceForVisualMode(evidence, mode) {
  if (mode.presence === "character") {
    const topicObjects = compactNarration(evidence.sceneSpecificSignal || evidence.heroSubject, 300);
    const economicMeaning = compactNarration(evidence.economicMeaning, 220);
    return {
      mustShow: `the recurring character actively confronting the exact topic evidence ${topicObjects}; economic meaning ${economicMeaning}`,
      heroSubject: `the recurring character physically interacting with ${topicObjects}`,
      visibleAction: CHARACTER_ACTION_OVERRIDES[mode.id] ?? evidence.visibleAction,
      sceneSetting: topicSpecificSetting(evidence, mode),
      visualForm: mode.instruction,
      cameraPlan: CHARACTER_CAMERA_OVERRIDES[mode.id] ?? evidence.cameraPlan,
      lightingPlan: evidence.lightingPlan,
      sceneIntegrationPlan: evidence.sceneIntegrationPlan,
      motionPlan: `${evidence.motionPlan}; apply ${CHARACTER_NAME}'s motion profile: ${CHARACTER_MOTION_PROFILE}`,
      causalComposition: "connect the character's restrained micro-action, the topic-specific decision object and its economic result across one coherent full-scale room; preserve matched perspective, contact shadows and ambient color bounce",
      mustNotShow: evidence.mustNotShow,
    };
  }
  const topicObjects = compactNarration(evidence.sceneSpecificSignal || evidence.heroSubject, 300);
  const economicMeaning = compactNarration(evidence.economicMeaning, 220);
  const sceneSetting = topicSpecificSetting(evidence, mode);
  const common = {
    mustShow: `the exact topic evidence ${topicObjects}, physically changing from cause to result; economic meaning ${economicMeaning}`,
    heroSubject: topicObjects,
    sceneSetting,
    visualForm: mode.instruction,
    lightingPlan: evidence.lightingPlan,
    sceneIntegrationPlan: evidence.sceneIntegrationPlan,
    motionPlan: evidence.motionPlan,
    mustNotShow: "any person forbidden by the PRESENCE GATE; generic finance icon piles; unrelated bank symbols; photography; miniature; readable text; a composition reusable for an adjacent narration",
  };
  if (mode.presence === "hands") {
    return {
      ...common,
      visibleAction: `only two hands complete the narration's exact concrete step on ${topicObjects}, with the completed state visible beside the action`,
      cameraPlan: "tight tactile macro or close three-quarter action view with hands and full-size objects filling the frame; no head or torso",
      causalComposition: "center the hand action and connect it directly to the changed object state in the same frame; no portrait or background figure",
    };
  }
  return {
    ...common,
    visibleAction: `the topic objects themselves move, separate, drain, lock, open or rebalance to reveal the narration's cause and result; no human action`,
    cameraPlan: mode.id === "ARCHITECTURAL_CROSS_SECTION"
      ? "wide bright human-scale room-to-room view with strong foreground-to-background causal depth, natural materials and no figure"
      : mode.id === "SPLIT_EVIDENCE"
        ? "clean frontal or three-quarter comparison view with two connected life-size states and no figure"
        : "bold macro, compressed side view or wide object-system view selected to differ from adjacent modes; no figure",
    causalComposition: "make the topic-specific objects carry the complete cause-decision-result chain without a person, hand, portrait or generic symbol row",
  };
}

function storyboardRoleForScene(scene, sceneIndex, totalScenes) {
  const byId = STORYBOARD_ROLE_INDEX_BY_SCENE_ID[String(scene?.id ?? "")];
  if (Number.isInteger(byId)) return STORYBOARD_ROLES[byId];
  const relative = totalScenes <= 1 ? 0 : sceneIndex / (totalScenes - 1);
  const fallbackIndex = Math.min(STORYBOARD_ROLES.length - 1, Math.round(relative * (STORYBOARD_ROLES.length - 1)));
  return STORYBOARD_ROLES[fallbackIndex];
}

function compactNarration(value, max = 320) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}...`;
}

function cueField(cue, startLabel, endLabels) {
  const start = cue.indexOf(startLabel);
  if (start < 0) return "";
  const contentStart = start + startLabel.length;
  const candidateEnds = endLabels
    .map((label) => cue.indexOf(label, contentStart))
    .filter((index) => index >= 0);
  const end = candidateEnds.length > 0 ? Math.min(...candidateEnds) : cue.length;
  return cue.slice(contentStart, end).replace(/\s+/g, " ").trim().replace(/[. ]+$/, "");
}

function compactSceneArtDirection(scene) {
  const evidence = scene?.visualEvidence;
  if (evidence?.version === EVIDENCE_ENGINE_VERSION) {
    return [
      `Evidence ID: ${evidence.sceneIdentity}.`,
      `Scene-specific objects: ${compactNarration(evidence.sceneSpecificSignal, 260)}.`,
      `Real setting: ${compactNarration(evidence.sceneSetting, 180)}.`,
      `MUST SHOW: ${compactNarration(evidence.mustShow, 360)}.`,
      `Visible action: ${compactNarration(evidence.visibleAction, 180)}.`,
      `Scene integration plan: ${compactNarration(evidence.sceneIntegrationPlan, 260)}.`,
      `Motion plan: ${compactNarration(evidence.motionPlan, 280)}.`,
      `Editorial proof: ${compactNarration(evidence.editorialProof, 180)}.`,
      `Causal composition: ${compactNarration(evidence.causalComposition, 220)}.`,
      `Continuity state: ${compactNarration(evidence.continuityState, 200)}.`,
      `MUST NOT SHOW: ${compactNarration(evidence.mustNotShow, 320)}.`,
      `Hero subject: ${compactNarration(evidence.heroSubject, 180)}.`,
      `Economic meaning: ${compactNarration(evidence.economicMeaning, 160)}.`,
      `Continuity anchor only, never the hero: ${compactNarration(evidence.continuityAnchor, 140)}.`,
      `Keep ${compactNarration(evidence.captionSafeZone, 120)} visually quiet but textured.`,
    ].join(" ");
  }
  const cue = String(scene?.visualCue ?? "").replace(/\s+/g, " ").trim();
  if (!cue) return "Use the narration's most concrete economic object as the single hero subject.";
  const intent = cueField(cue, "Scene intent:", ["Show ", "Camera:"]);
  const objects = cueField(cue, "Topic object reference only:", ["Supporting texture:", "Color family:"]);
  const texture = cueField(cue, "Supporting texture:", ["Color family:", "Anti-repetition:"]);
  const color = cueField(cue, "Color family:", ["Anti-repetition:"]);
  const compact = [
    intent ? `Scene concept: ${intent}.` : "",
    objects ? `Object options: ${objects}.` : "",
    texture ? `Texture: ${texture}.` : "",
    color ? `Palette: ${color}.` : "",
  ].filter(Boolean).join(" ");
  return compact || compactNarration(cue, 520);
}

function scenePrompt(scene, sceneIndex, totalScenes, resolvedVisualModes = null) {
  const evidence = scene.visualEvidence;
  const role = storyboardRoleForScene(scene, sceneIndex, totalScenes);
  const roleBeat = sceneRoleBeat(scene, sceneIndex);
  const visualMode = resolvedVisualModes?.[sceneIndex] ?? visualModeForScene(scene, sceneIndex, totalScenes);
  const directedEvidence = evidenceForVisualMode(evidence, visualMode);
  const previousVisualMode = sceneIndex > 0
    ? (resolvedVisualModes?.[sceneIndex - 1] ?? visualModeForScene(scenes[sceneIndex - 1], sceneIndex - 1, totalScenes))
    : null;
  const nextVisualMode = sceneIndex + 1 < totalScenes
    ? (resolvedVisualModes?.[sceneIndex + 1] ?? visualModeForScene(scenes[sceneIndex + 1], sceneIndex + 1, totalScenes))
    : null;
  const narration = compactNarration(scene.narration ?? scene.captionText ?? "");
  const previousEvidence = scenes[sceneIndex - 1]?.visualEvidence;
  const nextEvidence = scenes[sceneIndex + 1]?.visualEvidence;
  const transition = [
    previousEvidence ? `Advance from the previous ${previousEvidence.stage} result: ${compactNarration(previousEvidence.economicMeaning, 100)}.` : "Open the story with the unresolved contradiction.",
    nextEvidence ? `Leave a clear visual cause for the next ${nextEvidence.stage} beat.` : "Resolve the story without returning to the opening image.",
  ].join(" ");
  const essential = [
    NEW_IMAGE_INSTRUCTION,
    stylePrefixForMode(visualMode),
    `VISUAL MODALITY CONTRACT ${VISUAL_MODALITY_VERSION}: mode ${visualMode.id}. ${visualMode.instruction}`,
    presenceInstructionForMode(visualMode),
    styleRejectionForMode(visualMode),
    `Storyboard scene ${sceneIndex + 1} of ${totalScenes}; role ${role.role}, beat ${roleBeat}.`,
    `Visualize this Korean narration directly: "${narration}".`,
    `MUST SHOW this exact economic event: ${compactNarration(directedEvidence.mustShow, 360)}.`,
    `Hero subject: ${compactNarration(directedEvidence.heroSubject, 180)}. Visible action: ${compactNarration(directedEvidence.visibleAction, 190)}.`,
    `Distinct setting: ${compactNarration(directedEvidence.sceneSetting, 230)}.`,
    `Visual form: ${compactNarration(directedEvidence.visualForm, 220)}. Camera: ${compactNarration(directedEvidence.cameraPlan, 170)}. Lighting: ${compactNarration(directedEvidence.lightingPlan, 140)}.`,
    `SCENE INTEGRATION: ${compactNarration(directedEvidence.sceneIntegrationPlan, 280)}.`,
    `MOTION PLAN for later video: ${compactNarration(directedEvidence.motionPlan, 320)}. Show only a plausible mid-action instant in this still.`,
    `Causal proof: ${compactNarration(directedEvidence.causalComposition, 190)}. Editorial proof: ${compactNarration(evidence.editorialProof, 150)}.`,
    `Storyboard transition: ${transition}`,
    `MODALITY DIFFERENCE: previous mode ${previousVisualMode?.id ?? "NONE"}; current mode ${visualMode.id}; next mode ${nextVisualMode?.id ?? "NONE"}. The current silhouette, human presence and spatial form must visibly differ from both adjacent modes.`,
    previousEvidence
      ? `ADJACENT DIFFERENCE: the previous scene used mode ${previousVisualMode.id}. Do not repeat its human presence, spatial form, camera distance, setting silhouette or hero.`
      : "ADJACENT DIFFERENCE: establish a unique opening silhouette that no later scene should repeat.",
    nextEvidence
      ? `Reserve a different silhouette and presence pattern for the next scene mode ${nextVisualMode.id}.`
      : "End with a new resolved silhouette rather than recreating the opening frame.",
    `Use one hero subject and at most two supporting object groups. ${role.avoid}. If this image could illustrate an adjacent narration unchanged, reject it.`,
    `Continuity may use only ${compactNarration(evidence.continuityAnchor, 100)} as a tiny secondary marker; it must never become the hero or force repeated composition.`,
    `MUST NOT SHOW: ${compactNarration(directedEvidence.mustNotShow, 360)}.`,
    `Keep the ${compactNarration(evidence.captionSafeZone, 100)} calm but textured for later captions.`,
    resolutionInstructionForMode(visualMode),
  ];
  const prompt = essential.join(" ").replace(/\s+/g, " ").trim();
  if (prompt.length <= PROMPT_MAX_CHARS) return prompt;
  return [
    NEW_IMAGE_INSTRUCTION,
    stylePrefixForMode(visualMode),
    `VISUAL MODALITY CONTRACT ${VISUAL_MODALITY_VERSION}: mode ${visualMode.id}. ${visualMode.instruction}`,
    presenceInstructionForMode(visualMode),
    styleRejectionForMode(visualMode),
    `Storyboard scene ${sceneIndex + 1} of ${totalScenes}; role ${role.role}, beat ${roleBeat}.`,
    `Visualize this narration directly: "${compactNarration(narration, 220)}".`,
    `MUST SHOW: ${compactNarration(directedEvidence.mustShow, 320)}. Hero: ${compactNarration(directedEvidence.heroSubject, 140)}. Action: ${compactNarration(directedEvidence.visibleAction, 150)}.`,
    `Setting: ${compactNarration(directedEvidence.sceneSetting, 190)}. Form: ${compactNarration(directedEvidence.visualForm, 180)}. Camera: ${compactNarration(directedEvidence.cameraPlan, 140)}. Light: ${compactNarration(directedEvidence.lightingPlan, 110)}.`,
    `SCENE INTEGRATION: ${compactNarration(directedEvidence.sceneIntegrationPlan, 220)}. MOTION PLAN: ${compactNarration(directedEvidence.motionPlan, 240)}. Show only a plausible mid-action instant in this still.`,
    `Use one hero subject. ${role.avoid}. Reject any image reusable for an adjacent narration; change hero, action, location and camera.`,
    `MUST NOT SHOW: ${compactNarration(directedEvidence.mustNotShow, 260)}.`,
    resolutionInstructionForMode(visualMode),
  ].join(" ").replace(/\s+/g, " ").trim();
}
const sceneFile = (i) => path.join(OUT_DIR, `scene-${String(i + 1).padStart(2, "0")}.png`);

// ── 이미지 바이너리 차원 sniff (png/jpeg/webp) ────────────────────────────────
function sniffImageDims(buf) {
  if (!buf || buf.length < 32) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { format: "png", w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let p = 2;
    while (p + 9 < buf.length) {
      if (buf[p] !== 0xff) { p++; continue; }
      const marker = buf[p + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { format: "jpeg", w: buf.readUInt16BE(p + 7), h: buf.readUInt16BE(p + 5) };
      }
      p += 2 + buf.readUInt16BE(p + 2);
    }
    return { format: "jpeg", w: null, h: null };
  }
  if (buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP") {
    return { format: "webp", w: null, h: null };
  }
  return null;
}

const MIN_W = 900;
const MIN_H = 1200;
function dimsAcceptable(d) {
  return d && typeof d.w === "number" && typeof d.h === "number" && d.w >= MIN_W && d.h >= MIN_H && d.h >= Math.round(d.w * 1.2);
}

function imageSha256(file) {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

const PERCEPTUAL_AUDIT_VERSION = "ffmpeg_dhash64_v1";
const MIN_ADJACENT_DHASH_DISTANCE = 12;
const MIN_ANY_PRIOR_DHASH_DISTANCE = 8;

function imagePerceptualHash(file) {
  const result = spawnSync(
    "ffmpeg",
    ["-v", "error", "-i", file, "-vf", "scale=9:8:flags=area,format=gray", "-frames:v", "1", "-f", "rawvideo", "pipe:1"],
    { shell: false, windowsHide: true, encoding: null, maxBuffer: 1024 * 1024 },
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

function nearestPriorVisual(sceneStates, currentIndex, perceptualHash) {
  let nearest = null;
  for (let index = 0; index < currentIndex; index += 1) {
    const prior = sceneStates[index];
    if (prior.status !== "SAVED_OK" || typeof prior.perceptualHash !== "string") continue;
    const distance = perceptualDistance(prior.perceptualHash, perceptualHash);
    if (distance == null) continue;
    if (!nearest || distance < nearest.distance) nearest = { sceneIndex: index + 1, distance };
  }
  return nearest;
}

function isNearDuplicate(currentIndex, nearest) {
  if (!nearest) return false;
  const adjacent = nearest.sceneIndex === currentIndex;
  return nearest.distance < (adjacent ? MIN_ADJACENT_DHASH_DISTANCE : MIN_ANY_PRIOR_DHASH_DISTANCE);
}

// ── 같은 검증 컨트롤러로 저장된 장면만 건너뛴다(재실행 = 모자란 장면만) ───────
let previousSummary = null;
try {
  previousSummary = fs.existsSync(SUMMARY_PATH)
    ? JSON.parse(fs.readFileSync(SUMMARY_PATH, "utf8"))
    : null;
} catch {
  previousSummary = null;
}
const reusablePreviousSummary =
  previousSummary?.visualEngineVersion === outputVisualEngineVersion &&
  previousSummary?.imageControllerVersion === IMAGE_CONTROLLER_VERSION &&
  previousSummary?.visualModalityVersion === VISUAL_MODALITY_VERSION &&
  previousSummary?.characterReference?.characterId === CHARACTER_ID &&
  previousSummary?.characterReference?.referenceImageSha256 === CHARACTER_REFERENCE_SHA256 &&
  previousSummary?.characterReference?.hashVerified === true &&
  previousSummary?.expectedCount === sceneCount &&
  Array.isArray(previousSummary?.scenes);
const topicScopedModeOverride = resolveTopicScopedModeOverride();
const sceneVisualModes = scenes.map((scene, index) => {
  if (topicScopedModeOverride?.sceneIndex === index + 1) {
    return { id: topicScopedModeOverride.visualModeId, ...VISUAL_MODES[topicScopedModeOverride.visualModeId] };
  }
  return visualModeForScene(scene, index, sceneCount);
});
const scenePrompts = scenes.map((scene, index) => {
  const basePrompt = scenePrompt(scene, index, sceneCount, sceneVisualModes);
  if (!targetedRegenerationSceneIndexes.has(index + 1)) return basePrompt;
  const qualityReset = [
    "MANUAL VISUAL QUALITY REGENERATION REQUIRED: the earlier result was rejected for dark, mechanical, infographic-like, showroom-like, staged-still-life or continuity-drift qualities.",
    "Rebuild this as ONE bright coherent full-scale Korean everyday scene with ONE immediately understandable action and natural lived-in depth.",
    "ABSOLUTELY NO split or stacked panels, before-and-after collage, candlestick chart, currency stacks, coin piles, transparent cash display boxes, safe or vault box, paper roller, conveyor, mechanical finance mechanism, dark half-frame, giant arrow, arrow printed on a mat, showroom exhibit or finance-prop still life.",
    "Use only a few ordinary full-size household objects such as a plain envelope, folder, calendar, wallet, notebook or modest household-cash pouch, physically handled or changed in the narration's exact cause-and-result moment. Show no readable text or numbers.",
  ];
  const sceneSpecificManualReset = index + 1 === 5
    ? [
        "SCENE 5 EXACT CORRECTION: the previous result wrongly showed neatly separated objects. Show one believable lived-in table where a plain household-bills envelope and a separate investment-rule envelope have both tipped into the SAME open fabric pouch, with their blank cards visibly tangled together, while one small closed emergency envelope remains safely apart. The accidental mixing must be unmistakable without labels, currency, diagrams or a split composition.",
      ]
    : index + 1 === 12
      ? [
          "SCENE 12 EXACT CORRECTION: reject any tabletop-only still life, chart, graph, open notebook, document pile, portfolio case or cash container. Use a wide room-level view of a bright Korean living-room entryway: one slim closed rule folder sits in a simple grab-and-go wall pocket beside ordinary keys, a modest household pouch is stored separately on a warm wood shelf, and an open doorway or sunlit balcony gives clear forward depth. No person, cash, finance display or readable text.",
        ]
      : [];
  if (sceneVisualModes[index].presence === "none") {
    return [
      basePrompt,
      ...qualityReset,
      ...sceneSpecificManualReset,
      "Keep the scene person-free and make the ordinary objects themselves reveal the exact economic change without becoming a diagram or machine.",
    ].join(" ");
  }
  if (sceneVisualModes[index].presence === "hands") {
    return [
      basePrompt,
      ...qualityReset,
      ...sceneSpecificManualReset,
      `The earlier hands-only result also broke ${CHARACTER_NAME}'s wardrobe continuity. Match the attached identity board's visible fixed-wardrobe sleeves exactly, with natural adult male hands and restrained finger action; show no beige knitwear and keep the head, face, hair and torso fully outside the frame.`,
    ].join(" ");
  }
  return [
    basePrompt,
    ...qualityReset,
    ...sceneSpecificManualReset,
    "CHARACTER QUALITY REGENERATION REQUIRED: the earlier result drifted away from the selected character identity reference.",
    `Restore the exact ${CHARACTER_NAME} face, age, hairstyle, hair color, body proportions and fixed wardrobe from the attached identity board while preserving the economic event, setting, action and camera plan.`,
  ].join(" ");
});
const sceneRequirements = scenes.map((scene, index) => {
  const prompt = scenePrompts[index];
  return {
    visualEvidenceId: scene.visualEvidence.sceneIdentity,
    visualModeId: sceneVisualModes[index].id,
    presenceMode: sceneVisualModes[index].presence,
    characterReferenceRequired: sceneVisualModes[index].presence !== "none",
    sceneIntegrationPlan: scene.visualEvidence.sceneIntegrationPlan,
    motionPlan: scene.visualEvidence.motionPlan,
    promptFingerprint: createHash("sha256").update(prompt).digest("hex").slice(0, 16),
  };
});
if (topicScopedModeOverride) {
  const targetRequirement = sceneRequirements[topicScopedModeOverride.sceneIndex - 1];
  if (targetRequirement?.promptFingerprint !== topicScopedModeOverride.promptFingerprint) {
    console.error("ABORT: mode override packet prompt fingerprint does not match the exact regeneration prompt.");
    process.exit(3);
  }
}
if (topicScopedModeOverride?.executionApproved) {
  const targetRequirement = sceneRequirements[topicScopedModeOverride.sceneIndex - 1];
  let priorPromptAudit = null;
  let priorImageSummary = null;
  try {
    priorPromptAudit = JSON.parse(fs.readFileSync(path.join(OUT_DIR, "prompt-audit.json"), "utf8"));
    priorImageSummary = JSON.parse(fs.readFileSync(SUMMARY_PATH, "utf8"));
  } catch {
    // 아래 binding gate가 fail-closed로 처리한다.
  }
  const priorTarget = priorImageSummary?.scenes?.find((scene) => scene?.sceneIndex === topicScopedModeOverride.sceneIndex);
  const auditedTarget = priorPromptAudit?.rows?.find((scene) => scene?.sceneIndex === topicScopedModeOverride.sceneIndex);
  const targetFile = sceneFile(topicScopedModeOverride.sceneIndex - 1);
  const executionBindingsReady =
    targetRequirement?.promptFingerprint === topicScopedModeOverride.promptFingerprint &&
    priorPromptAudit?.passed === true &&
    priorPromptAudit?.externalActionPerformed === false &&
    priorPromptAudit?.topicScopedModeOverride?.packetSha256 === topicScopedModeOverride.packetSha256 &&
    priorPromptAudit?.visualModalityAudit?.passed === true &&
    auditedTarget?.promptFingerprint === topicScopedModeOverride.promptFingerprint &&
    priorImageSummary?.allReady === true &&
    priorTarget?.visualModeId !== targetRequirement?.visualModeId &&
    priorTarget?.imageSha256 === topicScopedModeOverride.currentImageSha256 &&
    fs.existsSync(targetFile) &&
    imageSha256(targetFile) === topicScopedModeOverride.currentImageSha256;
  if (!executionBindingsReady) {
    console.error("ABORT: approved override execution is not bound to the current prompt audit and existing target image.");
    process.exit(3);
  }
}
if (promptAuditOnly) {
  const legacyPresenceConflictPatterns = [
    /sculpted faceless characters and objects/i,
    /physically inhabitable by the adult character/i,
    /faceless stylized person acts/i,
    /show a hand or faceless figure/i,
    /person, decision object/i,
    /human-centered wide composition/i,
    /small faceless figure performing/i,
  ];
  const retiredDirectionPatterns = [
    /the recurring character lunges or reaches between/i,
    /dynamic low three-quarter medium-wide action view/i,
    /full-scale corridor or threshold with separate temptation/i,
    /use dark warning light only when the narration requires it/i,
  ];
  const rows = scenePrompts.map((prompt, index) => {
    const mode = sceneVisualModes[index];
    const conflicts = mode.presence === "character"
      ? []
      : legacyPresenceConflictPatterns.filter((pattern) => pattern.test(prompt)).map((pattern) => pattern.source);
    const presenceGatePassed = mode.presence === "character"
      ? /PRESENCE GATE: ONE RECURRING CHARACTER IS ALLOWED/i.test(prompt)
      : mode.presence === "hands"
        ? /PRESENCE GATE: HANDS ONLY/i.test(prompt)
        : /PRESENCE GATE: NO PERSON/i.test(prompt);
    const contractPassed =
      /bright family-feature-quality cinematic 3D animation/i.test(prompt) &&
      /SCENE INTEGRATION:/i.test(prompt) &&
      /MOTION PLAN/i.test(prompt) &&
      /plausible mid-action instant/i.test(prompt) &&
      retiredDirectionPatterns.every((pattern) => !pattern.test(prompt));
    return {
      sceneIndex: index + 1,
      sceneId: scenes[index].id,
      visualModeId: mode.id,
      presenceMode: mode.presence,
      presenceGatePassed,
      contractPassed,
      legacyPresenceConflicts: conflicts,
      promptFingerprint: sceneRequirements[index].promptFingerprint,
      prompt,
    };
  });
  // 실제 생성 뒤에 적용되는 시퀀스 다양성 게이트를 무전송 패킷에도 동일하게 적용한다.
  // 개별 프롬프트가 모두 유효해도 캐릭터/비캐릭터 비율이 어긋나면 외부 생성 전에 차단해야 한다.
  const promptVisualModalityAudit = buildVisualModalityAudit(rows);
  const audit = {
    schemaVersion: "money_shorts_scene_prompt_audit_v2",
    visualModalityVersion: VISUAL_MODALITY_VERSION,
    topicId,
    sceneCount,
    externalActionPerformed: false,
    topicScopedModeOverride,
    visualModalityAudit: promptVisualModalityAudit,
    passed:
      rows.every((row) => row.presenceGatePassed && row.contractPassed && row.legacyPresenceConflicts.length === 0) &&
      promptVisualModalityAudit.passed,
    rows,
  };
  const auditPath = path.join(OUT_DIR, "prompt-audit.json");
  fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2), "utf8");
  console.log(JSON.stringify({
    passed: audit.passed,
    auditPath,
    visualModalityAudit: promptVisualModalityAudit,
    rows: rows.map((row) => ({
      sceneIndex: row.sceneIndex,
      sceneId: row.sceneId,
      visualModeId: row.visualModeId,
      presenceMode: row.presenceMode,
      presenceGatePassed: row.presenceGatePassed,
      contractPassed: row.contractPassed,
      legacyPresenceConflicts: row.legacyPresenceConflicts,
      promptFingerprint: row.promptFingerprint,
    })),
  }, null, 2));
  process.exit(audit.passed ? 0 : 1);
}
const reusableSceneIndexes = new Set(
  reusablePreviousSummary
    ? previousSummary.scenes
        .filter((scene) => {
          if (scene?.status !== "SAVED_OK" || !Number.isInteger(scene?.sceneIndex)) return false;
          if (targetedRegenerationSceneIndexes.has(scene.sceneIndex)) return false;
          const requirement = sceneRequirements[scene.sceneIndex - 1];
          const file = sceneFile(scene.sceneIndex - 1);
          const promptMatches = scene.promptFingerprint === requirement?.promptFingerprint;
          const targetedPreserve = targetedRegenerationSceneIndexes.size > 0;
          return requirement &&
            scene.visualEvidenceId === requirement.visualEvidenceId &&
            (promptMatches || targetedPreserve) &&
            typeof scene.imageSha256 === "string" &&
            scene.imageSha256.length === 64 &&
            typeof scene.perceptualHash === "string" &&
            scene.perceptualHash.length === 16 &&
            fs.existsSync(file) &&
            imageSha256(file) === scene.imageSha256 &&
            imagePerceptualHash(file) === scene.perceptualHash;
        })
        .map((scene) => scene.sceneIndex)
    : [],
);

const sceneStates = scenes.map((s, i) => {
  const file = sceneFile(i);
  const requirement = sceneRequirements[i];
  if (reusableSceneIndexes.has(i + 1) && fs.existsSync(file)) {
    const dims = sniffImageDims(fs.readFileSync(file));
    if (dimsAcceptable(dims)) {
      const previousScene = previousSummary?.scenes?.find((scene) => scene?.sceneIndex === i + 1);
      return {
        sceneIndex: i + 1,
        file,
        ...requirement,
        promptFingerprint: targetedRegenerationSceneIndexes.size > 0 && typeof previousScene?.promptFingerprint === "string"
          ? previousScene.promptFingerprint
          : requirement.promptFingerprint,
        imageSha256: imageSha256(file),
        perceptualHash: imagePerceptualHash(file),
        nearestVisualSceneIndex: null,
        nearestVisualDistance: null,
        width: dims.w,
        height: dims.h,
        referenceAttached: previousScene?.referenceAttached === true,
        status: "SAVED_OK",
        method: "existing_file_skip",
      };
    }
  }
  return {
    sceneIndex: i + 1,
    file,
    ...requirement,
    imageSha256: null,
    perceptualHash: null,
    nearestVisualSceneIndex: null,
    nearestVisualDistance: null,
    width: null,
    height: null,
    referenceAttached: false,
    status: "PENDING",
    method: null,
  };
});

const reusedHashes = new Map();
for (const state of sceneStates) {
  if (state.status !== "SAVED_OK" || typeof state.imageSha256 !== "string") continue;
  const previousIndex = reusedHashes.get(state.imageSha256);
  if (previousIndex != null) {
    state.status = "PENDING";
    state.imageSha256 = null;
    state.method = `duplicate_existing_image_of_scene_${previousIndex}_regenerate`;
  } else {
    reusedHashes.set(state.imageSha256, state.sceneIndex);
  }
}

for (let index = 0; index < sceneStates.length; index += 1) {
  const state = sceneStates[index];
  if (state.status !== "SAVED_OK" || typeof state.perceptualHash !== "string") continue;
  const nearest = nearestPriorVisual(sceneStates, index, state.perceptualHash);
  state.nearestVisualSceneIndex = nearest?.sceneIndex ?? null;
  state.nearestVisualDistance = nearest?.distance ?? null;
  if (isNearDuplicate(index, nearest)) {
    state.status = "PENDING";
    state.imageSha256 = null;
    state.perceptualHash = null;
    state.method = `near_duplicate_existing_scene_${nearest.sceneIndex}_distance_${nearest.distance}_regenerate`;
  }
}

function buildVisualDifferenceAudit(states) {
  const checked = states.filter((state) => state.status === "SAVED_OK" && typeof state.perceptualHash === "string");
  return {
    version: PERCEPTUAL_AUDIT_VERSION,
    adjacentMinimumDistance: MIN_ADJACENT_DHASH_DISTANCE,
    anyPriorMinimumDistance: MIN_ANY_PRIOR_DHASH_DISTANCE,
    checkedCount: checked.length,
    passed: checked.length === sceneCount && states.every((state) =>
      state.status === "SAVED_OK" &&
      typeof state.perceptualHash === "string" &&
      (state.nearestVisualDistance == null || !isNearDuplicate(state.sceneIndex - 1, {
        sceneIndex: state.nearestVisualSceneIndex,
        distance: state.nearestVisualDistance,
      }))),
  };
}

function buildVisualModalityAudit(states) {
  const characterCount = sceneVisualModes.filter((mode) => mode.presence === "character").length;
  const handsOnlyCount = sceneVisualModes.filter((mode) => mode.presence === "hands").length;
  const noPersonCount = sceneVisualModes.filter((mode) => mode.presence === "none").length;
  const distinctModeCount = new Set(sceneVisualModes.map((mode) => mode.id)).size;
  const maxCharacterCount = Math.ceil(sceneCount * 0.45);
  const minNonCharacterCount = Math.floor(sceneCount * 0.55);
  const requiredDistinctModes = Math.min(6, Math.max(3, sceneCount - 1));
  const sceneContractsPassed = states.length === sceneCount && states.every((state, index) =>
    state.visualModeId === sceneVisualModes[index].id &&
    state.presenceMode === sceneVisualModes[index].presence);
  return {
    version: VISUAL_MODALITY_VERSION,
    modeIds: sceneVisualModes.map((mode) => mode.id),
    characterCount,
    handsOnlyCount,
    noPersonCount,
    nonCharacterCount: handsOnlyCount + noPersonCount,
    maxCharacterCount,
    minNonCharacterCount,
    distinctModeCount,
    requiredDistinctModes,
    sceneContractsPassed,
    manualVisualReviewRequired: true,
    passed:
      sceneContractsPassed &&
      characterCount <= maxCharacterCount &&
      handsOnlyCount + noPersonCount >= minNonCharacterCount &&
      distinctModeCount >= requiredDistinctModes,
  };
}

function buildCharacterContinuityAudit(states) {
  const promptCoveragePassed = scenePrompts.every((prompt, index) => {
    const mode = sceneVisualModes[index];
    if (mode.presence === "character") {
      return prompt.includes(CHARACTER_CONTINUITY_VERSION) &&
        /attached .* identity board/i.test(prompt) &&
        /matching face, age, hairstyle, hair color, body proportions and fixed wardrobe/i.test(prompt);
    }
    if (mode.presence === "hands") {
      return /PRESENCE GATE: HANDS ONLY/i.test(prompt) &&
        /attached .* identity board/i.test(prompt) &&
        /fixed-wardrobe sleeves consistent/i.test(prompt) &&
        /no head, face, hair/i.test(prompt);
    }
    return /PRESENCE GATE: NO PERSON/i.test(prompt) && /no human, head, face, hair, hands/i.test(prompt);
  });
  const targetedRegenerationPassed = targetedRegenerationScenes.every((sceneNumber) => {
    const state = states[sceneNumber - 1];
    return state?.status === "SAVED_OK" && state?.method !== "existing_file_skip";
  });
  const referenceRequiredSceneStates = states.filter((state) => state.characterReferenceRequired === true);
  const referenceAttachmentPassed =
    referenceRequiredSceneStates.length > 0 &&
    referenceRequiredSceneStates.every((state) => state.status === "SAVED_OK" && state.referenceAttached === true);
  return {
    version: CHARACTER_CONTINUITY_VERSION,
    promptCoveragePassed,
    referenceHashVerified: actualCharacterReferenceSha256 === CHARACTER_REFERENCE_SHA256,
    referenceAttachmentPassed,
    characterId: CHARACTER_ID,
    characterName: CHARACTER_NAME,
    referenceImageSha256: CHARACTER_REFERENCE_SHA256,
    targetedRegenerationScenes,
    targetedRegenerationPassed,
    passed: promptCoveragePassed && referenceAttachmentPassed && targetedRegenerationPassed,
    manualVisualReviewRequired: true,
    characterSceneCount: sceneVisualModes.filter((mode) => mode.presence === "character").length,
    handsOnlySceneCount: sceneVisualModes.filter((mode) => mode.presence === "hands").length,
    noPersonSceneCount: sceneVisualModes.filter((mode) => mode.presence === "none").length,
    referenceRequiredSceneCount: sceneVisualModes.filter((mode) => mode.presence !== "none").length,
    requiredIdentity: "exact selected character face, age, hairstyle, hair color, body proportions and fixed wardrobe",
    rejectedIdentityDrift: ["changed face", "changed age", "changed hairstyle", "changed hair color", "changed body proportions", "changed wardrobe", "multi-view board recreation"],
  };
}

function buildMotionPlanAudit(states) {
  const promptCoveragePassed = scenePrompts.every((prompt) =>
    /SCENE INTEGRATION:/i.test(prompt) && /MOTION PLAN/i.test(prompt) && /plausible mid-action instant/i.test(prompt));
  const evidenceCoveragePassed = scenes.every((scene) =>
    typeof scene?.visualEvidence?.sceneIntegrationPlan === "string" &&
    scene.visualEvidence.sceneIntegrationPlan.length >= 120 &&
    typeof scene.visualEvidence.motionPlan === "string" &&
    scene.visualEvidence.motionPlan.length >= 180);
  const stateCoveragePassed = states.length === sceneCount && states.every((state, index) =>
    state.sceneIntegrationPlan === scenes[index].visualEvidence.sceneIntegrationPlan &&
    state.motionPlan === scenes[index].visualEvidence.motionPlan);
  return {
    version: "money_shorts_scene_motion_plan_v1",
    promptCoveragePassed,
    evidenceCoveragePassed,
    stateCoveragePassed,
    manualVideoReviewRequired: true,
    passed: promptCoveragePassed && evidenceCoveragePassed && stateCoveragePassed,
  };
}

const pendingCount = sceneStates.filter((s) => s.status === "PENDING").length;
if (topicScopedModeOverride?.executionApproved) {
  const pendingSceneIndexes = sceneStates.filter((scene) => scene.status === "PENDING").map((scene) => scene.sceneIndex);
  if (pendingSceneIndexes.length !== 1 || pendingSceneIndexes[0] !== topicScopedModeOverride.sceneIndex) {
    console.error("ABORT: approved override execution must have exactly one pending target scene.");
    process.exit(3);
  }
  const targetFile = sceneFile(topicScopedModeOverride.sceneIndex - 1);
  const backupDir = path.join(OUT_DIR, "superseded-v1");
  const backupFile = path.join(backupDir, `scene-${String(topicScopedModeOverride.sceneIndex).padStart(2, "0")}-${topicScopedModeOverride.currentImageSha256.slice(0, 16)}.png`);
  fs.mkdirSync(backupDir, { recursive: true });
  if (!fs.existsSync(backupFile)) fs.copyFileSync(targetFile, backupFile);
  if (imageSha256(backupFile) !== topicScopedModeOverride.currentImageSha256) {
    console.error("ABORT: existing target image backup hash mismatch.");
    process.exit(3);
  }
}
log(`scenes: ${sceneCount}, 이미 저장됨: ${sceneCount - pendingCount}, 생성 대상: ${pendingCount}`);
if (pendingCount === 0) {
  writeSummary({
    topicId,
    expectedCount: sceneCount,
    allReady: true,
    blockerCode: null,
    scenes: sceneStates,
    visualDifferenceAudit: buildVisualDifferenceAudit(sceneStates),
    visualModalityAudit: buildVisualModalityAudit(sceneStates),
    characterContinuityAudit: buildCharacterContinuityAudit(sceneStates),
    motionPlanAudit: buildMotionPlanAudit(sceneStates),
    submissionsUsed: 0,
  });
  log("모든 장면 이미지가 이미 준비됨 — 생성 없이 종료.");
  process.exit(0);
}

// ── Playwright + ChatGPT (여기서부터만 브라우저 접근) ─────────────────────────
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
  interceptRecover,
} =
  await import("./_chatgpt-image-core.mjs");

const ROUTING_RECOVERY_LIMIT_PER_SCENE = topicScopedModeOverride?.executionApproved ? 0 : 1;
const VISUAL_DIFFERENCE_RECOVERY_LIMIT_PER_SCENE = topicScopedModeOverride?.executionApproved ? 0 : 1;
const SUBMISSION_HARD_CAP = topicScopedModeOverride?.executionApproved
  ? 1
  : sceneCount * (1 + ROUTING_RECOVERY_LIMIT_PER_SCENE + VISUAL_DIFFERENCE_RECOVERY_LIMIT_PER_SCENE);
let submissionCount = 0;
let routingRecoveryCount = 0;
let visualDifferenceRecoveryCount = 0;

const PASSIVE_UNTIL_MS = 25000;
const POLL_INTERVAL_MS = 1800;
const STABLE_POLLS = 3;
const DIAG_AT_MS = 150000;
const HARD_TIMEOUT_MS = 180000;

// page-wide 생성 이미지 수집 (user 첨부 제외) — fresh-v3 실증 로직
async function collectGenImagesPageWide(page) {
  return await page.evaluate(() => {
    function cid(s) { const m = (s || "").match(/[?&]id=([^&]+)/); return m ? m[1] : null; }
    return Array.from(document.querySelectorAll("img"))
      .filter((i) => i.naturalWidth >= 200 && !i.closest('[data-message-author-role="user"]'))
      .map((i) => ({
        src: i.src || i.currentSrc || "", cid: cid(i.src),
        w: i.naturalWidth, h: i.naturalHeight,
        gen: /backend-api\/estuary\/content|backend-api\/files|oaiusercontent/.test(i.src || ""),
      }))
      .filter((x) => x.gen || x.src.startsWith("blob:"));
  });
}

async function collectCandidateUrlsDeep(page) {
  return await page.evaluate(() => {
    function cid(s) { const m = (s || "").match(/[?&]id=([^&]+)/); return m ? m[1] : null; }
    const out = [];
    const seen = new Set();
    for (const img of Array.from(document.querySelectorAll("img"))) {
      if (img.naturalWidth < 200) continue;
      if (img.closest('[data-message-author-role="user"]')) continue;
      const src = img.src || img.currentSrc || "";
      if (!src) continue;
      const gen = /backend-api\/estuary\/content|backend-api\/files|oaiusercontent/.test(src);
      if (!gen && !src.startsWith("blob:")) continue;
      const key = cid(src) || src.slice(0, 100);
      if (seen.has(key)) continue;
      seen.add(key);
      const urls = [{ url: src, kind: "src" }];
      for (const entry of (img.srcset || "").split(",")) {
        const u = entry.trim().split(/\s+/)[0];
        if (u && u !== src) urls.push({ url: u, kind: "srcset" });
      }
      const a = img.closest("a");
      if (a && a.href && a.href !== src) urls.push({ url: a.href, kind: "anchor" });
      out.push({ cid: cid(src), gen, naturalW: img.naturalWidth, naturalH: img.naturalHeight, urls });
    }
    return out;
  });
}

async function measureUrlInPage(page, url) {
  return await page.evaluate(async (u) => {
    try {
      const r = await fetch(u);
      if (!r.ok) return { ok: false, status: r.status };
      const blob = await r.blob();
      const bmp = await createImageBitmap(blob);
      const out = { ok: true, w: bmp.width, h: bmp.height, bytes: blob.size };
      bmp.close();
      return out;
    } catch (e) { return { ok: false, error: String(e).slice(0, 120) }; }
  }, url).catch((e) => ({ ok: false, error: String(e).slice(0, 120) }));
}

async function saveBestImage(page, destPath, baselineCids) {
  const groups = await collectCandidateUrlsDeep(page);
  const freshGen = groups.filter((g) => g.gen && (!g.cid || !baselineCids.has(g.cid)));
  const freshAny = groups.filter((g) => g.naturalW >= 400 && (!g.cid || !baselineCids.has(g.cid)));
  const usable = freshGen.length > 0 ? freshGen : freshAny.length > 0 ? freshAny : groups.filter((g) => g.gen);
  let best = null;
  for (const g of usable) {
    for (const cand of g.urls) {
      const m = await measureUrlInPage(page, cand.url);
      if (m.ok && (!best || m.w * m.h > best.m.w * best.m.h)) best = { url: cand.url, kind: cand.kind, m };
    }
  }
  if (best) {
    const buf = await page.evaluate(async (u) => {
      try {
        const r = await fetch(u);
        const ab = await r.arrayBuffer();
        return Array.from(new Uint8Array(ab));
      } catch { return null; }
    }, best.url).catch(() => null);
    if (buf && buf.length > 10000) {
      const b = Buffer.from(buf);
      fs.writeFileSync(destPath, b);
      const dims = sniffImageDims(b);
      return { ok: true, method: `best_candidate_${best.kind}`, w: dims?.w ?? best.m.w, h: dims?.h ?? best.m.h, bytes: b.length };
    }
  }
  // current-page intercept 회수 (sidebar/old conversation 스캔 금지)
  const intercepted = await interceptRecover(page, page.url(), log);
  let biggest = null;
  for (const [, body] of intercepted) {
    const dims = sniffImageDims(body);
    if (!dims) continue;
    if (!biggest || dims.w * dims.h > biggest.dims.w * biggest.dims.h) biggest = { body, dims };
  }
  if (biggest && biggest.body.length > 10000) {
    fs.writeFileSync(destPath, biggest.body);
    return { ok: true, method: "intercept_reload", w: biggest.dims.w, h: biggest.dims.h, bytes: biggest.body.length };
  }
  return { ok: false, method: "none" };
}

function stableKey(img) {
  return `${img.cid || String(img.src).slice(0, 80)}|${img.w}x${img.h}`;
}

const IMAGE_TOOL_TEXT_FAILURE_PATTERN =
  /이미지를 만들지 못|이미지 생성 도구.{0,80}(잘못 인식|생성되지)|기존 이미지 없이 새 이미지|could(?: not|n't) (?:create|generate).{0,40}image|image generation tool.{0,80}(misread|failed)/i;

async function detectImageToolTextFailure(page, baselineAssistantCount) {
  return await page.evaluate(({ baselineCount, failureSource }) => {
    const messages = Array.from(document.querySelectorAll('[data-message-author-role="assistant"]'));
    if (messages.length <= baselineCount) return null;
    const last = messages[messages.length - 1];
    const hasGeneratedImage = Array.from(last.querySelectorAll("img")).some((img) =>
      img.naturalWidth >= 200 && /backend-api\/estuary\/content|backend-api\/files|oaiusercontent|^blob:/.test(img.src || ""),
    );
    if (hasGeneratedImage) return null;
    const text = String(last.textContent || "").replace(/\s+/g, " ").trim();
    return new RegExp(failureSource, "i").test(text) ? text.slice(0, 240) : null;
  }, { baselineCount: baselineAssistantCount, failureSource: IMAGE_TOOL_TEXT_FAILURE_PATTERN.source });
}

async function generateOneScene(ctx, sceneIdx, prompt, destPath, attemptLabel = "primary") {
  let page = null;
  try {
    try {
      page = await ctx.newPage();
    } catch (error) {
      throw new Error(`IMAGE_TOOL_CHAT_OPEN_FAILED: unable to open image tab (${String(error?.message ?? error).slice(0, 80)})`);
    }
    // 임시 채팅에는 이미지 도구가 없다. 일반 새 대화를 사용하되 사람의 미전송 초안은 절대 지우지 않는다.
    await openFreshImageChat(page, log);
    await detectStop(page);
    await activateImageTool(page, log, warn);
    if (!(await verifyImageToolActive(page))) throw new Error("IMAGE_TOOL_NOT_ACTIVE: pre-submit verification failed");
    const characterReferenceRequired = sceneVisualModes[sceneIdx].presence !== "none";
    const referenceAttachment = characterReferenceRequired
      ? await attachRef(page, CHARACTER_REFERENCE_ABS, log)
      : null;
    if (characterReferenceRequired && !(await verifyImageToolActive(page))) {
      throw new Error("IMAGE_TOOL_NOT_ACTIVE: reference attach removed image mode");
    }
    await typePrompt(page, prompt, log);
    if (!(await verifyImageToolActive(page))) throw new Error("IMAGE_TOOL_NOT_ACTIVE: post-type verification failed");
    if (!(await checkSendEnabled(page))) throw new Error("send button disabled");

    const baseline = new Set([
      ...(referenceAttachment?.baselineCids ?? []),
      ...(await collectGenImagesPageWide(page)).map((x) => x.cid).filter(Boolean),
    ]);
    const baselineAssistantCount = await page.locator('[data-message-author-role="assistant"]').count();
    if (submissionCount >= SUBMISSION_HARD_CAP) throw new Error(`SUBMISSION_HARD_CAP(${SUBMISSION_HARD_CAP}) 도달`);
    submissionCount += 1;
    if (!(await verifyImageToolActive(page))) throw new Error("IMAGE_TOOL_NOT_ACTIVE: final submit verification failed");
    await sendPrompt(page);
    const submittedAt = Date.now();
    log(`scene-${sceneIdx + 1} 제출 [${attemptLabel}] (${submissionCount}/${SUBMISSION_HARD_CAP}) — passive ${PASSIVE_UNTIL_MS / 1000}s`);

    let stable = { key: null, count: 0 };
    let diagDone = false;
    while (Date.now() - submittedAt < HARD_TIMEOUT_MS) {
      const elapsed = Date.now() - submittedAt;
      await page.waitForTimeout(elapsed < PASSIVE_UNTIL_MS ? 2500 : POLL_INTERVAL_MS);
      await detectStop(page);
      const textFailure = await detectImageToolTextFailure(page, baselineAssistantCount);
      if (textFailure) {
        return { ok: false, method: "assistant_text_failure", error: `IMAGE_TOOL_TEXT_RESPONSE: ${textFailure}` };
      }
      if (Date.now() - submittedAt < PASSIVE_UNTIL_MS) continue;

      const fresh = (await collectGenImagesPageWide(page)).filter((x) => x.w >= 400 && (!x.cid || !baseline.has(x.cid)));
      if (fresh.length > 0) {
        const key = stableKey(fresh[fresh.length - 1]);
        stable = stable.key === key ? { key, count: stable.count + 1 } : { key, count: 1 };
        if (stable.count >= STABLE_POLLS) {
          const saved = await saveBestImage(page, destPath, baseline);
          if (saved.ok) return { ok: true, ...saved, referenceAttached: characterReferenceRequired, latencyMs: Date.now() - submittedAt };
          stable = { key: null, count: 0 }; // 저장 실패 — 계속 관찰
        }
      } else if (!diagDone && elapsed >= DIAG_AT_MS) {
        diagDone = true;
        warn(`scene-${sceneIdx + 1} ${DIAG_AT_MS / 1000}s 미감지 — current-page intercept 회수 시도`);
        const saved = await saveBestImage(page, destPath, baseline);
        if (saved.ok) return { ok: true, ...saved, referenceAttached: characterReferenceRequired, latencyMs: Date.now() - submittedAt };
      }
    }
    // 마지막 회수 시도 후 타임아웃 처리
    const lastTry = await saveBestImage(page, destPath, baseline);
    if (lastTry.ok) return { ok: true, ...lastTry, referenceAttached: characterReferenceRequired, latencyMs: Date.now() - submittedAt };
    return { ok: false, method: "timeout", error: "TIMEOUT_BLOCKED" };
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

function auditSavedScene(state, sceneIndex, result) {
  const dims = { w: result.w ?? null, h: result.h ?? null };
  state.width = dims.w;
  state.height = dims.h;
  state.referenceAttached = result.referenceAttached === true;
  state.method = result.method;
  state.status = dimsAcceptable(dims) ? "SAVED_OK" : "SAVED_LOW_QUALITY";
  state.imageSha256 = fs.existsSync(state.file) ? imageSha256(state.file) : null;
  state.perceptualHash = fs.existsSync(state.file) ? imagePerceptualHash(state.file) : null;
  state.nearestVisualSceneIndex = null;
  state.nearestVisualDistance = null;
  if (state.status !== "SAVED_OK") return { accepted: false, reason: "image_dimensions_below_contract" };
  if (typeof state.perceptualHash !== "string") {
    state.status = "REJECTED_PERCEPTUAL_AUDIT_UNAVAILABLE";
    state.method = "ffmpeg_dhash_failed";
    return { accepted: false, reason: "perceptual_audit_unavailable" };
  }
  const duplicateOf = sceneStates.find((candidate, index) =>
    index < sceneIndex && candidate.status === "SAVED_OK" && candidate.imageSha256 === state.imageSha256);
  const nearest = nearestPriorVisual(sceneStates, sceneIndex, state.perceptualHash);
  state.nearestVisualSceneIndex = nearest?.sceneIndex ?? null;
  state.nearestVisualDistance = nearest?.distance ?? null;
  if (duplicateOf) {
    state.status = "REJECTED_DUPLICATE_IMAGE";
    state.method = `exact_duplicate_of_scene_${duplicateOf.sceneIndex}`;
    return { accepted: false, reason: state.method, priorSceneIndex: duplicateOf.sceneIndex };
  }
  if (isNearDuplicate(sceneIndex, nearest)) {
    state.status = "REJECTED_NEAR_DUPLICATE_IMAGE";
    state.method = `near_duplicate_of_scene_${nearest.sceneIndex}_distance_${nearest.distance}`;
    return { accepted: false, reason: state.method, priorSceneIndex: nearest.sceneIndex };
  }
  return { accepted: true, reason: null };
}

// ── 실행 ─────────────────────────────────────────────────────────────────────
let browser = null;
let blockerCode = null;
try {
  await ensureChrome(CDP_PORT_GPT1, USER_DATA_GPT1, log);
  browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT_GPT1}`);
  const ctx = browser.contexts()[0] ?? (await browser.newContext());

  for (let i = 0; i < sceneCount; i++) {
    const st = sceneStates[i];
    if (st.status === "SAVED_OK") continue;
    const prompt = scenePrompts[i];
    try {
      let r = await generateOneScene(ctx, i, prompt, st.file);
      if (String(r.error ?? "").startsWith("IMAGE_TOOL_TEXT_RESPONSE:")) {
        routingRecoveryCount += 1;
        warn(`scene-${i + 1}: 신규 이미지 요청이 편집으로 오인됨 — 새 대화에서 1회만 재전송`);
        r = await generateOneScene(ctx, i, prompt, st.file, "new-chat-routing-recovery");
        if (r.ok) r.method = `routing_recovery_${r.method}`;
      }
      let visualDifferenceAttempts = 0;
      let audit = null;
      while (r.ok) {
        audit = auditSavedScene(st, i, r);
        if (audit.accepted || visualDifferenceAttempts >= VISUAL_DIFFERENCE_RECOVERY_LIMIT_PER_SCENE) break;
        visualDifferenceAttempts += 1;
        visualDifferenceRecoveryCount += 1;
        const priorEvidence = Number.isInteger(audit.priorSceneIndex)
          ? scenes[audit.priorSceneIndex - 1]?.visualEvidence
          : null;
        const recoveryPrompt = [
          prompt,
          `QUALITY REGENERATION REQUIRED: the first result failed the program visual-difference audit (${audit.reason}).`,
          priorEvidence
            ? `Create a clearly different silhouette from scene ${audit.priorSceneIndex}: do not reuse its ${compactNarration(priorEvidence.visualForm, 100)}, ${compactNarration(priorEvidence.cameraPlan, 90)}, setting layout or hero ${compactNarration(priorEvidence.heroSubject, 90)}.`
            : "Create a structurally different image while preserving the exact scene evidence and 3D editorial style.",
          "Change the spatial layout, camera distance, foreground/background balance and hero action. Do not switch to photography.",
        ].join(" ");
        warn(`scene-${i + 1}: 시각 유사도 검사 실패 — 장면 차별화 프롬프트로 1회 재생성`);
        st.status = "PENDING";
        st.imageSha256 = null;
        st.perceptualHash = null;
        r = await generateOneScene(ctx, i, recoveryPrompt, st.file, "visual-difference-recovery");
        if (r.ok) r.method = `visual_difference_recovery_${r.method}`;
      }
      if (r.ok) {
        if (!audit?.accepted) blockerCode = "NEAR_DUPLICATE_SCENE_IMAGE";
        log(`scene-${i + 1} 저장: ${st.status} ${st.width}x${st.height} (${r.method}, ${(r.latencyMs / 1000).toFixed(1)}s, nearest=${st.nearestVisualDistance ?? "n/a"})`);
      } else {
        st.status = String(r.error ?? "").startsWith("IMAGE_TOOL_") ? "BLOCKED_IMAGE_TOOL" : "TIMEOUT_BLOCKED";
        st.method = String(r.error ?? r.method ?? "unknown").slice(0, 240);
        if (st.status === "BLOCKED_IMAGE_TOOL") blockerCode = "BLOCKED_IMAGE_TOOL";
        warn(`scene-${i + 1} 실패: ${r.error ?? r.method}`);
        if (st.status === "BLOCKED_IMAGE_TOOL") break;
      }
    } catch (e) {
      const msg = String(e?.message ?? e);
      if (/LOGIN_REQUIRED|Not logged in/i.test(msg)) {
        blockerCode = "BLOCKED_SESSION";
        st.status = "BLOCKED_SESSION";
        warn(`scene-${i + 1}: ChatGPT 로그인 필요 — 이후 장면 생성 중단(fail-closed)`);
        break;
      }
      if (/STOP_DETECTED|CAPTCHA_DETECTED/.test(msg)) {
        blockerCode = "BLOCKED_RATE_OR_CAPTCHA";
        st.status = "BLOCKED_RATE_OR_CAPTCHA";
        warn(`scene-${i + 1}: ${msg.slice(0, 100)} — 이후 장면 생성 중단`);
        break;
      }
      if (/IMAGE_TOOL_/.test(msg)) {
        blockerCode = "BLOCKED_IMAGE_TOOL";
        st.status = "BLOCKED_IMAGE_TOOL";
        st.method = msg.slice(0, 500);
        warn(`scene-${i + 1}: 이미지 생성 모드 검증 실패 — 이후 장면 생성 중단`);
        break;
      }
      st.status = "ERROR";
      st.method = msg.slice(0, 120);
      warn(`scene-${i + 1} 오류: ${msg.slice(0, 160)}`);
    }
  }
} catch (e) {
  const msg = String(e?.message ?? e);
  blockerCode = blockerCode ?? (/CDP not available/i.test(msg) ? "BLOCKED_SESSION" : "RUNNER_ERROR");
  warn(`runner 오류: ${msg.slice(0, 200)}`);
} finally {
  // CDP attach만 끊는다 — Owner의 Chrome 자체는 닫지 않는다.
  if (browser) await browser.close().catch(() => {});
}

const allReady = sceneStates.every((s) => s.status === "SAVED_OK");
if (!allReady && !blockerCode) blockerCode = "PARTIAL_GENERATION";
const summary = writeSummary({
  topicId,
  visualEngineVersion: outputVisualEngineVersion,
  expectedCount: sceneCount,
  allReady,
  blockerCode: allReady ? null : blockerCode,
  scenes: sceneStates,
  visualDifferenceAudit: buildVisualDifferenceAudit(sceneStates),
  visualModalityAudit: buildVisualModalityAudit(sceneStates),
  characterContinuityAudit: buildCharacterContinuityAudit(sceneStates),
  motionPlanAudit: buildMotionPlanAudit(sceneStates),
  submissionsUsed: submissionCount,
  routingRecoveriesUsed: routingRecoveryCount,
  visualDifferenceRecoveriesUsed: visualDifferenceRecoveryCount,
});
log(`summary: ${SUMMARY_PATH}`);
log(`결과: ${sceneStates.filter((s) => s.status === "SAVED_OK").length}/${sceneCount} SAVED_OK, allReady=${summary.allReady}`);
process.exit(
  allReady
    ? 0
    : ["BLOCKED_GATE", "BLOCKED_SESSION", "BLOCKED_IMAGE_TOOL"].includes(blockerCode)
      ? 3
      : 1,
);
