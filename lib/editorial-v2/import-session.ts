import type {
  ImportApprovalState,
  TrendBriefImportValidationSummary,
} from "./contracts";

function canonicalize(value: unknown, seen: Set<object>): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Only finite JSON numbers can be hashed.");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map((entry) => canonicalize(entry, seen)).join(",")}]`;
  if (typeof value === "object") {
    if (seen.has(value)) throw new TypeError("Circular values cannot be hashed.");
    seen.add(value);
    const object = value as Readonly<Record<string, unknown>>;
    const result = `{${Object.keys(object)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(object[key], seen)}`)
      .join(",")}}`;
    seen.delete(value);
    return result;
  }
  throw new TypeError("Only JSON-compatible values can be hashed.");
}

export function stableStringify(value: unknown): string {
  return canonicalize(value, new Set());
}

export async function sha256Utf8(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function hashNormalizedImport(value: unknown): Promise<string> {
  return sha256Utf8(stableStringify(value));
}

export function isDuplicateImportHash(hash: string, existingHashes: readonly string[]): boolean {
  return existingHashes.includes(hash);
}

export function canApproveImport(summary: TrendBriefImportValidationSummary | null): boolean {
  return Boolean(summary?.valid && summary.blockingIssueCount === 0);
}

export function invalidateImportApproval(previousState: ImportApprovalState): ImportApprovalState {
  return previousState === "approved" ? "invalidated" : "not_approved";
}
