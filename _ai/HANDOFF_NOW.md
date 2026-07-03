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
- Latest safety/standard checkpoints:
  - `b4b4b2d feat(safety): add fail-closed upload hard block guard`
  - `fd4b618 feat(golden-sample): add v3.2 story visual evidence guard`
  - `aeaaf94 feat(golden-sample): add chatgpt runner standard guard`
  - `701e1ed feat(golden-sample): add pillow renderer standard guard`
  - `98913d4 feat(golden-sample): add tts audio audit standard guard`
- 최신 Owner 기준이 이전 문서/핸드오프/렌더 보고와 충돌하면 최신 Owner 기준이 우선이다.

## Current Approved Slice

- Task ID: `golden-sample-v3-2-integrated-production-readiness-standardization-v1`
- Status: **approved by Owner 2026-07-04 KST**.
- Owner decision:
  - `승인: Slice 5 — golden-sample-v3-2-integrated-production-readiness-standardization-v1를 no-live 범위로 진행. 금지 항목 유지.`
- Slice type: no-live integrated production-readiness contract + dry-run harness + static guard only.
- Readiness flags remain:
  - `uploadReady=false`
  - `automationExpansionReady=false`
  - `implementationApproved=false` for live/render/TTS/upload/automation expansion.

## Purpose

Create one integrated no-live production-readiness standard for Golden Sample v3.2 by composing the already checkpointed Slice 0~4 contracts and guards.

This slice must answer, in machine-readable form:

1. Which Slice 0~4 standard artifacts are mandatory before any future live/render/TTS/upload expansion.
2. Which gates are already contractually fixed and which Owner decisions remain unresolved.
3. Which future actions are still forbidden until explicit Owner approval.
4. Which readiness state is allowed now: **standardized no-live readiness only**, not live production approval.
5. Which prior guards must pass as prerequisites, without re-running live tools or cloning their logic ad hoc.

No live TTS, API call, audio/video read, render, mux, upload, image generation, ChatGPT/Playwright, browser/CDP, env/dependency, DB, or deploy action is approved in this slice.

## Source Contracts To Read

Read only the minimum needed:

1. `_ai/GOLDEN_SAMPLE_V3_2_PRODUCTION_STANDARD.md`
2. `_ai/GOLDEN_SAMPLE_V3_2_AUTOMATION_IMPLEMENTATION_GAP_ANALYSIS.md`
3. `scripts/fixtures/golden_sample_v3_2_production_standard.v1.json`
4. `scripts/fixtures/golden_sample_v3_2_acceptance_lock.t1_lifestyle_inflation.json`
5. Slice 0 upload hard block artifacts:
   - `lib/upload-hard-block.ts`
   - `scripts/check-golden-sample-upload-hard-block-static.mjs`
   - `scripts/fixtures/golden_sample_v3_2_upload_hard_block_policy.v1.json`
6. Slice 1 story/visual evidence artifacts:
   - `scripts/fixtures/golden_sample_v3_2_story_visual_evidence_contract.v1.json`
   - `scripts/fixtures/golden_sample_v3_2_story_visual_evidence_sample.t1_lifestyle_inflation.v1.json`
   - `scripts/check-golden-sample-v3-2-story-visual-evidence-static.mjs`
7. Slice 2 ChatGPT+Playwright runner standard artifacts:
   - `scripts/fixtures/golden_sample_v3_2_chatgpt_playwright_runner_contract.v1.json`
   - `scripts/fixtures/golden_sample_v3_2_chatgpt_playwright_runner_sample_plan.t1_lifestyle_inflation.v1.json`
   - `scripts/run-golden-sample-chatgpt-playwright-standard-image-runner-v1.mjs`
   - `scripts/check-golden-sample-v3-2-chatgpt-playwright-runner-static.mjs`
8. Slice 3 Pillow renderer standard artifacts:
   - `scripts/fixtures/golden_sample_v3_2_pillow_renderer_contract.v1.json`
   - `scripts/fixtures/golden_sample_v3_2_pillow_renderer_sample_plan.t1_lifestyle_inflation.v1.json`
   - `scripts/run-golden-sample-pillow-renderer-standard-v1.mjs`
   - `scripts/check-golden-sample-v3-2-pillow-renderer-static.mjs`
9. Slice 4 TTS/audio/audit standard artifacts:
   - `scripts/fixtures/golden_sample_v3_2_tts_audio_audit_contract.v1.json`
   - `scripts/fixtures/golden_sample_v3_2_tts_audio_audit_sample_plan.t1_lifestyle_inflation.v1.json`
   - `scripts/run-golden-sample-tts-audio-audit-standard-v1.mjs`
   - `scripts/check-golden-sample-v3-2-tts-audio-audit-static.mjs`

Do not read protected/excluded files:

- `_ai/CONTEXT_TRANSFER_CODEX.md`
- `piq_diag_out.txt`
- `scripts/render-golden-sample-visual-only-v1.mjs`
- `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- `output/`
- `C:\tmp`

## Scope

Allowed files:

1. New integrated readiness contract fixture:
   - Recommended: `scripts/fixtures/golden_sample_v3_2_integrated_production_readiness_contract.v1.json`
   - Must reference Slice 0~4 mandatory artifacts and checkpoints.
   - Must define readiness levels, required gates, unresolved Owner decisions, live/render/TTS/upload prohibitions, and fail-closed policy.

2. New integrated sample readiness plan fixture:
   - Recommended: `scripts/fixtures/golden_sample_v3_2_integrated_production_readiness_sample_plan.t1_lifestyle_inflation.v1.json`
   - Must compose the t1 lifestyle inflation accepted lineage without granting live execution.
   - Must set all live/render/TTS/upload/automation readiness flags false or pending as appropriate.

3. New no-live integrated readiness harness/module:
   - Recommended: `scripts/run-golden-sample-integrated-production-readiness-standard-v1.mjs`
   - In this slice it must support dry-run/static validation only.
   - It must not call live TTS, inspect env/secrets, spawn child processes, invoke ffmpeg/ffprobe/silencedetect, render/mux, read audio/video/image files, launch browser/Playwright, call network, write files, or upload.
   - It should export reusable pure logic for readiness-level evaluation, mandatory artifact presence, prior-slice contract reference validation, unresolved Owner decision detection, forbidden readiness flag detection, live-action prohibition detection, and checkpoint summary generation.
   - Future live/render/TTS/upload expansion must import this integrated standard surface instead of creating another orchestration clone.

4. New static guard:
   - Recommended: `scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`
   - Must be no-live, no-network, no-env, no-secret, no-browser, no-render, no-mux, no-audio/video/image-read, no-write.
   - It should assert contract/plan/harness compliance and cross-check Slice 0~4 required artifact paths.
   - It should import the new harness and at least enough prior harnesses/helpers to prove integration references are real, without executing live paths.

5. `_ai/CLAUDE_REPORT.md`
   - Append concise reusable evidence.

6. `_ai/HANDOFF_NOW.md`
   - Update status only if needed.

Do not modify existing generation/render/TTS/upload implementation code. Do not modify prior Slice 0~4 artifacts unless a critical contradiction blocks this integrated slice; if so, stop and report before editing.

## Required Integrated Contract Semantics

### Current readiness verdict

- Current allowed verdict must be a no-live readiness state, for example `STANDARDIZED_NO_LIVE_READY` or equivalent.
- It must not be named or treated as upload-ready, production-live-ready, automation-ready, render-ready, TTS-live-ready, or owner-final-approved.
- Technical pass and static readiness must not substitute for Owner viewing/listening/approval.

### Mandatory Slice 0~4 composition

- Slice 0 upload hard block must remain active and must keep upload impossible by default.
- Slice 1 story/visual evidence guard must be required before image-generation expansion.
- Slice 2 ChatGPT+Playwright runner standard must be required before any future image runner live slice.
- Slice 3 Pillow renderer standard must be required before any future render slice.
- Slice 4 TTS/audio/audit standard must be required before any future live TTS/audio/mux/audit slice.
- The integrated contract must reference these by fixture path and guard path, not by prose only.

### Unresolved Owner decisions

The integrated contract must preserve unresolved decisions as blockers or pending conditions, including at minimum:

- Script Impact Gate score production authority (Owner decision #1).
- Font vendoring / approved font availability for renderer (Owner decision #6).
- 25s passive window interpretation for ChatGPT runner timing (Owner decision #9).
- Owner direct viewing/listening QA for final acceptance.
- Explicit future approval for live TTS/API, render/mux, ChatGPT/Playwright generation, upload, automation expansion, env/secret use, dependency changes, and production deployment.

### Prohibited readiness escalation

The contract/plan/harness must fail closed if any of these become true without explicit future Owner approval:

- `uploadReady`
- `automationExpansionReady`
- `implementationApproved`
- `liveTtsApproved`
- `liveMuxApproved`
- `liveRenderApproved`
- `liveImageGenerationApproved`
- `chatgptPlaywrightApproved`
- `ownerQaPassed`
- `productionReady`

Equivalent differently named flags must also be treated cautiously. If a flag is ambiguous, default to not ready / pending.

### No-live policy

- Default execution must be dry-run/static validation only.
- Any live/render/mux/TTS/upload/browser/image-generation/audio-analysis CLI flag must fail closed with a non-zero exit.
- No env/secret access, network, child process, browser/CDP/Playwright launch, ffmpeg/ffprobe/silencedetect execution, audio/video/image file read, or file write in the default path.

### Future expansion gates

The integrated contract should describe future gate order without approving execution:

1. Owner decision resolves pending blockers.
2. Script Impact Gate provenance is accepted.
3. Live-call plan fixture exists with call/cost caps and stop conditions.
4. Relevant Slice 1~4 standard harness is imported, not cloned.
5. Artifact output is audited against acceptance lock / production standard.
6. Owner direct viewing/listening QA remains separate from technical pass.
7. Upload remains blocked until explicit upload approval.

## Required Checks

Minimum:

1. `git status -sb`
2. `node --check` for every new `.mjs`
3. JSON parse for every new fixture
4. Run new dry-run harness:
   - `node scripts/run-golden-sample-integrated-production-readiness-standard-v1.mjs`
5. Run new static guard:
   - `node scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`

The static guard must print a clear PASS count and fail non-zero on violation.

Also run the prior no-live guards only if cheap and relevant to prove composition still holds:

- `node scripts/check-golden-sample-upload-hard-block-static.mjs`
- `node scripts/check-golden-sample-v3-2-story-visual-evidence-static.mjs`
- `node scripts/check-golden-sample-v3-2-chatgpt-playwright-runner-static.mjs`
- `node scripts/check-golden-sample-v3-2-pillow-renderer-static.mjs`
- `node scripts/check-golden-sample-v3-2-tts-audio-audit-static.mjs`

Do not run full build unless a syntax/import issue requires it.

## Forbidden

- Live TTS or paid/free TTS API call.
- Env/secret reads or writes.
- Audio/video/image file read for analysis.
- ffmpeg/ffprobe/silencedetect execution.
- render/mux regeneration.
- Audio/video/image generation.
- ChatGPT/Playwright execution.
- Browser/Chrome/CDP launch.
- OpenAI API.
- FLUX2/BFL API.
- Gemini/Midjourney.
- ElevenLabs live TTS.
- upload or upload queue.
- live HTTP POST to `/api/upload`.
- dependency/lockfile changes.
- DB/schema/deploy changes.
- Modifying production generation/render/TTS/upload code.
- Modifying prior Slice 0~4 artifacts without stopping first for Codex/Owner review.
- Reading/modifying/staging `_ai/CONTEXT_TRANSFER_CODEX.md` or `piq_diag_out.txt`.
- Touching rejected salary_3days diff:
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- Reading/writing `output/` or `C:\tmp`.
- Commit/push.

## Definition Of Done

- Integrated production readiness standard is machine-readable as a contract fixture.
- Sample no-live readiness plan composes Slice 0~4 artifacts and keeps all live/render/TTS/upload/automation readiness false or pending.
- No-live integrated harness/module exists without live TTS, env, network, child process, browser, audio/video/image reads, mux/render/upload, or writes.
- Static guard validates contract/plan/harness and required Slice 0~4 references.
- The current verdict is explicitly no-live readiness only, not production/upload/live readiness.
- Unresolved Owner decisions are preserved as blockers/pending conditions.
- Forbidden readiness escalation and live/action flags are fail-closed.
- All required checks pass.
- `_ai/CLAUDE_REPORT.md` has concise evidence append.
- No forbidden action or side effect occurred.
- Final handoff reports changed files, checks/results, deviations/risks, checkpoint recommendation, and progress.

## Current Git Context

- Branch: `codex/source-first-blueprint-clean`, ahead 168 after checkpoint `98913d4`.
- Latest checkpoints:
  - `b4b4b2d feat(safety): add fail-closed upload hard block guard`
  - `fd4b618 feat(golden-sample): add v3.2 story visual evidence guard`
  - `aeaaf94 feat(golden-sample): add chatgpt runner standard guard`
  - `701e1ed feat(golden-sample): add pillow renderer standard guard`
  - `98913d4 feat(golden-sample): add tts audio audit standard guard`
- Existing unstaged/untracked excluded files must remain unstaged:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
