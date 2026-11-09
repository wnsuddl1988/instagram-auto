import type {
  ImportIssue,
  TrendBriefImportValidationSummary,
  TrendResearchPromptInput,
} from "./contracts";
import { TREND_BRIEF_IMPORT_SCHEMA_VERSION } from "./research-prompt";

type UnknownRecord = Readonly<Record<string, unknown>>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function error(
  issues: ImportIssue[],
  code: string,
  fieldPath: string,
  message: string,
  repairable = true,
): void {
  issues.push({ code, severity: "error", blocking: true, fieldPath, message, repairable });
}

function warning(issues: ImportIssue[], code: string, fieldPath: string, message: string): void {
  issues.push({ code, severity: "warning", blocking: false, fieldPath, message, repairable: false });
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRealCalendarDate(yearText: string, monthText: string, dayText: string): boolean {
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const probe = new Date(0);
  probe.setUTCHours(0, 0, 0, 0);
  probe.setUTCFullYear(year, month - 1, day);
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

function validDateOnly(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  return Boolean(match && isRealCalendarDate(match[1], match[2], match[3]));
}

function parsePublishedAt(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2}))?$/u.exec(value);
  if (!match || !isRealCalendarDate(match[1], match[2], match[3])) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isBlockedIpv4(octets: readonly number[]): boolean {
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;
  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function parseIpv4MappedIpv6(hostname: string): readonly number[] | null {
  const dotted = /^::ffff:(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/u.exec(hostname);
  if (dotted) return dotted.slice(1).map(Number);
  const hexadecimal = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/u.exec(hostname);
  if (!hexadecimal) return null;
  const high = Number.parseInt(hexadecimal[1], 16);
  const low = Number.parseInt(hexadecimal[2], 16);
  return [high >>> 8, high & 0xff, low >>> 8, low & 0xff];
}

function classifyUrl(value: unknown): "ok" | "http" | "invalid" | "blocked" {
  if (!nonEmpty(value)) return "invalid";
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return "invalid";
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "blocked";
  if (parsed.username || parsed.password) return "blocked";
  const hostname = parsed.hostname
    .toLowerCase()
    .replace(/^\[|\]$/gu, "")
    .replace(/\.+$/u, "");
  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  ) return "blocked";
  if (hostname === "::1" || /^(?:fc|fd|fe8|fe9|fea|feb)[0-9a-f:]*$/u.test(hostname)) return "blocked";
  const mappedIpv4 = parseIpv4MappedIpv6(hostname);
  if (mappedIpv4 && isBlockedIpv4(mappedIpv4)) return "blocked";
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/u.exec(hostname);
  if (ipv4) {
    const octets = ipv4.slice(1).map(Number);
    if (octets.some((octet) => octet > 255)) return "invalid";
    if (isBlockedIpv4(octets)) return "blocked";
  }
  return parsed.protocol === "http:" ? "http" : "ok";
}

function amountNeedsCurrency(unit: unknown): boolean {
  return typeof unit === "string" && /(?:₩|\$|€|¥|원|달러|만원|억원|krw|usd|eur|jpy)/iu.test(unit);
}

function requiredString(
  object: UnknownRecord,
  key: string,
  path: string,
  issues: ImportIssue[],
): void {
  if (!nonEmpty(object[key])) error(issues, "required_field_missing", path, `${path} 값이 필요합니다.`);
}

export function validateTrendBriefImport(
  candidate: unknown,
  expectedInput: TrendResearchPromptInput,
): readonly ImportIssue[] {
  const issues: ImportIssue[] = [];
  if (!isRecord(candidate)) {
    error(issues, "full_reformat_required", "", "Trend Brief JSON object 전체 재포맷이 필요합니다.", false);
    return issues;
  }
  if (candidate.schemaVersion !== TREND_BRIEF_IMPORT_SCHEMA_VERSION) {
    error(issues, "schema_version_mismatch", "/schemaVersion", "지원하는 schema_version과 일치하지 않습니다.");
  }
  if (!validDateOnly(candidate.researchCutoffDate)) {
    error(issues, "invalid_cutoff_date", "/researchCutoffDate", "조사 기준일은 유효한 YYYY-MM-DD여야 합니다.");
  } else if (candidate.researchCutoffDate !== expectedInput.researchCutoffDate) {
    error(issues, "cutoff_date_mismatch", "/researchCutoffDate", "선택한 조사 기준일과 다릅니다.");
  }
  if (candidate.researchWindow !== expectedInput.researchWindow) {
    error(issues, "research_window_mismatch", "/researchWindow", "선택한 조사 기간과 다릅니다.");
  }
  if (candidate.domain !== expectedInput.domain) error(issues, "domain_mismatch", "/domain", "선택한 분야와 다릅니다.");
  if (candidate.audience !== expectedInput.audience) error(issues, "audience_mismatch", "/audience", "선택한 시청자와 다릅니다.");
  if (![30, 45, 60].includes(Number(candidate.targetDurationSeconds))) {
    error(issues, "invalid_target_duration", "/targetDurationSeconds", "영상 길이는 30·45·60초만 허용됩니다.");
  } else if (candidate.targetDurationSeconds !== expectedInput.targetDurationSeconds) {
    error(issues, "target_duration_mismatch", "/targetDurationSeconds", "선택한 영상 길이와 다릅니다.");
  }
  requiredString(candidate, "briefTitle", "/briefTitle", issues);
  requiredString(candidate, "executiveSummary", "/executiveSummary", issues);

  if (!Array.isArray(candidate.sources) || !Array.isArray(candidate.signals)) {
    error(issues, "full_reformat_required", "", "sources와 signals 배열이 모두 필요합니다.", false);
    return issues;
  }
  if (candidate.sources.length < 3) error(issues, "minimum_sources_required", "/sources", "출처가 최소 3개 필요합니다.", false);
  if (candidate.signals.length < 3) error(issues, "minimum_signals_required", "/signals", "신호가 최소 3개 필요합니다.", false);

  const sourceIds = new Set<string>();
  const duplicateSourceIds = new Set<string>();
  const sourceFresh = new Map<string, boolean>();
  const cutoffStart = validDateOnly(expectedInput.researchCutoffDate)
    ? Date.parse(`${expectedInput.researchCutoffDate}T00:00:00.000Z`)
    : Number.NaN;
  const cutoffEnd = cutoffStart + 86_399_999;
  const windowDays = expectedInput.researchWindow === "24h" ? 1 : expectedInput.researchWindow === "7d" ? 7 : 30;
  const freshStart = cutoffStart - (windowDays - 1) * 86_400_000;

  candidate.sources.forEach((source, index) => {
    const base = `/sources/${index}`;
    if (!isRecord(source)) {
      error(issues, "invalid_source", base, "출처 항목은 object여야 합니다.", false);
      return;
    }
    requiredString(source, "sourceId", `${base}/sourceId`, issues);
    requiredString(source, "publisher", `${base}/publisher`, issues);
    requiredString(source, "title", `${base}/title`, issues);
    if (nonEmpty(source.sourceId)) {
      if (sourceIds.has(source.sourceId)) duplicateSourceIds.add(source.sourceId);
      sourceIds.add(source.sourceId);
    }
    const urlState = classifyUrl(source.url);
    if (urlState === "invalid") error(issues, "invalid_source_url", `${base}/url`, "유효한 URL 문자열이 아닙니다.");
    if (urlState === "blocked") error(issues, "blocked_source_url", `${base}/url`, "로컬·사설·위험 scheme URL은 허용되지 않습니다.");
    if (urlState === "http") warning(issues, "insecure_http_source", `${base}/url`, "HTTP 출처입니다. HTTPS 원문을 우선하세요.");
    const published = parsePublishedAt(source.publishedAt);
    if (published === null) error(issues, "invalid_published_at", `${base}/publishedAt`, "유효한 게시 시각이 필요합니다.");
    else {
      if (Number.isFinite(cutoffEnd) && published > cutoffEnd) error(issues, "future_published_at", `${base}/publishedAt`, "조사 기준일 이후 게시 시각입니다.");
      const isFresh = Number.isFinite(freshStart) && published >= freshStart && published <= cutoffEnd;
      if (!isFresh) warning(issues, "background_source_outside_window", `${base}/publishedAt`, "선택한 기간 밖의 배경 출처입니다.");
      if (nonEmpty(source.sourceId)) sourceFresh.set(source.sourceId, isFresh);
    }
    if (source.eventDate !== null && !validDateOnly(source.eventDate)) {
      error(issues, "invalid_event_date", `${base}/eventDate`, "사건일은 YYYY-MM-DD 또는 null이어야 합니다.");
    }
  });
  for (const id of duplicateSourceIds) error(issues, "duplicate_source_id", "/sources", `중복 source ID: ${id}`, false);

  const signalIds = new Set<string>();
  const duplicateSignalIds = new Set<string>();
  candidate.signals.forEach((signal, index) => {
    const base = `/signals/${index}`;
    if (!isRecord(signal)) {
      error(issues, "invalid_signal", base, "신호 항목은 object여야 합니다.", false);
      return;
    }
    for (const [key, suffix] of [
      ["signalId", "signalId"],
      ["headline", "headline"],
      ["claim", "claim"],
      ["whyNow", "whyNow"],
      ["audienceImpact", "audienceImpact"],
    ] as const) requiredString(signal, key, `${base}/${suffix}`, issues);
    if (nonEmpty(signal.signalId)) {
      if (signalIds.has(signal.signalId)) duplicateSignalIds.add(signal.signalId);
      signalIds.add(signal.signalId);
    }
    if (!Array.isArray(signal.sourceRefs) || signal.sourceRefs.length === 0) {
      error(issues, "missing_source_ref", `${base}/sourceRefs`, "각 신호에 source ref가 최소 1개 필요합니다.");
    } else {
      const refs = signal.sourceRefs.filter((ref): ref is string => typeof ref === "string");
      for (const ref of refs) {
        if (!sourceIds.has(ref)) error(issues, "unknown_source_ref", `${base}/sourceRefs`, `존재하지 않는 source ID: ${ref}`);
      }
      if (!refs.some((ref) => sourceFresh.get(ref) === true)) {
        error(issues, "fresh_source_required", `${base}/sourceRefs`, "선택한 기간 안의 fresh source가 최소 1개 필요합니다.");
      }
    }
    if (!Array.isArray(signal.numbers)) {
      error(issues, "invalid_numbers", `${base}/numbers`, "numbers는 배열이어야 합니다.");
    } else {
      signal.numbers.forEach((number, numberIndex) => {
        const numberBase = `${base}/numbers/${numberIndex}`;
        if (!isRecord(number)) {
          error(issues, "invalid_number", numberBase, "숫자 항목은 object여야 합니다.", false);
          return;
        }
        if (typeof number.value !== "number" || !Number.isFinite(number.value)) error(issues, "invalid_number_value", `${numberBase}/value`, "value는 유한한 숫자여야 합니다.");
        if (!nonEmpty(number.unit)) error(issues, "missing_number_unit", `${numberBase}/unit`, "숫자 단위가 필요합니다.");
        if (!validDateOnly(number.asOf)) error(issues, "invalid_number_as_of", `${numberBase}/asOf`, "숫자 기준일이 필요합니다.");
        if (!nonEmpty(number.context)) error(issues, "missing_number_context", `${numberBase}/context`, "숫자의 맥락이 필요합니다.");
        if (amountNeedsCurrency(number.unit) && !nonEmpty(number.currency)) error(issues, "missing_currency", `${numberBase}/currency`, "금액 숫자에는 통화가 필요합니다.");
      });
    }
  });
  for (const id of duplicateSignalIds) error(issues, "duplicate_signal_id", "/signals", `중복 signal ID: ${id}`, false);
  return issues;
}

export function summarizeImportValidation(
  issues: readonly ImportIssue[],
): TrendBriefImportValidationSummary {
  const blockingIssueCount = issues.filter((entry) => entry.blocking).length;
  const warningCount = issues.filter((entry) => entry.severity === "warning").length;
  return {
    valid: blockingIssueCount === 0,
    issues: [...issues],
    validatedAt: "session-only:not-timestamped",
    blockingIssueCount,
    warningCount,
  };
}
