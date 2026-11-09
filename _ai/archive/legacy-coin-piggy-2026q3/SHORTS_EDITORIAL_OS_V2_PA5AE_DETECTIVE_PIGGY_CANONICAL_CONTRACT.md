# PA-5AE — Detective Piggy Canonical Character Contract

Updated: 2026-09-15 KST
Status: `PA5AE_PASS_AWAITING_CONTROL_TOWER_HARD_LOCK_DECISION` — 8-Scene continuity proof 및 session reentry proof(hard gate) 모두 PASS. `FINAL_CHARACTER_HARD_LOCK` 선언은 Control Tower의 별도 판정 사항.
Slice: `PA-5AE — DETECTIVE PIGGY 2D PRODUCTION CANONICALIZATION + 8-SCENE CONTINUITY PROOF`
Source of Truth: `_ai/SHORTS_EDITORIAL_OS_V2_CHARACTER_CANDIDATE_DETECTIVE_PIGGY_V1.md` (Control Tower 결정 전문 및 canonical IDENTITY 프롬프트 원본)

## 1. Character Identity (불변 요소)

이 캐릭터를 사용하는 모든 장면 생성은 아래 요소를 고정해야 한다. 아래 표는 `assets/editorial-v2/character/candidates/detective-piggy-v1/` 11장(액션 4 + 시트 4 + 배경 3)의 육안 교차 검증으로 확정한 값이다.

| 요소 | Canonical 값 | 검증 근거 |
| --- | --- | --- |
| 종 / 컨셉 | 돼지저금통 탐정 (piggy bank detective) | 전체 11장 |
| 비율 | 치비 2~3등신, 머리가 몸보다 큼 | `sheet-01`~`sheet-04` |
| 피부색 | 연한 분홍색 | 전체 11장 |
| 눈 | 아주 크고 동그란 눈, 큰 검은 눈동자 + 하이라이트 1~2개 | 전체 11장 |
| 코 | 작고 동그란 분홍 코 (콧구멍 2개) | 전체 11장 |
| 귀 | 쫑긋한 삼각형에 가까운 돼지 귀 | 전체 11장 |
| 볼터치 | 발그레한 분홍 원형 볼터치 | 전체 11장 |
| 모자 | 갈색 중절모(페도라), 어두운 갈색 밴드 | 전체 11장 |
| 상의 | 하얀 반팔 셔츠 + 갈색 체크무늬 조끼(베스트) | 전체 11장 (단, `scene-02`에서 조끼 색조가 살짝 짙은 갈색으로 편차 — 아래 리스크 참조) |
| 넥타이 | 빨간 나비넥타이 | 전체 11장 |
| 하의 | 짧은 갈색 반바지 | 전체 11장 |
| 손 | 하얀 만화풍 장갑 | 전체 11장 |
| 신발 | 작고 둥근 갈색 구두 | 전체 11장 |
| 꼬리 | 돌돌 말린 분홍 꼬리, 엉덩이 쪽에서 보임 | 전체 11장 |
| 등 특징 | 등 위쪽 동전 투입구 슬롯 | 전체 11장 |
| 외곽선 | 굵은 검정 외곽선 | 전체 11장 |
| 셰이딩 | 단순 셀셰이딩 평면 채색 (그라데이션 최소) | 전체 11장 |
| 렌더링 스타일 | 2D 플랫 벡터 일러스트, 어린이 그림책 톤 | 전체 11장 |

## 2. Forbidden Drift (금지되는 이탈)

- 3D 렌더링, 사진풍, 실사 스타일로의 전환
- 긴 코트 재도입 (v1/v2에서 폐기된 요소 — Owner가 명시적으로 "답답하다"고 거부함)
- 조끼를 다른 색/패턴으로 교체 (체크무늬는 고정)
- 나비넥타이 생략 또는 다른 넥타이 형태로 교체
- 등 투입구 슬롯 생략 (돼지저금통 정체성의 핵심 표식)
- 비율을 성인형(4~5등신)으로 되돌리는 것

## 3. Variable Elements (장면마다 변경 허용)

포즈, 표정, 손에 든 소품(돋보기/수첩/펜 등), 배경, 구도(정면/측면/3쿼터), 조명 톤.

## 4. Canonical Prompt Blocks

원본은 `_ai/SHORTS_EDITORIAL_OS_V2_CHARACTER_CANDIDATE_DETECTIVE_PIGGY_V1.md` §"Canonical IDENTITY 프롬프트"에 고정되어 있다. 이 문서는 그 문구를 재인용하지 않고 참조만 한다 — 문구는 단일 source of truth에서만 관리한다.

## 5. Economic Translation Layer (Control Tower 결정 반영)

- Coin이 들고 있던 물리적 "Translation Pad" 소품은 승계하지 않는다.
- 대신 `Economic Translation Layer`는 renderer-generated deterministic UI/overlay로 구현한다 — 캐릭터가 손에 드는 물체가 아니라, 이미지 위에 별도로 합성되는 레이어.
- 한국어·숫자·경제정보는 AI 이미지 생성 결과 안에 절대 baked-in하지 않는다. 이번 8-Scene 증명의 장면 H(화이트보드)에서도 보드는 빈 채로 생성하고, 실제 숫자는 별도 합성 대상으로 남긴다.

## 6. Scene Canonical Order Record

- `SCENE03`: 이월과 수수료의 의미 확인
- `SCENE04`: numeric worked example — 100만 원 × 20% = 20만 원, 100만 원 − 20만 원 = 80만 원
- `SCENE_ORDER_AUTHORITY`: `PERSISTED REVISION 6` (canonical)
- `PA-5V-R6`의 상충하는 forward notation: `READ_ONLY HISTORICAL REFERENCE` (충돌 시 무효)
- Scene03/04 numbering 재논의 금지 (Control Tower 최종 결정)

## 7. CANDIDATE_COIN Status Transition Record

- 이전: `SELECTED / ACTIVE_PRODUCTION_CHARACTER` (PA-5AB)
- 현재: `HISTORICAL_PRODUCTION_BASELINE`
- 보존 대상 (삭제·재작성 금지): Blender 자산(`01_blender/` 등), 렌더 영상, 비교 evidence, Scene evidence, 기존 guardrail 문서
- Coin 관련 구현 작업은 이 Slice에서 수행하지 않음 — 상태 표기 전환만 수행

## 8. Production Adapter Contract (골격, 이 Slice 범위)

8-Scene continuity proof PASS 후 후속 파이프라인이 사용할 예정인 최소 골격. 이번 Slice에서는 overlay/audio/ffmpeg 단계까지 구현하지 않는다.

```
Scene Spec (대본 기반 장면 설명)
  ↓
Character Canonical Contract (본 문서 §1~§3)
  ↓
Scene Image Prompt Assembly
  - IDENTITY_FOR_PROMPT (또는 SAME_CHARACTER_RULE) + 장면별 clause
  - 배경 있는 장면: "배경은 장면마다 달라도 되지만 옷차림/소품은 온전히 보여야 한다" 규칙 포함
  ↓
2D Scene Asset (PNG, 9:16)
  ↓
Validation Manifest
  - 캐릭터 정체성 체크리스트(§1 요소별 PASS/FAIL)
  - 배경 요소가 정체성을 침범하지 않았는지 확인
```

### Input fields (Scene Spec)

- `sceneId`, `sceneRole`(예: hook/전개/설명/결론), `pose`(자유 서술), `expression`, `prop`(optional), `background`(optional), `composition`(front/side/3-quarter)

### Output naming

`{sceneId}_{shortDescriptor}.png` — 이번 8-Scene 증명에서 사용한 `pa5ae_{A..H}_{descriptor}.png` 패턴을 그대로 승계

### Validation fields

`identityChecklist`(§1의 16개 요소 각각 PASS/FAIL), `forbiddenDriftDetected`(boolean + 내역), `backgroundIntegrity`(캐릭터 요소가 배경에 가려졌는지)

## 9. 증명 결과

### 9.1 8-Scene Character Continuity Proof — PASS

8장(A~H) 전부 생성 완료. 자산: `assets/editorial-v2/character/candidates/detective-piggy-v1/pa5ae-8scene-proof/`

| 장면 | 설명 | 정체성 유지 | 특이사항 |
| --- | --- | --- | --- |
| A | 중립 설명, 단순 배경 | PASS | — |
| B | 놀람/발견, 단순 배경 | PASS | — |
| C | 자신감 있는 답변, 단순 배경 | PASS | — |
| D | 우려/경고, 단순 배경 | PASS | — |
| E | 집 환경(소파/창문) | PASS | 배경 소품(수첩)이 캐릭터 정체성 침범하지 않음 |
| F | 카페/상점 환경 | PASS | 영수증/가격표 텍스트는 renderer 검증 대상 아님(장식용) |
| G | 은행/ATM 환경 | PASS | ATM 화면 UI가 캐릭터를 가리지 않음 |
| H | 숫자/설명 환경(화이트보드) | PASS | **화이트보드가 의도대로 빈 채로 생성됨 — Economic Translation Layer 원칙(숫자 baked-in 금지) 확인** |

`forbiddenDriftDetected`: false (전체 8장 중 3D/사진풍 전환, 코트 재도입, 조끼 색/패턴 변경, 나비넥타이 생략, 등 투입구 생략, 성인형 비율 전환 — 전부 미발생)

### 9.2 Session Reentry Proof (Hard Gate) — PASS

완전히 새로운 ChatGPT 대화(이전 세션과 연결 없음)에서, `_ai/SHORTS_EDITORIAL_OS_V2_CHARACTER_CANDIDATE_DETECTIVE_PIGGY_V1.md`에 저장된 canonical IDENTITY 프롬프트 텍스트만으로 4포즈(돋보기/놀람/메모/결론)를 재생성. 자산: `assets/editorial-v2/character/candidates/detective-piggy-v1/pa5ae-session-reentry-proof/`

- 모자 형태, 조끼 체크무늬, 나비넥타이, 꼬리, 등 투입구, 치비 비율 — 원본 세션 산출물과 육안 대조 결과 전부 일치
- 배경색(노란색)이 원본과 다르게 나온 것은 IDENTITY 프롬프트가 "단순 배경 또는 연한 색"만 지정하고 정확한 색을 고정하지 않았기 때문 — 캐릭터 정체성 자체의 이탈이 아니므로 hard gate 통과 판정에 영향 없음
- **결론: 새 세션에서도 canonical contract만으로 인식 가능한 동일 캐릭터 재현 확인됨**

### 9.3 반환 형식 (Control Tower 요구 포맷)

```
CHARACTER_TRANSITION: PASS
8_SCENE_CONTINUITY: PASS
SESSION_REENTRY: PASS
SCENE03_04_CANONICALIZATION: PASS
PRODUCTION_ADAPTER_READINESS: READY
ROUTING_DECISION: AWAITING_CONTROL_TOWER_GATE
```

### 9.4 알려진 비차단 관찰 사항

- 배경이 있는 장면에서 조끼 색조가 미세하게 짙어지는 경향이 간헐적으로 관찰됨(패턴 자체는 항상 유지). Production Adapter에서 필요 시 프롬프트에 `vest color must stay medium warm brown checkered` 같은 고정 문구 추가를 고려할 수 있음 — 이번 PASS 판정을 뒤집는 수준은 아님.
- 배경 지정 시 정확한 배경색까지는 고정되지 않음(세션마다 달라질 수 있음) — 실제 프로덕션에서는 Scene Spec에 배경색/톤을 명시하는 것을 권장.
