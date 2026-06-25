import Link from "next/link";

// ── Workflow step data ────────────────────────────────────────────────────────

const WORKFLOW_STEPS = [
  {
    num: 1,
    title: "Fact Card Overview",
    desc: "valid/broken fixture 예시 확인 · authorManualFactCard() 결과 비교",
    href: "/fact-cards/manual",
    label: "overview 보기",
    accent: "indigo",
  },
  {
    num: 2,
    title: "Manual Fact Card 입력",
    desc: "Owner가 출처 수치를 직접 입력 · 실시간 validation · 샘플 불러오기/초기화",
    href: "/fact-cards/manual/new",
    label: "직접 입력하기",
    accent: "indigo",
  },
  {
    num: 3,
    title: "Package Preview",
    desc: "valid Fact Card → Blueprint → Script → Risk → QA → Owner Gate → Clipboard 전체 pipeline 미리보기",
    href: "/fact-cards/manual/package-preview",
    label: "pipeline 미리보기",
    accent: "slate",
  },
  {
    num: 4,
    title: "Package Library",
    desc: "승인/반려/차단 상태별 콘텐츠 패키지 목록 · 워크플로우 상태 확인",
    href: "/packages",
    label: "패키지 라이브러리",
    accent: "slate",
  },
] as const;

// ── Principle items ───────────────────────────────────────────────────────────

const PRINCIPLES = [
  "Fact Card first — 출처 수치를 먼저 확정하고 대본은 그 다음",
  "Fact Card에 없는 사실·숫자는 대본에 쓰지 않는다",
  "이 화면은 local preview 전용 — DB 저장, publish, render, upload 없음",
  "AI는 Fact Card 필드 외 값을 발명하지 않는다",
];

// ── Sub-components ────────────────────────────────────────────────────────────

function StepCard({
  num,
  title,
  desc,
  href,
  label,
  accent,
}: {
  num: number;
  title: string;
  desc: string;
  href: string;
  label: string;
  accent: "indigo" | "slate";
}) {
  const isIndigo = accent === "indigo";
  return (
    <div className={`rounded-xl border ${isIndigo ? "border-indigo-800/50 bg-indigo-900/10" : "border-slate-800/60 bg-slate-900/40"} px-5 py-4 flex flex-col gap-3`}>
      <div className="flex items-start gap-3">
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${isIndigo ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-300"}`}>
          {num}
        </span>
        <div className="min-w-0">
          <div className={`font-semibold text-sm ${isIndigo ? "text-indigo-100" : "text-slate-200"}`}>{title}</div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</p>
        </div>
      </div>
      <Link
        href={href}
        className={`inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
          isIndigo
            ? "border-indigo-600/60 bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/60"
            : "border-slate-700/60 bg-slate-800/30 text-slate-300 hover:bg-slate-800/60"
        }`}
      >
        {label} →
      </Link>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MoneyShortsDashboardPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--bg-secondary)] border-b border-slate-800/70 px-4 py-3">
        <div className="max-w-screen-lg mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight">
              Money Shorts OS — Workflow Hub
            </h1>
            <p className="text-xs text-slate-500">
              Source-first MVP · local preview 전용 · 외부 API 없음 (live 경로 제외)
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-1 rounded bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 text-xs font-semibold">
              SOURCE FIRST
            </span>
            <span className="px-2 py-1 rounded bg-amber-900/30 border border-amber-700/50 text-amber-300 text-xs font-semibold">
              LOCAL ONLY
            </span>
            <span className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700/50 text-slate-400 text-xs">
              MVP1
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">

        {/* Source-first principles */}
        <section className="rounded-xl border border-amber-800/40 bg-amber-900/10 px-5 py-4">
          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">
            출처 우선 원칙
          </div>
          <ul className="space-y-2">
            {PRINCIPLES.map((p, i) => (
              <li key={i} className="flex gap-2 text-xs text-amber-200">
                <span className="text-amber-500 shrink-0 mt-0.5">·</span>
                {p}
              </li>
            ))}
          </ul>
        </section>

        {/* Workflow steps */}
        <section>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Workflow 순서
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {WORKFLOW_STEPS.map((step) => (
              <StepCard key={step.num} {...step} />
            ))}
          </div>
        </section>

        {/* Status note */}
        <section className="rounded-xl border border-slate-800/50 bg-slate-900/40 px-5 py-4 text-xs text-slate-500">
          <div className="font-bold text-slate-400 mb-1">현재 상태</div>
          <p>
            이 화면은 source-first MVP의 로컬 workbench 진입점입니다.
            모든 데이터는 브라우저 상태에만 머물고 외부로 전송되지 않습니다.
            render / ffmpeg / TTS / upload는 이 UI에서 수행되지 않습니다.
          </p>
        </section>
      </main>
    </div>
  );
}
