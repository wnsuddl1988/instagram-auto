# HANDOFF_NOW

## Task ID

`package-preview-owner-review-guidance-panel-v1-review-fix`

## Project

`C:\Users\PC\jjy\instagram-auto`

## Current Checkpoint

- Branch: `codex/source-first-blueprint-clean`
- Latest HEAD: `bd4e745 test(package-preview): guard ledger overlay page integration`
- Current working tree includes the accepted in-progress UI slice:
  - modified `_ai/HANDOFF_NOW.md`, `_ai/NEXT_ACTION.md`, `_ai/PROJECT_STATE.md`
  - modified `app/fact-cards/manual/package-preview/page.tsx`
  - untracked `app/fact-cards/manual/package-preview/OwnerReviewGuidancePanel.tsx`
  - unrelated untracked `piq_diag_out.txt`
- The `_ai/NEXT_ACTION.md` and `_ai/PROJECT_STATE.md` edits are accepted docs sync to `bd4e745` / ahead 58. Do not revert them.
- Push: do not push.
- Known unrelated untracked file: `piq_diag_out.txt` -- do not read, modify, delete, stage, or commit.
- Local approval data under `.money-shorts-local/` is gitignored local data and must not be read, modified, staged, or committed.

## Review Finding To Fix

Codex review accepted the component shape and `resolveState` priority:

1. `ledgerOverlayResult.active` first is correct because active overlay already passed the 4-guard revalidation and is the intended display-only approved projection.
2. Nullable `primarySourceName` / `primaryPublishedDate` props are acceptable for this local display component.
3. The panel placement before the existing workflow status section is acceptable.

One UI wording mismatch must be fixed before checkpoint:

- In `OwnerReviewGuidancePanel.tsx`, the ledger-approved text says `Overlay 섹션(⑨)`, but current `page.tsx` uses `⑨ Review Packet`. The ledger overlay is a subsection inside `⑧ Publishability Readiness`.
- The pending approval next-action text says `⑧ Owner Decision Controls`, while the visible label is `Owner Decision 로컬 샌드박스` inside `⑧ Publishability Readiness`.

## Goal

Fix only the section-reference wording in the new Owner review guidance panel so it matches the current UI section labels and does not imply that section ⑨ is the ledger overlay.

## Approved Scope

1. Edit `app/fact-cards/manual/package-preview/OwnerReviewGuidancePanel.tsx` only for display copy.
2. Replace the wrong `Overlay 섹션(⑨)` reference with copy that points to `⑧ Publishability Readiness` / `로컬 승인 Overlay (Ledger 기반)` or avoids numbering ambiguity.
3. Replace `⑧ Owner Decision Controls` with copy that matches the visible `⑧ Publishability Readiness` / `Owner Decision 로컬 샌드박스` wording.
4. Do not change `resolveState`, props, imports, page insertion, ledger logic, gate logic, clipboard logic, or any behavior.
5. Do not update `_ai/NEXT_ACTION.md` or `_ai/PROJECT_STATE.md` unless a check result materially changes reusable state. Default: no docs change besides this handoff file if already modified.

## Approved Editable Files

- `app/fact-cards/manual/package-preview/OwnerReviewGuidancePanel.tsx`
- `_ai/HANDOFF_NOW.md` only if final status needs a tiny update

Do not edit unrelated implementation files.

## Forbidden

- Do not touch `piq_diag_out.txt`.
- Do not read, modify, delete, stage, or commit `.money-shorts-local/` data.
- Do not run browser/dev-server route smoke for package-preview if it would read `.money-shorts-local/`.
- Do not stage/commit/push.
- Do not add dependencies or edit lockfiles.
- Do not edit `package.json`.
- Do not edit `.env*`, secrets, deployment config, DB/Supabase schema, migrations, or API credentials.
- Do not call OpenAI/GPT, Gemini, Veo, ElevenLabs, KOSIS, OpenDART, FRED, ECOS live, or any live API.
- Do not run ffmpeg, render, export, upload, post, deploy, or write to `output/`.
- Do not write to OS clipboard, `localStorage`, or `sessionStorage`.
- Do not implement real persisted `isPublishable=true`.

## Required Checks

Run focused checks:

1. `git status -sb`
2. `git diff --stat`
3. Focused diff review of `OwnerReviewGuidancePanel.tsx`
4. `node scripts/check-ledger-overlay-static.mjs`
5. ESLint:
   - `pnpm exec eslint app/fact-cards/manual/package-preview/page.tsx app/fact-cards/manual/package-preview/OwnerReviewGuidancePanel.tsx --max-warnings=0`
   - if `pnpm exec` hits the known non-TTY module purge issue, use `.\node_modules\.bin\eslint.cmd ... --max-warnings=0`
6. TypeScript evidence:
   - run the existing project TypeScript check approach if practical, and report whether changed package-preview files have 0 errors
   - if full project check reports known unrelated `output/` binary `.ts` errors, explicitly report that changed package-preview files have no related errors
7. Confirm no files outside approved scope changed by this review-fix.
8. Confirm `piq_diag_out.txt` remains untracked and untouched.

No browser, live API, render, ffmpeg, output, DB, env, clipboard, or `.money-shorts-local/` checks are approved for this slice.

## Definition of Done

- Owner guidance panel copy no longer points the ledger overlay to section ⑨.
- Pending approval next-action copy matches the visible Owner decision area.
- No behavior or logic changed.
- Static guard and focused ESLint pass.
- Focused TypeScript evidence shows no changed-file errors.
- No forbidden files or systems are touched.
- Report whether the combined UI slice + docs sync should now be checkpoint committed.

## Final Report Format

Report back to Codex in Korean with:

- changed files
- exact wording fix made
- behavior preserved
- checks/results
- deviations/blockers
- final `git status -sb`
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 83%`
