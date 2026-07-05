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

## Current Approved Slice

- Task ID: `golden-sample-v3-2-existing-image-set-acceptance-and-live-tts-audio-approval-prep-v1`
- Status: **Owner approved existing image set acceptance + no-live TTS/audio approval packet preparation only**.
- Exact Owner approval:
  - `APPROVE_EXISTING_IMAGE_SET_AND_PREPARE_LIVE_TTS_AUDIO: t1_lifestyle_inflation — existing 9 images accepted, no image regeneration, prepare next approval packet for TTS/audio only`
- Approved now:
  - Record that the existing 9-image set from the first live image/browser slice is accepted.
  - Do not regenerate images.
  - Prepare a TTS/audio-specific live approval packet for a future Owner decision.
  - Add a static guard proving this packet does not grant live TTS/audio execution.
- Not approved now:
  - Any live TTS/audio execution.
  - Any OpenAI/ElevenLabs or other TTS/audio API call.
  - Any audio/video/image content read beyond approved summary JSON evidence.
  - Any render, mux, upload, env/secret, dependency, font, DB, or deploy action.

## Current State

- First live image/browser slice checkpoint: `ff1847f feat(golden-sample): record live image browser run`.
- First live slice result:
  - provider: `ALLOW_CHATGPT_IMAGE`
  - submitted: `0 / 12`
  - saved: `9 / 9`
  - save method: `existing_file_skip`
  - cost: `$0`
  - fail/timeout: `0`
  - no image regeneration required or approved.
- Approved output evidence path:
  - `output/money-shorts/chatgpt-playwright-fresh-image-set-v3/image-generation-summary.v3.json`
  - `output/money-shorts/chatgpt-playwright-fresh-image-set-v3/generation-latency-report.v3.json`
- Owner policy decisions are fully resolved: 10 resolved / 0 pending.
- Integrated readiness remains `STANDARDIZED_NO_LIVE_READY`.
- `ownerViewingListeningActualStatus` remains `PENDING_DIRECT_OWNER_REVIEW`.
- `ownerQaPassed`, `uploadReady`, `productionReady`, render/TTS/mux/upload flags remain false.
- Upload hard block remains active.

## Purpose

Prepare the next safe Owner approval surface for TTS/audio only, after accepting the existing 9-image set.

This no-live slice must:

1. Record the exact Owner acceptance text for the existing 9-image set.
2. Link that acceptance to the first live image/browser run plan and summary evidence.
3. Create a TTS/audio-specific approval packet that is explicitly future-use-only and not an execution approval.
4. Preserve provider choice as a future Owner decision: `ALLOW_OPENAI_TTS` or `ALLOW_ELEVENLABS`.
5. Require future live TTS/audio approval to specify provider, call cap, cost cap, stop conditions, and artifact audit.
6. Add a static guard that fails closed if the packet is misread as live approval.

## Source Contracts To Read

Read only the minimum needed:

1. `scripts/fixtures/golden_sample_v3_2_live_image_browser_run_plan.t1_lifestyle_inflation.v1.json`
2. `output/money-shorts/chatgpt-playwright-fresh-image-set-v3/image-generation-summary.v3.json` (JSON only)
3. `output/money-shorts/chatgpt-playwright-fresh-image-set-v3/generation-latency-report.v3.json` (JSON only)
4. `scripts/fixtures/golden_sample_v3_2_live_action_approval_packet.v1.json`
5. `_ai/GOLDEN_SAMPLE_V3_2_LIVE_ACTION_APPROVAL_PACKET.md`
6. `scripts/fixtures/golden_sample_v3_2_future_execution_plan_gate.v1.json`
7. `scripts/fixtures/golden_sample_v3_2_tts_audio_audit_contract.v1.json`
8. `scripts/fixtures/golden_sample_v3_2_tts_audio_audit_sample_plan.t1_lifestyle_inflation.v1.json`
9. `scripts/run-golden-sample-tts-audio-audit-standard-v1.mjs`
10. `scripts/check-golden-sample-v3-2-tts-audio-audit-static.mjs`

Do not read protected/excluded files unless unavoidable:

- `_ai/CODEX_REVIEW.md`
- `_ai/NEXT_ACTION.md`
- `_ai/PROJECT_STATE.md`
- `_ai/CONTEXT_TRANSFER_CODEX.md`
- `piq_diag_out.txt`
- `scripts/render-golden-sample-visual-only-v1.mjs`
- `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- unrelated `output/` subtrees
- `C:\tmp`

## Scope

Allowed repo files:

1. `scripts/fixtures/golden_sample_v3_2_live_tts_audio_approval_packet.t1_lifestyle_inflation.v1.json` (new)
   - Machine-readable no-live packet.
   - Must record the exact Owner acceptance text.
   - Must record existing image set acceptance from the approved summary:
     - `savedImages: 9`
     - `submitted: 0`
     - `costUsd: 0`
     - `imageRegenerationApprovedNow: false`
     - accepted md5 set from the summary, if present.
   - Must set:
     - `approvalGrantedNow: false`
     - `liveTtsAudioApprovedNow: false`
     - `providerSelectedNow: false`
     - `callCapEffectiveNow: false`
     - `costCapEffectiveNow: false`
     - `uploadApprovedNow: false`
     - `renderApprovedNow: false`
     - `muxApprovedNow: false`
     - `envSecretAccessApprovedNow: false`
   - Must define future required fields for live TTS/audio:
     - provider allow flag: `ALLOW_OPENAI_TTS` or `ALLOW_ELEVENLABS`
     - call cap
     - cost cap
     - stop conditions
     - script impact gate provenance
     - audio quality gate audit
     - no upload implication.

2. `_ai/GOLDEN_SAMPLE_V3_2_LIVE_TTS_AUDIO_APPROVAL_PACKET.md` (new)
   - Human-readable Owner packet.
   - Must start with a clear "NOT LIVE APPROVAL" warning.
   - Must state the existing 9 images are accepted and no image regeneration is approved.
   - Must provide copy-ready future-use-only approval snippets for TTS/audio only.
   - Must state that provider/call cap/cost cap are not selected until the Owner explicitly approves.
   - Must state render/mux/upload remain blocked.

3. `scripts/check-golden-sample-v3-2-live-tts-audio-approval-packet-static.mjs` (new)
   - Dependency-free static guard.
   - Import allowlist: `node:fs`, `node:path`, `node:url` only.
   - Validate exact Owner acceptance text.
   - Validate image acceptance evidence from the live image/browser run plan and summary JSON.
   - Validate the packet/markdown are future-use-only and not current approval.
   - Validate allowed future providers are exactly `ALLOW_OPENAI_TTS` and `ALLOW_ELEVENLABS`.
   - Validate upload/render/mux/env/secret/dependency flags remain false.
   - Validate references to TTS audio audit contract/sample and script impact provenance.
   - Include fail-closed mutants for:
     - current live TTS approval set true,
     - provider selected now,
     - upload/render/mux true,
     - image regeneration approved,
     - wrong accepted image count,
     - submitted count drift,
     - cost drift,
     - missing future-use-only labels,
     - missing stop conditions,
     - missing audit references.

4. `_ai/CLAUDE_REPORT.md`
   - Append concise reusable evidence.

5. `_ai/HANDOFF_NOW.md`
   - Status update only if needed.

Allowed read-only output evidence:

- `output/money-shorts/chatgpt-playwright-fresh-image-set-v3/image-generation-summary.v3.json`
- `output/money-shorts/chatgpt-playwright-fresh-image-set-v3/generation-latency-report.v3.json`

Do not stage output files.
Do not modify output files.
Do not read image/audio/video binary content.

## Required Checks

Minimum:

1. `git status -sb`
2. `node --check scripts/check-golden-sample-v3-2-live-tts-audio-approval-packet-static.mjs`
3. JSON parse new fixture(s)
4. New guard:
   - `node scripts/check-golden-sample-v3-2-live-tts-audio-approval-packet-static.mjs`
5. Regression:
   - `node scripts/check-golden-sample-v3-2-live-image-browser-run-plan-static.mjs`
   - `node scripts/check-golden-sample-v3-2-live-action-approval-packet-static.mjs`
   - `node scripts/check-golden-sample-v3-2-future-execution-plan-gate-static.mjs`
   - `node scripts/check-golden-sample-v3-2-tts-audio-audit-static.mjs`
   - `node scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`

Do not run full build unless a syntax/import issue requires it.

## Forbidden

- Live TTS/audio execution or any TTS/audio API call.
- OpenAI/ElevenLabs/Gemini/Veo/BFL/ChatGPT/Playwright/browser/CDP execution.
- Image regeneration, image generation, browser generation, or runner execution.
- Audio/video/image binary read.
- Upload or upload queue or `/api/upload` POST.
- Render/mux/Pillow/Python/ffmpeg/ffprobe/video/audio generation.
- Reading `.env.local` or actual secrets.
- Adding dependencies, changing lockfiles, font files, DB/schema/deploy config, or `pnpm-workspace.yaml`.
- Creating a new live TTS runner or modifying production TTS runners.
- Modifying protected/excluded files:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - unrelated `output/` subtrees
  - `C:\tmp`
- Commit/push.

## Definition Of Done

- Existing 9-image set acceptance is recorded in the TTS/audio approval packet.
- TTS/audio packet and markdown are future-use-only and not current approval.
- Static guard exists and fails closed for approval drift.
- Required checks pass.
- `_ai/CLAUDE_REPORT.md` records concise evidence.
- No live TTS/audio, browser/image generation, render, mux, upload, env/secret, dependency, DB, or deploy action occurred.
- No commit/push.

## Current Git Context

- Branch: `codex/source-first-blueprint-clean`, ahead 181 after checkpoint `ff1847f`.
- Existing unstaged/untracked excluded files must remain unstaged:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - unrelated `output/` subtrees
  - `C:\tmp`

전체프로젝트 진행률 : 약 92%
