---
name: project-gemini-veo-flashlite-quota
description: Gemini Veo 영상 생성 한도와 Flash-Lite 모델 선택 근거
metadata: 
  node_type: memory
  type: project
  originSessionId: 209772ed-9454-43be-8a7d-a56438263799
  modified: 2026-09-16T22:15:19.467Z
---

Gemini 계정 영상 생성 한도는 영상 1개당 약 23% 소진 — Flash-Lite 모델로도 동일하게 소진되어 한 주기(윈도우)당 최대 약 4장까지 생성 가능. 이 한도는 일일 단위가 아니라 약 4~5시간마다 초기화되는 롤링 윈도우다(2026-09-17 실측, 사용자 확인 및 정정).

Flash-Lite는 Pro 대비 영상 퀄리티가 동일하면서 생성 속도가 훨씬 빠름(Scene 1 실측: 제출~다운로드 약 1분 45초). 한도 소진량이 모델 등급과 무관하게 고정이므로, 속도 이득만 있고 손해가 없어 Flash-Lite를 기본 모델로 사용하는 것이 합리적.

**Why:** 사용자가 Pro/Flash/Flash-Lite 속도·품질·한도 비교 실험을 요청했고, 실측 결과 한도는 모델과 무관하게 1개당 23% 고정, 품질 차이 없음, 속도만 Flash-Lite가 우세.

**How to apply:** 앞으로 `run-owl-veo-motion-submit-then-collect-v1.mjs` 등 Gemini Veo 영상 생성 스크립트 실행 시 `--model "Flash-Lite"` 옵션을 기본으로 사용. 배치 계획을 짤 때 "한 윈도우(4~5시간)당 최대 4장" 한도를 기준으로 스케줄링 — 한도 소진 시 다음 윈도우(4~5시간 후)까지 대기해야 함. ([[project_veo_concurrency_limit]] 참고 — 동시 생성 2개 제한과는 별개의 제약).
