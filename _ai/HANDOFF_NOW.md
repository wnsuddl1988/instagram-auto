# Handoff Now

## Task ID

`package-preview-chart-card-visual-preview-qa-v1`

## Current State

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest local checkpoint: `5368566 feat(package-preview): add css chart card visual previews`
- Latest known `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 42]` plus untracked `piq_diag_out.txt`
- Push: not run.
- `piq_diag_out.txt` is unrelated untracked output. Do not read, modify, delete, stage, or commit it.

Recently completed:

- Package preview now shows CSS-only 9:16 visual previews for chart-card props.
- It added local preview components for:
  - number card
  - comparison card
  - source card
  - CTA card
- Existing raw chart-card props remain visible.
- No canvas, ffmpeg, image/video/audio rendering, output files, or external AI calls were introduced.
- Browser/curl smoke passed, but visual screenshot check was not fully completed because screenshot tooling timed out.

Important nuance:

- This is a QA/state-sync slice, not a new feature slice.
- The goal is to verify the visual preview does not look broken on desktop/mobile widths.
- Browser screenshots are allowed only as transient QA evidence; do not save screenshots or generated images into the repo.
- `_ai/NEXT_ACTION.md` and `_ai/PROJECT_STATE.md` may still describe `5368566` as pending or omit it; sync state in this slice if touched.

## Goal

Run focused visual QA for the CSS-only chart-card preview surfaces and minimally sync `_ai` state to checkpoint `5368566`.

Primary target:

- Verify `/fact-cards/manual/package-preview?candidate=base-rate` renders:
  - Chart Card Package section
  - CSS-only visual previews
  - improved "동결" copy
  - no obvious overlap or overflow on desktop and mobile/narrow widths
- Verify default package preview still renders.

## Approved Scope

Allowed:

- Start or reuse a local Next.js dev server.
- Browser/DOM/screenshot QA for:
  - `/fact-cards/manual/package-preview`
  - `/fact-cards/manual/package-preview?candidate=base-rate`
- Use desktop and mobile/narrow viewports if tooling supports it.
- Use transient screenshots or browser snapshots for inspection only.
- Update if useful:
  - `_ai/CLAUDE_REPORT.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
- If a concrete visual bug is found and the fix is tightly scoped, modify:
  - `app/fact-cards/manual/package-preview/page.tsx`
- Keep fixes minimal and related only to layout/readability/overflow.

Not required:

- Do not inspect or navigate the live ECOS route unless needed for a narrowly scoped regression check.
- Do not add new components beyond small layout fixes.
- Do not implement actual rendering/export.
- Do not add dependencies.

## Required Behavior

- Start with `git status -sb`.
- Expected at start:
  - branch ahead `42`
  - untracked `piq_diag_out.txt`
  - no tracked dirty files except this handoff doc if Codex has just updated it.
- Do not read, modify, delete, stage, or commit `piq_diag_out.txt`.
- Keep visual preview source-first:
  - no invented values
  - no forecast/advice
  - no render/publish claim
- Do not print secret values or secret-bearing ECOS URLs.

## Forbidden

- No GPT/Gemini/Veo/OpenAI/ElevenLabs calls.
- No ffmpeg execution.
- No video/audio/image rendering or repository artifacts.
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
- Do not set `isPublishable=true`.
- Do not resume retired video routes or old render loops.

## Required Checks

Run focused checks:

- `git status -sb`
- route/browser QA:
  - `/fact-cards/manual/package-preview` loads
  - `/fact-cards/manual/package-preview?candidate=base-rate` loads
  - Chart Card Package section visible
  - visual preview surfaces visible for number/comparison/source cards
  - base-rate number visual includes `동결`
  - no React unique key warning
  - no obvious console error
  - desktop width: no obvious text overlap or card overflow
  - mobile/narrow width: preview surfaces stay within container and text remains clipped/wrapped professionally
- static safety:
  - package-preview live selector still has `prefetch={false}`
  - money-shorts hub live link still has `prefetch={false}`
  - no new `createEcosLiveTransport` path outside explicit live branch
- if code changed:
  - targeted ESLint
  - focused TypeScript check
  - forbidden pattern search on changed app file(s):
    - `Date.now`
    - `Math.random`
    - `navigator.clipboard`
    - `ffmpeg`
    - `output/`
    - `upload`
    - `deploy`
- secret safety:
  - no API key value printed
  - no `.env*` modified/staged
  - no secret-bearing ECOS URL printed or rendered
- untracked safety:
  - prove `piq_diag_out.txt` remains untracked and unstaged
- final `git status -sb`

Do not run full `pnpm build`; existing `output/` binary `.ts` pollution is a known blocker.

## Definition of Done

- Visual QA evidence confirms chart-card CSS previews are usable on desktop and mobile/narrow widths, or records exact blockers.
- If a small layout fix was needed, it is scoped and verified.
- `_ai` state no longer says latest checkpoint is older than `5368566` or that visual preview is uncommitted.
- No secret leakage.
- No DB/render/GPT/upload/push/dependency/output changes.
- Final handoff reports changed files, checks/results, route evidence, visual QA evidence, deviations/risks, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` because visual QA evidence is reusable for the next template/render decision.
