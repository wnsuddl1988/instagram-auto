import type { EvidencePackDraft } from "./contracts";
import type { CutlineConfig, HookType } from "./editorial-cutline";
import type { SourceRegistry } from "./economic-source-registry";
import type { LiveTopicCandidateInput } from "./live-topic-cutline-check";
import { resolveHookTypeCode } from "./live-topic-prompt";

// ── S-01..S-10 scoring ─────────────────────────────────────────────────────────
//
// Ranks candidates that already passed L3's hard-cut gate (cutline §4). This
// module never rejects a candidate — HARD CUT is a pass/fail gate (L3);
// SCORE only orders survivors. A candidate with score 0 still reaches this
// point having already cleared every HC-01..HC-10 check.
//
// Reliability varies by item, and that variance is reported rather than
// hidden behind a single number:
//   - S-01, S-05, S-06, S-07, S-09: computed from evidence pack / registry
//     structure — the same input two callers see always yields the same
//     score. Labeled "structural".
//   - S-02, S-04, S-08: approximated from surface text patterns (hook-type
//     mapping, keyword presence). These are proxies for a judgment call an
//     LLM made when writing the candidate, not independent verification —
//     labeled "heuristic".
//   - S-10: the character/format is not finalized yet (cutline is written
//     against a not-yet-locked candidate character), so there is nothing to
//     compare "channel tone" against. Fixed at a neutral 1 and labeled
//     "not_yet_determinable" rather than guessed.
//   - S-03: self-relevance requires understanding who the claim is actually
//     about, which pattern-matching cannot approximate above chance. Fixed at
//     null (no automated score) and left to Owner review, per cutline §7's
//     "Owner 수동 채점" provision for items automation cannot judge reliably.
//
// The cutline document itself states score is 사전 순위화 (heuristic
// pre-score), not a quality gate — this module's confidence labels make that
// same caveat visible per-item instead of only in prose.

export type ScoreConfidence = "structural" | "heuristic" | "not_yet_determinable" | "manual_only";

export type ScoreItemId =
  | "S-01" | "S-02" | "S-03" | "S-04" | "S-05"
  | "S-06" | "S-07" | "S-08" | "S-09" | "S-10";

export interface ScoreItemResult {
  readonly id: ScoreItemId;
  /** null only for S-03 (manual_only) — no automated estimate is produced. */
  readonly points: 0 | 1 | 2 | null;
  readonly confidence: ScoreConfidence;
  readonly rationale: string;
}

export interface CandidateScore {
  readonly candidateId: string;
  readonly items: readonly ScoreItemResult[];
  /** Sum of non-null items only. Compare totalPossible, not maxScore, when S-03 is null. */
  readonly total: number;
  /** Sum of points that were actually scored (excludes S-03's null contribution). */
  readonly totalPossible: number;
  readonly passesThreshold: boolean;
  /** True if any item is heuristic or manual_only — total should not be read as precise. */
  readonly hasLowConfidenceItems: boolean;
}

const DAY_MS = 86_400_000;

function daysBetween(fromIso: string, toIso: string): number | null {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  return Math.floor((to - from) / DAY_MS);
}

function sourceMap(pack: EvidencePackDraft) {
  return new Map(pack.sources.map((s) => [s.sourceId, s] as const));
}

// ── S-01: specific-figure precision ───────────────────────────────────────────

// "연%"는 ECOS 원자료의 실제 unit 표기(연간 이율)다. 2026-09-16 라이브 실행에서
// LLM이 evidence pack의 unit 값을 그대로 따라 "2.75연%" 형태로 정확히 인용했는데도
// 이 정규식이 %p?만 인식해 정밀 인용이 대략치로 오판정되는 문제를 발견해 확장했다.
const PRECISE_KOREAN_NUMBER = /\d+(?:,\d{3})*(?:\.\d+)?\s*(?:연%|%p?|원|건|명|배)/;
const VAGUE_MAGNITUDE_WORD = /(수십|수백|수천|수만|수조|수억|약\s*\d)/;

/**
 * True if narration cites a figure grounded in evidence — either (a) via
 * numberRefs into the official numbers[] array (ECOS/KOSIS statistics), or
 * (b) a beat whose narration contains a precise numeral that literally
 * appears in the title/description of a source that same beat cites via
 * sourceRefs (a news article's own text — mirrors HC-08's path (b) in
 * live-topic-cutline-check.ts, added 2026-09-17 so S-01 doesn't penalize
 * exactly the citation style HC-08 was widened to allow — a real_estate-
 * domain rehearsal had zero numbers[] entries for its actual story, only
 * description-grounded figures like "84주 연속 상승").
 */
function citesGroundedFigure(candidate: LiveTopicCandidateInput, pack: EvidencePackDraft): boolean {
  const numberIds = new Set(pack.numbers.map((n) => n.numberId));
  if (candidate.numberRefs.some((ref) => numberIds.has(ref))) return true;

  const sourceTextById = new Map(
    pack.sources.map((s) => [s.sourceId, `${s.title} ${s.description ?? ""}`]),
  );
  return candidate.beats.some((beat) => {
    const matches = beat.narration.match(PRECISE_KOREAN_NUMBER_G) ?? [];
    return matches.some((raw) =>
      beat.sourceRefs.some((id) => sourceTextById.get(id)?.includes(raw.trim())),
    );
  });
}

const PRECISE_KOREAN_NUMBER_G = /\d+(?:,\d{3})*(?:\.\d+)?\s*(?:연%|%p?|원|건|명|배|주)/g;

function scoreS01(candidate: LiveTopicCandidateInput, pack: EvidencePackDraft): ScoreItemResult {
  const text = candidate.beats.map((b) => b.narration).join(" ");

  if (!citesGroundedFigure(candidate, pack)) {
    return { id: "S-01", points: 0, confidence: "structural", rationale: "no numberRefs resolve to a known evidence-pack figure, and no narration numeral is grounded in a cited source's title/description" };
  }
  if (VAGUE_MAGNITUDE_WORD.test(text) && !PRECISE_KOREAN_NUMBER.test(text)) {
    return { id: "S-01", points: 1, confidence: "structural", rationale: "cites a grounded figure but narration only states an approximate magnitude" };
  }
  if (PRECISE_KOREAN_NUMBER.test(text)) {
    return { id: "S-01", points: 2, confidence: "structural", rationale: "narration states a precise figure grounded in the evidence pack" };
  }
  return { id: "S-01", points: 1, confidence: "structural", rationale: "cites a grounded figure but the exact figure is not restated in narration text" };
}

// ── S-02: curiosity gap (heuristic — hook type proxy) ────────────────────────

const CURIOSITY_HOOK_TYPES: ReadonlySet<HookType> = new Set(["info_gap", "real_reason"]);
const WEAK_CURIOSITY_HOOK_TYPES: ReadonlySet<HookType> = new Set(["named_mistake", "myth_bust"]);

function scoreS02(hookType: HookType | null): ScoreItemResult {
  if (hookType && CURIOSITY_HOOK_TYPES.has(hookType)) {
    return { id: "S-02", points: 2, confidence: "heuristic", rationale: `hookType "${hookType}" opens a gap the answer resolves` };
  }
  if (hookType && WEAK_CURIOSITY_HOOK_TYPES.has(hookType)) {
    return { id: "S-02", points: 1, confidence: "heuristic", rationale: `hookType "${hookType}" implies a moderate gap` };
  }
  return { id: "S-02", points: 0, confidence: "heuristic", rationale: "hookType does not map to a recognized curiosity-gap pattern" };
}

// ── S-03: self-relevance — not automated ──────────────────────────────────────

function scoreS03(): ScoreItemResult {
  return {
    id: "S-03",
    points: null,
    confidence: "manual_only",
    rationale: "self-relevance requires judging who the claim actually applies to — no reliable text proxy; Owner review required (cutline §7)",
  };
}

// ── S-04: loss-aversion trigger (heuristic — keyword proxy) ─────────────────

// "모르고 접근하면"은 2026-09-19 7편(레버리지 ETF) 편집에서 확인된 등가
// 표현이다 — "지나치면"(정보를 놓치고 넘어간다)과 달리 "위험을 모른 채 상품에
// 뛰어든다"는 뜻이라 오히려 이 문맥에 더 정확하다. 강한 손실회피 패턴으로
// 취급해 대본을 게이트에 맞춰 어색하게 바꾸는 대신 게이트를 넓혔다(Owner 승인).
const STRONG_LOSS_AVERSION = /모르고\s*지나치면|모르고\s*접근하면|놓치면|모르면\s*손해/;
const WEAK_LOSS_AVERSION = /놓치기\s*쉽다|빠질\s*수\s*있다|주의|조심/;

function scoreS04(candidate: LiveTopicCandidateInput): ScoreItemResult {
  const lossAversionBeat = candidate.beats.find((b) => b.role === "loss_aversion");
  const text = lossAversionBeat?.narration ?? candidate.beats.map((b) => b.narration).join(" ");
  if (STRONG_LOSS_AVERSION.test(text)) {
    return { id: "S-04", points: 2, confidence: "heuristic", rationale: "loss_aversion narration matches a strong avoidance-regret pattern" };
  }
  if (WEAK_LOSS_AVERSION.test(text)) {
    return { id: "S-04", points: 1, confidence: "heuristic", rationale: "loss_aversion narration matches a mild caution pattern" };
  }
  return { id: "S-04", points: 0, confidence: "heuristic", rationale: "no loss-aversion language pattern detected" };
}

// ── S-05: timeliness (structural — freshness + kind + age) ──────────────────

function scoreS05(
  candidate: LiveTopicCandidateInput,
  pack: EvidencePackDraft,
  cutline: CutlineConfig,
): ScoreItemResult {
  const byId = sourceMap(pack);
  const referenced = candidate.sourceRefs
    .map((ref) => byId.get(ref))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);

  // Which evidenceKind backs each referenced source is not carried on
  // EvidenceSourceRecord itself (kindMap lives in the adapter's return value,
  // not the pack), so this infers kind from provenance shape: a source whose
  // sourceImportSchemaVersion is the live-evidence-adapter's stamp and whose
  // title/publisher matches a "statistic"-looking pattern is treated as
  // statistic; everything else is treated as news. This is a pragmatic
  // approximation — see the note in the module doc comment.
  const looksLikeStatistic = (title: string) => /통계|지수|기준금리|지표|\(\d{4}년/.test(title);

  const newsRefs = referenced.filter((s) => !looksLikeStatistic(s.title));
  const statRefs = referenced.filter((s) => looksLikeStatistic(s.title));

  if (newsRefs.length === 0 && statRefs.length > 0) {
    const cap = cutline.score.statisticOnlyTimelinessCap;
    return {
      id: "S-05",
      points: Math.min(cap, 1) as 0 | 1,
      confidence: "structural",
      rationale: `only statistic-type sources referenced; capped at ${cap} per cutline §3.2-4`,
    };
  }
  if (newsRefs.length === 0) {
    return { id: "S-05", points: 0, confidence: "structural", rationale: "no referenced sources resolved" };
  }

  const ages = newsRefs
    .map((s) => daysBetween(s.publishedAt, `${pack.provenance.researchCutoffDate}T23:59:59.999Z`))
    .filter((d): d is number => d !== null);
  if (ages.length === 0) {
    return { id: "S-05", points: 0, confidence: "structural", rationale: "news source publishedAt could not be parsed" };
  }
  const minAge = Math.min(...ages);
  if (minAge <= 1) {
    return { id: "S-05", points: 2, confidence: "structural", rationale: `freshest referenced news source is ${minAge} day(s) old` };
  }
  if (minAge <= 7) {
    return { id: "S-05", points: 1, confidence: "structural", rationale: `freshest referenced news source is ${minAge} day(s) old` };
  }
  return { id: "S-05", points: 0, confidence: "structural", rationale: `freshest referenced news source is ${minAge} day(s) old, outside the 7-day window` };
}

// ── S-06: proper-noun recognizability (structural — T1/T2 tier proxy) ────────

function scoreS06(candidate: LiveTopicCandidateInput, registry: SourceRegistry): ScoreItemResult {
  const byId = new Map(registry.publishers.T1.concat(registry.publishers.T2).map((p) => [p.name, p] as const));
  const T1_NAMES: ReadonlySet<string> = new Set(registry.publishers.T1.map((p) => p.name));

  const mentionsT1 = [...T1_NAMES].some((name) => candidate.title.includes(name));
  if (mentionsT1) {
    return { id: "S-06", points: 2, confidence: "structural", rationale: "title mentions a T1 (official/public) institution name" };
  }
  const mentionsAnyRegistered = [...byId.keys()].some((name) => candidate.title.includes(name));
  if (mentionsAnyRegistered) {
    return { id: "S-06", points: 1, confidence: "structural", rationale: "title mentions a registered (T1/T2) name but not a T1 institution" };
  }
  return { id: "S-06", points: 0, confidence: "structural", rationale: "title mentions no registered institution or publisher name" };
}

// ── S-07: immediate actionability (heuristic — keyword proxy) ────────────────

const TODAY_ONE_MINUTE = /오늘.{0,10}(1분|바로|즉시)|(1분|바로|즉시).{0,10}확인/;
// "확인하자/해보세요/해보자" 등 청유형·존댓말 명령형을 모두 인식한다. 실제 라이브
// 실행(2026-09-16)에서 "~를 확인하세요" 존댓말 명령형이 걸리지 않아 실제 실행
// 가능한 action beat인데도 0점으로 판정된 사례를 확인해 패턴을 넓혔다.
const TIME_NEEDED = /확인(하자|해보자|해보세요|하세요)|살펴보(자|세요)|검토해?\s*보?(자|세요)/;

// 2026-09-19: action이 2~3개 씬으로 나뉘는 표준(4편 이후 확정, action을
// 뭉뚱그리지 않고 서로 다른 실행 채널로 쪼갬)에서 .find()가 첫 번째 action만
// 채점해 나머지(예: 7편 action_b/action_c)를 완전히 무시하는 문제를 확인했다
// (Owner 승인 조정). 모든 action 씬 중 가장 높은 점수를 채택한다.
function scoreS07(candidate: LiveTopicCandidateInput): ScoreItemResult {
  const actionBeats = candidate.beats.filter((b) => b.role === "action");
  if (actionBeats.length === 0) {
    return { id: "S-07", points: 0, confidence: "heuristic", rationale: "no action beat present" };
  }
  if (actionBeats.some((b) => TODAY_ONE_MINUTE.test(b.narration))) {
    return { id: "S-07", points: 2, confidence: "heuristic", rationale: "an action beat frames a same-day, near-immediate check" };
  }
  if (actionBeats.some((b) => TIME_NEEDED.test(b.narration))) {
    return { id: "S-07", points: 1, confidence: "heuristic", rationale: "an action beat asks the viewer to check something, without immediacy framing" };
  }
  return { id: "S-07", points: 0, confidence: "heuristic", rationale: "no action beat proposes a concrete checkable action" };
}

// ── S-08: twist existence (heuristic — keyword proxy) ────────────────────────

const STRONG_TWIST =
  /실제로는|하지만|반전|알고\s*있지만\s*아니다|만이?\s*아니라|만\s*보면.{0,20}(보이지만|처럼\s*보이지만)|핵심은/;
const WEAK_TWIST = /그런데|다만|중요한\s*것은|사실은/;

function scoreS08(candidate: LiveTopicCandidateInput): ScoreItemResult {
  const twistBeat = candidate.beats.find((b) => b.role === "twist");
  const text = twistBeat?.narration ?? "";
  if (STRONG_TWIST.test(text)) {
    return { id: "S-08", points: 2, confidence: "heuristic", rationale: "twist beat contains an explicit reversal marker" };
  }
  if (WEAK_TWIST.test(text)) {
    return { id: "S-08", points: 1, confidence: "heuristic", rationale: "twist beat contains a mild contrast marker" };
  }
  return { id: "S-08", points: 0, confidence: "heuristic", rationale: "twist beat shows no detectable reversal language" };
}

// ── S-09: visualizability (structural — evidence_card cites real refs) ──────

function scoreS09(candidate: LiveTopicCandidateInput, pack: EvidencePackDraft): ScoreItemResult {
  const sourceIds = new Set(pack.sources.map((s) => s.sourceId));
  const evidenceCardBeat = candidate.beats.find((b) => b.role === "evidence_card");
  if (!evidenceCardBeat) {
    return { id: "S-09", points: 0, confidence: "structural", rationale: "no evidence_card scene present" };
  }
  const validRefs = evidenceCardBeat.sourceRefs.filter((ref) => sourceIds.has(ref));
  if (validRefs.length >= 2) {
    return { id: "S-09", points: 2, confidence: "structural", rationale: "evidence_card scene cites 2+ real sources to render on screen" };
  }
  if (validRefs.length === 1) {
    return { id: "S-09", points: 1, confidence: "structural", rationale: "evidence_card scene cites 1 real source" };
  }
  return { id: "S-09", points: 0, confidence: "structural", rationale: "evidence_card scene cites no real, resolvable source" };
}

// ── S-10: channel-tone fit — not yet determinable ─────────────────────────────

function scoreS10(): ScoreItemResult {
  return {
    id: "S-10",
    points: 1,
    confidence: "not_yet_determinable",
    rationale: "character/format is not finalized (FINAL_CHARACTER_HARD_LOCK pending) — fixed neutral score, not a judgment",
  };
}

// ── Aggregate ──────────────────────────────────────────────────────────────────

/** Mirrors live-topic-cutline-check.ts's HC-06 resolution — same accepted forms. */
function resolveHookTypeForScoring(candidate: LiveTopicCandidateInput, cutline: CutlineConfig): HookType | null {
  if (cutline.allowedHookTypes.includes(candidate.hookType as HookType)) {
    return candidate.hookType as HookType;
  }
  return resolveHookTypeCode(candidate.hookType);
}

export function scoreCandidate(
  candidate: LiveTopicCandidateInput,
  pack: EvidencePackDraft,
  cutline: CutlineConfig,
  registry: SourceRegistry,
): CandidateScore {
  const hookType = resolveHookTypeForScoring(candidate, cutline);
  const items: ScoreItemResult[] = [
    scoreS01(candidate, pack),
    scoreS02(hookType),
    scoreS03(),
    scoreS04(candidate),
    scoreS05(candidate, pack, cutline),
    scoreS06(candidate, registry),
    scoreS07(candidate),
    scoreS08(candidate),
    scoreS09(candidate, pack),
    scoreS10(),
  ];

  const scored = items.filter((i) => i.points !== null) as (ScoreItemResult & { points: 0 | 1 | 2 })[];
  const total = scored.reduce((sum, i) => sum + i.points, 0);
  const totalPossible = scored.length * 2;
  const hasLowConfidenceItems = items.some(
    (i) => i.confidence === "heuristic" || i.confidence === "not_yet_determinable" || i.confidence === "manual_only",
  );

  // Owner decision (2026-09-16): passThreshold stays 14 against the cutline's
  // original 20-point scale, even though totalPossible here is 18 (S-03
  // excluded as manual_only). Not rescaled to 14/20*18≈12.6 — 14 remains the
  // bar candidates must clear on the 9 automatable items.
  return {
    candidateId: candidate.candidateId,
    items,
    total,
    totalPossible,
    passesThreshold: total >= cutline.score.passThreshold,
    hasLowConfidenceItems,
  };
}

export function scoreAndRankCandidates(
  candidates: readonly LiveTopicCandidateInput[],
  pack: EvidencePackDraft,
  cutline: CutlineConfig,
  registry: SourceRegistry,
): readonly CandidateScore[] {
  return candidates
    .map((c) => scoreCandidate(c, pack, cutline, registry))
    .slice()
    .sort((a, b) => b.total - a.total);
}
