# Handoff Now

## Task ID

`money-shorts-os-package-library-ui-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest completed checkpoint before package-view: `07444ad feat(clipboard-payload): add copy workflow payload builder`
- Latest completed local module: `lib/package-view/`
- Package View Model v1 and review-fix-2 passed Codex review.
- Next work should start from local view models/fixtures only. No DB/API/render pipeline integration yet.

Active local source-first modules:

- `lib/source-facts/`
- `lib/blueprints/`
- `lib/scripts/`
- `lib/risk-review/`
- `lib/chart-cards/`
- `lib/image-prompts/`
- `lib/voice-profiles/`
- `lib/timeline/`
- `lib/render-plan/`
- `lib/final-qa/`
- `lib/content-package/`
- `lib/review-packet/`
- `lib/owner-decision/`
- `lib/clipboard-payload/`
- `lib/package-view/`

## Goal

Build the first local Package Library / Package Detail UI for Money Shorts OS using only existing `lib/package-view/` fixtures and view models.

This is a local UI shell for Owner review and workflow inspection. It must not call APIs, DB, AI, render, clipboard, upload, or external services.

## Approved Scope

Allowed:

- Inspect existing App Router UI conventions in `app/`, `components/`, and `app/globals.css`.
- Add a new local route under `app/packages/`.
- Add route-local components if useful, for example:
  - `app/packages/page.tsx`
  - `app/packages/PackageLibraryClient.tsx`
- Use data from `lib/package-view/fixtures.ts` only.
- Render a usable MVP1 UI with:
  - package list items
  - selected package detail
  - workflow status
  - risk and QA summaries
  - source/fact card summary
  - social copy preview
  - copy action summary with blocker labels
  - approved, pending/no-gate, rejected, and blocked fixture states
- Use existing dependencies only, including `lucide-react` icons if helpful.
- Keep styling consistent with the existing dark dashboard style, but make the screen practical and scan-friendly.
- Update `_ai/CLAUDE_REPORT.md` with concise evidence.

Do not broaden beyond local fixture-driven UI.

## Required Behavior

- The UI must be reachable at `/packages`.
- The first screen must be the actual package workflow UI, not a marketing landing page.
- No server/API fetch is allowed. Import local fixtures directly.
- No OS clipboard write is allowed. Copy buttons may be disabled, informational, or marked as not executed in this task.
- Package status must clearly distinguish:
  - approved/copy-ready
  - pending/no-gate
  - rejected
  - approved-but-blocked
- Blocker labels must be visible when copy/render is not ready.
- Hashtags and social copy must come verbatim from package-view data.
- Source URLs may be shown as text or links, but do not fetch them.
- Text must fit on desktop and mobile without overlap.
- Keep the UI dense and operational, not hero/marketing style.

## Forbidden

- No `navigator.clipboard`, clipboardy, PowerShell clipboard, pbcopy, clip.exe, or OS clipboard writes.
- No ffmpeg execution.
- No video/audio/image rendering.
- No actual media file probing or duration measurement.
- No ElevenLabs call.
- No OpenAI/GPT/Gemini/Veo call.
- No external API calls.
- No API route changes.
- No DB/Supabase reads, writes, migrations, or production data changes.
- No API key/env/secret changes.
- No dependency or lockfile changes.
- No payment integration.
- No upload/post/deploy.
- No git push.
- No commit unless Codex explicitly authorizes it later.
- Do not touch `output/`.
- Do not reuse retired Candidate10/Jun/static slideshow/old Money Architect routes, assets, prompts, or references.

## Required Checks

Run focused checks:

- ESLint for changed UI files and `lib/package-view/` if imported types are adjusted.
- TypeScript check targeted to changed files, or full `pnpm exec tsc --noEmit --pretty false` with clear note if it only fails on pre-existing `output/` binary `.ts` files.
- Search changed UI files for forbidden calls:
  - clipboard APIs
  - `fetch(`
  - API route calls
  - ffmpeg/render/upload/post/deploy references
- If practical, run a local dev server and verify `/packages` visually with a browser/screenshot. Stop the server afterward and report the URL used.

## Definition of Done

- `/packages` route renders the local package workflow UI from fixtures.
- Approved, pending/no-gate, rejected, and blocked states are visible and distinguishable.
- No external/clipboard/render/DB/API action occurs.
- Focused checks pass, or any pre-existing unrelated failure is clearly isolated.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` with concise package library UI evidence because this starts the Owner-facing MVP1 workflow surface.
