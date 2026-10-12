---
name: feedback-korean-and-control-tower-handoff-format
description: "Owner가 instagram-auto 프로젝트에서 모든 작업 진행/보고를 한글로, ChatGPT Control Tower 전달용은 블록형 인수인계서로 작성하라고 명시적으로 지시함"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 209772ed-9454-43be-8a7d-a56438263799
  modified: 2026-09-01T07:14:07.937Z
---

instagram-auto 프로젝트(및 관련 character-lab 작업)에서는 항상 다음을 지킨다:

1. **사용자에게 보이는 모든 진행 상황, 질문, 보고를 한글로 작성한다.** 영어 지시문(예: A1_MOUTH_NOSE_IDENTITY_LOCK_V1 같은 라우팅 지시)이 들어와도, 그에 대한 나의 응답·보고는 한글로 한다.
2. **ChatGPT Control Tower에게 전달할 내용이 있으면 반드시 하나의 ```text 코드블록 인수인계서 형태로 작성한다.** 산문이나 번호목록으로 흩어 쓰지 않는다. 블록 안에는 ROLE_MODE, 프로젝트명, 경로, 현재 상태, 변경 내용, 검증 결과, 남은 위험, Owner 승인 필요 항목 등을 포함한다.

**Why:** Owner가 2026-08-23 세션에서 "앞으로 무조건" 한글 진행 + 블록형 Control Tower 프롬프트를 명시적으로 요구함. 이는 `~/.claude/CLAUDE.md`의 기존 "Codex 전달은 무조건 블록형 인수인계서" 규칙([[feedback_codex_handoff_format]])을 ChatGPT Control Tower 보고에도 동일하게 확장 적용하라는 지시로 해석. 2026-09-01 home_problem_lab 세션(SLICE 1~3 진행 중)에서 "항상 컨트롤타워에게 보고할땐 블록형 검수인수인계 작성해서 보내줘"로 재확인됨 — 매 요청마다 다시 확인할 필요 없는 상시 규칙으로 계속 적용한다.

**How to apply:** instagram-auto 프로젝트 작업 시, (a) 모든 진행 로그/최종 보고를 한글로 쓴다. (b) Control Tower(ChatGPT)에게 넘길 내용이 하나라도 있으면 별도의 ```text 블록으로 인수인계서를 만들어 응답 끝에 포함시킨다. Codex 전달용 블록 규칙과 동일한 엄격함을 적용한다.
