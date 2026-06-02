"use client";

/**
 * QaHistory
 * localStorage에 저장된 QA 점수 이력 — 등급·기간 필터 + 필터 기반 CSV 내보내기
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  listQaScores,
  deleteQaScore,
  downloadQaScoresCsv,
  filterQaScores,
  filterSuffix,
  QA_ISSUE_TAGS,
  QA_ISSUE_TAG_LABELS,
  type QaScoreEntry,
  type GradeFilterKey,
  type PeriodFilterKey,
  type QaIssueTag,
} from "@/lib/videoQaScores";
import QaScoreChart from "./QaScoreChart";

// ── 등급별 스타일 ──────────────────────────────────────────────────────────────

const GRADE_STYLE: Record<string, { text: string; bg: string; bar: string }> = {
  S: { text: "text-emerald-400", bg: "bg-emerald-950/40 border-emerald-800", bar: "bg-emerald-500" },
  A: { text: "text-green-400",   bg: "bg-green-950/40 border-green-800",     bar: "bg-green-500"   },
  B: { text: "text-yellow-400",  bg: "bg-yellow-950/40 border-yellow-800",   bar: "bg-yellow-500"  },
  C: { text: "text-orange-400",  bg: "bg-orange-950/40 border-orange-800",   bar: "bg-orange-500"  },
  F: { text: "text-red-400",     bg: "bg-red-950/40 border-red-800",         bar: "bg-red-600"     },
};
function gradeStyle(grade: string) {
  return GRADE_STYLE[grade] ?? GRADE_STYLE["F"];
}

// ── 필터 옵션 정의 ─────────────────────────────────────────────────────────────

const GRADE_FILTERS: Array<{ key: GradeFilterKey; label: string; hint: string }> = [
  { key: "all",    label: "전체",        hint: "" },
  { key: "upload", label: "업로드 후보", hint: "S/A" },
  { key: "review", label: "재검토",      hint: "B/C" },
  { key: "fail",   label: "실패",        hint: "F" },
];

const PERIOD_FILTERS: Array<{ key: PeriodFilterKey; label: string }> = [
  { key: "all",   label: "전체 기간" },
  { key: "today", label: "오늘"     },
  { key: "7d",    label: "최근 7일" },
  { key: "30d",   label: "최근 30일" },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface QaHistoryProps {
  onSelect: (renderId: string) => void;
  refreshToken?: number;
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export default function QaHistory({ onSelect, refreshToken }: QaHistoryProps) {
  const [allEntries, setAllEntries] = useState<QaScoreEntry[]>([]);
  const [isOpen, setIsOpen]         = useState(false);
  const [showChart, setShowChart]   = useState(false);
  const [gradeFilter, setGradeFilter]   = useState<GradeFilterKey>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterKey>("all");
  const [tagFilter, setTagFilter]       = useState<QaIssueTag[]>([]);

  const load = useCallback(() => {
    setAllEntries(listQaScores());
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshToken]);

  // ── 필터 적용 ──────────────────────────────────────────────────────────────
  const filtered = useMemo(
    () => filterQaScores(allEntries, { grade: gradeFilter, period: periodFilter, tags: tagFilter }),
    [allEntries, gradeFilter, periodFilter, tagFilter],
  );

  const isFiltered = gradeFilter !== "all" || periodFilter !== "all" || tagFilter.length > 0;

  function toggleTagFilter(tag: QaIssueTag) {
    setTagFilter((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function resetAllFilters() {
    setGradeFilter("all");
    setPeriodFilter("all");
    setTagFilter([]);
  }

  // 등급/기간 필터만 적용한 후보 기준 태그 카운트
  // (태그 버튼 옆 숫자 — 태그 필터 자신을 제외하므로 직관적)
  const tagCounts = useMemo(() => {
    const base = filterQaScores(allEntries, { grade: gradeFilter, period: periodFilter });
    const counts: Partial<Record<QaIssueTag, number>> = {};
    for (const entry of base) {
      if (!entry.issueTags) continue;
      for (const tag of entry.issueTags) {
        counts[tag] = (counts[tag] ?? 0) + 1;
      }
    }
    return counts;
  }, [allEntries, gradeFilter, periodFilter]);

  function handleDelete(e: React.MouseEvent, renderId: string) {
    e.stopPropagation();
    if (!confirm(`${renderId}의 QA 점수를 삭제하시겠습니까?`)) return;
    deleteQaScore(renderId);
    load();
  }

  function handleCsvExport(e: React.MouseEvent) {
    e.stopPropagation();
    const baseSuffix = filterSuffix(gradeFilter, periodFilter);
    // 태그 필터 적용 중이면 suffix에 "-tag" 추가
    const tagSuffix  = tagFilter.length > 0 ? "-tag" : "";
    downloadQaScoresCsv(filtered, baseSuffix + tagSuffix);
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700">

      {/* ── 헤더 ── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-300">📊 저장된 QA 점수 이력</span>
          {allEntries.length > 0 && (
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
              {isFiltered
                ? `${filtered.length} / ${allEntries.length}건`
                : `${allEntries.length}건`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* CSV 내보내기 버튼 */}
          <button
            onClick={handleCsvExport}
            disabled={filtered.length === 0}
            className="text-xs text-emerald-600 hover:text-emerald-400 disabled:text-gray-700 disabled:cursor-not-allowed px-2 py-0.5 rounded hover:bg-emerald-950/40 transition-colors whitespace-nowrap"
            title={
              filtered.length === 0
                ? "내보낼 항목이 없습니다"
                : isFiltered
                ? `필터 결과 ${filtered.length}건 CSV 내보내기`
                : "전체 CSV 내보내기"
            }
          >
            ⬇ {isFiltered ? `필터 CSV (${filtered.length})` : "CSV"}
          </button>

          {/* 새로고침 */}
          <button
            onClick={(e) => { e.stopPropagation(); load(); }}
            className="text-xs text-gray-600 hover:text-gray-400 px-2 py-0.5 rounded hover:bg-gray-700 transition-colors"
            title="새로고침"
          >
            ↺
          </button>
          <span className="text-gray-600 text-xs">{isOpen ? "▲" : "▼"}</span>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-gray-700">

          {/* ── 차트 토글 + 차트 ── */}
          {allEntries.length > 0 && (
            <>
              <button
                onClick={() => setShowChart((v) => !v)}
                className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-800/40 transition-colors border-b border-gray-800"
              >
                <span className="text-xs text-gray-500 font-medium">
                  📈 점수 추이 차트
                </span>
                <span className="text-xs text-gray-600">{showChart ? "▲" : "▼"}</span>
              </button>
              {showChart && (
                <QaScoreChart entries={filtered} isFiltered={isFiltered} />
              )}
            </>
          )}

          {/* ── 필터 바 ── */}
          {allEntries.length > 0 && (
            <div className="px-4 py-2.5 border-b border-gray-800 space-y-2">
              {/* 등급 필터 */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-gray-600 w-12 flex-shrink-0">등급</span>
                {GRADE_FILTERS.map((f) => {
                  const active = gradeFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setGradeFilter(f.key)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        active
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {f.label}
                      {f.hint && (
                        <span className={`ml-1 ${active ? "text-blue-200" : "text-gray-600"}`}>
                          {f.hint}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 기간 필터 */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-gray-600 w-12 flex-shrink-0">기간</span>
                {PERIOD_FILTERS.map((f) => {
                  const active = periodFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setPeriodFilter(f.key)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        active
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              {/* 태그 필터 */}
              <div className="flex items-start gap-1.5 flex-wrap">
                <span className="text-xs text-gray-600 w-12 flex-shrink-0 mt-1">태그</span>
                <div className="flex items-center gap-1.5 flex-wrap flex-1">
                  {QA_ISSUE_TAGS.map((tag) => {
                    const active = tagFilter.includes(tag);
                    const count  = tagCounts[tag] ?? 0;
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTagFilter(tag)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1 ${
                          active
                            ? "bg-orange-700 border-orange-600 text-white"
                            : "bg-gray-800 border-gray-700 text-gray-400 hover:border-orange-800 hover:text-orange-400"
                        }`}
                      >
                        {QA_ISSUE_TAG_LABELS[tag]}
                        {count > 0 && (
                          <span className={`text-xs font-semibold ${active ? "text-orange-200" : "text-gray-600"}`}>
                            ({count})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 전체 필터 초기화 */}
              {isFiltered && (
                <div className="flex justify-end">
                  <button
                    onClick={resetAllFilters}
                    className="text-xs text-gray-600 hover:text-gray-400 px-2 py-1 rounded hover:bg-gray-800 transition-colors"
                  >
                    ✕ 필터 초기화
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── 빈 상태 ── */}
          {allEntries.length === 0 && (
            <div className="py-10 text-center text-gray-600 text-sm">
              <p className="text-3xl mb-2">📭</p>
              <p>아직 저장된 QA 점수가 없습니다.</p>
              <p className="text-xs mt-1 text-gray-700">
                렌더를 불러온 후 점수 입력 → 저장을 누르면 여기에 기록됩니다.
              </p>
            </div>
          )}

          {/* ── 필터 결과 없음 ── */}
          {allEntries.length > 0 && filtered.length === 0 && (
            <div className="py-8 text-center text-gray-600 text-sm">
              <p className="text-2xl mb-2">🔍</p>
              <p>필터 조건에 맞는 항목이 없습니다.</p>
              <button
                onClick={resetAllFilters}
                className="mt-2 text-xs text-blue-500 hover:text-blue-400"
              >
                필터 초기화
              </button>
            </div>
          )}

          {/* ── 이력 목록 ── */}
          {filtered.length > 0 && (
            <div className="divide-y divide-gray-800">
              {filtered.map((entry) => {
                const gs  = gradeStyle(entry.grade);
                const pct = Math.min(100, entry.totalScore);

                return (
                  <div
                    key={entry.renderId}
                    onClick={() => onSelect(entry.renderId)}
                    className="px-4 py-3 flex gap-3 cursor-pointer hover:bg-gray-800/60 transition-colors group"
                  >
                    {/* 등급 배지 */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center font-black text-lg ${gs.bg} ${gs.text}`}>
                      {entry.grade}
                    </div>

                    {/* 중앙 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-200 truncate flex-1">
                          {entry.renderId}
                        </span>
                        <span className={`text-sm font-bold flex-shrink-0 ${gs.text}`}>
                          {entry.totalScore}점
                        </span>
                      </div>

                      <div className="w-full bg-gray-800 rounded-full h-1 mb-1.5">
                        <div className={`h-1 rounded-full ${gs.bar}`} style={{ width: `${pct}%` }} />
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.category && (
                          <span className="text-xs text-gray-600">{entry.category}</span>
                        )}
                        <span className="text-xs text-gray-600">{formatRelTime(entry.updatedAt)}</span>
                        {entry.comment && (
                          <span className="text-xs text-gray-500 truncate max-w-xs italic">
                            "{entry.comment.slice(0, 60)}{entry.comment.length > 60 ? "…" : ""}"
                          </span>
                        )}
                      </div>
                      {/* 문제 태그 뱃지 */}
                      {entry.issueTags && entry.issueTags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mt-0.5">
                          {entry.issueTags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-1.5 py-0.5 rounded bg-orange-950/40 border border-orange-800/50 text-orange-400"
                            >
                              {QA_ISSUE_TAG_LABELS[tag] ?? tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => handleDelete(e, entry.renderId)}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all text-xs px-1.5"
                      title="삭제"
                    >
                      🗑
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── 통계 요약 ── */}
          {filtered.length >= 2 && (
            <div className="px-4 py-2.5 border-t border-gray-800 flex gap-4 text-xs text-gray-600 flex-wrap">
              {isFiltered && (
                <span className="text-blue-500">필터 적용 중</span>
              )}
              <span>
                평균:{" "}
                <span className="text-gray-400 font-semibold">
                  {Math.round(filtered.reduce((s, e) => s + e.totalScore, 0) / filtered.length)}점
                </span>
              </span>
              <span>
                최고:{" "}
                <span className="text-green-400 font-semibold">
                  {Math.max(...filtered.map((e) => e.totalScore))}점
                </span>
              </span>
              <span>
                최저:{" "}
                <span className="text-red-400 font-semibold">
                  {Math.min(...filtered.map((e) => e.totalScore))}점
                </span>
              </span>
              <span>
                합격(70+):{" "}
                <span className="text-gray-400 font-semibold">
                  {filtered.filter((e) => e.totalScore >= 70).length}/{filtered.length}
                </span>
              </span>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ── 유틸 ─────────────────────────────────────────────────────────────────────

function formatRelTime(iso: string): string {
  try {
    const diff    = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1)  return "방금";
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)   return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  } catch {
    return "—";
  }
}
