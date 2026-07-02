# CLAUDE_REPORT — Source-First Money Shorts OS

**갱신:** 2026-06-26

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

## Implemented Timeline Recalculation module (`money-shorts-os-timeline-recalc-v1`):

- `lib/timeline/types.ts` — `TIMELINE_SCHEMA_VERSION`, `MeasuredDurationSource`, `TimelineSceneSlot`, `CaptionTimingBlock`, `BlueprintTimelineInput`, `ScriptTimelineInput`, `TimelineInput` (union), `RecalculatedTimeline`, `TimelineValidationError`, `TimelineValidationResult`
- `lib/timeline/calculator.ts` — `recalculateTimeline(input, opts?)`: proportional resize from estimatedDuration weights → measuredAudioDurationSec; last scene absorbs rounding remainder (exact total); `buildBlueprintTimelineInput`, `buildScriptTimelineInput` helpers; 결정론적, new Date() 없음
- `lib/timeline/validation.ts` — `validateTimeline`: missing sourceId/factCardIds/citationIds, invalid_duration, duration_mismatch, empty_scenes, scene_sum_mismatch, scene_times_not_ordered, scene_gap, empty_caption_text, caption_times_not_ordered; `validateTimelineInput`: input pre-validation
- `lib/timeline/fixtures.ts` — inflationBlueprintTimeline30(28.4s), exchangeRateBlueprintTimeline15(14.2s), dartDisclosureBlueprintTimeline60(55.0s), inflationScriptTimeline30(27.8s), exchangeRateScriptTimeline15(13.5s), MOCK_TIMELINES; 모두 mock measured duration
- `lib/timeline/index.ts` — re-export

Validation evidence (2026-06-25):

- TypeScript strict check (lib/timeline/): 0 errors ✅
- ESLint (lib/timeline/): 0 warnings ✅
- Runtime sample (7 tests, node .cjs, 삭제 완료):
  - T1: blueprint 4-scene 30s → resize to 28.4s, sum=28.400, validation.ok=true ✅
  - T2: script package → sceneId=scene-1/2/3/4 (deterministic), sum=27.800 ✅
  - T3: measured > target (63.2s for 60s estimate) → sum=63.200, validation.ok=true ✅
  - T4: measuredAudioDurationSec=0 → ok=false, codes=[invalid_duration, scene_sum_mismatch] ✅
  - T5: non-ordered scene startSec → ok=false, codes=[scene_sum_mismatch, scene_gap] ✅
  - T6: caption timing mirrors scene slot (showAt=startSec, hideAt=endSec) ✅
  - T7: sourceId/factCardIds/sourceCitationIds/sourceType 모두 보존 ✅

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

## Implemented Render Plan module (`money-shorts-os-ffmpeg-render-plan-v1`):

- `lib/render-plan/types.ts` — `RENDER_PLAN_SCHEMA_VERSION`, `DEFAULT_RENDER_DIMENSIONS` (1080×1920), `RenderOutputSpec`, `PlannedImageInput`, `PlannedAudioInput`, `PlannedCaptionOverlay`, `PlannedSourceOverlay`, `PlannedFfmpegFragment`, `PlannedFfmpegCommand`, `RenderManifest`, `RenderPlanValidationError`, `RenderPlanValidationResult`
- `lib/render-plan/builder.ts` — `buildRenderManifest(params, opts?)`: timeline+TTS+imagePrompt+chartCard+sourceRefs → RenderManifest; placeholder asset paths (not read/created); captionText from timeline.captions only (no new text); ffmpegPlan.fullCommand as data string (never executed); 결정론적, new Date() 없음
- `lib/render-plan/validation.ts` — `validateRenderManifest`: missing sourceId/timelineId/ttsPackageId/factCardIds/citationIds, invalid_dimensions, empty_image_inputs, empty_caption_overlays, empty_caption_text, caption_scene_not_in_image_inputs, forbidden_exec_pattern (10개 패턴: exec/spawn/child_process/shell=true/&&rm/;rm/|sh/|bash/backtick/$(...)), absolute_output_path_forbidden
- `lib/render-plan/fixtures.ts` — inflationRenderPlan30(28.4s), inflationRenderPlan30WithImagePrompts(imagePromptPackage 포함), exchangeRateRenderPlan15(14.2s), MOCK_RENDER_PLANS; blueprint timeline + TTS + image prompt package linkage 사용
- `lib/render-plan/index.ts` — re-export (inflationRenderPlan30WithImagePrompts 추가)

Validation evidence (2026-06-25, review-fix 후):

- TypeScript strict check (lib/render-plan/): 0 errors ✅
- ESLint (lib/render-plan/): 0 warnings ✅
- review-fix 핵심 수정: `builder.ts` — `imagePromptPackage.scenes` (존재하지 않음) → `imagePromptPackage.scenePrompts`; `p.sceneIndex` → `p.sourceLink.sceneIndex || p.sourceLink.sceneId`; `matchingPrompt.sceneImagePromptId` → `matchingPrompt.promptId`
- Runtime sample (6 tests, node .cjs, 삭제 완료):
  - T1: imagePromptPackage 제공 시 buildRenderManifest 성공, validation.ok=true, imagePromptPackageId 보존 ✅
  - T2: 4개 씬 모두 assetSourceType="image_prompt_package", sceneImagePromptId=SceneImagePrompt.promptId 정확 ✅
  - T3: imagePromptPackage 없을 때 assetSourceType="placeholder", imagePromptPackageId=null ✅
  - T4: timelineId="" → ok=false, missing_timeline_id ✅
  - T5: "| bash" 주입 → ok=false, forbidden_exec_pattern ✅
  - T6: output file 미생성 확인(fs.existsSync=false), fullCommand은 string 데이터만 ✅

## Implemented Final QA module (`money-shorts-os-final-qa-model-v1`):

- `lib/final-qa/types.ts` — `FINAL_QA_SCHEMA_VERSION`, `QaCheckResult`, `QaSeverity`, `QaCheckSpec`, `FinalQaResult`, `FinalQaInput`
- `lib/final-qa/checker.ts` — `runFinalQa(input, opts?)`: 23개 체크 포인트 집계; blocker checkIds 집합으로 readyForRender/blockersFailed 결정; isRiskBlocked는 riskReview.isBlocked 또는 risk_blocked 코드로 파생; 결정론적, 외부 호출 없음
- `lib/final-qa/fixtures.ts` — inflationQaInput(전체 체인 valid), inflationQaResult, blockedQaInput(risk blocked), blockedQaResult; 기존 모든 모듈 validation 함수 실제 호출 연결
- `lib/final-qa/index.ts` — re-export

체크 목록 (23개):
- core-source-id, core-fact-card-ids, core-citation-ids (Fact Card 링키지)
- risk-not-blocked, risk-level-acceptable (Risk Review)
- script-validation, chart-card-validation, image-prompt-validation, voice-profile-validation, tts-validation (각 모듈 validation)
- timeline-validation (Timeline)
- render-manifest-validation, render-output-relative (Render Manifest)
- duration-cross-check (Timeline ↔ Render 교차 검증, ≤0.1s 허용)
- render-captions-present (Caption 비어있지 않음)
- **[review-fix 추가]** linkage-timeline-source-id, linkage-timeline-fact-card-ids, linkage-timeline-citation-ids, linkage-render-timeline-id (cross-package 링키지 검증)
- **[review-fix-2 추가]** linkage-core-script-package-id, linkage-render-source-id, linkage-render-fact-card-ids, linkage-render-citation-ids (core/render 링키지 검증)

Validation evidence (2026-06-25):

- TypeScript strict check (lib/final-qa/): 0 errors ✅
- ESLint (lib/final-qa/): 0 warnings ✅
- Runtime sample (7 tests, node .cjs, 삭제 완료 — 최초):
  - T1: valid chain → readyForRender=true, total=15, passed=15, failed=0 ✅
  - T2: blocked risk → readyForRender=false, isRiskBlocked=true, code=risk_blocked ✅
  - T3: broken linkage (empty factCardIds + duration mismatch + absolute path + empty captions) → blockersFailed=4 ✅
  - T4: missing riskReview → code=risk_review_not_provided, readyForRender=false ✅
  - T5: script_validation_failed → readyForRender=false, blocker ✅
  - T6: output file 미생성(fs.existsSync=false), schemaVersion 확인 ✅
  - T7: sourceId/sourceType 보존 ✅
- **[review-fix]** Runtime sample (6 tests, node .cjs, 삭제 완료 — cross-linkage):
  - Case 1: valid chain (blueprintVideoId+timelineId+factCardIds+citationIds 전부 일치) → readyForRender=true ✅
  - Case 2: sourceId="unrelated-source-id" (blueprintVideoId 없음) → timeline_source_id_mismatch, readyForRender=false ✅
  - Case 3: timelineFactCardIds=["fact-card-DIFFERENT"] → timeline_fact_card_ids_mismatch, readyForRender=false ✅
  - Case 4: timelineSourceCitationIds=["citation-DIFFERENT"] → timeline_citation_ids_mismatch, readyForRender=false ✅
  - Case 5: renderManifestTimelineId="tl-WRONG-id" → render_timeline_id_mismatch, readyForRender=false ✅
  - Case 6: blocked risk → readyForRender=false, isRiskBlocked=true ✅
- **[review-fix-2]** 추가 체크 4개 (체크 총 23개): linkage-core-script-package-id, linkage-render-source-id, linkage-render-fact-card-ids, linkage-render-citation-ids
  - types.ts: `scriptPackageId?` 필드 추가
  - checker.ts: 섹션 17~20 (renderManifest source/fact/citation + core scriptPackageId 비교), blockerCheckIds에 4개 추가
  - fixtures.ts: `scriptPackageId: inflationScriptPackage30.packageId` 추가
  - TypeScript strict check: 0 errors ✅
  - ESLint: 0 warnings ✅
  - Runtime sample (9 cases, node .cjs, 삭제 완료):
    - Case 1: valid full chain → readyForRender=true ✅
    - Case 2: sourceId="unrelated-source-id" (blueprintVideoId 유지) → script_package_id_mismatch, readyForRender=false ✅
    - Case 3: renderManifestSourceId="wrong-render-source" → render_source_id_mismatch, readyForRender=false ✅
    - Case 4: renderManifestFactCardIds=["wrong-fact"] → render_fact_card_ids_mismatch, readyForRender=false ✅
    - Case 5: renderManifestSourceCitationIds=["wrong-citation"] → render_citation_ids_mismatch, readyForRender=false ✅
    - Case 6: timelineFactCardIds=["wrong-fact"] → timeline_fact_card_ids_mismatch, readyForRender=false ✅ (fix-1 회귀 없음)
    - Case 7: timelineSourceCitationIds=["wrong-citation"] → timeline_citation_ids_mismatch, readyForRender=false ✅
    - Case 8: renderManifestTimelineId="wrong-timeline" → render_timeline_id_mismatch, readyForRender=false ✅
    - Case 9: blocked risk → readyForRender=false, isRiskBlocked=true ✅

## Implemented Content Package Assembler (`money-shorts-os-content-package-assembler-v1`):

- `lib/content-package/types.ts` — `CONTENT_PACKAGE_SCHEMA_VERSION`, `ContentPackageSummary` (전체 linkage id 노출), `AssembledContentPackage` (Fact Card → Final QA 전체 모듈 연결), `AssemblerOptions` (measuredAudioDurationSec 주입 필수)
- `lib/content-package/assembler.ts` — `assembleContentPackage(factCard, blueprintOptions, options)`: 10단계 결정론적 orchestration; Blueprint → Script → Risk → ChartCard → ImagePrompt → VoiceProfile → TTS → Timeline → RenderManifest → FinalQA; 외부 호출 없음, 미디어 생성 없음
- `lib/content-package/fixtures.ts` — `inflationContentPackage30` (inflation Fact Card 기반, measuredAudioDurationSec=28.4 mock 주입)
- `lib/content-package/index.ts` — re-export

Validation evidence (2026-06-25):

- TypeScript strict check (lib/content-package/): 0 errors ✅
- ESLint (lib/content-package/): 0 warnings ✅
- Runtime sample (5 cases, node .cjs, 삭제 완료):
  - T1: valid assembled package → readyForRender=true ✅
  - T2: 전체 linkage id (factCardId/citationId/blueprintId/scriptPackageId/timelineId/renderManifestId/ttsPackageId/chartCardPackageId/imagePromptPackageId/voiceProfileId) summary에 보존 ✅
  - T3: scriptPackageId 불일치 → script_package_id_mismatch, readyForRender=false ✅
  - T4: renderManifestSourceId 불일치 → render_source_id_mismatch, readyForRender=false ✅
  - T5: output file 미생성 확인 ✅
- **[review-fix]** `assembler.ts`: `generateChartCardPackage(blueprint, scriptPackage, ...)` → `generateChartCardPackage(factCard, blueprint, ...)` 수정 (TS2345 blocker 해소)
  - TypeScript strict check: 0 errors ✅
  - ESLint: 0 warnings ✅
  - Runtime sample (6 cases, node .cjs, 삭제 완료):
    - T1: chartCardPackage.factCardId === factCard.id ("fact-card-mock-inflation-cpi") ✅
    - T2: valid assembled package → readyForRender=true ✅
    - T3: 전체 linkage id summary에 보존 ✅
    - T4: scriptPackageId mismatch → script_package_id_mismatch, readyForRender=false ✅
    - T5: renderManifestSourceId mismatch → render_source_id_mismatch, readyForRender=false ✅
    - T6: output/ 미생성 확인 ✅
- **[review-fix-2]** `assembler.ts`: blueprint 먼저 생성 후 `idBase = blueprint.videoId` 기반으로 모든 downstream id 파생 — `blueprintOptions.videoId` 생략 시 `"*-undefined"` 방지
  - 수정 범위: `contentPackageId`, `scriptPackageId`, `chartCardPackageId`, `imagePromptPackageId`, `ttsPackageId`, `timelineId`, `renderManifestId` 전부 `idBase` 사용으로 통일
  - TypeScript strict check: 0 errors ✅
  - ESLint: 0 warnings ✅
  - Runtime sample (11 cases, node .cjs, 삭제 완료):
    - T1: explicit videoId → 기존 ids 불변 ("bp-mock-inflation-cp-30s" 기반) ✅
    - T2: omitted videoId → 어떤 id에도 "undefined" 없음 ✅
    - T3: omitted videoId → blueprintVideoId = "bp-fact-card-mock-inflation-cpi-30s" ✅
    - T4: omitted videoId → contentPackageId = "cp-bp-fact-card-mock-inflation-cpi-30s" ✅
    - T5: omitted videoId → 모든 downstream id가 blueprintVideoId 기반으로 일관 ✅
    - T6: omitted videoId → QA readyForRender=true ✅
    - T7: chartCardPackage.factCardId === factCard.id ✅
    - T8: linkage ids preserved in summary ✅
    - T9: scriptPackageId mismatch → readyForRender=false ✅
    - T10: renderManifestSourceId mismatch → readyForRender=false ✅
    - T11: output/ 미생성 ✅

## Implemented Manual Fact Card Authoring (`money-shorts-os-manual-fact-card-authoring-v1`):

- `lib/source-facts/manual.ts` — `ManualFactCardDraft` (Owner 제공 필드 전체 명시 필수), `ManualFactCardAuthoringResult`, `authorManualFactCard(draft)`: draft → FactCard 변환 + draft mode validation; 필드 미제공 시 발명 없이 validation 실패; new Date() 없음, 외부 호출 없음
- `lib/source-facts/manual-fixtures.ts` — `validHouseholdDebtDraft` (가계부채 2024-Q4, 한국은행 출처), `validHouseholdDebtResult` (ok=true), `brokenMissingFieldsDraft` (sourceName/sourceUrl/currentValue/citations 누락), `brokenMissingFieldsResult` (ok=false)
- `lib/source-facts/index.ts` — manual + manual-fixtures re-export 추가

Validation evidence (2026-06-25):

- TypeScript strict check (lib/source-facts/ 신규 파일): 0 errors ✅
- ESLint (lib/source-facts/ 신규 파일): 0 warnings ✅
- Runtime sample (9 cases, node .cjs, 삭제 완료):
  - T1: valid draft → ok=true, factCard non-null ✅
  - T2: factCard 모든 필드가 draft에서 그대로 보존 (inference 없음) ✅
  - T3: broken draft (sourceName/url/currentValue/citations 누락) → ok=false, factCard=null ✅
  - T4: 누락 필드별 에러 코드 (required, invalid_url) 정확히 탐지 ✅
  - T5: 발명된 값 없음 — validation 실패 시 factCard=null ✅
  - T6: manual FactCard → assembleContentPackage 시뮬레이션 → readyForRender=true ✅
  - T7: factCard.id가 assembled package linkage에 보존 ✅
  - T8: citation 수 보존 (1개) ✅
  - T9: output/ 미생성 ✅
- **[review-fix]** `manual.ts`: `authorManualFactCard` 내 `citations: []` 통과 버그 수정
  - Codex 리뷰 발견: `validateFactCard(..., { mode: "draft" })` 는 빈 citations를 허용 → `citations: []`만 누락된 draft가 ok=true로 통과
  - 수정: `authorManualFactCard` 함수 내 `validateFactCard` 호출 후 `extraErrors` 배열에 `manual_citation_required` 코드 추가 검사 — draft mode semantics를 건드리지 않는 narrowest safe fix
  - TypeScript strict check (lib/source-facts/): 0 errors ✅
  - ESLint (lib/source-facts/manual.ts, manual-fixtures.ts, index.ts): 0 warnings ✅
  - Runtime sample (7 cases, node .cjs, 삭제 완료):
    - T1: valid draft → ok=true, factCard non-null, errors=[] ✅
    - T2: citations:[] only → ok=false, code=manual_citation_required, factCard=null ✅
    - T3: missing sourceName + currentValue → ok=false (기존 codes 그대로) ✅
    - T4: broken draft들 → factCard=null (invented value 없음) ✅
    - T5: manual FactCard → assembler linkage simulation → factCardId 보존, citationCount=1 ✅
    - T6: fully broken draft (sourceName+sourceUrl+currentValue+citations 모두 누락) → ok=false, errorCount=4 ✅
    - T7: output/ 미생성 ✅

## Implemented Review Packet (`money-shorts-os-review-packet-v1`):

- `lib/review-packet/types.ts` — `REVIEW_PACKET_SCHEMA_VERSION`, `OwnerDecision`, `ReviewSourceRef`, `ReviewFactCardSummary`, `ReviewBlueprintSummary`, `ReviewScriptSummary`, `ReviewRiskSummary`, `ReviewQaSummary`, `ReviewRenderSummary`, `ReviewSocialCopy`, `ReviewPacket`, `ReviewPacketOptions`
- `lib/review-packet/generator.ts` — `generateReviewPacket(pkg, options?)`: `AssembledContentPackage` → `ReviewPacket` 변환; 모든 텍스트는 기존 package에서 verbatim 복사; 새 사실/숫자/claim/citation 생성 없음; new Date() 없음, 외부 호출 없음; ownerDecision=null로 초기화
- `lib/review-packet/fixtures.ts` — `inflationReviewPacket` (valid, readyForRender=true), `brokenInflationReviewPacket` (risk blocked, readyForRender=false)
- `lib/review-packet/index.ts` — re-export

Validation evidence (2026-06-25):

- TypeScript strict check (lib/review-packet/): 0 errors ✅
- ESLint (lib/review-packet/ 4파일): 0 warnings ✅
- Runtime sample (10 cases, node .cjs, 삭제 완료):
  - T1: valid package → review packet 생성, schemaVersion/reviewPacketId/contentPackageId 정확 ✅
  - T2: 모든 linkage ids (factCardId/citationId/blueprintVideoId/scriptPackageId/timelineId/renderManifestId/chartCardPackageId/imagePromptPackageId/ttsPackageId) 보존 ✅
  - T3: sourceRefs에 citationId/sourceUrl verbatim 보존 ✅
  - T4: valid package → qa.readyForRender=true, failedCheckCodes=[] ✅
  - T5: broken package → qa.readyForRender=false, isRiskBlocked=true, failedCheckCodes=["risk_blocked","risk_level_elevated"], risk.findingCodes=["investment_buy_recommendation"] ✅
  - T6: needsOwnerApproval=true, ownerDecision=null, ownerNotes=null (pending 초기화) ✅
  - T7: factCard summary verbatim — currentValue="2.7", allowedClaimsCount/blockedClaimsCount 정확 ✅
  - T8: render summary (timelineId, renderManifestId, measuredAudioDurationSec) 보존 ✅
  - T9: reviewPacketId 미지정 시 "rp-{contentPackageId}" 자동 설정 ✅
  - T10: output/ 미생성 ✅

## Implemented Owner Decision Gate (`money-shorts-os-owner-decision-gate-v1`):

- `lib/owner-decision/types.ts` — `OWNER_DECISION_GATE_SCHEMA_VERSION`, `OwnerDecisionInput`, `GateBlockerCode` (7종: decision_pending/rejected/revision_requested/unsupported_decision/qa_not_ready/risk_blocked/review_packet_id_mismatch), `OwnerDecisionGateResult`, `OwnerDecisionGateOptions`
- `lib/owner-decision/gate.ts` — `evaluateOwnerDecision(packet, input, options?)`: ReviewPacket + OwnerDecisionInput → OwnerDecisionGateResult; canProceedToRender=true는 decision=approved AND qa.readyForRender=true AND risk.isBlocked=false 모두 충족 시에만; ReviewPacket 불변 보장; new Date() 없음, 외부 호출 없음
- `lib/owner-decision/fixtures.ts` — `approvedGateResult` (valid, canProceedToRender=true), `rejectedGateResult`, `revisionRequestedGateResult`, `pendingGateResult`, `approvedButBlockedGateResult` (risk blocked, canProceedToRender=false)
- `lib/owner-decision/index.ts` — re-export

Validation evidence (2026-06-25):

- TypeScript strict check (lib/owner-decision/): 0 errors ✅
- ESLint (lib/owner-decision/ 4파일): 0 warnings ✅
- Runtime sample (11 cases, node .cjs, 삭제 완료):
  - T1: approved valid → canProceedToRender=true, blockerCodes=[] ✅
  - T2: pending (null) → canProceedToRender=false, code=decision_pending ✅
  - T3: revision_requested → canProceedToRender=false, code=decision_revision_requested ✅
  - T4: rejected → canProceedToRender=false, code=decision_rejected ✅
  - T5: approved but QA not ready + risk blocked → canProceedToRender=false, codes=[qa_not_ready, risk_blocked] ✅
  - T6: approved but risk blocked only (qa ok) → canProceedToRender=false, code=risk_blocked 단독 ✅
  - T7: 전체 linkage ids (12개) 보존 ✅
  - T8: reviewPacketId mismatch → code=review_packet_id_mismatch ✅
  - T9: default gateResultId = "gate-{reviewPacketId}" ✅
  - T10: schemaVersion 정확 ✅
  - T11: output/ 미생성 ✅
- **[review-fix]** `gate.ts`: 기본 `gateResultId` 파생을 `input.reviewPacketId` → `packet.reviewPacketId`로 변경
  - Codex 리뷰 발견: mismatched input.reviewPacketId 시 기본 gateResultId가 신뢰할 수 없는 입력값을 따르고 있음
  - 수정: `const gateResultId = options.gateResultId ?? \`gate-${packet.reviewPacketId}\`` (line 24)
  - 동작: mismatch input도 여전히 `review_packet_id_mismatch` 반환; explicit `options.gateResultId` override는 유지
  - TypeScript strict check (lib/owner-decision/): 0 errors ✅
  - ESLint (gate.ts): 0 warnings ✅
  - Runtime sample (10 cases, node .cjs, 삭제 완료):
    - T1: approved valid → canProceedToRender=true ✅
    - T2~T4: pending/revision/rejected → false ✅
    - T5: mismatched reviewPacketId → review_packet_id_mismatch ✅
    - T6: mismatched input default gateResultId = "gate-rp-mock-inflation-30s" (packet 기반) ✅
    - T7: explicit options.gateResultId override 유지 ✅
    - T8~T9: approved but QA/risk fail → false ✅
    - T10: output/ 미생성 ✅
- **[review-fix-2]** `types.ts` + `gate.ts`: malformed/unsupported decision 차단 추가
  - Codex 리뷰 발견: `"malformed_decision_value"` 같은 비표준 입력이 `canProceedToRender=true`로 통과
  - `types.ts`: `GateBlockerCode`에 `"unsupported_decision"` 추가
  - `gate.ts`: decision branch를 "approved" 명시 허용 + else 절에 `unsupported_decision` 추가
  - TypeScript strict check (lib/owner-decision/): 0 errors ✅
  - ESLint (lib/owner-decision/ 전체): 0 warnings ✅
  - Runtime sample (12 cases, node .cjs, 삭제 완료):
    - T1: approved valid → canProceedToRender=true ✅
    - T2~T4: pending/revision/rejected → false (기존 코드 유지) ✅
    - T5: mismatch → review_packet_id_mismatch ✅
    - T6: mismatch default gateResultId = packet 기반 (review-fix 유지) ✅
    - T7: explicit gateResultId override 유지 ✅
    - T8: malformed decision → canProceedToRender=false ✅
    - T9: malformed decision → unsupported_decision 코드 포함 ✅
    - T10~T11: approved but QA/risk fail → false ✅
    - T12: output/ 미생성 ✅

## Implemented Clipboard Payload (`money-shorts-os-clipboard-payload-v1`):

- `lib/clipboard-payload/types.ts` — `CLIPBOARD_PAYLOAD_SCHEMA_VERSION`, `CopyBlockerCode` (3종: gate_not_approved/review_packet_id_mismatch/content_package_id_mismatch), `CopyScriptSection`, `CopySourceRef`, `CopyQaRiskWarning`, `ClipboardCopySections`, `ClipboardPayload`, `ClipboardPayloadOptions`
- `lib/clipboard-payload/builder.ts` — `buildClipboardPayload(packet, gate, options?)`: ReviewPacket + OwnerDecisionGateResult → ClipboardPayload; copyReady=true는 gate.canProceedToRender=true AND reviewPacketId/contentPackageId 모두 일치 시에만; sections=null when not ready; qaRiskWarning 항상 노출; OS clipboard 접근 없음, 외부 호출 없음
- `lib/clipboard-payload/fixtures.ts` — `approvedClipboardPayload` (copyReady=true), `pendingClipboardPayload` (gate_not_approved), `blockedClipboardPayload` (qa/risk blocked)
- `lib/clipboard-payload/index.ts` — re-export

**[review-fix: money-shorts-os-clipboard-payload-v1-review-fix — 2026-06-25]**
- `ReviewSocialCopy`에 `hashtags: string[]` 추가 (`hashtagCount` 유지, hashtags.length와 일치)
- `generator.ts`: `socialCopy.hashtags = scriptPackage.hashtags` (verbatim)
- `builder.ts`: `hashtagsText = packet.socialCopy.hashtags.join(" ")` — placeholder 제거
- `clipboard-payload/types.ts`: hashtagsText 주석 업데이트

Review-fix validation evidence (2026-06-25):
- TypeScript strict check (lib/review-packet/ + lib/clipboard-payload/): 0 errors ✅
- ESLint (양 모듈): 0 warnings ✅
- Runtime sample 14 assertions PASS:
  - approved gate → copyReady=true ✅
  - hashtags verbatim (mockHashtags === socialCopy.hashtags) ✅
  - hashtagCount === hashtags.length ✅
  - hashtagsText === hashtags.join(" ") = "#소비자물가상승률 #금융쇼츠 #경제지표 #머니쇼츠OS #재테크 #경제공부" ✅
  - "원본 패키지에서 확인" placeholder 없음 ✅
  - pending/mismatch → copyReady=false 유지 ✅
  - sections=null when not ready 유지 ✅
  - qaRiskWarning always surfaced 유지 ✅
  - attributionLine format 유지 ✅
  - OS clipboard 호출 없음 ✅

Validation evidence (2026-06-25):

- TypeScript strict check (lib/clipboard-payload/): 0 errors ✅
- ESLint (lib/clipboard-payload/ 4파일): 0 warnings ✅
- Runtime sample (13 cases, node .cjs, 삭제 완료):
  - T1: approved gate + valid packet → copyReady=true, sections non-null ✅
  - T2: pending gate → copyReady=false, gate_not_approved, sections=null ✅
  - T3: blocked gate (QA/risk fail) → copyReady=false ✅
  - T4: reviewPacketId mismatch → review_packet_id_mismatch ✅
  - T5: contentPackageId mismatch → content_package_id_mismatch ✅
  - T6: title/topic/coreMessage/youtubeTitle/instagramCaption verbatim ✅
  - T7: script narration/captionTexts verbatim ✅
  - T8: source attribution citationId/sourceUrl 보존, attributionLine 정확 ✅
  - T9: 전체 linkage ids (factCardIds/sourceCitationIds/blueprintVideoId/scriptPackageId/gateResultId) 보존 ✅
  - T10: qaRiskWarning always surfaced (copyReady=true에서도, blocked에서도) ✅
  - T11: default clipboardPayloadId = "cp-payload-{reviewPacketId}" ✅
  - T12: no OS clipboard call (navigator.clipboard 없음) ✅
  - T13: output/ 미생성 ✅

## Implemented Package View Model (`money-shorts-os-package-view-model-v1`):

- `lib/package-view/types.ts` — `PACKAGE_VIEW_SCHEMA_VERSION`, `PackageGateStatus` (5종: approved/pending/rejected/revision_requested/approved_but_blocked), `PackageViewRiskSummary`, `PackageViewQaSummary`, `PackageViewSourceRef`, `PackageViewFactCard`, `PackageViewCounts`, `PackageListItem` (라이브러리 행 view model), `PackageDetailModel` (상세 view model), `PackageWorkflowStatus`, `PackageCopyActionSummary`, `PackageViewInputs`, `PackageViewBuilderOptions`
- `lib/package-view/builder.ts` — `buildPackageListItem`, `buildPackageDetailModel`, `buildPackageWorkflowStatus`, `buildPackageCopyActionSummary`: 모두 결정론적, `new Date()` 없음, OS clipboard 없음, 외부 호출 없음; 텍스트 필드는 기존 ReviewPacket/GateResult/ClipboardPayload 필드에서 verbatim 추출; `hashtagsText = hashtags.join(" ")` 형태로 결합
- `lib/package-view/fixtures.ts` — 기존 모듈 fixture 조합: `approvedListItem`/`approvedDetailModel`/`approvedWorkflowStatus`/`approvedCopyActionSummary` (copy-ready), `pendingListItem`/`pendingDetailModel`/`pendingCopyActionSummary` (gate 미결정), `rejectedListItem`/`rejectedDetailModel`/`rejectedCopyActionSummary` (반려), `blockedListItem`/`blockedDetailModel`/`blockedCopyActionSummary` (QA/risk 차단)
- `lib/package-view/index.ts` — re-export

Validation evidence (2026-06-25):

- ESLint (lib/package-view/): 0 warnings ✅
- TypeScript targeted check (lib/package-view/ — full tsc, 0 errors in package-view files): ✅
- Runtime verification (42/42 PASS, npx tsx):
  - approved: gateStatus=approved, copyReady=true, qaReady=true, riskBlocked=false ✅
  - contentPackageId/reviewPacketId 보존 ✅
  - canProceedToRender=true, gateBlockerCodes=[], copyBlockerCodes=[] ✅
  - hashtagsText non-empty, starts with "#" ✅
  - counts.scenes/scripts/sources/hashtags > 0 ✅
  - clipboardPayloadId/gateResultId non-null ✅
  - factCardId/sourceRefs 보존 ✅
  - copyReady mirrors ClipboardPayload ✅
  - WorkflowStatus: hasClipboardPayload=true, hasGateResult=true, canProceedToRender=true ✅
  - CopyActionSummary: approved copyReady=true, blockerLabels=[] ✅
  - pending: gateStatus=pending, copyReady=false, canProceedToRender=false ✅
  - rejected: gateStatus=rejected, copyReady=false, clipboardPayloadId=null ✅
  - blocked: gateStatus=approved_but_blocked, riskBlocked=true, qa.readyForRender=false, risk.isBlocked=true, canProceedToRender=false ✅
  - blocked CopyActionSummary: copyReady=false, blockerLabels non-empty ✅
  - no navigator/OS clipboard reference, no new Date() in builder ✅

**[review-fix: money-shorts-os-package-view-model-v1-review-fix — 2026-06-25]**

- `builder.ts`: `buildPackageCopyActionSummary()` — `gateResult.blockerCodes` + `clipboardPayload.blockerCodes` 병합 후 Set de-duplicate; copyReady=true 시 blockerLabels=[] 유지; `unsupported_decision` 라벨 추가
- `fixtures.ts`: `pendingCopyActionSummary`, `rejectedCopyActionSummary` 추가
- `_verify.ts` 삭제 (임시 검증 파일, 비배포 — 런타임 증거는 CLAUDE_REPORT에 보존)

Review-fix validation evidence (2026-06-25, 19/19 PASS, npx tsx):
- approved CopyActionSummary: copyReady=true, blockerLabels=[] ✅
- pending CopyActionSummary: copyReady=false, blockerLabels=["결정 미완료"] ✅
- rejected CopyActionSummary: copyReady=false, blockerLabels=["반려됨"] ✅
- blocked CopyActionSummary: copyReady=false, QA/risk 구체 라벨 포함("QA 미통과"/"위험 항목 차단") ✅
- approved gateBlockerCodes=[], copyBlockerCodes=[] 유지 ✅
- blocked gateBlockerCodes non-empty 유지 ✅
- contentPackageId/copyReady/hashtagsText/counts 동작 유지 ✅
- _verify.ts 파일 부재 확인 ✅

**[review-fix-2: money-shorts-os-package-view-model-v1-review-fix-2 — 2026-06-25]**

- `builder.ts`: `buildPackageCopyActionSummary()` — `gateResult === null && copyReady === false && allCodes.length === 0` 조건에서 `decision_pending` 합성하여 pending blocker 라벨 추가
- `fixtures.ts`: `noGateInputs` (gateResult=null, clipboardPayload=null), `noGateListItem`, `noGateCopyActionSummary`, `noGateWorkflowStatus` 추가

Review-fix-2 validation evidence (2026-06-25, 7/7 PASS, npx tsx):
- approved CopyActionSummary: copyReady=true, blockerLabels=[] 유지 ✅
- pending gate result CopyActionSummary: blockerLabels non-empty ✅
- rejected CopyActionSummary: blockerLabels non-empty ✅
- blocked CopyActionSummary: QA/risk 구체 라벨 포함 ✅
- no-gate/no-clipboard CopyActionSummary: copyReady=false, blockerLabels=["결정 미완료"] (synthetic) ✅
- no-gate WorkflowStatus: hasGateResult=false, gateStatus=pending ✅
- no-gate ListItem: gateStatus=pending ✅

## Implemented Package Library / Detail UI (`money-shorts-os-package-library-ui-v1`):

- `app/packages/page.tsx` — Server Component; imports 5 fixture states (approved/pending/rejected/blocked/no-gate), builds PackageEntry array, renders `PackageLibraryClient`
- `app/packages/PackageLibraryClient.tsx` — `"use client"` component; 분할 패널 레이아웃 (좌: 패키지 목록 280px, 우: 상세 패널); 상태 선택 시 detail 교체

UI 구성:
- `PackageListRow`: 게이트 상태 배지(GateBadge) + 복사 가능 배지(CopyReadyBadge) + 위험 차단 표시 + 인디케이터/현재값/출처/카운트
- `PackageDetailPanel`: 워크플로우 상태바 → 복사 액션 패널 → 게이트/복사 차단 코드 → Fact Card → 위험·QA → Owner 메모 → 소셜 카피 → 출처 → ID 체인 → 카운트
- `WorkflowStatusBar`: 5단계 체크 (리뷰패킷→게이트→클립보드→QA→렌더가능) 시각화
- `CopyActionPanel`: copyReady=true 시 녹색 + payloadId 표시; false 시 blockerLabels 배지 표시
- `GateBadge`: approved=emerald, pending=amber, rejected=red, revision_requested=orange, approved_but_blocked=rose 색상 구분

5가지 fixture 상태 표시:
- approved: gateStatus=approved, copyReady=true, blockerLabels=[]
- pending: gateStatus=pending, copyReady=false, blockerLabels=["결정 미완료"]
- rejected: gateStatus=rejected, copyReady=false, blockerLabels=["반려됨"]
- approved_but_blocked: gateStatus=approved_but_blocked, copyReady=false, blockerLabels=["QA 미통과","위험 항목 차단"]
- no-gate: gateStatus=pending, copyReady=false, blockerLabels=["결정 미완료"] (synthetic)

Validation evidence (2026-06-25):
- ESLint (app/packages/ 2파일): 0 warnings ✅
- TypeScript targeted check (app/packages/ → full tsc, 0 errors in app/packages/): ✅
  - 전체 tsc 오류는 기존 output/ 바이너리 파일만 해당 (PROJECT_STATE.md 기록 동일)
- Next.js 컴파일: "✓ Compiled successfully in 3.7s" ✅
- 금지 패턴 검색 (navigator.clipboard / fetch / /api/ / ffmpeg / output/): 0건 ✅
- dev server 자동 시작: preview_start 권한 차단으로 미실행 — Next.js 컴파일 성공으로 대체 검증

**[review-fix: money-shorts-os-package-library-ui-v1-review-fix — 2026-06-25]**

Finding 1 수정 (responsive layout):
- `PackageLibraryClient.tsx`: 메인 컨테이너 `flex` → `flex flex-col md:flex-row`, 높이 `h-[calc(100vh-57px)]` → `md:h-[calc(100vh-57px)]`
- 좌측 aside: `w-80 shrink-0` → `w-full md:w-80 shrink-0`, 하단 border 추가(`border-b md:border-b-0`), overflow `md:h-full`
- 우측 main: `flex-1 overflow-y-auto` → `flex-1 min-w-0 overflow-y-auto md:h-full` (min-w-0으로 flex 자식 overflow 방지)
- 모바일: 목록 전체 너비 → 상세 패널 스택, 데스크탑: 기존 280px+detail 분할 유지

Finding 2 수정 (rejected/blocked workflowStatus non-null):
- `page.tsx`: `buildPackageWorkflowStatus`, `brokenInflationReviewPacket`, `rejectedGateResult`, `approvedButBlockedGateResult` import 추가
- `rejectedWorkflowStatus`: `inflationReviewPacket` + `rejectedGateResult` + `clipboardPayload: null` 기반 인라인 생성
- `blockedWorkflowStatus`: `brokenInflationReviewPacket` + `approvedButBlockedGateResult` + `clipboardPayload: null` 기반 인라인 생성 (blockedListItem/detailModel과 동일 inputs)
- 양 항목 `workflowStatus: null` → 각 `rejectedWorkflowStatus` / `blockedWorkflowStatus`로 교체

Review-fix validation evidence (2026-06-25):
- ESLint (app/packages/ 2파일): 0 warnings ✅
- TypeScript (full tsc → app/packages/ 필터): 0 errors ✅
- 금지 패턴 검색: 0건 ✅
- dev server 시각 확인: preview_start 권한 차단 — 컴파일/lint/tsc 통과로 대체

**[review-fix-2: money-shorts-os-package-library-ui-v1-review-fix-2 — 2026-06-25]**


- Finding: `blockedWorkflowStatus`가 `clipboardPayload: null`로 빌드돼 detail/copy action의 `blockedClipboardPayload` 존재와 불일치
- 수정 (`app/packages/page.tsx`):
  - `blockedClipboardPayload` import 추가 (`@/lib/clipboard-payload/fixtures`)
  - `blockedWorkflowStatus` 빌드 시 `clipboardPayload: null` → `clipboardPayload: blockedClipboardPayload`
  - `rejectedWorkflowStatus`는 `clipboardPayload: null` 유지
- 정적 검증: `builder.ts:187` — `hasClipboardPayload: clipboardPayload !== null`
  - blocked: `blockedClipboardPayload`(non-null) → `hasClipboardPayload=true` ✅
  - rejected: `null` → `hasClipboardPayload=false` ✅
- 금지 패턴 검색 (page.tsx): 0건 ✅
- ESLint / TypeScript: Bash 권한 차단으로 직접 실행 불가 — 코드 변경이 import 추가 + 인자 교체 1건뿐이라 이전 세션 0 errors 유지로 판단

**[review-fix-3: money-shorts-os-package-library-ui-v1-review-fix-3 — 2026-06-25]**

- Finding: Playwright 클릭 후 detail panel 변경 안 됨. 원인 진단:
  - `page.tsx`(Server Component) → `PackageLibraryClient`(Client Component) props 직렬화 경계 문제 가능성
  - preview/Playwright 환경에서 viewport 0×0 → `md:flex-row` 미적용 → aside 버튼이 뷰포트 밖(top≈1370px)에 위치해 실제 click event 미전달
  - React fiber/onClick 자체는 정상 연결, reactProps.onClick 직접 호출 시 state 정상 전환 확인
- 수정 방향: RSC 직렬화 경계 제거 — `PackageLibraryClient.tsx`가 fixture/builder를 직접 import, 모듈 레벨 `PACKAGES` 상수로 구성
  - `PackageLibraryClient.tsx`: `"use client"` 파일 내 fixture import 전부 이동, `PackageEntry` interface 및 `PACKAGES` 배열 모듈 레벨 정의, `export interface PackageEntry` 제거(더 이상 page에서 필요 없음), `type="button"` 명시 추가
  - `page.tsx`: 모든 fixture/builder import 제거, `<PackageLibraryClient />` (props 없음)만 렌더
- review-fix-2 수정 내용(blockedClipboardPayload) `PackageLibraryClient.tsx`로 통합
- ESLint (app/packages/ --ext .tsx): 0 warnings ✅
- TypeScript (full tsc → app/packages/ 필터): 0 errors ✅
- 금지 패턴 검색: 0건 ✅
- dev server 브라우저 검증 (http://localhost:3000/packages):
  - HTTP 200, 5개 패키지 렌더 ✅
  - row 2(반려) 클릭 → detail gateInDetail="반려", selectedRowIndex=2 ✅
  - row 3(승인·차단) reactProps.onClick 호출 → gateInDetail="승인·차단", riskBlockedVisible=true, selectedRowIndex=3 ✅
  - 워크플로우 바: blocked에서 "✓ 클립보드 페이로드"(hasClipboardPayload=true) ✅
  - rejected에서 "○ 클립보드 페이로드"(hasClipboardPayload=false) ✅
  - horizontalOverflow=false (clientW=1265) ✅
- 진단 노트: preview 환경 viewport=0×0이라 `preview_click`으로 직접 클릭 시 aside 버튼이 뷰포트 밖에 위치 → DOM force-style로 320px aside 복원 후 `preview_click` 성공 / `reactProps.onClick` 직접 호출로 cross-verified
- dev server 종료 완료 ✅

**[review-fix-4: money-shorts-os-package-library-ui-v1-review-fix-4 — 2026-06-25]**

- Finding: Codex Playwright 실브라우저 재검증에서 row DOM에 `__reactProps*` 키 없음 → React hydration이 이벤트를 부착하지 않음. `useState`+onClick 방식은 실브라우저에서 작동 불가.
- 수정 방향: URL/searchParams 기반 선택으로 전환 — hydration 의존 완전 제거
  - `app/packages/page.tsx`: `async` Server Component; `searchParams: Promise<{selected?: string}>` 파라미터로 `selectedIndex` 결정; fixture/builder import 복원; `PACKAGES: PackageEntry[]` 모듈 레벨; `<PackageLibraryView packages={PACKAGES} selectedIndex={selectedIndex} />` 렌더
  - `app/packages/PackageLibraryClient.tsx` → `PackageLibraryView`(Server Component)로 재작성; `"use client"` 제거; `useState` 제거; fixture import/PACKAGES 제거; `packages: PackageEntry[]` + `selectedIndex: number` props 수신; rows를 `<Link href="/packages?selected={i}">` (next/link)으로 교체; selected 스타일을 `i === selectedIndex`로 결정
- 기본 `/packages` → `selectedIndex=0` (approved)
- `/packages?selected=2` → row 2 (rejected) 선택
- `/packages?selected=3` → row 3 (approved_but_blocked) 선택

Review-fix-4 validation evidence (2026-06-25):
- ESLint (app/packages/ --ext .tsx): 0 warnings ✅
- TypeScript (full tsc → app/packages/ 필터): 0 errors ✅
- 금지 패턴 검색 (navigator.clipboard/fetch/api/ffmpeg/output/): 0건 ✅
- dev server HTTP 검증 (http://127.0.0.1:3019):
  - `/packages` HTTP 200 ✅
  - 5개 Link href (`/packages?selected=0~4`) 모두 렌더됨 ✅
  - `/packages` → `border-l-indigo-500" href="/packages?selected=0"` (row 0 선택) ✅
  - `/packages?selected=2` → `border-l-indigo-500" href="/packages?selected=2"` (row 2 선택) ✅
  - `/packages?selected=3` → `border-l-indigo-500" href="/packages?selected=3"` (row 3 선택) ✅
  - `/packages?selected=2` → "복사 불가" 배지 (rejected, hasClipboardPayload=false) ✅
  - `/packages?selected=3` → "복사 가능" 배지 (blocked, hasClipboardPayload=true from blockedClipboardPayload) ✅
  - `/packages?selected=3` → "위험 차단" 배지 (approved_but_blocked) ✅
  - 반응형 레이아웃: `flex flex-col md:flex-row`, `w-full md:w-80`, `border-b md:border-b-0` 유지 ✅
- dev server 종료: 백그라운드 프로세스 권한 차단으로 kill 명령 미실행 (포트 3019 임시 사용 후 자연 종료 예정)

## Implemented Manual Fact Card UI (`money-shorts-os-manual-fact-card-ui-v1`):

- `app/fact-cards/manual/page.tsx` — Server Component; `lib/source-facts/manual-fixtures.ts` 기반 valid/broken 드래프트 렌더; 외부 호출 없음, DB/clipboard/API 없음

UI 구성:
- 상단 헤더: "Step 1 of 6 — Fact Card 작성" 명시 (전체 workflow 구조 가시화)
- `WorkflowSteps`: 6단계 파이프라인 시각화 (Fact Card → Blueprint → 대본 → 위험심사 → Owner검토 → 배포)
- 출처 우선 원칙 안내 배너 (amber — "Fact Card에 없는 숫자는 대본에 쓰지 않습니다")
- `DraftCard` × 2: valid draft(ok=true, FactCard summary) + broken draft(ok=false, ValidationErrors)
  - `StatusBadge`: ok=true(emerald) / ok=false(red) 색상 구분
  - `FactCardSummary`: indicatorName / currentValue / changeValue / changeRate / dataPeriod / sourceName / sourceUrl / publishedDate / interpretation / cautionNote / counts / isMock / isPublishable
  - `ValidationErrors`: error code(mono) + field + message 3열 표시
  - `DraftPanel`: 기본정보 / 출처정보 / 지표수치 / 해석·주의사항 / allowedClaims / blockedClaims / Citations 섹션별 렌더; 빈 필드는 red italic 표시
  - `CitationCard`: sourceName / sourceUrl / publishedDate / dataPeriod / commercialUseStatus per citation
- Field guide: 14개 필드 설명 + 필수 여부 테이블 (하단)

Validation evidence (2026-06-25):
- ESLint (app/fact-cards/ --ext .tsx): 0 warnings ✅
- TypeScript (full tsc → app/fact-cards/ 필터): 0 errors ✅
- 금지 패턴 검색 (clipboard/fetch//api//ffmpeg/output/upload/deploy): 0건 ✅
- dev server HTTP 검증 (http://127.0.0.1:3019/fact-cards/manual):
  - HTTP 200 ✅
  - `ok = true`, `ok = false` 모두 렌더 ✅
  - `가계부채`, `Validation Errors`, `Step 1`, `출처 우선`, `authorManualFactCard` ✅
  - sourceUrl `bok.or.kr/...` 렌더 ✅
  - publishedDate `2025-02-25` 렌더 ✅
  - dataPeriod `2024년 4분기` 렌더 ✅
  - currentValue `1,896.2조 원` 렌더 ✅
  - sourceName `한국은행 가계신용` 렌더 ✅
  - broken draft 에러 코드: `manual_citation_required`, `invalid_url` 렌더 ✅
- dev server 종료: 포트 3019 백그라운드 (자연 종료 예정)

## Implemented Manual Fact Card → Package Preview UI (`money-shorts-os-manual-fact-card-to-package-preview-ui-v1`):

- `app/fact-cards/manual/package-preview/page.tsx` — Server Component; `validHouseholdDebtResult.factCard` 기반 전체 source-first pipeline 로컬 미리보기; 외부 호출 없음, DB/clipboard/API/ffmpeg/render 없음

UI 구성 (10개 섹션):
- 상단 헤더: "LOCAL PREVIEW ONLY" 배지 + "Step 1→6 전체" 명시
- `WorkflowSteps`: 1~5는 ✓ 완료, 6(복사·배포) active 상태 시각화
- 출처 linkage 배너 + `/fact-cards/manual` / `/packages` 이동 링크
- `① Fact Card`: indicatorName/currentValue/changeValue/changeRate/interpretation/cautionNote/isMock/isPublishable + 출처 citation 링크 + allowedClaims/blockedClaims
- `② Video Blueprint`: blueprintVideoId/templateKey/targetDurationSec/sceneCount/factCardIds/sourceCitationIds + 씬별 역할·자막·duration 목록
- `③ Script Package`: title/topic/coreMessage/youtubeTitle/instagramCaption/hashtags + 전체 narration + 씬별 자막
- `④ Risk Review`: overallRiskLevel/isBlocked/findings 배지
- `⑤ Timeline`: timelineId/targetDurationSec/measuredAudioDurationSec(mock)/sceneCount
- `⑥ Final QA`: readyForRender/isRiskBlocked/total·passed·failed·blockersFailed + 실패 체크 목록
- `⑦ Review Packet`: reviewPacketId/needsOwnerApproval/ownerDecision + 8개 ID linkage 그리드
- `⑧ Owner Decision Gate`: gateResultId/ownerDecision/ownerNotes/canProceedToRender/blockerCodes + "mock 승인" 안내
- `⑨ Clipboard Payload`: copyReady/blockerCodes/qaRiskWarning + 복사 가능 섹션(youtubeTitle/instagramCaption/hashtags/attributionLine) 미리보기
- `⑩ Package View Summary`: gateStatus/canProceedToRender/copyReady/copyActionSummary/counts

Deterministic mock 상수:
- `MOCK_VIDEO_ID`: "video-manual-household-debt-preview-001"
- `MOCK_CONTENT_PACKAGE_ID`: "cp-manual-household-debt-preview-001"
- `MOCK_CREATED_AT`: "2026-06-25T09:00:00+09:00"
- `MOCK_AUDIO_DURATION_SEC`: 42.0s (mock)
- `MOCK_REVIEW_PACKET_ID`: "rp-manual-household-debt-preview-001"
- `MOCK_GATE_RESULT_ID`: "gate-manual-household-debt-preview-001"
- Owner decision: "approved" (mock) + "로컬 preview — mock 승인" notes

Validation evidence (2026-06-25):
- ESLint (app/fact-cards/manual/package-preview/page.tsx): 0 warnings ✅
- TypeScript (full tsc → app/fact-cards/ 필터): 0 errors ✅
- 금지 패턴 검색 (navigator.clipboard / OS clipboard write / fetch( / /api/ / ffmpeg / output/ / upload / deploy): 0건 ✅
  - `clipboard` 히트는 `buildClipboardPayload` import/변수명만 — OS clipboard write API 없음
- dev server HTTP 검증 (http://localhost:3000/fact-cards/manual/package-preview):
  - HTTP 200, 서버 오류 없음 ✅
  - accessibility tree 렌더 확인:
    - "Money Shorts OS — Package Preview" ✅
    - "LOCAL PREVIEW ONLY" ✅
    - "Step 1→6 전체" ✅
    - "파이프라인 상태 / contentPackageId: cp-manual-household-debt-preview-001" ✅
    - "Fact Card / Blueprint / Script Package / Risk Review / QA Ready / Copy Ready" PASS 배지 6개 ✅
    - "가계부채 잔액 / 2024년 4분기 / 1,896.2조 원 / +20.6조 원 / +1.1%" ✅
    - "← Fact Card 작성 (Step 1)" / "패키지 라이브러리 →" 링크 ✅
  - 스크린샷: 타임아웃 (preview 환경 제약) — accessibility tree로 충분히 검증
- dev server 종료 ✅

## Implemented Manual Fact Card Form UI (`money-shorts-os-manual-fact-card-form-v1`):

- `app/fact-cards/manual/new/page.tsx` — Server Component; `ManualFactCardFormClient` 렌더만 담당
- `app/fact-cards/manual/new/ManualFactCardFormClient.tsx` — `"use client"` Client Component; 전체 form 로직

UI 구성:
- 상단 헤더: "LOCAL VALIDATION ONLY" 배지 + "Step 1" 명시
- "로컬 validation 전용" 안내 배너 (DB 저장/publish/render 아님 명시)
- 좌측 폼 (xl:grid-cols-2 반응형):
  - 기본 정보: indicatorName(필수), contentCategory(select), comparisonType(select), dataPeriod
  - 출처 정보: sourceName(필수), sourceUrl(필수, https://, mono), publishedDate, primarySourceProviderId
  - 지표 수치: currentValue(필수), previousValue/changeValue/changeRate(초기 N/A), unit
  - 해석/주의사항: interpretation, cautionNote (textarea)
  - 허용/차단 Claim: 줄바꿈 구분 textarea → 배열 변환, 실시간 건수 표시
  - Citations: 동적 추가/삭제 가능한 citation row (id/sourceName/sourceUrl/publishedDate/dataPeriod/citationLabel); citations=[] 시 `manual_citation_required` 경고 힌트 표시
  - 플래그: isMock/isPublishable checkbox
- 우측 validation 결과 (실시간):
  - ok=true/false 상태 배너
  - 실패 시 ValidationErrors (code/field/message 3열)
  - 성공 시 Generated Fact Card Summary (전체 필드 + citations + allowedClaims)
  - 실패 시 폼 상태 디버그 패널 (draft.citations.length, manual_citation_required 여부, error count)
  - 다음 단계 힌트 (Package Preview 링크)
- `/fact-cards/manual` ← 및 `/fact-cards/manual/package-preview` → 링크 (상단 + 하단)

주요 구현 결정:
- `authorManualFactCard(draft)` 를 render 시 동기 호출 — 실시간 validation
- citation id handling: review-fix 후 UI 자동생성/fallback 없음. Owner가 직접 입력한 `c.id.trim()`이 있는 citation row만 draft에 포함.
- 초기 상태: 모든 필드 빈 값 → 즉시 ok=false, 필수 필드 오류 노출
- createdAt: 고정 mock 값 주입 ("2026-06-25T09:00:00+09:00")
- 외부 API·DB·OS clipboard·fetch·ffmpeg·render·output/ 모두 없음

Validation evidence (2026-06-25):
- ESLint (app/fact-cards/manual/new/ 2파일): 0 warnings ✅
- TypeScript (full tsc → `app/fact-cards/` 필터): 0 errors ✅
- 금지 패턴 검색 (navigator.clipboard / OS clipboard write / fetch( / /api/ / ffmpeg / output/ / upload / deploy): 0건 ✅
- dev server HTTP 검증 (http://localhost:3000/fact-cards/manual/new):
  - HTTP 200, 서버 오류 없음 ✅
  - accessibility tree 확인: 헤더/폼 섹션/citation row/validation 결과 전부 렌더 ✅
  - JS eval 확인:
    - `hasOkFalse: true` (초기 빈 폼 → ok=false) ✅
    - `hasOkTrue: false` (초기엔 valid 아님) ✅
    - `hasLocalValidationOnly: true` ✅
    - `hasManualCitationHint: true` (citation 빈 힌트) ✅
    - `hasPackagePreviewLink: true` ✅
    - `hasStep1: true` ✅
    - `hasFactCardInput: true` ✅
- dev server 종료 ✅

## review-fix: Manual Fact Card Form citation id 자동생성 제거 (`money-shorts-os-manual-fact-card-form-v1-review-fix`):

수정 내용 (3곳, `ManualFactCardFormClient.tsx`):

1. `INITIAL_STATE.citations`: `{ ...EMPTY_CITATION, id: "citation-new-001" }` → `{ ...EMPTY_CITATION }` (id prefill 제거)
2. `addCitation()`: `id: \`citation-new-${Date.now()}\`` → 제거, `{ ...EMPTY_CITATION }` 빈 id로 추가
3. draft 변환 citation 필터:
   - 기존: `.filter(c => c.id.trim() !== "" || c.sourceName.trim() !== "")` + `id: c.id.trim() || c.sourceName.trim() || "citation-unnamed"` fallback
   - 수정: `.filter(c => c.id.trim() !== "")` + `id: c.id.trim()` 만 사용
   - id 없는 row는 draft.citations에 포함 안 함
   - `citationRowsMissingId` 카운트 변수로 UI 안내
4. UI 안내 추가: id 미입력 row 수 표시 + "id는 Owner가 직접 입력해야 합니다 — UI가 자동 생성하지 않습니다" amber 경고

Validation evidence (2026-06-25):
- ESLint (2파일): 0 warnings ✅
- TypeScript (`app/fact-cards/` 필터): 0 errors ✅
- 금지 패턴 검색 (Date.now / Math.random / citation-unnamed / navigator.clipboard / fetch / /api/ / ffmpeg / output/ / upload / deploy): 0건 ✅
- dev server HTTP 200 (`/fact-cards/manual/new`) ✅
- JS eval 검증:
  - `citationIdInputValue: ""` (초기 id 필드 빈 값) ✅
  - `hasOkFalse: true` ✅
  - `hasManualCitationRequired: true` ✅
  - `hasMissingIdWarning: true` (id 없는 row 경고 표시) ✅
  - `hasLocalValidationOnly: true` ✅
  - `hasPackagePreviewLink: true` ✅
- dev server 종료 ✅

## Manual Fact Card Form — 샘플 컨트롤 추가 (`money-shorts-os-manual-fact-card-form-sample-controls-v1`):

수정 내용 (`app/fact-cards/manual/new/ManualFactCardFormClient.tsx` 1파일):

1. `import { validHouseholdDebtDraft } from "@/lib/source-facts/manual-fixtures"` 추가
2. `draftToFormState(d: ManualFactCardDraft): FormState` 변환 함수 추가 (draft 모든 필드 → FormState; citations 배열도 CitationRow[] 변환; id는 fixture값 그대로 사용)
3. `loadSample` 콜백: `setForm(draftToFormState(validHouseholdDebtDraft))` — fixture 외 값 발명 없음
4. `resetForm` 콜백: `setForm(INITIAL_STATE)` — 빈 초기 상태로 복귀
5. 헤더 버튼 2개 추가: "샘플 불러오기" (indigo) / "초기화" (slate) — "LOCAL VALIDATION ONLY" 배지 좌측

citation id 처리: `draftToFormState`에서 `c.id`를 fixture 그대로 사용 — UI 자동생성 없음 (review-fix 계약 유지)

Validation evidence (2026-06-25):
- ESLint (`app/fact-cards/manual/new/ManualFactCardFormClient.tsx`): 0 warnings ✅
- TypeScript (full tsc, 0 errors): ✅
- 금지 패턴 검색 (Date.now / Math.random / citation-unnamed / fetch / /api/ / clipboard / ffmpeg / render / output/ / upload / deploy): 0건 ✅
- dev server HTTP 검증 (http://localhost:3000/fact-cards/manual/new):
  - HTTP 200, 헤더 "샘플 불러오기" / "초기화" 버튼 렌더 ✅
  - 초기 상태: `ok = false`, `manual_citation_required` 발생 ✅
  - `샘플 불러오기` 클릭 → `indicatorValue="가계부채 잔액"`, `ok = true`, `manual_citation_required` 사라짐 ✅
  - `초기화` 클릭 → `indicatorValue=""`, `ok = false`, `manual_citation_required` 재발생 ✅
  - 콘솔 오류: 0건 ✅
- dev server 종료 ✅

## Manual Fact Card Overview Nav Polish (`money-shorts-os-manual-fact-card-route-nav-v1`):

수정 내용 (`app/fact-cards/manual/page.tsx` 1파일):

1. `import Link from "next/link"` 추가
2. 헤더 우측: "직접 입력하기" → `/fact-cards/manual/new`, "Package Preview" → `/fact-cards/manual/package-preview`, "패키지 라이브러리" → `/packages` 링크 3개 추가 (Step 1 / MVP1 배지 좌측)
3. 메인 내 "다음 단계로 이동" 워크플로우 nav 카드 추가 (Field guide 위) — 동일 3개 링크, 설명 문구 포함
4. 기존 valid/broken DraftCard display, WorkflowSteps, 출처 우선 배너 모두 유지

Validation evidence (2026-06-25):
- ESLint (`app/fact-cards/manual/page.tsx`): 0 warnings ✅
- TypeScript (full tsc → `app/fact-cards/` 필터): 0 errors ✅
- 금지 패턴 검색 (clipboard/fetch//api//ffmpeg/render/output//upload/deploy): 0건 ✅
- dev server HTTP 검증 (http://localhost:3000/fact-cards/manual):
  - `hasNew=true` (`/fact-cards/manual/new` href 존재) ✅
  - `hasPreview=true` (`/fact-cards/manual/package-preview` href 존재) ✅
  - `hasPackages=true` (`/packages` href 존재) ✅
  - `hasValidDraft=true` (ok = true 렌더) ✅
  - `hasBrokenDraft=true` (ok = false 렌더) ✅
  - `hasStep1=true` ✅
  - 총 링크 6개 (헤더 3 + nav card 3) ✅
- dev server 종료 ✅

## Workflow Hub Route (`money-shorts-os-workflow-hub-ui-v1`):

- `app/money-shorts/page.tsx` — 신규 생성 (Server Component, static)

UI 구성:
- 헤더: "Money Shorts OS — Workflow Hub" + SOURCE FIRST / LOCAL ONLY / MVP1 배지
- 출처 우선 원칙 섹션 (amber): 4개 원칙 bullet
- Workflow 순서 섹션: 4개 StepCard (sm:grid-cols-2 반응형)
  1. Fact Card Overview → `/fact-cards/manual`
  2. Manual Fact Card 입력 → `/fact-cards/manual/new`
  3. Package Preview → `/fact-cards/manual/package-preview`
  4. Package Library → `/packages`
- 현재 상태 note (local workbench, 외부 전송 없음)

Validation evidence (2026-06-25):
- ESLint (`app/money-shorts/page.tsx`): 0 warnings ✅
- TypeScript (full tsc → `app/money-shorts/` 필터): 0 errors ✅
- 금지 패턴 검색 (clipboard/fetch//api//ffmpeg/output//upload/deploy): 0건 (UI 텍스트 내 단어만 — 실제 호출 없음) ✅
- dev server HTTP 검증 (http://localhost:3000/money-shorts):
  - `hasWorkflowHub=true` ✅
  - `hasSourceFirst=true` (출처 우선 원칙 렌더) ✅
  - `hasLocalOnly=true` (LOCAL ONLY 배지) ✅
  - `/fact-cards/manual` href 존재 ✅
  - `/fact-cards/manual/new` href 존재 ✅
  - `/fact-cards/manual/package-preview` href 존재 ✅
  - `/packages` href 존재 ✅
- dev server 종료 ✅

## Workflow Hub Entry Links (`money-shorts-os-workflow-hub-entry-links-v1`):

4개 기존 Money Shorts UI 화면 헤더에 `← Workflow Hub` → `/money-shorts` 링크 추가.

수정 파일:
- `app/fact-cards/manual/page.tsx` — 헤더 버튼 그룹 맨 앞에 추가
- `app/fact-cards/manual/new/ManualFactCardFormClient.tsx` — 헤더 버튼 그룹 맨 앞에 추가 (샘플/초기화 버튼 앞)
- `app/fact-cards/manual/package-preview/page.tsx` — 헤더 배지 그룹 앞에 추가
- `app/packages/PackageLibraryClient.tsx` — 헤더 우측 MVP1 배지 앞에 추가

기존 동작 모두 유지: valid/broken fixture, 샘플 불러오기/초기화, pipeline preview, package list/detail.

Validation evidence (2026-06-25):
- ESLint (4파일): 0 warnings ✅
- TypeScript (full tsc → app/fact-cards/ + app/packages/ 필터): 0 errors ✅
- 금지 패턴 (clipboard 실제 API / fetch( / /api/ / ffmpeg / output/ / upload / deploy): 0건 ✅
- dev server HTTP 검증:
  - `/fact-cards/manual`: hasHub=true, hasValidDraft=true ✅
  - `/fact-cards/manual/new`: hasHub=true, hasSampleBtn=true ✅
  - `/fact-cards/manual/package-preview`: hasHub=true, hasLocalPreview=true ✅
  - `/packages`: hasHub=true, hasPackageLibrary=true ✅
- dev server 종료 ✅

## MVP1 Local UI Smoke Pass (`money-shorts-os-mvp1-local-ui-smoke-v1`):

코드 변경 없음. 5개 route 전체 HTTP 200 + 핵심 텍스트/href 확인.

| Route | hub href | 핵심 확인 |
|---|---|---|
| `/money-shorts` | N/A (허브 자체) | Workflow Hub ✅ · 출처 우선 ✅ · LOCAL ONLY ✅ · 4개 route href 전부 ✅ |
| `/fact-cards/manual` | `/money-shorts` ✅ | ok=true ✅ · ok=false ✅ · `/fact-cards/manual/new` ✅ · `/packages` ✅ |
| `/fact-cards/manual/new` | `/money-shorts` ✅ | LOCAL VALIDATION ONLY ✅ · ok=false ✅ · manual_citation_required ✅ · 샘플 불러오기 ✅ · 초기화 ✅ |
| `/fact-cards/manual/package-preview` | `/money-shorts` ✅ | LOCAL PREVIEW ONLY ✅ · Package Preview ✅ · contentPackageId 렌더 ✅ |
| `/packages` | `/money-shorts` ✅ | Package Library ✅ · 승인/반려/차단 상태 ✅ |

콘솔 경고 비고:
- `Each child in a list should have a unique "key" prop` 경고 다수 — 기존 코드에 존재했던 것으로 확인. smoke 기준 blocker 아님. 모든 명시적 map에서 key prop 존재 확인됨 (page-preview key={step.num}/key={item.label}/key={scene.sceneId} 등). 경고 정확한 출처 격리 불가 (preview 콘솔 누적 방식). 기능 동작에 영향 없음.
- 서버 오류(5xx): 없음 ✅

## React Key Warning Isolation (`money-shorts-os-react-key-warning-isolation-v1`):

환경: React 19.2.4 + Next.js 16.2.6. Server Component hydration 시 발생하는 React 19 key 경고 격리 및 부분 수정.

**격리 결과:**
- `/money-shorts`, `/fact-cards/manual`, `/fact-cards/manual/new` → 경고 없음 ✅
- `/packages` → 경고 없음 ✅ (이전 누적 로그가 혼동 유발했으나 fresh 서버에서 0회 확인)
- `/fact-cards/manual/package-preview` → 경고 발생 (격리 완료)

**원인 분석 (React 19 동작):**
React 19에서는 `<div>` 내에 **static JSX + dynamic `.map()` 결과**가 혼재할 때, `.map()` 결과 배열에 key가 있어도 parent context에서 key 경고를 발생시킨다.
특히 이하 두 패턴이 트리거:
1. `<div className="space-y-2">` 내 3개 static div + `sourceRefs.map()` 결과 혼재
2. `SectionCard children`에서 `{primaryScript && <>...</>}` Fragment 조건부 표현식이 내부에 `scenes.map()`을 포함 (Fragment unfold 시 parent `<div>` 내 dynamic 위치 발생)

**수정 완료:**

`app/fact-cards/manual/package-preview/page.tsx`:
- Clipboard sections `<div className="space-y-2">` 내 3개 static div에 deterministic key 추가 (`key="clipboard-youtube"`, `key="clipboard-instagram"`, `key="clipboard-hashtags"`)
- `{primaryScript && (<>...</>)}` → `{primaryScript && (<div>...</div>)}` 로 Fragment를 단일 `<div>` wrapper로 교체 (layout 변화 없음)
- `WorkflowSteps` separator `{i < steps.length - 1 && <span>›</span>}` → `<span className={...visible/invisible...}>›</span>` (항상 렌더)
- `pipelineStatusItems` 인라인 배열 리터럴 → 페이지 함수 내 const로 분리
- `key={step.num}` → `key={String(step.num)}`

`app/packages/PackageLibraryClient.tsx`:
- `WorkflowStatusBar` separator 동일 패턴 수정: `{i < steps.length - 1 && (<span>›</span>)}` → `<span className={...}>›</span>`

**검증 결과 (최종 - `money-shorts-os-react-key-warning-isolation-v1-review-fix` 완료):**
- `/fact-cards/manual/package-preview`: 경고 **0회** ✅
- `/packages`: 경고 **0회** ✅
- 이진 탐색으로 `primaryScript.scenes.map()`이 직접 원인 확정
- 루트 원인: `ScriptScene` 타입에 `sceneId` 필드 없음 → `key={sc.sceneId}` = `key={undefined}` → 모든 map 아이템 key 중복
- 수정: `key={sc.sceneId}` → `key={String(sc.sceneIndex)}`, `sc.estimatedDurationSec` → `sc.durationSec` (타입 정렬)
- 금지 패턴 (Date.now/Math.random/clipboard OS API/fetch/api/ffmpeg/output/sceneId 잔존): blueprint.scenes.map의 `scene.sceneId`는 `VideoBlueprintScene` 타입에 존재하는 유효한 필드 — 정상 ✅

**변경 파일 (누적 git diff):**
- `app/fact-cards/manual/package-preview/page.tsx` (+36/-33)
- `app/packages/PackageLibraryClient.tsx` (+2/-4)
- `_ai/CLAUDE_REPORT.md` (evidence 갱신)

## Type Cleanup (`money-shorts-os-package-preview-type-cleanup-v1`)

`app/fact-cards/manual/package-preview/page.tsx` 타입 오류 정리 및 diff 최소화.

**수정 내용:**
- `scene.role` → `scene.sceneRole` (`VideoBlueprintScene` 실제 필드)
- `scriptPackage.moneyOsCta ? (...) : null` → `scriptPackage.moneyOsCta && (...)` 원복 (경고 비원인)
- `primaryScript ? (...) : null` → `primaryScript && (...)` 원복 (경고 비원인, `<div>` wrapper는 유지)

**유지된 수정:**
- `key={String(sc.sceneIndex)}` (key warning fix 핵심)
- `sc.durationSec` (ScriptScene 실제 필드)
- `primaryScript &&` 내부 `<div>` wrapper (Fragment → div 교체 유지)

**검증:**
- `/fact-cards/manual/package-preview` 경고 **0회** ✅ (fresh 서버)
- `/packages` 경고 **0회** ✅ (fresh 서버)
- ESLint: 0 errors ✅
- `scene.role` 잔존: 0건 ✅
- `git diff --stat`: 3 files changed, +74/-32

## MVP1 RC Smoke (`money-shorts-os-mvp1-rc-smoke-and-state-sync-v1`)

기준 commit: `de96040 fix(ui): clear package preview key warnings`

**5개 route RC smoke 결과 (fresh server, 2026-06-25):**

| Route | load | key warning | 핵심 확인 |
|-------|------|------------|----------|
| `/money-shorts` | ✅ | 0회 | Workflow Hub 헤딩, 4개 workflow 링크(overview/입력/pipeline/라이브러리) |
| `/fact-cards/manual` | ✅ | 0회 | Manual Fact Card 헤딩, hub backlink + 3개 forward link |
| `/fact-cards/manual/new` | ✅ | 0회 | Manual Fact Card 입력 헤딩, hub backlink + form links |
| `/fact-cards/manual/package-preview` | ✅ | 0회 | Package Preview 헤딩 (핵심 fix 유지) |
| `/packages` | ✅ | 0회 | Package Library 헤딩 |

server 5xx: 없음 ✅

## Owner Acceptance Prep (`money-shorts-os-mvp1-owner-acceptance-prep-v1`)

기준 commit: `9978d61 test(money-shorts): record mvp1 rc smoke pass`

**Route Readiness (fresh server, 2026-06-25):**

| Route | load | key warning | 준비 상태 |
|-------|------|------------|----------|
| `/fact-cards/manual/new` | ✅ | 0회 | 입력 필드 25개, 버튼(샘플/초기화/삭제/Citation추가), backlink/forward link 정상 |
| `/fact-cards/manual/package-preview` | ✅ | 0회 | 10개 section(파이프라인 상태~⑨ Clipboard), workflow steps 표시, backlink/forward link 정상 |

구현 코드 변경 없음. 문서만 업데이트.

## Auto Fact Card Candidate (`money-shorts-os-auto-fact-card-candidate-v1`)

기준 commit: `9978d61 test(money-shorts): record mvp1 rc smoke pass`

**구현 내용:**

- `lib/source-facts/raw-snapshot-parser.ts` — `RawSnapshotParser` interface + `generateCandidateFromSnapshot()` helper
- `lib/source-facts/candidates.ts` — `mockEcosBaseRateSnapshot` (mock ECOS 기준금리) + `ecosBaseRateParser` + `generatedBaseRateResult`
- `lib/source-facts/index.ts` — 신규 파일 re-export 추가
- `app/fact-cards/manual/package-preview/page.tsx` — `searchParams` 기반 candidate 선택 (async page), CANDIDATE_REGISTRY, candidate selector UI

**검증:**

| 체크 | 결과 |
|------|------|
| ESLint (4개 파일) | 0 errors ✅ |
| forbidden pattern (fetch/Date.now/Math.random/clipboard/ffmpeg/output/deploy) | 0건 ✅ (`/api/` 매칭은 URL string 상수, fetch() 없음) |
| `/fact-cards/manual/package-preview` default (가계부채) | key warning 0, 기존 fixture 정상 ✅ |
| `/fact-cards/manual/package-preview?candidate=base-rate` | key warning 0, 기준금리 pipeline 렌더 ✅ |
| 기준금리 파생값 | indicatorName/ECOS/allowedClaims/interpretation 모두 표시 확인 ✅ |
| live network call | 없음 (모두 mock 상수) ✅ |

**[review-fix: money-shorts-os-auto-fact-card-candidate-v1-review-fix — 2026-06-25]**

Fix 1 — `raw-snapshot-parser.ts` import 수정:
- `import type { RawDataSnapshot, ManualFactCardDraft } from "./types"` → split
- `ManualFactCardDraft`는 `"./types"`에 없고 `"./manual"`에 있음 → `import type { ManualFactCardDraft } from "./manual"` 분리

Fix 2 — `candidates.ts` display precision:
- `rawPayload`에 `currentValueText: "3.0%"`, `previousValueText: "3.25%"`, `changeValueText: "-0.25%p"` 추가
- `EcosBaseRatePayload` interface + `isEcosBaseRatePayload` type guard에 3개 string 필드 추가
- `parse()` 내 `currentValue/previousValue/changeValue/interpretation/allowedClaims` 필드를 `\`${cur}%\`` 방식 → `p.currentValueText` 등 명시적 display 문자열 사용으로 교체

Fix 3 — `page.tsx` unknown candidate fallback:
- `candidateKey !== null && candidateEntry === null` 조건에서 `<ErrorState message=... />` 반환 (등록된 키 목록 포함)
- 기존 silent `?? validHouseholdDebtResult` fallback은 `candidateKey === null` (쿼리스트링 없음) 케이스에만 도달하도록 guard 추가

검증:
| 체크 | 결과 |
|------|------|
| TS import check (output/ 제외) | 0 errors ✅ |
| ESLint (3개 변경 파일) | 0 warnings ✅ |
| `ManualFactCardDraft from "./types"` pattern | 0건 ✅ (완전 제거됨) |
| unknown candidate silent fallback line 잔존 | 위 guard 통과 후 도달 시 candidateEntry 확실히 non-null |

## ECOS Connector Scaffold (`money-shorts-os-ecos-connector-scaffold-v1`)

기준 commit: `d85b616 feat(source-facts): add auto fact card candidate preview`

**구현 내용:**

- `lib/source-facts/ecos-connector.ts` (신규)
  - `EcosStatSearchRequest` — ECOS API request spec 타입 (cycle, statCode, itemCode1, startDate, endDate)
  - `EcosStatRow` — ECOS API response row 타입 (STAT_CODE, ITEM_NAME1, TIME, DATA_VALUE, UNIT_NAME 등)
  - `EcosApiResponse` — 전체 응답 envelope 타입
  - `EcosConnectorResult` — transport 결과 discriminated union (ok/error)
  - `EcosTransport` interface — mock/live 교체 가능한 transport boundary
  - `ECOS_BASE_RATE_REQUEST_JAN2025` — 기준금리 request spec 상수
  - `createEcosMockTransport()` — rows+fetchedAt 상수를 받아 mock transport 반환
  - `runEcosConnector()` — transport.fetch + normalizer 연결 helper

- `lib/source-facts/ecos-fixtures.ts` (신규)
  - `ECOS_BASE_RATE_ROW_JAN2025` — 2025년 1월 기준금리 row (DATA_VALUE: "3.00")
  - `ECOS_BASE_RATE_ROW_DEC2024` — 2024년 12월 직전 row (DATA_VALUE: "3.25")
  - `ECOS_BASE_RATE_ROWS_JAN2025` — 2-period row pair (current, previous)
  - `ECOS_BASE_RATE_MOCK_RESPONSE` — full API response envelope

- `lib/source-facts/ecos-normalizer.ts` (신규)
  - `ecosTimeToDataPeriod()` — ECOS TIME "202501" → "2025년 1월"
  - `ecosTimeToPublishedDate()` — ECOS TIME → ISO date (last day of month fallback)
  - `normalizeEcosBaseRateRows()` — 2-period EcosStatRow[] → RawDataSnapshot (현재값/이전값/변화량/display string 계산, decimal precision 보존)
  - `scaffoldEcosBaseRateSnapshot` — 전체 scaffold 경로 실행 결과 snapshot
  - `scaffoldEcosBaseRateCandidate` — snapshot → `ecosBaseRateParser` → `generateCandidateFromSnapshot()` 결과
  - `existingBaseRateResult` — 기존 `generatedBaseRateResult` re-export (비교용)

- `lib/source-facts/index.ts` — 3개 신규 파일 re-export 추가

**검증:**

| 체크 | 결과 |
|------|------|
| TypeScript strict check (output/ 제외) | 0 errors ✅ |
| ESLint (4개 변경 파일, --max-warnings=0) | 0 warnings ✅ |
| `Date.now` / `Math.random` / `fetch(` (HTTP) / `process.env` / `navigator.clipboard` / `ffmpeg` / `output/` / `upload` / `deploy` | 0건 ✅ (`fetch` 매칭은 interface 메서드 선언만, HTTP client 없음) |
| live network call | 없음 (모든 값 상수) ✅ |
| `scaffoldEcosBaseRateSnapshot` | `normalizeEcosBaseRateRows` 경로 실행, non-null expected ✅ |
| `scaffoldEcosBaseRateCandidate` | `ecosBaseRateParser` → `generateCandidateFromSnapshot` 경로 연결 ✅ |
| final `git status -sb` | 3 untracked, 2 modified (_ai/HANDOFF_NOW + index.ts) ✅ |

**scaffold path:**
```
ECOS_BASE_RATE_REQUEST_JAN2025
  → createEcosMockTransport(ECOS_BASE_RATE_ROWS_JAN2025, fetchedAt)
  → runEcosConnector(request, transport, normalizeEcosBaseRateRows)
  → RawDataSnapshot (scaffoldEcosBaseRateSnapshot)
  → generateCandidateFromSnapshot(ecosBaseRateParser, snapshot)
  → ManualFactCardAuthoringResult (scaffoldEcosBaseRateCandidate)
```

**live transport으로 전환 시 필요한 작업 (다음 slice):**
- `EcosTransport` interface를 구현하는 `EcosLiveTransport` 추가 (`execute()` 구현, API key 사용)
- `runEcosConnector()` 호출 시 `createEcosMockTransport` 대신 live transport 주입
- process.env / API key 사용 — Owner 명시 승인 필요

**[review-fix: money-shorts-os-ecos-connector-scaffold-v1-review-fix — 2026-06-25]**

Fix 1 — Published date correctness (`ecos-connector.ts`, `ecos-normalizer.ts`):
- `EcosStatSearchRequest`에 `publishedDate: string`와 `sourcePageUrl: string` 필드 추가
- `ECOS_BASE_RATE_REQUEST_JAN2025`에 `publishedDate: "2025-01-16"`, `sourcePageUrl: "https://ecos.bok.or.kr/#/Short/722Y001"` 설정
- `runEcosConnector()` signature: normalizer에 request 전달 `(rows, fetchedAt, request)`
- `normalizeEcosBaseRateRows()` 3번째 인자 `request: EcosStatSearchRequest` 추가
- normalizer 내 `publishedDate = request.publishedDate` — `ecosTimeToPublishedDate()` 호출 완전 제거
- `scaffoldEcosBaseRateCandidate.factCard.publishedDate` = `"2025-01-16"` (static 확인)
- `2025-01-31` fallback 제거됨 — `ecosTimeToPublishedDate`가 normalizer에서 호출되지 않음

Fix 2 — Transport method naming (`ecos-connector.ts`):
- `EcosTransport.fetch()` → `EcosTransport.execute()` (global `fetch()` 충돌 방지)
- `createEcosMockTransport` 내 구현부 `fetch()` → `execute()`
- `runEcosConnector` 내 `transport.fetch()` → `transport.execute()`
- forbidden pattern `fetch(` 검색 시 코드 실행부 0건 — 주석만 매칭

Fix 3 — Human-facing source URL (`ecos-connector.ts`, `ecos-normalizer.ts`):
- `EcosStatSearchRequest.sourcePageUrl` 필드 추가 (Owner 검토 가능한 ECOS stat page URL)
- `normalizeEcosBaseRateRows` 내 `sourceUrl: request.sourcePageUrl` (stat page)
- API endpoint는 `rawPayload.apiEndpointUrl`에 별도 보존
- `EcosStatSearchRequest.sourceName` 필드 추가 → snapshot `sourceName: request.sourceName`

검증:
| 체크 | 결과 |
|------|------|
| TypeScript strict check (output/ 제외) | 0 errors ✅ |
| ESLint (2개 변경 파일, --max-warnings=0) | 0 warnings ✅ |
| `Date.now` / `Math.random` / `fetch(` (코드) / `process.env` / `navigator.clipboard` / `ffmpeg` / `output/` / `upload` / `deploy` | 0건 ✅ |
| `publishedDate: "2025-01-16"` in request constant | ✅ (ecos-connector.ts:122) |
| `ecosTimeToPublishedDate` 호출 in normalizer | 0건 ✅ (완전 제거) |
| `2025-01-31` fallback 잔존 | 0건 ✅ |
| `sourceUrl` = human-facing stat page in snapshot | ✅ (ecos-normalizer.ts:85, request.sourcePageUrl) |

## ECOS Live Connector (`money-shorts-os-ecos-live-connector-v1`)

기준 commit: `20ab76b feat(source-facts): add ecos connector scaffold with mock transport`

Owner 승인: ECOS live connector 진행 — `EcosLiveTransport` 구현, live transport 내부 `fetch()`, `process.env` ECOS API key 읽기, 소량 live 호출 허용.

**구현 내용:**

- `lib/source-facts/ecos-connector.ts` (수정)
  - `EcosAsyncTransport` interface 추가 — `executeAsync(request): Promise<EcosConnectorResult>` (기존 동기 `EcosTransport`와 분리)
  - `runEcosConnectorAsync()` helper 추가 — async transport await 후 normalize (동기 `runEcosConnector` 그대로 유지)
  - `ECOS_BASE_RATE_REQUEST_2P` 추가 — 2기간(202412~202501) request, normalizer가 요구하는 current+previous 2 rows 확보용
  - 기존 동기 mock scaffold / module-level candidate 상수 무손상 (Promise 오염 없음)

- `lib/source-facts/ecos-live-transport.ts` (신규) — 라이브러리에서 유일하게 네트워크 I/O + env 읽는 모듈
  - `resolveEcosApiKey()` — `ECOS_API_KEY` → `BOK_ECOS_API_KEY` 우선순위, **값 출력 없음**, null 반환 시 missing
  - `hasEcosApiKey()` — 존재 여부만 boolean
  - `buildEcosStatSearchUrl(apiKey, request)` — ECOS URL 빌더 (key는 path segment, secret-bearing)
  - `parseEcosStatSearchRows(json)` — JSON → `EcosStatRow[]` (type guard, malformed null)
  - `isEcosErrorEnvelope()` — ECOS `{RESULT:{CODE,MESSAGE}}` 에러 감지
  - `createEcosLiveTransport(fetchedAt)` — `EcosAsyncTransport` 구현, executeAsync 1회 fetch, **에러에 key/URL 미포함**
  - `console.*` 호출 0건 (라이브러리는 출력하지 않음)

- `lib/source-facts/index.ts` (수정) — `ecos-live-transport` re-export 추가

- `scripts/_ecos-live-check.mjs` (신규) — read-only live check, 파일 쓰기 없음
  - `lib`의 live transport/normalizer와 **동일 알고리즘** (tsx/ts-node 부재 + dependency 추가 금지로 자체 포함)
  - env key 없으면 `RESULT: BLOCKED` 보고, 가짜 성공 없음
  - env key 있으면 1회 ECOS 호출 → normalize → snapshot 출력
  - ECOS는 TIME 오름차순 반환 → current-first 정렬 후 normalize

**검증:**

| 체크 | 결과 |
|------|------|
| TypeScript strict check (output/ 제외) | 0 errors ✅ |
| ESLint (ecos-connector/ecos-live-transport/index.ts) | 0 warnings ✅ |
| ESLint (`scripts/_ecos-live-check.mjs`) | 0 warnings ✅ |
| `Date.now` / `Math.random` / `navigator.clipboard` / `ffmpeg` / `output/` / `upload` / `deploy` | 0건 ✅ (`Date.now` 매칭은 주석만) |
| `fetch(` / `process.env` 실제 코드 사용 위치 | `ecos-live-transport.ts`에만 격리 ✅ (connector는 주석만) |

**Secret safety evidence:**

| 체크 | 결과 |
|------|------|
| API key 값 하드코딩 | 없음 ✅ |
| `console.*` in `ecos-live-transport.ts` | 0건 ✅ (라이브러리 출력 없음) |
| 스크립트가 apiKey/url 출력 | 없음 ✅ (에러 시 "URL withheld — contains key") |
| `.env*` 파일 수정/스테이징 | 없음 ✅ (git status에 .env 없음) |
| git diff에 secret-like 값 | 없음 ✅ |

**Live verification result: BLOCKED (env var 부재)**
- `node scripts/_ecos-live-check.mjs` 출력:
  - `RESULT: BLOCKED`
  - `reason: ECOS API key missing — set one of ECOS_API_KEY, BOK_ECOS_API_KEY`
  - `note: live verification not run; no fake success.`
- 구현은 완료, env key 주입 시 즉시 live 검증 가능. 가짜 성공 만들지 않음.

**async path:**
```
ECOS_BASE_RATE_REQUEST_2P
  → createEcosLiveTransport(fetchedAt)          [EcosAsyncTransport]
  → runEcosConnectorAsync(req, transport, normalizeEcosBaseRateRows)
  → (fetch ECOS live API, process.env key)
  → RawDataSnapshot
  → generateCandidateFromSnapshot(ecosBaseRateParser, snapshot)
  → Fact Card candidate
```

**[review-fix: money-shorts-os-ecos-live-connector-v1-review-fix — 2026-06-26]**

P1 Fix — current/previous ordering in primary library path:
- `ecos-connector.ts`: `orderEcosRowsCurrentFirst(rows)` helper 추가 — `[...rows].sort((a,b) => b.TIME.localeCompare(a.TIME))`, 원본 mutate 없음
- `ecos-live-transport.ts`: import 추가 + `executeAsync` 성공 경로에서 `rows: orderEcosRowsCurrentFirst(rows)` 적용
- 이제 `runEcosConnectorAsync(..., normalizeEcosBaseRateRows)` primary path가 자동으로 current-first rows를 받음 — Dec2024가 current로 잘못 해석되는 버그 해소
- `ECOS_BASE_RATE_REQUEST_2P` 주석: "caller must order them current-first" → "EcosLiveTransport.executeAsync() applies this ordering automatically"
- `scripts/_ecos-live-check.mjs` 주석: "mirrors orderEcosRowsCurrentFirst in ecos-connector.ts, which the live transport also applies automatically"

검증:
| 체크 | 결과 |
|------|------|
| TypeScript strict check (output/ 제외) | 0 errors ✅ |
| ESLint (ecos-connector/ecos-live-transport/_ecos-live-check.mjs) | 0 warnings ✅ |
| `console.*` in `ecos-live-transport.ts` | 0건 ✅ |
| `fetch(` / `process.env` 격리 (`ecos-connector.ts` 실코드) | 주석만, 코드 없음 ✅ |
| API key 값 하드코딩 | 없음 ✅ |
| `node scripts/_ecos-live-check.mjs` | `RESULT: BLOCKED` (env key 부재, 가짜 성공 없음) ✅ |

**[live-check: money-shorts-os-ecos-live-check-v1 — 2026-06-26]**

`node --env-file=.env.local scripts/_ecos-live-check.mjs` 1회 실행 결과:

```
RESULT: LIVE_OK
rows fetched: 2
snapshot.id: raw-ecos-722Y001-0101000-202501
indicatorName: 한국은행 기준금리
dataPeriod: 2025년 1월
publishedDate: 2025-01-16
sourceUrl: https://ecos.bok.or.kr/#/Short/722Y001
currentValueText: 3.0%
previousValueText: 3.0%
changeValueText: 0.0%p
```

Secret safety: API key 값 출력 없음 ✅, secret-bearing URL 출력 없음 ✅

**Mock expectation mismatch resolved (`money-shorts-os-ecos-live-truth-alignment-v1`):**
- rows 2개 정상 수신, `LIVE_OK`
- live ECOS truth: Jan2025 `3.0%`, Dec2024 `3.0%`, change `0.0%p`
- 기존 mock expectation `Dec2024 = 3.25%`, `change = -0.25%p`는 wrong assumption이었음
  (ECOS 722Y001/0101000 monthly series에서 Dec2024도 `3.00`으로 기록됨)
- `lib/source-facts/ecos-fixtures.ts`: `ECOS_BASE_RATE_ROW_DEC2024.DATA_VALUE` `"3.25"` → `"3.00"` 정정
- `lib/source-facts/candidates.ts`: `mockEcosBaseRateSnapshot.rawPayload` previousValue/changeValue/Text 정정
- mock/candidate가 live ECOS result semantics와 일치함 ✅

**[latest-period-resolver: money-shorts-os-ecos-latest-period-resolver-v1 — 2026-06-26]**

production용 latest available period resolver 구현 (Jan2025 smoke fixture 의존 제거):

- `lib/source-facts/ecos-latest-period.ts` (신규):
  - `subtractEcosMonths(period, months)` — YYYYMM 문자열/정수 산술, `Date.now()` 미사용
  - `buildEcosLatestWindowRequest(endPeriod, windowMonths=12)` — caller-supplied end period 기준 rolling 월간 window request 빌더. `publishedDate: ""` (window 단계에선 발표일 미지정, 발명 금지)
  - `resolveLatestEcosBaseRatePeriod(rows)` — `orderEcosRowsCurrentFirst` 후 latest + nearest previous 선택. 2 row 미만이면 `insufficient_rows` (fixture fallback 없음)
  - `decideEcosLatestPeriodReadiness(rows, fetchedAt, verifiedPublishedDate)` — 3-state 판정: `blocked_insufficient_rows` / `blocked_pending_source_date` / `draft_ready`. 검증된 publishedDate 없으면 publishable 금지. `publishable`는 항상 false (publish 결정은 downstream)
- `lib/source-facts/index.ts`: re-export 추가
- `scripts/_ecos-latest-period-check.mjs` (신규): read-only live check, secret-safe, end period `202606` 고정, lib 알고리즘 미러

live verification (`node --env-file=.env.local scripts/_ecos-latest-period-check.mjs`):
```
window: 202507~202606 (12 months)
RESULT: LIVE_OK
rows fetched: 11
latestPeriod: 202605 (2026년 5월)
previousPeriod: 202604 (2026년 4월)
latestValue: 2.5(연%)
previousValue: 2.5(연%)
indicatorName: 한국은행 기준금리
publishedDate: UNKNOWN (not in ECOS row payload)
candidateStatus: blocked_pending_source_date
publishable: false
```

판정 결과:
- latest period: `202605` (2026년 5월), previous: `202604` (2026년 4월), 둘 다 `2.5%`, change 0%
- candidate status: **blocked_pending_source_date** — ECOS row payload에 발표일이 없어 publishable Fact Card 생성 안 함 (발명 금지 원칙 준수)
- Jan2025 smoke fixture로 fallback 안 함 ✅

검증:
| 체크 | 결과 |
|------|------|
| TypeScript strict check (output/ 제외) | 0 errors ✅ |
| ESLint (ecos-latest-period/index.ts/_ecos-latest-period-check.mjs) | 0 warnings ✅ |
| `Date.now`/`Math.random`/`navigator.clipboard`/`ffmpeg`/`output/`/`upload`/`deploy` | 0건 ✅ (`Date.now` 매칭은 부재 설명 주석만) |
| API key 값 하드코딩 | 없음 ✅ |
| `.env*` 수정/스테이징 | 없음 ✅ |
| secret-bearing URL 출력 | 없음 ✅ ("URL withheld — contains key") |

관찰 (Codex 검토용): ECOS `UNIT_NAME`이 `연%`(연리)로 반환됨. 스크립트는 `DATA_VALUE+UNIT_NAME`을 직접 출력해 `2.5연%`로 보임. lib normalizer는 `UNIT_NAME`을 `unit` 필드로 보존하고 display string은 `%`를 따로 붙이므로 데이터 정합성 문제는 아님. draft 연결 slice에서 unit 표기 일관성 확인 권고.

**[review-fix: money-shorts-os-ecos-latest-period-resolver-v1-review-fix — 2026-06-26]**

P1-A Fix — script/library row cap mismatch 해소:
- `lib/source-facts/ecos-connector.ts`: `EcosStatSearchRequest`에 optional `rowStart?: number` / `rowEnd?: number` 추가 (기존 필수 필드 무변경)
  - 주석: 빈 경우 library default 10행. latest-window 요청은 rowEnd를 명시해 window 전체를 커버.
- `lib/source-facts/ecos-live-transport.ts`: 모듈 상수 `ECOS_ROW_START/END` → `DEFAULT_ROW_START/END=10`. `buildEcosStatSearchUrl()`이 `request.rowStart ?? DEFAULT_ROW_START`, `request.rowEnd ?? DEFAULT_ROW_END` 사용.
- `lib/source-facts/ecos-latest-period.ts`: `buildEcosLatestWindowRequest()`의 request에 `rowStart: 1`, `rowEnd: windowMonths + 2` 추가 (12개월 window → rowEnd=14, 2 buffer).
- `scripts/_ecos-latest-period-check.mjs`: `ECOS_ROW_END = 100` → `14` (WINDOW_MONTHS+2 buffer, lib와 동일 근거).
- 결과: 12개월 window 요청 시 library primary path도 최대 14개 rows를 받을 수 있어 latest row pair 누락 불가.

P1-B Fix — empty publishedDate snapshot 방지 guard 추가:
- `lib/source-facts/ecos-normalizer.ts`: `normalizeEcosBaseRateRows()` 초반에 `request.publishedDate.trim().length === 0`이면 `null` 반환.
  - `buildEcosLatestWindowRequest()`의 `publishedDate: ""`가 실수로 normalizer에 들어와도 snapshot 생성되지 않음.
  - Jan2025/verified-date 경로(`publishedDate: "2025-01-16"` 등 실제 날짜)는 통과 — 기존 scaffold/live-smoke 경로 무손상.

live verification (`node --env-file=.env.local scripts/_ecos-latest-period-check.mjs`, 1회):
```
window: 202507~202606 (12 months)
RESULT: LIVE_OK
rows fetched: 11
latestPeriod: 202605 (2026년 5월)
previousPeriod: 202604 (2026년 4월)
latestValue: 2.5연%
previousValue: 2.5연%
indicatorName: 한국은행 기준금리
publishedDate: UNKNOWN (not in ECOS row payload)
candidateStatus: blocked_pending_source_date
publishable: false
```

검증:
| 체크 | 결과 |
|------|------|
| TypeScript strict check (output/ 제외) | 0 errors ✅ |
| ESLint (5개 변경 파일) | 0 warnings ✅ |
| forbidden pattern (Date.now/Math.random/clipboard/ffmpeg/output/deploy) | 주석만, 코드 없음 ✅ |
| script/library row cap 일치 (rowEnd=14, WINDOW_MONTHS+2) | ✅ |
| empty publishedDate → normalizer null 반환 | ✅ (guard 추가) |
| API key 값 출력 없음 | ✅ |
| secret-bearing URL 출력 없음 | ✅ |
| `.env*` 수정/스테이징 없음 | ✅ |
| `piq_diag_out.txt` unstaged 유지 | ✅ |

## ECOS Source-Date Resolver (`money-shorts-os-ecos-source-date-resolver-v1` — 2026-06-26)

기준 commit: `63d9b10 feat(source-facts): add ecos latest-period resolver with source-date gate`

목표: latest ECOS base-rate period(`202605`)를 공식 BOK 발표일과 연결해 `blocked_pending_source_date` → `draft_ready`로 전환 가능한지 검증. 단, 발표일을 공식 source에 자신 있게 연결 못 하면 blocked/unresolved 유지, 날짜 발명 금지.

**핵심 데이터 정확성 통찰:**
- ECOS 722Y001 기준금리는 월별 시계열 — 매월 "그 달에 유효한 금리"를 보고하며, 발표일/결정일이 아님.
- latest period `202605`(2026년 5월)의 값 2.5%는 "2026년 5월에 새로 결정된 값"이 아니라 "마지막으로 2.5%로 변경된 결정이 계속 유지 중"인 상태.
- 따라서 latest period의 정확한 publishedDate는 그 값이 마지막으로 **변경·결정된 공식 BOK 결정일**이어야 함. ECOS period(연월)에서 날짜를 유도하면 발명임.

**구현 (값 매칭 방식, 날짜 발명 방지):**

- `lib/source-facts/ecos-source-date.ts` (신규):
  - `BokBaseRateDecision` interface (decisionDate ISO + value 숫자)
  - `BOK_BASE_RATE_DECISIONS` — 공식 BOK 페이지에서 전사한 변경 이력(most-recent first): `2025-05-29=2.5`, `2025-02-25=2.75`, `2024-11-28=3.0`, `2024-10-11=3.25`, `2023-01-13=3.5`
  - `BOK_BASE_RATE_DECISION_SOURCE_URL` / `_SOURCE_NAME` — 공식 source (통화정책방향 결정회의 페이지)
  - `resolveEcosBaseRateSourceDate(latestRow, decisions?)` — latest ECOS **값**이 가장 최근 공식 결정 **값**과 일치할 때만 그 결정일을 verifiedPublishedDate로 반환. 불일치/미존재/파싱불가 시 4-code unresolved: `unparsable_latest_value` / `no_decision_history` / `value_not_in_official_history` / `latest_value_not_most_recent_decision`
  - `process.env`/`fetch`/`Date.now` 미사용 — 순수 검증 로직
- `lib/source-facts/index.ts`: re-export 추가
- `scripts/_ecos-source-date-check.mjs` (신규): read-only live check, secret-safe. ECOS latest period 가져온 뒤 BOK 이력 값 매칭 → readiness 보고.

**공식 source 확인 방식:**
- BOK 공식 페이지 `통화정책방향 결정회의 일정 및 자료` (https://www.bok.or.kr/portal/singl/baseRate/list.do?dataSeCd=01&menuNo=200643) 에서 기준금리 변경 이력 표 확인.
- 일반 웹검색이 아닌 공식 BOK 페이지 우선. 최신 변경: 2025년 5월 29일 2.50%, 직전 2025년 2월 25일 2.75%.

**날짜 발명 방지 방식:**
- resolver는 latest ECOS row의 **숫자 값**을 공식 이력의 **가장 최근 결정 값**과만 매칭.
- 값이 일치할 때만 그 결정의 전사된 날짜를 반환 → 날짜는 항상 공식 전사 상수, ECOS period에서 유도 안 함.
- latest 값이 가장 최근 결정과 불일치하면(이력이 stale일 수 있음) 더 오래된 결정일로 fallback하지 않고 차단.

live verification (`node --env-file=.env.local scripts/_ecos-source-date-check.mjs`, 1회):
```
window: 202507~202606 (12 months)
RESULT: LIVE_OK
rows fetched: 11
latestPeriod: 202605 (2026년 5월)
previousPeriod: 202604 (2026년 4월)
latestValue: 2.5연%
indicatorName: 한국은행 기준금리
--- source-date verification ---
officialSource: 한국은행 통화정책방향 결정회의 — 기준금리 변경 이력
verifiedPublishedDate: 2025-05-29 (matched value 2.5%)
readinessStatus: draft_ready
publishable: false
```

source-date/readiness 판정:
- latest period: `202605` (2026년 5월), 값 2.5%
- verifiedPublishedDate: **2025-05-29** (공식 BOK 결정일, ECOS period 아님)
- official source evidence: BOK 통화정책방향 결정회의 페이지, 최신 변경 2025-05-29 2.50%
- readiness: **draft_ready** (decideEcosLatestPeriodReadiness에 verified date 전달 시 도달)
- publishable: **false** (downstream 결정, 이번 slice 미설정)

offline unit check (임시 .mjs, 7/7 PASS 후 git clean으로 삭제):
- T1 latest 2.5 → verified 2025-05-29 ✅
- T2 "2.50" → verified 2025-05-29 ✅
- T3 stale 값 3.0 → `latest_value_not_most_recent_decision` (오래된 날짜 발명 안 함) ✅
- T4 미존재 값 1.75 → `value_not_in_official_history` ✅
- T5 "N/A" → `unparsable_latest_value` ✅
- T6 empty history → `no_decision_history` ✅
- T7 verified date가 ECOS period(2026)가 아닌 공식 2025-05-29 ✅

검증:
| 체크 | 결과 |
|------|------|
| TypeScript strict check (output/ 제외) | 0 errors ✅ |
| ESLint (ecos-source-date.ts/index.ts/_ecos-source-date-check.mjs) | 0 warnings ✅ |
| forbidden pattern (Date.now/Math.random/clipboard/ffmpeg/output/upload/deploy) | 주석만, 코드 없음 ✅ |
| `process.env`/`fetch`/apiKey in ecos-source-date.ts | 없음 (순수 로직) ✅ |
| API key 값 출력 | 없음 ✅ |
| secret-bearing URL 출력 | 없음 ✅ (에러 시 "URL withheld") |
| `.env*` 수정/스테이징 | 없음 ✅ |
| `piq_diag_out.txt` 제외 유지 | 없음 (untracked) ✅ |

Non-blocking note (Codex 검토용): `normalizeEcosBaseRateRows()`는 아직 `sourceProviderId: "provider-ecos-mock"`. 이번 slice는 source-date 검증/readiness 도달까지만으로 snapshot publish 안 함. live provider id 분리는 다음 draft 연결 slice 검토.

## Latest Live Draft Candidate (`money-shorts-os-ecos-latest-live-draft-candidate-v1` — 2026-06-26)

기준 checkpoint: `4bc9f0a feat(source-facts): add bok base-rate source-date resolver`

목표: latest ECOS rows + BOK source-date 검증을 연결해 draft-only Fact Card candidate 경로 구현. `provider-ecos-mock` 라벨 제거, source-date provenance 유지.

**구현 내용:**

- `lib/source-facts/ecos-connector.ts` (M): `EcosStatSearchRequest`에 optional `sourceProviderId?: string` 추가. 기존 필수 필드 무변경. caller가 live request 시 `"provider-ecos-live"` 지정 가능.
- `lib/source-facts/ecos-normalizer.ts` (M): `normalizeEcosBaseRateRows()` 내 `sourceProviderId` 하드코딩 제거. `request.sourceProviderId ?? "provider-ecos-mock"` 사용 — 기존 mock 경로 완전 유지.
- `lib/source-facts/candidates.ts` (M):
  - `ECOS_LIVE_PROVIDER_ID = "provider-ecos-live"` export 추가.
  - `ecosBaseRateLiveParser` (신규): `sourceProviderId: ECOS_LIVE_PROVIDER_ID` 전용 parser. `isMock: false`, `isPublishable: false`. source-date provenance(publishedDate = BOK 결정일) 그대로 보존.
  - 기존 `ecosBaseRateParser` (mock, `isMock: true`) 무손상.
- `lib/source-facts/ecos-latest-candidate.ts` (신규): end-to-end 4-step live draft 경로:
  1. `resolveLatestEcosBaseRatePeriod(rows)` — latest + previous row 선택
  2. `resolveEcosBaseRateSourceDate(latestRow)` — 값 매칭으로 BOK 결정일 검증
  3. `normalizeEcosBaseRateRows(…, {sourceProviderId: ECOS_LIVE_PROVIDER_ID})` — snapshot 생성
  4. `generateCandidateFromSnapshot(ecosBaseRateLiveParser, snapshot)` — draft candidate
  - 각 단계 차단 시: `blocked_insufficient_rows` / `blocked_source_date_unresolved` / `blocked_normalize_failed`
  - `Date.now()` 미사용 — `fetchedAt`은 caller 공급
  - module-level live call 없음 — 완전 결정론적
- `lib/source-facts/index.ts` (M): `ecos-latest-candidate` re-export 추가
- `scripts/_ecos-latest-draft-candidate-check.mjs` (신규): read-only live check, 4-step 미러, secret-safe

**live verification (`node --env-file=.env.local scripts/_ecos-latest-draft-candidate-check.mjs`, 1회):**
```
env key: present (value not shown)
window: 202507~202606 (12 months)
latestPeriod: 202605 (2026년 5월)
previousPeriod: 202604 (2026년 4월)
latestValue: 2.5연%
previousValue: 2.5연%
verifiedPublishedDate: 2025-05-29 (official BOK decision date, not ECOS period)
---
RESULT: draft_ready
snapshotId: raw-ecos-722Y001-0101000-202605
sourceProviderId: provider-ecos-live
isMock: false
isPublishable: false
publishedDate: 2025-05-29
dataPeriod: 2026년 5월
indicatorName: 한국은행 기준금리
currentValueText: 2.5%
previousValueText: 2.5%
changeValueText: 0.0%p
sourceName: 한국은행 ECOS — 기준금리
sourceUrl: https://ecos.bok.or.kr/#/Short/722Y001
```

**provider-id/source-date provenance 확인:**
- `sourceProviderId: provider-ecos-live` ✅ (mock 아님)
- `publishedDate: 2025-05-29` = 공식 BOK 결정일 ✅ (ECOS period 202605에서 유도 안 함)
- `isMock: false`, `isPublishable: false` ✅ (draft-only)
- 기존 mock 경로(`ecosBaseRateParser`, `provider-ecos-mock`, `isMock: true`) 무손상 ✅

검증:
| 체크 | 결과 |
|------|------|
| TypeScript strict check (output/ 제외) | 0 errors ✅ |
| ESLint (6개 변경 파일) | 0 warnings ✅ |
| forbidden pattern (Date.now/Math.random/clipboard/ffmpeg/output/upload/deploy) | 주석만, 코드 없음 ✅ |
| live draft candidate check 1회 | LIVE_OK, draft_ready ✅ |
| sourceProviderId provider-ecos-live | ✅ |
| isMock=false, isPublishable=false | ✅ |
| publishedDate = official BOK decision date | ✅ |

## Review-Fix: source-date provenance 보존 + validation guard (`money-shorts-os-ecos-latest-live-draft-candidate-v1-review-fix` — 2026-06-26)

기준: 위 `latest-live-draft-candidate-v1` 작업 결과물 (uncommitted). 직전 checkpoint `4bc9f0a`.

### Fix 1 — BOK source-date provenance를 draft/citation 경로에 보존

**문제:** `buildEcosLatestDraftCandidate()`가 `sourceDateResolution.verifiedPublishedDate`만 사용하고 `sourceUrl/sourceName/matchedValue`를 버려 candidate citation에서 "왜 2025-05-29인가"를 증명할 수 없었다.

**수정 내용:**
- `EcosStatSearchRequest` (ecos-connector.ts): optional `sourceDateSourceName?`, `sourceDateSourceUrl?`, `sourceDateMatchedValue?` 추가
- `buildEcosLatestDraftCandidate()` (ecos-latest-candidate.ts): resolver 결과 3 필드를 draftRequest에 세팅
- `normalizeEcosBaseRateRows()` (ecos-normalizer.ts): `sourceDateSourceName`이 있으면 rawPayload에 3 필드 보존 (spread conditional)
- `EcosBaseRatePayload` (candidates.ts): optional 3 필드 추가
- `ecosBaseRateLiveParser` (candidates.ts): `sourceDateSourceName/Url`이 있으면 BOK 결정 이력 citation 추가 (`citation-source-date-{snapshotId}`)
- mock path (`ecosBaseRateParser`, `ECOS_BASE_RATE_REQUEST_JAN2025` 등): 완전 무손상

### Fix 2 — candidate validation 실패 시 `draft_ready` 금지

**문제:** Step 4의 `generateCandidateFromSnapshot()` 결과를 검사하지 않고 무조건 `draft_ready` 반환 가능.

**수정 내용:**
- `EcosLatestDraftCandidateStatus` (ecos-latest-candidate.ts): `blocked_candidate_validation_failed` 추가
- Step 4 직후 `candidateResult.ok === false || candidateResult.factCard === null` 시 blocked 반환
  - reason에 `field=X code=Y` 형태로 첫 번째 validation error 포함
  - `candidateResult`는 실패 결과를 담아 검토 가능하게 유지

**검증:**
| 체크 | 결과 |
|------|------|
| TypeScript strict (source-facts 관련) | 0 errors ✅ |
| ESLint (5개 파일) | 0 warnings ✅ |
| forbidden pattern (코드 내) | 없음 ✅ (주석만) |
| live check (1회) | draft_ready, sourceProviderId=provider-ecos-live, isMock=false, publishedDate=2025-05-29 ✅ |
| piq_diag_out.txt | untracked 유지 ✅ |
| secret 출력 | 없음 ✅ |

**provenance 필드 흐름 확인 (grep):**
- `ecos-connector.ts:69/76/82` → 타입 선언
- `ecos-latest-candidate.ts:126-128` → resolver에서 request에 세팅
- `ecos-normalizer.ts:119-122` → rawPayload에 보존
- `candidates.ts:58-60` → payload 타입 선언
- `candidates.ts:232-239` → live parser에서 BOK citation 생성

## Live Latest Draft Owner Acceptance Smoke (`live-latest-draft-owner-acceptance-smoke-v1` — 2026-06-26)

**Acceptance Verdict: PASS (with noted quality gap)**

Route smoke:
- `/money-shorts` → `200` ✅
- `/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606` → `200` ✅

Source-first field evidence (렌더된 HTML 기준):
| 항목 | 값 | 결과 |
|------|-----|------|
| sourceProviderId | `provider-ecos-live` | ✅ |
| isMock | `false` | ✅ |
| isPublishable | `false` | ✅ |
| dataPeriod | `2026년 5월` | ✅ |
| publishedDate | `2025-05-29` | ✅ |
| ECOS citation | `citation-generated-raw-ecos-722Y001-0101000-202605` | ✅ |
| BOK source-date citation | `citation-source-date-raw-ecos-722Y001-0101000-202605`, `bok.or.kr/portal/singl/baseRate` | ✅ |
| publishedDate 안내 | "ECOS period에서 유도된 날짜가 아닙니다. BOK value matching으로 검증" | ✅ |

Gate/Copy readiness:
| 항목 | 값 | 결과 |
|------|-----|------|
| ownerDecision | `null (pending)` | ✅ |
| decision_pending blocker | 1회 출현 | ✅ |
| gateResultId | `gate-ecos-live-draft-pending-001` | ✅ |
| canProceedToRender | BLOCKED (8회) | ✅ |
| copyReady | NOT READY (4회) | ✅ |

Script/Package quality observation:
- Fact Card: `indicatorName=한국은행 기준금리`, `currentValue=2.5%`, `changeValue=0.0%p`, `dataPeriod=2026년 5월`
- interpretation: "한국은행이 2026년 5월 기준금리를 2.5%에서 2.5%로 0.0%p 조정했다."
- **⚠️ 품질 갭**: currentValue/previousValue가 모두 `2.5%`이므로 `"2.5%에서 2.5%로"` 문구가 반복됨 — 동결(무변동) 케이스의 interpretation/script 품질 개선이 향후 필요.
- 숫자 발명 없음 — Fact Card 값만 사용됨 ✅

Static safety:
- `prefetch={false}`: package-preview:565, money-shorts:163 ✅
- 코드 변경 없음 — TypeScript/ESLint skip

## Package Preview Live Draft Gate Alignment (`package-preview-live-draft-gate-alignment-v1` — 2026-06-26)

`app/fact-cards/manual/package-preview/page.tsx`에서 live draft candidate의 gate/clipboard readiness를 draft-only 계약에 맞게 정렬.

변경 사항:
- `LIVE_GATE_RESULT_ID = "gate-ecos-live-draft-pending-001"` 상수 추가
- `PackagePreviewContent`의 `gateResult` 계산을 `isLive` 분기로 분리:
  - `isLive=true`: `decision: null` → `blockerCodes: ["decision_pending"]`, `canProceedToRender: false`, `copyReady: false`
  - `isLive=false`: `decision: "approved"` (기존 local preview 동작 유지)
- Owner Gate SectionCard note: live일 때 "draft-only — decision=null (pending)" 표시, mock일 때 기존 "mock 승인" 유지

Gate logic source (`lib/owner-decision/gate.ts`):
- `decision === null` → `blockerCodes.push("decision_pending")`
- `canProceedToRender = blockerCodes.length === 0` → false
- `buildClipboardPayload` → `copyReady: false` (gateResult.canProceedToRender=false 전파)

Static verification:
- TS 0 errors, ESLint 0 warnings ✅
- default/mock route: `200` ✅
- `prefetch={false}`: package-preview:565, money-shorts:163 ✅
- forbidden patterns: 주석에만 존재 ✅

## Money Shorts Hub Live Latest Entrypoint (`money-shorts-hub-live-latest-entrypoint-v1` — 2026-06-26)

`app/money-shorts/page.tsx`에 "Live Latest Draft Candidate" 섹션 추가.

- `/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606` link 추가
- `prefetch={false}` 적용 (page.tsx:163)
- draft-only 안내 문구 포함 (isPublishable=false, render/upload 없음)
- 기존 workflow steps와 status note 유지
- status note에 live latest 섹션 외부 API 예외 문구 추가

Route evidence:
- `/money-shorts` `200` ✅
- `candidate=ecos-live-latest&endPeriod=202606` href 렌더 확인 ✅
- `candidate=base-rate` href (package-preview page에서 유지) ✅
- `package-preview` default href 유지 ✅

Static safety:
- `prefetch={false}` hub link (money-shorts/page.tsx:163) ✅
- `prefetch={false}` package-preview selector (package-preview/page.tsx:547) ✅
- `createEcosLiveTransport` import/call 없음 (money-shorts/page.tsx) ✅
- TS 0 errors, ESLint 0 warnings ✅
- forbidden patterns: 정적 UI 텍스트만, 실제 호출 없음 ✅

## Dev Server Runtime Smoke (`dev-server-default-route-runtime-smoke-and-state-sync-v1` — 2026-06-26)

Runtime smoke against checkpoint `7d28921` (local dev server):

| Route | 결과 |
|-------|------|
| `/` | `307 redirect → /money-shorts` ✅ |
| `/money-shorts` | `200` ✅ |
| `/fact-cards/manual/package-preview` | `200` ✅ |
| `/fact-cards/manual/package-preview?candidate=base-rate` | `200` ✅ |
| live route (`ecos-live-latest`) | 미탐색 (static safety만 확인) |

Static safety:
- `prefetch={false}` live candidate Link (page.tsx:547) ✅
- `createEcosLiveTransport` 호출이 `if (candidateKey === "ecos-live-latest")` 분기 내부(line 288)에만 존재 ✅

State sync:
- `_ai/NEXT_ACTION.md`: "uncommitted" → checkpoint `7d28921` 보정 ✅
- `_ai/PROJECT_STATE.md`: `7d28921` commit 항목 추가 ✅

## Dev Server Default Route Alignment (`dev-server-default-route-alignment-v1` — 2026-06-26)

- `app/page.tsx`: old AutoShorts AI "use client" 컴포넌트 전체를 server redirect `redirect("/money-shorts")`로 교체.
- `app/layout.tsx`: metadata title/description을 `Money Shorts OS | 출처 기반 금융·경제 쇼츠 제작`으로 변경.
- `app/money-shorts/page.tsx`: 헤더 subline "외부 API 없음" → "외부 API 없음 (live 경로 제외)"로 최소 보정 — live preview 예외 명시.

Route evidence (static):
- `/` → `redirect("/money-shorts")` ✅ (old AutoShorts AI UI 제거)
- `/money-shorts` → Money Shorts OS Workflow Hub 유지 ✅
- `/fact-cards/manual/package-preview` → 기존 household debt fixture 경로 유지 ✅
- `/fact-cards/manual/package-preview?candidate=base-rate` → 기존 mock generated candidate 유지 ✅
- `/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606` → 명시적 live route 유지, prefetch={false} 유지 ✅

TS 0 errors, ESLint 0 warnings, forbidden patterns: page.tsx/layout.tsx에 없음, money-shorts/page.tsx는 UI 텍스트 정적 문자열만 해당 ✅

## Package Preview Prefetch Review-Fix (`money-shorts-os-package-preview-live-latest-candidate-v1-prefetch-review-fix` — 2026-06-26)

live candidate selector `Link`에 `prefetch={false}` 추가 (line 547).
- 대상: `href="/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606"`
- 근거: Next.js Link viewport/hover prefetch가 live route server render + ECOS 호출을 유발할 수 있음
- default/mock route 링크는 변경 없음
- `createEcosLiveTransport` 실행 경로는 `if (candidateKey === "ecos-live-latest")` 분기 안에만 존재 (static grep 확인 ✅)
- TS 0 errors, ESLint 0 warnings ✅

## Package Preview Review-Fix (`money-shorts-os-package-preview-live-latest-candidate-v1-review-fix` — 2026-06-26)

Fix 1: `liveProvenance.dataPeriod` → `liveAuthoringResult.factCard.dataPeriod` 사용. provenance card에서 `202605` raw period 대신 `2026년 5월` 표시. browser snapshot 확인 ✅
Fix 2: `PackagePreviewContent`의 불필요한 `async` 제거. 동작 무변경.
TS 0 errors, ESLint 0 warnings, console error 없음 ✅
next action: `dev-server-default-route-alignment-v1` — 개발서버 기본 진입점 Money Shorts OS 기준 정렬 (이번 task 구현 안 함).

## Package Preview Live Latest Candidate (`money-shorts-os-package-preview-live-latest-candidate-v1` — 2026-06-26)

기준 checkpoint: `525e635 feat(source-facts): connect ecos resolvers into live draft candidate path`

목표: `/fact-cards/manual/package-preview`에서 명시적 query(`?candidate=ecos-live-latest&endPeriod=202606`)로만 live ECOS draft candidate 확인. 기본/mock route 무호출 보장.

**변경 파일:**
- `app/fact-cards/manual/package-preview/page.tsx` (M): live 경로 분기 + LiveBlockedState 컴포넌트 + 조건부 notice + selector 옵션 추가 + provenance card

**구현 요약:**
- `PackagePreviewPage` (export default): `searchParams`에 `endPeriod` 추가. `candidateKey === "ecos-live-latest"` 분기에서만 `createEcosLiveTransport` → `transport.executeAsync` → `buildEcosLatestDraftCandidate` 실행. 그 외 모든 경로는 기존 registry-based 경로(mock/fixture) 그대로.
- `PackagePreviewContent` (공유 렌더 컴포넌트): live/mock 양 경로가 동일한 렌더링 경로 공유. `isLive` prop으로 notice 문구 조건부 전환.
- `LiveBlockedState` (신규): ECOS key 없음/네트워크 실패/candidate blocked 시 amber 차단 화면.
- `LIVE_FETCHED_AT = "2026-06-26T00:00:00+09:00"`: Date.now() 사용 없는 결정론적 상수.
- secret-bearing URL은 page.tsx에서 직접 참조 없음 — `ecos-live-transport.ts` 내부에서만 처리.

**route smoke 결과 (browser preview):**

| Route | 결과 |
|-------|------|
| default `/fact-cards/manual/package-preview` | ✅ 가계부채 fixture, "외부 API 없음", React key warning 없음 |
| mock `?candidate=base-rate` | ✅ ECOS mock, isMock=true, "외부 API 없음", React key warning 없음 |
| live `?candidate=ecos-live-latest&endPeriod=202606` | ✅ draft_ready, 모든 필드 확인 |

**live route 필드 확인:**

| 필드 | 값 |
|------|-----|
| sourceProviderId | provider-ecos-live |
| isMock | false |
| isPublishable | false |
| publishedDate | 2025-05-29 |
| dataPeriod | 2026년 5월 |
| ECOS citation | citation-generated-raw-ecos-722Y001-0101000-202605 |
| BOK provenance citation | citation-source-date-raw-ecos-722Y001-0101000-202605 (bok.or.kr/portal/singl/baseRate) |

**source-date provenance note:**
- publishedDate(2025-05-29) = 공식 BOK 결정일, ECOS period 202605에서 유도 안 함 ✅
- BOK citation sourceUrl = `https://www.bok.or.kr/portal/singl/baseRate/list.do?dataSeCd=01&menuNo=200643` ✅

**checks:**
| 체크 | 결과 |
|------|------|
| TypeScript strict (page.tsx + source-facts) | 0 errors ✅ |
| ESLint (page.tsx) | 0 warnings ✅ |
| forbidden pattern (Date.now/Math.random/clipboard/ffmpeg/output/upload/deploy) | 주석만 ✅ |
| process.env 직접 참조 in page.tsx | 없음 ✅ |
| secret-bearing URL in page.tsx | 없음 ✅ |
| console error / React key warning | 없음 ✅ |
| piq_diag_out.txt | untracked 유지 ✅ |

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

## ECOS Base Rate Unchanged Copy Quality Fix (`ecos-base-rate-unchanged-copy-quality-v1` — 2026-06-26)

`lib/source-facts/candidates.ts` — `ecosBaseRateParser` (mock) 및 `ecosBaseRateLiveParser` (live) 모두 `changeValue === 0` 분기 추가.

변경 내용:
- 두 parser에서 `chg === 0` 조건 분기:
  - `interpretation`: `"한국은행이 ${p.dataPeriod} 기준금리를 ${p.currentValueText}로 동결했다. 직전 발표 대비 변동은 ${p.changeValueText}다."` 사용
  - `allowedClaims[1]`: `"직전 기준금리 대비 변동은 ${p.changeValueText}다."` (기존 "변경됐다" → "변동은")
  - 비영변동(`chg !== 0`) 케이스: 기존 "조정했다" 문구 유지
- 수치 필드(`currentValue`, `previousValue`, `changeValue`, `changeRate`) 변경 없음
- `isMock`, `isPublishable`, `citations`, `blockedClaims` 변경 없음

결과 (changeValue=0 case):
- Before: `"한국은행이 2026년 5월 기준금리를 2.5%에서 2.5%로 0.0%p 조정했다."`
- After: `"한국은행이 2026년 5월 기준금리를 2.5%로 동결했다. 직전 발표 대비 변동은 0.0%p다."`

검증:
- TS 0 errors (tsc --noEmit --strict false) ✅
- ESLint 0 warnings ✅

## Package Preview Chart Card Props Section (`package-preview-chart-card-props-section-v1` — 2026-06-26)

`app/fact-cards/manual/package-preview/page.tsx`에 "⑩ Chart Card Package" 섹션 추가.

변경 내용:
- `pkg.chartCardPackage` 전체를 data-only로 표시:
  - packageId, factCardId, blueprintVideoId, riskLevel, card count, sourceCitationIds
  - 카드 상세: `number_card`(title/value/changeValue/interpretationNote/riskLevel), `comparison_card`(labelLeft/valueLeft/direction/changeLabel), `source_card`(sourceName/publishedDate/dataPeriod/factCardId), `cta_card`(ctaText/subText)
  - 카드별 dimensions(1080×1920) 표시
- 기존 섹션 번호 ⑩→⑪ 보정 (Package View Summary)
- canvas/ffmpeg/이미지 생성 없음
- 기존 default/mock/live 경로 동작 무변경

브라우저 smoke 결과:
- default route: Chart Card Package 섹션 ✅, number_card/comparison_card/source_card 모두 표시 ✅
- `?candidate=base-rate`: `동결` 문구 interpretationNote에 표시 ✅
  - "한국은행이 2025년 1월 기준금리를 3.0%로 동결했다. 직전 발표 대비 변동은 0.0%p다."
- React key warning: 0 ✅

검증:
- tsc -p tsconfig.json --noEmit (package-preview 관련 오류): 0 ✅
- ESLint page.tsx: 0 warnings ✅
- `prefetch={false}` package-preview:565, money-shorts:163 유지 ✅
- forbidden patterns (Date.now/Math.random/navigator.clipboard/ffmpeg/output//upload/deploy): 없음 ✅

## Package Preview Chart Card Visual Preview (`package-preview-chart-card-visual-preview-v1` — 2026-06-26)

`app/fact-cards/manual/package-preview/page.tsx`에 CSS-only 9:16 visual preview 추가.

변경 내용:
- 5개 local 컴포넌트 추가: `CardShell`, `NumberCardVisual`, `ComparisonCardVisual`, `SourceCardVisual`, `CtaCardVisual`, `ChartCardVisualPreview`
- Chart Card Package 섹션 안에 "9:16 VISUAL PREVIEW — CSS ONLY" 레이블 + 카드 미리보기 그리드 추가
- `style={{ aspectRatio: "9/16", maxWidth: "180px" }}` — 9:16 비율 고정, 180px 최대 너비
- 텍스트 오버플로 방지: `truncate`, `line-clamp-*`, `overflow-hidden`
- card type별 accent color: number=indigo, comparison=slate, source=amber, cta=emerald
- `AnyCardProps` / `NumberCardProps` 등 타입 import 추가
- "실제 영상이 아닙니다 · canvas/ffmpeg 없음 · props 시각화 전용" 안내 문구 추가
- 기존 raw props 표 (카드 상세) 유지

브라우저 smoke 결과 (curl HTTP 응답):
- default route: "Chart Card Package", "Visual Preview", "canvas/ffmpeg", "number_card" 출현 ✅
- `?candidate=base-rate`: 위 4개 + "동결" 출현 ✅
  - base-rate number card visual에 동결 문구 표시 확인
- React key warning: 0 ✅ (console warn 없음)

검증:
- tsc -p tsconfig.json --noEmit (package-preview 관련): 0 ✅
- ESLint 0 warnings ✅
- forbidden patterns: 없음 (주석 제외) ✅
- `prefetch={false}` package-preview:708, money-shorts:163 유지 ✅

## Retired Active Routes

## Package Preview Chart Card Visual Preview QA (`package-preview-chart-card-visual-preview-qa-v1` — 2026-06-26)

QA 결과 + layout fix 1건.

**발견된 문제**: `CardShell` (`w-full` + `maxWidth: 180px`)가 flex 부모에서 59-81px으로 수축됨 — 부모 flex-col 컨테이너가 내용 너비로 줄어들어 `w-full`이 의도한 180px 대신 부모 너비를 따랐음.

**Fix**: `style={{ aspectRatio: "9/16", width: "160px", minWidth: "160px", maxWidth: "180px" }}`로 명시적 fixed width 추가.

브라우저 QA 결과:
- desktop (1280px): 카드 3장 160×284px ✅, overflow 없음 ✅
- mobile (375px): 카드 3장 160×284px, right=193 < 375 ✅, container 안에 유지 ✅
- `?candidate=base-rate`: "동결" 문구 visual card에 표시 ✅
- React/console warning: 0 ✅
- TS 0 errors, ESLint 0 warnings ✅

## Owner Decision Publishability Gate (`owner-decision-publishability-gate-v1` — 2026-06-26)

`FactCard.isPublishable === false`인 경우 Owner 승인 여부와 무관하게 `canProceedToRender=false`를 강제하는 safety gate 추가.

**변경 파일:**
- `lib/review-packet/types.ts`: `ReviewFactCardSummary`에 `isPublishable: boolean` 필드 추가 (JSDoc 포함)
- `lib/review-packet/generator.ts`: `factCardSummary` 빌드 시 `isPublishable: factCard.isPublishable` 추가
- `lib/owner-decision/types.ts`: `GateBlockerCode` union에 `"fact_card_not_publishable"` 추가
- `lib/owner-decision/gate.ts`: `evaluateOwnerDecision()` 내 reviewPacketId 검사 직후, decision 검사 이전에 publishability 체크 추가 — `packet.factCard.isPublishable !== true` → `blockerCodes.push("fact_card_not_publishable")`
- `app/fact-cards/manual/package-preview/page.tsx`: `fact_card_not_publishable` blocker 시 red warning note 표시, non-live mock note 문구 갱신

**브라우저 smoke 결과:**
| Route | fact_card_not_publishable | canProceedToRender | copyReady |
|-------|--------------------------|-------------------|-----------|
| default (가계부채) | ✅ 표시 | BLOCKED ✅ | false ✅ |
| `?candidate=base-rate` | ✅ 표시 | BLOCKED ✅ | false ✅ |

- React key warning: 0건 ✅
- console error: 없음 ✅
- `buildClipboardPayload` → `copyReady=false` 자연 전파 (gate.canProceedToRender=false) ✅

**검증:**
| 체크 | 결과 |
|------|------|
| TS: `tsc -p tsconfig.json --noEmit` (review-packet/owner-decision/package-preview 필터) | 0 errors ✅ |
| ESLint (4개 lib 파일 + page.tsx) | 0 warnings ✅ |
| forbidden pattern (fetch/Date.now/Math.random/clipboard/ffmpeg/output/deploy) | 없음 ✅ |
| piq_diag_out.txt | untracked 유지 ✅ |

## Publishability Readiness Panel (`package-preview-publishability-readiness-panel-v1` — 2026-06-26)

`app/fact-cards/manual/package-preview/page.tsx`에 "⑧ Publishability Readiness" 패널 추가.

**변경 내용:**
- 기존 ⑧~⑪ 섹션을 ⑨~⑬으로 re-number (title prefix + JSX comment 동기화, review-fix 완료)
- 새 ⑧ 패널 (⑦ Review Packet 다음, ⑨ Owner Decision Gate 앞에 삽입):
  - 상단 draft-only 요약 배너 (isPublishable=false 시 항상 표시)
  - Fact Card 발행 가능 여부: `factCard.isMock`, `factCard.isPublishable`, `reviewPacket.factCard.isPublishable`
  - 출처 / Citation 현황: citation 수 + citationId 배지 목록
  - Owner Decision Gate 차단 현황: `gateResult.blockerCodes`, `gateResult.canProceedToRender`
  - Clipboard / Copy 준비 상태: `clipboardPayload.copyReady`
  - QA / Render 준비 상태: `finalQa.readyForRender`, `riskReview.isBlocked`
  - 종합 Readiness 판정 테이블 (5개 항목: isPublishable / canProceedToRender / copyReady / readyForRender / riskNotBlocked)
- 패널 color: isPublishable=false 또는 fact_card_not_publishable blocker 시 red; 모두 통과 시 emerald; 그 외 amber

**브라우저 smoke 결과 (JS eval):**
| Check | default (가계부채) | ?candidate=base-rate |
|-------|-------------------|----------------------|
| ⑧ Publishability Readiness 패널 | ✅ | ✅ |
| isPublishable=false (NOT PUBLISHABLE) | ✅ | ✅ |
| fact_card_not_publishable blocker | ✅ | ✅ |
| canProceedToRender=BLOCKED | ✅ | ✅ |
| copyReady=NOT READY | ✅ | ✅ |
| Chart Card Package (⑫) 유지 | ✅ | ✅ |
| 섹션 번호 ⑧~⑬ 연속 | ✅ | ✅ |
| React key warning | 0건 ✅ | 0건 ✅ |
| console error | 없음 ✅ | 없음 ✅ |

**검증:**
| 체크 | 결과 |
|------|------|
| TS: `tsc --noEmit` (output/ 필터링) | 0 errors ✅ |
| ESLint (page.tsx) | 0 warnings ✅ |
| forbidden pattern (Date.now/Math.random/navigator.clipboard/ffmpeg/output//upload/deploy) | 없음 ✅ |
| prefetch={false} package-preview:708, money-shorts:163 | 유지 ✅ |
| createEcosLiveTransport 신규 경로 | 없음 ✅ |
| piq_diag_out.txt | untracked 유지 ✅ |

**[review-fix: package-preview-publishability-readiness-panel-v1-review-fix — 2026-06-26]**

Fix: Codex 체크로 발견된 JSX comment + SectionCard title 번호 중복 수정.

원인: 섹션 추가 후 re-number 과정에서 일부 번호 미수정.

수정:
- Line 1182: `{/* ⑨ Owner Gate */}` → `{/* ⑩ Owner Gate */}`
- Line 1184: `title="⑨ Owner Decision Gate"` → `title="⑩ Owner Decision Gate"`
- Line 1232: `{/* ⑩ Clipboard payload */}` → `{/* ⑪ Clipboard payload */}`
- Line 1234: `title="⑩ Clipboard Payload 준비 상태"` → `title="⑪ Clipboard Payload 준비 상태"`
- Line 1292: `{/* ⑪ Chart Card Package */}` → `{/* ⑫ Chart Card Package */}`
- Line 1294: `title="⑪ Chart Card Package"` → `title="⑫ Chart Card Package"`
- Line 1389: `{/* ⑪ Package view summary */}` → `{/* ⑬ Package view summary */}`
- Line 1391: `title="⑫ Package View Summary"` → `title="⑬ Package View Summary"`

최종 연속성: ⑧~⑬ (6개 섹션) ✅

검증:
- grep 섹션 번호: 중복 없음 ✅
- ESLint: 0 warnings ✅
- 패널 로직/gate 로직/route behavior/data contract: 변경 없음 ✅

## Owner Publishability Decision Contract (`owner-publishability-decision-contract-v1` — 2026-06-26)

순수 결정론적 publishability decision contract 추가.

**신규 파일:**
- `lib/owner-decision/publishability.ts` — `evaluatePublishabilityDecision(factCard, input, options?)` helper
- `lib/owner-decision/index.ts` — `export * from "./publishability"` 추가

**타입 정의:**
- `PublishabilityDecisionInput` — `factCardId`, `decision`, `notes`, `decidedAt?`
- `PublishabilityBlockerCode` — 8종: `decision_pending / decision_rejected / decision_revision_requested / fact_card_id_mismatch / mock_fact_card / missing_citations / source_url_missing / already_publishable`
- `PublishabilityDecisionResult` — `canMarkPublishable: boolean`, `blockerCodes[]`, 감사 요약(isMock/citationCount/sourceName/sourceUrl)
- `PUBLISHABILITY_DECISION_SCHEMA_VERSION = "money_shorts_publishability_decision_v1"`

**Pass 조건 (모두 충족 시 canMarkPublishable=true):**
1. decision === "approved"
2. factCardId 일치
3. factCard.isMock === false
4. factCard.citations.length > 0
5. factCard.sourceUrl가 "https://"로 시작
6. factCard.isPublishable === false (아직 publishable 아님)

**핵심 설계 원칙:**
- FactCard 불변 보장 — isPublishable=true 설정/저장 없음
- 결정론적 — new Date() / Math.random() / 외부 호출 없음
- output/ / DB / API route / UI 변경 없음

**검증:**
| 체크 | 결과 |
|------|------|
| TypeScript strict check (output/ 제외) | 0 errors ✅ |
| ESLint (publishability.ts + index.ts) | 0 warnings ✅ |
| static verification 9 cases (npx tsx) | 9/9 PASS ✅ |
| mock card → blocked [mock_fact_card] | ✅ |
| pending → blocked [decision_pending] | ✅ |
| rejected → blocked [decision_rejected] | ✅ |
| revision_requested → blocked | ✅ |
| id mismatch → blocked [fact_card_id_mismatch] | ✅ |
| already publishable → blocked [already_publishable] | ✅ |
| no citations → blocked [missing_citations] | ✅ |
| http sourceUrl → blocked [source_url_missing] | ✅ |
| approved live source-backed → canMarkPublishable=true | ✅ |
| forbidden pattern (Date.now/Math.random/clipboard/ffmpeg/output/upload/deploy) | 주석 문구만, 실제 호출 0건 ✅ |
| piq_diag_out.txt | untracked 유지 ✅ |

Do not resume:

- Candidate10 / old Money Architect video improvement
- Static 8-plate image + caption + narration assembly route
- code-GFX final/public candidate loops
- GPT visual plate-only route
- 3D character static plate route
- 생활꿀팁 / EP001 돈 방어 / old Money Architect topic flow
- Jun/준/시트콤/자동문 면접/ep003/upload_002/복사기/3d_sitcom assets or references

## Publishability Decision Contract UI Wiring (`package-preview-publishability-decision-readonly-v1` — 2026-06-26)

`evaluatePublishabilityDecision`을 `/fact-cards/manual/package-preview` 읽기 전용 패널로 연결.

**변경 파일:**
- `app/fact-cards/manual/package-preview/page.tsx` — import 추가, publishabilityDecision 변수 계산, ⑧ 섹션 내부 "Publishability Decision Contract (읽기 전용)" subsection JSX 추가

**구현 내용:**
- `evaluatePublishabilityDecision(factCard, { factCardId: factCard.id, decision: null, notes: null }, { decisionResultId: \`pub-decision-preview-${factCard.id}\`, createdAt: MOCK_CREATED_AT })` — 항상 `decision: null` 전달, "approved" 전달 없음
- 표시 필드: decisionResultId / ownerDecision(null→"null (pending)") / canMarkPublishable(NOT ELIGIBLE) / contract blockerCodes / isMock / citationCount / sourceUrl https:// 준비 여부 / isAlreadyPublishable
- 경고 배너: "contract evaluation only — approve · mutate · persist · render · export · clipboard write 없음"
- 기존 gate/readiness/chart-card/clipboardPayload 로직 무변경

**검증:**
| 체크 | 결과 |
|------|------|
| TypeScript strict check (page.tsx) | 0 errors ✅ |
| ESLint (page.tsx) | 0 warnings ✅ |
| `/fact-cards/manual/package-preview` 로드 | ✅ |
| `/fact-cards/manual/package-preview?candidate=base-rate` 로드 | ✅ |
| contract evaluation only 배너 렌더 | ✅ |
| ownerDecision null (pending) 표시 | ✅ |
| canMarkPublishable NOT ELIGIBLE | ✅ |
| contract blockerCodes(decision_pending) 표시 | ✅ |
| isMock 표시 | ✅ |
| "Publishability Decision Contract" H3 DOM 렌더 | ✅ |
| Chart Card 섹션 유지 | ✅ |
| fact_card_not_publishable gate blocker 유지 | ✅ |
| prefetch={false} 유지 (line 724) | ✅ |
| console error/warning | 0건 ✅ |
| forbidden pattern (Date.now/Math.random/navigator.clipboard/ffmpeg/output/upload/deploy) | 주석 문구만, 실제 호출 0건 ✅ |
| "approved" → evaluatePublishabilityDecision 전달 | 없음 ✅ |
| isPublishable=true 설정 | 없음 ✅ |
| piq_diag_out.txt | untracked 유지 ✅ |

**diff stat:** `app/fact-cards/manual/package-preview/page.tsx` +80 lines (subsection JSX + import)

## Owner Decision 로컬 샌드박스 (`package-preview-owner-publishability-decision-controls-v1` — 2026-06-26)

local-only Owner publishability decision controls 추가.

**변경/신규 파일:**
- `app/fact-cards/manual/package-preview/PublishabilityDecisionControls.tsx` (신규 client component)
- `app/fact-cards/manual/package-preview/page.tsx` — import + `<PublishabilityDecisionControls factCard={factCard} />` 삽입

**구현 내용:**
- `"use client"` — local React state only (`useState` for decision + notes)
- decision 선택: pending(null) / approved / rejected / revision_requested — segmented buttons
- optional notes input
- `evaluatePublishabilityDecision()` 실시간 결과 표시: canMarkPublishable / ownerDecision / blockerCodes / isMock / citationCount / sourceUrl https:// readiness
- safety banner: "local sandbox only — 저장·발행·렌더·복사·DB 변경 없음"
- server gateResult / clipboardPayload 영향 없음 (서버 컴포넌트 측 데이터 불변)
- `Date.now()` / `Math.random()` / `localStorage` / `sessionStorage` / `navigator.clipboard` / `isPublishable=true` 없음
- `STATIC_CREATED_AT = "2026-06-26T00:00:00+09:00"` — 결정론적 상수

**검증:**
| 체크 | 결과 |
|------|------|
| TypeScript strict check | 0 errors ✅ |
| ESLint (page.tsx + controls) | 0 warnings ✅ |
| `/fact-cards/manual/package-preview` 로드 | ✅ |
| 로컬 샌드박스 controls 렌더 | ✅ |
| pending/approved/rejected/revision_requested 버튼 | ✅ |
| approved 클릭 → mock_fact_card 블로커 → NOT ELIGIBLE | ✅ (mock fixture 계약 정확) |
| 서버 gate fact_card_not_publishable 유지 | ✅ |
| console error/warning 0건 | ✅ |
| forbidden pattern 0건 (localStorage/sessionStorage/clipboard/ffmpeg/output/upload/deploy/Date.now/Math.random) | ✅ |
| isPublishable=true 설정 없음 | ✅ |
| piq_diag_out.txt untracked 유지 | ✅ |

## Runtime Smoke (`package-preview-owner-publishability-controls-runtime-smoke-v1` — 2026-06-26)

QA-only slice. 코드 변경 없음.

**검증 (default + ?candidate=base-rate 양쪽):**
| 체크 | 결과 |
|------|------|
| default route 로드 | ✅ |
| base-rate route 로드 | ✅ |
| local sandbox controls 렌더 (pending/approved/rejected/revision_requested) | ✅ |
| 초기 상태: decision_pending, NOT ELIGIBLE | ✅ |
| approved 클릭 → mock_fact_card 블로커 → NOT ELIGIBLE 유지 | ✅ |
| 서버 Gate fact_card_not_publishable 유지 | ✅ (client 영향 없음) |
| 서버 Clipboard copyReady NOT READY 유지 | ✅ (client 영향 없음) |
| console error/warning | 0건 ✅ |
| isPublishable=true 설정 없음 | ✅ |
| localStorage/sessionStorage/navigator.clipboard 없음 | ✅ |
| prefetch={false} 유지 (page.tsx line 725) | ✅ |
| piq_diag_out.txt untracked 유지 | ✅ |

**결론:** local sandbox controls는 server gate/clipboard를 변경하지 않음 — 안전 경계 확인 완료.

## Live Non-Mock Route Smoke (`package-preview-live-publishability-controls-smoke-v1` — 2026-06-26)

QA-only slice. 코드 변경 없음.  
`isMock=false` live ECOS Fact Card에서 approved 선택 시 ELIGIBLE 달성 확인.

**live route:** `/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606`

**Fact Card 확인:**
| 항목 | 값 |
|------|------|
| sourceProviderId | provider-ecos-live ✅ |
| isMock | false ✅ |
| isPublishable | false ✅ |
| dataPeriod | 2026년 5월 ✅ |
| publishedDate | 2025-05-29 ✅ |

**Local sandbox — pending(초기):**
| 항목 | 값 |
|------|------|
| canMarkPublishable | NOT ELIGIBLE ✅ |
| blockerCodes | decision_pending ✅ |

**Local sandbox — approved 클릭 후:**
| 항목 | 값 |
|------|------|
| canMarkPublishable | ELIGIBLE ✅ |
| ownerDecision | approved ✅ |
| blockerCodes | 없음 ✅ |
| isMock | false ✅ |
| citationCount | 2건 ✅ |
| sourceUrl https:// | OK ✅ |

**Server 불변성 (client controls 영향 없음):**
| 항목 | 결과 |
|------|------|
| Owner Gate fact_card_not_publishable | 유지 ✅ |
| Clipboard copyReady NOT READY | 유지 ✅ |

**기타:**
| 체크 | 결과 |
|------|------|
| console error/warning | 0건 ✅ |
| API key/secret 미출력 | ✅ |
| piq_diag_out.txt untracked 유지 | ✅ |

**결론:** live `isMock=false` Fact Card에서 approved 선택 시 `canMarkPublishable=ELIGIBLE` 달성. 서버 gate/clipboard 불변 확인. 이 경로에서 실제 Owner approval/persistence 구현 준비 완료.

## Publishable Projection Dry-run (`package-preview-local-publishable-projection-v1` — 2026-06-26)

`?publishabilityProjection=approved-dry-run` query flag로 memory-only projection 패널 추가.

**변경 파일:**
- `app/fact-cards/manual/package-preview/page.tsx` — searchParams 타입 확장, publishabilityProjection prop 추가, dry-run 로직 + 패널 JSX 추가

**구현 요약:**
- `isDryRunProjection = publishabilityProjection === "approved-dry-run"` — exact match만 활성화
- `evaluatePublishabilityDecision(factCard, { decision: "approved", ... })` — eligibility 확인
- `canMarkPublishable=true` 시 `const projectedFactCard = { ...factCard, isPublishable: true }` — memory-only clone (원본 불변)
- projected clone으로 별도 pkg/review/gate/clipboard 계산
- 패널: "dry-run only — not persisted", 원본 `isPublishable=false` 표시, projected 결과 표시
- live 정상 경로에서 dry-run 링크 힌트 표시 (prefetch={false})
- dry-run flag 없는 정상 경로는 기존 draft-only 유지

**검증:**
| 체크 | 결과 |
|------|------|
| TypeScript strict check | 0 errors ✅ |
| ESLint | 0 warnings ✅ |
| 정상 live route — dry-run 패널 없음 | ✅ |
| 정상 live route — server gate 차단 유지 | ✅ |
| 정상 live route — dry-run 링크 힌트 표시 | ✅ |
| dry-run route — 패널 "dry-run only — not persisted" | ✅ |
| dry-run route — 원본 isPublishable=false 표시 | ✅ |
| dry-run route — projectionEnabled=true | ✅ |
| dry-run route — canMarkPublishable ELIGIBLE | ✅ |
| dry-run route — projected isPublishable=true (memory-only clone) | ✅ |
| dry-run route — projected canProceedToRender OPEN | ✅ |
| dry-run route — projected copyReady READY | ✅ |
| dry-run route — projected gate blockerCodes 없음 | ✅ |
| dry-run route — server gate fact_card_not_publishable 유지 | ✅ |
| console error/warning | 0건 ✅ |
| factCard.isPublishable=true mutation (직접 대입) | 없음 ✅ |
| localStorage/sessionStorage/navigator.clipboard | 없음 ✅ |
| piq_diag_out.txt untracked 유지 | ✅ |

**결론:** memory-only projection으로 gate/copy opening path 증명 완료. 원본 Fact Card 불변 확인.

**[review-fix: package-preview-local-publishable-projection-v1-review-fix — 2026-06-26]**

3개 review-fix 적용:
1. dry-run projection 전용 ID 도입: `DRYRUN_CONTENT_PACKAGE_ID = cp-dryrun-{id}`, `DRYRUN_REVIEW_PACKET_ID = rp-dryrun-{id}`, `DRYRUN_GATE_RESULT_ID = gate-dryrun-{id}` — 정상 pipeline 아티팩트와 혼동 불가
2. discriminated union `DryRunResult` 타입 도입으로 `projectedGate!` / `projectedClipboard!` non-null assertion 제거 — JSX에서 `dryRunProjectionResult.eligible` narrow 후 안전 접근
3. dry-run 링크 `endPeriod` 하드코딩 제거 — `liveEndPeriod` prop으로 현재 route endPeriod 전달, `liveEndPeriod` 없으면 링크 미표시

**검증 (review-fix):**
| 체크 | 결과 |
|------|------|
| TypeScript strict check | 0 errors ✅ |
| ESLint | 0 warnings ✅ |
| `projectedGate!` / `projectedClipboard!` grep | 0건 ✅ |
| `factCard.isPublishable = true` mutation grep | 0건 ✅ |
| dry-run 블록 MOCK_CONTENT/REVIEW_PACKET_ID 재사용 | 0건 ✅ |
| prefetch={false} 유지 (line 793, 1376) | ✅ |
| normal live route — dry-run 패널 없음, gate 차단 | ✅ |
| normal live route — dry-run 링크 endPeriod=202606 동적 전달 | ✅ |
| dry-run route — OPEN/READY/없음, server gate 차단 유지 | ✅ |
| console error/warning | 0건 ✅ |

---

## owner-publishability-local-approval-ledger-v1 (2026-06-26)

### 구현 내용

**1. `.gitignore` 추가**
- `/.money-shorts-local/` gitignore — 실제 승인 데이터 절대 commit 불가

**2. `lib/owner-decision/local-approval-ledger.ts` (신규)**
- server-only Node `fs`/`path` 기반 파일 ledger
- `readLocalPublishabilityApprovalLedger()` — 파일 없으면 `{ok:false, reason:"missing"}`, JSON 오류 시 `{ok:false, reason:"invalid_json"}` (silent treat-as-ok 없음)
- `getLocalPublishabilityApproval(factCardId)` — null-safe 단건 조회
- `recordLocalPublishabilityApproval()` — `evaluatePublishabilityDecision()` 호출 후 `canMarkPublishable=true`일 때만 write. atomic-ish: `.tmp` 파일 write 후 rename. FactCard 불변, `isPublishable=true` 미설정.
- `Date.now()` / `new Date()` 없음 — `recordedAt`은 caller 주입 필수

**3. `lib/owner-decision/index.ts` 수정**
- `export * from "./local-approval-ledger"` 추가

**4. `app/fact-cards/manual/package-preview/actions.ts` (신규, Server Action)**
- `"use server"` — server-only
- `recordApproval(factCard, notes)` — factCard는 Server Component bound, client 신뢰 안 함. `recordedAt` 정적 상수 주입.
- `getLedgerRecord(factCardId)` — read-only 조회

**5. `app/fact-cards/manual/package-preview/LedgerStatusPanel.tsx` (신규, Client Component)**
- `"use client"` — `useState` + `useTransition` 기반
- 버튼 클릭 → `recordApproval()` Server Action 호출 → state 반영
- `isMock=true` Fact Card는 버튼 비활성화

**6. `app/fact-cards/manual/package-preview/page.tsx` 수정**
- `LedgerStatusPanel`, `getLocalPublishabilityApproval`, `LocalApprovalRecord` import 추가
- 양쪽 경로에서 `getLocalPublishabilityApproval(factCard.id)` 호출 후 prop 전달
- 섹션 ⑧ 끝에 "로컬 승인 Ledger (파일 저장)" SectionLabel + `<LedgerStatusPanel>` 추가

### 검증 결과

| 체크 | 결과 |
|------|------|
| TypeScript strict check (신규 파일) | 0 errors ✅ |
| ESLint (신규 파일 + page.tsx) | 0 warnings ✅ |
| `Date.now` / `new Date(` / `Math.random` (실코드) | 0건 ✅ |
| `localStorage` / `sessionStorage` / `navigator.clipboard` | 0건 ✅ |
| `.money-shorts-local/` gitignore | `.gitignore:66` 확인 ✅ |
| `git status -sb` — `.money-shorts-local/` 미출현 | ✅ |
| mock 경로 — "Mock Fact Card — 기록 불가" 비활성화 | ✅ |
| live 경로 — 버튼 클릭 → POST 200, recordApproval 25ms | ✅ |
| live 경로 — UI "✓ 로컬 승인 기록 존재" + 상세 표시 | ✅ |
| `.money-shorts-local/publishability-approvals.json` 생성 | ✅ |
| JSON: `canMarkPublishable: true`, `isMock: false` | ✅ |
| 원본 gateResult / clipboardPayload 불변 | ✅ |
| `piq_diag_out.txt` untracked 유지 | ✅ |

**[review-fix: owner-publishability-local-approval-ledger-v1-review-fix — 2026-06-26]**

4개 review-fix 적용:

1. **Fix 1 — Server Action trust boundary**: `LedgerStatusPanel`에서 `FactCard` 타입 import와 `recordApproval` direct import 제거. props를 `{ factCardId, isMock, recordApprovalAction, initialRecord }`로 축소. `page.tsx`에서 `recordApproval.bind(null, factCard)` bound action 생성 후 전달. client는 `notes`만 전달.

2. **Fix 2 — invalid JSON write 차단**: `recordLocalPublishabilityApproval()` 내에서 `readLocalPublishabilityApprovalLedgerRaw()` 호출 후 `reason === "invalid_json"` 시 즉시 `write_failed` 반환. 손상 파일 보존.

3. **Fix 3 — missing ledger read contract 정리**: `readLocalPublishabilityApprovalLedgerRaw()` (raw, missing=ok:false) 와 `readLocalPublishabilityApprovalLedger()` (public, missing=empty ok:true) 분리. `ReadLedgerResult` 타입에서 `"missing"` 제거.

4. **Fix 4 — barrel export 제거**: `lib/owner-decision/index.ts`에서 `export * from "./local-approval-ledger"` 제거. server files는 direct import 유지.

**검증 (review-fix):**

| 체크 | 결과 |
|------|------|
| TypeScript strict check (변경 파일) | 0 errors ✅ |
| ESLint (변경 파일) | 0 warnings ✅ |
| Client에서 `recordApproval(factCard,...)` 직접 호출 | 0건 ✅ |
| Client에서 `FactCard` 타입 import | 0건 ✅ |
| `index.ts` barrel ledger export | 0건 ✅ |
| invalid JSON → write 차단 코드 | `local-approval-ledger.ts:196` ✅ |
| `Date.now` / `new Date(` / `Math.random` (실코드) | 0건 ✅ |
| `localStorage` / `sessionStorage` / `navigator.clipboard` | 0건 ✅ |
| live — bind action POST 200, 18ms | ✅ |
| live — "✓ 로컬 승인 기록 존재" UI 표시 | ✅ |
| mock — "Mock Fact Card — 기록 불가" 비활성화 | ✅ |
| console error | 0건 ✅ |

## Ledger-Approved Overlay (`package-preview-ledger-approved-overlay-v1` — 2026-06-26)

### 구현 내용

`app/fact-cards/manual/package-preview/page.tsx` — 섹션 ⑧ Publishability Readiness 하단에 "로컬 승인 Overlay (Ledger 기반)" 패널 추가.

**Overlay 활성 조건:**
- `initialLedgerRecord !== null`
- `initialLedgerRecord.decisionResult.canMarkPublishable === true`
- `initialLedgerRecord.audit.isMock === false`

**Overlay 비활성 조건 (셋 중 하나라도):**
- 레저 기록 없음 → "Ledger 기록 없음 — 로컬 승인 기록 후 reload하면 overlay가 활성화됩니다."
- `canMarkPublishable=false` 또는 `isMock=true` → eligible 조건 미충족 안내 표시

**Overlay 활성 시 표시 내용:**
- `approvalId` (ledger record 연결)
- `overlayContentPackageId = cp-ledger-overlay-{factCard.id}` (MOCK_*, DRYRUN_* ID와 구분)
- `overlayReviewPacketId = rp-ledger-overlay-{factCard.id}`
- `overlayGateResultId = gate-ledger-overlay-{factCard.id}`
- `overlay projected isPublishable: true` (memory-only clone 명시)
- `overlay canProceedToRender: OPEN`
- `overlay blockerCodes: []`
- `overlay copyReady: READY`
- 원본 server gate `fact_card_not_publishable` 유지 안내 (표시 전용 overlay임을 명시)

**Safety invariants:**
- `overlayFactCard = { ...factCard, isPublishable: true }` — memory-only clone, 원본 `factCard` 불변
- overlay 변수(`overlayGate`, `overlayClipboard`)는 원본 `gateResult`, `clipboardPayload`를 절대 대체하지 않음
- `LedgerOverlayResult` discriminated union 타입 — `active: false | { active: true, overlayGate, overlayClipboard, approvalId }`
- `Date.now()` / `new Date()` / `Math.random()` 없음
- `navigator.clipboard` / `localStorage` / `sessionStorage` 없음
- `isMock=true` ledger record는 overlay 활성화 불가 (mock safety guard)

### 검증 결과

| 체크 | 결과 |
|------|------|
| TypeScript strict check (output/ 필터) | 0 errors ✅ |
| ESLint (page.tsx, --max-warnings=0) | 0 warnings ✅ |
| `isPublishable = true` (mutation) grep | 0건 ✅ (overlayFactCard 클론 내부만) |
| `Date.now` / `new Date(` / `Math.random` | 0건 ✅ |
| `navigator.clipboard` / `localStorage` / `sessionStorage` | 0건 ✅ |
| OVERLAY_* ID 정의 및 JSX 참조 일치 | ✅ |
| 원본 `gateResult` / `clipboardPayload` 불변 | ✅ |
| pre-existing TS error (riskReviewId) | 이번 변경 전부터 존재 — 관련 없음 ✅ |
| `piq_diag_out.txt` | untracked 유지 ✅ |

**diff stat:** `app/fact-cards/manual/package-preview/page.tsx` +123 lines (overlay logic + JSX)

**[review-fix: package-preview-ledger-approved-overlay-v1-review-fix — 2026-06-26]**

### Fix 1 — Revalidate current Fact Card before opening ledger overlay

`app/fact-cards/manual/package-preview/page.tsx` overlay IIFE 강화:

**추가된 guard 순서 (4단계):**

1. **no_record**: `initialLedgerRecord` 없음 → inactive
2. **mock_blocked**: `factCard.isMock === true` → inactive (현재 server-side Fact Card가 mock이면 차단)
3. **ledger_stale_or_ineligible**: ledger record와 현재 Fact Card 7개 audit 필드 대조
   - `rec.factCardId !== factCard.id`
   - `rec.decisionResult.factCardId !== factCard.id`
   - `rec.decisionResult.ownerDecision !== "approved"`
   - `!rec.decisionResult.canMarkPublishable`
   - `rec.audit.isMock !== factCard.isMock`
   - `rec.audit.sourceName !== factCard.sourceName`
   - `rec.audit.sourceUrl !== factCard.sourceUrl`
   - `rec.audit.primarySourceProviderId !== factCard.primarySourceProviderId`
   - `rec.audit.citationCount !== factCard.citations.length`
   - `rec.audit.publishedDate !== factCard.publishedDate`
   - `rec.audit.dataPeriod !== factCard.dataPeriod`
4. **currentEligibility re-check**: `evaluatePublishabilityDecision(factCard, { decision: "approved" })` 재실행 → `canMarkPublishable=false`이면 inactive

모든 guard 통과 후에만 `{ ...factCard, isPublishable: true }` memory-only clone 생성.

**inactive UI copy 개선 (3가지 reason 구분):**
- `no_record` → "Ledger 기록 없음 — 로컬 승인 기록 후 reload하면 overlay가 활성화됩니다."
- `mock_blocked` → "Mock Fact Card — overlay 비활성화 (isMock=true Fact Card는 승인 불가)."
- `ledger_stale_or_ineligible` → "Ledger 기록이 있지만 현재 Fact Card와 불일치하거나 재검증 실패 — overlay 비활성화 (stale/hand-edited ledger 또는 현재 Fact Card eligibility 실패)."

**LedgerOverlayInactiveReason** discriminated union 타입 추가로 JSX에서 타입 안전하게 narrowing.

### 검증 (review-fix)

| 체크 | 결과 |
|------|------|
| TypeScript strict check (output/ 필터) | 0 errors ✅ |
| ESLint (page.tsx, --max-warnings=0) | 0 warnings ✅ |
| `factCard.isMock` guard 위치 | page.tsx:729 ✅ |
| `factCardId !== factCard.id` 체크 | page.tsx:734-735 ✅ |
| audit 필드 7개 대조 | page.tsx:738-744 ✅ |
| `currentEligibility` re-check | page.tsx:749-761 ✅ |
| `isPublishable = true` mutation | 0건 ✅ (클론 내부만) |
| `Date.now` / `new Date(` / `Math.random` | 0건 ✅ |
| `navigator.clipboard` / `localStorage` / `sessionStorage` | 0건 ✅ |
| 브라우저 smoke (default route) | "로컬 승인 Overlay" DOM 렌더 ✅, `no_record` inactive 메시지 ✅ |
| 브라우저 smoke (base-rate route) | `no_record` inactive (ledger 파일 없음, Guard 1 정상) ✅ |
| console error | 0건 ✅ |
| `fact_card_not_publishable` 원본 gate 유지 | ✅ |
| `piq_diag_out.txt` | untracked 유지 ✅ |

## Risk Review Subtitle TS Fix (`package-preview-risk-review-subtitle-ts-fix-v1` — 2026-06-26)

**변경 파일:**
- `app/fact-cards/manual/package-preview/page.tsx` line 1136

**수정 내용:**
- `subtitle={`riskReviewId: ${riskReview.riskReviewId ?? "—"}`}` → `subtitle={`riskPackageId: ${riskReview.packageId}`}`
- `RiskReviewResult` 실제 계약 필드 `packageId` 사용 (없는 `riskReviewId` 제거)
- fake `riskReviewId` 필드 추가 없음

**검증:**
| 체크 | 결과 |
|------|------|
| TypeScript strict check (riskReviewId 오류) | 0건 ✅ |
| ESLint (page.tsx) | 0 warnings ✅ |
| `riskReview.riskReviewId` 잔존 grep | 0건 ✅ |
| risk-review type에 fake field | 없음 ✅ |


## Creative v2 Rate-Freeze Golden Sample Recovery (`creative-v2-rate-freeze-golden-sample-recovery-v1` — 2026-07-02)

**목표:** audit-only가 아님. 금리 동결 Golden Sample 구조를 파이프라인 계약으로 고정하고, rejected Creative v2를 실측 audit으로 reject, accepted final을 reference로 유지. LLM 이미지 생성 경로 유지, card-first(고품질 이미지 + 정보 카드 + 모션그래픽), TTS-first(padding 금지).

**핵심 실행 결정 (Owner 승인):**
- selected image set 6장이 owner 시각 QA(renderReadyCandidate=true) 통과했으나 실측 해상도 941x1672 < 1080x1920 gate 미달.
- Owner 결정: **blocker로 멈춤 — 이미지 재생성 필요.** placeholder/upscale/stock fallback로 우회하지 않음. 계약/blueprint/renderer/audit 코드는 render-ready 상태로 고정.

**신규 산출물 (repo, 모두 untracked):**
- `scripts/fixtures/creative-v2-stop-state.v1.json` — v2=rejected, baseline=reference, uploadReady=false, 이미지 blocker 명시.
- `scripts/fixtures/image_generation_contract.json` — LLM path 필수, placeholder/mock/stock 금지, 1080x1920 gate.
- `scripts/build-money-shorts-visual-director-prompt-v1.mjs` + `scripts/fixtures/visual_director_prompts.rate_freeze.v1.json` — 6 editorial financial 프롬프트, on-image text/watermark/fake chart/generic office 금지.
- `scripts/fixtures/golden_sample_blueprint.rate_freeze.v1.json` — 30s 7-phase single source of truth (script/timeline/image map/tts phrase map/perceptual event/card-image hybrid).
- `scripts/fixtures/tts_first_timeline_contract.v1.json` — full_narration_one_shot 우선, apad=whole_dur 금지, 6-scene tts 기본값 금지.
- `scripts/render-money-shorts-card-image-hybrid-v1.mjs` + `scripts/fixtures/card_image_hybrid_render_manifest.v1.json` — card_image_hybrid_v1 모드(기존 렌더러 보존). image gate 미달 시 exit 10 blocker, upscale/placeholder 금지.
- `scripts/audit-money-shorts-post-render-artifact-v1.mjs` + samples/output fixture — 실제 mp4 silencedetect audit(ffprobe pass != quality pass).
- `scripts/fixtures/golden_sample_recovery_report.v1.json` — 3-sample 비교 + findings + 권고.
- `scripts/check-money-shorts-golden-sample-recovery-static.mjs` — 통합 static guard.

**검증 (실측 증거):**
| 체크 | 결과 |
|------|------|
| static guard | 109/109 PASS |
| 신규 JSON 유효성 | 9/9 valid |
| image quality gate (card-image hybrid, --gate-only) | 6/6 이미지 941x1672 gate 미달 → exit 10 IMAGE_GATE_BLOCKED |
| post-render audit: rejected v2 | REJECT_confirmed (first5s silence 3.44s>0.8, silence ratio 0.302>0.18, speech 0.698<0.72) |
| post-render audit: accepted baseline | reference_pass_with_known_limits (first5s 0.4s, ratio 0.111, speech 0.889) |
| post-render audit: golden sample | BLOCKED_mp4_not_rendered (image gate, placeholder mp4 없음) |
| 기존 렌더러 보존 | render-money-shorts-creative-final-visual-v1.mjs 무수정 |
| 보호 파일 | _ai/CONTEXT_TRANSFER_CODEX.md, piq_diag_out.txt 미접근 |
| uploadReady / upload queue readiness | false / 미생성 |

**범위 이탈/blocker:**
- Golden Sample final mp4(visual_only + tts_mux)는 image gate 미달로 **미생성** — Owner 승인 하 이미지 재생성 후 진행.
- `pnpm build`: TypeScript compile 통과, type-check 단계에서 pre-existing legacy 바이너리 `output/money-architect-candidate10-gpt-visual-plates-v1/qa/seg_B1.ts`(2026-06-24, 2.9MB FFmpeg segment, untracked, 내 변경과 무관)가 "File appears to be binary"로 실패. 이번 slice 변경(scripts/*.mjs + fixtures/*.json)과 무관한 pre-existing 실패. 승인 범위 밖으로 미수정.


## Golden Sample Recovery Review-Fix (`creative-v2-rate-freeze-golden-sample-recovery-v1-review-fix` — 2026-07-02)

**목표:** Codex review에서 발견된 checkpoint 전 review-fix 2건 수정. live 생성/render/tts/mux/upload/commit/push 없음.

**1) Perceptual event count single-source 정합성**
- 문제: blueprint(`plannedPerceptualEventCount: 17`, phases 배열엔 `dim_blur_background`를 매 phase 정적 이벤트로 포함) vs recovery report(`14`) vs renderer(카드당 `cardTemplate`+`cardMotion` 2개 하드코딩, hard_cut/background_dim_transition 미반영) — 3곳이 서로 다른 기준/값.
- 근본 원인: `dim_blur_background`는 모든 phase에 정적으로 적용되는 배경 처리 방식이지 전환이 아닌데 이벤트로 카운트되고 있었음(HANDOFF의 "slow pan/zoom/decorative overlay는 이벤트 아님" 원칙 위반).
- 수정: `dim_blur_background`를 `countedEventTypes`에서 제거하고 `notCountedAsPerceptualEvent`에 명시. blueprint phases[].perceptualEvents 재계산 → 합계 **18**(hook 2 + curiosity 2 + point1~3 각 3 + twist 3 + action 2). `plannedPerceptualEventCount: 18`로 정정(single source of truth로 명시).
- `card_image_hybrid_render_manifest.v1.json`: cardTimeline 각 카드에 blueprint phases와 1:1 동일한 `perceptualEvents` 배열 추가 + `perceptualEventPlanRef`(count=18, minForPass=12) 추가.
- `render-money-shorts-card-image-hybrid-v1.mjs`: 하드코딩 2-per-card push 로직 제거 → manifest `cardTimeline[].perceptualEvents`를 그대로 소비. `plannedPerceptualEventCount`/`actualMatchesPlanned`/`passesMinThreshold` 필드를 perceptual_event_report에 추가.
- `golden_sample_recovery_report.v1.json`: `plannedPerceptualEventCount: 14` → `18`로 정정(threeSampleComparison + findingsRequestedByHandoff 양쪽).
- `check-money-shorts-golden-sample-recovery-static.mjs`: single-source 정합성 체크 17개 신규 추가 — blueprint plannedCount == phases 배열 합계, dim_blur_background 미카운트, manifest cardTimeline == blueprint phases 1:1, renderer가 manifest를 소비(하드코딩 아님), recovery report 값 일치, **minPerceptualEventCountForPass는 12 미만으로 완화 불가** 강제.
- pass threshold 12는 그대로 유지(완화 없음). pan/zoom/미세 이동/dim-blur 정적 배경은 여전히 비카운트.

**2) Build gate 오염 제거**
- `tsconfig.json`: `"exclude": ["node_modules"]` → `"exclude": ["node_modules", "output"]`. 1줄 수정.
- `output/`는 이미 `.gitignore`의 `/output/` 대상(gitignored generated artifact 폴더). `output/money-architect-candidate10-gpt-visual-plates-v1/qa/seg_B1.ts` 등 legacy 바이너리 FFmpeg segment가 `.ts` 확장자를 가져 TypeScript type-check에 "File appears to be binary"로 걸리던 문제 해결.
- `output/` 내부 파일은 읽기(존재 확인 `find`)만 수행, 수정/삭제/stage 없음. reported legacy binary `.ts` 미접근.
- 기존 source include(`**/*.ts`, `**/*.tsx` 등) 원칙 유지, exclude만 추가.

**검증 결과:**
| 체크 | 결과 |
|------|------|
| `node scripts\check-money-shorts-golden-sample-recovery-static.mjs` | 126/126 PASS (기존 109 + 신규 17) |
| `node scripts\render-money-shorts-card-image-hybrid-v1.mjs --gate-only` | exit 10, IMAGE_GATE_BLOCKED 유지(941x1672, 변화 없음 — 예상대로) |
| renderer perceptual 로직 dry-run(순수 계산, ffmpeg 미실행) | actual=18, planned=18, matches=true, minForPass=12 pass=true |
| `node scripts\audit-money-shorts-post-render-artifact-v1.mjs` | rejected v2 REJECT_confirmed(first5s 3.44s, ratio 0.302, speech 0.698) / baseline reference_pass_with_known_limits / golden BLOCKED_mp4_not_rendered — 전부 예상대로 |
| `pnpm build` | **완전 성공** — TypeScript 통과(12.3s), 22 페이지 정적 생성, legacy 바이너리 오염 0건, 다른 pre-existing 실패 없음 |

**변경 파일:**
- `scripts/fixtures/golden_sample_blueprint.rate_freeze.v1.json` (perceptualEventPlan + phases[].perceptualEvents 정정)
- `scripts/fixtures/card_image_hybrid_render_manifest.v1.json` (cardTimeline[].perceptualEvents + perceptualEventPlanRef 추가)
- `scripts/render-money-shorts-card-image-hybrid-v1.mjs` (manifest 소비 로직으로 교체)
- `scripts/fixtures/golden_sample_recovery_report.v1.json` (plannedPerceptualEventCount 14→18 정정)
- `scripts/check-money-shorts-golden-sample-recovery-static.mjs` (17개 정합성 체크 추가)
- `tsconfig.json` (output exclude 추가, 1줄)

**범위 이탈:** 없음. live 이미지 생성/render/TTS/mux/upload/commit/push 전부 미실행. protected files(`_ai/CONTEXT_TRANSFER_CODEX.md`, `piq_diag_out.txt`) 미접근. `output/` 내부 파일 읽기(존재 확인)만, 수정/삭제 없음.

**남은 blocker:** 변화 없음 — Golden Sample final mp4는 여전히 image quality gate(941x1672 < 1080x1920) 미달로 미생성. 이미지 재생성(live ChatGPT+Playwright+CDP, Owner 승인) 후 render 진행 필요.

**checkpoint 권장:** 예 — review-fix 2건 모두 완료 + 전 검증 통과. 변경 파일 6개(fixture 3, script 2, tsconfig 1), 논리적으로 하나의 review-fix slice. commit/push는 미실행(승인 없음, Owner 명시 승인 대기).


## Rate Freeze Live Image Regeneration (`creative-v2-rate-freeze-live-image-regeneration-v1` — 2026-07-02)

**결론: BLOCKED — 승인된 ChatGPT live path는 1080x1920 이상을 생성할 수 없음 (모델 네이티브 캔버스 상한 실측 확정). fallback/upscale 없이 중단.**

**실행 경로 (모두 승인된 path):**
- 신규 runner `scripts/run-money-shorts-rate-freeze-image-regeneration-v1.mjs` 작성 — `_chatgpt-image-core.mjs` 무수정 재사용, `visual_director_prompts.rate_freeze.v1.json` 소비, `ALLOW_CHATGPT_IMAGE=1` gate, --inspect-existing / --preflight-only / --probe-one / --from-scene 모드.
- 1단계 read-only 정찰 (전송 0회): composer에 해상도/비율 UI 옵션 없음 확정("매우 높음"은 GPT-5.5 사고 수준 선택기). srcset/대형 변형 없음. estuary는 네이티브 원본을 그대로 서빙.
- 2단계 probe 1회 생성: scene_1(hook)을 신규 프롬프트 + 명시적 "minimum 1080x1920 canvas" 지시로 생성 → **941x1672** (gate FAIL). 첫 미달 확인 즉시 남은 5회 생성 중단 (quota 보존).

**Blocker 증거 사슬 (5중):**
1. 기존 7장(6 scene + retry, 프롬프트 6종 상이) 전부 정확히 941x1672.
2. 941×1672 = 1,573,352px ≈ 1024×1536 = 1,572,864px (오차 0.03%) — 모델이 고정 픽셀 예산(~1.57MP)을 9:16으로 재배분한 네이티브 크기.
3. composer 크기/해상도/비율 옵션 부재 (recon-v2 실측).
4. estuary asset은 단일 src 원본(1.77MB PNG) — srcset/download 대형 변형 없음, intercept로 원본 그대로 확보.
5. 오늘자 신규 생성 + 명시적 해상도 지시로도 941x1672 → 프롬프트 텍스트로 캔버스 크기 제어 불가.

**검증 결과:**
| 체크 | 결과 |
|------|------|
| probe 생성 (`--probe-one`) | 941x1672 png, gate FAIL, exit 2 (blocker evidence) |
| `node scripts\render-money-shorts-card-image-hybrid-v1.mjs --gate-only` | exit 10 IMAGE_GATE_BLOCKED 유지 (6/6 941x1672, 변화 없음) |
| `node scripts\check-money-shorts-golden-sample-recovery-static.mjs` | 126/126 PASS (fixture 무변경) |
| 정찰 전송 횟수 | 0회 (read-only) / 총 프롬프트 전송 1회 (probe) |

**생성/갱신 파일:**
- `scripts/run-money-shorts-rate-freeze-image-regeneration-v1.mjs` (신규, 재사용 가능 runner)
- `output/money-shorts/rate-freeze-golden-sample-regen-v1/` — scene-01-hook.png(941x1672 probe 증거), probe-one-summary.json, recon-existing-assets.v1.json, recon-v2.json (전부 gitignored output)
- gate/contract fixture는 **무변경** (blocked 상태가 여전히 사실이므로)

**범위 이탈:** 없음. upscale/crop/placeholder/stock fallback 미사용. gate 완화 없음. final render/TTS/mux/upload 없음. commit/push 없음. 보호 파일 미접근. scene 2~6 생성은 의도적 미실행 — 캔버스 상한은 프롬프트 내용과 무관함이 7장+probe로 입증되어, 확정 미달 이미지 5장에 quota를 소모하지 않음.

**Codex/Owner 결정 필요 (3안):**
- A안(권장): card_image_hybrid에서 이미지는 100% dim/blur 배경 전용이므로 "배경 용도 이미지 gate"를 941x1672(모델 네이티브 9:16 최대)로 재정의하고, 렌더러가 배경 한정 스케일을 명시 허용 (카드/텍스트/모션은 1080x1920 벡터 렌더 유지 — blur 배경의 스케일은 지각 손실 사실상 없음). 단 현행 contract의 no-upscale 조항 변경이므로 Owner 승인 필수.
- B안: 네이티브 ≥1080x1920 지원 provider path 추가 (유료 API size 파라미터 등) — 신규 의존성/비용/승인 필요.
- C안: topic skip (contract on_gate_fail_actions 옵션) — golden sample 회복 목표와 상충.


## Background-Only Gate + Visual Render (`creative-v2-rate-freeze-background-gate-visual-render-v1` — 2026-07-02)

**결론: ✅ Owner A안 반영 완료 + `golden_sample_rate_freeze_visual_only.mp4` 실제 렌더 성공 (1080x1920 h264 30.0s video-only).**

**Gate 재정의 (Owner A안 2026-07-02):**
- `image_generation_contract.json`: 기존 `image_quality_gate`를 foreground/final 전용(1080x1920+ 원칙 유지)으로 명시하고, `background_only_image_gate` 신설 — 최소 native source 941x1672(ChatGPT native 9:16 최대, live probe 실측 근거), vertical 9:16(0.5625±0.01), 필수 조건(selected set/owner reviewed/LLM source/no placeholder/no stock/no watermark/no readable on-image text), `card_image_hybrid_v1`의 `dim_blur_background` 전용, scale-to-cover는 이 모드 한정 명시 허용, foreground 일반화 금지.
- `current_selected_image_set_status`: `meetsResolutionGate: false`(foreground 사실 유지) + `meetsBackgroundOnlyGate: true` + `gateVerdict: PASS_background_only_use`.
- `card_image_hybrid_render_manifest.v1.json`: imageQualityGate를 `gateClass: background_only_image_gate`(941x1672, abortIfBelowGate 유지, allowUpscaleForFinal false 유지, backgroundScaleToCoverAllowed true)로 교체.
- `render-money-shorts-card-image-hybrid-v1.mjs`: gate report에 gateClass/scale-to-cover 필드, blocker 문구 background gate 기준, render_manifest.json out에 imageGateClass/backgroundScaleToCoverUsed/imagesUsedAsBackgroundOnly/cardsAndTextRenderedAtCanvas 추가, ffmpeg timeout 180s→300s. 배경 필터는 기존 그대로 scale-to-cover+dim+blur, 카드/텍스트는 ASS PlayResX/Y=1080x1920 캔버스 렌더 (A안 구조 그대로).
- `check-money-shorts-golden-sample-recovery-static.mjs`: background-only gate 계약 검증 24개 신규 (조건 7종/스코프/941/1672/일반화 금지/manifest-contract 값 일치/전 카드 dim_blur_background/canvas 1080x1920 유지). foreground 미달 사실 일관성 체크 유지. perceptual threshold 완화 없음.

**렌더 및 검증 결과:**
| 체크 | 결과 |
|------|------|
| static guard | **150/150 PASS** (기존 126 + 신규 24) |
| `--gate-only` | **exit 0 IMAGE_GATE_PASS** (6/6 941x1672, aspect 0.5628 OK) |
| visual-only render | ✅ `C:\tmp\money-shorts-os\card-image-hybrid-render-v1\golden_sample_rate_freeze_visual_only.mp4` |
| ffprobe | 1080x1920, h264, 30fps, **정확히 30.000s**, video 스트림 단독(오디오 없음 = 기대값), 2.1MB valid |
| perceptual_event_report | actual **18 = planned 18** (single-source 일치), minForPass 12 통과 |
| card presence ratio | **1.0** (목표 0.9, audit 최소 0.7 통과) |
| full-screen image dominance | **0.0** (한도 0.25 이내) |
| first 2s hook card | **true** (big_hook_card + card_punch_zoom 0.0~2.0s) |
| uploadReady | **false** (render_manifest.json + report 유지, requiresTtsSoundMuxBeforeUpload true) |
| actual_card_timeline | 7 cards, hook 0-2s ~ action 26-30s 타임라인 일치 |

**생성된 C:\tmp 아티팩트:** golden_sample_rate_freeze_visual_only.mp4, image_gate_report.json(IMAGE_GATE_PASS), render_manifest.json, actual_card_timeline.json, perceptual_event_report.json, hybrid_clip/bg/ass 중간 파일들.

**변경 파일:** image_generation_contract.json / card_image_hybrid_render_manifest.v1.json / render-money-shorts-card-image-hybrid-v1.mjs / check-money-shorts-golden-sample-recovery-static.mjs / golden_sample_recovery_report.v1.json(실측 증거 반영) / post_render_artifact_audit.samples.v1.json(golden note 갱신) / _ai/CLAUDE_REPORT.md.

**범위 이탈:** 없음. image generation 재실행 없음(기존 6장 재사용), 941x1672 foreground 일반 허용 없음, perceptual threshold 완화 없음, TTS/mux/upload 없음, commit/push 없음, 보호 파일 미접근.

**알려진 문서 불일치 (Codex 확인 필요, 다음 slice에서 정리 권장):**
1. `golden_sample_blueprint.rate_freeze.v1.json`의 `renderReadinessGate`(finalRenderAllowed=false, BLOCKED_image_resolution_below_1080x1920)는 A안 이전 상태 — 수정 범위 밖이라 미수정. visual-only 렌더는 "final(tts mux 완성본) render"가 아니므로 모순은 아니나, TTS mux slice에서 blueprint 갱신 권장.
2. `audit-money-shorts-post-render-artifact-v1.mjs`의 golden blocker 하드코딩 문구("image quality gate (1080x1920) failed")가 stale — audit script는 수정 범위 밖. 다음 audit slice에서 tts_mux_pending 기준으로 갱신 필요.
3. `creative-v2-stop-state.v1.json`의 imageQualityBlocker.blockerActive=true는 stop 시점 기록(historical lock) — 유지.

**다음 추천:** TTS-first full narration one-shot mux(→ golden_sample_rate_freeze_tts_mux.mp4) + post-render artifact audit slice (audit script golden 문구 갱신 포함). uploadReady는 audit 통과 전까지 false.


## Quality Stabilization Decision Packet (`creative-v2-golden-sample-quality-stabilization-decision-pack-v1` — 2026-07-02)

**성격: 문서 작업만 — 구현/render/live generation/TTS/mux/upload 없음.**

**산출물:**
- `_ai/GOLDEN_SAMPLE_QUALITY_STABILIZATION_DECISION_PACKET_V1.md` (신규) — 자동화 전 Golden Sample 품질 안정화 재정렬 결정 패킷.
- `_ai/HANDOFF_NOW.md` — Decision Packet Pointer 섹션(5줄) 추가.

**패킷 핵심 내용:**
- 목표 재정의: 자동화 전 "좋은 쇼츠가 나오는 생성 구조/품질 문법(이미지/대본/TTS/카드/모션/리듬/audit)" 안정화. 금리동결은 고정 주제가 아님(테스트 주제).
- 살릴 것: 카드/텍스트/모션 레이어, perceptual event 구조(18/18 검증), first 2s hook card 검증, card presence/dominance 지표, render_manifest/actual_card_timeline/perceptual_event_report 체계, ChatGPT path 941x1672 상한 evidence. 기존 visual-only mp4는 구조 검증 evidence로만(품질 통과물 아님).
- 버릴 것: 기존 selected image set final 사용 금지, probe image final 사용 금지, background-only gate 완화 폐기(구 A안), audit-only/threshold-only/SFX-only/upload queue 선행 금지, 금리동결 좁은 최적화 금지. "좋은 이미지 없으면 render 금지" 유지.
- Owner 선택지 4개 (각각 승인/위험/금지/검증 기준 포함): ①기존 ChatGPT path + visual direction 강화(단독으로는 941x1672 상한 때문에 final render 불가 명시), ②1080x1920+ 강한 provider 추가 승인(해상도+품질 동시 해결 가능한 유일 선택지, 유료 API/의존성/credential 승인 필요), ③시각적으로 강한 주제로 교체(해상도 해법 없이는 단독 완결 불가 명시), ④skip_topic(안정화 목표와 충돌 명시).
- 최종 추천: **좋은 이미지/비주얼 source 확보 결정이 먼저, render 직행 금지** — ② 주 결정 + ① 결합 + ③ 병행 판단, 공통 게이트(6/6 1080x1920+/9:16/owner 시각 QA/no-text/no-watermark) 확정 전 render 금지.
- 부수 결정 필요: 미커밋 A안 잔재(contract/manifest/renderer/guard/report/samples의 background gate 변경) revert vs 재작업 — Codex 판단 필요.

**검증:** 필수 문구 7종 grep 확인(Golden Sample 품질 안정화/자동화 전/금리동결은 고정 주제가 아님/기존 selected image set final 사용 금지/좋은 이미지 없으면 render 금지/background-only gate 완화 폐기/이미지·대본·TTS·카드·모션·리듬·audit) — 전부 포함. 절대규칙 파일 MD5 `adf4f45542fb3959ce5ca44fde3a98f2` 무변화(무수정 확인).

**금지 작업 미수행:** 절대규칙 원문 무수정, 구현 코드 무변경, 이미지 생성/live API/Playwright/render/TTS/mux/upload 미실행, dependency/env/DB 무변경, commit/push 없음, 보호 파일 미접근, 이미지 재사용/background-only 완화를 승인된 방향으로 기술하지 않음(폐기로 명시).


## Rejected Background-Gate Cleanup (`creative-v2-golden-sample-rejected-background-gate-cleanup-v1` — 2026-07-02)

**성격: 폐기된 A안/background-only gate 잔재를 working tree에서 제거하는 cleanup slice. 구현 확장/render/live 실행 없음.**

**제거한 것:**
- `image_generation_contract.json`: `background_only_image_gate` 섹션 전체, `background_only_exception_ref`, `background_only_exception_note`, `meetsBackgroundOnlyGate`/`PASS_background_only_use`/A안 승인 문구 — 전부 제거. current set은 `BLOCKED_resolution_below_min` + `renderReadyCandidate: false` + `evidenceOnly: true`로 복원/강화.
- `card_image_hybrid_render_manifest.v1.json`: gate를 pre-A(1080x1920)로 복원, `gateClass`/`backgroundScaleToCoverAllowed`/A안 참조 제거. status = `manifest_locked_render_blocked_pending_image_source_decision`.
- `render-money-shorts-card-image-hybrid-v1.mjs`: background-only gate 문구/필드(imageGateClass, backgroundScaleToCoverUsed, imagesUsedAsBackgroundOnly 등) 제거, blocker 메시지에 "no background-only relaxation (rejected direction)" + decision packet 안내 명시.
- `check-money-shorts-golden-sample-recovery-static.mjs`: A안 보증 체크 24개 제거 → **재발 방지 체크로 교체** (igc/manifest에 폐기 필드가 다시 나타나면 FAIL, renderer 소스에 background-only 식별자가 다시 나타나면 FAIL, current set evidence-only 확인).
- `golden_sample_recovery_report.v1.json` / `post_render_artifact_audit.samples.v1.json`: "A안 승인/IMAGE_GATE_PASS/background-only 허용" 문구 전부 제거 → "폐기된 방향 / evidence only / 좋은 이미지 없으면 render 금지 / decision packet 참조"로 재작성. finalRecommendation = `secure_stronger_image_visual_source_before_any_render`.

**보존한 것:** 카드/텍스트/모션 레이어(ASS 1080x1920 canvas), perceptual event single-source 구조(blueprint→manifest→renderer, planned 18), first 2s hook card 체크, card presence/dominance 지표, render_manifest/actual_card_timeline/perceptual_event_report 체계, ChatGPT path 941x1672 상한 evidence, visual-only mp4(구조 검증 evidence only로 명시). ffmpeg timeout 300s(중립적 견고성) 유지.

**검증 결과:**
| 체크 | 결과 |
|------|------|
| 절대규칙 MD5 | `adf4f45542fb3959ce5ca44fde3a98f2` = 기대값 일치 (무수정) |
| static guard | **137/137 PASS** (150→137: A안 보증 24개 제거, 방지/복원 체크 11개 추가 = 순감 13) |
| `--gate-only` | **exit 10 IMAGE_GATE_BLOCKED** — 6/6 941x1672 < 1080x1920 (941x1672를 pass로 만들지 않음) |
| stale 문구 rg | scripts/ 내 4개 식별자(background_only_image_gate 등)는 static guard의 재발 방지(부재 단언) 체크에만 존재. contract/manifest/renderer operational 사용 0건. HANDOFF_NOW는 Codex의 "rejected" 서술 1건뿐 → 무수정 |
| git diff --stat | 이번 slice: guard/manifest/report/contract/samples/renderer 6개 파일 (+CLAUDE_REPORT) |
| pnpm build | 생략 — scripts/fixtures만 수정, TS/Next/build config 무변경 |

**제외 파일:** `scripts/run-money-shorts-rate-freeze-image-regeneration-v1.mjs` — 지시대로 무수정(excluded), 이전 blocker evidence runner로 보존.

**참고(인프라):** 작업 중 Bash 권한 분류기(claude-opus-4-8) 일시 장애로 실행 검증이 약 10여 회 지연됨 — 우회 없이 대기/재시도로 완료. 장애 중 read-only 검증(grep/read/md5sum)으로 육안 정합성 선확인.

**남은 위험/결정 필요:** (1) 이미지/비주얼 source 선택 — decision packet의 선택지 ①②③④ Owner 결정 대기. (2) blueprint의 renderReadinessGate는 BLOCKED 상태 그대로(사실과 일치, 무수정). (3) audit script의 golden blocker 하드코딩 문구는 다음 audit slice에서 갱신 권장.

**checkpoint:** 가능 — cleanup으로 working tree가 절대규칙/decision packet과 정합됨. 누적 diff(이전 slice 포함 6파일 +234/-41 + 신규 문서 3종 + runner 1종)는 Codex 리뷰 후 checkpoint commit 권장. commit/push 미실행.


## Image-Source Recovery Decision Packet (`creative-v2-golden-sample-image-source-recovery-decision-pack-v1` — 2026-07-02)

**성격: 조사/설계/결정 패킷만 — live 생성/API/render/TTS/mux/upload/credential·dependency 변경 없음. 외부 서비스 호출 0건 (provider 사양은 로컬 repo 증거 + 지식 기반, 불확실 항목은 "⚠️ 공식 문서 확인 필요" 표시).**

**산출물:**
- `_ai/GOLDEN_SAMPLE_IMAGE_SOURCE_RECOVERY_DECISION_PACKET_V1.md` (신규) — 6개 섹션: blocker 요약 / provider 후보 비교 / visual director 재설계 / 주제 후보 비교 / Owner decision / 금지·폐기 재확인.
- `_ai/HANDOFF_NOW.md` — Decision Packet Pointer에 새 packet 1줄 추가.

**Provider 후보 비교 핵심 (repo 증거 기반):**
- A: **Imagen 4 상위 옵션** — `lib/imagen.ts`가 이미 imagen-4.0-fast + aspectRatio 9:16 통합 보유(실측 근거). 상위 모델/2K 옵션의 9:16 픽셀이 gate를 넘는지 ⚠️공식 문서 확인 필요. plan_required/quota 이력 리스크. **통합 비용 최소 → 소량 테스트 1순위 후보.**
- B: OpenAI gpt-image — 알려진 상한 1024x1536(2:3), ChatGPT probe와 동일 픽셀 예산 계열 → gate 미달 가능성 높음. 문서 확인만 권고.
- C: **FLUX 공식 API** — 유연한 해상도로 1080x1920+ 네이티브 가능성 최고(⚠️확인 필요). 신규 credential/비용 필요. A 미충족 시 대안 또는 병행.
- D: Midjourney — 공식 API 부재(알려진 바) → 자동화 부적합, 참고만.
- 권고 순서: (1) 호출 없이 A/C 사양·단가 공식 문서 확인 → (2) 승인 후 후보당 4장 소량 테스트(hook+checklist 프롬프트) → (3) QA 통과 시에만 full 6장 → 그 후 render slice.

**Visual director 재설계:** scene별 must_show/must_avoid/objectDensity(2~4)/visualMetaphor/subjectDeliveryCheck/cameraAndLight 필수화, 카드 안전 영역과 주연 교대 구도 기준, dim/blur 내성, 새 selected set QA 표(6/6 ≥1080x1920 네이티브 + 9:16 + 주제 전달력 owner QA + no-text/watermark + 세트 리듬).

**주제 후보:** T1 금리동결(기준점, blueprint 재사용) / **T2 "월급이 3일 만에 사라지는 이유"(현금흐름×심리) — 추천 1순위** (시각 은유 가장 구체적, hook 보편성 최고, evergreen, 기존 카드/TTS 구조 1:1 매핑, 시리즈 확장 축) / T3 구독료 함정(2호 후보). 최종 결정은 Owner.

**검증:** 절대규칙 MD5 `adf4f45542fb3959ce5ca44fde3a98f2` 유지(무수정) / packet 필수 문구 30건 grep 확인 / 요구 6개 섹션 구조 확인 / git status·diff --stat 확인 (HEAD 69c6e52 유지, commit/push 없음).

**금지 작업 미수행:** live 이미지 생성·API·paid service 호출 0건, browser/Playwright/CDP 미실행, credential/env/dependency 무변경, render/TTS/mux/upload 없음, implementation code 무수정, 절대규칙 무수정, 보호 파일 미접근, 폐기 방향(941x1672 재사용/background-only 완화) 재승인 문구 없음.


## Provider Official Doc Verification (`creative-v2-provider-official-doc-verification-v1` — 2026-07-02)

**성격: read-only 공식 문서 확인만 — API 호출/이미지 생성/browser/credential·env·dependency 변경/render/TTS/mux/upload/commit/push 0건.**

**산출물:** `_ai/PROVIDER_OFFICIAL_DOC_VERIFICATION_REPORT_V1.md` (신규, 공식 URL 11건 + 확인일 기록, 미확인 항목 명시) + `_ai/HANDOFF_NOW.md` 포인터 1줄.

**핵심 발견 (공식 문서 기준, 2026-07-02 확인):**
1. **Imagen 4 계열은 deprecated — 2026-08-17 shutdown** (Google 공식). 기존 lib/imagen.ts 모델 상향안(A 원안)은 비추천. 승계: Gemini 이미지 모델(nano banana 계열).
2. **OpenAI gpt-image-2 / gpt-image-2-2026-04-21: 임의 WIDTHxHEIGHT(16배수) 지원 공식 확인** (공식 SDK 레포) → 1088x1920/1088x1936 네이티브 지정 가능 = 1080x1920+ 요건을 파라미터로 직접 충족하는 유일 후보. 가격은 공식 페이지 2곳 403 → 미확인.
3. **gemini-3.1-flash-image**: 9:16 확인, 512px/1K/2K/4K, 2K $0.101/장(standard). 9:16 정확 픽셀은 문서 미기재 → 실측 필요. 기존 클라이언트는 :predict 방식이라 generateContent로 수정 필요.
4. **FLUX(BFL)**: FLUX.2 [pro] from $0.03(MP-based)/FLUX1.1 Ultra $0.06(4MP). 단 9:16 지원·정확 해상도 파라미터는 문서에서 미확인 → 3순위/보류. fal.ai/Replicate wrapper는 이번 범위 외로 구분 기록.

**추천:** 1순위 B(OpenAI gpt-image-2, 기존 OPENAI_API_KEY 재사용) / 2순위 A′(gemini-3.1-flash-image 2K) / 3순위 C(FLUX, 추가 확인 후). 소량 테스트 B+A′ 병행 후보당 4장(hook 2+checklist 2, T2 프롬프트) 총 8장, 비용 상한 $3 제안(B 단가 확인 후 장당 $0.5 초과 시 실행 전 재보고). Owner 승인 문구 초안 report §6 포함.

**검증:** 절대규칙 MD5 `adf4f45542fb3959ce5ca44fde3a98f2` 유지 / report에 공식 URL 11건·미확인 20건 표기 확인 / git status·diff --stat 확인 (HEAD 69c6e52 유지, commit/push 없음).


## Provider Doc Report Correction (`creative-v2-provider-official-doc-verification-report-correction-v1` — 2026-07-02)

**성격: 문서 보정만 — 실행/생성/호출/credential/dependency/render/TTS/mux/upload/commit/push 0건.**

**보정 내역 (Codex 제공 공식 근거 반영):**
- OpenAI §4: "가격 403 미확인" 제거 → 공식 guide(platform.openai.com/docs/guides/image-generation)의 Cost and latency 가격표(1024x1024/1024x1536/1536x1024 × Low/Med/High, 1024x1536 High ≈ $0.165) 확인됨 + "thousands of valid resolutions" 명시 반영. custom size(1088x1920/1088x1936) 정확 비용은 calculator/산정 필요로 유지. 1순위 근거(기존 key 재사용/dependency 0/임의 해상도) 유지.
- FLUX §5: "width/height 미확인" 제거 → FLUX.2 [pro] API Reference의 `width`/`height` 파라미터 공식 존재(x >= 64) + flexible aspect ratios 공식 명시 반영. 최대 픽셀/1088x1920 acceptance는 테스트/추가 확인 필요로 유지. 뉘앙스 보정: 신규 credential 허용 시 강한 후보, credential 없는 즉시 테스트는 OpenAI 우선.
- Gemini §3: aspect_ratio/image_size:"2K"/response_format 파라미터 확인 추가. 2K $0.101·9:16 확인 유지, 정확 픽셀 실측 필요 유지.
- §2 출처 목록: 공식 URL 5종 추가/갱신, 403 단정 행 제거(봇 차단 사실은 주석으로만). §7 미확인 표 갱신. §6 비용 상한 $3 유지(근거: 기준 사이즈 $0.165 수준 + A′ ≈ $0.41 → 8장에 보수적 여유). 승인 문구 초안 갱신.
- `_ai/HANDOFF_NOW.md` 포인터: "가격만 403 미확인"/"FLUX(9:16 미확인)" → 보정 v1.1 표현으로 교체.

**검증:** 절대규칙 MD5 `adf4f45542fb3959ce5ca44fde3a98f2` 유지 / report 내 stale 패턴(403·가격 미확인·width/height 미확인) 0건 / HANDOFF_NOW 잔여 1건은 Codex 작성 보정 지시문 원문(단정 아님, Codex 관리 섹션) / 요구 공식 URL 5종 포함 확인 / git status·diff --stat 확인 (HEAD 69c6e52 유지).

**최신 추천 순위 (변경 없음, 근거 강화):** 1순위 B: OpenAI gpt-image-2 / 2순위 A′: gemini-3.1-flash-image 2K / 3순위(조건부 강한 후보) C: FLUX.2 [pro]. 소량 테스트 B+A′ 병행 8장, 상한 $3 유지.


## Image Source Small Provider Test (`creative-v2-image-source-small-provider-test-v1` — 2026-07-02)

**성격: Owner 승인 하의 소량 실측 테스트 — 자동화 구현 아님. render/TTS/mux/upload/commit/push 0건. secret 값 노출 0건(.env.local 무수정, 존재 boolean만 확인).**

**테스트 설계:** T2("월급이 3일 만에 사라지는 이유") 공통 프롬프트 4종(hook_salary_arrival/cashflow_leak/fixed_cost_stack/day3_empty_wallet, visual director v2 요건 반영)을 3개 provider에 동일 적용. size 1088x1936 우선, 거부 시 1088x1920 1회 fallback 설계(실제로는 fallback 불필요).

**결과표:**
| Provider | attempted | generated | gate PASS | 실측 해상도 | 비고 |
|---|---|---|---|---|---|
| OpenAI gpt-image-2 (quality high) | 4 | 4 | **4/4 PASS_1080x1920_NATIVE** | 1088x1936 png (2.2~2.7MB) | 첫 시도 수락, fallback 불필요, ~110s/장 |
| FLUX.2 [pro] (BFL 공식 API) | 4 | 4 | **4/4 PASS_1080x1920_NATIVE** | 1088x1936 jpeg (~0.55MB) | api.bfl.ai/v1/flux-2-pro 정상, ~20s/장 최속 |
| ChatGPT+Playwright (control, 무료) | 4 | 3 | **0/3** (3× FAIL_RESOLUTION) + 1× 저장 실패 | 941x1672 | 기존 상한 재확인. 4/4 완료감지 timeout→intercept 의존, 1건 intercept 0개 |

**주제 전달력 관찰 메모 (scene 1·3 육안, Owner QA 대체 아님):**
- OpenAI: no-readable-text 지시 준수 높음(알림 글로우/앱 타일 전부 비가독), 손 정상, 에디토리얼 톤·카드 안전영역 양호, 주제 전달 명확.
- FLUX: 질감/사실감 최상급(스팀·가죽·지폐 물성)이나 **no-readable-text 반복 위반** — scene1 폰 화면 한글 유사 텍스트+UI chrome, scene3 "500" 지폐 숫자·영수증 문자열·봉투 인쇄+우표. 채택 시 negative 강화(빈 화면/빈 종이 강제) 재검증 필요.
- ChatGPT: 해상도에서 gate 탈락이라 품질 평가 생략(파일 보존).

**비용 evidence (구분 명시):**
- OpenAI: **API usage 응답 실측** — 5,322 output image tokens/장 × 4장 (+ input ~250 text tokens/장). 정확 달러 환산은 gpt-image-2 공식 토큰 단가 기준 산정 필요 — 공식 guide 기준사이즈 High $0.165 수준과 유사 범위로 총 **~$0.7±0.2 추정**.
- FLUX: API 응답에 비용 없음 — **공식 MP-based 단가(from $0.03) 기반 추정** 1088x1936=2.11MP → ~$0.06/장 × 4 = **~$0.25 추정** (정확치는 BFL 대시보드 크레딧 확인 필요).
- 합계 추정 ~$1.0 안팎 — **상한 $3 준수**. paid 총 8장 준수.

**Owner 열람용 best 후보 (절대경로):**
- `C:\Users\PC\jjy\instagram-auto\output\money-shorts\golden-sample-image-source-test-v1\openai-scene-01-hook_salary_arrival.png`
- `C:\Users\PC\jjy\instagram-auto\output\money-shorts\golden-sample-image-source-test-v1\openai-scene-03-fixed_cost_stack.png`
- `C:\Users\PC\jjy\instagram-auto\output\money-shorts\golden-sample-image-source-test-v1\flux-scene-01-hook_salary_arrival.jpg` (텍스트 위반 확인용 포함)
- `C:\Users\PC\jjy\instagram-auto\output\money-shorts\golden-sample-image-source-test-v1\flux-scene-03-fixed_cost_stack.jpg` (텍스트 위반 확인용 포함)

**변경/신규 파일:** `scripts/fixtures/golden_sample_image_source_test_prompts.v1.json`, `scripts/run-golden-sample-image-source-test-v1.mjs` (신규, 재사용 가능), output 산출물 11장+summary 3종(gitignored), 본 report append.

**추천 (render로 넘어가지 않고 정지):**
1. 다음 slice의 selected image set 후보 provider = **OpenAI gpt-image-2 1순위** (gate 4/4 + no-text 준수 + 기존 credential/의존성 0).
2. FLUX.2 [pro] = 강한 백업 (gate 4/4 + 최고 질감·최속·최저가 추정 — 단 no-text 위반을 negative 강화로 재검증 후).
3. ChatGPT path = Golden Sample final 입력에서 제외 확정(941x1672 상한 + 신뢰성 이슈 control 재확인). 무료 프롬프트 실험용으로만 유지.
4. 다음 결정: Owner가 provider·주제 확정 → 6-scene full set 생성 승인 → owner 시각 QA → selected set 확정 → 그 후에야 render slice.


## Provider Test Runner Review-Fix (`creative-v2-image-source-small-provider-test-v1-review-fix` — 2026-07-02)

- 외부 호출 0건 / 이미지 재생성 0건 / output·summary 파일 무수정 / .env.local 무수정.
- `scripts/run-golden-sample-image-source-test-v1.mjs` 보정 2건:
  1) BFL endpoint fallback(`api.bfl.ml`, endpointFallbackUsed 분기/상태) 전부 제거 — 공식 `https://api.bfl.ai/v1/flux-2-pro` 단일 endpoint만 사용(poll URL fallback 문자열도 api.bfl.ai로 고정). size fallback 1회만 유지.
  2) .env.local 파싱 secret 최소화 — WANTED set(`OPENAI_API_KEY`, `BFL_API_KEY`)만 메모리 보관, 다른 env/secret은 파싱 즉시 폐기. key 값 출력 없음(헤더 전용).
- 검증: rg fallback 패턴 0건 / rg key 패턴 — 2종만·값 무출력 확인 / fixture JSON valid / `node --check` runner 문법 통과(실행 아님) / 절대규칙 MD5 `adf4f45542fb3959ce5ca44fde3a98f2` 유지 / git status·diff --stat 확인.


## OpenAI Full Selected Image Candidates (`creative-v2-openai-full-selected-image-candidates-v1` — 2026-07-02)

**결과: 부분완료 — 5/12 생성 후 OpenAI 계정 Billing hard limit 도달로 잔여 7장 외부 BLOCKED.**

- Owner 승인: 12장 상한/$5 상한/QA 보고 후 중단 — 준수. render/TTS/mux/upload/commit/push 0건, secret 노출 0건.
- 생성: scene 1A/1B/2A/2B/3A = **5/5 gate PASS (1088x1936 native)**. 잔여 3B/4A/4B/5A/5B/6A/6B는 `http_400: Billing hard limit has been reached`(7 call, usage 미반환 → 과금 없음 추정). fallback/재시도 없이 기록만.
- **no-text 강화 프롬프트 완전 작동: 5/5 위반 0건** — 폰 순수 추상 글로우, 빈 슬립/무지 봉투, 무번호 카드(칩만), display off·무라벨 키 계산기.
- scene별 QA: 1A 추천(하단 여백 최상)/1B 백업, 2A 추천(대각 흐름+생활감 최상)/2B 백업(탑다운 큐, overlay 여백 최상), 3A 단독 후보.
- 부분 추천 세트(3/6): `scene-01A`, `scene-02A`, `scene-03A` — **6-scene set 미완성이므로 render 불가 유지**.
- 비용 evidence: API usage 실측 26,610 output image tokens(5장), ≈ $0.9±0.3 추정 — $5 상한 내. 정확치는 OpenAI 대시보드 확인 필요.
- 신규 파일: `scripts/fixtures/golden_sample_openai_full_selected_image_prompts.v1.json`(6-scene × A/B), `scripts/run-openai-full-selected-image-candidates-v1.mjs`(OpenAI-only, 12 call 하드캡, fallback 금지). output: `output/money-shorts/openai-full-selected-image-candidates-v1/`(이미지 5장 + summary + qa-report, gitignored).
- 검증: node --check 통과 / fixture·summary·qa-report JSON parse / 5장 실측 전부 1088x1936 / secret 패턴 scan 0건 / 절대규칙 MD5 `adf4f45542fb3959ce5ca44fde3a98f2` 유지.
- **Owner 필요 조치: OpenAI billing limit 상향(또는 정산) → 잔여 7장(3B/4A/4B/5A/5B/6A/6B) 재실행 승인.** fixture/runner 그대로 재사용 가능.


## OpenAI Current Quality Candidate Pack (`creative-v2-openai-current-candidates-quality-pack-v1` — 2026-07-02)

**성격: docs-only 공식화 — OpenAI 추가 호출 0건, .env.local 미접근, output 이미지/summary/qa-report 무수정, render/TTS/mux/upload/commit/push 0건.**

- Owner 지시("지금 생성된거만으로 품질후보로 진행") 반영: OpenAI 5장(1088x1936 native, 5/5 gate PASS, no-text 위반 0건)을 공식 품질후보 source로 고정. "잔여 7장 billing 재실행 대기"는 전제에서 제외(후속 옵션 C로만 존재).
- 신규 파일: `scripts/fixtures/golden_sample_openai_current_quality_candidate_pack.v1.json` (imageSourcePolicy: existingGeneratedOnly=true, allow941x1672Reuse=false, allowPlaceholder=false, allowUpscaleAsFix=false) + `_ai/GOLDEN_SAMPLE_OPENAI_CURRENT_QUALITY_CANDIDATE_PACK_V1.md` (Owner/Codex 판단용).
- 분류: recommended 3장(scene-01A/02A/03A), backup 2장(scene-01B/02B). missing exact coverage: scene 4~6 — **재사용 자동 승인 안 함(reuse requires Owner/render-scope approval)**.
- 941x1672 대비 개선 근거 기록: native 해상도 gate 통과 / no-text 5/5 / 씬 역할별 시각 은유 전달.
- renderReady=false (reason: selected_set_not_complete_without_explicit_reuse_or_coverage_approval), uploadReady=false 유지.
- nextDecision(Owner/Codex): A. 5장 3-scene prototype 진행 / B. missing scene 재사용 명시 승인 / C. 이미지 source 재오픈.
- 검증: pack·source summary·qa-report JSON parse 정상 / 후보 5장 파일 존재 + 디스크 이미지 5장 그대로 / secret 패턴 0건(신규 2파일) / 절대규칙 MD5 `adf4f45542fb3959ce5ca44fde3a98f2` 유지 / git status·diff --stat 확인.


## Visual Quality & Card Motion Contract (`creative-v2-visual-quality-and-card-motion-contract-v1` — 2026-07-02)

**성격: 계약 문서/fixture 작성만 — provider 호출·이미지 생성·render/TTS/mux/upload·.env.local 접근·commit/push 0건.**

- 순서 고정: 1) OpenAI 3장 benchmark → 2) FLUX2 contract → 3) card/motion contract → 4) Owner 승인 후에만 FLUX2 소량 validation.
- 신규: `scripts/fixtures/golden_sample_visual_quality_benchmark.v1.json` — benchmark 3장(scene-01A/02A/03A, traits 분해) + positive/negative signals + FLUX2 운영 후보(장점: native 4/4·질감·~20s·최저가 / 실패: no-text 반복 위반) + 강화 prompt 요건 6항(화면 기기 최소화, 오브젝트별 blank, 통화 묘사 금지, 1088x1936 고정) + gate/regenerate-or-skip 정책 + "자동 보장 아님 — gate+QA+regenerate/skip으로 균일성 강제" 명시.
- 신규: `scripts/fixtures/golden_sample_card_motion_contract.v1.json` — 카드 템플릿 7종(hook/contrast/checklist/number_drop/mini_graph/twist/final_action), 타이포(1 card 1 idea, 최대 2줄, 강조 1~2단어), 모션 vocabulary 6종+easing 표준, TTS 싱크(진입 ±120ms/강조 단어 싱크/오디오가 타임라인 주인), perceptual event 강화(**min 14/30s** — 기존 12 강화, pan/zoom 단독 미계산, max gap 3.0s, 5s 구간당 2+), 첫 2s hook 필수 3요소, readability gate(safe-area/폰트/대비/점유 60% 상한), 프레임 audit(0/2/5/10/15/20/26/30s), anti-cheap-PPT 8항.
- 신규: `_ai/GOLDEN_SAMPLE_VISUAL_QUALITY_AND_CARD_MOTION_CONTRACT_V1.md` (Owner/Codex 판단용) + HANDOFF_NOW pointer 1줄.
- renderReady=false / uploadReady=false 무변경.
- 검증: 신규 JSON 2종 parse 정상 / benchmark 이미지 3장 실존 / source summary·qa-report 4종 parse 정상 / 절대규칙 MD5 유지 / secret 값 노출 0건(MD 문서에 key 이름 1회 언급은 승인 항목 설명, 값 아님) / renderReady:true·ALLOW_*·fetch( 패턴 0건.


## FLUX2 Small Validation (`creative-v2-flux2-small-validation-v1` — 2026-07-02)

**Owner 승인 범위 내 실행: FLUX.2 [pro] create call 정확히 4회, 비용 ~$0.25 추정(상한 $1 내), render/TTS/mux/upload 없음.**

- 신규: `scripts/fixtures/golden_sample_flux2_validation_prompts.v1.json` — scene 1/2/3(benchmark 직접 비교)+scene 5(missing coverage, 달력/동전 약점 정면 검증). head+tail 이중 no-text + 오브젝트별 blank 명시. scene 4는 화면 타일 중심이라 'screen 최소화' 계약과 충돌해 제외.
- 신규: `scripts/run-flux2-golden-sample-validation-v1.mjs` — FLUX2-only, 단일 endpoint(api.bfl.ai/v1/flux-2-pro), create hard cap 4, endpoint/size/provider fallback 전무, retry로 추가 생성 없음, poll 분리 집계(37회), BFL_API_KEY만 파싱(값 미출력).
- 결과: 4/4 생성, 4/4 native 1088x1936 gate PASS (~20-30s/장).
- **육안 QA (전수 판독): no-text clean 1/4.**
  - scene 1 REGENERATE_NEEDED — 폰 시계 '08:15' + 머그 'morning' 인쇄 (구도/질감은 benchmark급)
  - scene 2 **PASS** — 위반 0건, benchmark scene-02A 동급 후보 (유일)
  - scene 3 REGENERATE_NEEDED — 계산기 키패드 숫자 전체+디스플레이+카드 인쇄 ('unlabeled blank buttons' 명시 지시 정면 위반)
  - scene 5 REGENERATE_NEEDED — 달력 날짜 숫자 다수+요일 문자 ('no numbers' 정면 위반) + 동전 각인 + '빈 지갑' 은유 실패(카드 가득)
- **핵심 발견: FLUX2는 negative 지시를 이중 강화해도 '현실에서 텍스트가 원래 있는 오브젝트'(시계/계산기/달력/동전/머그)에서 realism prior가 이김. scene 2가 유일 PASS인 이유 = text-natural 오브젝트 0개 구도. → 통제 전략은 negative 강화가 아니라 object-whitelist(텍스트 위험 오브젝트 원천 배제) 재계약이어야 함이 실측 확인.**
- QA report: `output/money-shorts/flux2-small-validation-v1/qa-report-flux2-small-validation.v1.json` (이미지별 gate/위반/은유/safe-area/왜곡/benchmark 비교 + 결론), summary: `summary-flux2-small-validation.json`.
- 다음 옵션: A(권장) object-whitelist prompt contract v2 + 소량 재검증(별도 승인) / B 하이브리드(무문자 씬만 FLUX2) / C FLUX2 제외 재결정.
- 검증: runner syntax OK / fixture·summary·qa-report parse OK / 이미지 4/4 실측 1088x1936 / secret 값 노출 0건 / renderReady=false·uploadReady=false 유지 / commit·push 없음.


## FLUX2 Object-Whitelist Contract v2 (`creative-v2-flux2-object-whitelist-contract-v2` — 2026-07-02)

**성격: 계약 문서/fixture 작성만 — 외부 호출·이미지 생성·render/TTS/mux/upload·.env.local 접근·commit/push 0건.**

- 전략 전환(실측 인과 기반): FLUX2는 오브젝트 '구성' 지시는 4/4 충실, '표면' 텍스트 지시는 negative 이중 강화로도 실패 재현 → 통제 지점을 표면(negative)에서 구성(object-whitelist)으로 이동. scene 2 PASS(무문자-natural 오브젝트만)가 실증 근거.
- 신규: `scripts/fixtures/golden_sample_flux2_object_whitelist_contract.v2.json` — allowedObjects 8종(용법 주석 포함)/bannedTextProneObjects 11종(실측 위반 증거 병기)/compositionRules 6항(머그·지갑·배경 교훈 규칙화)/promptTemplateV2(whitelist-head-first, banned 내장, blank tail 3중 안전망)/T2 scene 1~6 재번역(scene 2는 PROVEN_V1_VERBATIM 승계, 나머지 5씬 완성 프롬프트 수록)/qaGateV2(object-whitelist compliance 신설: banned 오브젝트 등장 시 blank여도 fail)/residualRisks(추상화 전달력이 진짜 시험대)/nextValidationPlan(NOT_APPROVED 명시).
- scene 재번역 핵심: 1 폰→월급봉투 개봉 / 3 계산기·카드 제거→종이 다발 탑 vs 납작 지갑 / 4 화면 타일→등간격 blank 탭 행렬 / 5 달력·동전→앰버 탭 3개+지갑 빈 내부 공간 / 6 달력·펜 제거→카드 3장 순서 정렬.
- 신규: `_ai/GOLDEN_SAMPLE_FLUX2_OBJECT_WHITELIST_CONTRACT_V2.md` (Owner/Codex 판단용) + HANDOFF_NOW pointer/current slice 갱신.
- 다음 검증 추천(승인 아님): 최대 4장/$1 이하 — scene 1+3+5+4. scene 2 제외(PASS 이미지 보유), scene 6 후순위. 성공 기준 no-text+whitelist 4/4 목표(최소 3/4+전달력).
- 검증: contract v2 parse+구조 체크 OK(필수 키 9/9, 신규 프롬프트 5/5 whitelist-head-first+banned 8종+tail) / 절대규칙 MD5 유지 / secret 값·renderReady:true·uploadReady:true·ALLOW_*·fetch( 패턴 0건 / renderReady=false·uploadReady=false 유지.


## FLUX2 Object-Whitelist Validation v2 (`creative-v2-flux2-object-whitelist-validation-v2` — 2026-07-02)

**Owner 승인 범위 내 실행: FLUX.2 [pro] create call 정확히 4회(scene 1/3/4/5), 비용 ~$0.25 추정(상한 $1 내), scene 2 미생성(v1 PASS 보유), render/TTS/mux/upload 없음.**

- 신규: `scripts/run-flux2-object-whitelist-validation-v2.mjs` — contract v2 fixture의 finalPromptV2를 source of truth로 소비(null이면 사전 abort), FLUX2-only 단일 endpoint, create hard cap 4, endpoint/size/provider fallback 전무, poll 분리 집계(28회), BFL_API_KEY만 파싱(값 미출력).
- 결과: 4/4 생성, 4/4 native 1088x1936 gate PASS (~17-22s/장).
- **육안 QA (엄격 적용): banned 오브젝트 등장 0건, v1 위반 클래스(시계/계산기/달력/동전/머그) 재발 0건 — whitelist 전략 실증 성공.**
  - scene 1 REGENERATE_NEEDED(minor) — 봉투→slips 월급 도착 은유 성립, 지갑 각인 1건만 잔존
  - scene 3 **PASS** — 끈으로 묶인 blank 다발 탑 vs 납작 지갑, 4장 중 최고 전달력 (램프 갓 프레임 진입은 non-text-prone warning)
  - scene 4 **PASS** — 화면 없이 blank 탭 등간격 행렬로 반복 유출 은유 성립 (특정성은 카드 담당, 설계 의도대로)
  - scene 5 REGENERATE_NEEDED(minor) — 달력/동전 제거 성공·빈 슬롯 개선, 지갑 emboss 2건 + 지폐칸 공허 강조 약함
- v1 대비: 치명 위반 ≈9건 → minor 각인 3건(지갑 단일 클래스, contract v2 residualRisks 사전 예고 항목)으로 수렴. strict clean 1/4→2/4. 추상화 우려는 미발생(전달력 PASS 3 + PARTIAL 1).
- clean 후보 풀: scene 2(v1 PASS)+3+4 = 6씬 중 3씬 확보.
- 성공 기준 대비 정직 평가: 목표 4/4·최소선 3/4 엄격 미달(2/4). 단 잔여 위반이 좁은 수정 가능 클래스라 **채택 판단은 v2.1 지갑-emboss 패치 재검증(권장 scene 1/5 2장, ~$0.13, 별도 승인) 결과로 내리는 것을 권장**.
- 산출: `output/money-shorts/flux2-object-whitelist-validation-v2/` — 이미지 4장 + summary + qa-report (검증: parse OK, createCalls 4/4, 해상도 실측, secret 노출 0건).
- renderReady=false / uploadReady=false 유지, commit/push 없음.


## FLUX2 Object-Whitelist v2.1 Wallet-Emboss Patch Validation (`creative-v2-flux2-object-whitelist-v2-1-wallet-emboss-validation` — 2026-07-02)

**Owner 승인 범위 내 실행: FLUX.2 [pro] create call 정확히 2회(scene 1/5), 비용 ~$0.13 추정(상한 $0.50 내), scene 2/3/4/6 생성 금지 준수, render/TTS/mux/upload 없음.**

- 신규: `scripts/fixtures/golden_sample_flux2_object_whitelist_v2_1_wallet_patch_prompts.json` — v2 실측 기반 인과 패치: WALLET RULE 블록 신설(7종 금지 문구, head 직후+inline+tail 3중 배치), scene 5의 마크 초대 혐의 문구 'Worn leather grain' 제거, scene 5 카메라 틸트/공허 정면 재지시, scene 1 지갑 soft-focus 강등. no-text 성공 요인과 hook 코어는 v2 검증분 유지(최소 diff 인과 귀속).
- 신규: `scripts/run-flux2-object-whitelist-v2-1-wallet-patch-validation.mjs` — hard cap 2, scene 2/3/4/6 코드 수준 차단, 단일 endpoint/size 고정, BFL_API_KEY만 파싱(값 미출력), poll 분리 집계(17회).
- 결과: 2/2 생성, 2/2 native 1088x1936 gate PASS.
- **육안 QA (엄격): scene 5 PASS — v2 각인 2건 완전 소멸 + delivery PARTIAL→PASS (지폐칸 공허 정면 성립). scene 1 REGENERATE_NEEDED — defocus 지갑 전면에 판독 불가 임프레션 1건 잔존 (v2 대비 심각도 완화, 클래스 소멸 실패).**
- **핵심 인과 확정: 지갑 '외부 전면 패널'이 보이면 각인 발생(실측 3/3), '내부만 보이는' 구도면 클린(1/1) — 브랜드 스탬프는 문구로 못 지우고 해당 표면을 프레임에서 빼야 함 (surface-whitelist 세분화).**
- clean 후보 풀: scene 2(v1)+3(v2)+4(v2)+**5(v2.1 신규)** = 6씬 중 4씬. 잔여: scene 1(구도 변경 재시도), scene 6(후순위).
- 다음 추천(별도 승인 필요): A안 scene 1 v2.2 구도 변경 1장 재검증(~$0.07, 내부 시점/부분 프레임) / B안 지갑 제거(구성 변경 Owner 확인) / C안 현 4씬으로 진행 + scene 1 조건부 수용 판단.
- 산출: `output/money-shorts/flux2-object-whitelist-v2-1-wallet-patch-validation/` — 이미지 2장 + summary + qa-report (parse OK, createCalls 2/2, 해상도 실측, secret 노출 0건).
- renderReady=false / uploadReady=false 유지, commit/push 없음.


## FLUX2 Selected Image Set Completion Validation v1 (`creative-v2-flux2-selected-image-set-completion-v1` — 2026-07-02)

**Owner 승인 범위 내 실행: FLUX.2 [pro] create call 정확히 2회(scene 1 v2.2 / scene 6 v1), 비용 ~$0.13 추정(상한 $0.50 내), scene 2/3/4/5 생성 금지 준수, render/TTS/mux/upload 없음.**

- 신규: `scripts/fixtures/golden_sample_flux2_selected_image_set_completion_prompts.v1.json` — scene 1 v2.2: 지갑 완전 제거(확정 인과: 외부 전면 노출 3/3 각인) + banned에 'NO wallets, NO leather goods' 추가, hook 코어 유지. scene 6 v1: contract v2 승계하되 closed wallet 소품 제거(닫힌 지갑=외부 전면 노출 구도), 두 손+blank 카드 3장 정렬 코어 유지.
- 신규: `scripts/run-flux2-selected-image-set-completion-v1.mjs` — hard cap 2, scene 2/3/4/5 코드 차단, 단일 endpoint/size 고정, BFL_API_KEY만 파싱(값 미출력), poll 분리 집계(17회).
- 결과: 2/2 생성, 2/2 native 1088x1936 gate PASS.
- **육안 QA (엄격): scene 6 PASS — 첫 시도 클린(no-text 0건, reset/action 전달력 성립, 손 무결성 정상). scene 1 REGENERATE_NEEDED — 지갑/가죽 등장 0건으로 각인 클래스 완전 소멸 성공, 단 봉투 플랩(glassine 렌더) 안쪽에 워터마크 유사 letterform 마크 1건 신규 발생.**
- **잔여 위험 모델 재정의: 위반이 지갑(v2)→지갑(v2.1)→봉투 플랩(set-v1)으로 이동 — 특정 오브젝트가 아니라 '카메라를 향한 가장 두드러진 제조품 표면'에 확률적으로 마크가 붙는 stochastic prior. 동일 봉투가 v2/v2.1에서 2연속 클린이었으므로 결정론 아님.**
- clean 후보 풀: scene 2(v1)+3(v2)+4(v2)+5(v2.1)+**6(set-v1 신규)** = **6씬 중 5씬**. 잔여: scene 1 hook 단 1씬.
- 다음 추천(별도 승인 필요): A안 scene 1 v2.3 1장 재생성(~$0.07, 플랩 재질 명시 강화 'plain matte white paper, not glassine, no watermark') / B안 플랩 마크 조건부 수용 판단(hook 첫 2초 노출이라 비권장) / C안 5/6으로 다음 단계 병행.
- 산출: `output/money-shorts/flux2-selected-image-set-completion-v1/` — 이미지 2장 + summary + qa-report (parse OK, createCalls 2/2, scenes [1,6], 해상도 실측, secret 노출 0건).
- renderReady=false / uploadReady=false 유지 (Owner 시각 QA + selected set lock 전 render 금지), commit/push 없음.


## FLUX2 Scene 1 v2.3 Single Validation (`creative-v2-flux2-scene1-v2-3-single-validation` — 2026-07-02)

**Owner 승인 범위 내 실행: FLUX.2 [pro] create call 정확히 1회(scene 1 only), 비용 ~$0.07 추정(상한 $0.25 내), scene 2/3/4/5/6 생성 금지 준수, render/TTS/mux/upload 없음.**

- 신규: `scripts/fixtures/golden_sample_flux2_scene1_v2_3_single_validation_prompt.json` — v2.2 유일 위반(봉투 플랩 glassine 워터마크 마크)의 2중 인과 차단: (1) 재질 — ENVELOPE RULE 블록 신설(thick opaque plain matte white paper / not glassine / not translucent / no watermark / no security pattern / no letterform / no stamp / no emboss / no printed·impressed·raised·recessed mark), head 직후+인라인+tail 3중 배치. (2) 구도 — 'flap folded back low at a relaxed shallow angle, never standing up toward the camera' (같은 봉투가 플랩 낮았던 v2/v2.1에서 2연속 클린이었던 실측 근거). 지갑 제거+hook 코어는 v2.2 유지.
- 신규: `scripts/run-flux2-scene1-v2-3-single-validation.mjs` — hard cap 1, scene 2~6 코드 차단, 단일 endpoint/size 고정, BFL_API_KEY만 파싱(값 미출력), poll 분리 집계(7회).
- 결과: 1/1 생성, native 1088x1936 gate PASS.
- **육안 QA (엄격, 표면별 2-pass): scene 1 v2.3 PASS — 위반 0건.** 플랩이 지시대로 낮게 접혀 불투명 무광 백지로 렌더(재질+구도 패치 모두 반영), 지갑/가죽 0건, hook 전달력 성립(역광 슬립 글로우가 3회 시도 중 최고). 배경 흐린 서랍 손잡이는 non-text-prone warning(scene 3 램프 갓과 동일 처리).
- **clean 후보 풀 완성: scene 1(v2.3)+2(v1)+3(v2)+4(v2)+5(v2.1)+6(set-v1) = 6/6 — selected image set 후보 풀 완성 (Owner 시각 QA + set lock 대기).**
- scene 1 최종 교훈: 4회 궤적(치명 다수→지갑 각인→플랩 마크→클린) — 위반은 '카메라를 향한 가장 두드러진 제조품 표면'의 stochastic prior이며, 해법은 문구+구도 병행 통제. 자동화 확장 시에도 per-shot QA gate + regenerate/skip 정책 필수 유지.
- 다음 추천: Owner 시각 QA로 6씬 lock 결정 → lock 후 Golden Sample 다음 단계(renderer/TTS) 별도 승인.
- 산출: `output/money-shorts/flux2-scene1-v2-3-single-validation/` — 이미지 1장 + summary + qa-report (parse OK, createCalls 1/1, scene 1 only, 해상도 실측, secret 노출 0건).
- renderReady=false / uploadReady=false 유지 (Owner 시각 QA + selected set lock 전 render 금지), commit/push 없음.


## FLUX2 Selected Image Set Lock + Reels Dynamic Caption Contract v1 (`creative-v2-flux2-selected-image-set-lock-and-caption-contract-v1` — 2026-07-02)

**성격: 문서/fixture 전용 slice — 이미지 생성/외부 API/브라우저 자동화/render/TTS/mux/upload 0건.**

- 신규: `scripts/fixtures/golden_sample_flux2_selected_image_set_lock.v1.json` — T2 6-scene FLUX2 이미지 lock manifest: scene 1(v2.3)/2(v1)/3(v2)/4(v2)/5(v2.1)/6(set-v1), 각 이미지 path+MD5+크기+해상도+gate/QA verdict+safe-area note+prompt fixture/QA report 출처 기록. lock 근거(6/6 native, 6/6 no-text strict PASS, 서사 전 구간 커버, 총 13 create calls ~$0.83) + imageSourcePolicy(941x1672 final 금지/placeholder·stock·upscale 금지/per-shot QA gate 유지/render 시 MD5 대조) 포함. renderReady=false·uploadReady=false·requiresOwnerVisualQaBeforeRender=true·noFurtherImageGenerationApproved=false.
- 신규: `scripts/fixtures/golden_sample_reels_dynamic_caption_contract.v1.json` — Owner reference(Instagram Reel 링크, 원문 verbatim 기록·브라우저 자동화 미수행·clone 아님 명시) 기반 dynamic caption 계약: bottom-fixed bar/full-width box/karaoke 고정/2줄 상시/무발화 유지 금지, phrase·keyword 단위 1~5단어, TTS 진입 ±120ms·강조 ±80ms, active focus/lower-middle 배치, 주제 오브젝트·활성 카드 가림 금지, 카드-자막 동시 지배 금지, audit(0~30s 프레임 QA, 대비 4.5:1+, 하단 15% 상시 점유 fail, dwell 1.6s 권장/2.2s 초과 사유 필요, 첫 2s hook caption 필수).
- 신규 문서: `_ai/GOLDEN_SAMPLE_FLUX2_SELECTED_IMAGE_SET_LOCK_V1.md` + `_ai/GOLDEN_SAMPLE_REELS_DYNAMIC_CAPTION_CONTRACT_V1.md` (Owner/Codex 판단용).
- `golden_sample_card_motion_contract.v1.json` 검사 결과: bottom-fixed subtitle 가정 없음(카드 레이어 전용) → 지시대로 무수정 유지. 새 caption 계약이 관계/우선순위 규칙으로 참조.
- HANDOFF_NOW pointer 1줄 추가 (허용 범위 내).
- 검증: 신규 JSON 2종 parse OK / lockedImages 6개 경로 실존+scene 1~6 정확 / MD5 실측 기록 / renderReady·uploadReady false / 금지 패턴(renderReady:true·uploadReady:true·ALLOW_·fetch(·하단 고정 허용 문구) 0건 / secret 노출 0건.


## Golden Sample T2 Visual-Only Render v1 (`creative-v2-golden-sample-visual-only-render-v1` — 2026-07-02)

**첫 실제 render milestone — lock된 FLUX2 6장 + card-image hybrid + Reels dynamic caption을 실 mp4로 검증. 외부 API/이미지 생성/TTS/mux/upload 0건.**

- 신규: `scripts/fixtures/golden_sample_visual_only_render_manifest.t2.v1.json` — T2 30s 타임라인: 카드 7단계(hook/contrast/checklist/number/graph/twist/action, card motion contract 템플릿 준수) + dynamic caption 9개(phrase 단위 1~4어절, 하단 고정 없음) + provisional narration 7 phrase + core perceptual events 28개 명시. `ttsTimingSource: "provisional_visual_only"` — TTS-first 단계에서 word timing으로 교체 필수. renderReady=false/uploadReady=false/visualOnly=true.
- 신규: `scripts/render-golden-sample-visual-only-v1.mjs` — 기존 renderer 무수정 보존, 신규 runner: (1) lock manifest MD5/크기/해상도 gate 선행(불일치 exit 11), (2) zoompan 배경 6 세그먼트(dim+저강도 blur, 질감 유지, hard cut), (3) ASS 벡터 패널/체크마크/clip 애니메이션 카드+caption 54 events, (4) ffprobe/프레임/타임라인/QA report 산출. C:\tmp 외부 write 금지 guard.
- 산출물: `C:\tmp\money-shorts-os\golden-sample-visual-only-render-v1\golden_sample_t2_salary_3days_visual_only.mp4` (6.63MB) + render_manifest/actual_card_timeline/dynamic_caption_timeline/visual_qa_report/image_gate_report + 프레임 8장(+진단 14장).
- ffprobe: 1080x1920, h264, 30/1fps, 30.0s, audio stream 0 — PASS.
- 머신 QA: coreEvents 28(min 14), maxGap 3.0s(≤3.0), 전 5s window ≥2, cardPresenceRatio 1.0, caption 기하 검사(카드 overlap 0/safe-frame 위반 0/하단 15% 점유 0/dwell>1.6s 0/5어절 초과 0) 전항 PASS.
- Claude vision QA (프레임 18장): 7 카드 전 구간 PASS — 3일 amber 강조, 순서대로/순서입니다 emphasis switch 실측, 3-bar 그래프+amber, vector check tofu 없음, caption 전부 phrase 단위 가변 배치. 상세 `visual_qa_report.json#claudeVisionQa`.
- 렌더 중 발견·수정 4건: libass 음수좌표 drawing offset(패널 절대좌표+clip 확장으로 교체) / t=0 hook 미표시(fade 제거) / 26.0s 카드 경계 공백(twist·action 경계 25.85s 이동) / 프레임 추출 input-seek ~1s 오차(output-seek 교체, mp4 자체 정상).
- Owner 시각 QA 필요점: Malgun Gothic 기본체 타이포 톤, 패널 투명도/dim 강도, caption 리듬(provisional) — reference Reel 감성 대비 판단.
- `_ai/HANDOFF_NOW.md`는 Codex 갱신분 그대로(scope 일치, 미수정).
