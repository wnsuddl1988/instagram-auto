/**
 * Generates local dry-run pipeline input fixtures from a RenderManifest JSON.
 *
 * Usage:
 *   node scripts/build-local-pipeline-inputs-from-render-manifest.mjs \
 *     --manifest scripts\fixtures\provider-candidate-render-manifest.visual-only.json \
 *     --out-dir  C:\tmp\money-shorts-os\local-pipeline-input-builder-v1\inputs
 *
 * Outputs (all local_mock, data-only, no real credentials):
 *   generated-tts-script.local-mock.json
 *   generated-upload-metadata.local-mock.json
 *   generated-owner-upload-approval.local-mock.json
 *
 * Security constraints:
 * - No child_process, no exec, no execSync, no shell: true.
 * - No fetch, axios, YouTube/Instagram API, OAuth, accessToken, refreshToken.
 * - No process.env access.
 * - out-dir must be outside repo root.
 * - No .money-shorts-local/ access.
 * - No output artifacts inside repo.
 * - piq_diag_out.txt never touched.
 * - actualUploadAllowed is always false.
 * - actualUploadPerformed is always false.
 * - notUploaded is always true.
 * - Caption texts used as-is from manifest — no new economic claims invented.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

// ── CLI args ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
}

const manifestPath = getArg("--manifest");
const outDir = getArg("--out-dir");

if (!manifestPath || !outDir) {
  console.error(
    "Usage: node build-local-pipeline-inputs-from-render-manifest.mjs --manifest <path> --out-dir <path>",
  );
  process.exit(1);
}

const manifestAbsPath = resolve(REPO_ROOT, manifestPath);
const outDirAbs = resolve(outDir);

// Safety: out-dir must not be inside repo root
if (outDirAbs.startsWith(REPO_ROOT + "\\") || outDirAbs.startsWith(REPO_ROOT + "/")) {
  console.error(
    `ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`,
  );
  process.exit(1);
}

// Safety: .money-shorts-local forbidden
if ([manifestAbsPath, outDirAbs].some((p) => p.includes(".money-shorts-local"))) {
  console.error("ABORT: .money-shorts-local access forbidden.");
  process.exit(1);
}

console.log(`\n[input-builder] manifest: ${manifestAbsPath}`);
console.log(`[input-builder] out-dir:  ${outDirAbs}\n`);

// ── Load manifest ───────────────────────────────────────────────────────────────
let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestAbsPath, "utf-8"));
} catch (e) {
  console.error(`ABORT: Cannot read manifest: ${e.message}`);
  process.exit(1);
}

const {
  manifestId,
  sourceId,
  factCardIds = [],
  imageInputs = [],
  captionOverlays = [],
  ffmpegPlan,
} = manifest;

if (!manifestId) {
  console.error("ABORT: manifest missing manifestId.");
  process.exit(1);
}

const factCardId = factCardIds[0] ?? `fact-card-${manifestId}`;

// Compute target duration from ffmpegPlan or imageInputs sum
const targetDurationSec =
  ffmpegPlan?.estimatedDurationSec ??
  imageInputs.reduce((sum, s) => sum + (s.durationSec ?? 0), 0);

// Build a caption lookup by sceneIndex
const captionByIndex = {};
for (const co of captionOverlays) {
  captionByIndex[co.sceneIndex] = co;
}

// Compute cumulative scene start times
let cumulativeSec = 0;
const sceneTimings = imageInputs.map((inp) => {
  const start = cumulativeSec;
  cumulativeSec += inp.durationSec ?? 0;
  return { sceneIndex: inp.sceneIndex, durationSec: inp.durationSec, startSec: start, endSec: cumulativeSec };
});

mkdirSync(outDirAbs, { recursive: true });

// ── Generate TTS script ─────────────────────────────────────────────────────────
console.log("[step 1/3] Generating TTS script...");

const scriptId = `tts-script-${manifestId}-generated-local-mock`;

const ttsScenes = sceneTimings.map(({ sceneIndex, durationSec, startSec, endSec }) => {
  const caption = captionByIndex[sceneIndex];
  const captionText = caption?.captionText ?? `Scene ${sceneIndex}`;
  return {
    sceneNumber: sceneIndex,
    sceneRole: "scene",
    durationSec,
    startSec,
    endSec,
    narration: captionText,
    captionText,
  };
});

const ttsScript = {
  schemaVersion: "money_shorts_tts_script_v1",
  scriptId,
  manifestId,
  factCardId,
  sourceId,
  ttsMode: "local_mock",
  ttsProvider: "local_mock",
  targetDurationSec,
  scenes: ttsScenes,
  riskNotes: [
    "local_mock: narration text is derived from manifest caption overlays — not real speech.",
    "local_mock TTS: final voice quality requires ElevenLabs or OpenAI TTS in a dedicated quality-check task.",
    "This script is generated for pipeline validation only — not for public release.",
    "Caption texts used as-is from RenderManifest — no new economic claims were added.",
  ],
};

const ttsScriptPath = join(outDirAbs, "generated-tts-script.local-mock.json");
writeFileSync(ttsScriptPath, JSON.stringify(ttsScript, null, 2), "utf-8");
console.log(`  generated: ${ttsScriptPath}`);
console.log(`  scenes: ${ttsScenes.length}, targetDurationSec: ${targetDurationSec}s`);

// ── Generate upload metadata ────────────────────────────────────────────────────
console.log("\n[step 2/3] Generating upload metadata...");

// Use first caption text as the base for title/caption; flag as requiring Owner review
const firstCaptionText = captionByIndex[1]?.captionText ?? manifestId;
const ytTitle = `[검수 필요] ${firstCaptionText} #경제신호 #생활경제`;
const ytDescription =
  `[Owner 검수 필요 — data-only local mock]\n\n` +
  `출처: ${sourceId}\n\n` +
  `주의: 이 콘텐츠는 투자 권고가 아닙니다. Owner 검수 후 업로드 여부를 결정하세요.\n\n` +
  `#경제신호 #생활경제 #돈관리 #Shorts`;
const igCaption =
  `[검수 필요] ${firstCaptionText} 🔍\n\n` +
  `출처: ${sourceId}\n투자 권고 아님 — Owner 검수 후 업로드 결정\n\n` +
  `#경제신호 #생활경제 #돈관리 #Shorts`;

const uploadMetadataId = `upload-metadata-${manifestId}-generated-local-mock`;

const uploadMetadata = {
  schemaVersion: "money_shorts_upload_metadata_v1",
  metadataId: uploadMetadataId,
  sourceManifestId: manifestId,
  mode: "local_mock",
  ownerApprovalRequired: true,
  notUploaded: true,
  platforms: ["youtube_shorts", "instagram_reels"],
  youtube_shorts: {
    title: ytTitle,
    description: ytDescription,
    hashtags: ["경제신호", "생활경제", "돈관리", "Shorts"],
    visibilityPlan: "owner_review_first",
    categoryId: null,
    defaultLanguage: "ko",
    madeForKids: false,
  },
  instagram_reels: {
    caption: igCaption,
    hashtags: ["경제신호", "생활경제", "돈관리", "Shorts"],
    visibilityPlan: "owner_review_first",
  },
  riskNotes: [
    "local_mock: no real account, channel, token, or credential used.",
    "ownerApprovalRequired=true — Owner must review title, description, and caption before any upload.",
    "notUploaded=true — this is a data-only payload. No upload has occurred.",
    "Title and caption are generated from manifest caption text. Owner review required before public use.",
    "투자 권고 아님 — content is for informational/educational purposes only.",
    "No platform credentials, tokens, or API keys are present in this fixture.",
  ],
};

const uploadMetadataPath = join(outDirAbs, "generated-upload-metadata.local-mock.json");
writeFileSync(uploadMetadataPath, JSON.stringify(uploadMetadata, null, 2), "utf-8");
console.log(`  generated: ${uploadMetadataPath}`);

// ── Generate owner upload approval ─────────────────────────────────────────────
console.log("\n[step 3/3] Generating owner upload approval fixture...");

// uploadPayloadId must match the pattern used by build-upload-payload-from-tts-mux-summary.mjs:
//   `upload-payload-${ttsMuxSummary.manifestId}-local-mock`
const uploadPayloadId = `upload-payload-${manifestId}-local-mock`;
const approvalId = `owner-approval-${manifestId}-generated-local-mock`;

const ownerApproval = {
  schemaVersion: "money_shorts_owner_upload_approval_v1",
  approvalId,
  mode: "local_mock",
  approvalStatus: "approved",
  approvedFor: "dry_run_upload_ready_packet_only",
  uploadPayloadId,
  sourceManifestId: manifestId,
  approvedPlatforms: ["youtube_shorts", "instagram_reels"],
  ownerApprovalRequired: true,
  actualUploadAllowed: false,
  actualUploadPerformed: false,
  approvalTimestamp: "2026-01-01T00:00:00.000Z",
  approvalNotes: "generated local_mock dry-run approval — no real account, token, or upload allowed.",
  riskNotes: [
    "local_mock: this is a generated owner approval fixture for pipeline validation only.",
    "actualUploadAllowed=false — no actual upload may occur from this approval.",
    "actualUploadPerformed=false — confirmed no upload has been performed.",
    "approvedFor=dry_run_upload_ready_packet_only — approval covers dry-run packet generation only.",
    "Real upload requires a separate explicit Owner approval with live platform credentials and account.",
    "ownerApprovalRequired=true must remain true in all derived artifacts.",
  ],
};

const ownerApprovalPath = join(outDirAbs, "generated-owner-upload-approval.local-mock.json");
writeFileSync(ownerApprovalPath, JSON.stringify(ownerApproval, null, 2), "utf-8");
console.log(`  generated: ${ownerApprovalPath}`);
console.log(`  uploadPayloadId: ${uploadPayloadId}`);

// ── Summary ─────────────────────────────────────────────────────────────────────
console.log(`\n[done] 3 input fixtures generated in: ${outDirAbs}`);
console.log(`  tts-script:    ${ttsScriptPath}`);
console.log(`  upload-meta:   ${uploadMetadataPath}`);
console.log(`  owner-approval:${ownerApprovalPath}`);
console.log(`\n  To run the pipeline with generated inputs:`);
console.log(`    node scripts/run-local-money-shorts-pipeline-dry-run.mjs \\`);
console.log(`      --manifest ${manifestAbsPath} \\`);
console.log(`      --tts-script ${ttsScriptPath} \\`);
console.log(`      --upload-metadata ${uploadMetadataPath} \\`);
console.log(`      --owner-approval ${ownerApprovalPath} \\`);
console.log(`      --out-root <repo-external-out-root>\n`);
