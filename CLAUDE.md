# AutoShorts AI — Claude Code 보조 지침

## 지침 우선순위

- 프로젝트 운영·승인·안전 규칙은 루트 `AGENTS.md`를 따른다.
- 이 프로젝트의 Main AI는 Codex이며, Claude Code는 Owner가 승인한 제한된 보조 작업만 수행한다.
- 활성 범위는 재테크 쇼츠 자동 제작과 Instagram·YouTube 게시 복구 경로다.
- 삭제된 생활꿀팁, 감성 스토리, 3D 시트콤, 자동문면접, 과거 Golden Sample 산출물을 현재 진행 근거로 사용하지 않는다.

## 실행 원칙

- `pnpm`만 사용한다.
- 작업 전 `git status -sb`로 기존 변경을 확인하고, 승인된 파일 범위만 수정한다.
- 외부 게시, 브라우저 자동화, 유료 API, env/secret, DB, 배포, commit, push, 삭제는 Owner의 명시적 승인 없이는 실행하지 않는다.
- 보호 파일과 기존 Owner 변경은 건드리지 않는다.
- 구현 상태는 오래된 문서 문구가 아니라 현재 코드, Git diff, 테스트, 로컬 실행 증거로 판정한다.

## 기술 기준

- Next.js App Router, TypeScript, Python, FFmpeg
- 영상: 1080x1920, 9:16, 15~60초
- 플랫폼: Instagram Graph API, YouTube Data API v3

<!-- IANPAPA_FILE_HANDOFF_START -->
## Ianpapa File-Based Handoff

- 제한된 Claude Code handoff가 실제로 승인된 경우에만 `_ai/HANDOFF_NOW.md`를 사용한다.
- Claude Code는 승인된 범위만 실행하고 `_ai/CLAUDE_REPORT.md`에 증거를 남긴다.
- Codex가 보고와 Git diff를 검토한 뒤 다음 작업을 결정한다.
<!-- IANPAPA_FILE_HANDOFF_END -->
