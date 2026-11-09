import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

// ── KIS OAuth access-token file cache ──────────────────────────────────────────
//
// KIS access tokens are valid ~24h and KIS's issuance endpoint rejects
// re-issuing a fresh token too frequently for the same app key (documented
// KIS policy: roughly one issuance per minute, and repeated same-day
// issuance can be throttled) — so a token obtained once must be reused across
// process runs, not re-fetched on every script invocation. This module is the
// only place that reads/writes the cache file; kis-live-transport.ts calls
// into it rather than touching the filesystem itself.
//
// The cache file lives outside the repo (matches the ECOS/DART/Alpha Vantage
// convention of writing generated artifacts under C:\tmp\money-shorts-os\,
// never into the repo tree) and contains a short-lived bearer token, not a
// long-term secret — the app key/secret used to obtain it are the real
// secrets and stay in process.env only, never written to this file.

export interface KisCachedToken {
  readonly accessToken: string;
  readonly tokenType: string;
  /** ISO 8601 UTC — when this token stops being valid (per KIS's expires_in). */
  readonly expiresAtIso: string;
  /** Which KIS server this token is valid for ("live" vs "vts") — a token from
   *  one server must never be reused against the other. */
  readonly serverMode: string;
}

const DEFAULT_CACHE_PATH = "C:/tmp/money-shorts-os/kis-token-cache.json";

/**
 * Safety margin subtracted from the real expiry so a token is never used
 * right at the edge of expiring mid-request.
 */
const EXPIRY_SAFETY_MARGIN_MS = 5 * 60 * 1000;

export function resolveKisTokenCachePath(override?: string): string {
  return override ?? DEFAULT_CACHE_PATH;
}

/**
 * Reads the cached token from disk. Returns null when the file does not
 * exist, cannot be parsed, or does not match the expected shape — a
 * corrupted cache must never crash the caller, it should just look like "no
 * cached token" and trigger a fresh issuance.
 */
export function readKisTokenCache(cachePath: string = DEFAULT_CACHE_PATH): KisCachedToken | null {
  if (!existsSync(cachePath)) return null;
  let raw: string;
  try {
    raw = readFileSync(cachePath, "utf8");
  } catch {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const p = parsed as Record<string, unknown>;
  if (
    typeof p.accessToken !== "string" ||
    typeof p.tokenType !== "string" ||
    typeof p.expiresAtIso !== "string" ||
    typeof p.serverMode !== "string"
  ) {
    return null;
  }
  return {
    accessToken: p.accessToken,
    tokenType: p.tokenType,
    expiresAtIso: p.expiresAtIso,
    serverMode: p.serverMode,
  };
}

/**
 * Writes the token cache to disk, creating the parent directory if needed.
 * Never throws — a write failure degrades to "cache not persisted", which is
 * safe (the next call will just re-issue), not a correctness problem.
 */
export function writeKisTokenCache(
  token: KisCachedToken,
  cachePath: string = DEFAULT_CACHE_PATH,
): boolean {
  try {
    mkdirSync(path.dirname(cachePath), { recursive: true });
    writeFileSync(cachePath, JSON.stringify(token, null, 2) + "\n", "utf8");
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns true when the cached token is usable right now: present, matches
 * the requested server mode, and has not crossed the safety-margined expiry.
 *
 * `nowMs` is a caller-supplied timestamp (not Date.now() inside this pure
 * function) so callers can test expiry logic deterministically — mirrors the
 * caller-supplied `fetchedAt` convention used across the other connectors.
 */
export function isKisTokenUsable(
  token: KisCachedToken | null,
  serverMode: string,
  nowMs: number,
): boolean {
  if (token === null) return false;
  if (token.serverMode !== serverMode) return false;
  const expiresAtMs = Date.parse(token.expiresAtIso);
  if (!Number.isFinite(expiresAtMs)) return false;
  return nowMs < expiresAtMs - EXPIRY_SAFETY_MARGIN_MS;
}
