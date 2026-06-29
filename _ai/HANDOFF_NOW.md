# HANDOFF_NOW

## Task ID

`money-shorts-os-scene-package-qa-helper-v1-review-fix`

## Project

`C:\Users\PC\jjy\instagram-auto`

## Current Checkpoint

- Branch: `codex/source-first-blueprint-clean`
- Latest HEAD: `1a268ba test(package-preview): add signal translation display-only static guard`
- Current local status: ahead 66, uncommitted changes (QA helper slice + `_ai/` docs sync)
- Push: do not push.
- Known unrelated untracked file: `piq_diag_out.txt` -- do not read, modify, delete, stage, or commit.
- Local approval data under `.money-shorts-local/` is gitignored local data and must not be read, modified, staged, or committed.

## Current Result

Added pure deterministic QA helper for Money Shorts Scene Packages:

- Added `lib/source-facts/signal-translation-package-qa.ts`
  - `MoneyShortsScenePackageQaIssue` — per-issue type with `scope/field/code/message/sceneNumber`.
  - `MoneyShortsScenePackageQaReport` — `isValid/errors/warnings/summary` structure.
  - `buildMoneyShortsScenePackageQaReport(scenePackage)` — core builder.
  - Reuses `validateSceneCardsForGeneration()` for scene base validation.
  - **review-fix**: citation validation은 `scenePackage.citationValidation`(generator가 FactCard 기준으로 계산한 source-of-truth)을 재사용. `validateSignalTranslationCitationIds` import 제거.
  - Adds Owner/QA-layer warnings: hookTitle lines, spokenCaption length, imagePrompt, imageTextPolicy, voiceTiming emphasisWords, layoutSafeZone.spokenCaption, sourceNote, riskNotes, viewerTakeaway, recommendedActions, actionBoundaries, doNotOverclaimActions.
  - Risk keyword scan (structural only): 13 keywords across 3 categories (deterministic forecast / investment advice / fear hype). Warning-only, no gate change.
- Updated `lib/source-facts/signal-translation-fixtures.ts`
  - Added `buildMoneyShortsScenePackageQaReport` import.
  - Added 3 QA report exports: `exchangeRateGeneratedSignalTranslationPackageQaReport`, `interestRateGeneratedSignalTranslationPackageQaReport`, `inflationGeneratedSignalTranslationPackageQaReport`.
- Updated `lib/source-facts/index.ts`
  - Added `export * from "./signal-translation-package-qa"`.

Important invariant:

- No UI/route/component/generator/publishability/gate logic changed.
- FactCard type not modified.
- No clipboard write, render, upload, or DB change.

## Verification Evidence

Passed:

- `npx tsc --noEmit --project tsconfig.json` — no errors in changed files.
- `npx eslint` targeted on changed files — `--max-warnings=0` PASS.
- `git diff --check` — no whitespace errors.

Not run:

- Runtime `isValid` check — `@/` alias not resolvable via Node.js directly; TypeScript check is the validated equivalent.
- Browser/route smoke (`.money-shorts-local/` access not permitted by Owner).

## Recommended Next Task

- checkpoint commit for this slice (`lib/source-facts/signal-translation-package-qa.ts` + fixture/index updates + `_ai/` docs)
- Or connect QA report to package-preview panel (display-only, Codex decision).

## Forbidden

- Do not touch `piq_diag_out.txt`.
- Do not read, modify, delete, stage, or commit `.money-shorts-local/` data.
- Do not stage/commit/push unless explicitly approved later.
- Do not add dependencies or edit lockfiles.
- Do not edit `.env*`, secrets, deployment config, DB/Supabase schema, migrations, or API credentials.
- Do not call OpenAI/GPT, Gemini, Veo, ElevenLabs, KOSIS, OpenDART, FRED, ECOS live, or any live API.
- Do not run ffmpeg, render, export, upload, post, deploy, or write to `output/`.
- Do not write to OS clipboard, `localStorage`, or `sessionStorage`.
