# Handoff Now

## Task ID

`ecos-base-rate-unchanged-copy-quality-v1`

## Current State

Current status:

- **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**
- Branch: `codex/source-first-blueprint-clean`
- Latest local checkpoint: `f5db4c5 fix(package-preview): keep live draft gate pending`
- Latest known `git status -sb`: `## codex/source-first-blueprint-clean...origin/main [ahead 39]` plus untracked `piq_diag_out.txt`
- Push: not run.
- `piq_diag_out.txt` is unrelated untracked output. Do not read, modify, delete, stage, or commit it.

Recently completed:

- Live latest draft Owner acceptance smoke passed with a non-blocking quality gap.
- Live route evidence:
  - `sourceProviderId=provider-ecos-live`
  - `isMock=false`
  - `isPublishable=false`
  - `dataPeriod=2026년 5월`
  - `publishedDate=2025-05-29`
  - BOK source-date citation present
  - `decision_pending`
  - `canProceedToRender=false`
  - `copyReady=false`
- Quality gap found:
  - For unchanged base rate (`currentValue=2.5%`, `previousValue=2.5%`, `changeValue=0.0%p`), generated interpretation says:
    - "2.5%에서 2.5%로 0.0%p 조정했다."
  - This is source-accurate but low-quality. It should say the rate was held/frozen/unchanged.

Important nuance:

- This task must improve wording only for the ECOS base-rate Fact Card candidate.
- Do not invent facts or forecasts.
- Do not set `isPublishable=true`.
- Keep live route draft-only.
- `_ai` docs currently contain acceptance smoke evidence; this implementation should preserve and extend that evidence.

## Goal

Improve ECOS base-rate candidate wording for unchanged (`changeValue === 0`) cases so live/latest and mock candidates say "동결/변동 없음" instead of "2.5%에서 2.5%로 0.0%p 조정".

Primary target:

- `lib/source-facts/candidates.ts`
  - Both `ecosBaseRateParser` and `ecosBaseRateLiveParser` should produce better `interpretation` and `allowedClaims` when `changeValue === 0`.
  - Non-zero change behavior should remain unchanged.

## Approved Scope

Allowed:

- Modify:
  - `lib/source-facts/candidates.ts`
  - `_ai/CLAUDE_REPORT.md`
  - `_ai/NEXT_ACTION.md`
  - `_ai/PROJECT_STATE.md`
- Add a small local helper in `candidates.ts` if it reduces duplication between mock and live parser.
- Suggested behavior:
  - If `p.changeValue === 0`:
    - interpretation: `한국은행이 ${p.dataPeriod} 기준금리를 ${p.currentValueText}로 동결했다. 직전 발표 대비 변동은 ${p.changeValueText}다.`
    - allowed claim: `직전 기준금리 대비 변동은 ${p.changeValueText}다.`
    - or equivalent clear Korean wording using only Fact Card fields.
  - If `p.changeValue !== 0`:
    - keep existing adjustment wording.
- Keep existing numeric fields unchanged:
  - `currentValue`
  - `previousValue`
  - `changeValue`
  - `changeRate`
  - numeric values
  - citations
  - `isMock`
  - `isPublishable`

Not required:

- Do not change normalizer math.
- Do not change ECOS/BOK connector logic.
- Do not change package preview gate logic.
- Do not alter script generator globally unless a direct test proves it is necessary.
- Do not add tests with new dependencies.

## Required Behavior

- Start with `git status -sb`.
- Expected at start:
  - branch ahead `39`
  - dirty `_ai` docs from acceptance smoke
  - untracked `piq_diag_out.txt`
  - no app/lib dirty files except this task's changes.
- Do not read, modify, delete, stage, or commit `piq_diag_out.txt`.
- Keep all wording source-first and conservative:
  - no forecast
  - no advice
  - no invented policy motive
  - no "인하/인상" unless sign actually indicates it.
- Do not print secret values or secret-bearing ECOS URLs.

## Forbidden

- No GPT/Gemini/Veo/OpenAI/ElevenLabs calls.
- No ffmpeg execution.
- No video/audio/image rendering.
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
- Do not resume retired video routes or old render loops.

## Required Checks

Run focused checks:

- `git status -sb`
- targeted ESLint for changed source file(s)
- focused TypeScript check for changed source file(s)
- static/content verification:
  - generated mock base-rate candidate interpretation no longer contains `3.0%에서 3.0%로 0.0%p 조정`
  - live parser path for unchanged `2.5% -> 2.5%` would produce "동결" or equivalent unchanged wording
  - non-zero change wording remains "조정" style
  - no numeric field changes
- route smoke if practical:
  - `/fact-cards/manual/package-preview?candidate=base-rate` shows improved unchanged wording
  - optional live route smoke only if already available and safe; otherwise static verification is acceptable
- secret safety:
  - no API key value printed
  - no `.env*` modified/staged
  - no secret-bearing ECOS URL printed or rendered
- forbidden pattern search on changed source/app file(s):
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

- Unchanged base-rate cases use clear "동결/변동 없음" wording.
- No facts/numbers are invented.
- Non-zero base-rate change wording remains intact.
- Live route remains draft-only and gate-pending.
- Acceptance smoke docs and current checkpoint state remain synchronized.
- No secret leakage.
- No DB/render/GPT/upload/push/dependency/output changes.
- Final handoff reports changed files, checks/results, wording evidence, deviations/risks, and checkpoint recommendation.

## Checkpoint Policy

- Do not commit unless Codex explicitly authorizes a safe local checkpoint commit.
- Do not push.

## CLAUDE_REPORT Policy

- Update `_ai/CLAUDE_REPORT.md` because this closes the quality gap found during acceptance smoke.
