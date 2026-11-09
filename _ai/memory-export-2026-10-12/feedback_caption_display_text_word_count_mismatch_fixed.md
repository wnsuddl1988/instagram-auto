---
name: feedback-caption-display-text-word-count-mismatch-fixed
description: "자막 숫자 표기(29.95%, 1% 등)가 안 바뀌던 버그 — run-owl-assemble-shorts-v2.mjs의 applyDisplayText 로직을 고쳐서 해결됨(2026-09-28)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 96dabe12-0224-46cf-9034-b0b64d75918f
  modified: 2026-09-28T13:05:32.488Z
---

`scripts/run-owl-assemble-shorts-v2.mjs`의 `applyDisplayText`(발화 텍스트를
숫자 그대로의 표시 텍스트로 바꾸는 함수)는 원래 **발화문과 표시문의 어절
개수가 정확히 같아야만** 1:1 치환이 됐다. "이십구점구오 퍼센트"(2어절) →
"29.95%"(1어절)처럼 숫자를 압축 표기하면 어절 수가 달라져 치환이 조용히
실패하고 화면에 한글 풀어쓴 발화가 그대로 나갔다(2026-09-28, 황소특보 7편에서
발견 — Owner가 완성 영상을 보고 "29.95%로 안 바뀐다"고 지적).

**수정 완료**: `alignWordGroups`/`resolveDisplayRange`/`remapWordTimings`
함수를 추가해, 발화문·표시문을 앞에서부터 동시 정렬하며 서로 다른 구간(숫자
표현 차이)을 하나의 치환 그룹으로 묶도록 일반화했다. `wordTimings`도 그룹
단위로 재계산해서 시간축 분할(긴 문장을 여러 자막 이벤트로 쪼개는 로직)이
깨지지 않게 함께 고쳤다. 어절 수가 같은 기존 케이스는 그룹이 전부 1:1이라
동작이 그대로 보존된다.

**중요한 순서 제약**: `applyDisplayText`는 반드시 `styleCaptions`(줄바꿈·시간축
분할) **이전**에 호출해야 한다. 거꾸로 하면(줄바꿈 확정 후 치환) 이미 정해진
줄 경계에 치환 결과가 억지로 끼워 맞춰져 `captionWidthPass`(자막 폭 검증)가
깨진다 — 실제로 한 번 이 순서로 잘못 고쳤다가 재발함, 원인 찾는 데 시간 소요.

**How to apply**: 앞으로 새 편의 `captionDisplayText`(숫자 그대로 표기)와
`performanceText`(한글 풀어쓴 발화)의 어절 수가 달라도 걱정 없이 써도 된다.
새 편 조립 후 자막에 숫자가 정상 표기되는지, `captionWidthPass` 경고가 없는지
`run-owl-assemble-shorts-v2.mjs` 실행 로그로 확인.
