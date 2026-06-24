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

## Implemented Risk Review module (`money-shorts-os-risk-review-v1`):

- `lib/risk-review/types.ts` — `RiskFinding`, `RiskReviewResult`, `RISK_REVIEW_SCHEMA_VERSION = "money_shorts_risk_review_v1"`; `RiskFindingField` template literal union; `isBlocked` flag
- `lib/risk-review/patterns.ts` — `RISK_PATTERNS` (12 patterns: 6 blocked / 3 high / 3 medium); `maxRiskLevel` helper; HANDOFF 필수 탐지 예시 전부 포함
- `lib/risk-review/scanner.ts` — `scanScriptPackage(pkg, options?)`: title/youtubeTitle/instagramCaption/description/coreMessage/moneyOsCta/hashtags/fullNarration/narrationText/captionText 전체 필드 검사; 결정론적, 외부 호출 없음
- `lib/risk-review/fixtures.ts` — `SAFE_FIXTURE_PACKAGES` (3개 기존 스크립트 패키지 재사용), `RISKY_BLOCKED_PACKAGE` (7개 필수 탐지 예시 포함), `RISKY_HIGH_PACKAGE`; review-fix: `sourceAttributions` 필드를 `ScriptSourceAttribution` 타입에 맞게 수정 (`citationId/displayLabel/url` → `sourceName/sourceUrl/publishedDate`)
- `lib/risk-review/index.ts` — re-export

Validation evidence (2026-06-25):

- TypeScript strict check (lib/risk-review/): 0 errors ✅
- ESLint (lib/risk-review/): 0 warnings ✅
- Runtime sample (node .cjs):
  - Safe fixture (CPI 30s): overallRiskLevel="low", isBlocked=false, findings=0 ✅
  - Risky blocked fixture: overallRiskLevel="blocked", isBlocked=true, findings=28 ✅
  - 필수 탐지 예시 전부 검출: 매수하세요/무조건 오릅니다/수익 보장/급등 확정/지금 안 사면 늦습니다/100% 돈 법니다/이 종목 사면 됩니다 ✅
  - Required codes detected: investment_buy_recommendation, certain_surge, guaranteed_profit, fomo_pressure, sure_profit_claim ✅

## Implemented Chart Card module (`money-shorts-os-chart-card-model-v1`):

- `lib/chart-cards/types.ts` — `CHART_CARD_SCHEMA_VERSION`, `DEFAULT_CARD_DIMENSIONS` (1080×1920), `ChartCardType`, `CardSourceAttribution`, `NumberCardProps`, `ComparisonCardProps`, `SourceCardProps`, `CtaCardProps`, `AnyCardProps` (discriminated union), `ChartCardPackage`, `ChartCardValidationResult`
- `lib/chart-cards/generator.ts` — `makeNumberCard`, `makeComparisonCard`, `makeSourceCard`, `makeCtaCard`, `generateChartCardPackage`; 결정론적, new Date() 없음; Fact Card 외 숫자 날조 없음; source/citation linkage 보존
- `lib/chart-cards/validation.ts` — `validateChartCardPackage`; missing source linkage, empty title/value, unsupported card type, invalid dimensions 탐지
- `lib/chart-cards/fixtures.ts` — `inflationChartCardPackage`, `exchangeRateChartCardPackage`, `dartDisclosureChartCardPackage`, `MOCK_CHART_CARD_PACKAGES`
- `lib/chart-cards/index.ts` — re-export

Validation evidence (2026-06-25, review-fix 후):

- TypeScript strict check (lib/chart-cards/): 0 errors ✅ (review-fix: `cards` 배열에 `AnyCardProps[]` 명시 → CtaCardProps push 타입 오류 수정)
- ESLint (lib/chart-cards/): 0 warnings ✅
- Runtime sample (6 tests, node .cjs, 삭제 완료):
  - T1: number card value/unit/direction/factCardId/citationId 정확 ✅
  - T2: blueprint 없는 패키지 (blueprintVideoId=null), source linkage 보존 ✅
  - T3: CTA card — blueprint.moneyOsCta 있을 때만 포함 ✅
  - T4: valid package validation.ok=true, errors=0 ✅
  - T5: broken package (empty packageId/factCardId/citations/cards) → ok=false, 4 errors 탐지 ✅
  - T6: unsupported card type (pie_chart) → ok=false, unsupported_card_type 코드 탐지 ✅

## Implemented Image Prompt module (`money-shorts-os-image-prompt-generator-v1`):

- `lib/image-prompts/types.ts` — `IMAGE_PROMPT_SCHEMA_VERSION`, `ImagePromptProvider` (5종), `ImageAssetType` (5종), `ImageNegativeRules`, `REQUIRED_NEGATIVE_RULES`, `ImagePromptSourceLink`, `SceneImagePrompt`, `ImagePromptPackage`, `ImagePromptValidationResult`
- `lib/image-prompts/generator.ts` — `makeSceneImagePrompt`, `generateImagePromptPackage`; Blueprint scene visualDescription/imagePrompt에서 sanitize → 숫자/%, 출처, CTA 제거; fallback prompt per sceneRole; 결정론적, new Date() 없음
- `lib/image-prompts/validation.ts` — `validateImagePromptPackage`; empty promptText, text_in_image_violation (%, 출처:, 구독 등), missing_negative_rule (4개 규칙), unsupported_provider, unsupported_asset_type, missing scene/video/citation linkage 탐지
- `lib/image-prompts/fixtures.ts` — inflationImagePromptPackage (30s), exchangeRateImagePromptPackage (15s), dartDisclosureImagePromptPackage (60s+CTA), MOCK_IMAGE_PROMPT_PACKAGES
- `lib/image-prompts/index.ts` — re-export

Validation evidence (2026-06-25, review-fix 후):

- TypeScript strict check (lib/image-prompts/): 0 errors ✅
- ESLint (lib/image-prompts/): 0 warnings ✅
- review-fix 핵심 수정:
  - `generator.ts`: `CARD_SURFACE_VISUAL_TYPES = {chart_card, number_card, cta_card}` — 이 타입은 visualDescription/imagePrompt 무시, 항상 sceneRole별 safe fallback 사용
  - `validation.ts`: `TEXT_IN_IMAGE_PATTERNS`에 CTA 카드/Money-OS/카드 라벨/숫자 카드 용어 패턴 4개 추가
- Runtime sample (6 tests, node .cjs, 삭제 완료):
  - T1: cta_card → "clean abstract gradient background..." (Money-OS/CTA 카드 없음) ✅
  - T2: 생성된 패키지 validation.ok=true, 0 errors ✅
  - T3: static_background는 여전히 visualDescription 사용 (policy 대상 아님) ✅
  - T4: manually injected "Money-OS CTA 카드" → text_in_image_violation 탐지 ✅
  - T5: card scene 3개 전체 위반 없음 ✅
  - T6: "현재값 숫자 카드" → text_in_image_violation 탐지 ✅

## Implemented Voice Profile module (`money-shorts-os-voice-profile-spec-v1`):

- `lib/voice-profiles/types.ts` — `VOICE_PROFILE_SCHEMA_VERSION`, `TTS_SCRIPT_SCHEMA_VERSION`, `VoiceProvider` (5종), `VoiceLocale`, `VoiceGender`, `VoiceStyle`, `VoiceProviderSettings`, `VoiceProfile`, `TtsSceneBlock`, `TtsScriptPackage`, `VoiceProfileValidationResult`
- `lib/voice-profiles/profiles.ts` — `DEFAULT_MONEY_SHORTS_VOICE_PROFILE` (한국어/남성/calm_confident/elevenlabs/PENDING voiceId), `MOCK_VOICE_PROFILES`
- `lib/voice-profiles/formatter.ts` — `formatScriptPackageForTts(pkg, profile, opts?)`, `formatBlueprintForTts(blueprint, profile, opts?)`; 기존 narrationText/ttsScript 필드에서만 파생, 텍스트 날조 없음; terminal punctuation normalization; 결정론적, new Date() 없음
- `lib/voice-profiles/validation.ts` — `validateVoiceProfile`, `validateTtsScriptPackage`; unsupported_provider/locale, missing profileId/voiceId, empty ttsText, empty scenes, missing parentId 탐지
- `lib/voice-profiles/fixtures.ts` — inflationTtsPackage30, exchangeRateTtsPackage15, inflationBlueprintTtsPackage, MOCK_TTS_PACKAGES
- `lib/voice-profiles/index.ts` — re-export

Validation evidence (2026-06-25):

- TypeScript strict check (lib/voice-profiles/): 0 errors ✅
- ESLint (lib/voice-profiles/): 0 warnings ✅
- Runtime sample (7 tests, node .cjs, 삭제 완료):
  - T1: default profile validation.ok=true ✅
  - T2: script package → TTS (sourceId/sourceType/scenes/charCount 정확, terminal punctuation 자동 추가) ✅
  - T3: blueprint → TTS (ttsScript 있으면 우선, 없으면 narration fallback) ✅
  - T4: scene parentId linkage 보존 ✅
  - T5: valid TTS package validation.ok=true ✅
  - T6: broken TTS package → 7개 에러 탐지 (empty_package_id 등) ✅
  - T7: invalid profile (bad provider/locale/voiceId/speed) → 6개 에러 탐지 ✅

review-fix 추가 검증 (2026-06-25, money-shorts-os-voice-profile-spec-v1-review-fix):

- TypeScript strict check (lib/voice-profiles/): 0 errors ✅ (review-fix 후)
- ESLint (lib/voice-profiles/): 0 warnings ✅ (review-fix 후)
- review-fix 핵심 수정 2건:
  1. `formatter.ts` line 78: `scene.sceneId` (TS2339) → `` `scene-${scene.sceneIndex}` `` 결정론적 fallback으로 교체
  2. `profiles.ts`: `provider: "openai_tts"` / `voiceId: "onyx"` → `provider: "elevenlabs"` / `voiceId: "ELEVENLABS_VOICE_ID_PENDING"` + extras.selectionStatus: "pending_owner_selection"
- Runtime sample (5 tests, node .cjs, 삭제 완료):
  - T1: default profile provider=elevenlabs, voiceId=PENDING, selectionStatus=pending_owner_selection ✅
  - T2: elevenlabs profile validation.ok=true (errors=[]) ✅
  - T3: script package TTS → scene[0].sceneId="scene-1", scene[1].sceneId="scene-2", terminal punct 자동 추가 ✅
  - T4: blueprint TTS → scene[0].sceneId="s1"(real), scene[1].sceneId="s2"(real), ttsScript 우선/narration fallback ✅
  - T5: TTS package provider = "elevenlabs" (script pkg + blueprint 모두) ✅

## Active Next Task

Task ID:

`money-shorts-os-timeline-recalc-v1`

Goal:

- Create local deterministic timeline recalculation types/helpers/validation from existing Blueprint/Script/TTS data plus supplied/mock measured duration values.
- No ElevenLabs call, no audio generation, no real audio duration measurement, no external API, no DB/env/dependency changes, no render, no upload/deploy/push.

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
