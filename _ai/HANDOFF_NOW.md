# HANDOFF_NOW

ROLE_MODE: CROSS_REVIEW_MODE
Claude Code 모델: Opus 4.8 (alias: opus)
사고 수준: high/높음
Claude Code 설정 힌트: `--model opus --effort high --permission-mode plan`
선정 이유: 유료 Google Flow UI 경계에서 여러 번 진단이 빗나갔고, `Make` 직후 상태 전이가 불명확하므로 독립적인 근본 원인 검토가 필요하다.

Tool Call Safety: 실제 도구 인터페이스만 사용하고 `<invoke>`, `<parameter>`, 가짜 Bash/Edit 태그 같은 출력용 도구 호출 마크업을 사용하지 않는다.

## Task

현재 Money Shorts의 Google Flow/Veo 자동화가 기준 이미지 등록과 프롬프트 입력 직후 새 Flow 탭을 닫고 실패하는 원인을 **읽기 전용으로 교차검토**한다.

## Owner Observation

- 실제 순서: 기준 이미지 등록 → 프롬프트 입력 → 창이 바로 닫힘.
- 생성 결과/승인 화면으로 진행되지 않음.
- 반복 유료 검증으로 Owner의 시간과 크레딧 손실이 있었으므로 추측성 수정이나 추가 라이브 클릭은 금지한다.

## Latest Local Evidence

- topic: `gen-finance-editorial-v2-success-habits-economic-signal-03`
- job: `gen-finance-editorial-v2-success_habits-economic_signal-03-part-2-scene-04`
- latest attempt: `d2792f66-2da0-400f-8c0e-3d04584d766e`
- summary status: `MAKE_CLICK_OUTCOME_UNKNOWN`
- failure: `required_generation_confirmation_dialog_missing:baseline=471,current=464,facts=0,interactive=0`
- `makeClickAttemptCount=1`
- `approvalClickAttemptCount=0`
- `submissionCount=0`, but `expectedCreditsSpent=null`; therefore retry is unsafe.
- attachment/prompt evidence succeeded:
  - `referenceIdentityMethod=controlled_single_attachment_transition`
  - `attachmentCount=1`
  - provider prompt hash matched.
- Owner says the new Flow tab closed immediately after prompt entry.

Relevant live summary (read only):
`C:\tmp\money-shorts-os\web-wizard-create-v1\gen-finance-editorial-v2-success-habits-economic-signal-03\real\money_shorts_semantic_prehook_series_v1\part-2\flow-motion-v1\scene-04\contract-535162bd0fbfdf51-1aa6b5d29200ae4e\generation-summary.json`

## Review Scope

Read only what is needed:

- `scripts/run-flow-motion-job-playwright-v1.mjs`
- `scripts/_flow-motion-confirmation-dom.mjs`
- `scripts/_flow-motion-generation-summary.mjs`
- `scripts/_flow-motion-reference-binding.mjs`
- `scripts/_flow-motion-result-binding.mjs`
- `scripts/check-flow-motion-runner-v1.mjs`
- `scripts/check-flow-motion-confirmation-dom-v1.mjs`
- the latest summary above

Determine:

1. Whether the code is clicking `Make` before an Owner/provider approval step, or whether current Flow sends generation directly on `Make`.
2. Why `required_generation_confirmation_dialog_missing` closes the runner-created tab instead of recovering a potentially submitted generation.
3. Whether `makeClickOutcomeUnknown` is being set too broadly or correctly.
4. The smallest robust state machine for:
   - exact image attachment
   - exact prompt entry
   - Make click
   - either confirmation-card approval OR direct provider submission detection
   - result binding and download without a second paid click
5. Which current tests gave false confidence and the exact missing regression fixture.

## Forbidden

- Do not edit any file.
- Do not run Browser/Chrome/Playwright against Google Flow.
- Do not click `Make`, approve generation, submit, download, or spend credits.
- Do not read or modify env/secrets.
- Do not run external uploads, publication, DB, deploy, commit, or push.
- Do not touch the protected files:
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - `scripts/get-youtube-refresh-token-once.mjs`

## Required Output

Return a concise Korean Cross Review report with:

- verdict: `PASS | NEEDS_FIX | BLOCKED`
- confirmed root cause(s), separating evidence from inference
- exact must-fix functions/state transitions
- missing tests
- whether the current attempt can be recovered without another Make click
- no code changes and no external side effects confirmation
