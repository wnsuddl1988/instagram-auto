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
  - `3494d79 feat(golden-sample): add integrated readiness standard guard`
  - `37fda6d feat(golden-sample): add owner decision packet guard`
- 최신 Owner 기준이 이전 문서/핸드오프/렌더 보고와 충돌하면 최신 Owner 기준이 우선이다.

## Current Approved Slice

- Task ID: `golden-sample-v3-2-owner-decisions-now-resolution-state-v1`
- Status: **approved by Owner 2026-07-04 KST**.
- Owner decision source:
  - Codex asked whether to confirm four `decideNow=true` decisions from Slice 6.
  - Owner replied: `그래 진행해 다 구현되고 나면 또 얘기해보자`.
- Interpretation:
  - Resolve the four recommended `decideNow=true` policy decisions listed below.
  - Continue no-live preparation slices without asking after every small slice.
  - Still stop for explicit approval before any live/API/cost/render/mux/upload/env/dependency/DB/deploy action.
- Slice type: no-live decision-resolution state fixture + static guard + packet doc update only.

## Resolved Decisions To Record

Record exactly these four decisions as Owner-resolved policy choices:

1. `script_impact_gate_score_authority = codex_judge_with_mandatory_provenance`
   - Scope: scoring authority/provenance policy only.
   - Not approval for live TTS/audio/mux.
2. `font_vendoring = vendor_noto_black_vf_remove_system_dependency`
   - Scope: font policy only.
   - Not approval to add font files, change dependencies, render, or mux.
3. `image_script_allow_guard = add_allow_guard_to_all_paid_image_scripts`
   - Scope: guard policy only.
   - Not approval to call image APIs, run ChatGPT/Playwright/browser, or generate images.
4. `poll_25s_passive_window = accept_25s_passive_window_as_v3_2_behavior`
   - Scope: timing interpretation only.
   - Not approval to run ChatGPT/Playwright/browser/CDP.

All other Owner decisions remain pending:

- `legacy_line_scope`
- `upload_endpoint_disposition`
- `blueprint_schema_unification`
- `md5_locked_image_durability`
- `contract_duality_resolution`
- `owner_viewing_listening_qa`

Current readiness remains `STANDARDIZED_NO_LIVE_READY`. No live execution is approved.

## Purpose

Persist the Owner's four policy decisions in a machine-readable state so future no-live and live-prep slices can consume the decision state without re-asking.

This slice must:

1. Preserve Slice 6 decision packet as the recommendation source.
2. Add a current decision state fixture that marks exactly four decisions resolved by Owner and six still pending.
3. Update the human-readable decision packet with a short current-state section.
4. Add a static guard that prevents accidental readiness escalation or over-interpreting the decisions as live approval.

## Source Contracts To Read

Read only the minimum needed:

1. `scripts/fixtures/golden_sample_v3_2_owner_decision_resolution_packet.v1.json`
2. `_ai/GOLDEN_SAMPLE_V3_2_OWNER_DECISION_PACKET.md`
3. `scripts/check-golden-sample-v3-2-owner-decision-packet-static.mjs`
4. `scripts/fixtures/golden_sample_v3_2_integrated_production_readiness_contract.v1.json`
5. `scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`

Do not read protected/excluded files:

- `_ai/CONTEXT_TRANSFER_CODEX.md`
- `piq_diag_out.txt`
- `scripts/render-golden-sample-visual-only-v1.mjs`
- `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- `output/`
- `C:\tmp`

## Scope

Allowed files:

1. New decision state fixture:
   - Recommended: `scripts/fixtures/golden_sample_v3_2_owner_decision_resolution_state.v1.json`
   - Must reference the Slice 6 decision packet and this Owner approval source.
   - Must include exactly four resolved decisions with chosen values above.
   - Must include exactly six pending decisions.
   - Must keep all readiness/live/upload/automation flags false.

2. New no-live static guard:
   - Recommended: `scripts/check-golden-sample-v3-2-owner-decision-resolution-state-static.mjs`
   - Must parse the state fixture, Slice 6 decision packet, and Slice 5 integrated readiness contract.
   - Must assert resolved values equal the packet's recommendedDefault for the four decideNow decisions.
   - Must assert all six non-decideNow decisions remain pending.
   - Must assert no live/upload/render/TTS/image/browser/env/dependency/DB/deploy approval is implied.
   - Must include mutant checks for:
     - resolving a fifth decision,
     - changing one of the four chosen values,
     - setting ownerQaPassed/uploadReady/productionReady/live flags true,
     - treating font vendoring as font file commit approval,
     - treating image guard decision as API execution approval.

3. Update human-readable decision packet:
   - `_ai/GOLDEN_SAMPLE_V3_2_OWNER_DECISION_PACKET.md`
   - Add a short "Current Owner decisions" section near the top.
   - Preserve the warning that this is not live execution approval.

4. `_ai/CLAUDE_REPORT.md`
   - Append concise reusable evidence.

5. `_ai/HANDOFF_NOW.md`
   - Update status only if needed.

Prefer not to modify the original Slice 6 packet fixture. Treat it as the recommendation packet. Use the new state fixture as the current decision-state source.

## Required Safety Semantics

- Current verdict remains `STANDARDIZED_NO_LIVE_READY`.
- The four resolved decisions are policy choices only.
- The state fixture must not set:
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
- Owner QA remains pending and manual.
- Font vendoring decision does not add font files or dependencies.
- Image allow-guard decision does not run APIs or generate images.
- Poll timing decision does not run ChatGPT/Playwright/browser.

## Required Checks

Minimum:

1. `git status -sb`
2. `node --check` for every new `.mjs`
3. JSON parse for every new fixture
4. Run new state guard:
   - `node scripts/check-golden-sample-v3-2-owner-decision-resolution-state-static.mjs`
5. Regression sanity:
   - `node scripts/check-golden-sample-v3-2-owner-decision-packet-static.mjs`
   - `node scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`

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
- Adding font files or changing dependencies.
- Modifying prior Slice 0~6 artifacts except the human-readable decision packet doc noted above.
- Marking the six pending decisions as resolved.
- Marking Owner QA as passed.
- Reading/modifying/staging `_ai/CONTEXT_TRANSFER_CODEX.md` or `piq_diag_out.txt`.
- Touching rejected salary_3days diff:
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- Reading/writing `output/` or `C:\tmp`.
- Commit/push.

## Definition Of Done

- Decision state fixture records the four Owner-resolved policy decisions exactly.
- Six other decisions remain pending.
- Human decision packet clearly shows current chosen state and still says no live approval.
- Static guard validates packet/state/integrated contract consistency and fail-closed mutants.
- Required checks pass.
- `_ai/CLAUDE_REPORT.md` has concise evidence append.
- No forbidden action or side effect occurred.
- Final handoff reports changed files, checks/results, deviations/risks, checkpoint recommendation, and progress.

## Current Git Context

- Branch: `codex/source-first-blueprint-clean`, ahead 170 after checkpoint `37fda6d`.
- Latest checkpoints:
  - `b4b4b2d feat(safety): add fail-closed upload hard block guard`
  - `fd4b618 feat(golden-sample): add v3.2 story visual evidence guard`
  - `aeaaf94 feat(golden-sample): add chatgpt runner standard guard`
  - `701e1ed feat(golden-sample): add pillow renderer standard guard`
  - `98913d4 feat(golden-sample): add tts audio audit standard guard`
  - `3494d79 feat(golden-sample): add integrated readiness standard guard`
  - `37fda6d feat(golden-sample): add owner decision packet guard`
- Existing unstaged/untracked excluded files must remain unstaged:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
