import type { GateBlockerCode } from "@/lib/owner-decision/types";
import type { LedgerOverlayResult } from "./ledger-overlay";

interface Props {
  isMock: boolean;
  isPublishable: boolean;
  blockerCodes: GateBlockerCode[];
  ledgerOverlayResult: LedgerOverlayResult;
  primarySourceName: string | null;
  primaryPublishedDate: string | null;
}

type GuidanceState = "ledger_approved" | "draft_blocked" | "pending_approval";

function resolveState(
  isPublishable: boolean,
  blockerCodes: GateBlockerCode[],
  ledgerOverlayResult: LedgerOverlayResult,
): GuidanceState {
  if (ledgerOverlayResult.active) return "ledger_approved";
  if (blockerCodes.includes("fact_card_not_publishable") || !isPublishable) return "draft_blocked";
  return "pending_approval";
}

export function OwnerReviewGuidancePanel({
  isMock,
  isPublishable,
  blockerCodes,
  ledgerOverlayResult,
  primarySourceName,
  primaryPublishedDate,
}: Props) {
  const state = resolveState(isPublishable, blockerCodes, ledgerOverlayResult);

  if (state === "ledger_approved") {
    return (
      <div className="rounded-lg border border-emerald-700/50 bg-emerald-900/15 px-4 py-3 text-xs">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-bold text-emerald-300">✓ Owner 검토 가이드 — Ledger 승인됨</span>
          {ledgerOverlayResult.active && (
            <span className="ml-auto font-mono text-emerald-500/70 text-[10px]">
              approvalId: {ledgerOverlayResult.approvalId}
            </span>
          )}
        </div>
        <p className="text-emerald-200/80 leading-relaxed">
          로컬 ledger 승인 기록이 확인됐습니다. ⑧ Publishability Readiness 섹션 내 로컬 승인 Overlay에서 승인 기준의 Copy 페이로드를 확인하세요.
          실제 publish·render는 별도 Owner 명시 승인 후 진행합니다.
        </p>
        {primarySourceName && (
          <p className="mt-1.5 text-emerald-500/70">
            출처: {primarySourceName}
            {primaryPublishedDate ? ` · ${primaryPublishedDate}` : ""}
          </p>
        )}
      </div>
    );
  }

  if (state === "draft_blocked") {
    const otherBlockers = blockerCodes.filter((c) => c !== "fact_card_not_publishable");
    return (
      <div className="rounded-lg border border-amber-700/50 bg-amber-900/15 px-4 py-3 text-xs">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-bold text-amber-300">⚠ Owner 검토 가이드 — Draft 차단됨</span>
          {isMock && (
            <span className="px-1.5 py-0.5 rounded border border-slate-600/50 bg-slate-800/40 text-slate-400 text-[10px]">
              isMock
            </span>
          )}
        </div>
        <p className="text-amber-200/80 leading-relaxed">
          Fact Card가 <code className="font-mono bg-amber-900/30 px-1 rounded">isPublishable=false</code> 상태입니다.
          출처 검증·편집 완료 후 퍼블리셔블 전환이 필요합니다.
        </p>
        {otherBlockers.length > 0 && (
          <p className="mt-1.5 text-amber-400/70">
            추가 차단 코드: {otherBlockers.join(", ")}
          </p>
        )}
        <p className="mt-1.5 text-amber-500/60">
          다음 액션: Fact Card 편집 → 출처 재확인 → isPublishable 승인 절차 진행
        </p>
      </div>
    );
  }

  // pending_approval
  return (
    <div className="rounded-lg border border-slate-700/40 bg-slate-800/20 px-4 py-3 text-xs">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="font-bold text-slate-300">○ Owner 검토 가이드 — 승인 대기 중</span>
      </div>
      <p className="text-slate-400 leading-relaxed">
        Fact Card가 퍼블리셔블 상태입니다. 아래 섹션(⑧)에서 Owner 결정을 기록하면 ledger overlay가 활성화됩니다.
      </p>
      {primarySourceName && (
        <p className="mt-1.5 text-slate-500">
          출처: {primarySourceName}
          {primaryPublishedDate ? ` · ${primaryPublishedDate}` : ""}
        </p>
      )}
      <p className="mt-1.5 text-slate-500/60">
        다음 액션: ⑧ Publishability Readiness 섹션의 Owner Decision 로컬 샌드박스에서 승인 기록 → 페이지 reload → ledger overlay 확인
      </p>
    </div>
  );
}
