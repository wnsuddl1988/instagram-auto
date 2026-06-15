# Ianpapa AI Coding Workflow

## Roles

Windows app workflow 유지. Left side / Codex = BRAIN. Right side / Claude Code = ACTION. User = approver and direction controller.

## Default loop

Codex writes HANDOFF_NOW -> Owner approves -> Claude executes approved scope -> Claude writes CLAUDE_REPORT -> Codex reviews report and diff -> Owner decides next action.

## Codex command example

`프로젝트 문서와 _ai/PROJECT_STATE.md를 기준으로 다음 작업용 _ai/HANDOFF_NOW.md를 작성해줘. 코드 수정은 하지 마.`

## Claude Code command example

`_ai/HANDOFF_NOW.md를 읽고 승인된 범위만 실행해. 완료 후 _ai/CLAUDE_REPORT.md를 업데이트해.`

## Review command example

`_ai/CLAUDE_REPORT.md와 git diff를 리뷰해서 _ai/CODEX_REVIEW.md, _ai/NEXT_ACTION.md, _ai/PROJECT_STATE.md를 업데이트해줘. 코드 수정은 하지 마.`

## Approval rules

commit, push, deploy, DB, dependency, architecture, scope expansion, external actions require explicit Owner approval.

## Diff hygiene

Phase 종료·테스트 통과·handoff 완료·미해결 위험 없음 시 diff 규모를 확인하고 Owner에게 checkpoint commit 또는 branch 정리를 제안. 자동 commit/push 금지.
