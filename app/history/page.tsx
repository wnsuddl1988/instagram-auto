"use client";

import { useEffect, useState } from "react";
import HistoryTable from "@/components/HistoryTable";
import { Generation } from "@/lib/supabase";

export default function HistoryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => {
        setGenerations(data.generations || []);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("이력 로드 오류:", error);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 glass-card border-b border-slate-800/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                📋 생성 이력
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                지금까지 생성한 모든 스크립트의 이력을 확인하세요
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HistoryTable generations={generations} isLoading={isLoading} />
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
