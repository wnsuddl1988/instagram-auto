"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import CategoryCard from "./CategoryCard";

interface CategorySelectorProps {
  onChange: (ids: string[]) => void;
}

export default function CategorySelector({ onChange }: CategorySelectorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      let next: string[];
      if (prev.includes(id)) {
        next = prev.filter((i) => i !== id);
      } else {
        if (prev.length >= 3) {
          alert("최대 3개까지 선택 가능합니다.");
          return prev;
        }
        next = [...prev, id];
      }
      setTimeout(() => onChange(next), 0);
      return next;
    });
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          📋 카테고리 선택
        </h2>
        <p className="text-slate-400 text-sm">
          최대 3개까지 선택 가능
          <span className="ml-3 inline-block px-3 py-1 rounded-full bg-indigo-600/30 text-indigo-300 text-xs font-medium">
            선택됨: {selectedIds.length}/3
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {CATEGORIES.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            selected={selectedIds.includes(category.id)}
            onClick={() => handleToggle(category.id)}
          />
        ))}
      </div>
    </div>
  );
}
