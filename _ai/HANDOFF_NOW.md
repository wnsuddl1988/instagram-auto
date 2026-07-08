# HANDOFF_NOW

전체프로젝트 진행률 : 약 97%

## Current Task

- Task ID: `owner-one-click-video-creation-topic-linked-render-fix-v1`
- Owner approval: `APPROVE_OWNER_ONE_CLICK_VIDEO_CREATION_UI`
- Purpose: finish the Owner-facing **"자동 쇼츠 만들기"** web flow by fixing the review finding that the selected topic/script does not yet drive the generated draft video.

## Codex Review Finding To Fix

The first implementation improved the web UX and passed the no-upload safety guards, but it has one product-blocking mismatch:

- The user selects a topic and sees a script for that topic.
- But `videoCreate` still calls a hardcoded provider/base-rate render manifest and hardcoded TTS/upload metadata fixtures.
- The UI even says "고른 주제 전용 영상은 아직 연결 필요".

This is not acceptable for the Owner-facing flow. A first-time user expects "주제 선택 → 대본 → 영상 만들기" to produce a draft video for the selected topic, not a different fixed sample.

Fix this in the same big product slice. Do not create another tiny planning task.

The Owner is correct: the intended product is not "manual Fact Card validation". The intended product is:

1. choose category
2. recommend/select topic
3. create script
4. create voice
5. create video
6. preview result
7. preflight before publish

This task must make the website show that flow clearly. Do not produce another terminal-heavy manual or another developer-only diagnostics panel.

## Product Problem To Fix

Current `/money-shorts` is better than before, but it still sends users into `/fact-cards/manual/new`, which is a developer/source-validation form full of terms like `Fact Card`, `validation`, `sourceName`, `currentValue`. A first-time user cannot understand how to make a video from this.

The fix is not more explanation. The fix is the web UI itself:

- `/money-shorts` must become the practical entry point for making a short.
- The primary CTA should be **"자동 쇼츠 만들기"** or **"영상 만들기 시작"**, not a path to a raw Fact Card form.
- The visible workflow should be category/topic/script/voice/video/preview/preflight.
- The existing manual Fact Card screen should be demoted to **advanced/source direct input**.
- Errors should be explained in plain Korean. Do not show raw validation errors by default.

## Approved Scope

Allowed:

- Web UI and copy changes for `/money-shorts`.
- Add or modify client components for the "자동 쇼츠 만들기" flow.
- Add or modify local-only API route/helper code to connect the visible buttons to existing safe local scripts.
- Use existing local generation scripts and dry-run/preflight modes where they already exist.
- Add a small static guard for this UI flow.
- Update `docs/simple-execution-manual.md` if needed, but keep it web-first and short.
- Update `_ai/CLAUDE_REPORT.md` with concise evidence if reusable.

Forbidden:

- Directly read/modify `.env`, `.env.*`, `.env.local`, secret files.
- Print/log/store credential values or value-derived length/prefix/suffix/hash/masked/token type.
- Instagram/YouTube upload or publish.
- Vercel Blob mutation (`put/delete/overwrite/list/head/copy`) unless it is already part of a no-live/preflight-only path that performs no mutation.
- Deploy.
- Push.
- Dependency or lockfile changes.
- Re-publish/re-upload existing evidence.

Important nuance:

- The Owner approved connecting existing local generation scripts. If a stage can be implemented safely with existing local scripts, wire it.
- If a stage would require external paid/content-generation APIs and no safe existing local wrapper/dry-run is available, do not fake it. Show it in the UI as "다음 승인 필요" or "아직 연결 필요" with a plain explanation.
- Do not call external content-generation APIs merely to prove the UI unless an existing approved local script already does that safely and without secret exposure.

## Desired UX

`/money-shorts` should expose a clear flow like:

1. **카테고리 선택**
   - 8 category options from project goal if available:
     - AI생성활용
     - 밈&짤
     - 충격뉴스
     - TMI지식
     - 게임클립
     - 재테크팁
     - 귀여운동물
     - 셀럽엔터
   - If current engine only has finance/source-based content ready, say so plainly and mark other categories as "준비 중".

2. **주제 추천**
   - Button label: `주제 추천받기`
   - Must show a recommended topic in plain Korean.
   - Prefer local/sample/safe fixture if real topic generation is not safely wired yet.
   - Do not expose raw Fact Card terms.

3. **대본 만들기**
   - Button label: `대본 만들기`
   - Show short script preview or "연결 준비됨/다음 승인 필요" if not safely wired.

4. **음성 만들기**
   - Button label: `음성 만들기`
   - Show voice status. Do not call paid TTS unless safely existing and approved by scope.

5. **영상 만들기**
   - Button label: `영상 만들기`
   - If safe local render script can be called without upload/secret/API issues, wire it.
   - If not, show clear blocker and what is needed next.

6. **미리보기**
   - Show output path/status if a local video artifact exists.
   - Otherwise show "아직 영상 파일이 없습니다" in plain Korean.

7. **게시 전 점검**
   - Reuse existing `finalE2ePreflight` / operator preflight when possible.
   - Must not upload.

8. **실제 업로드**
   - Keep locked/disabled in this scope.
   - Text: `실제 업로드는 별도 승인 후 활성화됩니다.`

## UI Requirements

- First-time user must know what to do without reading PDF.
- Do not display raw validation errors on initial load.
- Do not show "Fact Card", "authorManualFactCard", "validation errors", "sourceName", "currentValue" as primary user-facing language.
- If advanced source input remains linked, label it:
  - `고급: 출처 직접 입력`
  - `숫자와 출처를 직접 넣는 전문가용 화면입니다.`
- Use clear Korean button labels.
- Avoid giant explanations inside cards. Use short one-line guidance near each button.
- Actual upload button remains disabled.
- Production/Vercel page must not imply it can use Owner PC local files. If local-only, say:
  - `실제 생성은 Owner PC에서 로컬 실행 화면으로 진행합니다.`

## Likely Files

Inspect first, then edit only what is needed:

- `app/money-shorts/page.tsx`
- `components/OperatorPanel.tsx`
- `lib/owner-web-operator.ts`
- `app/api/money-shorts/operator/route.ts`
- possibly a new component such as `components/VideoCreationWizard.tsx`
- possibly a guard such as `scripts/check-owner-one-click-video-creation-ui-static.mjs`
- `docs/simple-execution-manual.md`
- `_ai/CLAUDE_REPORT.md`

Do not touch unrelated dirty/protected files:

- `_ai/CODEX_REVIEW.md`
- `_ai/NEXT_ACTION.md`
- `_ai/PROJECT_STATE.md`
- `_ai/CONTEXT_TRANSFER_CODEX.md`
- `pnpm-workspace.yaml`
- `scripts/render-golden-sample-visual-only-v1.mjs`
- `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
- `scripts/get-youtube-refresh-token-once.mjs`
- `piq_diag_out.txt`
- `shadow-list.txt`
- `tmp/`
- `output/`

## Implementation Guidance

Do this as one meaningful product slice:

1. Keep the redesigned `/money-shorts` Owner-facing automatic creation flow.
2. Fix `videoCreate` so it is not hardcoded to the provider/base-rate fixture when the user selected a different ready topic.
3. Prefer a safe local approach:
   - Accept/pass `topicId` from the wizard to the route/helper.
   - Use the selected topic's `readScriptPreview(topicId)` result.
   - Generate temporary repo-outside wizard input JSON files under `C:\tmp\money-shorts-os\web-wizard-create-v1\inputs\<safe-topic-id>\`:
     - render manifest derived from the existing local render-manifest schema, but with `manifestId`, ids, captions, source overlay, and planned paths reflecting the selected topic.
     - local mock TTS script derived from selected script text/captions.
     - upload metadata derived from selected title/caption/hashtags, marked `local_mock`, `notUploaded:true`, `ownerApprovalRequired:true`.
     - owner approval fixture if needed, also local/mock/no-upload.
   - Then call `run-local-money-shorts-pipeline-dry-run.mjs` with those generated files.
4. If a selected topic has no script preview, block plainly before video creation:
   - `이 주제는 아직 영상 생성까지 연결되지 않았습니다. 대본 준비됨 표시가 있는 주제를 선택해 주세요.`
5. Remove or rewrite UI text that says the video engine is fixed to 기준금리. The UI must not imply "영상 만들기" works while generating a different topic.
6. Keep actual upload locked.
7. Make the "manual fact card" route secondary/advanced.
8. Update or add static guard checks that catch this regression:
   - main page contains "자동 쇼츠 만들기" or "영상 만들기 시작"
   - flow labels exist: category/topic/script/voice/video/preview/preflight
   - initial UI does not show raw validation/error developer terms
   - actual upload remains disabled/locked
   - route/helper does not include `--arm`/`--live` in command args
   - no direct `.env.local` read
   - no Blob/Instagram/YouTube upload calls in this slice
   - `videoCreate` sends/uses `topicId`
   - helper no longer uses only the hardcoded provider/base-rate render manifest for `videoCreate`
   - generated wizard input files are repo-outside and topic-specific
   - a ready selected topic creates a preview whose summary/metadata/caption includes that selected topic, not the old 기준금리 fixed sample.

## Checks

Required:

- `git status -sb`
- `node --check` for changed/new scripts
- run the new static guard
- existing relevant guards if touched:
  - `node scripts/check-owner-web-operator-ui-static.mjs`
  - `node scripts/check-owner-daily-automation-entrypoint-static.mjs` if owner entrypoint/wrapper changed
  - `node scripts/check-dual-platform-final-publish-orchestrator-static.mjs` if orchestrator changed
- `node node_modules/typescript/bin/tsc --noEmit --pretty false`
  - If TS6053 local type-link issue appears again, report it. Do not repair dependencies unless separately approved.

Recommended:

- Start local dev server if practical and inspect `/money-shorts` visually.
- If using Playwright/browser verification, ensure no external upload/API calls are made.

## Definition Of Done

Done means the Owner can open `/money-shorts` and immediately understand:

- "I choose a category."
- "I ask for a topic."
- "I make script."
- "I make voice."
- "I make video."
- "I preview."
- "I run preflight."
- "Upload is intentionally locked."

Do not claim full automatic production publishing is complete. This slice is web UX + local creation flow wiring up to safe preflight / safe existing local generation actions.

## Final Handoff Required

Return concise Korean handoff:

- task id
- changed files
- what the new web flow does
- which buttons are actually wired vs clearly marked pending/locked
- checks/results
- side effects confirmation
- env/secret confirmation
- deviations/risks
- checkpoint recommendation
- 전체프로젝트 진행률 : 약 97%

Stop after final handoff. Do not commit. Do not push. Do not deploy.
