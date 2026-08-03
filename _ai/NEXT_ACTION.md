# AutoShorts AI — Next Action

Updated: 2026-08-04 KST

## Shorts Editorial OS V2 — governance targeted review

- Slice 0·1·2는 `FINAL_PASS`; Slice 2 checkpoint는 `58736883c200148e90fe4de44d7e25a1c63f70a2`다.
- Governance transition: `IMPLEMENTATION_COMPLETE_AWAITING_TARGETED_CROSS_REVIEW`.
- 다음 routine 작업은 정확한 4개 governance 파일에 대한 Claude Code read-only targeted review다.
- 이 중간 결과는 ChatGPT Control Tower에 전달하지 않는다. 사용자는 Codex가 제공하는 prompt를 Claude Code에 전달하고 검수 결과를 Codex에 돌려준다.
- Claude Code는 파일 수정·임시 파일 생성·external write·commit·push 없이 `PASS | NEEDS_FIX | BLOCKED`, `P0/P1/P2`, `CONTROL_TOWER_ESCALATION_TRIGGERED`를 보고한다.
- 일반 P1이고 4-file allowlist 안의 문구 correction이면 Codex가 최대 2회까지 자율 수정·targeted re-review한다.
- Claude 최종 `PASS`, `P0 0`, `P1 0`이면 exact 4-file governance checkpoint commit이 사전 승인돼 있다.
- 고정 commit message는 `docs(editorial-v2): establish control tower escalation governance`; push는 `NOT_AUTHORIZED`다.
- Governance checkpoint 최종 결과는 `SLICE_COMPLETE_AWAITING_CHATGPT_NEXT_SCOPE`로 ChatGPT Control Tower에 전달한다.
- Slice 3는 `BLOCKED_PENDING_OWNER_EXACT_SCOPE`; 자동 시작하지 않는다.
- Product build/dev, 외부 API·검색·URL fetch·생성·렌더·게시·deploy·push를 실행하지 않는다.
- 상태: `GOVERNANCE_TARGETED_CLAUDE_CODE_READ_ONLY_REVIEW_REQUIRED`.

## Governance review 후 분기

1. `PASS`, `P0 0`, `P1 0`, escalation `NO`: exact 4-file checkpoint를 수행하고 최종 결과를 ChatGPT에 전달한다.
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
