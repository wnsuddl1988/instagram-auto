# PA-5Y Character Selection Sprint Plan

## 범위

이 문서는 다음 Slice에서 실행할 **캐릭터 테스트용 proof**의 공정한 선정 구조를 정의한다. 이 계획은 본편 제작 계획이 아니며, 현재 Slice에서는 이미지 생성·모델·rig·render를 만들지 않는다.

## Stage 0 — 공통 입력 잠금

세 후보 모두 다음을 준비한 뒤에만 Stage 1로 간다.

| 입력물 | 목적 | 통과 기준 |
| --- | --- | --- |
| identity sheet | 비율·팔레트·signature prop·금지 drift 고정 | front/3Q에서 같은 캐릭터로 읽힌다. |
| face sheet | neutral, pleased, concern, surprise, explain, understand | 눈·입만 바꿔도 후보별 정체성이 유지된다. |
| pose sheet | neutral stand, explain/point, discovery, track/inspect, listen/think | 손·시선·몸 기울기의 의도가 자막 없이 읽힌다. |
| small-size sheet | 9:16 프레임 내 인물 크기 규칙 | 축소 후에도 얼굴·실루엣·경제 단서가 남는다. |
| pipeline style sheet | line, shadow, material, depth, graphic rules | pure 3D toy look 또는 정보 과밀을 방지한다. |

**공정성 조건:** 같은 세로 프레임, 같은 중성 조명/배경, 같은 카메라 거리, 같은 성능 intent를 사용한다. 후보별 최적 pipeline은 허용하되, 연출 난도를 다르게 부풀리지 않는다.

## Stage 1 — STATIC FIDELITY

모든 후보가 동등하게 참여한다. 이 단계에서 concept art만으로 탈락시키지 않는다.

| proof | 의도 | 반드시 볼 항목 | 성공 기준 | 실패 기준 |
| --- | --- | --- | --- | --- |
| A. `FRONT_NEUTRAL` | 정체성과 실루엣 확인 | face fidelity, 비율, 경제 단서, 9:16 축소 | 배경·자막 없이 후보와 역할이 읽힌다. | 얼굴/몸체가 UI·장난감·일반 아이콘으로만 읽힌다. |
| B. `THREE_QUARTER_EXPLAIN` | 3/4와 설명 연기 확인 | silhouette, 손/prop, perspective, look | 표정·손·소품이 충돌하지 않고 설명 동작이 읽힌다. | 정면 외 각도에서 얼굴·몸체·소품이 붕괴한다. |
| C. `SURPRISE_OR_DISCOVERY` | 감정 변화 확인 | 눈썹, 눈, 입, 상체 반응 | 발견/놀람이 무음·무배경으로 명확하다. | 표정 교체가 얼굴 정체성을 잃거나 배경 효과가 필요하다. |

**Stage 1 기록:** 후보마다 `STATIC_CONCEPT_SCORE`, `EXPECTED_FIDELITY_SCORE`, `IMPLEMENTATION_RISK_SCORE`와 실패 원인을 같은 템플릿에 남긴다.

## Stage 2 — PERFORMANCE PROOF

Stage 1에서 viable인 모든 후보가 같은 세 intent를 수행한다. 배경은 neutral/minimal이며, 경제 내용·대사·본편 맥락을 추가하지 않는다.

| proof | 성능 intent | 목표 | 성공 기준 | 실패 기준 |
| --- | --- | --- | --- | --- |
| A. `DISCOVERY_SURPRISE` | 발견/놀람 | “새 정보에 반응”하는 전신 리듬 | 감정이 1초 내 읽히고 얼굴·몸체가 함께 반응한다. | 효과음·배경·자막을 빼면 감정이 사라진다. |
| B. `EXPLANATION_POINT` | 설명/지시 | 시선-손-소품의 관계 | 무엇을 가리키는지와 친절한 안내자 역할이 보인다. | 손이 장식이거나 prop가 캐릭터보다 먼저 읽힌다. |
| C. `TRACK_UNDERSTAND` | 추적/이해 | 관찰→이해의 전환 | 시선 이동과 표정 변화만으로 이해 순간이 전달된다. | 얼굴이 고정되거나 몸체가 연기에 참여하지 않는다. |

**Performance success:** 감정과 행동이 narration·환경 없이 이해된다. 이 단계는 후보의 `PERFORMANCE_POTENTIAL_SCORE`를 실제 evidence로 갱신한다.

## Stage 3 — TOP TWO PIPELINE SHOOTOUT

Stage 1/2 종료 후 100점 모델과 hard fail을 적용해 상위 둘을 고른다. 두 후보에 **각자 최적인 pipeline**을 적용하며, 모두 같은 길이·세로 비율·중성 배경의 하나의 짧은 motion proof를 만든다.

| 비교 항목 | 동일 조건 | 판정 질문 |
| --- | --- | --- |
| concept ↔ actual fidelity | identity sheet 대비 | 구현물이 concept의 실루엣·표정·재질 매력을 지켰는가? |
| vitality | 같은 성능 intent | 정지 그림의 포즈가 아니라 살아 있는 반응으로 보이는가? |
| readability | 같은 9:16 크기 | 작은 화면에서도 얼굴·행동·경제 단서가 읽히는가? |
| stability | 동일한 반복 조건 | 각도·표정·손·소품에서 style drift가 없는가? |
| repeatability | 동일한 제작 예산 가정 | 다음 proof를 반복해도 비용·난도가 감당 가능한가? |

## Stage 4 — FINAL SELECTION

최종 선택은 concept 이미지가 아니라 Stage 1–3의 실제 proof에서 한다. 아래 100점 모델을 사용한다.

| 항목 | 점수 | 이유 |
| --- | ---: | --- |
| concept-to-production fidelity | 22 | 구현 후 매력 손실을 직접 막는 최고 우선 기준이다. |
| character vitality | 20 | 경제번역소의 주인공이 정지 아이콘이 아니라 살아 있는 안내자여야 한다. |
| economic immediacy | 12 | 자막 없이도 경제 캐릭터여야 한다. |
| brand identity | 10 | 생활경제를 해석하는 경제번역소의 역할과 연결돼야 한다. |
| Shorts readability | 9 | 9:16 small-size에서 빨리 읽혀야 한다. |
| motion/acting range | 8 | 설명·놀람·이해를 반복적으로 연기해야 한다. |
| production repeatability | 6 | 지속 제작이 가능한 파츠·작업량이어야 한다. |
| pipeline stability | 5 | 각도·표정·재질의 출력 품질이 안정적이어야 한다. |
| future scalability | 5 | 소비·가격·고지·금융 등 주제를 넘나들 수 있어야 한다. |
| maintenance cost | 3 | 장기 운영의 수선 비용을 반영한다. |

### Hard-fail conditions

아래 중 하나라도 실제 proof에서 확인되면, 총점과 무관하게 final winner가 될 수 없다.

1. concept art는 좋지만 실제 구현에서 실루엣·표정·재질 매력이 눈에 띄게 하락한다.
2. 정면은 통과하나 3/4에서 얼굴·몸체·소품 또는 정체성이 붕괴한다.
3. expression system이 후보의 고유성을 보존하지 못한다.
4. 배경·자막·복잡한 효과를 제거하면 살아 있는 캐릭터로 보이지 않는다.
5. rig/파츠가 실루엣을 망가뜨리거나 반복 모션을 불안정하게 만든다.
6. 경제 정체성이 captions 또는 외부 그래프가 있을 때만 성립한다.
7. 한 편 이상의 반복 제작 비용·수정 난도가 운영 불가능 수준이다.

## 최종 고르는 방법

1. Stage 1의 동일 proof 세트를 나란히 놓고 score와 fail을 기록한다.
2. Stage 2에서 무음 상태로 별도 평가해 vitality score를 다시 매긴다.
3. hard fail 없는 상위 둘만 Stage 3로 보낸다.
4. Stage 3의 실제 motion output에 100점 모델을 적용한다.
5. `concept-to-production fidelity + character vitality` 42점에서 우세하고 hard fail이 없는 단 하나를 최종 후보로 추천한다.
6. 동점 또는 상충 증거가 있으면 우승 선언을 미루고, 실패한 축만 보완하는 추가 proof의 exact scope를 별도 승인받는다.

현재 잠정 순위는 `HYPOTHESIS_ONLY`다. Stage 1 implementation은 별도 Slice 승인 없이는 시작하지 않는다.
