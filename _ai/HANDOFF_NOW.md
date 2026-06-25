# Handoff Now

## Task ID

`money-shorts-os-ecos-live-connector-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest local checkpoint: `20ab76b feat(source-facts): add ecos connector scaffold with mock transport`
- Latest known `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 29]`
- Push: not run.
- Working tree was clean before this handoff refresh.
- Codex may have an uncommitted `_ai/HANDOFF_NOW.md` / `_ai/NEXT_ACTION.md` update for this new task scope; those docs-only changes are expected at task start.

Recently completed:

- Auto Fact Card candidate foundation:
  - `RawDataSnapshot -> RawSnapshotParser -> ManualFactCardDraft -> authorManualFactCard()`
  - `/fact-cards/manual/package-preview?candidate=base-rate` preview
- ECOS connector scaffold:
  - `EcosStatSearchRequest`
  - `EcosTransport.execute()`
  - mock transport fixture
  - `normalizeEcosBaseRateRows()`
  - scaffold snapshot/candidate path
- ECOS scaffold review-fix:
  - known published date `2025-01-16` carried from request metadata
  - human-facing source page URL preserved
  - `fetch()` method naming avoided in scaffold transport boundary

Owner approval:

- Owner approved the recommended next step: **ECOS live connector 승인 후 진행**.
- This approval permits this slice to:
  - implement `EcosLiveTransport`
  - use global `fetch()` only inside the live transport
  - read ECOS API key from `process.env`
  - make a small ECOS live API call for validation
- This approval does **not** permit DB writes, deploy, upload/post, push, dependency changes, env/secret edits, render/output generation, or any GPT/video/TTS calls.

## Goal

Implement and verify the first ECOS live connector slice safely.

Target path:

`EcosLiveTransport -> ECOS live response -> normalizeEcosBaseRateRows() -> RawDataSnapshot -> ecosBaseRateParser -> Fact Card candidate`

The result should prove that the source-first automatic Fact Card candidate flow can run against one approved live ECOS request without moving into video/render/GPT.

## Approved Scope

Allowed:

- Add an `EcosLiveTransport` implementation under `lib/source-facts/`.
- Use global `fetch()` only in the live transport implementation.
- Read an ECOS API key from `process.env` only for the approved ECOS connector.
- Keep the API key value secret:
  - never print it
  - never write it to docs
  - never include it in errors
  - never commit env files
- Add a small helper that builds the ECOS StatisticSearch URL from `EcosStatSearchRequest`.
- Parse ECOS live response into existing `EcosStatRow[]`.
- Reuse existing `runEcosConnector()` / `normalizeEcosBaseRateRows()` / `generateCandidateFromSnapshot()` path.
- Add a live-check script or exported helper if useful, but keep it local-only and read-only.
- Update `_ai/CLAUDE_REPORT.md` with concise implementation/check evidence.
- Update `_ai/NEXT_ACTION.md` if the next durable step changes.

Expected code files may include:

- new file under `lib/source-facts/`, for example:
  - `ecos-live-transport.ts`
- `lib/source-facts/ecos-connector.ts`
- `lib/source-facts/ecos-normalizer.ts`
- `lib/source-facts/index.ts`
- optional script under `scripts/` only if it is narrowly scoped to this live check and does not write files

UI changes are not required for this slice. Prefer library/live connector foundation first.

## Required Behavior

- Start with `git status -sb`.
- If only `_ai/HANDOFF_NOW.md` / `_ai/NEXT_ACTION.md` are modified at start, proceed; those are Codex's expected scope updates.
- If any unexpected code file is modified at start, stop and report it.
- Do not ask the Owner to paste or reveal the API key.
- Check for an ECOS API key environment variable without printing the value.
- If the key is missing:
  - still implement the live transport boundary
  - run static/unit checks
  - report live verification blocked by missing env var
  - do not fake live success
- If the key exists:
  - make only the minimum live request needed for the approved base-rate check
  - do not loop or bulk fetch
  - do not persist the response outside code/log evidence
- Keep source/citation linkage and known published date/source URL behavior intact.

## Suggested Env Var Names

Use the first available, without printing values:

- `ECOS_API_KEY`
- `BOK_ECOS_API_KEY`

If neither exists, report missing env var by name only.

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
- targeted ESLint for changed code files
- focused TypeScript check for changed `lib/source-facts/` / script files
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
- live check:
  - if env key exists: one approved ECOS base-rate request, then normalize to snapshot and candidate
  - if env key missing: report blocked live check, no fake pass
- final `git status -sb`

Do not run full `pnpm build`; existing `output/` binary `.ts` pollution is a known blocker.

## Definition of Done

- `EcosLiveTransport` exists and is isolated from mock transport.
- Live transport uses `fetch()` and `process.env` only within the approved ECOS connector boundary.
- ECOS API key is never printed, persisted, or committed.
- Either:
  - one live base-rate request succeeds and produces a normalized `RawDataSnapshot`/candidate, or
  - implementation is complete and live verification is clearly blocked by missing env var.
- Mock transport/scaffold remains working.
- No DB/env writes/dependency/render/upload/push/output action occurs.
- Final handoff reports changed files, checks/results, live verification result or blocker, secret-safety evidence, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` with concise implementation and verification evidence because this is the first approved live connector boundary.
