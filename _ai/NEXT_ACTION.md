# Next Action

## 2026-06-27 현재 — package preview signal translation panel v1

상태: **MONEY_SHORTS_OS_SIGNAL_TRANSLATION_PREVIEW_PANEL_ADDED**

최신 HEAD:

- `f05625f feat: add signal translation scene card foundation` ← 현재 committed checkpoint
- branch: `codex/source-first-blueprint-clean` (ahead 60)
- push: 미실행
- known local extra: `piq_diag_out.txt` untracked, 작업 무관, 제외 유지

현재 uncommitted slice:

- `money-shorts-os-package-preview-signal-translation-panel-v1`
- package-preview 화면에 display-only Signal Translation Brief / fixed 6 Scene Cards inspection panel 추가.
- 연결 fixture:
  - `exchangeRateGeneratedSignalTranslationPackage`
  - `interestRateGeneratedSignalTranslationPackage`
- 기존 Owner gate, risk review, final QA, ledger overlay, clipboard 흐름은 변경하지 않음.
- 신규 패널은 fixture inspection layer이며 편집, 저장, DB/persistence, AI 생성, image generation, ElevenLabs, render/upload를 수행하지 않음.

검증 상태:

- targeted ESLint: passed
- targeted TypeScript compiler API check: passed
- `git diff --check`: whitespace error 없음. LF→CRLF working-copy warning만 표시됨.
- full project `tsc --project tsconfig.json`: 기존 `output/.../qa/seg_B*.ts` binary-like generated files 때문에 실패. 이번 UI slice 오류는 아님.
- route smoke: 미실행. package-preview route는 local approval ledger 접근 경로가 있어 `.money-shorts-local/` 접근 금지 조건과 충돌 가능성이 있음.

다음 safe work unit 후보:

1. `money-shorts-os-package-preview-caption-scene-qa-v1`
   - Scene Card / Caption / ImagePrompt / VoiceTiming 일치성 QA를 preview에 더 명확히 표시.
   - 현재 패널 위에 read-only QA visibility를 더하는 자연스러운 다음 slice.

2. `money-shorts-os-generated-package-copy-payload-v1`
   - Scene Cards 기반 복사용 package payload를 생성.
   - clipboard write 없이 화면 표시/텍스트 payload 생성까지만 허용.

3. `money-shorts-os-brief-scene-card-third-fixture-v1`
   - 물가 fixture를 추가해 generator coverage를 검증.

금지 유지:

- `piq_diag_out.txt` 접근
- `.money-shorts-local/` 접근
- push/deploy/env/secret/dependency/DB 변경
- render/output/ffmpeg/upload 실행
- GPT/Gemini/Veo/ElevenLabs/image generation/live API 호출
- OS clipboard write
- legacy `/review`, render/upload/generate API surface 변경
