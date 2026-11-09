---
name: feedback-bull-topic-search-auto-runs-lane-tools-2026-09-30
description: 황소특보 소재 탐색 때 Owner 지시 없이 일정러너+레인뉴스검색+쏠림점검을 Claude가 자동 실행 (Owner 확정 2026-09-30)
metadata:
  node_type: memory
  type: feedback
  originSessionId: 177f9fb2-bb14-4b83-ac27-f7a121098199
  modified: 2026-09-29T21:15:51.182Z
---

Owner가 "추천작업 2번(레인 뉴스 검색)은 따로 지시해야 하냐, 규칙으로 넣어 자동 적용되게 해라"고 확정(2026-09-30).

**Why:** 매번 터미널 문구를 Owner가 복붙하는 번거로움 제거, 레인 확장 알고리즘을 항상 쓰게 하기 위함.

**How to apply:** "황소특보 N편 소재/주제 찾자"라는 말이 나오면 묻지 말고 (1) `node scripts/run-bull-topic-calendar-once.mjs --days 14` (2) `node scripts/run-owner-command-with-local-env-no-log.mjs bull-topic-lane-news-search --arm` (출력은 `C:/tmp/…txt`로 저장 후 Read; 429 재시도 내장으로 1~2분) (3) 후보마다 `run-bull-topic-lane-mix-check-once.mjs` 실행. 후보 표에 레인·영역·유형·쏠림 경고 표시. 주제명은 "진짜 이유/정체" 금지·문장 모양 순환. 편 배포 후 `BULL_EPISODE_LEDGER`에 한 줄 추가(10편 배포 후 ep10). 원문: CURRENT_STANDARDS §3 소재. 관련: [[project-bull-topic-lane-expansion-analysis-2026-09-30]].
