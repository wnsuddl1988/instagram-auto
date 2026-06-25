# Handoff Now

## Task ID

`money-shorts-os-auto-fact-card-candidate-v1-review-fix`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest local checkpoint: `9978d61 test(money-shorts): record mvp1 rc smoke pass`
- Latest known `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 27]`
- Push: not run.

Uncommitted work from `money-shorts-os-auto-fact-card-candidate-v1` exists:

- `_ai/CLAUDE_REPORT.md`
- `_ai/HANDOFF_NOW.md`
- `_ai/NEXT_ACTION.md`
- `app/fact-cards/manual/package-preview/page.tsx`
- `lib/source-facts/index.ts`
- `lib/source-facts/candidates.ts`
- `lib/source-facts/raw-snapshot-parser.ts`

No commit yet.

## Codex Review Findings

Fix these before checkpoint:

1. TypeScript import blocker
   - File: `lib/source-facts/raw-snapshot-parser.ts`
   - Current code imports `ManualFactCardDraft` from `./types`.
   - Actual type is exported from `./manual`.
   - Fix import so targeted TypeScript does not fail on `TS2305`.

2. Source display precision
   - File: `lib/source-facts/candidates.ts`
   - Current parser uses numeric interpolation like `${cur}%`.
   - For mock raw source value `3.0`, JavaScript displays `"3%"`.
   - Source-first behavior should preserve the source display string for user-facing Fact Card fields and claims.
   - Prefer adding explicit raw payload display strings such as `currentValueText`, `previousValueText`, and `changeValueText`, while keeping numeric fields for calculations.
   - Use display strings for `currentValue`, `previousValue`, `changeValue`, `interpretation`, and `allowedClaims`.

3. Unknown candidate selector should not silently fall back
   - File: `app/fact-cards/manual/package-preview/page.tsx`
   - Current behavior falls back to the default fixture when `?candidate=<unknown>` is provided.
   - If a candidate query param exists but is not in `CANDIDATE_REGISTRY`, show a local error state instead of rendering the default fixture.
   - No API calls or routing changes.

## Goal

Perform a narrow review-fix pass on the existing auto Fact Card candidate slice.

Keep the successful design:

`RawDataSnapshot -> SourceProvider parser -> ManualFactCardDraft candidate -> authorManualFactCard / validation -> local preview visibility`

Do not expand scope beyond the review findings.

## Approved Scope

Allowed:

- Fix the incorrect type import.
- Preserve source display strings for the mock ECOS base-rate candidate.
- Prevent unknown `?candidate=` values from silently rendering the default fixture.
- Update `_ai/CLAUDE_REPORT.md` with concise review-fix evidence.
- Update `_ai/NEXT_ACTION.md` only if the durable next action wording changes.

Default editable files:

- `lib/source-facts/raw-snapshot-parser.ts`
- `lib/source-facts/candidates.ts`
- `app/fact-cards/manual/package-preview/page.tsx`
- `_ai/CLAUDE_REPORT.md`
- `_ai/HANDOFF_NOW.md` only if a small post-work pointer update is necessary

## Required Behavior

- Start with `git status -sb`.
- Keep all existing auto candidate functionality.
- Default package preview without query param must still use the existing household debt fixture.
- `?candidate=base-rate` must still render the generated mock candidate.
- `?candidate=unknown` should show a clear local error state.
- Do not use live APIs or external calls.
- Do not invent financial facts outside explicit mock raw fixtures.
- Keep candidate ids/timestamps deterministic.

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
- No upload/post/deploy.
- No git push.
- No commit unless Codex explicitly authorizes it later.
- Do not touch `output/`.
- Do not resume retired Candidate10 / Money Architect static plate / 3D character / code-GFX / old video render loops.
- Do not resume 생활꿀팁, EP001 돈 방어, Jun/준/시트콤/복사기/upload_002/ep003/3d_sitcom lines.

## Required Checks

Run focused checks:

- `git status -sb`
- targeted ESLint for changed code files
- practical TypeScript check focused on changed source/UI files
  - full `tsc --project` is known to be polluted by existing `output/` binary `.ts`; do not treat that as this slice's blocker.
  - However, verify the `ManualFactCardDraft` import blocker is gone.
- forbidden pattern search on changed files:
  - `Date.now`
  - `Math.random`
  - `fetch(`
  - `navigator.clipboard`
  - `ffmpeg`
  - `output/`
  - `upload`
  - `deploy`
- local route readiness:
  - `/fact-cards/manual/package-preview`
  - `/fact-cards/manual/package-preview?candidate=base-rate`
  - `/fact-cards/manual/package-preview?candidate=unknown`
- final `git status -sb`

Do not run full `pnpm build`.

## Definition of Done

- Type import blocker is fixed.
- Base-rate candidate preserves display value `"3.0%"` or another explicit source display string, not accidental `"3%"`.
- Unknown candidate query param does not silently render the default fixture.
- Default fixture preview remains stable.
- Generated base-rate preview remains stable.
- No live external source, DB, env, dependency, render, upload, push, or output action occurs.
- Final handoff reports changed files, checks/results, route evidence, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` with concise review-fix evidence.
