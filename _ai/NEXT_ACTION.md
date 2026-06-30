# Next Action

## 2026-06-30 현재 — Prompt Compiler Preflight Contract V1 Checkpoint 완료

상태: **MONEY_SHORTS_OS_PROMPT_COMPILER_PREFLIGHT_CONTRACT_V1_COMMITTED**

최신 HEAD:

- `b58ca20 feat(visual-system): add prompt compiler preflight contract v1` ← **현재 HEAD**
- `1c94e44 feat(visual-system): add rule contract v1 and static guard`
- `a16bb80 feat(source-facts): add image prompt text policy structural qa`
- branch: `codex/source-first-blueprint-clean` (ahead 108)
- working tree: tracked clean. untracked `_ai/CONTEXT_TRANSFER_CODEX.md`, `piq_diag_out.txt` 제외

완료된 slice:

1. **`money-shorts-os-package-preview-signal-translation-panel-v1`** (c34ef6f)
   - package-preview 화면에 display-only Signal Translation Brief / fixed 6 Scene Cards inspection panel 추가.
   - 연결 fixture: `exchangeRateGeneratedSignalTranslationPackage`, `interestRateGeneratedSignalTranslationPackage`
   - display-only 원칙 유지, 기존 gate/ledger/risk review/final QA/clipboard/publishability 흐름 무변경.

2. **`money-shorts-os-package-preview-caption-scene-qa-v1`** (19ec7d6)
   - SignalTranslationPreviewPanel에 display-only Caption / Scene QA Coverage 패널 추가.
   - Package 단위 coverage (captionBlocks, imagePrompt, voiceTiming, layoutSafeZone, sourceCitationIds, riskNotes).
   - Per-scene checklist 테이블 (narration, caption, blocks count, imagePrompt, voice, layout, citIds, sourceNote, risk count).
   - sourceNote coverage review-fix 포함.
   - BulletList/ChipList key 안정성 보강 (index 포함 key로 중복 우려 제거).
   - BriefSummary를 `<details>` collapse로 변경해 패널 길이 완화.

3. **`money-shorts-os-generated-package-copy-payload-v1`** (af84985)
   - `lib/source-facts/signal-translation-copy-payload.ts` 신규 추가 — pure deterministic helper, no clipboard/DB/API.
   - `buildMoneyShortsGeneratedCopyPayload()` 구현 — MoneyShortsScenePackage → MoneyShortsGeneratedCopyPayload 변환.
   - `stringifyMoneyShortsGeneratedCopyPayload()` 구현 — JSON.stringify wrapper.
   - `MoneyShortsGeneratedCopyPayload` schema version 상수 정의.
   - `imageTextPolicy` payload 포함 + `layoutSafeZone` nested clone review-fix 적용.
   - SignalTranslationPreviewPanel에 GeneratedCopyPayloadPreview 컴포넌트 추가.
   - read-only `<textarea>` JSON preview 표시 (copy button 없음, clipboard write 없음).
   - 기존 gate/ledger/risk review/final QA/clipboard/publishability 흐름 무변경.

4. **`money-shorts-os-brief-scene-card-third-fixture-v1`** (012a25c)
   - `inflation_life_economy_v1` template id 추가 (`SignalTranslationTemplateId` 유니온 확장).
   - `isInflationFactCard()` 감지 함수 추가 (물가/소비자물가/cpi/inflation/consumer price/price index).
   - `createInflationBrief()` — 물가 계열 SignalTranslationBrief.
   - `createInflationSceneCards()` — fixed 6 SceneCards, absolute-timeline captionBlocks.
   - `inflationGeneratedSignalTranslationPackage` export 추가 (기존 `inflationFactCard` 재사용).
   - `MOCK_SIGNAL_TRANSLATION_BRIEFS`, `MOCK_SCENE_CARD_SETS` 업데이트.
   - ESLint/TypeScript/runtime validation ALL PASSED.

5. **`money-shorts-os-package-preview-third-fixture-panel-v1`** (f288969)
   - `page.tsx`에 `inflationGeneratedSignalTranslationPackage` import 추가.
   - `packages` 배열에 세 번째 element로 추가 → Sample 1(환율)/Sample 2(금리)/Sample 3(물가) 나란히 표시.
   - `SignalTranslationPreviewPanel` 컴포넌트 무변경.
   - ESLint/TypeScript 검증 PASSED.

6. **`money-shorts-os-signal-translation-preview-static-guard-v1`** (1a268ba)
   - `scripts/check-signal-translation-preview-static.mjs` 신규 추가.
   - 검증 대상 4파일: `page.tsx`, `SignalTranslationPreviewPanel.tsx`, `signal-translation-fixtures.ts`, `signal-translation-copy-payload.ts`.
   - 35 checks: page.tsx integration / panel display-only forbidden+required / fixtures exports / copy payload symbols+forbidden.
   - `node scripts/check-signal-translation-preview-static.mjs` → 35/35 PASS.
   - checkpoint commit `1a268ba test(package-preview): add signal translation display-only static guard` 완료.

7. **`money-shorts-os-scene-package-qa-helper-v1`** (92fdef3)
   - `lib/source-facts/signal-translation-package-qa.ts` 신규 추가.
   - `MoneyShortsScenePackageQaIssue`, `MoneyShortsScenePackageQaReport`, `buildMoneyShortsScenePackageQaReport()` export.
   - 기존 `validateSceneCardsForGeneration()` 재사용 (scene validation).
   - citation validation: `scenePackage.citationValidation`(generator 계산 source-of-truth) 재사용.
   - Owner/QA 레이어 warning: hookTitle lines / spokenCaption length / imagePrompt / imageTextPolicy / voiceTiming emphasisWords / layoutSafeZone / sourceNote / riskNotes / brief 4개 필드.
   - risk keyword scan (structural): 13 keywords, warning-only, gate 변경 없음.
   - `lib/source-facts/signal-translation-fixtures.ts`: 3개 QA report fixture export 추가.
   - `lib/source-facts/index.ts`: `signal-translation-package-qa` export 추가.
   - checkpoint commit `92fdef3 feat(source-facts): add scene package QA helper` 완료.

8. **`money-shorts-os-package-preview-qa-report-panel-v1`** (eac702c)
   - `SignalTranslationPreviewPanel`에 `ScenePackageQaReportPanel` display-only component 추가.
   - `buildMoneyShortsScenePackageQaReport(scenePackage)` 인라인 호출 후 렌더.
   - `<details>` default closed, summary rows, errors/warnings lists 표시.
   - "not a publication gate" 명시 문구 포함.
   - `scripts/check-signal-translation-preview-static.mjs`: 13 new checks 추가 → 48/48 PASS.
   - checkpoint commit `eac702c feat(package-preview): add scene package QA report panel` 완료.

9. **`money-shorts-os-generated-copy-payload-qa-report-v1`** (b2dadee)
   - `signal-translation-copy-payload.ts`: `scenePackageQaReport` 필드 추가 (additive, schema version 유지).
   - `GeneratedCopyPayloadPreview` metadata grid에 QA valid/errors/warnings 칸 2개 추가 (display-only).
   - static guard 50/50 PASS (기존 48 + 2 new).
   - checkpoint commit `b2dadee feat(source-facts): include QA report in generated copy payload` 완료.

10. **`money-shorts-os-package-preview-route-smoke-v1`** (2b1db95)
    - `/fact-cards/manual/package-preview` HTTP 200 PASS.
    - server/console/hydration/key errors: 없음.
    - 30 details panels (3 packages × 10), `qaReport.isValid` HTML 포함.
    - display-only 원칙 유지 (clipboard button 없음, 3 readOnly textarea + 1 기존 ledger textarea).
    - 기존 gate/ledger/publishability 흐름 무변경 확인.
    - `.money-shorts-local/`: 앱 read-only 접근, write 없음.
    - checkpoint commit `2b1db95 docs(state): record package preview route smoke pass` 완료.

11. **`money-shorts-os-caption-system-safe-zone-qa-v1`** (fe6437f)
    - `signal-translation-package-qa.ts`: CAPTION_SYSTEM_V1 import, `checkSafeZoneAgainstPolicy()` helper (missing metadata warning 포함), `captionSafeZoneWarningCount` summary field.
    - per-scene safe-zone check 3종 (spokenCaption/hookTitle/sourceNote vs CAPTION_SYSTEM_V1 bounds).
    - `isValid` 의미 유지 — safe-zone 문제는 warning-only, gate 변경 없음.
    - `SignalTranslationPreviewPanel.tsx`: ScenePackageQaReportPanel summary에 captionSafeZone warns 셀 추가 (display-only).
    - static guard 59/59 PASS (50 + 9 new).
    - checkpoint commit `fe6437f feat(source-facts): add caption system v1 safe-zone qa` 완료.

12. **`money-shorts-os-scene-label-safe-zone-contract-v1`** (67bfd89)
    - `signal-translation.ts`: LayoutSafeZone에 `sceneLabel: CaptionSafeZone` required 필드 추가.
    - `signal-translation-generator.ts`: createLayoutSafeZone에 `sceneLabel: CAPTION_SYSTEM_V1.sceneLabel` 추가.
    - `signal-translation-fixtures.ts`: 6개 layoutSafeZone에 `sceneLabel: CAPTION_SYSTEM_V1.sceneLabel` 추가.
    - `signal-translation-copy-payload.ts`: layoutSafeZone clone에 `sceneLabel: { ...s.layoutSafeZone.sceneLabel }` 추가.
    - `signal-translation-package-qa.ts`: per-scene sceneLabel safe-zone check 추가 (warning-only, caption_system_v1_scene_label_out_of_range).
    - `SignalTranslationPreviewPanel.tsx`: layoutSafeZone 표시에 sceneLabel 행 추가.
    - static guard 64/64 PASS (59 + 5 new).
    - checkpoint commit `67bfd89 feat(source-facts): add scene label safe-zone contract` 완료.

13. **`post-scene-label-safe-zone-contract-doc-sync-v1`** (b0acacf)
    - `_ai/HANDOFF_NOW.md`, `_ai/NEXT_ACTION.md`, `_ai/PROJECT_STATE.md` → `67bfd89`/ahead 73 기준으로 정정.
    - `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`: layoutSafeZone 설명에 Scene Label 항목 추가.
    - `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`: Scene Card Data Boundary에 sceneLabel 추가.
    - checkpoint commit `b0acacf docs(state): sync spec docs after scene label safe-zone contract` 완료.

14. **`money-shorts-os-voice-narration-qa-v1`** (34eb070)
    - `signal-translation-package-qa.ts`: `voiceNarrationWarningCount` summary 필드 추가, 6종 Voice/Narration warning check 추가.
      - `narration_too_dense_for_duration`: narration.length > durationSec × 18
      - `voice_pace_mismatch_for_scene_role`: 신호/해석/생활영향/전망/행동 씬에서 pace="fast" 경고
      - `voice_pause_missing`: voiceTiming.pauses.length === 0 경고
      - `voice_pause_not_found_in_narration`: pause text가 narration에 없을 때 경고
      - `hook_narration_lacks_curiosity_marker`: hook씬 narration에 ?, 까요, 일까요, 무슨, 왜, 진짜 없을 때 경고
      - `action_closing_lacks_check_action_marker`: action_closing씬 narration에 점검, 확인, 살펴, 체크, 정리 없을 때 경고
    - `SignalTranslationPreviewPanel.tsx`: ScenePackageQaReportPanel summary에 voiceNarration warns 셀 추가, spec note 업데이트.
    - `scripts/check-signal-translation-preview-static.mjs`: 8 new checks 추가 → **72/72 PASS**.
    - 검증: TypeScript 오류 없음, ESLint 오류 없음, static guard 72/72 PASS.
    - checkpoint commit `34eb070 feat(source-facts): add voice narration structural qa` 완료.

15. **`money-shorts-os-image-prompt-text-policy-qa-v1`** (a16bb80)
    - `signal-translation-package-qa.ts`: `imagePromptPolicyWarningCount` summary 필드 추가, 6종 Image Prompt / Text Policy warning check 추가.
      - `image_prompt_lacks_style_anchor`: styleAnchor keyword 2개 미만 경고 (editorial, life-economy, report, signal card, clue, connection lines, off-white, charcoal, warm yellow)
      - `image_prompt_forbidden_style_keyword`: 금지 스타일 키워드 감지 경고
      - `image_text_policy_missing_required_forbidden_text`: forbiddenText에 required 카테고리 누락 경고 (unverified numbers, investment return claims, extra subtitles, source text not backed by citation)
      - `image_prompt_text_policy_not_reflected`: allowedText 비어있는데 prompt에 text restriction 힌트 없을 때 경고
      - `visual_objects_missing`: visualObjects 배열 비어있을 때 경고
      - `visual_template_not_reflected_in_prompt`: visualTemplateId에 맞는 keyword가 imagePrompt에 없을 때 경고
    - `SignalTranslationPreviewPanel.tsx`: ScenePackageQaReportPanel summary에 imagePolicy warns 셀 추가.
    - `scripts/check-signal-translation-preview-static.mjs`: 8 new checks 추가 → **80/80 PASS**.
    - 검증: TypeScript 오류 없음, ESLint 오류 없음, static guard 80/80 PASS.
    - checkpoint commit `a16bb80 feat(source-facts): add image prompt text policy structural qa` 완료.

16. **`money-shorts-os-visual-system-rule-contract-v1`** (1c94e44)
    - Visual Matrix를 고정 오브젝트표가 아닌 Rule Contract 기반 규칙 시스템으로 재정의.
    - `scripts/fixtures/premium-editorial-visual-system.rule-contract.v1.json` 신규: schemaVersion / sceneRoleContract(6 roles) / visualCategoryPool(12) / objectFamilyPool(7) / diversityRules(9) / promptCompilerContract(입출력 계약만, isImplementation=false) / visualQaContract / failureRouting / chatgptVeoDataCardPolicy / imageTextSourceOfTruthPolicy.
    - `scripts/check-premium-editorial-visual-system-static.mjs` 신규: 76 checks, GUARD OK.
    - `_ai/MONEY_SHORTS_OS_VISUAL_SYSTEM_V1.md` 보강: 헤더 status + §5 경고 + §5-A Rule Contract 섹션 추가.
    - 실패 Scene 3~6 v1 helper 분기(`ecos-live-yohan-koo-premium-editorial-scenes-3-6-v1`) 폐기 (git restore).
    - 승인 Scene 1 fixed + Scene 2 v2 anchor 유지.
    - Codex review fix: category pinning 체크 강화(usefulForRoles >= 2), `market_shopping_moment` + `closing_action_cue` role 보완.
    - checkpoint commit `1c94e44 feat(visual-system): add rule contract v1 and static guard` 완료.

17. **`money-shorts-os-prompt-compiler-preflight-contract-v1`** (b58ca20)
    - Rule Contract consumer 6-scene data-only preflight fixture 생성.
    - `scripts/fixtures/premium-editorial-prompt-compiler-preflight.v1.json` 신규: 6 scenes(sceneRole/selectedVisualCategory/selectedObjectFamilies/spaceType/cameraDistance/compositionProfile/graphicLayerMode/forbiddenObjects/forbiddenCompositions/previousSceneVisualHistoryInput/qaExpectationIds), diversityAudit.
    - `scripts/check-premium-editorial-prompt-compiler-preflight-static.mjs` 신규: 110 checks — per-family usefulForCategories 직접 연결, diversityAudit.objectFamilySequence consistency, non-empty arrays, self-guard, 금지 필드(finalPrompt/promptText/generatedPrompt/chatgptPrompt) 없음 확인.
    - Prompt Compiler 구현 없음. finalPrompt 없음. 이미지 생성 없음. ChatGPT/Playwright 실행 없음.
    - Review fix 3회 포함: self-guard regex 교체, family-category mismatch 수정(4 scenes secondary family 제거), notes/audit 일관성 정리.
    - checkpoint commit `b58ca20 feat(visual-system): add prompt compiler preflight contract v1` 완료.

현재 상태:

- Prompt Compiler Preflight Contract v1 checkpoint `b58ca20` 완료. tracked clean (ahead 108).
- push는 미실행.

다음 safe work unit 후보:

1. **후보 A**: Prompt Compiler v1 implementation boundary/design handoff 준비 (이미지 생성 없음, finalPrompt 생성 전 단계).
2. **후보 B**: Owner-approved Scene 1/2 anchor 기준으로 Scene 3~6 재생성 전 visual QA sampling plan 준비.
   - ⚠️ 이미지 생성 / ChatGPT / Playwright 실행은 Owner 명시 승인 전 금지.
