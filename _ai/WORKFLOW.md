# Ianpapa AI Coding Workflow

## Roles

Windows app workflow 유지. Left side / Codex = BRAIN. Right side / Claude Code = ACTION. User = approver and direction controller.

## Default loop

Codex prepares the smallest useful handoff -> Owner approves -> Claude executes approved scope -> Claude reports concise evidence -> Codex performs lean review/checkpoint judgment -> Owner decides next action.

## Codex command example

`프로젝트 문서와 _ai/PROJECT_STATE.md를 기준으로 다음 작업용 _ai/HANDOFF_NOW.md를 작성해줘. 코드 수정은 하지 마.`

## Claude Code command example

`_ai/HANDOFF_NOW.md를 읽고 승인된 범위만 실행해. 완료 후 _ai/CLAUDE_REPORT.md를 업데이트해.`

## Review command example

`Claude handoff와 git diff를 lean review로 확인해줘. 필요한 _ai 파일만 갱신하고, 코드 수정은 하지 마.`

## Approval rules

commit, push, deploy, DB, dependency, architecture, scope expansion, external actions require explicit Owner approval. Codex must still actively recommend checkpoint commit/push when a verified safe boundary is reached.

## Diff hygiene

Phase 종료·테스트 통과·handoff 완료·미해결 위험 없음 시 `git status -sb`와 `git diff --stat` 기준으로 checkpoint 판단을 반드시 남긴다. 안전하면 commit 메시지와 포함 파일만 제안한다. 실제 commit은 현재 Owner 승인 또는 Codex handoff의 `commit authorized` 문구가 있을 때만 수행한다. push는 Owner가 명시 승인한 경우에만 수행한다.
## Lean review budget

Claude handoff review defaults to pasted handoff + `git status -sb` + `git diff --stat` + one focused risk check. Do not read long reports or update all `_ai` files unless evidence is missing, scope is unclear, checks failed, or the task is high risk. Low-risk reviews should finish with a short verdict and checkpoint judgment.
## Stop after handoff

Claude Code must stop after final handoff. Do not continue into self-review, report polishing, build rerun, commit, push, or next-prompt generation unless the current approved scope explicitly says so. Default checkpoint output is recommendation only; actual commit requires current Owner approval or explicit `commit authorized` in the Codex handoff.
