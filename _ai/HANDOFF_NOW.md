# Handoff Now

## Task ID

`package-preview-chart-card-visual-preview-v1`

## Current State

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest local checkpoint: `a69e497 feat(package-preview): show chart card props in package preview`
- Latest known `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 41]` plus untracked `piq_diag_out.txt`
- Push: not run.
- `piq_diag_out.txt` is unrelated untracked output. Do not read, modify, delete, stage, or commit it.

Recently completed:

- ECOS base-rate unchanged wording now uses "동결/변동 없음" style copy for `changeValue === 0`.
- Package preview now exposes existing `pkg.chartCardPackage` data-only props:
  - package ids
  - card count
  - number/comparison/source/cta card props
  - dimensions
- No canvas, ffmpeg, image, video, or output files were generated.
- Current package-preview section is still mostly raw data rows, not a visual 9:16 preview.

Important nuance:

- This task is still not video rendering.
- The goal is a browser UI preview of deterministic card props, using CSS/HTML only.
- Do not create image files, canvas exports, screenshots as repo artifacts, mp4s, or output files.
- `_ai/NEXT_ACTION.md` and `_ai/PROJECT_STATE.md` may still describe `a69e497` as pending or omit it; sync state in this slice if touched.

## Goal

Add a CSS-only 9:16 visual preview for existing chart-card props inside `/fact-cards/manual/package-preview`, so Owner can inspect what the number/comparison/source cards would look like before any render pipeline exists.

Primary target:

- The preview should be clearly labeled as **visual preview only**.
- It should use existing `pkg.chartCardPackage.cards`.
- It should not generate media or files.
- It should help validate layout/readability for shorts-style vertical cards.

## Approved Scope

Allowed:

- Modify:
  - `app/fact-cards/manual/package-preview/page.tsx`
  - `_ai/CLAUDE_REPORT.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
- Add small local display components/helpers inside the page file:
  - `ChartCardVisualPreview`
  - `NumberCardVisual`
  - `ComparisonCardVisual`
  - `SourceCardVisual`
  - `CtaCardVisual`
  - or equivalent names
- Use CSS/HTML only.
- Use stable 9:16 aspect ratio for preview surfaces.
- Make text readable and prevent overlap:
  - constrained heights
  - wrapping
  - conservative font sizes
  - no viewport-width font scaling
- Use existing card props only:
  - no invented values
  - no forecast/advice copy
  - no new source strings beyond already available props
- Preserve existing raw props section.
- Preserve default/mock/live route behavior.
- Preserve live route draft-only gate behavior.
- State sync:
  - record latest checkpoint `a69e497`
  - mark chart-card props section as checkpointed
  - record this visual preview slice as uncommitted until checkpointed.

Not required:

- Do not create a separate route.
- Do not add dependencies.
- Do not use canvas/SVG export/image generation.
- Do not implement screenshot saving.
- Do not implement actual Remotion/ffmpeg/video templates.
- Do not change chart-card generator semantics.

## Required Behavior

- Start with `git status -sb`.
- Expected at start:
  - branch ahead `41`
  - untracked `piq_diag_out.txt`
  - no tracked dirty files except this handoff doc if Codex has just updated it.
- Do not read, modify, delete, stage, or commit `piq_diag_out.txt`.
- Keep displayed cards source-first:
  - no invented values
  - no forecast/advice
  - no render/publish claim
- Do not print secret values or secret-bearing ECOS URLs.

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
- Do not set `isPublishable=true`.
- Do not resume retired video routes or old render loops.

## Required Checks

Run focused checks:

- `git status -sb`
- targeted ESLint for changed app file(s)
- focused TypeScript check for changed app file(s)
- route/browser smoke:
  - `/fact-cards/manual/package-preview` loads
  - `/fact-cards/manual/package-preview?candidate=base-rate` loads
  - Chart Card Package section still shows raw props
  - new visual preview surfaces render for number/comparison/source cards
  - base-rate number visual includes improved "동결" wording or equivalent
  - no React unique key warning
  - no obvious text overlap on desktop width
- mobile/narrow smoke if practical:
  - preview surfaces remain within container
  - text does not overflow outside card bounds
- static safety:
  - no new `createEcosLiveTransport` path outside explicit live branch
  - package-preview live selector still has `prefetch={false}`
  - money-shorts hub live link still has `prefetch={false}`
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

- Package preview has CSS-only 9:16 visual previews for chart-card props.
- Raw chart-card props remain inspectable.
- Base-rate unchanged case shows improved "동결/변동 없음" wording in visual/card text.
- No media files, images, video, ffmpeg, output, or external AI calls are created.
- Default/mock/live route behavior does not regress.
- Live route remains draft-only and gate-pending.
- `_ai` state no longer says latest checkpoint is older than `a69e497` or that chart-card props section is uncommitted.
- No secret leakage.
- No DB/render/GPT/upload/push/dependency/output changes.
- Final handoff reports changed files, checks/results, route evidence, visual-preview evidence, deviations/risks, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` because this adds the first visual preview surface for chart-card props.
