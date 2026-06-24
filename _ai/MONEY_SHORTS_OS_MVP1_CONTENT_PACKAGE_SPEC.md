# Money Shorts OS MVP1 Content Package Spec

Status: **ACTIVE MVP1 SPEC**

Updated: 2026-06-25

## 1. Goal

MVP1은 완성 영상 자동 생성기가 아니다.

목표는 Owner가 매일 쇼츠 제작에 바로 사용할 수 있는 **출처 기반 금융·경제 쇼츠 콘텐츠 패키지 생성기**를 만드는 것이다.

Money-OS는 본체가 아니라 보조 전환 레이어다. 초기 Money-OS 연결은 다음까지만 포함한다:

- Money-OS CTA 생성
- 무료 진단 랜딩 stub
- 무료 진단 시작/완료/결제 전환을 추적할 수 있는 데이터 구조

## 2. Latest Direction Priority

Owner 지시는 모두 참고하되, 충돌 시 최신 지시를 우선한다.

현재 최신 기준:

- 내부 제작 도구 먼저, SaaS 확장은 이후.
- 쇼츠 자동 영상 렌더보다 콘텐츠 패키지 품질 검증 먼저.
- 콘텐츠 중심축은 돈관리가 아니라 출처 기반 금융·경제 데이터다.
- 각 쇼츠는 Fact Card를 먼저 만든 뒤 대본을 생성한다.
- 앱 UI는 프리미엄 금융 SaaS 톤.
- 쇼츠 출력물은 “균형형 프리미엄 금융 쇼츠” 톤.
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
- Video Blueprint
- 쇼츠 주제
- 핵심 메시지
- 15초 대본
- 30초 대본
- 60초 대본
- 장면별 스토리보드
- 자막 문장
- 9:16 차트/이미지 브리프 또는 경량 카드 결과
- 썸네일 문구
- YouTube 제목
- Instagram Reels 문구
- 설명문
- 해시태그
- Money-OS CTA
- 금융표현 위험 검수 결과

## 5. Script Structure

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

## 6. Storyboard Scene Model

각 scene은 아래 필드를 가진다:

- `scene_index`
- `duration_sec`
- `scene_goal`
- `visual_type`: `number_card` | `chart` | `money_leak` | `money_structure` | `cta_card`
- `visual_brief`
- `caption_text`
- `narration_text`
- `source_note`
- `risk_note`

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
- title
- description
- CTA
- hashtags

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
