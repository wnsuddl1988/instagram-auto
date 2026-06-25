# Handoff Now

## Task ID

`money-shorts-os-clipboard-payload-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest completed checkpoint: `538d0d1 feat(review-packet): add owner review packet generator`
- Latest completed local module: `lib/owner-decision/`
- Owner Decision Gate v1 passed Codex review after review-fix and review-fix-2.

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

## Goal

Create a local deterministic clipboard payload module for MVP1 copy workflows.

MVP1 is clipboard-centered and file export is later. This module must prepare copyable text sections from an approved `ReviewPacket` + `OwnerDecisionGateResult` without touching the OS clipboard, writing files, rendering, exporting, or calling external services.

## Approved Scope

Allowed:

- Add a new local module under `lib/clipboard-payload/`.
- Define clipboard payload types.
- Implement deterministic helper(s) that accept a `ReviewPacket` and `OwnerDecisionGateResult`.
- Preserve reviewPacketId/contentPackageId/factCardIds/sourceCitationIds/package ids.
- Expose copy sections for:
  - title/topic/core message
  - script narration by duration
  - caption text by duration
  - YouTube title
  - Instagram caption
  - hashtags
  - Money-OS CTA when present
  - source/citation attribution block
  - QA/risk warning summary for Owner visibility
- Return `copyReady=true` only when:
  - `gate.canProceedToRender=true`
  - `gate.reviewPacketId === packet.reviewPacketId`
  - `gate.contentPackageId === packet.contentPackageId`
- Return `copyReady=false` with blocker codes/reasons when the gate is not approved or linkage mismatches.
- Add valid approved and blocked fixtures using existing review packet and owner decision gate fixtures.
- Update `_ai/CLAUDE_REPORT.md` with concise evidence.

Suggested files:

- `lib/clipboard-payload/types.ts`
- `lib/clipboard-payload/builder.ts`
- `lib/clipboard-payload/fixtures.ts`
- `lib/clipboard-payload/index.ts`

Optional only if useful:

- `lib/clipboard-payload/validation.ts`

## Required Behavior

- Deterministic: no `new Date()` unless `createdAt` is injected by options.
- No OS clipboard access.
- No file export/write.
- No render.
- No output file creation.
- No external calls.
- No AI generation.
- No new facts, numbers, claims, citations, narration, captions, hashtags, or CTA text.
- All copy text must come from `ReviewPacket` fields verbatim, except for simple section labels/metadata.
- Broken/not-approved gate must not produce `copyReady=true`.
- Linkage mismatch between packet and gate must block copy readiness.

## Forbidden

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

- ESLint for `lib/clipboard-payload/`
- TypeScript check targeted to `lib/clipboard-payload/` or source-first modules
- Runtime/sample check that verifies:
  - approved gate + valid review packet returns `copyReady=true`
  - pending/rejected/revision/not-ready gate returns `copyReady=false`
  - malformed/unsupported gate blocker remains surfaced if present
  - reviewPacketId mismatch returns `copyReady=false`
  - contentPackageId mismatch returns `copyReady=false`
  - all copy text comes from the review packet verbatim
  - source attribution block preserves source URL/citation id
  - no OS clipboard call is made
  - no output file is created

## Definition of Done

- Clipboard payload module exports clear local types and deterministic helper(s).
- Approved review packet produces copyable sections for MVP1 copy workflows.
- Blocked/mismatched packets fail readiness clearly.
- Focused checks pass.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` with concise clipboard payload evidence because this creates the MVP1 copy workflow layer.
