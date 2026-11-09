"use client";

import { useState } from "react";
import { Generation } from "@/lib/supabase";

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  generated: { label: "생성완료", color: "text-slate-300", bgColor: "bg-slate-600/30" },
  rendered: { label: "영상완료", color: "text-blue-300", bgColor: "bg-blue-600/30" },
  uploaded: { label: "업로드됨", color: "text-green-300", bgColor: "bg-green-600/30" },
  failed: { label: "실패", color: "text-red-300", bgColor: "bg-red-600/30" },
};

interface HistoryTableProps {
  generations: Generation[];
  isLoading: boolean;
}

export default function HistoryTable({
  generations,
  isLoading,
}: HistoryTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="glass-card p-8 rounded-3xl border border-slate-700/50">
        <div className="flex items-center justify-center gap-3">
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-300">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!generations || generations.length === 0) {
    return (
      <div className="glass-card p-8 rounded-3xl border border-slate-700/50 text-center text-slate-400">
        생성된 이력이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto glass-card rounded-3xl border border-slate-700/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                날짜
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                카테고리
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                제목
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                상태
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                액션
              </th>
            </tr>
          </thead>
          <tbody>
            {generations.map((gen) => {
              const config = statusConfig[gen.status || "generated"];
              const isExpanded = expandedId === gen.id;

              return (
                <tr key={gen.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-300">
                    {gen.created_at
                      ? new Date(gen.created_at).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="text-xl mr-2">{gen.category_emoji}</span>
                    <span className="text-slate-300">{gen.category_name}</span>
                  </td>
                  <td className="px-6 py-4 text-sm max-w-xs">
                    <p className="text-slate-300 truncate">{gen.title}</p>
                    {/* meta_snapshot 배지 — DB 컬럼 추가 후 자동 활성화, null-safe */}
                    {gen.meta_snapshot && (gen.meta_snapshot.accountPresetName || gen.meta_snapshot.subTopicName) && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {gen.meta_snapshot.accountPresetName && (
                          <span className="text-[9px] px-1.5 py-px rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/25 leading-none whitespace-nowrap">
                            {gen.meta_snapshot.accountPresetName}
                          </span>
                        )}
                        {gen.meta_snapshot.subTopicName && (
                          <span className="text-[9px] px-1.5 py-px rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/30 leading-none whitespace-nowrap">
                            {gen.meta_snapshot.subTopicName}
                          </span>
                        )}
                        {gen.meta_snapshot.topicMode && (
                          <span className="text-[9px] px-1.5 py-px rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 leading-none whitespace-nowrap">
                            {gen.meta_snapshot.topicMode}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                      {config.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : gen.id || null)}
                      className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                      {isExpanded ? "닫기" : "보기"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {expandedId && (
        <div className="glass-card p-8 rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
          {(() => {
            const gen = generations.find((g) => g.id === expandedId);
            if (!gen) return null;

            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{gen.title}</h3>
                  <button
                    onClick={() => setExpandedId(null)}
                    className="text-slate-400 hover:text-slate-300"
                  >
                    ✕
                  </button>
                </div>

                {gen.image_url && (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden">
                    <img
                      src={gen.image_url}
                      alt="스크립트 이미지"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">
                      톤
                    </label>
                    <p className="text-slate-200">{gen.tone}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">
                      길이
                    </label>
                    <p className="text-slate-200">{gen.duration}초</p>
                  </div>
                </div>

                {gen.hook && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                    <label className="text-xs text-yellow-300 font-medium mb-2 block">
                      🎣 첫 3초 후킹
                    </label>
                    <p className="text-yellow-100 text-sm">{gen.hook}</p>
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate-400 mb-2 block">
                    📝 스크립트
                  </label>
                  <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                    {gen.script}
                  </p>
                </div>

                {gen.call_to_action && (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                    <label className="text-xs text-green-300 font-medium mb-2 block">
                      👇 CTA
                    </label>
                    <p className="text-green-100 text-sm">{gen.call_to_action}</p>
                  </div>
                )}

                {gen.hashtags && gen.hashtags.length > 0 && (
                  <div>
                    <label className="text-xs text-slate-400 mb-2 block">
                      #️⃣ 해시태그
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {gen.hashtags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full bg-blue-600/30 text-blue-300 text-xs font-medium border border-blue-500/30"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
