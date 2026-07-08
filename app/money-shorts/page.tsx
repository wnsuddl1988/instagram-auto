import Link from "next/link";

// ── Workflow step data ────────────────────────────────────────────────────────

const WORKFLOW_STEPS = [
  {
    num: 1,
    title: "샘플 확인",
    desc: "출처가 있는 예시와 잘못된 예시를 먼저 확인합니다.",
    href: "/fact-cards/manual",
    label: "샘플 보기",
    accent: "indigo",
  },
  {
    num: 2,
    title: "새 콘텐츠 입력",
    desc: "숫자, 출처, 핵심 내용을 직접 입력하고 바로 검증합니다.",
    href: "/fact-cards/manual/new",
    label: "입력하기",
    accent: "indigo",
  },
  {
    num: 3,
    title: "영상 패키지 미리보기",
    desc: "대본, 검수 문구, 업로드용 제목과 설명을 한 번에 확인합니다.",
    href: "/fact-cards/manual/package-preview",
    label: "미리보기",
    accent: "slate",
  },
  {
    num: 4,
    title: "저장된 콘텐츠 보기",
    desc: "승인, 반려, 차단된 콘텐츠 목록과 진행 상태를 확인합니다.",
    href: "/packages",
    label: "목록 보기",
    accent: "slate",
  },
] as const;

// ── Principle items ───────────────────────────────────────────────────────────

const PRINCIPLES = [
  "숫자와 사실은 출처가 확인된 것만 사용합니다.",
  "입력하지 않은 내용은 AI가 임의로 만들지 않습니다.",
  "이 화면에서는 바로 업로드하지 않고 먼저 검토합니다.",
  "검토가 끝난 콘텐츠만 영상 제작과 업로드 단계로 넘깁니다.",
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
              AI 쇼츠 자동화
            </h1>
            <p className="text-xs text-slate-500">
              출처 확인부터 대본, 영상 패키지, 업로드 준비까지 한 번에 관리합니다.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-1 rounded bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 text-xs font-semibold">
              출처 확인
            </span>
            <span className="px-2 py-1 rounded bg-amber-900/30 border border-amber-700/50 text-amber-300 text-xs font-semibold">
              먼저 검토
            </span>
            <span className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700/50 text-slate-400 text-xs">
              업로드 준비
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">

        {/* Source-first principles */}
        <section className="rounded-xl border border-amber-800/40 bg-amber-900/10 px-5 py-4">
          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">
            사용 전 확인
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
            진행 순서
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {WORKFLOW_STEPS.map((step) => (
              <StepCard key={step.num} {...step} />
            ))}
          </div>
        </section>

        {/* Live latest draft candidate — dev-only explicit access */}
        <section className="rounded-xl border border-blue-800/40 bg-blue-900/10 px-5 py-4">
          <div className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-2">
            최신 기준금리 후보 만들기
          </div>
          <p className="text-xs text-blue-200/70 mb-3 leading-relaxed">
            한국은행 데이터를 불러와 기준금리 관련 쇼츠 후보를 만듭니다.
            클릭할 때만 데이터를 불러오며, 바로 업로드하지 않고 초안으로만 보여줍니다.
          </p>
          <Link
            href="/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606"
            prefetch={false}
            className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-lg border border-blue-700/60 bg-blue-900/30 text-blue-300 hover:bg-blue-900/60 text-xs font-semibold transition-colors"
          >
            기준금리 후보 보기 →
          </Link>
        </section>

        {/* Status note */}
        <section className="rounded-xl border border-slate-800/50 bg-slate-900/40 px-5 py-4 text-xs text-slate-500">
          <div className="font-bold text-slate-400 mb-1">현재 이 화면에서 할 수 있는 것</div>
          <p>
            새 쇼츠 아이디어를 입력하고, 출처와 내용이 맞는지 확인한 뒤,
            영상 제작 전에 업로드용 제목·설명·검수 내용을 미리 볼 수 있습니다.
            실제 영상 생성과 업로드는 검토가 끝난 뒤 별도 단계에서 실행됩니다.
          </p>
        </section>
      </main>
    </div>
  );
}
