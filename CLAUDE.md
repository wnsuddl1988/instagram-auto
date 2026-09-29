# AutoShorts AI — Claude Code 지침

## 🔴 최우선 — 작업 시작 전 반드시 먼저 읽을 것

**[`_ai/CURRENT_STANDARDS.md`](_ai/CURRENT_STANDARDS.md)가 이 프로젝트의 유일한 현행 기준이다.** 맨 위 "★ 최우선 규칙" 10개를 먼저 읽고, 해당 작업 단계(§A-1~A-8)와 캐릭터 섹션(§1 부엉박사 / §2 금박사 / §3 황소특보)을 읽은 뒤 시작한다. 메모리·대화 기억·옛 문서와 충돌하면 그 문서를 따르고, 충돌 사실을 Owner에게 보고한다.

세션·계정이 바뀌었으면 [`_ai/CONTEXT_TRANSFER_CLAUDE.md`](_ai/CONTEXT_TRANSFER_CLAUDE.md)에서 진행 중 작업을 이어받는다.

자주 틀렸던 것(반드시 지킬 것):
- 황소특보는 5편부터 **대본 구조 v3만** 쓴다(옛 구조로 되돌아가지 않음). 부엉박사는 새 11편부터 **대본 구조 v2**(미배포 재고 7편도 v2로 다시 만들어 재배치, CURRENT_STANDARDS §1·§7), 금박사는 11편부터 오프닝을 훅 뒤로 옮긴다.
- 이미지: 작은 글씨 금지 / 소품은 감싸 쥐거나 바닥 거치 / 빈 면 금지 / 캐릭터는 화면 세로 45~50%. `VEO_SAFE_IMAGE_RULE` 등 이미지 규칙 상수를 제거하지 않는다.
- 영상 프롬프트는 `_ai/bull-ep4-video-generation-prompts.md` 형식 그대로 쓰고, 8초끼리·10초끼리 묶어서 준다.
- 조립 후 CTA 결합까지 한 번에: `run-owl-episode-with-fixed-cta-once.mjs --alignment …` 실행 후 `cta-join-report.json` PASS를 확인한다. xfade·수동 ffmpeg 결합을 쓰지 않는다.
- 카드뉴스는 부엉박사만 만든다. 배포는 CURRENT_STANDARDS §5 순서 그대로(커버 merge, `--privacy public`).
- 금박사 5편 이후 재고는 기본적으로 `geumbaksa-ep{N}-final-v2voice` 경로(새 목소리)를 쓰되, 조립 기록(`assembly-manifest.json`)의 화면 길이가 오디오 길이보다 1초 넘게 짧으면 화면·대사가 어긋난 것이니 재조립본(예: `-v3std`, `-v4std`)을 쓴다 — CURRENT_STANDARDS §7의 최신 경로가 항상 우선(2026-09-27 확인: ep5·ep6·ep8은 재조립본이 최종).
- 모델은 기본 **Sonnet**(주제 선정·대본은 high, 검수·조립·배포는 medium~high)이다. Opus는 대본 구조를 새로 설계하거나, 같은 결과물이 2번 넘게 반려되거나, 원인을 못 찾는 문제가 반복될 때만 예외로 쓴다(CURRENT_STANDARDS 상단 "모델 권장 기준" 참고, 2026-09-27 Owner 확정).

## Main AI

이 프로젝트의 Main AI는 **Claude Code**다(Owner 확정 2026-09-17, Codex 미사용·교차검수 불필요).

## 실행 원칙

- `pnpm`만 사용한다.
- 작업 전 `git status -sb`로 기존 변경을 확인하고, 기존 Owner 변경을 덮어쓰지 않는다.
- 외부 게시, 유료 API, env/secret, DB, 배포, commit, push, 삭제는 Owner의 명시적 승인 없이 실행하지 않는다.
- 자격증명은 `scripts/run-owner-command-with-local-env-no-log.mjs` 래퍼로만 주입한다. `.env.local`을 읽지 않는다.
- 브라우저 자동화는 CDP+Playwright로만 한다(computer-use로 화면을 조작하지 않음).
- 사용자에게 보이는 진행·보고는 한국어로 한다.

## 기술 기준

- Next.js App Router, TypeScript, Node 스크립트(`scripts/`), FFmpeg
- 영상: 1080x1920, 9:16 (길이는 캐릭터별 CURRENT_STANDARDS 기준)
- 플랫폼: Instagram Graph API, YouTube Data API v3
