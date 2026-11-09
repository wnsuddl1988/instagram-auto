현재 Creative v2 결과물은 공식 reject다.
하지만 이번 복구 방향을 “감사 도구만 만드는 방향”으로 잡으면 안 된다.

중요:
Post-Render Artifact Audit는 필요하지만, 그것만 먼저 만들면 “나쁜 영상을 reject하는 도구”만 생긴다.
지금 진짜 목표는 좋은 mp4가 실제로 나오도록 생성 구조를 고치는 것이다.

이번 작업의 최종 목적은 변하지 않는다.

topic list
→ 후보 영상 자동 생성
→ quality scorer / audit로 최고 후보 선택
→ final render
→ platform metadata
→ upload queue readiness

즉, 대량 자동화는 유지한다.
다만 현재는 저품질 영상이 자동으로 통과되는 구멍을 막고, 동시에 Golden Sample 1개를 다시 제대로 만드는 복구 단계다.

이번 작업의 핵심 방향은 아래다.

1. 기존 Creative v2는 reject sample로 고정한다.
2. 기존 accepted final은 baseline으로 유지한다.
3. Post-Render Audit는 필요하지만, 감사 도구가 목적이 되어서는 안 된다.
4. 먼저 금리 동결 주제 1개를 Golden Sample로 다시 만든다.
5. 이미지 생성 품질은 반드시 기존 ChatGPT/LLM 기반 이미지 생성 흐름을 유지한다.
6. card-first는 이미지를 버리는 것이 아니라, 고품질 이미지 + 정보 카드 + 모션그래픽을 결합하는 방식이다.
7. local placeholder, 단순 stock-like image, 저품질 fallback 이미지로 대체 금지.
8. 좋은 이미지가 없으면 렌더하지 말고 image generation step을 다시 실행하거나 skip한다.
9. upload queue, SFX만 추가, 새 topic 확장, 대량 후보 생성은 금지한다.
10. 이번 목표는 “좋은 금리 동결 쇼츠 1개”를 다시 만들고, 그 구조를 자동화 파이프라인에 고정하는 것이다.

────────────────────────────
0. 현재 문제 재정의
────────────────────────────

현재 실패는 단순히 Post-Render Audit가 없어서 생긴 문제가 아니다.

실패 원인은 복합적이다.

A. Script 문제
- hook이 제목처럼 들림.
- 첫 2초가 시청자를 멈추게 하지 못함.
- 정보가 추상적임.
- “그래서 지금 뭘 확인해야 하는가”가 약함.

B. TTS 문제
- scene별 TTS raw duration이 target duration보다 짧음.
- 부족한 길이를 padding으로 채워 영상이 늘어짐.
- scene별 TTS 호출로 voice rhythm과 consistency가 무너졌을 가능성이 있음.
- 30초 영상인데 실제 음성 밀도가 낮음.

C. Visual 문제
- planned event는 24개지만 사람 눈에는 6장 이미지가 천천히 움직이는 영상처럼 보임.
- pan/zoom/작은 overlay를 event로 계산했지만 perceptual event가 아님.
- full-screen image + bottom caption 구조가 그대로 남음.
- card-first explainer가 아니라 image-first slide 영상이 됨.
- 정보 카드, 숫자 카드, 비교 카드, 체크리스트가 영상의 중심이 되지 못함.

D. Image 문제
- 이미지가 generic하고 주제 전달력이 약함.
- 금리, 대출, 예금, 현금흐름이라는 정보를 이미지가 직접 설명하지 못함.
- 이미지 생성 품질을 낮추거나 placeholder로 대체하면 더 망가진다.

E. Scorer 문제
- pre-render scorer는 JSON 계획값만 봄.
- 실제 mp4의 silence, voice rhythm, visual rhythm, image quality, caption readability, card impact를 보지 못함.
- ffprobe 통과는 media validity일 뿐 영상 품질 통과가 아니다.

이번 복구는 이 문제를 모두 반영해야 한다.

────────────────────────────
1. 절대 유지해야 할 것: ChatGPT/LLM Image Generation Path
────────────────────────────

이미지 생성 방식은 반드시 유지한다.

현재 Owner 요구:
이미지는 원래 ChatGPT → LLM 기반으로 생성한다.
이 방식은 반드시 준수해야 한다.
다른 방식으로 대체하면 이미지 퀄리티가 떨어진다.

따라서 image generation pipeline은 아래 원칙을 따른다.

source facts / topic / script
→ LLM visual director prompt 생성
→ ChatGPT 또는 기존 LLM 기반 image generation step
→ high quality 9:16 editorial image 생성
→ image quality check
→ selected image set 저장
→ renderer가 이 selected image set을 소비

금지:
- placeholder image 사용 금지
- 단순 색 배경으로 대체 금지
- 임의 stock-like local image 생성 금지
- low-quality fallback image 사용 금지
- 이미지 생성 실패 시 조용히 대체 이미지로 진행 금지
- card-first라는 이유로 이미지 생성을 제거 금지
- 기존 ChatGPT/LLM image generation path를 우회 금지

이미지 생성 실패 시:
- regenerate_image_prompt
- regenerate_image
- 또는 skip_topic

절대 low-quality fallback으로 final render 진행하지 않는다.

image_source_policy를 contract에 추가한다.

예시 schema:

{
  "image_generation_policy": {
    "required_provider_path": "chatgpt_or_llm_image_generation",
    "allow_placeholder": false,
    "allow_local_mock_for_final": false,
    "allow_stock_like_fallback": false,
    "require_visual_director_prompt": true,
    "require_selected_image_set": true,
    "require_image_quality_score": true,
    "on_image_generation_failure": "regenerate_image_or_skip_topic"
  }
}

이미지 품질 기준:

{
  "image_quality_gate": {
    "min_resolution": "1080x1920",
    "orientation": "vertical_9_16",
    "subject_relevance_required": true,
    "generic_stock_feel_allowed": false,
    "text_inside_image_allowed": false,
    "watermark_allowed": false,
    "blurred_face_allowed": false,
    "low_detail_allowed": false,
    "final_render_requires_selected_image_set": true
  }
}

금리 동결 영상의 image direction 예:
- image_01: 스마트폰 금융 알림을 보는 직장인, 어두운 배경, 긴장감, 금융 뉴스 분위기
- image_02: 대출 명세서와 금리 표시를 확인하는 손, 월 납입액이 느껴지는 상황
- image_03: 예금 통장/은행 앱/금리 비교 분위기, 갈아타기 판단 느낌
- image_04: 가계부와 고정비 항목을 체크하는 장면
- image_05: 금융 뉴스와 개인 지갑/현금흐름이 대비되는 장면
- image_06: 오늘 확인할 체크리스트를 정리하는 장면

단, 이미지 안에 실제 읽히는 글자를 생성하지 않는다.
텍스트는 renderer에서 카드/자막으로 얹는다.

────────────────────────────
2. Card-first의 정확한 의미
────────────────────────────

Card-first는 이미지를 없애는 것이 아니다.
Card-first는 “사진은 고급 배경/맥락/감정”이고, “정보 카드가 메시지의 주연”이라는 뜻이다.

기존 실패 구조:
full-screen image
+ bottom caption
+ small decorative overlay
+ slow pan/zoom

수정 구조:
high-quality LLM-generated image
+ dim/blur/crop/parallax background
+ large information card
+ keyword / number / checklist / warning box
+ meaningful motion
+ caption as design element, not bottom subtitle only

렌더러는 image-first slide renderer가 아니라 card-image hybrid explainer renderer가 되어야 한다.

화면 구성 원칙:
- 첫 2초는 full image가 아니라 big hook card가 중심
- 이미지는 hook card의 배경으로 dim/blur 처리
- 각 핵심 포인트는 checklist card 또는 number card로 표현
- 자막은 하단 받아쓰기만 하지 않음
- 정보 카드가 화면 중앙 또는 safe-frame 주요 영역에 위치
- 이미지가 3초 이상 화면의 주연으로 고정되면 reject
- 카드/텍스트/이미지/모션이 의미를 함께 전달해야 함

────────────────────────────
3. Golden Sample Recovery가 최우선
────────────────────────────

이번 단계는 audit tool만 만드는 단계가 아니다.

우선순위:
1. Creative v2 reject sample 고정
2. 기존 accepted baseline 확보
3. Image Generation Contract 추가
4. Golden Sample Blueprint 작성
5. TTS-first timeline 적용
6. Card-image hybrid renderer 적용
7. Post-render audit 적용
8. 금리 동결 Golden Sample 1개 재렌더
9. Owner가 확인할 수 있는 before/after 산출
10. 그 뒤에만 대량 자동화로 확장

금지:
- audit만 만들고 종료 금지
- SFX만 추가 금지
- threshold 숫자만 조정 금지
- 새 topic 확장 금지
- 새 후보 대량 생성 금지
- 업로드 queue 생성 금지
- image generation path를 placeholder로 대체 금지
- 기존 이미지 품질을 낮추는 fallback 금지

────────────────────────────
4. 금리 동결 Golden Sample 목표 구조
────────────────────────────

이번 Golden Sample은 같은 주제 “금리 동결”로 다시 만든다.

핵심 메시지:
금리 동결은 좋은 소식처럼 보이지만, 내 이자와 월 납입액은 바로 편해지지 않을 수 있다.
뉴스 제목보다 내 현금흐름과 고정비를 확인해야 한다.

30초 구조:

0.0~2.0s — Hook
화면:
- dim/blur high-quality financial image background
- 중앙 big hook card
- impact motion

voice:
“금리 동결? 아직 안심하면 안 됩니다.”

text:
“아직 안심 금지”

2.0~5.0s — Curiosity
화면:
- 금리 뉴스 카드 + 개인 지갑/대출 카드 대비
- card slide-in

voice:
“금리는 멈췄지만, 내 이자는 바로 안 멈출 수 있습니다.”

text:
“내 이자는 다릅니다”

5.0~10.0s — Point 1
화면:
- checklist card 1
- 변동금리 / 반영 시점 / 다음 납입일 카드

voice:
“첫째, 변동금리는 반영 시점을 확인해야 합니다.”

text:
“변동금리: 반영 시점”

10.0~15.0s — Point 2
화면:
- checklist card 2
- 예금 갈아타기 / 만기 / 중도해지 손실 카드

voice:
“둘째, 예금은 갈아타기 전에 만기와 손실을 봐야 합니다.”

text:
“예금: 만기·손실 확인”

15.0~20.0s — Point 3
화면:
- checklist card 3
- 대출 / 월 납입액 / 고정비 카드

voice:
“셋째, 대출자는 월 납입액을 다시 계산해야 합니다.”

text:
“대출: 월 납입액”

20.0~26.0s — Twist
화면:
- background dim
- single sentence big card
- short pause before impact

voice:
“뉴스는 금리를 말하지만, 내 지갑은 현금흐름이 결정합니다.”

text:
“내 지갑은 현금흐름”

26.0~30.0s — Action
화면:
- final action card
- one clear checklist
- save reason

voice:
“오늘은 금리보다 고정비부터 확인하세요.”

text:
“오늘 할 일: 고정비 확인”

주의:
- 이 구조는 script, caption, visual event, image prompt, TTS timeline, renderer가 모두 공유하는 single source of truth여야 한다.
- scene_plan과 renderer가 따로 놀면 안 된다.

────────────────────────────
5. Script / TTS-first Timeline
────────────────────────────

현재 문제:
script duration estimate가 실제 ElevenLabs duration과 맞지 않았다.
scene별 TTS가 짧고 padding으로 30초를 채웠다.

수정 원칙:
TTS-first timeline으로 바꾼다.

새 순서:
script 생성
→ full narration 또는 3-block TTS 생성
→ 실제 audio duration 측정
→ phrase alignment 생성
→ scene duration 재배치
→ visual timeline 생성
→ render
→ mux
→ post-render audit

우선순위:
1순위: full narration one-shot TTS
2순위: hook / body / closing 3-block TTS
금지: 6 scene별 짧은 TTS 호출을 기본값으로 쓰는 것

금지:
- TTS가 짧은데 padding으로 scene 길이 채우기
- apad=whole_dur로 무음 늘리기
- scene target duration을 먼저 고정하고 음성을 거기에 억지로 맞추기
- hard trim으로 음성을 자르기
- 과도한 atempo로 음성을 망치기

규칙:
- 30초 영상이면 실제 speech active duration이 충분해야 함
- 첫 5초 안에 긴 무음 금지
- scene raw/target ratio가 낮으면 script를 늘리거나 timeline을 줄인다
- 부족한 음성은 silence가 아니라 script/timeline 문제로 처리한다

TTS timing metadata:

{
  "tts_strategy": "full_narration_one_shot | three_block",
  "actual_audio_duration": 0.0,
  "speech_active_duration": 0.0,
  "silence_ratio": 0.0,
  "phrase_alignment": [
    {
      "phrase_id": "hook",
      "text": "",
      "audio_start": 0.0,
      "audio_end": 0.0,
      "visual_start": 0.0,
      "visual_end": 0.0
    }
  ],
  "padding_used": false,
  "requires_script_rewrite": false,
  "requires_timeline_reflow": false
}

────────────────────────────
6. Perceptual Event 기준 재정의
────────────────────────────

기존 문제:
planned visual event는 24개였지만, 사람 눈에는 6장 이미지 pan/zoom처럼 보였다.

수정:
event count는 더 이상 pan/zoom 숫자를 의미하지 않는다.
perceptual event만 event로 인정한다.

perceptual event 인정 기준:
- 화면 15% 이상 면적 변화
- 새 정보 카드 등장
- 큰 hook card 등장
- 숫자/체크리스트/화살표/경고 카드 등장
- 배경 dim/blur 전환
- layout change
- split screen
- freeze punch
- hard cut
- card stack transition
- 의미 있는 caption/card 변화

event로 인정하지 않는 것:
- 같은 이미지 slow pan
- 같은 이미지 slow zoom
- 작은 아이콘만 등장
- 하단 자막만 교체
- 흐릿한 decorative overlay
- 눈에 안 띄는 미세 이동

scene_plan에는 planned_event_count와 perceptual_event_count를 분리한다.

{
  "planned_event_count": 24,
  "perceptual_event_count": 0,
  "perceptual_events": [
    {
      "time_start": 0.0,
      "time_end": 2.0,
      "type": "big_hook_card",
      "visible_area_change_ratio": 0.45,
      "information_value": "high",
      "counts_as_perceptual_event": true
    }
  ]
}

Quality gate는 perceptual_event_count를 기준으로 판단한다.

────────────────────────────
7. Image Prompt / Visual Director Contract
────────────────────────────

LLM image generation을 유지하기 위해 Visual Director Contract를 추가한다.

새 모듈:
build-money-shorts-visual-director-prompt-v1.mjs

역할:
script와 source facts를 받아 각 scene별 ChatGPT/LLM image generation prompt를 생성한다.

출력:
visual_director_prompts.json

schema:

{
  "topic": "금리 동결",
  "visual_style": "premium editorial financial explainer, cinematic, realistic, high detail, 9:16 vertical",
  "negative_prompt_rules": [
    "no readable text inside image",
    "no watermark",
    "no distorted hands",
    "no low quality stock photo feel",
    "no generic smiling office worker",
    "no fake charts with unreadable text"
  ],
  "scene_image_prompts": [
    {
      "image_id": "image_01",
      "script_part": "hook",
      "purpose": "create tension around rate freeze and personal finance",
      "prompt": "",
      "must_show": [],
      "must_avoid": []
    }
  ]
}

금리 동결 이미지 프롬프트 방향:
- generic office worker 금지
- 돈/대출/예금/현금흐름이 시각적으로 느껴져야 함
- 이미지 안에 텍스트를 넣지 말 것
- 텍스트/숫자/체크리스트는 renderer가 얹을 것
- 이미지 자체는 고급스럽고 입체감 있어야 함
- 배경으로 써도 질감이 살아 있어야 함

Image Quality Check:
- selected image set이 없으면 final render 금지
- image source가 placeholder면 final render 금지
- low quality flag가 있으면 regenerate_image
- LLM image prompt 없이 생성된 이미지는 final render 금지

────────────────────────────
8. Renderer 방향
────────────────────────────

기존 renderer를 단순히 조금 고치지 말고, Golden Sample용 card-image hybrid mode를 만든다.

새 renderer mode:
card_image_hybrid_v1

역할:
- LLM-generated high-quality selected images 사용
- 이미지를 full-screen 주연으로 두지 않음
- dim/blur/crop/parallax background 처리
- central information card를 주요 시각 요소로 렌더
- big hook card, checklist card, twist card, final action card 지원
- card transition과 image transition을 timeline에 맞춤

필수 template:
- big_hook_card
- curiosity_contrast_card
- checklist_card_1
- checklist_card_2
- checklist_card_3
- twist_single_sentence_card
- final_action_card
- dim_blur_background
- card_slide_in
- card_punch_zoom
- checklist_pop
- safe_frame_text_layout

금지:
- full-screen image + bottom caption만으로 scene 구성 금지
- 이미지 위에 작은 decorative overlay만 얹는 구조 금지
- 모든 텍스트를 하단 자막으로만 처리 금지
- pan/zoom만으로 event count 채우기 금지

Renderer output:
- visual_only.mp4
- render_manifest.json
- actual_card_timeline.json
- perceptual_event_report.json

────────────────────────────
9. Post-Render Artifact Audit는 production gate지만, 목적은 Golden Sample 통과
────────────────────────────

Post-Render Audit를 만든다.
하지만 audit만 만들고 끝내지 않는다.
Audit의 목적은 현재 Creative v2를 reject하고, 새 Golden Sample이 개선됐는지 확인하는 것이다.

Audit 측정:
- media validity
- audio duration
- speech active duration
- silence ratio
- first 5s silence
- long silence segments
- padding usage
- phrase/visual alignment
- perceptual event count
- first 2s hook card presence
- card presence ratio
- full-screen image dominance
- caption/card readability
- image quality source validity
- placeholder usage
- selected image set validity
- uploadReady boundary

Hard fail:
- final render에 placeholder image 사용
- ChatGPT/LLM image generation path 우회
- selected image set 없음
- first 2s hook card 없음
- first 5s 긴 무음
- padding으로 scene 길이 채움
- perceptual_event_count 부족
- full-screen image dominance 과다
- card presence ratio 낮음
- uploadReady true가 audit 전에 올라감

주의:
ffprobe 통과는 media_validity pass일 뿐이다.
quality pass가 아니다.

────────────────────────────
10. 실행 순서
────────────────────────────

이번 Claude Code 작업 순서는 아래로 한다.

Step 1. Stop State 고정
- Creative v2 rejected sample로 기록
- upload/SFX/new topic expansion 금지 guard 확인
- uploadReady는 false 유지

Step 2. Image Generation Contract 추가
- ChatGPT/LLM image generation path 필수화
- placeholder/local mock final 금지
- selected image set / image quality gate 추가

Step 3. Visual Director Prompt v1 추가
- 금리 동결 Golden Sample용 6개 image prompt 생성
- 이미지 안 텍스트 금지
- premium editorial financial style 고정
- generated image는 renderer background로 사용

Step 4. Golden Sample Blueprint v1 작성
- 금리 동결 30초 script
- scene/card timeline
- image prompt mapping
- TTS phrase mapping
- perceptual event plan
- card-first but image-quality-preserving design

Step 5. TTS-first Timeline Contract 추가
- full narration or 3-block TTS 우선
- scene별 6회 TTS 기본값 금지
- padding으로 길이 맞추기 금지
- actual TTS duration 기준 timeline reflow

Step 6. Card-Image Hybrid Renderer v1
- 기존 renderer를 버리지 말고 새 mode로 추가
- selected image set 사용
- card 중심 구성
- full-screen image dominance 제한
- render manifest 산출

Step 7. Post-Render Artifact Audit v1
- 실제 mp4 검사
- rejected v2는 reject
- accepted baseline은 reference/pass_with_known_limits
- new golden sample은 pass 후보로 검증

Step 8. Golden Sample 1개 렌더
- 주제: 금리 동결
- output은 preview가 아니라 full 30s final candidate
- uploadReady=false 유지
- Owner review용 산출물 생성

Step 9. Report
- accepted baseline vs rejected v2 vs golden sample 비교
- 이미지 생성 경로 유지 여부
- TTS padding 제거 여부
- card presence ratio
- perceptual event count
- first 2s hook impact
- final recommendation

────────────────────────────
11. 이번 작업 산출물
────────────────────────────

필수 산출물:

1. image_generation_contract.json
2. visual_director_prompts.rate_freeze.v1.json
3. golden_sample_blueprint.rate_freeze.v1.json
4. tts_first_timeline_contract.v1.json
5. card_image_hybrid_render_manifest.v1.json
6. post_render_artifact_audit.samples.v1.json
7. post_render_artifact_audit.output.v1.json
8. golden_sample_rate_freeze_visual_only.mp4
9. golden_sample_rate_freeze_tts_mux.mp4
10. golden_sample_recovery_report.v1.json

필수 guard:
- final render에 placeholder 금지
- ChatGPT/LLM image generation path required
- selected image set required
- first 2s hook card required
- card presence ratio required
- full-screen image dominance 제한
- padding usage 금지
- audit 전 uploadReady true 금지
- rejected v2 reject
- accepted baseline reference/pass_with_known_limits

────────────────────────────
12. 최종 지시
────────────────────────────

이번 작업의 목적은 “감사 도구 하나 만들기”가 아니다.
이번 작업의 목적은 “망가진 Creative v2 방향을 복구하고, 좋은 금리 동결 Golden Sample 1개를 실제로 만드는 것”이다.

이미지 품질은 반드시 기존 ChatGPT/LLM image generation path를 유지한다.
card-first는 이미지를 버리는 것이 아니다.
고품질 이미지 위에 정보 카드를 얹는 premium explainer 방식이다.

좋은 이미지가 없으면 렌더하지 않는다.
TTS가 짧으면 padding하지 않는다.
event count가 많아도 사람 눈에 변화가 없으면 event로 보지 않는다.
ffprobe 통과는 품질 통과가 아니다.
uploadReady는 Post-Render Audit 통과 전까지 절대 true가 되면 안 된다.

먼저 Golden Sample 1개를 살려라.
그 다음에 자동화 확장으로 돌아간다.