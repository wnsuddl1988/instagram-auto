import type { EvidencePackDraft } from "./contracts";
import type { CutlineConfig, HookType } from "./editorial-cutline";
import { collectBannedPhraseHits, hasTemporalToken } from "./editorial-cutline";
import type { SourceRegistry } from "./economic-source-registry";
import { findProperNouns } from "./economic-source-registry";
import { resolveHookTypeCode } from "./live-topic-prompt";

// ── L3: deterministic cutline verifier ────────────────────────────────────────
//
// Re-checks what an LLM returned from a live-topic-prompt (L2-7) against the
// HARD CUT rules, without calling an LLM again. The L2-8 rehearsals showed
// self-check cannot be trusted either way — sometimes it hides a real failure
// (candidate hid every number yet reported all-true), sometimes it correctly
// flags a real bug (missing previous/change number records). This module is
// the actual gate; selfCheck from the model is carried through only as a
// diagnostic signal, never as a substitute for the checks below.
//
// Every function here is pure and synchronous — no network, no LLM call.

// ── Input shape (mirrors the JSON schema live-topic-prompt.ts instructs) ──────

export interface LiveTopicBeat {
  readonly scene: number;
  readonly role: string;
  readonly narration: string;
  readonly sceneVisualPrompt: string;
  readonly sourceRefs: readonly string[];
}

export interface LiveTopicCandidateInput {
  readonly candidateId: string;
  readonly title: string;
  readonly hookType: string;
  readonly hook: string;
  readonly sourceRefs: readonly string[];
  readonly numberRefs: readonly string[];
  readonly beats: readonly LiveTopicBeat[];
  readonly closingDisclaimer: string;
  /** Carried through for diagnostics only — never trusted as a verdict. */
  readonly selfCheck?: Readonly<Record<string, boolean>>;
}

export interface LiveTopicResponseInput {
  readonly candidates: readonly LiveTopicCandidateInput[];
}

// ── Verdict shape ──────────────────────────────────────────────────────────────

export type HardCutId =
  | "HC-01" | "HC-02" | "HC-03" | "HC-04" | "HC-05"
  | "HC-06" | "HC-07" | "HC-08" | "HC-09" | "HC-10";

export interface HardCutViolation {
  readonly id: HardCutId;
  readonly detail: string;
}

export interface CandidateVerdict {
  readonly candidateId: string;
  readonly passed: boolean;
  readonly violations: readonly HardCutViolation[];
  /** Where the model's own selfCheck disagreed with the deterministic result. */
  readonly selfCheckMismatches: readonly HardCutId[];
}

export interface ResponseVerdict {
  readonly candidateCount: number;
  readonly passedCount: number;
  readonly verdicts: readonly CandidateVerdict[];
}

// ── HC-01: temporal token in title ────────────────────────────────────────────

function checkHc01(candidate: LiveTopicCandidateInput, cutline: CutlineConfig): HardCutViolation | null {
  if (!cutline.hardCut.requireTemporalToken) return null;
  if (hasTemporalToken(cutline, candidate.title)) return null;
  return {
    id: "HC-01",
    detail: `title has no temporal token (expected one of: ${cutline.temporalTokens.join(", ")})`,
  };
}

// ── HC-02: proper noun in title ───────────────────────────────────────────────

function checkHc02(
  candidate: LiveTopicCandidateInput,
  cutline: CutlineConfig,
  registry: SourceRegistry,
): HardCutViolation | null {
  if (!cutline.hardCut.requireProperNoun) return null;
  if (findProperNouns(registry, candidate.title).length > 0) return null;
  return { id: "HC-02", detail: "title contains no known institution or program name" };
}

// ── HC-03: hook length ────────────────────────────────────────────────────────

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function checkHc03(candidate: LiveTopicCandidateInput, cutline: CutlineConfig): HardCutViolation | null {
  const words = countWords(candidate.hook);
  const chars = candidate.hook.length;
  if (words <= cutline.hardCut.hookMaxWords && chars <= cutline.hardCut.hookMaxChars) {
    return null;
  }
  return {
    id: "HC-03",
    detail: `hook is ${words} words / ${chars} chars (limit ${cutline.hardCut.hookMaxWords} words or ${cutline.hardCut.hookMaxChars} chars)`,
  };
}

// ── HC-04 / HC-08: reference integrity against the evidence pack ─────────────

function checkReferenceIntegrity(
  candidate: LiveTopicCandidateInput,
  pack: EvidencePackDraft,
): HardCutViolation[] {
  const violations: HardCutViolation[] = [];
  const sourceIds = new Set(pack.sources.map((s) => s.sourceId));
  const numberIds = new Set(pack.numbers.map((n) => n.numberId));

  if (candidate.sourceRefs.length === 0) {
    violations.push({ id: "HC-04", detail: "candidate has zero sourceRefs" });
  }
  const danglingSourceRefs = candidate.sourceRefs.filter((ref) => !sourceIds.has(ref));
  if (danglingSourceRefs.length > 0) {
    violations.push({
      id: "HC-04",
      detail: `sourceRefs not found in evidence pack: ${danglingSourceRefs.join(", ")}`,
    });
  }
  for (const beat of candidate.beats) {
    const danglingBeatRefs = beat.sourceRefs.filter((ref) => !sourceIds.has(ref));
    if (danglingBeatRefs.length > 0) {
      violations.push({
        id: "HC-04",
        detail: `scene ${beat.scene} sourceRefs not found in evidence pack: ${danglingBeatRefs.join(", ")}`,
      });
    }
  }

  const danglingNumberRefs = candidate.numberRefs.filter((ref) => !numberIds.has(ref));
  if (danglingNumberRefs.length > 0) {
    violations.push({
      id: "HC-08",
      detail: `numberRefs not found in evidence pack: ${danglingNumberRefs.join(", ")}`,
    });
  }

  return violations;
}

/**
 * HC-08's stronger check: every numeral that appears in narration must match
 * either (a) a value actually present in the evidence pack's numbers[]
 * (official ECOS/KOSIS statistics), or (b) a numeral that literally appears
 * in the description/title of a source the same beat actually cites via
 * sourceRefs (a news article's own summary text — see
 * TrendBriefImportSource.description). This catches a model inventing a
 * figure it never cited via numberRefs and never grounded in any source text
 * either — reference integrity alone would miss that, since an invented
 * number has no ref to be dangling in the first place.
 *
 * Path (b) exists because most real-world figures worth citing in a
 * live-news beat (e.g. "84주 연속 상승", "131건") come from a news article's
 * body/summary, not from an ECOS/KOSIS statistic — numbers[] only ever
 * contains officially-verified API figures (2026-09-17 finding: a
 * real_estate-domain rehearsal had zero numbers[] entries usable for its
 * actual story). Path (b) still refuses to accept a number that appears
 * nowhere in the cited source text, so it cannot be used to smuggle an
 * invented figure through — it only widens WHERE a legitimate citation can
 * come from, not WHETHER one is required.
 *
 * Deliberately conservative: only bare numerals immediately followed by a
 * unit are extracted (e.g. "3%", "0.25%p", "84주", "131건", "6조 8,321억 원"
 * reduces to 8321). Free-standing numbers with no unit (scene indices, list
 * numbers) are not narration claims and are excluded to avoid false
 * positives.
 */
// 월/일/년은 의도적으로 제외한다 — 날짜 표현(예: "8월 27일")은 시점 서술이지
// numbers[]로 검증할 "사실 주장 수치"가 아니다(발표일은 publishedAt으로 이미
// 별도 검증됨). 넣으면 정상 후보의 날짜 서술까지 "근거 없는 숫자"로 오탐한다
// (2026-09-17 회귀 테스트로 실측: "8월 27일"의 27이 오탐 트리거).
const NUMERAL_WITH_UNIT = /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(%p?|원|퍼센트|주|건|배|채|명|억|만|천)/g;

function extractNarrationNumerals(text: string): { raw: string; value: number }[] {
  const values: { raw: string; value: number }[] = [];
  for (const match of text.matchAll(NUMERAL_WITH_UNIT)) {
    const numeric = Number.parseFloat(match[1].replace(/,/g, ""));
    if (Number.isFinite(numeric)) values.push({ raw: match[0], value: numeric });
  }
  return values;
}

/** True if `raw` (e.g. "84주") appears verbatim in any of the given source texts. */
function numeralGroundedInSourceText(
  raw: string,
  beatSourceIds: readonly string[],
  sourceTextById: ReadonlyMap<string, string>,
): boolean {
  return beatSourceIds.some((id) => {
    const text = sourceTextById.get(id);
    return text !== undefined && text.includes(raw);
  });
}

/**
 * Multiplier-derived illustrative example exception (added 2026-09-19, Owner
 * decision during live 7-episode editing): a beat may illustrate an
 * already-grounded multiplier (e.g. a "3배" leveraged ETF, itself grounded via
 * path (a)/(b) above) with a paired percent example — "지수가 10% 빠지면 3배
 * ETF는 30% 빠진다" — even though 10%/30% never appear verbatim in any cited
 * source. This is not a new factual claim about the world; it is arithmetic
 * (percentA * multiplier ≈ percentB) applied to a structure the pack already
 * verifies. It does not open the door to inventing unrelated figures — the
 * multiplier itself must still be grounded, and only the two percentages that
 * are its exact product may be exempted.
 *
 * 이 예외는 하드컷 판정 코드를 프로그램 사양이 아니라 Owner-Main AI 합의로
 * 조정한 것이다 — 검증 로직이 실제 협의된 콘텐츠를 다시 뒤집지 않도록,
 * 앞으로도 이런 조정은 Owner 승인 시 반영하고 별도 되돌리지 않는다.
 */
function isMultiplierDerivedExample(
  raw: string,
  value: number,
  beat: LiveTopicBeat,
  sourceTextById: ReadonlyMap<string, string>,
): boolean {
  if (!/%$/.test(raw.trim())) return false;
  const multiplierMatch = beat.narration.match(/(\d+(?:\.\d+)?)\s*배/);
  if (!multiplierMatch) return false;
  const multiplierRaw = multiplierMatch[0];
  const multiplier = Number.parseFloat(multiplierMatch[1]);
  if (!Number.isFinite(multiplier) || multiplier <= 1) return false;
  // The multiplier itself (e.g. "3배") must be grounded in a source this beat
  // actually cites — otherwise this exception could smuggle an invented
  // multiplier through, not just an invented percent pair.
  if (!numeralGroundedInSourceText(multiplierRaw, beat.sourceRefs, sourceTextById)) return false;

  const percentValues = [...beat.narration.matchAll(/(\d+(?:\.\d+)?)\s*%/g)]
    .map((m) => Number.parseFloat(m[1]))
    .filter((n) => Number.isFinite(n));
  if (!percentValues.includes(value)) return false;

  return percentValues.some((other) => {
    if (other === value) return false;
    const ratio = Math.max(value, other) / Math.min(value, other);
    return Math.abs(ratio - multiplier) < 0.05 * multiplier;
  });
}

function checkHc08NumeralMatch(
  candidate: LiveTopicCandidateInput,
  pack: EvidencePackDraft,
): HardCutViolation | null {
  const knownValues = new Set(pack.numbers.map((n) => n.value));
  const sourceTextById = new Map(
    pack.sources.map((s) => [s.sourceId, `${s.title} ${s.description ?? ""}`]),
  );
  const unmatched = new Set<string>();

  for (const beat of candidate.beats) {
    for (const { raw, value } of extractNarrationNumerals(beat.narration)) {
      if (knownValues.has(value)) continue;
      if (numeralGroundedInSourceText(raw, beat.sourceRefs, sourceTextById)) continue;
      if (isMultiplierDerivedExample(raw, value, beat, sourceTextById)) continue;
      unmatched.add(raw);
    }
  }

  if (unmatched.size === 0) return null;
  return {
    id: "HC-08",
    detail: `narration cites numbers absent from evidence pack numbers[] and not found in any cited source's title/description: ${[...unmatched].join(", ")}`,
  };
}

// ── HC-05: freshness — at least one referenced source must be fresh ──────────

function checkHc05(candidate: LiveTopicCandidateInput, pack: EvidencePackDraft): HardCutViolation | null {
  const sourceById = new Map(pack.sources.map((s) => [s.sourceId, s] as const));
  const referenced = candidate.sourceRefs
    .map((ref) => sourceById.get(ref))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);

  if (referenced.length === 0) return null; // HC-04 already reports this case
  const hasFresh = referenced.some((s) => s.freshness === "fresh");
  if (hasFresh) return null;
  return {
    id: "HC-05",
    detail: `none of the candidate's referenced sources are fresh (freshness: ${referenced.map((s) => s.freshness).join(", ")})`,
  };
}

// ── HC-06 / HC-07: banned phrases and stock-pick language ────────────────────

const STOCK_ACTION_PATTERN = /(지금\s*사|지금\s*팔|매수하|매도하|가입하세요|가입해야)/;

function collectCandidateText(candidate: LiveTopicCandidateInput): string {
  return [
    candidate.title,
    candidate.hook,
    ...candidate.beats.map((b) => b.narration),
    candidate.closingDisclaimer,
  ].join("\n");
}

function checkHc06(candidate: LiveTopicCandidateInput, cutline: CutlineConfig): HardCutViolation | null {
  const text = collectCandidateText(candidate);
  const hits = collectBannedPhraseHits(cutline, text);
  if (hits.length === 0) return null;
  return {
    id: "HC-06",
    detail: `banned phrase(s) found: ${hits.map((h) => `${h.phrase}(${h.category})`).join(", ")}`,
  };
}

function checkHc07(candidate: LiveTopicCandidateInput): HardCutViolation | null {
  const text = collectCandidateText(candidate);
  if (!STOCK_ACTION_PATTERN.test(text)) return null;
  return { id: "HC-07", detail: "narration contains a buy/sell/subscribe action directive" };
}

// ── HC-09: disclaimer text ────────────────────────────────────────────────────

function checkHc09(candidate: LiveTopicCandidateInput, cutline: CutlineConfig): HardCutViolation | null {
  if (!cutline.hardCut.requireDisclaimer) return null;
  if (candidate.closingDisclaimer.trim() === cutline.disclaimerText.trim()) return null;
  return {
    id: "HC-09",
    detail: `closingDisclaimer does not match required text exactly (expected "${cutline.disclaimerText}")`,
  };
}

// ── HC-10: no baked-in text/number rendering instructions in visual prompts ──

const TEXT_RENDER_INSTRUCTION_PATTERNS: readonly RegExp[] = [
  // "텍스트를 표시/렌더/넣/작성" 또는 "~을 텍스트로 표시/렌더" 양방향 어순
  /텍스트(를|로)?\s*(표시|렌더|넣|작성)/,
  /숫자(를|로)?\s*(표시|렌더|넣|작성|적)/,
  /글자(를|로)?\s*(표시|렌더|넣|작성)/,
  /(표시|렌더|작성)\s*(된|하는|해)?\s*(텍스트|숫자|글자)/,
  /\bwrite\s+(the\s+)?(text|number|numbers)\b/i,
  /\bshow\s+(the\s+)?(text|caption|number)\b/i,
  /\brender\s+(the\s+)?text\b/i,
];

function checkHc10(candidate: LiveTopicCandidateInput): HardCutViolation | null {
  for (const beat of candidate.beats) {
    for (const pattern of TEXT_RENDER_INSTRUCTION_PATTERNS) {
      if (pattern.test(beat.sceneVisualPrompt)) {
        return {
          id: "HC-10",
          detail: `scene ${beat.scene} sceneVisualPrompt requests baked-in text/number rendering: "${beat.sceneVisualPrompt}"`,
        };
      }
    }
  }
  return null;
}

// ── Scene structure and hook type validation (not hard cuts, but structural) ─
//
// Fixed 8-beat scene count was retired (Owner-approved 2026-09-17): narration
// length must drive how many Flow/Gemini clips a beat needs (8s/10s cap per
// clip) rather than forcing content into a fixed slot count. What still must
// hold: scenes are numbered 1..N with no gaps, the first beat opens the hook,
// and every role is one this cutline actually recognizes (typos/invented
// roles still get caught). The last beat must be the closing disclaimer only
// when hardCut.requireDisclaimer is on — series like 부엉이 that replace the
// disclaimer with a fixed follow-CTA clip (Owner-approved 2026-09-17) turn
// that flag off and end on whatever role the script's last beat actually is.

function checkSceneStructure(
  candidate: LiveTopicCandidateInput,
  cutline: CutlineConfig,
): HardCutViolation[] {
  const violations: HardCutViolation[] = [];
  const beats = candidate.beats;
  const knownRoles = new Set(cutline.sceneStructure.map((s) => s.role));

  if (beats.length === 0) {
    violations.push({ id: "HC-10", detail: "candidate has zero beats" });
    return violations;
  }

  beats.forEach((beat, index) => {
    const expectedSceneNumber = index + 1;
    if (beat.scene !== expectedSceneNumber) {
      violations.push({
        id: "HC-10",
        detail: `beat[${index}] expected scene number ${expectedSceneNumber}, got ${beat.scene}`,
      });
    }
    if (!knownRoles.has(beat.role)) {
      violations.push({
        id: "HC-10",
        detail: `beat[${index}] role "${beat.role}" is not a recognized scene role`,
      });
    }
  });

  const firstRole = cutline.sceneStructure[0]?.role;
  const lastRole = cutline.sceneStructure[cutline.sceneStructure.length - 1]?.role;
  if (firstRole && beats[0].role !== firstRole) {
    violations.push({
      id: "HC-10",
      detail: `first beat must have role "${firstRole}", got "${beats[0].role}"`,
    });
  }
  if (cutline.hardCut.requireDisclaimer && lastRole && beats[beats.length - 1].role !== lastRole) {
    violations.push({
      id: "HC-10",
      detail: `last beat must have role "${lastRole}", got "${beats[beats.length - 1].role}"`,
    });
  }

  // Splitting a beat into several clips is fine, but dropping a required
  // story role entirely (e.g. beats truncated mid-script) is not — every
  // role the cutline defines, other than the disclaimer when it's off, must
  // still appear at least once regardless of how many scenes it spans.
  const presentRoles = new Set(beats.map((b) => b.role));
  for (const { role } of cutline.sceneStructure) {
    if (role === lastRole && !cutline.hardCut.requireDisclaimer) continue;
    if (!presentRoles.has(role)) {
      violations.push({ id: "HC-10", detail: `required scene role "${role}" is missing` });
    }
  }

  return violations;
}

/**
 * Accepts either the raw HookType code or the exact Korean label prefix the
 * prompt showed the model — resolveHookTypeCode() (live-topic-prompt.ts) is
 * the single source of that mapping, shared with live-topic-score.ts's S-02.
 */
function checkHookType(candidate: LiveTopicCandidateInput, cutline: CutlineConfig): HardCutViolation | null {
  const asCode = cutline.allowedHookTypes.includes(candidate.hookType as HookType)
    ? (candidate.hookType as HookType)
    : resolveHookTypeCode(candidate.hookType);
  if (asCode !== null && cutline.allowedHookTypes.includes(asCode)) return null;
  return {
    id: "HC-06",
    detail: `hookType "${candidate.hookType}" is not one of the allowed types (code or exact Korean label prefix)`,
  };
}

// ── Per-candidate verification ────────────────────────────────────────────────

export function verifyCandidate(
  candidate: LiveTopicCandidateInput,
  pack: EvidencePackDraft,
  cutline: CutlineConfig,
  registry: SourceRegistry,
): CandidateVerdict {
  const violations: HardCutViolation[] = [];

  const hc01 = checkHc01(candidate, cutline);
  if (hc01) violations.push(hc01);
  const hc02 = checkHc02(candidate, cutline, registry);
  if (hc02) violations.push(hc02);
  const hc03 = checkHc03(candidate, cutline);
  if (hc03) violations.push(hc03);
  violations.push(...checkReferenceIntegrity(candidate, pack));
  const hc08Numerals = checkHc08NumeralMatch(candidate, pack);
  if (hc08Numerals) violations.push(hc08Numerals);
  const hc05 = checkHc05(candidate, pack);
  if (hc05) violations.push(hc05);
  const hc06 = checkHc06(candidate, cutline);
  if (hc06) violations.push(hc06);
  const hookTypeViolation = checkHookType(candidate, cutline);
  if (hookTypeViolation) violations.push(hookTypeViolation);
  const hc07 = checkHc07(candidate);
  if (hc07) violations.push(hc07);
  const hc09 = checkHc09(candidate, cutline);
  if (hc09) violations.push(hc09);
  const hc10 = checkHc10(candidate);
  if (hc10) violations.push(hc10);
  violations.push(...checkSceneStructure(candidate, cutline));

  const selfCheckMismatches: HardCutId[] = [];
  if (candidate.selfCheck) {
    const failedIds = new Set(violations.map((v) => v.id));
    for (const [key, value] of Object.entries(candidate.selfCheck)) {
      const id = key as HardCutId;
      const actuallyFailed = failedIds.has(id);
      if (value === true && actuallyFailed) selfCheckMismatches.push(id);
      if (value === false && !actuallyFailed) selfCheckMismatches.push(id);
    }
  }

  return {
    candidateId: candidate.candidateId,
    passed: violations.length === 0,
    violations,
    selfCheckMismatches,
  };
}

export function verifyResponse(
  response: LiveTopicResponseInput,
  pack: EvidencePackDraft,
  cutline: CutlineConfig,
  registry: SourceRegistry,
): ResponseVerdict {
  const verdicts = response.candidates.map((candidate) =>
    verifyCandidate(candidate, pack, cutline, registry),
  );
  return {
    candidateCount: verdicts.length,
    passedCount: verdicts.filter((v) => v.passed).length,
    verdicts,
  };
}
