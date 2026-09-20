# Money Shorts OS Implementation Order V1

Status: **ACTIVE IMPLEMENTATION ORDER — DIRECTION ALIGNMENT V1.1**

Updated: 2026-06-27

## Core Principle

처음부터 완전 자동 영상 생성, 자동 업로드, 결제, 대규모 템플릿 확장까지 만들지 않는다.

먼저 목표는 단 하나다.

**출처 기반 경제 신호를 생활 돈관리 문제와 대응 행동으로 번역하는 고품질 쇼츠 패키지 1편이 안정적으로 생성되는 구조**를 만든다.

Money-OS는 메인 콘텐츠 주제가 아니라 CTA/전환 레이어와 생활 돈관리 행동 연결 장치다.

## Final Direction

Money Shorts OS는 단순 경제지표 설명기가 아니다.

경제 신호를 출처 기반으로 가져와, 사람들이 궁금해할 만한 후킹으로 열고, 현재 상황과 주요 원인 후보를 팩트 기반으로 설명하고, 전문가적 시선으로 지금 무엇을 봐야 하는지 해석한 뒤, 그 신호가 생활비·대출·소비·저축·투자 판단·환전·카드값·여행비·장바구니·고정비/변동비에 어떤 영향을 줄 수 있는지 연결하고, 마지막에는 개인이 지금 할 수 있는 점검 행동을 제시하는 **source-first 생활경제 쇼츠 제작 OS**다.

Brand / tone:

- 브랜드 방향: **경제번역소**
- 콘텐츠 톤: **생활경제탐정**
- 생활경제탐정은 실제 캐릭터가 아니라 경제 신호의 단서를 찾아 생활 영향으로 번역하는 해석 방식과 연출 문법이다.

Authoritative pipeline:

`Fact Card`
→ `Signal Translation Brief`
→ `6 Scene Cards`
→ `script / caption / image prompt / voice / screen text`
→ `risk review / final QA / owner gate`

## Layer Responsibilities

### Fact Card

Fact Card는 근거 layer다.

- 사실, 수치, 출처, 기간, citation, `allowedClaims`, `blockedClaims`를 담는다.
- AI가 숫자나 사실을 상상하지 못하게 막는다.
- 생활 해석, 후킹 문구, 시나리오 전망, 행동 지침을 과도하게 넣지 않는다.

### Signal Translation Brief

Signal Translation Brief는 경제 신호를 생활 돈관리 문제로 번역하는 중간 layer다.

포함 후보:

- `signalSummary`
- `keyReasons`
- `expertInterpretation`
- `affectedMoneyAreas`
- `lifeImpact`
- `volatilityWatch`
- `scenarioBasedOutlook`
- `recommendedActions`
- `actionUrgency`
- `audienceSituation`
- `actionBoundaries`
- `doNotOverclaimActions`
- `viewerTakeaway`

### Scene Card

Scene Card는 장면별 단일 명세서다.

각 장면에서 함께 파생:

- 내레이션
- 자막 / `captionBlocks`
- 이미지 프롬프트
- 화면 텍스트
- 음성 타이밍
- 출처 표기
- 안전영역
- 리스크 노트

대본, 자막, 이미지, 음성을 따로 생성하지 않는다. Scene Card를 기준으로 묶는다.

## Fixed MVP 6-Scene Format

1. **Hook**
   - 궁금증 유발.
   - 첫 장면 큰 제목/썸네일 역할.
   - 질문형/반전형/생활 연결형.
2. **Signal**
   - 출처 기반 경제 신호 제시.
   - 핵심 수치, 기간, 출처 요약.
   - 숫자는 Fact Card 범위 안에서만 사용.
3. **Why + Expert Interpretation**
   - 주요 원인 후보.
   - 현재 상황에 대한 전문가적 해석.
   - 단정 원인 금지.
   - 지금 무엇을 봐야 하는가 제시.
4. **Life Impact**
   - 생활비, 대출, 소비, 저축, 투자 판단, 환전, 카드값, 여행비, 장바구니, 고정비/변동비와 연결.
   - 새 방향의 중심 장면.
5. **Watch / Scenario Outlook**
   - deterministic forecast 금지.
   - 상승/하락/유지 시나리오 또는 관찰 포인트.
   - 변동성 대비 관점.
6. **Action + Closing Line**
   - 개인이 지금 할 수 있는 점검 행동.
   - 투자 추천 금지.
   - 마지막 한 줄 결론 포함.

## Caption System V1

1080x1920 세로 영상 기준:

- Hook Title: `x 90~990`, `y 300~620`, 2줄 이하, `74~88px`.
- Scene Label: `x 80~420`, `y 180~250`, `30~38px`.
- Spoken Caption: `x 90~880`, `y 1180~1480`, `52~64px`, 1~2줄, 내레이션의 축약/파생본.
- Source Note: `x 90~760`, `y 1500~1560`, `24~30px`.
- 피해야 할 영역: `y 0~150`, `y 1600~1920`, `x 900~1080`.
- 폰트: Pretendard 또는 Noto Sans KR 계열.
- 강조색: amber/warm yellow 1개 중심.
- 한 화면 강조 단어: 1~2개 이하.

## Image Style V1

- 에디토리얼 생활경제 리포트 스타일.
- 생활 오브젝트 + 경제 신호 카드 + 탐정식 단서 연출.
- 실제 탐정 캐릭터가 아니라 단서 카드, 연결선, 체크 표시, 신호 카드, 생활 오브젝트 배치로 해석 느낌을 준다.
- 색감: off-white, light gray, charcoal navy, dark navy/charcoal, amber/warm yellow.
- 금지: 매번 다른 화풍, 과한 프리미엄 금융 광고풍, 과한 골드, 공포 분위기, 투자 수익 암시, 대본과 무관한 추상 그래프 배경, 이미지 안 검증되지 않은 숫자/문구 삽입.

## Implementation Order

1. **문서-only 방향 정렬**
   - Product Direction, PRD, Source-First Data Spec, MVP1 Content Package Spec, Video Pipeline Spec, Implementation Order, NEXT_ACTION, PROJECT_STATE를 v1.1에 맞춘다.

2. **Channel Bible / Style Bible 문서화**
   - 경제번역소 / 생활경제탐정 tone, Caption System V1, Image Style V1, Voice / Narration Style V1, forbidden expression/style rules를 고정한다.

2.5. **Voice 후보 테스트 — non-code validation**
   - Claude Code 구현 전에 ElevenLabs 후보 `Hojin Lim`, `Yohan Koo`, `Gihong`을 같은 테스트 대본으로 생성해 Owner가 직접 청감 비교한다.
   - 이 단계는 코드 구현 task가 아니다.
   - 비교 기준: 자연스러운 한국어 발음, 억양, 강약조절, AI티 여부, 후킹감, 신뢰감, 30초 쇼츠 지속 청취감.
   - 기본 설정: Eleven Multilingual v2, Stability 45~60, Similarity 70~85, Style/Exaggeration 0~20, Speaker Boost ON.
   - 실제 ElevenLabs 호출, env/secret 사용, 비용 발생은 Owner가 별도 승인한 validation task에서만 진행한다.

3. **Signal Translation Brief 타입 설계**
   - Fact Card를 오염시키지 않고 생활경제 번역 layer를 별도 타입으로 설계한다.
   - 외부 API, DB migration, env, dependency 변경 없음.

4. **Scene Card 타입 설계**
   - narration, captionBlocks, visualTemplateId, sourceCitationIds, imageTextPolicy, voiceTiming, layoutSafeZone, riskNotes를 포함한다.
   - 대본/자막/이미지/음성을 Scene Card에서 함께 파생할 수 있게 한다.

5. **fixture 1~2개만 수정**
   - 기존 fixture를 모두 갈아엎지 않는다.
   - 대표 source-first 경제 신호 1개와 생활 영향 연결이 분명한 예시 1개만 먼저 보정한다.

6. **blueprint/script/caption/image prompt 생성 규칙 수정**
   - 기존 Fact Card 기반 generator를 유지하되 Signal Translation Brief와 6 Scene Cards를 거치게 한다.
   - Caption System V1과 Image Style V1을 output contract로 붙인다.

7. **package preview에 생활경제/멀티모달 검수 패널 추가**
   - 기존 package preview, risk review, final QA, owner gate는 유지한다.
   - 추가로 생활 영향, 행동 지침, scene consistency, caption safe zone, image/text conflict를 확인하는 display-only/readiness 패널을 붙인다.

8. **QA / Owner Gate 확장**
   - 원인 단정, 예측 단정, 투자 조언 위험도, 생활 영향 과장, 행동 지침 적절성, 공포 조장, 출처 밖 주장, 자막/음성/이미지 일치도, 마지막 viewer takeaway를 gate/checklist에 반영한다.

## Current Next Atomic Task

`money-shorts-os-signal-translation-scene-card-types-v1`

권장 목표:

- Signal Translation Brief 타입과 Scene Card 타입을 문서/타입 수준에서 설계한다.
- Fact Card responsibility를 오염시키지 않는다.
- fixture는 최대 1~2개만 보정한다.
- 코드 구현은 Owner가 다음 단계에서 승인한 범위 안에서만 진행한다.

## Guardrails

- 구현 코드, API route, DB migration, env/secret, dependency, render, output, upload, deploy는 별도 Owner 승인 전 금지.
- `.money-shorts-local/`과 `piq_diag_out.txt`는 읽기/수정/삭제/stage/commit 금지.
- 이전 Candidate10, static slideshow, 3D sitcom, living tips, old render/upload/generate flow는 active MVP path가 아니다.
- Legacy docs and routes may be referenced only as historical evidence or pattern inspiration after explicit Owner approval.
