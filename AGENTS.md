# AutoShorts AI — AGENTS.md

## Project Goal
인스타그램 릴스 & 유튜브 쇼츠를 카테고리 선택만으로 자동 생성 & 배포하는 AI 자동화 프로그램

## 지원 카테고리 (8개)
AI생성활용 / 밈&짤 / 충격뉴스 / TMI지식 / 게임클립 / 재테크팁 / 귀여운동물 / 셀럽엔터

## 폴더 구조
- app/ : Next.js App Router 페이지 & API Routes
- components/ : UI 컴포넌트
- lib/ : 외부 서비스 클라이언트 (OpenAI, Supabase, Instagram, YouTube)
- python/ : 영상 합성 Python 스크립트
- n8n/ : n8n 워크플로우 JSON
- output/ : 생성된 영상 임시 저장 (.gitignore 필수)

## 핵심 규칙
- pnpm만 사용 (npm, yarn 금지)
- 영상 포맷: 1080x1920 (9:16), 15~60초
- pnpm build 무결성 검증 필수

## Main AI Assignment / 협업 운영 규칙
- 이 프로젝트(instagram-auto / AutoShorts AI)는 **Codex Main**으로 진행한다.
- 이 지정은 모든 프로젝트를 Codex Main으로 고정한다는 뜻이 아니며, 이 프로젝트에만 적용되는 로컬 규칙이다.
- 기존 `Codex=계획/Brain`, `Claude Code=실행/Action` 고정 운영 문구는 legacy로 본다.
- Claude Code는 기본 구현자가 아니다. Codex가 막혔거나, 별도 구현/디버깅/크로스리뷰/제한된 handoff 실행이 필요하다고 판단한 경우에만 보조로 사용한다.
- 모든 작업은 atomic task 단위로 쪼갠다. 한 번에 큰 범위를 수정하지 않는다.
- 작업 전 Codex는 선택지 2~3개를 비교하고, 왜 그 작업이 다음 atomic task인지 설명한다.
- Claude Code에 작업을 넘길 때는 반드시 전달용 프롬프트를 작성하고, 범위/금지사항/검증 방법을 명확히 제한한다.
- Claude Code 작업 완료 후에는 Codex가 인수인계와 git diff를 검토하고, 누락/오류/품질 이슈를 확인한 뒤 다음 작업을 정한다.
- Owner 승인 없이 배포, 외부 계정 변경, Instagram/Meta 실제 게시, token/env 변경, production 변경, DB/인증 변경, 외부 액션을 수행하지 않는다.
- 협업 원칙이나 승인 게이트를 벗어나려면 Owner의 명시적 허락이 필요하다.

<!-- IANPAPA_FILE_HANDOFF_START -->
## Ianpapa File-Based Handoff

* This project uses the `_ai` folder as the file-based handoff source of truth.
* Codex creates or updates `_ai/HANDOFF_NOW.md` only when a limited Claude Code handoff is actually needed.
* Claude Code executes only the approved scope in `_ai/HANDOFF_NOW.md` when Codex delegates implementation, debugging, cross review, or handoff execution.
* Claude Code updates `_ai/CLAUDE_REPORT.md` after work.
* Codex reviews `_ai/CLAUDE_REPORT.md` and git diff, then updates `_ai/CODEX_REVIEW.md`, `_ai/NEXT_ACTION.md`, and `_ai/PROJECT_STATE.md`.
* At a safe phase boundary, review accumulated diff and ask the Owner before checkpoint commit or branch cleanup.
* Project files are preferred over chat summaries.
<!-- IANPAPA_FILE_HANDOFF_END -->
