import Link from "next/link";
import { validHouseholdDebtResult } from "@/lib/source-facts/manual-fixtures";
import { assembleContentPackage } from "@/lib/content-package/assembler";
import { generateReviewPacket } from "@/lib/review-packet/generator";
import { evaluateOwnerDecision } from "@/lib/owner-decision/gate";
import { buildClipboardPayload } from "@/lib/clipboard-payload/builder";
import {
  buildPackageDetailModel,
  buildPackageWorkflowStatus,
  buildPackageCopyActionSummary,
} from "@/lib/package-view/builder";

// ── Deterministic constants ────────────────────────────────────────────────────
const MOCK_VIDEO_ID = "video-manual-household-debt-preview-001";
const MOCK_CONTENT_PACKAGE_ID = "cp-manual-household-debt-preview-001";
const MOCK_CREATED_AT = "2026-06-25T09:00:00+09:00";
const MOCK_AUDIO_DURATION_SEC = 42.0;
const MOCK_REVIEW_PACKET_ID = "rp-manual-household-debt-preview-001";
const MOCK_GATE_RESULT_ID = "gate-manual-household-debt-preview-001";
const MOCK_DECIDED_AT = "2026-06-25T09:05:00+09:00";

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

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PackagePreviewPage() {
  // Guard: valid FactCard must exist
  if (!validHouseholdDebtResult.ok || !validHouseholdDebtResult.factCard) {
    return (
      <ErrorState message="validHouseholdDebtResult.factCard가 없습니다. manual-fixtures.ts를 확인하세요." />
    );
  }

  const factCard = validHouseholdDebtResult.factCard;

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

  const gateResult = evaluateOwnerDecision(
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
                Step 1→6 전체 · Manual Fact Card → Content Package 로컬 미리보기 · 외부 API 없음
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
        <div className="rounded-lg border border-amber-800/40 bg-amber-900/15 px-4 py-3 text-xs text-amber-200">
          <span className="font-bold text-amber-300">로컬 미리보기 전용</span>
          {" — "}
          이 화면은 실제 publish·render·업로드를 수행하지 않습니다. 모든 id, 날짜, duration은
          deterministic mock 값입니다. 외부 API·DB·OS 클립보드 호출 없음.
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

        {/* ② Fact Card summary + source linkage */}
        <SectionCard
          title="① Fact Card — 출처 기반 수치"
          subtitle="validHouseholdDebtResult.factCard (manual fixture)"
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

        {/* ⑧ Review Packet */}
        <SectionCard
          title="⑦ Review Packet"
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

        {/* ⑨ Owner Gate */}
        <SectionCard
          title="⑧ Owner Decision Gate"
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
          <div className="mt-2 text-xs text-amber-300 border border-amber-800/30 bg-amber-900/10 rounded px-3 py-2">
            로컬 preview: decision=&quot;approved&quot; mock 값 사용 — 실제 Owner 승인이 아닙니다.
          </div>
        </SectionCard>

        {/* ⑩ Clipboard payload */}
        <SectionCard
          title="⑨ Clipboard Payload 준비 상태"
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

        {/* ⑪ Package view summary */}
        <SectionCard
          title="⑩ Package View Summary"
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
