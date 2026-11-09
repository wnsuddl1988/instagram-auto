/**
 * voiceConfig.ts
 * 카테고리별 TTS 음성 후보 슬롯 정의.
 *
 * - provider: "openai" | "elevenlabs"
 * - ElevenLabs 항목은 elevenLabsVoiceId가 null이면 미설정(isReady = false) 상태.
 * - 실제 API 호출은 ALLOW_ELEVENLABS 가드를 통과해야 하며,
 *   이 파일 자체는 설정값 정의만 담당하고 API를 직접 호출하지 않는다.
 */

// ── 타입 ──────────────────────────────────────────────────────────────────────

export interface VoiceCandidate {
  /** 슬롯 고유 ID (UI key 용도) */
  id: string;
  /** 표시 이름 */
  label: string;
  /** 음성 특성 설명 */
  description: string;
  /** 어떤 장면/스타일에 적합한지 */
  recommendedUse: string;
  /** TTS 제공자 */
  provider: "openai" | "elevenlabs";

  /**
   * 해당 보이스의 감정선을 검증할 수 있는 샘플 문장.
   * UI에서 "이 문장으로 테스트 예정" 형태로 표시.
   */
  previewText?: string;

  /**
   * 현재 카테고리에서 추천 1순위 후보.
   * UI에서 "추천" 배지로 표시.
   */
  recommended?: boolean;

  /**
   * 사용자 테스트 결과 비추천/탈락 처리된 후보.
   * true면 카드에 "비추천" 배지 + 흐리게 표시.
   */
  deprecated?: boolean;

  /** 비추천/탈락 이유 (deprecated=true일 때 사용) */
  deprecatedReason?: string;

  // ── OpenAI 설정 ──────────────────────────────────────────────────────────
  openaiVoice?: string;
  openaiModel?: string;
  openaiSpeed?: number;
  openaiInstructions?: string;

  // ── ElevenLabs 설정 ──────────────────────────────────────────────────────
  /** null = 미설정 / 아직 발급받지 않은 voiceId. isReady를 false로 만든다. */
  elevenLabsVoiceId?: string | null;
  elevenLabsStability?: number;
  /** 목소리 유사도 (0~1). 높을수록 원본 보이스에 충실 */
  elevenLabsSimilarityBoost?: number;
  elevenLabsStyle?: number;

  /** voiceId가 세팅되고 사용 준비가 된 상태인지 */
  isReady: boolean;
}

// ── emotional_story 후보 슬롯 ─────────────────────────────────────────────────

/**
 * emotional_story 카테고리용 TTS 음성 후보 목록.
 *
 * - OpenAI sage: 현재 기본값 (isReady = true)
 * - ElevenLabs 슬롯 5개: voiceId 미설정 (isReady = false)
 *   → ElevenLabs Voice Library에서 원하는 ID를 채워 넣으면 활성화됨.
 *   → 예시 voiceId 형식: "21m00Tcm4TlvDq8ikWAM" (Rachel)
 *
 * QA-22 피드백:
 *   "목소리가 너무 또렷한 반장/설명조" → ElevenLabs 감성 보이스 비교 필요.
 *   elevenLabsVoiceId 입력 후 ALLOW_ELEVENLABS=true 시 활성화됨.
 */
export const EMOTIONAL_STORY_VOICE_CANDIDATES: VoiceCandidate[] = [
  // ── OpenAI 임시 1순위 — sage 0.94 ───────────────────────────────────────
  // QA-22 재렌더(v2_qa22_sage094) 결과 "이전보다 훨씬 좋아졌다" 사용자 확인 (2026-05-22).
  // 감동사연 OpenAI 기본 TTS로 확정. ElevenLabs 비교 시 교체 검토.
  {
    id: "openai-sage",
    label: "Sage 0.94 (OpenAI) ✓ 확정",
    description: "QA-22 재렌더 결과 사용자 선호 확인. 감동사연 OpenAI 기본 TTS로 확정. speed 0.94 · 조용하고 내밀한 감성 내레이터.",
    recommendedUse: "감동사연 전반 — OpenAI 확정 기본값. ElevenLabs 후보 준비 시 비교 후 교체 검토",
    previewText: "아버지는 그날부터, 그 사진을 지갑에 넣고 다니셨던 거예요.",
    provider: "openai",
    openaiVoice: "sage",
    openaiModel: "gpt-4o-mini-tts",
    openaiSpeed: 0.94,
    openaiInstructions:
      "Quiet emotional Korean storytelling. Soft, intimate, and reflective. Natural pauses and gentle sadness. Do not sound like a news anchor, classroom leader, explainer, tutorial, or announcer.",
    recommended: true,
    isReady: true,
  },

  // ── ElevenLabs 후보 슬롯 1 — 감성 여성 클라이맥스용 ──────────────────────
  {
    id: "elevenlabs-slot-1",
    label: "EL 슬롯 1 — 감성 여성",
    description: "클라이맥스·감정 폭발 씬용 감성 여성 후보. voiceId를 설정하면 활성화됩니다.",
    recommendedUse: "씬 6~9 감정 클라이맥스, 눈물·후회·그리움 피크 구간",
    previewText: "그 날짜가, 제가 태어난 바로 그날이라는 걸… 그땐 몰랐어요.",
    provider: "elevenlabs",
    elevenLabsVoiceId: null,        // ← ElevenLabs Voice Library에서 ID 입력
    elevenLabsStability: 0.42,
    elevenLabsSimilarityBoost: 0.80,
    elevenLabsStyle: 0.38,
    isReady: false,
  },

  // ── ElevenLabs 후보 슬롯 2 — 차분 여성 도입부용 ──────────────────────────
  {
    id: "elevenlabs-slot-2",
    label: "EL 슬롯 2 — 차분 여성",
    description: "잔잔하고 내면 독백에 어울리는 차분한 여성 후보. voiceId를 설정하면 활성화됩니다.",
    recommendedUse: "씬 1~3 도입·회상, 내레이터 독백형 구간",
    previewText: "아버지는 그날부터, 그 사진을 지갑에 넣고 다니셨던 거예요.",
    provider: "elevenlabs",
    elevenLabsVoiceId: null,
    elevenLabsStability: 0.55,
    elevenLabsSimilarityBoost: 0.75,
    elevenLabsStyle: 0.18,
    isReady: false,
  },

  // ── ElevenLabs 후보 슬롯 3 — 여운 closing용 ──────────────────────────────
  {
    id: "elevenlabs-slot-3",
    label: "EL 슬롯 3 — 여운 클로징",
    description: "엔딩·여운 구간에 어울리는 잔잔한 여성 후보. voiceId를 설정하면 활성화됩니다.",
    recommendedUse: "씬 10 closing_line, 잔상·여운 표현 구간",
    previewText: "이제야 알 것 같아요. 그 사진은, 아버지의 마음이었어요.",
    provider: "elevenlabs",
    elevenLabsVoiceId: null,
    elevenLabsStability: 0.60,
    elevenLabsSimilarityBoost: 0.72,
    elevenLabsStyle: 0.22,
    isReady: false,
  },

  // ── ElevenLabs 후보 슬롯 4 — 중성적 서술형 ──────────────────────────────
  {
    id: "elevenlabs-slot-4",
    label: "EL 슬롯 4 — 중성 서술형",
    description: "사건 서술·전환 씬에 어울리는 중성적 톤 후보. voiceId를 설정하면 활성화됩니다.",
    recommendedUse: "씬 4~5 사건 전환, 배경 설명형 서술 구간",
    previewText: "그 날짜가, 제가 태어난 바로 그날이라는 걸… 그땐 몰랐어요.",
    provider: "elevenlabs",
    elevenLabsVoiceId: null,
    elevenLabsStability: 0.50,
    elevenLabsSimilarityBoost: 0.78,
    elevenLabsStyle: 0.20,
    isReady: false,
  },

  // ── ElevenLabs 후보 슬롯 5 — 남성 회고형 ────────────────────────────────
  {
    id: "elevenlabs-slot-5",
    label: "EL 슬롯 5 — 남성 회고",
    description: "아버지·남성 화자 시점의 회고형 서술 후보. voiceId를 설정하면 활성화됩니다.",
    recommendedUse: "1인칭 남성 화자 사연, 아버지 시점 독백 씬",
    previewText: "이제야 알 것 같아요. 그 사진은, 아버지의 마음이었어요.",
    provider: "elevenlabs",
    elevenLabsVoiceId: null,
    elevenLabsStability: 0.52,
    elevenLabsSimilarityBoost: 0.80,
    elevenLabsStyle: 0.25,
    isReady: false,
  },
];

// ── ElevenLabs 콘텐츠별 음성 풀 (2026-06-13 등록) ─────────────────────────────
//
// ElevenLabs GET /v1/voices 정확 일치 조회로 확인된 voiceId.
// voiceId는 공개 메타데이터이므로 코드 저장 가능 (API key/계정정보는 금지).
// 기존 카테고리 기본 음성 선택을 강제로 바꾸지 않음 — 참조용 매핑.
//
// 콘텐츠 타입 → 추천 보이스:
//   relationship_advice        → Harry Kim (인간관계·현실 조언, 대화형)
//   psychology_analysis        → Hyein (심리 해석·관계 신호)
//   light_relationship_empathy → Hana Lee (가벼운 관계심리·공감)
//   emotional_inner_monologue  → Mono Beige (내면 독백·감성)
//   success_self_esteem        → Sola (성공·자존감)
//   practical_information      → Mina (생활꿀팁·정보형 전용)

export interface ContentVoiceEntry {
  voiceName: string;
  voiceId: string;
  intendedContentType: string;
  provider: "elevenlabs";
  /** 한국어 콘텐츠 영구 탈락 여부 (사용자 청취 평가 기반) */
  deprecated?: boolean;
  deprecatedReason?: string;
  /** 사용자 실제 청취 평가를 통과해 validated voice pool에 등록됨 */
  validated?: boolean;
}

export const CONTENT_VOICE_POOL: Record<string, ContentVoiceEntry> = {
  relationship_advice: {
    voiceName: "Harry Kim - Conversational",
    voiceId: "pb3lVZVjdFWbkhPKlelB",
    intendedContentType: "인간관계·남녀심리·현실 조언",
    provider: "elevenlabs",
    deprecated: true,
    deprecatedReason: "한국어 발음·억양·속도·연기 느낌 문제로 영구 탈락 (2026-06-13 사용자 평가). 한국어 콘텐츠 사용 금지.",
  },
  psychology_analysis: {
    voiceName: "Hyein - Calm & Professional",
    voiceId: "6Vgh4FaCc0SCcWPwcyXa",
    intendedContentType: "심리 해석·관계 신호·투자심리",
    provider: "elevenlabs",
  },
  light_relationship_empathy: {
    voiceName: "Hana Lee - Natural and Cheerful",
    voiceId: "QPFsEL6IBxlT15xfiD6C",
    intendedContentType: "가벼운 관계심리·공감형",
    provider: "elevenlabs",
  },
  emotional_inner_monologue: {
    voiceName: "Mono Beige - Calm & Contemporary",
    voiceId: "SE9upoSoM2ipDUdAVW8q",
    intendedContentType: "내면 독백·감성심리",
    provider: "elevenlabs",
  },
  success_self_esteem: {
    voiceName: "Sola - Warm, Clear and Rich",
    voiceId: "KlstlYt9VVf3zgie2Oht",
    intendedContentType: "성공·마인드·자존감",
    provider: "elevenlabs",
  },
  practical_information: {
    voiceName: "Mina - Clear, calm & Warm Female Voice",
    voiceId: "aiUUgjHa4mpHf6UenZuf",
    intendedContentType: "생활꿀팁·정보형 심리 (관계심리 사용 금지)",
    provider: "elevenlabs",
  },
};

/** 콘텐츠 타입으로 추천 보이스 조회. 없으면 null. */
export function getContentVoice(contentType: string): ContentVoiceEntry | null {
  return CONTENT_VOICE_POOL[contentType] ?? null;
}

// ── 역할 기반 운영 음성 풀 (Voice Design 생성, 2026-06-13~) ───────────────────
//
// 남녀 각각 역할별 보이스. status:
//   provisional = 블라인드 평가 통과했으나 실제 영상 적용 검증 전 (validated 금지)
//   validated   = 실제 영상 적용 품질까지 확인된 최종 확정
//   deprecated  = 탈락
// voiceId는 My Voices 저장 후 영구 ID, generatedVoiceId는 Voice Design preview ID.

export type VoicePoolStatus = "provisional" | "validated" | "deprecated";

export interface VoicePoolEntry {
  gender: "male" | "female";
  role: string;
  voiceId?: string | null;          // My Voices 저장 후 영구 ID
  generatedVoiceId?: string | null; // Voice Design preview ID (저장 전)
  status: VoicePoolStatus;
  intendedContentTypes: string[];
  userAssessment?: string;
}

export const VOICE_POOL: Record<string, VoicePoolEntry> = {
  // ── 남성 (Voice Design male_v1 블라인드 A/B/C, 사용자 역할 매칭 확정) ─────────
  male_persuasive_appeal: {
    gender: "male",
    role: "persuasive_appeal",
    generatedVoiceId: "KgY3uQHUKw0hah6g2xjn", // 남성 A
    status: "provisional",
    intendedContentTypes: ["관계 경고", "현실 조언", "성공 마인드", "자존감"],
    userAssessment: "호소력·설득형. 실제 영상 적용 후 validated 전환 검토.",
  },
  male_trusted_information: {
    gender: "male",
    role: "trusted_information",
    voiceId: "uIDle50IpRkamKKmsOEc", // 남성 B — My Voices 저장됨 (2026-06-14, 투자심리 MVP01)
    generatedVoiceId: "uIDle50IpRkamKKmsOEc", // 남성 B
    status: "provisional",
    intendedContentTypes: ["심리 분석", "투자심리", "경제 콘텐츠"],
    userAssessment: "정보 전달형. My Voices 저장 완료 후 TTS 호출 검증(투자심리 MVP01). 실제 영상 적용 후 validated 전환 검토.",
  },
  male_light_emotional: {
    gender: "male",
    role: "light_emotional",
    generatedVoiceId: "Cpod4JhRysPuubCUTcQi", // 남성 C
    status: "provisional",
    intendedContentTypes: ["공감형 관계심리", "짧은 내면 독백"],
    userAssessment: "가벼운 감정 전달형. 실제 영상 적용 후 validated 전환 검토.",
  },
  // ── 여성 (Voice Design female_roles_v1, 사용자 역할 매칭 확정, My Voices 저장됨) ──
  female_information_empathy: {
    gender: "female",
    role: "trusted_information + relatable_empathy",
    voiceId: "Vcdpf78zk35fXQIvmObI", // 여성 A
    generatedVoiceId: "Vcdpf78zk35fXQIvmObI",
    status: "provisional",
    intendedContentTypes: ["심리 분석", "관계 신호", "공감형 관계심리", "내면 독백"],
    userAssessment: "정보형 + 공감형 겸용. 실제 영상 적용 후 validated 전환 검토.",
  },
  female_persuasive_appeal: {
    gender: "female",
    role: "persuasive_appeal",
    voiceId: "n64q8n5KTcGLp392p3wn", // 여성 B
    generatedVoiceId: "n64q8n5KTcGLp392p3wn",
    status: "provisional",
    intendedContentTypes: ["관계 경고", "현실 조언", "자존감", "성공 마인드"],
    userAssessment: "호소·설득형. 관계 경고 MVP에 1순위 적용 (여성 화면 몰입감). 실제 영상 검증 진행 중.",
  },
  female_trusted_information_alt: {
    gender: "female",
    role: "trusted_information",
    voiceId: "uP1FVX5bEfq8Dzb1LDTs", // 여성 C
    generatedVoiceId: "uP1FVX5bEfq8Dzb1LDTs",
    status: "provisional",
    intendedContentTypes: ["심리 분석", "투자심리", "경제 정보"],
    userAssessment: "정보 전달형 보조. 실제 영상 적용 후 validated 전환 검토.",
  },
};

/** 역할 키로 운영 보이스 조회. 없으면 null. */
export function getPoolVoice(key: string): VoicePoolEntry | null {
  return VOICE_POOL[key] ?? null;
}

// ── 헬퍼 ─────────────────────────────────────────────────────────────────────

/** 카테고리별 후보 맵 (추후 카테고리 추가 대비) */
export const VOICE_CANDIDATES_BY_CATEGORY: Record<string, VoiceCandidate[]> = {
  emotional_story: EMOTIONAL_STORY_VOICE_CANDIDATES,
};

/**
 * 카테고리에 맞는 후보 목록 반환.
 * 없으면 빈 배열.
 */
export function getVoiceCandidates(referenceStyle: string): VoiceCandidate[] {
  return VOICE_CANDIDATES_BY_CATEGORY[referenceStyle] ?? [];
}

/**
 * 사용 가능한(isReady = true) 후보만 반환.
 */
export function getReadyVoiceCandidates(referenceStyle: string): VoiceCandidate[] {
  return getVoiceCandidates(referenceStyle).filter((c) => c.isReady);
}

/**
 * 전체 후보 풀에서 id로 단일 후보 조회.
 * 없으면 null.
 */
export function getVoiceCandidateById(candidateId: string): VoiceCandidate | null {
  const all = Object.values(VOICE_CANDIDATES_BY_CATEGORY).flat();
  return all.find((c) => c.id === candidateId) ?? null;
}

// ── localStorage 선택 조회 ────────────────────────────────────────────────────
// page.tsx와 동일한 키 규칙: autoshorts:selected-voice:v1:<renderId>

const VOICE_SEL_PREFIX = "autoshorts:selected-voice:v1";

export interface SelectedVoiceEntry {
  renderId: string;
  candidateId: string;
  /** 후보 label (후보가 존재하면 채워짐, 아니면 candidateId 그대로) */
  label: string;
  provider: "openai" | "elevenlabs";
}

/**
 * 특정 renderId에 저장된 보이스 선택 반환.
 * 없으면 null. 클라이언트 전용.
 */
export function getSelectedVoiceForRender(renderId: string): SelectedVoiceEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const candidateId = localStorage.getItem(`${VOICE_SEL_PREFIX}:${renderId}`);
    if (!candidateId) return null;
    // 전체 후보 풀에서 label/provider 조회
    const allCandidates = Object.values(VOICE_CANDIDATES_BY_CATEGORY).flat();
    const found = allCandidates.find((c) => c.id === candidateId);
    return {
      renderId,
      candidateId,
      label:    found?.label    ?? candidateId,
      provider: found?.provider ?? "openai",
    };
  } catch {
    return null;
  }
}

/**
 * localStorage에서 renderId별 보이스 선택을 모두 읽어 반환.
 * key prefix `autoshorts:selected-voice:v1:` 로 스캔.
 * 클라이언트 전용.
 */
export function listSelectedVoices(): SelectedVoiceEntry[] {
  if (typeof window === "undefined") return [];
  const prefix = `${VOICE_SEL_PREFIX}:`;
  const result: SelectedVoiceEntry[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(prefix)) continue;
      const renderId = key.slice(prefix.length);
      if (!renderId) continue;
      const entry = getSelectedVoiceForRender(renderId);
      if (entry) result.push(entry);
    }
  } catch { /* 무시 */ }
  return result;
}

/**
 * renderId Set → 보이스 선택 Map (배지 표시용).
 * listSelectedVoices()의 경량 래퍼.
 */
export function getSelectedVoiceMap(renderIds: string[]): Map<string, SelectedVoiceEntry> {
  const map = new Map<string, SelectedVoiceEntry>();
  if (typeof window === "undefined") return map;
  for (const id of renderIds) {
    const entry = getSelectedVoiceForRender(id);
    if (entry) map.set(id, entry);
  }
  return map;
}
