# Owner Review Questions — Golden Sample 방향 reset (2026-07-03)

Task: `golden-sample-direction-reset-money-economy-psychology-v1`
아래 4개 질문에 대한 Owner 결정이 있어야 다음 단계(이미지 생성/render)로 진행합니다. 결정 전에는 전부 중단 상태 유지.

---

## Q1. 주제 후보 선택 (`scripts/fixtures/topic_candidate_report.v1.json`)

| # | topic_id | 제목 | 축 |
|---|----------|------|----|
| 1 | t1_lifestyle_inflation | 월급이 올라도 통장이 그대로인 이유 | money_psychology |
| 2 | t2_card_billing_lag | 월급날인데 이미 마이너스인 이유 | money_flow |
| 3 | t3_anchoring_sale_trap | 반값 세일이 지갑을 여는 방식 | money_psychology |
| 4 | t4_rule_of_72 | 내 돈이 2배 되는 시간, 3초 계산법 | opportunity_info |
| 5 | t5_24hour_rule | 부자들이 사기 전에 하루 기다리는 이유 | success_pattern |

- 추천(제안일 뿐): **t1** (심리 공감형) 또는 **t4** (공식 효용형)
- 선택지: ① 위 5개 중 선택 ② 직접 다른 주제 지정 ③ salary_3days 유지 결정(이 경우에도 이미지는 새 기준으로 재생성)
- **Owner 답변**: (예: "t4로 진행")

## Q2. 폰트/자막 스타일 승인 (typography mock 4장)

- 확인 경로: `output/money-shorts/golden-sample-direction-reset-money-economy-psychology-v1/typography_mock_frames/`
  - `mock_frame_01_hook.png` (대형 훅 타이포) / `02_fact_card` (숫자 카드) / `03_mechanism` (구조 흐름) / `04_action` (CTA)
- 적용 기준: Noto Sans KR **Black** + 검정 외곽선 9px+ + 흰색 기본 + 노랑/주황/빨강/파랑 강조 (`bold_info_shorts_font_contract.v1.json`)
- 질문:
  1. 이 굵기/외곽선/강조색 방향이 원하시는 "정보형 쇼츠 느낌"이 맞습니까? (수정 지시 환영: 더 굵게/외곽선 더 두껍게/색 변경 등)
  2. **프로덕션 렌더용 폰트 설치 결정** — 현재 영상 renderer는 Black weight를 못 씁니다(시스템에 static 굵은 폰트 미설치). 다음 중 선택해 주세요:
     - ② -A. Owner가 Pretendard Black(무료 라이선스) 등 승인 폰트를 직접 설치 (권장 — 설치 후 renderer가 바로 사용)
     - ② -B. 설치를 승인만 하고 설치 작업 지시를 별도 slice로 위임
     - ② -C. renderer를 Pillow 오버레이 방식으로 개편 (코드 작업 필요)
- **Owner 답변**:

## Q3. 이미지 방향 승인

- 적용 원칙(HANDOFF_NOW 승계): 한국 시청자 즉시성 필수 — 한국 돈/통장/월급/생활비/이체/카드/봉투 맥락, **외국 지폐 느낌/정체불명 화폐 hard fail**, 이미지 내 읽히는 글자 금지(숫자/라벨은 카드가 담당), money-like objects는 적극 허용.
- 원화 리스크 처리 제안: 원화 지폐를 사실적으로 그리면 초상/한글 깨짐 위험 → **봉투/지갑/카드/색감(오만원권 톤 등)으로 한국 맥락을 암시**하고 정보는 타이포 카드가 전달하는 방식을 기본값으로 제안합니다.
- 질문: 이 이미지 방향(한국 생활 오브젝트 + 암시적 원화 톤 + 타이포 카드 중심)에 동의하십니까? 아니면 다른 시각 기준을 지정하시겠습니까?
- **Owner 답변**:

## Q4. 다음 이미지 생성 승인 (장수/비용/실패·중단 조건)

- 주제/폰트/이미지 방향 승인 후에만 진행합니다. 승인 문구에 아래 항목이 모두 있어야 합니다:
  - provider (기존 승인 경로 내에서)
  - 장수 (예: 선택 주제 6 scene × 2후보 = 12장)
  - 비용 상한 (예: $3 이하)
  - 실패 조건 (예: 한국 맥락 위반/글자 깨짐 hard fail 판정 기준)
  - 중단 조건 (예: 승인 장수 내 scene별 채택 후보 미달 시 즉시 중단·보고, 추가 호출 금지)
- 참고 승인 문구 틀: "승인: [주제] 이미지 [N]장, [provider], 상한 $[X]. 실패 기준은 [기준]. 승인 장수 내 실패 시 즉시 중단하고 보고."
- **Owner 답변**:

---

> 이 문서는 질문 목록입니다. 어떤 항목도 Owner 답변 전에 확정된 것으로 취급하지 않습니다.
