# HANDOFF_NOW

## Absolute Rules Pointer

- 최우선 source of truth: `_ai/CREATIVE_V2_GOLDEN_SAMPLE_ABSOLUTE_RULES.md`.
- 같은 우선순위 addendum: `_ai/GOLDEN_SAMPLE_OWNER_FEEDBACK_ABSOLUTE_RULES_ADDENDUM_V1.md`.
- Golden Sample v3.2 lock 문서:
  - `_ai/GOLDEN_SAMPLE_V3_2_ACCEPTANCE_LOCK.md`
  - `_ai/GOLDEN_SAMPLE_V3_2_FINAL_QA_PACKET.md`
  - `scripts/fixtures/golden_sample_v3_2_acceptance_lock.t1_lifestyle_inflation.json`
- 최신 Owner 기준이 이전 문서/핸드오프/렌더 보고와 충돌하면 최신 Owner 기준이 우선이다.

## Current Approved Slice

- Task ID: `golden-sample-v3-2-production-standard-contract-v1`
- Status: approved by Owner after v3.2 acceptance lock checkpoint.
- Slice status: **COMPLETED 2026-07-03** — production standard 문서/계약 작성 완료 (`_ai/GOLDEN_SAMPLE_V3_2_PRODUCTION_STANDARD.md`, `scripts/fixtures/golden_sample_v3_2_production_standard.v1.json`). uploadReady=false / automationExpansionReady=false 유지, 구현 코드 무변경.
- Owner decision:
  - 업로드는 아직 하지 않는다.
  - 다음 slice에서 v3.2 Golden Sample 기준을 자동화 구현용 production standard로 정리한다.
- This slice is not upload preparation and not automation implementation.

## Accepted Golden Sample Basis

- Latest checkpoint: `062eb02 docs(golden-sample): lock v3.2 acceptance qa`.
- Candidate: `Golden Sample v3.2 / t1_lifestyle_inflation`
- Topic used for sample: `월급이 올라도 통장이 그대로인 이유`.
- Final candidate mux:
  `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4`
- Status:
  - `ACCEPTED_AS_GOLDEN_SAMPLE_FINAL_CANDIDATE`
  - `uploadReady=false`
  - `automationExpansionReady=false`

## Goal

Extract the reusable production standard from v3.2 so future automation work can implement the same quality grammar without guessing.

The output should answer:

- What must happen before image generation?
- What makes a story pass/fail?
- What must each image prove?
- How should ChatGPT+Playwright image generation run fast and safely?
- What is the Korean money/economy visual standard?
- What typography/caption system must renderer implementation reproduce?
- What TTS-first timing rules are mandatory?
- What QA gates must pass before any upload or automation expansion?

## Scope

Documentation/fixture only.

Allowed:

- Read existing v3.2 lock/QA packet and committed fixtures.
- Create production standard docs/fixtures.
- Append concise result to `_ai/CLAUDE_REPORT.md`.
- Optionally mark this slice completed in `_ai/HANDOFF_NOW.md`.

Suggested files:

1. `_ai/GOLDEN_SAMPLE_V3_2_PRODUCTION_STANDARD.md`
   - Owner/Codex/Claude readable standard.
   - Concise but complete enough to guide implementation.

2. `scripts/fixtures/golden_sample_v3_2_production_standard.v1.json`
   - Machine-readable contract for future automation implementation.

3. `_ai/CLAUDE_REPORT.md`
   - Append concise result.

4. `_ai/HANDOFF_NOW.md`
   - Minimal status update only if needed.

Do not modify implementation code.

## Required Standard Sections

The production standard must include these sections.

### 1. Pipeline Order

Mandatory order:

1. Owner confirms topic.
2. Story-Causality First:
   - problem -> cause -> illusion -> reframe/solution -> action -> result.
3. Visual Evidence Second:
   - each image is evidence, not a pretty background.
4. Image generation.
5. Image QA and md5 lock.
6. Pillow bold typography render.
7. TTS-first one-shot narration.
8. Word/phrase anchored dynamic captions.
9. Artifact audit.
10. Owner viewing/listening QA.
11. Only then can upload or automation expansion be separately approved.

### 2. Story Gate

Include the v3.2 threshold family:

- hook_self_relevance >= 90
- story_causality >= 90
- problem_solution_bridge >= 90
- solution_specificity >= 90
- save_worthiness >= 88
- spoken_naturalness >= 88

Hard fail examples:

- hook is generic.
- problem and solution do not bridge.
- solution is abstract only.
- "3 things" or equivalent is mentioned but not shown/named.
- invented statistics or fake facts.
- topic changed without Owner approval.

### 3. Visual Evidence Standard

Each scene/image must specify:

- claim it proves.
- must_show.
- must_not_show.
- why a viewer can understand it without the card.
- what card/caption adds.
- reject reasons.

Card should strengthen the image, not rescue an unrelated image.

### 4. ChatGPT+Playwright Image Generation Standard

Use v3/v3.1 lessons:

- ChatGPT+Playwright is accepted as the preferred Golden Sample image path for this quality grammar.
- 941x1672 native is a known technical risk, but viewer-frame quality can pass if Owner QA accepts it.
- Image count is story-driven, not fixed at 4/6/9. Avoid long single-image dwell.
- Regenerate when the image fails visual evidence, Korean context, or money clarity.
- Hard cap per slice must be approved before generation.
- No paid provider fallback without separate approval.

Speed/operation rules:

- Expected generation completion: usually 30-90s, slow upper band around 110s.
- Poll page-wide image candidates frequently after submit, roughly every 1-2s.
- When the image appears, save within 30s target.
- Detect-to-save over 30s requires immediate diagnosis in the report.
- Do not wait 3-5 minutes after the image is visibly completed.
- Do not scan unrelated sidebar conversations.
- Do not reuse old conversations unless explicitly recovering a known current image from the same approved run.
- Use page-wide estuary/image collection because current ChatGPT UI may render generated images outside assistant-role scoped DOM.

### 5. Korean Money/Economy Visual Standard

Hard fail:

- foreign-currency feel.
- old archival/dated finance texture.
- unknown money.
- fake readable text/numbers.
- broken glyphs.
- mosaic/blurred money when money should be clear.
- blank paper pretending to be money.

Accepted:

- Korean-won-like color, guilloche texture, modern Korean living-finance context.
- clear money feel without exact counterfeit-like facsimile.
- exact labels/facts/numbers are renderer responsibility, not image text.

### 6. Typography / Caption Standard

Mandatory:

- Pillow renderer for bold info-shorts typography unless equivalent verified.
- No Malgun Gothic look.
- Noto Sans KR Black or approved bold Korean font.
- thick black stroke.
- strong emphasis color.
- short phrase/keyword captions.
- no bottom-fixed subtitle bar.
- no karaoke fixed lower line.
- max readable line lengths and safe frame.

### 7. TTS-First Standard

- Script Impact Gate before live TTS.
- one-shot TTS.
- no scene-by-scene TTS.
- no padding to force duration.
- no fixed 30/40/60s target.
- natural length determined by script.
- word/phrase timestamp re-anchor required.
- captions/cards enter at actual spoken timing.

### 8. QA / Readiness Flags

Before upload:

- media audit pass.
- story gate pass.
- visual evidence pass.
- typography/caption pass.
- TTS/audio artifact pass.
- Owner viewing/listening PASS.

Flags:

- `uploadReady=false` until explicit Owner upload approval.
- `automationExpansionReady=false` until separate automation implementation approval.
- Technical pass never equals Golden Sample pass.

## Verification

Required checks:

- `git status -sb`
- JSON parse for new fixture.
- Scan new files for:
  - `uploadReady:true`
  - `automationExpansionReady:true`
  - `renderReady:true`
  - secret/env/API key values.
- Confirm no implementation code files changed.

## Forbidden

- Image generation.
- ChatGPT/Playwright generation.
- OpenAI API calls.
- FLUX2/BFL calls.
- Gemini calls.
- Midjourney calls.
- ElevenLabs live TTS calls.
- Render/mux regeneration.
- Upload.
- Automation implementation or upload queue creation.
- Env/secret/dependency/DB/deploy changes.
- Reading/modifying/staging `_ai/CONTEXT_TRANSFER_CODEX.md` or `piq_diag_out.txt`.
- Touching rejected salary_3days visual-only render diff:
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- Commit/push.

## Current Git Context

- Branch: `codex/source-first-blueprint-clean`, ahead 161 before this slice.
- Latest checkpoint: `062eb02 docs(golden-sample): lock v3.2 acceptance qa`.
- Excluded/rejected/admin files must remain unstaged:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`

