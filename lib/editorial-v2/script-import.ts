import type {
  DetailedScriptApprovalState,
  DetailedScriptBeat,
  DetailedScriptBeatType,
  DetailedScriptPackage,
  DetailedScriptValidationIssue,
  DetailedScriptValidationSummary,
  EvidencePackDraft,
  FieldRepairPackage,
  PromptPackage,
  SelectedAngleDraft,
  TargetDurationSeconds,
} from "./contracts";
import { DETAILED_SCRIPT_BEAT_TYPES } from "./contracts";
import {
  applyFieldLevelRepairs,
  buildImportRepairPrompt,
  type FieldRepairApplyResult,
} from "./import-repair";
import {
  normalizeExternalLlmResponse,
  type ExternalLlmNormalizationResult,
} from "./import-normalizer";
import { EDITORIAL_V2_SCHEMA_VERSION } from "./schema-version";

type UnknownRecord = Readonly<Record<string, unknown>>;

export interface DetailedScriptValidationContext {
  readonly selectedAngle: SelectedAngleDraft;
  readonly evidencePack: EvidencePackDraft;
  readonly audience: string;
  readonly durationSeconds: TargetDurationSeconds;
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function issue(
  code: string,
  fieldPath: string,
  message: string,
  repairable = true,
  blocking = true,
): DetailedScriptValidationIssue {
  return {
    code,
    severity: blocking ? "error" : "warning",
    blocking,
    fieldPath,
    message,
    repairable,
  };
}

function strings(value: unknown): readonly string[] | null {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string") ? value : null;
}

function asBeat(value: unknown): DetailedScriptBeat | null {
  if (!isRecord(value)) return null;
  const claimRefs = strings(value.claimRefs);
  const sourceRefs = strings(value.sourceRefs);
  const numberRefs = strings(value.numberRefs);
  if (
    typeof value.beatId !== "string" ||
    typeof value.beatType !== "string" ||
    !DETAILED_SCRIPT_BEAT_TYPES.includes(value.beatType as DetailedScriptBeatType) ||
    typeof value.purpose !== "string" ||
    typeof value.narration !== "string" ||
    typeof value.keyCaption !== "string" ||
    typeof value.retentionDevice !== "string" ||
    !claimRefs || !sourceRefs || !numberRefs
  ) return null;
  return {
    beatId: value.beatId,
    beatType: value.beatType as DetailedScriptBeatType,
    purpose: value.purpose,
    narration: value.narration,
    keyCaption: value.keyCaption,
    claimRefs: [...claimRefs],
    sourceRefs: [...sourceRefs],
    numberRefs: [...numberRefs],
    retentionDevice: value.retentionDevice,
  };
}

export function readDetailedScriptPackage(value: unknown): DetailedScriptPackage | null {
  if (!isRecord(value) || !Array.isArray(value.beats)) return null;
  const beats = value.beats.map(asBeat);
  if (beats.some((beat) => beat === null)) return null;
  if (
    typeof value.schemaVersion !== "string" ||
    typeof value.selectedAngleId !== "string" ||
    typeof value.title !== "string" ||
    typeof value.audience !== "string" ||
    ![30, 45, 60].includes(Number(value.durationSeconds)) ||
    typeof value.thesis !== "string" ||
    typeof value.closingAction !== "string" ||
    typeof value.nextSignal !== "string" ||
    typeof value.financialSafetyNote !== "string"
  ) return null;
  return {
    schemaVersion: value.schemaVersion,
    selectedAngleId: value.selectedAngleId,
    title: value.title,
    audience: value.audience,
    durationSeconds: Number(value.durationSeconds) as TargetDurationSeconds,
    thesis: value.thesis,
    beats: beats as readonly DetailedScriptBeat[],
    closingAction: value.closingAction,
    nextSignal: value.nextSignal,
    financialSafetyNote: value.financialSafetyNote,
  };
}

const UNSAFE_FINANCIAL = /(?:무조건|확실한\s*수익|수익\s*보장|매수|매도|guaranteed\s+return|\bbuy\b|\bsell\b)/iu;
const URL_LITERAL = /https?:\/\/\S+/giu;
const NUMBER_OR_DATE = /\b\d{4}-\d{2}-\d{2}\b|(?<![\p{L}\d])\d+(?:[.,]\d+)?(?![\p{L}\d])/gu;

function allowedLiterals(evidencePack: EvidencePackDraft): Set<string> {
  const values = new Set<string>([evidencePack.provenance.researchCutoffDate]);
  for (const number of evidencePack.numbers) {
    values.add(String(number.value));
    values.add(number.asOf);
  }
  for (const source of evidencePack.sources) {
    values.add(source.publishedAt.slice(0, 10));
    if (source.eventDate) values.add(source.eventDate);
  }
  return values;
}

export function validateDetailedScriptPackage(
  value: unknown,
  context: DetailedScriptValidationContext,
): DetailedScriptValidationSummary {
  const issues: DetailedScriptValidationIssue[] = [];
  const script = readDetailedScriptPackage(value);
  if (!script) {
    const invalid = issue("invalid_script_schema", "/", "Detailed Script JSON schema가 올바르지 않습니다.", false);
    return { valid: false, issues: [invalid], blockingIssueCount: 1, warningCount: 0, validatedAt: `${context.evidencePack.provenance.researchCutoffDate}T00:00:00.000Z` };
  }
  if (script.schemaVersion !== EDITORIAL_V2_SCHEMA_VERSION) issues.push(issue("schema_version_mismatch", "/schemaVersion", "schemaVersion이 일치하지 않습니다."));
  if (script.selectedAngleId !== context.selectedAngle.selectedAngleId) issues.push(issue("selected_angle_mismatch", "/selectedAngleId", "승인된 selected angle ID와 다릅니다.", false));
  if (script.audience !== context.audience) issues.push(issue("audience_mismatch", "/audience", "승인된 audience와 다릅니다."));
  if (script.durationSeconds !== context.durationSeconds) issues.push(issue("duration_mismatch", "/durationSeconds", "승인된 영상 길이와 다릅니다."));
  if (script.beats.length !== DETAILED_SCRIPT_BEAT_TYPES.length) issues.push(issue("beat_count_mismatch", "/beats", "beats는 정확히 8개여야 합니다.", false));
  const beatIds = new Set<string>();
  const sourceIds = new Set(context.evidencePack.sources.map((source) => source.sourceId));
  const claimIds = new Set(context.evidencePack.claims.map((claim) => claim.claimId));
  const numberIds = new Set(context.evidencePack.numbers.map((number) => number.numberId));
  for (const [index, beat] of script.beats.entries()) {
    const base = `/beats/${index}`;
    if (beat.beatType !== DETAILED_SCRIPT_BEAT_TYPES[index]) issues.push(issue("beat_order_mismatch", `${base}/beatType`, "beatType 순서가 올바르지 않습니다.", false));
    if (beatIds.has(beat.beatId)) issues.push(issue("duplicate_beat_id", `${base}/beatId`, beat.beatId, false));
    beatIds.add(beat.beatId);
    for (const [field, text] of [["purpose", beat.purpose], ["narration", beat.narration], ["keyCaption", beat.keyCaption], ["retentionDevice", beat.retentionDevice]] as const) {
      if (!text.trim()) issues.push(issue("required_beat_text_missing", `${base}/${field}`, `${field}가 비어 있습니다.`));
    }
    if (beat.sourceRefs.length === 0) issues.push(issue("beat_source_ref_required", `${base}/sourceRefs`, "각 beat에는 source ref가 필요합니다.", false));
    for (const [field, refs, known] of [["claimRefs", beat.claimRefs, claimIds], ["sourceRefs", beat.sourceRefs, sourceIds], ["numberRefs", beat.numberRefs, numberIds]] as const) {
      refs.forEach((reference, refIndex) => {
        if (!known.has(reference)) issues.push(issue("unsupported_reference", `${base}/${field}/${refIndex}`, reference));
      });
    }
  }
  const contentText = [script.title, script.thesis, script.closingAction, script.nextSignal, script.financialSafetyNote, ...script.beats.flatMap((beat) => [beat.purpose, beat.narration, beat.keyCaption, beat.retentionDevice])].join(" ");
  const allowed = allowedLiterals(context.evidencePack);
  for (const literal of contentText.match(NUMBER_OR_DATE) ?? []) {
    const normalized = literal.replaceAll(",", "");
    if (!allowed.has(literal) && !allowed.has(normalized)) issues.push(issue("unsupported_numeric_or_date_literal", "/", literal, false));
  }
  for (const url of contentText.match(URL_LITERAL) ?? []) {
    if (!context.evidencePack.sources.some((source) => source.url === url)) issues.push(issue("unsupported_url", "/", url, false));
  }
  if (UNSAFE_FINANCIAL.test(contentText)) issues.push(issue("unsafe_financial_language", "/", "매수·매도·수익 보장·확정적 예측 표현이 있습니다.", false));
  if (script.beats.every((beat) => beat.narration.trim().length < 18)) issues.push(issue("generic_only_script", "/beats", "대본이 지나치게 일반적이거나 짧습니다.", false));
  if (/^(?:절약|아껴|돈을\s*아껴)/u.test(script.closingAction.trim())) issues.push(issue("generic_saving_action", "/closingAction", "closing action이 일반 절약 조언에 머뭅니다.", true, false));
  if (!script.nextSignal.trim()) issues.push(issue("next_signal_required", "/nextSignal", "다음 경제 신호가 필요합니다."));
  const narrationCharacters = script.beats.reduce((sum, beat) => sum + beat.narration.length, 0);
  if (narrationCharacters > context.durationSeconds * 8) issues.push(issue("speech_length_estimate_high", "/beats", "추정 발화량이 목표 길이에 비해 많습니다. 실제 녹음 길이는 검증하지 않았습니다.", false, false));
  const blockingIssueCount = issues.filter((entry) => entry.blocking).length;
  return {
    valid: blockingIssueCount === 0,
    issues,
    blockingIssueCount,
    warningCount: issues.length - blockingIssueCount,
    validatedAt: `${context.evidencePack.provenance.researchCutoffDate}T00:00:00.000Z`,
  };
}

export function normalizeDetailedScriptResponse(rawText: string): ExternalLlmNormalizationResult {
  return normalizeExternalLlmResponse(rawText);
}

export function canApproveDetailedScript(summary: DetailedScriptValidationSummary | null): boolean {
  return Boolean(summary?.valid && summary.blockingIssueCount === 0);
}

export function invalidateDetailedScriptApproval(
  state: DetailedScriptApprovalState,
): DetailedScriptApprovalState {
  return state === "approved" ? "invalidated" : "not_approved";
}

export function getDetailedScriptRepairAllowedPaths(
  summary: DetailedScriptValidationSummary | null,
): readonly string[] {
  return summary?.issues
    .filter((entry) => entry.repairable && /^\/(?:title|thesis|closingAction|nextSignal|financialSafetyNote|beats\/\d+\/(?:purpose|narration|keyCaption|retentionDevice|claimRefs\/\d+|sourceRefs\/\d+|numberRefs\/\d+))$/u.test(entry.fieldPath))
    .map((entry) => entry.fieldPath) ?? [];
}

export function buildDetailedScriptRepairPrompt(input: {
  readonly projectId: string;
  readonly rawText: string;
  readonly summary: DetailedScriptValidationSummary;
  readonly allowedPaths: readonly string[];
  readonly researchCutoffDate: string;
}): PromptPackage {
  return buildImportRepairPrompt({
    projectId: input.projectId,
    rawText: input.rawText,
    issues: input.summary.issues,
    allowedPaths: input.allowedPaths,
    researchCutoffDate: input.researchCutoffDate,
  });
}

export function applyDetailedScriptRepairs(
  base: unknown,
  repairPackage: FieldRepairPackage,
  allowedPaths: readonly string[],
): FieldRepairApplyResult {
  return applyFieldLevelRepairs(base, repairPackage, allowedPaths);
}
