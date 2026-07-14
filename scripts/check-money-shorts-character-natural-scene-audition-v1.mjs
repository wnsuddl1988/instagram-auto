#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runner = path.join(__dirname, "run-money-shorts-character-natural-scene-audition-playwright-v1.mjs");
const outDir = path.resolve(__dirname, "..", ".tmp", "character-natural-scene-audition", "prompt-audit-v2");
const auditPath = path.join(outDir, "prompt-audit.json");
const result = spawnSync(process.execPath, [runner, "--prompt-audit-only", "--out-dir", outDir], {
  cwd: path.resolve(__dirname, ".."),
  encoding: "utf8",
  windowsHide: true,
});

const checks = [];
function check(label, condition, detail = "") {
  checks.push({ label, pass: Boolean(condition), detail });
  console.log(`${condition ? "PASS" : "FAIL"}: ${label}${detail ? ` - ${detail}` : ""}`);
}

check("prompt audit command exits cleanly", result.status === 0, String(result.stderr || result.stdout).trim().slice(0, 300));
check("prompt audit artifact exists", fs.existsSync(auditPath));
const audit = fs.existsSync(auditPath) ? JSON.parse(fs.readFileSync(auditPath, "utf8")) : null;
check("audit performs no external action", audit?.externalActionPerformed === false);
check("all four selected characters are covered", audit?.rows?.length === 4 && audit?.expectedCount === 4);
check("every prompt passes the natural bright scene contract", audit?.passed === true && audit?.rows?.every((row) => row.requiredPassed && row.bannedMatches.length === 0));
check("every selected reference hash is verified", audit?.rows?.every((row) => /^[a-f0-9]{64}$/.test(row.referenceSha256)));
check("prompts reject artificial face and pose traits", audit?.rows?.every((row) => /glossy doll eyes/.test(row.prompt) && /wax skin/.test(row.prompt) && /No lunging/.test(row.prompt)));
check("prompts reject dark laboratory-like settings", audit?.rows?.every((row) => /No laboratory, vault, factory, machine room, black-metal architecture/.test(row.prompt)));
check("prompts require character and room to be one authored shot", audit?.rows?.every((row) => /single authored cinematic shot/.test(row.prompt) && /contact shadows/.test(row.prompt) && /no cutout character, pasted-on subject/.test(row.prompt)));
check("prompts preserve restrained animated rather than live-action styling", audit?.rows?.every((row) => /unmistakably stylized animated 3D rather than live action/.test(row.prompt) && /catalog portrait/.test(row.prompt)));
check("every scene declares a local motion plan", audit?.rows?.every((row) => typeof row.motionPlan === "string" && row.motionPlan.length > 80 && /Motion-ready staging for later video/.test(row.prompt)));
check("prompts provide three depth planes for later parallax", audit?.rows?.every((row) => /foreground, character plane and background depth/.test(row.prompt)));
check("generation remains an explicit gated action", /ALLOW_CHATGPT_IMAGE/.test(fs.readFileSync(runner, "utf8")));
check("saved result excludes the uploaded user reference", /!image\.closest\('\[data-message-author-role="user"\]'\)/.test(fs.readFileSync(runner, "utf8")));
check("reference-board clone is rejected by perceptual distance", /referencePerceptualDistance >= 10/.test(fs.readFileSync(runner, "utf8")));
check("one-character recovery runs are supported", /--character-id/.test(fs.readFileSync(runner, "utf8")));

const failed = checks.filter((item) => !item.pass);
console.log(`\n${checks.length - failed.length}/${checks.length} PASS`);
process.exit(failed.length === 0 ? 0 : 1);
