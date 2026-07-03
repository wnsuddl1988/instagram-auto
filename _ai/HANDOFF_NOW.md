# HANDOFF_NOW

## Absolute Rules Pointer

- 최우선 source of truth: `_ai/CREATIVE_V2_GOLDEN_SAMPLE_ABSOLUTE_RULES.md`.
- 같은 우선순위 addendum: `_ai/GOLDEN_SAMPLE_OWNER_FEEDBACK_ABSOLUTE_RULES_ADDENDUM_V1.md`.
- Golden Sample v3.2 lock/standard/gap 문서:
  - `_ai/GOLDEN_SAMPLE_V3_2_ACCEPTANCE_LOCK.md`
  - `_ai/GOLDEN_SAMPLE_V3_2_FINAL_QA_PACKET.md`
  - `_ai/GOLDEN_SAMPLE_V3_2_PRODUCTION_STANDARD.md`
  - `_ai/GOLDEN_SAMPLE_V3_2_AUTOMATION_IMPLEMENTATION_GAP_ANALYSIS.md`
  - `scripts/fixtures/golden_sample_v3_2_acceptance_lock.t1_lifestyle_inflation.json`
  - `scripts/fixtures/golden_sample_v3_2_production_standard.v1.json`
  - `scripts/fixtures/golden_sample_v3_2_automation_implementation_gap_analysis.v1.json`
- Latest safety checkpoints:
  - `b4b4b2d feat(safety): add fail-closed upload hard block guard`
  - `fd4b618 feat(golden-sample): add v3.2 story visual evidence guard`
  - `aeaaf94 feat(golden-sample): add chatgpt runner standard guard`
  - `701e1ed feat(golden-sample): add pillow renderer standard guard`
- 최신 Owner 기준이 이전 문서/핸드오프/렌더 보고와 충돌하면 최신 Owner 기준이 우선이다.

## Current Approved Slice

- Task ID: `golden-sample-v3-2-tts-audio-audit-standardization-v1`
- Status: **approved by Owner 2026-07-03 KST**.
- Owner decision:
  - `승인: Slice 4 — golden-sample-v3-2-tts-audio-audit-standardization-v1를 no-live 범위로 진행. 금지 항목 유지.`
- Slice type: no-live TTS-first timing/audio/audit contract + dry-run harness + static guard only.
- Readiness flags remain:
  - `uploadReady=false`
  - `automationExpansionReady=false`
  - `implementationApproved=false` for upload/automation expansion.

## Purpose

Create a reusable, no-live standard boundary for Golden Sample v3.2 TTS-first timing, audio gate, mux policy, and artifact audit.

This slice should convert lessons from the v3.2 runner into fixture-driven contracts and static guards:

1. Script Impact Gate must pass before any future live TTS.
2. One-shot full narration is the only approved TTS shape; scene-by-scene TTS is forbidden.
3. Word/phrase timestamp re-anchor is mandatory: tolerance `±120ms`, v3.2 lock max observed entry delta `<=50ms`.
4. Natural speech length determines final length; padding, hard trim, fixed 30/40/60s targets, `apad`, `-shortest`, `-t` hard trim, and atempo-fit legacy routes are forbidden for v3.2 standard output.
5. Canonical audio gate thresholds must be machine-readable: `silencedetect -35dB/0.35`, start silence `<=0.6s`, first5 silence `<=0.8s`, silence ratio `<=0.18`, speech active `>=0.72`, clipped tail forbidden, tail hold `0.3~0.8s`.
6. Artifact audit must require media/audio/caption/story gates, frames/evidence references, vision `PENDING`, and `uploadReady=false`.
7. Technical pass must not be treated as Owner QA pass.
8. Existing accepted evidence runners should be treated as lineage sources, not edited live paths.

No live TTS, API call, audio/video generation, ffmpeg/ffprobe/silencedetect execution, render, mux, upload, env/dependency, DB, or deploy action is approved in this slice.

## Source Contracts To Read

Read only the minimum needed:

1. `_ai/GOLDEN_SAMPLE_V3_2_PRODUCTION_STANDARD.md`
2. `_ai/GOLDEN_SAMPLE_V3_2_AUTOMATION_IMPLEMENTATION_GAP_ANALYSIS.md`
3. `scripts/fixtures/golden_sample_v3_2_production_standard.v1.json`
4. `scripts/fixtures/golden_sample_v3_2_acceptance_lock.t1_lifestyle_inflation.json`
5. `scripts/fixtures/golden_sample_t1_lifestyle_inflation_tts_first_mux_manifest.v3_2.json`
6. `scripts/fixtures/golden_sample_t1_lifestyle_inflation_visual_render_manifest.v3_2_tts_anchored.json`
7. Existing v3.2/v3.1 TTS/timing/audio/audit lineage, targeted only:
   - `scripts/run-golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit.mjs`
   - `scripts/run-golden-sample-chatgpt-playwright-v3-1-tts-first-mux-audit.mjs`
   - `scripts/run-golden-sample-tts-first-mux-audit-v1.mjs` only if needed to identify older/deprecated behavior.
8. Prior Slice contracts only when needed for integration references:
   - `scripts/fixtures/golden_sample_v3_2_story_visual_evidence_contract.v1.json`
   - `scripts/fixtures/golden_sample_v3_2_chatgpt_playwright_runner_contract.v1.json`
   - `scripts/fixtures/golden_sample_v3_2_pillow_renderer_contract.v1.json`

Do not read protected files:

- `_ai/CONTEXT_TRANSFER_CODEX.md`
- `piq_diag_out.txt`
- `scripts/render-golden-sample-visual-only-v1.mjs`
- `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- `output/`
- `C:\tmp`

## Scope

Allowed files:

1. New standard TTS/audio/audit contract fixture:
   - Recommended: `scripts/fixtures/golden_sample_v3_2_tts_audio_audit_contract.v1.json`
   - Must define no-live policy, Script Impact Gate dependency, one-shot TTS contract, live-call guard model, timing/re-anchor contract, audio gate thresholds, mux natural-duration policy, artifact audit readiness, forbidden legacy routes, and unresolved Owner decisions.

2. New no-live sample plan fixture:
   - Recommended: `scripts/fixtures/golden_sample_v3_2_tts_audio_audit_sample_plan.t1_lifestyle_inflation.v1.json`
   - It should reference the accepted v3.2 TTS-first mux manifest, visual render manifest, acceptance lock, production standard, and prior Slice contracts.
   - It must be a plan/contract fixture only, not an approval to call TTS, render, mux, or audit media.

3. New no-live standard harness/module:
   - Recommended: `scripts/run-golden-sample-tts-audio-audit-standard-v1.mjs`
   - In this slice it must support dry-run/static validation only.
   - It must not call live TTS, inspect env/secrets, spawn child processes, invoke ffmpeg/ffprobe/silencedetect, render/mux, read audio/video files, write files, or use network.
   - It should encode reusable pure logic surfaces for Script Impact Gate validation, timing-anchor validation, audio-threshold validation, mux-policy validation, artifact-audit readiness validation, and forbidden-route checks.
   - Future live TTS/audio/mux/audit slice must import this standard surface instead of creating another runner clone.

4. New static guard:
   - Recommended: `scripts/check-golden-sample-v3-2-tts-audio-audit-static.mjs`
   - Must be no-live, no-network, no-env, no-secret, no-browser, no-render, no-mux, no-audio-read, no-write.
   - It should assert contract/plan/harness compliance and cross-check key v3.2 standard facts.

5. `_ai/CLAUDE_REPORT.md`
   - Append concise reusable evidence.

6. `_ai/HANDOFF_NOW.md`
   - Update slice status only if needed.

Do not modify existing generation/render/TTS/upload implementation code unless a tiny pure helper is absolutely necessary and clearly justified. Prefer new files to avoid contaminating accepted v3.1/v3.2 evidence runners.

## Required Contract Semantics

### No-live policy

- This slice does not approve live TTS, audio analysis, muxing, rendering, or artifact regeneration.
- Default execution must be dry-run/static validation only.
- Any live/audio/mux/render-like CLI flag must fail closed with a non-zero exit.
- No env/secret access, network, child process, ffmpeg/ffprobe/silencedetect execution, audio/video file read, or file writes in the default path.

### Script Impact Gate

- Future live TTS requires Story Gate pass before any live call.
- Thresholds must match production standard:
  - `hook_self_relevance >= 90`
  - `story_causality >= 90`
  - `problem_solution_bridge >= 90`
  - `solution_specificity >= 90`
  - `save_worthiness >= 88`
  - `spoken_naturalness >= 88`
- Hard fails must include generic hook, missing bridge, abstract-only solution, unnamed "3개/세 가지", invented fact/statistic, and unapproved topic change.
- Score production remains unresolved Owner decision #1. The contract must require score provenance and must not silently bless self-assessment as automatic truth.

### TTS call shape and live guard

- One-shot full narration only.
- Scene-by-scene TTS is forbidden.
- Timestamp-less fallback provider is forbidden for v3.2 standard timing.
- Future live call requires explicit Owner-approved fixture with call cap, voice/model, cost cap, stop conditions, and guard convention.
- This slice must not read env flags or secrets. Guard names may be referenced as lineage/concept only if scan-clean or split/withheld.

### Timing and re-anchor

- Word/phrase timestamp re-anchor is mandatory.
- Anchor tolerance: `±120ms`.
- v3.2 lock observed max entry delta: `<=50ms`.
- Anchor miss must fail fast; do not silently approximate.
- Minimum dwell and reflow rules must be machine-readable.
- Caption/card entry must be tied to actual spoken timing, not char-weight scene duration.

### Mux/natural duration policy

- Final length is determined by natural speech duration plus tail hold.
- Tail hold target: `0.3~0.8s`.
- Padding, hard trim, fixed 30/40/60 second targets, scene-fit atempo, `apad`, `-shortest`, and hard `-t` trim are forbidden for v3.2 standard output.
- This slice defines policy only; it must not run mux or inspect media.

### Audio gate

- Canonical threshold source is v3.2 production standard / acceptance lock.
- Required audio gate values:
  - silence detection: `-35dB` / `0.35s`
  - start silence `<=0.6s`
  - first5 silence `<=0.8s`
  - silence ratio `<=0.18`
  - speech active ratio `>=0.72`
  - clipped tail: forbidden
  - tail hold `0.3~0.8s`
- The guard/harness should validate threshold fixtures and sample summary data, not run audio tools.

### Artifact audit readiness

- Future artifact audit must include media/audio/caption/story gates.
- Vision QA may be `PENDING`; `PENDING` must not be treated as final PASS.
- `uploadReady` must remain false until Owner upload approval.
- `automationExpansionReady` must remain false until separate automation approval.
- Technical pass must not become Owner viewing/listening pass.

## Required Checks

Minimum:

1. `git status -sb`
2. `node --check` for every new `.mjs`
3. JSON parse for every new fixture
4. Run new dry-run harness:
   - `node scripts/run-golden-sample-tts-audio-audit-standard-v1.mjs`
5. Run new static guard:
   - `node scripts/check-golden-sample-v3-2-tts-audio-audit-static.mjs`

The static guard must print a clear PASS count and fail non-zero on violation.

Also scan executable new/changed `.mjs` files for forbidden execution patterns:

- `child_process`
- `spawn(`
- `exec(`
- `execFile(`
- `process.env`
- `fetch(`
- `writeFile`
- `appendFile`
- `mkdir`
- `rmSync`
- `unlink`
- `rename`
- `createReadStream`
- `readFileSync(` on audio/video paths
- `node:http`
- `node:https`
- `node:net`
- `node:tls`
- `WebSocket`
- `chromium.launch`
- `page.goto`
- `browser.newPage`

Also scan all new/changed Slice 4 files for forbidden readiness flags:

- `uploadReady: true`
- `automationExpansionReady: true`
- `implementationApproved: true`
- `liveTtsApproved: true`
- `liveMuxApproved: true`
- `ownerQaPassed: true`

Allowed exception: scanner denylist strings inside the static guard must be split or explicitly reported as scanner denylist text, not executable behavior. Contract/plan fixtures may contain conceptual audio/mux terms only as policy/reference text; they must not authorize execution.

Do not run full build unless a syntax/import issue requires it.

## Forbidden

- Live TTS or paid/free TTS API call.
- Env/secret reads or writes.
- Audio/video file read for analysis.
- ffmpeg/ffprobe/silencedetect execution.
- render/mux regeneration.
- Audio/video generation.
- ChatGPT/Playwright execution.
- Browser/Chrome/CDP launch.
- Image generation.
- OpenAI API.
- FLUX2/BFL API.
- Gemini/Midjourney.
- ElevenLabs live TTS.
- upload or upload queue.
- live HTTP POST to `/api/upload`.
- dependency/lockfile changes.
- DB/schema/deploy changes.
- Modifying production generation/render/TTS/upload code.
- Reading/modifying/staging `_ai/CONTEXT_TRANSFER_CODEX.md` or `piq_diag_out.txt`.
- Touching rejected salary_3days diff:
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- Reading/writing `output/` or `C:\tmp`.
- Commit/push.

## Definition Of Done

- TTS/audio/audit standard is machine-readable as a contract fixture.
- A sample no-live plan references the v3.2 TTS-first mux manifest, visual render manifest, production standard, and acceptance lock.
- A no-live standard harness/module exists without live TTS, env, network, child process, audio/video read, mux/render, or writes.
- Static guard validates contract/plan/harness and blocks live/audio/mux/env/API/write behavior.
- Script Impact Gate thresholds and score-provenance requirements are defined.
- Timing re-anchor, audio gate, natural-duration mux, and artifact audit readiness are defined and tested against fixture/sample data.
- Forbidden legacy TTS/audio/mux routes are explicitly blocked.
- All required checks pass.
- `_ai/CLAUDE_REPORT.md` has concise evidence append.
- No forbidden action or side effect occurred.
- Final handoff reports changed files, checks/results, deviations/risks, checkpoint recommendation, and progress.

## Current Git Context

- Branch: `codex/source-first-blueprint-clean`, ahead 167 after checkpoint `701e1ed`.
- Latest checkpoints:
  - `b4b4b2d feat(safety): add fail-closed upload hard block guard`
  - `fd4b618 feat(golden-sample): add v3.2 story visual evidence guard`
  - `aeaaf94 feat(golden-sample): add chatgpt runner standard guard`
  - `701e1ed feat(golden-sample): add pillow renderer standard guard`
- Existing unstaged/untracked excluded files must remain unstaged:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`

