"use client";

/**
 * VideoCreationWizard — 자동 쇼츠 만들기 위저드 (Owner용 메인 흐름).
 *
 * task: owner-one-click-video-creation-ui-v1
 *
 * 카테고리 → 주제 추천 → 대본 → 음성 → 영상 → 미리보기 → 게시 전 점검 → (실제 업로드 잠금)
 * 순서를 버튼으로 진행한다. 모든 실행은 /api/money-shorts/operator 의 고정 action enum을
 * 통해서만 이뤄지고, 이 화면은 실제 업로드/게시를 절대 실행하지 않는다.
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
};

type WizardScript = {
  title: string;
  hook: string;
  curiosity: string;
  points: string[];
  twist: string;
  action: string;
  fullVoiceover: string;
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

// ── 카테고리 (프로젝트 목표 8개) ────────────────────────────────────────────────

const CATEGORIES: Array<{ id: string; label: string; ready: boolean }> = [
  { id: "finance", label: "재테크팁", ready: true },
  { id: "ai", label: "AI생성활용", ready: false },
  { id: "meme", label: "밈&짤", ready: false },
  { id: "news", label: "충격뉴스", ready: false },
  { id: "tmi", label: "TMI지식", ready: false },
  { id: "game", label: "게임클립", ready: false },
  { id: "animal", label: "귀여운동물", ready: false },
  { id: "celeb", label: "셀럽엔터", ready: false },
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
    running: "bg-slate-700/60 text-slate-300 border-slate-600/50",
    success: "bg-emerald-900/40 text-emerald-300 border-emerald-700/50",
    blocked: "bg-amber-900/40 text-amber-300 border-amber-700/50",
    error: "bg-red-900/40 text-red-300 border-red-700/50",
  };
  const labels: Record<Exclude<RunState, "idle">, string> = {
    running: "진행 중…",
    success: "완료",
    blocked: "확인 필요",
    error: "오류",
  };
  return (
    <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold shrink-0 ${styles[state]}`}>
      {labels[state]}
    </span>
  );
}

function ResultNote({ result }: { result: OperatorResult | null }) {
  if (!result) return null;
  const color =
    result.status === "success" ? "text-emerald-300" : result.status === "blocked" ? "text-amber-300" : "text-red-300";
  return (
    <div className="mt-2 space-y-1">
      <p className={`text-xs font-semibold ${color}`}>{result.summary}</p>
      {result.detail ? <p className="text-[11px] text-slate-500 leading-relaxed">{result.detail}</p> : null}
      {result.raw != null ? (
        <details className="text-[11px] text-slate-600">
          <summary className="cursor-pointer hover:text-slate-400">개발자용 자세한 내용 보기</summary>
          <pre className="mt-1 p-2 rounded bg-slate-950/60 border border-slate-800/60 overflow-x-auto max-h-48 overflow-y-auto text-slate-500">
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
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
          {num}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-slate-200">{title}</span>
            <StateBadge state={state} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
          <div className="mt-2.5">{children}</div>
        </div>
      </div>
    </div>
  );
}

const RUN_BTN =
  "px-3.5 py-2 rounded-lg border border-indigo-600/60 bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/60 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

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

  const anyRunning = [topicState, scriptState, voiceState, videoState, previewState, preflightState].includes(
    "running",
  );
  const runnable = localDev === true && !anyRunning;

  const selectedTopic = topics.find((t) => t.topicId === selectedTopicId) ?? null;

  // ── 단계 실행 핸들러 ─────────────────────────────────────────────────────────

  const runTopicRecommend = useCallback(async () => {
    setTopicState("running");
    setTopicResult(null);
    try {
      const r = await postAction("topicRecommend");
      setTopicResult(r);
      setTopicState(r.status === "success" ? "success" : r.status);
      const list = (r.raw as { topics?: WizardTopic[] } | undefined)?.topics;
      if (r.status === "success" && Array.isArray(list)) {
        setTopics(list);
        // 대본까지 준비된 주제를 기본 선택해 전체 흐름이 바로 이어지게 한다.
        const firstReady = list.find((t) => t.scriptReady);
        setSelectedTopicId((prev) => prev ?? firstReady?.topicId ?? list[0]?.topicId ?? null);
      }
    } catch {
      setTopicState("error");
      setTopicResult({ action: "topicRecommend", status: "error", summary: "주제 추천 요청에 실패했습니다." });
    }
  }, []);

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
    setVoiceState("running");
    setVoiceResult(null);
    try {
      const r = await postAction("voiceSample");
      setVoiceResult(r);
      setVoiceState(r.status === "success" ? "success" : r.status);
    } catch {
      setVoiceState("error");
      setVoiceResult({ action: "voiceSample", status: "error", summary: "음성 시안 요청에 실패했습니다." });
    }
  }, []);

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
    setPreflightState("running");
    setPreflightResult(null);
    try {
      const r = await postAction("readyPreflight");
      setPreflightResult(r);
      setPreflightState(r.status === "success" ? "success" : r.status);
    } catch {
      setPreflightState("error");
      setPreflightResult({ action: "readyPreflight", status: "error", summary: "게시 전 점검 요청에 실패했습니다." });
    }
  }, []);

  // ── 렌더 ─────────────────────────────────────────────────────────────────────

  return (
    <section className="rounded-2xl border border-indigo-800/50 bg-indigo-950/20 px-5 py-5">
      <div className="mb-1 flex items-center gap-2 flex-wrap">
        <h2 className="text-base font-bold text-indigo-100">자동 쇼츠 만들기</h2>
        <span className="px-2 py-0.5 rounded bg-indigo-900/50 border border-indigo-700/50 text-indigo-300 text-[11px] font-semibold">
          업로드 없이 안전하게
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        여기가 새 쇼츠 만들기 시작점입니다. 1번부터 순서대로 누르면 시안 영상까지 만들어집니다. 실제 업로드는 마지막
        단계에서 별도 승인 전까지 잠겨 있습니다.
      </p>

      {localDev === false ? (
        <div className="mb-4 rounded-lg border border-amber-700/50 bg-amber-900/20 px-3.5 py-2.5">
          <p className="text-xs text-amber-300 font-semibold">
            실제 생성은 Owner PC에서 로컬 실행 화면으로 진행합니다.
          </p>
          <p className="text-[11px] text-amber-200/70 mt-0.5">
            이 배포 화면에서는 흐름 확인만 가능합니다. Owner PC에서 pnpm dev로 연 뒤 같은 주소를 열어 주세요.
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        {/* 1. 카테고리 선택 */}
        <StepCard
          num={1}
          title="카테고리 선택"
          state={category ? "success" : "idle"}
          desc="지금은 재테크팁 엔진이 준비되어 있습니다. 나머지 카테고리는 준비 중입니다."
        >
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => {
              const selected = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={!c.ready}
                  onClick={() => setCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                    selected
                      ? "border-indigo-500 bg-indigo-600 text-white"
                      : c.ready
                        ? "border-indigo-700/60 bg-indigo-900/20 text-indigo-300 hover:bg-indigo-900/50"
                        : "border-slate-800/60 bg-slate-900/30 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  {c.label}
                  {!c.ready ? <span className="ml-1 text-[10px] text-slate-600">준비 중</span> : null}
                </button>
              );
            })}
          </div>
        </StepCard>

        {/* 2. 주제 추천 */}
        <StepCard
          num={2}
          title="주제 추천"
          state={topicState}
          desc="검증해 둔 주제 후보를 보여줍니다. 마음에 드는 주제를 하나 고르세요."
        >
          <button type="button" className={RUN_BTN} disabled={!runnable || !category} onClick={runTopicRecommend}>
            주제 추천받기
          </button>
          {!category ? <p className="text-[11px] text-slate-600 mt-1.5">먼저 카테고리를 선택해 주세요.</p> : null}
          <ResultNote result={topicResult} />
          {topics.length > 0 ? (
            <div className="mt-2 space-y-1.5">
              {topics.map((t) => {
                const selected = selectedTopicId === t.topicId;
                return (
                  <label
                    key={t.topicId}
                    className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                      selected
                        ? "border-indigo-500/70 bg-indigo-900/40"
                        : "border-slate-800/60 bg-slate-900/40 hover:bg-slate-900/70"
                    }`}
                  >
                    <input
                      type="radio"
                      name="wizard-topic"
                      className="mt-1 accent-indigo-500"
                      checked={selected}
                      onChange={() => setSelectedTopicId(t.topicId)}
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-slate-200">{t.title}</span>
                        {t.scriptReady ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-900/40 border border-emerald-700/50 text-emerald-300 text-[10px] font-semibold">
                            대본 준비됨
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/50 text-slate-500 text-[10px]">
                            대본 연결 전
                          </span>
                        )}
                        {t.recommended ? (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 text-[10px] font-semibold">
                            추천
                          </span>
                        ) : null}
                      </span>
                      {t.hook ? <span className="block text-[11px] text-slate-500 mt-0.5">“{t.hook}”</span> : null}
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
          {!selectedTopicId ? <p className="text-[11px] text-slate-600 mt-1.5">먼저 주제를 골라 주세요.</p> : null}
          <ResultNote result={scriptResult} />
          {script ? (
            <div className="mt-2 rounded-lg border border-slate-800/60 bg-slate-950/50 px-3.5 py-3 space-y-2">
              <p className="text-xs text-indigo-300 font-bold">“{script.hook}”</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">{script.fullVoiceover}</p>
              <p className="text-[10px] text-slate-600">
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
          <p className="text-[11px] text-slate-600 mt-1.5">
            지금은 테스트용 소리(실제 음성 아님)로 만들어집니다. 실제 음성 생성은{" "}
            <span className="text-amber-400">다음 승인 필요</span>.
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
            <p className="text-[11px] text-slate-600 mt-1.5">
              이 주제는 아직 영상 생성까지 연결되지 않았습니다.{" "}
              <span className="text-amber-400">「대본 준비됨」</span> 표시가 있는 주제를 선택해 주세요.
            </p>
          ) : (
            <p className="text-[11px] text-slate-600 mt-1.5">
              선택한 주제의 대본·자막이 그대로 영상에 들어갑니다. 장면 이미지는 자동 색상 카드로 채워지고, 실제
              이미지 연결은 <span className="text-amber-400">다음 승인 필요</span>.
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
            <div className="mt-2.5">
              <video
                key={previewKey}
                controls
                playsInline
                preload="metadata"
                className="w-full max-w-[240px] rounded-lg border border-slate-700/60 bg-black"
                src={`/api/money-shorts/operator?video=muxed&topicId=${encodeURIComponent(selectedTopicId ?? "")}&v=${previewKey}`}
              />
              {previewVideo.topicTitle ? (
                <p className="text-[11px] text-emerald-300 mt-1">“{previewVideo.topicTitle}” 주제로 만든 시안입니다.</p>
              ) : null}
              <p className="text-[10px] text-slate-600 mt-1 break-all">{previewVideo.muxedMp4Path}</p>
            </div>
          ) : null}
        </StepCard>

        {/* 7. 게시 전 점검 */}
        <StepCard
          num={7}
          title="게시 전 점검"
          state={preflightState}
          desc="영상 파일과 설정이 게시 가능한 상태인지 확인만 합니다. 업로드는 하지 않습니다."
        >
          <button type="button" className={RUN_BTN} disabled={!runnable} onClick={runPreflight}>
            게시 전 점검
          </button>
          <ResultNote result={preflightResult} />
        </StepCard>

        {/* 8. 실제 업로드 (잠금) */}
        <StepCard num={8} title="실제 업로드" state="idle" desc="실제 업로드는 별도 승인 후 활성화됩니다.">
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="px-3.5 py-2 rounded-lg border border-slate-700/60 bg-slate-800/40 text-slate-500 text-xs font-semibold cursor-not-allowed"
          >
            실제 업로드는 다음 승인 후 활성화
          </button>
          <p className="text-[11px] text-slate-600 mt-1.5">
            이 화면의 어떤 버튼도 인스타그램·유튜브에 올리지 않습니다. 승인 전까지{" "}
            <span className="text-slate-400 font-semibold">잠김</span> 상태입니다.
          </p>
        </StepCard>
      </div>
    </section>
  );
}
