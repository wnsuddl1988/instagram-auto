# B. 못 씀 구제 — 패턴 설계와 우선 후보 부분 점검

- 작업 일시: 2026-10-12 00:55 KST 이전
- 열람: `01_CONTEXT_STATUS.md`, `02_CRITERIA.md`, `04_UNUSABLE_LIST.md` 전체 사유 구간, `05_USED_LIST.md`, `_ai/story-new-candidates-final-classification-2026-10-12.json`, 일부 `lib/source-facts/story-topic-resolve/result-<id>.json`의 형식, 아래 원문 URL.
- 검색한 주제 수: 외부 원문 신규 검색 6건(베지밀·인터파크·교보문고·임실치즈·삼양라면·통인시장). 나머지 B2 14건은 로컬 기존 분류 메모만 읽은 **독립 재검색 미완** 항목이다. B0의 추정 분모는 서로 겹치며 성공 가능 건수가 아니다.
- **승격 0건.** 어떤 건도 결정 장면 2기관 + 숫자 4개 각각 2도메인 + 퍼즐 답 + 날짜 3개 이하 + 위험 제약을 모두 채우지 못했다. `MOVE_TO_EXPLAINER`는 스토리형 `KEEP_UNUSABLE`을 유지하는 별도 편집 제안이다.

## B0. 구제 방법 — 기준은 그대로 유지

| 패턴 | 정의와 적용 조건 | 효과 볼 사유 코드 / 선별 분모(중복 가능) | 실패하는 경우 |
|---|---|---|---|
| P1 앵글 전환 | 현상·제도 대신 **자료에 기록된** 회사·사람의 선택 한 번을 주어로 바꾼다. 새 선택을 상상하지 않는다. | 기존 no-scene 93 + off-channel 11, 신규 R4 68 = **최대 172** | 정책 당국만 주체인 R2, 원문에 결정 장면이 없거나 실제로는 여러 원인이 결합할 때. |
| P2 종결 시점 절단 | 옛 사건에서 지금은 종결된 결정 한 시점만 택하고, 현행 소송·피해·정책 논쟁과 분리 가능한지 현재 자료로 확인한다. | 기존 legal 35 + political 30, 신규 R1 12 + R2 37 = **최대 114** | 여전히 피해자·소송·정치 책임 공방이 서사의 핵심인 경우. 단순 과거 시점 설정은 면책이 아님. |
| P3 출처 경로 확장 | 당시 신문·정부/기관 기록·도서관 사료·학술논문·독립 매체를 찾아 **서로 다른 원자료 계통** 2곳을 확보한다. | 기존 no-evidence 65 + 신규 R3 70 = **최대 135**(no-scene 93도 일부) | 같은 인터뷰·보도자료를 여러 매체가 옮긴 경우, 원문 접근 불가, 숫자별 2도메인 미달. |
| P4 숫자 재편 | 상충 숫자는 아예 빼고, 남은 **4개 이상**을 값·단위·기준 시점까지 같은 두 도메인으로 확인한다. | 신규 R3 70·기존 no-evidence 65 중 수치 충돌 기록이 있는 부분집합; 정확 건수 미집계 | 숫자 4개 미만 또는 서로 다른 시점·모수의 숫자를 '일치'로 착각하는 경우. 숫자 요건을 줄일 수 없음. |
| P5 단위 재조정 | 큰 사건에서 선택 하나만 분리하거나 한 주체의 인접한 두 결정을 연결하되, 인과·날짜·퍼즐 답을 사료로 입증한다. | 기존 no-scene 93·complex 2, 신규 R4 68 = **최대 163** | 따로 떼면 경제 결과와 인과가 끊기거나, 묶으면 3날짜를 넘는 경우. |
| P6 홍보 위험 해소 | 현 영업 기업을 다루더라도 제품·소비자 선택의 과거 사실로 한정하고 주가·실적 홍보·상대사 평가를 빼며 현재성 확인. | 기존 investment 1 + 신규 R6 3 = **최소 직접 대상 4**, 다른 R3·R4의 현 영업 기업은 별도 추출 필요 | 현재 금융기관 건전성·인출, 진행 소송·피해, 자료 대부분 회사 제공이면 주어 변경만으로 해소되지 않음. |
| P7 설명형 이관 | 결정 장면이 없는 경제 원리·제도는 부엉박사·황소특보의 별도 후보로만 제안한다. **스토리 판정은 못 씀 유지.** | 기존 off-channel 11·no-scene 93, 신규 R4 68 = **최대 172** | 설명형에서도 신선도·소비자 효용·현행 규정 검증이 부족하거나 정치·금융 위험이 그대로인 경우. |

**선별 순서:** R1/R2/R6·owner-rejected·동일 사건 중복을 먼저 걸러서 비용을 줄인다 → P1/P5로 결정 문장을 실제 기록에서 찾는다 → 장면 2기관을 확인한다 → 퍼즐 답을 확인한다 → 숫자별 2도메인 4개를 대조한다 → 날짜·현재성·홍보 위험을 마지막 점검한다. 장면 1출처이면 숫자 조사에 들어가지 않는다. P7은 스토리 승격과 섞지 않는다. 기존 사유에 `Owner 확정`이라고 적혀 있어도 **owner-rejected 코드가 아닌 건** 조사 제안 자체는 가능하다. 다만 실제 변경은 Claude·Owner가 판단한다.

## B1. 기존 no-scene(93)·no-evidence(65) — 재검색한 4건

| id | 패턴·새로 확인한 자료 | 판정과 빠진 필수 칸 |
|---|---|---|
| `kyobo-bookstore-1981` | P3/P4. [서울시 미래유산](https://futureheritage.seoul.go.kr/futureHeritageMeet/futureHeritage/view.do?htNo=3603) INDEX에는 1981·약 2천 평·60만 권; [주간조선](https://weekly.chosun.com/news/articleView.html?idxno=10048) INDEX에는 개점과 반대 맥락. | **KEEP_UNUSABLE R3** — '서서 읽게 한' 결정 2기관 원문과 **2천 평·60만 권 등 각 수치의 두 번째 도메인**을 확보하지 못함. 기존 04의 93만→3,758만 권은 단일 출처라는 사유 유지. |
| `imsil-cheese-1964` | P3/P4. [서울Pn](https://go.seoul.co.kr/news/newsView.php?id=20191016022004) INDEX에서 1965 산양 2마리→1966 조합→1967 카망베르로 나뉨. 04 메모의 1964 부임·1967 개발과 구분 필요. | **KEEP_UNUSABLE R3** — 창업·개발 숫자 4개 각각 2도메인 부족. 1967 공장과 1968 공장 제목도 구분 필요. 신부의 사생활·미화 배제. |
| `samyang-ramen-1963` | P3/P4. [이투데이](https://www.etoday.co.kr/news/view/1181964) INDEX·[매일경제](https://www.mk.co.kr/news/society/5710887) INDEX에 직원 무료 시식 장면. [우리역사넷](https://contents.history.go.kr/front/km/view.do?levelId=km_026_0070_0030) INDEX에는 1960년대 혼분식 정책 흐름. | **KEEP_UNUSABLE R3/R2 위험** — 무료 시식의 기간·결과 숫자 4개 2도메인 미달, 시식 때문에 판매가 늘었다는 인과는 정책 효과와 분리 불가. |
| `tongin-market-yeopjeon-2012` | P1/P3. [서울시의사회 자료](https://pdf.doctorstimes.com/seoul/51.pdf) INDEX에 2012 운영·5천 원/엽전 10개만 보임. | **KEEP_UNUSABLE R3** — 상인회 결정 2기관, 서로 다른 도메인 숫자 4개, 퍼즐 답 미확인. |

나머지 **154건**(두 코드 합계 158 중 위 4건)은 독립 재검색하지 않았다. 로컬 `04` 사유를 읽었다는 이유로 전수 재검토라고 표시하지 않는다.

## B2. 신규 경계 후보 16건 — 2건 원문 재검색, 14건 로컬 메모 검토

아래 `KEEP_UNUSABLE`은 승격 증거가 없어 현재 판정을 건드리지 않는다는 뜻이다. `local-only`는 04와 후보 JSON의 기존 사유를 확인했으며 **이번에 외부 원문을 재확인하지 않은 것**이다.

| id | 패턴 | 판정·빠진 칸 |
|---|---|---|
| `vegemil-1966` | P1/P3/P4 | **KEEP_UNUSABLE R3**. [한국민족문화대백과](https://encykorea.aks.ac.kr/Article/E0080072) INDEX·[KBS](https://news.kbs.co.kr/news/view.do?ncd=3557124) INDEX는 1966 개발·1973 창업, [한경](https://www.hankyung.com/article/2016110651111) INDEX은 1967 개발. 직접 사업화 선택 자체는 [한국민족문화대백과](https://encykorea.aks.ac.kr/Article/E0080072)에서 보이나 독립 2기관 장면과 숫자 4개 대조 실패. '아무도 사업화하지 않았다'는 문장은 여전히 미확인. |
| `interpark-1996` | P1/P3/P4 | **KEEP_UNUSABLE R3**. [전자신문 2001 인터뷰](https://www.etnews.com/200105270021) INDEX는 1995 사업 시작·1996.6.1 개점·13명·7억·10여 입점사·3개 카드사를 제시; [전자신문 2012](https://www.etnews.com/201209110664) INDEX·[이투데이](https://www.etoday.co.kr/news/view/1062600) INDEX는 1996 개점을 뒷받침. **13·7억·10여·3개 각각 두 번째 도메인**이 없고 창업 결단 장면은 동일 인터뷰 계통. |
| `shiri-1999` | P3/P4 | **KEEP_UNUSABLE R3** local-only: 투자 31억/제작비 24~31억·해체 연도 상충, 투자 결정 2기관·숫자 4쌍 없음. |
| `priceclub-yangpyeong-1994` | P3/P4 | **KEEP_UNUSABLE R3** local-only: 보름 매출·회원 수 단일 도메인, 인수 연도 1997/1998 상충. |
| `pepero-day-1993` | P1/P4 | **KEEP_UNUSABLE R3** local-only: 회사의 한 번의 결정 장면 없음, 매출 비중·마케팅 시작 시점 상충. |
| `coin-500-1982` | P1/P3 | **KEEP_UNUSABLE R3/R2** local-only: 정책 결정 주체·이유, 승인/발행 날짜와 숫자 4쌍 미확인. |
| `bravo-cone-1970` | P1/P3 | **KEEP_UNUSABLE R3** local-only: 해태의 결정 장면 없음, 경쟁사 비교·연도 상충. |
| `sammi-1982` | P5/P3 | **KEEP_UNUSABLE R3** local-only: 승패·매각액·부도일 근거 부족, 개인 구단주 서사 위험. |
| `chum-churum-2006` | P6/P4 | **KEEP_UNUSABLE R3** local-only: 점유율·판매량이 회사 발표 계통, 현재 두 회사 비교 홍보 위험. |
| `komsco-first-coin-1971` | P3/P4 | **KEEP_UNUSABLE R3/R2** local-only: '최초' 전제가 1970 발행과 충돌, 발행량·결정 장면 미확인. |
| `seoul-olympic-surplus-1988` | P1/P3 | **KEEP_UNUSABLE R3/R2** local-only: 흑자 원자료·결정 장면·숫자 4쌍 없음. |
| `bangladesh-daewoo-desh-1980` | P4/P5 | **KEEP_UNUSABLE R3** local-only: 합작 연도·인원·연수 기간·여성 수 모두 상충, 한국 접점은 있으나 숫자 4쌍 불가. |
| `celltrion-2002` | P1/P3/P6 | **KEEP_UNUSABLE R3** local-only: 백신 실패→바이오시밀러 결정 과정·자본금·직원 수 미확인; 영업 중 상장사 홍보 위험. |
| `hyundai-fcev-2013` | P3/P6 | **KEEP_UNUSABLE R3** local-only: '100대 지시' 2기관 실패, 현대 반복·현재 홍보 위험. |
| `academy-titanic-1997` | P3/P4 | **KEEP_UNUSABLE R3** local-only: 한국어 단일 일화와 영문 자료가 다른 금형 이야기, 4개 숫자 없음. |
| `iriver-2003` | P1/P4/P6 | **KEEP_UNUSABLE R3** local-only: 점유율 18/25% 충돌·결정 장면 미확인·상장사 주가 위험. |

## B3/B4 — 제한된 구조 선별, 승격 없음

R4 68건과 기존 off-channel 11건은 04의 제목·사유를 훑었으나 외부 원문 대조를 마치지 못했다. **P7 설명형 이관 제안 4건**: `pager-1982`(기술 대체와 네트워크 효과), `coffee-vending-1977`(셀프서비스와 가격), `bottled-water-1994`(물 판매가 생긴 제도 변천), `payphone-2018`(보편적 역무 비용). 모두 `MOVE_TO_EXPLAINER(P7)`, 스토리형은 **KEEP_UNUSABLE R4**. 각 건의 현행 제도·숫자는 설명형 편성 전에 별도 검증해야 한다. P1/P5로 실제 2기관 결정 장면을 입증한 사례는 **없음**.

기존 legal 35·political 30, 신규 R1 12·R2 37에 P2를 적용할 가능성은 검토했으나 **현재 민감성·종결 여부를 개별 원문으로 재확인한 건은 0건**이다. 따라서 B4 FLIP은 0건이며, 이 묶음에서 10건을 무작위로 집어 '옛 사건'이라는 이유만으로 구제하지 않았다. `owner-rejected` 5건은 검토·뒤집기 대상에서 제외했다.
