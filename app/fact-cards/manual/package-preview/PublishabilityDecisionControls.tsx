"use client";

import { useState } from "react";
import {
  evaluatePublishabilityDecision,
  type PublishabilityDecisionInput,
} from "@/lib/owner-decision/publishability";
import type { FactCard } from "@/lib/source-facts/types";

const DECISION_OPTIONS: {
  value: PublishabilityDecisionInput["decision"];
  label: string;
}[] = [
  { value: null, label: "pending (null)" },
  { value: "approved", label: "approved" },
  { value: "rejected", label: "rejected" },
  { value: "revision_requested", label: "revision_requested" },
];

const STATIC_CREATED_AT = "2026-06-26T00:00:00+09:00";

interface Props {
  factCard: FactCard;
}

export function PublishabilityDecisionControls({ factCard }: Props) {
  const [decision, setDecision] =
    useState<PublishabilityDecisionInput["decision"]>(null);
  const [notes, setNotes] = useState<string>("");

  const result = evaluatePublishabilityDecision(
    factCard,
    {
      factCardId: factCard.id,
      decision,
      notes: notes.trim() || null,
    },
    {
      decisionResultId: `pub-decision-local-${factCard.id}`,
      createdAt: STATIC_CREATED_AT,
    },
  );

  return (
    <div className="rounded border border-slate-600/40 bg-slate-900/60 px-3 py-3 text-xs space-y-3">
      {/* Safety banner */}
      <div className="rounded border border-sky-800/30 bg-sky-900/10 px-2.5 py-2 text-sky-200/80 leading-relaxed">
        <span className="font-semibold text-sky-300">local sandbox only</span>
        {" — "}
        이 컨트롤은 브라우저 local state입니다. 저장·발행·렌더·복사·DB 변경 없음.
        서버 Gate / Clipboard Payload는 이 컨트롤의 영향을 받지 않습니다.
      </div>

      {/* Decision selector */}
      <div>
        <p className="text-slate-400 mb-1.5 font-medium">decision 선택</p>
        <div className="flex flex-wrap gap-1.5">
          {DECISION_OPTIONS.map((opt) => {
            const isActive = decision === opt.value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => setDecision(opt.value)}
                className={[
                  "px-2.5 py-1 rounded font-mono text-xs border transition-colors",
                  isActive
                    ? opt.value === "approved"
                      ? "bg-emerald-900/40 border-emerald-600/60 text-emerald-200"
                      : opt.value === "rejected"
                        ? "bg-red-900/40 border-red-600/60 text-red-200"
                        : opt.value === "revision_requested"
                          ? "bg-amber-900/40 border-amber-600/60 text-amber-200"
                          : "bg-slate-700/60 border-slate-500/60 text-slate-200"
                    : "bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-500/60 hover:text-slate-300",
                ].join(" ")}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional notes */}
      <div>
        <label className="block text-slate-400 mb-1 font-medium">
          notes (선택)
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Owner 메모 (선택)"
          className="w-full rounded border border-slate-700/40 bg-slate-800/50 px-2.5 py-1.5 text-slate-200 text-xs placeholder:text-slate-600 focus:outline-none focus:border-slate-500/60"
        />
      </div>

      {/* Contract result */}
      <div className="space-y-0">
        <p className="text-slate-400 mb-1.5 font-medium">
          evaluatePublishabilityDecision() 결과
        </p>

        {/* canMarkPublishable */}
        <div className="flex items-center gap-2 py-0.5 border-b border-slate-800/50">
          <span className="text-slate-500 w-36 shrink-0">canMarkPublishable</span>
          <span
            className={[
              "px-1.5 py-0.5 rounded font-mono text-xs border",
              result.canMarkPublishable
                ? "bg-emerald-900/30 border-emerald-700/40 text-emerald-300"
                : "bg-red-900/30 border-red-700/40 text-red-300",
            ].join(" ")}
          >
            {result.canMarkPublishable ? "ELIGIBLE" : "NOT ELIGIBLE"}
          </span>
        </div>

        {/* ownerDecision */}
        <div className="flex items-center gap-2 py-0.5 border-b border-slate-800/50">
          <span className="text-slate-500 w-36 shrink-0">ownerDecision</span>
          <span className="font-mono text-amber-300/90">
            {result.ownerDecision ?? "null (pending)"}
          </span>
        </div>

        {/* blockerCodes */}
        <div className="flex items-start gap-2 py-0.5 border-b border-slate-800/50">
          <span className="text-slate-500 w-36 shrink-0 pt-0.5">blockerCodes</span>
          <span className="flex flex-wrap gap-1">
            {result.blockerCodes.length === 0 ? (
              <span className="text-emerald-400">없음</span>
            ) : (
              result.blockerCodes.map((c) => (
                <span
                  key={c}
                  className="inline-block px-1.5 py-0.5 rounded font-mono text-xs bg-amber-900/20 text-amber-300 border border-amber-700/30"
                >
                  {c}
                </span>
              ))
            )}
          </span>
        </div>

        {/* isMock */}
        <div className="flex items-center gap-2 py-0.5 border-b border-slate-800/50">
          <span className="text-slate-500 w-36 shrink-0">isMock</span>
          <span
            className={`font-mono ${result.isMock ? "text-amber-300" : "text-emerald-300"}`}
          >
            {String(result.isMock)}
          </span>
        </div>

        {/* citationCount */}
        <div className="flex items-center gap-2 py-0.5 border-b border-slate-800/50">
          <span className="text-slate-500 w-36 shrink-0">citationCount</span>
          <span
            className={`font-mono ${result.citationCount > 0 ? "text-emerald-300" : "text-red-300"}`}
          >
            {result.citationCount}건
          </span>
        </div>

        {/* sourceUrl https:// readiness */}
        <div className="flex items-center gap-2 py-0.5">
          <span className="text-slate-500 w-36 shrink-0">sourceUrl https://</span>
          <span
            className={[
              "px-1.5 py-0.5 rounded font-mono text-xs border",
              result.sourceUrl.startsWith("https://")
                ? "bg-emerald-900/30 border-emerald-700/40 text-emerald-300"
                : "bg-red-900/30 border-red-700/40 text-red-300",
            ].join(" ")}
          >
            {result.sourceUrl.startsWith("https://") ? "OK" : "MISSING"}
          </span>
        </div>
      </div>
    </div>
  );
}
