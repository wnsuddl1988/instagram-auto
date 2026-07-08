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
 * Owner 명시 확인(체크 2개 + "업로드" 입력)을 모두 만족해야 실행된다.
 */

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
};

type WizardScriptScene = {
  id: string;
  label: string;
  narration: string;
  captionText: string;
  visualCue: string;
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
    expectedCount: number;
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

// ── API 호출 ─────────────────────────────────────────────────────────────────

async function postAction(action: string, extra?: Record<string, unknown>): Promise<OperatorResult> {
  const res = await fetch("/api/money-shorts/operator", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...extra }),
  });
  return (await res.json()) as OperatorResult;
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
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-5">
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

  const [topicState, setTopicState] = useState<RunState>("idle");
  const [topicResult, setTopicResult] = useState<OperatorResult | null>(null);
  const [topics, setTopics] = useState<WizardTopic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

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
  const [realTtsState, setRealTtsState] = useState<RunState>("idle");
  const [realTtsResult, setRealTtsResult] = useState<OperatorResult | null>(null);
  const [imagesState, setImagesState] = useState<RunState>("idle");
  const [imagesResult, setImagesResult] = useState<OperatorResult | null>(null);
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
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [confirmText, setConfirmText] = useState("");

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
    finalVideoState,
  ].includes("running");
  const runnable = localDev === true && !anyRunning;

  const selectedTopic = topics.find((t) => t.topicId === selectedTopicId) ?? null;

  // 실제 제작 파생 상태 — 대본 확정 → 실제 음성 → 장면 이미지 → 최종 영상 → media gate.
  const scriptFinalReady = script != null || realMedia?.scriptEngine.finalReady === true;
  const realTtsReady = realMedia?.realTts.ready === true;
  const realImagesReady = realMedia?.realImages.ready === true;
  const finalVideoReady = realMedia?.finalVideo.ready === true;
  const mediaGateOk = realMedia?.mediaQualityGate.ok === true;

  // 업로드 게이트 파생 상태 — 최종 영상(media gate) → 게시 전 점검 통과 → 명시 확인 순서를 강제한다.
  const preflightDone = mediaGateOk && preflightState === "success";
  const uploadEnabled =
    runnable &&
    selectedTopicId != null &&
    mediaGateOk &&
    preflightDone &&
    confirmReviewed &&
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
    setConfirmPublish(false);
    setConfirmText("");
  }, []);

  const selectCategory = useCallback(
    (id: string) => {
      setCategory(id);
      setTopics([]);
      setSelectedTopicId(null);
      setTopicState("idle");
      setTopicResult(null);
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

  // ── 단계 실행 핸들러 ─────────────────────────────────────────────────────────

  const runTopicRecommend = useCallback(async () => {
    if (!category) return;
    setTopicState("running");
    setTopicResult(null);
    try {
      const r = await postAction("topicRecommend", { category });
      setTopicResult(r);
      setTopicState(r.status === "success" ? "success" : r.status);
      const list = (r.raw as { topics?: WizardTopic[] } | undefined)?.topics;
      if (r.status === "success" && Array.isArray(list)) {
        setTopics(list);
        // 새 묶음이 오면 첫 주제를 자동 선택하고 이전 주제의 결과는 리셋한다.
        setSelectedTopicId(list[0]?.topicId ?? null);
        resetDownstream();
      }
    } catch {
      setTopicState("error");
      setTopicResult({ action: "topicRecommend", status: "error", summary: "주제 추천 요청에 실패했습니다." });
    }
  }, [category, resetDownstream]);

  // 실제 미디어 준비 상태(media quality gate)를 조회한다 — 읽기 전용, 언제든 안전.
  const refreshRealMedia = useCallback(async (topicId: string) => {
    try {
      const r = await postAction("realMediaStatus", { topicId });
      const raw = r.raw as { media?: WizardRealMedia } | undefined;
      if (r.status === "success" && raw?.media) setRealMedia(raw.media);
    } catch {
      // 상태 조회 실패는 조용히 무시(다음 단계 버튼이 다시 조회한다).
    }
  }, []);

  // 주제를 고르면 그 주제의 실제 제작 진행 상태를 복원한다(이전 세션 산출물 이어가기).
  useEffect(() => {
    if (localDev !== true || !selectedTopicId) return;
    void refreshRealMedia(selectedTopicId);
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
      if (r.status === "success" && raw?.script) setScript(raw.script);
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

  // 장면 이미지 만들기 — ChatGPT 이미지 6장, 몇 분 걸릴 수 있다(재클릭 시 모자란 장면만 이어서).
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

  // 최종 영상 만들기 — 실제 음성 + 실제 이미지 6장 + 자막 + 모션 합성.
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
        confirmPublish,
        confirmText: confirmText.trim(),
      });
      setUploadResult(r);
      setUploadState(r.status === "success" ? "success" : r.status);
    } catch {
      setUploadState("error");
      setUploadResult({ action: "actualUpload", status: "error", summary: "업로드 요청에 실패했습니다." });
    }
  }, [selectedTopicId, confirmReviewed, confirmPublish, confirmText]);

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
          desc="누를 때마다 새 주제를 추천합니다. 마음에 드는 주제를 고르면 아래 단계가 그 주제로 이어집니다."
        >
          <button type="button" className={RUN_BTN} disabled={!runnable || !category} onClick={runTopicRecommend}>
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
          {topics.length > 0 ? (
            <div className="mt-3 space-y-2">
              {topics.map((t) => {
                const selected = selectedTopicId === t.topicId;
                return (
                  <label
                    key={t.topicId}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                      selected
                        ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-300"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="wizard-topic"
                      className="mt-1.5 accent-indigo-600 scale-125"
                      checked={selected}
                      onChange={() => selectTopic(t.topicId)}
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-slate-900">{t.title}</span>
                        {t.angle ? (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold">
                            {t.angle}형
                          </span>
                        ) : null}
                        {t.scriptReady ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                            대본 가능
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
                        {t.rewrittenReasons && t.rewrittenReasons.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs" title={t.rewrittenReasons.join(", ")}>
                            다듬음
                          </span>
                        ) : null}
                      </span>
                      {t.hook ? <span className="block text-[15px] text-slate-600 mt-1">“{t.hook}”</span> : null}
                      {t.reason ? <span className="block text-sm text-slate-400 mt-0.5">{t.reason}</span> : null}
                    </span>
                  </label>
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
          <button type="button" className={RUN_BTN} disabled={!runnable || !selectedTopicId} onClick={runScriptPreview}>
            대본 만들기
          </button>
          {!selectedTopicId ? <p className="text-sm text-slate-400 mt-2">먼저 주제를 골라 주세요.</p> : null}
          <ResultNote result={scriptResult} />
          {script ? (
            <div className="mt-3 space-y-4">
              {/* 실제 읽히는 대본 — 가장 위에 크게. 음성/영상이 이 문장을 그대로 사용한다. */}
              <div className="rounded-2xl border-2 border-indigo-300 bg-indigo-50 px-5 py-5">
                <p className="text-base font-bold text-indigo-700 mb-1">실제 읽히는 대본</p>
                <p className="text-sm text-slate-500 mb-3">실제 목소리 만들기와 최종 영상 만들기는 이 문장을 사용합니다.</p>
                <p className="text-lg text-slate-900 leading-relaxed">{script.fullVoiceover}</p>
              </div>

              {/* 대본 생성 방식 — 로컬 후보 선별 → Claude 1회 보정 (적용 여부 표시) */}
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-slate-600">대본 생성 방식: 로컬 후보 선별 → Claude 1회 보정</p>
                  {scriptEngine?.claudeApplied ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                      Claude 보정 적용됨
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                      Claude 보정 미적용 — 로컬 대본 사용 중
                    </span>
                  )}
                </div>
                {scriptEngine && !scriptEngine.claudeApplied ? (
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

              {/* 영상에 들어갈 자막 6개 */}
              {script.captionLines && script.captionLines.length > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                  <p className="text-sm font-bold text-indigo-600 mb-2">영상에 들어갈 자막 6개</p>
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

              {/* 장면 그림 계획 — 보조 정보 */}
              {script.scenes && script.scenes.length > 0 ? (
                <details className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                  <summary className="text-sm font-bold text-indigo-600 cursor-pointer">
                    장면 그림 계획 (보조 정보)
                  </summary>
                  <div className="mt-3 space-y-2">
                    {script.scenes.map((s) => (
                      <div key={s.id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
                        <p className="text-sm font-bold text-slate-700">{s.label}</p>
                        <p className="text-sm text-slate-500 mt-0.5">장면 그림: {s.visualCue}</p>
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

        {/* 4. 실제 목소리 만들기 — 확정 대본 기반 ElevenLabs 고정 목소리(테스트 소리 아님) */}
        <StepCard
          num={4}
          title="실제 목소리 만들기"
          state={realTtsReady ? "success" : realTtsState}
          desc="확정 대본을 고정 목소리(ElevenLabs)로 실제 음성을 만듭니다. 몇십 초 걸릴 수 있습니다."
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
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
            <div className="mt-3">
              <audio
                key={audioKey}
                controls
                preload="metadata"
                className="w-full max-w-[360px]"
                src={`/api/money-shorts/operator?audio=real&topicId=${encodeURIComponent(selectedTopicId)}&v=${audioKey}`}
              />
              <p className="text-sm text-slate-500 mt-1">이 목소리가 최종 영상에 그대로 들어갑니다.</p>
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

        {/* 5. 장면 이미지 만들기 — 대본 6장면 기준 ChatGPT 실제 이미지 */}
        <StepCard
          num={5}
          title="장면 이미지 만들기"
          state={realImagesReady ? "success" : imagesState}
          desc="대본 6장면의 시각 지시로 실제 장면 이미지를 만듭니다. 몇 분 걸릴 수 있습니다."
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              className={RUN_BTN}
              disabled={!runnable || !selectedTopicId || !scriptFinalReady}
              onClick={runSceneImages}
            >
              장면 이미지 만들기
            </button>
            {realImagesReady ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
                장면 이미지 준비 6/6
              </span>
            ) : realMedia && realMedia.realImages.generatedCount > 0 ? (
              <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold">
                이미지 생성 필요 ({realMedia.realImages.generatedCount}/6)
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-sm">
                이미지 생성 필요
              </span>
            )}
          </div>
          {!scriptFinalReady ? (
            <p className="text-sm text-slate-400 mt-2">먼저 [대본 만들기]로 대본을 확정해 주세요.</p>
          ) : (
            <p className="text-sm text-slate-500 mt-2">
              로그인된 Chrome(AI-GPT-1 프로필)의 ChatGPT로 생성합니다. 중간에 멈추면 다시 눌러 모자란 장면만 이어서
              만듭니다. 색상 카드/임시 이미지는 최종 영상에 쓰지 않습니다.
            </p>
          )}
          {imagesState === "running" ? (
            <p className="text-[15px] text-amber-700 font-semibold mt-2">
              장면 이미지 생성 중… 몇 분 걸릴 수 있습니다. 창을 닫지 마세요.
            </p>
          ) : null}
          <ResultNote result={imagesResult} />
        </StepCard>

        {/* 6. 최종 영상 만들기 — 실제 음성 + 실제 이미지 + 자막 + 모션 */}
        <StepCard
          num={6}
          title="최종 영상 만들기"
          state={finalVideoReady ? "success" : finalVideoState}
          desc="실제 목소리와 장면 이미지 6장을 자막·모션과 함께 최종 mp4로 합성합니다."
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              className={RUN_BTN}
              disabled={!runnable || !selectedTopicId || !realTtsReady || !realImagesReady}
              onClick={runFinalVideo}
            >
              최종 영상 만들기
            </button>
            {finalVideoReady ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
                최종 영상 준비 ({realMedia?.finalVideo.durationSec ?? "?"}초)
              </span>
            ) : null}
          </div>
          {!realTtsReady || !realImagesReady ? (
            <p className="text-sm text-slate-400 mt-2">
              먼저 [실제 목소리 만들기]와 [장면 이미지 만들기]를 완료해 주세요. 테스트 소리·색상 카드로는 최종 영상을
              만들 수 없습니다.
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

        {/* 7. 미리보기 — 최종 영상 우선, 없으면 시안(업로드 불가) 표시 */}
        <StepCard
          num={7}
          title="미리보기"
          state={finalVideoReady ? "success" : previewState}
          desc="만들어진 영상을 이 화면에서 바로 재생합니다. 파일은 Owner PC에만 있습니다."
        >
          <button
            type="button"
            className={RUN_BTN}
            disabled={!runnable || !selectedTopicId}
            onClick={() => {
              if (selectedTopicId) void refreshRealMedia(selectedTopicId);
              void runPreviewStatus();
              setPreviewKey((k) => k + 1);
            }}
          >
            미리보기
          </button>
          {finalVideoReady && selectedTopicId ? (
            <div className="mt-3">
              <p className="text-[15px] text-emerald-700 font-semibold mb-1.5">
                최종 영상 (실제 음성 + 실제 장면 이미지) — 업로드 후보
              </p>
              <video
                key={`final-${previewKey}`}
                controls
                playsInline
                preload="metadata"
                className="w-full max-w-[280px] rounded-xl border border-emerald-300 bg-black"
                src={`/api/money-shorts/operator?video=final&topicId=${encodeURIComponent(selectedTopicId)}&v=${previewKey}`}
              />
              <p className="text-xs text-slate-400 mt-1 break-all">{realMedia?.finalVideo.mp4Path}</p>
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

        {/* 8. 게시 전 점검 — media quality gate 통과분(최종 영상)만 점검 가능 */}
        <StepCard
          num={8}
          title="게시 전 점검"
          state={preflightState}
          desc="최종 영상 기준으로 키·중복·파일을 확인만 합니다. 업로드는 하지 않습니다."
        >
          <button
            type="button"
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

        {/* 9. 실제 업로드 — media gate + 게시 전 점검 통과 + 명시 확인 후에만 실행 */}
        <StepCard
          num={9}
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
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="업로드 라고 입력"
                  disabled={!preflightDone || uploadState === "running"}
                  className="w-44 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 disabled:opacity-40"
                />
                <button
                  type="button"
                  disabled={!uploadEnabled}
                  onClick={runActualUpload}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-[15px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  인스타그램·유튜브에 업로드
                </button>
              </div>
              <p className="text-sm text-slate-500">
                확인 2개 체크 + “업로드” 입력까지 마쳐야 버튼이 켜집니다. 서버도 같은 조건을 다시 검사합니다.
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
