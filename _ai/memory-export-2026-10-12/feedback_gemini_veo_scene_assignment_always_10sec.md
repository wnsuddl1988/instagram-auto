---
name: feedback-gemini-veo-scene-assignment-always-10sec
description: "특정 씬을 Gemini(Veo)로 생성하기로 정하면 그 씬은 무조건 10초로 나온다 — 8초/10초 티어 판정과 별개로, Gemini 배정 여부를 먼저 확인하고 프롬프트 길이 표기를 거기 맞출 것"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 96dabe12-0224-46cf-9034-b0b64d75918f
  modified: 2026-09-23T14:14:02.488Z
---

## 규칙

씬별 영상 생성 도구를 Gemini(Veo)로 배정하면, 그 씬은 TTS 실측 길이나 8초/10초 티어 판정과 무관하게 **항상 10초 결과물**이 나온다. Owner가 "이 씬들은 Gemini로 만들 거야"라고 정하는 건 [[feedback_video_scene_length_tier_smooth_transition]]의 8초/10초 티어 판정 로직과는 **완전히 별개의 결정**이다 — 발화가 짧아 8초로 충분한 씬(예: 클로징 액션 씬, 발화 2~3초)이라도 Gemini로 보내면 10초가 나온다.

**Why**: 15편 작업 중 s9(발화 5.39초, 8초로 충분)·s10(발화 2.66초, 8초로 매우 충분)을 Owner가 Gemini 생성 대상으로 지정했다. 제가 처음엔 이 둘을 8초 프롬프트로 작성했는데, Owner가 "s6, s8~s10은 gemini로 생성할꺼라 10초로 나올거야 참고해"라고 정정 — 프롬프트를 10초 기준으로 다시 써야 했다. s6·s8은 제가 판정한 "10초가 필요/안전한 씬"과 우연히 겹쳤지만, s9·s10은 순수히 Owner의 도구 배정 선택이었을 뿐 티어 판정과 무관했다("너가 s6,s8 2개줘서 2개는 내 임의로 정한거야" — 즉 Gemini 배정 4개 중 2개(s6·s8)만 제 판정과 우연히 일치, 나머지 2개(s9·s10)는 Owner가 별도로 고른 것).

## How to apply

1. 영상 프롬프트 작성 전, **어떤 씬을 Gemini로 생성할지 먼저 Owner에게 확인**하거나 지시받은 배정을 그대로 따른다 — 발화 길이만 보고 "8초면 충분하니 8초로 요청"이라고 임의 판단하지 않는다.
2. Gemini 배정 씬은 프롬프트 본문을 항상 "Animate this image into a 10-second video clip"으로 쓰고, CONTINUOUS MOTION 문구도 10초 기준(마지막 3~5초까지 정지 없음)으로 맞춘다. 발화가 짧게 끝나는 씬(예: 발화 2~3초)이면 "발화 종료 후 남은 시간도 자연스러운 호흡/눈깜빡임 유지, 정지 금지"를 명시한다.
3. Gemini가 아닌 도구(Flow 등)로 가는 씬만 [[feedback_video_scene_length_tier_smooth_transition]]의 8초/10초 판정 로직(발화 8초 미만→8초 요청, 이상 또는 애매하면 10초 요청)을 그대로 적용한다.
4. 영상 생성 프롬프트 문서(`_ai/owl-epN-video-generation-prompts.md` 등)에는 "생성 도구" 컬럼을 표에 명시해서, 어느 씬이 Gemini 고정 10초이고 어느 씬이 티어 판정에 따른 것인지 구분해 기록한다.

## 관련
- [[feedback_video_scene_length_tier_smooth_transition]] (8초/10초 티어 판정 로직 자체 — 이 메모리는 그 판정과 "Gemini 배정"이 별개임을 보충)
