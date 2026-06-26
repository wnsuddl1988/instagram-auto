# Handoff Now

## Task ID

`package-preview-live-publishability-controls-smoke-v1`

## Current State

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest local checkpoint: `fdd451b test(package-preview): record publishability controls runtime smoke`
- Latest known `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 49]` plus untracked `piq_diag_out.txt`
- Push: not run.
- `piq_diag_out.txt` is unrelated untracked output. Do not read, modify, delete, stage, or commit it.

Owner approval for this slice:

- Owner selected **A. live non-mock publishability controls smoke 진행**.
- ECOS live read-only route smoke is approved for this task only.
- No persistence, approval, render, upload, DB, or clipboard write is approved.

Recently completed:

- Local publishability decision controls passed runtime smoke on default/mock routes.
- Mock routes remain NOT ELIGIBLE after approved click because `isMock=true`.
- Server gate/copy readiness stayed unchanged by client controls.

Important nuance:

- This is a live route QA / state-sync slice, not an implementation slice.
- The goal is to verify the `isMock=false` live candidate path:
  - local controls approved -> `canMarkPublishable=ELIGIBLE` if all contract prerequisites pass
  - server gate still blocked by `fact_card_not_publishable`
  - server clipboard still not ready
- Do not set `isPublishable=true`.
- Do not persist anything.

State-doc nuance:

- `_ai/NEXT_ACTION.md` may still say `984ce2a` is current HEAD or that previous smoke is uncommitted.
- Sync stale state to checkpoint `fdd451b` as part of this QA slice.

## Goal

Run read-only live route smoke for:

- `/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606`

Validate local Owner publishability controls on a non-mock live Fact Card while proving server gate/copy remain draft-only.

## Approved Scope

Allowed QA target:

- `/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606`

Allowed live external action:

- ECOS read-only live route call triggered by the explicit route above.

Allowed implementation file only if a tiny smoke bug is found:

- `app/fact-cards/manual/package-preview/PublishabilityDecisionControls.tsx`
- `app/fact-cards/manual/package-preview/page.tsx`

Allowed docs/state files:

- `_ai/CLAUDE_REPORT.md`
- `_ai/NEXT_ACTION.md`
- `_ai/PROJECT_STATE.md`
- `_ai/HANDOFF_NOW.md` only if final scope/status needs tiny correction.

Expected QA:

1. Start/reuse local dev server with `.env.local` available.
2. Load `/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606`.
3. Confirm live route renders a non-mock Fact Card:
   - `sourceProviderId=provider-ecos-live`
   - `isMock=false`
   - `isPublishable=false`
   - `dataPeriod=2026년 5월`
   - `publishedDate=2025-05-29`
4. Confirm local Owner decision sandbox initial state:
   - pending/null
   - NOT ELIGIBLE
   - blocker includes `decision_pending`
5. Click/select `approved`.
6. Confirm local contract result:
   - `canMarkPublishable=ELIGIBLE`
   - no blocker codes
   - `isMock=false`
   - citationCount > 0
   - sourceUrl https readiness OK
7. Confirm server state remains unchanged:
   - Owner Gate still shows `fact_card_not_publishable`
   - Clipboard Payload remains `copyReady=false` / NOT READY
   - package remains draft-only; no render/copy/publish action.
8. Confirm no console errors or React key warnings.

## Required Behavior

- Start with `git status -sb`.
- Expected at start:
  - branch ahead `49`
  - untracked `piq_diag_out.txt`
  - tracked dirty `_ai/HANDOFF_NOW.md` from this Codex handoff update
- Do not read, modify, delete, stage, or commit `piq_diag_out.txt`.
- Use `.env.local` only by normal app/dev-server loading. Do not print secret values.
- Do not print secret-bearing ECOS API URLs.

## Forbidden

- No GPT/Gemini/Veo/OpenAI/ElevenLabs calls.
- No ECOS calls beyond the explicit live route smoke above.
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
- live route smoke:
  - live route loads
  - local sandbox controls visible
  - initial pending/null -> NOT ELIGIBLE with `decision_pending`
  - approved click -> ELIGIBLE with no blocker codes
  - live fact card is `isMock=false`
  - citationCount > 0
  - sourceUrl https readiness OK
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
  - forbidden pattern search on changed implementation files
- secret safety:
  - no API key value printed
  - no secret-bearing ECOS URL printed/rendered
  - no `.env*` modified/staged
- untracked safety:
  - prove `piq_diag_out.txt` remains untracked and unstaged
- final `git status -sb`

Do not run full `pnpm build`; existing `output/` binary `.ts` pollution is a known blocker.

## Definition of Done

- Live `isMock=false` route smoke confirms local approved decision can be ELIGIBLE.
- Server gate/copy remains blocked/not ready.
- `_ai` state is minimally synced to checkpoint `fdd451b`.
- No secret leakage.
- No DB/render/GPT/upload/push/dependency/output changes.
- Final handoff reports changed files, checks/results, route evidence, deviations/risks, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` because this is reusable live non-mock acceptance evidence before real approval/persistence work.
