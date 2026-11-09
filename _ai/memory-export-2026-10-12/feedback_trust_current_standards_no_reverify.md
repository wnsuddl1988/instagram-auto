---
name: feedback-trust-current-standards-no-reverify
description: _ai/CURRENT_STANDARDS.md에 명시된 절차/스크립트는 그대로 신뢰하고 실행할 것 — 스크립트 인자가 예상과 달라 보인다고 별도 조사 에이전트를 돌리지 말 것
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 0616c897-fe63-4f4b-b75e-04be8bd972c3
  modified: 2026-09-20T22:54:40.478Z
---

`_ai/CURRENT_STANDARDS.md`는 Owner가 직접 정리해서 유지하는 단일 진실 공급원
(SSOT)이다. 여기 적힌 스크립트 경로·절차는 그대로 신뢰하고 바로 실행한다.

**Why:** 10편 이미지 생성 단계에서 CURRENT_STANDARDS.md에 이미 "이미지 생성:
scripts/probe-character-consistency-chatgpt-v1.mjs, 참조 이미지 첨부+세션
연속 생성"이라고 명시돼 있었는데, 그 스크립트의 `--character cat|calc` 인자만
보고 "owl/geumbaksa용이 아닌 것 같다"고 의심해 조사 에이전트를 백그라운드로
돌렸다. Owner가 "최신문서에 다 정리해놨는데 왜 또 조사를 하냐, 이럴려고
최신화 한건데"라고 지적(2026-09-21) — 문서를 최신화해둔 의미 자체가
무색해지는 행동이었다.

**How to apply:** CURRENT_STANDARDS.md에 명시된 스크립트/커맨드/경로가 지금
보는 코드와 안 맞아 보여도, 먼저 그 스크립트를 실제로 문서에 적힌 방식대로
실행해보고 에러가 나는지 확인한다(인자 이름이 다르거나 확장된 것일 수 있음).
정말 실행 자체가 막히는 명백한 불일치가 발견됐을 때만 사용자에게 짧게
물어보거나 문서 갱신을 제안하고, 그 전에 별도 조사 에이전트부터 돌리지
않는다. [[project_owl_shorts_domain_expansion]] 계열 — CURRENT_STANDARDS.md
갱신 이력이 있는 프로젝트라는 걸 상기.
