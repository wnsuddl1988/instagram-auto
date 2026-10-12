---
name: feedback-flow-always-lite-model
description: Google Flow(labs.google/fx)로 영상 생성 시 반드시 lite 모델만 사용 — fast/quality 금지
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 209772ed-9454-43be-8a7d-a56438263799
  modified: 2026-09-16T22:22:25.263Z
---

Google Flow에서 owl 시리즈 등 영상을 생성할 때는 **무조건 Veo 3.1 - Lite** 모델을 사용한다. Fast나 Quality를 쓰면 안 된다.

**Why:** Lite는 크레딧 10 소모로 고정되어 있고, 사용자가 이 크레딧 소비량을 기준으로 예산을 관리한다. 2026-09-17 세션에서 Claude가 기본값(`--model` 인자 생략 시 fast)으로 잘못 실행한 사고가 있었고, 사용자가 "flow에서도 무조건 lite모드로 실행해야돼, 모델 헷갈리지마"라고 명시적으로 두 번 강조함.

**How to apply:** `run-owl-flow-motion-execute-once-v1.mjs` 등 Flow 실행 스크립트를 호출할 때 **항상 `--model lite`를 명시적으로 전달**한다. 스크립트의 기본값(fast)을 절대 믿지 말고 매번 직접 지정할 것. 다른 Flow 관련 스크립트(`run-minjae-flow-*`, `check-*-flow-*`)를 쓸 때도 모델 옵션이 있으면 동일하게 lite로 고정. [[project_gemini_veo_flashlite_quota]]는 Gemini 내장 Veo 얘기이고 이건 별도 시스템(Flow)에 대한 규칙이니 혼동하지 말 것.
