# HANDOFF_NOW

## Task ID

`package-preview-local-publishable-projection-v1-review-fix`

## Project

`C:\Users\PC\jjy\instagram-auto`

## Current Checkpoint

- Branch: `codex/source-first-blueprint-clean`
- Latest committed checkpoint before this slice: `6e95cca test(package-preview): record live publishability controls smoke`
- Push: do not push.
- Known unrelated untracked file: `piq_diag_out.txt` — do not read, modify, delete, stage, or commit.

## Context

`package-preview-local-publishable-projection-v1` added `?publishabilityProjection=approved-dry-run` to prove a memory-only publishable projection can open gate/copy paths while the original Fact Card remains `isPublishable=false`.

Codex review accepts the direction but found three small review-fix items before checkpoint commit:

1. Dry-run projected package/review currently reuse normal `MOCK_CONTENT_PACKAGE_ID` / `MOCK_REVIEW_PACKET_ID`. Use distinct dry-run IDs so audit/preview output cannot confuse normal vs projected artifacts.
2. JSX uses non-null assertions such as `projectedGate!` and `projectedClipboard!`. Replace with a narrowed/discriminated result or explicit guards.
3. Dry-run link hardcodes `endPeriod=202606`. Preserve the current route `endPeriod` instead. If no usable live `endPeriod` exists, do not render a misleading live dry-run link.

## Approved Scope

Fix only the three review items above.

Editable files:

- `app/fact-cards/manual/package-preview/page.tsx`
- `_ai/CLAUDE_REPORT.md`
- `_ai/NEXT_ACTION.md`
- `_ai/PROJECT_STATE.md` only if durable state wording needs a minimal correction
- `_ai/HANDOFF_NOW.md` only for final status/evidence if needed

## Forbidden

- Do not implement actual persistence or `isPublishable=true` storage.
- Do not mutate the original Fact Card object.
- Do not add DB/Supabase/API routes.
- Do not call GPT/Gemini/Veo/ElevenLabs/ffmpeg/render/output/upload/deploy.
- Do not use clipboard, localStorage, sessionStorage, Date.now, Math.random.
- Do not edit env/secret files or print env values.
- Do not add dependencies or modify lockfiles.
- Do not touch `piq_diag_out.txt`.
- Do not commit or push.

## Definition of Done

- Projection uses distinct dry-run package/review IDs.
- No `projectedGate!` / `projectedClipboard!` non-null assertions remain.
- Dry-run link preserves the current `endPeriod` instead of hardcoding `202606`, or is hidden when no live `endPeriod` is available.
- Normal live route still shows original gate blocked and no dry-run panel unless the exact flag is present.
- Dry-run route still shows memory-only projected `isPublishable=true`, projected `canProceedToRender=OPEN`, projected `copyReady=READY`, while the original/server gate remains blocked.
- No implementation outside the approved files/scope.

## Required Checks

Run focused checks only:

1. `git status -sb`
2. Targeted TypeScript check for changed page/source files.
3. Targeted ESLint for `app/fact-cards/manual/package-preview/page.tsx`.
4. Static grep:
   - no `projectedGate!` or `projectedClipboard!`
   - no direct `factCard.isPublishable = true`
   - dry-run projection block does not reuse normal `MOCK_CONTENT_PACKAGE_ID` / `MOCK_REVIEW_PACKET_ID`
   - live/dry-run links keep `prefetch={false}`
5. Browser/runtime smoke if dev server is available:
   - normal live route
   - live dry-run route with current `endPeriod`
   - confirm console error/warning 0 and secret not printed

If the browser smoke cannot run, report the blocker and static evidence instead.

## Final Report Format

Report back to Codex in Korean with:

- changed files
- exact fixes made
- checks/results
- deviations/blockers
- final `git status -sb`
- checkpoint recommendation
- `전체프로젝트 진행률 : 약 80%`
