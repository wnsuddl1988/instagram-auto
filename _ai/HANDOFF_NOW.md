# Handoff Now

## Task ID

`money-shorts-os-package-view-model-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest completed checkpoint: `9a6428e feat(owner-decision): add review packet approval gate`
- Latest completed local module: `lib/clipboard-payload/`
- Clipboard Payload v1 passed Codex review after hashtag preservation review-fix.

Active local modules:

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

## Goal

Create a local deterministic Package Library / Package Detail view-model module.

This should prepare UI-friendly data from existing source-first package objects without building React UI yet, without DB writes, without file export, and without external calls. It is a bridge between the completed local package pipeline and future MVP1 screens.

## Approved Scope

Allowed:

- Add a new local module under `lib/package-view/`.
- Define view-model types for:
  - package list item
  - package detail model
  - package workflow/status summary
  - copy/action availability summary
- Implement deterministic helper(s) that accept existing local objects such as:
  - `AssembledContentPackage`
  - `ReviewPacket`
  - `OwnerDecisionGateResult`
  - `ClipboardPayload`
- Preserve ids and source linkage.
- Surface key fields for future UI:
  - package/content ids
  - topic/title/coreMessage
  - source name/url/date
  - factCard indicator/currentValue/dataPeriod
  - risk level and blocked flag
  - final QA readiness
  - owner decision and gate status
  - copyReady and clipboard payload id
  - render manifest id and timeline id
  - compact counts: scenes, scripts, sources, hashtags
- Add approved and blocked/not-ready fixtures using existing package/review/gate/clipboard fixtures.
- Update `_ai/CLAUDE_REPORT.md` with concise evidence.

Suggested files:

- `lib/package-view/types.ts`
- `lib/package-view/builder.ts`
- `lib/package-view/fixtures.ts`
- `lib/package-view/index.ts`

Optional only if useful:

- `lib/package-view/validation.ts`

## Required Behavior

- Deterministic: no `new Date()` unless `createdAt` is injected by options.
- No React/UI implementation yet.
- No DB reads/writes.
- No OS clipboard access.
- No file export/write.
- No render.
- No output file creation.
- No external calls.
- No AI generation.
- No new facts, numbers, claims, citations, narration, captions, hashtags, or CTA text.
- All display text must come from existing package/review/clipboard fields verbatim, except for simple status labels/codes.
- Blocked/not-approved packages must be clearly surfaced as not copy/render ready.

## Forbidden

- No Next.js page/component implementation in this task.
- No `navigator.clipboard`, clipboardy, PowerShell clipboard, pbcopy, clip.exe, or OS clipboard writes.
- No ffmpeg execution.
- No video/audio/image rendering.
- No actual media file probing or duration measurement.
- No ElevenLabs call.
- No OpenAI/GPT/Gemini/Veo call.
- No external API calls.
- No API key/env/secret changes.
- No Supabase migration or production DB changes.
- No dependency or lockfile changes.
- No payment integration.
- No upload/post.
- No git push.
- No commit unless Codex explicitly authorizes it later.
- Do not touch `output/`.
- Do not reuse retired Candidate10/Jun/static slideshow/old Money Architect routes, assets, prompts, or references.

## Required Checks

Run focused checks only:

- ESLint for `lib/package-view/`
- TypeScript check targeted to `lib/package-view/` or source-first modules
- Runtime/sample check that verifies:
  - approved package produces list item and detail model
  - blocked/not-ready package surfaces non-ready status
  - source/fact/citation/package ids are preserved
  - copyReady mirrors `ClipboardPayload.copyReady`
  - owner decision/gate blockers are surfaced
  - hashtags count/text source is preserved from clipboard/review data
  - no React/UI, DB, clipboard, file export, render, or output action occurs

## Definition of Done

- Package view-model module exports clear local types and deterministic helper(s).
- Approved and blocked fixtures produce expected UI-ready models.
- Focused checks pass.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` with concise package view-model evidence because this prepares the future MVP1 package library/detail UI.
