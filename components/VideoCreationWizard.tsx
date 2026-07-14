"use client";

/**
 * VideoCreationWizard — 자동 쇼츠 만들기 위저드 (Owner용 메인 흐름).
 *
 * task: owner-one-click-video-creation-ui-v1
 * task: owner-web-auto-topic-refresh-and-upload-button-v1
 *
 * 카테고리 → 새 주제 추천 → 대본 → 음성 → 영상 → 미리보기 → 게시 전 점검 → 실제 업로드
 * 순서를 버튼으로 진행한다. 모든 실행은 /api/money-shorts/operator 의 고정 action enum을
 * 통해서만 이뤄진다. 실제 업로드는 마지막 단계에서만, 시안 영상 + 게시 전 점검 통과 +
 * Owner 명시 확인(체크 3개 + "업로드" 입력)을 모두 만족해야 실행된다.
 */

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

// ── 타입 ─────────────────────────────────────────────────────────────────────

type RunState = "idle" | "running" | "success" | "blocked" | "error";

type OperatorResult = {
  action: string;
  status: "success" | "blocked" | "error";
  summary: string;
  detail?: string;
  blockerCode?: string;
  raw?: unknown;
};

type WizardTopic = {
  topicId: string;
  title: string;
  hook: string;
  reason: string;
  scriptReady: boolean;
  recommended: boolean;
  category?: string;
  angle?: string;
  qualityScore?: number;
  rewrittenReasons?: string[];
  source?: "editorial_bank" | "claude_generated" | "local_bank" | "fixture";
  noveltyNote?: string;
  financeSubtopic?: string;
  problemStatement?: string;
  twist?: string;
  takeawayAction?: string;
  editorialDecision?: "make" | "maybe" | "reject" | null;
  requiresEditorialDecision?: boolean;
};

type WizardEditorialPreferenceSummary = {
  total: number;
  make: number;
  maybe: number;
  reject: number;
  remainingCalibration: number;
};

type WizardScriptScene = {
  id: string;
  label: string;
  narration: string;
  captionText: string;
  visualCue: string;
  mediaStrategy?: "still" | "veo_motion";
  mediaStrategySource?: "automatic" | "manual_override" | "budget_cap";
  mediaStrategyScore?: number;
  mediaStrategyMaxVeoScenes?: number;
};

type WizardQuality = {
  retentionScore: number;
  selfRecognitionScore: number;
  clarityScore: number;
  visualizabilityScore: number;
  antiAiToneScore: number;
  specificityScore: number;
  overallScore: number;
  rejectReasons: string[];
  rewriteReasons: string[];
  passed: boolean;
};

type WizardScript = {
  title: string;
  hook: string;
  hookLine?: string;
  curiosity: string;
  points: string[];
  twist: string;
  action: string;
  captionLines?: string[];
  fullVoiceover: string;
  scenes?: WizardScriptScene[];
  videoStrategy?: {
    contractVersion: string;
    mode: "single" | "two_part";
    openingVoice: { v3AudioTag: string; speedCap: number; stance: string };
    parts: Array<{
      id: "single" | "part-1" | "part-2";
      partNumber: number;
      totalParts: number;
      coverLines: Array<{ spokenText: string; displayText: string; emphasis: string }>;
      bridgeNarration: string | null;
      recapNarration: string | null;
    }>;
  } | null;
  captionFirstLineHook?: string;
  uploadCaptionDraft?: string;
  hookScore: number | null;
  clarityScore: number | null;
  quality?: WizardQuality;
  selectedStyle?: string;
  qualitySummary?: {
    goodReasons: string[];
    fixedParts: string[];
    watchOuts: string[];
  };
  candidateScores?: Array<{ style: string; overallScore: number; selected: boolean }>;
};

type WizardVideo = {
  exists: boolean;
  flowStatus: string | null;
  steps: Array<{ id: string; status: string }>;
  muxedMp4Path: string | null;
  muxedMp4Bytes: number | null;
  topicId: string | null;
  topicTitle: string | null;
};

type WizardUploadReadyItem = {
  topicId: string;
  title: string;
  category: string;
  totalParts: number;
  totalDurationSec: number | null;
  updatedAt: string | null;
  status: "ready" | "needs_attention";
  detail: string;
};

type WizardFinanceCharacterCast = {
  version: string;
  visualStyle: string;
  candidateCount: number;
  selectedCount: number;
  allSelected: boolean;
  characters: Array<{
    id: string;
    name: string;
    label: string;
    role: string;
    subtopics: string[];
    selectedCandidateNumber: number | null;
    candidatesReady: boolean;
    blockerCode: string | null;
    candidates: Array<{
      candidateNumber: number;
      ready: boolean;
      width: number | null;
      height: number | null;
      direction: string;
    }>;
  }>;
};

/** 대본 생성 방식(로컬 후보 선별 → Claude 1회 보정) 결과 메타데이터. */
type WizardScriptEngine = {
  mode: "claude_polished" | "local_only";
  claudeApplied: boolean;
  note: string;
  reasonCode: string;
  model: string | null;
  rewriteNotes: string[];
  localScore: number | null;
  polishedScore: number | null;
};

/** 실제 음성/장면 이미지/최종 영상 준비 상태 + media quality gate (서버 realMediaStatus 응답). */
type WizardRealMedia = {
  production: {
    strategyVersion: string | null;
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
    audioPath: string | null;
    durationSec: number | null;
    provider: string | null;
    apiCallCount: number | null;
    missingEnv: string[];
  };
  realImages: {
    ready: boolean;
    generatedCount: number;
    expectedCount: number | null;
    dir: string | null;
    blocked: string | null;
  };
  finalVideo: {
    ready: boolean;
    mp4Path: string | null;
    durationSec: number | null;
    width: number | null;
    height: number | null;
    hasAudio: boolean;
    sizeBytes: number | null;
  };
  mediaQualityGate: {
    ok: boolean;
    reasons: string[];
    blockerCode: string | null;
  };
  parts: Array<{
    id: "single" | "part-1" | "part-2";
    partNumber: number;
    totalParts: number;
    canonicalTitle: string;
    platformTitle: string;
    realTts: WizardRealMedia["realTts"];
    realImages: WizardRealMedia["realImages"];
    finalVideo: WizardRealMedia["finalVideo"];
    mediaQualityGate: WizardRealMedia["mediaQualityGate"];
  }>;
};

type WizardFlowMotionState = "not_prepared" | "not_required" | "approval_pending" | "generating" | "qa_pass" | "qa_failed" | "render_ready";

type WizardFlowMotionStatus = {
  state: WizardFlowMotionState;
  requiredCount: number;
  preparedCount: number;
  approvalPendingCount: number;
  generatingCount: number;
  qaPassCount: number;
  qaFailedCount: number;
  renderReadyCount: number;
  readyForRender: boolean;
  parts: Array<{
    id: "single" | "part-1" | "part-2";
    partNumber: number;
    totalParts: number;
    state: WizardFlowMotionState;
    jobs: Array<{
      jobId: string;
      sceneNumber: number;
      sceneLabel: string;
      status: "approval_pending" | "generating" | "qa_pass" | "qa_failed" | "render_ready";
      packetPath: string;
      expectedVideoPath: string;
      referenceSha256: string;
      promptSha256: string;
      requiredApprovalWording: string;
      renderAssetReady: boolean;
    }>;
  }>;
};

const FLOW_MOTION_STATUS_LABEL: Record<WizardFlowMotionState, string> = {
  not_prepared: "패킷 준비 필요",
  not_required: "모션 장면 없음",
  approval_pending: "생성 승인 대기",
  generating: "생성 중",
  qa_pass: "검수 통과",
  qa_failed: "검수 실패",
  render_ready: "렌더 준비",
};

// ── 카테고리 (프로젝트 목표 8개 — 전부 주제 추천 가능) ─────────────────────────

/** 카테고리를 고르면 보여줄 한 줄 소개 — 재테크팁은 돈·성공·심리·생활습관 톤을 명시한다. */
const CATEGORY_DESC: Record<string, string> = {
  finance: "돈·성공·심리·생활습관 — 아끼라는 잔소리 대신, 돈 앞에서 마음이 움직이는 방식을 다룹니다.",
  ai: "AI를 일상과 일에 바로 써먹는 활용법을 다룹니다.",
  meme: "밈과 짤을 센스 있게 쓰는 감각을 다룹니다.",
  news: "뉴스와 소문에 속지 않는 읽기 습관을 다룹니다.",
  tmi: "알고 나면 말하고 싶어지는 생활 지식을 다룹니다.",
  game: "게임을 더 재미있게 만드는 습관과 매너를 다룹니다.",
  animal: "반려동물과 더 잘 지내는 방법을 다룹니다.",
  celeb: "덕질을 오래 즐겁게 하는 방법을 다룹니다.",
};

const CATEGORIES: Array<{ id: string; label: string }> = [
  { id: "finance", label: "재테크팁" },
  { id: "ai", label: "AI생성활용" },
  { id: "meme", label: "밈&짤" },
  { id: "news", label: "충격뉴스" },
  { id: "tmi", label: "TMI지식" },
  { id: "game", label: "게임클립" },
  { id: "animal", label: "귀여운동물" },
  { id: "celeb", label: "셀럽엔터" },
];

const FINANCE_SUBTOPICS: Array<{ id: string; label: string; desc: string }> = [
  { id: "all", label: "전체", desc: "전체 돈·경제 주제에서 추천" },
  { id: "economy_literacy", label: "경제뉴스·돈공부", desc: "뉴스, 경제 흐름, 정보 격차" },
  { id: "inflation_living_cost", label: "물가·생활비", desc: "장바구니, 식비, 생활비 기준" },
  { id: "interest_debt", label: "금리·빚", desc: "이자, 대출, 카드값, 상환" },
  { id: "consumption_psychology", label: "소비심리", desc: "결제, 세일, 충동, 합리화" },
  { id: "sns_comparison", label: "SNS비교", desc: "피드, 체면, 관계 지출" },
  { id: "labor_income", label: "월급·소득", desc: "월급날, 연봉, 현금흐름" },
  { id: "investing_assets", label: "투자·자산", desc: "주식, 수익률, 자산 기준" },
  { id: "housing_asset_gap", label: "집값·주거비", desc: "월세, 전세, 집, 고정비" },
  { id: "anxiety_avoidance", label: "불안·회피", desc: "잔고, 고지서, 숫자 직면" },
  { id: "success_habits", label: "성공습관", desc: "기준, 루틴, 감정 통제" },
  { id: "crisis_risk", label: "위기·비상금", desc: "불황, 리스크, 생존비" },
  { id: "time_retirement", label: "시간·노후", desc: "미래, 복리, 장기 선택" },
];

const FINANCE_SUBTOPIC_LABELS = Object.fromEntries(FINANCE_SUBTOPICS.map((s) => [s.id, s.label])) as Record<string, string>;

// ── API 호출 ─────────────────────────────────────────────────────────────────

async function postAction(action: string, extra?: Record<string, unknown>): Promise<OperatorResult> {
  // 주제 추천은 로컬 데이터만 읽는 짧은 작업이다. 서버 문제가 생겨도
  // 화면이 영원히 "진행 중"에 머물지 않도록 이 action에만 제한시간을 둔다.
  const controller = action === "topicRecommend" ? new AbortController() : null;
  const timeoutId = controller ? window.setTimeout(() => controller.abort(), 25_000) : null;
  try {
    const res = await fetch("/api/money-shorts/operator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
      signal: controller?.signal,
    });
    return (await res.json()) as OperatorResult;
  } finally {
    if (timeoutId != null) window.clearTimeout(timeoutId);
  }
}

// ── 작은 UI 조각 ─────────────────────────────────────────────────────────────

function StateBadge({ state }: { state: RunState }) {
  if (state === "idle") return null;
  const styles: Record<Exclude<RunState, "idle">, string> = {
    running: "bg-slate-100 text-slate-600 border-slate-300",
    success: "bg-emerald-50 text-emerald-700 border-emerald-300",
    blocked: "bg-amber-50 text-amber-700 border-amber-300",
    error: "bg-red-50 text-red-700 border-red-300",
  };
  const labels: Record<Exclude<RunState, "idle">, string> = {
    running: "진행 중…",
    success: "완료",
    blocked: "확인 필요",
    error: "오류",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full border text-sm font-semibold shrink-0 ${styles[state]}`}>
      {labels[state]}
    </span>
  );
}

function ResultNote({ result }: { result: OperatorResult | null }) {
  if (!result) return null;
  const color =
    result.status === "success" ? "text-emerald-700" : result.status === "blocked" ? "text-amber-700" : "text-red-600";
  return (
    <div className="mt-2.5 space-y-1">
      <p className={`text-[15px] font-semibold ${color}`}>{result.summary}</p>
      {result.detail ? <p className="text-sm text-slate-500 leading-relaxed">{result.detail}</p> : null}
      {result.raw != null ? (
        <details className="text-xs text-slate-400">
          <summary className="cursor-pointer hover:text-slate-600">개발자용 자세한 내용 보기</summary>
          <pre className="mt-1 p-2 rounded bg-slate-50 border border-slate-200 overflow-x-auto max-h-48 overflow-y-auto text-slate-500">
            {JSON.stringify(result.raw, null, 2)}
          </pre>
        </details>
      ) : null}
    </div>
  );
}

function StepCard({
  num,
  title,
  state,
  desc,
  children,
}: {
  num: number;
  title: string;
  state: RunState;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div data-testid={`wizard-step-${num}`} className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-5">
      <div className="flex items-start gap-3.5">
        <span className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-base font-bold shrink-0 mt-0.5">
          {num}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-lg text-slate-900">{title}</span>
            <StateBadge state={state} />
          </div>
          <p className="text-[15px] text-slate-500 mt-1 leading-relaxed">{desc}</p>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

const RUN_BTN =
  "px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-[15px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

// ── 메인 위저드 ───────────────────────────────────────────────────────────────

export default function VideoCreationWizard() {
  const [localDev, setLocalDev] = useState<boolean | null>(null);

  const [category, setCategory] = useState<string | null>(null);
  const [financeSubtopic, setFinanceSubtopic] = useState<string>("all");

  const [topicState, setTopicState] = useState<RunState>("idle");
  const [topicResult, setTopicResult] = useState<OperatorResult | null>(null);
  const [topics, setTopics] = useState<WizardTopic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [uploadReadyState, setUploadReadyState] = useState<RunState>("idle");
  const [uploadReadyResult, setUploadReadyResult] = useState<OperatorResult | null>(null);
  const [uploadReadyItems, setUploadReadyItems] = useState<WizardUploadReadyItem[]>([]);
  const [uploadReadyQuery, setUploadReadyQuery] = useState("");
  const [editorialSummary, setEditorialSummary] = useState<WizardEditorialPreferenceSummary | null>(null);
  const [preferenceBusyId, setPreferenceBusyId] = useState<string | null>(null);
  const [preferenceMessage, setPreferenceMessage] = useState<string | null>(null);

  const [scriptState, setScriptState] = useState<RunState>("idle");
  const [scriptResult, setScriptResult] = useState<OperatorResult | null>(null);
  const [script, setScript] = useState<WizardScript | null>(null);

  const [voiceState, setVoiceState] = useState<RunState>("idle");
  const [voiceResult, setVoiceResult] = useState<OperatorResult | null>(null);

  const [videoState, setVideoState] = useState<RunState>("idle");
  const [videoResult, setVideoResult] = useState<OperatorResult | null>(null);

  // 실제 제작 파이프라인 상태 — 대본 엔진 표시 + 실제 목소리/장면 이미지/최종 영상 + media gate.
  const [scriptEngine, setScriptEngine] = useState<WizardScriptEngine | null>(null);
  const [realMedia, setRealMedia] = useState<WizardRealMedia | null>(null);
  const [characterCast, setCharacterCast] = useState<WizardFinanceCharacterCast | null>(null);
  const [characterCastState, setCharacterCastState] = useState<RunState>("idle");
  const [characterCastResult, setCharacterCastResult] = useState<OperatorResult | null>(null);
  const [characterCastBusyId, setCharacterCastBusyId] = useState<string | null>(null);
  const [characterImageKey, setCharacterImageKey] = useState(0);
  const [realTtsState, setRealTtsState] = useState<RunState>("idle");
  const [realTtsResult, setRealTtsResult] = useState<OperatorResult | null>(null);
  const [imagesState, setImagesState] = useState<RunState>("idle");
  const [imagesResult, setImagesResult] = useState<OperatorResult | null>(null);
  const [flowMotionState, setFlowMotionState] = useState<RunState>("idle");
  const [flowMotionResult, setFlowMotionResult] = useState<OperatorResult | null>(null);
  const [flowMotion, setFlowMotion] = useState<WizardFlowMotionStatus | null>(null);
  const [finalVideoState, setFinalVideoState] = useState<RunState>("idle");
  const [finalVideoResult, setFinalVideoResult] = useState<OperatorResult | null>(null);
  const [audioKey, setAudioKey] = useState(0);

  const [previewState, setPreviewState] = useState<RunState>("idle");
  const [previewResult, setPreviewResult] = useState<OperatorResult | null>(null);
  const [previewVideo, setPreviewVideo] = useState<WizardVideo | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const [preflightState, setPreflightState] = useState<RunState>("idle");
  const [preflightResult, setPreflightResult] = useState<OperatorResult | null>(null);

  // 실제 업로드 확인 게이트 상태 — 서버도 같은 값을 다시 검증한다.
  const [uploadState, setUploadState] = useState<RunState>("idle");
  const [uploadResult, setUploadResult] = useState<OperatorResult | null>(null);
  const [confirmReviewed, setConfirmReviewed] = useState(false);
  const [confirmDiscoveryReady, setConfirmDiscoveryReady] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  // Playwright 주문형 운영과 브라우저 재시작 후 이어가기를 위한 로컬 전용 복원점.
  // topicId는 이후 모든 서버 action에서 다시 검증되며 파일 경로로 직접 사용되지 않는다.
  useEffect(() => {
    const resumeTopicId = new URLSearchParams(window.location.search).get("resumeTopicId")?.trim();
    if (!resumeTopicId || !/^[a-z0-9][a-z0-9_-]{2,180}$/i.test(resumeTopicId)) return;
    const resumeTimer = window.setTimeout(() => setSelectedTopicId(resumeTopicId), 0);
    return () => window.clearTimeout(resumeTimer);
  }, []);

  // 화면이 로컬 실행인지 배포 사이트인지 확인한다(부작용 없는 상태 조회).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/money-shorts/operator")
      .then((r) => r.json())
      .then((j: { raw?: { localDev?: boolean } }) => {
        if (!cancelled) setLocalDev(j.raw?.localDev === true);
      })
      .catch(() => {
        if (!cancelled) setLocalDev(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const anyRunning = [
    topicState,
    scriptState,
    voiceState,
    videoState,
    previewState,
    preflightState,
    uploadState,
    realTtsState,
    imagesState,
    flowMotionState,
    finalVideoState,
    characterCastState,
  ].includes("running") || preferenceBusyId !== null;
  const runnable = localDev === true && !anyRunning;

  const selectedTopic = topics.find((t) => t.topicId === selectedTopicId) ?? null;
  const normalizedUploadReadyQuery = uploadReadyQuery.trim().toLocaleLowerCase("ko-KR");
  const filteredUploadReadyItems = uploadReadyItems.filter((item) =>
    !normalizedUploadReadyQuery || item.title.toLocaleLowerCase("ko-KR").includes(normalizedUploadReadyQuery),
  );

  // 실제 제작 파생 상태 — 대본 확정 → 실제 음성 → 장면 이미지 → 최종 영상 → media gate.
  const scriptFinalReady = (scriptState === "success" && script != null) || realMedia?.scriptEngine.finalReady === true;
  const characterCastReady = characterCast?.allSelected === true;
  // 서버는 주제의 소주제에서 담당 캐릭터를 결정하고, 선택 파일의 SHA-256까지 검증한 뒤에만 생성한다.
  const characterReferenceEngineReady = characterCastReady;
  const realTtsReady = realMedia?.realTts.ready === true;
  const realImagesReady = realMedia?.realImages.ready === true;
  const selectedFlowMotionSceneCount = flowMotion?.requiredCount ?? script?.scenes?.filter((scene) => scene.mediaStrategy === "veo_motion").length ?? 0;
  const flowMotionPrepared = flowMotion?.state !== "not_prepared" && flowMotion?.state !== undefined;
  const flowMotionReadyForRender = flowMotion?.readyForRender === true;
  const finalVideoReady = realMedia?.finalVideo.ready === true;
  const mediaGateOk = realMedia?.mediaQualityGate.ok === true;
  const productionPartCount = realMedia?.production.totalParts ?? script?.videoStrategy?.parts.length ?? 1;
  const plannedSceneCount = realMedia?.realImages.expectedCount ?? script?.scenes?.length ?? null;
  const imageStepDescription = plannedSceneCount != null
    ? `영상 ${productionPartCount}개, 총 ${plannedSceneCount}장면의 흐름에 맞춰 서로 다른 실제 장면 이미지를 만듭니다. 몇 분 걸릴 수 있습니다.`
    : "확정 대본의 장면 흐름에 맞춰 서로 다른 실제 장면 이미지를 만듭니다. 몇 분 걸릴 수 있습니다.";
  const finalVideoStepDescription = plannedSceneCount != null
    ? `실제 목소리와 장면 이미지 ${plannedSceneCount}장에 검수 완료 Veo 모션 장면을 결합해 최종 mp4 ${productionPartCount}개로 합성합니다.`
    : "확정 대본의 실제 목소리·장면 이미지와 검수 완료 Veo 모션을 최종 mp4로 합성합니다.";

  // 업로드 게이트 파생 상태 — 최종 영상(media gate) → 게시 전 점검 통과 → 명시 확인 순서를 강제한다.
  const preflightDone = mediaGateOk && preflightState === "success";
  const uploadEnabled =
    runnable &&
    selectedTopicId != null &&
    mediaGateOk &&
    preflightDone &&
    confirmReviewed &&
    confirmDiscoveryReady &&
    confirmPublish &&
    confirmText.trim() === "업로드" &&
    uploadState !== "success";

  // 주제(또는 카테고리)가 바뀌면 이후 단계 결과를 전부 리셋한다 — 다른 주제의 결과가 섞이지 않게.
  const resetDownstream = useCallback(() => {
    setScriptState("idle");
    setScriptResult(null);
    setScript(null);
    setScriptEngine(null);
    setRealMedia(null);
    setRealTtsState("idle");
    setRealTtsResult(null);
    setImagesState("idle");
    setImagesResult(null);
    setFlowMotionState("idle");
    setFlowMotionResult(null);
    setFlowMotion(null);
    setFinalVideoState("idle");
    setFinalVideoResult(null);
    setVoiceState("idle");
    setVoiceResult(null);
    setVideoState("idle");
    setVideoResult(null);
    setPreviewState("idle");
    setPreviewResult(null);
    setPreviewVideo(null);
    setPreflightState("idle");
    setPreflightResult(null);
    setUploadState("idle");
    setUploadResult(null);
    setConfirmReviewed(false);
    setConfirmDiscoveryReady(false);
    setConfirmPublish(false);
    setConfirmText("");
  }, []);

  const selectCategory = useCallback(
    (id: string) => {
      setCategory(id);
      if (id !== "finance") setFinanceSubtopic("all");
      setTopics([]);
      setSelectedTopicId(null);
      setTopicState("idle");
      setTopicResult(null);
      setPreferenceMessage(null);
      resetDownstream();
    },
    [resetDownstream],
  );

  const selectFinanceSubtopic = useCallback(
    (id: string) => {
      setFinanceSubtopic(id);
      setTopics([]);
      setSelectedTopicId(null);
      setTopicState("idle");
      setTopicResult(null);
      setPreferenceMessage(null);
      resetDownstream();
    },
    [resetDownstream],
  );

  const selectTopic = useCallback(
    (topicId: string) => {
      setSelectedTopicId(topicId);
      resetDownstream();
    },
    [resetDownstream],
  );

  const refreshUploadReadyList = useCallback(async () => {
    setUploadReadyState("running");
    try {
      const r = await postAction("uploadReadyList");
      const items = (r.raw as { items?: WizardUploadReadyItem[] } | undefined)?.items;
      setUploadReadyResult(r);
      setUploadReadyState(r.status === "success" ? "success" : r.status);
      if (r.status === "success" && Array.isArray(items)) setUploadReadyItems(items);
    } catch {
      setUploadReadyState("error");
      setUploadReadyResult({ action: "uploadReadyList", status: "error", summary: "완성 영상 목록을 불러오지 못했습니다." });
    }
  }, []);

  const refreshCharacterCast = useCallback(async () => {
    try {
      const result = await postAction("characterCastStatus");
      const cast = (result.raw as { cast?: WizardFinanceCharacterCast } | undefined)?.cast;
      if (result.status === "success" && cast) setCharacterCast(cast);
    } catch {
      // 초기 상태 조회 실패는 후보 생성 버튼에서 다시 확인한다.
    }
  }, []);

  const createCharacterCandidates = useCallback(async (characterId: string, regenerate = false) => {
    setCharacterCastBusyId(characterId);
    setCharacterCastState("running");
    setCharacterCastResult(null);
    try {
      const result = await postAction("characterCastCreate", { characterId, regenerate });
      const cast = (result.raw as { cast?: WizardFinanceCharacterCast } | undefined)?.cast;
      if (cast) setCharacterCast(cast);
      setCharacterImageKey((key) => key + 1);
      setCharacterCastResult(result);
      setCharacterCastState(result.status === "success" ? "success" : result.status);
    } catch {
      setCharacterCastState("error");
      setCharacterCastResult({ action: "characterCastCreate", status: "error", summary: "주인공 후보 이미지 생성 요청에 실패했습니다." });
    } finally {
      setCharacterCastBusyId(null);
    }
  }, []);

  const selectCharacterCandidate = useCallback(async (characterId: string, candidateNumber: number) => {
    setCharacterCastBusyId(characterId);
    setCharacterCastState("running");
    setCharacterCastResult(null);
    try {
      const result = await postAction("characterCastSelect", { characterId, candidateNumber });
      const cast = (result.raw as { cast?: WizardFinanceCharacterCast } | undefined)?.cast;
      if (cast) setCharacterCast(cast);
      setCharacterCastResult(result);
      setCharacterCastState(result.status === "success" ? "success" : result.status);
    } catch {
      setCharacterCastState("error");
      setCharacterCastResult({ action: "characterCastSelect", status: "error", summary: "주인공 기준 이미지 선택을 저장하지 못했습니다." });
    } finally {
      setCharacterCastBusyId(null);
    }
  }, []);

  const selectUploadReadyItem = useCallback((item: WizardUploadReadyItem) => {
    setCategory(item.category);
    setFinanceSubtopic("all");
    setTopics((current) => current.some((topic) => topic.topicId === item.topicId)
      ? current
      : [{
          topicId: item.topicId,
          title: item.title,
          hook: item.title,
          reason: "완성 영상 불러오기",
          scriptReady: true,
          recommended: false,
          category: item.category,
        }, ...current]);
    setSelectedTopicId(item.topicId);
    resetDownstream();
    window.history.replaceState(null, "", `/money-shorts?resumeTopicId=${encodeURIComponent(item.topicId)}`);
  }, [resetDownstream]);

  // ── 단계 실행 핸들러 ─────────────────────────────────────────────────────────

  const runTopicRecommend = useCallback(async () => {
    if (!category) return;
    setTopicState("running");
    setTopicResult(null);
    try {
      const r = await postAction("topicRecommend", {
        category,
        financeSubtopic: category === "finance" && financeSubtopic !== "all" ? financeSubtopic : undefined,
      });
      setTopicResult(r);
      setTopicState(r.status === "success" ? "success" : r.status);
      const list = (r.raw as { topics?: WizardTopic[] } | undefined)?.topics;
      if (r.status === "success" && Array.isArray(list)) {
        setTopics(list);
        const raw = r.raw as { editorialSummary?: WizardEditorialPreferenceSummary } | undefined;
        if (raw?.editorialSummary) setEditorialSummary(raw.editorialSummary);
        // 편집 후보는 Owner가 '만든다'로 판정하기 전에는 제작 주제로 자동 선택하지 않는다.
        setSelectedTopicId(list[0]?.requiresEditorialDecision ? null : (list[0]?.topicId ?? null));
        setPreferenceMessage(null);
        resetDownstream();
      }
    } catch (error) {
      setTopicState("error");
      setTopicResult({
        action: "topicRecommend",
        status: "error",
        summary:
          error instanceof Error && error.name === "AbortError"
            ? "주제 추천 시간이 초과됐습니다. 다시 눌러 주세요."
            : "주제 추천 요청에 실패했습니다.",
      });
    }
  }, [category, financeSubtopic, resetDownstream]);

  const runTopicPreference = useCallback(
    async (topicId: string, decision: "make" | "maybe" | "reject") => {
      setPreferenceBusyId(topicId);
      setPreferenceMessage(null);
      try {
        const r = await postAction("topicPreference", { topicId, decision });
        if (r.status !== "success") {
          setPreferenceMessage(r.summary);
          return;
        }
        const raw = r.raw as {
          topic?: WizardTopic;
          editorialSummary?: WizardEditorialPreferenceSummary;
        } | undefined;
        if (raw?.topic) {
          setTopics((current) => current.map((topic) => (topic.topicId === topicId ? { ...topic, ...raw.topic } : topic)));
        }
        if (raw?.editorialSummary) setEditorialSummary(raw.editorialSummary);
        if (decision === "make") {
          setSelectedTopicId(topicId);
          resetDownstream();
        } else if (selectedTopicId === topicId) {
          setSelectedTopicId(null);
          resetDownstream();
        }
        setPreferenceMessage(r.summary);
      } catch {
        setPreferenceMessage("편집 판정 저장 요청에 실패했습니다.");
      } finally {
        setPreferenceBusyId(null);
      }
    },
    [resetDownstream, selectedTopicId],
  );

  // 실제 미디어 준비 상태(media quality gate)를 조회한다 — 읽기 전용, 언제든 안전.
  const refreshRealMedia = useCallback(async (topicId: string) => {
    try {
      const r = await postAction("realMediaStatus", { topicId });
      const raw = r.raw as { media?: WizardRealMedia; flowMotion?: WizardFlowMotionStatus } | undefined;
      if (r.status === "success" && raw?.media) setRealMedia(raw.media);
      if (r.status === "success" && raw?.flowMotion) setFlowMotion(raw.flowMotion);
    } catch {
      // 상태 조회 실패는 조용히 무시(다음 단계 버튼이 다시 조회한다).
    }
  }, []);

  useEffect(() => {
    if (localDev !== true) return;
    const listTimer = window.setTimeout(() => void refreshUploadReadyList(), 0);
    const castTimer = window.setTimeout(() => void refreshCharacterCast(), 0);
    return () => {
      window.clearTimeout(listTimer);
      window.clearTimeout(castTimer);
    };
  }, [localDev, refreshCharacterCast, refreshUploadReadyList]);

  // 주제를 고르면 그 주제의 실제 제작 진행 상태를 복원한다(이전 세션 산출물 이어가기).
  useEffect(() => {
    if (localDev !== true || !selectedTopicId) return;
    const refreshTimer = window.setTimeout(() => {
      void refreshRealMedia(selectedTopicId);
    }, 0);
    return () => window.clearTimeout(refreshTimer);
  }, [localDev, selectedTopicId, refreshRealMedia]);

  const runScriptPreview = useCallback(async () => {
    if (!selectedTopicId) return;
    setScriptState("running");
    setScriptResult(null);
    setScript(null);
    setScriptEngine(null);
    try {
      const r = await postAction("scriptPreview", { topicId: selectedTopicId });
      setScriptResult(r);
      setScriptState(r.status === "success" ? "success" : r.status);
      const raw = r.raw as { script?: WizardScript; scriptEngine?: WizardScriptEngine } | undefined;
      if (raw?.script) setScript(raw.script);
      if (r.status === "success" && raw?.scriptEngine) setScriptEngine(raw.scriptEngine);
      if (r.status === "success") void refreshRealMedia(selectedTopicId);
    } catch {
      setScriptState("error");
      setScriptResult({ action: "scriptPreview", status: "error", summary: "대본 요청에 실패했습니다." });
    }
  }, [selectedTopicId, refreshRealMedia]);

  // 실제 목소리 만들기 — Owner 클릭이 곧 실행 승인. 몇십 초 걸릴 수 있다.
  const runRealTts = useCallback(async () => {
    if (!selectedTopicId) return;
    setRealTtsState("running");
    setRealTtsResult(null);
    try {
      const r = await postAction("realTtsCreate", { topicId: selectedTopicId });
      setRealTtsResult(r);
      setRealTtsState(r.status === "success" ? "success" : r.status);
      setAudioKey((k) => k + 1);
      await refreshRealMedia(selectedTopicId);
    } catch {
      setRealTtsState("error");
      setRealTtsResult({ action: "realTtsCreate", status: "error", summary: "실제 목소리 생성 요청에 실패했습니다." });
    }
  }, [selectedTopicId, refreshRealMedia]);

  // 장면 이미지 만들기 — 확정 대본의 흐름 기반 장면 수, 재클릭 시 모자란 장면만 이어서 생성한다.
  const runSceneImages = useCallback(async () => {
    if (!selectedTopicId) return;
    setImagesState("running");
    setImagesResult(null);
    try {
      const r = await postAction("realSceneImagesCreate", { topicId: selectedTopicId });
      setImagesResult(r);
      setImagesState(r.status === "success" ? "success" : r.status);
      await refreshRealMedia(selectedTopicId);
    } catch {
      setImagesState("error");
      setImagesResult({ action: "realSceneImagesCreate", status: "error", summary: "장면 이미지 생성 요청에 실패했습니다." });
    }
  }, [selectedTopicId, refreshRealMedia]);

  // Flow 모션 준비 — 로컬 패킷과 승인 대기 상태만 생성한다. 외부 브라우저/크레딧 작업은 하지 않는다.
  const runFlowMotionPrepare = useCallback(async () => {
    if (!selectedTopicId) return;
    setFlowMotionState("running");
    setFlowMotionResult(null);
    try {
      const r = await postAction("flowMotionPrepare", { topicId: selectedTopicId });
      const raw = r.raw as { flowMotion?: WizardFlowMotionStatus } | undefined;
      if (raw?.flowMotion) setFlowMotion(raw.flowMotion);
      setFlowMotionResult(r);
      setFlowMotionState(r.status === "success" ? "success" : r.status);
      await refreshRealMedia(selectedTopicId);
    } catch {
      setFlowMotionState("error");
      setFlowMotionResult({ action: "flowMotionPrepare", status: "error", summary: "Flow 모션 작업 패킷을 준비하지 못했습니다." });
    }
  }, [selectedTopicId, refreshRealMedia]);

  // 최종 영상 만들기 — 실제 음성 + 흐름 기반 실제 이미지 + 자막 + 모션 합성.
  const runFinalVideo = useCallback(async () => {
    if (!selectedTopicId) return;
    setFinalVideoState("running");
    setFinalVideoResult(null);
    try {
      const r = await postAction("finalVideoCreate", { topicId: selectedTopicId });
      setFinalVideoResult(r);
      setFinalVideoState(r.status === "success" ? "success" : r.status);
      setPreviewKey((k) => k + 1);
      await refreshRealMedia(selectedTopicId);
    } catch {
      setFinalVideoState("error");
      setFinalVideoResult({ action: "finalVideoCreate", status: "error", summary: "최종 영상 합성 요청에 실패했습니다." });
    }
  }, [selectedTopicId, refreshRealMedia]);

  const runVoiceSample = useCallback(async () => {
    if (!selectedTopicId) return;
    setVoiceState("running");
    setVoiceResult(null);
    try {
      const r = await postAction("voiceSample", { topicId: selectedTopicId });
      setVoiceResult(r);
      setVoiceState(r.status === "success" ? "success" : r.status);
    } catch {
      setVoiceState("error");
      setVoiceResult({ action: "voiceSample", status: "error", summary: "음성 시안 요청에 실패했습니다." });
    }
  }, [selectedTopicId]);

  const runVideoCreate = useCallback(async () => {
    if (!selectedTopicId) return;
    setVideoState("running");
    setVideoResult(null);
    try {
      const r = await postAction("videoCreate", { topicId: selectedTopicId });
      setVideoResult(r);
      setVideoState(r.status === "success" ? "success" : r.status);
    } catch {
      setVideoState("error");
      setVideoResult({ action: "videoCreate", status: "error", summary: "영상 만들기 요청에 실패했습니다." });
    }
  }, [selectedTopicId]);

  const runPreviewStatus = useCallback(async () => {
    if (!selectedTopicId) return;
    setPreviewState("running");
    setPreviewResult(null);
    try {
      const r = await postAction("previewStatus", { topicId: selectedTopicId });
      setPreviewResult(r);
      setPreviewState(r.status === "success" ? "success" : r.status);
      const raw = r.raw as { video?: WizardVideo } | undefined;
      if (r.status === "success" && raw?.video) {
        setPreviewVideo(raw.video);
        setPreviewKey((k) => k + 1);
      } else {
        setPreviewVideo(null);
      }
    } catch {
      setPreviewState("error");
      setPreviewResult({ action: "previewStatus", status: "error", summary: "미리보기 확인에 실패했습니다." });
    }
  }, [selectedTopicId]);

  const runPreflight = useCallback(async () => {
    if (!selectedTopicId) return;
    setPreflightState("running");
    setPreflightResult(null);
    try {
      const r = await postAction("wizardPreflight", { topicId: selectedTopicId });
      setPreflightResult(r);
      setPreflightState(r.status === "success" ? "success" : r.status);
    } catch {
      setPreflightState("error");
      setPreflightResult({ action: "wizardPreflight", status: "error", summary: "게시 전 점검 요청에 실패했습니다." });
    }
  }, [selectedTopicId]);

  const runActualUpload = useCallback(async () => {
    if (!selectedTopicId) return;
    setUploadState("running");
    setUploadResult(null);
    try {
      const r = await postAction("actualUpload", {
        topicId: selectedTopicId,
        confirmReviewed,
        confirmDiscoveryReady,
        confirmPublish,
        confirmText: confirmText.trim(),
      });
      setUploadResult(r);
      setUploadState(r.status === "success" ? "success" : r.status);
      if (r.status === "success") void refreshUploadReadyList();
    } catch {
      setUploadState("error");
      setUploadResult({ action: "actualUpload", status: "error", summary: "업로드 요청에 실패했습니다." });
    }
  }, [selectedTopicId, confirmReviewed, confirmDiscoveryReady, confirmPublish, confirmText, refreshUploadReadyList]);

  // ── 렌더 ─────────────────────────────────────────────────────────────────────

  return (
    <section className="rounded-2xl border border-indigo-200 bg-white shadow-sm px-6 py-6">
      <div className="mb-1.5 flex items-center gap-2.5 flex-wrap">
        <h2 className="text-2xl font-bold text-slate-900">자동 쇼츠 만들기</h2>
        <span className="px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-semibold">
          확인 전에는 업로드 없음
        </span>
      </div>
      <p className="text-[15px] text-slate-600 mb-5 leading-relaxed">
        여기가 새 쇼츠 만들기 시작점입니다. 1번부터 순서대로 누르면 대본 → 실제 목소리 → 장면 이미지 → 최종 영상까지
        만들어지고, 마지막 단계에서 확인 절차를 거쳐야만 실제 업로드가 실행됩니다. 테스트 소리·시안 영상은 업로드할 수
        없습니다.
      </p>

      {localDev === false ? (
        <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-[15px] text-amber-800 font-semibold">
            실제 생성은 Owner PC에서 로컬 실행 화면으로 진행합니다.
          </p>
          <p className="text-sm text-amber-700 mt-0.5">
            이 배포 화면에서는 흐름 확인만 가능합니다. Owner PC에서 pnpm dev로 연 뒤 같은 주소를 열어 주세요.
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        {localDev === true ? (
          <section data-testid="wizard-upload-ready-library" className="border-y border-emerald-200 bg-emerald-50/60 px-5 py-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-lg font-bold text-slate-900">완성 영상 불러오기</h3>
                <p className="mt-1 text-sm text-slate-600">이미 만든 최종 영상을 다시 열어, 게시 전 점검과 실제 업로드만 진행합니다.</p>
              </div>
              <button
                type="button"
                data-testid="wizard-action-refresh-upload-ready"
                className="px-4 py-2 rounded-xl border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100 text-sm font-bold transition-colors disabled:opacity-40"
                disabled={uploadReadyState === "running" || !runnable}
                onClick={() => void refreshUploadReadyList()}
              >
                목록 새로고침
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <input
                type="search"
                data-testid="wizard-upload-ready-search"
                value={uploadReadyQuery}
                onChange={(event) => setUploadReadyQuery(event.target.value)}
                placeholder="주제명으로 찾기"
                className="w-full max-w-sm rounded-xl border border-emerald-200 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-sm font-semibold text-emerald-800">업로드 대기 {uploadReadyItems.length}개</span>
            </div>
            {uploadReadyState === "running" ? <p className="mt-3 text-sm font-semibold text-emerald-800">완성 영상을 확인하는 중입니다.</p> : null}
            {uploadReadyState === "success" && filteredUploadReadyItems.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">업로드 대기 중인 완성 영상이 없습니다.</p>
            ) : null}
            <div className="mt-3 space-y-2">
              {filteredUploadReadyItems.map((item) => {
                const selected = selectedTopicId === item.topicId;
                const blocked = item.status === "needs_attention";
                return (
                  <div
                    key={item.topicId}
                    data-testid="wizard-upload-ready-item"
                    className={`flex items-center gap-3 border px-4 py-3 ${selected ? "border-emerald-500 bg-white" : "border-emerald-200 bg-white/80"}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold text-slate-900">{item.title}</p>
                      <p className={`mt-0.5 text-sm ${blocked ? "text-amber-700" : "text-slate-600"}`}>{item.detail}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.totalParts > 1 ? `${item.totalParts}편` : "단편"}
                        {item.totalDurationSec != null ? ` · ${item.totalDurationSec.toFixed(1)}초` : ""}
                        {item.updatedAt ? ` · ${new Date(item.updatedAt).toLocaleString("ko-KR")}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      data-testid="wizard-action-load-upload-ready"
                      className="shrink-0 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={blocked || !runnable}
                      title={blocked ? "일부 게시 기록이 있어 재업로드를 막았습니다." : "완성 영상을 불러옵니다."}
                      onClick={() => selectUploadReadyItem(item)}
                    >
                      불러오기
                    </button>
                  </div>
                );
              })}
            </div>
            <ResultNote result={uploadReadyResult} />
          </section>
        ) : null}

        {/* 1. 카테고리 선택 */}
        <StepCard
          num={1}
          title="카테고리 선택"
          state={category ? "success" : "idle"}
          desc="어떤 종류의 쇼츠를 만들지 고르세요. 8개 카테고리 모두 주제 추천이 가능합니다."
        >
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const selected = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  data-testid={`wizard-category-${c.id}`}
                  onClick={() => selectCategory(c.id)}
                  className={`px-4 py-2 rounded-xl border text-[15px] font-semibold transition-colors ${
                    selected
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-indigo-50 hover:border-indigo-300"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          {category && CATEGORY_DESC[category] ? (
            <p className="text-sm text-slate-500 mt-2">{CATEGORY_DESC[category]}</p>
          ) : null}
        </StepCard>

        {/* 2. 새 주제 추천 */}
        <StepCard
          num={2}
          title="새 주제 추천"
          state={topicState}
          desc="재테크팁은 제목·문제·반전·행동을 함께 보고 판정합니다. '만든다'로 고른 후보만 대본으로 넘어갑니다."
        >
          {category === "finance" ? (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {FINANCE_SUBTOPICS.map((s) => {
                  const selected = financeSubtopic === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      data-testid={`wizard-finance-subtopic-${s.id}`}
                      onClick={() => selectFinanceSubtopic(s.id)}
                      className={`px-3.5 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                        selected
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-indigo-50 hover:border-indigo-300"
                      }`}
                      title={s.desc}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-slate-500 mt-2">
                선택: {FINANCE_SUBTOPIC_LABELS[financeSubtopic] ?? "전체"}
              </p>
            </div>
          ) : null}
          <button data-testid="wizard-action-topic-recommend" type="button" className={RUN_BTN} disabled={!runnable || !category} onClick={runTopicRecommend}>
            주제 추천받기
          </button>
          {topics.length > 0 ? (
            <button
              type="button"
              className="ml-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-[15px] font-semibold transition-colors disabled:opacity-40"
              disabled={!runnable || !category}
              onClick={runTopicRecommend}
            >
              다른 주제 보기
            </button>
          ) : null}
          {!category ? <p className="text-sm text-slate-400 mt-2">먼저 카테고리를 선택해 주세요.</p> : null}
          <ResultNote result={topicResult} />
          {editorialSummary && category === "finance" ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-bold text-slate-700">편집 판정 {editorialSummary.total}개</span>
              <span className="rounded-md bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">만든다 {editorialSummary.make}</span>
              <span className="rounded-md bg-amber-50 px-2 py-1 font-semibold text-amber-700">애매 {editorialSummary.maybe}</span>
              <span className="rounded-md bg-rose-50 px-2 py-1 font-semibold text-rose-700">버린다 {editorialSummary.reject}</span>
              <span className="text-slate-500">주제은행 미판정 {editorialSummary.remainingCalibration}</span>
            </div>
          ) : null}
          {preferenceMessage ? <p className="mt-2 text-sm font-semibold text-indigo-700">{preferenceMessage}</p> : null}
          {topics.length > 0 ? (
            <div className="mt-3 space-y-2">
              {topics.map((t) => {
                const selected = selectedTopicId === t.topicId;
                const isEditorialCandidate = t.requiresEditorialDecision === true;
                return (
                  <div
                    key={t.topicId}
                    data-testid="wizard-topic-card"
                    data-topic-id={t.topicId}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                      selected
                        ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-300"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    {!isEditorialCandidate || t.editorialDecision === "make" ? (
                      <input
                        type="radio"
                        name="wizard-topic"
                        data-testid="wizard-topic-select"
                        className="mt-1.5 accent-indigo-600 scale-125"
                        checked={selected}
                        onChange={() => selectTopic(t.topicId)}
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-slate-900">{t.title}</span>
                        {t.angle && !isEditorialCandidate ? (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold">
                            {t.angle}형
                          </span>
                        ) : null}
                        {t.editorialDecision === "make" ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                            만든다
                          </span>
                        ) : t.editorialDecision === "maybe" ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                            애매
                          </span>
                        ) : t.editorialDecision === "reject" ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                            버린다
                          </span>
                        ) : t.scriptReady ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                            대본 가능
                          </span>
                        ) : isEditorialCandidate ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold">
                            판정 필요
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-xs">
                            대본 연결 전
                          </span>
                        )}
                        {typeof t.qualityScore === "number" ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                            품질 {t.qualityScore}
                          </span>
                        ) : null}
                        {t.source === "claude_generated" && typeof t.qualityScore === "number" ? (
                          t.qualityScore >= 90 ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                              추천
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold">
                              후보
                            </span>
                          )
                        ) : null}
                        {t.source === "claude_generated" ? (
                          <span className="px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold">
                            AI 신규
                          </span>
                        ) : t.source === "local_bank" ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold">
                            백업
                          </span>
                        ) : null}
                        {t.financeSubtopic && FINANCE_SUBTOPIC_LABELS[t.financeSubtopic] ? (
                          <span className="px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold">
                            {FINANCE_SUBTOPIC_LABELS[t.financeSubtopic]}
                          </span>
                        ) : null}
                        {t.rewrittenReasons && t.rewrittenReasons.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs" title={t.rewrittenReasons.join(", ")}>
                            다듬음
                          </span>
                        ) : null}
                      </span>
                      {isEditorialCandidate ? (
                        <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-3">
                          <div className="border-l-2 border-rose-300 pl-3">
                            <p className="text-xs font-bold text-rose-600">찌르는 문제</p>
                            <p className="mt-0.5 leading-relaxed">{t.problemStatement}</p>
                          </div>
                          <div className="border-l-2 border-amber-300 pl-3">
                            <p className="text-xs font-bold text-amber-700">놓친 반전</p>
                            <p className="mt-0.5 leading-relaxed">{t.twist}</p>
                          </div>
                          <div className="border-l-2 border-emerald-300 pl-3">
                            <p className="text-xs font-bold text-emerald-700">가져갈 행동</p>
                            <p className="mt-0.5 leading-relaxed">{t.takeawayAction}</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          {t.hook ? <span className="block text-[15px] text-slate-600 mt-1">“{t.hook}”</span> : null}
                          {t.reason ? <span className="block text-sm text-slate-400 mt-0.5">{t.reason}</span> : null}
                        </>
                      )}
                      {t.noveltyNote ? <span className="block text-xs text-slate-400 mt-0.5">{t.noveltyNote}</span> : null}
                      {isEditorialCandidate ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            data-testid="wizard-topic-make"
                            disabled={preferenceBusyId !== null}
                            onClick={() => void runTopicPreference(t.topicId, "make")}
                            className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            만든다
                          </button>
                          <button
                            type="button"
                            disabled={preferenceBusyId !== null}
                            onClick={() => void runTopicPreference(t.topicId, "maybe")}
                            className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                          >
                            애매
                          </button>
                          <button
                            type="button"
                            disabled={preferenceBusyId !== null}
                            onClick={() => void runTopicPreference(t.topicId, "reject")}
                            className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                          >
                            버린다
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </StepCard>

        {/* 3. 대본 만들기 */}
        <StepCard
          num={3}
          title="대본 만들기"
          state={scriptState}
          desc="고른 주제로 쇼츠 대본을 만듭니다. 훅 문장과 전체 낭독문을 보여줍니다."
        >
          <button data-testid="wizard-action-script" type="button" className={RUN_BTN} disabled={!runnable || !selectedTopicId} onClick={runScriptPreview}>
            대본 만들기
          </button>
          {!selectedTopicId ? <p className="text-sm text-slate-400 mt-2">먼저 주제를 골라 주세요.</p> : null}
          <ResultNote result={scriptResult} />
          {script ? (
            <div className="mt-3 space-y-4">
              {/* 품질 게이트 통과 전에는 검수본으로만 표시하고 실제 제작 단계를 닫는다. */}
              <div className="rounded-2xl border-2 border-indigo-300 bg-indigo-50 px-5 py-5">
                <p className="text-base font-bold text-indigo-700 mb-1">{scriptFinalReady ? "확정 대본" : "대본 검수본"}</p>
                <p className="text-sm text-slate-500 mb-3">
                  {scriptFinalReady
                    ? "문장 내용과 순서는 그대로 사용하고, 실제 목소리 단계에서 장면에 맞는 억양·강조·호흡을 자동으로 보정합니다."
                    : "품질 기준을 통과하지 않아 실제 목소리·이미지·영상 단계로는 넘기지 않습니다."}
                </p>
                <p className="text-lg text-slate-900 leading-relaxed">{script.fullVoiceover}</p>
              </div>

              {script.videoStrategy ? (
                <div className="border-l-4 border-rose-400 bg-white px-5 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-700">최종 영상 구성</p>
                    <span className="text-xs font-semibold text-rose-700">
                      {script.videoStrategy.mode === "two_part" ? "의미 흐름 기준 2편" : "단편"}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {script.videoStrategy.parts.map((part) => (
                      <div key={part.id} className="border-t border-slate-200 pt-3">
                        <p className="text-xs font-bold text-slate-500 mb-1">
                          {part.totalParts > 1 ? `${part.partNumber}편 첫 화면` : "첫 화면"}
                        </p>
                        {part.coverLines.map((line, index) => (
                          <p
                            key={`${part.id}-${index}`}
                            className={index === 2 ? "text-xl font-bold text-rose-600" : "text-lg font-bold text-slate-900"}
                          >
                            {line.displayText}
                          </p>
                        ))}
                        {part.bridgeNarration ? (
                          <p className="mt-2 text-sm font-semibold text-indigo-700 whitespace-pre-line">{part.bridgeNarration}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* 대본 생성 방식 — 로컬 후보 선별 → Claude 1회 보정 (적용 여부 표시) */}
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-slate-600">대본 생성 방식: 로컬 후보 선별 → Claude 1회 보정</p>
                  {scriptState === "blocked" ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                      품질 기준 미달
                    </span>
                  ) : scriptEngine?.claudeApplied ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                      Claude 보정 적용됨
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                      Claude 보정 미적용 — 로컬 대본 사용 중
                    </span>
                  )}
                </div>
                {scriptState === "blocked" ? (
                  <p className="text-sm text-rose-700 mt-1">이 검수본은 실제 제작 단계에 저장되지 않았습니다.</p>
                ) : scriptEngine && !scriptEngine.claudeApplied ? (
                  <p className="text-sm text-slate-500 mt-1">{scriptEngine.note}</p>
                ) : null}
                {scriptEngine?.claudeApplied && scriptEngine.rewriteNotes.length > 0 ? (
                  <details className="mt-1.5">
                    <summary className="text-[13px] text-slate-400 cursor-pointer">Claude가 고친 부분 보기</summary>
                    <ul className="mt-1 text-sm text-slate-600 space-y-0.5">
                      {scriptEngine.rewriteNotes.map((n, i) => (
                        <li key={i}>· {n}</li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </div>

              {/* 대본 품질 점수 — 좋은 이유 / 고친 부분 / 주의할 점 (2~4줄 요약) */}
              {script.quality ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-emerald-700">대본 품질 점수</p>
                    <span className="text-2xl font-bold text-emerald-700">
                      {script.quality.overallScore}
                      <span className="text-sm font-normal text-emerald-600">/100</span>
                    </span>
                  </div>
                  {script.selectedStyle ? (
                    <p className="text-sm text-slate-500 mb-3">
                      후보 {script.candidateScores?.length ?? 3}개 중 <b className="text-slate-700">{script.selectedStyle}</b>을 골랐습니다.
                    </p>
                  ) : null}
                  <div className="space-y-2.5">
                    {script.qualitySummary?.goodReasons?.length ? (
                      <div>
                        <p className="text-[13px] font-bold text-emerald-700 mb-0.5">좋은 이유</p>
                        <ul className="text-[15px] text-slate-700 space-y-0.5">
                          {script.qualitySummary.goodReasons.map((r, i) => (
                            <li key={i}>· {r}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {script.qualitySummary?.fixedParts?.length ? (
                      <div>
                        <p className="text-[13px] font-bold text-indigo-700 mb-0.5">고친 부분</p>
                        <ul className="text-[15px] text-slate-700 space-y-0.5">
                          {script.qualitySummary.fixedParts.map((r, i) => (
                            <li key={i}>· {r}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {script.qualitySummary?.watchOuts?.length ? (
                      <div>
                        <p className="text-[13px] font-bold text-amber-700 mb-0.5">주의할 점</p>
                        <ul className="text-[15px] text-slate-700 space-y-0.5">
                          {script.qualitySummary.watchOuts.map((r, i) => (
                            <li key={i}>· {r}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                  <details className="mt-3">
                    <summary className="text-[13px] text-slate-400 cursor-pointer">개발자용 점수 자세히 보기</summary>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] text-slate-500">
                      <span>붙잡는 힘 {script.quality.retentionScore}</span>
                      <span>내 얘기 같음 {script.quality.selfRecognitionScore}</span>
                      <span>명확함 {script.quality.clarityScore}</span>
                      <span>영상화 {script.quality.visualizabilityScore}</span>
                      <span>말투 자연스러움 {script.quality.antiAiToneScore}</span>
                      <span>구체성 {script.quality.specificityScore}</span>
                    </div>
                    {script.candidateScores?.length ? (
                      <div className="mt-2 text-[13px] text-slate-500">
                        후보 점수:{" "}
                        {script.candidateScores.map((c) => `${c.style} ${c.overallScore}${c.selected ? "★" : ""}`).join(" · ")}
                      </div>
                    ) : null}
                  </details>
                </div>
              ) : null}

              {/* 첫 3초 훅 — 대본 첫 세 문장을 따로 강조 */}
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                <p className="text-sm font-bold text-indigo-600 mb-1">첫 3초 훅</p>
                <p className="text-xl font-bold text-slate-900 leading-snug">
                  “{script.captionLines?.slice(0, 3).join(" ") ?? script.hookLine ?? script.hook}”
                </p>
              </div>

              {/* 영상에 들어갈 자막 */}
              {script.captionLines && script.captionLines.length > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                  <p className="text-sm font-bold text-indigo-600 mb-2">영상에 들어갈 자막 {script.captionLines.length}개</p>
                  <ol className="space-y-1.5">
                    {script.captionLines.map((c, i) => (
                      <li key={i} className="flex gap-2.5 text-[15px] text-slate-800">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-bold shrink-0">
                          {i + 1}
                        </span>
                        <span className="pt-0.5">“{c}”</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {/* 장면 그림 + Veo 후보 계획 — 보조 정보 */}
              {script.scenes && script.scenes.length > 0 ? (
                <details className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                  <summary className="text-sm font-bold text-indigo-600 cursor-pointer">
                    장면 그림 계획 (보조 정보)
                  </summary>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    모든 이미지를 영상화하지 않습니다. 행동 효과가 큰 장면만 Flow 변환 후보로 자동 표시하며,
                    {` 이 영상은 최대 ${script.scenes[0]?.mediaStrategyMaxVeoScenes ?? 0}개까지 사용합니다.`}
                  </p>
                  <div className="mt-3 space-y-2">
                    {script.scenes.map((s, sceneIndex) => (
                      <div key={`${sceneIndex}-${s.id}`} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-slate-700">{s.label}</p>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold ${
                            s.mediaStrategy === "veo_motion"
                              ? "border-violet-200 bg-violet-50 text-violet-700"
                              : "border-slate-200 bg-white text-slate-500"
                          }`}>
                            {s.mediaStrategy === "veo_motion" ? "Flow 모션 후보" : "정지 이미지"}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">장면 그림: {s.visualCue}</p>
                        {s.mediaStrategy === "veo_motion" ? (
                          <p className="text-xs text-violet-600 mt-1">
                            실제 생성은 Owner 확인 후 진행 · 자동 판정 점수 {s.mediaStrategyScore ?? "-"}
                          </p>
                        ) : s.mediaStrategySource === "budget_cap" ? (
                          <p className="text-xs text-slate-400 mt-1">움직임 후보였지만 영상별 비용 상한에 따라 정지 이미지로 유지</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}

              {/* SNS 설명글 초안 — 실제 대본이 아님을 분명히 */}
              {script.uploadCaptionDraft ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                  <p className="text-sm font-bold text-indigo-600 mb-1">SNS 설명글 초안</p>
                  <p className="text-sm text-slate-500 mb-2">
                    업로드할 때 쓰는 설명글입니다. 영상이 읽는 대본과는 다릅니다.
                  </p>
                  <p className="text-[15px] text-slate-700 whitespace-pre-line leading-relaxed">
                    {script.uploadCaptionDraft}
                  </p>
                </div>
              ) : null}

              <p className="text-sm text-slate-500 px-1">
                훅 점수 {script.hookScore ?? "-"}점 · 전달력 점수 {script.clarityScore ?? "-"}점
              </p>
            </div>
          ) : null}
        </StepCard>

        {/* 4. 재테크 영상 주인공 검수 — 캐릭터 후보를 먼저 비교하고 기준 이미지를 확정 */}
        <StepCard
          num={4}
          title="주인공 이미지 검수"
          state={characterCastReady ? "success" : characterCastState}
          desc="유사한 재테크 소주제 3개씩을 한 주인공에게 묶었습니다. 각 인물의 후보 2장을 먼저 비교하고 기준 이미지를 선택합니다. 이 단계에서는 영상을 만들지 않습니다."
        >
          {characterCast ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {characterCast.characters.map((character) => (
                <section key={character.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-slate-900">{character.name} · {character.label}</p>
                      <p className="text-sm text-slate-500 mt-1 leading-relaxed">{character.role}</p>
                    </div>
                    {character.selectedCandidateNumber ? (
                      <span className="shrink-0 px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700">
                        {character.selectedCandidateNumber}번 선택
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {character.subtopics.map((subtopic) => (
                      <span key={subtopic} className="px-2 py-1 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-600">
                        {FINANCE_SUBTOPIC_LABELS[subtopic] ?? subtopic}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    data-testid={`wizard-character-create-${character.id}`}
                    className={`${RUN_BTN} mt-3`}
                    disabled={!runnable || characterCastBusyId !== null}
                    onClick={() => void createCharacterCandidates(character.id, character.candidatesReady)}
                  >
                    {character.candidatesReady ? "후보 이미지 2장 다시 만들기" : "후보 이미지 2장 만들기"}
                  </button>
                  {characterCastBusyId === character.id && characterCastState === "running" ? (
                    <p className="text-sm text-amber-700 font-semibold mt-2">{character.name} 후보 이미지 생성 중…</p>
                  ) : null}
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {character.candidates.map((candidate) => {
                      const selected = character.selectedCandidateNumber === candidate.candidateNumber;
                      return (
                        <div
                          key={candidate.candidateNumber}
                          className={`overflow-hidden rounded-lg border bg-white ${selected ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-200"}`}
                        >
                          <div className="relative aspect-[9/16] bg-slate-100">
                            {candidate.ready ? (
                              <Image
                                unoptimized
                                fill
                                sizes="(max-width: 1024px) 45vw, 240px"
                                className="object-cover"
                                alt={`${character.name} 주인공 후보 ${candidate.candidateNumber}`}
                                src={`/api/money-shorts/operator?image=character&characterId=${encodeURIComponent(character.id)}&candidate=${candidate.candidateNumber}&v=${characterImageKey}`}
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-sm text-slate-400">
                                후보 이미지 생성 전
                              </div>
                            )}
                          </div>
                          <div className="p-2.5">
                            <button
                              type="button"
                              data-testid={`wizard-character-select-${character.id}-${candidate.candidateNumber}`}
                              className={`w-full px-3 py-2 rounded-md text-sm font-bold border transition-colors disabled:opacity-40 ${selected ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}
                              disabled={!runnable || !candidate.ready || characterCastBusyId !== null}
                              onClick={() => void selectCharacterCandidate(character.id, candidate.candidateNumber)}
                            >
                              {selected ? `${candidate.candidateNumber}번 선택됨` : `${candidate.candidateNumber}번 선택`}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">주인공 검수 상태를 불러오는 중입니다.</p>
          )}
          <ResultNote result={characterCastResult} />
          <p className="text-sm text-slate-500 mt-3">
            4명 선택이 끝나야 새 장면 이미지 제작으로 넘어갈 수 있습니다. 선택 이미지는 Owner PC에만 저장됩니다.
          </p>
        </StepCard>

        {/* 5. 실제 목소리 만들기 — 확정 대본 기반 ElevenLabs 고정 목소리(테스트 소리 아님) */}
        <StepCard
          num={5}
          title="실제 목소리 만들기"
          state={realTtsReady ? "success" : realTtsState}
          desc="주제에 맞는 화자 태도와 한국어 억양을 정한 뒤, 전체 대본을 한 흐름으로 읽는 실제 음성을 만듭니다. 몇십 초 걸릴 수 있습니다."
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              data-testid="wizard-action-real-tts"
              className={RUN_BTN}
              disabled={!runnable || !selectedTopicId || !scriptFinalReady}
              onClick={runRealTts}
            >
              실제 목소리 만들기
            </button>
            {realTtsReady ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
                실제 음성 준비 ({realMedia?.realTts.durationSec?.toFixed(1) ?? "?"}초)
              </span>
            ) : realMedia && realMedia.scriptEngine.elevenLabsKeyPresent === false ? (
              <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold">
                음성 키 필요
              </span>
            ) : null}
          </div>
          {!scriptFinalReady ? (
            <p className="text-sm text-slate-400 mt-2">먼저 [대본 만들기]로 대본을 확정해 주세요.</p>
          ) : null}
          {realTtsState === "running" ? (
            <p className="text-[15px] text-amber-700 font-semibold mt-2">실제 음성 생성 중… 창을 닫지 마세요.</p>
          ) : null}
          <ResultNote result={realTtsResult} />
          {realTtsReady && selectedTopicId ? (
            <div className="mt-3 space-y-3">
              {(realMedia?.parts ?? []).map((part) => (
                <div key={part.id}>
                  <p className="text-sm font-semibold text-slate-600 mb-1">
                    {part.totalParts > 1 ? `${part.partNumber}편 음성` : "최종 음성"} · {part.realTts.durationSec?.toFixed(1) ?? "?"}초
                  </p>
                  <audio
                    key={`${part.id}-${audioKey}`}
                    controls
                    preload="metadata"
                    className="w-full max-w-[360px]"
                    src={`/api/money-shorts/operator?audio=real&topicId=${encodeURIComponent(selectedTopicId)}&part=${part.id}&v=${audioKey}`}
                  />
                </div>
              ))}
              <p className="text-sm text-slate-500">이 목소리가 각 최종 영상에 그대로 들어갑니다.</p>
            </div>
          ) : null}
          <details className="mt-3">
            <summary className="text-[13px] text-slate-400 cursor-pointer">테스트 소리 만들기 (참고용 · 업로드 불가)</summary>
            <div className="mt-2">
              <button type="button" className={RUN_BTN} disabled={!runnable || !selectedTopicId} onClick={runVoiceSample}>
                테스트 소리 만들기
              </button>
              <p className="text-sm text-slate-500 mt-2">실제 음성이 아닌 기계음입니다. 업로드 게이트에서 차단됩니다.</p>
              <ResultNote result={voiceResult} />
            </div>
          </details>
        </StepCard>

        {/* 6. 장면 이미지 만들기 — 확정 대본 장면 수 기준 ChatGPT 실제 이미지 */}
        <StepCard
          num={6}
          title="장면 이미지 만들기"
          state={realImagesReady ? "success" : imagesState}
          desc={imageStepDescription}
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              data-testid="wizard-action-real-images"
              className={RUN_BTN}
              disabled={!runnable || !selectedTopicId || !scriptFinalReady || !characterCastReady || !characterReferenceEngineReady}
              onClick={runSceneImages}
            >
              장면 이미지 만들기
            </button>
            {realImagesReady ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
                장면 이미지 준비 {realMedia.realImages.generatedCount}/{realMedia.realImages.expectedCount ?? "?"}
              </span>
            ) : realMedia && realMedia.realImages.generatedCount > 0 ? (
              <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold">
                이미지 생성 필요 ({realMedia.realImages.generatedCount}/{realMedia.realImages.expectedCount ?? "?"})
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-sm">
                이미지 생성 필요
              </span>
            )}
          </div>
          {!scriptFinalReady ? (
            <p className="text-sm text-slate-400 mt-2">먼저 [대본 만들기]로 대본을 확정해 주세요.</p>
          ) : !characterCastReady ? (
            <p className="text-sm text-amber-700 mt-2">먼저 [주인공 이미지 검수]에서 4명의 기준 이미지를 선택해 주세요.</p>
          ) : (
            <p className="text-sm text-slate-500 mt-2">
              로그인된 Chrome(AI-GPT-1 프로필)의 ChatGPT로 생성합니다. 담당 주인공의 확정 이미지는 인물 장면에만 첨부하고,
              장면마다 공간·주요 소재·구도·조명을 다르게 만듭니다. 중간에 멈추면 다시 눌러 모자란 장면만 이어서 만듭니다.
            </p>
          )}
          {imagesState === "running" ? (
            <p className="text-[15px] text-amber-700 font-semibold mt-2">
              장면 이미지 생성 중… 몇 분 걸릴 수 있습니다. 창을 닫지 마세요.
            </p>
          ) : null}
          <ResultNote result={imagesResult} />
        </StepCard>

        {/* 7. Veo 모션 준비 — 자동 선정 장면의 로컬 패킷/상태만 생성 */}
        <StepCard
          num={7}
          title="Veo 모션 준비"
          state={
            flowMotion?.state === "render_ready" || flowMotion?.state === "not_required"
              ? "success"
              : flowMotion?.state === "qa_failed"
                ? "error"
                : flowMotion?.state === "generating" || flowMotion?.state === "qa_pass"
                  ? "running"
                  : flowMotion?.state === "approval_pending"
                    ? "blocked"
                    : flowMotionState
          }
          desc="자동 선정된 장면만 Google Flow용 이미지·프롬프트 해시 패킷으로 묶고 승인 상태를 관리합니다. 이 단계에서는 브라우저를 열거나 크레딧을 사용하지 않습니다."
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              data-testid="wizard-action-flow-motion-prepare"
              className={RUN_BTN}
              disabled={!runnable || !selectedTopicId || !realImagesReady || selectedFlowMotionSceneCount === 0}
              onClick={runFlowMotionPrepare}
            >
              Flow 작업 패킷 준비
            </button>
            {flowMotion ? (
              <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-sm font-semibold">
                {FLOW_MOTION_STATUS_LABEL[flowMotion.state]} · 렌더 준비 {flowMotion.renderReadyCount}/{flowMotion.requiredCount}
              </span>
            ) : null}
          </div>
          {!realImagesReady ? (
            <p className="text-sm text-slate-400 mt-2">먼저 [장면 이미지 만들기]를 완료해 주세요.</p>
          ) : selectedFlowMotionSceneCount === 0 ? (
            <p className="text-sm text-slate-500 mt-2">이 대본에는 영상화가 필요한 장면이 없습니다. 정지 이미지 모션으로 합성합니다.</p>
          ) : (
            <p className="text-sm text-slate-500 mt-2">
              자동 선정된 {selectedFlowMotionSceneCount}개 장면만 준비합니다. 패킷에는 기준 이미지·프롬프트의 SHA-256과 정확한 승인 문구가
              들어가며, 실제 생성 전송은 별도 Owner 승인과 검수가 필요합니다.
            </p>
          )}
          {flowMotionState === "running" ? (
            <p className="text-[15px] text-amber-700 font-semibold mt-2">로컬 Flow 작업 패킷 생성 중…</p>
          ) : null}
          <ResultNote result={flowMotionResult} />
          {flowMotionPrepared && flowMotion?.parts.some((part) => part.jobs.length > 0) ? (
            <details className="mt-3">
              <summary className="text-[13px] text-slate-500 cursor-pointer">장면별 Flow 상태와 승인 문구</summary>
              <div className="mt-2 space-y-3">
                {flowMotion.parts.flatMap((part) =>
                  part.jobs.map((job) => (
                    <div key={job.jobId} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                      <p className="font-semibold text-slate-800">
                        {part.id === "single" ? "단일편" : `${part.partNumber}편`} · 장면 {job.sceneNumber} · {job.status === "render_ready" && !job.renderAssetReady ? "검수 파일 불일치" : FLOW_MOTION_STATUS_LABEL[job.status]}
                      </p>
                      <p className="mt-1 break-all">패킷: {job.packetPath}</p>
                      <p className="mt-2 break-words text-xs text-slate-500">{job.requiredApprovalWording}</p>
                    </div>
                  )),
                )}
              </div>
            </details>
          ) : null}
        </StepCard>

        {/* 8. 최종 영상 만들기 — 실제 음성 + 실제 이미지 + 자막 + 모션 */}
        <StepCard
          num={8}
          title="최종 영상 만들기"
          state={finalVideoReady ? "success" : finalVideoState}
          desc={finalVideoStepDescription}
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              data-testid="wizard-action-final-video"
              className={RUN_BTN}
              disabled={!runnable || !selectedTopicId || !realTtsReady || !realImagesReady || !flowMotionReadyForRender}
              onClick={runFinalVideo}
            >
              최종 영상 만들기
            </button>
            {finalVideoReady ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
                최종 영상 {productionPartCount}개 준비 (합계 {realMedia?.finalVideo.durationSec ?? "?"}초)
              </span>
            ) : null}
          </div>
          {!realTtsReady || !realImagesReady ? (
            <p className="text-sm text-slate-400 mt-2">
              먼저 [실제 목소리 만들기]와 [장면 이미지 만들기]를 완료해 주세요. 테스트 소리·색상 카드로는 최종 영상을
              만들 수 없습니다.
            </p>
          ) : !flowMotionReadyForRender ? (
            <p className="text-sm text-amber-700 mt-2">
              자동 선정된 Veo 장면이 아직 렌더 준비 상태가 아닙니다. [Veo 모션 준비]에서 생성 승인·영상 검수까지 완료해야
              최종 영상을 만들 수 있습니다.
            </p>
          ) : null}
          {finalVideoState === "running" ? (
            <p className="text-[15px] text-amber-700 font-semibold mt-2">최종 영상 합성 중… 창을 닫지 마세요.</p>
          ) : null}
          <ResultNote result={finalVideoResult} />
          <details className="mt-3">
            <summary className="text-[13px] text-slate-400 cursor-pointer">시안 영상 만들기 (색상 카드 · 업로드 불가)</summary>
            <div className="mt-2">
              <button
                type="button"
                className={RUN_BTN}
                disabled={!runnable || !selectedTopicId || !selectedTopic?.scriptReady}
                onClick={runVideoCreate}
              >
                시안 영상 만들기
              </button>
              <p className="text-sm text-slate-500 mt-2">
                장면 이미지 없이 색상 카드로 빠르게 확인하는 테스트용입니다. 업로드 게이트에서 차단됩니다.
              </p>
              <ResultNote result={videoResult} />
            </div>
          </details>
        </StepCard>

        {/* 9. 미리보기 — 최종 영상 우선, 없으면 시안(업로드 불가) 표시 */}
        <StepCard
          num={9}
          title="미리보기"
          state={finalVideoReady ? "success" : previewState}
          desc="만들어진 영상을 이 화면에서 바로 재생합니다. 파일은 Owner PC에만 있습니다."
        >
          <button
            type="button"
            data-testid="wizard-action-preview"
            className={RUN_BTN}
            disabled={!runnable || !selectedTopicId}
            onClick={() => {
              if (selectedTopicId) void refreshRealMedia(selectedTopicId);
              // 최종 영상이 있으면 구형 색상 카드 상태를 조회하지 않는다. 그렇지 않으면
              // 최종 MP4 아래에 "영상 파일 없음"이라는 잘못된 안내가 함께 표시된다.
              if (!finalVideoReady) void runPreviewStatus();
              setPreviewKey((k) => k + 1);
            }}
          >
            미리보기
          </button>
          {finalVideoReady && selectedTopicId ? (
            <div className="mt-3 space-y-5">
              <p className="text-[15px] text-emerald-700 font-semibold mb-1.5">
                최종 영상 {productionPartCount}개 (실제 음성 + 실제 장면 이미지) — 업로드 후보
              </p>
              {(realMedia?.parts ?? []).map((part) => (
                <div key={part.id} className="border-t border-slate-200 pt-3">
                  <p className="text-sm font-bold text-slate-700 mb-2">
                    {part.totalParts > 1 ? `${part.partNumber}편` : "단편"} · {part.platformTitle}
                  </p>
                  <video
                    key={`final-${part.id}-${previewKey}`}
                    data-testid={part.partNumber === 1 ? "wizard-final-video" : `wizard-final-video-${part.partNumber}`}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full max-w-[280px] rounded-xl border border-emerald-300 bg-black"
                    src={`/api/money-shorts/operator?video=final&topicId=${encodeURIComponent(selectedTopicId)}&part=${part.id}&v=${previewKey}`}
                  />
                  <a
                    href={`/money-shorts/preview?topicId=${encodeURIComponent(selectedTopicId)}&part=${part.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-sm font-semibold text-indigo-700 hover:underline"
                  >
                    크게 보기
                  </a>
                  <p className="text-xs text-slate-400 mt-1 break-all">{part.finalVideo.mp4Path}</p>
                </div>
              ))}
            </div>
          ) : null}
          <ResultNote result={previewResult} />
          {previewVideo?.exists ? (
            <div className="mt-3">
              <p className="text-sm text-amber-700 font-semibold mb-1.5">시안 영상 (색상 카드) — 업로드 불가</p>
              <video
                key={previewKey}
                controls
                playsInline
                preload="metadata"
                className="w-full max-w-[280px] rounded-xl border border-slate-300 bg-black"
                src={`/api/money-shorts/operator?video=muxed&topicId=${encodeURIComponent(selectedTopicId ?? "")}&v=${previewKey}`}
              />
              {previewVideo.topicTitle ? (
                <p className="text-[15px] text-slate-600 mt-1.5">“{previewVideo.topicTitle}” 주제로 만든 시안입니다.</p>
              ) : null}
              <p className="text-xs text-slate-400 mt-1 break-all">{previewVideo.muxedMp4Path}</p>
            </div>
          ) : null}
        </StepCard>

        {/* 10. 게시 전 점검 — media quality gate 통과분(최종 영상)만 점검 가능 */}
        <StepCard
          num={10}
          title="게시 전 점검"
          state={preflightState}
          desc="최종 영상 기준으로 키·중복·파일을 확인만 합니다. 업로드는 하지 않습니다."
        >
          <button
            type="button"
            data-testid="wizard-action-preflight"
            className={RUN_BTN}
            disabled={!runnable || !selectedTopicId || !mediaGateOk}
            onClick={runPreflight}
          >
            게시 전 점검
          </button>
          {!mediaGateOk ? (
            <div className="mt-2 space-y-0.5">
              <p className="text-sm text-amber-700 font-semibold">
                아직 실제 음성/실제 장면 이미지가 들어간 최종 영상이 아닙니다. 업로드를 막았습니다.
              </p>
              {(realMedia?.mediaQualityGate.reasons ?? []).map((reason, i) => (
                <p key={i} className="text-sm text-slate-500">
                  · {reason}
                </p>
              ))}
            </div>
          ) : null}
          <ResultNote result={preflightResult} />
        </StepCard>

        {/* 11. 실제 업로드 — media gate + 게시 전 점검 통과 + 명시 확인 후에만 실행 */}
        <StepCard
          num={11}
          title="실제 업로드"
          state={uploadState}
          desc="확인 절차를 마치면 이 영상이 실제 계정에 게시됩니다. 게시 기록이 남아 같은 콘텐츠는 다시 올라가지 않습니다."
        >
          {uploadState === "success" ? null : (
            <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3.5 space-y-3">
              <p className="text-[15px] font-bold text-rose-700">누르면 실제 계정에 게시됩니다.</p>
              {!mediaGateOk ? (
                <p className="text-sm text-slate-500">
                  아직 실제 음성/실제 장면 이미지가 들어간 최종 영상이 아닙니다. 업로드를 막았습니다.
                </p>
              ) : !preflightDone ? (
                <p className="text-sm text-slate-500">먼저 [게시 전 점검]을 통과해야 업로드할 수 있습니다.</p>
              ) : null}
              <label className="flex items-start gap-2.5 text-[15px] text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="wizard-confirm-discovery"
                  className="mt-1 accent-rose-600 scale-125"
                  checked={confirmDiscoveryReady}
                  onChange={(e) => setConfirmDiscoveryReady(e.target.checked)}
                  disabled={!preflightDone || uploadState === "running"}
                />
                플랫폼별 제목·설명·핵심 태그와 인스타그램 추천 자격(Account Status)을 확인했습니다.
              </label>
              <label className="flex items-start gap-2.5 text-[15px] text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="wizard-confirm-reviewed"
                  className="mt-1 accent-rose-600 scale-125"
                  checked={confirmReviewed}
                  onChange={(e) => setConfirmReviewed(e.target.checked)}
                  disabled={!preflightDone || uploadState === "running"}
                />
                미리보기에서 최종 영상과 제목·설명을 검토했습니다.
              </label>
              <label className="flex items-start gap-2.5 text-[15px] text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="wizard-confirm-publish"
                  className="mt-1 accent-rose-600 scale-125"
                  checked={confirmPublish}
                  onChange={(e) => setConfirmPublish(e.target.checked)}
                  disabled={!preflightDone || uploadState === "running"}
                />
                실제 인스타그램·유튜브 계정에 게시하는 것에 동의합니다.
              </label>
              <div className="flex items-center gap-2.5 flex-wrap">
                <input
                  type="text"
                  data-testid="wizard-confirm-text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="업로드 라고 입력"
                  disabled={!preflightDone || uploadState === "running"}
                  className="w-44 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 disabled:opacity-40"
                />
                <button
                  type="button"
                  data-testid="wizard-action-upload"
                  disabled={!uploadEnabled}
                  onClick={runActualUpload}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-[15px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  인스타그램·유튜브에 업로드
                </button>
              </div>
              <p className="text-sm text-slate-500">
                확인 3개 체크 + “업로드” 입력까지 마쳐야 버튼이 켜집니다. 서버도 같은 조건을 다시 검사합니다.
              </p>
            </div>
          )}
          {uploadState === "running" ? (
            <p className="text-[15px] text-amber-700 font-semibold mt-2">
              업로드 중입니다… 창을 닫지 마세요. (최대 몇 분)
            </p>
          ) : null}
          <ResultNote result={uploadResult} />
        </StepCard>
      </div>
    </section>
  );
}
