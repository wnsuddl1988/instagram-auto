import Link from "next/link";
import type {
  PackageListItem,
  PackageDetailModel,
  PackageCopyActionSummary,
  PackageWorkflowStatus,
  PackageGateStatus,
} from "@/lib/package-view/types";
import type { PackageEntry } from "./page";

// ─── Status config ────────────────────────────────────────────────────────────

const GATE_STATUS_CONFIG: Record<
  PackageGateStatus,
  { label: string; color: string; dot: string }
> = {
  approved: {
    label: "승인",
    color: "text-emerald-400 bg-emerald-900/30 border-emerald-700/50",
    dot: "bg-emerald-400",
  },
  pending: {
    label: "대기",
    color: "text-amber-400 bg-amber-900/30 border-amber-700/50",
    dot: "bg-amber-400",
  },
  rejected: {
    label: "반려",
    color: "text-red-400 bg-red-900/30 border-red-700/50",
    dot: "bg-red-400",
  },
  revision_requested: {
    label: "수정 요청",
    color: "text-orange-400 bg-orange-900/30 border-orange-700/50",
    dot: "bg-orange-400",
  },
  approved_but_blocked: {
    label: "승인·차단",
    color: "text-rose-400 bg-rose-900/30 border-rose-700/50",
    dot: "bg-rose-400",
  },
};

// ─── Utility ──────────────────────────────────────────────────────────────────

function GateBadge({ status }: { status: PackageGateStatus }) {
  const cfg = GATE_STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${cfg.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function CopyReadyBadge({ ready }: { ready: boolean }) {
  return ready ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-emerald-700/50 bg-emerald-900/30 text-emerald-300 text-xs font-semibold">
      복사 가능
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-600/50 bg-slate-800/50 text-slate-400 text-xs font-semibold">
      복사 불가
    </span>
  );
}

function BlockerList({ labels }: { labels: string[] }) {
  if (labels.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {labels.map((label) => (
        <span
          key={label}
          className="px-1.5 py-0.5 rounded text-xs bg-rose-900/40 border border-rose-700/40 text-rose-300 font-medium"
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 mt-4 first:mt-0">
      {children}
    </h3>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="mb-2">
      <div className="text-xs text-slate-500 mb-0.5">{label}</div>
      <div
        className={`text-sm text-slate-200 break-all ${mono ? "font-mono text-xs text-slate-300" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Package List Row (Link-based) ────────────────────────────────────────────

function PackageListRow({
  item,
  index,
  selected,
}: {
  item: PackageListItem;
  index: number;
  selected: boolean;
}) {
  return (
    <Link
      href={`/packages?selected=${index}`}
      className={`block w-full text-left px-4 py-3 border-b border-slate-800/60 transition-colors hover:bg-slate-800/40 ${
        selected ? "bg-slate-800/60 border-l-2 border-l-indigo-500" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <GateBadge status={item.gateStatus} />
          <CopyReadyBadge ready={item.copyReady} />
          {item.riskBlocked && (
            <span className="text-xs text-rose-400 font-semibold">위험 차단</span>
          )}
        </div>
        <span className="text-xs text-slate-500 shrink-0">
          {item.createdAt ? item.createdAt.slice(0, 10) : "—"}
        </span>
      </div>

      <div className="font-semibold text-slate-100 text-sm leading-snug mb-0.5">
        {item.title}
      </div>
      <div className="text-xs text-slate-400 line-clamp-1 mb-1">{item.coreMessage}</div>

      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
        <span className="text-indigo-400 font-medium">{item.topic}</span>
        <span>{item.indicatorName}</span>
        <span className="font-mono">{item.currentValue}</span>
        <span>{item.dataPeriod}</span>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
        <span>{item.counts.scenes}씬</span>
        <span>{item.counts.scripts}대본</span>
        <span>{item.counts.sources}출처</span>
        <span>#{item.counts.hashtags}</span>
        <span className="ml-auto truncate text-right">{item.primarySourceName}</span>
      </div>
    </Link>
  );
}

// ─── Workflow Status Bar ──────────────────────────────────────────────────────

function WorkflowStatusBar({ ws }: { ws: PackageWorkflowStatus }) {
  const steps: { label: string; done: boolean }[] = [
    { label: "리뷰 패킷", done: true },
    { label: "게이트 결과", done: ws.hasGateResult },
    { label: "클립보드 페이로드", done: ws.hasClipboardPayload },
    { label: "QA 통과", done: ws.qaReady },
    { label: "렌더 가능", done: ws.canProceedToRender },
  ];

  return (
    <div className="flex items-center gap-1 flex-wrap mb-4">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-1">
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              step.done
                ? "bg-indigo-900/50 border border-indigo-700/50 text-indigo-300"
                : "bg-slate-800/50 border border-slate-700/50 text-slate-500"
            }`}
          >
            {step.done ? "✓" : "○"} {step.label}
          </span>
          {i < steps.length - 1 && (
            <span className="text-slate-700 text-xs">›</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Copy Action Summary ──────────────────────────────────────────────────────

function CopyActionPanel({ summary }: { summary: PackageCopyActionSummary }) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 mb-4 ${
        summary.copyReady
          ? "border-emerald-700/50 bg-emerald-900/20"
          : "border-slate-700/50 bg-slate-800/30"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          복사 액션
        </span>
        <CopyReadyBadge ready={summary.copyReady} />
      </div>

      {summary.copyReady ? (
        <p className="text-xs text-emerald-300">
          클립보드 페이로드 준비 완료 —{" "}
          <span className="font-mono text-emerald-400">{summary.clipboardPayloadId}</span>
        </p>
      ) : (
        <>
          <p className="text-xs text-slate-400 mb-1">이 패키지는 현재 복사 불가 상태입니다.</p>
          <BlockerList labels={summary.blockerLabels} />
        </>
      )}
    </div>
  );
}

// ─── Package Detail Panel ─────────────────────────────────────────────────────

function PackageDetailPanel({
  detail,
  copyAction,
  workflowStatus,
}: {
  detail: PackageDetailModel;
  copyAction: PackageCopyActionSummary;
  workflowStatus: PackageWorkflowStatus | null;
}) {
  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <GateBadge status={detail.gateStatus} />
            <CopyReadyBadge ready={detail.copyReady} />
            {detail.risk.isBlocked && (
              <span className="text-xs text-rose-400 font-semibold border border-rose-700/40 bg-rose-900/30 px-2 py-0.5 rounded-full">
                위험 차단
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-slate-100 leading-snug">{detail.title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{detail.coreMessage}</p>
        </div>
        <div className="text-xs text-slate-500 shrink-0">
          {detail.createdAt ? detail.createdAt.slice(0, 10) : "—"}
        </div>
      </div>

      {/* Workflow status bar */}
      {workflowStatus && <WorkflowStatusBar ws={workflowStatus} />}

      {/* Copy action */}
      <CopyActionPanel summary={copyAction} />

      {/* Gate blocker codes */}
      {detail.gateBlockerCodes.length > 0 && (
        <div className="mb-4 rounded border border-rose-800/40 bg-rose-900/20 px-3 py-2">
          <div className="text-xs text-rose-300 font-semibold mb-1">게이트 차단 코드</div>
          <div className="flex flex-wrap gap-1">
            {detail.gateBlockerCodes.map((c) => (
              <span key={c} className="font-mono text-xs text-rose-300 bg-rose-900/30 px-1.5 py-0.5 rounded">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Copy blocker codes */}
      {detail.copyBlockerCodes.length > 0 && (
        <div className="mb-4 rounded border border-amber-800/40 bg-amber-900/20 px-3 py-2">
          <div className="text-xs text-amber-300 font-semibold mb-1">복사 차단 코드</div>
          <div className="flex flex-wrap gap-1">
            {detail.copyBlockerCodes.map((c) => (
              <span key={c} className="font-mono text-xs text-amber-300 bg-amber-900/30 px-1.5 py-0.5 rounded">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Fact card */}
      <SectionHeader>Fact Card</SectionHeader>
      <div className="rounded-lg border border-indigo-800/40 bg-indigo-900/20 px-3 py-2 mb-4">
        <div className="text-sm font-bold text-indigo-200 mb-1">
          {detail.factCard.indicatorName}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="font-mono text-indigo-300 text-base font-bold">
            {detail.factCard.currentValue}
          </span>
          <span>{detail.factCard.dataPeriod}</span>
          <span className="font-mono text-slate-500 text-xs">{detail.factCard.factCardId}</span>
        </div>
      </div>

      {/* Risk & QA */}
      <SectionHeader>위험 · QA</SectionHeader>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded border border-slate-700/50 bg-slate-800/30 px-3 py-2">
          <div className="text-xs text-slate-500 mb-1">위험 수준</div>
          <div
            className={`text-sm font-bold ${detail.risk.isBlocked ? "text-rose-400" : "text-emerald-400"}`}
          >
            {detail.risk.overallRiskLevel}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {detail.risk.findingCount}건 발견
          </div>
        </div>
        <div className="rounded border border-slate-700/50 bg-slate-800/30 px-3 py-2">
          <div className="text-xs text-slate-500 mb-1">QA 통과</div>
          <div
            className={`text-sm font-bold ${detail.qa.readyForRender ? "text-emerald-400" : "text-rose-400"}`}
          >
            {detail.qa.readyForRender ? "통과" : "미통과"}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            차단 실패: {detail.qa.blockersFailed}건
          </div>
        </div>
      </div>

      {detail.qa.failedCheckCodes.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1">
          {detail.qa.failedCheckCodes.map((c) => (
            <span key={c} className="font-mono text-xs text-rose-300 bg-rose-900/20 border border-rose-800/40 px-1.5 py-0.5 rounded">
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Owner notes */}
      {detail.ownerNotes && (
        <>
          <SectionHeader>Owner 메모</SectionHeader>
          <p className="text-xs text-slate-300 bg-slate-800/40 border border-slate-700/40 rounded px-3 py-2 mb-4">
            {detail.ownerNotes}
          </p>
        </>
      )}

      {/* Social copy */}
      <SectionHeader>소셜 카피</SectionHeader>
      <Field label="YouTube 제목" value={detail.youtubeTitle} />
      <Field label="Instagram 캡션" value={detail.instagramCaption} />
      <Field label="해시태그" value={detail.hashtagsText} mono />
      {detail.moneyOsCta && (
        <Field label="Money-OS CTA" value={detail.moneyOsCta} />
      )}

      {/* Sources */}
      <SectionHeader>출처 ({detail.sourceRefs.length}건)</SectionHeader>
      <div className="space-y-2 mb-4">
        {detail.sourceRefs.map((ref) => (
          <div
            key={ref.citationId}
            className="rounded border border-slate-700/40 bg-slate-800/30 px-3 py-2"
          >
            <div className="text-xs font-semibold text-slate-200 mb-0.5">{ref.sourceName}</div>
            <div className="font-mono text-xs text-slate-500 break-all">{ref.sourceUrl}</div>
            <div className="text-xs text-slate-500 mt-0.5">{ref.publishedDate}</div>
          </div>
        ))}
      </div>

      {/* IDs */}
      <SectionHeader>패키지 ID 체인</SectionHeader>
      <div className="space-y-1 mb-4">
        {(
          [
            ["contentPackageId", detail.contentPackageId],
            ["reviewPacketId", detail.reviewPacketId],
            ["clipboardPayloadId", detail.clipboardPayloadId ?? "—"],
            ["gateResultId", detail.gateResultId ?? "—"],
            ["blueprintVideoId", detail.blueprintVideoId],
            ["scriptPackageId", detail.scriptPackageId],
            ["chartCardPackageId", detail.chartCardPackageId],
            ["imagePromptPackageId", detail.imagePromptPackageId],
            ["voiceProfileId", detail.voiceProfileId],
            ["ttsPackageId", detail.ttsPackageId],
            ["timelineId", detail.timelineId],
            ["renderManifestId", detail.renderManifestId],
          ] as [string, string][]
        ).map(([k, v]) => (
          <div key={k} className="flex gap-2 text-xs">
            <span className="text-slate-500 shrink-0 w-44">{k}</span>
            <span className="font-mono text-slate-300 break-all">{v}</span>
          </div>
        ))}
      </div>

      {/* Counts */}
      <SectionHeader>카운트</SectionHeader>
      <div className="flex gap-4 text-xs text-slate-400 pb-4">
        <span>씬 {detail.counts.scenes}</span>
        <span>대본 {detail.counts.scripts}</span>
        <span>출처 {detail.counts.sources}</span>
        <span>해시태그 {detail.counts.hashtags}</span>
      </div>
    </div>
  );
}

// ─── Main View (Server Component — no useState) ───────────────────────────────

export default function PackageLibraryView({
  packages,
  selectedIndex,
}: {
  packages: PackageEntry[];
  selectedIndex: number;
}) {
  const selected = packages[selectedIndex];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--bg-secondary)] border-b border-slate-800/70 px-4 py-3">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight">
              Money Shorts OS — Package Library
            </h1>
            <p className="text-xs text-slate-500">
              로컬 fixture 기반 · 외부 API 없음 · {packages.length}개 패키지
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/money-shorts"
              className="px-3 py-1.5 rounded-lg border border-slate-700/50 bg-slate-800/30 text-slate-400 text-xs font-semibold hover:bg-slate-800/60 transition-colors"
            >
              ← Workflow Hub
            </Link>
            <span className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700/50 text-slate-500 text-xs">
              MVP1
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row">
        {/* Left: package list */}
        <aside className="w-full md:w-80 shrink-0 border-b md:border-b-0 md:border-r border-slate-800/70 md:min-h-[calc(100vh-57px)]">
          <div className="px-4 py-2 border-b border-slate-800/50">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              패키지 목록
            </span>
          </div>
          {packages.map((pkg, i) => (
            <PackageListRow
              key={pkg.listItem.contentPackageId + "_" + i}
              item={pkg.listItem}
              index={i}
              selected={i === selectedIndex}
            />
          ))}
        </aside>

        {/* Right: detail */}
        <main className="flex-1 min-w-0">
          {selected ? (
            <PackageDetailPanel
              detail={selected.detailModel}
              copyAction={selected.copyActionSummary}
              workflowStatus={selected.workflowStatus}
            />
          ) : (
            <div className="flex items-center justify-center min-h-64 text-slate-500 text-sm">
              패키지를 선택하세요
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
