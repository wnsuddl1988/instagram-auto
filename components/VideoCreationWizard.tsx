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
};

type WizardScriptScene = {
  id: string;
  label: string;
  narration: string;
  captionText: string;
  visualCue: string;
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

  const anyRunning = [topicState, scriptState, voiceState, videoState, previewState, preflightState, uploadState].includes(
    "running",
  );
  const runnable = localDev === true && !anyRunning;

  const selectedTopic = topics.find((t) => t.topicId === selectedTopicId) ?? null;

  // 업로드 게이트 파생 상태 — 시안 영상 → 게시 전 점검 통과 → 명시 확인 순서를 강제한다.
  const videoDone = videoState === "success" || previewVideo?.exists === true;
  const preflightDone = videoDone && preflightState === "success";
  const uploadEnabled =
    runnable &&
    selectedTopicId != null &&
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

  const runScriptPreview = useCallback(async () => {
    if (!selectedTopicId) return;
    setScriptState("running");
    setScriptResult(null);
    setScript(null);
    try {
      const r = await postAction("scriptPreview", { topicId: selectedTopicId });
      setScriptResult(r);
      setScriptState(r.status === "success" ? "success" : r.status);
      const raw = r.raw as { script?: WizardScript } | undefined;
      if (r.status === "success" && raw?.script) setScript(raw.script);
    } catch {
      setScriptState("error");
      setScriptResult({ action: "scriptPreview", status: "error", summary: "대본 요청에 실패했습니다." });
    }
  }, [selectedTopicId]);

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
        여기가 새 쇼츠 만들기 시작점입니다. 1번부터 순서대로 누르면 시안 영상까지 만들어지고, 마지막 단계에서 확인
        절차를 거쳐야만 실제 업로드가 실행됩니다.
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
                <p className="text-sm text-slate-500 mb-3">음성 만들기와 영상 만들기는 이 문장을 사용합니다.</p>
                <p className="text-lg text-slate-900 leading-relaxed">{script.fullVoiceover}</p>
              </div>

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

        {/* 4. 음성 만들기 */}
        <StepCard
          num={4}
          title="음성 만들기"
          state={voiceState}
          desc="영상 길이에 맞는 소리 트랙을 만듭니다. 실제 사람 목소리는 다음 승인 후 연결됩니다."
        >
          <button type="button" className={RUN_BTN} disabled={!runnable || !selectedTopicId} onClick={runVoiceSample}>
            음성 만들기
          </button>
          <p className="text-sm text-slate-500 mt-2">
            지금은 테스트용 소리(실제 음성 아님)로 만들어집니다. 실제 음성 생성은{" "}
            <span className="text-amber-600 font-semibold">다음 승인 필요</span>.
          </p>
          <ResultNote result={voiceResult} />
        </StepCard>

        {/* 5. 영상 만들기 */}
        <StepCard
          num={5}
          title="영상 만들기"
          state={videoState}
          desc="고른 주제의 대본과 자막으로 시안 mp4를 만듭니다. 약 10초 걸립니다."
        >
          <button
            type="button"
            className={RUN_BTN}
            disabled={!runnable || !selectedTopicId || !selectedTopic?.scriptReady}
            onClick={runVideoCreate}
          >
            영상 만들기
          </button>
          {selectedTopic && !selectedTopic.scriptReady ? (
            <p className="text-sm text-slate-500 mt-2">
              이 주제는 아직 영상 생성까지 연결되지 않았습니다.{" "}
              <span className="text-amber-600 font-semibold">「대본 준비됨」</span> 표시가 있는 주제를 선택해 주세요.
            </p>
          ) : (
            <p className="text-sm text-slate-500 mt-2">
              선택한 주제의 대본·자막이 그대로 영상에 들어갑니다. 장면 이미지는 자동 색상 카드로 채워지고, 실제
              이미지 연결은 <span className="text-amber-600 font-semibold">다음 승인 필요</span>.
            </p>
          )}
          <ResultNote result={videoResult} />
        </StepCard>

        {/* 6. 미리보기 */}
        <StepCard
          num={6}
          title="미리보기"
          state={previewState}
          desc="만들어진 시안 영상을 이 화면에서 바로 재생합니다. 파일은 Owner PC에만 있습니다."
        >
          <button type="button" className={RUN_BTN} disabled={!runnable || !selectedTopicId} onClick={runPreviewStatus}>
            미리보기
          </button>
          <ResultNote result={previewResult} />
          {previewVideo?.exists ? (
            <div className="mt-3">
              <video
                key={previewKey}
                controls
                playsInline
                preload="metadata"
                className="w-full max-w-[280px] rounded-xl border border-slate-300 bg-black"
                src={`/api/money-shorts/operator?video=muxed&topicId=${encodeURIComponent(selectedTopicId ?? "")}&v=${previewKey}`}
              />
              {previewVideo.topicTitle ? (
                <p className="text-[15px] text-emerald-700 font-semibold mt-1.5">
                  “{previewVideo.topicTitle}” 주제로 만든 시안입니다.
                </p>
              ) : null}
              <p className="text-xs text-slate-400 mt-1 break-all">{previewVideo.muxedMp4Path}</p>
            </div>
          ) : null}
        </StepCard>

        {/* 7. 게시 전 점검 */}
        <StepCard
          num={7}
          title="게시 전 점검"
          state={preflightState}
          desc="방금 만든 그 주제의 영상 기준으로 키·중복·파일을 확인만 합니다. 업로드는 하지 않습니다."
        >
          <button
            type="button"
            className={RUN_BTN}
            disabled={!runnable || !selectedTopicId || !videoDone}
            onClick={runPreflight}
          >
            게시 전 점검
          </button>
          {!videoDone ? (
            <p className="text-sm text-slate-400 mt-2">먼저 [영상 만들기]로 시안 영상을 만들어 주세요.</p>
          ) : null}
          <ResultNote result={preflightResult} />
        </StepCard>

        {/* 8. 실제 업로드 — 시안 영상 + 게시 전 점검 통과 + 명시 확인 후에만 실행 */}
        <StepCard
          num={8}
          title="실제 업로드"
          state={uploadState}
          desc="확인 절차를 마치면 이 영상이 실제 계정에 게시됩니다. 게시 기록이 남아 같은 콘텐츠는 다시 올라가지 않습니다."
        >
          {uploadState === "success" ? null : (
            <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3.5 space-y-3">
              <p className="text-[15px] font-bold text-rose-700">누르면 실제 계정에 게시됩니다.</p>
              {!preflightDone ? (
                <p className="text-sm text-slate-500">
                  먼저 [영상 만들기]와 [게시 전 점검]을 통과해야 업로드할 수 있습니다.
                </p>
              ) : null}
              <label className="flex items-start gap-2.5 text-[15px] text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 accent-rose-600 scale-125"
                  checked={confirmReviewed}
                  onChange={(e) => setConfirmReviewed(e.target.checked)}
                  disabled={!preflightDone || uploadState === "running"}
                />
                미리보기에서 시안 영상과 제목·설명을 검토했습니다.
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
