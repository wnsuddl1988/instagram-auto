"use client";

/**
 * QaScorePanel
 * 감동사연 QA rubric 점수 입력 + 실시간 총점/등급 계산 + localStorage 저장/복원
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  getQaRubric,
  calculateManualQaScore,
  type QaScoreInput,
  type QaRubric,
} from "@/lib/videoQaRubric";
import {
  getQaScore,
  saveQaScore,
  deleteQaScore,
  entryToScoreInput,
  QA_ISSUE_TAGS,
  QA_ISSUE_TAG_LABELS,
  QA_ISSUE_TAG_HINTS,
  type QaIssueTag,
} from "@/lib/videoQaScores";

// ── 등급 설정 ─────────────────────────────────────────────────────────────────

const GRADE_CONFIG = {
  S: { label: "S — 업로드 즉시 가능",      color: "text-emerald-400", bg: "bg-emerald-950/60 border-emerald-700" },
  A: { label: "A — 업로드 후보",           color: "text-green-400",   bg: "bg-green-950/60 border-green-700"   },
  B: { label: "B — 수정 후 재검토",        color: "text-yellow-400",  bg: "bg-yellow-950/60 border-yellow-700" },
  C: { label: "C — 조건부 / 약점 수정 필요", color: "text-orange-400",  bg: "bg-orange-950/60 border-orange-700" },
  F: { label: "F — 폐기 / 재생성 권장",    color: "text-red-400",     bg: "bg-red-950/60 border-red-700"       },
} as const;

// ── 초기 빈 점수 생성 ─────────────────────────────────────────────────────────

function makeEmptyScores(rubric: QaRubric): QaScoreInput {
  const init: QaScoreInput = {};
  for (const cat of rubric.categories) {
    for (const item of cat.items) {
      init[item.id] = 0;
    }
  }
  return init;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface QaScorePanelProps {
  renderId?: string;
  /** 저장 또는 삭제 완료 시 호출 — 히스토리 섹션 갱신 트리거용 */
  onSaved?: () => void;
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export default function QaScorePanel({ renderId, onSaved }: QaScorePanelProps) {
  const rubric: QaRubric = getQaRubric("emotional_story");

  const [scores, setScores]         = useState<QaScoreInput>(() => makeEmptyScores(rubric));
  const [comment, setComment]       = useState("");
  const [issueTags, setIssueTags]   = useState<QaIssueTag[]>([]);
  const [isOpen, setIsOpen]         = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  /** "idle" | "saved" | "deleted" */
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "deleted">("idle");
  const [hasSaved, setHasSaved]     = useState(false); // localStorage에 저장 데이터 있는지

  // ── renderId 바뀔 때 localStorage 복원 ──────────────────────────────────────
  useEffect(() => {
    if (!renderId) return;
    const entry = getQaScore(renderId);
    if (entry) {
      setScores(entryToScoreInput(entry));
      setComment(entry.comment ?? "");
      setIssueTags(entry.issueTags ?? []);
      setHasSaved(true);
    } else {
      setScores(makeEmptyScores(rubric));
      setComment("");
      setIssueTags([]);
      setHasSaved(false);
    }
    setSaveStatus("idle");
  }, [renderId, rubric]);

  // ── 실시간 계산 ────────────────────────────────────────────────────────────
  const result = useMemo(() => calculateManualQaScore(scores, rubric), [scores, rubric]);

  // ── 부족 항목 Top 3 ─────────────────────────────────────────────────────────
  const weakItems = useMemo(() => {
    const all: Array<{ label: string; score: number; maxScore: number; ratio: number }> = [];
    for (const cat of rubric.categories) {
      for (const item of cat.items) {
        const s = result.itemScores[item.id];
        if (s) all.push({ label: item.label, ...s });
      }
    }
    return all.sort((a, b) => a.ratio - b.ratio).slice(0, 3);
  }, [result, rubric]);

  // ── 점수 입력 ──────────────────────────────────────────────────────────────
  function setItemScore(id: string, value: number, max: number) {
    const clamped = Math.max(0, Math.min(max, value));
    setScores((prev) => ({ ...prev, [id]: clamped }));
    setSaveStatus("idle"); // 변경하면 저장 상태 초기화
  }

  // ── 화면 점수만 초기화 (저장된 데이터는 유지) ──────────────────────────────
  const handleResetUI = useCallback(() => {
    setScores(makeEmptyScores(rubric));
    setComment("");
    setIssueTags([]);
    setSaveStatus("idle");
  }, [rubric]);

  // ── 저장 ───────────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!renderId) return;
    saveQaScore({
      renderId,
      category: "emotional_story",
      totalScore: result.totalScore,
      grade: result.grade,
      itemScores: { ...scores },
      comment: comment || undefined,
      issueTags: issueTags.length > 0 ? [...issueTags] : undefined,
    });
    setHasSaved(true);
    setSaveStatus("saved");
    onSaved?.();
    // 2초 후 idle 복귀
    setTimeout(() => setSaveStatus("idle"), 2000);
  }, [renderId, result, scores, comment, issueTags, onSaved]);

  // ── 저장된 데이터 삭제 ─────────────────────────────────────────────────────
  const handleDelete = useCallback(() => {
    if (!renderId) return;
    if (!confirm(`${renderId}의 저장된 QA 점수를 삭제하시겠습니까?`)) return;
    deleteQaScore(renderId);
    setHasSaved(false);
    setSaveStatus("deleted");
    onSaved?.();
    setTimeout(() => setSaveStatus("idle"), 2000);
  }, [renderId, onSaved]);

  const gradeConf  = GRADE_CONFIG[result.grade];
  const filledCount = Object.values(scores).filter((v) => v > 0).length;
  const totalItems  = Object.keys(scores).length;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700">

      {/* ── 패널 헤더 ── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-300">✏️ QA 점수 입력</span>
          {hasSaved && (
            <span className="text-xs text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded-full">
              💾 저장됨
            </span>
          )}
          {filledCount > 0 && (
            <span className="text-xs text-gray-500">{filledCount}/{totalItems}항목</span>
          )}
          {!isOpen && filledCount > 0 && (
            <span className={`text-sm font-bold ${gradeConf.color}`}>
              {result.totalScore}점 [{result.grade}]
            </span>
          )}
        </div>
        <span className="text-gray-600 text-xs">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="border-t border-gray-700 px-4 pb-4 space-y-5 pt-4">

          {/* ── 실시간 총점 박스 ── */}
          <div className={`rounded-xl border px-5 py-4 ${gradeConf.bg}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">총점</p>
                <div className="flex items-end gap-2">
                  <span className={`text-4xl font-black ${gradeConf.color}`}>
                    {result.totalScore}
                  </span>
                  <span className="text-gray-500 text-sm pb-1">/ {rubric.maxTotalScore}점</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-1">등급</p>
                <span className={`text-3xl font-black ${gradeConf.color}`}>{result.grade}</span>
              </div>
            </div>

            {/* 진행 바 */}
            <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  result.grade === "S" || result.grade === "A" ? "bg-green-500" :
                  result.grade === "B" ? "bg-yellow-500" :
                  result.grade === "C" ? "bg-orange-500" : "bg-red-500"
                }`}
                style={{ width: `${result.totalScore}%` }}
              />
            </div>

            <p className={`text-sm font-semibold ${gradeConf.color}`}>{gradeConf.label}</p>

            <div className="flex gap-3 mt-2 text-xs text-gray-500">
              <span>합격: {rubric.passingScore}점</span>
              <span>권장: {rubric.recommendedScore}점</span>
              <span className={result.passed ? "text-green-400" : "text-red-400"}>
                {result.passed ? "✅ PASS" : "❌ FAIL"}
              </span>
            </div>
          </div>

          {/* ── 부족 항목 Top 3 ── */}
          {filledCount >= 3 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">📉 점수 낮은 항목 Top 3</p>
              <div className="space-y-1">
                {weakItems.map((w) => (
                  <div key={w.label} className="flex items-center gap-2 text-xs">
                    <div className="flex-1 bg-gray-800 rounded h-1.5">
                      <div className="h-1.5 rounded bg-red-700" style={{ width: `${w.ratio * 100}%` }} />
                    </div>
                    <span className="text-gray-400 w-28 truncate text-right">{w.label}</span>
                    <span className="text-gray-500 w-12 text-right font-mono">{w.score}/{w.maxScore}점</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 카테고리별 점수 입력 ── */}
          <div className="space-y-4">
            {rubric.categories.map((cat) => {
              const catResult = result.categoryScores[cat.id];
              const catPct    = Math.round((catResult?.ratio ?? 0) * 100);
              const catColor  =
                catPct >= 80 ? "text-green-400" :
                catPct >= 60 ? "text-yellow-400" :
                catPct >= 40 ? "text-orange-400" : "text-red-400";

              return (
                <div key={cat.id} className="bg-gray-800/50 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-800">
                    <span className="text-xs font-semibold text-gray-200">{cat.name}</span>
                    <span className={`text-xs font-mono font-bold ${catColor}`}>
                      {catResult?.score ?? 0}/{cat.totalScore}점 ({catPct}%)
                    </span>
                  </div>

                  <div className="divide-y divide-gray-700/50">
                    {cat.items.map((item) => {
                      const val = scores[item.id] ?? 0;
                      const itemColor =
                        val >= item.maxScore * 0.8 ? "text-green-400" :
                        val >= item.maxScore * 0.5 ? "text-yellow-400" :
                        val > 0 ? "text-orange-400" : "text-gray-600";

                      return (
                        <div key={item.id} className="px-3 py-2.5">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-200">{item.label}</p>
                              {showDetails && (
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <input
                                type="number"
                                min={0}
                                max={item.maxScore}
                                value={val}
                                onChange={(e) => setItemScore(item.id, Number(e.target.value), item.maxScore)}
                                className="w-12 bg-gray-700 border border-gray-600 rounded px-1.5 py-0.5 text-xs text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                              />
                              <span className={`text-xs font-mono w-10 text-right ${itemColor}`}>
                                /{item.maxScore}점
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-3 text-right">0</span>
                            <input
                              type="range"
                              min={0}
                              max={item.maxScore}
                              step={1}
                              value={val}
                              onChange={(e) => setItemScore(item.id, Number(e.target.value), item.maxScore)}
                              className="flex-1 h-1.5 accent-blue-500 cursor-pointer"
                            />
                            <span className="text-xs text-gray-600 w-3">{item.maxScore}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── 코멘트 ── */}
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">📝 코멘트 (선택)</label>
            <textarea
              value={comment}
              onChange={(e) => { setComment(e.target.value); setSaveStatus("idle"); }}
              placeholder={`렌더 ${renderId ?? ""} 검수 메모\n예: 씬 5 화병 소품 불일치, 씬 9 narration 자연스러움`}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* ── 문제 태그 ── */}
          <div>
            <label className="text-xs text-gray-400 block mb-2">🏷 문제 태그 (선택)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {QA_ISSUE_TAGS.map((tag) => {
                const checked = issueTags.includes(tag);
                return (
                  <label
                    key={tag}
                    className={`flex items-start gap-2 px-2.5 py-2 rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? "bg-orange-950/30 border-orange-700/60"
                        : "bg-gray-800/60 border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setSaveStatus("idle");
                        setIssueTags((prev) =>
                          e.target.checked
                            ? [...prev, tag]
                            : prev.filter((t) => t !== tag),
                        );
                      }}
                      className="mt-0.5 flex-shrink-0 accent-orange-500"
                    />
                    <span className={`text-xs leading-relaxed ${checked ? "text-orange-300" : "text-gray-400"}`}>
                      {QA_ISSUE_TAG_LABELS[tag]}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* 선택된 태그 힌트 */}
            {issueTags.length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                <p className="text-xs text-gray-500 font-medium">💡 개선 힌트</p>
                {issueTags.map((tag) => (
                  <div key={tag} className="flex gap-2 text-xs">
                    <span className="flex-shrink-0 text-orange-500">▸</span>
                    <span className="text-gray-400 leading-relaxed">
                      <span className="text-orange-400 font-medium">{QA_ISSUE_TAG_LABELS[tag]}</span>
                      {" — "}{QA_ISSUE_TAG_HINTS[tag]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── 하단 액션 바 ── */}
          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
            {/* 왼쪽: 보조 버튼들 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDetails((v) => !v)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showDetails ? "📖 설명 숨기기" : "📖 설명 보기"}
              </button>

              {filledCount > 0 && (
                <button
                  onClick={handleResetUI}
                  className="text-xs text-gray-600 hover:text-gray-400 px-2 py-0.5 rounded hover:bg-gray-700 transition-colors"
                >
                  화면 초기화
                </button>
              )}

              {hasSaved && (
                <button
                  onClick={handleDelete}
                  className="text-xs text-red-700 hover:text-red-500 px-2 py-0.5 rounded hover:bg-red-950/40 transition-colors"
                >
                  🗑 저장 삭제
                </button>
              )}
            </div>

            {/* 오른쪽: 저장 버튼 + 상태 */}
            <div className="flex items-center gap-2">
              {saveStatus === "saved" && (
                <span className="text-xs text-green-400">✅ 저장됨</span>
              )}
              {saveStatus === "deleted" && (
                <span className="text-xs text-red-400">🗑 삭제됨</span>
              )}
              <button
                onClick={handleSave}
                disabled={!renderId || filledCount === 0}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-semibold transition-colors"
              >
                저장
              </button>
            </div>
          </div>

          {/* ── 카테고리별 요약 바 ── */}
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-400 py-1">
              카테고리별 요약 보기
            </summary>
            <div className="mt-2 space-y-1.5">
              {rubric.categories.map((cat) => {
                const c   = result.categoryScores[cat.id];
                const pct = Math.round((c?.ratio ?? 0) * 100);
                return (
                  <div key={cat.id} className="flex items-center gap-2">
                    <span className="text-gray-400 w-28 truncate">{cat.name}</span>
                    <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : pct >= 40 ? "bg-orange-500" : "bg-red-600"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-gray-500 font-mono w-20 text-right">
                      {c?.score ?? 0}/{cat.totalScore} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </details>

          {/* ── 비고 메시지 ── */}
          {result.notes.length > 0 && (
            <div className="space-y-1">
              {result.notes.map((note, i) => (
                <p key={i} className="text-xs text-yellow-600 bg-yellow-950/30 rounded px-3 py-1.5">
                  📌 {note}
                </p>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
