# HANDOFF_NOW

## Task ID

`post-scene-label-safe-zone-contract-doc-sync-v1`

## Project

`C:\Users\PC\jjy\instagram-auto`

## Current Checkpoint

- Branch: `codex/source-first-blueprint-clean`
- Latest HEAD: `67bfd89 feat(source-facts): add scene label safe-zone contract` ← **현재 HEAD**
- Current local status: ahead 73, clean except `?? piq_diag_out.txt`
- Push: Owner가 명시적으로 `push까지`라고 할 때만.
- Known unrelated untracked file: `piq_diag_out.txt` -- do not read, modify, delete, stage, or commit.
- Local approval data under `.money-shorts-local/` is gitignored local data and must not be read, modified, staged, or committed.

## Current Result

`money-shorts-os-scene-label-safe-zone-contract-v1` — checkpoint `67bfd89` 완료.

포함된 변경:
- `LayoutSafeZone`에 `sceneLabel: CaptionSafeZone` required 필드 추가
- generator/fixture/copy payload/QA helper/preview panel 전체 계약 반영
- static guard 64/64 PASS

`money-shorts-os-caption-system-safe-zone-qa-v1` — checkpoint `fe6437f` 완료.

포함된 변경:
- CAPTION_SYSTEM_V1 bounds check + missing metadata warning
- captionSafeZoneWarningCount summary, ScenePackageQaReportPanel 표시 보강
- static guard 59/59 PASS

Route smoke verification PASS (checkpoint `2b1db95`, 이후 `361de7b` 확인):
- `GET /fact-cards/manual/package-preview 200` — 성공
- server/console/hydration/key errors: 없음
- display-only / no clipboard write: PASS

## Recommended Next Task

1. **다음 content/QA slice** (Codex 결정 대기)

## Forbidden

- Do not touch `piq_diag_out.txt`.
- Do not read, modify, delete, stage, or commit `.money-shorts-local/` data.
- Do not stage/commit/push unless explicitly approved later.
- Do not add dependencies or edit lockfiles.
- Do not edit `.env*`, secrets, deployment config, DB/Supabase schema, migrations, or API credentials.
- Do not call OpenAI/GPT, Gemini, Veo, ElevenLabs, KOSIS, OpenDART, FRED, ECOS live, or any live API.
- Do not run ffmpeg, render, export, upload, post, deploy, or write to `output/`.
- Do not write to OS clipboard, `localStorage`, or `sessionStorage`.
