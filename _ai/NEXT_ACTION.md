# AutoShorts AI — Next Action

Updated: 2026-08-09 KST

## Shorts Editorial OS V2 — Production Activation PA-4 self-validation and read-only Cross Review

- Slice 0~8, V2 base rebuild milestone, PA-1, PA-2, PA-3는 `FINAL_PASS`; PA-4는 Claude Code `sonnet/high` read-only Cross Review에서 `PASS`, P0 `0`, P1 `0`, P2 `2`, escalation `NO`를 받았고 `FINAL_PASS_AWAITING_CHECKPOINT`다.
- Codex self-validation: checker `1523/1523 PASS`; targeted TypeScript syntactic/semantic/strict preEmit `0/0/0`; `git diff --check` PASS; exact `42` paths(`25M/17U`), staged 0, baseline/config/governance/checkpoint mismatch 0; no-network mock-provider proof PASS.
- Mock proof: canonical 8 scenes, full requests 8, cache requests 0, synthetic third-request failure에서 즉시 중단, failed/pending-only retry 6, final technical package approved, actual network 0, ffprobe MP3 1000ms, repository status/hash unchanged, temp cleanup. `pnpm build`와 실제 ElevenLabs 호출은 실행하지 않았다.
- 다음 routine 작업은 사전 승인된 exact 18-path checkpoint다. 고정 message는 `feat(editorial-v2): checkpoint external voice materialization foundation`이며 package.json과 기존 dirty baseline은 stage/commit하지 않는다.
- 검수 대상: exact allowlist/baseline/governance, canonical narration authority, plan-hash paid gate, server-only secret, fixed endpoint/redirect, response/audio bounds, strict base64, timestamp/text/duration validation, provider-timed subtitles, immutable cache, stop-on-first failure, failed/pending-only recovery, same-origin API, checker false-PASS, no live network, PA-3 silent-preview honesty.
- package.json은 기존 protected dirty baseline이다. 초기 HEAD-identical 조건 충돌로 Codex가 fail-closed했으며 Control Tower가 HEAD restore 대신 PA-3 protected working identity 보존으로 정정했다. PA-4 delta/stage/commit inclusion은 0이고 workspace/lock/Next config는 계속 HEAD-identical이어야 한다.
- 승인 범위 안의 일반 P1이고 escalation `NO`이면 Codex가 exact 18-path 안에서 최대 2회 correction과 targeted re-review를 진행한다.
- API key leak, canonical narration bypass, arbitrary provider URL/path, actual external call, uncontrolled paid retry, V1 contamination, allowlist 확대, P0/BLOCKED, 동일 P1 재발, correction 2회 초과는 ChatGPT Control Tower 즉시 에스컬레이션이다.
- Claude 최종 PASS, P0 0, P1 0, checker·mock-provider proof·diagnostics·보호 baseline PASS이면 exact 18-path checkpoint가 사전 승인돼 있다.
- 고정 commit message: `feat(editorial-v2): checkpoint external voice materialization foundation`; Push: `NOT_AUTHORIZED`; 다음 activation: `BLOCKED`.
- Correction evidence: validation-harness correction `1`(numeric literal 없는 fixture), product correction `1`(Render manifest canonical 32-hex hash 재계산 검증). 두 실패 모두 provider request 전 fail-closed했고 최종 전체 검증은 PASS했다.
- Claude optional P2 2건은 Origin 없는 non-browser mutation의 향후 공통 route hardening과 선행 exact-text 검증으로 이미 보호되는 subtitle coverage 조건 단순화다. Must-fix는 0이므로 PA-4 correction 없이 checkpoint한다.
- Self-validation evidence: `FINAL_PASS`; Cross Review: `PASS`; live provider capability: `IMPLEMENTED_BUT_LIVE_UNVERIFIED`; production voice quality: `NOT_APPROVED`; PA-3 preview audio: `SILENT_PLACEHOLDER`; next activation: `BLOCKED`.

## PA-4 review 후 분기

1. PASS, P0 0, P1 0, escalation NO: exact 18-path checkpoint를 수행한다.
2. allowlist 안의 일반 P1, escalation NO: 최대 2회 최소 correction 후 Claude targeted re-review를 요청한다.
3. P0, BLOCKED, escalation YES, scope expansion 또는 동일 P1 재발: 즉시 ChatGPT Control Tower로 에스컬레이션한다.

## Shorts Editorial OS V2 — Slice 8 read-only Cross Review

- Slice 0~7는 `FINAL_PASS`; Slice 7 checkpoint HEAD는 `9a29fd4d2fd3e828a45f31d0c0ee2332465b4a62`다.
- Slice 8 implementation: `IMPLEMENTATION_COMPLETE_AWAITING_CROSS_REVIEW`.
- 다음 routine 작업은 exact 17개 path에 대한 `Claude Code Slice 8 read-only Cross Review`다.
- `ChatGPT 중간 전달 불필요`; Owner는 Codex가 제공하는 prompt를 Claude Code에 전달하고, `Claude 결과는 Codex에 전달`한다.
- Claude Code는 파일 수정·임시 파일 생성·external write·probe 재실행·commit·push 없이 `PASS | NEEDS_FIX | BLOCKED`, `P0/P1/P2`, `CONTROL_TOWER_ESCALATION_TRIGGERED`를 보고한다.
- 승인 범위 안의 일반 `P1 correction`이고 escalation `NO`이면 Codex가 17-path allowlist 안에서 최대 2회 국소 수정과 targeted re-review를 자율 진행한다.
- `P0/BLOCKED/scope expansion`, 최종 브랜드 선택, 실제 production sample/account/API/asset generation 필요는 ChatGPT Control Tower escalation 대상이다.
- Claude 최종 PASS, P0 0, P1 0, checker·diagnostics·synthetic proof·보호 baseline PASS이면 exact 17-file checkpoint가 사전 승인돼 있다.
- 고정 commit message: `feat(editorial-v2): checkpoint slice 8 relaunch readiness`; Push: `NOT_AUTHORIZED`.
- Production Activation 자동 시작 금지; final brand/account/OAuth/external TTS/actual asset/user-content render/persistence/publish/deploy/push도 금지다.
- Codex 검증: checker `784/784 PASS`; targeted TypeScript semantic/syntactic 각각 `0`; final full `pnpm exec tsc --noEmit` PASS; `git diff --check` PASS; synthetic representative sample probe `PASS` (1회); `pnpm build` PASS (1회, 이후 pure hardening은 tsc+checker 재검증); exact 41-path와 보호 mismatch `0`.
- 상태: `SLICE_8_CLAUDE_CODE_READ_ONLY_CROSS_REVIEW_REQUIRED`.

## Slice 8 review 후 분기

1. PASS, P0 0, P1 0, escalation NO: exact 17-file checkpoint를 수행한다.
2. allowlist 안의 일반 P1, escalation NO: 최대 2회 최소 correction 후 Claude targeted re-review를 요청한다.
3. P0, BLOCKED, escalation YES, scope expansion, 최종 브랜드 결정 또는 실제 외부 실행 필요: 즉시 ChatGPT Control Tower로 에스컬레이션한다.

## Shorts Editorial OS V2 — Slice 7 read-only Cross Review

- Slice 0·1·2·3·4·5·6는 `FINAL_PASS`; Slice 6 checkpoint HEAD는 `5e0e0e044b3ebea6af07b98e733a3eac6a96aa2c`다.
- Slice 7 implementation: `IMPLEMENTATION_COMPLETE_AWAITING_CROSS_REVIEW`.
- 다음 routine 작업은 승인된 정확한 18개 파일에 대한 `Claude Code Slice 7 read-only Cross Review`다.
- `ChatGPT 중간 전달 불필요`; Owner는 Codex가 제공하는 prompt를 Claude Code에 전달하고, `Claude 결과는 Codex에 전달`한다.
- Claude Code는 파일 수정·임시 파일 생성·external write·commit·push 없이 `PASS | NEEDS_FIX | BLOCKED`, `P0/P1/P2`, `CONTROL_TOWER_ESCALATION_TRIGGERED`를 보고한다.
- 승인 범위 안의 일반 P1이고 escalation `NO`이면 Codex가 18-path allowlist 안에서 최대 2회 국소 수정과 targeted re-review를 자율 진행한다. `P0/BLOCKED/scope expansion`은 ChatGPT Control Tower escalation 대상이다.
- Claude 최종 `PASS`, `P0 0`, `P1 0`, escalation `NO`이면 exact 18-file checkpoint commit이 사전 승인돼 있다.
- 고정 commit message는 `feat(editorial-v2): checkpoint slice 7 publish recovery plan`; Push: `NOT_AUTHORIZED`다.
- `Slice 8 자동 시작 금지`; OAuth, actual account lookup/upload/publish/schedule, durable ledger, external network, deploy, push도 금지다.
- Claude는 checker·synthetic probe·build를 실행하지 않는다. Codex가 완료한 probe 재실행 금지이며 read-only source/diff/evidence만 검수한다.
- Codex 검증: Slice 7 checker `603/603 PASS`, targeted TypeScript semantic/syntactic 각각 `0`, `git diff --check` PASS, synthetic no-network publish dry-run `PASS`, 보호 mismatch `0`; optional build는 `NOT_RUN`이다.
- 상태: `SLICE_7_CLAUDE_CODE_READ_ONLY_CROSS_REVIEW_REQUIRED`.

## Slice 7 review 후 분기

1. `PASS`, `P0 0`, `P1 0`, escalation `NO`: exact 18-file checkpoint commit을 수행하고 결과를 보고한다.
2. allowlist 안의 일반 P1, escalation `NO`: 최대 2회 범위에서 최소 correction 후 Claude targeted re-review를 요청한다.
3. P0, BLOCKED, escalation `YES`, allowlist 확대, 실제 외부 계정 검증·업로드·게시·예약 필요, 반복 P1: 즉시 중단하고 ChatGPT Control Tower decision packet을 출력한다.

## 현재 상태

- Phase 0~4 기준 작업은 완료됐다.
- 현재 승인된 재테크 콘텐츠의 Part 1·Part 2는 Instagram과 YouTube에 모두 게시됐고 publication read model도 두 편을 `complete`로 판정한다.
- 따라서 현재 두 편에 대해 일반 업로드, 자동 재시도, 재게시, recovery 재실행, publication ledger backfill을 하지 않는다.
- push·deploy·env/secret·계정·DB 변경은 수행하지 않았다.

## 다음 원자 작업

Owner가 새 재테크 주제를 선택할 때만 기존 V1 제작 흐름을 다시 시작한다.

1. 재테크 전용 화면에서 주제를 추천하고 Owner가 `만들기`를 선택한다.
2. 의미 게이트가 `single | part-1 | part-2`를 결정한다. 모든 주제를 2편으로 강제하지 않는다.
3. 대본 품질 확인 → TTS 생성·청취 승인 → 이미지 생성·QA → 필요한 Flow 장면 승인 → 최종 영상 검증 순서로 진행한다.
4. 실제 게시 전에는 콘텐츠 유닛·플랫폼·해시·중복 여부를 다시 확인하고 Owner의 정확한 외부 게시 승인을 받는다.
5. 한 번의 게시 또는 복구 시도 후 증거를 다시 읽는다. 자동 재시도와 불명확한 재게시를 하지 않는다.

## 지금 하지 않을 작업

- 큐·안전 세션·무인 실행·일/월 외부 생성 예산 정책의 추가 구현
- 기존 게시물 재업로드 또는 Part 1 Instagram ledger backfill
- 비재테크 카테고리 일반화, n8n 활성화, 자동 스케줄·자동 게시
- docs-only 장기 계획 추가, 일반화 리팩터링, 새 DB·배포·dependency 작업

## 운영 확인 기준

- 기존 Part 1: Instagram `17875557156526534`, YouTube `3pdH6FTbHlg`
- 기존 Part 2: Instagram `17942576889054573`, YouTube `WD0Ayy-1E5M`
- 위 네 식별자가 현재 콘텐츠 유닛의 완료 증거다. 새 주제 작업은 이 식별자와 분리된 새 콘텐츠 유닛에서 시작해야 한다.
- 보호 파일 3개는 계속 stage/edit/delete/commit하지 않는다.
