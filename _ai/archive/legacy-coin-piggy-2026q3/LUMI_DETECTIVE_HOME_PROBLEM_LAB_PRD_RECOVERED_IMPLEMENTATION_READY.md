# 생활꿀팁 루미탐정 / HOME_PROBLEM_LAB
## 복원 PRD — Claude Code 단독 구현용 A~Z 완성본

> 문서 상태: **RECOVERED + IMPLEMENTATION-READY**  
> 프로젝트 ID: `home_problem_lab`  
> 브랜드 원형: **집안문제연구소**  
> 캐릭터: **살림탐정 루미 / Mini House Lumi**  
> 핵심 철학: **사기 전에 원인부터.**  
> 구현 담당: **Claude Code 단독 Main AI / Sole Writer**  
> Control Tower: ChatGPT  
> 권장 구현 방식: 기존 저장소 분석 후 **대규모 재작성 금지, 현재 구조를 보존한 점진 구현**

---

# 0. 문서 복원 원칙

이 문서는 초기 원본 `codex_home_problem_lab_project_brief.md`를 주된 Source of Truth로 복원한 뒤, 후속 `codex_home_problem_lab_project_brief_v3_single_ai.md`에 추가된 ElevenLabs/TTS/단일-AI 구현 세부사항과 현재 프로젝트에서 검증된 제품 원칙을 합쳐 **Claude Code가 이 문서 하나만으로 프로그램을 처음부터 끝까지 구현할 수 있도록 보강한 실행형 PRD**다.

## 0.1 원본에서 그대로 유지하는 핵심

- `engine_id = home_problem_lab`
- 브랜드 원형: `집안문제연구소`
- 캐릭터: `살림탐정 루미`
- 문제 해결 우선, 상품 추천 후순위
- `사기 전에 원인부터.`
- 청소·냄새·수납 / 주방·식비·시간 절약의 2대 콘텐츠 축
- 0원 해결법 우선
- 제품은 필요한 사람에게만 연결
- 제휴/쇼핑/공동구매/셀러협업/자체상품으로 확장 가능한 수익화 구조
- AI 장면 + 루미 + 그래픽 + 실제 제품 카드의 하이브리드 영상
- 허위 내돈내산/가짜 사용후기/과장 효능 금지
- 품질검수와 법적·신뢰 체크를 통과한 영상만 게시

## 0.2 구현 완성도를 위해 보강하는 원칙

아래는 초기 문서의 철학을 유지하면서 실제 프로그램 구현을 위해 추가한 명세다.

1. **5단계 이내의 단순 제작 UX**
2. Golden Sample을 통한 품질 기준 고정
3. `visualType-first`가 아니라 **scene-intent-first** 장면 설계
4. 실제 생성 결과의 브라우저 미리보기
5. 장면 수정과 전체 재생성의 정직한 구분
6. 증거 없는 원인/수치/건강·안전 주장의 자동 생성 금지
7. 내부 실행·보안·lineage 용어를 기본 사용자 UI에서 숨김
8. 제품/이미지/음성/자막/렌더 결과를 동일 run identity로 추적
9. Claude Code 단독 구현 및 검수
10. 실제 게시/업로드는 Owner 명시 승인 전 기본 금지

## 0.3 역사적 차이 처리

초기 원본의 루미는 2.5D 인간형 생활탐정 콘셉트로 기술되었으나, 현재 프로젝트에서는 **Mini House Lumi** 캐릭터가 실제 제작 자산으로 확정되었다. 따라서 이 복원본은 역할·말투·브랜드 철학은 초기 PRD를 유지하되, 시각 캐릭터의 canonical identity는 **Mini House Lumi**를 사용한다.

또한 초기 원본의 `원인 3개 고정`은 콘텐츠 작법 가이드로 유지하되, 실제 구현에서는 근거가 부족한 원인을 억지로 세 개 만들지 않는다. **검증 가능한 원인이 1~2개면 그대로 사용**하고, 정확성보다 형식을 우선하지 않는다.

---

# 1. 제품 한 줄 정의

**생활꿀팁 루미탐정은 AI 캐릭터 루미가 가정에서 반복되는 청소·냄새·수납·주방·식비·시간 문제를 사건처럼 진단하고, 먼저 돈 들이지 않는 해결법을 제시한 뒤 필요한 경우에만 제품 선택 기준과 구매 경로를 연결하는 쇼츠 자동 제작·검수·배포 시스템이다.**

---

# 2. 문제 정의

생활정보 숏폼 시장에는 다음 문제가 반복된다.

- 제품 추천부터 시작해 광고처럼 보인다.
- 원인보다 “무엇을 사라”에 집중한다.
- 같은 상품을 모든 집에 필요하다고 과장한다.
- AI 영상이 실제 생활 문제와 맞지 않는 장면을 생성한다.
- 콘텐츠 제작자가 대본·이미지·음성·자막·렌더·업로드를 여러 도구에서 수동 처리한다.
- 생성형 AI가 수치, 구조, 세제, 건강·위생 정보를 틀리게 말할 수 있다.
- 영상은 만들었지만 어떤 장면이 좋은지/왜 실패했는지 기록되지 않는다.

`home_problem_lab`은 이를 다음 순서로 해결한다.

```text
문제 발견
→ 원인 후보 검증
→ 먼저 해볼 저비용/0원 행동
→ 필요한 경우 제품 선택 기준
→ 실제 영상 제작
→ 품질/신뢰 검수
→ 결과 미리보기
→ 게시 승인
→ 성과 데이터 회수
→ 다음 콘텐츠 개선
```

---

# 3. 제품 목표와 비목표

## 3.1 최우선 목표

1. 주제 하나를 입력하면 게시 가능한 쇼츠 패키지를 만든다.
2. 사용자가 복잡한 내부 단계를 몰라도 된다.
3. Golden Sample 수준의 장면 품질을 반복 가능하게 만든다.
4. 루미의 캐릭터·목소리·시각 스타일을 지속적으로 유지한다.
5. 근거 부족 콘텐츠와 위험 콘텐츠는 게시 전에 차단한다.
6. 상품 수익화는 콘텐츠 신뢰를 해치지 않는 범위에서 연결한다.
7. 동일 엔진으로 YouTube Shorts / Instagram Reels용 산출물을 만든다.

## 3.2 비목표

- 무조건 상품을 판매하는 쇼핑 채널
- 모든 문제에 제품을 추천하는 시스템
- 가짜 전후 이미지로 실제 효능을 주장하는 시스템
- 사용자가 수십 개의 내부 버튼을 직접 누르는 개발자용 콘솔
- AI가 실제 제품을 사용한 척하는 후기 시스템
- 의료 진단/전문가 처방 대체
- 위험한 전기·가스·화학·구조 수리를 무책임하게 안내하는 시스템

---

# 4. 성공 기준

## 4.1 제품 성공 기준

- 기본 제작 흐름: **5단계 이하**
- 기본 화면 핵심 CTA: 5개 이하를 목표
- 하나의 Golden Sample을 처음부터 끝까지 동일 UI에서 제작 가능
- 같은 run의 최종 MP4가 결과 화면에서 재생 가능
- synthetic placeholder가 real run에 섞이지 않음
- 원본 narration과 실제 TTS·caption이 일치
- 영상별 품질점수와 신뢰점수 보존
- 업로드 승인 전 자동 게시 없음

## 4.2 콘텐츠 성공 기준

- 첫 2초 안에 문제 이해 가능
- 시청자가 “왜 이런 문제가 생기는지” 이해 가능
- 최소 하나의 즉시 실행 가능한 행동 제공
- 상품이 없어도 콘텐츠 자체 가치가 존재
- 장면과 narration이 일치
- 각 장면이 한 작품처럼 연결
- 오디오와 자막이 모바일에서 명료

## 4.3 수익화 성공 기준

- 제품 링크가 없는 영상도 충분히 제작 가능
- 제품이 필요할 때만 affiliate/product card 사용
- disclosure 누락 콘텐츠 게시 차단
- 문제별 랜딩페이지와 상품 기준을 연결 가능
- 향후 공동구매/셀러협업/자체상품으로 확장 가능

---

# 5. 대상 사용자

## 5.1 프로그램 사용자

초기 운영자는 Owner 1인이다.

Owner는 비개발자여도 다음만 이해하면 된다.

```text
주제
대본
장면
만들기
결과
```

내부 개념인 prepared run, digest, lineage, registry, provider dispatch, render plan ID 등은 기본 UI에 노출하지 않는다.

## 5.2 콘텐츠 시청자

대상은 자취생으로 제한하지 않는다.

- 1인가구
- 신혼부부
- 맞벌이 가정
- 아이 있는 집
- 반려동물 가정
- 부모님 집
- 아파트/빌라/원룸/주택

단, 한 영상은 하나의 구체적 문제만 다룬다.

---

# 6. 브랜드

## 6.1 브랜드 이름

- 프로젝트/엔진: `home_problem_lab`
- 원형 채널명: `집안문제연구소`
- 외부 시리즈/브랜드 활용명: `생활꿀팁 루미탐정`
- 캐릭터: `루미`

## 6.2 슬로건

**사기 전에 원인부터.**

보조 문구:

- 문제 있어? 루미가 같이 찾아볼게.
- 제품은 마지막입니다.
- 먼저 집에 있는 걸로 해결하세요.
- 이 집에는 필요하지만, 저 집에는 필요 없습니다.

## 6.3 브랜드 톤

- 소비자 편
- 단호하지만 친절
- 과장 없는 정보형
- 문제 해결 중심
- 광고 냄새 최소화
- 모르면 모른다고 말함
- “사지 않아도 된다”를 말할 수 있음

## 6.4 금지 톤

- 무조건 사세요
- 인생템
- 이거 하나면 끝
- 100% 해결
- 완전 제거
- 가짜 내돈내산
- 가짜 사용 후기
- 검증 안 된 건강·위생 효능 확정 표현

---

# 7. Mini House Lumi 캐릭터 규격

## 7.1 역할

루미는 실제 인간인 척하는 인플루언서가 아니다.

```text
AI 생활탐정
집안 문제 연구원
소비자 편 진단자
설명자
판정자
```

## 7.2 캐릭터 성격

- 똑똑함
- 차분함
- 친근함
- 약간의 위트
- 소비자 편
- 불필요한 구매를 막음
- 문제의 원인을 먼저 찾음
- 마지막에 짧은 판정을 내림

## 7.3 시각 identity

현재 canonical은 **Mini House Lumi**다.

필수 불변 요소는 프로젝트의 canonical character reference asset으로 관리한다.

- 집 모양 캐릭터
- teal 계열 지붕/포인트
- cream/ivory 계열 본체
- 큰 친근한 눈
- 장갑형 손
- 둥근 신발
- 생활 문제 해결사/연구원 느낌
- magnifying glass/포인터/체크보드 등은 장면 필요 시 사용

캐릭터 identity를 매 영상마다 재해석하지 않는다.

## 7.4 motion policy

루미 motion은 **장면을 이해시키는 데 도움이 될 때만 사용**한다.

금지:

- “영상마다 루미를 일정 비율 넣어야 한다”는 quota
- 설명해야 할 실제 구조 대신 generic gesture motion 사용
- 장면 내용보다 캐릭터 노출 비율 우선

---

# 8. 콘텐츠 축

## 8.1 Axis 1 — 청소·냄새·수납

- 욕실 냄새
- 주방 냄새
- 신발장/옷장 냄새
- 수건/세탁 냄새
- 배수구
- 물때
- 곰팡이/습기
- 먼지
- 창틀/욕실/싱크대 청소
- 서랍/팬트리/현관/옷장/계절용품 수납

ID:

`axis_1_clean_odor_storage`

## 8.2 Axis 2 — 주방·식비·시간

- 냉장고/냉동실 정리
- 식재료/반찬/고기/채소 보관
- 양념 정리
- 설거지 시간 단축
- 조리 동선
- 음식물 쓰레기 냄새
- 중복 장보기 방지
- 식비 절약
- 도시락/아침 준비
- 조리도구 수납

ID:

`axis_2_kitchen_food_time`

---

# 9. 콘텐츠 시리즈

## 9.1 루미의 집안사건파일

문제 중심 브랜딩.

```text
문제
→ 원인 후보
→ 확인 순서
→ 해결 행동
→ 다음 사건
```

## 9.2 사기 전에 원인부터

구매 전 진단형.

```text
사고 싶은 제품
→ 왜 먼저 사면 실패할 수 있는지
→ 원인 확인
→ 무료 해결
→ 그래도 필요한 경우 선택 기준
```

## 9.3 살만템 vs 패스템

제품 비교형.

```text
제품군
→ 실패 구조
→ 좋은 구조
→ 맞는 집/안 맞는 집
→ 조건부 추천
```

## 9.4 0원 해결 먼저

신뢰/저장형.

제품을 사기 전에 할 수 있는 순서를 보여준다.

## 9.5 우리집 댓글 처방

댓글 기반 문제 해결.

## 9.6 리뷰 구조 분석

사용 후기 “감상”이 아니라 반복되는 구조적 장단점만 정리한다.

---

# 10. 콘텐츠 비율

초기 운영 권장:

- 문제 해결형 45%
- 원인 진단형 20%
- 살만/패스 20%
- 리뷰·비교 10%
- 특가/공구 5%

**제품 연결 영상은 35% 안팎을 상한 가이드로 삼고, 반드시 채울 필요는 없다.**

---

# 11. 핵심 사용자 UX — 최대 5단계

기본 Workspace는 다음 5단계로 고정한다.

## STEP 1. 주제 / 문제

입력 방식:

- 직접 주제 입력
- 자동 후보 선택
- 과거 성과 기반 추천
- 댓글에서 문제 가져오기

기본 필드:

- topic
- problem
- axis
- target_home_type
- series_type

## STEP 2. 대본 + 장면

한 화면에서:

- narration 전체 확인
- scene 카드 확인
- source/fact 경고 확인
- 각 장면 visual intent 확인
- 필요한 경우 수정

## STEP 3. 만들기

Primary CTA:

**전체 영상 생성**

Secondary CTA:

**이미지 미리보기**

## STEP 4. 필요한 승인

실제 유료 provider 호출/업로드가 필요한 경우만 Owner 승인.

내부 prepare/bind/digest UI는 기본 화면에서 숨긴다.

## STEP 5. 결과

- final MP4 preview
- scene별 visual preview
- narration/audio status
- caption status
- 전체 결과 상태
- `장면 수정`
- `전체 영상 다시 만들기`
- publish package

실제 scene-level regeneration backend가 구현되기 전에는 “이 장면만 재생성”이라고 표시하지 않는다.

---

# 12. End-to-End 파이프라인

```text
Topic/Problem
→ Evidence / Research
→ Script
→ Scene Intent / Storyboard
→ Visual Plan
→ Image/Lumi/Product Assets
→ Owner Review
→ TTS
→ Observed Audio Timing
→ Narration-derived Captions
→ FFmpeg Render
→ Result Preview
→ Quality Gate
→ Publish Package
→ Owner Publish Approval
→ Upload
→ Analytics
```

---

# 13. 프로젝트 / 작업공간 기능

## FR-PROJECT-001 프로젝트 생성

새 콘텐츠 제작 건을 생성한다.

필수:

- id
- title
- createdAt
- status
- revision
- engineId=`home_problem_lab`

## FR-PROJECT-002 autosave

사용자 입력은 브라우저/로컬 저장소에 자동 보존한다.

## FR-PROJECT-003 revision

대본/scene/visual direction 변경 시 revision 증가.

## FR-PROJECT-004 duplicate

기존 프로젝트를 복제해 새 사건으로 재사용 가능.

## FR-PROJECT-005 stale project protection

Golden Sample run이나 production run에서는 **명시적으로 승인된 최신 revision만 사용**한다.

---

# 14. Topic Engine

## 14.1 입력

- axis
- series type
- season
- target household
- recent content history
- recent performance
- optional keyword

## 14.2 출력

```json
{
  "topicId": "",
  "axis": "",
  "seriesType": "",
  "problem": "",
  "targetHomeType": "",
  "hookType": "",
  "hookText": "",
  "whyNow": "",
  "riskFlags": [],
  "monetizationPotential": "none|low|medium|high"
}
```

## 14.3 중복 방지

최근 N개 주제와 semantic similarity가 지나치게 높으면 후보에서 제외.

## 14.4 주제 금지

- 전문 수리자 없이 따라 하면 위험한 전기/가스 작업
- 독성 화학물질 조합
- 의료 진단
- 근거 없는 살균/소독 보장
- 실제 사고 위험이 큰 DIY

---

# 15. Evidence / Research Layer

초기 원본은 강한 source-first 구조를 명시하지 않았지만, 실제 반복 생산을 위해 최소 증거 레이어를 둔다.

## 15.1 Evidence Card

```ts
interface EvidenceCard {
  id: string;
  claim: string;
  sourceType: 'official' | 'manufacturer' | 'academic' | 'reputable_guide' | 'manual_owner';
  sourceUrl?: string;
  sourceTitle?: string;
  retrievedAt?: string;
  confidence: 'high' | 'medium' | 'low';
  allowedClaim: string;
  prohibitedOverclaim?: string;
}
```

## 15.2 원칙

- 사실 주장과 창작 문장을 분리
- 건강/화학/전기/가스는 높은 신뢰도 요구
- 제품 판매 문구는 상세페이지/공식 정보와 구분
- “가능하다/원인일 수 있다”와 “원인이다” 구분
- 고정 수치가 근거 없으면 사용 금지

## 15.3 사실 검수 실패

Fact risk가 high이면 production generation 금지.

---

# 16. Script Engine

## 16.1 기본 구조

```text
Hook
Problem
Possible Cause(s)
Zero-cost / low-cost first action
Optional product criteria
Verdict
CTA
```

## 16.2 원인 개수

- 권장: 1~3개
- 근거가 있는 만큼만 사용
- 세 개를 채우기 위해 가짜 원인 생성 금지

## 16.3 제품 등장

기본적으로 문제/원인/0원 해결 뒤.

제품이 필요 없는 콘텐츠라면 제품 섹션 자체를 생략.

## 16.4 금지 문구

- 무조건
- 100%
- 완전 제거
- 이거 하나면 끝
- 제가 써봤는데요 (실사용 근거 없을 때)
- 내돈내산 (실제 구매 근거 없을 때)

## 16.5 script output

```ts
interface ScriptPackage {
  id: string;
  topicId: string;
  hook: string;
  narration: string;
  claims: string[];
  causes: string[];
  zeroCostActions: string[];
  productCriteria: string[];
  verdict?: string;
  cta: string;
  disclosureText?: string;
  estimatedDurationMs: number;
  ownerApproved: boolean;
}
```

---

# 17. Scene-Intent-First Storyboard

**가장 중요한 구현 원칙 중 하나.**

scene type을 먼저 고르고 내용을 억지로 맞추지 않는다.

각 장면은 먼저 다음 질문에 답해야 한다.

```text
이 장면에서 시청자가 무엇을 이해해야 하는가?
그 이해를 위해 화면에 반드시 무엇이 보여야 하는가?
무엇이 나오면 오해하는가?
앞 장면과 어떻게 이어지는가?
```

## 17.1 Scene contract

```ts
interface SceneCard {
  sceneId: string;
  ordinal: number;
  scenePurpose: string;
  viewerMustUnderstand: string;
  narration: string;
  visualSubject: string;
  requiredObjects: string[];
  forbiddenObjects: string[];
  composition: string;
  continuityFromPreviousScene?: string;
  visualPrompt?: string;
  visualSource: 'AI_IMAGE' | 'LUMI_EXISTING' | 'GRAPHIC' | 'REAL_PRODUCT_CARD';
  regenerationCriteria: string[];
  estimatedDurationWeight: number;
}
```

## 17.2 visual source 선택 규칙

### AI_IMAGE

실제 문제 상황, 구조 설명, 행동 설명이 필요한 경우.

### LUMI_EXISTING

캐릭터가 설명/판정/브랜드 전환을 담당하는 것이 장면 의미에 도움이 되는 경우만.

### GRAPHIC

숫자/순서/체크리스트처럼 그래픽이 가장 정확한 경우.

### REAL_PRODUCT_CARD

실제 구매 제품을 보여줘야 하는 경우만.

## 17.3 금지

- quota 맞추기 위해 Lumi 강제
- synthetic placeholder를 real content로 사용
- generic graph가 실제 구조 설명을 대신
- visual prompt와 narration이 다른 내용

---

# 18. Golden Sample

개발의 기준작은 단순 테스트 fixture가 아니라 **제품 품질의 Source of Truth**다.

## 18.1 Golden Sample 주제

`방향제를 뿌려도 욕실 배수구 냄새가 나는 이유`

## 18.2 권장 4씬

### Scene 1 — Problem Hook

- 욕실
- 냄새 문제
- 방향제가 근본 해결이 아님
- 첫 2초 안에 이해

### Scene 2 — Possible Cause A

- drain water-seal trap
- 물막이가 있는 상태 / 없는 상태
- 특정 P자 배관을 보편 구조로 강제하지 않음

### Scene 3 — Possible Cause B

- 배수구 내부 오염 / biofilm 가능성
- Scene 2와 병렬 원인
- 과장되거나 혐오스럽지 않음

### Scene 4 — First Actions

- 충분한 물로 water seal 회복
- 접근 가능한 배수구 입구/내벽 청소
- 고정된 “한 컵/두 컵” 수치 강제 금지

## 18.3 Golden Sample 사용법

1. 사람 기준으로 먼저 승인
2. 그 뒤 production pipeline에 연결
3. 결과가 기준보다 나쁘면 checker를 늘리기 전에 prompt/scene/visual continuity를 먼저 수정
4. Golden Sample 성공 후 다른 주제로 일반화

---

# 19. Visual Generation

## 19.1 AI image provider abstraction

Provider는 교체 가능하게 인터페이스로 감싼다.

```ts
interface ImageProvider {
  generate(input: ImageGenerationInput): Promise<ImageGenerationResult>;
}
```

현재 실제 구현이 ChatGPT UI/Playwright를 사용하더라도 상위 파이프라인은 provider-neutral contract를 사용한다.

## 19.2 이미지 규격

- 9:16
- 최종 캔버스 1080x1920
- 자막 safe zone 고려
- 브랜드 로고/워터마크 금지
- 실제 제품 이미지처럼 보이는 가짜 상품 금지
- character identity 일관성

## 19.3 프롬프트 구조

```text
scene purpose
viewer must understand
visual subject
required objects
forbidden objects
composition
style
lighting
camera
continuity
negative constraints
```

## 19.4 이미지 품질 gate

- subject match
- required objects present
- forbidden object absent
- no readable false text
- no brand misuse
- no grotesque detail
- structure accuracy where needed
- continuity acceptable

---

# 20. Lumi Motion Library

## 20.1 기본 원칙

- 미리 승인된 motion만 production에서 사용
- 신규 motion generation은 별도 작업
- content run 중 즉흥 motion 생성 금지

## 20.2 catalog entry

```ts
interface LumiMotionAsset {
  id: string;
  file: string;
  description: string;
  semanticTags: string[];
  durationMs: number;
  priority: 'A'|'B'|'C';
  approved: boolean;
}
```

## 20.3 selection

scene intent와 semanticTags가 맞을 때만 사용.

---

# 21. Product Card System

## 21.1 제품 카드 필수 필드

- actual image
- product name
- criteria
- fit home
- not fit home
- verdict
- disclosure
- product link

## 21.2 AI fake product 금지

실제 구매 링크로 연결하는 제품 이미지는 실제 product asset만 사용.

## 21.3 RPS

원본 RPS를 유지한다.

- 문제 강도 20
- 영상 증명력 18
- 충동가격 15
- 반복/계절 수요 15
- 마진 12
- 리뷰/검색 8
- CS/반품 7
- 자체상품 확장성 5

80+: product card 가능  
65~79: 기준만 제시 가능  
<65: 문제 해결 콘텐츠 우선

---

# 22. ElevenLabs / TTS

## 22.1 Voice profile

```yaml
profile_name: Lumi_KR_Calm_Detective_F01
voice_id_env: ELEVENLABS_LUMI_VOICE_ID
production_model: eleven_multilingual_v2
preview_model: eleven_flash_v2_5
output_format: mp3_44100_128
seed: 27410231
settings:
  stability: 0.62
  similarity_boost: 0.78
  style: 0.08
  use_speaker_boost: true
  speed: 1.08
```

## 22.2 voice tone

- 여성 또는 여성에 가까운 중성
- 20대 후반~30대 초반 느낌
- 표준 한국어
- 차분 70 / 반전 20 / 판정 10
- 빠르지만 명료
- 광고 성우 아님

## 22.3 normalization

TTS 전:

- 숫자/기호 음성용 변환
- 특수문자 제거
- 너무 긴 문장 분리
- 해시태그 낭독 금지
- 불필요한 영어 약어 제거

## 22.4 TTS output

- audio path
- provider request id
- voice profile version
- model id
- ffprobe observed duration
- content hash

---

# 23. Audio Timing

예상 script duration은 planning 용도로만 사용.

최종 render timing은 반드시 **실제 생성된 TTS audio의 ffprobe duration**을 사용한다.

장면 timeline은 original relative weights를 실제 audio total duration에 비례 배분한다.

---

# 24. Captions

## 24.1 source

caption text source = **Owner-approved narration**

key subtitle와 caption을 혼동하지 않는다.

## 24.2 생성

scene narration을 deterministic segmenter로 나눈다.

권장 production policy:

- max 2 physical lines
- max 15 code points / line
- max 30 code points / cue

## 24.3 output

- `.srt` sidecar
- final MP4 burn-in

## 24.4 Korean font

Malgun Gothic 또는 프로젝트에서 검증된 한글 폰트를 사용.

---

# 25. FFmpeg Render

## 25.1 output

- 1080x1920
- H.264
- AAC
- 30fps
- yuv420p

## 25.2 render graph

```text
scene visuals
→ optional overlays
→ concat
→ subtitles/libass
→ audio map
→ final MP4
```

## 25.3 real render safety

- missing SRT fail closed
- missing audio fail closed
- missing real visual fail closed
- synthetic/testsrc in production fail closed

---

# 26. Result Preview

결과 화면은 raw JSON이 아니라 사람이 이해하는 화면이어야 한다.

필수:

- overall status
- actual final MP4 video player
- audio/caption status
- scene preview cards
- scene narration
- scene visual subject
- `장면 수정`
- `전체 영상 다시 만들기`

same-run artifact identity가 확인된 결과만 preview한다.

---

# 27. Regeneration

## 27.1 1차 구현

전체 rerun만 실제 지원한다면 UI도 솔직하게 `전체 영상 다시 만들기`라고 표시.

## 27.2 향후 scene-level regeneration

추후 구현 시:

```text
bad scene image only regenerate
→ existing approved narration reuse
→ existing TTS reuse if narration unchanged
→ captions reuse if timing unchanged
→ final MP4 rerender
```

이 기능은 별도 execution authority와 lineage가 필요하므로 초기 MVP에 억지로 넣지 않는다.

---

# 28. Publish Package

각 영상마다 자동 생성:

- title
- description
- hashtags
- pinned comment
- CTA
- disclosure
- landing page link

## 28.1 제목 규칙

문제 중심.

좋음:

- 방향제 뿌려도 욕실 냄새가 나는 이유
- 냉장고가 꽉 찼는데 먹을 게 없는 집 특징

나쁨:

- 대박 생활용품 추천
- 인생템 TOP5

## 28.2 description template

```text
오늘의 집안 사건: {problem}
먼저 확인할 원인: {causes}
0원 해결법: {zero_cost_solution}
제품 기준: {product_criteria}
문제별 처방표: {landing_page_url}
{disclosure_text}
```

---

# 29. Disclosure / Legal Trust Gate

Fail 조건:

- affiliate disclosure 누락
- AI fake product
- 허위 내돈내산
- 허위 사용 경험
- 위험한 화학 혼합
- 의학적/건강 과장
- AI 전후 이미지를 실제 효과처럼 표현
- 근거 없는 100%/완전 제거

Fail이면 업로드 불가.

---

# 30. Quality Scoring

원본 25점 체계를 유지한다.

| 항목 | 점수 |
|---|---:|
| 주제 적합성 | 5 |
| 첫 2초 훅 | 5 |
| 문제 해결력 | 5 |
| 구매전환력 | 5 |
| AI 품질 일관성 | 5 |

업로드 조건:

- 22/25 이상
- trust gate PASS

제품 없는 영상은 구매전환력 대신 `행동 유도/저장 가치`로 대체 가능.

---

# 31. Monetization

## Stage 1 Affiliate

- 쿠팡 파트너스
- 네이버 쇼핑커넥트
- YouTube Shopping
- 기타 affiliate

## Stage 2 Problem Curation

- 욕실 냄새 처방표
- 냉장고 정리 처방표
- 수납 붕괴 해결표

## Stage 3 Seller Collaboration

문제 해결형 쇼츠 패키지 + 성과형 링크.

## Stage 4 Group Buy

문제 해결 세트 단위.

## Stage 5 Own Product

90일 성과 기반으로만 기획.

---

# 32. Analytics

영상별 저장:

- views
- avg watch duration
- completion rate
- saves
- shares
- comments
- profile clicks
- landing clicks
- affiliate clicks
- conversion
- revenue

## 32.1 중요도

초기에는 조회수보다:

```text
저장
댓글 질문
프로필 클릭
링크 클릭
완주율
```

을 더 중요하게 본다.

## 32.2 iteration

성과 상위 문제는 새로운 각도로 반복하고, 성과가 낮은 format은 원인 분석 후 수정.

---

# 33. 데이터 모델

## 33.1 ContentProject

```ts
interface ContentProject {
  id: string;
  engineId: 'home_problem_lab';
  title: string;
  status: 'DRAFT'|'REVIEW'|'APPROVED'|'PREPARED'|'EXECUTING'|'RENDERED'|'PUBLISH_READY'|'PUBLISHED'|'FAILED';
  revision: number;
  topicId?: string;
  scriptPackageId?: string;
  sceneIds: string[];
  currentRunId?: string;
  createdAt: string;
  updatedAt: string;
}
```

## 33.2 TopicCandidate

```ts
interface TopicCandidate {
  id: string;
  axis: string;
  seriesType: string;
  problem: string;
  targetHomeType: string;
  hookType: string;
  hookText: string;
  riskFlags: string[];
  monetizationPotential: string;
}
```

## 33.3 ScriptPackage

앞 절의 ScriptPackage 사용.

## 33.4 SceneCard

앞 절의 SceneCard 사용.

## 33.5 Asset

```ts
interface MediaAsset {
  id: string;
  runId: string;
  sceneId?: string;
  kind: 'IMAGE'|'LUMI'|'PRODUCT'|'AUDIO'|'SRT'|'VIDEO';
  provider?: string;
  path: string;
  sha256?: string;
  createdAt: string;
  publishable: boolean;
  synthetic: boolean;
}
```

## 33.6 Run

```ts
interface GenerationRun {
  id: string;
  projectId: string;
  projectRevision: number;
  scope: 'IMAGE_ONLY'|'IMAGE_TTS'|'FULL_VIDEO';
  plannedCalls: {
    image: number;
    tts: number;
    ffmpeg: number;
  };
  completedCalls: {
    image: number;
    tts: number;
    ffmpeg: number;
  };
  status: string;
  finalArtifactId?: string;
}
```

## 33.7 PublishPackage

```ts
interface PublishPackage {
  title: string;
  description: string;
  hashtags: string[];
  pinnedComment?: string;
  disclosureText?: string;
  uploadProfile: 'home_problem_lab';
}
```

---

# 34. 상태 머신

```text
DRAFT
→ SCRIPT_REVIEW
→ SCENE_REVIEW
→ OWNER_APPROVED
→ PREPARED
→ EXECUTING
→ RENDERED
→ QUALITY_REVIEW
→ PUBLISH_READY
→ OWNER_PUBLISH_APPROVED
→ PUBLISHED
```

실패 시:

`FAILED_<STAGE>`로 기록하고 원인을 보존.

승인된 revision이 변경되면 이전 prepared approval은 invalid.

---

# 35. 시스템 아키텍처

현재 저장소가 이미 존재하므로 Claude Code는 먼저 실제 구조를 읽고 적응한다. 아래는 logical architecture다.

```text
UI / Editorial Workspace
        |
        v
Project State / Local Persistence
        |
        +--> Topic / Research
        +--> Script
        +--> Scene Design
        |
        v
Operational Runner
        |
        +--> Image Provider
        +--> Lumi Library
        +--> Product Assets
        +--> ElevenLabs
        +--> Caption Segmenter
        +--> FFmpeg
        |
        v
Run Artifacts / Manifests
        |
        v
Result Preview
        |
        v
Publish Package / Upload Profile
```

---

# 36. 권장 저장소 구조

실제 repo가 다르면 그 구조를 우선한다.

```text
app/
  home-problem-lab/
  api/home-problem-lab/
components/home-problem-lab/
lib/home-problem-lab/
scripts/lib/
  home-problem-lab-*.mjs
scripts/fixtures/
content_engines/home_problem_lab/
  config/
  prompts/
  templates/
  seeds/
  audio/
output/home-problem-lab/
  v1/runs/<run-id>/
```

---

# 37. 환경변수

민감값은 코드에 하드코딩 금지.

예:

```env
ELEVENLABS_API_KEY=
ELEVENLABS_LUMI_VOICE_ID=
ELEVENLABS_LUMI_MODEL_ID=eleven_multilingual_v2
HOME_PROBLEM_LAB_UPLOAD_PROFILE=home_problem_lab
DRY_RUN=true
ALLOW_UPLOAD=false
```

ChatGPT UI Playwright를 쓴다면 해당 browser profile / CDP 정보도 환경 또는 local config로 관리.

Secret 값은 로그에 출력하지 않는다.

---

# 38. Upload Profile

신규 계정 완전 분리.

```yaml
upload_profile: home_problem_lab
default_dry_run: true
```

규칙:

- `engine_id=home_problem_lab`이면 `upload_profile=home_problem_lab`만 허용
- mismatch fail closed
- 실제 업로드는 Owner 명시 승인 + upload flag가 모두 있어야 실행

---

# 39. API / Route 요구사항

현재 Next.js 구조를 기준으로 logical endpoint를 정의한다. 실제 route 이름은 repo 규칙에 맞춘다.

필수 capability:

- project CRUD
- topic generation/import
- script validation
- scene validation
- image preview plan
- prepare operational run
- owner approval
- execute run
- render artifact read-only preview
- publish package generation
- upload dry-run

각 mutating route는 project revision 또는 run id를 받아 stale mutation 방지.

---

# 40. 안전/권한

## 40.1 기본 정책

- provider 실제 호출은 명시 scope 안에서만
- 실제 업로드 default off
- retry default 0 또는 bounded
- synthetic asset real run 차단
- prepared run identity mismatch 차단

## 40.2 UI honesty

실제 지원하지 않는 기능을 버튼 이름으로 암시하지 않는다.

예:

scene-only backend가 없으면 `이 장면만 다시 만들기` 금지.

---

# 41. 오류 처리

오류는 사람이 이해할 수 있는 safeCode + 내부 detail로 분리.

예:

```text
CONTENT_NOT_APPROVED
SYNTHETIC_VISUAL_REJECTED
IMAGE_PROVIDER_FAILED
TTS_CREDENTIAL_MISSING
TTS_PROVIDER_FAILED
CAPTION_PLAN_INVALID
FFMPEG_FAILED
ARTIFACT_NOT_FOUND
UPLOAD_NOT_AUTHORIZED
```

실패 시 기존 성공 artifact를 무조건 삭제하지 않는다.

---

# 42. 캐시와 재사용

- 동일 script hash + voice profile이면 TTS cache 가능
- 동일 scene prompt hash면 preview cache 가능
- production rerun에서 stale/other-run artifact 자동 섞기 금지
- cache hit도 lineage 기록

---

# 43. 로깅

필수 로그:

- project id/revision
- run id
- execution scope
- planned/actual provider calls
- provider result state
- final artifact locator
- quality/trust result

금지 로그:

- API keys
- cookies
- auth tokens
- full secret env

---

# 44. 테스트 전략

## 44.1 Unit

- script normalization
- scene segmentation
- caption segmentation
- timeline allocation
- quality scoring
- disclosure requirement
- path safety

## 44.2 Contract

- project → script → scene schemas
- runner planned calls
- upload profile mismatch block
- synthetic real-run block
- caption source identity

## 44.3 Integration

- no-provider synthetic full pipeline
- image-only
- image+tts
- full video with local fixtures
- result preview route

## 44.4 Real E2E

Owner 승인 후 bounded 1회.

검증:

- actual images
- actual TTS
- observed timing
- captions
- FFmpeg
- browser MP4 playback
- no upload

---

# 45. 구현 단계 — Claude Code 단독

과도한 atomic slicing을 피하고, 아래 8개 큰 단계로 진행한다.

## Phase 1 — Repository Audit & Baseline

- 현재 구조 분석
- 기존 home_problem_lab 구현 inventory
- 기능/미구현/obsolete 분류
- 보호 파일/dirty working tree 확인
- 기존 테스트 baseline

산출물:

`CURRENT_STATE_AUDIT.md`

## Phase 2 — Core Domain & Persistence

- project
- topic
- script
- scene
- run
- artifact
- publish package

기존 타입이 있으면 재사용/최소 확장.

## Phase 3 — Simplified Editorial Workspace

5단계 UX 구현.

- 주제/대본
- 대본+장면
- 만들기
- 승인
- 결과

내부 debug는 Advanced로 숨김.

## Phase 4 — Content Intelligence

- topic generation/import
- evidence/risk
- script generation
- Golden Sample
- scene-intent storyboard

## Phase 5 — Media Pipeline

- image provider
- Lumi catalog
- product card
- ElevenLabs
- actual audio timing
- captions
- FFmpeg

## Phase 6 — Preview / Quality / Trust

- actual MP4 preview
- visual review
- quality score
- trust gate
- failure UX

## Phase 7 — Publish Package / Monetization

- title/description/hashtags
- landing links
- disclosures
- upload profile
- dry-run

## Phase 8 — Golden Sample Real E2E & Hardening

- 실제 1편 제작
- 사람 품질 평가
- 필요 수정
- 회귀
- v1 release readiness

---

# 46. Definition of Done — 프로그램 A~Z

아래 전부 충족해야 완료다.

## Product

- [ ] 사용자가 주제를 입력할 수 있다.
- [ ] 후보를 자동 생성할 수 있다.
- [ ] 사실/위험 검토가 있다.
- [ ] 대본 생성/붙여넣기/수정이 가능하다.
- [ ] Owner 승인 narration을 고정할 수 있다.
- [ ] scene-intent storyboard를 만들 수 있다.
- [ ] 각 scene의 visual source를 결정할 수 있다.
- [ ] AI 이미지 생성이 가능하다.
- [ ] 승인된 Lumi motion을 사용할 수 있다.
- [ ] 실제 제품 카드를 사용할 수 있다.
- [ ] ElevenLabs narration 생성이 가능하다.
- [ ] 실제 audio duration을 얻는다.
- [ ] narration-derived caption을 생성한다.
- [ ] SRT sidecar를 만든다.
- [ ] caption burn-in MP4를 만든다.
- [ ] 같은 run의 final MP4를 브라우저에서 재생한다.
- [ ] 품질 점수와 trust gate를 실행한다.
- [ ] 제목/설명/해시태그/CTA/disclosure를 생성한다.
- [ ] upload profile을 분리한다.
- [ ] dry-run이 기본이다.
- [ ] Owner 승인 없이 실제 게시하지 않는다.
- [ ] 분석 지표를 저장할 수 있다.

## Golden Sample

- [ ] 승인된 욕실 냄새 Golden Sample 4씬 완성
- [ ] synthetic placeholder 0
- [ ] 장면-대본 의미 일치
- [ ] 실제 TTS 자연스러움 확인
- [ ] 자막 가독성 확인
- [ ] 실제 MP4 브라우저 playback 확인
- [ ] 게시 후보 수준 human review PASS

## Engineering

- [ ] Typecheck PASS
- [ ] affected runtime tests PASS
- [ ] aggregate contract PASS
- [ ] no secret logs
- [ ] no accidental upload
- [ ] no synthetic in real production run
- [ ] output artifacts not staged
- [ ] explicit path staging only
- [ ] push/deploy는 Owner 지시가 있을 때만

---

# 47. Claude Code 작업 운영 규칙

## 47.1 역할

```text
MAIN_AI / SOLE WRITER: Claude Code
CONTROL_TOWER: ChatGPT
CROSS REVIEW: 기본 없음
```

## 47.2 Claude Code가 혼자 수행

- repo 분석
- 구현 계획
- 코드 구현
- 테스트
- 브라우저 로컬 검증
- 변경 inventory
- checkpoint handoff

## 47.3 작업 원칙

- 큰 목표를 기준으로 1~3개 bounded slice
- 필요 없는 체커/추상화 추가 금지
- 기능을 만들기 전에 현재 구현 재사용 가능성 확인
- 기존 CLOSED safety를 이유 없이 재설계하지 않음
- 실제 사용 UX를 우선
- Golden Sample 품질을 기준으로 판단

## 47.4 금지

- `git add .`
- 무단 push/deploy/publish
- secret 출력
- 보호 파일 임의 reset
- synthetic artifact를 production으로 승격
- “기능이 없는 데 있는 척” UI
- 실사용자가 이해할 필요 없는 내부 개념을 기본 화면에 노출

---

# 48. Claude Code 필수 handoff 형식

각 큰 slice 종료 시:

```text
PROJECT:
home_problem_lab

MILESTONE:
...

RESULT:
PASS / NEEDS_REVIEW / STOP

GOAL:
...

CHANGED_FILES:
...

BEHAVIOR_BEFORE:
...

BEHAVIOR_AFTER:
...

VALIDATION:
...

REAL_PROVIDER_CALLS:
...

STAGED:
...

COMMIT:
...

RISKS:
...

NEXT_RECOMMENDATION:
...
```

---

# 49. 초기 소재 풀

원본 소재를 seed로 유지한다.

## 청소·냄새·수납

1. 방향제를 뿌려도 욕실 냄새가 나는 이유
2. 배수구 냄새가 반복되는 집의 공통점
3. 수건을 빨아도 냄새나는 이유
4. 신발장 냄새를 방향제로 덮으면 안 되는 이유
5. 옷장 냄새가 계속 나는 집의 습기 위치
6. 욕실 물때가 계속 생기는 이유
7. 곰팡이 제거제를 써도 다시 생기는 이유
8. 창틀 청소를 미루면 집 냄새가 심해지는 이유
9. 수납함을 샀는데 집이 더 지저분해지는 이유
10. 깊은 수납함이 초보자에게 위험한 이유
11. 투명 수납함이 무조건 좋은 건 아닌 이유
12. 현관이 항상 지저분한 집의 공통점
13. 계절옷 정리가 실패하는 이유
14. 압축팩을 잘못 쓰면 옷장이 더 망가지는 이유
15. 빨래바구니 위치가 세탁 냄새를 만든다
16. 욕실 선반을 잘못 사면 물때가 늘어나는 이유
17. 싱크대 주변이 항상 축축한 이유
18. 주방 행주 냄새가 반복되는 이유
19. 청소도구를 많이 사도 집이 더러워지는 이유

## 주방·식비·시간

1. 냉장고가 꽉 찼는데 먹을 게 없는 이유
2. 식재료를 자꾸 버리는 집의 냉장고 구조
3. 할인받아 산 식재료가 결국 비싸지는 이유
4. 냉동실 고기가 사라지는 이유
5. 반찬통을 많이 사도 냉장고가 정리 안 되는 이유
6. 투명 용기를 써야 하는 집과 쓰면 안 되는 집
7. 패킹 분리세척 안 되는 밀폐용기의 문제
8. 설거지가 오래 걸리는 집의 동선 문제
9. 식기건조대를 잘못 사면 설거지가 더 밀리는 이유
10. 컵 브러쉬가 필요한 집과 필요 없는 집
11. 조미료 정리가 요리 시간을 줄이는 이유
12. 도마를 여러 개 써야 하는 집의 기준
13. 아침 준비 시간을 줄이는 주방 구역 나누기
14. 음식물 쓰레기 냄새가 심한 집의 공통점
15. 양념통을 예쁘게 바꿔도 요리가 느린 이유
16. 냉장고 트레이가 필요한 집과 필요 없는 집
17. 주간 식단표보다 먼저 해야 할 냉장고 재고표
18. 냉동 보관팩을 잘못 쓰면 식비가 더 나가는 이유
19. 도시락 준비가 오래 걸리는 집의 문제
20. 싱크대 아래 수납이 무너지는 이유

새 소재는 seed 복제가 아니라 문제 구조를 기준으로 계속 생성한다.

---

# 50. 30일 초기 운영 계획

## Week 1

- Golden Sample 완성
- Lumi identity 고정
- narration voice 고정
- 자막/렌더 스타일 고정
- product card 스타일 고정

## Week 2

- 10~20편 draft 제작
- 실제 업로드는 Owner 정책에 따라 단계적으로
- 콘텐츠 축 분산

## Week 3

분석:

- completion
- save/share
- comments
- profile clicks
- link clicks

## Week 4

반응 좋은 문제 3~5개 재활용.

---

# 51. Launch Readiness

v1은 “코드가 돌아간다”가 아니라 아래를 만족해야 한다.

```text
한 명의 Owner가 복잡한 내부 단계를 모른 채
주제 하나를 고르고
대본/장면을 확인한 뒤
전체 영상 생성 버튼을 눌러
실제 루미 쇼츠 MP4를 보고
품질을 판단하고
게시 패키지까지 받을 수 있다.
```

그리고 그 과정에서:

```text
가짜 제품 없음
허위 사용후기 없음
근거 없는 위험 주장 없음
실제 provider 비용 통제
업로드 계정 분리
Owner 승인 없는 게시 없음
```

이 보장되어야 한다.

---

# 52. 최종 한 줄

**생활꿀팁 루미탐정 / HOME_PROBLEM_LAB은 “제품 추천 자동화”가 아니라, 집안 문제를 정확히 진단하고 먼저 돈 들이지 않는 해결을 제시한 뒤 필요한 경우에만 신뢰 가능한 제품으로 연결하는 AI 생활문제 해결 쇼츠 제작 OS다.**

