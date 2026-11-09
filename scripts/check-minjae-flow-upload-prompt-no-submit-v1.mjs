#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const builderPath = "scripts/build-minjae-flow-motion-approval-packet-v1.mjs";
const runnerPath = "scripts/run-minjae-flow-upload-prompt-no-submit-v1.mjs";
const packetPath = "C:/tmp/money-shorts-os/gemini-veo/minjae-horizon-flow-motion-pilot-v1/approval-packet.json";
const referenceSha256 = "f6eaa1a87cd0d513154f697853f5c8cd7bbd0e0116a0ee2dee8722210ecbf771";
const promptSha256 = "18b03539c9c9392f86cc4af16b54c3c1c5cf35edc1add16d74f73c0b4afbeb1f";
const builderSource = fs.readFileSync(builderPath, "utf8");
const runnerSource = fs.readFileSync(runnerPath, "utf8");
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

function runRunner(args) {
  return spawnSync(process.execPath, [runnerPath, ...args], { encoding: "utf8" });
}

function isInsideRoot(filePath, rootPath) {
  const relative = path.relative(path.resolve(rootPath), path.resolve(filePath));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

const builderRun = spawnSync(process.execPath, [builderPath], { encoding: "utf8" });
const builderPacket = builderRun.status === 0 ? JSON.parse(builderRun.stdout) : null;
const contractRun = runRunner(["--contract-check", "--packet-path", packetPath]);
const contractOutput = contractRun.status === 0 ? JSON.parse(contractRun.stdout) : null;
const missingApproval = runRunner(["--preflight-no-submit", "--packet-path", packetPath]);
const wrongReference = runRunner([
  "--preflight-no-submit",
  "--packet-path", packetPath,
  "--owner-approved-upload-no-submit",
  "--allow-one-reference-upload",
  "--approved-reference-sha256", "0".repeat(64),
  "--approved-prompt-sha256", promptSha256,
]);
const wrongPrompt = runRunner([
  "--preflight-no-submit",
  "--packet-path", packetPath,
  "--owner-approved-upload-no-submit",
  "--allow-one-reference-upload",
  "--approved-reference-sha256", referenceSha256,
  "--approved-prompt-sha256", "0".repeat(64),
]);
const forbiddenGenerate = runRunner(["--contract-check", "--packet-path", packetPath, "--generate"]);
const clickTargets = [...runnerSource.matchAll(/await\s+([A-Za-z][A-Za-z0-9_]*)\.click\(/g)].map((match) => match[1]);

check("builder prints a new Flow-only packet without writing", builderRun.status === 0 && builderPacket?.written === false);
check("packet uses a fresh non-retry approval identity", builderPacket?.schemaVersion === "minjae_flow_motion_approval_packet_v1" && builderPacket?.attemptId === "minjae_horizon_flow_motion_v1" && builderPacket?.priorApprovalReuseAllowed === false);
check("packet requires upload-only Owner approval", builderPacket?.status === "OWNER_APPROVAL_REQUIRED_UPLOAD_NO_SUBMIT" && /APPROVE_FLOW_UPLOAD_PROMPT_NO_SUBMIT/.test(builderPacket?.liveBoundary?.requiredOwnerApprovalWording ?? ""));
check("packet pins the approved reference and prompt hashes", builderPacket?.character?.referenceSha256 === referenceSha256 && builderPacket?.scene?.promptSha256 === promptSha256);
check("packet pins the existing Gemini 2 Flow project", builderPacket?.providerUi?.provider === "Google Flow" && builderPacket?.providerUi?.profileId === 2 && builderPacket?.providerUi?.projectId === "2b12c31a-4493-405b-aedf-2268abb10422");
check("packet pins Fast 9:16 single output and confirmation", builderPacket?.providerUi?.videoModel === "Veo 3.1 - Fast" && builderPacket?.providerUi?.aspectRatio === "9:16" && builderPacket?.providerUi?.outputCount === 1 && builderPacket?.providerUi?.confirmBeforeGeneration === "always");
check("Flow packet does not select a Gemini reasoning model", builderPacket?.providerUi?.reasoningModelSelectionRequired === false && !/3\.1 Pro|3\.5 Flash|Gemini Video powered by Veo/.test(JSON.stringify(builderPacket)));
check("packet keeps every live mutation false", Object.entries(builderPacket?.liveBoundary ?? {}).filter(([key]) => key.endsWith("Now")).every(([, value]) => value === false));
check("paid generation remains a separate approval", builderPacket?.liveBoundary?.generationRequiresSeparateOwnerApproval === true);
check("all packet artifacts are isolated under the new C tmp root", path.resolve(builderPacket?.outputPlan?.root ?? "") === path.resolve("C:/tmp/money-shorts-os/gemini-veo/minjae-horizon-flow-motion-pilot-v1") && Object.values(builderPacket?.outputPlan ?? {}).every((value) => isInsideRoot(String(value), builderPacket.outputPlan.root)));
check("runner pins both writable evidence paths", /EXPECTED_INTENT_PATH/.test(runnerSource) && /upload_intent_path_mismatch/.test(runnerSource) && /EXPECTED_SUMMARY_PATH/.test(runnerSource) && /preflight_summary_path_mismatch/.test(runnerSource));

check("contract mode passes without browser or network access", contractRun.status === 0 && contractOutput?.passed === true && contractOutput?.browserImported === false && contractOutput?.browserAccessed === false && contractOutput?.networkAccessed === false);
check("contract mode exposes no generation-submit capability", contractOutput?.generationSubmitAvailable === false && contractOutput?.creditsSpent === false);
check("Playwright import is dynamically below the contract exit", !/import\s+\{?\s*chromium[^\n]*from\s+["']playwright["']/.test(runnerSource) && runnerSource.indexOf("process.exit(0)") < runnerSource.indexOf('await import("playwright")'));
check("live preflight requires explicit Owner approval", missingApproval.status === 2 && /--owner-approved-upload-no-submit_required/.test(missingApproval.stderr));
check("wrong approved reference hash fails before browser access", wrongReference.status === 2 && /approved_reference_sha256_mismatch/.test(wrongReference.stderr));
check("wrong approved prompt hash fails before browser access", wrongPrompt.status === 2 && /approved_prompt_sha256_mismatch/.test(wrongPrompt.stderr));
check("generation arguments are rejected in every mode", forbiddenGenerate.status === 2 && /--generate_is_forbidden/.test(forbiddenGenerate.stderr));
check("runner never launches or closes the shared browser", !/chromium\.launch|launchPersistentContext|browser\.close\(|page\.close\(/.test(runnerSource) && /gemini_2_cdp_not_open_browser_launch_forbidden/.test(runnerSource));
check("runner has no Enter or account fallback path", !/keyboard\.press|\.press\(|Gemini 3|Gemini 4|fallback-profile/.test(runnerSource.replace('"--fallback-profile",', "")));
check("only upload and existing-media attachment controls are clicked", JSON.stringify(clickTargets) === JSON.stringify(["assetPickerButton", "mediaUploadButton", "assetPickerButtonAfterUpload", "addToPromptButton"]));
check("runner contains no generation, save, settings, or new-project click", !/generationButton\.click|saveButton\.click|settingsButton\.click|newProjectButton\.click/.test(runnerSource));
check("single-use intent ledger is exclusive", /fs\.openSync\(intentPath, ["']wx["']\)/.test(runnerSource) && /upload_intent_already_exists_duplicate_upload_blocked/.test(runnerSource));
check("intent is persisted before file selection", runnerSource.indexOf("intentPath = writeIntentLedgerExclusive(packet)") < runnerSource.indexOf("await fileChooser.setFiles"));
check("uploaded media is matched by exact filename before prompt attachment", /filter\(\{ hasText: referenceFileName \}\)/.test(runnerSource) && /uploaded_reference_missing_from_media_picker/.test(runnerSource) && /add_uploaded_reference_to_prompt_button_missing/.test(runnerSource));
check("existing media is attached only after the one approved file selection", runnerSource.indexOf("await fileChooser.setFiles") < runnerSource.indexOf("await addToPromptButton.click") && !/\.dragTo\(/.test(runnerSource));
check("reference attachment accepts zero-or-one upload request but requires one composer image", /uploadSelectionCount \+= 1/.test(runnerSource) && /uploadRequestCount === 0/.test(runnerSource) && /uploadRequestCount <= 1/.test(runnerSource) && /composerAttachmentImageCount === 1/.test(runnerSource));
check("runner requires a fresh passed readonly preflight", /READONLY_MAX_AGE_MS = 30 \* 60 \* 1000/.test(runnerSource) && /readonly_preflight_stale/.test(runnerSource) && /readyForOwnerUploadDecision/.test(runnerSource));
check("network guard blocks all unapproved Flow mutations", /page\.route\(["']\*\*\/\*["']/.test(runnerSource) && /route\.abort\(["']blockedbyclient["']\)/.test(runnerSource) && /blockedNetworkMutations/.test(runnerSource));
check("network evidence strips query parameters", /urlWithoutQuery/.test(runnerSource) && /parsed\.origin.*parsed\.pathname/.test(runnerSource) && !/allowedUploadRequests\.push\(\{ method, url \}\)/.test(runnerSource));
check("prompt is filled and verified by exact DOM hash", /await promptBox\.fill\(packet\.scene\.prompt\)/.test(runnerSource) && /promptDomSha256 !== packet\.scene\.promptSha256/.test(runnerSource));
check("success evidence explicitly records zero submission and credit spend", /generationSubmitted: false/.test(runnerSource) && /creditsSpent: false/.test(runnerSource) && /submissionCount: 0/.test(runnerSource));
check("preflight page stays open for Owner inspection", !/page\.close\(/.test(runnerSource) && /pageKeptOpen: true/.test(runnerSource));
check("runner cannot declare paid-generation readiness", !/readyForPaidGeneration:\s*true/.test(runnerSource) && /readyForPaidGeneration: false/.test(runnerSource));
check("sources do not mutate env, dependencies, or lockfiles", !/\.env|package\.json|pnpm-lock\.yaml|npm install|pnpm add/.test(`${builderSource}\n${runnerSource}`));

console.log(JSON.stringify({
  passed: failed === 0,
  passedCount: passed,
  totalCount: passed + failed,
  failedCount: failed,
}, null, 2));
process.exit(failed === 0 ? 0 : 1);
