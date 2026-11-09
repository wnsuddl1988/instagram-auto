/**
 * captionSanitizer.ts
 *
 * 감동사연 caption 보정/검증 헬퍼 모음.
 * route.ts 에서 직접 쓰던 코드를 분리해 export — 로컬 테스트 가능하도록.
 *
 * 유료 API 의존 없음 (순수 문자열 처리).
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. seedTopic → 오브젝트 후보 맵
// ─────────────────────────────────────────────────────────────────────────────

/** seedTopic별 캡션 후보 맵 — 긴 패턴이 더 구체적이므로 앞에 배치 */
export const SEED_OBJECT_ENTRIES: Array<{
  patterns: string[];
  objects: string[];
  singleMap: Record<string, string>;
}> = [
  {
    patterns: ["전화기"],
    objects:  ["낡은 전화기", "수화기", "전화기 액정", "전화기 밑 메모"],
    singleMap: {
      "메모": "전화기 밑 메모", "쪽지": "전화기 옆 쪽지",
      "할머니": "할머니 전화기", "할아버지": "할아버지 전화기",
      "아버지": "아버지 전화기", "엄마": "엄마 전화기",
    },
  },
  {
    patterns: ["냉장고", "메모"],
    objects:  ["냉장고 메모", "냉장고 문", "메모 한 장"],
    singleMap: {
      "메모": "냉장고 메모", "쪽지": "냉장고 쪽지",
      "아버지": "아버지 메모", "엄마": "엄마 메모",
    },
  },
  {
    patterns: ["열쇠", "집 열쇠", "집열쇠"],
    objects:  ["낡은 열쇠", "아버지 열쇠", "열쇠고리", "아버지 작업실"],
    singleMap: {
      "열쇠": "낡은 열쇠", "작업실": "아버지 작업실",
      "아버지": "아버지 열쇠", "메모": "열쇠 속 메모",
    },
  },
  {
    patterns: ["병원", "의자"],
    objects:  ["병원 의자", "복도 의자", "담요 의자", "봉투 속 손글씨"],
    singleMap: {
      "의자": "병원 의자", "손글씨": "봉투 속 손글씨",
      "아버지": "아버지 의자", "메모": "봉투 속 메모",
      "기다림": "병원 의자", "목요일": "목요일 의자",
    },
  },
  {
    patterns: ["반찬통", "이웃"],
    objects:  ["문 앞 반찬통", "할머니 가방", "가방 속 쪽지"],
    singleMap: {
      "반찬통": "문 앞 반찬통", "쪽지": "가방 속 쪽지",
      "메모": "반찬통 쪽지", "이웃": "이웃 반찬통",
      "할머니": "할머니 반찬통",
    },
  },
  {
    patterns: ["사진", "지갑"],
    objects:  ["지갑 속 사진", "사진 모서리", "아버지 지갑", "지갑 손때", "지갑 안쪽"],
    singleMap: {
      "사진": "지갑 속 사진", "지갑": "낡은 지갑",
      "아버지": "아버지 지갑", "액자": "먼지 쌓인 액자",
      "메모": "사진 뒷면 메모",
      "손때": "지갑 손때", "가죽": "낡은 가죽",
      "안쪽": "지갑 안쪽", "이음새": "지갑 이음새",
      "모서리": "지갑 모서리", "의문": "낡은 지갑",
      "할머니": "지갑 속 사진",
      // 문장형 조각 → 구체 오브젝트 (QA-1 보강)
      "보셨던이유는": "지갑 속 사진", "보셨던 이유는": "지갑 속 사진",
      "아버지가나에게": "아버지 지갑", "아버지가 나에게": "아버지 지갑",
      "사진은지금도": "지갑 속 사진", "사진은 지금도": "지갑 속 사진",
      "남긴사랑": "사진 뒷면 메모", "남긴 사랑": "사진 뒷면 메모",
      "오래된손길": "사진 모서리", "오래된 손길": "사진 모서리",
      "마음속의기억": "지갑 속 사진", "마음속의 기억": "지갑 속 사진",
      "비밀": "지갑 속 사진", "비밀이었어요": "지갑 속 사진",
      // 조사/부사 조각 캡션 → 구체 명사구 (QA-2 보강)
      "사진을매일": "지갑 속 사진", "사진을 매일": "지갑 속 사진",
      "매일보던사진": "지갑 속 사진", "매일 보던 사진": "지갑 속 사진",
      "모습이다시": "사진 속 아버지", "모습이 다시": "사진 속 아버지",
      "아버지의사랑을": "아버지의 사랑", "아버지의 사랑을": "아버지의 사랑",
      "사랑을간직하다": "간직한 사진", "사랑을 간직하다": "간직한 사진",
      "웃는아버지": "사진 속 아버지", "웃는 아버지": "사진 속 아버지",
      // 관형형 조각 / 추상 연결어 / 추상+속의 캡션 → 구체 명사구 (QA-3 보강)
      "함께있는": "사진 속 부자", "함께 있는": "사진 속 부자",
      "아버지와의기억": "사진 속 부자", "아버지와의 기억": "사진 속 부자",
      "의문이남았어요": "지갑 속 사진", "의문이 남았어요": "지갑 속 사진",
      "마음의연결": "아버지 사진", "마음의 연결": "아버지 사진",
      "마음속의사진": "지갑 속 사진", "마음속의 사진": "지갑 속 사진",
      "추억의순간": "낡은 사진", "추억의 순간": "낡은 사진",
      "행복한순간": "사진 속 미소", "행복한 순간": "사진 속 미소",
      // 문장형 caption → 구체 명사구 (QA-4 보강)
      "그땐몰랐어요": "지갑 속 사진", "그땐 몰랐어요": "지갑 속 사진",
      "아버지의소중한": "아버지 사진", "아버지의 소중한": "아버지 사진",
      "소중한기억": "아버지 사진", "소중한 기억": "아버지 사진",
      "아침의사진": "지갑 속 사진", "아침의 사진": "지갑 속 사진",
      "첫여행": "첫 여행 사진", "첫 여행": "첫 여행 사진",
      "특별한날": "특별한 사진", "특별한 날": "특별한 사진",
      "아버지와어머니": "부모님 사진", "아버지와 어머니": "부모님 사진",
      "사진을바라보는아버지": "사진 속 아버지", "사진을 바라보는 아버지": "사진 속 아버지",
    },
  },
  {
    patterns: ["액자", "가족사진"],
    objects:  ["가족 액자", "먼지 쌓인 액자", "서랍 속 사진"],
    singleMap: {
      "액자": "가족 액자", "사진": "먼지 쌓인 사진",
      "아버지": "아버지 사진", "메모": "액자 뒤 메모",
    },
  },
  {
    patterns: ["도시락", "도시락통"],
    objects:  ["빈 도시락", "엄마 도시락", "도시락통"],
    singleMap: {
      "도시락": "빈 도시락", "쪽지": "도시락 속 쪽지",
      "메모": "도시락 속 메모", "엄마": "엄마 도시락",
    },
  },
  {
    patterns: ["노트"],
    objects:  ["낡은 노트", "아버지 노트", "서랍 속 노트", "노트 속 글씨", "빛바랜 사진"],
    singleMap: {
      "노트": "낡은 노트", "메모": "노트 속 메모",
      "아버지": "아버지 노트",
      "추억": "노트 속 사진", "기록": "아버지 노트",
      "글씨": "노트 속 글씨", "글씨체": "낡은 글씨체",
      "사진": "노트 속 사진", "기억": "아버지 노트",
      "비밀": "닫힌 노트", "이야기": "노트 속 글씨",
      "서재": "서재 책상",
      "우리가족": "가족 사진", "우리 가족": "가족 사진",
      "가족의보물": "아버지 노트", "가족의 보물": "아버지 노트",
      "기억속사랑": "노트 속 사진", "기억 속 사랑": "노트 속 사진",
      "메모기록": "노트 속 메모", "메모 기록": "노트 속 메모",
      "아버지행동": "아버지 노트", "아버지 행동": "아버지 노트",
      "노트열기": "낡은 노트", "노트 열기": "낡은 노트",
      "노트뒤편": "노트 뒤편", "노트 뒤편": "노트 뒤편",
      "느끼게해요": "아버지 메모", "느끼게 해요": "아버지 메모",
    },
  },
  {
    patterns: ["밥그릇"],
    objects:  ["빈 밥그릇", "할머니 밥그릇", "상 위 밥그릇", "식탁 밥그릇"],
    singleMap: {
      "밥그릇": "빈 밥그릇", "할머니": "할머니 밥그릇",
      "그릇": "빈 밥그릇",
      "사랑의그릇": "할머니 밥그릇", "사랑의 그릇": "할머니 밥그릇",
      "식탁의빈그릇": "식탁 밥그릇", "식탁의 빈 그릇": "식탁 밥그릇",
      "빈그릇": "빈 밥그릇", "씻은그릇": "할머니 밥그릇",
      "성스럽게놓으셨어": "식탁 위 그릇",
      "것인지궁금했어": "빈 밥그릇",
      "내방한켠": "방 안 밥그릇", "내 방 한켠": "방 안 밥그릇",
      "그릇흔적": "할머니 밥그릇",
      "의문": "빈 밥그릇", "의아함": "빈 밥그릇",
      "도시락의문": "빈 밥그릇",
    },
  },
  {
    patterns: ["쪽지"],
    objects:  ["봉투 속 쪽지", "가방 속 쪽지", "냉장고 쪽지"],
    singleMap: {
      "쪽지": "봉투 속 쪽지", "메모": "봉투 속 메모",
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. seedTopic 매칭 헬퍼
// ─────────────────────────────────────────────────────────────────────────────

/** seedTopic에서 가장 잘 맞는 entry 반환 (더 긴 패턴이 우선) */
export function matchSeedEntry(seedTopic?: string) {
  if (!seedTopic) return null;
  let best: (typeof SEED_OBJECT_ENTRIES)[0] | null = null;
  let bestLen = 0;
  for (const entry of SEED_OBJECT_ENTRIES) {
    for (const pat of entry.patterns) {
      if (seedTopic.includes(pat) && pat.length > bestLen) {
        best = entry;
        bestLen = pat.length;
      }
    }
  }
  return best;
}

/** seedTopic의 대표 오브젝트 후보 리스트 반환 */
export function seedObjects(seedTopic?: string): string[] {
  return matchSeedEntry(seedTopic)?.objects ?? [];
}

/** seedTopic별 단일 명사 → 구체화 맵 반환 */
export function seedSingleMap(seedTopic?: string): Record<string, string> {
  return matchSeedEntry(seedTopic)?.singleMap ?? {};
}

/** seedTopic별 안전한 fallback caption 반환 */
export function safeFallbackCaption(seedTopic?: string): string {
  if (!seedTopic) return "낡은 흔적";
  const fallbacks: Array<[string, string]> = [
    ["전화기",   "낡은 전화기"],
    ["냉장고",   "냉장고 메모"],
    ["메모",     "메모 한 장"],
    ["열쇠",     "낡은 열쇠"],
    ["병원",     "병원 의자"],
    ["의자",     "빈 의자"],
    ["반찬통",   "문 앞 반찬통"],
    ["이웃",     "이웃 반찬통"],
    ["사진",     "낡은 사진"],
    ["지갑",     "낡은 지갑"],
    ["액자",     "가족 액자"],
    ["가족사진", "가족사진 액자"],
    ["도시락",   "빈 도시락"],
    ["노트",     "낡은 노트"],
    ["밥그릇",   "빈 밥그릇"],
    ["쪽지",     "봉투 속 쪽지"],
    ["배우자",   "식탁 위 쪽지"],
  ];
  for (const [key, val] of fallbacks) {
    if (seedTopic.includes(key)) return val;
  }
  return "낡은 흔적";
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. caption 유효성 검사
// ─────────────────────────────────────────────────────────────────────────────

/**
 * caption 유효성 검사 — 명사구로 적합한지 확인.
 * 문장형(조사/어미로 끝남), 부사+인물 조각, 동사형, 관형형 끝 조각 등은 부적절.
 * @returns true = 정상 명사구 / false = 부적합(보정 필요)
 */
export function isCaptionLike(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  const t = text.trim();

  // 조사가 공백 후 단어 끝에 오는 경우 (스페이스 분리형)
  if (/\s(은|는|이|가|을|를|에|의|도|만)$/.test(t)) return false;
  // 조사가 단어에 붙어 끝나는 경우 — "친구의 소식은", "그때 아버지는"
  if (/[가-힣](은|는)$/.test(t) && t.includes(" ")) return false;

  const _wc = t.split(/\s+/).filter(Boolean).length;

  // 조사가 단어에 붙어 문장 끝 — "아버지의 사랑을", "그 모습이"
  if (/[가-힣](을|를|이|가)$/.test(t) && _wc >= 2) return false;

  // 부사로 끝나는 조각 — "사진을 매일", "모습이 다시"
  if (/(매일|다시|항상|자주|또|더|여전히|아직|지금도|한번|한 번)$/.test(t)) return false;

  // 관형형 어미로 끝나는 조각 — "함께 있는", "남겨진", "친구를 잃은" 등 명사 없이 끝남
  if (_wc >= 2 && /(있는|없는|남겨진|숨겨진|기다리던|남아있는|담겨진|담긴|쌓인|잊혀진|잊혀간|잊히는|남은|사라진|지나간|지나온|잃은|떠난|가신|돌아간|먼저간|돌아오지않는|오지않는)$/.test(t)) return false;

  // 종결어미 — 동사 문장형
  if (/(했어요|했죠|했어|했었어|있어요|없어요|이에요|예요|네요|더라고요|거든요|거예요|셨어요|셨죠|셨어|잖아요|잖죠|겠죠|있었죠|없었죠|있었어요|없었어요)$/.test(t)) return false;

  // 일반 과거형 문장 — "남았어요", "생겼어요", "몰랐어요" 등
  if (/(남았어요|생겼어요|알았어요|깨달았어요|이해했어요|기억났어요|떠올랐어요|보였어요|들렸어요|느껴졌어요|몰랐어요|알게됐어요|보게됐어요|하게됐어요)$/.test(t)) return false;

  if (/(해요|하죠|하네요|해서요|할게요|할까요|했나요)$/.test(t)) return false;
  if (/(대요|래요|대$|랬대|셨대|었대|았대)/.test(t)) return false;
  // 관형형으로 끝나는 미완성 조각 — "아버지의 소중한", "엄마의 따뜻한" 등
  // ※ "낡은" 단독은 isAdjectiveOnly 에서 처리하므로 _wc >= 2 조건으로 한정
  if (_wc >= 2 && /(한|ㄴ|운|스러운|다운|로운)$/.test(t)
    && !/(?:사진|지갑|노트|메모|쪽지|열쇠|의자|그릇|도시락|반찬통|액자|전화기|수화기|밥그릇)$/.test(t)) return false;
  // "A와 B", "A와 어머니" 등 인물 나열형 — 릴스 자막으로 약함
  if (/[가-힣]+와\s+[가-힣]+$/.test(t) || /[가-힣]+과\s+[가-힣]+$/.test(t)) return false;
  if (/(고,|고$|며,|며$|서,|서$)/.test(t)) return false;
  if (/는\s*[가-힣]{1,3}$/.test(t)) return false;
  if (/(져|셨|하셨|하다|였다|었다|있다|없다|겠다|잖$|었죠|았죠|있죠|없죠|이었|이었다|였어|이었어)$/.test(t)) return false;
  if (/(으셨어|셨었어|았어|었어|았었어|었었어|궁금했어|알았어|몰랐어|느꼈어|봤어|봤죠|됐어|됐죠)$/.test(t)) return false;

  // 부사로 시작 (명사구 아님)
  if (/^(살짝|아주|매우|너무|정말|조금|자주|매일|항상|절대|다시|또|더|조용히|조심스럽게|심스럽게|성스럽게|조심히|가만히|천천히)\s+/.test(t)) return false;

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. 약한 caption 보정
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 약한 caption → 구체 caption 보정.
 * @param caption  원본 caption
 * @param narration 해당 씬 narration (단어 힌트 추출용, 없으면 undefined)
 * @param seedTopic storySeedTopic
 * @returns 보정된 caption, 보정 불가이면 null
 */
export function fixWeakCaption(
  caption: string,
  narration: string | undefined,
  seedTopic: string | undefined
): string | null {
  const norm = caption.replace(/\s/g, "");
  const objs = seedObjects(seedTopic);
  const primary = objs[0] ?? null;

  // 1순위: singleMap (소재 맞춤 보정)
  // singleMap 결과도 isCaptionLike 검증 — 잘못된 매핑이 문장형을 반환하면 primary fallback
  const map = seedSingleMap(seedTopic);
  const trimmed = caption.trim();
  const mapResult = map[norm] ?? map[trimmed] ?? null;
  if (mapResult) {
    return isCaptionLike(mapResult) ? mapResult : (primary ?? safeFallbackCaption(seedTopic));
  }

  // 2순위: 관계어 단독
  const RELATION_WORDS: Record<string, string> = {
    "아버지":   "아버지 " + (objs[0]?.replace(/^아버지\s*/, "") ?? "흔적"),
    "어머니":   "어머니 " + (objs[0]?.replace(/^엄마\s*|^어머니\s*/, "") ?? "흔적"),
    "엄마":     "엄마 "   + (objs[0]?.replace(/^엄마\s*/, "") ?? "흔적"),
    "아빠":     "아빠 "   + (objs[0]?.replace(/^아버지\s*/, "") ?? "흔적"),
    "할머니":   "할머니 " + (objs[0]?.replace(/^할머니\s*/, "") ?? "흔적"),
    "할아버지": "할아버지 " + (objs[0]?.replace(/^할아버지\s*/, "") ?? "흔적"),
    "이웃":     objs[0] ?? "이웃 반찬통",
    "배우자":   objs[0] ?? "배우자 쪽지",
    "남편":     objs[0] ?? "남편 메모",
    "아내":     objs[0] ?? "아내 쪽지",
  };
  if (RELATION_WORDS[norm]) return RELATION_WORDS[norm];

  // 질문형/의문형 단독
  const QUESTION_FORMS = new Set([
    "왜", "왜?", "의문", "의문?", "의아함", "궁금증",
    "누구를위해?", "누구를위해", "누구를위한것", "누구를위한",
    "왜그랬을까", "왜그랬을까요", "누가뒀을까", "어디서온걸까",
  ]);
  if (QUESTION_FORMS.has(norm)) return primary ?? safeFallbackCaption(seedTopic);

  // 신체/가구 부위
  const CONTEXT_PARTS: Record<string, string> = {
    "팔걸이": "의자 팔걸이",
    "등받이": "의자 등받이",
    "서랍": primary ? `${primary.split(" ")[0]} 서랍` : "낡은 서랍",
    "뚜껑": primary ?? "도시락 뚜껑",
    "손잡이": primary ?? "문 손잡이",
    "표지": primary ?? "노트 표지",
  };
  if (CONTEXT_PARTS[norm]) return CONTEXT_PARTS[norm];

  // 짧은 추상 단독명사
  const SHORT_ABSTRACT = new Set([
    "기다림", "그날", "기억", "순간", "마음", "그때", "같은자리",
    "글씨", "흔적", "빛", "소리", "냄새", "향기", "눈물", "웃음", "미소",
    "손때", "때", "먼지", "향", "빛깔", "색", "무게", "결",
    "문앞", "작업실",
  ]);
  if (SHORT_ABSTRACT.has(norm)) {
    if (primary) return primary;
    if (narration) {
      const hint = narration.match(/([가-힣]{2,4})\s([가-힣]{2,4})/);
      if (hint && isCaptionLike(hint[0])) return hint[0];
    }
    return primary ?? null;
  }

  // 전역 fallback
  const GLOBAL_FALLBACK: Record<string, string> = {
    "손글씨": "봉투 속 손글씨",
    "목요일": primary ? `목요일 ${primary}` : "목요일 의자",
    "기다림": primary ?? "빈 의자",
    "작업실": primary ? `${primary.split(" ")[0]} 작업실` : "아버지 작업실",
    "쪽지":   primary ?? "봉투 속 쪽지",
    "메모":   primary ?? "메모 한 장",
    "의자":   primary ?? "빈 의자",
    "사진":   primary ?? "낡은 사진",
    "열쇠":   primary ?? "낡은 열쇠",
    "의문":   primary ?? "낡은 흔적",
    "의아함": primary ?? "낡은 흔적",
  };
  if (GLOBAL_FALLBACK[norm]) return GLOBAL_FALLBACK[norm];

  // 최종: narration 힌트에서 2단어 명사구 추출
  // ※ isCaptionLike + ABSTRACT_TAILS 이중 검증 — 문장형/추상어 힌트는 버리고 primary로 fall
  const ABSTRACT_TAILS = new Set([
    "마음", "의문", "느낌", "감정", "추억", "기억", "걱정", "여운",
    "그리움", "아픔", "슬픔", "일상", "고단함", "온기", "이야기", "손길",
    "날", "때", "순간", "생각", "시간",
  ]);
  if (narration) {
    const hints = narration.match(/([가-힣]{2,4})\s([가-힣]{2,4})/g);
    if (hints) {
      for (const h of hints) {
        const tail = h.split(" ").pop() ?? "";
        // isCaptionLike 재검증 필수 — narration 힌트가 문장형일 수 있음
        if (isCaptionLike(h) && !ABSTRACT_TAILS.has(tail)) return h;
      }
    }
  }
  // narration 힌트 적합 후보 없음 → secondary → primary → null
  if (objs.length >= 2) return objs[1];
  if (primary) return primary;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. emotional_story caption 재작성
// ─────────────────────────────────────────────────────────────────────────────

/**
 * seedTopic별 10씬 caption template 맵.
 * key: seedTopic에 포함된 대표 키워드 (singleMap 매칭 방식과 동일)
 * value: sceneIndex(0-based) → caption 후보 배열
 *   - 배열은 씬 순서에 맞는 "기본 후보"이며, 중복 발생 시 다음 후보로 fallback
 */
export const CAPTION_TEMPLATES: Array<{
  patterns: string[];
  captions: string[][];   // [sceneIndex][후보0, 후보1, ...]
}> = [
  {
    // 사진 / 지갑 seedTopic
    patterns: ["사진", "지갑"],
    captions: [
      // scene 1: 발견 장면
      ["낡은 사진", "오래된 사진", "지갑 속 사진"],
      // scene 2: 인물/관계
      ["아버지 지갑", "부모님 사진", "사진 속 인물"],
      // scene 3: 의문/질문
      ["지갑 속 사진", "매일 보던 사진", "낡은 지갑"],
      // scene 4: 오브젝트 디테일
      ["사진 모서리", "사진 뒷면", "지갑 손때"],
      // scene 5: 글씨/메모
      ["흐릿한 글씨", "사진 뒷면 메모", "아버지 손글씨"],
      // scene 6: 반복 행동
      ["사진 모서리", "지갑 안쪽", "닳은 사진"],
      // scene 7: 숨겨진 이야기
      ["사진 속 부자", "사진 속 미소", "오래된 사진"],
      // scene 8: 깨달음
      ["아버지 메모", "사진 뒷면", "아버지 사진"],
      // scene 9: 전환/현재
      ["간직한 사진", "지갑 속 사진", "낡은 사진"],
      // scene 10: 마무리
      ["지갑 속 사진", "간직한 사진", "아버지 지갑"],
    ],
  },
  {
    patterns: ["전화기"],
    captions: [
      ["낡은 전화기", "오래된 전화기", "수화기"],
      ["수화기", "전화기 액정", "아버지 전화기"],
      ["전화기 밑 메모", "전화기 액정", "낡은 전화기"],
      ["수화기", "전화기 손때", "낡은 전화기"],
      ["전화기 밑 메모", "메모 한 장", "손글씨"],
      ["낡은 전화기", "수화기", "전화기 액정"],
      ["수화기", "전화기 밑 메모", "낡은 전화기"],
      ["전화기 밑 메모", "메모 한 장", "낡은 전화기"],
      ["낡은 전화기", "수화기", "전화기 액정"],
      ["낡은 전화기", "전화기 밑 메모", "수화기"],
    ],
  },
  {
    patterns: ["냉장고", "메모"],
    captions: [
      ["냉장고 메모", "메모 한 장", "냉장고 문"],
      ["냉장고 문", "엄마 메모", "아버지 메모"],
      ["냉장고 메모", "메모 한 장", "냉장고 문"],
      ["냉장고 손때", "냉장고 문", "메모 한 장"],
      ["메모 글씨", "손글씨 메모", "메모 한 장"],
      ["냉장고 문", "냉장고 메모", "엄마 메모"],
      ["냉장고 메모", "메모 속 글씨", "메모 한 장"],
      ["엄마 메모", "아버지 메모", "메모 한 장"],
      ["냉장고 메모", "메모 한 장", "냉장고 문"],
      ["냉장고 메모", "메모 한 장", "냉장고 문"],
    ],
  },
  {
    patterns: ["열쇠"],
    captions: [
      ["낡은 열쇠", "아버지 열쇠", "열쇠고리"],
      ["열쇠고리", "아버지 열쇠", "낡은 열쇠"],
      ["낡은 열쇠", "열쇠고리", "아버지 작업실"],
      ["열쇠 손때", "낡은 열쇠", "열쇠고리"],
      ["열쇠 속 메모", "손글씨", "메모 한 장"],
      ["낡은 열쇠", "아버지 작업실", "열쇠고리"],
      ["열쇠고리", "낡은 열쇠", "아버지 열쇠"],
      ["아버지 작업실", "열쇠 속 메모", "낡은 열쇠"],
      ["낡은 열쇠", "열쇠고리", "아버지 열쇠"],
      ["낡은 열쇠", "아버지 열쇠", "열쇠고리"],
    ],
  },
  {
    patterns: ["밥그릇"],
    captions: [
      ["빈 밥그릇", "할머니 밥그릇", "상 위 밥그릇"],
      ["상 위 밥그릇", "식탁 밥그릇", "빈 밥그릇"],
      ["빈 밥그릇", "할머니 밥그릇", "식탁 밥그릇"],
      ["그릇 손때", "빈 밥그릇", "할머니 밥그릇"],
      ["그릇 속 음식", "빈 밥그릇", "할머니 밥그릇"],
      ["할머니 밥그릇", "식탁 밥그릇", "빈 밥그릇"],
      ["빈 밥그릇", "상 위 밥그릇", "할머니 밥그릇"],
      ["빈 밥그릇", "할머니 밥그릇", "식탁 밥그릇"],
      ["빈 밥그릇", "할머니 밥그릇", "상 위 밥그릇"],
      ["빈 밥그릇", "할머니 밥그릇", "식탁 밥그릇"],
    ],
  },
  {
    patterns: ["노트"],
    captions: [
      ["낡은 노트", "아버지 노트", "서랍 속 노트"],
      ["아버지 노트", "서랍 속 노트", "낡은 노트"],
      ["낡은 노트", "아버지 노트", "서랍 속 노트"],
      ["노트 표지", "낡은 노트", "아버지 노트"],
      ["노트 속 글씨", "손글씨", "메모 한 장"],
      ["아버지 노트", "낡은 노트", "서랍 속 노트"],
      ["노트 속 사진", "낡은 노트", "아버지 노트"],
      ["아버지 메모", "노트 속 글씨", "낡은 노트"],
      ["낡은 노트", "아버지 노트", "서랍 속 노트"],
      ["낡은 노트", "아버지 노트", "서랍 속 노트"],
    ],
  },
  {
    patterns: ["반찬통", "이웃"],
    captions: [
      ["문 앞 반찬통", "할머니 반찬통", "가방 속 쪽지"],
      ["이웃 반찬통", "할머니 가방", "문 앞 반찬통"],
      ["문 앞 반찬통", "가방 속 쪽지", "이웃 반찬통"],
      ["반찬통 손때", "문 앞 반찬통", "할머니 반찬통"],
      ["가방 속 쪽지", "반찬통 쪽지", "메모 한 장"],
      ["할머니 반찬통", "문 앞 반찬통", "이웃 반찬통"],
      ["문 앞 반찬통", "가방 속 쪽지", "할머니 반찬통"],
      ["반찬통 쪽지", "가방 속 쪽지", "할머니 가방"],
      ["문 앞 반찬통", "할머니 반찬통", "이웃 반찬통"],
      ["문 앞 반찬통", "이웃 반찬통", "할머니 반찬통"],
    ],
  },
  {
    patterns: ["액자", "가족사진"],
    captions: [
      ["가족 액자", "먼지 쌓인 액자", "서랍 속 사진"],
      ["가족 액자", "먼지 쌓인 액자", "아버지 사진"],
      ["먼지 쌓인 액자", "가족 액자", "서랍 속 사진"],
      ["액자 먼지", "가족 액자", "먼지 쌓인 액자"],
      ["액자 뒤 메모", "손글씨", "메모 한 장"],
      ["가족 액자", "먼지 쌓인 액자", "아버지 사진"],
      ["서랍 속 사진", "가족 액자", "먼지 쌓인 액자"],
      ["액자 뒤 메모", "아버지 사진", "가족 액자"],
      ["가족 액자", "먼지 쌓인 액자", "서랍 속 사진"],
      ["가족 액자", "먼지 쌓인 액자", "서랍 속 사진"],
    ],
  },
];

/** CAPTION_TEMPLATES에서 seedTopic에 맞는 entry 반환 */
function _matchCaptionTemplate(seedTopic?: string) {
  if (!seedTopic) return null;
  let best: (typeof CAPTION_TEMPLATES)[0] | null = null;
  let bestLen = 0;
  for (const entry of CAPTION_TEMPLATES) {
    for (const pat of entry.patterns) {
      if (seedTopic.includes(pat) && pat.length > bestLen) {
        best = entry;
        bestLen = pat.length;
      }
    }
  }
  return best;
}

/**
 * emotional_story 전용 caption 재작성.
 *
 * 동작 순서:
 * 1. CAPTION_TEMPLATES에서 seedTopic 매칭 entry 조회
 * 2. sceneIndex(0-based) 위치의 후보 배열 추출
 * 3. usedCaptions(이미 사용된 caption set)와 중복되지 않는 첫 번째 후보 반환
 * 4. 모든 후보가 중복이면 seedTopic primary fallback
 * 5. template 없는 seedTopic → null 반환 (기존 fixWeakCaption 경로 유지)
 *
 * @param sceneIndex  0-based 씬 인덱스 (0~9)
 * @param seedTopic   storySeedTopic
 * @param usedCaptions 앞 씬에서 이미 사용된 caption set (중복 방지)
 * @returns 재작성된 caption 또는 null (template 없음)
 */
export function rewriteEmotionalCaption(
  sceneIndex: number,
  seedTopic: string | undefined,
  usedCaptions: Set<string>
): string | null {
  const entry = _matchCaptionTemplate(seedTopic);
  if (!entry) return null;

  const idx = Math.min(sceneIndex, entry.captions.length - 1);
  const candidates = entry.captions[idx] ?? [];

  // 중복되지 않는 첫 번째 후보
  for (const c of candidates) {
    if (!usedCaptions.has(c)) return c;
  }

  // 모든 후보 중복 → 전체 template pool에서 미사용 후보 검색
  for (const row of entry.captions) {
    for (const c of row) {
      if (!usedCaptions.has(c)) return c;
    }
  }

  // 전부 중복이면 primary fallback (중복 허용)
  return entry.captions[idx]?.[0] ?? safeFallbackCaption(seedTopic);
}
