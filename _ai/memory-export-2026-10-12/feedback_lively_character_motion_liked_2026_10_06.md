---
name: feedback-lively-character-motion-liked-2026-10-06
description: "캐릭터가 카메라 쪽으로 걸어오는 등 생동감 있는 장면을 Owner가 선호 — 다른 영상에도 넣으면 좋겠다고 함(2026-10-06, 부엉 22편 s5·15·16)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-10-05T21:02:44.867Z
---

Owner(2026-10-06): 부엉 22편 s5·s15·s16에서 부엉이가 카메라 쪽으로 다가오는 장면을 "마음에 든다", "다른 영상들도 이렇게 생동감 있는 장면 넣는 게 좋을 것 같다"며 현재본으로 확정.

**Why:** 정지 화면처럼 보이는 첫 3초·중간 이탈 문제(성과 분석)를 줄이는 방향과 맞고, Owner가 직접 선호를 밝힘.

**How to apply:** 새 편의 영상 프롬프트(`build-video-generation-prompts.mjs`)를 쓸 때 prop 없는 8초 씬(오프닝·정리 등) 일부에 "캐릭터가 카메라 쪽으로 걸어 다가온다(배경 고정)" 같은 동작을 넣는 것을 기본 후보로 제안한다. 단 카드·소품 든 씬은 기존 규칙(10초, 소품 감싸 쥐기, 입 멈춤 단계) 우선 — 카드 글자가 움직임으로 흐려지거나 잘리지 않게. 하드 규칙 아님(Owner는 선호만 밝힘, 규칙 28). 관련: [[project_opening_motion_experiment_2026_10_05]], [[feedback_opening_scene_keep_separate_no_fixed_clip_2026_10_06]].
