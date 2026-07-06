# HANDOFF_NOW

## Absolute Rules Pointer

- 최우선 source of truth: `AGENTS.md` + 이 파일.
- Codex = BRAIN AI, Claude Code = ACTION AI.
- Claude Code는 이 파일의 승인 범위 안에서만 실행하고, 완료 후 Codex 인수인계 형식으로 멈춘다.

## Current Approved Slice

- Task ID: `r2-primary-provisioning-approval-packet-v1`
- Status: **Owner accepted checkpoint `54b1a3a` and confirmed Cloudflare R2 as the primary sustained media provider. This slice prepares the provisioning approval packet only.**
- Exact Owner approval:
  - `APPROVE_R2_PRIMARY_PREPARE_PROVISIONING_PACKET: checkpoint 54b1a3a accepted. Cloudflare R2를 media.buildgongjakso.com sustained provider primary로 확정한다. Codex/Claude는 no-secret/no-provisioning 범위에서 R2 bucket, custom domain, token/env 이름, DNS, rollback, 검증 순서를 담은 provisioning approval packet을 준비하라. 실제 bucket/token/DNS/env/deploy/object upload/live check/Instagram --arm은 아직 금지.`

## Current State

- Branch: `codex/source-first-blueprint-clean`, latest checkpoint `54b1a3a feat(media): choose r2 public media provider path`, ahead 188, not pushed.
- Stable media strategy is checkpointed:
  - sustained default: `https://media.buildgongjakso.com/...`
  - backing: object storage/CDN
  - fallback only: repo `public/` mp4 + deploy under `www.buildgongjakso.com`
- Provider decision is checkpointed:
  - primary: Cloudflare R2
  - fallback: Vercel Blob
  - tertiary: S3-compatible
- Live Instagram upload remains not executed:
  - upload 0
  - Instagram API 0
  - credential/env read 0
  - public URL liveness 0
- Known protected/excluded dirty files must remain untouched unless explicitly in scope:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - unrelated `output/`
  - unrelated `C:\tmp`

## Purpose

Prepare a no-secret/no-provisioning R2 provisioning approval packet that tells the Owner exactly what must be approved next to make `https://media.buildgongjakso.com/...` a real direct mp4 origin.

This packet must define:

1. the proposed R2 bucket naming and object key policy,
2. the custom domain plan for `media.buildgongjakso.com`,
3. token/env variable names needed later, names only, no values,
4. DNS/zone prerequisites and unknowns,
5. rollback/disable plan,
6. verification order before any Instagram upload,
7. exact future Owner approval wording for the real provisioning slice.

This slice must perform **no bucket creation, no token creation, no DNS change, no env/secret write, no deploy, no object upload, no live URL check, and no Instagram upload**.

## Official Source Pointers

Use only official docs or already-committed project evidence. Relevant official docs:

- Cloudflare R2 public buckets/custom domains:
  - `https://developers.cloudflare.com/r2/buckets/public-buckets/`
  - Key points from docs already verified by Codex:
    - public buckets expose R2 bucket contents to the Internet only with explicit user permission,
    - custom domain under the Owner's control is a supported public bucket path,
    - `r2.dev` is for non-production use,
    - domain must be added as a Cloudflare zone in the same account as the R2 bucket,
    - if the domain is not managed by Cloudflare, partial CNAME setup may be required,
    - custom domain connection adds/reviews a DNS record and then becomes active after status transition.
- Cloudflare R2 API/authentication/token docs:
  - `https://developers.cloudflare.com/r2/api/tokens/`
- Existing project evidence:
  - `docs/public-media-url-strategy.md`
  - `docs/media-provider-decision-packet.md`
  - `scripts/fixtures/stable_public_media_url_strategy.v1.json`
  - `scripts/fixtures/media_provider_decision_packet.v1.json`

## Source Contracts To Read

Read only the minimum needed:

1. `AGENTS.md`
2. this file
3. `docs/public-media-url-strategy.md`
4. `docs/media-provider-decision-packet.md`
5. `scripts/fixtures/stable_public_media_url_strategy.v1.json`
6. `scripts/fixtures/media_provider_decision_packet.v1.json`
7. `scripts/check-stable-public-media-url-strategy-static.mjs`
8. `scripts/check-media-provider-decision-packet-static.mjs`
9. `package.json`
10. Project deployment/config hints if needed:
   - `vercel.json`
   - `next.config.*`
   - `.gitignore`

Do not read protected/excluded files unless unavoidable:

- `_ai/CODEX_REVIEW.md`
- `_ai/NEXT_ACTION.md`
- `_ai/PROJECT_STATE.md`
- `_ai/CONTEXT_TRANSFER_CODEX.md`
- `piq_diag_out.txt`
- `scripts/render-golden-sample-visual-only-v1.mjs`
- `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- unrelated `output/`
- unrelated `C:\tmp`

## Scope

Allowed repo files:

1. `docs/r2-provisioning-approval-packet.md` (new)
   - Must be a no-live Owner approval packet.
   - Must recommend concrete, stable names:
     - proposed bucket name, e.g. `buildgongjakso-media` or similarly conservative,
     - custom domain: `media.buildgongjakso.com`,
     - deterministic object key prefix inherited from media strategy.
   - Must document R2 setup steps at approval-packet level:
     1. Cloudflare account/zone prerequisite check,
     2. bucket creation,
     3. public bucket custom domain connection,
     4. R2 API token creation with least necessary scope,
     5. env/secret configuration by names only,
     6. code integration slice,
     7. deploy,
     8. controlled object upload test,
     9. public URL verifier check,
     10. Instagram `--arm` approval.
   - Must record unknowns that require Owner/Cloudflare dashboard confirmation:
     - whether `buildgongjakso.com` is already a Cloudflare zone,
     - whether partial CNAME setup is needed,
     - final Cloudflare account ID,
     - final bucket name if Owner prefers a different one.
   - Must include rollback:
     - disable domain access,
     - remove custom domain connection,
     - revoke token,
     - remove env values,
     - stop uploader path,
     - fallback to one-off repo `public/` path only if explicitly approved.
   - Must include exact future approval snippets:
     - provisioning approval,
     - DNS/custom domain approval,
     - env/secret write approval,
     - code integration approval,
     - deploy approval,
     - object upload/live liveness approval,
     - Instagram `--arm` approval.
   - Must not include secret values.

2. `scripts/fixtures/r2_provisioning_approval_packet.v1.json` (new)
   - Machine-readable approval packet.
   - Must preserve:
     - provider: `cloudflare_r2`,
     - sustained host: `media.buildgongjakso.com`,
     - no-live status for this slice.
   - Must include:
     - proposed bucket name,
     - custom domain,
     - object key prefix/pattern,
     - required env names only:
       - `R2_ACCOUNT_ID`
       - `R2_ACCESS_KEY_ID`
       - `R2_SECRET_ACCESS_KEY`
       - `R2_BUCKET`
       - `R2_ENDPOINT`
       - `PUBLIC_MEDIA_BASE_URL`
     - approval gates for provisioning/DNS/env/code/deploy/object upload/liveness/Instagram arm,
     - rollback steps,
     - forbidden behavior,
     - official docs refs.

3. `scripts/check-r2-provisioning-approval-packet-static.mjs` (new)
   - Dependency-free static guard.
   - Import only `node:fs`, `node:path`, `node:url` unless a `node:` builtin is truly justified.
   - Validate docs/fixture contract and no-live boundary.
   - Include fail-closed mutants for:
     - provider drift away from `cloudflare_r2`,
     - sustained host drift away from `media.buildgongjakso.com`,
     - missing bucket proposal,
     - missing custom domain,
     - env names missing or containing values,
     - missing provisioning approval gate,
     - missing DNS approval gate,
     - missing env/secret approval gate,
     - missing object upload/live liveness approval gate,
     - missing Instagram arm approval gate,
     - allowing bucket/token/DNS/env/deploy/upload/liveness/Instagram in this slice,
     - missing rollback steps,
     - secret logging allowed.

4. `_ai/CLAUDE_REPORT.md`
   - Append concise reusable evidence.

5. `_ai/HANDOFF_NOW.md`
   - Status update only if needed.

Avoid modifying:

- Existing upload runner/guard.
- Stable media strategy docs/fixture/guard.
- Provider decision docs/fixture/guard unless a tiny reference patch is necessary.
- App runtime code.
- DB/Supabase generation status code.
- YouTube upload code.
- render/mux/TTS/image/browser runners.
- dependency/lockfiles.

## Required Execution Order

1. `git status -sb`.
2. Read source contracts.
3. Use official Cloudflare docs only as reference; do not log in or mutate Cloudflare.
4. Create R2 provisioning approval packet markdown.
5. Create machine-readable R2 provisioning fixture.
6. Create static guard with fail-closed mutants.
7. Run required checks.
8. Append `_ai/CLAUDE_REPORT.md`.
9. Stop. No commit/push.

## Required Checks

1. `git status -sb`
2. `node --check scripts/check-r2-provisioning-approval-packet-static.mjs`
3. JSON parse for `scripts/fixtures/r2_provisioning_approval_packet.v1.json`
4. `node scripts/check-r2-provisioning-approval-packet-static.mjs`
5. Regression:
   - `node scripts/check-media-provider-decision-packet-static.mjs`
   - `node scripts/check-stable-public-media-url-strategy-static.mjs`

Do not run full build unless syntax/import issues require it.

## Forbidden

- Cloudflare login, account mutation, provider provisioning.
- R2 bucket creation.
- R2 token creation.
- DNS/custom domain changes.
- Env/secret write.
- Reading or printing secret values.
- Deploy/Vercel deploy.
- Object upload.
- Public URL liveness network check against generated mp4 URLs.
- Live Instagram upload or Instagram `--arm`.
- Instagram credential/env read.
- Broad `.env.local` parsing.
- YouTube client/import/credential.
- Supabase hosting/upload generation.
- DB status update.
- render/mux/TTS/image/browser execution or regeneration.
- Dependency/lockfile/font changes.
- Commit/push.
- Modifying protected/excluded files:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - unrelated `output/`
  - unrelated `C:\tmp`

## Stop Conditions

Stop and report if:

- official Cloudflare docs conflict with the packet assumptions,
- a real Cloudflare account/bucket/token/DNS state must be queried to continue,
- secret/env values must be read or written,
- dependency installation is required,
- protected dirty files must be modified to proceed,
- preparing the packet would require actually provisioning or paying now.

## Definition Of Done

- R2 provisioning approval packet markdown exists.
- Machine-readable R2 provisioning fixture exists.
- Static guard exists and passes with fail-closed mutants.
- Provider decision and stable public media strategy regression guards pass.
- Future approval snippets are clear and separated.
- No Cloudflare login, provisioning, bucket/token creation, DNS, env/secret write, deploy, object upload, live URL check, Instagram upload, YouTube/Supabase/DB, render/mux/TTS/image/browser, dependency, commit, or push occurred.
- `_ai/CLAUDE_REPORT.md` records concise evidence and recommended next slice.

전체프로젝트 진행률 : 약 92%
