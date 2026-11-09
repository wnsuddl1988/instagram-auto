"use client";

/**
 * /review — 감동사연 렌더 결과 수동 QA 리뷰 화면
 * renderId 입력 → plan.json 읽기 → 씬별 이미지/narration/caption 표시
 * + QA rubric 항목 참조 표시
 */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { RenderListItem } from "@/app/api/review/list/route";
import QaScorePanel from "./QaScorePanel";
import QaHistory from "./QaHistory";
import VoiceConfigPanel from "@/components/VoiceConfigPanel";
import VoiceTestHistory from "@/components/VoiceTestHistory";
import { getVoiceCandidates, getSelectedVoiceMap, type VoiceCandidate, type SelectedVoiceEntry } from "@/lib/voiceConfig";
import { getQaScoreIds, getQaScore, type QaScoreEntry } from "@/lib/videoQaScores";

// ── 선택된 보이스 후보 localStorage 헬퍼 ─────────────────────────────────────
// renderId별 키: autoshorts:selected-voice:v1:<renderId>
// renderId 없는 임시 선택: autoshorts:selected-voice:v1 (하위 호환)
const VOICE_SEL_KEY_BASE = "autoshorts:selected-voice:v1";

function voiceSelKey(renderId?: string | null): string {
  return renderId ? `${VOICE_SEL_KEY_BASE}:${renderId}` : VOICE_SEL_KEY_BASE;
}
function loadSelectedVoiceId(renderId?: string | null): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(voiceSelKey(renderId)); } catch { return null; }
}
function saveSelectedVoiceId(id: string | null, renderId?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (id) localStorage.setItem(voiceSelKey(renderId), id);
    else localStorage.removeItem(voiceSelKey(renderId));
  } catch { /* 무시 */ }
}

// NEXT_PUBLIC_ALLOW_ELEVENLABS=true 로 설정하면 ElevenLabs 슬롯 활성화
// (실제 API 호출은 별도 가드에서 막음 — 여기서는 UI 표시용으로만 사용)
const ALLOW_ELEVENLABS = process.env.NEXT_PUBLIC_ALLOW_ELEVENLABS === "true";
// NEXT_PUBLIC_ALLOW_OPENAI_TTS=true 로 설정하면 OpenAI TTS 테스트 버튼 활성화
const ALLOW_OPENAI_TTS = process.env.NEXT_PUBLIC_ALLOW_OPENAI_TTS === "true";

// ── 타입 ─────────────────────────────────────────────────────────────────────

interface SceneReview {
  sceneNumber: number;
  durationSec: number;
  narration: string;
  caption: string;
  emphasis?: string;
  imagePrompt?: string;
  motion?: string;
  visualAnchorId?: string;
  imageProvider?: string;
  sceneImageExists: boolean;
  sceneImagePath: string | null;
  coverImageExists: boolean;
  segmentExists: boolean;
}

interface ReviewData {
  renderId: string;
  referenceStyle: string | null;
  title: string | null;
  sceneCount: number;
  estimatedDuration: number | null;
  videoPublicUrl: string | null;
  videoExists: boolean;
  narrationExists: boolean;
  isPartial: boolean;
  generatedSceneCount: number;
  failedScenes: number[];
  scenes: SceneReview[];
  warnings?: unknown[];
  savedAt?: string;
}

// ── 상수 ─────────────────────────────────────────────────────────────────────

const MOTION_LABELS: Record<string, string> = {
  slow_zoom_in: "🔍 slow zoom in",
  slow_zoom_out: "🔎 slow zoom out",
  pulse: "💫 pulse",
  pan_right: "→ pan right",
  pan_left: "← pan left",
  fade_in: "✨ fade in",
  still: "⏸ still",
};

const ANCHOR_COLORS: Record<string, string> = {
  wallet_photo_anchor: "bg-amber-100 text-amber-800",
  photo_back_anchor: "bg-sky-100 text-sky-800",
  memory_table_anchor: "bg-rose-100 text-rose-800",
  hands_closeup_anchor: "bg-violet-100 text-violet-800",
  present_wallet_anchor: "bg-green-100 text-green-800",
};

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const [inputId, setInputId] = useState("");
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedScenes, setExpandedScenes] = useState<Set<number>>(new Set());
  const videoRef = useRef<HTMLVideoElement>(null);

  // ── 렌더 목록 ────────────────────────────────────────────────────────────────
  const [renderList, setRenderList] = useState<RenderListItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [showList, setShowList] = useState(true);
  // localStorage에 저장된 QA 점수 renderId 목록 (배지 표시용)
  const [qaScoreIds, setQaScoreIds] = useState<Set<string>>(new Set());
  // renderId → 선택된 보이스 후보 Map (렌더 목록 배지 표시용)
  const [voiceSelMap, setVoiceSelMap] = useState<Map<string, SelectedVoiceEntry>>(new Map());
  // QaScorePanel에서 저장/삭제 발생 시 히스토리 섹션 새로고침 트리거
  const [qaRefreshToken, setQaRefreshToken] = useState(0);
  // voice-test 샘플 생성 완료 시 VoiceTestHistory 새로고침 트리거
  const [voiceTestRefreshToken, setVoiceTestRefreshToken] = useState(0);
  // 현재 테스트 중인 candidateId (로딩 스피너 표시용)
  const [testingCandidateId, setTestingCandidateId] = useState<string | null>(null);
  // voice-test 결과 에러 메시지
  const [voiceTestError, setVoiceTestError] = useState<string | null>(null);

  // ── 선택된 보이스 후보 ──────────────────────────────────────────────────────
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);

  // ── 현재 렌더의 저장된 QA 점수 (태그 기반 안내에 사용) ───────────────────
  const currentQaEntry = useMemo<QaScoreEntry | null>(() => {
    if (!data?.renderId) return null;
    return getQaScore(data.renderId);
    // qaRefreshToken이 바뀔 때마다 재계산 (QaScorePanel에서 저장/삭제 시)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.renderId, qaRefreshToken]);

  // 클라이언트에서만 localStorage 읽기 (qaRefreshToken 변경 시 배지 갱신)
  useEffect(() => {
    setQaScoreIds(getQaScoreIds());
  }, [qaRefreshToken]);

  // renderId가 바뀔 때마다 해당 렌더의 보이스 선택 복원
  useEffect(() => {
    setSelectedVoiceId(loadSelectedVoiceId(data?.renderId));
  }, [data?.renderId]);

  // 렌더 목록이 바뀌거나 보이스 선택이 바뀔 때 배지 맵 갱신
  const refreshVoiceSelMap = useCallback((ids: string[]) => {
    setVoiceSelMap(getSelectedVoiceMap(ids));
  }, []);

  function handleVoiceSelect(candidateId: string) {
    setSelectedVoiceId(candidateId);
    saveSelectedVoiceId(candidateId, data?.renderId);
    // 목록 배지 즉시 갱신
    refreshVoiceSelMap(renderList.map((r) => r.renderId));
  }

  function handleVoiceClear() {
    setSelectedVoiceId(null);
    saveSelectedVoiceId(null, data?.renderId);
    // 목록 배지 즉시 갱신
    refreshVoiceSelMap(renderList.map((r) => r.renderId));
  }

  /**
   * TTS 샘플 생성 — POST /api/voice-test { candidateId }
   * VoiceConfigPanel의 onTest prop으로 연결됨.
   * ALLOW_OPENAI_TTS / ALLOW_ELEVENLABS 가드는 서버 측에서도 확인하므로 여기서는 호출만 함.
   */
  async function handleVoiceTest(candidateId: string) {
    setTestingCandidateId(candidateId);
    setVoiceTestError(null);
    try {
      const res = await fetch("/api/voice-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          json.voiceIdMissing
            ? `ElevenLabs voiceId가 설정되지 않았습니다 (${candidateId})`
            : json.error ?? `HTTP ${res.status}`;
        setVoiceTestError(msg);
        return;
      }
      // 성공 — VoiceTestHistory 새로고침
      setVoiceTestRefreshToken((n) => n + 1);
    } catch (e) {
      setVoiceTestError(e instanceof Error ? e.message : String(e));
    } finally {
      setTestingCandidateId(null);
    }
  }

  const fetchList = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetch("/api/review/list");
      if (res.ok) {
        const json = await res.json();
        const items: typeof renderList = json.items ?? [];
        setRenderList(items);
        // 목록 로드 완료 후 보이스 배지 맵 갱신
        setVoiceSelMap(getSelectedVoiceMap(items.map((r) => r.renderId)));
      }
    } catch {
      // 목록 조회 실패는 조용히 무시 (메인 기능 아님)
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // ── 불러오기 ────────────────────────────────────────────────────────────────
  async function handleLoad() {
    const id = inputId.trim();
    if (!id) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/review?id=${encodeURIComponent(id)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "응답 파싱 실패" }));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json: ReviewData = await res.json();
      setData(json);
      setExpandedScenes(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function toggleScene(n: number) {
    setExpandedScenes((prev) => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });
  }

  async function handleSelectFromList(renderId: string) {
    setInputId(renderId);
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/review?id=${encodeURIComponent(renderId)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "응답 파싱 실패" }));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json: ReviewData = await res.json();
      setData(json);
      setExpandedScenes(new Set());
      setShowList(false);
      // 목록 배지 갱신 (QA 점수 + 보이스 선택)
      setQaScoreIds(getQaScoreIds());
      refreshVoiceSelMap(renderList.map((r) => r.renderId));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function expandAll() {
    if (!data) return;
    setExpandedScenes(new Set(data.scenes.map((s) => s.sceneNumber)));
  }

  function collapseAll() {
    setExpandedScenes(new Set());
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* ── 헤더 ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">📋 렌더 QA 리뷰</h1>
          <p className="text-gray-400 text-sm mt-1">
            renderId를 입력하면 plan.json을 읽어 씬별 이미지·narration·imagePrompt를 표시합니다.
          </p>
        </div>

        {/* ── 최근 렌더 목록 ── */}
        <div className="mb-4 bg-gray-900 rounded-xl border border-gray-700">
          <button
            onClick={() => setShowList((v) => !v)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-300">
              📁 최근 렌더 결과
              {renderList.length > 0 && (
                <span className="ml-2 text-xs text-gray-500 font-normal">
                  {renderList.length}건
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {listLoading && (
                <span className="text-xs text-gray-500">불러오는 중...</span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); fetchList(); }}
                className="text-xs text-gray-500 hover:text-gray-300 px-2 py-0.5 rounded hover:bg-gray-700 transition-colors"
                title="새로고침"
              >
                ↺
              </button>
              <span className="text-gray-600 text-xs">{showList ? "▲" : "▼"}</span>
            </div>
          </button>

          {showList && (
            <div className="border-t border-gray-700 max-h-72 overflow-y-auto">
              {renderList.length === 0 && !listLoading && (
                <p className="px-4 py-6 text-center text-gray-600 text-sm">
                  output/v2/ 폴더에 렌더 결과가 없습니다.
                </p>
              )}
              {renderList.map((item) => (
                <button
                  key={item.renderId}
                  onClick={() => handleSelectFromList(item.renderId)}
                  className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800 transition-colors text-left border-b border-gray-800 last:border-0 ${
                    inputId === item.renderId ? "bg-blue-950/40" : ""
                  }`}
                >
                  {/* 영상/이미지 상태 아이콘 */}
                  <span className="text-lg flex-shrink-0">
                    {item.hasVideo ? "🎬" : item.sceneImageCount > 0 ? "🖼" : "📄"}
                  </span>

                  {/* 주요 정보 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-gray-200 truncate">{item.renderId}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`text-xs ${item.hasVideo ? "text-green-400" : "text-gray-500"}`}>
                        {item.hasVideo ? "✅ 영상" : "— 영상없음"}
                      </span>
                      <span className="text-xs text-gray-500">
                        🖼 {item.sceneImageCount}장
                      </span>
                      {item.coverCount > 0 && (
                        <span className="text-xs text-gray-600">커버 {item.coverCount}</span>
                      )}
                      {item.hasPartialPlan && !item.hasPlan && (
                        <span className="text-xs text-yellow-600">⚠️ partial</span>
                      )}
                      {item.narrationExists && (
                        <span className="text-xs text-blue-400">🎙 narration</span>
                      )}
                      {qaScoreIds.has(item.renderId) && (() => {
                        const entry = getQaScore(item.renderId);
                        if (!entry) return null;
                        const badgeColor =
                          entry.grade === "S" || entry.grade === "A" ? "text-green-400 bg-green-950/50" :
                          entry.grade === "B" ? "text-yellow-400 bg-yellow-950/50" :
                          entry.grade === "C" ? "text-orange-400 bg-orange-950/50" :
                          "text-red-400 bg-red-950/50";
                        return (
                          <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${badgeColor}`}>
                            QA {entry.totalScore}점/{entry.grade}
                          </span>
                        );
                      })()}
                      {/* 보이스 선택 배지 */}
                      {voiceSelMap.has(item.renderId) && (() => {
                        const v = voiceSelMap.get(item.renderId)!;
                        const isEL = v.provider === "elevenlabs";
                        return (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded border ${
                              isEL
                                ? "text-purple-400 bg-purple-950/40 border-purple-800/60"
                                : "text-sky-400 bg-sky-950/40 border-sky-800/60"
                            }`}
                            title={`${v.provider === "elevenlabs" ? "ElevenLabs" : "OpenAI"} · ${v.label}`}
                          >
                            🎙 {v.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* 수정 시각 */}
                  <span className="text-xs text-gray-600 flex-shrink-0 text-right">
                    {formatRelativeTime(item.lastModified)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── renderId 직접 입력 ── */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLoad()}
            placeholder="예: v2_render_qa20_1779372245005"
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <button
            onClick={handleLoad}
            disabled={loading || !inputId.trim()}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-semibold text-sm transition-colors"
          >
            {loading ? "불러오는 중..." : "불러오기"}
          </button>
        </div>

        {/* ── 에러 ── */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
            ❌ {error}
          </div>
        )}

        {/* ── 메인 콘텐츠 ── */}
        {data && (
          <div className="space-y-6">

            {/* ── 상단 요약 바 ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <InfoCard label="렌더 ID" value={data.renderId} mono />
              <InfoCard label="스타일" value={data.referenceStyle ?? "—"} />
              <InfoCard label="씬 수" value={`${data.generatedSceneCount} / ${data.sceneCount}씬`} />
              <InfoCard
                label="상태"
                value={data.isPartial ? "⚠️ Partial" : "✅ Complete"}
                color={data.isPartial ? "text-yellow-400" : "text-green-400"}
              />
              {data.title && <InfoCard label="제목" value={data.title} colSpan={2} />}
              {data.estimatedDuration && (
                <InfoCard label="예상 길이" value={`${data.estimatedDuration}초`} />
              )}
              {data.failedScenes.length > 0 && (
                <InfoCard
                  label="실패 씬"
                  value={`씬 ${data.failedScenes.join(", ")}`}
                  color="text-red-400"
                />
              )}
            </div>

            {/* ── 영상 플레이어 ── */}
            <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
              <div className="px-4 py-3 border-b border-gray-700 flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-300">🎬 영상</span>
                {data.videoExists ? (
                  <span className="text-xs text-green-400">✅ 파일 있음</span>
                ) : (
                  <span className="text-xs text-gray-500">파일 없음 (렌더 미완)</span>
                )}
              </div>
              {data.videoExists && data.videoPublicUrl ? (
                <video
                  ref={videoRef}
                  src={data.videoPublicUrl}
                  controls
                  className="w-full max-h-[480px] bg-black"
                  style={{ aspectRatio: "9/16", maxWidth: "270px", margin: "0 auto", display: "block" }}
                />
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-600 text-sm">
                  영상 파일 없음
                </div>
              )}
            </div>

            {/* ── 씬 목록 ── */}
            <div className="bg-gray-900 rounded-xl border border-gray-700">
              <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-300">🎞 씬 목록</span>
                <div className="flex gap-2">
                  <button
                    onClick={expandAll}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    전체 펼치기
                  </button>
                  <span className="text-gray-600">|</span>
                  <button
                    onClick={collapseAll}
                    className="text-xs text-gray-400 hover:text-gray-300"
                  >
                    전체 접기
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-800">
                {data.scenes.map((scene) => {
                  const isExpanded = expandedScenes.has(scene.sceneNumber);
                  const isFailed = data.failedScenes.includes(scene.sceneNumber);

                  return (
                    <div key={scene.sceneNumber} className={isFailed ? "bg-red-950/20" : ""}>
                      {/* 씬 헤더 (항상 표시) */}
                      <button
                        onClick={() => toggleScene(scene.sceneNumber)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800/50 transition-colors text-left"
                      >
                        {/* 씬 번호 */}
                        <span className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300 flex-shrink-0">
                          {scene.sceneNumber}
                        </span>

                        {/* 썸네일 (작은 것) */}
                        {scene.sceneImageExists && scene.sceneImagePath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={scene.sceneImagePath}
                            alt={`씬 ${scene.sceneNumber}`}
                            className="w-10 h-16 object-cover rounded flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-16 bg-gray-800 rounded flex items-center justify-center text-gray-600 text-xs flex-shrink-0">
                            없음
                          </div>
                        )}

                        {/* 요약 정보 */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">
                            {scene.caption || "—"}
                          </p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {scene.narration}
                          </p>
                        </div>

                        {/* 배지들 */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {scene.visualAnchorId && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                                ANCHOR_COLORS[scene.visualAnchorId] ?? "bg-gray-700 text-gray-300"
                              }`}
                            >
                              {scene.visualAnchorId.replace("_anchor", "")}
                            </span>
                          )}
                          {scene.motion && (
                            <span className="text-xs text-gray-500">
                              {MOTION_LABELS[scene.motion] ?? scene.motion}
                            </span>
                          )}
                          {isFailed && (
                            <span className="text-xs text-red-400 font-bold">❌ 실패</span>
                          )}
                          <span className="text-gray-600 text-xs">{isExpanded ? "▲" : "▼"}</span>
                        </div>
                      </button>

                      {/* 씬 상세 (펼쳤을 때) */}
                      {isExpanded && (
                        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-900/50">
                          {/* 이미지 (크게) */}
                          <div>
                            {scene.sceneImageExists && scene.sceneImagePath ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={scene.sceneImagePath}
                                alt={`씬 ${scene.sceneNumber} 이미지`}
                                className="w-full max-w-xs mx-auto rounded-lg object-contain"
                                style={{ maxHeight: "360px" }}
                              />
                            ) : (
                              <div className="w-full max-w-xs mx-auto h-48 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                                이미지 없음
                              </div>
                            )}
                            <div className="mt-2 flex gap-2 text-xs text-gray-500 justify-center">
                              <span>{scene.sceneImageExists ? "✅ scene_img" : "❌ scene_img"}</span>
                              <span>{scene.coverImageExists ? "✅ cover" : "❌ cover"}</span>
                              <span>{scene.segmentExists ? "✅ segment" : "❌ segment"}</span>
                              {scene.imageProvider && (
                                <span className="text-blue-400">[{scene.imageProvider}]</span>
                              )}
                            </div>
                          </div>

                          {/* 텍스트 정보 */}
                          <div className="space-y-3">
                            <Field label="Caption" value={scene.caption} highlight />
                            <Field label="Narration" value={scene.narration} />
                            {scene.emphasis && (
                              <Field label="Emphasis" value={scene.emphasis} />
                            )}
                            {scene.imagePrompt && (
                              <Field label="Image Prompt" value={scene.imagePrompt} mono small />
                            )}
                            <div className="flex gap-4 text-xs">
                              {scene.motion && (
                                <span className="text-gray-400">
                                  Motion: <span className="text-white">{scene.motion}</span>
                                </span>
                              )}
                              <span className="text-gray-400">
                                Duration: <span className="text-white">{scene.durationSec}s</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── QA 점수 입력 패널 ── */}
            <QaScorePanel
              renderId={data.renderId}
              onSaved={() => setQaRefreshToken((n) => n + 1)}
            />

            {/* ── 하단 메타 ── */}
            {(data.savedAt || (data.warnings && data.warnings.length > 0)) && (
              <div className="text-xs text-gray-600 space-y-1 pb-4">
                {data.savedAt && <p>저장 시각: {new Date(data.savedAt).toLocaleString("ko-KR")}</p>}
                {data.warnings && data.warnings.length > 0 && (
                  <details>
                    <summary className="cursor-pointer text-yellow-600 hover:text-yellow-500">
                      ⚠️ 경고 {data.warnings.length}건
                    </summary>
                    <pre className="mt-1 text-gray-500 text-xs overflow-auto max-h-40 bg-gray-900 p-2 rounded">
                      {JSON.stringify(data.warnings, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}

          </div>
        )}

        {/* ── 안내 (데이터 없을 때) ── */}
        {!data && !loading && !error && (
          <div className="text-center py-12 text-gray-600">
            <p className="text-4xl mb-3">🎬</p>
            <p className="text-sm">renderId를 입력하고 불러오기를 눌러주세요.</p>
            <p className="text-xs mt-1 font-mono">예: v2_1779245792600</p>
          </div>
        )}

        {/* ── 목소리 개선 필요 안내 (voice_too_clear_explainer 태그 감지 시) ── */}
        {currentQaEntry?.issueTags?.includes("voice_too_clear_explainer") && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-orange-800/60 bg-orange-950/30 text-sm">
            <span className="flex-shrink-0 text-orange-400 mt-0.5">🎙</span>
            <div className="space-y-1">
              <p className="text-orange-300 font-semibold">목소리 개선 필요 — ElevenLabs 후보 비교 권장</p>
              <p className="text-orange-400/80 text-xs leading-relaxed">
                QA 점수에 <code className="bg-orange-950/60 px-1 rounded">voice_too_clear_explainer</code> 태그가 기록되어 있습니다.
                현재 OpenAI Sage는 설명조 느낌이 강할 수 있으므로, 아래 ElevenLabs 후보 슬롯에
                voiceId를 입력하고 <strong>유료 승인 후 샘플 테스트</strong>를 진행하세요.
              </p>
            </div>
          </div>
        )}

        {/* ── voice-test 에러 표시 ── */}
        {voiceTestError && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-red-800/60 bg-red-950/30 text-sm">
            <span className="flex-shrink-0 text-red-400 mt-0.5">❌</span>
            <div className="flex-1">
              <p className="text-red-300 font-semibold text-xs">샘플 생성 실패</p>
              <p className="text-red-400/80 text-xs mt-0.5">{voiceTestError}</p>
            </div>
            <button
              onClick={() => setVoiceTestError(null)}
              className="text-red-600 hover:text-red-400 text-xs flex-shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── TTS 음성 후보 패널 (항상 표시) ── */}
        <VoiceConfigPanel
          referenceStyle="emotional_story"
          allowElevenLabs={ALLOW_ELEVENLABS}
          allowOpenAITts={ALLOW_OPENAI_TTS}
          selectedId={selectedVoiceId ?? undefined}
          onSelect={handleVoiceSelect}
          onTest={handleVoiceTest}
          testingId={testingCandidateId}
        />

        {/* ── 선택된 보이스 요약 카드 ── */}
        <SelectedVoiceSummary
          selectedId={selectedVoiceId}
          referenceStyle="emotional_story"
          renderId={data?.renderId ?? null}
          onClear={handleVoiceClear}
        />

        {/* ── 이전 음성 샘플 (GET /api/voice-test 읽기 전용) ── */}
        <VoiceTestHistory
          selectedCandidateId={selectedVoiceId}
          refreshToken={voiceTestRefreshToken}
        />

        {/* ── QA 점수 이력 (항상 표시) ── */}
        <QaHistory
          refreshToken={qaRefreshToken}
          onSelect={(renderId) => {
            setInputId(renderId);
            handleSelectFromList(renderId);
          }}
        />

      </div>
    </div>
  );
}

// ── 유틸 ─────────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return "방금";
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  } catch {
    return "—";
  }
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────────────────────

function InfoCard({
  label,
  value,
  mono = false,
  color,
  colSpan,
}: {
  label: string;
  value: string;
  mono?: boolean;
  color?: string;
  colSpan?: number;
}) {
  return (
    <div
      className="bg-gray-800 rounded-lg px-3 py-2"
      style={colSpan ? { gridColumn: `span ${colSpan}` } : {}}
    >
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm font-medium truncate ${color ?? "text-white"} ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  highlight = false,
  mono = false,
  small = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p
        className={`${small ? "text-xs" : "text-sm"} ${
          highlight ? "text-white font-semibold" : "text-gray-300"
        } ${mono ? "font-mono break-all" : ""} leading-relaxed`}
      >
        {value}
      </p>
    </div>
  );
}

// ── 선택된 보이스 요약 카드 ────────────────────────────────────────────────────

function SelectedVoiceSummary({
  selectedId,
  referenceStyle,
  renderId,
  onClear,
}: {
  selectedId: string | null;
  referenceStyle: string;
  renderId: string | null;
  onClear: () => void;
}) {
  // renderId 없고 선택도 없으면 아무것도 표시 안 함
  if (!renderId && !selectedId) return null;

  // renderId는 있지만 선택이 없는 경우 → "아직 선택 없음" 안내
  if (!selectedId) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 px-4 py-3">
        <p className="text-xs text-gray-600">
          🎙 <span className="font-mono text-gray-700">{renderId}</span>에 저장된 보이스 선택이 없습니다.
          <span className="ml-1 text-gray-700">위 목록에서 후보를 클릭해 선택하세요.</span>
        </p>
      </div>
    );
  }

  const candidates = getVoiceCandidates(referenceStyle);
  const c: VoiceCandidate | undefined = candidates.find((v) => v.id === selectedId);
  if (!c) return null;

  const isElevenLabs = c.provider === "elevenlabs";
  const missingVoiceId = isElevenLabs && !c.elevenLabsVoiceId;

  // 파라미터 요약 한 줄
  let paramSummary = "";
  if (c.provider === "openai") {
    const parts: string[] = [];
    if (c.openaiVoice) parts.push(`voice: ${c.openaiVoice}`);
    if (c.openaiModel) parts.push(`model: ${c.openaiModel}`);
    if (c.openaiSpeed != null) parts.push(`speed: ${c.openaiSpeed}`);
    paramSummary = parts.join("  ·  ");
  } else {
    const parts: string[] = [];
    parts.push(`voiceId: ${c.elevenLabsVoiceId ?? "미설정"}`);
    if (c.elevenLabsStability != null) parts.push(`stability: ${c.elevenLabsStability}`);
    if (c.elevenLabsStyle != null)     parts.push(`style: ${c.elevenLabsStyle}`);
    paramSummary = parts.join("  ·  ");
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 px-4 py-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">✅ 선택된 TTS 후보</span>
          {renderId ? (
            <span className="text-xs text-blue-500 font-mono bg-blue-950/30 px-1.5 py-0.5 rounded border border-blue-900/50">
              이 렌더에 저장됨
            </span>
          ) : (
            <span className="text-xs text-gray-600">임시 선택</span>
          )}
        </div>
        <button
          onClick={onClear}
          className="text-xs text-gray-600 hover:text-gray-400 px-1.5 py-0.5 rounded hover:bg-gray-800 transition-colors"
          title="선택 해제"
        >
          ✕ 해제
        </button>
      </div>

      {/* 카드 본문 */}
      <div className="flex items-start gap-3">
        {/* provider 뱃지 */}
        <span
          className={[
            "flex-shrink-0 mt-0.5 text-xs px-2 py-1 rounded font-mono",
            isElevenLabs
              ? "bg-purple-950/60 text-purple-400 border border-purple-800/60"
              : "bg-sky-950/60 text-sky-400 border border-sky-800/60",
          ].join(" ")}
        >
          {isElevenLabs ? "ElevenLabs" : "OpenAI"}
        </span>

        <div className="flex-1 min-w-0 space-y-1">
          {/* label + 상태 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{c.label}</span>
            {missingVoiceId ? (
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-950/60 border border-red-800/60 text-red-400">
                voiceId 필요
              </span>
            ) : (
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
                사용 가능
              </span>
            )}
            {/* 테스트 버튼 — 비활성 (API 호출 없음) */}
            <button
              disabled
              className="text-xs px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-600 cursor-not-allowed"
              title="TTS 테스트는 ElevenLabs 활성화 후 사용 가능합니다"
            >
              🎙 나중에 테스트
            </button>
          </div>

          {/* description */}
          <p className="text-xs text-gray-400 leading-relaxed">{c.description}</p>

          {/* recommendedUse */}
          <p className="text-xs text-gray-500">📌 {c.recommendedUse}</p>

          {/* 파라미터 요약 */}
          <p className="text-xs font-mono text-gray-600">{paramSummary}</p>
        </div>
      </div>
    </div>
  );
}
