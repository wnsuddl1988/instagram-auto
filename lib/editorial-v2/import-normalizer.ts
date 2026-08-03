import type {
  ImportedResponseFormat,
  ImportIssue,
  ImportNormalizationMethod,
} from "./contracts";

export const MAX_EXTERNAL_LLM_RESPONSE_CHARACTERS = 250_000;

export interface MarkdownBlock {
  readonly type: "heading" | "bullet" | "numbered" | "paragraph";
  readonly level: number | null;
  readonly text: string;
}

export interface ExternalLlmNormalizationResult {
  readonly rawText: string;
  readonly format: ImportedResponseFormat;
  readonly method: ImportNormalizationMethod;
  readonly value: unknown | null;
  readonly markdownStructure: readonly MarkdownBlock[];
  readonly issues: readonly ImportIssue[];
  readonly automaticInferences: readonly string[];
}

interface JsonSpan {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

function issue(code: string, message: string, repairable = false): ImportIssue {
  return { code, severity: "error", blocking: true, fieldPath: "", message, repairable };
}

function scanBalancedJson(text: string): JsonSpan[] {
  const spans: JsonSpan[] = [];
  let start = -1;
  let stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (start < 0) {
      if (character === "{" || character === "[") {
        start = index;
        stack = [character];
      }
      continue;
    }
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') {
      inString = true;
      continue;
    }
    if (character === "{" || character === "[") stack.push(character);
    if (character === "}" || character === "]") {
      const expected = character === "}" ? "{" : "[";
      if (stack.at(-1) !== expected) {
        start = -1;
        stack = [];
        continue;
      }
      stack.pop();
      if (stack.length === 0) {
        spans.push({ start, end: index + 1, text: text.slice(start, index + 1) });
        start = -1;
      }
    }
  }
  return spans;
}

function containsUnsafeKey(value: unknown, depth = 0): boolean {
  if (depth > 40) return true;
  if (Array.isArray(value)) return value.some((entry) => containsUnsafeKey(entry, depth + 1));
  if (!value || typeof value !== "object") return false;
  return Object.keys(value).some(
    (key) =>
      key === "__proto__" ||
      key === "prototype" ||
      key === "constructor" ||
      containsUnsafeKey((value as Record<string, unknown>)[key], depth + 1),
  );
}

function copyMappedObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(copyMappedObject);
  if (!value || typeof value !== "object") return value;
  const aliases: Readonly<Record<string, string>> = {
    schema_version: "schemaVersion",
    research_cutoff_date: "researchCutoffDate",
    research_window: "researchWindow",
    target_duration_seconds: "targetDurationSeconds",
    brief_title: "briefTitle",
    executive_summary: "executiveSummary",
    source_id: "sourceId",
    published_at: "publishedAt",
    event_date: "eventDate",
    signal_id: "signalId",
    why_now: "whyNow",
    audience_impact: "audienceImpact",
    source_refs: "sourceRefs",
    as_of: "asOf",
  };
  const result: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const [key, entry] of Object.entries(value)) {
    result[aliases[key] ?? key] = copyMappedObject(entry);
  }
  return result;
}

function markdownBlocks(text: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  for (const rawLine of text.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line) continue;
    const heading = /^(#{1,6})\s+(.+)$/u.exec(line);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      continue;
    }
    const bullet = /^[-*+]\s+(.+)$/u.exec(line);
    if (bullet) {
      blocks.push({ type: "bullet", level: null, text: bullet[1] });
      continue;
    }
    const numbered = /^\d+[.)]\s+(.+)$/u.exec(line);
    if (numbered) {
      blocks.push({ type: "numbered", level: null, text: numbered[1] });
      continue;
    }
    blocks.push({ type: "paragraph", level: null, text: line });
  }
  return blocks;
}

function isInsideSingleJsonFence(text: string, span: JsonSpan): boolean {
  const fences = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/giu)];
  if (fences.length !== 1 || fences[0].index === undefined) return false;
  const contentOffset = fences[0][0].indexOf(fences[0][1]);
  const contentStart = fences[0].index + contentOffset;
  const contentEnd = contentStart + fences[0][1].length;
  return span.start >= contentStart && span.end <= contentEnd;
}

export function normalizeExternalLlmResponse(rawText: string): ExternalLlmNormalizationResult {
  const base = { rawText, markdownStructure: [], automaticInferences: [] } as const;
  if (rawText.length > MAX_EXTERNAL_LLM_RESPONSE_CHARACTERS) {
    return { ...base, format: "unsupported", method: "unsupported", value: null, issues: [issue("input_too_large", "응답이 250,000자를 초과했습니다.")] };
  }
  const parsingText = rawText.replace(/^\uFEFF/u, "").trim();
  if (!parsingText) {
    return { ...base, format: "unsupported", method: "unsupported", value: null, issues: [issue("empty_input", "붙여넣은 응답이 비어 있습니다.")] };
  }

  try {
    const exact: unknown = JSON.parse(parsingText);
    if (containsUnsafeKey(exact)) {
      return { ...base, format: "unsupported", method: "unsupported", value: null, issues: [issue("unsafe_prototype_key", "prototype 오염 위험 키가 포함되어 있습니다.")] };
    }
    return {
      ...base,
      format: Array.isArray(exact) ? "json_array" : "json_object",
      method: "exact_json",
      value: copyMappedObject(exact),
      issues: [],
    };
  } catch {
    // Continue through the bounded extraction strategies.
  }

  const spans = scanBalancedJson(parsingText);
  const valid = spans.flatMap((span) => {
    try {
      return [{ span, value: JSON.parse(span.text) as unknown }];
    } catch {
      return [];
    }
  });
  if (valid.length > 1) {
    return { ...base, format: "unsupported", method: "unsupported", value: null, issues: [issue("ambiguous_multiple_json_candidates", "유효한 JSON 후보가 여러 개라 자동 선택하지 않았습니다.")] };
  }
  if (valid.length === 1) {
    const [{ span, value }] = valid;
    if (containsUnsafeKey(value)) {
      return { ...base, format: "unsupported", method: "unsupported", value: null, issues: [issue("unsafe_prototype_key", "prototype 오염 위험 키가 포함되어 있습니다.")] };
    }
    return {
      ...base,
      format: Array.isArray(value) ? "json_array" : "json_object",
      method: isInsideSingleJsonFence(parsingText, span) ? "fenced_json" : "embedded_json",
      value: copyMappedObject(value),
      issues: [],
    };
  }
  if (/^[\[{]/u.test(parsingText) || spans.length > 0) {
    return { ...base, format: "unsupported", method: "unsupported", value: null, issues: [issue("malformed_json", "JSON 형식이 올바르지 않아 부분 복원하지 않았습니다.")] };
  }
  const structure = markdownBlocks(parsingText);
  if (/^#{1,6}\s|^[-*+]\s|^\d+[.)]\s/mu.test(parsingText)) {
    return {
      rawText,
      format: "markdown",
      method: "structured_markdown",
      value: null,
      markdownStructure: structure,
      automaticInferences: [],
      issues: [issue("canonical_reformat_required", "Markdown 구조는 보존했지만 Trend Brief로 자동 변환하지 않았습니다.")],
    };
  }
  return { ...base, format: "unsupported", method: "unsupported", value: null, issues: [issue("unsupported_plain_text", "지원되지 않는 일반 텍스트입니다. JSON 전체 재포맷이 필요합니다.")] };
}
