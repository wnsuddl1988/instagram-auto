---
name: feedback-daily-realtime-topic-scan-all-runners-2026-09-30
description: "★소재 탐색은 요청할 때마다 실시간·확장 러너 전부 — \"주제 선정해줘\"면 그 자리에서 황소/부엉 full-scan 새로 실행, 누락 금지, 자동 예약은 두지 않음(Owner 2026-09-30 밤)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-09-30T14:27:51.240Z
---

Owner 지시(2026-09-30 밤): "앞으로 부엉박사, 황소특보 둘 다 주제 찾는 거 확장된 러너로 이제부터 절대 빠지는 거 하나도 없이 매일 실시간 찾아서 보고해라. 내가 주제 선정해 달라고 하면." 매일 07시 예약 자동화를 만들었다가 Owner가 "예약은 빼, 실시간으로 요청하는 거랑 큰 차이 없다"고 해서 삭제함(태스크 `daily-topic-scan-bull-owl` 삭제, SKILL.md만 디스크에 남음).

**Why:** 러너가 있는데 안 돌리거나(황소), 일부 방면만 훑거나(부엉 32키워드), 공식 지표를 안 쓰는(ECOS) 누락이 반복됐다. 요청 시점에 전부 새로 돌리면 미리 만든 보고서와 차이가 없으므로 예약은 불필요.

**How to apply:** "주제 선정해줘/찾아줘" → 그 자리에서 `node scripts/run-bull-topic-full-scan-once.mjs`(8단계, 공식 지표 포함) 또는 `node scripts/run-owl-topic-full-scan-once.mjs`(레인8+영역16·성과·장부·ECOS7+KOSIS2·웹보강)를 **새로** 실행. 예전 결과·다른 날 스캔 재사용 금지. SCAN_CHECKLIST 표를 보고에 첨부, 후보마다 mix-check + 원문 교차 확인. 예약 태스크를 다시 만들지 않는다(Owner가 요청할 때만). 원문 CURRENT_STANDARDS 최우선 규칙 25. 관련: [[feedback-channel-covers-all-economy-finance-fields-2026-09-30]], [[feedback-no-omission-run-all-rules-2026-09-30]], [[feedback-owl-topic-search-procedure-2026-09-30]].
