/**
 * publish-ledger.ts — dual-platform publish 중복 방지 ledger (no-live / explicit-path / fail-closed)
 *
 * task: publish-ledger-implementation-no-live-v1
 * Owner approval: APPROVE_PUBLISH_LEDGER_IMPLEMENTATION_NO_LIVE
 *
 * 목적:
 * - 실제 dual-platform publish를 열기 전에 필요한 durable duplicate ledger 계약을 구현한다.
 * - ledger는 (contentId/platform/version) 키로 이미 게시된 콘텐츠를 기록/조회해 재게시를 막는다.
 * - orchestrator gate 6 dispatcher의 `publish_ledger_record` step이 미래에 참조할 실제 모듈이다
 *   (문자열 참조: "lib/publish-ledger.ts#recordDualPlatformPublish").
 *
 * 불변 조건(이 slice):
 * - 이 모듈은 import 시점에 파일/네트워크/env/credential 접근을 하지 않는다(순수 정의만).
 * - read/write는 caller가 명시적으로 넘긴 `ledgerPath`에서만 일어난다. default/production 경로 없음.
 * - 외부 API/OAuth/Blob/upload/deploy/media 부작용 없음. 로컬 filesystem JSON read/write만.
 * - secret 값(access/refresh token, client secret, API key, Blob token, OAuth 응답, raw env,
 *   값 length/prefix/suffix/hash/masked)은 절대 저장/반환/출력하지 않는다.
 * - read는 fail-closed다: 파일 없음 → 빈 ledger ok:true, invalid JSON/wrong schema/non-array records
 *   /duplicate key → ok:false + reason(쓰기 없음).
 *
 * 계약 근거:
 * - _ai/HANDOFF_NOW.md (publish-ledger-implementation-no-live-v1)
 * - scripts/fixtures/publish_ledger.sample.v1.json
 * - docs/dual-platform-final-publish-orchestrator.md
 */

import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

// ── 상수 계약 ────────────────────────────────────────────────────────────────

/** ledger schema 버전. read 시 이 값과 정확히 일치해야 한다(불일치 → fail-closed). */
export const PUBLISH_LEDGER_SCHEMA_VERSION = "publish_ledger_v1";

/** ledger가 허용하는 platform 값. 이 둘만 유효하다. */
export const PUBLISH_LEDGER_PLATFORMS = Object.freeze(["instagram_reels", "youtube_shorts"] as const);

/** ledger record가 가질 수 있는 status 값. */
export const PUBLISH_LEDGER_STATUS = Object.freeze(["published"] as const);

// ── 타입 계약 ────────────────────────────────────────────────────────────────

export type PublishLedgerPlatform = (typeof PUBLISH_LEDGER_PLATFORMS)[number];
export type PublishLedgerStatus = (typeof PUBLISH_LEDGER_STATUS)[number];

/** ledger 단일 record. secret 값을 담지 않는 non-secret identifier만. */
export interface PublishLedgerRecord {
  /** `${contentId}/${platform}/${version}` — 중복 판정 키. */
  key: string;
  contentId: string;
  platform: PublishLedgerPlatform;
  version: string;
  /** render variant id(예: instagram_reels_full_frame_1080x1920). non-secret. */
  variantId?: string;
  /** 플랫폼 공개 id(Instagram media_id / YouTube videoId). non-secret public identifier. */
  publishedId: string;
  /** 공개 URL(선택). non-secret. */
  publishedUrl?: string;
  status: PublishLedgerStatus;
  /** ISO8601 게시 시각. caller가 명시적으로 넘긴다(이 모듈은 시각을 생성하지 않는다). */
  publishedAtIso: string;
  /** non-secret identifier/fingerprint만 담는 메타데이터(선택). */
  metadata?: Record<string, string | number | boolean>;
}

/** ledger 전체 구조. deterministic JSON으로 직렬화된다. */
export interface PublishLedger {
  schemaVersion: string;
  records: PublishLedgerRecord[];
}

/** read 결과. fail-closed 계약을 표현한다. */
export interface PublishLedgerReadResult {
  ok: boolean;
  /** ok:true일 때만 신뢰 가능한 ledger. ok:false면 빈 ledger(쓰기에 사용 금지). */
  ledger: PublishLedger;
  /** 파일이 실제로 존재했는지(없으면 빈 ledger + ok:true). */
  existed: boolean;
  /** ok:false일 때의 실패 사유 코드. */
  reason?: PublishLedgerFailReason;
}

export type PublishLedgerFailReason =
  | "invalid_json"
  | "not_object"
  | "wrong_schema_version"
  | "records_not_array"
  | "record_shape_invalid"
  | "duplicate_key_in_records"
  | "read_error";

/** 중복 판정 결과. secret 값 없음. */
export interface PublishLedgerDuplicateResult {
  alreadyPublished: boolean;
  key: string;
  /** 이미 있으면 매칭 record, 없으면 null. */
  record: PublishLedgerRecord | null;
}

/** record 삽입 결과. */
export interface PublishLedgerRecordResult {
  ok: boolean;
  ledger: PublishLedger;
  /** 이미 같은 key가 있어 삽입이 거부됐으면 true(중복 방지). */
  duplicateBlocked: boolean;
  key: string;
}

/** recordDualPlatformPublish 입력. 양 플랫폼 게시 결과를 한 번에 기록한다. */
export interface DualPlatformPublishInput {
  contentId: string;
  version: string;
  /** Instagram 게시 결과(public media id). */
  instagram: {
    publishedId: string;
    publishedUrl?: string;
    variantId?: string;
    publishedAtIso: string;
    metadata?: Record<string, string | number | boolean>;
  };
  /** YouTube 게시 결과(public video id). */
  youtube: {
    publishedId: string;
    publishedUrl?: string;
    variantId?: string;
    publishedAtIso: string;
    metadata?: Record<string, string | number | boolean>;
  };
}

export interface DualPlatformPublishResult {
  ok: boolean;
  ledger: PublishLedger;
  /** 두 플랫폼 각각의 삽입 결과. */
  instagram: PublishLedgerRecordResult;
  youtube: PublishLedgerRecordResult;
  /** 둘 중 하나라도 중복이라 차단됐으면 true. */
  anyDuplicateBlocked: boolean;
}

// ── 키/빈 ledger 빌더 ─────────────────────────────────────────────────────────

/**
 * 중복 판정 키를 만든다. orchestrator와 동일한 shape `${contentId}/${platform}/${version}`.
 * 예: "t1_lifestyle_inflation/instagram_reels/v3_2".
 * 순수 함수 — 파일/네트워크 접근 없음.
 */
export function buildPublishLedgerKey(input: {
  contentId: string;
  platform: PublishLedgerPlatform;
  version: string;
}): string {
  return `${input.contentId}/${input.platform}/${input.version}`;
}

/** 빈 ledger를 만든다(schemaVersion + 빈 records). 파일 IO 없음. */
export function createEmptyPublishLedger(): PublishLedger {
  return { schemaVersion: PUBLISH_LEDGER_SCHEMA_VERSION, records: [] };
}

// ── 검증 헬퍼(내부) ───────────────────────────────────────────────────────────

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** record가 최소 필수 필드/타입/허용값을 만족하는지 검사(shape 검증, secret 검사 아님). */
function isValidRecordShape(value: unknown): value is PublishLedgerRecord {
  if (!isPlainObject(value)) return false;
  const r = value as Record<string, unknown>;
  if (typeof r.key !== "string" || r.key === "") return false;
  if (typeof r.contentId !== "string" || r.contentId === "") return false;
  if (typeof r.version !== "string" || r.version === "") return false;
  if (typeof r.platform !== "string" || !(PUBLISH_LEDGER_PLATFORMS as readonly string[]).includes(r.platform)) return false;
  if (typeof r.publishedId !== "string" || r.publishedId === "") return false;
  if (typeof r.status !== "string" || !(PUBLISH_LEDGER_STATUS as readonly string[]).includes(r.status)) return false;
  if (typeof r.publishedAtIso !== "string" || r.publishedAtIso === "") return false;
  // key가 (contentId/platform/version)과 정합해야 한다(위조 방지).
  const expectedKey = `${r.contentId}/${r.platform}/${r.version}`;
  if (r.key !== expectedKey) return false;
  return true;
}

// ── read (fail-closed) ────────────────────────────────────────────────────────

/**
 * 명시적 `ledgerPath`에서 ledger를 읽는다. fail-closed 계약:
 * - 파일 없음 → 빈 ledger + ok:true + existed:false (throw 없음).
 * - invalid JSON / non-object / wrong schemaVersion / non-array records / invalid record shape
 *   / 중복 key → ok:false + reason (빈 ledger 반환, 쓰기 안 함).
 * 읽기 자체 외에는 아무 부작용도 없다.
 */
export function readPublishLedger(ledgerPath: string): PublishLedgerReadResult {
  const empty = createEmptyPublishLedger();
  if (!ledgerPath || typeof ledgerPath !== "string") {
    return { ok: false, ledger: empty, existed: false, reason: "read_error" };
  }
  if (!existsSync(ledgerPath)) {
    // 파일이 없는 것은 정상 — 아직 아무것도 게시되지 않은 상태다.
    return { ok: true, ledger: empty, existed: false };
  }

  let raw: string;
  try {
    raw = readFileSync(ledgerPath, "utf8");
  } catch {
    return { ok: false, ledger: empty, existed: true, reason: "read_error" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, ledger: empty, existed: true, reason: "invalid_json" };
  }

  if (!isPlainObject(parsed)) {
    return { ok: false, ledger: empty, existed: true, reason: "not_object" };
  }
  if (parsed.schemaVersion !== PUBLISH_LEDGER_SCHEMA_VERSION) {
    return { ok: false, ledger: empty, existed: true, reason: "wrong_schema_version" };
  }
  if (!Array.isArray(parsed.records)) {
    return { ok: false, ledger: empty, existed: true, reason: "records_not_array" };
  }
  for (const rec of parsed.records) {
    if (!isValidRecordShape(rec)) {
      return { ok: false, ledger: empty, existed: true, reason: "record_shape_invalid" };
    }
  }
  // 중복 key 감지 — ledger 무결성이 깨진 상태이므로 fail-closed.
  const seen = new Set<string>();
  for (const rec of parsed.records as PublishLedgerRecord[]) {
    if (seen.has(rec.key)) {
      return { ok: false, ledger: empty, existed: true, reason: "duplicate_key_in_records" };
    }
    seen.add(rec.key);
  }

  return {
    ok: true,
    ledger: { schemaVersion: PUBLISH_LEDGER_SCHEMA_VERSION, records: parsed.records as PublishLedgerRecord[] },
    existed: true,
  };
}

// ── write (explicit path only) ────────────────────────────────────────────────

/**
 * 명시적 `ledgerPath`에 ledger를 deterministic JSON으로 쓴다.
 * - caller가 path를 명시해야만 쓴다(default/production 경로 없음).
 * - 그 path의 부모 디렉토리만 필요 시 생성한다.
 * - records를 key 기준으로 정렬해 deterministic 출력(재현 가능).
 * - append-only partial write 없음: 같은 디렉토리에 temp file을 먼저 쓴 뒤 `renameSync`로
 *   atomic replace한다(같은 filesystem 내 rename은 원자적 — 중단 시에도 기존 파일은 온전하거나
 *   완전히 새 내용이며, 반쯤 쓰인 파일이 남지 않는다). rename 실패 시 temp file을 정리한다.
 */
export function writePublishLedger(ledgerPath: string, ledger: PublishLedger): { ok: boolean; reason?: string } {
  if (!ledgerPath || typeof ledgerPath !== "string") {
    return { ok: false, reason: "missing_ledger_path" };
  }
  if (!isPlainObject(ledger) || !Array.isArray(ledger.records)) {
    return { ok: false, reason: "invalid_ledger" };
  }
  // deterministic: records를 key로 정렬해 직렬화(입력 순서 무관하게 동일 출력).
  const sortedRecords = [...ledger.records].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const serialized: PublishLedger = {
    schemaVersion: PUBLISH_LEDGER_SCHEMA_VERSION,
    records: sortedRecords,
  };
  const dir = dirname(ledgerPath);
  // 대상과 같은 디렉토리의 temp file(같은 filesystem 보장 → rename이 원자적).
  const tmpPath = join(dir || ".", `.${basename(ledgerPath)}.tmp-${process.pid}`);
  try {
    if (dir && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(tmpPath, JSON.stringify(serialized, null, 2) + "\n", "utf8");
    renameSync(tmpPath, ledgerPath); // atomic replace
    return { ok: true };
  } catch (e) {
    // rename/write 실패 시 반쯤 쓰인 temp file이 남지 않도록 정리(best-effort).
    try { if (existsSync(tmpPath)) rmSync(tmpPath, { force: true }); } catch { /* 정리 실패는 무시 */ }
    return { ok: false, reason: e instanceof Error ? e.message : "write_error" };
  }
}

// ── duplicate check ───────────────────────────────────────────────────────────

/**
 * 주어진 (contentId/platform/version)이 ledger에 이미 있는지 판정한다.
 * secret 값을 반환하지 않는다 — key + 매칭 record(non-secret)만.
 */
export function checkPublishLedgerDuplicate(
  ledger: PublishLedger,
  input: { contentId: string; platform: PublishLedgerPlatform; version: string },
): PublishLedgerDuplicateResult {
  const key = buildPublishLedgerKey(input);
  const records = isPlainObject(ledger) && Array.isArray(ledger.records) ? ledger.records : [];
  const record = records.find((r) => r.key === key) ?? null;
  return { alreadyPublished: record !== null, key, record };
}

// ── record insert (in-memory, 중복 차단) ──────────────────────────────────────

/**
 * ledger에 단일 record를 삽입한 새 ledger를 반환한다(입력 ledger를 mutate하지 않음).
 * 이미 같은 key가 있으면 삽입하지 않고 duplicateBlocked:true로 알린다(중복 방지).
 * 파일 IO 없음 — 순수 in-memory 연산.
 */
export function recordPublishLedgerEntry(
  ledger: PublishLedger,
  entry: PublishLedgerRecord,
): PublishLedgerRecordResult {
  const base = isPlainObject(ledger) && Array.isArray(ledger.records) ? ledger : createEmptyPublishLedger();
  if (!isValidRecordShape(entry)) {
    const rawKey = isPlainObject(entry) && typeof (entry as Record<string, unknown>).key === "string"
      ? ((entry as Record<string, unknown>).key as string)
      : "";
    return { ok: false, ledger: base, duplicateBlocked: false, key: rawKey };
  }
  const existing = base.records.find((r) => r.key === entry.key);
  if (existing) {
    // 중복 — 삽입 거부(fail-closed). 기존 ledger를 그대로 반환한다.
    return { ok: false, ledger: base, duplicateBlocked: true, key: entry.key };
  }
  const next: PublishLedger = {
    schemaVersion: PUBLISH_LEDGER_SCHEMA_VERSION,
    records: [...base.records, entry],
  };
  return { ok: true, ledger: next, duplicateBlocked: false, key: entry.key };
}

// ── future-facing dual-platform helper ────────────────────────────────────────

/**
 * 양 플랫폼(Instagram/YouTube) 게시 결과를 ledger에 **all-or-nothing**으로 기록한 새 ledger를 반환한다.
 * gate 6 dispatcher의 `publish_ledger_record` step이 미래에 참조할 helper다.
 *
 * all-or-nothing 계약(부분 기록 방지):
 * - Instagram key와 YouTube key를 먼저 둘 다 계산한다.
 * - 기존 ledger에서 둘 중 하나라도 이미 있으면 어떤 record도 추가하지 않고 **원본 ledger를 그대로 반환**한다
 *   (anyDuplicateBlocked:true, ok:false). 각 platform result는 자신의 duplicate 여부를 정확히 표시한다.
 * - 두 key 모두 중복이 없을 때만 두 record를 모두 추가한 새 ledger를 반환한다(ok:true).
 * - 이렇게 하면 caller가 실패 결과 ledger를 write해도 IG만 남는 partial 기록이 생기지 않는다.
 *
 * 이 함수는 in-memory ledger만 다룬다 — 파일 write는 하지 않는다(caller가 writePublishLedger로
 * 명시적 path에 저장). 입력 ledger를 mutate하지 않는다.
 *
 * secret 값을 받지도, 저장하지도, 반환하지도 않는다 — public id/url/variant/시각/non-secret metadata만.
 */
export function recordDualPlatformPublish(
  ledger: PublishLedger,
  input: DualPlatformPublishInput,
): DualPlatformPublishResult {
  const base = isPlainObject(ledger) && Array.isArray(ledger.records) ? ledger : createEmptyPublishLedger();

  const igEntry: PublishLedgerRecord = {
    key: buildPublishLedgerKey({ contentId: input.contentId, platform: "instagram_reels", version: input.version }),
    contentId: input.contentId,
    platform: "instagram_reels",
    version: input.version,
    variantId: input.instagram.variantId,
    publishedId: input.instagram.publishedId,
    publishedUrl: input.instagram.publishedUrl,
    status: "published",
    publishedAtIso: input.instagram.publishedAtIso,
    metadata: input.instagram.metadata,
  };
  const ytEntry: PublishLedgerRecord = {
    key: buildPublishLedgerKey({ contentId: input.contentId, platform: "youtube_shorts", version: input.version }),
    contentId: input.contentId,
    platform: "youtube_shorts",
    version: input.version,
    variantId: input.youtube.variantId,
    publishedId: input.youtube.publishedId,
    publishedUrl: input.youtube.publishedUrl,
    status: "published",
    publishedAtIso: input.youtube.publishedAtIso,
    metadata: input.youtube.metadata, // Finding 2: YouTube record에도 metadata 반영.
  };

  // 두 key 각각의 기존 중복 여부를 원본 ledger에서 판정한다(어느 것도 아직 삽입하지 않음).
  const igDup = checkPublishLedgerDuplicate(base, { contentId: input.contentId, platform: "instagram_reels", version: input.version });
  const ytDup = checkPublishLedgerDuplicate(base, { contentId: input.contentId, platform: "youtube_shorts", version: input.version });

  const igShapeValid = isValidRecordShape(igEntry);
  const ytShapeValid = isValidRecordShape(ytEntry);
  const anyDuplicateBlocked = igDup.alreadyPublished || ytDup.alreadyPublished;
  const bothInsertable = !anyDuplicateBlocked && igShapeValid && ytShapeValid;

  // 각 platform result는 자신의 상태를 정확히 표시한다(duplicate이면 삽입 안 됨).
  const instagram: PublishLedgerRecordResult = {
    ok: bothInsertable && igShapeValid,
    ledger: base,
    duplicateBlocked: igDup.alreadyPublished,
    key: igEntry.key,
  };
  const youtube: PublishLedgerRecordResult = {
    ok: bothInsertable && ytShapeValid,
    ledger: base,
    duplicateBlocked: ytDup.alreadyPublished,
    key: ytEntry.key,
  };

  if (!bothInsertable) {
    // all-or-nothing: 하나라도 중복이거나 shape 무효면 원본 ledger를 그대로 반환(partial 기록 방지).
    return { ok: false, ledger: base, instagram, youtube, anyDuplicateBlocked };
  }

  // 둘 다 삽입 가능 — 두 record를 모두 추가한 새 ledger를 반환(입력 unmutate).
  const nextLedger: PublishLedger = {
    schemaVersion: PUBLISH_LEDGER_SCHEMA_VERSION,
    records: [...base.records, igEntry, ytEntry],
  };
  return {
    ok: true,
    ledger: nextLedger,
    instagram: { ...instagram, ledger: nextLedger, ok: true },
    youtube: { ...youtube, ledger: nextLedger, ok: true },
    anyDuplicateBlocked: false,
  };
}
