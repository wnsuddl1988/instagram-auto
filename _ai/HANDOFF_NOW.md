# HANDOFF_NOW

전체프로젝트 진행률 : 약 97%

## Current Task

- Task ID: `owner-web-auto-topic-refresh-and-upload-button-v1`
- Owner direction: "처음 쓰는 사람이 주제 추천부터 영상 생성, 업로드까지 웹에서 이해하고 쓸 수 있게 하라. 작은 단위로 쪼개지 말고 큰 흐름 하나로 완성."
- Purpose: finish the Owner-facing `/money-shorts` workflow so it behaves like an actual automatic shorts tool, not a fixed demo or developer diagnostic page.

## Product Problem

Current web flow is closer, but still has two unacceptable product gaps:

1. `주제 추천받기` only loads 7 fixed local topics:
   - 2 script-ready topics from `money-shorts-retention-script-compiler.output.v1.json`
   - 5 candidate-only topics from `topic_candidate_report.v1.json`
   A first-time user expects fresh usable topic ideas whenever they click/refresh.

2. `실제 업로드` is still locked, so the Owner still needs terminal commands for real publishing. The Owner explicitly wants a web upload button.

## Approved Scope

Allowed in this slice:

- Update `/money-shorts` web UX so the main flow is:
  1. 카테고리 선택
  2. 새 주제 추천
  3. 대본 만들기
  4. 음성 만들기
  5. 영상 만들기
  6. 미리보기
  7. 게시 전 점검
  8. 실제 업로드
- Replace the fixed 7-topic catalog experience with fresh recommendations on each click/page session.
- Use a safe local/deterministic generator first if external LLM topic generation is not already safely wired.
- Ensure every shown recommended topic is usable by downstream steps:
  - script can be generated
  - voice mock/sample can be generated
  - video draft can be generated
  - preview works
- Keep the existing topic-linked render behavior and extend it, do not regress to fixed base-rate output.
- Add a web upload action/button that calls the existing final E2E one-shot runner path from the server side, using only approved runtime env keys from `process.env`, with values passed to child env only and never printed.
- Add a clear confirmation gate before upload in UI, e.g. type `업로드` or tick explicit checkboxes, so accidental clicks cannot publish.
- Add/reuse guard coverage for fresh topic generation, selected-topic propagation, upload button gating, no secret output, no raw command injection, and no duplicate t1/t2 republish.
- Update `docs/simple-execution-manual.md` briefly if needed.
- Append concise evidence to `_ai/CLAUDE_REPORT.md`.

Forbidden:

- Directly read/modify `.env`, `.env.*`, `.env.local`, secret files.
- Print/log/store credential values or value-derived length/prefix/suffix/hash/masked/token type.
- Dependency or lockfile changes.
- Deploy.
- Push.
- Re-upload/re-publish existing evidence:
  - Instagram `17916511431199303`
  - YouTube `r9jhckdpC9w`
  - Instagram `18103818062321982`
  - YouTube `T4Kgxhq4cpE`
- Use shell string command construction for user-controlled values.
- Allow arbitrary path/command input from the browser.

Important upload boundary:

- Implementing the web upload button is approved.
- Do **not** click/run a real upload during automated tests.
- Tests must use fake/dummy env, preflight-only, duplicate-block, or a disabled/no-op probe path.
- The real button may be wired for Owner use, but implementation verification must not publish another live video.
- The route must fail closed if required files/ledger/content unit are missing or if the topic was already published.

## Expected Product Behavior

### Fresh Topic Recommendations

`주제 추천받기` should no longer feel like "7 fixed samples".

Implement a practical local generator such as:

- category-specific topic templates/pools for the 8 supported categories:
  - AI생성활용
  - 밈&짤
  - 충격뉴스
  - TMI지식
  - 게임클립
  - 재테크팁
  - 귀여운동물
  - 셀럽엔터
- each click/session picks a new batch with unique IDs, fresh titles/hooks/angles
- avoid already published/used demo IDs (`t1_lifestyle_inflation`, `t2_salary_3days`, `base-rate-hold-202605`) unless explicitly marked as examples
- mark every generated recommendation as `scriptReady:true` by providing enough structured fields for rule-based script creation

If robust fully dynamic generation is too large, make it deterministic-local but varied enough:

- rotate/randomize from a larger in-repo topic bank
- include timestamp/session/batch id
- show at least 8-12 options, not 7
- each new click should produce a different set/order unless the Owner pins a topic

### Downstream Steps

For a selected generated topic:

- `대본 만들기` must build a script from that selected topic.
- `음성 만들기` must generate the local mock/sample voice from that script.
- `영상 만들기` must generate a draft video whose visible captions/title reflect that selected topic.
- `미리보기` must play that generated video.
- `게시 전 점검` must check the selected/generated content, not the old default sample.

Plain Korean errors only. Do not show raw validation/dev terms by default.

### Upload Button

The web UI should include an actual upload button for Owner local use, but protected:

- visible only after video exists and preflight passes
- requires explicit confirmation in the UI before enabling
- clear label: `인스타그램·유튜브에 업로드`
- show warning: `누르면 실제 계정에 게시됩니다.`
- server route should call the existing final E2E one-shot runner with `--arm` only after confirmation flag is present
- output should show only public IDs/URLs/status, never secrets
- if duplicate/ledger says already published, block and explain in Korean
- if env keys missing, say `업로드 키가 준비되지 않았습니다`

## Likely Files

Inspect first; edit only what is needed:

- `components/VideoCreationWizard.tsx`
- `components/OperatorPanel.tsx`
- `app/money-shorts/page.tsx`
- `app/api/money-shorts/operator/route.ts`
- `lib/owner-web-operator.ts`
- `scripts/check-owner-one-click-video-creation-ui-static.mjs`
- `scripts/check-owner-web-operator-ui-static.mjs` if route/operator contract changes
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

1. Build a real `freshTopicRecommend` path.
   - It can be local rule/template based for now.
   - It must generate more useful choices and different results on repeated clicks.
   - It must produce all fields needed for script creation.

2. Make script generation work for generated topics.
   - Do not depend only on `money-shorts-retention-script-compiler.output.v1.json`.
   - Add rule-based script builder if needed.
   - Keep language short, punchy, and suitable for 15-60 sec shorts.

3. Keep selected-topic propagation through voice/video/preview.
   - Topic ID/title/hook/caption lines must be reflected in generated input files and rendered captions.
   - Path usage must be sanitized and repo-outside under `C:\tmp\money-shorts-os\...`.

4. Add upload button wiring.
   - Use existing final E2E runner path if available.
   - Use `spawnSync(process.execPath, argsArray, { shell:false, ... })`.
   - Pass only approved env keys into child env; no broad spread.
   - Add confirmation gate and duplicate guard.
   - Do not execute actual upload in tests.

5. Update UI copy.
   - Replace "주제 추천받기" explanations with something like:
     `누를 때마다 새 주제를 추천합니다. 마음에 드는 주제를 고르면 아래 단계가 자동으로 이어집니다.`
   - Replace "실제 업로드 잠금" with gated upload instructions if implemented.

## Required Checks

Run targeted checks:

- `git status -sb`
- `node --check` for changed/new scripts
- `node scripts/check-owner-one-click-video-creation-ui-static.mjs`
- `node scripts/check-owner-web-operator-ui-static.mjs`
- `node node_modules/typescript/bin/tsc --noEmit --pretty false`

If touched, also run:

- `node scripts/check-owner-daily-automation-entrypoint-static.mjs`
- `node scripts/check-dual-platform-final-publish-orchestrator-static.mjs`

Recommended browser verification:

- start local dev server
- open `http://localhost:3000/money-shorts`
- click topic recommend twice and confirm different usable topics appear
- select one generated topic
- run script/voice/video/preview/preflight
- confirm upload button is gated and does not publish unless confirmation path is deliberately triggered
- do **not** perform actual live upload during verification

## Definition Of Done

Done means:

- A first-time user can understand the page without the PDF.
- `주제 추천받기` no longer shows only the same 7 fixed topics.
- Selected generated topic drives script, voice, video, and preview.
- Upload is available from web for Owner local use, with confirmation and fail-closed safety.
- No secrets are exposed.
- No real upload is executed during tests.
- Existing published evidence is never retried.
- Checks pass or any known environment-only failure is reported clearly.

## Final Handoff Required

Claude Code final report must include:

- task id
- changed files
- exact fresh-topic behavior
- exact downstream automation proof
- upload button behavior and whether any live upload was or was not executed
- checks/results
- side effects confirmation
- env/secret confirmation
- deviations/risks
- checkpoint recommendation
- progress line
