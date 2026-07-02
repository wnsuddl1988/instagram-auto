# HANDOFF_NOW

## Absolute Rules Pointer

- 최우선 source of truth: `_ai/CREATIVE_V2_GOLDEN_SAMPLE_ABSOLUTE_RULES.md`.
- 같은 우선순위 addendum: `_ai/GOLDEN_SAMPLE_OWNER_FEEDBACK_ABSOLUTE_RULES_ADDENDUM_V1.md`.
- 최신 Owner 기준이 이전 문서/핸드오프/렌더 보고와 충돌하면 최신 Owner 기준이 우선이다.

## Current Approved Slice

- Task ID: `golden-sample-chatgpt-playwright-visual-only-revision-v2`
- Status: approved for visual-only revision based on Owner feedback.
- Owner feedback:
  - ChatGPT+Playwright output looks better than FLUX2 overall.
  - The third image feels awkward.
  - Current visual-only candidate uses 4 images over 40s, so each image stays too long.
  - If using ChatGPT+Playwright, image generation burden is low enough that regeneration is acceptable when quality misses.
  - Image count may increase if that improves video quality.
  - Claude Code waited too long after ChatGPT had already generated images; add clear generation-speed rules.

## Current Candidate Status

- Existing visual-only candidate:
  `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-visual-only-v1\golden_sample_t1_lifestyle_inflation_visual_only.mp4`
- Current verdict: `PASS_CANDIDATE_FOR_OWNER_REVIEW`, but needs revision before next decision.
- Strength:
  - Better than FLUX2 on Owner-visible criteria: modern Korean everyday-finance feel, less foreign/old-money feel, no readable fake text.
  - Pillow overlay typography is much closer to desired bold info-shorts style.
- Weakness:
  - `img-03-img_03_illusion_scattered_spending.png` / third image feels awkward.
  - 4 images / 40s makes image dwell too long.
  - Need 6~7 visual beats and shorter runtime around 30~34s.

## Scope

- Use the same test topic:
  `t1_lifestyle_inflation` / `월급이 올라도 통장이 그대로인 이유`.
- This remains a Golden Sample test topic, not final channel-wide topic lock.
- Build a revised visual-only mp4 candidate.
- TTS/mux/upload remain forbidden.

## Image Generation Policy For This Revision

- Allowed path: ChatGPT+Playwright via existing Chrome CDP path.
- Must require `ALLOW_CHATGPT_IMAGE=1`.
- Cost cap: `$0`.
- Additional ChatGPT image submissions for this revision: max 8.
- Stop early when enough acceptable images exist for a 6~7 beat visual-only candidate.
- Regeneration is allowed within the max-8 cap when an image fails quality.
- Do not use OpenAI API, FLUX2/BFL, Gemini, Midjourney, or any paid API.
- Do not reuse old `salary_3days` image set.

## Required Visual Revision Goals

1. Replace or avoid the awkward third image.
2. Increase source image count used in the video from 4 to 6~7 beats.
3. Reduce final visual-only runtime from 40s to around 30~34s.
4. Keep Pillow overlay bold typography.
5. Keep Korean modern finance context.
6. Keep no readable fake text/numerals inside images.
7. Keep story causality:
   - 월급은 올랐는데 통장이 그대로
   - 오른 월급을 고정비/카드값/구독료/생활비가 흡수
   - 인상액만 기억하고 늘어난 지출은 흩어져 안 보임
   - 체감은 잔액이 아니라 돈의 자리에서 생김
   - 받는 날 먼저 나누기: 고정비 증가분 / 생활비 상한 / 남길 돈

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

## Preferred Revised Beat Plan

Target: 30~34s, 6~7 visual beats.

Suggested beats:

1. Hook: 월급은 올랐는데 통장은 그대로
   - existing img1 may be reused if still strong.
2. Problem: 더 벌었는데 월말 잔액은 안 늘어남
   - can reuse img1 or generate a stronger bank/wallet image.
3. Cause: 고정비/카드값/구독료/생활비가 먼저 빠짐
   - existing img2 may be reused.
4. Illusion replacement: 인상액은 한 덩어리로 기억되지만 늘어난 지출은 흩어져 안 보임
   - generate new image; do not use awkward current img3 unless Owner-visible quality improves.
5. Reframe: 돈이 안 모이는 게 아니라 오른 돈의 자리가 없었음
   - may be card-heavy with image as support.
6. Action: 받는 날 3칸으로 나누기
   - existing img4 is strong; reuse or regenerate if better.
7. Result: 다음 월급날부터 체감이 달라지는 정돈된 생활금융 장면
   - generate if needed.

## Required Outputs

Create/update repo-consistent names:

1. Update or add prompt fixture for revision:
   - suggested: `scripts/fixtures/chatgpt_playwright_image_prompts.t1_lifestyle_inflation.v2.json`
   - include reason for each prompt and target beat.

2. Update or add story/render manifest:
   - suggested: `scripts/fixtures/golden_sample_t1_lifestyle_inflation_story_blueprint.v2.json`
   - include 6~7 beat timing and image selection notes.

3. Update or add runner if needed:
   - existing `scripts/run-chatgpt-playwright-image-method-revalidation-v1.mjs` may be revised or a v2 runner may be added.
   - Must implement the speed rules above.
   - Must keep submission hard cap for revision at 8 additional submissions.

4. Update or add visual-only renderer:
   - existing `scripts/render-golden-sample-chatgpt-playwright-visual-only-v1.mjs` may be revised or a v2 renderer may be added.
   - Must keep Pillow overlay typography.
   - Must output revised visual-only mp4.

5. Output:
   - suggested folder: `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-visual-only-v2\`
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
- `chatgpt_generation_latency_report`
- `chatgpt_vs_flux2_observation`
- `recommendation`

## Forbidden

- OpenAI API calls.
- FLUX2/BFL API calls.
- Gemini calls.
- Midjourney calls.
- Any paid API call.
- More than 8 additional ChatGPT image submissions in this revision.
- Automatic retry that exceeds the cap.
- TTS.
- mux.
- upload.
- Treating `t1_lifestyle_inflation` as final channel-wide Golden Sample topic beyond this test.
- Reusing old `salary_3days` locked image set.
- Env/secret/dependency/DB/deploy changes.
- Reading `.env.local`, `.money-shorts-local`, secret files.
- Reading/modifying/staging `_ai/CONTEXT_TRANSFER_CODEX.md` or `piq_diag_out.txt`.
- Touching rejected salary_3days visual-only render diff unless explicitly needed only to avoid conflict. In particular do not modify/stage:
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`

## Current Git Context

- Latest checkpoint: `42afe2f docs(automation): reset golden sample direction`.
- Existing uncommitted files include current ChatGPT v1 visual-only candidate files and excluded/rejected files.
- Do not stage/commit/push.

## Required Checks

- JSON parse all new/updated JSON fixtures/reports.
- `node --check` for changed/new scripts.
- Verify additional ChatGPT submission count <= 8.
- Verify total selected images in revised video: 6~7 visual beats or justify otherwise.
- Verify visual-only mp4 exists.
- ffprobe: 1080x1920, no audio stream, duration about 30~34s.
- Frame screenshots at key moments.
- Verify no readable fake text/numerals in selected images.
- Verify typography is Pillow overlay / bold style.
- Verify generation latency log exists.
- Verify no forbidden paid/API provider calls.
- Verify no secret values are printed.
- `git status -sb`.

## Final Handoff Format

Report:

- changed files.
- generated additional image count and paths.
- selected image set used in revised video.
- actual measured image dimensions.
- revised visual-only mp4 path.
- duration and ffprobe result.
- frame screenshot paths.
- third image replacement verdict.
- image dwell/pacing QA.
- typography QA.
- ChatGPT generation latency report.
- ChatGPT vs FLUX2 quality observation.
- whether the revised visual-only candidate is suitable for Owner viewing.
- checks/results.
- forbidden actions not performed.
- checkpoint recommendation.
- 전체프로젝트 진행률 : 약 91%.
