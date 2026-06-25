import {
  validHouseholdDebtDraft,
  validHouseholdDebtResult,
  brokenMissingFieldsDraft,
  brokenMissingFieldsResult,
} from "@/lib/source-facts/manual-fixtures";
import type { ManualFactCardDraft, ManualFactCardAuthoringResult } from "@/lib/source-facts/manual";
import type { FactCardValidationError, SourceCitation } from "@/lib/source-facts/types";

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-700/50 bg-emerald-900/30 text-emerald-300 text-xs font-bold tracking-wide">
      <span className="w-2 h-2 rounded-full bg-emerald-400" />
      ok = true
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-red-700/50 bg-red-900/30 text-red-300 text-xs font-bold tracking-wide">
      <span className="w-2 h-2 rounded-full bg-red-400" />
      ok = false
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 mt-5 first:mt-0">
      {children}
    </h3>
  );
}

function FieldRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex gap-3 py-1.5 border-b border-slate-800/40 last:border-0">
      <span className="text-xs text-slate-500 w-36 shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm break-all ${mono ? "font-mono text-slate-300 text-xs" : "text-slate-200"}`}>
        {value}
      </span>
    </div>
  );
}

function ValidationErrors({ errors }: { errors: FactCardValidationError[] }) {
  if (errors.length === 0) return null;
  return (
    <div className="rounded-lg border border-red-800/40 bg-red-900/15 px-4 py-3">
      <div className="text-xs font-bold text-red-300 uppercase tracking-wider mb-2">
        Validation Errors ({errors.length}건)
      </div>
      <ul className="space-y-1.5">
        {errors.map((err, i) => (
          <li key={i} className="flex gap-2 text-xs">
            <span className="font-mono text-red-400 shrink-0 bg-red-900/30 px-1.5 py-0.5 rounded">
              {err.code}
            </span>
            <span className="text-slate-300">
              <span className="text-red-300 font-semibold">{err.field}</span>
              {" — "}
              {err.message}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CitationCard({ citation, index }: { citation: SourceCitation; index: number }) {
  return (
    <div className="rounded-lg border border-indigo-800/30 bg-indigo-900/10 px-3 py-2.5">
      <div className="text-xs font-bold text-indigo-300 mb-1">
        Citation #{index + 1}
        {citation.citationLabel && (
          <span className="font-normal text-slate-400 ml-2">— {citation.citationLabel}</span>
        )}
      </div>
      <FieldRow label="sourceName" value={citation.sourceName} />
      <FieldRow label="sourceUrl" value={citation.sourceUrl} mono />
      <FieldRow label="publishedDate" value={citation.publishedDate} mono />
      {citation.dataPeriod && <FieldRow label="dataPeriod" value={citation.dataPeriod} />}
      {citation.commercialUseStatus && (
        <FieldRow
          label="commercialUse"
          value={
            <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
              citation.commercialUseStatus === "allowed"
                ? "bg-emerald-900/30 text-emerald-300 border border-emerald-700/40"
                : "bg-amber-900/30 text-amber-300 border border-amber-700/40"
            }`}>
              {citation.commercialUseStatus}
            </span>
          }
        />
      )}
    </div>
  );
}

function DraftPanel({ draft }: { draft: ManualFactCardDraft }) {
  return (
    <div className="space-y-1">
      <SectionLabel>기본 정보</SectionLabel>
      <FieldRow label="id" value={draft.id} mono />
      <FieldRow label="indicatorName" value={draft.indicatorName} />
      <FieldRow label="contentCategory" value={draft.contentCategory} mono />
      <FieldRow label="isMock" value={String(draft.isMock)} mono />
      <FieldRow label="isPublishable" value={String(draft.isPublishable)} mono />
      {draft.createdAt && <FieldRow label="createdAt" value={draft.createdAt} mono />}

      <SectionLabel>출처 정보</SectionLabel>
      <FieldRow label="sourceName" value={draft.sourceName || <span className="text-red-400 italic">비어 있음</span>} />
      <FieldRow
        label="sourceUrl"
        value={
          draft.sourceUrl
            ? <span className="font-mono text-xs break-all">{draft.sourceUrl}</span>
            : <span className="text-red-400 italic">비어 있음</span>
        }
      />
      <FieldRow label="publishedDate" value={draft.publishedDate} mono />
      <FieldRow label="dataPeriod" value={draft.dataPeriod} />

      <SectionLabel>지표 수치</SectionLabel>
      <FieldRow label="currentValue" value={draft.currentValue || <span className="text-red-400 italic">비어 있음</span>} />
      <FieldRow label="previousValue" value={draft.previousValue} />
      <FieldRow label="changeValue" value={draft.changeValue} />
      <FieldRow label="changeRate" value={draft.changeRate} />
      <FieldRow label="unit" value={draft.unit} />
      <FieldRow label="comparisonType" value={draft.comparisonType} mono />
      {draft.currentNumericValue !== undefined && (
        <FieldRow label="currentNumeric" value={String(draft.currentNumericValue)} mono />
      )}

      <SectionLabel>해석 / 주의사항</SectionLabel>
      <FieldRow label="interpretation" value={draft.interpretation} />
      <FieldRow label="cautionNote" value={draft.cautionNote} />

      <SectionLabel>허용 Claim ({draft.allowedClaims.length}건)</SectionLabel>
      {draft.allowedClaims.length > 0 ? (
        <ul className="space-y-1">
          {draft.allowedClaims.map((claim, i) => (
            <li key={i} className="flex gap-2 text-xs">
              <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
              <span className="text-slate-200">{claim}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-red-400 italic">없음</p>
      )}

      <SectionLabel>차단 Claim ({draft.blockedClaims.length}건)</SectionLabel>
      {draft.blockedClaims.length > 0 ? (
        <ul className="space-y-1">
          {draft.blockedClaims.map((claim, i) => (
            <li key={i} className="flex gap-2 text-xs">
              <span className="text-red-500 shrink-0 mt-0.5">✗</span>
              <span className="text-slate-300">{claim}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-500 italic">없음</p>
      )}

      <SectionLabel>Citations ({draft.citations.length}건)</SectionLabel>
      {draft.citations.length > 0 ? (
        <div className="space-y-2">
          {draft.citations.map((c, i) => (
            <CitationCard key={c.id} citation={c} index={i} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-red-400 italic border border-red-800/40 bg-red-900/15 px-3 py-2 rounded">
          citation 없음 — 최소 1건 필수
        </p>
      )}
    </div>
  );
}

function FactCardSummary({ result }: { result: ManualFactCardAuthoringResult }) {
  if (!result.ok || !result.factCard) {
    return (
      <div className="rounded-lg border border-red-800/40 bg-red-900/15 px-4 py-3 text-sm text-red-300">
        ok=false — Fact Card가 생성되지 않았습니다. validation errors를 확인하세요.
      </div>
    );
  }

  const fc = result.factCard;
  return (
    <div className="rounded-lg border border-emerald-700/40 bg-emerald-900/15 px-4 py-3 space-y-1">
      <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2">
        Fact Card Summary — {fc.id}
      </div>
      <FieldRow label="indicatorName" value={fc.indicatorName} />
      <FieldRow label="currentValue" value={fc.currentValue} />
      <FieldRow label="changeValue" value={fc.changeValue} />
      <FieldRow label="changeRate" value={fc.changeRate} />
      <FieldRow label="dataPeriod" value={fc.dataPeriod} />
      <FieldRow label="sourceName" value={fc.sourceName} />
      <FieldRow label="sourceUrl" value={fc.sourceUrl} mono />
      <FieldRow label="publishedDate" value={fc.publishedDate} mono />
      <FieldRow label="interpretation" value={fc.interpretation} />
      <FieldRow label="cautionNote" value={fc.cautionNote} />
      <FieldRow label="allowedClaims" value={`${fc.allowedClaims.length}건`} mono />
      <FieldRow label="blockedClaims" value={`${fc.blockedClaims.length}건`} mono />
      <FieldRow label="citations" value={`${fc.citations.length}건`} mono />
      <FieldRow label="isMock" value={String(fc.isMock)} mono />
      <FieldRow label="isPublishable" value={String(fc.isPublishable)} mono />
    </div>
  );
}

function WorkflowSteps() {
  const steps = [
    { num: 1, label: "Fact Card 작성", active: true, desc: "출처 기반 수치 입력 · validation" },
    { num: 2, label: "Video Blueprint", active: false, desc: "쇼츠 구조 생성" },
    { num: 3, label: "대본 패키지", active: false, desc: "씬별 narration / caption" },
    { num: 4, label: "위험 심사", active: false, desc: "금융 표현 risk scan" },
    { num: 5, label: "Owner 검토", active: false, desc: "패키지 승인 / 반려" },
    { num: 6, label: "복사 · 배포", active: false, desc: "클립보드 페이로드 → 업로드" },
  ];

  return (
    <div className="flex items-center gap-1.5 flex-wrap px-4 py-3 border-b border-slate-800/50 bg-slate-900/40">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center gap-1">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${
            step.active
              ? "border-indigo-600 bg-indigo-900/50 text-indigo-200"
              : "border-slate-700/50 bg-slate-800/30 text-slate-500"
          }`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
              step.active ? "bg-indigo-500 text-white" : "bg-slate-700 text-slate-400"
            }`}>
              {step.num}
            </span>
            {step.label}
          </div>
          {i < steps.length - 1 && (
            <span className="text-slate-700 text-xs">›</span>
          )}
        </div>
      ))}
    </div>
  );
}

function DraftCard({
  title,
  subtitle,
  draft,
  result,
}: {
  title: string;
  subtitle: string;
  draft: ManualFactCardDraft;
  result: ManualFactCardAuthoringResult;
}) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 overflow-hidden">
      {/* Card header */}
      <div className="px-4 py-3 border-b border-slate-800/50 flex items-start justify-between gap-3">
        <div>
          <div className="font-bold text-slate-100 text-sm">{title}</div>
          <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>
        </div>
        <StatusBadge ok={result.ok} />
      </div>

      <div className="p-4 space-y-4">
        {/* Validation result */}
        {result.ok ? (
          <>
            <div>
              <SectionLabel>Fact Card 출력</SectionLabel>
              <FactCardSummary result={result} />
            </div>
          </>
        ) : (
          <ValidationErrors errors={result.validation.errors} />
        )}

        {/* Draft input */}
        <div>
          <SectionLabel>Draft 입력값</SectionLabel>
          <div className="bg-slate-900/40 border border-slate-800/40 rounded-lg px-3 py-3">
            <DraftPanel draft={draft} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ManualFactCardPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--bg-secondary)] border-b border-slate-800/70 px-4 py-3">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-base font-bold text-slate-100 tracking-tight">
                Money Shorts OS — Manual Fact Card
              </h1>
              <p className="text-xs text-slate-500">
                Step 1 of 6 · 출처 기반 수치를 입력하고 Fact Card를 검증합니다 · 외부 API 없음
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 text-xs font-semibold">
                Step 1
              </span>
              <span className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700/50 text-slate-400 text-xs">
                MVP1
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Workflow steps */}
      <div className="max-w-screen-xl mx-auto">
        <WorkflowSteps />
      </div>

      {/* Notice */}
      <div className="max-w-screen-xl mx-auto px-4 pt-4">
        <div className="rounded-lg border border-amber-800/40 bg-amber-900/15 px-4 py-3 text-xs text-amber-200">
          <span className="font-bold text-amber-300">출처 우선 원칙</span>
          {" — "}
          Fact Card에 없는 숫자나 사실은 대본에 쓰지 않습니다.
          모든 수치는 Owner가 실제 출처(공시/보도자료)에서 직접 입력해야 합니다.
          AI는 Fact Card 필드 외 값을 발명하지 않습니다.
        </div>
      </div>

      {/* Two-column draft comparison */}
      <main className="max-w-screen-xl mx-auto px-4 py-5">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Valid draft */}
          <DraftCard
            title="✓ Valid Draft — 가계부채 잔액 2024년 4분기"
            subtitle="authorManualFactCard() → ok=true, factCard non-null"
            draft={validHouseholdDebtDraft}
            result={validHouseholdDebtResult}
          />

          {/* Broken draft */}
          <DraftCard
            title="✗ Broken Draft — 필수 필드 누락"
            subtitle="authorManualFactCard() → ok=false, factCard=null"
            draft={brokenMissingFieldsDraft}
            result={brokenMissingFieldsResult}
          />
        </div>

        {/* Field guide */}
        <div className="mt-6 rounded-xl border border-slate-800/60 bg-slate-900/40 px-5 py-4">
          <div className="text-sm font-bold text-slate-200 mb-3">
            Manual Fact Card 필드 가이드
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5 text-xs">
            {[
              ["sourceName", "출처 표시 이름 (예: 한국은행 가계신용)", true],
              ["sourceUrl", "출처 직접 URL — https:// 필수", true],
              ["publishedDate", "공식 공개일 (YYYY-MM-DD)", true],
              ["dataPeriod", "데이터 적용 기간 (예: 2024년 4분기)", true],
              ["indicatorName", "지표명 또는 주제명", true],
              ["currentValue", "현재값 — 출처 원문 그대로 (반올림 금지)", true],
              ["previousValue", "직전 기간 값, 없으면 N/A", true],
              ["changeValue", "변화값, 없으면 N/A", false],
              ["changeRate", "변화율, 없으면 N/A", false],
              ["interpretation", "평서문 1문장 — 사실만, 예측 금지", true],
              ["cautionNote", "제한·맥락 주의 1문장", true],
              ["allowedClaims", "허용 팩트 주장 — 최소 1건 필수", true],
              ["blockedClaims", "금지 표현 — 빈 배열 허용", false],
              ["citations", "출처 citation 객체 — 최소 1건 필수", true],
            ].map(([field, desc, required]) => (
              <div key={field as string} className="flex gap-2 py-1 border-b border-slate-800/30 last:border-0">
                <span className="font-mono text-slate-400 w-32 shrink-0">{field as string}</span>
                <span className="text-slate-400">{desc as string}</span>
                {required && (
                  <span className="text-red-400 shrink-0 ml-auto">필수</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
