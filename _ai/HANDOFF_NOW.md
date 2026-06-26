# Handoff Now

## Task ID

`package-preview-owner-publishability-controls-runtime-smoke-v1`

## Current State

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest local checkpoint: `984ce2a feat(package-preview): add local publishability decision controls`
- Latest known `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 48]` plus untracked `piq_diag_out.txt`
- Push: not run.
- `piq_diag_out.txt` is unrelated untracked output. Do not read, modify, delete, stage, or commit it.

Recently completed:

- Package preview has local-only `PublishabilityDecisionControls`.
- The controls use browser local React state only.
- The controls call `evaluatePublishabilityDecision()` to display eligibility.
- No persistence, server action, API route, DB, render/export, upload, clipboard write, or `isPublishable=true` mutation has been added.

Important nuance:

- This is a runtime smoke / state-sync slice.
- Do not implement real Owner approval or persistence.
- Do not add new controls beyond tiny usability/readability fixes if a smoke issue is found.
- The goal is to prove the client sandbox cannot affect server gate/copy readiness.

State-doc nuance:

- `_ai/NEXT_ACTION.md` may still say `dcde9d5` is current HEAD or that the local controls are uncommitted.
- Sync stale state to checkpoint `984ce2a` as part of this QA slice.

## Goal

Run focused runtime smoke for `/fact-cards/manual/package-preview` local publishability decision controls and sync `_ai` state to checkpoint `984ce2a`.

## Approved Scope

Allowed QA targets:

- `/fact-cards/manual/package-preview`
- `/fact-cards/manual/package-preview?candidate=base-rate`

Allowed implementation file only if a small smoke bug is found:

- `app/fact-cards/manual/package-preview/PublishabilityDecisionControls.tsx`
- `app/fact-cards/manual/package-preview/page.tsx`

Allowed docs/state files:

- `_ai/CLAUDE_REPORT.md`
- `_ai/NEXT_ACTION.md`
- `_ai/PROJECT_STATE.md`
- `_ai/HANDOFF_NOW.md` only if final scope/status needs tiny correction.

Expected QA:

1. Start/reuse local dev server.
2. Load default package preview.
3. Confirm local Owner decision sandbox is visible.
4. Confirm initial decision is pending/null and result is NOT ELIGIBLE.
5. Click `approved`.
6. Confirm result updates locally but does not make server gate/copy ready:
   - local contract result may change based on fixture blockers
   - server Owner Gate still shows `fact_card_not_publishable`
   - server Clipboard Payload remains `copyReady=false`
7. Repeat lightly on `?candidate=base-rate`.
8. Confirm no console errors or React key warnings.
9. Confirm no storage/clipboard/network/render side effects.

Expected current behavior:

- default/manual fixture is `isMock=true`, so `approved` remains NOT ELIGIBLE with `mock_fact_card`.
- base-rate mock is also `isMock=true`, so `approved` remains NOT ELIGIBLE with `mock_fact_card`.
- live route is not required for this task.

## Required Behavior

- Start with `git status -sb`.
- Expected at start:
  - branch ahead `48`
  - untracked `piq_diag_out.txt`
  - tracked dirty `_ai/HANDOFF_NOW.md` from this Codex handoff update
- Do not read, modify, delete, stage, or commit `piq_diag_out.txt`.
- Keep server behavior deterministic.
- No secret values or secret-bearing ECOS URLs printed.

## Forbidden

- No GPT/Gemini/Veo/OpenAI/ElevenLabs calls.
- No ECOS live call.
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
- Do not set or persist `FactCard.isPublishable=true`.
- Do not modify server `gateResult` or `clipboardPayload` based on client controls.
- Do not create a fake server-side approved Owner decision path.
- Do not resume retired video routes or old render loops.

## Required Checks

Run focused checks:

- `git status -sb`
- runtime smoke:
  - default route loads
  - base-rate route loads
  - local sandbox controls visible
  - pending/null initial state visible
  - approved click updates local result
  - `mock_fact_card` blocker visible after approved on mock/default routes
  - server gate still has `fact_card_not_publishable`
  - server clipboard remains not ready
  - no React unique key warning
  - no obvious console error
- static safety:
  - no `isPublishable=true` assignment in changed files
  - no localStorage/sessionStorage
  - no navigator.clipboard
  - no server action/API route
  - package-preview live selector still has `prefetch={false}`
  - money-shorts hub live link still has `prefetch={false}`
- if code changed:
  - targeted TypeScript/source check for changed files
  - targeted ESLint for changed implementation files
  - forbidden pattern search on changed implementation files:
    - `Date.now`
    - `Math.random`
    - `navigator.clipboard`
    - `localStorage`
    - `sessionStorage`
    - `ffmpeg`
    - `output/`
    - `upload`
    - `deploy`
- secret safety:
  - no API key value printed
  - no `.env*` modified/staged
- untracked safety:
  - prove `piq_diag_out.txt` remains untracked and unstaged
- final `git status -sb`

Do not run full `pnpm build`; existing `output/` binary `.ts` pollution is a known blocker.

## Definition of Done

- Runtime smoke proves local sandbox controls work.
- Runtime smoke proves client controls do not affect server gate/copy readiness.
- `_ai` state is minimally synced to checkpoint `984ce2a`.
- No secret leakage.
- No DB/render/GPT/upload/push/dependency/output changes.
- Final handoff reports changed files, checks/results, route evidence, deviations/risks, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` because this is reusable evidence before any real approval/persistence work.
