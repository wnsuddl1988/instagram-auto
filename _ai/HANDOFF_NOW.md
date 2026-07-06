# HANDOFF_NOW

## Absolute Rules Pointer

- 최우선 source of truth: `AGENTS.md` + 이 파일.
- Codex = BRAIN AI, Claude Code = ACTION AI.
- Claude Code는 이 파일의 승인 범위 안에서만 실행하고, 완료 후 Codex 인수인계 형식으로 멈춘다.

## Current Approved Slice

- Task ID: `media-provider-discovery-decision-packet-v1`
- Status: **Owner approved no-secret/no-provisioning discovery to choose the best provider path for the sustained public media origin.**
- Exact Owner approval:
  - `APPROVE_MEDIA_PROVIDER_DISCOVERY: sustained default는 media.buildgongjakso.com + object storage/CDN로 유지한다. Codex/Claude는 no-secret/no-provisioning 범위에서 현재 프로젝트와 계정 상태를 조사해 Vercel Blob, Cloudflare R2, S3-compatible 중 최적 provider와 DNS/env/deploy 순서를 결정하는 decision packet을 준비하라. storage provisioning, DNS 변경, env/secret write, deploy, upload, Instagram --arm 실행은 아직 금지.`

## Current State

- Branch: `codex/source-first-blueprint-clean`, latest checkpoint `44a60da feat(media): define stable public media url strategy`, ahead 187, not pushed.
- Stable media strategy is checkpointed:
  - sustained default: `https://media.buildgongjakso.com/...`
  - backing: object storage/CDN
  - fallback only: repo `public/` mp4 + deploy under `www.buildgongjakso.com`
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

Prepare a no-live provider decision packet that chooses the most stable implementation path among:

1. Vercel Blob,
2. Cloudflare R2,
3. S3-compatible object storage.

The packet must recommend the provider/order for this project and define the future DNS/env/deploy sequence, while performing **no provisioning, no secret writes, no deploy, no storage upload, no live URL check, and no Instagram upload**.

## Discovery Rules

- Prefer official documentation and current local project evidence.
- If using web or CLI account/project reads, keep them read-only.
- Do not expose, print, copy, or write secret values.
- Do not install dependencies.
- Do not create provider accounts, buckets, tokens, DNS records, projects, or deployments.
- If a CLI requests login, token, browser auth, provisioning, paid plan confirmation, or mutation, stop that path and record it as unavailable in no-secret discovery.
- It is allowed to inspect non-secret project configuration such as package/config files and read-only CLI listings if already authenticated and non-mutating.
- It is allowed to record provider-specific env var names that will be needed later, but not values.

## Source Contracts To Read

Read only the minimum needed:

1. `AGENTS.md`
2. this file
3. `docs/public-media-url-strategy.md`
4. `scripts/fixtures/stable_public_media_url_strategy.v1.json`
5. `scripts/check-stable-public-media-url-strategy-static.mjs`
6. `package.json`
7. Project deployment/config hints if present:
   - `vercel.json`
   - `next.config.*`
   - `.gitignore`
   - relevant `app/`, `lib/`, or `scripts/` files only if needed to assess integration shape

Optional read-only account/project state checks:

- `vercel ls` or equivalent read-only Vercel project listing if available and already authenticated.
- Read-only local git remote/config only if needed to understand deployment target.

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

1. `docs/media-provider-decision-packet.md` (new)
   - Compare Vercel Blob, Cloudflare R2, and S3-compatible storage for this project.
   - Use official-doc evidence where available.
   - Include current local project/account read-only evidence.
   - Recommend one primary provider and one fallback provider.
   - Define the exact future sequence:
     1. Owner selects provider.
     2. Provider provisioning approval.
     3. DNS/custom domain approval for `media.buildgongjakso.com`.
     4. Env/secret configuration approval.
     5. Code integration slice.
     6. Deploy approval.
     7. Live URL liveness approval.
     8. Instagram `--arm` approval.
   - Include risk notes and rollback path.
   - Do not include secret values.

2. `scripts/fixtures/media_provider_decision_packet.v1.json` (new)
   - Machine-readable decision packet.
   - Must preserve sustained default `media.buildgongjakso.com`.
   - Must include candidates: `vercel_blob`, `cloudflare_r2`, `s3_compatible`.
   - Must include chosen recommendation and rationale.
   - Must include future action sequence and approval gates.
   - Must include forbidden behavior for this slice:
     - storage provisioning,
     - DNS changes,
     - env/secret write,
     - deploy,
     - object upload,
     - public URL liveness network check,
     - Instagram upload,
     - YouTube/Supabase/DB/render/mux/TTS/image/browser side effects,
     - dependency/lockfile changes,
     - secret logging.

3. `scripts/check-media-provider-decision-packet-static.mjs` (new)
   - Dependency-free static guard.
   - Import only `node:fs`, `node:path`, `node:url` unless a `node:` builtin is truly justified.
   - Validate docs/fixture contract and no-live boundary.
   - Include fail-closed mutants for:
     - sustained host drift away from `media.buildgongjakso.com`,
     - missing candidate provider,
     - missing chosen recommendation,
     - missing approval gate for DNS,
     - missing approval gate for env/secret,
     - allowing provisioning in this slice,
     - allowing deploy in this slice,
     - allowing object upload in this slice,
     - allowing live URL check in this slice,
     - allowing Instagram upload in this slice,
     - allowing secret logging,
     - allowing dependency/lockfile changes.

4. `_ai/CLAUDE_REPORT.md`
   - Append concise reusable evidence.

5. `_ai/HANDOFF_NOW.md`
   - Status update only if needed.

Avoid modifying:

- Existing upload runner/guard.
- Stable media strategy docs/fixture/guard unless a tiny typo or reference patch is necessary.
- App runtime code.
- DB/Supabase generation status code.
- YouTube upload code.
- render/mux/TTS/image/browser runners.
- dependency/lockfiles.

## Required Execution Order

1. `git status -sb`.
2. Read source contracts.
3. Gather no-secret/no-provisioning evidence from local config and official docs.
4. Optionally run read-only account/project listing if already authenticated and non-mutating; stop if it asks for auth/provisioning.
5. Create decision packet markdown.
6. Create machine-readable decision fixture.
7. Create static guard with fail-closed mutants.
8. Run required checks.
9. Append `_ai/CLAUDE_REPORT.md`.
10. Stop. No commit/push.

## Required Checks

1. `git status -sb`
2. `node --check scripts/check-media-provider-decision-packet-static.mjs`
3. JSON parse for `scripts/fixtures/media_provider_decision_packet.v1.json`
4. `node scripts/check-media-provider-decision-packet-static.mjs`
5. Regression:
   - `node scripts/check-stable-public-media-url-strategy-static.mjs`

Do not run full build unless syntax/import issues require it.

## Forbidden

- Storage provisioning, bucket creation, token creation, account creation, provider mutation.
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

- provider comparison cannot be made without secret values,
- a read-only CLI attempts to mutate or prompts for login/provisioning,
- official docs cannot be checked and there is no reliable local evidence,
- dependency installation is required,
- protected dirty files must be modified to proceed,
- decision packet would require actually choosing or paying for a provider account now.

## Definition Of Done

- Provider decision packet markdown exists.
- Machine-readable decision fixture exists.
- Static guard exists and passes with fail-closed mutants.
- Stable public media strategy regression guard passes.
- Recommendation is clear: primary provider, fallback provider, future approval sequence, risks, rollback.
- No provisioning, DNS, env/secret write, deploy, object upload, live URL check, Instagram upload, YouTube/Supabase/DB, render/mux/TTS/image/browser, dependency, commit, or push occurred.
- `_ai/CLAUDE_REPORT.md` records concise evidence and recommended next slice.

전체프로젝트 진행률 : 약 92%
