# Shorts Editorial OS V2 — Execution Routing and Control Tower Governance

Updated: 2026-08-04 KST

## 1. Activation status

- Owner approval: `APPROVE_SHORTS_EDITORIAL_OS_V2_TOP_LEVEL_AUTONOMOUS_EXECUTION_AND_CHATGPT_CONTROL_TOWER_ESCALATION_GOVERNANCE_V1`.
- Governance implementation: `IMPLEMENTATION_COMPLETE_AWAITING_TARGETED_CROSS_REVIEW`.
- Autonomous same-Slice loop: `PENDING_ACTIVATION`.
- Mandatory routing header: `PENDING_ACTIVATION`.
- ChatGPT major-decision escalation: `PENDING_ACTIVATION`.
- Activation requires Claude Code targeted review `PASS`, `P0 0`, `P1 0`, followed by the pre-authorized exact governance checkpoint commit.
- Slice 3 remains `BLOCKED_PENDING_OWNER_EXACT_SCOPE` and push remains `NOT_AUTHORIZED`.

## 2. Purpose and precedence

This governance accelerates routine work inside an already approved Slice while making major decisions impossible to miss.

Precedence for Shorts Editorial OS V2:

1. Current Owner direct instruction and safety, data-protection, and legal prohibitions.
2. This governance and its highest-priority summary in `AGENTS.md`.
3. Active Slice approval packet and project-local state documents.
4. Other existing project workflow text.

If a lower rule requires a command that the current Owner explicitly prohibits, the prohibition wins. Codex must not run the command; it must stop and emit `CHATGPT_CONTROL_TOWER_REVIEW_REQUIRED`. This applies even to a generally required build, test, or administrative step.

This project is Shorts Editorial OS V2 in `C:\Users\PC\jjy\instagram-auto`. It must not be named or mixed with Money OS, money-os, or Money OS V2, and `C:\Users\PC\jjy\money-os` is outside scope.

## 3. Roles

- Owner: approves product and Slice scope, exact allowlists, architecture, external/cost/account actions, checkpoint authority, push, deploy, and publication.
- ChatGPT Control Tower: decides major product/scope/risk branches and approves the exact next-Slice scope packet for Owner relay.
- Codex: Main AI and only writer. It implements and verifies approved same-Slice work, routes review, performs allowed corrections, and proactively signals every Control Tower handoff.
- Claude Code: independent read-only Cross Reviewer. It never edits files, creates temporary files, performs external writes, commits, pushes, deploys, or publishes.

## 4. Mandatory routing headers

Every major Codex work result must begin with exactly one header below. A result without one is operationally invalid.

### A. Approved same-Slice routine continuation

`ROUTING_DECISION: AUTONOMOUS_SAME_SLICE_CONTINUE`

- No ChatGPT relay is needed.
- Codex may continue only within the current approved Slice, exact allowlist, and behavior boundary.
- No dangerous external action is allowed.

### B. Claude Code read-only review

`ROUTING_DECISION: CLAUDE_CODE_READ_ONLY_REVIEW_REQUIRED`

- The user relays the supplied prompt to Claude Code, not ChatGPT.
- Claude Code is read-only and returns its result to Codex.
- This remains a routine same-Slice loop unless Claude triggers escalation.

### C. ChatGPT Control Tower decision

`ROUTING_DECISION: CHATGPT_CONTROL_TOWER_REVIEW_REQUIRED`

The next line must be exactly:

`이 결과를 ChatGPT Control Tower 대화에 전달하십시오. 전달 전에는 작업을 계속하지 마십시오.`

- Codex stops immediately.
- No implementation, correction, review, commit, or next-Slice work continues until ChatGPT and Owner decide.

### D. Slice complete, next scope required

`ROUTING_DECISION: SLICE_COMPLETE_AWAITING_CHATGPT_NEXT_SCOPE`

The next line must be exactly:

`현재 Slice가 완료되었습니다. 다음 Slice 범위 승인을 위해 이 결과를 ChatGPT Control Tower에 전달하십시오.`

- The current Slice and approved checkpoint are complete.
- No next-Slice file may be created before ChatGPT approves the exact next scope and Owner relays that approval.

### E. Safe continuation blocked

`ROUTING_DECISION: BLOCKED_AND_CHATGPT_REVIEW_REQUIRED`

- Work is blocked and the full result must be relayed to ChatGPT.
- No automatic workaround, scope expansion, or speculative fix is permitted.

## 5. Autonomous same-Slice loop

Once ChatGPT and Owner approve a Slice purpose, exact scope, exact file allowlist, prohibitions, completion conditions, Cross Review conditions, and checkpoint conditions, Codex may proceed without intermediate ChatGPT approval:

1. Codex implements inside the allowlist.
2. Codex performs the approved self-checks.
3. Claude Code performs read-only Cross Review.
4. A normal P1 finding may be corrected minimally by Codex only when the correction is inside the approved scope and allowlist and Claude reports no Control Tower trigger.
5. Claude Code performs targeted read-only re-review.
6. `P0 0` and `P1 0` produce `PASS`.
7. Codex creates one exact checkpoint commit only when its paths, message, validation, and post-check were pre-authorized.
8. Codex emits the final completion packet and routes it to ChatGPT for the next scope.

Routine work includes allowlisted implementation, checker/test strengthening, local P1 correction, targeted re-review, TypeScript correction, wording/type/validation strengthening, state-document updates, pre-authorized exact checkpoint commit, non-blocking P2 deferral, and hash/baseline/allowlist verification.

Conditions:

- Claude Code remains read-only.
- Codex is the only writer.
- The next Slice cannot begin before Claude `PASS` and Control Tower approval.
- No out-of-scope change or push is permitted.
- A targeted correction cycle is limited to two rounds.

## 6. Mandatory ChatGPT Control Tower escalation matrix

Codex must stop, emit `ROUTING_DECISION: CHATGPT_CONTROL_TOWER_REVIEW_REQUIRED`, supply the decision packet, instruct the user to relay it, and wait for ChatGPT and Owner when any condition below occurs.

### 6.1 Next Slice or product decision

- The current Slice is complete.
- The next Slice purpose or exact scope must be decided.
- The next Slice allowlist must be decided.
- Product definition, user flow, UX structure, content pipeline, quality gate, or approval policy changes.
- Character, brand, or video-grammar decisions.
- A `KEEP | EXTEND | REPLACE | DEPRECATE` decision changes.

### 6.2 Scope expansion

- A file outside the current allowlist is needed.
- A dependency is added or removed, or `package.json`/lockfile changes.
- `tsconfig`, `next.config`, middleware, root layout, route group, or an existing route changes.
- An API route or server action is needed.
- DB, migration, authentication, durable persistence, or a storage adapter is needed.
- A V1 file changes or V1 data is moved, deleted, or migrated.
- An existing checkpoint needs amend, rebase, or merge.

### 6.3 External, cost, or operational action

- External LLM API, web search, URL fetch, or DNS.
- OAuth or any paid TTS, image, or video generation.
- Real ffmpeg rendering.
- Real Instagram or YouTube publication, scheduled publication, deploy, or push.
- Production data or V1 deletion.
- Any action requiring cost approval.

### 6.4 Risk or conflict

- A P0 finding or `BLOCKED` verdict.
- Baseline hash or checkpoint immutable mismatch.
- Any change outside the allowlist.
- Suspected checker false-PASS.
- Codex and Claude Code disagree.
- The same P1 recurs after correction.
- More than two correction cycles would be required.
- Safety, rights, account, cost, or legal judgment is needed.
- Owner must choose between two or more design options.
- An explicitly prohibited command appears necessary.
- The approved scope cannot satisfy the completion conditions.

These conditions cannot be ignored or downgraded to P2 by Codex.

## 7. Control Tower decision packet

When Control Tower review is required, Codex outputs:

```text
ROUTING_DECISION: CHATGPT_CONTROL_TOWER_REVIEW_REQUIRED

이 결과를 ChatGPT Control Tower 대화에 전달하십시오. 전달 전에는 작업을 계속하지 마십시오.

CHATGPT_CONTROL_TOWER_REVIEW_REQUIRED

프로젝트: Shorts Editorial OS V2
현재 Slice:
현재 단계:
현재 판정:
중단 이유:

1. ChatGPT 결정이 필요한 정확한 문제
2. 현재 Owner 승인 범위
3. 실제 저장소 근거
4. Codex 판단
5. Claude Code 판단
6. 두 판단의 일치 또는 충돌 여부
7. 가능한 선택지
8. 선택지별 장점
9. 선택지별 위험
10. Main AI 권장안
11. 필요한 scope·allowlist 변경
12. 현재 branch
13. 현재 HEAD와 parent
14. upstream ahead/behind
15. modified / untracked / staged / status paths
16. baseline·checkpoint 보호 상태
17. commit / push 상태
18. 외부 작업 수행 여부
19. 되돌리기 어려운 영향 여부
20. Owner가 결정해야 할 한 가지 핵심 질문
```

No field may be omitted.

## 8. Slice completion packet

After implementation, Cross Review, allowed correction, and checkpoint are complete, Codex outputs:

```text
ROUTING_DECISION: SLICE_COMPLETE_AWAITING_CHATGPT_NEXT_SCOPE

현재 Slice가 완료되었습니다. 다음 Slice 범위 승인을 위해 이 결과를 ChatGPT Control Tower에 전달하십시오.

SHORTS_EDITORIAL_OS_V2_SLICE_N_COMPLETE_AND_CHECKPOINTED

1. Slice 목적
2. 최종 구현 범위
3. exact 변경 path
4. Codex checker 결과
5. TypeScript/build 검증
6. Claude Code 최종 판정
7. P0/P1/P2
8. correction cycle 수
9. checkpoint commit
10. parent
11. commit path
12. post-commit working tree
13. 보호 baseline
14. push 상태
15. runtime/external 상태
16. 남은 UNVERIFIED
17. 다음 Slice 차단 상태
18. ChatGPT가 결정해야 할 다음 scope
```

The user does not need to relay intermediate routine results to ChatGPT before this packet.

## 9. Claude Code read-only review contract

Every Claude review prompt must state:

- Claude Code is read-only.
- File modification and temporary-file creation are prohibited.
- External write, implementation, scope expansion, commit, push, deploy, and public upload are prohibited.
- The verdict is `PASS | NEEDS_FIX | BLOCKED` with `P0 | P1 | P2`, exact file/symbol/evidence, and reproducible probes.
- Claude attacks checker false-PASS and verifies allowlist, baseline, and checkpoint invariants.
- Claude must output `CONTROL_TOWER_ESCALATION_TRIGGERED: YES | NO` and `ESCALATION_REASON: ...`.

Claude must report `YES` for P0, BLOCKED, scope expansion, hash mismatch, a design judgment different from Codex, repeated P1, an Owner decision, or any external/cost/publication/deploy/push requirement. Codex must then route to ChatGPT rather than treating it as a routine correction. A normal local P1 inside the approved allowlist may report `NO` and enter the same-Slice correction loop.

## 10. Commit and push policy

- A checkpoint commit is allowed only when exact paths, fixed message, validation conditions, and post-check conditions were pre-authorized.
- Without that pre-authorization, Claude `PASS` does not authorize a commit; Codex routes to ChatGPT.
- Governance checkpoint pre-authorization applies only after targeted Claude `PASS`, `P0 0`, and `P1 0`, and only to:
  1. `AGENTS.md`
  2. `_ai/SHORTS_EDITORIAL_OS_V2_GOVERNANCE.md`
  3. `_ai/PROJECT_STATE.md`
  4. `_ai/NEXT_ACTION.md`
- Stage each path explicitly. `git add .`, `git add -A`, and `git add --all` are prohibited.
- Required staged state: four paths, new 1, modified 3, delete/rename/binary 0, dirty baseline staged 0, cached diff check PASS.
- Fixed message: `docs(editorial-v2): establish control tower escalation governance`.
- Create one commit only; do not amend.
- Expected parent: `58736883c200148e90fe4de44d7e25a1c63f70a2`.
- Expected post-commit upstream: `+3/-0`; remaining tree: modified 21, untracked 3, staged 0, status paths 24, baseline hash/status mismatch 0.
- Push is always prohibited without separate exact Owner approval.

## 11. Prohibited automatic continuation

The next Slice starts only after the current Slice has Claude final `PASS`, `P0 0`, `P1 0`, any required checkpoint is complete, the protected baseline is valid, ChatGPT approves the next purpose and exact allowlist, and Owner relays the approval prompt to Codex.

Codex and Claude Code may not define or start the next Slice themselves. A Claude `PASS` never grants next-Slice authority. `BLOCKED` never permits a workaround implementation.

## 12. Process deviation record

`PROCESS_DEVIATION_EXPLICITLY_FORBIDDEN_BUILD_EXECUTED_WITHOUT_SCOPE_AUTHORIZATION`

During the Slice 2 checkpoint, `pnpm build` was executed even though the Owner packet explicitly prohibited it. The build passed, commit allowlist contamination was zero, protected-path changes were zero, dirty-baseline mismatch was zero, and the checkpoint remains valid. The procedure nevertheless violated scope authorization.

Future rule: if an explicitly prohibited command appears necessary, do not execute it. Stop, emit `CHATGPT_CONTROL_TOWER_REVIEW_REQUIRED`, and wait for explicit ChatGPT and Owner approval. General project requirements do not override an exact current prohibition.

## 13. Current governed boundary

- Slice 0: `FINAL_PASS`.
- Slice 1: `FINAL_PASS`.
- Slice 2: `FINAL_PASS`, checkpoint `58736883c200148e90fe4de44d7e25a1c63f70a2`.
- Runtime/external integration: `NOT_STARTED`.
- Product operational capability: `NOT_CLAIMED`.
- Slice 3: `BLOCKED_PENDING_OWNER_EXACT_SCOPE`.
- Push: `NOT_AUTHORIZED`.
- Product build/dev is explicitly prohibited during this governance transition.
- This governance transition may modify only the four pre-authorized governance paths and must preserve the existing dirty 24-path status and SHA-256 snapshot.
