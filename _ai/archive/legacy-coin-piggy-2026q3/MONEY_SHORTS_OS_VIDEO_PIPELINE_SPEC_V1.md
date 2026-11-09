# Money Shorts OS Video Pipeline Spec V1

Status: **ACTIVE PIPELINE SPEC — DIRECTION ALIGNMENT V1.1**

Updated: 2026-06-27

## 0. Core Principle

Money Shorts OS는 AI에게 영상을 통째로 만들게 하지 않는다.

AI에게 원본 데이터 없이 대본을 상상하게 하지 않는다.

먼저 **Fact Card**를 만들고, 그 Fact Card를 바탕으로 **Signal Translation Brief**와 **6 Scene Cards**를 만들게 한다. 최종 영상은 Scene Card에서 파생된 대본, 자막, 이미지 프롬프트, 음성 타이밍, 화면 텍스트, 출처 표기, 안전영역, 리스크 노트로 안정화한다.

핵심 순서:

`Data Source` → `Raw Data / Disclosure` → `Fact Card` → `Signal Translation Brief` → `6 Scene Cards` → `script / caption / image prompt / voice / screen text` → `asset generation` → `voice timing` → `timeline recalculation` → `assembly` → `multimodal consistency QA`

## 1. 영상 생성 전체 파이프라인

쇼츠 1편 생성 순서:

1. 데이터 소스 선택
2. 원본 데이터 또는 공시 수집
3. 핵심 숫자 추출
4. 전월/전년/이전 발표치 비교
5. Fact Card 생성
6. 출처 링크/출처명 저장
7. Signal Translation Brief 생성
8. 6 Scene Cards 생성
9. Scene Card에서 15/30/60초 대본, 자막, 이미지 프롬프트, 음성 타이밍, 화면 텍스트 파생
10. 9:16 차트/숫자 카드 또는 이미지 브리프 생성
11. 음성 길이에 맞춰 타임라인 재계산
12. 조립 계획 또는 렌더 계획 생성
13. 금융표현/과장표현/멀티모달 일관성 최종 QA
14. Money-OS CTA는 필요한 경우에만 삽입

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
  "core_message": "기준금리 신호는 대출자와 예금자에게 다른 점검 포인트를 만든다.",
  "signal_translation_brief_id": "uuid",
  "viewer_takeaway": "금리 신호는 방향 예측보다 내 이자 조건을 점검하는 단서로 봐야 한다.",
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
  "voice_profile_id": "life_economy_explainer_voice",
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
- `signal_translation_brief_id`: economic-signal-to-life-impact translation layer.
- `viewer_takeaway`: final one-line conclusion for viewers.
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

### Scene Card Schema

```json
{
  "scene_id": "s1",
  "scene_index": 1,
  "scene_role": "hook",
  "estimated_start_time": 0,
  "estimated_duration": 4,
  "actual_start_time": null,
  "actual_duration": null,
  "narration": "금리 동결, 정말 좋은 소식일까요?",
  "tts_script": "금리 동결,\n정말 좋은 소식일까요?",
  "caption": "금리 동결, 좋은 소식일까?",
  "captionBlocks": [
    {
      "startSec": 0,
      "endSec": 3.5,
      "text": "금리 동결, 좋은 소식일까?",
      "emphasisWords": ["금리 동결"]
    }
  ],
  "hookTitle": "금리 동결, 좋은 소식일까?",
  "sceneLabel": "후킹",
  "visual_description": "생활비 영수증, 대출 서류, 기준금리 신호 카드가 함께 놓인 에디토리얼 생활경제 리포트 스타일 장면",
  "visualTemplateId": "signal_card",
  "image_prompt": "Vertical 9:16 editorial life-economy report style...",
  "video_prompt": null,
  "motion_type": "card_slide",
  "caption_style": "caption_system_v1_hook_title",
  "voiceTiming": {
    "pace": "fast",
    "emphasisWords": ["금리 동결"],
    "pauses": ["금리 동결"]
  },
  "layoutSafeZone": {
    "hookTitle": "x 90-990, y 300-620",
    "sceneLabel": "x 80-420, y 180-250",
    "spokenCaption": "x 90-880, y 1180-1480",
    "sourceNote": "x 90-760, y 1500-1560"
  },
  "imageTextPolicy": {
    "allowedText": [],
    "forbiddenText": ["unverified numbers", "investment return claims", "extra subtitles"]
  },
  "sourceCitationIds": [],
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
    "caption_safe_zone",
    "no_unverified_text_inside_generated_image",
    "scene_message_single_focus"
  ]
}
```

### Scene Roles

- `hook`
- `signal`
- `why_expert_interpretation`
- `life_impact`
- `watch_scenario_outlook`
- `action_closing`

### Visual Types

- `gpt_image`
- `chart_card`
- `number_card`
- `veo_clip`
- `static_background`
- `cta_card`
- `signal_card`
- `life_object`
- `clue_cards`
- `action_checklist`

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
| 1 | 0-4s | Hook | 궁금증 유발, 첫 장면 제목/썸네일 | 생활 오브젝트 + 신호 카드 |
| 2 | 4-9s | Signal | 출처 기반 신호, 핵심 수치/기간/출처 | `signal_card` |
| 3 | 9-15s | Why + Expert Interpretation | 원인 후보와 지금 봐야 할 포인트 | `clue_cards` |
| 4 | 15-21s | Life Impact | 생활비/대출/소비/저축/환전/카드값 연결 | `life_object` |
| 5 | 21-25s | Watch / Scenario Outlook | 시나리오 기반 관찰 포인트 | `clue_cards` |
| 6 | 25-30s | Action + Closing Line | 지금 할 수 있는 점검 행동과 마지막 결론 | `action_checklist` |

예시 주제:

`기준금리 동결이 내 대출과 저축에 주는 신호`

| Scene | Caption | Narration | Visual |
|---|---|---|---|
| 1 | 금리 동결, 좋은 소식일까? | 금리 동결, 정말 좋은 소식일까요? | 생활비 영수증 + 기준금리 신호 카드 |
| 2 | 기준금리는 그대로입니다 | 이번 신호는 금리가 유지됐다는 출처 기반 데이터에서 시작합니다. | 기준금리 숫자 카드 |
| 3 | 방향보다 조건을 봐야 합니다 | 지금은 금리가 어디로 갈지 단정하기보다 다음 물가와 경기 신호를 봐야 합니다. | 원인 후보 단서 카드 |
| 4 | 대출자와 예금자는 다르게 반응합니다 | 대출이 있다면 이자 조건을, 저축 중이라면 예금 금리 변화를 확인해야 합니다. | 대출 서류 + 통장 앱 |
| 5 | 다음 신호가 중요합니다 | 물가와 환율이 다시 흔들리면 금리 경로도 달라질 수 있습니다. | 관찰 포인트 카드 |
| 6 | 오늘은 조건을 확인하세요 | 오늘 할 일은 예측이 아니라 내 대출금리와 예금 조건을 확인하는 겁니다. | 점검 체크리스트 |

## 3.1 Caption System V1

1080x1920 vertical:

- Hook Title: `x 90~990`, `y 300~620`, max 2 lines, `74~88px`, question/reversal/life-connection style.
- Scene Label: `x 80~420`, `y 180~250`, `30~38px`.
- Spoken Caption: `x 90~880`, `y 1180~1480`, `52~64px`, 1-2 lines, derived from narration.
- Source Note: `x 90~760`, `y 1500~1560`, `24~30px`.
- Avoid: `y 0~150`, `y 1600~1920`, `x 900~1080`.
- Font: Pretendard or Noto Sans KR.
- Accent: amber/warm yellow only; max 1-2 emphasized words per screen.

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

초기 MVP는 Main Voice 1개만 사용한다. 다만 최종 목소리는 아직 확정하지 않고, 아래 후보를 같은 테스트 대본으로 ElevenLabs에서 생성한 뒤 Owner가 직접 청감 비교하여 확정한다.

### Main Voice: Life Economy Explainer Voice

한 줄 정의:

차분하지만 지루하지 않은 30대 남성 중저음 생활경제 해설자 목소리.

권장 특성:

- Korean
- male
- 30s feeling
- medium-low tone
- calm
- confident
- trustworthy
- warm but not soft
- clear pronunciation
- not too slow
- not ad-like
- not news-anchor-like
- natural Korean pronunciation
- minimal AI-like intonation
- sentence endings must not cut off mechanically
- not exaggerated YouTuber tone
- not sales/advertising tone
- first sentence can be slightly curious and faster
- middle section should sound analytical and grounded
- closing action should sound calm and practical

### ElevenLabs 우선 테스트 후보

1. **Hojin Lim**
   - 메인 내레이터 1순위 후보.
   - 자연스럽고 신뢰감 있는 생활경제 해설자 톤에 가장 적합한지 테스트한다.
2. **Yohan Koo**
   - 2순위 후보.
   - 조금 더 전문적이고 권위 있는 경제 해석 톤이 필요한 경우의 백업 후보.
3. **Gihong**
   - 3순위 후보.
   - 쇼츠 브리핑감과 속도감이 필요한 경우의 비교 후보.

최종 확정 방식:

- 특정 목소리를 아직 최종 확정하지 않는다.
- 위 3개 후보를 같은 테스트 대본으로 생성한다.
- Owner가 직접 청감 비교해 최종 voice를 확정한다.
- 비교 기준은 자연스러운 한국어 발음, 억양, 강약조절, AI티 여부, 후킹감, 신뢰감, 30초 쇼츠 지속 청취감이다.

### Voice Test Script V1

```text
환율이 오르면 해외여행만 비싸질까요?

사실 더 먼저 흔들리는 건 장바구니와 카드값입니다.

달러가 비싸지면 수입식품, 기름값, 해외결제 비용이 같이 움직일 수 있습니다.

그래서 지금 봐야 할 건 환율 숫자 하나가 아니라, 높은 수준이 얼마나 오래 이어지는지입니다.

이번 달은 해외결제와 변동비를 먼저 점검해보세요.
```

### ElevenLabs 기본 테스트 설정 가이드

- Model: Eleven Multilingual v2 우선.
- Stability: 45~60 범위에서 테스트.
- Similarity: 70~85 범위에서 테스트.
- Style / Exaggeration: 낮게 또는 0~20.
- Speaker Boost: ON 권장.

### ElevenLabs Voice Library 검색 키워드

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

### Voice Generation QA

음성 후보는 아래 기준으로 검수한다.

- 음성이 자막보다 너무 빠르지 않은가?
- 문장 끝 억양이 부자연스럽지 않은가?
- Hook 문장이 충분히 궁금증을 유발하는가?
- 경제 해석 부분이 너무 딱딱하지 않은가?
- Action 문장이 투자 권유처럼 들리지 않는가?
- AI 음성 특유의 부자연스러운 호흡/강세가 있는가?
- 30초 쇼츠 전체를 끝까지 듣기에 피로하지 않은가?
- source-first 생활경제 해설자 톤과 맞는가?

## 6. Image Prompt Generation Rules

이미지는 Scene Card의 장면 목적에서 파생한다. 이미지 프롬프트는 대본, 자막, 화면 텍스트와 같은 메시지를 보여야 하며, 별도 아이디어로 생성하지 않는다.

Main style:

- editorial life-economy report style
- everyday objects + economic signal card + clue-like interpretation staging
- 생활경제탐정은 실제 탐정 캐릭터가 아니라 단서 카드, 연결선, 체크 표시, 신호 카드, 생활 오브젝트 배치로 표현한다.

Visual template IDs:

- `signal_card`
- `clue_cards`
- `life_object`
- `action_checklist`

사용 장면 예:

- 장바구니 / 생활비
- 카드 명세서 / 카드값
- 대출 서류 / 이자 부담
- 월급 명세서 / 고정비
- 환전 앱 / 여행비
- 자동이체 체크리스트
- 경제 신호 카드 + 생활 영향 연결 장면

공통 규칙:

- 9:16 vertical.
- editorial life-economy report tone.
- off-white / light gray / charcoal navy base.
- dark navy / charcoal text cards.
- amber or warm yellow as one primary accent.
- blue-gray only as secondary support.
- stable repeatable template layout.
- no cheap AI look.
- no changing style every time.
- no excessive premium finance ad mood.
- no excessive gold.
- no fear mood.
- no implied investment profit.
- no unrelated abstract graph backgrounds.
- no unverified text inside image.
- no unverified numbers inside image.
- no labels, UI, logos, card numbers, source text, subtitles, or CTA inside image.

텍스트 처리:

- 이미지 안에는 검증되지 않은 글자/숫자를 넣지 않는다.
- 자막, 핵심 숫자, 출처, CTA는 Scene Card와 Caption System V1 기준으로 오버레이한다.
- `imageTextPolicy.allowedText`에 명시되지 않은 텍스트는 이미지 안에 넣지 않는다.

Prompt output structure:

```json
{
  "scene_id": "s3",
  "image_prompt": "Vertical 9:16 premium finance scene...",
  "negative_rules": [
    "no unverified text",
    "no logos",
    "no labels",
    "no unverified numbers",
    "no cartoon",
    "no fantasy",
    "no fear mood",
    "no investment profit implication"
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
- 원인 단정이 있는가?
- 예측 단정이 있는가?
- 생활 영향이 과장되었는가?
- 행동 지침이 투자 추천처럼 보이는가?
- 출처 밖 주장이 있는가?
- 한 문장이 너무 길지 않은가?
- 자막이 너무 길지 않은가?
- 일반 사용자가 이해할 수 있는가?
- 마지막 viewer takeaway가 명확한가?

### 2차 QA: 이미지/영상 QA

- 9:16 세로형인가?
- 이미지 안에 깨진 글자가 없는가?
- 이미지 안 텍스트와 자막이 충돌하지 않는가?
- 이미지 안에 검증되지 않은 숫자/문구가 들어가 있지 않은가?
- 브랜드 톤이 유지되는가?
- 너무 어둡거나 너무 가볍지 않은가?
- 캐릭터/소품/색감이 영상마다 심하게 바뀌지 않는가?
- 생활 오브젝트와 경제 신호 카드가 장면 목적에 맞는가?
- 이미지와 자막이 같은 장면 목적을 보여주는가?
- 대본과 이미지가 같은 메시지를 말하는가?

### 3차 QA: 최종 영상 QA

- 음성과 자막 싱크가 맞는가?
- 내레이션과 자막이 같은 메시지를 말하는가?
- 자막이 화면 밖으로 나가지 않는가?
- Caption safe zone을 지키는가?
- Hook Title이 2줄 이하인가?
- Spoken Caption이 너무 길지 않은가?
- Scene Label이 장면 역할과 일치하는가?
- Source Note가 방해되지 않는가?
- 강조색이 과도하지 않은가?
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
