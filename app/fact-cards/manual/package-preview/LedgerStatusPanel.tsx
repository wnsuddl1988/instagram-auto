"use client";

/**
 * LedgerStatusPanel — displays local approval ledger status and record action.
 *
 * Safety:
 * - Never imports FactCard or recordApproval directly.
 * - recordApprovalAction is a server-bound partial — factCard is already bound
 *   server-side in page.tsx via recordApproval.bind(null, factCard).
 * - Client receives only factCardId + isMock (display/status props), not the full FactCard.
 * - Never writes to localStorage/sessionStorage/clipboard.
 * - No isPublishable mutation here.
 */

import { useState, useTransition } from "react";
import type { LocalApprovalRecord } from "@/lib/owner-decision/local-approval-ledger";
import type { RecordApprovalResult } from "@/lib/owner-decision/local-approval-ledger";

interface Props {
  /** Display-only: used to show factCardId and disable button for mock cards. */
  factCardId: string;
  isMock: boolean;
  /** Server-bound action — factCard is already bound on the server via .bind(). */
  recordApprovalAction: (notes: string | null) => Promise<RecordApprovalResult>;
  initialRecord: LocalApprovalRecord | null;
}

export function LedgerStatusPanel({
  factCardId,
  isMock,
  recordApprovalAction,
  initialRecord,
}: Props) {
  const [record, setRecord] = useState<LocalApprovalRecord | null>(
    initialRecord,
  );
  const [notes, setNotes] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Suppress unused-variable warning — factCardId is used in display only
  void factCardId;

  function handleRecord() {
    setErrorMsg(null);
    startTransition(async () => {
      const result = await recordApprovalAction(notes.trim() || null);
      if (result.ok) {
        setRecord(result.record);
      } else if (result.reason === "not_eligible") {
        setErrorMsg(
          `기록 불가 — 적격 조건 미충족: ${result.blockerCodes.join(", ")}`,
        );
      } else {
        setErrorMsg(`저장 실패: ${result.detail}`);
      }
    });
  }

  return (
    <div className="space-y-3">
      {/* Safety notice */}
      <div className="rounded-lg border border-amber-700/40 bg-amber-900/10 px-3 py-2 text-xs text-amber-300">
        로컬 전용 — `.money-shorts-local/` (gitignored). DB/클라우드에 저장되지
        않습니다.
      </div>

      {/* Current ledger status */}
      {record ? (
        <div className="rounded-lg border border-emerald-700/40 bg-emerald-900/10 px-3 py-3 space-y-1.5">
          <div className="text-xs font-bold text-emerald-300 mb-1">
            ✓ 로컬 승인 기록 존재
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-slate-500 w-32 shrink-0">approvalId</span>
            <span className="text-slate-300 font-mono break-all">
              {record.approvalId}
            </span>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-slate-500 w-32 shrink-0">factCardId</span>
            <span className="text-slate-300 font-mono break-all">
              {record.factCardId}
            </span>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-slate-500 w-32 shrink-0">recordedAt</span>
            <span className="text-slate-300 font-mono">{record.recordedAt}</span>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-slate-500 w-32 shrink-0">sourceName</span>
            <span className="text-slate-300">{record.audit.sourceName}</span>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-slate-500 w-32 shrink-0">citationCount</span>
            <span className="text-slate-300">{record.audit.citationCount}</span>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-slate-500 w-32 shrink-0">isMock</span>
            <span className="text-slate-300 font-mono">
              {String(record.audit.isMock)}
            </span>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-slate-500 w-32 shrink-0">
              canMarkPublishable
            </span>
            <span
              className={
                record.decisionResult.canMarkPublishable
                  ? "text-emerald-300 font-mono"
                  : "text-red-300 font-mono"
              }
            >
              {String(record.decisionResult.canMarkPublishable)}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            재기록하려면 아래에서 다시 실행하세요 (기존 기록을 덮어씁니다).
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-700/40 bg-slate-800/20 px-3 py-2 text-xs text-slate-500">
          이 Fact Card에 대한 로컬 승인 기록이 없습니다.
        </div>
      )}

      {/* Record action */}
      <div className="space-y-2">
        <label className="block text-xs text-slate-400">
          메모 (선택, Owner notes)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded border border-slate-700 bg-slate-800 text-xs text-slate-200 px-2 py-1.5 resize-none placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          placeholder="승인 메모 입력 (선택)"
          disabled={isPending}
        />
        <button
          onClick={handleRecord}
          disabled={isPending || isMock}
          className={`w-full rounded border px-3 py-1.5 text-xs font-semibold transition-colors ${
            isMock
              ? "border-slate-700/40 text-slate-600 cursor-not-allowed"
              : isPending
                ? "border-indigo-700/40 bg-indigo-900/20 text-indigo-400 cursor-wait"
                : "border-indigo-600/60 bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50"
          }`}
        >
          {isPending
            ? "기록 중..."
            : isMock
              ? "Mock Fact Card — 기록 불가"
              : "로컬 승인 기록"}
        </button>
        {isMock && (
          <p className="text-xs text-slate-600">
            isMock=true Fact Card는 로컬 승인을 기록할 수 없습니다.
          </p>
        )}
      </div>

      {/* Error display */}
      {errorMsg && (
        <div className="rounded border border-red-700/40 bg-red-900/10 px-3 py-2 text-xs text-red-300">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
