# HANDOFF_NOW

## Task ID

Latest completed: `money-shorts-os-image-prompt-text-policy-qa-v1`

## Project

`C:\Users\PC\jjy\instagram-auto`

## Current Checkpoint

- Branch: `codex/source-first-blueprint-clean`
- Latest HEAD: `a16bb80 feat(source-facts): add image prompt text policy structural qa` ← **현재 HEAD**
- Current local status: ahead 76, 5 files modified (code 2 + _ai docs 3, 미커밋 spec-note review-fix slice), `?? piq_diag_out.txt`
- Push: 미실행
- Known unrelated untracked file: `piq_diag_out.txt` -- do not read, modify, delete, stage, or commit.
- Local approval data under `.money-shorts-local/` is gitignored local data and must not be read, modified, staged, or committed.

## Latest Completed Work

`money-shorts-os-image-prompt-text-policy-qa-v1` — checkpoint `a16bb80` 완료.

포함된 변경:
- `lib/source-facts/signal-translation-package-qa.ts`: `imagePromptPolicyWarningCount` summary 필드 추가, 6종 Image Prompt / Text Policy warning check 추가 (image_prompt_lacks_style_anchor / image_prompt_forbidden_style_keyword / image_text_policy_missing_required_forbidden_text / image_prompt_text_policy_not_reflected / visual_objects_missing / visual_template_not_reflected_in_prompt)
- `app/fact-cards/manual/package-preview/SignalTranslationPreviewPanel.tsx`: ScenePackageQaReportPanel summary에 imagePolicy warns 셀 추가
- `scripts/check-signal-translation-preview-static.mjs`: 8 new checks 추가 → 80/80 PASS

검증 결과:
- `node scripts/check-signal-translation-preview-static.mjs` → 80/80 PASS
- TypeScript (`npx tsc --noEmit`, output/ 제외) → 오류 없음
- ESLint (변경 2개 ts/tsx 파일) → 오류 없음

## Recent Checkpoints

- `a16bb80` — `feat(source-facts): add image prompt text policy structural qa` (image/policy QA layer)
- `34eb070` — `feat(source-facts): add voice narration structural qa` (voice/narration QA layer)
- `b0acacf` — `docs(state): sync spec docs after scene label safe-zone contract`
- `67bfd89` — `feat(source-facts): add scene label safe-zone contract`

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
