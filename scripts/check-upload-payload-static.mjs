/**
 * Static guard: upload payload builder + metadata fixture integrity.
 * No network, no API calls, no clipboard, no fs writes to repo.
 * Exit 0 = all PASS. Exit 1 = at least one FAIL.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const BUILDER_PATH = resolve(__dirname, "build-upload-payload-from-tts-mux-summary.mjs");
const METADATA_PATH = resolve(
  __dirname,
  "fixtures/provider-candidate-upload-metadata.local-mock.json",
);

const builderSrc = readFileSync(BUILDER_PATH, "utf-8");
const metadataFixtureSrc = readFileSync(METADATA_PATH, "utf-8");
const metadata = JSON.parse(metadataFixtureSrc);

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

// Helper: filter comments for forbidden pattern checks
function codeLines(src) {
  return src
    .split("\n")
    .filter((l) => !/^\s*(\/\/|\*)/.test(l))
    .join("\n");
}

console.log("\nStatic guard check: upload payload builder + metadata fixture\n");

// ── Builder: forbidden patterns ──────────────────────────────────────────────
console.log("[ build-upload-payload-from-tts-mux-summary.mjs — forbidden patterns ]");

check(
  "no fetch(",
  !codeLines(builderSrc).includes("fetch("),
);
check(
  "no axios outside comments",
  !codeLines(builderSrc).includes("axios"),
);
check(
  "no youtube API call",
  !codeLines(builderSrc).toLowerCase().includes("youtube.videos") &&
    !codeLines(builderSrc).includes("googleapis.com"),
);
check(
  "no instagram API call",
  !codeLines(builderSrc).includes("graph.instagram") &&
    !codeLines(builderSrc).includes("graph.facebook"),
);
check(
  "no uploadVideo call",
  !codeLines(builderSrc).includes("uploadVideo"),
);
check(
  "no OAuth / accessToken / refreshToken",
  !codeLines(builderSrc).includes("accessToken") &&
    !codeLines(builderSrc).includes("refreshToken") &&
    !codeLines(builderSrc).includes("OAuth"),
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
console.log("\n[ build-upload-payload-from-tts-mux-summary.mjs — required patterns ]");

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
  "ownerApprovalRequired: true in payload",
  builderSrc.includes("ownerApprovalRequired: true"),
);
check(
  "notUploaded: true in payload",
  builderSrc.includes("notUploaded: true"),
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
  "schemaVersion: money_shorts_upload_payload_v1",
  builderSrc.includes("money_shorts_upload_payload_v1"),
);
check(
  "ffprobe failure causes exit 1",
  builderSrc.includes("ABORT: ffprobe failed") && builderSrc.includes("process.exit(1)"),
);
check(
  "duration ± 0.5s validation",
  builderSrc.includes("durationLo") && builderSrc.includes("durationHi"),
);

// ── Builder: artifact fields ──────────────────────────────────────────────────
console.log("\n[ build-upload-payload-from-tts-mux-summary.mjs — artifact fields ]");

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
  "artifact.fileSizeBytes present",
  builderSrc.includes("fileSizeBytes:"),
);
check(
  "riskNotes in payload",
  builderSrc.includes("riskNotes"),
);

// ── Metadata fixture: schema ──────────────────────────────────────────────────
console.log("\n[ provider-candidate-upload-metadata.local-mock.json — schema ]");

check(
  "schemaVersion is money_shorts_upload_metadata_v1",
  metadata.schemaVersion === "money_shorts_upload_metadata_v1",
);
check(
  "mode is local_mock",
  metadata.mode === "local_mock",
);
check(
  "ownerApprovalRequired is true",
  metadata.ownerApprovalRequired === true,
);
check(
  "notUploaded is true",
  metadata.notUploaded === true,
);
check(
  "platforms includes youtube_shorts",
  Array.isArray(metadata.platforms) && metadata.platforms.includes("youtube_shorts"),
);
check(
  "platforms includes instagram_reels",
  Array.isArray(metadata.platforms) && metadata.platforms.includes("instagram_reels"),
);
check(
  "sourceManifestId matches provider-candidate",
  metadata.sourceManifestId === "rp-provider-candidate-ecos-base-rate",
);
check(
  "no accessToken or refreshToken value in fixture (riskNotes mentions allowed)",
  !metadata.accessToken && !metadata.refreshToken &&
    !(metadata.youtube_shorts?.accessToken) && !(metadata.instagram_reels?.accessToken),
);
check(
  "no OAuth credential fields in fixture",
  !metadata.client_secret && !metadata.client_id &&
    !(metadata.youtube_shorts?.client_secret) && !(metadata.instagram_reels?.client_secret),
);
check(
  "riskNotes present and non-empty",
  Array.isArray(metadata.riskNotes) && metadata.riskNotes.length > 0,
);
check(
  "riskNotes contains ownerApprovalRequired note",
  metadata.riskNotes.some((n) => n.includes("ownerApprovalRequired")),
);
check(
  "riskNotes contains notUploaded note",
  metadata.riskNotes.some((n) => n.toLowerCase().includes("no upload") || n.includes("notUploaded")),
);

// ── Metadata fixture: platform content ───────────────────────────────────────
console.log("\n[ provider-candidate-upload-metadata.local-mock.json — platform content ]");

check(
  "youtube_shorts.title is non-empty string",
  typeof metadata.youtube_shorts?.title === "string" &&
    metadata.youtube_shorts.title.length > 0,
);
check(
  "youtube_shorts.description is non-empty string",
  typeof metadata.youtube_shorts?.description === "string" &&
    metadata.youtube_shorts.description.length > 0,
);
check(
  "youtube_shorts.hashtags is non-empty array",
  Array.isArray(metadata.youtube_shorts?.hashtags) &&
    metadata.youtube_shorts.hashtags.length > 0,
);
check(
  "instagram_reels.caption is non-empty string",
  typeof metadata.instagram_reels?.caption === "string" &&
    metadata.instagram_reels.caption.length > 0,
);
check(
  "instagram_reels.hashtags is non-empty array",
  Array.isArray(metadata.instagram_reels?.hashtags) &&
    metadata.instagram_reels.hashtags.length > 0,
);

console.log(`\n${passed + failed} checks — ${passed} PASS, ${failed} FAIL\n`);

if (failed > 0) {
  process.exit(1);
}
