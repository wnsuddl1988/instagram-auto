export const HOME_PROBLEM_LAB_ENGINE_ID = "home_problem_lab" as const;
export const HOME_PROBLEM_LAB_UPLOAD_PROFILE = "home_problem_lab" as const;

export type HomeProblemLabAxis =
  | "cleaning_odor_storage"
  | "kitchen_food_time";

export type HomeProblemLabSceneRole =
  | "hook_problem"
  | "lumi_diagnosis"
  | "cause_explanation"
  | "free_solution"
  | "product_criteria"
  | "product_card_optional"
  | "verdict_cta"
  | "next_case_teaser";

export type HomeProblemLabVisualKind =
  | "lumi_2_5d"
  | "ai_home_reenactment"
  | "graphic_checklist_diagram"
  | "product_card_mock";

export const REQUIRED_HOME_PROBLEM_LAB_SCENE_ROLES = [
  "hook_problem",
  "lumi_diagnosis",
  "cause_explanation",
  "free_solution",
  "product_criteria",
  "verdict_cta",
  "next_case_teaser",
] as const;

export interface HomeProblemLabProductCard {
  isMock: true;
  isPublishable: false;
  label: string;
  disclosure: "테스트용·게시불가";
  affiliateUrl: null;
  sourceUrl: null;
  imageOrigin: "no_product_image_in_phase_2";
}

export interface HomeProblemLabScene {
  role: HomeProblemLabSceneRole;
  visualKind: HomeProblemLabVisualKind;
  startSecond: number;
  narration: string;
  productCard?: HomeProblemLabProductCard;
  containsAiGeneratedProduct?: boolean;
}

export interface HomeProblemLabDisclosure {
  required: boolean;
  reason: string;
  label: "테스트용·게시불가";
  affiliate: false;
  sponsored: false;
  groupPurchase: false;
}

export interface HomeProblemLabMetadata {
  title: string;
  description: string;
  hashtags: string[];
  cta: string;
  disclosure: HomeProblemLabDisclosure;
}

export interface HomeProblemLabQualityEvidence {
  topicFit: Record<"axisAligned" | "problemSpecific" | "causeSpecific" | "freeSolutionRelevant" | "productNotPrimary", boolean>;
  firstTwoSecondsHook: Record<"withinTwoSeconds" | "problemNamed" | "causeOpenLoop" | "plainLanguage" | "nonClickbait", boolean>;
  problemSolving: Record<"threeCauses" | "freeSolutionFirst" | "orderedSteps" | "criteriaWhenNeeded" | "clearVerdict", boolean>;
  naturalPurchaseConversion: Record<"criteriaBeforeCard" | "cardOptional" | "lateProductCard" | "noAffiliate" | "noPurchasePressure", boolean>;
  aiQualityConsistency: Record<"lumiConsistency" | "neutralHouseholdProps" | "productOnlyInCard" | "noFakeProduct" | "noFakeTestimonial", boolean>;
}

export interface HomeProblemLabContentDraft {
  engineId: typeof HOME_PROBLEM_LAB_ENGINE_ID;
  uploadProfile: typeof HOME_PROBLEM_LAB_UPLOAD_PROFILE;
  topic: string;
  axis: HomeProblemLabAxis;
  scenes: HomeProblemLabScene[];
  metadata: HomeProblemLabMetadata;
  qualityEvidence: HomeProblemLabQualityEvidence;
  requiresAdvertisingDisclosure: boolean;
  advertisingDisclosurePresent: boolean;
  simulatedExternalCalls: 0;
  dryRun: true;
}

export interface HomeProblemLabQualityScore {
  topicFit: number;
  firstTwoSecondsHook: number;
  problemSolving: number;
  naturalPurchaseConversion: number;
  aiQualityConsistency: number;
}

export interface HomeProblemLabQualityResult {
  score: HomeProblemLabQualityScore;
  total: number;
  hardFails: string[];
  qualityCandidate: boolean;
  uploadCandidate: false;
  isQualityCandidate: boolean;
  isUploadCandidate: boolean;
}

export type HomeProblemLabTtsModel =
  | "eleven_multilingual_v2"
  | "eleven_flash_v2_5";

export interface HomeProblemLabLumiVoiceSettings {
  stability: 0.62;
  similarityBoost: 0.78;
  style: 0.08;
  useSpeakerBoost: true;
  speed: 1.08;
}

export interface HomeProblemLabLumiTtsRequest {
  engineId: typeof HOME_PROBLEM_LAB_ENGINE_ID;
  characterId: "lumi";
  voiceProfileId: "lumi_home_problem_lab";
  voiceProfileVersion: "v1";
  text: string;
  normalizedText: string;
  language: "ko";
  model: HomeProblemLabTtsModel;
  voiceSettings: HomeProblemLabLumiVoiceSettings;
  outputFormat: "mp3_44100_128";
  dryRun: boolean;
  requestId: string;
}

export type HomeProblemLabTtsProviderMode = "mock" | "elevenlabs_live";
export type HomeProblemLabCredentialPresenceStatus = "present" | "missing" | "unchecked";

export interface HomeProblemLabCredentialPresence {
  apiKey: HomeProblemLabCredentialPresenceStatus;
  lumiVoiceId: HomeProblemLabCredentialPresenceStatus;
}

export interface HomeProblemLabLiveAuthorization {
  engineId: typeof HOME_PROBLEM_LAB_ENGINE_ID;
  characterId: "lumi";
  voiceProfileId: "lumi_home_problem_lab";
  provider: "elevenlabs_live";
  dryRun: false;
  liveCallAuthorized: boolean;
  maxExternalCalls: 1;
  requestId: string;
  sampleText: string;
  batchSize: 1;
  sentenceCount: number;
  preflightPassed: boolean;
  instagramUpload: false;
  youtubeUpload: false;
  imageGeneration: false;
  productLookup: false;
  credentialPresence: HomeProblemLabCredentialPresence;
}

export interface HomeProblemLabLiveExecutionPermit {
  purpose: "single_lumi_voice_sample";
  engineId: typeof HOME_PROBLEM_LAB_ENGINE_ID;
  characterId: "lumi";
  requestId: string;
  liveCallAuthorized: true;
  maxExternalCalls: 1;
  expiresAt: number;
  instagramUpload: false;
  youtubeUpload: false;
  imageGeneration: false;
  productLookup: false;
  publish: false;
}

export interface HomeProblemLabElevenLabsRequestEnvelope {
  provider: "elevenlabs_live";
  engineId: typeof HOME_PROBLEM_LAB_ENGINE_ID;
  characterId: "lumi";
  voiceProfileId: "lumi_home_problem_lab";
  requestId: string;
  text: string;
  normalizedText: string;
  model: "eleven_multilingual_v2";
  voiceSettings: HomeProblemLabLumiVoiceSettings;
  outputFormat: "mp3_44100_128";
  characterCount: number;
  estimatedBillableCharacters: number;
  timeoutMs: 20000;
  maxExternalCalls: 1;
  retryCount: 0;
  credentialPresence: HomeProblemLabCredentialPresence;
}

export interface HomeProblemLabAudioResponseMetadata {
  status: number;
  contentType: string | null;
  byteLength: number;
  timedOut: boolean;
}

export interface HomeProblemLabAudioResponseValidation {
  passed: boolean;
  errorCode: string | null;
  contentType: string | null;
  byteLength: number;
}

export interface HomeProblemLabLiveTtsResult {
  provider: "elevenlabs";
  isMock: false;
  isPublishable: false;
  audioGenerated: boolean;
  audioPath: string | null;
  durationMs: number | null;
  byteLength: number | null;
  contentType: string | null;
  outputFormat: "mp3_44100_128";
  requestId: string;
  externalCalls: number;
  voiceIdExposed: false;
  secretExposed: false;
  uploadCandidate: false;
  validationPassed: boolean;
  errorCode: string;
}

export interface HomeProblemLabSafeTtsLogEvent {
  requestId: string;
  provider: HomeProblemLabTtsProviderMode;
  engineId: typeof HOME_PROBLEM_LAB_ENGINE_ID;
  characterId: "lumi";
  model: HomeProblemLabTtsModel;
  outputFormat: "mp3_44100_128";
  characterCount: number;
  estimatedBillableCharacters: number;
  timeoutMs: number;
  externalCallCount: 0;
  outcomeCode: string;
  credentialPresence: HomeProblemLabCredentialPresence;
}

export interface HomeProblemLabTtsPreflightResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  estimatedDurationMs: number;
  isMock: true;
  isPublishable: false;
  externalCallAllowed: false;
  voiceIdExposed: false;
}

export interface HomeProblemLabMockTtsResponse {
  isMock: true;
  isPublishable: false;
  externalCalls: 0;
  provider: "mock";
  character: "lumi";
  durationEstimateMs: number;
  characterCount: number;
  normalizedText: string;
  outputFormat: "mp3_44100_128";
  audioGenerated: false;
  audioPath: null;
  voiceIdExposed: false;
  uploadCandidate: false;
}

export interface HomeProblemLabTtsPreflightArtifact {
  dialogue: string;
  request: HomeProblemLabLumiTtsRequest;
  preflight: HomeProblemLabTtsPreflightResult;
  response: HomeProblemLabMockTtsResponse;
}
