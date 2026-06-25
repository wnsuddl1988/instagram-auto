# Handoff Now

## Task ID

`money-shorts-os-react-key-warning-isolation-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest completed checkpoint before smoke pass: `70eeecb feat(money-shorts): link screens to workflow hub`
- Latest completed verification: MVP1 local UI smoke pass for five routes.
- Smoke result:
  - `/money-shorts`: HTTP 200, workflow hub links visible
  - `/fact-cards/manual`: HTTP 200, valid/broken draft visible
  - `/fact-cards/manual/new`: HTTP 200, blank invalid state + sample controls visible
  - `/fact-cards/manual/package-preview`: HTTP 200, local preview visible
  - `/packages`: HTTP 200, package library states visible
- Known non-blocking issue:
  - React console warning: `Each child in a list should have a unique "key" prop`
  - Smoke pass did not isolate the exact source.
  - No server 5xx and no route blocker.

## Goal

Isolate and, if narrowly safe, fix the React unique key warning seen during MVP1 local UI smoke.

This is a focused QA cleanup. Do not add features or refactor broadly.

## Approved Scope

Allowed:

- Inspect the five MVP1 local routes:
  - `/money-shorts`
  - `/fact-cards/manual`
  - `/fact-cards/manual/new`
  - `/fact-cards/manual/package-preview`
  - `/packages`
- Inspect route component code and map/list rendering around those screens.
- Use local dev server/browser console evidence if practical.
- If the source is found and fix is small, add the missing stable `key` only.
- Update `_ai/CLAUDE_REPORT.md` with concise evidence.

## Required Behavior

- Identify which route/component emits the warning, or report that it remains not isolated with evidence.
- If fixed:
  - no behavior or layout changes beyond key stability
  - no generated/random/time-based keys
  - use existing stable ids or deterministic labels
- If not fixed:
  - report exact reproduction attempts and why source remains unclear
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
- If files change:
  - ESLint targeted to changed files
  - TypeScript targeted check for changed route files
  - forbidden pattern search on changed files
- If practical:
  - run local dev server
  - load routes individually
  - capture console warning presence/absence per route
  - stop dev server afterward

## Definition of Done

- Warning source is isolated and fixed, or a clear non-fixed diagnosis is reported.
- No broad refactor or unrelated UI change.
- No external/clipboard/render/DB/API action occurs.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` with concise warning isolation/fix evidence.
