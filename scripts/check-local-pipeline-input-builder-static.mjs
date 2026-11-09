/**
 * Static guard: local pipeline input builder integrity.
 * No network, no API calls, no clipboard, no fs writes to repo.
 * Exit 0 = all PASS. Exit 1 = at least one FAIL.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const BUILDER_PATH = resolve(__dirname, "build-local-pipeline-inputs-from-render-manifest.mjs");
const builderSrc = readFileSync(BUILDER_PATH, "utf-8");

let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}`);
    failed++;
  }
}

// Helper: filter comment lines for forbidden pattern checks
function codeLines(src) {
  return src
    .split("\n")
    .filter((l) => !/^\s*(\/\/|\*)/.test(l))
    .join("\n");
}

console.log("\nStatic guard check: local pipeline input builder\n");

// ── Builder: forbidden patterns ───────────────────────────────────────────────
console.log("[ build-local-pipeline-inputs-from-render-manifest.mjs — forbidden patterns ]");

check(
  "no fetch(",
  !codeLines(builderSrc).includes("fetch("),
);
check(
  "no axios outside comments",
  !codeLines(builderSrc).includes("axios"),
);
check(
  "no youtube.videos or googleapis.com",
  !codeLines(builderSrc).toLowerCase().includes("youtube.videos") &&
    !codeLines(builderSrc).includes("googleapis.com"),
);
check(
  "no graph.instagram or graph.facebook",
  !codeLines(builderSrc).includes("graph.instagram") &&
    !codeLines(builderSrc).includes("graph.facebook"),
);
check(
  "no uploadVideo call",
  !codeLines(builderSrc).includes("uploadVideo"),
);
check(
  "no OAuth outside comments",
  !codeLines(builderSrc).includes("OAuth"),
);
check(
  "no accessToken outside comments",
  !codeLines(builderSrc).includes("accessToken"),
);
check(
  "no refreshToken outside comments",
  !codeLines(builderSrc).includes("refreshToken"),
);
check(
  "no process.env access",
  !codeLines(builderSrc).includes("process.env"),
);
check(
  "no child_process import",
  !codeLines(builderSrc).includes("child_process"),
);
check(
  "no shell: true",
  !codeLines(builderSrc).match(/shell\s*:\s*true/),
);
check(
  "no exec( outside comments",
  !codeLines(builderSrc).includes("exec("),
);
check(
  "no execSync outside comments",
  !codeLines(builderSrc).includes("execSync"),
);
check(
  "no .money-shorts-local direct access (guard only)",
  builderSrc.includes(".money-shorts-local") && builderSrc.includes("forbidden"),
);

// ── Builder: required schema versions ───────────────────────────────────────
console.log("\n[ build-local-pipeline-inputs-from-render-manifest.mjs — required schema versions ]");

check(
  "money_shorts_tts_script_v1 schema present",
  builderSrc.includes("money_shorts_tts_script_v1"),
);
check(
  "money_shorts_upload_metadata_v1 schema present",
  builderSrc.includes("money_shorts_upload_metadata_v1"),
);
check(
  "money_shorts_owner_upload_approval_v1 schema present",
  builderSrc.includes("money_shorts_owner_upload_approval_v1"),
);

// ── Builder: required safety fields ─────────────────────────────────────────
console.log("\n[ build-local-pipeline-inputs-from-render-manifest.mjs — required safety fields ]");

check(
  "local_mock mode present",
  builderSrc.includes('"local_mock"'),
);
check(
  "ownerApprovalRequired: true present",
  builderSrc.includes("ownerApprovalRequired: true"),
);
check(
  "notUploaded: true present",
  builderSrc.includes("notUploaded: true"),
);
check(
  "actualUploadAllowed: false present",
  builderSrc.includes("actualUploadAllowed: false"),
);
check(
  "actualUploadPerformed: false present",
  builderSrc.includes("actualUploadPerformed: false"),
);
check(
  "youtube_shorts platform present",
  builderSrc.includes('"youtube_shorts"'),
);
check(
  "instagram_reels platform present",
  builderSrc.includes('"instagram_reels"'),
);

// ── Builder: repo out-dir guard ───────────────────────────────────────────────
console.log("\n[ build-local-pipeline-inputs-from-render-manifest.mjs — repo guard ]");

check(
  "repo out-dir guard present",
  builderSrc.includes("outDirAbs.startsWith(REPO_ROOT"),
);

// ── Builder: output filenames ─────────────────────────────────────────────────
console.log("\n[ build-local-pipeline-inputs-from-render-manifest.mjs — output filenames ]");

check(
  "generated-tts-script.local-mock.json filename present",
  builderSrc.includes("generated-tts-script.local-mock.json"),
);
check(
  "generated-upload-metadata.local-mock.json filename present",
  builderSrc.includes("generated-upload-metadata.local-mock.json"),
);
check(
  "generated-owner-upload-approval.local-mock.json filename present",
  builderSrc.includes("generated-owner-upload-approval.local-mock.json"),
);

// ── Builder: uploadPayloadId pattern alignment ───────────────────────────────
console.log("\n[ build-local-pipeline-inputs-from-render-manifest.mjs — uploadPayloadId pattern ]");

check(
  "uploadPayloadId uses upload-payload-${manifestId}-local-mock pattern",
  builderSrc.includes("upload-payload-") && builderSrc.includes("-local-mock"),
);
check(
  "approvalStatus approved present",
  builderSrc.includes('"approved"'),
);
check(
  "approvedFor dry_run_upload_ready_packet_only present",
  builderSrc.includes("dry_run_upload_ready_packet_only"),
);

// ── Builder: data integrity ──────────────────────────────────────────────────
console.log("\n[ build-local-pipeline-inputs-from-render-manifest.mjs — data integrity ]");

check(
  "caption texts used as-is from manifest (no invented claims)",
  builderSrc.includes("captionText") && builderSrc.includes("caption?.captionText"),
);
check(
  "riskNotes present in TTS script output",
  builderSrc.includes("riskNotes"),
);
check(
  "투자 권고 아님 disclaimer present",
  builderSrc.includes("투자 권고 아님"),
);
check(
  "Owner review required notice present",
  builderSrc.includes("Owner") && builderSrc.includes("검수"),
);

console.log(`\n${passed + failed} checks — ${passed} PASS, ${failed} FAIL\n`);

if (failed > 0) {
  process.exit(1);
}
