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
- 최신 Owner 기준이 이전 문서/핸드오프/렌더 보고와 충돌하면 최신 Owner 기준이 우선이다.

## Current Approved Slice

- Task ID: `golden-sample-v3-2-owner-decision-resolution-packet-v1`
- Status: **approved by Owner 2026-07-04 KST**.
- Owner decision:
  - `승인: Slice 6 — golden-sample-v3-2-owner-decision-resolution-packet-v1를 no-live 범위로 진행. 금지 항목 유지.`
- Slice type: no-live Owner decision packet + machine-readable decision matrix + static guard only.
- This slice prepares decisions. It must not mark decisions resolved unless the Owner has explicitly chosen them in this conversation.

## Purpose

Create a concise, decision-ready packet for the 10 unresolved Owner decisions preserved by Slice 5 integrated readiness.

The packet should help the Owner choose future lanes without accidentally approving live execution:

1. Normalize each unresolved decision into key, source, current status, blocked future lanes, recommended default, alternatives, impact, risk, and exact Owner approval phrase.
2. Separate decisions that can be chosen now from decisions that must remain pending until artifacts or live plans exist.
3. Make clear that the current project verdict remains `STANDARDIZED_NO_LIVE_READY`.
4. Preserve hard prohibitions: no live TTS, render, mux, image generation, ChatGPT/Playwright, browser/CDP, upload, env/secret, dependency, DB, or deploy changes.
5. Provide a static guard so the packet cannot silently flip a decision to resolved, owner QA passed, upload ready, or production ready.

No live execution or production change is approved in this slice.

## Source Contracts To Read

Read only the minimum needed:

1. `scripts/fixtures/golden_sample_v3_2_integrated_production_readiness_contract.v1.json`
2. `scripts/fixtures/golden_sample_v3_2_integrated_production_readiness_sample_plan.t1_lifestyle_inflation.v1.json`
3. `scripts/run-golden-sample-integrated-production-readiness-standard-v1.mjs`
4. `_ai/GOLDEN_SAMPLE_V3_2_AUTOMATION_IMPLEMENTATION_GAP_ANALYSIS.md`
5. `_ai/GOLDEN_SAMPLE_V3_2_PRODUCTION_STANDARD.md`
6. `_ai/GOLDEN_SAMPLE_V3_2_FINAL_QA_PACKET.md` only if needed for Owner QA wording.
7. Prior Slice contracts only as path/reference checks if needed:
   - `scripts/fixtures/golden_sample_v3_2_story_visual_evidence_contract.v1.json`
   - `scripts/fixtures/golden_sample_v3_2_chatgpt_playwright_runner_contract.v1.json`
   - `scripts/fixtures/golden_sample_v3_2_pillow_renderer_contract.v1.json`
   - `scripts/fixtures/golden_sample_v3_2_tts_audio_audit_contract.v1.json`

Do not read protected/excluded files:

- `_ai/CONTEXT_TRANSFER_CODEX.md`
- `piq_diag_out.txt`
- `scripts/render-golden-sample-visual-only-v1.mjs`
- `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- `output/`
- `C:\tmp`

## Scope

Allowed files:

1. New machine-readable Owner decision packet fixture:
   - Recommended: `scripts/fixtures/golden_sample_v3_2_owner_decision_resolution_packet.v1.json`
   - Must be derived from Slice 5 `unresolvedOwnerDecisions`.
   - Must keep all decisions `PENDING` by default unless explicitly chosen by Owner.
   - Must include per-decision recommendation, allowed choices, blocked lanes, safety default, future approval phrase, and whether Codex recommends deciding now.

2. New human-readable Owner decision packet:
   - Recommended: `_ai/GOLDEN_SAMPLE_V3_2_OWNER_DECISION_PACKET.md`
   - Must be concise enough for Owner review.
   - Must group decisions into practical buckets:
     - decide-before-live-TTS/audio/mux
     - decide-before-live-image-runner
     - decide-before-render
     - decide-before-upload/automation
     - documentation/schema cleanup decisions
   - Must include a recommended next decision path and exact copy-ready approval snippets.
   - Must explicitly say it is **not** live approval.

3. New no-live packet validator/static guard:
   - Recommended: `scripts/check-golden-sample-v3-2-owner-decision-packet-static.mjs`
   - Must parse the decision packet fixture and the Slice 5 integrated readiness contract.
   - Must assert the packet covers all 10 unresolved decisions from Slice 5 by key.
   - Must assert no decision is silently resolved, upload ready, production ready, owner QA passed, or live approved.
   - Must assert the human-readable packet references the same decision keys and contains no live approval wording.
   - Must fail non-zero on missing decision, status mutation, live-readiness escalation, or Owner QA auto-pass.

4. Optional read-only preview harness/module only if useful:
   - Recommended only if needed: `scripts/run-golden-sample-owner-decision-packet-preview-v1.mjs`
   - Must be read-only, no-live, no-env, no-network, no-write.
   - If omitted, the static guard must provide enough validation.

5. `_ai/CLAUDE_REPORT.md`
   - Append concise reusable evidence.

6. `_ai/HANDOFF_NOW.md`
   - Update status only if needed.

Do not modify existing generation/render/TTS/upload implementation code. Do not modify Slice 0~5 artifacts unless a critical contradiction blocks this decision packet; if so, stop and report before editing.

## Required Decision Packet Content

The packet must include all Slice 5 unresolved decisions:

1. `script_impact_gate_score_authority`
2. `legacy_line_scope`
3. `upload_endpoint_disposition`
4. `blueprint_schema_unification`
5. `md5_locked_image_durability`
6. `font_vendoring`
7. `contract_duality_resolution`
8. `image_script_allow_guard`
9. `poll_25s_passive_window`
10. `owner_viewing_listening_qa`

For each decision include:

- `status`: must remain `PENDING` unless Owner explicitly chooses in this conversation.
- `source`: Slice 5 integrated readiness contract or gap analysis.
- `blocks`: future lanes blocked by the decision.
- `recommendedDefault`: conservative Codex recommendation.
- `allowedChoices`: 2-4 choices with tradeoffs.
- `decideNow`: boolean.
- `minimumEvidenceBeforeDecision`: what must exist before deciding if not now.
- `safeApprovalSnippet`: exact Owner wording that would authorize only that decision, not live execution.
- `nonApprovalWarning`: phrase preventing accidental live/upload/render/TTS approval.

## Required Safety Semantics

- Current verdict remains `STANDARDIZED_NO_LIVE_READY`.
- The packet must not approve live TTS, render, mux, image generation, ChatGPT/Playwright, upload, automation expansion, env/secret access, dependency changes, DB/deploy, or production code modification.
- Owner QA must remain direct viewing/listening and cannot be automated or treated as PASS.
- `uploadReady`, `automationExpansionReady`, `implementationApproved`, `liveTtsApproved`, `liveMuxApproved`, `liveRenderApproved`, `liveImageGenerationApproved`, `chatgptPlaywrightApproved`, `ownerQaPassed`, and `productionReady` must not become true.
- A recommended choice is not an approval.
- Copy-ready snippets must be scoped to decision resolution only unless explicitly labeled as a future separate live slice approval.

## Required Checks

Minimum:

1. `git status -sb`
2. `node --check` for every new `.mjs`
3. JSON parse for every new fixture
4. Run new static guard:
   - `node scripts/check-golden-sample-v3-2-owner-decision-packet-static.mjs`
5. If an optional preview harness is created:
   - `node scripts/run-golden-sample-owner-decision-packet-preview-v1.mjs`
6. Cheap integration sanity:
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
- Modifying prior Slice 0~5 artifacts without stopping first for Codex/Owner review.
- Marking decisions `RESOLVED`, `APPROVED`, `PASS`, or equivalent without explicit Owner choice.
- Reading/modifying/staging `_ai/CONTEXT_TRANSFER_CODEX.md` or `piq_diag_out.txt`.
- Touching rejected salary_3days diff:
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- Reading/writing `output/` or `C:\tmp`.
- Commit/push.

## Definition Of Done

- Owner decision packet fixture covers all 10 Slice 5 unresolved decisions by exact key.
- Human-readable packet gives practical choices and recommended defaults without approving live execution.
- Static guard validates fixture/doc consistency and blocks silent resolution or readiness escalation.
- Current readiness remains `STANDARDIZED_NO_LIVE_READY`.
- No forbidden action or side effect occurred.
- Required checks pass.
- `_ai/CLAUDE_REPORT.md` has concise evidence append.
- Final handoff reports changed files, checks/results, deviations/risks, checkpoint recommendation, and progress.

## Current Git Context

- Branch: `codex/source-first-blueprint-clean`, ahead 169 after checkpoint `3494d79`.
- Latest checkpoints:
  - `b4b4b2d feat(safety): add fail-closed upload hard block guard`
  - `fd4b618 feat(golden-sample): add v3.2 story visual evidence guard`
  - `aeaaf94 feat(golden-sample): add chatgpt runner standard guard`
  - `701e1ed feat(golden-sample): add pillow renderer standard guard`
  - `98913d4 feat(golden-sample): add tts audio audit standard guard`
  - `3494d79 feat(golden-sample): add integrated readiness standard guard`
- Existing unstaged/untracked excluded files must remain unstaged:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
