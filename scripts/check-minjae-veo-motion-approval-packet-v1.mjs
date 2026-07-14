#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";

const builderPath = "scripts/build-minjae-veo-motion-approval-packet-v1.mjs";
const source = fs.readFileSync(builderPath, "utf8");
const result = spawnSync(process.execPath, [builderPath], { encoding: "utf8" });
const packet = result.status === 0 ? JSON.parse(result.stdout) : null;
let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS ${label}`);
  } else {
    failed += 1;
    console.error(`FAIL ${label}`);
  }
}

check("packet builds without a browser or live provider", result.status === 0 && packet?.liveBoundary?.approvalGrantedNow === false);
check("packet fixes Minjae candidate 2 by verified hash", packet?.character?.id === "minjae_horizon" && packet?.character?.selectedCandidateNumber === 2 && /^[a-f0-9]{64}$/.test(packet?.character?.referenceSha256 ?? ""));
check("packet uses Gemini 2 then 3 then 4 and quota-only fallback", JSON.stringify(packet?.profilePolicy?.priority) === JSON.stringify(["Gemini 2", "Gemini 3", "Gemini 4"]) && packet?.profilePolicy?.advanceOnlyOn === "quota_exhausted" && packet?.profilePolicy?.maxSubmissionCountAcrossChain === 1);
check("packet requires articulated motion rather than parallax only", packet?.scene?.requiredMotionEvidence?.length === 4 && /parallax alone is insufficient/i.test(packet?.scene?.acceptanceCriteria?.join(" ") ?? ""));
check("prompt enforces bright natural Korean family-feature direction", /bright balcony/i.test(packet?.scene?.prompt ?? "") && /believable Korean adult facial proportions/i.test(packet?.scene?.prompt ?? "") && /No readable text/i.test(packet?.scene?.prompt ?? ""));
check("prompt blocks forbidden dark or machinery finance imagery", /No readable text, numbers, UI/i.test(packet?.scene?.prompt ?? "") && /laboratory, vault, factory, machine room, black-metal architecture, dark finance imagery/i.test(packet?.scene?.prompt ?? ""));
check("packet keeps prompt attachment and submit blocked now", packet?.liveBoundary?.promptTypedNow === false && packet?.liveBoundary?.referenceAttachedNow === false && packet?.liveBoundary?.submittedNow === false && packet?.liveBoundary?.accountChangedNow === false);
check("packet output is outside the repository", /^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]/i.test(packet?.outputPlan?.root ?? ""));
check("builder has no Playwright, browser launch, fetch or submission implementation", !/playwright|connectOverCDP|ensureChrome|\bspawn\(|\bfetch\(|\.click\(|\.type\(|\.fill\(|setInputFiles|sendPrompt/.test(source));
check("builder writes only with the explicit packet flag", /process\.argv\.includes\("--write-packet"\)/.test(source));

console.log(JSON.stringify({ passed: failed === 0, passedCount: passed, totalCount: passed + failed, failedCount: failed }, null, 2));
process.exit(failed === 0 ? 0 : 1);
