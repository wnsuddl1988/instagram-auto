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
- Latest safety checkpoint: `b4b4b2d feat(safety): add fail-closed upload hard block guard`.
- 최신 Owner 기준이 이전 문서/핸드오프/렌더 보고와 충돌하면 최신 Owner 기준이 우선이다.

## Current Approved Slice

- Task ID: `golden-sample-v3-2-story-visual-evidence-static-guard-v1`
- Status: **approved by Owner 2026-07-03**.
- Slice status: **COMPLETED 2026-07-03** — contract/sample/static guard 3파일 신설. guard ALL PASS(68 checks), 변조 샘플 8종 전부 fail-closed 차단, adversarial 리뷰 major 1건(money_dominant 자기신고 우회) 즉시 수정 반영. live 호출/기존 구현 코드 수정 0. uploadReady=false / automationExpansionReady=false / implementationApproved=false 유지.
- Owner decision:
  - `승인: Slice 1 — Golden Sample v3.2 production standard를 기준으로 Story-Causality First + Visual Evidence Second blueprint schema/fixture와 no-live static guard를 만든다. 이미지 생성, ChatGPT/Playwright 실행, 유료 API, TTS, render, mux, upload, env/dependency 변경은 금지한다. 목적은 자동화 구현 전 story gate/visual evidence gate를 코드로 검증 가능하게 만드는 것이다.`
- Slice type: contract + no-live static validation only.
- Readiness flags remain:
  - `uploadReady=false`
  - `automationExpansionReady=false`
  - `implementationApproved=false` for upload/automation expansion.

## Purpose

Turn the v3.2 Golden Sample production standard into a machine-checkable foundation before any automation implementation proceeds.

This slice must prove that future generation work cannot skip:

1. Owner-confirmed topic.
2. Story-Causality First.
3. Visual Evidence Second.
4. Story Impact Gate score/provenance.
5. Beat = phrase = scene alignment.
6. Per-scene visual evidence reject rules.

No media generation or external service call is part of this slice.

## Source Contracts To Read

Read only the minimum needed:

1. `_ai/GOLDEN_SAMPLE_V3_2_PRODUCTION_STANDARD.md`
2. `scripts/fixtures/golden_sample_v3_2_production_standard.v1.json`
3. `_ai/GOLDEN_SAMPLE_V3_2_AUTOMATION_IMPLEMENTATION_GAP_ANALYSIS.md`
4. `scripts/fixtures/golden_sample_t1_lifestyle_inflation_story_blueprint.v3_1_banknote_patch.json`
5. `scripts/fixtures/golden_sample_t1_lifestyle_inflation_tts_first_mux_manifest.v3_2.json`
6. `scripts/fixtures/golden_sample_t1_lifestyle_inflation_visual_render_manifest.v3_2_tts_anchored.json`

Do not read protected files:

- `_ai/CONTEXT_TRANSFER_CODEX.md`
- `piq_diag_out.txt`

## Scope

Allowed files:

1. New contract/schema fixture:
   - Recommended: `scripts/fixtures/golden_sample_v3_2_story_visual_evidence_contract.v1.json`
   - Must define required blueprint fields, story gate thresholds, hard fail list, visual evidence required fields, score provenance requirements, and no-live policy.

2. New normalized validation fixture:
   - Recommended: `scripts/fixtures/golden_sample_v3_2_story_visual_evidence_sample.t1_lifestyle_inflation.v1.json`
   - It should normalize the accepted v3.2 Golden Sample into the new schema without changing existing accepted artifacts.
   - It is a validation/sample fixture, not a new video or new topic approval.

3. New static guard:
   - Recommended: `scripts/check-golden-sample-v3-2-story-visual-evidence-static.mjs`
   - Must be no-live, no-network, no-env, no-secret, no-write.
   - It should read the contract fixture + sample fixture + production standard JSON and assert compliance.

4. `_ai/CLAUDE_REPORT.md`
   - Append concise reusable evidence.

5. `_ai/HANDOFF_NOW.md`
   - Update slice status only if needed.

Do not modify existing generation/render/TTS/upload implementation code in this slice.

## Required Contract Semantics

The contract/static guard must enforce these v3.2 production standard rules:

### Story Gate

Required scores and thresholds:

- `hook_self_relevance >= 90`
- `story_causality >= 90`
- `problem_solution_bridge >= 90`
- `solution_specificity >= 90`
- `save_worthiness >= 88`
- `spoken_naturalness >= 88`

Required score provenance:

- A score must not be anonymous.
- Include a field such as `scoreProvenance` with scorer identity/source, date, method, and notes.
- The guard must fail if scores exist without provenance.

Required hard fails:

- generic hook
- missing problem-solution bridge
- abstract-only solution
- saying "3개/세 가지" without naming/showing them
- invented statistic/fact
- topic change without Owner approval

### Story-Causality Chain

The sample fixture must represent a complete chain:

`problem -> cause -> illusion -> reframe/solution -> action -> result`

Guard requirements:

- required phases appear in order.
- each beat has a `bridge_to_next` except final result.
- beat count, phrase count, and scene count match.
- no placeholder beat, phrase, or scene.

### Visual Evidence

Each scene/image must include exactly the standard six evidence fields, using stable names:

1. `claim`
2. `must_show`
3. `must_not_show`
4. `no_card_understanding`
5. `card_caption_role`
6. `reject_reasons`

Guard requirements:

- every scene has all six fields.
- `must_show` and `reject_reasons` are non-empty arrays.
- if the scene depends entirely on card/caption to be understood, fail.
- Korean money/economy hard-fail terms are represented in reject reasons:
  - foreign currency look
  - old archive look
  - unknown currency
  - fake readable text/number
  - broken glyph
  - mosaic/blurred money in money-dominant shot
  - blank paper pretending to be money

### Owner Topic Confirmation

The sample fixture must include a machine-readable `owner_topic_confirmation` block:

- topic id/title
- approved scope
- approval source note
- not a permanent channel-wide topic lock

Guard must fail if topic confirmation is missing or not approved for the current sample.

### Safe Frame / Overlay Geometry

Use the existing v3.2 visual render manifest if feasible.

Guard should check, at minimum:

- text overlay y bottom <= 1580
- graphic/card y bottom <= 1632
- no bottom-fixed subtitle/bar mode

If existing manifest structure is not directly compatible, document the exact limitation in the contract fixture and add a TODO field, but do not silently skip the check.

## Required Checks

Minimum:

1. `git status -sb`
2. `node --check scripts/check-golden-sample-v3-2-story-visual-evidence-static.mjs`
3. JSON parse for every new fixture.
4. Run the new static guard:
   - `node scripts/check-golden-sample-v3-2-story-visual-evidence-static.mjs`

The static guard must print a clear PASS count and fail non-zero on violation.

Also scan new/changed files for forbidden patterns:

- `fetch(`
- `ALLOW_`
- `process.env`
- `OPENAI_API_KEY`
- `BFL_API_KEY`
- `ELEVENLABS_API_KEY`
- `uploadReady: true`
- `automationExpansionReady: true`
- `implementationApproved: true`

Allowed exception: if the scanner script itself contains these strings as denylist patterns, report that explicitly.

Do not run full build unless a syntax/import issue requires it.

## Forbidden

- Image generation.
- ChatGPT/Playwright execution.
- OpenAI API.
- FLUX2/BFL API.
- Gemini/Midjourney.
- ElevenLabs live TTS.
- render/mux regeneration.
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

- New contract fixture exists and encodes the v3.2 story/visual evidence standard.
- New sample fixture exists and normalizes accepted v3.2 sample into the contract.
- Static guard validates the sample and fails closed for missing required fields/provenance.
- All required checks pass.
- `_ai/CLAUDE_REPORT.md` has a concise evidence append.
- No forbidden action or side effect occurred.
- Final handoff reports changed files, checks/results, deviations/risks, checkpoint recommendation, and progress.

## Current Git Context

- Branch: `codex/source-first-blueprint-clean`, ahead 164 before this slice.
- Latest checkpoint: `b4b4b2d feat(safety): add fail-closed upload hard block guard`.
- Existing unstaged/untracked excluded files must remain unstaged:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`

