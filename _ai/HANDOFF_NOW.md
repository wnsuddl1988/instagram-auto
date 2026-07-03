# HANDOFF_NOW

## Absolute Rules Pointer

- 최우선 source of truth: `_ai/CREATIVE_V2_GOLDEN_SAMPLE_ABSOLUTE_RULES.md`.
- 같은 우선순위 addendum: `_ai/GOLDEN_SAMPLE_OWNER_FEEDBACK_ABSOLUTE_RULES_ADDENDUM_V1.md`.
- 최신 Owner 기준이 이전 문서/핸드오프/렌더 보고와 충돌하면 최신 Owner 기준이 우선이다.

## Current Approved Slice

- Task ID: `golden-sample-chatgpt-playwright-korean-banknote-clarity-patch-v3-1`
- Status: approved for targeted visual-only patch based on Owner feedback.
- Owner direction:
  - v3 is improved, but money looks too mosaic/blank/abstract.
  - Korean banknotes should be clearly recognizable.
  - Keep the v3 story structure as the current best baseline.
  - Patch only the money-clarity problem; do not start a completely new topic or provider search.
  - The goal is not to force a fixed duration; the goal is a better video: natural story flow, strong script logic, clear Korean money evidence, and clean pacing.
  - ChatGPT+Playwright remains the approved image path for this test.

## Baseline Candidate To Preserve

- Baseline commit: `a2b9af2 test(automation): add chatgpt playwright visual candidate`.
- Baseline visual-only candidate:
  `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-visual-only-v2\golden_sample_t1_lifestyle_inflation_visual_only_v2.mp4`
- Current best visual-only candidate to patch:
  `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-visual-only-v3\golden_sample_t1_lifestyle_inflation_visual_only_v3.mp4`
- Baseline status: `PASS_CANDIDATE_FOR_OWNER_REVIEW`, not Golden Sample PASS.
- Baseline strengths:
  - ChatGPT images feel more modern/Korean/lifestyle-finance than FLUX2.
  - Pillow overlay Black typography is directionally correct.
  - v2 improved image dwell and generation-save latency.
- Baseline weaknesses to beat:
  - Images are good but may still be improved.
  - Some visual evidence still feels general rather than irresistibly tied to the claim.
  - Need a fresh set that raises image relevance and overall "this is the one" feeling.
- v3 weakness to patch:
  - Money-related frames look too mosaic/blank/abstract.
  - Korean won banknote recognition is not strong enough.
  - "No text/numerals" was over-applied and weakened money realism.

## Scope

- Use the same test topic:
  `t1_lifestyle_inflation` / `월급이 올라도 통장이 그대로인 이유`.
- This remains a Golden Sample test topic, not final channel-wide topic lock.
- Build a patched visual-only mp4 candidate using v3 as baseline and replacing only weak money-clarity images.
- TTS/mux/upload remain forbidden.

## Korean Banknote Clarity Rule

- Korean won must be immediately recognizable in money-dominant frames.
- Allowed and desired:
  - crisp paper banknotes with Korean won-like color families:
    - 50,000 won style: warm yellow/gold.
    - 10,000 won style: green/blue-green.
    - 5,000 won style: orange/red-brown.
    - 1,000 won style: blue.
  - visible stacks, envelopes, jars, wallets, hands, household desk, modern Korean apartment/light.
  - partial overlap, folding, hand coverage, angle, or depth of field to prevent exact readable counterfeit-like details.
- Forbidden:
  - mosaic, pixelated, smeared, blurred, or blank-paper money.
  - foreign currency feel.
  - old archive/economic-document feel.
  - exact readable serial numbers, exact readable Korean text, broken AI text, fake numerals, logos.
  - fully front-facing exact banknote facsimile that looks like a counterfeit scan.
- Practical target:
  - Viewer instantly thinks "한국 돈/원화" without being able to read exact serials or fake text.

## Natural Duration Rule

- Do not target `30s` as a fixed rule.
- Video length is a result of story/script/pacing, not the starting goal.
- Acceptable provisional visual-only duration can be around 25~50s if the story flow is natural.
- Reject if the video feels rushed, over-compressed, padded, or if a single image lingers too long without a deliberate reason.
- For this visual-only slice, choose timing from beat/story needs and report why the final duration is appropriate.

## Image Generation Policy For This Revision

- Allowed path: ChatGPT+Playwright via existing Chrome CDP path.
- Must require `ALLOW_CHATGPT_IMAGE=1`.
- Cost cap: `$0`.
- Additional ChatGPT image submissions for this patch: max 6.
- Target only weak money-clarity beats from v3.
- Suggested patch targets:
  - opening/hook money jar/envelope frame if banknotes look too blank.
  - illusion/reframe money frame if banknotes look mosaic.
  - action jar-sorting frame if bills look blurred/blank.
  - final colored-ribbon jars frame if money inside jars lacks real banknote feel.
- Stop early when enough replacements fix the issue.
- Regeneration is allowed within the max-6 cap when an image fails the Korean Banknote Clarity Rule.
- Reuse v3 images that are already strong; do not regenerate everything.
- Do not use OpenAI API, FLUX2/BFL, Gemini, Midjourney, or any paid API.
- Do not reuse old `salary_3days` image set.

## Required Visual Revision Goals

1. Patch v3 so Korean banknotes are clearly recognizable.
2. Improve direct visual evidence: money images should prove the beat even before cards explain it.
3. Keep Korean modern finance context: salary/living cost/card/subscription/bank/wallet/mobile finance/apartment/lifestyle cues.
4. Avoid foreign/old/unknown money feel.
5. Keep no readable fake text/numerals/logos inside images, but do not solve this by making money mosaic or blank.
6. Keep Pillow overlay bold typography and strong info-shorts caption style.
7. Keep story causality:
   - 월급은 올랐는데 통장이 그대로
   - 오른 월급을 고정비/카드값/구독료/생활비가 흡수
   - 인상액만 기억하고 늘어난 지출은 흩어져 안 보임
   - 체감은 잔액이 아니라 돈의 자리에서 생김
   - 받는 날 먼저 나누기: 고정비 증가분 / 생활비 상한 / 남길 돈
8. Do not let cards rescue weak images. Cards may clarify, but the image must still be relevant.
9. Keep v3's 9-beat structure unless a small timing adjustment is needed for the patched images.

## ChatGPT+Playwright Speed Rules

Claude Code must not wait 3~5 minutes after the image is already visible.

Rules:

1. After submitting a prompt, start active detection after 25~30 seconds.
2. Poll page-wide image candidates every 1.5~2.0 seconds.
3. Current ChatGPT UI may render generated images outside assistant-role message containers; use page-wide estuary/oaiusercontent/blob collection, excluding user attachments.
4. If a new generated image is detected and stable for 3 consecutive polls, save immediately.
5. Expected generation window: usually 60~110 seconds.
6. If no image is detected by 150 seconds:
   - capture diagnostic screenshot/DOM summary.
   - do one recover-current-page attempt.
   - do not scan unrelated sidebar conversations.
7. If no recoverable image by 180 seconds, mark that prompt `TIMEOUT_BLOCKED` and move to next prompt or stop if quality target cannot be met.
8. Do not open unrelated old conversations or inspect sidebar history except an explicit `--recover-latest` mode for the same current generation session.
9. Log timestamps:
   - prompt submitted at
   - first candidate detected at
   - saved at
   - detection latency
10. Report any case where detection latency after visible generation exceeds 30 seconds.

## Preferred Beat Plan

Target: story-natural visual-only timing, likely 7~9 beats.

Suggested beats:

1. Hook: 월급은 올랐는데 통장은 그대로
2. Problem: 더 벌었는데 월말 잔액은 안 늘어남
3. Cause A: 고정비/이체가 먼저 흡수
4. Cause B: 카드값/구독료/생활비가 흩어져 빠짐
5. Illusion: 인상액만 크게 기억되고 늘어난 지출은 분산되어 안 보임
6. Reframe: 돈이 안 모이는 게 아니라 오른 돈의 자리가 없었음
7. Action A: 받는 날 먼저 3칸으로 나누기
8. Action B: 고정비 증가분 / 생활비 상한 / 남길 돈을 구체적으로 분리
9. Result: 다음 월급날부터 체감이 달라지는 정돈된 생활금융 장면

## Required Outputs

Create/update repo-consistent names:

1. Add prompt fixture for revision:
   - suggested: `scripts/fixtures/chatgpt_playwright_image_prompts.t1_lifestyle_inflation.v3_1_banknote_patch.json`
   - include reason for each patch prompt and target beat.

2. Add story/render manifest:
   - suggested: `scripts/fixtures/golden_sample_t1_lifestyle_inflation_story_blueprint.v3_1_banknote_patch.json`
   - include selected v3 images retained, replacement images, and timing notes.

3. Update or add runner if needed:
   - suggested: `scripts/run-chatgpt-playwright-korean-banknote-patch-v3-1.mjs`
   - May reuse v3 logic, but keep v1/v2/v3 scripts stable unless a shared bug fix is necessary.
   - Must implement the speed rules above.
   - Must keep submission hard cap for revision at 6 additional submissions.

4. Update or add visual-only renderer:
   - suggested: `scripts/render-golden-sample-chatgpt-playwright-visual-only-v3-1.mjs`
   - May reuse v3 renderer logic, but keep v1/v2/v3 scripts stable unless a shared bug fix is necessary.
   - Must keep Pillow overlay typography.
   - Must output patched visual-only mp4.

5. Output:
   - suggested folder: `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-visual-only-v3-1-banknote-patch\`
   - include mp4, manifest, QA report, frame screenshots.

6. `_ai/CLAUDE_REPORT.md` append.

## QA Fields

At minimum:

- `native_resolution_score`
- `viewer_frame_quality_score`
- `image_dwell_score`
- `korean_money_context_score`
- `modern_lifestyle_relevance_score`
- `story_evidence_score`
- `font_typography_score`
- `caption_readability_score`
- `story_causality_score`
- `third_image_replacement_verdict`
- `fake_text_or_numeral_risk`
- `foreign_currency_or_old_money_risk`
- `korean_banknote_clarity_score`
- `mosaic_or_blank_money_risk`
- `chatgpt_generation_latency_report`
- `comparison_against_v2_baseline`
- `comparison_against_v3_baseline`
- `chatgpt_vs_flux2_observation`
- `recommendation`

## Forbidden

- OpenAI API calls.
- FLUX2/BFL API calls.
- Gemini calls.
- Midjourney calls.
- Any paid API call.
- More than 6 additional ChatGPT image submissions in this patch.
- Automatic retry that exceeds the cap.
- TTS.
- mux.
- upload.
- Treating `t1_lifestyle_inflation` as final channel-wide Golden Sample topic beyond this test.
- Reusing old `salary_3days` locked image set.
- Treating 30s as a fixed target.
- Replacing story causality with visual prettiness.
- Solving fake text risk by turning money into mosaic/blank paper.
- Env/secret/dependency/DB/deploy changes.
- Reading `.env.local`, `.money-shorts-local`, secret files.
- Reading/modifying/staging `_ai/CONTEXT_TRANSFER_CODEX.md` or `piq_diag_out.txt`.
- Touching rejected salary_3days visual-only render diff unless explicitly needed only to avoid conflict. In particular do not modify/stage:
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`

## Current Git Context

- Latest checkpoint: `a2b9af2 test(automation): add chatgpt playwright visual candidate`.
- Current v1/v2 ChatGPT candidate files are committed.
- Current v3 files are uncommitted and should be treated as baseline input for this patch.
- Remaining uncommitted files are excluded/rejected/admin state; do not touch unless explicitly needed:
  - `_ai/CODEX_REVIEW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `_ai/CONTEXT_TRANSFER_CODEX.md`
  - `piq_diag_out.txt`
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- Do not stage/commit/push.

## Required Checks

- JSON parse all new/updated JSON fixtures/reports.
- `node --check` for changed/new scripts.
- Verify additional ChatGPT submission count <= 6.
- Verify total selected images in patched video: 7~9 visual beats or justify otherwise.
- Verify visual-only mp4 exists.
- ffprobe: 1080x1920, no audio stream, duration justified by story pacing.
- Frame screenshots at key moments.
- Verify no readable fake text/numerals in selected images.
- Verify Korean banknotes are clearly recognizable in money-dominant frames.
- Verify no mosaic/blank-money look remains in selected money-dominant frames.
- Verify typography is Pillow overlay / bold style.
- Verify generation latency log exists.
- Verify no forbidden paid/API provider calls.
- Verify no secret values are printed.
- `git status -sb`.

## Final Handoff Format

Report:

- changed files.
- generated additional image count and paths.
- selected image set used in patched video.
- actual measured image dimensions.
- patched visual-only mp4 path.
- duration and ffprobe result.
- frame screenshot paths.
- Korean banknote clarity verdict.
- mosaic/blank-money verdict.
- image dwell/pacing QA.
- typography QA.
- ChatGPT generation latency report.
- comparison against v2 baseline.
- comparison against v3 baseline.
- ChatGPT vs FLUX2 quality observation.
- whether the revised visual-only candidate is suitable for Owner viewing.
- checks/results.
- forbidden actions not performed.
- checkpoint recommendation.
- 전체프로젝트 진행률 : 약 91%.
