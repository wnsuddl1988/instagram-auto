# HANDOFF_NOW

## Absolute Rules Pointer

- 최우선 source of truth: `AGENTS.md` + 이 파일.
- Golden Sample v3.2 lock/standard/gap 문서:
  - `_ai/GOLDEN_SAMPLE_V3_2_ACCEPTANCE_LOCK.md`
  - `_ai/GOLDEN_SAMPLE_V3_2_FINAL_QA_PACKET.md`
  - `_ai/GOLDEN_SAMPLE_V3_2_PRODUCTION_STANDARD.md`
  - `_ai/GOLDEN_SAMPLE_V3_2_AUTOMATION_IMPLEMENTATION_GAP_ANALYSIS.md`
  - `scripts/fixtures/golden_sample_v3_2_acceptance_lock.t1_lifestyle_inflation.json`
  - `scripts/fixtures/golden_sample_v3_2_production_standard.v1.json`
  - `scripts/fixtures/golden_sample_v3_2_automation_implementation_gap_analysis.v1.json`
- Latest safety/standard/live checkpoints:
  - `b4b4b2d feat(safety): add fail-closed upload hard block guard`
  - `fd4b618 feat(golden-sample): add v3.2 story visual evidence guard`
  - `aeaaf94 feat(golden-sample): add chatgpt runner standard guard`
  - `701e1ed feat(golden-sample): add pillow renderer standard guard`
  - `98913d4 feat(golden-sample): add tts audio audit standard guard`
  - `3494d79 feat(golden-sample): add integrated production readiness guard`
  - `37fda6d feat(golden-sample): add owner decision packet`
  - `9607eab feat(golden-sample): record owner decisions now state`
  - `c80b024 feat(golden-sample): harden paid image allow guards`
  - `85865ba feat(golden-sample): close browser runner guard gaps`
  - `9fe6f77 feat(golden-sample): standardize script impact provenance`
  - `bb1fb59 feat(golden-sample): resolve chatgpt runner passive window`
  - `3222cba feat(golden-sample): resolve pillow font vendoring policy`
  - `07a5f4e feat(golden-sample): reconcile integrated readiness decisions`
  - `81d2c5d feat(golden-sample): resolve owner decisions safe defaults`
  - `e2014e1 feat(golden-sample): add future execution plan gate`
  - `b170b39 feat(golden-sample): add live action approval packet`
  - `ff1847f feat(golden-sample): record live image browser run`
  - `d1c3ae2 feat(golden-sample): prepare live tts audio approval packet`
  - `c02ed21 feat(golden-sample): record live tts audio run`

## Current Approved Slice

- Task ID: `golden-sample-v3-2-live-render-mux-run-v1`
- Status: **Owner explicitly approved one local render + mux slice**.
- Exact Owner approval:
  - `APPROVE_RENDER + APPROVE_MUX: t1_lifestyle_inflation — render cap=1, mux cap=1, cost cap=$0, use existing accepted 9 images and existing accepted ElevenLabs narration/alignment/timing only, no image regeneration, no TTS regeneration, allow Pillow/frame render + ffmpeg/ffprobe mux/artifact audit only, stop on font vendoring fail/safe-frame fail/overlay-spec fail/audio artifact audit fail/media probe fail/caption-card gate fail/story gate fail/render or mux error`
- Approved domain: **local Pillow/frame render + local ffmpeg/ffprobe mux/artifact audit only**.
- Approved render cap: `1`.
- Approved mux cap: `1`.
- Approved cost cap: `$0`.
- Approved inputs:
  - existing accepted 9 images only,
  - existing accepted ElevenLabs narration only,
  - existing accepted ElevenLabs alignment/timing only.
- Approved output side effects:
  - render/mux/audit artifacts only under `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\`.
  - frame extraction is allowed only as artifact audit evidence for this mux.
  - repo fixture updates are allowed only when produced by deterministic manifest/timing/audit evidence and must keep `uploadReady:false`.

## Still Not Approved

- Image generation or image regeneration is not approved.
- TTS generation or TTS regeneration is not approved.
- Any external API/provider call is not approved.
- ChatGPT/Playwright/browser/Chrome/CDP is not approved.
- Env/secret read is not approved, including `.env.local`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, image provider keys, or upload credentials.
- Upload, upload queue, or `/api/upload` POST is not approved.
- Owner direct viewing/listening QA actual pass is not approved.
- Dependency/lockfile/font file, DB/deploy, env/secret modification, or broad production refactor is not approved.

## Current State

- Existing 9-image set is accepted by Owner and checkpointed in `ff1847f`.
- Existing ElevenLabs narration/alignment/timing is accepted/reused by the live TTS/audio slice and checkpointed in `c02ed21`.
- The TTS/audio run performed **0 API calls** because accepted narration/alignment already existed.
- Script Impact Gate passed in the live TTS/audio slice.
- Audio artifact audit passed in the live TTS/audio slice; tailHold was deferred to mux.
- Integrated readiness remains `STANDARDIZED_NO_LIVE_READY`.
- `ownerViewingListeningActualStatus` remains `PENDING_DIRECT_OWNER_REVIEW`.
- `ownerQaPassed`, `uploadReady`, `productionReady`, upload flags remain false.
- Upload hard block remains active.

## Purpose

Execute exactly one approved local render/mux slice for `t1_lifestyle_inflation`, using only the already accepted images and already accepted ElevenLabs narration/alignment/timing.

This slice must:

1. Record the exact Owner render/mux approval as a machine-readable live run plan.
2. Harden the v3.2 runner if needed so the approved command can run **render/mux only** without TTS, env/secret, image/browser, or upload paths.
3. Enforce render cap 1 and mux cap 1.
4. Use existing accepted artifacts only.
5. Run static/preflight checks before any render/mux execution.
6. Execute local Pillow/frame render and ffmpeg/ffprobe mux/artifact audit only if all stop gates pass.
7. Report render/mux/audit evidence and leave upload/Owner QA blocked.

## Source Contracts To Read

Read only the minimum needed:

1. `scripts/run-golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit.mjs`
2. `scripts/fixtures/golden_sample_t1_lifestyle_inflation_tts_first_mux_manifest.v3_2.json`
3. `scripts/fixtures/golden_sample_t1_lifestyle_inflation_visual_render_manifest.v3_2_tts_anchored.json`
4. `scripts/fixtures/golden_sample_v3_2_pillow_renderer_contract.v1.json`
5. `scripts/fixtures/golden_sample_v3_2_pillow_renderer_sample_plan.t1_lifestyle_inflation.v1.json`
6. `scripts/run-golden-sample-pillow-renderer-standard-v1.mjs`
7. `scripts/check-golden-sample-v3-2-pillow-renderer-static.mjs`
8. `scripts/fixtures/golden_sample_v3_2_tts_audio_audit_contract.v1.json`
9. `scripts/check-golden-sample-v3-2-tts-audio-audit-static.mjs`
10. `scripts/fixtures/golden_sample_v3_2_live_tts_audio_run_plan.t1_lifestyle_inflation.v1.json`
11. `scripts/check-golden-sample-v3-2-live-tts-audio-run-plan-static.mjs`
12. `scripts/check-golden-sample-v3-2-future-execution-plan-gate-static.mjs`
13. `scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`

Do not read protected/excluded files unless unavoidable:

- `_ai/CODEX_REVIEW.md`
- `_ai/NEXT_ACTION.md`
- `_ai/PROJECT_STATE.md`
- `_ai/CONTEXT_TRANSFER_CODEX.md`
- `piq_diag_out.txt`
- `scripts/render-golden-sample-visual-only-v1.mjs`
- `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- unrelated `output/` subtrees
- unrelated `C:\tmp` subtrees

## Scope

Allowed repo files:

1. `scripts/fixtures/golden_sample_v3_2_live_render_mux_run_plan.t1_lifestyle_inflation.v1.json` (new)
   - Must record the exact Owner approval text.
   - Must set:
     - `topicId: "t1_lifestyle_inflation"`
     - `approvedDomain: "local_render_mux_artifact_audit"`
     - `renderCapMax: 1`
     - `muxCapMax: 1`
     - `costCapUsdMax: 0`
     - `imageRegenerationApprovedNow: false`
     - `ttsRegenerationApprovedNow: false`
     - `externalApiApprovedNow: false`
     - `envSecretReadApprovedNow: false`
     - `uploadApprovedNow: false`
     - `ownerQaPassed: false`
   - Must reference accepted live image run plan, accepted live TTS/audio run plan, Pillow renderer contract, TTS/audio audit contract, future gate, integrated readiness, and the live runner.
   - Must define stop conditions for font vendoring, safe-frame, overlay-spec, audio artifact audit, media probe, caption-card gate, story gate, render error, and mux error.

2. `scripts/check-golden-sample-v3-2-live-render-mux-run-plan-static.mjs` (new)
   - Dependency-free static/preflight guard.
   - Import allowlist: `node:fs`, `node:path`, `node:url` only.
   - Validate exact Owner approval, caps, zero cost, false flags, accepted inputs, references, runner safety, and output policy.
   - Validate runner has a render/mux-only path that does not call TTS, fetch, image/browser, upload, or env/secret code.
   - Validate runner enforces an explicit render/mux approval CLI gate, e.g. `--allow-render-mux`.
   - Validate render/mux path uses existing audio/alignment/timing and accepted 9 images only.
   - Validate render/mux audit fails closed for media probe, audio, caption-card, story, and uploadReady false.
   - Include fail-closed mutants for cap drift, cost drift, env/secret approval, image/TTS regeneration approval, upload true, missing stop condition, missing render/mux-only stage, missing explicit approval flag, and audit gate weakening.

3. `scripts/run-golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit.mjs`
   - Existing v3.2 runner.
   - Patch only as needed.
   - Required if currently missing:
     - Add a render/mux-only stage flag, e.g. `--stage render-mux-only`.
     - Add explicit CLI approval gate, e.g. `--allow-render-mux`.
     - In render/mux-only mode, do not call `stageTts()`.
     - In render/mux-only mode, do not call `loadEnvLocal()` and do not read any process env/secret values.
     - In render/mux-only mode, do not call fetch or any external API.
     - In render/mux-only mode, do not run ChatGPT/Playwright/browser/CDP/image generation.
     - In render/mux-only mode, use existing `narration_v3_2_elevenlabs.mp3`, `elevenlabs_alignment_raw.v3_2.json`, existing timing/reflow inputs, and accepted image md5 gate only.
     - Preserve existing `tts-audio-only` behavior from checkpoint `c02ed21`.
     - Preserve existing full pipeline behavior for future full approval unless it conflicts with the new explicit render/mux safety gate.

4. `scripts/fixtures/golden_sample_t1_lifestyle_inflation_visual_render_manifest.v3_2_tts_anchored.json`
   - May be updated only if the render/mux-only path deterministically rewrites the same accepted timing/render manifest.
   - Must keep `uploadReady:false`.

5. `_ai/CLAUDE_REPORT.md`
   - Append concise reusable evidence.

6. `_ai/HANDOFF_NOW.md`
   - Status update only if needed.

Allowed generated/output path:

- `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\`
  - Allowed only for render/mux/audit outputs from the approved runner:
    - overlay/frame artifacts needed for Pillow render and artifact audit,
    - visual mp4,
    - mux mp4,
    - post-render artifact audit JSON,
    - timing/caption/story/audit summaries deterministically required by this path.
  - Do not stage `C:\tmp` outputs.
  - Do not touch unrelated `C:\tmp` subtrees.

Allowed external/local side effects:

- Local Pillow/frame render exactly once.
- Local ffmpeg mux exactly once.
- Local ffprobe/media probe and artifact audit.
- No network/API/env/secret side effects.

## Required Execution Order

1. `git status -sb`.
2. Create/update the live render/mux run plan fixture and static guard.
3. Patch the v3.2 runner only if needed for render/mux-only, explicit approval flag, and env-free reuse path.
4. Run static/preflight checks:
   - `node --check scripts/check-golden-sample-v3-2-live-render-mux-run-plan-static.mjs`
   - `node scripts/check-golden-sample-v3-2-live-render-mux-run-plan-static.mjs`
   - `node scripts/check-golden-sample-v3-2-live-tts-audio-run-plan-static.mjs`
   - `node scripts/check-golden-sample-v3-2-pillow-renderer-static.mjs`
   - `node scripts/check-golden-sample-v3-2-tts-audio-audit-static.mjs`
   - `node scripts/check-golden-sample-v3-2-future-execution-plan-gate-static.mjs`
   - `node scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`
5. `node --check` every changed/new `.mjs`, including the live runner if patched.
6. JSON parse every changed/new fixture.
7. If and only if all checks pass, run the approved local render/mux command:
   - Suggested command:
     - `node scripts\run-golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit.mjs --stage render-mux-only --allow-render-mux`
   - If the implemented stage/flag differs, use the exact documented equivalent and report the mismatch.
   - Do not set provider flags.
   - Do not modify or read `.env.local`.
8. After render/mux run, inspect only generated render/mux/audit summary files in the approved `C:\tmp` output directory.
9. Append `_ai/CLAUDE_REPORT.md` with:
   - exact command,
   - render count vs cap 1,
   - mux count vs cap 1,
   - cost cap $0 result,
   - source artifacts reused,
   - output paths,
   - media probe result,
   - audio artifact audit result,
   - caption-card gate result,
   - story gate result,
   - any stop condition hit,
   - confirmation of no image regeneration, no TTS regeneration, no env/secret read, no upload, no external API, no dependency/DB/deploy.

## Required Safety Semantics

- Render/mux approval is one-run only for `t1_lifestyle_inflation`.
- Existing accepted 9 images must pass md5 gate before render.
- Existing accepted ElevenLabs audio/alignment/timing must be reused.
- No TTS stage, no live TTS guard, no `ELEVENLABS_API_KEY`, no `ELEVENLABS_VOICE_ID`, no `.env.local`.
- No image/browser generation.
- Render cap is 1.
- Mux cap is 1.
- Cost cap is $0.
- Stop before output if font vendoring, safe-frame, or overlay-spec fails.
- Stop/fail if audio artifact audit, media probe, caption-card gate, story gate, render, or mux fails.
- `uploadReady` must remain false.
- Owner QA actual pass remains PENDING.
- Upload hard block remains active.

## Required Checks

Minimum:

1. `git status -sb`
2. `node --check` for every changed/new `.mjs`
3. JSON parse for every changed/new fixture
4. New live render/mux run plan guard:
   - `node scripts/check-golden-sample-v3-2-live-render-mux-run-plan-static.mjs`
5. Regression/preflight:
   - `node scripts/check-golden-sample-v3-2-live-tts-audio-run-plan-static.mjs`
   - `node scripts/check-golden-sample-v3-2-pillow-renderer-static.mjs`
   - `node scripts/check-golden-sample-v3-2-tts-audio-audit-static.mjs`
   - `node scripts/check-golden-sample-v3-2-future-execution-plan-gate-static.mjs`
   - `node scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`
6. Local render/mux command, only after checks pass:
   - `node scripts\run-golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit.mjs --stage render-mux-only --allow-render-mux`

Do not run full build unless a syntax/import issue requires it.

## Forbidden

- Any network/API/provider call.
- OpenAI TTS/Image API, ElevenLabs API, BFL/FLUX2, Imagen, Gemini/Veo, Midjourney, ChatGPT/Playwright/browser/CDP.
- Reading any env/secret value or `.env.local`.
- Logging/writing secret values.
- Upload or upload queue or `/api/upload` POST.
- Image generation or image regeneration.
- TTS generation or TTS regeneration.
- Adding dependencies, changing lockfiles, font files, DB/schema/deploy config, or `pnpm-workspace.yaml`.
- Creating a new render/mux runner clone.
- Modifying protected/excluded files:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - unrelated `output/` subtrees
  - unrelated `C:\tmp` subtrees
- Commit/push.

## Definition Of Done

- Live render/mux run plan fixture exists and matches Owner approval exactly.
- Static/preflight guard exists and fails closed for approval drift.
- v3.2 runner has safe render/mux-only execution path and explicit approval flag.
- Required checks pass before render/mux execution.
- Approved local render/mux command is run once, unless a preflight stop condition blocks it.
- Render count never exceeds 1.
- Mux count never exceeds 1.
- Cost remains $0.
- Render/mux/audit evidence is in the approved `C:\tmp` output directory.
- `_ai/CLAUDE_REPORT.md` records concise evidence and any stop condition.
- No image regeneration/TTS regeneration/API/env/secret/upload/dependency/DB/deploy occurred.
- No commit/push.

## Current Git Context

- Branch: `codex/source-first-blueprint-clean`, ahead 183 after checkpoint `c02ed21`.
- Existing unstaged/untracked excluded files must remain unstaged:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - unrelated `output/` subtrees
  - unrelated `C:\tmp` subtrees

전체프로젝트 진행률 : 약 92%
