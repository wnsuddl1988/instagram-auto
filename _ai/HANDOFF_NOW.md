# Handoff Now

## Task ID

`package-preview-publishability-decision-readonly-v1`

## Current State

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest local checkpoint: `c7009ee feat(owner-decision): add publishability decision contract`
- Latest known `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 46]` plus untracked `piq_diag_out.txt`
- Push: not run.
- `piq_diag_out.txt` is unrelated untracked output. Do not read, modify, delete, stage, or commit it.

Recently completed:

- `evaluatePublishabilityDecision(factCard, input, options?)` exists in `lib/owner-decision/publishability.ts`.
- The helper is deterministic and does not mutate Fact Cards.
- It only reports whether a real Owner decision would allow marking a Fact Card publishable.
- Package preview already has `⑧ Publishability Readiness`.

Important next-step nuance:

- Do **not** create a fake `"approved"` Owner decision in UI.
- Do **not** set or persist `FactCard.isPublishable=true`.
- Do **not** add an interactive approval button yet.
- This slice should only wire the new contract into package preview as a read-only current-state evaluation and condition checklist.

State-doc nuance:

- `_ai/NEXT_ACTION.md` may still say `d3e0a79` is current HEAD or that the publishability decision contract is uncommitted.
- Sync stale state to checkpoint `c7009ee` as part of this implementation slice.

## Goal

Expose the publishability decision contract in `/fact-cards/manual/package-preview` as read-only evidence.

The Owner should be able to see:

- current publishability decision state is pending/null
- which contract blockers are currently active
- which factual prerequisites are satisfied
- why this screen still does not mark the Fact Card publishable

## Approved Scope

Allowed implementation file:

- `app/fact-cards/manual/package-preview/page.tsx`

Allowed docs/state files:

- `_ai/CLAUDE_REPORT.md`
- `_ai/NEXT_ACTION.md`
- `_ai/PROJECT_STATE.md`
- `_ai/HANDOFF_NOW.md` only if final scope/status needs tiny correction.

Expected implementation direction:

1. Import `evaluatePublishabilityDecision` from `@/lib/owner-decision/publishability`.
2. In `PackagePreviewContent`, create a deterministic read-only result with:
   - `decision: null`
   - `factCardId: factCard.id`
   - `notes: null`
   - stable `decisionResultId` derived from `factCard.id`
   - stable `createdAt` using existing deterministic constants, not `Date.now()`
3. Add a compact read-only subsection inside or immediately after `⑧ Publishability Readiness`.
4. Display:
   - `decisionResultId`
   - `ownerDecision=null`
   - `canMarkPublishable=false`
   - blocker codes from `publishabilityDecision.blockerCodes`
   - `isMock`
   - `citationCount`
   - `sourceUrl` / `https://` readiness
   - `isAlreadyPublishable`
5. Add a short warning/notice:
   - This is contract evaluation only.
   - It does not approve, mutate, persist, render, export, or write to clipboard.
   - A real Owner approval UI must supply the Owner decision later.
6. Keep current gate/readiness behavior unchanged.
7. Keep section numbering stable unless a new top-level section is truly needed. Prefer a subsection to avoid renumber churn.

Not required:

- No approval controls.
- No query param for fake approval.
- No `"approved"` simulation.
- No `isPublishable=true` path.
- No Fact Card cloning or persistence.
- No DB/API route/localStorage.
- No render/export/clipboard action.

## Required Behavior

- Start with `git status -sb`.
- Expected at start:
  - branch ahead `46`
  - untracked `piq_diag_out.txt`
  - tracked dirty `_ai/HANDOFF_NOW.md` from this Codex handoff update
- Do not read, modify, delete, stage, or commit `piq_diag_out.txt`.
- Keep all behavior deterministic. No `Date.now()`/`Math.random()`.
- No secret values or secret-bearing ECOS URLs printed.

## Forbidden

- No GPT/Gemini/Veo/OpenAI/ElevenLabs calls.
- No ECOS live call unless explicitly needed for optional manual smoke; default checks should use non-live routes.
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
- Do not add Owner approval UI.
- Do not create a fake approved Owner decision path.
- Do not resume retired video routes or old render loops.

## Required Checks

Run focused checks:

- `git status -sb`
- targeted TypeScript/source check for changed files or existing focused no-output pattern
- targeted ESLint for `app/fact-cards/manual/package-preview/page.tsx`
- route/static smoke:
  - `/fact-cards/manual/package-preview` loads
  - `/fact-cards/manual/package-preview?candidate=base-rate` loads
  - Publishability Readiness panel still appears
  - read-only publishability decision result appears
  - `ownerDecision=null`
  - `canMarkPublishable=false`
  - mock/default routes show appropriate blockers such as `decision_pending` and/or `mock_fact_card`
  - existing `fact_card_not_publishable` gate blocker remains visible
  - Chart Card visual preview still appears
  - no React unique key warning
  - no obvious console error
- static safety:
  - no `"approved"` input passed to `evaluatePublishabilityDecision` in `page.tsx`
  - no `isPublishable=true` assignment in `page.tsx`
  - package-preview live selector still has `prefetch={false}`
  - money-shorts hub live link still has `prefetch={false}`
- forbidden pattern search on changed implementation file:
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
- untracked safety:
  - prove `piq_diag_out.txt` remains untracked and unstaged
- final `git status -sb`

Do not run full `pnpm build`; existing `output/` binary `.ts` pollution is a known blocker.

## Definition of Done

- Package preview shows the publishability decision contract as read-only current-state evidence.
- The UI does not simulate approved Owner decision.
- The UI does not set or persist `isPublishable=true`.
- Existing gate/readiness/chart-card behavior remains intact.
- `_ai` state is minimally synced to checkpoint `c7009ee`.
- No secret leakage.
- No DB/render/GPT/upload/push/dependency/output changes.
- Final handoff reports changed files, checks/results, route evidence, deviations/risks, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` because this connects the publishability contract into the Owner review workflow.
