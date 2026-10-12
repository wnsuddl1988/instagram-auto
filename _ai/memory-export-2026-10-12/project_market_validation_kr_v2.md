---
name: project-market-validation-kr-v2
description: "포맷 시장 검증 — YouTube는 AI음성 금지 아님(양산만 제한), 페르소나는 구현 부적합, A/B 파일럿 권고"
metadata:
  node_type: memory
  type: project
  originSessionId: 28a441ad-2a1a-47ff-8347-ffde2ea11a42
---

2026-06-20 시장검증 v2 + 정정 스프린트(`_ai/MARKET_VALIDATION_v2.md`, `_ai/MARKET_DECISION_SPRINT_KR.md`) 결론. **이전 메모리의 두 오류를 정정함.**

- **[정정] YouTube 정책 오독 철회:** AI 음성/TTS·faceless 자체는 금지 아님. 공식 정책(support.google.com/youtube/answer/1311392)은 "독창적 통찰 없이 템플릿으로 대량 생산된 인상·영상 간 차이 거의 없음·남의 자료 읽기만"을 제한. **독창 대본+영상별 실질 차이+해설 가치가 있으면 faceless/TTS도 수익화 가능.** "슬라이드+TTS=수익 제외" 단정은 틀렸음.
- **[정정] 페르소나 1순위 철회:** 이수지·김햄찌 등 인기 사례는 사람 연기력·인지도·팬덤 의존 → 현재 자동화 구현(다인물·감정TTS·다씬 연속성 불안정)과 충돌. 인기≠자동화 적합.
- **[정정] 89/87 점수표 출처:** 이전 `_ai/CONTENT_FORMAT_FEASIBILITY.md`에 실제로 존재했음. 현재 파일 부재는 세션 전환 중 uncommitted 문서 소실 때문이지 "처음부터 미기록"이 아님.
- **직접 표본 관찰 BLOCKED:** Chrome 확장 미연결 + YouTube/Google Trends JS·HTTP 차단(429/400). 후보별 한국어 Shorts 표본 0/40, 한국 Trends 직접 미확보. → 시장 순위 미확정.
- **결정:** 구현 적합성 기준으로 A(faceless 지식·심리 설명, 독창대본) / B(생활정보·실용 실연)만 안정 요소로 제작 가능. C(페르소나)는 보류. → **저비용 A/B 비교 파일럿 권고**, 실제 게시 성과로 시장성 확정.
- living_tips "안정 검증" 주장은 [[project-real-blocker-content-quality]]·`docs/living-tips-human-qa-rubric.md` 체감 실패와 충돌 → 무효.

**Why:** 정책을 오독하면 멀쩡히 수익화 가능한 포맷을 버리고, 인기만 보면 구현 불가한 포맷에 시간을 쓴다.
**How to apply:** 다음 파일럿은 "현재 안정 요소(단일 내레이션+stock/실물+후편집)만으로 완결 + 영상별 독창 차이"를 갖춘 A/B로 가고, 양산 템플릿화와 다인물·감정연기 의존 포맷은 피한다. 직접 표본이 필요하면 Chrome 연결/Playwright/Owner 수동 중 하나를 먼저 확보.
