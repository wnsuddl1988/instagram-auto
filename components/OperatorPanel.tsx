"use client";

/**
 * OperatorPanel — /money-shorts 웹 운영 콘솔.
 *
 * task: owner-web-operator-ui-local-control-v1
 *
 * 버튼을 눌러 준비 상태를 확인하는 화면. 실제 게시(업로드)는 이 화면에서 실행되지 않으며,
 * "실제 업로드" 버튼은 잠금(disabled) 상태다.
 */

import { useState } from "react";

type RunState = "idle" | "running" | "success" | "blocked" | "error";

type OperatorAction = "status" | "credentialPreflight" | "readyPreflight" | "readyDuplicateGuard" | "finalE2ePreflight";

type OperatorResponse = {
  action: OperatorAction;
  status: "success" | "blocked" | "error";
  summary: string;
  detail?: string;
  blockerCode?: string;
  raw?: unknown;
};

type PanelResult = { state: RunState; summary: string; detail?: string; blockerCode?: string; raw?: unknown };

const INITIAL: PanelResult = { state: "idle", summary: "" };

const PRODUCTION_NOTICE =
  "실제 영상 생성과 게시 준비는 Owner PC에서 pnpm dev로 연 로컬 화면에서 실행합니다. 배포 사이트는 상태 확인과 화면 검토용입니다.";

const LOCKED_UPLOAD_NOTE = "실제 업로드는 별도 승인 후 활성화됩니다. 지금은 게시 전 점검까지만 가능합니다.";

// ── 상태 배지 ────────────────────────────────────────────────────────────────

function StateBadge({ state }: { state: RunState }) {
  if (state === "idle") return null;
  const map: Record<Exclude<RunState, "idle">, { text: string; cls: string }> = {
    running: { text: "확인 중", cls: "bg-slate-800/60 border-slate-600/50 text-slate-300" },
    success: { text: "정상", cls: "bg-emerald-900/30 border-emerald-700/50 text-emerald-300" },
    blocked: { text: "확인 필요", cls: "bg-amber-900/30 border-amber-700/50 text-amber-300" },
    error: { text: "오류", cls: "bg-rose-900/30 border-rose-700/50 text-rose-300" },
  };
  const m = map[state];
  return <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold shrink-0 ${m.cls}`}>{m.text}</span>;
}

// ── 결과 표시 ────────────────────────────────────────────────────────────────

function ResultBlock({ result }: { result: PanelResult }) {
  if (result.state === "idle") return null;
  if (result.state === "running") {
    return <p className="text-xs text-slate-400 mt-3">확인 중입니다...</p>;
  }
  const tone =
    result.state === "success"
      ? "border-emerald-800/40 bg-emerald-900/10 text-emerald-200"
      : result.state === "blocked"
        ? "border-amber-800/40 bg-amber-900/10 text-amber-200"
        : "border-rose-800/40 bg-rose-900/10 text-rose-200";

  return (
    <div className={`mt-3 rounded-lg border px-3 py-2.5 ${tone}`}>
      <p className="text-xs font-semibold leading-relaxed">{result.summary}</p>
      {result.detail ? <p className="text-[11px] opacity-70 mt-1 leading-relaxed">{result.detail}</p> : null}
      {result.raw ? (
        <details className="mt-2">
          <summary className="text-[11px] opacity-60 cursor-pointer select-none">개발자용 자세한 내용 보기</summary>
          <pre className="mt-2 text-[10px] leading-relaxed overflow-x-auto max-h-64 bg-slate-950/60 rounded p-2 text-slate-400">
            {JSON.stringify(result.raw, null, 2)}
          </pre>
        </details>
      ) : null}
    </div>
  );
}

// ── 섹션 껍데기 ───────────────────────────────────────────────────────────────

function Section({
  num,
  title,
  desc,
  result,
  children,
}: {
  num: number;
  title: string;
  desc: string;
  result: PanelResult;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 px-5 py-4">
      <div className="flex items-start gap-3">
        <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 bg-slate-700 text-slate-300">
          {num}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-semibold text-sm text-slate-200">{title}</div>
            <StateBadge state={result.state} />
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</p>
          <div className="mt-3">{children}</div>
          <ResultBlock result={result} />
        </div>
      </div>
    </div>
  );
}

const BTN =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-600/60 bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/60 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-900/30";

// ── 메인 ─────────────────────────────────────────────────────────────────────

export default function OperatorPanel() {
  const [results, setResults] = useState<Record<OperatorAction, PanelResult>>({
    status: INITIAL,
    credentialPreflight: INITIAL,
    readyPreflight: INITIAL,
    readyDuplicateGuard: INITIAL,
    finalE2ePreflight: INITIAL,
  });

  const [contentUnitPath, setContentUnitPath] = useState("");
  const [ledgerPath, setLedgerPath] = useState("");
  const [outDir, setOutDir] = useState("");

  const setResult = (action: OperatorAction, r: PanelResult) =>
    setResults((prev) => ({ ...prev, [action]: r }));

  async function run(action: OperatorAction, extra?: Record<string, string>) {
    setResult(action, { state: "running", summary: "" });
    try {
      const res = await fetch("/api/money-shorts/operator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = (await res.json()) as OperatorResponse;
      setResult(action, {
        state: data.status,
        summary: data.summary,
        detail: data.detail,
        blockerCode: data.blockerCode,
        raw: data.raw,
      });
    } catch {
      setResult(action, { state: "error", summary: "화면과 서버가 연결되지 않았습니다. 로컬 서버가 켜져 있는지 확인해 주세요." });
    }
  }

  const e2eDisabled =
    results.finalE2ePreflight.state === "running" ||
    contentUnitPath.trim() === "" ||
    ledgerPath.trim() === "" ||
    outDir.trim() === "";

  return (
    <section className="space-y-4">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">바로 할 일</div>

      {/* 로컬/배포 안내 — Owner가 배포 사이트에서 모든 게 실행된다고 오해하지 않도록 */}
      <div className="rounded-xl border border-amber-800/40 bg-amber-900/10 px-5 py-3">
        <p className="text-xs text-amber-200 leading-relaxed">{PRODUCTION_NOTICE}</p>
      </div>

      <Section
        num={1}
        title="준비 상태 확인"
        desc="영상 파일과 설정이 모두 갖춰졌는지 확인합니다. 업로드는 하지 않습니다."
        result={results.readyPreflight}
      >
        <button type="button" className={BTN} onClick={() => run("readyPreflight")} disabled={results.readyPreflight.state === "running"}>
          상태 확인
        </button>
      </Section>

      <Section
        num={2}
        title="업로드 키 확인"
        desc="업로드에 필요한 키 6개가 준비됐는지 확인합니다. 키 값은 화면에 표시되지 않습니다."
        result={results.credentialPreflight}
      >
        <button
          type="button"
          className={BTN}
          onClick={() => run("credentialPreflight")}
          disabled={results.credentialPreflight.state === "running"}
        >
          업로드 키 확인
        </button>
      </Section>

      <Section
        num={3}
        title="기존 샘플 재업로드 차단 확인"
        desc="이미 올린 영상을 실수로 다시 올리지 않도록 막는 장치가 작동하는지 확인합니다."
        result={results.readyDuplicateGuard}
      >
        <button
          type="button"
          className={BTN}
          onClick={() => run("readyDuplicateGuard")}
          disabled={results.readyDuplicateGuard.state === "running"}
        >
          재업로드 차단 확인
        </button>
      </Section>

      <Section
        num={4}
        title="새 콘텐츠 게시 사전점검"
        desc="새로 만든 콘텐츠가 올릴 준비가 됐는지만 확인합니다. 실제 업로드는 실행되지 않습니다."
        result={results.finalE2ePreflight}
      >
        <div className="space-y-2">
          <label className="block">
            <span className="text-[11px] text-slate-500">콘텐츠 정보 파일 경로</span>
            <input
              type="text"
              value={contentUnitPath}
              onChange={(e) => setContentUnitPath(e.target.value)}
              placeholder="C:\tmp\...\dual_platform_content_unit.....json"
              className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-600/60"
            />
          </label>
          <label className="block">
            <span className="text-[11px] text-slate-500">업로드 기록 파일 경로</span>
            <input
              type="text"
              value={ledgerPath}
              onChange={(e) => setLedgerPath(e.target.value)}
              placeholder="C:\tmp\...\publish-ledger.json"
              className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-600/60"
            />
          </label>
          <label className="block">
            <span className="text-[11px] text-slate-500">결과 저장 폴더 경로</span>
            <input
              type="text"
              value={outDir}
              onChange={(e) => setOutDir(e.target.value)}
              placeholder="C:\tmp\..."
              className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-600/60"
            />
          </label>
          <button
            type="button"
            className={BTN}
            onClick={() => run("finalE2ePreflight", { contentUnitPath, ledgerPath, outDir })}
            disabled={e2eDisabled}
          >
            게시 전 점검
          </button>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            경로 3개를 모두 채우면 버튼이 활성화됩니다. 이 버튼은 확인만 하고 업로드하지 않습니다.
          </p>
        </div>
      </Section>

      {/* 5. 실제 업로드 — 잠금 */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/20 px-5 py-4 opacity-80">
        <div className="flex items-start gap-3">
          <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 bg-slate-800 text-slate-500">
            5
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-semibold text-sm text-slate-400">실제 업로드</div>
              <span className="px-2 py-0.5 rounded border border-slate-700/50 bg-slate-800/60 text-slate-500 text-[11px] font-semibold">
                잠김
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{LOCKED_UPLOAD_NOTE}</p>
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/50 bg-slate-800/40 text-slate-500 text-xs font-semibold cursor-not-allowed"
            >
              실제 업로드는 다음 승인 후 활성화
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
