#!/usr/bin/env node
/**
 * One-shot Instagram-only Part 2 recovery runner.
 *
 * The default mode is a local preflight. It never reads credentials or calls
 * the network. Armed mode is intentionally separate from the consumed original
 * dual-platform approval and requires an exact execution-preflight fingerprint.
 *
 * This runner never performs Blob PUT, YouTube, Part 1, database, or automatic
 * retry work. Production dependencies are fixed; fake adapters are reachable
 * only through the explicitly named test-only entry point.
 */

import { createHash } from "node:crypto";
import * as nodeFs from "node:fs";
import {
  basename,
  dirname,
  isAbsolute,
  relative,
  resolve,
} from "node:path";
import { fileURLToPath } from "node:url";

import {
  acquireMoneyShortsPart2InstagramRecoveryExecutionLock,
  buildMoneyShortsPart2InstagramRecoveryExecutionClaim,
  buildMoneyShortsPart2InstagramRecoveryExecutionEvent,
  buildMoneyShortsPart2InstagramRecoveryExecutionPlan,
  buildMoneyShortsPart2InstagramRecoveryExecutionPreflight,
  buildMoneyShortsPart2InstagramRecoveryExecutionResult,
  moneyShortsPart2InstagramRecoveryExecutionEventPath,
  moneyShortsPart2InstagramRecoveryExecutionPaths,
  releaseMoneyShortsPart2InstagramRecoveryExecutionLock,
  validateMoneyShortsPart2InstagramRecoveryExecutionAuthorization,
  validateMoneyShortsPart2InstagramRecoveryExecutionPreflight,
  validateMoneyShortsPart2InstagramRecoveryExecutionResult,
  writeMoneyShortsPart2InstagramRecoveryExecutionEvidenceOnce,
  zeroMoneyShortsPart2InstagramRecoveryExecutionCounters,
} from "../lib/money-shorts-part2-instagram-recovery-execution.mjs";
import {
  moneyShortsPart2DualPublishSafePaths,
} from "../lib/money-shorts-part2-dual-publish-safe.mjs";
import {
  buildPublishLedgerKey,
  parsePublishLedgerBytesReadOnly,
} from "../lib/publish-ledger-runtime.mjs";
import {
  recordPublishLedgerEntryRuntime,
  writePublishLedgerRuntime,
} from "../lib/publish-ledger-runtime-write.mjs";
import {
  createMoneyShortsInstagramContainerOnce,
  inspectMoneyShortsPart2DualPublishSafeCurrentContext,
} from "./run-money-shorts-part2-only-dual-publish-safe-v1.mjs";
import {
  MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_PREFLIGHT_INSPECTION,
  runMoneyShortsPart2InstagramRecoveryPreflight,
} from "./run-money-shorts-part2-instagram-recovery-preflight-v1.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(SCRIPT_PATH), "..");
const REPO_ROOT_REAL =
  typeof nodeFs.realpathSync.native === "function"
    ? nodeFs.realpathSync.native(REPO_ROOT)
    : nodeFs.realpathSync(REPO_ROOT);
const GRAPH_API_BASE =
  "https://graph.facebook.com/v25.0";
const INSTAGRAM_VARIANT_ID =
  "instagram_reels_full_frame_1080x1920";
const SHA256_RE = /^[a-f0-9]{64}$/;
const INSTAGRAM_ACCOUNT_ID_RE = /^[1-9][0-9]{5,31}$/;
const INSTAGRAM_PUBLIC_ID_RE = /^[1-9][0-9]{5,39}$/;
const MAX_RECONCILIATION_PAGES = 10;
const MAX_RECONCILIATION_ITEMS = 1_000;
const MAX_STATUS_POLLS = 24;
const STATUS_POLL_DELAY_MS = 5_000;
const INSTAGRAM_MEDIA_TYPES = new Set([
  "IMAGE",
  "VIDEO",
  "CAROUSEL_ALBUM",
]);
const INSTAGRAM_MEDIA_PRODUCT_TYPES = new Set([
  "AD",
  "FEED",
  "STORY",
  "REELS",
]);

const REVIEW_VALUE_FLAGS = Object.freeze([
  "--inspection",
  "--content-unit",
  "--ledger",
  "--out-dir",
  "--expected-content-id",
  "--expected-manifest-sha256",
  "--expected-source-sha256",
  "--expected-publication-attempt-fingerprint",
  "--expected-instagram-account-id",
  "--expected-youtube-channel-id",
  "--expected-original-safe-preflight-fingerprint",
  "--expected-original-safe-claim-fingerprint",
  "--expected-original-safe-result-fingerprint",
  "--expected-original-canonical-result-fingerprint",
  "--expected-original-plan-fingerprint",
  "--expected-original-safe-preflight-file-sha256",
  "--expected-original-safe-claim-file-sha256",
  "--expected-original-safe-result-file-sha256",
  "--expected-original-safe-latest-event-sha256",
  "--expected-original-canonical-attempt-claim-file-sha256",
  "--expected-original-canonical-latest-event-sha256",
  "--expected-original-canonical-result-file-sha256",
  "--expected-original-ledger-sha256",
  "--expected-original-blob-url-sha256",
  "--expected-original-recovery-fingerprint",
]);

const EXECUTION_ONLY_VALUE_FLAGS = Object.freeze([
  "--approval",
  "--recovery-out-dir",
  "--expected-review-preflight-fingerprint",
  "--expected-execution-preflight-fingerprint",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function nowIso() {
  return new Date().toISOString();
}

function isPlainObject(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function strictString(value) {
  return typeof value === "string" ? value : "";
}

function clone(value) {
  return structuredClone(value);
}

function pathInside(rootPath, candidatePath) {
  const rel = relative(
    resolve(rootPath).toLowerCase(),
    resolve(candidatePath).toLowerCase(),
  );
  return (
    rel === "" ||
    (!rel.startsWith("..") && !isAbsolute(rel))
  );
}

function resolveFutureRealPath(candidatePath) {
  let cursor = resolve(candidatePath);
  const missingSegments = [];
  while (!nodeFs.existsSync(cursor)) {
    const parent = dirname(cursor);
    if (parent === cursor) {
      throw new Error("recovery_path_root_unresolvable");
    }
    missingSegments.unshift(basename(cursor));
    cursor = parent;
  }
  const realExisting =
    typeof nodeFs.realpathSync.native === "function"
      ? nodeFs.realpathSync.native(cursor)
      : nodeFs.realpathSync(cursor);
  return resolve(realExisting, ...missingSegments);
}

function resolveExistingRealPath(candidatePath) {
  const absolute = resolve(candidatePath);
  if (!nodeFs.existsSync(absolute)) {
    throw new Error("existing_path_missing");
  }
  return resolve(
    typeof nodeFs.realpathSync.native === "function"
      ? nodeFs.realpathSync.native(absolute)
      : nodeFs.realpathSync(absolute),
  );
}

function buildInstagramCaption(metadata) {
  return [
    metadata?.captionFirstLineHook ?? "",
    "",
    metadata?.caption ?? "",
    "",
    metadata?.callToAction ?? "",
    "",
    (Array.isArray(metadata?.hashtags)
      ? metadata.hashtags
      : []
    )
      .map((tag) => `#${tag}`)
      .join(" "),
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseMoneyShortsPart2InstagramRecoveryExecutionArgs(
  argv,
) {
  const allowed = new Set([
    ...REVIEW_VALUE_FLAGS,
    ...EXECUTION_ONLY_VALUE_FLAGS,
  ]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--arm") {
      if (armed) {
        return {
          ok: false,
          reason:
            "PART2_INSTAGRAM_RECOVERY_EXECUTION_DUPLICATE_ARM",
        };
      }
      armed = true;
      continue;
    }
    if (token === "--retry" || token === "--execute") {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_FORBIDDEN_FLAG",
      };
    }
    if (
      !allowed.has(token) ||
      Object.hasOwn(values, token)
    ) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_UNKNOWN_OR_DUPLICATE_ARGUMENT",
      };
    }
    const value = argv[index + 1];
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.startsWith("--")
    ) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_ARGUMENT_VALUE_INVALID",
      };
    }
    values[token] = value;
    index += 1;
  }
  if (
    !REVIEW_VALUE_FLAGS.every(
      (flag) => typeof values[flag] === "string",
    ) ||
    values["--inspection"] !==
      MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_PREFLIGHT_INSPECTION ||
    typeof values["--approval"] !== "string" ||
    !isAbsolute(
      strictString(values["--recovery-out-dir"]),
    ) ||
    !SHA256_RE.test(
      strictString(
        values["--expected-review-preflight-fingerprint"],
      ),
    ) ||
    (armed &&
      !SHA256_RE.test(
        strictString(
          values[
            "--expected-execution-preflight-fingerprint"
          ],
        ),
      )) ||
    (!armed &&
      values[
        "--expected-execution-preflight-fingerprint"
      ] !== undefined)
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_EXECUTION_EXACT_ARGUMENTS_REQUIRED",
    };
  }
  return {
    ok: true,
    armed,
    approval: values["--approval"],
    expectedReviewPreflightFingerprint:
      values["--expected-review-preflight-fingerprint"],
    expectedExecutionPreflightFingerprint:
      values[
        "--expected-execution-preflight-fingerprint"
      ] ?? null,
    recoveryOutDir:
      resolve(values["--recovery-out-dir"]),
    contentUnitPath: values["--content-unit"],
    ledgerPath: values["--ledger"],
    outDir: values["--out-dir"],
    expectedContentId:
      values["--expected-content-id"],
    expectedManifestSha256:
      values["--expected-manifest-sha256"],
    expectedSourceSha256:
      values["--expected-source-sha256"],
    expectedPublicationAttemptFingerprint:
      values[
        "--expected-publication-attempt-fingerprint"
      ],
    expectedInstagramAccountId:
      values["--expected-instagram-account-id"],
    expectedYoutubeChannelId:
      values["--expected-youtube-channel-id"],
    reviewArgv: REVIEW_VALUE_FLAGS.flatMap((flag) => [
      flag,
      values[flag],
    ]),
  };
}

function resolveParsedPaths(parsed) {
  if (
    !isAbsolute(parsed.contentUnitPath) ||
    !isAbsolute(parsed.ledgerPath) ||
    !isAbsolute(parsed.outDir) ||
    !isAbsolute(parsed.recoveryOutDir)
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_EXECUTION_ABSOLUTE_PATHS_REQUIRED",
    };
  }
  let recoveryOutDir;
  let contentUnitPath;
  let ledgerPath;
  let outDir;
  try {
    recoveryOutDir = resolveFutureRealPath(
      parsed.recoveryOutDir,
    );
    contentUnitPath = resolveExistingRealPath(
      parsed.contentUnitPath,
    );
    ledgerPath = resolveExistingRealPath(
      parsed.ledgerPath,
    );
    outDir = resolveExistingRealPath(
      parsed.outDir,
    );
  } catch {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_EXECUTION_INPUT_PATH_UNRESOLVABLE",
    };
  }
  const paths = {
    contentUnitPath,
    ledgerPath,
    outDir,
    recoveryOutDir,
  };
  if (
    pathInside(REPO_ROOT_REAL, paths.recoveryOutDir) ||
    pathInside(paths.outDir, paths.recoveryOutDir) ||
    pathInside(paths.recoveryOutDir, paths.outDir) ||
    pathInside(
      paths.recoveryOutDir,
      paths.contentUnitPath,
    ) ||
    pathInside(paths.recoveryOutDir, paths.ledgerPath)
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_EXECUTION_RECOVERY_PATH_NOT_SEPARATE",
    };
  }
  return {
    ok: true,
    paths,
  };
}

function contextAuthorization(parsed) {
  return {
    expectedContentId: parsed.expectedContentId,
    expectedManifestSha256:
      parsed.expectedManifestSha256,
    expectedSourceSha256: parsed.expectedSourceSha256,
    expectedPublicationAttemptFingerprint:
      parsed.expectedPublicationAttemptFingerprint,
    expectedInstagramAccountId:
      parsed.expectedInstagramAccountId,
    expectedYoutubeChannelId:
      parsed.expectedYoutubeChannelId,
  };
}

function readJsonEvidence(path, fsImpl = nodeFs) {
  try {
    const bytes = Buffer.from(fsImpl.readFileSync(path));
    const evidence = JSON.parse(bytes.toString("utf8"));
    return {
      ok: isPlainObject(evidence),
      evidence,
      bytes,
      sha256: sha256(bytes),
    };
  } catch {
    return {
      ok: false,
      evidence: null,
      bytes: null,
      sha256: null,
    };
  }
}

function normalizePublicBlobUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const parsed = new URL(value);
    if (
      parsed.protocol !== "https:" ||
      parsed.username !== "" ||
      parsed.password !== "" ||
      parsed.port !== "" ||
      parsed.search !== "" ||
      parsed.hash !== ""
    ) {
      return null;
    }
    return {
      url: value,
      pathname: decodeURIComponent(
        parsed.pathname,
      ).replace(/^\/+/, ""),
      urlSha256: sha256(value),
    };
  } catch {
    return null;
  }
}

export function inspectMoneyShortsPart2InstagramRecoveryExecutionMaterial({
  paths,
  review,
  context,
  fsImpl = nodeFs,
}) {
  const safePaths =
    moneyShortsPart2DualPublishSafePaths(paths.outDir);
  const safeResult = readJsonEvidence(
    safePaths.resultPath,
    fsImpl,
  );
  const expectedOriginal =
    review?.preflight?.plan?.sourceAttemptEvidence
      ?.originalEvidence;
  const expectedBlob = review?.preflight?.plan?.blob;
  const publicBlob =
    safeResult.evidence?.publicState?.blob;
  const normalized = normalizePublicBlobUrl(
    publicBlob?.url,
  );
  const caption = buildInstagramCaption(
    context?.instagramMetadata,
  );
  if (
    safeResult.ok !== true ||
    safeResult.sha256 !==
      expectedOriginal?.safeResultFileSha256 ||
    safeResult.evidence?.resultFingerprint !==
      expectedOriginal?.safeResultFingerprint ||
    safeResult.evidence?.status !==
      "INSTAGRAM_CONTAINER_OUTCOME_UNKNOWN" ||
    !normalized ||
    normalized.urlSha256 !== expectedBlob?.urlSha256 ||
    normalized.pathname !== expectedBlob?.pathname ||
    publicBlob?.pathname !== expectedBlob?.pathname ||
    publicBlob?.status !== "uploaded" ||
    publicBlob?.headStatus !== 200 ||
    !strictString(
      publicBlob?.headContentType,
    ).startsWith("video/") ||
    caption.length === 0
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_EXECUTION_MATERIAL_INVALID",
    };
  }
  return {
    ok: true,
    blobUrl: normalized.url,
    blobUrlSha256: normalized.urlSha256,
    blobPathname: normalized.pathname,
    caption,
    captionSha256: sha256(caption),
    shareToFeed:
      context.instagramMetadata?.shareToFeed === true,
  };
}

function readLedgerSnapshot({
  path,
  contentId,
  version,
  fsImpl = nodeFs,
}) {
  try {
    if (!fsImpl.existsSync(path)) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_LEDGER_MISSING",
      };
    }
    const bytes = Buffer.from(fsImpl.readFileSync(path));
    const parsed = parsePublishLedgerBytesReadOnly(bytes);
    if (!parsed.ok) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_LEDGER_INVALID",
      };
    }
    const instagramKey = buildPublishLedgerKey(
      contentId,
      "instagram_reels",
      version,
    );
    const youtubeKey = buildPublishLedgerKey(
      contentId,
      "youtube_shorts",
      version,
    );
    const instagramRecord =
      parsed.ledger.records.find(
        (record) => record.key === instagramKey,
      ) ?? null;
    const youtubeRecord =
      parsed.ledger.records.find(
        (record) => record.key === youtubeKey,
      ) ?? null;
    return {
      ok: true,
      bytes,
      sha256: sha256(bytes),
      ledger: parsed.ledger,
      instagramKey,
      youtubeKey,
      instagramRecord,
      youtubeRecord,
      clean:
        instagramRecord === null &&
        youtubeRecord === null,
    };
  } catch {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_EXECUTION_LEDGER_READ_FAILED",
    };
  }
}

function normalizePublishedMediaItem(value) {
  if (
    !isPlainObject(value) ||
    !INSTAGRAM_PUBLIC_ID_RE.test(
      strictString(value.id),
    ) ||
    typeof value.caption !== "string"
  ) {
    return null;
  }
  const caption = value.caption;
  const mediaType =
    typeof value.media_type === "string"
      ? value.media_type
      : null;
  const mediaProductType =
    typeof value.media_product_type === "string"
      ? value.media_product_type
      : null;
  if (
    !INSTAGRAM_MEDIA_TYPES.has(mediaType) ||
    !INSTAGRAM_MEDIA_PRODUCT_TYPES.has(
      mediaProductType,
    )
  ) {
    return null;
  }
  const permalink =
    typeof value.permalink === "string"
      ? value.permalink
      : null;
  const timestamp =
    typeof value.timestamp === "string"
      ? value.timestamp
      : null;
  const shortcode =
    typeof value.shortcode === "string"
      ? value.shortcode
      : null;
  return {
    id: value.id,
    caption,
    mediaType,
    mediaProductType,
    permalink,
    timestamp,
    shortcode,
  };
}

/**
 * One logical full-account scan. `mediaListCount` in durable evidence counts
 * scans (at most two), while this helper independently bounds cursor pages.
 */
export async function reconcileMoneyShortsPart2InstagramPublishedMedia({
  listPage,
  expectedCaption,
  maxPages = MAX_RECONCILIATION_PAGES,
  maxItems = MAX_RECONCILIATION_ITEMS,
}) {
  if (
    typeof listPage !== "function" ||
    typeof expectedCaption !== "string" ||
    expectedCaption.length === 0 ||
    !Number.isSafeInteger(maxPages) ||
    maxPages < 1 ||
    maxPages > MAX_RECONCILIATION_PAGES ||
    !Number.isSafeInteger(maxItems) ||
    maxItems < 1 ||
    maxItems > MAX_RECONCILIATION_ITEMS
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_EXECUTION_RECONCILIATION_INPUT_INVALID",
      coverageComplete: false,
      candidateCount: null,
    };
  }
  let after = null;
  let pagesScanned = 0;
  let itemsScanned = 0;
  const inspectedIds = [];
  const seenMediaIds = new Set();
  const seenCursors = new Set();
  for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
    let page;
    try {
      page = await listPage({
        after,
        limit: 100,
      });
    } catch {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_RECONCILIATION_READ_UNKNOWN",
        coverageComplete: false,
        candidateCount: null,
        pagesScanned,
        itemsScanned,
      };
    }
    pagesScanned += 1;
    if (
      page?.ok !== true ||
      !Array.isArray(page.items) ||
      !(
        page.nextCursor === null ||
        typeof page.nextCursor === "string"
      )
    ) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_RECONCILIATION_RESPONSE_INVALID",
        coverageComplete: false,
        candidateCount: null,
        pagesScanned,
        itemsScanned,
      };
    }
    const normalized = page.items.map(
      normalizePublishedMediaItem,
    );
    if (normalized.some((item) => item === null)) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_RECONCILIATION_ITEM_INVALID",
        coverageComplete: false,
        candidateCount: null,
        pagesScanned,
        itemsScanned,
      };
    }
    for (const item of normalized) {
      if (seenMediaIds.has(item.id)) {
        return {
          ok: false,
          reason:
            "PART2_INSTAGRAM_RECOVERY_EXECUTION_RECONCILIATION_DUPLICATE_MEDIA_ID",
          coverageComplete: false,
          candidateCount: null,
          pagesScanned,
          itemsScanned,
        };
      }
      seenMediaIds.add(item.id);
    }
    itemsScanned += normalized.length;
    if (itemsScanned > maxItems) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_RECONCILIATION_ITEM_LIMIT",
        coverageComplete: false,
        candidateCount: null,
        pagesScanned,
        itemsScanned,
      };
    }
    inspectedIds.push(
      ...normalized.map((item) => item.id),
    );
    const candidates = normalized.filter(
      (item) =>
        item.caption === expectedCaption &&
        (item.mediaProductType === "REELS" ||
          item.mediaType === "VIDEO"),
    );
    if (candidates.length > 0) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_PUBLISHED_CANDIDATE_FOUND",
        coverageComplete: false,
        candidateCount: candidates.length,
        candidateIds: candidates.map((item) => item.id),
        candidatePermalinks: candidates.map(
          (item) => item.permalink,
        ),
        pagesScanned,
        itemsScanned,
      };
    }
    if (page.nextCursor === null) {
      const stable = {
        coverageComplete: true,
        candidateCount: 0,
        pagesScanned,
        itemsScanned,
        inspectedIdsSha256: sha256(
          JSON.stringify(inspectedIds),
        ),
      };
      return {
        ok: true,
        ...stable,
        reconciliationFingerprint: sha256(
          JSON.stringify(stable),
        ),
      };
    }
    if (
      page.nextCursor.length === 0 ||
      seenCursors.has(page.nextCursor)
    ) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_RECONCILIATION_CURSOR_INVALID",
        coverageComplete: false,
        candidateCount: null,
        pagesScanned,
        itemsScanned,
      };
    }
    seenCursors.add(page.nextCursor);
    after = page.nextCursor;
  }
  return {
    ok: false,
    reason:
      "PART2_INSTAGRAM_RECOVERY_EXECUTION_RECONCILIATION_PAGE_LIMIT",
    coverageComplete: false,
    candidateCount: null,
    pagesScanned,
    itemsScanned,
  };
}

function safeInstagramPermalink(value) {
  if (typeof value !== "string") return null;
  try {
    const parsed = new URL(value);
    const parts = parsed.pathname
      .split("/")
      .filter(Boolean);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "www.instagram.com" &&
      parsed.username === "" &&
      parsed.password === "" &&
      parsed.port === "" &&
      parsed.search === "" &&
      parsed.hash === "" &&
      parts.length === 2 &&
      parts[0] === "reel" &&
      /^[A-Za-z0-9_-]{5,80}$/.test(parts[1])
    )
      ? `https://www.instagram.com/reel/${parts[1]}/`
      : null;
  } catch {
    return null;
  }
}

async function responseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function graphUrl(path) {
  return `${GRAPH_API_BASE}/${encodeURIComponent(path)}`;
}

async function buildDefaultAdapters({
  accountId,
  accessToken,
  fetchImpl = fetch,
}) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };
  return {
    async verifyIdentity() {
      const response = await fetchImpl(
        `${graphUrl(accountId)}?fields=id,username`,
        {
          headers,
          redirect: "error",
          signal: AbortSignal.timeout(30_000),
        },
      );
      const data = await responseJson(response);
      return {
        ok: response.ok === true,
        accountId:
          typeof data?.id === "string" ? data.id : null,
      };
    },
    async listPublishedMediaPage({ after, limit }) {
      const query = new URLSearchParams({
        fields:
          "id,caption,media_type,media_product_type,permalink,timestamp,shortcode",
        limit: String(limit),
      });
      if (typeof after === "string") {
        query.set("after", after);
      }
      const response = await fetchImpl(
        `${graphUrl(accountId)}/media?${query.toString()}`,
        {
          headers,
          redirect: "error",
          signal: AbortSignal.timeout(30_000),
        },
      );
      const data = await responseJson(response);
      const nextPresent =
        typeof data?.paging?.next === "string" &&
        data.paging.next.length > 0;
      const nextCursor = nextPresent
        ? data?.paging?.cursors?.after
        : null;
      return {
        ok:
          response.ok === true &&
          Array.isArray(data?.data) &&
          (!nextPresent ||
            (typeof nextCursor === "string" &&
              nextCursor.length > 0)),
        items: Array.isArray(data?.data) ? data.data : [],
        nextCursor:
          typeof nextCursor === "string"
            ? nextCursor
            : null,
      };
    },
    async headBlob(url) {
      const response = await fetchImpl(url, {
        method: "HEAD",
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
      });
      return {
        ok: response.ok === true,
        status:
          Number.isSafeInteger(response.status)
            ? response.status
            : null,
        contentType:
          response.headers?.get?.("content-type") ?? null,
      };
    },
    async createContainer({
      videoUrl,
      caption,
      shareToFeed,
    }) {
      return createMoneyShortsInstagramContainerOnce({
        accountId,
        accessToken,
        videoUrl,
        caption,
        shareToFeed,
        fetchImpl,
      });
    },
    async readContainer(containerId) {
      const response = await fetchImpl(
        `${graphUrl(containerId)}?fields=status_code,status`,
        {
          headers,
          redirect: "error",
          signal: AbortSignal.timeout(30_000),
        },
      );
      const data = await responseJson(response);
      return {
        ok: response.ok === true,
        statusCode:
          typeof data?.status_code === "string"
            ? data.status_code
            : "UNKNOWN",
      };
    },
    async publishContainer(containerId) {
      const response = await fetchImpl(
        `${graphUrl(accountId)}/media_publish`,
        {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            creation_id: containerId,
          }),
          redirect: "error",
          signal: AbortSignal.timeout(30_000),
        },
      );
      const data = await responseJson(response);
      return {
        ok: response.ok === true,
        mediaId:
          typeof data?.id === "string" ? data.id : null,
      };
    },
    async verifyPublishedMedia(mediaId) {
      const response = await fetchImpl(
        `${graphUrl(mediaId)}?fields=id,media_type,media_product_type,permalink,timestamp`,
        {
          headers,
          redirect: "error",
          signal: AbortSignal.timeout(30_000),
        },
      );
      const data = await responseJson(response);
      return {
        ok: response.ok === true,
        id: typeof data?.id === "string" ? data.id : null,
        mediaType:
          typeof data?.media_type === "string"
            ? data.media_type
            : null,
        mediaProductType:
          typeof data?.media_product_type === "string"
            ? data.media_product_type
            : null,
        permalink:
          safeInstagramPermalink(data?.permalink),
        publishedAtIso:
          typeof data?.timestamp === "string" &&
          Number.isFinite(Date.parse(data.timestamp))
            ? data.timestamp
            : null,
      };
    },
    async sleep(ms) {
      await new Promise((resolveSleep) =>
        setTimeout(resolveSleep, ms),
      );
    },
  };
}

function productionCredentialsProvider() {
  const accountId =
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const accessToken =
    process.env.INSTAGRAM_ACCESS_TOKEN;
  return {
    ok:
      typeof accountId === "string" &&
      accountId !== "" &&
      typeof accessToken === "string" &&
      accessToken !== "",
    accountId:
      typeof accountId === "string" ? accountId : null,
    accessToken:
      typeof accessToken === "string"
        ? accessToken
        : null,
  };
}

function inspectUnclaimedRecoveryLayout({
  recoveryPaths,
  expectedPreflightFingerprint = null,
  allowLock = false,
  expectedLockIdentity = null,
  fsImpl = nodeFs,
}) {
  const root = dirname(recoveryPaths.evidenceDir);
  if (!fsImpl.existsSync(root)) {
    return {
      ok: expectedPreflightFingerprint === null,
      reason:
        expectedPreflightFingerprint === null
          ? null
          : "PART2_INSTAGRAM_RECOVERY_EXECUTION_PREFLIGHT_MISSING",
    };
  }
  try {
    if (!fsImpl.statSync(root).isDirectory()) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_RECOVERY_ROOT_INVALID",
      };
    }
    const rootAllowed = new Set([
      basename(recoveryPaths.evidenceDir),
      ...(allowLock
        ? [basename(recoveryPaths.lockPath)]
        : []),
    ]);
    const rootEntries = fsImpl.readdirSync(root, {
      withFileTypes: true,
    });
    if (
      rootEntries.some(
        (entry) =>
          !rootAllowed.has(entry.name) ||
          (entry.name ===
          basename(recoveryPaths.evidenceDir)
            ? !entry.isDirectory()
            : !entry.isFile()),
      ) ||
      (!allowLock &&
        fsImpl.existsSync(recoveryPaths.lockPath)) ||
      (allowLock &&
        !fsImpl.existsSync(recoveryPaths.lockPath))
    ) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_RECOVERY_ROOT_NOT_EXACT",
      };
    }
    if (allowLock) {
      const lockStat = fsImpl.statSync(
        recoveryPaths.lockPath,
      );
      const actualLockIdentity = {
        dev: String(lockStat?.dev ?? ""),
        ino: String(lockStat?.ino ?? ""),
        size: String(lockStat?.size ?? ""),
        mtimeMs: String(lockStat?.mtimeMs ?? ""),
        ctimeMs: String(lockStat?.ctimeMs ?? ""),
      };
      if (
        !isPlainObject(expectedLockIdentity) ||
        JSON.stringify(actualLockIdentity) !==
          JSON.stringify(expectedLockIdentity)
      ) {
        return {
          ok: false,
          reason:
            "PART2_INSTAGRAM_RECOVERY_EXECUTION_LOCK_MISSING_OR_CHANGED",
        };
      }
    }
    if (!fsImpl.existsSync(recoveryPaths.evidenceDir)) {
      return {
        ok: expectedPreflightFingerprint === null,
        reason:
          expectedPreflightFingerprint === null
            ? null
            : "PART2_INSTAGRAM_RECOVERY_EXECUTION_PREFLIGHT_MISSING",
      };
    }
    const entries = fsImpl.readdirSync(
      recoveryPaths.evidenceDir,
      { withFileTypes: true },
    );
    if (expectedPreflightFingerprint === null) {
      return {
        ok: entries.length === 0,
        reason:
          entries.length === 0
            ? null
            : "PART2_INSTAGRAM_RECOVERY_EXECUTION_ORPHAN_EVIDENCE_PRESENT",
      };
    }
    const committedSourcePath =
      `${recoveryPaths.preflightPath}.${expectedPreflightFingerprint}.committed-source`;
    const allowed = new Set([
      basename(recoveryPaths.preflightPath),
      basename(committedSourcePath),
    ]);
    if (
      entries.length !== allowed.size ||
      entries.some(
        (entry) =>
          !entry.isFile() || !allowed.has(entry.name),
      ) ||
      !fsImpl.existsSync(recoveryPaths.preflightPath) ||
      !fsImpl.existsSync(committedSourcePath)
    ) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_PREFLIGHT_PAIR_NOT_EXACT",
      };
    }
    const canonical = Buffer.from(
      fsImpl.readFileSync(recoveryPaths.preflightPath),
    );
    const committed = Buffer.from(
      fsImpl.readFileSync(committedSourcePath),
    );
    return canonical.equals(committed)
      ? { ok: true, reason: null }
      : {
          ok: false,
          reason:
            "PART2_INSTAGRAM_RECOVERY_EXECUTION_PREFLIGHT_PAIR_MISMATCH",
        };
  } catch {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_EXECUTION_RECOVERY_LAYOUT_UNREADABLE",
    };
  }
}

async function loadCurrentExecutionPlan({
  parsed,
  paths,
  reviewRunner,
  contextInspector,
  materialInspector,
  fsImpl,
}) {
  const review = await reviewRunner({
    argv: parsed.reviewArgv,
  });
  if (
    review?.ok !== true ||
    review.status !== "LOCAL_RECOVERY_REVIEW_OK" ||
    review.readyForActualExecution !== false ||
    review.safeToRetry !== false ||
    review.safeToPublish !== false ||
    review.preflightFingerprint !==
      parsed.expectedReviewPreflightFingerprint
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_EXECUTION_REVIEW_PREFLIGHT_INVALID",
    };
  }
  const context = contextInspector({
    paths: {
      contentUnitPath: paths.contentUnitPath,
      ledgerPath: paths.ledgerPath,
      outDir: paths.outDir,
    },
    authorization: contextAuthorization(parsed),
  });
  if (!context?.ok) {
    return {
      ok: false,
      reason:
        context?.reason ??
        "PART2_INSTAGRAM_RECOVERY_EXECUTION_CONTEXT_INVALID",
    };
  }
  const ledger = readLedgerSnapshot({
    path: paths.ledgerPath,
    contentId: context.currentBinding.contentId,
    version: context.currentBinding.version,
    fsImpl,
  });
  if (
    !ledger.ok ||
    ledger.clean !== true ||
    ledger.sha256 !== context.ledger?.sha256 ||
    ledger.sha256 !==
      review.preflight?.plan?.ledger?.sha256
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_EXECUTION_LEDGER_BASELINE_INVALID",
    };
  }
  const material = materialInspector({
    paths,
    review,
    context,
    fsImpl,
  });
  if (!material?.ok) return material;
  const planResult =
    buildMoneyShortsPart2InstagramRecoveryExecutionPlan({
      reviewPreflight: review.preflight,
      expectedReviewPreflightFingerprint:
        parsed.expectedReviewPreflightFingerprint,
      currentBinding: context.currentBinding,
      expectedInstagramAccountId:
        parsed.expectedInstagramAccountId,
      expectedYoutubeChannelId:
        parsed.expectedYoutubeChannelId,
      recoveryOutDir: paths.recoveryOutDir,
      blobPathname: material.blobPathname,
      blobUrlSha256: material.blobUrlSha256,
      captionSha256: material.captionSha256,
      shareToFeed: material.shareToFeed,
      ledgerBaselineSha256: ledger.sha256,
    });
  if (!planResult.ok) return planResult;
  return {
    ok: true,
    review,
    context,
    ledger,
    material,
    plan: planResult.plan,
  };
}

function initialPublicState(plan) {
  return {
    instagram: {
      accountId: null,
      identityStatus: "not_started",
      reconciliationBeforeCreate: "not_started",
      reconciliationBeforeCreateFingerprint: null,
      reconciliationBeforeCreatePagesScanned: null,
      reconciliationBeforeCreateItemsScanned: null,
      reconciliationBeforeCreateCandidateCount: null,
      reconciliationBeforePublish: "not_started",
      reconciliationBeforePublishFingerprint: null,
      reconciliationBeforePublishPagesScanned: null,
      reconciliationBeforePublishItemsScanned: null,
      reconciliationBeforePublishCandidateCount: null,
      containerOutcome: "not_started",
      containerId: null,
      lastStatusCode: null,
      publishOutcome: "not_started",
      mediaId: null,
      mediaVerified: false,
      permalink: null,
      publishedAtIso: null,
      mediaType: null,
      mediaProductType: null,
    },
    blob: {
      pathname: plan.blob.pathname,
      urlSha256: plan.blob.urlSha256,
      headVerified: false,
      headStatus: null,
      headContentType: null,
    },
    ledger: {
      baselineSha256: plan.ledger.baselineSha256,
      currentSha256: plan.ledger.baselineSha256,
      writeOk: false,
      readbackOk: false,
      recordedKey: null,
      publishedId: null,
    },
    forbidden: {
      blobPutCount: 0,
      youtubeActionCount: 0,
      part1ActionCount: 0,
      databaseMutationCount: 0,
      automaticRetryCount: 0,
      credentialValuePrintCount: 0,
    },
  };
}

function exactReadbackRecord({
  snapshot,
  expectedRecord,
}) {
  if (!snapshot?.ok) return false;
  const actual = snapshot.ledger.records.find(
    (record) => record.key === expectedRecord.key,
  );
  return (
    actual !== undefined &&
    JSON.stringify(actual) === JSON.stringify(expectedRecord)
  );
}

async function executeArmed({
  parsed,
  paths,
  current,
  dependencies,
}) {
  const {
    fsImpl,
    reviewRunner,
    contextInspector,
    materialInspector,
    credentialsProvider,
    adapterFactory,
    ledgerWriter,
    clock,
  } = dependencies;
  const recoveryPaths =
    moneyShortsPart2InstagramRecoveryExecutionPaths(
      paths.recoveryOutDir,
    );
  const lock =
    acquireMoneyShortsPart2InstagramRecoveryExecutionLock({
      lockPath: recoveryPaths.lockPath,
      fsImpl,
    });
  if (!lock.ok) {
    return {
      ok: false,
      status: "BLOCKED_BEFORE_CLAIM",
      blockerCode: lock.reason,
      noExternalActions: true,
    };
  }

  let returnValue = null;
  let claim = null;
  let latestEvidenceSha256 = null;
  let latestEventEvidence = null;
  let latestTransition = null;
  let resultWritten = false;
  let recoveryLockFinalized = false;
  const counters =
    zeroMoneyShortsPart2InstagramRecoveryExecutionCounters();
  let publicState = initialPublicState(current.plan);

  const appendTransition = (transition) => {
    counters.evidenceWriteCount += 1;
    const event =
      buildMoneyShortsPart2InstagramRecoveryExecutionEvent({
        claim,
        previousEvidenceSha256:
          latestEvidenceSha256,
        previousTransition: latestTransition,
        transition,
        recordedAtIso: clock(),
        publicState,
        sideEffectCounters: counters,
      });
    if (!event) return false;
    const path =
      moneyShortsPart2InstagramRecoveryExecutionEventPath(
        recoveryPaths.eventDir,
        transition,
      );
    const written =
      writeMoneyShortsPart2InstagramRecoveryExecutionEvidenceOnce(
        {
          path,
          evidence: event,
          fingerprintField: "eventFingerprint",
          fsImpl,
        },
      );
    if (!written.ok) return false;
    latestEvidenceSha256 = written.sha256;
    latestEventEvidence = event;
    latestTransition = transition;
    return true;
  };

  const finalize = ({
    status,
    blockerCode,
  }) => {
    if (
      !claim ||
      !latestEvidenceSha256 ||
      !latestTransition ||
      resultWritten
    ) {
      return {
        ok: false,
        status:
          "RECOVERY_EVIDENCE_INCOMPLETE",
        blockerCode:
          blockerCode ??
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_RESULT_PREREQUISITE_MISSING",
        sideEffectCounters: clone(counters),
      };
    }
    counters.evidenceWriteCount += 1;
    const result =
      buildMoneyShortsPart2InstagramRecoveryExecutionResult({
        claim,
        latestEvent: latestEventEvidence,
        latestEventFileSha256:
          latestEvidenceSha256,
        status,
        blockerCode,
        completedAtIso: clock(),
        publicState,
        sideEffectCounters: counters,
      });
    const validation = result
      ? validateMoneyShortsPart2InstagramRecoveryExecutionResult(
          {
            evidence: result,
            claim,
            latestEvent: latestEventEvidence,
            latestEventFileSha256:
              latestEvidenceSha256,
          },
        )
      : null;
    if (!result || validation?.valid !== true) {
      return {
        ok: false,
        status:
          "RECOVERY_EVIDENCE_INCOMPLETE",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_RESULT_BUILD_FAILED",
        sideEffectCounters: clone(counters),
      };
    }
    const written =
      writeMoneyShortsPart2InstagramRecoveryExecutionEvidenceOnce(
        {
          path: recoveryPaths.resultPath,
          evidence: result,
          fingerprintField: "resultFingerprint",
          fsImpl,
        },
      );
    if (!written.ok) {
      return {
        ok: false,
        status:
          "RECOVERY_EVIDENCE_INCOMPLETE",
        blockerCode: written.reason,
        sideEffectCounters: clone(counters),
      };
    }
    resultWritten = true;
    return {
      ok:
        status ===
        "PART2_INSTAGRAM_RECOVERY_OK",
      status,
      blockerCode,
      contentId:
        claim.currentBinding.contentId,
      instagramMediaId:
        publicState.instagram.mediaId,
      instagramPermalink:
        publicState.instagram.permalink,
      youtubeOutcome: "not_started",
      part1ActionCount: 0,
      automaticRetryCount: 0,
      resultFingerprint:
        result.resultFingerprint,
      resultPath: recoveryPaths.resultPath,
      sideEffectCounters: clone(counters),
    };
  };

  const failAfterEventWrite = ({
    status,
    blockerCode,
  }) =>
    finalize({
      status,
      blockerCode,
    });

  try {
    const lockedCurrent =
      await loadCurrentExecutionPlan({
        parsed,
        paths,
        reviewRunner,
        contextInspector,
        materialInspector,
        fsImpl,
      });
    if (
      !lockedCurrent.ok ||
      lockedCurrent.plan.planFingerprint !==
        current.plan.planFingerprint
    ) {
      returnValue = {
        ok: false,
        status: "BLOCKED_BEFORE_CLAIM",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_SOURCE_DRIFT_AFTER_LOCK",
        noExternalActions: true,
      };
      return returnValue;
    }
    const layout = inspectUnclaimedRecoveryLayout({
      recoveryPaths,
      expectedPreflightFingerprint:
        parsed.expectedExecutionPreflightFingerprint,
      allowLock: true,
      expectedLockIdentity: lock.fileIdentity,
      fsImpl,
    });
    if (!layout.ok) {
      returnValue = {
        ok: false,
        status: "BLOCKED_BEFORE_CLAIM",
        blockerCode: layout.reason,
        noExternalActions: true,
      };
      return returnValue;
    }
    const preflightFile = readJsonEvidence(
      recoveryPaths.preflightPath,
      fsImpl,
    );
    const preflightValidation =
      validateMoneyShortsPart2InstagramRecoveryExecutionPreflight(
        {
          evidence: preflightFile.evidence,
          currentPlan: lockedCurrent.plan,
          expectedPreflightFingerprint:
            parsed.expectedExecutionPreflightFingerprint,
        },
      );
    if (
      preflightFile.ok !== true ||
      preflightValidation.valid !== true
    ) {
      returnValue = {
        ok: false,
        status: "BLOCKED_BEFORE_CLAIM",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_PREFLIGHT_STALE_OR_INVALID",
        noExternalActions: true,
      };
      return returnValue;
    }
    const credentials = credentialsProvider();
    counters.credentialReadCount = 2;
    if (
      credentials?.ok !== true ||
      credentials.accountId !==
        parsed.expectedInstagramAccountId ||
      !INSTAGRAM_ACCOUNT_ID_RE.test(
        strictString(credentials.accountId),
      ) ||
      typeof credentials.accessToken !== "string" ||
      credentials.accessToken === ""
    ) {
      returnValue = {
        ok: false,
        status: "BLOCKED_BEFORE_CLAIM",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_CREDENTIALS_INVALID",
        noExternalActions: true,
        ownerApprovalConsumed: false,
      };
      return returnValue;
    }
    let adapters;
    try {
      adapters = await adapterFactory({
        accountId: credentials.accountId,
        accessToken: credentials.accessToken,
      });
    } catch {
      returnValue = {
        ok: false,
        status: "BLOCKED_BEFORE_CLAIM",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_ADAPTER_INIT_FAILED",
        noExternalActions: true,
        ownerApprovalConsumed: false,
      };
      return returnValue;
    }
    claim =
      buildMoneyShortsPart2InstagramRecoveryExecutionClaim({
        plan: lockedCurrent.plan,
        preflightFingerprint:
          parsed.expectedExecutionPreflightFingerprint,
        claimedAtIso: clock(),
      });
    if (!claim) {
      returnValue = {
        ok: false,
        status: "BLOCKED_BEFORE_CLAIM",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_CLAIM_BUILD_FAILED",
        noExternalActions: true,
      };
      return returnValue;
    }
    const claimWrite =
      writeMoneyShortsPart2InstagramRecoveryExecutionEvidenceOnce(
        {
          path: recoveryPaths.claimPath,
          evidence: claim,
          fingerprintField: "claimFingerprint",
          fsImpl,
        },
      );
    if (!claimWrite.ok) {
      returnValue = {
        ok: false,
        status: "BLOCKED_BEFORE_CLAIM",
        blockerCode: claimWrite.reason,
        noExternalActions: true,
      };
      return returnValue;
    }
    counters.evidenceWriteCount = 1;
    latestEvidenceSha256 = claimWrite.sha256;
    if (!appendTransition("external_execution_ready")) {
      returnValue = {
        ok: false,
        status: "RECOVERY_EVIDENCE_INCOMPLETE",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_EXTERNAL_READY_EVENT_FAILED",
        noExternalActions: true,
      };
      return returnValue;
    }

    publicState.instagram.identityStatus = "intent";
    if (
      !appendTransition(
        "instagram_identity_verify_intent",
      )
    ) {
      returnValue = failAfterEventWrite({
        status: "FAILED_BEFORE_RECOVERY_MUTATION",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_IDENTITY_INTENT_WRITE_FAILED",
      });
      return returnValue;
    }
    counters.identityCount += 1;
    let identity;
    try {
      identity = await adapters.verifyIdentity();
    } catch {
      publicState.instagram.identityStatus = "unknown";
      returnValue = failAfterEventWrite({
        status: "FAILED_BEFORE_RECOVERY_MUTATION",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_IDENTITY_UNKNOWN",
      });
      return returnValue;
    }
    if (
      identity?.ok !== true ||
      identity.accountId !==
        parsed.expectedInstagramAccountId
    ) {
      publicState.instagram.identityStatus = "mismatch";
      publicState.instagram.accountId =
        INSTAGRAM_ACCOUNT_ID_RE.test(
          strictString(identity?.accountId),
        )
          ? identity.accountId
          : null;
      returnValue = failAfterEventWrite({
        status: "FAILED_BEFORE_RECOVERY_MUTATION",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_IDENTITY_MISMATCH",
      });
      return returnValue;
    }
    publicState.instagram.identityStatus = "confirmed";
    publicState.instagram.accountId =
      identity.accountId;
    if (
      !appendTransition(
        "instagram_identity_verify_confirmed",
      )
    ) {
      returnValue = failAfterEventWrite({
        status: "FAILED_BEFORE_RECOVERY_MUTATION",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_IDENTITY_CONFIRM_WRITE_FAILED",
      });
      return returnValue;
    }

    publicState.instagram.reconciliationBeforeCreate =
      "intent";
    if (
      !appendTransition(
        "instagram_reconciliation_intent",
      )
    ) {
      returnValue = failAfterEventWrite({
        status: "FAILED_BEFORE_RECOVERY_MUTATION",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_RECONCILIATION_INTENT_WRITE_FAILED",
      });
      return returnValue;
    }
    counters.mediaListCount += 1;
    const reconciliationBeforeCreate =
      await reconcileMoneyShortsPart2InstagramPublishedMedia(
        {
          listPage:
            adapters.listPublishedMediaPage,
          expectedCaption:
            lockedCurrent.material.caption,
        },
      );
    if (!reconciliationBeforeCreate.ok) {
      publicState.instagram.reconciliationBeforeCreate =
        reconciliationBeforeCreate.candidateCount > 0
          ? "blocked"
          : "unknown";
      publicState.instagram
        .reconciliationBeforeCreatePagesScanned =
        Number.isSafeInteger(
          reconciliationBeforeCreate.pagesScanned,
        ) &&
        reconciliationBeforeCreate.pagesScanned >= 1 &&
        reconciliationBeforeCreate.pagesScanned <=
          MAX_RECONCILIATION_PAGES
          ? reconciliationBeforeCreate.pagesScanned
          : null;
      publicState.instagram
        .reconciliationBeforeCreateItemsScanned =
        Number.isSafeInteger(
          reconciliationBeforeCreate.itemsScanned,
        ) &&
        reconciliationBeforeCreate.itemsScanned >= 0 &&
        reconciliationBeforeCreate.itemsScanned <=
          MAX_RECONCILIATION_ITEMS
          ? reconciliationBeforeCreate.itemsScanned
          : null;
      publicState.instagram
        .reconciliationBeforeCreateCandidateCount =
        Number.isSafeInteger(
          reconciliationBeforeCreate.candidateCount,
        ) &&
        reconciliationBeforeCreate.candidateCount >= 0 &&
        reconciliationBeforeCreate.candidateCount <=
          MAX_RECONCILIATION_ITEMS
          ? reconciliationBeforeCreate.candidateCount
          : null;
      returnValue = failAfterEventWrite({
        status: "FAILED_BEFORE_RECOVERY_MUTATION",
        blockerCode:
          reconciliationBeforeCreate.reason,
      });
      return returnValue;
    }
    publicState.instagram.reconciliationBeforeCreate =
      "confirmed_no_match";
    publicState.instagram
      .reconciliationBeforeCreateFingerprint =
      reconciliationBeforeCreate.reconciliationFingerprint;
    publicState.instagram
      .reconciliationBeforeCreatePagesScanned =
      reconciliationBeforeCreate.pagesScanned;
    publicState.instagram
      .reconciliationBeforeCreateItemsScanned =
      reconciliationBeforeCreate.itemsScanned;
    publicState.instagram
      .reconciliationBeforeCreateCandidateCount = 0;
    if (
      !appendTransition(
        "instagram_reconciliation_confirmed_no_match",
      )
    ) {
      returnValue = failAfterEventWrite({
        status: "FAILED_BEFORE_RECOVERY_MUTATION",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_RECONCILIATION_CONFIRM_WRITE_FAILED",
      });
      return returnValue;
    }

    const beforeHeadLedger = readLedgerSnapshot({
      path: paths.ledgerPath,
      contentId:
        lockedCurrent.context.currentBinding.contentId,
      version:
        lockedCurrent.context.currentBinding.version,
      fsImpl,
    });
    if (
      !beforeHeadLedger.ok ||
      beforeHeadLedger.clean !== true ||
      beforeHeadLedger.sha256 !==
        lockedCurrent.plan.ledger.baselineSha256
    ) {
      publicState.ledger.currentSha256 =
        beforeHeadLedger.sha256 ?? null;
      returnValue = failAfterEventWrite({
        status: "FAILED_BEFORE_RECOVERY_MUTATION",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_LEDGER_CHANGED_BEFORE_BLOB_HEAD",
      });
      return returnValue;
    }

    if (!appendTransition("blob_head_intent")) {
      returnValue = failAfterEventWrite({
        status: "FAILED_BEFORE_RECOVERY_MUTATION",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_BLOB_HEAD_INTENT_WRITE_FAILED",
      });
      return returnValue;
    }
    counters.blobHeadCount += 1;
    let blobHead;
    try {
      blobHead = await adapters.headBlob(
        lockedCurrent.material.blobUrl,
      );
    } catch {
      returnValue = failAfterEventWrite({
        status: "FAILED_BEFORE_RECOVERY_MUTATION",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_BLOB_HEAD_UNKNOWN",
      });
      return returnValue;
    }
    publicState.blob.headStatus =
      Number.isSafeInteger(blobHead?.status)
        ? blobHead.status
        : null;
    publicState.blob.headContentType =
      typeof blobHead?.contentType === "string"
        ? blobHead.contentType
        : null;
    if (
      blobHead?.ok !== true ||
      blobHead.status !== 200 ||
      !strictString(
        blobHead.contentType,
      ).startsWith("video/")
    ) {
      returnValue = failAfterEventWrite({
        status: "FAILED_BEFORE_RECOVERY_MUTATION",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_BLOB_HEAD_FAILED",
      });
      return returnValue;
    }
    publicState.blob.headVerified = true;
    if (!appendTransition("blob_head_confirmed")) {
      returnValue = failAfterEventWrite({
        status: "FAILED_BEFORE_RECOVERY_MUTATION",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_BLOB_HEAD_CONFIRM_WRITE_FAILED",
      });
      return returnValue;
    }

    const beforeCreateLedger = readLedgerSnapshot({
      path: paths.ledgerPath,
      contentId:
        lockedCurrent.context.currentBinding.contentId,
      version:
        lockedCurrent.context.currentBinding.version,
      fsImpl,
    });
    if (
      !beforeCreateLedger.ok ||
      beforeCreateLedger.clean !== true ||
      beforeCreateLedger.sha256 !==
        lockedCurrent.plan.ledger.baselineSha256
    ) {
      publicState.ledger.currentSha256 =
        beforeCreateLedger.sha256 ?? null;
      returnValue = failAfterEventWrite({
        status: "FAILED_BEFORE_RECOVERY_MUTATION",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_LEDGER_CHANGED_BEFORE_CONTAINER",
      });
      return returnValue;
    }

    publicState.instagram.containerOutcome = "unknown";
    if (
      !appendTransition(
        "instagram_container_intent",
      )
    ) {
      returnValue = failAfterEventWrite({
        status: "FAILED_BEFORE_RECOVERY_MUTATION",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_CONTAINER_INTENT_WRITE_FAILED",
      });
      return returnValue;
    }
    counters.containerCreateCount += 1;
    let container;
    try {
      container = await adapters.createContainer({
        videoUrl: lockedCurrent.material.blobUrl,
        caption: lockedCurrent.material.caption,
        shareToFeed:
          lockedCurrent.material.shareToFeed,
      });
    } catch {
      returnValue = failAfterEventWrite({
        status: "INSTAGRAM_CONTAINER_OUTCOME_UNKNOWN",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_CONTAINER_UNKNOWN",
      });
      return returnValue;
    }
    const containerId =
      container?.ok === true &&
      INSTAGRAM_PUBLIC_ID_RE.test(
        strictString(container.containerId),
      )
        ? container.containerId
        : null;
    if (!containerId) {
      returnValue = failAfterEventWrite({
        status: "INSTAGRAM_CONTAINER_OUTCOME_UNKNOWN",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_CONTAINER_NO_ID",
      });
      return returnValue;
    }
    publicState.instagram.containerOutcome =
      "confirmed_created";
    publicState.instagram.containerId = containerId;
    if (
      !appendTransition(
        "instagram_container_confirmed",
      )
    ) {
      returnValue = failAfterEventWrite({
        status:
          "INSTAGRAM_CONTAINER_CREATED_NOT_PUBLISHED",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_CONTAINER_CONFIRM_WRITE_FAILED",
      });
      return returnValue;
    }

    if (
      !appendTransition("instagram_poll_intent")
    ) {
      returnValue = failAfterEventWrite({
        status:
          "INSTAGRAM_CONTAINER_CREATED_NOT_PUBLISHED",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_POLL_INTENT_WRITE_FAILED",
      });
      return returnValue;
    }
    let finished = false;
    let pollUnknown = false;
    for (
      let pollIndex = 0;
      pollIndex < MAX_STATUS_POLLS;
      pollIndex += 1
    ) {
      counters.statusPollCount += 1;
      let observed;
      try {
        observed =
          await adapters.readContainer(containerId);
      } catch {
        pollUnknown = true;
        publicState.instagram.lastStatusCode =
          "UNKNOWN";
        break;
      }
      const statusCode = [
        "IN_PROGRESS",
        "FINISHED",
        "ERROR",
        "EXPIRED",
      ].includes(observed?.statusCode)
        ? observed.statusCode
        : "UNKNOWN";
      publicState.instagram.lastStatusCode =
        statusCode;
      if (observed?.ok !== true) {
        pollUnknown = true;
        break;
      }
      if (statusCode === "FINISHED") {
        finished = true;
        break;
      }
      if (
        statusCode === "ERROR" ||
        statusCode === "EXPIRED" ||
        statusCode === "UNKNOWN"
      ) {
        break;
      }
      if (pollIndex < MAX_STATUS_POLLS - 1) {
        await adapters.sleep(
          STATUS_POLL_DELAY_MS,
        );
      }
    }
    if (
      !appendTransition(
        "instagram_poll_observed",
      )
    ) {
      returnValue = failAfterEventWrite({
        status:
          "INSTAGRAM_CONTAINER_CREATED_NOT_PUBLISHED",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_POLL_OBSERVED_WRITE_FAILED",
      });
      return returnValue;
    }
    if (!finished) {
      publicState.instagram.containerOutcome =
        pollUnknown ? "unknown" : "failed";
      returnValue = failAfterEventWrite({
        status:
          "INSTAGRAM_CONTAINER_CREATED_NOT_PUBLISHED",
        blockerCode:
          pollUnknown
            ? "PART2_INSTAGRAM_RECOVERY_EXECUTION_POLL_UNKNOWN"
            : "PART2_INSTAGRAM_RECOVERY_EXECUTION_CONTAINER_NOT_READY",
      });
      return returnValue;
    }
    publicState.instagram.containerOutcome = "ready";
    if (
      !appendTransition(
        "instagram_container_ready",
      )
    ) {
      returnValue = failAfterEventWrite({
        status:
          "INSTAGRAM_CONTAINER_CREATED_NOT_PUBLISHED",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_READY_WRITE_FAILED",
      });
      return returnValue;
    }

    publicState.instagram.reconciliationBeforePublish =
      "intent";
    if (
      !appendTransition(
        "instagram_reconciliation_before_publish_intent",
      )
    ) {
      returnValue = failAfterEventWrite({
        status:
          "INSTAGRAM_CONTAINER_CREATED_NOT_PUBLISHED",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_PREPUBLISH_RECONCILIATION_INTENT_WRITE_FAILED",
      });
      return returnValue;
    }
    counters.mediaListCount += 1;
    const reconciliationBeforePublish =
      await reconcileMoneyShortsPart2InstagramPublishedMedia(
        {
          listPage:
            adapters.listPublishedMediaPage,
          expectedCaption:
            lockedCurrent.material.caption,
        },
      );
    if (!reconciliationBeforePublish.ok) {
      publicState.instagram.reconciliationBeforePublish =
        reconciliationBeforePublish.candidateCount > 0
          ? "blocked"
          : "unknown";
      publicState.instagram
        .reconciliationBeforePublishPagesScanned =
        Number.isSafeInteger(
          reconciliationBeforePublish.pagesScanned,
        ) &&
        reconciliationBeforePublish.pagesScanned >= 1 &&
        reconciliationBeforePublish.pagesScanned <=
          MAX_RECONCILIATION_PAGES
          ? reconciliationBeforePublish.pagesScanned
          : null;
      publicState.instagram
        .reconciliationBeforePublishItemsScanned =
        Number.isSafeInteger(
          reconciliationBeforePublish.itemsScanned,
        ) &&
        reconciliationBeforePublish.itemsScanned >= 0 &&
        reconciliationBeforePublish.itemsScanned <=
          MAX_RECONCILIATION_ITEMS
          ? reconciliationBeforePublish.itemsScanned
          : null;
      publicState.instagram
        .reconciliationBeforePublishCandidateCount =
        Number.isSafeInteger(
          reconciliationBeforePublish.candidateCount,
        ) &&
        reconciliationBeforePublish.candidateCount >= 0 &&
        reconciliationBeforePublish.candidateCount <=
          MAX_RECONCILIATION_ITEMS
          ? reconciliationBeforePublish.candidateCount
          : null;
      returnValue = failAfterEventWrite({
        status:
          "INSTAGRAM_CONTAINER_CREATED_NOT_PUBLISHED",
        blockerCode:
          reconciliationBeforePublish.reason,
      });
      return returnValue;
    }
    const beforePublishLedger = readLedgerSnapshot({
      path: paths.ledgerPath,
      contentId:
        lockedCurrent.context.currentBinding.contentId,
      version:
        lockedCurrent.context.currentBinding.version,
      fsImpl,
    });
    if (
      !beforePublishLedger.ok ||
      beforePublishLedger.clean !== true ||
      beforePublishLedger.sha256 !==
        lockedCurrent.plan.ledger.baselineSha256
    ) {
      publicState.ledger.currentSha256 =
        beforePublishLedger.sha256 ?? null;
      returnValue = failAfterEventWrite({
        status:
          "INSTAGRAM_CONTAINER_CREATED_NOT_PUBLISHED",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_LEDGER_CHANGED_BEFORE_PUBLISH",
      });
      return returnValue;
    }
    publicState.instagram.reconciliationBeforePublish =
      "confirmed_no_match";
    publicState.instagram
      .reconciliationBeforePublishFingerprint =
      reconciliationBeforePublish.reconciliationFingerprint;
    publicState.instagram
      .reconciliationBeforePublishPagesScanned =
      reconciliationBeforePublish.pagesScanned;
    publicState.instagram
      .reconciliationBeforePublishItemsScanned =
      reconciliationBeforePublish.itemsScanned;
    publicState.instagram
      .reconciliationBeforePublishCandidateCount = 0;
    if (
      !appendTransition(
        "instagram_reconciliation_before_publish_confirmed_no_match",
      )
    ) {
      returnValue = failAfterEventWrite({
        status:
          "INSTAGRAM_CONTAINER_CREATED_NOT_PUBLISHED",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_PREPUBLISH_RECONCILIATION_CONFIRM_WRITE_FAILED",
      });
      return returnValue;
    }

    publicState.instagram.publishOutcome = "unknown";
    if (
      !appendTransition(
        "instagram_publish_intent",
      )
    ) {
      returnValue = failAfterEventWrite({
        status:
          "INSTAGRAM_CONTAINER_CREATED_NOT_PUBLISHED",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_PUBLISH_INTENT_WRITE_FAILED",
      });
      return returnValue;
    }
    counters.mediaPublishCount += 1;
    let published;
    try {
      published =
        await adapters.publishContainer(containerId);
    } catch {
      returnValue = failAfterEventWrite({
        status:
          "INSTAGRAM_PUBLISH_OUTCOME_UNKNOWN",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_PUBLISH_UNKNOWN",
      });
      return returnValue;
    }
    const mediaId =
      published?.ok === true &&
      INSTAGRAM_PUBLIC_ID_RE.test(
        strictString(published.mediaId),
      )
        ? published.mediaId
        : null;
    if (!mediaId) {
      returnValue = failAfterEventWrite({
        status:
          "INSTAGRAM_PUBLISH_OUTCOME_UNKNOWN",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_PUBLISH_NO_ID",
      });
      return returnValue;
    }
    publicState.instagram.publishOutcome =
      "confirmed_published";
    publicState.instagram.mediaId = mediaId;
    if (
      !appendTransition(
        "instagram_publish_confirmed",
      )
    ) {
      returnValue = failAfterEventWrite({
        status:
          "INSTAGRAM_PUBLISHED_LEDGER_MISSING",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_PUBLISH_CONFIRM_WRITE_FAILED",
      });
      return returnValue;
    }

    if (
      !appendTransition(
        "instagram_media_verify_intent",
      )
    ) {
      returnValue = failAfterEventWrite({
        status:
          "INSTAGRAM_PUBLISHED_LEDGER_MISSING",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_MEDIA_VERIFY_INTENT_WRITE_FAILED",
      });
      return returnValue;
    }
    counters.mediaVerifyCount += 1;
    let verified;
    try {
      verified =
        await adapters.verifyPublishedMedia(mediaId);
    } catch {
      returnValue = failAfterEventWrite({
        status:
          "INSTAGRAM_PUBLISHED_LEDGER_MISSING",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_MEDIA_VERIFY_UNKNOWN",
      });
      return returnValue;
    }
    if (
      verified?.ok !== true ||
      verified.id !== mediaId ||
      verified.mediaType !== "VIDEO" ||
      verified.mediaProductType !== "REELS" ||
      !safeInstagramPermalink(verified.permalink) ||
      !(
        typeof verified.publishedAtIso === "string" &&
        Number.isFinite(
          Date.parse(verified.publishedAtIso),
        )
      )
    ) {
      returnValue = failAfterEventWrite({
        status:
          "INSTAGRAM_PUBLISHED_LEDGER_MISSING",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_MEDIA_VERIFY_FAILED",
      });
      return returnValue;
    }
    publicState.instagram.mediaVerified = true;
    publicState.instagram.permalink =
      safeInstagramPermalink(verified.permalink);
    publicState.instagram.publishedAtIso =
      verified.publishedAtIso;
    publicState.instagram.mediaType = "VIDEO";
    publicState.instagram.mediaProductType = "REELS";
    if (
      !appendTransition(
        "instagram_media_verify_confirmed",
      )
    ) {
      returnValue = failAfterEventWrite({
        status:
          "INSTAGRAM_PUBLISHED_LEDGER_MISSING",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_MEDIA_VERIFY_CONFIRM_WRITE_FAILED",
      });
      return returnValue;
    }

    const beforeWriteLedger = readLedgerSnapshot({
      path: paths.ledgerPath,
      contentId:
        lockedCurrent.context.currentBinding.contentId,
      version:
        lockedCurrent.context.currentBinding.version,
      fsImpl,
    });
    if (
      !beforeWriteLedger.ok ||
      beforeWriteLedger.clean !== true ||
      beforeWriteLedger.sha256 !==
        lockedCurrent.plan.ledger.baselineSha256
    ) {
      publicState.ledger.currentSha256 =
        beforeWriteLedger.sha256 ?? null;
      returnValue = failAfterEventWrite({
        status:
          "INSTAGRAM_PUBLISHED_LEDGER_MISSING",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_LEDGER_CHANGED_BEFORE_WRITE",
      });
      return returnValue;
    }
    const record = {
      key: buildPublishLedgerKey(
        lockedCurrent.context.currentBinding.contentId,
        "instagram_reels",
        lockedCurrent.context.currentBinding.version,
      ),
      contentId:
        lockedCurrent.context.currentBinding.contentId,
      platform: "instagram_reels",
      version:
        lockedCurrent.context.currentBinding.version,
      variantId: INSTAGRAM_VARIANT_ID,
      publishedId: mediaId,
      publishedUrl:
        publicState.instagram.permalink,
      status: "published",
      publishedAtIso:
        publicState.instagram.publishedAtIso,
      metadata: {
        blobPathname:
          lockedCurrent.plan.blob.pathname,
        sourceSha256:
          lockedCurrent.context.currentBinding
            .instagramSourceSha256,
        accountId:
          lockedCurrent.plan.expectedInstagramAccountId,
        reviewPreflightFingerprint:
          lockedCurrent.plan.reviewPreflightFingerprint,
        recoveryPreflightFingerprint:
          parsed.expectedExecutionPreflightFingerprint,
        recoveryClaimFingerprint:
          claim.claimFingerprint,
      },
    };
    const recordResult =
      recordPublishLedgerEntryRuntime(
        beforeWriteLedger.ledger,
        record,
      );
    if (!recordResult.ok) {
      returnValue = failAfterEventWrite({
        status:
          "INSTAGRAM_PUBLISHED_LEDGER_MISSING",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_LEDGER_RECORD_INVALID_OR_DUPLICATE",
      });
      return returnValue;
    }
    if (!appendTransition("ledger_write_intent")) {
      returnValue = failAfterEventWrite({
        status:
          "INSTAGRAM_PUBLISHED_LEDGER_MISSING",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_LEDGER_INTENT_WRITE_FAILED",
      });
      return returnValue;
    }
    counters.ledgerWriteCount += 1;
    const ledgerWrite = ledgerWriter(
      paths.ledgerPath,
      recordResult.ledger,
      {
        expectedCurrentSha256:
          lockedCurrent.plan.ledger.baselineSha256,
      },
    );
    if (
      ledgerWrite?.committed !== true ||
      ledgerWrite?.ok !== true ||
      ledgerWrite?.lockReleased !== true
    ) {
      publicState.ledger.writeOk =
        ledgerWrite?.committed === true;
      if (ledgerWrite?.committed === true) {
        publicState.ledger.recordedKey = record.key;
        publicState.ledger.publishedId = mediaId;
        const uncertainReadback = readLedgerSnapshot({
          path: paths.ledgerPath,
          contentId:
            lockedCurrent.context.currentBinding
              .contentId,
          version:
            lockedCurrent.context.currentBinding.version,
          fsImpl,
        });
        publicState.ledger.currentSha256 =
          uncertainReadback.sha256 ?? null;
      }
      returnValue = failAfterEventWrite({
        status:
          ledgerWrite?.committed === true
            ? "INSTAGRAM_PUBLISHED_LEDGER_COMMIT_OUTCOME_UNKNOWN"
            : "INSTAGRAM_PUBLISHED_LEDGER_MISSING",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_LEDGER_WRITE_FAILED",
      });
      return returnValue;
    }
    publicState.ledger.writeOk = true;
    publicState.ledger.recordedKey = record.key;
    publicState.ledger.publishedId = mediaId;
    const readback = readLedgerSnapshot({
      path: paths.ledgerPath,
      contentId:
        lockedCurrent.context.currentBinding.contentId,
      version:
        lockedCurrent.context.currentBinding.version,
      fsImpl,
    });
    publicState.ledger.currentSha256 =
      readback.sha256 ?? null;
    if (
      !exactReadbackRecord({
        snapshot: readback,
        expectedRecord: record,
      })
    ) {
      returnValue = failAfterEventWrite({
        status:
          "INSTAGRAM_PUBLISHED_LEDGER_COMMIT_OUTCOME_UNKNOWN",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_LEDGER_READBACK_FAILED",
      });
      return returnValue;
    }
    publicState.ledger.readbackOk = true;
    if (
      !appendTransition("ledger_write_confirmed")
    ) {
      returnValue = failAfterEventWrite({
        status:
          "INSTAGRAM_AND_LEDGER_CONFIRMED_RECOVERY_EVIDENCE_INCOMPLETE",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_LEDGER_CONFIRM_WRITE_FAILED",
      });
      return returnValue;
    }
    if (!appendTransition("complete")) {
      returnValue = failAfterEventWrite({
        status:
          "INSTAGRAM_AND_LEDGER_CONFIRMED_RECOVERY_EVIDENCE_INCOMPLETE",
        blockerCode:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_COMPLETE_WRITE_FAILED",
      });
      return returnValue;
    }
    const successRelease =
      releaseMoneyShortsPart2InstagramRecoveryExecutionLock(
        {
          lock,
          fsImpl,
        },
      );
    recoveryLockFinalized = true;
    if (
      successRelease.ok !== true ||
      successRelease.released !== true
    ) {
      returnValue = {
        ok: false,
        status:
          "INSTAGRAM_AND_LEDGER_CONFIRMED_RECOVERY_EVIDENCE_INCOMPLETE",
        blockerCode:
          successRelease.reason ??
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_LOCK_RELEASE_NOT_CONFIRMED",
        instagramMediaId:
          publicState.instagram.mediaId,
        instagramPermalink:
          publicState.instagram.permalink,
        ledgerWriteConfirmed: true,
        successResultWritten: false,
        lockCleanupFailed: true,
        automaticRetryCount: 0,
        sideEffectCounters: clone(counters),
      };
      return returnValue;
    }
    returnValue = finalize({
      status:
        "PART2_INSTAGRAM_RECOVERY_OK",
      blockerCode: null,
    });
    return returnValue;
  } catch {
    returnValue =
      claim &&
      latestEvidenceSha256 &&
      latestTransition
        ? finalize({
            status:
              publicState.instagram.publishOutcome ===
              "confirmed_published"
                ? "INSTAGRAM_PUBLISHED_LEDGER_MISSING"
                : publicState.instagram.containerId !== null
                  ? "INSTAGRAM_CONTAINER_CREATED_NOT_PUBLISHED"
                  : counters.containerCreateCount === 1
                    ? "INSTAGRAM_CONTAINER_OUTCOME_UNKNOWN"
                    : "FAILED_BEFORE_RECOVERY_MUTATION",
            blockerCode:
              "PART2_INSTAGRAM_RECOVERY_EXECUTION_UNEXPECTED_FAILURE",
          })
        : {
            ok: false,
            status:
              claim
                ? "RECOVERY_CLAIMED_UNEXPECTED_FAILURE"
                : "BLOCKED_BEFORE_CLAIM",
            blockerCode:
              "PART2_INSTAGRAM_RECOVERY_EXECUTION_UNEXPECTED_FAILURE",
            noAutomaticRetry: true,
          };
    return returnValue;
  } finally {
    const release = recoveryLockFinalized
      ? { ok: true, released: true }
      : releaseMoneyShortsPart2InstagramRecoveryExecutionLock(
          {
            lock,
            fsImpl,
          },
        );
    recoveryLockFinalized = true;
    if (
      release.ok !== true ||
      release.released !== true
    ) {
      if (isPlainObject(returnValue)) {
        Object.assign(returnValue, {
          ok: false,
          lockCleanupFailed: true,
          lockCleanupBlockerCode: release.reason,
        });
      } else {
        returnValue = {
          ok: false,
          status:
            "RECOVERY_LOCK_CLEANUP_FAILED",
          lockCleanupFailed: true,
          lockCleanupBlockerCode: release.reason,
        };
      }
    }
  }
}

async function runWithDependencies({
  argv,
  dependencies,
}) {
  const parsed =
    parseMoneyShortsPart2InstagramRecoveryExecutionArgs(
      argv,
    );
  if (!parsed.ok) return parsed;
  const authorization =
    validateMoneyShortsPart2InstagramRecoveryExecutionAuthorization(
      {
        armed: parsed.armed,
        approval: parsed.approval,
        expectedReviewPreflightFingerprint:
          parsed.expectedReviewPreflightFingerprint,
        expectedExecutionPreflightFingerprint:
          parsed.expectedExecutionPreflightFingerprint,
      },
    );
  if (!authorization.ok) return authorization;
  const resolved = resolveParsedPaths(parsed);
  if (!resolved.ok) return resolved;
  const current = await loadCurrentExecutionPlan({
    parsed,
    paths: resolved.paths,
    reviewRunner: dependencies.reviewRunner,
    contextInspector: dependencies.contextInspector,
    materialInspector: dependencies.materialInspector,
    fsImpl: dependencies.fsImpl,
  });
  if (!current.ok) return current;
  const recoveryPaths =
    moneyShortsPart2InstagramRecoveryExecutionPaths(
      resolved.paths.recoveryOutDir,
    );
  if (!parsed.armed) {
    const existing = readJsonEvidence(
      recoveryPaths.preflightPath,
      dependencies.fsImpl,
    );
    if (existing.ok) {
      const validation =
        validateMoneyShortsPart2InstagramRecoveryExecutionPreflight(
          {
            evidence: existing.evidence,
            currentPlan: current.plan,
            expectedPreflightFingerprint:
              existing.evidence?.preflightFingerprint,
          },
        );
      const layout = inspectUnclaimedRecoveryLayout({
        recoveryPaths,
        expectedPreflightFingerprint:
          existing.evidence?.preflightFingerprint,
        fsImpl: dependencies.fsImpl,
      });
      if (
        validation.valid !== true ||
        layout.ok !== true
      ) {
        return {
          ok: false,
          reason:
            "PART2_INSTAGRAM_RECOVERY_EXECUTION_EXISTING_PREFLIGHT_INVALID",
        };
      }
      return {
        ok: true,
        status: "PREFLIGHT_ONLY_OK",
        armed: false,
        executionAuthorized: false,
        ownerApprovalRequired: true,
        orphanContainerRiskAcknowledgedByExactApproval:
          false,
        preflightFingerprint:
          existing.evidence.preflightFingerprint,
        preflightPath:
          recoveryPaths.preflightPath,
        preflightWriteCount: 0,
        sideEffectCounters:
          existing.evidence.sideEffectCounters,
      };
    }
    const emptyLayout = inspectUnclaimedRecoveryLayout({
      recoveryPaths,
      expectedPreflightFingerprint: null,
      fsImpl: dependencies.fsImpl,
    });
    if (!emptyLayout.ok) return emptyLayout;
    const preflight =
      buildMoneyShortsPart2InstagramRecoveryExecutionPreflight(
        {
          plan: current.plan,
          boundAtIso: dependencies.clock(),
        },
      );
    if (!preflight) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_PREFLIGHT_BUILD_FAILED",
      };
    }
    const written =
      writeMoneyShortsPart2InstagramRecoveryExecutionEvidenceOnce(
        {
          path: recoveryPaths.preflightPath,
          evidence: preflight,
          fingerprintField: "preflightFingerprint",
          fsImpl: dependencies.fsImpl,
        },
      );
    if (!written.ok) return written;
    const committedLayout =
      inspectUnclaimedRecoveryLayout({
        recoveryPaths,
        expectedPreflightFingerprint:
          preflight.preflightFingerprint,
        fsImpl: dependencies.fsImpl,
      });
    if (!committedLayout.ok) return committedLayout;
    return {
      ok: true,
      status: "PREFLIGHT_ONLY_OK",
      armed: false,
      executionAuthorized: false,
      ownerApprovalRequired: true,
      orphanContainerRiskAcknowledgedByExactApproval:
        false,
      contentId:
        current.plan.currentBinding.contentId,
      sourceSha256:
        current.plan.currentBinding
          .instagramSourceSha256,
      expectedInstagramAccountId:
        current.plan.expectedInstagramAccountId,
      reviewPreflightFingerprint:
        current.plan.reviewPreflightFingerprint,
      planFingerprint:
        current.plan.planFingerprint,
      preflightFingerprint:
        preflight.preflightFingerprint,
      preflightPath:
        recoveryPaths.preflightPath,
      preflightWriteCount: 1,
      sideEffectCounters:
        preflight.sideEffectCounters,
      noLiveActions: true,
    };
  }
  const layout = inspectUnclaimedRecoveryLayout({
    recoveryPaths,
    expectedPreflightFingerprint:
      parsed.expectedExecutionPreflightFingerprint,
    fsImpl: dependencies.fsImpl,
  });
  if (!layout.ok) return layout;
  const preflight = readJsonEvidence(
    recoveryPaths.preflightPath,
    dependencies.fsImpl,
  );
  const validation =
    validateMoneyShortsPart2InstagramRecoveryExecutionPreflight(
      {
        evidence: preflight.evidence,
        currentPlan: current.plan,
        expectedPreflightFingerprint:
          parsed.expectedExecutionPreflightFingerprint,
      },
    );
  if (!preflight.ok || !validation.valid) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_EXECUTION_PREFLIGHT_STALE_OR_INVALID",
    };
  }
  return executeArmed({
    parsed,
    paths: resolved.paths,
    current,
    dependencies,
  });
}

const productionDependencies = {
  fsImpl: nodeFs,
  reviewRunner:
    runMoneyShortsPart2InstagramRecoveryPreflight,
  contextInspector:
    inspectMoneyShortsPart2DualPublishSafeCurrentContext,
  materialInspector:
    inspectMoneyShortsPart2InstagramRecoveryExecutionMaterial,
  credentialsProvider:
    productionCredentialsProvider,
  adapterFactory: buildDefaultAdapters,
  ledgerWriter: writePublishLedgerRuntime,
  clock: nowIso,
};

/**
 * Production entry. Callers cannot replace env, Graph, filesystem, or ledger
 * dependencies.
 */
export async function runMoneyShortsPart2InstagramRecoveryExecution({
  argv,
}) {
  return runWithDependencies({
    argv,
    dependencies: productionDependencies,
  });
}

/**
 * Test-only seam. The production CLI never calls this export.
 */
export async function runMoneyShortsPart2InstagramRecoveryExecutionTestOnly({
  argv,
  reviewRunner,
  contextInspector,
  materialInspector,
  credentialsProvider,
  adapterFactory,
  ledgerWriter,
  fsImpl = nodeFs,
  clock = nowIso,
}) {
  return runWithDependencies({
    argv,
    dependencies: {
      fsImpl,
      reviewRunner,
      contextInspector,
      materialInspector,
      credentialsProvider,
      adapterFactory,
      ledgerWriter,
      clock,
    },
  });
}

async function main() {
  const result =
    await runMoneyShortsPart2InstagramRecoveryExecution({
      argv: process.argv.slice(2),
    });
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.ok === true ? 0 : 1;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(SCRIPT_PATH)
) {
  await main();
}
