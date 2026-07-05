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

## Current Approved Slice

- Task ID: `golden-sample-v3-2-script-impact-gate-provenance-standardization-v1`
- Status: **approved by Owner 2026-07-04 KST as no-live continuation**.
- Owner basis:
  - Owner approved continuing required no-live implementation sequentially: `그래 진행해 다 구현되고 나면 또 얘기해보자`.
  - Decision state fixture has resolved:
    - `script_impact_gate_score_authority = codex_judge_with_mandatory_provenance`
- Slice type: no-live Script Impact Gate provenance standardization + harness/static guard update.

## Purpose

The TTS/audio audit standard already blocks live TTS until Script Impact Gate PASS, but its contract/sample plan still preserve the older wording that the score producer is Owner decision #1 pending. This slice consumes the resolved Owner decision and makes provenance mandatory so future live TTS preparation cannot rely on anonymous fixture self-assessment numbers.

This slice must:

1. Keep all TTS/audio/mux/upload/image/browser/API paths no-live and fail-closed.
2. Update the TTS/audio audit standard so Script Impact Gate authority is `codex_judge_with_mandatory_provenance`.
3. Require machine-checkable provenance for all six Script Impact Gate scores and hard-fail checks.
4. Preserve the distinction: technical Script Impact Gate PASS is **not** live TTS, mux, upload, or Owner QA approval.

## Source Contracts To Read

Read only the minimum needed:

1. `scripts/fixtures/golden_sample_v3_2_owner_decision_resolution_state.v1.json`
2. `scripts/fixtures/golden_sample_v3_2_owner_decision_resolution_packet.v1.json`
3. `scripts/fixtures/golden_sample_v3_2_tts_audio_audit_contract.v1.json`
4. `scripts/fixtures/golden_sample_v3_2_tts_audio_audit_sample_plan.t1_lifestyle_inflation.v1.json`
5. `scripts/run-golden-sample-tts-audio-audit-standard-v1.mjs`
6. `scripts/check-golden-sample-v3-2-tts-audio-audit-static.mjs`

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

1. `scripts/fixtures/golden_sample_v3_2_tts_audio_audit_contract.v1.json`
   - Update `scriptImpactGateStandard.scoreProducerNote` from pending wording to resolved Owner decision #1 wording.
   - Add fields such as:
     - `scoreAuthority: "codex_judge_with_mandatory_provenance"`
     - `provenanceRequired: true`
     - `resolvedDecisionRef`
     - `provenanceSchema` for six score keys and hard fail checks.
   - Keep thresholds/hardFailKeys/gate order unchanged.
   - Keep all no-live/read-only flags unchanged.

2. `scripts/fixtures/golden_sample_v3_2_tts_audio_audit_sample_plan.t1_lifestyle_inflation.v1.json`
   - Add `scriptImpactGate.provenance` or equivalent machine-readable evidence.
   - Provenance must cover all six score keys and hardFail checks.
   - Each score provenance should include score key, value, authority, judge identity/type, source refs, concise rationale, and no placeholder/TBD.
   - Update old `Owner decision #1 미결` wording to resolved no-live wording.

3. `scripts/run-golden-sample-tts-audio-audit-standard-v1.mjs`
   - Add pure validation helpers for Script Impact Gate provenance.
   - `validatePlanAgainstContract()` must fail closed when provenance is missing, wrong authority, score keys mismatch, hard-fail provenance missing, source refs missing, placeholder text exists, or the plan claims live approval.
   - Keep imports restricted to `node:fs`, `node:path`, `node:url`.
   - Do not add network/env/secret/audio/video/render/mux/browser surfaces.

4. `scripts/check-golden-sample-v3-2-tts-audio-audit-static.mjs`
   - Update contract checks from pending #1 wording to resolved `codex_judge_with_mandatory_provenance`.
   - Add static and harness-import mutants for:
     - missing provenance,
     - wrong authority (`self_assessment_fixture_with_provenance`, `llm_judge_scored`, or unknown),
     - missing source refs,
     - placeholder/TBD rationale,
     - six score keys not matching provenance keys,
     - hard-fail checks missing provenance,
     - provenance implying live TTS/mux/upload/Owner QA approval.

5. Optional, only if it reduces complexity:
   - New fixture under `scripts/fixtures/` for a reusable provenance contract/sample.
   - New static guard only if the existing TTS/audio audit static guard would become too large.

6. `_ai/CLAUDE_REPORT.md`
   - Append concise reusable evidence.

7. `_ai/HANDOFF_NOW.md`
   - Update status only if needed.

Do not modify Slice 5 integrated readiness contract in this slice. Treat it as historical baseline; the resolved decision state fixture is the current source for decision #1.

## Required Safety Semantics

- No live TTS/API call.
- No audio/video/image file read.
- No ffmpeg/ffprobe/silencedetect.
- No render/mux regeneration.
- No browser/Chrome/CDP.
- No image/video generation.
- No upload or upload queue.
- No env/secret access.
- No dependency/lockfile/DB/deploy change.
- Provenance PASS is not live approval, not Owner QA, and not upload readiness.
- Current readiness remains `STANDARDIZED_NO_LIVE_READY`.

## Required Checks

Minimum:

1. `git status -sb`
2. `node --check` for every changed/new `.mjs`
3. JSON parse for every changed/new fixture
4. Harness dry-run:
   - `node scripts/run-golden-sample-tts-audio-audit-standard-v1.mjs`
5. Updated TTS/audio audit static guard:
   - `node scripts/check-golden-sample-v3-2-tts-audio-audit-static.mjs`
6. Regression sanity:
   - `node scripts/check-golden-sample-v3-2-owner-decision-resolution-state-static.mjs`
   - `node scripts/check-golden-sample-v3-2-integrated-production-readiness-static.mjs`

Do not run full build unless a syntax/import issue requires it.

## Forbidden

- Running live TTS, free/paid TTS, OpenAI, ElevenLabs, Gemini, Veo, BFL, ChatGPT, Playwright, browser, Chrome, CDP, render, mux, upload, or image/video generation.
- Reading `.env.local` or any actual env/secret value.
- Reading/analyzing audio/video/image files.
- Running ffmpeg/ffprobe/silencedetect.
- Adding dependencies, changing lockfiles, DB/schema/deploy config, or `pnpm-workspace.yaml`.
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

- TTS/audio audit contract records decision #1 as `codex_judge_with_mandatory_provenance`.
- Sample plan includes complete Script Impact Gate provenance for scores and hard-fail checks.
- Harness validates provenance fail-closed.
- Static guard proves the behavior and fails on key mutants.
- Existing TTS/audio thresholds, order, no-live policy, and Owner QA separation remain intact.
- Required checks pass.
- `_ai/CLAUDE_REPORT.md` has concise evidence append.
- No forbidden action or side effect occurred.

## Current Git Context

- Branch: `codex/source-first-blueprint-clean`, ahead 173 after checkpoint `85865ba`.
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
