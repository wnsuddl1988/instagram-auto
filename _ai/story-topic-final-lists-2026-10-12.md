# 스토리형 소재 풀 정리본 (2026-10-12)

> 이 문서는 10/11 풀 분류(`story-pool-final-classification-2026-10-11.md`)와 10/12 신규 후보 판정 이후 변화를 한곳에 모은 것이다. **풀 JSON(`lib/source-facts/story-topic-pool.json`)에 2026-10-12 반영 완료**(변경 14건: 못 씀 7·유지 메모 2·신규 편입 5, 풀 424 = 사용 15 · 쓸 수 있음 156 · 못 씀 253, `check-story-topic-pool.mjs` PASS, 백업 `C:/tmp/story-newtopics/pool-backup-2026-10-12.json`). 쓸 수 있음 156에는 Owner 판단 대기인 애플–MS 1997이 들어 있다(155+1). 박찬호는 풀에 없고 `_ai/story-new-candidates-final-classification-2026-10-12.md`에만 못 씀으로 있다. 반영에 쓴 목록은 `_ai/story-topic-pool-patch-2026-10-12.json`. 배치안 초안은 `_ai/story-placement-draft-16to25-2026-10-12.md`.
> 판정은 2가지뿐이다: 쓸 수 있음 / 못 씀. 기준 = 사실 정확 + 법적 문제 없음 + 주제와 대본(결정 장면 2출처·퍼즐의 답·상식 테스트) + 쓰는 숫자만 서로 다른 사이트 2곳 같은 값(개수 하한 없음, Owner 10/12).

## 1. 숫자

| 구분 | 10/11 기준 | 이번 정리 후 | 설명 |
|---|---|---|---|
| 사용 | 15 | 15 | 스토리 1~15편(4편 대우 Owner 폐기 포함) |
| **쓸 수 있음** | 158 + 신규 6 = 164 | **155** | 아래 증감 참고 |
| 　└ 원문으로 확인 끝난 것 | — | 약 130 | 증거 파일 있는 123 + 이번 재확인 유지 2 + 신규 5 |
| 　└ 아직 확인 안 한 것 | — | 25 | 증거 파일 없는 기존 usable 중 미확인 |
| **못 씀** | 246 + 200 = 446 | **454** | 기존 +7, 신규 +1 |
| Owner 판단 대기 | — | 1 | 애플–MS 1997(한국 접점) |

증감: 164 → 하향 제안 7 → 박찬호 1 → 애플 1(판단 대기, 쓸 수 있음에서 제외 집계) → 모나미·메디슨 유지(숫자 하한 폐지 후) → **155**.

## 2. 변경 내역

**쓸 수 있음 → 못 씀 (7)**: 딤채(R1 회생·임금체불 재판 진행 중) · 갤럭시 노트(R3 결정 장면 출처 없음) · 꼬북칩(R3 장면 1출처) · 석유파동 1973(R2/R4) · 마이너스 유가 2020(R4/R5) · 신한은행 개점 1982(R6·Owner 메시지 불성립) · 제주올레(R3/R4 인물 서사 금지)
**신규 → 못 씀 (1)**: 박찬호 1994(동시 선택 구도가 사실과 다름)
**신규 → 쓸 수 있음 (5, 제약 포함)**: 류현진 포스팅 · 프리챌 유료화 · 불닭볶음면 · 모나미 153 · 메디슨. 제약은 patch 파일 `newUsable` 참고.
**재확인 유지 (2)**: 유일한의 유언 · 설향 딸기(훅 문구 정정 필요)
**Owner 판단 (1)**: 애플–MS 1997

## 3. 아직 확인 안 한 25건 (증거 파일 없는 기존 usable)

`mbs-skypark-ssangyong-2007`, `petronas-twin-towers-samsung-1996`, `card-crisis-2003`, `lg-styler-2011`, `currency-reform-1962`, `home-shopping-first-1995`, `oliveyoung-first-store-1999`, `india-gold-1991`, `phone-backlog-1980s`, `container-ideal-x-1956`, `weimar-hyperinflation-1923`, `coway-rental-1998`, `cup-noodles-1971`, `melona-hawaii-1992`, `nickel-coke-1886`, `ireland-bank-strike-1970`, `honey-butter-chip-2014`, `wanju-local-food-2012`, `yakult-ajumma-1971`, `zimbabwe-100-trillion`, `target-canada-2015`, `svb-2023`, `greece-crisis`, `pantech-2014`, `lg-sk-battery-lawsuit`

우선순위: ① 국내 + 편성 앞순서(`petronas`, `home-shopping`, `oliveyoung`, `melona`, `lg-styler`, `coway`, `honey-butter-chip`, `wanju`) ② 정치·진행 위험(`card-crisis`, `currency-reform`, `phone-backlog`, `pantech`, `lg-sk-battery-lawsuit`) ③ 해외 한국 접점 의심(`weimar`, `zimbabwe`, `ireland-bank-strike`, `nickel-coke`, `target-canada`, `svb`, `greece`, `cup-noodles`, `india-gold`, `container-ideal-x`)

## 4. 소재가 유한한가

- **현 시점 쓸 수 있음 155건**. 하루 1편이면 약 5개월, 이틀에 1편이면 약 10개월치(스토리형 게시 간격은 Owner가 정하므로 가정치).
- 실제로 쓸 수 있는 수는 이보다 적다. 편성 규칙(같은 회사 5편 간격, 외환위기 시대 3편 간격, 정치 인접 21편 이후 등)과 Owner가 고르는 취향이 걸러 낸다. 미확인 25건이 더 빠질 수 있다.
- **지금 가능한 소재 확장 경로** (Owner 승인이 필요한 것에 표시)
  1. 숫자 하한 폐지로 풀리는 후보(교보문고·임실치즈·서산 유조선·모나미·메디슨): 이번에 모나미·메디슨은 반영. 나머지 3건은 결정 장면 출처 한 곳씩 더 확인하면 판정 가능.
  2. **결정 장면 1출처 + 귀속 허용(Owner 승인 필요)**: 꼬북칩·쿠쿠류처럼 당사자 인터뷰 1곳으로 장면이 되는 소재가 살아난다. 규칙 파일에는 이미 "1출처 회고는 귀속해 쓰되 Owner가 결정"이 있다.
  3. 신규 발굴을 **"한 사람·한 회사의 결정 장면"** 중심으로 다시 한다(코덱스 C 후보 8건은 NEEDS_CHECK 큐).
  4. 못 씀 중 R4(인물 없는 제도·현상)는 스토리형 대신 설명형 후보로 이관.

## 5. Owner 결정 필요

1. 하향 7건·박찬호 못 씀 확정 → 풀 JSON 반영 승인
2. 신규 5건 풀 편입 승인(제약은 patch 파일 기준)
3. 애플–MS 1997을 쓸지
4. 결정 장면 1출처 귀속 허용 여부(위 4-2)
