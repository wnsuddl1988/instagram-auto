# HANDOFF_NOW

## Task ID

`money-shorts-os-brief-scene-card-generator-second-fixture-v1`

## Project

`C:\Users\PC\jjy\instagram-auto`

## Current Checkpoint

- Branch: `codex/source-first-blueprint-clean`
- Latest HEAD: `24ef219 feat(package-preview): add owner review guidance panel`
- Current expected status before commit: branch ahead 59, accumulated docs alignment files modified, new source-facts type slice files, unrelated `?? piq_diag_out.txt`
- Push: do not push.
- Known unrelated untracked file: `piq_diag_out.txt` -- do not read, modify, delete, stage, or commit.
- Local approval data under `.money-shorts-local/` is gitignored local data and must not be read, modified, staged, or committed.

## Current Result

Completed first implementation slices after final direction alignment, including the second generator fixture:

- Added `lib/source-facts/signal-translation.ts`
  - Signal Translation Brief types.
  - Fixed 6 Scene Card role union.
  - Caption System V1 layout types/constants.
  - voice timing, image text policy, layout safe zone, visual template types.
  - `validateFixedSixSceneCards()` sequence/count helper.
  - `validateSceneCardsForGeneration()` detail helper for required text fields and absolute-timeline caption timing.
  - `validateSignalTranslationCitationIds()` helper for Fact Card citation id subset checks.
- Added `lib/source-facts/signal-translation-generator.ts`
  - `createSignalTranslationBriefFromFactCard()` deterministic brief helper.
  - `createFixedSixSceneCardsFromSignalTranslationBrief()` deterministic fixed 6 Scene Card helper.
  - `createMoneyShortsScenePackageFromFactCard()` package helper returning brief, scene cards, scene validation, and citation validation.
  - Exchange-rate template, interest-rate template, plus safe generic indicator fallback.
- Added `lib/source-facts/signal-translation-fixtures.ts`
  - Mock exchange-rate Signal Translation Brief.
  - 6 Scene Cards derived from the existing exchange-rate Fact Card fixture.
  - Sequence validation fixture.
  - Generation validation and citation subset validation fixtures.
  - Generated exchange-rate Signal Translation package fixture.
  - Generated interest-rate Signal Translation package fixture.
- Updated `lib/source-facts/fixtures.ts`
  - Added mock ECOS source provider.
  - Added mock base-rate Fact Card fixture.
- Updated `lib/source-facts/index.ts`
  - exports new type, generator, and fixture modules.

Important invariant:

- Existing `FactCard` type was not modified.
- Existing Fact Card fixture values were not modified; one new mock base-rate Fact Card was added.
- Signal Translation Brief remains a separate interpretation layer.
- Scene Card remains the multimodal scene-level spec.
- Existing `validateFixedSixSceneCards()` remains sequence/count focused; generation readiness checks are separated into `validateSceneCardsForGeneration()`.
- Generator is deterministic and does not call AI, TTS, image, render, upload, DB, env, or live APIs.

## Still In Accumulated Diff

This working tree also includes the previous uncommitted documentation alignment:

- `Money Shorts OS Direction Alignment Docs v1`
- `Money Shorts OS Voice / Narration Style Patch v1`
- legacy/reference-only doc markers

## Recommended Next Task

`money-shorts-os-package-preview-signal-translation-panel-v1`

Recommended scope:

- Add a small display-only package-preview panel for Signal Translation Brief and 6 Scene Cards.
- Use generated package data only; do not add persistence or live generation.
- Keep existing Fact Card contract unchanged.
- Do not touch render, upload, DB, env, dependency, live API, or legacy `/review` flow.

## Verification Evidence

Passed:

- `.\\node_modules\\.bin\\eslint.cmd lib\\source-facts\\signal-translation.ts lib\\source-facts\\signal-translation-fixtures.ts lib\\source-facts\\index.ts --max-warnings=0`
- `.\\node_modules\\.bin\\eslint.cmd lib\\source-facts\\signal-translation.ts lib\\source-facts\\signal-translation-generator.ts lib\\source-facts\\signal-translation-fixtures.ts lib\\source-facts\\index.ts --max-warnings=0`
- `.\\node_modules\\.bin\\eslint.cmd lib\\source-facts\\fixtures.ts lib\\source-facts\\signal-translation.ts lib\\source-facts\\signal-translation-generator.ts lib\\source-facts\\signal-translation-fixtures.ts lib\\source-facts\\index.ts --max-warnings=0`
- `.\\node_modules\\.bin\\tsc.cmd --noEmit --pretty false --strict --target ES2017 --module esnext --moduleResolution bundler --esModuleInterop --skipLibCheck lib\\source-facts\\signal-translation.ts lib\\source-facts\\signal-translation-fixtures.ts`
- `.\\node_modules\\.bin\\tsc.cmd --noEmit --pretty false --strict --target ES2017 --module esnext --moduleResolution bundler --esModuleInterop --skipLibCheck lib\\source-facts\\signal-translation.ts lib\\source-facts\\signal-translation-generator.ts lib\\source-facts\\signal-translation-fixtures.ts`
- `.\\node_modules\\.bin\\tsc.cmd --noEmit --pretty false --strict --target ES2017 --module esnext --moduleResolution bundler --esModuleInterop --skipLibCheck lib\\source-facts\\fixtures.ts lib\\source-facts\\signal-translation.ts lib\\source-facts\\signal-translation-generator.ts lib\\source-facts\\signal-translation-fixtures.ts`
- `.\\node_modules\\.bin\\tsc.cmd --noEmit --pretty false --strict --target ES2017 --module esnext --moduleResolution bundler --esModuleInterop --skipLibCheck lib\\source-facts\\index.ts`
- `node -e` in-memory TypeScript transpile check confirmed `exchangeRateGeneratedSignalTranslationPackage` has `sceneValid=true`, `citationValid=true`, `sceneCount=6`, `templateId=exchange_rate_life_economy_v1`.
- `node -e` in-memory TypeScript transpile check confirmed both generated packages have `sceneValid=true`, `citationValid=true`, `sceneCount=6`; templates are `exchange_rate_life_economy_v1` and `interest_rate_life_economy_v1`.
- `git diff --check` returned only LF-to-CRLF warnings, no whitespace errors.

Not run:

- Full project `tsc` / full build. This repo has known broad historical output/archive issues and this slice was intentionally targeted.

## Forbidden

- Do not touch `piq_diag_out.txt`.
- Do not read, modify, delete, stage, or commit `.money-shorts-local/` data.
- Do not stage/commit/push unless explicitly approved later.
- Do not add dependencies or edit lockfiles.
- Do not edit `.env*`, secrets, deployment config, DB/Supabase schema, migrations, or API credentials.
- Do not call OpenAI/GPT, Gemini, Veo, ElevenLabs, KOSIS, OpenDART, FRED, ECOS live, or any live API.
- Do not run ffmpeg, render, export, upload, post, deploy, or write to `output/`.
- Do not write to OS clipboard, `localStorage`, or `sessionStorage`.
