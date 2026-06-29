# HANDOFF_NOW

## Task ID

`money-shorts-os-generated-copy-payload-qa-report-v1`

## Project

`C:\Users\PC\jjy\instagram-auto`

## Current Checkpoint

- Branch: `codex/source-first-blueprint-clean`
- Latest HEAD: `eac702c feat(package-preview): add scene package QA report panel` (uncommitted work above)
- Current local status: ahead 68, 3 code files + 3 _ai docs modified
- Push: do not push.
- Known unrelated untracked file: `piq_diag_out.txt` -- do not read, modify, delete, stage, or commit.
- Local approval data under `.money-shorts-local/` is gitignored local data and must not be read, modified, staged, or committed.

## Current Result

`money-shorts-os-generated-copy-payload-qa-report-v1` 구현 완료 (미commit).

Changed files:
- `lib/source-facts/signal-translation-copy-payload.ts`
  - import: `buildMoneyShortsScenePackageQaReport`, `MoneyShortsScenePackageQaReport` from `signal-translation-package-qa`
  - `MoneyShortsGeneratedCopyPayload` 인터페이스에 `scenePackageQaReport: MoneyShortsScenePackageQaReport` 필드 추가
  - `buildMoneyShortsGeneratedCopyPayload()` 내부에서 `buildMoneyShortsScenePackageQaReport(scenePackage)` 호출 및 반환
- `app/fact-cards/manual/package-preview/SignalTranslationPreviewPanel.tsx`
  - `GeneratedCopyPayloadPreview` metadata grid에 `qaReport.isValid` / `qaReport errors/warnings` 칸 2개 추가
  - 기존 `ScenePackageQaReportPanel`, display-only 원칙 무변경
- `scripts/check-signal-translation-preview-static.mjs`
  - 2 new checks: copy payload imports QA helper + scenePackageQaReport field
  - 기존 48 PASS → 50 checks

Schema version: `money_shorts_generated_copy_payload_v1` 유지 (additive field, downstream contract 없음).

Important invariant:

- No 'use client', no useState/useEffect, no clipboard write, no fetch, no localStorage/sessionStorage.
- FactCard type / gate / ledger / generator / publishability flow 무변경.
- `signal-translation-package-qa.ts` source-facts logic 무변경.

## Verification Evidence

Passed:

- `node scripts/check-signal-translation-preview-static.mjs` — 50/50 PASS.
- `npx tsc --noEmit --skipLibCheck` — no errors in changed files.
- `npx eslint ... --max-warnings=0` — PASS on changed files.
- `git diff --check` — no whitespace errors (line ending warnings only, pre-existing).

Not run:

- Browser/route smoke (`.money-shorts-local/` access not permitted by Owner).

## Recommended Next Task

- Checkpoint commit for this slice (safe checkpoint commit authorized 필요).
- Or route smoke verification when Owner explicitly permits `.money-shorts-local/` access.

## Forbidden

- Do not touch `piq_diag_out.txt`.
- Do not read, modify, delete, stage, or commit `.money-shorts-local/` data.
- Do not stage/commit/push unless explicitly approved later.
- Do not add dependencies or edit lockfiles.
- Do not edit `.env*`, secrets, deployment config, DB/Supabase schema, migrations, or API credentials.
- Do not call OpenAI/GPT, Gemini, Veo, ElevenLabs, KOSIS, OpenDART, FRED, ECOS live, or any live API.
- Do not run ffmpeg, render, export, upload, post, deploy, or write to `output/`.
- Do not write to OS clipboard, `localStorage`, or `sessionStorage`.
