"use client";

/**
 * VoiceTestHistory
 * GET /api/voice-test 로 최근 voice-test 세션 목록을 가져와 표시.
 *
 * - 오디오 재생: HTML <audio> 태그 (브라우저 내장 플레이어)
 * - 새 TTS 생성 없음 — 읽기 전용 조회 전용
 * - POST /api/voice-test 호출 금지
 */

import { useEffect, useState, useCallback } from "react";

// ── 타입 ─────────────────────────────────────────────────────────────────────

interface SampleResult {
  label: string;
  url: string;
  provider: string;
  voice?: string;
  speed?: number;
  model?: string;
  instructions?: string;
  durationSec: number;
  error?: string;
}

interface VoiceTestSession {
  sessionId: string;
  text?: string;
  createdAt?: string;
  /** 기존 voices 분기 */
  results?: SampleResult[];
  /** candidateId 분기 */
  candidateId?: string;
  /** candidateId 분기에서도 results 배열로 반환되므로 동일 필드 */
}

// ── 매칭 헬퍼 ─────────────────────────────────────────────────────────────────

/**
 * 세션이 선택된 후보와 관련 있는지 확인.
 * - session.candidateId 가 있으면 정확 비교 (strong match)
 * - 없으면 samples[].label 이 candidateId와 일치하는지 확인 (weak match)
 */
function matchLevel(
  session: VoiceTestSession,
  selectedId: string,
): "strong" | "weak" | "none" {
  if (!selectedId) return "none";
  // 세션 자체에 candidateId 기록된 경우 (candidateId 분기로 생성)
  if (session.candidateId === selectedId) return "strong";
  // 샘플 label이 candidateId와 일치하는 경우 (동일 candidateId로 생성된 샘플)
  const samples = session.results ?? [];
  if (samples.some((s) => s.label === selectedId)) return "strong";
  return "none";
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

interface VoiceTestHistoryProps {
  /** 현재 선택된 voice candidate ID (/review의 selectedVoiceId) */
  selectedCandidateId?: string | null;
  /**
   * 외부에서 증가시키면 세션 목록 자동 새로고침.
   * handleVoiceTest 성공 후 setVoiceTestRefreshToken((n)=>n+1) 로 트리거.
   */
  refreshToken?: number;
}

export default function VoiceTestHistory({
  selectedCandidateId,
  refreshToken,
}: VoiceTestHistoryProps = {}) {
  const [sessions, setSessions] = useState<VoiceTestSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/voice-test");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setSessions(json.sessions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // 마운트 시 + refreshToken 변경 시 목록 새로고침
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions, refreshToken]);

  function toggleSession(sessionId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(sessionId) ? next.delete(sessionId) : next.add(sessionId);
      return next;
    });
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 mt-6">
      {/* ── 헤더 ── */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-300">🔊 이전 음성 샘플</span>
          {sessions.length > 0 && (
            <span className="text-xs text-gray-500">{sessions.length}세션</span>
          )}
        </div>
        <button
          onClick={fetchSessions}
          disabled={loading}
          className="text-xs text-gray-500 hover:text-gray-300 px-2 py-0.5 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
          title="새로고침"
        >
          ↺
        </button>
      </div>

      {/* ── 로딩 ── */}
      {loading && (
        <p className="px-4 py-6 text-center text-xs text-gray-500">불러오는 중...</p>
      )}

      {/* ── 에러 ── */}
      {!loading && error && (
        <p className="px-4 py-4 text-xs text-red-400">❌ {error}</p>
      )}

      {/* ── 빈 상태 ── */}
      {!loading && !error && sessions.length === 0 && (
        <p className="px-4 py-8 text-center text-sm text-gray-600">
          아직 생성된 음성 샘플이 없습니다.
        </p>
      )}

      {/* ── 세션 목록 ── */}
      {!loading && sessions.length > 0 && (
        <div className="divide-y divide-gray-800">
          {sessions.map((session) => {
            const isExpanded = expandedIds.has(session.sessionId);
            const samples: SampleResult[] = session.results ?? [];
            const sampleCount = samples.length;
            const hasError = samples.some((s) => s.error);
            const ts = session.createdAt
              ? new Date(session.createdAt).toLocaleString("ko-KR")
              : session.sessionId.replace("vt_", "");

            // 현재 선택 후보와 매칭 여부
            const match = selectedCandidateId
              ? matchLevel(session, selectedCandidateId)
              : "none";
            const isHighlighted = match === "strong";

            return (
              <div
                key={session.sessionId}
                className={isHighlighted ? "bg-blue-950/20" : ""}
              >
                {/* 세션 헤더 */}
                <button
                  onClick={() => toggleSession(session.sessionId)}
                  className={[
                    "w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left",
                    isHighlighted
                      ? "hover:bg-blue-900/20 border-l-2 border-l-blue-500"
                      : "hover:bg-gray-800/50",
                  ].join(" ")}
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-mono text-gray-300 truncate">
                      {session.sessionId}
                    </span>
                    <span className="block text-xs text-gray-500 mt-0.5 truncate">
                      {session.candidateId && (
                        <span className={[
                          "mr-2",
                          isHighlighted ? "text-blue-300 font-semibold" : "text-blue-400",
                        ].join(" ")}>
                          🎯 {session.candidateId}
                        </span>
                      )}
                      {ts}
                    </span>
                  </span>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* 현재 선택 후보 배지 */}
                    {isHighlighted && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900/50 border border-blue-700/60 text-blue-300 whitespace-nowrap">
                        현재 선택
                      </span>
                    )}
                    {sampleCount > 0 && (
                      <span className="text-xs text-gray-500">{sampleCount}개</span>
                    )}
                    {hasError && (
                      <span className="text-xs text-red-500">⚠️ 오류있음</span>
                    )}
                    <span className="text-gray-600 text-xs">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </button>

                {/* 세션 상세 */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 bg-gray-900/40">
                    {/* 샘플 텍스트 */}
                    {session.text && (
                      <div className="pt-3">
                        <p className="text-xs text-gray-500 mb-1">샘플 텍스트</p>
                        <p className="text-xs text-gray-400 italic leading-relaxed bg-gray-800/60 px-3 py-2 rounded border border-gray-700/50">
                          &ldquo;{session.text}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* 샘플 목록 없음 */}
                    {sampleCount === 0 && (
                      <p className="text-xs text-gray-600 pt-3">
                        이 세션에는 재생 가능한 샘플이 없습니다.
                      </p>
                    )}

                    {/* 샘플 카드들 — 선택 후보와 일치하는 샘플은 강조 */}
                    {samples.map((s) => {
                      const sampleMatch =
                        selectedCandidateId &&
                        (s.label === selectedCandidateId);
                      return (
                        <SampleCard
                          key={s.label}
                          sample={s}
                          highlighted={!!sampleMatch}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── 샘플 카드 ─────────────────────────────────────────────────────────────────

function SampleCard({
  sample: s,
  highlighted = false,
}: {
  sample: SampleResult;
  highlighted?: boolean;
}) {
  const isElevenLabs = s.provider === "elevenlabs";
  const hasAudio = !!s.url && !s.error;

  return (
    <div className={[
      "rounded-lg border px-3 py-2.5",
      s.error
        ? "border-red-900/60 bg-red-950/20"
        : highlighted
        ? "border-blue-600/70 bg-blue-950/20 ring-1 ring-blue-700/40"
        : "border-gray-700/60 bg-gray-800/40",
    ].join(" ")}>
      {/* 상단 행 */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={[
              "text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0",
              isElevenLabs
                ? "bg-purple-950/60 text-purple-400 border border-purple-800/60"
                : "bg-sky-950/60 text-sky-400 border border-sky-800/60",
            ].join(" ")}
          >
            {isElevenLabs ? "ElevenLabs" : "OpenAI"}
          </span>
          <span className={[
            "text-xs font-medium truncate",
            highlighted ? "text-blue-200" : "text-gray-300",
          ].join(" ")}>
            {s.label}
          </span>
          {highlighted && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900/50 border border-blue-700/60 text-blue-300 whitespace-nowrap flex-shrink-0">
              현재 선택
            </span>
          )}
        </div>
        {s.durationSec > 0 && (
          <span className="text-xs text-gray-500 flex-shrink-0">
            {s.durationSec.toFixed(1)}s
          </span>
        )}
      </div>

      {/* 파라미터 칩 */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {s.voice && <ParamChip label="voice" value={s.voice} />}
        {s.speed != null && <ParamChip label="speed" value={String(s.speed)} />}
        {s.model && <ParamChip label="model" value={s.model} />}
      </div>

      {/* 오디오 플레이어 */}
      {hasAudio ? (
        <div className="space-y-1.5">
          <audio
            controls
            src={s.url}
            preload="none"
            className="w-full h-8"
            style={{ colorScheme: "dark" }}
          />
          <a
            href={s.url}
            download
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            ⬇ 다운로드
          </a>
        </div>
      ) : s.error ? (
        <p className="text-xs text-red-400">❌ {s.error}</p>
      ) : (
        <p className="text-xs text-gray-600">오디오 파일 없음</p>
      )}
    </div>
  );
}

// ── 파라미터 칩 ───────────────────────────────────────────────────────────────

function ParamChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-gray-700/60 text-gray-400">
      {label}:{value}
    </span>
  );
}
