# HANDOFF_NOW

전체프로젝트 진행률 : 약 92%

## Current Task

- Task ID: `r2-bucket-provisioning-only-v1`
- Owner approval:
  - `APPROVE_R2_BUCKET_PROVISIONING_ONLY`
  - Checkpoint `8303c14` accepted.
  - Approved external action: create only the Cloudflare R2 bucket named exactly `buildgongjakso-media`.
- Purpose: provision the sustained media provider's empty R2 bucket only, while keeping DNS/custom domain/token/env/deploy/upload/live checks/Instagram fully blocked.

## Current Baseline

- Latest accepted checkpoint: `8303c14 feat(media): record r2 dns zone preflight`
- Branch was reported ahead 190 after that checkpoint; no push approved.
- DNS/zone preflight classification: `PARTIAL_CNAME_SETUP_LIKELY`
  - `buildgongjakso.com` authoritative NS = gabia, not Cloudflare.
  - apex and `www` are Vercel-backed.
  - `media.buildgongjakso.com` was NXDOMAIN.
- Sustained public media target remains:
  - host: `media.buildgongjakso.com`
  - provider primary: Cloudflare R2
  - bucket: `buildgongjakso-media`

## Approved Scope

Claude Code may do only the following:

1. Read the minimal current instructions and source-of-truth files:
   - `AGENTS.md`
   - `_ai/HANDOFF_NOW.md`
   - `docs/r2-dns-zone-preflight-report.md`
   - `scripts/fixtures/r2_dns_zone_preflight_report.v1.json`
   - `docs/r2-provisioning-approval-packet.md`
   - `scripts/fixtures/r2_provisioning_approval_packet.v1.json`
2. Check the current git status/diff hygiene without altering protected files.
3. If a safe, already-authenticated Cloudflare interface is available, create exactly one R2 bucket:
   - bucket name: `buildgongjakso-media`
   - no object upload
   - no public access setting
   - no custom domain
   - no DNS record
   - no API token
   - no env/secret read/write
4. If the bucket already exists in the active Owner Cloudflare account, do not mutate it; report `ALREADY_EXISTS_NO_MUTATION`.
5. Record the result in no-secret local evidence files:
   - `docs/r2-bucket-provisioning-result.md`
   - `scripts/fixtures/r2_bucket_provisioning_result.v1.json`
   - `scripts/check-r2-bucket-provisioning-result-static.mjs`
   - append `_ai/CLAUDE_REPORT.md`

## Hard Stop Conditions

Claude Code must stop immediately and report the matching blocker if any of these occur:

- `BLOCKED_CLOUDFLARE_AUTH_REQUIRED`: Cloudflare login, MFA, account selection uncertainty, or interactive auth is required.
- `BLOCKED_CLOUDFLARE_TOOL_UNAVAILABLE`: no safe authenticated Cloudflare UI/API/CLI path is available.
- `BLOCKED_SCOPE_EXPANSION_REQUIRED`: the interface requires custom domain, DNS, token, env, deploy, object upload, public access, or liveness work as part of bucket creation.
- `BLOCKED_SECRET_OR_ENV_REQUIRED`: any secret/env value must be read, created, printed, copied, or written.
- `BLOCKED_COST_OR_PLAN_CONFIRMATION_REQUIRED`: bucket creation requires a plan/payment/cost confirmation not explicitly covered by this approval.
- `BLOCKED_ACCOUNT_IDENTITY_UNCLEAR`: Claude cannot confidently tell it is operating in the intended Owner Cloudflare account without exposing secrets.

When blocked, do not attempt a workaround. Create a blocked result report/fixture if possible without external mutation or secret access.

## Forbidden Actions

- DNS changes, custom domain connection, partial CNAME setup, Cloudflare zone changes, gabia changes.
- R2 API token creation, access key creation, policy creation, permission grants.
- Env/secret reads or writes, including `.env.local` and hosting dashboard env values.
- Deploy, Vercel changes, Supabase/DB changes, YouTube, Instagram upload/`--arm`.
- Object upload, generated mp4 live liveness checks, curl/HEAD against generated media URLs.
- Render/mux/TTS/image/browser regeneration.
- Dependency, lockfile, font, broad config changes.
- Commit or push.
- Touching protected/excluded files unless explicitly required by this handoff:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - unrelated `output/`
  - unrelated `C:\tmp`

## Result Contract

The result fixture must be dependency-free JSON and must not contain secrets. It should distinguish:

- `CREATED_BUCKET`
- `ALREADY_EXISTS_NO_MUTATION`
- `BLOCKED_*`

Minimum result fields:

- `taskId`
- `approval`
- `provider`
- `bucketName`
- `allowedExternalMutation`
- `forbiddenExternalMutations`
- `status`
- `blockerCode` when blocked
- `evidenceSummary`
- `secretHandling`
- `nextApprovalRequired`

The static guard must fail closed if:

- the bucket name changes
- status vocabulary is broadened unsafely
- forbidden actions are missing
- token/env/DNS/custom domain/upload/liveness/Instagram are allowed
- result evidence includes secret-like values
- the checkpoint/progress/current approval is missing

## Required Checks

Run only targeted, no-secret checks:

1. `git status -sb`
2. Syntax check for the new guard:
   - `node --check scripts/check-r2-bucket-provisioning-result-static.mjs`
3. JSON parse for:
   - `scripts/fixtures/r2_bucket_provisioning_result.v1.json`
4. New guard:
   - `node scripts/check-r2-bucket-provisioning-result-static.mjs`
5. Regressions:
   - `node scripts/check-r2-dns-zone-preflight-report-static.mjs`
   - `node scripts/check-r2-provisioning-approval-packet-static.mjs`
   - `node scripts/check-media-provider-decision-packet-static.mjs`
   - `node scripts/check-stable-public-media-url-strategy-static.mjs`

If Cloudflare provisioning is blocked before creating the new result guard, still write a minimal no-secret blocked report/fixture/guard when safe.

## Final Handoff Format

Claude Code must stop after the final handoff. The handoff to Codex must include:

- task id
- bucket provisioning status: `CREATED_BUCKET`, `ALREADY_EXISTS_NO_MUTATION`, or `BLOCKED_*`
- whether Cloudflare external mutation occurred, exactly what changed, and what stayed forbidden
- changed files
- checks/results
- credential/env/secret handling
- deviations/risks
- checkpoint recommendation
- current progress line: `전체프로젝트 진행률 : 약 92%`
