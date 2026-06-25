# Handoff Now

## Task ID

`money-shorts-os-owner-decision-gate-v1`

## Current State

Previous video production routes are retired.

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest completed local module: `lib/review-packet/`
- Review Packet v1 has been Codex-reviewed with focused ESLint, targeted TypeScript, and runtime verification.

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

## Goal

Create a local deterministic Owner decision gate module for review packets.

This is the explicit approval layer between `ReviewPacket` and any future render/export/upload work. It should record/evaluate an Owner decision using only the existing review packet plus explicit decision input. It must not render, export, write files, call APIs, or mutate production state.

## Approved Scope

Allowed:

- Add a new local module under `lib/owner-decision/`.
- Define decision/gate result types.
- Implement deterministic helper(s) that accept a `ReviewPacket` and explicit Owner decision input.
- Preserve reviewPacketId/contentPackageId/factCardIds/sourceCitationIds/package ids from the review packet.
- Return a gate result such as `canProceedToRender`.
- Treat `approved` as render-eligible only when:
  - the review packet QA is `readyForRender=true`
  - risk is not blocked
  - the explicit Owner decision is approved
- Treat `rejected`, `revision_requested`, missing/pending decision, risk blocked, or QA not ready as `canProceedToRender=false`.
- Include valid and blocked/not-ready fixtures.
- Update `_ai/CLAUDE_REPORT.md` with concise evidence.

Suggested files:

- `lib/owner-decision/types.ts`
- `lib/owner-decision/gate.ts`
- `lib/owner-decision/fixtures.ts`
- `lib/owner-decision/index.ts`

Optional only if useful:

- `lib/owner-decision/validation.ts`

## Required Behavior

- Deterministic: no `new Date()` unless `decidedAt` or `createdAt` is injected by options/input.
- No external calls.
- No AI generation.
- No source scraping or URL fetching.
- No DB writes.
- No file export/write.
- No render.
- No output file creation.
- No new facts, numbers, claims, citations, narration, captions, or source references.
- Owner notes/revision notes, if supported, must be copied verbatim from explicit input only.
- Do not mutate the incoming `ReviewPacket` object unless the helper name and type make that behavior explicit.

At minimum, the gate result should expose:

- decisionRecordId or gateResultId
- reviewPacketId
- contentPackageId
- ownerDecision
- canProceedToRender
- blocker codes/reasons when false
- source/fact/citation ids
- qa.readyForRender
- risk.isBlocked

## Forbidden

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
- Do not implement full Money-OS product.
- Do not touch `output/`.
- Do not reuse retired Candidate10/Jun/static slideshow/old Money Architect routes, assets, prompts, or references.

## Required Checks

Run focused checks only:

- ESLint for `lib/owner-decision/`
- TypeScript check targeted to `lib/owner-decision/` or source-first modules
- Runtime/sample check that verifies:
  - approved valid review packet returns `canProceedToRender=true`
  - pending/missing decision returns `canProceedToRender=false`
  - revision requested returns `canProceedToRender=false`
  - rejected returns `canProceedToRender=false`
  - approved but QA not ready returns `canProceedToRender=false`
  - approved but risk blocked returns `canProceedToRender=false`
  - linkage ids are preserved
  - no command is executed and no files are created

## Definition of Done

- Owner decision gate module exports clear local types and deterministic helper(s).
- Valid approved review packet can pass the local gate.
- Not-ready, blocked, rejected, revision-requested, or pending packets fail the gate clearly.
- Focused checks pass.
- Final handoff reports changed files, checks/results, deviations/blockers, final `git status -sb`, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` with concise owner decision gate evidence because this creates the explicit Owner approval layer.
