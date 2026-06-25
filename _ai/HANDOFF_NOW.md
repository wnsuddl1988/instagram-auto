# Handoff Now

## Task ID

`money-shorts-os-ecos-latest-period-resolver-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest local checkpoint: `43fe473 fix(source-facts): align ecos mock fixtures with live truth`
- Latest known `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 31]`
- Push: not run.
- Working tree was clean before this handoff refresh.
- Codex may have uncommitted `_ai/HANDOFF_NOW.md` / `_ai/NEXT_ACTION.md` updates for this new task scope; those docs-only changes are expected at task start.

Recently completed:

- Auto Fact Card candidate foundation:
  - `RawDataSnapshot -> RawSnapshotParser -> ManualFactCardDraft -> authorManualFactCard()`
  - `/fact-cards/manual/package-preview?candidate=base-rate` preview
- ECOS connector scaffold and live transport:
  - `EcosStatSearchRequest`
  - sync `EcosTransport.execute()` mock path
  - async `EcosAsyncTransport.executeAsync()` live path
  - `createEcosLiveTransport()`
  - `runEcosConnectorAsync()`
  - `orderEcosRowsCurrentFirst()`
  - `normalizeEcosBaseRateRows()`
- ECOS live smoke check:
  - `node --env-file=.env.local scripts/_ecos-live-check.mjs`
  - `RESULT: LIVE_OK`
  - historical smoke request `202412~202501`
  - Jan2025 `3.0%`, Dec2024 `3.0%`, change `0.0%p`
- Mock fixture/candidate aligned to live smoke truth.

Important distinction:

- Jan2025 is a historical smoke fixture, not a production default.
- Actual video-production Fact Cards must use the latest available source period.
- If the latest source period cannot be resolved, do not fall back to Jan2025; return a blocked / needs source refresh state.
- `publishedDate` must not be invented. The existing normalizer requires an explicit request `publishedDate`; a latest-period resolver must either use a known/verified source date or keep the result non-publishable / blocked for source date review.

Owner approval:

- Owner approved the recommended next step: **`latest available period` 선택/검증 slice 진행**.
- This approval permits this slice to:
  - make small ECOS live API calls for latest-period discovery/verification
  - read the ECOS API key from project-local `.env.local` via `node --env-file=.env.local ...` or existing secret-safe env handling
  - implement a bounded latest-period resolver/checker for the ECOS base-rate series
- This approval does **not** permit DB writes, deploy, upload/post, push, dependency changes, env/secret edits, render/output generation, or any GPT/video/TTS calls.

## Goal

Implement and verify a narrow ECOS base-rate latest-period resolver so production work no longer depends on the Jan2025 historical smoke request.

Target path:

`latest-period request window -> EcosLiveTransport -> current-first rows -> latest period pair -> normalization/candidate readiness decision`

The result should identify the latest available ECOS base-rate period and its previous period, without inventing a published date or pretending the candidate is production-ready when source date review is still needed.

## Approved Scope

Allowed:

- Add a small resolver/helper under `lib/source-facts/` for ECOS base-rate latest-period discovery.
- Add a small read-only script under `scripts/` for live verification.
- Reuse:
  - `EcosStatSearchRequest`
  - `createEcosLiveTransport()`
  - `runEcosConnectorAsync()` where appropriate
  - `orderEcosRowsCurrentFirst()`
  - `normalizeEcosBaseRateRows()` only when a valid explicit `publishedDate` is available.
- Build a bounded rolling monthly request window ending at an explicit caller-supplied period.
  - Do not use `Date.now()` inside library code.
  - For this verification, caller/script may use a fixed end period based on the current project date: `202606`.
- Select the latest available row from ECOS response by `TIME`, plus the nearest previous row.
- If fewer than two valid rows are available, report blocked / insufficient source rows.
- If no verified `publishedDate` is available for the latest period, do not produce a publishable Fact Card.
- Update `_ai/CLAUDE_REPORT.md` with concise evidence.
- Update `_ai/NEXT_ACTION.md` if durable next action changes.
- Update `_ai/PROJECT_STATE.md` only if the durable state/progress changes materially.

Expected code files may include:

- `lib/source-facts/ecos-connector.ts`
- new file under `lib/source-facts/`, for example:
  - `ecos-latest-period.ts`
- `lib/source-facts/index.ts`
- optional script under `scripts/`, for example:
  - `_ecos-latest-period-check.mjs`

UI changes are not required for this slice.

## Required Behavior

- Start with `git status -sb`.
- If only `_ai/HANDOFF_NOW.md` / `_ai/NEXT_ACTION.md` are modified at start, proceed; those are Codex's expected scope updates.
- If any unexpected code file is modified at start, stop and report it.
- Load project env from `.env.local` without printing secret values.
- Do not ask the Owner to paste or reveal the API key.
- Make only the minimum ECOS live calls needed for this resolver check.
- Do not loop broadly across years or indicators.
- Do not persist raw live API responses to files.
- Do not generate scripts/video/packages from the result.
- Do not mark the result publishable unless source date requirements are explicitly satisfied.

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
  - run the latest-period script once with `.env.local`
  - report latest period, previous period, values, and whether a publishable candidate is blocked by missing/unknown publishedDate
- final `git status -sb`

Do not run full `pnpm build`; existing `output/` binary `.ts` pollution is a known blocker.

## Definition of Done

- A bounded ECOS base-rate latest-period resolver/check exists.
- It identifies the latest available ECOS period and previous period from live rows.
- It does not default to Jan2025 smoke data.
- It does not invent `publishedDate`.
- It clearly reports whether the result is ready for draft only, publishable, or blocked pending source-date review.
- ECOS API key is never printed, persisted, or committed.
- No DB/env writes/dependency/render/upload/push/output action occurs.
- Final handoff reports changed files, checks/results, live verification result, source-date/publishability status, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` with concise implementation and verification evidence because this is a production-data-boundary resolver.
