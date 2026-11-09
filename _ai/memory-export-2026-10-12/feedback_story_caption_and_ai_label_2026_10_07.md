---
name: feedback-story-caption-and-ai-label-2026-10-07
description: "★스토리형 조립 — 화면에 \"AI 재연\" 글자 넣지 않는다(Owner 거슬림), 자막은 소리보다 약 0.1초 먼저·소리 끝까지, 숫자·핵심어 강조색+팝, 설명형 훅 QA 규칙은 스토리형 제외 (Owner 2026-10-07)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 44079e93-cb91-40d7-a5f2-8a4f2a547778
  modified: 2026-10-07T03:50:50.315Z
---

Owner(2026-10-07) 스토리 1편 조립본 검수 지적 3건:
1. **"AI 재연" 글자 삭제** — "영상 볼 때 거슬린다, 굳이 왜 붙이나. 인스타·유튜브 설정에서 AI 콘텐츠로 표시하면 필요 없잖아." → 스토리형 스펙(`STORY_EP1_ASSEMBLE_SPEC`)에서 `topLabel` 제거. 조립기 옵션 `topLabel`은 남아 있으나 쓰지 않는다. AI 표시는 플랫폼 기능으로: **YouTube는 업로드 도구(`run-owl-youtube-publish-once-v1.mjs`)가 이미 매 영상 `containsSyntheticMedia: true`로 표시**(코드 확인). **Instagram은 이 프로젝트 게시 도구에 AI 라벨 항목이 없고** 채널 단위 설정 스위치 존재 여부는 확인 못 했다 — 게시 전 인스타 앱의 AI 라벨(게시물 단위)을 사용해야 하는지 Owner 확인 필요. 계정 설정은 Owner 지시 없이 건드리지 않는다.
2. **자막이 장면 전환에서 씹힘** — 원인 두 가지: ① 장면 끝 자막 자르기 여유 0.5초(`CAPTION_SCENE_END_MARGIN_SEC`)가 쉼 0.35초로 줄인 스토리형에서 마지막 말소리 0.3~0.5초를 자막 없이 남김 → 스펙 `captionSceneEndMarginSec: 0.1`, 마지막 장면 `captionLastSceneNoMargin`. ② 정렬이 실제 첫 소리보다 0.1~0.35초 늦은 장면(s5·s9·s12) → 스펙 `captionLeadSec: 0.12`(자막을 소리보다 먼저, 앞 자막 끝·장면 컷 시작 앞으로는 안 당김). 조립 후 장면별 "소리끝 vs 마지막 자막끝" 확인(18장면 모두 OK).
3. **자막이 심심하다("음영 기준이 뭐냐")** — 기준: 노랑=숫자(원·%·월·일·년·위 + 스토리 추가 억·만·조·톤·명·배·분의), 청록=핵심어(스펙 `emphasisTerms`, 첫 항목=대표 주제어), 빨강=위험 단어, 한 줄 최대 2어절. 1편은 `emphasisTerms`를 비워 숫자 대부분이 안 칠해졌다. 스토리형은 `emphasisTerms`·`emphasisNumberPatterns`를 편마다 채우고 `captionEmphasisPop: true`(강조 단어가 커졌다 제 크기로).

**★2차 검수 반영(Owner 10/7 "아직도 첫 발화가 씹혀서 들린다 / 목소리가 느리다 / 글자 더 크게 / 상단에 제목 / 앞으로 이 기준으로 계속 적용, 명심")**:
- **첫 발화 보존(소리 자체 원인)**: eleven_v3 alignment의 장면 발화 시작은 실제 첫 소리보다 0.06~0.26초 늦어, 템포 도구가 쉼을 자르는 구간에 다음 장면 첫 소리 앞부분이 걸려 잘려 나갔다(17장면 중 15장면). `apply-story-tempo-once.mjs`가 이제 원본에서 실제 첫 소리를 감지해 장면 경계를 "첫 소리 − 0.12초(`--preroll`)"로 잡는다. 스토리형 템포는 항상 이 도구로(옛 판 `tempo-1.15-gap0.35`는 쓰지 않는다).
- **목소리 속도(확정 1.20배)**: 부엉 목소리는 설명용이라 스토리형 긴장감엔 1.15배가 느렸고(Owner), 1.25배는 "너무 급한 느낌"(Owner 재검수) → **템포 배율 1.20**, 장면 끝 쉼 상한 0.25초(+pre-roll 0.12 = 실제 약 0.37초). 배경음도 새 길이에 맞춘다(`atempo`로 시간 맞춤: 원곡 길이÷새 길이). TTS 재생성(유료) 없이 가능. 1편 89.8(1.15)→84.1(1.25)→**87.6초(1.20)**. 다시 조정 요청이 오면 1.18~1.22 범위에서.
- **상단 제목**: 설명형과 같은 방식(어두운 층+흰 글자, 마지막 줄 노랑, 108px, 제목은 게시 제목 그대로 줄만 나눔) — 스펙 `headerTitle`. 스토리 1편은 ["금 모으기,", "장롱 속 금을 들고", "줄을 선 나라"].
- **자막 글자 크기**: 스토리형 `captionFontSize: 102`·`captionY: 1385`(설명형 96·1360) — 계획기 도입 후 값, 상세·104 불가 사유는 [[feedback_caption_tidy_planner_and_story_assembly_checklist_2026_10_07]]. 폭 한도 760px(오른쪽 좋아요 아이콘 열 회피)는 QA가 지킨다.
- **AI 표시**: 화면 글자 없음. YouTube `containsSyntheticMedia: true`(기존) + Instagram 게시 도구가 이제 컨테이너 생성 때 `is_ai_generated=true`를 보낸다(Meta 변경 기록 2026-06-22, 게시 후 추가 불가; API 버전이 거부하면 라벨 없이 한 번 재생성하고 결과 파일 `aiLabelApplied=false`로 보고). 계정 단위 "AI 생성 프로필" 토글(프로필 편집, 2026-05 출시, 계정 전체에 뜨는 라벨)은 Owner 계정 설정이라 Owner가 앱에서 직접 결정·설정.
- **인스타 "AI 생성 프로필" 계정 라벨은 달지 않기로(Owner 10/7 "맞다면 달아도 돼" → 판단: 불필요)**: Meta가 2026-08-31 라벨 이름을 "AI creator"→"AI-generated profile"로 바꾸며 **"AI로 생성된 사람이 얼굴인 프로필"용**이고 AI 도구만 쓰는 크리에이터에겐 해당 없다고 밝혔다(라벨 안 단 AI 인물 계정은 도달 제한). 우리 채널은 만화 캐릭터(부엉·황소)와 이름 없는 재연 인물이라 해당 가능성이 낮고, 라벨을 달면 계정 전체·모든 게시물 아래에 "AI 생성 프로필"이 떠 신뢰도·반응에 영향이 있을 수 있다(수치는 모름). → 달지 않고, 인스타 게시 도구의 `is_ai_generated`는 **스토리형(manifest.aiLabel===true 또는 formatProfile==="story_v1")에만** 보낸다(설명형 기존 동작 불변). 인스타에서 도달 급감·경고가 오면 그때 계정 라벨 재검토. **스토리형 콘텐츠 유닛 만들 때 manifest에 `aiLabel: true`(또는 formatProfile story_v1)를 넣을 것.**
- **이 기준은 2편부터 스토리형 전체에 적용**: 조립 스펙에 `headerTitle`·`captionFontSize: 102`·`captionPlanner`·`emphasisTerms`·`emphasisNumberPatterns`·`captionEmphasisPop`·`captionLeadSec`·`captionSceneEndMarginSec`·`captionLastSceneNoMargin`, 템포는 `--factor 1.20 --max-scene-gap 0.25 --keep-gap-scenes <긴장 장면>`, 배경음은 새 길이에 맞춰 시간 맞춤.

**Why:** 설명형 기준(제목 띠·훅 H1~H4·장면 끝 0.5초 여유)을 스토리형에 그대로 쓰면 어긋난다. **How to apply:** 스토리형 편은 스펙에 `emphasisTerms`(편 핵심어)·`emphasisNumberPatterns`·`captionEmphasisPop`·`captionLeadSec`·`captionSceneEndMarginSec`·`captionLastSceneNoMargin`을 넣고, QA는 `formatProfile: story_v1`로 설명형 훅 검사를 건너뛴다. 관련 [[feedback_story_best_structure_samsung_v6_confirmed_2026_10_07]], [[project_story_episode_plan_2026_10_07]].
