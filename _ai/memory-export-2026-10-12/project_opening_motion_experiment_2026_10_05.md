---
name: project-opening-motion-experiment-2026-10-05
description: "첫 3초 시각 변화 실험(Owner \"1번 진행해\", 2026-10-05) — 조립기 --opening-motion pushin|impact, 황소 22편·부엉 다음 신작부터 번갈아 적용, 성공 기준=평균 시청 5초 미만 비율 38%→25%"
metadata:
  node_type: memory
  type: project
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-10-05T03:02:33.752Z
---

성과 분석(`_ai/performance-report-2026-10-05.md`)에서 잘 된 편·안 된 편의 첫 3초가 시각적으로 같은 템플릿(카메라·구도·글자 고정, 캐릭터 눈·입만 미세 움직임)이라 변화를 주기로 함. `scripts/run-owl-assemble-shorts-v2.mjs`에 `--opening-motion none|pushin|impact`(또는 스펙 `openingMotion`) 추가 — 첫 씬 영상 레이어만 확대, 헤더·자막은 고정, manifest에 기록. 황소 20편 임시 렌더(`C:/tmp/opening-motion-test/{impact,pushin}/owl_shorts_final.mp4`, CTA·마감 전 단계)로 검증: 씬 길이가 v1 조립본과 동일·컷 싱크 최대 오차 0·자막 감사 기존과 동일·헤더 고정·팻말 안 잘림. 단 pushin은 막판 뿔이 헤더 "수명 논쟁"에 더 가까워짐(원래도 닿아 있었고 글자는 읽힘). 못 본 것: 전체 재생, CTA 결합·QA 게이트 통과(실제 신작에서 확인 필요).

**Why:** Owner가 조회수 저조 원인을 묻고 "1번(첫 3초 시각 변화 A/B) 진행해, 황소 21편까지는 영상 생성이 거의 완료됐으니 이후부터" 지시.

**How to apply:** 황소 22편·부엉 다음 신작부터 직전 신작과 다른 값으로 번갈아 적용(21편·완성 재고는 none), 체크리스트 C에 적용값 기록. 하드 규칙 아님(실험). 성공 기준: 적용 8편 이상에서 인스타 평균 시청 5초 미만 비율이 38%→25% 이하. 조회수는 소재 편차가 커서 비교 지표로 쓰지 않음. 관련: [[project_performance_dup_check_and_causes_2026_10_05]].
