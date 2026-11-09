---
name: feedback-caption-tidy-planner-and-story-assembly-checklist-2026-10-07
description: "★자막 정돈(Owner 10/7: 어떤 건 한 줄·한 단어·단어 사이 줄바꿈) — 장면 단위 계획기 scene_dp_v1(V2 기본값), 맞춤법·정돈도 QA, 스토리 조립 실수 체크리스트(첫 발화 pre-roll·1.20배·BGM 시간맞춤·자막 끝 여유·글자 102·위치 1385)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 44079e93-cb91-40d7-a5f2-8a4f2a547778
  modified: 2026-10-07T03:59:29.058Z
---

Owner(2026-10-07) 스토리 1편 조립본 지적: "자막이 정돈이 안 돼 — 어떤 건 한 줄, 어떤 건 한 단어, 단어 사이 줄바꿈. 줄바꿈·맞춤법·글 정렬을 정확히 하는 방법을 마련해. **스토리형뿐 아니라 기존 쇼츠에도 해당**. 글자 조금 키우고 위치 조금 내려."

**★Owner 확정(10/7, 시안 검수 후 "확인했어. 최종 자막수정까지 이 기준으로 앞으로 영상조립해줘 / 자막은 기존 쇼츠에도 반영 / 메모리에 꼭 기억 / 스토리형은 자막뿐 아니라 발화 타이밍·목소리 속도·제목·자막 크기 등등 다 지켜야 돼")** — 이 문서의 기준이 앞으로의 조립 기준. CURRENT_STANDARDS 최우선 규칙 32에도 기록. 계획기 기본값은 부엉 19편~·황소 10편~ 스펙 20개 전부에 적용된다(모두 sceneBackgrounds/captionLayout 보유 확인). 이미 배포된 편은 다시 조립하지 않는다(재조립은 Owner 지시 때만).

**원인:** TTS 쉼 단위로 잘게 들어온 블록을 그대로 줄바꿈해서(블록마다 따로 나눔) 한 줄·한 단어·"39억 | 달러" 같은 조각이 생겼다.

**해법(구현됨):**
- 조립기 `run-owl-assemble-shorts-v2.mjs`의 **자막 계획기 `captionPlanner: "scene_dp_v1"`** — 장면 안 블록을 하나로 합친 뒤(`mergeCaptionsByScene`) 한국어 줄바꿈 규칙(`_caption-linebreak-ko.mjs`)+블록 점수 DP로 다시 나눈다. **V2 레이아웃 편은 기본값 켜짐**(옛 동작은 스펙 `captionPlanner: "legacy"`).
- 규칙: 블록 안 문장 끝(. ? !) 끼면 불가(단 장면 마지막 문장이 0.65초 미만이면 예외) · 0.9초 미만 노출·장면 중간 짧은 한 줄(폭 55% 미만)에 벌점 · 금지 경계(숫자|단위, "10분의|1", 관형사|의존명사)는 블록 사이 1000·한 블록 안 두 줄로는 60(`allowForced`)이라 가능하면 피하되 피할 수 없으면 한 화면 안에 같이 둔다 · 새 규칙 "1 / 남짓·가량·안팎" 허용(벌점 10).
- **효과(실측)**: 스토리 1편 블록 66→60, 한 줄 23→12, 한 단어 5→2, 0.7초 미만 8→3. 부엉 23편(설명형) 시험 62→56, 한 줄 21→9, 한 단어 2→1, 0.7초 미만 2→1(자막 계약 통과, 미리보기 영상 미확인).
- **QA(`run-episode-qa-once.mjs`)**: "자막 정돈도" 수치(2줄/한 줄/한 단어/0.7초 미만)를 정보로 남기고 한 줄 35% 초과·한 단어 2개 초과는 경고. **맞춤법·띄어쓰기 확실한 오류 목록**(됬·몇일·웬지·왠만·금새·어떻해·일일히·되요·바램·수있/수없·것같·연속 공백·문장부호 앞 공백)은 반드시 수정. 목록은 오탐 적은 것만 — 대본·표시 문구 원문을 고친다(자막만 고치지 않는다).
- **글자 크기**: 스토리형 102px(설명형 96). 폭 한도 760px는 QA가 지키므로 104 이상은 날짜 줄("2001년 8월 23일")이 폭을 넘어 위반. 위치 `captionY: 1385`(설명형 1360).
- 남는 한계: 문장 끝 짧은 조각("그다음이야", "큰돈이지")은 혼자 한 단어 블록이 될 수 있다(폭 한도와 문장 경계 때문). 한 번 더 줄이려면 대본 문장을 합치는 수밖에 없다 — 대본 확정 전에만 가능.

**스토리 조립 실수 체크리스트(1편에서 반복 보완한 것 — 2편부터 처음부터 적용):**
1. 템포: `apply-story-tempo-once.mjs --factor 1.20 --max-scene-gap 0.25 --keep-gap-scenes <긴장 장면>`(기본 `--preroll 0.12`로 실제 첫 소리 앞에서 자름 — eleven_v3 alignment가 0.06~0.26초 늦음) → `fix-tts-alignment-from-audio-once.mjs --threshold 0.1`. 옛 `tempo-1.15-gap0.35` 쓰지 않는다.
2. 배경음: 새 길이에 `atempo`(원곡÷새 길이)로 시간 맞춤, `run-audio-finish-once.mjs --bgm … --bgm-db -26`.
3. 조립 스펙 필수 항목: `render`(STORY_RENDER)·`headerTitle`(제목 그대로 3줄, 마지막 줄 노랑)·`captionFontSize 102`·`captionY 1385`·`captionPlanner`·`emphasisTerms`·`emphasisNumberPatterns`·`captionEmphasisPop`·`captionLeadSec 0.12`·`captionSceneEndMarginSec 0.1`·`captionLastSceneNoMargin`·`formatProfile "story_v1"`·장면 `overlays: []`("AI 재연" 글자 없음).
4. 순서: 조립 → `run-remove-veo-watermark-once.mjs` → `run-audio-finish-once.mjs` → `run-episode-qa-once.mjs`(반드시 수정 0) → `qa/safe-video.png` 눈으로 확인.
5. 경계 예외(`captionBoundaryExceptions`)는 한 어절이 숫자+단위를 품은 때만("39억 / 달러뿐이었어"), 사유 필수. 대본 문장은 TTS 재생성(유료) 회피 위해 바꾸지 않았다 — 대본 단계에서 "숫자+긴 단위어절"을 피하면 예외가 필요 없다.
6. 긴 출력은 `| head`/`| tail` 파이프로 자르지 말 것(백그라운드에서 조립이 중간에 끊긴 적 있음). 명령은 `&&`·`;` 묶음 대신 하나씩(권한 거부됨).
7. 인스타 `is_ai_generated`는 스토리형 콘텐츠 유닛 manifest에 `aiLabel: true` 필요(계정 단위 "AI 생성 프로필"은 달지 않음).
8. 보고에는 "검증한 것/못 본 것" — Owner 재생 청취·실제 화면 확인은 못 본 것으로 표기.

**Why:** 같은 지적(씹힘·속도·크기·정돈)이 반복되면 Owner 시간·신뢰를 쓴다. **How to apply:** 스토리형 조립은 이 체크리스트 순서대로, 설명형은 계획기 기본값을 믿되 QA 정돈도 수치와 safe-video를 본다. 관련 [[feedback_story_caption_and_ai_label_2026_10_07]], [[feedback_tts_alignment_drift_and_larger_text_2026_10_02]].

## 스토리 2편 조립에서 추가로 배운 점(2026-10-07 오후)
- **낭독형/표시형 어절 수 불일치**("칠십삼 세의"↔"73세의")는 자막 블록이 그 사이에서 끊기면 숫자 치환이 포기돼 한글 숫자가 화면에 남는다(QA "읽는 표기 숫자 잔존"). TTS 재생성 없이 고치는 법: **낭독 스크립트 performanceText의 띄어쓰기를 합치고(칠십삼세의) alignment JSON에서 같은 위치의 공백 1칸을 characters·시작·끝 배열 3개 모두에서 제거**(배열 길이는 제거 전 값으로 비교할 것 — 먼저 줄이면 나머지가 안 줄어 "alignment arrays inconsistent"). 원본은 두고 `.capfix` 사본을 만들어 조립·QA에 같이 넘긴다.
- **음량 피크**: AAC 인코딩 뒤 피크가 -0.2dBTP까지 올라 QA가 막았다 → `run-audio-finish-once.mjs --tp -1.5`(기본 -1, 새 옵션)로 -15.2 LUFS/-1.4dBTP. `--tp -2`는 -15.6 LUFS로 음량 기준(-14±1.5) 밖.
- 영상을 230px 내리면 Veo 워터마크(세로 1740)는 화면 밖으로 잘리지만, QA가 처리 표식을 요구하므로 제거 도구는 그대로 돌린다.
- 경계 예외는 사유와 함께 스펙에 적는다: 쉼표 쉼으로 끊긴 "2월 / 73세의"(자막에서 쉼표가 지워져 월|숫자로 잡힘), 강조 확대 폭 때문에 못 붙는 "1984년 / 10월에는"·"4000만 / 달러를".
- 커버: 3줄 "삼성 반도체,/비웃음이/뒤집힌 선택" 141·146·146px, 세로 18.8~43.3%, `--center-y-pct 31 --max-width-pct 80 --line-gap-pct 1.0 --max-font 146`, 4:5·3:4 크롭 시뮬레이션 통과. 소스는 클립을 만든 `story-ep2-images-v2/story_ep2_s1.png`. 출력 폴더는 미리 만들어야 한다.
- 2편 산출물: 완성본 `C:/tmp/story-ep2-assembled2/story_ep2_mastered.mp4`(83.3초, QA 반드시 수정 0), 커버 `C:/tmp/story-ep2-cover/story_ep2_cover_v1.png`, 스펙 `scripts/_story-ep2-assembly-spec.mjs`의 `STORY_EP2_ASSEMBLE_SPEC`. 게시 전 Owner 확인·게시 지시 대기, 제목은 작업 제목(확정 필요).
