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
- 최신 Owner 기준이 이전 문서/핸드오프/렌더 보고와 충돌하면 최신 Owner 기준이 우선이다.

## Current Approved Slice

- Task ID: `golden-sample-v3-2-pillow-renderer-productionization-v1`
- Status: **approved by Owner 2026-07-03 KST**.
- Owner decision:
  - `승인: Slice 3 — golden-sample-v3-2-pillow-renderer-productionization-v1를 no-live 범위로 진행. 금지 항목 유지.`
- Slice type: no-live Pillow renderer/overlay-spec productionization contract + static guard only.
- Readiness flags remain:
  - `uploadReady=false`
  - `automationExpansionReady=false`
  - `implementationApproved=false` for upload/automation expansion.

## Purpose

Create a reusable, no-live standard boundary for the Golden Sample v3.2 Pillow typography/overlay renderer.

This slice should convert lessons from v3/v3.1/v3.2 inline renderer lineage into fixture-driven renderer contracts and static guards:

1. Overlay-spec JSON is the module boundary.
2. Pillow bold typography remains the approved visual grammar, but this slice must not render frames.
3. Noto Sans KR Black VF / approved bold Korean font policy is recorded; font vendoring remains Owner decision #6 unless already explicitly approved.
4. Malgun Gothic / Arial / BlackHanSans / DoHyeon fallback routes are not v3.2-compliant for this standard path.
5. Bottom-fixed subtitle bar, karaoke ASS, and drawtext lower-bar routes are forbidden for v3.2 standard output.
6. Safe-frame static geometry gate must be machine-readable: text `y2 <= 1580`, graphics `y2 <= 1632` on a 1080x1920 canvas, plus readable line-length constraints.
7. v3.2 acceptance lock must be referenced for future equivalence checks, but no frame comparison/render regeneration is approved now.
8. Existing accepted evidence runners/renderers should be treated as lineage sources, not edited live paths.

No render, mux, ffmpeg, Pillow/Python execution, browser automation, image generation, TTS, upload, env/dependency, DB, or deploy action is approved in this slice.

## Source Contracts To Read

Read only the minimum needed:

1. `_ai/GOLDEN_SAMPLE_V3_2_PRODUCTION_STANDARD.md`
2. `_ai/GOLDEN_SAMPLE_V3_2_AUTOMATION_IMPLEMENTATION_GAP_ANALYSIS.md`
3. `scripts/fixtures/golden_sample_v3_2_production_standard.v1.json`
4. `scripts/fixtures/golden_sample_v3_2_acceptance_lock.t1_lifestyle_inflation.json`
5. `scripts/fixtures/golden_sample_t1_lifestyle_inflation_visual_render_manifest.v3_2_tts_anchored.json`
6. Existing v3/v3.1/v3.2 renderer lineage, targeted only:
   - `scripts/run-golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit.mjs`
   - `scripts/run-golden-sample-chatgpt-playwright-v3-1-tts-first-mux-audit.mjs`
   - `scripts/render-golden-sample-chatgpt-playwright-visual-only-v3.mjs`
   - `scripts/render-golden-sample-chatgpt-playwright-visual-only-v3-1.mjs`
   - `scripts/render-golden-sample-chatgpt-playwright-visual-only-v2.mjs` only if needed to identify deprecated behavior.
7. Slice 1 and Slice 2 contracts only when needed for integration references:
   - `scripts/fixtures/golden_sample_v3_2_story_visual_evidence_contract.v1.json`
   - `scripts/fixtures/golden_sample_v3_2_chatgpt_playwright_runner_contract.v1.json`

Do not read protected files:

- `_ai/CONTEXT_TRANSFER_CODEX.md`
- `piq_diag_out.txt`
- `scripts/render-golden-sample-visual-only-v1.mjs`
- `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`

## Scope

Allowed files:

1. New standard renderer contract fixture:
   - Recommended: `scripts/fixtures/golden_sample_v3_2_pillow_renderer_contract.v1.json`
   - Must define no-live policy, overlay-spec boundary, font policy, safe-frame geometry, caption/typography rules, forbidden legacy render paths, future equivalence-check requirements, and unresolved Owner decisions.

2. New sample overlay/spec plan fixture:
   - Recommended: `scripts/fixtures/golden_sample_v3_2_pillow_renderer_sample_plan.t1_lifestyle_inflation.v1.json`
   - It should reference the accepted v3.2 visual render manifest and acceptance lock.
   - It must be a plan/contract fixture only, not an approval to render.

3. New no-live renderer standard harness/module:
   - Recommended: `scripts/run-golden-sample-pillow-renderer-standard-v1.mjs`
   - In this slice it must support dry-run/static validation only.
   - It must not spawn Python, import/run Pillow, invoke ffmpeg, render images, write files, or inspect env/secrets.
   - It should encode reusable pure logic surfaces for overlay-spec validation, safe-frame geometry, font policy validation, forbidden-render-route checks, and future equivalence-plan validation.
   - Future live/render slice must import this standard surface instead of creating another inline Pillow clone.

4. New static guard:
   - Recommended: `scripts/check-golden-sample-v3-2-pillow-renderer-static.mjs`
   - Must be no-live, no-network, no-env, no-secret, no-browser, no-render, no-write.
   - It should assert contract/plan/harness compliance and cross-check key v3.2 standard facts.

5. `_ai/CLAUDE_REPORT.md`
   - Append concise reusable evidence.

6. `_ai/HANDOFF_NOW.md`
   - Update slice status only if needed.

Do not modify existing generation/render/TTS/upload implementation code unless a tiny pure helper is absolutely necessary and clearly justified. Prefer new files to avoid contaminating accepted v3/v3.1/v3.2 evidence runners.

## Required Contract Semantics

### No-live policy

- This slice does not approve rendering or frame generation.
- Default execution must be dry-run/static validation only.
- Any live/render-like CLI flag must fail closed with a non-zero exit.
- No Python/Pillow import, `child_process`, `ffmpeg`, file writes, network, env, or secret access in the default path.

### Overlay/spec boundary

- Overlay-spec JSON is the module boundary for future renderer code.
- The sample plan must reference:
  - v3.2 visual render manifest
  - v3.2 acceptance lock
  - production standard fixture
- The standard harness/static guard should fail if the plan has no v3.2 manifest/acceptance-lock reference.

### Typography and font policy

- Pillow bold info-shorts typography remains the standard until an explicitly approved replacement exists.
- Font policy must require Noto Sans KR Black VF or another approved bold Korean font.
- Malgun Gothic, Arial, BlackHanSans, DoHyeon, silent default-font fallback, and unapproved fallback chains must be forbidden for the v3.2 standard path.
- Font vendoring/system-font dependency remains unresolved Owner decision #6; do not add font files or dependencies.

### Safe-frame geometry

- Canvas must be 1080x1920.
- Text safe-frame limit: `y2 <= 1580`.
- Graphic safe-frame limit: `y2 <= 1632`.
- Include line-length / readable text constraints and fail-closed behavior for missing bbox data.
- Safe-frame gate should validate overlay/spec geometry without rendering frames.

### Forbidden legacy render routes

- Bottom-fixed subtitle bar is forbidden.
- Karaoke ASS lower-line behavior is forbidden.
- ASS/drawtext lower-bar routes are forbidden for this v3.2 standard path.
- `render_v2.py` style char-weight scene sync, silent fallback fonts, and 30s fixed assumptions must not be adopted.

### Equivalence plan

- Future production renderer must define how to compare against v3.2 lock artifacts.
- This slice should define machine-readable equivalence requirements, not run render/frame comparison.
- Do not read from or write to `C:\tmp` or `output/`.

## Required Checks

Minimum:

1. `git status -sb`
2. `node --check` for every new `.mjs`
3. JSON parse for every new fixture
4. Run new dry-run harness:
   - `node scripts/run-golden-sample-pillow-renderer-standard-v1.mjs`
5. Run new static guard:
   - `node scripts/check-golden-sample-v3-2-pillow-renderer-static.mjs`

The static guard must print a clear PASS count and fail non-zero on violation.

Also scan new/changed files for forbidden live/render patterns:

- `child_process`
- `spawn(`
- `exec(`
- `execFile(`
- `python`
- `PIL`
- `ImageDraw`
- `ffmpeg`
- `writeFile`
- `appendFile`
- `mkdir`
- `rmSync`
- `unlink`
- `rename`
- `process.env`
- `fetch(`
- `chromium.launch`
- `page.goto`
- `browser.newPage`
- `uploadReady: true`
- `automationExpansionReady: true`
- `implementationApproved: true`
- `liveRenderApproved: true`

Allowed exception: denylist strings inside the static guard must be split or explicitly reported as scanner denylist text, not executable behavior.

Do not run full build unless a syntax/import issue requires it.

## Forbidden

- Rendering frames or video.
- Pillow/Python execution.
- ffmpeg execution.
- render/mux regeneration.
- ChatGPT/Playwright execution.
- Browser/Chrome/CDP launch.
- Image generation.
- OpenAI API.
- FLUX2/BFL API.
- Gemini/Midjourney.
- ElevenLabs live TTS.
- upload or upload queue.
- live HTTP POST to `/api/upload`.
- env/secret reads or writes.
- dependency/lockfile changes.
- DB/schema/deploy changes.
- Modifying production generation/render/TTS/upload code.
- Reading/modifying/staging `_ai/CONTEXT_TRANSFER_CODEX.md` or `piq_diag_out.txt`.
- Touching rejected salary_3days diff:
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- Commit/push.

## Definition Of Done

- Pillow renderer standard is machine-readable as a contract fixture.
- A sample no-live plan references the v3.2 visual render manifest and acceptance lock.
- A no-live standard harness/module exists without rendering, Python/Pillow, ffmpeg, env, network, or writes.
- Static guard validates contract/plan/harness and blocks live/render/env/API/write behavior.
- Safe-frame geometry gate is defined and tested against fixture/sample data.
- Forbidden legacy typography/render routes are explicitly blocked.
- Future equivalence-check requirements are defined without running render/frame comparison.
- All required checks pass.
- `_ai/CLAUDE_REPORT.md` has concise evidence append.
- No forbidden action or side effect occurred.
- Final handoff reports changed files, checks/results, deviations/risks, checkpoint recommendation, and progress.

## Current Git Context

- Branch: `codex/source-first-blueprint-clean`, ahead 166 after checkpoint `aeaaf94`.
- Latest checkpoints:
  - `b4b4b2d feat(safety): add fail-closed upload hard block guard`
  - `fd4b618 feat(golden-sample): add v3.2 story visual evidence guard`
  - `aeaaf94 feat(golden-sample): add chatgpt runner standard guard`
- Existing unstaged/untracked excluded files must remain unstaged:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`

