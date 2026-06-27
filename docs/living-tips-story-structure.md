# living_tips 스토리형 구조 재설계

> Status: **LEGACY / REFERENCE ONLY** (2026-06-27). living_tips is not the active Money Shorts OS MVP category. Story/hook lessons may be reused only as pattern inspiration for source-first life-economy shorts after Owner approval.

> 작성일: 2026-05-24  
> 배경: QA-LH-8 (냉장고 문칸 금지 식재료 TOP 5) TTS 완성본에 대한 사용자 피드백 반영

---

## 1. 사용자 피드백 원문 요약

| 피드백 항목 | 구체 내용 |
|------------|----------|
| **TTS 음성** | "첫 3초 목소리가 이상하게 느껴짐" (속도는 괜찮음) |
| **영상 구조** | "이미지 붙여넣고 설명하는 느낌" |
| **후킹** | "후킹 요소가 없음, 궁금한 느낌이 안 듦" |
| **이미지** | "이미지는 너무 평범함" |
| **재미/흥미** | "재미가 없음, 특별한 내용을 알려주는 느낌도 없음" |
| **한 줄 요약** | "한마디로 식상함" |
| **핵심 문제** | "가장 중요한 건 스토리 — 영상이 전달하고자 하는 스토리 맥락이 너무 약함" |

---

## 2. LH-8 콘텐츠 실패 진단

### 2-1. 기술적 성공 vs 콘텐츠 실패 분리

| 영역 | 결과 | 세부 |
|------|------|------|
| 해상도/코덱 | ✅ 성공 | 1080×1920, h264, 50s |
| caption 자연화 | ✅ 성공 | PPT 라벨 → 구어체 변환 |
| hook 패턴 적용 | ✅ 기술적 성공 | 금지형+즉시성형 조합 |
| **스토리 맥락** | ❌ **실패** | 정보 10개 나열, 연결 없음 |
| **시청자 공감** | ❌ **실패** | "나의 문제"로 연결 안 됨 |
| **궁금증 유발** | ❌ **실패** | 다음 씬 볼 이유 없음 |
| **이미지 역할** | ❌ **실패** | 배경 사진으로 전락 |

### 2-2. 정보나열형 구조의 근본 한계

LH-8의 10씬을 분해하면:
```
씬1: 달걀 문칸 넣지 마세요 → 씬2: 달걀 안 됨 → 씬3: 온도 변화 심함
씬4: 유제품 안 됨 → 씬5: 치즈/우유 안 됨 → 씬6: 과일/채소 안 됨
씬7: 안쪽이 신선함 유지 → 씬8: 양파+감자 따로 → 씬9: 양파 통풍 → 씬10: CTA
```

**문제**: 씬4~씬6이 씬2~씬3의 반복이다. "유제품도 안 됨", "과일도 안 됨" — 같은 규칙을 대상만 바꿔 반복하는 나열 구조.

시청자 입장에서는:
- 씬2를 보면 씬3~씬6을 안 봐도 결론을 안다
- "궁금해서 다음 씬을 봐야 하는 이유"가 없다
- 마지막에 뭔가 반전이 없다

### 2-3. "맞는 정보인데 재미없는" 이유

냉장고 문칸에 달걀을 넣으면 안 된다는 건 **사실**이다. 그러나:

1. **문제의 실감이 없다**: "오늘 바로 바꾸세요" — 왜 지금 당장인가? 시청자가 지금 문칸에 달걀이 있다는 것을 인식하지 못하면 위협이 전달되지 않는다.
2. **원인이 추상적이다**: "온도 변화가 심해요" — 얼마나? 언제? 내 달걀이 실제로 어떻게 되나?
3. **결과가 없다**: "빨리 상한다"는 말은 있지만 내 달걀이 **지금 어떤 상태인지**를 보여주지 않는다.
4. **나의 이야기가 아니다**: "달걀을 문칸에 넣는 집"이라고 3인칭으로 말한다. 시청자는 "설마 내 얘기?" 라는 의심이 필요하다.

### 2-4. 첫 3초 TTS가 이상하게 느껴지는 원인 후보

| 원인 후보 | 설명 |
|----------|------|
| **명령형으로 바로 시작** | "문칸에 달걀 넣는 집, 오늘 바로 바꾸세요" — 감정/상황 없이 즉시 지시. TTS가 연기할 맥락이 없어 기계적으로 들림 |
| **인위적 문장 구조** | "집"+"오늘 바로"의 조합이 자연스러운 구어체가 아님. 사람이 이렇게 말하지 않음 |
| **감정 레이어 없음** | 공감 → 문제 제기 → 지시 순서가 없음. "저도 이랬거든요" 같은 공감 진입점 없이 바로 경고로 시작 |
| **TTS가 연기할 감정이 없음** | nova voice가 자연스럽게 톤을 올릴 수 있는 서사가 없음. 정보 읽기 모드로만 동작 |

**핵심**: TTS는 감정과 상황이 있는 텍스트를 읽을 때 자연스러워진다. "저도 이렇게 했다가 3일 만에 달걀이 상한 경험이 있어요" 같은 서사가 있으면 TTS가 알아서 자연스러운 톤을 찾는다.

### 2-5. 이미지가 평범하게 느껴지는 이유

| 문제 | 설명 |
|------|------|
| **증거/사건이 없음** | 스토리 사건이 없으면 이미지는 배경이 된다. 달걀 이미지가 "달걀이 상했다"는 문제의 증거가 아니라 그냥 달걀 사진 |
| **stock photo = 중립적** | stock image는 기본적으로 긍정적/중립적 상황을 보여준다. 문제-원인-해결 전환을 보여주지 못함 |
| **이미지-narration 미러링** | 자막에 "달걀은 안쪽 칸으로"인데 이미지는 달걀 트레이. 이미지가 설명을 반복할 뿐, 새 정보를 주지 않음 |
| **전환 없음** | scene 6(과일이 상한다)과 scene 7(안쪽이 신선함)이 시각적으로 before/after를 보여주지 않음 |

---

## 3. 기존 정보나열형 vs 새 스토리형 비교

### 기존: 정보나열형 (TOP 5 리스트 구조)

```
씬1: 금지 선언
씬2~6: 금지 대상 나열 (달걀/유제품/치즈/과일/채소)
씬7~9: 올바른 방법
씬10: CTA
```

**특징:**
- 각 씬이 독립적 (순서 바꿔도 됨)
- 다음 씬 볼 이유 없음
- "TOP 5"라는 숫자가 있지만 실제로 숫자 긴장감 없음
- 이미지 역할: 배경/삽화

### 새: 스토리형 (문제 해결 서사)

```
씬1: 나의 상황/문제 공감
씬2: 흔한 행동 (관객이 하고 있는 것)
씬3: 숨은 원인 공개 (반전)
씬4~6: 해결 방법 (행동 변화)
씬7: 전/후 결과 (보상)
씬8: 예외/주의
씬9: 한 줄 규칙
씬10: CTA + 행동 요약
```

**특징:**
- 씬1 → 씬2 → 씬3: 긴장 고조
- 씬3 반전이 씬4~6 행동 동기 부여
- 씬7 결과가 시청자 만족감 제공
- 이미지 역할: 사건/증거/변화

---

## 4. living_tips 스토리형 10씬 구조

### 씬별 역할 정의

| 씬 | 역할 | 필수 요소 | 다음 씬 연결 고리 |
|----|------|----------|-----------------|
| **1** | 공감형 문제 제기 | "혹시 이런 경험 있으세요?" + 결과 암시 | "원인이 뭔지 궁금" |
| **2** | 흔한 행동 묘사 | 시청자가 지금 하고 있는 행동 | "이게 왜 문제?" |
| **3** | 숨은 원인 공개 | 예상 밖의 원인 (반전) | "그럼 어떻게 해야?" |
| **4** | 첫 번째 해결 행동 | 구체적 오브젝트 + 구체적 행동 | "다음 단계는?" |
| **5** | 두 번째 해결 행동 | 씬4와 다른 오브젝트/상황 | "또 뭐가 있지?" |
| **6** | 세 번째 해결 행동 | 씬4~5 응용 또는 주요 포인트 강조 | "이러면 어떻게 돼?" |
| **7** | 전/후 결과 공개 | "이렇게 하면 X가 달라진다" 비교 | "놓치면 안 되는 게 있다" |
| **8** | 예외/주의사항 | 규칙이 적용 안 되는 경우 또는 추가 실수 | "마지막으로 한 가지" |
| **9** | 한 줄 규칙 | 이 릴스 전체를 한 줄로 요약 | "저장할 가치 있다" |
| **10** | CTA + 행동 요약 | 저장/공유 유도 + 핵심 키워드 2개 이상 | — |

### 핵심 원칙

1. **정보 10개 나열 금지** — 하나의 문제를 끝까지 해결하는 단일 서사
2. **씬3은 반드시 '왜'** — "이게 왜 문제인지" 이유가 나와야 씬4~6이 납득됨
3. **씬7은 반드시 '결과'** — 행동을 바꾸면 뭐가 달라지는지 구체적 보상 제시
4. **씬1은 공감 먼저** — 명령/경고보다 "혹시 이런 상황이세요?" 공감 진입
5. **이미지 = 사건/증거** — 배경 사진이 아닌 스토리의 한 장면

---

## 5. LH-8 소재 리프레임 3안

### Version A: "왜 냉장고에 넣었는데도 빨리 상할까?"

**핵심 서사**: 냉장고를 열심히 쓰는데도 음식이 빨리 상하는 미스터리 → 위치 문제 발견

| 씬 | narration (예시) | caption | 이미지 방향 |
|----|-----------------|---------|------------|
| 1 | "냉장고에 넣었는데 왜 음식이 금방 상할까요? 위치 때문입니다." | 위치가 문제예요 | 상한 식재료 / 냉장고 문 여는 장면 |
| 2 | "대부분 달걀과 우유를 문칸에 넣는데, 사실 거기가 제일 위험한 자리예요." | 문칸이 위험해요 | 문칸에 달걀/우유 가득한 냉장고 |
| 3 | "냉장고 문을 열 때마다 문칸 온도가 크게 흔들립니다. 안쪽 칸은 거의 일정하고요." | 문 열 때마다 | 냉장고 문 열리는 장면 / 결로 |
| 4 | "달걀은 안쪽 칸 아무 데나, 되도록 가장 안쪽이 좋아요." | 달걀은 안쪽으로 | 안쪽 선반에 달걀 |
| 5 | "우유와 요거트도 안쪽 칸에 두면 3~4일 더 오래 갑니다." | 유제품도 안쪽 | 안쪽 선반 우유 |
| 6 | "과일과 채소도 문칸은 피하세요. 특히 딸기는 하루 만에 물러질 수 있어요." | 딸기는 특히 조심 | 물러진 딸기 / 냉장고 칸 |
| 7 | "문칸에서 안쪽으로 옮겼더니 달걀이 기존보다 1주일 더 신선했어요." | 1주일 더 신선 | 정리된 냉장고 안쪽 |
| 8 | "단, 소스류와 잼, 물은 문칸에 두는 게 맞아요. 온도 변화에 덜 민감하거든요." | 소스류는 문칸 OK | 소스/잼 문칸 정리 |
| 9 | "규칙은 간단해요: 신선식품은 안쪽, 소스류는 문칸." | 이 규칙만 기억 | 냉장고 다이어그램 스타일 |
| 10 | "저장해두세요, 신선식품은 안쪽 칸, 소스류만 문칸입니다." | 문칸은 소스류만 | 깔끔하게 정리된 냉장고 |

**TTS 연기 방향**: 1씬 — 가벼운 의문 + 놀람. 3씬 — "이게 이유였구나" 발견 톤. 7씬 — 만족감.

---

### Version B: "엄마가 평생 잘못한 냉장고 습관"

**핵심 서사**: 오래된 습관이 사실은 틀렸다는 반전 + 나도 모르게 따라 한 상황

| 씬 | narration (예시) | caption | 이미지 방향 |
|----|-----------------|---------|------------|
| 1 | "저도 10년 넘게 달걀을 냉장고 문칸에 넣었어요. 엄마한테 배웠거든요." | 나도 몰랐어요 | 문칸에 달걀 넣는 손 |
| 2 | "근데 달걀은 문칸에 넣으면 안 된대요. 문 열 때마다 온도가 흔들리거든요." | 달걀 위치가 문제 | 냉장고 문 여닫히는 장면 |
| 3 | "달걀은 온도 변화에 민감해요. 1~2도 차이에도 신선도가 확 떨어져요." | 1도 차이가 달라요 | 달걀 클로즈업 / 결로 냉장고 |
| 4 | "달걀은 가장 안쪽 칸에, 되도록 문에서 멀수록 좋아요." | 안쪽으로 옮기세요 | 안쪽 선반에 달걀 정리 |
| 5 | "우유도 마찬가지예요. 문칸에서 안쪽으로 옮기면 확실히 더 오래 가요." | 우유도 마찬가지 | 안쪽 선반 우유 |
| 6 | "과일과 생채소도 문칸은 피해주세요." | 과일도 안쪽으로 | 냉장고 안쪽 과일 정리 |
| 7 | "이렇게 자리만 바꿔도 식재료 유통기한이 눈에 띄게 늘어나요." | 자리만 바꿔도 | 정리 전/후 냉장고 비교 |
| 8 | "양파와 감자는 냉장고 밖에 두세요. 둘 다 서늘한 실온이 더 좋아요." | 밖에 두는 게 낫죠 | 양파/감자 실온 보관 |
| 9 | "요약하면: 신선식품은 안쪽, 소스류는 문칸, 양파·감자는 냉장고 밖." | 세 가지만 기억 | 텍스트 스타일 요약 이미지 |
| 10 | "저장해두세요, 달걀·유제품은 안쪽 칸, 소스류만 문칸." | 저장해두세요 | 깔끔히 정리된 냉장고 |

**TTS 연기 방향**: 1씬 — 고백 + 공감 톤 ("저도 몰랐어요"). 3씬 — 설명 + 약간 놀람. 8씬 — 보너스 팁 느낌.

---

### Version C: "3일 만에 달걀 비린내 나는 이유"

**핵심 서사**: 구체적 피해(비린내/신선도 저하) → 원인 추적 → 해결

| 씬 | narration (예시) | caption | 이미지 방향 |
|----|-----------------|---------|------------|
| 1 | "달걀이 3일 만에 비린내 난 적 있으세요? 냉장고 어디에 두는지 확인해보세요." | 비린내 나셨나요 | 냉장고 달걀 문칸 클로즈업 |
| 2 | "냉장고 문칸, 여기가 제일 많이 쓰는 자리인데요. 사실 가장 온도 불안정한 곳이에요." | 여기가 문제예요 | 문칸 가득 찬 냉장고 |
| 3 | "냉장고 문을 하루 10~15번 열면, 문칸 온도는 4~10도를 왔다 갔다 해요." | 하루 10번 흔들림 | 결로 맺힌 냉장고 문 |
| 4 | "달걀은 온도 일정한 안쪽 칸으로 옮기세요. 냄새도 줄고 훨씬 오래 가요." | 달걀 자리 바꾸세요 | 안쪽 선반 달걀 |
| 5 | "우유, 요거트, 치즈도 안쪽 칸이 맞아요. 유통기한이 확실히 달라요." | 유제품도 이동 | 안쪽 선반 유제품 |
| 6 | "딸기, 포도 같은 과일도 문칸에 두면 하루 이틀 만에 물러져요." | 딸기는 하루 만에 | 물러진 딸기 / 과일 |
| 7 | "달걀을 안쪽으로 옮긴 뒤로 비린내가 완전히 없어졌어요. 유통기한도 1~2주 더 길어졌고요." | 1~2주 더 신선 | 신선한 달걀 / 정리된 냉장고 |
| 8 | "대신 소스류, 케첩, 잼은 문칸이 맞아요. 온도 변화에 강하거든요." | 소스류는 문칸 OK | 문칸 소스 정리 |
| 9 | "냉장고 정리 원칙: 신선식품은 안쪽, 소스류는 문칸." | 이 원칙 하나만 | 냉장고 정리된 이미지 |
| 10 | "저장해두세요, 달걀·유제품·과일은 안쪽, 소스류만 문칸입니다." | 지금 당장 바꾸세요 | 깔끔한 냉장고 전체 |

**TTS 연기 방향**: 1씬 — 경험 질문 ("있으세요?"). 3씬 — 놀라운 수치 강조. 7씬 — 확신 + 만족감.

---

## 6. 프롬프트 개선 초안

> ⚠️ `lib/openai.ts` living_tips qualityBar에 추가할 문구 초안.  
> **코드 수정 금지** — 검토 후 별도 atomic task로 적용.

### 6-1. 현재 구조의 문제점 (qualityBar 보완 대상)

현재 qualityBar는 **씬별 품질 검사**는 잘 되어 있으나, **전체 서사 흐름**에 대한 규칙이 없다.

### 6-2. 추가할 규칙 초안 (삽입 위치: SCENE STRUCTURE 섹션 이후)

```
STORY STRUCTURE RULES (anti-listicle — mandatory for living_tips):
Do NOT create a listicle of 5~10 items unless the topic explicitly demands it.
Instead, create a mini problem-solving story with a single throughline:
  - One problem → one cause → one behavior change → one result.
  - The viewer should feel: "I was doing it wrong, now I know the right way."

Each scene must answer: "What changed from the previous scene?"
  ✅ Scene 1 establishes a problem the viewer likely has RIGHT NOW.
  ✅ Scene 2 shows the common behavior (what most people do).
  ✅ Scene 3 reveals the hidden cause — the "aha" moment (MUST be surprising or non-obvious).
  ✅ Scene 7 shows before/after or concrete result — "what changes if you do it right."
  ❌ "Item 1... Item 2... Item 3..." structure — banned unless topic is explicitly a checklist.
  ❌ Same rule repeated with different objects (e.g., "eggs don't go in door" then "milk don't go in door" then "cheese don't go in door").

Scene 1 MUST start with a relatable situation, not a command:
  ✅ "냉장고에 넣었는데 왜 음식이 금방 상할까요?"
  ✅ "저도 10년 넘게 이렇게 했는데, 사실 틀렸더라고요."
  ❌ "문칸에 달걀 넣는 집, 오늘 바로 바꾸세요." — starts with command, no empathy

Scene 3 MUST reveal a hidden cause (not just restate the problem):
  ✅ "냉장고 문을 하루 10~15번 열면 문칸 온도가 4~10도를 왔다 갔다 해요." — specific, surprising
  ❌ "냉장고 문칸은 온도 변화가 심해요." — vague restatement, not surprising

Scene 7 MUST show a concrete result or before/after:
  ✅ "달걀을 안쪽으로 옮긴 뒤로 비린내가 없어졌어요. 유통기한도 1~2주 늘었고요."
  ❌ "냉장고 안쪽 칸에 두면 신선함이 유지돼요." — vague benefit, no comparison

Narration tone — story mode:
  ✅ First person or second person with empathy: "저도 몰랐어요" / "혹시 이런 경험 있으세요?"
  ✅ Specific numbers and timeframes: "3일 만에 비린내" / "1주일 더 신선"
  ❌ Generic instruction: "달걀은 문칸에 넣으면 안 됩니다." — reads like a manual

TOPIC REFRAME rule:
  If the topic sounds like a listicle (e.g., "TOP 5 food items to avoid in door shelf"),
  reframe it as a story angle before generating:
    ❌ "냉장고 문칸 금지 식재료 TOP 5" (listicle)
    ✅ "왜 냉장고에 넣었는데도 빨리 상할까?" (problem story)
    ✅ "달걀이 3일 만에 비린내 나는 이유" (specific problem)
    ✅ "평생 잘못한 냉장고 습관 하나" (relatable habit story)
```

---

## 7. 이미지 전략 개선 초안

### 7-1. 현재 이미지 전략의 문제

현재 imagePrompt는 **오브젝트 중심**이다:
```
"eggs on refrigerator door shelf, studio light, clean minimal background, no text"
```

이미지가 스토리의 **증거/사건**이 아니라 **배경/삽화**처럼 보인다.

### 7-2. 스토리형 이미지 쿼리 전략

각 씬의 역할에 맞는 쿼리 방향:

| 씬 역할 | 쿼리 방향 | Pexels 쿼리 예시 |
|---------|----------|-----------------|
| scene 1 (문제 제기) | **결과 상태** 이미지 (상한 음식, 낭비) | `spoiled eggs refrigerator` / `food waste kitchen` |
| scene 2 (흔한 행동) | **잘못된 위치** 이미지 | `eggs on refrigerator door shelf` / `milk fridge door` |
| scene 3 (숨은 원인) | **온도/냉기 시각화** 이미지 | `refrigerator door condensation` / `cold air fridge` |
| scene 4~6 (해결 행동) | **올바른 위치** 이미지 | `eggs inner refrigerator shelf` / `organized fridge interior` |
| scene 7 (결과) | **정리된 상태 / 신선한 음식** | `fresh organized refrigerator` / `neat fridge shelves` |
| scene 8 (예외/주의) | **예외 오브젝트 정상 위치** | `sauce bottles refrigerator door` / `condiments fridge door` |
| scene 9~10 (요약/CTA) | **정돈된 전체 냉장고** | `clean organized refrigerator interior` |

### 7-3. 사람 노출 리스크 관리 (Pexels)

| 위험 쿼리 | 대체 쿼리 |
|-----------|----------|
| `frustrated person opening fridge` | `messy disorganized refrigerator interior` |
| `woman putting milk in fridge` | `milk bottle refrigerator door shelf` |
| `person checking fridge` | `open refrigerator with food visible` |
| `family kitchen refrigerator` | `organized kitchen refrigerator close up` |

**원칙**: 항상 오브젝트 중심 + 사람 없음 유지. 단, 손/팔 부분 노출은 minor 허용.

### 7-4. "문제 제기" 이미지가 없는 경우 fallback

stock photo는 기본적으로 긍정/중립 이미지라 "상한 음식"을 찾기 어려울 수 있다.  
Fallback 전략:
- 문제 직접 표시 불가 → "불안정한 위치"를 보여주는 이미지로 대체
  - `eggs on open refrigerator door` (문칸 달걀 = 잘못된 위치 암시)
- 극단적 사건 대신 **"대비 이미지"** 활용
  - scene 3 원인: `refrigerator door condensation glass` (결로 = 온도 변화 시각화)

---

## 8. 다음 Atomic Task 제안

### 우선순위 1 — 스토리형 프롬프트 적용 (즉시 가능)
```
Atomic Task: living_tips qualityBar에 스토리 구조 규칙 추가
- lib/openai.ts SCENE STRUCTURE 섹션 이후에 STORY STRUCTURE RULES 블록 삽입
- 6-2 초안 그대로 적용
- 코드 1곳만 수정 (qualityBar 블록)
- pnpm build 검증
```

### 우선순위 2 — LH-8 스토리형 리프레임 generate
```
Atomic Task: LH-8 소재 스토리형 Version A 재생성
- custom topic: "왜 냉장고에 넣었는데도 빨리 상할까?"
- ALLOW_OPENAI_GENERATE=true 승인 필요
- 결과물: score 95+ + story structure 준수 여부 QA
```

### 우선순위 3 — TTS 첫 3초 개선 테스트
```
Atomic Task: Scene 1 narration 개선 A/B 테스트
- Version A: 공감형 진입 ("저도 이랬어요" 패턴)
- Version B: 질문형 진입 ("혹시 이런 경험 있으세요?" 패턴)
- narration.mp3만 재생성 (ALLOW_OPENAI_TTS=true 필요)
- 5초 클립으로 청취 비교
```

---

## 9. 참조 파일

| 파일 | 설명 |
|------|------|
| `docs/living-tips-hook-strategy.md` | 6가지 hook 패턴 + 고후킹 소재 30개 |
| `docs/living-tips-free-silent-pipeline.md` | 무료 무음 샘플 파이프라인 운영 절차 |
| `docs/living-tips-qa-strategy.md` | LH-1~LH-8 QA 히스토리 |
| `lib/openai.ts` lines 278-386 | living_tips qualityBar 현재 버전 |
| `output/v2/paid_qa/lh8_silent_render_fixed/qa_summary.json` | LH-8 최종 무음 QA 결과 |
