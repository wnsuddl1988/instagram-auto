# Handoff Now

## Task ID

`money-shorts-os-workflow-hub-entry-links-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest completed checkpoint before workflow hub: `fca0b73 feat(fact-card-ui): add manual workflow navigation`
- Latest completed local UI: `/money-shorts` Workflow Hub route.
- Codex verification passed:
  - ESLint `app/money-shorts/page.tsx`: PASS
  - targeted TypeScript diagnostics for `app/money-shorts`: 0
  - executable forbidden pattern search: PASS
  - `/money-shorts` HTTP 200
  - core text and all four route hrefs rendered
  - dev server stopped after verification

## Goal

Add clear links back to the `/money-shorts` Workflow Hub from existing Money Shorts local UI screens.

The hub should become the obvious home/workbench entry point. This is navigation polish only.

## Approved Scope

Allowed:

- Modify existing local UI route files as needed, likely:
  - `app/fact-cards/manual/page.tsx`
  - `app/fact-cards/manual/new/ManualFactCardFormClient.tsx`
  - `app/fact-cards/manual/package-preview/page.tsx`
  - `app/packages/PackageLibraryClient.tsx` or `app/packages/page.tsx`
- Add visible links labeled like `Workflow Hub`, `Money Shorts Hub`, or `작업 허브` pointing to `/money-shorts`.
- Keep existing behavior and route data unchanged.
- Update `_ai/CLAUDE_REPORT.md` with concise evidence.

## Required Behavior

- Existing pages still render their original content.
- Each touched screen has a clear route back to `/money-shorts`.
- No external call or persistence.
- Mobile and desktop layout should not overlap or squeeze text.

## Forbidden

- No GPT/Gemini/Veo/OpenAI/ElevenLabs calls.
- No ffmpeg execution.
- No video/audio/image rendering.
- No actual media probing.
- No ECOS/KOSIS/OpenDART/FRED live API calls.
- No DB/Supabase reads, writes, migrations, or production data changes.
- No API route changes.
- No API key/env/secret changes.
- No dependency or lockfile changes.
- No OS clipboard writes.
- No file export/write.
- No upload/post/deploy.
- No git push.
- No commit unless Codex explicitly authorizes it later.
- Do not touch `output/`.
- Do not reuse retired Candidate10/Jun/static slideshow/old Money Architect routes, assets, prompts, or references.

## Required Checks

Run focused checks:

- ESLint for changed route files.
- TypeScript check targeted to changed files, or full `pnpm exec tsc --noEmit --pretty false` with clear note if it only fails on pre-existing `output/` binary `.ts` files.
- Search changed files for forbidden calls:
  - clipboard APIs
  - `fetch(`
  - `/api/`
  - ffmpeg/render/upload/post/deploy references
  - `output/`
- If practical, run a local dev server and verify representative touched routes with HTTP/core text. Stop the server afterward.

## Definition of Done

- Existing Money Shorts local UI screens have visible `/money-shorts` links.
- Original route content remains visible.
- No external/clipboard/render/DB/API action occurs.
- Focused checks pass, or any pre-existing unrelated failure is clearly isolated.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` with concise evidence because this completes local navigation around the new hub.
