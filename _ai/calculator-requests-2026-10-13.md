# 생활계산기(buildgongjakso.com) 새 계산기·연결 요청 목록 (Claude 관리, 2026-10-13~)

사이트 소스: `C:/Users/PC/jjy/life-decision`(Next.js, `src/registry/tools/<slug>.ts`에 ToolDefinition 등록·골든 테스트 필수, 정책 계산은 RuleVersion active 전 공개 금지·출처·기준일 필요 — README 제약). 이 폴더에는 다른 세션의 미완료 수정이 있을 수 있어(10/13 `year-end-settlement.ts`) **이 저장소 세션에서 별도 작업**으로 만든다. 영상 소재를 고를 때 "보낼 계산기가 있나"를 먼저 점검해 이 목록에 쌓는다.

## 이미 있는 계산기 중 영상·뉴스레터와 바로 맞는 것(사이트 100개 목록 10/13 확인)
| 영상 소재 | 연결할 계산기 |
|---|---|
| 주담대 금리 리셋(통합 49) | /tools/loan-repayment · /tools/loan-refinance · /tools/mortgage-limit |
| 실업급여(채널 최고 조회) | /tools/unemployment-benefit · /tools/ei-just-cause-eligibility |
| 근로장려금(표시 22편) | /tools/eitc |
| 국민연금(14편 등) | /tools/national-pension-benefit · /tools/national-pension-timing-breakeven |
| 청년미래적금·적금 | /tools/savings-goal |
| 육아·출산 | /tools/parental-leave-benefit · /tools/child-rearing-cost |
| 월급·연봉 | /tools/take-home-pay · /tools/salary-change-compare |
| 전세·월세 | /tools/jeonse-monthly-conversion · /tools/jeonse-vs-buy · /tools/lease-safety-check |

## 새로 필요한 계산기(우선순위 순, 승인·사이트 세션에서 제작)
1. **아동수당·아동기본수당 계산기** — 아동 나이·수·지역(지방우대) → 월 수령액(현금/상품권 구분). **정부안 국회 의결 전에는 공개 금지**(확정 뒤 RuleVersion active). 의결 확인: 예산 의결 기한 12/2 이후.
2. 부모급여·첫만남이용권 합산(출산 직후 받을 수 있는 돈) — 사이트에 `parental-leave-benefit`(휴직 급여)은 있으나 부모급여는 없음. 정책 근거 확인 필요.
3. (스토리·설명형에서 반복 요청이 생기면 이 목록에 추가: 소재·필요한 입력·출력·근거 출처)

## 운영 규칙
- 영상 기획 단계에서 "이 편이 보낼 계산기"를 정하고, 없으면 여기에 한 줄 추가한다(소재·입력·출력·근거·공개 가능 시점).
- 연결 링크는 항상 `?utm_source=<video|newsletter|linktree|threads>&utm_medium=<social|email>&utm_campaign=<편 식별>` 꼬리표를 붙인다.

## 추가 확인(10/13 저녁) — 캘린더 PDF 작성 중 발견
- **사이트에 이미 있는 계산기(영상·뉴스레터·PDF에서 연결 가능)**: 기초연금 `/tools/basic-pension`, 종합소득세 `/tools/comprehensive-income-tax`, 종부세 `/tools/comprehensive-property-tax`, 재산세 `/tools/property-holding-tax`, 연금저축·IRP 세액공제 `/tools/pension-account-credit`, 연말정산 `/tools/year-end-settlement`·`/tools/year-end-deductions`, 건강보험료 `/tools/health-insurance-premium`, 부가세 `/tools/vat`, 퇴직·연금 관련 다수(전부 사이트 소스 `src/registry/tools/`에서 slug 확인, 8개는 HTTP 200 확인).
- **새로 필요(우선순위)**: ① 부모급여·출산 직후 합산(부모급여 0세 월 100만·1세 월 50만, 출생 60일 내 신청 시 출생월 소급, 어린이집 이용 시 보육료 차액 — 복지로 2026 안내 확인됨; 사이트에 `parental-leave-benefit`은 휴직 급여라 별개) ② 아동수당·아동기본수당(정부안, 의결 전 공개 금지) ③ 문화누리카드·에너지바우처 "내가 대상일까" 자가점검(기준 확인 필요, 계산이 아닌 체크리스트형) ④ 건강보험료 정산(4월) 예상 추가 납부/환급(연봉 변동 입력) — 기존 `health-insurance-premium`과 중복 여부 확인 후 결정.
