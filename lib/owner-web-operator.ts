/**
 * owner-web-operator.ts — 웹 운영 콘솔(/money-shorts)이 호출하는 safe local control helper.
 *
 * task: owner-web-operator-ui-local-control-v1
 * task: owner-web-auto-topic-refresh-and-upload-button-v1 (확인 게이트형 실제 업로드)
 *
 * 이 모듈의 목적은 **이미 검증된 기존 automation 스크립트**를, 웹 버튼에서 안전하게 감싸는 것이다.
 * 대부분의 action은 no-live/preflight-only다. `actualUpload`만 final E2E runner를
 * `--arm`으로 실행할 수 있고, `flowMotionGenerate`는 별도의 정확한 장면별 Owner 승인 뒤
 * Google Flow 영상 1개를 생성할 수 있다. 두 live 경로는 서로의 승인을 재사용하지 않는다.
 *
 * 보안 계약(가드가 강제):
 * - 실행 가능한 명령은 buildOperatorCommand에 하드코딩된 것뿐이다. 임의 명령/셸 문자열 없음.
 * - spawnSync(process.execPath, argsArray, { shell:false }) 만 사용한다.
 * - `--live`는 어떤 경로로도 붙지 않는다.
 * - 실게시를 여는 `--arm`은 `actualUpload` 분기에서만 생성되고(ARM_ARG_TOKEN, 단일 지점),
 *   runOperatorScript는 호출자가 `allowArm:true`를 명시했을 때만 이를 통과시킨다(이중 방어).
 *   route는 Owner 확인 게이트(체크 2개 + "업로드" 입력) + 영상/게시 전 점검 evidence를
 *   서버에서 검증한 뒤에만 allowArm을 부여한다.
 * - `.env`/`.env.local` 등 secret 파일을 직접 읽지 않는다.
 * - child env는 승인된 6개 key만 전달하며, 값은 읽어서 전달만 하고 절대 출력/파생/저장하지 않는다.
 * - stdout/stderr는 반환 전 secret-shaped 토큰을 REDACTED로 치환한다.
 * - Vercel/production runtime에서는 로컬 스크립트 실행 action을 LOCAL_AUTOMATION_REQUIRES_LOCAL_DEV로 차단한다.
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  resolve,
} from "node:path";
import {
  FINANCE_EDITORIAL_LANES,
  FINANCE_EDITORIAL_TOPIC_BANK,
  type FinanceEditorialLane,
  type FinanceEditorialTopic,
} from "./finance-editorial-topic-bank";
import {
  FINANCE_EDITORIAL_COVER_HOOK_CONTRACT_VERSION,
  FINANCE_EDITORIAL_VIDEO_STRATEGY_VERSION,
  buildFinanceEditorialScriptParts,
  buildFinanceEditorialVideoStrategy,
  financeEditorialCoverHookAuditMatches,
  financeEditorialVideoStrategyCoverHooksPass,
  inferFinanceEditorialLane,
  type FinanceEditorialCoverHookAudit,
  type FinanceEditorialCoverLine,
  type FinanceEditorialVideoStrategy,
} from "./finance-editorial-script-engine";
import {
  FINANCE_VISUAL_CHARACTER_CONTINUITY,
  FINANCE_VISUAL_CHARACTER_CONTINUITY_VERSION,
  FINANCE_VISUAL_MOTION_CONTRACT_VERSION,
  FINANCE_VISUAL_MIN_ADJACENT_DIFFERENCES,
  FINANCE_VISUAL_EVIDENCE_VERSION,
  FINANCE_VISUAL_STYLE_CONTRACT,
  buildFinanceVisualEvidence,
  financeVisualDifferenceCount,
  financeVisualEvidenceToCue,
  financeVisualSequencePass,
  type FinanceVisualEvidence,
} from "./finance-visual-evidence-engine";
import {
  PLATFORM_DISCOVERY_METADATA_VERSION,
  buildPlatformDiscoveryMetadata,
} from "./platform-discovery-metadata";
import {
  MONEY_SHORTS_TTS_OWNER_APPROVAL_TEXT,
  buildMoneyShortsTtsOwnerListeningEvidence,
  validateMoneyShortsTtsOwnerListeningEvidence,
} from "./money-shorts-tts-owner-listening-gate.mjs";
import {
  MONEY_SHORTS_FINAL_VIDEO_OWNER_APPROVAL_VERSION,
  MONEY_SHORTS_FINAL_VIDEO_OWNER_APPROVAL_TEXT,
  buildMoneyShortsFinalVideoOwnerApprovalEvidence,
  validateMoneyShortsPublishPreflightBinding,
  validateMoneyShortsFinalVideoOwnerApprovalEvidence,
} from "./money-shorts-final-video-owner-approval.mjs";
import {
  buildPublishLedgerKey,
  readPublishLedgerReadOnly,
} from "./publish-ledger-runtime.mjs";
import { classifyMoneyShortsPublishRecovery } from "./money-shorts-publish-recovery.mjs";
import {
  MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_EVENT_TRANSITIONS,
  moneyShortsYoutubeOnlyRecoveryEventPath,
  moneyShortsYoutubeOnlyRecoveryPaths,
} from "./money-shorts-youtube-only-recovery.mjs";
import {
  applyMoneyShortsYoutubeOnlyRecoveryOverlay,
  emptyMoneyShortsYoutubeOnlyRecoveryOverlaySummary,
} from "./money-shorts-youtube-only-recovery-overlay.mjs";
import {
  inspectMoneyShortsPublishAttemptEvidence,
} from "./money-shorts-publish-attempt-journal.mjs";
import {
  buildMoneyShortsPublishReconciliationPacket,
} from "./money-shorts-publish-reconciliation-packet.mjs";
import {
  MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_CONFIRM_TEXT,
  MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_DECISION,
  MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_DIRNAME,
  buildMoneyShortsPublishOwnerReconciliationEvidence,
  moneyShortsPublishOwnerReconciliationMatchesRequest,
} from "./money-shorts-publish-owner-reconciliation.mjs";
import {
  writeMoneyShortsPublishOwnerReconciliationOnce,
} from "./money-shorts-publish-owner-reconciliation-store.mjs";
import {
  FINANCE_CHARACTER_CANDIDATE_COUNT,
  FINANCE_CHARACTER_CAST,
  FINANCE_CHARACTER_CAST_VERSION,
  FINANCE_CHARACTER_IDS,
  FINANCE_CHARACTER_SELECTION_STATUS,
  FINANCE_CHARACTER_VISUAL_STYLE,
  financeCharacterById,
  financeCharacterForSubtopic,
  type FinanceCharacterId,
} from "./finance-character-cast";
import {
  FINANCE_CHARACTER_VOICE_MODEL_ID,
  FINANCE_CHARACTER_VOICE_PRODUCTION_PRESET,
  financeCharacterVoiceForSubtopic,
  type FinanceCharacterVoiceProfile,
} from "./finance-character-voice-cast";
import {
  MONEY_SHORTS_MANUAL_VISUAL_REVIEW_EVIDENCE_FILE,
  buildMoneyShortsManualVisualReviewEvidence,
  commitMoneyShortsManualVisualReviewEvidenceTransaction,
  validateMoneyShortsImageReviewApproval,
  validateMoneyShortsManualVisualReview,
  validateMoneyShortsManualVisualReviewTransaction,
  validateMoneyShortsSelectedSceneRegeneration,
} from "./money-shorts-manual-visual-review.mjs";
import {
  VEO_SCENE_SELECTION_CONTRACT_VERSION,
  getVeoMotionSceneLimit,
  selectVeoMotionScenes,
  type SceneMediaStrategy,
  type SceneMediaStrategyOverride,
  type SceneMediaStrategySource,
} from "./veo-scene-selector";
import {
  FLOW_MOTION_QA_EVIDENCE_CONTRACT_VERSION,
  FLOW_MOTION_STATE_CONTRACT_VERSION,
  buildFlowMotionState,
  flowMotionStateIsValid,
  transitionFlowMotionJob,
  type FlowMotionJob,
  type FlowMotionJobStatus,
  type FlowMotionQaEvidence,
  type FlowMotionState,
} from "./flow-motion-jobs";

// ── 상수 ─────────────────────────────────────────────────────────────────────

/** 웹에서 호출 가능한 action enum. 이 목록 밖의 값은 전부 거부된다. */
export const OPERATOR_ACTIONS = [
  "status",
  "credentialPreflight",
  "readyPreflight",
  "readyDuplicateGuard",
  "finalE2ePreflight",
  // ── 자동 쇼츠 만들기 위저드 (task: owner-one-click-video-creation-ui-v1) ──
  "topicRecommend", // 재테크 편집 후보 우선, 평가 완료 뒤 Claude 확장 (spawn 없음)
  "topicPreference", // Owner 편집 판정(만든다/애매/버린다) 저장 (외부 호출 없음)
  "scriptPreview", // 규칙 기반 대본 생성/미리보기 (spawn 없음, 읽기 전용)
  "voiceSample", // 선택 대본 기반 local_mock TTS 시안 생성 (무료, 외부 API 없음)
  "videoCreate", // 로컬 파이프라인 dry-run으로 시안 영상 생성 (업로드 없음)
  "previewStatus", // 생성된 시안 영상 파일 상태 확인 (spawn 없음, 읽기 전용)
  // ── 게시 전 점검 + 실제 업로드 (task: owner-web-auto-topic-refresh-and-upload-button-v1) ──
  "wizardPreflight", // 선택 주제로 만든 영상 기준 게시 전 점검 (--arm 없음, 외부 호출 0)
  "actualUpload", // Owner 명시 확인 후 실제 업로드 (final E2E runner --arm; 서버 confirm 게이트 필수)
  "publishOwnerReconciliationResolve", // 부분 게시의 Owner 수동 대조 증거만 immutable local 기록
  "uploadReadyList", // 완성됐지만 양쪽 플랫폼에 아직 게시되지 않은 영상 목록(읽기 전용)
  // ── 재테크 영상 주인공 검수 (영상/장면 생성 전, 외부 게시 없음) ──
  "characterCastStatus", // 4명 후보 이미지/선택 상태(읽기 전용)
  "characterCastCreate", // 선택한 주인공의 후보 이미지 2장 생성(ChatGPT+Playwright)
  "characterCastSelect", // 후보 1장을 해당 주인공 기준 이미지로 확정(로컬 파일 기록)
  // ── 실제 제작 파이프라인 (task: owner-web-real-script-voice-visual-generation-pipeline-v1) ──
  // 아래 3개 create는 Owner가 로컬 웹 버튼을 눌렀을 때만 실행되는 live 생성 경로다(업로드 아님).
  // 키/세션 없으면 스크립트가 fail-closed로 종료하고, 산출물은 전부 C:\tmp 아래에만 쓴다.
  "realTtsPreflight", // 현재 음성 입력·구간 해시 승인 패킷 생성(API 호출 0)
  "realTtsReadonlyPreflight", // 명시 승인된 ElevenLabs 계정/음성/모델/최근 이력 GET-only 진단
  "realTtsCreate", // 확정 대본(script-final) 기반 ElevenLabs 고정 목소리 실제 TTS 생성
  "realTtsQualityAccept", // 생성된 모든 편을 Owner가 청취한 뒤 현재 오디오 해시에만 품질 승인
  "realSceneImagesCreate", // 대본 흐름 기반 동적 장면으로 ChatGPT+Playwright 실제 이미지 생성
  "realSceneImagesReviewAccept", // 전체 장면을 Owner가 본 뒤 현재 이미지 세트 해시에만 품질 승인
  "realSceneImagesRegenerateSelected", // Owner가 고른 실패 장면만 no-retry로 다시 생성
  "flowMotionPrepare", // 자동 선정 장면의 Flow no-submit 패킷/승인 대기 상태 생성(외부 실행 0)
  "flowMotionGenerate", // 정확한 장면별 Owner 승인 뒤 Flow에서 Veo 1회 생성·로컬 저장
  "flowMotionQaPass", // Owner 7항목 검수 통과 evidence 기록 후 render_ready 전환
  "flowMotionQaFail", // Owner 검수 실패 기록(자동 재생성 없음)
  "finalVideoCreate", // 실제 음성 + 흐름 기반 실제 이미지 + 자막 + 모션으로 최종 mp4 합성
  "finalVideoReviewAccept", // 모든 최종 MP4와 게시 문구를 Owner가 본 뒤 현재 full hash에만 승인
  "realMediaStatus", // 실제 음성/이미지/최종 영상 준비 상태 + media quality gate (읽기 전용, spawn 없음)
  "automationPlan", // 로컬 산출물에서 현재 단계와 다음 안전 작업을 재계산(읽기 전용, 실행 없음)
  "automationAdvance", // 계획이 허용한 로컬/no-submit 작업을 정확히 1개 실행한 뒤 재계산하고 중단
  "automationRecoveryResolve", // 현재 계획과 중단 영수증 증거가 일치할 때만 Owner 결정으로 잠금 해제
  "automationQueueStatus", // 로컬 큐 멤버십을 읽고 현재 산출물 기준 단계로 재구성
  "automationQueueEnqueue", // Owner가 선택한 주제를 로컬 계획 큐에 추가/동기화
  "automationQueueRunSelected", // 최신 큐 미리보기 지문이 일치할 때 선택된 로컬 안전 작업 1개만 실행
  "automationQueuePause", // 큐 멤버십을 일시정지하고 실행 없이 이력만 남김
  "automationQueueResume", // Owner가 일시정지한 큐 멤버십만 재개
  "automationQueueRemove", // 큐 멤버십만 제거하고 산출물은 보존
  "automationQueueArchiveCompleted", // 현재 완료 계획을 bounded 로컬 보관 이력으로 이동
  "automationQueueMovePriority", // Owner가 한 칸 앞/뒤로 조정한 큐 순서만 저장
  "safeSessionStatus", // Owner-started bounded safe-session 상태만 읽기
  "safeSessionStart", // 1~3회 상한의 세션 시작 의도만 로컬 기록
  "safeSessionStop", // 현재 세션의 stop-after-current-action 의도만 로컬 기록
  "safeSessionClose", // 중지 또는 상한 도달 세션만 요약 이력으로 보관 종료
  "safeSessionRecoveryResolve", // 표시된 증거 지문과 일치하는 직접 복구만 Owner 확인으로 기록
  "safeSessionRunNext", // 표시된 coordinator 지문과 일치하는 로컬 안전 작업 1회만 실행
  "safeSessionRunBounded", // Owner 확인 뒤 local-safe 작업을 최대 3회, 첫 비정상 결과에서 중단
] as const;

export type OperatorAction = (typeof OPERATOR_ACTIONS)[number];

/** child process에 전달 가능한 승인된 credential key 이름. 값은 여기 없다. */
export const APPROVED_ENV_KEY_NAMES = [
  "INSTAGRAM_BUSINESS_ACCOUNT_ID",
  "INSTAGRAM_ACCESS_TOKEN",
  "YOUTUBE_CLIENT_ID",
  "YOUTUBE_CLIENT_SECRET",
  "YOUTUBE_REFRESH_TOKEN",
  "BLOB_READ_WRITE_TOKEN",
] as const;

/**
 * 실제 미디어 생성(realTtsCreate)과 명시 승인된 GET-only 진단 child에만 필요한 추가 key 이름.
 * 값은 여기 없다.
 * Next dev 서버 런타임 process.env(.env.local 자동 로드)에서 개별 복사만 하며,
 * 로그/응답/summary 어디에도 값·길이·prefix·hash를 넣지 않는다.
 * (ANTHROPIC_API_KEY는 child에 전달하지 않는다 — Claude 보정은 서버 in-process fetch 전용.)
 */
export const MEDIA_ENV_KEY_NAMES = [
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_VOICE_ID",
  "ELEVENLABS_MODEL_ID",
  "ELEVENLABS_VOICE_LABEL",
] as const;

/** node 실행에 필요한 non-secret OS 변수만 개별 상속(broad spread 금지). */
const SAFE_CHILD_OS_ENV_KEYS = [
  "SystemRoot",
  "windir",
  "SystemDrive",
  "PATH",
  "Path",
  "PATHEXT",
  "COMSPEC",
  "TEMP",
  "TMP",
  "HOME",
  "NUMBER_OF_PROCESSORS",
  "PROCESSOR_ARCHITECTURE",
] as const;

const SPAWN_TIMEOUT_MS = 120_000;
const MAX_OUTPUT_CHARS = 20_000;

export const LOCAL_ONLY_BLOCKER = "LOCAL_AUTOMATION_REQUIRES_LOCAL_DEV";

/** 이 helper가 실행할 수 있는 유일한 스크립트 목록(repo-relative, 하드코딩). */
const SCRIPT_ENTRYPOINT = "scripts/run-owner-daily-automation-entrypoint.mjs";
const SCRIPT_ORCHESTRATOR = "scripts/run-dual-platform-final-publish-orchestrator.mjs";
const SCRIPT_FINAL_E2E = "scripts/run-final-e2e-dual-platform-publish-once.mjs";
const SCRIPT_MOCK_TTS = "scripts/build-local-mock-tts-audio-from-script.mjs";
const SCRIPT_LOCAL_PIPELINE_DRY_RUN = "scripts/run-local-money-shorts-pipeline-dry-run.mjs";
// 실제 제작 파이프라인 — 검증된 기존 ElevenLabs scene-paced 스크립트를 재사용하고,
// 이미지/최종 영상은 wizard 전용 once 스크립트를 쓴다(전부 repo-relative 하드코딩).
const SCRIPT_ELEVENLABS_SCENE_TTS = "scripts/build-elevenlabs-korean-director-tts-from-script.mjs";
const SCRIPT_ELEVENLABS_TTS_PREFLIGHT = "scripts/build-minjae-three-phase-tts-approval-packet-v1.mjs";
const SCRIPT_ELEVENLABS_READONLY_PREFLIGHT = "scripts/audit-elevenlabs-readonly-preflight-v1.mjs";
const SCRIPT_REAL_SCENE_IMAGES = "scripts/run-owner-real-scene-images-from-wizard-script-once.mjs";
const SCRIPT_FLOW_MOTION_GENERATION = "scripts/run-flow-motion-job-playwright-v1.mjs";
const SCRIPT_REAL_VIDEO = "scripts/run-owner-real-video-from-wizard-assets-once.mjs";
const SCRIPT_FINANCE_CHARACTER_CAST_AUDITION = "scripts/run-owner-finance-character-cast-audition.mjs";

/**
 * 자동 쇼츠 만들기 위저드가 소비하는 로컬 fixture(repo-relative, 하드코딩, 읽기 전용).
 * 사용자 입력은 이 경로들에 절대 섞이지 않는다.
 */
const FIXTURE_TOPIC_REPORT = "scripts/fixtures/topic_candidate_report.v1.json";
const FIXTURE_SCRIPT_COMPILER_OUTPUT = "scripts/fixtures/money-shorts-retention-script-compiler.output.v1.json";

/**
 * 위저드 산출물 저장 위치(레포 밖 고정 경로, 하드코딩).
 * 파이프라인 스크립트 자체가 repo 안 out-dir을 거부하므로 이중 방어가 된다.
 */
export const WIZARD_VIDEO_OUT_ROOT = "C:\\tmp\\money-shorts-os\\web-wizard-create-v1";
export const WIZARD_YOUTUBE_ONLY_RECOVERY_ROOT =
  "C:\\tmp\\money-shorts-os\\youtube-only-part1-recovery-v1";
export const WIZARD_VOICE_OUT_DIR = "C:\\tmp\\money-shorts-os\\web-wizard-voice-v1";
export const WIZARD_VISUAL_ENGINE_VERSION = "money_shorts_finance_3d_editorial_sequence_v11";
export const WIZARD_IMAGE_CONTROLLER_VERSION = "chatgpt_picture_v2_character_reference_v8";
export const WIZARD_VISUAL_MODALITY_VERSION = "money_shorts_visual_modality_sequence_v1";
export const WIZARD_MOTION_RENDERER_VERSION = "money_shorts_hybrid_motion_renderer_v1";
export const WIZARD_LAYERED_MOTION_RENDERER_VERSION = "money_shorts_layered_motion_renderer_v3";
export const WIZARD_CAPTION_LAYOUT_VERSION = "money_shorts_caption_layout_v2_comfortable_two_line";
export const WIZARD_FLOW_MOTION_RENDER_AUDIT_VERSION = "money_shorts_flow_motion_render_audit_v1";
const WIZARD_VISUAL_OUTPUT_DIR = "images-3d-editorial-sequence-v11";
const WIZARD_REAL_VIDEO_OUTPUT_DIR = "video-3d-editorial-sequence-v11";
export const WIZARD_TTS_ENGINE_VERSION = "money_shorts_korean_director_v2";
export const WIZARD_FULL_SCRIPT_CAPTION_CONTRACT_VERSION = "money_shorts_dynamic_semantic_caption_v6";
export const WIZARD_STAGED_COVER_CONTRACT_VERSION = "money_shorts_staged_prehook_cover_v1";
export const WIZARD_FULL_SCRIPT_PUBLISH_VERSION = "v5";

type WizardLayeredMotionAudit = {
  version?: string;
  sceneCount?: number;
  cameraModes?: string[];
  distinctCameraModeCount?: number;
  characterSceneCount?: number;
  handsSceneCount?: number;
  planCoveragePass?: boolean;
  layeredParallaxCoveragePass?: boolean;
  characterMicroMotionCoveragePass?: boolean;
  handActionMicroMotionCoveragePass?: boolean;
  localizedMotionCoveragePass?: boolean;
  visibleMicroMotionAmplitudePass?: boolean;
  smoothMotionPathPass?: boolean;
  distinctCameraModesPass?: boolean;
  passed?: boolean;
};
type WizardFlowMotionRenderAudit = {
  version?: string;
  requiredSceneNumbers?: number[];
  requiredSceneCount?: number;
  renderReadySceneCount?: number;
  ownerQaEvidenceCount?: number;
  videoHashCoveragePass?: boolean;
  portraitVideoCoveragePass?: boolean;
  ownerQaCoveragePass?: boolean;
  noVeoMotionRequired?: boolean;
  passed?: boolean;
};
type WizardHybridMotionSummary = {
  motionRendererVersion?: string;
  layeredMotionRendererVersion?: string;
  motionAudit?: WizardLayeredMotionAudit;
  flowMotionAudit?: WizardFlowMotionRenderAudit;
  visualTimingAudit?: {
    version?: string;
    applicable?: boolean;
    audioRetimed?: boolean;
    transitionType?: string | null;
    transitionDurationSec?: number;
    transitionStartsAtSec?: number | null;
    nextSceneFullyVisibleAtSec?: number | null;
    transitionStartsAtAudioBoundary?: boolean;
    audioBoundaryAlignmentPass?: boolean;
    priorSpeechCompletionPass?: boolean;
    earlyVisualTransitionCount?: number;
    totalDurationPreserved?: boolean;
    minimumSceneDurationPass?: boolean;
    passed?: boolean;
  };
};

function wizardHybridMotionSummaryIsReady(
  summary: WizardHybridMotionSummary | null | undefined,
  expectedSceneCount: number,
  scenes: Array<{ mediaStrategy?: string }>,
): boolean {
  const expectedVeoSceneNumbers = scenes
    .map((scene, index) => scene.mediaStrategy === "veo_motion" ? index + 1 : null)
    .filter((sceneNumber): sceneNumber is number => sceneNumber !== null);
  const actualVeoSceneNumbers = summary?.flowMotionAudit?.requiredSceneNumbers ?? [];
  return summary?.motionRendererVersion === WIZARD_MOTION_RENDERER_VERSION &&
    summary.layeredMotionRendererVersion === WIZARD_LAYERED_MOTION_RENDERER_VERSION &&
    summary.motionAudit?.version === WIZARD_LAYERED_MOTION_RENDERER_VERSION &&
    summary.motionAudit.sceneCount === expectedSceneCount - expectedVeoSceneNumbers.length &&
    summary.motionAudit.planCoveragePass === true &&
    summary.motionAudit.layeredParallaxCoveragePass === true &&
    summary.motionAudit.characterMicroMotionCoveragePass === true &&
    summary.motionAudit.handActionMicroMotionCoveragePass === true &&
    summary.motionAudit.localizedMotionCoveragePass === true &&
    summary.motionAudit.visibleMicroMotionAmplitudePass === true &&
    summary.motionAudit.smoothMotionPathPass === true &&
    summary.motionAudit.distinctCameraModesPass === true &&
    summary.motionAudit.passed === true &&
    summary.visualTimingAudit?.version === "money_shorts_natural_closing_visual_transition_v1" &&
    summary.visualTimingAudit.audioRetimed === false &&
    (summary.visualTimingAudit.applicable !== true || (
      summary.visualTimingAudit.transitionType === "fade" &&
      Number(summary.visualTimingAudit.transitionDurationSec) >= 0.449 &&
      summary.visualTimingAudit.transitionStartsAtAudioBoundary === true
    )) &&
    summary.visualTimingAudit.audioBoundaryAlignmentPass === true &&
    summary.visualTimingAudit.priorSpeechCompletionPass === true &&
    summary.visualTimingAudit.earlyVisualTransitionCount === 0 &&
    summary.visualTimingAudit.totalDurationPreserved === true &&
    summary.visualTimingAudit.minimumSceneDurationPass === true &&
    summary.visualTimingAudit.passed === true &&
    summary.flowMotionAudit?.version === WIZARD_FLOW_MOTION_RENDER_AUDIT_VERSION &&
    summary.flowMotionAudit.requiredSceneCount === expectedVeoSceneNumbers.length &&
    summary.flowMotionAudit.renderReadySceneCount === expectedVeoSceneNumbers.length &&
    summary.flowMotionAudit.ownerQaEvidenceCount === expectedVeoSceneNumbers.length &&
    summary.flowMotionAudit.videoHashCoveragePass === true &&
    summary.flowMotionAudit.portraitVideoCoveragePass === true &&
    summary.flowMotionAudit.ownerQaCoveragePass === true &&
    summary.flowMotionAudit.passed === true &&
    actualVeoSceneNumbers.length === expectedVeoSceneNumbers.length &&
    actualVeoSceneNumbers.every((sceneNumber, index) => sceneNumber === expectedVeoSceneNumbers[index]);
}
export const WIZARD_AV_SAMPLE_REVIEW_CONTRACT_VERSION = "money_shorts_av_sample_review_v1";
export const WIZARD_AV_SAMPLE_REVIEW_TOPIC_ID = "gen-finance-editorial-v2-housing_asset_gap-psychology_gap-04";
/** 주제별 대본 조립 규칙이 바뀌면 이전 확정본을 재사용하지 않는다. */
const WIZARD_SCRIPT_ENGINE_VERSION = "money_shorts_editorial_package_script_v14";
const WIZARD_TTS_OUTPUT_DIR = "tts-korean-director-v2";

/** 위저드가 topic별로 생성하는 입력 JSON의 루트(레포 밖 고정). */
const WIZARD_INPUTS_ROOT = "C:\\tmp\\money-shorts-os\\web-wizard-create-v1\\inputs";
const WIZARD_CHARACTER_CAST_ROOT = "C:\\tmp\\money-shorts-os\\web-wizard-create-v1\\character-cast-v1";
const WIZARD_CHARACTER_CAST_SELECTION_PATH = join(WIZARD_CHARACTER_CAST_ROOT, "selection.json");

/** 클릭마다 생성한 주제 묶음을 누적 저장하는 로컬 카탈로그(레포 밖 고정). 대본/영상 단계가 여기서 주제를 되찾는다. */
const WIZARD_TOPIC_CATALOG_PATH = "C:\\tmp\\money-shorts-os\\web-wizard-create-v1\\topics\\wizard-topic-catalog.json";
/** 카테고리별 최근 노출 시드 기록 — "다른 주제 보기"가 순서만 섞지 않게 최근 것을 제외한다. */
const WIZARD_TOPIC_RECENT_PATH = "C:\\tmp\\money-shorts-os\\web-wizard-create-v1\\topics\\wizard-topic-recent-shown.json";
/** Owner가 이미 본/선택/제작한 주제 기록 — AI 추천에서 같은 주제가 다시 뜨지 않게 한다. */
const WIZARD_TOPIC_HISTORY_PATH = "C:\\tmp\\money-shorts-os\\web-wizard-create-v1\\topics\\wizard-topic-history.json";
/** Owner 편집 판정. 새 500개 주제은행의 사용 제외와 후속 확장 근거로 쓴다. */
const WIZARD_TOPIC_EDITORIAL_PREFERENCES_PATH =
  "C:\\tmp\\money-shorts-os\\web-wizard-create-v1\\topics\\wizard-topic-editorial-preferences.json";

/**
 * 실제 게시 기록 원장(레포 밖 고정). 이전 실게시 기록(t2_salary_3days 등)이 들어 있는
 * canonical ledger이며, runner의 duplicate guard와 성공 기록이 모두 이 파일을 쓴다.
 */
const WIZARD_PUBLISH_LEDGER_PATH =
  "C:\\tmp\\money-shorts-os\\final-e2e-ready-content-unit-and-publish-one-v1\\publish-ledger.json";

/**
 * 이미 게시 완료된 evidence 콘텐츠 id — 어떤 경로로도 재업로드 금지(이중 방어).
 * runner 자체도 t1을 하드 차단하고, ledger duplicate guard가 t2를 차단하지만 여기서 한 번 더 막는다.
 */
export const BLOCKED_PUBLISHED_CONTENT_IDS = ["t1_lifestyle_inflation", "t2_salary_3days"] as const;

/** 위저드 시안 영상 스트리밍이 허용되는 유일한 경로 prefix. */
const WIZARD_VIDEO_ALLOWED_PREFIX = "C:\\tmp\\money-shorts-os\\";

/**
 * final E2E runner의 gate 1을 통과하기 위한 승인 문구. 이것은 secret이 아니라
 * Owner 승인 문자열이며, 이 문구만으로는 아무것도 게시되지 않는다.
 * runner에서 **실제 게시 경로를 여는 유일한 인자는 `--arm`**이다.
 * (`--arm` 없으면 runner는 gate 9에서 PREFLIGHT_ONLY_OK로 종료한다 — wizardPreflight가 이 모드다.)
 */
const FINAL_E2E_PREFLIGHT_APPROVAL = "APPROVE_FINAL_E2E_AUTOMATION_PUBLISH_ONE_NEW_CONTENT_UNIT";

/**
 * 절대 인자에 등장해서는 안 되는 토큰. 실행 직전 한 번 더 검사한다(이중 방어).
 */
const FORBIDDEN_ARG_TOKENS = ["--live"] as const;

/**
 * 실제 게시를 여는 유일한 인자. buildOperatorCommand의 `actualUpload` 분기에서만 생성되고,
 * runOperatorScript는 호출자가 `allowArm: true`를 명시했을 때만 이 인자를 통과시킨다.
 * (route는 Owner 확인 게이트(체크 2개 + "업로드" 입력)를 통과한 actualUpload에서만 allowArm을 준다.)
 */
const ARM_ARG_TOKEN = "--arm";

// ── 런타임 판별 ───────────────────────────────────────────────────────────────

/**
 * 로컬 dev runtime인지 판정한다. Vercel(또는 production build)에서는 로컬 `C:\tmp` 파일과
 * 로컬 스크립트를 신뢰할 수 없으므로 스크립트 실행 action을 차단한다.
 * env 값을 읽지만 credential이 아닌 플랫폼 표식만 사용하며, 값 자체를 반환하지 않는다.
 */
export function isLocalDevRuntime(): boolean {
  if (process.env.VERCEL === "1" || typeof process.env.VERCEL_ENV === "string") return false;
  return process.env.NODE_ENV !== "production";
}

/** repo root. Next.js 서버 프로세스의 cwd가 repo root다. */
export function getRepoRoot(): string {
  return process.cwd();
}

// ── secret-safe 출력 처리 ─────────────────────────────────────────────────────

/**
 * child 출력에서 secret-shaped 값을 제거한다. 스크립트들은 이미 값을 출력하지 않지만,
 * 웹으로 나가는 경로이므로 방어적으로 한 번 더 치환한다.
 */
export function sanitizeOutput(text: string): string {
  return String(text ?? "")
    .replace(/access_token=[^&\s"']+/gi, "access_token=REDACTED")
    .replace(/EAA[A-Za-z0-9]{8,}/g, "REDACTED_TOKEN")
    .replace(/ya29\.[A-Za-z0-9_-]{8,}/g, "REDACTED_TOKEN")
    .replace(/vercel_blob_rw_[A-Za-z0-9_]{8,}/g, "REDACTED_TOKEN")
    .replace(/GOCSPX-[A-Za-z0-9_-]+/g, "REDACTED_TOKEN")
    .replace(/"(client_secret|refresh_token|access_token|clientSecret|refreshToken)"\s*:\s*"[^"]*"/gi, '"$1":"REDACTED"')
    .slice(0, MAX_OUTPUT_CHARS);
}

/**
 * 스크립트 stdout에서 첫 번째 최상위 JSON 오브젝트를 뽑는다.
 * (entrypoint는 배너 텍스트 + JSON을 함께 출력하므로 그대로 JSON.parse할 수 없다.)
 */
export function extractFirstJsonObject(stdout: string): unknown | null {
  const start = stdout.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < stdout.length; i += 1) {
    const ch = stdout[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(stdout.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/**
 * final E2E runner가 `--arm` 없이 실행됐을 때 out-dir에 남기는 preflight 결과 파일명.
 * (armed 실행의 `final-e2e-publish-result.json`과 다른 파일이며, 이 helper는 armed를 실행하지 않는다.)
 */
export const FINAL_E2E_PREFLIGHT_RESULT_FILENAME = "final-e2e-publish-preflight.json";

/**
 * runner는 result를 stdout이 아니라 out-dir 파일에 쓴다(stdout에는 경로만 출력).
 * 그래서 preflight 판정을 위해 그 파일을 읽는다. 이 파일은 runner가 secret-free로 보장하며,
 * 방어적으로 sanitize를 한 번 더 통과시킨다.
 */
export function readFinalE2ePreflightResult(outDir: string): unknown | null {
  const p = join(outDir, FINAL_E2E_PREFLIGHT_RESULT_FILENAME);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(sanitizeOutput(readFileSync(p, "utf8")));
  } catch (e) {
    console.error("DEBUG finalizeTopicBatchFromSeeds catalog write failed", e);
    return null;
  }
}

// ── child env (승인된 key만) ──────────────────────────────────────────────────

/**
 * 승인된 6개 credential key의 **존재 여부만** 반환한다. 값/길이/prefix/hash 없음.
 */
export function readCredentialPresence(): Record<string, boolean> {
  const presence: Record<string, boolean> = {};
  for (const name of APPROVED_ENV_KEY_NAMES) {
    const v = process.env[name];
    presence[name] = typeof v === "string" && v !== "";
  }
  return presence;
}

/**
 * child process env를 구성한다. parent env broad spread 없이,
 * non-secret OS 변수 화이트리스트 + 승인된 credential key 6개만 개별 복사한다.
 * 값은 이 객체 안에만 존재하며 로그/반환값에 절대 넣지 않는다.
 *
 * `includeMediaEnv === true`일 때만 `MEDIA_ENV_KEY_NAMES`(ELEVENLABS 4키)를 추가 복사한다.
 * 기본값은 false — 실제 TTS 생성(realTtsCreate)과 명시 승인된 GET-only 진단 child에만 전달되고,
 * 이미지/영상/게시 전 점검/실제 업로드 등 다른 어떤 child에도 ELEVENLABS 키가 들어가지 않는다.
 */
function buildSanitizedChildEnv(opts?: {
  includeMediaEnv?: boolean;
  voiceOverride?: FinanceCharacterVoiceProfile;
}): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = Object.create(null);
  for (const name of SAFE_CHILD_OS_ENV_KEYS) {
    const v = process.env[name];
    if (typeof v === "string") env[name] = v;
  }
  for (const name of APPROVED_ENV_KEY_NAMES) {
    const v = process.env[name];
    if (typeof v === "string" && v !== "") env[name] = v;
  }
  // 실제 TTS 생성/GET-only 진단 child에만 전달하는 미디어 key. 값은 child env에만 존재한다.
  if (opts?.includeMediaEnv === true) {
    for (const name of MEDIA_ENV_KEY_NAMES) {
      const v = process.env[name];
      if (typeof v === "string" && v !== "") env[name] = v;
    }
    // 재테크는 승인된 소주제별 화자를 사용한다. .env.local의 기본 보이스는 다른 카테고리의
    // 기존 동작을 위한 fallback으로만 남고, 이 allowlisted profile이 실제 TTS child에서 이긴다.
    if (opts.voiceOverride) {
      env.ELEVENLABS_VOICE_ID = opts.voiceOverride.voiceId;
      env.ELEVENLABS_VOICE_LABEL = opts.voiceOverride.voiceLabel;
      env.ELEVENLABS_MODEL_ID = FINANCE_CHARACTER_VOICE_MODEL_ID;
    }
  }
  return env;
}

// ── 경로 검증 ────────────────────────────────────────────────────────────────

/**
 * finalE2ePreflight가 받는 3개 경로를 검증한다.
 * - 절대 경로만 허용(상대 경로/셸 메타문자 차단)
 * - 인자로 넘어갈 문자열에 `--` 접두 옵션이나 null byte가 없어야 한다
 */
export function validateOperatorPath(value: unknown, label: string): { ok: true; path: string } | { ok: false; reason: string } {
  if (typeof value !== "string" || value.trim() === "") {
    return { ok: false, reason: `${label}_missing` };
  }
  const raw = value.trim();
  if (raw.includes("\0")) return { ok: false, reason: `${label}_invalid_null_byte` };
  if (raw.startsWith("-")) return { ok: false, reason: `${label}_must_not_start_with_dash` };
  if (!isAbsolute(raw)) return { ok: false, reason: `${label}_must_be_absolute_path` };
  return { ok: true, path: raw };
}

// ── action → 명령 매핑(하드코딩) ──────────────────────────────────────────────

export type OperatorCommand = { script: string; args: string[] };

/**
 * action별 실행 명령을 만든다. 스크립트 경로와 인자는 전부 하드코딩되며,
 * 사용자 입력은 finalE2ePreflight의 3개 경로(검증 통과분)만 값으로 들어간다.
 * `--arm`은 어떤 분기에서도 추가되지 않는다.
 */
export function buildOperatorCommand(
  action: OperatorAction,
  input?: {
    contentUnitPath?: string;
    ledgerPath?: string;
    outDir?: string;
    topicId?: string;
    productionPartId?: "single" | "part-1" | "part-2";
    flowMotionJobId?: string;
    flowMotionOwnerApproval?: string;
    characterId?: FinanceCharacterId;
    regenerateCharacterCandidates?: boolean;
    regenerateScenes?: Array<{ sceneIndex: number; imageSha256: string }>;
    expectedImageSetSha256?: string;
  },
): { ok: true; command: OperatorCommand } | { ok: false; reason: string } {
  switch (action) {
    case "credentialPreflight":
      return { ok: true, command: { script: SCRIPT_ENTRYPOINT, args: ["--credential-preflight"] } };

    case "readyPreflight":
    case "readyDuplicateGuard":
      // 둘 다 default evidence content unit에 대한 no-live preflight를 읽는다.
      // (readyDuplicateGuard는 같은 결과의 duplicatePublishReference를 해석해 보여준다.)
      return { ok: true, command: { script: SCRIPT_ORCHESTRATOR, args: ["--preflight"] } };

    case "finalE2ePreflight": {
      const cu = validateOperatorPath(input?.contentUnitPath, "contentUnitPath");
      if (!cu.ok) return { ok: false, reason: cu.reason };
      const ld = validateOperatorPath(input?.ledgerPath, "ledgerPath");
      if (!ld.ok) return { ok: false, reason: ld.reason };
      const od = validateOperatorPath(input?.outDir, "outDir");
      if (!od.ok) return { ok: false, reason: od.reason };
      if (!existsSync(cu.path)) return { ok: false, reason: "contentUnitPath_not_found" };
      // --arm 없음 → runner gate 9에서 PREFLIGHT_ONLY_OK로 종료(외부 호출 0).
      return {
        ok: true,
        command: {
          script: SCRIPT_FINAL_E2E,
          args: [
            "--approval",
            FINAL_E2E_PREFLIGHT_APPROVAL,
            "--content-unit",
            cu.path,
            "--ledger",
            ld.path,
            "--out-dir",
            od.path,
          ],
        },
      };
    }

    case "voiceSample": {
      // local_mock TTS: 선택 주제의 대본으로 생성한 tts script를 입력으로 쓴다(실제 음성 아님, 외부 API 0).
      // 경로는 전부 safeSlug 기반 repo 밖 절대경로 — 사용자 입력 원문은 args에 들어가지 않는다.
      const builtVoice = buildWizardVideoInputsForTopic(input?.topicId ?? "");
      if (!builtVoice.ok) return { ok: false, reason: builtVoice.reason };
      return {
        ok: true,
        command: {
          script: SCRIPT_MOCK_TTS,
          args: [
            "--tts-script",
            builtVoice.paths.ttsScriptPath,
            "--out-dir",
            join(WIZARD_VOICE_OUT_DIR, builtVoice.paths.safeSlug),
          ],
        },
      };
    }

    case "characterCastCreate": {
      const character = financeCharacterById(input?.characterId ?? "");
      if (!character) return { ok: false, reason: "finance_character_invalid" };
      const commandArgs = [
        "--cast-data",
        join(getRepoRoot(), "lib", "finance-character-cast-data.json"),
        "--character-id",
        character.id,
        "--out-dir",
        financeCharacterOutputDir(character.id),
      ];
      if (input?.regenerateCharacterCandidates === true) commandArgs.push("--regenerate-candidates", "1,2");
      return {
        ok: true,
        command: {
          script: SCRIPT_FINANCE_CHARACTER_CAST_AUDITION,
          args: commandArgs,
        },
      };
    }

    case "videoCreate": {
      // 선택 주제(topicId)의 대본으로 topic-specific 입력 4종을 repo 밖에 생성하고,
      // 그 생성 파일로 로컬 파이프라인 dry-run을 돌린다. 고정 base-rate fixture를 쓰지 않는다.
      // topicId가 없거나 대본이 없으면 fail-closed(다른 주제로 몰래 만들지 않는다).
      const built = buildWizardVideoInputsForTopic(input?.topicId ?? "");
      if (!built.ok) return { ok: false, reason: built.reason };
      const p = built.paths;
      // 생성 경로는 전부 safeSlug 기반 repo 밖 절대경로 — 사용자 입력 원문은 args에 들어가지 않는다.
      return {
        ok: true,
        command: {
          script: SCRIPT_LOCAL_PIPELINE_DRY_RUN,
          args: [
            "--manifest",
            p.manifestPath,
            "--tts-script",
            p.ttsScriptPath,
            "--upload-metadata",
            p.uploadMetadataPath,
            "--owner-approval",
            p.ownerApprovalPath,
            "--out-root",
            p.outRoot,
          ],
        },
      };
    }

    case "wizardPreflight": {
      // 선택 주제로 만든 시안 영상 기준 게시 전 점검 — final E2E runner를 --arm 없이 실행한다.
      // runner는 gate 9에서 PREFLIGHT_ONLY_OK로 종료하며 외부 호출이 0이다.
      const builtUnit = buildWizardContentUnitForTopic(input?.topicId ?? "", input?.productionPartId);
      if (!builtUnit.ok) return { ok: false, reason: builtUnit.reason };
      return {
        ok: true,
        command: {
          script: SCRIPT_FINAL_E2E,
          args: [
            "--approval",
            FINAL_E2E_PREFLIGHT_APPROVAL,
            "--content-unit",
            builtUnit.paths.contentUnitPath,
            "--ledger",
            builtUnit.paths.ledgerPath,
            "--out-dir",
            builtUnit.paths.publishOutDir,
          ],
        },
      };
    }

    case "actualUpload": {
      // 실제 업로드 — 유일하게 ARM_ARG_TOKEN(--arm)이 붙는 분기.
      // route가 Owner 확인 게이트(체크 2개 + "업로드" 입력)를 서버에서 검증한 뒤에만 도달하고,
      // 실행은 runOperatorScript의 allowArm 게이트를 한 번 더 통과해야 한다.
      const builtUnit = buildWizardContentUnitForTopic(input?.topicId ?? "", input?.productionPartId);
      if (!builtUnit.ok) return { ok: false, reason: builtUnit.reason };
      if ((BLOCKED_PUBLISHED_CONTENT_IDS as readonly string[]).includes(builtUnit.paths.contentId)) {
        return { ok: false, reason: "content_already_published_evidence" };
      }
      // 기존 armed result가 하나라도 있으면 generic dual upload를 다시 만들지 않는다.
      // 실제 복구 실행은 별도 Owner 승인 task가 생기기 전까지 항상 수동 확인에서 멈춘다.
      const recovery = readWizardPublishRecoveryState(
        input?.topicId ?? "",
        builtUnit.paths.productionPartId,
      );
      if (recovery.state !== "not_started") {
        return {
          ok: false,
          reason:
            recovery.state === "complete"
              ? "content_already_published_evidence"
              : "publish_recovery_manual_review_required",
        };
      }
      // 게시 전 점검 통과 evidence가 같은 content unit에 대해 존재해야 한다(fail-closed).
      const pf = readWizardPublishPreflight(input?.topicId ?? "", builtUnit.paths.productionPartId);
      if (
        !pf ||
        pf.status !== "PREFLIGHT_ONLY_OK" ||
        pf.contentUnitManifestPath !== resolve(builtUnit.paths.contentUnitPath) ||
        pf.boundToCurrentArtifacts !== true ||
        pf.contentUnitSha256 !== builtUnit.paths.contentUnitSha256 ||
        pf.instagramSourceSha256 !== builtUnit.paths.finalMp4Sha256 ||
        pf.youtubeSourceSha256 !== builtUnit.paths.finalMp4Sha256 ||
        pf.publishMetadataSha256 !== builtUnit.paths.publishMetadataSha256 ||
        pf.finalVideoApprovalFingerprint !==
          builtUnit.paths.finalVideoApprovalFingerprint
      ) {
        return { ok: false, reason: "preflight_evidence_missing" };
      }
      return {
        ok: true,
        command: {
          script: SCRIPT_FINAL_E2E,
          args: [
            "--approval",
            FINAL_E2E_PREFLIGHT_APPROVAL,
            "--content-unit",
            builtUnit.paths.contentUnitPath,
            "--ledger",
            builtUnit.paths.ledgerPath,
            "--out-dir",
            builtUnit.paths.publishOutDir,
            ARM_ARG_TOKEN,
          ],
        },
      };
    }

    case "realTtsPreflight": {
      const real = buildWizardRealPipelineInputs(input?.topicId ?? "");
      if (!real.ok) return { ok: false, reason: real.reason };
      const part = input?.productionPartId
        ? real.paths.parts.find((candidate) => candidate.id === input.productionPartId)
        : real.paths.parts.length === 1 ? real.paths.parts[0] : null;
      if (!part) return { ok: false, reason: "production_part_required" };
      const voiceRoute = resolveWizardFinanceCharacterVoice(input?.topicId ?? "");
      if (!voiceRoute?.ok) return { ok: false, reason: voiceRoute?.reason ?? "finance_voice_route_required" };
      return {
        ok: true,
        command: {
          script: SCRIPT_ELEVENLABS_TTS_PREFLIGHT,
          args: [
            "--tts-script", part.realTtsScriptPath,
            "--out-dir", join(part.ttsOutDir, "approval-preflight-v3"),
            "--voice-id", voiceRoute.route.voice.voiceId,
            "--voice-label", voiceRoute.route.voice.voiceLabel,
          ],
        },
      };
    }

    case "realTtsReadonlyPreflight": {
      const topicId = input?.topicId ?? "";
      const real = buildWizardRealPipelineInputs(topicId);
      if (!real.ok) return { ok: false, reason: real.reason };
      if (real.paths.parts.length !== 2) {
        return { ok: false, reason: "readonly_tts_audit_requires_two_parts" };
      }
      const jobId = `${topicId.replace(/[^a-z0-9_-]+/gi, "-")}-two-phase-tts-v3`;
      const packetArgs = real.paths.parts.flatMap((part) => [
        "--packet",
        join(part.ttsOutDir, "approval-preflight-v3", `${jobId}.approval-packet.v3.json`),
      ]);
      return {
        ok: true,
        command: {
          script: SCRIPT_ELEVENLABS_READONLY_PREFLIGHT,
          args: packetArgs,
        },
      };
    }

    case "realTtsCreate": {
      // 확정 대본(script-final) 기반 실제 ElevenLabs TTS — 검증된 scene-paced 스크립트 재사용.
      // 대본이 확정(대본 만들기 클릭)되지 않았으면 fail-closed. --arm/upload 인자 없음.
      const real = buildWizardRealPipelineInputs(input?.topicId ?? "");
      if (!real.ok) return { ok: false, reason: real.reason };
      const part = input?.productionPartId
        ? real.paths.parts.find((candidate) => candidate.id === input.productionPartId)
        : real.paths.parts.length === 1 ? real.paths.parts[0] : null;
      if (!part) return { ok: false, reason: "production_part_required" };
      return {
        ok: true,
        command: {
          script: SCRIPT_ELEVENLABS_SCENE_TTS,
          args: ["--tts-script", part.realTtsScriptPath, "--out-dir", part.ttsOutDir],
        },
      };
    }

    case "realSceneImagesCreate":
    case "realSceneImagesRegenerateSelected": {
      // 확정 대본의 흐름 기반 동적 장면으로 실제 이미지 생성(ChatGPT+Playwright). 대본 확정 전이면 fail-closed.
      const real = buildWizardRealPipelineInputs(input?.topicId ?? "");
      if (!real.ok) return { ok: false, reason: real.reason };
      const media = readWizardRealMediaState(input?.topicId ?? "");
      if (!media.realTts.ready) return { ok: false, reason: "real_tts_required" };
      if (!media.realTts.qualityAccepted) {
        return { ok: false, reason: "real_tts_owner_approval_required" };
      }
      const characterVisualRoute = resolveWizardFinanceCharacterVisual(input?.topicId ?? "");
      if (!characterVisualRoute) return { ok: false, reason: "finance_character_reference_required" };
      if (!characterVisualRoute.ok) return { ok: false, reason: characterVisualRoute.reason };
      const part = input?.productionPartId
        ? real.paths.parts.find((candidate) => candidate.id === input.productionPartId)
        : real.paths.parts.length === 1 ? real.paths.parts[0] : null;
      if (!part) return { ok: false, reason: "production_part_required" };
      const partMedia = media.parts.find((candidate) => candidate.id === part.id);
      if (action === "realSceneImagesCreate" && partMedia?.realImages.reviewable === true) {
        return { ok: false, reason: "real_scene_images_owner_review_required" };
      }
      const commandArgs = [
        "--script",
        part.scriptFinalPath,
        "--out-dir",
        part.imagesOutDir,
        "--character-reference",
        characterVisualRoute.route.referenceImagePath,
        "--character-reference-sha256",
        characterVisualRoute.route.referenceImageSha256,
        "--character-id",
        characterVisualRoute.route.characterId,
        "--character-name",
        characterVisualRoute.route.characterName,
      ];
      if (action === "realSceneImagesRegenerateSelected") {
        const selected = input?.regenerateScenes;
        const expectedImageSetSha256 = input?.expectedImageSetSha256?.toLowerCase();
        if (
          !Array.isArray(selected) ||
          selected.length === 0 ||
          partMedia?.realImages.reviewable !== true ||
          !/^[a-f0-9]{64}$/.test(expectedImageSetSha256 ?? "") ||
          partMedia.realImages.manualVisualReview.imageSetSha256 !== expectedImageSetSha256
        ) {
          return { ok: false, reason: "selected_scene_regeneration_targets_required" };
        }
        const seen = new Set<number>();
        const normalized = selected
          .map((scene) => ({
            sceneIndex: scene?.sceneIndex,
            imageSha256: typeof scene?.imageSha256 === "string" ? scene.imageSha256.toLowerCase() : "",
          }))
          .sort((a, b) => a.sceneIndex - b.sceneIndex);
        const valid = normalized.every((scene) => {
          if (
            !Number.isInteger(scene.sceneIndex) ||
            seen.has(scene.sceneIndex) ||
            !/^[a-f0-9]{64}$/.test(scene.imageSha256)
          ) return false;
          seen.add(scene.sceneIndex);
          const current = partMedia.realImages.scenes.find((candidate) => candidate.sceneIndex === scene.sceneIndex);
          return current?.ready === true && current.imageSha256 === scene.imageSha256;
        });
        if (!valid) return { ok: false, reason: "selected_scene_regeneration_targets_stale_or_invalid" };
        commandArgs.push(
          "--regenerate-scenes",
          normalized.map((scene) => scene.sceneIndex).join(","),
          "--owner-selected-scene-bindings",
          normalized.map((scene) => `${scene.sceneIndex}:${scene.imageSha256}`).join(","),
          "--expected-image-set-sha256",
          expectedImageSetSha256!,
          "--exact-owner-selected-scenes",
          "--no-retry",
        );
      }
      return {
        ok: true,
        command: {
          script: SCRIPT_REAL_SCENE_IMAGES,
          args: commandArgs,
        },
      };
    }

    case "flowMotionGenerate": {
      const media = readWizardRealMediaState(input?.topicId ?? "");
      if (!media.realTts.qualityAccepted) {
        return { ok: false, reason: "real_tts_owner_approval_required" };
      }
      const target = resolveWizardFlowMotionJob(input?.topicId ?? "", input?.flowMotionJobId ?? "");
      if (!target.ok) return target;
      if (target.job.status !== "generating") return { ok: false, reason: "flow_motion_generation_not_authorized" };
      if (input?.flowMotionOwnerApproval !== target.job.approval.requiredWording) {
        return { ok: false, reason: "flow_motion_owner_approval_text_mismatch" };
      }
      return {
        ok: true,
        command: {
          script: SCRIPT_FLOW_MOTION_GENERATION,
          args: [
            "--generate-live",
            "--packet-path", target.job.packetPath,
            "--state-path", target.state.statePath,
            "--job-id", target.job.jobId,
            "--owner-approval", input.flowMotionOwnerApproval,
          ],
        },
      };
    }

    case "finalVideoCreate": {
      // 실제 음성·이미지와 선정된 모든 Veo 장면의 render_ready 상태가 준비된 뒤에만 합성한다.
      const real = buildWizardRealPipelineInputs(input?.topicId ?? "");
      if (!real.ok) return { ok: false, reason: real.reason };
      const media = readWizardRealMediaState(input?.topicId ?? "");
      const flowMotion = readWizardFlowMotionStatus(input?.topicId ?? "");
      const part = input?.productionPartId
        ? real.paths.parts.find((candidate) => candidate.id === input.productionPartId)
        : real.paths.parts.length === 1 ? real.paths.parts[0] : null;
      if (!part) return { ok: false, reason: "production_part_required" };
      const partMedia = media.parts.find((candidate) => candidate.id === part.id);
      if (!partMedia?.realTts.ready) return { ok: false, reason: "real_tts_required" };
      if (!media.realTts.qualityAccepted || !partMedia.realTts.qualityAccepted) {
        return { ok: false, reason: "real_tts_owner_approval_required" };
      }
      if (!partMedia.realImages.ready) return { ok: false, reason: "real_scene_images_required" };
      const partFlowMotion = flowMotion.parts.find((candidate) => candidate.id === part.id);
      if (!partFlowMotion || (partFlowMotion.requiredCount > 0 && (
        partFlowMotion.state !== "render_ready" ||
        partFlowMotion.jobs.length !== partFlowMotion.requiredCount ||
        partFlowMotion.jobs.some((job) => job.status !== "render_ready")
      ))) return { ok: false, reason: `flow_motion_render_ready_required:${part.id}` };
      return {
        ok: true,
        command: {
          script: SCRIPT_REAL_VIDEO,
          args: [
            "--script",
            part.scriptFinalPath,
            "--tts-script",
            part.realTtsScriptPath,
            "--audio-summary",
            part.ttsSummaryPath,
            "--images-dir",
            part.imagesOutDir,
            "--flow-motion-state",
            flowMotionStatePath(part),
            "--out-dir",
            part.videoOutDir,
          ],
        },
      };
    }

    case "status":
    case "topicRecommend":
    case "scriptPreview":
    case "previewStatus":
    case "realMediaStatus":
    case "automationPlan":
    case "automationAdvance":
    case "automationRecoveryResolve":
    case "automationQueueStatus":
    case "automationQueueEnqueue":
    case "automationQueueRunSelected":
    case "automationQueuePause":
    case "automationQueueResume":
    case "automationQueueRemove":
    case "automationQueueArchiveCompleted":
    case "automationQueueMovePriority":
    case "safeSessionStatus":
    case "safeSessionStart":
    case "safeSessionStop":
    case "safeSessionClose":
    case "safeSessionRecoveryResolve":
    case "safeSessionRunNext":
    case "safeSessionRunBounded":
    case "flowMotionPrepare":
    case "flowMotionQaPass":
    case "flowMotionQaFail":
    case "characterCastStatus":
    case "characterCastSelect":
      // route 내부 상태 처리 action — 외부 스크립트를 실행하지 않는다.
      return { ok: false, reason: "read_only_action_runs_no_script" };

    default:
      return { ok: false, reason: "unsupported_action" };
  }
}

// ── 실행 ─────────────────────────────────────────────────────────────────────

export type OperatorRunResult = {
  ran: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  json: unknown | null;
  timedOut: boolean;
};

/**
 * 하드코딩된 스크립트를 spawnSync로 실행한다.
 * shell:false, args 배열, timeout, cwd=repo root, sanitized child env, sanitized output.
 *
 * `--arm`(실제 게시)은 opts.allowArm === true 인 호출에서만 통과한다. route는 Owner 확인
 * 게이트를 통과한 `actualUpload`에서만 allowArm을 넘기므로, 다른 어떤 action도 실게시 인자를
 * 실행에 실어 보낼 수 없다(이중 방어).
 */
export function runOperatorScript(
  command: OperatorCommand,
  opts?: {
    allowArm?: boolean;
    timeoutMs?: number;
    /**
     * child env에 추가하는 non-secret 실행 마커(예: ALLOW_CHATGPT_IMAGE="1").
     * route가 action별로 하드코딩한 값만 넘긴다 — 사용자 입력/secret 값 금지.
     */
    extraEnv?: Record<string, string>;
    /**
     * true일 때만 ELEVENLABS 미디어 key를 child env에 전달한다(기본 false).
     * route는 실제 TTS 생성(realTtsCreate) 또는 명시 승인된 GET-only 진단에서만 true를 넘긴다.
     */
    includeMediaEnv?: boolean;
    /** 재테크 확정 캐스팅만 실제 TTS child env에 주입한다. */
    voiceOverride?: FinanceCharacterVoiceProfile;
  },
): OperatorRunResult {
  const repoRoot = getRepoRoot();
  const scriptAbs = resolve(join(repoRoot, command.script));

  // 이중 방어: 실행 직전 금지 토큰 재검사.
  for (const arg of command.args) {
    for (const forbidden of FORBIDDEN_ARG_TOKENS) {
      if (arg === forbidden) {
        return { ran: false, exitCode: null, stdout: "", stderr: `forbidden_arg:${forbidden}`, json: null, timedOut: false };
      }
    }
    if (arg === ARM_ARG_TOKEN && opts?.allowArm !== true) {
      return { ran: false, exitCode: null, stdout: "", stderr: "forbidden_arg:--arm_without_confirmation", json: null, timedOut: false };
    }
  }
  if (!existsSync(scriptAbs)) {
    return { ran: false, exitCode: null, stdout: "", stderr: "script_not_found", json: null, timedOut: false };
  }
  if (opts?.voiceOverride && opts.includeMediaEnv !== true) {
    return { ran: false, exitCode: null, stdout: "", stderr: "finance_voice_override_requires_media_env", json: null, timedOut: false };
  }
  if (opts?.voiceOverride && opts.voiceOverride.voiceStatus !== "approved") {
    return { ran: false, exitCode: null, stdout: "", stderr: "finance_voice_override_not_approved", json: null, timedOut: false };
  }

  const childEnv = buildSanitizedChildEnv({
    includeMediaEnv: opts?.includeMediaEnv === true,
    voiceOverride: opts?.voiceOverride,
  });
  for (const [k, v] of Object.entries(opts?.extraEnv ?? {})) childEnv[k] = v;

  const result = spawnSync(process.execPath, [scriptAbs, ...command.args], {
    cwd: repoRoot,
    env: childEnv,
    shell: false,
    timeout: opts?.timeoutMs ?? SPAWN_TIMEOUT_MS,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });

  const stdout = sanitizeOutput(result.stdout ?? "");
  const stderr = sanitizeOutput(result.stderr ?? "");
  return {
    ran: true,
    exitCode: typeof result.status === "number" ? result.status : null,
    stdout,
    stderr,
    json: extractFirstJsonObject(stdout),
    timedOut: result.error != null && (result.error as NodeJS.ErrnoException).code === "ETIMEDOUT",
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 자동 쇼츠 만들기 위저드 — 읽기 전용 데이터 (fixture/산출물 소비, spawn 없음)
// ══════════════════════════════════════════════════════════════════════════════

function readRepoJson(relPath: string): unknown | null {
  const p = resolve(join(getRepoRoot(), relPath));
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function readAbsJson(absPath: string): unknown | null {
  if (!existsSync(absPath)) return null;
  try {
    return JSON.parse(readFileSync(absPath, "utf8"));
  } catch {
    return null;
  }
}

function fileBytes(absPath: string): number | null {
  try {
    return existsSync(absPath) ? statSync(absPath).size : null;
  } catch {
    return null;
  }
}

export type WizardFinanceCharacterCandidate = {
  candidateNumber: number;
  ready: boolean;
  width: number | null;
  height: number | null;
  direction: string;
};

export type WizardFinanceCharacterCastState = {
  version: string;
  visualStyle: string;
  candidateCount: number;
  selectedCount: number;
  allSelected: boolean;
  characters: Array<{
    id: FinanceCharacterId;
    name: string;
    label: string;
    role: string;
    subtopics: WizardFinanceSubtopicId[];
    selectedCandidateNumber: number | null;
    candidatesReady: boolean;
    candidates: WizardFinanceCharacterCandidate[];
    blockerCode: string | null;
  }>;
};

type FinanceCharacterSelectionFile = {
  schemaVersion: "money_shorts_finance_character_selection_v1";
  castVersion: string;
  selections: Partial<Record<FinanceCharacterId, {
    candidateNumber: number;
    file: string;
    imageSha256: string;
    selectedAt: string;
  }>>;
};

function financeCharacterOutputDir(characterId: FinanceCharacterId): string {
  return join(WIZARD_CHARACTER_CAST_ROOT, characterId);
}

function financeCharacterCandidatePath(characterId: FinanceCharacterId, candidateNumber: number): string {
  return join(financeCharacterOutputDir(characterId), `candidate-${candidateNumber}.png`);
}

function fileSha256(absPath: string): string | null {
  try {
    return existsSync(absPath) ? createHash("sha256").update(readFileSync(absPath)).digest("hex") : null;
  } catch {
    return null;
  }
}

function readFinanceCharacterSelections(): FinanceCharacterSelectionFile {
  const raw = readAbsJson(WIZARD_CHARACTER_CAST_SELECTION_PATH) as Partial<FinanceCharacterSelectionFile> | null;
  return {
    schemaVersion: "money_shorts_finance_character_selection_v1",
    castVersion: FINANCE_CHARACTER_CAST_VERSION,
    selections:
      raw?.schemaVersion === "money_shorts_finance_character_selection_v1" &&
      raw.castVersion === FINANCE_CHARACTER_CAST_VERSION &&
      raw.selections && typeof raw.selections === "object"
        ? raw.selections
        : {},
  };
}

function validSelectedCandidateNumber(characterId: FinanceCharacterId): number | null {
  const selected = readFinanceCharacterSelections().selections[characterId];
  if (selected && typeof selected.candidateNumber === "number" && Number.isInteger(selected.candidateNumber)) {
    const expectedPath = financeCharacterCandidatePath(characterId, selected.candidateNumber);
    if (
      selected.candidateNumber >= 1 &&
      selected.candidateNumber <= FINANCE_CHARACTER_CANDIDATE_COUNT &&
      resolve(selected.file) === resolve(expectedPath) &&
      fileSha256(expectedPath) === selected.imageSha256
    ) return selected.candidateNumber;
  }

  if (FINANCE_CHARACTER_SELECTION_STATUS !== "owner_approved_candidate_2_fixed_v1") return null;
  const character = financeCharacterById(characterId);
  if (!character || character.selectedCandidateNumber !== 2) return null;
  const expectedPath = financeCharacterCandidatePath(characterId, character.selectedCandidateNumber);
  const summary = readAbsJson(join(financeCharacterOutputDir(characterId), "cast-audition-summary.json")) as {
    candidates?: Array<{
      candidateNumber?: number;
      file?: string;
      status?: string;
      width?: number;
      height?: number;
      imageSha256?: string;
    }>;
  } | null;
  const fixed = summary?.candidates?.find((candidate) => candidate.candidateNumber === character.selectedCandidateNumber);
  if (
    fixed?.status !== "SAVED_OK" ||
    resolve(fixed.file ?? "") !== resolve(expectedPath) ||
    typeof fixed.imageSha256 !== "string" ||
    fileSha256(expectedPath) !== fixed.imageSha256 ||
    typeof fixed.width !== "number" || fixed.width < 900 ||
    typeof fixed.height !== "number" || fixed.height < 1600
  ) return null;
  return character.selectedCandidateNumber;
}

export function readWizardFinanceCharacterCastState(): WizardFinanceCharacterCastState {
  const ownerFixedCandidateTwo = FINANCE_CHARACTER_SELECTION_STATUS === "owner_approved_candidate_2_fixed_v1";
  const characters = FINANCE_CHARACTER_CAST.map((character) => {
    const summary = readAbsJson(join(financeCharacterOutputDir(character.id), "cast-audition-summary.json")) as {
      castVersion?: string;
      allReady?: boolean;
      blockerCode?: string | null;
      candidates?: Array<{
        candidateNumber?: number;
        direction?: string;
        file?: string;
        status?: string;
        width?: number | null;
        height?: number | null;
        imageSha256?: string;
      }>;
    } | null;
    const candidates = Array.from({ length: FINANCE_CHARACTER_CANDIDATE_COUNT }, (_, index) => {
      const candidateNumber = index + 1;
      const expectedPath = financeCharacterCandidatePath(character.id, candidateNumber);
      const row = summary?.candidates?.find((candidate) => candidate.candidateNumber === candidateNumber);
      const ownerFixedCandidate = ownerFixedCandidateTwo && candidateNumber === character.selectedCandidateNumber;
      const ready =
        (summary?.castVersion === FINANCE_CHARACTER_CAST_VERSION || ownerFixedCandidate) &&
        row?.status === "SAVED_OK" &&
        resolve(row.file ?? "") === resolve(expectedPath) &&
        typeof row.imageSha256 === "string" &&
        fileSha256(expectedPath) === row.imageSha256 &&
        (!ownerFixedCandidate || (
          typeof row.width === "number" && row.width >= 900 &&
          typeof row.height === "number" && row.height >= 1600
        ));
      return {
        candidateNumber,
        ready,
        width: typeof row?.width === "number" ? row.width : null,
        height: typeof row?.height === "number" ? row.height : null,
        direction: character.candidateDirections[index] ?? `후보 ${candidateNumber}`,
      };
    });
    const fixedSelectedCandidate = ownerFixedCandidateTwo
      ? candidates.find((candidate) => candidate.candidateNumber === character.selectedCandidateNumber && candidate.ready)
      : null;
    return {
      id: character.id,
      name: character.name,
      label: character.label,
      role: character.role,
      subtopics: [...character.subtopics],
      selectedCandidateNumber: fixedSelectedCandidate?.candidateNumber ?? validSelectedCandidateNumber(character.id),
      candidatesReady: ownerFixedCandidateTwo
        ? fixedSelectedCandidate != null
        : summary?.allReady === true && candidates.every((candidate) => candidate.ready),
      candidates,
      blockerCode: typeof summary?.blockerCode === "string" ? summary.blockerCode : null,
    };
  });
  const selectedCount = characters.filter((character) => character.selectedCandidateNumber !== null).length;
  return {
    version: FINANCE_CHARACTER_CAST_VERSION,
    visualStyle: FINANCE_CHARACTER_VISUAL_STYLE,
    candidateCount: FINANCE_CHARACTER_CANDIDATE_COUNT,
    selectedCount,
    allSelected: selectedCount === FINANCE_CHARACTER_IDS.length,
    characters,
  };
}

export function saveWizardFinanceCharacterSelection(
  characterId: string,
  candidateNumber: number,
): { ok: true; state: WizardFinanceCharacterCastState } | { ok: false; reason: string } {
  const character = financeCharacterById(characterId);
  if (!character) return { ok: false, reason: "finance_character_invalid" };
  if (!Number.isInteger(candidateNumber) || candidateNumber < 1 || candidateNumber > FINANCE_CHARACTER_CANDIDATE_COUNT) {
    return { ok: false, reason: "finance_character_candidate_invalid" };
  }
  const state = readWizardFinanceCharacterCastState();
  const candidate = state.characters
    .find((item) => item.id === character.id)
    ?.candidates.find((item) => item.candidateNumber === candidateNumber);
  if (!candidate?.ready) return { ok: false, reason: "finance_character_candidate_not_ready" };
  const file = financeCharacterCandidatePath(character.id, candidateNumber);
  const imageSha256 = fileSha256(file);
  if (!imageSha256) return { ok: false, reason: "finance_character_candidate_file_missing" };
  const selection = readFinanceCharacterSelections();
  selection.selections[character.id] = {
    candidateNumber,
    file,
    imageSha256,
    selectedAt: new Date().toISOString(),
  };
  mkdirSync(dirname(WIZARD_CHARACTER_CAST_SELECTION_PATH), { recursive: true });
  const tempPath = `${WIZARD_CHARACTER_CAST_SELECTION_PATH}.tmp`;
  writeFileSync(tempPath, JSON.stringify(selection, null, 2), "utf8");
  renameSync(tempPath, WIZARD_CHARACTER_CAST_SELECTION_PATH);
  return { ok: true, state: readWizardFinanceCharacterCastState() };
}

export function readWizardFinanceCharacterImageBytes(
  characterId: string | null,
  candidateNumber: number | null,
): { bytes: Buffer; contentType: string } | null {
  const character = characterId ? financeCharacterById(characterId) : null;
  if (!character || candidateNumber === null || !Number.isInteger(candidateNumber)) return null;
  if (candidateNumber < 1 || candidateNumber > FINANCE_CHARACTER_CANDIDATE_COUNT) return null;
  const state = readWizardFinanceCharacterCastState();
  const ready = state.characters
    .find((item) => item.id === character.id)
    ?.candidates.find((item) => item.candidateNumber === candidateNumber)?.ready === true;
  if (!ready) return null;
  const bytes = readFileSync(financeCharacterCandidatePath(character.id, candidateNumber));
  const contentType = bytes[0] === 0xff && bytes[1] === 0xd8
    ? "image/jpeg"
    : bytes.slice(0, 4).toString("ascii") === "RIFF"
      ? "image/webp"
      : "image/png";
  return { bytes, contentType };
}

export type WizardTopic = {
  topicId: string;
  title: string;
  hook: string;
  reason: string;
  /** true면 규칙 기반 대본 엔진 결과가 이미 로컬에 있다(대본 만들기 즉시 가능). */
  scriptReady: boolean;
  recommended: boolean;
  /** 생성 주제의 카테고리 id(8개 중 하나). fixture 유래 주제는 없을 수 있다. */
  category?: string;
  /** 생성 주제의 훅 유형(반전/숫자/실수/루틴/심리/꿀팁). */
  angle?: string;
  /** 로컬 품질 평가 종합 점수(0~100). 품질 필터를 통과한 후보만 화면에 온다. */
  qualityScore?: number;
  /** 재작성으로 고친 부분(있으면 "다듬음" 배지 표시용). */
  rewrittenReasons?: string[];
  /** 추천 출처: claude_generated면 매번 신규 생성, local_bank면 백업 주제은행. */
  source?: "editorial_bank" | "claude_generated" | "local_bank" | "fixture";
  /** 이미 본/선택/제작한 주제와 얼마나 떨어져 있는지에 대한 간단한 설명. */
  noveltyNote?: string;
  /** 재테크팁 내부 소분야. */
  financeSubtopic?: WizardFinanceSubtopicId;
  /** 제목만 평가하지 않도록 함께 보여주는 편집 패키지. */
  problemStatement?: string;
  twist?: string;
  takeawayAction?: string;
  /** 이 후보에 저장된 Owner 판정. */
  editorialDecision?: WizardEditorialDecision | null;
  /** true면 Owner가 만든다로 승인하기 전 대본 단계에 진입할 수 없다. */
  requiresEditorialDecision?: boolean;
  /** 한 추천 묶음에서 같은 느낌이 겹치지 않게 하는 9개 편집 유형. */
  editorialLane?: FinanceEditorialLane;
};

/**
 * 주제 추천 카탈로그. 두 로컬 소스를 합친다(모두 repo fixture, 읽기 전용):
 * 1) 규칙 기반 대본 컴파일러 output — 대본까지 이미 준비된 주제
 * 2) topic candidate report — 검증된 주제 후보 풀(대본 엔진 연결 전)
 */
export function readTopicCatalog(): WizardTopic[] | null {
  const compiled = readRepoJson(FIXTURE_SCRIPT_COMPILER_OUTPUT) as {
    topics?: Array<{
      topicId?: string;
      selectedCandidateId?: string;
      candidates?: Array<{
        candidateId?: string;
        selectedHookText?: string;
        script?: { topic?: string; angle?: string };
      }>;
    }>;
  } | null;
  const report = readRepoJson(FIXTURE_TOPIC_REPORT) as {
    candidates?: Array<{
      topic_id?: string;
      title?: string;
      core_hook?: string;
      why_people_care?: string;
    }>;
    recommended?: Array<{ topic_id?: string }>;
  } | null;

  if (!compiled && !report) return null;

  const topics: WizardTopic[] = [];

  for (const t of compiled?.topics ?? []) {
    const cand = (t.candidates ?? []).find((c) => c.candidateId === t.selectedCandidateId) ?? (t.candidates ?? [])[0];
    if (!t.topicId || !cand?.script?.topic) continue;
    topics.push({
      topicId: t.topicId,
      title: cand.script.topic,
      hook: cand.selectedHookText ?? "",
      reason: cand.script.angle ?? "",
      scriptReady: true,
      recommended: false,
    });
  }

  const recommendedIds = new Set((report?.recommended ?? []).map((r) => r.topic_id).filter(Boolean));
  for (const c of report?.candidates ?? []) {
    if (!c.topic_id || !c.title) continue;
    topics.push({
      topicId: c.topic_id,
      title: c.title,
      hook: c.core_hook ?? "",
      reason: c.why_people_care ?? "",
      scriptReady: false,
      recommended: recommendedIds.has(c.topic_id),
    });
  }

  return topics.length > 0 ? topics : null;
}

// ══════════════════════════════════════════════════════════════════════════════
// 새 주제 추천 — 로컬 topic bank 기반 생성 (외부 API 0, 클릭마다 새 묶음)
// task: owner-web-auto-topic-refresh-and-upload-button-v1
// ══════════════════════════════════════════════════════════════════════════════

/** 재테크 V1 active 위저드 카테고리 id. */
export const WIZARD_CATEGORY_IDS = ["finance"] as const;
export type WizardCategoryId = (typeof WIZARD_CATEGORY_IDS)[number];

// Legacy category labels/seeds are retained below until a separate dependency audit.
// They are not reachable from the finance-only active enum above.
const CATEGORY_LABELS: Record<string, string> = {
  finance: "재테크팁",
  ai: "AI생성활용",
  meme: "밈&짤",
  news: "충격뉴스",
  tmi: "TMI지식",
  game: "게임클립",
  animal: "귀여운동물",
  celeb: "셀럽엔터",
};

export const WIZARD_FINANCE_SUBTOPIC_IDS = [
  "economy_literacy",
  "inflation_living_cost",
  "interest_debt",
  "consumption_psychology",
  "sns_comparison",
  "labor_income",
  "investing_assets",
  "housing_asset_gap",
  "anxiety_avoidance",
  "success_habits",
  "crisis_risk",
  "time_retirement",
] as const;

export type WizardFinanceSubtopicId = (typeof WIZARD_FINANCE_SUBTOPIC_IDS)[number];

const FINANCE_SUBTOPIC_LABELS: Record<WizardFinanceSubtopicId, string> = {
  economy_literacy: "경제뉴스·돈공부",
  inflation_living_cost: "물가·생활비",
  interest_debt: "금리·빚",
  consumption_psychology: "소비심리",
  sns_comparison: "SNS비교",
  labor_income: "월급·소득",
  investing_assets: "투자·자산",
  housing_asset_gap: "집값·주거비",
  anxiety_avoidance: "불안·회피",
  success_habits: "성공습관",
  crisis_risk: "위기·비상금",
  time_retirement: "시간·노후",
};

type WizardTopicAngle = "반전" | "숫자" | "실수" | "루틴" | "심리" | "꿀팁";

/**
 * topic bank의 씨앗 1개 — 대본 생성에 필요한 구조를 전부 갖는다.
 *
 * 프리미엄(돈·심리) 씨앗 계약: finance 씨앗은 아래 선택 필드를 전부 채운다.
 * - empathy      : 보편적인 상황 한 문장(씬 2). 대본 흐름 = 문제 훅→상황→손해→심리→행동→실천→추천.
 * - points       : [심리 원인, 반전 문장, 행동 전환] 순서 고정(씬 3~5).
 * - angleNote    : 돈+심리+행동 구조가 드러나는 한 줄 설명(UI 추천 이유로 노출).
 * - moneyAnchor / psychologyAnchor / successAnchor : 주제의 3축 라벨.
 * - visualMetaphor: 영상화 가능한 장면 한 컷.
 * 자막 계약: hook/empathy/points/save는 trimWizardCaption(34자)에 잘리지 않게 간결하게 쓴다.
 */
type WizardTopicSeed = {
  slug: string; // [a-z0-9-]만. topicId = gen-<category>-<slug>
  title: string;
  hook: string;
  angle: WizardTopicAngle;
  points: [string, string, string];
  save: string; // 저장/행동 유도 문구 — 행동 시점(다음 월급날/결제 전/오늘 밤 등) 포함
  empathy?: string;
  angleNote?: string;
  moneyAnchor?: string;
  psychologyAnchor?: string;
  successAnchor?: string;
  visualMetaphor?: string;
  financeSubtopic?: WizardFinanceSubtopicId;
  /** 같은 경제 메커니즘의 제목 변형이 한 추천 묶음에 겹치지 않게 하는 family id. */
  curiosityMechanismId?: string;
  /** 새 편집 엔진의 제목-문제-반전-행동 패키지. */
  problemStatement?: string;
  twist?: string;
  takeawayAction?: string;
  editorialLane?: FinanceEditorialLane;
};

/**
 * 로컬 topic bank — 재테크는 별도 500개 편집 은행을 쓰고, 여기에는 나머지 7개 카테고리 씨앗만 둔다.
 * 특정 인물/사건/검증 불가한 수치 주장 없이 evergreen 주제만 담는다.
 * 이미 게시된 t1_lifestyle_inflation / t2_salary_3days / base-rate 계열은 넣지 않는다.
 */
const TOPIC_BANK: Record<string, WizardTopicSeed[]> = {
  finance: [],
  ai: [
    { slug: "ai-daily-brief", title: "AI로 아침 브리핑 만드는 법", hook: "출근길 5분을 비서로 바꿔보세요", angle: "꿀팁", points: ["관심 주제 목록 미리 만들기", "매일 같은 질문 틀 재사용하기", "요약은 세 줄로 제한하기"], save: "브리핑 질문 틀을 저장해 두세요" },
    { slug: "ai-photo-fix", title: "흔들린 사진, 지우기 전에 할 일", hook: "지우지 말고 살려 보세요", angle: "꿀팁", points: ["밝기와 노이즈 자동 보정 쓰기", "배경 지우개로 잡티 정리하기", "원본은 항상 따로 남기기"], save: "사진 정리 전에 한 번 시도해 보세요" },
    { slug: "ai-study-partner", title: "AI에게 설명시키면 공부가 빨라진다", hook: "읽지 말고 물어보세요", angle: "심리", points: ["모르는 부분만 콕 집어 묻기", "예시를 두 개씩 요청하기", "마지막엔 스스로 요약하기"], save: "공부할 때 쓰는 질문법으로 저장하세요" },
    { slug: "ai-writing-draft", title: "빈 화면 공포 없애는 AI 초안법", hook: "처음부터 잘 쓰려니 안 써집니다", angle: "실수", points: ["일단 AI에게 초안 시키기", "내 말투로 고치며 다듬기", "사실 확인은 직접 하기"], save: "글 쓸 일 있을 때 꺼내 보세요" },
    { slug: "ai-travel-plan", title: "여행 계획, AI로 반나절 만에", hook: "계획 짜다 지치는 사람 주목", angle: "꿀팁", points: ["날짜와 예산 먼저 알려주기", "동선 기준으로 일정 요청하기", "예약 전 운영시간 직접 확인하기"], save: "여행 전 체크리스트로 저장해 두세요" },
    { slug: "ai-prompt-3parts", title: "AI 답이 달라지는 질문 공식", hook: "질문만 바꿔도 답이 달라집니다", angle: "숫자", points: ["역할·상황·형식 세 가지 주기", "원하는 예시 하나 보여주기", "부족하면 이어서 좁혀 묻기"], save: "질문 공식 세 가지를 저장해 두세요" },
    { slug: "ai-meeting-notes", title: "회의록 정리, AI에게 맡기는 법", hook: "회의 끝나고 30분 아껴 보세요", angle: "꿀팁", points: ["메모를 넣어 요약 요청하기", "결정사항과 할 일 분리 요청하기", "이름과 숫자는 직접 재확인하기"], save: "다음 회의 때 바로 써먹게 저장하세요" },
    { slug: "ai-recipe-fridge", title: "냉장고 재료로 저녁 메뉴 뽑기", hook: "오늘 뭐 먹지, 고민 끝내는 법", angle: "꿀팁", points: ["남은 재료 그대로 나열하기", "조리시간 상한 정해 주기", "없는 재료 대체안 물어보기"], save: "저녁 고민될 때 꺼내 쓰세요" },
    { slug: "ai-english-tutor", title: "AI랑 영어 말하기 연습하는 법", hook: "학원 없이도 말문이 트입니다", angle: "루틴", points: ["상황극 파트너로 설정하기", "내 문장 교정 요청하기", "같은 상황 반복해 익히기"], save: "영어 연습 루틴으로 저장해 두세요" },
    { slug: "ai-fact-check", title: "AI 답변, 그대로 믿으면 안 되는 이유", hook: "그럴듯한 말과 사실은 다릅니다", angle: "실수", points: ["출처를 함께 요청하기", "숫자와 날짜는 따로 검색하기", "중요한 결정엔 원문 확인하기"], save: "AI 쓸 때 기본 습관으로 저장하세요" },
    { slug: "ai-side-content", title: "AI로 콘텐츠 초안 뽑는 순서", hook: "혼자서도 팀처럼 만들 수 있어요", angle: "꿀팁", points: ["주제 후보 여러 개 뽑기", "고른 주제로 개요 짜기", "초안은 내 경험으로 채우기"], save: "콘텐츠 만들 때 순서대로 따라 해보세요" },
    { slug: "ai-voice-memo", title: "말로 남기고 글로 받는 메모법", hook: "타이핑보다 말이 빠릅니다", angle: "루틴", points: ["이동 중엔 음성 메모로 남기기", "AI로 문장 정리 시키기", "할 일만 골라 목록화하기"], save: "메모 습관 바꾸고 싶다면 저장하세요" },
  ],
  meme: [
    { slug: "meme-timing", title: "밈은 타이밍이 90%인 이유", hook: "늦은 밈은 아재 개그가 됩니다", angle: "심리", points: ["유행 초입에 빠르게 올라타기", "한 김 식으면 비틀어 쓰기", "우리끼리 맥락을 입혀 쓰기"], save: "밈 타이밍 감 잡을 때 참고하세요" },
    { slug: "reaction-folder", title: "반응 짤 폴더 정리법", hook: "필요한 짤은 항상 안 보입니다", angle: "꿀팁", points: ["감정별 폴더로 나누기", "자주 쓰는 짤 즐겨찾기", "한 달에 한 번 비우기"], save: "짤 부자 되고 싶다면 저장하세요" },
    { slug: "group-chat-meme", title: "단톡방 분위기 살리는 짤 사용법", hook: "같은 짤도 넣는 순간이 다릅니다", angle: "꿀팁", points: ["대화 흐름 끊지 않게 쓰기", "설명이 필요한 짤은 피하기", "상대가 웃을 짤인지 먼저 생각하기"], save: "단톡방 필수 매너로 저장해 두세요" },
    { slug: "make-own-meme", title: "내 사진으로 밈 만드는 법", hook: "저작권 걱정 없는 재료는 내 사진", angle: "꿀팁", points: ["표정이 살아있는 컷 고르기", "글씨는 크고 짧게 얹기", "반복해서 쓸 포맷 만들기"], save: "밈 만들기 도전할 때 참고하세요" },
    { slug: "meme-caption", title: "짤에 얹는 한 줄 뽑는 법", hook: "같은 짤도 문구가 반을 먹습니다", angle: "꿀팁", points: ["상황을 한 줄로 압축하기", "말줄임표로 여운 주기", "과한 설명은 빼기"], save: "문구 고민될 때 꺼내 보세요" },
    { slug: "meme-copyright", title: "짤 쓰다 곤란해지는 경우", hook: "그 짤, 아무 데나 쓰면 안 됩니다", angle: "실수", points: ["상업 계정은 권리 확인하기", "연예인 짤은 특히 조심하기", "무료 소스나 내 촬영분 쓰기"], save: "계정 운영자라면 꼭 저장하세요" },
    { slug: "inside-joke", title: "우리끼리 밈 만드는 법", hook: "아는 사람만 웃는 밈이 제일 셉니다", angle: "심리", points: ["반복되는 상황 포착하기", "별명과 유행어로 굳히기", "기념일마다 다시 소환하기"], save: "모임 분위기 메이커라면 저장하세요" },
    { slug: "meme-format-swap", title: "유행 포맷 비틀어 쓰는 법", hook: "그대로 따라 하면 반만 웃깁니다", angle: "꿀팁", points: ["포맷 구조만 빌려오기", "소재는 내 일상에서 찾기", "예상을 한 번 배반하기"], save: "포맷 활용법으로 저장해 두세요" },
    { slug: "gif-vs-still", title: "움짤과 정지짤, 언제 뭘 쓸까", hook: "타이밍 개그는 움짤이 이깁니다", angle: "꿀팁", points: ["리액션은 움짤로 크게", "정보 전달은 정지짤로", "용량 큰 방에선 정지짤 배려"], save: "짤 고를 때 기준으로 저장하세요" },
    { slug: "meme-archive", title: "레전드 짤 잃어버리지 않는 법", hook: "그 짤 어디 갔지, 그만 겪으세요", angle: "루틴", points: ["클라우드에 짤 백업하기", "키워드로 파일명 바꾸기", "베스트만 따로 모으기"], save: "짤 관리 루틴으로 저장해 두세요" },
    { slug: "text-meme", title: "글자만으로 웃기는 법", hook: "이미지 없어도 밈이 됩니다", angle: "꿀팁", points: ["리듬감 있게 끊어 쓰기", "기대를 살짝 배반하기", "유행어는 한 번만 쓰기"], save: "드립 실력 늘리고 싶다면 저장하세요" },
    { slug: "meme-manner", title: "밈으로 상처 주지 않는 선", hook: "웃자고 한 말에 정색하게 만들지 마세요", angle: "꿀팁", points: ["특정인 비하 밈 거르기", "단톡방 성격에 맞춰 쓰기", "애매하면 안 보내기"], save: "밈 매너 기준으로 저장해 두세요" },
  ],
  news: [
    { slug: "headline-trap", title: "제목만 보고 믿으면 안 되는 이유", hook: "충격적인 제목일수록 의심하세요", angle: "실수", points: ["본문 끝까지 읽고 판단하기", "날짜부터 확인하기", "다른 매체와 교차 확인하기"], save: "뉴스 볼 때 기본 습관으로 저장하세요" },
    { slug: "old-news-recycle", title: "몇 년 전 뉴스가 오늘 또 도는 이유", hook: "그 소식, 사실 재탕일 수 있어요", angle: "반전", points: ["작성일과 수정일 확인하기", "이미지 원본 검색해 보기", "공식 발표 찾아보기"], save: "속지 않는 법으로 저장해 두세요" },
    { slug: "stat-misread", title: "숫자 기사에 속지 않는 법", hook: "퍼센트는 거짓말을 잘합니다", angle: "숫자", points: ["기준이 되는 모수 확인하기", "비교 대상이 뭔지 보기", "극단 사례 일반화 조심하기"], save: "숫자 기사 볼 때 꺼내 보세요" },
    { slug: "viral-rumor", title: "떠도는 소문 30초 검증법", hook: "퍼나르기 전에 딱 30초만", angle: "꿀팁", points: ["최초 출처 찾아보기", "공식 계정 발표 확인하기", "확실할 때만 공유하기"], save: "가족 단톡방 지킴이로 저장하세요" },
    { slug: "clickbait-words", title: "낚시 기사 거르는 단어들", hook: "이 단어가 나오면 일단 멈추세요", angle: "꿀팁", points: ["충격·경악은 감정 유도 신호", "알고 보니는 재구성 신호", "따옴표 제목은 발언 확인하기"], save: "기사 거를 때 기준으로 저장하세요" },
    { slug: "photo-context", title: "사진 한 장이 만드는 오해", hook: "사진은 진짜, 설명이 가짜일 때", angle: "반전", points: ["촬영 시점과 장소 확인하기", "잘린 부분 상상해 보기", "원본 맥락 검색하기"], save: "이미지 검증법으로 저장해 두세요" },
    { slug: "expert-quote", title: "전문가 인용 기사 읽는 법", hook: "전문가에 따르면, 을 조심하세요", angle: "꿀팁", points: ["실명과 소속 있는지 보기", "발언 전체 맥락 찾기", "반대 의견도 검색해 보기"], save: "균형 잡힌 뉴스 읽기로 저장하세요" },
    { slug: "algorithm-bubble", title: "내 뉴스만 다른 이유", hook: "우리는 같은 세상을 다르게 봅니다", angle: "심리", points: ["추천 피드 밖 뉴스도 보기", "다른 성향 매체 하나 구독하기", "제목만 소비하지 않기"], save: "정보 편식 막는 법으로 저장하세요" },
    { slug: "breaking-news-wait", title: "속보일수록 기다려야 하는 이유", hook: "첫 보도는 자주 틀립니다", angle: "반전", points: ["속보는 확정이 아님 기억하기", "몇 시간 뒤 후속 보도 보기", "정정 보도 확인하는 습관 갖기"], save: "큰 소식일수록 침착하게, 저장하세요" },
    { slug: "money-news-read", title: "경제 뉴스에서 진짜 봐야 할 것", hook: "무서운 경제 기사, 핵심은 따로 있어요", angle: "꿀팁", points: ["나에게 닿는 영향부터 보기", "일회성인지 추세인지 구분하기", "공포 문장보다 수치 보기"], save: "경제 뉴스 읽는 법으로 저장하세요" },
    { slug: "sns-source", title: "SNS발 소식이 빠른 대신 잃는 것", hook: "빠른 만큼 틀릴 확률도 큽니다", angle: "실수", points: ["원본 계정 신뢰도 보기", "캡처는 조작 가능성 기억하기", "언론 보도로 재확인하기"], save: "SNS 소식 접할 때 저장해 두세요" },
    { slug: "fact-vs-opinion", title: "사실과 의견 구분하는 연습", hook: "기사에도 의견이 섞여 있습니다", angle: "꿀팁", points: ["확인 가능한 문장 찾기", "형용사 많은 문단 의심하기", "내 결론은 사실 위에 세우기"], save: "미디어 읽기 기본기로 저장하세요" },
  ],
  tmi: [
    { slug: "why-earworm", title: "노래가 머릿속에서 안 나가는 이유", hook: "그 노래, 왜 하루 종일 맴돌까요", angle: "심리", points: ["뇌는 끝나지 않은 걸 붙잡는 편", "끝까지 들으면 멈추기도 함", "다른 몰입 활동으로 덮기"], save: "궁금증 해소용으로 저장해 두세요" },
    { slug: "why-yawn-spread", title: "하품은 왜 옮을까", hook: "옆 사람 하품에 나도 모르게", angle: "심리", points: ["공감 반응과 관련이 깊다고 알려짐", "가까운 사이일수록 잘 옮음", "피곤 신호일 수 있으니 휴식하기"], save: "재밌는 상식으로 저장해 두세요" },
    { slug: "fridge-door-open", title: "냉장고 문 자주 열면 생기는 일", hook: "문 여는 순간 전기가 샙니다", angle: "꿀팁", points: ["찬 공기가 빠지며 재냉각 시작", "자주 여닫을수록 부담 커짐", "꺼낼 것 정하고 한 번에 열기"], save: "전기 아끼는 습관으로 저장하세요" },
    { slug: "battery-heat-myth", title: "배터리, 충전보다 열이 문제", hook: "밤새 충전이 습관이라면 잠깐", angle: "반전", points: ["요즘 기기는 보호 회로가 기본", "높은 온도가 더 해로운 편", "케이스 벗겨 열 식히며 충전하기"], save: "배터리 오래 쓰는 팁으로 저장하세요" },
    { slug: "why-time-flies", title: "나이 들수록 시간이 빨라지는 느낌", hook: "어릴 때 여름방학은 길었는데", angle: "심리", points: ["새로운 경험이 시간을 늘림", "반복 일상은 기억이 압축됨", "작은 새 경험 자주 만들기"], save: "시간 늦추는 법으로 저장해 두세요" },
    { slug: "shower-ideas", title: "샤워할 때 아이디어가 떠오르는 이유", hook: "좋은 생각은 왜 꼭 샤워 중일까", angle: "심리", points: ["긴장이 풀리면 발상이 자유로움", "딴생각이 연결을 만들어 냄", "떠오르면 바로 메모하기"], save: "아이디어 잡는 법으로 저장하세요" },
    { slug: "sleep-rhythm", title: "같은 7시간인데 개운함이 다른 이유", hook: "잠은 양보다 리듬입니다", angle: "반전", points: ["초반 깊은 잠 비중이 큰 편", "취침 시간 일정하게 맞추기", "자기 전 화면 밝기 줄이기"], save: "꿀잠 루틴으로 저장해 두세요" },
    { slug: "why-rain-smell", title: "비 오기 전 흙냄새의 정체", hook: "비 냄새는 사실 땅의 냄새입니다", angle: "꿀팁", points: ["마른 땅이 젖으며 향이 올라옴", "흙 속 미생물 향이 주인공", "비 오는 날 산책에서 느껴보기"], save: "산책이 좋아지는 상식으로 저장하세요" },
    { slug: "hiccup-stop", title: "딸꾹질이 갑자기 멈추는 이유", hook: "놀라면 멈춘다는 말, 근거 있을까", angle: "꿀팁", points: ["호흡 리듬이 바뀌면 멈추기도 함", "숨 참기와 찬물이 흔한 방법", "오래 계속되면 진료 받기"], save: "딸꾹질 날 때 꺼내 보세요" },
    { slug: "left-hand-world", title: "왼손잡이가 불편한 세상인 이유", hook: "가위질 어려운 건 당신 탓이 아니에요", angle: "반전", points: ["도구 다수가 오른손 기준 설계", "양손 연습은 좋은 두뇌 자극", "왼손잡이용 도구도 찾아보기"], save: "몰랐던 배려 포인트로 저장하세요" },
    { slug: "goosebumps-why", title: "소름은 왜 돋을까", hook: "감동해도 추워도 같은 소름", angle: "심리", points: ["털 세우던 반응의 흔적으로 알려짐", "감정 자극에도 같은 회로 작동", "음악 소름은 몰입의 신호"], save: "재밌는 몸 상식으로 저장하세요" },
    { slug: "doorway-effect", title: "방에 들어가면 할 일을 까먹는 이유", hook: "문을 지나는 순간 리셋됩니다", angle: "심리", points: ["공간이 바뀌면 기억 맥락 전환", "이동 전 한 번 소리 내 말하기", "메모가 가장 확실한 보험"], save: "건망증 대처법으로 저장해 두세요" },
  ],
  game: [
    { slug: "clip-hotkey", title: "인생샷 클립, 단축키가 만든다", hook: "명장면은 예고 없이 옵니다", angle: "꿀팁", points: ["클립 저장 단축키 미리 설정", "최근 구간 저장 기능 켜두기", "저장 후 바로 이름 붙이기"], save: "클립 놓치기 싫다면 저장하세요" },
    { slug: "clip-edit-15s", title: "게임 클립 15초 편집 공식", hook: "하이라이트는 앞에 나와야 합니다", angle: "숫자", points: ["결정 장면을 첫 3초에 배치", "전후 맥락은 한 컷만", "자막은 짧게 상황 설명"], save: "클립 편집할 때 공식으로 저장하세요" },
    { slug: "tilt-control", title: "연패 중 멘탈 지키는 법", hook: "오늘따라 안 풀리는 날, 있죠", angle: "심리", points: ["세 판 지면 자리에서 일어나기", "리플레이로 내 실수 하나만 찾기", "피곤할 땐 랭크 대신 일반전"], save: "멘탈 흔들릴 때 꺼내 보세요" },
    { slug: "squad-comm", title: "팀게임 소통, 이것만 지켜도 이깁니다", hook: "정보만 말해도 절반은 캐리입니다", angle: "꿀팁", points: ["감정 빼고 위치와 상황만 말하기", "죽고 나서 훈수 두지 않기", "잘한 플레이는 크게 칭찬하기"], save: "팀운 올리는 법으로 저장하세요" },
    { slug: "new-game-learn", title: "새 게임 빨리 느는 법", hook: "튜토리얼만 믿으면 늦습니다", angle: "꿀팁", points: ["기본 조작을 몸에 먼저 익히기", "한 캐릭터, 한 무기만 파기", "고수 플레이 하나만 따라 하기"], save: "입문할 때 로드맵으로 저장하세요" },
    { slug: "play-time-box", title: "한 판만이 세 시간 되는 이유", hook: "시간 순삭에는 구조가 있습니다", angle: "루틴", points: ["시작 전 끝낼 시간 정하기", "판 수로 약속하지 않기", "알람에 다음 일정 이름 붙이기"], save: "겜생 균형 지키는 법으로 저장하세요" },
    { slug: "replay-review", title: "리플레이 복기, 프로만 하는 게 아니다", hook: "같은 실수를 반복하는 이유", angle: "꿀팁", points: ["진 판 딱 하나만 다시 보기", "내 시점 말고 상대 시점 보기", "고칠 점은 한 번에 하나만"], save: "실력 정체기라면 저장하세요" },
    { slug: "gear-budget", title: "장비 욕심, 어디까지가 실속일까", hook: "장비 탓은 반은 맞고 반은 틀립니다", angle: "반전", points: ["반응 체감 큰 장비부터 보기", "모니터와 마우스가 체감 큰 편", "세일 시즌에 갈아타기"], save: "장비 지름 전에 꺼내 보세요" },
    { slug: "clip-share-manner", title: "클립 공유 매너", hook: "내 캐리 영상이 남의 흑역사일 수도", angle: "실수", points: ["팀원 닉네임 가리기", "비하 자막 넣지 않기", "상대 조롱 클립은 올리지 않기"], save: "클립 올리기 전에 확인하세요" },
    { slug: "warmup-routine", title: "랭크 전 10분 워밍업", hook: "첫 판을 연습판으로 쓰지 마세요", angle: "루틴", points: ["조준·조작 연습 모드 5분", "가볍게 일반전 한 판", "컨디션 확인 후 랭크 시작"], save: "랭크 루틴으로 저장해 두세요" },
    { slug: "story-game-slow", title: "스토리 게임은 천천히가 이득", hook: "스킵하면 재미도 스킵됩니다", angle: "꿀팁", points: ["대사와 기록 읽으며 진행하기", "사이드 퀘스트 먼저 즐기기", "엔딩 후 해석 찾아보기"], save: "명작 즐기는 법으로 저장하세요" },
    { slug: "save-often", title: "세이브는 습관이다", hook: "세 시간이 날아가는 건 한순간", angle: "실수", points: ["구간마다 수동 저장 습관", "자동 저장 과신하지 않기", "슬롯 두 개 이상 번갈아 쓰기"], save: "쓰라린 경험 있다면 저장하세요" },
  ],
  animal: [
    { slug: "cat-slow-blink", title: "고양이가 천천히 눈 감는 의미", hook: "그 눈빛, 사실 애정 표현입니다", angle: "꿀팁", points: ["느린 깜빡임은 편안함 신호", "같이 천천히 깜빡여 화답하기", "억지로 눈 맞추지 않기"], save: "집사 필수 상식으로 저장하세요" },
    { slug: "dog-walk-sniff", title: "산책은 냄새 맡는 시간입니다", hook: "산책이 운동만은 아니에요", angle: "반전", points: ["킁킁거림은 정보 수집 시간", "재촉 말고 기다려 주기", "코스를 가끔 바꿔 주기"], save: "산책 습관 점검용으로 저장하세요" },
    { slug: "pet-water-intake", title: "물 잘 안 마시는 아이 돕는 법", hook: "물그릇 위치만 바꿔도 달라집니다", angle: "꿀팁", points: ["물그릇 여러 곳에 두기", "그릇 재질 바꿔 보기", "변화가 크면 수의사 상담"], save: "반려인 체크리스트로 저장하세요" },
    { slug: "cat-box-love", title: "고양이는 왜 상자에 들어갈까", hook: "비싼 집보다 택배 상자인 이유", angle: "심리", points: ["좁은 공간이 주는 안정감", "높은 곳과 숨을 곳 함께 주기", "상자 하나는 남겨 두기"], save: "냥집사 상식으로 저장해 두세요" },
    { slug: "dog-tail-signs", title: "꼬리만 봐도 기분이 보인다", hook: "흔든다고 다 반가운 게 아닙니다", angle: "반전", points: ["높이와 속도 함께 보기", "몸 전체 신호와 같이 읽기", "경직됐다면 거리 두기"], save: "강아지 언어 사전으로 저장하세요" },
    { slug: "pet-alone-time", title: "혼자 두고 나갈 때 미안함 줄이기", hook: "빈집 시간, 준비하면 달라집니다", angle: "루틴", points: ["나가기 전 산책과 놀이로 에너지 빼기", "노즈워크 장난감 남겨 두기", "인사는 담백하게 하기"], save: "외출 루틴으로 저장해 두세요" },
    { slug: "cat-night-zoomies", title: "새벽 우다다의 이유", hook: "새벽 3시 운동회에는 이유가 있어요", angle: "꿀팁", points: ["남은 에너지가 폭발하는 시간", "자기 전 사냥놀이로 빼 주기", "낮에 충분히 놀아 주기"], save: "꿀잠 원하는 집사라면 저장하세요" },
    { slug: "dog-food-change", title: "사료 바꿀 때 지켜야 할 것", hook: "한 번에 바꾸면 탈이 나기 쉽습니다", angle: "실수", points: ["기존 사료에 조금씩 섞기", "일주일 넘게 천천히 전환", "상태 이상하면 수의사 상담"], save: "사료 교체 전 꼭 저장하세요" },
    { slug: "pet-photo-tips", title: "반려동물 인생샷 찍는 법", hook: "움직여서 못 찍는 게 아닙니다", angle: "꿀팁", points: ["연사 모드로 순간 잡기", "눈높이 맞춰 앉아 찍기", "간식은 렌즈 옆에 들기"], save: "인생샷 도전할 때 참고하세요" },
    { slug: "new-pet-first-week", title: "입양 첫 주, 하지 말아야 할 것", hook: "잘해주고 싶은 마음이 부담될 때", angle: "실수", points: ["첫 주는 조용한 적응 시간 주기", "손님 초대 미루기", "이름 부르며 간식으로 친해지기"], save: "입양 준비 중이라면 저장하세요" },
    { slug: "summer-paw-care", title: "여름 산책, 발바닥부터 챙기세요", hook: "한낮 바닥은 생각보다 뜨겁습니다", angle: "꿀팁", points: ["손등으로 바닥 온도 확인", "한낮 피해 아침저녁 산책", "산책 후 발 상태 확인"], save: "여름 반려 루틴으로 저장하세요" },
    { slug: "pet-dental-habit", title: "이 닦기 거부하는 아이 길들이기", hook: "치약보다 순서가 중요합니다", angle: "루틴", points: ["입 주변 만지기부터 익숙하게", "맛보기용 치약으로 시작", "짧게 자주, 칭찬은 크게"], save: "양치 훈련 로드맵으로 저장하세요" },
  ],
  celeb: [
    { slug: "fan-budget", title: "덕질 지출, 행복하게 관리하는 법", hook: "탕진잼도 계획이 필요합니다", angle: "꿀팁", points: ["월 덕질 예산 먼저 정하기", "한정판은 하루 자고 결정하기", "기록하면 만족도가 올라감"], save: "행복한 덕질을 위해 저장하세요" },
    { slug: "concert-prep", title: "공연 관람 준비물 체크리스트", hook: "현장에서 후회하는 것들, 미리 챙겨요", angle: "꿀팁", points: ["티켓과 신분증 이중 확인", "보조배터리와 물 준비", "이동 동선 미리 확인"], save: "공연 가기 전 꺼내 보세요" },
    { slug: "fan-content-line", title: "팬 콘텐츠 만들 때 지킬 선", hook: "사랑이 민폐가 되지 않으려면", angle: "실수", points: ["공식 가이드라인 확인하기", "2차 창작 표기 지키기", "수익화는 특히 신중하게"], save: "창작하는 팬이라면 저장하세요" },
    { slug: "bias-privacy", title: "좋아할수록 지켜야 할 거리", hook: "사생활은 응원 대상이 아닙니다", angle: "꿀팁", points: ["공식 활동 중심으로 응원하기", "사적 공간 정보 공유하지 않기", "루머 확산에 동참하지 않기"], save: "성숙한 팬 문화로 저장해 두세요" },
    { slug: "merch-storage", title: "굿즈 보관법이 가치를 바꾼다", hook: "쌓아두면 짐, 정리하면 컬렉션", angle: "꿀팁", points: ["직사광선 피해 보관하기", "포토카드는 슬리브에 넣기", "전시 공간 하나 정해 두기"], save: "굿즈 부자라면 저장하세요" },
    { slug: "fandom-friend", title: "덕질 친구 사귀는 법", hook: "같이 좋아하면 두 배로 즐겁습니다", angle: "꿀팁", points: ["온라인 매너부터 지키기", "호칭과 거리감 천천히 좁히기", "금전 거래는 신중하게"], save: "덕질 라이프 팁으로 저장하세요" },
    { slug: "fandom-balance", title: "밤샘 덕질과 일상 지키기", hook: "본진은 결국 내 일상입니다", angle: "루틴", points: ["몰아보기 시간 정해 두기", "수면 시간은 지키기", "현생 목표와 같이 굴리기"], save: "지속 가능한 덕질을 위해 저장하세요" },
    { slug: "event-manner", title: "팬 행사 현장 매너", hook: "모두의 추억을 지키는 방법", angle: "꿀팁", points: ["줄서기 새치기하지 않기", "촬영 규정 미리 확인", "스태프 안내 따르기"], save: "현장 갈 일 있다면 저장하세요" },
    { slug: "rumor-response", title: "내 최애 루머 대처법", hook: "화나도 퍼나르면 지는 겁니다", angle: "실수", points: ["출처 없는 글 공유하지 않기", "공식 입장 기다리기", "악성 게시물은 신고로 대응"], save: "팬심 지키는 법으로 저장하세요" },
    { slug: "return-fan", title: "휴덕 후 복귀하는 법", hook: "돌아오는 덕질이 제일 달콤합니다", angle: "꿀팁", points: ["최근 활동부터 따라잡기", "커뮤니티 분위기 먼저 파악", "무리한 소비로 보상하지 않기"], save: "복귀 덕후 가이드로 저장하세요" },
    { slug: "fan-account-run", title: "팬 계정 운영 기본기", hook: "정보 계정은 신뢰가 생명입니다", angle: "꿀팁", points: ["출처 표기 습관화하기", "확인 안 된 소식엔 물음표", "분쟁 글과는 거리 두기"], save: "계정 운영 원칙으로 저장하세요" },
    { slug: "goods-dupe-check", title: "가짜 굿즈 거르는 법", hook: "공식인 척하는 가품, 많습니다", angle: "실수", points: ["공식 판매처 목록 확인", "시세보다 지나치게 싸면 의심", "거래는 안전결제로 하기"], save: "지갑 지키는 법으로 저장하세요" },
  ],
};

/** 클릭 한 번에 보여줄 주제 수(8~12 요구 범위 안, bank 12개 중 무작위 부분집합). */
const WIZARD_TOPIC_BATCH_SIZE = 9;
/** Claude 주제 생성은 넉넉히 만든 뒤 로컬 judge가 강하게 고른다(유료 호출 1회당 후보 품질 확보). */
const CLAUDE_TOPIC_CANDIDATE_COUNT = 24;
const CLAUDE_TOPIC_KNOWN_TITLE_LIMIT = 90;
const CLAUDE_TOPIC_TIMEOUT_MS = 18_000;
const CLAUDE_TOPIC_MAX_TOKENS = 5000;
const CLAUDE_TOPIC_RECOMMEND_SCORE = 90;
const CLAUDE_TOPIC_MIN_DISPLAY_COUNT = 9;
const CLAUDE_TOPIC_MIN_RECOMMEND_COUNT = 9;
const CLAUDE_TOPIC_MAX_ATTEMPTS = 1;

/** 카탈로그에 저장하는 생성 주제 레코드. */
type WizardGeneratedTopicRecord = WizardTopicSeed & {
  topicId: string;
  category: WizardCategoryId;
  source?: WizardTopic["source"];
};

export type WizardFinanceCharacterVoiceRoute = {
  characterId: FinanceCharacterId;
  characterName: string;
  financeSubtopic: WizardFinanceSubtopicId;
  voice: FinanceCharacterVoiceProfile;
};

export type WizardFinanceCharacterVisualRoute = {
  characterId: FinanceCharacterId;
  characterName: string;
  financeSubtopic: WizardFinanceSubtopicId;
  candidateNumber: number;
  referenceImagePath: string;
  referenceImageSha256: string;
  visualStyle: string;
};

const WIZARD_TOPIC_MEMORY_CATALOG: Record<string, WizardGeneratedTopicRecord> = {};

function readWizardTopicCatalogFile(): Record<string, WizardGeneratedTopicRecord> {
  const parsed = readAbsJson(WIZARD_TOPIC_CATALOG_PATH) as {
    schemaVersion?: string;
    topics?: Record<string, WizardGeneratedTopicRecord>;
  } | null;
  const diskTopics = parsed && typeof parsed.topics === "object" && parsed.topics != null ? parsed.topics : {};
  return { ...diskTopics, ...WIZARD_TOPIC_MEMORY_CATALOG };
}

/** 생성 주제 1건을 카탈로그에서 되찾는다(대본/영상 단계 재현용). */
function readWizardGeneratedTopic(topicId: string): WizardGeneratedTopicRecord | null {
  const rec = readWizardTopicCatalogFile()[topicId];
  if (!rec || typeof rec.title !== "string" || !Array.isArray(rec.points)) return null;
  return rec;
}

/**
 * 생성된 재테크 주제는 반드시 12개 소주제 중 하나를 거쳐 승인 보이스를 선택한다.
 * 카탈로그가 손상된 경우 기본 .env 보이스로 조용히 후퇴하지 않도록 오류를 반환한다.
 */
export function resolveWizardFinanceCharacterVoice(
  topicId: string,
): { ok: true; route: WizardFinanceCharacterVoiceRoute } | { ok: false; reason: string } | null {
  const generated = readWizardGeneratedTopic(topicId);
  const isFinance = generated?.category === "finance" || topicId.startsWith("gen-finance-");
  if (!isFinance) return null;
  if (!generated?.financeSubtopic) return { ok: false, reason: "finance_voice_subtopic_missing" };
  try {
    const character = financeCharacterForSubtopic(generated.financeSubtopic);
    const voice = financeCharacterVoiceForSubtopic(generated.financeSubtopic);
    return {
      ok: true,
      route: {
        characterId: character.id,
        characterName: character.name,
        financeSubtopic: generated.financeSubtopic,
        voice,
      },
    };
  } catch {
    return { ok: false, reason: "finance_voice_mapping_missing_or_unapproved" };
  }
}

/**
 * 생성된 재테크 주제를 확정 캐릭터 이미지에 연결한다.
 * selection.json 또는 Owner 고정 candidate-2 계약의 파일 경로와 SHA-256이
 * 현재 후보 파일과 모두 일치할 때만 실제 생성에 사용한다.
 */
export function resolveWizardFinanceCharacterVisual(
  topicId: string,
): { ok: true; route: WizardFinanceCharacterVisualRoute } | { ok: false; reason: string } | null {
  const generated = readWizardGeneratedTopic(topicId);
  const isFinance = generated?.category === "finance" || topicId.startsWith("gen-finance-");
  if (!isFinance) return null;
  if (!generated?.financeSubtopic) return { ok: false, reason: "finance_character_subtopic_missing" };
  try {
    const character = financeCharacterForSubtopic(generated.financeSubtopic);
    const candidateNumber = validSelectedCandidateNumber(character.id);
    if (candidateNumber === null) return { ok: false, reason: "finance_character_reference_not_selected" };
    const referenceImagePath = financeCharacterCandidatePath(character.id, candidateNumber);
    const referenceImageSha256 = fileSha256(referenceImagePath);
    if (!referenceImageSha256) return { ok: false, reason: "finance_character_reference_file_missing" };
    return {
      ok: true,
      route: {
        characterId: character.id,
        characterName: character.name,
        financeSubtopic: generated.financeSubtopic,
        candidateNumber,
        referenceImagePath,
        referenceImageSha256,
        visualStyle: FINANCE_CHARACTER_VISUAL_STYLE,
      },
    };
  } catch {
    return { ok: false, reason: "finance_character_reference_mapping_missing" };
  }
}

function writeWizardTopicCatalogFile(topics: Record<string, WizardGeneratedTopicRecord>): boolean {
  Object.assign(WIZARD_TOPIC_MEMORY_CATALOG, topics);
  const payload = JSON.stringify({ schemaVersion: "wizard_topic_catalog_v1", topics }, null, 2);
  mkdirSync(dirname(WIZARD_TOPIC_CATALOG_PATH), { recursive: true });
  try {
    writeFileSync(WIZARD_TOPIC_CATALOG_PATH, payload, "utf8");
    return true;
  } catch {
    const tmpPath = `${WIZARD_TOPIC_CATALOG_PATH}.tmp-${process.pid}-${Date.now().toString(36)}`;
    try {
      writeFileSync(tmpPath, payload, "utf8");
      renameSync(tmpPath, WIZARD_TOPIC_CATALOG_PATH);
      return true;
    } catch {
      try {
        rmSync(tmpPath, { force: true });
      } catch {
        // no-op
      }
      return true;
    }
  }
}

export const WIZARD_EDITORIAL_DECISIONS = ["make", "maybe", "reject"] as const;
export type WizardEditorialDecision = (typeof WIZARD_EDITORIAL_DECISIONS)[number];

type WizardTopicEditorialPreference = {
  topicId: string;
  title: string;
  financeSubtopic: WizardFinanceSubtopicId | null;
  decision: WizardEditorialDecision;
  problemStatement: string | null;
  twist: string | null;
  takeawayAction: string | null;
  updatedAtIso: string;
};

type WizardTopicEditorialPreferenceFile = {
  schemaVersion: "wizard_topic_editorial_preferences_v1";
  topics: Record<string, WizardTopicEditorialPreference>;
};

function readWizardTopicEditorialPreferences(): WizardTopicEditorialPreferenceFile {
  const parsed = readAbsJson(WIZARD_TOPIC_EDITORIAL_PREFERENCES_PATH) as Partial<WizardTopicEditorialPreferenceFile> | null;
  if (
    !parsed ||
    parsed.schemaVersion !== "wizard_topic_editorial_preferences_v1" ||
    !parsed.topics ||
    typeof parsed.topics !== "object"
  ) {
    return { schemaVersion: "wizard_topic_editorial_preferences_v1", topics: {} };
  }
  return {
    schemaVersion: "wizard_topic_editorial_preferences_v1",
    topics: parsed.topics as Record<string, WizardTopicEditorialPreference>,
  };
}

function writeWizardTopicEditorialPreferences(file: WizardTopicEditorialPreferenceFile): boolean {
  try {
    mkdirSync(dirname(WIZARD_TOPIC_EDITORIAL_PREFERENCES_PATH), { recursive: true });
    writeFileSync(WIZARD_TOPIC_EDITORIAL_PREFERENCES_PATH, JSON.stringify(file, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

export type WizardEditorialPreferenceSummary = {
  total: number;
  make: number;
  maybe: number;
  reject: number;
  remainingCalibration: number;
};

function summarizeWizardTopicEditorialPreferences(
  file = readWizardTopicEditorialPreferences(),
): WizardEditorialPreferenceSummary {
  const decisions = Object.values(file.topics).map((item) => item.decision);
  const ratedBankIds = new Set(
    Object.values(file.topics)
      .filter((item) => item.topicId.startsWith("gen-finance-editorial-v2-"))
      .map((item) => item.topicId),
  );
  return {
    total: decisions.length,
    make: decisions.filter((decision) => decision === "make").length,
    maybe: decisions.filter((decision) => decision === "maybe").length,
    reject: decisions.filter((decision) => decision === "reject").length,
    remainingCalibration: Math.max(0, FINANCE_EDITORIAL_TOPIC_BANK.length - ratedBankIds.size),
  };
}

export function saveWizardTopicEditorialDecision(
  topicId: string,
  decision: WizardEditorialDecision,
): { ok: true; topic: WizardTopic; summary: WizardEditorialPreferenceSummary } | { ok: false; reason: string } {
  const record = readWizardGeneratedTopic(topicId);
  if (!record || record.category !== "finance") return { ok: false, reason: "finance_topic_not_found" };
  const file = readWizardTopicEditorialPreferences();
  file.topics[topicId] = {
    topicId,
    title: record.title,
    financeSubtopic: record.financeSubtopic ?? null,
    decision,
    problemStatement: record.problemStatement ?? null,
    twist: record.twist ?? null,
    takeawayAction: record.takeawayAction ?? null,
    updatedAtIso: new Date().toISOString(),
  };
  if (!writeWizardTopicEditorialPreferences(file)) return { ok: false, reason: "editorial_preference_write_failed" };
  const topic: WizardTopic = {
    topicId,
    title: record.title,
    hook: record.hook,
    reason: record.angleNote ?? `${FINANCE_SUBTOPIC_LABELS[record.financeSubtopic ?? "economy_literacy"]} 편집 후보`,
    scriptReady: decision === "make",
    recommended: decision === "make",
    category: record.category,
    angle: record.angle,
    source: record.source ?? "editorial_bank",
    financeSubtopic: record.financeSubtopic,
    problemStatement: record.problemStatement,
    twist: record.twist,
    takeawayAction: record.takeawayAction,
    editorialDecision: decision,
    requiresEditorialDecision: true,
    editorialLane: record.editorialLane,
  };
  return { ok: true, topic, summary: summarizeWizardTopicEditorialPreferences(file) };
}

export function canWizardTopicEnterScript(topicId: string): boolean {
  const record = readWizardGeneratedTopic(topicId);
  if (!record) return true;
  if (record.source !== "editorial_bank" && record.source !== "claude_generated") return true;
  return readWizardTopicEditorialPreferences().topics[topicId]?.decision === "make";
}

/** 카테고리별 최근 노출 slug 목록(오래된 것 → 최신 순). 파일이 없으면 빈 기록. */
function readRecentShownSeedSlugs(): Record<string, string[]> {
  const parsed = readAbsJson(WIZARD_TOPIC_RECENT_PATH) as {
    schemaVersion?: string;
    recentByCategory?: Record<string, unknown>;
  } | null;
  const raw = parsed?.recentByCategory;
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (Array.isArray(v)) out[k] = v.filter((s): s is string => typeof s === "string");
  }
  return out;
}

/** 최근 노출 기록 저장 — 실패해도 추천 자체는 계속한다(anti-repeat만 약해질 뿐). */
function writeRecentShownSeedSlugs(map: Record<string, string[]>): void {
  try {
    mkdirSync(dirname(WIZARD_TOPIC_RECENT_PATH), { recursive: true });
    writeFileSync(
      WIZARD_TOPIC_RECENT_PATH,
      JSON.stringify({ schemaVersion: "wizard_topic_recent_shown_v1", recentByCategory: map }, null, 2),
      "utf8",
    );
  } catch {
    // no-op
  }
}

function shuffleWizardItems<T>(items: readonly T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

type WizardTopicHistoryEvent = "shown" | "selected" | "scripted" | "video_created";

type WizardTopicHistoryRecord = {
  topicId: string;
  category: WizardCategoryId;
  title: string;
  normalizedTitle: string;
  source?: WizardTopic["source"];
  firstShownAtIso?: string;
  lastShownAtIso?: string;
  shownCount: number;
  selectedAtIso?: string;
  scriptedAtIso?: string;
  videoCreatedAtIso?: string;
};

type WizardTopicHistoryFile = {
  schemaVersion: "wizard_topic_history_v1";
  topics: Record<string, WizardTopicHistoryRecord>;
};

function normalizeTopicTitle(title: string): string {
  return String(title ?? "")
    .toLowerCase()
    .replace(/[“”"'.!?…,:;()\[\]{}<>·~\-_/\\|]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function titleSimilarity(a: string, b: string): number {
  const na = normalizeTopicTitle(a);
  const nb = normalizeTopicTitle(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const grams = (s: string) => {
    const out = new Set<string>();
    for (let i = 0; i < Math.max(1, s.length - 1); i++) out.add(s.slice(i, i + 2));
    return out;
  };
  const A = grams(na);
  const B = grams(nb);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter += 1;
  const union = new Set([...A, ...B]).size;
  return union === 0 ? 0 : inter / union;
}

function readWizardTopicHistoryFile(): WizardTopicHistoryFile {
  const parsed = readAbsJson(WIZARD_TOPIC_HISTORY_PATH) as Partial<WizardTopicHistoryFile> | null;
  if (!parsed || parsed.schemaVersion !== "wizard_topic_history_v1" || !parsed.topics || typeof parsed.topics !== "object") {
    return { schemaVersion: "wizard_topic_history_v1", topics: {} };
  }
  return { schemaVersion: "wizard_topic_history_v1", topics: parsed.topics as Record<string, WizardTopicHistoryRecord> };
}

function writeWizardTopicHistoryFile(history: WizardTopicHistoryFile): void {
  try {
    mkdirSync(dirname(WIZARD_TOPIC_HISTORY_PATH), { recursive: true });
    writeFileSync(WIZARD_TOPIC_HISTORY_PATH, JSON.stringify(history, null, 2), "utf8");
  } catch {
    // 추천은 계속 가능해야 하므로 기록 실패는 조용히 무시한다.
  }
}

function topicHistoryKey(category: WizardCategoryId, title: string): string {
  return `${category}:${normalizeTopicTitle(title)}`;
}

type KnownTopicTitleOptions = {
  usedOnly?: boolean;
  includeCatalog?: boolean;
  includeBank?: boolean;
  includeShownHistory?: boolean;
};

function allKnownTopicTitlesForCategory(category: WizardCategoryId, opts: KnownTopicTitleOptions = {}): string[] {
  const history = readWizardTopicHistoryFile();
  const historyRecords = Object.values(history.topics).filter((r) => r.category === category);
  const usedHistory = opts.usedOnly
    ? historyRecords.filter((r) => r.selectedAtIso || r.scriptedAtIso || r.videoCreatedAtIso)
    : opts.includeShownHistory === false
      ? []
      : historyRecords;
  const includeCatalog = opts.includeCatalog ?? !opts.usedOnly;
  const includeBank = opts.includeBank ?? !opts.usedOnly;
  const catalog = includeCatalog ? Object.values(readWizardTopicCatalogFile()).filter((r) => r.category === category) : [];
  const bank = includeBank ? (TOPIC_BANK[category] ?? []) : [];
  return [
    ...usedHistory.map((r) => r.title),
    ...catalog.map((r) => r.title),
    ...bank.map((r) => r.title),
  ].filter(Boolean);
}

function findDuplicateTopicReason(
  category: WizardCategoryId,
  title: string,
  extraTitles: string[] = [],
  opts?: KnownTopicTitleOptions & { allowSimilar?: boolean },
): string | null {
  const normalized = normalizeTopicTitle(title);
  if (!normalized) return "empty_title";
  const allowSimilar = opts?.allowSimilar !== false;
  const known = [...allKnownTopicTitlesForCategory(category, opts), ...extraTitles];
  for (const prev of known) {
    const sim = titleSimilarity(title, prev);
    if (normalizeTopicTitle(prev) === normalized) return `same_title:${prev}`;
    if (allowSimilar && sim >= 0.72) return `similar_title:${prev}`;
  }
  return null;
}

export function markWizardTopicHistory(
  event: WizardTopicHistoryEvent,
  topics: Array<{ topicId: string; title: string; category?: string; source?: WizardTopic["source"]; financeSubtopic?: WizardFinanceSubtopicId }>,
): void {
  if (topics.length === 0) return;
  const history = readWizardTopicHistoryFile();
  const now = new Date().toISOString();
  for (const t of topics) {
    const inferredCategory = WIZARD_CATEGORY_IDS.find((c) => String(t.topicId ?? "").startsWith(`gen-${c}-`));
    const category = (t.category ?? inferredCategory ?? "finance") as WizardCategoryId;
    if (!(WIZARD_CATEGORY_IDS as readonly string[]).includes(category)) continue;
    const key = topicHistoryKey(category, t.title);
    const existing = history.topics[key];
    const rec: WizardTopicHistoryRecord = {
      topicId: t.topicId,
      category,
      title: t.title,
      normalizedTitle: normalizeTopicTitle(t.title),
      source: (t as WizardTopic).source,
      firstShownAtIso: existing?.firstShownAtIso,
      lastShownAtIso: existing?.lastShownAtIso,
      shownCount: existing?.shownCount ?? 0,
      selectedAtIso: existing?.selectedAtIso,
      scriptedAtIso: existing?.scriptedAtIso,
      videoCreatedAtIso: existing?.videoCreatedAtIso,
    };
    if (event === "shown") {
      rec.firstShownAtIso = rec.firstShownAtIso ?? now;
      rec.lastShownAtIso = now;
      rec.shownCount += 1;
    }
    if (event === "selected") rec.selectedAtIso = now;
    if (event === "scripted") rec.scriptedAtIso = now;
    if (event === "video_created") rec.videoCreatedAtIso = now;
    history.topics[key] = rec;
  }
  writeWizardTopicHistoryFile(history);
}

export type WizardTopicBatchResult = {
  batchId: string;
  category: WizardCategoryId;
  financeSubtopic?: WizardFinanceSubtopicId | null;
  topics: WizardTopic[];
  rejected: Array<{ title: string; overallScore: number; rejectReasons: string[] }>;
  source: "editorial_bank" | "claude_generated" | "local_bank";
  generationNote: string;
  fallbackReason?: string;
  model?: string | null;
  excludedKnownTitleCount: number;
  editorialSummary?: WizardEditorialPreferenceSummary;
};

type ClaudeTopicShape = {
  title: string;
  hook: string;
  angle: WizardTopicAngle;
  empathy: string;
  points: [string, string, string];
  save: string;
  angleNote: string;
  moneyAnchor: string;
  psychologyAnchor: string;
  successAnchor: string;
  visualMetaphor: string;
};

type FinanceStingDomain = WizardFinanceSubtopicId;

type FinanceStingTemplate = Omit<WizardTopicSeed, "slug" | "title" | "hook" | "angle">;

const FINANCE_STING_DOMAIN_TEMPLATES: Record<FinanceStingDomain, FinanceStingTemplate> = {
  economy_literacy: {
    empathy: "경제 얘기만 나오면 넘기고 싶죠",
    points: ["모르는 돈은 남의 말에 흔들린다", "정보 격차가 지출 격차가 된다", "뉴스 한 줄을 내 돈과 연결하세요"],
    save: "오늘 밤 뉴스 한 줄만 보세요",
    angleNote: "경제 정보(돈) × 회피 × 정보 감각",
    moneyAnchor: "경제 정보",
    psychologyAnchor: "회피",
    successAnchor: "정보 감각",
    visualMetaphor: "경제 뉴스 화면과 옆에 놓인 카드 청구서",
  },
  inflation_living_cost: {
    empathy: "장바구니 앞에서 돈 감각이 흔들리죠",
    points: ["물가는 습관의 빈틈부터 때린다", "기준 없으면 생활비가 먼저 커진다", "이번 주 지출 기준 하나만 바꾸세요"],
    save: "이번 주 장보기 전에 보세요",
    angleNote: "생활비(돈) × 익숙함 × 지출 기준선",
    moneyAnchor: "생활비",
    psychologyAnchor: "익숙함",
    successAnchor: "지출 기준선",
    visualMetaphor: "가격표가 오른 장바구니와 줄어든 잔고",
  },
  interest_debt: {
    empathy: "이자는 작아 보여도 오래 남죠",
    points: ["빚은 익숙해질수록 위험해진다", "이자는 미래 월급을 먼저 가져간다", "상환일과 총액부터 다시 보세요"],
    save: "다음 결제일 전에 확인하세요",
    angleNote: "이자(돈) × 회피 × 상환 순서",
    moneyAnchor: "이자",
    psychologyAnchor: "회피",
    successAnchor: "상환 순서",
    visualMetaphor: "대출 앱 알림과 할부 결제 목록",
  },
  consumption_psychology: {
    empathy: "결제 전에는 다 그럴듯해 보이죠",
    points: ["감정은 필요라는 핑계를 만든다", "반복 결제가 돈 습관을 드러낸다", "결제 전 감정부터 이름 붙이세요"],
    save: "다음 결제 직전에 보세요",
    angleNote: "결제(돈) × 자기합리화 × 소비 기준",
    moneyAnchor: "결제",
    psychologyAnchor: "자기합리화",
    successAnchor: "소비 기준",
    visualMetaphor: "장바구니 화면 위에 붙은 감정 메모",
  },
  sns_comparison: {
    empathy: "남의 피드가 내 기준을 흔들죠",
    points: ["비교는 소비 허들을 낮춘다", "보이는 삶은 잔고를 대신 책임지지 않는다", "피드 닫고 예산부터 확인하세요"],
    save: "다음 약속 전 예산부터 보세요",
    angleNote: "피드 소비(돈) × 비교 × 내 기준선",
    moneyAnchor: "피드 소비",
    psychologyAnchor: "비교",
    successAnchor: "내 기준선",
    visualMetaphor: "화려한 피드와 조용한 잔고 화면",
  },
  labor_income: {
    empathy: "열심히 버는데도 불안할 때가 있죠",
    points: ["소득보다 빠른 지출이 자유를 줄인다", "노동소득은 구조 없이는 오래 못 남는다", "월급 흐름부터 한 장으로 보세요"],
    save: "다음 월급날 전에 정리하세요",
    angleNote: "노동소득(돈) × 안심 착각 × 현금흐름",
    moneyAnchor: "노동소득",
    psychologyAnchor: "안심 착각",
    successAnchor: "현금흐름",
    visualMetaphor: "월급 입금 그래프와 더 빠른 지출 그래프",
  },
  investing_assets: {
    empathy: "수익률 앞에서 마음이 빨라지죠",
    points: ["조급함은 리스크를 작게 보게 만든다", "기준 없는 투자는 감정에 끌려간다", "매수 전 버틸 돈부터 확인하세요"],
    save: "다음 매수 버튼 전에 보세요",
    angleNote: "투자(돈) × 조급함 × 리스크 기준",
    moneyAnchor: "투자",
    psychologyAnchor: "조급함",
    successAnchor: "리스크 기준",
    visualMetaphor: "수익률 화면과 생활비 통장을 나란히 본 장면",
  },
  housing_asset_gap: {
    empathy: "집과 차 앞에서는 계산이 감정으로 바뀌죠",
    points: ["큰 지출은 체면과 꿈을 같이 건드린다", "유지비를 빼면 선택지가 줄어든다", "계약 전 월 고정비부터 다시 보세요"],
    save: "큰 계약 전날 다시 보세요",
    angleNote: "주거비(돈) × 체면 × 고정비 관리",
    moneyAnchor: "주거비",
    psychologyAnchor: "체면",
    successAnchor: "고정비 관리",
    visualMetaphor: "집 계약서와 월 고정비 목록",
  },
  anxiety_avoidance: {
    empathy: "숫자 보기 싫은 날일수록 더 피하게 되죠",
    points: ["회피는 불안을 잠깐만 덮는다", "모르는 숫자가 선택지를 줄인다", "오늘 총액 하나만 적어 보세요"],
    save: "오늘 밤 10분만 확인하세요",
    angleNote: "잔고(돈) × 불안 회피 × 숫자 직면",
    moneyAnchor: "잔고",
    psychologyAnchor: "불안 회피",
    successAnchor: "숫자 직면",
    visualMetaphor: "닫힌 은행 앱과 펼쳐진 메모지",
  },
  success_habits: {
    empathy: "돈 쓸 때 진짜 기준이 드러나죠",
    points: ["작은 결제는 태도를 숨기지 못한다", "성공은 감정 대신 기준을 따른다", "오늘 쓴 돈에 기준을 붙이세요"],
    save: "오늘 마지막 결제 후 보세요",
    angleNote: "돈 태도(돈) × 감정 통제 × 성공 기준",
    moneyAnchor: "돈 태도",
    psychologyAnchor: "감정 통제",
    successAnchor: "성공 기준",
    visualMetaphor: "결제 버튼 앞에서 멈춘 손과 기준 메모",
  },
  crisis_risk: {
    empathy: "위기는 늘 남 얘기처럼 느껴지죠",
    points: ["낙관은 준비 없을 때 가장 비싸다", "버틸 돈이 없으면 선택도 줄어든다", "한 달 생존비부터 따로 빼세요"],
    save: "이번 주말 생존비를 계산하세요",
    angleNote: "비상금(돈) × 낙관 착각 × 리스크 관리",
    moneyAnchor: "비상금",
    psychologyAnchor: "낙관 착각",
    successAnchor: "리스크 관리",
    visualMetaphor: "비상금 통장과 흔들리는 경제 뉴스",
  },
  time_retirement: {
    empathy: "나중의 나는 늘 잘할 것 같죠",
    points: ["미루는 소비는 미래의 선택지를 줄인다", "시간은 기준 있는 돈에만 편이 된다", "오늘 자동이체 하나부터 거세요"],
    save: "오늘 밤 자동이체를 걸어 보세요",
    angleNote: "미래 돈(돈) × 현재편향 × 장기 기준",
    moneyAnchor: "미래 돈",
    psychologyAnchor: "현재편향",
    successAnchor: "장기 기준",
    visualMetaphor: "오늘의 결제 화면과 10년 뒤 달력",
  },
};

function inferFinanceSubtopicForSeed(seed: Pick<WizardTopicSeed, "title" | "moneyAnchor" | "psychologyAnchor" | "successAnchor" | "visualMetaphor">): WizardFinanceSubtopicId {
  const text = [seed.title, seed.moneyAnchor, seed.psychologyAnchor, seed.successAnchor, seed.visualMetaphor].filter(Boolean).join(" ");
  if (/경제|뉴스|환율|경기|지표|정보|돈공부|공부/.test(text)) return "economy_literacy";
  if (/물가|생활비|마트|장바구니|외식비|식비|가격|인플레/.test(text)) return "inflation_living_cost";
  if (/금리|이자|대출|빚|할부|카드값|고지서|상환/.test(text)) return "interest_debt";
  if (/친구|모임|선물|피드|인스타|하이라이트|체면|비교|남 눈|SNS/.test(text)) return "sns_comparison";
  if (/월급|연봉|소득|수입|노동|입금|자동이체|현금흐름/.test(text)) return "labor_income";
  if (/투자|주식|수익률|계좌|자산|복리|저축|이체|부자|기회/.test(text)) return "investing_assets";
  if (/집값|집|월세|전세|보증금|주거비|계약|부동산/.test(text)) return "housing_asset_gap";
  if (/불안|회피|잔고|통장|숫자 보기|닫힌 은행|앱을 닫/.test(text)) return "anxiety_avoidance";
  if (/성공|기준|습관|감정 통제|돈 태도|루틴/.test(text)) return "success_habits";
  if (/위기|불황|리스크|비상금|생존|위험|버틸/.test(text)) return "crisis_risk";
  if (/노후|미래|시간|10년|5년|나중|현재편향|자동이체/.test(text)) return "time_retirement";
  return "consumption_psychology";
}

function filterFinanceSubtopicSeeds(seeds: WizardTopicSeed[], financeSubtopic?: WizardFinanceSubtopicId | null): WizardTopicSeed[] {
  if (!financeSubtopic) return seeds;
  return seeds.filter((seed) => (seed.financeSubtopic ?? inferFinanceSubtopicForSeed(seed)) === financeSubtopic);
}

export function buildFinanceEditorialTopicSeeds(): WizardTopicSeed[] {
  return FINANCE_EDITORIAL_TOPIC_BANK.map((item) => {
    const template = FINANCE_STING_DOMAIN_TEMPLATES[item.financeSubtopic as FinanceStingDomain];
    return {
      slug: `editorial-v2-${item.id}`,
      title: item.title,
      hook: trimCaption(item.title),
      angle: inferTopicAngle(item.title),
      empathy: item.problemStatement,
      points: [item.problemStatement, item.twist, item.takeawayAction],
      save: `비슷한 선택 앞에서 다시 봐`,
      angleNote: `${FINANCE_SUBTOPIC_LABELS[item.financeSubtopic]} · 제목부터 행동까지 함께 평가`,
      moneyAnchor: template.moneyAnchor,
      psychologyAnchor: template.psychologyAnchor,
      successAnchor: template.successAnchor,
      visualMetaphor: template.visualMetaphor,
      financeSubtopic: item.financeSubtopic,
      curiosityMechanismId: `editorial-v2:${item.id}`,
      editorialLane: item.lane,
      problemStatement: item.problemStatement,
      twist: item.twist,
      takeawayAction: item.takeawayAction,
    };
  });
}

const CLAUDE_TOPIC_SYSTEM_PROMPT = [
  "당신은 한국어 쇼츠 후킹 제목 편집장이다. 돈/경제 + 성공/심리 + 생활습관이 결합된 1초 컷 주제를 만든다.",
  "제목만 읽어도 구체적인 돈 문제, 예상 밖 결과, 시청자가 놓친 판단 기준이 동시에 보여야 한다.",
  "필요하면 가난한 습관을 지적하고 단호하게 훈계해도 된다. 단, 근거 없는 공포와 모욕은 금지한다.",
  "모건 하우절식 '돈은 숫자보다 행동·감정·관점' 축을 참고하되 책 문장/챕터를 베끼지 말고 완전히 새 한국어 쇼츠 주제로 만든다.",
  "",
  "규칙:",
  '- 출력은 JSON 객체 하나만. 첫 글자는 반드시 "{", 마지막 글자는 반드시 "}" 여야 한다.',
  '- 최상위 형태는 반드시 {"topics":[...]} 이다. 마크다운, 설명, 주석, 번호 목록, 인사말 금지.',
  `- topics 배열에 ${CLAUDE_TOPIC_CANDIDATE_COUNT}개를 담아라.`,
  "- 제목은 12~36자. 구체 경제 대상과 손해/후회/위험/반전/행동 기준 중 하나를 반드시 직접 써라.",
  "- '이유'는 구체적인 모순이 있을 때만 허용한다. 일반적인 방법/공통점/체크리스트/절약법/부자 되는 법은 금지.",
  "- 제목은 '합니다/됩니다/습니다/입니다' 같은 존댓말 종결 금지, 마침표 금지.",
  "- 제목은 돈/경제 오브젝트와 결과가 보여야 한다: 경제 뉴스, 물가, 금리, 이자, 대출, 월급, 카드값, 구독, 장바구니, 투자, 주거비, 비상금, 노후 등.",
  "- 비유만 세운 모호한 제목 금지. 추상어(불안/체면/비교/선택권 등)는 반드시 구체 행동과 붙여라.",
  "- '월급을 먹는다/통장이 무너진다/잔고를 잠근다/돈이 샌다/선택권을 빼앗는다' 같은 큰 비유형 제목을 기본값으로 쓰지 마라.",
  "- 제목 구조는 '구체 경제 신호 + 예상과 다른 결과' 또는 '나쁜 돈 습관 + 직접 경고' 또는 '성공 기준 + 즉시 행동' 중 하나다.",
  "- '다르게 움직이는 순간/생기는 변화/중요한 번역/먼저 보인다'처럼 내용은 맞지만 클릭 이유가 약한 설명문은 금지한다.",
  "- 약한 제목 금지: '사진 찍어두는 사람', '안 여는 사람', '고르는 사람'처럼 행동만 있고 결과가 없는 제목 금지.",
  "- 좋은 제목 방향: '금리 인하 뉴스만 믿고 기다리면 대출 이자 더 낸다', '마트에서 덜 샀는데 식비가 더 나온 진짜 원인', '돈 모으려면 의지보다 결제 환경부터 바꿔라', '불황 전에 소비보다 빚부터 줄여야 하는 이유'.",
  "- 제목은 경제 궁금증을 만들고, 심리·습관·성공 기준은 대본에서 자연스럽게 풀어라.",
  "- hook/empathy/points/save는 화면 자막으로 쓰이므로 각각 34자 이하.",
  "- points는 정확히 3개: [심리 원인, 반전 문장, 행동 전환].",
  "- save는 다음 월급날/다음 결제 전/오늘 밤/이번 주말처럼 실행 시점을 포함.",
  "- 기존에 본 제목과 비슷한 주제는 절대 만들지 마라.",
  "",
  "각 topic 필드:",
  "{title, hook, angle, empathy, points, save, angleNote, moneyAnchor, psychologyAnchor, successAnchor, visualMetaphor}",
  "angle은 반전/숫자/실수/루틴/심리/꿀팁 중 하나.",
].join("\n");

function parseClaudeTopicResponse(rawText: string): unknown {
  const parsed = JSON.parse(extractJsonText(rawText));
  return Array.isArray(parsed) ? { topics: parsed } : parsed;
}

function getSafeExternalErrorCode(e: unknown): string {
  const err = e as { name?: unknown; code?: unknown; cause?: { code?: unknown; name?: unknown } } | null;
  const raw =
    (typeof err?.cause?.code === "string" && err.cause.code) ||
    (typeof err?.code === "string" && err.code) ||
    (typeof err?.cause?.name === "string" && err.cause.name) ||
    (typeof err?.name === "string" && err.name) ||
    "unknown";
  return raw.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 48);
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function pickStringField(o: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

function pickStringArrayField(o: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const v = o[key];
    if (!Array.isArray(v)) continue;
    const arr = v.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
    if (arr.length > 0) return arr;
  }
  return [];
}

const CLAUDE_TOPIC_ARRAY_KEYS = [
  "topics",
  "candidates",
  "ideas",
  "items",
  "results",
  "recommendations",
  "suggestions",
  "topicCandidates",
  "topic_candidates",
  "shorts",
  "subjects",
  "주제목록",
  "후보",
  "추천",
  "추천주제",
] as const;

const CLAUDE_TOPIC_TITLE_KEYS = ["title", "topic", "headline", "subject", "name", "idea", "제목", "주제"] as const;

function hasClaudeTopicTitle(o: Record<string, unknown>): boolean {
  return CLAUDE_TOPIC_TITLE_KEYS.some((key) => typeof o[key] === "string" && String(o[key]).trim().length > 0);
}

function coerceClaudeTopicArray(parsed: unknown, depth = 0): unknown[] | null {
  if (Array.isArray(parsed)) return parsed;
  const o = asRecord(parsed);
  if (!o) return null;
  for (const key of CLAUDE_TOPIC_ARRAY_KEYS) {
    if (Array.isArray(o[key])) return o[key] as unknown[];
  }
  if (hasClaudeTopicTitle(o)) return [o];
  if (depth < 2) {
    for (const value of Object.values(o)) {
      const nested = coerceClaudeTopicArray(value, depth + 1);
      if (nested) return nested;
    }
  }
  return null;
}

function inferTopicAngle(text: string): WizardTopicAngle {
  if (/실수|후회|망한|잃/.test(text)) return "실수";
  if (/\d|숫자|몇|하나|두/.test(text)) return "숫자";
  if (/반전|오히려|사실|진짜/.test(text)) return "반전";
  if (/매일|루틴|반복|습관/.test(text)) return "루틴";
  if (/팁|바꾸|해보|하세요/.test(text)) return "꿀팁";
  return "심리";
}

function inferAnchor(text: string, fallback: string, patterns: Array<[RegExp, string]>): string {
  for (const [re, value] of patterns) {
    if (re.test(text)) return value;
  }
  return fallback;
}

function buildFallbackTopicParts(
  title: string,
  hook: string,
): Pick<WizardTopicSeed, "empathy" | "points" | "save" | "angleNote" | "moneyAnchor" | "psychologyAnchor" | "successAnchor" | "visualMetaphor"> {
  const base = `${title} ${hook}`;
  const moneyAnchor = inferAnchor(base, "소비", [
    [/월급|월급날|연봉|입금/, "월급"],
    [/구독|자동결제|정기/, "구독"],
    [/카드|결제|카드값/, "결제"],
    [/배달|장바구니|쇼핑|세일/, "소비"],
    [/빚|대출|이자/, "빚"],
    [/잔고|통장|가계부|저축/, "잔고"],
  ]);
  const psychologyAnchor = inferAnchor(base, "자기합리화", [
    [/불안|무서|걱정|초조/, "불안"],
    [/체면|보이|친구|모임|남 눈/, "체면"],
    [/비교|하이라이트/, "비교"],
    [/보상|퇴근|힘든|위로/, "보상심리"],
    [/미루|회피|안 뜯|못 끊/, "회피"],
    [/괜찮|합리화|이 정도/, "자기합리화"],
  ]);
  const successAnchor = inferAnchor(base, "반복 선택 구조", [
    [/기준|씀씀이|생활비/, "기준선 관리"],
    [/자동|구독|예약/, "시스템 설계"],
    [/순서|먼저|월급날/, "첫 선택 구조"],
    [/반복|매일|습관/, "반복 패턴"],
    [/선택권|못 고르/, "선택권 회복"],
  ]);
  return {
    empathy: trimCaption(`${moneyAnchor} 앞에서 마음이 먼저 흔들리죠`),
    points: [
      trimCaption(`${psychologyAnchor}이 결제를 밀어붙인다`),
      trimCaption("문제는 돈보다 반복되는 장면이다"),
      trimCaption("다음 결제 전 한 번 멈추세요"),
    ],
    save: trimCaption("다음 결제 전 꼭 열어 보세요"),
    angleNote: `${moneyAnchor}(돈) × ${psychologyAnchor} × ${successAnchor}`,
    moneyAnchor,
    psychologyAnchor,
    successAnchor,
    visualMetaphor: `${moneyAnchor} 장면과 흔들리는 손 클로즈업`,
  };
}

function toClaudeTopicSeed(category: WizardCategoryId, raw: unknown, index: number, financeSubtopic?: WizardFinanceSubtopicId | null): WizardTopicSeed | null {
  const o = asRecord(raw);
  if (!o) return null;
  const title = pickStringField(o, ["title", "topic", "headline", "subject", "name", "idea", "제목", "주제"]);
  if (!title) return null;
  const hook =
    pickStringField(o, ["hook", "core_hook", "hookLine", "opening", "firstLine", "subtitle", "copy", "훅", "후킹", "첫문장"]) ??
    trimCaption(`${title}라면 그냥 넘기기 어렵죠`);
  const fallback = buildFallbackTopicParts(title, hook);
  const rawPoints = pickStringArrayField(o, ["points", "captions", "captionLines", "sceneCaptions", "lines", "beats", "자막", "포인트"]);
  const points = [0, 1, 2].map((i) => trimCaption(rawPoints[i] ?? fallback.points[i])) as [string, string, string];
  const angleRaw = pickStringField(o, ["angle", "type", "tone", "category", "유형"]);
  const angle =
    angleRaw && ["반전", "숫자", "실수", "루틴", "심리", "꿀팁"].includes(angleRaw)
      ? (angleRaw as WizardTopicAngle)
      : inferTopicAngle(`${title} ${hook} ${points.join(" ")}`);
  const moneyAnchor = pickStringField(o, ["moneyAnchor", "money_anchor", "money", "financeAxis", "돈축"]) ?? fallback.moneyAnchor;
  const psychologyAnchor =
    pickStringField(o, ["psychologyAnchor", "psychology_anchor", "psychology", "psychAxis", "심리축"]) ?? fallback.psychologyAnchor;
  const successAnchor = pickStringField(o, ["successAnchor", "success_anchor", "success", "habitAxis", "성공축", "습관축"]) ?? fallback.successAnchor;
  const hash = createHash("sha1").update(`${category}:${title}:${index}`).digest("hex").slice(0, 10);
  const seed: WizardTopicSeed = {
    slug: `ai-${hash}`,
    title,
    hook: trimCaption(hook),
    angle,
    empathy: trimCaption(
      pickStringField(o, ["empathy", "relatableLine", "pain", "공감", "공감문장"]) ?? fallback.empathy ?? `${title} 앞에서 마음이 흔들리죠`,
    ),
    points,
    save: trimCaption(pickStringField(o, ["save", "cta", "callToAction", "action", "저장", "행동"]) ?? fallback.save),
    angleNote: pickStringField(o, ["angleNote", "reason", "why", "rationale", "structure", "추천이유"]) ?? `${moneyAnchor}(돈) × ${psychologyAnchor} × ${successAnchor}`,
    moneyAnchor,
    psychologyAnchor,
    successAnchor,
    visualMetaphor: pickStringField(o, ["visualMetaphor", "visual", "scene", "imageCue", "장면", "시각화"]) ?? fallback.visualMetaphor,
    problemStatement: trimCaption(
      pickStringField(o, ["problemStatement", "problem", "pain", "문제"]) ??
        pickStringField(o, ["empathy", "relatableLine", "공감", "공감문장"]) ??
        fallback.empathy ??
        title,
    ),
    twist: points[1],
    takeawayAction: points[2],
  };
  return {
    ...seed,
    financeSubtopic: financeSubtopic ?? inferFinanceSubtopicForSeed(seed),
  };
}

async function generateClaudeTopicSeeds(
  category: WizardCategoryId,
  opts?: { fetchImpl?: typeof globalThis.fetch; apiKey?: string | null; model?: string; timeoutMs?: number; attempt?: number; avoidTitles?: string[]; financeSubtopic?: WizardFinanceSubtopicId | null },
): Promise<{ ok: true; seeds: WizardTopicSeed[]; model: string } | { ok: false; reason: string }> {
  if (category !== "finance") return { ok: false, reason: "claude_topic_generation_finance_only" };
  if (isClaudePolishDisabled()) return { ok: false, reason: "claude_topic_generation_disabled" };
  const apiKey = opts?.apiKey !== undefined ? opts.apiKey : (process.env.ANTHROPIC_API_KEY ?? null);
  if (!apiKey || apiKey.trim() === "") return { ok: false, reason: "anthropic_api_key_missing" };
  const fetchImpl = opts?.fetchImpl ?? globalThis.fetch;
  const model = opts?.model ?? process.env.ANTHROPIC_TOPIC_MODEL ?? process.env.ANTHROPIC_POLISH_MODEL ?? CLAUDE_POLISH_DEFAULT_MODEL;
  const timeoutMs = opts?.timeoutMs ?? CLAUDE_TOPIC_TIMEOUT_MS;
  const knownTitles = allKnownTopicTitlesForCategory(category, {
    usedOnly: false,
    includeCatalog: true,
    includeBank: false,
    includeShownHistory: true,
  }).slice(-CLAUDE_TOPIC_KNOWN_TITLE_LIMIT);
  const financeSubtopic = opts?.financeSubtopic ?? null;
  const editorialPreferences = Object.values(readWizardTopicEditorialPreferences().topics).filter(
    (item) => !financeSubtopic || item.financeSubtopic === financeSubtopic,
  );
  const preferredEditorialPackages = editorialPreferences
    .filter((item) => item.decision === "make")
    .slice(-20)
    .map((item) => ({
      title: item.title,
      problem: item.problemStatement,
      twist: item.twist,
      action: item.takeawayAction,
    }));
  const rejectedEditorialTitles = editorialPreferences
    .filter((item) => item.decision === "reject")
    .slice(-30)
    .map((item) => item.title);
  const avoidTitles = (opts?.avoidTitles ?? []).slice(-40);
  const attempt = Math.max(1, opts?.attempt ?? 1);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetchImpl(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: CLAUDE_TOPIC_MAX_TOKENS,
        system: CLAUDE_TOPIC_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: JSON.stringify(
              {
                category: CATEGORY_LABELS[category],
                financeSubtopic: financeSubtopic ? FINANCE_SUBTOPIC_LABELS[financeSubtopic] : "전체",
                makeCount: CLAUDE_TOPIC_CANDIDATE_COUNT,
                alreadySeenOrUsedTitles: knownTitles,
                previousWeakOrRejectedTitles: avoidTitles,
                ownerApprovedPackages: preferredEditorialPackages,
                ownerRejectedTitles: rejectedEditorialTitles,
                attempt,
                requiredQualityFloor: {
                  minimumDisplayTopics: CLAUDE_TOPIC_MIN_DISPLAY_COUNT,
                  minimumRecommendedTopics: CLAUDE_TOPIC_MIN_RECOMMEND_COUNT,
                  recommendationScoreMeans: "구체 경제 대상 + 예상과 다른 내 생활 결과 + 영상을 봐야 풀리는 원인 한 칸이 있는 주제",
                },
                instruction:
                  attempt > 1
                    ? "첫 응답이 너무 약했다. 사람 행동만 지적하는 제목, 막연한 손해 경고, 결론을 전부 말하는 훈계형을 버려라. 선택된 소주제에서 구체 경제 현상과 예상 밖 생활 결과 사이의 빈칸을 만들어라."
                    : "Owner가 만든다로 고른 패키지의 직접성·긴장·구체성을 따르되 문장을 복제하지 마라. 버린 제목의 약한 구조는 반복하지 말고, 선택된 소주제에서 구체 경제 신호와 내 돈의 예상 밖 결과를 연결하라.",
              },
              null,
              2,
            ),
          },
        ],
      }),
      signal: controller.signal,
    });
    if (!resp.ok) return { ok: false, reason: `anthropic_http_${resp.status}` };
    let data: { content?: Array<{ type?: string; text?: string }> };
    try {
      data = (await resp.json()) as { content?: Array<{ type?: string; text?: string }> };
    } catch {
      return { ok: false, reason: "anthropic_api_json_parse_failed" };
    }
    const textBlock = (data.content ?? []).find((b) => b?.type === "text" && typeof b.text === "string");
    if (!textBlock?.text) return { ok: false, reason: "anthropic_no_text" };
    let parsed: unknown;
    try {
      parsed = parseClaudeTopicResponse(textBlock.text);
    } catch {
      return { ok: false, reason: "anthropic_topic_json_parse_failed" };
    }
    const topicItems = coerceClaudeTopicArray(parsed);
    if (!topicItems) return { ok: false, reason: "anthropic_topics_not_array" };
    const seeds = topicItems
      .map((t, i) => toClaudeTopicSeed(category, t, i, financeSubtopic))
      .filter((s): s is WizardTopicSeed => s != null);
    return seeds.length > 0 ? { ok: true, seeds, model } : { ok: false, reason: "anthropic_no_valid_topic_seed" };
  } catch (e) {
    return {
      ok: false,
      reason: (e as Error)?.name === "AbortError" ? "anthropic_timeout" : `anthropic_call_failed_${getSafeExternalErrorCode(e)}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

function finalizeTopicBatchFromSeeds(
  category: WizardCategoryId,
  seeds: WizardTopicSeed[],
  source: "editorial_bank" | "claude_generated" | "local_bank",
  generationNote: string,
  opts?: {
    fallbackReason?: string;
    model?: string | null;
    recentKey?: string;
    recentPoolSize?: number;
    recentSeedSlugs?: string[];
    recentWindowSize?: number;
    financeSubtopic?: WizardFinanceSubtopicId | null;
  },
): WizardTopicBatchResult | null {
  const strict = category === "finance";
  const requestedFinanceSubtopic = category === "finance" ? (opts?.financeSubtopic ?? null) : null;
  const candidateSeeds = requestedFinanceSubtopic ? filterFinanceSubtopicSeeds(seeds, requestedFinanceSubtopic) : seeds;
  const rejected: Array<{ title: string; overallScore: number; rejectReasons: string[] }> = [];
  const accepted: Array<{ seed: WizardTopicSeed; judgment: WizardQualityJudgment; rewrittenReasons: string[] }> = [];
  const seenTitles: string[] = [];
  const seenCuriosityMechanisms = new Set<string>();
  const softCandidates: Array<{ seed: WizardTopicSeed; judgment: WizardQualityJudgment; rewrittenReasons: string[] }> = [];
  for (const inputSeed of candidateSeeds) {
    let seed = inputSeed;
    const dupReason = findDuplicateTopicReason(
      category,
      seed.title,
      seenTitles,
      source === "local_bank"
        ? { allowSimilar: true }
        : source === "claude_generated"
          ? { allowSimilar: true, usedOnly: false, includeCatalog: true, includeBank: false, includeShownHistory: true }
          : { allowSimilar: false, usedOnly: true, includeCatalog: false, includeBank: false, includeShownHistory: false },
    );
    if (dupReason) {
      rejected.push({ title: seed.title, overallScore: 0, rejectReasons: [`중복/유사 주제 제외: ${dupReason}`] });
      continue;
    }
    let judgment = judgeTopicSeed(seed, strict);
    let rewrittenReasons: string[] = [];
    if (!judgment.passed) {
      const rw = rewriteWeakSeed(seed);
      if (rw.reasons.length > 0) {
        const rejudged = judgeTopicSeed(rw.seed, strict);
        if (rejudged.overallScore >= judgment.overallScore) {
          seed = rw.seed;
          judgment = { ...rejudged, rewriteReasons: rw.reasons };
          rewrittenReasons = rw.reasons;
        }
      }
    }
    if (source === "claude_generated" && !strict && judgment.overallScore >= 58) {
      softCandidates.push({
        seed,
        judgment: { ...judgment, passed: true, rewriteReasons: [...judgment.rewriteReasons, "Claude 후보를 로컬 규칙에 맞춰 보강"] },
        rewrittenReasons: [...rewrittenReasons, "Claude 후보를 로컬 규칙에 맞춰 보강"],
      });
    }
    const displayFloor = strict ? CLAUDE_TOPIC_RECOMMEND_SCORE : 70;
    if (!judgment.passed || judgment.overallScore < displayFloor) {
      rejected.push({ title: seed.title, overallScore: judgment.overallScore, rejectReasons: judgment.rejectReasons });
      continue;
    }
    if (seed.curiosityMechanismId && seenCuriosityMechanisms.has(seed.curiosityMechanismId)) continue;
    accepted.push({ seed, judgment, rewrittenReasons });
    if (seed.curiosityMechanismId) seenCuriosityMechanisms.add(seed.curiosityMechanismId);
    seenTitles.push(seed.title);
    if (accepted.length >= WIZARD_TOPIC_BATCH_SIZE) break;
  }
  if (accepted.length < WIZARD_TOPIC_BATCH_SIZE && source === "claude_generated" && softCandidates.length > 0) {
    const acceptedTitles = new Set(accepted.map((a) => normalizeTopicTitle(a.seed.title)));
    softCandidates.sort((a, b) => b.judgment.overallScore - a.judgment.overallScore);
    for (const c of softCandidates) {
      if (accepted.length >= WIZARD_TOPIC_BATCH_SIZE) break;
      const key = normalizeTopicTitle(c.seed.title);
      if (!key || acceptedTitles.has(key)) continue;
      if (c.seed.curiosityMechanismId && seenCuriosityMechanisms.has(c.seed.curiosityMechanismId)) continue;
      accepted.push(c);
      acceptedTitles.add(key);
      if (c.seed.curiosityMechanismId) seenCuriosityMechanisms.add(c.seed.curiosityMechanismId);
    }
  }
  if (accepted.length === 0) return null;
  accepted.sort((a, b) => b.judgment.overallScore - a.judgment.overallScore);
  const picked = accepted.slice(0, WIZARD_TOPIC_BATCH_SIZE);
  const recommendedCount = picked.filter((p) => p.judgment.overallScore >= CLAUDE_TOPIC_RECOMMEND_SCORE).length;
  if (
    source === "claude_generated" &&
    (picked.length < CLAUDE_TOPIC_MIN_DISPLAY_COUNT || recommendedCount < CLAUDE_TOPIC_MIN_RECOMMEND_COUNT)
  ) {
    return null;
  }
  const records: Array<WizardGeneratedTopicRecord & { _judged: { judgment: WizardQualityJudgment; rewrittenReasons: string[] } }> = picked.map((p) => ({
    ...p.seed,
    topicId: `gen-${category}-${p.seed.slug}`,
    category,
    source,
    _judged: { judgment: p.judgment, rewrittenReasons: p.rewrittenReasons },
  }));
  try {
    const existing = readWizardTopicCatalogFile();
    for (const r of records) {
      const { _judged, ...clean } = r;
      existing[r.topicId] = clean;
    }
    if (!writeWizardTopicCatalogFile(existing)) return null;
  } catch {
    return null;
  }
  if (opts?.recentKey && typeof opts.recentPoolSize === "number") {
    const recentMap = readRecentShownSeedSlugs();
    const recent = opts.recentSeedSlugs ?? recentMap[opts.recentKey] ?? [];
    const pickedSlugs = new Set(records.map((r) => r.slug));
    const windowSize = opts.recentWindowSize ?? Math.max(0, opts.recentPoolSize - WIZARD_TOPIC_BATCH_SIZE);
    recentMap[opts.recentKey] = [...recent.filter((s) => !pickedSlugs.has(s)), ...records.map((r) => r.slug)].slice(-windowSize);
    writeRecentShownSeedSlugs(recentMap);
  }
  const topics: WizardTopic[] = records.map((r) => ({
    topicId: r.topicId,
    title: r.title,
    hook: r.hook,
    reason: r.angleNote ?? `${CATEGORY_LABELS[category]} · ${r.angle}형 훅`,
    scriptReady: !(category === "finance" && source === "claude_generated"),
    recommended: r._judged.judgment.overallScore >= CLAUDE_TOPIC_RECOMMEND_SCORE,
    category,
    angle: r.angle,
    qualityScore: r._judged.judgment.overallScore,
    rewrittenReasons: r._judged.rewrittenReasons,
    source,
    financeSubtopic: r.financeSubtopic,
    problemStatement: r.problemStatement,
    twist: r.twist,
    takeawayAction: r.takeawayAction,
    editorialDecision: null,
    requiresEditorialDecision: category === "finance" && source === "claude_generated",
    editorialLane: r.editorialLane,
    noveltyNote:
      r.financeSubtopic
        ? `${FINANCE_SUBTOPIC_LABELS[r.financeSubtopic]} 소분야`
        : source === "claude_generated" ? "새로 생성된 주제" : "로컬 백업 주제",
  }));
  markWizardTopicHistory("shown", topics);
  return {
    batchId: `${category}-${requestedFinanceSubtopic ?? "all"}-${source}-${Date.now().toString(36)}`,
    category,
    financeSubtopic: requestedFinanceSubtopic,
    topics,
    rejected: rejected.slice(0, 12),
    source,
    generationNote,
    fallbackReason: opts?.fallbackReason,
    model: opts?.model ?? null,
    excludedKnownTitleCount: allKnownTopicTitlesForCategory(category).length,
  };
}

function generateFinanceEditorialBankBatch(
  category: WizardCategoryId,
  financeSubtopic?: WizardFinanceSubtopicId | null,
): WizardTopicBatchResult | null {
  if (category !== "finance") return null;
  const preferences = readWizardTopicEditorialPreferences();
  const ratedIds = new Set(Object.keys(preferences.topics));
  const requestedSubtopic = financeSubtopic ?? null;
  const usedTitles = new Set(
    allKnownTopicTitlesForCategory("finance", {
      usedOnly: true,
      includeCatalog: false,
      includeBank: false,
      includeShownHistory: true,
    }).map(normalizeTopicTitle),
  );
  const pool = filterFinanceSubtopicSeeds(buildFinanceEditorialTopicSeeds(), requestedSubtopic).filter(
    (seed) => !ratedIds.has(`gen-finance-${seed.slug}`) && !usedTitles.has(normalizeTopicTitle(seed.title)),
  );
  if (pool.length === 0) return null;

  const recentKey = `finance:editorial_bank_v2:${requestedSubtopic ?? "all"}`;
  const recentMap = readRecentShownSeedSlugs();
  const poolSlugs = new Set(pool.map((seed) => seed.slug));
  const storedRecent = [...new Set(recentMap[recentKey] ?? [])].filter((slug) => poolSlugs.has(slug));
  // 현재 남은 은행을 한 바퀴 다 본 뒤에만 새 노출 주기를 시작한다.
  const recent = storedRecent.length >= pool.length ? [] : storedRecent;
  const recentSet = new Set(recent);
  const picked: WizardTopicSeed[] = [];
  const pickedSlugs = new Set<string>();

  // 9개 편집 유형에서 하나씩 뽑아 같은 소주제 안에서도 제목의 감정과 문장 구조가 겹치지 않게 한다.
  for (const lane of shuffleWizardItems(FINANCE_EDITORIAL_LANES)) {
    const lanePool = pool.filter((seed) => seed.editorialLane === lane && !recentSet.has(seed.slug));
    const candidate = shuffleWizardItems(lanePool)[0];
    if (!candidate || pickedSlugs.has(candidate.slug)) continue;
    picked.push(candidate);
    pickedSlugs.add(candidate.slug);
  }

  // 특정 유형이 모두 사용·폐기돼 9개가 안 되면, 다른 유형의 미노출 제목으로만 채운다.
  if (picked.length < WIZARD_TOPIC_BATCH_SIZE) {
    const freshRemainder = shuffleWizardItems(
      pool.filter((seed) => !recentSet.has(seed.slug) && !pickedSlugs.has(seed.slug)),
    );
    for (const candidate of freshRemainder) {
      picked.push(candidate);
      pickedSlugs.add(candidate.slug);
      if (picked.length >= WIZARD_TOPIC_BATCH_SIZE) break;
    }
  }
  if (picked.length === 0) return null;

  const records: WizardGeneratedTopicRecord[] = picked.map((seed) => ({
    ...seed,
    topicId: `gen-finance-${seed.slug}`,
    category: "finance",
    source: "editorial_bank",
  }));
  const existing = readWizardTopicCatalogFile();
  for (const record of records) existing[record.topicId] = record;
  if (!writeWizardTopicCatalogFile(existing)) return null;

  const recentWindowSize = pool.length;
  recentMap[recentKey] = [
    ...recent.filter((slug) => !pickedSlugs.has(slug)),
    ...picked.map((seed) => seed.slug),
  ].slice(-recentWindowSize);
  writeRecentShownSeedSlugs(recentMap);

  const topics: WizardTopic[] = records.map((record) => ({
    topicId: record.topicId,
    title: record.title,
    hook: record.hook,
    reason: record.angleNote ?? "제목부터 행동까지 함께 평가하는 편집 후보",
    scriptReady: false,
    recommended: false,
    category: "finance",
    angle: record.angle,
    source: "editorial_bank",
    financeSubtopic: record.financeSubtopic,
    problemStatement: record.problemStatement,
    twist: record.twist,
    takeawayAction: record.takeawayAction,
    editorialDecision: null,
    requiresEditorialDecision: true,
    editorialLane: record.editorialLane,
  }));
  markWizardTopicHistory("shown", topics);
  return {
    batchId: `finance-${requestedSubtopic ?? "all"}-editorial-${Date.now().toString(36)}`,
    category: "finance",
    financeSubtopic: requestedSubtopic,
    topics,
    rejected: [],
    source: "editorial_bank",
    generationNote: "새 500개 주제은행에서 서로 다른 9개 편집 유형을 한 개씩 추천했습니다.",
    model: null,
    excludedKnownTitleCount: ratedIds.size,
    editorialSummary: summarizeWizardTopicEditorialPreferences(preferences),
  };
}

/**
 * 클릭마다 새 주제 묶음을 만든다. 단순 셔플이 아니라 anti-repeat:
 * 최근에 보여준 시드(창 크기 = pool - batch)를 후보에서 빼고 뽑아서,
 * pool이 batch의 2배 이상이면 연속 두 배치는 겹치지 않는다
 * (finance 48개 기준 연속 5회 클릭 = 45개 전부 서로 다른 주제).
 * 생성된 주제는 레포 밖 카탈로그 파일에 누적 저장되어, 이후 대본/음성/영상 단계가
 * topicId만으로 같은 주제 구조를 되찾을 수 있다. 외부 API/LLM 호출 없음.
 */
export function generateWizardTopicBatch(
  category: WizardCategoryId,
  fallbackReason?: string,
  financeSubtopic?: WizardFinanceSubtopicId | null,
): WizardTopicBatchResult | null {
  const pool = category === "finance"
    ? filterFinanceSubtopicSeeds(buildFinanceEditorialTopicSeeds(), financeSubtopic ?? null)
    : TOPIC_BANK[category];
  if (!pool || pool.length === 0) return null;
  const strict = category === "finance"; // 재테크팁만 엄격 기준(콘텐츠 실패가 반복된 카테고리).

  // 1) 최근 노출 제외 — 남은 후보가 batch보다 적으면 오래된 노출부터 후보로 복귀.
  const recentMap = readRecentShownSeedSlugs();
  const recentKey = category === "finance" ? `${category}:local_bank:${financeSubtopic ?? "all"}` : category;
  const recent = recentMap[recentKey] ?? [];
  const recentSet = new Set(recent);
  const candidates = pool.filter((s) => !recentSet.has(s.slug));
  for (const slug of recent) {
    if (candidates.length >= WIZARD_TOPIC_BATCH_SIZE) break;
    const seed = pool.find((s) => s.slug === slug);
    if (seed && !candidates.includes(seed)) candidates.push(seed);
  }

  // 2) Fisher–Yates 셔플 — batch보다 넉넉히(overfetch) 확보해 품질 필터에 여유를 준다.
  const shuffled = shuffleWizardItems(candidates);
  const overfetch = shuffled.slice(0, Math.min(WIZARD_TOPIC_BATCH_SIZE * 2, shuffled.length));

  // 3) 품질 판정 → 약하면 rewrite 한 번 → 통과 후보만 상위로. 탈락 후보는 details용으로 모은다.
  type Judged = {
    seed: WizardTopicSeed;
    judgment: WizardQualityJudgment;
    rewrittenReasons: string[];
  };
  const judgedAll: Judged[] = overfetch.map((seed) => {
    let s = seed;
    let judgment = judgeTopicSeed(s, strict);
    let rewrittenReasons: string[] = [];
    if (!judgment.passed) {
      const rw = rewriteWeakSeed(s);
      if (rw.reasons.length > 0) {
        const rejudged = judgeTopicSeed(rw.seed, strict);
        // 재작성이 점수를 올린 경우에만 채택(회귀 방지).
        if (rejudged.overallScore >= judgment.overallScore) {
          s = rw.seed;
          judgment = { ...rejudged, rewriteReasons: rw.reasons };
          rewrittenReasons = rw.reasons;
        }
      }
    }
    return { seed: s, judgment, rewrittenReasons };
  });

  const HARD_FLOOR = strict ? CLAUDE_TOPIC_RECOMMEND_SCORE : 70;
  const passers = judgedAll
    .filter((j) => j.judgment.passed && j.judgment.overallScore >= HARD_FLOOR)
    .sort((a, b) => b.judgment.overallScore - a.judgment.overallScore);
  const rejects = judgedAll.filter((j) => !j.judgment.passed || j.judgment.overallScore < HARD_FLOOR);

  // 통과 후보가 batch보다 적으면(엄격 기준으로 다 걸렸을 때) 차선책으로 상위 점수 후보를 채운다.
  // 단, 절대 하한(FLOOR) 미만은 채우기에서도 제외 — 약한 후보를 화면에 그대로 내보내지 않는다.
  // (그 결과 화면 후보가 batch보다 적어질 수 있음을 허용: 품질 우선.)
  const backfill = judgedAll
    .filter((j) => !j.judgment.passed && j.judgment.overallScore >= HARD_FLOOR)
    .sort((a, b) => b.judgment.overallScore - a.judgment.overallScore);
  const ordered = passers.length >= WIZARD_TOPIC_BATCH_SIZE ? passers : [...passers, ...backfill];
  const picked: Judged[] = [];
  const pickedMechanisms = new Set<string>();
  for (const candidate of ordered) {
    if (candidate.seed.curiosityMechanismId && pickedMechanisms.has(candidate.seed.curiosityMechanismId)) continue;
    picked.push(candidate);
    if (candidate.seed.curiosityMechanismId) pickedMechanisms.add(candidate.seed.curiosityMechanismId);
    if (picked.length >= WIZARD_TOPIC_BATCH_SIZE) break;
  }

  // 4) 최근 노출 창 갱신 — 실제로 화면에 낸 seed만 기록.
  const pickedSlugs = new Set(picked.map((p) => p.seed.slug));
  const windowSize = Math.max(0, pool.length - WIZARD_TOPIC_BATCH_SIZE);
  recentMap[recentKey] = [...recent.filter((s) => !pickedSlugs.has(s)), ...picked.map((p) => p.seed.slug)].slice(-windowSize);
  writeRecentShownSeedSlugs(recentMap);

  const records: Array<WizardGeneratedTopicRecord & { _judged: Judged }> = picked.map((p) => ({
    ...p.seed,
    topicId: `gen-${category}-${p.seed.slug}`,
    category,
    _judged: p,
  }));

  // 카탈로그 병합 저장(레포 밖). topicId가 씨앗별로 고정이라 병합은 멱등이다.
  try {
    const existing = readWizardTopicCatalogFile();
    for (const r of records) {
      const { _judged, ...clean } = r;
      existing[r.topicId] = clean;
    }
    if (!writeWizardTopicCatalogFile(existing)) return null;
  } catch {
    return null; // 카탈로그를 못 쓰면 downstream 재현이 불가능하므로 fail-closed.
  }

  const batchId = `${category}-${Date.now().toString(36)}`;
  const topics: WizardTopic[] = records.map((r) => ({
    topicId: r.topicId,
    title: r.title,
    hook: r.hook,
    // 프리미엄 시드는 돈+심리+행동 구조 설명(angleNote)을 추천 이유로 그대로 보여준다.
    reason: r.angleNote ?? `${CATEGORY_LABELS[category]} · ${r.angle}형 훅`,
    scriptReady: true, // 대본 생성에 필요한 구조(title/hook/points/save)를 전부 갖는다.
    recommended: false,
    category,
    angle: r.angle,
    qualityScore: r._judged.judgment.overallScore,
    rewrittenReasons: r._judged.rewrittenReasons,
    source: "local_bank",
    financeSubtopic: r.financeSubtopic,
    noveltyNote: r.financeSubtopic ? `${FINANCE_SUBTOPIC_LABELS[r.financeSubtopic]} 소분야` : "로컬 백업 주제",
  }));
  markWizardTopicHistory("shown", topics);

  return {
    batchId,
    category,
    financeSubtopic: category === "finance" ? (financeSubtopic ?? null) : null,
    topics,
    rejected: rejects
      .sort((a, b) => b.judgment.overallScore - a.judgment.overallScore)
      .slice(0, 12)
      .map((j) => ({
        title: j.seed.title,
        overallScore: j.judgment.overallScore,
        rejectReasons: j.judgment.rejectReasons,
      })),
    source: "local_bank",
    generationNote: fallbackReason
      ? `Claude 신규 주제 생성 실패(${fallbackReason})로 로컬 백업 주제를 표시했습니다.`
      : "Claude 신규 주제 생성 실패/비활성 시 사용하는 로컬 백업 주제입니다.",
    fallbackReason,
    model: null,
    excludedKnownTitleCount: allKnownTopicTitlesForCategory(category).length,
  };
}

export async function generateWizardTopicBatchSmart(
  category: WizardCategoryId,
  opts?: { allowClaude?: boolean; fetchImpl?: typeof globalThis.fetch; financeSubtopic?: WizardFinanceSubtopicId | null },
): Promise<WizardTopicBatchResult | null> {
  const financeSubtopic = category === "finance" ? (opts?.financeSubtopic ?? null) : null;
  // 새 500개 은행을 전부 우선 사용한다. 한 묶음은 9개 편집 유형을 하나씩 담고,
  // 실제 사용하거나 Owner가 판정한 제목은 다시 추천하지 않는다.
  const editorialBatch = generateFinanceEditorialBankBatch(category, financeSubtopic);
  if (editorialBatch && editorialBatch.topics.length > 0) return editorialBatch;

  let fallbackReason = opts?.allowClaude === false ? "claude_topic_generation_disabled_by_runtime" : "not_attempted";
  if (opts?.allowClaude !== false) {
    const weakTitles: string[] = [];
    for (let attempt = 1; attempt <= CLAUDE_TOPIC_MAX_ATTEMPTS; attempt += 1) {
      const generated = await generateClaudeTopicSeeds(category, { fetchImpl: opts?.fetchImpl, attempt, avoidTitles: weakTitles, financeSubtopic });
      if (generated.ok) {
        weakTitles.push(...generated.seeds.map((s) => s.title));
        const batch = finalizeTopicBatchFromSeeds(
          category,
          generated.seeds,
          "claude_generated",
          `Claude가 신규 후보를 만들고, 이미 본/선택/제작한 주제와 유사한 것은 제외했습니다. model=${generated.model}, attempt=${attempt}`,
          { model: generated.model, financeSubtopic },
        );
        if (batch && batch.topics.length >= CLAUDE_TOPIC_MIN_DISPLAY_COUNT) return batch;
        fallbackReason = "claude_topics_below_recommendation_floor";
        continue;
      }
      fallbackReason = generated.reason;
      break;
    }
  }
  // 500개 은행 소진 뒤 AI 확장에 실패하면 빈 결과로 닫고, 사용·평가 이력은 되돌리지 않는다.
  if (category === "finance") return null;
  const localBatch = generateWizardTopicBatch(category, fallbackReason, financeSubtopic);
  return localBatch;
}

// ── 규칙 기반 대본 생성(생성 주제용) ─────────────────────────────────────────

const ANGLE_CURIOSITY: Record<WizardTopicAngle, string> = {
  반전: "많이들 반대로 알고 있는 부분이에요.",
  숫자: "기준을 알면 판단이 쉬워집니다.",
  실수: "흔한 실수부터 잡는 게 가장 빠릅니다.",
  루틴: "거창할 것 없이 순서만 지키면 됩니다.",
  심리: "이유를 알면 행동이 달라집니다.",
  꿀팁: "오늘 바로 써먹을 수 있게 정리했어요.",
};

const ANGLE_TWIST: Record<WizardTopicAngle, string> = {
  반전: "핵심은 방향을 바꾸는 것, 그게 전부입니다.",
  숫자: "숫자로 기준을 세우면 흔들리지 않아요.",
  실수: "이것만 피해도 절반은 성공입니다.",
  루틴: "작게 시작해야 오래갑니다.",
  심리: "내 탓이 아니라 구조의 문제였던 거죠.",
  꿀팁: "세 가지 중 하나만 오늘 해보세요.",
};

/** 결정적 훅/전달력 점수(같은 주제는 항상 같은 점수). 규칙 기반 추정치다. */
function estimateScores(seed: WizardTopicSeed): { hookScore: number; clarityScore: number } {
  let hook = 82;
  if (/[?까요]$/.test(seed.hook) || seed.hook.includes("?")) hook += 4;
  if (seed.hook.length <= 20) hook += 4;
  if (seed.angle === "반전" || seed.angle === "심리") hook += 3;
  let clarity = 84;
  if (seed.points.every((p) => p.length <= 20)) clarity += 5;
  if (seed.title.length <= 24) clarity += 3;
  return { hookScore: Math.min(95, hook), clarityScore: Math.min(95, clarity) };
}

/** 문장 끝에 마침표가 없으면 붙인다(낭독문 연결용). */
function endSentence(s: string): string {
  const t = s.trim();
  return /[.!?…]$/.test(t) ? t : `${t}.`;
}

// ── 로컬 품질 평가기 (judge) — 외부 API 없이 텍스트 규칙으로 후보를 점수화한다 ──
// (task: owner-web-local-script-quality-judge-rewrite-engine-v1)
// 목적: "좋아 보이는 문장을 더 쓰는" 대신, 여러 후보를 만들어 점수화하고
//       약한 후보는 rewrite하거나 탈락시켜 상위 후보만 화면에 남긴다.

/** 실제 소비/돈 생활 장면 키워드 — 제목·훅에 있으면 "내 얘기" 구체성이 산다. */
const LIVING_SCENE_KEYWORDS = [
  "월급", "배달", "구독", "카드값", "장바구니", "세일", "퇴근길", "결제", "친구", "이번 달만", "이번 한 번만",
  "할부", "택배", "잔고", "통장", "고지서", "가계부", "알림", "모임", "선물", "피드", "폰", "저축", "이체",
  "소비", "지출", "빚", "살림", "연봉", "수입", "고정비", "비상금", "씀씀이", "구입", "쇼핑", "청구서", "환불",
  "경제", "뉴스", "금리", "물가", "환율", "대출", "생활비", "가격", "마트", "점심값", "투자", "주식", "수익률",
  "집값", "월세", "전세", "주거비", "계약", "경기", "불황", "위기", "생존비", "노후", "은퇴", "복리", "현금흐름",
];
/** 화면에 실제로 보여줄 수 있는(시각화 가능) 오브젝트 키워드. */
const VISUALIZABLE_KEYWORDS = [
  "배달앱", "배달", "장바구니", "택배", "고지서", "청구서", "카드", "통장", "잔고", "결제", "알림", "폰", "화면",
  "옷", "가계부", "구독", "영수증", "지폐", "시계", "쇼핑", "피드", "은행", "앱",
  "뉴스", "그래프", "금리", "물가", "환율", "대출", "마트", "가격표", "주식", "집", "월세", "계약서", "달력",
];
/** 추상어 — 구체 행동 없이 단독으로 쓰면 "내 얘기" 느낌이 죽는다. */
const ABSTRACT_ONLY_WORDS = ["선택권", "기준선", "불안", "체면", "비교", "보상심리", "자기합리화", "미래의 나", "정체성", "충분함"];
/** 설명체/뜬구름 일반론 종결·표현 — AI 말투 감점.
 *  하십시오체 종결은 전부 "니다"로 끝난다(합니다/습니다/입힙니다/봅니다/됩니다 등) → "니다" 종결 전반을 감지. */
const AI_TONE_PATTERNS = /((?<!아)니다(?=[.!?]?(\s|$))|해야 한다|하십시오|명심하|반드시 기억)/;
const SHORTFORM_SOFT_POLITE_PATTERNS = /(거예요|이에요|예요|돼요|해요|봐요|줘요|세요|나요|어요|아요)(?=[.!?]?(\s|$))/;
/** 약한 설명형 제목 패턴(이유/방법/공통점/체크리스트류). */
const WEAK_TITLE_PATTERN = /(방법|공통점|체크리스트|리뷰법|절약법|돈 모으는 법|부자 되는 법)/;
/** 자기폭로/자기인식 어투 — "내 얘기 같다"를 만드는 표현. */
const SELF_RECOGNITION_PATTERN = /(했다면|적 있|적 없|사람들?|해 본 적|그런 적|해 봤|본 적 있|해 봤죠|비운|비웠|잠근|멈추는|미룬)/;
/** 쇼츠 제목에 필요한 직접적 후회/손실/행동 단서 — 없으면 장면만 있고 끌림이 약해진다. */
const STAKES_RESULT_PATTERN = /(후회|미뤄|미룬|못 끊|못 쓰|못 줄|안 줄|닫은|꺼두|놓친|줄어|늘어|쌓|빠져나|안 뜯|보기 싫|잔고|카드값|고지서|빚|구독|월말|취소|결제하고|결제부터|아침에|집에서|털림|당함|깨짐|흔들림|밀림|비싸|오른|망침|못 버팀|갇힘|맞음|터짐|위험|잃음|끝남|늦어|가난|발목|생존|못 모|다침|사라짐|그대로|부족|역전|달라지는|바꾸는)/;
/** 큰 비유형 제목 — 세게 보이지만 무슨 내용인지 흐려져서 추천 후보에서 감점/재작성한다. */
const BROAD_METAPHOR_TITLE_PATTERN = /(월급을 먹|한 달을 먹|통장을 비운|잔고를 잠근|통장이 무너|잔고가 먼저 무너|돈을 샌|돈은 더 빨리 샌|빚만 자란|선택권이 줄|선택지를 잠근|잡아먹|통장을 먼저 턴|통장을 먼저 때린|결제가 먼저 이긴|통장이 먼저 빈|월급을 조용히 먹|돈 문제가 자란)/;
/** 행동은 있지만 결과가 약한 제목 패턴 — 후보는 가능하지만 추천 점수는 낮춘다. */
const WEAK_ACTION_ONLY_TITLE_PATTERN = /(사진 찍|안 여는 사람|고르는 사람|하는 사람$|보는 사람$|미루는 사람$)/;
/** 새 제목 엔진 핵심: 구체 경제 현상에서 설명의 빈칸을 남기는가. */
const CURIOSITY_GAP_PATTERN = /(왜|이유|무엇|뭘까|어떻게|어떤|먼저|그대로|숨은|진짜|한 가지|놓치|정체|과정|순서|순간|차이|질문|셈일까|얼마나|역전|다르게|생기는 일|구조|신호|조건|착각|기준|필요|가르는|바꾸는|확인|변화|경우|아는가|볼 것|하려면|보이는|보여)/;
/** 예상과 실제 결과가 어긋나는 반전 구조인가. */
const ECONOMIC_CONTRADICTION_PATTERN = /(는데|인데|지만|오히려|그대로|줄었|늘었|올랐|내렸|있어도|없는데|못 |못하|안 |보다|다르|틀린|무조건 .*아닌)/;
/** 경제 뉴스가 시청자의 실제 돈과 연결되어 있는가. */
const PERSONAL_ECONOMY_IMPACT_PATTERN = /(내 |월급|생활비|카드값|대출|이자|장바구니|영수증|통장|잔고|주거비|월세|연봉|수익|계좌|비상금|노후|은퇴)/;
/** 새 500개 엔진의 제목이 돈·경제 대상을 직접 말하는가. */
const CONCRETE_MONEY_OBJECT_PATTERN = /(돈|경제|경기|불황|뉴스|숫자|금액|천만 원|영수증|가격|마트|장보기|상품|물건|메뉴|식당|식비|외식|점심값|물가|금리|환율|이자|대출|빚|부채|카드|결제|청구서|배송|구독|월급|연봉|소득|실수령액|실업률|고용|시장|생활비|장바구니|배달|세일|할인|쇼핑|소비|지출|예산|할부|리볼빙|환불|반품|구매|피드|알고리즘|항공권|축의금|명품|가방|모임|친구|선물|잔고|통장|현금|투자|수익|수수료|주식|주가|종목|손절|기업|회사|계좌|원금|매수|저축|자산|집값|부동산|집|월세|전세|보증금|주거비|관리비|계약|집주인|이사비|출퇴근|비상금|급전|보험|병원비|의료비|재정|생존|노후|복리|현금흐름|고정비|자동이체|은행|은퇴|국민연금|자녀|절약|가계부)/;
/** 질문형뿐 아니라 훈계·기준 제시형 제목도 후킹 긴장을 만들 수 있다. */
const DIRECT_MONEY_STANDARD_PATTERN = /(해야|봐야|지 않는다|지킨다|만든다|바꾼다|드러난다|중요하다|필요하다|줄여야|확인해야|계산해야|계산할|믿기 전에|알아야|기준|습관|먼저|보다|비용|비싼|중단|준비|심리|가치|달라진)/;
/** 질문형, 직접 손실, 반전, 단호한 기준 중 하나를 갖춘 제목인가. */
const EDITORIAL_HOOK_PATTERN = /(왜|이유|진짜|가장|제일|반드시|무조건|먼저|질문|한 가지|3가지|착각|실수|후회|손해|함정|위험|부족|틀리|틀린|늦|무너진|사라|잃|빚진|불안|무섭|흔들|못 |못하|안 |않|줄어|늘어|커진|더 낸|더 쓰|남는다|결정한다|바꾼다|드러난다|가른다|막힌다|놓친|무시|생기는 일|순간|굳|짧다|구조|차이|달라진|그대로다|나쁜|비싸게|싸 보|떨어|반복|빨라진|감이다|모르면|미뤄|아니다|필요할까|된다|돌려준다|봐라|해라|정해라|계산해라|버려라|의심해라|해야|봐야|기준|조건|숫자|금액|사람|심리|습관|보다|인데|지만|아니라|오히려)/;

export const WIZARD_FINANCE_SCRIPT_QUALITY_FLOOR = 86;

/** 로컬 품질 평가 결과 — 축별 0~100 점수 + 탈락/재작성 사유 + 통과 여부. */
export type WizardQualityJudgment = {
  retentionScore: number; // 첫 3초 붙잡는 힘(훅 길이·질문/반전·구체 행동)
  selfRecognitionScore: number; // "내 얘기 같다"는 자기인식
  clarityScore: number; // 요지가 한 문장으로 분명한가
  visualizabilityScore: number; // 영상으로 보여줄 장면이 있는가
  antiAiToneScore: number; // AI 말투/설명체/뜬구름 일반론이 적은가(높을수록 좋음)
  specificityScore: number; // 실제 행동/장면 구체성(추상 비유 과다 감점)
  overallScore: number; // 가중 종합
  rejectReasons: string[]; // 통과 못 한 이유(사람이 읽는 한국어)
  rewriteReasons: string[]; // 재작성으로 고친 이유(rewrite pass가 채운다)
  passed: boolean; // 최소 기준 통과 여부
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * seed(또는 rewrite된 seed) 하나를 7개 축으로 평가한다. 결정적(같은 입력→같은 점수).
 * 외부 API/LLM 없이 제목/훅/points/save 텍스트 규칙만 쓴다.
 * strict=true(재테크팁)면 통과 기준을 높인다.
 */
export function judgeTopicSeed(seed: WizardTopicSeed, strict: boolean): WizardQualityJudgment {
  const title = seed.title ?? "";
  const hook = seed.hook ?? "";
  const points = seed.points ?? [];
  const save = seed.save ?? "";
  const empathy = seed.empathy ?? "";
  const first3 = `${hook} ${empathy || points[0] || ""}`;
  const allText = `${title} ${hook} ${empathy} ${points.join(" ")} ${save}`;
  const reject: string[] = [];

  const sceneHits = LIVING_SCENE_KEYWORDS.filter((k) => title.includes(k) || hook.includes(k)).length;
  const visualHits = VISUALIZABLE_KEYWORDS.filter((k) => allText.includes(k)).length;
  const hasStakesResult = STAKES_RESULT_PATTERN.test(`${title} ${hook}`);
  const hasCuriosityGap = CURIOSITY_GAP_PATTERN.test(title);
  const hasEconomicContradiction = ECONOMIC_CONTRADICTION_PATTERN.test(title);
  const hasPersonalEconomyImpact = PERSONAL_ECONOMY_IMPACT_PATTERN.test(title);
  const hasConcreteMoneyObject = CONCRETE_MONEY_OBJECT_PATTERN.test(title);
  const hasDirectMoneyStandard = DIRECT_MONEY_STANDARD_PATTERN.test(title);
  const hasEditorialHook = EDITORIAL_HOOK_PATTERN.test(title);
  const meetsCuriosityEngineContract =
    Boolean(seed.financeSubtopic && (seed.curiosityMechanismId || seed.slug.startsWith("ai-"))) &&
    title.length >= 12 &&
    title.length <= 36 &&
    hasConcreteMoneyObject &&
    hasEditorialHook &&
    !WEAK_TITLE_PATTERN.test(title) &&
    !BROAD_METAPHOR_TITLE_PATTERN.test(title) &&
    !/[.。]$/.test(title.trim());
  const weakActionOnlyTitle = WEAK_ACTION_ONLY_TITLE_PATTERN.test(title) && !hasStakesResult;
  const abstractOnly =
    ABSTRACT_ONLY_WORDS.some((a) => title.includes(a)) &&
    !LIVING_SCENE_KEYWORDS.some((c) => title.includes(c));

  // 1) retention — 훅 길이(짧을수록↑) + 질문/반전 어투 + 첫 3초 구체 행동
  let retention = 70;
  if (hook.length <= 20) retention += 10;
  else if (hook.length > 30) retention -= 8;
  if (/[?까요죠]$/.test(hook.trim()) || hook.includes("?")) retention += 6;
  if (SELF_RECOGNITION_PATTERN.test(first3)) retention += 8;
  if (hasStakesResult) retention += 10;
  if (hasCuriosityGap) retention += 12;
  if (hasEconomicContradiction) retention += 8;
  if (!hasCuriosityGap && !hasEconomicContradiction && !hasStakesResult) {
    retention -= 18;
    reject.push("구체적인 경제 궁금증이나 예상 밖 결과가 부족합니다");
  }
  if (weakActionOnlyTitle) { retention -= 16; reject.push("행동은 보이지만 돈이 새는 결과가 약합니다"); }
  if (BROAD_METAPHOR_TITLE_PATTERN.test(title)) { retention -= 18; reject.push("제목이 비유적으로 보여 바로 이해되지 않습니다"); }
  if (sceneHits === 0) { retention -= 12; reject.push("첫 3초에 붙잡을 실제 행동이 약합니다"); }

  // 2) selfRecognition — 자기폭로 어투 + 생활 장면
  let self = 60;
  if (SELF_RECOGNITION_PATTERN.test(`${title} ${hook}`)) self += 22;
  if (sceneHits >= 1) self += 10;
  if (sceneHits >= 2) self += 6;
  if (hasStakesResult) self += 8;
  if (hasPersonalEconomyImpact) self += 12;
  if (weakActionOnlyTitle) self -= 10;
  if (!SELF_RECOGNITION_PATTERN.test(`${title} ${hook}`) && sceneHits === 0) {
    self -= 18;
    reject.push("'내 얘기 같다'는 자기인식이 약합니다");
  }

  // 3) clarity — 요지가 한 문장으로 분명한가(points 길이·접속 과다)
  let clarity = 80;
  if (points.every((p) => p.length <= 22)) clarity += 8;
  const longPoints = points.filter((p) => p.length > 26).length;
  if (longPoints > 0) { clarity -= longPoints * 6; reject.push("핵심 문장이 한눈에 안 들어옵니다"); }

  // 4) visualizability — 화면에 보여줄 오브젝트가 있는가
  let visual = 62;
  if (seed.visualMetaphor && seed.visualMetaphor.length > 0) visual += 14;
  if (visualHits >= 1) visual += 12;
  if (visualHits >= 3) visual += 6;
  if (visualHits === 0 && !seed.visualMetaphor) { visual -= 14; reject.push("영상으로 보여줄 장면이 부족합니다"); }

  // 5) antiAiTone — 설명체/뜬구름 일반론이 적을수록↑
  let antiAi = 92;
  const aiHitList = [hook, ...points, empathy].filter((t) => AI_TONE_PATTERNS.test(t));
  if (aiHitList.length > 0) { antiAi -= aiHitList.length * 14; reject.push("설명체 말투가 남아 있어요"); }
  if (WEAK_TITLE_PATTERN.test(title)) { antiAi -= 20; reject.push("제목에 이유/방법/공통점류 설명형 패턴이 있습니다"); }
  if (BROAD_METAPHOR_TITLE_PATTERN.test(title)) { antiAi -= 14; reject.push("AI가 만든 듯한 큰 비유형 제목입니다"); }
  if (weakActionOnlyTitle) antiAi -= 8;

  // 6) specificity — 실제 행동/장면 구체성(추상 단독 감점)
  let specificity = 66;
  specificity += Math.min(24, sceneHits * 8);
  if (hasStakesResult) specificity += 10;
  if (hasCuriosityGap) specificity += 8;
  if (hasEconomicContradiction) specificity += 6;
  if (abstractOnly) { specificity -= 22; reject.push("추상어가 구체 행동 없이 단독으로 쓰였습니다"); }
  if (BROAD_METAPHOR_TITLE_PATTERN.test(title)) specificity -= 18;
  if (/[.。]$/.test(title.trim())) { specificity -= 6; }

  const scores = {
    retentionScore: clamp(retention),
    selfRecognitionScore: clamp(self),
    clarityScore: clamp(clarity),
    visualizabilityScore: clamp(visual),
    antiAiToneScore: clamp(antiAi),
    specificityScore: clamp(specificity),
  };
  // 고정 골드뱅크와 소진 후 AI 확장은 경제 현상·손실·반전·행동 기준으로 자기인식을
  // 만든다. 동일한 전용 계약을 모두 통과한 경우에만 각 축의 추천급 하한을 보장한다.
  if (meetsCuriosityEngineContract) {
    scores.retentionScore = Math.max(scores.retentionScore, 92);
    scores.selfRecognitionScore = Math.max(scores.selfRecognitionScore, 90);
    scores.clarityScore = Math.max(scores.clarityScore, 90);
    scores.visualizabilityScore = Math.max(scores.visualizabilityScore, 88);
    scores.antiAiToneScore = Math.max(scores.antiAiToneScore, 92);
    scores.specificityScore = Math.max(scores.specificityScore, 88);
  }
  // 가중 종합 — 자기인식·retention·antiAi를 무겁게(콘텐츠 실패 원인 축).
  const overall = clamp(
    scores.retentionScore * 0.22 +
      scores.selfRecognitionScore * 0.24 +
      scores.clarityScore * 0.14 +
      scores.visualizabilityScore * 0.12 +
      scores.antiAiToneScore * 0.16 +
      scores.specificityScore * 0.12,
  );
  const passThreshold = strict ? WIZARD_FINANCE_SCRIPT_QUALITY_FLOOR : 72;
  const passed =
    overall >= passThreshold &&
    !AI_TONE_PATTERNS.test(hook) &&
    !WEAK_TITLE_PATTERN.test(title) &&
    (hasEditorialHook || hasCuriosityGap || hasEconomicContradiction || hasStakesResult || hasDirectMoneyStandard);
  return { ...scores, overallScore: overall, rejectReasons: [...new Set(reject)], rewriteReasons: [], passed };
}

/**
 * 약한 seed를 로컬 규칙으로 한 번 재작성한다(외부 API 없음). 고친 부분은 rewriteReasons에 남긴다.
 * - 설명체 종결(~습니다/됩니다/입니다/셉니다) → 단정형(~다)
 * - 제목의 이유/방법/공통점류 → 잘라내고 자기폭로형으로
 * - 추상어 단독 제목 → 생활 장면 힌트를 덧붙임(가능할 때만)
 * 재작성해도 못 살리면 passed=false를 유지해 상위 후보에서 탈락시킨다.
 */
export function rewriteWeakSeed(seed: WizardTopicSeed): { seed: WizardTopicSeed; reasons: string[] } {
  const reasons: string[] = [];
  const directTitle = (title: string): string => {
    if (!BROAD_METAPHOR_TITLE_PATTERN.test(title)) return title;
    const source = `${title} ${seed.hook} ${seed.moneyAnchor ?? ""} ${seed.psychologyAnchor ?? ""}`;
    if (/구독|정기|자동결제/.test(source)) return "안 쓰는 구독 해지를 계속 미룬 사람";
    if (/배달|주문/.test(source)) return "월급날 첫 결제가 한 달 소비를 정함";
    if (/월급|입금|저축|목표/.test(source)) return "월급날 첫 결제부터 하고 있었다면";
    if (/카드값|고지서|청구서/.test(source)) return "카드값 보기 싫은 사람이 결제는 더 쉽게 함";
    if (/친구|모임|피드|하이라이트|체면|남 눈|비교/.test(source)) return "인스타 비교가 시작되면 카드가 먼저 흔들림";
    if (/새벽|밤|폰|택배|장바구니/.test(source)) return "새벽에 결제하고 아침에 후회한 사람";
    if (/세일|할인|쿠폰/.test(source)) return "세일 알림 뜨자마자 결제부터 한 사람";
    if (/작은|몇 천|소액/.test(source)) return "작은 결제라 넘기다 월말에 놀란 사람";
    if (/퇴근|힘든|보상|위로/.test(source)) return "힘든 날 고생했다며 결제부터 한 사람";
    if (/연봉|수입/.test(source)) return "수입 늘었는데 남는 돈이 없는 사람";
    if (/빚|대출|이자/.test(source)) return "빚 숫자 보기 싫어 앱을 닫은 사람";
    return "결제하고 나서 바로 후회한 사람";
  };
  const declarativize = (s: string): string => {
    let out = s;
    const before = out;
    out = out
      .replace(/됩니다(?=[.!?]?$)/, "된다")
      .replace(/입니다(?=[.!?]?$)/, "이다")
      .replace(/셉니다(?=[.!?]?$)/, "세다")
      .replace(/합니다(?=[.!?]?$)/, "한다")
      .replace(/습니다(?=[.!?]?$)/, "다");
    if (out !== before) reasons.push("설명체 종결을 단정형으로 고침");
    return out;
  };

  const next: WizardTopicSeed = {
    ...seed,
    title: directTitle(seed.title),
    hook: declarativize(seed.hook),
    empathy: seed.empathy ? declarativize(seed.empathy) : seed.empathy,
    points: seed.points.map((p) => declarativize(p)) as [string, string, string],
  };
  if (next.title !== seed.title) reasons.push("비유형 제목을 실제 행동 제목으로 고침");

  // 제목의 약한 설명형 패턴을 제거(끝에 붙은 "…의 이유" 등을 잘라낸다).
  if (WEAK_TITLE_PATTERN.test(next.title)) {
    const trimmed = next.title
      .replace(/,?\s*그?\s*(진짜\s*)?(이유|방법|공통점|체크리스트|리뷰법|절약법)$/, "")
      .replace(/(이유|방법|공통점|체크리스트|리뷰법|절약법)/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (trimmed.length >= 8 && trimmed !== next.title) {
      next.title = trimmed;
      reasons.push("제목의 설명형(이유/방법)을 걷어냄");
    }
  }

  return { seed: next, reasons: [...new Set(reasons)] };
}

const WIZARD_SCRIPT_MIN_SCENE_COUNT = 4;
const WIZARD_SCRIPT_MAX_SCENE_COUNT = 18;
const WIZARD_CAPTION_MAX_CHARS = 34;
const WIZARD_SCRIPT_FULL_VOICEOVER_MAX_CHARS = 1200;
const WIZARD_SCRIPT_SCENE_NARRATION_MAX_CHARS = 260;
const WIZARD_SCRIPT_MIN_SHORT_LINES = 22;
const WIZARD_SCRIPT_MAX_SHORT_LINES = 45;
const WIZARD_SCENE_MIN_SEC = 5;
const WIZARD_SCENE_MAX_SEC = 12;
const WIZARD_SCENE_CHARS_PER_SEC = 7;

function isSupportedWizardSceneCount(count: number): boolean {
  return count >= WIZARD_SCRIPT_MIN_SCENE_COUNT && count <= WIZARD_SCRIPT_MAX_SCENE_COUNT;
}

function trimWizardCaption(text: string, max = WIZARD_CAPTION_MAX_CHARS): string {
  const t = (String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0) ?? "").replace(/\s+/g, " ");
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

function countNarrationLines(text: string): number {
  return String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0).length;
}

function buildWizardSceneTimeline(narrations: string[]): { durations: number[]; starts: number[]; ends: number[]; totalDurationSec: number } {
  const durations = narrations.map((n) => Math.min(
    WIZARD_SCENE_MAX_SEC,
    Math.max(WIZARD_SCENE_MIN_SEC, Math.ceil(String(n ?? "").trim().length / WIZARD_SCENE_CHARS_PER_SEC)),
  ));
  const starts: number[] = [];
  const ends: number[] = [];
  let acc = 0;
  for (const d of durations) {
    starts.push(acc);
    acc += d;
    ends.push(acc);
  }
  return { durations, starts, ends, totalDurationSec: acc };
}

/** 장면 플랜 1칸 — 7단계(문제 훅→상황→결과→심리→전환→실천→추천)에 1:1 대응. */
export type WizardScriptScene = {
  id: "hook" | "problem" | "situation" | "consequence" | "psychology" | "mindset" | "habit" | "recommendation" | "save";
  label: string;
  narration: string;
  captionText: string;
  visualCue: string; // 이 장면이 어떤 그림/시각 증거로 보여야 하는지(골든 샘플: 이미지가 스토리의 증거)
  visualEvidence?: FinanceVisualEvidence;
  /** 실제 미디어 방식. layered motion과 별개이며, veo_motion만 Flow 후보가 된다. */
  mediaStrategy?: SceneMediaStrategy;
  mediaStrategyOverride?: SceneMediaStrategyOverride;
  mediaStrategyContractVersion?: typeof VEO_SCENE_SELECTION_CONTRACT_VERSION;
  mediaStrategySource?: SceneMediaStrategySource;
  mediaStrategyScore?: number;
  mediaStrategyReasonCodes?: string[];
  mediaStrategyMaxVeoScenes?: number;
  mediaStrategyTotalDurationSec?: number;
};

/** 모든 장면을 영상화하지 않고, 행동성이 가장 큰 1~2개 장면만 Veo 후보로 만든다. */
export function applyWizardSceneMediaStrategies(scenes: WizardScriptScene[]): WizardScriptScene[] {
  const narrations = scenes.map((scene) => String(scene.narration ?? "").trim() || String(scene.captionText ?? "").trim());
  const timeline = buildWizardSceneTimeline(narrations);
  const plan = selectVeoMotionScenes(
    scenes.map((scene, index) => ({
      sceneNumber: index + 1,
      sceneRole: scene.id,
      narration: narrations[index],
      visualCue: scene.visualCue,
      visibleAction: scene.visualEvidence?.visibleAction,
      motionPlan: scene.visualEvidence?.motionPlan,
      override: scene.mediaStrategyOverride ?? "auto",
    })),
    timeline.totalDurationSec,
  );
  const decisions = new Map(plan.decisions.map((decision) => [decision.sceneNumber, decision]));
  return scenes.map((scene, index) => {
    const decision = decisions.get(index + 1);
    if (!decision) throw new Error(`veo_scene_selection_decision_missing:${index + 1}`);
    return {
      ...scene,
      mediaStrategy: decision.mediaStrategy,
      mediaStrategyContractVersion: plan.contractVersion,
      mediaStrategySource: decision.source,
      mediaStrategyScore: decision.score,
      mediaStrategyReasonCodes: decision.reasonCodes,
      mediaStrategyMaxVeoScenes: plan.maxVeoMotionScenes,
      mediaStrategyTotalDurationSec: plan.totalDurationSec,
    };
  });
}

function wizardSceneMediaStrategiesAreValid(scenes: readonly WizardScriptScene[]): boolean {
  if (scenes.length === 0) return false;
  const totalDurationSec = buildWizardSceneTimeline(scenes.map((scene) => scene.narration)).totalDurationSec;
  const maxVeoMotionScenes = getVeoMotionSceneLimit(totalDurationSec);
  const selectedCount = scenes.filter((scene) => scene.mediaStrategy === "veo_motion").length;
  return selectedCount <= maxVeoMotionScenes && scenes.every((scene) =>
    scene.mediaStrategyContractVersion === VEO_SCENE_SELECTION_CONTRACT_VERSION &&
    (scene.mediaStrategy === "still" || scene.mediaStrategy === "veo_motion") &&
    (scene.mediaStrategySource === "automatic" || scene.mediaStrategySource === "manual_override" || scene.mediaStrategySource === "budget_cap") &&
    Number.isFinite(scene.mediaStrategyScore) &&
    Array.isArray(scene.mediaStrategyReasonCodes) &&
    scene.mediaStrategyMaxVeoScenes === maxVeoMotionScenes &&
    scene.mediaStrategyTotalDurationSec === totalDurationSec
  );
}

export type WizardSpeechDirection = {
  engineVersion: "money_shorts_speech_direction_v2";
  delivery: "direct_hook" | "low_warning" | "conversational" | "firm_result" | "reflective" | "decisive_turn" | "practical" | "assured" | "calm_close";
  intent: string;
  pace: "brisk" | "natural" | "measured";
  intensity: number;
  emphasisWords: string[];
  performanceText: string;
  segments: Array<{
    text: string;
    pauseAfterMs: number;
    cadence: "continue_rise" | "contrast_pivot" | "list_build" | "firm_land" | "command_land";
    emphasisWords: string[];
  }>;
  contextPolicy: "continuous_full_script";
  v3AudioTag: string;
  topicProfileId: WizardTopicSpeechProfile["id"];
  voiceTuning: {
    stabilityDelta: number;
    styleDelta: number;
    speedDelta: number;
  };
};

export type WizardTopicSpeechProfile = {
  engineVersion: "money_shorts_topic_voice_profile_v2";
  id: "economic_authority" | "discipline_coach" | "wealth_conviction" | "reassuring_control" | "social_insight";
  speakerStance: string;
  arc: string;
  globalV3Tag: string;
  baseSpeed: number;
  baseStability: number;
  baseSimilarityBoost: number;
  baseStyle: number;
};

export type WizardSampleReviewCaptionCue = {
  displayText: string;
  anchorText: string;
};

export function isWizardAvSampleReviewTopic(topicId: string): boolean {
  return topicId === WIZARD_AV_SAMPLE_REVIEW_TOPIC_ID;
}

function wizardVisualProfileForTopic(topicId: string): {
  engineVersion: string;
  imagesDir: string;
  videoDir: string;
} {
  void topicId;
  return {
    engineVersion: WIZARD_VISUAL_ENGINE_VERSION,
    imagesDir: WIZARD_VISUAL_OUTPUT_DIR,
    videoDir: WIZARD_REAL_VIDEO_OUTPUT_DIR,
  };
}

type WizardSpeechRoleProfile = Omit<
  WizardSpeechDirection,
  "engineVersion" | "emphasisWords" | "performanceText" | "segments" | "contextPolicy" | "topicProfileId"
> & { linePauseMs: number };

const WIZARD_SPEECH_ROLE_PROFILES: Record<WizardScriptScene["id"], WizardSpeechRoleProfile> = {
  hook: {
    delivery: "direct_hook",
    intent: "첫 문장을 낮고 단단하게 착지시키고, 과장 문구도 빠르게 몰아치지 않은 채 확신 있게 붙잡는다",
    pace: "natural",
    intensity: 0.84,
    linePauseMs: 200,
    v3AudioTag: "confidently",
    voiceTuning: { stabilityDelta: -0.02, styleDelta: 0.02, speedDelta: -0.01 },
  },
  problem: {
    delivery: "low_warning",
    intent: "목소리를 살짝 낮춰 숨은 문제를 경고하되 과장하지 않는다",
    pace: "measured",
    intensity: 0.72,
    linePauseMs: 190,
    v3AudioTag: "seriously",
    voiceTuning: { stabilityDelta: 0.01, styleDelta: 0, speedDelta: -0.01 },
  },
  situation: {
    delivery: "conversational",
    intent: "시청자 경험을 떠올리게 하는 자연스러운 대화체로 읽는다",
    pace: "natural",
    intensity: 0.54,
    linePauseMs: 170,
    v3AudioTag: "conversationally",
    voiceTuning: { stabilityDelta: 0.03, styleDelta: 0, speedDelta: 0 },
  },
  consequence: {
    delivery: "firm_result",
    intent: "경제적 결과와 손실 단어를 또렷하게 눌러 말한다",
    pace: "measured",
    intensity: 0.78,
    linePauseMs: 210,
    v3AudioTag: "firmly",
    voiceTuning: { stabilityDelta: 0, styleDelta: 0.01, speedDelta: -0.01 },
  },
  psychology: {
    delivery: "reflective",
    intent: "비난보다 자기인식이 생기도록 조금 낮고 생각하듯 읽는다",
    pace: "measured",
    intensity: 0.5,
    linePauseMs: 230,
    v3AudioTag: "thoughtfully",
    voiceTuning: { stabilityDelta: 0.04, styleDelta: 0, speedDelta: -0.02 },
  },
  mindset: {
    delivery: "decisive_turn",
    intent: "방향 전환부터 에너지를 올리고 새로운 기준을 단단하게 제시한다",
    pace: "natural",
    intensity: 0.76,
    linePauseMs: 180,
    v3AudioTag: "confidently",
    voiceTuning: { stabilityDelta: -0.02, styleDelta: 0.02, speedDelta: 0.02 },
  },
  habit: {
    delivery: "practical",
    intent: "실천 순서가 귀에 들어오도록 차분하고 명료하게 읽는다",
    pace: "natural",
    intensity: 0.66,
    linePauseMs: 190,
    v3AudioTag: "clearly",
    voiceTuning: { stabilityDelta: 0.02, styleDelta: 0, speedDelta: 0 },
  },
  recommendation: {
    delivery: "assured",
    intent: "성공 기준을 설득하려 하지 말고 확신 있게 정리한다",
    pace: "measured",
    intensity: 0.65,
    linePauseMs: 220,
    v3AudioTag: "confidently",
    voiceTuning: { stabilityDelta: 0.01, styleDelta: 0.01, speedDelta: -0.01 },
  },
  save: {
    delivery: "calm_close",
    intent: "여유는 유지하되 핵심 기준과 저장 행동을 확신 있게 내려 찍으며 끝낸다",
    pace: "measured",
    intensity: 0.72,
    linePauseMs: 210,
    v3AudioTag: "confident",
    voiceTuning: { stabilityDelta: 0.01, styleDelta: 0.01, speedDelta: -0.02 },
  },
};

export function buildWizardTopicSpeechProfile(
  title: string,
  fullVoiceover: string,
  opts?: { topicId?: string },
): WizardTopicSpeechProfile {
  const text = `${title} ${fullVoiceover}`;
  if (isWizardAvSampleReviewTopic(String(opts?.topicId ?? ""))) {
    return {
      engineVersion: "money_shorts_topic_voice_profile_v2",
      id: "reassuring_control",
      speakerStance: "주거 불안을 키우지 않고 현실을 짚은 뒤 차분하게 통제감을 되찾게 하는 화자",
      arc: "낮고 여유 있는 문제 제기 → 충분한 호흡의 인과 설명 → 감당 가능한 기준 → 차분한 행동 제안",
      globalV3Tag: "thoughtful",
      baseSpeed: 0.91,
      baseStability: 0.56,
      baseSimilarityBoost: 0.87,
      baseStyle: 0,
    };
  }
  if (/소비|결제|세일|할인|월급날|습관|성공|의지|환경|미루|끊어|가난/.test(text)) {
    return {
      engineVersion: "money_shorts_topic_voice_profile_v2",
      id: "discipline_coach",
      speakerStance: "화를 내지 않지만 잘못된 습관을 숨기지 않고 지적하는 단단한 코치",
      arc: "짧고 강한 지적 → 자기인식 → 기준 전환 → 실행 명령을 확신 있게 마무리",
      globalV3Tag: "confident",
      baseSpeed: 1.02,
      baseStability: 0.48,
      baseSimilarityBoost: 0.86,
      baseStyle: 0,
    };
  }
  if (/투자|주식|자산|복리|저축|수익률|노후|장기|기회/.test(text)) {
    return {
      engineVersion: "money_shorts_topic_voice_profile_v2",
      id: "wealth_conviction",
      speakerStance: "과장 없이 숫자와 장기 기준을 믿게 만드는 침착하고 자신감 있는 화자",
      arc: "관심을 붙잡기 → 손익 기준을 또렷이 설명 → 장기 행동에 확신을 부여",
      globalV3Tag: "confident",
      baseSpeed: 0.99,
      baseStability: 0.52,
      baseSimilarityBoost: 0.87,
      baseStyle: 0,
    };
  }
  if (/불안|회피|두려|걱정|비상금|위기|불황|충격|잔고/.test(text)) {
    return {
      engineVersion: "money_shorts_topic_voice_profile_v2",
      id: "reassuring_control",
      speakerStance: "불안을 키우지 않고 현실을 직시시킨 뒤 통제감을 되찾게 하는 화자",
      arc: "낮은 경고 → 공감 → 통제 가능한 기준 → 안심이 아니라 행동으로 마무리",
      globalV3Tag: "serious",
      baseSpeed: 0.97,
      baseStability: 0.54,
      baseSimilarityBoost: 0.87,
      baseStyle: 0,
    };
  }
  if (/SNS|인스타|비교|체면|남 눈|친구|모임|심리/.test(text)) {
    return {
      engineVersion: "money_shorts_topic_voice_profile_v2",
      id: "social_insight",
      speakerStance: "사람의 심리를 꿰뚫어 보되 비웃지 않는 관찰력 있는 화자",
      arc: "낯익은 행동 포착 → 불편한 심리 지적 → 돈의 결과 → 새로운 기준 제시",
      globalV3Tag: "thoughtful",
      baseSpeed: 1,
      baseStability: 0.5,
      baseSimilarityBoost: 0.86,
      baseStyle: 0,
    };
  }
  return {
    engineVersion: "money_shorts_topic_voice_profile_v2",
    id: "economic_authority",
    speakerStance: "경제 신호를 내 돈의 결과로 번역해 주는 자신감 있고 믿을 만한 해설자",
    arc: "강한 문제 제기 → 차분한 인과 설명 → 손실을 단단히 강조 → 행동 기준을 확신 있게 마무리",
    globalV3Tag: "confident",
    baseSpeed: 1,
    baseStability: 0.5,
    baseSimilarityBoost: 0.87,
    baseStyle: 0,
  };
}

const WIZARD_SPEECH_EMPHASIS_PHRASES = [
  "내 돈", "내 지출", "내 빚", "내 월급", "생활비", "카드값", "대출 이자", "현금흐름",
  "물가", "금리", "대출", "이자", "월급", "소비", "저축", "자산", "복리", "비상금",
  "계속 늦어", "제일 비싸게", "진짜 문제", "이유를 모르는", "선택지", "습관", "기준",
] as const;

function splitWizardSpeechSegments(narration: string): string[] {
  return String(narration ?? "")
    .split(/\r?\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0)
    .slice(0, 12);
}

const WIZARD_SPEECH_CONNECTIVE_END_PATTERN = /(?:건|것은|사람은|게|보다|아니라|하지만|그런데|는데|다면|하면|라면|때문에|해서|라서|면서|거나|든지|수록|려고|니까|므로|고|며|지만|반면)$/;
const WIZARD_SPEECH_LIST_END_PATTERN = /(?:는지|인지|을지|ㄹ지)$/;
const WIZARD_SPEECH_COMMAND_END_PATTERN = /(?:봐|둬|해|끊어|물어봐|바꿔|확인해)$/;
const WIZARD_SPEECH_PIVOT_START_PATTERN = /^(?:근데|하지만|물론|그러면|결국|그래서|반대로|문제는)/;

function buildWizardSpeechSegment(
  text: string,
  role: WizardScriptScene["id"],
  index: number,
  isLast: boolean,
  continuesAfterScene: boolean,
  emphasisWords: string[],
  linePauseMs: number,
): WizardSpeechDirection["segments"][number] {
  const clean = text.trim();
  if (!clean) return { text: "", pauseAfterMs: 0, cadence: "firm_land", emphasisWords: [] };
  const withoutTerminal = clean.replace(/[.!?…,:;]+$/, "").trimEnd();
  const localEmphasis = emphasisWords.filter((word) => withoutTerminal.includes(word));
  const isQuestion = /(왜|뭘까|무엇일까|일까|맞을까|알까)$/.test(withoutTerminal);
  const isCommand = WIZARD_SPEECH_COMMAND_END_PATTERN.test(withoutTerminal);
  const isListBuild = !isLast && WIZARD_SPEECH_LIST_END_PATTERN.test(withoutTerminal);
  const isContinuation = (!isLast || continuesAfterScene) && WIZARD_SPEECH_CONNECTIVE_END_PATTERN.test(withoutTerminal);
  const isPivot = WIZARD_SPEECH_PIVOT_START_PATTERN.test(withoutTerminal);
  const cadence: WizardSpeechDirection["segments"][number]["cadence"] = isListBuild
    ? "list_build"
    : isContinuation
      ? "continue_rise"
      : isCommand
        ? "command_land"
        : isPivot && index > 0
          ? "contrast_pivot"
          : "firm_land";
  const terminal = isQuestion ? "?" : cadence === "continue_rise" || cadence === "list_build" ? "," : ".";
  const emphasizedText = /^(?:결국|진짜|최소한)\s/.test(withoutTerminal)
    ? withoutTerminal.replace(/^(결국|진짜|최소한)\s/, "$1, ")
    : withoutTerminal;
  return {
    text: `${emphasizedText}${terminal}`,
    pauseAfterMs: isLast ? 0 : cadence === "contrast_pivot" ? linePauseMs + 40 : cadence === "continue_rise" ? Math.max(80, linePauseMs - 60) : linePauseMs,
    cadence,
    emphasisWords: localEmphasis,
  };
}

function pickWizardSpeechEmphasisWords(narration: string): string[] {
  const compact = String(narration ?? "").replace(/\s+/g, " ");
  const matches = WIZARD_SPEECH_EMPHASIS_PHRASES
    .filter((phrase) => compact.includes(phrase))
    .sort((a, b) => b.length - a.length);
  return [...new Set(matches)].slice(0, 3);
}

/** 화면 대본의 단어와 의미는 유지하고, TTS가 읽을 호흡·강조·장면 역할만 별도 계약으로 만든다. */
export function buildWizardSpeechDirection(
  scene: Pick<WizardScriptScene, "id" | "narration">,
  opts?: { topicProfile?: WizardTopicSpeechProfile; sceneIndex?: number; sceneCount?: number; sampleReview?: boolean },
): WizardSpeechDirection {
  const profile = WIZARD_SPEECH_ROLE_PROFILES[scene.id];
  const topicProfile = opts?.topicProfile ?? buildWizardTopicSpeechProfile("", scene.narration);
  const continuesAfterScene =
    typeof opts?.sceneIndex === "number" &&
    typeof opts?.sceneCount === "number" &&
    opts.sceneIndex < opts.sceneCount - 1;
  const rawSegments = splitWizardSpeechSegments(scene.narration);
  const sourceSegments = rawSegments.length > 0 ? rawSegments : [String(scene.narration ?? "").trim()];
  const emphasisWords = pickWizardSpeechEmphasisWords(scene.narration);
  const reviewLinePauseMs = opts?.sampleReview
    ? scene.id === "psychology" || scene.id === "mindset" ? 500 : scene.id === "hook" ? 420 : 440
    : profile.linePauseMs;
  const segments = sourceSegments
    .map((text, index) => buildWizardSpeechSegment(
      text,
      scene.id,
      index,
      index === sourceSegments.length - 1,
      continuesAfterScene,
      emphasisWords,
      reviewLinePauseMs,
    ))
    .filter((segment) => segment.text.length > 0);
  return {
    engineVersion: "money_shorts_speech_direction_v2",
    delivery: profile.delivery,
    intent: profile.intent,
    pace: profile.pace,
    intensity: profile.intensity,
    emphasisWords,
    performanceText: segments.map((segment) => segment.text).join("\n"),
    segments,
    contextPolicy: "continuous_full_script",
    v3AudioTag: scene.id === "save" ? "confident" : profile.v3AudioTag,
    topicProfileId: topicProfile.id,
    voiceTuning: {
      ...profile.voiceTuning,
      speedDelta: profile.voiceTuning.speedDelta + (topicProfile.baseSpeed - 1),
    },
  };
}

function buildWizardSampleReviewCaptionCues(sceneNumber: number): WizardSampleReviewCaptionCue[] {
  const cues: Record<number, WizardSampleReviewCaptionCue[]> = {
    1: [
      { displayText: "월세가 싸도", anchorText: "월세 내는 날마다" },
      { displayText: "더 비쌀 수 있다", anchorText: "싼 월세도" },
    ],
    2: [
      { displayText: "월세 숫자만 보면", anchorText: "월세 숫자만 비교하면" },
      { displayText: "관리비 + 교통비 + 시간", anchorText: "관리비와 교통비, 더 긴 출퇴근 시간" },
    ],
    3: [
      { displayText: "숨은 월비용", anchorText: "숨어 있던 월비용" },
      { displayText: "남는 돈은 감소", anchorText: "매달 남는 돈은 더 줄 수 있어" },
    ],
    4: [
      { displayText: "뒤처질까 불안할 때", anchorText: "집에서 뒤처졌다는 불안이 커지면" },
      { displayText: "기회보다 감당 금액", anchorText: "감당할 수 있는 금액보다 놓칠 것 같은 기회" },
    ],
    5: [
      { displayText: "좋은 집보다", anchorText: "가장 좋은 집" },
      { displayText: "오래 감당할 집", anchorText: "오래 감당해도 다른 선택이 남는 집" },
      { displayText: "감정이 결정 못하게", anchorText: "감정이 결정할 수 없는" },
    ],
    6: [
      { displayText: "계약 전 총주거비", anchorText: "월세 계약 전에" },
      { displayText: "월세 + 관리비 + 이동비", anchorText: "월세와 관리비, 이동비" },
    ],
    7: [
      { displayText: "바로 계약하고 싶을 때", anchorText: "바로 계약하고 싶을 때" },
      { displayText: "다시 보고 저장", anchorText: "다시 봐" },
    ],
    8: [
      { displayText: "함께 지키기", anchorText: "집과 현금흐름을 함께 지키는" },
      { displayText: "기준도 계속", anchorText: "기준도 계속 알려줄" },
    ],
  };
  return cues[sceneNumber] ?? [];
}

type WizardVisualMode =
  | "economy_signal"
  | "inflation_pressure"
  | "interest_debt"
  | "consumption_trigger"
  | "social_comparison"
  | "income_routine"
  | "wealth_building"
  | "housing_debt"
  | "risk_alert"
  | "future_time"
  | "habit_reset";

type WizardVisualDna = {
  id: string;
  mode: WizardVisualMode;
  objectSet: string;
  supportSet: string;
  composition: string;
  camera: string;
  accent: string;
  mood: string;
  pressure: string;
  toneArc: "bright_progress" | "warning_to_clarity" | "neutral_analysis" | "warm_everyday";
};

const WIZARD_VISUAL_OBJECT_POOLS: Record<WizardVisualMode, readonly string[]> = {
  economy_signal: [
    "smartphone with abstract news blocks, torn newspaper shapes, card bill, grocery receipt, small unlabeled line chart",
    "paycheck envelope, news clippings, price tag shapes, credit card, calendar pages",
    "banking app silhouette, receipt roll, grocery basket, city blocks, simple interest-rate symbols",
  ],
  inflation_pressure: [
    "grocery basket, long receipt roll, price tag shapes, wallet, shrinking paycheck envelope",
    "milk bottle, bread, vegetables, receipt stack, credit card, rising chart blocks",
    "shopping cart, household bill envelope, coins, calendar, abstract price arrows",
  ],
  interest_debt: [
    "loan folder, apartment key, credit card statement, calendar, household budget notebook",
    "installment slips, repayment envelope, wallet, desk calendar, warm home-office stationery",
    "mortgage folder, calculator without numbers, card bill, monthly planner, apartment entry shelf",
  ],
  consumption_trigger: [
    "smartphone checkout screen shape, shopping bag, delivery box, credit card, scattered receipts",
    "one-click payment button silhouette, cart icon shape, wallet, notification blocks, parcel tape",
    "sale tag shapes, card, receipt stack, package box, small impulse objects",
  ],
  social_comparison: [
    "glossy social feed rectangles, credit card, empty wallet, shopping bag, mirror-like screen",
    "party receipt, gift box, menu card without text, wallet, split-bill phone shapes",
    "unbranded shopping bag, bank card, muted balance screen, cafe table and a natural adult reaction",
  ],
  income_routine: [
    "paycheck envelope, transfer arrows, calendar, automatic-payment slips, wallet",
    "salary notification phone shape, divided envelopes, card bill, rent slip, small coins",
    "desk calendar, budget notebook without text, paycheck envelope, bank card, receipt roll",
  ],
  wealth_building: [
    "organized savings envelopes, calendar, transfer slip, wallet and a quiet progress card",
    "small coin jar, long-term planner, notebook, phone banking shape and wall clock",
    "spending and saving folders separated on a home desk, envelope, card and restrained progress chart",
  ],
  housing_debt: [
    "real apartment entry shelf, lease folder, key ring, calendar and fixed-cost envelopes",
    "bright living-room table, rent envelope, calculator, calendar and open contract folder",
    "apartment window view, contract papers without text, wallet, key and monthly-cost planner",
  ],
  risk_alert: [
    "open wallet beside a higher bill, card statement, grocery basket and emergency envelope",
    "emergency fund jar, plain reminder card, debt envelope, bright calendar and steady hands sorting them",
    "paycheck envelope, card, several receipts and a simple downward chart reviewed at a dining table",
  ],
  future_time: [
    "calendar pages, future envelope, wallet, small coin jar and warm afternoon window light",
    "wall clock, retirement folder without text, planner, paycheck envelope and organized savings boxes",
    "today and future budget folders on one desk, transfer slip, family calendar and muted chart",
  ],
  habit_reset: [
    "clean desk, checklist card without text, calendar, wallet, one paused credit card",
    "phone set aside, sorted envelopes, small habit tracker blocks, pen, receipt pile",
    "before-and-after spending pile, tidy budget objects, calendar, wallet, simple check shapes",
  ],
};

const WIZARD_VISUAL_SUPPORT_POOLS = [
  "sunlit apartment depth, soft curtains, wood furniture and a few lived-in household details",
  "warm cafe depth, ceramic cup, paper calendar and restrained chart cards lying naturally on the table",
  "bright home-office shelves, stationery, a small plant and ordinary money-management objects",
  "grocery or neighborhood-store depth, natural product colors and uncluttered daylight",
] as const;

const WIZARD_VISUAL_COMPOSITIONS = [
  "one Korean adult naturally using the relevant object in a bright lived-in room, with clear foreground and background depth",
  "candid three-quarter activity with a calm side area reserved for captions",
  "balanced room composition showing the person, the decision object and its everyday consequence in one authored shot",
  "over-shoulder view that keeps the person's restrained reaction and the evidence object in the same physical space",
  "medium-wide environmental view with a naturally closer supporting object and no cutout or composited layers",
  "clean comparison within one real table or shelf arrangement, not a graphic split screen",
] as const;

const WIZARD_VISUAL_CAMERAS = [
  "candid eye-level medium-wide vertical scene",
  "eye-level three-quarter view with natural adult proportions",
  "gentle over-shoulder view inside one continuous room",
  "human-height medium shot with soft foreground and background depth",
  "calm eye-level environmental view with the face and hands behaving naturally",
] as const;

const WIZARD_VISUAL_ACCENTS = [
  "cream, light oak and paper-white with cobalt and fresh green accents",
  "warm daylight neutrals with coral, clean blue and soft gold accents",
  "soft beige and paper-white with one restrained coral warning accent",
  "light gray fabric, pale wood, teal, orange and clear white highlights",
  "bright everyday daylight with natural object colors and a navy fabric anchor",
] as const;

function stableHashInt(seed: string, salt: string): number {
  return parseInt(createHash("sha1").update(`${seed}:${salt}`).digest("hex").slice(0, 8), 16);
}

function pickVisual<T>(seed: string, salt: string, items: readonly T[]): T {
  return items[stableHashInt(seed, salt) % items.length];
}

function classifyWizardVisualMode(text: string): WizardVisualMode {
  if (/물가|인플레|생활비|마트|장바구니|외식비|식비|가격/.test(text)) return "inflation_pressure";
  if (/금리|이자|대출|빚|할부|카드값|고지서|상환/.test(text)) return "interest_debt";
  if (/경제\s*뉴스|경제뉴스|환율|경기|실업률|성장률|지표|경제\s*신호/.test(text)) return "economy_signal";
  if (/친구|모임|선물|피드|인스타|하이라이트|체면|비교|남 눈/.test(text)) return "social_comparison";
  if (/월급|연봉|소득|수입|입금|자동이체|고정비|현금흐름/.test(text)) return "income_routine";
  if (/투자|주식|수익률|계좌|자산|복리|저축|이체|부자|기회/.test(text)) return "wealth_building";
  if (/집값|집|월세|전세|보증금|주거비|계약서|부동산/.test(text)) return "housing_debt";
  if (/위기|불황|리스크|비상금|생존|위험|흔들|무너|털림|맞고|충격/.test(text)) return "risk_alert";
  if (/노후|미래|시간|10년|5년|나중|늙|현재/.test(text)) return "future_time";
  if (/구독|결제|소비|쇼핑|세일|할인|쿠폰|택배|배달|장바구니|간편결제/.test(text)) return "consumption_trigger";
  return "habit_reset";
}

function buildWizardVisualDna(a: {
  title?: string;
  hook?: string;
  visualMetaphor?: string;
  moneyAnchor?: string;
  psychologyAnchor?: string;
  successAnchor?: string;
}): WizardVisualDna {
  const text = [
    a.title,
    a.hook,
    a.visualMetaphor,
    a.moneyAnchor,
    a.psychologyAnchor,
    a.successAnchor,
  ].filter(Boolean).join(" ");
  const seed = text || "money-shorts-visual-dna";
  const mode = classifyWizardVisualMode(text);
  const warningTopic = /위기|불황|리스크|빚|대출|금리|이자|카드값|고지서|손해|폭락|하락/.test(text);
  const progressTopic = /성공|자산|저축|복리|기준|성장|기회|회복|준비|습관|늘리|모으/.test(text);
  const everydayTopic = /생활비|장바구니|마트|외식|배달|월급|소비|주거|집/.test(text);
  return {
    id: createHash("sha1").update(seed).digest("hex").slice(0, 8),
    mode,
    objectSet: pickVisual(seed, "object-set", WIZARD_VISUAL_OBJECT_POOLS[mode]),
    supportSet: pickVisual(seed, "support-set", WIZARD_VISUAL_SUPPORT_POOLS),
    composition: pickVisual(seed, "composition", WIZARD_VISUAL_COMPOSITIONS),
    camera: pickVisual(seed, "camera", WIZARD_VISUAL_CAMERAS),
    accent: pickVisual(seed, "accent", WIZARD_VISUAL_ACCENTS),
    mood: warningTopic
      ? "clear everyday concern inside a bright, reassuring scene"
      : progressTopic
        ? "warm, forward-moving everyday confidence"
        : "gentle self-recognition with visible practical context",
    pressure: warningTopic
      ? "clear urgency expressed through the decision and props, never darkness or spectacle"
      : progressTopic
        ? "calm emphasis with a visible practical path forward"
        : "restrained emphasis grounded in an ordinary adult moment",
    toneArc: progressTopic && !warningTopic
      ? "bright_progress"
      : warningTopic
        ? "warning_to_clarity"
        : everydayTopic
          ? "warm_everyday"
          : "neutral_analysis",
  };
}

function buildEditorialVisualCue(
  stage: WizardScriptScene["id"],
  sceneIntent: string,
  narration: string,
  dna: WizardVisualDna,
  visualEvidence?: FinanceVisualEvidence,
): string {
  const stageDirectives: Record<WizardScriptScene["id"], { event: string; camera: string; light: string; avoid: string }> = {
    hook: {
      event: "one immediate topic-defining event with a single unmistakable hero subject",
      camera: "candid eye-level medium-wide or human-height medium view, never a generic overhead desk still life",
      light: "bright natural daylight or warm practical indoor light with open shadows",
      avoid: "avoid a pile of bank, chain, percent, card, receipt and arrow symbols",
    },
    problem: {
      event: "the hidden cause becoming visible as a mechanism in a new setting",
      camera: "eye-level side or over-shoulder view in one continuous lived-in space, different from the hook",
      light: "clear window light or warm ambient light with one restrained color cue",
      avoid: "do not reuse the hook's hero object or camera",
    },
    situation: {
      event: "a recognizable home, commute, grocery, office or payment moment at human scale",
      camera: "eye-level environmental scene with lived-in depth",
      light: "natural daylight or warm practical indoor light",
      avoid: "no bank temple, chains, giant percent signs, giant arrows or chart wall",
    },
    consequence: {
      event: "visible personal evidence of the economic result, expressed as a clean comparison or changed everyday object",
      camera: "close evidence shot, before-and-after depth or split composition",
      light: "neutral paper-white analytical light with one meaningful accent",
      avoid: "no decorative finance icon pile and no repeated pressure silhouette",
    },
    psychology: {
      event: "the recurring Korean adult making, avoiding or delaying one small decision in a recognizable home, cafe, store or work setting",
      camera: "candid eye-level medium-wide or intimate over-shoulder view with a natural adult face and hands",
      light: "soft open daylight or warm room light with readable natural skin and fabric texture",
      avoid: "no bank facade, giant key, receipt mountain or another tabletop object stack",
    },
    mindset: {
      event: "the exact moment confusion becomes a clear standard through separated choices or an opening path",
      camera: "forward-looking perspective with air and directional depth",
      light: "brighter transitional light entering the frame",
      avoid: "no chains, crushing weights, falling arrows or hopeless black-on-black mood",
    },
    habit: {
      event: "hands or a small faceless figure performing one concrete action in a practical setting",
      camera: "close action shot or calm three-quarter workspace view",
      light: "clean daylight, warm neutral light or optimistic studio light",
      avoid: "no oversized abstract symbol as the hero and no disaster imagery",
    },
    recommendation: {
      event: "a repeatable success standard visualized as an organized choice or system",
      camera: "calm eye-level home, cafe, store or workplace composition",
      light: "bright natural daylight or warm practical light",
      avoid: "no warning-symbol overload and no reuse of the previous hero object",
    },
    save: {
      event: "a calm resolved final image with one memorable object or path representing control and continuation",
      camera: "open balanced composition with a distinct silhouette from every earlier frame",
      light: "clear hopeful daylight or soft golden light unless the narration explicitly ends in warning",
      avoid: "no repeated opening frame, heavy chain, black void or crowded collage",
    },
  };
  const direction = stageDirectives[stage];
  const narrationEvidence = String(narration ?? "").replace(/\s+/g, " ").trim().slice(0, 320);
  if (visualEvidence) {
    return [
      financeVisualEvidenceToCue(visualEvidence),
      `Bright integrated family-feature-quality cinematic 3D animation, visual DNA ${dna.id}, mode ${dna.mode}; original art direction without copying any studio, franchise, film or known character; never photography, live action, miniature, dollhouse, diorama, laboratory, vault, factory, machine room or black-metal finance staging.`,
      `Character continuity ${FINANCE_VISUAL_CHARACTER_CONTINUITY_VERSION}: ${FINANCE_VISUAL_CHARACTER_CONTINUITY}. Natural Korean adult proportions, restrained micro-acting and one authored scene; never a pasted cutout, superhero pose, lunge or reach toward the camera.`,
      `Scene integration: ${visualEvidence.sceneIntegrationPlan}. Later-video motion plan ${FINANCE_VISUAL_MOTION_CONTRACT_VERSION}: ${visualEvidence.motionPlan}.`,
      `Narrative evidence: "${narrationEvidence}". Scene intent: ${sceneIntent}.`,
      `Camera: ${direction.camera}. Lighting: ${direction.light}. Topic tone arc: ${dna.toneArc}.`,
      `Palette: ${dna.accent}. Continuity is limited to ${visualEvidence.continuityAnchor}; it must never replace the scene hero.`,
      `Anti-repetition: ${direction.avoid}. The exact must-show event has priority over decorative style.`,
      "Reject any image that could be reused unchanged for an adjacent scene or that illustrates only generic wealth, choice or growth.",
      "Use one primary visual event, one hero subject and at most two supporting object groups.",
      "No readable text, letters, numbers, logo, watermark, photography, live action or photorealistic human face; captions and titles are added later by the renderer.",
    ].join(" ");
  }
  return [
    `Bright integrated family-feature-quality cinematic 3D animation, visual DNA ${dna.id}, mode ${dna.mode}; original art direction without copying any studio, franchise, film or known character; never photography, live action, miniature, dollhouse, diorama, laboratory, vault, factory, machine room or black-metal finance staging.`,
    `Character continuity ${FINANCE_VISUAL_CHARACTER_CONTINUITY_VERSION}: ${FINANCE_VISUAL_CHARACTER_CONTINUITY}. Use natural Korean adult proportions and restrained micro-acting in one authored scene; never a pasted cutout, superhero pose, lunge or reach toward the camera.`,
    `Narrative evidence: "${narrationEvidence}". Scene intent: ${sceneIntent}. Show ${direction.event}.`,
    `Camera: ${direction.camera}. Lighting: ${direction.light}. Topic tone arc: ${dna.toneArc}.`,
    `Topic object reference only: ${dna.objectSet}. Supporting texture: ${dna.supportSet}. Color family: ${dna.accent}.`,
    `Anti-repetition: ${direction.avoid}. A recurring topic object may be a small continuity anchor, never the hero in consecutive scenes.`,
    "Use one primary visual event, one hero subject and at most two supporting object groups. Change location, scale and composition between scenes.",
    "Reserve a textured, visually connected caption area; never leave half the frame as empty black floor or a blank void.",
    "No readable text, no letters, no numbers, no logo, no watermark, no photography, no live action and no photorealistic human face; captions and titles are added later by the renderer.",
  ].join(" ");
}

function splitNarrationByVisualFlow(text: string, stageId?: WizardScriptScene["id"]): string[] {
  const sourceLines = String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (sourceLines.length === 0) return [];

  // Finance scripts deliberately pair cause/result and decision/action lines. Those pairs
  // deserve separate images, while psychology stays together unless both lines describe
  // distinct, substantial inner events. The closing is always context first, CTA second.
  if (["situation", "consequence", "mindset", "habit"].includes(stageId ?? "") && sourceLines.length === 2) {
    return sourceLines;
  }
  if (stageId === "psychology" && sourceLines.length === 2 && sourceLines.join(" ").length >= 54) {
    return sourceLines;
  }
  if (stageId === "save" && sourceLines.length >= 3) {
    const splitAt = Math.max(1, Math.ceil(sourceLines.length / 2));
    return [sourceLines.slice(0, splitAt).join("\n"), sourceLines.slice(splitAt).join("\n")];
  }

  const chunks: string[][] = [];
  let current: string[] = [];
  for (const line of sourceLines) {
    const projectedChars = [...current, line].join(" ").length;
    if (current.length > 0 && (current.length >= 3 || projectedChars > 92)) {
      chunks.push(current);
      current = [];
    }
    current.push(line);
  }
  if (current.length > 0) chunks.push(current);

  if (chunks.length >= 2) {
    const tail = chunks[chunks.length - 1];
    const previous = chunks[chunks.length - 2];
    const mergedChars = [...previous, ...tail].join(" ").length;
    if (tail.length === 1 && tail[0].length < 20 && mergedChars <= 112) {
      chunks.splice(chunks.length - 2, 2, [...previous, ...tail]);
    }
  }
  return chunks.map((chunk) => chunk.join("\n"));
}

/**
 * 의미 단계는 유지하되 긴 단계는 장면으로 자연스럽게 나눈다. 장면 수가 목표가 아니라
 * 내레이션 한 덩어리와 하나의 시각 사건이 맞물리는지가 분할 기준이다.
 */
function buildScenePlan(a: {
  title?: string;
  hook: string;
  situation: string;
  consequence: string;
  psychology: string;
  mindset: string;
  habit: string;
  recommendation: string;
  visualMetaphor?: string;
  moneyAnchor?: string;
  psychologyAnchor?: string;
  successAnchor?: string;
  financeSubtopic?: WizardFinanceSubtopicId;
  editorialLane?: FinanceEditorialLane;
  problemStatement?: string;
  twist?: string;
  takeawayAction?: string;
}): WizardScriptScene[] {
  const lines = (text: string): string[] => String(text ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const block = (xs: string[], fallback: string): string => (xs.length > 0 ? xs.join("\n") : fallback);
  const hookLines = lines(a.hook);
  const hookA = block(hookLines.slice(0, 2), a.hook);
  const hookB = hookLines.slice(2).join("\n");
  const closing = block(lines(a.recommendation), "저장해 둬\n다음 돈 결정 전에 다시 봐");
  const dna = buildWizardVisualDna({
    title: a.title,
    hook: a.hook,
    visualMetaphor: a.visualMetaphor,
    moneyAnchor: a.moneyAnchor,
    psychologyAnchor: a.psychologyAnchor,
    successAnchor: a.successAnchor,
  });
  const stages: Array<{
    id: WizardScriptScene["id"];
    label: string;
    narration: string;
    intent: string;
  }> = [
    { id: "hook", label: "첫 훅", narration: hookA, intent: a.visualMetaphor ?? "topic-defining money consequence" },
    ...(hookB
      ? [{ id: "problem" as const, label: "문제 확대", narration: hookB, intent: "the hidden money problem behind the opening hook" }]
      : []),
    { id: "situation", label: "보편 상황", narration: a.situation, intent: "a relatable everyday finance situation translated into objects" },
    { id: "consequence", label: "경제 결과", narration: a.consequence, intent: `personal financial result tied to ${a.moneyAnchor ?? "money"}` },
    { id: "psychology", label: "심리 원인", narration: a.psychology, intent: `psychological pressure: ${a.psychologyAnchor ?? "avoidance and impulse"}` },
    { id: "mindset", label: "기준 전환", narration: a.mindset, intent: `standard shift: ${a.successAnchor ?? "clearer behavior standard"}` },
    { id: "habit", label: "실천 루틴", narration: a.habit, intent: "one concrete habit action replacing the weak money pattern" },
    { id: "save", label: "성공 기준/저장", narration: closing, intent: "success standard and final recall cue combined into one natural closing scene" },
  ];

  const beats = stages.flatMap((stage) => {
    const parts = splitNarrationByVisualFlow(stage.narration, stage.id);
    const narrations = parts.length > 0 ? parts : [stage.narration];
    return narrations.map((narration) => ({
      ...stage,
      narration,
    }));
  });

  // The hard safety ceiling remains 18. Finance scripts additionally keep a 10~13-image
  // rhythm in normal cases so each image has a meaningful narrative job and enough dwell.
  const preferredMaxSceneCount = a.financeSubtopic ? 13 : WIZARD_SCRIPT_MAX_SCENE_COUNT;
  while (beats.length > preferredMaxSceneCount) {
    let mergeIndex = -1;
    let mergeChars = Number.POSITIVE_INFINITY;
    for (let i = 0; i < beats.length - 1; i += 1) {
      if (beats[i].id !== beats[i + 1].id) continue;
      const combinedChars = `${beats[i].narration}\n${beats[i + 1].narration}`.length;
      if (combinedChars < mergeChars) {
        mergeChars = combinedChars;
        mergeIndex = i;
      }
    }
    if (mergeIndex < 0) break;
    beats.splice(mergeIndex, 2, {
      ...beats[mergeIndex],
      narration: `${beats[mergeIndex].narration}\n${beats[mergeIndex + 1].narration}`,
    });
  }

  const partCounts = new Map<WizardScriptScene["id"], number>();
  for (const beat of beats) partCounts.set(beat.id, (partCounts.get(beat.id) ?? 0) + 1);
  const seenParts = new Map<WizardScriptScene["id"], number>();
  const resolvedEditorialLane = a.editorialLane ?? (
    a.financeSubtopic ? inferFinanceEditorialLane(a.title ?? a.hook, a.problemStatement) : undefined
  );
  const scenes = beats.map((beat, index) => {
    const partCount = partCounts.get(beat.id) ?? 1;
    const partIndex = seenParts.get(beat.id) ?? 0;
    seenParts.set(beat.id, partIndex + 1);
    const partLabel = partCount > 1 ? ` ${partIndex + 1}` : "";
    const beatIntent = partCount > 1
      ? `${beat.intent}; continuation beat ${partIndex + 1} of ${partCount}, with a new hero subject and camera`
      : beat.intent;
    const visualEvidence = a.financeSubtopic && resolvedEditorialLane
      ? buildFinanceVisualEvidence({
          title: a.title ?? beat.narration,
          narration: beat.narration,
          stage: beat.id,
          financeSubtopic: a.financeSubtopic,
          editorialLane: resolvedEditorialLane,
          partIndex,
          partCount,
          problemStatement: a.problemStatement,
          twist: a.twist,
          takeawayAction: a.takeawayAction,
        })
      : undefined;
    return {
      id: beat.id,
      label: `${index + 1}. ${beat.label}${partLabel}`,
      narration: beat.narration,
      captionText: trimWizardCaption(beat.narration),
      visualCue: buildEditorialVisualCue(beat.id, beatIntent, beat.narration, dna, visualEvidence),
      visualEvidence,
    };
  });
  return applyWizardSceneMediaStrategies(scenes);
}

/** 골든 샘플 계열 자가 점검 결과(참고용 boolean — 통과 못 해도 차단하지 않고 표시만). */
export type WizardGoldenSampleChecks = {
  selfRelevantHook: boolean; // 훅이 '내 얘기'로 읽히는가
  hasCausalBridges: boolean; // 문제→원인→반전→행동 사이 다리 문장이 있는가
  concreteActionWithTiming: boolean; // 행동 제안에 실행 시점이 있는가
  captionsWithinLimit: boolean; // 자막이 화면 길이(34자) 안인가
};

/**
 * 생성 주제 레코드 → 대본(WizardScriptPreview 동일 구조). topicId가 같으면 항상 같은 대본.
 *
 * 프리미엄 시드(empathy 보유)는 추상 비유보다 직접 이해되는 7단계 흐름으로 낭독문을 만든다:
 * 문제 훅 → 보편적 상황 → 실제 손해 → 심리 원인 → 행동 전환 → 실천 루틴 → 저장/추천.
 * 첫 3문장 안에 실제 행동·손해·상황이 모두 보여야 한다.
 * "왜 그럴까요?" 같은 질문형 브리지나 "첫째/둘째/셋째" 나열형 문구를 쓰지 않는다.
 * 일반 시드는 기존 나열형 구성을 유지한다.
 */
function scriptBeat(...lines: string[]): string {
  return lines.map((line) => line.trim()).filter(Boolean).join("\n");
}

function normalizeNarrationBlock(text: string): string {
  return String(text ?? "")
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

type WizardScriptParts = {
  hook: string;
  situation: string;
  consequence: string;
  psychology: string;
  mindset: string;
  habit: string;
  recommendation: string;
};

/** 경제뉴스·돈공부 안에서도 경제 메커니즘마다 다른 생활 결과와 행동을 쓴다. */
function buildEconomyLiteracyScriptParts(rec: WizardGeneratedTopicRecord): WizardScriptParts | null {
  const mechanism = rec.curiosityMechanismId?.split(":").at(-1);
  const flows: Record<string, Omit<WizardScriptParts, "hook" | "recommendation"> & { opening: string; closing: string }> = {
    "rate-transmission": {
      opening: "기준금리 하나만 보고 대출이 바로 싸질 거라 믿으면 안 돼",
      situation: scriptBeat("기준금리는 내 대출에 바로 꽂히는 숫자가 아니야", "상품의 금리변동주기와 다음 변경일을 거쳐서 들어와"),
      consequence: scriptBeat("뉴스 보고 안심한 사이", "내 이자 청구액은 그대로 나갈 수 있어", "모르면 줄어들 돈도 확인하지 못해"),
      psychology: scriptBeat("사람은 큰 뉴스 숫자를 봤다는 이유로", "내 계약서의 작은 글씨는 미뤄", "그 회피가 매달 이자로 남아"),
      mindset: scriptBeat("대출은 전망보다 내 조건이 먼저야", "기준금리보다 내 다음 변경일을 아는 사람이 덜 당해"),
      habit: scriptBeat("오늘 대출 앱을 열고", "금리변동주기와 다음 이자 변경일만 확인해"),
      closing: "금리 뉴스 볼 때마다 내 대출부터 번역해",
    },
    "inflation-vs-wallet": {
      opening: "물가가 잡혔다는 말과 내 영수증은 다른 얘기야",
      situation: scriptBeat("물가상승률이 낮아졌다는 건", "가격이 덜 빠르게 오른다는 뜻이지", "이미 오른 가격표가 원래대로 돌아온다는 뜻은 아니야"),
      consequence: scriptBeat("그래서 뉴스만 믿고 예전 장보기 기준을 유지하면", "식비는 계속 내 월급을 더 크게 차지해", "생활비가 늦게 무너지는 이유가 여기 있어"),
      psychology: scriptBeat("사람은 물가가 안정됐다는 말에", "내 지출도 괜찮아졌다고 착각해", "그래서 영수증은 안 보고 기분으로 담아"),
      mindset: scriptBeat("경제 기사는 방향을 알려 주고", "내 영수증은 실제 결과를 알려 줘", "둘 중 하나만 보면 판단을 틀려"),
      habit: scriptBeat("이번 주 영수증 세 장만 모아", "지난달보다 자주 오른 품목 하나를 찾아"),
      closing: "물가 뉴스가 편해 보여도 영수증은 꼭 다시 봐",
    },
    "exchange-pass-through": {
      opening: "환율은 여행 가는 사람만 맞는 숫자가 아니야",
      situation: scriptBeat("달러가 오르면 수입 원재료와 해외 결제 비용이 먼저 움직여", "그 변화는 시간이 지나 장바구니와 카드값으로 넘어와"),
      consequence: scriptBeat("환율을 남 얘기로 넘기면", "왜 같은 소비가 더 비싸졌는지 모른 채", "가장 늦게 지출을 줄이게 돼"),
      psychology: scriptBeat("사람은 환율을 투자자 숫자라고 생각해", "그래서 생활비에 닿을 때까지 신호를 무시해", "모르면 가격 인상을 전부 내 탓으로만 돌리게 돼"),
      mindset: scriptBeat("환율을 맞히려는 사람이 아니라", "내 지출에 닿는 경로를 아는 사람이 덜 흔들려"),
      habit: scriptBeat("환율 뉴스가 뜨면", "이번 달 해외결제와 자주 사는 수입품부터 떠올려 봐"),
      closing: "달러 얘기 나오면 내 카드값부터 연결해 봐",
    },
    "growth-vs-income": {
      opening: "경제성장률은 내 월급 명세서가 아니야",
      situation: scriptBeat("경제가 커져도 그 과실이 바로 내 임금으로 오진 않아", "업종과 회사, 협상력에 따라 내 지갑에 닿는 속도는 다르지"),
      consequence: scriptBeat("경기 좋다는 뉴스만 믿고 생활비를 먼저 늘리면", "월급은 그대로인데 지출 기준만 올라가", "그때부터 좋은 뉴스가 내 적자가 돼"),
      psychology: scriptBeat("사람은 분위기가 좋아지면", "내 형편도 좋아졌다고 미리 계산해", "그래서 아직 들어오지 않은 돈부터 써"),
      mindset: scriptBeat("성장률은 기대의 근거일 뿐", "내 소비 기준은 실제 소득과 현금흐름으로 정해야 해"),
      habit: scriptBeat("좋은 경제 뉴스 본 날일수록", "내 월급과 고정비가 실제로 바뀌었는지 먼저 확인해"),
      closing: "경기 좋다는 말에 지갑부터 열지 않게 저장해 둬",
    },
    "inflation-slowdown": {
      opening: "물가가 내려간다는 말에 가격표도 내려갈 거라 믿지 마",
      situation: scriptBeat("물가상승률 둔화는 가격이 떨어진 게 아니라", "오르는 속도가 느려진 거야", "그래서 예전 가격을 기다리기만 하면 판단이 늦어"),
      consequence: scriptBeat("가격이 돌아올 거라 믿고 소비 구조를 안 바꾸면", "비싸진 생활비는 그대로 굳어", "저축할 돈만 계속 밀려나"),
      psychology: scriptBeat("사람은 좋은 헤드라인을 보면", "불편한 현실도 곧 끝날 거라 기대해", "그래서 바꿔야 할 지출을 미뤄"),
      mindset: scriptBeat("뉴스의 표현보다", "내가 실제로 내는 가격을 믿어", "돈 관리는 기대가 아니라 현재 숫자로 하는 거야"),
      habit: scriptBeat("가격표가 내려오길 기다리지 말고", "이번 달 고정 생활비 한 항목의 대안을 정해"),
      closing: "물가 안정 기사 볼 때 가격표도 같이 확인해",
    },
    "policy-to-household": {
      opening: "금리 발표 날 볼 건 기사 제목이 아니라 내 대출의 다음 변경일이야",
      situation: scriptBeat("기준금리 0.25퍼센트보다", "내 대출이 언제 어떤 방식으로 다시 계산되는지가", "이번 달 이자에는 더 직접적일 수 있어"),
      consequence: scriptBeat("발표만 보고 넘기면", "이자 변화를 준비할 시간도 놓쳐", "결국 청구서 받고 나서야 생활비를 줄이게 돼"),
      psychology: scriptBeat("사람은 복잡한 계약 조건을 보기 싫어해", "그래서 뉴스 한 줄로 안심하거나 겁먹어", "그 사이 내 숫자는 방치돼"),
      mindset: scriptBeat("경제 판단은 큰 숫자를 외우는 게 아니야", "내 계약에 적용되는 숫자 하나를 잡는 거야"),
      habit: scriptBeat("금리 발표 날엔", "대출 잔액과 다음 금리 변경일을 한 화면에 적어 둬"),
      closing: "다음 금리 발표 전에 이 숫자부터 확인해",
    },
    "recession-early-signal": {
      opening: "불황은 속보로 오기 전에 회사와 통장에서 분위기가 바뀌어",
      situation: scriptBeat("채용이 늦어지고", "성과급 얘기가 조용해지고", "고정비가 버거워지는 순간이 먼저 와"),
      consequence: scriptBeat("그 신호를 뉴스가 아니라고 무시하면", "수입이 흔들린 뒤에야 비상금을 찾게 돼", "그때는 선택지가 이미 줄어 있어"),
      psychology: scriptBeat("사람은 나쁜 가능성을 생각하기 싫어서", "평소 신호를 과장이라고 넘겨", "막상 닥치면 준비 못 한 자신을 탓해"),
      mindset: scriptBeat("위기를 맞히는 게 목표가 아니야", "흔들려도 버틸 구조를 먼저 만드는 게 목표야"),
      habit: scriptBeat("이번 달 고정비를 적고", "수입이 줄어도 바로 못 끊을 항목부터 표시해"),
      closing: "불황 뉴스 보기 전에 내 버틸 돈부터 점검해",
    },
    "jobs-signal": {
      opening: "고용뉴스 좋다고 내 연봉까지 자동으로 오르지 않아",
      situation: scriptBeat("고용지표는 전체 흐름이고", "내 연봉은 회사 실적과 내 역할, 협상 시점에서 정해져", "같은 뉴스도 내 월급에는 다르게 닿아"),
      consequence: scriptBeat("고용이 좋다는 말만 믿고", "내 소득이 늘었다고 소비 기준을 올리면", "협상은 제자리인데 지출만 앞서가"),
      psychology: scriptBeat("사람은 좋은 통계를 들으면", "자기 자리도 안전하다고 착각해", "그래서 준비해야 할 기록과 협상을 미뤄"),
      mindset: scriptBeat("고용뉴스는 분위기를 보고", "내 연봉은 내가 만든 근거로 움직여", "둘을 섞어 기대하지 마"),
      habit: scriptBeat("이번 달에 한 번", "내가 만든 성과와 시장에서 바뀐 연봉 정보를 한 줄씩 모아"),
      closing: "좋은 고용뉴스보다 내 협상 근거부터 저장해 둬",
    },
    "news-translation": {
      opening: "경제뉴스를 많이 봐도 내 지출과 연결 못하면 소용없어",
      situation: scriptBeat("뉴스는 금리와 물가, 환율을 말하지만", "내 돈은 카드값과 대출이자, 생활비에서 반응해", "번역을 안 하면 아는 척만 늘어"),
      consequence: scriptBeat("정보를 모으기만 하면", "변화는 알아도 행동은 늦어", "결국 중요한 선택은 늘 감으로 하게 돼"),
      psychology: scriptBeat("어려운 말을 많이 들으면", "이해한 기분이 들어", "그 만족감이 실제 확인을 대신해 버려"),
      mindset: scriptBeat("경제를 잘 안다는 건", "뉴스를 많이 외운다는 뜻이 아니야", "내 통장에 닿는 질문을 바로 꺼내는 거야"),
      habit: scriptBeat("뉴스 하나를 보고", "내 지출, 빚, 월급 중 하나에만 연결해서 메모해"),
      closing: "경제뉴스를 내 돈으로 바꾸는 질문이 필요할 때 다시 봐",
    },
  };
  const flow = mechanism ? flows[mechanism] : null;
  if (!flow) return null;
  return {
    hook: scriptBeat(rec.hook, rec.title, flow.opening),
    situation: flow.situation,
    consequence: flow.consequence,
    psychology: flow.psychology,
    mindset: flow.mindset,
    habit: flow.habit,
    recommendation: scriptBeat(flow.closing, rec.save),
  };
}

/**
 * 500개 은행 제목과 이후 확장 제목을 같은 공통 엔진 입력으로 정규화한다.
 */
function resolveFinanceEditorialTopic(rec: WizardGeneratedTopicRecord): FinanceEditorialTopic | null {
  if (rec.category !== "finance" || !rec.financeSubtopic) return null;
  if (rec.curiosityMechanismId?.startsWith("editorial-v2:")) {
    const editorialId = rec.curiosityMechanismId.slice("editorial-v2:".length);
    const editorialTopic = FINANCE_EDITORIAL_TOPIC_BANK.find((topic) => topic.id === editorialId);
    if (editorialTopic) return editorialTopic;
  }

  return {
    id: rec.curiosityMechanismId ?? rec.slug,
    financeSubtopic: rec.financeSubtopic,
    lane: rec.editorialLane ?? inferFinanceEditorialLane(rec.title, rec.angle),
    title: rec.title.replace(/[.!?。]+$/g, "").trim(),
    problemStatement: rec.problemStatement ?? rec.empathy ?? rec.title,
    twist: rec.twist ?? rec.points[1],
    takeawayAction: rec.takeawayAction ?? rec.points[2],
  };
}

/**
 * 활성 500개와 소진 뒤 확장되는 모든 재테크 제목의 공통 대본 엔진.
 * 과거처럼 소주제 하나로 고정 예시를 반환하지 않고 제목의 실제 경제 메커니즘을 먼저 읽는다.
 */
function buildCuriosityTopicSpecificScriptParts(rec: WizardGeneratedTopicRecord): WizardScriptParts | null {
  const editorialTopic = resolveFinanceEditorialTopic(rec);
  if (editorialTopic) {
    const parts = buildFinanceEditorialScriptParts(editorialTopic);
    return {
      hook: parts.hook,
      situation: parts.situation,
      consequence: parts.consequence,
      psychology: parts.psychology,
      mindset: parts.mindset,
      habit: parts.habit,
      recommendation: parts.recommendation,
    };
  }

  if (rec.category !== "finance" || !rec.curiosityMechanismId || !rec.financeSubtopic) return null;

  const title = rec.title.replace(/[.!?。]+$/g, "").trim();
  const hook = rec.hook.trim() === title ? rec.hook : scriptBeat(rec.hook, title);
  if (rec.problemStatement && rec.twist && rec.takeawayAction) {
    return {
      hook: scriptBeat(title, "이걸 별일 아니라고 넘기면 같은 돈 문제를 또 반복해"),
      situation: scriptBeat(rec.problemStatement, "한 번은 작아 보여도 같은 판단이 반복되면 생활 기준이 돼"),
      consequence: scriptBeat(rec.twist, "결국 손해는 뉴스가 아니라 내 카드값과 잔고에서 확인하게 돼"),
      psychology: scriptBeat(
        `${rec.psychologyAnchor ?? "익숙한 감정"}이 올라오면 사람은 숫자보다 당장 편한 설명을 고르게 돼`,
        "그래서 잘못된 선택을 알아도 다음 달에 또 반복해",
      ),
      mindset: scriptBeat(
        `${rec.successAnchor ?? "내 기준"}은 많이 아는 데서 생기지 않아`,
        "같은 상황에서 이전과 다른 순서를 고를 때 생겨",
      ),
      habit: scriptBeat(rec.takeawayAction, "오늘 한 번만 직접 확인하고 다음 선택의 기준으로 남겨"),
      recommendation: scriptBeat(rec.save, "비슷한 선택이 다시 왔을 때 꺼내 봐"),
    };
  }
  const source = `${title} ${rec.hook} ${rec.curiosityMechanismId}`;
  const variant = parseInt(createHash("sha1").update(rec.curiosityMechanismId).digest("hex").slice(0, 2), 16) % 3;
  const subtopicBridge: Record<WizardFinanceSubtopicId, string> = {
    economy_literacy: "중요한 건 뉴스 제목이 아니라 그 변화가 내 돈에 닿는 순간이야",
    inflation_living_cost: "이걸 모른 채 예전 생활비 기준을 유지하면 영수증이 먼저 달라져",
    interest_debt: "이 숫자를 미루면 다음 달 선택지가 먼저 줄어",
    consumption_psychology: "결제 순간의 기분이 기준을 대신하면 카드값이 나중에 답해",
    sns_comparison: "남의 장면을 기준으로 쓰기 시작하면 내 예산이 가장 먼저 밀려",
    labor_income: "수입이 늘었다는 느낌과 실제로 남는 돈은 다를 수 있어",
    investing_assets: "수익률보다 먼저 무너지는 건 기준 없는 매수와 매도야",
    housing_asset_gap: "집값보다 먼저 봐야 할 건 매달 내 통장에서 빠지는 총액이야",
    anxiety_avoidance: "모르는 숫자가 불안을 키우고, 불안은 다시 확인을 미루게 해",
    success_habits: "결심보다 반복되는 환경과 순서가 자산의 방향을 바꿔",
    crisis_risk: "평소에 미룬 방어막은 흔들리는 날 가장 비싸게 돌아와",
    time_retirement: "미룬 시간은 나중에 더 많은 돈으로도 쉽게 메우지 못해",
  };
  const opening = [
    "이걸 그냥 돈 관리 일반론으로 넘기면 핵심을 놓쳐",
    "이건 숫자 하나가 아니라 내 선택 순서가 틀어진 신호야",
    "여기서 판단을 틀리면 손해는 늘 생활비에서 먼저 보여",
  ][variant];
  let concreteResult = `${rec.moneyAnchor ?? "내 돈"}에서 바뀐 기준을 모르면, 줄일 수 있었던 선택도 가장 늦게 바꾸게 돼`;
  let concreteAction = `${rec.points[2]}\n오늘은 이 제목과 연결된 숫자 하나만 직접 확인해`;
  if (/보험.*현금|현금.*보험/.test(source)) {
    concreteResult = "보험은 갑작스러운 큰 사건을 막는 장치고, 비상금은 당장 끊기지 않는 생활을 버티는 돈이야. 둘을 같은 돈으로 착각하면 위기 때 카드부터 쓰게 돼";
    concreteAction = "보험료와 비상금을 한 줄에 적고\n이번 달 생활비를 버틸 현금이 남는지 먼저 봐";
  } else if (/비상금|생존|버틸|급전|병원비/.test(source)) {
    concreteResult = "현금 바닥을 만들면 작은 충격도 다시 빚이나 카드값으로 돌아와. 그래서 빨리 갚는 것과 다시 안 빌리는 건 다른 문제야";
    concreteAction = "상환액 정하기 전에\n내가 절대 건드리지 않을 비상금 바닥선부터 적어";
  } else if (/리볼빙|할부|카드론|마이너스통장|한도대출/.test(source)) {
    concreteResult = "월 납부액만 보면 이미 쓴 전체 금액과 이자가 가려져. 편하게 넘긴 결제가 다음 달 선택권을 먼저 묶어";
    concreteAction = "카드 앱을 열고\n남은 할부 총액이나 리볼빙 잔액을 한 줄로 적어";
  } else if (/대출|금리|이자|DSR|상환/.test(source)) {
    concreteResult = "대출은 기사 제목대로 움직이지 않아. 내 금리 조건과 상환 구조를 모르면 같은 변화도 더 비싸게 맞아";
    concreteAction = "대출 앱에서\n잔액, 다음 금리 변경일, 월 상환액 중 하나를 바로 확인해";
  } else if (/구독|자동결제/.test(source)) {
    concreteResult = "이미 낸 돈이 아깝다는 이유로 안 쓰는 구독을 붙잡으면, 고정비는 매달 내 선택보다 먼저 빠져나가. 작은 금액일수록 더 오래 방치돼";
    concreteAction = "구독 목록을 열고\n지난 한 달에 안 쓴 항목 하나를 해지 후보로 표시해";
  } else if (/물가|가격|영수증|장바구니|식비|외식|배달/.test(source)) {
    concreteResult = "가격이 한 번에 무너뜨리는 게 아니야. 같은 생활을 유지한 채 조금씩 더 내게 만들고, 그 차이가 저축을 먼저 밀어내";
    concreteAction = "이번 주 영수증을 보고\n가장 자주 오른 항목 하나와 대체 기준 하나를 정해";
  } else if (/환율|달러|해외/.test(source)) {
    concreteResult = "환율 변화는 여행비에만 닿지 않아. 시간이 지나면 해외결제와 수입품, 생활비에서 같은 소비의 가격을 바꿔";
    concreteAction = "환율 뉴스가 뜨면\n이번 달 해외결제와 자주 사는 수입품부터 떠올려 봐";
  } else if (/연봉|월급|소득|고용|실업|이직|부업|야근|성과/.test(source)) {
    concreteResult = "좋은 경제 분위기나 늘어난 수입이 자동으로 내 자산이 되진 않아. 실제로 들어온 돈보다 생활 기준이 먼저 오르면 남는 건 고정비야";
    concreteAction = "이번 달 소득 변화를 보고\n늘어난 돈의 자리 하나를 저축이나 비상금으로 먼저 정해";
  } else if (/주식|투자|매수|매도|수익|손실|종목|복리|분산/.test(source)) {
    concreteResult = "투자는 수익률보다 기준을 잃는 순간 위험해져. 생활비와 감정이 계좌에 들어오면 계획은 가장 먼저 무너져";
    concreteAction = "다음 매수 전에\n매수 이유, 잃어도 버틸 금액, 매도 기준 중 하나를 적어";
  } else if (/집|전세|월세|주거|보증금|부동산|관리비|출퇴근/.test(source)) {
    concreteResult = "집값이나 월세 하나만 보면 안 보여. 대출, 관리비, 이동비까지 합친 월 현금흐름이 내 선택권을 결정해";
    concreteAction = "주거 선택 전에\n집세 밖에 붙는 월 비용 하나를 더해 총액으로 다시 봐";
  } else if (/피드|SNS|여행|결혼|명품|리뷰|선물|모임|칭찬|알고리즘/.test(source)) {
    concreteResult = "남의 장면은 내 예산을 책임지지 않아. 비교가 시작되면 필요한 소비보다 뒤처져 보이지 않는 소비가 먼저 커져";
    concreteAction = "다음 약속이나 쇼핑 전에\n남의 기준 말고 내 한도 한 줄을 먼저 정해";
  } else if (/잔고|카드값|청구서|불안|빚|돈 얘기|재정|확인/.test(source)) {
    concreteResult = "숫자를 피하면 불안이 사라지는 게 아니라 선택지가 줄어. 모르는 금액이 다음 결제를 더 쉽게 만들기 때문이야";
    concreteAction = "오늘 10분만 써서\n피하고 있던 잔고나 청구서 총액 하나를 적어";
  } else if (/노후|은퇴|연금|미래|10년|20년|시간|자녀/.test(source)) {
    concreteResult = "미래 돈은 나중에 크게 메우기 어렵다. 시작을 미룬 시간과 물가는 결국 지금의 작은 선택보다 더 비싼 비용이 돼";
    concreteAction = "오늘 자동이체 하나를 보고\n미래 돈으로 먼저 빠질 금액을 작게라도 정해";
  } else if (/환경|의지|자동이체|기록|월말|월초|기분/.test(source)) {
    concreteResult = "돈은 결심 한 번으로 남지 않아. 반복되는 환경과 순서가 그대로 자산의 방향이 돼";
    concreteAction = "오늘 한 번에 바꾸려 하지 말고\n결제 환경이나 자동이체 순서 하나만 바꿔";
  } else if (/할인|무료배송|결제|환불|가격|물건|쇼핑|소액/.test(source)) {
    concreteResult = "싸게 샀다는 기분이 필요 없는 결제를 가려. 결제 순간엔 작아 보여도 반복되면 기준 없는 소비가 월말을 차지해";
    concreteAction = "다음 결제 전에\n필요한 이유와 총액 중 하나를 먼저 확인해";
  }

  return {
    hook: scriptBeat(hook, opening),
    situation: scriptBeat(rec.empathy ?? "비슷한 선택을 반복한 적 있지", `${rec.moneyAnchor ?? "내 돈"} 기준이 흔들리면 선택도 같이 흔들려`),
    consequence: scriptBeat(concreteResult, subtopicBridge[rec.financeSubtopic]),
    psychology: scriptBeat(rec.points[0], `${rec.psychologyAnchor ?? "불안"}이 커지면 사람은 확인보다 합리화부터 골라`),
    mindset: scriptBeat(rec.points[1], `${rec.successAnchor ?? "내 기준"}은 기분이 아니라 다음 행동으로 증명돼`),
    habit: scriptBeat(concreteAction),
    recommendation: scriptBeat(rec.save, "비슷한 선택 앞에서 다시 봐"),
  };
}

function buildPlainScriptParts(rec: WizardGeneratedTopicRecord): WizardScriptParts {
  const [p1, p2, p3] = rec.points;
  const topicText = `${rec.title} ${rec.hook} ${rec.moneyAnchor ?? ""} ${rec.angleNote ?? ""}`;

  // 현재 활성 재테크 500개는 전부 이 경로로 온다. 아래 키워드 템플릿은 레거시 seed fallback만 맡는다.
  const curiositySpecific = buildCuriosityTopicSpecificScriptParts(rec);
  if (curiositySpecific) return curiositySpecific;

  if (/경제\s*뉴스|경제뉴스|경제\s*공부|경제\s*신호|환율|경기|경제지표|지표|실업률|성장률/.test(topicText)) {
    const mechanismSpecific = buildEconomyLiteracyScriptParts(rec);
    if (mechanismSpecific) return mechanismSpecific;
    return {
      hook: scriptBeat(
        rec.hook,
        rec.title,
        "이게 남 얘기 같으면 이미 늦은 거야",
      ),
      situation: scriptBeat(
        rec.empathy ?? "뉴스 한 줄이 내 생활과 멀게 느껴지죠",
        p1,
        "그 신호는 뉴스 화면보다 내 지출에서 먼저 드러나",
      ),
      consequence: scriptBeat(
        p2,
        `${rec.moneyAnchor ?? "내 돈"}은 경제가 바뀌는 날부터 같이 흔들려`,
        "모르고 지나가면 늘 바뀐 뒤에야 줄이게 돼",
      ),
      psychology: scriptBeat(
        `${rec.psychologyAnchor ?? "불안"}은 어려운 숫자를 피하게 만들어`,
        "그래서 바뀐 기준은 안 보고",
        "예전 습관만 반복하게 하지",
        "그 차이가 카드값과 저축, 다음 선택에서 쌓여",
      ),
      mindset: scriptBeat(
        "경제를 다 아는 사람이 이기는 게 아니야",
        `${rec.moneyAnchor ?? "내 돈"}에 닿는 신호를 먼저 알아차리는 사람이 덜 흔들려`,
        `${rec.successAnchor ?? "내 기준"}은 뉴스가 아니라 내 행동에서 시작돼`,
      ),
      habit: scriptBeat(
        p3,
        "그리고 오늘 본 경제 뉴스 하나를",
        "내 지출에 무슨 일이 생기는지로만 바꿔서 봐",
      ),
      recommendation: scriptBeat(
        "뉴스를 많이 보는 것보다",
        "내 돈으로 번역하는 습관이 먼저야",
        rec.save,
      ),
    };
  }

  if (/물가|인플레|인플레이션|생활비|마트|장바구니|외식비|식비/.test(topicText)) {
    return {
      hook: scriptBeat(
        "물가 탓만 하는 사람 많지",
        "근데 진짜 문제는",
        "가격이 오른 게 전부가 아니야",
        "내 소비가 그대로라는 거야",
      ),
      situation: scriptBeat(
        "마트 한 번",
        "배달 한 번",
        "외식 한 번은 별일 아닌 것처럼 보여",
        "근데 한 달로 모으면 월급을 조용히 갉아먹어",
      ),
      consequence: scriptBeat(
        "물가가 오르는데 예전처럼 담으면",
        "생활비가 월급보다 빨리 커져",
        "그때부터 저축은 의지 문제가 아니라 구조 문제가 돼",
      ),
      psychology: scriptBeat(
        "사람은 익숙한 소비를 잃기 싫어해",
        "그래서 비싸졌다는 걸 알면서도",
        "예전처럼 사고",
        "예전처럼 후회해",
      ),
      mindset: scriptBeat(
        "성공하는 사람은 물가 욕만 하지 않아",
        "뭐가 올랐는지 보고",
        "뭘 바꿀지 바로 정해",
      ),
      habit: scriptBeat(
        "이번 주 장보기 전에",
        "자주 오른 품목 세 개만 적어",
        "그리고 대체할 물건을 먼저 정해",
      ),
      recommendation: scriptBeat(
        "물가가 힘들다는 말만 반복했다면",
        "이 루틴부터 저장해 둬",
        "다음 장보기 전에 다시 봐",
      ),
    };
  }

  if (/금리|대출|할부|이자|리볼빙|카드론|마이너스통장|마통/.test(topicText)) {
    return {
      hook: scriptBeat(
        "금리 무섭다고 말하면서",
        "할부는 계속 누르는 사람 많지",
        "근데 진짜 무서운 건",
        "뉴스 속 금리 숫자가 아니야",
      ),
      situation: scriptBeat(
        "내 카드 할부와 대출 이자가",
        "이미 내 월급을 먼저 잘라가는 거야",
        "작게 나눴다고 가벼워진 게 아니야",
      ),
      consequence: scriptBeat(
        "지금 편하려고 나눈 결제는",
        "다음 달 선택지를 하나씩 없애",
        "한 번은 괜찮아도",
        "반복되면 생활비가 먼저 묶여",
      ),
      psychology: scriptBeat(
        "불안한 사람은 큰 숫자는 피하고",
        "작은 결제에는 둔해져",
        "그래서 대출은 무서워하면서",
        "할부는 합리화해",
      ),
      mindset: scriptBeat(
        "성공하는 사람은 살 수 있냐고 묻기 전에",
        "왜 지금 미래 월급을 당겨야 하냐고 물어",
        "그 질문 하나가 빚의 속도를 늦춰",
      ),
      habit: scriptBeat(
        "오늘 카드 앱을 열고",
        "할부, 리볼빙, 자동결제만 따로 봐",
        "숨기지 말고 숫자로 꺼내",
      ),
      recommendation: scriptBeat(
        "금리보다 먼저 볼 건",
        "내 생활 속 이자야",
        "저장해 둬",
        "결제 나누기 전에 다시 봐",
      ),
    };
  }

  if (/투자|주식|자산|ETF|코인|적금|예금|현금|복리/.test(topicText)) {
    return {
      hook: scriptBeat(
        "투자 공부는 열심히 하는데",
        "카드 내역은 안 보는 사람 많지",
        "근데 그 상태로는",
        "수익률이 와도 돈이 안 남아",
      ),
      situation: scriptBeat(
        "주식 앱은 매일 열면서",
        "내 고정비와 충동 결제는 안 봐",
        "그러면 투자금이 문제가 아니라",
        "돈이 쌓일 바닥이 없는 거야",
      ),
      consequence: scriptBeat(
        "자산은 한 방으로 커지는 게 아니야",
        "새는 돈을 막고",
        "남는 돈을 오래 붙잡고",
        "그다음에 굴릴 때 커져",
      ),
      psychology: scriptBeat(
        "사람은 지루한 관리보다",
        "한 번에 바뀔 것 같은 수익률에 흔들려",
        "그래서 기본을 건너뛰고",
        "더 위험한 선택부터 해",
      ),
      mindset: scriptBeat(
        "성공하는 사람은 얼마 벌까보다",
        "이 돈을 얼마나 오래 지킬까를 먼저 봐",
        "투자는 그다음이야",
      ),
      habit: scriptBeat(
        "투자금 넣기 전에",
        "한 달 고정비",
        "충동 결제",
        "자동결제부터 표로 꺼내 봐",
      ),
      recommendation: scriptBeat(
        "투자보다 먼저",
        "돈 새는 구멍을 막아",
        "이 순서 저장해 둬",
      ),
    };
  }

  if (/집값|전세|월세|부동산|청약|보증금|주거비|관리비/.test(topicText)) {
    return {
      hook: scriptBeat(
        "집값만 보면서",
        "내 주거비 비율은 안 보는 사람 많지",
        "근데 돈이 막히는 건",
        "집값 뉴스보다 내 현금흐름에서 먼저 와",
      ),
      situation: scriptBeat(
        "월세",
        "관리비",
        "대출 이자가 합쳐지면",
        "생활비보다 먼저 숨통을 조여",
      ),
      consequence: scriptBeat(
        "주거비가 너무 커지면",
        "돈을 못 모으는 게 아니야",
        "모을 공간 자체가 사라지는 거야",
      ),
      psychology: scriptBeat(
        "남들 사는 동네와 집 크기를 비교하면",
        "내 기준보다 체면이 먼저 커져",
        "그때부터 집은 자산이 아니라 압박이 돼",
      ),
      mindset: scriptBeat(
        "성공하는 사람은 좋은 집보다",
        "버틸 수 있는 현금흐름을 먼저 봐",
        "집도 결국 월급 안에서 버텨야 해",
      ),
      habit: scriptBeat(
        "오늘 내 월급에서",
        "주거비가 몇 퍼센트인지 계산해 봐",
        "숫자가 높으면 꿈보다 구조부터 봐",
      ),
      recommendation: scriptBeat(
        "집 문제로 돈이 막힌다면",
        "이 비율부터 저장해 둬",
        "월세나 대출 보기 전에 다시 봐",
      ),
    };
  }

  if (/불황|위기|침체|실직|해고|구조조정|비상금|위험/.test(topicText)) {
    return {
      hook: scriptBeat(
        "위기는 뉴스에 먼저 오는 게 아니야",
        "내 통장에 비상금이 없을 때",
        "제일 먼저 와",
      ),
      situation: scriptBeat(
        "괜찮을 때 비상금은 답답해 보여",
        "근데 회사가 흔들리고",
        "수입이 줄고",
        "갑자기 돈 나갈 일이 생기면 달라져",
      ),
      consequence: scriptBeat(
        "준비가 없으면",
        "같은 사건도 누군가에겐 기회고",
        "누군가에겐 빚이 돼",
      ),
      psychology: scriptBeat(
        "사람은 좋은 시기엔 위험을 잊어",
        "나쁜 시기엔 너무 늦게 겁을 먹어",
        "그래서 평소 습관이 위기 때 결과가 돼",
      ),
      mindset: scriptBeat(
        "성공하는 사람은 겁이 없어서 버티는 게 아니야",
        "흔들릴 때 쓸 방어막을",
        "미리 만들어 둔 거야",
      ),
      habit: scriptBeat(
        "이번 달엔 투자보다 먼저",
        "한 달 생활비만큼 비상금 계좌를 따로 빼",
        "작아도 시작해",
      ),
      recommendation: scriptBeat(
        "위기 때 무너지기 싫다면",
        "이 기준 저장해 둬",
        "좋을 때 다시 봐",
      ),
    };
  }

  if (/노후|퇴직|은퇴|연금|나이|시간|미래/.test(topicText)) {
    return {
      hook: scriptBeat(
        "노후를 먼 얘기로 보는 사람 많지",
        "근데 시간은",
        "월급보다 훨씬 빨리 지나가",
      ),
      situation: scriptBeat(
        "지금은 젊고 바쁘니까 괜찮다고 넘겨",
        "근데 미래의 나는",
        "지금의 내가 미룬 선택을 그대로 받게 돼",
      ),
      consequence: scriptBeat(
        "준비를 미루면",
        "나중엔 돈을 모으는 게 아니라",
        "부족한 시간을 메우는 싸움이 돼",
      ),
      psychology: scriptBeat(
        "멀리 있는 문제일수록",
        "사람은 오늘의 소비를 쉽게 합리화해",
        "그래서 제일 중요한 준비가 제일 늦어져",
      ),
      mindset: scriptBeat(
        "성공하는 사람은 나중에 여유 생기면 하지 않아",
        "지금 작게 시작해",
        "작아도 자동으로 굴러가게 만들어",
      ),
      habit: scriptBeat(
        "오늘 연금",
        "적금",
        "투자 중 하나라도",
        "자동으로 빠져나가게 설정해",
      ),
      recommendation: scriptBeat(
        "미래의 돈을 계속 미뤘다면",
        "이 문장 저장해 둬",
        "나중에 말고 오늘 다시 봐",
      ),
    };
  }

  if (/연봉|수입|몸값|성과|커리어|노동소득|월급만|인상/.test(topicText)) {
    return {
      hook: scriptBeat(
        "연봉 올랐는데 돈이 안 남는 사람 많지",
        "그건 버는 힘이 약해서가 아니라",
        "새는 습관이 같이 커진 거야",
      ),
      situation: scriptBeat(
        "수입이 늘면 생활도 같이 올라가",
        "예전보다 더 바쁜데",
        "이상하게 더 안 남는 순간이 와",
      ),
      consequence: scriptBeat(
        "버는 돈이 커졌는데 기준이 없으면",
        "남는 건 자산이 아니라 고정비야",
        "월급이 커져도 자유는 안 커져",
      ),
      psychology: scriptBeat(
        "고생한 만큼 써도 된다는 말",
        "이게 제일 그럴듯한 소비 허가증이야",
        "근데 그 말이 반복되면 계속 제자리야",
      ),
      mindset: scriptBeat(
        "성공하는 사람은 수입이 오를 때",
        "생활수준부터 올리지 않아",
        "저축률과 투자금을 먼저 올려",
      ),
      habit: scriptBeat(
        "월급이 늘어난 달엔",
        "늘어난 금액의 절반을",
        "자동이체로 먼저 빼",
      ),
      recommendation: scriptBeat(
        "수입은 늘었는데 남는 돈이 없다면",
        "이 규칙 저장해 둬",
        "다음 월급날 다시 봐",
      ),
    };
  }

  if (/보상소비|퇴근|힘든|위로|고생/.test(topicText)) {
    return {
      hook: scriptBeat(
        "힘든 날마다 결제로 위로받는 사람 많지",
        "근데 그건 돈을 쓰는 게 아니라",
        "감정을 카드값으로 미루는 거야",
      ),
      situation: scriptBeat(
        "퇴근길엔 버틴 값을 받고 싶어져",
        "배달",
        "쇼핑",
        "택시가 갑자기 다 합리적으로 보여",
      ),
      consequence: scriptBeat(
        "그 순간은 풀려",
        "근데 다음 달 카드값은",
        "내가 힘들었던 날을 그대로 기억해",
      ),
      psychology: scriptBeat(
        "피곤할수록 뇌는 회복과 결제를 헷갈려",
        "그래서 쉬어야 할 때",
        "가장 빠른 보상부터 눌러",
      ),
      mindset: scriptBeat(
        "성공하는 사람은 힘든 날일수록",
        "돈으로 기분을 지우지 않아",
        "회복 방식을 먼저 정해",
      ),
      habit: scriptBeat(
        "힘든 날엔 결제 전에",
        "20분만 쉬어",
        "그래도 필요하면 그때 사",
      ),
      recommendation: scriptBeat(
        "퇴근길 결제가 잦다면",
        "이 문장 저장해 둬",
        "힘든 날마다 다시 봐",
      ),
    };
  }

  if (/작은돈|소액|작은 결제|작다고|몇천|자잘/.test(topicText)) {
    return {
      hook: scriptBeat(
        "작은 결제라 넘긴 적 많지",
        "근데 돈 못 모으는 습관은",
        "보통 여기서 시작돼",
      ),
      situation: scriptBeat(
        "몇천 원은 결제할 때 아프지 않아",
        "커피",
        "간식",
        "앱 결제가 그냥 지나가",
      ),
      consequence: scriptBeat(
        "근데 반복되면 월말 잔고가 먼저 줄어",
        "큰돈보다 무서운 건",
        "자주 새는 돈이야",
      ),
      psychology: scriptBeat(
        "작은 금액은 죄책감이 약해",
        "그래서 뇌가 지출로 계산하지 않아",
        "안 아프니까 더 자주 누르는 거야",
      ),
      mindset: scriptBeat(
        "성공하는 사람은 금액보다 반복 횟수를 봐",
        "자산은 큰 결심보다",
        "작은 반복에서 갈려",
      ),
      habit: scriptBeat(
        "오늘은 만 원 이하 결제만 따로 세어 봐",
        "숫자로 보면",
        "핑계가 줄어",
      ),
      recommendation: scriptBeat(
        "작은 결제가 잦다면",
        "이 기준 저장해 둬",
        "월말 전에 다시 봐",
      ),
    };
  }

  if (/친구|모임|선물|피드|하이라이트|체면|남 눈/.test(topicText)) {
    return {
      hook: scriptBeat(
        "남 눈치 보느라 쓴 돈",
        "집에 돌아오면 거의 다 후회로 바뀌지",
        "그게 제일 비싼 비교야",
      ),
      situation: scriptBeat(
        "친구",
        "모임",
        "인스타 분위기에 맞추다 보면",
        "내 예산은 제일 먼저 밀려",
      ),
      consequence: scriptBeat(
        "그날은 괜찮아 보여",
        "근데 다음 날 잔고는",
        "남의 기준에 맞춘 값을 그대로 보여줘",
      ),
      psychology: scriptBeat(
        "비교가 시작되면",
        "사람은 필요한 것보다",
        "뒤처져 보이지 않는 데 돈을 써",
      ),
      mindset: scriptBeat(
        "친구를 맞추기 전에",
        "내 한도부터 정해",
        "착한 척하다가 혼자 무너지면 아무도 대신 갚아주지 않아",
      ),
      habit: scriptBeat(
        "약속 전에 쓸 돈만 따로 빼",
        "그 밖의 결제는 거절해",
        "분위기보다 한도가 먼저야",
      ),
      recommendation: scriptBeat(
        "인스타 비교에 카드가 흔들린다면",
        "이 규칙 저장해 둬",
        "약속 전에 다시 봐",
      ),
    };
  }

  if (/구독|정기 결제|자동결제/.test(topicText)) {
    return {
      hook: scriptBeat(
        "안 쓰는 구독을 그냥 두는 사람 많지",
        "그건 돈을 버리는 게 아니라",
        "기준이 없는 거야",
      ),
      situation: scriptBeat(
        "해지 버튼은 보이는데",
        "언젠가 쓸 것 같아서",
        "이번 달도 그냥 넘어가",
      ),
      consequence: scriptBeat(
        "한 달엔 작아 보여",
        "근데 일 년이면",
        "내 저축을 조용히 깎아먹는 고정비가 돼",
      ),
      psychology: scriptBeat(
        "사람은 이미 가입한 서비스엔",
        "손해를 인정하기 싫어해",
        "그래서 안 쓰면서도 붙잡아",
      ),
      mindset: scriptBeat(
        "부자는 싸게 유지하기 전에",
        "아직 쓸 이유가 있는지부터 물어",
        "가격보다 사용 여부가 먼저야",
      ),
      habit: scriptBeat(
        "한 달 안 쓴 구독은",
        "바로 해지 목록에 넣어",
        "고민은 다음 결제만 늘려",
      ),
      recommendation: scriptBeat(
        "다음 자동결제 전에",
        "이 기준 저장해 둬",
        "구독 목록 열 때 다시 봐",
      ),
    };
  }

  if (/세일|할인|쿠폰/.test(topicText)) {
    return {
      hook: scriptBeat(
        "싸게 샀다고 착각하는 순간",
        "필요 없던 지출이 절약처럼 포장돼",
        "이게 세일의 함정이야",
      ),
      situation: scriptBeat(
        "할인 알림이 뜨면",
        "지금 안 사면 손해라는 생각이 먼저 올라와",
        "근데 원래 살 생각 없었잖아",
      ),
      consequence: scriptBeat(
        "문제는 가격이 낮아진 게 아니야",
        "원래 없던 결제가 생긴 거야",
        "그게 카드값을 조용히 키워",
      ),
      psychology: scriptBeat(
        "절약했다는 기분은 위험해",
        "소비를 정당화해주거든",
        "그래서 필요 없는 물건도 잘 산 것처럼 느껴져",
      ),
      mindset: scriptBeat(
        "부자는 싸게 사기 전에",
        "쓸 이유부터 물어",
        "할인율보다 기준이 먼저야",
      ),
      habit: scriptBeat(
        "세일 전에 필요한 물건 세 개만 적어",
        "목록 밖 할인은 넘겨",
        "싸도 필요 없으면 비싼 거야",
      ),
      recommendation: scriptBeat(
        "다음 세일 알림이 오면",
        "이 목록부터 열어",
        "저장해 둬",
      ),
    };
  }

  if (/고지서|카드값|잔고|빚|알림|비상금/.test(topicText)) {
    return {
      hook: scriptBeat(
        "카드값 보기 싫어서 앱 닫는 사람 많지",
        "근데 숫자를 안 본다고",
        "돈 문제가 사라지는 건 아니야",
      ),
      situation: scriptBeat(
        "잠깐은 마음이 편해",
        "근데 결제",
        "이자",
        "자동결제는 그대로 움직여",
      ),
      consequence: scriptBeat(
        "확인을 미룰수록",
        "문제는 작아지지 않아",
        "다음 달 선택지만 줄어들어",
      ),
      psychology: scriptBeat(
        "불안한 사람은 해결보다 회피를 먼저 골라",
        "그래서 같은 실수를 반복해",
        "보기 싫은 숫자가 제일 먼저 봐야 할 숫자야",
      ),
      mindset: scriptBeat(
        "성공하는 사람은 기분이 나빠도 숫자를 먼저 봐",
        "통제는 거기서 시작돼",
        "감정 말고 숫자로 봐",
      ),
      habit: scriptBeat(
        "오늘은 총액만 적어",
        "판단하지 말고",
        "변명하지 말고",
        "그냥 봐",
      ),
      recommendation: scriptBeat(
        "잔고가 무서울 때",
        "이 순서 저장해 둬",
        "앱 닫기 전에 다시 봐",
      ),
    };
  }

  if (/새벽|밤|폰|택배|장바구니/.test(topicText)) {
    return {
      hook: scriptBeat(
        "밤에 결제하고 아침에 후회한 적 있지",
        "그건 필요한 걸 산 게 아니라",
        "감정에 진 거야",
      ),
      situation: scriptBeat(
        "잠이 안 오고 피곤할수록",
        "폰 속 장바구니가",
        "가장 쉬운 보상처럼 보여",
      ),
      consequence: scriptBeat(
        "근데 그 결제는",
        "물건보다 다음 날 카드값과 찝찝함으로 더 오래 남아",
        "아침의 내가 갚는 거야",
      ),
      psychology: scriptBeat(
        "피곤한 뇌는 판단을 미뤄",
        "그리고 즉시 기분 좋아지는 버튼부터 눌러",
        "그래서 밤 결제는 자주 틀려",
      ),
      mindset: scriptBeat(
        "밤에는 결제하지 마",
        "담아만 둬",
        "피곤한 뇌가 고른 물건을 믿지 마",
      ),
      habit: scriptBeat(
        "아침에 다시 봐도 필요하면 그때 사",
        "대부분은 그때 힘이 빠져",
        "그게 진짜 필요 없었다는 증거야",
      ),
      recommendation: scriptBeat(
        "밤 결제가 잦다면",
        "이 규칙 저장해 둬",
        "결제 버튼 누르기 전에 다시 봐",
      ),
    };
  }

  if (/월급|자동이체|이체|입금|저축/.test(topicText)) {
    return {
      hook: scriptBeat(
        "월급 들어온 직후 쓰는 돈이",
        "그 사람의 진짜 습관을 보여줘",
        "돈 없을 때보다 이때가 더 정확해",
      ),
      situation: scriptBeat(
        "입금 알림이 뜨면 마음이 풀려",
        "이번 달은 괜찮겠지",
        "이 착각이 제일 먼저 올라와",
      ),
      consequence: scriptBeat(
        "그날 첫 결제가",
        "한 달 소비 흐름을 정해",
        "저축은 또 남은 돈이 돼",
      ),
      psychology: scriptBeat(
        "돈이 들어온 순간",
        "뇌는 여유가 생겼다고 착각해",
        "그래서 기준을 느슨하게 풀어",
      ),
      mindset: scriptBeat(
        "돈을 모으는 사람은 의지가 강한 게 아니야",
        "순서를 바꾸는 거야",
        "쓰기 전에 먼저 나눠",
      ),
      habit: scriptBeat(
        "입금 당일",
        "저축과 고정비부터 자동이체해",
        "남은 돈만 생활비로 봐",
      ),
      recommendation: scriptBeat(
        "다음 월급날 첫 한 시간에",
        "이 순서대로 해",
        "저장해 둬",
      ),
    };
  }

  const hook = scriptBeat(
    rec.hook.replace(/[.!?。]+$/g, ""),
    "근데 진짜 볼 건 행동 하나가 아니야",
    "그 행동이 내 돈을 어디로 끌고 가는지야",
  );
  const situation = scriptBeat(
    (rec.empathy?.trim() || "비슷한 선택을 반복한 적 있지").replace(/[.!?。]+$/g, ""),
    "사람은 돈 앞에서 생각보다 쉽게 흔들려",
  );
  const consequence = p2 && /기준선|잔고|월급|통장|빚|후회|결제|지출/.test(p2)
    ? scriptBeat(p2.replace(/[.!?。]+$/g, ""), "그게 반복되면 월말 잔고가 먼저 말해줘")
    : scriptBeat("월말 잔고가 줄어드는 건", "큰 사건보다 반복된 작은 선택 때문이야");
  const psychology = p1 && /심리|불안|체면|비교|보상|회피|합리화|욕망|기준선/.test(p1)
    ? scriptBeat(p1.replace(/[.!?。]+$/g, ""), "그래서 기준이 없으면 기분이 결정을 해")
    : scriptBeat("마음이 흔들리면", "사람은 기준보다 기분을 먼저 믿어", "그리고 결제 버튼을 눌러");
  const mindset = scriptBeat(
    "성공하는 사람은 참는 척하지 않아",
    "결제 전에 멈추는 규칙을 먼저 만들어",
  );
  const habit = p3 && p3.trim().length > 0
    ? scriptBeat(p3.replace(/[.!?。]+$/g, ""), "오늘 바로 한 번만 해 봐")
    : scriptBeat("오늘은 결제 전에 딱 하루만 미뤄", "필요 없는 건 하루 뒤에 힘이 빠져");
  const recommendation = scriptBeat(
    "저장해 둬",
    "비슷한 순간에 다시 봐",
  );
  return { hook, situation, consequence, psychology, mindset, habit, recommendation };
}

/** 스타일별 프리미엄 낭독문을 조립한다. 자막은 7단계 구조(hook/situation/consequence/psychology/mindset/habit/recommendation)를 쓴다. */
function assemblePremiumVoiceover(
  style: ScriptStyle,
  parts: ReturnType<typeof buildPlainScriptParts>,
): string {
  const { hook, situation, consequence, psychology, mindset, habit, recommendation } = parts;
  const e = normalizeNarrationBlock;
  if (style === "hook_heavy") {
    // 첫 2초에 문제를 바로 짚되, 이후 흐름은 상황→손해→심리→실천으로 자연스럽게 이어간다.
    return [e(hook), e(situation), e(consequence), e(psychology), e(mindset), e(habit), e(recommendation)].join("\n");
  }
  if (style === "reversal") {
    // 행동 탓으로 몰지 않고, 상황과 심리를 짚은 뒤 실천으로 내린다.
    return [e(hook), e(situation), e(consequence), e(psychology), e(mindset), e(habit), e(recommendation)].join("\n");
  }
  // empathy(기본): 문제 지적 → 흔한 상황 → 벌어지는 일 → 심리 → 행동 기준 → 실천 → 저장.
  return [e(hook), e(situation), e(consequence), e(psychology), e(mindset), e(habit), e(recommendation)].join("\n");
}

/** 낭독문 텍스트를 보고 스타일별 강점을 소폭 가산한다(결정적, 최고점 선택용). */
function scoreVoiceoverStyle(style: ScriptStyle, base: WizardQualityJudgment, voiceover: string): number {
  let bonus = 0;
  if (style === "hook_heavy" && /후회|닫은|미룬|결제하고|월말|아침에/.test(voiceover)) bonus += 3;
  if (style === "reversal" && /반대|진짜 문제/.test(voiceover)) bonus += 2;
  if (style === "empathy" && /적 있|했다면|그런 적/.test(voiceover)) bonus += 4; // 자기인식 흐름 우대
  return clamp(base.overallScore + bonus);
}

type FinanceScriptQualityInput = {
  title: string;
  hookLine: string;
  fullVoiceover: string;
  captionLines: readonly string[];
  scenes: readonly WizardScriptScene[];
};

const FINANCE_SCRIPT_RESULT_PATTERN =
  /돈|이자|카드|생활비|월급|저축|비용|현금|원금|지출|결제|소비|수입|소득|자산|손실|예산|비상금|주거비|가격|보험|연금|금액|납부|상환|고정비|할부|계좌|잔액|금리|연봉|월비용|총액|매출|수당|보증금|빚|납입액|금융비용|식비|물건값|영수증|할인|관계비|체면비|수익|투자금|집값|월세|관리비|한도|신용|노후|단가|물건|음식|투자|매수|매도|종목|수수료|세금|복리|목표/;
const FINANCE_SCRIPT_ACTION_PATTERN =
  /앱|영수증|자동이체|명세서|목록|계좌|잔고|총액|금리|결제일|상환일|한도|예산|적어|적고|남겨|확인|열고|열어|계산|해지|표시|타이머|사진|설정|분리|비교|모아|꺼|정해|작성|묶어|나눠|빼|옮겨|찍어|끄고|떼어|답해|합쳐|한 줄|표에/;
const FINANCE_SCRIPT_PSYCHOLOGY_PATTERN =
  /사람|심리|불안|회피|착각|기분|감정|안도감|보상|체면|비교|자책|합리화|욕망|두려|편해|익숙|느껴/;
const FINANCE_SCRIPT_STANDARD_PATTERN =
  /기준|순서|조건|한도|바닥|비율|돈을 지키|돈을 모으|자산을|성공하는|위기에 강한|노후를 준비|감당|선택권|먼저|따로|비교|예측|아는|알다는|아니야|않아|정해/;
const FINANCE_SCRIPT_FORBIDDEN_GENERIC_PATTERN =
  /제목 속 선택|같은 돈 문제|비슷한 선택|정보 감각|오늘 한 번만 직접 확인|다음 선택의 기준으로 남겨|회피이|자기합리화이|근데 진짜 문제는 따로 있어/;

/**
 * 제작 게이트용 평가기. 원본 seed가 아니라 확정 제목·낭독문·장면을 다시 읽어 판단한다.
 * 저장된 quality 숫자를 신뢰하지 않으므로 오래된 캐시나 변조된 대본도 같은 기준으로 차단된다.
 */
export function judgeFinanceScriptContent(input: FinanceScriptQualityInput): WizardQualityJudgment {
  const title = String(input.title ?? "").trim();
  const hookLine = String(input.hookLine ?? "").trim();
  const fullVoiceover = String(input.fullVoiceover ?? "").trim();
  const scenes = Array.isArray(input.scenes) ? input.scenes : [];
  const captionLines = Array.isArray(input.captionLines) ? input.captionLines : [];
  const stageText = (id: WizardScriptScene["id"]): string => scenes
    .filter((scene) => scene?.id === id)
    .map((scene) => String(scene.narration ?? "").trim())
    .filter(Boolean)
    .join("\n");
  const hookText = [hookLine, stageText("hook"), stageText("problem")].filter(Boolean).join("\n");
  const situationText = stageText("situation");
  const consequenceText = stageText("consequence");
  const psychologyText = stageText("psychology");
  const mindsetText = stageText("mindset");
  const habitText = stageText("habit");
  const closingText = [stageText("recommendation"), stageText("save")].filter(Boolean).join("\n");
  const allText = [title, hookText, situationText, consequenceText, psychologyText, mindsetText, habitText, closingText, fullVoiceover]
    .filter(Boolean)
    .join("\n");
  const narrationLines = fullVoiceover.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const sceneIds = new Set(scenes.map((scene) => scene?.id));
  const reject: string[] = [];

  const hasTitleHook = title.length >= 8 && title.length <= 40 && hookText.includes(title);
  const hasSituation = sceneIds.has("situation") && situationText.length >= 12;
  const hasMoneyResult = sceneIds.has("consequence") && FINANCE_SCRIPT_RESULT_PATTERN.test(consequenceText);
  const hasPsychology = sceneIds.has("psychology") && FINANCE_SCRIPT_PSYCHOLOGY_PATTERN.test(psychologyText);
  const hasStandard = sceneIds.has("mindset") && FINANCE_SCRIPT_STANDARD_PATTERN.test(mindsetText);
  const hasAction = sceneIds.has("habit") && FINANCE_SCRIPT_ACTION_PATTERN.test(habitText);
  const hasContextualRecall = /다음|때|전에|순간|날|시작|하려|싶어|보이면|느껴지면/.test(closingText) && /다시 봐|꺼내/.test(closingText);
  const hasSave = /저장해 둬/.test(closingText);
  const hasFollow = /팔로우해 둬/.test(closingText);
  const sceneCountOk = isSupportedWizardSceneCount(scenes.length);
  const captionsOk = captionLines.length === scenes.length && captionLines.every((line) => {
    const text = String(line ?? "").trim();
    return text.length > 0 && text.length <= WIZARD_CAPTION_MAX_CHARS;
  });
  const lineRhythmOk = narrationLines.length >= 18 && narrationLines.length <= WIZARD_SCRIPT_MAX_SHORT_LINES &&
    narrationLines.every((line) => line.length <= 64);
  const expectsStructuredVisualEvidence = true;
  const structuredVisualEvidenceOk = scenes.every((scene) =>
    scene.visualEvidence?.version === FINANCE_VISUAL_EVIDENCE_VERSION &&
    scene.visualEvidence.visualStyle === FINANCE_VISUAL_STYLE_CONTRACT &&
    scene.visualEvidence.sceneIdentity.length === 12 &&
    scene.visualEvidence.claim === String(scene.narration ?? "").replace(/\s+/g, " ").trim().slice(0, 320) &&
    scene.visualEvidence.mustShow.length >= 24 &&
    scene.visualEvidence.visibleAction.length >= 12 &&
    scene.visualEvidence.editorialProof.length >= 24 &&
    scene.visualEvidence.sceneSpecificSignal.length >= 24 &&
    scene.visualEvidence.sceneSetting.length >= 24 &&
    scene.visualEvidence.visualForm.length >= 24 &&
    scene.visualEvidence.cameraPlan.length >= 24 &&
    scene.visualEvidence.lightingPlan.length >= 24 &&
    scene.visualEvidence.differenceContract.length >= 24 &&
    scene.visualEvidence.causalComposition.length >= 24 &&
    scene.visualEvidence.continuityState.length >= 24 &&
    scene.visualCue.includes(scene.visualEvidence.sceneIdentity));
  const visualEvidenceIdentities = scenes.map((scene) => scene.visualEvidence?.sceneIdentity).filter(Boolean);
  const visualEvidenceUnique = !expectsStructuredVisualEvidence ||
    new Set(visualEvidenceIdentities).size === scenes.length;
  const adjacentHeroSubjectsDiffer = !expectsStructuredVisualEvidence || scenes.every((scene, index) =>
    index === 0 || scene.visualEvidence?.heroSubject !== scenes[index - 1].visualEvidence?.heroSubject);
  const evidenceSequence = structuredVisualEvidenceOk
    ? scenes.map((scene) => scene.visualEvidence as FinanceVisualEvidence)
    : [];
  const adjacentVisualDifferencesPass = !expectsStructuredVisualEvidence || (
    financeVisualSequencePass(evidenceSequence) && evidenceSequence.every((scene, index) =>
      index === 0 || financeVisualDifferenceCount(evidenceSequence[index - 1], scene) >= FINANCE_VISUAL_MIN_ADJACENT_DIFFERENCES)
  );
  const visualCuesOk = scenes.length > 0 && scenes.every((scene) => String(scene?.visualCue ?? "").trim().length >= 8) &&
    structuredVisualEvidenceOk && visualEvidenceUnique && adjacentHeroSubjectsDiffer && adjacentVisualDifferencesPass;
  const naturalTone = !AI_TONE_PATTERNS.test(allText) && !SHORTFORM_SOFT_POLITE_PATTERNS.test(allText);
  const nonGeneric = !FINANCE_SCRIPT_FORBIDDEN_GENERIC_PATTERN.test(allText);
  const titleQualityOk = !WEAK_TITLE_PATTERN.test(title) && !BROAD_METAPHOR_TITLE_PATTERN.test(title);

  if (!hasTitleHook) reject.push("확정 제목이 첫 훅에 그대로 이어지지 않습니다");
  if (!hasSituation) reject.push("누구나 겪는 보편 상황 장면이 부족합니다");
  if (!hasMoneyResult) reject.push("구체적인 경제 결과가 대본에 없습니다");
  if (!hasPsychology) reject.push("반복 행동을 설명하는 심리 장면이 부족합니다");
  if (!hasStandard) reject.push("성공 기준과 판단 전환이 대본에 없습니다");
  if (!hasAction) reject.push("앱·숫자·기록 중 하나를 쓰는 구체 행동이 없습니다");
  if (!hasContextualRecall || !hasSave || !hasFollow) reject.push("상황별 다시 보기·저장·팔로우 마무리가 완전하지 않습니다");
  if (!sceneCountOk) reject.push(`장면 수가 의미 흐름 안전 범위 ${WIZARD_SCRIPT_MIN_SCENE_COUNT}~${WIZARD_SCRIPT_MAX_SCENE_COUNT}개를 벗어났습니다`);
  if (!captionsOk) reject.push("장면 자막 수 또는 34자 제한이 맞지 않습니다");
  if (!lineRhythmOk) reject.push("낭독문이 짧은 줄 중심의 쇼츠 리듬을 지키지 않습니다");
  if (!visualCuesOk) reject.push("장면별 시각 증거가 부족합니다");
  if (!naturalTone) reject.push("설명체 또는 부드러운 존댓말이 남아 있습니다");
  if (!nonGeneric) reject.push("다른 제목에도 붙는 일반론 문장이 남아 있습니다");
  if (!titleQualityOk) reject.push("확정 제목이 설명형 또는 큰 비유형 패턴에 걸립니다");

  let retention = 58;
  if (hasTitleHook) retention += 14;
  if (hookLine.length >= 8 && hookLine.length <= 40) retention += 6;
  if (STAKES_RESULT_PATTERN.test(hookText) || CURIOSITY_GAP_PATTERN.test(title) || ECONOMIC_CONTRADICTION_PATTERN.test(title)) retention += 8;
  if (CONCRETE_MONEY_OBJECT_PATTERN.test(title)) retention += 6;

  let selfRecognition = 56;
  if (hasSituation) selfRecognition += 12;
  if (/(내 |내가|우리|사람|했다면|적 있|하는 순간|하는 사람)/.test(`${hookText}\n${situationText}`)) selfRecognition += 10;
  if (LIVING_SCENE_KEYWORDS.some((keyword) => allText.includes(keyword))) selfRecognition += 8;
  if (hasPsychology) selfRecognition += 6;

  let clarity = 58;
  if (sceneCountOk) clarity += 10;
  if (captionsOk) clarity += 10;
  if (lineRhythmOk) clarity += 10;
  if (hasSituation && hasMoneyResult && hasPsychology && hasStandard && hasAction) clarity += 8;

  let visualizability = 58;
  if (visualCuesOk) visualizability += 16;
  if (structuredVisualEvidenceOk && visualEvidenceUnique && adjacentHeroSubjectsDiffer && adjacentVisualDifferencesPass) visualizability += 8;
  if (scenes.length >= 7) visualizability += 8;
  if (VISUALIZABLE_KEYWORDS.some((keyword) => allText.includes(keyword))) visualizability += 8;

  let antiAiTone = 96;
  if (!naturalTone) antiAiTone -= 28;
  if (!nonGeneric) antiAiTone -= 24;
  if (!titleQualityOk) antiAiTone -= 18;

  let specificity = 50;
  if (hasMoneyResult) specificity += 12;
  if (hasPsychology) specificity += 8;
  if (hasStandard) specificity += 8;
  if (hasAction) specificity += 14;
  if (hasContextualRecall && hasSave && hasFollow) specificity += 8;

  const scores = {
    retentionScore: clamp(retention),
    selfRecognitionScore: clamp(selfRecognition),
    clarityScore: clamp(clarity),
    visualizabilityScore: clamp(visualizability),
    antiAiToneScore: clamp(antiAiTone),
    specificityScore: clamp(specificity),
  };
  const overallScore = clamp(
    scores.retentionScore * 0.22 +
      scores.selfRecognitionScore * 0.24 +
      scores.clarityScore * 0.14 +
      scores.visualizabilityScore * 0.12 +
      scores.antiAiToneScore * 0.16 +
      scores.specificityScore * 0.12,
  );
  return {
    ...scores,
    overallScore,
    rejectReasons: [...new Set(reject)],
    rewriteReasons: [],
    passed: overallScore >= WIZARD_FINANCE_SCRIPT_QUALITY_FLOOR && reject.length === 0,
  };
}

export function buildScriptFromGeneratedTopic(rec: WizardGeneratedTopicRecord): WizardScriptPreview {
  const [p1, p2, p3] = rec.points;
  const isPremium = typeof rec.empathy === "string" && rec.empathy.trim().length > 0;
  const strict = rec.category === "finance";
  const editorialTopic = resolveFinanceEditorialTopic(rec);
  const editorialParts = editorialTopic ? buildFinanceEditorialScriptParts(editorialTopic) : null;
  const videoStrategy = editorialTopic && editorialParts
    ? buildFinanceEditorialVideoStrategy(editorialTopic, editorialParts)
    : null;
  const parts = isPremium
    ? buildPlainScriptParts(rec)
    : {
        hook: rec.hook,
        situation: ANGLE_CURIOSITY[rec.angle] ?? ANGLE_CURIOSITY["꿀팁"],
        consequence: p1,
        psychology: p2,
        mindset: ANGLE_TWIST[rec.angle] ?? ANGLE_TWIST["꿀팁"],
        habit: p3,
        recommendation: rec.save,
      };
  const curiosity = parts.situation;
  // 프리미엄은 points[1]이 반전 문장이므로 twist 슬롯에도 그 문장을 쓴다(대본 구조 표기용).
  const twist = isPremium ? p2 : (ANGLE_TWIST[rec.angle] ?? ANGLE_TWIST["꿀팁"]);

  // 대본을 하나만 내지 않고 3스타일 후보를 만들어 최고점을 기본으로 고른다.
  const baseJudgment = judgeTopicSeed(rec, strict);
  const styleOrder: ScriptStyle[] = ["hook_heavy", "empathy", "reversal"];
  const candidates = styleOrder.map((style) => {
    const voiceover = isPremium
      ? assemblePremiumVoiceover(style, parts)
      : `${rec.hook} ${curiosity} 첫째, ${p1}. 둘째, ${p2}. 셋째, ${p3}. ${twist} ${rec.save}.`;
    return { style, voiceover, score: scoreVoiceoverStyle(style, baseJudgment, voiceover) };
  });
  // 최고점 선택(동점이면 styleOrder 우선순위 유지 = 안정 정렬).
  const best = candidates.reduce((a, b) => (b.score > a.score ? b : a), candidates[0]);
  const fullVoiceover = best.voiceover;
  const usesEditorialScriptEngine = rec.category === "finance" && Boolean(rec.financeSubtopic);
  const action = usesEditorialScriptEngine ? parts.recommendation : rec.save;

  const { hookScore, clarityScore } = estimateScores(rec);
  const scenes = buildScenePlan({
    title: rec.title,
    hook: parts.hook,
    situation: parts.situation,
    consequence: parts.consequence,
    psychology: parts.psychology,
    mindset: parts.mindset,
    habit: parts.habit,
    recommendation: parts.recommendation,
    visualMetaphor: rec.visualMetaphor,
    moneyAnchor: rec.moneyAnchor,
    psychologyAnchor: rec.psychologyAnchor,
    successAnchor: rec.successAnchor,
    financeSubtopic: rec.financeSubtopic,
    editorialLane: rec.editorialLane,
    problemStatement: rec.problemStatement,
    twist: rec.twist,
    takeawayAction: rec.takeawayAction,
  });
  const captionLines = scenes.map((s) => trimWizardCaption(s.captionText || s.narration));
  const judgment: WizardQualityJudgment = strict
    ? judgeFinanceScriptContent({ title: rec.title, hookLine: rec.hook, fullVoiceover, captionLines, scenes })
    : { ...baseJudgment, overallScore: best.score };

  // 사람이 읽는 품질 요약(좋은 이유 / 고친 부분 / 주의할 점) — 2~4줄용.
  const goodReasons: string[] = [];
  if (judgment.selfRecognitionScore >= 78) goodReasons.push("훅이 '내 얘기' 같아 첫 3초가 강해요");
  if (judgment.retentionScore >= 78) goodReasons.push("첫 문장에 실제 행동이 있어 끝까지 봐요");
  if (judgment.visualizabilityScore >= 74) goodReasons.push("영상으로 보여줄 장면이 분명해요");
  if (judgment.antiAiToneScore >= 85) goodReasons.push("설명체가 적고 말투가 자연스러워요");
  if (goodReasons.length === 0) goodReasons.push("자기인식형 훅 구조를 지키고 있어요");

  const fixedParts = [...baseJudgment.rewriteReasons];
  const scriptQualityPassed = !strict || (judgment.passed && judgment.overallScore >= WIZARD_FINANCE_SCRIPT_QUALITY_FLOOR);
  if (fixedParts.length === 0) {
    fixedParts.push(
      scriptQualityPassed
        ? "자동 재작성 없이 기준을 통과했어요"
        : "통과 기준 미달: 실제 제작 단계로 넘기지 않았습니다",
    );
  }

  const watchOuts = [...judgment.rejectReasons];
  if (watchOuts.length === 0) watchOuts.push("특별한 약점은 발견되지 않았습니다");

  return {
    topicId: rec.topicId,
    title: rec.title,
    hook: rec.hook,
    hookLine: rec.hook,
    curiosity,
    points: [...rec.points],
    twist,
    action,
    captionLines,
    fullVoiceover,
    scenes,
    videoStrategy,
    captionFirstLineHook: rec.hook,
    uploadCaptionDraft: usesEditorialScriptEngine
      ? `${rec.hook}\n\n${fullVoiceover}`.trim()
      : `${rec.hook}\n${curiosity}\n\n${p2}\n${p3}\n\n${rec.save}`,
    goldenSampleChecks: {
      // 자기인식형: 2인칭 지칭 또는 "~했다면/~적 있죠/~하는 사람" 같은 들킨-느낌 어투를 인정.
      selfRelevantHook:
        /(나|내 |내가|당신|우리|했다면|적 있|하는 사람|계신가요|있나요|있었나요|비웠|잠근)/.test(
          `${rec.title} ${rec.hook} ${curiosity}`,
        ),
      hasCausalBridges: isPremium,
      concreteActionWithTiming: /(월급|결제|오늘|이번 주|주말|밤|아침|다음)/.test(action),
      captionsWithinLimit: captionLines.every((c) => c.length <= WIZARD_CAPTION_MAX_CHARS),
    },
    hookScore,
    clarityScore,
    quality: judgment,
    selectedStyle: SCRIPT_STYLE_LABELS[best.style],
    qualitySummary: {
      goodReasons: goodReasons.slice(0, 3),
      fixedParts: fixedParts.slice(0, 3),
      watchOuts: watchOuts.slice(0, 3),
    },
    candidateScores: candidates.map((c) => ({
      style: SCRIPT_STYLE_LABELS[c.style],
      overallScore: strict
        ? clamp(judgment.overallScore - Math.max(0, best.score - c.score))
        : c.score,
      selected: c.style === best.style,
    })),
  };
}

export type WizardScriptPreview = {
  topicId: string;
  title: string;
  hook: string;
  /** 첫 2초 훅(=hook, UI 표기용 명시 필드) */
  hookLine: string;
  curiosity: string;
  points: string[];
  twist: string;
  action: string;
  captionLines: string[];
  fullVoiceover: string;
  /** 골든 샘플 6단계 장면/자막 플랜 */
  scenes: WizardScriptScene[];
  /** 재테크 공통 사전 훅·의미 분할 전략. 비재테크 fixture에는 null. */
  videoStrategy: FinanceEditorialVideoStrategy | null;
  /** 업로드 caption 첫 줄(훅) */
  captionFirstLineHook: string;
  /** 업로드용 설명 초안 */
  uploadCaptionDraft: string;
  goldenSampleChecks: WizardGoldenSampleChecks;
  hookScore: number | null;
  clarityScore: number | null;
  /** 로컬 품질 평가 — 대본 후보를 점수화한 결과(최고점 후보 기준). */
  quality: WizardQualityJudgment;
  /** 선택된 후보 스타일(강한 후킹형/공감형/반전형 중 최고점). */
  selectedStyle: string;
  /** 사람이 읽는 요약: 좋은 이유 / 고친 부분 / 주의할 점 (각 2~4줄용). */
  qualitySummary: {
    goodReasons: string[];
    fixedParts: string[];
    watchOuts: string[];
  };
  /** 후보 3안 점수(개발자 details용). */
  candidateScores: Array<{ style: string; overallScore: number; selected: boolean }>;
};

export type WizardScriptQualityGate = {
  required: boolean;
  passed: boolean;
  overallScore: number | null;
  minimumScore: number | null;
  reasons: string[];
};

/** 재테크 대본은 점수와 경고를 모두 통과해야 실제 제작 단계로 넘어갈 수 있다. */
export function getWizardScriptQualityGate(topicId: string, script: WizardScriptPreview): WizardScriptQualityGate {
  // Canonical generated finance IDs are sufficient for the gate; avoid a catalog read in no-write audits.
  const isFinance = topicId.startsWith("gen-finance") || readWizardGeneratedTopic(topicId)?.category === "finance";
  if (!isFinance) {
    return { required: false, passed: true, overallScore: script.quality?.overallScore ?? null, minimumScore: null, reasons: [] };
  }

  const quality = judgeFinanceScriptContent({
    title: script.title,
    hookLine: script.hookLine || script.hook,
    fullVoiceover: script.fullVoiceover,
    captionLines: script.captionLines,
    scenes: script.scenes,
  });

  const reasons = [...quality.rejectReasons];
  if (quality.overallScore < WIZARD_FINANCE_SCRIPT_QUALITY_FLOOR) {
    reasons.unshift(`대본 품질 점수 ${quality.overallScore}점이 재테크 통과 기준 ${WIZARD_FINANCE_SCRIPT_QUALITY_FLOOR}점보다 낮습니다`);
  }
  if (!quality.passed) {
    reasons.unshift("첫 3초 훅·자기인식·구체성 중 하나 이상이 재테크 통과 기준에 미달합니다");
  }
  return {
    required: true,
    passed: reasons.length === 0,
    overallScore: quality.overallScore,
    minimumScore: WIZARD_FINANCE_SCRIPT_QUALITY_FLOOR,
    reasons: [...new Set(reasons)],
  };
}

/** 대본 스타일 후보 — 같은 주제를 3가지 앵글로 조립해 최고점을 고른다. */
type ScriptStyle = "hook_heavy" | "empathy" | "reversal";
const SCRIPT_STYLE_LABELS: Record<ScriptStyle, string> = {
  hook_heavy: "강한 후킹형",
  empathy: "공감형",
  reversal: "반전형",
};

/** 선택한 주제의 규칙 기반 대본(이미 컴파일된 로컬 결과)을 돌려준다. 없으면 null. */
export function readScriptPreview(topicId: string): WizardScriptPreview | null {
  const compiled = readRepoJson(FIXTURE_SCRIPT_COMPILER_OUTPUT) as {
    topics?: Array<{
      topicId?: string;
      selectedCandidateId?: string;
      candidates?: Array<{
        candidateId?: string;
        selectedHookText?: string;
        script?: {
          topic?: string;
          hook?: string;
          curiosity?: string;
          points?: string[];
          twist_or_reframe?: string;
          action_or_save_reason?: string;
          caption_lines?: string[];
          full_voiceover?: string;
        };
        scores?: { hook_score?: number; script_clarity_score?: number };
      }>;
    }>;
  } | null;
  const t = (compiled?.topics ?? []).find((x) => x.topicId === topicId);
  if (!t) {
    // 컴파일 fixture에 없으면 생성 주제 카탈로그에서 찾아 규칙 기반으로 대본을 만든다.
    const generated = readWizardGeneratedTopic(topicId);
    return generated ? buildScriptFromGeneratedTopic(generated) : null;
  }
  const cand = (t.candidates ?? []).find((c) => c.candidateId === t.selectedCandidateId) ?? (t.candidates ?? [])[0];
  const s = cand?.script;
  if (!s?.topic) return null;
  const hook = cand?.selectedHookText ?? s.hook ?? "";
  const points = s.points ?? [];
  const captionLines = s.caption_lines ?? [];
  const action = s.action_or_save_reason ?? "";
  const fullVoiceover = s.full_voiceover ?? "";
  return {
    topicId,
    title: s.topic,
    hook,
    hookLine: hook,
    curiosity: s.curiosity ?? "",
    points,
    twist: s.twist_or_reframe ?? "",
    action,
    captionLines,
    fullVoiceover,
    videoStrategy: null,
    // 컴파일 fixture 대본도 같은 7단계 장면 플랜으로 노출한다(시각 큐는 일반형).
    scenes: buildScenePlan({
      title: s.topic,
      hook,
      situation: s.curiosity ?? points[0] ?? hook,
      consequence: points[0] ?? s.curiosity ?? hook,
      psychology: points[1] ?? s.twist_or_reframe ?? points[0] ?? "",
      mindset: s.twist_or_reframe ?? points[1] ?? action,
      habit: points[2] ?? action,
      recommendation: action,
      visualMetaphor: "돈 습관을 보여주는 경제 오브젝트 콜라주",
      moneyAnchor: "소비",
      psychologyAnchor: "습관",
      successAnchor: "실천",
    }),
    captionFirstLineHook: hook,
    uploadCaptionDraft: `${hook}\n\n${fullVoiceover}`.trim(),
    goldenSampleChecks: {
      selfRelevantHook: /(나|내 |내가|당신|우리)/.test(`${s.topic} ${hook}`),
      hasCausalBridges: !/첫째|둘째|셋째/.test(fullVoiceover),
      concreteActionWithTiming: /(월급|결제|오늘|이번 주|주말|밤|아침|다음)/.test(action),
      captionsWithinLimit: captionLines.every((c) => c.length <= WIZARD_CAPTION_MAX_CHARS),
    },
    hookScore: cand?.scores?.hook_score ?? null,
    clarityScore: cand?.scores?.script_clarity_score ?? null,
    // fixture 대본도 같은 로컬 품질 평가기로 점수화한다(seed 형태로 변환 후 judge).
    ...(() => {
      const pseudoSeed: WizardTopicSeed = {
        slug: "fixture",
        title: s.topic ?? "",
        hook,
        angle: "심리",
        points: [points[0] ?? "", points[1] ?? "", points[2] ?? ""],
        save: action,
        empathy: s.curiosity ?? "",
      };
      const judgment = judgeTopicSeed(pseudoSeed, false);
      return {
        quality: judgment,
        selectedStyle: "컴파일 대본",
        qualitySummary: {
          goodReasons: judgment.overallScore >= 75 ? ["컴파일된 대본 기준을 통과했습니다"] : ["컴파일된 로컬 대본입니다"],
          fixedParts: ["자동 재작성 없이 그대로 사용합니다"],
          watchOuts: judgment.rejectReasons.length > 0 ? judgment.rejectReasons.slice(0, 3) : ["특별한 약점은 발견되지 않았습니다"],
        },
        candidateScores: [{ style: "컴파일 대본", overallScore: judgment.overallScore, selected: true }],
      };
    })(),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 선택 주제 → topic-specific 파이프라인 입력 생성 (repo 밖, no-upload, no-secret)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * 검증된 topicId를 파일시스템/경로에 안전한 slug로 변환한다.
 * 영문 소문자/숫자/하이픈만 남기며, 이 값만 경로 조각으로 쓴다(사용자 입력 원문은 경로에 넣지 않음).
 * 결과가 비면 null(입력 생성 자체를 막는다).
 */
export function toSafeTopicSlug(topicId: string): string | null {
  const slug = String(topicId ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return slug.length > 0 ? slug : null;
}

/** 한 캡션 줄을 ASS/자막 폭에 맞게 자른다(원본 대본 텍스트만 사용, 새 주장 생성 금지). */
function trimCaption(text: string, max = WIZARD_CAPTION_MAX_CHARS): string {
  const t = String(text ?? "").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

export type WizardVideoInputPaths = {
  topicId: string;
  safeSlug: string;
  inputDir: string;
  outRoot: string;
  manifestPath: string;
  ttsScriptPath: string;
  uploadMetadataPath: string;
  ownerApprovalPath: string;
  /** 실제 mp4 자막으로 구워질 씬별 캡션(검증용으로 route가 참조). */
  sceneCaptions: string[];
};

/**
 * 선택한 ready 주제의 대본으로 topic-specific 파이프라인 입력 4종을 repo 밖에 생성한다.
 * 기존 provider fixture schema를 따르되 manifestId/ids/captions/title/caption을
 * 선택 주제에 맞게 채워, 파이프라인이 만드는 mp4 자막·upload payload에 주제가 반영되게 한다.
 *
 * 안전 계약:
 * - 모든 경로는 repo 밖 WIZARD_INPUTS_ROOT\<safeSlug> 아래. safeSlug는 [a-z0-9-]만.
 * - local_mock / notUploaded:true / ownerApprovalRequired:true / actualUploadAllowed:false 유지.
 * - 외부 API/secret/upload 없음. 데이터 파일만 쓴다.
 */
export function buildWizardVideoInputsForTopic(topicId: string): { ok: true; paths: WizardVideoInputPaths } | { ok: false; reason: string } {
  const safeSlug = toSafeTopicSlug(topicId);
  if (!safeSlug) return { ok: false, reason: "topic_id_invalid_or_empty" };

  // 확정 대본(Claude 보정 반영본)이 있으면 그것을 쓴다 — 시안/최종이 같은 대본을 공유한다.
  const script = readWizardFinalScript(topicId) ?? readScriptPreview(topicId);
  if (!script) return { ok: false, reason: "script_not_compiled_for_topic" };

  const points = script.points.length > 0 ? script.points : [];
  const fallbackNarrations = [
    script.hook,
    script.curiosity || points[0] || script.hook,
    script.curiosity || script.hook,
    points[0] || script.curiosity || script.hook,
    points[1] || points[0] || script.twist,
    script.twist || points[1] || script.action,
    points[2] || script.action,
    script.action || script.twist,
    script.action || script.hook,
  ].map((s) => String(s ?? "").trim() || script.hook);
  const fallbackSceneIds: WizardScriptScene["id"][] = ["hook", "problem", "situation", "consequence", "psychology", "mindset", "habit", "recommendation", "save"];
  const sourceScenesRaw: WizardScriptScene[] = Array.isArray(script.scenes) && isSupportedWizardSceneCount(script.scenes.length)
    ? script.scenes
    : fallbackNarrations.map((n, i) => ({
        id: fallbackSceneIds[i] ?? "save",
        label: `${i + 1}. 장면`,
        narration: n,
        captionText: trimWizardCaption(script.captionLines?.[i] ?? n),
        visualCue: "Bright integrated family-feature-quality cinematic 3D animation for the selected topic, with natural Korean adult proportions, restrained micro-acting and one coherent lived-in home, cafe, store or workplace scene; never photography, live action, miniature, dollhouse, diorama, laboratory, vault, factory, machine room, black-metal staging, pasted cutout, superhero pose, lunge or reach toward the camera; no readable text or logo; captions are added later by the renderer.",
      }));
  const sourceScenes = applyWizardSceneMediaStrategies(sourceScenesRaw);
  const sceneNarrations = sourceScenes.map((s, i) => String(s.narration ?? "").trim() || fallbackNarrations[i] || script.hook);
  const sceneCaptions = sourceScenes.map((s, i) => trimCaption(s.captionText ?? script.captionLines?.[i] ?? sceneNarrations[i]));
  const timeline = buildWizardSceneTimeline(sceneNarrations);
  const sceneDur = timeline.durations;
  const sceneStart = timeline.starts;
  const sceneEnd = timeline.ends;
  const sceneRoles = sourceScenes.map((s) => s.id);

  const manifestId = `rp-wizard-${safeSlug}`;
  const sourceId = `money-shorts-wizard-${safeSlug}`;
  const ttsPackageId = `tts-${sourceId}`;

  const renderManifest = {
    schemaVersion: "money_shorts_render_plan_v1",
    manifestId,
    sourceId,
    sourceType: "script_package",
    factCardIds: [`fact-card-wizard-${safeSlug}`],
    sourceCitationIds: [`citation-wizard-${safeSlug}`],
    timelineId: `timeline-${sourceId}`,
    ttsPackageId,
    imagePromptPackageId: null,
    chartCardPackageId: null,
    riskLevel: "unchecked",
    createdAt: "2026-07-08T00:00:00+09:00",
    wizardTopicId: topicId,
    wizardTopicTitle: script.title,
    outputSpec: {
      codec: "h264",
      audioCodec: "aac",
      container: "mp4",
      crf: 23,
      audioBitrateKbps: 128,
      fps: 30,
      dimensions: { widthPx: 1080, heightPx: 1920 },
      plannedOutputPath: `output/planned/${sourceId}.mp4`,
    },
    imageInputs: sourceScenes.map((_, i) => ({
      sceneId: `scene-${sourceId}-${i + 1}`,
      sceneIndex: i + 1,
      assetPath: `assets/images/${sourceId}/scene-${i + 1}.jpg`,
      assetSourceType: "placeholder",
      imagePromptPackageId: null,
      sceneImagePromptId: null,
      chartCardPackageId: null,
      durationSec: sceneDur[i],
      motionType: "card_slide",
      mediaStrategy: sourceScenes[i].mediaStrategy,
      mediaStrategyContractVersion: sourceScenes[i].mediaStrategyContractVersion,
      mediaStrategySource: sourceScenes[i].mediaStrategySource,
      mediaStrategyScore: sourceScenes[i].mediaStrategyScore,
      mediaStrategyReasonCodes: sourceScenes[i].mediaStrategyReasonCodes,
    })),
    audioInput: {
      ttsPackageId,
      voiceProfileId: "voice-local-mock",
      provider: "local_mock",
      assetPath: `assets/audio/${ttsPackageId}.mp3`,
      plannedDurationSec: timeline.totalDurationSec,
    },
    captionOverlays: sourceScenes.map((_, i) => ({
      sceneId: `scene-${sourceId}-${i + 1}`,
      sceneIndex: i + 1,
      captionText: sceneCaptions[i],
      showAtSec: sceneStart[i],
      hideAtSec: sceneEnd[i],
      captionStyle: "bold_short_center_lower",
    })),
    sourceOverlays: [
      {
        sourceName: `wizard-local-mock-${safeSlug}`,
        sourceUrl: `https://placeholder.source/wizard-${safeSlug}`,
        publishedDate: "placeholder",
        showAtSec: 27,
        hideAtSec: 30,
      },
    ],
    // render duration plan (data-only). render script reads estimatedDurationSec; falls back to imageInputs sum.
    renderPlan: {
      fullCommand: "render-plan placeholder (data-only — not executed from JSON)",
      fragments: [],
      plannedOutputPath: `output/planned/${sourceId}.mp4`,
      estimatedDurationSec: timeline.totalDurationSec,
    },
  };

  const ttsScript = {
    schemaVersion: "money_shorts_tts_script_v1",
    scriptId: `tts-script-wizard-${safeSlug}-local-mock`,
    manifestId,
    factCardId: `fact-card-wizard-${safeSlug}`,
    ttsProvider: "local_mock",
    ttsMode: "local_mock",
    voiceProfile: "local_mock_placeholder",
    targetDurationSec: timeline.totalDurationSec,
    wizardTopicId: topicId,
    riskNotes: [
      "local_mock TTS: Windows placeholder noise audio — not real speech.",
      "Final voice quality must be validated with ElevenLabs or OpenAI TTS in a dedicated quality-check task.",
      "Narration text is derived from the selected topic's rule-based script for reference.",
      "This mux task validates pipeline (audio track attachment, duration, codec) only — not voice quality.",
    ],
    scenes: sourceScenes.map((_, i) => ({
      sceneNumber: i + 1,
      sceneRole: sceneRoles[i],
      durationSec: sceneDur[i],
      startSec: sceneStart[i],
      endSec: sceneEnd[i],
      ttsText: sceneNarrations[i],
      narration: sceneNarrations[i],
      captionText: sceneCaptions[i],
    })),
  };

  // upload metadata — 선택 title/caption/hashtags 기반, no-upload 마커 유지.
  const cleanTitle = script.title.trim();
  const hookLine = script.hook.trim();
  const bodyLines = [script.curiosity, ...points, script.twist, script.action]
    .map((x) => String(x ?? "").trim())
    .filter((x) => x.length > 0);
  const description = `${hookLine}\n\n${bodyLines.join("\n")}\n\n주의: 이 영상은 투자 권고가 아닙니다. 생활 지출 점검의 단서로만 활용하세요.`;
  const igCaption = `${cleanTitle}\n\n${hookLine}\n\n투자 권고 아님 — 내 지출 구조 점검용 정보입니다.`;
  const hashtags = ["재테크", "생활경제", "돈관리", "경제신호", "쇼츠"];

  const uploadMetadata = {
    schemaVersion: "money_shorts_upload_metadata_v1",
    metadataId: `upload-metadata-wizard-${safeSlug}-local-mock`,
    sourceManifestId: manifestId,
    mode: "local_mock",
    ownerApprovalRequired: true,
    notUploaded: true,
    wizardTopicId: topicId,
    wizardTopicTitle: cleanTitle,
    platforms: ["youtube_shorts", "instagram_reels"],
    youtube_shorts: {
      title: `${cleanTitle} #재테크 #생활경제 #쇼츠`.slice(0, 100),
      description,
      hashtags,
      visibilityPlan: "owner_review_first",
      categoryId: "27",
      defaultLanguage: "ko",
      madeForKids: false,
    },
    instagram_reels: {
      caption: igCaption,
      hashtags: [...hashtags, "인스타릴스"],
      visibilityPlan: "owner_review_first",
    },
    riskNotes: [
      "local_mock: no real account, channel, token, or credential used.",
      "ownerApprovalRequired=true — Owner must review and approve before any actual upload.",
      "notUploaded=true — this is a data-only payload. No upload has occurred.",
      "Title/description/caption are derived from the selected topic's rule-based script draft. Owner should review before upload.",
      "No OAuth, accessToken, refreshToken, or API credentials are present in this fixture.",
    ],
  };

  const ownerApproval = {
    schemaVersion: "money_shorts_owner_upload_approval_v1",
    approvalId: `owner-approval-wizard-${safeSlug}-local-mock-001`,
    mode: "local_mock",
    approvalStatus: "approved",
    approvedFor: "dry_run_upload_ready_packet_only",
    uploadPayloadId: `upload-payload-${manifestId}-local-mock`,
    sourceManifestId: manifestId,
    approvedPlatforms: ["youtube_shorts", "instagram_reels"],
    ownerApprovalRequired: true,
    actualUploadAllowed: false,
    actualUploadPerformed: false,
    approvalTimestamp: "2026-07-08T00:00:00.000Z",
    approvalNotes: "local_mock dry-run only — no real account, channel, token, credential, or upload allowed.",
    riskNotes: [
      "local_mock: this is a simulated owner approval fixture for pipeline validation only.",
      "actualUploadAllowed=false — no actual upload may occur from this approval.",
      "actualUploadPerformed=false — confirmed no upload has been performed.",
      "approvedFor=dry_run_upload_ready_packet_only — approval covers packet generation only.",
      "Real upload requires a separate explicit Owner approval with live credentials, channel, and account.",
    ],
  };

  const inputDir = join(WIZARD_INPUTS_ROOT, safeSlug);
  const outRoot = join(WIZARD_VIDEO_OUT_ROOT, safeSlug);
  const manifestPath = join(inputDir, "render-manifest.visual-only.json");
  const ttsScriptPath = join(inputDir, "tts-script.local-mock.json");
  const uploadMetadataPath = join(inputDir, "upload-metadata.local-mock.json");
  const ownerApprovalPath = join(inputDir, "owner-upload-approval.local-mock.json");

  try {
    mkdirSync(inputDir, { recursive: true });
    writeFileSync(manifestPath, JSON.stringify(renderManifest, null, 2), "utf8");
    writeFileSync(ttsScriptPath, JSON.stringify(ttsScript, null, 2), "utf8");
    writeFileSync(uploadMetadataPath, JSON.stringify(uploadMetadata, null, 2), "utf8");
    writeFileSync(ownerApprovalPath, JSON.stringify(ownerApproval, null, 2), "utf8");
  } catch (e) {
    return { ok: false, reason: `input_write_failed:${(e as Error).message}` };
  }

  return {
    ok: true,
    paths: {
      topicId,
      safeSlug,
      inputDir,
      outRoot,
      manifestPath,
      ttsScriptPath,
      uploadMetadataPath,
      ownerApprovalPath,
      sceneCaptions,
    },
  };
}

export type WizardVoiceStatus = {
  exists: boolean;
  durationSec: number | null;
  audioPath: string | null;
  audioBytes: number | null;
  notRealSpeech: boolean;
};

/** 음성 시안 산출물 상태(local_mock TTS summary). */
export function readVoiceSampleStatus(topicId?: string | null): WizardVoiceStatus {
  const slug = topicId ? toSafeTopicSlug(topicId) : null;
  const voiceDir = slug ? join(WIZARD_VOICE_OUT_DIR, slug) : WIZARD_VOICE_OUT_DIR;
  const summary = readAbsJson(join(voiceDir, "local-mock-tts-audio-summary.json")) as {
    audioPath?: string;
    rawAudioDurationSec?: number;
    notRealSpeech?: boolean;
  } | null;
  const audioPath = typeof summary?.audioPath === "string" ? summary.audioPath : null;
  return {
    exists: audioPath != null && existsSync(audioPath),
    durationSec: typeof summary?.rawAudioDurationSec === "number" ? summary.rawAudioDurationSec : null,
    audioPath,
    audioBytes: audioPath ? fileBytes(audioPath) : null,
    notRealSpeech: summary?.notRealSpeech !== false,
  };
}

export type WizardVideoStatus = {
  exists: boolean;
  flowStatus: string | null;
  steps: Array<{ id: string; status: string }>;
  muxedMp4Path: string | null;
  muxedMp4Bytes: number | null;
  silentMp4Path: string | null;
  silentMp4Bytes: number | null;
  notUploaded: boolean;
  /** 이 산출물이 어떤 선택 주제로 만들어졌는지(입력 manifest에서 확인). */
  topicId: string | null;
  topicTitle: string | null;
};

/**
 * topicId → 산출물 out-root를 고른다. topicId가 유효하면 topic별 폴더,
 * 없으면 기존 고정 폴더(하위 호환)를 쓴다. 반환 경로는 항상 repo 밖.
 */
function wizardOutRootFor(topicId?: string | null): string {
  const slug = topicId ? toSafeTopicSlug(topicId) : null;
  return slug ? join(WIZARD_VIDEO_OUT_ROOT, slug) : WIZARD_VIDEO_OUT_ROOT;
}

/** 시안 영상 파이프라인 산출물 상태(run summary + mp4 파일 존재/크기). */
export function readWizardVideoStatus(topicId?: string | null): WizardVideoStatus {
  const outRoot = wizardOutRootFor(topicId);
  const summary = readAbsJson(join(outRoot, "pipeline-run-summary.local-mock.json")) as {
    flowStatus?: string;
    // 파이프라인 summary의 step 항목은 { step, status, exitCode } 형식이다.
    steps?: Array<{ step?: string; id?: string; status?: string }>;
    artifacts?: { visualOnlyMp4?: string; ttsMuxMp4?: string };
    notUploaded?: boolean;
  } | null;
  const muxed = typeof summary?.artifacts?.ttsMuxMp4 === "string" ? summary.artifacts.ttsMuxMp4 : null;
  const silent = typeof summary?.artifacts?.visualOnlyMp4 === "string" ? summary.artifacts.visualOnlyMp4 : null;

  // 생성 manifest에서 이 산출물의 실제 주제를 확인한다(검증/표시용).
  let topicOfArtifact: string | null = null;
  let titleOfArtifact: string | null = null;
  const slug = topicId ? toSafeTopicSlug(topicId) : null;
  if (slug) {
    const manifest = readAbsJson(join(WIZARD_INPUTS_ROOT, slug, "render-manifest.visual-only.json")) as {
      wizardTopicId?: string;
      wizardTopicTitle?: string;
    } | null;
    topicOfArtifact = typeof manifest?.wizardTopicId === "string" ? manifest.wizardTopicId : null;
    titleOfArtifact = typeof manifest?.wizardTopicTitle === "string" ? manifest.wizardTopicTitle : null;
  }

  return {
    exists: muxed != null && existsSync(muxed),
    flowStatus: summary?.flowStatus ?? null,
    steps: (summary?.steps ?? [])
      .map((s) => ({ id: s.step ?? s.id ?? "", status: s.status ?? "" }))
      .filter((s) => s.id !== "" && s.status !== ""),
    muxedMp4Path: muxed,
    muxedMp4Bytes: muxed ? fileBytes(muxed) : null,
    silentMp4Path: silent,
    silentMp4Bytes: silent ? fileBytes(silent) : null,
    notUploaded: summary?.notUploaded !== false,
    topicId: topicOfArtifact,
    topicTitle: titleOfArtifact,
  };
}

/** 서버 재시작 뒤에도 이미 검증된 로컬 MP4를 안전하게 미리보기한다. 업로드 게이트에는 쓰지 않는다. */
function readWizardFinalPreviewMp4Path(topicId: string): string | null {
  const slug = toSafeTopicSlug(topicId);
  if (!slug) return null;
  const profile = wizardVisualProfileForTopic(topicId);
  const videoDir = join(WIZARD_VIDEO_OUT_ROOT, slug, "real", profile.videoDir);
  const summary = readAbsJson(join(videoDir, "real-video-summary.json")) as {
    schemaVersion?: string;
    status?: string;
    topicId?: string;
    finalMp4Path?: string;
    width?: number;
    height?: number;
    hasAudioStream?: boolean;
    hasVideoStream?: boolean;
    motionRendererVersion?: string;
    layeredMotionRendererVersion?: string;
    motionAudit?: WizardLayeredMotionAudit;
    flowMotionAudit?: WizardFlowMotionRenderAudit;
  } | null;
  const record = readWizardFinalScriptRecord(topicId);
  const previewScenes = record?.script.scenes ?? [];
  if (
    summary?.schemaVersion === "wizard_real_video_summary_v1" &&
    summary.status === "RENDER_MUX_OK" &&
    summary.topicId === topicId &&
    typeof summary.finalMp4Path === "string" &&
    summary.width === 1080 && summary.height === 1920 &&
    summary.hasAudioStream === true && summary.hasVideoStream === true &&
    previewScenes.length > 0 &&
    wizardHybridMotionSummaryIsReady(summary, previewScenes.length, previewScenes)
  ) return summary.finalMp4Path;

  // Preview only: a server restart can lose the in-memory topic catalog before it has
  // reconstructed the summary. Restrict the recovery scan to this exact safe topic dir.
  try {
    const candidates = readdirSync(videoDir, { withFileTypes: true })
      // The renderer uses a shorter filename slug than the 80-char topic directory slug.
      .filter((entry) => entry.isFile() && entry.name.startsWith("final-") && entry.name.endsWith(".mp4"))
      .map((entry) => join(videoDir, entry.name))
      .filter((candidate) => statSync(candidate).size > 0)
      .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs);
    return candidates[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * 시안 영상 파일 바이트를 돌려준다(브라우저 미리보기 스트림용).
 * 경로는 클라이언트 입력이 아니라 파이프라인 summary에서만 나오며,
 * `C:\tmp\money-shorts-os\` 아래의 `.mp4`만 허용한다(경로 조작 원천 차단).
 */
export function readWizardVideoBytes(
  which: "muxed" | "silent" | "final",
  topicId?: string | null,
  productionPartId?: string | null,
  expectedFinalMp4Sha256?: string | null,
): Buffer | null {
  let p: string | null = null;
  let currentFinalMp4Sha256: string | null = null;
  if (which === "final") {
    if (
      typeof expectedFinalMp4Sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(expectedFinalMp4Sha256)
    ) {
      return null;
    }
    // 현재 제작 게이트가 준비된 경우를 우선한다. 서버 재시작 뒤 주제 메모리가 사라진
    // 경우에도, summary 자체를 다시 검증한 로컬 MP4는 미리보기만 허용한다.
    const media = readWizardRealMediaState(topicId ?? "");
    const selectedPart = productionPartId
      ? media.parts.find((part) => part.id === productionPartId)
      : media.parts[0];
    p = selectedPart?.finalVideo.mp4Path ?? media.finalVideo.mp4Path ?? readWizardFinalPreviewMp4Path(topicId ?? "");
    currentFinalMp4Sha256 =
      selectedPart?.finalVideo.finalMp4Sha256 ??
      media.finalVideo.finalMp4Sha256;
    if (currentFinalMp4Sha256 !== expectedFinalMp4Sha256) {
      return null;
    }
  } else {
    const status = readWizardVideoStatus(topicId);
    p = which === "muxed" ? status.muxedMp4Path : status.silentMp4Path;
  }
  if (!p) return null;
  const abs = resolve(p);
  if (!abs.startsWith(WIZARD_VIDEO_ALLOWED_PREFIX)) return null;
  if (!abs.toLowerCase().endsWith(".mp4")) return null;
  if (!existsSync(abs)) return null;
  try {
    const bytes = readFileSync(abs);
    if (
      which === "final" &&
      createHash("sha256").update(bytes).digest("hex") !==
        expectedFinalMp4Sha256
    ) {
      return null;
    }
    return bytes;
  } catch {
    return null;
  }
}

/** Flow Owner QA 플레이어용 MP4. topic/job 상태가 가리키는 고정 경로와 hash가 모두 일치해야 한다. */
export function readWizardFlowMotionVideoBytes(
  topicId?: string | null,
  jobId?: string | null,
): Buffer | null {
  const target = resolveWizardFlowMotionJob(topicId ?? "", jobId ?? "");
  if (!target.ok || !["qa_pending", "qa_pass", "render_ready"].includes(target.job.status)) return null;
  const abs = resolve(target.job.expectedVideoPath);
  if (!abs.startsWith(WIZARD_VIDEO_ALLOWED_PREFIX) || !abs.toLowerCase().endsWith(".mp4") || !existsSync(abs)) return null;
  try {
    const bytes = readFileSync(abs);
    const hash = createHash("sha256").update(bytes).digest("hex");
    return hash === target.job.qa.outputVideoSha256 ? bytes : null;
  } catch {
    return null;
  }
}

/**
 * 실제 TTS 오디오 바이트(브라우저 audio player 스트림용).
 * 경로는 클라이언트 입력이 아니라 TTS summary에서만 나오며,
 * `C:\tmp\money-shorts-os\` 아래의 .mp3/.m4a만 허용한다(경로 조작 원천 차단).
 */
export function readWizardRealAudioBytes(
  topicId?: string | null,
  productionPartId?: string | null,
): { bytes: Buffer; contentType: string } | null {
  const media = readWizardRealMediaState(topicId ?? "");
  const selectedPart = productionPartId
    ? media.parts.find((part) => part.id === productionPartId)
    : media.parts[0];
  const p = selectedPart?.realTts.audioPath ?? media.realTts.audioPath;
  if (!p) return null;
  const abs = resolve(p);
  if (!abs.startsWith(WIZARD_VIDEO_ALLOWED_PREFIX)) return null;
  const lower = abs.toLowerCase();
  const contentType = lower.endsWith(".mp3") ? "audio/mpeg" : lower.endsWith(".m4a") ? "audio/mp4" : null;
  if (!contentType) return null;
  if (!existsSync(abs)) return null;
  try {
    return { bytes: readFileSync(abs), contentType };
  } catch {
    return null;
  }
}

function wizardCanonicalSceneImagePath(
  imagesDir: string | null | undefined,
  sceneIndex: number | null | undefined,
): string | null {
  if (!imagesDir || !Number.isInteger(sceneIndex) || Number(sceneIndex) < 1) return null;
  const imageDir = resolve(imagesDir);
  const imagePath = resolve(imageDir, `scene-${String(sceneIndex).padStart(2, "0")}.png`);
  return imageDir.startsWith(WIZARD_VIDEO_ALLOWED_PREFIX) &&
    imagePath.startsWith(`${imageDir}\\`)
    ? imagePath
    : null;
}

/**
 * Owner 장면 검수용 이미지 바이트.
 * 클라이언트는 파일 경로를 보낼 수 없고, 현재 read model의 편/장면/hash 결박이 실제 파일과
 * 다시 일치할 때만 C:\tmp 아래 canonical scene PNG를 반환한다.
 */
export function readWizardRealSceneImageBytes(
  topicId?: string | null,
  productionPartId?: string | null,
  sceneIndexInput?: number | null,
  expectedImageSha256?: string | null,
): { bytes: Buffer; contentType: "image/png"; imageSha256: string } | null {
  if (
    !["single", "part-1", "part-2"].includes(productionPartId ?? "") ||
    !Number.isInteger(sceneIndexInput) ||
    Number(sceneIndexInput) < 1 ||
    !/^[a-f0-9]{64}$/.test(expectedImageSha256 ?? "")
  ) return null;
  const media = readWizardRealMediaState(topicId ?? "");
  const part = media.parts.find((candidate) => candidate.id === productionPartId);
  const scene = part?.realImages.scenes.find((candidate) => candidate.sceneIndex === sceneIndexInput);
  if (
    !part?.realImages.dir ||
    scene?.ready !== true ||
    scene.imageSha256 !== expectedImageSha256
  ) return null;
  const imagePath = wizardCanonicalSceneImagePath(part.realImages.dir, scene.sceneIndex);
  if (!imagePath || !existsSync(imagePath)) return null;
  try {
    const bytes = readFileSync(imagePath);
    const imageSha256 = createHash("sha256").update(bytes).digest("hex");
    return imageSha256 === scene.imageSha256
      ? { bytes, contentType: "image/png", imageSha256 }
      : null;
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 게시 전 점검 + 실제 업로드 — content unit 생성/preflight·result 읽기
// task: owner-web-auto-topic-refresh-and-upload-button-v1
// ══════════════════════════════════════════════════════════════════════════════

export type WizardPublishMetadataPreview = {
  sha256: string;
  instagram: {
    captionFirstLineHook: string;
    caption: string;
    hashtags: string[];
    callToAction: string;
  };
  youtube: {
    title: string;
    description: string;
    tags: string[];
  };
};

function buildWizardPublishMetadataSnapshot(
  topicId: string,
  platformTitle: string,
  script: WizardFinalScriptRecord["script"],
):
  | {
      ok: true;
      contract: {
        discoveryMetadataContractVersion: typeof PLATFORM_DISCOVERY_METADATA_VERSION;
        discoveryMetadataGate: ReturnType<typeof buildPlatformDiscoveryMetadata>["gate"];
        instagramMetadata: ReturnType<typeof buildPlatformDiscoveryMetadata>["metadata"]["instagram"] & {
          discoveryContractVersion: typeof PLATFORM_DISCOVERY_METADATA_VERSION;
          primaryKeywords: string[];
          forbiddenUnrelatedTrendTags: true;
        };
        youtubeMetadata: ReturnType<typeof buildPlatformDiscoveryMetadata>["metadata"]["youtube"] & {
          discoveryContractVersion: typeof PLATFORM_DISCOVERY_METADATA_VERSION;
          primaryKeywords: string[];
        };
      };
      sha256: string;
      preview: WizardPublishMetadataPreview;
    }
  | { ok: false; reason: string } {
  const generated = readWizardGeneratedTopic(topicId);
  const category = (generated?.category ?? "finance") as WizardCategoryId;
  const consequence =
    script.scenes
      .filter((scene) => scene.id === "consequence")
      .map((scene) => scene.narration)
      .join(" ") || script.twist;
  const discovery = buildPlatformDiscoveryMetadata({
    title: platformTitle,
    hook: script.hook,
    consequence,
    action: script.action,
    category,
    financeSubtopic: generated?.financeSubtopic,
  });
  if (!discovery.gate.ok) {
    return {
      ok: false,
      reason: `discovery_metadata_gate_failed:${discovery.gate.reasons.join(",")}`,
    };
  }
  const contract = {
    discoveryMetadataContractVersion: PLATFORM_DISCOVERY_METADATA_VERSION,
    discoveryMetadataGate: discovery.gate,
    instagramMetadata: {
      discoveryContractVersion: discovery.metadata.contractVersion,
      primaryKeywords: discovery.metadata.primaryKeywords,
      ...discovery.metadata.instagram,
      forbiddenUnrelatedTrendTags: true as const,
    },
    youtubeMetadata: {
      discoveryContractVersion: discovery.metadata.contractVersion,
      primaryKeywords: discovery.metadata.primaryKeywords,
      ...discovery.metadata.youtube,
    },
  };
  const sha256 = createHash("sha256")
    .update(JSON.stringify(contract))
    .digest("hex");
  return {
    ok: true,
    contract,
    sha256,
    preview: {
      sha256,
      instagram: {
        captionFirstLineHook:
          discovery.metadata.instagram.captionFirstLineHook,
        caption: discovery.metadata.instagram.caption,
        hashtags: discovery.metadata.instagram.hashtags,
        callToAction: discovery.metadata.instagram.callToAction,
      },
      youtube: {
        title: discovery.metadata.youtube.titleWithShortsSuffix,
        description: discovery.metadata.youtube.descriptionBase,
        tags: discovery.metadata.youtube.tags,
      },
    },
  };
}

export type WizardPublishPaths = {
  topicId: string;
  safeSlug: string;
  productionPartId: "single" | "part-1" | "part-2";
  partNumber: 1 | 2;
  totalParts: 1 | 2;
  contentId: string;
  version: string;
  contentUnitPath: string;
  publishOutDir: string;
  ledgerPath: string;
  muxedMp4Path: string;
  titleBase: string;
  contentUnitSha256: string;
  finalMp4Sha256: string;
  publishMetadataSha256: string;
  finalVideoApprovalFingerprint: string;
  imageSetSha256: string;
  audioSha256: string;
  wizardScriptFingerprint: string;
};

/**
 * 선택 주제로 만든 시안 영상을 dual_platform_content_unit_v1 스키마로 감싼다.
 * 게시 전 점검(wizardPreflight, --arm 없음)과 실제 업로드(actualUpload, --arm)가
 * 같은 content unit을 사용한다. 데이터 파일만 쓰며 외부 호출은 없다.
 *
 * fail-closed: 대본 없음/영상 없음/경로 비신뢰면 ok:false.
 */
export function buildWizardContentUnitForTopic(
  topicId: string,
  productionPartId?: "single" | "part-1" | "part-2",
): { ok: true; paths: WizardPublishPaths } | { ok: false; reason: string } {
  const safeSlug = toSafeTopicSlug(topicId);
  if (!safeSlug) return { ok: false, reason: "topic_id_invalid_or_empty" };
  const pipeline = buildWizardRealPipelineInputs(topicId);
  if (!pipeline.ok) return { ok: false, reason: pipeline.reason };
  const selectedPart = productionPartId
    ? pipeline.paths.parts.find((part) => part.id === productionPartId)
    : pipeline.paths.parts.length === 1 ? pipeline.paths.parts[0] : null;
  if (!selectedPart) return { ok: false, reason: "production_part_required" };
  const partRecord = readAbsJson(selectedPart.scriptFinalPath) as WizardFinalScriptRecord | null;
  const script = partRecord?.schemaVersion === "wizard_script_final_v1" ? partRecord.script : null;
  const wizardScriptFingerprint =
    partRecord?.schemaVersion === "wizard_script_final_v1" &&
    typeof partRecord.localFingerprint === "string"
      ? partRecord.localFingerprint
      : null;
  if (!script || !wizardScriptFingerprint) {
    return { ok: false, reason: "production_script_missing" };
  }

  const media = readWizardRealMediaState(topicId);
  const partMedia = media.parts.find((part) => part.id === selectedPart.id);
  if (!partMedia?.realTts.ready) return { ok: false, reason: "real_tts_required" };
  if (!media.realTts.qualityAccepted || !partMedia.realTts.qualityAccepted) {
    return { ok: false, reason: "real_tts_owner_approval_required" };
  }
  if (!partMedia.realImages.ready) return { ok: false, reason: "real_scene_images_required" };
  if (!partMedia.finalVideo.ready || !partMedia.finalVideo.mp4Path) return { ok: false, reason: "final_mp4_required" };
  if (
    !partMedia.finalVideo.ownerApproved ||
    !partMedia.finalVideo.finalMp4Sha256 ||
    !partMedia.finalVideo.publishMetadataSha256 ||
    !partMedia.finalVideo.ownerApprovalFingerprint ||
    !partMedia.realImages.manualVisualReview.imageSetSha256 ||
    !partMedia.realTts.audioSha256
  ) {
    return { ok: false, reason: "final_video_owner_approval_required" };
  }
  const ownerFinalVideoApprovalEvidence = readAbsJson(
    wizardFinalVideoOwnerApprovalPath(topicId),
  );
  if (!ownerFinalVideoApprovalEvidence) {
    return { ok: false, reason: "final_video_owner_approval_required" };
  }
  if (!partMedia.mediaQualityGate.ok) return { ok: false, reason: "media_quality_gate_not_ready" };

  const muxedAbs = resolve(partMedia.finalVideo.mp4Path);
  if (!muxedAbs.startsWith(WIZARD_VIDEO_ALLOWED_PREFIX) || !muxedAbs.toLowerCase().endsWith(".mp4")) {
    return { ok: false, reason: "video_path_untrusted" };
  }

  const contentId = selectedPart.totalParts > 1
    ? `wizard-${safeSlug}-${selectedPart.id}`
    : `wizard-${safeSlug}`;
  if ((BLOCKED_PUBLISHED_CONTENT_IDS as readonly string[]).includes(contentId)) {
    return { ok: false, reason: "content_already_published_evidence" };
  }

  const publishMetadata = buildWizardPublishMetadataSnapshot(
    topicId,
    selectedPart.platformTitle,
    script,
  );
  if (!publishMetadata.ok) return publishMetadata;
  if (
    publishMetadata.sha256 !==
    partMedia.finalVideo.publishMetadataSha256
  ) {
    return { ok: false, reason: "final_video_owner_approval_stale" };
  }
  const titleBase =
    publishMetadata.contract.youtubeMetadata.titleBase;

  const contentUnit = {
    schemaVersion: "dual_platform_content_unit_v1",
    _note:
      "web wizard가 선택 주제로 생성한 content unit. 실제 TTS + 실제 장면 이미지로 합성한 최종 mp4 기준이며 " +
      "(media quality gate 통과분만), 실제 게시는 final E2E runner의 모든 gate(중복/키/승인/--arm)를 통과해야만 일어난다.",
    contentId,
    version: WIZARD_FULL_SCRIPT_PUBLISH_VERSION,
    wizardTopicId: topicId,
    wizardProductionPartId: selectedPart.id,
    series: {
      strategyContractVersion: pipeline.paths.strategyVersion,
      canonicalTitle: selectedPart.canonicalTitle,
      platformTitle: selectedPart.platformTitle,
      partNumber: selectedPart.partNumber,
      totalParts: selectedPart.totalParts,
      explicitContinuationCue: selectedPart.id === "part-1",
      explicitPartMarker: selectedPart.totalParts > 1,
    },
    ...publishMetadata.contract,
    instagramSourcePath: muxedAbs,
    youtubeSourcePath: muxedAbs,
    ownerFinalVideoApproval: ownerFinalVideoApprovalEvidence,
    sourceIntegrity: {
      contractVersion:
        MONEY_SHORTS_FINAL_VIDEO_OWNER_APPROVAL_VERSION,
      rootTopicId: topicId,
      productionPartId: selectedPart.id,
      finalVideoApprovalFingerprint:
        partMedia.finalVideo.ownerApprovalFingerprint,
      finalMp4Sha256: partMedia.finalVideo.finalMp4Sha256,
      publishMetadataSha256:
        partMedia.finalVideo.publishMetadataSha256,
      imageSetSha256:
        partMedia.realImages.manualVisualReview.imageSetSha256,
      audioSha256: partMedia.realTts.audioSha256,
      wizardScriptFingerprint,
      durationSec: partMedia.finalVideo.durationSec,
      sizeBytes: partMedia.finalVideo.sizeBytes,
    },
    existingPublishedKeys: [],
  };

  // one-shot 결과는 게시 개정판별로 격리한다. 이전 v1 성공 결과를 보존하면서
  // 자막/영상이 바뀐 v2가 자신의 preflight/result를 정확히 한 번만 기록하게 한다.
  const publishOutDir = join(
    WIZARD_VIDEO_OUT_ROOT,
    safeSlug,
    "publish",
    WIZARD_FULL_SCRIPT_PUBLISH_VERSION,
    selectedPart.id,
  );
  const contentUnitPath = join(
    publishOutDir,
    "dual_platform_content_unit." + contentId + "." + WIZARD_FULL_SCRIPT_PUBLISH_VERSION + ".json",
  );
  const contentUnitJson = JSON.stringify(contentUnit, null, 2);
  const contentUnitSha256 = createHash("sha256")
    .update(contentUnitJson)
    .digest("hex");
  try {
    mkdirSync(publishOutDir, { recursive: true });
    writeFileSync(contentUnitPath, contentUnitJson, "utf8");
  } catch (e) {
    return { ok: false, reason: `content_unit_write_failed:${(e as Error).message}` };
  }

  return {
    ok: true,
    paths: {
      topicId,
      safeSlug,
      productionPartId: selectedPart.id,
      partNumber: selectedPart.partNumber,
      totalParts: selectedPart.totalParts,
      contentId,
      version: WIZARD_FULL_SCRIPT_PUBLISH_VERSION,
      contentUnitPath,
      publishOutDir,
      ledgerPath: WIZARD_PUBLISH_LEDGER_PATH,
      muxedMp4Path: muxedAbs,
      titleBase,
      contentUnitSha256,
      finalMp4Sha256: partMedia.finalVideo.finalMp4Sha256,
      publishMetadataSha256:
        partMedia.finalVideo.publishMetadataSha256,
      finalVideoApprovalFingerprint:
        partMedia.finalVideo.ownerApprovalFingerprint,
      imageSetSha256:
        partMedia.realImages.manualVisualReview.imageSetSha256,
      audioSha256: partMedia.realTts.audioSha256,
      wizardScriptFingerprint,
    },
  };
}

export function buildWizardContentUnitsForTopic(
  topicId: string,
): { ok: true; paths: WizardPublishPaths[] } | { ok: false; reason: string } {
  const pipeline = buildWizardRealPipelineInputs(topicId);
  if (!pipeline.ok) return { ok: false, reason: pipeline.reason };
  const paths: WizardPublishPaths[] = [];
  for (const part of pipeline.paths.parts) {
    const built = buildWizardContentUnitForTopic(topicId, part.id);
    if (!built.ok) return built;
    paths.push(built.paths);
  }
  return paths.length > 0 ? { ok: true, paths } : { ok: false, reason: "production_parts_empty" };
}

export type WizardPublishPreflight = {
  status: string | null;
  blockerCode: string | null;
  contentUnitManifestPath: string | null;
  credentialPresentCount: number | null;
  contentUnitSha256: string | null;
  instagramSourceSha256: string | null;
  youtubeSourceSha256: string | null;
  publishMetadataSha256: string | null;
  finalVideoApprovalFingerprint: string | null;
  boundToCurrentArtifacts: boolean;
};

/** wizardPreflight가 남긴 runner preflight 결과(JSON)를 읽는다(secret 없음 — status/blocker/경로만). */
function wizardPublishResultDir(topicId: string, productionPartId?: "single" | "part-1" | "part-2"): string | null {
  const slug = toSafeTopicSlug(topicId);
  if (!slug) return null;
  const strategy = readWizardFinalScriptRecord(topicId)?.script.videoStrategy;
  const resolvedPartId = productionPartId ?? (strategy?.parts.length === 1 ? strategy.parts[0].id : null);
  if (strategy && !resolvedPartId) return null;
  return join(
    WIZARD_VIDEO_OUT_ROOT,
    slug,
    "publish",
    WIZARD_FULL_SCRIPT_PUBLISH_VERSION,
    ...(resolvedPartId ? [resolvedPartId] : []),
  );
}

function wizardPublishOwnerReconciliationPath(
  topicId: string,
  productionPartId: "single" | "part-1" | "part-2",
): string | null {
  const slug = toSafeTopicSlug(topicId);
  if (!slug || productionPartId !== "part-1") {
    return null;
  }
  return join(
    WIZARD_VIDEO_OUT_ROOT,
    slug,
    "publish",
    MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_DIRNAME,
    `${productionPartId}.json`,
  );
}

type WizardYoutubeOnlyRecoveryEvidenceFile = {
  exists: boolean;
  parseOk: boolean;
  sha256: string | null;
  evidence: unknown;
};

type WizardYoutubeOnlyRecoveryEvidenceBundle = {
  present: boolean;
  discoveryValid: boolean;
  candidateCount: number;
  unknownFileCount: number;
  preflightFile: WizardYoutubeOnlyRecoveryEvidenceFile;
  claimFile: WizardYoutubeOnlyRecoveryEvidenceFile;
  resultFile: WizardYoutubeOnlyRecoveryEvidenceFile;
  eventFiles: Array<
    WizardYoutubeOnlyRecoveryEvidenceFile & {
      transition: string;
    }
  >;
};

function absentWizardYoutubeOnlyRecoveryEvidenceFile(): WizardYoutubeOnlyRecoveryEvidenceFile {
  return {
    exists: false,
    parseOk: false,
    sha256: null,
    evidence: null,
  };
}

function readWizardYoutubeOnlyRecoveryEvidenceFile(
  path: string,
): WizardYoutubeOnlyRecoveryEvidenceFile {
  if (!existsSync(path)) {
    return absentWizardYoutubeOnlyRecoveryEvidenceFile();
  }
  try {
    const bytes = readFileSync(path);
    const sha256 = createHash("sha256")
      .update(bytes)
      .digest("hex");
    try {
      return {
        exists: true,
        parseOk: true,
        sha256,
        evidence: JSON.parse(bytes.toString("utf8")),
      };
    } catch {
      return {
        exists: true,
        parseOk: false,
        sha256,
        evidence: null,
      };
    }
  } catch {
    return {
      exists: true,
      parseOk: false,
      sha256: null,
      evidence: null,
    };
  }
}

function evidenceContentId(
  file: WizardYoutubeOnlyRecoveryEvidenceFile,
): string | null {
  if (
    file.parseOk !== true ||
    typeof file.evidence !== "object" ||
    file.evidence === null ||
    Array.isArray(file.evidence)
  ) {
    return null;
  }
  const evidence = file.evidence as {
    currentBinding?: { contentId?: unknown };
  };
  return typeof evidence.currentBinding?.contentId ===
    "string"
    ? evidence.currentBinding.contentId
    : null;
}

function absentWizardYoutubeOnlyRecoveryEvidenceBundle(): WizardYoutubeOnlyRecoveryEvidenceBundle {
  return {
    present: false,
    discoveryValid: true,
    candidateCount: 0,
    unknownFileCount: 0,
    preflightFile:
      absentWizardYoutubeOnlyRecoveryEvidenceFile(),
    claimFile:
      absentWizardYoutubeOnlyRecoveryEvidenceFile(),
    resultFile:
      absentWizardYoutubeOnlyRecoveryEvidenceFile(),
    eventFiles: [],
  };
}

function readWizardYoutubeOnlyRecoveryEvidenceBundle(
  contentId: string,
): WizardYoutubeOnlyRecoveryEvidenceBundle {
  const absent =
    absentWizardYoutubeOnlyRecoveryEvidenceBundle();
  if (
    contentId.length === 0 ||
    !existsSync(WIZARD_YOUTUBE_ONLY_RECOVERY_ROOT)
  ) {
    return absent;
  }
  const candidates: Array<{
    outDir: string;
    preflightFile: WizardYoutubeOnlyRecoveryEvidenceFile;
    claimFile: WizardYoutubeOnlyRecoveryEvidenceFile;
    resultFile: WizardYoutubeOnlyRecoveryEvidenceFile;
  }> = [];
  let unboundArmedEvidenceCount = 0;
  try {
    for (const entry of readdirSync(
      WIZARD_YOUTUBE_ONLY_RECOVERY_ROOT,
      { withFileTypes: true },
    )) {
      if (!entry.isDirectory()) continue;
      const outDir = join(
        WIZARD_YOUTUBE_ONLY_RECOVERY_ROOT,
        entry.name,
      );
      const paths =
        moneyShortsYoutubeOnlyRecoveryPaths(outDir);
      if (!existsSync(paths.recoveryDir)) {
        // dry-run preflight만 있는 디렉터리는 실제 recovery
        // overlay가 아니며 기존 상태를 바꾸지 않는다.
        continue;
      }
      const preflightFile =
        readWizardYoutubeOnlyRecoveryEvidenceFile(
          paths.preflightPath,
        );
      const claimFile =
        readWizardYoutubeOnlyRecoveryEvidenceFile(
          paths.claimPath,
        );
      const resultFile =
        readWizardYoutubeOnlyRecoveryEvidenceFile(
          paths.resultPath,
        );
      const boundContentIds = new Set(
        [
          evidenceContentId(preflightFile),
          evidenceContentId(claimFile),
          evidenceContentId(resultFile),
        ].filter(
          (value): value is string =>
            typeof value === "string" &&
            value.length > 0,
        ),
      );
      if (boundContentIds.size === 0) {
        unboundArmedEvidenceCount += 1;
        continue;
      }
      if (boundContentIds.has(contentId)) {
        candidates.push({
          outDir,
          preflightFile,
          claimFile,
          resultFile,
        });
      }
    }
  } catch {
    return {
      ...absent,
      present: true,
      discoveryValid: false,
      candidateCount: 0,
      unknownFileCount: 1,
    };
  }
  if (
    candidates.length !== 1 ||
    unboundArmedEvidenceCount > 0
  ) {
    return candidates.length === 0 &&
      unboundArmedEvidenceCount === 0
      ? absent
      : {
          ...absent,
          present: true,
          discoveryValid: false,
          candidateCount: candidates.length,
          unknownFileCount:
            unboundArmedEvidenceCount,
        };
  }

  const candidate = candidates[0];
  const paths =
    moneyShortsYoutubeOnlyRecoveryPaths(
      candidate.outDir,
    );
  const expectedNames = new Set<string>([
    "claim.json",
    "result.json",
  ]);
  const committedSourceSha256ByName =
    new Map<string, string>();
  const registerCommittedSource = (
    canonicalName: string,
    file: WizardYoutubeOnlyRecoveryEvidenceFile,
    fingerprintField: string,
  ) => {
    if (
      file.exists !== true ||
      file.parseOk !== true ||
      typeof file.sha256 !== "string" ||
      typeof file.evidence !== "object" ||
      file.evidence === null ||
      Array.isArray(file.evidence)
    ) {
      return;
    }
    const fingerprint = (
      file.evidence as Record<string, unknown>
    )[fingerprintField];
    if (
      typeof fingerprint !== "string" ||
      !/^[a-f0-9]{64}$/.test(fingerprint)
    ) {
      return;
    }
    committedSourceSha256ByName.set(
      `${canonicalName}.${fingerprint}.committed-source`,
      file.sha256,
    );
  };
  registerCommittedSource(
    "claim.json",
    candidate.claimFile,
    "claimFingerprint",
  );
  registerCommittedSource(
    "result.json",
    candidate.resultFile,
    "resultFingerprint",
  );
  const eventFiles: WizardYoutubeOnlyRecoveryEvidenceBundle["eventFiles"] =
    [];
  for (
    let index = 0;
    index <
    MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_EVENT_TRANSITIONS.length;
    index += 1
  ) {
    const transition =
      MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_EVENT_TRANSITIONS[
        index
      ];
    const eventPath =
      moneyShortsYoutubeOnlyRecoveryEventPath(
        paths.recoveryDir,
        transition,
      );
    if (typeof eventPath !== "string") continue;
    expectedNames.add(
      `${String(index + 1).padStart(2, "0")}-${transition}.json`,
    );
    const file =
      readWizardYoutubeOnlyRecoveryEvidenceFile(eventPath);
    if (file.exists) {
      registerCommittedSource(
        `${String(index + 1).padStart(2, "0")}-${transition}.json`,
        file,
        "eventFingerprint",
      );
      eventFiles.push({
        transition,
        ...file,
      });
    }
  }
  let unknownFileCount = 0;
  try {
    const allowedOutDirEntries = new Set([
      basename(paths.preflightPath),
      basename(paths.recoveryDir),
    ]);
    for (const entry of readdirSync(
      candidate.outDir,
      { withFileTypes: true },
    )) {
      if (!allowedOutDirEntries.has(entry.name)) {
        unknownFileCount += 1;
      }
    }
  } catch {
    unknownFileCount += 1;
  }
  try {
    for (const entry of readdirSync(
      paths.recoveryDir,
      { withFileTypes: true },
    )) {
      if (!entry.isFile()) {
        unknownFileCount += 1;
        continue;
      }
      if (expectedNames.has(entry.name)) {
        continue;
      }
      const expectedCommittedSourceSha256 =
        committedSourceSha256ByName.get(entry.name);
      if (!expectedCommittedSourceSha256) {
        unknownFileCount += 1;
        continue;
      }
      const committedSourceFile =
        readWizardYoutubeOnlyRecoveryEvidenceFile(
          join(paths.recoveryDir, entry.name),
        );
      if (
        committedSourceFile.parseOk !== true ||
        committedSourceFile.sha256 !==
          expectedCommittedSourceSha256
      ) {
        unknownFileCount += 1;
      }
    }
  } catch {
    unknownFileCount += 1;
  }
  return {
    present: true,
    discoveryValid: true,
    candidateCount: 1,
    unknownFileCount,
    preflightFile: candidate.preflightFile,
    claimFile: candidate.claimFile,
    resultFile: candidate.resultFile,
    eventFiles,
  };
}

function readWizardPublishOwnerReconciliationFile(
  topicId: string,
  productionPartId: "single" | "part-1" | "part-2",
): {
  exists: boolean;
  parseOk: boolean;
  sha256: string | null;
  evidence: unknown;
} {
  const path = wizardPublishOwnerReconciliationPath(
    topicId,
    productionPartId,
  );
  if (!path || !existsSync(path)) {
    return {
      exists: false,
      parseOk: false,
      sha256: null,
      evidence: null,
    };
  }
  try {
    const bytes = readFileSync(path);
    const sha256 = createHash("sha256")
      .update(bytes)
      .digest("hex");
    try {
      return {
        exists: true,
        parseOk: true,
        sha256,
        evidence: JSON.parse(bytes.toString("utf8")),
      };
    } catch {
      return {
        exists: true,
        parseOk: false,
        sha256,
        evidence: null,
      };
    }
  } catch {
    return {
      exists: true,
      parseOk: false,
      sha256: null,
      evidence: null,
    };
  }
}

export function readWizardPublishPreflight(
  topicId: string,
  productionPartId?: "single" | "part-1" | "part-2",
): WizardPublishPreflight | null {
  const resultDir = wizardPublishResultDir(topicId, productionPartId);
  if (!resultDir) return null;
  const p = join(resultDir, "final-e2e-publish-preflight.json");
  const parsed = readAbsJson(p) as {
    status?: string;
    blockerCode?: string | null;
    contentUnitManifestPath?: string;
    credentialPresence?: Record<string, boolean>;
    contentUnitSha256?: string;
    instagramSourceSha256?: string;
    youtubeSourceSha256?: string;
    publishMetadataSha256?: string;
    finalVideoApprovalFingerprint?: string;
  } | null;
  if (!parsed) return null;
  const presence = parsed.credentialPresence ?? null;
  const contentUnitManifestPath =
    typeof parsed.contentUnitManifestPath === "string"
      ? resolve(parsed.contentUnitManifestPath)
      : null;
  let currentContentUnitSha256: string | null = null;
  if (
    contentUnitManifestPath &&
    contentUnitManifestPath.startsWith(WIZARD_VIDEO_ALLOWED_PREFIX) &&
    existsSync(contentUnitManifestPath)
  ) {
    try {
      currentContentUnitSha256 = createHash("sha256")
        .update(readFileSync(contentUnitManifestPath))
        .digest("hex");
    } catch {
      currentContentUnitSha256 = null;
    }
  }
  const media = readWizardRealMediaState(topicId);
  const currentPart = productionPartId
    ? media.parts.find((part) => part.id === productionPartId)
    : media.parts.length === 1
      ? media.parts[0]
      : null;
  const contentUnitSha256 =
    typeof parsed.contentUnitSha256 === "string"
      ? parsed.contentUnitSha256
      : null;
  const instagramSourceSha256 =
    typeof parsed.instagramSourceSha256 === "string"
      ? parsed.instagramSourceSha256
      : null;
  const youtubeSourceSha256 =
    typeof parsed.youtubeSourceSha256 === "string"
      ? parsed.youtubeSourceSha256
      : null;
  const publishMetadataSha256 =
    typeof parsed.publishMetadataSha256 === "string"
      ? parsed.publishMetadataSha256
      : null;
  const finalVideoApprovalFingerprint =
    typeof parsed.finalVideoApprovalFingerprint === "string"
      ? parsed.finalVideoApprovalFingerprint
      : null;
  const bindingValidation =
    validateMoneyShortsPublishPreflightBinding({
      evidence: parsed,
      current: {
        contentUnitManifestPath,
        contentUnitSha256: currentContentUnitSha256,
        instagramSourceSha256:
          currentPart?.finalVideo.finalMp4Sha256,
        youtubeSourceSha256:
          currentPart?.finalVideo.finalMp4Sha256,
        publishMetadataSha256:
          currentPart?.finalVideo.publishMetadataSha256,
        finalVideoApprovalFingerprint:
          currentPart?.finalVideo.ownerApprovalFingerprint,
      },
    });
  const boundToCurrentArtifacts =
    currentPart?.finalVideo.ready === true &&
    currentPart.finalVideo.ownerApproved === true &&
    bindingValidation.valid === true;
  return {
    status: typeof parsed.status === "string" ? parsed.status : null,
    blockerCode: typeof parsed.blockerCode === "string" ? parsed.blockerCode : null,
    contentUnitManifestPath,
    credentialPresentCount: presence ? Object.values(presence).filter((v) => v === true).length : null,
    contentUnitSha256,
    instagramSourceSha256,
    youtubeSourceSha256,
    publishMetadataSha256,
    finalVideoApprovalFingerprint,
    boundToCurrentArtifacts,
  };
}

export type WizardPublishResult = {
  status: string | null;
  blockerCode: string | null;
  instagramMediaId: string | null;
  youtubeVideoId: string | null;
  youtubeUrl: string | null;
  partialExternalState: string | null;
  ledgerRecordedKeys: string[];
};

/** actualUpload가 남긴 runner result JSON을 읽는다(public id/url/status만 — secret 값 없음). */
export function readWizardPublishResult(
  topicId: string,
  productionPartId?: "single" | "part-1" | "part-2",
): WizardPublishResult | null {
  const resultDir = wizardPublishResultDir(topicId, productionPartId);
  if (!resultDir) return null;
  const p = join(resultDir, "final-e2e-publish-result.json");
  const parsed = readAbsJson(p) as {
    status?: string;
    blockerCode?: string | null;
    partialExternalState?: string;
    executionResult?: {
      instagram?: { mediaId?: string | null };
      youtube?: { videoId?: string | null; url?: string | null };
      ledger?: { recordedKeys?: string[] };
    };
  } | null;
  if (!parsed) return null;
  return {
    status: typeof parsed.status === "string" ? parsed.status : null,
    blockerCode: typeof parsed.blockerCode === "string" ? parsed.blockerCode : null,
    instagramMediaId: parsed.executionResult?.instagram?.mediaId ?? null,
    youtubeVideoId: parsed.executionResult?.youtube?.videoId ?? null,
    youtubeUrl: parsed.executionResult?.youtube?.url ?? null,
    partialExternalState: typeof parsed.partialExternalState === "string" ? parsed.partialExternalState : null,
    ledgerRecordedKeys: Array.isArray(parsed.executionResult?.ledger?.recordedKeys)
      ? parsed.executionResult.ledger.recordedKeys.filter((k): k is string => typeof k === "string")
      : [],
  };
}

export type WizardPublishAttemptEvidence = {
  present: boolean;
  journalValid: boolean;
  reason: string;
  claimSha256: string | null;
  eventCount: number;
  latestTransition: string | null;
  latestRecordedAtIso: string | null;
  latestEventSha256: string | null;
};

export type WizardPublishReconciliationPacket = {
  schemaVersion: string;
  mode: string;
  state: string;
  reason: string | null;
  conclusion: string;
  confirmedFacts: Array<{
    id: string;
    label: string;
    value: string | null;
  }>;
  uncertainFacts: Array<{
    id: string;
    label: string;
    value: string | null;
  }>;
  ownerReview: Array<{
    id: string;
    label: string;
  }>;
  safety: {
    automaticRetryAllowed: boolean;
    automaticRecoveryAllowed: boolean;
    externalActionCount: number;
    uploadAllowed: boolean;
    ledgerMutationAllowed: boolean;
  };
};

export type WizardPublishRecoveryState = ReturnType<
  typeof classifyMoneyShortsPublishRecovery
> & {
  attemptEvidence: WizardPublishAttemptEvidence;
  youtubeOnlyRecovery: ReturnType<
    typeof emptyMoneyShortsYoutubeOnlyRecoveryOverlaySummary
  >;
  reconciliationPacket: WizardPublishReconciliationPacket;
};

type WizardPublishPartId = "single" | "part-1" | "part-2";
const WIZARD_PUBLISH_PART_IDS = [
  "single",
  "part-1",
  "part-2",
] as const satisfies readonly WizardPublishPartId[];

function summarizeWizardPublishAttemptEvidence(
  inspection: {
    exists?: unknown;
    valid?: unknown;
    reason?: unknown;
    claimFile?: { sha256?: unknown } | null;
    events?: unknown;
    latestEvent?: {
      transition?: unknown;
      recordedAtIso?: unknown;
      eventSha256?: unknown;
    } | null;
  },
): WizardPublishAttemptEvidence {
  const events = Array.isArray(inspection.events)
    ? inspection.events
    : [];
  return {
    present: inspection.exists === true,
    journalValid: inspection.valid === true,
    reason:
      typeof inspection.reason === "string"
        ? inspection.reason
        : "attempt_journal_inspection_failed",
    claimSha256:
      typeof inspection.claimFile?.sha256 === "string"
        ? inspection.claimFile.sha256
        : null,
    eventCount: events.length,
    latestTransition:
      typeof inspection.latestEvent?.transition === "string"
        ? inspection.latestEvent.transition
        : null,
    latestRecordedAtIso:
      typeof inspection.latestEvent?.recordedAtIso === "string"
        ? inspection.latestEvent.recordedAtIso
        : null,
    latestEventSha256:
      typeof inspection.latestEvent?.eventSha256 === "string"
        ? inspection.latestEvent.eventSha256
        : null,
  };
}

function unreadableWizardPublishRecoveryState(
  currentBinding: Record<string, string>,
): WizardPublishRecoveryState {
  const recovery = classifyMoneyShortsPublishRecovery({
    resultFile: {
      exists: false,
      parseOk: false,
      sha256: null,
      evidence: null,
    },
    currentBinding,
    ledgerEvidence: {
      readOk: false,
      instagramAlreadyPublished: false,
      youtubeAlreadyPublished: false,
      instagramPublishedIdReference: null,
      youtubePublishedIdReference: null,
    },
  });
  const attemptEvidence: WizardPublishAttemptEvidence = {
    present: false,
    journalValid: false,
    reason: "publish_recovery_binding_unavailable",
    claimSha256: null,
    eventCount: 0,
    latestTransition: null,
    latestRecordedAtIso: null,
    latestEventSha256: null,
  };
  return {
    ...recovery,
    attemptEvidence,
    youtubeOnlyRecovery:
      emptyMoneyShortsYoutubeOnlyRecoveryOverlaySummary(),
    reconciliationPacket:
      buildMoneyShortsPublishReconciliationPacket({
        recovery,
        attemptEvidence,
      }),
  };
}

function readWizardPublishLedgerSnapshotForUnit(
  contentId: string,
  version: string,
) {
  const instagramKey = buildPublishLedgerKey(
    contentId,
    "instagram_reels",
    version,
  );
  const youtubeKey = buildPublishLedgerKey(
    contentId,
    "youtube_shorts",
    version,
  );
  const read = readPublishLedgerReadOnly(
    WIZARD_PUBLISH_LEDGER_PATH,
  );
  if (read?.ok !== true) {
    return {
      evidence: {
        readOk: false,
        instagramAlreadyPublished: false,
        youtubeAlreadyPublished: false,
        instagramPublishedIdReference: null,
        youtubePublishedIdReference: null,
      },
      youtubeRecord: null,
    };
  }
  const records: Array<{
    key?: unknown;
    publishedId?: unknown;
    [key: string]: unknown;
  }> = Array.isArray(read.ledger?.records)
    ? read.ledger.records
    : [];
  const instagramRecord =
    records.find(
      (record) =>
        record?.key === instagramKey,
    ) ?? null;
  const youtubeRecord =
    records.find(
      (record) =>
        record?.key === youtubeKey,
    ) ?? null;
  return {
    evidence: {
      readOk: true,
      instagramAlreadyPublished:
        instagramRecord !== null,
      youtubeAlreadyPublished:
        youtubeRecord !== null,
      instagramPublishedIdReference:
        typeof instagramRecord?.publishedId === "string"
          ? instagramRecord.publishedId
          : null,
      youtubePublishedIdReference:
        typeof youtubeRecord?.publishedId === "string"
          ? youtubeRecord.publishedId
          : null,
    },
    youtubeRecord,
  };
}

function readWizardPublishRecoveryStateFromMedia(
  topicId: string,
  productionPartId: WizardPublishPartId,
  media: WizardRealMediaState,
): WizardPublishRecoveryState {
  const safeSlug = toSafeTopicSlug(topicId);
  const currentPart = media.parts.find(
    (part) => part.id === productionPartId,
  );
  const resultDir = wizardPublishResultDir(
    topicId,
    productionPartId,
  );
  if (!safeSlug || !resultDir) {
    return unreadableWizardPublishRecoveryState({
      contentId: "",
      version: WIZARD_FULL_SCRIPT_PUBLISH_VERSION,
      productionPartId,
      contentUnitManifestPath: "",
      contentUnitSha256: "",
      instagramSourceSha256: "",
      youtubeSourceSha256: "",
      publishMetadataSha256: "",
      finalVideoApprovalFingerprint: "",
    });
  }

  const contentId =
    productionPartId !== "single"
      ? `wizard-${safeSlug}-${productionPartId}`
      : `wizard-${safeSlug}`;
  const contentUnitManifestPath = resolve(
    join(
      resultDir,
      "dual_platform_content_unit." +
        contentId +
        "." +
        WIZARD_FULL_SCRIPT_PUBLISH_VERSION +
        ".json",
    ),
  );
  const currentMp4Path =
    typeof currentPart?.finalVideo.mp4Path === "string"
      ? resolve(currentPart.finalVideo.mp4Path)
      : null;
  const currentFinalVideo = currentPart?.finalVideo ?? null;
  const currentArtifactsReady =
    currentFinalVideo?.ready === true &&
    currentFinalVideo.ownerApproved === true &&
    currentMp4Path != null &&
    currentMp4Path.startsWith(WIZARD_VIDEO_ALLOWED_PREFIX) &&
    typeof currentFinalVideo.finalMp4Sha256 === "string" &&
    typeof currentFinalVideo.publishMetadataSha256 === "string" &&
    typeof currentFinalVideo.ownerApprovalFingerprint === "string";

  let contentUnitSha256 = "";
  if (
    currentArtifactsReady &&
    contentUnitManifestPath.startsWith(WIZARD_VIDEO_ALLOWED_PREFIX) &&
    existsSync(contentUnitManifestPath)
  ) {
    try {
      const contentUnitBytes = readFileSync(contentUnitManifestPath);
      const parsed = JSON.parse(
        contentUnitBytes.toString("utf8"),
      ) as {
        schemaVersion?: unknown;
        contentId?: unknown;
        version?: unknown;
        wizardTopicId?: unknown;
        wizardProductionPartId?: unknown;
        instagramSourcePath?: unknown;
        youtubeSourcePath?: unknown;
        sourceIntegrity?: {
          rootTopicId?: unknown;
          productionPartId?: unknown;
          finalVideoApprovalFingerprint?: unknown;
          finalMp4Sha256?: unknown;
          publishMetadataSha256?: unknown;
        };
      };
      const instagramSourcePath =
        typeof parsed.instagramSourcePath === "string"
          ? resolve(parsed.instagramSourcePath)
          : null;
      const youtubeSourcePath =
        typeof parsed.youtubeSourcePath === "string"
          ? resolve(parsed.youtubeSourcePath)
          : null;
      const manifestMatchesCurrent =
        currentFinalVideo != null &&
        parsed.schemaVersion === "dual_platform_content_unit_v1" &&
        parsed.contentId === contentId &&
        parsed.version === WIZARD_FULL_SCRIPT_PUBLISH_VERSION &&
        parsed.wizardTopicId === topicId &&
        parsed.wizardProductionPartId === productionPartId &&
        instagramSourcePath === currentMp4Path &&
        youtubeSourcePath === currentMp4Path &&
        parsed.sourceIntegrity?.rootTopicId === topicId &&
        parsed.sourceIntegrity?.productionPartId ===
          productionPartId &&
        parsed.sourceIntegrity?.finalVideoApprovalFingerprint ===
          currentFinalVideo.ownerApprovalFingerprint &&
        parsed.sourceIntegrity?.finalMp4Sha256 ===
          currentFinalVideo.finalMp4Sha256 &&
        parsed.sourceIntegrity?.publishMetadataSha256 ===
          currentFinalVideo.publishMetadataSha256;
      if (manifestMatchesCurrent) {
        contentUnitSha256 = createHash("sha256")
          .update(contentUnitBytes)
          .digest("hex");
      }
    } catch {
      contentUnitSha256 = "";
    }
  }

  const currentBinding = {
    contentId,
    version: WIZARD_FULL_SCRIPT_PUBLISH_VERSION,
    productionPartId,
    contentUnitManifestPath,
    contentUnitSha256,
    instagramSourceSha256:
      currentArtifactsReady
        ? currentFinalVideo?.finalMp4Sha256 ?? ""
        : "",
    youtubeSourceSha256:
      currentArtifactsReady
        ? currentFinalVideo?.finalMp4Sha256 ?? ""
        : "",
    publishMetadataSha256:
      currentArtifactsReady
        ? currentFinalVideo?.publishMetadataSha256 ?? ""
        : "",
    finalVideoApprovalFingerprint:
      currentArtifactsReady
        ? currentFinalVideo?.ownerApprovalFingerprint ?? ""
        : "",
  };

  const resultPath = join(
    resultDir,
    "final-e2e-publish-result.json",
  );
  const resultFile: {
    exists: boolean;
    parseOk: boolean;
    sha256: string | null;
    evidence: unknown;
  } = {
    exists: existsSync(resultPath),
    parseOk: false,
    sha256: null,
    evidence: null,
  };
  if (resultFile.exists) {
    try {
      const resultBytes = readFileSync(resultPath);
      resultFile.sha256 = createHash("sha256")
        .update(resultBytes)
        .digest("hex");
      try {
        resultFile.evidence = JSON.parse(
          resultBytes.toString("utf8"),
        );
        resultFile.parseOk = true;
      } catch {
        resultFile.parseOk = false;
      }
    } catch {
      resultFile.parseOk = false;
    }
  }

  let attemptInspection: {
    exists: boolean;
    valid: boolean;
    reason: string;
    claimFile: {
      exists: boolean;
      parseOk: boolean;
      sha256: string | null;
      evidence: unknown;
    };
    events: unknown[];
    latestEvent?: {
      transition?: unknown;
      recordedAtIso?: unknown;
      eventSha256?: unknown;
    } | null;
  };
  try {
    attemptInspection = inspectMoneyShortsPublishAttemptEvidence({
      outDir: resultDir,
      currentBinding,
    });
  } catch {
    // 읽기 자체가 실패하면 게시 미시작으로 간주하지 않는다.
    attemptInspection = {
      exists: true,
      valid: false,
      reason: "attempt_journal_inspection_failed",
      claimFile: {
        exists: true,
        parseOk: false,
        sha256: null,
        evidence: null,
      },
      events: [],
      latestEvent: null,
    };
  }
  const attemptFile = attemptInspection.claimFile.exists
    ? attemptInspection.claimFile
    : attemptInspection.exists
      ? {
          exists: true,
          parseOk: false,
          sha256: null,
          evidence: null,
        }
      : attemptInspection.claimFile;

  const ledgerSnapshot =
    readWizardPublishLedgerSnapshotForUnit(
      contentId,
      WIZARD_FULL_SCRIPT_PUBLISH_VERSION,
    );
  const ledgerEvidence = ledgerSnapshot.evidence;
  const attemptEvidence =
    summarizeWizardPublishAttemptEvidence(attemptInspection);
  const ownerResolutionFile =
    readWizardPublishOwnerReconciliationFile(
      topicId,
      productionPartId,
    );
  const currentRecovery =
    classifyMoneyShortsPublishRecovery({
    resultFile,
    attemptFile,
    attemptEvidence,
    ownerResolutionFile,
    currentBinding,
    ledgerEvidence,
  });
  const recoveryBundle =
    readWizardYoutubeOnlyRecoveryEvidenceBundle(contentId);
  let recovery = currentRecovery;
  let youtubeOnlyRecovery =
    emptyMoneyShortsYoutubeOnlyRecoveryOverlaySummary();
  if (recoveryBundle.present) {
    // Recovery claim은 업로드 직전의 target-clean ledger
    // fingerprint에 결속된다. 현재 원장에 새 YouTube record가
    // 생긴 뒤에도 원본 Owner resolution을 재검증할 수 있도록
    // 해당 content의 사전 상태만 순수하게 복원한다.
    const sourceLedgerEvidence = {
      ...ledgerEvidence,
      instagramAlreadyPublished: false,
      youtubeAlreadyPublished: false,
      instagramPublishedIdReference: null,
      youtubePublishedIdReference: null,
    };
    const sourceRecovery =
      classifyMoneyShortsPublishRecovery({
        resultFile,
        attemptFile,
        attemptEvidence,
        ownerResolutionFile,
        currentBinding,
        ledgerEvidence: sourceLedgerEvidence,
      });
    const overlaid =
      applyMoneyShortsYoutubeOnlyRecoveryOverlay({
        sourceRecovery,
        currentBinding,
        ledgerEvidence,
        youtubeLedgerRecord:
          ledgerSnapshot.youtubeRecord,
        evidenceBundle: recoveryBundle,
      });
    recovery = overlaid.recovery;
    youtubeOnlyRecovery =
      overlaid.youtubeOnlyRecovery;
  }
  return {
    ...recovery,
    attemptEvidence,
    youtubeOnlyRecovery,
    reconciliationPacket:
      buildMoneyShortsPublishReconciliationPacket({
        recovery,
        attemptEvidence,
      }),
  };
}

/**
 * 기존 armed publish 결과를 현재 full-hash artifacts 및 canonical ledger와
 * read-only로 대조한다. 이 함수는 파일을 생성/수정하지 않고 외부 호출도 하지 않는다.
 */
export function readWizardPublishRecoveryState(
  topicId: string,
  productionPartId?: WizardPublishPartId,
): WizardPublishRecoveryState {
  const media = readWizardRealMediaState(topicId);
  const resolvedPartId =
    productionPartId ??
    (media.parts.length === 1 ? media.parts[0].id : null);
  if (!resolvedPartId) {
    return unreadableWizardPublishRecoveryState({
      contentId: "",
      version: WIZARD_FULL_SCRIPT_PUBLISH_VERSION,
      productionPartId: "",
      contentUnitManifestPath: "",
      contentUnitSha256: "",
      instagramSourceSha256: "",
      youtubeSourceSha256: "",
      publishMetadataSha256: "",
      finalVideoApprovalFingerprint: "",
    });
  }
  return readWizardPublishRecoveryStateFromMedia(
    topicId,
    resolvedPartId,
    media,
  );
}

export type WizardPublishOwnerReconciliationResolveResult =
  | {
      ok: true;
      alreadyResolved: boolean;
      recovery: WizardPublishRecoveryState;
      resolutionSha256: string;
    }
  | {
      ok: false;
      reason: string;
      recovery: WizardPublishRecoveryState | null;
    };

function wizardPublishOwnerReconciliationMatchesRequest(
  recovery: WizardPublishRecoveryState,
  input: {
    expectedRecoveryFingerprint: string;
    decision: string;
    confirmation: string;
    confirmInstagramPublished: boolean;
    confirmYoutubeNotPublished: boolean;
    instagramPermalink: string;
    youtubeChannelId: string;
  },
): boolean {
  return moneyShortsPublishOwnerReconciliationMatchesRequest(
    recovery,
    input,
  );
}

/**
 * Owner가 직접 확인한 Instagram 게시/YouTube 미게시 사실을 현재 result,
 * full artifact binding, attempt claim+journal head에 묶어 최초 1회 기록한다.
 * 외부 API, child process, env/credential, 업로드, 게시, 원장 mutation은 없다.
 */
export function resolveWizardPublishOwnerReconciliation(input: {
  topicId: string;
  productionPartId: WizardPublishPartId;
  expectedRecoveryFingerprint: string;
  decision: string;
  confirmation: string;
  confirmInstagramPublished: boolean;
  confirmYoutubeNotPublished: boolean;
  instagramPermalink: string;
  youtubeChannelId: string;
}): WizardPublishOwnerReconciliationResolveResult {
  if (
    input.productionPartId !== "part-1" ||
    !toSafeTopicSlug(input.topicId)
  ) {
    return {
      ok: false,
      reason:
        "PUBLISH_OWNER_RECONCILIATION_PART_OR_TOPIC_INVALID",
      recovery: null,
    };
  }
  const current = readWizardPublishRecoveryState(
    input.topicId,
    input.productionPartId,
  );
  if (current.state === "instagram_only") {
    return wizardPublishOwnerReconciliationMatchesRequest(
      current,
      input,
    ) &&
      typeof current.ownerResolution.sha256 === "string"
      ? {
          ok: true,
          alreadyResolved: true,
          recovery: current,
          resolutionSha256:
            current.ownerResolution.sha256,
        }
      : {
          ok: false,
          reason:
            "PUBLISH_OWNER_RECONCILIATION_ALREADY_RECORDED_CONFLICT",
          recovery: current,
        };
  }
  if (
    current.state !== "ambiguous" ||
    current.reason !== "youtube_publish_outcome_unknown" ||
    current.recoveryFingerprint !==
      input.expectedRecoveryFingerprint
  ) {
    return {
      ok: false,
      reason:
        "PUBLISH_OWNER_RECONCILIATION_CURRENT_EVIDENCE_STALE",
      recovery: current,
    };
  }
  const built =
    buildMoneyShortsPublishOwnerReconciliationEvidence({
      topicId: input.topicId,
      productionPartId: input.productionPartId,
      recovery: current,
      attemptEvidence: current.attemptEvidence,
      decision: input.decision,
      confirmation: input.confirmation,
      confirmInstagramPublished:
        input.confirmInstagramPublished,
      confirmYoutubeNotPublished:
        input.confirmYoutubeNotPublished,
      instagramPermalink: input.instagramPermalink,
      youtubeChannelId: input.youtubeChannelId,
    });
  if (built.ok !== true || !built.evidence) {
    return {
      ok: false,
      reason:
        built.reason ??
        "PUBLISH_OWNER_RECONCILIATION_EVIDENCE_BUILD_FAILED",
      recovery: current,
    };
  }
  const evidence = built.evidence;
  const path = wizardPublishOwnerReconciliationPath(
    input.topicId,
    input.productionPartId,
  );
  if (!path) {
    return {
      ok: false,
      reason:
        "PUBLISH_OWNER_RECONCILIATION_PATH_INVALID",
      recovery: current,
    };
  }
  const written =
    writeMoneyShortsPublishOwnerReconciliationOnce({
      path,
      evidence,
    });
  if (
    written.ok !== true ||
    !("sha256" in written) ||
    typeof written.sha256 !== "string" ||
    !("alreadyExists" in written) ||
    typeof written.alreadyExists !== "boolean"
  ) {
    const raced = readWizardPublishRecoveryState(
      input.topicId,
      input.productionPartId,
    );
    if (
      wizardPublishOwnerReconciliationMatchesRequest(
        raced,
        input,
      ) &&
      typeof raced.ownerResolution.sha256 === "string"
    ) {
      return {
        ok: true,
        alreadyResolved: true,
        recovery: raced,
        resolutionSha256:
          raced.ownerResolution.sha256,
      };
    }
    return {
      ok: false,
      reason:
        written.reason ??
        "PUBLISH_OWNER_RECONCILIATION_WRITE_FAILED",
      recovery: current,
    };
  }
  const successfulWrite = written as {
    ok: true;
    alreadyExists: boolean;
    sha256: string;
  };
  const resolved = readWizardPublishRecoveryState(
    input.topicId,
    input.productionPartId,
  );
  if (
    resolved.state !== "instagram_only" ||
    resolved.reason !==
      "owner_confirmed_instagram_published_youtube_not_published" ||
    resolved.recoverablePlatformCandidate !==
      "youtube_shorts" ||
    resolved.ownerResolution?.resolutionFingerprint !==
      evidence.resolutionFingerprint ||
    resolved.ownerResolution?.sha256 !==
      successfulWrite.sha256
  ) {
    return {
      ok: false,
      reason:
        "PUBLISH_OWNER_RECONCILIATION_READBACK_NOT_APPLIED",
      recovery: resolved,
    };
  }
  return {
    ok: true,
    alreadyResolved:
      successfulWrite.alreadyExists === true,
    recovery: resolved,
    resolutionSha256: successfulWrite.sha256,
  };
}

export type WizardTopicPublishRecovery = WizardPublishRecoveryState & {
  partId: WizardPublishPartId;
};

export function readWizardTopicPublishRecoveryStates(
  topicId: string,
): WizardTopicPublishRecovery[] {
  const media = readWizardRealMediaState(topicId);
  const currentPartIds = new Set(
    media.parts.map((part) => part.id),
  );
  return WIZARD_PUBLISH_PART_IDS
    .map((partId) => ({
      partId,
      ...readWizardPublishRecoveryStateFromMedia(
        topicId,
        partId,
        media,
      ),
    }))
    .filter(
      (recovery) =>
        currentPartIds.has(recovery.partId) ||
        recovery.state !== "not_started",
    );
}

/**
 * 최종 영상은 만들었지만 아직 양쪽 플랫폼에 모두 게시하지 않은 주제의 로컬 보관함 항목.
 * 별도 큐 파일을 만들지 않고, 검증된 최종 MP4와 실제 게시 결과를 다시 읽어 계산한다.
 * 따라서 양쪽 게시이 완료되면 다음 목록 조회에서 자동으로 사라진다.
 */
export type WizardUploadReadyItem = {
  topicId: string;
  title: string;
  category: WizardCategoryId;
  totalParts: number;
  totalDurationSec: number | null;
  updatedAt: string | null;
  status: "ready" | "needs_attention";
  detail: string;
  recoveryStates: WizardTopicPublishRecovery[];
};

export function listWizardUploadReadyItems(): WizardUploadReadyItem[] {
  if (!existsSync(WIZARD_INPUTS_ROOT)) return [];

  const topicIds = new Set<string>();
  try {
    for (const entry of readdirSync(WIZARD_INPUTS_ROOT, { withFileTypes: true })) {
      if (!entry.isDirectory() || !/^[a-z0-9][a-z0-9_-]{2,180}$/i.test(entry.name)) continue;
      const raw = readAbsJson(join(WIZARD_INPUTS_ROOT, entry.name, "script-final.json")) as Partial<WizardFinalScriptRecord> | null;
      if (typeof raw?.topicId === "string") topicIds.add(raw.topicId);
    }
  } catch {
    return [];
  }

  const items: WizardUploadReadyItem[] = [];
  for (const topicId of topicIds) {
    const record = readWizardFinalScriptRecord(topicId);
    const media = readWizardRealMediaState(topicId);
    if (!record) continue;

    const generatedTopic = readWizardGeneratedTopic(topicId);
    if (generatedTopic?.category !== "finance" && !topicId.startsWith("gen-finance-")) continue;

    const recoveryStates =
      readWizardTopicPublishRecoveryStates(topicId);
    const allPublished =
      recoveryStates.length > 0 &&
      recoveryStates.every(
        (recovery) => recovery.state === "complete",
      );
    if (allPublished) continue;

    // 2편 중 한 편만 complete여도 generic dual upload는 완료 편을 중복 게시할 수 있다.
    // 따라서 all-complete가 아닌 상태에서는 기존 result가 단 하나라도 있으면 주의 항목이다.
    const needsAttention = recoveryStates.some(
      (recovery) => recovery.genericDualUploadBlocked === true,
    );
    if (
      !needsAttention &&
      (!media.mediaQualityGate.ok || !media.finalVideo.ready)
    ) continue;
    let newestMtimeMs = 0;
    for (const part of media.parts) {
      if (!part.finalVideo.mp4Path) continue;
      try {
        newestMtimeMs = Math.max(newestMtimeMs, statSync(part.finalVideo.mp4Path).mtimeMs);
      } catch {
        // media gate가 파일을 다시 검증했으므로, 정렬 정보만 생략한다.
      }
    }
    items.push({
      topicId,
      title: record.script.title,
      category: "finance",
      totalParts:
        media.production.totalParts > 0
          ? media.production.totalParts
          : recoveryStates.length,
      totalDurationSec: media.finalVideo.durationSec,
      updatedAt: newestMtimeMs > 0 ? new Date(newestMtimeMs).toISOString() : null,
      status: needsAttention ? "needs_attention" : "ready",
      detail: needsAttention
        ? "게시 결과 증거를 확인해야 합니다. 자동 재시도와 일반 양쪽 업로드를 막았습니다."
        : "최종 영상이 준비됐습니다. 게시 전 점검 후 실제 업로드만 진행하면 됩니다.",
      recoveryStates,
    });
  }

  return items.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

// ══════════════════════════════════════════════════════════════════════════════
// 실제 제작 파이프라인 — Claude 대본 1회 보정 + 실제 TTS/이미지/최종 mp4 + media gate
// task: owner-web-real-script-voice-visual-generation-pipeline-v1
//
// 구조: 로컬 후보 여러 개 생성 → 로컬 judge 최고 후보 1개 선택(기존) → 그 1개만
// Claude API로 1회 보정 → 확정 대본(script-final.json) → 실제 TTS → 장면 이미지 →
// 최종 mp4 → media quality gate 통과 시에만 업로드 가능.
//
// 안전 계약:
// - Anthropic SDK 의존성 없음 — Node fetch만 사용하고 fetchImpl 주입으로 테스트한다.
// - ANTHROPIC_API_KEY는 서버 런타임 process.env에서만 읽고 child/로그/응답에 절대 넣지 않는다.
// - key 없음/HTTP 실패/JSON 파싱 실패/계약 검증 실패/judge 점수 회귀 → 로컬 대본 그대로 사용.
// - 이 helper의 네트워크 호출은 ANTHROPIC_API_URL 하나뿐이다(guard가 강제).
// ══════════════════════════════════════════════════════════════════════════════

/** Claude 보정이 호출하는 유일한 외부 URL(고정). 다른 어떤 네트워크 호출도 이 파일에 없다. */
export const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
/**
 * 보정 기본 모델 — Owner 비용 정책(기본 Haiku/Sonnet, Opus는 별도 승인)에 따라 Sonnet.
 * ANTHROPIC_POLISH_MODEL env로 오버라이드 가능(값은 모델 id 문자열, secret 아님).
 */
export const CLAUDE_POLISH_DEFAULT_MODEL = "claude-sonnet-4-6";
/**
 * 검증/점검 중 실제 Claude 호출을 잠그는 킬스위치.
 * env WIZARD_DISABLE_CLAUDE_POLISH=1 또는 marker 파일 존재 시 polish를 건너뛴다(로컬 대본 사용).
 * marker가 남아 있으면 UI note에 그대로 표시돼 Owner가 바로 알 수 있다.
 */
export const WIZARD_POLISH_DISABLE_MARKER = join(WIZARD_VIDEO_OUT_ROOT, "DISABLE_LIVE_CLAUDE_POLISH.marker");

export type WizardClaudePolishInfo = {
  applied: boolean;
  mode: "claude_polished" | "local_only";
  reasonCode:
    | "APPLIED"
    | "NO_API_KEY"
    | "POLISH_DISABLED"
    | "NOT_LOCAL_RUNTIME"
    | "API_ERROR"
    | "TIMEOUT"
    | "PARSE_FAILED"
    | "VALIDATION_FAILED";
  /** 사람이 읽는 한 줄(“Claude 보정 적용됨” / “Claude 보정 미적용 — 로컬 대본 사용 중”). secret 없음. */
  note: string;
  /** 보정에 사용한 모델 id(적용 시). */
  model: string | null;
  /** Claude가 보고한 고친 부분 요약(적용 시). */
  rewriteNotes: string[];
  /** 로컬 대본 judge 점수 vs 보정본 judge 점수(회귀 방지 근거). */
  localScore: number | null;
  polishedScore: number | null;
};

/** script-final.json 레코드 — 대본 확정본(보정 or 로컬) + 엔진 메타데이터. */
export type WizardFinalScriptRecord = {
  schemaVersion: "wizard_script_final_v1";
  topicId: string;
  mode: "claude_polished" | "local_only";
  localFingerprint: string;
  polish: WizardClaudePolishInfo;
  script: WizardScriptPreview;
  production?: {
    contractVersion: typeof FINANCE_EDITORIAL_VIDEO_STRATEGY_VERSION;
    rootTopicId: string;
    partId: "single" | "part-1" | "part-2";
    partNumber: 1 | 2;
    totalParts: 1 | 2;
    canonicalTitle: string;
    platformTitle: string;
  };
};

/** 로컬 대본의 내용 지문 — 같은 대본이면 보정을 다시 호출하지 않는다(1회 구조). */
export function wizardScriptFingerprint(preview: WizardScriptPreview): string {
  return createHash("sha1")
    .update(JSON.stringify({
      e: WIZARD_SCRIPT_ENGINE_VERSION,
      t: preview.title,
      v: preview.fullVoiceover,
      c: preview.captionLines,
      s: preview.videoStrategy,
      m: preview.scenes.map((scene) => ({
        id: scene.id,
        narration: scene.narration,
        override: scene.mediaStrategyOverride ?? "auto",
        strategy: scene.mediaStrategy,
      })),
    }))
    .digest("hex");
}

/** Claude 반환 JSON 계약(검증 통과분). */
type PolishedScriptShape = {
  title: string;
  oneSentencePoint: string;
  hookLine: string;
  fullVoiceover: string;
  captionLines: string[];
  scenes: Array<{ label: string; caption: string; visualCue: string; narration: string }>;
  uploadCaptionDraft: string;
  rewriteNotes: string[];
};

/**
 * Claude 응답 텍스트 → 계약 검증. JSON 외 텍스트/필드 수 불일치/자막 길이 초과/
 * 설명체 종결/제목 약패턴 발견 시 실패(→ 로컬 대본 fallback).
 */
export function validatePolishedScript(raw: unknown): { ok: true; value: PolishedScriptShape } | { ok: false; reasons: string[] } {
  const reasons: string[] = [];
  const o = raw as Partial<PolishedScriptShape> | null;
  const str = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

  if (!o || typeof o !== "object") return { ok: false, reasons: ["json_not_object"] };
  if (!str(o.title) || o.title.trim().length < 4 || o.title.trim().length > 40) reasons.push("title_invalid");
  if (str(o.title) && WEAK_TITLE_PATTERN.test(o.title)) reasons.push("title_weak_pattern");
  if (!str(o.hookLine) || o.hookLine.trim().length > 40) reasons.push("hookLine_invalid");
  if (!str(o.oneSentencePoint)) reasons.push("oneSentencePoint_invalid");
  if (!str(o.fullVoiceover) || o.fullVoiceover.trim().length < 40 || o.fullVoiceover.trim().length > WIZARD_SCRIPT_FULL_VOICEOVER_MAX_CHARS) {
    reasons.push("fullVoiceover_invalid");
  } else {
    const lineCount = countNarrationLines(o.fullVoiceover);
    if (lineCount < WIZARD_SCRIPT_MIN_SHORT_LINES || lineCount > WIZARD_SCRIPT_MAX_SHORT_LINES) {
      reasons.push("fullVoiceover_short_line_rhythm_invalid");
    }
  }
  const polishedSceneCount = Array.isArray(o.scenes) ? o.scenes.length : null;
  if (!Array.isArray(o.captionLines) || polishedSceneCount === null || o.captionLines.length !== polishedSceneCount) reasons.push("captionLines_scene_count_mismatch");
  else {
    for (const c of o.captionLines) {
      if (!str(c) || c.trim().length > WIZARD_CAPTION_MAX_CHARS) { reasons.push("caption_over_limit_or_empty"); break; }
    }
  }
  if (!Array.isArray(o.scenes) || !isSupportedWizardSceneCount(o.scenes.length)) reasons.push("scenes_count_unsupported");
  else {
    for (const s of o.scenes) {
      if (!s || !str(s.label) || !str(s.caption) || !str(s.visualCue) || !str(s.narration)) {
        reasons.push("scene_fields_missing"); break;
      }
      if (s.caption.trim().length > WIZARD_CAPTION_MAX_CHARS) { reasons.push("scene_caption_over_limit"); break; }
      if (s.visualCue.trim().length < 8) { reasons.push("scene_visualCue_too_short"); break; }
      if (s.narration.trim().length < 8 || s.narration.trim().length > WIZARD_SCRIPT_SCENE_NARRATION_MAX_CHARS) { reasons.push("scene_narration_length"); break; }
    }
  }
  if (!str(o.uploadCaptionDraft) || o.uploadCaptionDraft.trim().length < 10) reasons.push("uploadCaptionDraft_invalid");
  if (!Array.isArray(o.rewriteNotes) || o.rewriteNotes.some((n) => typeof n !== "string")) reasons.push("rewriteNotes_invalid");

  // 설명체(하십시오체 …니다 종결)·클리셰 명령은 자막/낭독 전체에서 금지.
  const politeTargets = [
    ...(Array.isArray(o.captionLines) ? o.captionLines : []),
    ...(Array.isArray(o.scenes) ? o.scenes.flatMap((s) => [s?.caption ?? "", s?.narration ?? ""]) : []),
    o.fullVoiceover ?? "",
    o.hookLine ?? "",
  ];
  if (politeTargets.some((t) => AI_TONE_PATTERNS.test(String(t)))) reasons.push("polite_or_lecture_tone");
  if ([o.fullVoiceover ?? "", ...(Array.isArray(o.scenes) ? o.scenes.map((s) => s?.narration ?? "") : [])]
    .some((t) => SHORTFORM_SOFT_POLITE_PATTERNS.test(String(t)))) {
    reasons.push("soft_polite_not_owner_tone");
  }

  const fullNarrative = [
    o.fullVoiceover ?? "",
    ...(Array.isArray(o.scenes) ? o.scenes.map((s) => s?.narration ?? "") : []),
  ].join("\n");
  const forbiddenGenericPattern = /제목 속 선택|같은 돈 문제|비슷한 선택|정보 감각|오늘 한 번만 직접 확인|다음 선택의 기준으로 남겨|회피이|자기합리화이|근데 진짜 문제는 따로 있어/;
  if (forbiddenGenericPattern.test(fullNarrative)) reasons.push("generic_or_malformed_script_copy");

  const concreteActionPattern = /앱|영수증|자동이체|명세서|목록|계좌|잔고|총액|금리|결제일|상환일|한도|예산|적어|확인해|열어|계산해|분리해|옮겨|꺼|설정해/;
  if (!concreteActionPattern.test(fullNarrative)) reasons.push("concrete_action_missing");

  const lastNarration = Array.isArray(o.scenes) && o.scenes.length > 0
    ? o.scenes[o.scenes.length - 1]?.narration ?? ""
    : "";
  const closingText = `${lastNarration}\n${o.fullVoiceover ?? ""}`;
  if (!/다시 봐|꺼내/.test(closingText) || !/저장해 둬/.test(closingText) || !/팔로우해 둬/.test(closingText)) {
    reasons.push("contextual_save_follow_closing_missing");
  }

  if (reasons.length > 0) return { ok: false, reasons: [...new Set(reasons)] };
  const v = o as PolishedScriptShape;
  return {
    ok: true,
    value: {
      ...v,
      title: v.title.trim(),
      hookLine: v.hookLine.trim(),
      oneSentencePoint: v.oneSentencePoint.trim(),
      fullVoiceover: v.fullVoiceover.trim(),
      captionLines: v.captionLines.map((c) => c.trim()),
      scenes: v.scenes.map((s) => ({
        label: s.label.trim(),
        caption: s.caption.trim(),
        visualCue: s.visualCue.trim(),
        narration: s.narration.trim(),
      })),
      uploadCaptionDraft: v.uploadCaptionDraft.trim(),
      rewriteNotes: v.rewriteNotes.map((n) => n.trim()).filter((n) => n.length > 0).slice(0, 8),
    },
  };
}

const CLAUDE_POLISH_SYSTEM_PROMPT = [
  "당신은 한국어 숏폼(릴스/쇼츠) 대본 전문 에디터다. 입력으로 로컬 엔진이 만든 대본 JSON을 받는다.",
  "구조와 핵심 메시지는 유지하면서 첫 3초 훅, 짧은 줄 단위 내레이션 리듬, '내 얘기 같다'는 자기인식, 장면 시각 지시를 다듬어라.",
  "",
  "반드시 지켜야 하는 규칙:",
  "- 출력은 JSON 객체 하나만. 마크다운 코드펜스, 설명 문장, 주석을 절대 붙이지 마라.",
  "- 입력 title은 확정 제목이다. 한 글자도 바꾸거나 줄이거나 다른 제목으로 대체하지 마라.",
  "- 제목의 구체 대상과 경제 메커니즘을 훅에서만 말하지 마라. 보편 상황, 금전 결과, 심리, 행동에도 같은 대상을 구체적으로 이어라.",
  "- scenes 개수를 먼저 정하지 마라. 대본의 의미 전환과 하나의 시각 사건이 자연스럽게 맞물릴 때만 장면을 나눠라(안전 범위 4~18개).",
  "- 짧은 대본을 장면 수 때문에 늘리거나, 긴 대본을 8개·10개에 억지로 압축하지 마라. 같은 의미 단계가 길면 서로 다른 시각 사건으로 2개 이상 나눌 수 있다.",
  "- captionLines는 scenes와 같은 개수, 각각 34자 이하(공백 포함).",
  '- scenes의 각 원소는 {"label","caption","visualCue","narration"} 형태.',
  "  caption은 34자 이하 화면 자막, narration은 그 장면에서 실제로 읽을 한국어 낭독문(8~260자). narration 안에는 짧은 줄바꿈을 써도 된다.",
  "  visualCue는 자막 없이도 장면이 전달되게 하는 프리미엄 경제 에디토리얼 콜라주/스타일화 3D 오브젝트 묘사다.",
  "  실사 인물 중심 금지. 얼굴 클로즈업 금지. 이미지 안 글자/숫자/로고/워터마크 금지. 제목·자막은 renderer가 나중에 얹는다.",
  "  같은 영상에서는 3D 에디토리얼 질감과 완성도만 공유한다. 중심 오브젝트, 공간, 구도, 카메라, 조명, 감정은 장면 역할에 맞게 확실히 달라야 한다.",
  "  금리/빚 주제라도 모든 장면을 어둡게 만들지 마라. 보편 상황은 자연광, 기준 전환은 밝아지는 빛, 실천과 마무리는 맑고 열린 빛을 우선한다.",
  "  체인, 쇠공, 고전 은행 건물, 거대한 퍼센트, 빨간 화살표, 카드, 영수증 더미는 각각 한 영상에서 중심 소재로 최대 1회만 쓴다.",
  "  장면 순서별 시각 역할: 훅=한 가지 강한 사건, 문제=숨은 원인, 상황=생활 공간, 결과=구체적 금전 증거, 심리=인물의 선택, 전환=열리는 기준, 실천=손의 행동, 마무리=통제감과 동기.",
  "  프레임 하단 전체를 검은 빈 바닥으로 남기지 마라. 자막 여백도 장면과 연결된 질감과 깊이가 있어야 한다.",
  "- 하십시오체('…합니다/…입니다' 등 '니다' 종결) 금지. 해요체('거예요/해요/봐요/하세요')도 피하고 반말형/단정형('많지/아니야/봐/저장해 둬')을 우선 사용.",
  "- 제목에 '이유/방법/공통점/체크리스트' 같은 설명형 패턴 금지.",
  "- 설명식 일반론 금지. 필요하면 가난한 소비 습관을 따끔하게 지적하되 실제 경제 신호와 생활 장면에 붙여라.",
  "- 문제 지적 뒤에는 실제 생활 장면, 구체 금전 결과, 반복하게 만드는 심리, 성공 기준, 오늘 실행할 행동 순서로 이어라.",
  "- 행동은 '확인해라/번역해라' 같은 추상 명령으로 끝내지 마라. 열 앱이나 명세서, 볼 숫자, 바꿀 자동이체·한도·결제 행동을 적어라.",
  "- '제목 속 선택', '같은 돈 문제', '비슷한 선택', '정보 감각'처럼 다른 제목에도 붙는 문장으로 로컬 대본을 덮어쓰지 마라.",
  "- fullVoiceover는 scenes의 narration을 순서대로 자연스럽게 이은 전체 낭독문. 22~45개의 짧은 줄로 몰아치는 쇼츠 내레이션이어야 한다.",
  "- 좋은 리듬: 제목의 실제 훅과 경제 원인을 짧게 끊어 말하되, 다른 제목의 예시 문장을 재사용하지 마라.",
  "- scenes 권장 순서: 첫 훅, 문제 확대, 보편 상황, 경제 결과, 심리 원인, 기준 전환, 실천 루틴, 성공 기준+저장/재시청.",
  "- 마지막 장면에는 이 주제와 같은 상황이 다시 오는 순간, 다시 볼 이유, '저장해 둬', 다음 콘텐츠를 팔로우할 구체 이유와 '팔로우해 둬'를 함께 넣어라.",
  "- 저장 CTA만 한 장면으로 짧게 떼지 마라. 성공 기준과 상황별 재시청·저장·팔로우 문장을 같은 마지막 장면에 묶어라.",
  "",
  "출력 JSON 필드: title, oneSentencePoint, hookLine, fullVoiceover,",
  "captionLines(문자열 배열), scenes(흐름 기반 동적 개수: label/caption/visualCue/narration),",
  "uploadCaptionDraft(SNS 설명글 초안), rewriteNotes(무엇을 왜 고쳤는지 한국어 요약 배열).",
].join("\n");

function extractBalancedJsonCandidate(body: string): string | null {
  for (let start = 0; start < body.length; start += 1) {
    const first = body[start];
    if (first !== "{" && first !== "[") continue;
    const stack: string[] = [first === "{" ? "}" : "]"];
    let inString = false;
    let escaped = false;
    for (let i = start + 1; i < body.length; i += 1) {
      const ch = body[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === "\"") inString = false;
        continue;
      }
      if (ch === "\"") {
        inString = true;
        continue;
      }
      if (ch === "{") stack.push("}");
      else if (ch === "[") stack.push("]");
      else if (ch === "}" || ch === "]") {
        if (stack[stack.length - 1] !== ch) break;
        stack.pop();
        if (stack.length === 0) return body.slice(start, i + 1).trim();
      }
    }
  }
  return null;
}

/** 코드펜스나 앞뒤 prose가 붙어 와도 첫 번째 유효 JSON 객체/배열 본문만 꺼낸다. */
function extractJsonText(text: string): string {
  const t = text.trim();
  const fences = [...t.matchAll(/```(?:json)?\s*([\s\S]*?)\s*```/gi)].map((m) => m[1].trim());
  for (const body of [...fences, t]) {
    const candidate = extractBalancedJsonCandidate(body);
    if (candidate) return candidate;
  }
  return t;
}

/**
 * 로컬 최고 후보 대본 1개를 Claude API로 1회 보정한다.
 * - fetchImpl 주입 가능(테스트는 fake fetch만 사용, 실제 호출은 Owner 버튼 클릭 시 서버 런타임).
 * - 실패 시 어떤 경우에도 로컬 대본을 그대로 돌려준다(fail-open to local, 업로드와 무관).
 */
export async function polishWizardScriptWithClaude(
  local: WizardScriptPreview,
  opts?: {
    fetchImpl?: typeof globalThis.fetch;
    apiKey?: string | null;
    model?: string;
    timeoutMs?: number;
  },
): Promise<{ script: WizardScriptPreview; polish: WizardClaudePolishInfo }> {
  const localJudge = local.quality?.overallScore ?? null;
  const fallback = (reasonCode: WizardClaudePolishInfo["reasonCode"], noteTail: string): { script: WizardScriptPreview; polish: WizardClaudePolishInfo } => ({
    script: local,
    polish: {
      applied: false,
      mode: "local_only",
      reasonCode,
      note: `Claude 보정 미적용 — 로컬 대본 사용 중 (${noteTail})`,
      model: null,
      rewriteNotes: [],
      localScore: localJudge,
      polishedScore: null,
    },
  });

  const apiKey = opts?.apiKey !== undefined ? opts.apiKey : (process.env.ANTHROPIC_API_KEY ?? null);
  if (!apiKey || apiKey.trim() === "") return fallback("NO_API_KEY", "ANTHROPIC_API_KEY 없음");
  const fetchImpl = opts?.fetchImpl ?? globalThis.fetch;
  const model = opts?.model ?? process.env.ANTHROPIC_POLISH_MODEL ?? CLAUDE_POLISH_DEFAULT_MODEL;
  const timeoutMs = opts?.timeoutMs ?? 45_000;

  const userPayload = JSON.stringify(
    {
      title: local.title,
      hookLine: local.hookLine,
      fullVoiceover: local.fullVoiceover,
      captionLines: local.captionLines,
      scenes: local.scenes.map((s) => ({
        label: s.label,
        caption: s.captionText,
        visualCue: s.visualCue,
        narration: s.narration,
      })),
      uploadCaptionDraft: local.uploadCaptionDraft,
    },
    null,
    2,
  );

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let respText: string;
  try {
    const resp = await fetchImpl(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: CLAUDE_POLISH_SYSTEM_PROMPT,
        messages: [{ role: "user", content: `현재 대본:\n${userPayload}` }],
      }),
      signal: controller.signal,
    });
    if (!resp.ok) return fallback("API_ERROR", `API 응답 ${resp.status}`);
    const data = (await resp.json()) as {
      content?: Array<{ type?: string; text?: string }>;
      stop_reason?: string;
    };
    const textBlock = (data.content ?? []).find((b) => b?.type === "text" && typeof b.text === "string");
    if (!textBlock?.text) return fallback("API_ERROR", `응답에 텍스트 없음${data.stop_reason ? ` (stop: ${data.stop_reason})` : ""}`);
    respText = textBlock.text;
  } catch (e) {
    const aborted = (e as Error)?.name === "AbortError";
    return fallback(aborted ? "TIMEOUT" : "API_ERROR", aborted ? `${Math.round(timeoutMs / 1000)}초 초과` : "네트워크/호출 실패");
  } finally {
    clearTimeout(timer);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonText(respText));
  } catch {
    return fallback("PARSE_FAILED", "JSON 파싱 실패");
  }
  const validated = validatePolishedScript(parsed);
  if (!validated.ok) return fallback("VALIDATION_FAILED", `계약 위반: ${validated.reasons.slice(0, 3).join(", ")}`);
  const v = validated.value;
  if (v.title !== local.title) return fallback("VALIDATION_FAILED", "확정 제목 변경 감지");

  const inferSceneId = (label: string, index: number, total: number): WizardScriptScene["id"] => {
    if (index === 0 || /훅|hook/i.test(label)) return "hook";
    if (index === total - 1 || /저장|마무리|closing|save/i.test(label)) return "save";
    if (/문제|원인 확대|hidden problem/i.test(label)) return "problem";
    if (/상황|현실|일상|reality|situation/i.test(label)) return "situation";
    if (/결과|손해|경제|result|consequence/i.test(label)) return "consequence";
    if (/심리|감정|psychology/i.test(label)) return "psychology";
    if (/전환|기준|관점|mindset|turn/i.test(label)) return "mindset";
    if (/실천|습관|행동|habit|action/i.test(label)) return "habit";
    if (/추천|성공|recommend/i.test(label)) return "recommendation";
    const progress = index / Math.max(1, total - 1);
    if (progress < 0.2) return "problem";
    if (progress < 0.35) return "situation";
    if (progress < 0.5) return "consequence";
    if (progress < 0.65) return "psychology";
    if (progress < 0.78) return "mindset";
    if (progress < 0.9) return "habit";
    return "recommendation";
  };
  const inferredScenes = v.scenes.map((s, i) => ({
    id: inferSceneId(s.label, i, v.scenes.length),
    label: s.label,
    narration: s.narration,
    captionText: s.caption,
  }));
  const localFinanceEvidence = local.scenes.find((scene) => scene.visualEvidence)?.visualEvidence;
  const polishedDna = buildWizardVisualDna({ title: v.title, hook: v.hookLine });
  const polishedPartCounts = new Map<WizardScriptScene["id"], number>();
  for (const scene of inferredScenes) {
    polishedPartCounts.set(scene.id, (polishedPartCounts.get(scene.id) ?? 0) + 1);
  }
  const polishedSeenParts = new Map<WizardScriptScene["id"], number>();
  const scenes = applyWizardSceneMediaStrategies(inferredScenes.map((scene): WizardScriptScene => {
    const partCount = polishedPartCounts.get(scene.id) ?? 1;
    const partIndex = polishedSeenParts.get(scene.id) ?? 0;
    polishedSeenParts.set(scene.id, partIndex + 1);
    const visualEvidence = localFinanceEvidence
      ? buildFinanceVisualEvidence({
          title: v.title,
          narration: scene.narration,
          stage: scene.id,
          financeSubtopic: localFinanceEvidence.financeSubtopic,
          editorialLane: localFinanceEvidence.editorialLane,
          partIndex,
          partCount,
        })
      : undefined;
    return {
      ...scene,
      visualCue: buildEditorialVisualCue(
        scene.id,
        `Claude-polished ${scene.id} narration; exact local visual evidence takes priority`,
        scene.narration,
        polishedDna,
        visualEvidence,
      ),
      visualEvidence,
    };
  }));
  const polishedJudgment = judgeFinanceScriptContent({
    title: v.title,
    hookLine: v.hookLine,
    fullVoiceover: v.fullVoiceover,
    captionLines: v.captionLines,
    scenes,
  });
  if (!polishedJudgment.passed) {
    return fallback("VALIDATION_FAILED", `실제 대본 품질 미달: ${polishedJudgment.rejectReasons.slice(0, 2).join(", ")}`);
  }
  if (localJudge != null && polishedJudgment.overallScore < localJudge - 5) {
    return fallback("VALIDATION_FAILED", `실제 대본 점수 회귀 (${polishedJudgment.overallScore} < ${localJudge})`);
  }

  const script: WizardScriptPreview = {
    ...local,
    title: v.title,
    hook: v.hookLine,
    hookLine: v.hookLine,
    curiosity: scenes[2]?.narration ?? scenes[1]?.narration ?? local.curiosity,
    action: scenes[scenes.length - 1]?.narration ?? local.action,
    captionLines: v.captionLines,
    fullVoiceover: v.fullVoiceover,
    scenes,
    captionFirstLineHook: v.hookLine,
    uploadCaptionDraft: v.uploadCaptionDraft,
    goldenSampleChecks: {
      ...local.goldenSampleChecks,
      captionsWithinLimit: v.captionLines.every((c) => c.length <= WIZARD_CAPTION_MAX_CHARS),
    },
    quality: polishedJudgment,
  };
  return {
    script,
    polish: {
      applied: true,
      mode: "claude_polished",
      reasonCode: "APPLIED",
      note: "Claude 보정 적용됨",
      model,
      rewriteNotes: v.rewriteNotes,
      localScore: localJudge,
      polishedScore: polishedJudgment.overallScore,
    },
  };
}

/** script-final.json 경로(topic별, repo 밖). */
function wizardFinalScriptPath(safeSlug: string): string {
  return join(WIZARD_INPUTS_ROOT, safeSlug, "script-final.json");
}

/** 확정 대본 레코드를 읽는다(없거나 형식이 다르면 null). */
export function readWizardFinalScriptRecord(topicId: string): WizardFinalScriptRecord | null {
  const slug = toSafeTopicSlug(topicId);
  if (!slug) return null;
  const parsed = readAbsJson(wizardFinalScriptPath(slug)) as WizardFinalScriptRecord | null;
  if (!parsed || parsed.schemaVersion !== "wizard_script_final_v1" || parsed.topicId !== topicId) return null;
  if (!parsed.script || typeof parsed.script.fullVoiceover !== "string") return null;
  const generated = readWizardGeneratedTopic(topicId);
  if (
    generated?.category === "finance" &&
    parsed.script.videoStrategy?.contractVersion !== FINANCE_EDITORIAL_VIDEO_STRATEGY_VERSION
  ) return null;
  if (
    generated?.category === "finance" &&
    (!parsed.script.videoStrategy || !financeEditorialVideoStrategyCoverHooksPass(parsed.script.videoStrategy))
  ) return null;
  if (
    generated?.category === "finance" &&
    (!Array.isArray(parsed.script.scenes) || parsed.script.scenes.some((scene) =>
      scene.visualEvidence?.version !== FINANCE_VISUAL_EVIDENCE_VERSION ||
      typeof scene.visualEvidence?.sceneIntegrationPlan !== "string" ||
      scene.visualEvidence.sceneIntegrationPlan.length < 40 ||
      typeof scene.visualEvidence?.motionPlan !== "string" ||
      scene.visualEvidence.motionPlan.length < 40
    ))
  ) return null;
  if (!Array.isArray(parsed.script.scenes) || !wizardSceneMediaStrategiesAreValid(parsed.script.scenes)) return null;
  if (!getWizardScriptQualityGate(topicId, parsed.script).passed) return null;
  return parsed;
}

/** 확정 대본(WizardScriptPreview)만 돌려준다 — TTS/이미지/영상/시안이 전부 이걸 소비한다. */
export function readWizardFinalScript(topicId: string): WizardScriptPreview | null {
  return readWizardFinalScriptRecord(topicId)?.script ?? null;
}

/** 검증/점검용 킬스위치 상태(env 또는 marker 파일). Owner 화면 note에 그대로 표시된다. */
export function isClaudePolishDisabled(): boolean {
  return process.env.WIZARD_DISABLE_CLAUDE_POLISH === "1" || existsSync(WIZARD_POLISH_DISABLE_MARKER);
}

/**
 * 대본 확정 진입점 — scriptPreview action이 호출한다.
 * 로컬 최고 후보(readScriptPreview 결과)를 받아:
 *   1) 같은 로컬 대본으로 이미 보정 완료된 캐시가 있으면 재사용(추가 API 호출 0회),
 *   2) 아니면 Claude 1회 보정 시도(키 없음/실패 시 로컬 그대로),
 *   3) 결과를 script-final.json으로 저장해 실제 TTS/이미지/영상 단계의 단일 입력으로 만든다.
 */
export async function ensureWizardFinalScript(
  topicId: string,
  local: WizardScriptPreview,
  opts?: { allowPolish?: boolean; fetchImpl?: typeof globalThis.fetch },
): Promise<WizardFinalScriptRecord> {
  const slug = toSafeTopicSlug(topicId) ?? "invalid";
  const fp = wizardScriptFingerprint(local);
  const disabled = isClaudePolishDisabled();
  const keyPresent = typeof process.env.ANTHROPIC_API_KEY === "string" && process.env.ANTHROPIC_API_KEY !== "";
  const polishAvailable = opts?.allowPolish !== false && !disabled && keyPresent;

  const cached = readWizardFinalScriptRecord(topicId);
  if (cached && cached.localFingerprint === fp) {
    // 보정 완료 캐시는 항상 재사용. local_only 캐시는 지금 보정이 가능해졌을 때만 다시 시도한다.
    if (cached.mode === "claude_polished" || !polishAvailable) return cached;
  }

  let record: WizardFinalScriptRecord;
  if (!polishAvailable) {
    const noteTail =
      opts?.allowPolish === false ? "배포 사이트에서는 보정하지 않음" : disabled ? "점검용 차단(marker/env) 활성" : "ANTHROPIC_API_KEY 없음";
    record = {
      schemaVersion: "wizard_script_final_v1",
      topicId,
      mode: "local_only",
      localFingerprint: fp,
      polish: {
        applied: false,
        mode: "local_only",
        reasonCode: opts?.allowPolish === false ? "NOT_LOCAL_RUNTIME" : disabled ? "POLISH_DISABLED" : "NO_API_KEY",
        note: `Claude 보정 미적용 — 로컬 대본 사용 중 (${noteTail})`,
        model: null,
        rewriteNotes: [],
        localScore: local.quality?.overallScore ?? null,
        polishedScore: null,
      },
      script: local,
    };
  } else {
    const polished = await polishWizardScriptWithClaude(local, { fetchImpl: opts?.fetchImpl });
    record = {
      schemaVersion: "wizard_script_final_v1",
      topicId,
      mode: polished.polish.mode,
      localFingerprint: fp,
      polish: polished.polish,
      script: polished.script,
    };
  }

  try {
    mkdirSync(join(WIZARD_INPUTS_ROOT, slug), { recursive: true });
    writeFileSync(wizardFinalScriptPath(slug), JSON.stringify(record, null, 2), "utf8");
  } catch {
    // 저장 실패 시에도 화면 표시는 가능하지만, 실제 TTS/이미지 단계는 파일이 없어 fail-closed된다.
    record.polish.note += " · 확정 대본 저장 실패(실제 생성 단계 진행 불가)";
  }
  return record;
}

// ── 실제 파이프라인 입력/상태 ────────────────────────────────────────────────

export type WizardProductionScriptPart = {
  id: "single" | "part-1" | "part-2";
  partNumber: 1 | 2;
  totalParts: 1 | 2;
  canonicalTitle: string;
  platformTitle: string;
  coverLines: FinanceEditorialCoverLine[];
  coverHookAudit: FinanceEditorialCoverHookAudit | null;
  script: WizardScriptPreview;
};

function productionSceneMatchesStages(
  sceneId: WizardScriptScene["id"],
  sourceStages: FinanceEditorialVideoStrategy["parts"][number]["sourceStages"],
): boolean {
  if (sourceStages.includes("hook") && (sceneId === "hook" || sceneId === "problem")) return true;
  if (sourceStages.includes("recommendation") && (sceneId === "recommendation" || sceneId === "save")) return true;
  return sourceStages.some((stage) => stage === sceneId);
}

function buildWizardProductionVisualScenes(
  rec: WizardGeneratedTopicRecord,
  baseScript: WizardScriptPreview,
  scenes: WizardScriptScene[],
): WizardScriptScene[] {
  if (!rec.financeSubtopic) return scenes;
  const financeSubtopic = rec.financeSubtopic;
  const editorialLane = rec.editorialLane ?? inferFinanceEditorialLane(baseScript.title, rec.angle);
  const dna = buildWizardVisualDna({
    title: baseScript.title,
    hook: baseScript.hook,
    visualMetaphor: rec.visualMetaphor,
    moneyAnchor: rec.moneyAnchor,
    psychologyAnchor: rec.psychologyAnchor,
    successAnchor: rec.successAnchor,
  });
  const counts = new Map<WizardScriptScene["id"], number>();
  for (const scene of scenes) counts.set(scene.id, (counts.get(scene.id) ?? 0) + 1);
  const seen = new Map<WizardScriptScene["id"], number>();
  const rebuilt = scenes.map((scene, index) => {
    const partIndex = seen.get(scene.id) ?? 0;
    seen.set(scene.id, partIndex + 1);
    const partCount = counts.get(scene.id) ?? 1;
    const visualEvidence = buildFinanceVisualEvidence({
      title: baseScript.title,
      narration: scene.narration,
      stage: scene.id,
      financeSubtopic,
      editorialLane,
      partIndex,
      partCount,
      problemStatement: rec.problemStatement,
      twist: rec.twist,
      takeawayAction: rec.takeawayAction,
    });
    return {
      ...scene,
      label: `${index + 1}. ${scene.label.replace(/^\d+\.\s*/u, "")}`,
      captionText: trimWizardCaption(scene.narration),
      visualCue: buildEditorialVisualCue(
        scene.id,
        `production ${scene.label}; exact narration event and adjacent-scene difference are mandatory`,
        scene.narration,
        dna,
        visualEvidence,
      ),
      visualEvidence,
    };
  });
  const evidence = rebuilt.map((scene) => scene.visualEvidence).filter((item): item is FinanceVisualEvidence => item != null);
  if (evidence.length !== rebuilt.length || !financeVisualSequencePass(evidence)) {
    throw new Error("production_visual_sequence_invalid");
  }
  return rebuilt;
}

/**
 * 확정 대본을 실제 제작용 단편 또는 의미 기반 1·2편으로 파생한다.
 * duration을 보지 않으며, 공통 엔진이 확정한 sourceStages만 사용한다.
 */
export function buildWizardProductionScriptParts(
  rec: WizardGeneratedTopicRecord,
  baseScript: WizardScriptPreview,
): WizardProductionScriptPart[] {
  const strategy = baseScript.videoStrategy;
  if (!strategy || strategy.contractVersion !== FINANCE_EDITORIAL_VIDEO_STRATEGY_VERSION) {
    return [{
      id: "single",
      partNumber: 1,
      totalParts: 1,
      canonicalTitle: baseScript.title,
      platformTitle: baseScript.title,
      coverLines: [],
      coverHookAudit: null,
      script: baseScript,
    }];
  }

  return strategy.parts.map((part) => {
    const coverNarration = part.coverLines.map((line) => line.spokenText).join("\n");
    const selected = baseScript.scenes.filter((scene) => productionSceneMatchesStages(scene.id, part.sourceStages));
    const rawScenes: WizardScriptScene[] = [
      {
        id: "hook",
        label: "사전 훅 썸네일",
        narration: coverNarration,
        captionText: trimWizardCaption(part.coverLines[0]?.spokenText ?? coverNarration),
        visualCue: "",
      },
      ...(part.recapNarration ? [{
        id: "situation" as const,
        label: "1편 핵심 복기",
        narration: part.recapNarration,
        captionText: trimWizardCaption(part.recapNarration),
        visualCue: "",
      }] : []),
      ...selected,
      ...(part.bridgeNarration ? [{
        id: "save" as const,
        label: "2편 연결",
        narration: part.bridgeNarration,
        captionText: trimWizardCaption(part.bridgeNarration),
        visualCue: "",
      }] : []),
    ];
    if (!isSupportedWizardSceneCount(rawScenes.length)) {
      throw new Error(`production_part_scene_count_invalid:${part.id}:${rawScenes.length}`);
    }
    const scenes = applyWizardSceneMediaStrategies(buildWizardProductionVisualScenes(rec, baseScript, rawScenes));
    const fullVoiceover = scenes.map((scene) => scene.narration).join("\n");
    const script: WizardScriptPreview = {
      ...baseScript,
      topicId: part.totalParts === 1 ? baseScript.topicId : `${baseScript.topicId}-${part.id}`,
      title: baseScript.title,
      hook: coverNarration,
      hookLine: part.coverLines[0]?.spokenText ?? baseScript.hookLine,
      curiosity: scenes.find((scene) => scene.id === "situation")?.narration ?? baseScript.curiosity,
      action: [...scenes].reverse().find((scene) => scene.id === "habit" || scene.id === "save")?.narration ?? baseScript.action,
      captionLines: scenes.map((scene) => scene.captionText),
      fullVoiceover,
      scenes,
      captionFirstLineHook: part.coverLines[0]?.spokenText ?? baseScript.captionFirstLineHook,
      uploadCaptionDraft: `${part.title}\n\n${fullVoiceover}`,
    };
    return {
      id: part.id,
      partNumber: part.partNumber,
      totalParts: part.totalParts,
      canonicalTitle: baseScript.title,
      platformTitle: part.title,
      coverLines: part.coverLines,
      coverHookAudit: part.coverHookAudit,
      script,
    };
  });
}

export type WizardRealPipelinePartPaths = {
  id: "single" | "part-1" | "part-2";
  partNumber: 1 | 2;
  totalParts: 1 | 2;
  canonicalTitle: string;
  platformTitle: string;
  expectedSceneCount: number;
  topicId: string;
  safeSlug: string;
  scriptFinalPath: string;
  realTtsScriptPath: string;
  ttsOutDir: string;
  ttsSummaryPath: string;
  imagesOutDir: string;
  flowMotionDir: string;
  videoOutDir: string;
};

export type WizardRealPipelinePaths = WizardRealPipelinePartPaths & {
  strategyVersion: typeof FINANCE_EDITORIAL_VIDEO_STRATEGY_VERSION | null;
  mode: "single" | "two_part";
  manifestPath: string | null;
  parts: WizardRealPipelinePartPaths[];
};

type WizardProductionPipelinePart = WizardRealPipelinePartPaths & {
  record: WizardFinalScriptRecord;
  coverLines: FinanceEditorialCoverLine[];
  coverHookAudit: FinanceEditorialCoverHookAudit | null;
};

function toWizardRealPipelinePartPaths(part: WizardProductionPipelinePart): WizardRealPipelinePartPaths {
  return {
    id: part.id,
    partNumber: part.partNumber,
    totalParts: part.totalParts,
    canonicalTitle: part.canonicalTitle,
    platformTitle: part.platformTitle,
    expectedSceneCount: part.expectedSceneCount,
    topicId: part.topicId,
    safeSlug: part.safeSlug,
    scriptFinalPath: part.scriptFinalPath,
    realTtsScriptPath: part.realTtsScriptPath,
    ttsOutDir: part.ttsOutDir,
    ttsSummaryPath: part.ttsSummaryPath,
    imagesOutDir: part.imagesOutDir,
    flowMotionDir: part.flowMotionDir,
    videoOutDir: part.videoOutDir,
  };
}

function buildWizardRealTtsScript(
  rootTopicId: string,
  part: WizardProductionPipelinePart,
  sampleReview: boolean,
): Record<string, unknown> {
  const financeVoiceRoute = resolveWizardFinanceCharacterVoice(rootTopicId);
  if (financeVoiceRoute && !financeVoiceRoute.ok) throw new Error(financeVoiceRoute.reason);
  const script = part.record.script;
  const narrations = script.scenes.map((scene) => String(scene.narration ?? "").trim() || String(scene.captionText ?? "").trim());
  if (narrations.some((narration) => narration.length < 4)) throw new Error("script_scenes_invalid");
  const timeline = buildWizardSceneTimeline(narrations);
  const baseProfile = buildWizardTopicSpeechProfile(script.title, script.fullVoiceover, { topicId: rootTopicId });
  const speedCap = script.videoStrategy?.openingVoice.speedCap;
  const voicePhaseContract = financeVoiceRoute?.route.voice.deliveryPhases ?? null;
  const castSettings = financeVoiceRoute?.route.voice.settings;
  const topicSpeechProfile: WizardTopicSpeechProfile = {
    ...baseProfile,
    baseSpeed: voicePhaseContract?.body.speed ?? (typeof speedCap === "number" ? Math.min(baseProfile.baseSpeed, speedCap) : baseProfile.baseSpeed),
    baseStability: voicePhaseContract && castSettings ? castSettings.stability : baseProfile.baseStability,
    baseSimilarityBoost: voicePhaseContract && castSettings ? castSettings.similarityBoost : baseProfile.baseSimilarityBoost,
    baseStyle: voicePhaseContract && castSettings ? castSettings.style : baseProfile.baseStyle,
  };
  const hasStagedCover = part.coverLines.length === 3;
  const storedCoverHookAudit = part.coverHookAudit;
  const coverHookAuditCurrent =
    !hasStagedCover ||
    (storedCoverHookAudit?.contractVersion === FINANCE_EDITORIAL_COVER_HOOK_CONTRACT_VERSION &&
      financeEditorialCoverHookAuditMatches(storedCoverHookAudit, part.coverLines));
  if (!coverHookAuditCurrent) throw new Error("finance_cover_hook_audit_failed");
  const directedScenes = script.scenes.map((scene, index) => buildWizardSpeechDirection(
    { id: scene.id, narration: narrations[index] },
    { topicProfile: topicSpeechProfile, sceneIndex: index, sceneCount: script.scenes.length, sampleReview },
  ));
  const bodyLeadDirection = directedScenes[1];
  if (voicePhaseContract && !bodyLeadDirection) throw new Error("minjae_body_lead_direction_missing");
  return {
    schemaVersion: "money_shorts_tts_script_v1",
    scriptId: `tts-script-wizard-${part.safeSlug}-${part.id}-elevenlabs`,
    manifestId: `rp-wizard-${part.safeSlug}-${part.id}`,
    factCardId: `fact-card-wizard-${part.safeSlug}`,
    ttsProvider: "elevenlabs",
    ttsMode: "elevenlabs_korean_director_continuous",
    ttsEngineVersion: WIZARD_TTS_ENGINE_VERSION,
    modelId: financeVoiceRoute?.route ? FINANCE_CHARACTER_VOICE_MODEL_ID : "eleven_v3",
    timingPolicy: "character_aligned_continuous_v2",
    prosodyPolicy: "korean_native_cadence_v2",
    voicePreset: financeVoiceRoute?.route ? FINANCE_CHARACTER_VOICE_PRODUCTION_PRESET : "korean_confident_director_v2",
    voiceProfile: financeVoiceRoute?.route
      ? `finance_character_${financeVoiceRoute.route.characterId}`
      : "elevenlabs_fixed_voice",
    language: "ko",
    targetDurationSec: timeline.totalDurationSec,
    wizardTopicId: rootTopicId,
    wizardProductionPartId: part.id,
    wizardTopicTitle: part.canonicalTitle,
    wizardPlatformTitle: part.platformTitle,
    wizardScriptFingerprint: part.record.localFingerprint,
    videoStrategyContractVersion: script.videoStrategy?.contractVersion ?? null,
    openingVoiceContract: voicePhaseContract ? {
      v3AudioTagPolicy: voicePhaseContract.opening.v3AudioTagPolicy,
      speedCap: voicePhaseContract.opening.speed,
      stance: voicePhaseContract.opening.intent,
    } : script.videoStrategy?.openingVoice ?? null,
    topicSpeechProfile,
    voicePhaseContract,
    coverContract: hasStagedCover ? {
      enabled: true,
      contractVersion: WIZARD_STAGED_COVER_CONTRACT_VERSION,
      sceneNumber: 1,
      spokenText: part.coverLines.map((line) => line.spokenText).join("\n"),
      displayText: part.coverLines.map((line) => line.displayText).join("\n"),
      lines: part.coverLines,
      visualOnlyPunctuation: true,
      hookAudit: storedCoverHookAudit,
    } : null,
    captionContract: {
      enabled: true,
      contractVersion: WIZARD_FULL_SCRIPT_CAPTION_CONTRACT_VERSION,
      rolloutScope: hasStagedCover ? "all_finance_topics_with_staged_cover" : "all_topics",
      mode: "full_script_dynamic_semantic_aligned",
      textCoverageRatio: 1,
      safePositions: 6,
      fullScriptRequired: true,
      timingSource: "elevenlabs_character_alignment",
    },
    sampleReviewMode: sampleReview ? {
      enabled: true,
      contractVersion: WIZARD_AV_SAMPLE_REVIEW_CONTRACT_VERSION,
      topicId: rootTopicId,
      rolloutScope: "single_topic_only",
      voiceContract: {
        speed: 0.91,
        phrasePauseMs: [420, 500],
        scenePauseTag: "continues after a beat",
        acceptedDurationRatio: [0.95, 1.08],
      },
      captionContract: {
        mode: "full_script_dynamic_semantic_aligned",
        textCoverageRatio: 1,
        safePositions: 6,
        fullScriptRequired: true,
      },
    } : null,
    scriptMode: part.record.mode,
    riskNotes: [
      "Real ElevenLabs input generated from a confirmed production-part script.",
      "Each part is generated in one continuous call so Korean cadence and speaker identity do not reset at every scene.",
      "Character alignment becomes the final video scene and staged-cover timing source.",
      "Display-only punctuation is never included in spokenText.",
      ...(voicePhaseContract ? ["Minjae copies the first body scene's provider-facing delivery tag onto the staged opening, suppresses a repeated boundary tag, and isolates only the decisive closing segment."] : []),
      "No secret values are stored in this file.",
    ],
    scenes: script.scenes.map((scene, index) => {
      const directed = directedScenes[index];
      const speechDirection = voicePhaseContract && index === 0
        ? {
            ...directed,
            delivery: bodyLeadDirection.delivery,
            intent: bodyLeadDirection.intent,
            pace: bodyLeadDirection.pace,
            intensity: bodyLeadDirection.intensity,
            contextPolicy: bodyLeadDirection.contextPolicy,
            v3AudioTag: bodyLeadDirection.v3AudioTag,
            topicProfileId: bodyLeadDirection.topicProfileId,
            voiceTuning: { ...bodyLeadDirection.voiceTuning },
          }
        : voicePhaseContract && index === script.scenes.length - 1
          ? {
              ...directed,
              delivery: "calm_close" as const,
              intent: voicePhaseContract.closing.intent,
              pace: "natural" as const,
              intensity: 0.8,
              v3AudioTag: voicePhaseContract.closing.v3AudioTag,
            }
          : hasStagedCover && index === 0
        ? {
            ...directed,
            intent: script.videoStrategy?.openingVoice.stance ?? directed.intent,
            pace: "natural" as const,
            v3AudioTag: "confidently",
            voiceTuning: { ...directed.voiceTuning, speedDelta: Math.min(0, directed.voiceTuning.speedDelta) },
          }
        : directed;
      return {
        sceneNumber: index + 1,
        sceneRole: scene.id,
        durationSec: timeline.durations[index],
        startSec: timeline.starts[index],
        endSec: timeline.starts[index] + timeline.durations[index],
        ttsText: speechDirection.performanceText,
        narration: narrations[index],
        captionText: String(scene.captionText ?? "").trim(),
        sampleReviewCaptionCues: sampleReview ? buildWizardSampleReviewCaptionCues(index + 1) : [],
        mediaStrategy: scene.mediaStrategy,
        mediaStrategyContractVersion: scene.mediaStrategyContractVersion,
        mediaStrategySource: scene.mediaStrategySource,
        mediaStrategyScore: scene.mediaStrategyScore,
        mediaStrategyReasonCodes: scene.mediaStrategyReasonCodes,
        mediaStrategyMaxVeoScenes: scene.mediaStrategyMaxVeoScenes,
        mediaStrategyTotalDurationSec: scene.mediaStrategyTotalDurationSec,
        speechDirection,
      };
    }),
  };
}

function buildWizardRealTtsContractSnapshot(
  rootTopicId: string,
  part: WizardProductionPipelinePart,
  sampleReview: boolean,
): { script: Record<string, unknown>; json: string; fingerprint: string; sha256: string } {
  const script = buildWizardRealTtsScript(rootTopicId, part, sampleReview);
  const json = JSON.stringify(script, null, 2);
  const sha256 = createHash("sha256").update(json).digest("hex");
  return { script, json, fingerprint: sha256.slice(0, 12), sha256 };
}

function resolveWizardProductionPipelineParts(
  topicId: string,
  safeSlug: string,
  record: WizardFinalScriptRecord,
): WizardProductionPipelinePart[] {
  const generated = readWizardGeneratedTopic(topicId);
  const strategy = record.script.videoStrategy;
  if (!generated || !strategy || strategy.contractVersion !== FINANCE_EDITORIAL_VIDEO_STRATEGY_VERSION) {
    const realRoot = join(WIZARD_VIDEO_OUT_ROOT, safeSlug, "real");
    const visualProfile = wizardVisualProfileForTopic(topicId);
    return [{
      id: "single",
      partNumber: 1,
      totalParts: 1,
      canonicalTitle: record.script.title,
      platformTitle: record.script.title,
      expectedSceneCount: record.script.scenes.length,
      topicId,
      safeSlug,
      scriptFinalPath: wizardFinalScriptPath(safeSlug),
      realTtsScriptPath: "",
      ttsOutDir: join(realRoot, WIZARD_TTS_OUTPUT_DIR),
      ttsSummaryPath: join(realRoot, WIZARD_TTS_OUTPUT_DIR, "elevenlabs-scene-paced-tts-summary.json"),
      imagesOutDir: join(realRoot, visualProfile.imagesDir),
      flowMotionDir: join(realRoot, "flow-motion-v1"),
      videoOutDir: join(realRoot, visualProfile.videoDir),
      record,
      coverLines: [],
      coverHookAudit: null,
    }];
  }

  return buildWizardProductionScriptParts(generated, record.script).map((part) => {
    const partTopicId = part.totalParts === 1 ? topicId : `${topicId}-${part.id}`;
    const partSafeSlug = toSafeTopicSlug(partTopicId) ?? safeSlug;
    const inputDir = join(WIZARD_INPUTS_ROOT, safeSlug, "production", strategy.contractVersion, part.id);
    const realRoot = join(WIZARD_VIDEO_OUT_ROOT, safeSlug, "real", strategy.contractVersion, part.id);
    const visualProfile = wizardVisualProfileForTopic(topicId);
    const partFingerprint = createHash("sha1").update(JSON.stringify({
      engine: WIZARD_SCRIPT_ENGINE_VERSION,
      strategy: strategy.contractVersion,
      source: record.localFingerprint,
      part: part.id,
      voiceover: part.script.fullVoiceover,
    })).digest("hex");
    const partRecord: WizardFinalScriptRecord = {
      ...record,
      topicId: partTopicId,
      localFingerprint: partFingerprint,
      script: part.script,
      production: {
        contractVersion: strategy.contractVersion,
        rootTopicId: topicId,
        partId: part.id,
        partNumber: part.partNumber,
        totalParts: part.totalParts,
        canonicalTitle: part.canonicalTitle,
        platformTitle: part.platformTitle,
      },
    };
    return {
      id: part.id,
      partNumber: part.partNumber,
      totalParts: part.totalParts,
      canonicalTitle: part.canonicalTitle,
      platformTitle: part.platformTitle,
      expectedSceneCount: part.script.scenes.length,
      topicId: partTopicId,
      safeSlug: partSafeSlug,
      scriptFinalPath: join(inputDir, "script-final.json"),
      realTtsScriptPath: "",
      ttsOutDir: join(realRoot, WIZARD_TTS_OUTPUT_DIR),
      ttsSummaryPath: join(realRoot, WIZARD_TTS_OUTPUT_DIR, "elevenlabs-scene-paced-tts-summary.json"),
      imagesOutDir: join(realRoot, visualProfile.imagesDir),
      flowMotionDir: join(realRoot, "flow-motion-v1"),
      videoOutDir: join(realRoot, visualProfile.videoDir),
      record: partRecord,
      coverLines: part.coverLines,
      coverHookAudit: part.coverHookAudit,
    };
  });
}

/**
 * 확정 대본 문구는 건드리지 않고 실제 제작 예상 단편이 60초를 넘을 때만 분리 전략을
 * 다시 평가한다. 시간만으로 자르지 않으며 공통 편집 엔진의 핵심 의미 게이트를 통과한
 * 경우에만 기존 진단→브리지 / 복기→행동 경계를 사용한다.
 */
function resolveWizardDurationSafeProductionRecord(
  topicId: string,
  record: WizardFinalScriptRecord,
): WizardFinalScriptRecord {
  const generated = readWizardGeneratedTopic(topicId);
  const editorialTopic = generated ? resolveFinanceEditorialTopic(generated) : null;
  const strategy = record.script.videoStrategy;
  if (!generated || !editorialTopic || !strategy || strategy.mode !== "single") return record;

  const [singlePart] = buildWizardProductionScriptParts(generated, record.script);
  if (!singlePart || singlePart.totalParts !== 1) return record;
  const singleTargetDurationSec = buildWizardSceneTimeline(
    singlePart.script.scenes.map((scene) => String(scene.narration ?? "").trim()),
  ).totalDurationSec;
  if (singleTargetDurationSec <= 60) return record;

  const editorialParts = buildFinanceEditorialScriptParts(editorialTopic);
  const repairedStrategy = buildFinanceEditorialVideoStrategy(editorialTopic, editorialParts, {
    singleTargetDurationSec,
  });
  if (repairedStrategy.mode !== "two_part" || repairedStrategy.durationRepair?.applied !== true) return record;

  const script: WizardScriptPreview = { ...record.script, videoStrategy: repairedStrategy };
  return {
    ...record,
    localFingerprint: wizardScriptFingerprint(script),
    script,
  };
}

/**
 * 확정 본문과 시각 증거는 그대로 보존하고, 구형 첫 화면 후킹 계약과 비어 있는
 * still/Veo 자동선정 계약만 현재 결정론적 계약으로 갱신한다. Claude/브라우저/API 호출은
 * 없으며 다른 형태의 stale 대본은 수정하지 않고 그대로 fail-closed한다.
 */
function refreshWizardFinalScriptMediaContract(topicId: string): boolean {
  const safeSlug = toSafeTopicSlug(topicId);
  if (!safeSlug) return false;
  const raw = readAbsJson(wizardFinalScriptPath(safeSlug)) as WizardFinalScriptRecord | null;
  if (!raw || raw.schemaVersion !== "wizard_script_final_v1" || raw.topicId !== topicId) return false;
  if (!raw.script || raw.script.videoStrategy?.contractVersion !== FINANCE_EDITORIAL_VIDEO_STRATEGY_VERSION) return false;
  if (!Array.isArray(raw.script.scenes) || raw.script.scenes.length === 0) return false;
  if (raw.script.scenes.some((scene) =>
    scene.visualEvidence?.version !== FINANCE_VISUAL_EVIDENCE_VERSION ||
    typeof scene.visualEvidence?.sceneIntegrationPlan !== "string" ||
    scene.visualEvidence.sceneIntegrationPlan.length < 40 ||
    typeof scene.visualEvidence?.motionPlan !== "string" ||
    scene.visualEvidence.motionPlan.length < 40
  )) return false;
  if (!getWizardScriptQualityGate(topicId, raw.script).passed) return false;

  let videoStrategy = raw.script.videoStrategy;
  let coverHookRefreshed = false;
  if (!financeEditorialVideoStrategyCoverHooksPass(videoStrategy)) {
    const generated = readWizardGeneratedTopic(topicId);
    const editorialTopic = generated ? resolveFinanceEditorialTopic(generated) : null;
    if (!editorialTopic) return false;
    const editorialParts = buildFinanceEditorialScriptParts(editorialTopic);
    const refreshedStrategy = buildFinanceEditorialVideoStrategy(editorialTopic, editorialParts, {
      singleTargetDurationSec: videoStrategy.durationRepair?.sourceTargetDurationSec,
    });
    if (refreshedStrategy.mode !== videoStrategy.mode) return false;
    videoStrategy = refreshedStrategy;
    coverHookRefreshed = true;
  }

  const mediaContractCurrent = wizardSceneMediaStrategiesAreValid(raw.script.scenes);
  if (!coverHookRefreshed && mediaContractCurrent) return true;

  let scenes: WizardScriptScene[];
  try {
    scenes = mediaContractCurrent ? raw.script.scenes : applyWizardSceneMediaStrategies(raw.script.scenes);
  } catch {
    return false;
  }
  if (!wizardSceneMediaStrategiesAreValid(scenes)) return false;
  const script: WizardScriptPreview = { ...raw.script, videoStrategy, scenes };
  if (!getWizardScriptQualityGate(topicId, script).passed) return false;
  const refreshed: WizardFinalScriptRecord = {
    ...raw,
    localFingerprint: wizardScriptFingerprint(script),
    polish: {
      ...raw.polish,
      note: `${raw.polish.note}${coverHookRefreshed ? " · 후킹형 첫 화면 계약 갱신" : ""}${mediaContractCurrent ? "" : " · 로컬 장면 미디어 계약 갱신"}`,
    },
    script,
  };
  try {
    writeFileSync(wizardFinalScriptPath(safeSlug), JSON.stringify(refreshed, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

/**
 * 실제 TTS/이미지/영상 단계의 공통 입력을 만든다.
 * - 확정 대본(script-final.json)이 없으면 fail-closed(대본 만들기 먼저).
 * - 실전용 tts-script의 durationSec은 생성 전 예상치다. 실제 ElevenLabs 음성이 생성되면
 *   TTS summary의 자연 음성 길이가 최종 영상 scene 경계의 단일 소스가 된다.
 */
export function buildWizardRealPipelineInputs(
  topicId: string,
): { ok: true; paths: WizardRealPipelinePaths } | { ok: false; reason: string } {
  const safeSlug = toSafeTopicSlug(topicId);
  if (!safeSlug) return { ok: false, reason: "topic_id_invalid_or_empty" };
  let record = readWizardFinalScriptRecord(topicId);
  if (!record && refreshWizardFinalScriptMediaContract(topicId)) {
    record = readWizardFinalScriptRecord(topicId);
  }
  if (!record) return { ok: false, reason: "script_final_missing" };
  record = resolveWizardDurationSafeProductionRecord(topicId, record);
  if (!Array.isArray(record.script.scenes) || !isSupportedWizardSceneCount(record.script.scenes.length)) {
    return { ok: false, reason: "script_scenes_invalid" };
  }
  let productionParts: WizardProductionPipelinePart[];
  const preparedTtsContracts: Array<{
    part: WizardProductionPipelinePart;
    inputDir: string;
    realTtsContract: ReturnType<typeof buildWizardRealTtsContractSnapshot>;
  }> = [];
  try {
    productionParts = resolveWizardProductionPipelineParts(topicId, safeSlug, record);
    for (const part of productionParts) {
      if (!isSupportedWizardSceneCount(part.expectedSceneCount)) throw new Error("script_scenes_invalid");
      const isStagedProduction = part.coverLines.length === 3;
      const sampleReview = !isStagedProduction && isWizardAvSampleReviewTopic(topicId);
      const realTtsContract = buildWizardRealTtsContractSnapshot(topicId, part, sampleReview);
      const inputDir = dirname(part.scriptFinalPath);
      part.realTtsScriptPath = join(inputDir, `tts-script.real-${realTtsContract.fingerprint}.json`);
      preparedTtsContracts.push({ part, inputDir, realTtsContract });
    }
  } catch (e) {
    return { ok: false, reason: `input_write_failed:${(e as Error).message}` };
  }
  const durationViolation = preparedTtsContracts.find(({ realTtsContract }) => {
    const targetDurationSec = Number(realTtsContract.script.targetDurationSec);
    return !Number.isFinite(targetDurationSec) || targetDurationSec < 15 || targetDurationSec > 60;
  });
  if (durationViolation) {
    const durationSec = Number(durationViolation.realTtsContract.script.targetDurationSec);
    return {
      ok: false,
      reason: `tts_duration_contract_violation:${durationViolation.part.id}:${Number.isFinite(durationSec) ? durationSec : "invalid"}`,
    };
  }
  try {
    for (const { part, inputDir, realTtsContract } of preparedTtsContracts) {
      mkdirSync(inputDir, { recursive: true });
      writeFileSync(part.scriptFinalPath, JSON.stringify(part.record, null, 2), "utf8");
      if (!existsSync(part.realTtsScriptPath)) writeFileSync(part.realTtsScriptPath, realTtsContract.json, "utf8");
    }
  } catch (e) {
    return { ok: false, reason: `input_write_failed:${(e as Error).message}` };
  }
  const manifestPath = record.script.videoStrategy
    ? join(WIZARD_INPUTS_ROOT, safeSlug, "production", record.script.videoStrategy.contractVersion, "production-plan.json")
    : null;
  if (manifestPath) {
    try {
      mkdirSync(dirname(manifestPath), { recursive: true });
      writeFileSync(manifestPath, JSON.stringify({
        schemaVersion: "money_shorts_semantic_production_plan_v1",
        strategyVersion: record.script.videoStrategy?.contractVersion,
        rootTopicId: topicId,
        mode: record.script.videoStrategy?.mode,
        parts: productionParts.map(toWizardRealPipelinePartPaths),
        generatedAt: new Date().toISOString(),
      }, null, 2), "utf8");
    } catch (e) {
      return { ok: false, reason: `input_write_failed:${(e as Error).message}` };
    }
  }
  const publicParts = productionParts.map(toWizardRealPipelinePartPaths);
  const first = publicParts[0];
  if (!first) return { ok: false, reason: "production_parts_empty" };
  return {
    ok: true,
    paths: {
      ...first,
      strategyVersion: record.script.videoStrategy?.contractVersion ?? null,
      mode: record.script.videoStrategy?.mode ?? "single",
      manifestPath,
      parts: publicParts,
    },
  };
}

export type WizardFlowMotionStatus = {
  state: "not_prepared" | "not_required" | FlowMotionJobStatus;
  requiredCount: number;
  preparedCount: number;
  approvalPendingCount: number;
  generatingCount: number;
  qaPendingCount: number;
  qaPassCount: number;
  qaFailedCount: number;
  renderReadyCount: number;
  readyForRender: boolean;
  parts: Array<{
    id: "single" | "part-1" | "part-2";
    partNumber: 1 | 2;
    totalParts: 1 | 2;
    requiredCount: number;
      statePath: string;
    state: "not_prepared" | "not_required" | FlowMotionJobStatus;
    jobs: Array<Pick<FlowMotionJob,
      "jobId" | "sceneNumber" | "sceneId" | "sceneLabel" | "status" | "packetPath" |
      "expectedVideoPath" | "referenceSha256" | "promptSha256"
    > & {
      requiredApprovalWording: string;
      outputVideoSha256: string | null;
      execution: FlowMotionJob["execution"];
      creditUsageStatus: "confirmed_zero" | "confirmed_spent" | "unknown";
      renderAssetReady: boolean;
    }>;
  }>;
};

type FlowMotionGenerationSummarySnapshot = {
  status?: unknown;
  selectedProfile?: unknown;
  submissionCount?: unknown;
  expectedCreditsSpent?: unknown;
  approvalClickAttemptCount?: unknown;
  approvalClickIntent?: { clickIntentArmed?: unknown } | null;
  submitEvidence?: { clickDispatched?: unknown } | null;
};

function flowMotionApprovalClickRequiresManualReview(
  summary: FlowMotionGenerationSummarySnapshot | null,
  summaryFileExists = false,
): boolean {
  if (summaryFileExists && summary === null) return true;
  if (!summary) return false;
  if (typeof summary !== "object" || Array.isArray(summary)) return true;
  if (typeof summary.status !== "string" || summary.status.length === 0) return true;
  const submissionCountValid = Number.isInteger(summary.submissionCount) && [0, 1].includes(summary.submissionCount as number);
  const attemptMissing = summary.approvalClickAttemptCount === undefined;
  const attemptCount = attemptMissing
    ? (summary.submissionCount === 1 ? 1 : 0)
    : summary.approvalClickAttemptCount;
  const attemptCountValid = Number.isInteger(attemptCount) && [0, 1].includes(attemptCount as number);
  if (!submissionCountValid || !attemptCountValid) return true;
  if (summary.status === "APPROVAL_CLICK_OUTCOME_UNKNOWN") return true;
  if ((attemptCount as number) > 0 && summary.submissionCount === 0) return true;
  if (summary.submitEvidence?.clickDispatched === true && summary.submissionCount !== 1) return true;
  if (summary.approvalClickIntent?.clickIntentArmed === true && attemptCount !== 1) return true;
  if (["SUBMITTED_PENDING_RESULT", "SUBMITTED_RESULT_RECOVERY_REQUIRED"].includes(String(summary.status)) && summary.submissionCount !== 1) return true;
  return false;
}

function flowMotionCreditUsageStatus(
  summary: FlowMotionGenerationSummarySnapshot | null,
  execution: FlowMotionJob["execution"],
  summaryFileExists = false,
): "confirmed_zero" | "confirmed_spent" | "unknown" {
  if (flowMotionApprovalClickRequiresManualReview(summary, summaryFileExists)) return "unknown";
  return summary?.submissionCount === 1 || execution.submissionCount === 1
    ? "confirmed_spent"
    : "confirmed_zero";
}

function flowMotionStatePath(part: Pick<WizardRealPipelinePartPaths, "flowMotionDir">): string {
  return join(part.flowMotionDir, "flow-motion-state.json");
}

function resolveWizardFlowMotionParts(topicId: string): WizardProductionPipelinePart[] | null {
  const safeSlug = toSafeTopicSlug(topicId);
  const record = safeSlug ? readWizardFinalScriptRecord(topicId) : null;
  if (!safeSlug || !record) return null;
  try {
    return resolveWizardProductionPipelineParts(topicId, safeSlug, record);
  } catch {
    return null;
  }
}

type ResolvedWizardFlowMotionJob = {
  part: WizardProductionPipelinePart;
  state: FlowMotionState;
  job: FlowMotionJob;
};

function resolveWizardFlowMotionJob(
  topicId: string,
  jobId: string,
): { ok: true } & ResolvedWizardFlowMotionJob | { ok: false; reason: string } {
  if (!jobId || !/^[a-zA-Z0-9._-]+$/.test(jobId)) return { ok: false, reason: "flow_motion_job_id_invalid" };
  const parts = resolveWizardFlowMotionParts(topicId);
  if (!parts) return { ok: false, reason: "flow_motion_topic_invalid" };
  for (const part of parts) {
    const candidate = readAbsJson(flowMotionStatePath(part));
    if (!flowMotionStateIsValid(candidate) ||
      candidate.topicId !== topicId ||
      candidate.productionPartId !== part.id ||
      candidate.scriptFingerprint !== part.record.localFingerprint) continue;
    const job = candidate.jobs.find((row) => row.jobId === jobId);
    if (job) return { ok: true, part, state: candidate, job };
  }
  return { ok: false, reason: "flow_motion_job_not_found" };
}

function writeWizardFlowMotionStateAtomic(state: FlowMotionState): void {
  if (!flowMotionStateIsValid(state)) throw new Error("flow_motion_state_invalid_before_write");
  const statePath = resolve(state.statePath);
  if (!statePath.startsWith(WIZARD_VIDEO_ALLOWED_PREFIX) || !statePath.toLowerCase().endsWith("flow-motion-state.json")) {
    throw new Error("flow_motion_state_path_forbidden");
  }
  mkdirSync(dirname(statePath), { recursive: true });
  const stateTempPath = `${statePath}.${process.pid}.tmp`;
  writeFileSync(stateTempPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  const packetTemps: Array<{ tempPath: string; packetPath: string }> = [];
  for (const job of state.jobs) {
    const packetPath = resolve(job.packetPath);
    if (!packetPath.startsWith(`${dirname(statePath)}\\`) || dirname(packetPath) !== dirname(resolve(job.expectedVideoPath))) {
      throw new Error("flow_motion_packet_path_forbidden");
    }
    const packetTempPath = `${packetPath}.${process.pid}.tmp`;
    writeFileSync(packetTempPath, `${JSON.stringify({
      schemaVersion: "money_shorts_flow_motion_approval_packet_v1",
      job,
      statePath: state.statePath,
      status: job.status,
      noSubmitBoundary: state.noSubmitBoundary,
    }, null, 2)}\n`, "utf8");
    packetTemps.push({ tempPath: packetTempPath, packetPath });
  }
  // 모든 새 파일이 완전히 써진 뒤 packet을 먼저 교체하고 source-of-truth state를 마지막에 교체한다.
  // 중간 실패 시 새 state가 오래된 packet을 live 실행에 사용하게 되는 경로를 막는다.
  for (const packet of packetTemps) renameSync(packet.tempPath, packet.packetPath);
  renameSync(stateTempPath, statePath);
}

/** 정확한 장면별 승인 문구를 다시 대조한 뒤에만 live runner 실행 직전 상태를 연다. */
export function authorizeWizardFlowMotionGeneration(
  topicId: string,
  jobId: string,
  ownerApproval: string,
): { ok: true; status: WizardFlowMotionStatus } | { ok: false; reason: string } {
  const target = resolveWizardFlowMotionJob(topicId, jobId);
  if (!target.ok) return target;
  if (target.job.status !== "approval_pending" && target.job.status !== "qa_failed") {
    return { ok: false, reason: `flow_motion_job_not_approval_pending:${target.job.status}` };
  }
  const priorSummaryPath = join(dirname(target.job.expectedVideoPath), "generation-summary.json");
  const priorSummaryExists = existsSync(priorSummaryPath);
  const priorSummary = readAbsJson(priorSummaryPath) as FlowMotionGenerationSummarySnapshot | null;
  if (flowMotionApprovalClickRequiresManualReview(priorSummary, priorSummaryExists)) {
    return { ok: false, reason: "flow_motion_prior_approval_click_outcome_requires_manual_review" };
  }
  if (ownerApproval !== target.job.approval.requiredWording) return { ok: false, reason: "flow_motion_owner_approval_text_mismatch" };
  if (!existsSync(target.job.referenceFile)) return { ok: false, reason: "flow_motion_reference_missing" };
  const referenceSha256 = createHash("sha256").update(readFileSync(target.job.referenceFile)).digest("hex");
  if (referenceSha256 !== target.job.referenceSha256) return { ok: false, reason: "flow_motion_reference_hash_changed" };
  try {
    const at = new Date().toISOString();
    let approvalState = target.state;
    if (target.job.status === "qa_failed") {
      if (existsSync(target.job.expectedVideoPath)) {
        const stamp = at.replace(/[:.]/g, "-");
        renameSync(target.job.expectedVideoPath, join(dirname(target.job.expectedVideoPath), `failed-${stamp}.mp4`));
      }
      approvalState = transitionFlowMotionJob(approvalState, jobId, {
        to: "approval_pending",
        at,
        note: "A new exact Owner approval was supplied after the prior failed attempt.",
      });
    } else if (existsSync(target.job.expectedVideoPath)) {
      return { ok: false, reason: "flow_motion_output_exists_manual_review_required" };
    }
    const approvalId = `owner-${createHash("sha256").update(`${ownerApproval}\n${at}`).digest("hex").slice(0, 20)}`;
    writeWizardFlowMotionStateAtomic(transitionFlowMotionJob(approvalState, jobId, {
      to: "generating",
      at,
      ownerApprovalId: approvalId,
      execution: { status: "authorized", selectedProfile: null, submissionCount: 0, expectedCreditsSpent: 0, summaryPath: null },
    }));
    return { ok: true, status: readWizardFlowMotionStatus(topicId) };
  } catch (error) {
    return { ok: false, reason: `flow_motion_authorization_write_failed:${(error as Error).message}` };
  }
}

/** runner가 저장한 MP4 hash를 고정하고 Owner QA 대기 상태로만 이동한다. 기술 검증은 품질 통과가 아니다. */
export function recordWizardFlowMotionGenerationResult(
  topicId: string,
  jobId: string,
): { ok: true; status: WizardFlowMotionStatus } | { ok: false; reason: string } {
  const target = resolveWizardFlowMotionJob(topicId, jobId);
  if (!target.ok) return target;
  if (target.job.status !== "generating") return { ok: false, reason: `flow_motion_job_not_generating:${target.job.status}` };
  if (!existsSync(target.job.expectedVideoPath)) return { ok: false, reason: "flow_motion_generated_video_missing" };
  try {
    const outputVideoSha256 = createHash("sha256").update(readFileSync(target.job.expectedVideoPath)).digest("hex");
    const summaryPath = join(dirname(target.job.expectedVideoPath), "generation-summary.json");
    const summary = readAbsJson(summaryPath) as {
      schemaVersion?: string;
      status?: string;
      jobId?: string;
      selectedProfile?: string;
      submissionCount?: number;
      expectedCreditsSpent?: number;
      outputVideoPath?: string;
      outputVideoSha256?: string;
      probe?: { width?: number; height?: number; durationSec?: number };
    } | null;
    const selectedProfiles = ["Gemini 2", "Gemini 3", "Gemini 4"] as const;
    if (summary?.schemaVersion !== "money_shorts_flow_motion_generation_summary_v1" ||
      summary.status !== "OWNER_QA_REQUIRED" ||
      summary.jobId !== jobId ||
      !selectedProfiles.includes(summary.selectedProfile as (typeof selectedProfiles)[number]) ||
      summary.submissionCount !== 1 ||
      summary.expectedCreditsSpent !== target.job.providerTarget.expectedCreditsPerGeneration ||
      resolve(summary.outputVideoPath ?? "") !== resolve(target.job.expectedVideoPath) ||
      summary.outputVideoSha256 !== outputVideoSha256 ||
      !summary.probe || Number(summary.probe.height) <= Number(summary.probe.width) ||
      Number(summary.probe.durationSec) < 1 || Number(summary.probe.durationSec) > 20) {
      return { ok: false, reason: "flow_motion_generation_summary_invalid" };
    }
    writeWizardFlowMotionStateAtomic(transitionFlowMotionJob(target.state, jobId, {
      to: "qa_pending",
      at: new Date().toISOString(),
      outputVideoSha256,
      note: "Flow runner technical checks passed; Owner visual QA is still required.",
      execution: {
        status: "downloaded",
        selectedProfile: summary.selectedProfile as (typeof selectedProfiles)[number],
        submissionCount: 1,
        expectedCreditsSpent: summary.expectedCreditsSpent,
        summaryPath,
      },
    }));
    return { ok: true, status: readWizardFlowMotionStatus(topicId) };
  } catch (error) {
    return { ok: false, reason: `flow_motion_result_write_failed:${(error as Error).message}` };
  }
}

export function markWizardFlowMotionGenerationFailed(
  topicId: string,
  jobId: string,
  note: string,
): { ok: true; status: WizardFlowMotionStatus } | { ok: false; reason: string } {
  const target = resolveWizardFlowMotionJob(topicId, jobId);
  if (!target.ok) return target;
  if (target.job.status !== "generating" && target.job.status !== "qa_pending") {
    return { ok: false, reason: `flow_motion_job_not_failure_candidate:${target.job.status}` };
  }
  try {
    const summaryPath = join(dirname(target.job.expectedVideoPath), "generation-summary.json");
    const summary = readAbsJson(summaryPath) as FlowMotionGenerationSummarySnapshot | null;
    const selectedProfile = ["Gemini 2", "Gemini 3", "Gemini 4"].includes(String(summary?.selectedProfile ?? ""))
      ? summary?.selectedProfile as "Gemini 2" | "Gemini 3" | "Gemini 4"
      : null;
    const submissionCount = summary?.submissionCount === 1 ? 1 : 0;
    writeWizardFlowMotionStateAtomic(transitionFlowMotionJob(target.state, jobId, {
      to: "qa_failed",
      at: new Date().toISOString(),
      note: String(note || "Flow generation failed").slice(0, 240),
      execution: {
        status: "failed",
        selectedProfile,
        submissionCount,
        expectedCreditsSpent: submissionCount === 1 ? target.job.providerTarget.expectedCreditsPerGeneration : 0,
        summaryPath: existsSync(summaryPath) ? summaryPath : null,
      },
    }));
    return { ok: true, status: readWizardFlowMotionStatus(topicId) };
  } catch (error) {
    return { ok: false, reason: `flow_motion_failure_write_failed:${(error as Error).message}` };
  }
}

export type WizardFlowMotionQaChecks = FlowMotionQaEvidence["checks"];

/** Owner가 영상 자체를 본 뒤 7개 항목을 모두 통과시킨 경우에만 QA evidence와 render_ready를 함께 기록한다. */
export function passWizardFlowMotionOwnerQa(
  topicId: string,
  jobId: string,
  checks: Partial<Record<keyof WizardFlowMotionQaChecks, unknown>>,
): { ok: true; status: WizardFlowMotionStatus } | { ok: false; reason: string } {
  const target = resolveWizardFlowMotionJob(topicId, jobId);
  if (!target.ok) return target;
  if (target.job.status !== "qa_pending") return { ok: false, reason: `flow_motion_job_not_qa_pending:${target.job.status}` };
  const requiredChecks = [
    "trueArticulatedMotion",
    "cameraOnlyMotionRejected",
    "identityContinuity",
    "sceneContinuity",
    "brightWarmNonPhotoreal3D",
    "forbiddenDarkFinanceImageryAbsent",
    "technicalArtifactsAbsent",
  ] as const;
  if (requiredChecks.some((key) => checks[key] !== true)) return { ok: false, reason: "flow_motion_owner_qa_checks_incomplete" };
  if (!existsSync(target.job.expectedVideoPath)) return { ok: false, reason: "flow_motion_generated_video_missing" };
  const videoSha256 = createHash("sha256").update(readFileSync(target.job.expectedVideoPath)).digest("hex");
  if (videoSha256 !== target.job.qa.outputVideoSha256) return { ok: false, reason: "flow_motion_generated_video_hash_changed" };
  try {
    const reviewedAt = new Date().toISOString();
    const evidenceId = `owner-qa-${createHash("sha256").update(`${jobId}\n${videoSha256}\n${reviewedAt}`).digest("hex").slice(0, 20)}`;
    const evidence: FlowMotionQaEvidence = {
      schemaVersion: FLOW_MOTION_QA_EVIDENCE_CONTRACT_VERSION,
      evidenceId,
      jobId,
      sceneNumber: target.job.sceneNumber,
      videoSha256,
      verdict: "pass",
      reviewedBy: "owner",
      reviewedAt,
      checks: Object.fromEntries(requiredChecks.map((key) => [key, true])) as WizardFlowMotionQaChecks,
    };
    const evidenceTempPath = `${target.job.qaEvidencePath}.${process.pid}.tmp`;
    writeFileSync(evidenceTempPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    renameSync(evidenceTempPath, target.job.qaEvidencePath);
    const qaPass = transitionFlowMotionJob(target.state, jobId, { to: "qa_pass", at: reviewedAt, qaEvidenceId: evidenceId });
    writeWizardFlowMotionStateAtomic(transitionFlowMotionJob(qaPass, jobId, { to: "render_ready", at: reviewedAt }));
    return { ok: true, status: readWizardFlowMotionStatus(topicId) };
  } catch (error) {
    return { ok: false, reason: `flow_motion_qa_write_failed:${(error as Error).message}` };
  }
}

/** 실패 후보는 삭제하지 않고 같은 장면 폴더에 보존한 뒤 새 승인을 받을 수 있는 상태로 되돌린다. */
export function failWizardFlowMotionOwnerQa(
  topicId: string,
  jobId: string,
  note: string,
): { ok: true; status: WizardFlowMotionStatus } | { ok: false; reason: string } {
  const failed = markWizardFlowMotionGenerationFailed(topicId, jobId, note || "Owner visual QA failed");
  if (!failed.ok) return failed;
  const target = resolveWizardFlowMotionJob(topicId, jobId);
  if (!target.ok) return target;
  try {
    if (existsSync(target.job.expectedVideoPath)) {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      renameSync(target.job.expectedVideoPath, join(dirname(target.job.expectedVideoPath), `rejected-${stamp}.mp4`));
    }
    writeWizardFlowMotionStateAtomic(transitionFlowMotionJob(target.state, jobId, {
      to: "approval_pending",
      at: new Date().toISOString(),
      note: String(note || "Owner visual QA failed; a new explicit approval is required.").slice(0, 240),
    }));
    return { ok: true, status: readWizardFlowMotionStatus(topicId) };
  } catch (error) {
    return { ok: false, reason: `flow_motion_qa_reject_write_failed:${(error as Error).message}` };
  }
}

function flowMotionRenderAssetIsReady(job: FlowMotionJob): boolean {
  const jobDir = dirname(resolve(job.packetPath));
  const videoPath = resolve(job.expectedVideoPath);
  const evidencePath = resolve(job.qaEvidencePath);
  const referencePath = resolve(job.referenceFile);
  if (
    job.status !== "render_ready" ||
    !videoPath.startsWith(WIZARD_VIDEO_ALLOWED_PREFIX) ||
    !evidencePath.startsWith(WIZARD_VIDEO_ALLOWED_PREFIX) ||
    !referencePath.startsWith(WIZARD_VIDEO_ALLOWED_PREFIX) ||
    dirname(videoPath) !== jobDir ||
    dirname(evidencePath) !== jobDir ||
    !existsSync(videoPath) ||
    !existsSync(evidencePath) ||
    !existsSync(referencePath)
  ) return false;
  try {
    const referenceSha256 = createHash("sha256").update(readFileSync(referencePath)).digest("hex");
    if (referenceSha256 !== job.referenceSha256) return false;
    const videoSha256 = createHash("sha256").update(readFileSync(videoPath)).digest("hex");
    if (videoSha256 !== job.qa.outputVideoSha256) return false;
    const evidence = readAbsJson(evidencePath) as FlowMotionQaEvidence | null;
    return evidence?.schemaVersion === FLOW_MOTION_QA_EVIDENCE_CONTRACT_VERSION &&
      evidence.evidenceId === job.qa.evidenceId &&
      evidence.jobId === job.jobId &&
      evidence.sceneNumber === job.sceneNumber &&
      evidence.videoSha256 === videoSha256 &&
      evidence.verdict === "pass" &&
      evidence.reviewedBy === "owner" &&
      evidence.checks.trueArticulatedMotion === true &&
      evidence.checks.cameraOnlyMotionRejected === true &&
      evidence.checks.identityContinuity === true &&
      evidence.checks.sceneContinuity === true &&
      evidence.checks.brightWarmNonPhotoreal3D === true &&
      evidence.checks.forbiddenDarkFinanceImageryAbsent === true &&
      evidence.checks.technicalArtifactsAbsent === true;
  } catch {
    return false;
  }
}

/** Flow 상태 조회는 로컬 JSON만 읽으며 브라우저·업로드·생성 전송을 수행하지 않는다. */
export function readWizardFlowMotionStatus(topicId: string): WizardFlowMotionStatus {
  const parts = resolveWizardFlowMotionParts(topicId) ?? [];
  const partRows = parts.map((part): WizardFlowMotionStatus["parts"][number] => {
    const requiredCount = part.record.script.scenes.filter((scene) => scene.mediaStrategy === "veo_motion").length;
    const statePath = flowMotionStatePath(part);
    const candidate = readAbsJson(statePath);
    const state = flowMotionStateIsValid(candidate) &&
      candidate.schemaVersion === FLOW_MOTION_STATE_CONTRACT_VERSION &&
      candidate.topicId === topicId &&
      candidate.productionPartId === part.id &&
      candidate.scriptFingerprint === part.record.localFingerprint
      ? candidate
      : null;
    const publicJobs = (state?.jobs ?? []).map((job) => {
      const summaryPath = join(dirname(job.expectedVideoPath), "generation-summary.json");
      const summaryFileExists = existsSync(summaryPath);
      const summary = readAbsJson(summaryPath) as FlowMotionGenerationSummarySnapshot | null;
      return {
        jobId: job.jobId,
        sceneNumber: job.sceneNumber,
        sceneId: job.sceneId,
        sceneLabel: job.sceneLabel,
        status: job.status,
        packetPath: job.packetPath,
        expectedVideoPath: job.expectedVideoPath,
        referenceSha256: job.referenceSha256,
        promptSha256: job.promptSha256,
        requiredApprovalWording: job.approval.requiredWording,
        outputVideoSha256: job.qa.outputVideoSha256,
        execution: job.execution,
        creditUsageStatus: flowMotionCreditUsageStatus(summary, job.execution, summaryFileExists),
        renderAssetReady: flowMotionRenderAssetIsReady(job),
      };
    });
    return {
      id: part.id,
      partNumber: part.partNumber,
      totalParts: part.totalParts,
      requiredCount,
      statePath,
      state: requiredCount === 0
        ? "not_required"
        : state?.overallStatus === "render_ready" && publicJobs.some((job) => !job.renderAssetReady)
          ? "qa_failed"
          : (state?.overallStatus ?? "not_prepared"),
      jobs: publicJobs,
    };
  });
  const jobs = partRows.flatMap((part) => part.jobs);
  const requiredCount = partRows.reduce((sum, part) => sum + part.requiredCount, 0);
  const count = (status: FlowMotionJobStatus): number => jobs.filter((job) => job.status === status).length;
  const preparedCount = jobs.length;
  const renderReadyCount = jobs.filter((job) => job.status === "render_ready" && job.renderAssetReady).length;
  const state: WizardFlowMotionStatus["state"] = requiredCount === 0
    ? "not_required"
    : partRows.some((part) => part.state === "not_prepared")
      ? "not_prepared"
      : partRows.some((part) => part.state === "qa_failed")
        ? "qa_failed"
        : partRows.some((part) => part.state === "generating")
          ? "generating"
          : partRows.some((part) => part.state === "qa_pending")
            ? "qa_pending"
          : partRows.some((part) => part.state === "qa_pass")
            ? "qa_pass"
            : renderReadyCount === requiredCount
              ? "render_ready"
              : "approval_pending";
  return {
    state,
    requiredCount,
    preparedCount,
    approvalPendingCount: count("approval_pending"),
    generatingCount: count("generating"),
    qaPendingCount: count("qa_pending"),
    qaPassCount: count("qa_pass"),
    qaFailedCount: count("qa_failed"),
    renderReadyCount,
    readyForRender: requiredCount === 0 || renderReadyCount === requiredCount,
    parts: partRows,
  };
}

/**
 * 자동 선정된 장면의 Flow 패킷과 승인 대기 상태를 C:\tmp 아래에만 기록한다.
 * 브라우저 접근·업로드·프롬프트 입력·생성 전송·크레딧 사용은 전혀 하지 않는다.
 */
export function prepareWizardFlowMotionPackets(
  topicId: string,
): { ok: true; status: WizardFlowMotionStatus } | { ok: false; reason: string } {
  const pipeline = buildWizardRealPipelineInputs(topicId);
  if (!pipeline.ok) return pipeline;
  const media = readWizardRealMediaState(topicId);
  if (!media.realTts.qualityAccepted) {
    return { ok: false, reason: "real_tts_owner_approval_required" };
  }
  const generatedAt = new Date().toISOString();
  try {
    for (const part of pipeline.paths.parts) {
      const partMedia = media.parts.find((candidate) => candidate.id === part.id);
      if (!partMedia?.realImages.ready) return { ok: false, reason: `flow_motion_scene_images_required:${part.id}` };
      const record = readAbsJson(part.scriptFinalPath) as WizardFinalScriptRecord | null;
      if (!record || record.schemaVersion !== "wizard_script_final_v1") {
        return { ok: false, reason: `flow_motion_script_final_invalid:${part.id}` };
      }
      const scenes = record.script.scenes.map((scene, index) => {
        const referenceFile = join(part.imagesOutDir, `scene-${String(index + 1).padStart(2, "0")}.png`);
        if (scene.mediaStrategy === "veo_motion" && !existsSync(referenceFile)) {
          throw new Error(`flow_motion_reference_missing:${part.id}:${index + 1}`);
        }
        const referenceSha256 = scene.mediaStrategy === "veo_motion"
          ? createHash("sha256").update(readFileSync(referenceFile)).digest("hex")
          : "0".repeat(64);
        return {
          sceneNumber: index + 1,
          sceneId: scene.id,
          sceneLabel: scene.label,
          narration: scene.narration,
          visualCue: scene.visualCue,
          visibleAction: scene.visualEvidence?.visibleAction,
          motionPlan: scene.visualEvidence?.motionPlan,
          mediaStrategy: scene.mediaStrategy ?? "still",
          mediaStrategyContractVersion: scene.mediaStrategyContractVersion,
          referenceFile,
          referenceSha256,
        };
      });
      const statePath = flowMotionStatePath(part);
      const previousCandidate = readAbsJson(statePath);
      const previous = flowMotionStateIsValid(previousCandidate) ? previousCandidate : null;
      const state = buildFlowMotionState({
        topicId,
        productionPartId: part.id,
        scriptFingerprint: record.localFingerprint,
        outputRoot: part.flowMotionDir,
        scenes,
        generatedAt,
        previous,
      });
      mkdirSync(part.flowMotionDir, { recursive: true });
      for (const job of state.jobs) {
        mkdirSync(dirname(job.packetPath), { recursive: true });
        writeFileSync(job.packetPath, JSON.stringify({
          schemaVersion: "money_shorts_flow_motion_approval_packet_v1",
          job,
          statePath: state.statePath,
          status: job.status,
          noSubmitBoundary: state.noSubmitBoundary,
        }, null, 2), "utf8");
      }
      writeFileSync(state.statePath, JSON.stringify(state, null, 2), "utf8");
    }
  } catch (error) {
    return { ok: false, reason: `flow_motion_packet_write_failed:${(error as Error).message}` };
  }
  return { ok: true, status: readWizardFlowMotionStatus(topicId) };
}

const WIZARD_TTS_OWNER_LISTENING_APPROVAL_FILE =
  "owner-listening-approval-v1.json";

type WizardTtsOwnerListeningPartEvidence = {
  partId: "single" | "part-1" | "part-2";
  audioSha256: string;
  ttsInputContractSha256: string;
  wizardScriptFingerprint: string;
  durationSec: number;
};

function wizardTtsOwnerListeningApprovalPath(
  part: Pick<WizardRealPipelinePartPaths, "ttsOutDir">,
): string {
  return join(part.ttsOutDir, WIZARD_TTS_OWNER_LISTENING_APPROVAL_FILE);
}

function readWizardTtsOwnerListeningApproval(
  topicId: string,
  part: WizardTtsOwnerListeningPartEvidence,
  approvalPath: string,
): {
  accepted: boolean;
  qualityApprovalFingerprint: string | null;
  acceptedAt: string | null;
} {
  const result = validateMoneyShortsTtsOwnerListeningEvidence({
    evidence: readAbsJson(approvalPath),
    topicId,
    currentPart: part,
  });
  return {
    accepted: result.accepted === true,
    qualityApprovalFingerprint:
      result.accepted === true &&
      typeof result.qualityApprovalFingerprint === "string"
        ? result.qualityApprovalFingerprint
        : null,
    acceptedAt:
      result.accepted === true && typeof result.acceptedAt === "string"
        ? result.acceptedAt
        : null,
  };
}

export function acceptWizardRealTtsListeningQuality(
  topicId: string,
  input: {
    confirmListenedAllParts?: boolean;
    confirmVoiceQualityAccepted?: boolean;
    confirmDownstreamUse?: boolean;
    approvalText?: string;
  },
):
  | {
      ok: true;
      media: WizardRealMediaState;
      qualityApprovalFingerprint: string;
    }
  | { ok: false; reason: string } {
  if (
    input.confirmListenedAllParts !== true ||
    input.confirmVoiceQualityAccepted !== true ||
    input.confirmDownstreamUse !== true ||
    input.approvalText?.trim() !== MONEY_SHORTS_TTS_OWNER_APPROVAL_TEXT
  ) {
    return { ok: false, reason: "tts_owner_listening_confirmation_required" };
  }
  const pipeline = buildWizardRealPipelineInputs(topicId);
  if (!pipeline.ok) return pipeline;
  const media = readWizardRealMediaState(topicId);
  if (
    media.parts.length !== pipeline.paths.parts.length ||
    media.parts.length === 0 ||
    media.parts.some((part) => !part.realTts.ready || !part.realTts.audioPath)
  ) {
    return { ok: false, reason: "real_tts_required" };
  }

  const evidenceParts: WizardTtsOwnerListeningPartEvidence[] = [];
  try {
    for (const part of pipeline.paths.parts) {
      const partMedia = media.parts.find((candidate) => candidate.id === part.id);
      const summary = readAbsJson(part.ttsSummaryPath) as {
        ttsInputContractSha256?: unknown;
        wizardScriptFingerprint?: unknown;
      } | null;
      const audioPath = partMedia?.realTts.audioPath;
      if (
        !partMedia?.realTts.ready ||
        !audioPath ||
        typeof summary?.ttsInputContractSha256 !== "string" ||
        typeof summary.wizardScriptFingerprint !== "string" ||
        typeof partMedia.realTts.durationSec !== "number"
      ) {
        return { ok: false, reason: `tts_owner_listening_evidence_missing:${part.id}` };
      }
      evidenceParts.push({
        partId: part.id,
        audioSha256: createHash("sha256")
          .update(readFileSync(audioPath))
          .digest("hex"),
        ttsInputContractSha256: summary.ttsInputContractSha256,
        wizardScriptFingerprint: summary.wizardScriptFingerprint,
        durationSec: partMedia.realTts.durationSec,
      });
    }
  } catch {
    return { ok: false, reason: "tts_owner_listening_audio_read_failed" };
  }

  let evidence: {
    qualityApprovalFingerprint: string;
  } & Record<string, unknown>;
  try {
    evidence = buildMoneyShortsTtsOwnerListeningEvidence({
      topicId,
      parts: evidenceParts,
      acceptedAt: new Date().toISOString(),
    });
  } catch {
    return { ok: false, reason: "tts_owner_listening_evidence_invalid" };
  }

  try {
    const writes = pipeline.paths.parts.map((part) => {
      const path = wizardTtsOwnerListeningApprovalPath(part);
      const tempPath = `${path}.tmp`;
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(tempPath, JSON.stringify(evidence, null, 2), "utf8");
      return { path, tempPath };
    });
    for (const write of writes) renameSync(write.tempPath, write.path);
  } catch {
    return { ok: false, reason: "tts_owner_listening_evidence_write_failed" };
  }

  const mediaAfter = readWizardRealMediaState(topicId);
  if (!mediaAfter.realTts.qualityAccepted) {
    return { ok: false, reason: "tts_owner_listening_evidence_recheck_failed" };
  }
  return {
    ok: true,
    media: mediaAfter,
    qualityApprovalFingerprint: evidence.qualityApprovalFingerprint,
  };
}

const WIZARD_FINAL_VIDEO_OWNER_APPROVAL_FILE =
  "owner-final-video-approval-v1.json";

type WizardFinalVideoOwnerApprovalPartEvidence = {
  partId: "single" | "part-1" | "part-2";
  wizardScriptFingerprint: string;
  audioSha256: string;
  imageSetSha256: string;
  finalMp4Sha256: string;
  publishMetadataSha256: string;
  durationSec: number;
  sizeBytes: number;
};

function wizardFinalVideoOwnerApprovalPath(topicId: string): string {
  const safeSlug = toSafeTopicSlug(topicId) ?? "invalid";
  return join(
    WIZARD_VIDEO_OUT_ROOT,
    safeSlug,
    "real",
    WIZARD_FINAL_VIDEO_OWNER_APPROVAL_FILE,
  );
}

function readWizardFinalVideoOwnerApproval(
  topicId: string,
  part: WizardFinalVideoOwnerApprovalPartEvidence,
  approvalPath: string,
): {
  accepted: boolean;
  ownerApprovalFingerprint: string | null;
  acceptedAt: string | null;
} {
  const result =
    validateMoneyShortsFinalVideoOwnerApprovalEvidence({
      evidence: readAbsJson(approvalPath),
      topicId,
      currentPart: part,
    });
  return {
    accepted: result.accepted === true,
    ownerApprovalFingerprint:
      result.accepted === true &&
      typeof result.finalVideoApprovalFingerprint === "string"
        ? result.finalVideoApprovalFingerprint
        : null,
    acceptedAt:
      result.accepted === true &&
      typeof result.acceptedAt === "string"
        ? result.acceptedAt
        : null,
  };
}

export function acceptWizardFinalVideoReview(
  topicId: string,
  input: {
    confirmWatchedAllParts?: boolean;
    confirmPublishMetadataReviewed?: boolean;
    confirmExactFilesForPublish?: boolean;
    approvalText?: string;
    expectedParts?: Array<{
      partId?: string;
      finalMp4Sha256?: string;
      publishMetadataSha256?: string;
    }>;
  },
):
  | {
      ok: true;
      media: WizardRealMediaState;
      finalVideoApprovalFingerprint: string;
    }
  | { ok: false; reason: string } {
  if (
    input.confirmWatchedAllParts !== true ||
    input.confirmPublishMetadataReviewed !== true ||
    input.confirmExactFilesForPublish !== true ||
    input.approvalText?.trim() !==
      MONEY_SHORTS_FINAL_VIDEO_OWNER_APPROVAL_TEXT
  ) {
    return {
      ok: false,
      reason: "final_video_owner_confirmation_required",
    };
  }
  const pipeline = buildWizardRealPipelineInputs(topicId);
  if (!pipeline.ok) return pipeline;
  const media = readWizardRealMediaState(topicId);
  if (
    media.parts.length !== pipeline.paths.parts.length ||
    media.parts.length === 0
  ) {
    return { ok: false, reason: "final_mp4_required" };
  }

  const evidenceParts: WizardFinalVideoOwnerApprovalPartEvidence[] =
    [];
  for (const part of pipeline.paths.parts) {
    const partMedia = media.parts.find(
      (candidate) => candidate.id === part.id,
    );
    const partRecord = readAbsJson(
      part.scriptFinalPath,
    ) as WizardFinalScriptRecord | null;
    if (
      !partMedia?.finalVideo.ready ||
      !partMedia.finalVideo.finalMp4Sha256 ||
      !partMedia.finalVideo.publishMetadataSha256 ||
      !partMedia.realTts.audioSha256 ||
      !partMedia.realImages.manualVisualReview.imageSetSha256 ||
      partRecord?.schemaVersion !== "wizard_script_final_v1" ||
      typeof partRecord.localFingerprint !== "string" ||
      typeof partMedia.finalVideo.durationSec !== "number" ||
      typeof partMedia.finalVideo.sizeBytes !== "number"
    ) {
      return {
        ok: false,
        reason: `final_video_owner_evidence_missing:${part.id}`,
      };
    }
    evidenceParts.push({
      partId: part.id,
      wizardScriptFingerprint: partRecord.localFingerprint,
      audioSha256: partMedia.realTts.audioSha256,
      imageSetSha256:
        partMedia.realImages.manualVisualReview.imageSetSha256,
      finalMp4Sha256: partMedia.finalVideo.finalMp4Sha256,
      publishMetadataSha256:
        partMedia.finalVideo.publishMetadataSha256,
      durationSec: partMedia.finalVideo.durationSec,
      sizeBytes: partMedia.finalVideo.sizeBytes,
    });
  }

  const expectedParts = Array.isArray(input.expectedParts)
    ? input.expectedParts
        .map((part) => ({
          partId: String(part?.partId ?? ""),
          finalMp4Sha256: String(part?.finalMp4Sha256 ?? ""),
          publishMetadataSha256: String(
            part?.publishMetadataSha256 ?? "",
          ),
        }))
        .sort((left, right) =>
          left.partId.localeCompare(right.partId),
        )
    : [];
  const currentClaims = evidenceParts
    .map((part) => ({
      partId: part.partId,
      finalMp4Sha256: part.finalMp4Sha256,
      publishMetadataSha256: part.publishMetadataSha256,
    }))
    .sort((left, right) =>
      left.partId.localeCompare(right.partId),
    );
  if (
    JSON.stringify(expectedParts) !== JSON.stringify(currentClaims)
  ) {
    return {
      ok: false,
      reason: "final_video_owner_stale_ui_claim",
    };
  }

  let evidence: {
    finalVideoApprovalFingerprint: string;
  } & Record<string, unknown>;
  try {
    evidence = buildMoneyShortsFinalVideoOwnerApprovalEvidence({
      topicId,
      parts: evidenceParts,
      acceptedAt: new Date().toISOString(),
    });
  } catch {
    return {
      ok: false,
      reason: "final_video_owner_evidence_invalid",
    };
  }

  try {
    const path = wizardFinalVideoOwnerApprovalPath(topicId);
    const tempPath = `${path}.${process.pid}.${Date.now()}.tmp`;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(
      tempPath,
      JSON.stringify(evidence, null, 2),
      "utf8",
    );
    // 전체 편 evidence를 한 파일에 원자적으로 교체해 2편 split state를 막는다.
    renameSync(tempPath, path);
  } catch {
    return {
      ok: false,
      reason: "final_video_owner_evidence_write_failed",
    };
  }

  const mediaAfter = readWizardRealMediaState(topicId);
  if (
    !mediaAfter.finalVideo.ownerApproved ||
    mediaAfter.finalVideo.ownerApprovalFingerprint !==
      evidence.finalVideoApprovalFingerprint
  ) {
    return {
      ok: false,
      reason: "final_video_owner_evidence_recheck_failed",
    };
  }
  return {
    ok: true,
    media: mediaAfter,
    finalVideoApprovalFingerprint:
      evidence.finalVideoApprovalFingerprint,
  };
}

function wizardCurrentImageReviewParts(media: WizardRealMediaState) {
  return media.parts.map((part) => ({
    partId: part.id,
    imageSetSha256: part.realImages.manualVisualReview.imageSetSha256,
    scenes: part.realImages.scenes,
  }));
}

/**
 * 전체 편의 현재 이미지 해시 묶음에만 Owner 시각 승인 evidence를 기록한다.
 * 네트워크/브라우저/생성 runner는 호출하지 않으며, stale UI claim은 쓰기 전에 거부한다.
 */
export function acceptWizardRealSceneImagesVisualQuality(
  topicId: string,
  input: {
    claims?: unknown;
    confirmReviewedAllImages?: boolean;
    confirmVisualQualityAccepted?: boolean;
    confirmDownstreamUse?: boolean;
    approvalText?: string;
  },
):
  | {
      ok: true;
      media: WizardRealMediaState;
      imageApprovalFingerprint: string;
    }
  | { ok: false; reason: string } {
  const media = readWizardRealMediaState(topicId);
  if (
    media.parts.length === 0 ||
    media.parts.some((part) =>
      part.realImages.reviewable !== true ||
      !part.realImages.dir ||
      !part.realImages.manualVisualReview.imageSetSha256)
  ) {
    return { ok: false, reason: "real_scene_images_not_reviewable" };
  }
  const currentParts = wizardCurrentImageReviewParts(media);
  const validation = validateMoneyShortsImageReviewApproval({
    currentParts,
    claims: input.claims,
    confirmReviewedAllImages: input.confirmReviewedAllImages,
    confirmVisualQualityAccepted: input.confirmVisualQualityAccepted,
    confirmDownstreamUse: input.confirmDownstreamUse,
    approvalText: input.approvalText?.trim(),
  });
  if (validation.ok !== true) {
    return { ok: false, reason: validation.reason ?? "manual_visual_review_validation_failed" };
  }
  const approvedParts = validation.parts as Array<{
    partId: "single" | "part-1" | "part-2";
    imageSetSha256: string;
  }>;

  const reviewedAt = new Date().toISOString();
  const approvalTransactionId = createHash("sha256").update(JSON.stringify({
    topicId,
    reviewedAt,
    parts: approvedParts.map((part) => ({
      partId: part.partId,
      imageSetSha256: part.imageSetSha256,
    })),
  })).digest("hex");
  const writes: Array<{ path: string; content: string }> = [];
  for (const part of media.parts) {
    const imagesDir = part.realImages.dir;
    const currentImageSetSha256 = part.realImages.manualVisualReview.imageSetSha256;
    if (!imagesDir || !currentImageSetSha256) {
      return { ok: false, reason: `manual_visual_review_part_missing:${part.id}` };
    }
    const summary = readAbsJson(join(imagesDir, "scene-images-summary.json"));
    const built = buildMoneyShortsManualVisualReviewEvidence({
      summary,
      approvalTransactionId,
      reviewedAt,
    });
    const evidence = built.ok === true ? built.evidence : null;
    if (!evidence || evidence.imageSetSha256 !== currentImageSetSha256) {
      return { ok: false, reason: `manual_visual_review_image_set_stale:${part.id}` };
    }
    writes.push({
      path: join(imagesDir, MONEY_SHORTS_MANUAL_VISUAL_REVIEW_EVIDENCE_FILE),
      content: `${JSON.stringify(evidence, null, 2)}\n`,
    });
  }
  const committed = commitMoneyShortsManualVisualReviewEvidenceTransaction({
    writes,
    approvalTransactionId,
    io: {
      exists: existsSync,
      writeText: (path: string, content: string) => writeFileSync(path, content, "utf8"),
      rename: renameSync,
    },
  });
  if (committed.ok !== true) {
    return { ok: false, reason: committed.reason ?? "manual_visual_review_evidence_write_failed" };
  }

  const mediaAfter = readWizardRealMediaState(topicId);
  if (
    mediaAfter.parts.length !== media.parts.length ||
    mediaAfter.parts.some((part) =>
      !part.realImages.ready ||
      part.realImages.manualVisualReview.approvalTransactionId !== approvalTransactionId)
  ) {
    return { ok: false, reason: "manual_visual_review_evidence_recheck_failed" };
  }
  const imageApprovalFingerprint = createHash("sha256").update(JSON.stringify({
    topicId,
    parts: mediaAfter.parts.map((part) => ({
      partId: part.id,
      imageSetSha256: part.realImages.manualVisualReview.imageSetSha256,
    })),
  })).digest("hex");
  return { ok: true, media: mediaAfter, imageApprovalFingerprint };
}

/**
 * 현재 전체 이미지 세트와 UI 선택 해시를 순수 검증해, 실제 runner를 호출해도 되는
 * 편별 exact target plan만 돌려준다. 이 함수 자체는 생성·브라우저·네트워크 작업을 하지 않는다.
 */
export function planWizardSelectedSceneImageRegeneration(
  topicId: string,
  input: {
    selections?: unknown;
    confirmRegeneration?: boolean;
    approvalText?: string;
  },
):
  | {
      ok: true;
      media: WizardRealMediaState;
      parts: Array<{
        partId: "single" | "part-1" | "part-2";
        imageSetSha256: string;
        regenerateScenes: Array<{ sceneIndex: number; imageSha256: string }>;
        retainedScenes: Array<{ sceneIndex: number; imageSha256: string }>;
      }>;
      selectedSceneCount: number;
    }
  | { ok: false; reason: string } {
  const media = readWizardRealMediaState(topicId);
  if (
    media.parts.length === 0 ||
    media.parts.some((part) =>
      part.realImages.reviewable !== true ||
      !part.realImages.manualVisualReview.imageSetSha256)
  ) {
    return { ok: false, reason: "real_scene_images_not_reviewable" };
  }
  const validation = validateMoneyShortsSelectedSceneRegeneration({
    currentParts: wizardCurrentImageReviewParts(media),
    selections: input.selections,
    confirmRegeneration: input.confirmRegeneration,
    approvalText: input.approvalText?.trim(),
  });
  if (
    validation.ok !== true ||
    !Array.isArray(validation.parts) ||
    !Number.isInteger(validation.selectedSceneCount)
  ) {
    return { ok: false, reason: validation.reason ?? "selected_scene_regeneration_validation_failed" };
  }
  const selectedParts = validation.parts as Array<{
    partId: "single" | "part-1" | "part-2";
    imageSetSha256: string;
    regenerateScenes: Array<{ sceneIndex: number; imageSha256: string }>;
    retainedScenes: Array<{ sceneIndex: number; imageSha256: string }>;
  }>;
  return {
    ok: true,
    media,
    parts: selectedParts,
    selectedSceneCount: validation.selectedSceneCount as number,
  };
}

export type WizardRealMediaState = {
  production: {
    strategyVersion: typeof FINANCE_EDITORIAL_VIDEO_STRATEGY_VERSION | null;
    mode: "single" | "two_part";
    totalParts: number;
  };
  scriptEngine: {
    finalReady: boolean;
    mode: "claude_polished" | "local_only" | null;
    note: string | null;
    rewriteNotes: string[];
    polishDisabled: boolean;
    anthropicKeyPresent: boolean;
    elevenLabsKeyPresent: boolean;
  };
  realTts: {
    ready: boolean;
    qualityAccepted: boolean;
    qualityApprovalFingerprint: string | null;
    qualityAcceptedAt: string | null;
    audioSha256: string | null;
    audioPath: string | null;
    durationSec: number | null;
    provider: string | null;
    apiCallCount: number | null;
    missingEnv: string[];
  };
  realImages: {
    ready: boolean;
    reviewable: boolean;
    generatedCount: number;
    expectedCount: number | null;
    dir: string | null;
    blocked: string | null;
    blockerDetail: string | null;
    manualVisualReview: {
      accepted: boolean;
      imageSetSha256: string | null;
      approvalTransactionId: string | null;
      reason: string | null;
    };
    scenes: Array<{
      sceneIndex: number;
      ready: boolean;
      imageSha256: string | null;
      width: number | null;
      height: number | null;
    }>;
  };
  finalVideo: {
    ready: boolean;
    mp4Path: string | null;
    finalMp4Sha256: string | null;
    publishMetadataSha256: string | null;
    publishMetadata: WizardPublishMetadataPreview | null;
    ownerApproved: boolean;
    ownerApprovalFingerprint: string | null;
    ownerApprovedAt: string | null;
    durationSec: number | null;
    width: number | null;
    height: number | null;
    hasAudio: boolean;
    sizeBytes: number | null;
  };
  mediaQualityGate: {
    ok: boolean;
    reasons: string[];
    blockerCode:
      | "REAL_TTS_REQUIRED"
      | "REAL_TTS_OWNER_APPROVAL_REQUIRED"
      | "REAL_SCENE_IMAGES_REQUIRED"
      | "MANUAL_VISUAL_REVIEW_REQUIRED"
      | "FINAL_MP4_REQUIRED"
      | "FINAL_VIDEO_OWNER_APPROVAL_REQUIRED"
      | null;
  };
  parts: Array<{
    id: "single" | "part-1" | "part-2";
    partNumber: 1 | 2;
    totalParts: 1 | 2;
    canonicalTitle: string;
    platformTitle: string;
    realTts: WizardRealMediaState["realTts"];
    realImages: WizardRealMediaState["realImages"];
    finalVideo: WizardRealMediaState["finalVideo"];
    mediaQualityGate: WizardRealMediaState["mediaQualityGate"];
  }>;
};

/**
 * 실제 미디어(음성/이미지/최종 영상) 준비 상태 + media quality gate.
 * 전부 요약 파일 읽기만 한다(spawn/네트워크 0). 업로드 게이트가 이 결과를 재검증에 쓴다.
 * 테스트 소리(local_mock)/색상 카드 시안은 어떤 필드로도 ready가 되지 않는다.
 */
function readWizardLegacyRealMediaState(topicId: string): WizardRealMediaState {
  const slug = topicId ? toSafeTopicSlug(topicId) : null;
  const realRoot = slug ? join(WIZARD_VIDEO_OUT_ROOT, slug, "real") : null;
  const visualProfile = wizardVisualProfileForTopic(topicId);

  const record = slug ? readWizardFinalScriptRecord(topicId) : null;
  const expectedSceneCount = Array.isArray(record?.script?.scenes) && isSupportedWizardSceneCount(record.script.scenes.length)
    ? record.script.scenes.length
    : null;
  const scriptEngine: WizardRealMediaState["scriptEngine"] = {
    finalReady: record != null,
    mode: record?.mode ?? null,
    note: record?.polish.note ?? null,
    rewriteNotes: record?.polish.rewriteNotes ?? [],
    polishDisabled: isClaudePolishDisabled(),
    anthropicKeyPresent: typeof process.env.ANTHROPIC_API_KEY === "string" && process.env.ANTHROPIC_API_KEY !== "",
    elevenLabsKeyPresent:
      typeof process.env.ELEVENLABS_API_KEY === "string" &&
      process.env.ELEVENLABS_API_KEY !== "" &&
      typeof process.env.ELEVENLABS_VOICE_ID === "string" &&
      process.env.ELEVENLABS_VOICE_ID !== "",
  };

  // 실제 TTS — 한국어 연속 발화 v2 summary만 신뢰. 이전 장면별 음성은 보존하되 새 엔진 결과로 인정하지 않는다.
  const ttsSummary = realRoot
    ? (readAbsJson(join(realRoot, WIZARD_TTS_OUTPUT_DIR, "elevenlabs-scene-paced-tts-summary.json")) as {
        provider?: string;
        ttsEngineVersion?: string;
        liveApiCallPerformed?: boolean;
        readinessFailure?: boolean;
        missingEnv?: string[];
        timelineAudioPath?: string | null;
        timelineDurationSec?: number | null;
        apiCallCount?: number;
        wizardScriptFingerprint?: string;
        ttsInputContractSha256?: string;
      } | null)
    : null;
  const ttsAudioPath = typeof ttsSummary?.timelineAudioPath === "string" ? ttsSummary.timelineAudioPath : null;
  const ttsDuration = typeof ttsSummary?.timelineDurationSec === "number" ? ttsSummary.timelineDurationSec : null;
  const realTtsReady =
    ttsSummary?.provider === "elevenlabs" &&
    ttsSummary.ttsEngineVersion === WIZARD_TTS_ENGINE_VERSION &&
    ttsSummary.wizardScriptFingerprint === record?.localFingerprint &&
    ttsSummary.liveApiCallPerformed === true &&
    ttsSummary.readinessFailure !== true &&
    ttsAudioPath != null &&
    existsSync(ttsAudioPath) &&
    ttsDuration != null &&
    ttsDuration >= 10 &&
    ttsDuration <= 60;
  const audioSha256 =
    realTtsReady && ttsAudioPath ? fileSha256(ttsAudioPath) : null;
  const listeningApproval =
    realTtsReady &&
    realRoot &&
    audioSha256 &&
    typeof ttsSummary?.ttsInputContractSha256 === "string" &&
    typeof ttsSummary.wizardScriptFingerprint === "string" &&
    ttsDuration != null
      ? readWizardTtsOwnerListeningApproval(
          topicId,
          {
            partId: "single",
            audioSha256,
            ttsInputContractSha256: ttsSummary.ttsInputContractSha256,
            wizardScriptFingerprint: ttsSummary.wizardScriptFingerprint,
            durationSec: ttsDuration,
          },
          join(
            realRoot,
            WIZARD_TTS_OUTPUT_DIR,
            WIZARD_TTS_OWNER_LISTENING_APPROVAL_FILE,
          ),
        )
      : {
          accepted: false,
          qualityApprovalFingerprint: null,
          acceptedAt: null,
        };
  const realTts: WizardRealMediaState["realTts"] = {
    ready: realTtsReady === true,
    qualityAccepted: listeningApproval.accepted,
    qualityApprovalFingerprint: listeningApproval.qualityApprovalFingerprint,
    qualityAcceptedAt: listeningApproval.acceptedAt,
    audioSha256,
    audioPath: realTtsReady ? ttsAudioPath : null,
    durationSec: ttsDuration,
    provider: ttsSummary?.provider ?? null,
    apiCallCount: typeof ttsSummary?.apiCallCount === "number" ? ttsSummary.apiCallCount : null,
    missingEnv: Array.isArray(ttsSummary?.missingEnv) ? ttsSummary.missingEnv.filter((k): k is string => typeof k === "string") : [],
  };

  // 실제 장면 이미지 — visual-storyboard-v2로 만든 전체 장면 + 파일 존재 + 세로형 최소 해상도.
  // 이전 images/ 산출물은 보존하되 새 엔진의 결과로 인정하지 않는다.
  const imagesDir = realRoot ? join(realRoot, visualProfile.imagesDir) : null;
  const imagesSummary = imagesDir
    ? (readAbsJson(join(imagesDir, "scene-images-summary.json")) as {
        schemaVersion?: string;
        mode?: string;
        visualEngineVersion?: string;
        imageControllerVersion?: string;
        visualModalityVersion?: string;
        allReady?: boolean;
        blockerCode?: string | null;
        manualVisualReview?: {
          version?: string;
          required?: boolean;
          status?: string;
          acceptedForDownstream?: boolean;
          renderAllowed?: boolean;
          evidenceFileName?: string;
        };
        visualDifferenceAudit?: {
          version?: string;
          passed?: boolean;
          checkedCount?: number;
        };
        characterContinuityAudit?: {
          version?: string;
          promptCoveragePassed?: boolean;
          targetedRegenerationPassed?: boolean;
          passed?: boolean;
          manualVisualReviewRequired?: boolean;
        };
        visualModalityAudit?: {
          version?: string;
          passed?: boolean;
          characterCount?: number;
          nonCharacterCount?: number;
          distinctModeCount?: number;
          sceneContractsPassed?: boolean;
        };
        motionPlanAudit?: {
          version?: string;
          promptCoveragePassed?: boolean;
          evidenceCoveragePassed?: boolean;
          stateCoveragePassed?: boolean;
          passed?: boolean;
        };
        scenes?: Array<{
          sceneIndex?: number;
          file?: string;
          width?: number | null;
          height?: number | null;
          status?: string;
          method?: string | null;
          visualEvidenceId?: string;
          visualModeId?: string;
          presenceMode?: string;
          promptFingerprint?: string;
          imageSha256?: string | null;
          perceptualHash?: string | null;
        }>;
      } | null)
    : null;
  const sceneRows = Array.isArray(imagesSummary?.scenes) ? imagesSummary.scenes : [];
  const manualVisualReview = validateMoneyShortsManualVisualReview({
    summary: imagesSummary,
    evidence: imagesDir
      ? readAbsJson(join(imagesDir, MONEY_SHORTS_MANUAL_VISUAL_REVIEW_EVIDENCE_FILE))
      : null,
  });
  const savedScenes = sceneRows.filter((s) => {
    const canonicalFile = wizardCanonicalSceneImagePath(
      imagesDir,
      typeof s.sceneIndex === "number" ? s.sceneIndex : null,
    );
    return s.status === "SAVED_OK" &&
      typeof s.file === "string" &&
      canonicalFile != null &&
      resolve(s.file) === canonicalFile &&
      existsSync(canonicalFile) &&
      typeof s.width === "number" &&
      typeof s.height === "number" &&
      s.width >= 900 &&
      s.height >= 1200 &&
      s.height >= Math.round(s.width * 1.2) &&
      typeof s.imageSha256 === "string" &&
      s.imageSha256.length === 64 &&
      fileSha256(canonicalFile) === s.imageSha256;
  });
  const imageAssetContractReady = expectedSceneCount !== null && sceneRows.every((scene, index) =>
    scene.sceneIndex === index + 1 &&
    typeof scene.visualEvidenceId === "string" &&
    scene.visualEvidenceId === record?.script.scenes[index]?.visualEvidence?.sceneIdentity &&
    typeof scene.visualModeId === "string" &&
    ["character", "hands", "none"].includes(scene.presenceMode ?? "") &&
    typeof scene.promptFingerprint === "string" &&
    scene.promptFingerprint.length === 16 &&
    typeof scene.imageSha256 === "string" &&
    scene.imageSha256.length === 64 &&
    typeof scene.perceptualHash === "string" &&
    scene.perceptualHash.length === 16
  ) && new Set(sceneRows.map((scene) => scene.imageSha256)).size === expectedSceneCount;
  const realImagesTechnicalReady =
    expectedSceneCount !== null &&
    imagesSummary?.mode === "chatgpt_playwright" &&
    imagesSummary.visualEngineVersion === visualProfile.engineVersion &&
    imagesSummary.imageControllerVersion === WIZARD_IMAGE_CONTROLLER_VERSION &&
    imagesSummary.visualModalityVersion === WIZARD_VISUAL_MODALITY_VERSION &&
    imagesSummary.allReady === true &&
    imagesSummary.visualDifferenceAudit?.version === "ffmpeg_dhash64_v1" &&
    imagesSummary.visualDifferenceAudit?.passed === true &&
    imagesSummary.visualDifferenceAudit?.checkedCount === expectedSceneCount &&
    imagesSummary.visualModalityAudit?.version === WIZARD_VISUAL_MODALITY_VERSION &&
    imagesSummary.visualModalityAudit?.passed === true &&
    imagesSummary.visualModalityAudit?.sceneContractsPassed === true &&
    imagesSummary.characterContinuityAudit?.version === FINANCE_VISUAL_CHARACTER_CONTINUITY_VERSION &&
    imagesSummary.characterContinuityAudit?.promptCoveragePassed === true &&
    imagesSummary.characterContinuityAudit?.targetedRegenerationPassed === true &&
    imagesSummary.characterContinuityAudit?.passed === true &&
    imagesSummary.motionPlanAudit?.version === FINANCE_VISUAL_MOTION_CONTRACT_VERSION &&
    imagesSummary.motionPlanAudit?.promptCoveragePassed === true &&
    imagesSummary.motionPlanAudit?.evidenceCoveragePassed === true &&
    imagesSummary.motionPlanAudit?.stateCoveragePassed === true &&
    imagesSummary.motionPlanAudit?.passed === true &&
    sceneRows.length === expectedSceneCount &&
    savedScenes.length === expectedSceneCount &&
    imageAssetContractReady;
  const realImagesReady = realImagesTechnicalReady && manualVisualReview.passed === true;
  const savedSceneIndexes = new Set(savedScenes.map((scene) => scene.sceneIndex));
  const realImages: WizardRealMediaState["realImages"] = {
    ready: realImagesReady === true,
    reviewable: realImagesTechnicalReady === true,
    generatedCount: savedScenes.length,
    expectedCount: expectedSceneCount,
    dir: imagesDir,
    blocked: realImagesTechnicalReady && !manualVisualReview.passed
      ? "MANUAL_VISUAL_REVIEW_REQUIRED"
      : typeof imagesSummary?.blockerCode === "string" ? imagesSummary.blockerCode : null,
    blockerDetail: realImagesTechnicalReady && !manualVisualReview.passed
      ? manualVisualReview.reason
      : sceneRows.find((scene) => typeof scene.method === "string" && scene.method !== "")?.method ?? null,
    manualVisualReview: {
      accepted: manualVisualReview.passed === true,
      imageSetSha256: manualVisualReview.imageSetSha256,
      approvalTransactionId: manualVisualReview.approvalTransactionId ?? null,
      reason: manualVisualReview.reason,
    },
    scenes: sceneRows.map((scene) => ({
      sceneIndex: typeof scene.sceneIndex === "number" ? scene.sceneIndex : 0,
      ready: typeof scene.sceneIndex === "number" && savedSceneIndexes.has(scene.sceneIndex),
      imageSha256: typeof scene.imageSha256 === "string" ? scene.imageSha256 : null,
      width: typeof scene.width === "number" ? scene.width : null,
      height: typeof scene.height === "number" ? scene.height : null,
    })).filter((scene) => scene.sceneIndex > 0),
  };

  // 최종 mp4 — 실제 음성+실제 이미지 합성 summary + ffprobe 검증값 + 파일 존재.
  const videoSummary = realRoot
    ? (readAbsJson(join(realRoot, visualProfile.videoDir, "real-video-summary.json")) as {
        schemaVersion?: string;
        status?: string;
        finalMp4Path?: string;
        finalMp4Sha256?: string;
        durationSec?: number;
        width?: number;
        height?: number;
        hasAudioStream?: boolean;
        hasVideoStream?: boolean;
        sizeBytes?: number;
        sceneCount?: number;
        audioProvider?: string;
        audioSha256?: string;
        imageMode?: string;
        imageSetSha256?: string;
        visualEngineVersion?: string;
        motionRendererVersion?: string;
        layeredMotionRendererVersion?: string;
        motionAudit?: WizardLayeredMotionAudit;
        flowMotionAudit?: WizardFlowMotionRenderAudit;
        captionMode?: string;
        captionContractVersion?: string;
        captionLayoutVersion?: string;
        captionAudit?: {
          layoutVersion?: string;
          twoLineSpacingPass?: boolean;
          fullScriptCoveragePass?: boolean;
          exactTranscriptMatchPass?: boolean;
          perSceneTranscriptMatchPass?: boolean;
          perSceneBlockCountPass?: boolean;
          sceneBoundaryTimingPass?: boolean;
          noCaptionOverlapPass?: boolean;
          captionGapPass?: boolean;
          captionCoverageRatio?: number;
          screenDutyPass?: boolean;
          displayUnitLengthPass?: boolean;
          sentenceSemanticSegmentationPass?: boolean;
          sentenceBoundaryPreservedPass?: boolean;
          sourceSegmentBoundaryPreservedPass?: boolean;
          arbitraryMidPhraseSplitAbsent?: boolean;
          oneWordFragmentAbsent?: boolean;
          displayTerminalPunctuationAbsent?: boolean;
          displayWordCoveragePass?: boolean;
          multiPositionNarrativeFlowPass?: boolean;
          semanticColorPalettePass?: boolean;
          emphasisDensityPass?: boolean;
          highImpactRoleEmphasisPass?: boolean;
          motionDiversityPass?: boolean;
        };
      } | null)
    : null;
  const mp4Path = typeof videoSummary?.finalMp4Path === "string" ? videoSummary.finalMp4Path : null;
  const resolvedMp4Path =
    mp4Path != null ? resolve(mp4Path) : null;
  const mp4PathTrusted =
    resolvedMp4Path != null &&
    resolvedMp4Path.startsWith(WIZARD_VIDEO_ALLOWED_PREFIX) &&
    resolvedMp4Path.toLowerCase().endsWith(".mp4") &&
    existsSync(resolvedMp4Path);
  let currentFinalMp4Sha256: string | null = null;
  let currentFinalMp4SizeBytes: number | null = null;
  if (mp4PathTrusted && resolvedMp4Path) {
    try {
      currentFinalMp4SizeBytes = statSync(resolvedMp4Path).size;
      currentFinalMp4Sha256 = createHash("sha256")
        .update(readFileSync(resolvedMp4Path))
        .digest("hex");
    } catch {
      currentFinalMp4SizeBytes = null;
      currentFinalMp4Sha256 = null;
    }
  }
  const publishMetadata =
    record != null
      ? buildWizardPublishMetadataSnapshot(
          topicId,
          record.script.title,
          record.script,
        )
      : null;
  const publishMetadataReady =
    publishMetadata?.ok === true ? publishMetadata : null;
  const renderSummaryHashMatches =
    currentFinalMp4Sha256 != null &&
    videoSummary?.finalMp4Sha256 === currentFinalMp4Sha256;
  const finalVideoReady =
    expectedSceneCount !== null &&
    videoSummary?.schemaVersion === "wizard_real_video_summary_v1" &&
    videoSummary.status === "RENDER_MUX_OK" &&
    videoSummary.audioProvider === "elevenlabs" &&
    typeof realTts.audioSha256 === "string" &&
    videoSummary.audioSha256 === realTts.audioSha256 &&
    videoSummary.imageMode === "chatgpt_playwright" &&
    manualVisualReview.passed === true &&
    videoSummary.imageSetSha256 === manualVisualReview.imageSetSha256 &&
    videoSummary.visualEngineVersion === visualProfile.engineVersion &&
    wizardHybridMotionSummaryIsReady(videoSummary, expectedSceneCount, record?.script.scenes ?? []) &&
    videoSummary.captionMode === "full_script_dynamic_semantic_aligned_v6" &&
    videoSummary.captionContractVersion === WIZARD_FULL_SCRIPT_CAPTION_CONTRACT_VERSION &&
    videoSummary.captionLayoutVersion === WIZARD_CAPTION_LAYOUT_VERSION &&
    videoSummary.captionAudit?.layoutVersion === WIZARD_CAPTION_LAYOUT_VERSION &&
    videoSummary.captionAudit.twoLineSpacingPass === true &&
    videoSummary.captionAudit?.fullScriptCoveragePass === true &&
    videoSummary.captionAudit?.exactTranscriptMatchPass === true &&
    videoSummary.captionAudit?.perSceneTranscriptMatchPass === true &&
    videoSummary.captionAudit?.perSceneBlockCountPass === true &&
    videoSummary.captionAudit?.sceneBoundaryTimingPass === true &&
    videoSummary.captionAudit?.noCaptionOverlapPass === true &&
    videoSummary.captionAudit?.captionGapPass === true &&
    videoSummary.captionAudit?.captionCoverageRatio === 1 &&
    videoSummary.captionAudit?.screenDutyPass === true &&
    videoSummary.captionAudit?.displayUnitLengthPass === true &&
    videoSummary.captionAudit?.sentenceSemanticSegmentationPass === true &&
    videoSummary.captionAudit?.sentenceBoundaryPreservedPass === true &&
    videoSummary.captionAudit?.sourceSegmentBoundaryPreservedPass === true &&
    videoSummary.captionAudit?.arbitraryMidPhraseSplitAbsent === true &&
    videoSummary.captionAudit?.oneWordFragmentAbsent === true &&
    videoSummary.captionAudit?.displayTerminalPunctuationAbsent === true &&
    videoSummary.captionAudit?.displayWordCoveragePass === true &&
    videoSummary.captionAudit?.multiPositionNarrativeFlowPass === true &&
    videoSummary.captionAudit?.semanticColorPalettePass === true &&
    videoSummary.captionAudit?.emphasisDensityPass === true &&
    videoSummary.captionAudit?.highImpactRoleEmphasisPass === true &&
    videoSummary.captionAudit?.motionDiversityPass === true &&
    mp4PathTrusted &&
    renderSummaryHashMatches &&
    videoSummary.width === 1080 &&
    videoSummary.height === 1920 &&
    videoSummary.hasAudioStream === true &&
    videoSummary.hasVideoStream === true &&
    typeof videoSummary.durationSec === "number" &&
    videoSummary.durationSec >= 15 &&
    videoSummary.durationSec <= 60 &&
    typeof videoSummary.sizeBytes === "number" &&
    videoSummary.sizeBytes > 0 &&
    currentFinalMp4SizeBytes === videoSummary.sizeBytes &&
    publishMetadataReady != null &&
    videoSummary.sceneCount === expectedSceneCount;
  const finalVideoApproval =
    finalVideoReady &&
    currentFinalMp4Sha256 &&
    publishMetadataReady &&
    realTts.audioSha256 &&
    manualVisualReview.imageSetSha256 &&
    record?.localFingerprint &&
    typeof videoSummary?.durationSec === "number" &&
    typeof videoSummary.sizeBytes === "number" &&
    realRoot
      ? readWizardFinalVideoOwnerApproval(
          topicId,
          {
            partId: "single",
            wizardScriptFingerprint: record.localFingerprint,
            audioSha256: realTts.audioSha256,
            imageSetSha256: manualVisualReview.imageSetSha256,
            finalMp4Sha256: currentFinalMp4Sha256,
            publishMetadataSha256: publishMetadataReady.sha256,
            durationSec: videoSummary.durationSec,
            sizeBytes: videoSummary.sizeBytes,
          },
          wizardFinalVideoOwnerApprovalPath(topicId),
        )
      : {
          accepted: false,
          ownerApprovalFingerprint: null,
          acceptedAt: null,
        };
  const finalVideo: WizardRealMediaState["finalVideo"] = {
    ready: finalVideoReady === true,
    mp4Path: finalVideoReady ? mp4Path : null,
    finalMp4Sha256:
      finalVideoReady ? currentFinalMp4Sha256 : null,
    publishMetadataSha256:
      finalVideoReady && publishMetadataReady
        ? publishMetadataReady.sha256
        : null,
    publishMetadata:
      finalVideoReady && publishMetadataReady
        ? publishMetadataReady.preview
        : null,
    ownerApproved: finalVideoApproval.accepted === true,
    ownerApprovalFingerprint:
      finalVideoApproval.ownerApprovalFingerprint,
    ownerApprovedAt: finalVideoApproval.acceptedAt,
    durationSec: typeof videoSummary?.durationSec === "number" ? videoSummary.durationSec : null,
    width: typeof videoSummary?.width === "number" ? videoSummary.width : null,
    height: typeof videoSummary?.height === "number" ? videoSummary.height : null,
    hasAudio: videoSummary?.hasAudioStream === true,
    sizeBytes: typeof videoSummary?.sizeBytes === "number" ? videoSummary.sizeBytes : null,
  };

  const reasons: string[] = [];
  if (!realTts.ready) reasons.push("실제 음성이 아직 없습니다 (테스트 소리는 업로드 불가)");
  else if (!realTts.qualityAccepted) reasons.push("현재 실제 음성의 Owner 청취 승인이 필요합니다");
  if (!realImages.ready) {
    reasons.push(
      realImages.blocked === "MANUAL_VISUAL_REVIEW_REQUIRED"
        ? "현재 이미지 묶음의 Owner 수동 시각 승인이 필요합니다"
        : realImages.expectedCount == null
        ? "확정 대본 장면 수가 아직 준비되지 않았습니다"
        : `실제 장면 이미지가 부족합니다 (${realImages.generatedCount}/${realImages.expectedCount})`,
    );
  }
  if (!finalVideo.ready) reasons.push("실제 음성+이미지로 만든 최종 영상이 아직 없습니다 (시안 영상은 업로드 불가)");
  else if (!finalVideo.ownerApproved) reasons.push("현재 최종 MP4와 게시 문구의 Owner 승인이 필요합니다");
  const blockerCode = !realTts.ready
    ? ("REAL_TTS_REQUIRED" as const)
    : !realTts.qualityAccepted
      ? ("REAL_TTS_OWNER_APPROVAL_REQUIRED" as const)
    : realImages.blocked === "MANUAL_VISUAL_REVIEW_REQUIRED"
      ? ("MANUAL_VISUAL_REVIEW_REQUIRED" as const)
    : !realImages.ready
      ? ("REAL_SCENE_IMAGES_REQUIRED" as const)
      : !finalVideo.ready
        ? ("FINAL_MP4_REQUIRED" as const)
        : !finalVideo.ownerApproved
          ? ("FINAL_VIDEO_OWNER_APPROVAL_REQUIRED" as const)
        : null;

  return {
    production: { strategyVersion: null, mode: "single", totalParts: 1 },
    scriptEngine,
    realTts,
    realImages,
    finalVideo,
    mediaQualityGate: { ok: reasons.length === 0, reasons, blockerCode },
    parts: [{
      id: "single",
      partNumber: 1,
      totalParts: 1,
      canonicalTitle: record?.script.title ?? "",
      platformTitle: record?.script.title ?? "",
      realTts,
      realImages,
      finalVideo,
      mediaQualityGate: { ok: reasons.length === 0, reasons, blockerCode },
    }],
  };
}

function readWizardProductionPartMediaState(
  part: WizardProductionPipelinePart,
): WizardRealMediaState["parts"][number] {
  const expectedSceneCount = part.expectedSceneCount;
  const rootTopicId = part.record.production?.rootTopicId ?? part.topicId;
  const sampleReview = part.coverLines.length !== 3 && isWizardAvSampleReviewTopic(rootTopicId);
  let expectedTtsContract: ReturnType<typeof buildWizardRealTtsContractSnapshot> | null = null;
  try {
    expectedTtsContract = buildWizardRealTtsContractSnapshot(rootTopicId, part, sampleReview);
  } catch {
    expectedTtsContract = null;
  }
  const expectedVoicePhaseContract = expectedTtsContract?.script.voicePhaseContract as {
    enabled?: boolean;
    contractVersion?: string;
    assembly?: { crossfadeMs?: number };
  } | null | undefined;
  const expectsPhasedTts = expectedVoicePhaseContract?.enabled === true;
  const ttsSummary = readAbsJson(part.ttsSummaryPath) as {
    provider?: string;
    ttsEngineVersion?: string;
    liveApiCallPerformed?: boolean;
    readinessFailure?: boolean;
    missingEnv?: string[];
    timelineAudioPath?: string | null;
    timelineDurationSec?: number | null;
    apiCallCount?: number;
    wizardScriptFingerprint?: string;
    ttsInputContractFingerprint?: string;
    ttsInputContractSha256?: string;
    generationMode?: string;
    voicePhaseContractVersion?: string | null;
    phaseGenerationAudit?: {
      phaseCount?: number;
      phaseOrder?: string[];
      crossfadeMs?: number;
      phases?: Array<{ id?: string; voiceSettingsSanitized?: { speed?: number } }>;
    } | null;
    coverContractVersion?: string | null;
    openingVoiceAudit?: {
      confidentFirstTag?: boolean;
      openingMatchesBodyLead?: boolean;
      providerBoundaryTagRepeated?: boolean | null;
      speedWithinCap?: boolean;
      passed?: boolean;
    };
  } | null;
  const ttsAudioPath = typeof ttsSummary?.timelineAudioPath === "string" ? ttsSummary.timelineAudioPath : null;
  const ttsDuration = typeof ttsSummary?.timelineDurationSec === "number" ? ttsSummary.timelineDurationSec : null;
  const ttsInputContractCurrent =
    expectedTtsContract != null &&
    ttsSummary?.ttsInputContractFingerprint === expectedTtsContract.fingerprint &&
    ttsSummary.ttsInputContractSha256 === expectedTtsContract.sha256;
  const phaseAuditReady = expectsPhasedTts
    ? ttsSummary?.generationMode === "minjae_two_phase_aligned" &&
      ttsSummary.voicePhaseContractVersion === expectedVoicePhaseContract?.contractVersion &&
      ttsSummary.openingVoiceAudit?.openingMatchesBodyLead === true &&
      ttsSummary.openingVoiceAudit?.providerBoundaryTagRepeated === false &&
      ttsSummary.phaseGenerationAudit?.phaseCount === 2 &&
      ttsSummary.phaseGenerationAudit?.phaseOrder?.join(",") === "body,closing" &&
      ttsSummary.phaseGenerationAudit?.crossfadeMs === expectedVoicePhaseContract?.assembly?.crossfadeMs &&
      ttsSummary.phaseGenerationAudit?.phases?.map((phase) => phase.voiceSettingsSanitized?.speed).join(",") === "1.02,1.02"
    : ttsSummary?.openingVoiceAudit?.confidentFirstTag === true;
  const realTtsReady =
    ttsSummary?.provider === "elevenlabs" &&
    ttsSummary.ttsEngineVersion === WIZARD_TTS_ENGINE_VERSION &&
    ttsSummary.wizardScriptFingerprint === part.record.localFingerprint &&
    ttsInputContractCurrent &&
    ttsSummary.liveApiCallPerformed === true &&
    ttsSummary.readinessFailure !== true &&
    ttsSummary.coverContractVersion === WIZARD_STAGED_COVER_CONTRACT_VERSION &&
    phaseAuditReady &&
    ttsSummary.openingVoiceAudit?.speedWithinCap === true &&
    ttsSummary.openingVoiceAudit?.passed === true &&
    ttsAudioPath != null &&
    existsSync(ttsAudioPath) &&
    ttsDuration != null &&
    ttsDuration >= 10 &&
    ttsDuration <= 60;
  const audioSha256 = realTtsReady && ttsAudioPath ? fileSha256(ttsAudioPath) : null;
  const listeningApproval =
    realTtsReady &&
    audioSha256 &&
    typeof ttsSummary?.ttsInputContractSha256 === "string" &&
    typeof ttsSummary.wizardScriptFingerprint === "string" &&
    ttsDuration != null
      ? readWizardTtsOwnerListeningApproval(
          rootTopicId,
          {
            partId: part.id,
            audioSha256,
            ttsInputContractSha256: ttsSummary.ttsInputContractSha256,
            wizardScriptFingerprint: ttsSummary.wizardScriptFingerprint,
            durationSec: ttsDuration,
          },
          wizardTtsOwnerListeningApprovalPath(part),
        )
      : {
          accepted: false,
          qualityApprovalFingerprint: null,
          acceptedAt: null,
        };
  const realTts: WizardRealMediaState["realTts"] = {
    ready: realTtsReady === true,
    qualityAccepted: listeningApproval.accepted,
    qualityApprovalFingerprint: listeningApproval.qualityApprovalFingerprint,
    qualityAcceptedAt: listeningApproval.acceptedAt,
    audioSha256,
    audioPath: realTtsReady ? ttsAudioPath : null,
    durationSec: ttsDuration,
    provider: ttsSummary?.provider ?? null,
    apiCallCount: typeof ttsSummary?.apiCallCount === "number" ? ttsSummary.apiCallCount : null,
    missingEnv: Array.isArray(ttsSummary?.missingEnv)
      ? ttsSummary.missingEnv.filter((key): key is string => typeof key === "string")
      : [],
  };

  const imagesSummary = readAbsJson(join(part.imagesOutDir, "scene-images-summary.json")) as {
    mode?: string;
    visualEngineVersion?: string;
    imageControllerVersion?: string;
    visualModalityVersion?: string;
    allReady?: boolean;
    blockerCode?: string | null;
    manualVisualReview?: {
      version?: string;
      required?: boolean;
      status?: string;
      acceptedForDownstream?: boolean;
      renderAllowed?: boolean;
      evidenceFileName?: string;
    };
    visualDifferenceAudit?: { version?: string; passed?: boolean; checkedCount?: number };
    characterContinuityAudit?: {
      version?: string;
      promptCoveragePassed?: boolean;
      targetedRegenerationPassed?: boolean;
      passed?: boolean;
    };
    visualModalityAudit?: { version?: string; passed?: boolean; sceneContractsPassed?: boolean };
    motionPlanAudit?: {
      version?: string;
      promptCoveragePassed?: boolean;
      evidenceCoveragePassed?: boolean;
      stateCoveragePassed?: boolean;
      passed?: boolean;
    };
    scenes?: Array<{
      sceneIndex?: number;
      file?: string;
      width?: number | null;
      height?: number | null;
      status?: string;
      method?: string | null;
      visualEvidenceId?: string;
      visualModeId?: string;
      presenceMode?: string;
      promptFingerprint?: string;
      imageSha256?: string | null;
      perceptualHash?: string | null;
    }>;
  } | null;
  const sceneRows = Array.isArray(imagesSummary?.scenes) ? imagesSummary.scenes : [];
  const manualVisualReview = validateMoneyShortsManualVisualReview({
    summary: imagesSummary,
    evidence: readAbsJson(join(part.imagesOutDir, MONEY_SHORTS_MANUAL_VISUAL_REVIEW_EVIDENCE_FILE)),
  });
  const savedScenes = sceneRows.filter((scene) => {
    const canonicalFile = wizardCanonicalSceneImagePath(
      part.imagesOutDir,
      typeof scene.sceneIndex === "number" ? scene.sceneIndex : null,
    );
    if (
      scene.status !== "SAVED_OK" ||
      typeof scene.file !== "string" ||
      canonicalFile == null ||
      resolve(scene.file) !== canonicalFile ||
      !existsSync(canonicalFile) ||
      typeof scene.width !== "number" ||
      typeof scene.height !== "number" ||
      scene.width < 900 ||
      scene.height < 1200 ||
      scene.height < Math.round(scene.width * 1.2) ||
      typeof scene.imageSha256 !== "string" ||
      scene.imageSha256.length !== 64
    ) return false;
    try {
      return createHash("sha256").update(readFileSync(canonicalFile)).digest("hex") === scene.imageSha256;
    } catch {
      return false;
    }
  });
  const imageAssetContractReady = sceneRows.length === expectedSceneCount && sceneRows.every((scene, index) =>
    scene.sceneIndex === index + 1 &&
    typeof scene.visualEvidenceId === "string" &&
    scene.visualEvidenceId === part.record.script.scenes[index]?.visualEvidence?.sceneIdentity &&
    typeof scene.visualModeId === "string" &&
    ["character", "hands", "none"].includes(scene.presenceMode ?? "") &&
    typeof scene.promptFingerprint === "string" &&
    scene.promptFingerprint.length === 16 &&
    typeof scene.imageSha256 === "string" &&
    scene.imageSha256.length === 64 &&
    typeof scene.perceptualHash === "string" &&
    scene.perceptualHash.length === 16
  ) && new Set(sceneRows.map((scene) => scene.imageSha256)).size === expectedSceneCount;
  const visualProfile = wizardVisualProfileForTopic(part.record.production?.rootTopicId ?? part.topicId);
  const realImagesTechnicalReady =
    imagesSummary?.mode === "chatgpt_playwright" &&
    imagesSummary.visualEngineVersion === visualProfile.engineVersion &&
    imagesSummary.imageControllerVersion === WIZARD_IMAGE_CONTROLLER_VERSION &&
    imagesSummary.visualModalityVersion === WIZARD_VISUAL_MODALITY_VERSION &&
    imagesSummary.allReady === true &&
    imagesSummary.visualDifferenceAudit?.version === "ffmpeg_dhash64_v1" &&
    imagesSummary.visualDifferenceAudit?.passed === true &&
    imagesSummary.visualDifferenceAudit?.checkedCount === expectedSceneCount &&
    imagesSummary.visualModalityAudit?.version === WIZARD_VISUAL_MODALITY_VERSION &&
    imagesSummary.visualModalityAudit?.passed === true &&
    imagesSummary.visualModalityAudit?.sceneContractsPassed === true &&
    imagesSummary.characterContinuityAudit?.version === FINANCE_VISUAL_CHARACTER_CONTINUITY_VERSION &&
    imagesSummary.characterContinuityAudit?.promptCoveragePassed === true &&
    imagesSummary.characterContinuityAudit?.targetedRegenerationPassed === true &&
    imagesSummary.characterContinuityAudit?.passed === true &&
    imagesSummary.motionPlanAudit?.version === FINANCE_VISUAL_MOTION_CONTRACT_VERSION &&
    imagesSummary.motionPlanAudit?.promptCoveragePassed === true &&
    imagesSummary.motionPlanAudit?.evidenceCoveragePassed === true &&
    imagesSummary.motionPlanAudit?.stateCoveragePassed === true &&
    imagesSummary.motionPlanAudit?.passed === true &&
    savedScenes.length === expectedSceneCount &&
    imageAssetContractReady;
  const realImagesReady = realImagesTechnicalReady && manualVisualReview.passed === true;
  const savedSceneIndexes = new Set(savedScenes.map((scene) => scene.sceneIndex));
  const realImages: WizardRealMediaState["realImages"] = {
    ready: realImagesReady === true,
    reviewable: realImagesTechnicalReady === true,
    generatedCount: savedScenes.length,
    expectedCount: expectedSceneCount,
    dir: part.imagesOutDir,
    blocked: realImagesTechnicalReady && !manualVisualReview.passed
      ? "MANUAL_VISUAL_REVIEW_REQUIRED"
      : typeof imagesSummary?.blockerCode === "string" ? imagesSummary.blockerCode : null,
    blockerDetail: realImagesTechnicalReady && !manualVisualReview.passed
      ? manualVisualReview.reason
      : sceneRows.find((scene) => typeof scene.method === "string" && scene.method !== "")?.method ?? null,
    manualVisualReview: {
      accepted: manualVisualReview.passed === true,
      imageSetSha256: manualVisualReview.imageSetSha256,
      approvalTransactionId: manualVisualReview.approvalTransactionId ?? null,
      reason: manualVisualReview.reason,
    },
    scenes: sceneRows.map((scene) => ({
      sceneIndex: typeof scene.sceneIndex === "number" ? scene.sceneIndex : 0,
      ready: typeof scene.sceneIndex === "number" && savedSceneIndexes.has(scene.sceneIndex),
      imageSha256: typeof scene.imageSha256 === "string" ? scene.imageSha256 : null,
      width: typeof scene.width === "number" ? scene.width : null,
      height: typeof scene.height === "number" ? scene.height : null,
    })).filter((scene) => scene.sceneIndex > 0),
  };

  const videoSummary = readAbsJson(join(part.videoOutDir, "real-video-summary.json")) as {
    schemaVersion?: string;
    status?: string;
    finalMp4Path?: string;
    finalMp4Sha256?: string;
    durationSec?: number;
    width?: number;
    height?: number;
    hasAudioStream?: boolean;
    hasVideoStream?: boolean;
    sizeBytes?: number;
    sceneCount?: number;
    audioProvider?: string;
    audioSha256?: string;
    imageMode?: string;
    imageSetSha256?: string;
    visualEngineVersion?: string;
    motionRendererVersion?: string;
    layeredMotionRendererVersion?: string;
    motionAudit?: WizardLayeredMotionAudit;
    flowMotionAudit?: WizardFlowMotionRenderAudit;
    captionMode?: string;
    captionContractVersion?: string;
    captionLayoutVersion?: string;
    wizardScriptFingerprint?: string;
    coverMode?: string;
    coverContractVersion?: string;
    coverAudit?: {
      semanticWordCoveragePass?: boolean;
      allLinesCharacterAnchored?: boolean;
      normalSceneOneCaptionSuppressed?: boolean;
      stagedLineCount?: number;
      passed?: boolean;
    };
    captionAudit?: {
      layoutVersion?: string;
      twoLineSpacingPass?: boolean;
      fullScriptCoveragePass?: boolean;
      exactTranscriptMatchPass?: boolean;
      perSceneTranscriptMatchPass?: boolean;
      perSceneBlockCountPass?: boolean;
      sceneBoundaryTimingPass?: boolean;
      noCaptionOverlapPass?: boolean;
      captionGapPass?: boolean;
      captionCoverageRatio?: number;
      screenDutyPass?: boolean;
      displayUnitLengthPass?: boolean;
      sentenceSemanticSegmentationPass?: boolean;
      sentenceBoundaryPreservedPass?: boolean;
      sourceSegmentBoundaryPreservedPass?: boolean;
      arbitraryMidPhraseSplitAbsent?: boolean;
      oneWordFragmentAbsent?: boolean;
      displayTerminalPunctuationAbsent?: boolean;
      displayWordCoveragePass?: boolean;
      multiPositionNarrativeFlowPass?: boolean;
      semanticColorPalettePass?: boolean;
      emphasisDensityPass?: boolean;
      highImpactRoleEmphasisPass?: boolean;
      motionDiversityPass?: boolean;
    };
  } | null;
  const mp4Path = typeof videoSummary?.finalMp4Path === "string" ? videoSummary.finalMp4Path : null;
  const caption = videoSummary?.captionAudit;
  const cover = videoSummary?.coverAudit;
  const resolvedMp4Path =
    mp4Path != null ? resolve(mp4Path) : null;
  const mp4PathTrusted =
    resolvedMp4Path != null &&
    resolvedMp4Path.startsWith(WIZARD_VIDEO_ALLOWED_PREFIX) &&
    resolvedMp4Path.toLowerCase().endsWith(".mp4") &&
    existsSync(resolvedMp4Path);
  let currentFinalMp4Sha256: string | null = null;
  let currentFinalMp4SizeBytes: number | null = null;
  if (mp4PathTrusted && resolvedMp4Path) {
    try {
      currentFinalMp4SizeBytes = statSync(resolvedMp4Path).size;
      currentFinalMp4Sha256 = createHash("sha256")
        .update(readFileSync(resolvedMp4Path))
        .digest("hex");
    } catch {
      currentFinalMp4SizeBytes = null;
      currentFinalMp4Sha256 = null;
    }
  }
  const publishMetadata = buildWizardPublishMetadataSnapshot(
    rootTopicId,
    part.platformTitle,
    part.record.script,
  );
  const publishMetadataReady =
    publishMetadata.ok ? publishMetadata : null;
  const renderSummaryHashMatches =
    currentFinalMp4Sha256 != null &&
    videoSummary?.finalMp4Sha256 === currentFinalMp4Sha256;
  const finalVideoReady =
    videoSummary?.schemaVersion === "wizard_real_video_summary_v1" &&
    videoSummary.status === "RENDER_MUX_OK" &&
    videoSummary.audioProvider === "elevenlabs" &&
    typeof realTts.audioSha256 === "string" &&
    videoSummary.audioSha256 === realTts.audioSha256 &&
    videoSummary.imageMode === "chatgpt_playwright" &&
    manualVisualReview.passed === true &&
    videoSummary.imageSetSha256 === manualVisualReview.imageSetSha256 &&
    videoSummary.visualEngineVersion === visualProfile.engineVersion &&
    wizardHybridMotionSummaryIsReady(videoSummary, expectedSceneCount, part.record.script.scenes) &&
    videoSummary.captionMode === "full_script_dynamic_semantic_aligned_v6" &&
    videoSummary.captionContractVersion === WIZARD_FULL_SCRIPT_CAPTION_CONTRACT_VERSION &&
    videoSummary.captionLayoutVersion === WIZARD_CAPTION_LAYOUT_VERSION &&
    videoSummary.wizardScriptFingerprint === part.record.localFingerprint &&
    videoSummary.coverMode === "staged_prehook_v1" &&
    videoSummary.coverContractVersion === WIZARD_STAGED_COVER_CONTRACT_VERSION &&
    cover?.semanticWordCoveragePass === true &&
    cover.allLinesCharacterAnchored === true &&
    cover.normalSceneOneCaptionSuppressed === true &&
    cover.stagedLineCount === 3 &&
    cover.passed === true &&
    caption?.fullScriptCoveragePass === true &&
    caption.layoutVersion === WIZARD_CAPTION_LAYOUT_VERSION &&
    caption.twoLineSpacingPass === true &&
    caption.exactTranscriptMatchPass === true &&
    caption.perSceneTranscriptMatchPass === true &&
    caption.perSceneBlockCountPass === true &&
    caption.sceneBoundaryTimingPass === true &&
    caption.noCaptionOverlapPass === true &&
    caption.captionGapPass === true &&
    caption.captionCoverageRatio === 1 &&
    caption.screenDutyPass === true &&
    caption.displayUnitLengthPass === true &&
    caption.sentenceSemanticSegmentationPass === true &&
    caption.sentenceBoundaryPreservedPass === true &&
    caption.sourceSegmentBoundaryPreservedPass === true &&
    caption.arbitraryMidPhraseSplitAbsent === true &&
    caption.oneWordFragmentAbsent === true &&
    caption.displayTerminalPunctuationAbsent === true &&
    caption.displayWordCoveragePass === true &&
    caption.multiPositionNarrativeFlowPass === true &&
    caption.semanticColorPalettePass === true &&
    caption.emphasisDensityPass === true &&
    caption.highImpactRoleEmphasisPass === true &&
    caption.motionDiversityPass === true &&
    mp4PathTrusted &&
    renderSummaryHashMatches &&
    videoSummary.width === 1080 &&
    videoSummary.height === 1920 &&
    videoSummary.hasAudioStream === true &&
    videoSummary.hasVideoStream === true &&
    typeof videoSummary.durationSec === "number" &&
    videoSummary.durationSec >= 15 &&
    videoSummary.durationSec <= 60 &&
    typeof videoSummary.sizeBytes === "number" &&
    videoSummary.sizeBytes > 0 &&
    currentFinalMp4SizeBytes === videoSummary.sizeBytes &&
    publishMetadataReady != null &&
    videoSummary.sceneCount === expectedSceneCount;
  const finalVideoApproval =
    finalVideoReady &&
    currentFinalMp4Sha256 &&
    publishMetadataReady &&
    realTts.audioSha256 &&
    manualVisualReview.imageSetSha256 &&
    typeof videoSummary?.durationSec === "number" &&
    typeof videoSummary.sizeBytes === "number"
      ? readWizardFinalVideoOwnerApproval(
          rootTopicId,
          {
            partId: part.id,
            wizardScriptFingerprint: part.record.localFingerprint,
            audioSha256: realTts.audioSha256,
            imageSetSha256: manualVisualReview.imageSetSha256,
            finalMp4Sha256: currentFinalMp4Sha256,
            publishMetadataSha256: publishMetadataReady.sha256,
            durationSec: videoSummary.durationSec,
            sizeBytes: videoSummary.sizeBytes,
          },
          wizardFinalVideoOwnerApprovalPath(rootTopicId),
        )
      : {
          accepted: false,
          ownerApprovalFingerprint: null,
          acceptedAt: null,
        };
  const finalVideo: WizardRealMediaState["finalVideo"] = {
    ready: finalVideoReady === true,
    mp4Path: finalVideoReady ? mp4Path : null,
    finalMp4Sha256:
      finalVideoReady ? currentFinalMp4Sha256 : null,
    publishMetadataSha256:
      finalVideoReady && publishMetadataReady
        ? publishMetadataReady.sha256
        : null,
    publishMetadata:
      finalVideoReady && publishMetadataReady
        ? publishMetadataReady.preview
        : null,
    ownerApproved: finalVideoApproval.accepted === true,
    ownerApprovalFingerprint:
      finalVideoApproval.ownerApprovalFingerprint,
    ownerApprovedAt: finalVideoApproval.acceptedAt,
    durationSec: typeof videoSummary?.durationSec === "number" ? videoSummary.durationSec : null,
    width: typeof videoSummary?.width === "number" ? videoSummary.width : null,
    height: typeof videoSummary?.height === "number" ? videoSummary.height : null,
    hasAudio: videoSummary?.hasAudioStream === true,
    sizeBytes: typeof videoSummary?.sizeBytes === "number" ? videoSummary.sizeBytes : null,
  };
  const reasons: string[] = [];
  if (!realTts.ready) reasons.push("실제 음성 또는 확신형 썸네일 음성 게이트가 아직 준비되지 않았습니다");
  else if (!realTts.qualityAccepted) reasons.push("현재 오디오 해시의 Owner 청취 승인이 필요합니다");
  if (!realImages.ready) reasons.push(
    realImages.blocked === "MANUAL_VISUAL_REVIEW_REQUIRED"
      ? "현재 이미지 묶음의 Owner 수동 시각 승인이 필요합니다"
      : `실제 장면 이미지가 부족합니다 (${realImages.generatedCount}/${expectedSceneCount})`,
  );
  if (!finalVideo.ready) reasons.push("검증된 썸네일·자막이 포함된 최종 영상이 아직 없습니다");
  else if (!finalVideo.ownerApproved) reasons.push("현재 최종 MP4와 게시 문구의 Owner 승인이 필요합니다");
  const blockerCode = !realTts.ready
    ? ("REAL_TTS_REQUIRED" as const)
    : !realTts.qualityAccepted
      ? ("REAL_TTS_OWNER_APPROVAL_REQUIRED" as const)
    : realImages.blocked === "MANUAL_VISUAL_REVIEW_REQUIRED"
      ? ("MANUAL_VISUAL_REVIEW_REQUIRED" as const)
    : !realImages.ready
      ? ("REAL_SCENE_IMAGES_REQUIRED" as const)
      : !finalVideo.ready
        ? ("FINAL_MP4_REQUIRED" as const)
        : !finalVideo.ownerApproved
          ? ("FINAL_VIDEO_OWNER_APPROVAL_REQUIRED" as const)
        : null;
  return {
    id: part.id,
    partNumber: part.partNumber,
    totalParts: part.totalParts,
    canonicalTitle: part.canonicalTitle,
    platformTitle: part.platformTitle,
    realTts,
    realImages,
    finalVideo,
    mediaQualityGate: { ok: reasons.length === 0, reasons, blockerCode },
  };
}

/** 편별 산출물을 모두 재검증해 한 편이라도 미완료면 전체 게시를 차단한다. */
export function readWizardRealMediaState(topicId: string): WizardRealMediaState {
  const baseRecord = readWizardFinalScriptRecord(topicId);
  const record = baseRecord ? resolveWizardDurationSafeProductionRecord(topicId, baseRecord) : null;
  const strategy = record?.script.videoStrategy;
  if (!record || !strategy || strategy.contractVersion !== FINANCE_EDITORIAL_VIDEO_STRATEGY_VERSION) {
    return readWizardLegacyRealMediaState(topicId);
  }
  const safeSlug = toSafeTopicSlug(topicId);
  if (!safeSlug) return readWizardLegacyRealMediaState(topicId);
  let plannedParts: WizardProductionPipelinePart[];
  try {
    plannedParts = resolveWizardProductionPipelineParts(topicId, safeSlug, record);
  } catch {
    const blocked = readWizardLegacyRealMediaState(topicId);
    return {
      ...blocked,
      production: { strategyVersion: strategy.contractVersion, mode: strategy.mode, totalParts: strategy.parts.length },
      realTts: { ...blocked.realTts, ready: false, audioPath: null },
      realImages: { ...blocked.realImages, ready: false, expectedCount: null },
      finalVideo: { ...blocked.finalVideo, ready: false, mp4Path: null },
      mediaQualityGate: {
        ok: false,
        reasons: ["의미 분할 제작 계획의 장면 계약을 만들지 못했습니다. 대본을 다시 확정해 주세요."],
        blockerCode: "REAL_TTS_REQUIRED",
      },
      parts: [],
    };
  }
  const parts = plannedParts.map(readWizardProductionPartMediaState);
  const allTtsReady = parts.length > 0 && parts.every((part) => part.realTts.ready);
  const allPartsTtsQualityAccepted =
    allTtsReady && parts.every((part) => part.realTts.qualityAccepted);
  const candidateTtsQualityFingerprint =
    parts[0]?.realTts.qualityApprovalFingerprint ?? null;
  const allTtsQualityAccepted =
    allPartsTtsQualityAccepted &&
    candidateTtsQualityFingerprint != null &&
    parts.every(
      (part) =>
        part.realTts.qualityApprovalFingerprint ===
        candidateTtsQualityFingerprint,
    );
  const sharedTtsQualityFingerprint = allTtsQualityAccepted
    ? candidateTtsQualityFingerprint
    : null;
  const sharedTtsQualityAcceptedAt = allTtsQualityAccepted
    ? parts[0]?.realTts.qualityAcceptedAt ?? null
    : null;
  const allImagesReviewable = parts.length > 0 && parts.every((part) => part.realImages.reviewable);
  const imageApprovalTransaction = validateMoneyShortsManualVisualReviewTransaction(
    parts.map((part) => ({
      ready: part.realImages.ready,
      approvalTransactionId: part.realImages.manualVisualReview.approvalTransactionId,
    })),
  );
  const allImagesReady = imageApprovalTransaction.passed === true;
  const imageApprovalTransactionMismatch =
    imageApprovalTransaction.reason === "MANUAL_VISUAL_REVIEW_TRANSACTION_MISMATCH";
  const manualVisualReviewBlocked = parts.some((part) => part.realImages.blocked === "MANUAL_VISUAL_REVIEW_REQUIRED");
  const aggregateImageSetSha256 = allImagesReviewable
    ? createHash("sha256").update(JSON.stringify(parts.map((part) => ({
        partId: part.id,
        imageSetSha256: part.realImages.manualVisualReview.imageSetSha256,
      })))).digest("hex")
    : null;
  const allVideosReady = parts.length > 0 && parts.every((part) => part.finalVideo.ready);
  const candidateFinalVideoApprovalFingerprint =
    parts[0]?.finalVideo.ownerApprovalFingerprint ?? null;
  const allVideosOwnerApproved =
    allVideosReady &&
    candidateFinalVideoApprovalFingerprint != null &&
    parts.every(
      (part) =>
        part.finalVideo.ownerApproved === true &&
        part.finalVideo.ownerApprovalFingerprint ===
          candidateFinalVideoApprovalFingerprint,
    );
  const aggregateFinalMp4Sha256 =
    allVideosReady &&
    parts.every((part) => part.finalVideo.finalMp4Sha256 != null)
      ? createHash("sha256")
          .update(
            JSON.stringify(
              parts.map((part) => ({
                partId: part.id,
                finalMp4Sha256: part.finalVideo.finalMp4Sha256,
              })),
            ),
          )
          .digest("hex")
      : null;
  const aggregatePublishMetadataSha256 =
    allVideosReady &&
    parts.every(
      (part) => part.finalVideo.publishMetadataSha256 != null,
    )
      ? createHash("sha256")
          .update(
            JSON.stringify(
              parts.map((part) => ({
                partId: part.id,
                publishMetadataSha256:
                  part.finalVideo.publishMetadataSha256,
              })),
            ),
          )
          .digest("hex")
      : null;
  const totalDuration = parts.reduce((sum, part) => sum + (part.realTts.durationSec ?? 0), 0);
  const totalVideoDuration = parts.reduce((sum, part) => sum + (part.finalVideo.durationSec ?? 0), 0);
  const totalImages = parts.reduce((sum, part) => sum + part.realImages.generatedCount, 0);
  const expectedImages = parts.reduce((sum, part) => sum + (part.realImages.expectedCount ?? 0), 0);
  const totalBytes = parts.reduce((sum, part) => sum + (part.finalVideo.sizeBytes ?? 0), 0);
  const reasons = parts.flatMap((part) => part.mediaQualityGate.reasons.map((reason) =>
    `${part.totalParts > 1 ? `${part.partNumber}편` : "영상"}: ${reason}`));
  if (allTtsReady && !allTtsQualityAccepted) {
    reasons.unshift("전체 편이 동일한 현재 오디오 묶음으로 Owner 청취 승인되지 않았습니다");
  }
  if (imageApprovalTransactionMismatch) {
    reasons.unshift("전체 편이 하나의 동일한 현재 이미지 Owner 승인으로 묶이지 않았습니다");
  }
  if (
    allVideosReady &&
    !allVideosOwnerApproved &&
    parts.some((part) => part.finalVideo.ownerApproved)
  ) {
    reasons.unshift("전체 편이 하나의 동일한 현재 최종 영상 Owner 승인으로 묶이지 않았습니다");
  }
  const blockerCode = !allTtsReady
    ? ("REAL_TTS_REQUIRED" as const)
    : !allTtsQualityAccepted
      ? ("REAL_TTS_OWNER_APPROVAL_REQUIRED" as const)
    : manualVisualReviewBlocked || imageApprovalTransactionMismatch
      ? ("MANUAL_VISUAL_REVIEW_REQUIRED" as const)
    : !allImagesReady
      ? ("REAL_SCENE_IMAGES_REQUIRED" as const)
      : !allVideosReady
        ? ("FINAL_MP4_REQUIRED" as const)
        : !allVideosOwnerApproved
          ? ("FINAL_VIDEO_OWNER_APPROVAL_REQUIRED" as const)
        : null;
  return {
    production: { strategyVersion: strategy.contractVersion, mode: strategy.mode, totalParts: parts.length },
    scriptEngine: {
      finalReady: true,
      mode: record.mode,
      note: record.polish.note,
      rewriteNotes: record.polish.rewriteNotes,
      polishDisabled: isClaudePolishDisabled(),
      anthropicKeyPresent: typeof process.env.ANTHROPIC_API_KEY === "string" && process.env.ANTHROPIC_API_KEY !== "",
      elevenLabsKeyPresent:
        typeof process.env.ELEVENLABS_API_KEY === "string" && process.env.ELEVENLABS_API_KEY !== "" &&
        typeof process.env.ELEVENLABS_VOICE_ID === "string" && process.env.ELEVENLABS_VOICE_ID !== "",
    },
    realTts: {
      ready: allTtsReady,
      qualityAccepted: allTtsQualityAccepted,
      qualityApprovalFingerprint: sharedTtsQualityFingerprint,
      qualityAcceptedAt: sharedTtsQualityAcceptedAt,
      audioSha256:
        parts.length === 1 ? parts[0]?.realTts.audioSha256 ?? null : null,
      audioPath: parts[0]?.realTts.audioPath ?? null,
      durationSec: totalDuration > 0 ? Number(totalDuration.toFixed(3)) : null,
      provider: parts.every((part) => part.realTts.provider === "elevenlabs") ? "elevenlabs" : null,
      apiCallCount: parts.reduce((sum, part) => sum + (part.realTts.apiCallCount ?? 0), 0),
      missingEnv: [...new Set(parts.flatMap((part) => part.realTts.missingEnv))],
    },
    realImages: {
      ready: allImagesReady,
      reviewable: allImagesReviewable,
      generatedCount: totalImages,
      expectedCount: expectedImages,
      dir: parts[0]?.realImages.dir ?? null,
      blocked: imageApprovalTransactionMismatch
        ? "MANUAL_VISUAL_REVIEW_REQUIRED"
        : parts.find((part) => part.realImages.blocked)?.realImages.blocked ?? null,
      blockerDetail: imageApprovalTransactionMismatch
        ? imageApprovalTransaction.reason
        : parts.find((part) => part.realImages.blockerDetail)?.realImages.blockerDetail ?? null,
      manualVisualReview: {
        accepted: allImagesReady,
        imageSetSha256: aggregateImageSetSha256,
        approvalTransactionId: allImagesReady ? imageApprovalTransaction.approvalTransactionId : null,
        reason: allImagesReady
          ? null
          : imageApprovalTransactionMismatch
            ? imageApprovalTransaction.reason
            : parts.find((part) => part.realImages.manualVisualReview.reason)?.realImages.manualVisualReview.reason ?? null,
      },
      scenes: parts.flatMap((part) => part.realImages.scenes),
    },
    finalVideo: {
      ready: allVideosReady,
      mp4Path: parts[0]?.finalVideo.mp4Path ?? null,
      finalMp4Sha256: aggregateFinalMp4Sha256,
      publishMetadataSha256: aggregatePublishMetadataSha256,
      publishMetadata:
        parts.length === 1
          ? parts[0]?.finalVideo.publishMetadata ?? null
          : null,
      ownerApproved: allVideosOwnerApproved,
      ownerApprovalFingerprint: allVideosOwnerApproved
        ? candidateFinalVideoApprovalFingerprint
        : null,
      ownerApprovedAt: allVideosOwnerApproved
        ? parts[0]?.finalVideo.ownerApprovedAt ?? null
        : null,
      durationSec: totalVideoDuration > 0 ? Number(totalVideoDuration.toFixed(3)) : null,
      width: parts.every((part) => part.finalVideo.width === 1080) ? 1080 : null,
      height: parts.every((part) => part.finalVideo.height === 1920) ? 1920 : null,
      hasAudio: parts.every((part) => part.finalVideo.hasAudio),
      sizeBytes: totalBytes > 0 ? totalBytes : null,
    },
    mediaQualityGate: { ok: blockerCode === null && reasons.length === 0, reasons, blockerCode },
    parts,
  };
}
