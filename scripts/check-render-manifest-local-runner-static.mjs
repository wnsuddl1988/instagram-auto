/**
 * Static guard: render manifest local runner integrity.
 * No network, no API calls, no clipboard, no fs writes to repo.
 * Exit 0 = all PASS. Exit 1 = at least one FAIL.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const RUNNER_PATH = resolve(__dirname, "run-local-money-shorts-from-render-manifest.mjs");
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

function codeLines(src) {
  return src
    .split("\n")
    .filter((l) => !/^\s*(\/\/|\*)/.test(l))
    .join("\n");
}

console.log("\nStatic guard check: render manifest local runner\n");

// ── Forbidden patterns ──────────────────────────────────────────────────────
console.log("[ run-local-money-shorts-from-render-manifest.mjs — forbidden patterns ]");

check("no fetch(", !codeLines(runnerSrc).includes("fetch("));
check("no axios outside comments", !codeLines(runnerSrc).includes("axios"));
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
check("no uploadVideo call", !codeLines(runnerSrc).includes("uploadVideo"));
check("no OAuth outside comments", !codeLines(runnerSrc).includes("OAuth"));
check("no accessToken outside comments", !codeLines(runnerSrc).includes("accessToken"));
check("no refreshToken outside comments", !codeLines(runnerSrc).includes("refreshToken"));
check("no process.env access", !codeLines(runnerSrc).includes("process.env"));
check(
  "no .money-shorts-local direct access (guard only)",
  runnerSrc.includes(".money-shorts-local") && runnerSrc.includes("forbidden"),
);
check("no shell: true", !codeLines(runnerSrc).match(/shell\s*:\s*true/));
check("no exec( outside comments", !codeLines(runnerSrc).includes("exec("));
check("no execSync outside comments", !codeLines(runnerSrc).includes("execSync"));

// ── Required patterns ───────────────────────────────────────────────────────
console.log("\n[ run-local-money-shorts-from-render-manifest.mjs — required patterns ]");

check("spawnSync(process.execPath used", runnerSrc.includes("spawnSync(process.execPath"));
check("shell: false present", runnerSrc.includes("shell: false"));
check("out-root repo guard present", runnerSrc.includes("outRootAbs.startsWith(REPO_ROOT"));
check(
  "input builder script called",
  runnerSrc.includes("build-local-pipeline-inputs-from-render-manifest.mjs"),
);
check(
  "pipeline runner script called",
  runnerSrc.includes("run-local-money-shorts-pipeline-dry-run.mjs"),
);
check(
  "generated-tts-script.local-mock.json referenced",
  runnerSrc.includes("generated-tts-script.local-mock.json"),
);
check(
  "generated-upload-metadata.local-mock.json referenced",
  runnerSrc.includes("generated-upload-metadata.local-mock.json"),
);
check(
  "generated-owner-upload-approval.local-mock.json referenced",
  runnerSrc.includes("generated-owner-upload-approval.local-mock.json"),
);
check(
  "render-manifest-local-run-summary.local-mock.json present",
  runnerSrc.includes("render-manifest-local-run-summary.local-mock.json"),
);
check("actualUploadAllowed: false in summary", runnerSrc.includes("actualUploadAllowed: false"));
check("actualUploadPerformed: false in summary", runnerSrc.includes("actualUploadPerformed: false"));
check("notUploaded: true in summary", runnerSrc.includes("notUploaded: true"));

// ── Summary schema ──────────────────────────────────────────────────────────
console.log("\n[ run-local-money-shorts-from-render-manifest.mjs — summary schema ]");

check(
  "schemaVersion money_shorts_render_manifest_local_run_summary_v1",
  runnerSrc.includes("money_shorts_render_manifest_local_run_summary_v1"),
);
check("flowStatus completed_dry_run present", runnerSrc.includes('"completed_dry_run"'));
check("flowStatus failed present", runnerSrc.includes('"failed"'));
check("steps array in summary", runnerSrc.includes("steps,"));
check("artifacts field in summary", runnerSrc.includes("artifacts,"));
check("riskNotes in summary", runnerSrc.includes("riskNotes"));
check("ownerApprovalRequired: true in summary", runnerSrc.includes("ownerApprovalRequired: true"));

// ── Step tracking ──────────────────────────────────────────────────────────
console.log("\n[ run-local-money-shorts-from-render-manifest.mjs — step tracking ]");

check("stepResults.push present", runnerSrc.includes("stepResults.push"));
check("exitCode !== 0 check present", runnerSrc.includes("exitCode !== 0"));
check("process.exit(1) on step failure", runnerSrc.includes("process.exit(1)"));
check("writeSummary on failure", runnerSrc.includes('writeSummary("failed"'));

console.log(`\n${passed + failed} checks — ${passed} PASS, ${failed} FAIL\n`);

if (failed > 0) {
  process.exit(1);
}
