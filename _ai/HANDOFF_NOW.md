# HANDOFF_NOW

## Task ID

`money-shorts-os-package-preview-route-smoke-v1`

## Project

`C:\Users\PC\jjy\instagram-auto`

## Current Checkpoint

- Branch: `codex/source-first-blueprint-clean`
- Latest HEAD: `b2dadee feat(source-facts): include QA report in generated copy payload` (uncommitted docs + route smoke evidence)
- Current local status: ahead 69, _ai docs modified
- Push: do not push.
- Known unrelated untracked file: `piq_diag_out.txt` -- do not read, modify, delete, stage, or commit.
- Local approval data under `.money-shorts-local/` is gitignored local data and must not be read, modified, staged, or committed.

## Current Result

`money-shorts-os-package-preview-route-smoke-v1` 완료 — PASS.

Route smoke 결과:
- `GET /fact-cards/manual/package-preview 200` — 성공
- server error / 500 / runtime exception: 없음
- browser console error: 없음 (HMR connected 메시지만)
- browser console warning: 없음
- hydration error (`did not match`): 없음
- React key warning: 없음
- `window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__`: false

패널 presence 확인 (HTML 포함, details 닫힘 상태 포함):
- Signal Translation / 6 Scene Cards Preview: PASS
- Sample 1 / 2 / 3 (환율/금리/물가): PASS
- Caption / Scene QA Coverage (×3): PASS
- Scene Package QA Report / "not a publication gate" (×3): PASS
- Generated Copy Payload Preview / "no clipboard write" (×3): PASS
- `qaReport.isValid` in HTML (details 닫힘): PASS
- exchange_rate / interest_rate / inflation templateId: PASS
- MOCK / NOT PUBLISHABLE: PASS
- display-only: PASS

display-only 원칙 확인:
- 버튼 5개 — 기존 ledger 컨트롤(pending/approved/rejected/revision_requested, Mock Fact Card disabled) 전부 기존 흐름
- clipboard button 없음 (data-clipboard, .copy-button 없음)
- textarea 4개 — 3개 `readOnly: true` (JSON payload), 1개 `readOnly: false` (기존 "승인 메모 입력" ledger textarea, Signal Translation 무관)
- 총 details 30개 (3 packages × 10 sections), open 3개

details 구성 확인 (per package):
1. Caption / Scene QA Coverage
2. Scene Package QA Report
3. Signal Translation Brief Summary
4-9. Scene 1~6
10. Generated Copy Payload Preview

No code changes needed.

## Verification Evidence

- `node scripts/check-signal-translation-preview-static.mjs`: 50/50 PASS
- `GET /fact-cards/manual/package-preview`: HTTP 200
- browser console errors: 없음
- hydration errors: 없음
- key warnings: 없음
- failed network requests: 없음
- `.money-shorts-local/`: 앱이 ledger 데이터를 read-only로 읽음, write 없음

## Recommended Next Task

1. **다음 content/QA slice** (Codex 결정 대기)
   - Signal Translation preview/QA/copy payload/route smoke foundation 완료.
   - Next substantive work은 Codex 결정 필요.

## Forbidden

- Do not touch `piq_diag_out.txt`.
- Do not read, modify, delete, stage, or commit `.money-shorts-local/` data.
- Do not stage/commit/push unless explicitly approved later.
- Do not add dependencies or edit lockfiles.
- Do not edit `.env*`, secrets, deployment config, DB/Supabase schema, migrations, or API credentials.
- Do not call OpenAI/GPT, Gemini, Veo, ElevenLabs, KOSIS, OpenDART, FRED, ECOS live, or any live API.
- Do not run ffmpeg, render, export, upload, post, deploy, or write to `output/`.
- Do not write to OS clipboard, `localStorage`, or `sessionStorage`.
