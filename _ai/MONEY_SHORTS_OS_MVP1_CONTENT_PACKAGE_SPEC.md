# Money Shorts OS MVP1 Content Package Spec

Status: **ACTIVE MVP1 SPEC — DIRECTION ALIGNMENT V1.1**

Updated: 2026-06-27

## 1. Goal

MVP1은 완성 영상 자동 생성기가 아니다.

목표는 Owner가 매일 쇼츠 제작에 바로 사용할 수 있는 **출처 기반 생활경제 쇼츠 콘텐츠 패키지 생성기**를 만드는 것이다.

MVP1의 핵심 산출물은 단순 script/storyboard 묶음이 아니라, Fact Card에서 출발해 Signal Translation Brief와 6 Scene Cards를 거친 **Scene Card 기반 multimodal package**다.

Money-OS는 본체가 아니라 보조 전환 레이어다. 초기 Money-OS 연결은 다음까지만 포함한다:

- Money-OS CTA 생성
- 무료 진단 랜딩 stub
- 무료 진단 시작/완료/결제 전환을 추적할 수 있는 데이터 구조

## 2. Latest Direction Priority

Owner 지시는 모두 참고하되, 충돌 시 최신 지시를 우선한다.

현재 최신 기준:

- 내부 제작 도구 먼저, SaaS 확장은 이후.
- 쇼츠 자동 영상 렌더보다 콘텐츠 패키지 품질 검증 먼저.
- 콘텐츠 중심축은 출처 기반 경제 신호를 생활 돈관리 문제와 대응 행동으로 번역하는 것이다.
- 각 쇼츠는 Fact Card를 먼저 만든 뒤 대본을 생성한다.
- Fact Card는 사실/수치/출처 근거에 집중하고, 생활 해석과 행동 지침은 Signal Translation Brief에서 다룬다.
- script, caption, image prompt, voice, screen text는 Scene Card에서 함께 파생한다.
- 앱 UI는 프리미엄 금융 SaaS 톤.
- 쇼츠 출력물은 “경제번역소 / 생활경제탐정” 톤.
- Data Shorts Mode가 기본값이고, Money-OS 연결형 돈관리는 보조 카테고리다.
- 대본보다 먼저 Video Blueprint를 생성한다.
- 영상 파이프라인 세부 기준은 `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`를 따른다.

## 3. MVP1 Inputs

필수 입력:

- `source_provider`: ECOS / KOSIS / OpenDART / FRED / public_finance / manual
- `source_name`
- `source_url`
- `published_date`
- `data_period`
- `indicator_name`
- `current_value`
- `previous_value`
- `comparison_type`
- `unit`
- `interpretation`
- `caution_note`
- `content_category`: `source_based_finance` | `money_os_money_management`
- `template_mode`: `data_shorts` | `trust` | `money_os_cta`
- `template_key`: `indicator_summary` | `rate_fx_change` | `disclosure_summary` | `earnings_numbers` | `money_os_support`
- `audience_level`: `beginner` | `intermediate` | `expert`
- `content_goal`: `save` | `source_understanding` | `profile_click` | `money_os_diagnosis`

선택 입력:

- `key_number`
- `target_platform`: `instagram` | `youtube` | `both`
- `tone_note`
- `cta_preference`

기본값:

- `content_category`: `source_based_finance`
- `template_mode`: `data_shorts`
- `content_goal`: `source_understanding`
- 콘텐츠 비중 운영 기준: 출처 기반 금융·경제 쇼츠 70%, Money-OS 연결형 돈관리 쇼츠 30%

## 4. MVP1 Output Package

하나의 생성 결과는 `shorts_package`로 저장한다.

필수 출력:

- Fact Card
- source citations
- Signal Translation Brief
- Video Blueprint
- 6 Scene Cards
- 쇼츠 주제
- 핵심 메시지
- 15초 대본
- 30초 대본
- 60초 대본
- 장면별 narration / caption / image prompt / voice timing / screen text
- captionBlocks
- Caption System V1 layout guidance
- 9:16 차트/이미지 브리프 또는 경량 카드 결과
- 썸네일 문구
- YouTube 제목
- Instagram Reels 문구
- 설명문
- 해시태그
- Money-OS CTA
- 금융표현 위험 검수 결과

## 5. MVP Fixed 6-Scene Format

MVP 운영 안정화를 위해 자유 포맷보다 6장면 고정 포맷을 우선한다. 기존 15초/30초/60초 변형은 이 6장면을 압축하거나 확장하는 방식으로만 허용한다.

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

## 5.1 Legacy Script Structure Reference

### 15초

- 0-2s: 훅
- 2-7s: 문제 또는 핵심 숫자
- 7-12s: 해석/전환
- 12-15s: Money-OS CTA

### 30초

- 0-3s: 훅
- 3-10s: 문제 상황
- 10-20s: 원인/구조
- 20-26s: 해결 방향
- 26-30s: Money-OS CTA

### 60초

- 0-4s: 훅
- 4-15s: 문제 정의
- 15-30s: 데이터/사례/원인
- 30-45s: 구조적 해결 방향
- 45-54s: 요약
- 54-60s: Money-OS CTA

## 6. Scene Card Model

각 scene은 아래 필드를 가진다:

- `scene_index`
- `duration_sec`
- `scene_role`: `hook` | `signal` | `why_expert_interpretation` | `life_impact` | `watch_scenario_outlook` | `action_closing`
- `scene_goal`
- `narration_text`
- `caption_text`
- `captionBlocks`: `{ startSec, endSec, text, emphasisWords }[]`
- `visualTemplateId`: `signal_card` | `life_object` | `clue_cards` | `action_checklist`
- `visual_brief`
- `image_prompt`
- `screen_text`
- `sourceCitationIds`
- `source_note`
- `imageTextPolicy`: 이미지 안에 넣어도 되는 텍스트 / 넣으면 안 되는 텍스트
- `voiceTiming`: 빠르게 / 보통 / 천천히, 강조 단어, pause 지점
- `narrationDirection`: hook / interpretation / action close의 톤 지시
- `voiceCandidateNotes`: ElevenLabs 후보 테스트 시 참고할 장면별 청감 메모
- `layoutSafeZone`: Hook Title / Spoken Caption / Source Note 위치
- `risk_note`

Scene Card 원칙:

- 자막은 별도 창작물이 아니라 내레이션의 축약/파생본이다.
- 이미지 프롬프트는 장면 목적, 자막, 내레이션과 같은 메시지를 보여야 한다.
- 이미지 안에는 검증되지 않은 숫자/문구를 넣지 않는다.
- 각 장면은 핵심 메시지 1개만 전달한다.
- 내레이션은 30대 남성 중저음 생활경제 해설자 톤을 기본으로 한다.
- Hook 장면은 궁금증을 유발하되 과장하지 않는다.
- Why/Expert 장면은 전문가식 해석처럼 차분하고 신뢰감 있게 읽는다.
- Action/Closing 장면은 투자 권유가 아니라 생활 점검 행동처럼 부드럽고 단정하게 마무리한다.

## 6.0.1 Voice / Narration Style V1

기본 음성 컨셉:

- 30대 남성 중저음.
- 자연스러운 한국어 발음.
- AI티가 최소화된 억양.
- 문장 끝이 기계적으로 끊기지 않아야 함.
- 차분하지만 지루하지 않은 생활경제 해설자 톤.
- 뉴스 앵커처럼 딱딱하지 않음.
- 과장된 유튜버 톤이나 광고/판매 느낌 금지.

Scene Card 연결:

- `voiceTiming.pace`: Hook은 약간 빠르게, 해석은 보통, Action은 보통 또는 천천히.
- `voiceTiming.emphasisWords`: Fact Card/Signal Translation Brief에서 허용된 핵심 단어만 강조.
- `voiceTiming.pauses`: 숫자, 생활 영향, 행동 지침 전후에 짧게 둔다.
- `narrationDirection`: 첫 문장 호기심, 중간 전문가식 해석, 마지막 행동 지침으로 구분한다.

ElevenLabs 후보는 아직 최종 확정하지 않는다. `Hojin Lim`, `Yohan Koo`, `Gihong`을 같은 테스트 대본으로 생성한 뒤 Owner가 직접 청감 비교한다.

## 6.1 Caption System V1

1080x1920 세로 영상 기준:

- Hook Title: `x 90~990`, `y 300~620`, 2줄 이하, `74~88px`, 질문형/반전형/생활 연결형.
- Scene Label: `x 80~420`, `y 180~250`, `30~38px`, 예: 신호 / 원인 / 생활영향 / 관찰 / 대응.
- Spoken Caption: `x 90~880`, `y 1180~1480`, `52~64px`, 1~2줄, 내레이션의 축약/파생본.
- Source Note: `x 90~760`, `y 1500~1560`, `24~30px`, 작고 방해되지 않게.
- 피해야 할 영역: `y 0~150`, `y 1600~1920`, `x 900~1080` 오른쪽 UI 영역.
- 폰트: Pretendard 또는 Noto Sans KR 계열.
- Hook Title은 Bold/ExtraBold, Spoken Caption은 SemiBold/Medium, Source Note는 Regular.
- 강조색은 amber/warm yellow 1개 중심, 한 화면 강조 단어는 1~2개 이하.

## 6.2 Image Style V1

- 에디토리얼 생활경제 리포트 스타일.
- 생활 오브젝트 + 경제 신호 카드 + 탐정식 단서 연출.
- 실제 탐정 캐릭터가 아니라 단서 카드, 연결선, 체크 표시, 신호 카드, 생활 오브젝트 배치로 해석 느낌을 준다.
- 색감: off-white, light gray, charcoal navy, dark navy/charcoal, amber/warm yellow.
- visual templates: `signal_card`, `clue_cards`, `life_object`, `action_checklist`.
- 금지: 매번 다른 화풍, 과한 프리미엄 금융 광고풍, 과한 골드, 공포 분위기, 투자 수익 암시, 대본과 무관한 추상 그래프 배경, 이미지 안 검증되지 않은 숫자/문구 삽입.

Data Shorts Mode scene 원칙:

- 프리미엄하지만 어렵지 않게
- 진지하지만 부담스럽지 않게
- 쇼츠답게 빠르지만 싸 보이지 않게
- 밝은 카드형 배경
- 큰 숫자
- 짧은 문장
- 직관적 아이콘/차트
- 빠른 전환에 맞는 단순 장면
- 출처/지표/비교값이 명확하게 보이게
- 밈스럽고 가벼운 농담형 연출 금지
- 과장 광고 느낌 금지

Trust Mode scene 원칙:

- 네이비/차콜/골드 기반
- 출처/지표 강조
- 과도한 자극 문구 금지
- 차트와 해석 중심
- 지나치게 어둡고 느린 금융 리포트 느낌 금지
- 텍스트가 너무 많은 설명형 콘텐츠 금지

## 7. Initial Templates

### `indicator_summary` — 경제지표 핵심 요약

기본 용도:

- 금리
- 환율
- 물가
- 고용
- 소비
- 경기지표

추천 모드:

- Data Shorts Mode

### `disclosure_summary` — 공시/실적 핵심 숫자

기본 용도:

- OpenDART 공시
- 기업 실적 발표
- 매출/영업이익/순이익 변화
- 공시에서 봐야 할 핵심 숫자

추천 모드:

- Trust Mode 또는 Data Shorts Mode

### `money_os_support` — Money-OS 연결형 돈관리 보조 템플릿

기본 용도:

- 월급관리
- 소비습관
- 카드값
- 비상금
- 소비/비상금/투자금 분리
- 돈이 새는 구조
- Money-OS 무료 진단 CTA

추천 모드:

- Money-OS Support Mode. 경제지표를 개인 재무관리 관점으로 자연스럽게 연결할 수 있을 때만 사용.

## 8. Financial Risk Review

위험 표현 예:

- 매수하세요
- 무조건 오릅니다
- 수익 보장
- 급등 확정
- 지금 안 사면 늦습니다
- 100% 돈 법니다
- 이 종목 사면 됩니다

대체 표현 예:

- 관찰할 필요가 있습니다
- 변동성이 커질 수 있습니다
- 투자 판단에는 추가 확인이 필요합니다
- 특정 종목 추천이 아닙니다
- 데이터상 주목할 만한 변화입니다

검수 대상:

- hook
- scripts
- captions
- Scene Cards
- image prompts
- screen text
- title
- description
- CTA
- hashtags

추가 QA:

- 원인 단정 여부
- 예측 단정 여부
- 투자 조언 위험도
- 생활 영향 과장 여부
- 행동 지침 적절성
- 공포 조장 여부
- 출처 밖 주장 여부
- 자막/음성 일치도
- 자막/이미지 일치도
- 대본/이미지 일치도
- Caption safe zone 준수 여부
- Hook Title 2줄 이하 여부
- 이미지 안 텍스트와 자막 충돌 여부
- 마지막 viewer takeaway 명확성

위험도:

- `low`
- `medium`
- `high`
- `blocked`

## 9. Money-OS CTA Mapping

| Topic Pattern | Money-OS CTA Direction |
|---|---|
| 월급이 사라짐 | 돈 흐름 무료 진단 |
| 카드값 부담 | 소비 구조 진단 |
| 비상금이 깨짐 | 비상금 접근 난이도 진단 |
| 투자금이 안 모임 | 투자금 분리 구조 진단 |
| 돈이 안 모임 | Money-OS 전체 구조 진단 |

CTA 기본 예:

“내 돈이 어디서 새는지 확인하려면 Money-OS 무료 진단을 받아보세요.”

## 10. Minimal UI Screens

Sprint 1 필수 화면:

- Dashboard
- Shorts Generator
- Package Library
- Package Detail / Editor
- Financial Risk Review
- Money-OS CTA Manager
- Money-OS Free Diagnosis Landing Stub

관리 화면은 Sprint 1에서 placeholder만 허용:

- 사용자 관리
- 결제 관리
- API 사용량
- 금지어/위험표현 관리

## 11. Save / Export Flow

저장:

- 생성 즉시 draft package 생성
- 사용자가 수정 후 saved 상태로 전환

복사:

- 15초 대본 복사
- 30초 대본 복사
- 60초 대본 복사
- Instagram 문구 복사
- YouTube 제목/설명 복사
- 해시태그 복사
- CTA 복사

내보내기:

- MVP1은 clipboard 중심
- 파일 export는 후순위

## 12. Analytics Model

조회수는 보조 지표다.

핵심 지표:

- 쇼츠별 조회수
- 저장률
- 프로필 클릭
- 랜딩 클릭
- 무료 진단 시작
- 무료 진단 완료
- 유료 결제 전환
- CTA별 전환율
- 주제별 전환율
- 템플릿 모드별 전환율

Sprint 1에서는 수동 입력 또는 mock 데이터로 시작한다.

## 13. Non-Goals

MVP1에서 하지 않는다:

- 완성 영상 렌더
- Gemini/Veo 영상 생성
- ElevenLabs TTS
- 자동 업로드
- Toss Payments
- Supabase migration 실제 적용
- production DB 변경
- env/secret 변경
- 이전 Candidate10/Jun/static slideshow route 재사용

## 14. Sprint 1 Acceptance Criteria

- 사용자가 topic을 입력할 수 있다.
- 사용자가 category/mode/template을 선택할 수 있다.
- 앱이 15초/30초/60초 mock 대본을 생성한다.
- 앱이 storyboard scenes를 생성한다.
- 앱이 title/thumbnail copy/description/hashtags를 생성한다.
- 앱이 9:16 chart/image brief 또는 placeholder card를 생성한다.
- 앱이 Money-OS CTA를 생성한다.
- 금융표현 검수 엔진이 위험 문구를 감지한다.
- 사용자가 각 섹션을 수정하고 복사할 수 있다.
- UI는 앱에서는 프리미엄 SaaS 톤, 출력물에서는 균형형 프리미엄 금융 쇼츠 톤을 따른다.
- 이전 영상 제작 route가 UI나 code path에 나타나지 않는다.
