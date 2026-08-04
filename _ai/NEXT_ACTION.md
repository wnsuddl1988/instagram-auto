# AutoShorts AI — Next Action

Updated: 2026-08-04 KST

## Shorts Editorial OS V2 — Slice 4 read-only Cross Review

- Slice 0·1·2·3은 `FINAL_PASS`; Slice 3 checkpoint HEAD는 `3edc034022e179492c38272f30049c5950fe54c3`다.
- Slice 4 implementation: `IMPLEMENTATION_COMPLETE_AWAITING_CROSS_REVIEW`.
- 다음 routine 작업은 승인된 정확한 14개 파일에 대한 `Claude Code Slice 4 read-only Cross Review`다.
- `ChatGPT 중간 전달 불필요`; Owner는 Codex가 제공하는 prompt를 Claude Code에 전달하고, `Claude 결과는 Codex에 전달`한다.
- Claude Code는 파일 수정·임시 파일 생성·external write·commit·push 없이 `PASS | NEEDS_FIX | BLOCKED`, `P0/P1/P2`, `CONTROL_TOWER_ESCALATION_TRIGGERED`를 보고한다.
- 승인 범위 안의 일반 P1이고 escalation `NO`이면 Codex가 국소 수정과 targeted re-review를 자율 진행한다. `P0/BLOCKED/scope expansion`은 ChatGPT Control Tower escalation 대상이다.
- Claude 최종 `PASS`, `P0 0`, `P1 0`, escalation `NO`이면 exact 14-file checkpoint commit이 사전 승인돼 있다.
- 고정 commit message는 `feat(editorial-v2): checkpoint slice 4 scene planning`; push는 `NOT_AUTHORIZED`다.
- `Slice 5 자동 시작 금지`; 실제 asset generation·render·publish·durable persistence도 금지다.
- Slice 4 최종 checker `464/464 PASS`, targeted TypeScript `0`, 허용된 `pnpm build` 1회 PASS가 완료됐다. Build 이후 국소 safety correction은 최종 checker·TypeScript로 검증했고 build 1회 제한에 따라 재실행하지 않는다.
- Product dev, browser, 외부 API·검색·URL fetch·DNS·DB/storage·생성·렌더·게시·deploy·push·env/secret 접근을 실행하지 않는다.
- 상태: `SLICE_4_CLAUDE_CODE_READ_ONLY_CROSS_REVIEW_REQUIRED`.

## Slice 4 review 후 분기

1. `PASS`, `P0 0`, `P1 0`, escalation `NO`: exact 14-file checkpoint commit을 수행하고 결과를 보고한다.
2. allowlist 안의 일반 P1, escalation `NO`: 최소 correction 후 Claude targeted re-review를 요청한다.
3. P0, BLOCKED, escalation `YES`, 우선순위 충돌, 범위 확대 필요, 반복 P1: 즉시 중단하고 ChatGPT Control Tower decision packet을 출력한다.

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
