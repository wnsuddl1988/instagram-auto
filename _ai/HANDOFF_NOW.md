# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `owner-entrypoint-repo-root-outdir-guard-commonize-v1`
- Latest checkpoint: `4cb215b feat(operator): prepare instagram blob uploads from requests`
- Purpose: apply the repo-root out-dir safety fix discovered in `--prepare-instagram-blob-upload` to the remaining owner entrypoint modes that still use `startsWith(REPO_ROOT + sep)` only and therefore may allow the repo root itself as an output directory.

## Why This Is Next

- Codex review found and fixed one concrete bug:
  - `--prepare-instagram-blob-upload --out-dir .` used to write `instagram-blob-upload-preflight.json` at repo root.
  - It is now fixed by `isRepoRootOrInside(absPath, repoRoot)`.
- `scripts/run-owner-daily-automation-entrypoint.mjs` still contains similar raw checks in other modes.
- Before allowing the real Blob upload slice, the Owner-facing daily entrypoint should consistently block repo root and repo-internal output paths for all local-output modes.

## Approved Scope

Claude Code may commonize repo-root/repo-inside output guard logic in the owner daily entrypoint only.

Allowed edits:

- `scripts/run-owner-daily-automation-entrypoint.mjs`
- `scripts/check-owner-daily-automation-entrypoint-static.mjs`
- `docs/owner-daily-automation-runbook.md` only if a small note is needed
- `_ai/CLAUDE_REPORT.md` concise append

Do not modify planner/executor scripts unless a direct import/export mismatch blocks the owner entrypoint. Prefer reusing the existing `isRepoRootOrInside` helper already exported by `scripts/prepare-instagram-blob-upload-from-request.mjs`.

## Required Behavior

1. Replace remaining raw repo-inside checks in `scripts/run-owner-daily-automation-entrypoint.mjs`:
   - old pattern: `abs.startsWith(REPO_ROOT + "\\") || abs.startsWith(REPO_ROOT + "/")`
   - new behavior: block both `abs === REPO_ROOT` and any child path under repo root.

2. Cover every owner entrypoint mode that writes or delegates output to an out-root/out-dir/output path:
   - `--dry-run` / `--out-root`
   - `--build-content-unit` / `--out-dir`
   - `--plan-youtube-letterbox` / `--out-dir`
   - `--prepare-youtube-letterbox-render` / `--out-dir`
   - `--plan-instagram-blob-upload` / `--out-dir`
   - `--prepare-instagram-blob-upload` should remain fixed
   - inspect whether `--render-youtube-letterbox-once` has any repo-root output check requiring the same fix; if yes, include it.

3. Do not change mode behavior beyond the output path safety gate.

4. Static guard must prove:
   - no remaining raw `startsWith(REPO_ROOT + "\\") || startsWith(REPO_ROOT + "/")` output guard in owner entrypoint;
   - owner entrypoint imports/uses `isRepoRootOrInside` or an equivalent local helper;
   - each relevant mode rejects repo root as output target;
   - each relevant mode does not create its expected output artifact at repo root when invoked with `--out-dir .` or `--out-root .`;
   - existing secret/env/API/deploy/upload no-side-effect checks remain.

5. Execution smoke should use existing sample fixtures and fail before external work.
   - Do not run full media generation.
   - Do not run ffmpeg/ffprobe.
   - For `--dry-run --out-root .`, it must fail before spawning the local pipeline.

## Forbidden Actions

- Do not access/read/edit/print `.env`, `.env.*`, `.env.local`, secret files, tokens, API keys, cookies, or credentials.
- Do not call/import `@vercel/blob` beyond already existing no-execute imports if any; do not perform Blob `put`, `list`, `head`, `del`, `copy`, liveness, or network calls.
- Do not call Instagram API, YouTube API/OAuth/upload, OpenAI, ElevenLabs, Pexels, Supabase, browser/Chrome, deploy, DNS, or any paid/external live service.
- Do not run ffmpeg or ffprobe.
- Do not create new media, TTS, images, browser renders, or muxed source files.
- Do not delete/overwrite existing media or result JSON.
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
2. Syntax check:
   - `node --check scripts/run-owner-daily-automation-entrypoint.mjs`
   - `node --check scripts/check-owner-daily-automation-entrypoint-static.mjs`
3. Main guard:
   - `node scripts/check-owner-daily-automation-entrypoint-static.mjs`
4. Targeted regressions:
   - `node scripts/check-instagram-blob-upload-from-request-executor-static.mjs`
   - `node scripts/check-instagram-blob-upload-plan-from-content-unit-static.mjs`
   - `node scripts/check-dual-platform-final-publish-orchestrator-static.mjs`

Do not run full build unless a focused syntax/import issue requires it.
Do not run full local generation pipeline.
Do not run ffmpeg/ffprobe/upload/API/deploy.

## Definition Of Done

- Owner daily entrypoint rejects repo root itself for all relevant output modes, not only repo child paths.
- Guard proves no repo-root output artifact is created in the checked modes.
- Existing no-env/no-secret/no-upload/no-media-generation contract remains intact.
- No commit/push.

## Final Handoff Format

Claude Code must stop after the final handoff. Include:

- task id
- changed files
- guard commonization summary
- modes covered and direct root-outdir results
- checks/results
- side effects confirmation
- deviations/risks
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 95%`
