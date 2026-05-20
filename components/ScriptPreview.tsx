"use client";

import { useState } from "react";
import { GeneratedScript } from "@/lib/openai";
import { CATEGORIES } from "@/lib/categories";

const getGradientColor = (categoryId: string): string => {
  const category = CATEGORIES.find((c) => c.id === categoryId);
  return category?.color || "#818cf8";
};

interface PexelsPhoto {
  src: { portrait: string; large: string };
  photographer: string;
  url: string;
}

interface GeneratedScriptResult extends GeneratedScript {
  categoryId: string;
  categoryName: string;
  categoryEmoji: string;
  image?: PexelsPhoto | null;
}

interface ScriptPreviewProps {
  scripts: GeneratedScriptResult[];
  isLoading: boolean;
  onEdit: (index: number, field: string, value: string) => void;
  onRegenerate: (index: number) => void;
  onRenderSuccess: (index: number, videoUrl: string) => void; // 합성 성공 시 콜백
}

export default function ScriptPreview({
  scripts,
  isLoading,
  onEdit,
  onRegenerate,
  onRenderSuccess,
}: ScriptPreviewProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [renderStatus, setRenderStatus] = useState<Record<number, "idle" | "rendering" | "success" | "error">>({});
  const [renderedVideos, setRenderedVideos] = useState<Record<number, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRenderVideo = async (index: number, scriptItem: GeneratedScriptResult) => {
    setRenderStatus((prev) => ({ ...prev, [index]: "rendering" }));
    setErrorMessage(null);

    const safeId = scriptItem.id || `gen_${Date.now()}`;

    try {
      const response = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: safeId,
          title: scriptItem.title,
          script: scriptItem.script,
          imageUrl: scriptItem.image?.src?.large,
          scenes: scriptItem.scenes, // 멀티 비디오 씬 배열 정보 통째 전송
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "영상 합성 API 에러");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "영상 합성 실패");
      }

      setRenderedVideos((prev) => ({ ...prev, [index]: data.videoUrl }));
      setRenderStatus((prev) => ({ ...prev, [index]: "success" }));
      onRenderSuccess(index, data.videoUrl); // 상위 페이지 상태 갱신
    } catch (err: any) {
      console.error("영상 렌더링 에러:", err);
      setErrorMessage(err.message || "영상 합성 도중 에러가 발생했습니다.");
      setRenderStatus((prev) => ({ ...prev, [index]: "error" }));
    }
  };

  if (!isLoading && scripts.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        ✨ 생성된 스크립트
      </h2>

      {isLoading && (
        <div className="glass-card p-8 rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-purple-900/20">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-300 font-medium">🤖 AI가 스크립트를 작성 중...</p>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-6 bg-slate-700/30 rounded-lg animate-pulse"></div>
                <div className="h-20 bg-slate-700/30 rounded-lg animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading &&
        scripts.map((script, index) => (
          <div
            key={index}
            className="glass-card overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-purple-500/10"
          >
            {/* 이미지 영역 */}
            {script.image && (
              <div className="relative w-full h-48">
                <img
                  src={script.image.src.large}
                  alt="배경 이미지"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                <span className="absolute bottom-2 right-2 text-xs text-white/60">
                  📷 {script.image.photographer} (Pexels)
                </span>
              </div>
            )}
            {!script.image && (
              <div
                className="w-full h-48 flex items-center justify-center text-6xl"
                style={{
                  background: `linear-gradient(135deg, ${getGradientColor(script.categoryId)}1a, ${getGradientColor(script.categoryId)}0d)`,
                }}
              >
                {script.categoryEmoji}
              </div>
            )}

            {/* 컨텐츠 영역 */}
            <div className="p-8">
              {/* 카테고리 헤더 */}
              <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{script.categoryEmoji}</span>
              <span className="px-3 py-1 rounded-full bg-indigo-600/30 text-indigo-300 text-sm font-medium">
                {script.categoryName}
              </span>
            </div>

            {/* 제목 */}
            <div className="mb-6">
              <label className="block text-xs text-slate-400 mb-2">
                📌 제목 (클릭하고 싶게)
              </label>
              <input
                type="text"
                value={script.title}
                onChange={(e) => onEdit(index, "title", e.target.value)}
                className="w-full text-xl font-bold bg-slate-700/30 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>

            {/* 후킹 멘트 */}
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <label className="block text-xs text-yellow-300 font-medium mb-2">
                🎣 첫 3초 후킹 멘트 (강렬하게!)
              </label>
              <p className="text-yellow-100 text-sm leading-relaxed">
                {script.hook}
              </p>
            </div>

            {/* 본문 스크립트 */}
            <div className="mb-6">
              <label className="block text-xs text-slate-400 mb-2">
                📝 본문 스크립트
              </label>
              <textarea
                value={script.script}
                onChange={(e) => onEdit(index, "script", e.target.value)}
                className="w-full bg-slate-700/30 border border-slate-600/50 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 resize-none min-h-32 font-mono text-sm leading-relaxed"
                style={{ height: "auto", minHeight: "128px" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = Math.max(target.scrollHeight, 128) + "px";
                }}
              />
            </div>

            {/* CTA */}
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <label className="block text-xs text-green-300 font-medium mb-2">
                👇 팔로우/구독 유도 멘트
              </label>
              <p className="text-green-100 text-sm leading-relaxed">
                {script.callToAction}
              </p>
            </div>

            {/* 해시태그 */}
            <div className="mb-6">
              <label className="block text-xs text-slate-400 mb-2">
                #️⃣ 해시태그
              </label>
              <div className="flex flex-wrap gap-2">
                {script.hashtags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-blue-600/30 text-blue-300 text-xs font-medium border border-blue-500/30"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 예상 재생 시간 */}
            <div className="mb-6 text-xs text-slate-400">
              ⏱️ 예상 재생 시간: {script.estimatedDuration}초
            </div>

            {/* 🎬 영상 렌더링 (합성) 영역 */}
            <div className="mb-6 p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-200">🎬 9:16 비디오 합성 엔진</h4>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${
                  renderStatus[index] === "rendering" ? "bg-blue-500/20 text-blue-400 animate-pulse" :
                  renderStatus[index] === "success" ? "bg-green-500/20 text-green-400" :
                  renderStatus[index] === "error" ? "bg-red-500/20 text-red-400" :
                  "bg-slate-700 text-slate-400"
                }`}>
                  {renderStatus[index] === "rendering" ? "합성 중..." :
                   renderStatus[index] === "success" ? "합성 완료" :
                   renderStatus[index] === "error" ? "에러 발생" :
                   "합성 대기"}
                </span>
              </div>

              {/* 렌더링 중 상태 바 */}
              {renderStatus[index] === "rendering" && (
                <div className="space-y-2">
                  <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-[shimmer_1.5s_infinite]" style={{ width: "85%", backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }}></div>
                  </div>
                  <p className="text-xs text-slate-400 text-center">로컬 파이썬 엔진에서 TTS 목소리와 자막을 합성하고 있습니다. 잠시만 기다려주세요...</p>
                </div>
              )}

              {/* 에러 메시지 피드백 */}
              {renderStatus[index] === "error" && errorMessage && (
                <div className="p-3 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg">
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* 합성 완료 시 HTML5 9:16 모바일 쇼츠 플레이어 출력 */}
              {renderStatus[index] === "success" && renderedVideos[index] && (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <p className="text-xs text-green-400 font-medium">🎉 완성작이 성공적으로 인코딩되었습니다!</p>
                  <div className="relative w-[280px] h-[497px] rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-black">
                    <video
                      src={renderedVideos[index]}
                      controls
                      className="w-full h-full object-cover"
                      poster={script.image?.src?.large}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={() => handleRenderVideo(index, script)}
                disabled={renderStatus[index] === "rendering"}
                className={`w-full py-3 rounded-xl font-bold transition-all active:scale-[0.98] ${
                  renderStatus[index] === "success" 
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {renderStatus[index] === "rendering" ? "⚙️ 로컬 비디오 합성 인코딩 중..." :
                 renderStatus[index] === "success" ? "🎬 다시 비디오 합성하기" :
                 "🎬 9:16 비디오 합성(렌더링) 시작"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* 재생성 버튼 */}
              <button
                onClick={() => onRegenerate(index)}
                className="w-full py-3 rounded-xl font-medium transition-all bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 active:scale-95"
              >
                🔄 대본 재생성
              </button>
            </div>
          </div>
          </div>
        ))}
    </div>
  );
}
