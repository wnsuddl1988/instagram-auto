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
  buildOperatorCommand,
  ensureWizardFinalScript,
  generateWizardTopicBatch,
  isLocalDevRuntime,
  readCredentialPresence,
  readFinalE2ePreflightResult,
  readScriptPreview,
  readVoiceSampleStatus,
  readWizardPublishPreflight,
  readWizardPublishResult,
  readWizardRealAudioBytes,
  readWizardRealMediaState,
  readWizardVideoBytes,
  readWizardVideoStatus,
  runOperatorScript,
} from "@/lib/owner-web-operator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 로컬 실행/로컬 파일이 필요한 action(배포 사이트에서는 차단). */
const LOCAL_SCRIPT_ACTIONS: OperatorAction[] = [
  "credentialPreflight",
  "readyPreflight",
  "readyDuplicateGuard",
  "finalE2ePreflight",
  "topicRecommend",
  "scriptPreview",
  "voiceSample",
  "videoCreate",
  "previewStatus",
  "wizardPreflight",
  "actualUpload",
  "realTtsCreate",
  "realSceneImagesCreate",
  "finalVideoCreate",
  "realMediaStatus",
];

/** actualUpload 확인 게이트에서 요구하는 입력 문구(Owner가 직접 타이핑). */
const UPLOAD_CONFIRM_TEXT = "업로드";

/** 실제 업로드는 Blob 업로드 + IG 폴링 + YT 업로드로 2분을 넘길 수 있어 별도 timeout을 쓴다. */
const UPLOAD_TIMEOUT_MS = 300_000;

// 실제 제작 단계별 timeout — 실행 스크립트가 도는 동안 dev 서버가 다른 요청을 처리하지
// 못하므로(Owner 단독 로컬 사용 전제) UI가 "몇 분 걸릴 수 있음"을 함께 안내한다.
// 음성: 장면별 합성 호출(최대 6회) + 오디오 이어붙이기 / 이미지: 장면 6개 × 최대 180s + 브라우저 기동(21분)
// / 최종 영상: 장면 세그먼트 6개 렌더 + 자막·음성 결합.
const REAL_TTS_TIMEOUT_MS = 240_000;
const REAL_IMAGES_TIMEOUT_MS = 1_260_000;
const FINAL_VIDEO_TIMEOUT_MS = 300_000;

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

// ── GET: 기본 상태 + 시안 영상 스트림 ────────────────────────────────────────

export async function GET(request: Request) {
  // 시안 영상 미리보기 스트림. 클라이언트는 경로가 아니라 enum("muxed"|"silent")만 보낸다.
  // 실제 파일 경로는 파이프라인 summary에서만 나오고 helper가 C:\tmp 허용 prefix를 강제한다.
  const url = new URL(request.url);
  const videoParam = url.searchParams.get("video");
  if (videoParam === "muxed" || videoParam === "silent" || videoParam === "final") {
    if (!isLocalDevRuntime()) {
      return json(
        { action: "previewStatus", status: "blocked", summary: PRODUCTION_NOTICE, blockerCode: LOCAL_ONLY_BLOCKER, noLive: true },
        404,
      );
    }
    // topicId는 helper가 [a-z0-9-] slug로 정화하므로 경로 조작이 불가능하다.
    const streamTopicId = url.searchParams.get("topicId");
    const bytes = readWizardVideoBytes(videoParam, streamTopicId);
    if (!bytes) {
      return json(
        { action: "previewStatus", status: "blocked", summary: "아직 영상 파일이 없습니다. 먼저 영상을 만들어 주세요.", blockerCode: "WIZARD_VIDEO_NOT_FOUND", noLive: true },
        404,
      );
    }
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "no-store",
      },
    });
  }

  // 실제 목소리 스트림 — 경로는 TTS summary에서만 나오고 C:\tmp 허용 prefix가 강제된다.
  if (url.searchParams.get("audio") === "real") {
    if (!isLocalDevRuntime()) {
      return json(
        { action: "realMediaStatus", status: "blocked", summary: PRODUCTION_NOTICE, blockerCode: LOCAL_ONLY_BLOCKER, noLive: true },
        404,
      );
    }
    const audio = readWizardRealAudioBytes(url.searchParams.get("topicId"));
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

  // ── 위저드 읽기 전용/생성 action (spawn 없음, 외부 API 없음) ──────────────────
  if (action === "topicRecommend") {
    // 카테고리는 고정 enum으로만 받는다(그 외 값은 기본 카테고리로 폴백).
    const categoryRaw = (body as { category?: unknown }).category;
    const category: WizardCategoryId =
      typeof categoryRaw === "string" && (WIZARD_CATEGORY_IDS as readonly string[]).includes(categoryRaw)
        ? (categoryRaw as WizardCategoryId)
        : "finance";
    const batch = generateWizardTopicBatch(category);
    if (!batch) {
      return json({
        action,
        status: "error",
        summary: "주제 추천을 만들지 못했습니다. 잠시 후 다시 눌러 주세요.",
        blockerCode: "TOPIC_BATCH_GENERATION_FAILED",
        noLive: true,
      });
    }
    return json({
      action,
      status: "success",
      summary: `새 주제 ${batch.topics.length}개를 만들었습니다.`,
      detail: "마음에 드는 주제를 고르면 아래 단계가 그 주제로 이어집니다. 다시 누르면 최근에 본 주제는 빼고 새로 만듭니다.",
      raw: { topics: batch.topics, batchId: batch.batchId, category: batch.category },
      noLive: true,
    });
  }

  if (action === "scriptPreview") {
    const topicIdRaw = (body as { topicId?: unknown }).topicId;
    const topicId = typeof topicIdRaw === "string" ? topicIdRaw : "";
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
    // 대본 생성 방식: 로컬 후보 선별(judge 최고 후보) → Claude 1회 보정.
    // 보정은 로컬 dev 런타임에서만 시도하고(배포 사이트는 로컬 산출물 저장 불가),
    // 키 없음/실패/검증 실패/점수 회귀 시 로컬 대본을 그대로 쓴다. 같은 대본은 재호출하지 않는다.
    const record = await ensureWizardFinalScript(topicId, preview, { allowPolish: isLocalDevRuntime() });
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
    const g = media.mediaQualityGate;
    return json({
      action,
      status: "success",
      summary: g.ok
        ? "실제 음성·장면 이미지·최종 영상이 모두 준비됐습니다. 게시 전 점검으로 진행할 수 있습니다."
        : `실제 제작 진행 중 — ${g.reasons[0] ?? "다음 단계를 진행해 주세요."}`,
      raw: { media },
      noLive: true,
    });
  }

  // 실제 목소리 만들기 — 확정 대본 기반 ElevenLabs 고정 목소리 TTS(Owner 버튼 클릭 시에만 호출).
  if (action === "realTtsCreate") {
    const topicIdRaw = (body as { topicId?: unknown }).topicId;
    const topicId = typeof topicIdRaw === "string" ? topicIdRaw : "";
    const builtTts = buildOperatorCommand(action, { topicId });
    if (!builtTts.ok) {
      return json({ action, status: "blocked", summary: describeBuildFailure(builtTts.reason), blockerCode: builtTts.reason, noLive: true });
    }
    // includeMediaEnv:true 는 이 action(실제 TTS 생성) child에만 ELEVENLABS 키를 전달한다.
    const runTts = runOperatorScript(builtTts.command, { timeoutMs: REAL_TTS_TIMEOUT_MS, includeMediaEnv: true });
    if (!runTts.ran || runTts.timedOut) {
      return json({
        action,
        status: "error",
        summary: runTts.timedOut ? "음성 생성이 시간 안에 끝나지 않았습니다. 다시 시도해 주세요." : "음성 생성 프로그램을 실행하지 못했습니다.",
        blockerCode: runTts.timedOut ? "SCRIPT_TIMEOUT" : "SCRIPT_NOT_RUN",
        noLive: true,
      });
    }
    const mediaAfterTts = readWizardRealMediaState(topicId);
    if (mediaAfterTts.realTts.ready) {
      return json({
        action,
        status: "success",
        summary: `실제 목소리가 준비됐습니다 (${mediaAfterTts.realTts.durationSec?.toFixed(1) ?? "?"}초). 아래에서 바로 들어볼 수 있습니다.`,
        detail: "확정 대본을 고정 목소리로 합성한 실제 음성입니다. 파일은 Owner PC에만 있습니다.",
        raw: { realTts: mediaAfterTts.realTts },
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
      raw: { realTts: mediaAfterTts.realTts, exitCode: runTts.exitCode },
      noLive: true,
    });
  }

  // 장면 이미지 만들기 — ChatGPT+Playwright(로그인된 Chrome) 실제 이미지 6장(Owner 클릭 시에만).
  if (action === "realSceneImagesCreate") {
    const topicIdRaw = (body as { topicId?: unknown }).topicId;
    const topicId = typeof topicIdRaw === "string" ? topicIdRaw : "";
    const builtImg = buildOperatorCommand(action, { topicId });
    if (!builtImg.ok) {
      return json({ action, status: "blocked", summary: describeBuildFailure(builtImg.reason), blockerCode: builtImg.reason, noLive: true });
    }
    // ALLOW_CHATGPT_IMAGE=1 은 이 action의 Owner 클릭이 곧 승인이라는 하드코딩 마커다(secret 아님).
    const runImg = runOperatorScript(builtImg.command, { timeoutMs: REAL_IMAGES_TIMEOUT_MS, extraEnv: { ALLOW_CHATGPT_IMAGE: "1" } });
    if (!runImg.ran || runImg.timedOut) {
      return json({
        action,
        status: "error",
        summary: runImg.timedOut
          ? "이미지 생성이 시간 안에 끝나지 않았습니다. 다시 누르면 모자란 장면만 이어서 생성합니다."
          : "이미지 생성 프로그램을 실행하지 못했습니다.",
        blockerCode: runImg.timedOut ? "SCRIPT_TIMEOUT" : "SCRIPT_NOT_RUN",
        noLive: true,
      });
    }
    const mediaAfterImg = readWizardRealMediaState(topicId);
    if (mediaAfterImg.realImages.ready) {
      return json({
        action,
        status: "success",
        summary: "장면 이미지 6장이 모두 준비됐습니다.",
        detail: "대본 6장면의 시각 지시(visualCue)로 만든 실제 이미지입니다. 업로드는 아직 하지 않았습니다.",
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
          : blocked === "BLOCKED_RATE_OR_CAPTCHA"
            ? "ChatGPT 사용 한도/보안 확인에 걸렸습니다. 잠시 후 다시 시도해 주세요."
            : `장면 이미지가 아직 부족합니다 (${mediaAfterImg.realImages.generatedCount}/6). 다시 누르면 모자란 장면만 이어서 생성합니다.`,
      blockerCode: blocked ?? "REAL_IMAGES_INCOMPLETE",
      raw: { realImages: mediaAfterImg.realImages, exitCode: runImg.exitCode },
      noLive: true,
    });
  }

  // 최종 영상 만들기 — 실제 음성 + 실제 이미지 6장 + 자막 + 모션 합성(로컬 ffmpeg만).
  if (action === "finalVideoCreate") {
    const topicIdRaw = (body as { topicId?: unknown }).topicId;
    const topicId = typeof topicIdRaw === "string" ? topicIdRaw : "";
    const builtVid = buildOperatorCommand(action, { topicId });
    if (!builtVid.ok) {
      return json({ action, status: "blocked", summary: describeBuildFailure(builtVid.reason), blockerCode: builtVid.reason, noLive: true });
    }
    const runVid = runOperatorScript(builtVid.command, { timeoutMs: FINAL_VIDEO_TIMEOUT_MS });
    if (!runVid.ran || runVid.timedOut) {
      return json({
        action,
        status: "error",
        summary: runVid.timedOut ? "영상 합성이 시간 안에 끝나지 않았습니다. 다시 시도해 주세요." : "영상 합성 프로그램을 실행하지 못했습니다.",
        blockerCode: runVid.timedOut ? "SCRIPT_TIMEOUT" : "SCRIPT_NOT_RUN",
        noLive: true,
      });
    }
    const mediaAfterVid = readWizardRealMediaState(topicId);
    if (mediaAfterVid.finalVideo.ready) {
      const mb = mediaAfterVid.finalVideo.sizeBytes ? (mediaAfterVid.finalVideo.sizeBytes / (1024 * 1024)).toFixed(2) : "?";
      return json({
        action,
        status: "success",
        summary: `최종 영상이 준비됐습니다 (${mediaAfterVid.finalVideo.durationSec ?? "?"}초, ${mb}MB). 미리보기에서 바로 재생됩니다.`,
        detail: "실제 목소리와 실제 장면 이미지로 합성한 업로드 후보 영상입니다. 아직 업로드는 하지 않았습니다.",
        raw: { finalVideo: mediaAfterVid.finalVideo, mediaQualityGate: mediaAfterVid.mediaQualityGate },
        noLive: true,
      });
    }
    return json({
      action,
      status: "blocked",
      summary: "최종 영상 검증을 통과하지 못했습니다. 실제 음성/이미지를 확인한 뒤 다시 시도해 주세요.",
      blockerCode: "FINAL_MP4_VALIDATION_FAILED",
      raw: { finalVideo: mediaAfterVid.finalVideo, exitCode: runVid.exitCode },
      noLive: true,
    });
  }

  // ── 게시 전 점검(wizardPreflight): 선택 주제 영상 기준, --arm 없음(외부 호출 0) ──
  if (action === "wizardPreflight") {
    const topicIdRaw = (body as { topicId?: unknown }).topicId;
    const topicId = typeof topicIdRaw === "string" ? topicIdRaw : "";
    const builtPf = buildOperatorCommand(action, { topicId });
    if (!builtPf.ok) {
      return json({
        action,
        status: "blocked",
        summary: describeBuildFailure(builtPf.reason),
        blockerCode: builtPf.reason,
        noLive: true,
      });
    }
    const runPf = runOperatorScript(builtPf.command);
    if (!runPf.ran || runPf.timedOut) {
      return json({
        action,
        status: "error",
        summary: "게시 전 점검을 실행하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        blockerCode: runPf.timedOut ? "SCRIPT_TIMEOUT" : "SCRIPT_NOT_RUN",
        noLive: true,
      });
    }
    const pf = readWizardPublishPreflight(topicId);
    if (runPf.exitCode === 0 && pf?.status === "PREFLIGHT_ONLY_OK") {
      return json({
        action,
        status: "success",
        summary: `게시 전 점검을 통과했습니다. 업로드 키 ${pf.credentialPresentCount ?? "?"}/6, 중복 게시 없음.`,
        detail: "확인만 했고 업로드는 하지 않았습니다. 이제 마지막 단계에서 확인 절차 후 업로드할 수 있습니다.",
        raw: { preflight: pf },
        noLive: true,
      });
    }
    const pfBlocker = pf?.blockerCode ?? extractRunnerBlocker(runPf.stdout, runPf.stderr);
    return json({
      action,
      status: "blocked",
      summary: describeUploadBlocker(pfBlocker, "게시 전 점검에서 막혔습니다."),
      blockerCode: pfBlocker ?? "WIZARD_PREFLIGHT_FAILED",
      raw: { preflight: pf },
      noLive: true,
    });
  }

  // ── 실제 업로드(actualUpload): 이 route의 유일한 live 경로 — 전 게이트 fail-closed ──
  if (action === "actualUpload") {
    const b = body as {
      topicId?: unknown;
      confirmReviewed?: unknown;
      confirmPublish?: unknown;
      confirmText?: unknown;
    };
    const topicId = typeof b.topicId === "string" ? b.topicId : "";
    // [게이트 1] Owner 명시 확인 — 체크 2개 + "업로드" 직접 입력을 서버에서 검증한다.
    if (b.confirmReviewed !== true || b.confirmPublish !== true || b.confirmText !== UPLOAD_CONFIRM_TEXT) {
      return json({
        action,
        status: "blocked",
        summary: `업로드 확인 절차가 완료되지 않았습니다. 확인 2개를 체크하고 "${UPLOAD_CONFIRM_TEXT}"를 직접 입력해 주세요.`,
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
    // [게이트 2] 영상/대본/게시 전 점검 evidence/이미 게시 차단 — helper가 fail-closed로 검증.
    const builtUp = buildOperatorCommand(action, { topicId });
    if (!builtUp.ok) {
      return json({
        action,
        status: "blocked",
        summary: describeBuildFailure(builtUp.reason),
        blockerCode: builtUp.reason,
        noLive: true,
      });
    }
    // [게이트 3] 실행 — allowArm은 이 지점에서만 부여된다.
    const runUp = runOperatorScript(builtUp.command, { allowArm: true, timeoutMs: UPLOAD_TIMEOUT_MS });
    if (!runUp.ran) {
      // spawn 자체가 시작되지 않았다 — arm runner가 돌지 않았으므로 외부 게시는 없다(noLive:true).
      return json({
        action,
        status: "error",
        summary: "업로드 실행을 시작하지 못했습니다.",
        blockerCode: "SCRIPT_NOT_RUN",
        noLive: true,
      });
    }
    // 여기서부터는 arm runner가 실제로 실행(spawn)됐다 — 외부 게시가 일어났을 수 있다(noLive:false).
    if (runUp.timedOut) {
      return json({
        action,
        status: "error",
        summary: "업로드가 시간 안에 끝나지 않았습니다. 계정에 일부 게시됐을 수 있으니 직접 확인해 주세요.",
        blockerCode: "UPLOAD_TIMEOUT_MANUAL_CHECK_REQUIRED",
        noLive: false,
        liveRunnerInvoked: true,
      });
    }
    const result = readWizardPublishResult(topicId);
    if (runUp.exitCode === 0 && result?.status === "PUBLISHED_DUAL_PLATFORM_OK") {
      return json({
        action,
        status: "success",
        summary: "업로드 완료! 인스타그램과 유튜브에 게시하고 게시 기록도 저장했습니다.",
        detail: result.youtubeUrl
          ? `유튜브: ${result.youtubeUrl} · 인스타그램 게시물 ID: ${result.instagramMediaId ?? "?"}`
          : undefined,
        raw: {
          instagramMediaId: result.instagramMediaId,
          youtubeVideoId: result.youtubeVideoId,
          youtubeUrl: result.youtubeUrl,
          ledgerRecordedKeys: result.ledgerRecordedKeys,
        },
        noLive: false,
        liveRunnerInvoked: true,
      });
    }
    // 실패/차단 — runner가 남긴 blocker를 한국어로 해석한다(부분 게시 포함, secret 없음).
    // arm runner가 이미 실행됐으므로 noLive:false — 게이트에서 막힌 게 아니라 실행 중 실패한 것이다.
    const upBlocker =
      (runUp.exitCode !== 0 ? extractRunnerBlocker(runUp.stdout, runUp.stderr) : null) ?? result?.blockerCode ?? null;
    const partial = runUp.exitCode !== 0 && result?.partialExternalState === "instagram_published_youtube_failed";
    return json({
      action,
      status: "blocked",
      summary: partial
        ? "인스타그램에는 게시됐지만 유튜브 업로드가 실패했습니다. 자동 기록은 하지 않았으니 직접 확인이 필요합니다."
        : describeUploadBlocker(upBlocker, "업로드가 실행됐지만 게시가 완료되지 않았습니다."),
      blockerCode: upBlocker ?? "UPLOAD_FAILED",
      raw: partial
        ? { instagramMediaId: result?.instagramMediaId ?? null, partialExternalState: result?.partialExternalState }
        : undefined,
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
    return "먼저 [장면 이미지 만들기]로 실제 장면 이미지 6장을 만들어 주세요.";
  if (reason === "final_mp4_required" || reason === "media_quality_gate_not_ready")
    return "아직 실제 음성/실제 장면 이미지가 들어간 최종 영상이 아닙니다. 업로드를 막았습니다.";
  if (reason === "preflight_evidence_missing")
    return "먼저 [게시 전 점검]을 통과해야 업로드할 수 있습니다.";
  if (reason === "content_already_published_evidence")
    return "이미 게시 완료된 콘텐츠입니다. 같은 콘텐츠를 다시 올릴 수 없습니다.";
  if (reason === "video_path_untrusted")
    return "영상 파일 위치를 신뢰할 수 없어 중단했습니다. [영상 만들기]를 다시 실행해 주세요.";
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
