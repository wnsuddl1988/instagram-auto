# Handoff Now

## Task ID

`money-shorts-os-package-preview-live-latest-candidate-v1`

## Current State

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest local checkpoint: `525e635 feat(source-facts): connect ecos resolvers into live draft candidate path`
- Latest known `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 34]` plus untracked `piq_diag_out.txt`
- Push: not run.
- `piq_diag_out.txt` is unrelated untracked output. Do not read, modify, delete, stage, or commit it.

Recently completed:

- Source-first MVP1 local workflow routes and package preview.
- ECOS mock candidate preview: `/fact-cards/manual/package-preview?candidate=base-rate`.
- ECOS live transport, latest-period resolver, BOK source-date resolver.
- Latest live draft candidate path:
  - `latest ECOS rows -> resolve latest period -> verify BOK source date -> normalize snapshot -> generate Fact Card draft candidate`
  - checkpoint `525e635`
  - `sourceProviderId=provider-ecos-live`
  - `isMock=false`
  - `isPublishable=false`
  - BOK source-date provenance preserved in rawPayload and citation
  - no date invention from ECOS period `202605`

Important distinction:

- Default package preview routes must remain deterministic and must not call live APIs.
- A live/latest preview may call ECOS only when the Owner explicitly selects a live candidate query.
- The preview remains local/dev-only and must not imply publish/render/upload approval.
- `publishedDate` remains official BOK decision date, not ECOS period.

## Goal

Expose the latest live ECOS base-rate draft candidate in the local package-preview UI, behind an explicit dev-only query path:

`/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606`

The default page and existing mock candidate must continue to work without live network calls.

## Approved Scope

Allowed:

- Modify `app/fact-cards/manual/package-preview/page.tsx`.
- Add a small server-side helper under `lib/source-facts/` only if it keeps the page clean.
- Reuse:
  - `buildEcosLatestWindowRequest()`
  - `createEcosLiveTransport()`
  - `buildEcosLatestDraftCandidate()`
  - existing package assembly/review/gate/clipboard builders
- Add a dev-only live candidate option to the selector.
- Use an explicit `endPeriod` query param.
  - Default link may use `endPeriod=202606` for current local smoke.
  - Do not use `Date.now()` or infer current period from the clock.
- If live candidate is selected and ECOS key is missing or live request fails, show a local blocked/error state. Do not silently fall back to mock or Jan2025.
- Adjust on-page wording so the UI does not falsely claim "외부 API 없음" when the live candidate is selected.
- Update `_ai/CLAUDE_REPORT.md` with concise route evidence.
- Update `_ai/NEXT_ACTION.md` / `_ai/PROJECT_STATE.md` only if durable state changed.

Not required:

- No new API route.
- No DB/Supabase integration.
- No package persistence.
- No Owner approval persistence.
- No GPT/script/video/render/TTS/upload.
- No publishable=true.

## Required Behavior

- Start with `git status -sb`.
- Expected at start:
  - `piq_diag_out.txt` remains untracked.
  - `_ai/HANDOFF_NOW.md` / `_ai/NEXT_ACTION.md` may be modified by Codex for this scope.
- If unexpected implementation files are dirty before work starts, stop and report.
- Do not read, modify, delete, stage, or commit `piq_diag_out.txt`.
- Default route behavior:
  - `/fact-cards/manual/package-preview` uses existing household debt fixture.
  - no ECOS live call.
- Existing mock route behavior:
  - `/fact-cards/manual/package-preview?candidate=base-rate` uses existing mock generated base-rate candidate.
  - no ECOS live call.
- New live route behavior:
  - `/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606` performs a read-only ECOS live call server-side.
  - builds latest live draft candidate via `buildEcosLatestDraftCandidate()`.
  - requires `status === "draft_ready"` and a valid `candidateResult.factCard`.
  - displays/propagates `sourceProviderId=provider-ecos-live`, `isMock=false`, `isPublishable=false`, `publishedDate=2025-05-29`, `dataPeriod=2026년 5월`.
  - retains BOK source-date citation in the source/citation section.
- Unknown `candidate` keys must still error instead of silently falling back.
- Invalid `endPeriod` must show a local error/blocked state.
- No secret values or secret-bearing ECOS URLs may appear in UI, logs, docs, or error messages.

## Forbidden

- No GPT/Gemini/Veo/OpenAI/ElevenLabs calls.
- No ffmpeg execution.
- No video/audio/image rendering.
- No OS clipboard writes.
- No DB/Supabase reads, writes, migrations, or production changes.
- No new API routes.
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
- targeted ESLint for changed code files
- focused TypeScript check for changed source/UI files
- forbidden pattern search on changed files:
  - `Date.now`
  - `Math.random`
  - `navigator.clipboard`
  - `ffmpeg`
  - `output/`
  - `upload`
  - `deploy`
- secret safety:
  - no API key value written
  - no `.env*` modified/staged
  - no secret-bearing ECOS URL printed or rendered
- route smoke:
  - default `/fact-cards/manual/package-preview`: load OK, no React key warning
  - mock `/fact-cards/manual/package-preview?candidate=base-rate`: load OK, no React key warning
  - live `/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606`: load OK or clear blocked state, no React key warning
  - if live OK, verify visible fields: `provider-ecos-live`, `isMock=false`, `isPublishable=false`, `publishedDate=2025-05-29`, `dataPeriod=2026년 5월`, BOK citation present
- untracked safety:
  - prove `piq_diag_out.txt` remains untracked and unstaged
- final `git status -sb`

Do not run full `pnpm build`; existing `output/` binary `.ts` pollution is a known blocker.

## Definition of Done

- Existing default and mock package-preview routes remain intact.
- New live latest candidate preview is reachable only via explicit query.
- Default/mock routes do not call ECOS live.
- Live route uses latest live draft candidate path and does not fall back to stale fixture.
- Live candidate remains draft-only: `isMock=false`, `isPublishable=false`.
- BOK source-date citation/provenance is visible or inspectable in the preview output.
- No secret leakage.
- No DB/render/GPT/upload/push/dependency/output changes.
- Final handoff reports changed files, checks/results, route evidence, deviations/risks, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` because this slice changes owner-facing local preview behavior and live source visibility.
