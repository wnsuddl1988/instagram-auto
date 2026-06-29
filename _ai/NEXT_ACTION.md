# Next Action

## 2026-06-29 현재 — package preview signal translation + caption scene QA

상태: **MONEY_SHORTS_OS_CAPTION_SCENE_QA_COVERAGE_ADDED**

최신 HEAD:

- `19ec7d6 feat(package-preview): add caption scene QA coverage` ← 최신 checkpoint
- `c34ef6f feat(package-preview): add signal translation preview panel` ← 이전 checkpoint
- branch: `codex/source-first-blueprint-clean` (ahead 62)
- push: 미실행
- known local extra: `piq_diag_out.txt` untracked, 작업 무관, 제외 유지

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

현재 상태:

- display-only 원칙 유지 (mutation/persistence/external API/asset generation/clipboard write 없음).
- 기존 gate/ledger/risk review/final QA/clipboard/publishability 흐름 변경 없음.
- ESLint/TypeScript 검증 passed.

미실행 검증:

- route smoke: 미실행. `.money-shorts-local/` 접근 Owner 미허용 때문에 hydration/key warning 런타임 확인 불가.

현재 uncommitted slice:

- `money-shorts-os-generated-package-copy-payload-v1`
- `lib/source-facts/signal-translation-copy-payload.ts` (신규) — pure deterministic helper, no clipboard/DB/API.
- `lib/source-facts/index.ts` (수정) — export 추가.
- `app/fact-cards/manual/package-preview/SignalTranslationPreviewPanel.tsx` (수정) — GeneratedCopyPayloadPreview 컴포넌트 추가. read-only textarea + "no clipboard write" 명시.
- display-only 원칙 유지 (clipboard write 없음, copy button 없음, Server Action 없음).
- ESLint/TypeScript 검증 passed.

다음 safe work unit 후보:

1. `money-shorts-os-brief-scene-card-third-fixture-v1`
   - 물가 fixture를 추가해 generator coverage를 검증.

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
