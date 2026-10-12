---
name: project-performance-analysis-first-2026-09-30
description: "첫 성과 분석(인스타 인사이트): 첫 2~3초 이탈이 최대 누수, 통념 뒤집기 훅 22~28초 vs '~라는 거 알아?' 2~3초, 카드뉴스 노출 거의 0, 토큰 권한 확장 완료"
metadata:
  node_type: memory
  type: project
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-09-30T03:37:19.067Z
---

2026-09-30 인스타 인사이트·유튜브 통계 첫 수집(원문 `_ai/performance-report-2026-09-30.md`). 평균 시청 시간 기준: 황소 4·5·7편 22~28초(최고), 부엉 v2 11·12편 13초대, 금박사 5편(예금자보호) 21초 — 나머지 다수 2~8초. 릴스 절반이 평균 5초 미만 = 첫 3초 이탈. 황소 8~10편 7~9초로 하락. 카드뉴스 피드 조회 7~28(도달 3~8). 저장·공유·댓글 거의 0. 유튜브(Analytics API 활성화 완료, 24편): 평균 시청 77초·시청 비율 85%(반복 재생 포함), 구독 +14 — 인스타와 지표가 달라 직접 비교 금지. "첫 3초 이탈"은 인스타 기준. 9/29 두 편 조회 0은 분석 지연 가능성(24~48h 뒤 재확인).

**Why:** Owner가 "무엇이 효과가 있었는지 모른다"는 지적에 성과 수집 체계를 만들고 권한을 확장함(인스타 시스템 사용자 무기한 토큰에 insights·comments 추가, 유튜브 youtube·yt-analytics 권한 재발급 — Analytics API 프로젝트 사용 설정은 Owner 클릭 대기).

**How to apply:** 대본·훅 결정 전에 `instagram-insights-collect --arm` / `youtube-analytics-collect --arm`로 최신 수치를 본다. 훅은 "~라는 거 알아?" 금지, 통념 뒤집기+구체 대상·숫자. 카드뉴스 중단·댓글 유도 문구는 Owner 결정 대기. 인스타 토큰 권한 추가는 비즈니스 설정 → 시스템 사용자 → 새 토큰(만료 안 함)으로만. 관련: [[feedback-video-quality-system-v2-2026-09-30]].
