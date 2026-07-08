# HANDOFF_NOW

전체프로젝트 진행률 : 약 95%

## Current Task

- Task ID: `final-e2e-ready-content-unit-and-publish-one-v1`
- Owner approval: `APPROVE_FINAL_E2E_AUTOMATION_PUBLISH_ONE_NEW_CONTENT_UNIT`
- Purpose: finish the project by preparing exactly one eligible **new non-default content unit** from existing local media, wiring the actual dispatcher execution path, and publishing it end-to-end:
  1. Vercel Blob upload
  2. Instagram publish
  3. YouTube upload
  4. publish ledger write

This is the final product-facing execution slice. Do not split this into more no-live planning tasks. If the selected local source media is usable, proceed through preparation, preflight, execution, and result reporting in this one slice.

Latest blocker from the previous attempt:

- `final-e2e-automation-publish-one-new-content-unit-v1` stopped correctly with `BLOCKED_READY_NEW_CONTENT_UNIT_ABSENT`.
- The only checked-in non-default manifest (`scripts/fixtures/dual_platform_content_unit.sample.v1.json`, `t2_sample_new_topic/v1`) has metadata/blob sample evidence but both source mp4 paths are placeholders:
  - `instagramSourceExists:false`
  - `youtubeSourceExists:false`
  - `sourceFilesReady:false`
  - `preflightOk:false`
- The default ready fixture `t1_lifestyle_inflation/v3_2` is forbidden and must not be republished.
- The shortest real path is to promote a local `t2_salary_3days` media source into a ready content unit, then run the E2E publish once.

## Latest Stable Checkpoints

- `e5e57c1 feat(media): add publish ledger contract`
- `d91b32c chore(media): add read-only publish ledger bridge`

Current branch is local-only and ahead of origin. Push is not approved.

Current known uncommitted/protected files to preserve unless directly in this task:

- `_ai/CODEX_REVIEW.md`
- `_ai/NEXT_ACTION.md`
- `_ai/PROJECT_STATE.md`
- `_ai/CONTEXT_TRANSFER_CODEX.md`
- `piq_diag_out.txt`
- `scripts/render-golden-sample-visual-only-v1.mjs`
- `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- `scripts/get-youtube-refresh-token-once.mjs`
- `shadow-list.txt`

There may be an untracked `lib/publish-ledger-runtime-write.mjs` from prior planning. Inspect it only if useful for this task. Use it only if it is correct and directly reduces final E2E risk; otherwise leave it unmodified/untracked. Do not delete it without explicit reason.

## Hard Constraints

Forbidden:

- Directly read/modify `.env`, `.env.*`, `.env.local`, secret files.
- Print/log/store credential values or value-derived length/prefix/suffix/hash/masked/token type.
- Re-publish/re-upload existing completed evidence:
  - Instagram media_id `17916511431199303`
  - YouTube videoId `r9jhckdpC9w`
  - default content `t1_lifestyle_inflation/v3_2`
- Dependency or lockfile changes.
- Deploy.
- Push.
- Commit during this implementation slice.

Allowed by Owner approval for this final E2E slice:

- Use Owner no-log env wrapper / child process env injection for approved credentials.
- Execute exactly one new non-default content unit through Blob upload, Instagram publish, YouTube upload, and publish ledger write.
- Write secret-free result JSON and local explicit publish ledger path.
- Modify code/docs/scripts required to make this actual dispatcher execution work.
- Use existing local source media/render outputs if available.
- Run local media inspection (`ffprobe`) and exactly one local YouTube letterbox render (`ffmpeg`) if needed for the selected content unit, using existing project scripts/dependencies only.
- Create one content unit manifest/result artifact for the selected new content unit.

Do **not** call OpenAI/ElevenLabs/Pexels/Supabase or other content-generation APIs unless a ready local content unit cannot be found **and** the code path is already explicitly designed for no-log child env execution. If that becomes necessary, stop and report the exact missing content blocker instead of starting a new external-content-generation side quest.

## Required Execution Strategy

Do this in one meaningful slice:

1. Promote one eligible **new non-default content unit** from existing local media.
   - Must not be `t1_lifestyle_inflation/v3_2`.
   - Primary candidate: `t2_salary_3days`.
   - First inspect this local source candidate with `ffprobe`:
     - `C:\tmp\money-shorts-os\golden-sample-tts-first-mux-audit-v1\golden_sample_t2_salary_3days_tts_mux.mp4`
   - If it is 1080x1920 and within platform duration/size constraints, reuse it as the Instagram source.
   - If it is not usable, stop with `BLOCKED_T2_SOURCE_NOT_USABLE` and report exact dimensions/duration/size. Do not start external content generation.
   - Generate the YouTube letterbox mp4 exactly once from this source using existing local project rendering/script patterns only. Do not overwrite existing output; if the intended output exists, verify and reuse it.
   - Create or update one `dual_platform_content_unit_v1` manifest for this new content unit, preferably under `C:\tmp\money-shorts-os\final-e2e-ready-content-unit-and-publish-one-v1\` unless a checked-in fixture is explicitly safer. Avoid committing generated media/result files.
   - Must have actual Instagram source mp4 path and YouTube source mp4 path.
   - Must have metadata gates pass.
   - Must have/obtain Blob public URL liveness as part of execution after Blob upload.
   - Must not already exist in publish ledger.
   - If no eligible ready content unit can be created from the existing local t2 source, stop with the exact blocker. Do not create more harness-only work.

2. Implement the minimum actual dispatcher execution path.
   - Keep gate order:
     metadata → source files → blob readiness/upload/liveness → duplicate ledger/reference → credentials → actual dispatch.
   - Use explicit credential injection only. Do not use env-reading wrapper functions.
   - Use existing lib clients where possible:
     - `lib/instagram.ts#uploadInstagramReelWithCredentials`
     - `lib/youtube.ts#uploadYouTubeShortsWithCredentials`
     - Vercel Blob upload via existing dependency and deterministic pathname plan.
     - publish ledger via explicit ledger path.
   - Keep default evidence duplicate-blocked.
   - Do not allow partial ledger write:
     - If Instagram publish succeeds but YouTube upload fails, do not write dual-platform success ledger.
     - If any upload/publish fails, write only secret-free failure result JSON, not ledger success.
     - If ledger duplicate exists before execution, do not publish.
   - If both platform publishes succeed, write ledger exactly once with both records.
   - If the current no-run dispatcher needs conversion into a real execution branch, do it directly and narrowly:
     - Blob upload first.
     - Instagram publish after Blob public URL is available.
     - YouTube direct upload from the YouTube letterbox mp4.
     - Ledger record only after both platform publishes succeed.

3. Provide an Owner-run no-log command.
   - Prefer extending `scripts/run-owner-command-with-local-env-no-log.mjs` so Owner can run one command and inject credentials from `.env.local` into child env without AI seeing values.
   - The command must accept the selected content unit and publish ledger path.
   - If Claude cannot execute because secrets must be supplied by Owner, generate/update the command/wrapper and stop with a clear `OWNER_RUN_REQUIRED` instruction plus exactly one command. Do not ask Owner to paste secrets.

4. Execute if possible without secrets in model context.
   - If runtime env already has required credentials by safe child env / wrapper path, execute exactly once.
   - If Owner must run wrapper, do not simulate success. Produce the exact single command and expected result path.

## Required Result Artifacts

Secret-free only:

- result JSON path under repo-gitignored `output/` or `C:\tmp`
- contentId/version
- source paths and sizes
- Blob pathname and uploaded/public URL
- Instagram media_id
- YouTube videoId / URL
- publish ledger path and recorded keys
- side-effect counters
- no credential values, no token-shaped strings

## Required Checks

Before/after code changes:

- `git status -sb`
- targeted `node --check` for changed scripts
- relevant static guards:
  - `node scripts/check-dual-platform-final-publish-orchestrator-static.mjs`
  - `node scripts/check-owner-daily-automation-entrypoint-static.mjs` if owner entrypoint/wrapper changed
  - `node scripts/check-publish-ledger-static.mjs`
  - `node scripts/check-social-live-client-import-safety-static.mjs` if live clients touched
- If TypeScript check is cheap:
  - `node node_modules/typescript/bin/tsc --noEmit --pretty false`
  - If TS6053 local type-link issue appears, do not repair dependencies; report and rely on targeted checks.

After actual execution or Owner-run result:

- Verify result JSON parses.
- Verify ledger contains exactly the new content unit keys after success.
- Verify default evidence was not republished.
- Verify side-effect count matches exactly one intended execution path.

## Speed / Scope Guard

The Owner explicitly requested no more endless micro-slices. Do not stop after only adding another no-run layer if the t2 source can be prepared and the actual publish command can be run or handed to the Owner. Bundle the necessary local source prep, manifest, execution wiring, no-log command, one E2E attempt, result JSON, and final report together.

## Final Handoff Required

Return concise Korean handoff:

- task id
- changed files
- selected content unit or blocker
- implementation summary
- exact Owner-run command if Owner-run required
- execution/result summary if executed
- Instagram/YouTube/Blob/ledger results or exact blocker
- checks/results
- side effects confirmation
- env/secret handling confirmation
- deviations/risks
- checkpoint recommendation
- 전체프로젝트 진행률 : 약 95%

Stop after final handoff. Do not commit. Do not push.
