/**
 * publish-ledger-runtime-write.mjs — dependency-free runtime ledger WRITER helper
 *
 * task: dual-platform-dispatcher-fake-adapter-ledger-harness-no-live-v1
 *
 * 목적:
 * - fake-adapter dispatcher harness가 `lib/publish-ledger.ts`의 **write/all-or-nothing 계약을
 *   정확히 미러링**한 상태로 ledger 기록 조건을 검증하도록 한다.
 * - `lib/publish-ledger.ts`는 TypeScript 계약이고 harness는 plain Node ESM(.mjs)이라, 런타임에서
 *   `.ts` 직접 import(트랜스파일 의존)는 불안정하다. 의존성 추가 없이 동일 계약을 제공한다.
 *
 * ★ read-only bridge와의 분리(중요) ★
 * - `lib/publish-ledger-runtime.mjs`(read-only bridge)는 이 모듈을 import하지 않으며, 앞으로도 안 된다.
 * - orchestrator(`scripts/run-dual-platform-final-publish-orchestrator.mjs`)도 이 모듈을 import하지 않는다.
 *   orchestrator gate 4 bridge는 read-only 계약을 유지해야 한다(guard가 강제).
 * - 이 slice에서 이 모듈의 유일한 consumer는 fake-adapter harness이며, OS temp 경로에만 쓴다.
 *
 * 불변 조건:
 * - import 시점에 파일/네트워크/env/credential 접근을 하지 않는다(순수 정의만).
 * - write는 caller가 명시적으로 넘긴 `ledgerPath`에서만 일어난다. default/production 경로 없음.
 * - 외부 API/OAuth/Blob/upload/deploy/media/ffmpeg 부작용 없음. 로컬 JSON write만.
 * - process.env를 읽지 않는다(단, atomic temp 파일명 유일성을 위해 process.pid만 사용 —
 *   lib/publish-ledger.ts와 동일한 방식이며 env 값 접근이 아니다).
 * - secret 값(token/secret/key/OAuth/raw env, 값 length/prefix/suffix/hash/masked)은 저장/반환/출력 0.
 * - all-or-nothing: 두 platform key 중 하나라도 중복이거나 shape 무효면 어떤 record도 삽입하지 않는다.
 * - atomic write: 같은 디렉토리 temp file → renameSync로 원자적 replace(partial write 없음).
 *
 * 계약 정합 근거(반드시 lib/publish-ledger.ts와 일치 유지):
 * - PUBLISH_LEDGER_SCHEMA_VERSION === "publish_ledger_v1"
 * - buildPublishLedgerKey === `${contentId}/${platform}/${version}`
 * - writePublishLedger: records를 key 정렬 후 deterministic JSON + atomic rename
 * - recordDualPlatformPublish: all-or-nothing(anyDuplicateBlocked → 원본 ledger 그대로)
 */

import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

import {
  PUBLISH_LEDGER_PLATFORMS,
  PUBLISH_LEDGER_SCHEMA_VERSION,
  PUBLISH_LEDGER_STATUS,
  buildPublishLedgerKey,
} from "./publish-ledger-runtime.mjs";

// 상수는 read-only adapter의 계약을 그대로 재수출한다(단일 진실 원천 유지).
export { PUBLISH_LEDGER_SCHEMA_VERSION, PUBLISH_LEDGER_PLATFORMS, buildPublishLedgerKey };

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
  const expectedKey = `${r.contentId}/${r.platform}/${r.version}`;
  if (r.key !== expectedKey) return false;
  return true;
}

function createEmptyLedger() {
  return { schemaVersion: PUBLISH_LEDGER_SCHEMA_VERSION, records: [] };
}

// ── write (atomic, explicit path only) ───────────────────────────────────────
/**
 * 명시적 `ledgerPath`에 ledger를 atomic하게 쓴다. lib/publish-ledger.ts#writePublishLedger 미러링.
 * - caller가 path를 명시해야만 쓴다(default/production 경로 없음).
 * - records를 key 기준 정렬해 deterministic 출력.
 * - 같은 디렉토리 temp file → renameSync로 atomic replace(반쯤 쓰인 파일 없음).
 * - 실패 시 temp file 정리(best-effort).
 *
 * @returns {{ok: boolean, reason?: string}}
 */
export function writePublishLedgerRuntime(ledgerPath, ledger) {
  if (!ledgerPath || typeof ledgerPath !== "string") {
    return { ok: false, reason: "missing_ledger_path" };
  }
  if (!isPlainObject(ledger) || !Array.isArray(ledger.records)) {
    return { ok: false, reason: "invalid_ledger" };
  }
  const sortedRecords = [...ledger.records].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const serialized = { schemaVersion: PUBLISH_LEDGER_SCHEMA_VERSION, records: sortedRecords };
  const dir = dirname(ledgerPath);
  const tmpPath = join(dir || ".", `.${basename(ledgerPath)}.tmp-${process.pid}`);
  try {
    if (dir && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(tmpPath, JSON.stringify(serialized, null, 2) + "\n", "utf8");
    renameSync(tmpPath, ledgerPath); // atomic replace
    return { ok: true };
  } catch (e) {
    try { if (existsSync(tmpPath)) rmSync(tmpPath, { force: true }); } catch { /* 정리 실패는 무시 */ }
    return { ok: false, reason: e instanceof Error ? e.message : "write_error" };
  }
}

// ── duplicate check (in-memory) ──────────────────────────────────────────────
/** 주어진 (contentId/platform/version)이 ledger에 이미 있는지 판정(파일 IO 없음). */
export function checkDuplicateRuntime(ledger, contentId, platform, version) {
  const key = buildPublishLedgerKey(contentId, platform, version);
  const records = isPlainObject(ledger) && Array.isArray(ledger.records) ? ledger.records : [];
  const record = records.find((r) => r.key === key) ?? null;
  return { alreadyPublished: record !== null, key };
}

// ── dual publish record (all-or-nothing, in-memory) ──────────────────────────
/**
 * 양 플랫폼 게시 결과를 ledger에 **all-or-nothing**으로 기록한 새 ledger를 반환한다.
 * lib/publish-ledger.ts#recordDualPlatformPublish 계약을 정확히 미러링한다.
 *
 * all-or-nothing(부분 기록 방지):
 * - IG/YT key를 먼저 둘 다 계산한다.
 * - 기존 ledger에서 둘 중 하나라도 이미 있으면 어떤 record도 추가하지 않고 원본 ledger를 그대로
 *   반환한다(anyDuplicateBlocked:true, ok:false). caller가 실패 ledger를 write해도 partial 기록이 없다.
 * - 두 key 모두 중복 없고 shape 유효할 때만 두 record를 모두 추가한 새 ledger를 반환한다(ok:true).
 *
 * 파일 IO 없음(순수 in-memory). 입력 ledger를 mutate하지 않는다.
 * secret 값을 받지도/저장하지도/반환하지도 않는다 — public id/url/variant/시각/non-secret metadata만.
 */
export function recordDualPlatformPublishRuntime(ledger, input) {
  const base = isPlainObject(ledger) && Array.isArray(ledger.records) ? ledger : createEmptyLedger();

  const igEntry = {
    key: buildPublishLedgerKey(input.contentId, "instagram_reels", input.version),
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
  const ytEntry = {
    key: buildPublishLedgerKey(input.contentId, "youtube_shorts", input.version),
    contentId: input.contentId,
    platform: "youtube_shorts",
    version: input.version,
    variantId: input.youtube.variantId,
    publishedId: input.youtube.publishedId,
    publishedUrl: input.youtube.publishedUrl,
    status: "published",
    publishedAtIso: input.youtube.publishedAtIso,
    metadata: input.youtube.metadata,
  };

  const igDup = checkDuplicateRuntime(base, input.contentId, "instagram_reels", input.version);
  const ytDup = checkDuplicateRuntime(base, input.contentId, "youtube_shorts", input.version);

  const igShapeValid = isValidRecordShape(igEntry);
  const ytShapeValid = isValidRecordShape(ytEntry);
  const anyDuplicateBlocked = igDup.alreadyPublished || ytDup.alreadyPublished;
  const bothInsertable = !anyDuplicateBlocked && igShapeValid && ytShapeValid;

  const instagram = { ok: bothInsertable && igShapeValid, duplicateBlocked: igDup.alreadyPublished, key: igEntry.key };
  const youtube = { ok: bothInsertable && ytShapeValid, duplicateBlocked: ytDup.alreadyPublished, key: ytEntry.key };

  if (!bothInsertable) {
    // all-or-nothing: 하나라도 중복이거나 shape 무효면 원본 ledger 그대로(partial 기록 방지).
    return { ok: false, ledger: base, instagram, youtube, anyDuplicateBlocked };
  }

  const nextLedger = {
    schemaVersion: PUBLISH_LEDGER_SCHEMA_VERSION,
    records: [...base.records, igEntry, ytEntry],
  };
  return { ok: true, ledger: nextLedger, instagram, youtube, anyDuplicateBlocked: false };
}
