# HANDOFF_NOW

## Absolute Rules Pointer

- 최우선 source of truth: `AGENTS.md` + 이 파일.
- Codex = BRAIN AI, Claude Code = ACTION AI.
- Claude Code는 이 파일의 승인 범위 안에서만 실행하고, 완료 후 Codex 인수인계 형식으로 멈춘다.

## Current Approved Slice

- Task ID: `stable-public-media-url-layer-v1`
- Status: **Owner asked Codex to choose and set the most stable path for sustained use, solving the public mp4 URL problem step by step instead of deferring it.**
- Owner intent captured from chat:
  - `지속적인 사용에 제일 안정적인 경로로 너가 설정해줘`
  - `되는걸 문제해결을 나중에 하려하지말고 하나씩 풀어가면서 완성하는게 더 완성도 있고 속도도 빠르지 않을까?`

## Strategic Direction

For sustained use, do **not** make repo `public/` static mp4 + site redeploy the default path.

Set the durable default architecture to:

1. A dedicated public media origin under the product domain, preferably `https://media.buildgongjakso.com/...`.
2. Object storage/CDN for generated mp4 files.
3. A deterministic media key/path scheme per generated short.
4. A pre-upload verifier that requires:
   - HTTPS URL,
   - allowed media host,
   - HTTP 2xx or 206,
   - `Content-Type` starts with `video/` or exact accepted mp4 type,
   - not `text/html`,
   - unauthenticated access,
   - stable direct URL suitable for Instagram `video_url`.
5. Instagram upload runner must consume only a verified public mp4 URL from this media layer.

The previous one-off fallback remains valid only for emergency/manual sample work:

- Copy mp4 into repo `public/`.
- Deploy site.
- Validate direct mp4 URL.

But that fallback is **not** the sustained operating path because it couples every video publication to git/deploy and can bloat the repo.

## Current State

- Branch: `codex/source-first-blueprint-clean`, latest checkpoint `4b0faf7 feat(golden-sample): prepare live instagram upload runner`, ahead 186, not pushed.
- Live Instagram upload runner/plan/static guard exists and is checkpointed.
- Latest live upload attempt status:
  - upload executed: 0
  - Instagram API calls: 0
  - credential/env reads: 0
  - external network requests by Claude: 0
  - blocker: `BLOCKED_AUTO_MODE_PERMISSION_LIVE_CHAIN`
- Existing direct upload runner currently expects a verified public mp4 URL and remains fail-closed.
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

Create the stable public media URL layer needed for repeated Instagram uploads, without performing live upload, deployment, DNS changes, storage provisioning, or secret reads in this slice.

This slice must solve the architectural blocker by making the repo express:

1. which public media URL strategy is the default,
2. which fallback is allowed for one-off samples,
3. what exact gates must pass before Instagram upload,
4. how later external setup should plug in without broad secret reads or platform drift,
5. how the existing live Instagram upload runner should depend on a verified media URL instead of ad hoc public URL guessing.

## Source Contracts To Read

Read only the minimum needed:

1. `AGENTS.md`
2. this file
3. `scripts/fixtures/golden_sample_v3_2_live_instagram_upload_run_plan.t1_lifestyle_inflation.v1.json`
4. `scripts/run-golden-sample-v3-2-instagram-upload-once.mjs`
5. `scripts/check-golden-sample-v3-2-live-instagram-upload-run-static.mjs`
6. Existing package/config files only if needed to avoid dependency or module-style mistakes:
   - `package.json`
   - `tsconfig.json` or existing script style references

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

1. `docs/public-media-url-strategy.md` (new)
   - Define the chosen sustained strategy:
     - default: dedicated media origin `media.buildgongjakso.com` backed by object storage/CDN,
     - fallback: repo `public/` static mp4 + deploy only for one-off/manual sample recovery,
     - not default: committing every generated mp4 to repo.
   - Include provider-neutral requirements so the project can use Vercel Blob, Cloudflare R2, S3-compatible storage, or another approved object store later.
   - Document exact gates before Instagram upload.
   - Document external actions requiring Owner approval:
     - DNS/custom domain,
     - storage provider provisioning,
     - env/secret configuration,
     - deployment,
     - live URL liveness check,
     - Instagram `--arm` upload.
   - Do not include secret values.

2. `scripts/fixtures/stable_public_media_url_strategy.v1.json` (new)
   - Machine-readable strategy contract.
   - Must set default media host to `media.buildgongjakso.com`.
   - Must keep `www.buildgongjakso.com` static `public/` fallback marked as fallback/manual, not sustained default.
   - Must require video URL verifier gates:
     - HTTPS,
     - allowed host,
     - 2xx or 206,
     - video/mp4 or `video/*`,
     - reject `text/html`,
     - unauthenticated access,
     - no redirect to HTML/login.
   - Must record forbidden behavior:
     - live upload without verified URL,
     - broad env read,
     - YouTube/Supabase/DB/deploy side effects in this slice,
     - storing generated mp4s in git as the sustained path,
     - secret logging.

3. `scripts/check-stable-public-media-url-strategy-static.mjs` (new)
   - Dependency-free static guard.
   - Import only `node:fs`, `node:path`, `node:url` unless a `node:` builtin is truly justified.
   - Validate the docs/fixture contract.
   - Include fail-closed mutants for:
     - default host drift away from `media.buildgongjakso.com`,
     - making repo `public/` static mp4 the sustained default,
     - allowing `text/html`,
     - allowing non-HTTPS URL,
     - allowing upload without verified URL,
     - allowing broad `.env.local` parsing,
     - allowing YouTube/Supabase/DB/deploy side effects in this slice,
     - allowing secret logging,
     - removing Owner approval requirements for DNS/storage/env/deploy/live upload.

4. Optional minimal patch to `scripts/run-golden-sample-v3-2-instagram-upload-once.mjs`
   - Only if needed to reference the stable media strategy fixture or make future URL sourcing clearer.
   - Must preserve all current fail-closed upload gates, cap=1, Instagram-only behavior, and secret protections.
   - Must not run live URL checks, read env, or upload.

5. Optional minimal patch to `scripts/check-golden-sample-v3-2-live-instagram-upload-run-static.mjs`
   - Only if runner changes require static guard alignment.

6. `_ai/CLAUDE_REPORT.md`
   - Append concise reusable evidence.

Avoid modifying:

- `app/api/upload/route.ts`
- `lib/upload-hard-block.ts`
- `lib/instagram.ts` unless a read-only discovery reveals a tiny reference-only change is truly necessary; default is no modification.
- DB/Supabase generation status code.
- YouTube upload code.
- render/mux/TTS/image/browser runners.
- dependency/lockfiles.

## Required Execution Order

1. `git status -sb`.
2. Inspect the existing live Instagram runner/guard enough to preserve its fail-closed contract.
3. Create the docs strategy contract.
4. Create the machine-readable strategy fixture.
5. Create the static guard with fail-closed mutants.
6. Optionally make a minimal runner/guard reference patch only if it improves future integration without adding live side effects.
7. Run required checks.
8. Append `_ai/CLAUDE_REPORT.md`.
9. Stop. No commit/push.

## Required Checks

1. `git status -sb`
2. `node --check scripts/check-stable-public-media-url-strategy-static.mjs`
3. JSON parse for `scripts/fixtures/stable_public_media_url_strategy.v1.json`
4. `node scripts/check-stable-public-media-url-strategy-static.mjs`
5. Regression:
   - `node scripts/check-golden-sample-v3-2-live-instagram-upload-run-static.mjs`

Do not run full build unless syntax/import issues require it.

## Forbidden

- Live Instagram upload.
- Instagram credential/env read.
- Broad `.env.local` parsing.
- Public URL network/liveness checks.
- Storage provisioning or object upload.
- DNS/custom domain changes.
- Deploy/Vercel deploy.
- Supabase hosting/upload generation.
- DB status update.
- YouTube client/import/credential.
- render/mux/TTS/image/browser regeneration.
- Dependency/lockfile/font changes.
- Commit/push.
- Secret logging or storing secret values in docs/fixtures/reports.
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

Stop and report without editing further if:

- implementing this requires choosing a real paid/external storage provider account,
- DNS or Vercel project configuration must be changed now,
- secrets/env values must be read or written,
- dependency installation is required,
- live network checks are needed to validate the slice,
- protected dirty files must be modified to proceed.

## Definition Of Done

- Durable default public media strategy is documented.
- Machine-readable strategy fixture exists.
- Static guard exists and passes with fail-closed mutants.
- Existing live Instagram runner remains fail-closed and regression guard passes.
- No external live action, secret read, deploy, DNS, storage upload, DB/Supabase, YouTube, render/mux/TTS/image/browser, dependency, commit, or push occurred.
- `_ai/CLAUDE_REPORT.md` records concise evidence and recommended next slice.

전체프로젝트 진행률 : 약 92%
