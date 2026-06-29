# HANDOFF_NOW

## Task ID

`money-shorts-os-image-prompt-text-policy-qa-v1`

## Project

`C:\Users\PC\jjy\instagram-auto`

## Current Checkpoint

- Branch: `codex/source-first-blueprint-clean`
- Latest HEAD: `34eb070 feat(source-facts): add voice narration structural qa` ← **현재 HEAD**
- Current local status: ahead 75, 6 files modified (code 3 + _ai docs 3, 미커밋 image/policy QA slice), `?? piq_diag_out.txt`
- Push: Owner가 명시적으로 `push까지`라고 할 때만.
- Known unrelated untracked file: `piq_diag_out.txt` -- do not read, modify, delete, stage, or commit.
- Local approval data under `.money-shorts-local/` is gitignored local data and must not be read, modified, staged, or committed.

## Current Result

`money-shorts-os-image-prompt-text-policy-qa-v1` — 코드 변경 및 검증 완료, 미커밋 상태.

변경된 코드 파일 3개:
- `lib/source-facts/signal-translation-package-qa.ts`: `imagePromptPolicyWarningCount` summary 필드 추가, 6종 Image Prompt / Text Policy warning check 추가 (image_prompt_lacks_style_anchor / image_prompt_forbidden_style_keyword / image_text_policy_missing_required_forbidden_text / image_prompt_text_policy_not_reflected / visual_objects_missing / visual_template_not_reflected_in_prompt)
- `app/fact-cards/manual/package-preview/SignalTranslationPreviewPanel.tsx`: ScenePackageQaReportPanel summary에 imagePolicy warns 셀 추가
- `scripts/check-signal-translation-preview-static.mjs`: 8 new checks 추가 → **80/80 PASS**

검증 결과:
- `node scripts/check-signal-translation-preview-static.mjs` → **80/80 PASS**
- TypeScript (`npx tsc --noEmit`, output/ 제외) → 오류 없음
- ESLint (변경 2개 ts/tsx 파일) → 오류 없음

## Previous Checkpoints

`money-shorts-os-voice-narration-qa-v1` — checkpoint `34eb070` 완료.
`post-scene-label-safe-zone-contract-doc-sync-v1` — checkpoint `b0acacf` 완료.
`money-shorts-os-scene-label-safe-zone-contract-v1` — checkpoint `67bfd89` 완료.

## Recommended Next Task

1. Codex가 `money-shorts-os-image-prompt-text-policy-qa-v1` 완료 확인 후 checkpoint commit 여부 결정
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
