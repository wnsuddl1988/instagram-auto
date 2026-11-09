#!/usr/bin/env node

import fs from "node:fs";
import {
  GEMINI_VEO_PROFILE_CHAIN,
  GEMINI_VEO_PROFILE_CHAIN_VERSION,
  GEMINI_VEO_PROFILE_POLICY,
  assertGeminiVeoSubmissionBudget,
  canAdvanceToNextGeminiProfile,
  resolveGeminiVeoProfile,
} from "./_gemini-veo-profile-chain.mjs";
import { classifyVeoBody } from "./_gemini-veo-core.mjs";

let passed = 0;
let failed = 0;
function check(name, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}`);
  }
}

check("profile chain contract is versioned", GEMINI_VEO_PROFILE_CHAIN_VERSION === "gemini_veo_profile_chain_v1");
check("Owner profile priority is exactly Gemini 2 then 3 then 4", JSON.stringify(GEMINI_VEO_PROFILE_CHAIN.map((profile) => profile.profileId)) === JSON.stringify([2, 3, 4]));
check("each desktop shortcut maps to one isolated user-data directory", GEMINI_VEO_PROFILE_CHAIN.every((profile) => profile.desktopShortcutName === `Gemini ${profile.profileId}` && profile.userDataDir.endsWith(`AI-Gemini-${profile.profileId}`)));
check("each profile receives one unique CDP port", new Set(GEMINI_VEO_PROFILE_CHAIN.map((profile) => profile.cdpPort)).size === 3);
check("only explicit quota exhaustion permits profile fallback", canAdvanceToNextGeminiProfile("quota_exhausted") && ["login_required", "refusal", "transient_error", "ambiguous_failure", "unavailable"].every((state) => !canAdvanceToNextGeminiProfile(state)));
check("Gemini 2 is selected when ready", resolveGeminiVeoProfile([{ profileId: 2, state: "ready" }]).selectedProfile?.profileId === 2);
check("Gemini 3 is selected only after Gemini 2 quota exhaustion", resolveGeminiVeoProfile([{ profileId: 2, state: "quota_exhausted" }, { profileId: 3, state: "ready" }]).selectedProfile?.profileId === 3);
check("Gemini 4 is selected only after both earlier quotas", resolveGeminiVeoProfile([{ profileId: 2, state: "quota_exhausted" }, { profileId: 3, state: "quota_exhausted" }, { profileId: 4, state: "ready" }]).selectedProfile?.profileId === 4);
check("ambiguous failure blocks instead of rotating accounts", resolveGeminiVeoProfile([{ profileId: 2, state: "ambiguous_failure" }, { profileId: 3, state: "ready" }]).reason === "ambiguous_failure");
check("login requirement blocks instead of rotating accounts", resolveGeminiVeoProfile([{ profileId: 2, state: "login_required" }, { profileId: 3, state: "ready" }]).reason === "login_required");
check("all exhausted profiles stop without selection", resolveGeminiVeoProfile(GEMINI_VEO_PROFILE_CHAIN.map((profile) => ({ profileId: profile.profileId, state: "quota_exhausted" }))).reason === "all_profiles_quota_exhausted");
check("unchecked next profile blocks after quota", resolveGeminiVeoProfile([{ profileId: 2, state: "quota_exhausted" }]).reason === "profile_unchecked");
check("transient provider text is not classified as quota", classifyVeoBody("Something went wrong. Please try again later.")?.type === "transient");
check("explicit video limit text is classified as quota", classifyVeoBody("동영상 생성 한도에 도달했습니다. 한도는 내일 초기화됩니다.")?.type === "quota");
check("policy refusal stays distinct from quota", classifyVeoBody("안전 가이드라인에 따라 생성할 수 없습니다.")?.type === "refusal");
check("submission budget permits zero or one across all profiles", assertGeminiVeoSubmissionBudget([]).submissionCount === 0 && assertGeminiVeoSubmissionBudget([{ type: "veo_submit", profileId: 4 }]).submissionCount === 1);
let duplicateSubmitBlocked = false;
try {
  assertGeminiVeoSubmissionBudget([{ type: "veo_submit", profileId: 2 }, { type: "veo_submit", profileId: 3 }]);
} catch {
  duplicateSubmitBlocked = true;
}
check("submission budget rejects a second submit after fallback", duplicateSubmitBlocked);
check("preflight contract prohibits prompt, reference, account and submit mutations", GEMINI_VEO_PROFILE_POLICY.preflightSubmissionCount === 0 && GEMINI_VEO_PROFILE_POLICY.allowPromptTypingDuringPreflight === false && GEMINI_VEO_PROFILE_POLICY.allowReferenceAttachDuringPreflight === false && GEMINI_VEO_PROFILE_POLICY.allowAutomaticLogin === false && GEMINI_VEO_PROFILE_POLICY.allowAccountMutation === false);
const preflightSource = fs.readFileSync("scripts/preflight-gemini-veo-profile-chain-v1.mjs", "utf8");
check("local preflight cannot launch or control a browser", !/playwright|ensureChrome|connectOverCDP|\.click\(|attachRef|typeAndVerify/.test(preflightSource));
check("local preflight emits zero-side-effect evidence", /submissionCount/.test(preflightSource) && /promptTyped: false/.test(preflightSource) && /referenceAttached: false/.test(preflightSource) && /browserLaunched: false/.test(preflightSource) && /networkAccessed: false/.test(preflightSource));

const livePreflightSource = fs.readFileSync("scripts/run-gemini-veo-live-no-submit-v1.mjs", "utf8");
check("live preflight requires an explicit read-only browser approval flag", /--allow-browser-readonly/.test(livePreflightSource));
check("live preflight consumes the Owner profile chain instead of hardcoding another order", /for \(const profile of GEMINI_VEO_PROFILE_CHAIN\)/.test(livePreflightSource));
check("live preflight advances only through the shared quota-only policy", /canAdvanceToNextGeminiProfile\(result\.state\)/.test(livePreflightSource));
check("live preflight contains no prompt typing or file attachment browser calls", !/\.fill\(|\.type\(|keyboard\.|setInputFiles|filechooser|typeAndVerify|attachRef/.test(livePreflightSource));
check("live preflight contains no send or account mutation browser calls", !/메시지 보내기|Send message|\.press\(["']Enter|selectAccount/.test(livePreflightSource));
check("live preflight explicitly rejects account-change requests", /--change-account/.test(livePreflightSource));
check("live preflight records zero-submit and no-mutation evidence", /submissionCount: submissionBudget\.submissionCount/.test(livePreflightSource) && /promptTyped: false/.test(livePreflightSource) && /referenceAttached: false/.test(livePreflightSource) && /accountChanged: false/.test(livePreflightSource));
check("live preflight scopes quota text to current UI regions instead of the whole page body", /readCurrentVeoStatusText/.test(livePreflightSource) && !/locator\(["']body["']\)\.innerText/.test(livePreflightSource));
check("live preflight writes diagnostics outside the repository output tree", /GEMINI_VEO_PROFILE_POLICY\.outputRoot/.test(livePreflightSource) && /live-no-submit-v1/.test(livePreflightSource));

console.log(JSON.stringify({ passed: failed === 0, passedCount: passed, totalCount: passed + failed, failedCount: failed }, null, 2));
process.exit(failed === 0 ? 0 : 1);
