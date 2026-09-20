# Shorts Editorial OS V2 — Character Candidate: Detective Piggy V1

Updated: 2026-09-15 KST
Status: `CONTROL_TOWER_APPROVED_CHARACTER_SWITCH_PENDING_PA5AE_HARD_LOCK` — Control Tower가 캐릭터 방향 전환을 승인했다(YES). `detective-piggy-v1`은 `ACTIVE_CHARACTER_DIRECTION`이며 `NEXT_PRODUCTION_TARGET`이다. 단, `FINAL_CHARACTER_HARD_LOCK`은 PA-5AE(8-Scene continuity proof + session reentry proof) 통과 전까지 보류한다. `CANDIDATE_COIN`은 `HISTORICAL_PRODUCTION_BASELINE`으로 전환되며 기존 산출물·evidence는 보존, 삭제·재작성하지 않는다.

## Control Tower 결정 전문 (2026-09-15)

- `CHARACTER_SWITCH`: YES
- `ACTIVE_CHARACTER_DIRECTION`: `detective-piggy-v1`
- `CANDIDATE_COIN`: `HISTORICAL_PRODUCTION_BASELINE` (삭제·재작성 금지)
- `DETECTIVE_PIGGY_FINAL_HARD_LOCK`: `PENDING PA-5AE`
- `EDITORIAL / NARRATIVE CONTRACT`: `INHERIT` — narrative structure, source/evidence provenance, scene별 핵심 메시지, narration/caption 의미, typography/deterministic overlay grammar, source 표시 문법, 숫자 표현 규칙, safe area, 정보 hierarchy, character-led storytelling 원칙, scene transition의 의미적 연결, economic translation 제품 개념
- `COIN / 3D IMPLEMENTATION CONTRACT`: `DO NOT INHERIT` — Blender rig, Coin body geometry, mouth/gaze/blink rig, body tilt animation rig, hand rig, Blender action library, 240F/180F 검증 가정, 3D/2.5D 파이프라인
- `ECONOMIC_TRANSLATION_PAD`: `INHERIT SEMANTIC FUNCTION` (renderer-generated deterministic UI/overlay로) / `DO NOT INHERIT COIN-SPECIFIC PHYSICAL PROP` (돼지 캐릭터가 태블릿을 들 필요 없음). 한국어·숫자·경제정보를 AI 이미지 생성 결과 안에 baked-in하지 않는 원칙 유지 — renderer-generated 텍스트만 사용.
- `SCENE03`: 이월과 수수료의 의미 확인 / `SCENE04`: numeric worked example (100만 원 × 20% = 20만 원, 100만 원 − 20만 원 = 80만 원)
- `SCENE_ORDER_AUTHORITY`: `PERSISTED REVISION 6` (canonical). PA-5V-R6의 상충하는 forward notation은 `READ_ONLY HISTORICAL REFERENCE`로 격하. Scene03/04 numbering 재논의 금지.
- `NEXT_SLICE`: `PA-5AE — DETECTIVE PIGGY 2D PRODUCTION CANONICALIZATION + 8-SCENE CONTINUITY PROOF` (아래 "PA-5AE Exact Scope" 참조)
- `COMMIT / PUSH / DEPLOY / PUBLISH`: `NOT AUTHORIZED`

## PA-5AE Exact Scope (Control Tower 발급)

**Slice ID**: `PA-5AE — DETECTIVE PIGGY 2D PRODUCTION CANONICALIZATION + 8-SCENE CONTINUITY PROOF`

**Objective**: `detective-piggy-v1`을 Shorts Editorial OS V2의 실제 production character로 쓸 수 있는지 8-Scene production 조건에서 검증하고, PASS 시 후속 자동 생성/영상 조립 파이프라인이 사용할 canonical character contract를 확정한다.

### IN SCOPE

1. **Canonical Character Contract 확정** — source: 이 문서 + `assets/editorial-v2/character/candidates/detective-piggy-v1/`. Canonicalize 대상: head/body 비율, 피부색, 눈 크기/홍채 스타일, 코, 귀, 탐정모자, 흰 셔츠, 조끼, 나비넥타이, 반바지, 장갑, 신발, 외곽선 두께, flat 2D 렌더링 스타일, 셰이딩 문법, 금지되는 3D/사진풍 drift.
2. **Coin 상태 전환** — `CANDIDATE_COIN`: ACTIVE → `HISTORICAL_PRODUCTION_BASELINE`. Blender 자산·영상·비교 evidence·Scene evidence·기존 guardrail 삭제 금지. Coin 구현 작업 없음.
3. **Scene 계약 정규화** — Scene03=이월과 수수료의 의미 확인, Scene04=numeric worked example. Persisted revision 6이 승리. PA-5V-R6의 상충 notation은 READ_ONLY/SUPERSEDED.
4. **8-Scene 이미지 연속성 증명** — 하나의 일관된 8-Scene 시퀀스 생성. 장면마다 의도적으로 포즈/표정/소품/배경/구도를 다르게 하되 캐릭터 정체성·의상·핵심 비율·눈 디자인·모자 디자인·팔레트·외곽선/스타일·장갑/신발 정체성은 변하면 안 됨. 난이도를 일부러 다양화: (A) 중립 설명 (B) 놀람/발견 (C) 자신감 있는 답변 (D) 우려/경고 (E) 집 환경 (F) 카페/상점 환경 (G) 은행/ATM 환경 (H) 숫자/설명 환경.
5. **세션 재진입 증명** — 최소 1회는 새/재시작된 생성 컨텍스트(새 ChatGPT 대화)에서, 보존된 canonical contract/참조 메커니즘만으로 생성을 수행. 목표: 새 세션에서도 인식 가능한 동일 캐릭터인지 확인. **이 항목이 이번 Slice의 hard gate.**
6. **자동화는 최소 골격까지만 허용**: `Scene Spec → Character Canonical Contract → Scene Image Prompt Assembly → 2D Scene Asset → Validation Manifest`. 8장 PASS 후에만 `2D Scene Asset → deterministic text/number overlay → audio → caption → ffmpeg assembly`로 진행 — 이번 Slice에서는 여기까지 가지 않음.

### 산출물

`DETECTIVE_PIGGY_CANONICAL_CONTRACT`, `8_SCENE_CHARACTER_CONTINUITY_SET`, `8_SCENE_CONTACT_SHEET`, `SESSION_REENTRY_PROOF`, `CHARACTER_CONSISTENCY_EVALUATION.json`, `SCENE_CANONICAL_ORDER_RECORD`(Scene03/04), `PRODUCTION_ADAPTER_CONTRACT`(input fields, prompt assembly rules, reference rules, output naming, validation fields).

### 반환 형식

```
CHARACTER_TRANSITION: PASS / NEEDS_FIX / BLOCKED
8_SCENE_CONTINUITY: PASS / NEEDS_FIX / BLOCKED
SESSION_REENTRY: PASS / NEEDS_FIX / BLOCKED
SCENE03_04_CANONICALIZATION: PASS / BLOCKED
PRODUCTION_ADAPTER_READINESS: READY / NOT_READY
ROUTING_DECISION: AWAITING_CONTROL_TOWER_GATE
```

### 명시적 금지사항

전체 프로덕션 에피소드, ElevenLabs 호출, TTS 생성, 최종 영상 조립, Coin 수정, Blender 캐릭터 작업, 새 캐릭터 탐색, narration 재작성, claim/evidence 재작성, Scene03/04 semantic 재정렬, commit, push, deploy, publish, external write — 전부 금지.

## 배경

- Owner가 기존 Coin 캐릭터(Blender 3D, PA-5AB 확정)의 결과물이 부자연스럽다고 직접 지적.
- 벤치마킹 대상(Instagram `moneyhunter_kr`) 3개 릴스를 프레임 단위로 실측한 결과, 3D 리깅이 아니라 **2D 일러스트 정지 이미지를 장면마다 교체**하는 방식임을 확인. 생동감의 실제 출처는 포즈 교체 + 빠른 컷 전환 + 카메라 무빙 + 자막이며, 리깅은 사용되지 않음.
- 따라서 "생동감 확보를 위해 3D 리깅이 필요하다"는 기존 기술 전제가 틀렸다고 판단, ChatGPT 이미지 생성 기반 2D 방식으로 캐릭터 일관성을 실증했다.

## 캐릭터 선정 과정

1. 후보 5종(고양이/저금통/계산기/계산기 로봇/부엉이) 중 3종(고양이/계산기 로봇/돼지저금통 탐정)을 실제 생성.
2. Owner 피드백: 앞선 두 후보는 "확 와닿지 않음". 탐정 컨셉(역할이 있는 캐릭터, 정지 이미지만으로 스토리가 성립)을 신규 제안 후 채택.
3. Owner 피드백 반영 2회전:
   - v1(코트, 4~5등신) → "몸통이 다 보여서 불편" → v2(코트 여밈 + 치비 비율)
   - v2 → "코트가 답답해 보임" → v3(조끼 + 나비넥타이)으로 최종 확정
4. **최종 확정: `vest`(조끼) 버전.**

## 확정 캐릭터 사양

- **컨셉**: 돼지저금통 탐정. 재테크 콘텐츠의 본질(숨은 비용 추적·손해 파헤치기)과 탐정 행위가 맞물려, 정지 이미지 4장만으로 훅→전개→설명→결론의 스토리가 성립함.
- **표절 회피**: 벤치마킹 대상은 "지폐 사냥꾼(서부/총)" 컨셉. 이 캐릭터는 "저금통 탐정(추리/돋보기)"으로 발상만 참고하고 캐릭터 자체는 겹치지 않음.
- **외형**: 치비(2~3등신) 비율, 연한 분홍 돼지 얼굴, 큰 반짝이는 눈, 갈색 체크무늬 조끼 + 하얀 셔츠 + 빨간 나비넥타이, 짧은 갈색 반바지, 갈색 중절모, 하얀 장갑, 갈색 구두, 등 뒤 동전 투입구, 돌돌 말린 분홍 꼬리.
- **스타일**: 2D 플랫 일러스트, 굵은 검정 외곽선, 셀셰이딩 평면 채색. 3D/사진풍/실사 명시적 금지.

## Canonical IDENTITY 프롬프트 (버전 고정, 임의 수정 금지)

이후 모든 장면 생성은 아래 문구를 정확히 재사용해야 한다. 문구를 바꾸면 캐릭터 정체성이 흔들릴 수 있음이 이번 탐색에서 확인됨(예: 배경 장면에서 조끼 색조가 살짝 치우친 사례).

```
아주 귀여운 돼지저금통 탐정 마스코트 캐릭터를 2D 플랫 일러스트로 만들어줘. 치비(chibi) 스타일의
2~3등신 비율: 머리가 몸보다 크고, 몸은 작고 동글동글해. 연한 분홍색 돼지 얼굴, 아주 크고 반짝이는
동그란 눈(큰 검은 눈동자에 하이라이트), 작고 동그란 분홍 코, 쫑긋한 귀, 발그레한 볼터치. 옷차림:
하얀 반팔 셔츠 위에 갈색 체크무늬 조끼(베스트)를 입고 작은 나비넥타이를 맸어. 조끼는 짧아서 답답해
보이지 않고 가볍고 산뜻한 느낌. 아래는 짧은 갈색 반바지. 긴 코트는 입지 않아. 머리에는 갈색
중절모(페도라)를 쓰고, 짧고 통통한 팔에 하얀 만화풍 장갑 손, 작고 둥근 갈색 구두. 엉덩이 쪽에
돌돌 말린 분홍 꼬리가 보이고, 등 위쪽에 동전 투입구 슬롯이 살짝 보여. 사랑스럽고 순한 표정. 굵은
검정 외곽선, 단순한 셀셰이딩 평면 채색, 어린이 그림책 같은 밝고 선명한 벡터 일러스트 스타일. 3D
렌더링 금지, 사진풍 금지, 실사 금지. 세로 9:16 구도, 전신이 화면 중앙에 보이게. 배경은 아주
단순한 단색 또는 연한 색으로.
```

### 후속 장면(같은 캐릭터 유지) 지시문

```
앞에서 만든 그 캐릭터와 완전히 똑같은 캐릭터로, 외형(모자 모양, 옷과 옷을 여민 상태, 머리와 몸의
비율, 눈 크기와 색, 색조, 외곽선 두께, 장갑과 신발)을 하나도 바꾸지 말고 유지해줘. 3D 금지, 실사
금지, 같은 2D 플랫 일러스트 스타일 유지. 세로 9:16, 전신, 단순한 배경. 바꿀 것은 오직 포즈와
표정, 그리고 들고 있는 소품뿐이야.
```

배경이 있는 실장면일 때는 마지막 문장 뒤에 다음을 추가:

```
배경은 앞 장면과 달라도 되지만, 캐릭터의 옷차림과 소품은 배경에 가려지거나 바뀌지 않고 그대로
온전히 보여야 해.
```

## 검증 완료 항목

| 항목 | 결과 | 근거 자산 |
| --- | --- | --- |
| 액션 포즈 4종 일관성 (감정 표현) | PASS | `pose-01` ~ `pose-04` |
| 각도 일관성 (정면/측면/3쿼터) | PASS | `sheet-01` ~ `sheet-04` |
| 배경 포함 실장면 일관성 | PASS (경미한 색조 편차 1건) | `scene-01` ~ `scene-03` |

11장 전부 `assets/editorial-v2/character/candidates/detective-piggy-v1/`에 보존.

## 알려진 리스크 / 미검증 항목

- 배경 장면 중 1건에서 조끼 색조가 살짝 갈색 톤으로 치우침 (패턴 자체는 유지). 실사용 시 프롬프트에 색상 고정 문구(`vest color must stay medium warm brown checkered`) 추가 검토 필요.
- 세션이 바뀌면(새 ChatGPT 대화) 일관성이 재현되는지는 미검증 — 지금까지는 전부 단일 대화 내 연속 생성으로만 확인함.
- 이 캐릭터로 실제 8-Scene 분량을 생성했을 때도 동일 수준의 일관성이 유지되는지 미검증(현재 최대 3장 연속까지만 확인).

## 사용한 생성 도구

- `scripts/probe-character-consistency-chatgpt-v1.mjs` — ChatGPT 웹(Playwright/CDP) 기반, 단일 대화 연속 생성 방식. `--character vest`, `--full-poses`, `--character-sheet`, `--scene-background` 모드 지원.
- 실행 전 `ALLOW_CHATGPT_IMAGE=1` fail-closed guard 필요. 산출물은 항상 repo 밖에 먼저 저장 후 검증하여 이번 문서 작성 시 수동으로 `assets/`에 편입.

## Control Tower 결정 필요 사항

1. PA-5AB(Coin) 캐릭터 확정을 historical로 전환하고 이 캐릭터로 교체할지 여부.
2. 교체 승인 시, 기존 PA-5 계열 Scene 계약(내러티브·자막 문법)을 어디까지 승계할지.
3. Scene 03/04 순서 충돌(PA-5U persisted revision 6 vs PA-5V-R6 forward notation)을 이번 기회에 함께 정정할지.
