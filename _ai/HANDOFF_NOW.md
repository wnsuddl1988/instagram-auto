# HANDOFF_NOW

## Absolute Rules Pointer

- 최우선 source of truth: `AGENTS.md` + 이 파일.
- Codex = BRAIN AI, Claude Code = ACTION AI.
- Claude Code는 이 파일의 승인 범위 안에서만 실행하고, 완료 후 Codex 인수인계 형식으로 멈춘다.

## Current Approved Slice

- Task ID: `r2-provisioning-preflight-dns-zone-check-v1`
- Status: **Owner accepted checkpoint `398456a` and approved moving toward R2 provisioning, but required DNS/zone preflight confirmation and report before any actual provisioning action.**
- Exact Owner approval:
  - `APPROVE_R2_PROVISIONING: checkpoint 398456a accepted. buildgongjakso-media bucket 생성, media.buildgongjakso.com R2 public bucket custom domain 연결 준비, 최소권한 R2 API token 생성 준비를 승인한다. 단, 실행 전 Codex/Claude는 먼저 buildgongjakso.com이 Cloudflare zone인지, partial CNAME setup이 필요한지, DNS record 추가 위치가 어디인지 확인하고 보고해야 한다. env/secret 값 write, deploy, object upload, live liveness check, Instagram --arm은 아직 별도 승인.`

## Current State

- Branch: `codex/source-first-blueprint-clean`, latest checkpoint `398456a feat(media): prepare r2 provisioning approval packet`, ahead 189, not pushed.
- Stable media strategy is checkpointed:
  - sustained default: `https://media.buildgongjakso.com/...`
  - backing: object storage/CDN
  - fallback only: repo `public/` mp4 + deploy under `www.buildgongjakso.com`
- Provider decision is checkpointed:
  - primary: Cloudflare R2
  - fallback: Vercel Blob
  - tertiary: S3-compatible
- R2 provisioning approval packet is checkpointed:
  - proposed bucket: `buildgongjakso-media`
  - custom domain: `media.buildgongjakso.com`
  - env names only: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`, `PUBLIC_MEDIA_BASE_URL`
- Live Instagram upload remains not executed:
  - upload 0
  - Instagram API 0
  - credential/env read 0
  - public URL liveness against generated mp4 0
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

Before any real R2 provisioning, perform a read-only preflight to answer the Owner's required questions:

1. Is `buildgongjakso.com` currently a Cloudflare zone, as inferred from public DNS/NS evidence or safe read-only dashboard/CLI evidence?
2. Is a Cloudflare partial CNAME setup likely required for `media.buildgongjakso.com`?
3. Where should the DNS record for `media.buildgongjakso.com` be added or changed?
4. Based on those answers, is it safe to proceed to the real R2 bucket/custom-domain/token provisioning slice, or is an Owner dashboard action required first?

This slice is **preflight/report only**. It must not create buckets, tokens, DNS records, env values, deployments, objects, liveness checks against generated mp4 URLs, or Instagram uploads.

## Allowed Discovery

Allowed read-only checks:

- Public DNS inspection for `buildgongjakso.com`, `www.buildgongjakso.com`, and `media.buildgongjakso.com`, such as:
  - NS records,
  - CNAME/A records,
  - registrar/DNS provider hints available from public DNS,
  - whether current NS appears Cloudflare-managed.
- Read-only local project evidence:
  - `.vercel/project.json` if present,
  - `vercel.json`,
  - package/config hints,
  - existing committed media strategy/provider/R2 docs and fixtures.
- Read-only Vercel CLI/project/domain listing only if already authenticated and non-mutating.
- Official docs references for Cloudflare R2 public bucket custom domains and partial CNAME setup.

Disallowed discovery:

- Cloudflare login, dashboard mutation, API mutation, account creation, bucket creation, token creation, or any paid/provisioning action.
- Reading or printing secret/env values.
- Broad `.env.local` parsing.
- Network check of a generated mp4 public URL for liveness.
- Any action that changes DNS, Vercel, Cloudflare, git remote, deployments, storage, DB, or social platforms.

## Source Contracts To Read

Read only the minimum needed:

1. `AGENTS.md`
2. this file
3. `docs/r2-provisioning-approval-packet.md`
4. `scripts/fixtures/r2_provisioning_approval_packet.v1.json`
5. `docs/media-provider-decision-packet.md`
6. `scripts/fixtures/media_provider_decision_packet.v1.json`
7. `docs/public-media-url-strategy.md`
8. `scripts/fixtures/stable_public_media_url_strategy.v1.json`
9. `package.json`
10. Project deployment/config hints if needed:
   - `.vercel/project.json`
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

1. `docs/r2-dns-zone-preflight-report.md` (new)
   - Must answer the 4 Purpose questions.
   - Must include raw but non-secret evidence summaries for:
     - `buildgongjakso.com` NS/DNS provider evidence,
     - `www.buildgongjakso.com` current record evidence,
     - `media.buildgongjakso.com` current record evidence, if any,
     - local Vercel project/domain evidence if used.
   - Must classify the DNS path as one of:
     - `CLOUDFLARE_ZONE_CONFIRMED`,
     - `PARTIAL_CNAME_SETUP_LIKELY`,
     - `DNS_PROVIDER_UNCLEAR_OWNER_DASHBOARD_REQUIRED`,
     - `BLOCKED_NO_SAFE_READONLY_EVIDENCE`.
   - Must recommend the next Owner approval or dashboard action.
   - Must not include secret values.

2. `scripts/fixtures/r2_dns_zone_preflight_report.v1.json` (new)
   - Machine-readable preflight report.
   - Must include:
     - `taskId`,
     - `status`,
     - `domain`,
     - `customDomain`,
     - `dnsClassification`,
     - evidence entries,
     - next recommended gate,
     - forbidden behavior confirmation,
     - whether actual provisioning was executed (`false`).

3. `scripts/check-r2-dns-zone-preflight-report-static.mjs` (new)
   - Dependency-free static guard.
   - Import only `node:fs`, `node:path`, `node:url` unless a `node:` builtin is truly justified.
   - Validate docs/fixture contract and no-mutation boundary.
   - Include fail-closed mutants for:
     - missing domain/custom domain,
     - missing classification,
     - classification outside allowlist,
     - evidence missing,
     - actual provisioning executed true,
     - allowing bucket/token/DNS/env/deploy/upload/liveness/Instagram in this slice,
     - missing next recommended gate,
     - secret logging allowed.

4. `_ai/CLAUDE_REPORT.md`
   - Append concise reusable evidence.

5. `_ai/HANDOFF_NOW.md`
   - Status update only if needed.

Avoid modifying:

- Existing upload runner/guard.
- Stable media strategy docs/fixture/guard.
- Provider decision docs/fixture/guard.
- R2 provisioning approval packet docs/fixture/guard unless a tiny reference patch is necessary.
- App runtime code.
- DB/Supabase generation status code.
- YouTube upload code.
- render/mux/TTS/image/browser runners.
- dependency/lockfiles.

## Required Execution Order

1. `git status -sb`.
2. Read source contracts.
3. Run only read-only DNS/project evidence checks.
4. If any CLI prompts for login, provisioning, mutation, or secret access, stop that check and record it as unavailable.
5. Create DNS/zone preflight report markdown.
6. Create machine-readable preflight fixture.
7. Create static guard with fail-closed mutants.
8. Run required checks.
9. Append `_ai/CLAUDE_REPORT.md`.
10. Stop. No commit/push.

## Required Checks

1. `git status -sb`
2. `node --check scripts/check-r2-dns-zone-preflight-report-static.mjs`
3. JSON parse for `scripts/fixtures/r2_dns_zone_preflight_report.v1.json`
4. `node scripts/check-r2-dns-zone-preflight-report-static.mjs`
5. Regression:
   - `node scripts/check-r2-provisioning-approval-packet-static.mjs`
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

- confirming the DNS/zone path requires Cloudflare secret values or mutation,
- a CLI requests login, provisioning, browser auth, token creation, or mutation,
- public DNS evidence is contradictory or insufficient,
- dependency installation is required,
- protected dirty files must be modified to proceed.

## Definition Of Done

- DNS/zone preflight markdown report exists.
- Machine-readable preflight fixture exists.
- Static guard exists and passes with fail-closed mutants.
- R2 provisioning/provider/stable media regression guards pass.
- Report clearly states whether `buildgongjakso.com` appears Cloudflare-managed, whether partial CNAME is likely, and where DNS record changes should occur.
- No Cloudflare login, provisioning, bucket/token creation, DNS change, env/secret write, deploy, object upload, live URL check against generated mp4, Instagram upload, YouTube/Supabase/DB, render/mux/TTS/image/browser, dependency, commit, or push occurred.
- `_ai/CLAUDE_REPORT.md` records concise evidence and recommended next slice.

전체프로젝트 진행률 : 약 92%
