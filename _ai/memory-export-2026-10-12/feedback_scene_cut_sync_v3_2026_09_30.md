---
name: feedback-scene-cut-sync-v3-2026-09-30
description: "씬 전환 때 다음 씬 대사·자막이 이전 화면에서 먼저 나오던 누적 밀림 수정 — 조립기 절대 프레임 컷 + 0.1초 리드, QA 차단"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-09-30T06:37:16.429Z
---

Owner 지적(2026-09-30): "씬이 넘어갈 때마다 다음 씬 자막 첫 부분이 이전 씬 끝에서 먼저 나오고 넘어가 뚝뚝 끊긴다. 부자연스럽다."

- **원인(실측)**: `run-owl-assemble-shorts-v2.mjs`가 씬마다 `-t 초`로 따로 인코딩 → 프레임(1/24초) 올림 오차가 씬당 ~0.02초씩 누적 → 뒤쪽 씬일수록 화면 컷이 발화보다 늦음(부엉 17편 +0.31초, 황소 9편 +0.39초). 옛 편부터 있던 문제, 자막이 화면 가운데로 커지면서 눈에 띔. 오디오 마감은 무관(마감 전후 동일).
- **수정(씬 전환 싱크 v3)**: 절대 시각 → 프레임 격자 컷, 씬 길이는 `-frames:v`, 인코딩 후 실제 프레임 수로 재검증(1프레임 초과 ABORT). 컷은 다음 발화 0.1초 전(`SCENE_CUT_LEAD_SEC`), 이전 발화 끝+0.08초 이후. manifest `cutSync` 기록.
- **QA 차단**(`run-episode-qa-once.mjs`): cutSync 없음·누적 오차>0.05·컷이 발화보다 늦음·자막이 컷 가로지름·다음 씬 자막이 컷 전에 뜸 → 반드시 수정.
- 수정 후 17편: 14곳 모두 발화보다 0.10~0.14초 먼저, 누적 오차 0, 자막 교차 0. 부엉 16·17·18편 배포 대기본은 이 조립기로 다시 만든 `final-v3`를 쓴다. 15편(배포됨)은 그대로.
- 측정 도구(재사용 가능): 장면 감지(`select='gt(scene,0.25)',showinfo`) 컷 시각 vs TTS summary `startSec` 비교.

**Why:** 화면·자막·목소리 셋의 전환 시점이 어긋나면 "이어붙인" 티가 난다. **How to apply:** 조립기 수정 시 cutSync·프레임 수 검증을 절대 제거하지 말 것. 원문 CURRENT_STANDARDS 최우선 규칙 21. 관련 [[feedback-assembly-script-change-side-effects]].
