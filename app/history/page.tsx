"use client";

import { useEffect, useState } from "react";
import HistoryTable from "@/components/HistoryTable";
import { Generation } from "@/lib/supabase";
import {
  readTopicHistory,
  clearAllTopicHistory,
  exportHistoryAsBlob,
  type TopicHistoryEntry,
} from "@/lib/topicHistory";

const TOPIC_MODE_ICON: Record<string, string> = {
  custom: "✍️",
  random: "🎲",
  preset: "📌",
};

export default function HistoryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [topicHistory, setTopicHistory] = useState<TopicHistoryEntry[]>([]);
  const [topicMsg, setTopicMsg] = useState<string>("");
  const [filterPreset, setFilterPreset] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterMode, setFilterMode] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");
  // Supabase 섹션 전용 필터
  const [genFilterPreset, setGenFilterPreset] = useState<string>("");
  const [genFilterCategory, setGenFilterCategory] = useState<string>("");
  const [genFilterDate, setGenFilterDate] = useState<string>("");
  const [genFilterStatus, setGenFilterStatus] = useState<string>("");
  const [genFilterMode, setGenFilterMode] = useState<string>("");

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => {
        setGenerations(data.generations || []);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("이력 로드 오류:", error);
        setIsLoading(false);
      });
    // localStorage topicHistory 로드
    setTopicHistory(readTopicHistory());
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 glass-card border-b border-slate-800/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                📋 생성 이력
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                지금까지 생성한 모든 스크립트의 이력을 확인하세요
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* ── Supabase generations 섹션 ──────────────────────────────────────── */}
        {(() => {
          // ── 필터 옵션 추출 ────────────────────────────────────────────────────
          const genPresetOptions = Array.from(
            new Set(
              generations
                .map((g) => g.meta_snapshot?.accountPresetName)
                .filter((v): v is string => !!v)
            )
          );
          const genCategoryOptions = Array.from(
            new Set(
              generations
                .map((g) => g.meta_snapshot?.categoryName ?? g.category_name)
                .filter((v): v is string => !!v)
            )
          );
          const genStatusOptions = Array.from(
            new Set(
              generations
                .map((g) => g.status as string | undefined)
                .filter((v): v is string => !!v)
            )
          );
          const genModeOptions = Array.from(
            new Set(
              generations
                .map((g) => g.meta_snapshot?.topicMode as string | undefined)
                .filter((v): v is string => !!v)
            )
          );

          const STATUS_LABEL: Record<string, string> = {
            generated: "생성됨",
            rendered: "렌더 완료",
            completed: "렌더 완료",
            uploaded: "업로드 완료",
            failed: "실패",
          };
          const MODE_LABEL: Record<string, string> = {
            custom: "직접 입력",
            preset: "추천/프리셋",
            random: "랜덤 테스트",
          };

          // ── 날짜 범위 기준 계산 ──────────────────────────────────────────────
          const now = new Date();
          const genDateStart: Date | null = (() => {
            if (!genFilterDate) return null;
            if (genFilterDate === "today") {
              const d = new Date(now); d.setHours(0, 0, 0, 0); return d;
            }
            if (genFilterDate === "7d") {
              const d = new Date(now); d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); return d;
            }
            if (genFilterDate === "month") {
              return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            }
            if (genFilterDate === "30d") {
              const d = new Date(now); d.setDate(d.getDate() - 29); d.setHours(0, 0, 0, 0); return d;
            }
            return null;
          })();

          // ── AND 필터 적용 ────────────────────────────────────────────────────
          const filteredGenerations = generations.filter((g) => {
            if (genFilterPreset && g.meta_snapshot?.accountPresetName !== genFilterPreset) return false;
            if (genFilterCategory) {
              const cat = g.meta_snapshot?.categoryName ?? g.category_name;
              if (cat !== genFilterCategory) return false;
            }
            if (genFilterStatus && g.status !== genFilterStatus) return false;
            if (genFilterMode) {
              if (!g.meta_snapshot?.topicMode || g.meta_snapshot.topicMode !== genFilterMode) return false;
            }
            if (genDateStart) {
              if (!g.created_at) return false;
              const ts = new Date(g.created_at);
              if (isNaN(ts.getTime()) || ts < genDateStart) return false;
            }
            return true;
          });

          const isGenFiltered = !!genFilterPreset || !!genFilterCategory || !!genFilterDate || !!genFilterStatus || !!genFilterMode;
          const resetGenFilters = () => {
            setGenFilterPreset(""); setGenFilterCategory("");
            setGenFilterDate(""); setGenFilterStatus(""); setGenFilterMode("");
          };

          return (
            <section>
              {/* 섹션 헤더 + 카운트 배지 */}
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-bold text-white">📋 생성 이력</h2>
                <span className="px-3 py-1 rounded-full bg-indigo-600/30 text-indigo-300 text-sm font-medium">
                  {isGenFiltered
                    ? `${generations.length}개 중 ${filteredGenerations.length}개 표시`
                    : `${generations.length}건`}
                </span>
              </div>

              {/* 필터 UI (데이터가 있을 때만 표시) */}
              {!isLoading && generations.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 items-center">
                  {/* 프리셋 필터 */}
                  {genPresetOptions.length > 0 && (
                    <select
                      value={genFilterPreset}
                      onChange={(e) => setGenFilterPreset(e.target.value)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 focus:outline-none focus:border-purple-500/60 transition-colors"
                    >
                      <option value="">전체 프리셋</option>
                      {genPresetOptions.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  )}

                  {/* 카테고리 필터 */}
                  {genCategoryOptions.length > 0 && (
                    <select
                      value={genFilterCategory}
                      onChange={(e) => setGenFilterCategory(e.target.value)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 focus:outline-none focus:border-indigo-500/60 transition-colors"
                    >
                      <option value="">전체 카테고리</option>
                      {genCategoryOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  )}

                  {/* status 필터 */}
                  {genStatusOptions.length > 0 && (
                    <select
                      value={genFilterStatus}
                      onChange={(e) => setGenFilterStatus(e.target.value)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 focus:outline-none focus:border-green-500/60 transition-colors"
                    >
                      <option value="">전체 상태</option>
                      {genStatusOptions.map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>
                      ))}
                    </select>
                  )}

                  {/* topicMode 필터 */}
                  {genModeOptions.length > 0 && (
                    <select
                      value={genFilterMode}
                      onChange={(e) => setGenFilterMode(e.target.value)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 focus:outline-none focus:border-emerald-500/60 transition-colors"
                    >
                      <option value="">전체 모드</option>
                      {genModeOptions.map((m) => (
                        <option key={m} value={m}>{MODE_LABEL[m] ?? m}</option>
                      ))}
                    </select>
                  )}

                  {/* 날짜 범위 필터 (segmented control) */}
                  <div className="flex items-center rounded-lg overflow-hidden border border-slate-700/60 bg-slate-800/60 shrink-0">
                    {(
                      [
                        { value: "", label: "전체" },
                        { value: "today", label: "오늘" },
                        { value: "7d", label: "7일" },
                        { value: "month", label: "이번 달" },
                        { value: "30d", label: "30일" },
                      ] as const
                    ).map(({ value, label }, idx, arr) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setGenFilterDate(value)}
                        className={[
                          "text-xs px-2.5 py-1.5 transition-colors whitespace-nowrap",
                          idx < arr.length - 1 ? "border-r border-slate-700/50" : "",
                          genFilterDate === value
                            ? "bg-indigo-600/50 text-indigo-200 font-medium"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50",
                        ].join(" ")}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* 필터 초기화 */}
                  {isGenFiltered && (
                    <button
                      type="button"
                      onClick={resetGenFilters}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-700/40 text-slate-400 hover:text-slate-200 border border-slate-600/30 transition-colors"
                    >
                      ✕ 초기화
                    </button>
                  )}
                </div>
              )}

              {/* 필터 결과 없음 */}
              {!isLoading && isGenFiltered && filteredGenerations.length === 0 ? (
                <div className="glass-card p-8 rounded-3xl border border-slate-700/50 text-center text-slate-400 text-sm">
                  해당 조건에 맞는 생성 이력이 없습니다.
                </div>
              ) : (
                <HistoryTable generations={filteredGenerations} isLoading={isLoading} />
              )}
            </section>
          );
        })()}

        {/* 주제 히스토리 섹션 (localStorage 기반) */}
        {(() => {
          // ── 필터 옵션 추출 (중복 제거, 빈 값 제외) ──────────────────────────
          const presetOptions = Array.from(
            new Set(
              topicHistory
                .map((e) => e.metaSnapshot?.accountPresetName)
                .filter((v): v is string => !!v)
            )
          );
          const categoryOptions = Array.from(
            new Set(
              topicHistory
                .map((e) => e.metaSnapshot?.categoryName)
                .filter((v): v is string => !!v)
            )
          );

          // topicMode 옵션 추출 — entry.topicMode 직접 사용 (metaSnapshot 불필요)
          const modeOptions = Array.from(
            new Set(topicHistory.map((e) => e.topicMode).filter(Boolean))
          ) as string[];
          const MODE_LABEL: Record<string, string> = {
            custom: "직접 입력",
            preset: "추천/프리셋",
            random: "랜덤 테스트",
          };

          // ── 날짜 범위 기준 계산 ──────────────────────────────────────────────
          const now = new Date();
          const dateRangeStart: Date | null = (() => {
            if (!filterDate) return null;
            if (filterDate === "today") {
              const d = new Date(now);
              d.setHours(0, 0, 0, 0);
              return d;
            }
            if (filterDate === "7d") {
              const d = new Date(now);
              d.setDate(d.getDate() - 6);
              d.setHours(0, 0, 0, 0);
              return d;
            }
            if (filterDate === "month") {
              return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            }
            if (filterDate === "30d") {
              const d = new Date(now);
              d.setDate(d.getDate() - 29);
              d.setHours(0, 0, 0, 0);
              return d;
            }
            return null;
          })();

          // ── AND 필터 적용 ────────────────────────────────────────────────────
          const filtered = topicHistory.filter((e) => {
            if (filterPreset && e.metaSnapshot?.accountPresetName !== filterPreset) return false;
            if (filterCategory && e.metaSnapshot?.categoryName !== filterCategory) return false;
            if (filterMode && e.topicMode !== filterMode) return false;
            if (dateRangeStart && e.createdAt) {
              const ts = new Date(e.createdAt);
              if (isNaN(ts.getTime()) || ts < dateRangeStart) return false;
            } else if (dateRangeStart && !e.createdAt) {
              return false; // createdAt 없으면 날짜 필터 시 제외
            }
            return true;
          });

          const isFiltered = !!filterPreset || !!filterCategory || !!filterMode || !!filterDate;

          return (
            <section>
              {/* 섹션 헤더 */}
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-bold text-white">🗂 주제 히스토리</h2>
                <span className="px-3 py-1 rounded-full bg-purple-600/30 text-purple-300 text-sm font-medium">
                  {isFiltered
                    ? `${topicHistory.length}개 중 ${filtered.length}개`
                    : `${topicHistory.length}건`}
                </span>
              </div>

              {topicMsg && (
                <p className="text-xs text-emerald-400 mb-3">{topicMsg}</p>
              )}

              {topicHistory.length === 0 ? (
                <div className="glass-card p-8 rounded-3xl border border-slate-700/50 text-center text-slate-400">
                  저장된 주제 히스토리가 없습니다. 스튜디오에서 콘티를 생성하면 여기에 기록됩니다.
                </div>
              ) : (
                <>
                  {/* ── 필터 + 관리 버튼 행 ────────────────────────────────── */}
                  <div className="flex flex-wrap gap-2 mb-4 items-center">
                    {/* 프리셋 필터 */}
                    {presetOptions.length > 0 && (
                      <select
                        value={filterPreset}
                        onChange={(e) => setFilterPreset(e.target.value)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 focus:outline-none focus:border-purple-500/60 transition-colors"
                      >
                        <option value="">전체 프리셋</option>
                        {presetOptions.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    )}

                    {/* 카테고리 필터 */}
                    {categoryOptions.length > 0 && (
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 focus:outline-none focus:border-indigo-500/60 transition-colors"
                      >
                        <option value="">전체 카테고리</option>
                        {categoryOptions.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    )}

                    {/* topicMode 필터 */}
                    {modeOptions.length > 0 && (
                      <select
                        value={filterMode}
                        onChange={(e) => setFilterMode(e.target.value)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 focus:outline-none focus:border-emerald-500/60 transition-colors"
                      >
                        <option value="">전체 모드</option>
                        {modeOptions.map((m) => (
                          <option key={m} value={m}>{MODE_LABEL[m] ?? m}</option>
                        ))}
                      </select>
                    )}

                    {/* 날짜 범위 필터 (segmented control) */}
                    <div className="flex items-center rounded-lg overflow-hidden border border-slate-700/60 bg-slate-800/60 shrink-0">
                      {(
                        [
                          { value: "", label: "전체" },
                          { value: "today", label: "오늘" },
                          { value: "7d", label: "7일" },
                          { value: "month", label: "이번 달" },
                          { value: "30d", label: "30일" },
                        ] as const
                      ).map(({ value, label }, idx, arr) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setFilterDate(value)}
                          className={[
                            "text-xs px-2.5 py-1.5 transition-colors whitespace-nowrap",
                            idx < arr.length - 1 ? "border-r border-slate-700/50" : "",
                            filterDate === value
                              ? "bg-indigo-600/50 text-indigo-200 font-medium"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50",
                          ].join(" ")}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* 필터 초기화 */}
                    {isFiltered && (
                      <button
                        type="button"
                        onClick={() => { setFilterPreset(""); setFilterCategory(""); setFilterMode(""); setFilterDate(""); }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-700/40 text-slate-400 hover:text-slate-200 border border-slate-600/30 transition-colors"
                      >
                        ✕ 초기화
                      </button>
                    )}

                    {/* 구분선 */}
                    <span className="flex-1" />

                    {/* JSON 내보내기 */}
                    <button
                      type="button"
                      onClick={() => {
                        const result = exportHistoryAsBlob();
                        if (!result) return;
                        const url = URL.createObjectURL(result.blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = result.filename;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-600/60 border border-slate-600/40 transition-colors"
                    >
                      ⬇ JSON 내보내기
                    </button>

                    {/* 전체 삭제 */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!window.confirm("주제 히스토리 전체를 삭제할까요?")) return;
                        clearAllTopicHistory();
                        setTopicHistory([]);
                        setFilterPreset("");
                        setFilterCategory("");
                        setFilterMode("");
                        setFilterDate("");
                        setTopicMsg("✅ 전체 히스토리가 삭제되었습니다.");
                        setTimeout(() => setTopicMsg(""), 3000);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-700/30 transition-colors"
                    >
                      🗑 전체 삭제
                    </button>
                  </div>

                  {/* ── 히스토리 테이블 ──────────────────────────────────────── */}
                  {filtered.length === 0 ? (
                    <div className="glass-card p-6 rounded-3xl border border-slate-700/50 text-center text-slate-500 text-sm">
                      해당 조건의 히스토리가 없습니다.
                    </div>
                  ) : (
                    <div className="glass-card rounded-3xl border border-slate-700/50 overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700/50">
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 w-8"></th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400">주제</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 hidden sm:table-cell">배지</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 w-20">날짜</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((entry, i) => (
                            <tr key={i} className="border-b border-slate-700/20 hover:bg-slate-700/10 transition-colors">
                              {/* topicMode 아이콘 */}
                              <td className="px-5 py-3 text-base text-center">
                                {TOPIC_MODE_ICON[entry.topicMode] ?? "📝"}
                              </td>
                              {/* 주제 + 모바일 배지 */}
                              <td className="px-5 py-3">
                                <p className="text-sm text-slate-200 leading-snug">{entry.topic}</p>
                                {entry.metaSnapshot && (entry.metaSnapshot.accountPresetName || entry.metaSnapshot.subTopicName || entry.metaSnapshot.categoryName) && (
                                  <div className="flex gap-1 mt-1 flex-wrap sm:hidden">
                                    {entry.metaSnapshot.accountPresetName && (
                                      <span className="text-[9px] px-1.5 py-px rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/25 leading-none">
                                        {entry.metaSnapshot.accountPresetName}
                                      </span>
                                    )}
                                    {entry.metaSnapshot.subTopicName && (
                                      <span className="text-[9px] px-1.5 py-px rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/30 leading-none">
                                        {entry.metaSnapshot.subTopicName}
                                      </span>
                                    )}
                                    {entry.metaSnapshot.categoryName && (
                                      <span className="text-[9px] px-1.5 py-px rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 leading-none">
                                        {entry.metaSnapshot.categoryName}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                              {/* 배지 (데스크톱) */}
                              <td className="px-5 py-3 hidden sm:table-cell">
                                {entry.metaSnapshot ? (
                                  <div className="flex gap-1 flex-wrap">
                                    {entry.metaSnapshot.accountPresetName && (
                                      <span className="text-[9px] px-1.5 py-px rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/25 leading-none whitespace-nowrap">
                                        {entry.metaSnapshot.accountPresetName}
                                      </span>
                                    )}
                                    {entry.metaSnapshot.subTopicName && (
                                      <span className="text-[9px] px-1.5 py-px rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/30 leading-none whitespace-nowrap">
                                        {entry.metaSnapshot.subTopicName}
                                      </span>
                                    )}
                                    {entry.metaSnapshot.categoryName && (
                                      <span className="text-[9px] px-1.5 py-px rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 leading-none whitespace-nowrap">
                                        {entry.metaSnapshot.categoryName}
                                      </span>
                                    )}
                                    <span className="text-[9px] px-1.5 py-px rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 leading-none whitespace-nowrap">
                                      {entry.topicMode}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-600">—</span>
                                )}
                              </td>
                              {/* 날짜 */}
                              <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                                {new Date(entry.createdAt).toLocaleDateString("ko-KR", {
                                  month: "numeric",
                                  day: "numeric",
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </section>
          );
        })()}
      </main>

      {/* 푸터 */}
      <footer className="border-t border-slate-800/50 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
          <p>© 2026 AutoShorts AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
