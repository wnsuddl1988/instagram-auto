---
name: feedback-read-standards-source-then-run-checker-2026-09-30
description: "★대본은 요약 메모리가 아니라 CURRENT_STANDARDS §1/§3 원문을 읽고 쓰고, 확정·TTS 전에 check-script-standards.mjs로 대조해 결과 표를 보고에 첨부(Owner 화냄 2026-09-30, 부엉·황소 공통)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-09-30T14:54:14.726Z
---

Owner 지적(2026-09-30 밤): 부엉 18편 대본이 "새로 개편된 구조"가 아니었다 → 지적하니 또 달라졌다. "메모리에 정확히 기억하고 바뀐 기준으로 하라고 했음에도 불구하고", "이런 실수 없도록, 부엉박사든 황소특보든".

**Why:** 9/26에 쓴 요약 메모리(뼈대 한 단락)만 보고 썼고, §1 표의 세부(상황의 기관·기존 vs 변경, 핵심 질문 C/D형, 항목별 "쉽게 풀면", 정리 결론, 연속 어미 금지, 같은 수치 두 번 금지)를 읽지 않았다. A-2 "요건은 나중에 대조한다"를 건너뜀. "고쳤다"고 보고한 v8도 검사기를 돌리니 위반이 더 남아 있었다.

**How to apply (최우선 규칙 26):** ① 쓰기 전 그 세션에서 CURRENT_STANDARDS 해당 캐릭터 섹션(부엉 §1, 황소 §3)·A-2·규칙 17을 직접 열어 읽는다(메모리는 색인일 뿐). ② 쓴 뒤 확정·TTS 전에 `node scripts/check-script-standards.mjs --character owl|bull --scenes <json> --hook-type T#`로 "반드시 수정 0"을 만들고 ✅/⚠/❌ 표를 보고에 붙인다. ③ 기계로 못 잡는 것(팩트·출처, 훅 H3, 매수 암시, 허용리스트 밖 종목 실명, 흐름)은 사람이 대조해 따로 적는다. ④ 기준이 바뀌면 검사기 조건도 같은 날 고친다. 소급: 이 검사 이전 편(황소 11편 연속 어미 3곳·수치 중복, 부엉 15편 15씬·쉽게 풀면 없음)은 고치지 않고 다음 편부터 적용. 관련: [[project-owl-ep18-youth-savings-in-progress-2026-09-30]], [[feedback-no-omission-run-all-rules-2026-09-30]], [[feedback-hook-rules-v1-2026-09-30]].
