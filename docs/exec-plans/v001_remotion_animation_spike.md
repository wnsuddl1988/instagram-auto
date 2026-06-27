# v001 - Remotion Animation Spike

> Status: **LEGACY / REFERENCE ONLY** (2026-06-27). This old execution plan is not active Money Shorts OS MVP direction. Do not run render/template work from it without explicit Owner approval.

## 1. Goal

Build a local, reusable 2D animation proof of concept for an adult-relatable animated sitcom. Render one polished 15-20 second vertical MP4 without paid APIs.

## 2. Context And Current State

- Repository: `C:\Users\PC\jjy\instagram-auto`
- Existing `python/render_v2.py` is a still-image/Ken Burns renderer and is not suitable as the core animation engine.
- Existing psychology and investment experiments must remain untouched.
- Instagram and YouTube accounts do not exist yet. Publishing is out of scope.
- The future master video will be reused for both Instagram Reels and YouTube Shorts.

## 3. Likely Files And Modules

Prefer an isolated module such as:

- `remotion/` or another clearly separated project-local folder
- Remotion root/composition files
- reusable vector character components
- reusable background and prop components
- episode data/schema
- one render script and package scripts
- output under a new dedicated proof folder

Do not modify legacy experimental scripts unless required for a narrowly justified integration point.

## 4. Atomic Scope

Implement one deterministic silent episode based on this situation:

> An office worker tries to leave on time. A coworker silently places one more task on the desk. The worker freezes, checks the clock, forces a smile, then slides the task back with a firm gesture and leaves.

Requirements:

- 1080x1920, 30 fps, 15-20 seconds.
- Original simple vector style suitable for recurring production.
- One main character and one secondary character with fixed designs.
- At least two reusable backgrounds or one background with three purposeful camera compositions.
- Actual animation: body translation/rotation, pose change, facial expression change, eye direction, prop movement, and timed reaction.
- At least one visual setup/payoff that is understandable without narration.
- Use `useCurrentFrame()`, `interpolate()`, `spring()`, or deterministic frame calculations. Do not use CSS transitions or CSS animations.
- Keep text minimal or absent. Do not use explanatory captions to rescue unclear action.
- Add a small number of licensed/local or generated-in-code sound effects only if already available and clearly safe; otherwise keep the spike silent.
- No OpenAI, Claude, Gemini, Veo, ElevenLabs, image APIs, or browser automation.

## 5. Constraints And Non-Goals

- Do not create Instagram or YouTube accounts.
- Do not implement upload automation.
- Do not finalize character names, channel branding, merchandise, SaaS, or monetization products.
- Do not reuse prior psychology actors, prompts, scripts, or videos.
- Do not build a slideshow from still images.
- Do not generate characters independently per scene.
- Do not edit `.env.local` or print secrets.
- Use `pnpm` only.
- Work with the existing dirty worktree; do not revert or overwrite unrelated user changes.

## 6. Verification

Required:

1. Render the final MP4 locally.
2. Report resolution, fps, duration, and output path with `ffprobe` or equivalent.
3. Render representative stills from the beginning, reaction, and payoff moments.
4. Visually inspect the stills and full video for character consistency, clipping, empty frames, and action readability.
5. Run the narrow Remotion/type verification introduced by the change.
6. Run `pnpm build` because package/runtime integration changes the project contract.

Expected result:

- All checks pass.
- The silent story is understandable without TTS.
- The result looks like a moving animated scene, not a narrated slideshow.

## 7. Required Final Handoff To Codex

Return a concise handoff containing:

- modified files
- architecture and reusable components added
- exact render and verification commands
- verification results
- final MP4 and still-image paths
- actual render time
- known visual limitations
- whether this approach can realistically support one quality episode per day after the asset system is established
- recommended next atomic task

Do not start the next task. Stop after the v001 artifact and handoff are complete.
