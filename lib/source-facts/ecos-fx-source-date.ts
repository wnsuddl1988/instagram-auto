import type { EcosStatRow } from "./ecos-connector";

// ── 원/달러 매매기준율(731Y001) publishedDate resolver ─────────────────────────
//
// Unlike the base rate (a policy decision announced on a separate date from the
// data period) and CPI (a monthly release announced ~1 month after the data
// period), the BOK 매매기준율 daily series publishes each business day's rate
// ON that same day — the "매매기준율" for 2026-09-17 IS the rate BOK announces
// for 2026-09-17, published that morning. ECOS TIME (YYYYMMDD) for this series
// is therefore already the announcement date; no separate press-release lookup
// exists for a daily FX fixing rate (there is no per-day "article" to check).
//
// This module still refuses to invent a date for malformed TIME values —
// it only converts an already-valid ECOS daily TIME into ISO format.

export type EcosFxSourceDateResolution =
  | {
      readonly ok: true;
      readonly verifiedPublishedDate: string;
      readonly sourceUrl: string;
      readonly sourceName: string;
    }
  | {
      readonly ok: false;
      readonly reason: string;
      readonly code: "malformed_daily_time";
    };

export const BOK_FX_SOURCE_URL = "https://ecos.bok.or.kr/#/Short/731Y001";
export const BOK_FX_SOURCE_NAME = "한국은행 ECOS — 원/달러 매매기준율";

/**
 * Converts the latest ECOS daily FX row's TIME (YYYYMMDD) into the verified
 * publishedDate. Valid because 매매기준율 is announced same-day (see module
 * header) — this is a format conversion, not a date invention.
 */
export function resolveEcosFxSourceDate(
  latestRow: EcosStatRow,
): EcosFxSourceDateResolution {
  const time = latestRow.TIME;
  if (!/^\d{8}$/.test(time)) {
    return {
      ok: false,
      code: "malformed_daily_time",
      reason: `ECOS 일별 TIME("${time}")이 YYYYMMDD 형식이 아닙니다.`,
    };
  }
  const iso = `${time.slice(0, 4)}-${time.slice(4, 6)}-${time.slice(6, 8)}`;
  return {
    ok: true,
    verifiedPublishedDate: iso,
    sourceUrl: BOK_FX_SOURCE_URL,
    sourceName: BOK_FX_SOURCE_NAME,
  };
}
