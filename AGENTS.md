# AutoShorts AI — AGENTS.md

## 현재 활성 프로젝트

**Money Shorts OS — "경제번역소" 채널의 재테크 쇼츠 3캐릭터(부엉박사·금박사·황소특보) 제작과 Instagram·YouTube 배포.**

- **제작 기준의 Single Source of Truth: [`_ai/CURRENT_STANDARDS.md`](_ai/CURRENT_STANDARDS.md).** 작업 전에 반드시 먼저 읽는다. 이 파일·메모리·다른 문서와 충돌하면 그 문서를 따른다.
- 과거 세대(Shorts Editorial OS V2 / Coin·Detective Piggy / 8개 카테고리 자동생성 / 생활꿀팁·감성 스토리·3D 시트콤·자동문면접·Golden Sample)는 폐기됐다. 현재 작업 근거로 쓰지 않는다(이력은 git log로 조회).

## Main AI

- **Main AI: Claude Code**(Owner 확정 2026-09-17: "Codex는 이제 사용 안 해"). Codex 교차검수는 필요하지 않다.
- Claude Code는 Owner가 승인한 범위 안에서 계획·구현·검증·보고를 직접 수행한다.

## 핵심 규칙

- pnpm만 사용한다(npm, yarn 금지).
- 영상: 1080x1920(9:16). 길이·씬 구조는 캐릭터별로 `_ai/CURRENT_STANDARDS.md`를 따른다.
- 작업 전 `git status -sb`로 기존 변경을 확인하고, 기존 Owner 변경을 덮어쓰지 않는다.
- 구현 상태는 오래된 문서 문구가 아니라 현재 코드, git diff, 로컬 실행 결과로 판단한다.

## 승인 게이트 (Owner 명시 승인 없이는 하지 않음)

- Instagram/YouTube 실제 게시, 외부 계정 변경, 유료 API 새 사용
- token/env/secret 읽기·변경(자격증명은 `scripts/run-owner-command-with-local-env-no-log.mjs` 래퍼로만 주입, `.env.local`을 직접 읽지 않음)
- DB/인증/production 변경, dependency/lockfile 변경
- commit, push, 파일·폴더 삭제

## `_ai` 폴더

- `_ai/CURRENT_STANDARDS.md` — 현행 제작 기준(최우선)
- `_ai/CONTEXT_TRANSFER_CLAUDE.md` — 세션·계정 전환 시 이어받을 진행 상태
- `_ai/{char}-ep{N}-video-generation-prompts.md` — 편별 영상 생성 프롬프트
- `_ai/HANDOFF_NOW.md`, `_ai/PROJECT_STATE.md`, `_ai/NEXT_ACTION.md` — 진행 중 작업이 있을 때만 사용, 끝나면 비운다
- `_ai/archive/` — 더 이상 기준이 아닌 옛 문서(참고용, 작업 근거로 쓰지 않음)
