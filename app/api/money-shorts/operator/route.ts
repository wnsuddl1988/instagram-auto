/**
 * /api/money-shorts/operator — 웹 운영 콘솔의 safe local control API.
 *
 * task: owner-web-operator-ui-local-control-v1
 * task: owner-web-auto-topic-refresh-and-upload-button-v1 (새 주제 추천 + 확인 게이트형 실제 업로드)
 *
 * GET  → 런타임 기본 상태(로컬 dev 여부, 실행 가능한 버튼, 업로드 키 준비 여부)
 * POST → { action, ...입력 } 형태의 고정 enum action 실행
 *
 * 이 route가 **하지 않는 것**(가드가 강제):
 * - 임의 명령/셸 문자열 실행, 브라우저發 임의 경로/명령 입력
 * - `.env`/`.env.local` 직접 read
 * - credential 값 또는 값 파생(길이/prefix/suffix/hash/masked) 출력
 *
 * 실제 업로드(actualUpload)는 이 route의 유일한 live 경로이며 전부 fail-closed다:
 * 로컬 dev 전용 + Owner 확인 게이트(체크 2개 + "업로드" 입력) 서버 검증 + 영상/게시 전 점검
 * evidence 필수 + 이미 게시된 콘텐츠 차단 + runner 자체 gate(승인/중복/ledger/원샷/--arm).
 *
 * 모든 실행은 lib/owner-web-operator.ts의 하드코딩된 스크립트 목록을 통해서만 이뤄지며,
 * spawnSync(process.execPath, argsArray, { shell:false, timeout, cwd:repoRoot })만 사용한다.
 */

import { NextResponse } from "next/server";

import {
  APPROVED_ENV_KEY_NAMES,
  LOCAL_ONLY_BLOCKER,
  OPERATOR_ACTIONS,
  type OperatorAction,
  WIZARD_CATEGORY_IDS,
  type WizardCategoryId,
  WIZARD_FINANCE_SUBTOPIC_IDS,
  WIZARD_EDITORIAL_DECISIONS,
  type WizardFinanceSubtopicId,
  buildOperatorCommand,
  buildWizardContentUnitsForTopic,
  buildWizardRealPipelineInputs,
  canWizardTopicEnterScript,
  ensureWizardFinalScript,
  generateWizardTopicBatchSmart,
  getWizardScriptQualityGate,
  isLocalDevRuntime,
  listWizardUploadReadyItems,
  markWizardTopicHistory,
  prepareWizardFlowMotionPackets,
  readCredentialPresence,
  readFinalE2ePreflightResult,
  readScriptPreview,
  readVoiceSampleStatus,
  readWizardPublishPreflight,
  readWizardPublishResult,
  readWizardRealAudioBytes,
  readWizardFinanceCharacterCastState,
  readWizardFinanceCharacterImageBytes,
  readWizardFlowMotionStatus,
  readWizardRealMediaState,
  resolveWizardFinanceCharacterVoice,
  readWizardVideoBytes,
  readWizardVideoStatus,
  runOperatorScript,
  saveWizardFinanceCharacterSelection,
  saveWizardTopicEditorialDecision,
} from "@/lib/owner-web-operator";
import {
  FINANCE_CHARACTER_IDS,
  type FinanceCharacterId,
} from "@/lib/finance-character-cast";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 로컬 실행/로컬 파일이 필요한 action(배포 사이트에서는 차단). */
const LOCAL_SCRIPT_ACTIONS: OperatorAction[] = [
  "credentialPreflight",
  "readyPreflight",
  "readyDuplicateGuard",
  "finalE2ePreflight",
  "topicRecommend",
  "topicPreference",
  "scriptPreview",
  "voiceSample",
  "videoCreate",
  "previewStatus",
  "wizardPreflight",
  "actualUpload",
  "uploadReadyList",
  "characterCastStatus",
  "characterCastCreate",
  "characterCastSelect",
  "realTtsCreate",
  "realSceneImagesCreate",
  "flowMotionPrepare",
  "finalVideoCreate",
  "realMediaStatus",
];

/** actualUpload 확인 게이트에서 요구하는 입력 문구(Owner가 직접 타이핑). */
const UPLOAD_CONFIRM_TEXT = "업로드";

/** 실제 업로드는 Blob 업로드 + IG 폴링 + YT 업로드로 2분을 넘길 수 있어 별도 timeout을 쓴다. */
const UPLOAD_TIMEOUT_MS = 300_000;

// 실제 제작 단계별 timeout — 실행 스크립트가 도는 동안 dev 서버가 다른 요청을 처리하지
// 못하므로(Owner 단독 로컬 사용 전제) UI가 "몇 분 걸릴 수 있음"을 함께 안내한다.
// 음성: 전체 대본 연속 합성 / 이미지: 남은 동적 장면 수 × 최대 180s + 브라우저 기동
// / 최종 영상: 확정 대본의 흐름 기반 동적 장면 렌더 + 자막·음성 결합.
const REAL_TTS_TIMEOUT_MS = 240_000;
const REAL_IMAGE_BASE_TIMEOUT_MS = 120_000;
const REAL_IMAGE_PER_SCENE_TIMEOUT_MS = 190_000;
const REAL_IMAGES_MAX_TIMEOUT_MS = 3_540_000;
const FINAL_VIDEO_TIMEOUT_MS = 300_000;
const CHARACTER_CAST_TIMEOUT_MS = 480_000;

/** 업로드 차단 시 사용자 문구(media quality gate — 시안/테스트 산출물 업로드 금지). */
const MEDIA_GATE_USER_MESSAGE = "아직 실제 음성/실제 장면 이미지가 들어간 최종 영상이 아닙니다. 업로드를 막았습니다.";

type OperatorStatus = "success" | "blocked" | "error";

type OperatorResponse = {
  action: OperatorAction;
  status: OperatorStatus;
  /** 사람이 읽는 한 줄 요약(UI가 그대로 보여준다). */
  summary: string;
  /** 부가 설명(선택). */
  detail?: string;
  blockerCode?: string;
  /** raw JSON — UI의 <details> 안에만 표시된다. secret 없음. */
  raw?: unknown;
  /**
   * 이 응답을 만드는 과정에서 실제 게시 경로(runner `--arm`)가 시작되지 않았으면 true.
   * 대부분의 action(읽기 전용/preflight/차단)은 항상 true다.
   * `actualUpload`에서 확인 게이트를 통과해 arm runner를 실제로 spawn한 뒤의 응답
   * (성공/timeout/부분게시/실패)만 false다 — 그 경우 외부 게시가 일어났을 수 있다.
   */
  noLive: boolean;
  /**
   * arm runner(`--arm`)를 실제로 실행(spawn)했으면 true. `actualUpload`가 확인 게이트를
   * 통과해 runOperatorScript(..., allowArm:true)를 호출한 응답에만 붙는다.
   * arm 이전 차단(확인 미완료/build 실패/spawn 실패)에는 붙지 않는다. secret 값은 담지 않는다.
   */
  liveRunnerInvoked?: boolean;
};

const PRODUCTION_NOTICE =
  "이 기능은 로컬 실행 화면에서만 동작합니다. 배포 사이트에서는 상태 확인만 가능합니다.";

function json(body: OperatorResponse, httpStatus = 200) {
  return NextResponse.json(body, { status: httpStatus });
}

function describeTopicFallbackReason(reason?: string): string {
  if (!reason) return "원인 코드를 받지 못했습니다.";
  if (reason === "anthropic_api_key_missing") {
    return "서버 런타임에 ANTHROPIC_API_KEY가 없습니다. 로컬 환경파일 저장 후 pnpm dev를 다시 시작해야 합니다.";
  }
  if (reason === "claude_topic_generation_disabled" || reason === "claude_topic_generation_disabled_by_runtime") {
    return "현재 화면에서 Claude 주제 생성이 꺼져 있습니다.";
  }
  if (reason === "claude_topic_generation_finance_only") {
    return "Claude 신규 생성은 현재 재테크팁 카테고리에만 연결돼 있습니다.";
  }
  if (reason === "anthropic_timeout") {
    return "Claude 응답 시간이 너무 길어 중단됐습니다. 요청을 가볍게 조정했으니 다시 눌러 주세요.";
  }
  if (reason === "anthropic_api_json_parse_failed") {
    return "Anthropic API 응답 자체를 JSON으로 읽지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (reason === "anthropic_topic_json_parse_failed") {
    return "Claude가 주제 JSON 형식으로 답하지 않아 버렸습니다. 객체/배열 JSON 본문을 더 유연하게 읽도록 보정했습니다. 다시 눌러 주세요.";
  }
  if (reason === "anthropic_call_failed" || reason.startsWith("anthropic_call_failed_")) {
    const code = reason.replace(/^anthropic_call_failed_?/, "") || "unknown";
    return `Claude 연결이 실패했습니다 (${code}). 네트워크, VPN, 방화벽, 로컬 서버 상태를 확인해 주세요.`;
  }
  if (reason.startsWith("anthropic_http_401") || reason.startsWith("anthropic_http_403")) {
    return "Anthropic API 키 인증이 실패했습니다. 키 이름과 권한을 확인해야 합니다.";
  }
  if (reason.startsWith("anthropic_http_400")) {
    return "Anthropic 요청이 거부됐습니다. 모델 이름(ANTHROPIC_TOPIC_MODEL 또는 ANTHROPIC_POLISH_MODEL)을 확인해야 할 수 있습니다.";
  }
  if (reason.startsWith("anthropic_http_")) {
    return `Anthropic API가 오류를 반환했습니다 (${reason}).`;
  }
  if (reason === "anthropic_no_text") {
    return "Claude 응답에 읽을 수 있는 텍스트가 없어 로컬 백업 주제를 보여줬습니다.";
  }
  if (reason === "anthropic_topics_not_array") {
    return "Claude 응답에서 주제 목록 배열을 찾지 못해 로컬 백업 주제를 보여줬습니다.";
  }
  if (reason === "anthropic_no_valid_topic_seed") {
    return "Claude 응답에 제목으로 쓸 수 있는 주제가 없어 로컬 백업 주제를 보여줬습니다.";
  }
  if (reason === "claude_topics_filtered_out") {
    return "Claude가 만든 후보가 기존 주제와 비슷하거나 품질 기준을 통과하지 못했습니다.";
  }
  if (reason === "claude_topics_below_recommendation_floor") {
    return "Claude가 후보를 만들었지만 추천급 주제가 충분하지 않아 보여주지 않았습니다. 다시 누르면 새 후보를 요청합니다.";
  }
  return `원인 코드: ${reason}`;
}

function describeImageToolBlocker(detail: string | null): string {
  if (detail?.startsWith("IMAGE_TOOL_TEXT_RESPONSE:")) {
    return "ChatGPT 이미지 만들기에서 신규 이미지로 한 번 다시 요청했지만 편집 요청으로 잘못 처리되어 중단했습니다. 일반 채팅이나 반복 요청으로 이어지지 않게 막았습니다.";
  }
  if (detail && /activation marker|pre-submit verification|post-type verification|final submit verification|pill disappeared/i.test(detail)) {
    return "ChatGPT에서 이미지 만들기 칩은 선택됐지만 활성 상태 확인 신호를 읽지 못해 전송 전에 중단했습니다. 화면을 새로고침한 뒤 다시 시도해 주세요.";
  }
  if (detail?.startsWith("IMAGE_TOOL_ENTRY_MISSING:")) {
    return "ChatGPT의 이미지 만들기 메뉴를 찾지 못해 전송 전에 중단했습니다. ChatGPT 화면을 새로고침한 뒤 다시 시도해 주세요.";
  }
  if (detail?.startsWith("IMAGE_TOOL_ENTRY_UNUSABLE:")) {
    return "ChatGPT의 이미지 만들기 메뉴가 응답하지 않아 첫 장면 전송 전에 중단했습니다. ChatGPT 화면을 새로고침한 뒤 다시 시도해 주세요.";
  }
  if (detail?.startsWith("IMAGE_TOOL_OWNER_DRAFT_PRESENT:")) {
    return "일반 ChatGPT 새 대화에 작성 중인 초안이 있어, 내용을 지우지 않고 이미지 생성을 중단했습니다. 해당 초안을 보내거나 다른 곳에 보관한 뒤 다시 시도해 주세요.";
  }
  if (detail?.startsWith("IMAGE_TOOL_CHAT_OPEN_FAILED:") || detail === "IMAGE_TOOL_TEMPORARY_CHAT_UNSUPPORTED") {
    return "ChatGPT 이미지용 일반 새 대화를 열지 못해 첫 장면 전송 전에 중단했습니다. 열린 ChatGPT 창을 정리하고 다시 시도해 주세요.";
  }
  return "ChatGPT 이미지 만들기 모드를 안전하게 확인하지 못해 전송 전에 중단했습니다. 화면을 새로고침한 뒤 다시 시도해 주세요.";
}

// ── GET: 기본 상태 + 시안 영상 스트림 ────────────────────────────────────────

function videoStreamResponse(bytes: Buffer, rangeHeader: string | null): Response {
  const totalBytes = bytes.byteLength;
  const commonHeaders = {
    "Content-Type": "video/mp4",
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-store",
  };
  if (!rangeHeader) {
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: { ...commonHeaders, "Content-Length": String(totalBytes) },
    });
  }

  const rangeMatch = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
  if (!rangeMatch) {
    return new Response(null, {
      status: 416,
      headers: { ...commonHeaders, "Content-Range": `bytes */${totalBytes}` },
    });
  }
  const requestedStart = rangeMatch[1] === "" ? null : Number(rangeMatch[1]);
  const requestedEnd = rangeMatch[2] === "" ? null : Number(rangeMatch[2]);
  const start = requestedStart === null
    ? Math.max(0, totalBytes - (requestedEnd ?? 0))
    : requestedStart;
  const end = requestedStart === null
    ? totalBytes - 1
    : Math.min(totalBytes - 1, requestedEnd ?? totalBytes - 1);
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= totalBytes) {
    return new Response(null, {
      status: 416,
      headers: { ...commonHeaders, "Content-Range": `bytes */${totalBytes}` },
    });
  }
  const chunk = bytes.subarray(start, end + 1);
  return new Response(new Uint8Array(chunk), {
    status: 206,
    headers: {
      ...commonHeaders,
      "Content-Length": String(chunk.byteLength),
      "Content-Range": `bytes ${start}-${end}/${totalBytes}`,
    },
  });
}

export async function GET(request: Request) {
  // 시안 영상 미리보기 스트림. 클라이언트는 경로가 아니라 enum("muxed"|"silent")만 보낸다.
  // 실제 파일 경로는 파이프라인 summary에서만 나오고 helper가 C:\tmp 허용 prefix를 강제한다.
  const url = new URL(request.url);
  const videoParam = url.searchParams.get("video");

  if (url.searchParams.get("image") === "character") {
    if (!isLocalDevRuntime()) {
      return json(
        { action: "characterCastStatus", status: "blocked", summary: PRODUCTION_NOTICE, blockerCode: LOCAL_ONLY_BLOCKER, noLive: true },
        404,
      );
    }
    const candidateNumber = Number(url.searchParams.get("candidate"));
    const image = readWizardFinanceCharacterImageBytes(
      url.searchParams.get("characterId"),
      Number.isInteger(candidateNumber) ? candidateNumber : null,
    );
    if (!image) {
      return json(
        { action: "characterCastStatus", status: "blocked", summary: "아직 주인공 후보 이미지가 없습니다.", blockerCode: "CHARACTER_CANDIDATE_NOT_FOUND", noLive: true },
        404,
      );
    }
    return new Response(new Uint8Array(image.bytes), {
      status: 200,
      headers: {
        "Content-Type": image.contentType,
        "Content-Length": String(image.bytes.byteLength),
        "Cache-Control": "no-store",
      },
    });
  }
  if (videoParam === "muxed" || videoParam === "silent" || videoParam === "final") {
    if (!isLocalDevRuntime()) {
      return json(
        { action: "previewStatus", status: "blocked", summary: PRODUCTION_NOTICE, blockerCode: LOCAL_ONLY_BLOCKER, noLive: true },
        404,
      );
    }
    // topicId는 helper가 [a-z0-9-] slug로 정화하므로 경로 조작이 불가능하다.
    const streamTopicId = url.searchParams.get("topicId");
    const bytes = readWizardVideoBytes(videoParam, streamTopicId, url.searchParams.get("part"));
    if (!bytes) {
      return json(
        { action: "previewStatus", status: "blocked", summary: "아직 영상 파일이 없습니다. 먼저 영상을 만들어 주세요.", blockerCode: "WIZARD_VIDEO_NOT_FOUND", noLive: true },
        404,
      );
    }
    return videoStreamResponse(bytes, request.headers.get("range"));
  }

  // 실제 목소리 스트림 — 경로는 TTS summary에서만 나오고 C:\tmp 허용 prefix가 강제된다.
  if (url.searchParams.get("audio") === "real") {
    if (!isLocalDevRuntime()) {
      return json(
        { action: "realMediaStatus", status: "blocked", summary: PRODUCTION_NOTICE, blockerCode: LOCAL_ONLY_BLOCKER, noLive: true },
        404,
      );
    }
    const audio = readWizardRealAudioBytes(url.searchParams.get("topicId"), url.searchParams.get("part"));
    if (!audio) {
      return json(
        { action: "realMediaStatus", status: "blocked", summary: "아직 실제 음성 파일이 없습니다. 먼저 [실제 목소리 만들기]를 눌러 주세요.", blockerCode: "REAL_TTS_REQUIRED", noLive: true },
        404,
      );
    }
    return new Response(new Uint8Array(audio.bytes), {
      status: 200,
      headers: {
        "Content-Type": audio.contentType,
        "Content-Length": String(audio.bytes.byteLength),
        "Cache-Control": "no-store",
      },
    });
  }

  return statusResponse();
}

function statusResponse() {
  const localDev = isLocalDevRuntime();
  const presence = readCredentialPresence();
  const readyCount = APPROVED_ENV_KEY_NAMES.filter((k) => presence[k] === true).length;

  return json({
    action: "status",
    status: "success",
    summary: localDev
      ? "로컬 실행 화면입니다. 아래 버튼으로 준비 상태를 확인할 수 있습니다."
      : "배포 사이트입니다. 상태 확인만 가능하고, 실제 준비 작업은 로컬 화면에서 실행합니다.",
    detail: PRODUCTION_NOTICE,
    raw: {
      localDev,
      // key 이름 + present boolean만. 값/길이/prefix/hash 없음.
      credentialKeyNames: [...APPROVED_ENV_KEY_NAMES],
      credentialPresence: presence,
      credentialReadyCount: readyCount,
      credentialRequiredCount: APPROVED_ENV_KEY_NAMES.length,
      availableActions: [...OPERATOR_ACTIONS],
      localScriptActions: LOCAL_SCRIPT_ACTIONS,
      // 실제 업로드는 로컬 화면에서만, 영상 생성 + 게시 전 점검 통과 + 확인 게이트
      // (체크 2개 + "업로드" 입력) 후에만 실행된다. 배포 사이트에서는 로컬 파일이 없어 불가.
      actualUploadAvailableOnLocalDev: localDev,
      actualUploadNote: localDev
        ? "실제 업로드는 영상 생성 + 게시 전 점검 통과 + 확인(체크 2개 + \"업로드\" 입력) 후 버튼이 켜지면 실행됩니다."
        : "실제 업로드는 Owner PC의 로컬 실행 화면에서만 가능합니다. 배포 사이트에서는 상태 확인·안내만 됩니다.",
    },
    noLive: true,
  });
}

// ── POST: action 실행 ─────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(
      { action: "status", status: "error", summary: "요청 형식이 올바르지 않습니다.", blockerCode: "INVALID_JSON_BODY", noLive: true },
      400,
    );
  }

  const rawAction = (body as { action?: unknown } | null)?.action;
  if (typeof rawAction !== "string" || !(OPERATOR_ACTIONS as readonly string[]).includes(rawAction)) {
    return json(
      {
        action: "status",
        status: "error",
        summary: "허용되지 않은 작업입니다.",
        blockerCode: "UNSUPPORTED_ACTION",
        noLive: true,
      },
      400,
    );
  }
  const action = rawAction as OperatorAction;

  // status는 스크립트를 실행하지 않는다.
  if (action === "status") {
    return statusResponse();
  }

  // 배포 사이트에서는 로컬 스크립트 실행 action을 차단한다.
  if (LOCAL_SCRIPT_ACTIONS.includes(action) && !isLocalDevRuntime()) {
    return json({
      action,
      status: "blocked",
      summary: PRODUCTION_NOTICE,
      detail: "실제 생성은 Owner PC에서 로컬 실행 화면으로 진행합니다.",
      blockerCode: LOCAL_ONLY_BLOCKER,
      noLive: true,
    });
  }

  // ── 위저드 읽기 전용/생성 action (spawn 없음; topicRecommend는 로컬 dev에서 Claude 주제 생성 시도 가능) ──
  if (action === "topicPreference") {
    const topicIdRaw = (body as { topicId?: unknown }).topicId;
    const decisionRaw = (body as { decision?: unknown }).decision;
    if (
      typeof topicIdRaw !== "string" ||
      typeof decisionRaw !== "string" ||
      !(WIZARD_EDITORIAL_DECISIONS as readonly string[]).includes(decisionRaw)
    ) {
      return json({
        action,
        status: "error",
        summary: "주제와 편집 판정을 확인해 주세요.",
        blockerCode: "INVALID_TOPIC_PREFERENCE",
        noLive: true,
      }, 400);
    }
    const saved = saveWizardTopicEditorialDecision(
      topicIdRaw,
      decisionRaw as (typeof WIZARD_EDITORIAL_DECISIONS)[number],
    );
    if (!saved.ok) {
      return json({
        action,
        status: "error",
        summary: "편집 판정을 저장하지 못했습니다.",
        detail: saved.reason,
        blockerCode: "TOPIC_PREFERENCE_SAVE_FAILED",
        noLive: true,
      }, 500);
    }
    const label = saved.topic.editorialDecision === "make" ? "만든다" : saved.topic.editorialDecision === "maybe" ? "애매" : "버린다";
    return json({
      action,
      status: "success",
      summary: `이 주제를 '${label}'로 저장했습니다.`,
      detail: saved.topic.editorialDecision === "make" ? "이 후보는 바로 선택되어 대본을 만들 수 있습니다." : "다음 추천에서는 이 후보를 제외합니다.",
      raw: { topic: saved.topic, editorialSummary: saved.summary },
      noLive: true,
    });
  }

  // ── 완성 영상 불러오기 목록: 최종 MP4는 있지만 양쪽 게시 완료 전인 항목만 읽는다. ──
  if (action === "uploadReadyList") {
    const items = listWizardUploadReadyItems();
    return json({
      action,
      status: "success",
      summary: items.length > 0 ? `업로드 대기 영상 ${items.length}개를 찾았습니다.` : "업로드 대기 중인 완성 영상이 없습니다.",
      detail: "양쪽 플랫폼 게시이 모두 완료된 영상은 이 목록에 표시하지 않습니다.",
      raw: { items },
      noLive: true,
    });
  }

  if (action === "characterCastStatus") {
    const cast = readWizardFinanceCharacterCastState();
    return json({
      action,
      status: "success",
      summary: cast.allSelected
        ? "재테크 영상 주인공 4명의 기준 이미지가 모두 선택됐습니다."
        : `재테크 영상 주인공 기준 이미지 ${cast.selectedCount}/4명이 선택됐습니다.`,
      detail: "선택 결과는 로컬에만 저장되며 영상이나 외부 계정에는 게시되지 않습니다.",
      raw: { cast },
      noLive: true,
    });
  }

  if (action === "characterCastCreate") {
    const characterIdRaw = (body as { characterId?: unknown }).characterId;
    if (typeof characterIdRaw !== "string" || !(FINANCE_CHARACTER_IDS as readonly string[]).includes(characterIdRaw)) {
      return json({
        action,
        status: "error",
        summary: "후보 이미지를 만들 주인공을 확인해 주세요.",
        blockerCode: "FINANCE_CHARACTER_INVALID",
        noLive: true,
      }, 400);
    }
    const characterId = characterIdRaw as FinanceCharacterId;
    const regenerateCharacterCandidates = (body as { regenerate?: unknown }).regenerate === true;
    const built = buildOperatorCommand(action, { characterId, regenerateCharacterCandidates });
    if (!built.ok) {
      return json({ action, status: "blocked", summary: "주인공 후보 이미지 생성 준비에 실패했습니다.", detail: built.reason, blockerCode: built.reason, noLive: true });
    }
    const run = runOperatorScript(built.command, {
      timeoutMs: CHARACTER_CAST_TIMEOUT_MS,
      extraEnv: { ALLOW_CHATGPT_IMAGE: "1" },
    });
    if (!run.ran || run.timedOut) {
      return json({
        action,
        status: "error",
        summary: run.timedOut ? "주인공 후보 이미지 생성 시간이 초과됐습니다. 다시 누르면 준비된 후보는 재사용합니다." : "주인공 후보 이미지 생성기를 실행하지 못했습니다.",
        blockerCode: run.timedOut ? "SCRIPT_TIMEOUT" : "SCRIPT_NOT_RUN",
        noLive: true,
      });
    }
    const cast = readWizardFinanceCharacterCastState();
    const character = cast.characters.find((candidate) => candidate.id === characterId);
    if (character?.candidatesReady) {
      return json({
        action,
        status: "success",
        summary: `${character.name} 주인공 후보 이미지 ${cast.candidateCount}장이 준비됐습니다.`,
        detail: "두 후보를 비교한 뒤 한 장을 기준 이미지로 선택해 주세요.",
        raw: { cast },
        noLive: true,
      });
    }
    return json({
      action,
      status: "blocked",
      summary: "주인공 후보 이미지가 모두 준비되지 않았습니다. ChatGPT 이미지 화면을 확인한 뒤 다시 시도해 주세요.",
      blockerCode: character?.blockerCode ?? "CHARACTER_CANDIDATES_INCOMPLETE",
      raw: { cast, exitCode: run.exitCode },
      noLive: true,
    });
  }

  if (action === "characterCastSelect") {
    const characterIdRaw = (body as { characterId?: unknown }).characterId;
    const candidateNumberRaw = (body as { candidateNumber?: unknown }).candidateNumber;
    if (
      typeof characterIdRaw !== "string" ||
      !(FINANCE_CHARACTER_IDS as readonly string[]).includes(characterIdRaw) ||
      typeof candidateNumberRaw !== "number" ||
      !Number.isInteger(candidateNumberRaw)
    ) {
      return json({
        action,
        status: "error",
        summary: "선택할 주인공 후보를 확인해 주세요.",
        blockerCode: "FINANCE_CHARACTER_SELECTION_INVALID",
        noLive: true,
      }, 400);
    }
    const saved = saveWizardFinanceCharacterSelection(characterIdRaw, candidateNumberRaw);
    if (!saved.ok) {
      return json({
        action,
        status: "blocked",
        summary: "준비가 끝난 후보만 기준 이미지로 선택할 수 있습니다.",
        detail: saved.reason,
        blockerCode: saved.reason,
        noLive: true,
      });
    }
    const selected = saved.state.characters.find((character) => character.id === characterIdRaw);
    return json({
      action,
      status: "success",
      summary: `${selected?.name ?? "주인공"}의 ${candidateNumberRaw}번 이미지를 기준으로 선택했습니다.`,
      detail: saved.state.allSelected
        ? "4명의 기준 이미지가 모두 선택됐습니다. 다음 단계에서는 선택 이미지를 참조해 장면 보드를 검수합니다."
        : `현재 ${saved.state.selectedCount}/4명이 선택됐습니다.`,
      raw: { cast: saved.state },
      noLive: true,
    });
  }

  if (action === "topicRecommend") {
    // 카테고리는 고정 enum으로만 받는다(그 외 값은 기본 카테고리로 폴백).
    const categoryRaw = (body as { category?: unknown }).category;
    const category: WizardCategoryId =
      typeof categoryRaw === "string" && (WIZARD_CATEGORY_IDS as readonly string[]).includes(categoryRaw)
        ? (categoryRaw as WizardCategoryId)
        : "finance";
    const financeSubtopicRaw = (body as { financeSubtopic?: unknown }).financeSubtopic;
    const financeSubtopic: WizardFinanceSubtopicId | null =
      category === "finance" &&
      typeof financeSubtopicRaw === "string" &&
      (WIZARD_FINANCE_SUBTOPIC_IDS as readonly string[]).includes(financeSubtopicRaw)
        ? (financeSubtopicRaw as WizardFinanceSubtopicId)
        : null;
    // 새 500개 은행을 먼저 사용하고, 소진 뒤에는 만든다/버린다 데이터를 포함한
    // Claude 확장 엔진을 사용한다.
    const batch = await generateWizardTopicBatchSmart(category, { allowClaude: true, financeSubtopic });
    if (!batch) {
      return json({
        action,
        status: "error",
        summary: "사용하지 않은 고정 주제가 모두 소진됐고 새 주제 생성도 완료되지 않았습니다.",
        blockerCode: "TOPIC_BATCH_GENERATION_FAILED",
        noLive: true,
      });
    }
    return json({
      action,
      status: "success",
      summary: financeSubtopic ? `선택한 소분야에서 새 주제 ${batch.topics.length}개를 만들었습니다.` : `새 주제 ${batch.topics.length}개를 만들었습니다.`,
      detail:
        batch.source === "editorial_bank"
          ? "새 500개 주제은행에서 서로 다른 느낌의 후보를 골랐습니다. 문제·반전·행동까지 보고 판정해 주세요."
          : batch.source === "claude_generated"
          ? "Claude가 새 후보를 만들고, 이미 본/선택/제작한 주제와 비슷한 것은 제외했습니다."
          : `Claude 신규 생성이 안 돼 로컬 백업 주제를 보여줬습니다. 원인: ${describeTopicFallbackReason(batch.fallbackReason)}`,
      raw: {
        topics: batch.topics,
        batchId: batch.batchId,
        category: batch.category,
        financeSubtopic: batch.financeSubtopic,
        source: batch.source,
        generationNote: batch.generationNote,
        fallbackReason: batch.fallbackReason,
        fallbackReasonText: batch.fallbackReason ? describeTopicFallbackReason(batch.fallbackReason) : undefined,
        model: batch.model,
        excludedKnownTitleCount: batch.excludedKnownTitleCount,
        rejectedTopics: batch.rejected,
        editorialSummary: batch.editorialSummary,
      },
      noLive: true,
    });
  }

  if (action === "scriptPreview") {
    const topicIdRaw = (body as { topicId?: unknown }).topicId;
    const topicId = typeof topicIdRaw === "string" ? topicIdRaw : "";
    if (topicId && !canWizardTopicEnterScript(topicId)) {
      return json({
        action,
        status: "blocked",
        summary: "먼저 이 후보를 '만든다'로 판정해 주세요.",
        detail: "애매하거나 버린 후보는 대본·음성·이미지 제작에 들어가지 않습니다.",
        blockerCode: "TOPIC_EDITORIAL_APPROVAL_REQUIRED",
        noLive: true,
      });
    }
    const preview = topicId ? readScriptPreview(topicId) : null;
    if (!preview) {
      return json({
        action,
        status: "blocked",
        summary: "이 주제는 대본 엔진 연결 전입니다. 다음 승인 후 연결됩니다.",
        detail: "지금은 이미 준비된 주제(대본 준비됨 표시)만 대본을 바로 만들 수 있습니다.",
        blockerCode: "SCRIPT_NOT_COMPILED_FOR_TOPIC",
        noLive: true,
      });
    }
    const localQualityGate = getWizardScriptQualityGate(topicId, preview);
    if (!localQualityGate.passed) {
      return json({
        action,
        status: "blocked",
        summary: `대본 품질 기준을 통과하지 못했습니다 (${localQualityGate.overallScore ?? "?"}/${localQualityGate.minimumScore ?? "?"}점).`,
        detail: `${localQualityGate.reasons[0] ?? "재테크 대본 품질 기준을 다시 확인해 주세요."} 실제 목소리·이미지·영상 단계는 시작하지 않았습니다.`,
        blockerCode: "SCRIPT_QUALITY_GATE_FAILED",
        raw: { script: preview, scriptQualityGate: localQualityGate },
        noLive: true,
      });
    }
    // 대본 생성 방식: 로컬 후보 선별(judge 최고 후보) → Claude 1회 보정.
    // 보정은 로컬 dev 런타임에서만 시도하고(배포 사이트는 로컬 산출물 저장 불가),
    // 키 없음/실패/검증 실패/점수 회귀 시 로컬 대본을 그대로 쓴다. 같은 대본은 재호출하지 않는다.
    const record = await ensureWizardFinalScript(topicId, preview, { allowPolish: isLocalDevRuntime() });
    const finalQualityGate = getWizardScriptQualityGate(topicId, record.script);
    if (!finalQualityGate.passed) {
      return json({
        action,
        status: "blocked",
        summary: `보정 후 대본이 품질 기준을 통과하지 못했습니다 (${finalQualityGate.overallScore ?? "?"}/${finalQualityGate.minimumScore ?? "?"}점).`,
        detail: `${finalQualityGate.reasons[0] ?? "재테크 대본 품질 기준을 다시 확인해 주세요."} 실제 목소리·이미지·영상 단계는 시작하지 않았습니다.`,
        blockerCode: "SCRIPT_QUALITY_GATE_FAILED",
        raw: { script: record.script, scriptQualityGate: finalQualityGate },
        noLive: true,
      });
    }
    markWizardTopicHistory("selected", [record.script]);
    markWizardTopicHistory("scripted", [record.script]);
    return json({
      action,
      status: "success",
      summary:
        record.mode === "claude_polished"
          ? `대본이 준비됐습니다 (Claude 보정 적용됨). 훅: "${record.script.hook}"`
          : `대본이 준비됐습니다 (로컬 대본). 훅: "${record.script.hook}"`,
      detail:
        record.mode === "claude_polished"
          ? "대본 생성 방식: 로컬 후보 선별 → Claude 1회 보정. 이 확정 대본이 실제 목소리/장면 이미지/최종 영상에 그대로 쓰입니다."
          : `대본 생성 방식: 로컬 후보 선별 → Claude 1회 보정. ${record.polish.note}`,
      raw: {
        script: record.script,
        scriptEngine: {
          mode: record.mode,
          claudeApplied: record.polish.applied,
          note: record.polish.note,
          reasonCode: record.polish.reasonCode,
          model: record.polish.model,
          rewriteNotes: record.polish.rewriteNotes,
          localScore: record.polish.localScore,
          polishedScore: record.polish.polishedScore,
        },
      },
      noLive: true,
    });
  }

  if (action === "previewStatus") {
    const topicIdRaw = (body as { topicId?: unknown }).topicId;
    const previewTopicId = typeof topicIdRaw === "string" ? topicIdRaw : null;
    const video = readWizardVideoStatus(previewTopicId);
    if (!video.exists) {
      return json({
        action,
        status: "blocked",
        summary: "아직 영상 파일이 없습니다. 먼저 [영상 만들기]를 눌러 주세요.",
        blockerCode: "WIZARD_VIDEO_NOT_FOUND",
        raw: { video },
        noLive: true,
      });
    }
    const mb = video.muxedMp4Bytes ? (video.muxedMp4Bytes / (1024 * 1024)).toFixed(2) : "?";
    const titleNote = video.topicTitle ? `"${video.topicTitle}" 주제로 만든 ` : "";
    return json({
      action,
      status: "success",
      summary: `${titleNote}시안 영상이 준비되어 있습니다 (${mb}MB). 아래에서 바로 재생할 수 있습니다.`,
      detail: "이 파일은 Owner PC에만 있습니다. 어디에도 업로드되지 않았습니다.",
      raw: { video },
      noLive: true,
    });
  }

  // ── 실제 제작 파이프라인 (task: owner-web-real-script-voice-visual-generation-pipeline-v1) ──

  // 실제 음성/이미지/최종 영상 준비 상태 + media quality gate (읽기 전용, spawn 없음).
  if (action === "realMediaStatus") {
    const topicIdRaw = (body as { topicId?: unknown }).topicId;
    const topicId = typeof topicIdRaw === "string" ? topicIdRaw : "";
    const media = readWizardRealMediaState(topicId);
    const flowMotion = readWizardFlowMotionStatus(topicId);
    const g = media.mediaQualityGate;
    return json({
      action,
      status: "success",
      summary: g.ok
        ? "실제 음성·장면 이미지·최종 영상이 모두 준비됐습니다. 게시 전 점검으로 진행할 수 있습니다."
        : `실제 제작 진행 중 — ${g.reasons[0] ?? "다음 단계를 진행해 주세요."}`,
      raw: { media, flowMotion },
      noLive: true,
    });
  }

  // Flow 모션 준비 — 자동 선정 장면의 로컬 패킷/상태만 만든다. 브라우저·업로드·생성·크레딧 0.
  if (action === "flowMotionPrepare") {
    const topicIdRaw = (body as { topicId?: unknown }).topicId;
    const topicId = typeof topicIdRaw === "string" ? topicIdRaw : "";
    const result = prepareWizardFlowMotionPackets(topicId);
    if (!result.ok) {
      const needsImages = result.reason.startsWith("flow_motion_scene_images_required:");
      return json({
        action,
        status: "blocked",
        summary: needsImages
          ? "먼저 자동 선정 장면의 기준 이미지를 모두 만들어 주세요."
          : "Flow 모션 작업 패킷을 준비하지 못했습니다.",
        detail: "브라우저 접근·업로드·생성 전송·크레딧 사용은 발생하지 않았습니다.",
        blockerCode: result.reason,
        noLive: true,
      });
    }
    const status = result.status;
    return json({
      action,
      status: "success",
      summary: status.requiredCount === 0
        ? "이 영상에는 Flow 모션이 필요한 장면이 없어 정지 이미지 흐름을 유지합니다."
        : `Flow 모션 후보 ${status.requiredCount}개의 패킷이 준비됐습니다. 현재 상태는 생성 승인 대기입니다.`,
      detail: "장면 이미지·프롬프트 해시를 고정한 로컬 패킷만 만들었습니다. 브라우저 접근·업로드·생성 전송·크레딧 사용은 0회입니다.",
      raw: { flowMotion: status },
      noLive: true,
    });
  }

  // 실제 목소리 만들기 — 확정 대본 기반 ElevenLabs 고정 목소리 TTS(Owner 버튼 클릭 시에만 호출).
  if (action === "realTtsCreate") {
    const topicIdRaw = (body as { topicId?: unknown }).topicId;
    const topicId = typeof topicIdRaw === "string" ? topicIdRaw : "";
    const pipeline = buildWizardRealPipelineInputs(topicId);
    if (!pipeline.ok) {
      return json({ action, status: "blocked", summary: describeBuildFailure(pipeline.reason), blockerCode: pipeline.reason, noLive: true });
    }
    const financeVoiceRoute = resolveWizardFinanceCharacterVoice(topicId);
    if (financeVoiceRoute && !financeVoiceRoute.ok) {
      return json({
        action,
        status: "blocked",
        summary: "재테크 주제의 승인 화자를 찾지 못해 실제 음성 생성을 막았습니다.",
        blockerCode: financeVoiceRoute.reason,
        noLive: true,
      });
    }
    const ttsRuns = [];
    for (const part of pipeline.paths.parts) {
      const builtTts = buildOperatorCommand(action, { topicId, productionPartId: part.id });
      if (!builtTts.ok) {
        return json({ action, status: "blocked", summary: describeBuildFailure(builtTts.reason), blockerCode: builtTts.reason, noLive: true });
      }
      // includeMediaEnv:true 는 이 action(실제 TTS 생성) child에만 ELEVENLABS 키를 전달한다.
      const runTts = runOperatorScript(builtTts.command, {
        timeoutMs: REAL_TTS_TIMEOUT_MS,
        includeMediaEnv: true,
        voiceOverride: financeVoiceRoute?.route.voice,
      });
      ttsRuns.push({ partId: part.id, run: runTts });
      if (!runTts.ran || runTts.timedOut) {
        return json({
          action,
          status: "error",
          summary: `${part.totalParts > 1 ? `${part.partNumber}편 ` : ""}음성 생성이 시간 안에 끝나지 않았습니다. 다시 시도해 주세요.`,
          blockerCode: runTts.timedOut ? "SCRIPT_TIMEOUT" : "SCRIPT_NOT_RUN",
          noLive: true,
        });
      }
    }
    const mediaAfterTts = readWizardRealMediaState(topicId);
    if (mediaAfterTts.realTts.ready) {
      return json({
        action,
        status: "success",
        summary: `실제 목소리 ${mediaAfterTts.production.totalParts}개가 준비됐습니다 (합계 ${mediaAfterTts.realTts.durationSec?.toFixed(1) ?? "?"}초). 아래에서 편별로 바로 들어볼 수 있습니다.`,
        detail: financeVoiceRoute?.route
          ? `${financeVoiceRoute.route.characterName} 화자의 ${financeVoiceRoute.route.voice.voiceLabel} 보이스와 공통 한국어 발화 기준으로 전체 대본을 한 흐름으로 합성했습니다. 파일은 Owner PC에만 있습니다.`
          : "주제별 화자 태도와 한국어 말끝을 적용해 전체 대본을 한 흐름으로 합성한 실제 음성입니다. 파일은 Owner PC에만 있습니다.",
        raw: {
          realTts: mediaAfterTts.realTts,
          financeVoice: financeVoiceRoute?.route
            ? {
                characterId: financeVoiceRoute.route.characterId,
                characterName: financeVoiceRoute.route.characterName,
                voiceLabel: financeVoiceRoute.route.voice.voiceLabel,
              }
            : null,
        },
        noLive: true,
      });
    }
    const missing = mediaAfterTts.realTts.missingEnv;
    if (missing.length > 0) {
      return json({
        action,
        status: "blocked",
        summary: "실제 음성 키가 없어 생성하지 못했습니다. 테스트 소리는 업로드할 수 없습니다.",
        detail: `누락 키: ${missing.join(", ")} — 로컬 환경 파일에 채운 뒤 dev 서버를 다시 시작해 주세요. (키 값은 화면/기록에 절대 나오지 않습니다)`,
        blockerCode: "REAL_TTS_KEY_MISSING",
        raw: { missingEnv: missing },
        noLive: true,
      });
    }
    return json({
      action,
      status: "blocked",
      summary: "실제 음성 생성이 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.",
      blockerCode: "REAL_TTS_FAILED",
      raw: { realTts: mediaAfterTts.realTts, parts: mediaAfterTts.parts.map((part) => ({ id: part.id, realTts: part.realTts })), exitCodes: ttsRuns.map((row) => row.run.exitCode) },
      noLive: true,
    });
  }

  // 장면 이미지 만들기 — ChatGPT+Playwright(로그인된 Chrome) 흐름 기반 실제 이미지(Owner 클릭 시에만).
  if (action === "realSceneImagesCreate") {
    const topicIdRaw = (body as { topicId?: unknown }).topicId;
    const topicId = typeof topicIdRaw === "string" ? topicIdRaw : "";
    const pipeline = buildWizardRealPipelineInputs(topicId);
    if (!pipeline.ok) {
      return json({ action, status: "blocked", summary: describeBuildFailure(pipeline.reason), blockerCode: pipeline.reason, noLive: true });
    }
    const mediaBeforeImg = readWizardRealMediaState(topicId);
    const imageRuns = [];
    for (const part of pipeline.paths.parts) {
      const builtImg = buildOperatorCommand(action, { topicId, productionPartId: part.id });
      if (!builtImg.ok) {
        return json({ action, status: "blocked", summary: describeBuildFailure(builtImg.reason), blockerCode: builtImg.reason, noLive: true });
      }
      const partBefore = mediaBeforeImg.parts.find((candidate) => candidate.id === part.id);
      const expectedScenes = Math.max(1, partBefore?.realImages.expectedCount ?? part.expectedSceneCount);
      const countedRemainingScenes = expectedScenes - (partBefore?.realImages.generatedCount ?? 0);
      const remainingScenes = countedRemainingScenes <= 0 ? expectedScenes : Math.max(1, countedRemainingScenes);
      const imageTimeoutMs = Math.min(
        REAL_IMAGES_MAX_TIMEOUT_MS,
        REAL_IMAGE_BASE_TIMEOUT_MS + remainingScenes * REAL_IMAGE_PER_SCENE_TIMEOUT_MS,
      );
      // ALLOW_CHATGPT_IMAGE=1 은 이 action의 Owner 클릭이 곧 승인이라는 하드코딩 마커다(secret 아님).
      const runImg = runOperatorScript(builtImg.command, { timeoutMs: imageTimeoutMs, extraEnv: { ALLOW_CHATGPT_IMAGE: "1" } });
      imageRuns.push({ partId: part.id, run: runImg });
      if (!runImg.ran || runImg.timedOut) {
        const launchFailureCode = !runImg.ran
          ? (runImg.stderr.trim().split(/\s+/)[0] || "SCRIPT_NOT_RUN")
          : "SCRIPT_TIMEOUT";
        return json({
          action,
          status: "error",
          summary: runImg.timedOut
            ? `${part.totalParts > 1 ? `${part.partNumber}편 ` : ""}이미지 생성이 시간 안에 끝나지 않았습니다. 다시 누르면 모자란 장면만 이어서 생성합니다.`
            : "이미지 생성 프로그램을 실행하지 못했습니다.",
          detail: !runImg.ran ? `실행 진단: ${launchFailureCode}` : undefined,
          blockerCode: runImg.timedOut ? "SCRIPT_TIMEOUT" : launchFailureCode,
          raw: { partId: part.id, launchFailureCode },
          noLive: true,
        });
      }
    }
    const mediaAfterImg = readWizardRealMediaState(topicId);
    if (mediaAfterImg.realImages.ready) {
      return json({
        action,
        status: "success",
        summary: `영상 ${mediaAfterImg.production.totalParts}개에 필요한 장면 이미지 ${mediaAfterImg.realImages.expectedCount ?? "?"}장이 모두 준비됐습니다.`,
        detail: "대본의 장면별 시각 사건과 분위기 전환에 맞춘 실제 이미지입니다. 업로드는 아직 하지 않았습니다.",
        raw: { realImages: mediaAfterImg.realImages },
        noLive: true,
      });
    }
    const blocked = mediaAfterImg.realImages.blocked;
    return json({
      action,
      status: "blocked",
      summary:
        blocked === "BLOCKED_SESSION"
          ? "ChatGPT 로그인 세션이 없어 이미지를 만들지 못했습니다. Chrome(AI-GPT-1 프로필)에서 로그인 후 다시 시도해 주세요."
          : blocked === "BLOCKED_IMAGE_TOOL"
            ? describeImageToolBlocker(mediaAfterImg.realImages.blockerDetail)
          : blocked === "BLOCKED_RATE_OR_CAPTCHA"
            ? "ChatGPT 사용 한도/보안 확인에 걸렸습니다. 잠시 후 다시 시도해 주세요."
            : `장면 이미지가 아직 부족합니다 (${mediaAfterImg.realImages.generatedCount}/${mediaAfterImg.realImages.expectedCount ?? "?"}). 다시 누르면 모자란 장면만 이어서 생성합니다.`,
      blockerCode: blocked ?? "REAL_IMAGES_INCOMPLETE",
      raw: { realImages: mediaAfterImg.realImages, parts: mediaAfterImg.parts.map((part) => ({ id: part.id, realImages: part.realImages })), exitCodes: imageRuns.map((row) => row.run.exitCode) },
      noLive: true,
    });
  }

  // 최종 영상 만들기 — 실제 음성 + 흐름 기반 실제 이미지 + 자막 + 모션 합성(로컬 ffmpeg만).
  if (action === "finalVideoCreate") {
    const topicIdRaw = (body as { topicId?: unknown }).topicId;
    const topicId = typeof topicIdRaw === "string" ? topicIdRaw : "";
    const pipeline = buildWizardRealPipelineInputs(topicId);
    if (!pipeline.ok) {
      return json({ action, status: "blocked", summary: describeBuildFailure(pipeline.reason), blockerCode: pipeline.reason, noLive: true });
    }
    const videoRuns = [];
    for (const part of pipeline.paths.parts) {
      const builtVid = buildOperatorCommand(action, { topicId, productionPartId: part.id });
      if (!builtVid.ok) {
        return json({ action, status: "blocked", summary: describeBuildFailure(builtVid.reason), blockerCode: builtVid.reason, noLive: true });
      }
      const runVid = runOperatorScript(builtVid.command, { timeoutMs: FINAL_VIDEO_TIMEOUT_MS });
      videoRuns.push({ partId: part.id, run: runVid });
      if (!runVid.ran || runVid.timedOut) {
        return json({
          action,
          status: "error",
          summary: runVid.timedOut
            ? `${part.totalParts > 1 ? `${part.partNumber}편 ` : ""}영상 합성이 시간 안에 끝나지 않았습니다. 다시 시도해 주세요.`
            : "영상 합성 프로그램을 실행하지 못했습니다.",
          blockerCode: runVid.timedOut ? "SCRIPT_TIMEOUT" : "SCRIPT_NOT_RUN",
          noLive: true,
        });
      }
    }
    const mediaAfterVid = readWizardRealMediaState(topicId);
    if (mediaAfterVid.finalVideo.ready) {
      const finalScript = topicId ? readScriptPreview(topicId) : null;
      if (finalScript) markWizardTopicHistory("video_created", [finalScript]);
      const mb = mediaAfterVid.finalVideo.sizeBytes ? (mediaAfterVid.finalVideo.sizeBytes / (1024 * 1024)).toFixed(2) : "?";
      return json({
        action,
        status: "success",
        summary: `최종 영상 ${mediaAfterVid.production.totalParts}개가 준비됐습니다 (합계 ${mediaAfterVid.finalVideo.durationSec ?? "?"}초, ${mb}MB). 미리보기에서 편별로 재생됩니다.`,
        detail: "선정 장면은 검수 완료 Veo 클립, 나머지는 실제 장면 이미지로 합성한 업로드 후보 영상입니다. 아직 업로드는 하지 않았습니다.",
        raw: { finalVideo: mediaAfterVid.finalVideo, mediaQualityGate: mediaAfterVid.mediaQualityGate },
        noLive: true,
      });
    }
    return json({
      action,
      status: "blocked",
      summary: "최종 영상 검증을 통과하지 못했습니다. 실제 음성/이미지를 확인한 뒤 다시 시도해 주세요.",
      blockerCode: "FINAL_MP4_VALIDATION_FAILED",
      raw: { finalVideo: mediaAfterVid.finalVideo, parts: mediaAfterVid.parts.map((part) => ({ id: part.id, finalVideo: part.finalVideo })), exitCodes: videoRuns.map((row) => row.run.exitCode) },
      noLive: true,
    });
  }

  // ── 게시 전 점검(wizardPreflight): 선택 주제 영상 기준, --arm 없음(외부 호출 0) ──
  if (action === "wizardPreflight") {
    const topicIdRaw = (body as { topicId?: unknown }).topicId;
    const topicId = typeof topicIdRaw === "string" ? topicIdRaw : "";
    const contentUnits = buildWizardContentUnitsForTopic(topicId);
    if (!contentUnits.ok) {
      return json({
        action,
        status: "blocked",
        summary: describeBuildFailure(contentUnits.reason),
        blockerCode: contentUnits.reason,
        noLive: true,
      });
    }
    const preflights = [];
    for (const unit of contentUnits.paths) {
      const builtPf = buildOperatorCommand(action, { topicId, productionPartId: unit.productionPartId });
      if (!builtPf.ok) {
        return json({ action, status: "blocked", summary: describeBuildFailure(builtPf.reason), blockerCode: builtPf.reason, noLive: true });
      }
      const runPf = runOperatorScript(builtPf.command);
      if (!runPf.ran || runPf.timedOut) {
        return json({
          action,
          status: "error",
          summary: `${unit.totalParts > 1 ? `${unit.partNumber}편 ` : ""}게시 전 점검을 실행하지 못했습니다. 잠시 후 다시 시도해 주세요.`,
          blockerCode: runPf.timedOut ? "SCRIPT_TIMEOUT" : "SCRIPT_NOT_RUN",
          noLive: true,
        });
      }
      const pf = readWizardPublishPreflight(topicId, unit.productionPartId);
      preflights.push({ partId: unit.productionPartId, preflight: pf });
      if (runPf.exitCode !== 0 || pf?.status !== "PREFLIGHT_ONLY_OK") {
        const pfBlocker = pf?.blockerCode ?? extractRunnerBlocker(runPf.stdout, runPf.stderr);
        return json({
          action,
          status: "blocked",
          summary: describeUploadBlocker(pfBlocker, `${unit.partNumber}편 게시 전 점검에서 막혔습니다.`),
          blockerCode: pfBlocker ?? "WIZARD_PREFLIGHT_FAILED",
          raw: { preflights },
          noLive: true,
        });
      }
    }
    const credentialCount = preflights[0]?.preflight?.credentialPresentCount ?? "?";
    return json({
      action,
      status: "success",
      summary: `영상 ${contentUnits.paths.length}개의 게시 전 점검을 모두 통과했습니다. 업로드 키 ${credentialCount}/6, 중복 게시 없음.`,
      detail: "확인만 했고 업로드는 하지 않았습니다. 이제 마지막 단계에서 확인 절차 후 모든 편을 순서대로 업로드할 수 있습니다.",
      raw: { preflights },
      noLive: true,
    });
  }

  // ── 실제 업로드(actualUpload): 이 route의 유일한 live 경로 — 전 게이트 fail-closed ──
  if (action === "actualUpload") {
    const b = body as {
      topicId?: unknown;
      confirmReviewed?: unknown;
      confirmDiscoveryReady?: unknown;
      confirmPublish?: unknown;
      confirmText?: unknown;
    };
    const topicId = typeof b.topicId === "string" ? b.topicId : "";
    // [게이트 1] Owner 명시 확인 — 영상/발견성/실게시 체크 3개 + "업로드" 직접 입력을 서버에서 검증한다.
    if (b.confirmReviewed !== true || b.confirmDiscoveryReady !== true || b.confirmPublish !== true || b.confirmText !== UPLOAD_CONFIRM_TEXT) {
      return json({
        action,
        status: "blocked",
        summary: `업로드 확인 절차가 완료되지 않았습니다. 확인 3개를 체크하고 "${UPLOAD_CONFIRM_TEXT}"를 직접 입력해 주세요.`,
        blockerCode: "UPLOAD_CONFIRMATION_REQUIRED",
        noLive: true,
      });
    }
    // [게이트 1.5] media quality gate 서버 재검증 — 실제 TTS + 실제 장면 이미지 + 검증된 최종 mp4가
    // 전부 준비된 경우에만 진행한다. 테스트 소리/색상 카드/시안 mp4는 여기서 차단된다(fail-closed).
    const mediaGate = readWizardRealMediaState(topicId);
    if (!mediaGate.mediaQualityGate.ok) {
      return json({
        action,
        status: "blocked",
        summary: MEDIA_GATE_USER_MESSAGE,
        detail: mediaGate.mediaQualityGate.reasons.join(" · "),
        blockerCode: mediaGate.mediaQualityGate.blockerCode ?? "MEDIA_QUALITY_GATE_NOT_READY",
        raw: { mediaQualityGate: mediaGate.mediaQualityGate },
        noLive: true,
      });
    }
    // [게이트 2] 모든 편의 영상/대본/게시 전 점검 evidence/이미 게시 차단을 arm 전에 먼저 검증한다.
    const contentUnits = buildWizardContentUnitsForTopic(topicId);
    if (!contentUnits.ok) {
      return json({
        action,
        status: "blocked",
        summary: describeBuildFailure(contentUnits.reason),
        blockerCode: contentUnits.reason,
        noLive: true,
      });
    }
    const uploadCommands = [];
    for (const unit of contentUnits.paths) {
      const builtUp = buildOperatorCommand(action, { topicId, productionPartId: unit.productionPartId });
      if (!builtUp.ok) {
        return json({
          action,
          status: "blocked",
          summary: describeBuildFailure(builtUp.reason),
          blockerCode: builtUp.reason,
          noLive: true,
        });
      }
      uploadCommands.push({ unit, command: builtUp.command });
    }

    // [게이트 3] 실행 — allowArm은 이 지점에서만 부여되며 1편부터 순서대로 게시한다.
    const published = [];
    for (const entry of uploadCommands) {
      const runUp = runOperatorScript(entry.command, { allowArm: true, timeoutMs: UPLOAD_TIMEOUT_MS });
      if (!runUp.ran) {
        return json({
          action,
          status: "error",
          summary: `${entry.unit.partNumber}편 업로드 실행을 시작하지 못했습니다.`,
          blockerCode: "SCRIPT_NOT_RUN",
          raw: { published },
          noLive: published.length === 0,
          liveRunnerInvoked: published.length > 0,
        });
      }
      if (runUp.timedOut) {
        return json({
          action,
          status: "error",
          summary: `${entry.unit.partNumber}편 업로드가 시간 안에 끝나지 않았습니다. 계정에 일부 게시됐을 수 있으니 직접 확인해 주세요.`,
          blockerCode: "UPLOAD_TIMEOUT_MANUAL_CHECK_REQUIRED",
          raw: { published, timedOutPartId: entry.unit.productionPartId },
          noLive: false,
          liveRunnerInvoked: true,
        });
      }
      const result = readWizardPublishResult(topicId, entry.unit.productionPartId);
      if (runUp.exitCode === 0 && result?.status === "PUBLISHED_DUAL_PLATFORM_OK") {
        published.push({
          partId: entry.unit.productionPartId,
          partNumber: entry.unit.partNumber,
          instagramMediaId: result.instagramMediaId,
          youtubeVideoId: result.youtubeVideoId,
          youtubeUrl: result.youtubeUrl,
          ledgerRecordedKeys: result.ledgerRecordedKeys,
        });
        continue;
      }
      const upBlocker =
        (runUp.exitCode !== 0 ? extractRunnerBlocker(runUp.stdout, runUp.stderr) : null) ?? result?.blockerCode ?? null;
      const partial = runUp.exitCode !== 0 && result?.partialExternalState === "instagram_published_youtube_failed";
      return json({
        action,
        status: "blocked",
        summary: partial
          ? `${entry.unit.partNumber}편은 인스타그램에 게시됐지만 유튜브 업로드가 실패했습니다. 직접 확인이 필요합니다.`
          : describeUploadBlocker(upBlocker, `${entry.unit.partNumber}편 업로드가 실행됐지만 완료되지 않았습니다.`),
        blockerCode: upBlocker ?? "UPLOAD_FAILED",
        raw: {
          published,
          failedPartId: entry.unit.productionPartId,
          instagramMediaId: result?.instagramMediaId ?? null,
          partialExternalState: result?.partialExternalState ?? null,
        },
        noLive: false,
        liveRunnerInvoked: true,
      });
    }
    return json({
      action,
      status: "success",
      summary: `업로드 완료! 영상 ${published.length}개를 인스타그램과 유튜브에 순서대로 게시하고 기록했습니다.`,
      detail: published.map((part) => `${part.partNumber}편 유튜브: ${part.youtubeUrl ?? "?"} · 인스타그램 ID: ${part.instagramMediaId ?? "?"}`).join(" · "),
      raw: { published },
      noLive: false,
      liveRunnerInvoked: true,
    });
  }

  const input = body as { contentUnitPath?: string; ledgerPath?: string; outDir?: string; topicId?: string };
  const built = buildOperatorCommand(action, input);
  if (!built.ok) {
    // 대본 없는 주제로 영상 만들기를 시도하면 fail-closed(다른 주제로 몰래 만들지 않는다).
    const isVideoTopicBlock =
      action === "videoCreate" &&
      (built.reason === "script_not_compiled_for_topic" || built.reason === "topic_id_invalid_or_empty");
    return json({
      action,
      status: isVideoTopicBlock ? "blocked" : "error",
      summary: describeBuildFailure(built.reason),
      blockerCode: built.reason,
      noLive: true,
    });
  }

  const run = runOperatorScript(built.command);
  if (!run.ran) {
    return json({
      action,
      status: "error",
      summary: "점검 프로그램을 실행하지 못했습니다.",
      detail: run.stderr,
      blockerCode: "SCRIPT_NOT_RUN",
      noLive: true,
    });
  }
  if (run.timedOut) {
    return json({
      action,
      status: "error",
      summary: "점검이 시간 안에 끝나지 않았습니다. 잠시 후 다시 시도해 주세요.",
      blockerCode: "SCRIPT_TIMEOUT",
      noLive: true,
    });
  }

  // finalE2ePreflight runner는 결과를 stdout이 아니라 out-dir 파일에 쓴다(stdout은 경로만).
  // 그 파일이 있으면 그것을 판정 근거로 쓰고, 없으면 stdout/stderr로 폴백한다.
  // out-dir은 buildOperatorCommand가 이미 절대경로로 검증한 값을 그대로 사용한다.
  let parsed = run.json;
  if (action === "finalE2ePreflight") {
    const outDirIdx = built.command.args.indexOf("--out-dir");
    const validatedOutDir = outDirIdx !== -1 ? built.command.args[outDirIdx + 1] : null;
    if (validatedOutDir) parsed = readFinalE2ePreflightResult(validatedOutDir) ?? run.json;
  }

  return json(interpret(action, run.exitCode, parsed, run.stderr, input.topicId ?? null));
}

// ── 결과 해석: 사람이 읽는 요약을 서버에서 만든다 ─────────────────────────────

function describeBuildFailure(reason: string): string {
  if (reason === "contentUnitPath_not_found") return "콘텐츠 정보 파일을 찾을 수 없습니다. 경로를 다시 확인해 주세요.";
  if (reason === "script_not_compiled_for_topic")
    return "이 주제의 대본을 찾지 못했습니다. [주제 추천받기]로 주제를 고른 뒤 다시 시도해 주세요.";
  if (reason === "topic_id_invalid_or_empty")
    return "먼저 주제를 선택하고 대본을 만든 뒤에 진행할 수 있습니다.";
  if (reason === "video_not_created_yet")
    return "먼저 [영상 만들기]로 시안 영상을 만들어 주세요.";
  if (reason === "script_final_missing" || reason === "script_scenes_invalid")
    return "먼저 [대본 만들기]로 대본을 확정해 주세요. 확정 대본이 실제 음성·이미지·영상의 입력이 됩니다.";
  if (reason === "real_tts_required")
    return "먼저 [실제 목소리 만들기]로 실제 음성을 만들어 주세요. 테스트 소리는 사용할 수 없습니다.";
  if (reason === "real_scene_images_required")
    return "먼저 [장면 이미지 만들기]로 확정 대본 흐름에 맞는 실제 장면 이미지를 모두 만들어 주세요.";
  if (reason.startsWith("flow_motion_render_ready_required:"))
    return "자동 선정된 Veo 장면이 아직 검수 완료되지 않았습니다. [Veo 모션 준비]에서 모든 장면이 렌더 준비 상태인지 확인해 주세요.";
  if (reason === "finance_character_reference_not_selected" || reason === "finance_character_reference_required")
    return "먼저 [주인공 이미지 검수]에서 담당 캐릭터의 기준 이미지를 확정해 주세요.";
  if (reason.startsWith("finance_character_reference_") || reason === "finance_character_subtopic_missing")
    return "담당 주인공의 확정 이미지가 현재 주제와 안전하게 연결되지 않아 이미지 생성을 막았습니다.";
  if (reason === "final_mp4_required" || reason === "media_quality_gate_not_ready")
    return "아직 실제 음성/실제 장면 이미지가 들어간 최종 영상이 아닙니다. 업로드를 막았습니다.";
  if (reason === "preflight_evidence_missing")
    return "먼저 [게시 전 점검]을 통과해야 업로드할 수 있습니다.";
  if (reason === "content_already_published_evidence")
    return "이미 게시 완료된 콘텐츠입니다. 같은 콘텐츠를 다시 올릴 수 없습니다.";
  if (reason === "video_path_untrusted")
    return "영상 파일 위치를 신뢰할 수 없어 중단했습니다. [영상 만들기]를 다시 실행해 주세요.";
  if (reason.startsWith("discovery_metadata_gate_failed"))
    return "플랫폼별 제목·설명·핵심 태그가 발견성 기준을 통과하지 못했습니다. 대본과 메타데이터를 다시 확인해 주세요.";
  if (reason.startsWith("content_unit_write_failed") || reason.startsWith("input_write_failed"))
    return "필요한 파일을 만들지 못했습니다. 저장 폴더 권한을 확인해 주세요.";
  if (reason.endsWith("_must_be_absolute_path")) return "경로는 전체 경로로 입력해 주세요. (예: C:\\tmp\\...)";
  if (reason.endsWith("_missing")) return "필요한 경로가 비어 있습니다. 3개 칸을 모두 채워 주세요.";
  return "입력한 경로를 사용할 수 없습니다.";
}

/** runner가 stdout/stderr에 남긴 BLOCKED/실패 코드 중 알려진 것을 찾아낸다(secret 없음). */
const KNOWN_RUNNER_BLOCKERS = [
  "RESULT_ALREADY_EXISTS_ONE_SHOT",
  "DUPLICATE_ALREADY_PUBLISHED",
  "CREDENTIALS_ABSENT_OWNER_RUN_REQUIRED",
  "METADATA_GATE_FAILED",
  "INSTAGRAM_SOURCE_NOT_FOUND",
  "YOUTUBE_SOURCE_NOT_FOUND",
  "PUBLISH_LEDGER_READ_FAILED",
  "CONTENT_UNIT_NOT_FOUND",
  "DEFAULT_EVIDENCE_CONTENT_FORBIDDEN",
  "BLOB_UPLOAD_FAILED",
  "BLOB_LIVENESS_CHECK_FAILED",
  "INSTAGRAM_CONTAINER_CREATE_FAILED",
  "INSTAGRAM_CONTAINER_NOT_FINISHED",
  "INSTAGRAM_MEDIA_PUBLISH_FAILED",
  "YOUTUBE_UPLOAD_FAILED_AFTER_INSTAGRAM_PUBLISHED",
  "YOUTUBE_INSERT_RETURNED_NO_ID",
] as const;

function extractRunnerBlocker(stdout: string, stderr: string): string | null {
  const text = `${stdout}\n${stderr}`;
  for (const code of KNOWN_RUNNER_BLOCKERS) {
    if (text.includes(code)) return code;
  }
  return null;
}

/** 업로드/점검 blocker 코드 → 쉬운 한국어 설명. */
function describeUploadBlocker(code: string | null, fallback: string): string {
  switch (code) {
    case "DUPLICATE_ALREADY_PUBLISHED":
      return "이미 게시된 콘텐츠입니다. 같은 영상을 두 번 올릴 수 없어 안전하게 중단했습니다.";
    case "RESULT_ALREADY_EXISTS_ONE_SHOT":
      return "이 주제는 업로드가 이미 한 번 실행(또는 시도)되었습니다. 안전을 위해 같은 주제로는 자동 재실행하지 않습니다.";
    case "CREDENTIALS_ABSENT_OWNER_RUN_REQUIRED":
      return "업로드 키가 준비되지 않았습니다. 로컬 실행 화면(Owner PC)에서 키 설정 후 다시 시도해 주세요.";
    case "METADATA_GATE_FAILED":
      return "제목·설명·해시태그 검사에서 막혔습니다. 대본을 다시 만든 뒤 시도해 주세요.";
    case "INSTAGRAM_SOURCE_NOT_FOUND":
    case "YOUTUBE_SOURCE_NOT_FOUND":
    case "CONTENT_UNIT_NOT_FOUND":
      return "영상 파일을 찾지 못했습니다. [영상 만들기]를 다시 실행해 주세요.";
    case "PUBLISH_LEDGER_READ_FAILED":
      return "게시 기록 장부를 읽지 못해 안전하게 중단했습니다.";
    case "DEFAULT_EVIDENCE_CONTENT_FORBIDDEN":
      return "이미 게시 완료된 콘텐츠입니다. 재업로드는 금지되어 있습니다.";
    case "BLOB_UPLOAD_FAILED":
    case "BLOB_LIVENESS_CHECK_FAILED":
      return "영상 파일 전송 단계에서 실패했습니다. 네트워크 확인 후 다시 시도해 주세요.";
    case "INSTAGRAM_CONTAINER_CREATE_FAILED":
    case "INSTAGRAM_CONTAINER_NOT_FINISHED":
    case "INSTAGRAM_MEDIA_PUBLISH_FAILED":
      return "인스타그램 게시 단계에서 실패했습니다. 아무것도 기록하지 않았으니 잠시 후 다시 시도해 주세요.";
    default:
      return fallback;
  }
}

function interpret(
  action: OperatorAction,
  exitCode: number | null,
  parsed: unknown | null,
  stderr: string,
  topicId: string | null,
): OperatorResponse {
  const raw = parsed ?? { exitCode, stderr };

  if (action === "credentialPreflight") {
    const p = parsed as { allRequiredKeysPresent?: boolean; readyForCredentialResolution?: boolean } | null;
    const presence = readCredentialPresence();
    const ready = APPROVED_ENV_KEY_NAMES.filter((k) => presence[k] === true).length;
    const total = APPROVED_ENV_KEY_NAMES.length;
    const allPresent = p?.allRequiredKeysPresent === true || ready === total;
    return {
      action,
      status: allPresent ? "success" : "blocked",
      summary: allPresent
        ? `업로드 키 ${total}개가 모두 준비되어 있습니다.`
        : `업로드 키가 ${ready}/${total}개만 준비되어 있습니다. 남은 키를 채워야 게시할 수 있습니다.`,
      detail: "키의 존재 여부만 확인했고, 키 값은 읽거나 표시하지 않았습니다.",
      blockerCode: allPresent ? undefined : "CREDENTIALS_INCOMPLETE",
      raw,
      noLive: true,
    };
  }

  if (action === "readyPreflight") {
    const pf = (parsed as { preflight?: { preflightOk?: boolean; sourceFilesReady?: boolean } } | null)?.preflight;
    const ok = pf?.preflightOk === true;
    return {
      action,
      status: ok ? "success" : "blocked",
      summary: ok
        ? "시스템 준비 상태가 정상입니다. 영상 파일과 설정이 모두 확인됐습니다."
        : "아직 준비되지 않은 항목이 있습니다. 아래 자세한 내용을 확인해 주세요.",
      detail: "확인만 했고, 업로드나 게시는 실행하지 않았습니다.",
      blockerCode: ok ? undefined : "PREFLIGHT_NOT_READY",
      raw,
      noLive: true,
    };
  }

  if (action === "readyDuplicateGuard") {
    const ref = (parsed as { preflight?: { duplicatePublishReference?: { instagramAlreadyPublished?: boolean; youtubeAlreadyPublished?: boolean; retryForbidden?: boolean } } } | null)
      ?.preflight?.duplicatePublishReference;
    const blocked = ref?.instagramAlreadyPublished === true && ref?.youtubeAlreadyPublished === true && ref?.retryForbidden === true;
    return {
      action,
      status: blocked ? "success" : "blocked",
      summary: blocked
        ? "이미 올린 샘플이라 재업로드가 안전하게 차단됐습니다."
        : "재업로드 차단 상태를 확인하지 못했습니다. 아래 자세한 내용을 확인해 주세요.",
      detail: "같은 영상을 두 번 올리지 않도록 막는 장치가 작동 중인지 확인한 것입니다.",
      blockerCode: blocked ? undefined : "DUPLICATE_GUARD_UNVERIFIED",
      raw,
      noLive: true,
    };
  }

  if (action === "voiceSample") {
    const voice = readVoiceSampleStatus(topicId);
    if (exitCode === 0 && voice.exists) {
      return {
        action,
        status: "success",
        summary: `목소리 자리(테스트용 소리)를 만들었습니다. 길이 ${voice.durationSec ?? "?"}초.`,
        detail:
          "지금은 실제 사람 목소리가 아니라 영상 길이를 맞추는 테스트용 소리입니다. 실제 음성 생성은 다음 승인 후 연결됩니다.",
        raw: { voice },
        noLive: true,
      };
    }
    return {
      action,
      status: "error",
      summary: "목소리 시안을 만들지 못했습니다. 아래 자세한 내용을 확인해 주세요.",
      detail: stderr ? stderr.slice(0, 400) : undefined,
      blockerCode: "VOICE_SAMPLE_FAILED",
      raw,
      noLive: true,
    };
  }

  if (action === "videoCreate") {
    const video = readWizardVideoStatus(topicId);
    if (exitCode === 0 && video.exists) {
      const passCount = video.steps.filter((s) => s.status === "pass").length;
      const titleNote = video.topicTitle ? `"${video.topicTitle}" 주제로 ` : "";
      return {
        action,
        status: "success",
        summary: `${titleNote}시안 영상을 만들었습니다 (${passCount}단계 모두 통과). 업로드는 하지 않았습니다.`,
        detail:
          "선택한 주제의 대본·자막이 이 영상에 반영됐습니다. 장면 이미지는 자동 색상 카드, 소리는 테스트용이며, 실제 이미지·음성 연결은 다음 승인 후 진행합니다. 아래 [미리보기]에서 바로 볼 수 있습니다.",
        raw: { video },
        noLive: true,
      };
    }
    return {
      action,
      status: "error",
      summary: "영상 시안을 만들지 못했습니다. 아래 자세한 내용을 확인해 주세요.",
      detail: stderr ? stderr.slice(0, 400) : undefined,
      blockerCode: "VIDEO_CREATE_FAILED",
      raw,
      noLive: true,
    };
  }

  // finalE2ePreflight — runner는 --arm 없이 실행되어 PREFLIGHT_ONLY_OK로 끝나야 정상.
  const status = (parsed as { status?: string } | null)?.status;
  if (status === "PREFLIGHT_ONLY_OK") {
    return {
      action,
      status: "success",
      summary: "게시 전 점검만 완료했습니다. 실제 업로드는 실행하지 않았습니다.",
      detail:
        "모든 사전 확인을 통과했습니다. 실제 업로드는 자동 만들기 흐름의 확인 게이트(체크 2개 + \"업로드\" 입력) 후에만 실행됩니다.",
      raw,
      noLive: true,
    };
  }

  // runner가 이른 gate에서 멈추면 stdout JSON 없이 stderr에 `BLOCKED: <CODE>`만 남는다.
  const blockerCode =
    (parsed as { blockerCode?: string } | null)?.blockerCode ??
    /BLOCKED:\s*([A-Z0-9_]+)/.exec(stderr)?.[1] ??
    "PREFLIGHT_BLOCKED";

  return {
    action,
    status: "blocked",
    summary: describeE2eBlocker(blockerCode),
    detail: "확인만 했고, 실제 업로드는 실행하지 않았습니다.",
    blockerCode,
    raw,
    noLive: true,
  };
}

/** 게시 전 점검에서 막힌 이유를 Owner가 읽을 수 있는 한국어로 설명한다. */
function describeE2eBlocker(code: string): string {
  switch (code) {
    case "DUPLICATE_ALREADY_PUBLISHED":
      return "이미 올린 콘텐츠라 재업로드가 안전하게 차단됐습니다.";
    case "CREDENTIALS_ABSENT_OWNER_RUN_REQUIRED":
      return "업로드 키가 준비되지 않아 점검을 마치지 못했습니다.";
    case "DEFAULT_EVIDENCE_CONTENT_FORBIDDEN":
      return "이 콘텐츠는 이미 게시된 기본 샘플이라 사용할 수 없습니다.";
    case "CONTENT_UNIT_NOT_FOUND":
    case "CONTENT_UNIT_JSON_PARSE_FAILED":
      return "콘텐츠 정보 파일을 읽을 수 없습니다. 경로와 파일 내용을 확인해 주세요.";
    case "INSTAGRAM_SOURCE_NOT_FOUND":
    case "YOUTUBE_SOURCE_NOT_FOUND":
      return "영상 파일을 찾을 수 없습니다. 영상이 만들어졌는지 확인해 주세요.";
    case "METADATA_GATE_FAILED":
      return "제목·설명·해시태그에 보완할 항목이 있습니다.";
    case "RESULT_ALREADY_EXISTS_ONE_SHOT":
      return "이 폴더에는 이미 실행 결과가 있습니다. 다른 결과 저장 폴더를 지정해 주세요.";
    case "OUT_DIR_INSIDE_REPO":
    case "LEDGER_INSIDE_REPO":
      return "결과 저장 폴더와 기록 파일은 프로젝트 폴더 바깥에 있어야 합니다.";
    case "PUBLISH_LEDGER_READ_FAILED":
      return "업로드 기록 파일을 읽을 수 없습니다. 경로를 확인해 주세요.";
    default:
      return "게시 전 점검에서 막힌 항목이 있습니다. 아래 자세한 내용을 확인해 주세요.";
  }
}
