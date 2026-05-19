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
}

export default function ScriptPreview({
  scripts,
  isLoading,
  onEdit,
  onRegenerate,
}: ScriptPreviewProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

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

              {/* 재생성 버튼 */}
              <button
                onClick={() => onRegenerate(index)}
                className="w-full py-3 rounded-xl font-medium transition-all bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 active:scale-95"
              >
                🔄 재생성
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}
