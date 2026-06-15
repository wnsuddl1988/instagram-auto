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

## Codex ↔ Claude Code 협업 운영 규칙
- Codex는 계획/브레인/품질 기준/QA/프롬프트 작성 담당이다.
- Claude Code는 실행/코드 수정/반복 구현/1차 빌드 검증 담당이다.
- Codex는 사용자가 명시적으로 직접 구현을 요청하지 않는 한, 큰 코드 변경을 혼자 진행하지 않는다.
- Codex가 직접 해도 되는 범위는 간단한 수정, 설정 확인, QA, 빌드/검증, 작은 패치로 제한한다.
- 모든 작업은 atomic task 단위로 쪼갠다. 한 번에 큰 범위를 수정하지 않는다.
- 작업 전 Codex는 선택지 2~3개를 비교하고, 왜 그 작업이 다음 atomic task인지 설명한다.
- Claude Code에 작업을 넘길 때는 반드시 전달용 프롬프트를 작성한다.
- Claude Code 작업 완료 후에는 반드시 Codex에게 전달할 최종 인수인계 문구를 요청한다.
- Codex는 Claude Code 인수인계를 검토하고, 누락/오류/품질 이슈를 지적한 뒤 다음 작업을 정한다.
- 협업 원칙을 벗어나려면 사용자의 명시적 허락이 필요하다.

<!-- IANPAPA_FILE_HANDOFF_START -->
## Ianpapa File-Based Handoff

* This project uses the `_ai` folder as the file-based handoff source of truth.
* Codex creates or updates `_ai/HANDOFF_NOW.md`.
* Claude Code executes only the approved scope in `_ai/HANDOFF_NOW.md`.
* Claude Code updates `_ai/CLAUDE_REPORT.md` after work.
* Codex reviews `_ai/CLAUDE_REPORT.md` and git diff, then updates `_ai/CODEX_REVIEW.md`, `_ai/NEXT_ACTION.md`, and `_ai/PROJECT_STATE.md`.
* At a safe phase boundary, review accumulated diff and ask the Owner before checkpoint commit or branch cleanup.
* Project files are preferred over chat summaries.
<!-- IANPAPA_FILE_HANDOFF_END -->
