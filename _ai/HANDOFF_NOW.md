# Handoff Now

## Task ID

`money-shorts-os-ecos-connector-scaffold-v1-review-fix`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest local checkpoint: `d85b616 feat(source-facts): add auto fact card candidate preview`
- Latest known `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 28]`
- Push: not run.

Uncommitted ECOS scaffold work exists:

- `_ai/CLAUDE_REPORT.md`
- `_ai/HANDOFF_NOW.md`
- `_ai/NEXT_ACTION.md`
- `lib/source-facts/index.ts`
- `lib/source-facts/ecos-connector.ts`
- `lib/source-facts/ecos-fixtures.ts`
- `lib/source-facts/ecos-normalizer.ts`

No commit yet.

## Codex Review Findings

Fix these before checkpoint:

1. Published date data correctness
   - File: `lib/source-facts/ecos-normalizer.ts`
   - `ecosTimeToPublishedDate("202501")` returns a last-day fallback such as `2025-01-31`.
   - The fixture/comment says the BOK announcement date is `2025-01-16`.
   - The scaffold candidate can therefore propagate the wrong publishedDate into Fact Card/citation/allowed claim.
   - Source-first rule: do not invent or fallback a user-facing published date when the known mock source date is available.
   - Fix by passing an explicit source published date through the connector request/context/normalizer path.

2. Transport method naming
   - File: `lib/source-facts/ecos-connector.ts`
   - `EcosTransport.fetch()` is mock-only today, but the name collides with the global `fetch()` concept and forbidden-pattern checks.
   - Rename the interface method and calls to a neutral name such as `request()` or `execute()`.
   - No live network transport implementation in this slice.

3. Human-facing source URL
   - Current normalized snapshot may use the API endpoint as the Fact Card-level `sourceUrl`.
   - Prefer passing an explicit source/stat page URL through request/context so the generated Fact Card source URL is reviewable by Owner.
   - It is okay to preserve the API endpoint separately in rawPayload if useful.

## Goal

Perform a narrow review-fix pass on the ECOS connector scaffold before checkpoint.

Keep the successful scaffold path:

`ECOS request spec -> mock transport response -> normalized RawDataSnapshot -> existing RawSnapshotParser -> Fact Card candidate`

Do not add live network behavior.

## Approved Scope

Allowed:

- Extend `EcosStatSearchRequest` or equivalent connector context with explicit source metadata needed by the normalizer:
  - publishedDate: `2025-01-16`
  - human-facing source URL for the ECOS stat page
  - source name / provider id if useful
- Update `runEcosConnector()` and normalizer signature if needed so request/context reaches normalization.
- Rename `EcosTransport.fetch()` to a neutral method name and update all usages.
- Ensure the scaffold candidate generated from Jan 2025 base-rate mock data uses:
  - `publishedDate: "2025-01-16"`
  - a human-facing ECOS source URL where the Fact Card/source citation expects reviewable source URL
  - source display strings such as `"3.00%"`, `"3.25%"`, `"-0.25%p"`
- Update `_ai/CLAUDE_REPORT.md` with concise review-fix evidence.
- Update `_ai/NEXT_ACTION.md` only if durable next action wording changes.

Default editable files:

- `lib/source-facts/ecos-connector.ts`
- `lib/source-facts/ecos-normalizer.ts`
- `lib/source-facts/ecos-fixtures.ts` only if needed
- `_ai/CLAUDE_REPORT.md`
- `_ai/HANDOFF_NOW.md` only if a small post-work pointer update is necessary

## Required Behavior

- Start with `git status -sb`.
- Keep mock-only transport/normalizer scaffold.
- Do not introduce network calls.
- Do not introduce env/API key reads.
- Do not invent dates; use explicit mock fixture/request metadata for known dates.
- Keep deterministic constants only.
- Keep the resulting snapshot flowing into existing `ecosBaseRateParser` / `generateCandidateFromSnapshot()`.

## Forbidden

- No GPT/Gemini/Veo/OpenAI/ElevenLabs calls.
- No ffmpeg execution.
- No video/audio/image rendering.
- No actual media probing.
- No ECOS/KOSIS/OpenDART/FRED live API calls.
- No global `fetch()` / HTTP client implementation in this slice.
- No DB/Supabase reads, writes, migrations, or production data changes.
- No API route changes.
- No API key/env/secret changes.
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
- focused TypeScript check for changed `lib/source-facts/` files
- forbidden pattern search on changed code files:
  - `Date.now`
  - `Math.random`
  - `fetch(`
  - `process.env`
  - `navigator.clipboard`
  - `ffmpeg`
  - `output/`
  - `upload`
  - `deploy`
- verify by static evidence or a tiny local script/TS check that `scaffoldEcosBaseRateCandidate` uses `publishedDate: "2025-01-16"` and no accidental `2025-01-31` for Jan 2025
- final `git status -sb`

Do not run full `pnpm build`; existing `output/` binary `.ts` pollution is a known blocker.

## Definition of Done

- Published date no longer falls back to an invented month-end date for the known Jan 2025 mock fixture.
- Transport boundary no longer uses a method named `fetch`.
- Human-facing source URL is carried through the normalized snapshot/candidate where reviewable source URL is expected.
- Mock ECOS response still deterministically becomes a `RawDataSnapshot`.
- Resulting snapshot still flows into existing Fact Card candidate parser/validation path.
- No live API/network/env/dependency/render/upload/push/output action occurs.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` with concise review-fix evidence.
