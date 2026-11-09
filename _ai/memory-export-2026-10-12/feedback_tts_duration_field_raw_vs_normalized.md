---
name: feedback-tts-duration-field-raw-vs-normalized
description: "TTS summary JSON에서 씬 길이 티어(8초/10초 상한) 판정은 반드시 rawAudioDurationSec(순수 발화)로 하고 normalizedDurationSec(다음 씬 발화 시작 전까지, 문장間 pause 포함 타임라인 구간)를 혼동하지 말 것"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 0616c897-fe63-4f4b-b75e-04be8bd972c3
  modified: 2026-09-20T22:53:04.803Z
---

`elevenlabs-scene-paced-tts-summary.json`의 `scenes[].normalizedDurationSec`는
"이 씬 발화 시작 ~ 다음 씬 발화 시작 직전"까지의 타임라인 구간 길이라
문장 끝 pause(520ms 등)와 다음 씬 도입 여백까지 포함되어 있다. 실제 TTS가
말한 순수 발화 시간은 `rawAudioDurationSec`이며, 항상 `normalizedDurationSec`
보다 짧다(10편 실측 기준 씬당 약 0.7~1.2초 차이).

**Why:** 10편 대본 압축 작업 중 `normalizedDurationSec`(10.24초/10.42초)만
보고 "8~10초 티어 초과"라고 판단해 이미 충분히 압축된 대본(s4/s5)을 불필요하게
더 손보게 만들 뻔했다. Owner가 "몇 글자 추가 안 했는데 왜 갑자기 10초가
넘냐"고 지적(2026-09-21)해서 재확인한 결과, 실제 순수 발화(`rawAudioDurationSec`)
는 각각 9.165초/9.485초로 상한 이내였다 — 잘못 본 것은 필드 선택 실수였다.

**How to apply:** 영상 생성기 길이 상한(Veo 10초, Flow 8초) 준수 여부를 판정할
때는 반드시 `rawAudioDurationSec`을 기준으로 삼는다. `normalizedDurationSec`은
자막/조립 타임라인 배치에 쓰이는 별개 지표이므로 씬 길이 티어 판정에는 쓰지
않는다. TTS summary를 읽고 보고할 때 이 두 필드를 나란히 병기해 혼동 여지를
없앤다. [[feedback_owl_script_writing_common_principles]]의 "TTS 예상 시간
항상 기입" 원칙과 함께 적용 — 사전 추정 단계에서는 예상치임을 명시하고,
실측 이후 보고 시에는 raw 기준값임을 명시한다.
