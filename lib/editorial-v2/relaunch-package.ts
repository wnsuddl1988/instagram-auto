import type {
  ChannelDescriptionPackage,
  ChannelFinancialSafetyStandard,
  ChannelSourceDisclosureStandard,
  CharacterDirectionId,
  PinnedRelaunchPostDraft,
  ProvisionalChannelIdentityDraft,
  RelaunchAssetPlan,
  RelaunchDirectionDefinition,
  RelaunchPackage,
} from "./contracts";

export interface RelaunchDirectionCandidatesInput {
  readonly primaryAudience: string;
  readonly sourceFirstRequired: true;
}

export interface ProvisionalChannelIdentityInput {
  readonly channelDisplayNameCandidate: string;
  readonly handleCandidates: readonly {
    readonly handle: string;
    readonly platformIntent: "instagram" | "youtube" | "cross_platform";
  }[];
  readonly oneLinePromise: string;
  readonly primaryAudience: string;
  readonly preferredDirection: string;
  readonly prohibitedWords: readonly string[];
  readonly optionalTagline: string | null;
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  const record = value as Readonly<Record<string, unknown>>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(",")}}`;
}

function deterministicHash(value: unknown): string {
  const text = stableSerialize(value);
  let hash = 0x811c9dc5;
  let salt = 0x27d4eb2d;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
    salt ^= text.charCodeAt(index) + index;
    salt = Math.imul(salt, 0x85ebca6b) >>> 0;
  }
  const left = hash.toString(16).padStart(8, "0");
  const right = salt.toString(16).padStart(8, "0");
  return `${left}${right}${right}${left}`;
}

function clean(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/gu, " ").replace(/\s+/gu, " ").trim();
}

function cleanList(values: readonly string[]): readonly string[] {
  return [...new Set(values.map(clean).filter(Boolean))];
}

export function buildRelaunchDirectionCandidates(
  input: RelaunchDirectionCandidatesInput,
): readonly RelaunchDirectionDefinition[] {
  const audience = clean(input.primaryAudience) || "경제 신호를 생활 언어로 이해하려는 시청자";
  const sharedProhibited = ["수익 보장", "성공 보장", "무조건 매수", "무조건 매도", "검증 완료되지 않은 성과 주장"];
  return [
    {
      directionId: "evidence_signal_lab",
      temporaryDirectionLabel: "Evidence Signal Lab",
      channelPromise: "자료·숫자·출처를 먼저 보여주고 생활에 영향을 주는 경제 신호를 해석합니다.",
      editorialEmphasis: ["공식 출처", "숫자의 기준일", "생활 영향"],
      audienceEmphasis: audience,
      tone: "차분하고 검증 중심인 브리핑",
      visualIdentityPrinciples: ["source-first badge", "evidence card", "signal line", "character secondary"],
      titleStyle: "핵심 숫자와 확인 질문을 함께 제시",
      descriptionStyle: "출처·기준일·해석 한계를 먼저 공개",
      pinnedPostStyle: "검증 원칙과 출처 약속을 선언",
      similarityRisk: "일반 금융 데이터 채널과 혼동될 수 있어 생활 영향 관점을 명확히 해야 함",
      prohibitedClaims: sharedProhibited,
      provisionalOnly: true,
      finalOwnerApprovalRequired: true,
    },
    {
      directionId: "everyday_economy_lens",
      temporaryDirectionLabel: "Everyday Economy Lens",
      channelPromise: "생활비·월급·카드값·주거비에 연결되는 경제 변화를 실용적으로 해석합니다.",
      editorialEmphasis: ["생활비", "월급", "카드값", "주거비"],
      audienceEmphasis: audience,
      tone: "친근하지만 단정하지 않는 생활경제 해설",
      visualIdentityPrinciples: ["daily expense cards", "before-after comparison", "source footnote", "character guide"],
      titleStyle: "내 지출에 어떤 변화가 생기는지 질문",
      descriptionStyle: "생활 영향·전제·확인할 자료를 분리",
      pinnedPostStyle: "일상 경제를 출처 기반으로 번역하는 약속",
      similarityRisk: "절약 팁 채널로만 오해되지 않도록 거시 신호 연결을 유지해야 함",
      prohibitedClaims: sharedProhibited,
      provisionalOnly: true,
      finalOwnerApprovalRequired: true,
    },
    {
      directionId: "hidden_connection_brief",
      temporaryDirectionLabel: "Hidden Connection Brief",
      channelPromise: "사람들이 놓친 원인·구조·연결을 출처와 함께 짧게 설명합니다.",
      editorialEmphasis: ["숨은 원인", "구조", "연결", "오해 교정"],
      audienceEmphasis: audience,
      tone: "호기심을 만들되 증거 경계를 지키는 에디토리얼",
      visualIdentityPrinciples: ["connection map", "cause bridge", "evidence anchor", "character navigator"],
      titleStyle: "익숙한 현상 뒤의 연결을 질문",
      descriptionStyle: "관찰 사실과 해석 연결을 구분",
      pinnedPostStyle: "반전보다 근거를 우선한다는 운영 원칙",
      similarityRisk: "과장형 비밀 폭로 채널로 오해될 수 있어 단정·음모 표현을 금지해야 함",
      prohibitedClaims: [...sharedProhibited, "숨겨진 진실 확정", "모두가 속고 있다"],
      provisionalOnly: true,
      finalOwnerApprovalRequired: true,
    },
  ];
}

export function createProvisionalChannelIdentityDraft(
  direction: RelaunchDirectionDefinition,
  userInput: ProvisionalChannelIdentityInput,
): ProvisionalChannelIdentityDraft {
  return {
    draftVersion: "provisional-channel-identity-v1",
    directionId: direction.directionId,
    channelDisplayNameCandidate: clean(userInput.channelDisplayNameCandidate),
    handleCandidates: userInput.handleCandidates.map((candidate) => ({
      handle: clean(candidate.handle),
      platformIntent: candidate.platformIntent,
      availabilityVerified: false,
      provisionalOnly: true,
    })),
    oneLinePromise: clean(userInput.oneLinePromise),
    primaryAudience: clean(userInput.primaryAudience),
    preferredDirectionLabel: clean(userInput.preferredDirection) || direction.temporaryDirectionLabel,
    prohibitedWords: cleanList(userInput.prohibitedWords),
    optionalTagline: userInput.optionalTagline ? clean(userInput.optionalTagline) || null : null,
    provisionalOnly: true,
    finalBrandApproved: false,
    finalHandleAvailabilityVerified: false,
    actualAccountChanged: false,
    finalOwnerApprovalRequired: true,
  };
}

export function buildDefaultChannelSourceDisclosureStandard(): ChannelSourceDisclosureStandard {
  return {
    standardVersion: "channel-source-standard-v1",
    shortStatement: "출처와 기준일은 각 콘텐츠 설명에서 확인할 수 있습니다.",
    fullStatement: "사실·숫자·날짜는 승인된 Evidence Pack의 출처와 기준일을 함께 표시하고, 해석과 시나리오는 관찰 사실과 구분합니다.",
    requiresSourceAndAsOfDate: true,
    sourceExistenceExternallyVerified: false,
  };
}

export function buildDefaultFinancialSafetyStandard(): ChannelFinancialSafetyStandard {
  return {
    standardVersion: "channel-financial-safety-v1",
    statement: "이 채널은 정보와 해석을 제공하며 특정 종목의 매수·매도 또는 수익을 보장하지 않습니다.",
    investmentAdviceProvided: false,
    returnGuaranteesAllowed: false,
    specificSecurityRecommendationsAllowed: false,
  };
}

export function buildChannelDescriptionPackage(
  draft: ProvisionalChannelIdentityDraft,
  sourceStandard: ChannelSourceDisclosureStandard,
): ChannelDescriptionPackage {
  const promise = draft.oneLinePromise || "출처와 기준일을 먼저 확인하는 생활경제 브리핑";
  const audience = draft.primaryAudience || "생활경제 변화를 이해하려는 시청자";
  return {
    descriptionVersion: "channel-description-package-v1",
    instagramBioDraft: `${promise} · 출처와 기준일 공개 · 투자 권유 아님`,
    youtubeShortDescription: `${promise}. 사실과 해석을 구분하고 출처를 표시합니다.`,
    youtubeFullDescription: `${promise}\n주요 독자: ${audience}\n${sourceStandard.fullStatement}\n이 콘텐츠는 특정 종목의 매수·매도 권유나 수익 보장이 아닙니다.`,
    sourceStandard: { ...sourceStandard },
    financialSafetyStandard: buildDefaultFinancialSafetyStandard(),
    launchHashtags: ["#출처우선", "#생활경제", "#경제신호"],
    initialContentPillars: ["생활비 신호", "숫자와 기준일", "숨은 경제 연결"],
    currentPlatformLimitsVerified: false,
    performanceClaimsIncluded: false,
    provisionalOnly: true,
  };
}

export function buildPinnedRelaunchPostDraft(
  draft: ProvisionalChannelIdentityDraft,
): PinnedRelaunchPostDraft {
  return {
    postVersion: "pinned-relaunch-post-v1",
    headline: `${draft.channelDisplayNameCandidate || "임시 채널명"}의 새 편집 원칙`,
    contentPromise: draft.oneLinePromise || "생활에 영향을 주는 경제 신호를 짧고 명확하게 설명합니다.",
    sourceCommitment: "모든 사실·숫자에는 출처와 기준일을 표시하고, 해석은 사실과 분리합니다.",
    financialSafetyStatement: "특정 종목의 매수·매도나 수익을 보장하지 않습니다.",
    firstContentPillars: ["생활비 변화", "숫자 뒤의 맥락", "다음에 확인할 신호"],
    performanceClaimsIncluded: false,
    publicPostCreated: false,
    provisionalOnly: true,
  };
}

export function buildRelaunchAssetPlan(
  draft: ProvisionalChannelIdentityDraft,
  characterDirection: CharacterDirectionId,
): RelaunchAssetPlan {
  const badgeText = draft.channelDisplayNameCandidate.trim().slice(0, 12) || "SOURCE FIRST";
  const coverTitle = draft.oneLinePromise || "출처에서 시작하는 경제 해석";
  const cover = (suffix: string) => ({
    assetDraftVersion: "cover-asset-draft-v1" as const,
    coverTitle,
    coverSubtitle: suffix,
    sourceFirstBadge: "SOURCE FIRST · PROVISIONAL",
    safeAreaGuideRequired: true as const,
    inlineSvgPreviewOnly: true as const,
    actualProductionAsset: false as const,
    thirdPartyAssetsUsed: false as const,
  });
  return {
    planVersion: "relaunch-asset-plan-v1",
    profile: {
      assetDraftVersion: "profile-asset-draft-v1",
      badgeText,
      conceptDescription: "Evidence signal ring과 보조 캐릭터 marker를 결합한 임시 SVG concept",
      characterDirectionId: characterDirection,
      inlineSvgPreviewOnly: true,
      actualProductionAsset: false,
      thirdPartyAssetsUsed: false,
    },
    verticalCover: cover("Vertical cover concept"),
    youtubeBanner: cover("YouTube banner-safe concept"),
    pinnedPostCover: cover("Pinned relaunch post concept"),
    characterOriginalityState: "owned_original_planning_evidence",
    rightsState: "planning_review_only",
    actualAssetsCreated: false,
  };
}

export function buildRelaunchPackage(
  directions: readonly RelaunchDirectionDefinition[],
  selectedDirectionId: RelaunchPackage["selectedDirectionId"],
  identityDraft: ProvisionalChannelIdentityDraft,
  descriptions: ChannelDescriptionPackage,
  pinnedPost: PinnedRelaunchPostDraft,
  assetPlan: RelaunchAssetPlan,
): RelaunchPackage {
  const base = {
    packageVersion: "relaunch-readiness-package-v1" as const,
    directions: directions.map((direction) => ({
      ...direction,
      editorialEmphasis: [...direction.editorialEmphasis],
      visualIdentityPrinciples: [...direction.visualIdentityPrinciples],
      prohibitedClaims: [...direction.prohibitedClaims],
    })),
    selectedDirectionId,
    identityDraft: { ...identityDraft, handleCandidates: identityDraft.handleCandidates.map((entry) => ({ ...entry })), prohibitedWords: [...identityDraft.prohibitedWords] },
    descriptions: { ...descriptions, sourceStandard: { ...descriptions.sourceStandard }, financialSafetyStandard: { ...descriptions.financialSafetyStandard }, launchHashtags: [...descriptions.launchHashtags], initialContentPillars: [...descriptions.initialContentPillars] },
    pinnedPost: { ...pinnedPost, firstContentPillars: [...pinnedPost.firstContentPillars] },
    assetPlan: { ...assetPlan, profile: { ...assetPlan.profile }, verticalCover: { ...assetPlan.verticalCover }, youtubeBanner: { ...assetPlan.youtubeBanner }, pinnedPostCover: { ...assetPlan.pinnedPostCover } },
    finalBrandApproved: false as const,
    actualAccountChanged: false as const,
    publicLaunchReady: false as const,
    controlTowerFinalApprovalRequired: true as const,
  };
  return cloneRelaunchPackage({ ...base, packageId: `relaunch-package-${deterministicHash(base)}` });
}

export function cloneRelaunchPackage(relaunchPackage: RelaunchPackage): RelaunchPackage {
  return {
    ...relaunchPackage,
    directions: relaunchPackage.directions.map((direction) => ({
      ...direction,
      editorialEmphasis: [...direction.editorialEmphasis],
      visualIdentityPrinciples: [...direction.visualIdentityPrinciples],
      prohibitedClaims: [...direction.prohibitedClaims],
    })),
    identityDraft: {
      ...relaunchPackage.identityDraft,
      handleCandidates: relaunchPackage.identityDraft.handleCandidates.map((candidate) => ({ ...candidate })),
      prohibitedWords: [...relaunchPackage.identityDraft.prohibitedWords],
    },
    descriptions: {
      ...relaunchPackage.descriptions,
      sourceStandard: { ...relaunchPackage.descriptions.sourceStandard },
      financialSafetyStandard: { ...relaunchPackage.descriptions.financialSafetyStandard },
      launchHashtags: [...relaunchPackage.descriptions.launchHashtags],
      initialContentPillars: [...relaunchPackage.descriptions.initialContentPillars],
    },
    pinnedPost: { ...relaunchPackage.pinnedPost, firstContentPillars: [...relaunchPackage.pinnedPost.firstContentPillars] },
    assetPlan: {
      ...relaunchPackage.assetPlan,
      profile: { ...relaunchPackage.assetPlan.profile },
      verticalCover: { ...relaunchPackage.assetPlan.verticalCover },
      youtubeBanner: { ...relaunchPackage.assetPlan.youtubeBanner },
      pinnedPostCover: { ...relaunchPackage.assetPlan.pinnedPostCover },
    },
  };
}
