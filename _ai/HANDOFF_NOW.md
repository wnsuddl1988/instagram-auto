# HANDOFF_NOW

## Task ID

`money-shorts-os-package-preview-signal-translation-panel-v1`

## Project

`C:\Users\PC\jjy\instagram-auto`

## Current Checkpoint

- Branch: `codex/source-first-blueprint-clean`
- Latest HEAD: `f05625f feat: add signal translation scene card foundation`
- Current local status: ahead 60, uncommitted package-preview UI slice, unrelated `?? piq_diag_out.txt`
- Push: do not push.
- Known unrelated untracked file: `piq_diag_out.txt` -- do not read, modify, delete, stage, or commit.
- Local approval data under `.money-shorts-local/` is gitignored local data and must not be read, modified, staged, or committed.

## Current Result

Added a display-only Signal Translation / 6 Scene Cards preview layer to package-preview:

- Added `app/fact-cards/manual/package-preview/SignalTranslationPreviewPanel.tsx`
  - Displays `MoneyShortsScenePackage` fixtures only.
  - Shows Signal Translation Brief summary fields.
  - Shows fixed 6 Scene Cards with narration, caption, screen text, image prompt spec, visual template, caption blocks, voice timing spec, layout safe zones, source notes, citations, and risk notes.
  - Shows validation summary for scene card validation and citation validation.
  - Highlights viewer takeaway, recommended actions, action boundaries, and do-not-overclaim items for Owner inspection.
  - Explicitly marks the panel as display-only fixture inspection and not actual image/voice/render output.
- Updated `app/fact-cards/manual/package-preview/page.tsx`
  - Imports `SignalTranslationPreviewPanel`.
  - Imports `exchangeRateGeneratedSignalTranslationPackage` and `interestRateGeneratedSignalTranslationPackage`.
  - Inserts the panel immediately after `OwnerReviewGuidancePanel` and before the existing workflow status card.
  - Fixes existing Final QA display field from `c.description` to `c.detail ?? c.label` to match `QaCheckResult`.

Important invariant:

- Existing Fact Card type was not modified.
- Existing package-preview assembly, risk review, final QA, owner gate, ledger overlay, clipboard, and publishability logic were not changed.
- No DB/persistence, env, dependency, AI generation, ElevenLabs, image generation, render, upload, or clipboard write was added.

## Verification Evidence

Passed:

- `.\\node_modules\\.bin\\eslint.cmd app\\fact-cards\\manual\\package-preview\\page.tsx app\\fact-cards\\manual\\package-preview\\SignalTranslationPreviewPanel.tsx --max-warnings=0`
- Targeted TypeScript compiler API check for `page.tsx` and `SignalTranslationPreviewPanel.tsx`
- `git diff --check` returned no whitespace errors; only LF-to-CRLF working-copy warning.

Not run:

- Full project `tsc --project tsconfig.json`. It fails on existing `output/.../qa/seg_B*.ts` binary-like generated files unrelated to this slice.
- Browser/route smoke. The package-preview route may access local approval ledger data, and this task forbids `.money-shorts-local/` access.

## Recommended Next Task

Recommended:

- `money-shorts-os-package-preview-caption-scene-qa-v1`

Reason:

- The preview panel now exposes Signal Translation Brief and Scene Cards. The next safest UI slice is read-only QA visibility for caption/image/voice consistency, without changing generation, persistence, or owner gate behavior.

Alternative safe tasks:

- `money-shorts-os-generated-package-copy-payload-v1`
- `money-shorts-os-brief-scene-card-third-fixture-v1`

## Forbidden

- Do not touch `piq_diag_out.txt`.
- Do not read, modify, delete, stage, or commit `.money-shorts-local/` data.
- Do not stage/commit/push unless explicitly approved later.
- Do not add dependencies or edit lockfiles.
- Do not edit `.env*`, secrets, deployment config, DB/Supabase schema, migrations, or API credentials.
- Do not call OpenAI/GPT, Gemini, Veo, ElevenLabs, KOSIS, OpenDART, FRED, ECOS live, or any live API.
- Do not run ffmpeg, render, export, upload, post, deploy, or write to `output/`.
- Do not write to OS clipboard, `localStorage`, or `sessionStorage`.
