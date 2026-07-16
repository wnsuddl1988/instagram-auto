# AutoShorts AI — Project State

Updated: 2026-07-17 KST

## Operating State

- ROLE_MODE: `MAIN_AI_MODE`
- Main AI: Codex
- Branch: `codex/source-first-blueprint-clean`
- Remote state: local commits ahead of origin; push not approved and not performed.
- Overall Owner-facing progress: approximately 90%.

## Current Product State

- Owner has viewed and accepted the current two-part final video set for `gen-finance-editorial-v2-time_retirement-wealth_standard-05` ("자산을 키우는 사람은 미래의 월급부터 만든다"). This is a visual/content acceptance for this specific revision; it is not an upload instruction.
- Part 1 final MP4: 47.97s, 1080x1920, H.264/AAC, real ElevenLabs audio, 8 scenes.
- Part 2 final MP4: 46.13s, 1080x1920, H.264/AAC, real ElevenLabs audio, 7 scenes.
- Both parts use the selected real scene images, dynamic captions, and Owner-QA-passed Veo motion for the selected scenes. Current renderer also retains layered still-image motion for non-Veo scenes.
- Visual timing repair is included: the part 1 closing transition and part 2 closing transition are aligned to the preceding speech boundary; no audio was cut for the transition.
- Final video summaries report `RENDER_MUX_OK`, 15~60s validity, video/audio streams, caption contracts, and Flow motion coverage as passed.
- Owner has accepted the current final viewing result. No upload, publish, deploy, push, env/secret change, account change, or external action has occurred.
- The current product keeps the 11-step human-in-the-loop workflow and uses `money_shorts_resumable_orchestrator_v1` to reconstruct 12 durable production/publication stages from local artifacts after a restart.
- The web UI now exposes one bounded `automationAdvance` button. It can execute exactly one planner-approved local/no-submit action (`realTtsPreflight`, `flowMotionPrepare`, `finalVideoCreate`, or `wizardPreflight`), then recomputes the plan and stops. It never chains, retries, runs paid generation, performs Owner QA, uploads, or publishes.
- `automationAdvance` now writes a content-addressed `in_progress` receipt before execution under `C:\tmp\money-shorts-os\automation-execution-v1`, acquires one atomic per-topic lock, writes the terminal result and recomputed-plan fingerprint, then releases the lock. The same plan/action cannot execute twice.
- Interrupted or ambiguous attempts are not expired or unlocked automatically. The UI shows the durable guard status and disables the one-step button for in-flight, interrupted, identical-recorded, or store-unavailable states.
- The Owner UI now exposes a guided recovery card only when a durable in-flight receipt exists. It shows the action, start time, before/current completed-stage counts, and permits exactly one evidence-derived decision: acknowledge already-advanced artifacts without rerun, or clear an unchanged attempt for a later separate manual retry.
- Recovery terminalizes and preserves the old receipt before releasing the topic lock. A cleared retry receipt is archived before a later explicit attempt can start. Ambiguous plan changes or lock/receipt mismatch remain locked for manual evidence review.
- Scheduler/queue is still not implemented.

## Publication State

- Both parts have current `PREFLIGHT_ONLY_OK` evidence under the topic's local `publish/v5` folder.
- Both preflights recorded all six required credential names as present, no duplicate publication, `armed: false`, and all external side-effect counters at zero.
- The videos are therefore local upload candidates only. The actual upload route remains separately fail-closed behind three Owner confirmations, literal `업로드` input, duplicate checks, and a new explicit external-action approval.

## Validation Evidence

- Part 1 `real-video-summary.json`: `RENDER_MUX_OK`; 47.97s; 1080x1920; H.264/AAC; real audio/image/caption/Flow gates passed.
- Part 2 `real-video-summary.json`: `RENDER_MUX_OK`; 46.13s; 1080x1920; H.264/AAC; real audio/image/caption/Flow gates passed.
- Publish preflight part 1: `PREFLIGHT_ONLY_OK`, `armed: false`, no external counters incremented.
- Publish preflight part 2: `PREFLIGHT_ONLY_OK`, `armed: false`, no external counters incremented.
- Current code-level checks: the four updated stale harnesses pass (operator UI 91, one-click UI 389, 500-topic planner 27, staged-cover runtime 5); related image/caption/motion/production-input guards also pass. `pnpm build` remains passed from the prior audit; output/v2 dynamic tracing warning remains a later speed optimization item only.
- Durable execution-store/recovery guard: 24/24 PASS. Resumable controller/executor/recovery guard: 44/44 PASS. Existing operator UI guard 91/91 and one-click UI guard 389/389 pass. `pnpm exec tsc --noEmit` and `pnpm build` pass.
- Local UI restored the accepted topic at 11/12 stages, disabled the one-step button at `owner_publication_confirmation`, and showed no console errors. A direct local `automationAdvance` request returned `blocked`, `noLive:true`, `actionCount:0`, `chainedActionCount:0`, and `automaticRetryCount:0`.
- The accepted topic also showed `실행 안전장치: 현재 자동 실행 대상 없음`; no execution receipt or lock was created because publication is outside the safe allowlist.
- The recovery UI was rechecked on a temporary port 3001 dev server: the accepted topic still restored at 11/12, showed no recovery card because no interrupted receipt exists, and remained stopped at publication confirmation. The temporary server was stopped; the pre-existing port 3000 process was preserved.

## Current Priority

1. Preserve the accepted two-part final MP4s and their preflight evidence; do not regenerate or replace them without a new Owner request.
2. Keep the content in local upload-candidate state. Do not press/upload/arm anything until the Owner gives an exact external upload approval.
3. Before any actual upload, re-run the no-upload preflight against the then-current files and ask for explicit Owner confirmation of platform metadata and the real publication action.
4. Next, define and implement a local durable job queue in planning/dry-run mode only. It should enqueue topic jobs, reconstruct the current stage, and stop at every existing Owner/paid/external/publication gate; it must not schedule or execute external actions yet.
5. Automatic external generation/publication remains later architecture work requiring separate Owner decisions; do not infer permission from the bounded executor or recovery implementation.

## Diff Cleanup State

- Working tree deliberately retains exactly three unrelated/isolated paths. Do not stage, edit, delete, or commit them without specific Owner approval:
  1. `scripts/render-golden-sample-visual-only-v1.mjs`
  2. `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  3. `scripts/get-youtube-refresh-token-once.mjs`
- No other working-tree changes are included in this state update.
