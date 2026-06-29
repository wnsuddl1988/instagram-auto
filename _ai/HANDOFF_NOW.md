# HANDOFF_NOW

## Task ID

`money-shorts-os-scene-label-safe-zone-contract-v1`

## Project

`C:\Users\PC\jjy\instagram-auto`

## Current Checkpoint

- Branch: `codex/source-first-blueprint-clean`
- Latest HEAD: `fe6437f feat(source-facts): add caption system v1 safe-zone qa` ← **현재 HEAD**
- Current local status: ahead 72, sceneLabel safe-zone contract slice uncommitted (7 files)
- Push: Owner가 명시적으로 `push까지`라고 할 때만.
- Known unrelated untracked file: `piq_diag_out.txt` -- do not read, modify, delete, stage, or commit.
- Local approval data under `.money-shorts-local/` is gitignored local data and must not be read, modified, staged, or committed.

## Current Result

`money-shorts-os-caption-system-safe-zone-qa-v1` — Caption System V1 safe-zone QA layer 추가 (uncommitted).

변경 파일:
- `lib/source-facts/signal-translation.ts` — LayoutSafeZone에 `sceneLabel: CaptionSafeZone` 추가
- `lib/source-facts/signal-translation-generator.ts` — createLayoutSafeZone에 `CAPTION_SYSTEM_V1.sceneLabel` 추가
- `lib/source-facts/signal-translation-fixtures.ts` — 6개 layoutSafeZone에 `sceneLabel` 추가
- `lib/source-facts/signal-translation-copy-payload.ts` — layoutSafeZone clone에 `sceneLabel: { ...s.layoutSafeZone.sceneLabel }` 추가
- `lib/source-facts/signal-translation-package-qa.ts` — per-scene sceneLabel safe-zone check 추가 (caption_system_v1_scene_label_out_of_range)
- `app/fact-cards/manual/package-preview/SignalTranslationPreviewPanel.tsx` — layoutSafeZone 표시에 `sceneLabel` 행 추가
- `scripts/check-signal-translation-preview-static.mjs` — 5 new checks → 64/64 PASS

검증:
- `node scripts/check-signal-translation-preview-static.mjs` → 64/64 PASS
- TypeScript (project tsconfig.json): 변경 파일 에러 없음
- ESLint: 에러 없음
- `git diff --check`: whitespace error 없음 (LF→CRLF 경고는 Windows 기존 설정, 무해)

Route smoke verification PASS (checkpoint `2b1db95`, 이후 확인됨 `361de7b`):
- `GET /fact-cards/manual/package-preview 200` — 성공
- server error / 500 / runtime exception: 없음
- browser console error: 없음
- browser console warning: 없음
- hydration error: 없음
- React key warning: 없음

패널 확인:
- Signal Translation / 6 Scene Cards Preview: PASS (3 packages × 10 sections = 30 details panels)
- Sample 1/2/3 (환율/금리/물가) + all QA panels: PASS
- `qaReport.isValid` in HTML: PASS (details closed 포함)
- MOCK / NOT PUBLISHABLE: PASS
- display-only / no clipboard write: PASS

display-only 원칙:
- clipboard button: 없음
- textarea 4개 — 3개 readOnly:true (JSON payload), 1개 readOnly:false (기존 ledger textarea, Signal Translation 무관)
- 버튼 5개 — 전부 기존 ledger 컨트롤 (pending/approved/rejected/revision_requested, Mock Fact Card disabled)

`.money-shorts-local/`:
- 앱이 route load 중 ledger 데이터 read-only 접근
- write 없음

## Recommended Next Task

1. **checkpoint commit** — sceneLabel safe-zone contract slice commit (7 code files + _ai docs)
2. **다음 content/QA slice** (Codex 결정 대기)

## Forbidden

- Do not touch `piq_diag_out.txt`.
- Do not read, modify, delete, stage, or commit `.money-shorts-local/` data.
- Do not stage/commit/push unless explicitly approved later.
- Do not add dependencies or edit lockfiles.
- Do not edit `.env*`, secrets, deployment config, DB/Supabase schema, migrations, or API credentials.
- Do not call OpenAI/GPT, Gemini, Veo, ElevenLabs, KOSIS, OpenDART, FRED, ECOS live, or any live API.
- Do not run ffmpeg, render, export, upload, post, deploy, or write to `output/`.
- Do not write to OS clipboard, `localStorage`, or `sessionStorage`.
