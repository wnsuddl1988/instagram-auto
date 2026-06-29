# HANDOFF_NOW

## Task ID

`post-route-smoke-state-doc-cleanup-v1-review-fix`

## Project

`C:\Users\PC\jjy\instagram-auto`

## Current Checkpoint

- Branch: `codex/source-first-blueprint-clean`
- Latest HEAD: `2b1db95 docs(state): record package preview route smoke pass` ← **현재 HEAD**
- Current local status: ahead 70, _ai docs cleanup only
- Push: Owner가 명시적으로 `push까지`라고 할 때만.
- Known unrelated untracked file: `piq_diag_out.txt` -- do not read, modify, delete, stage, or commit.
- Local approval data under `.money-shorts-local/` is gitignored local data and must not be read, modified, staged, or committed.

## Current Result

`_ai` docs cleanup review-fix — duplicate slice 8 제거, stale wording 정리.

Route smoke verification PASS (checkpoint `2b1db95`):
- `GET /fact-cards/manual/package-preview 200` — 성공
- server error / 500 / runtime exception: 없음
- browser console error: 없음
- browser console warning: 없음
- hydration error: 없음
- React key warning: 없음

패널 확인:
- Signal Translation / 6 Scene Cards Preview: PASS (3 packages × 10 sections = 30 details panels)
- Sample 1/2/3 (환율/금리/물가) + all QA panels: PASS
- `qaReport.isValid` in HTML: PASS (details closed 포함)
- MOCK / NOT PUBLISHABLE: PASS
- display-only / no clipboard write: PASS

display-only 원칙:
- clipboard button: 없음
- textarea 4개 — 3개 readOnly:true (JSON payload), 1개 readOnly:false (기존 ledger textarea, Signal Translation 무관)
- 버튼 5개 — 전부 기존 ledger 컨트롤 (pending/approved/rejected/revision_requested, Mock Fact Card disabled)

`.money-shorts-local/`:
- 앱이 route load 중 ledger 데이터 read-only 접근
- write 없음

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
