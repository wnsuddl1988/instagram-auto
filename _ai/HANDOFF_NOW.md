# HANDOFF_NOW

## Absolute Rules Pointer

- 최우선 source of truth: `_ai/CREATIVE_V2_GOLDEN_SAMPLE_ABSOLUTE_RULES.md`.
- 같은 우선순위 addendum: `_ai/GOLDEN_SAMPLE_OWNER_FEEDBACK_ABSOLUTE_RULES_ADDENDUM_V1.md`.
- 최신 Owner 기준이 이전 문서/핸드오프/렌더 보고와 충돌하면 최신 Owner 기준이 우선이다.

## Current Approved Slice

- Task ID: `golden-sample-direction-reset-money-economy-psychology-v1`
- Status: approved for no-cost direction reset only.
- Owner directive: 기존 실패 산출물을 기준으로 계속 제작하지 말고, Codex/Claude가 잘못 이해한 Golden Sample 방향을 명확히 개선한다.
- This slice is not video production. It is a reset/decision package before any further image generation or render.

## Latest Owner Rejection Lock

- `golden_sample_v2_salary_3days_visual_only.mp4` is `REJECT_AS_GOLDEN_SAMPLE / TECHNICAL_EVIDENCE_ONLY`.
- Do not keep or describe the previous `PASS_PROVISIONAL_VISUAL_ONLY` as a Golden Sample pass.
- The current rejected candidate may be referenced only as evidence of what failed:
  - caption/font did not change enough and still felt default/Malgun-Gothic-like.
  - images looked old, foreign, and disconnected from Korean money/paycheck context.
  - foreign/unknown currency feeling is a hard fail for Korean money/economy topics.
  - topic continuation happened without re-confirming Owner's topic choice.
  - technical PASS is not Golden Sample PASS.

## Golden Sample Production Criteria Lock

1. Owner가 주제 확정 전에는 이미지 생성/API/render 금지.
2. 유료 호출 전에는 비용 상한, 장수, 실패 조건, 중단 조건, 기대 이미지 기준을 Owner가 명시 승인해야 한다.
3. 돈/경제 주제는 한국 시청자 기준의 즉시성 필수:
   - 한국 돈/통장/월급/생활비/이체/카드/봉투 맥락.
   - 외국 지폐 느낌, 오래된 경제 자료 느낌, 정체불명 화폐 느낌은 hard fail.
4. AI 이미지 안의 글자/숫자는 원칙적으로 믿지 않는다.
   - 정확한 정보/팩트/라벨은 renderer 카드와 자막이 담당.
   - 이미지 속 가짜 문자, 깨진 숫자, 외국 화폐 액면은 reject.
5. 자막/폰트는 별도 품질 기준:
   - 기본 Malgun Gothic 느낌 금지.
   - 굵은 정보형 쇼츠 폰트.
   - 두꺼운 검정 외곽선.
   - 강한 강조색.
   - 레퍼런스형 짧은 정보 자막.
6. Story-Causality First:
   - 문제 → 원인 → 착시 → 해결책 → 행동 → 결과.
   - 이 흐름을 Owner가 먼저 납득해야 이미지/렌더 진행 가능.
7. Visual Evidence Second:
   - 이미지는 예쁜 배경이 아니라 각 장면의 증거.
   - 카드가 설명해야 겨우 이해되는 이미지는 reject.
8. 기술 PASS는 Golden Sample PASS가 아님.
   - ffprobe, MD5, overlap QA는 기본 조건.
   - 최종 기준은 Owner 시청 QA.
9. Owner가 PASS 전에는 TTS/mux/upload/자동화 확장 금지.
10. 비용 발생 작업은 “승인된 장수 안에서 실패하면 즉시 중단”이 원칙.

## Direction Reset

- Reference video means production grammar inspiration only. It is not a topic copy request and not a command to switch to KOSPI/live macro news.
- Channel direction: money + economy + psychology + success patterns.
- Topic is not fixed. `월급이 3일 만에 사라지는 이유` can be one candidate, but Claude/Codex must not finalize it without Owner approval.
- New priority order:
  1. Story-Causality First.
  2. Visual Evidence Second.
  3. Image prompt/provider only after Owner approves topic and expected visual standard.
  4. Renderer/card/caption/motion after story and visual evidence are approved.

## Required Outputs For This Slice

Create these files without external calls:

1. `_ai/owner_intent_interpretation.v1.md`
   - Explain Owner intent for the reference: production grammar, not topic copy.
   - Lock the channel line: money/economy/psychology/success patterns.
   - Explicitly state that topic finalization requires Owner approval.

2. `scripts/fixtures/topic_candidate_report.v1.json`
   - 5 candidates inside the approved channel line.
   - Score each candidate.
   - Recommend 1-2 candidates.
   - Include `requires_owner_approval: true`.

3. `scripts/fixtures/reference_mechanics_contract.v1.json`
   - Reference-inspired production mechanics: hook, story, fact density, typography, visual rhythm, CTA.
   - Do not claim exact cloning of the Instagram reference.

4. `scripts/fixtures/bold_info_shorts_font_contract.v1.json`
   - Font/caption criteria.
   - Malgun Gothic fallback forbidden.
   - Include installed font detection results for: Pretendard Black/ExtraBold, Noto Sans KR Black/ExtraBold, SUIT Heavy, Gmarket Sans Bold.
   - If none are available, fail/report and do not silently use Malgun Gothic.

5. Typography mock frames:
   - `output/money-shorts/golden-sample-direction-reset-money-economy-psychology-v1/typography_mock_frames/mock_frame_01_hook.png`
   - `output/money-shorts/golden-sample-direction-reset-money-economy-psychology-v1/typography_mock_frames/mock_frame_02_fact_card.png`
   - `output/money-shorts/golden-sample-direction-reset-money-economy-psychology-v1/typography_mock_frames/mock_frame_03_mechanism.png`
   - `output/money-shorts/golden-sample-direction-reset-money-economy-psychology-v1/typography_mock_frames/mock_frame_04_action.png`
   - Local shapes/text only. No paid image/API. Not a full video render.

6. `_ai/owner_review_questions.md`
   - Ask for topic candidate selection.
   - Ask for font/caption approval.
   - Ask for image direction approval.
   - Ask for next image generation count/cost approval.

## Forbidden In This Slice

- paid API calls.
- image generation.
- TTS.
- mux.
- full video render.
- upload queue.
- reusing the `salary_3days` locked image set as a new direction.
- preserving current `PASS_PROVISIONAL_VISUAL_ONLY` as a Golden Sample pass.
- switching to KOSPI/live economy news without Owner approval.
- finalizing any topic without Owner approval.
- env/secret/dependency/DB/deploy changes.
- reading/modifying/staging `_ai/CONTEXT_TRANSFER_CODEX.md` or `piq_diag_out.txt`.

## Required Checks

- JSON parse all new JSON fixtures.
- Confirm mock frame PNG files exist if an approved font is found.
- Confirm no external-call code or commands were used.
- Confirm no secret/env values are read or printed.
- Confirm no `renderReady:true` or `uploadReady:true` is introduced.
- Confirm `git status -sb` and changed files.

## Final Handoff Format

Report:

- changed files.
- generated mock frame paths, or explain why mock generation was blocked by missing approved fonts.
- font detection result.
- recommended 1-2 topic candidates.
- checks/results.
- forbidden actions not performed.
- checkpoint recommendation.
- 전체프로젝트 진행률: keep around `약 91%` unless new evidence justifies a conservative change.
