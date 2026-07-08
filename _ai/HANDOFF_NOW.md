# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `publish-ledger-runtime-readonly-preflight-gate-fix-v1`
- Purpose: fix the review finding from `publish-ledger-runtime-readonly-orchestrator-bridge-no-live-v1`.
- Status: previous bridge implementation is mostly accepted, but checkpoint is blocked until preflight reflects ledger read failures as not-ready.

## Review Finding

Codex reproduced this issue:

```text
node scripts/run-dual-platform-final-publish-orchestrator.mjs --preflight \
  --content-unit scripts/fixtures/dual_platform_content_unit.t1_lifestyle_inflation.v3_2.ready.v1.json \
  --publish-ledger <invalid-json-ledger>
```

Observed:

- `publishLedgerBridge.readOk: false`
- `publishLedgerBridge.readFailReason: "invalid_json"`
- but `preflight.preflightOk: true`

This is unsafe because operator tooling may treat `preflightOk:true` as ready even though the durable duplicate ledger cannot be trusted. Live mode does fail closed before credential resolution, but preflight must also report not-ready when an explicit publish ledger path is supplied and read fails.

## Required Fix

Update the bridge behavior so that:

- If `--publish-ledger <path>` is supplied and ledger read fails, `--preflight` reports `preflightOk:false`.
- The preflight output includes a clear non-secret reason/flag, for example:
  - `publishLedgerBridge.readOk:false`
  - `publishLedgerBridge.readFailReason:<reason>`
  - `preflight.publishLedgerReadOk:false`
  - `preflight.publishLedgerReadFailureBlocksReadiness:true`
  - or equivalent clear fields.
- `--live` / `--arm` behavior remains unchanged:
  - invalid ledger → `BLOCKED_PUBLISH_LEDGER_READ_FAILED` exit 3
  - gate 5 credential resolution not reached
  - side-effect counters 0
- Missing ledger file still means empty ledger ok and must not block preflight.
- No ledger path supplied keeps existing behavior unchanged.
- Matching ledger record still additive duplicate block.
- No ledger write/mutation.

## Likely Editable Files

- `scripts/run-dual-platform-final-publish-orchestrator.mjs`
- `scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
- `scripts/fixtures/dual_platform_final_publish_orchestrator.v1.json` if contract text needs updating
- `docs/dual-platform-final-publish-orchestrator.md`
- `docs/owner-daily-automation-runbook.md` if runbook wording needs updating
- `_ai/CLAUDE_REPORT.md`

Optional:

- `scripts/check-owner-daily-automation-entrypoint-static.mjs` only if owner preflight summary contract changes.
- `scripts/run-owner-daily-automation-entrypoint.mjs` only if owner preflight summary needs to surface the new readiness flag.

Do not touch unrelated files.

## Forbidden

- `.env`, `.env.*`, `.env.local`, secret files read/write/print
- credential value, length, prefix, suffix, hash, masked output
- Instagram/YouTube API/OAuth/upload
- Vercel Blob put/list/head/delete/copy
- ledger write/mutation
- ffmpeg/new media
- dependency/lockfile/deploy
- commit/push

## Required Checks

Run:

- `node --check scripts/run-dual-platform-final-publish-orchestrator.mjs`
- `node --check scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
- `node scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
- `node scripts/check-publish-ledger-static.mjs`

If owner entrypoint or owner guard changes:

- `node --check scripts/run-owner-daily-automation-entrypoint.mjs`
- `node --check scripts/check-owner-daily-automation-entrypoint-static.mjs`
- `node scripts/check-owner-daily-automation-entrypoint-static.mjs`

Required runtime regression cases:

1. Preflight + invalid ledger:
   - `publishLedgerBridge.readOk:false`
   - `preflight.preflightOk:false`
   - clear ledger-read-failure readiness reason/flag
   - no credential/API/side effect
2. Preflight + missing ledger:
   - `publishLedgerBridge.readOk:true`
   - `publishLedgerBridge.existed:false`
   - no preflight failure from ledger
3. Live + invalid ledger:
   - unchanged `BLOCKED_PUBLISH_LEDGER_READ_FAILED` exit 3 before credential
4. No ledger path:
   - existing default behavior unchanged

## Final Handoff Required

Return concise Korean handoff:

- task id
- changed files
- fix summary
- exact preflight invalid-ledger result after fix
- checks/results
- side effects confirmation
- env/secret handling confirmation
- deviations/risks
- checkpoint recommendation
- 전체프로젝트 진행률 : 약 95%

Stop after final handoff. Do not commit. Do not push.

