import Link from "next/link";

import OperatorPanel from "@/components/OperatorPanel";
import VideoCreationWizard from "@/components/VideoCreationWizard";

// ── 사용 전 확인 원칙 ─────────────────────────────────────────────────────────

const PRINCIPLES = [
  "숫자와 사실은 출처가 확인된 것만 사용합니다.",
  "입력하지 않은 내용은 AI가 임의로 만들지 않습니다.",
  "이 화면에서는 바로 업로드하지 않고 먼저 검토합니다.",
  "검토가 끝난 콘텐츠만 영상 제작과 업로드 단계로 넘깁니다.",
];

// ── 고급 도구 링크 ────────────────────────────────────────────────────────────

const ADVANCED_TOOLS = [
  {
    title: "고급: 출처 직접 입력",
    desc: "숫자와 출처를 직접 넣는 전문가용 화면입니다.",
    href: "/fact-cards/manual/new",
    label: "직접 입력",
  },
  {
    title: "샘플 확인",
    desc: "출처가 있는 예시와 잘못된 예시를 확인합니다.",
    href: "/fact-cards/manual",
    label: "샘플 보기",
  },
  {
    title: "대본·제목 미리보기",
    desc: "대본, 검수 문구, 업로드용 제목과 설명을 확인합니다.",
    href: "/fact-cards/manual/package-preview",
    label: "미리보기",
  },
  {
    title: "저장된 콘텐츠 보기",
    desc: "승인, 반려, 차단된 콘텐츠 목록과 진행 상태를 확인합니다.",
    href: "/packages",
    label: "목록 보기",
  },
] as const;

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MoneyShortsDashboardPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--bg-secondary)] border-b border-slate-800/70 px-4 py-3">
        <div className="max-w-screen-lg mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight">AI 쇼츠 자동화</h1>
            <p className="text-xs text-slate-500">
              카테고리 선택부터 대본, 음성, 영상, 게시 전 점검, 업로드까지 버튼으로 진행합니다.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-1 rounded bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 text-xs font-semibold">
              자동 생성
            </span>
            <span className="px-2 py-1 rounded bg-amber-900/30 border border-amber-700/50 text-amber-300 text-xs font-semibold">
              먼저 검토
            </span>
            <span className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700/50 text-slate-400 text-xs">
              확인 후 업로드
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">
        {/* 자동 쇼츠 만들기 — 메인 흐름 */}
        <VideoCreationWizard />

        {/* 사용 전 확인 원칙 */}
        <section className="rounded-xl border border-amber-800/40 bg-amber-900/10 px-5 py-4">
          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">사용 전 확인</div>
          <ul className="space-y-2">
            {PRINCIPLES.map((p, i) => (
              <li key={i} className="flex gap-2 text-xs text-amber-200">
                <span className="text-amber-500 shrink-0 mt-0.5">·</span>
                {p}
              </li>
            ))}
          </ul>
        </section>

        {/* 세부 점검 도구 (고급) */}
        <OperatorPanel />

        {/* 고급 도구 */}
        <section>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">고급 도구</div>
          <p className="text-[11px] text-slate-600 mb-3">
            기본 흐름은 위의 자동 만들기입니다. 아래는 필요할 때만 쓰는 전문가용 화면입니다.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ADVANCED_TOOLS.map((tool) => (
              <div
                key={tool.href}
                className="rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-3 flex flex-col gap-2"
              >
                <div>
                  <div className="font-semibold text-xs text-slate-300">{tool.title}</div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{tool.desc}</p>
                </div>
                <Link
                  href={tool.href}
                  className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-lg border border-slate-700/60 bg-slate-800/30 text-slate-400 hover:bg-slate-800/60 text-[11px] font-semibold transition-colors"
                >
                  {tool.label} →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* 최신 기준금리 초안 — 클릭할 때만 데이터를 불러온다 */}
        <section className="rounded-xl border border-blue-800/40 bg-blue-900/10 px-5 py-4">
          <div className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-2">
            최신 기준금리 후보 만들기
          </div>
          <p className="text-xs text-blue-200/70 mb-3 leading-relaxed">
            한국은행 데이터를 불러와 기준금리 관련 쇼츠 후보를 만듭니다. 클릭할 때만 데이터를 불러오며, 바로
            업로드하지 않고 초안으로만 보여줍니다.
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
            맨 위의 자동 만들기에서 새 쇼츠 만들기를 시작해, 주제 추천부터 대본·음성·시안 영상·미리보기·게시 전
            점검까지 버튼으로 진행할 수 있습니다. 실제 업로드는 마지막 단계에서 확인 절차(체크 2개 + “업로드” 입력)를
            마쳐야만 실행됩니다.
          </p>
        </section>
      </main>
    </div>
  );
}
