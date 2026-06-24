# CLAUDE_REPORT — Source-First Money Shorts OS

**갱신:** 2026-06-25

## Current Direction

Owner가 제품 중심축을 정정했다.

- Money Shorts OS의 본체는 **출처 기반 금융·경제 쇼츠 제작 OS**다.
- Money-OS는 메인 콘텐츠가 아니라 필요한 경우 붙는 CTA/전환 레이어다.
- 콘텐츠 비중은 출처 기반 금융·경제 쇼츠 70%, Money-OS 연결형 돈관리 쇼츠 30%다.
- 각 쇼츠는 반드시 Fact Card를 먼저 만든 뒤 Video Blueprint와 대본으로 넘어간다.
- AI는 Fact Card에 없는 숫자나 사실을 상상해서 대본을 쓰면 안 된다.

## Latest Local Evidence

- Clean working branch: `codex/source-first-blueprint-clean`
- Source Fact Card foundation copied onto clean `origin/main` base.
- Previous Candidate10 / static plate / 3D character / code-GFX route commits are not part of this branch.

Implemented source foundation:

- `lib/source-facts/types.ts`
- `lib/source-facts/fixtures.ts`
- `lib/source-facts/validation.ts`
- `lib/source-facts/index.ts`

Implemented Video Blueprint module (`money-shorts-os-fact-card-to-blueprint-v1` + review fix pass):

- `lib/blueprints/types.ts` — VideoBlueprint, VideoBlueprintScene, 7개 union type; TemplateKey를 spec 정렬값으로 교체 (indicator_summary / rate_fx_change / disclosure_summary / earnings_numbers / money_os_support)
- `lib/blueprints/generator.ts` — createBlueprintFromFactCard (15/30/60s, CTA 옵션); estimatedDuration이 scene duration(not end timestamp)임을 보장; new Date() 제거 — createdAt은 options.createdAt 주입 방식으로만; deriveTemplateKey spec 정렬
- `lib/blueprints/validation.ts` — validateVideoBlueprint; 신규 timing 검증 3개 추가: (1) start_time_not_ordered, (2) scene_exceeds_target_duration, (3) duration_mismatch
- `lib/blueprints/fixtures.ts` — inflationBlueprint30, exchangeRateBlueprint15, dartDisclosureBlueprint60, MOCK_BLUEPRINTS
- `lib/blueprints/index.ts` — re-export

Validation evidence (2026-06-25, review fix):

- Blueprint module TypeScript strict check: PASS (0 errors)
- Blueprint module ESLint: PASS (0 warnings)
- Timing arithmetic verification:
  - 15s: sum=15, max_end=15 ✅
  - 30s no-CTA: sum=30, max_end=30 ✅
  - 30s CTA: sum=30, max_end=30 ✅
  - 60s no-CTA: sum=60, max_end=60 ✅
  - 60s CTA: sum=60, max_end=60 ✅
- validation.ok for 3 mock fixtures: all true ✅
- Broken blueprint (scene dur=99, sum mismatch): validation.ok=false, codes=[scene_exceeds_target_duration, duration_mismatch] ✅

## Active Next Task

Task ID:

- `money-shorts-os-risk-review-v1` (Implementation Order Step 6)

Goal:

- Financial expression scanner for generated scripts, captions, and CTA.
- No external API, AI generation, TTS, video render, ffmpeg, DB, payment, upload, deploy, or push.

## Implemented Script Generator module (`money-shorts-os-fact-card-script-generator-v1`):

- `lib/scripts/types.ts` — GeneratedScriptPackage, DurationScript, ScriptScene, ScriptPackageValidationResult, 2개 union type (ScriptSceneGoal, ScriptSceneVisualType)
- `lib/scripts/generator.ts` — generateScriptPackage(blueprint, options); new Date() 없음 — options.createdAt 주입 방식; SNS copy (youtubeTitle/instagramCaption/description/hashtags) 전부 Blueprint 필드에서만 파생; allDurations 옵션 제거(review-fix: 계약-구현 불일치 수정)
- `lib/scripts/validation.ts` — validateScriptPackage; narration/caption 빈값, source linkage 누락(factCardIds/sourceCitationIds/sourceNote), storyboard 빈값 검증
- `lib/scripts/fixtures.ts` — inflationScriptPackage30, exchangeRateScriptPackage15, dartDisclosureScriptPackage60, MOCK_SCRIPT_PACKAGES
- `lib/scripts/index.ts` — re-export

Validation evidence (2026-06-25):

- TypeScript strict check (lib/scripts/): 0 errors ✅
- ESLint (lib/scripts/): 0 warnings ✅
- Runtime sample — 3 fixtures (15s/30s/60s+CTA): all validation.ok=true, scene_sum==target ✅
- Source linkage preserved: factCardIds, sourceCitationIds, per-scene factCardId + sourceNote ✅
- Broken package (empty factCardIds + empty narration): validation.ok=false, expected codes ✅

## Active Source Of Truth

- `_ai/HANDOFF_NOW.md`
- `_ai/NEXT_ACTION.md`
- `_ai/PROJECT_STATE.md`
- `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`
- `_ai/MONEY_SHORTS_OS_PRD_V1.md`
- `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`
- `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`
- `_ai/PRODUCTION_PIPELINE_RESET_V1.md`

## Retired Active Routes

Do not resume:

- Candidate10 / old Money Architect video improvement
- Static 8-plate image + caption + narration assembly route
- code-GFX final/public candidate loops
- GPT visual plate-only route
- 3D character static plate route
- 생활꿀팁 / EP001 돈 방어 / old Money Architect topic flow
- Jun/준/시트콤/자동문 면접/ep003/upload_002/복사기/3d_sitcom assets or references
