# HANDOFF_NOW

## Task ID

`package-preview-ledger-overlay-static-guard-check-v1-review-fix`

## Project

`C:\Users\PC\jjy\instagram-auto`

## Current Checkpoint

- Branch: `codex/source-first-blueprint-clean`
- Latest HEAD: `71f3a9b refactor(package-preview): extract ledger overlay evaluator`
- Current pre-handoff `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 56]` plus modified `_ai/HANDOFF_NOW.md`, `_ai/NEXT_ACTION.md`, `_ai/PROJECT_STATE.md`, untracked `scripts/check-ledger-overlay-static.mjs`, and unrelated `?? piq_diag_out.txt`
- The uncommitted static guard slice is accepted except for one review-fix below.
- Push: do not push.
- Known unrelated untracked file: `piq_diag_out.txt` -- do not read, modify, delete, stage, or commit.
- Local approval data under `.money-shorts-local/` is gitignored local data and must not be read, modified, staged, or committed.

## Review Finding To Fix

`scripts/check-ledger-overlay-static.mjs` currently checks `ledger-overlay.ts` for `from "fs"` and `from "path"` only. That misses ESM built-in imports such as `from "node:fs"` or `from "node:path"`, so a future helper edit could add filesystem/path access while the static guard still passes.

Fix this by expanding the forbidden import checks to catch both bare and `node:` built-in imports for fs/path.

## Approved Scope

1. Update only `scripts/check-ledger-overlay-static.mjs` to catch:
   - `from "fs"` / `from 'fs'`
   - `from "node:fs"` / `from 'node:fs'`
   - `from "path"` / `from 'path'`
   - `from "node:path"` / `from 'node:path'`
2. Keep the script no-dependency and deterministic.
3. Do not edit `ledger-overlay.ts`, `page.tsx`, or other `app/`/`lib/` implementation files.
4. Preserve the existing PASS/FAIL style.
5. State docs from the previous slice (`_ai/NEXT_ACTION.md`, `_ai/PROJECT_STATE.md`) may remain as-is unless this fix requires a tiny final note.

## Approved Editable Files

- `scripts/check-ledger-overlay-static.mjs`
- `_ai/HANDOFF_NOW.md` only if final status needs a tiny update

Do not edit other files.

## Forbidden

- Do not touch `piq_diag_out.txt`.
- Do not read, modify, delete, stage, or commit `.money-shorts-local/` data.
- Do not run browser/dev-server route smoke for package-preview if it would read `.money-shorts-local/`.
- Do not stage/commit/push.
- Do not add dependencies or edit lockfiles.
- Do not edit `package.json`.
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
   - if `pnpm exec eslint scripts/check-ledger-overlay-static.mjs --max-warnings=0` hits the known non-TTY module purge issue, use `.\node_modules\.bin\eslint.cmd scripts/check-ledger-overlay-static.mjs --max-warnings=0`
5. Static review that only approved files changed.
6. Confirm `piq_diag_out.txt` remains untracked and untouched.

No TypeScript, browser, live API, render, ffmpeg, output, DB, or clipboard checks are approved for this review-fix.

## Definition of Done

- Static guard now catches `node:fs` and `node:path` imports in `ledger-overlay.ts`.
- Static guard script still passes.
- ESLint passes for the script.
- No implementation files are changed.
- No forbidden files or systems are touched.
- Report whether this small QA slice is ready for Codex checkpoint review.

## Final Report Format

Report back to Codex in Korean with:

- changed files
- exact review-fix made
- checks/results
- deviations/blockers
- final `git status -sb`
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 83%`
