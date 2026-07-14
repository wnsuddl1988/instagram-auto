#!/usr/bin/env node

import fs from "node:fs";
import {
  GEMINI_VEO_PROFILE_CHAIN,
  GEMINI_VEO_PROFILE_CHAIN_VERSION,
  GEMINI_VEO_PROFILE_POLICY,
  assertGeminiVeoSubmissionBudget,
} from "./_gemini-veo-profile-chain.mjs";

const forbiddenArgs = ["--execute", "--submit", "--attach-reference", "--type-prompt"];
const usedForbiddenArg = forbiddenArgs.find((arg) => process.argv.includes(arg));
if (usedForbiddenArg) {
  console.error(`ABORT: ${usedForbiddenArg} is forbidden in the no-submit profile preflight.`);
  process.exit(2);
}

const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const profiles = GEMINI_VEO_PROFILE_CHAIN.map((profile) => ({
  profileId: profile.profileId,
  desktopShortcutName: profile.desktopShortcutName,
  cdpPort: profile.cdpPort,
  userDataDirExists: fs.existsSync(profile.userDataDir),
}));
const submissionBudget = assertGeminiVeoSubmissionBudget([]);
const passed = fs.existsSync(chromePath) && profiles.every((profile) => profile.userDataDirExists);

console.log(JSON.stringify({
  version: GEMINI_VEO_PROFILE_CHAIN_VERSION,
  passed,
  mode: "local_contract_only_no_browser_launch",
  priority: profiles.map((profile) => profile.desktopShortcutName),
  chromeExecutableExists: fs.existsSync(chromePath),
  profiles,
  advanceOnlyOn: GEMINI_VEO_PROFILE_POLICY.advanceOnlyOn,
  submissionCount: submissionBudget.submissionCount,
  promptTyped: false,
  referenceAttached: false,
  browserLaunched: false,
  networkAccessed: false,
  accountChanged: false,
}, null, 2));

process.exit(passed ? 0 : 1);
