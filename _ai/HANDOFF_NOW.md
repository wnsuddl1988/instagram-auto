# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `owner-usable-automation-entrypoint-no-live-v1`
- Owner request: "남은거 진행해. 실제로 프로젝트 사용해서 영상생성 및 배포 할 수 있게 해줘야지."
- Purpose: make the current project usable by the Owner through one clear local operator entrypoint that ties together the existing local generation dry-run, dual-platform publish preflight, and armed duplicate-guarded publish status. This slice is a no-live usability bridge, not a new content live run.

## Current Reality

- The dual-platform publish system is implemented and armed, but the current evidence content is duplicate-guarded:
  - Instagram evidence media_id: `17916511431199303`
  - YouTube evidence videoId: `r9jhckdpC9w`
  - Existing current content/version: `t1_lifestyle_inflation` / `v3_2`
  - `scripts/run-dual-platform-final-publish-orchestrator.mjs --live` blocks current content with `BLOCKED_DUPLICATE_ALREADY_PUBLISHED` before credential/API gates.
- Vercel Blob public URL liveness evidence exists for the Instagram source mp4:
  - `https://7iq7vppwlaha2vuo.public.blob.vercel-storage.com/instagram/reels/t1_lifestyle_inflation/instagram_reels_full_frame_1080x1920/v3_2/54957450ac10.mp4`
  - HEAD `200`, `video/mp4`, length `20294549`
  - Result file: `output/instagram-blob-url-liveness-no-arm-v1/result.json`
- Current UI `/money-shorts` is still a local/source-first workbench. It does not yet provide a single Owner-facing generation-to-publish workflow.
- Existing useful scripts:
  - `scripts/run-local-money-shorts-from-render-manifest.mjs`
  - `scripts/run-local-money-shorts-pipeline-dry-run.mjs`
  - `scripts/run-dual-platform-final-publish-orchestrator.mjs`
  - Static guards for these scripts already exist.

## Approved Scope

Claude Code may implement a no-live operator usability bridge:

1. Add a single local operator entrypoint script, suggested path:
   - `scripts/run-owner-daily-automation-entrypoint.mjs`

2. The entrypoint should support at least:
   - `--status`: run no-live readiness checks and print a concise JSON/operator summary.
   - `--dry-run`: run the existing local render-manifest dry-run pipeline using safe default fixtures unless explicit paths are provided.
   - `--preflight`: run the dual-platform publish orchestrator `--preflight`.
   - `--duplicate-guard-check`: optionally run the existing armed duplicate-guarded `--live` only after confirming the preflight says current content will be duplicate-blocked; it must treat exit `3` / `BLOCKED_DUPLICATE_ALREADY_PUBLISHED` as an expected blocked safety result, not as a successful publish.

3. The entrypoint must make the Owner-facing next steps obvious:
   - what command generates a local dry-run video packet,
   - what command checks publish readiness,
   - why current `t1_lifestyle_inflation/v3_2` will not be reposted,
   - what approval would be needed for a future new-content end-to-end live run.

4. Add or update a concise operator runbook, suggested path:
   - `docs/owner-daily-automation-runbook.md`
   The runbook must be practical and short: exact commands, expected outputs, what is safe, what is still blocked, and how future live run approval should be requested.

5. Add a dependency-free static guard, suggested path:
   - `scripts/check-owner-daily-automation-entrypoint-static.mjs`
   It must verify no secret/env direct access, no API/upload/deploy/new dependency behavior, safe child process usage, and the required modes/summary fields.

6. Optional package.json script additions are allowed only if they add convenience scripts without dependency/lockfile changes, for example:
   - `owner:status`
   - `owner:dry-run`
   Do not change dependencies or lockfile.

7. Append concise evidence to `_ai/CLAUDE_REPORT.md`.

## Forbidden Actions

- Do not access, read, edit, print, summarize, copy, stage, commit, or push `.env`, `.env.*`, `.env.local`, secret files, tokens, API keys, cookies, or credentials.
- Do not call Instagram API, YouTube API/OAuth/upload, Vercel Blob upload/list/delete/copy/head, OpenAI, ElevenLabs, Pexels, Supabase, browser/Chrome, deploy, DNS, or any paid/external live service.
- Do not create a new live content upload.
- Do not create new real media using live TTS/image/browser/API services.
- Do not modify dependencies, lockfiles, pnpm config, fonts, deploy config, or DB schema.
- Do not commit or push.
- Do not touch protected/excluded dirty files unless explicitly necessary and approved:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - `scripts/get-youtube-refresh-token-once.mjs`
  - `shadow-list.txt`

## Required Design Constraints

- Default mode must be no-live and fail-closed.
- No `process.env` access in the new operator script unless the mode is a future explicitly approved live mode; this slice should not add that.
- Child processes must use `spawnSync`/`execFileSync` with `shell:false` where practical.
- If the entrypoint invokes `--live`, it may do so only after parsing `--preflight` and confirming duplicate block for both existing platform keys. It must not run live for non-duplicate/new content.
- Output must be readable for the Owner and also include machine-readable JSON summary.
- All generated files from dry-run must stay under an explicitly chosen output path. Default output may be under `C:\tmp\money-shorts-os\owner-daily-automation-entrypoint-v1` or another path outside the repo.

## Required Checks

Run the focused checks below:

1. `git status -sb`
2. Syntax:
   - `node --check scripts/run-owner-daily-automation-entrypoint.mjs`
   - `node --check scripts/check-owner-daily-automation-entrypoint-static.mjs`
3. New static guard:
   - `node scripts/check-owner-daily-automation-entrypoint-static.mjs`
4. Operator smoke:
   - `node scripts/run-owner-daily-automation-entrypoint.mjs --status`
   - `node scripts/run-owner-daily-automation-entrypoint.mjs --preflight`
   - `node scripts/run-owner-daily-automation-entrypoint.mjs --duplicate-guard-check`
5. Targeted regressions:
   - `node scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
   - `node scripts/check-local-pipeline-runner-static.mjs`
   - `node scripts/check-render-manifest-local-runner-static.mjs`

Do not run full build unless a focused syntax/import issue requires it.

## Definition Of Done

- Owner has one clear local command/script to check the automation system and run the safe local dry-run path.
- The entrypoint proves the current already-published evidence will not be reposted.
- The runbook tells the Owner exactly how to use the current system and what approval is needed for future new-content live publish.
- New guard and targeted regressions pass.
- No secrets, external API calls, deploy, upload, dependency/lockfile changes, commit, or push.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- changed files
- operator commands added and what each does
- checks/results
- side effects confirmation
- deviations/risks
- whether checkpoint commit is recommended
- `전체프로젝트 진행률 : 약 95%`
