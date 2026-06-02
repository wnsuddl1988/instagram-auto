"use client";

/**
 * QaScoreChart
 * QaScoreEntry[] → 날짜별 평균 점수 SVG 라인 차트
 * 외부 패키지 없이 순수 SVG로 구현.
 *
 * - X축: 날짜 (updatedAt 기준)
 * - Y축: 평균 점수 0~100
 * - 등급 기준선: 90(S), 80(A), 70(B 경계), 60(C 경계)
 * - hover 툴팁: 날짜·평균·건수·최고/최저
 * - 2일 미만 데이터: 빈 상태 안내
 */

import { useMemo, useState } from "react";
import type { QaScoreEntry } from "@/lib/videoQaScores";

// ── 타입 ─────────────────────────────────────────────────────────────────────

interface DayBucket {
  dateLabel: string;   // "05/21"
  dateIso:   string;   // "2026-05-21"
  avg:        number;  // 소수점 1자리
  count:      number;
  max:        number;
  min:        number;
}

// ── 상수 ─────────────────────────────────────────────────────────────────────

/** SVG 뷰포트 */
const W = 560;
const H = 180;
const PAD = { top: 16, right: 20, bottom: 32, left: 36 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top  - PAD.bottom;

/** Y: 0~100 → px */
function yPx(score: number) {
  return PAD.top + CHART_H * (1 - score / 100);
}

/** 등급 기준선 */
const GRADE_LINES = [
  { score: 90, label: "S",  color: "#34d399" }, // emerald-400
  { score: 80, label: "A",  color: "#4ade80" }, // green-400
  { score: 70, label: "B",  color: "#facc15" }, // yellow-400
  { score: 60, label: "C",  color: "#fb923c" }, // orange-400
] as const;

// ── 데이터 처리 ───────────────────────────────────────────────────────────────

function buildBuckets(entries: QaScoreEntry[]): DayBucket[] {
  if (entries.length === 0) return [];

  // 날짜 그룹핑 (updatedAt 기준 로컬 날짜)
  const map = new Map<string, number[]>();
  for (const e of entries) {
    const d   = new Date(e.updatedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e.totalScore);
  }

  // 날짜순 정렬 후 버킷 생성
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([iso, scores]) => {
      const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
      const [month, day] = iso.slice(5).split("-");
      return {
        dateLabel: `${month}/${day}`,
        dateIso:   iso,
        avg:       Math.round(avg * 10) / 10,
        count:     scores.length,
        max:       Math.max(...scores),
        min:       Math.min(...scores),
      };
    });
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface QaScoreChartProps {
  entries: QaScoreEntry[];
  /** 필터 적용 여부 표시용 */
  isFiltered?: boolean;
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export default function QaScoreChart({ entries, isFiltered }: QaScoreChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const buckets = useMemo(() => buildBuckets(entries), [entries]);

  // ── 빈 상태 ───────────────────────────────────────────────────────────────
  if (entries.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-gray-600 text-sm border-t border-gray-800">
        <p className="text-2xl mb-1">📉</p>
        <p>저장된 QA 점수가 없습니다.</p>
      </div>
    );
  }

  if (buckets.length < 2) {
    return (
      <div className="px-4 py-5 border-t border-gray-800">
        <p className="text-xs text-gray-500 font-semibold mb-1">📈 점수 추이</p>
        <div className="text-center py-4 text-gray-600 text-xs">
          추이 차트를 표시하려면 <span className="text-gray-400">2일 이상</span>의 기록이 필요합니다.
          <br />
          <span className="text-gray-700">
            (현재 {buckets.length === 1 ? `${buckets[0].dateLabel} 1일치` : "데이터 없음"})
          </span>
        </div>
      </div>
    );
  }

  // ── X축 포인트 배치 ───────────────────────────────────────────────────────
  const n   = buckets.length;
  const xPx = (i: number) =>
    n === 1
      ? PAD.left + CHART_W / 2
      : PAD.left + (i / (n - 1)) * CHART_W;

  // ── 라인 path ─────────────────────────────────────────────────────────────
  const linePath = buckets
    .map((b, i) => `${i === 0 ? "M" : "L"}${xPx(i).toFixed(1)},${yPx(b.avg).toFixed(1)}`)
    .join(" ");

  // ── 영역 fill path ────────────────────────────────────────────────────────
  const areaPath =
    linePath +
    ` L${xPx(n - 1).toFixed(1)},${(PAD.top + CHART_H).toFixed(1)}` +
    ` L${xPx(0).toFixed(1)},${(PAD.top + CHART_H).toFixed(1)} Z`;

  // ── hover 중인 버킷 ───────────────────────────────────────────────────────
  const hov = hoveredIdx !== null ? buckets[hoveredIdx] : null;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="px-4 pt-3 pb-2 border-t border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500 font-semibold">📈 점수 추이 (날짜별 평균)</p>
        {isFiltered && (
          <span className="text-xs text-blue-500">필터 적용 중</span>
        )}
      </div>

      {/* SVG 차트 */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ minWidth: "280px", maxHeight: "180px" }}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* ── 등급 기준선 ── */}
          {GRADE_LINES.map(({ score, label, color }) => (
            <g key={score}>
              <line
                x1={PAD.left}
                x2={PAD.left + CHART_W}
                y1={yPx(score)}
                y2={yPx(score)}
                stroke={color}
                strokeWidth={0.6}
                strokeDasharray="3 3"
                opacity={0.4}
              />
              <text x={PAD.left - 2} y={yPx(score) + 3.5} textAnchor="end" fill={color} fontSize={7} opacity={0.7}>
                {label}
              </text>
            </g>
          ))}

          {/* ── Y축 눈금 (0, 50, 100) ── */}
          {[0, 50, 100].map((v) => (
            <g key={v}>
              <line x1={PAD.left - 3} x2={PAD.left} y1={yPx(v)} y2={yPx(v)} stroke="#4b5563" strokeWidth={0.8} />
              <text x={PAD.left - 5} y={yPx(v) + 3.5} textAnchor="end" fill="#6b7280" fontSize={8}>
                {v}
              </text>
            </g>
          ))}

          {/* ── X축 ── */}
          <line
            x1={PAD.left} x2={PAD.left + CHART_W}
            y1={PAD.top + CHART_H} y2={PAD.top + CHART_H}
            stroke="#374151" strokeWidth={1}
          />

          {/* ── Y축 ── */}
          <line
            x1={PAD.left} x2={PAD.left}
            y1={PAD.top} y2={PAD.top + CHART_H}
            stroke="#374151" strokeWidth={1}
          />

          {/* ── 영역 fill ── */}
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#areaGrad)" />

          {/* ── 라인 ── */}
          <path
            d={linePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* ── 데이터 포인트 + hover 영역 ── */}
          {buckets.map((b, i) => {
            const cx = xPx(i);
            const cy = yPx(b.avg);
            const isHov = hoveredIdx === i;

            // 점 색상: 등급 기반
            const dotColor =
              b.avg >= 90 ? "#34d399" :
              b.avg >= 80 ? "#4ade80" :
              b.avg >= 70 ? "#facc15" :
              b.avg >= 60 ? "#fb923c" : "#f87171";

            return (
              <g key={b.dateIso}>
                {/* hover 감지용 넓은 투명 영역 */}
                <rect
                  x={cx - 16}
                  y={PAD.top}
                  width={32}
                  height={CHART_H}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIdx(i)}
                  style={{ cursor: "crosshair" }}
                />

                {/* hover 세로선 */}
                {isHov && (
                  <line
                    x1={cx} x2={cx}
                    y1={PAD.top} y2={PAD.top + CHART_H}
                    stroke="#6b7280" strokeWidth={1} strokeDasharray="2 2"
                  />
                )}

                {/* 데이터 점 */}
                <circle
                  cx={cx} cy={cy}
                  r={isHov ? 5 : 3.5}
                  fill={dotColor}
                  stroke="#111827"
                  strokeWidth={1.5}
                  style={{ transition: "r 0.1s" }}
                />

                {/* 점 위 점수 라벨 (hover 시) */}
                {isHov && (
                  <text
                    x={cx} y={cy - 9}
                    textAnchor="middle"
                    fill="#e5e7eb"
                    fontSize={10}
                    fontWeight="bold"
                  >
                    {b.avg}
                  </text>
                )}

                {/* X축 날짜 라벨 */}
                <text
                  x={cx}
                  y={PAD.top + CHART_H + 12}
                  textAnchor="middle"
                  fill={isHov ? "#d1d5db" : "#6b7280"}
                  fontSize={9}
                >
                  {b.dateLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── 툴팁 (hover 시) ── */}
      {hov && (
        <div className="mt-1 flex items-center gap-3 px-2 py-1.5 bg-gray-800 rounded text-xs text-gray-300 flex-wrap">
          <span className="text-gray-400">{hov.dateIso}</span>
          <span className="font-bold text-white">{hov.avg}점</span>
          <span className="text-gray-500">{hov.count}건</span>
          {hov.count > 1 && (
            <>
              <span className="text-green-400">최고 {hov.max}점</span>
              <span className="text-red-400">최저 {hov.min}점</span>
            </>
          )}
        </div>
      )}

      {/* ── 범례 ── */}
      <div className="mt-2 flex gap-3 flex-wrap">
        {GRADE_LINES.map(({ score, label, color }) => (
          <span key={score} className="flex items-center gap-1 text-xs" style={{ color }}>
            <span className="inline-block w-3 border-t border-dashed" style={{ borderColor: color }} />
            {label}({score}+)
          </span>
        ))}
      </div>
    </div>
  );
}
