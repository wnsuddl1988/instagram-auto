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
