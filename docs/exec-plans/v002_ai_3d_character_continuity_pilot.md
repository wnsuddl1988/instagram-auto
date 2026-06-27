# v002 - AI 3D Character Continuity Pilot

> Status: **LEGACY / REFERENCE ONLY** (2026-06-27). AI 3D character continuity work is not active Money Shorts OS MVP direction. Use only as historical reference unless Owner explicitly re-approves it.

## 1. Goal

Use the user's existing AI accounts and automation to test whether one original stylized 3D character can remain visually consistent across three connected vertical Veo clips. This is a continuity test, not a finished episode.

## 2. Existing Resources

- GPT paid web accounts: 2
- Gemini Pro web accounts: 4, with Veo and profile failover automation
- Anthropic Claude API, OpenAI API, Perplexity API
- ElevenLabs Starter
- FFmpeg and existing local video QA utilities
- Existing CDP automation patterns under `scripts/`

Use existing web subscriptions before paid APIs where practical. Anthropic, OpenAI API, Perplexity, ElevenLabs, TTS, and final rendering are not needed in this atomic task.

## 3. Test Story

Create three connected silent clips:

1. A stylized 3D office worker packs a bag at the end of the day and glances happily at the wall clock.
2. A coworker's hand slides a thick folder onto the desk; the worker freezes and slowly looks from the folder to the clock.
3. The worker gives a polite but firm smile, slides the folder back, shoulders the bag, and walks toward the exit.

The action must be visible. Do not use captions or narration to explain it.

## 4. Visual Direction

- Premium stylized 3D animation, not photorealistic live action and not flat 2D.
- Feature-film-inspired proportions and materials without copying any studio, franchise, or copyrighted character.
- Korean adult office worker, distinctive original face, readable silhouette, expressive eyebrows and eyes.
- Fixed outfit, hairstyle, body proportions, desk, clock, office palette, lighting direction, and material style.
- Cinematic camera, depth, volumetric lighting, soft shadows, purposeful composition, natural motion.
- Avoid uncanny realism, waxy skin, generic AI influencer appearance, malformed hands, excessive camera motion, text, logos, and watermarks where controllable.

## 5. Atomic Scope And Call Limits

### Reference image

- Create one reference sheet containing front three-quarter, side, full-body, fixed outfit, and key expression views.
- Maximum two image generations total.
- If generation 1 is usable, do not spend generation 2.
- Save every result and the exact prompt. No silent retry.

### Veo

- Exactly one submitted generation per scene: maximum three submitted generations total.
- A quota signal on one Gemini profile may fail over Gemini 1 -> 2 -> 3 -> 4 without consuming an additional scene submission.
- A content refusal, malformed result, continuity failure, selector failure, download failure, or poor quality must not trigger automatic resubmission.
- Record profile, submission time, prompt, status, quota/reset message, and saved path.
- Set 9:16 before every submission and verify the downloaded dimensions.

## 6. Implementation Constraints

- Create new scripts and output paths dedicated to this pilot. Do not overwrite old psychology or investment assets.
- Suggested output: `output/v2/continuity_pilot_3d_v1/`.
- Reuse stable CDP helpers and knowledge, but remove old hardcoded psychology characters and single-account assumptions.
- Reference attachment must use hidden file input handling; do not open an OS file picker.
- Preserve raw artifacts and screenshots needed to distinguish generation, quota, refusal, selector, and download failures.
- Do not edit `.env.local`, expose secrets, create social accounts, publish content, call TTS, or create a finished video.
- Work with the dirty worktree and never revert unrelated changes.

## 7. QA

Produce a contact sheet with comparable frames from all three clips and score each item pass/fail:

- facial identity
- hairstyle
- outfit colors and construction
- body proportions
- office layout and palette
- lighting/material style
- hand and prop integrity
- action readability without sound
- camera stability
- vertical format and technical validity

Hard failure:

- character appears to be a different person
- outfit or hairstyle materially changes
- 2D/photoreal style drift
- malformed hands or impossible prop interaction
- story cannot be understood silently
- any clip is horizontal

## 8. Verification

- Run syntax/static checks for new scripts before any generation.
- Confirm existing profile ports and login state without printing private account data.
- Use `ffprobe` for codec, dimensions, fps, and duration of each clip.
- Extract representative frames and create the contact sheet locally.
- Do not run `pnpm build`; this task should not modify the application contract.

## 9. Required Handoff To Codex

Return:

- modified and created files
- exact number of image and Veo submissions
- account/profile status and any quota failover
- prompts and reference image path
- three clip paths and technical metadata
- contact sheet and continuity scorecard paths
- honest quality verdict: pass, conditional pass, or fail
- specific continuity defects
- whether the current toolset is good enough to proceed without buying 3D software
- no next implementation beyond a recommendation

Stop after the handoff. Do not generate TTS or a finished episode.
