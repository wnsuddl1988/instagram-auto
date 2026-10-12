---
name: project-owl-shorts-domain-expansion
description: 부엉이 쇼츠 주제 도메인을 living_finance 하나에서 4개(물가·환율 등 실시간 API 9개 포함)로 확장한 배경과 사용법
metadata: 
  node_type: memory
  type: project
  originSessionId: 209772ed-9454-43be-8a7d-a56438263799
  modified: 2026-09-17T07:50:14.580Z
---

**배경(2026-09-17)**: 1~3편이 전부 "대출·금리" 계열로 겹친다는 Owner 지적. 근본
원인은 `economic-source-registry-data.json`의 topicDomains가 `living_finance`
하나만 `enabled: true`였기 때문 — 그 안의 고정 뉴스 키워드(대출금리·리볼빙·
카드론·가계부채·전세대출)가 좁아 매번 비슷한 소재로 수렴했다.

**Why:** "경제번역소"라는 채널 정체성에 맞는 경제 전반(물가·환율·부동산·투자·
고용) 주제를 다루려면 도메인 자체를 열어야 했다. Owner는 "한 번에 다 확장해
두자, 어차피 해야 할 일이고 시간 걸려도 상관없다"고 명확히 지시(2026-09-17).

**How to apply — 다음 편 주제 선정 시**:
- `--topic` 옵션으로 `living_finance`/`macro_rate`/`real_estate`/`investing` 4개
  중 고를 수 있다. `gov_benefit`/`industry_outlook`/`insurance`는 아직 커넥터
  미구현으로 비활성.
- ECOS+KOSIS 실시간 공식 지표 9개(기준금리·CPI·환율·국고채3년·KOSPI·경상수지·
  무역수지·고용률·실업률)를 `--indicators`로 지정하면 evidence pack에 실제 값과
  검증된 발표일이 자동으로 들어간다.
- 상세 사용법·명령 예시·주의사항 3가지(URL 중복 유실 버그, 발표일 조사 필요,
  KOSIS 별도 키)는 `_ai/OWL_SHORTS_RUNBOOK_V1.md` 1-1절에 전부 기록됨.
- 새 지표를 더 추가하고 싶으면(M2 통화량은 itemCode 재확인 필요로 보류,
  관세청 무역수지는 ECOS 상품수지로 대체 완료) `lib/source-facts/ecos-cpi-*.ts`
  또는 `kosis-employment-*.ts` 패턴을 그대로 복제하면 된다 — 통계 API 커넥터
  하나 추가하는 데 필요한 전체 파일 세트(source-date/latest-period/
  latest-candidate)가 이미 4쌍 존재하니 그중 가장 비슷한 것을 참고.

**instagram-auto의 Main AI는 Claude(나)**이고 Codex 교차검수 불필요
([[project_instagram_auto_main_ai_is_claude]] 참고) — 이 확장 작업 전체를 별도
승인 절차 없이 직접 구현·검증(기존 회귀 테스트 11+13+8+18+17+14=81개 전부 PASS
확인 후 완료 처리)했다.

[[project_owl_character_consistency_and_fixed_cta]]와는 별개 — 그쪽은 영상 제작
파이프라인(이미지·모션·조립), 이 메모리는 대본 이전 단계(주제·근거 수집)에
대한 기록이다.
