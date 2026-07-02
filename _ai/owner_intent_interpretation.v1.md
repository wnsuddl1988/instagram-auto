# Owner Intent Interpretation v1 — Golden Sample 방향 reset

- 작성일: 2026-07-03
- Task: `golden-sample-direction-reset-money-economy-psychology-v1`
- 지위: Owner가 지적한 방향 오해를 바로잡는 해석 고정본. `_ai/CREATIVE_V2_GOLDEN_SAMPLE_ABSOLUTE_RULES.md` 원문과 addendum이 항상 우선한다.

---

## 1. 레퍼런스의 의미 — "주제 복사 아님, 제작 문법 참고"

- Owner가 공유한 레퍼런스 영상은 **production grammar(제작 문법) 영감**이다.
  - 가져올 것: hook 구성 방식, 정보/팩트 밀도, 굵은 정보형 타이포, 시각 리듬(빠른 카드 전환), CTA 마무리 방식.
  - 가져오지 않을 것: 레퍼런스의 **주제**, 로고/채널명, 고유 문장, 디자인 트레이싱.
- **Reference is not a topic. Reference is a production grammar.**
- 레퍼런스가 시황/증시형 콘텐츠라는 이유로 KOSPI/실시간 거시경제 뉴스로 전환하라는 지시가 아니다. 실시간 시황 주제는 Owner가 직접 고르기 전에는 우선 제안하지 않는다.
- 세부 계약: `scripts/fixtures/reference_mechanics_contract.v1.json`

## 2. 채널 라인 — 돈 + 경제 + 심리 + 성공패턴 (유지)

- 채널 방향은 **돈 + 경제 + 심리 + 성공패턴**이다. 이 라인은 변경되지 않았다.
- 후보 제안은 4개 축 안에서만 한다: `money_flow` / `opportunity_info` / `money_psychology` / `success_pattern`.
- 후보 보고서: `scripts/fixtures/topic_candidate_report.v1.json` (5개 후보, 추천 1~2개, Owner 승인 필수).

## 3. 기존 산출물의 지위 — REJECT_AS_GOLDEN_SAMPLE

- `golden_sample_v2_salary_3days_visual_only.mp4`는 **`REJECT_AS_GOLDEN_SAMPLE / TECHNICAL_EVIDENCE_ONLY`**다.
- 직전 보고의 `PASS_PROVISIONAL_VISUAL_ONLY` 표현은 **Golden Sample pass로 유지하지 않는다** — 기술 파이프라인 증거로만 남긴다.
- Owner가 지적한 실패 요점:
  1. 자막/폰트가 충분히 바뀌지 않았고 여전히 기본 Malgun Gothic 느낌이었다.
  2. 이미지가 낡고 외국 느낌이며 한국 돈/월급 맥락과 단절됐다 — **정체불명 외국 화폐 느낌은 한국 돈/경제 주제에서 hard fail**.
  3. Owner의 주제 선택을 재확인하지 않고 기존 주제를 계속 밀었다.
  4. **기술 PASS(ffprobe/MD5/overlap QA)는 Golden Sample PASS가 아니다** — 최종 기준은 Owner 시청 QA.

## 4. 주제 확정 절차 — Owner 승인 전 금지

- Codex/Claude는 주제를 확정하지 않는다. 후보를 제시하고 **Owner 선택을 기다린다**.
- `월급이 3일 만에 사라지는 이유`(salary_3days)는 후보 중 하나일 수 있으나, Owner 확정 전 계속 밀지 않는다. salary_3days locked image set을 새 방향의 기본값으로 재사용하지 않는다.
- 주제 확정 전에는 이미지 생성/유료 API/render 금지.

## 5. 다음 단계 gate (순서 고정)

1. Owner 주제 선택 (`topic_candidate_report.v1.json` 또는 직접 지정)
2. Owner 폰트/자막 스타일 승인 (typography mock frames 4장 + `bold_info_shorts_font_contract.v1.json`) — 프로덕션 렌더용 static 폰트 설치 결정 포함
3. Owner 이미지 방향 승인 (한국 맥락 + money-like objects + no readable text)
4. Owner 이미지 생성 승인 (provider/장수/비용 상한/실패 조건/중단 조건 명시)
5. 이후에만 Story-Causality First → Visual Evidence Second 순서로 제작 재개

- 질문 목록: `_ai/owner_review_questions.md`
