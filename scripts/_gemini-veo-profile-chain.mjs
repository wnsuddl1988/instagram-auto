export const GEMINI_VEO_PROFILE_CHAIN_VERSION = "gemini_veo_profile_chain_v1";

export const GEMINI_VEO_PROFILE_CHAIN = Object.freeze([
  Object.freeze({
    profileId: 2,
    desktopShortcutName: "Gemini 2",
    cdpPort: 9224,
    userDataDir: "C:/Users/PC/AppData/Local/Google/Chrome/User Data/AI-Gemini-2",
  }),
  Object.freeze({
    profileId: 3,
    desktopShortcutName: "Gemini 3",
    cdpPort: 9225,
    userDataDir: "C:/Users/PC/AppData/Local/Google/Chrome/User Data/AI-Gemini-3",
  }),
  Object.freeze({
    profileId: 4,
    desktopShortcutName: "Gemini 4",
    cdpPort: 9226,
    userDataDir: "C:/Users/PC/AppData/Local/Google/Chrome/User Data/AI-Gemini-4",
  }),
]);

export const GEMINI_VEO_PROFILE_POLICY = Object.freeze({
  advanceOnlyOn: "quota_exhausted",
  maxSubmissionCountAcrossChain: 1,
  preflightSubmissionCount: 0,
  allowAutomaticLogin: false,
  allowAccountMutation: false,
  allowPromptTypingDuringPreflight: false,
  allowReferenceAttachDuringPreflight: false,
  allowEnterKeySubmitFallback: false,
  outputRoot: "C:/tmp/money-shorts-os/gemini-veo",
});

const PROFILE_STATES = new Set([
  "ready",
  "quota_exhausted",
  "login_required",
  "refusal",
  "transient_error",
  "ambiguous_failure",
  "unavailable",
]);

export function canAdvanceToNextGeminiProfile(state) {
  return state === GEMINI_VEO_PROFILE_POLICY.advanceOnlyOn;
}

function publicProfile(profile) {
  return {
    profileId: profile.profileId,
    desktopShortcutName: profile.desktopShortcutName,
    cdpPort: profile.cdpPort,
  };
}

export function resolveGeminiVeoProfile(results) {
  if (!Array.isArray(results)) throw new TypeError("profile results must be an array");
  const byId = new Map();
  for (const result of results) {
    if (!GEMINI_VEO_PROFILE_CHAIN.some((profile) => profile.profileId === result?.profileId)) {
      throw new Error(`unknown Gemini profile result: ${result?.profileId}`);
    }
    if (byId.has(result.profileId)) throw new Error(`duplicate Gemini profile result: ${result.profileId}`);
    if (!PROFILE_STATES.has(result.state)) throw new Error(`unsupported Gemini profile state: ${result.state}`);
    byId.set(result.profileId, result);
  }

  const audited = [];
  for (const profile of GEMINI_VEO_PROFILE_CHAIN) {
    const result = byId.get(profile.profileId);
    if (!result) {
      return {
        decision: "BLOCKED",
        reason: "profile_unchecked",
        blockedProfile: publicProfile(profile),
        selectedProfile: null,
        audited,
      };
    }
    audited.push({ profileId: profile.profileId, state: result.state });
    if (result.state === "ready") {
      return {
        decision: "READY",
        reason: "first_ready_profile",
        blockedProfile: null,
        selectedProfile: publicProfile(profile),
        audited,
      };
    }
    if (!canAdvanceToNextGeminiProfile(result.state)) {
      return {
        decision: "BLOCKED",
        reason: result.state,
        blockedProfile: publicProfile(profile),
        selectedProfile: null,
        audited,
      };
    }
  }
  return {
    decision: "BLOCKED",
    reason: "all_profiles_quota_exhausted",
    blockedProfile: publicProfile(GEMINI_VEO_PROFILE_CHAIN.at(-1)),
    selectedProfile: null,
    audited,
  };
}

export function assertGeminiVeoSubmissionBudget(events) {
  const rows = Array.isArray(events) ? events : [];
  const submissions = rows.filter((event) => event?.type === "veo_submit");
  if (submissions.length > GEMINI_VEO_PROFILE_POLICY.maxSubmissionCountAcrossChain) {
    throw new Error(`Gemini Veo submission budget exceeded: ${submissions.length}`);
  }
  for (const event of submissions) {
    if (!GEMINI_VEO_PROFILE_CHAIN.some((profile) => profile.profileId === event.profileId)) {
      throw new Error(`Gemini Veo submission used an unknown profile: ${event.profileId}`);
    }
  }
  return { passed: true, submissionCount: submissions.length };
}
