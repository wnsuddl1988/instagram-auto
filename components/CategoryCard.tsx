"use client";

import { Category } from "@/lib/categories";
import { Star } from "lucide-react";

interface CategoryCardProps {
  category: Category;
  selected: boolean;
  onClick: () => void;
}

export default function CategoryCard({
  category,
  selected,
  onClick,
}: CategoryCardProps) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.stopPropagation();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      style={{
        border: selected ? `2px solid ${category.color}` : undefined,
        boxShadow: selected
          ? `0 0 16px ${category.color}66, 0 0 32px ${category.color}33`
          : undefined,
        transform: selected ? "translateY(-4px)" : "translateY(0)",
        overflow: "hidden",
        isolation: "isolate",
      }}
      className={`glass-card group p-6 rounded-2xl cursor-pointer h-full transition-all duration-300 hover:-translate-y-1 ${
        selected ? "neon-glow" : ""
      }`}
    >
      {/* 배경 그라데이션 */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity bg-gradient-to-br ${category.gradient}`}
      ></div>

      <div className="relative z-10">
        {/* 이모지 */}
        <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
          {category.emoji}
        </div>

        {/* 카테고리 이름 */}
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
          {category.name}
        </h3>

        {/* 설명 */}
        <p className="text-sm text-slate-400 mb-4 group-hover:text-slate-300 transition-colors">
          {category.description}
        </p>

        {/* 조회수 별점 */}
        <div className="flex items-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              className={`${
                i < category.viewPotential
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-slate-600"
              }`}
            />
          ))}
          <span className="text-xs text-slate-400 ml-2">
            조회율: {category.viewPotential}/5
          </span>
        </div>

        {/* 태그 뱃지 */}
        <div className="flex flex-wrap gap-2">
          {category.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 rounded-full bg-slate-700/50 text-slate-300 hover:bg-indigo-600/50 transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 선택 표시 */}
        {selected && (
          <div className="mt-4 pt-4 border-t border-slate-600/50">
            <p className="text-xs text-indigo-400 font-medium">✓ 선택됨</p>
          </div>
        )}
      </div>
    </div>
  );
}
