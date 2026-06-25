# Handoff Now

## Task ID

`money-shorts-os-manual-fact-card-route-nav-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest completed checkpoint before sample controls: `08ff8f0 feat(fact-card-ui): add manual draft form`
- Latest completed local UI: `/fact-cards/manual/new` sample load/reset controls.
- Codex verification passed:
  - ESLint `app/fact-cards/manual/new/ManualFactCardFormClient.tsx`: PASS
  - targeted TypeScript diagnostics for `app/fact-cards`: 0
  - forbidden pattern search: PASS
  - Claude browser verification: sample load -> `ok=true`, reset -> `ok=false`

## Goal

Add simple route navigation polish to the Manual Fact Card entry screen.

The existing `/fact-cards/manual` fixture/authoring overview should clearly link to the now-existing form route and package preview route so the Owner can move through the local Step 1 workflow without remembering URLs.

## Approved Scope

Allowed:

- Modify:
  - `app/fact-cards/manual/page.tsx`
  - optional `_ai/CLAUDE_REPORT.md` evidence update
- Add visible links/buttons to:
  - `/fact-cards/manual/new`
  - `/fact-cards/manual/package-preview`
  - `/packages` if useful
- Keep layout consistent with existing dark operational UI.
- Keep the current valid/broken fixture display behavior unchanged.

## Required Behavior

- `/fact-cards/manual` still renders the valid and broken draft cards.
- New navigation makes the intended workflow clear:
  - fixture overview
  - direct manual input
  - package preview
  - package library
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
- If practical, run a local dev server and verify `/fact-cards/manual` with HTTP/core text. Stop the server afterward.

## Definition of Done

- `/fact-cards/manual` has clear links to form, package preview, and package library.
- Existing valid/broken draft content remains visible.
- No external/clipboard/render/DB/API action occurs.
- Focused checks pass, or any pre-existing unrelated failure is clearly isolated.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` only with concise evidence if behavior or validation evidence materially changes.
