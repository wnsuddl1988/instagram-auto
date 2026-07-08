"use client";

/**
 * OperatorPanel — /money-shorts 웹 운영 콘솔.
 *
 * task: owner-web-operator-ui-local-control-v1
 *
 * 버튼을 눌러 준비 상태를 확인하는 화면. 실제 게시(업로드)는 이 화면에서 실행되지 않고,
 * 위저드 마지막 단계의 확인 게이트(체크 2개 + "업로드" 입력)에서만 실행된다.
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

const UPLOAD_POINTER_NOTE =
  "실제 업로드는 위 '자동 쇼츠 만들기' 마지막 단계에서 확인 절차(체크 2개 + '업로드' 입력)를 거쳐 실행합니다. 이 점검 화면에서는 업로드가 실행되지 않습니다.";

// ── 상태 배지 ────────────────────────────────────────────────────────────────

function StateBadge({ state }: { state: RunState }) {
  if (state === "idle") return null;
  const map: Record<Exclude<RunState, "idle">, { text: string; cls: string }> = {
    running: { text: "확인 중", cls: "bg-slate-100 border-slate-300 text-slate-600" },
    success: { text: "정상", cls: "bg-emerald-50 border-emerald-300 text-emerald-700" },
    blocked: { text: "확인 필요", cls: "bg-amber-50 border-amber-300 text-amber-700" },
    error: { text: "오류", cls: "bg-rose-50 border-rose-300 text-rose-700" },
  };
  const m = map[state];
  return <span className={`px-2.5 py-0.5 rounded-full border text-sm font-semibold shrink-0 ${m.cls}`}>{m.text}</span>;
}

// ── 결과 표시 ────────────────────────────────────────────────────────────────

function ResultBlock({ result }: { result: PanelResult }) {
  if (result.state === "idle") return null;
  if (result.state === "running") {
    return <p className="text-sm text-slate-500 mt-3">확인 중입니다...</p>;
  }
  const tone =
    result.state === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : result.state === "blocked"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <div className={`mt-3 rounded-xl border px-3.5 py-3 ${tone}`}>
      <p className="text-[15px] font-semibold leading-relaxed">{result.summary}</p>
      {result.detail ? <p className="text-sm opacity-80 mt-1 leading-relaxed">{result.detail}</p> : null}
      {result.raw ? (
        <details className="mt-2">
          <summary className="text-xs opacity-70 cursor-pointer select-none">개발자용 자세한 내용 보기</summary>
          <pre className="mt-2 text-xs leading-relaxed overflow-x-auto max-h-64 bg-white/70 border border-slate-200 rounded p-2 text-slate-600">
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
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4">
      <div className="flex items-start gap-3">
        <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 bg-slate-200 text-slate-600">
          {num}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-bold text-base text-slate-900">{title}</div>
            <StateBadge state={result.state} />
          </div>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">{desc}</p>
          <div className="mt-3">{children}</div>
          <ResultBlock result={result} />
        </div>
      </div>
    </div>
  );
}

const BTN =
  "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-50";

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
      <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">세부 점검 도구 (고급)</div>
      <p className="text-sm text-slate-500 -mt-2">
        영상 만들기는 위의 자동 흐름을 쓰세요. 아래는 업로드 준비 상태를 항목별로 확인하는 점검 도구입니다.
      </p>

      {/* 로컬/배포 안내 — Owner가 배포 사이트에서 모든 게 실행된다고 오해하지 않도록 */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5">
        <p className="text-[15px] text-amber-800 leading-relaxed">{PRODUCTION_NOTICE}</p>
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
            <span className="text-sm text-slate-500">콘텐츠 정보 파일 경로</span>
            <input
              type="text"
              value={contentUnitPath}
              onChange={(e) => setContentUnitPath(e.target.value)}
              placeholder="C:\tmp\...\dual_platform_content_unit.....json"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-500">업로드 기록 파일 경로</span>
            <input
              type="text"
              value={ledgerPath}
              onChange={(e) => setLedgerPath(e.target.value)}
              placeholder="C:\tmp\...\publish-ledger.json"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-500">결과 저장 폴더 경로</span>
            <input
              type="text"
              value={outDir}
              onChange={(e) => setOutDir(e.target.value)}
              placeholder="C:\tmp\..."
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
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
          <p className="text-sm text-slate-500 leading-relaxed">
            경로 3개를 모두 채우면 버튼이 활성화됩니다. 이 버튼은 확인만 하고 업로드하지 않습니다.
          </p>
        </div>
      </Section>

      {/* 5. 실제 업로드 — 이 점검 화면에서는 실행되지 않고, 위저드의 확인 게이트로 안내만 한다 */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 bg-slate-200 text-slate-500">
            5
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-bold text-base text-slate-600">실제 업로드</div>
              <span className="px-2.5 py-0.5 rounded-full border border-slate-300 bg-white text-slate-500 text-sm font-semibold">
                위저드에서 실행
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{UPLOAD_POINTER_NOTE}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
