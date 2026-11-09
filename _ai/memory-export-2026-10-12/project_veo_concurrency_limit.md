---
name: project-veo-concurrency-limit
description: Gemini 계정의 동시 영상 생성 요청 개수 제한(최대 2개)
metadata: 
  node_type: memory
  type: project
  originSessionId: 209772ed-9454-43be-8a7d-a56438263799
  modified: 2026-09-16T22:15:01.387Z
---

Gemini 계정은 동시 진행 중인 영상 생성 요청을 최대 2개까지만 허용한다. 3번째를 제출하면 "You have 2 video generation requests running right now, which is the maximum I can do at one time."로 거부됨(2026-09-17 실측, 3탭 동시 제출 시 3번째 거부 확인).

**Why:** 사용자가 화면에서 직접 거부 메시지를 확인하고 "앞으로는 새탭에 2개씩만 진행"하도록 요청함.

**How to apply:** `run-owl-veo-motion-submit-then-collect-v1.mjs`는 `--max-concurrent`(기본값 2)로 동시 진행 개수를 제한하는 배치 제출 로직을 갖추고 있음. 3개 이상 장면을 생성할 때는 이 옵션을 신뢰하고 한 번에 더 많이 열도록 우회하지 말 것. 참고: [[project_gemini_veo_flashlite_quota]](하루 한도는 이것과 별개 제약).
