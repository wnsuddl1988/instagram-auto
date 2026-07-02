# HANDOFF_NOW

## Absolute Rules Pointer (최우선)

- 현재 Creative v2 / Golden Sample recovery의 **최우선 source of truth**는 `_ai/CREATIVE_V2_GOLDEN_SAMPLE_ABSOLUTE_RULES.md` (Owner 절대규칙 원문 verbatim, 2026-07-02 고정)이다.
- **같은 우선순위 addendum**: `_ai/GOLDEN_SAMPLE_OWNER_FEEDBACK_ABSOLUTE_RULES_ADDENDUM_V1.md` (2026-07-02) — Owner 80점 reject 피드백 고정: `Story-Causality First + Visual Evidence Second` 원칙 전환, 새 Story QA fields/threshold/hard fail, money-like objects 허용 이미지 정책, 30초 고정 금지(32~45초), caption dwell ≥0.7s. 원문과 충돌 시 addendum의 최신 Owner 결정 우선.
- 다른 문서/핸드오프/요약과 충돌하면 항상 이 파일의 원문이 우선한다. 작업 시작 전에 먼저 읽어라.

## Decision Packet Pointer

- 다음 방향 판단 자료: `_ai/GOLDEN_SAMPLE_QUALITY_STABILIZATION_DECISION_PACKET_V1.md` (2026-07-02) — 자동화 전 Golden Sample 품질 안정화 재정렬, 살릴 것/버릴 것, 이미지/비주얼 source 복구 선택지 4개와 선택지별 승인/위험/검증 기준. Owner 결정 전 render 금지.
- 이미지 source 복구 결정 자료: `_ai/GOLDEN_SAMPLE_IMAGE_SOURCE_RECOVERY_DECISION_PACKET_V1.md` (2026-07-02) — 1080x1920+ provider 후보 비교(A: Imagen 4 상위/B: OpenAI/C: FLUX/D: 참고), visual director 재설계 요건, Golden Sample 주제 후보 T1/T2/T3 비교(추천 T2), 필요 승인 범주와 승인 문구 템플릿. 실행 승인 아님 — Owner 결정 대기.
- 품질/모션 계약: `_ai/GOLDEN_SAMPLE_VISUAL_QUALITY_AND_CARD_MOTION_CONTRACT_V1.md` (2026-07-02) — OpenAI 3장 benchmark 고정 + FLUX2 운영 후보 prompt/gate 계약 + 카드/모션/타이포/TTS 싱크 계약(min 14 events/30s, 첫 2s hook, anti-cheap-PPT). fixture 2종: `golden_sample_visual_quality_benchmark.v1.json`, `golden_sample_card_motion_contract.v1.json`.
- FLUX2 object-whitelist 계약: `_ai/GOLDEN_SAMPLE_FLUX2_OBJECT_WHITELIST_CONTRACT_V2.md` (2026-07-02) — 소량 검증(no-text clean 1/4) 실측 기반 전략 전환: negative 강화 → object-whitelist 구도 재번역. fixture: `golden_sample_flux2_object_whitelist_contract.v2.json` (T2 scene 1~6 재번역 프롬프트 + qaGateV2 + 다음 검증 추천 4장/$1 이하).
- Selected image set lock + 자막 계약: `_ai/GOLDEN_SAMPLE_FLUX2_SELECTED_IMAGE_SET_LOCK_V1.md` (2026-07-02, T2 6-scene FLUX2 이미지 고정 + MD5 무결성) + `_ai/GOLDEN_SAMPLE_REELS_DYNAMIC_CAPTION_CONTRACT_V1.md` (하단 고정 자막 금지, TTS 동기 dynamic caption — 다음 render 시 필수 적용). fixture 2종: `golden_sample_flux2_selected_image_set_lock.v1.json`, `golden_sample_reels_dynamic_caption_contract.v1.json`.
- provider 공식 문서 확인 결과: `_ai/PROVIDER_OFFICIAL_DOC_VERIFICATION_REPORT_V1.md` (2026-07-02, 보정 v1.1) — Imagen 4는 2026-08-17 shutdown(비추천), 1순위 B: OpenAI gpt-image-2(임의 WIDTHxHEIGHT 16배수 + 공식 가격 체계 확인, custom size 정확 비용만 산정 필요), 2순위 A′: gemini-3.1-flash-image 2K($0.101/장, 정확 픽셀 실측 필요), 3순위 C: FLUX.2(width/height 파라미터·flexible aspect ratios 공식 확인, 최대 픽셀/acceptance 추가 확인 필요 + 신규 credential — 허용 시 강한 후보). 소량 테스트 B+A′ 병행 8장/상한 $3 제안 + Owner 승인 문구 초안 포함.

## Current Approved Slice (2026-07-02)

- Task ID: `creative-v2-golden-sample-v2-s6-flux2-denomination-patch-v1`
- Status: completed by Claude Code, verdict `BLOCKED_S6_PATCH_FAILED`.
- Latest checkpoint before this slice: `3d6122d test(automation): add denomination render probe` (branch ahead 153 before this uncommitted slice).
- Owner approved scope was exactly: FLUX.2 [pro] max 2 images for `s6_result_clear_after` only, cost ceiling $0.50, `BFL_API_KEY` allowed, keep successful composition intent (foreground open wallet + three background envelopes + bright morning tone), force `banknote back side / folded notes / denomination side facing down / no visible numeral`, no OpenAI/ChatGPT/Gemini/Midjourney, no render/TTS/mux/upload, stop after image generation + denomination re-probe QA.
- Result evidence:
  - Output folder: `output/money-shorts/golden-sample-v2-s6-flux2-denomination-patch-v1/`.
  - Summary: `output/money-shorts/golden-sample-v2-s6-flux2-denomination-patch-v1/summary-golden-sample-v2-s6-flux2-denomination-patch.json`.
  - QA report: `output/money-shorts/golden-sample-v2-s6-flux2-denomination-patch-v1/qa-report-golden-sample-v2-s6-flux2-denomination-patch.json`.
  - Create calls: 2/2, poll calls 16, cost estimate about $0.13, endpoint/size/provider fallback 0.
  - `s6_P_A`: native 1088x1936, story evidence PASS, but folded bill still has a visible `2` in the viewer frame; verdict `PATCH_STILL_NEEDED`.
  - `s6_P_B`: native 1088x1936, but readable hard text/garbled letterforms and clear denomination remain; verdict `REJECT_FOR_HARD_TEXT`.
- Codex review judgment:
  - Accept the slice as useful evidence and keep it as a checkpoint.
  - Do not spend more FLUX2 calls on s6 prompt-only denomination suppression without a new explicit Owner decision; the evidence now shows cash-hero closeups keep regenerating readable denomination/text risk.
  - Selected image set lock remains blocked; `renderReady=false`, `uploadReady=false`.
- Recommended next substantive slice after checkpoint:
  - Cost 0 option first: use `s6_P_A` as a probe candidate and reposition the final/save card over the visible `2` area, then run a no-API denomination re-probe only.
  - Do not lock the selected image set unless that re-probe clears the viewer-frame readable denomination risk.
- Still forbidden:
  - Additional image/API calls, other providers, s1~s5 generation/modification, full visual render, TTS, mux, upload, dependency/env/secret changes, push.
  - Reading/modifying/staging `_ai/CONTEXT_TRANSFER_CODEX.md` or `piq_diag_out.txt`.

## Task ID

`creative-v2-golden-sample-v2-s6-flux2-denomination-patch-v1`

## Project

`C:\Users\PC\jjy\instagram-auto`

## Owner Directive Lock

This handoff locks the Owner's latest quality directive as the current absolute execution scope.

Do not reinterpret this recovery as "make an audit tool first." The purpose is to recover the broken Creative v2 direction and produce one good Golden Sample mp4 quality grammar, then lock the improved structure into the automation pipeline. `rate freeze / 금리 동결` is a test/sample topic, not a permanent topic lock.

## Current Checkpoint

- Branch: `codex/source-first-blueprint-clean`
- Latest HEAD: `3d6122d test(automation): add denomination render probe`
- Approx status when this handoff was refreshed: branch ahead of `origin/main`; pre-existing modified `_ai/CODEX_REVIEW.md`, `_ai/NEXT_ACTION.md`, `_ai/PROJECT_STATE.md`; untracked `_ai/CONTEXT_TRANSFER_CODEX.md`, `piq_diag_out.txt`.
- Do not read, modify, delete, stage, or commit `_ai/CONTEXT_TRANSFER_CODEX.md` or `piq_diag_out.txt`.
- Push: not approved.

## Owner Correction / Current Block

Owner corrected Codex on 2026-07-02:

- Golden Sample is for stabilizing the quality engine before automation, not for locking the product to one `금리 동결` topic forever.
- `금리 동결` is a current test/sample topic only. The quality grammar must later support a mix of economy, money, psychology, success, life judgment, cash-flow, and growth-story topics.
- Do not optimize for "somehow finishing rate-freeze"; optimize for reusable high-quality Shorts grammar: strong hook, strong image/visual source, TTS rhythm, card-first explainer, perceptual motion, and post-render audit.
- The earlier A안 / background-only reuse recommendation is rejected.
- Do not use the existing selected image set as the Golden Sample final background set.
- The original recovery directive identified an image-quality failure, not only a resolution failure: the images were generic and weak at explaining rate freeze, loans, deposits, and cash flow.
- Reusing the existing `941x1672` set as dim/blur backgrounds would violate the recovery goal, even if cards/text render at 1080x1920.

Current decision:

- Treat the existing selected image set as evidence/reference only, not final render input.
- Treat the one-scene live probe image as evidence only, not final render input.
- Keep placeholder/local mock/stock fallback forbidden.
- Keep simple upscale/crop-as-fix forbidden.
- Do not proceed to visual-only render until a genuinely stronger image source/path is approved and produces a new high-quality selected image set.

Next responsible action:

- Run the separately approved Golden Sample visual-only render slice only.
- Use `scripts/fixtures/golden_sample_flux2_selected_image_set_lock.v1.json` as the canonical image source; verify MD5 before render and abort on mismatch.
- Use `scripts/fixtures/golden_sample_reels_dynamic_caption_contract.v1.json`; bottom-fixed subtitles are forbidden. Since TTS has not been generated yet, captions may use provisional visual phrase timing for this visual-only candidate, but must be marked as `ttsTimingSource=provisional_visual_only` and later replaced by actual TTS word/phrase timing.
- Render one visual-only 1080x1920 mp4 candidate with card-image hybrid layout, motion, and dynamic captions. Audio stream must be absent.
- Produce frame screenshots at 0/2/5/10/15/20/26/30s and QA report for card/caption overlap, readability, safe-area, bottom 15% permanent caption occupancy, and first 2s hook caption.
- Stop after visual-only render QA. Do not TTS/mux/upload.

## Fixed Samples

Accepted baseline mp4:

`C:\tmp\money-shorts-os\selected-image-elevenlabs-tts-mux-voice-caption-v3-1-tailfit\premium-editorial-selected-image-visual-only-v1-tts-mux.mp4`

Rejected Creative v2 mp4:

`C:\tmp\money-shorts-os\creative-voice-sound-mux-elevenlabs-v2-first-run\money-shorts-creative-final-visual-youtube-safe-frame-v1-tts-mux.mp4`

Rejected v2 report:

`C:\tmp\money-shorts-os\creative-voice-sound-mux-elevenlabs-v2-first-run\creative-voice-sound-mux-elevenlabs-v2-report.json`

Rejected v2 TTS summary:

`C:\tmp\money-shorts-os\creative-voice-sound-mux-elevenlabs-v2-first-run\elevenlabs-scene-paced-tts-summary.json`

## Problem Definition

Creative v2 is officially rejected. `ffprobe` passing is only media validity, not quality.

Failure causes to address together:

- Script: hook sounds like a title, first 2 seconds do not stop the viewer, information is too abstract, action point is weak.
- TTS: scene-level raw durations were shorter than target durations; padding stretched the video; scene-by-scene TTS likely broke rhythm and consistency; speech density was too low for a 30s short.
- Visual: planned event count was not perceptual event count; the mp4 felt like 6 slow-moving images; full-screen image plus bottom caption remained dominant.
- Image: generic images did not explain rate freeze, loans, deposits, or cash flow.
- Scorer: pre-render JSON scoring did not inspect actual mp4 silence, voice rhythm, visual rhythm, image quality, card impact, or readability.

## Absolute Goal

Maintain the automated topic-to-upload pipeline direction:

`topic list -> candidate video generation -> quality scorer/audit best candidate selection -> final render -> platform metadata -> upload queue readiness`

But for this recovery slice, do not expand to bulk generation or upload. First produce one good `금리 동결` Golden Sample and make the structure enforceable.

## Execution Order

Follow this order. Do not skip ahead to audit-only work.

1. Stop State Lock
   - Record Creative v2 as the rejected sample.
   - Keep accepted final as the baseline/reference.
   - Verify upload/SFX/new-topic expansion guards.
   - Keep `uploadReady=false`.

2. Image Generation Contract
   - Require the existing ChatGPT/LLM-based image generation path.
   - Require visual director prompts.
   - Require selected image set and image quality gate.
   - Forbid placeholder/local mock/stock-like fallback final images.
   - If good images are unavailable, regenerate image prompt/image or skip topic; never render final with low-quality fallback.

3. Visual Director Prompt v1
   - Add `build-money-shorts-visual-director-prompt-v1.mjs` or the closest repo-consistent equivalent.
   - Generate six `금리 동결` image prompts.
   - Style: premium editorial financial explainer, cinematic, realistic, high detail, vertical 9:16.
   - Forbid readable text inside image, watermark, distorted hands, generic smiling office worker, fake unreadable charts, low-quality stock feel.

4. Golden Sample Blueprint v1
   - Create one single source of truth for the 30s `금리 동결` sample.
   - Include script, scene/card timeline, image prompt mapping, TTS phrase mapping, perceptual event plan, and card-image hybrid design.

5. TTS-first Timeline Contract
   - Preferred TTS strategy: full narration one-shot.
   - Second choice: hook/body/closing three-block TTS.
   - Do not use six short scene-level TTS calls as the default.
   - Measure actual audio duration and speech active duration before final visual timing.
   - Reflow scene/timeline from real TTS timing.
   - Do not pad short TTS with silence or `apad=whole_dur`.

6. Card-Image Hybrid Renderer v1
   - Add a new renderer mode such as `card_image_hybrid_v1`; do not delete the existing renderer.
   - Use selected high-quality LLM-generated images as dim/blur/crop/parallax background.
   - Make cards the primary information surface.
   - Required templates: `big_hook_card`, `curiosity_contrast_card`, `checklist_card_1`, `checklist_card_2`, `checklist_card_3`, `twist_single_sentence_card`, `final_action_card`, `dim_blur_background`, `card_slide_in`, `card_punch_zoom`, `checklist_pop`, `safe_frame_text_layout`.
   - Output: `visual_only.mp4`, `render_manifest.json`, `actual_card_timeline.json`, `perceptual_event_report.json`.

7. Post-Render Artifact Audit v1
   - Audit actual mp4 artifacts, not only JSON plans.
   - Rejected v2 must fail.
   - Accepted baseline may be `reference/pass_with_known_limits`.
   - New Golden Sample should be evaluated as the pass candidate.

8. Golden Sample Render
   - Topic: `금리 동결`.
   - Produce full 30s final candidate, not only preview.
   - Keep `uploadReady=false`.
   - Produce Owner-reviewable before/after artifacts.

9. Report
   - Compare accepted baseline vs rejected v2 vs new Golden Sample.
   - Report image generation path validity, TTS padding removal, card presence ratio, perceptual event count, first 2s hook card presence/impact, and final recommendation.

## Golden Sample Structure

Use this 30s structure as the shared source for script, captions, visual events, image prompts, TTS timeline, and renderer.

- `0.0~2.0s Hook`
  - Voice: `금리 동결? 아직 안심하면 안 됩니다.`
  - Text: `아직 안심 금지`
  - Visual: dim/blur high-quality financial background plus central big hook card and impact motion.
- `2.0~5.0s Curiosity`
  - Voice: `금리는 멈췄지만, 내 이자는 바로 안 멈출 수 있습니다.`
  - Text: `내 이자는 다릅니다`
  - Visual: rate-news card contrasted with wallet/loan card.
- `5.0~10.0s Point 1`
  - Voice: `첫째, 변동금리는 반영 시점을 확인해야 합니다.`
  - Text: `변동금리: 반영 시점`
  - Visual: checklist card for variable rate / reflection timing / next payment date.
- `10.0~15.0s Point 2`
  - Voice: `둘째, 예금은 갈아타기 전에 만기와 손실을 봐야 합니다.`
  - Text: `예금: 만기·손실 확인`
  - Visual: checklist card for deposit switch / maturity / early withdrawal loss.
- `15.0~20.0s Point 3`
  - Voice: `셋째, 대출자는 월 납입액을 다시 계산해야 합니다.`
  - Text: `대출: 월 납입액`
  - Visual: checklist card for loan / monthly payment / fixed costs.
- `20.0~26.0s Twist`
  - Voice: `뉴스는 금리를 말하지만, 내 지갑은 현금흐름이 결정합니다.`
  - Text: `내 지갑은 현금흐름`
  - Visual: single-sentence big card, short pause before impact.
- `26.0~30.0s Action`
  - Voice: `오늘은 금리보다 고정비부터 확인하세요.`
  - Text: `오늘 할 일: 고정비 확인`
  - Visual: final action checklist card.

## Image Generation Policy

Add/enforce an equivalent contract:

```json
{
  "image_generation_policy": {
    "required_provider_path": "chatgpt_or_llm_image_generation",
    "allow_placeholder": false,
    "allow_local_mock_for_final": false,
    "allow_stock_like_fallback": false,
    "require_visual_director_prompt": true,
    "require_selected_image_set": true,
    "require_image_quality_score": true,
    "on_image_generation_failure": "regenerate_image_or_skip_topic"
  }
}
```

Image quality gate must enforce:

- `min_resolution`: `1080x1920`
- `orientation`: vertical 9:16
- subject relevance required
- generic stock feel forbidden
- text inside image forbidden
- watermark forbidden
- blurred/low-detail output forbidden
- final render requires selected image set

## TTS-first Metadata

Add/enforce an equivalent contract:

```json
{
  "tts_strategy": "full_narration_one_shot | three_block",
  "actual_audio_duration": 0.0,
  "speech_active_duration": 0.0,
  "silence_ratio": 0.0,
  "phrase_alignment": [
    {
      "phrase_id": "hook",
      "text": "",
      "audio_start": 0.0,
      "audio_end": 0.0,
      "visual_start": 0.0,
      "visual_end": 0.0
    }
  ],
  "padding_used": false,
  "requires_script_rewrite": false,
  "requires_timeline_reflow": false
}
```

## Perceptual Event Policy

Separate `planned_event_count` from `perceptual_event_count`.

Only count perceptual events such as:

- 15%+ visible area change
- new information card
- big hook card
- number/checklist/arrow/warning card
- background dim/blur transition
- layout change
- split screen
- freeze punch
- hard cut
- card stack transition
- meaningful caption/card change

Do not count:

- slow pan of the same image
- slow zoom of the same image
- tiny icon appearance
- bottom subtitle swap only
- decorative overlay
- barely visible micro movement

Quality gates must use `perceptual_event_count`, not decorative planned event count.

## Mandatory Outputs

Produce these artifacts, with repo-consistent locations and names if exact paths differ:

1. `image_generation_contract.json`
2. `visual_director_prompts.rate_freeze.v1.json`
3. `golden_sample_blueprint.rate_freeze.v1.json`
4. `tts_first_timeline_contract.v1.json`
5. `card_image_hybrid_render_manifest.v1.json`
6. `post_render_artifact_audit.samples.v1.json`
7. `post_render_artifact_audit.output.v1.json`
8. `golden_sample_rate_freeze_visual_only.mp4`
9. `golden_sample_rate_freeze_tts_mux.mp4`
10. `golden_sample_recovery_report.v1.json`

## Hard Fails

- Final render uses placeholder image.
- ChatGPT/LLM image generation path is bypassed.
- Selected image set is missing.
- First 2s hook card is missing.
- First 5s contains long silence.
- Scene length is filled by padding.
- `apad=whole_dur` or equivalent silence stretching is used to fake duration.
- `perceptual_event_count` is insufficient.
- Full-screen image dominance is too high.
- Card presence ratio is low.
- `uploadReady=true` appears before post-render audit pass.
- The work ends after making audit only.

## Forbidden

- Do not make an audit-only slice and stop.
- Do not do SFX-only work.
- Do not only tune thresholds.
- Do not expand to new topics.
- Do not start bulk candidate generation.
- Do not create upload queue readiness.
- Do not upload, post, deploy, push, or change DB/env/secrets.
- Do not add dependencies or edit lockfiles without explicit Owner approval.
- Do not replace LLM image generation with placeholder, plain color, local mock final, or stock-like fallback.
- Do not lower image quality because this is card-first.
- Do not render final if good selected images are unavailable.
- Do not use six scene-by-scene short TTS calls as the default.
- Do not pad short audio to target scene duration.
- Do not treat `ffprobe` pass as quality pass.
- Do not read, modify, delete, stage, or commit `_ai/CONTEXT_TRANSFER_CODEX.md` or `piq_diag_out.txt`.

## External/API Safety

The Owner directive requires preserving the ChatGPT/LLM image generation path and real TTS-first recovery. Use only already-approved, existing project paths and credentials. If a live API call, paid external action, missing credential, or permission boundary blocks execution, stop and report the exact blocker. Do not silently substitute placeholder/local mock final assets.

## Required Checks

Choose focused checks that match changed files, plus real artifact checks for produced mp4s.

At minimum:

- Static/contract checks for newly added JSON/contracts/scripts.
- Media validity for generated mp4s.
- Post-render artifact audit over accepted baseline, rejected v2, and new Golden Sample.
- Evidence that rejected v2 fails and new Golden Sample is a pass candidate or a clearly reported blocker.

## CLAUDE_REPORT Policy

Update `_ai/CLAUDE_REPORT.md` because this is a high-impact recovery slice with reusable evidence. Include changed files, produced artifacts, checks/results, deviations/blockers, and checkpoint recommendation.

## Checkpoint Policy

Do not commit or push. Stop after final handoff to Codex.
