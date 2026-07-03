# HANDOFF_NOW

## Absolute Rules Pointer

- 최우선 source of truth: `_ai/CREATIVE_V2_GOLDEN_SAMPLE_ABSOLUTE_RULES.md`.
- 같은 우선순위 addendum: `_ai/GOLDEN_SAMPLE_OWNER_FEEDBACK_ABSOLUTE_RULES_ADDENDUM_V1.md`.
- 최신 Owner 기준이 이전 문서/핸드오프/렌더 보고와 충돌하면 최신 Owner 기준이 우선이다.

## Current Approved Slice

- Task ID: `golden-sample-chatgpt-playwright-v3-2-script-voice-impact-rework`
- Status: approved by Owner after v3.1 TTS mux review.
- Owner verdict on current v3.1 TTS mux:
  - 대본과 음성은 나쁘지 않다.
  - 그러나 확 와닿는 느낌이 없다.
  - Golden Sample 기준이므로 엄격하게 대본과 음성을 보완한다.
- Current v3.1 TTS mux remains evidence only, not Golden Sample PASS.

## Accepted Visual Input

- Latest visual checkpoint: `1a78a4a test(automation): add chatgpt playwright v3 banknote candidate`.
- Current visual baseline:
  `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-visual-only-v3-1-banknote-patch\golden_sample_t1_lifestyle_inflation_visual_only_v3_1.mp4`
- Current TTS mux candidate to improve:
  `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-1-tts-first-mux-audit\golden_sample_t1_lifestyle_inflation_tts_mux_v3_1.mp4`
- Topic:
  `t1_lifestyle_inflation` / `월급이 올라도 통장이 그대로인 이유`.

## Goal

- Rework the narration and voice pacing so the video feels sharply relevant, not merely correct.
- Keep the accepted v3.1 visual/image set unless a timing-only rerender is needed.
- Produce a new TTS-first mux candidate after script impact gate passes.
- Upload remains forbidden.

## Script Impact Gate

Before any live TTS call, write a revised narration and score it against this gate.

Required scores:

- `hook_self_relevance_score >= 90`
- `story_causality_score >= 90`
- `problem_solution_bridge_score >= 90`
- `solution_specificity_score >= 90`
- `save_worthiness_score >= 88`
- `spoken_naturalness_score >= 88`

Hard fail:

- Hook feels generic.
- Script is merely explanatory but not personally sharp.
- Problem and solution bridge is weak.
- Solution ends as abstract "관리/정리/절약".
- "세 자리/세 개" appears but the three things are not named.
- Script relies on invented statistics.
- Script creates a new topic unrelated to the accepted visual.

If the revised narration cannot pass the gate, stop before TTS and report the failed script draft with reasons.

## Stronger Script Direction

The current script is logical but too mild. Strengthen it with a clearer "aha" frame:

- 월급 인상분은 한 번 체감되지만, 오른 고정비는 매달 반복해서 빠진다.
- 사람은 "오른 월급"은 기억하지만, "조용히 오른 생활 기준"은 잘 못 본다.
- 통장이 그대로인 이유는 내가 갑자기 헤퍼져서가 아니라, 오른 돈이 들어오자마자 자리를 잃기 때문이다.
- 해결은 절약 구호가 아니라 월급날 돈의 자리부터 먼저 만드는 것이다.
- 세 자리:
  1. 고정비 증가분.
  2. 생활비 상한.
  3. 남길 돈.
- CTA는 저장 욕구가 있어야 한다:
  - "다음 월급날 이 순서대로 해보세요"처럼 행동이 선명해야 한다.

Tone:

- confident, modern Korean money psychology explainer.
- concise, punchy, slightly sharper than v3.1.
- not angry, not clickbait-only, not lecture-like.
- no vague self-help ending.

## TTS / Live Call Policy

- ElevenLabs live TTS is allowed only after Script Impact Gate passes.
- Use existing live guard:
  - `--allow-live-tts` or existing `ALLOW_ELEVENLABS` guard convention.
  - do not modify env files.
  - do not print or store secret values.
- Maximum live TTS calls: 2.
  - First call: revised narration.
  - Second call only for clear audio artifact, severe pause issue, or audit-blocking timing problem.
- Use one-shot TTS only.
- Scene-by-scene TTS is forbidden.
- If credential/guard is unavailable, stop and report; do not bypass.

## Timing Rules

- Audio is the timeline owner.
- Re-anchor captions/cards/motions to actual phrase/word timing.
- No padding to force duration.
- No fixed 30s/40s target.
- No hard trim that cuts speech.
- Final length is whatever the stronger narration naturally requires.
- Reject if:
  - voice is rushed.
  - voice drags.
  - captions flash too briefly.
  - dead air appears only to satisfy duration.

## Visual / Caption Rules

- Use accepted v3.1 visual/image set.
- No image generation.
- Korean banknote clarity must not degrade.
- Keep Pillow bold info-shorts typography.
- No bottom-fixed subtitle bar.
- Dynamic captions must be phrase/word anchored to actual TTS.
- Emphasis should land on spoken key words.
- "세 자리/세 개" moment must show:
  - 고정비 증가분
  - 생활비 상한
  - 남길 돈

## Required Outputs

Suggested files:

1. `scripts/fixtures/golden_sample_t1_lifestyle_inflation_tts_first_mux_manifest.v3_2.json`
   - revised narration.
   - script impact gate scores.
   - voice/settings reference.
   - live call guard settings.
   - caption/word-anchor rules.
   - audit thresholds.

2. `scripts/run-golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit.mjs`
   - may reuse the v3.1 TTS runner pattern.
   - must stop before live TTS if script gate fails.

3. `scripts/fixtures/golden_sample_t1_lifestyle_inflation_visual_render_manifest.v3_2_tts_anchored.json`
   - generated from actual TTS timing.

4. `_ai/CLAUDE_REPORT.md` append.

Output folder:

- `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\`

Must include:

- final mux mp4.
- narration audio.
- timing/alignment summary.
- script impact gate report.
- dynamic caption timeline.
- render manifest.
- post-render artifact audit report.
- frame screenshots.
- story script preview.

## Audit Gates

- ffprobe:
  - 1080x1920.
  - h264 video.
  - audio stream present.
- Audio:
  - no long beginning silence.
  - silence ratio within threshold.
  - speech active ratio healthy.
  - no clipped tail.
  - no padding-only ending.
- Caption:
  - actual TTS phrase/word timing.
  - readable dwell.
  - no bottom-fixed subtitle.
  - no incoherent overlap.
- Story:
  - problem -> cause -> illusion -> solution -> action -> result.
  - impact gate pass.
  - "3 slots" concrete screen moment.
- Visual:
  - v3.1 images preserved.
  - Korean banknote clarity preserved.
  - typography preserved.
- Upload:
  - `uploadReady=false`.

## Forbidden

- Image generation.
- ChatGPT/Playwright image calls.
- OpenAI API calls.
- FLUX2/BFL calls.
- Gemini calls.
- Midjourney calls.
- More than 2 ElevenLabs live TTS calls.
- Live TTS before script impact gate passes.
- Scene-by-scene TTS.
- Padding to force duration.
- Hard trim that cuts speech.
- Upload.
- Golden Sample PASS declaration before Owner listening/viewing approval.
- Env/secret/dependency/DB/deploy changes.
- Reading/modifying/staging `_ai/CONTEXT_TRANSFER_CODEX.md` or `piq_diag_out.txt`.
- Touching rejected salary_3days visual-only render diff:
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- Commit/push.

## Current Git Context

- Latest checkpoint: `1a78a4a test(automation): add chatgpt playwright v3 banknote candidate`.
- Existing uncommitted v3.1 TTS files may be used as reference but are not accepted final.
- Remaining excluded/rejected/admin files must not be touched unless explicitly needed:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- Do not stage/commit/push.

## Required Checks

- JSON parse all new/updated JSON fixtures/reports.
- `node --check` for changed/new scripts.
- Verify script impact gate passes before TTS.
- Verify live ElevenLabs call count <= 2.
- Verify no forbidden provider/API calls.
- Verify no image generation.
- Verify final mux mp4 exists if TTS was run.
- ffprobe final mux.
- Run post-render artifact audit.
- Extract frame screenshots.
- Verify captions are actually TTS-anchored.
- Verify no secret values are printed.
- `git status -sb`.

## Final Handoff Format

Report:

- changed files.
- revised narration text.
- script impact gate scores.
- whether TTS was run or stopped before TTS.
- live TTS call count and reason.
- final mux mp4 path, if generated.
- audio duration and final duration.
- ffprobe result.
- caption timing evidence.
- frame screenshot paths.
- post-render artifact audit verdict.
- story impact verdict.
- typography/caption QA.
- Korean banknote visual preservation verdict.
- whether this is suitable for Owner listening/viewing QA.
- checks/results.
- forbidden actions not performed.
- checkpoint recommendation.
- 전체프로젝트 진행률 : 약 92%.
