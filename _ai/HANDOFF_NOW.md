# Handoff Now

## Task ID

`owner-publishability-decision-contract-v1`

## Current State

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest local checkpoint: `d3e0a79 feat(package-preview): add publishability readiness panel`
- Latest known `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 45]` plus untracked `piq_diag_out.txt`
- Push: not run.
- `piq_diag_out.txt` is unrelated untracked output. Do not read, modify, delete, stage, or commit it.

Recently completed:

- Package preview has `⑧ Publishability Readiness`.
- Owner Decision Gate blocks `fact_card_not_publishable` when `FactCard.isPublishable=false`.
- Clipboard readiness remains false whenever the gate is blocked.
- No approval UI, render/export, clipboard write, DB, API route, or persistence has been added.

Important next-step nuance:

- Do **not** add UI that flips `isPublishable=true` yet.
- First define a deterministic Owner publishability decision contract in `lib/owner-decision`.
- The contract should say whether an Owner decision would be allowed to mark a Fact Card publishable.
- It should not mutate the Fact Card, write to storage, or change current package-preview behavior.

State-doc nuance:

- `_ai/NEXT_ACTION.md` may still say `c37426e` is current HEAD or that the readiness panel is uncommitted.
- Sync stale state to checkpoint `d3e0a79` as part of this implementation slice.

## Goal

Add a pure, deterministic publishability decision contract for Fact Cards.

This prepares a later Owner approval UI while keeping all current UI and data draft-only.

## Approved Scope

Allowed implementation files:

- `lib/owner-decision/publishability.ts` (new)
- `lib/owner-decision/index.ts`
- `lib/owner-decision/fixtures.ts` only if useful for static/example coverage
- `lib/owner-decision/types.ts` only if sharing a type there is clearly cleaner

Allowed docs/state files:

- `_ai/CLAUDE_REPORT.md`
- `_ai/NEXT_ACTION.md`
- `_ai/PROJECT_STATE.md`
- `_ai/HANDOFF_NOW.md` only if final scope/status needs tiny correction.

Expected implementation direction:

1. Create a deterministic helper for Owner publishability decisions, for example:
   - `evaluatePublishabilityDecision(factCard, input, options)`
2. Suggested input shape:
   - `factCardId`
   - `decision`: `"approved" | "rejected" | "revision_requested" | null`
   - `notes: string | null`
   - optional `decidedAt`
3. Suggested output shape:
   - schema/version string
   - decision result id
   - factCardId
   - ownerDecision / ownerNotes
   - `canMarkPublishable: boolean`
   - blocker codes
   - `isMock`
   - citation count
   - source summary fields needed for audit
4. Suggested blocker codes:
   - `decision_pending`
   - `decision_rejected`
   - `decision_revision_requested`
   - `fact_card_id_mismatch`
   - `mock_fact_card`
   - `missing_citations`
   - `source_url_missing`
   - `already_publishable`
5. Suggested pass condition:
   - decision is approved
   - factCardId matches
   - factCard is not mock
   - factCard has at least one citation
   - sourceUrl exists and starts with `https://`
   - factCard is not already publishable
6. Export the helper through `lib/owner-decision/index.ts`.
7. Add lightweight fixture/example results only if useful, but do not create large test scaffolding.

Not required:

- No package-preview UI changes.
- No `isPublishable=true` mutation.
- No Fact Card cloning or persistence.
- No approval controls.
- No DB/API route/localStorage.

## Required Behavior

- Start with `git status -sb`.
- Expected at start:
  - branch ahead `45`
  - untracked `piq_diag_out.txt`
  - tracked dirty `_ai/HANDOFF_NOW.md` from this Codex handoff update
- Do not read, modify, delete, stage, or commit `piq_diag_out.txt`.
- Keep all behavior deterministic. No `Date.now()`/`Math.random()`.
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
- Do not add Owner approval UI.
- Do not resume retired video routes or old render loops.

## Required Checks

Run focused checks:

- `git status -sb`
- targeted TypeScript/source check for changed files or existing focused no-output pattern
- targeted ESLint for changed implementation files
- if fixtures/examples are added:
  - static verify at least one blocked mock case
  - static verify pending/rejected/revision cases block
  - static verify approved live-shaped non-mock case can return `canMarkPublishable=true`
- forbidden pattern search on changed implementation files:
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

- A pure publishability decision helper exists under `lib/owner-decision`.
- Helper never mutates the input Fact Card.
- Helper does not set or persist `isPublishable=true`; it only reports whether that would be allowed.
- Mock Fact Cards are blocked.
- Pending/rejected/revision decisions are blocked.
- Approved non-mock source-backed Fact Card can be marked eligible by the contract.
- `_ai` state is minimally synced to checkpoint `d3e0a79`.
- No secret leakage.
- No DB/render/GPT/upload/push/dependency/output changes.
- Final handoff reports changed files, checks/results, deviations/risks, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` because this contract is a reusable safety boundary before approval UI.
