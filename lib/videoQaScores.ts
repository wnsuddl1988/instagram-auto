/**
 * videoQaScores.ts
 * renderId별 QA 점수를 localStorage에 저장/복원/삭제하는 헬퍼
 *
 * localStorage key: autoshorts:qa-scores:v1
 * 값 구조: Record<renderId, QaScoreEntry>
 *
 * 서버 컴포넌트에서는 사용 불가 — "use client" 환경 전용.
 */

import type { QaScoreInput } from "@/lib/videoQaRubric";

// ── 타입 ─────────────────────────────────────────────────────────────────────

// ── 문제 태그 ─────────────────────────────────────────────────────────────────

/** 검수 시 발견한 문제 유형 태그 */
export const QA_ISSUE_TAGS = [
  "image_narration_mismatch",
  "weak_story_flow",
  "voice_too_clear_explainer",
  "weak_twist",
  "weak_emotional_aftertaste",
  "acceptable_visual_style",
] as const;

export type QaIssueTag = typeof QA_ISSUE_TAGS[number];

/** 태그별 한국어 라벨 */
export const QA_ISSUE_TAG_LABELS: Record<QaIssueTag, string> = {
  image_narration_mismatch:   "이미지↔나레이션 불일치",
  weak_story_flow:            "스토리 흐름 약함",
  voice_too_clear_explainer:  "목소리 설명조/또렷함",
  weak_twist:                 "반전 약함",
  weak_emotional_aftertaste:  "여운/감동 약함",
  acceptable_visual_style:    "비주얼 스타일 무난",
};

/** 태그별 다음 액션 힌트 */
export const QA_ISSUE_TAG_HINTS: Record<QaIssueTag, string> = {
  image_narration_mismatch:
    "다음 생성 시 imagePrompt를 narration 핵심 명사 중심으로 강화하세요.",
  weak_story_flow:
    "scene 순서 재배치 또는 scene 3~5 연결 narration 보완이 필요합니다.",
  voice_too_clear_explainer:
    "ElevenLabs 감성 보이스 비교 또는 OpenAI sage의 instructions 수정을 검토하세요.",
  weak_twist:
    "scene 8/9 narration의 감정 반응·반전 문장을 강화하세요.",
  weak_emotional_aftertaste:
    "closing_line(씬 10) narration에 여운·잔상 표현을 추가하세요.",
  acceptable_visual_style:
    "비주얼은 무난하나 차별화가 필요할 경우 VisualAnchor 다양성을 늘리세요.",
};

// ── 엔트리 타입 ───────────────────────────────────────────────────────────────

export interface QaScoreEntry {
  renderId: string;
  /** emotional_story 등 */
  category?: string;
  totalScore: number;
  grade: "S" | "A" | "B" | "C" | "F";
  itemScores: Record<string, number>;
  comment?: string;
  /** 검수 시 발견한 문제 태그 목록 (optional — 기존 데이터 하위 호환) */
  issueTags?: QaIssueTag[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

type QaScoreStore = Record<string, QaScoreEntry>;

// ── 상수 ─────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "autoshorts:qa-scores:v1";

// ── 내부 헬퍼 ─────────────────────────────────────────────────────────────────

function readStore(): QaScoreStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as QaScoreStore;
  } catch {
    return {};
  }
}

function writeStore(store: QaScoreStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage 용량 초과 등 — 조용히 무시
  }
}

// ── 공개 API ──────────────────────────────────────────────────────────────────

/**
 * 특정 renderId의 저장된 QA 점수 반환.
 * 없으면 null.
 */
export function getQaScore(renderId: string): QaScoreEntry | null {
  const store = readStore();
  return store[renderId] ?? null;
}

/**
 * QA 점수 저장 (upsert).
 * createdAt은 최초 저장 시에만 설정되고, 이후엔 updatedAt만 갱신.
 */
export function saveQaScore(
  entry: Omit<QaScoreEntry, "createdAt" | "updatedAt">,
): QaScoreEntry {
  const store = readStore();
  const now = new Date().toISOString();
  const existing = store[entry.renderId];

  const saved: QaScoreEntry = {
    ...entry,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  store[entry.renderId] = saved;
  writeStore(store);
  return saved;
}

/**
 * 특정 renderId의 QA 점수 삭제.
 * 없으면 아무 동작도 하지 않음.
 */
export function deleteQaScore(renderId: string): void {
  const store = readStore();
  if (!store[renderId]) return;
  delete store[renderId];
  writeStore(store);
}

/**
 * 저장된 모든 QA 점수 반환 (updatedAt 최신순).
 */
export function listQaScores(): QaScoreEntry[] {
  const store = readStore();
  return Object.values(store).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

/**
 * 저장된 QA 점수의 renderId Set — 목록 배지 표시용.
 */
export function getQaScoreIds(): Set<string> {
  const store = readStore();
  return new Set(Object.keys(store));
}

/**
 * itemScores(Record<id, number>)를 QaScoreInput 형식으로 변환 (동일 타입이지만 명시적 변환).
 */
export function entryToScoreInput(entry: QaScoreEntry): QaScoreInput {
  return { ...entry.itemScores };
}

// ── 등급 분류 헬퍼 ────────────────────────────────────────────────────────────

/** 업로드 후보 등급 (S, A) */
export function isUploadCandidateGrade(grade: string): boolean {
  return grade === "S" || grade === "A";
}

/** 재검토 필요 등급 (B, C) */
export function isReviewGrade(grade: string): boolean {
  return grade === "B" || grade === "C";
}

/** 실패/폐기 등급 (F) */
export function isFailureGrade(grade: string): boolean {
  return grade === "F";
}

// ── 필터 헬퍼 ─────────────────────────────────────────────────────────────────

export type GradeFilterKey = "all" | "upload" | "review" | "fail";
export type PeriodFilterKey = "all" | "today" | "7d" | "30d";

export interface QaFilterOptions {
  grade?: GradeFilterKey;
  period?: PeriodFilterKey;
  /**
   * 태그 OR 필터: 지정한 태그 중 하나라도 포함된 항목만 표시.
   * 빈 배열이면 필터 미적용 (전체 표시).
   * issueTags 없는 기존 데이터는 태그 필터 적용 시 제외.
   */
  tags?: QaIssueTag[];
}

/**
 * QaScoreEntry 배열에 등급·기간·태그 필터 적용.
 */
export function filterQaScores(
  entries: QaScoreEntry[],
  { grade = "all", period = "all", tags = [] }: QaFilterOptions,
): QaScoreEntry[] {
  let result = entries;

  // ── 등급 필터 ──
  if (grade !== "all") {
    result = result.filter((e) => {
      if (grade === "upload") return isUploadCandidateGrade(e.grade);
      if (grade === "review") return isReviewGrade(e.grade);
      if (grade === "fail")   return isFailureGrade(e.grade);
      return true;
    });
  }

  // ── 기간 필터 ──
  if (period !== "all") {
    const now = Date.now();
    const cutoff =
      period === "today" ? startOfToday() :
      period === "7d"    ? now - 7  * 24 * 60 * 60 * 1000 :
                           now - 30 * 24 * 60 * 60 * 1000;

    result = result.filter((e) => new Date(e.updatedAt).getTime() >= cutoff);
  }

  // ── 태그 필터 (OR) ──
  if (tags.length > 0) {
    result = result.filter(
      (e) => e.issueTags && tags.some((t) => e.issueTags!.includes(t)),
    );
  }

  return result;
}

/** 오늘 00:00:00 UTC+local 기준 타임스탬프 */
function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * 필터 옵션을 파일명 suffix로 변환.
 * 예: grade=fail, period=7d → "-fail-7d"
 */
export function filterSuffix(grade: GradeFilterKey, period: PeriodFilterKey): string {
  const parts: string[] = [];
  if (grade  !== "all") parts.push(grade);
  if (period !== "all") parts.push(period);
  return parts.length ? "-" + parts.join("-") : "";
}

// ── CSV 내보내기 ───────────────────────────────────────────────────────────────

/**
 * CSV 셀 값 이스케이프.
 * - 쉼표, 줄바꿈, 큰따옴표 포함 시 큰따옴표로 감싸고 내부 " → "" 처리
 */
function csvCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  const s = String(value);
  // 특수문자가 없으면 그대로 반환
  if (!/[",\n\r]/.test(s)) return s;
  // 큰따옴표 이중화 후 감싸기
  return `"${s.replace(/"/g, '""')}"`;
}

/** emotional_story rubric 항목 ID 순서 (CSV 컬럼 순서 고정) */
const ITEM_IDS = [
  "hook_3sec",
  "story_structure",
  "closing_line",
  "scene_image_match",
  "core_object_consistency",
  "style_consistency",
  "no_irrelevant_props",
  "motion_appropriateness",
  "transition_smoothness",
  "voice_tone",
  "breathing_pause",
  "volume_balance",
  "sync_accuracy",
  "subtitle_readability",
  "hook_retention",
  "shareable_feel",
  "duration_fit",
] as const;

/** CSV 헤더 행 */
const CSV_HEADER = [
  "renderId",
  "totalScore",
  "grade",
  "category",
  "passed",          // totalScore >= 70
  "comment",
  "issueTags",       // "|" 구분 문자열 — 없으면 빈 문자열
  "createdAt",
  "updatedAt",
  ...ITEM_IDS,       // 항목별 개별 컬럼
  "itemScores_json", // 원본 JSON (추가 항목 대비 보조용)
].join(",");

/**
 * QaScoreEntry 배열 → CSV 문자열 변환.
 * @param entries  변환할 항목 목록 (기본: listQaScores())
 */
export function qaScoresToCsv(entries?: QaScoreEntry[]): string {
  const rows = entries ?? listQaScores();
  if (rows.length === 0) return CSV_HEADER + "\n";

  const lines = rows.map((e) => {
    const cells = [
      csvCell(e.renderId),
      csvCell(e.totalScore),
      csvCell(e.grade),
      csvCell(e.category ?? ""),
      csvCell(e.totalScore >= 70 ? "PASS" : "FAIL"),
      csvCell(e.comment ?? ""),
      // issueTags: 배열을 "|" 구분 문자열로 직렬화, 없으면 빈 문자열
      csvCell(e.issueTags && e.issueTags.length > 0 ? e.issueTags.join("|") : ""),
      csvCell(e.createdAt),
      csvCell(e.updatedAt),
      // 항목별 점수 컬럼
      ...ITEM_IDS.map((id) => csvCell(e.itemScores[id] ?? "")),
      // itemScores 원본 JSON
      csvCell(JSON.stringify(e.itemScores)),
    ];
    return cells.join(",");
  });

  return [CSV_HEADER, ...lines].join("\n");
}

/**
 * CSV 내보내기 — 브라우저에서 파일 다운로드 실행.
 * 클라이언트 전용 (window/document 필요).
 * @param entries   내보낼 항목 목록 (기본: listQaScores())
 * @param suffix    파일명 suffix (예: "-fail-7d"). filterSuffix()로 생성.
 */
export function downloadQaScoresCsv(entries?: QaScoreEntry[], suffix = ""): void {
  if (typeof window === "undefined") return;

  const csv = qaScoresToCsv(entries);
  // BOM(UTF-8) 추가 — Excel에서 한글 깨짐 방지
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);

  const today    = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const filename = `autoshorts-qa-scores${suffix}-${today}.csv`;

  const a = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
