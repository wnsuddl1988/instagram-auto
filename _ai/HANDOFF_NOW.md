# Handoff Now

## Task ID

`dev-server-default-route-runtime-smoke-and-state-sync-v1`

## Current State

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest local checkpoint: `7d28921 fix(app): route root to money shorts os hub`
- Latest known `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 36]` plus untracked `piq_diag_out.txt`
- Push: not run.
- `piq_diag_out.txt` is unrelated untracked output. Do not read, modify, delete, stage, or commit it.

Recently completed:

- Root route `/` was changed from the old AutoShorts AI UI to a server `redirect("/money-shorts")`.
- `app/layout.tsx` metadata now uses Money Shorts OS wording.
- `/money-shorts` copy now says external API is absent except explicit live routes.
- `/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606` remains the explicit dev-only live ECOS preview route with `prefetch={false}`.

Important nuance:

- `git status -sb` is not fully clean because `piq_diag_out.txt` remains untracked.
- Treat the working tree as clean only for tracked project changes.

## Goal

Verify at runtime that the development server default entrypoint now opens Money Shorts OS instead of the old AutoShorts AI screen, then minimally sync durable `_ai` state to checkpoint `7d28921`.

Primary target:

- Dev server root `/` should redirect to or display `/money-shorts`.
- The old AutoShorts AI category/reels UI must not be the default first screen.

## Approved Scope

Allowed:

- Start or reuse a local Next.js dev server.
- Runtime smoke only these routes:
  - `/`
  - `/money-shorts`
  - `/fact-cards/manual/package-preview`
  - `/fact-cards/manual/package-preview?candidate=base-rate`
- Static-check, but do not navigate to, the live route link:
  - `/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606`
  - Verify `prefetch={false}` remains present.
- Update only if reusable state changed:
  - `_ai/CLAUDE_REPORT.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
- If a runtime issue is found and the fix is clearly limited to the prior dev-server alignment files, a minimal fix is allowed in:
  - `app/page.tsx`
  - `app/layout.tsx`
  - `app/money-shorts/page.tsx`

Not required:

- No live ECOS route navigation.
- No GPT/script/video/render/package generation.
- No full build.
- No legacy component deletion.
- No broad cleanup of old AutoShorts code.

## Required Behavior

- Start with `git status -sb`.
- Expected at start:
  - branch ahead `36`
  - untracked `piq_diag_out.txt`
  - no tracked dirty files except this handoff doc if Codex has just updated it.
- Do not read, modify, delete, stage, or commit `piq_diag_out.txt`.
- Use `.env.local` only as the app naturally loads it; never print secret values.
- Prefer a local-only route smoke that does not hit external APIs.
- If a dev server is already running, reuse it when practical.
- If starting a dev server, stop only the process you started.

## Forbidden

- No GPT/Gemini/Veo/OpenAI/ElevenLabs calls.
- No ECOS live navigation or script execution for this task.
- No ffmpeg execution.
- No video/audio/image rendering.
- No OS clipboard writes.
- No DB/Supabase reads, writes, migrations, or production changes.
- No API route changes.
- No API key/env/secret changes or writes.
- No dependency or lockfile changes.
- No `output/` changes.
- No upload/post/deploy.
- No git push.
- No commit unless Codex explicitly authorizes it later.
- Do not touch `piq_diag_out.txt`.
- Do not resume retired video routes or old render loops.

## Required Checks

Run focused checks:

- `git status -sb`
- route smoke:
  - `/` redirects to or displays Money Shorts OS
  - `/money-shorts` loads Money Shorts OS Workflow Hub
  - default package preview loads without ECOS live call
  - `?candidate=base-rate` mock package preview loads without ECOS live call
- React/runtime smoke:
  - no obvious console error
  - no React unique key warning on smoked routes
- static live-link safety:
  - `ecos-live-latest` link still has `prefetch={false}`
  - `createEcosLiveTransport` is only on the explicit live candidate branch
- targeted ESLint only if code changed
- focused TypeScript only if code changed
- secret safety:
  - no API key value printed
  - no `.env*` modified/staged
  - no secret-bearing ECOS URL printed or rendered
- untracked safety:
  - prove `piq_diag_out.txt` remains untracked and unstaged
- final `git status -sb`

Do not run full `pnpm build`; existing `output/` binary `.ts` pollution is a known blocker.

## Definition of Done

- Runtime confirms dev server root no longer opens the old AutoShorts AI UI.
- Runtime confirms Money Shorts OS hub is the default entrypoint.
- Default/mock package-preview routes still behave as local-only previews.
- Live route remains explicit and non-prefetched.
- `_ai` state no longer says the latest checkpoint is `b11ebb0` or that dev-server alignment is uncommitted.
- No secret leakage.
- No DB/render/GPT/upload/push/dependency/output changes.
- Final handoff reports changed files, checks/results, route evidence, deviations/risks, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` only with concise runtime smoke evidence.
