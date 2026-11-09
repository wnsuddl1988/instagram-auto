import Link from "next/link";

type PreviewPageProps = {
  searchParams: Promise<{ topicId?: string; part?: string; sha256?: string }>;
};

function safeTopicId(value: string | undefined): string | null {
  if (!value || !/^[a-z0-9_-]{4,160}$/i.test(value)) return null;
  return value;
}

function safeSha256(value: string | undefined): string | null {
  if (!value || !/^[a-f0-9]{64}$/.test(value)) return null;
  return value;
}

export default async function MoneyShortsPreviewPage({ searchParams }: PreviewPageProps) {
  const { topicId: rawTopicId, part: rawPart, sha256: rawSha256 } = await searchParams;
  const topicId = safeTopicId(rawTopicId);
  const sha256 = safeSha256(rawSha256);
  const part = rawPart === "single" || rawPart === "part-1" || rawPart === "part-2" ? rawPart : "single";
  if (!topicId || !sha256) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
        <div className="mx-auto max-w-md">
          <h1 className="text-xl font-bold">미리볼 영상을 찾지 못했습니다.</h1>
          <p className="mt-2 text-[15px] text-slate-600">자동 쇼츠 만들기 화면에서 만든 영상의 크게 보기 링크를 사용해 주세요.</p>
          <Link className="mt-5 inline-flex text-sm font-semibold text-indigo-700 hover:underline" href="/money-shorts">
            자동 쇼츠 만들기로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const videoSrc = `/api/money-shorts/operator?video=final&topicId=${encodeURIComponent(topicId)}&part=${part}&sha256=${sha256}`;
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-50">
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-300">
              완성 영상 미리보기{part === "part-1" ? " · 1편" : part === "part-2" ? " · 2편" : ""}
            </p>
            <p className="mt-0.5 text-sm text-slate-400">이 화면에서는 업로드되지 않습니다.</p>
          </div>
          <Link className="text-sm font-semibold text-slate-200 hover:underline" href="/money-shorts">
            돌아가기
          </Link>
        </div>
        <video
          controls
          playsInline
          preload="auto"
          className="w-full rounded-lg bg-black shadow-2xl"
          src={videoSrc}
        >
          이 브라우저는 MP4 재생을 지원하지 않습니다.
        </video>
      </div>
    </main>
  );
}
