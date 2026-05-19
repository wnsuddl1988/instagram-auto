"use client";

import { useState } from "react";

interface SettingsPanelProps {
  selectedCategories: string[];
  onGenerate?: (settings: GenerateSettings) => void;
}

export interface GenerateSettings {
  duration: number;
  tone: string;
  language: string;
}

export default function SettingsPanel({
  selectedCategories,
  onGenerate,
}: SettingsPanelProps) {
  const [duration, setDuration] = useState<number>(30);
  const [tone, setTone] = useState<string>("유머");
  const [isLoading, setIsLoading] = useState(false);

  const toneOptions = ["유머", "정보전달", "충격", "감성"];

  const handleGenerate = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (selectedCategories.length === 0) {
      alert("최소 1개 이상의 카테고리를 선택해주세요.");
      return;
    }

    setIsLoading(true);
    const settings: GenerateSettings = {
      duration,
      tone,
      language: "한국어",
    };

    onGenerate?.(settings);

    // 시뮬레이션: 2초 후 로딩 해제
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="w-full">
      <div className="glass-card p-8 rounded-3xl">
        {/* 타이틀 */}
        <h2 className="text-2xl font-bold text-white mb-6">⚙️ 쇼츠 설정</h2>

        {/* 영상 길이 선택 */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-300 mb-4">
            📹 영상 길이
          </label>
          <div className="flex gap-3">
            {[15, 30, 60].map((sec) => (
              <button
                key={sec}
                onClick={(e) => {
                  e.stopPropagation();
                  setDuration(sec);
                }}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  duration === sec
                    ? "bg-indigo-600 text-white neon-glow"
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
                }`}
              >
                {sec}초
              </button>
            ))}
          </div>
        </div>

        {/* 톤 선택 */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-300 mb-4">
            🎭 톤 선택
          </label>
          <div className="grid grid-cols-2 gap-3">
            {toneOptions.map((t) => (
              <button
                key={t}
                onClick={(e) => {
                  e.stopPropagation();
                  setTone(t);
                }}
                className={`py-3 rounded-xl font-medium transition-all ${
                  tone === t
                    ? "bg-purple-600 text-white neon-glow"
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 언어 (고정) */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-300 mb-4">
            🌐 언어
          </label>
          <div className="py-3 px-4 rounded-xl bg-slate-700/50 text-slate-300 text-sm">
            🇰🇷 한국어 (고정)
          </div>
          <p className="text-xs text-slate-500 mt-2">
            * 추후 다국어 지원 예정
          </p>
        </div>

        {/* 생성 버튼 */}
        <button
          onClick={(e) => handleGenerate(e)}
          disabled={isLoading || selectedCategories.length === 0}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
            isLoading || selectedCategories.length === 0
              ? "bg-slate-700/50 text-slate-400 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white neon-glow hover:shadow-2xl active:scale-95"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              AI가 스크립트를 작성 중...
            </div>
          ) : (
            "🎬 쇼츠 생성하기"
          )}
        </button>

        {/* 정보 텍스트 */}
        <p className="text-xs text-slate-500 text-center mt-4">
          * 카테고리 {selectedCategories.length}개 선택됨
        </p>
      </div>
    </div>
  );
}
