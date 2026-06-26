# Handoff Now

## Task ID

`owner-decision-publishability-gate-v1`

## Current State

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest local checkpoint: `41f4c25 fix(package-preview): stabilize chart card visual preview width`
- Latest known `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 43]` plus untracked `piq_diag_out.txt`
- Push: not run.
- `piq_diag_out.txt` is unrelated untracked output. Do not read, modify, delete, stage, or commit it.

Recently completed:

- CSS-only Chart Card visual previews are present in `/fact-cards/manual/package-preview`.
- QA fixed the flex shrink bug by giving `CardShell` explicit `width: "160px"` and `minWidth: "160px"`.
- Current package preview can show source-first Fact Card, script package, review packet, owner gate, clipboard payload, and chart-card props/visual previews.
- Live latest ECOS draft candidate is available only by explicit query:
  - `/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606`
  - live route remains `provider-ecos-live`, `isMock=false`, `isPublishable=false`
  - BOK source-date provenance is preserved; `publishedDate=2025-05-29` is not derived from ECOS period `202605`.

Important problem to fix next:

- `OwnerDecisionGate` currently blocks on decision/QA/risk only.
- It does **not** know whether the Fact Card is publishable.
- Therefore a future approval UI could accidentally make a draft-only Fact Card (`isPublishable=false`) look render/copy ready if `decision="approved"` is supplied.
- Before adding Owner approval controls, the gate/review packet path must preserve and enforce Fact Card publishability.

State-doc nuance:

- `_ai/NEXT_ACTION.md` and `_ai/PROJECT_STATE.md` may still have stale checkpoint text around recent chart-card tasks.
- Sync minimal durable state as part of this slice, not as a standalone docs-only task.

## Goal

Make the Owner Decision Gate source-first safe by ensuring `FactCard.isPublishable=false` prevents render/copy readiness, even if an Owner decision is approved later.

This is a safety/contract alignment slice, not a render or approval UI slice.

## Approved Scope

Allowed implementation files:

- `lib/review-packet/types.ts`
- `lib/review-packet/generator.ts`
- `lib/owner-decision/types.ts`
- `lib/owner-decision/gate.ts`
- `app/fact-cards/manual/package-preview/page.tsx`
- Any directly related local fixtures/tests only if TypeScript requires them.

Allowed docs/state files:

- `_ai/CLAUDE_REPORT.md`
- `_ai/NEXT_ACTION.md`
- `_ai/PROJECT_STATE.md`
- `_ai/HANDOFF_NOW.md` only if final scope/status needs tiny correction.

Expected implementation direction:

1. Add `isPublishable: boolean` to `ReviewFactCardSummary`.
2. Populate it from the package Fact Card in `generateReviewPacket()`.
3. Add an owner-gate blocker code such as `fact_card_not_publishable`.
4. In `evaluateOwnerDecision()`, block `canProceedToRender` when `packet.factCard.isPublishable !== true`.
5. Ensure `buildClipboardPayload()` stays unchanged unless TypeScript forces a narrow update; it should naturally keep `copyReady=false` because `gate.canProceedToRender=false`.
6. Update package-preview UI text around Owner Gate / Clipboard / Package Summary so draft-only blocking is visible and not confusing.
7. Keep default/mock/live routes loading. It is acceptable and expected if current fixtures/drafts now show `copyReady=false` because their Fact Cards are `isPublishable=false`.

Not required:

- Do not add Owner approval UI yet.
- Do not set any Fact Card to `isPublishable=true`.
- Do not implement render/export/copy-to-clipboard.
- Do not add persistence, DB, or API routes.

## Required Behavior

- Start with `git status -sb`.
- Expected at start:
  - branch ahead `43`
  - untracked `piq_diag_out.txt`
  - tracked dirty `_ai/HANDOFF_NOW.md` from this Codex handoff update
- Do not read, modify, delete, stage, or commit `piq_diag_out.txt`.
- Keep all behavior deterministic. No `Date.now()`/`Math.random()`.
- No secret values or secret-bearing ECOS URLs printed.

## Forbidden

- No GPT/Gemini/Veo/OpenAI/ElevenLabs calls.
- No ECOS live call unless a route smoke explicitly needs it; default should be static/non-live checks.
- No ffmpeg execution.
- No video/audio/image rendering or repository artifacts.
- No OS clipboard writes.
- No DB/Supabase reads, writes, migrations, or production changes.
- No API route changes.
- No API key/env/secret changes or writes.
- No dependency or lockfile changes.
- No `output/` changes.
- No upload/post/deploy.
- No git push.
- No commit unless Codex explicitly authorizes it later.
- Do not touch `piq_diag_out.txt`.
- Do not resume retired video routes or old render loops.

## Required Checks

Run focused checks:

- `git status -sb`
- targeted TypeScript/source check for changed files or the existing focused no-output pattern
- targeted ESLint for changed implementation files
- route/static smoke:
  - `/fact-cards/manual/package-preview` loads
  - `/fact-cards/manual/package-preview?candidate=base-rate` loads
  - Owner Gate shows draft publishability blocker when `isPublishable=false`
  - Clipboard payload remains `copyReady=false` when gate is blocked
  - Chart Card visual preview still appears
  - no React unique key warning
  - no obvious console error
- static safety:
  - package-preview live selector still has `prefetch={false}`
  - money-shorts hub live link still has `prefetch={false}`
  - no new `createEcosLiveTransport` path outside explicit live branch
- forbidden pattern search on changed implementation files:
  - `Date.now`
  - `Math.random`
  - `navigator.clipboard`
  - `ffmpeg`
  - `output/`
  - `upload`
  - `deploy`
- secret safety:
  - no API key value printed
  - no `.env*` modified/staged
  - no secret-bearing ECOS URL printed or rendered
- untracked safety:
  - prove `piq_diag_out.txt` remains untracked and unstaged
- final `git status -sb`

Do not run full `pnpm build`; existing `output/` binary `.ts` pollution is a known blocker.

## Definition of Done

- ReviewPacket carries Fact Card publishability.
- OwnerDecisionGate blocks when `isPublishable=false`.
- Clipboard payload stays not ready whenever the gate is blocked.
- Package preview communicates the blocker clearly.
- Existing default and mock package-preview routes still load.
- `_ai` state is minimally synced to recent checkpoints:
  - `92f545b`
  - `a69e497`
  - `5368566`
  - `41f4c25`
- No secret leakage.
- No DB/render/GPT/upload/push/dependency/output changes.
- Final handoff reports changed files, checks/results, route evidence, deviations/risks, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` because gate behavior is reusable release/safety evidence.
