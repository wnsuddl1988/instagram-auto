/**
 * publish-ledger-runtime.mjs — dependency-free read-only runtime adapter
 *
 * task: publish-ledger-runtime-readonly-orchestrator-bridge-no-live-v1
 *
 * 목적:
 * - orchestrator(.mjs)가 durable publish ledger JSON을 안정적으로 read-only 소비하도록 한다.
 * - `lib/publish-ledger.ts`는 TypeScript 계약이고 orchestrator는 plain Node ESM(.mjs)이라,
 *   런타임에서 `.ts` 직접 import(트랜스파일 의존)는 불안정하다. 이 adapter는 의존성 추가 없이
 *   `lib/publish-ledger.ts`의 **read 계약을 정확히 미러링**한 read-only 함수만 제공한다.
 *
 * 불변 조건(이 slice, read-only):
 * - import 시점에 파일/네트워크/env/credential 접근을 하지 않는다(순수 정의만).
 * - read는 caller가 명시적으로 넘긴 `ledgerPath`에서만 일어난다. default/production 경로 없음.
 * - write/mutation을 절대 하지 않는다(writeFileSync/appendFileSync/rename/mkdir/insert/upsert 없음).
 * - 외부 API/OAuth/Blob/upload/deploy/media/ffmpeg 부작용 없음. 로컬 JSON read + JSON.parse만.
 * - secret 값(token/secret/key/OAuth/raw env, 값 length/prefix/suffix/hash/masked)은 저장/반환/출력 0.
 * - read는 fail-closed: 파일 없음 → 빈 ledger ok:true, invalid JSON/wrong schema/non-array records
 *   /invalid record shape/duplicate key → ok:false + reason(쓰기 없음).
 *
 * 계약 정합 근거(반드시 lib/publish-ledger.ts와 일치 유지):
 * - PUBLISH_LEDGER_SCHEMA_VERSION === "publish_ledger_v1"
 * - PUBLISH_LEDGER_PLATFORMS === ["instagram_reels","youtube_shorts"]
 * - buildPublishLedgerKey === `${contentId}/${platform}/${version}`
 * - readPublishLedger fail-closed reason 코드 동일
 */

import { existsSync, readFileSync } from "node:fs";

// ── 상수 계약(lib/publish-ledger.ts와 정합) ──────────────────────────────────
export const PUBLISH_LEDGER_SCHEMA_VERSION = "publish_ledger_v1";
export const PUBLISH_LEDGER_PLATFORMS = Object.freeze(["instagram_reels", "youtube_shorts"]);
export const PUBLISH_LEDGER_STATUS = Object.freeze(["published"]);

// ── 키 빌더(orchestrator publishKey와 동일 shape) ────────────────────────────
/** `${contentId}/${platform}/${version}` — orchestrator publishKey와 동일. 순수 함수. */
export function buildPublishLedgerKey(contentId, platform, version) {
  return `${contentId}/${platform}/${version}`;
}

// ── 내부 검증 헬퍼(lib/publish-ledger.ts 미러) ───────────────────────────────
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** record가 최소 필수 필드/타입/허용값을 만족하는지 검사(shape 검증, secret 검사 아님). */
function isValidRecordShape(value) {
  if (!isPlainObject(value)) return false;
  const r = value;
  if (typeof r.key !== "string" || r.key === "") return false;
  if (typeof r.contentId !== "string" || r.contentId === "") return false;
  if (typeof r.version !== "string" || r.version === "") return false;
  if (typeof r.platform !== "string" || !PUBLISH_LEDGER_PLATFORMS.includes(r.platform)) return false;
  if (typeof r.publishedId !== "string" || r.publishedId === "") return false;
  if (typeof r.status !== "string" || !PUBLISH_LEDGER_STATUS.includes(r.status)) return false;
  if (typeof r.publishedAtIso !== "string" || r.publishedAtIso === "") return false;
  // key가 (contentId/platform/version)과 정합해야 한다(위조 방지).
  const expectedKey = `${r.contentId}/${r.platform}/${r.version}`;
  if (r.key !== expectedKey) return false;
  return true;
}

function emptyLedger() {
  return { schemaVersion: PUBLISH_LEDGER_SCHEMA_VERSION, records: [] };
}

// ── read (fail-closed, read-only) ────────────────────────────────────────────
/**
 * 명시적 `ledgerPath`에서 ledger를 read-only로 읽는다. lib/publish-ledger.ts#readPublishLedger의
 * fail-closed 계약을 그대로 미러링한다. 반환:
 * { ok, ledger, existed, reason? } — ledger는 실패 시 빈 ledger. write 없음.
 */
export function readPublishLedgerReadOnly(ledgerPath) {
  const empty = emptyLedger();
  if (!ledgerPath || typeof ledgerPath !== "string") {
    return { ok: false, ledger: empty, existed: false, reason: "read_error" };
  }
  if (!existsSync(ledgerPath)) {
    // 파일이 없는 것은 정상 — 아직 아무것도 게시되지 않은 상태다.
    return { ok: true, ledger: empty, existed: false };
  }

  let raw;
  try {
    raw = readFileSync(ledgerPath, "utf8");
  } catch {
    return { ok: false, ledger: empty, existed: true, reason: "read_error" };
  }

  let parsed;
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
  const seen = new Set();
  for (const rec of parsed.records) {
    if (seen.has(rec.key)) {
      return { ok: false, ledger: empty, existed: true, reason: "duplicate_key_in_records" };
    }
    seen.add(rec.key);
  }

  return {
    ok: true,
    ledger: { schemaVersion: PUBLISH_LEDGER_SCHEMA_VERSION, records: parsed.records },
    existed: true,
  };
}

// ── duplicate 판정(read-only) ────────────────────────────────────────────────
/**
 * ledger에서 (contentId/platform/version) 키가 이미 published인지 판정한다.
 * secret 값을 반환하지 않는다 — alreadyPublished/key + 매칭 record의 public id만.
 */
export function checkLedgerDuplicate(ledger, contentId, platform, version) {
  const key = buildPublishLedgerKey(contentId, platform, version);
  const records = isPlainObject(ledger) && Array.isArray(ledger.records) ? ledger.records : [];
  const record = records.find((r) => r.key === key) ?? null;
  return {
    key,
    alreadyPublished: record != null,
    // 매칭 record가 있으면 public id만 노출(secret 없음). 없으면 null.
    publishedIdReference: record != null && typeof record.publishedId === "string" ? record.publishedId : null,
  };
}

/**
 * content unit의 IG/YT 두 플랫폼에 대해 ledger read + duplicate 판정을 한 번에 수행한다.
 * orchestrator gate 4가 소비할 read-only 요약을 반환한다(secret 없음).
 *
 * @param {string|null} ledgerPath  caller가 넘긴 명시적 경로. null이면 read 미시도(bridge 비활성).
 * @param {string} contentId
 * @param {string} version
 * @returns {{
 *   pathProvided: boolean,
 *   readAttempted: boolean,
 *   readOk: boolean,
 *   existed: boolean,
 *   reason: string|null,
 *   recordCount: number,
 *   instagramKey: string,
 *   youtubeKey: string,
 *   instagramAlreadyPublished: boolean,
 *   youtubeAlreadyPublished: boolean,
 *   instagramPublishedIdReference: string|null,
 *   youtubePublishedIdReference: string|null,
 *   anyDuplicate: boolean,
 * }}
 */
export function evaluateLedgerDuplicateForUnit(ledgerPath, contentId, version) {
  const igKey = buildPublishLedgerKey(contentId, "instagram_reels", version);
  const ytKey = buildPublishLedgerKey(contentId, "youtube_shorts", version);

  if (ledgerPath == null) {
    // bridge 비활성(경로 미제공) — 기존 동작 완전 보존. read 미시도, duplicate 판정 없음.
    return {
      pathProvided: false,
      readAttempted: false,
      readOk: true,
      existed: false,
      reason: null,
      recordCount: 0,
      instagramKey: igKey,
      youtubeKey: ytKey,
      instagramAlreadyPublished: false,
      youtubeAlreadyPublished: false,
      instagramPublishedIdReference: null,
      youtubePublishedIdReference: null,
      anyDuplicate: false,
    };
  }

  const read = readPublishLedgerReadOnly(ledgerPath);
  if (!read.ok) {
    // fail-closed: read 실패 시 duplicate 판정을 신뢰할 수 없다. anyDuplicate는 false로 두되
    // readOk:false를 caller가 보고 credential 이전에 별도 fail-closed 처리한다.
    return {
      pathProvided: true,
      readAttempted: true,
      readOk: false,
      existed: read.existed === true,
      reason: typeof read.reason === "string" ? read.reason : "read_error",
      recordCount: 0,
      instagramKey: igKey,
      youtubeKey: ytKey,
      instagramAlreadyPublished: false,
      youtubeAlreadyPublished: false,
      instagramPublishedIdReference: null,
      youtubePublishedIdReference: null,
      anyDuplicate: false,
    };
  }

  const ig = checkLedgerDuplicate(read.ledger, contentId, "instagram_reels", version);
  const yt = checkLedgerDuplicate(read.ledger, contentId, "youtube_shorts", version);
  return {
    pathProvided: true,
    readAttempted: true,
    readOk: true,
    existed: read.existed === true,
    reason: null,
    recordCount: Array.isArray(read.ledger.records) ? read.ledger.records.length : 0,
    instagramKey: igKey,
    youtubeKey: ytKey,
    instagramAlreadyPublished: ig.alreadyPublished === true,
    youtubeAlreadyPublished: yt.alreadyPublished === true,
    instagramPublishedIdReference:
      ig.publishedIdReference,
    youtubePublishedIdReference:
      yt.publishedIdReference,
    anyDuplicate: ig.alreadyPublished === true || yt.alreadyPublished === true,
  };
}
