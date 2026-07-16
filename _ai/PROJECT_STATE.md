# AutoShorts AI — Project State

Updated: 2026-07-17 KST

## Operating State

- ROLE_MODE: `MAIN_AI_MODE`
- Main AI: Codex
- Branch: `codex/source-first-blueprint-clean`
- Remote state: local commits ahead of origin; push not approved and not performed.
- Overall Owner-facing progress: approximately 93%.

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
- A local durable planning queue is now implemented under `C:\tmp\money-shorts-os\automation-queue-v1`. Owner-selected topic membership, last persisted plan fingerprint/stage/gate, and the last explicit one-step result survive a restart.
- Queue status reconstructs every job from current artifacts instead of trusting stale queue text. The queue UI shows live completed-stage count, next gate, and execution-guard state.
- Queue advancement now has one dedicated Owner-click action, `automationQueueRunSelected`. The browser sends the selected job/action plus the preview and current-plan fingerprints; the server reconstructs the queue, verifies the full claim, rereads the live plan immediately before receipt creation, and fails closed on any drift. Only then does it reuse the bounded one-action executor, terminalize the receipt, and persist the new queue stage.
- The former per-job queue execution buttons are removed, and a legacy `automationAdvance` request with `queueJob:true` is rejected. There is no timer, background worker, automatic retry, paid action, external generation, upload, or publication authority.
- Queue lifecycle is now durable and local-only: an Owner can pause/resume one queued topic, remove its queue membership without deleting artifacts, or move only a currently complete plan into a bounded completed archive. Every lifecycle change records one of the last 24 local history events; the completed archive retains the last one-step result and execution-guard summary for up to 20 jobs.
- Paused jobs are never selected by the deterministic runner. Lifecycle buttons and archive operations report `actionCount: 0`; they do not call the bounded executor, retry a task, or alter any media/publish artifact.
- Queue status now runs a pure deterministic dry-run planner over the reconstructed live jobs. A positive persisted `queueOrder` set by an explicit Owner move is the first selection key; legacy/unprioritized jobs fall back to `createdAt`, `topicId`, and `jobId`. It selects at most one eligible job and gives every job a visible selection, wait, or skip reason. Owner-gated, complete, in-flight, manual-review, identical-recorded, unavailable-store, and unsafe jobs cannot be selected.
- The Owner can move a queued topic one place 앞으로/뒤로. The local queue atomically reindexes its contiguous priority, records a bounded history event with `actionCount:0`, and never creates a receipt or invokes the executor. The preview fingerprint binds `queueOrder` as well as job, topic, action, live-plan fingerprint, and execution-guard fingerprint, so an order change invalidates an old selected-run claim.
- The dry-run planner writes no queue state, creates no execution receipt, and executes no action. The UI shows the explicit priority plus the exact selected topic/stage/action or explains why no job is eligible.
- The queue now also derives a pure `no_submit_batch_policy_preview` from that exact dry-run. Every queued item is visibly classified as a local safe next/waiting action, paid-generation approval, Owner QA, publication approval, topic selection, paused, completed, manual recovery, or execution-blocked item. The view has no action button, creates no schedule or receipt, and leaves every side-effect flag false.
- The policy preview now has a pure `no_submit_capacity_summary`: it aggregates only the existing categories into local-safe ready/waiting, paid approval, QA, publication approval, other Owner decision, paused, recovery/blocked, and completed counts. It does not infer a schedule, change priority, or add an execution/approval action.
- Owner selected the bounded local safe-session option. The first contract-only slice now has `money_shorts_safe_session_planner_v1`: an Owner-started session may cap itself at 1~3 actions, plans at most one current allowlisted local action, independently re-fingerprints the queue selection, waits when an action is in flight, and halts on Owner stop, cap reached, no safe queue action, or invalid/stale selection.
- The safe-session planner is a pure dry-run. It creates no session/queue/receipt state, has no filesystem, process runner, network, or timer, and executes zero actions. Paid/external generation, QA decisions, upload, and publication remain disabled.
- The durable companion `money_shorts_safe_session_store_v1` now records exactly one Owner-started bounded session under `C:\\tmp\\money-shorts-os\\safe-session-v1`: session ID, 1~3 action cap, `ready`/`stop_requested` state, zero completed actions, and bounded local history. It uses one exclusive mutation lock plus atomic JSON replacement; a second session, invalid cap, corrupt store, or existing lock fails closed.
- A stop request is durable and idempotent. This slice intentionally has no worker, timer, queue dispatch, receipt creation, retry, network call, paid generation, QA action, upload, or publication action. `completedActionCount` remains zero until a later separately reviewed executor slice exists.
- The local wizard now exposes the same safe-session state as an `의도 기록 전용` card: status refresh, 1~3 cap start intent, and stop-request intent. Each API response declares `actionCount:0`, `automaticRetryCount:0`, and `chainedActionCount:0`; it calls only the local state store and cannot invoke the queue executor, receipt store, worker, timer, render, paid generation, upload, or publication path.

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
- Queue priority store guard: 23/23 PASS. Content-addressed queue planner/claim guard: 27/27 PASS. Combined resumable controller/executor/recovery/queue/planner guard: 68/68 PASS. Existing operator UI 91/91, one-click UI 389/389, `pnpm exec tsc --noEmit`, `pnpm build`, and `git diff --check` pass.
- The queue UI was checked on a temporary port 3001 dev server in an empty-queue state. It showed `계획 모드`, `다음 큐 실행 미리보기`, `미리보기 · 자동 실행 없음`, and `영수증 생성 0회`; selected-run buttons were 0 and the removed per-job execution buttons were 0. No real topic was enqueued, no receipt/action was created, and the browser tab and temporary server were stopped.
- Queue lifecycle store guard: 20/20 PASS. Paused-job planner guard: 25/25 PASS. Combined queue/executor/recovery/lifecycle guard: 65/65 PASS. Operator UI 91/91, one-click UI 389/389, TypeScript, `pnpm build`, and `git diff --check` pass.
- Lifecycle UI was rechecked on a temporary port 3001 dev server with the real queue left empty: the queue, dry-run status, and new empty archive/history contract rendered without console errors; no queue lifecycle button was clicked, no topic was enqueued, and the temporary server was stopped.
- Priority UI was rechecked on a temporary port 3001 dev server with the real queue left empty: the empty-queue state remained visible and no priority button was rendered because no job exists. No topic was enqueued, no priority action was clicked, no receipt/action was created, and the temporary server was stopped.
- Batch policy guard: 32/32 PASS. Combined queue/executor/recovery/policy guard: 71/71 PASS. Operator UI 91/91, one-click UI 389/389, `pnpm exec tsc --noEmit`, `pnpm build`, and `git diff --check` pass. The temporary port 3001 UI showed the empty batch-policy card as `계획 전용 · 실행 없음`; no queue job was added or run, and the temporary server/tab were closed.
- Capacity summary guard: 35/35 PASS. Combined queue/executor/recovery/policy/capacity guard: 74/74 PASS. Operator UI 91/91, one-click UI 389/389, `pnpm exec tsc --noEmit`, `pnpm build`, and `git diff --check` pass. The empty local queue rendered `큐 준비도 요약` as `집계 전용 · 실행 없음`; no queue job was added or run, and the temporary server/tab were closed.
- Safe-session contract guard: 15/15 PASS. Durable safe-session store guard: 14/14 PASS. Existing queue planner/capacity guard 35/35 and combined executor/recovery/queue/session guard 76/76 pass. `pnpm exec tsc --noEmit`, `pnpm build`, and `git diff --check` pass; the known 12,062-file tracing/performance warnings remain unchanged.
- Safe-session API/UI integration guard: combined executor/recovery/queue/session guard 79/79 PASS; operator UI 91/91 and one-click wizard UI 389/389 PASS. `pnpm exec tsc --noEmit`, `pnpm build`, and `git diff --check` pass. The known 12,062-file tracing/performance warnings remain unchanged.

## Current Priority

1. Preserve the accepted two-part final MP4s and their preflight evidence; do not regenerate or replace them without a new Owner request.
2. Keep the content in local upload-candidate state. Do not press/upload/arm anything until the Owner gives an exact external upload approval.
3. Before any actual upload, re-run the no-upload preflight against the then-current files and ask for explicit Owner confirmation of platform metadata and the real publication action.
4. Owner chose the Owner-started bounded local safe-session path. The contract, durable state store, and Owner start/stop/status UI are complete. The next candidate is a standalone session coordinator dry-run that reads this state plus the queue, returns at most one exact safe claim, and still invokes no worker or queue action.
5. A real worker/executor remains a later separately reviewed slice. An always-on cron, paid/external generation, QA bypass, upload, or publication scheduler is not approved and requires separate architecture and exact approval.
6. Do not activate or reuse `n8n/workflow_autoshorts.json`: it is a legacy inactive workflow that bypasses the current queue/receipt/Owner gates, calls old `/api/auto` and `/api/upload` routes, and contains a credential-like literal. The legacy upload route is currently fail-closed, but that does not make the workflow a valid scheduler foundation.

## Diff Cleanup State

- Working tree deliberately retains exactly three unrelated/isolated paths. Do not stage, edit, delete, or commit them without specific Owner approval:
  1. `scripts/render-golden-sample-visual-only-v1.mjs`
  2. `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  3. `scripts/get-youtube-refresh-token-once.mjs`
- The current uncommitted slice is limited to the durable safe-session store, its API/UI integration, associated guards, and these two state documents. The protected three paths remain excluded.
