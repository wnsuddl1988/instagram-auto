# Next Action

## 2026-06-29 현재 — Scene Package QA helper review-fix 완료 (미commit)

상태: **MONEY_SHORTS_OS_SCENE_PACKAGE_QA_HELPER_REVIEW_FIXED**

최신 HEAD:

- `1a268ba test(package-preview): add signal translation display-only static guard` ← 최신 checkpoint
- `f288969 feat(package-preview): add inflation package to signal translation panel`
- `012a25c feat(source-facts): add inflation life economy scene fixture`
- branch: `codex/source-first-blueprint-clean` (ahead 66)
- push: 미실행
- known local extra: `piq_diag_out.txt` untracked, 작업 무관, 제외 유지
- working tree: uncommitted (`_ai/` docs + QA helper slice)

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

7. **`money-shorts-os-scene-package-qa-helper-v1-review-fix`** (미commit)
   - `lib/source-facts/signal-translation-package-qa.ts` 신규 추가.
   - `MoneyShortsScenePackageQaIssue`, `MoneyShortsScenePackageQaReport`, `buildMoneyShortsScenePackageQaReport()` export.
   - 기존 `validateSceneCardsForGeneration()` 재사용 (scene validation).
   - **review-fix**: citation validation은 `scenePackage.citationValidation`(generator가 FactCard 기준으로 계산한 source-of-truth) 재사용. `validateSignalTranslationCitationIds` 직접 호출 제거.
   - Owner/QA 레이어 warning: hookTitle lines / spokenCaption length / imagePrompt / imageTextPolicy / voiceTiming emphasisWords / layoutSafeZone / sourceNote / riskNotes / brief 4개 필드.
   - risk keyword scan (structural): 13 keywords, warning-only, gate 변경 없음.
   - `lib/source-facts/signal-translation-fixtures.ts`: 3개 QA report fixture export 추가.
   - `lib/source-facts/index.ts`: `signal-translation-package-qa` export 추가.
   - TypeScript / ESLint `--max-warnings=0` PASS.

현재 상태:

- display-only 원칙 유지 (mutation/persistence/external API/asset generation/clipboard write 없음).
- 기존 gate/ledger/risk review/final QA/clipboard/publishability 흐름 변경 없음.
- ESLint/TypeScript 검증 passed.

미실행 검증:

- route smoke: 미실행. `.money-shorts-local/` 접근 Owner 미허용 때문에 hydration/key warning 런타임 확인 불가.

다음 safe work unit 후보:

1. **checkpoint commit** (권장)
   - 포함 파일: `lib/source-facts/signal-translation-package-qa.ts`, `lib/source-facts/signal-translation-fixtures.ts`, `lib/source-facts/index.ts`, `_ai/` docs 3개.
   - 제외: `piq_diag_out.txt`, UI/route 파일.
   - `safe checkpoint commit authorized` 문구와 포함/제외 파일 명시 필요.

2. **package-preview QA report panel 연결** (선택사항)
   - `SignalTranslationPreviewPanel`에 `MoneyShortsScenePackageQaReport` display-only 패널 추가.
   - display-only 원칙 유지, Codex 결정 대기.

3. **route smoke verification** (선택사항)
   - Owner가 `.money-shorts-local/` 접근을 명시적으로 허용할 때만 진행.

금지 유지:

- `piq_diag_out.txt` 접근
- `.money-shorts-local/` 접근
- push/deploy/env/secret/dependency/DB 변경
- render/output/ffmpeg/upload 실행
- GPT/Gemini/Veo/ElevenLabs/image generation/live API 호출
- OS clipboard write
- legacy `/review`, render/upload/generate API surface 변경
