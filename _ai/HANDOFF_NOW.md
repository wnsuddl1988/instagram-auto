# HANDOFF_NOW

## Absolute Rules Pointer

- 최우선 source of truth: `AGENTS.md` + 이 파일.
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
  - `9607eab feat(golden-sample): record owner decision state guard`
  - `c80b024 feat(golden-sample): harden paid image allow guards`
  - `85865ba feat(golden-sample): close browser runner guard gaps`
  - `9fe6f77 feat(golden-sample): standardize script impact provenance`
  - `bb1fb59 feat(golden-sample): resolve chatgpt runner passive window`

## Current Approved Slice

- Task ID: `golden-sample-v3-2-pillow-renderer-font-vendoring-policy-resolution-v1`
- Status: **approved by Owner as no-live continuation**.
- Owner basis:
  - Owner approved continuing required no-live implementation sequentially: `그래 진행해 다 구현되고 나면 또 얘기해보자`.
  - Decision state fixture has resolved:
    - `font_vendoring = vendor_noto_black_vf_remove_system_dependency`
- Slice type: no-live Pillow renderer font-policy resolution + harness/static guard update.

## Purpose

The Pillow renderer standard already requires Noto Sans KR Black VF and forbids silent fallback/Malgun/Arial/BlackHanSans/DoHyeon, but its contract/sample plan still labels font vendoring as Owner decision #6 pending. This slice consumes the resolved Owner decision and records the policy direction as `vendor_noto_black_vf_remove_system_dependency`.

This slice must:

1. Keep all render/mux/video/audio/font-file/dependency paths no-live and fail-closed.
2. Update the Pillow renderer standard so decision #6 is resolved as `vendor_noto_black_vf_remove_system_dependency`.
3. Preserve current approved typography semantics:
   - font family: `Noto Sans KR Black (VF)`
   - font file hint: `NotoSansKR-VF.ttf`
   - silent default-font fallback forbidden
   - Malgun/Arial/BlackHanSans/DoHyeon forbidden
4. Make contract/sample plan/harness/static guard fail closed if future edits remove the resolved decision, revert to pending wording, allow system font dependency as standard, allow silent fallback, or imply render/mux/font-file addition approval.
5. Preserve the distinction: font vendoring policy resolution is **not** font file commit approval, dependency approval, render approval, or mux approval.

## Source Contracts To Read

Read only the minimum needed:

1. `scripts/fixtures/golden_sample_v3_2_owner_decision_resolution_state.v1.json`
2. `scripts/fixtures/golden_sample_v3_2_owner_decision_resolution_packet.v1.json`
3. `scripts/fixtures/golden_sample_v3_2_pillow_renderer_contract.v1.json`
4. `scripts/fixtures/golden_sample_v3_2_pillow_renderer_sample_plan.t1_lifestyle_inflation.v1.json`
5. `scripts/run-golden-sample-pillow-renderer-standard-v1.mjs`
6. `scripts/check-golden-sample-v3-2-pillow-renderer-static.mjs`

Do not read protected/excluded files unless unavoidable:

- `_ai/CODEX_REVIEW.md`
- `_ai/NEXT_ACTION.md`
- `_ai/PROJECT_STATE.md`
- `_ai/CONTEXT_TRANSFER_CODEX.md`
- `piq_diag_out.txt`
- `scripts/render-golden-sample-visual-only-v1.mjs`
- `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- `output/`
- `C:\tmp`

## Scope

Allowed files:

1. `scripts/fixtures/golden_sample_v3_2_pillow_renderer_contract.v1.json`
   - Update `fontPolicy` or equivalent section from pending Owner decision #6 wording to resolved policy wording.
   - Add explicit machine-readable fields if useful:
     - `resolvedDecisionRef`
     - `resolvedValue: "vendor_noto_black_vf_remove_system_dependency"`
     - `fontVendoringPolicyResolved: true`
     - `notFontFileApproval: true`
     - `notDependencyApproval: true`
     - `notRenderApproval: true`
   - Keep approved font, font hint, forbidden fallback/fonts, safe-frame, overlay-spec, and equivalence policy unchanged.
   - Keep no-live/read-only flags unchanged.

2. `scripts/fixtures/golden_sample_v3_2_pillow_renderer_sample_plan.t1_lifestyle_inflation.v1.json`
   - Add or update font vendoring interpretation evidence so the sample plan references resolved decision #6.
   - Preserve overlay spec sample, safe-frame boundary cases, caption registry, executionMode, and no-live policy.
   - Do not add font file, dependency, render, mux, or asset approval.

3. `scripts/run-golden-sample-pillow-renderer-standard-v1.mjs`
   - Add pure validation helper(s) for font vendoring decision resolution if not already present.
   - The validator must fail closed when:
     - decision #6 is absent,
     - resolved value differs from `vendor_noto_black_vf_remove_system_dependency`,
     - pending/open/TBD/미결 wording remains in resolved font policy section,
     - approved font/hint drift from Noto Sans KR Black VF / `NotoSansKR-VF.ttf`,
     - system font dependency is treated as the final standard,
     - silent default-font fallback is allowed,
     - Malgun/Arial/BlackHanSans/DoHyeon is allowed,
     - the plan/contract claims font-file commit, dependency, render, or mux approval.
   - Keep imports restricted to `node:fs`, `node:path`, `node:url`.
   - Do not add Pillow/Python/subprocess/render/mux/env/secret/file-write surfaces.

4. `scripts/check-golden-sample-v3-2-pillow-renderer-static.mjs`
   - Update contract checks from pending #6 wording to resolved `vendor_noto_black_vf_remove_system_dependency`.
   - Add static and harness-import mutants for:
     - deleting the resolved decision ref,
     - changing resolved value,
     - reintroducing pending/open/TBD/미결 wording,
     - allowing silent fallback,
     - allowing Malgun/Arial/BlackHanSans/DoHyeon,
     - treating system font dependency as final standard,
     - setting any font-file/dependency/render/mux approval flag true.

5. `_ai/CLAUDE_REPORT.md`
   - Append concise reusable evidence.

6. `_ai/HANDOFF_NOW.md`
   - Update status only if needed.

Do not add font files in this slice. Do not modify Slice 5 integrated readiness contract in this slice. Treat it as historical baseline; the resolved decision state fixture is the current source for decision #6.

## Required Safety Semantics

- No frame/video render.
- No Pillow/Python/ffmpeg/ffprobe/subprocess execution.
- No audio/video/image file read.
- No font file addition or vendored asset commit.
- No dependency/lockfile change.
- No render/mux/upload.
- No ChatGPT/Playwright/browser/Chrome/CDP execution.
- No image generation.
- No env/secret access.
- Font vendoring policy PASS is not render approval and not production readiness.
- Current readiness remains `STANDARDIZED_NO_LIVE_READY`.

## Required Checks

Minimum:

1. `git status -sb`
2. `node --check` for every changed/new `.mjs`
3. JSON parse for every changed/new fixture
4. Harness dry-run:
   - `node scripts/run-golden-sample-pillow-renderer-standard-v1.mjs`
5. Updated Pillow renderer static guard:
   - `node scripts/check-golden-sample-v3-2-pillow-renderer-static.mjs`
6. Regression sanity:
   - `node scripts/check-golden-sample-v3-2-owner-decision-resolution-state-static.mjs`
   - `node scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`

Do not run full build unless a syntax/import issue requires it.

## Forbidden

- Running Pillow, Python render scripts, ffmpeg, ffprobe, frame/video render, mux, upload, ChatGPT, Playwright, browser, Chrome, CDP, image generation, live TTS, or external API.
- Reading `.env.local` or any actual env/secret value.
- Reading/analyzing audio/video/image files.
- Adding font files, vendored assets, dependencies, lockfile changes, DB/schema/deploy config, or `pnpm-workspace.yaml`.
- Modifying protected/excluded files:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - `output/`
  - `C:\tmp`
- Commit/push.

## Definition Of Done

- Pillow renderer contract records decision #6 as resolved: `vendor_noto_black_vf_remove_system_dependency`.
- Sample plan references the resolved font vendoring policy and remains no-live.
- Harness validates font vendoring resolution fail-closed.
- Static guard proves the behavior and fails on key mutants.
- Existing font family/hint, forbidden fallback/fonts, safe-frame, overlay-spec, no-live policy, and acceptance-lock references remain intact.
- Required checks pass.
- `_ai/CLAUDE_REPORT.md` has concise evidence append.
- No forbidden action or side effect occurred.

## Current Git Context

- Branch: `codex/source-first-blueprint-clean`, ahead 175 after checkpoint `bb1fb59`.
- Existing unstaged/untracked excluded files must remain unstaged:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - `output/`
  - `C:\tmp`

전체프로젝트 진행률 : 약 92%
