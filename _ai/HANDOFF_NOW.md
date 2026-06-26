# Handoff Now

## Task ID

`money-shorts-hub-live-latest-entrypoint-v1`

## Current State

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest local checkpoint: `13ba98b test(app): record dev server root smoke pass`
- Latest known `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 37]` plus untracked `piq_diag_out.txt`
- Push: not run.
- `piq_diag_out.txt` is unrelated untracked output. Do not read, modify, delete, stage, or commit it.

Recently completed:

- Root route `/` now redirects to `/money-shorts`.
- Runtime smoke confirmed:
  - `/` -> `307 redirect -> /money-shorts`
  - `/money-shorts` -> `200`
  - `/fact-cards/manual/package-preview` -> `200`
  - `/fact-cards/manual/package-preview?candidate=base-rate` -> `200`
- `/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606` is connected as an explicit dev-only live ECOS draft candidate route.
- The live route remains draft-only:
  - `sourceProviderId=provider-ecos-live`
  - `isMock=false`
  - `isPublishable=false`
  - `publishedDate=2025-05-29`
  - `dataPeriod=2026년 5월`
- The live candidate link inside package preview has `prefetch={false}`.

Important nuance:

- `git status -sb` is not fully clean because `piq_diag_out.txt` remains untracked.
- Treat the working tree as clean only for tracked project changes.
- `_ai/NEXT_ACTION.md` may still describe older checkpoints; sync it in this slice if touched.

## Goal

Make the Money Shorts OS Workflow Hub reflect the current source-first workbench more directly by exposing the explicit ECOS live latest draft candidate path from the hub, without making live ECOS the default route and without accidental prefetch.

Primary target:

- `/money-shorts` should still be the local Workflow Hub.
- The hub should make it easy to open the current live latest draft candidate preview.
- The live latest entry must be clearly explicit/dev-only and must not prefetch.

## Approved Scope

Allowed:

- Modify:
  - `app/money-shorts/page.tsx`
  - `_ai/CLAUDE_REPORT.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
- Add a hub link/card/button to:
  - `/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606`
- The live link must set `prefetch={false}`.
- Keep default package preview and mock candidate links unchanged.
- Minimal copy updates to avoid false "all local/no external API" claims.
- State sync:
  - record latest checkpoint `13ba98b`
  - note that dev server root runtime smoke passed
  - set the next safe work unit after this slice to Codex decision pending unless a clear next implementation emerges from the work.

Not required:

- Do not navigate to the live ECOS route unless a focused smoke is explicitly needed after adding the link.
- Do not add dynamic date/current-month logic.
- Do not implement daily scheduler, video rendering, GPT scripts, TTS, uploads, or DB persistence.
- Do not delete legacy components.

## Required Behavior

- Start with `git status -sb`.
- Expected at start:
  - branch ahead `37`
  - untracked `piq_diag_out.txt`
  - no tracked dirty files except this handoff doc if Codex has just updated it.
- Do not read, modify, delete, stage, or commit `piq_diag_out.txt`.
- The new hub live link must not fire ECOS unless clicked/navigated.
- Use `.env.local` only as the app naturally loads it; never print secret values.
- Avoid visible copy that implies production-ready auto-rendering or publishability.
- Keep the user-facing state honest: live latest Fact Card candidate is draft-only, not publishable, not render/upload.

## Forbidden

- No GPT/Gemini/Veo/OpenAI/ElevenLabs calls.
- No ECOS live script execution.
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
- targeted ESLint for changed app file(s)
- focused TypeScript check for changed app file(s)
- static safety:
  - new hub live link has `prefetch={false}`
  - existing package-preview live link still has `prefetch={false}`
  - no `createEcosLiveTransport` import/call added to `app/money-shorts/page.tsx`
- route smoke:
  - `/money-shorts` loads
  - link hrefs for default preview, mock preview, and live latest preview are present
  - no React unique key warning on `/money-shorts`
- secret safety:
  - no API key value printed
  - no `.env*` modified/staged
  - no secret-bearing ECOS URL printed or rendered
- forbidden pattern search on changed app file(s):
  - `Date.now`
  - `Math.random`
  - `navigator.clipboard`
  - `ffmpeg`
  - `output/`
  - `upload`
  - `deploy`
- untracked safety:
  - prove `piq_diag_out.txt` remains untracked and unstaged
- final `git status -sb`

Do not run full `pnpm build`; existing `output/` binary `.ts` pollution is a known blocker.

## Definition of Done

- `/money-shorts` clearly exposes the current live latest draft candidate route as an explicit dev-only action.
- Live link has `prefetch={false}`.
- Default/mock routes remain available and local-only.
- Hub still does not claim render/upload/publish is active.
- `_ai` state no longer says the latest checkpoint is older than `13ba98b`.
- No secret leakage.
- No DB/render/GPT/upload/push/dependency/output changes.
- Final handoff reports changed files, checks/results, route evidence, deviations/risks, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` because this changes the primary workflow hub.
