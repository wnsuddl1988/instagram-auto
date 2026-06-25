"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { authorManualFactCard } from "@/lib/source-facts/manual";
import type { ManualFactCardDraft } from "@/lib/source-facts/manual";
import type { SourceCitation, FactCardValidationError, ComparisonType, ContentCategory } from "@/lib/source-facts/types";
import { validHouseholdDebtDraft } from "@/lib/source-facts/manual-fixtures";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CitationRow {
  id: string;
  sourceName: string;
  sourceUrl: string;
  publishedDate: string;
  dataPeriod: string;
  citationLabel: string;
}

interface FormState {
  id: string;
  primarySourceProviderId: string;
  sourceName: string;
  sourceUrl: string;
  publishedDate: string;
  dataPeriod: string;
  indicatorName: string;
  currentValue: string;
  previousValue: string;
  changeValue: string;
  changeRate: string;
  unit: string;
  comparisonType: ComparisonType;
  interpretation: string;
  cautionNote: string;
  allowedClaimsText: string;
  blockedClaimsText: string;
  contentCategory: ContentCategory;
  citations: CitationRow[];
  isMock: boolean;
  isPublishable: boolean;
}

// ── Initial state ─────────────────────────────────────────────────────────────

const EMPTY_CITATION: CitationRow = {
  id: "",
  sourceName: "",
  sourceUrl: "",
  publishedDate: "",
  dataPeriod: "",
  citationLabel: "",
};

const INITIAL_STATE: FormState = {
  id: "fact-card-manual-new-001",
  primarySourceProviderId: "provider-kosis-manual",
  sourceName: "",
  sourceUrl: "",
  publishedDate: "",
  dataPeriod: "",
  indicatorName: "",
  currentValue: "",
  previousValue: "N/A",
  changeValue: "N/A",
  changeRate: "N/A",
  unit: "N/A",
  comparisonType: "previous_release",
  interpretation: "",
  cautionNote: "",
  allowedClaimsText: "",
  blockedClaimsText: "",
  contentCategory: "source_based_finance",
  citations: [{ ...EMPTY_CITATION }],
  isMock: true,
  isPublishable: false,
};

// ── Sample fixture → FormState ────────────────────────────────────────────────

function draftToFormState(d: ManualFactCardDraft): FormState {
  return {
    id: d.id,
    primarySourceProviderId: d.primarySourceProviderId,
    sourceName: d.sourceName,
    sourceUrl: d.sourceUrl,
    publishedDate: d.publishedDate,
    dataPeriod: d.dataPeriod,
    indicatorName: d.indicatorName,
    currentValue: d.currentValue,
    previousValue: d.previousValue,
    changeValue: d.changeValue,
    changeRate: d.changeRate,
    unit: d.unit,
    comparisonType: d.comparisonType,
    interpretation: d.interpretation,
    cautionNote: d.cautionNote,
    allowedClaimsText: d.allowedClaims.join("\n"),
    blockedClaimsText: d.blockedClaims.join("\n"),
    contentCategory: d.contentCategory,
    citations: d.citations.map((c) => ({
      id: c.id,
      sourceName: c.sourceName,
      sourceUrl: c.sourceUrl,
      publishedDate: c.publishedDate,
      dataPeriod: c.dataPeriod ?? "",
      citationLabel: c.citationLabel ?? "",
    })),
    isMock: d.isMock,
    isPublishable: d.isPublishable,
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-slate-400 mb-1">
      {children}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  mono,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  disabled?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-50 ${mono ? "font-mono text-xs" : ""}`}
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30 resize-y"
    />
  );
}

function SelectInput<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 mt-5 first:mt-0 border-b border-slate-800/60 pb-1">
      {children}
    </h3>
  );
}

function FieldRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex gap-3 py-1.5 border-b border-slate-800/30 last:border-0">
      <span className="text-xs text-slate-500 w-36 shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm break-all min-w-0 ${mono ? "font-mono text-slate-300 text-xs" : "text-slate-200"}`}>
        {value}
      </span>
    </div>
  );
}

function ErrorBadge({ errors }: { errors: FactCardValidationError[] }) {
  if (errors.length === 0) return null;
  return (
    <div className="rounded-lg border border-red-800/50 bg-red-900/20 px-4 py-3">
      <div className="text-xs font-bold text-red-300 uppercase tracking-wider mb-2">
        Validation Errors ({errors.length}건)
      </div>
      <ul className="space-y-1.5">
        {errors.map((err, i) => (
          <li key={i} className="flex flex-wrap gap-1.5 text-xs items-start">
            <span className="font-mono text-red-400 bg-red-900/30 px-1.5 py-0.5 rounded shrink-0">
              {err.code}
            </span>
            <span className="text-amber-300 font-semibold shrink-0">{err.field}</span>
            <span className="text-slate-300 min-w-0">— {err.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Main client component ──────────────────────────────────────────────────────

export default function ManualFactCardFormClient() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const loadSample = useCallback(() => {
    setForm(draftToFormState(validHouseholdDebtDraft));
  }, []);

  const resetForm = useCallback(() => {
    setForm(INITIAL_STATE);
  }, []);

  // Citation helpers
  const updateCitation = useCallback((index: number, key: keyof CitationRow, value: string) => {
    setForm((prev) => {
      const next = [...prev.citations];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, citations: next };
    });
  }, []);

  const addCitation = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      citations: [...prev.citations, { ...EMPTY_CITATION }],
    }));
  }, []);

  const removeCitation = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      citations: prev.citations.filter((_, i) => i !== index),
    }));
  }, []);

  // Build draft and run validation.
  // Only rows with Owner-supplied id are included — id must not be invented.
  const citations: SourceCitation[] = form.citations
    .filter((c) => c.id.trim() !== "")
    .map((c) => ({
      id: c.id.trim(),
      sourceName: c.sourceName,
      sourceUrl: c.sourceUrl,
      publishedDate: c.publishedDate,
      dataPeriod: c.dataPeriod || undefined,
      citationLabel: c.citationLabel || undefined,
    }));

  // Rows present in the form but missing an id — these are not yet valid citations.
  const citationRowsMissingId = form.citations.filter((c) => c.id.trim() === "").length;

  const allowedClaims = form.allowedClaimsText
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const blockedClaims = form.blockedClaimsText
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const draft: ManualFactCardDraft = {
    id: form.id || "fact-card-manual-new-001",
    primarySourceProviderId: form.primarySourceProviderId || "provider-kosis-manual",
    sourceName: form.sourceName,
    sourceUrl: form.sourceUrl,
    publishedDate: form.publishedDate,
    dataPeriod: form.dataPeriod,
    indicatorName: form.indicatorName,
    currentValue: form.currentValue,
    previousValue: form.previousValue || "N/A",
    changeValue: form.changeValue || "N/A",
    changeRate: form.changeRate || "N/A",
    unit: form.unit || "N/A",
    comparisonType: form.comparisonType,
    interpretation: form.interpretation,
    cautionNote: form.cautionNote,
    allowedClaims,
    blockedClaims,
    contentCategory: form.contentCategory,
    citations,
    isMock: form.isMock,
    isPublishable: form.isPublishable,
    createdAt: "2026-06-25T09:00:00+09:00",
  };

  const result = authorManualFactCard(draft);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--bg-secondary)] border-b border-slate-800/70 px-4 py-3">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight">
              Money Shorts OS — Manual Fact Card 입력
            </h1>
            <p className="text-xs text-slate-500">
              Step 1 · 출처 기반 수치를 입력하고 로컬 validation을 확인합니다 · 외부 API 없음
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={loadSample}
              className="px-3 py-1.5 rounded-lg border border-indigo-600/60 bg-indigo-900/25 text-indigo-300 text-xs font-semibold hover:bg-indigo-900/50 transition-colors"
            >
              샘플 불러오기
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 rounded-lg border border-slate-600/60 bg-slate-800/25 text-slate-400 text-xs font-semibold hover:bg-slate-800/60 transition-colors"
            >
              초기화
            </button>
            <span className="px-2 py-1 rounded bg-amber-900/30 border border-amber-700/50 text-amber-300 text-xs font-semibold">
              LOCAL VALIDATION ONLY
            </span>
            <span className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700/50 text-slate-400 text-xs">
              MVP1
            </span>
          </div>
        </div>
      </header>

      {/* Notice */}
      <div className="max-w-screen-xl mx-auto px-4 pt-4">
        <div className="rounded-lg border border-amber-800/40 bg-amber-900/15 px-4 py-3 text-xs text-amber-200">
          <span className="font-bold text-amber-300">로컬 validation 전용</span>
          {" — "}
          이 폼은 DB 저장, publish, render를 수행하지 않습니다. 입력값은 브라우저 상태에만 머뭅니다.
          실제 출처(공시/보도자료)에서 Owner가 직접 입력한 값만 허용됩니다. AI는 값을 발명하지 않습니다.
        </div>
      </div>

      {/* Nav links */}
      <div className="max-w-screen-xl mx-auto px-4 pt-3 flex gap-3 flex-wrap">
        <Link
          href="/fact-cards/manual"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/60 text-slate-400 text-xs hover:bg-slate-800/60 transition-colors"
        >
          ← Fact Card 미리보기
        </Link>
        <Link
          href="/fact-cards/manual/package-preview"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-700/50 text-indigo-400 text-xs hover:bg-indigo-900/30 transition-colors"
        >
          Package Preview →
        </Link>
      </div>

      <main className="max-w-screen-xl mx-auto px-4 py-5">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* ── Left: Form ──────────────────────────────────────────────── */}
          <div className="space-y-1">
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 px-5 py-5">

              <SectionLabel>기본 정보</SectionLabel>
              <div className="space-y-3">
                <div>
                  <FieldLabel required>indicatorName (지표명)</FieldLabel>
                  <TextInput
                    value={form.indicatorName}
                    onChange={(v) => set("indicatorName", v)}
                    placeholder="예: 가계부채 잔액"
                  />
                </div>
                <div>
                  <FieldLabel>contentCategory</FieldLabel>
                  <SelectInput<ContentCategory>
                    value={form.contentCategory}
                    onChange={(v) => set("contentCategory", v)}
                    options={[
                      { value: "source_based_finance", label: "source_based_finance (출처 기반 금융·경제)" },
                      { value: "money_os_money_management", label: "money_os_money_management (돈관리 CTA)" },
                    ]}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>comparisonType</FieldLabel>
                    <SelectInput<ComparisonType>
                      value={form.comparisonType}
                      onChange={(v) => set("comparisonType", v)}
                      options={[
                        { value: "previous_release", label: "previous_release" },
                        { value: "previous_month", label: "previous_month" },
                        { value: "previous_year", label: "previous_year" },
                        { value: "consensus", label: "consensus" },
                        { value: "custom", label: "custom" },
                      ]}
                    />
                  </div>
                  <div>
                    <FieldLabel>dataPeriod</FieldLabel>
                    <TextInput
                      value={form.dataPeriod}
                      onChange={(v) => set("dataPeriod", v)}
                      placeholder="예: 2024년 4분기"
                    />
                  </div>
                </div>
              </div>

              <SectionLabel>출처 정보</SectionLabel>
              <div className="space-y-3">
                <div>
                  <FieldLabel required>sourceName (출처 표시명)</FieldLabel>
                  <TextInput
                    value={form.sourceName}
                    onChange={(v) => set("sourceName", v)}
                    placeholder="예: 한국은행 가계신용"
                  />
                </div>
                <div>
                  <FieldLabel required>sourceUrl (출처 URL — https:// 필수)</FieldLabel>
                  <TextInput
                    value={form.sourceUrl}
                    onChange={(v) => set("sourceUrl", v)}
                    placeholder="https://"
                    mono
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>publishedDate (공개일 YYYY-MM-DD)</FieldLabel>
                    <TextInput
                      value={form.publishedDate}
                      onChange={(v) => set("publishedDate", v)}
                      placeholder="2025-02-25"
                      mono
                    />
                  </div>
                  <div>
                    <FieldLabel>primarySourceProviderId</FieldLabel>
                    <TextInput
                      value={form.primarySourceProviderId}
                      onChange={(v) => set("primarySourceProviderId", v)}
                      placeholder="provider-kosis-manual"
                      mono
                    />
                  </div>
                </div>
              </div>

              <SectionLabel>지표 수치</SectionLabel>
              <div className="space-y-3">
                <div>
                  <FieldLabel required>currentValue (출처 원문 그대로)</FieldLabel>
                  <TextInput
                    value={form.currentValue}
                    onChange={(v) => set("currentValue", v)}
                    placeholder="예: 1,896.2조 원"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <FieldLabel>previousValue</FieldLabel>
                    <TextInput
                      value={form.previousValue}
                      onChange={(v) => set("previousValue", v)}
                      placeholder="N/A"
                    />
                  </div>
                  <div>
                    <FieldLabel>changeValue</FieldLabel>
                    <TextInput
                      value={form.changeValue}
                      onChange={(v) => set("changeValue", v)}
                      placeholder="N/A"
                    />
                  </div>
                  <div>
                    <FieldLabel>changeRate</FieldLabel>
                    <TextInput
                      value={form.changeRate}
                      onChange={(v) => set("changeRate", v)}
                      placeholder="N/A"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>unit</FieldLabel>
                  <TextInput
                    value={form.unit}
                    onChange={(v) => set("unit", v)}
                    placeholder="N/A"
                  />
                </div>
              </div>

              <SectionLabel>해석 / 주의사항</SectionLabel>
              <div className="space-y-3">
                <div>
                  <FieldLabel>interpretation (평서문 1문장 — 사실만)</FieldLabel>
                  <TextArea
                    value={form.interpretation}
                    onChange={(v) => set("interpretation", v)}
                    placeholder="예: 2024년 4분기 가계부채 잔액이 전분기 대비 20.6조 원 증가해 1,896.2조 원을 기록했다."
                  />
                </div>
                <div>
                  <FieldLabel>cautionNote (제한·맥락 주의)</FieldLabel>
                  <TextArea
                    value={form.cautionNote}
                    onChange={(v) => set("cautionNote", v)}
                    placeholder="예: 가계부채 규모는 GDP 대비 비율 등 맥락 없이 단독 수치만 제시하면 오해를 유발할 수 있다."
                  />
                </div>
              </div>

              <SectionLabel>허용 / 차단 Claim</SectionLabel>
              <div className="space-y-3">
                <div>
                  <FieldLabel required>allowedClaims (허용 팩트 주장 — 줄바꿈으로 구분, 최소 1건)</FieldLabel>
                  <TextArea
                    value={form.allowedClaimsText}
                    onChange={(v) => set("allowedClaimsText", v)}
                    placeholder={"2024년 4분기 가계부채 잔액은 1,896.2조 원이다.\n전분기 대비 20.6조 원 증가했다."}
                    rows={3}
                  />
                  <p className="text-xs text-slate-600 mt-1">현재 {allowedClaims.length}건</p>
                </div>
                <div>
                  <FieldLabel>blockedClaims (금지 표현 — 줄바꿈으로 구분, 빈 배열 허용)</FieldLabel>
                  <TextArea
                    value={form.blockedClaimsText}
                    onChange={(v) => set("blockedClaimsText", v)}
                    placeholder={"가계부채가 위험 수준이다\n부채 폭등"}
                    rows={2}
                  />
                  <p className="text-xs text-slate-600 mt-1">현재 {blockedClaims.length}건</p>
                </div>
              </div>

              <SectionLabel>Citations ({form.citations.length}건)</SectionLabel>
              <div className="space-y-3">
                {form.citations.map((c, i) => (
                  <div key={i} className="rounded-lg border border-indigo-800/30 bg-indigo-900/10 px-3 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-indigo-300">Citation #{i + 1}</span>
                      {form.citations.length > 0 && (
                        <button
                          type="button"
                          onClick={() => removeCitation(i)}
                          className="text-xs text-red-400 hover:text-red-300 border border-red-800/40 px-2 py-0.5 rounded transition-colors"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <FieldLabel required>id</FieldLabel>
                        <TextInput
                          value={c.id}
                          onChange={(v) => updateCitation(i, "id", v)}
                          placeholder="citation-manual-001"
                          mono
                        />
                      </div>
                      <div>
                        <FieldLabel required>sourceName</FieldLabel>
                        <TextInput
                          value={c.sourceName}
                          onChange={(v) => updateCitation(i, "sourceName", v)}
                          placeholder="한국은행 가계신용"
                        />
                      </div>
                      <div>
                        <FieldLabel required>sourceUrl</FieldLabel>
                        <TextInput
                          value={c.sourceUrl}
                          onChange={(v) => updateCitation(i, "sourceUrl", v)}
                          placeholder="https://"
                          mono
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <FieldLabel>publishedDate</FieldLabel>
                          <TextInput
                            value={c.publishedDate}
                            onChange={(v) => updateCitation(i, "publishedDate", v)}
                            placeholder="2025-02-25"
                            mono
                          />
                        </div>
                        <div>
                          <FieldLabel>dataPeriod</FieldLabel>
                          <TextInput
                            value={c.dataPeriod}
                            onChange={(v) => updateCitation(i, "dataPeriod", v)}
                            placeholder="2024년 4분기"
                          />
                        </div>
                      </div>
                      <div>
                        <FieldLabel>citationLabel (선택)</FieldLabel>
                        <TextInput
                          value={c.citationLabel}
                          onChange={(v) => updateCitation(i, "citationLabel", v)}
                          placeholder="한국은행 보도자료 — 가계신용(잠정) 2024년 4분기"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCitation}
                  className="w-full py-2 rounded-lg border border-dashed border-indigo-700/40 text-indigo-400 text-xs hover:bg-indigo-900/20 transition-colors"
                >
                  + Citation 추가
                </button>
                {form.citations.length === 0 && (
                  <p className="text-xs text-red-400 border border-red-800/30 bg-red-900/10 rounded px-3 py-2">
                    citation이 없으면 <span className="font-mono">manual_citation_required</span> 오류가 발생합니다.
                  </p>
                )}
                {citationRowsMissingId > 0 && (
                  <p className="text-xs text-amber-400 border border-amber-800/30 bg-amber-900/10 rounded px-3 py-2">
                    id가 비어 있는 citation row {citationRowsMissingId}건은 draft에 포함되지 않습니다.
                    id는 Owner가 직접 입력해야 합니다 — UI가 자동 생성하지 않습니다.
                  </p>
                )}
              </div>

              <SectionLabel>플래그</SectionLabel>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isMock}
                    onChange={(e) => set("isMock", e.target.checked)}
                    className="rounded border-slate-600"
                  />
                  isMock
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPublishable}
                    onChange={(e) => set("isPublishable", e.target.checked)}
                    className="rounded border-slate-600"
                  />
                  isPublishable
                </label>
              </div>
            </div>
          </div>

          {/* ── Right: Validation result ─────────────────────────────── */}
          <div className="space-y-4">

            {/* Status banner */}
            <div className={`rounded-xl border px-5 py-4 ${
              result.ok
                ? "border-emerald-700/50 bg-emerald-900/15"
                : "border-red-700/50 bg-red-900/15"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${
                  result.ok
                    ? "border-emerald-700/50 bg-emerald-900/25 text-emerald-300"
                    : "border-red-700/50 bg-red-900/25 text-red-300"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${result.ok ? "bg-emerald-400" : "bg-red-400"}`} />
                  {result.ok ? "ok = true" : "ok = false"}
                </span>
                <span className="text-xs text-slate-500">
                  authorManualFactCard() 결과
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {result.ok
                  ? "Fact Card가 생성됐습니다. 아래 summary를 확인하세요."
                  : `${result.validation.errors.length}건의 validation error가 있습니다.`}
              </p>
            </div>

            {/* Errors */}
            {!result.ok && <ErrorBadge errors={result.validation.errors} />}

            {/* FactCard summary */}
            {result.ok && result.factCard && (
              <div className="rounded-xl border border-emerald-700/40 bg-slate-900/60 px-5 py-4">
                <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-3">
                  Generated Fact Card Summary
                </div>
                <FieldRow label="id" value={result.factCard.id} mono />
                <FieldRow label="indicatorName" value={result.factCard.indicatorName} />
                <FieldRow label="dataPeriod" value={result.factCard.dataPeriod} />
                <FieldRow label="currentValue" value={result.factCard.currentValue} />
                <FieldRow label="changeValue" value={result.factCard.changeValue} />
                <FieldRow label="changeRate" value={result.factCard.changeRate} />
                <FieldRow label="sourceName" value={result.factCard.sourceName} />
                <FieldRow label="sourceUrl" value={result.factCard.sourceUrl} mono />
                <FieldRow label="publishedDate" value={result.factCard.publishedDate} mono />
                <FieldRow label="interpretation" value={result.factCard.interpretation} />
                <FieldRow label="cautionNote" value={result.factCard.cautionNote} />
                <FieldRow label="allowedClaims" value={`${result.factCard.allowedClaims.length}건`} mono />
                <FieldRow label="blockedClaims" value={`${result.factCard.blockedClaims.length}건`} mono />
                <FieldRow label="citations" value={`${result.factCard.citations.length}건`} mono />
                <FieldRow label="contentCategory" value={result.factCard.contentCategory} mono />
                <FieldRow label="comparisonType" value={result.factCard.comparisonType} mono />
                <FieldRow label="isMock" value={String(result.factCard.isMock)} mono />
                <FieldRow label="isPublishable" value={String(result.factCard.isPublishable)} mono />

                <div className="mt-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Citations
                </div>
                {result.factCard.citations.map((c, i) => (
                  <div key={c.id} className="rounded border border-indigo-800/25 bg-indigo-900/10 px-3 py-2 mb-2 last:mb-0">
                    <div className="text-xs text-indigo-300 font-semibold mb-1">#{i + 1}</div>
                    <FieldRow label="id" value={c.id} mono />
                    <FieldRow label="sourceName" value={c.sourceName} />
                    <FieldRow label="sourceUrl" value={c.sourceUrl} mono />
                    <FieldRow label="publishedDate" value={c.publishedDate} mono />
                    {c.dataPeriod && <FieldRow label="dataPeriod" value={c.dataPeriod} />}
                    {c.citationLabel && <FieldRow label="citationLabel" value={c.citationLabel} />}
                  </div>
                ))}

                {result.factCard.allowedClaims.length > 0 && (
                  <>
                    <div className="mt-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      허용 Claim
                    </div>
                    <ul className="space-y-1">
                      {result.factCard.allowedClaims.map((claim, i) => (
                        <li key={i} className="flex gap-2 text-xs">
                          <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                          <span className="text-slate-200">{claim}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {/* citation_required hint when empty */}
            {!result.ok && (
              <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 px-5 py-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  폼 상태
                </div>
                <FieldRow label="draft.citations.length" value={String(draft.citations.length)} mono />
                <FieldRow
                  label="manual_citation_required"
                  value={
                    result.validation.errors.some((e) => e.code === "manual_citation_required")
                      ? <span className="text-red-300 font-mono text-xs">발생 중 ✗</span>
                      : <span className="text-slate-500 text-xs">없음</span>
                  }
                />
                <FieldRow label="error count" value={`${result.validation.errors.length}건`} mono />
              </div>
            )}

            {/* Next step hint */}
            <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 px-5 py-4 text-xs text-slate-500">
              <div className="font-bold text-slate-400 mb-1">다음 단계</div>
              <p>valid Fact Card가 확인되면{" "}
                <Link href="/fact-cards/manual/package-preview" className="text-indigo-400 hover:underline">
                  Package Preview →
                </Link>
                {" "}에서 전체 pipeline 미리보기를 확인할 수 있습니다.
              </p>
              <p className="mt-1 text-slate-600">
                이 폼은 DB/API/OS clipboard에 접근하지 않습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Footer nav */}
        <div className="flex gap-3 flex-wrap mt-6 pb-8">
          <Link
            href="/fact-cards/manual"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-700/60 text-slate-300 text-sm hover:bg-slate-800/60 transition-colors"
          >
            ← Fact Card 미리보기
          </Link>
          <Link
            href="/fact-cards/manual/package-preview"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-indigo-700/50 text-indigo-300 text-sm hover:bg-indigo-900/30 transition-colors"
          >
            Package Preview →
          </Link>
        </div>
      </main>
    </div>
  );
}
