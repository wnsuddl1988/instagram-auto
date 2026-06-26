# Handoff Now

## Task ID

`package-preview-chart-card-props-section-v1`

## Current State

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest local checkpoint: `92f545b fix(source-facts): improve unchanged base-rate wording`
- Latest known `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 40]` plus untracked `piq_diag_out.txt`
- Push: not run.
- `piq_diag_out.txt` is unrelated untracked output. Do not read, modify, delete, stage, or commit it.

Recently completed:

- Live latest draft Owner acceptance smoke passed.
- ECOS base-rate unchanged copy quality fixed:
  - `changeValue === 0` now says base rate was held/frozen/unchanged.
  - No numeric fields, citations, `isMock`, or `isPublishable` were changed.
- Live route remains draft-only and gate-pending:
  - `isPublishable=false`
  - `decision=null`
  - `canProceedToRender=false`
  - `copyReady=false`
- `assembleContentPackage()` already generates a `chartCardPackage` from the Fact Card and Blueprint.
- Package preview currently shows ids such as `chartCardPackageId`, but does not visibly inspect the chart/number card props.

Important nuance:

- This task is not visual rendering. It exposes deterministic 9:16 chart-card props for review.
- Do not generate image/video/audio files.
- Do not run ffmpeg.
- Do not change the chart-card model unless a tight display bug requires it.
- `_ai/NEXT_ACTION.md` and `_ai/PROJECT_STATE.md` may still describe `92f545b` as pending or omit it; sync state in this slice if touched.

## Goal

Expose the existing `chartCardPackage` inside `/fact-cards/manual/package-preview` so Owner can inspect the 9:16 number/comparison/source card props before any real rendering work.

Primary target:

- Package preview should include a clear section for `Chart Card Package`.
- It should show data-only card props derived from the Fact Card:
  - package id
  - card count
  - dimensions (`1080x1920`)
  - card type
  - number card value/change/interpretation
  - comparison card direction/change label
  - source card attribution/published date/data period
- Live latest route should show the improved unchanged wording in the chart card interpretation note.

## Approved Scope

Allowed:

- Modify:
  - `app/fact-cards/manual/package-preview/page.tsx`
  - `_ai/CLAUDE_REPORT.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
- Use existing `pkg.chartCardPackage`.
- Add small local display helpers/types in the page file if needed.
- Keep the section data-only:
  - no canvas rendering
  - no image generation
  - no file output
  - no ffmpeg
- Preserve existing default/mock/live routes.
- Preserve live route draft-only gate behavior.
- State sync:
  - record latest checkpoint `92f545b`
  - mark acceptance smoke + unchanged copy fix as checkpointed
  - record this chart-card preview slice as uncommitted until checkpointed.

Not required:

- Do not create a separate `/charts` route.
- Do not add chart rendering libraries.
- Do not change chart card generator semantics unless a very small obvious display issue appears.
- Do not implement actual video templates or render manifests beyond existing data display.

## Required Behavior

- Start with `git status -sb`.
- Expected at start:
  - branch ahead `40`
  - untracked `piq_diag_out.txt`
  - no tracked dirty files except this handoff doc if Codex has just updated it.
- Do not read, modify, delete, stage, or commit `piq_diag_out.txt`.
- Keep all displayed chart-card values source-first:
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
- route/static smoke:
  - `/fact-cards/manual/package-preview` loads and shows Chart Card Package section
  - `/fact-cards/manual/package-preview?candidate=base-rate` loads and shows unchanged wording (`동결` or equivalent) in number card interpretation
  - live route optional if safe/available; if loaded, verify chart card section preserves draft-only gate and source provenance
  - no React unique key warning on smoked routes
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

- Package preview has a readable Chart Card Package section.
- Existing generated chart-card props can be inspected without media rendering.
- Base-rate unchanged case uses improved "동결/변동 없음" wording in relevant card text.
- Default/mock/live route behavior does not regress.
- Live route remains draft-only and gate-pending.
- `_ai` state no longer says latest checkpoint is older than `92f545b` or that unchanged copy fix is uncommitted.
- No secret leakage.
- No DB/render/GPT/upload/push/dependency/output changes.
- Final handoff reports changed files, checks/results, route evidence, chart-card evidence, deviations/risks, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` because this exposes the next video-template-adjacent data surface.
