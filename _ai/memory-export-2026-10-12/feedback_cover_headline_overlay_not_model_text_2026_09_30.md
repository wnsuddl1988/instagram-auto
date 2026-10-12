---
name: feedback-cover-headline-overlay-not-model-text-2026-09-30
description: 커버·스토리 글자는 이미지 모델이 아니라 합성기로 얹는다(모델은 글자 폭·위치 좌표 무시) — 글자 없는 생성 + run-cover-headline-overlay-once.mjs
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-09-30T13:15:44.466Z
---

황소 11편 커버 1차에서 모델이 문구를 폭 6~94%·세로 15~28%(안전영역 30~75%·좌우 10% 밖)에 넣었다. 좌표·폭 문구는 모델이 따르지 않는다(보드 글자, 영상 이미지와 같은 패턴).

**Why:** 결정적으로 통제 가능한 것(글자)을 확률적인 모델에 맡겨 재생성 비용이 생겼다. 글자 없는 배경+캐릭터는 한 번에 통과했고, 합성기로 위치·폭을 계산해 얹으니 1회에 합격.

**Owner 지적(같은 날 저녁): 11편 커버 글자가 다른 커버보다 너무 작아 안 보임, 예전이 낫다.** 원인은 합성기가 가장 긴 줄(10자) 기준 한 크기(97px)로 그린 것. 줄별로 폭을 채우도록 고치고(상한 230px, 140px 미만이면 경고), 문구는 줄당 8자 이하 2줄·둘째 줄 노랑 강조, 세로 17~34%(인스타 그리드 3:4 크롭 위 12.5% 회피). 11편 수정본 `C:/tmp/bull-cover-ep11/00_cover_v2_bigtext.png`(154/142px).

**How to apply:** 커버·스토리 스펙은 "윗 50% 비움, 뿔 끝 ≈50%·눈 ≈62%, 배지 외 글자 금지"로 쓰고 `node scripts/run-cover-headline-overlay-once.mjs --in … --out … --line … --line … --center-y-pct 29(스토리 26) --max-width-pct 90`. 업로드 폴더에는 최종본만(글자 없는 원본 분리). 원문 CURRENT_STANDARDS A-8. 관련: [[project-bull-ep11-deployed-2026-09-30]].
