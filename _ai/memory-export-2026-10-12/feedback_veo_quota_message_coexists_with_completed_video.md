---
name: feedback-veo-quota-message-coexists-with-completed-video
description: Gemini 응답 페이지에서 완성된 영상과 quota 소진 안내가 한 화면에 공존할 수 있음 — 완료 확인이 우선
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 209772ed-9454-43be-8a7d-a56438263799
  modified: 2026-09-16T22:20:08.580Z
---

Gemini Veo 응답 페이지에서 "지금은 동영상을 생성할 수 없습니다 (다음 요청의 한도 소진 안내)" 메시지가 떠 있어도, 그 위/같은 화면에 **이미 완성된 이전 영상**이 함께 존재할 수 있다. 2026-09-17 Scene 3 실사례: 영상 자체는 정상 생성 완료됐는데, 자동화 스크립트가 quota 문구만 보고 실패로 오판해 다운로드를 건너뛸 뻔했다(사용자가 화면 스크린샷으로 직접 확인해 발견).

**Why:** 자동화 로직이 "quota/refusal 텍스트 존재 여부"를 "완료된 다운로드 가능 응답 존재 여부"보다 먼저 검사하면, 실제로는 성공한 결과를 놓치고 실패 처리하는 오판이 생긴다. 사용자가 "다음번에도 실수하지 않게 잘 확인하라"고 명시적으로 지적함.

**How to apply:** Gemini 응답 상태를 판정하는 코드(현재 [[project_veo_concurrency_limit]], [[project_gemini_veo_flashlite_quota]] 관련 스크립트 — `run-owl-veo-motion-submit-then-collect-v1.mjs`의 `tryCollectOne`)는 반드시 "다운로드 가능한 완료 응답부터 먼저 확인 → 없을 때만 quota/refusal로 최종 실패 판정" 순서를 지킬 것. quota 텍스트가 보인다고 즉시 실패 처리하지 말고, 같은 페이지에 완성된 결과물이 있는지 먼저 확인해야 한다.
