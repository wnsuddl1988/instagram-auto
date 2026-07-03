# HANDOFF_NOW

## Absolute Rules Pointer

- 최우선 source of truth: `_ai/CREATIVE_V2_GOLDEN_SAMPLE_ABSOLUTE_RULES.md`.
- 같은 우선순위 addendum: `_ai/GOLDEN_SAMPLE_OWNER_FEEDBACK_ABSOLUTE_RULES_ADDENDUM_V1.md`.
- 최신 Owner 기준이 이전 문서/핸드오프/렌더 보고와 충돌하면 최신 Owner 기준이 우선이다.

## Current Approved Slice

- Task ID: `golden-sample-chatgpt-playwright-v3-2-acceptance-lock-final-qa-packet`
- Status: approved by Owner after v3.2 TTS mux review.
- Slice status: **COMPLETED 2026-07-03** — acceptance lock + final QA packet 작성 완료 (`_ai/GOLDEN_SAMPLE_V3_2_ACCEPTANCE_LOCK.md`, `_ai/GOLDEN_SAMPLE_V3_2_FINAL_QA_PACKET.md`, `scripts/fixtures/golden_sample_v3_2_acceptance_lock.t1_lifestyle_inflation.json`). uploadReady=false / automationExpansionReady=false 유지.
- Owner verdict:
  - v3.2는 처음 버전보다 훨씬 이해하기 쉽고 좋다.
  - v3.2를 Golden Sample 최종 후보로 잠정 채택한다.
  - 다음 slice는 Golden Sample acceptance lock / final QA packet 문서화다.
  - upload/자동화 확장은 아직 금지한다.

## Accepted Candidate

- Candidate label: `Golden Sample v3.2 / t1_lifestyle_inflation`
- Topic: `월급이 올라도 통장이 그대로인 이유`
- Latest checkpoint: `a34d703 test(automation): add chatgpt playwright v3 tts candidates`
- Current final candidate mux:
  `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4`
- Comparison/reference:
  `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-1-tts-first-mux-audit\golden_sample_t1_lifestyle_inflation_tts_mux_v3_1.mp4`
- Accepted visual baseline:
  `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-visual-only-v3-1-banknote-patch\golden_sample_t1_lifestyle_inflation_visual_only_v3_1.mp4`

## Goal

- Lock v3.2 as the current Golden Sample final candidate for Owner acceptance tracking.
- Preserve the exact quality criteria that made v3.2 acceptable:
  - ChatGPT+Playwright image source, not FLUX2/OpenAI paid API for this sample.
  - Story-Causality First + Visual Evidence Second.
  - Korean everyday money context and Korean-won-like visual clarity.
  - Pillow-rendered bold info-shorts typography, not Malgun-style subtitles.
  - TTS-first one-shot narration with word/phrase anchored captions.
  - Natural duration, no fixed 30s/40s target.
- Produce a final QA packet that explains what is accepted, what is only technical evidence, what remains forbidden, and what is required before upload/automation expansion.

## Scope

Documentation/fixture only, plus read-only verification of existing committed files and existing `C:\tmp` outputs.

Suggested new files:

1. `_ai/GOLDEN_SAMPLE_V3_2_ACCEPTANCE_LOCK.md`
   - Owner-readable lock note.
   - Mark status as `ACCEPTED_AS_GOLDEN_SAMPLE_FINAL_CANDIDATE`, not upload-ready.
   - Include exact mp4 path, topic, source method, duration, and core reasons.
   - State that final upload is still forbidden until separate Owner approval.

2. `_ai/GOLDEN_SAMPLE_V3_2_FINAL_QA_PACKET.md`
   - Concise final QA packet:
     - story causality.
     - visual evidence.
     - Korean money context.
     - typography/caption style.
     - TTS/audio timing.
     - artifact audit.
     - known limits.
     - reusable production standards.

3. `scripts/fixtures/golden_sample_v3_2_acceptance_lock.t1_lifestyle_inflation.json`
   - Machine-readable lock:
     - `status: "ACCEPTED_AS_GOLDEN_SAMPLE_FINAL_CANDIDATE"`
     - `uploadReady: false`
     - `automationExpansionReady: false`
     - exact source file paths.
     - expected ffprobe facts from existing evidence.
     - accepted criteria scores/evidence references.
     - forbidden next actions.

4. `_ai/CLAUDE_REPORT.md`
   - Append concise result evidence.

Do not modify implementation code unless a tiny read-only verification script is absolutely necessary. Prefer no new runner.

## Verification

Required checks:

- `git status -sb`
- JSON parse for the new fixture.
- Verify the v3.2 mux file exists at the exact `C:\tmp` path.
- ffprobe existing v3.2 mux:
  - 1080x1920
  - h264
  - 30fps
  - audio stream present
  - duration approximately 53.97s
- Confirm no `uploadReady:true`, no `automationExpansionReady:true`, and no `renderReady:true` is introduced in new files.
- Confirm no secret/env/API key values appear in new files.

Do not rerun image generation, TTS, render, mux, upload, or paid/external APIs.

## Known Accepted Evidence

- v3.2 mux path:
  `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4`
- Codex verified:
  - video: 1080x1920, 30fps, duration 53.966667s.
  - audio: AAC mono, duration 53.359002s.
- Claude report:
  - Script Impact Gate PASS.
  - one-shot ElevenLabs live TTS used after gate.
  - no image generation in TTS slice.
  - caption anchors within allowed timing.
  - uploadReady=false.
- Owner feedback:
  - v3.2 is much easier to understand and better than the first version.

## Forbidden

- Image generation.
- ChatGPT/Playwright generation.
- OpenAI API calls.
- FLUX2/BFL calls.
- Gemini calls.
- Midjourney calls.
- ElevenLabs live TTS calls.
- Render/mux regeneration.
- Upload.
- Automation expansion.
- Golden Sample upload-ready declaration.
- Env/secret/dependency/DB/deploy changes.
- Reading/modifying/staging `_ai/CONTEXT_TRANSFER_CODEX.md` or `piq_diag_out.txt`.
- Touching rejected salary_3days visual-only render diff:
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- Commit/push.

## Current Git Context

- Latest checkpoint: `a34d703 test(automation): add chatgpt playwright v3 tts candidates`.
- Branch: `codex/source-first-blueprint-clean`, ahead 160 before this slice.
- Excluded/rejected/admin files must remain unstaged:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`

