/**
 * topicHistory.ts — localStorage 기반 주제 사용 히스토리
 *
 * 키: autoshorts:v2:topic-history
 * 최대 50개 보관 (FIFO)
 * 유료 API 호출 없음 — 순수 브라우저 로컬 유틸
 */

const STORAGE_KEY = "autoshorts:v2:topic-history";
const MAX_ENTRIES = 50;

/** plan._meta에서 추출한 경량 스냅샷 — localStorage 크기 절약용 */
export interface TopicMetaSnapshot {
  categoryName?: string;
  subTopicName?: string;
  concreteTopic?: string;
  customTopic?: string;
  accountPresetId?: string;
  accountPresetName?: string;
}

export interface TopicHistoryEntry {
  categoryId: string;
  subTopicId: string;
  topicMode: "preset" | "custom" | "random";
  topic: string;      // 실제 주제 문자열 (preset/custom/random 모두 기록)
  createdAt: string;  // ISO 8601
  /** plan._meta 경량 스냅샷 — 없으면 구버전 항목 */
  metaSnapshot?: TopicMetaSnapshot;
}

/** 저장된 히스토리 전체 읽기 */
export function readTopicHistory(): TopicHistoryEntry[] {
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

/** 새 항목 추가 (앞에 삽입, 최대 MAX_ENTRIES 유지) */
export function appendTopicHistory(entry: Omit<TopicHistoryEntry, "createdAt">): void {
  if (typeof window === "undefined") return;
  const history = readTopicHistory();
  const newEntry: TopicHistoryEntry = { ...entry, createdAt: new Date().toISOString() };
  // 최신순 정렬 유지
  const updated = [newEntry, ...history].slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage 쓰기 실패(용량 초과 등)는 무시
  }
}

/** 특정 category + subTopic 범위의 항목만 삭제 */
export function clearTopicHistoryBySubTopic(categoryId: string, subTopicId: string): void {
  if (typeof window === "undefined") return;
  const history = readTopicHistory();
  const filtered = history.filter(
    (e) => !(e.categoryId === categoryId && e.subTopicId === subTopicId)
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {}
}

/** 전체 히스토리 삭제 */
export function clearAllTopicHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/**
 * 가장 최근 항목(index 0)의 topic을 newTopic으로 덮어쓴다.
 * preset/random 모드에서 생성 성공 후 plan.topTitle로 갱신할 때 사용.
 * 조건: categoryId + subTopicId가 일치해야만 업데이트 (엉뚱한 항목 덮어쓰기 방지).
 */
export function updateLastTopicEntry(
  categoryId: string,
  subTopicId: string,
  newTopic: string
): void {
  if (typeof window === "undefined") return;
  const history = readTopicHistory();
  if (!history.length) return;
  const latest = history[0];
  // 같은 소주제의 가장 최근 항목만 업데이트
  if (latest.categoryId === categoryId && latest.subTopicId === subTopicId) {
    history[0] = { ...latest, topic: newTopic };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {}
  }
}

// ── 유틸 ─────────────────────────────────────────────────────────────────────

/** 공백/문장부호 제거 normalize (중복 비교용) */
function normalizeTopic(topic: string): string {
  return topic
    .replace(/[\s ]+/g, "")          // 공백 제거
    .replace(/[.,!?·…。、！？]/g, "")      // 문장부호 제거
    .toLowerCase();
}

/**
 * 현재 subTopic 범위 내 최근 N개에서 중복 여부 확인
 * @returns 중복이면 true
 */
export function isDuplicateTopic(
  topic: string,
  categoryId: string,
  subTopicId: string,
  recentCount = 10
): boolean {
  if (!topic.trim()) return false;
  const norm = normalizeTopic(topic);
  const history = readTopicHistory()
    .filter((e) => e.categoryId === categoryId && e.subTopicId === subTopicId)
    .slice(0, recentCount);
  return history.some((e) => normalizeTopic(e.topic) === norm);
}

/**
 * 특정 category + subTopic 범위의 최근 N개 히스토리 반환
 */
export function getRecentTopics(
  categoryId: string,
  subTopicId: string,
  limit = 5
): TopicHistoryEntry[] {
  return readTopicHistory()
    .filter((e) => e.categoryId === categoryId && e.subTopicId === subTopicId)
    .slice(0, limit);
}

// ── 내보내기 / 가져오기 ───────────────────────────────────────────────────────

/**
 * 현재 히스토리를 JSON Blob으로 반환한다.
 * 브라우저 환경에서만 사용 (클라이언트 이벤트 핸들러 안에서 호출).
 * @returns { blob, filename } 또는 데이터 없으면 null
 */
export function exportHistoryAsBlob(): { blob: Blob; filename: string } | null {
  const history = readTopicHistory();
  if (!history.length) return null;
  const json = JSON.stringify(history, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return { blob, filename: `autoshorts-topic-history-${date}.json` };
}

/** 가져오기 검증 결과 */
export interface ImportResult {
  ok: boolean;
  added: number;       // 새로 병합된 항목 수
  skipped: number;     // 중복으로 건너뛴 항목 수
  error?: string;      // 검증 실패 메시지
}

/**
 * JSON 텍스트를 파싱 → 검증 → 기존 히스토리와 병합한다.
 * 중복 기준: normalize(topic) + categoryId + subTopicId
 */
export function importAndMergeHistory(jsonText: string): ImportResult {
  // 1. 파싱
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { ok: false, added: 0, skipped: 0, error: "JSON 형식이 올바르지 않습니다." };
  }

  // 2. 배열 검증
  if (!Array.isArray(parsed)) {
    return { ok: false, added: 0, skipped: 0, error: "JSON이 배열이어야 합니다." };
  }

  // 3. 각 항목 최소 필드 검증
  const valid: TopicHistoryEntry[] = [];
  for (const item of parsed) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as Record<string, unknown>).categoryId !== "string" ||
      typeof (item as Record<string, unknown>).topic !== "string" ||
      typeof (item as Record<string, unknown>).createdAt !== "string"
    ) {
      return {
        ok: false,
        added: 0,
        skipped: 0,
        error: "항목 형식이 올바르지 않습니다. categoryId, topic, createdAt 필드가 필요합니다.",
      };
    }
    const row = item as Record<string, unknown>;
    // metaSnapshot: optional — 있으면 string 필드만 유지 (하위 호환)
    let metaSnapshot: TopicMetaSnapshot | undefined;
    if (row.metaSnapshot && typeof row.metaSnapshot === "object") {
      const ms = row.metaSnapshot as Record<string, unknown>;
      metaSnapshot = {};
      if (typeof ms.categoryName === "string") metaSnapshot.categoryName = ms.categoryName;
      if (typeof ms.subTopicName === "string") metaSnapshot.subTopicName = ms.subTopicName;
      if (typeof ms.concreteTopic === "string") metaSnapshot.concreteTopic = ms.concreteTopic;
      if (typeof ms.customTopic === "string") metaSnapshot.customTopic = ms.customTopic;
      if (typeof ms.accountPresetId === "string") metaSnapshot.accountPresetId = ms.accountPresetId;
      if (typeof ms.accountPresetName === "string") metaSnapshot.accountPresetName = ms.accountPresetName;
      if (Object.keys(metaSnapshot).length === 0) metaSnapshot = undefined;
    }
    valid.push({
      categoryId: row.categoryId as string,
      subTopicId: typeof row.subTopicId === "string" ? row.subTopicId : "",
      topicMode: (["preset", "custom", "random"].includes(row.topicMode as string)
        ? row.topicMode
        : "custom") as TopicHistoryEntry["topicMode"],
      topic: row.topic as string,
      createdAt: row.createdAt as string,
      ...(metaSnapshot ? { metaSnapshot } : {}),
    });
  }

  // 4. 기존 히스토리와 병합 (중복 제거)
  const existing = readTopicHistory();
  const existingKeys = new Set(
    existing.map((e) => `${e.categoryId}|${e.subTopicId}|${normalizeTopic(e.topic)}`)
  );

  let added = 0;
  let skipped = 0;
  const toAdd: TopicHistoryEntry[] = [];
  for (const entry of valid) {
    const key = `${entry.categoryId}|${entry.subTopicId}|${normalizeTopic(entry.topic)}`;
    if (existingKeys.has(key)) {
      skipped++;
    } else {
      existingKeys.add(key);
      toAdd.push(entry);
      added++;
    }
  }

  // 5. 합친 뒤 createdAt 내림차순 정렬, MAX_ENTRIES 제한
  const merged = [...toAdd, ...existing]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_ENTRIES);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    return { ok: false, added: 0, skipped: 0, error: "localStorage 저장 실패 (용량 초과 가능)." };
  }

  return { ok: true, added, skipped };
}
