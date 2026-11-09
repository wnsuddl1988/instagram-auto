import type {
  ApprovedRenderIntegrationSessionSnapshot,
  PublishCoverPlan,
  PublishHashtagPlan,
  PublishMetadataDraft,
  PublishPlatformId,
  PublishSourceDisclosurePlan,
  PublishValidationIssue,
  PublishVisibilityIntent,
} from "./contracts";

export interface BuildPlatformPublishMetadataInput {
  readonly approvedRenderIntegration: ApprovedRenderIntegrationSessionSnapshot;
  readonly platformId: PublishPlatformId;
  readonly hashtags: readonly string[];
  readonly selectedCoverSceneId: string;
  readonly coverTitleOverlay: string;
  readonly accessibilityDescription: string;
  readonly visibilityIntent: PublishVisibilityIntent;
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  const record = value as Readonly<Record<string, unknown>>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(",")}}`;
}

function deterministicHash(value: unknown): string {
  const text = stableSerialize(value);
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    first ^= code;
    first = Math.imul(first, 0x01000193) >>> 0;
    second ^= code + index;
    second = Math.imul(second, 0x85ebca6b) >>> 0;
  }
  const left = first.toString(16).padStart(8, "0");
  const right = second.toString(16).padStart(8, "0");
  return `${left}${right}${right}${left}`;
}

function normalizeHashtags(hashtags: readonly string[]): PublishHashtagPlan {
  const rawHashtags = hashtags.map((hashtag) => hashtag.trim()).filter(Boolean);
  const normalized: string[] = [];
  const seen = new Set<string>();
  for (const hashtag of rawHashtags) {
    const withPrefix = hashtag.startsWith("#") ? hashtag : `#${hashtag}`;
    const key = withPrefix.toLocaleLowerCase("en-US");
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(withPrefix);
  }
  return {
    rawHashtags,
    normalizedHashtags: normalized,
    duplicateCount: rawHashtags.length - normalized.length,
  };
}

export function buildPublishSourceDisclosure(
  approvedRenderIntegration: ApprovedRenderIntegrationSessionSnapshot,
): PublishSourceDisclosurePlan {
  const sources = approvedRenderIntegration.sourceDetailedScriptSnapshot.evidencePack.sources.map((source) => ({
    sourceId: source.sourceId,
    publisher: source.publisher,
    title: source.title,
    url: source.url,
    sourceExistenceVerified: false as const,
  }));
  const statement = sources.length > 0
    ? `출처 계획: ${sources.map((source) => `${source.publisher} · ${source.title}`).join(" / ")}`
    : "출처 metadata가 없어 게시 계획 승인을 진행할 수 없습니다.";
  return {
    disclosureVersion: "publish-source-disclosure-v1",
    statement,
    sources,
    sourceExistenceVerified: false,
  };
}

export function buildPublishCoverPlan(
  platformId: PublishPlatformId,
  renderManifestHash: string,
  selectedSceneId: string,
  titleOverlay: string,
): PublishCoverPlan {
  return {
    selectedSceneId: selectedSceneId.trim(),
    titleOverlay: titleOverlay.trim(),
    logicalUri: `cover://${renderManifestHash}/${platformId}/${encodeURIComponent(selectedSceneId.trim())}`,
    metadataOnly: true,
    actualCoverCreated: false,
  };
}

export function buildPlatformPublishMetadata(
  input: BuildPlatformPublishMetadataInput,
): PublishMetadataDraft {
  const script = input.approvedRenderIntegration.sourceDetailedScriptSnapshot.approvedScript;
  const angle = input.approvedRenderIntegration.sourceDetailedScriptSnapshot.selectedAngle;
  const sourceDisclosure = buildPublishSourceDisclosure(input.approvedRenderIntegration);
  const coverPlan = buildPublishCoverPlan(
    input.platformId,
    input.approvedRenderIntegration.renderManifest.manifestHash,
    input.selectedCoverSceneId,
    input.coverTitleOverlay,
  );
  const hashtags = normalizeHashtags(input.hashtags);
  const title = script.title.trim();
  const description = `${script.thesis.trim()} ${script.closingAction.trim()} ${sourceDisclosure.statement}`.trim();
  const caption = `${angle.hookPromise.trim()} ${script.closingAction.trim()} ${sourceDisclosure.statement}`.trim();
  const visibilityIntent = input.platformId === "instagram_reels" ? "public" : input.visibilityIntent;
  const base = {
    platformId: input.platformId,
    title,
    description,
    caption,
    hashtags,
    sourceDisclosure,
    coverPlan,
    accessibilityDescription: input.accessibilityDescription.trim(),
    visibilityIntent,
    policy: {
      policyVersion: "publish-metadata-policy-v1" as const,
      authority: "internal_planning_only" as const,
      actualCurrentPlatformLimitsVerified: false as const,
      lengthPolicy: "conservative_warning_only" as const,
    },
  };
  return { ...base, metadataHash: deterministicHash(base) };
}

export function validatePlatformPublishMetadata(
  metadata: PublishMetadataDraft,
): readonly PublishValidationIssue[] {
  const issues: PublishValidationIssue[] = [];
  const requiredText = metadata.platformId === "instagram_reels"
    ? [["caption", metadata.caption]] as const
    : [["title", metadata.title], ["description", metadata.description]] as const;
  for (const [fieldPath, value] of requiredText) {
    if (!value.trim()) issues.push({ code: "publish_metadata_required_text_missing", platformId: metadata.platformId, fieldPath: `metadata.${fieldPath}`, message: `${fieldPath}가 비어 있습니다.`, blocking: true });
  }
  if (!metadata.accessibilityDescription.trim()) issues.push({ code: "publish_accessibility_description_missing", platformId: metadata.platformId, fieldPath: "metadata.accessibilityDescription", message: "접근성 설명이 필요합니다.", blocking: true });
  if (!metadata.sourceDisclosure.statement.trim() || metadata.sourceDisclosure.sources.length === 0) issues.push({ code: "publish_source_disclosure_missing", platformId: metadata.platformId, fieldPath: "metadata.sourceDisclosure", message: "source disclosure metadata가 필요합니다.", blocking: true });
  if (!metadata.coverPlan.selectedSceneId || !metadata.coverPlan.titleOverlay) issues.push({ code: "publish_cover_plan_missing", platformId: metadata.platformId, fieldPath: "metadata.coverPlan", message: "cover scene과 title overlay가 필요합니다.", blocking: true });
  if (metadata.platformId === "instagram_reels" && metadata.visibilityIntent !== "public") issues.push({ code: "instagram_visibility_intent_mismatch", platformId: metadata.platformId, fieldPath: "metadata.visibilityIntent", message: "Instagram planning visibility는 public이어야 합니다.", blocking: true });
  const combinedText = [metadata.title, metadata.description, metadata.caption, metadata.coverPlan.titleOverlay].join(" ");
  if (/(무조건\s*(?:매수|매도)|수익\s*보장|확정적\s*(?:수익|상승|하락)|guaranteed\s+return|buy\s+now|sell\s+now)/iu.test(combinedText)) issues.push({ code: "unsafe_financial_language", platformId: metadata.platformId, fieldPath: "metadata", message: "매수·매도 지시, 수익 보장 또는 확정적 예측 표현이 포함됐습니다.", blocking: true });
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(combinedText)) issues.push({ code: "publish_metadata_control_character", platformId: metadata.platformId, fieldPath: "metadata", message: "금지된 제어문자가 포함됐습니다.", blocking: true });
  if (metadata.hashtags.duplicateCount > 0) issues.push({ code: "duplicate_hashtags_normalized", platformId: metadata.platformId, fieldPath: "metadata.hashtags", message: "중복 hashtag를 결정론적으로 제거했습니다.", blocking: false });
  if (metadata.title.length > 90 || metadata.description.length > 1800 || metadata.caption.length > 1800) issues.push({ code: "internal_conservative_length_warning", platformId: metadata.platformId, fieldPath: "metadata", message: "내부 보수적 길이 warning입니다. 최신 플랫폼 제한 검증 결과가 아닙니다.", blocking: false });
  issues.push({ code: "internal_metadata_policy_only", platformId: metadata.platformId, fieldPath: "metadata.policy.authority", message: "internal planning policy이며 실제 최신 플랫폼 제한은 검증하지 않았습니다.", blocking: false });
  issues.push({ code: "source_existence_unverified", platformId: metadata.platformId, fieldPath: "metadata.sourceDisclosure", message: "source URL 존재 여부를 외부 확인하지 않았습니다.", blocking: false });
  issues.push({ code: "actual_cover_unavailable", platformId: metadata.platformId, fieldPath: "metadata.coverPlan", message: "cover는 metadata plan이며 실제 image가 아닙니다.", blocking: false });
  return issues;
}
