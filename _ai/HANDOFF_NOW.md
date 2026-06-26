# HANDOFF_NOW

## Task ID

`owner-publishability-local-approval-ledger-v1-review-fix` — **완료 (uncommitted, checkpoint 대기)**

## Project

`C:\Users\PC\jjy\instagram-auto`

## Current Checkpoint

- Branch: `codex/source-first-blueprint-clean`
- Latest committed checkpoint: `ce987ee feat(package-preview): add local publishable projection dry run`
- Current uncommitted slice: `owner-publishability-local-approval-ledger-v1`
- Push: do not push.
- Known unrelated untracked file: `piq_diag_out.txt` — do not read, modify, delete, stage, or commit.
- Generated local approval data under `.money-shorts-local/` is gitignored and must not be staged/committed.

## Review Verdict

Direction accepted, but Codex found approval-boundary issues that must be fixed before checkpoint commit.

## Required Review Fixes

### Fix 1 — Server Action must not trust client-supplied FactCard

Current problem:

- `LedgerStatusPanel` is a Client Component and calls `recordApproval(factCard, notes)`.
- That means the Fact Card is supplied through the client action payload.
- This contradicts the intended invariant that the Fact Card is server-bound from `page.tsx`.

Required change:

- Bind the Fact Card in the Server Component, for example:
  - `const recordApprovalAction = recordApproval.bind(null, factCard);`
  - pass `recordApprovalAction` to `LedgerStatusPanel`
  - client calls `recordApprovalAction(notes)` only.
- Remove direct `recordApproval` import from the Client Component.
- Prefer passing only a small display/status prop to the Client Component, e.g. `{ factCardId, isMock }`, instead of the whole Fact Card.
- The server action can still receive the bound server-side Fact Card as its first argument.

### Fix 2 — Invalid existing ledger must block writes

Current problem:

- `recordLocalPublishabilityApproval()` uses empty approvals when `readLocalPublishabilityApprovalLedger()` returns any non-ok result.
- Missing file can be treated as empty, but invalid JSON must not be silently overwritten.

Required change:

- Missing ledger should be handled as empty.
- Invalid JSON/read structure should return a safe write failure and preserve the bad file for inspection.
- Do not treat invalid JSON as an approved/missing/empty ledger.

### Fix 3 — Missing ledger read contract should be clear

Current mismatch:

- Handoff asked for "missing ledger => empty ledger".
- Implementation returns `{ ok:false, reason:"missing" }`.

Required change:

- Either update `readLocalPublishabilityApprovalLedger()` to return `{ ok:true, ledger: emptyLedger }` for missing files, or add a clearly named lower-level function for raw missing state and keep the public read helper empty-on-missing.
- `getLocalPublishabilityApproval()` should still return `null` when no record exists.

### Fix 4 — Avoid server-only ledger barrel footgun

Current risk:

- `lib/owner-decision/index.ts` re-exports `local-approval-ledger`, which imports Node `fs`/`path`.
- This can become a client bundling footgun if a client file imports the owner-decision barrel later.

Required change:

- Remove the `export * from "./local-approval-ledger"` barrel export unless there is a concrete server-only import need.
- Keep direct imports from `@/lib/owner-decision/local-approval-ledger` in server files.
- If adding a server-only guard is already supported by the project without dependency changes, you may add it; otherwise do not add dependencies.

## Approved Editable Files

- `lib/owner-decision/local-approval-ledger.ts`
- `lib/owner-decision/index.ts`
- `app/fact-cards/manual/package-preview/actions.ts`
- `app/fact-cards/manual/package-preview/LedgerStatusPanel.tsx`
- `app/fact-cards/manual/package-preview/page.tsx`
- `_ai/CLAUDE_REPORT.md`
- `_ai/NEXT_ACTION.md`
- `_ai/PROJECT_STATE.md`
- `_ai/HANDOFF_NOW.md` for final status only

Do not edit unrelated files.

## Preserve Existing Good Work

- Keep `.gitignore` entry for `/.money-shorts-local/`.
- Keep local-only file-backed approval ledger concept.
- Keep approval eligibility based on `evaluatePublishabilityDecision()`.
- Keep mock Fact Card UI disabled.
- Keep original Fact Card immutable.
- Keep no render/export/upload/clipboard behavior.
- Keep `.money-shorts-local/` data untracked and ignored.

## Forbidden

- No DB/Supabase read/write/migration.
- No env/secret file changes or secret printing.
- No dependency or lockfile changes.
- No GPT/Gemini/Veo/ElevenLabs calls.
- No ffmpeg/render/output/upload/deploy/post/push.
- No OS clipboard write.
- No localStorage/sessionStorage persistence.
- No broad refactor.
- Do not touch `piq_diag_out.txt`.
- Do not stage/commit/push.

## Required Checks

Run focused checks:

1. `git status -sb`
2. `git diff --stat`
3. TypeScript focused check for changed source files.
4. ESLint for changed source files.
5. Static safety grep:
   - Client Component no longer imports/calls `recordApproval(factCard, ...)`
   - no `factCard` passed from client to `recordApproval`
   - invalid ledger path cannot be overwritten as empty
   - no server-only ledger export from `lib/owner-decision/index.ts`
   - no `Date.now` / `new Date(` / `Math.random`
   - no `localStorage` / `sessionStorage` / `navigator.clipboard`
   - no `.env*` changes
   - `.money-shorts-local/` remains gitignored
6. Browser smoke if dev server is available:
   - live package-preview loads
   - eligible local approval can be recorded through server-bound action
   - UI status updates
   - mock approval remains disabled
   - no secret output / no console error

If browser smoke cannot run, report blocker and static evidence.

## Final Report Format

Report back to Codex in Korean with:

- changed files
- exact fixes made
- checks/results
- deviations/blockers
- final `git status -sb`
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 81%`
