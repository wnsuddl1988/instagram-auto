# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `publish-ledger-implementation-no-live-v1`
- Owner approval: `APPROVE_PUBLISH_LEDGER_IMPLEMENTATION_NO_LIVE`
- Purpose: implement the publish ledger safety layer needed before actual dual-platform publish execution, without any live social/API/Blob/deploy/media side effects.

## Current Evidence

Checkpoint `63fa756 chore(media): wire no-run publish dispatcher` completed the gate 6 structure up to an arm-ready but disabled dispatcher:

- `actualApiCallPlan` exists and is value-free
- `actualApiExecutor` exists and is value-free
- `actualApiDispatcher` exists and is value-free
- expected dispatch order is:
  1. `instagram_blob_upload`
  2. `instagram_publish_reel`
  3. `youtube_direct_upload`
  4. `publish_ledger_record`
- default published content still blocks at gate 4 with `BLOCKED_DUPLICATE_ALREADY_PUBLISHED`
- missing credentials still block at gate 5 before plan/executor/dispatcher
- custom ready-probe with dummy env reaches disabled plan/executor/dispatcher and fails closed with `ACTUAL_API_CALL_NOT_ENABLED_THIS_SLICE`
- no credential values or value-derived data are printed or serialized
- checks passed before checkpoint:
  - orchestrator guard `502 PASS / 0 FAIL`
  - owner entrypoint guard `230 PASS / 0 FAIL`
  - owner local env wrapper guard `49 PASS / 0 FAIL`
  - golden content readiness guard `64 PASS / 0 FAIL`

The next blocker is the actual durable duplicate ledger contract. Current orchestrator duplicate guard still uses in-memory/reference evidence. Before enabling any real publish, the project needs a small, deterministic, testable publish ledger module that can be wired later.

## Approved Scope

Approved:

- Add a publish ledger module for future dual-platform publish recording and duplicate checks.
- Keep this slice no-live/no-external.
- Ledger may use local filesystem only when an explicit ledger path is passed by the caller.
- Tests/guards may write only to OS temp or repo-gitignored output/temp paths.
- No production/default ledger write may happen.
- Do not integrate live execution or mutate real publish state.
- Update docs/fixture/guards to record the contract.
- Append concise reusable evidence to `_ai/CLAUDE_REPORT.md`.

Recommended implementation files:

- `lib/publish-ledger.ts` (new)
- `scripts/check-publish-ledger-static.mjs` (new dependency-free guard)
- `scripts/fixtures/publish_ledger.sample.v1.json` (new sample fixture)
- `docs/dual-platform-final-publish-orchestrator.md`
- `docs/owner-daily-automation-runbook.md`
- `_ai/CLAUDE_REPORT.md`

Optional only if needed for contract consistency:

- `scripts/run-dual-platform-final-publish-orchestrator.mjs`
- `scripts/fixtures/dual_platform_final_publish_orchestrator.v1.json`
- `scripts/check-dual-platform-final-publish-orchestrator-static.mjs`

Only touch another file if directly necessary, and report why.

## Required Ledger Contract

Create a narrow server/local utility module with explicit path injection.

Suggested exports:

- `PUBLISH_LEDGER_SCHEMA_VERSION`
- `buildPublishLedgerKey({ contentId, platform, version })`
- `createEmptyPublishLedger()`
- `readPublishLedger(ledgerPath)`
- `writePublishLedger(ledgerPath, ledger)`
- `checkPublishLedgerDuplicate(ledger, { contentId, platform, version })`
- `recordPublishLedgerEntry(ledger, entry)`
- `recordDualPlatformPublish(ledger, input)` or equivalent future-facing helper

Exact names may vary, but the guard/docs must lock the chosen public surface.

Ledger data should be deterministic and value-safe:

- `schemaVersion`
- `records` array
- `key` shaped as `{contentId}/{platform}/{version}`
- `contentId`
- `platform` (`instagram_reels` or `youtube_shorts`)
- `version`
- `variantId`
- `publishedId` or platform-specific public id
- `publishedUrl` optional
- `status` such as `published`
- `publishedAtIso`
- `metadata` object with only non-secret identifiers/fingerprints if needed

Do not store:

- access tokens
- refresh tokens
- client secrets
- API keys
- Blob tokens
- OAuth responses
- raw env values
- credential lengths/prefix/suffix/hash/masked values

## Required Behavior

### Read Behavior

- Missing ledger file should return an empty ledger with `ok:true`, not throw.
- Invalid JSON should fail closed with `ok:false`, preserving the reason and avoiding writes.
- Wrong schemaVersion should fail closed.
- Non-array `records` should fail closed.
- Duplicate keys should fail closed or be reported clearly.

### Write Behavior

- Only write when caller provides an explicit `ledgerPath`.
- Ensure parent directory exists only for that explicit path.
- Write JSON deterministically.
- No append-only partial writes unless deliberately designed and guarded.
- No default production path.
- No writes during import.
- No writes in orchestrator dry-run/preflight/live duplicate-block checks during this slice.
- Guard smoke tests must use OS temp paths and clean up.

### Duplicate Behavior

- `buildPublishLedgerKey` must produce the same shape already used by the orchestrator:
  - `t1_lifestyle_inflation/instagram_reels/v3_2`
  - `t1_lifestyle_inflation/youtube_shorts/v3_2`
- `checkPublishLedgerDuplicate` should return:
  - `alreadyPublished`
  - `key`
  - matching record if present
  - no secret values
- Existing default evidence should be represented in sample fixture or docs as non-secret media/video ids only.

### Future Wiring Boundary

The orchestrator may still use the existing in-memory/reference duplicate guard in this slice.

If you touch the orchestrator, keep it no-live:

- no actual ledger file read/write in `--dry-run`, `--preflight`, `--live`, or `--arm`
- no import that would write at module load
- only string refs or contract metadata unless a read-only helper is proven necessary

## Guard Requirements

Create/update guards proving:

- ledger module exists and exports the chosen public API
- no `.env`, `.env.local`, dotenv, `vercel env pull`, broad env dump, or secret file access
- no external API, OAuth, fetch, googleapis, Graph API, YouTube upload, Blob SDK/mutation/head/list/copy/delete
- no dependency/lockfile/deploy/media generation
- no secret-shaped values in fixture/docs/source
- missing file read returns empty ok ledger
- invalid JSON fails closed
- wrong schema fails closed
- duplicate key detection works
- record write/read round trip works only in OS temp
- duplicate record insertion is blocked or fails closed
- sample keys use exact `{contentId}/{platform}/{version}` shape and v3_2
- committed sample fixture contains no secrets
- orchestrator no-run guards remain passing if touched

## Forbidden Actions

- Do not read, edit, print, copy, stage, commit, or summarize `.env`, `.env.*`, `.env.local`, secret files, tokens, API keys, cookies, or credentials.
- Do not run the Owner no-log wrapper against real `.env.local`.
- Do not print, hash, copy, log, stage, or document secret values.
- Do not report value length, prefix, suffix, hash, masked value, sample, token type inference, or derived credential data.
- Do not use dotenv or `vercel env pull`.
- Do not call Instagram API, YouTube API/OAuth/upload, OpenAI, ElevenLabs, Pexels, Supabase, browser/Chrome, deploy, DNS, Blob SDK/mutation/HEAD/list, ffmpeg, or ffprobe.
- Do not create new media, TTS, images, browser renders, or muxed source files.
- Do not add/change dependencies, lockfiles, pnpm config, fonts, deploy config, or DB schema.
- Do not commit or push.
- Do not touch protected/excluded dirty files:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - `scripts/get-youtube-refresh-token-once.mjs`
  - `shadow-list.txt`

## Required Checks

1. `git status -sb`
2. `node --check scripts/check-publish-ledger-static.mjs`
3. `node scripts/check-publish-ledger-static.mjs`
4. If `lib/publish-ledger.ts` TypeScript syntax/import risk exists:
   - `node node_modules/typescript/bin/tsc --noEmit --pretty false`
5. Targeted regressions:
   - `node scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
   - `node scripts/check-owner-daily-automation-entrypoint-static.mjs` if docs/status behavior changed

Do not run full build unless a focused syntax/import issue requires it.
Do not run local generation pipeline.
Do not run against real `.env.local`.

## Definition Of Done

All must be true:

1. Publish ledger module exists with explicit path injection.
2. Missing/invalid/wrong-schema ledgers are handled fail-closed or safely empty as specified.
3. Duplicate key check works with `{contentId}/{platform}/{version}`.
4. Temp write/read round trip works with no external side effects.
5. No default production ledger write is introduced.
6. No actual publish/upload/OAuth/Blob/deploy/media/API side effect occurs.
7. No credential values or value-derived data appear in output/docs/fixtures/report.
8. `.env.local` and secret files are not read by Claude/Codex/tests.
9. Required guards pass.
10. No commit or push.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- changed files
- publish ledger API/contract summary
- duplicate behavior summary
- temp read/write smoke result
- checks/results
- side effects confirmation
- env/secret handling confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 95%`
