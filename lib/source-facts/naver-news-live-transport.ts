import type {
  NaverNewsRawResponse,
  NaverNewsSearchRequest,
  NaverNewsTransport,
  NaverNewsTransportResult,
} from "./naver-news-connector";
import {
  NAVER_NEWS_CLIENT_ID_ENV,
  NAVER_NEWS_CLIENT_SECRET_ENV,
} from "./naver-news-connector";

// ── Naver News live transport ─────────────────────────────────────────────────
//
// The only module in this connector that performs network I/O and reads env vars.
//
// Secret safety:
// - Credentials are sent as headers, never in the URL or query string.
// - Error messages carry a failure category and HTTP status only — never the
//   credentials, headers, or response body that might echo them back.

const NAVER_NEWS_API_URL = "https://openapi.naver.com/v1/search/news.json";

/** Timeliness is the point of this connector, so results are always date-sorted. */
const SORT_BY_DATE = "date";

export type NaverCredentials = {
  readonly clientId: string;
  readonly clientSecret: string;
};

/**
 * Reads credentials without exposing them. Returns null when either is missing,
 * so callers can report BLOCKED instead of attempting an unauthenticated call.
 *
 * Callers must never print or persist the returned values.
 */
export function resolveNaverCredentials(
  env: Readonly<Record<string, string | undefined>> = process.env,
): NaverCredentials | null {
  const clientId = env[NAVER_NEWS_CLIENT_ID_ENV]?.trim();
  const clientSecret = env[NAVER_NEWS_CLIENT_SECRET_ENV]?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function hasNaverCredentials(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return resolveNaverCredentials(env) !== null;
}

export function buildNaverNewsUrl(request: NaverNewsSearchRequest): string {
  const url = new URL(NAVER_NEWS_API_URL);
  url.searchParams.set("query", request.keyword);
  url.searchParams.set("display", String(request.display));
  url.searchParams.set("start", String(request.start));
  url.searchParams.set("sort", SORT_BY_DATE);
  return url.toString();
}

/**
 * Validates the response shape before it reaches normalization. A malformed
 * payload is rejected rather than coerced, so a silent API change surfaces as a
 * failure instead of empty evidence.
 */
export function parseNaverNewsResponse(payload: unknown): NaverNewsRawResponse | null {
  if (typeof payload !== "object" || payload === null) return null;
  const root = payload as Record<string, unknown>;
  if (!Array.isArray(root.items)) return null;

  const items = root.items.map((entry) => {
    const e = (typeof entry === "object" && entry !== null ? entry : {}) as Record<
      string,
      unknown
    >;
    const str = (value: unknown) => (typeof value === "string" ? value : "");
    return {
      title: str(e.title),
      originallink: str(e.originallink),
      link: str(e.link),
      description: str(e.description),
      pubDate: str(e.pubDate),
    };
  });

  const num = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback;

  return {
    total: num(root.total, items.length),
    start: num(root.start, 1),
    display: num(root.display, items.length),
    items,
  };
}

function describeHttpFailure(status: number): string {
  if (status === 401 || status === 403) return `auth rejected (HTTP ${status})`;
  if (status === 429) return `rate limited (HTTP ${status})`;
  if (status >= 500) return `naver server error (HTTP ${status})`;
  return `request failed (HTTP ${status})`;
}

export function createNaverNewsLiveTransport(options: {
  readonly credentials: NaverCredentials;
  readonly timeoutMs?: number;
}): NaverNewsTransport {
  const { credentials } = options;
  const timeoutMs = options.timeoutMs ?? 10_000;

  return {
    transportId: "naver-news-live",
    async executeAsync(
      request: NaverNewsSearchRequest,
    ): Promise<NaverNewsTransportResult> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(buildNaverNewsUrl(request), {
          method: "GET",
          headers: {
            "X-Naver-Client-Id": credentials.clientId,
            "X-Naver-Client-Secret": credentials.clientSecret,
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          return { ok: false, reason: describeHttpFailure(response.status) };
        }

        let payload: unknown;
        try {
          payload = await response.json();
        } catch {
          return { ok: false, reason: "response was not valid JSON" };
        }

        const parsed = parseNaverNewsResponse(payload);
        if (!parsed) {
          return { ok: false, reason: "response shape did not match expectations" };
        }
        return { ok: true, response: parsed };
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return { ok: false, reason: `request timed out after ${timeoutMs}ms` };
        }
        // Deliberately not surfacing error.message: it can contain the request URL.
        return { ok: false, reason: "network request failed" };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
