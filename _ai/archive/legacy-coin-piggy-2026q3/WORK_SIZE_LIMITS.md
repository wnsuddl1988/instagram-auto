# Work Size Limits

## Default work unit

목표 1개; 변경 파일 1~5개 권장; 테스트 1~2개 권장; 새 라이브러리/DB/아키텍처 변경 없음; 30~90분 내 검토 가능. 강하게 연결된 변경을 파일 수 제한 때문에 과도하게 분할하지 않음.

## Claude Code must stop when

예상보다 수정 파일 증가, DB/새 라이브러리/대규모 구조 변경 필요, 테스트 실패가 범위 밖으로 확산, env/secret 작업 필요, push/deploy 필요

## Checkpoint trigger

Phase 또는 milestone 완료, targeted tests 통과, 미해결 위험 없음, 다음 작업이 독립적일 때 diff 규모를 확인. 대규모 누적 전에 Owner 승인 checkpoint를 제안.

## Checkpoint forbidden when

미완료 구현, 실패 테스트, 미해결 위험, 사용자 변경과 혼재, secrets 또는 generated artifacts 포함 가능성
