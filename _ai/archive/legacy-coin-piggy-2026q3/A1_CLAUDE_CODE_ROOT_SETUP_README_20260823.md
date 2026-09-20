# A1 Claude Code Main 전환 — 올바른 폴더 구조

## 확정 경로

- 메인 프로젝트 repository / Claude Code 시작 폴더:
  `C:\Users\PC\jjy\instagram-auto`
- 캐릭터 제작용 별도 workspace:
  `C:\Users\PC\jjy\character-lab\A1_ECONOMY_HELPER`

## 실행 원칙

1. Claude Code는 `instagram-auto`에서 시작한다.
2. repository-level `CLAUDE.md`, `AGENTS.md`, `_ai` source of truth를 먼저 읽는다.
3. Character Lab exact path를 추가 접근 허용한다.
4. 현재 `A1_MOUTH_NOSE_IDENTITY_LOCK_V1` Slice에서는:
   - `instagram-auto` = read-only
   - Character Lab allowlist = write 가능
5. Character Lab을 새 프로젝트로 만들거나 repository 안으로 옮기지 않는다.
6. Claude Code와 Codex의 병렬 write는 금지한다.

## 배치 권장 위치

다음 두 Markdown 파일은 메인 repository의 `_ai` 폴더에 넣는 것을 권장한다.

- `SHORTS_EDITORIAL_OS_V2_LATEST_HANDOFF_20260823_CLAUDE_CODE_MAIN_MOUTH_NOSE_PENDING_ROOT_FIXED.md`
- `CLAUDE_CODE_MAIN_TAKEOVER_AND_A1_MOUTH_NOSE_IDENTITY_LOCK_V1_PROMPT_20260823_ROOT_FIXED.md`

새 ChatGPT 채팅에는 최신 handoff와 canonical A-1 reference를 첨부한다.
