# Handoff Now

## Task ID

`money-shorts-os-ecos-source-date-resolver-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest local checkpoint: `63d9b10 feat(source-facts): add ecos latest-period resolver with source-date gate`
- Latest known `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 32]` plus untracked `piq_diag_out.txt`
- Push: not run.
- `piq_diag_out.txt` is an unrelated untracked file. Do not read, modify, delete, stage, or commit it.
- Working tree was clean for tracked files before this handoff refresh.
- Codex may have uncommitted `_ai/HANDOFF_NOW.md` / `_ai/NEXT_ACTION.md` updates for this new task scope; those docs-only changes are expected at task start.

Recently completed:

- Auto Fact Card candidate foundation:
  - `RawDataSnapshot -> RawSnapshotParser -> ManualFactCardDraft -> authorManualFactCard()`
  - `/fact-cards/manual/package-preview?candidate=base-rate` preview
- ECOS connector scaffold and live transport:
  - sync mock path and async live path
  - `createEcosLiveTransport()`
  - `runEcosConnectorAsync()`
  - `orderEcosRowsCurrentFirst()`
  - `normalizeEcosBaseRateRows()` refuses empty/unverified `publishedDate`
- Historical smoke ECOS check:
  - Jan2025/Dec2024 `3.0% -> 3.0%`, change `0.0%p`
  - mock fixture/candidate aligned to live smoke truth
- Latest-period resolver:
  - `buildEcosLatestWindowRequest()`
  - `resolveLatestEcosBaseRatePeriod()`
  - `decideEcosLatestPeriodReadiness()`
  - live check found latest `202605`, previous `202604`, both `2.5연%`
  - result correctly stayed `blocked_pending_source_date` because ECOS rows do not contain BOK announcement date

Important distinction:

- Jan2025 is a historical smoke fixture, not a production default.
- Actual video-production Fact Cards must use the latest available source period.
- If source period or source date cannot be resolved, do not fall back to Jan2025; return a blocked / needs source refresh state.
- `publishedDate` must not be invented. ECOS row payload does not include the BOK announcement date.
- A source-date resolver must only return a date when it can tie the date to an official BOK source. Otherwise it must report blocked / unresolved.

Owner approval:

- Owner approved the recommended next step: **source-date 검증 경로 설계/구현 진행**.
- This approval permits this slice to:
  - make small official BOK/ECOS live source checks needed to verify a base-rate announcement date
  - use project-local `.env.local` for ECOS if needed
  - implement a bounded source-date resolver/checker for the ECOS base-rate latest period
- This approval does **not** permit DB writes, deploy, upload/post, push, dependency changes, env/secret edits, render/output generation, or any GPT/video/TTS calls.

## Goal

Implement and verify a narrow official-source date resolver so the latest ECOS base-rate period can move from `blocked_pending_source_date` toward `draft_ready` only when an official BOK announcement date is verified.

Target path:

`latest ECOS period -> official BOK source-date resolver -> verifiedPublishedDate or blocked -> decideEcosLatestPeriodReadiness()`

The result should prove whether the latest base-rate period can be paired with a verified BOK source date without inventing dates.

## Approved Scope

Allowed:

- Add a small resolver/helper under `lib/source-facts/` for BOK base-rate source-date verification.
- Add a small read-only script under `scripts/` for live verification.
- Reuse:
  - `buildEcosLatestWindowRequest()`
  - `createEcosLiveTransport()`
  - `resolveLatestEcosBaseRatePeriod()`
  - `decideEcosLatestPeriodReadiness()`
- Make a bounded official-source check against BOK/ECOS only.
- Prefer official BOK pages/endpoints over general web search.
- Use only source evidence that can be tied to the base-rate decision period/date.
- If no verified date can be extracted confidently, return blocked/unresolved.
- If a verified date is found, demonstrate that `decideEcosLatestPeriodReadiness(rows, fetchedAt, verifiedPublishedDate)` reaches `draft_ready` with `publishable=false`.
- Update `_ai/CLAUDE_REPORT.md` with concise evidence.
- Update `_ai/NEXT_ACTION.md` if durable next action changes.
- Update `_ai/PROJECT_STATE.md` only if the durable state/progress changes materially.

Expected code files may include:

- new file under `lib/source-facts/`, for example:
  - `ecos-source-date.ts`
  - or `bok-base-rate-source-date.ts`
- `lib/source-facts/index.ts`
- optional script under `scripts/`, for example:
  - `_ecos-source-date-check.mjs`

UI changes are not required for this slice.

## Required Behavior

- Start with `git status -sb`.
- If only `_ai/HANDOFF_NOW.md` / `_ai/NEXT_ACTION.md` are modified at start, and `piq_diag_out.txt` is untracked, proceed; those are expected.
- If any unexpected code file is modified at start, stop and report it.
- Do not read, modify, delete, stage, or commit `piq_diag_out.txt`.
- Load project env from `.env.local` only if ECOS is needed, without printing secret values.
- Do not ask the Owner to paste or reveal any key.
- Make only the minimum BOK/ECOS live calls needed for this resolver check.
- Do not crawl broadly.
- Do not persist raw live API/HTML responses to files.
- Do not generate scripts/video/packages from the result.
- Do not mark anything publishable in this slice.
- Do not invent `publishedDate`. Block if unresolved.

## Forbidden

- No GPT/Gemini/Veo/OpenAI/ElevenLabs calls.
- No ffmpeg execution.
- No video/audio/image rendering.
- No actual media probing.
- No KOSIS/OpenDART/FRED live API calls.
- No DB/Supabase reads, writes, migrations, or production data changes.
- No API route changes unless Codex/Owner explicitly re-scopes.
- No API key/env/secret changes or writes.
- No dependency or lockfile changes.
- No OS clipboard writes.
- No upload/post/deploy.
- No git push.
- No commit unless Codex explicitly authorizes it later.
- Do not touch `output/`.
- Do not touch `piq_diag_out.txt`.
- Do not resume retired Candidate10 / Money Architect static plate / 3D character / code-GFX / old video render loops.
- Do not resume 생활꿀팁, EP001 돈 방어, Jun/준/시트콤/복사기/upload_002/ep003/3d_sitcom lines.

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
- live check:
  - run the source-date checker once
  - report latest period, official-source status, verified date if found, and readiness status
- untracked safety:
  - prove `piq_diag_out.txt` remains untracked and unstaged
- final `git status -sb`

Do not run full `pnpm build`; existing `output/` binary `.ts` pollution is a known blocker.

## Definition of Done

- A bounded BOK/ECOS source-date resolver/check exists.
- It either finds a verified official BOK date for the latest base-rate period or clearly returns blocked/unresolved.
- It does not invent `publishedDate`.
- If verified date is found, latest rows can reach `draft_ready` via `decideEcosLatestPeriodReadiness(..., verifiedDate)` while `publishable=false`.
- If no verified date is found, status remains blocked/unresolved with a clear reason.
- ECOS API key is never printed, persisted, or committed.
- `piq_diag_out.txt` remains untouched/untracked.
- No DB/env writes/dependency/render/upload/push/output action occurs.
- Final handoff reports changed files, checks/results, live verification result, source-date/readiness status, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` with concise implementation and verification evidence because this is a production-data-boundary source-date resolver.
