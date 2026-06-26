# Handoff Now

## Task ID

`package-preview-publishability-readiness-panel-v1-review-fix`

## Current State

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest local checkpoint: `c37426e fix(owner-decision): block non-publishable fact cards at gate`
- Latest known `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 44]`
- Dirty files from the previous slice:
  - `_ai/CLAUDE_REPORT.md`
  - `_ai/HANDOFF_NOW.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
  - `app/fact-cards/manual/package-preview/page.tsx`
- Untracked local extra: `piq_diag_out.txt`
- Push: not run.
- `piq_diag_out.txt` is unrelated untracked output. Do not read, modify, delete, stage, or commit it.

## Review Finding

Codex reviewed `package-preview-publishability-readiness-panel-v1`.

Implementation is conceptually accepted:

- The Publishability Readiness panel is useful and in-scope.
- It is read-only and keeps `isPublishable=false`.
- It does not add approval UI, render/export, clipboard write, DB, or API routes.

Blocking review-fix before checkpoint:

- Section numbering is duplicated in `app/fact-cards/manual/package-preview/page.tsx`.
- Current comments/titles include:
  - `⑧ Publishability Readiness`
  - `⑨ Review Packet`
  - `⑨ Owner Gate` ← duplicate
  - `⑩ Clipboard payload`
  - `⑪ Chart Card Package`
  - `⑪ Package view summary` ← duplicate
- Fix numbering/comment/title sequence so rendered titles and JSX comments are coherent and continuous.

Suggested sequence:

- `⑧ Publishability Readiness`
- `⑨ Review Packet`
- `⑩ Owner Decision Gate`
- `⑪ Clipboard Payload 준비 상태`
- `⑫ Chart Card Package`
- `⑬ Package View Summary`

## Goal

Apply the smallest possible review-fix to section numbering and keep the Publishability Readiness panel behavior unchanged.

## Approved Scope

Allowed implementation file:

- `app/fact-cards/manual/package-preview/page.tsx`

Allowed docs/state files:

- `_ai/CLAUDE_REPORT.md`
- `_ai/NEXT_ACTION.md`
- `_ai/PROJECT_STATE.md`
- `_ai/HANDOFF_NOW.md` only if final scope/status needs tiny correction.

Expected implementation:

1. Fix duplicate section numbering in JSX comments and `SectionCard title` strings.
2. Do not change panel logic, gate logic, route behavior, or data contracts.
3. Update `_ai/CLAUDE_REPORT.md` with concise review-fix evidence.
4. Update `_ai/NEXT_ACTION.md` / `_ai/PROJECT_STATE.md` only if needed to reflect review-fix completion.

## Required Behavior

- Start with `git status -sb`.
- Do not read, modify, delete, stage, or commit `piq_diag_out.txt`.
- Keep all behavior deterministic. No `Date.now()`/`Math.random()`.
- No secret values or secret-bearing ECOS URLs printed.

## Forbidden

- No GPT/Gemini/Veo/OpenAI/ElevenLabs calls.
- No ECOS live call.
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
- Do not set `isPublishable=true`.
- Do not add Owner approval UI.
- Do not resume retired video routes or old render loops.

## Required Checks

Run focused checks:

- `git status -sb`
- static numbering scan:
  - no duplicate rendered section numbers among `⑧` through `⑬`
  - JSX comments and `SectionCard title` prefixes match
- targeted ESLint for `app/fact-cards/manual/package-preview/page.tsx`
- TypeScript check only if the edit touches TS/JSX expressions beyond string/comment numbering
- static safety:
  - package-preview live selector still has `prefetch={false}`
  - money-shorts hub live link still has `prefetch={false}`
- forbidden pattern search on changed implementation file:
  - `Date.now`
  - `Math.random`
  - `navigator.clipboard`
  - `ffmpeg`
  - `output/`
  - `upload`
  - `deploy`
- untracked safety:
  - prove `piq_diag_out.txt` remains untracked and unstaged
- final `git status -sb`

Do not run full `pnpm build`; existing `output/` binary `.ts` pollution is a known blocker.

## Definition of Done

- Section numbers are coherent and continuous.
- Publishability Readiness panel logic remains unchanged.
- No new functionality, no scope expansion.
- No secret leakage.
- No DB/render/GPT/upload/push/dependency/output changes.
- Final handoff reports changed files, checks/results, deviations/risks, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` because this is review-fix evidence for the readiness panel.
