# Handoff Now

## Task ID

`package-preview-owner-publishability-decision-controls-v1`

## Current State

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest local checkpoint: `dcde9d5 feat(package-preview): show publishability decision contract`
- Latest known `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 47]` plus untracked `piq_diag_out.txt`
- Push: not run.
- `piq_diag_out.txt` is unrelated untracked output. Do not read, modify, delete, stage, or commit it.

Recently completed:

- `evaluatePublishabilityDecision()` exists as the source-of-truth contract for whether an Owner decision would allow marking a Fact Card publishable.
- Package preview shows the contract as read-only current-state evidence with `decision=null`.
- No real approval UI, persistence, render/export, clipboard write, DB, or API route has been added.

Important next-step nuance:

- This slice may add **local-only Owner decision controls** so the Owner can inspect contract outcomes in the browser.
- The controls must not persist anything.
- The controls must not mutate the Fact Card or set `isPublishable=true`.
- The controls must not update the server-side gate, clipboard payload, or render readiness.
- The controls must not upload/render/copy/write.

State-doc nuance:

- `_ai/NEXT_ACTION.md` may still say `c7009ee` is current HEAD or that the read-only contract UI is uncommitted.
- Sync stale state to checkpoint `dcde9d5` as part of this implementation slice.

## Goal

Add a local-only Owner publishability decision control to `/fact-cards/manual/package-preview`.

The Owner should be able to select a decision locally (`pending`, `approved`, `rejected`, `revision_requested`) and see what `evaluatePublishabilityDecision()` would return, without changing any package state.

This is an inspection/sandbox control, not a publish action.

## Approved Scope

Allowed implementation files:

- `app/fact-cards/manual/package-preview/page.tsx`
- `app/fact-cards/manual/package-preview/PublishabilityDecisionControls.tsx` (new client component, if useful)

Allowed docs/state files:

- `_ai/CLAUDE_REPORT.md`
- `_ai/NEXT_ACTION.md`
- `_ai/PROJECT_STATE.md`
- `_ai/HANDOFF_NOW.md` only if final scope/status needs tiny correction.

Expected implementation direction:

1. Prefer adding a small client component for local controls:
   - `"use client"`
   - receives the serializable `factCard`
   - uses local React state only
   - imports/uses `evaluatePublishabilityDecision()`
2. Controls:
   - segmented buttons or select for decision: pending/null, approved, rejected, revision_requested
   - optional local notes textarea/input if simple
3. Display result:
   - `canMarkPublishable`
   - blocker codes
   - `ownerDecision`
   - `isMock`
   - `citationCount`
   - `sourceUrl` readiness
4. Make the safety boundary explicit in UI:
   - local preview only
   - no mutation
   - no persistence
   - no render/export/upload/clipboard write
5. Keep server-rendered `Publishability Decision Contract (읽기 전용)` subsection intact.
6. Add the local controls next to/under that subsection in `⑧ Publishability Readiness`.
7. Do not renumber top-level sections.

Not required:

- No actual publishable Fact Card creation.
- No `isPublishable=true` mutation.
- No server action.
- No API route.
- No localStorage/sessionStorage.
- No DB/Supabase.
- No clipboard write.
- No render/export/upload.

## Required Behavior

- Start with `git status -sb`.
- Expected at start:
  - branch ahead `47`
  - untracked `piq_diag_out.txt`
  - tracked dirty `_ai/HANDOFF_NOW.md` from this Codex handoff update
- Do not read, modify, delete, stage, or commit `piq_diag_out.txt`.
- Keep deterministic server behavior. Client local state is allowed only for UI inspection.
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
- Do not modify server `gateResult` or `clipboardPayload` based on client controls.
- Do not create a fake server-side approved Owner decision path.
- Do not resume retired video routes or old render loops.

## Required Checks

Run focused checks:

- `git status -sb`
- targeted TypeScript/source check for changed files or existing focused no-output pattern
- targeted ESLint for changed implementation files
- route/static smoke:
  - `/fact-cards/manual/package-preview` loads
  - `/fact-cards/manual/package-preview?candidate=base-rate` loads
  - Publishability Readiness panel still appears
  - read-only contract subsection still appears
  - local Owner decision controls appear
  - selecting `approved` updates only the local contract result display
  - server gate still shows `fact_card_not_publishable`
  - server clipboard payload remains not ready
  - no React unique key warning
  - no obvious console error
- static safety:
  - no server-side `"approved"` input passed to `evaluatePublishabilityDecision` in `page.tsx`
  - no `isPublishable=true` assignment in changed files
  - no localStorage/sessionStorage
  - no server action/API route
  - package-preview live selector still has `prefetch={false}`
  - money-shorts hub live link still has `prefetch={false}`
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

- Package preview includes local-only Owner publishability decision controls.
- Controls use `evaluatePublishabilityDecision()` and local state only.
- Controls do not mutate/persist/approve/render/export/upload/copy.
- Server gate and clipboard payload remain unchanged by client controls.
- `_ai` state is minimally synced to checkpoint `dcde9d5`.
- No secret leakage.
- No DB/render/GPT/upload/push/dependency/output changes.
- Final handoff reports changed files, checks/results, route evidence, deviations/risks, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` because this is the first local Owner decision control before real approval/persistence.
