# Hooks Safety Plan

## Current availability

Claude Code 전역 hooks 설정은 존재하나 Windows 호환성 확인 필요. 이 bootstrap은 hook을 활성화하지 않음.

## Recommended hooks

env/secret edit, git push, deploy, package/lockfile, DB migration/schema detection; targeted check and git diff --check suggestions

## Risk

오탐으로 정상 작업을 막을 수 있으므로 초기에는 dry-run report only

## Dry-run method

차단하지 않고 대상만 로컬 보고. 비밀값 내용은 기록 금지.

## Approval required

모든 실제 차단 hook 활성화와 전역 hook 설정 변경


## Observed global hooks

Windows에서 활성 상태였던 macOS 전용 `afplay` 알림 hook 3개를 백업·archive 후 비활성화 완료. Windows 대체 알림은 적용하지 않았으며 필요 시 Owner 승인 후 별도 검토.
