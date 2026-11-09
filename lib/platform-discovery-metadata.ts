export const PLATFORM_DISCOVERY_METADATA_VERSION = "money_shorts_platform_discovery_v1" as const;

export type DiscoveryPlatformMetadata = {
  contractVersion: typeof PLATFORM_DISCOVERY_METADATA_VERSION;
  contentCategory: string;
  primaryKeywords: string[];
  instagram: {
    captionFirstLineHook: string;
    caption: string;
    hashtags: string[];
    callToAction: string;
    recommendationEligibilityReviewRequired: true;
    originalContent: true;
    shareToFeed: true;
  };
  youtube: {
    titleBase: string;
    titleWithShortsSuffix: string;
    descriptionBase: string;
    tags: string[];
    categoryId: string;
    defaultLanguage: "ko";
    privacyStatus: "public";
    selfDeclaredMadeForKids: false;
    containsSyntheticMedia: true;
  };
};

export type DiscoveryMetadataGate = {
  ok: boolean;
  reasons: string[];
};

type DiscoveryInput = {
  title: string;
  hook: string;
  consequence: string;
  action: string;
  category?: string;
  financeSubtopic?: string | null;
};

const FINANCE_SUBTOPIC_KEYWORDS: Record<string, string[]> = {
  economy_literacy: ["경제공부", "경제상식", "경제지표"],
  inflation_living_cost: ["물가", "생활비", "인플레이션"],
  interest_debt: ["금리", "대출", "부채관리"],
  consumption_psychology: ["소비습관", "소비심리", "고정비"],
  sns_comparison: ["비교소비", "SNS소비", "소비심리"],
  labor_income: ["월급관리", "소득관리", "직장인재테크"],
  investing_assets: ["투자공부", "자산관리", "장기투자"],
  housing_asset_gap: ["주거비", "내집마련", "자산격차"],
  anxiety_avoidance: ["돈불안", "재무습관", "위험관리"],
  success_habits: ["돈관리습관", "저축습관", "재테크기초"],
  crisis_risk: ["경제위기", "비상금", "위험관리"],
  time_retirement: ["노후준비", "연금", "장기저축"],
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  finance: ["돈관리", "생활경제", "재테크"],
  ai: ["AI활용", "인공지능", "업무자동화"],
  meme: ["일상유머", "인터넷문화", "공감"],
  news: ["뉴스읽기", "팩트체크", "미디어리터러시"],
  tmi: ["생활상식", "궁금증", "지식"],
  game: ["게임팁", "게임클립", "게이머"],
  animal: ["반려생활", "동물상식", "반려동물"],
  celeb: ["팬문화", "엔터테인먼트", "케이팝"],
};

const YOUTUBE_CATEGORY_IDS: Record<string, string> = {
  finance: "27",
  ai: "28",
  meme: "24",
  news: "24",
  tmi: "27",
  game: "20",
  animal: "15",
  celeb: "24",
};

const UNRELATED_TREND_PATTERN = /(fyp|fypシ|viral|바이럴|실검|챌린지|무조건조회수|떡상)/i;
const FINANCIAL_OVERCLAIM_PATTERN = /(수익\s*보장|원금\s*보장|무조건\s*(?:번다|수익|오른다)|확실히\s*(?:번다|수익)|100%\s*(?:수익|성공)|부자\s*보장|손실\s*없)/i;

function compact(value: unknown, max = 500): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length <= max ? text : text.slice(0, max).trimEnd();
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.replace(/^#+/, "").replace(/\s+/g, "").trim()).filter(Boolean))];
}

function includesKeyword(value: string, keyword: string): boolean {
  return value.replace(/\s+/g, "").includes(keyword.replace(/\s+/g, ""));
}

export function evaluatePlatformDiscoveryMetadata(metadata: DiscoveryPlatformMetadata): DiscoveryMetadataGate {
  const reasons: string[] = [];
  const instagramText = `${metadata.instagram.captionFirstLineHook} ${metadata.instagram.caption}`;
  const youtubeText = `${metadata.youtube.titleBase} ${metadata.youtube.descriptionBase}`;
  const allText = `${instagramText} ${youtubeText}`;
  if (metadata.contractVersion !== PLATFORM_DISCOVERY_METADATA_VERSION) reasons.push("contract_version_invalid");
  if (metadata.primaryKeywords.length < 2 || metadata.primaryKeywords.length > 3) reasons.push("primary_keyword_count_invalid");
  if (!metadata.primaryKeywords.every((keyword) => includesKeyword(allText, keyword))) reasons.push("primary_keyword_content_mismatch");
  if (metadata.instagram.captionFirstLineHook.length < 8 || metadata.instagram.captionFirstLineHook.length > 48) reasons.push("instagram_hook_length_invalid");
  if (metadata.instagram.caption.length < 40 || metadata.instagram.caption.length > 1200) reasons.push("instagram_caption_length_invalid");
  if (metadata.instagram.hashtags.length < 4 || metadata.instagram.hashtags.length > 6) reasons.push("instagram_hashtag_count_invalid");
  if (new Set(metadata.instagram.hashtags).size !== metadata.instagram.hashtags.length) reasons.push("instagram_hashtag_duplicate");
  if (!metadata.instagram.originalContent || !metadata.instagram.shareToFeed) reasons.push("instagram_distribution_flags_missing");
  if (metadata.youtube.titleWithShortsSuffix.length > 100 || !metadata.youtube.titleWithShortsSuffix.includes("#Shorts")) reasons.push("youtube_title_invalid");
  if (metadata.youtube.descriptionBase.length < 60 || metadata.youtube.descriptionBase.length > 4500) reasons.push("youtube_description_length_invalid");
  if (metadata.youtube.tags.length < 3 || metadata.youtube.tags.length > 8) reasons.push("youtube_tag_count_invalid");
  if (!metadata.youtube.containsSyntheticMedia) reasons.push("youtube_synthetic_media_disclosure_missing");
  if (metadata.contentCategory === "finance" && !metadata.youtube.descriptionBase.includes("투자 권유가 아닌")) reasons.push("finance_context_disclaimer_missing");
  const allTags = [...metadata.instagram.hashtags, ...metadata.youtube.tags];
  if (allTags.some((tag) => UNRELATED_TREND_PATTERN.test(tag))) reasons.push("unrelated_trend_tag_forbidden");
  if (FINANCIAL_OVERCLAIM_PATTERN.test(allText)) reasons.push("financial_overclaim_forbidden");
  return { ok: reasons.length === 0, reasons };
}

export function buildPlatformDiscoveryMetadata(input: DiscoveryInput): {
  metadata: DiscoveryPlatformMetadata;
  gate: DiscoveryMetadataGate;
} {
  const category = CATEGORY_KEYWORDS[input.category ?? ""] ? String(input.category) : "finance";
  const categoryKeywords = CATEGORY_KEYWORDS[category] ?? CATEGORY_KEYWORDS.finance;
  const specificKeywords = category === "finance"
    ? FINANCE_SUBTOPIC_KEYWORDS[String(input.financeSubtopic ?? "")] ?? ["돈관리습관", "생활경제", "재테크기초"]
    : categoryKeywords;
  const primaryKeywords = unique([...specificKeywords.slice(0, 2), categoryKeywords[0]]).slice(0, 3);
  const title = compact(input.title, 92);
  const hook = compact(input.hook, 220);
  const consequence = compact(input.consequence, 320);
  const action = compact(input.action, 320);
  const disclaimer = category === "finance"
    ? "개인 상황에 따라 결과는 달라질 수 있으며, 투자 권유가 아닌 일반 금융·생활 정보입니다."
    : "AI로 제작한 정보·오락 콘텐츠이며, 실제 사실과 다른 부분이 없는지 게시 전에 확인합니다.";
  const instagramHashtags = unique([...specificKeywords, ...categoryKeywords]).slice(0, 5);
  const youtubeTags = unique([...specificKeywords, ...categoryKeywords, title]).slice(0, 7);
  const youtubeHashtags = unique(["Shorts", primaryKeywords[0], categoryKeywords[0]]).map((tag) => `#${tag}`).join(" ");
  const callToAction = "다음 선택 전에 저장해 두고, 필요한 사람에게 공유하세요.";
  const topicContext = `핵심 주제: ${primaryKeywords.join(" · ")}`;
  const instagramCaption = [topicContext, consequence || hook, action, disclaimer].filter(Boolean).join("\n\n");
  const youtubeDescription = [hook || title, topicContext, consequence, action, disclaimer, youtubeHashtags].filter(Boolean).join("\n\n");
  const metadata: DiscoveryPlatformMetadata = {
    contractVersion: PLATFORM_DISCOVERY_METADATA_VERSION,
    contentCategory: category,
    primaryKeywords,
    instagram: {
      captionFirstLineHook: title.slice(0, 48),
      caption: instagramCaption,
      hashtags: instagramHashtags,
      callToAction,
      recommendationEligibilityReviewRequired: true,
      originalContent: true,
      shareToFeed: true,
    },
    youtube: {
      titleBase: title,
      titleWithShortsSuffix: `${title} #Shorts`.slice(0, 100),
      descriptionBase: youtubeDescription,
      tags: youtubeTags,
      categoryId: YOUTUBE_CATEGORY_IDS[category] ?? "22",
      defaultLanguage: "ko",
      privacyStatus: "public",
      selfDeclaredMadeForKids: false,
      containsSyntheticMedia: true,
    },
  };
  return { metadata, gate: evaluatePlatformDiscoveryMetadata(metadata) };
}
