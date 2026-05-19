"use client";

import { useState } from "react";

interface UploadPanelProps {
  generationId?: string;
  videoPath?: string;
  title: string;
  script: string;
  hashtags: string[];
  imageUrl?: string;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";
type Platform = "instagram" | "youtube";

export default function UploadPanel({
  generationId,
  videoPath,
  title,
  hashtags,
  imageUrl,
}: UploadPanelProps) {
  const [platforms, setPlatforms] = useState<Set<Platform>>(new Set());
  const [caption, setCaption] = useState(title);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [results, setResults] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const togglePlatform = (platform: Platform) => {
    const newSet = new Set(platforms);
    if (newSet.has(platform)) {
      newSet.delete(platform);
    } else {
      newSet.add(platform);
    }
    setPlatforms(newSet);
  };

  const handleUpload = async () => {
    if (platforms.size === 0) {
      setError("플랫폼을 1개 이상 선택해주세요.");
      return;
    }

    setStatus("uploading");
    setError(null);

    // 실제 렌더링 완료된 비디오 동영상이 존재하면 그것을 1순위 타겟으로 배포
    const targetUrl = videoPath || imageUrl || "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg";

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationId,
          platform: platforms.size === 1 ? Array.from(platforms)[0] : "both",
          videoUrl: targetUrl,
          caption,
          title,
          hashtags,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "업로드 실패");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "업로드 처리 중 에러 발생");
      }
      
      setResults(data.results);
      setStatus("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setStatus("error");
    }
  };

  return (
    <div className="glass-card p-8 rounded-3xl border border-slate-700/50 space-y-6">
      {/* 제목 */}
      <div className="flex items-center gap-3">
        <h3 className="text-2xl font-bold text-white">📤 업로드</h3>
      </div>

      {/* 플랫폼 선택 */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-slate-300">
          플랫폼 선택
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={platforms.has("instagram")}
              onChange={() => togglePlatform("instagram")}
              className="w-4 h-4 rounded border-slate-500"
            />
            <span className="text-slate-300">📱 인스타그램 릴스</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={platforms.has("youtube")}
              onChange={() => togglePlatform("youtube")}
              className="w-4 h-4 rounded border-slate-500"
              disabled
            />
            <span className="text-slate-400">🎬 유튜브 쇼츠 (준비중)</span>
          </label>
        </div>
      </div>

      {/* 캡션 편집 */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-slate-300">
          캡션 편집
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full h-24 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 resize-none"
          placeholder="캡션을 입력하세요"
        />
        <div className="text-xs text-slate-400">
          해시태그: {hashtags.map((h) => `#${h}`).join(" ")}
        </div>
      </div>

      {/* 업로드 상태 */}
      {status !== "idle" && (
        <div className={`p-4 rounded-xl border ${
          status === "uploading" ? "bg-blue-500/10 border-blue-500/30" :
          status === "success" ? "bg-green-500/10 border-green-500/30" :
          "bg-red-500/10 border-red-500/30"
        }`}>
          {status === "uploading" && (
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-300">업로드 중...</span>
            </div>
          )}
          {status === "success" && (
            <div className="space-y-2">
              <div className="text-green-300 font-medium">✅ 업로드 완료</div>
              {results.instagramPostId && (
                <a
                  href={`https://instagram.com/p/${results.instagramPostId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300 text-sm underline"
                >
                  📱 Instagram 게시물 보기
                </a>
              )}
            </div>
          )}
          {status === "error" && (
            <div className="text-red-300">{error || "업로드 실패"}</div>
          )}
        </div>
      )}

      {/* 업로드 버튼 */}
      <button
        onClick={handleUpload}
        disabled={platforms.size === 0 || status === "uploading"}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-indigo-500 hover:to-purple-500 transition-all"
      >
        {status === "uploading" ? "업로드 중..." : "업로드 시작"}
      </button>
    </div>
  );
}
