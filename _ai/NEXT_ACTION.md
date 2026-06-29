# Next Action

## 2026-06-29 현재 — inflation fixture + template 추가

상태: **MONEY_SHORTS_OS_INFLATION_FIXTURE_ADDED**

최신 HEAD:

- `af84985 feat(package-preview): add generated copy payload preview` ← 최신 checkpoint
- `19ec7d6 feat(package-preview): add caption scene QA coverage`
- `c34ef6f feat(package-preview): add signal translation preview panel`
- branch: `codex/source-first-blueprint-clean` (ahead 63)
- push: 미실행
- known local extra: `piq_diag_out.txt` untracked, 작업 무관, 제외 유지
- uncommitted: `lib/source-facts/signal-translation-generator.ts`, `lib/source-facts/signal-translation-fixtures.ts`

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

4. **`money-shorts-os-brief-scene-card-third-fixture-v1`** (uncommitted)
   - `inflation_life_economy_v1` template id 추가 (`SignalTranslationTemplateId` 유니온 확장).
   - `isInflationFactCard()` 감지 함수 추가 (물가/소비자물가/cpi/inflation/consumer price/price index).
   - `createInflationBrief()` — 물가 계열 SignalTranslationBrief.
   - `createInflationSceneCards()` — fixed 6 SceneCards, absolute-timeline captionBlocks.
   - `inflationGeneratedSignalTranslationPackage` export 추가 (기존 `inflationFactCard` 재사용).
   - `MOCK_SIGNAL_TRANSLATION_BRIEFS`, `MOCK_SCENE_CARD_SETS` 업데이트.
   - ESLint/TypeScript/runtime validation ALL PASSED.

현재 상태:

- display-only 원칙 유지 (mutation/persistence/external API/asset generation/clipboard write 없음).
- 기존 gate/ledger/risk review/final QA/clipboard/publishability 흐름 변경 없음.
- ESLint/TypeScript 검증 passed.

미실행 검증:

- route smoke: 미실행. `.money-shorts-local/` 접근 Owner 미허용 때문에 hydration/key warning 런타임 확인 불가.

다음 safe work unit 후보:

1. **`money-shorts-os-package-preview-third-fixture-panel-v1`** (추천)
   - `inflationGeneratedSignalTranslationPackage`를 `SignalTranslationPreviewPanel`에 추가.
   - Owner가 환율/금리/물가 세 generated package를 나란히 inspection 가능하게 함.

2. **route smoke verification** (선택사항)
   - Owner가 `.money-shorts-local/` 접근을 명시적으로 허용할 때만 진행.
   - hydration/key warning 런타임 확인, layout 렌더링 QA.

금지 유지:

- `piq_diag_out.txt` 접근
- `.money-shorts-local/` 접근
- push/deploy/env/secret/dependency/DB 변경
- render/output/ffmpeg/upload 실행
- GPT/Gemini/Veo/ElevenLabs/image generation/live API 호출
- OS clipboard write
- legacy `/review`, render/upload/generate API surface 변경
