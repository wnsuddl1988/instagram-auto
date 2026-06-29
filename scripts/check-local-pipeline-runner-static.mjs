/**
 * Static guard: local pipeline runner integrity.
 * No network, no API calls, no clipboard, no fs writes to repo.
 * Exit 0 = all PASS. Exit 1 = at least one FAIL.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const RUNNER_PATH = resolve(__dirname, "run-local-money-shorts-pipeline-dry-run.mjs");
const runnerSrc = readFileSync(RUNNER_PATH, "utf-8");

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

console.log("\nStatic guard check: local pipeline runner\n");

// ── Runner: forbidden patterns ───────────────────────────────────────────────
console.log("[ run-local-money-shorts-pipeline-dry-run.mjs — forbidden patterns ]");

check(
  "no fetch(",
  !codeLines(runnerSrc).includes("fetch("),
);
check(
  "no axios outside comments",
  !codeLines(runnerSrc).includes("axios"),
);
check(
  "no youtube.videos or googleapis.com",
  !codeLines(runnerSrc).toLowerCase().includes("youtube.videos") &&
    !codeLines(runnerSrc).includes("googleapis.com"),
);
check(
  "no graph.instagram or graph.facebook",
  !codeLines(runnerSrc).includes("graph.instagram") &&
    !codeLines(runnerSrc).includes("graph.facebook"),
);
check(
  "no uploadVideo call",
  !codeLines(runnerSrc).includes("uploadVideo"),
);
check(
  "no OAuth outside comments",
  !codeLines(runnerSrc).includes("OAuth"),
);
check(
  "no accessToken outside comments",
  !codeLines(runnerSrc).includes("accessToken"),
);
check(
  "no refreshToken outside comments",
  !codeLines(runnerSrc).includes("refreshToken"),
);
check(
  "no process.env access",
  !codeLines(runnerSrc).includes("process.env"),
);
check(
  "no .money-shorts-local direct access (guard only)",
  runnerSrc.includes(".money-shorts-local") && runnerSrc.includes("forbidden"),
);
check(
  "no shell: true",
  !codeLines(runnerSrc).match(/shell\s*:\s*true/),
);
check(
  "no exec( outside comments",
  !codeLines(runnerSrc).includes("exec("),
);
check(
  "no execSync outside comments",
  !codeLines(runnerSrc).includes("execSync"),
);

// ── Runner: required patterns ─────────────────────────────────────────────────
console.log("\n[ run-local-money-shorts-pipeline-dry-run.mjs — required patterns ]");

check(
  "spawnSync(process.execPath used",
  runnerSrc.includes("spawnSync(process.execPath"),
);
check(
  "shell: false present",
  runnerSrc.includes("shell: false"),
);
check(
  "out-root repo guard present",
  runnerSrc.includes("outRootAbs.startsWith(REPO_ROOT"),
);
check(
  "visual-only renderer script called",
  runnerSrc.includes("render-visual-only-from-render-manifest.mjs"),
);
check(
  "TTS mux script called",
  runnerSrc.includes("mux-local-tts-audio-into-visual-mp4.mjs"),
);
check(
  "upload payload script called",
  runnerSrc.includes("build-upload-payload-from-tts-mux-summary.mjs"),
);
check(
  "owner-approved upload flow script called",
  runnerSrc.includes("build-owner-approved-upload-flow-dry-run.mjs"),
);
check(
  "visual-only step output dir",
  runnerSrc.includes("visual-only"),
);
check(
  "tts-audio-mux step output dir",
  runnerSrc.includes("tts-audio-mux"),
);
check(
  "upload-payload step output dir",
  runnerSrc.includes("upload-payload"),
);
check(
  "owner-approved-upload-flow step output dir",
  runnerSrc.includes("owner-approved-upload-flow"),
);
check(
  "pipeline-run-summary.local-mock.json in runner",
  runnerSrc.includes("pipeline-run-summary.local-mock.json"),
);
check(
  "actualUploadPerformed: false in summary",
  runnerSrc.includes("actualUploadPerformed: false"),
);
check(
  "notUploaded: true in summary",
  runnerSrc.includes("notUploaded: true"),
);
check(
  "owner-approved-upload-ready-packet.local-mock.json referenced",
  runnerSrc.includes("owner-approved-upload-ready-packet.local-mock.json"),
);

// ── Runner: summary schema fields ────────────────────────────────────────────
console.log("\n[ run-local-money-shorts-pipeline-dry-run.mjs — summary schema fields ]");

check(
  "schemaVersion: money_shorts_local_pipeline_run_summary_v1",
  runnerSrc.includes("money_shorts_local_pipeline_run_summary_v1"),
);
check(
  "flowStatus present",
  runnerSrc.includes("flowStatus"),
);
check(
  "steps array in summary",
  runnerSrc.includes("steps,"),
);
check(
  "artifacts field in summary",
  runnerSrc.includes("artifacts,"),
);
check(
  "actualUploadAllowed: false in summary",
  runnerSrc.includes("actualUploadAllowed: false"),
);
check(
  "ownerApprovalRequired: true in summary",
  runnerSrc.includes("ownerApprovalRequired: true"),
);
check(
  "riskNotes in summary",
  runnerSrc.includes("riskNotes"),
);
check(
  "completed_dry_run flowStatus value",
  runnerSrc.includes('"completed_dry_run"'),
);
check(
  "failed flowStatus value for abort path",
  runnerSrc.includes('"failed"'),
);

// ── Runner: step failure handling ────────────────────────────────────────────
console.log("\n[ run-local-money-shorts-pipeline-dry-run.mjs — failure handling ]");

check(
  "exit code check: exitCode !== 0",
  runnerSrc.includes("exitCode !== 0"),
);
check(
  "process.exit(1) on step failure",
  runnerSrc.includes("process.exit(1)"),
);
check(
  "writeSummary called on failure",
  runnerSrc.includes("writeSummary(\"failed\""),
);
check(
  "step results tracked per step",
  runnerSrc.includes("stepResults.push"),
);

console.log(`\n${passed + failed} checks — ${passed} PASS, ${failed} FAIL\n`);

if (failed > 0) {
  process.exit(1);
}
