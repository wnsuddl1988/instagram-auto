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

- Task ID: `creative-v2-golden-sample-story-causality-visual-evidence-reset-v1` (직전 ID `creative-v2-golden-sample-story-visual-reset-v1`의 구체화판)
- **완료 (2026-07-02)**: reject lock + Owner 피드백 addendum + Story-Causality First 설계까지 산출. 신규 산출물:
  - `_ai/GOLDEN_SAMPLE_OWNER_FEEDBACK_ABSOLUTE_RULES_ADDENDUM_V1.md`
  - `scripts/fixtures/golden_sample_story_visual_rebuild_contract.v1.json` (프로세스 계약 + Story QA contract)
  - `scripts/fixtures/golden_sample_blueprint.salary_3days.v2.json` (v2 blueprint — `문제 → 원인 → 착시 → 해결책 → 행동` + 돈의 자리 3분할 해결책 + scene별 visual evidence + narration draft 32~45s + visual director prompt 초안 + next production plan)
  - 24ea7d3 후보는 `REJECT_AS_GOLDEN_SAMPLE / evidence_only` 고정, 산출물 무변경.
  - 다음 실행(이미지 생성/TTS)은 blueprint의 `nextProductionPlan` — Owner provider/비용/플래그 승인 대기.
- Owner 최신 결정: `현재 TTS mux 후보는 100점 만점에 약 80점. 화면/모션/대본/음성/자막은 나쁘지 않지만, Golden Sample 품질규격으로 픽스할 수 없다. 새로 다시 만들어야 한다.`
- 현재 후보 상태:
  - `C:\tmp\money-shorts-os\golden-sample-tts-first-mux-audit-v1\golden_sample_t2_salary_3days_tts_mux.mp4`는 업로드 가능한 후보 evidence일 수 있으나 Golden Sample baseline으로 채택하지 않는다.
  - `24ea7d3 feat(automation): add golden sample tts mux audit`는 보존하되, 산출물의 verdict는 `REJECT_AS_GOLDEN_SAMPLE / evidence_only`로 다룬다.
- 핵심 reject 원인:
  - 이미지가 `월급이 3일 만에 사라지는 이유`와 직관적으로 연결되지 않는다. 카드/표/자막이 보완해서 겨우 설득되는 구조다.
  - 사진만 봤을 때 월급/고정비/현금흐름/3일 소진의 상황이 바로 떠오르지 않는다.
  - `문제는 금액이 아니라 순서입니다`가 앞뒤 설명 없이 갑자기 나와서 맥락이 끊긴다.
  - 해결책/대안/효율적인 월급 사용 흐름이 부족하다. 훅은 좋지만 중간 진단에서 행동 제안으로 넘어가는 다리가 없다.
  - 짧은 caption flash는 좋지만 일부는 너무 짧다.
  - 길이는 반드시 30초일 필요가 없다. 주제와 스토리에 따라 길거나 짧아질 수 있다.
- 다음 책임 있는 작업:
  - 원문 절대규칙 파일 `_ai/CREATIVE_V2_GOLDEN_SAMPLE_ABSOLUTE_RULES.md`는 verbatim 보호이므로 수정하지 않는다.
  - 이번 Owner 피드백을 같은 우선순위의 addendum으로 신규 문서/fixture에 고정한다.
  - audit-only가 아니라 새 Golden Sample 제작을 위한 `Story-Causality First + Visual Evidence Second` 설계를 만든다.
  - 먼저 스토리 인과를 고정하고, 그 다음 각 장면이 증명해야 하는 시각 증거를 정의하고, 그 증거에 맞는 ChatGPT/LLM 이미지 프롬프트를 만든 뒤, 마지막으로 renderer가 카드/자막/모션을 얹는다.
  - 이미지는 먼저가 아니라 스토리의 증거로 따라와야 한다.
  - 새 설계는 `문제 -> 원인 -> 착시 -> 해결책 -> 행동` 인과가 끊기지 않아야 한다.
  - 이미지 프롬프트는 카드 없이도 주제 연관성이 보이도록 재설계해야 하며, 글자 리스크는 막되 돈처럼 보이는 오브젝트는 적극 허용한다.
  - 폰트/자막 방향은 레퍼런스 기반 정보 브리핑형: 두꺼운 검정 외곽선 + 강한 강조색 + 쇼츠형 정보 자막.
  - Story QA fields: `story_causality_score`, `problem_solution_bridge_score`, `solution_specificity_score`, `visual_subject_relevance_score`, `caption_readability_score`, `hook_self_relevance_score`.
  - Threshold: story/problem-solution/solution/caption/hook 각 85 이상, visual subject relevance 80 이상.
  - Hard fail: 문제 제기와 해결책 사이에 다리가 없으면 reject; 해결책이 추상어로 끝나면 reject; 이미지가 주제와 직관적으로 연결되지 않으면 reject; `순서`, `관리`, `정리` 같은 추상어를 설명 없이 쓰면 reject; 3개를 정하라고 말하면서 그 3개가 무엇인지 안 보여주면 reject.
- 이번 slice 금지: 이미지 생성/API 호출/TTS/mux/render/upload 금지. 먼저 reject lock + story/visual rebuild blueprint까지.
- 충돌 처리: 아래 남아 있는 과거 `rate-freeze/금리동결` 구조와 이전 PASS_CANDIDATE 문구는 historical context다. 이번 Current Approved Slice와 Owner 최신 피드백이 우선한다.

## Task ID

`creative-v2-golden-sample-story-causality-visual-evidence-reset-v1`

## Project

`C:\Users\PC\jjy\instagram-auto`

## Owner Directive Lock

This handoff locks the Owner's latest quality directive as the current absolute execution scope.

Do not reinterpret this recovery as "make an audit tool first." The purpose is to recover the broken Creative v2 direction and produce one good Golden Sample mp4 quality grammar, then lock the improved structure into the automation pipeline. `rate freeze / 금리 동결` is a test/sample topic, not a permanent topic lock.

## Current Checkpoint

- Branch: `codex/source-first-blueprint-clean`
- Latest HEAD: `25e8aed feat(automation): add golden sample visual typography revision`
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
