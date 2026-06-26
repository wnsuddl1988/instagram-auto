import Link from "next/link";
import { validHouseholdDebtResult } from "@/lib/source-facts/manual-fixtures";
import { generatedBaseRateResult } from "@/lib/source-facts/candidates";
import { assembleContentPackage } from "@/lib/content-package/assembler";
import { generateReviewPacket } from "@/lib/review-packet/generator";
import { evaluateOwnerDecision } from "@/lib/owner-decision/gate";
import { buildClipboardPayload } from "@/lib/clipboard-payload/builder";
import {
  buildPackageDetailModel,
  buildPackageWorkflowStatus,
  buildPackageCopyActionSummary,
} from "@/lib/package-view/builder";
import {
  buildEcosLatestWindowRequest,
  isValidEcosMonthlyPeriod,
} from "@/lib/source-facts/ecos-latest-period";
import { createEcosLiveTransport } from "@/lib/source-facts/ecos-live-transport";
import { buildEcosLatestDraftCandidate } from "@/lib/source-facts/ecos-latest-candidate";
import type { ManualFactCardAuthoringResult } from "@/lib/source-facts/manual";
import type {
  AnyCardProps,
  NumberCardProps,
  ComparisonCardProps,
  SourceCardProps,
  CtaCardProps,
} from "@/lib/chart-cards/types";

// ── Deterministic constants ────────────────────────────────────────────────────
const MOCK_VIDEO_ID = "video-manual-household-debt-preview-001";
const MOCK_CONTENT_PACKAGE_ID = "cp-manual-household-debt-preview-001";
const MOCK_CREATED_AT = "2026-06-25T09:00:00+09:00";
const MOCK_AUDIO_DURATION_SEC = 42.0;
const MOCK_REVIEW_PACKET_ID = "rp-manual-household-debt-preview-001";
const MOCK_GATE_RESULT_ID = "gate-manual-household-debt-preview-001";
const MOCK_DECIDED_AT = "2026-06-25T09:05:00+09:00";

// live draft candidate uses a separate gate ID and decision=null (pending)
const LIVE_GATE_RESULT_ID = "gate-ecos-live-draft-pending-001";

// fetchedAt for live ECOS requests — deterministic constant, never Date.now().
const LIVE_FETCHED_AT = "2026-06-26T00:00:00+09:00";

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 mt-5 first:mt-0">
      {children}
    </h3>
  );
}

function FieldRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-3 py-1.5 border-b border-slate-800/40 last:border-0">
      <span className="text-xs text-slate-500 w-40 shrink-0 pt-0.5">{label}</span>
      <span
        className={`text-sm break-all min-w-0 ${mono ? "font-mono text-slate-300 text-xs" : "text-slate-200"}`}
      >
        {value}
      </span>
    </div>
  );
}

function StatusPill({
  ok,
  trueLabel = "PASS",
  falseLabel = "FAIL",
}: {
  ok: boolean;
  trueLabel?: string;
  falseLabel?: string;
}) {
  return ok ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-emerald-700/50 bg-emerald-900/25 text-emerald-300 text-xs font-bold">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      {trueLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-red-700/50 bg-red-900/25 text-red-300 text-xs font-bold">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
      {falseLabel}
    </span>
  );
}

function RiskLevelBadge({ level }: { level: string }) {
  const colors =
    level === "low"
      ? "border-emerald-700/50 bg-emerald-900/20 text-emerald-300"
      : level === "medium"
        ? "border-amber-700/50 bg-amber-900/20 text-amber-300"
        : "border-red-700/50 bg-red-900/20 text-red-300";
  return (
    <span className={`inline-block px-2 py-0.5 rounded border text-xs font-semibold font-mono ${colors}`}>
      {level}
    </span>
  );
}

function WorkflowSteps({ activeStep }: { activeStep: number }) {
  const steps = [
    { num: 1, label: "Fact Card 작성" },
    { num: 2, label: "Video Blueprint" },
    { num: 3, label: "대본 패키지" },
    { num: 4, label: "위험 심사" },
    { num: 5, label: "Owner 검토" },
    { num: 6, label: "복사 · 배포" },
  ];
  return (
    <div className="flex items-center gap-1 flex-wrap px-4 py-3 border-b border-slate-800/50 bg-slate-900/40">
      {steps.map((step, i) => (
        <div key={String(step.num)} className="flex items-center gap-1">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${
              step.num === activeStep
                ? "border-indigo-600 bg-indigo-900/50 text-indigo-200"
                : step.num < activeStep
                  ? "border-emerald-700/50 bg-emerald-900/20 text-emerald-400"
                  : "border-slate-700/50 bg-slate-800/30 text-slate-500"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                step.num === activeStep
                  ? "bg-indigo-500 text-white"
                  : step.num < activeStep
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-700 text-slate-400"
              }`}
            >
              {step.num < activeStep ? "✓" : step.num}
            </span>
            {step.label}
          </div>
          <span className={i < steps.length - 1 ? "text-slate-700 text-xs" : "invisible text-xs"}>›</span>
        </div>
      ))}
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  color = "slate",
  children,
}: {
  title: string;
  subtitle?: string;
  color?: "slate" | "indigo" | "emerald" | "amber" | "red";
  children: React.ReactNode;
}) {
  const borderColor = {
    slate: "border-slate-700/50",
    indigo: "border-indigo-700/40",
    emerald: "border-emerald-700/40",
    amber: "border-amber-700/40",
    red: "border-red-700/40",
  }[color];
  const headerBg = {
    slate: "bg-slate-800/40",
    indigo: "bg-indigo-900/20",
    emerald: "bg-emerald-900/15",
    amber: "bg-amber-900/15",
    red: "bg-red-900/15",
  }[color];
  const titleColor = {
    slate: "text-slate-200",
    indigo: "text-indigo-200",
    emerald: "text-emerald-200",
    amber: "text-amber-200",
    red: "text-red-200",
  }[color];

  return (
    <div className={`rounded-xl border ${borderColor} overflow-hidden`}>
      <div className={`px-4 py-3 border-b ${borderColor} ${headerBg}`}>
        <div className={`font-bold text-sm ${titleColor}`}>{title}</div>
        {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
      </div>
      <div className="px-4 py-4 bg-slate-900/40">{children}</div>
    </div>
  );
}

function IdChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-600 uppercase tracking-wider">{label}</span>
      <span className="font-mono text-xs text-slate-400 break-all">{value}</span>
    </div>
  );
}

// ── Chart Card visual preview components ─────────────────────────────────────
// CSS-only 9:16 preview. No canvas, no image output, no ffmpeg.

function CardShell({ children, accentClass }: { children: React.ReactNode; accentClass: string }) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg border ${accentClass} bg-slate-950`}
      style={{ aspectRatio: "9/16", width: "160px", minWidth: "160px", maxWidth: "180px" }}
    >
      <div className="absolute inset-0 flex flex-col p-3 text-white overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function NumberCardVisual({ card }: { card: NumberCardProps }) {
  const changePositive = card.changeValue && card.changeValue.startsWith("+");
  const changeNegative = card.changeValue && card.changeValue.startsWith("-");
  const changeColor = changePositive
    ? "text-emerald-400"
    : changeNegative
      ? "text-red-400"
      : "text-slate-400";

  return (
    <CardShell accentClass="border-indigo-700/60">
      <div className="text-[9px] text-indigo-300 uppercase tracking-widest font-semibold mb-1 shrink-0 truncate">
        {card.title}
      </div>
      <div className="text-2xl font-black leading-none my-auto text-center truncate">
        {card.value}
      </div>
      <div className="text-[8px] text-slate-400 text-center truncate">{card.unit}</div>
      {(card.changeValue || card.changeRate) && (
        <div className={`text-[9px] font-semibold text-center mt-1 truncate ${changeColor}`}>
          {card.changeValue}{card.changeRate ? ` (${card.changeRate})` : ""}
        </div>
      )}
      <div className="mt-auto pt-2 border-t border-slate-800/60">
        <p className="text-[8px] text-slate-300 leading-tight line-clamp-3">
          {card.interpretationNote}
        </p>
      </div>
      <div className="text-[7px] text-slate-600 mt-1 truncate">
        {card.source.sourceName} · {card.source.publishedDate}
      </div>
    </CardShell>
  );
}

function ComparisonCardVisual({ card }: { card: ComparisonCardProps }) {
  const directionArrow =
    card.direction === "up" ? "↑" : card.direction === "down" ? "↓" : "→";
  const arrowColor =
    card.direction === "up"
      ? "text-emerald-400"
      : card.direction === "down"
        ? "text-red-400"
        : "text-slate-400";

  return (
    <CardShell accentClass="border-slate-600/60">
      <div className="text-[9px] text-slate-300 uppercase tracking-widest font-semibold mb-1 shrink-0 truncate">
        {card.title}
      </div>
      <div className="flex-1 flex flex-col justify-center gap-1">
        <div className="flex items-center justify-between gap-1">
          <div className="flex flex-col items-center flex-1 min-w-0">
            <div className="text-[8px] text-slate-500 truncate w-full text-center">{card.labelLeft}</div>
            <div className="text-sm font-bold truncate w-full text-center">{card.valueLeft}</div>
          </div>
          <div className={`text-xl font-black shrink-0 ${arrowColor}`}>{directionArrow}</div>
          <div className="flex flex-col items-center flex-1 min-w-0">
            <div className="text-[8px] text-slate-500 truncate w-full text-center">{card.labelRight}</div>
            <div className="text-sm font-bold truncate w-full text-center">{card.valueRight}</div>
          </div>
        </div>
        <div className="text-[8px] text-slate-400 text-center truncate">{card.unit}</div>
      </div>
      <div className="mt-auto pt-2 border-t border-slate-800/60">
        <div className="text-[8px] text-slate-400 text-center truncate">{card.changeLabel}</div>
      </div>
    </CardShell>
  );
}

function SourceCardVisual({ card }: { card: SourceCardProps }) {
  return (
    <CardShell accentClass="border-amber-700/50">
      <div className="text-[9px] text-amber-300 uppercase tracking-widest font-semibold mb-1 shrink-0">
        출처
      </div>
      <div className="flex-1 flex flex-col justify-center gap-2">
        <div className="text-[10px] font-semibold text-slate-200 text-center leading-tight line-clamp-2">
          {card.sourceName}
        </div>
        {card.dataPeriod && (
          <div className="text-[8px] text-slate-400 text-center">{card.dataPeriod}</div>
        )}
        <div className="text-[8px] text-slate-500 text-center">{card.publishedDate}</div>
      </div>
      <div className="mt-auto pt-2 border-t border-slate-800/60">
        <p className="text-[7px] text-slate-600 leading-tight line-clamp-2">
          {card.cautionNote}
        </p>
      </div>
    </CardShell>
  );
}

function CtaCardVisual({ card }: { card: CtaCardProps }) {
  return (
    <CardShell accentClass="border-emerald-700/50">
      <div className="flex-1 flex flex-col justify-center gap-2">
        <div className="text-[11px] font-black text-emerald-300 text-center leading-tight">
          {card.ctaText}
        </div>
        {card.subText && (
          <div className="text-[8px] text-slate-400 text-center leading-tight line-clamp-2">
            {card.subText}
          </div>
        )}
      </div>
    </CardShell>
  );
}

function ChartCardVisualPreview({ card }: { card: AnyCardProps }) {
  if (card.cardType === "number_card") return <NumberCardVisual card={card} />;
  if (card.cardType === "comparison_card") return <ComparisonCardVisual card={card} />;
  if (card.cardType === "source_card") return <SourceCardVisual card={card} />;
  if (card.cardType === "cta_card") return <CtaCardVisual card={card} />;
  return null;
}

// ── Error state ────────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center p-8">
      <div className="max-w-md w-full rounded-xl border border-red-700/50 bg-red-900/15 px-6 py-6 text-center">
        <div className="text-red-300 font-bold text-base mb-2">로컬 오류</div>
        <p className="text-sm text-red-200 mb-4">{message}</p>
        <Link
          href="/fact-cards/manual"
          className="inline-block px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
        >
          ← Fact Card 페이지로
        </Link>
      </div>
    </div>
  );
}

// ── Live blocked state (ECOS key missing, network error, or candidate blocked) ──

function LiveBlockedState({ status, reason }: { status: string; reason: string }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center p-8">
      <div className="max-w-lg w-full rounded-xl border border-amber-700/50 bg-amber-900/10 px-6 py-6">
        <div className="text-amber-300 font-bold text-base mb-2">ECOS live candidate 차단됨</div>
        <div className="font-mono text-xs text-amber-400 mb-3 bg-amber-900/20 px-3 py-2 rounded">
          status: {status}
        </div>
        <p className="text-sm text-amber-200 mb-4 break-all">{reason}</p>
        <div className="text-xs text-slate-500 mb-4">
          ECOS API key 환경변수가 없거나 live 요청이 실패한 경우입니다.
          mock candidate를 사용하거나 .env.local 설정을 확인하세요.
        </div>
        <Link
          href="/fact-cards/manual/package-preview?candidate=base-rate"
          className="inline-block px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
        >
          ← mock 후보로 돌아가기
        </Link>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

// ── Candidate registry ─────────────────────────────────────────────────────────
// Maps ?candidate= query param to authoring results.
// Add new generated candidates here as they are implemented.
const CANDIDATE_REGISTRY: Record<
  string,
  { label: string; result: typeof validHouseholdDebtResult }
> = {
  "base-rate": {
    label: "기준금리 (ECOS mock)",
    result: generatedBaseRateResult,
  },
};

export default async function PackagePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ candidate?: string; endPeriod?: string }>;
}) {
  const params = await searchParams;
  const candidateKey = params.candidate ?? null;
  const endPeriod = params.endPeriod ?? null;

  // ── Live ECOS latest candidate path (explicit query only) ──────────────────
  // Activated only when ?candidate=ecos-live-latest is present.
  // Default and mock routes never reach this block.
  if (candidateKey === "ecos-live-latest") {
    // Validate endPeriod
    if (endPeriod === null || !isValidEcosMonthlyPeriod(endPeriod)) {
      return (
        <LiveBlockedState
          status="blocked_invalid_end_period"
          reason={`endPeriod 파라미터가 없거나 유효하지 않습니다 (받은 값: ${endPeriod ?? "없음"}). ?candidate=ecos-live-latest&endPeriod=202606 형식으로 요청하세요.`}
        />
      );
    }

    const windowRequest = buildEcosLatestWindowRequest(endPeriod);
    if (windowRequest === null) {
      return (
        <LiveBlockedState
          status="blocked_window_request_failed"
          reason={`endPeriod=${endPeriod}로 window request를 만들 수 없습니다.`}
        />
      );
    }

    const transport = createEcosLiveTransport(LIVE_FETCHED_AT);
    // buildEcosLatestDraftCandidate needs raw rows (it runs its own resolvers),
    // so we call the transport directly instead of going through runEcosConnectorAsync.
    const rawTransportResult = await transport.executeAsync(windowRequest);
    if (!rawTransportResult.ok) {
      return (
        <LiveBlockedState
          status="blocked_live_transport_failed"
          reason={rawTransportResult.error}
        />
      );
    }

    const draftResult = buildEcosLatestDraftCandidate(
      rawTransportResult.rows,
      LIVE_FETCHED_AT,
    );

    if (draftResult.status !== "draft_ready" || draftResult.candidateResult === null) {
      return (
        <LiveBlockedState
          status={draftResult.status}
          reason={draftResult.reason}
        />
      );
    }

    const liveAuthoringResult: ManualFactCardAuthoringResult = draftResult.candidateResult;

    if (!liveAuthoringResult.ok || !liveAuthoringResult.factCard) {
      return (
        <LiveBlockedState
          status="blocked_candidate_validation_failed"
          reason="candidateResult.ok=false 또는 factCard=null — validation 에러를 확인하세요."
        />
      );
    }

    return (
      <PackagePreviewContent
        authoringResult={liveAuthoringResult}
        candidateKey={candidateKey}
        candidateLabel={`기준금리 (ECOS live latest — ${endPeriod})`}
        isLive={true}
        liveProvenance={{
          sourceProviderId: "provider-ecos-live",
          isMock: false,
          isPublishable: false,
          publishedDate: draftResult.verifiedPublishedDate ?? "",
          dataPeriod: liveAuthoringResult.factCard.dataPeriod,
        }}
      />
    );
  }

  // ── Registry-based candidates (mock, fixture) ───────────────────────────────
  const candidateEntry = candidateKey ? (CANDIDATE_REGISTRY[candidateKey] ?? null) : null;

  // Unknown ?candidate= key → explicit error instead of silent fallback
  if (candidateKey !== null && candidateEntry === null) {
    return (
      <ErrorState
        message={`?candidate=${candidateKey}는 등록된 후보가 없습니다. 등록된 키: ${Object.keys(CANDIDATE_REGISTRY).join(", ")} 또는 ecos-live-latest`}
      />
    );
  }

  // Resolve which authoring result to use
  const authoringResult = candidateEntry?.result ?? validHouseholdDebtResult;
  const candidateLabel = candidateEntry?.label ?? null;

  // Guard: valid FactCard must exist
  if (!authoringResult.ok || !authoringResult.factCard) {
    const source = candidateKey
      ? `?candidate=${candidateKey} 후보`
      : "validHouseholdDebtResult";
    return (
      <ErrorState message={`${source}의 factCard가 없습니다. validation 에러를 확인하세요.`} />
    );
  }

  return (
    <PackagePreviewContent
      authoringResult={authoringResult}
      candidateKey={candidateKey}
      candidateLabel={candidateLabel}
      isLive={false}
      liveProvenance={null}
    />
  );
}

// ── Live provenance metadata ───────────────────────────────────────────────────

interface LiveProvenance {
  sourceProviderId: string;
  isMock: boolean;
  isPublishable: boolean;
  publishedDate: string;
  dataPeriod: string;
}

// ── Main content component (extracted so live/mock paths share rendering) ─────

function PackagePreviewContent({
  authoringResult,
  candidateKey,
  candidateLabel,
  isLive,
  liveProvenance,
}: {
  authoringResult: ManualFactCardAuthoringResult;
  candidateKey: string | null;
  candidateLabel: string | null;
  isLive: boolean;
  liveProvenance: LiveProvenance | null;
}) {
  const factCard = authoringResult.factCard!;

  // ── Assemble pipeline (all deterministic, no external calls) ────────────────
  const pkg = assembleContentPackage(
    factCard,
    {
      videoId: MOCK_VIDEO_ID,
      createdAt: MOCK_CREATED_AT,
    },
    {
      contentPackageId: MOCK_CONTENT_PACKAGE_ID,
      createdAt: MOCK_CREATED_AT,
      measuredAudioDurationSec: MOCK_AUDIO_DURATION_SEC,
    },
  );

  const reviewPacket = generateReviewPacket(pkg, {
    reviewPacketId: MOCK_REVIEW_PACKET_ID,
    createdAt: MOCK_CREATED_AT,
  });

  // live draft candidate: decision=null → blockerCodes=["decision_pending"], canProceedToRender=false
  // default/mock: decision="approved" → local preview approved-gate (existing behavior)
  const gateResult = isLive
    ? evaluateOwnerDecision(
        reviewPacket,
        {
          reviewPacketId: MOCK_REVIEW_PACKET_ID,
          decision: null,
          notes: "draft-only — Owner 결정 대기 중 (isPublishable=false)",
        },
        {
          gateResultId: LIVE_GATE_RESULT_ID,
          createdAt: MOCK_CREATED_AT,
        },
      )
    : evaluateOwnerDecision(
        reviewPacket,
        {
          reviewPacketId: MOCK_REVIEW_PACKET_ID,
          decision: "approved",
          notes: "로컬 preview — mock 승인",
          decidedAt: MOCK_DECIDED_AT,
        },
        {
          gateResultId: MOCK_GATE_RESULT_ID,
          createdAt: MOCK_CREATED_AT,
        },
      );

  const clipboardPayload = buildClipboardPayload(reviewPacket, gateResult, {
    createdAt: MOCK_CREATED_AT,
  });

  const viewInputs = { reviewPacket, gateResult, clipboardPayload };
  const detailModel = buildPackageDetailModel(viewInputs, { createdAt: MOCK_CREATED_AT });
  const workflowStatus = buildPackageWorkflowStatus(viewInputs);
  const copyActionSummary = buildPackageCopyActionSummary(viewInputs);

  const { blueprint, scriptPackage, riskReview, finalQa, timeline } = pkg;
  const primaryScript = scriptPackage.scripts[0];

  const pipelineStatusItems = [
    { label: "Fact Card", ok: true },
    { label: "Blueprint", ok: true },
    { label: "Script Package", ok: true },
    { label: "Risk Review", ok: !riskReview.isBlocked },
    { label: "QA Ready", ok: finalQa.readyForRender },
    { label: "Copy Ready", ok: workflowStatus.copyReady },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--bg-secondary)] border-b border-slate-800/70 px-4 py-3">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-base font-bold text-slate-100 tracking-tight">
                Money Shorts OS — Package Preview
              </h1>
              <p className="text-xs text-slate-500">
                Step 1→6 전체 · Manual Fact Card → Content Package 로컬 미리보기
                {isLive
                  ? " · ECOS live 읽기 (dev-only)"
                  : " · 외부 API 없음"}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/money-shorts"
                className="px-3 py-1.5 rounded-lg border border-slate-700/50 bg-slate-800/30 text-slate-400 text-xs font-semibold hover:bg-slate-800/60 transition-colors"
              >
                ← Workflow Hub
              </Link>
              <span className="px-2 py-1 rounded bg-amber-900/30 border border-amber-700/50 text-amber-300 text-xs font-semibold">
                LOCAL PREVIEW ONLY
              </span>
              <span className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700/50 text-slate-400 text-xs">
                MVP1
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Workflow */}
      <div className="max-w-screen-xl mx-auto">
        <WorkflowSteps activeStep={6} />
      </div>

      {/* Local preview notice */}
      <div className="max-w-screen-xl mx-auto px-4 pt-4">
        {isLive ? (
          <div className="rounded-lg border border-blue-800/40 bg-blue-900/15 px-4 py-3 text-xs text-blue-200">
            <span className="font-bold text-blue-300">ECOS live 읽기 (dev-only)</span>
            {" — "}
            이 화면은 한국은행 ECOS에서 최신 기준금리 데이터를 읽었습니다.{" "}
            <span className="text-blue-300 font-semibold">draft-only</span> 상태이며 실제 publish·render·업로드를 수행하지 않습니다.
            모든 패키지 id/duration은 mock 값입니다. DB·OS 클립보드 호출 없음.
          </div>
        ) : (
          <div className="rounded-lg border border-amber-800/40 bg-amber-900/15 px-4 py-3 text-xs text-amber-200">
            <span className="font-bold text-amber-300">로컬 미리보기 전용</span>
            {" — "}
            이 화면은 실제 publish·render·업로드를 수행하지 않습니다. 모든 id, 날짜, duration은
            deterministic mock 값입니다. 외부 API·DB·OS 클립보드 호출 없음.
          </div>
        )}
      </div>

      {/* Candidate selector */}
      <div className="max-w-screen-xl mx-auto px-4 pt-2">
        <div className="rounded-lg border border-indigo-800/40 bg-indigo-900/10 px-4 py-2.5 flex items-center gap-3 flex-wrap text-xs">
          <span className="text-indigo-400 font-semibold shrink-0">Fact Card 후보 선택</span>
          <Link
            href="/fact-cards/manual/package-preview"
            className={`px-2.5 py-1 rounded border text-xs font-semibold transition-colors ${
              candidateLabel === null
                ? "border-slate-500 bg-slate-700/50 text-slate-200"
                : "border-slate-700/40 bg-slate-800/20 text-slate-400 hover:bg-slate-800/40"
            }`}
          >
            가계부채 (manual fixture)
          </Link>
          <Link
            href="/fact-cards/manual/package-preview?candidate=base-rate"
            className={`px-2.5 py-1 rounded border text-xs font-semibold transition-colors ${
              candidateKey === "base-rate"
                ? "border-indigo-500 bg-indigo-900/40 text-indigo-200"
                : "border-slate-700/40 bg-slate-800/20 text-slate-400 hover:bg-slate-800/40"
            }`}
          >
            기준금리 (ECOS mock generated)
          </Link>
          <Link
            href="/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606"
            prefetch={false}
            className={`px-2.5 py-1 rounded border text-xs font-semibold transition-colors ${
              candidateKey === "ecos-live-latest"
                ? "border-blue-500 bg-blue-900/40 text-blue-200"
                : "border-slate-700/40 bg-slate-800/20 text-slate-400 hover:bg-slate-800/40"
            }`}
          >
            기준금리 (ECOS live latest)
          </Link>
          {candidateLabel && (
            <span className="ml-auto text-indigo-300 font-mono">
              ← {candidateLabel}
            </span>
          )}
        </div>
      </div>

      {/* Nav links */}
      <div className="max-w-screen-xl mx-auto px-4 pt-3 flex gap-3 flex-wrap">
        <Link
          href="/fact-cards/manual"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/60 text-slate-400 text-xs hover:bg-slate-800/60 transition-colors"
        >
          ← Fact Card 작성 (Step 1)
        </Link>
        <Link
          href="/packages"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/60 text-slate-400 text-xs hover:bg-slate-800/60 transition-colors"
        >
          패키지 라이브러리 →
        </Link>
      </div>

      <main className="max-w-screen-xl mx-auto px-4 py-5 space-y-5">
        {/* ① Workflow status bar */}
        <SectionCard
          title="파이프라인 상태"
          subtitle={`contentPackageId: ${detailModel.contentPackageId}`}
          color="indigo"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {pipelineStatusItems.map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-800/50 bg-slate-900/40 px-2 py-3 text-center"
              >
                <StatusPill ok={item.ok} />
                <span className="text-xs text-slate-400 leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Live provenance card — only shown for ecos-live-latest */}
        {isLive && liveProvenance && (
          <SectionCard
            title="ECOS Live Draft Candidate — Source-Date Provenance"
            subtitle="provider-ecos-live · isMock=false · isPublishable=false"
            color="indigo"
          >
            <FieldRow label="sourceProviderId" value={liveProvenance.sourceProviderId} mono />
            <FieldRow label="isMock" value={String(liveProvenance.isMock)} mono />
            <FieldRow label="isPublishable" value={String(liveProvenance.isPublishable)} mono />
            <FieldRow label="publishedDate" value={liveProvenance.publishedDate} mono />
            <FieldRow label="dataPeriod" value={liveProvenance.dataPeriod} mono />
            <div className="mt-2 text-xs text-blue-300 border border-blue-800/30 bg-blue-900/10 rounded px-3 py-2">
              publishedDate는 ECOS period에서 유도된 날짜가 아닙니다.
              공식 BOK 통화정책방향 결정회의 이력에서 value matching으로 검증된 결정일입니다.
            </div>
          </SectionCard>
        )}

        {/* ② Fact Card summary + source linkage */}
        <SectionCard
          title="① Fact Card — 출처 기반 수치"
          subtitle={
            isLive
              ? `ECOS live latest (provider-ecos-live) — draft-only`
              : candidateKey === "base-rate"
                ? "generatedBaseRateResult.factCard (ECOS mock)"
                : "validHouseholdDebtResult.factCard (manual fixture)"
          }
          color="emerald"
        >
          <FieldRow label="indicatorName" value={factCard.indicatorName} />
          <FieldRow label="dataPeriod" value={factCard.dataPeriod} />
          <FieldRow label="currentValue" value={factCard.currentValue} />
          <FieldRow label="changeValue" value={factCard.changeValue} />
          <FieldRow label="changeRate" value={factCard.changeRate} />
          <FieldRow label="interpretation" value={factCard.interpretation} />
          <FieldRow label="cautionNote" value={factCard.cautionNote} />
          <FieldRow label="isMock" value={String(factCard.isMock)} mono />
          <FieldRow label="isPublishable" value={String(factCard.isPublishable)} mono />

          <SectionLabel>출처 / Citation 링크</SectionLabel>
          <div>
            {reviewPacket.sourceRefs.map((ref) => (
              <div
                key={ref.citationId}
                className="rounded-lg border border-indigo-800/30 bg-indigo-900/10 px-3 py-2.5 mb-2 last:mb-0"
              >
                <div className="text-xs font-bold text-indigo-300 mb-1">{ref.sourceName}</div>
                <FieldRow label="citationId" value={ref.citationId} mono />
                <FieldRow label="sourceUrl" value={ref.sourceUrl} mono />
                <FieldRow label="publishedDate" value={ref.publishedDate} mono />
              </div>
            ))}
          </div>

          <SectionLabel>허용 Claim ({factCard.allowedClaims.length}건)</SectionLabel>
          <ul className="space-y-1">
            {factCard.allowedClaims.map((claim, i) => (
              <li key={i} className="flex gap-2 text-xs">
                <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                <span className="text-slate-200">{claim}</span>
              </li>
            ))}
          </ul>

          <SectionLabel>차단 Claim ({factCard.blockedClaims.length}건)</SectionLabel>
          <ul className="space-y-1">
            {factCard.blockedClaims.map((claim, i) => (
              <li key={i} className="flex gap-2 text-xs">
                <span className="text-red-500 shrink-0 mt-0.5">✗</span>
                <span className="text-slate-300">{claim}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* ③ Blueprint */}
        <SectionCard
          title="② Video Blueprint"
          subtitle={`blueprintVideoId: ${blueprint.videoId}`}
          color="indigo"
        >
          <FieldRow label="blueprintVideoId" value={blueprint.videoId} mono />
          <FieldRow label="templateKey" value={blueprint.templateKey} mono />
          <FieldRow label="targetDurationSec" value={`${blueprint.targetDurationSec}s`} mono />
          <FieldRow label="estimatedDurationSec" value={`${blueprint.estimatedDurationSec}s`} mono />
          <FieldRow label="sceneCount" value={`${blueprint.scenes.length}씬`} mono />
          <FieldRow label="factCardIds" value={blueprint.factCardIds.join(", ")} mono />
          <FieldRow label="sourceCitationIds" value={blueprint.sourceCitationIds.join(", ")} mono />

          <SectionLabel>씬 목록</SectionLabel>
          <div className="space-y-1">
            {blueprint.scenes.map((scene) => (
              <div
                key={scene.sceneId}
                className="flex gap-3 py-1.5 border-b border-slate-800/30 last:border-0 items-start"
              >
                <span className="font-mono text-xs text-slate-600 w-5 shrink-0 pt-0.5">
                  {scene.sceneIndex}
                </span>
                <span className="font-mono text-xs text-indigo-400 w-28 shrink-0">{scene.sceneRole}</span>
                <span className="text-xs text-slate-300 min-w-0 break-all">{scene.caption}</span>
                <span className="font-mono text-xs text-slate-600 shrink-0 ml-auto">
                  {scene.estimatedDuration}s
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ④ Script package */}
        <SectionCard
          title="③ Script Package"
          subtitle={`packageId: ${scriptPackage.packageId}`}
          color="slate"
        >
          <FieldRow label="packageId" value={scriptPackage.packageId} mono />
          <FieldRow label="title" value={scriptPackage.title} />
          <FieldRow label="topic" value={scriptPackage.topic} />
          <FieldRow label="coreMessage" value={scriptPackage.coreMessage} />
          <FieldRow label="youtubeTitle" value={scriptPackage.youtubeTitle} />
          <FieldRow
            label="instagramCaption"
            value={
              <span className="break-all whitespace-pre-wrap text-xs">
                {scriptPackage.instagramCaption}
              </span>
            }
          />
          <FieldRow
            label="hashtags"
            value={scriptPackage.hashtags.join(" ")}
          />
          {scriptPackage.moneyOsCta && (
            <FieldRow label="moneyOsCta" value={scriptPackage.moneyOsCta} />
          )}

          {primaryScript && (
            <div>
              <SectionLabel>대본 ({primaryScript.targetDurationSec}s · {primaryScript.scenes.length}씬)</SectionLabel>
              <div className="rounded-lg border border-slate-700/40 bg-slate-900/50 px-3 py-2 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap break-all">
                {primaryScript.fullNarration}
              </div>
              <SectionLabel>씬별 자막 ({primaryScript.scenes.length}건)</SectionLabel>
              <div className="space-y-1">
                {primaryScript.scenes.map((sc) => (
                  <div
                    key={String(sc.sceneIndex)}
                    className="flex gap-3 py-1.5 border-b border-slate-800/30 last:border-0 items-start"
                  >
                    <span className="font-mono text-xs text-slate-600 w-5 shrink-0">{sc.sceneIndex}</span>
                    <span className="text-xs text-slate-300 min-w-0 break-all">{sc.captionText}</span>
                    <span className="font-mono text-xs text-slate-600 shrink-0 ml-auto">{sc.durationSec}s</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {/* ⑤ Risk Review */}
        <SectionCard
          title="④ Risk Review"
          subtitle={`riskReviewId: ${riskReview.riskReviewId ?? "—"}`}
          color={riskReview.isBlocked ? "red" : "emerald"}
        >
          <FieldRow
            label="overallRiskLevel"
            value={<RiskLevelBadge level={riskReview.overallRiskLevel} />}
          />
          <FieldRow
            label="isBlocked"
            value={<StatusPill ok={!riskReview.isBlocked} trueLabel="NOT BLOCKED" falseLabel="BLOCKED" />}
          />
          <FieldRow label="findings" value={`${riskReview.findings.length}건`} mono />
          {riskReview.findings.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {riskReview.findings.map((f, i) => (
                <div
                  key={i}
                  className="rounded border border-amber-800/30 bg-amber-900/10 px-3 py-2 text-xs"
                >
                  <span className="font-mono text-amber-300 mr-2">{f.code}</span>
                  <span className="text-slate-300">{f.message ?? ""}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* ⑥ Timeline */}
        <SectionCard
          title="⑤ Timeline"
          subtitle={`timelineId: ${timeline.timelineId}`}
          color="slate"
        >
          <FieldRow label="timelineId" value={timeline.timelineId} mono />
          <FieldRow label="targetDurationSec" value={`${timeline.targetDurationSec}s`} mono />
          <FieldRow label="measuredAudioDurationSec" value={`${timeline.measuredAudioDurationSec}s (mock)`} mono />
          <FieldRow label="estimatedDurationSec" value={`${timeline.estimatedDurationSec}s`} mono />
          <FieldRow label="sceneCount" value={`${timeline.scenes.length}씬`} mono />
          <FieldRow label="measuredAudioDurationSource" value={timeline.measuredAudioDurationSource} mono />
        </SectionCard>

        {/* ⑦ Final QA */}
        <SectionCard
          title="⑥ Final QA"
          subtitle={`qaRunId: ${finalQa.qaRunId}`}
          color={finalQa.readyForRender ? "emerald" : "red"}
        >
          <FieldRow
            label="readyForRender"
            value={<StatusPill ok={finalQa.readyForRender} trueLabel="READY" falseLabel="NOT READY" />}
          />
          <FieldRow
            label="isRiskBlocked"
            value={<StatusPill ok={!finalQa.isRiskBlocked} trueLabel="NOT BLOCKED" falseLabel="BLOCKED" />}
          />
          <FieldRow label="total checks" value={`${finalQa.summary.total}건`} mono />
          <FieldRow label="passed" value={`${finalQa.summary.passed}건`} mono />
          <FieldRow label="failed" value={`${finalQa.summary.failed}건`} mono />
          <FieldRow label="blockers failed" value={`${finalQa.summary.blockersFailed}건`} mono />
          {finalQa.summary.failed > 0 && (
            <>
              <SectionLabel>실패한 체크</SectionLabel>
              <div className="space-y-1">
                {finalQa.checks
                  .filter((c) => !c.passed)
                  .map((c, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className="font-mono text-red-400 shrink-0 bg-red-900/20 px-1.5 py-0.5 rounded">
                        {c.code ?? "?"}
                      </span>
                      <span className="text-slate-400">{c.description}</span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </SectionCard>

        {/* ⑧ Publishability Readiness */}
        <SectionCard
          title="⑧ Publishability Readiness"
          subtitle="draft-only 상태 및 render/copy 차단 원인 요약"
          color={
            !factCard.isPublishable || gateResult.blockerCodes.includes("fact_card_not_publishable")
              ? "red"
              : gateResult.canProceedToRender && clipboardPayload.copyReady
                ? "emerald"
                : "amber"
          }
        >
          {/* 상단 요약 배너 */}
          {!factCard.isPublishable && (
            <div className="mb-3 rounded border border-red-700/50 bg-red-900/15 px-3 py-2.5 text-xs text-red-200">
              <div className="font-bold text-red-300 mb-1">이 패키지는 현재 draft-only 상태입니다</div>
              <ul className="space-y-0.5 text-red-200/80">
                <li>• <span className="font-semibold text-red-300">isPublishable=false</span> — Fact Card가 publishable 상태가 아닙니다.</li>
                <li>• Owner 승인만으로는 render/copy 경로가 열리지 않습니다.</li>
                <li>• <span className="font-mono text-red-300">fact_card_not_publishable</span> blocker가 해제되어야만 다음 단계로 진행할 수 있습니다.</li>
                <li>• 이 화면에서 isPublishable 전환, render, export, 클립보드 복사를 수행하지 않습니다.</li>
              </ul>
            </div>
          )}

          {/* Fact Card 발행 가능 여부 */}
          <SectionLabel>Fact Card 발행 가능 여부</SectionLabel>
          <FieldRow
            label="factCard.isMock"
            value={<StatusPill ok={!factCard.isMock} trueLabel="실데이터" falseLabel="MOCK" />}
          />
          <FieldRow
            label="factCard.isPublishable"
            value={<StatusPill ok={factCard.isPublishable} trueLabel="PUBLISHABLE" falseLabel="NOT PUBLISHABLE" />}
          />
          <FieldRow
            label="reviewPacket.factCard.isPublishable"
            value={<StatusPill ok={reviewPacket.factCard.isPublishable} trueLabel="PUBLISHABLE" falseLabel="NOT PUBLISHABLE" />}
          />

          {/* 출처 현황 */}
          <SectionLabel>출처 / Citation 현황</SectionLabel>
          <FieldRow
            label="citation 수"
            value={
              <span className={`font-mono text-xs ${reviewPacket.sourceRefs.length > 0 ? "text-emerald-300" : "text-red-300"}`}>
                {reviewPacket.sourceRefs.length}건
              </span>
            }
          />
          <FieldRow
            label="citationIds"
            value={
              reviewPacket.sourceRefs.length === 0
                ? <span className="text-red-400 text-xs">없음</span>
                : reviewPacket.sourceRefs.map((ref) => (
                    <span
                      key={ref.citationId}
                      className="inline-block mr-1 px-1.5 py-0.5 rounded font-mono text-xs bg-indigo-900/20 text-indigo-300 border border-indigo-700/30"
                    >
                      {ref.citationId}
                    </span>
                  ))
            }
          />

          {/* Gate 차단 현황 */}
          <SectionLabel>Owner Decision Gate 차단 현황</SectionLabel>
          <FieldRow
            label="gateResult.blockerCodes"
            value={
              gateResult.blockerCodes.length === 0
                ? <span className="text-emerald-400 text-xs">없음</span>
                : gateResult.blockerCodes.map((c) => (
                    <span
                      key={c}
                      className="inline-block mr-1 px-1.5 py-0.5 rounded font-mono text-xs bg-red-900/20 text-red-300 border border-red-700/30"
                    >
                      {c}
                    </span>
                  ))
            }
          />
          <FieldRow
            label="gateResult.canProceedToRender"
            value={
              <StatusPill
                ok={gateResult.canProceedToRender}
                trueLabel="CAN PROCEED"
                falseLabel="BLOCKED"
              />
            }
          />

          {/* Clipboard / Copy 준비 상태 */}
          <SectionLabel>Clipboard / Copy 준비 상태</SectionLabel>
          <FieldRow
            label="clipboardPayload.copyReady"
            value={<StatusPill ok={clipboardPayload.copyReady} trueLabel="READY" falseLabel="NOT READY" />}
          />

          {/* QA / Render 준비 상태 */}
          <SectionLabel>QA / Render 준비 상태</SectionLabel>
          <FieldRow
            label="finalQa.readyForRender"
            value={<StatusPill ok={finalQa.readyForRender} trueLabel="READY" falseLabel="NOT READY" />}
          />
          <FieldRow
            label="riskReview.isBlocked"
            value={<StatusPill ok={!riskReview.isBlocked} trueLabel="NOT BLOCKED" falseLabel="BLOCKED" />}
          />

          {/* 종합 readiness 판정 */}
          <SectionLabel>종합 Readiness 판정</SectionLabel>
          <div className="rounded border border-slate-700/40 bg-slate-900/50 px-3 py-2.5 text-xs space-y-1.5">
            {[
              {
                label: "isPublishable",
                ok: factCard.isPublishable,
                reason: factCard.isPublishable ? null : "Fact Card isPublishable=false — 발행 불가",
              },
              {
                label: "canProceedToRender",
                ok: gateResult.canProceedToRender,
                reason: gateResult.canProceedToRender
                  ? null
                  : `blockerCodes: [${gateResult.blockerCodes.join(", ")}]`,
              },
              {
                label: "copyReady",
                ok: clipboardPayload.copyReady,
                reason: clipboardPayload.copyReady
                  ? null
                  : `gate 차단 상태 — copyReady=false`,
              },
              {
                label: "readyForRender",
                ok: finalQa.readyForRender,
                reason: finalQa.readyForRender ? null : "QA readyForRender=false",
              },
              {
                label: "riskNotBlocked",
                ok: !riskReview.isBlocked,
                reason: riskReview.isBlocked ? "Risk Review isBlocked=true" : null,
              },
            ].map(({ label, ok, reason }) => (
              <div key={label} className="flex items-start gap-2">
                <StatusPill ok={ok} trueLabel="OK" falseLabel="BLOCKED" />
                <span className="font-mono text-slate-400">{label}</span>
                {reason && <span className="text-red-300/80 text-xs ml-auto text-right">{reason}</span>}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ⑨ Review Packet */}
        <SectionCard
          title="⑨ Review Packet"
          subtitle={`reviewPacketId: ${reviewPacket.reviewPacketId}`}
          color="indigo"
        >
          <FieldRow label="reviewPacketId" value={reviewPacket.reviewPacketId} mono />
          <FieldRow label="contentPackageId" value={reviewPacket.contentPackageId} mono />
          <FieldRow label="needsOwnerApproval" value={String(reviewPacket.needsOwnerApproval)} mono />
          <FieldRow label="ownerDecision" value={reviewPacket.ownerDecision ?? "null (pending)"} mono />

          <SectionLabel>ID Linkage</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <IdChip label="blueprintVideoId" value={reviewPacket.blueprintVideoId} />
            <IdChip label="scriptPackageId" value={reviewPacket.scriptPackageId} />
            <IdChip label="chartCardPackageId" value={reviewPacket.chartCardPackageId} />
            <IdChip label="imagePromptPackageId" value={reviewPacket.imagePromptPackageId} />
            <IdChip label="voiceProfileId" value={reviewPacket.voiceProfileId} />
            <IdChip label="ttsPackageId" value={reviewPacket.ttsPackageId} />
            <IdChip label="timelineId" value={reviewPacket.timelineId} />
            <IdChip label="renderManifestId" value={reviewPacket.renderManifestId} />
          </div>
        </SectionCard>

        {/* ⑩ Owner Gate */}
        <SectionCard
          title="⑩ Owner Decision Gate"
          subtitle={`gateResultId: ${gateResult.gateResultId}`}
          color={gateResult.canProceedToRender ? "emerald" : "red"}
        >
          <FieldRow label="gateResultId" value={gateResult.gateResultId} mono />
          <FieldRow label="ownerDecision" value={gateResult.ownerDecision ?? "null"} mono />
          <FieldRow label="ownerNotes" value={gateResult.ownerNotes ?? "—"} />
          <FieldRow
            label="canProceedToRender"
            value={
              <StatusPill
                ok={gateResult.canProceedToRender}
                trueLabel="CAN PROCEED"
                falseLabel="BLOCKED"
              />
            }
          />
          <FieldRow
            label="blockerCodes"
            value={
              gateResult.blockerCodes.length === 0
                ? <span className="text-emerald-400 text-xs">없음</span>
                : gateResult.blockerCodes.map((c) => (
                    <span
                      key={c}
                      className="inline-block mr-1 px-1.5 py-0.5 rounded font-mono text-xs bg-red-900/20 text-red-300 border border-red-700/30"
                    >
                      {c}
                    </span>
                  ))
            }
          />
          {gateResult.blockerCodes.includes("fact_card_not_publishable") && (
            <div className="mt-2 text-xs text-red-300 border border-red-800/30 bg-red-900/10 rounded px-3 py-2">
              <span className="font-semibold">fact_card_not_publishable</span> — Fact Card의 isPublishable=false입니다. Owner 승인과 무관하게 render/copy 경로가 차단됩니다. Fact Card를 publishable 상태로 전환해야 이 blocker가 해제됩니다.
            </div>
          )}
          {isLive ? (
            <div className="mt-2 text-xs text-blue-300 border border-blue-800/30 bg-blue-900/10 rounded px-3 py-2">
              draft-only 후보 — decision=null (pending). isPublishable=false이므로 Owner 결정 전까지 gate가 차단됩니다. 실제 승인 UI가 없습니다.
            </div>
          ) : (
            <div className="mt-2 text-xs text-amber-300 border border-amber-800/30 bg-amber-900/10 rounded px-3 py-2">
              로컬 preview: decision=&quot;approved&quot; mock 값 사용 — 실제 Owner 승인이 아닙니다. Fact Card isPublishable=false이므로 gate는 계속 차단 상태입니다.
            </div>
          )}
        </SectionCard>

        {/* ⑪ Clipboard payload */}
        <SectionCard
          title="⑪ Clipboard Payload 준비 상태"
          subtitle={`clipboardPayloadId: ${clipboardPayload.clipboardPayloadId}`}
          color={clipboardPayload.copyReady ? "emerald" : "amber"}
        >
          <FieldRow
            label="copyReady"
            value={<StatusPill ok={clipboardPayload.copyReady} trueLabel="READY" falseLabel="NOT READY" />}
          />
          <FieldRow
            label="blockerCodes"
            value={
              clipboardPayload.blockerCodes.length === 0
                ? <span className="text-emerald-400 text-xs">없음</span>
                : clipboardPayload.blockerCodes.join(", ")
            }
            mono
          />
          <FieldRow label="sections" value={clipboardPayload.sections ? "생성됨" : "null (not ready)"} mono />
          <FieldRow
            label="qaRiskWarning.readyForRender"
            value={<StatusPill ok={clipboardPayload.qaRiskWarning.readyForRender} />}
          />
          <FieldRow
            label="qaRiskWarning.overallRiskLevel"
            value={<RiskLevelBadge level={clipboardPayload.qaRiskWarning.overallRiskLevel} />}
          />
          {clipboardPayload.sections && (
            <>
              <SectionLabel>복사 가능 섹션 미리보기</SectionLabel>
              <div className="space-y-2">
                <div key="clipboard-youtube" className="rounded border border-slate-700/40 bg-slate-900/50 px-3 py-2 text-xs">
                  <div className="text-slate-500 mb-1">youtubeTitle</div>
                  <div className="text-slate-200">{clipboardPayload.sections.youtubeTitle}</div>
                </div>
                <div key="clipboard-instagram" className="rounded border border-slate-700/40 bg-slate-900/50 px-3 py-2 text-xs">
                  <div className="text-slate-500 mb-1">instagramCaption</div>
                  <div className="text-slate-200 whitespace-pre-wrap break-all">
                    {clipboardPayload.sections.instagramCaption}
                  </div>
                </div>
                <div key="clipboard-hashtags" className="rounded border border-slate-700/40 bg-slate-900/50 px-3 py-2 text-xs">
                  <div className="text-slate-500 mb-1">hashtags</div>
                  <div className="text-slate-200">{clipboardPayload.sections.hashtagsText}</div>
                </div>
                {clipboardPayload.sections.sourceRefs.map((ref) => (
                  <div
                    key={ref.citationId}
                    className="rounded border border-indigo-800/30 bg-indigo-900/10 px-3 py-2 text-xs"
                  >
                    <div className="text-slate-500 mb-1">출처 attribution</div>
                    <div className="text-slate-300 break-all">{ref.attributionLine}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>

        {/* ⑫ Chart Card Package */}
        <SectionCard
          title="⑫ Chart Card Package"
          subtitle={`packageId: ${pkg.chartCardPackage.packageId}`}
          color="indigo"
        >
          <FieldRow label="packageId" value={pkg.chartCardPackage.packageId} mono />
          <FieldRow label="factCardId" value={pkg.chartCardPackage.factCardId} mono />
          <FieldRow label="blueprintVideoId" value={pkg.chartCardPackage.blueprintVideoId ?? "null"} mono />
          <FieldRow label="riskLevel" value={pkg.chartCardPackage.riskLevel} mono />
          <FieldRow label="card count" value={`${pkg.chartCardPackage.cards.length}장`} mono />
          <FieldRow
            label="sourceCitationIds"
            value={
              <span className="text-xs text-slate-400 font-mono break-all">
                {pkg.chartCardPackage.sourceCitationIds.join(", ")}
              </span>
            }
          />
          <SectionLabel>9:16 Visual Preview — CSS only</SectionLabel>
          <div className="mb-1 text-[10px] text-slate-600 italic">
            실제 영상이 아닙니다 · canvas/ffmpeg 없음 · props 시각화 전용
          </div>
          <div className="flex flex-wrap gap-3 pb-2">
            {pkg.chartCardPackage.cards.map((card) => (
              <div key={`visual-${card.cardId}`} className="flex flex-col items-center gap-1">
                <ChartCardVisualPreview card={card} />
                <span className="text-[9px] text-slate-600 font-mono">{card.cardType}</span>
              </div>
            ))}
          </div>

          <SectionLabel>카드 상세</SectionLabel>
          <div className="space-y-3">
            {pkg.chartCardPackage.cards.map((card) => (
              <div
                key={card.cardId}
                className="rounded border border-slate-700/40 bg-slate-900/50 px-3 py-3 text-xs space-y-1"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-1.5 py-0.5 rounded bg-indigo-900/40 border border-indigo-700/40 text-indigo-300 font-mono text-xs font-semibold">
                    {card.cardType}
                  </span>
                  <span className="text-slate-500 font-mono">{card.cardId}</span>
                  <span className="text-slate-600 font-mono ml-auto">
                    {card.dimensions.widthPx}×{card.dimensions.heightPx}
                  </span>
                </div>
                {card.cardType === "number_card" && (
                  <>
                    <FieldRow label="title" value={card.title} />
                    <FieldRow label="value" value={card.value} mono />
                    <FieldRow label="unit" value={card.unit} mono />
                    <FieldRow label="previousValue" value={card.previousValue ?? "—"} mono />
                    <FieldRow label="changeValue" value={card.changeValue ?? "—"} mono />
                    <FieldRow label="changeRate" value={card.changeRate ?? "—"} mono />
                    <FieldRow label="interpretationNote" value={card.interpretationNote} />
                    <FieldRow label="riskLevel" value={card.riskLevel} mono />
                  </>
                )}
                {card.cardType === "comparison_card" && (
                  <>
                    <FieldRow label="title" value={card.title} />
                    <FieldRow label="labelLeft / valueLeft" value={`${card.labelLeft} / ${card.valueLeft}`} mono />
                    <FieldRow label="labelRight / valueRight" value={`${card.labelRight} / ${card.valueRight}`} mono />
                    <FieldRow label="direction" value={card.direction ?? "null"} mono />
                    <FieldRow label="changeLabel" value={card.changeLabel} mono />
                    <FieldRow label="unit" value={card.unit} mono />
                  </>
                )}
                {card.cardType === "source_card" && (
                  <>
                    <FieldRow label="sourceName" value={card.sourceName} />
                    <FieldRow label="publishedDate" value={card.publishedDate} mono />
                    <FieldRow label="dataPeriod" value={card.dataPeriod ?? "—"} mono />
                    <FieldRow label="factCardId" value={card.factCardId} mono />
                    <FieldRow
                      label="sourceCitationIds"
                      value={
                        <span className="text-xs text-slate-400 font-mono break-all">
                          {card.sourceCitationIds.join(", ")}
                        </span>
                      }
                    />
                  </>
                )}
                {card.cardType === "cta_card" && (
                  <>
                    <FieldRow label="ctaText" value={card.ctaText} />
                    <FieldRow label="subText" value={card.subText ?? "—"} />
                  </>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ⑬ Package view summary */}
        <SectionCard
          title="⑬ Package View Summary"
          subtitle="buildPackageDetailModel 출력 요약"
          color="slate"
        >
          <FieldRow label="gateStatus" value={detailModel.gateStatus} mono />
          <FieldRow
            label="canProceedToRender"
            value={
              <StatusPill
                ok={detailModel.canProceedToRender}
                trueLabel="CAN PROCEED"
                falseLabel="BLOCKED"
              />
            }
          />
          <FieldRow
            label="copyReady"
            value={<StatusPill ok={detailModel.copyReady} trueLabel="READY" falseLabel="NOT READY" />}
          />
          <FieldRow label="copyActionSummary" value={copyActionSummary.copyReady ? "copyReady=true" : `blockers: ${copyActionSummary.blockerLabels.join(", ")}`} />
          <FieldRow label="sceneCount" value={`${detailModel.counts.scenes}씬`} mono />
          <FieldRow label="scriptVariants" value={`${detailModel.counts.scripts}개`} mono />
          <FieldRow label="sources" value={`${detailModel.counts.sources}건`} mono />
          <FieldRow label="hashtags" value={`${detailModel.counts.hashtags}개`} mono />
        </SectionCard>

        {/* Footer nav */}
        <div className="flex gap-3 flex-wrap pb-8">
          <Link
            href="/fact-cards/manual"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-700/60 text-slate-300 text-sm hover:bg-slate-800/60 transition-colors"
          >
            ← Fact Card 작성으로
          </Link>
          <Link
            href="/packages"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-indigo-700/50 text-indigo-300 text-sm hover:bg-indigo-900/30 transition-colors"
          >
            패키지 라이브러리 →
          </Link>
        </div>
      </main>
    </div>
  );
}
