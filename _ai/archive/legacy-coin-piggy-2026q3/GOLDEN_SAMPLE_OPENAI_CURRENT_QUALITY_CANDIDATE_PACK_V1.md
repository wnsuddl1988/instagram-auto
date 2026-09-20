# Golden Sample OpenAI Current Quality Candidate Pack v1 (2026-07-02)

Task: `creative-v2-openai-current-candidates-quality-pack-v1`
Owner 지시: `아니 open ai쪽은 지금 생성된거만으로 품질후보로 진행해`

기계 판독용 원본: `scripts/fixtures/golden_sample_openai_current_quality_candidate_pack.v1.json`
근거 실측: `output/money-shorts/openai-full-selected-image-candidates-v1/` (summary + qa-report)

## 1. 지위 선언

- **OpenAI gpt-image-2로 이미 생성된 5장만이 현재 공식 품질후보 source다.** 이 slice에서 추가 생성 없음.
- "잔여 7장 billing 재실행 대기"는 이 pack의 전제가 아니다 (후속 옵션 C로만 존재).
- 기존 941x1672 ChatGPT selected set과 probe는 evidence-only 유지 — final 재사용 금지.
- placeholder/stock fallback 금지, 단순 upscale/crop-as-fix 금지 유지.

## 2. 기존 941x1672 세트 대비 개선 근거 (기록)

| 측면 | 기존 941x1672 세트 | OpenAI 5장 |
|---|---|---|
| 해상도 | 941x1672 — gate 미달 | **1088x1936 native 5/5 PASS** (업스케일 없음) |
| no-text | generic + 가독 텍스트 위험 | **5/5 위반 0건** (추상 글로우/빈 슬립/무번호 카드/무라벨 계산기) |
| 주제 전달 | "이미지 붙여놓고 설명" — generic | 씬 역할별 시각 은유가 이미지만으로 읽힘 (입금 순간/새는 순서/고정비 무게) |

## 3. 품질후보 분류 (5장)

**recommended (3장):**
| 이미지 | scene | 근거 |
|---|---|---|
| `scene-01A-salary_arrival_hook.png` | 1 hook | overlay 하단 여백 최상, 입금 순간 전달 명확 |
| `scene-02A-money_leak_order.png` | 2 leak | '정해진 순서로 새는 돈' 은유 최상 + 생활감 |
| `scene-03A-fixed_cost_stack.png` | 3 fixed cost | 고정비 무게감, scene 3 유일 후보 |

**backup (2장):** `scene-01B` (어깨 유입/상단 복잡), `scene-02B` (탑다운 큐 명확·여백 최상이나 정물감)

## 4. Scene coverage 리스크

- covered: scene 1 (후보 2), scene 2 (후보 2), scene 3 (후보 1 — backup 없음)
- **missing exact coverage: scene 4 (subscriptions_auto_pay), scene 5 (day3_empty_wallet), scene 6 (cashflow_reset_action)**
- missing scene을 recommended/backup 이미지로 재사용하는 것은 **자동 승인하지 않는다** — reuse requires Owner/render-scope approval.

## 5. Render 금지선 (유지)

- `renderReady=false` — reason: `selected_set_not_complete_without_explicit_reuse_or_coverage_approval`
- `uploadReady=false`
- 어떤 후속 옵션에서도 render/TTS/mux/upload는 별도 명시 승인 전 금지.

## 6. 다음 결정 (Owner/Codex 판단 항목 — 이 pack은 결정하지 않음)

- **A.** 현재 5장(3-scene coverage)으로 quality grammar prototype 진행 — 씬 구조를 3-scene으로 재설계할지, 재사용 구조로 갈지 판단 필요.
- **B.** missing scene 4~6에 recommended/backup 이미지 재사용 승인 — 이미지↔씬 매핑 명시 승인 필요.
- **C.** 후속 이미지 source 재오픈 — billing 정산 후 잔여 7장 재실행, 또는 다른 provider 소량 테스트.
