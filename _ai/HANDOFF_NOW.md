# HANDOFF_NOW

## Task ID

`money-shorts-os-voice-narration-qa-v1`

## Project

`C:\Users\PC\jjy\instagram-auto`

## Current Checkpoint

- Branch: `codex/source-first-blueprint-clean`
- Latest HEAD: `b0acacf docs(state): sync spec docs after scene label safe-zone contract` ← **현재 HEAD**
- Current local status: ahead 74, 6 files modified (code 3 + _ai docs 3, 미커밋 voice/narration QA slice), `?? piq_diag_out.txt`
- Push: Owner가 명시적으로 `push까지`라고 할 때만.
- Known unrelated untracked file: `piq_diag_out.txt` -- do not read, modify, delete, stage, or commit.
- Local approval data under `.money-shorts-local/` is gitignored local data and must not be read, modified, staged, or committed.

## Current Result

`money-shorts-os-voice-narration-qa-v1` — 코드 변경 및 검증 완료, 미커밋 상태.

변경된 코드 파일 3개 + `_ai` docs 3개:
- `lib/source-facts/signal-translation-package-qa.ts`: `voiceNarrationWarningCount` summary 필드 추가, 6종 Voice/Narration warning check 추가 (narration_too_dense_for_duration / voice_pace_mismatch_for_scene_role / voice_pause_missing / voice_pause_not_found_in_narration / hook_narration_lacks_curiosity_marker / action_closing_lacks_check_action_marker)
- `app/fact-cards/manual/package-preview/SignalTranslationPreviewPanel.tsx`: ScenePackageQaReportPanel summary에 voiceNarration warns 셀 추가, spec note 업데이트
- `scripts/check-signal-translation-preview-static.mjs`: 8 new checks 추가 → 72/72 PASS

검증 결과:
- `node scripts/check-signal-translation-preview-static.mjs` → **72/72 PASS**
- TypeScript (`npx tsc --noEmit`) → 오류 없음
- ESLint (변경 3파일) → 오류 없음
- `git diff --check` → whitespace 오류 없음 (LF→CRLF 경고는 Windows 기존 설정, 실제 오류 아님)

## Previous Checkpoints

`post-scene-label-safe-zone-contract-doc-sync-v1` — checkpoint `b0acacf` 완료.
`money-shorts-os-scene-label-safe-zone-contract-v1` — checkpoint `67bfd89` 완료.
`money-shorts-os-caption-system-safe-zone-qa-v1` — checkpoint `fe6437f` 완료.

## Recommended Next Task

1. Codex가 `money-shorts-os-voice-narration-qa-v1` 완료 확인 후 checkpoint commit 여부 결정
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
