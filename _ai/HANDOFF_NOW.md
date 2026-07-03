# HANDOFF_NOW

## Absolute Rules Pointer

- 최우선 source of truth: `_ai/CREATIVE_V2_GOLDEN_SAMPLE_ABSOLUTE_RULES.md`.
- 같은 우선순위 addendum: `_ai/GOLDEN_SAMPLE_OWNER_FEEDBACK_ABSOLUTE_RULES_ADDENDUM_V1.md`.
- Golden Sample v3.2 lock/standard 문서:
  - `_ai/GOLDEN_SAMPLE_V3_2_ACCEPTANCE_LOCK.md`
  - `_ai/GOLDEN_SAMPLE_V3_2_FINAL_QA_PACKET.md`
  - `_ai/GOLDEN_SAMPLE_V3_2_PRODUCTION_STANDARD.md`
  - `scripts/fixtures/golden_sample_v3_2_acceptance_lock.t1_lifestyle_inflation.json`
  - `scripts/fixtures/golden_sample_v3_2_production_standard.v1.json`
- 최신 Owner 기준이 이전 문서/핸드오프/렌더 보고와 충돌하면 최신 Owner 기준이 우선이다.

## Current Approved Slice

- Task ID: `golden-sample-v3-2-automation-implementation-gap-analysis-v1`
- Status: approved by Owner after production standard checkpoint.
- Slice status: **COMPLETED 2026-07-03** — read-only gap analysis 완료 (`_ai/GOLDEN_SAMPLE_V3_2_AUTOMATION_IMPLEMENTATION_GAP_ANALYSIS.md`, `scripts/fixtures/golden_sample_v3_2_automation_implementation_gap_analysis.v1.json`). 구현 코드 무변경, 생성/API/TTS/render/mux/upload 0. uploadReady=false / automationExpansionReady=false / implementationApproved=false.
- Owner decision:
  - 다음 slice는 v3.2 production standard를 기존 자동화 파이프라인에 적용하기 위한 implementation gap analysis로 진행한다.
- This slice is **read-only investigation + docs/fixture planning only**.
- This slice is **not implementation** and **not upload preparation**.

## Accepted Golden Sample Basis

- Latest checkpoint: `2900bc8 docs(golden-sample): add v3.2 production standard contract`.
- Golden Sample candidate status: `ACCEPTED_AS_GOLDEN_SAMPLE_FINAL_CANDIDATE`.
- Readiness flags remain:
  - `uploadReady=false`
  - `automationExpansionReady=false`
- Final candidate mux:
  `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4`

## Goal

Map the gap between the existing automation codebase and the v3.2 production standard before any implementation.

The output should answer:

- Which existing modules/scripts already match v3.2?
- Which modules/scripts must be replaced, refactored, or bypassed?
- Where should each v3.2 standard gate live in the future pipeline?
- What should the first implementation slice be?
- What must remain blocked until explicit Owner approval?

## Scope

Allowed:

- Read existing code/scripts/fixtures/docs needed to map the pipeline.
- Use `rg`, `rg --files`, `git status -sb`, and focused reads.
- Create one Owner/Codex-readable gap analysis document.
- Create one machine-readable implementation plan fixture.
- Append concise result to `_ai/CLAUDE_REPORT.md`.
- Optionally mark this slice completed in `_ai/HANDOFF_NOW.md`.

Suggested files:

1. `_ai/GOLDEN_SAMPLE_V3_2_AUTOMATION_IMPLEMENTATION_GAP_ANALYSIS.md`
   - human-readable mapping and recommended implementation slices.

2. `scripts/fixtures/golden_sample_v3_2_automation_implementation_gap_analysis.v1.json`
   - machine-readable map of standards -> existing files -> gap -> recommended action -> risk -> first slice.

3. `_ai/CLAUDE_REPORT.md`
   - append concise result.

4. `_ai/HANDOFF_NOW.md`
   - minimal status update only if needed.

Do **not** modify implementation code.

## Investigation Targets

Investigate only as much as needed. Prefer focused `rg`/file reads.

### Story / Topic / Script

Find current modules/scripts for:

- topic selection.
- script generation / retention compiler / narrative blueprint.
- story scoring / quality scoring.
- any existing Creative v2 or Golden Sample story contracts.

Gap questions:

- Is Owner topic confirmation enforced before generation?
- Is Story-Causality First represented as a hard gate?
- Is Script Impact Gate implemented or only in v3.2 runner?
- Where should the story gate be added?

### Visual Evidence / Image Generation

Find current modules/scripts for:

- ChatGPT+Playwright image generation.
- image prompt building.
- image QA / selected image set / md5 lock.
- provider selection or fallback logic.

Gap questions:

- Does current generator use page-wide image collection and 1-2s polling?
- Does it prevent sidebar scan / stale conversation reuse?
- Does it enforce generation hard cap and detect-to-save timing?
- Does it support per-image `claim/must_show/must_not_show/no-card understanding/card role/reject reasons`?
- Does it distinguish 941x1672 technical risk from viewer-frame Owner QA?

### Renderer / Typography / Captions

Find current modules/scripts for:

- visual-only render.
- Pillow typography render.
- dynamic caption generation.
- card/caption overlap QA.

Gap questions:

- Is Pillow/Noto Sans KR Black the production renderer path or only a Golden Sample runner?
- Are bottom-fixed subtitles blocked?
- Are caption/card events anchored to real TTS word/phrase timing?
- Does renderer preserve bold info-shorts style consistently?

### TTS / Audio / Mux / Audit

Find current modules/scripts for:

- ElevenLabs one-shot TTS.
- live guard.
- word/phrase alignment extraction.
- mux.
- post-render artifact audit.

Gap questions:

- Is one-shot TTS enforced?
- Is scene-by-scene TTS blocked?
- Does the pipeline abort before live TTS if Script Impact Gate fails?
- Are padding/hard-trim/fixed-duration targets blocked?

### Orchestration / Upload Readiness

Find current modules/scripts for:

- orchestrator or end-to-end automation.
- upload queue/readiness flags.
- Instagram/YouTube upload integration.

Gap questions:

- Where is `uploadReady` set?
- Is Owner QA required before upload?
- Is automation expansion blocked until separate approval?
- What must be changed before any upload queue is generated?

## Required Output Structure

The human-readable document must include:

1. Executive summary:
   - current pipeline is not yet v3.2-compliant.
   - implementation should proceed by gates, not by immediately uploading.

2. Existing assets to reuse:
   - v3.2 ChatGPT+Playwright runners/lessons.
   - Pillow renderer lessons.
   - TTS-first mux/audit runner lessons.
   - v3.2 lock/standard fixtures.

3. Gap table:
   - standard area.
   - existing files found.
   - current status: `reuse`, `partial`, `missing`, `replace`, or `block`.
   - required action.
   - risk.

4. Recommended implementation slices:
   - Slice 1 must be low-risk and foundation-oriented.
   - Do not recommend starting with upload.
   - Suggested order should likely be:
     1. Story/visual evidence contract + static guard.
     2. ChatGPT+Playwright generation runner hardening.
     3. Pillow renderer productionization.
     4. TTS-first timing/audit integration.
     5. End-to-end dry-run.
     6. Upload readiness only after Owner QA.

5. Explicit forbidden next steps:
   - no upload.
   - no live generation/API until Owner approves a concrete slice.
   - no automation queue creation.

The JSON fixture must include:

- `status: "IMPLEMENTATION_GAP_ANALYSIS_ONLY"`
- `uploadReady: false`
- `automationExpansionReady: false`
- `implementationApproved: false`
- `recommendedFirstImplementationSlice`
- `gapMap[]`
- `blockedActions[]`
- `nextOwnerDecisionNeeded[]`

## Verification

Required checks:

- `git status -sb`
- JSON parse for new fixture.
- Scan new files for:
  - `uploadReady:true`
  - `automationExpansionReady:true`
  - `implementationApproved:true`
  - `renderReady:true`
  - secret/env/API key values.
- Confirm implementation code files were not modified by this slice.

Do not run full build unless a JSON or syntax issue requires a targeted check. This is docs/fixture only.

## Forbidden

- Implementation code edits.
- Image generation.
- ChatGPT/Playwright generation.
- OpenAI API calls.
- FLUX2/BFL calls.
- Gemini calls.
- Midjourney calls.
- ElevenLabs live TTS calls.
- Render/mux regeneration.
- Upload.
- Upload queue creation.
- Automation implementation.
- Env/secret/dependency/DB/deploy changes.
- Reading/modifying/staging `_ai/CONTEXT_TRANSFER_CODEX.md` or `piq_diag_out.txt`.
- Touching rejected salary_3days visual-only render diff:
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- Commit/push.

## Current Git Context

- Branch: `codex/source-first-blueprint-clean`, ahead 162 before this slice.
- Latest checkpoint: `2900bc8 docs(golden-sample): add v3.2 production standard contract`.
- Excluded/rejected/admin files must remain unstaged:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`

