import { HOME_PROBLEM_LAB_CONFIG } from "@/lib/home-problem-lab/config";
import { HOME_PROBLEM_LAB_DRY_RUN_TOPICS } from "@/lib/home-problem-lab/dry-run";

export default function HomeProblemLabPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-slate-50 px-6 py-10 text-slate-900">
      <p className="text-sm font-semibold text-teal-700">DRY RUN ONLY · Mock preflight · externalCalls=0</p>
      <h1 className="mt-2 text-3xl font-bold">{HOME_PROBLEM_LAB_CONFIG.channelName}</h1>
      <p className="mt-2 text-slate-600">{HOME_PROBLEM_LAB_CONFIG.characterName} · {HOME_PROBLEM_LAB_CONFIG.philosophy}</p>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">샘플 5개 · 루미 TTS 요청은 검증 전용</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          {HOME_PROBLEM_LAB_DRY_RUN_TOPICS.map((topic) => <li key={topic}>{topic}</li>)}
        </ul>
      </section>
      <p className="mt-6 text-sm text-slate-500">테스트 요청 · Mock preflight · 실제 오디오 없음 · 게시 불가 · 외부 호출 없음</p>
    </main>
  );
}
