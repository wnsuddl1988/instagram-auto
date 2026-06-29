/**
 * Static guard: owner-approved upload flow builder + approval fixture integrity.
 * No network, no API calls, no clipboard, no fs writes to repo.
 * Exit 0 = all PASS. Exit 1 = at least one FAIL.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const BUILDER_PATH = resolve(__dirname, "build-owner-approved-upload-flow-dry-run.mjs");
const APPROVAL_FIXTURE_PATH = resolve(
  __dirname,
  "fixtures/provider-candidate-owner-upload-approval.local-mock.json",
);

const builderSrc = readFileSync(BUILDER_PATH, "utf-8");
const approvalFixtureSrc = readFileSync(APPROVAL_FIXTURE_PATH, "utf-8");
const approval = JSON.parse(approvalFixtureSrc);

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

console.log("\nStatic guard check: owner-approved upload flow builder + approval fixture\n");

// ── Builder: forbidden patterns ──────────────────────────────────────────────
console.log("[ build-owner-approved-upload-flow-dry-run.mjs — forbidden patterns ]");

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
  "no .money-shorts-local access (guard only)",
  builderSrc.includes(".money-shorts-local") && builderSrc.includes("forbidden"),
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

// ── Builder: required patterns ────────────────────────────────────────────────
console.log("\n[ build-owner-approved-upload-flow-dry-run.mjs — required patterns ]");

check(
  "ffprobe present",
  builderSrc.includes("ffprobe"),
);
check(
  "spawnSync used",
  builderSrc.includes("spawnSync("),
);
check(
  "repo out-dir guard present",
  builderSrc.includes("outDirAbs.startsWith(REPO_ROOT"),
);
check(
  "approvalStatus check present",
  builderSrc.includes("approvalStatus"),
);
check(
  "approved string present",
  builderSrc.includes('"approved"'),
);
check(
  "actualUploadPerformed: false in output",
  builderSrc.includes("actualUploadPerformed: false"),
);
check(
  "actualUploadAllowed: false in output",
  builderSrc.includes("actualUploadAllowed: false"),
);
check(
  "notUploaded: true in output",
  builderSrc.includes("notUploaded: true"),
);
check(
  "ownerApprovalRequired present",
  builderSrc.includes("ownerApprovalRequired"),
);
check(
  "youtube_shorts platform present",
  builderSrc.includes('"youtube_shorts"'),
);
check(
  "instagram_reels platform present",
  builderSrc.includes('"instagram_reels"'),
);
check(
  "schemaVersion money_shorts_owner_approved_upload_flow_v1",
  builderSrc.includes("money_shorts_owner_approved_upload_flow_v1"),
);
check(
  "duration ± 0.5s validation",
  builderSrc.includes("durationLo") && builderSrc.includes("durationHi"),
);
check(
  "ffprobe failure causes exit 1",
  builderSrc.includes("process.exit(1)"),
);

// ── Builder: output packet fields ────────────────────────────────────────────
console.log("\n[ build-owner-approved-upload-flow-dry-run.mjs — output packet fields ]");

check(
  "flowStatus field present",
  builderSrc.includes("flowStatus"),
);
check(
  "nextStep field present",
  builderSrc.includes("nextStep"),
);
check(
  "artifact.durationSec present",
  builderSrc.includes("durationSec:"),
);
check(
  "artifact.widthPx present",
  builderSrc.includes("widthPx:"),
);
check(
  "artifact.heightPx present",
  builderSrc.includes("heightPx:"),
);
check(
  "artifact.videoCodec present",
  builderSrc.includes("videoCodec:"),
);
check(
  "artifact.audioCodec present",
  builderSrc.includes("audioCodec:"),
);
check(
  "artifact.audioStreamCount present",
  builderSrc.includes("audioStreamCount:"),
);
check(
  "artifact.ffprobeVerified: true present",
  builderSrc.includes("ffprobeVerified: true"),
);
check(
  "riskNotes in packet",
  builderSrc.includes("riskNotes"),
);
check(
  "platformPayloads in packet",
  builderSrc.includes("platformPayloads"),
);
check(
  "approval block in packet",
  builderSrc.includes("approvedPlatforms"),
);

// ── Approval fixture: schema ──────────────────────────────────────────────────
console.log("\n[ provider-candidate-owner-upload-approval.local-mock.json — schema ]");

check(
  "schemaVersion is money_shorts_owner_upload_approval_v1",
  approval.schemaVersion === "money_shorts_owner_upload_approval_v1",
);
check(
  "mode is local_mock",
  approval.mode === "local_mock",
);
check(
  "approvalStatus is approved",
  approval.approvalStatus === "approved",
);
check(
  "approvedFor is dry_run_upload_ready_packet_only",
  approval.approvedFor === "dry_run_upload_ready_packet_only",
);
check(
  "actualUploadAllowed is false",
  approval.actualUploadAllowed === false,
);
check(
  "actualUploadPerformed is false",
  approval.actualUploadPerformed === false,
);
check(
  "ownerApprovalRequired is true",
  approval.ownerApprovalRequired === true,
);
check(
  "approvedPlatforms includes youtube_shorts",
  Array.isArray(approval.approvedPlatforms) &&
    approval.approvedPlatforms.includes("youtube_shorts"),
);
check(
  "approvedPlatforms includes instagram_reels",
  Array.isArray(approval.approvedPlatforms) &&
    approval.approvedPlatforms.includes("instagram_reels"),
);
check(
  "uploadPayloadId present",
  typeof approval.uploadPayloadId === "string" && approval.uploadPayloadId.length > 0,
);
check(
  "sourceManifestId matches expected",
  approval.sourceManifestId === "rp-provider-candidate-ecos-base-rate",
);
check(
  "no accessToken or refreshToken in fixture",
  !approval.accessToken && !approval.refreshToken,
);
check(
  "no OAuth credential fields in fixture",
  !approval.client_secret && !approval.client_id,
);
check(
  "riskNotes present and non-empty",
  Array.isArray(approval.riskNotes) && approval.riskNotes.length > 0,
);
check(
  "riskNotes contains actualUploadAllowed note",
  approval.riskNotes.some((n) => n.includes("actualUploadAllowed")),
);
check(
  "riskNotes contains actualUploadPerformed note",
  approval.riskNotes.some((n) => n.includes("actualUploadPerformed")),
);

console.log(`\n${passed + failed} checks — ${passed} PASS, ${failed} FAIL\n`);

if (failed > 0) {
  process.exit(1);
}
