# Next Action

## Recommended next task

Checkpoint commit

## Current status

- upload_002 audio recovery scripts 4개가 scripts/archive/로 이동됨
- _ai/QUALITY_GATE.md 생성됨
- _ai 문서는 Quality Gate 전환 상태
- 외부 호출 0회

## Decision

Contract 작성 전에 checkpoint commit을 먼저 권장한다.

이유:
- 새 마지막 테스트 시작 전 working tree를 깨끗하게 고정해야 함
- archive 이동과 Quality Gate 추가는 독립 checkpoint로 적합함
- Contract 작성 이후 diff와 섞이면 실패 수습/새 테스트 경계가 흐려짐

## Required Owner approval

checkpoint commit 승인

## Commit message candidate

chore(upload_002): archive 정리 + Quality Gate 준비

## Forbidden

- Owner 승인 전 commit 금지
- push 금지
- merge/reset/clean 금지
- 외부 호출 금지
- 생성 작업 금지

## After checkpoint

마지막 테스트 Event / Dialogue / Emotion / Sound / Stop-Loss Contract 작성.

