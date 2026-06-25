# Handoff Now

## Task ID

`money-shorts-os-mvp1-rc-smoke-and-state-sync-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest local checkpoint: `de96040 fix(ui): clear package preview key warnings`
- Latest known `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 26]`
- Push: not run
- Working tree was clean before this handoff refresh.

Recently completed:

- MVP1 local UI routes exist and were smoke-tested:
  - `/money-shorts`
  - `/fact-cards/manual`
  - `/fact-cards/manual/new`
  - `/fact-cards/manual/package-preview`
  - `/packages`
- React key warning isolation/fix completed.
- Final root cause:
  - `primaryScript.scenes.map()` used `key={sc.sceneId}` where `ScriptScene` has no `sceneId`.
  - Fix used `key={String(sc.sceneIndex)}`, `sc.durationSec`, and `scene.sceneRole`.
- Fresh verification after the fix showed:
  - `/fact-cards/manual/package-preview`: React key warning 0
  - `/packages`: React key warning 0
  - targeted ESLint: pass

Known environment caveat:

- Full `tsc` / `pnpm build` is polluted by pre-existing binary `.ts` files under `output/`.
- That is not a blocker for this UI QA slice unless new evidence shows a route regression.

## Goal

Run an MVP1 release-candidate local smoke pass after `de96040`, confirm the five active routes still behave as expected, confirm React key warnings remain at 0, and minimally sync project state docs to the latest checkpoint and next step.

This is a QA + state-sync slice, not a feature implementation slice.

## Approved Scope

Allowed:

- Run local-only smoke checks for:
  - `/money-shorts`
  - `/fact-cards/manual`
  - `/fact-cards/manual/new`
  - `/fact-cards/manual/package-preview`
  - `/packages`
- Confirm:
  - route loads / HTTP 200
  - expected route-level text, links, and status badges still render
  - hub links and backlinks still exist
  - React unique key warning count is 0 on all five routes
  - no server 5xx
- Use local dev server/browser automation if practical.
- Update only concise reusable evidence/state docs:
  - `_ai/CLAUDE_REPORT.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/HANDOFF_NOW.md` only if it needs a small post-smoke pointer update
- Keep docs updates minimal and aligned with `de96040`.

Default editable files:

- `_ai/CLAUDE_REPORT.md`
- `_ai/PROJECT_STATE.md`
- `_ai/NEXT_ACTION.md`

Only edit application code if Codex/Owner explicitly re-scopes after this smoke finds a real regression. For this handoff, finding a regression means report it, do not start a fix.

## Required Behavior

- Start with `git status -sb`.
- If working tree is not clean at start, stop and report the unexpected diff.
- Use existing project commands and `pnpm` only.
- Prefer targeted smoke verification over broad build/test loops.
- Keep evidence concise: routes checked, key warning count, core text/link checks, server status, and final git status.
- If dev server is started, stop it before final handoff when practical.
- If a route fails or a key warning returns:
  - capture exact route and symptom
  - do not implement a fix under this handoff
  - update docs only with the blocker evidence if useful
  - report the recommended next fix slice to Codex

## Forbidden

- No GPT/Gemini/Veo/OpenAI/ElevenLabs calls.
- No ffmpeg execution.
- No video/audio/image rendering.
- No actual media probing.
- No ECOS/KOSIS/OpenDART/FRED live API calls.
- No DB/Supabase reads, writes, migrations, or production data changes.
- No API route changes.
- No API key/env/secret changes.
- No dependency or lockfile changes.
- No OS clipboard writes.
- No file export/write outside the approved `_ai` docs.
- No upload/post/deploy.
- No git push.
- No commit unless Codex explicitly authorizes it later.
- Do not touch `output/`.
- Do not resume retired Candidate10 / Money Architect static plate / 3D character / code-GFX / old video render loops.
- Do not resume 생활꿀팁, EP001 돈 방어, Jun/준/시트콤/복사기/upload_002/ep003/3d_sitcom lines.

## Required Checks

Run focused checks:

- `git status -sb`
- local route smoke for the five MVP1 routes
- React console warning check for `Each child in a list should have a unique "key" prop`
- verify core route text/link/status badge expectations
- final `git status -sb`

Optional only if directly useful and cheap:

- targeted ESLint for files touched during state sync is not required for markdown-only docs.
- do not run full `pnpm build` because of the known pre-existing `output/` binary `.ts` pollution.

## Definition of Done

- All five MVP1 routes are freshly smoke-checked after `de96040`.
- React unique key warning remains 0 across the five routes, or any regression is precisely reported.
- Core links/text/status badges are verified or any regression is precisely reported.
- `_ai/PROJECT_STATE.md` and `_ai/NEXT_ACTION.md` no longer present React key warning isolation as the next work if the smoke passes.
- `_ai/CLAUDE_REPORT.md` records concise RC smoke evidence.
- No implementation code, external calls, render/output work, DB/env/dependency/deploy/push actions occur.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.
- If smoke passes and docs are synced, recommend whether this is ready for a safe local checkpoint review.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` with concise MVP1 RC smoke evidence because this evidence should be reusable.
