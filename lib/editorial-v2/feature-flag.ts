import { EDITORIAL_V2_FEATURE_FLAG_ENV } from "./schema-version";

export const EDITORIAL_V2_TRUE_FLAG_VALUES = ["1", "true"] as const;

/**
 * Surrounding whitespace is ignored. Matching remains case-sensitive, so values
 * such as `TRUE` fail closed instead of being silently normalized.
 */
export function parseEditorialV2Enabled(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const normalized = value.trim();
  return EDITORIAL_V2_TRUE_FLAG_VALUES.some((allowed) => allowed === normalized);
}

export function isEditorialV2Enabled(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return parseEditorialV2Enabled(env[EDITORIAL_V2_FEATURE_FLAG_ENV]);
}
