"use client";

import { useState } from "react";
import Link from "next/link";
import CategorySelector from "@/components/CategorySelector";
import SettingsPanel, { GenerateSettings } from "@/components/SettingsPanel";
import ScriptPreview from "@/components/ScriptPreview";
import UploadPanel from "@/components/UploadPanel";
import { GeneratedScript } from "@/lib/openai";

interface GeneratedScriptResult extends GeneratedScript {
  id?: string;
  categoryId: string;
  categoryName: string;
  categoryEmoji: string;
  image?: any;
  video_path?: string;
}

export default function Home() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [scripts, setScripts] = useState<GeneratedScriptResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCategoryChange = (ids: string[]) => {
    setSelectedCategories(ids);
  };

  const handleGenerate = async (settings: GenerateSettings) => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryIds: selectedCategories,
          duration: settings.duration,
          tone: settings.tone,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "API 호출 실패");
      }

      const data = await response.json();
      setScripts(data.scripts);
    } catch (error) {
      console.error("스크립트 생성 오류:", error);
      alert("스크립트 생성에 실패했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditScript = (index: number, field: string, value: string) => {
    setScripts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRenderSuccess = (index: number, videoUrl: string) => {
    setScripts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], video_path: videoUrl };
      return updated;
    });
  };

  const handleRegenerateScript = async (index: number) => {
    // TODO: 개별 스크립트 재생성 기능 구현
    alert("개별 재생성 기능은 추후 구현 예정입니다.");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 glass-card border-b border-slate-800/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                🎬 AutoShorts AI
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                AI가 카테고리만 선택하면 쇼츠를 자동 생성합니다
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <Link
                href="/history"
                className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 text-sm font-medium transition-colors"
              >
                📋 이력
              </Link>
              <div className="text-right">
                <p className="text-xs text-slate-500">프리미엄 대시보드</p>
                <p className="text-sm font-semibold text-indigo-400">v1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 카테고리 선택 */}
          <div className="lg:col-span-2">
            <CategorySelector onChange={handleCategoryChange} />
          </div>

          {/* 오른쪽: 설정 & 생성 */}
          <div className="lg:col-span-1">
            <SettingsPanel
              selectedCategories={selectedCategories}
              onGenerate={handleGenerate}
            />
          </div>
        </div>

        {/* 생성된 스크립트 미리보기 */}
        <ScriptPreview
          scripts={scripts}
          isLoading={isGenerating}
          onEdit={handleEditScript}
          onRegenerate={handleRegenerateScript}
          onRenderSuccess={handleRenderSuccess}
        />

        {/* 스크립트별 업로드 패널 */}
        {scripts.length > 0 && (
          <div className="mt-12 space-y-8">
            {scripts.map((script, index) => (
              <div key={index} className="mt-8">
                <UploadPanel
                  generationId={script.id}
                  videoPath={script.video_path}
                  title={script.title}
                  script={script.script}
                  hashtags={script.hashtags || []}
                  imageUrl={script.image?.src?.large}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="border-t border-slate-800/50 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
          <p>© 2026 AutoShorts AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
