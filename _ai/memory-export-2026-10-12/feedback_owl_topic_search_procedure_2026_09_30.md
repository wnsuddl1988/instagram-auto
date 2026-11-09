---
name: feedback-owl-topic-search-procedure-2026-09-30
description: "부엉박사 소재 찾기 확정 절차: 황소특보와 같은 뼈대(매번 새로 탐색·후보 7~12개 추천순위)+부엉 전용 기준(행동·자산영향>팩트안정성>신선도, 제도 운영여부 확인, 부엉 레인 8개)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 177f9fb2-bb14-4b83-ac27-f7a121098199
  modified: 2026-09-30T14:02:08.339Z
---

Owner 확정(2026-09-30): 부엉박사 소재 선정도 [[feedback-bull-topic-search-procedure-and-ranking-2026-09-30]]와 같은 뼈대로 간다 — 매번 새로 탐색, 후보 7~12개, 번호=추천순위, 레인·영역·경고·팩트 상태 표시.

**부엉 전용 차이:** 순위 기준 = 시청자 행동·자산 영향도 > 팩트 안정성(공식 자료로 확정) > 신선도(시행일 임박·신청 마감 D-N). 후보 단계에서 정부 제도명 현재 운영 여부를 공식 사이트로 확인, 전망치는 같은 가정끼리만 비교. 레인 초안 8개(제도 변경·시행 D-N / 내 돈 계산법 / 주거 / 소득·일자리 지원 / 생활물가·공공요금 / 지표 번역 ECOS·KOSIS / 금융사기 예방 / 신청 마감 임박 혜택). 최근 5편 같은 영역 ≤2, 같은 레인·제목모양 연속 금지, "진짜 이유/정체" 금지. 18편부터 금박사 연결 없이 독립 선정.

**도구(2026-09-30 제작 완료, 자동 실행):** "부엉박사 N편 주제 찾자"면 지시 없이 `owl-topic-lane-news-search --arm`(래퍼) → 후보마다 `run-owl-topic-lane-mix-check-once.mjs`(장부 `lib/source-facts/owl-topic-lanes.ts` OWL_EPISODE_LEDGER, 게시 예정 재고 포함) → 필요 시 웹·ECOS/KOSIS 보강. 새 편 만들면 장부 추가, 게시 후 published:true. 검사 `check-source-facts-owl-topic-lanes.mjs`.

**★(2026-09-30 밤 최신 — Owner "활용 못 한 러너 다시 활용하고 앞으로도 무조건 사용해, 처음부터 다양한 방면을 요청했다")** "부엉박사 N편 주제 찾자"면 **`node scripts/run-owl-topic-full-scan-once.mjs`부터**(황소 full-scan과 같은 방식): 레인 8 + 영역 10(세금·보험·육아교육·노후·청년·교통통신·예금카드·자영업·내집마련·소비자피해) 뉴스 75개 → 인스타·유튜브 성과(읽기) → 장부 쏠림 → ECOS·KOSIS(⛔ 래퍼 키 미등록, 승인 대기) → 웹 보강(Claude). 체크리스트 `SCAN_CHECKLIST.md`를 보고에 첨부. 이전엔 레인 32개 키워드만 돌려 보험·세금·육아·청년·교통 방면이 아예 검색되지 않았다. 순위는 대상 폭·체감 크기 최우선.

**Why:** 부엉박사는 정책·제도형이라 하루 만에 식지 않고 팩트 오류(2071→2064, 청년내일채움공제) 사고가 있었음. **How to apply:** "부엉박사 N편 주제 찾자" 때 이 절차 자동 적용. 원문: CURRENT_STANDARDS 최우선 규칙 13.
