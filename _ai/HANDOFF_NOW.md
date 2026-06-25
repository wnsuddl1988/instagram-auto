# Handoff Now

## Task ID

`money-shorts-os-mvp1-local-ui-smoke-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest completed checkpoint before hub entry links: `9d0e187 feat(money-shorts): add workflow hub route`
- Latest completed local UI: hub backlinks from existing Money Shorts screens.
- Codex verification passed:
  - ESLint for changed route files: PASS
  - targeted TypeScript diagnostics for changed routes: 0
  - forbidden pattern search: PASS
  - Claude HTTP verification: all touched screens include `/money-shorts` link and original content

## Goal

Run a focused local UI smoke pass for the Money Shorts OS MVP1 route set.

This is a verification/stabilization task. Do not implement new features unless a clear blocker prevents the smoke pass from completing.

## Approved Scope

Allowed:

- Verify these local routes:
  - `/money-shorts`
  - `/fact-cards/manual`
  - `/fact-cards/manual/new`
  - `/fact-cards/manual/package-preview`
  - `/packages`
- Check core text/hrefs for each route.
- Check that local-only/source-first warnings remain visible where expected.
- Check that no route performs external/API/DB/clipboard/render/ffmpeg/output actions.
- If a small blocker is found, fix only that blocker in the touched route file and report it clearly.
- Update `_ai/CLAUDE_REPORT.md` with concise smoke evidence.

## Required Behavior

- All five routes should return HTTP 200.
- `/money-shorts` should link to the four workflow routes.
- The four workflow routes should link back to `/money-shorts`.
- Existing route-specific content should remain visible:
  - manual overview: valid and broken draft
  - manual form: blank invalid state and sample controls
  - package preview: local preview/package pipeline status
  - packages: package library/list/detail shell
- No external call or persistence.

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

- `git status -sb`
- ESLint for route files if any file changes are made.
- TypeScript targeted check if any file changes are made.
- Forbidden pattern search on relevant Money Shorts app routes.
- Local dev server HTTP/core text check for all five routes.
- Stop the dev server afterward.

## Definition of Done

- Smoke result for all five routes is reported.
- Any blocker found is fixed or explicitly reported.
- No external/clipboard/render/DB/API action occurs.
- `_ai/CLAUDE_REPORT.md` has concise smoke evidence.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` with concise smoke evidence because this is a local MVP route acceptance pass.
