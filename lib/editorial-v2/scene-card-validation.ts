import type {
  ApprovedDetailedScriptSessionSnapshot,
  DetailedScriptBeatType,
  SceneCardDraft,
  SceneCardValidationIssue,
  SceneCardValidationSummary,
} from "./contracts";

const URL_PATTERN = /(?:https?:\/\/|www\.)\S+/iu;
const ISO_DATE_PATTERN = /\b\d{4}-\d{2}-\d{2}\b/gu;
const KOREAN_DATE_PATTERN = /\b(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\b/gu;
const NUMBER_PATTERN = /[-+]?\d[\d,]*(?:\.\d+)?/gu;
const UNSAFE_FINANCIAL_PATTERN = /(무조건\s*(?:매수|매도)|지금\s*(?:사라|팔아라)|수익\s*보장|원금\s*보장|확정\s*수익|반드시\s*오른다|반드시\s*내린다|guaranteed\s+(?:return|profit)|must\s+(?:buy|sell))/iu;

const FACTUAL_BEAT_TYPES = new Set<DetailedScriptBeatType>([
  "anomaly_or_problem",
  "common_interpretation_crack",
  "evidence_and_number",
  "hidden_cause_or_connection",
  "audience_life_impact",
  "misread_correction",
]);

function normalizeDate(value: string): string | null {
  const direct = value.match(/^\d{4}-\d{2}-\d{2}$/u);
  if (direct) return direct[0];
  const korean = value.match(/^(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일$/u);
  if (!korean) return null;
  return `${korean[1]}-${korean[2].padStart(2, "0")}-${korean[3].padStart(2, "0")}`;
}

function dateOnly(value: string): string | null {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/u);
  return match?.[1] ?? null;
}

function extractDates(text: string): readonly string[] {
  const iso = [...text.matchAll(ISO_DATE_PATTERN)].map((entry) => entry[0]);
  const korean = [...text.matchAll(KOREAN_DATE_PATTERN)].map((entry) => entry[0]);
  return [...iso, ...korean].map(normalizeDate).filter((entry): entry is string => entry !== null);
}

function stripDates(text: string): string {
  return text.replace(ISO_DATE_PATTERN, " ").replace(KOREAN_DATE_PATTERN, " ");
}

function extractNumbers(text: string): readonly number[] {
  return [...stripDates(text).matchAll(NUMBER_PATTERN)]
    .map((entry) => Number(entry[0].replaceAll(",", "")))
    .filter(Number.isFinite);
}

function sameMembers(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((entry) => right.includes(entry));
}

export function summarizeSceneCardValidation(
  issues: readonly SceneCardValidationIssue[],
  enabledSceneCount = 0,
): SceneCardValidationSummary {
  const blockingIssueCount = issues.filter((entry) => entry.blocking).length;
  return {
    valid: blockingIssueCount === 0,
    blockingIssueCount,
    warningCount: issues.length - blockingIssueCount,
    enabledSceneCount,
    issues: issues.map((entry) => ({ ...entry })),
  };
}

export function validateSceneCardDrafts(
  sceneCards: readonly SceneCardDraft[],
  approvedSnapshot: ApprovedDetailedScriptSessionSnapshot,
): SceneCardValidationSummary {
  const issues: SceneCardValidationIssue[] = [];
  const enabled = sceneCards.filter((scene) => scene.enabled);
  const sourceIds = new Set(approvedSnapshot.evidencePack.sources.map((entry) => entry.sourceId));
  const claimIds = new Set(approvedSnapshot.evidencePack.claims.map((entry) => entry.claimId));
  const numberIds = new Set(approvedSnapshot.evidencePack.numbers.map((entry) => entry.numberId));
  const allowedNumbers = approvedSnapshot.evidencePack.numbers.map((entry) => entry.value);
  const allowedDates = new Set<string>();
  for (const source of approvedSnapshot.evidencePack.sources) {
    const publishedAt = dateOnly(source.publishedAt);
    const eventDate = source.eventDate ? dateOnly(source.eventDate) : null;
    if (publishedAt) allowedDates.add(publishedAt);
    if (eventDate) allowedDates.add(eventDate);
  }
  for (const number of approvedSnapshot.evidencePack.numbers) {
    const asOf = dateOnly(number.asOf);
    if (asOf) allowedDates.add(asOf);
  }

  const add = (code: string, sceneId: string | null, fieldPath: string, message: string, blocking = true): void => {
    issues.push({ code, sceneId, fieldPath, message, blocking });
  };

  if (sceneCards.length < 7 || sceneCards.length > 10) add("scene_count_out_of_range", null, "/scenes", "Scene Card는 7~10개여야 합니다.");
  if (enabled.length < 7 || enabled.length > 10) add("enabled_scene_count_out_of_range", null, "/scenes", "활성 Scene Card는 7~10개여야 합니다.");

  const sceneIds = sceneCards.map((scene) => scene.sceneId);
  if (new Set(sceneIds).size !== sceneIds.length) add("duplicate_scene_id", null, "/scenes", "중복 scene ID가 있습니다.");
  const orders = sceneCards.map((scene) => scene.order);
  if (new Set(orders).size !== orders.length) add("duplicate_scene_order", null, "/scenes", "중복 scene order가 있습니다.");
  if (!orders.every((order, index) => index === 0 || order > orders[index - 1])) add("scene_order_not_continuous", null, "/scenes", "Scene Card 배열은 원래 order의 오름차순을 유지해야 합니다.");
  const enabledOrders = enabled.map((scene) => scene.order);
  if (!enabledOrders.every((order, index) => index === 0 || order > enabledOrders[index - 1])) add("enabled_scene_order_not_continuous", null, "/scenes", "활성 장면의 상대 순서가 유지되지 않았습니다.");

  for (const [index, scene] of sceneCards.entries()) {
    const path = `/scenes/${index}`;
    const beat = approvedSnapshot.approvedScript.beats.find((entry) => entry.beatId === scene.provenance.beatId);
    if (!beat) {
      add("unknown_script_beat", scene.sceneId, `${path}/provenance/beatId`, "원본 Detailed Script beat를 찾을 수 없습니다.");
      continue;
    }
    const expectedBeat = approvedSnapshot.approvedScript.beats[scene.order - 1];
    if (!expectedBeat || expectedBeat.beatId !== beat.beatId || expectedBeat.beatType !== scene.provenance.beatType) {
      add("beat_order_or_type_mismatch", scene.sceneId, `${path}/provenance`, "원본 beat의 order와 type을 유지해야 합니다.");
    }
    if (!scene.narration.trim()) add("missing_narration", scene.sceneId, `${path}/narration`, "내레이션을 입력하세요.");
    if (!scene.keyCaption.trim()) add("missing_key_caption", scene.sceneId, `${path}/keyCaption`, "핵심 캡션을 입력하세요.");
    if (!scene.retentionBeat.trim()) add("missing_retention_beat", scene.sceneId, `${path}/retentionBeat`, "retention beat를 입력하세요.");
    if (scene.sourceRefs.length === 0) add("source_ref_required", scene.sceneId, `${path}/sourceRefs`, "각 장면에는 source ref가 하나 이상 필요합니다.");
    if (FACTUAL_BEAT_TYPES.has(scene.provenance.beatType) && scene.provenance.claimRefs.length === 0) {
      add("factual_claim_ref_required", scene.sceneId, `${path}/provenance/claimRefs`, "사실 중심 beat에는 claim ref가 필요합니다.");
    }
    if (scene.provenance.beatType === "evidence_and_number" && scene.provenance.numberRefs.length === 0) {
      add("evidence_number_ref_required", scene.sceneId, `${path}/provenance/numberRefs`, "evidence_and_number beat에는 number ref가 필요합니다.");
    }
    for (const sourceRef of scene.provenance.sourceRefs) if (!sourceIds.has(sourceRef)) add("unsupported_source_ref", scene.sceneId, `${path}/provenance/sourceRefs`, `지원되지 않는 source ref: ${sourceRef}`);
    for (const claimRef of scene.provenance.claimRefs) if (!claimIds.has(claimRef)) add("unsupported_claim_ref", scene.sceneId, `${path}/provenance/claimRefs`, `지원되지 않는 claim ref: ${claimRef}`);
    for (const numberRef of scene.provenance.numberRefs) if (!numberIds.has(numberRef)) add("unsupported_number_ref", scene.sceneId, `${path}/provenance/numberRefs`, `지원되지 않는 number ref: ${numberRef}`);
    if (!sameMembers(scene.sourceRefs, scene.provenance.sourceRefs)) add("source_provenance_mismatch", scene.sceneId, `${path}/sourceRefs`, "표시 source refs와 provenance가 일치하지 않습니다.");
    if (!sameMembers(scene.evidenceRefs, [...scene.provenance.claimRefs, ...scene.provenance.numberRefs])) add("evidence_provenance_mismatch", scene.sceneId, `${path}/evidenceRefs`, "표시 evidence refs와 provenance가 일치하지 않습니다.");
    if (scene.provenance.selectedAngleId !== approvedSnapshot.selectedAngle.selectedAngleId) add("selected_angle_mismatch", scene.sceneId, `${path}/provenance/selectedAngleId`, "Selected Angle provenance가 다릅니다.");
    if (scene.provenance.sourceSignalId !== approvedSnapshot.selectedAngle.sourceSignalId) add("source_signal_mismatch", scene.sceneId, `${path}/provenance/sourceSignalId`, "Source signal provenance가 다릅니다.");
    if (scene.provenance.scriptPackageIdentity !== approvedSnapshot.scriptNormalizedHash) add("script_identity_mismatch", scene.sceneId, `${path}/provenance/scriptPackageIdentity`, "승인된 script identity가 다릅니다.");
    if (scene.provenance.sceneRevision.value < 1) add("invalid_scene_revision", scene.sceneId, `${path}/provenance/sceneRevision`, "scene revision은 1 이상이어야 합니다.");

    const editableText = [scene.narration, scene.keyCaption, scene.retentionBeat].join(" ");
    if (URL_PATTERN.test(editableText)) add("new_url_not_allowed", scene.sceneId, path, "Scene Card 본문에 새 URL을 넣을 수 없습니다.");
    if (UNSAFE_FINANCIAL_PATTERN.test(editableText)) add("unsafe_financial_wording", scene.sceneId, path, "매수·매도 지시나 수익 보장 표현을 제거하세요.");
    for (const numericLiteral of extractNumbers(editableText)) {
      if (!allowedNumbers.some((value) => Math.abs(value - numericLiteral) < Number.EPSILON)) {
        add("unsupported_numeric_literal", scene.sceneId, path, `Evidence Pack에 없는 숫자 ${numericLiteral}가 있습니다.`);
      }
    }
    for (const dateLiteral of extractDates(editableText)) {
      if (!allowedDates.has(dateLiteral)) add("unsupported_date_literal", scene.sceneId, path, `Evidence Pack에 없는 날짜 ${dateLiteral}가 있습니다.`);
    }
  }

  return summarizeSceneCardValidation(issues, enabled.length);
}

export function canApproveSceneCards(summary: SceneCardValidationSummary | null): boolean {
  return summary !== null && summary.valid && summary.blockingIssueCount === 0;
}
