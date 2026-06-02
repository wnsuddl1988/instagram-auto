# Living Tips Human QA Rubric
## 사람이 체감하는 품질 기준 — Visual Relevance + Caption Hook

> 작성일: 2026-05-24  
> 배경: QA-LH-9 accept_silent_sample 판단 → 사용자 체감 품질 실패  
> 목적: 렌더 전 필수 통과 기준 강화

---

## 1. LH-9 Accept 판단 실패 원인 분석

### 1-1. 자동 QA가 틀린 이유

| 자동 QA 판단 | 실제 체감 실패 이유 |
|---|---|
| scene 4 minor — "마트 진열대, blocking 아님" | 냉장고 문칸 팁 영상에 마트 쇼핑 이미지는 장소 이탈. 시청자가 "이게 내 냉장고 얘기?"로 못 느낌 |
| scene 5 minor — "scene 2 중복, deferred" | 두 씬의 역할이 다름 (문제 씬 vs 해결 씬). 같은 이미지가 나오면 "앞에 나왔던 거잖아" 몰입 붕괴 |
| scene 8 minor — "맥주 냉장고 어색하지만 blocking 아님" | '규칙은 간단해요' 타이틀 아래 맥주/콜라 이미지 = 술 콘텐츠 느낌. 신뢰감 저하 |
| scene 10 pass — "소스 디스펜서 허용 가능" | 카페 시럽 병은 내 냉장고 문칸이 아님. '오늘 문칸부터 비우세요' CTA와 연결 안 됨 |
| topTitle "문칸에 뭘 넣어야 할까요?" visible | 질문형이지만 caption이 그것과 시너지 없이 단순 설명형으로 흘러 훅 효과 없음 |

### 1-2. 핵심 문제: 자동 QA는 "카테고리 근접성"만 봄

자동 QA는 "이 씬에 냉장고가 있는가?"만 체크한다.  
사람이 체감하는 기준은 다르다: **"이 이미지가 이 자막을 보조하는가?"**

- scene 4: 냉장고 있음 ✅ → 자동 pass  
  실제: 마트 진열대 + "열 때마다 달라져요" = 연결 안 됨
- scene 8: 냉장고 있음 ✅ → 자동 pass  
  실제: 맥주 가득 + "규칙은 간단해요" = 신뢰 저하
- scene 10: 소스 병 있음 ✅ → 자동 pass  
  실제: 카페 시럽 병 + "오늘 문칸부터 비우세요" = 공간감 불일치

### 1-3. Caption hook 부재

LH-9 caption은 "스토리 문법에 맞게 보정"됐지만, 모두 평서문 설명이다.

| scene | caption | 문제 |
|---|---|---|
| 3 | "문칸은 온도가 흔들려요" | 팩트 설명. 긴장감 없음 |
| 4 | "열 때마다 달라져요" | 무엇이? 모호. 단독으로 궁금하지 않음 |
| 5 | "안쪽 칸에 두기" | 명사절 끊김. CTA처럼 들리나 씬 역할은 해결책 |
| 8 | "규칙은 간단해요" | 단순 예고. 이게 왜 중요한지 전달 없음 |
| 9 | "신선식품은 안쪽 칸" | 결론만 있음. "왜, 얼마나"가 없음 |

**패턴**: 설명이 되려면 최소 이유/결과/수치/반전 중 하나가 있어야 후킹이 된다.

---

## 2. Visual Relevance QA 강화 기준

### 2-1. Scene-role별 이미지 요구 기준

| Scene Role | 요구 기준 | Fail 조건 |
|---|---|---|
| **problem_evidence** (scene 1) | 시청자가 경험한 실패 상황을 직접 보여줌 (상한 음식, 버려진 식재료 등) | 음식 없는 빈 냉장고, 쇼핑 장면, 인물 표정만 있음 |
| **wrong_placement** (scene 2) | 문칸에 둬서는 안 되는 음식이 실제로 문칸에 있음 | 냉장고 내부 선반 전체뷰 (문칸 구분 안 됨), 마트 진열대 |
| **hidden_cause** (scene 3~4) | 온도 변화, 열림/닫힘 반복을 시각화 (결로, 온도계, 문 열린 단면 등) | 잠긴 냉장고 외관, 마트 진열대, 관계없는 장소 |
| **correct_action** (scene 5~6) | 달걀/유제품이 내부 선반 안쪽에 있음 | scene 2와 동일 이미지, 마트 이미지, 문칸 이미지 |
| **result** (scene 6~7) | 신선도 유지 결과를 암시하는 이미지 (깔끔한 식재료, 날짜 레이블 등) | 가공식품, 상업용 이미지 |
| **rule_summary** (scene 7~9) | 문칸에 소스/음료 vs 안쪽에 달걀/채소 구분 보여줌 | 잡동사니 냉장고, 맥주/콜라 가득한 냉장고, 다른 장소 |
| **action_CTA** (scene 10) | 지금 당장 할 수 있는 행동 (손이 냉장고에 닿는 느낌, 문칸 소스 정렬 이미지 등) | 카페 시럽병, 상업용 소스 디스펜서, 장식용 병 |

### 2-2. Stock Image Fail 조건 (절대 기준)

다음 중 하나에 해당하면 **자동 fail** — minor 아님:

1. **장소 이탈**: 마트/식당/카페/산업 환경 이미지 (가정 공간 아님)
2. **역할 이탈**: 씬 role과 다른 행동 (쇼핑 중, 조리 중, 인물 클로즈업)
3. **오브젝트 이탈**: 맥주/주류, 셔츠/의류, 기술 장비, 꽃/식물 (식품 맥락 이탈)
4. **중복 이미지**: 다른 역할의 scene에 동일 이미지 사용 → 두 씬 모두 fail
5. **핵심 오브젝트 없음**: narration의 핵심 명사가 이미지에 없음

### 2-3. Stock Image Pass 최소 조건

- narration/caption 핵심 명사 최소 1개가 이미지에 직접 등장해야 함
- 배경/맥락이 "가정 공간" 이어야 함
- 씬 역할과 이미지 행동/상태가 일치해야 함

---

## 3. Caption Hook QA 강화 기준

### 3-1. Scene 유형별 caption 요구 패턴

| Scene 유형 | 요구 패턴 | 금지 패턴 |
|---|---|---|
| **scene 1 (문제 제기)** | 질문형 / 손실 강조 / 반전 | 단순 팩트 설명 |
| **scene 2~3 (행동/원인)** | 금지형 / 반전 / 긴장감 강조 | 평서문 나열 |
| **scene 4~5 (숨은 원인)** | 구체적 수치 / 비교 / 놀라움 | 모호한 일반화 |
| **scene 6~7 (해결책)** | 행동 지시형 / 결과 예고 | 명사절 끊김, 선언만 |
| **scene 8~9 (규칙/결과)** | 구체적 효과 수치 / "이것만은" 한 줄 규칙 | "간단해요" 단독, 막연한 요약 |
| **scene 10 (CTA)** | 오늘 할 행동 명시 / 구체적 목표 | "저장해두세요" 단독, "팁입니다" |

### 3-2. Caption Hook 요소 분류

4가지 요소 중 최소 1개가 있어야 hook 인정:

| Hook 요소 | 설명 | 예시 |
|---|---|---|
| **curiosity** | 시청자가 모르던 사실 / 의외성 | "냉장고에 넣었는데 왜?" / "이 위치가 범인" |
| **specificity** | 구체적 수치/시간/비율 | "1주일 더 신선", "하루 10번 열리면", "4도 상승" |
| **tension** | 손실/위험/금지 | "문칸에 두면 손해", "여기가 가장 위험" |
| **actionability** | 지금 바로 할 수 있는 행동 | "오늘 문칸 달걀 꺼내세요", "지금 확인해보세요" |

### 3-3. LH-9 Caption 재평가

| scene | 현재 caption | Hook 요소 | 판정 |
|---|---|---|---|
| 1 | "넣었는데 왜 상할까?" | curiosity ✅ | pass |
| 2 | "문칸에 두고 있나요?" | curiosity (약함) | pass (경계) |
| 3 | "문칸은 온도가 흔들려요" | 없음 | **fail** |
| 4 | "열 때마다 달라져요" | 없음 (모호) | **fail** |
| 5 | "안쪽 칸에 두기" | 없음 | **fail** |
| 6 | "1주일 더 늘어남" | specificity ✅ | pass |
| 7 | "소스류는 문칸" | 없음 | fail (경계) |
| 8 | "규칙은 간단해요" | 없음 | **fail** |
| 9 | "신선식품은 안쪽 칸" | 없음 | fail (경계) |
| 10 | "오늘 문칸부터 비우세요" | actionability ✅ | pass |

**결론**: 10씬 중 4씬만 hook 기준 통과. 이 기준이면 LH-9는 reject이었어야 함.

### 3-4. Caption 재작성 방향

| 현재 | 권장 방향 | Hook 유형 |
|---|---|---|
| "문칸은 온도가 흔들려요" | "문칸이 가장 위험한 자리예요" | tension |
| "열 때마다 달라져요" | "열 때마다 4도씩 흔들려요" | specificity |
| "안쪽 칸에 두기" | "달걀은 여기 두세요" | actionability |
| "규칙은 간단해요" | "이것만 기억하세요" | curiosity |
| "신선식품은 안쪽 칸" | "안쪽 칸이 1주일을 만들어요" | specificity |

---

## 4. Story Flow QA 기준

### 4-1. 10씬 Story Role 맵

| Scene | Role | 체크 기준 |
|---|---|---|
| 1 | problem_evidence | 시청자가 공감할 실패 상황 (쏟아짐/상함) |
| 2 | wrong_common_action | "나도 이렇게 했는데" 공감 유발 |
| 3 | hidden_cause_intro | 숨은 원인 처음 제시 |
| 4 | hidden_cause_detail | 구체적 수치/메커니즘 |
| 5 | correct_action | 올바른 행동 직접 제시 |
| 6 | result | 결과/효과 수치 |
| 7 | rule_a | 1번 규칙 (소스/음료 → 문칸 OK) |
| 8 | rule_b | 2번 규칙 또는 근거 보강 |
| 9 | summary_rule | 핵심 규칙 한 줄 요약 |
| 10 | action_CTA | 오늘 당장 할 행동 |

### 4-2. Story Flow Fail 조건

- scene 1이 강렬한 문제 제기가 아닌 팁 나열로 시작
- scene 3~4가 원인 없이 해결책으로 점프
- scene 8~9가 앞에서 한 말을 반복 (role 중복)
- scene 10이 "저장하세요" 단독 또는 "팁입니다" 류 이탈

---

## 5. 재생성/재렌더 전 필수 체크리스트

### Pre-render Checklist (8항목)

```
[ ] 1. 각 scene 이미지가 해당 scene role에 맞는가?
[ ] 2. 중복 이미지 0건인가?
[ ] 3. 마트/산업/상업 공간 이미지 0건인가?
[ ] 4. 주류/의류/관계없는 오브젝트 이미지 0건인가?
[ ] 5. scene 1~4 caption에 hook 요소(curiosity/specificity/tension) 최소 1개 있는가?
[ ] 6. scene 10 caption에 actionability가 있는가?
[ ] 7. scene 4와 scene 9가 이미지+narration 역할이 서로 다른가?
[ ] 8. topTitle이 전 씬에 걸쳐 표시되며 caption과 시너지를 이루는가?
```

모든 항목이 ✅여야 **렌더 승인**.

---

## 6. 다음 Atomic Task 제안

### 옵션 A (권장) — Caption rewrite (hook 강화)
- 목표: LH-9 fixed plan의 caption을 hook 기준으로 재작성
- 비용: 무료 (코드/문서만, OpenAI generate 아님)
- 파일: `_rewrite-lh9-captions.mjs` 또는 직접 JSON 수정
- 결과: `gpt4o_mini_life_hacks_qa_lh9_plan_story_fixed_v2.json`

### 옵션 B — Scene-role 기반 Pexels query 재생성
- 목표: scene role 맵 기반으로 query를 재설계
- 비용: Pexels API 최대 10회
- 대상: scene 4/5/8/10 (마트/중복/맥주/카페 이미지 전부 교체)
- 결과: `lh9_pexels_stock_images_v2/`

### 옵션 C — Caption + Image 동시 수정 후 재렌더
- A + B 완료 후 새 render_plan_v2 생성 → 무음 렌더
- 비용: Pexels 10회 이하 + Python 렌더 (외부 API 없음)

### 옵션 D — 다음 소주제 신규 생성 (LH-10)
- LH-9를 폐기하지 않고 보류하고 새 소주제로 이동
- 새 소주제에서 처음부터 hook 기준 적용

**권장 순서**: A → B → C (caption fix 먼저, image fix 다음, 재렌더 마지막)

---

## 7. 자동 QA 개선 방향 (기술 노트)

현재 `qa_summary.json`은 다음 기준을 추가해야 한다:

```json
{
  "visualRelevance": {
    "exact_object_match": "pass | fail",
    "scene_role_match": "pass | fail",
    "no_wrong_context": "pass | fail",
    "no_duplicate_role_image": "pass | fail"
  },
  "captionHook": {
    "hook_type": "curiosity | specificity | tension | actionability | none",
    "hook_present": true,
    "hook_strength": "strong | weak | none"
  }
}
```

`hook_present: false` 씬이 4개 이상이면 → 전체 plan 상태를 `review_required`로 격상.  
`scene_role_match: fail` 씬이 2개 이상이면 → `reject` (현재 blocking 기준에 추가).

---

> **요약**: LH-9 accept 판단 실패는 자동 QA가 "카테고리 근접성"만 보고 "역할 일치"와 "hook 존재"를 보지 않았기 때문이다. 다음 렌더 전에 위 Pre-render Checklist 8항목을 모두 통과해야 한다.
