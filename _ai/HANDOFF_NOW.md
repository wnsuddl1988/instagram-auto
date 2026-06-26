# HANDOFF_NOW

## Task ID

`package-preview-ledger-overlay-page-integration-static-check-v1`

## Project

`C:\Users\PC\jjy\instagram-auto`

## Current Checkpoint

- Branch: `codex/source-first-blueprint-clean`
- Latest HEAD: `c29f4d9 test(package-preview): add ledger overlay static guard`
- Current pre-handoff `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 57]` plus unrelated `?? piq_diag_out.txt`
- This handoff update may make `_ai/HANDOFF_NOW.md` modified before Claude starts; that is expected.
- Push: do not push.
- Known unrelated untracked file: `piq_diag_out.txt` -- do not read, modify, delete, stage, or commit.
- Local approval data under `.money-shorts-local/` is gitignored local data and must not be read, modified, staged, or committed.

## Goal

Extend the existing no-dependency ledger overlay static guard so it also verifies the page integration contract: `page.tsx` must keep using the extracted `ledger-overlay.ts` helper and typed inactive message map instead of drifting back to inline overlay guard/UI reason logic.

Also sync `_ai` state docs to the latest checkpoint `c29f4d9` / ahead 57.

This is a QA/readiness slice. Do not change runtime behavior.

## Approved Scope

1. Update `scripts/check-ledger-overlay-static.mjs` to read:
   - `app/fact-cards/manual/package-preview/ledger-overlay.ts`
   - `app/fact-cards/manual/package-preview/page.tsx`
2. Preserve all existing `ledger-overlay.ts` checks.
3. Add concise page integration checks, for example:
   - `page.tsx` imports or references `evaluateLedgerOverlay`
   - `page.tsx` imports or references `LEDGER_OVERLAY_INACTIVE_MESSAGES`
   - `page.tsx` calls `evaluateLedgerOverlay(`
   - `page.tsx` uses `LEDGER_OVERLAY_INACTIVE_MESSAGES[ledgerOverlayResult.reason]`
   - `page.tsx` no longer declares inline `type LedgerOverlayInactiveReason`
   - `page.tsx` no longer declares inline `type LedgerOverlayResult`
   - `page.tsx` no longer contains the old inline IIFE pattern for `const ledgerOverlayResult`
4. Keep the script no-dependency and deterministic:
   - built-in Node modules only
   - no writes, no network, no env/secret access, no ledger data access
   - concise PASS/FAIL evidence and non-zero exit on failed invariant
5. Update `_ai/NEXT_ACTION.md` and `_ai/PROJECT_STATE.md` minimally so they reflect:
   - latest HEAD `c29f4d9`
   - branch ahead 57
   - latest QA/test checkpoint includes `c29f4d9`
   - latest code checkpoint remains `71f3a9b`
   - push not run
   - `piq_diag_out.txt` remains unrelated untracked and excluded
6. Update `_ai/CLAUDE_REPORT.md` only if useful to preserve concise QA evidence. If updated, keep it short.

## Approved Editable Files

- `scripts/check-ledger-overlay-static.mjs`
- `_ai/NEXT_ACTION.md`
- `_ai/PROJECT_STATE.md`
- `_ai/CLAUDE_REPORT.md` only if useful
- `_ai/HANDOFF_NOW.md` only for final status if needed

Do not edit `app/` or `lib/` implementation files.

## Forbidden

- Do not touch `piq_diag_out.txt`.
- Do not read, modify, delete, stage, or commit `.money-shorts-local/` data.
- Do not run browser/dev-server route smoke for package-preview if it would read `.money-shorts-local/`.
- Do not stage/commit/push.
- Do not add dependencies or edit lockfiles.
- Do not edit `package.json`.
- Do not edit `app/` or `lib/` implementation files.
- Do not edit `.env*`, secrets, deployment config, DB/Supabase schema, migrations, or API credentials.
- Do not call OpenAI/GPT, Gemini, Veo, ElevenLabs, KOSIS, OpenDART, FRED, ECOS live, or any live API.
- Do not run ffmpeg, render, export, upload, post, deploy, or write to `output/`.
- Do not write to OS clipboard, `localStorage`, or `sessionStorage`.
- Do not implement real persisted `isPublishable=true`.

## Required Checks

Run focused checks:

1. `git status -sb`
2. `git diff --stat`
3. `node scripts/check-ledger-overlay-static.mjs`
4. ESLint for the script:
   - prefer `pnpm exec eslint scripts/check-ledger-overlay-static.mjs --max-warnings=0`
   - if `pnpm exec` hits the known non-TTY module purge issue, use `.\node_modules\.bin\eslint.cmd scripts/check-ledger-overlay-static.mjs --max-warnings=0`
5. Static review that only approved files changed.
6. Confirm `piq_diag_out.txt` remains untracked and untouched.

No TypeScript, browser, live API, render, ffmpeg, output, DB, or clipboard checks are approved for this slice.

## Definition of Done

- Static guard still passes for `ledger-overlay.ts` helper safety invariants.
- Static guard also verifies `page.tsx` integration with the helper/message map.
- State docs reflect latest HEAD `c29f4d9` and ahead 57.
- No runtime implementation files are changed.
- No forbidden files or systems are touched.
- Report whether this small QA/docs slice should be checkpoint committed after Codex review or bundled with a later substantive task.

## Final Report Format

Report back to Codex in Korean with:

- changed files
- integration/static guard invariants covered
- checks/results
- deviations/blockers
- final `git status -sb`
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 83%`
