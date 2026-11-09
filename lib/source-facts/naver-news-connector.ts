import type {
  PublisherTier,
  SourceRegistry,
} from "../editorial-v2/economic-source-registry";
import { resolvePublisherTier } from "../editorial-v2/economic-source-registry";

// ── Request ───────────────────────────────────────────────────────────────────

export const NAVER_NEWS_DISPLAY_MAX = 100;
export const NAVER_NEWS_START_MAX = 1000;

/**
 * Timeliness is the whole point of this connector, so `sort` is fixed to "date".
 * Relevance ordering would surface old articles that fail the freshness cutline.
 */
export interface NaverNewsSearchRequest {
  readonly keyword: string;
  readonly display: number;
  readonly start: number;
}

export const NAVER_NEWS_CLIENT_ID_ENV = "NAVER_CLIENT_ID";
export const NAVER_NEWS_CLIENT_SECRET_ENV = "NAVER_CLIENT_SECRET";
export const NAVER_NEWS_ENV_NAMES = [
  NAVER_NEWS_CLIENT_ID_ENV,
  NAVER_NEWS_CLIENT_SECRET_ENV,
] as const;

export class NaverNewsRequestError extends Error {
  constructor(message: string) {
    super(`naver news request invalid: ${message}`);
    this.name = "NaverNewsRequestError";
  }
}

export function buildNaverNewsRequest(
  keyword: string,
  options: { display?: number; start?: number } = {},
): NaverNewsSearchRequest {
  const trimmed = keyword.trim();
  if (trimmed.length < 2) {
    throw new NaverNewsRequestError("keyword must be at least 2 characters");
  }
  const display = options.display ?? 30;
  const start = options.start ?? 1;
  if (!Number.isInteger(display) || display < 1 || display > NAVER_NEWS_DISPLAY_MAX) {
    throw new NaverNewsRequestError(`display must be 1..${NAVER_NEWS_DISPLAY_MAX}`);
  }
  if (!Number.isInteger(start) || start < 1 || start > NAVER_NEWS_START_MAX) {
    throw new NaverNewsRequestError(`start must be 1..${NAVER_NEWS_START_MAX}`);
  }
  if (start + display - 1 > NAVER_NEWS_START_MAX) {
    throw new NaverNewsRequestError(
      `start + display - 1 must not exceed ${NAVER_NEWS_START_MAX}`,
    );
  }
  return { keyword: trimmed, display, start };
}

// ── Raw response (as documented by the Naver Search API) ──────────────────────

export interface NaverNewsRawItem {
  readonly title: string;
  readonly originallink: string;
  readonly link: string;
  readonly description: string;
  readonly pubDate: string;
}

export interface NaverNewsRawResponse {
  readonly total: number;
  readonly start: number;
  readonly display: number;
  readonly items: readonly NaverNewsRawItem[];
}

export type NaverNewsTransportResult =
  | { readonly ok: true; readonly response: NaverNewsRawResponse }
  | { readonly ok: false; readonly reason: string };

/**
 * Mirrors the ECOS transport shape: `executeAsync` rather than `fetch` to avoid
 * shadowing the global, and no process.env access at the interface level.
 */
export interface NaverNewsTransport {
  readonly transportId: string;
  executeAsync(request: NaverNewsSearchRequest): Promise<NaverNewsTransportResult>;
}

// ── Normalized item ───────────────────────────────────────────────────────────

export interface NaverNewsItem {
  readonly title: string;
  readonly description: string;
  readonly link: string;
  readonly originallink: string;
  /** ISO 8601 UTC, converted from the RFC822 `pubDate`. */
  readonly publishedAt: string;
  readonly publisherTier: PublisherTier;
  readonly publisherName: string | null;
  /** Canonical form of originallink (or link) used for duplicate detection. */
  readonly canonicalUrl: string;
}

export type DroppedReason =
  | "unparsable_date"
  | "missing_link"
  | "empty_title"
  | "duplicate";

export interface DroppedNewsItem {
  readonly title: string;
  readonly reason: DroppedReason;
}

export interface NaverNewsCollectResult {
  readonly keyword: string;
  readonly items: readonly NaverNewsItem[];
  /** T3 items are kept separately: usable as topic hints, never as evidence. */
  readonly untieredItems: readonly NaverNewsItem[];
  readonly dropped: readonly DroppedNewsItem[];
  readonly totalReported: number;
}

// ── Text and date normalization ───────────────────────────────────────────────

const HTML_ENTITIES: ReadonlyMap<string, string> = new Map([
  ["&amp;", "&"],
  ["&lt;", "<"],
  ["&gt;", ">"],
  ["&quot;", '"'],
  ["&apos;", "'"],
  ["&#39;", "'"],
  ["&nbsp;", " "],
]);

/** Naver wraps matched terms in <b> tags and HTML-escapes the rest. */
export function stripNaverMarkup(raw: string): string {
  let text = raw.replace(/<[^>]*>/g, "");
  for (const [entity, char] of HTML_ENTITIES) {
    text = text.split(entity).join(char);
  }
  text = text.replace(/&#(\d+);/g, (_match, code: string) => {
    const point = Number.parseInt(code, 10);
    return Number.isFinite(point) ? String.fromCodePoint(point) : "";
  });
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Returns null rather than a fallback date when parsing fails — an invented
 * publish date would silently defeat the freshness cutline.
 */
export function parseRfc822ToIso(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const parsed = new Date(trimmed);
  const time = parsed.getTime();
  if (!Number.isFinite(time)) return null;
  return parsed.toISOString();
}

/**
 * Same article syndicated across sections differs only by query order, trailing
 * slash, case, or fragment — normalize those away before duplicate detection.
 */
export function canonicalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const params = [...parsed.searchParams.entries()].sort(([a], [b]) =>
    a === b ? 0 : a < b ? -1 : 1,
  );
  const query = params.map(([key, value]) => `${key}=${value}`).join("&");
  const pathname = parsed.pathname.replace(/\/+$/, "");
  return `${host}${pathname}${query ? `?${query}` : ""}`;
}

// ── Normalization ─────────────────────────────────────────────────────────────

/**
 * Splits results into evidence-eligible (T1/T2) and hint-only (T3) buckets, and
 * drops anything that cannot be dated or linked. Duplicates are resolved by
 * canonical URL, keeping the first occurrence (the API is date-sorted).
 */
export function normalizeNaverNewsResponse(
  response: NaverNewsRawResponse,
  registry: SourceRegistry,
  keyword: string,
): NaverNewsCollectResult {
  const items: NaverNewsItem[] = [];
  const untieredItems: NaverNewsItem[] = [];
  const dropped: DroppedNewsItem[] = [];
  const seen = new Set<string>();

  for (const raw of response.items) {
    const title = stripNaverMarkup(raw.title);
    if (title === "") {
      dropped.push({ title: raw.title, reason: "empty_title" });
      continue;
    }

    const preferredLink = raw.originallink?.trim() || raw.link?.trim() || "";
    const canonicalUrl = canonicalizeUrl(preferredLink);
    if (!canonicalUrl) {
      dropped.push({ title, reason: "missing_link" });
      continue;
    }

    const publishedAt = parseRfc822ToIso(raw.pubDate);
    if (!publishedAt) {
      dropped.push({ title, reason: "unparsable_date" });
      continue;
    }

    if (seen.has(canonicalUrl)) {
      dropped.push({ title, reason: "duplicate" });
      continue;
    }
    seen.add(canonicalUrl);

    const { tier, publisherName } = resolvePublisherTier(registry, preferredLink);
    const item: NaverNewsItem = {
      title,
      description: stripNaverMarkup(raw.description),
      link: raw.link,
      originallink: raw.originallink,
      publishedAt,
      publisherTier: tier,
      publisherName,
      canonicalUrl,
    };
    if (tier === "T3") untieredItems.push(item);
    else items.push(item);
  }

  return {
    keyword,
    items,
    untieredItems,
    dropped,
    totalReported: response.total,
  };
}

// ── Runner ────────────────────────────────────────────────────────────────────

export type NaverNewsCollectOutcome =
  | { readonly ok: true; readonly result: NaverNewsCollectResult }
  | { readonly ok: false; readonly keyword: string; readonly reason: string };

export async function collectNaverNews(
  request: NaverNewsSearchRequest,
  transport: NaverNewsTransport,
  registry: SourceRegistry,
): Promise<NaverNewsCollectOutcome> {
  const outcome = await transport.executeAsync(request);
  if (outcome.ok) {
    return {
      ok: true,
      result: normalizeNaverNewsResponse(outcome.response, registry, request.keyword),
    };
  }
  return { ok: false, keyword: request.keyword, reason: outcome.reason };
}

/**
 * Runs keywords sequentially and tolerates per-keyword failure: one dead keyword
 * must not blank out an entire topic domain's news evidence.
 */
export async function collectNaverNewsForKeywords(
  keywords: readonly string[],
  transport: NaverNewsTransport,
  registry: SourceRegistry,
  options: { display?: number } = {},
): Promise<{
  results: readonly NaverNewsCollectResult[];
  failed: readonly { keyword: string; reason: string }[];
}> {
  const results: NaverNewsCollectResult[] = [];
  const failed: { keyword: string; reason: string }[] = [];

  for (const keyword of keywords) {
    let request: NaverNewsSearchRequest;
    try {
      request = buildNaverNewsRequest(keyword, { display: options.display });
    } catch (error) {
      failed.push({
        keyword,
        reason: error instanceof Error ? error.message : String(error),
      });
      continue;
    }
    const outcome = await collectNaverNews(request, transport, registry);
    if (outcome.ok) {
      results.push(outcome.result);
    } else {
      failed.push({ keyword: outcome.keyword, reason: outcome.reason });
    }
  }

  return { results, failed };
}

/**
 * Merges per-keyword results, removing articles that matched several keywords.
 */
export function mergeNaverNewsResults(
  results: readonly NaverNewsCollectResult[],
): { items: readonly NaverNewsItem[]; untieredItems: readonly NaverNewsItem[] } {
  const seen = new Set<string>();
  const items: NaverNewsItem[] = [];
  const untieredItems: NaverNewsItem[] = [];

  for (const result of results) {
    for (const item of result.items) {
      if (seen.has(item.canonicalUrl)) continue;
      seen.add(item.canonicalUrl);
      items.push(item);
    }
    for (const item of result.untieredItems) {
      if (seen.has(item.canonicalUrl)) continue;
      seen.add(item.canonicalUrl);
      untieredItems.push(item);
    }
  }

  const byNewest = (a: NaverNewsItem, b: NaverNewsItem) =>
    b.publishedAt.localeCompare(a.publishedAt);
  return {
    items: [...items].sort(byNewest),
    untieredItems: [...untieredItems].sort(byNewest),
  };
}

// ── Mock transport ────────────────────────────────────────────────────────────

export function createNaverNewsMockTransport(
  fixtures: ReadonlyMap<string, NaverNewsTransportResult>,
): NaverNewsTransport {
  return {
    transportId: "naver-news-mock",
    executeAsync(request) {
      const fixture = fixtures.get(request.keyword);
      return Promise.resolve(
        fixture ?? { ok: false, reason: `no fixture for keyword: ${request.keyword}` },
      );
    },
  };
}
