# Handoff Now

## Task ID

`money-shorts-os-ecos-latest-live-draft-candidate-v1`

## Current State

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest local checkpoint: `4bc9f0a feat(source-facts): add bok base-rate source-date resolver`
- Latest known `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 33]` plus untracked `piq_diag_out.txt`
- Push: not run.
- `piq_diag_out.txt` is unrelated untracked output. Do not read, modify, delete, stage, or commit it.

Recently completed:

- Auto Fact Card candidate foundation:
  - `RawDataSnapshot -> RawSnapshotParser -> ManualFactCardDraft -> authorManualFactCard()`
  - `/fact-cards/manual/package-preview?candidate=base-rate` preview for a deterministic ECOS mock candidate
- ECOS connector scaffold and live transport:
  - sync mock path and async live path
  - `createEcosLiveTransport()`
  - `runEcosConnectorAsync()`
  - `orderEcosRowsCurrentFirst()`
  - `normalizeEcosBaseRateRows()` refuses empty/unverified `publishedDate`
- Historical smoke ECOS fixture:
  - Jan2025/Dec2024 `3.0% -> 3.0%`, change `0.0%p`
  - Jan2025 is only a historical smoke fixture, not a production default
- Latest-period resolver:
  - `buildEcosLatestWindowRequest()`
  - `resolveLatestEcosBaseRatePeriod()`
  - `decideEcosLatestPeriodReadiness()`
  - live check found latest `202605`, previous `202604`, both `2.5연%`
  - unresolved source date correctly stayed `blocked_pending_source_date`
- Source-date resolver:
  - `resolveEcosBaseRateSourceDate()` ties the latest ECOS value to official BOK base-rate decision history
  - latest value `2.5%` matches official latest BOK decision `2025-05-29 2.50%`
  - `verifiedPublishedDate=2025-05-29`
  - source-date is official BOK decision date, not derived from ECOS period `202605`

Important distinction:

- Production Fact Cards must use the latest available source period.
- If latest period or verified source date cannot be resolved, block instead of falling back to Jan2025.
- `publishedDate` must not be invented. ECOS row payload does not include the BOK announcement date.
- Source-date evidence should remain visible in the draft/citation path when a published date comes from the BOK decision table.

## Goal

Implement a bounded latest-live ECOS base-rate draft candidate path:

`latest ECOS rows -> resolve latest period -> verify BOK source date -> normalize snapshot -> generate Fact Card draft candidate`

This slice should produce a validated draft candidate for the latest available ECOS base-rate period only when the BOK source date is verified.

## Approved Scope

Allowed:

- Add a small helper under `lib/source-facts/`, for example `ecos-latest-candidate.ts`.
- Reuse existing helpers:
  - `buildEcosLatestWindowRequest()`
  - `resolveLatestEcosBaseRatePeriod()`
  - `resolveEcosBaseRateSourceDate()`
  - `decideEcosLatestPeriodReadiness()`
  - `normalizeEcosBaseRateRows()`
  - `generateCandidateFromSnapshot()`
  - `ecosBaseRateParser`
- Fix the provider-id contract so a live/latest draft is not labeled as `provider-ecos-mock`.
  - Preserve the existing mock path.
  - Prefer a minimal explicit provider-id split such as `provider-ecos-mock` vs `provider-ecos-live`.
  - The parser may support both mock and live ECOS base-rate snapshots if that is the smallest safe change.
- Preserve source-date provenance in the draft path.
  - If the published date comes from the BOK decision table, keep BOK source name/URL available in raw payload and/or citations.
  - Do not make the ECOS period look like the announcement date.
- Add or update a small read-only check script only if useful, for example `scripts/_ecos-latest-draft-candidate-check.mjs`.
- Use project-local `.env.local` for the one ECOS live verification command if needed.
- Update `_ai/CLAUDE_REPORT.md` with concise evidence.
- Update `_ai/NEXT_ACTION.md` and `_ai/PROJECT_STATE.md` only if durable state changed.

Not required in this slice:

- UI route integration.
- `/fact-cards/manual/package-preview` live candidate selector.
- GPT/script/video/render/package generation.
- Marking any Fact Card as publishable.

## Required Behavior

- Start with `git status -sb`.
- Expected at start:
  - `_ai/HANDOFF_NOW.md` may be modified by Codex for this scope.
  - `_ai/NEXT_ACTION.md` may be modified by Codex state sync.
  - `piq_diag_out.txt` remains untracked.
- If unexpected implementation files are modified before work starts, stop and report.
- Do not read, modify, delete, stage, or commit `piq_diag_out.txt`.
- Do not ask the Owner for ECOS key. Use `.env.local` if a live check is needed.
- Do not print secret values or secret-bearing URLs.
- No module-level live network calls. Live calls must only happen inside explicit scripts or transport execution.
- If source date cannot be verified, return a blocked result with no candidate.
- If source date is verified, candidate must remain draft-only:
  - `isMock=false` for live/latest candidate
  - `isPublishable=false`
  - no upload/render/deploy implication

## Forbidden

- No GPT/Gemini/Veo/OpenAI/ElevenLabs calls.
- No ffmpeg execution.
- No video/audio/image rendering.
- No OS clipboard writes.
- No DB/Supabase reads, writes, migrations, or production changes.
- No API route changes unless Codex/Owner explicitly re-scopes.
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
- targeted ESLint for changed code files/scripts
- focused TypeScript check for changed `lib/source-facts/` files
- forbidden pattern search on changed files:
  - `Date.now`
  - `Math.random`
  - `navigator.clipboard`
  - `ffmpeg`
  - `output/`
  - `upload`
  - `deploy`
- secret safety search:
  - ensure no API key value was written
  - ensure no `.env` file was modified/staged
  - ensure secret-bearing ECOS URL is not printed
- live/latest draft check:
  - run at most one ECOS live check via `.env.local`
  - report latest period, previous period, verified published date, candidate status, provider id, `isMock`, `isPublishable`, key Fact Card values
- untracked safety:
  - prove `piq_diag_out.txt` remains untracked and unstaged
- final `git status -sb`

Do not run full `pnpm build`; existing `output/` binary `.ts` pollution is a known blocker.

## Definition of Done

- A deterministic library path exists for latest ECOS base-rate rows to become a draft Fact Card candidate when source date is verified.
- The path blocks cleanly when source date is unresolved.
- Live/latest candidate is not labeled `provider-ecos-mock`.
- Mock candidate behavior remains intact.
- Source-date provenance is not lost.
- Candidate remains draft-only: `isMock=false`, `isPublishable=false`.
- No date is invented from `202605` or any ECOS period.
- ECOS API key is never printed, persisted, or committed.
- `piq_diag_out.txt` remains untouched/untracked.
- Final handoff reports changed files, checks/results, live verification result, deviations/risks, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` because this slice changes the reusable source-first data boundary.
