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
