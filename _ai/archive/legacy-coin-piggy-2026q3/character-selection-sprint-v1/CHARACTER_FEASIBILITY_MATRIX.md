# PA-5Y Character Feasibility Matrix

## 판정 규칙

- 아래 평가는 제공된 concept image와 현재 baseline을 기준으로 한 **설계 가설**이다. 구현 proof 전에는 `HYPOTHESIS_ONLY`다.
- `1`은 불리함/높은 위험, `5`는 유리함/낮은 위험이다. `Blender rig complexity`, `2D rig complexity`, `material/lookdev risk`, `animation risk`, `perspective/3Q risk`, `production maintenance cost`는 **낮은 복잡도·위험·비용일수록 높은 점수**다.
- 편의성 점수는 후보 우승을 보장하지 않는다. 실제 충실도와 생동감이 우선이다.

## 축별 비교 (1–5)

| 축 | BASELINE_OWNER_ORIGINAL_A | CANDIDATE_COIN | CANDIDATE_STATEMENT | CANDIDATE_DECODER |
| --- | ---: | ---: | ---: | ---: |
| economic immediacy | 2 | 5 | 5 | 3 |
| 생활경제 relevance | 2 | 3 | 5 | 3 |
| 경제번역소 brand fit | 3 | 3 | 5 | 5 |
| silhouette uniqueness | 3 | 4 | 4 | 3 |
| emotional expression range | 3 | 5 | 4 | 3 |
| pose/action range | 3 | 5 | 4 | 3 |
| hand/prop acting potential | 2 | 5 | 4 | 4 |
| 9:16 Shorts readability | 3 | 5 | 4 | 3 |
| concept-to-Blender fidelity potential | 3 | 4 | 2 | 3 |
| concept-to-2D/2.5D fidelity potential | 3 | 4 | 5 | 4 |
| concept-to-Hybrid fidelity potential | 3 | 5 | 4 | 4 |
| Blender rig complexity | 4 | 3 | 2 | 4 |
| 2D rig complexity | 4 | 3 | 4 | 4 |
| material/lookdev risk | 2 | 3 | 4 | 2 |
| animation risk | 3 | 3 | 3 | 3 |
| perspective/3Q risk | 4 | 4 | 2 | 4 |
| future scene scalability | 3 | 4 | 4 | 4 |
| non-finance economic-topic scalability | 2 | 3 | 5 | 5 |
| recurring brand potential | 3 | 4 | 5 | 4 |
| production maintenance cost | 4 | 3 | 3 | 4 |
| overall risk | 2 | 3 | 3 | 2 |

## 필수 정량 지표 (0–100, HYPOTHESIS_ONLY)

| 후보 | STATIC_CONCEPT_SCORE | IMPLEMENTATION_RISK_SCORE* | EXPECTED_FIDELITY_SCORE | PERFORMANCE_POTENTIAL_SCORE | BRAND_SCORE | 관찰 메모 |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| BASELINE_OWNER_ORIGINAL_A | 57 | 58 | 55 | 52 | 54 | 구현 편의가 경제 정체성·생동감 부족을 상쇄하지 못할 수 있다. |
| CANDIDATE_COIN | 76 | 54 | 76 | 87 | 70 | 강한 무음 실루엣과 포즈가 장점이나, 역할 소품이 약하면 범용 코인이 된다. |
| CANDIDATE_STATEMENT | 78 | 62 | 79 | 76 | 89 | 생활경제와 번역 역할이 강점이며, 3/4·종이 재질이 주요 검증점이다. |
| CANDIDATE_DECODER | 67 | 66 | 68 | 62 | 78 | 명시적 브랜드 역할은 강하지만 기기·토이 인상을 제거해야 한다. |

\* `IMPLEMENTATION_RISK_SCORE`는 높을수록 위험이 크다. 다른 점수는 높을수록 유리하다.

## 후보별 구현 리스크

| 후보 | 실제 구현에서 확인할 위험 | 공정한 반증 proof |
| --- | --- | --- |
| CANDIDATE_COIN | 금속 질감이 과한 3D 장난감이 되거나, 원형 몸체가 표정·팔과 충돌할 수 있다. | 3/4 explain에서 눈·팔·소품이 겹치지 않고, 평면 그래픽 없이도 돈 캐릭터로 읽히는지 확인한다. |
| CANDIDATE_STATEMENT | 말림과 찢어진 하단이 3/4에서 몸체를 불안정하게 만들고, 세부 글자가 노이즈가 될 수 있다. | 9:16 축소 정지 proof에서 영수증임과 표정이 동시에 읽히고, 가짜 글자를 제거해도 정체성이 남는지 본다. |
| CANDIDATE_DECODER | 모서리·화면·버튼이 device mascot 인상을 회복시키고, UI가 표정과 경쟁할 수 있다. | 화면 UI와 배경을 제거한 뒤에도 ‘경제를 풀어 주는 캐릭터’로 읽히는지, 상체 변형으로 연기가 가능한지 본다. |
| BASELINE_OWNER_ORIGINAL_A | 기존 기술 구현의 매끈한 form이 목표 스타일과 충돌할 수 있다. | 같은 조명·프레이밍·포즈에서 신규 후보 대비 경제성·생동감이 낮은지 비교 기준으로만 쓴다. |

## CURRENT_RANKING

`HYPOTHESIS_ONLY`: STATEMENT와 COIN이 서로 다른 강점으로 선두 가설이며, DECODER와 BASELINE은 proof로 반증 또는 재평가 대상이다. 이 표는 최종 우승 선언이 아니다.
