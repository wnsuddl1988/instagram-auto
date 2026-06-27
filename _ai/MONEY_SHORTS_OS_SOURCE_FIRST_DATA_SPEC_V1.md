# Money Shorts OS Source-First Data Spec V1

Status: **ACTIVE SOURCE-FIRST CORE SPEC — DIRECTION ALIGNMENT V1.1**

Updated: 2026-06-27

## 1. Product Identity Correction

Money Shorts OS의 본체는 돈관리 쇼츠 생성기가 아니다.

최종 제품 정의:

경제 신호를 출처 기반으로 수집하고, 핵심 사실을 Fact Card로 고정한 뒤, Signal Translation Brief와 Scene Card를 통해 생활비·대출·소비·저축·투자 판단·환전·카드값·여행비·장바구니·고정비/변동비에 미치는 의미와 대응 행동까지 번역하는 **source-first 생활경제 쇼츠 제작 OS**다.

Money-OS는 이 쇼츠 제작 OS의 보조 수익화/전환 레이어다.

## 2. Content Mix

콘텐츠 비중:

- 출처 기반 금융·경제 쇼츠: 70%
- Money-OS 연결형 돈관리 쇼츠: 30%

돈관리 콘텐츠는 삭제하지 않는다. 단, 보조 카테고리로 둔다.

## 3. Core Content Categories

핵심 금융·경제 데이터 콘텐츠:

- 금리
- 환율
- 물가
- 고용
- 소비
- 경기지표
- 한국은행 경제통계
- 통계청/KOSIS 통계
- 금융위원회/금융공공데이터
- OpenDART 공시
- FRED 미국 경제지표
- 기업 공시/실적/재무정보
- 경제 이슈를 출처 기반으로 해석한 쇼츠

보조 돈관리 콘텐츠:

- 월급관리
- 소비습관
- 카드값
- 비상금
- 투자금 분리
- 돈이 새는 구조
- Money-OS 무료 진단 CTA

## 4. Source-First Generation Order

각 쇼츠는 반드시 Fact Card를 먼저 만든 뒤 대본을 생성한다.

생성 순서:

1. 데이터 소스 선택
2. 원본 데이터 또는 공시 수집
3. 핵심 숫자 추출
4. 전월/전년/이전 발표치 비교
5. Fact Card 생성
6. 출처 링크/출처명 저장
7. Signal Translation Brief 생성
8. 6 Scene Cards 생성
9. Scene Card에서 script / caption / image prompt / voice / screen text 파생
10. 9:16 차트/숫자 카드 또는 이미지 브리프 생성
11. 금융표현/과장표현/멀티모달 일관성 QA
12. Owner gate
13. Money-OS CTA는 필요한 경우에만 삽입

핵심 원칙:

- AI는 원본 데이터를 상상해서 대본을 쓰면 안 된다.
- AI는 반드시 Fact Card에 있는 내용만 기반으로 대본을 작성한다.
- 금융·경제 쇼츠에서 중요한 것은 그럴듯한 설명이 아니라 **출처 있는 사실**이다.
- 생활 영향과 행동 지침은 Fact Card 자체를 오염시키지 않고 Signal Translation Brief에서 다룬다.
- 자막, 이미지, 음성, 화면 텍스트는 따로 생성하지 않고 Scene Card 기준으로 함께 파생한다.

## 5. Source Providers

초기 설계 대상:

- 한국은행 ECOS
- 통계청/KOSIS
- 금융위원회/금융공공데이터
- OpenDART
- FRED
- 기업 IR/실적/재무정보
- 수동 입력 데이터

초기 MVP 구현 원칙:

- API 자동 연동 전에 수동 데이터 입력 기반 Fact Card MVP를 먼저 만든다.
- ECOS/KOSIS/OpenDART/FRED 연동 계획은 핵심 설계 대상이다.
- 실제 API 호출, env/secret, dependency, DB migration은 별도 Owner 승인 후 진행한다.

## 6. Fact Card Schema

Fact Card는 대본 생성의 근거가 되는 최소 사실 단위다.

Fact Card 책임:

- 사실, 수치, 출처, 기간, citation, `allowedClaims`, `blockedClaims`의 근거.
- 생활경제 해석과 창작 표현을 과도하게 넣지 않는다.
- 개인 행동 지침, 전망 시나리오, 후킹 문구는 Fact Card가 아니라 Signal Translation Brief 또는 Scene Card에서 다룬다.

필수 필드:

- `fact_card_id`
- `source_provider_id`
- `source_name`
- `source_url`
- `published_date`
- `data_period`
- `indicator_name`
- `current_value`
- `previous_value`
- `comparison_type` -- previous_month / previous_year / previous_release / consensus / custom
- `change_value`
- `change_rate`
- `unit`
- `interpretation`
- `caution_note`
- `allowed_claims`
- `blocked_claims`
- `source_citation_ids`

예시:

```json
{
  "indicator_name": "소비자물가 상승률",
  "current_value": "2.7",
  "previous_value": "2.9",
  "unit": "%",
  "comparison_type": "previous_month",
  "change_value": "-0.2",
  "change_rate": "-6.9%",
  "interpretation": "물가 상승률은 전월보다 둔화됐지만 생활비 부담은 여전히 남아 있다.",
  "caution_note": "단일 지표만으로 경기 방향이나 투자 판단을 확정할 수 없다."
}
```

## 6.1 Signal Translation Brief

Signal Translation Brief는 경제 신호를 생활 돈관리 문제로 번역하는 중간 layer다.

권장 필드:

- `signalSummary`: 이 신호가 무엇인지.
- `keyReasons`: 주요 원인 후보. 단정 원인이 아니라 후보/맥락으로 표현한다.
- `expertInterpretation`: 전문가적 해석. 과도한 예측이나 투자 판단으로 가지 않는다.
- `affectedMoneyAreas`: 생활비, 대출, 소비, 저축, 투자 판단, 환전, 카드값, 여행비, 장바구니, 고정비/변동비 등.
- `lifeImpact`: 시청자의 생활 돈 문제와 어떻게 연결되는지.
- `volatilityWatch`: 앞으로 지켜볼 변동성 포인트.
- `scenarioBasedOutlook`: 상승/하락/유지 등 시나리오 기반 전망. deterministic forecast 금지.
- `recommendedActions`: 개인이 지금 할 수 있는 점검 행동.
- `actionUrgency`: 지금/이번 달/다음 발표 전 등 행동 우선순위.
- `audienceSituation`: 대출자, 환전 예정자, 카드값 부담층, 장바구니 물가 민감층 등.
- `actionBoundaries`: 직접 투자 조언, 수익 보장, 매수/매도 권유를 피하기 위한 경계.
- `viewerTakeaway`: 마지막에 남길 한 줄 결론.

원칙:

- Fact Card의 숫자와 출처를 확장하지 않는다.
- 생활 영향은 과장하지 않는다.
- recommendedActions는 생활 점검 행동이어야 하며 투자 추천이 아니어야 한다.

## 6.2 Scene Card Data Boundary

Scene Card는 장면별 단일 명세서다.

Scene Card에서 함께 파생되는 항목:

- narration
- spoken caption
- captionBlocks
- image prompt
- visualTemplateId
- screen text
- voiceTiming
- sourceCitationIds
- source note
- imageTextPolicy
- layoutSafeZone
- risk notes

Scene Card는 대본/자막/이미지/음성을 따로 생성해서 맞추는 방식이 아니라, 장면 목적 하나에서 모든 multimodal output을 함께 만든다.

## 7. Video Blueprint / Scene Card Source Fields

Video Blueprint와 각 scene은 source/fact 정보를 반드시 참조한다.

Root-level required fields:

- `fact_card_ids`
- `signal_translation_brief_id`
- `source_citation_ids`
- `data_confidence`
- `source_summary`
- `cta_policy`
- `viewer_takeaway`

Scene or fact-linked fields:

- `source_name`
- `source_url`
- `published_date`
- `data_period`
- `indicator_name`
- `current_value`
- `previous_value`
- `change_rate`
- `interpretation`
- `caution_note`
- `affected_money_areas`
- `recommended_actions`
- `scenario_based_outlook`
- `source_citation_ids`
- `image_text_policy`

## 8. Money-OS CTA Policy

Money-OS CTA는 모든 쇼츠에 억지로 붙이지 않는다.

CTA를 붙이는 경우:

- 개인 돈관리와 연결되는 주제
- 소비/저축/비상금/투자금 분리와 연결되는 주제
- 경제지표를 개인 재무관리 관점으로 해석할 수 있는 주제

CTA를 붙이지 않거나 약하게 처리하는 경우:

- 순수 경제지표 요약
- 공시/실적 핵심 숫자 정리
- 특정 기업/산업의 데이터 기반 설명
- 투자 판단으로 오해될 수 있는 콘텐츠

예시:

- 주제: 소비자물가 상승률 변화
- 본문: 물가 지표 변화와 생활비 부담을 출처 기반으로 설명
- CTA: 생활비가 늘어날수록 돈의 흐름을 먼저 점검해야 합니다. 내 돈 구조가 궁금하다면 Money-OS 무료 진단을 받아보세요.

## 9. Required Supabase Tables

초기 MVP에서 최소한 아래 데이터 구조를 설계한다.

### `source_providers`

- `id uuid primary key`
- `name text not null`
- `provider_type text` -- ecos / kosis / opendart / fred / public_finance / manual
- `base_url text`
- `rights_note text`
- `requires_api_key boolean default false`
- `is_active boolean default true`
- `created_at timestamptz`

### `raw_data_snapshots`

- `id uuid primary key`
- `source_provider_id uuid references source_providers(id)`
- `source_name text`
- `source_url text`
- `fetched_at timestamptz`
- `published_date date`
- `data_period text`
- `raw_payload jsonb`
- `checksum text`
- `collection_method text` -- manual / api / upload

### `economic_indicators`

- `id uuid primary key`
- `source_provider_id uuid references source_providers(id)`
- `indicator_code text`
- `indicator_name text`
- `category text`
- `unit text`
- `country text`
- `frequency text`
- `latest_period text`
- `latest_value numeric`
- `previous_value numeric`
- `change_value numeric`
- `change_rate numeric`
- `updated_at timestamptz`

### `disclosure_documents`

- `id uuid primary key`
- `source_provider_id uuid references source_providers(id)`
- `company_name text`
- `stock_code text`
- `document_title text`
- `document_type text`
- `published_at timestamptz`
- `source_url text`
- `summary text`
- `key_numbers jsonb`
- `raw_snapshot_id uuid references raw_data_snapshots(id)`

### `fact_cards`

- `id uuid primary key`
- `workspace_id uuid references workspaces(id)`
- `source_provider_id uuid references source_providers(id)`
- `raw_snapshot_id uuid references raw_data_snapshots(id)`
- `indicator_id uuid references economic_indicators(id)`
- `disclosure_document_id uuid references disclosure_documents(id)`
- `topic text`
- `indicator_name text`
- `current_value text`
- `previous_value text`
- `comparison_type text`
- `change_value text`
- `change_rate text`
- `unit text`
- `published_date date`
- `data_period text`
- `interpretation text`
- `caution_note text`
- `allowed_claims jsonb`
- `blocked_claims jsonb`
- `created_at timestamptz`

### `source_citations`

- `id uuid primary key`
- `fact_card_id uuid references fact_cards(id) on delete cascade`
- `source_name text`
- `source_url text`
- `published_date date`
- `data_period text`
- `citation_label text`
- `used_in text` -- script / chart / caption / description / video_overlay

### `generated_scripts`

- `id uuid primary key`
- `fact_card_id uuid references fact_cards(id)`
- `blueprint_id uuid`
- `duration_sec int`
- `narration text`
- `captions jsonb`
- `description text`
- `risk_status text`
- `created_at timestamptz`

### `generated_charts`

- `id uuid primary key`
- `fact_card_id uuid references fact_cards(id)`
- `chart_type text`
- `title text`
- `data_payload jsonb`
- `image_url text`
- `source_citation_id uuid references source_citations(id)`
- `created_at timestamptz`

### `risk_reviews`

- `id uuid primary key`
- `fact_card_id uuid references fact_cards(id)`
- `blueprint_id uuid`
- `target_type text`
- `target_id text`
- `risk_level text`
- `matched_terms jsonb`
- `suggested_replacements jsonb`
- `status text`
- `created_at timestamptz`

### `video_blueprints`

- `id uuid primary key`
- `workspace_id uuid references workspaces(id)`
- `fact_card_id uuid references fact_cards(id)`
- `title text`
- `topic text`
- `content_type text`
- `target_duration_sec int`
- `core_message text`
- `source_summary text`
- `money_os_cta text`
- `cta_policy text` -- none / soft / direct
- `scenes jsonb`
- `status text`
- `created_at timestamptz`

## 10. Next Implementation Step

다음 atomic task:

`money-shorts-os-source-fact-card-types-v1`

범위:

- 외부 API 없이 source/fact card TypeScript types 작성
- 수동 입력 기반 Fact Card mock 생성
- Fact Card 기반 Video Blueprint 입력 구조 정의
- ECOS/KOSIS/OpenDART/FRED live 연동은 하지 않음
- DB migration은 하지 않음
