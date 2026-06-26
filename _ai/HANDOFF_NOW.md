# HANDOFF_NOW

## Task ID

`package-preview-ledger-overlay-evaluator-qa-v1`

## Project

`C:\Users\PC\jjy\instagram-auto`

## Current Checkpoint

- Branch: `codex/source-first-blueprint-clean`
- Latest HEAD: `8a8642b docs(state): update checkpoint state after ledger overlay and riskReview fix`
- Recent code checkpoint: `6d5425d fix(package-preview): use riskReview.packageId instead of non-existent riskReviewId`
- Current pre-handoff `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 55]` plus modified `_ai/HANDOFF_NOW.md`, `_ai/NEXT_ACTION.md`, `_ai/PROJECT_STATE.md`, and unrelated `?? piq_diag_out.txt`
- The modified `_ai/NEXT_ACTION.md` and `_ai/PROJECT_STATE.md` are the accepted docs-only state cleanup from the previous handoff; do not revert them.
- Push: do not push.
- Known unrelated untracked file: `piq_diag_out.txt` -- do not read, modify, delete, stage, or commit.
- Local approval data under `.money-shorts-local/` is gitignored local data and must not be read, modified, staged, or committed.

## Goal

Make the package-preview ledger-approved overlay easier to QA without touching the local ledger file by extracting the in-page guard/projection logic into a small pure server-side helper and using a typed inactive-message map for UI copy.

This is a QA/readiness slice. It must not introduce real `isPublishable=true` persistence or change the underlying safety behavior.

## Approved Scope

1. Extract the existing `ledgerOverlayResult` guard/projection logic from `app/fact-cards/manual/package-preview/page.tsx` into a local route helper module, preferably:
   - `app/fact-cards/manual/package-preview/ledger-overlay.ts`
2. The helper should:
   - accept a `FactCard`, `LocalApprovalRecord | null`, and deterministic options/IDs already used by the page
   - return a discriminated union equivalent to the current `LedgerOverlayResult`
   - preserve the four safety guards:
     - no record -> inactive `no_record`
     - current `factCard.isMock` -> inactive `mock_blocked`
     - stale/mismatched audit fields or decision result -> inactive `ledger_stale_or_ineligible`
     - re-run `evaluatePublishabilityDecision(... approved ...)`; if it fails -> inactive `ledger_stale_or_ineligible`
   - build a memory-only `{ ...factCard, isPublishable: true }` clone only after all guards pass
   - never mutate the original Fact Card
   - never read/write `.money-shorts-local/`, `output/`, DB, env, clipboard, or any external API
3. Move the inactive UI copy into an exhaustive typed map, for example:
   - `LEDGER_OVERLAY_INACTIVE_MESSAGES: Record<LedgerOverlayInactiveReason, string>`
   - use that map in `page.tsx` so all inactive reasons have visible copy and TypeScript enforces coverage
4. Keep visible UI behavior equivalent unless a tiny wording clarification is needed.
5. Update `_ai/CLAUDE_REPORT.md` only if useful to preserve concise QA evidence. If updated, keep it short.
6. Update `_ai/NEXT_ACTION.md` and `_ai/PROJECT_STATE.md` only if reusable state changes; otherwise leave the previous docs cleanup intact.

## Approved Editable Files

- `app/fact-cards/manual/package-preview/page.tsx`
- `app/fact-cards/manual/package-preview/ledger-overlay.ts` (new)
- `_ai/CLAUDE_REPORT.md` only if useful
- `_ai/NEXT_ACTION.md` only if reusable next-action state changes
- `_ai/PROJECT_STATE.md` only if reusable project state changes
- `_ai/HANDOFF_NOW.md` only for final status if needed

Do not edit unrelated implementation files.

## Forbidden

- Do not touch `piq_diag_out.txt`.
- Do not read, modify, delete, stage, or commit `.money-shorts-local/` data.
- Do not run browser/dev-server route smoke for package-preview if it would read `.money-shorts-local/`.
- Do not stage/commit/push.
- Do not add dependencies or edit lockfiles.
- Do not edit `.env*`, secrets, deployment config, DB/Supabase schema, migrations, or API credentials.
- Do not call OpenAI/GPT, Gemini, Veo, ElevenLabs, KOSIS, OpenDART, FRED, ECOS live, or any live API.
- Do not run ffmpeg, render, export, upload, post, deploy, or write to `output/`.
- Do not write to OS clipboard, `localStorage`, or `sessionStorage`.
- Do not implement real persisted `isPublishable=true`.

## Required Checks

Run focused checks:

1. `git status -sb`
2. `git diff --stat`
3. Focused diff review of changed implementation files
4. `pnpm exec eslint app/fact-cards/manual/package-preview/page.tsx app/fact-cards/manual/package-preview/ledger-overlay.ts --max-warnings=0`
5. Focused TypeScript check:
   - run the existing project TypeScript check approach if practical, and report whether there are 0 errors in the changed package-preview files
   - if full project check reports known unrelated `output/` or archive errors, explicitly filter/report only changed-file errors
6. Static scenario matrix in the final report:
   - `no_record`
   - `mock_blocked`
   - `ledger_stale_or_ineligible`
   - active overlay path
7. Confirm no implementation changed outside approved files.
8. Confirm `piq_diag_out.txt` remains untracked and untouched.

No browser, live API, render, ffmpeg, output, DB, or clipboard checks are approved for this slice.

## Definition of Done

- `page.tsx` uses the extracted helper instead of carrying the full inline overlay guard/projection block.
- The helper preserves the existing safety behavior and memory-only clone invariant.
- Inactive reason UI copy is covered by an exhaustive typed map.
- Focused ESLint passes for changed implementation files.
- Focused TypeScript evidence shows no errors in changed package-preview files.
- No local ledger file/data is read or written during the task.
- No forbidden files or systems are touched.
- Report whether this should be checkpoint committed after Codex review or bundled with one more related QA slice.

## Final Report Format

Report back to Codex in Korean with:

- changed files
- behavior preserved/changed
- static scenario matrix
- checks/results
- deviations/blockers
- final `git status -sb`
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 83%`
