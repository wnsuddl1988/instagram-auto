---
name: project-story-topic-pool-v3-classified-2026-10-08
description: "스토리형 소재 풀 v3 — 243개 verdict 분류(사용 7·쓸 수 있음 17·조건부 97·못 씀 122, 후반 배치 13). Owner 정정: '법적 문제'=두산 페놀·티몬류 국내 민감 사건만, 포화는 못 씀이 아니라 초반 회피(후반 배치). 새 소재 제안 전 check-story-topic-pool.mjs --find"
metadata:
  node_type: memory
  type: project
  originSessionId: 44079e93-cb91-40d7-a5f2-8a4f2a547778
  modified: 2026-10-10T11:00:29.402Z
---

Owner(2026-10-08 저녁): "모은 소재를 전부 넣어서 쓸 수 있는 것과 못 쓰는 것을 분류·저장해야 다음 수집 때 중복이 안 된다."

**한 일:** `lib/source-facts/story-topic-pool.json`을 v3로 올려 모든 항목에 `verdict`(used·usable·conditional·unusable)·`verdictReason`·`verdictNote`를 달고 전수조사 후보 137개를 병합(`source: classify-2026-10-08`, 새 후보 storyFit은 `estimated`). 러너는 usable·conditional만 순위에 올리고 판정 없는 항목이 있으면 멈춘다. 검사기 `scripts/check-story-topic-pool.mjs`(id·제목 중복, 판정·사유 필수, `--find 단어`, `--export 경로`). 읽기용 표 `_ai/story-topic-pool-classification-2026-10-08.md`. 백업·스크립트 `C:/tmp/story-topic-backup/`.

**Owner 정정 두 가지(같은 날):**
1. "법적으로 문제된다"는 **두산 페놀·티몬처럼 지금도 민감한 국내 사건**을 뜻한다. 폰지·리먼·대공황·튤립 같은 해외·옛 종결 사건은 쓸 수 있다 → 30개를 conditional로 되살림(`revivedFrom` 표시). 남은 `legal` 18개는 국내 현 영업/피해자/진행 중 사건(티몬·머지포인트·쿠팡·라임·JU·전세사기·웅진·대우조선·론스타·카드3사 유출·팬택·넥슨·하이트vsOB·싸이월드·아이러브스쿨·아모레 에어쿠션·롯데 자일리톨·삼성자동차).
2. **포화(삼양 우지·다이소 등)는 모방 안 한다는 뜻이 아니라 초반에 쓰기 그렇다는 뜻** → `unusable:saturated`를 없애고 conditional + `placement: later`(13개). 검사기가 saturated를 못 씀 사유로 쓰면 막는다.

**국내 성공 사례 보충(Owner 10/8 밤):** 에이전트 4개(식품·유통 / 제조·산업 / 서비스·플랫폼 / 중소·지역)로 96개를 병합 → 풀 339개 = 사용 7·쓸 수 있음 24·조건부 124·못 씀 184. 새로 쓸 수 있음 7개: 홈쇼핑 첫 방송, 설향 딸기, 쿠쿠 독자브랜드, 완주 로컬푸드, 하나로통신 ADSL, 꼬북칩, 올리브영 1호점. 병합 스크립트 `C:/tmp/story-topic-backup/merge-korea-success-2026-10-08.mjs`, 병합 전 백업 있음. 새 usable에는 `sourceHints`(열람한 출처 URL)가 붙어 있다.

**10/9 Owner 지적("메모가 전부 부정적이다") 반영:** `verdictNote`는 장점이 아니라 작업 주의 메모였다. 모든 후보(usable·conditional 148개)에 `pitch`(전달 메시지 제안)·`translate`(경제 번역 지점 제안)를 채우고, 주의가 표기·확인 사항뿐이던 조건부 7개(메로나·마리나베이샌즈·제주 올레·카드 대란·1962 화폐개혁·SVB·그리스)를 usable로 승격(`promotedFrom`). 현재 풀 339 = 사용 7·쓸 수 있음 31·조건부 117·못 씀 184. **기준:** 쓸 수 있음=주의가 표기·확인뿐 / 조건부=장면 약함·핵심 일화 단일 출처·정치 소지 같은 실제 보강 필요. 새 항목을 풀에 넣을 때는 장점(pitch·translate)부터 쓰고 주의는 그 뒤에. 엑셀 `_ai/story-topic-pool-classification-2026-10-09.xlsx`(생성 스크립트 `C:/tmp/story-topic-backup/export-pool-xlsx.py`).

**10/9 2차 정정(Owner "겹침은 배경만 같은 거지 소재는 다르다, 쓸 수 없음의 조건이 뭐냐, 국내 기업 성공사례라고 했는데 허니버터칩뿐"):** 새 판정 `hold`(보류) 추가 — 못 씀(unusable)은 **쓰지 않기로 한 것만**(legal=지금도 민감한 국내 사건·political=국내 정치·fact-error·owner-rejected·off-channel·investment), 근거·장면·앵글 부족(weak-scene·unverifiable·duplicate·complex)은 보류. '겹침'은 같은 소재의 변형일 때만(IMF 구제금융·환율 2,000원·스타벅스 호주·현대 엑셀·삼성 64M D램·미원 vs 미풍·네이버 지식iN 등 8개는 조건부로 되살림). 현재 339 = 사용 7·쓸 수 있음 31·조건부 125·보류 118·못 씀 58. 후보 156개에 `priority`·`priorityNote`(1~40 수동, 이후 storyFit 합 자동). **Owner 취향: 1~7편처럼 한국인 누구나 아는 국내 대기업·대표 기업의 굵직한 한 장면. 과자·소품·지역 축제류는 후순위.** 대기업 보충 조사 에이전트 3개(삼성·LG·SK·한화 / 현대·포스코·유통·항공 / 금융·IT·바이오·중견) 진행 → 결과 병합 후 우선순위 v2 재배정 예정. 체커는 못 씀 사유를 위 6개로만 허용.

**10/9 대기업 보충 조사 병합 + 우선순위 v2:** 에이전트 3개(삼성·LG·SK·한화 / 현대·포스코·유통·항공·건설 / 금융·IT·바이오·중견) 결과 80개 병합 → 풀 419 = 사용 7·쓸 수 있음 37·조건부 146·보류 160·못 씀 69. 새 usable 7개: 갤럭시 노트(2011), 페트로나스 트윈타워(삼성물산), 신한은행 개점(1982), 유한킴벌리 4조2교대, 유일한 유언, LG 스타일러 (+기존 승격). 우선순위 v2 상위: ①LG 스마트폰 철수 ②갤럭시 노트 ③마리나베이샌즈 ④페트로나스 ⑤포스코 침수 복구 ⑥하나로통신 ⑦신한은행 ⑧유한킴벌리 ⑨쿠쿠 ⑩제일제당 설탕. 병합 스크립트 `C:/tmp/story-topic-backup/merge-bigcorp-2026-10-09.mjs`(병합 전 백업 있음). Owner 선택 대기.

**10/9 오후 조건부 추가 조사(Owner "애매한 건 추가 자료를 모아 쓸 수 있는지 못 쓰는지 정확히 분류"):** 조건부 146개 중 우선순위 상위 40개를 에이전트 12개(5개씩)로 조사(첫 8개 묶음은 사용 한도 429로 중단돼 20개 재조사)하고 `C:/tmp/story-topic-resolve/verify-results.mjs`로 출처 인용을 실제 페이지와 대조(서로 다른 사이트 2곳 일치만 인정, 접속불가는 WebFetch로 직접 확인해 `manualVerified`). 쓸 수 있음 기준 = 원문 확인 숫자 사실 4개+경제 숫자 1개+결정 장면+전달 메시지+민감성 없음, 못 채우면 hold. 적용 스크립트 `C:/tmp/story-topic-resolve/apply-to-pool.mjs`, 증거 `lib/source-facts/story-topic-resolve/result-<id>.json`(풀 항목에 `evidenceFile`·`resolvedMessage`·`resolvedAt`·`verdictNoteBefore`), 백업 `C:/tmp/story-topic-backup/story-topic-pool.before-resolve-2026-10-09.json`. 결과: 쓸 수 있음 21개 승격(부르즈 칼리파·키프로스·에버기븐·갤럭시 폴드·경부고속도로·한진해운·현대 어슈어런스·아이슬란드·IMF 구제금융·레고·라인·네이버-한게임·닉슨 쇼크·포니·포스코 1973·프랑크푸르트 선언·삼성 vs 애플·삼양 우지·스리랑카·태국 바트·타이레놀), 보류 15개(근거 부족 9·장면 약함 6), 못 씀 2개(제일제당 설탕=legal, 포스코 침수=legal로 정정, 둘 다 진행·민감 국내 사건), **Owner 결정(10/9): 갤럭시 노트7 → 쓸 수 있음(10/7 보류 해제, 삼성 소재 편성 간격 필요), 폭스바겐 디젤게이트 → 못 씀 owner-rejected(기업 비리 저격 금지).** 현재 풀 419 = 사용 7·쓸 수 있음 59·조건부 106·보류 175·못 씀 72. 남은 조건부 106개는 미조사. 엑셀 재생성 `python C:/tmp/story-topic-backup/export-pool-xlsx.py _ai/story-topic-pool-classification-2026-10-09.xlsx`.

**10/10 조건부 다음 40개 추가 조사(Owner "다음 40개 진행"):** 우선순위 63~114 조건부 40개를 에이전트 8개(5개씩, 4개씩 두 번)로 조사하고 verify-results.mjs로 출처 대조(아마존 1건은 Flagpole를 WebFetch로 직접 확인해 manualVerified). 쓸 수 있음 16개 승격(아마존 차고·비비고 만두 미국·콜로니얼 송유관·다이소·포드 일당 5달러·고령교·후버 공짜 항공권·코닥·메이도프·머스크 해킹·미원 vs 미풍·뉴코크·노키아·팔도 도시락 러시아·찰스 폰지·서독 화폐개혁), 보류 24개(약한 장면 14·근거 부족 9·복잡 1). 현재 풀 419 = 사용 7·쓸 수 있음 75·조건부 66·보류 199·못 씀 72. 남은 조건부 66개 미조사(→ 같은 날 아래 3차에서 처리). 백업 `C:/tmp/story-topic-backup/story-topic-pool.before-resolve-2026-10-10.json`, 적용 스크립트 `C:/tmp/story-topic-resolve/apply-to-pool-2.mjs`, 증거 `lib/source-facts/story-topic-resolve/`, 엑셀 `_ai/story-topic-pool-classification-2026-10-10.xlsx`.

**10/10 3차 — 조건부 나머지 66개 전부 처리(Owner "남은 66개 진행"):** 우선순위 115~183 조건부 66개를 에이전트 11개(6개씩)로 조사 → verify-results로 출처 대조(홍콩 환율은 UPI 아카이브에 인용이 없어 직접 확인 후 보류로 정정). 쓸 수 있음 19개 승격(스와치·스위스 프랑 쇼크·타타 나노·토이저러스·엔론·리먼·대공황·크라이슬러 구제·J.C.페니·KFC 영국 치킨·펜티엄 FDIV·포스트잇·버블랩·스위스에어·야마이치·튜더 얼음·튤립·LG카드·한글 살리기), 보류 38개, 못 씀 3개(한샘 성폭력 사건 legal·키코 진행 소송 legal·동양 집단소송 legal). **조건부 6개는 Owner 판단 대기**(근거 조사는 끝남, 지금도 영업 중이거나 정치·피해자 소지): 이마트 창동점 1993·골프존·새마을금고 뱅크런 2023·성심당 1956·한보 1997(정경유착 정치 연루)·부산저축은행 2011(예금자 피해). 현재 풀 419 = 사용 7·쓸 수 있음 94·조건부 6·보류 237·못 씀 75. 백업 `C:/tmp/story-topic-backup/story-topic-pool.before-resolve-2026-10-10b.json`, 적용 스크립트 `C:/tmp/story-topic-resolve/apply-to-pool-3.mjs`, 엑셀 `_ai/story-topic-pool-classification-2026-10-10.xlsx`.

**10/10 4차 — 보류 237개 전부 해소(Owner "보류 해결해" → 근거 끝내 없으면 못 씀 확정, 이어서 "3번 진행"):** ①조사 결과 보유·미반영 86개 verify 후 34개 승격(접속불가 5건은 WebFetch로 직접 확인해 manualVerified), ②이전 조사 후에도 보류였던 77개는 못 씀으로 전환(no-scene/no-evidence/complex), ③미조사 74개는 에이전트 11개(5개씩)로 조사(첫 시도는 세션 한도 429로 중단, 19:30 KST 리셋 후 재실행) → verify 후 20개 쓸 수 있음·7개 조건부·47개 못 씀·한미 올무티닙 legal 1. 새 못 씀 사유 코드: no-scene(결정적 장면 없음)·no-evidence(2출처 근거 없음)·duplicate·complex — 체커가 허용. **현재 풀 419 = 사용 7·쓸 수 있음 145·조건부 16·보류 0·못 씀 251.** 조건부 16 = 기존 6(이마트 창동·골프존·새마을금고·성심당·한보·부산저축은행) + 이번 10(공인인증서 폐지·유니클로 후리스·제주 삼다수·한화 큐셀·롯데 신격호 껌·대교 눈높이·대한항공 인수 1969·KAL 태평양 노선·삼성 베트남 박닌·신세계 센텀 기네스). **승격한 쓸 수 있음 54개의 `storyFit` 7칸은 Claude 판단 초안**(`storyFitNote`에 표시, Owner 확인 전). 한 편 소재 후보 새로 확인된 것 다수: 바카스·양념치킨·스타일난다·삼성 노키아 추월·LG OLED TV·삼성 TFT-LCD·LG 인도 등. 백업 `C:/tmp/story-topic-backup/story-topic-pool.before-hold*-2026-10-10.json`, 적용 `C:/tmp/story-topic-resolve/apply-to-pool-4.mjs`·`apply-to-pool-5.mjs`, 엑셀 `_ai/story-topic-pool-classification-2026-10-10b.xlsx`(`C:/tmp/story-pool-xlsx.py`).

**Why:** 풀에 usedEpisode가 1건뿐이라 이미 쓴 소재가 후보 상위에 계속 올라왔고(러너 2위가 3편 소재), 새로 수집한 소재도 어디에도 기록되지 않았다. 또 내가 법적·포화 기준을 지나치게 넓게 적용해 Owner가 살리려는 소재까지 뺐다.

**How to apply:** 새 소재 제안 전 `node scripts/check-story-topic-pool.mjs --find <단어>`. 에이전트 수집은 `--export C:/tmp/story-topic-scan/pool-titles-for-agents.txt` 목록을 먼저 읽게 한다. 소재를 쓰거나 폐기하면 해당 항목 verdict·usedEpisode를 즉시 고친다. "정치색" 기준(남은 political 18개)은 Owner가 직접 말한 적이 없으니 Owner가 뒤집으면 따른다. 시리즈 순서를 짤 때 `placement: later` 소재는 초반 편에 두지 않는다. 관련 [[feedback_story_script_not_chronology_list_2026_10_08]].

## 인덱스에서 이관된 요약 (2026-10-09)
- [★소재 풀 v3 분류 완료(10/8) — 243개 verdict(사용 7·쓸 수 있음 17·조건부 60·못 씀 159), 새 소재 제안 전 `check-story-topic-pool.mjs --find` 대조, 수집 에이전트에는 `--export` 목록 먼저](project_story_topic_pool_v3_classified_2026_10_08.md)
