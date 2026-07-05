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
- Latest safety/standard checkpoints:
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

## Current Approved Slice

- Task ID: `golden-sample-v3-2-live-tts-audio-elevenlabs-run-v1`
- Status: **Owner explicitly approved one live TTS/audio slice**.
- Exact Owner approval:
  - `APPROVE_LIVE_TTS_AUDIO: t1_lifestyle_inflation — provider=ALLOW_ELEVENLABS, call cap=2, cost cap=$1, allow selected provider env/secret read only for ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID with no secret logging, stop on provider error/cap exceeded/cost cap exceeded/script impact gate fail/provenance mismatch/audio artifact audit fail`
- Approved domain: **TTS/audio only** via ElevenLabs.
- Approved provider flag: `ALLOW_ELEVENLABS`.
- Approved API call cap: `2` total, with v3.2 standard preference = one-shot primary call only; second call only if the existing v3.2 contract permits it for a clear artifact/severe pause/timing audit block.
- Approved cost cap: `$1`.
- Approved env/secret read:
  - `ELEVENLABS_API_KEY`
  - `ELEVENLABS_VOICE_ID`
  - no other secret/env values may be read from process env or `.env.local` for this live slice, except the non-secret allow flag `ALLOW_ELEVENLABS`.
  - secret values must not be logged, written to files, committed, or included in summaries; masked voice id is allowed.
- Approved output side effects:
  - TTS/audio artifacts only in the approved v3.2 output directory under `C:\tmp`.
  - TTS timing/alignment summaries needed for audio artifact audit and future render/mux may be written.
  - Existing repo manifest `scripts/fixtures/golden_sample_t1_lifestyle_inflation_visual_render_manifest.v3_2_tts_anchored.json` may be updated only if produced by the TTS-first alignment/reflow step and no frame render/mux occurs.

## Still Not Approved

- Render/frame generation is not approved.
- mux/video render is not approved.
- Upload is not approved.
- Owner direct viewing/listening QA actual pass is not approved.
- ChatGPT/Playwright/browser/CDP/image generation is not approved.
- OpenAI TTS, OpenAI Image API, BFL/FLUX2, Imagen, Gemini/Veo, Midjourney, or any provider except ElevenLabs TTS is not approved.
- Dependency/lockfile/font file, DB/deploy, env/secret modification, or broad production refactor is not approved.

## Current State

- Existing 9-image set accepted by Owner and checkpointed.
- Existing 9-image acceptance + TTS/audio future-use-only packet checkpoint: `d1c3ae2`.
- v3.2 TTS standard:
  - provider lineage: ElevenLabs.
  - strategy: `full_narration_one_shot`.
  - endpoint kind: `text_to_speech_with_timestamps`.
  - Script Impact Gate must pass before any TTS API call.
  - no scene-by-scene TTS.
  - no retry.
  - api call budget max 2.
- Integrated readiness remains `STANDARDIZED_NO_LIVE_READY`.
- `ownerViewingListeningActualStatus` remains `PENDING_DIRECT_OWNER_REVIEW`.
- `ownerQaPassed`, `uploadReady`, `productionReady`, render/mux/upload flags remain false.
- Upload hard block remains active.

## Purpose

Execute exactly one approved live TTS/audio slice for `t1_lifestyle_inflation`, using ElevenLabs only, while preserving the boundary that render/mux/upload/Owner QA are still blocked.

This slice must:

1. Record the exact Owner TTS/audio approval as a machine-readable live run plan.
2. Harden the v3.2 live TTS runner if needed so the approved command can run TTS/audio only without render/mux.
3. Narrow env/secret access to `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` only.
4. Run static/preflight checks before any live API call.
5. Execute the live ElevenLabs TTS/audio path only if Script Impact Gate and provenance checks pass.
6. Enforce call cap 2, no retry, and stop conditions.
7. Inspect/report generated TTS/audio timing/audit evidence only.

## Source Contracts To Read

Read only the minimum needed:

1. `scripts/fixtures/golden_sample_v3_2_live_tts_audio_approval_packet.t1_lifestyle_inflation.v1.json`
2. `_ai/GOLDEN_SAMPLE_V3_2_LIVE_TTS_AUDIO_APPROVAL_PACKET.md`
3. `scripts/fixtures/golden_sample_v3_2_tts_audio_audit_contract.v1.json`
4. `scripts/fixtures/golden_sample_v3_2_tts_audio_audit_sample_plan.t1_lifestyle_inflation.v1.json`
5. `scripts/fixtures/golden_sample_t1_lifestyle_inflation_tts_first_mux_manifest.v3_2.json`
6. `scripts/run-golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit.mjs`
7. `scripts/run-golden-sample-tts-audio-audit-standard-v1.mjs`
8. `scripts/check-golden-sample-v3-2-tts-audio-audit-static.mjs`
9. `scripts/check-golden-sample-v3-2-live-tts-audio-approval-packet-static.mjs`
10. `scripts/check-golden-sample-v3-2-future-execution-plan-gate-static.mjs`
11. `scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`

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

1. `scripts/fixtures/golden_sample_v3_2_live_tts_audio_run_plan.t1_lifestyle_inflation.v1.json` (new)
   - Must record the exact Owner approval text.
   - Must set:
     - `provider: "ALLOW_ELEVENLABS"`
     - `topicId: "t1_lifestyle_inflation"`
     - `callCapMax: 2`
     - `costCapUsdMax: 1`
     - `approvedDomain: "tts_audio_generation"`
     - `selectedProviderSecretKeysAllowed: ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID"]`
     - `secretLoggingAllowed: false`
     - `uploadApprovedNow: false`
     - `renderApprovedNow: false`
     - `muxApprovedNow: false`
     - `imageBrowserApprovedNow: false`
     - `ownerQaPassed: false`
   - Must document that provider cost telemetry may be unavailable; cost cap is controlled by hard API call cap and immediate stop on provider/cost signal if one appears.
   - Must reference TTS approval packet, TTS/audio audit contract/sample plan, v3.2 mux manifest, future gate, integrated readiness, and the live runner.

2. `scripts/check-golden-sample-v3-2-live-tts-audio-run-plan-static.mjs` (new)
   - Dependency-free static/preflight guard.
   - Import allowlist: `node:fs`, `node:path`, `node:url` only.
   - Validate exact Owner approval, provider, caps, stop conditions, secret allowlist, false flags, references, runner safety, and output policy.
   - Validate runner has a TTS/audio-only path that exits before render/mux.
   - Validate runner does not read broad env/secret values in the approved TTS-only path.
   - Validate live runner enforces `ALLOW_ELEVENLABS`/`--allow-live-tts`, Script Impact Gate before API fetch, no retry, call cap <= 2, no scene-by-scene TTS, no upload.
   - Include fail-closed mutants for wrong provider, cap > 2, cost > 1, extra secret key, secret logging, render/mux/upload true, missing Script Impact Gate, and missing TTS-only stop before render/mux.

3. `scripts/run-golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit.mjs`
   - Existing v3.2 runner.
   - Patch only if needed.
   - Required if currently missing:
     - Add a TTS/audio-only stage flag, e.g. `--stage tts-audio-only`.
     - In TTS-only mode, stop after Script Impact Gate + live TTS + timing/alignment/reflow/timing summaries.
     - Do not call `renderVisual`, `ffmpeg` mux, mux audit, or frame extraction in TTS-only mode.
     - Add allowlisted `.env.local`/process env secret resolution for this live slice: only `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` plus non-secret `ALLOW_ELEVENLABS`.
     - Do not read `ELEVENLABS_MODEL_ID`, candidate-specific voice env keys, or any other env/secret in this approved TTS-only path. Use manifest default model/settings.
     - Enforce no secret logging; masked voice id only.
     - Preserve existing full pipeline behavior for future render/mux slices unless this conflicts with the TTS-only safety gate.

4. `scripts/fixtures/golden_sample_t1_lifestyle_inflation_visual_render_manifest.v3_2_tts_anchored.json`
   - May be updated only if the TTS-only reflow step writes it as timing evidence.
   - This update is not render approval and must keep `uploadReady:false`.

5. `_ai/CLAUDE_REPORT.md`
   - Append concise reusable evidence.

6. `_ai/HANDOFF_NOW.md`
   - Status update only if needed.

Allowed generated/output path:

- `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\`
  - Allowed only for TTS/audio outputs and timing/alignment/audit summaries from the approved runner:
    - `narration_v3_2_elevenlabs.mp3`
    - `elevenlabs_alignment_raw.v3_2.json`
    - `elevenlabs_tts_timing_summary.v3_2.json`
    - `story_script_preview.v3_2.json`
    - `dynamic_caption_timeline_tts_anchored.v3_2.json`
    - `script_impact_gate_report.v3_2.json`
  - Do not generate visual mp4, mux mp4, frames, or rendered overlays in this slice.
  - Do not stage `C:\tmp` outputs.

Allowed external side effect:

- ElevenLabs TTS API only, via approved provider `ALLOW_ELEVENLABS`, with at most 2 calls.
- Prefer one primary call. Do not use second call unless a clear artifact/severe pause/timing audit block occurs and the reason is recorded before the second call.
- No retry loop.

## Required Execution Order

1. `git status -sb`.
2. Create/update the live TTS/audio run plan fixture and static guard.
3. Patch the v3.2 runner only if needed for TTS-only and env allowlist safety.
4. Run static/preflight checks:
   - `node --check scripts/check-golden-sample-v3-2-live-tts-audio-run-plan-static.mjs`
   - `node scripts/check-golden-sample-v3-2-live-tts-audio-run-plan-static.mjs`
   - `node scripts/check-golden-sample-v3-2-live-tts-audio-approval-packet-static.mjs`
   - `node scripts/check-golden-sample-v3-2-tts-audio-audit-static.mjs`
   - `node scripts/check-golden-sample-v3-2-future-execution-plan-gate-static.mjs`
   - `node scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`
5. `node --check` every changed/new `.mjs`, including the live runner if patched.
6. JSON parse every changed/new fixture.
7. If and only if all checks pass, run the approved live command with transient provider flag:
   - PowerShell pattern:
     - `$env:ALLOW_ELEVENLABS='1'; node scripts\run-golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit.mjs --stage tts-audio-only --allow-live-tts`
   - If the implemented stage flag differs, use the exact documented equivalent and report the mismatch.
   - Do not set any other provider flag.
   - Do not modify `.env.local`.
8. After live run, inspect only generated TTS/audio/timing summary files in the approved `C:\tmp` output directory.
9. Append `_ai/CLAUDE_REPORT.md` with:
   - exact command,
   - API call count vs cap 2,
   - cost cap handling / measured provider cost if available, otherwise explicit `costTelemetryUnavailable` note,
   - generated audio/timing output paths,
   - Script Impact Gate result,
   - audio artifact audit result,
   - any stop condition hit,
   - confirmation of no render/mux/upload/image/browser/DB/deploy/dependency.

## Required Safety Semantics

- Only `ALLOW_ELEVENLABS` provider is approved.
- Only `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` secret values may be read.
- Secret values must never be logged or written. Masked voice id is allowed.
- Script Impact Gate PASS is required before API call.
- Provenance mismatch stops before API call.
- API call cap is 2. Never exceed it.
- Cost cap is $1. If provider cost telemetry is unavailable, enforce the call cap as the hard cost-control proxy and report that cost telemetry was unavailable.
- No render/mux/upload/image/browser execution.
- Owner QA actual pass remains PENDING.
- Upload hard block remains active.

## Required Checks

Minimum:

1. `git status -sb`
2. `node --check` for every changed/new `.mjs`
3. JSON parse for every changed/new fixture
4. New live TTS/audio run plan guard:
   - `node scripts/check-golden-sample-v3-2-live-tts-audio-run-plan-static.mjs`
5. Regression/preflight:
   - `node scripts/check-golden-sample-v3-2-live-tts-audio-approval-packet-static.mjs`
   - `node scripts/check-golden-sample-v3-2-tts-audio-audit-static.mjs`
   - `node scripts/check-golden-sample-v3-2-future-execution-plan-gate-static.mjs`
   - `node scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`
6. Live command, only after checks pass:
   - `$env:ALLOW_ELEVENLABS='1'; node scripts\run-golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit.mjs --stage tts-audio-only --allow-live-tts`

Do not run full build unless a syntax/import issue requires it.

## Forbidden

- Any provider except ElevenLabs TTS with `ALLOW_ELEVENLABS`.
- OpenAI TTS, OpenAI Image API, BFL/FLUX2, Imagen, Gemini/Veo, Midjourney, ChatGPT/Playwright/browser/CDP.
- Reading env/secret keys other than `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` for this live slice.
- Logging/writing secret values.
- Upload or upload queue or `/api/upload` POST.
- Render/mux/Pillow/frame/video generation, generated frame extraction, or visual mp4/mux mp4 creation.
- Image generation or image regeneration.
- Adding dependencies, changing lockfiles, font files, DB/schema/deploy config, or `pnpm-workspace.yaml`.
- Creating a new live TTS runner clone.
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

- Live TTS/audio run plan fixture exists and matches Owner approval exactly.
- Static/preflight guard exists and fails closed for approval drift.
- v3.2 runner has safe TTS-only execution path and env/secret allowlist.
- Required checks pass before live call.
- Approved live ElevenLabs TTS/audio command is run once, unless a preflight stop condition blocks it.
- API call count never exceeds 2.
- Cost cap handling is recorded.
- TTS/audio evidence is in the approved `C:\tmp` output directory.
- `_ai/CLAUDE_REPORT.md` records concise evidence and any stop condition.
- No render/mux/upload/image/browser/env modification/dependency/DB/deploy occurred.
- No commit/push.

## Current Git Context

- Branch: `codex/source-first-blueprint-clean`, ahead 182 after checkpoint `d1c3ae2`.
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
