# Money Shorts OS PRD V1

Status: **ACTIVE PRD DRAFT — DIRECTION ALIGNMENT V1.1**

Updated: 2026-06-27

## 0. 해석 원칙

Owner가 여러 차례 보낸 방향 지시는 모두 참고하되, 서로 충돌하는 경우에는 **뒤쪽에 입력된 최신 지시를 우선 적용**한다.

현재 최신 기준:

- 초기 목표는 Money-OS 전체 서비스 완성이 아니라 **출처 기반 생활경제 쇼츠 제작 도구**다.
- Money-OS는 본체가 아니라 **필요할 때 붙는 CTA/전환 레이어와 생활 돈관리 행동 연결 장치**다.
- 완성 영상 자동 생성보다 **실제 쇼츠 제작에 바로 쓸 수 있는 콘텐츠 패키지 품질**을 먼저 검증한다.
- 브랜드 방향은 **경제번역소**, 콘텐츠 해석 톤은 **생활경제탐정**이다.
- 생활경제탐정은 실제 캐릭터가 아니라 경제 신호의 단서를 찾아 생활 영향으로 번역하는 해석 방식과 연출 문법이다.
- 콘텐츠 생성은 `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`의 `Data Source -> Fact Card -> Signal Translation Brief -> 6 Scene Cards -> multimodal package` 순서를 따른다.

## 0.1 Final Product Direction V1.1

Money Shorts OS는 단순 경제지표 설명기가 아니다.

경제 신호를 출처 기반으로 가져와, 사람들이 궁금해할 만한 후킹으로 열고, 현재 상황과 주요 원인 후보를 팩트 기반으로 설명하고, 전문가적 시선으로 지금 무엇을 봐야 하는지 해석한 뒤, 그 신호가 생활비·대출·소비·저축·투자 판단·환전·카드값·여행비·장바구니·고정비/변동비에 어떤 영향을 줄 수 있는지 연결하고, 마지막에는 개인이 지금 할 수 있는 점검 행동을 제시하는 **source-first 생활경제 쇼츠 제작 OS**다.

Authoritative content pipeline:

`Fact Card`
→ `Signal Translation Brief`
→ `6 Scene Cards`
→ `script / caption / image prompt / voice / screen text`
→ `risk review / final QA / owner gate`

MVP output is no longer just a script/storyboard bundle. The core artifact is a **Scene Card-based multimodal package** where narration, spoken captions, image prompts, screen text, voice timing, source notes, layout safe zones, and risk notes are derived from the same scene-level source.

## 1. 전체 PRD

### Product Name

Working name: **Money Shorts OS**

### Product Thesis

Money Shorts OS는 단순 돈관리 쇼츠 생성기나 경제지표 설명기가 아니다. 출처 기반 금융·경제 데이터를 수집하고, Fact Card로 사실성을 고정한 뒤, 경제 신호를 생활비·대출·소비·저축·투자 판단·환전·카드값·여행비·장바구니·고정비/변동비와 연결해 설명하고, 개인이 지금 할 수 있는 점검 행동까지 제시하는 생활경제 쇼츠 제작 OS다.

초기에는 B2B SaaS 전체 기능을 한 번에 만들지 않는다. 1차 목표는 Owner가 매일 사용할 수 있는 내부 쇼츠 제작 도구이며, 검증 이후 크리에이터용 SaaS로 확장한다.

### Target Users

- 자체 금융/경제 쇼츠를 운영하려는 Owner
- 재테크 인스타그램 운영자
- 경제 유튜버
- 세무사/회계사/금융 콘텐츠 운영자
- 콘텐츠 대행사
- 향후 Money-OS 일반 사용자 유입 채널 운영자

### Core Value

- 주제에서 바로 영상을 만들지 않는다.
- 먼저 출처 기반 Fact Card를 만들고, 그 다음 Signal Translation Brief로 경제 신호를 생활 돈관리 문제로 번역한다.
- 대본보다 먼저 6 Scene Cards를 만든다.
- Fact Card에 있는 숫자/사실만 사용하고, 생활 해석과 행동 지침은 Signal Translation Brief와 Scene Card에서 안전하게 파생한다.
- 대본, 자막, 이미지 프롬프트, 음성 타이밍, 화면 텍스트는 Scene Card 기준으로 함께 생성한다.
- 이후 고정된 프리미엄 금융 템플릿에 차트/이미지/자막/음성을 조립한다.
- Money-OS CTA는 관련성이 있을 때만 붙인다.
- 영상 품질보다 먼저 콘텐츠 구조, 대본 품질, CTA 전환 구조를 검증한다.

### Non-Goals

- MVP 1에서 영상 렌더링 구현하지 않음.
- MVP 1에서 자동 업로드 구현하지 않음.
- MVP 1에서 결제 구현하지 않음.
- MVP 1에서 Money-OS 전체 서비스 구현하지 않음.
- AI 영상 생성 품질에 의존하지 않음.
- 투자 추천/매수 권유 자동화로 설계하지 않음.

### Content Mix

초기 콘텐츠 비중:

- 출처 기반 금융·경제 쇼츠 70%
- Money-OS 연결형 돈관리 쇼츠 30%

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

- 월급
- 소비
- 카드값
- 비상금
- 저축
- 투자금 분리
- 돈이 안 모이는 이유
- Money-OS 전환 CTA

경제/금융 콘텐츠:

- 금리
- 환율
- 물가
- 공시
- 경제지표
- 출처 기반 해석

### Visual Tone

앱 UI:

- 신뢰감 있는 네이비/차콜/골드 기반의 프리미엄 SaaS 톤
- 금융 운영 도구처럼 차분하고 정돈된 레이아웃
- 과도한 랜딩 페이지식 장식보다 생성/검수/저장/복사 작업 효율 우선

쇼츠 영상 템플릿:

- 네이비/차콜/골드 기반의 프리미엄 금융 톤은 유지
- 모든 장면을 어둡고 무겁게 만들지 않음
- 밝은 카드형 배경
- 큰 숫자
- 짧은 문장
- 직관적인 차트
- 빠른 장면 전환
- 과하지 않은 골드 포인트
- 돈이 새는 장면, 돈이 정리되는 장면을 쉽게 이해되는 시각화로 표현
- 네이비/차콜은 전체 배경이 아니라 강조 섹션이나 엔딩 CTA에 사용
- Money Architect 세계관은 브랜드 시그니처로 활용
- 프리미엄 금융 데스크, 지갑, 카드, 현금, 봉투, 트레이는 핵심 장면에 사용
- 프리미엄 금융 데스크 장면은 모든 영상에 반복하지 않고 브랜드 시그니처 컷으로만 일부 사용

쇼츠 문법:

- 첫 1~2초 훅은 강하게
- 핵심 숫자는 크게
- 자막은 짧고 선명하게
- 장면 전환은 빠르게
- 설명은 쉽게
- CTA는 Money-OS 무료 진단으로 자연스럽게 연결

피해야 할 방향:

- 밈스럽고 가벼운 쇼츠
- 싸 보이는 AI 영상
- 과장 광고 느낌
- 지나치게 어둡고 느린 금융 리포트 느낌
- 텍스트가 너무 많은 설명형 콘텐츠

최종 목표는 **신뢰감 있지만 딱딱하지 않고, 후킹은 강하지만 과장하지 않으며, 경제 신호를 생활 돈관리 행동으로 번역하는 출처 기반 생활경제 쇼츠 제작 OS**다.

### Template Modes

#### Data Shorts Mode

- 출처 기반 금융·경제 쇼츠 기본 템플릿
- 금리, 환율, 물가, 고용, 소비, 공시, 실적, 경제지표 같은 주제
- 밝고 빠르고 직관적이되 밈스럽거나 싸 보이지 않는 쇼츠 톤
- MVP 기본값

#### Money-OS Support Mode

- 개인 돈관리와 자연스럽게 연결되는 경우에만 사용
- 월급관리, 소비습관, 카드값, 비상금, 투자금 분리, 돈이 새는 구조 같은 보조 주제
- CTA는 무료 진단/랜딩 연결까지만

#### Trust Mode

- 경제지표, 금리, 환율, 공시, 거시경제 해석 콘텐츠용
- 네이비/차콜/골드 기반의 신뢰감 있는 금융 리포트 톤
- 지나치게 어둡고 느린 증권사 리포트 느낌은 피함
- 전문 콘텐츠용 선택 템플릿

## 2. MVP 범위

### MVP 1 — Scene Card 기반 생활경제 콘텐츠 패키지 생성기

포함:

- 데이터 소스 선택
- 원본 데이터/공시 수동 입력 또는 수집
- 핵심 숫자 추출
- 전월/전년/이전 발표치 비교
- Fact Card 생성
- 출처 링크/출처명 저장
- Signal Translation Brief 생성
- 쇼츠 주제 생성
- curiosity hook 생성
- 핵심 메시지와 viewer takeaway 생성
- 6 Scene Cards 생성
- 15초/30초/60초 대본 생성
- 장면별 narration / caption / image prompt / voice timing / screen text 생성
- Caption System V1 기준 자막 문장 생성
- 썸네일 문구 생성
- YouTube 제목 생성
- Instagram Reels 문구 생성
- 설명문 생성
- 해시태그 생성
- Money-OS CTA 생성
- 투자권유/과장표현 위험 검수
- 9:16 차트/이미지 기획 또는 경량 생성 결과
- 콘텐츠 저장/수정/복사

제외:

- 실제 영상 렌더
- Gemini/Veo 영상 생성
- ElevenLabs TTS 생성
- 자동 업로드
- 결제/사용량 제한 실제 과금
- Money-OS 전체 서비스

MVP 1의 핵심 결과물:

- Fact Card
- 출처 링크/출처명
- Signal Translation Brief
- 6 Scene Cards
- 쇼츠 주제
- 핵심 메시지
- 15초/30초/60초 대본
- 장면별 multimodal spec
- 자막 문장과 captionBlocks
- 9:16 차트/이미지
- 썸네일 문구
- YouTube 제목
- Instagram Reels 문구
- 설명문
- 해시태그
- Money-OS CTA
- 금융표현 위험 검수 결과

### MVP 1.1 — Fixed 6-Scene Format

MVP 안정화를 위해 자유 포맷보다 6장면 고정 포맷을 우선한다.

1. **Hook**
   - 궁금증 유발.
   - 첫 장면 큰 제목/썸네일 역할.
   - 질문형/반전형/생활 연결형.
2. **Signal**
   - 출처 기반 경제 신호 제시.
   - 핵심 수치, 기간, 출처 요약.
   - 숫자는 Fact Card 범위 안에서만 사용.
3. **Why + Expert Interpretation**
   - 주요 원인 후보와 전문가적 해석.
   - 단정 원인 금지.
   - 지금 무엇을 봐야 하는지 제시.
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

### Caption System V1

1080x1920 세로 영상 기준:

- Hook Title: `x 90~990`, `y 300~620`, 2줄 이하, `74~88px`.
- Scene Label: `x 80~420`, `y 180~250`, `30~38px`.
- Spoken Caption: `x 90~880`, `y 1180~1480`, `52~64px`, 1~2줄, 내레이션의 축약/파생본.
- Source Note: `x 90~760`, `y 1500~1560`, `24~30px`.
- 피해야 할 영역: `y 0~150`, `y 1600~1920`, `x 900~1080`.
- 폰트: Pretendard 또는 Noto Sans KR. Hook Title Bold/ExtraBold, Spoken Caption SemiBold/Medium, Source Note Regular.
- 강조색: amber/warm yellow 1개 중심, 한 화면 강조 단어 1~2개 이하.

### Image Style V1

- 에디토리얼 생활경제 리포트 스타일.
- 생활 오브젝트 + 경제 신호 카드 + 탐정식 단서 연출.
- 실제 탐정 캐릭터가 아니라 단서 카드, 연결선, 체크 표시, 신호 카드, 생활 오브젝트 배치로 해석 느낌을 준다.
- 색감: off-white, light gray, charcoal navy, dark navy/charcoal, amber/warm yellow.
- 금지: 매번 다른 화풍, 과한 프리미엄 금융 광고풍, 과한 골드, 공포 분위기, 투자 수익 암시, 대본과 무관한 추상 그래프 배경, 이미지 안 검증되지 않은 숫자/문구 삽입.

### MVP 2 — 이미지/차트 생성 고도화

- 9:16 숫자 카드
- 9:16 경제 차트
- 썸네일 이미지
- 출처 표시 영역
- 브랜드 컬러/폰트/레이아웃 통일

### MVP 3 — 영상 템플릿

초기 3개만:

1. 월급이 사라지는 이유
2. 돈이 새는 구조
3. Money-OS 해결 구조

Remotion은 이 단계에서 도입 검토한다.

## 3. DB 스키마 초안

MVP 1 중심 엔티티:

- `profiles`: 사용자 프로필
- `workspaces`: 개인/팀 작업공간
- `source_providers`: 데이터 출처 제공자
- `raw_data_snapshots`: 원본 데이터/공시 스냅샷
- `economic_indicators`: 경제지표 메타/최신값
- `disclosure_documents`: 공시/실적 문서
- `fact_cards`: 쇼츠 생성 전 핵심 사실 카드
- `source_citations`: 출처 표기
- `shorts_packages`: 하나의 쇼츠 콘텐츠 패키지
- `video_blueprints`: Fact Card 기반 영상 설계도
- `shorts_scripts`: 15/30/60초 대본 버전
- `storyboard_scenes`: 장면별 스토리보드
- `caption_lines`: 자막 문장
- `cta_templates`: Money-OS CTA 템플릿
- `risk_rules`: 위험표현/금지표현 룰
- `risk_scan_results`: 생성물 검수 결과
- `source_references`: 출처 메타데이터
- `visual_assets`: 9:16 차트/숫자카드/썸네일 결과 또는 생성 계획
- `generated_charts`: Fact Card 기반 차트/숫자 카드
- `risk_reviews`: 금융표현 위험 검수 결과
- `performance_metrics`: 쇼츠별 수동 성과/전환 지표
- `exports`: 복사/내보내기 기록
- `usage_events`: 생성량/사용량 기록

MVP 2 이후:

- `video_templates`: Remotion 템플릿 정의
- `render_jobs`: 렌더 작업
- `subscriptions`: 결제 플랜 상태

## 4. 페이지 구조

User pages:

- `/dashboard`
- `/ideas`
- `/generator`
- `/library`
- `/library/[id]`
- `/charts`
- `/templates`
- `/cta`
- `/compliance`
- `/analytics`
- `/money-os/free-diagnosis`
- `/money-os/free-diagnosis/result`
- `/settings`

Admin pages:

- `/admin/users`
- `/admin/billing`
- `/admin/api-usage`
- `/admin/content-usage`
- `/admin/risk-rules`
- `/admin/templates`
- `/admin/data-sources`

MVP 1에서 실제 구현 우선:

- Dashboard
- 쇼츠 생성기
- 대본 보관함
- Money-OS CTA 관리
- 금융표현 검수
- Money-OS 무료 진단 랜딩 초안

## 5. 핵심 유저 플로우

### Flow A — 콘텐츠 패키지 생성

1. 사용자가 주제 입력
2. 콘텐츠 목표 선택: 조회수 / 저장 / Money-OS 진단 유도
3. 난이도 선택: 초보 / 중급 / 전문가
4. 앱이 아이디어와 핵심 메시지 생성
5. 15초/30초/60초 대본 생성
6. 장면별 스토리보드 생성
7. 제목/썸네일/설명/해시태그 생성
8. Money-OS CTA 자동 매핑
9. 위험표현 검수
10. 사용자가 수정 후 저장/복사

### Flow B — 위험표현 검수

1. 생성된 대본/제목/설명/CTA를 스캔
2. 위험 표현 감지
3. 위험도 표시: low / medium / high / blocked
4. 대체 문구 제안
5. 사용자가 적용 또는 수동 수정

### Flow C — Money-OS CTA 연결

1. 콘텐츠 주제를 분류
2. 연결 가능한 Money-OS 기능 추천
3. 무료 진단 CTA 생성
4. 랜딩 문구와 버튼 문구 생성
5. 패키지에 CTA 저장

### Flow D — 9:16 차트/이미지 패키지 생성

1. 콘텐츠 유형 선택: 출처 기반 금융·경제 / Money-OS 연결형 돈관리
2. 템플릿 모드 선택: Data Shorts Mode / Trust Mode / Money-OS Support Mode
3. 9:16 숫자 카드 또는 차트 브리프 생성
4. 출처 표시 영역과 핵심 숫자 확인
5. 썸네일 문구와 함께 패키지에 저장

### Flow E — 전환 중심 성과 기록

1. 쇼츠 업로드 후 수동으로 성과 입력
2. 조회수, 저장률, 프로필 클릭, 랜딩 클릭 기록
3. 무료 진단 시작/완료, 유료 결제 전환 기록
4. CTA별/주제별 전환율 확인

## 6. Supabase 테이블 설계

Source-first 핵심 테이블 상세는 `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`를 우선 적용한다.

필수 데이터 구조:

- `source_providers`
- `raw_data_snapshots`
- `economic_indicators`
- `disclosure_documents`
- `fact_cards`
- `source_citations`
- `generated_scripts`
- `generated_charts`
- `risk_reviews`
- `video_blueprints`

### `profiles`

- `id uuid primary key references auth.users(id)`
- `email text`
- `display_name text`
- `role text default 'user'`
- `created_at timestamptz`

### `workspaces`

- `id uuid primary key`
- `owner_id uuid references profiles(id)`
- `name text`
- `created_at timestamptz`

### `shorts_packages`

- `id uuid primary key`
- `workspace_id uuid references workspaces(id)`
- `user_id uuid references profiles(id)`
- `topic text not null`
- `content_category text` -- money_management / economic_indicator
- `template_mode text` -- viral / trust
- `template_key text` -- salary_disappears / money_leak / money_os_solution
- `audience_level text`
- `content_goal text`
- `core_message text`
- `money_os_cta text`
- `status text default 'draft'`
- `risk_status text default 'unchecked'`
- `created_at timestamptz`
- `updated_at timestamptz`

### `shorts_scripts`

- `id uuid primary key`
- `package_id uuid references shorts_packages(id) on delete cascade`
- `duration_sec int`
- `script_text text`
- `hook text`
- `closing text`
- `created_at timestamptz`

### `storyboard_scenes`

- `id uuid primary key`
- `package_id uuid references shorts_packages(id) on delete cascade`
- `scene_index int`
- `duration_sec numeric`
- `visual_brief text`
- `caption_text text`
- `source_note text`

### `caption_lines`

- `id uuid primary key`
- `package_id uuid references shorts_packages(id) on delete cascade`
- `line_index int`
- `caption_text text`
- `scene_index int`

### `cta_templates`

- `id uuid primary key`
- `workspace_id uuid references workspaces(id)`
- `topic_category text`
- `money_os_feature text`
- `cta_text text`
- `landing_path text`
- `is_active boolean default true`

### `risk_rules`

- `id uuid primary key`
- `pattern text not null`
- `severity text not null`
- `replacement text`
- `description text`
- `is_active boolean default true`

### `risk_scan_results`

- `id uuid primary key`
- `package_id uuid references shorts_packages(id) on delete cascade`
- `target_field text`
- `matched_text text`
- `severity text`
- `suggested_replacement text`
- `resolved boolean default false`

### `source_references`

- `id uuid primary key`
- `package_id uuid references shorts_packages(id) on delete cascade`
- `source_name text`
- `source_url text`
- `source_type text`
- `rights_note text`
- `used_in text`

### `visual_assets`

- `id uuid primary key`
- `package_id uuid references shorts_packages(id) on delete cascade`
- `asset_type text` -- number_card / chart / thumbnail / image_brief
- `template_mode text`
- `template_key text`
- `title text`
- `main_value text`
- `visual_brief text`
- `source_label text`
- `asset_url text`
- `data_payload jsonb`
- `created_at timestamptz`

### `performance_metrics`

- `id uuid primary key`
- `package_id uuid references shorts_packages(id) on delete cascade`
- `views int default 0`
- `saves int default 0`
- `profile_clicks int default 0`
- `landing_clicks int default 0`
- `diagnosis_starts int default 0`
- `diagnosis_completions int default 0`
- `paid_conversions int default 0`
- `cta_conversion_rate numeric`
- `topic_conversion_rate numeric`
- `recorded_at timestamptz`

### `exports`

- `id uuid primary key`
- `package_id uuid references shorts_packages(id) on delete cascade`
- `export_type text`
- `payload jsonb`
- `created_at timestamptz`

### `usage_events`

- `id uuid primary key`
- `workspace_id uuid references workspaces(id)`
- `user_id uuid references profiles(id)`
- `event_type text`
- `units int default 1`
- `metadata jsonb`
- `created_at timestamptz`

## 7. Next.js 폴더 구조

```txt
app/
  (app)/
    dashboard/page.tsx
    ideas/page.tsx
    generator/page.tsx
    library/page.tsx
    library/[id]/page.tsx
    cta/page.tsx
    compliance/page.tsx
    analytics/page.tsx
    money-os/
      free-diagnosis/page.tsx
      free-diagnosis/result/page.tsx
    settings/page.tsx
  admin/
    users/page.tsx
    billing/page.tsx
    api-usage/page.tsx
    content-usage/page.tsx
    risk-rules/page.tsx
    templates/page.tsx
    data-sources/page.tsx
  api/
    shorts-packages/generate/route.ts
    shorts-packages/[id]/route.ts
    compliance/scan/route.ts
components/
  app-shell/
  shorts-generator/
  package-editor/
  storyboard/
  compliance/
  cta/
  ui/
lib/
  supabase/
  ai/
  shorts/
  compliance/
  cta/
  sources/
  usage/
  visuals/
types/
  shorts.ts
  database.ts
```

## 8. 구현 우선순위

1. PRD/spec 확정
2. Supabase schema/migration 설계
3. App shell + navigation
4. Shorts package data model
5. Rule-based financial expression scanner
6. Mock content package generator
7. Package editor/save/copy
8. CTA template manager
9. 9:16 card/chart mock generator
10. Money-OS free diagnosis landing stub
11. Conversion metric manual input
12. LLM provider integration
13. Usage tracking
14. MVP 2 image/chart generator hardening
15. MVP 3 Remotion templates

Important:

- DB migration, env, dependency, payment, external API integration require explicit Owner approval before implementation.

## 9. Claude Code 개발 작업 단위

Recommended atomic tasks:

1. `money-shorts-os-docs-prd-schema-v1`
   - PRD/spec/schema 문서 정리 only.
2. `money-shorts-os-app-shell-v1`
   - App Router shell, sidebar nav, placeholder pages.
3. `money-shorts-os-types-and-mock-data-v1`
   - TypeScript types, mock package schema, no DB.
4. `money-shorts-os-compliance-engine-v1`
   - 위험표현 rule engine and tests.
5. `money-shorts-os-generator-mock-v1`
   - mock content package generation, no external AI.
6. `money-shorts-os-package-editor-v1`
   - edit/save/copy UI with local/mock persistence.
7. `money-shorts-os-visual-card-mock-v1`
   - 9:16 number/chart/thumbnail mock cards, no external image API.
8. `money-shorts-os-money-os-landing-stub-v1`
   - free diagnosis landing stub and CTA route, no payment.
9. `money-shorts-os-performance-metrics-manual-v1`
   - manual conversion metrics input and dashboard cards.
10. `money-shorts-os-supabase-schema-v1`
   - Supabase schema/migration, Owner approval required.
11. `money-shorts-os-ai-provider-v1`
   - LLM integration, env approval required.
12. `money-shorts-os-cta-manager-v1`
   - CTA template CRUD.
13. `money-shorts-os-usage-gate-v1`
   - generation usage tracking and plan-ready limits.

## 10. 첫 번째 개발 스프린트 계획

### Sprint Goal

영상 없이도 “금융 쇼츠 콘텐츠 패키지”가 앱 안에서 생성·검수·저장·복사되는 MVP skeleton을 만든다.

### Sprint 1 Scope

Include:

- App shell
- Dashboard placeholder
- Shorts Generator page
- Library page
- Package detail/editor page
- Financial expression scanner
- Mock generator output
- Template mode selector: Data Shorts Mode / Trust Mode / Money-OS Support Mode
- Initial template selector: 월급이 사라지는 이유 / 돈이 새는 구조 / Money-OS 해결 구조
- Copy/export buttons
- Basic CTA mapping
- 9:16 visual card placeholder output
- Money-OS free diagnosis landing stub

Exclude:

- Real AI calls
- Supabase migration unless separately approved
- Remotion/video render
- GPT image/Veo/ElevenLabs calls
- Toss Payments
- upload/post

### Sprint 1 Acceptance Criteria

- User can enter a topic.
- User can select content category: money management / economic finance.
- User can select template mode: Viral / Trust.
- App produces mock 15/30/60s scripts.
- App produces storyboard scenes.
- App produces title, thumbnail copy, description, hashtags.
- App produces 9:16 chart/image brief or placeholder card.
- App produces Money-OS CTA.
- Risk scanner flags dangerous phrases.
- User can edit generated content.
- User can copy sections.
- App UI follows premium finance SaaS tone.
- Shorts package output follows balanced premium finance shorts tone: fast and intuitive, but not meme-like or cheap.
- No old Candidate10/Jun/static slideshow route appears in UI or code.

### Sprint 1 Risks

- Starting real AI too early will hide product structure problems.
- Adding video rendering too early will repeat prior quality failure.
- Financial expression scanner must be conservative.
- UI must feel like a finance operating tool, not a flashy landing page.
