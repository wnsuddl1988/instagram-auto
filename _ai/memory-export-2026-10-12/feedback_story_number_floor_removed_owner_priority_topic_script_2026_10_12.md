---
name: feedback-story-number-floor-removed-owner-priority-topic-script-2026-10-12
description: "스토리형 \"숫자 4개 이상\" 하한은 Owner 규칙이 아니라 Claude가 만든 값 — Owner 10/12 완화 승인, 폐지(쓰는 숫자만 2출처). Owner가 중요시하는 건 주제와 대본"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 1d556ea0-6135-4784-9793-c20382605cb4
  modified: 2026-10-11T16:32:01.097Z
---

Owner(10/12): "숫자 4개 이런 규칙은 내가 만들지도 않았어. 너가 만든 거야. 완화해도 돼. 내가 중요시 여기는 건 이미 말했어. 주제와 대본."

**Why:** 10/7 올림픽 2편 때 Owner의 정성 평가("구체적 숫자가 없으니 일화 설명에 가까운 내용")를 내가 "4개 이상"이라는 임계값으로 바꿔 검사기 fix·소재 풀 판정(R3)·러너 감점(−15)에 박았다. 같은 날 "관심도 4 이상 2명"도 내가 만든 값이어서 내렸는데 같은 실수를 반복했다. 이 하한 때문에 소재 풀이 부풀려 보이거나 좋은 이야기가 탈락했다.

**How to apply:**
- 하드 규칙에 숫자 임계값을 넣기 전에 Owner 발언 원문이 있는지 `_ai/owner-rule-provenance.md`에서 확인한다(규칙 28). 없으면 권고(warn)로만.
- 현행: 대본에 실제로 쓰는 숫자만 각각 서로 다른 사이트 2곳 같은 값. 개수 하한 없음. 결정 장면 2출처·날짜 3개 이하·퍼즐의 답은 그대로.
- 소재를 거르는 기준의 중심은 사실 정확·법적 문제 없음·주제(상식 테스트·퍼즐과 답·결정 장면)와 대본이다.
- 반영 위치: `_ai/story-script-rules.md`(누적 피드백·변경 이력), `_ai/story-format-structure-v1.md`, `_ai/templates/story-script-base-structure.md`, `_ai/story-pool-final-classification-2026-10-11.md` §2 정정, `_ai/owner-rule-provenance.md`, 검사기 `_story-script-standards.mjs` fix→warn, 러너 `run-story-topic-scan-once.mjs` −15 제거(문법 확인 완료, 실행 시험은 안 함).
- 풀 JSON의 10/11 못 씀 판정 중 "숫자 4개 못 채움"만이 사유인 건은 아직 재판정하지 않았다(결정 장면 단일 출처·값 상충 사유는 그대로).

관련: [[project_story_new_candidates_scan_2026_10_11]], [[feedback_story_script_rules_top_priority_preflight_every_revision_2026_10_11]], [[feedback_scene_count_not_owner_rule_2026_10_01]]
