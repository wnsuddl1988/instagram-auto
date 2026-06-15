# Handoff Now

## Task status

Automation stabilization complete — checkpoint audit only

## Priority

S5 최종 Veo 제출 전 누적 diff를 감사한다.

마지막 Veo 예산 1회는 보존한다. 실제 S5 제출은 Owner가 별도로 ALLOW_VEO=true, S5 최종 1회 승인을 준 뒤에만 가능하다.

## Task goal

Gemini Veo 자동화와 ChatGPT 이미지 자동화 안정화 phase의 누적 변경을 감사하고, checkpoint commit 가능 여부와 포함/제외 파일 후보를 정리한다.

## Approved scope

- git status, git diff, untracked 파일 목록 감사
- 재사용 가능한 자동화 파일과 일회성 probe/archive 후보 분류
- 체크포인트 커밋 후보 파일 목록 작성
- 일회성 파일을 archive로 옮겨야 하는 경우 제안만 작성
- _ai/CLAUDE_REPORT.md, _ai/PROJECT_STATE.md 갱신

## Forbidden files/actions

- commit, push, merge, clean, reset 금지
- 파일 삭제 금지
- archive 이동도 Owner 승인 전 금지
- Gemini/ChatGPT 실제 제출 금지
- S5 최종 Veo 실행 금지
- TTS/silent_v2 실행 금지

## Current accepted automation status

### Gemini Veo

- G2:9224 preflight PASS, 약 50초
- S5 final dry-run PASS
- PREFLIGHT_STALE 4/4 PASS
- TOTAL_SEND=0, VEO_SUBMIT=0
- 권장 실행 프로필: G2

### ChatGPT Image

- GPT-1:9222 preflight PASS, 11초
- s5-kf dry-run PASS, 10초
- TOTAL_MESSAGE_SEND_COUNT=0, IMAGE_SUBMISSION_COUNT=0
- 남은 약한 지점: activateImageTool 후 aria-checked=true 확인자 미달

## Definition of Done

- diff 규모와 untracked 개수 보고
- checkpoint 포함 후보/제외 후보/보류 후보 분류
- 재사용 가능한 core/preflight 파일 목록 확정
- 일회성 probe 또는 진단 파일 처리 방안 제안
- 커밋 메시지 후보 작성
- Owner가 바로 checkpoint 승인 여부를 결정할 수 있게 보고
- _ai/CLAUDE_REPORT.md와 _ai/PROJECT_STATE.md 갱신

## Required final handoff

Claude Code는 작업 완료 후 아래 형식으로 끝낸다.

## Codex에 붙여넣을 인수인계사항

- 감사한 git status/diff 요약
- checkpoint 포함 후보
- checkpoint 제외/보류 후보
- archive 제안이 필요한 파일
- 검증 재사용 근거
- 남은 위험
- Owner에게 제안할 선택지
- Codex가 _ai/CODEX_REVIEW.md, _ai/NEXT_ACTION.md, _ai/PROJECT_STATE.md를 갱신해 달라는 요청

