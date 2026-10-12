---
name: feedback-gates-over-memory-2026-10-01
description: "★실수는 기억이 아니라 코드 게이트로 막는다(Owner 2026-10-01) — 대본(TTS·QA 자동)·보드 글자 끝 기록·커버 140px·배포 전 게이트, 편마다 체크리스트 사본, 보고는 \"검증한 것(증거)/못 본 것\""
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-09-30T15:09:57.891Z
---

Owner(2026-10-01): "실수를 100% 안 할 수는 없겠지만 안 할 수 있도록 규칙으로 정할 건 정하고, 검사기를 만들 거면 만들고, 할 수 있는 모든 조치를 강구한 다음 어떻게 진행할지 보고해." + 대본 검사기를 TTS·QA에 자동 연결 승인.

**Why:** 9/30 하루 동안 같은 뿌리(기억·눈대중에 의존)의 실수가 반복됐다 — 요약 메모리로 대본 작성(위반 6개), "보드 글자 안전폭 안" 오판(실제로 s3 88.9%, s7 90.3% — s7은 교정 목록에서 빠짐), 커버 글자 97px를 "합격", final-v2/v3 경로 혼동, 셸 인라인 문서 편집 사고. 규칙 문장만으로는 반복된다.

**How to apply (CURRENT_STANDARDS 최우선 규칙 27, 프로젝트 CLAUDE.md 맨 위):**
- 코드 게이트(통과 못 하면 멈춤, 우회 금지): ① 래퍼 `owl-tts`가 대본 기준 검사 → ② `run-episode-qa-once.mjs`가 대본 기준 대조 → ③ QA가 보드·카드 씬 1:1 좌우 끝 시트 + `qa/edge-review.json` 씬별 판정(완성본보다 나중) 요구 → ④ `run-deploy-preflight-once.mjs`(게시 명령 3개가 자동 실행: finalMasteredPath·qaReportPath 필수, mastered·워터마크, QA 0, 압축본 35MB·완성본보다 나중·길이 일치, 커버 `.headline.json` 140px, #Shorts, 유튜브 --privacy public, 릴스 커버 merge) → ⑤ 커버 합성기 140px 미만 실패.
- 예외는 사유를 파일에 적어야만: 대본 `scriptStandardsException`(재고: 황소 11, 부엉 파일 ep16·17·18), 배포 `preflightException`.
- 새 편: `_ai/templates/episode-production-checklist.md` 복사, 단계마다 증거. 보고: "검증한 것(증거) / 못 본 것" 분리, 증거 없는 "합격/안전/확인" 금지.
- 새 실수 → 같은 날 게이트 코드·규칙·회귀 테스트(`check-script-standards-selftest.mjs`, 래퍼 static 49)에 추가.
- 한계(Owner에게 보고함): 보드 글자 판정은 OCR이 없어 여전히 사람 눈(시트·기록 강제로 보완), 팩트·훅 H3·흐름·매수 암시 미묘한 표현은 기계로 못 잡음, 게이트 밖 단계(소재 판단·이미지 선택)는 규칙·체크리스트 의존.
관련: [[feedback-read-standards-source-then-run-checker-2026-09-30]], [[feedback-no-omission-run-all-rules-2026-09-30]], [[feedback-board-text-right-edge-verify-in-video-2026-09-30]].
