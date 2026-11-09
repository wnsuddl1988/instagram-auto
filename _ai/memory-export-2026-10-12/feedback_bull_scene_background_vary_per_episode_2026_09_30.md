---
name: feedback-bull-scene-background-vary-per-episode-2026-09-30
description: "씬 배경은 편마다 소재에 맞게 새로 구성, 한 편 안에서도 2~3개 구역으로 다양화 — 트레이딩 라운지 반복 금지 (Owner 2026-09-30)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 177f9fb2-bb14-4b83-ac27-f7a121098199
  modified: 2026-09-29T22:25:55.165Z
---

Owner 지시(2026-09-30, 황소특보 10편 이미지 직전): "큰 디테일은 아니지만 주제에 맞게 배경도 다양하게 구성해라. 메모리에 항상 기억해라. 맨날 똑같은 배경인 것 같다."

**Why:** 7·8·9편이 모두 `BULL_EP4_BG`(증권사 트레이딩 라운지)를 재사용해 화면이 단조로웠다(1편 공장 정문, 5편 뉴스 스튜디오, 6편 본사 광장은 소재에 맞췄었음).

**How to apply:** 대본 확정 후 이미지 생성 전에 소재에 맞는 공간을 정하고, 한 편 안에서도 씬 역할별 2~3구역(도입·마무리 / 개념 / 절차·확인)으로 나눈다. probe 모드에 `BULL_EP{N}_BG_A/B/C`, 영상 프롬프트 STATIC/STYLE 문구도 씬별 배경에 맞게 교체. 규칙 유지: 저폴리곤, 배경 글자·숫자 없음, 큰 빈 면 금지, 좌우 8% 구도 규칙. 10편 예: 거래소 공표 로비(A) / 공시 접수 사무 구역(B) / 밝은 분석실(C). 원문: CURRENT_STANDARDS 최우선 규칙 14. 관련: [[feedback-bull-topic-search-procedure-and-ranking-2026-09-30]].
