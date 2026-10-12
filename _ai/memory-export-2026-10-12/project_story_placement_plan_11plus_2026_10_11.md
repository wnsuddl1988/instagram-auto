---
name: project-story-placement-plan-11plus-2026-10-11
description: "스토리형 11편~ 전체 배치 계획(쓸 수 있음 142개 전부 순서화) — 11 포스코 1973·12 태국 바트·13 쿠쿠·14 갤럭시 노트·15 한진해운, 원문 _ai/story-placement-plan-2026-10-11.json"
metadata:
  node_type: memory
  type: project
  originSessionId: 1d556ea0-6135-4784-9793-c20382605cb4
  modified: 2026-10-11T01:26:25.344Z
---

Owner 2026-10-11 "어차피 쓸 수 있는 소재는 다 쓸 거니 그걸 감안해 배치를 추천해라, 확신 있게" → 풀의 쓸 수 있음 142개를 11편부터 152편까지 순서화. 원문 `_ai/story-placement-plan-2026-10-11.json`, 엑셀 Downloads `스토리형_11편이후_배치계획.xlsx`, 생성 스크립트 `C:/tmp/story-schedule.mjs`.

**11~15 확정안(추천):** 11 포스코 1973 → 12 태국 바트 붕괴 1997 → 13 쿠쿠 1998 → 14 갤럭시 노트 2011 → 15 한진해운 파산 2016~17.

**10/11 갱신(Owner "누구나 알 만한 걸로, 12·14편 2개 추천"):** 12 태국 바트·14 갤럭시 노트(노키아 대안 포함)는 Owner가 '와닿지 않음·모름'으로 반려 → **12 코카콜라(약이었던 음료, 대본 `C:/tmp/story-ep12-cocacola/scenes-v2.json` 17장면 527자)·14 닌텐도(화투 회사, `C:/tmp/story-ep14-nintendo/scenes-v2.json` 18장면 512자)**로 교체, 게이트 수정 0·인용 대조 통과. 11(`story-ep11-posco/scenes-v6`)·13(`story-ep13-cuckoo/scenes-v6`)·15(`story-ep15-hanjin/scenes-v7`) 유지. 바트·갤럭시 노트는 소재 선정 기준에 '누구나 아는 이름(인지도)' 필요 — 배치표 재정렬은 Owner 확정 뒤. 추가 사실 `C:/tmp/story-topic-resolve/extra-{coca-cola-medicine,nintendo-hanafuda}.json`.

**10/11 밤 재작성(Owner "대본 규칙대로 쓴 거 맞아?" 지적):** v2는 날짜 5~6개·단독 출처 숫자·같은 훅 틀·군더더기로 규칙 위반이라 폐기. 2차 보강 조사(`extra2-coca-cola-medicine.json`·`extra2-nintendo-hanafuda.json`, 요코이 수기 bunshun.jp/articles/-/6659 `?page=2`) 후 **12편 `story-ep12-cocacola/scenes-v4.json`(14장면 473자, 병입권 1달러·공장 2→1,000곳)·14편 `story-ep14-nintendo/scenes-v4.json`(18장면 543자, 요코이 심심풀이 장난감)**. 둘 다 검사기 수정 0. 14편 "혼나는 줄 알았다"는 요코이 회고 1출처(1차 증언). verify-results는 bunshun 다중 페이지를 못 읽어 'missing' 오탐 — 직접 fetch로 확인.

**10/11 밤 재점검 v5(새 규칙 점검표 적용):** 12편 `story-ep12-cocacola/scenes-v5.json`(15장면 457자)·14편 `story-ep14-nintendo/scenes-v5.json`(16장면 485자), 검사기 수정 0. 14편은 Gizmodo(다각화→포화→폭락)와 PBS(포화→다각화) 순서 상충이라 순서를 단정하지 않음. Owner 결정 대기: 14편 s10~11(임원실·"혼나는 줄 알았다") = 요코이 수기 1출처.

**10/11 밤 최종(Owner "하나도 안 궁금, 대본의 문제" → "1~2번 둘다 해서 보고"):** 12편 소재를 코카콜라 → **디즈니 플로리다 비밀 땅 매입**(퍼즐 "왜 가짜 회사로 샀나"=투기 방지, 답이 사료에 있음)으로 교체, 대본 `C:/tmp/story-ep12-disney-florida/scenes-v2.json`(14장면 497자, 검사기 수정 0, 추가 사실 `extra-disney-florida-land-1965.json`: 바바르 기자 추리·1963.11 비행). 14편은 장면 먼저 구조 `story-ep14-nintendo/scenes-v8.json`(15장면 474자, 수정 0). 코카콜라는 퍼즐 답이 없어 보류. 1출처 남은 것: 발표 직후 근처 땅 13만 1천 달러(디즈니 공식 1곳, 두 번째 출처 못 구함), 요코이 회고 장면.

**10/11 밤 확정(Owner "디즈니로 가고 12편 보강해, 코카콜라는 폐기가 아니라 다음에 쓸 수 있는 소재로 남겨둬"):** 12편=디즈니 확정(풀 verdict used, story-ep12), 대본 `story-ep12-disney-florida/scenes-v4.json`(16장면 550자, 수정 0, 센티널 기사 원문 1차 자료로 보강). 코카콜라=풀에서 usable·placement later·ownerNote 보관(초안 `story-ep12-cocacola/scenes-v4~v6`, 보강 사실 extra·extra2 파일). 풀 검사기 PASS(사용 11·쓸 수 있음 141). 이후 주제 변경 금지(Owner 9원칙).

**10/11 밤 후속("1~2번 진행해"):** 12편 `story-ep12-disney-florida/scenes-v5.json`(16장면, 마지막 한 방 "발표 직후 근처 땅 에이커당 13만 1천 달러 = 650배↑" 포함·디즈니 공식 글 1출처 귀속) / 14편 `story-ep14-nintendo/scenes-v10.json`(18장면 544자, 2~6번을 질문 고리로 보강, 임원실·"혼날 줄 알았다" 회고 1출처 귀속 유지). 둘 다 검사기 수정 0. Owner 확정 대기.

**10/11 밤 확정:** Owner "12·14편은 이대로 확정" → 12편 `story-ep12-disney-florida/scenes-v5.json`(16장면 557자), 14편 `story-ep14-nintendo/scenes-v10.json`(18장면 544자). 11·13·15편은 Owner가 확인했고 "대본 수정하지 말고 확인만" 지시 → 읽기 전용 점검 결과(수정 안 함): 11편 훅이 결말(242억 흑자) 선공개·11~14번 숫자 연표 / 13편 20억 원(한경+회사 자료, 독립 2출처 아님)·3.5% 단일·날짜 4개·"여기서 멈춰야 했을까" 2편과 틀 겹침 / 15편 4~9번 사실 6연속·"그런데" 0회·15번 롱비치 덧붙임. 다음은 Owner 판단 후 TTS 5편.

**10/11 밤 11·13·15편 반영본:** 11편 `story-ep11-posco/scenes-v7.json`(15장면 493자: 훅에서 결말 제거, 242억 원은 뉴스룸 1곳뿐이라 삭제·"국가기록원은 매출 1억 달러로 적었지"로 귀속, 숫자 연표 4→2장면 병합) / 13편 `story-ep13-cuckoo/scenes-v7.json`(16장면: 광고비→마케팅 20억, 3.5%·971만 대 삭제, 날짜 3개, "이 베팅은 맞았을까?"로 틀 교체) / 15편 `story-ep15-hanjin/scenes-v8.json`(16장면 519자: 질문 고리·"그런데" 추가, 롱비치 덧붙임 삭제). 12·14편 확정본과 함께 TTS 대기(Owner 승인·유료 API).

**규칙:** 10편 단위 시즌, 톤 순환(큰 결단·위기·브랜드·해외기업·큰 결단·해외 몰락·브랜드·세계경제·큰 결단·지역), 몰락·위기 연속 최대 2, 같은 회사 5편 간격, 외환위기 시대(1996~98) 3편 간격, 정치 인접(경부고속도로·석유파동·1962 화폐개혁·IMF)은 21편 이후, 포화 later는 31편 이후, 갤럭시 노트7(8편 LG 철수와 메시지 겹침)은 61편 이후, 삼성 프랑크푸르트(5편과 겹침)·IMF는 41편 이후. 조건부 16개는 Owner 판단 후 끼움.

**Why:** 순서가 정해져야 편마다 소재를 다시 고민하지 않는다. **How to apply:** 제작할 때 이 표의 다음 소재로 설계 줄부터 시작, Owner가 바꾸면 표를 다시 매긴다(스크립트의 forced 슬롯만 고치면 됨).
