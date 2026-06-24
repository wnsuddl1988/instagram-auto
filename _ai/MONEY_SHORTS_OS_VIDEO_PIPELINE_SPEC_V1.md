# Money Shorts OS Video Pipeline Spec V1

Status: **ACTIVE PIPELINE SPEC**

Updated: 2026-06-25

## 0. Core Principle

Money Shorts OS는 AI에게 영상을 통째로 만들게 하지 않는다.

AI에게 원본 데이터 없이 대본을 상상하게 하지 않는다.

먼저 **Fact Card**를 만들고, 그 Fact Card를 바탕으로 **Video Blueprint**를 만들게 한다. 최종 영상은 고정 템플릿, GPT 이미지, 차트/숫자 카드, ElevenLabs 음성, 자막, ffmpeg 조립, QA로 안정화한다.

핵심 순서:

`Data Source` → `Raw Data / Disclosure` → `Fact Card` → `Video Blueprint` → `대본/자막/화면 설계` → `이미지/영상 생성` → `ElevenLabs 음성` → `음성 길이 측정` → `타임라인 재계산` → `ffmpeg 조립` → `QA`

## 1. 영상 생성 전체 파이프라인

쇼츠 1편 생성 순서:

1. 데이터 소스 선택
2. 원본 데이터 또는 공시 수집
3. 핵심 숫자 추출
4. 전월/전년/이전 발표치 비교
5. Fact Card 생성
6. 출처 링크/출처명 저장
7. 쇼츠 주제 생성
8. Video Blueprint 생성
9. 15초/30초/60초 대본 생성
10. 자막 생성
11. 9:16 차트/숫자 카드 생성
12. GPT 이미지 생성
13. ElevenLabs 음성 생성
14. 음성 길이에 맞춰 타임라인 재계산
15. ffmpeg로 영상 조립
16. 금융표현/과장표현 최종 QA
17. Money-OS CTA는 필요한 경우에만 삽입

MVP 적용 원칙:

- 초기에는 수동 데이터 입력 기반 Fact Card와 콘텐츠 패키지 품질을 먼저 검증한다.
- 완성 영상 렌더는 Blueprint, 대본, 자막, QA가 안정된 뒤 붙인다.
- Veo/Gemini는 MVP 필수 기능이 아니며, 나중에 2-4초 시그니처 컷에 제한적으로 사용한다.

## 2. Video Blueprint JSON 스키마

Video Blueprint는 Fact Card를 영상 구조로 변환한 쇼츠 1편의 전체 설계도다.

```json
{
  "schema_version": "money_shorts_video_blueprint_v1",
  "video_id": "uuid",
  "title": "월급이 들어와도 돈이 안 모이는 이유",
  "topic": "월급이 들어와도 돈이 안 모이는 이유",
  "target_duration_sec": 30,
  "estimated_duration_sec": 30,
  "final_duration_sec": null,
  "core_message": "돈이 안 모이는 이유는 의지가 아니라 구조 부재일 수 있다.",
  "content_type": "economic_indicator",
  "template_mode": "data_shorts",
  "template_key": "indicator_summary",
  "fact_card_ids": [],
  "source_citation_ids": [],
  "source_summary": "",
  "cta_policy": "none",
  "money_os_cta": null,
  "tone": [
    "balanced_premium_finance",
    "trustworthy",
    "clear",
    "not_meme_like",
    "not_too_heavy",
    "not_ad_like"
  ],
  "target_audience": "beginner",
  "risk_level": "unchecked",
  "source_references": [],
  "voice_profile_id": "money_architect_voice",
  "scenes": []
}
```

### Root Fields

- `schema_version`: Blueprint schema version.
- `video_id`: internal id.
- `title`: working title.
- `topic`: Owner/user input.
- `target_duration_sec`: 15 / 30 / 60.
- `estimated_duration_sec`: pre-TTS estimated duration.
- `final_duration_sec`: post-TTS measured final duration.
- `core_message`: one-sentence idea.
- `content_type`: content category.
- `template_mode`: `viral` / `trust`.
- `template_key`: initial template key.
- `fact_card_ids`: source-backed fact cards used for the video.
- `source_citation_ids`: citations used in script/chart/video overlay.
- `source_summary`: short source summary shown in package.
- `cta_policy`: `none` / `soft` / `direct`.
- `money_os_cta`: optional CTA copy.
- `tone`: tone constraints.
- `target_audience`: `beginner` / `intermediate` / `expert`.
- `risk_level`: `unchecked` / `low` / `medium` / `high` / `blocked`.
- `source_references`: data/source metadata.
- `voice_profile_id`: ElevenLabs voice profile.
- `scenes`: ordered scene list.

### Content Types

- `interest_rate`
- `exchange_rate`
- `inflation`
- `employment`
- `consumption`
- `economic_indicator`
- `disclosure_summary`
- `earnings_summary`
- `salary_management`
- `spending_control`
- `emergency_fund`
- `investment_separation`
- `money_leak`
- `money_os_solution`

### Scene Schema

```json
{
  "scene_id": "s1",
  "scene_index": 1,
  "scene_role": "hook",
  "estimated_start_time": 0,
  "estimated_duration": 2,
  "actual_start_time": null,
  "actual_duration": null,
  "narration": "월급이 부족해서 돈이 안 모이는 게 아닐 수 있습니다.",
  "tts_script": "월급이 부족해서\n돈이 안 모이는 게 아닐 수 있습니다.",
  "caption": "월급 문제가 아닙니다",
  "visual_description": "월급 입금 숫자 카드와 돈이 여러 방향으로 흩어질 준비를 하는 장면",
  "visual_type": "number_card",
  "image_prompt": null,
  "video_prompt": null,
  "motion_type": "card_slide",
  "caption_style": "bold_short_center_lower",
  "audio_emphasis": "strong_hook",
  "fact_card_id": null,
  "source_name": null,
  "source_url": null,
  "published_date": null,
  "data_period": null,
  "indicator_name": null,
  "current_value": null,
  "previous_value": null,
  "change_rate": null,
  "interpretation": null,
  "caution_note": null,
  "source_note": null,
  "qa_rules": [
    "caption_max_two_lines",
    "no_investment_advice",
    "no_text_inside_generated_image"
  ]
}
```

### Scene Roles

- `hook`
- `problem`
- `reason`
- `structure`
- `solution`
- `example`
- `money_os_cta`

### Visual Types

- `gpt_image`
- `chart_card`
- `number_card`
- `veo_clip`
- `static_background`
- `cta_card`

### Motion Types

- `slow_zoom_in`
- `subtle_pan`
- `card_slide`
- `chart_reveal`
- `money_flow_animation`
- `cut_transition`
- `fade_to_cta`

## 3. 30초 쇼츠 기본 템플릿

30초 쇼츠는 기본 6장면으로 구성한다.

| Scene | Time | Role | Goal | Default Visual |
|---|---:|---|---|---|
| 1 | 0-2s | hook | 멈추게 만들기 | 큰 숫자/강한 문제 카드 |
| 2 | 2-6s | problem | 공감 만들기 | 돈이 흩어지는 장면 |
| 3 | 6-12s | reason | 원인 이해 | 뒤섞인 카드/현금/영수증 |
| 4 | 12-19s | structure | 구조적 해결 | 소비/비상금/투자 분리 구조 |
| 5 | 19-25s | example | 실제 적용 | Money Architect 시그니처 컷 |
| 6 | 25-30s | money_os_cta | 무료 진단 클릭 | Money-OS CTA 카드 |

예시 주제:

`월급이 들어와도 돈이 안 모이는 이유`

| Scene | Caption | Narration | Visual |
|---|---|---|---|
| 1 | 월급 문제가 아닙니다 | 월급이 부족해서 돈이 안 모이는 게 아닐 수 있습니다. | 월급 입금 숫자 카드 |
| 2 | 돈이 바로 흩어집니다 | 진짜 문제는 돈이 들어오자마자 어디론가 흩어진다는 겁니다. | 돈이 카드값/소비/이체 방향으로 갈라짐 |
| 3 | 구조가 없기 때문입니다 | 소비, 카드값, 비상금, 투자금이 한 공간에 섞이면 돈은 남기 어렵습니다. | 뒤섞인 카드, 영수증, 현금 |
| 4 | 먼저 자리를 나눠야 합니다 | 그래서 먼저 소비, 비상금, 투자금을 분리해야 합니다. | 소비/비상금/투자 트레이 |
| 5 | 의지가 아니라 설계입니다 | 돈 관리는 의지가 아니라 구조를 만드는 일입니다. | Money Architect가 돈을 정리하는 컷 |
| 6 | Money-OS 무료 진단 | 내 돈이 어디서 새고 있는지 궁금하다면 Money-OS 무료 진단을 받아보세요. | CTA 카드 |

## 4. 60초 쇼츠 기본 템플릿

60초 쇼츠는 8장면으로 구성한다.

| Scene | Time | Role | Goal |
|---|---:|---|---|
| 1 | 0-3s | hook | 강한 문제 제기 |
| 2 | 3-9s | context | 현실 상황 공감 |
| 3 | 9-17s | problem | 돈이 새는 지점 구체화 |
| 4 | 17-26s | reason | 구조 부재 설명 |
| 5 | 26-36s | solution | Money Architect 구조 제시 |
| 6 | 36-45s | example | 실제 적용 예 |
| 7 | 45-53s | recap | 핵심 메시지 반복 |
| 8 | 53-60s | money_os_cta | 무료 진단 유도 |

60초 원칙:

- 설명은 늘리되 자막은 길게 늘리지 않는다.
- 경제지표 콘텐츠는 Trust Mode를 사용할 수 있다.
- 기본은 Data Shorts Mode이며, 돈관리 콘텐츠는 Money-OS Support Mode로 보조 처리한다.
- CTA는 관련성이 있을 때만 마지막 5-7초에 명확하게 보인다.

## 5. ElevenLabs 보이스 프로필 설계

초기 MVP는 Main Voice 1개만 사용해도 된다.

### Main Voice: Money Architect Voice

한 줄 정의:

차분하지만 지루하지 않은 30-40대 남성 금융 설계자 목소리.

권장 특성:

- Korean
- male
- late 30s to early 40s feeling
- medium-low tone
- calm
- confident
- trustworthy
- warm but not soft
- clear pronunciation
- not too slow
- not ad-like
- not news-anchor-like

ElevenLabs Voice Library 검색 키워드:

- Korean male narrator
- calm
- confident
- corporate
- educational
- narration
- studio quality
- professional
- warm
- clear

피해야 할 보이스:

- 너무 밝은 광고톤
- 유튜브 광고 같은 과장톤
- 너무 느린 다큐멘터리 톤
- 딱딱한 뉴스 앵커톤
- 너무 젊고 가벼운 예능톤
- 감정이 과한 목소리

### Sub Voice: Warm Mentor Voice

사용 범위:

- 월급관리
- 소비습관
- 비상금
- 돈관리 공감형 콘텐츠

초기 MVP에서는 보류 가능.

## 6. GPT 이미지 프롬프트 생성 규칙

GPT 이미지는 핵심 비주얼 컷에 사용한다.

사용 장면:

- 돈이 새는 장면
- 돈이 구조화되는 장면
- 월급이 분리되는 장면
- 카드값이 쌓이는 장면
- 비상금 봉투/트레이 장면
- Money Architect 세계관 장면
- 썸네일 이미지
- 엔딩 CTA 배경

공통 규칙:

- 9:16 vertical.
- balanced premium finance shorts tone.
- navy / charcoal / restrained gold accents.
- not all scenes dark or slow.
- premium finance desk, wallet, card, cash, envelope, tray.
- money flows, leaks, separates, or becomes structured.
- no cheap AI look.
- no fantasy/game/cartoon/chibi/mascot style.
- no text inside image.
- no numbers inside image.
- no labels, UI, logos, card numbers, source text, subtitles, or CTA inside image.

텍스트 처리:

- 이미지 안에는 글자를 넣지 않는다.
- 자막, 숫자, 출처, CTA는 ffmpeg 또는 Remotion 단계에서 오버레이한다.

Prompt output structure:

```json
{
  "scene_id": "s3",
  "image_prompt": "Vertical 9:16 premium finance scene...",
  "negative_rules": [
    "no text",
    "no logos",
    "no labels",
    "no numbers",
    "no cartoon",
    "no fantasy"
  ]
}
```

## 7. Veo/Gemini 사용 범위 정의

Veo/Gemini 영상 자동화는 남기되, 전체 영상을 AI 영상으로 만들지 않는다.

사용 가능:

- 2-4초 오프닝 강조 컷
- 돈이 흩어지는 짧은 컷
- 현금이 정리되는 짧은 컷
- Money Architect 시그니처 컷
- 엔딩 브랜드 컷

권장 비율:

- GPT 이미지/카드/차트: 60-70%
- 차트/숫자 카드: 20-25%
- Veo/Gemini 짧은 영상 컷: 10-15%

금지:

- 30초 전체 AI 영상 생성
- 장면마다 다른 캐릭터 등장
- 영상 안에 텍스트/숫자 생성
- 실제 차트나 금융 수치를 AI 영상 내부에 생성
- 매번 다른 스타일의 영상 생성

## 8. ffmpeg 조립 구조

ffmpeg는 창작 도구가 아니라 정확한 조립 도구다.

입력:

- `video_blueprint.json`
- `timeline.json`
- GPT image assets
- chart/number cards
- optional Veo/Gemini clips
- ElevenLabs narration audio
- optional BGM
- caption timing data

출력:

- final 1080x1920 mp4
- ffprobe report
- QA contact sheet / frame samples
- render manifest
- failure log when failed

ffmpeg responsibilities:

- 9:16 해상도 통일
- 이미지 줌인/패닝
- 짧은 영상 컷 연결
- 음성 삽입
- BGM 삽입 및 볼륨 조정
- 자막 오버레이
- 핵심 숫자 오버레이
- 출처 문구 오버레이
- Money-OS CTA 화면 삽입
- 최종 MP4 렌더링
- 영상 길이 검증
- 오디오 싱크 검증

ffmpeg must not:

- 장면 구조를 임의로 결정
- 자막 문장을 임의로 수정
- 장면 순서를 자동 판단
- 이미지 품질 문제를 후처리로만 해결

## 9. QA 자동화 체크리스트

### 1차 QA: 대본/기획 QA

- 첫 1-2초 훅이 있는가?
- 핵심 메시지가 명확한가?
- Money-OS CTA가 자연스러운가?
- 투자 권유성 표현이 있는가?
- 과장 표현이 있는가?
- 한 문장이 너무 길지 않은가?
- 자막이 너무 길지 않은가?
- 일반 사용자가 이해할 수 있는가?

### 2차 QA: 이미지/영상 QA

- 9:16 세로형인가?
- 이미지 안에 깨진 글자가 없는가?
- 텍스트가 이미지 자체에 들어가 있지 않은가?
- 브랜드 톤이 유지되는가?
- 너무 어둡거나 너무 가볍지 않은가?
- 캐릭터/소품/색감이 영상마다 심하게 바뀌지 않는가?
- 금융 데스크, 현금, 카드, 봉투, 트레이가 자연스러운가?

### 3차 QA: 최종 영상 QA

- 음성과 자막 싱크가 맞는가?
- 자막이 화면 밖으로 나가지 않는가?
- 자막이 너무 작지 않은가?
- BGM이 음성을 덮지 않는가?
- 영상 길이가 목표 길이에 맞는가?
- CTA가 마지막에 명확히 보이는가?
- 출처/면책 문구가 필요한 경우 포함되었는가?
- 전체 영상이 싸 보이는 AI 쇼츠처럼 보이지 않는가?

## 10. Supabase 테이블 설계

기존 MVP1 테이블에 아래를 추가/연결한다.

### `video_blueprints`

- `id uuid primary key`
- `workspace_id uuid references workspaces(id)`
- `package_id uuid references shorts_packages(id) on delete cascade`
- `schema_version text`
- `title text`
- `topic text`
- `target_duration_sec int`
- `estimated_duration_sec numeric`
- `final_duration_sec numeric`
- `content_type text`
- `template_mode text`
- `template_key text`
- `core_message text`
- `money_os_cta text`
- `tone jsonb`
- `target_audience text`
- `risk_level text default 'unchecked'`
- `voice_profile_id uuid`
- `status text default 'draft'`
- `created_at timestamptz`
- `updated_at timestamptz`

### `blueprint_scenes`

- `id uuid primary key`
- `blueprint_id uuid references video_blueprints(id) on delete cascade`
- `scene_index int`
- `scene_role text`
- `estimated_start_time numeric`
- `estimated_duration numeric`
- `actual_start_time numeric`
- `actual_duration numeric`
- `narration text`
- `tts_script text`
- `caption text`
- `visual_description text`
- `visual_type text`
- `motion_type text`
- `caption_style text`
- `audio_emphasis text`
- `source_note text`
- `qa_rules jsonb`

### `asset_prompts`

- `id uuid primary key`
- `blueprint_id uuid references video_blueprints(id) on delete cascade`
- `scene_id uuid references blueprint_scenes(id) on delete cascade`
- `asset_type text`
- `provider text` -- gpt_image / veo / gemini
- `prompt text`
- `negative_rules jsonb`
- `status text default 'draft'`
- `created_at timestamptz`

### `voice_profiles`

- `id uuid primary key`
- `workspace_id uuid references workspaces(id)`
- `name text`
- `provider text default 'elevenlabs'`
- `voice_provider_id text`
- `description text`
- `usage_role text` -- main / sub
- `settings jsonb`
- `is_active boolean default true`

### `voice_generations`

- `id uuid primary key`
- `blueprint_id uuid references video_blueprints(id) on delete cascade`
- `voice_profile_id uuid references voice_profiles(id)`
- `provider text`
- `audio_url text`
- `duration_sec numeric`
- `tts_script text`
- `status text`
- `created_at timestamptz`

### `timeline_calculations`

- `id uuid primary key`
- `blueprint_id uuid references video_blueprints(id) on delete cascade`
- `voice_generation_id uuid references voice_generations(id)`
- `target_duration_sec numeric`
- `measured_audio_duration_sec numeric`
- `timeline jsonb`
- `caption_timing jsonb`
- `created_at timestamptz`

### `render_jobs`

- `id uuid primary key`
- `blueprint_id uuid references video_blueprints(id) on delete cascade`
- `timeline_id uuid references timeline_calculations(id)`
- `status text`
- `renderer text` -- ffmpeg / remotion_future
- `output_url text`
- `manifest jsonb`
- `error_message text`
- `created_at timestamptz`
- `updated_at timestamptz`

### `qa_results`

- `id uuid primary key`
- `blueprint_id uuid references video_blueprints(id) on delete cascade`
- `render_job_id uuid references render_jobs(id)`
- `qa_stage text` -- planning / asset / final
- `status text`
- `checks jsonb`
- `failure_reason text`
- `created_at timestamptz`

## 11. Next.js 페이지 구조

Recommended app pages:

```txt
app/
  (app)/
    dashboard/page.tsx
    ideas/page.tsx
    generator/page.tsx
    generator/blueprint/page.tsx
    generator/blueprint/[id]/page.tsx
    library/page.tsx
    library/[id]/page.tsx
    charts/page.tsx
    templates/page.tsx
    voices/page.tsx
    render-jobs/page.tsx
    cta/page.tsx
    compliance/page.tsx
    analytics/page.tsx
    money-os/free-diagnosis/page.tsx
    settings/page.tsx
  api/
    blueprints/generate/route.ts
    blueprints/[id]/route.ts
    compliance/scan/route.ts
    future/tts/route.ts
    future/render/route.ts
components/
  app-shell/
  blueprint/
  generator/
  storyboard/
  visuals/
  voice/
  timeline/
  render/
  compliance/
  cta/
  ui/
lib/
  blueprints/
  scripts/
  compliance/
  visuals/
  voice/
  timeline/
  render/
  supabase/
types/
  blueprint.ts
  database.ts
```

MVP1에서 실제 API/TTS/render route는 만들지 않거나 placeholder만 둔다.

## 12. 구현 우선순위

Authoritative implementation order:

- `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`

Summary:

1. 데이터 소스/출처 관리 구조 설계
2. Fact Card 생성 구조 설계
3. ECOS/KOSIS/OpenDART/FRED 연동 계획 수립
4. 수동 데이터 입력 기반 Fact Card MVP 구현
5. Fact Card 기반 대본/자막/스토리보드 생성
6. 금융표현 위험 검수
7. 9:16 차트/숫자 카드 생성
8. GPT 이미지 생성
9. ElevenLabs 음성 생성
10. 음성 길이 기반 타임라인 재계산
11. ffmpeg 영상 조립
12. 최종 QA
13. Money-OS CTA 연결
14. 성과 기록
15. 결제/자동 업로드/외부 판매 기능 확장
16. Veo/Gemini 짧은 영상 컷 추가

Implementation guardrail:

- Step 1-2 can be done as local design/types without external API/env changes.
- Step 3 is planning only until Owner approves live API work.
- Step 4 can start as manual Fact Card MVP without API/env/DB migration.
- Step 8+ requires explicit Owner approval for external generation/API/env work.
- Supabase migration requires separate Owner approval.
- Payment, deploy, push remain separately approved actions.

## 13. Claude Code 작업 단위

Recommended atomic tasks:

1. `money-shorts-os-source-fact-card-types-v1`
   - Create local TypeScript types/schema helpers for source providers, raw snapshots, indicators, disclosures, citations, and Fact Cards. No DB/API.
2. `money-shorts-os-manual-fact-card-mock-v1`
   - Create manual-input mock Fact Card generator and fixtures. No external API.
3. `money-shorts-os-source-api-plan-v1`
   - Document ECOS/KOSIS/OpenDART/FRED integration plan. No live calls.
4. `money-shorts-os-fact-card-to-blueprint-v1`
   - Generate mock Video Blueprint from Fact Card only. No external AI.
5. `money-shorts-os-fact-card-script-generator-v1`
   - Generate scripts/captions/storyboard from Fact Card values only.
6. `money-shorts-os-risk-review-v1`
   - Financial expression scanner for generated scripts and captions.
7. `money-shorts-os-chart-card-model-v1`
   - Model 9:16 chart/number card props from Fact Card.
8. `money-shorts-os-image-prompt-generator-v1`
   - Derive GPT image prompts from Fact Card/Blueprint scenes, no live submit.
9. `money-shorts-os-voice-profile-spec-v1`
   - Local voice profile settings and TTS script formatter, no ElevenLabs call.
10. `money-shorts-os-timeline-recalc-v1`
   - Given mock/measured audio durations, recalculate scene and caption timings.
11. `money-shorts-os-ffmpeg-render-plan-v1`
   - Create render manifest/command plan only, no live render unless approved.
12. `money-shorts-os-final-qa-model-v1`
   - QA result schema and checklist runner.

## 14. Definition of Quality

A generated shorts package is acceptable only when:

- the first 1-2 seconds have a strong hook
- narration and caption are not the same text copied twice
- captions are short and clear
- visual descriptions are concrete enough to generate assets
- no risky investment recommendation appears
- Money-OS CTA feels natural
- generated images contain no text
- final timeline follows actual narration length
- output does not look like cheap AI video
- output is not overly dark, slow, or report-like
