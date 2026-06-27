# v003 - Recover Scene 3 And Final Continuity QA

> Status: **LEGACY / REFERENCE ONLY** (2026-06-27). This old continuity QA plan is not active Money Shorts OS MVP direction.

## 1. Goal

Complete the v002 continuity pilot by generating Scene 3 exactly once, then perform final three-scene continuity QA. This task does not create a finished episode.

## 2. Owner Approval Boundary

- Veo submitted generations: exactly one maximum, Scene 3 only.
- Cost: Gemini web video quota only; paid APIs USD 0.
- GPT image, Anthropic Claude API, OpenAI API, Perplexity API, ElevenLabs, and TTS: zero calls.
- No automatic resubmission under any failure condition.
- If the one Scene 3 submission fails, stop and report.

## 3. Current Assets

- Reference: `output/v2/continuity_pilot_3d_v1/reference/ref_selected.png`
- Scene 1: `output/v2/continuity_pilot_3d_v1/veo/scene_01.mp4`
- Scene 2: `output/v2/continuity_pilot_3d_v1/veo/scene_02.mp4`
- Scene 3 prompt metadata: `output/v2/continuity_pilot_3d_v1/veo/scene_03_submission.json`
- Existing scripts: `scripts/_v002-veo-scene.mjs`, `scripts/_v002-veo-recover.mjs`, `scripts/_v002-qa-contactsheet.mjs`

Do not create a new reference image or change the character design.

## 4. Preflight Before The One Submission

Perform locally without generating video:

1. Inspect and minimally improve the Chrome keep-alive and existing-result recovery path.
2. Do not close the controlled Chrome page or browser while generation is pending.
3. Make recovery able to inspect the current conversation and the correct recent conversation before declaring the result missing.
4. Confirm Gemini profiles 2 and 3 status. Do not use profile 4 because video capability was absent.
5. Treat quota/cooldown pre-detection as a profile failover, not a submitted generation.
6. Confirm the hidden file-input reference attachment and 9:16 selection without opening the OS file picker.
7. Run syntax/static checks on modified scripts.

Do not submit Scene 3 until all preflight checks pass.

## 5. Scene 3 Submission

- Reuse the accepted reference and Scene 3 action from v002.
- Preserve the cute comedic semi-deformed adult 3D style, face, black side-part hair, sky-blue rolled-sleeve shirt, red loosened tie, navy bottoms, body proportions, office set, materials, and lighting.
- Action: polite but firm closed-mouth smile, slide the thick folder back, shoulder the bag, and walk toward the exit.
- 9:16 vertical, one continuous shot, no internal montage, no talking, no captions.
- Submit exactly once on the first available video-capable profile.
- Save the result as `output/v2/continuity_pilot_3d_v1/veo/scene_03.mp4`.
- Preserve submission metadata, state screenshot, and any quota/refusal/error evidence.

## 6. Final QA

If Scene 3 is saved:

1. Verify all three clips with `ffprobe`.
2. Extract comparable setup, reaction, and payoff frames.
3. Regenerate `qa/contact_sheet.png` with all three scenes.
4. Fill `qa/scorecard.json`; do not leave template values blank.
5. Explicitly assess:
   - face and hairstyle
   - shirt, tie, bottoms, bag, and body proportions
   - office layout, clock, desk, lighting, and material style
   - hand and folder interaction
   - silent story readability
   - camera stability and internal cuts
   - visible generator marks and implications for publishable quality
6. Verdict must be `pass`, `conditional_pass`, or `fail`, with evidence.

Do not hide or remove provenance marks. Record them as a final-production constraint.

## 7. Constraints

- Do not render a combined final episode.
- Do not generate narration, TTS, music, captions, or upload assets.
- Do not create Instagram or YouTube accounts.
- Do not edit `.env.local` or expose private account information.
- Do not modify old psychology/investment assets.
- Do not revert unrelated dirty-worktree changes.
- Do not run `pnpm build`; application behavior is outside this task.

## 8. Required Handoff To Codex

Return:

- modified files
- proof that preflight checks passed before submission
- exact Veo submission count
- profile used and quota failovers, if any
- Scene 3 path and technical metadata, or exact failure evidence
- final three-scene contact sheet and completed scorecard paths
- honest quality verdict and defects
- whether the current AI-only workflow is sufficient for the first real pilot episode

Stop after handoff. Do not begin script, TTS, final editing, or publishing work.
