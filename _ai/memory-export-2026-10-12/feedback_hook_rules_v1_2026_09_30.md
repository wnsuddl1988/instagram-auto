---
name: feedback-hook-rules-v1-2026-09-30
description: "훅 규칙 H1~H4 + 템플릿 T1~T5 (Owner 확정 2026-09-30, 세 캐릭터 공통) — 첫 문장에 긴장, 자기소개·정의·사실확인형·숫자3개 금지, 자동 검사 _hook-rules.mjs"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-09-30T04:12:33.339Z
---

Owner 확정(2026-09-30). 인스타 릴스 32편 평균 시청: 규칙 통과 편 평균 약 18초(황소 4·5·7편 22~28초, 부엉 11·12편 13초대) vs 위반 편 약 7초(자기소개 시작·추상 용어 확인형·숫자 3개 → 2~4초).

**Why:** 첫 성과 분석에서 인스타 최대 누수가 첫 2~3초로 확인됨([[project-performance-analysis-first-2026-09-30]]).

**How to apply:** 대본을 쓸 때 첫 문장이 H1(통념 뒤집기/내 돈 안전·손실/대상 이득/사건+이유) 중 하나, H2 금지(자기소개·용어 정의 시작·긴장 없는 "~라는 거 알아?"·숫자 3개 이상), H3 구체 대상 주어, H4 긴장 단어 앞 절반. 스펙에 `hookType` T1~T5 기록. `run-episode-qa-once.mjs`가 첫 씬을 자동 검사("반드시 수정"). 금박사 재고 9·10편만 `hookRuleException: true` 예외. 원문 CURRENT_STANDARDS 최우선 규칙 17.
