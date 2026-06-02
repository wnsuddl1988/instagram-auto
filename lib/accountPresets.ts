/**
 * accountPresets.ts — localStorage 기반 계정 운영 프리셋
 *
 * 키: autoshorts:v2:account-presets
 * 유료 API 호출 없음 — 순수 브라우저 로컬 유틸
 */

const STORAGE_KEY = "autoshorts:v2:account-presets";

export interface AccountPreset {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  preferredSubTopicIds: string[];   // 선호 소주제 (순서대로 우선)
  targetAudience: string;           // 타겟 독자
  toneMemo: string;                 // 톤/말투 메모
  bannedTopics: string[];           // 금지 소재
  createdAt: string;
  updatedAt: string;
}

// ── 기본 추천 프리셋 ─────────────────────────────────────────────────────────

export const DEFAULT_PRESETS: Omit<AccountPreset, "createdAt" | "updatedAt">[] = [
  {
    id: "preset_default_life",
    name: "50대 생활꿀팁 계정",
    description: "50~60대가 바로 써먹는 생활/건강/절약 팁",
    categoryId: "life-hacks-v2",
    preferredSubTopicIds: ["food-storage", "kitchen-cleaning", "fridge-organization", "storage-organization"],
    targetAudience: "50~60대 한국 여성",
    toneMemo: "친근하고 실용적으로, 과장 금지",
    bannedTopics: ["검증 안 된 건강 정보", "공포 마케팅"],
  },
  {
    id: "preset_default_emotional",
    name: "감동사연 계정",
    description: "짧고 진한 감동 사연으로 공감과 눈물을 이끄는 계정",
    categoryId: "emotional-stories",
    preferredSubTopicIds: ["parents-children", "couple-love", "hospital-care", "elderly-life"],
    targetAudience: "30~50대 감성 위주 시청자",
    toneMemo: "담백하게 사실을 전달, 과장 없이 감동",
    bannedTopics: ["혐오 표현", "정치적 내용"],
  },
  {
    id: "preset_default_ai",
    name: "AI 활용팁 계정",
    description: "직장인과 크리에이터를 위한 AI 도구 활용법",
    categoryId: "ai-creator-tools",
    preferredSubTopicIds: ["image-generation", "shorts-automation", "work-automation", "prompt-writing"],
    targetAudience: "20~40대 직장인 / 부업 희망자",
    toneMemo: "실용적이고 간결하게, 전문 용어 남발 금지",
    bannedTopics: ["AI 과장 광고", "검증 안 된 수익 주장"],
  },
];

// ── CRUD ─────────────────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

/** 저장된 프리셋 전체 읽기 */
export function readPresets(): AccountPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** 초기 로드: localStorage가 비어있으면 기본 프리셋 3개를 시드한다 */
export function initPresetsIfEmpty(): AccountPreset[] {
  if (typeof window === "undefined") return [];
  const existing = readPresets();
  if (existing.length > 0) return existing;
  const seeded: AccountPreset[] = DEFAULT_PRESETS.map((p) => ({
    ...p,
    createdAt: now(),
    updatedAt: now(),
  }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  } catch {}
  return seeded;
}

/** 새 프리셋 저장 */
export function savePreset(preset: Omit<AccountPreset, "id" | "createdAt" | "updatedAt">): AccountPreset {
  const presets = readPresets();
  const newPreset: AccountPreset = {
    ...preset,
    id: `preset_${Date.now()}`,
    createdAt: now(),
    updatedAt: now(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...presets, newPreset]));
  } catch {}
  return newPreset;
}

/** 프리셋 업데이트 */
export function updatePreset(id: string, patch: Partial<Omit<AccountPreset, "id" | "createdAt">>): void {
  const presets = readPresets();
  const idx = presets.findIndex((p) => p.id === id);
  if (idx < 0) return;
  presets[idx] = { ...presets[idx], ...patch, updatedAt: now() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {}
}

/** 프리셋 삭제 */
export function deletePreset(id: string): void {
  const presets = readPresets().filter((p) => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {}
}
