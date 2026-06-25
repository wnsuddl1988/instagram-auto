# Handoff Now

## Task ID

`dev-server-default-route-alignment-v1`

## Current State

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest local checkpoint: `b11ebb0 feat(package-preview): expose ecos live latest draft candidate via explicit query`
- Latest known `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 35]` plus untracked `piq_diag_out.txt`
- Push: not run.
- `piq_diag_out.txt` is unrelated untracked output. Do not read, modify, delete, stage, or commit it.

Problem to fix:

- Opening the dev server root (`/`) still shows the old AutoShorts AI / category-based reels UI.
- Current active project is Money Shorts OS, a source-first finance/economy shorts workflow.
- The default dev-server entry point should no longer present the old project as the main app.

Recently completed:

- `/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606` is connected as an explicit dev-only live ECOS preview route.
- Default and mock package-preview routes remain deterministic and do not call ECOS live.
- Live preview remains draft-only:
  - `sourceProviderId=provider-ecos-live`
  - `isMock=false`
  - `isPublishable=false`
  - `publishedDate=2025-05-29`
  - `dataPeriod=2026년 5월`

## Goal

Make the development server default entry point match the current Money Shorts OS project.

Primary target:

- Root route `/` should open the current Money Shorts OS workflow, not the old AutoShorts AI app.

Recommended minimal implementation:

- Replace `app/page.tsx` with a server redirect to `/money-shorts`, or an equivalent minimal root page that immediately points to Money Shorts OS.
- Update `app/layout.tsx` metadata from old AutoShorts AI wording to Money Shorts OS wording.
- Update stale Money Shorts hub copy if it falsely says all package-preview paths have no external API. Default/mock remain local-only, but explicit live preview can read ECOS.

## Approved Scope

Allowed:

- Modify:
  - `app/page.tsx`
  - `app/layout.tsx`
  - `app/money-shorts/page.tsx` only for copy/link alignment if needed
  - `_ai/CLAUDE_REPORT.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
- Use Next.js App Router built-ins such as `redirect()` from `next/navigation`.
- Keep old legacy components/files untouched unless the root import cleanup naturally removes their active use.
- Add a link from the workflow hub to the live latest package preview only if it stays clearly dev-only and does not auto-call ECOS unless clicked.
  - If adding this link, set `prefetch={false}`.

Not required:

- No deletion of legacy components/routes.
- No broad cleanup of old AutoShorts code.
- No API route changes.
- No render/GPT/TTS/upload logic.
- No dependency changes.

## Required Behavior

- Start with `git status -sb`.
- Expected at start:
  - `piq_diag_out.txt` remains untracked.
- If unexpected implementation files are dirty before work starts, stop and report.
- Do not read, modify, delete, stage, or commit `piq_diag_out.txt`.
- `/` should no longer render the old AutoShorts AI category/reels UI.
- `/money-shorts` should remain the active workflow hub.
- Existing MVP1 routes must still load:
  - `/money-shorts`
  - `/fact-cards/manual`
  - `/fact-cards/manual/new`
  - `/fact-cards/manual/package-preview`
  - `/fact-cards/manual/package-preview?candidate=base-rate`
  - `/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606`
  - `/packages`
- Any link to the live latest preview must have prefetch disabled.
- Do not trigger ECOS live calls except when explicitly smoking the live latest route.
- No secret values or secret-bearing ECOS URLs may appear in UI, logs, docs, or error messages.

## Forbidden

- No GPT/Gemini/Veo/OpenAI/ElevenLabs calls.
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
- targeted ESLint for changed app files
- focused TypeScript check for changed app files
- forbidden pattern search on changed files:
  - `Date.now`
  - `Math.random`
  - `navigator.clipboard`
  - `ffmpeg`
  - `output/`
  - `upload`
  - `deploy`
- secret safety:
  - no API key value written
  - no `.env*` modified/staged
  - no secret-bearing ECOS URL printed or rendered
- route smoke:
  - root `/` redirects to or displays Money Shorts OS
  - `/money-shorts` loads
  - package-preview default/mock routes still load
  - live route loads or clear blocked state; no React key warning
- untracked safety:
  - prove `piq_diag_out.txt` remains untracked and unstaged
- final `git status -sb`

Do not run full `pnpm build`; existing `output/` binary `.ts` pollution is a known blocker.

## Definition of Done

- Dev server root no longer opens old AutoShorts AI UI.
- Metadata/default title reflect Money Shorts OS.
- Money Shorts OS hub remains the clear entry point.
- Live preview links, if present, do not prefetch.
- No secret leakage.
- No DB/render/GPT/upload/push/dependency/output changes.
- Final handoff reports changed files, checks/results, route evidence, deviations/risks, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` because this changes the project default entry behavior.
