# Handoff Now

## Task ID

`package-preview-live-draft-gate-alignment-v1`

## Current State

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest local checkpoint: `101c22e feat(money-shorts): add live latest draft entrypoint to hub`
- Latest known `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 38]` plus untracked `piq_diag_out.txt`
- Push: not run.
- `piq_diag_out.txt` is unrelated untracked output. Do not read, modify, delete, stage, or commit it.

Recently completed:

- Root route `/` redirects to `/money-shorts`.
- Dev server root runtime smoke passed and is checkpointed.
- `/money-shorts` hub has an explicit dev-only live latest draft candidate link:
  - `/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606`
  - `prefetch={false}`
- `/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606` is an explicit ECOS live draft candidate route.
- The live draft candidate remains:
  - `sourceProviderId=provider-ecos-live`
  - `isMock=false`
  - `isPublishable=false`
  - `publishedDate=2025-05-29`
  - `dataPeriod=2026년 5월`

Important nuance:

- The live route is draft-only and must not appear Owner-approved or ready for render/upload.
- Current package preview code uses a local mock `decision: "approved"` gate for all candidates, including live draft candidates.
- This can make the live draft route look too final, even though it says `isPublishable=false`.
- `_ai/NEXT_ACTION.md` may still describe the just-committed hub entrypoint as uncommitted; sync it in this slice if touched.

## Goal

Align package preview gate/clipboard behavior with the live draft-only contract.

Primary target:

- Default fixture and mock candidate previews may keep the existing local preview approved-gate behavior.
- Live latest draft candidate preview must not show as actually Owner-approved or copy/render-ready.
- Live route should clearly show a pending/draft gate state until a downstream Owner decision process exists.

## Approved Scope

Allowed:

- Modify:
  - `app/fact-cards/manual/package-preview/page.tsx`
  - `_ai/CLAUDE_REPORT.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
- Use existing owner decision model:
  - For live draft route, call `evaluateOwnerDecision()` with `decision: null` or another blocking decision that best matches "pending Owner decision".
  - Prefer `decision: null` so blocker is `decision_pending`.
- Make UI text honest:
  - For live route, explain that Owner Decision Gate is intentionally pending because candidate is draft-only.
  - Clipboard payload should show `copyReady=false` for live draft route.
  - Avoid language implying render/upload/publish is available.
- Preserve existing behavior for:
  - `/fact-cards/manual/package-preview`
  - `/fact-cards/manual/package-preview?candidate=base-rate`
- Keep live route explicit and non-prefetched.
- State sync:
  - record latest checkpoint `101c22e`
  - mark hub live latest entrypoint as checkpointed
  - record this slice as uncommitted until checkpointed.

Not required:

- Do not add a real Owner approval UI.
- Do not set `isPublishable=true`.
- Do not add persistence, DB, or publish flow.
- Do not run live ECOS more than a single focused route smoke if needed.
- Do not implement GPT/script/video/render/TTS/upload.

## Required Behavior

- Start with `git status -sb`.
- Expected at start:
  - branch ahead `38`
  - untracked `piq_diag_out.txt`
  - no tracked dirty files except this handoff doc if Codex has just updated it.
- Do not read, modify, delete, stage, or commit `piq_diag_out.txt`.
- The live package preview must remain source-first:
  - `isPublishable=false`
  - draft-only
  - Owner gate pending/blocked
  - Clipboard not copy-ready
- Default/mock preview should not regress.
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
- Do not resume retired video routes or old render loops.

## Required Checks

Run focused checks:

- `git status -sb`
- targeted ESLint for changed app file(s)
- focused TypeScript check for changed app file(s)
- route/static smoke:
  - `/fact-cards/manual/package-preview` still loads and keeps existing local preview behavior
  - `/fact-cards/manual/package-preview?candidate=base-rate` still loads and keeps existing mock preview behavior
  - `/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606` loads or clearly blocks if env/network unavailable
  - if live route loads, verify:
    - `isPublishable=false`
    - Owner decision pending or blocked, not approved
    - `canProceedToRender=false`
    - `copyReady=false`
    - no React unique key warning
- static safety:
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

- Live latest draft package preview no longer appears Owner-approved.
- Live latest draft package preview cannot be copy/render-ready.
- Default and mock package previews keep their existing local preview behavior.
- Live links remain non-prefetched.
- `_ai` state no longer says latest checkpoint is older than `101c22e` or that hub entrypoint is uncommitted.
- No secret leakage.
- No DB/render/GPT/upload/push/dependency/output changes.
- Final handoff reports changed files, checks/results, route evidence, deviations/risks, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` because this changes gate/copy readiness semantics for the live draft route.
