# Golden Sample FLUX2 Object-Whitelist Contract v2 (2026-07-02)

Task: `creative-v2-flux2-object-whitelist-contract-v2`

기계 판독용 원본: `scripts/fixtures/golden_sample_flux2_object_whitelist_contract.v2.json`
근거 실측: `output/money-shorts/flux2-small-validation-v1/qa-report-flux2-small-validation.v1.json`

## 1. 전략 전환의 근거 (실측 인과)

FLUX2 소량 검증(4장)에서 확인된 인과는 두 갈래다:

- **오브젝트 "구성" 지시는 4/4 충실** — 요청한 사물이 요청한 배치·조명·질감으로 등장했다. 해상도도 누적 8/8 native.
- **오브젝트 "표면"의 텍스트 지시는 실패 재현** — negative를 이중 강화해도 시계(08:15), 계산기 키패드, 달력 날짜/요일, 동전 각인, 머그 인쇄가 나왔다. 명시 지시("unlabeled blank buttons", "no numbers")를 realism prior가 이겼다.

따라서 통제 지점을 **표면(negative)에서 구성(whitelist)으로** 옮긴다. 텍스트가 원래 있는 오브젝트는 지시로 못 지운다 — 등장 자체를 없애야 한다. scene 2(빈 종이/무지 봉투/민무늬 가죽/목재만으로 구성)가 유일 PASS였다는 것이 이 전략의 실증 근거다.

## 2. v1 검증에서 추가로 규칙화한 교훈 3개

1. **머그 교훈**: 프롬프트가 언급만 하고 blank 목록에 안 넣은 오브젝트(커피잔)에 'morning'이 인쇄됨 → **모든 가시 오브젝트를 열거하고, 열거 외 오브젝트 등장 자체를 금지**.
2. **지갑 교훈**: 지갑 브랜드 각인 + 빈 지갑에 카드 무단 추가 → 가죽은 "smooth unstamped" 명시 + **내부 상태(비었음/닫힘)를 명시**.
3. **배경 교훈**: 흐린 배경의 가전/포스터류가 잠재 텍스트 위험 → 배경은 "무인식 플레인 블러"로 제한.

## 3. Scene 재번역 요약 (T2: 월급이 3일 만에 사라지는 이유)

| Scene | v1 위반 | v2 재번역 |
|-------|---------|-----------|
| 1 hook | 폰 시계 08:15 + 머그 인쇄 | 폰 제거 → **방금 뜯은 월급봉투**에서 빛나는 새 blank slips를 꺼내는 손 + 기다리는 빈 지갑 |
| 2 leak_order | 없음 (유일 PASS) | **재번역 안 함** — proven v1 프롬프트 verbatim 승계, 기존 PASS 이미지가 후보 (재지출 불필요) |
| 3 fixed_cost | 계산기 숫자 + 카드 각인 | 계산기·카드 제거 → **끈으로 묶인 blank 종이 다발 탑 vs 납작한 빈 지갑**의 높이 대비, 램프는 프레임 밖 광원 |
| 4 subscriptions | (v1 제외 — 화면 타일 충돌) | 화면 제거 → **완전 등간격으로 어둠 속으로 이어지는 작은 blank 탭 행렬** (등간격=자동, 동일 크기=반복, 페이드=은밀) |
| 5 day3_empty | 달력 숫자/요일 + 동전 각인 + 카드 가득 | 달력·동전 제거 → **무문자 앰버 탭 3개**(3일) + 카메라로 기울인 지갑의 **텅 빈 내부 공간** 자체가 주제 |
| 6 reset_action | (v1 제외) | 달력·펜 제거 → 두 손이 **blank 카드 3장을 의도적 순서로 정렬** (첫 카드 반 발짝 앞 = 우선순위) |

공통 원리: **숫자·순서·시간은 사물 개수/등간격/빛으로 은유하고, 글리프가 필요한 정보는 renderer 카드가 얹는다** (card-first 원칙과 정합).

## 4. Prompt Template v2 구조

순서: ① composition whitelist head ("BUILD THIS SCENE USING ONLY THESE OBJECTS: …" + banned 목록 내장 + 배경 무인식 블러) → ② style anchor (benchmark 스타일) → ③ scene subject → ④ blank-surface tail (3중 안전망). negative 문장보다 whitelist가 항상 먼저다. width=1088 height=1936 고정, fallback/upscale/stock/placeholder 금지.

## 5. QA Gate v2 — 신설 항목

기존 gate(해상도/no-text/전달력/safe-area/왜곡)에 **object-whitelist compliance**를 추가: banned 오브젝트가 등장하면 표면이 blank여도 fail (잠재 위험 + 불순응 신호). fail 시 씬당 1회 강화 재생성 → 재실패 시 skip. placeholder/941 재사용/업스케일 금지.

## 6. 잔여 위험 (정직 고지)

- 지갑 각인·배경 블러 라벨 잔상은 완화만 가능 — QA 확대 확인 필수.
- **추상화의 대가가 진짜 시험대**: 화이트리스트 은유(등간격 탭=자동결제, 탭 3개=3일)가 시청자에게 읽히는지는 다음 검증에서만 확인 가능. no-text를 잡고 전달력을 잃으면 실패다.
- 이 계약도 품질 자동 보장이 아니다 — gate + QA + regenerate/skip 반복으로만 균일성 강제.

## 7. 다음 검증 추천 (실행 승인 아님)

- **별도 Owner 승인 필요.** 이 문서는 계약 고정일 뿐 FLUX2 호출 승인이 아니다.
- 추천: 최대 4장 / $1 이하 (~$0.25 추정) — scene 1(hook 최중요) + 3(계산기 제거 검증) + 5(최다 위반 재설계 검증) + 4(신규 은유 전달력 검증). scene 2는 PASS 이미지 보유로 제외, scene 6은 최저 위험 후순위.
- 성공 기준: no-text + whitelist compliance 4/4 목표 (최소 3/4 + 전달력 유지 시 FLUX2 운영 채택 재판단).
- render/TTS/mux/upload 금지 유지. renderReady=false / uploadReady=false 무변경.
