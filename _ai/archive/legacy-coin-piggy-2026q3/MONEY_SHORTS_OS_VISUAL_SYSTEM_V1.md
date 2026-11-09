# Money Shorts OS — Visual System V1

> Status: **calibration draft** (Scene 1/2 anchor 승인 유지 · Rule Contract v1 반영)
> Owner-approved default Visual Profile: **프리미엄 에디토리얼 생활경제 실사풍 + 고정 금융 그래픽 레이어**
> Visual Matrix 규칙 계약: `scripts/fixtures/premium-editorial-visual-system.rule-contract.v1.json` (§5-A)
> 승인 anchor: Scene 1 fixed (`scene-01-hook-anchor-fix-v1.png`) + Scene 2 v2 (`scene-02-signal-anchor-v2.png`) — 유지/삭제 금지
> ⚠️ Visual Matrix는 **고정 오브젝트표가 아니라 규칙 시스템(Rule Contract)** 이다. 최근 Scene 3~6 v1 수렴 실패는 **메인 기준으로 사용하지 않는다.**

---

## 1. Purpose

이 문서는 **반복형 금융·경제 쇼츠 자동화 OS의 기본 비주얼 source of truth**다.

- Money Shorts OS는 매 에피소드마다 새 비주얼 방향을 정하는 도구가 아니라, **최초 승인된 Visual Profile을 반복 적용**하는 자동화 시스템이다.
- 따라서 비주얼 방향은 **에피소드별 결정 사항이 아니라 OS 레벨의 고정 기준**이다.
- 매 영상마다 Owner가 비주얼 톤을 고르지 않는다. Owner는 최초 1회 Visual Profile을 승인하고, 이후 반복 생산은 이 문서를 기준으로 진행한다.
- 이 문서가 갱신되기 전까지, 모든 scene 생성·이미지 프롬프트·anchor 확장은 여기 정의된 기준을 따른다.

---

## 2. Default Visual Profile

- **이름 (EN):** `premium editorial life-economy realism with fixed financial graphic layer`
- **한국어명:** `프리미엄 에디토리얼 생활경제 실사풍 + 고정 금융 그래픽 레이어`

**한 줄 정의:**

> “현실감 있는 생활경제 장면 위에 고정된 금융 그래픽 레이어를 얹어, 경제 신호가 내 생활에 닿는 순간을 브랜드 일관성 있게 보여주는 프리미엄 쇼츠 비주얼 스타일.”

### 메인 톤
- 프리미엄 에디토리얼 생활경제 실사풍 (premium editorial life-economy realism)
- 경제 신호 → 내 일상에 닿는 접점을 현실감 있게 묘사
- premium but not luxury — 고급스럽되 과시적이지 않음
- 실사 생활경제 장면 **위에 고정된 금융 그래픽 레이어**를 얹어 브랜드 일관성 확보

### 표현 방식
- 얼굴보다 **손 / 사물 / 공간** 중심 (face-minimized composition)
- 핵심 오브젝트를 통해 경제 상황을 은유/구체화
- 핵심 오브젝트 풀: 스마트폰, 은행앱, 영수증, 카드, 장바구니, 대출 문자, 통장, 계약서, 가계부, 식탁, 출근길, 카페 테이블, 사무실 책상
- 실사 이미지 위에 **고정 금융 그래픽 레이어**(은은한 반투명 패널, 소스 라벨 chip, 라인 액센트, 큰 숫자 자리/숫자 UI placeholder, 체크포인트 카드)를 보조로 통합
- 이 그래픽 레이어는 **이미지를 지배하지 않고 보조**하는 브랜드 일관성 장치다.

### 절대 지켜야 할 비주얼 경계
- 순수 실사 사진만 나열하지 않는다. (그래픽 레이어 없는 단순 실사 = 실패)
- 스톡사진 느낌 금지.
- 3D 캐릭터/애니메이션 금지.
- 얼굴 중심 금지 (손/사물/공간/스마트폰/은행앱/영수증/카드/장바구니 중심).
- ChatGPT 이미지 생성이 기본 엔진이다.
- Gemini Veo는 Hook/흐름 장면의 보조 후보일 뿐, 이번 calibration 작업에서는 **사용 금지**.
- 데이터카드는 전체 화면 메인이 아니라 실사 이미지 위의 **금융 그래픽 레이어 / 보조 정보 블록**으로만 사용한다.
- Scene 2/5/6에서는 큰 숫자 자리, 출처 라벨 자리, 체크포인트 카드 자리가 **보조 레이어**로 들어갈 수 있다.

### 이미지 내부 텍스트/숫자 신뢰 경계 (중요)
- 정확한 숫자/출처/발표일/기간은 **후속 deterministic overlay 단계에서만 확정**한다.
- ChatGPT 이미지 내부의 더미 텍스트/숫자는 **source of truth가 아니다.**
- Scene 2 등에서는 정확한 “2.5%”를 이미지 안에 신뢰값으로 넣지 않고, **숫자 자리(placeholder numeric cue) / data chip 자리**만 만든다.
- `dataPeriod`(ECOS 월별 데이터 관측 기간, 예: 202605)와 `lastPolicyDecisionDate`(기준금리가 2.5%로 마지막 변경된 정책 결정일, 예: 2025-05-29)는 **서로 다른 개념**이다. 정책 결정일을 이미지 안에 직접 넣지 않는다.
- `verifiedPublishedDate`처럼 두 개념을 뭉뚱그리는 애매한 표현은 사용하지 않는다.

### 금지되는 방향 (요약 — 상세는 §9)
- data-card/chart-card를 6장면 전체 메인 스타일로 사용 금지 (보조 레이어만 허용)
- 그래픽 레이어가 화면 전체를 덮는 data-card 메인화 금지
- 뉴스룸/금융 브리핑 다큐를 메인 톤으로 사용 금지 (신뢰감 보강용 톤 참고로만)
- 부자/명품/현금다발/투자수익 과장 금지
- 공포/폭락/패닉 유도 금지
- 얼굴 클로즈업 중심 구성 금지

---

## 3. Owner Approval Boundary

### Owner 승인이 필요한 경우
- 최초 비주얼 방향(Visual Profile) 선택
- 최초 1~2 scene 샘플 승인
- 새 비주얼 스타일 추가 (이 Profile에 없는 톤/엔진/포맷 도입)
- 기존 Visual Profile의 큰 변경 (메인 톤 전환, 표현 방식 전환 등)

### Owner에게 매번 묻지 않는 경우
- 위 승인 경계를 넘지 않는 **반복 생산 단계의 일상적 생성**
- 이미 승인된 Profile/anchor/prompt template 범위 안에서의 scene 이미지 생성
- 반복 생산 단계에서는 Owner에게 매 영상 비주얼 방향을 재확인하지 않는다.

> 핵심: **승인은 Profile 단위로 1회, 생산은 그 Profile 안에서 반복.**

---

## 4. Visual Hierarchy

| 우선순위 | 역할 | 엔진/포맷 |
|----------|------|-----------|
| **메인** | 핵심 비주얼 | ChatGPT 생성 이미지 (life-economy realism) |
| **보조** | 수치/체크/정리 강조 | data-card / chart-card |
| **예외** | Hook 또는 움직임 필수 장면 | Gemini Veo (보조 검토만) |

- **메인은 ChatGPT 이미지가 기본 엔진**이다.
- data-card는 **Scene 2 (핵심 수치), Scene 5 (체크포인트), Scene 6 (정리/CTA)** 에 **보조로만** 사용한다.
- data-card를 6장면 전체의 메인 스타일로 쓰지 않는다.
- Gemini Veo는 Hook 또는 흐름/움직임이 꼭 필요한 장면에서만 보조로 검토하며, Owner 승인 전 적용하지 않는다.

---

## 5. Scene Role Template

6 scene 고정 구조. 각 scene별 권장 비주얼 소재 / 금지사항 / data-card 허용 여부.

| Scene | 역할 | 권장 비주얼 소재 | 금지 | 금융 그래픽 레이어 |
|-------|------|------------------|------|--------------------|
| **1** | Hook | 손에 든 스마트폰·은행앱 알림, 영수증, 대출 문자 등 "내 생활 접점" 오브젝트 + 은은한 그래픽 레이어 | 얼굴 클로즈업, 차트 단독, 패닉 연출, 순수 스톡사진 | 은은한 보조 레이어 허용 (큰 숫자 금지) |
| **2** | 핵심 신호/수치 | 핵심 오브젝트 + 은행앱 화면 + 숫자 자리/출처 라벨 자리/data chip 보조 레이어 | 과장된 부 표현, 데이터카드 전체화면화, 정확한 숫자를 신뢰값으로 삽입 | ✅ 보조 레이어 (숫자 placeholder + 소스 라벨 자리) |
| **3** | 원인/맥락 | 책상·계약서·가계부 위 흐름 묘사, 공간 중심 | 뉴스룸 브리핑 톤 메인화 | △ 필요 시 보조만 |
| **4** | 생활 영향 | 식탁·장바구니·카페 테이블·출근길 등 일상 공간 | 명품/현금다발 | △ 최소 보조 (리얼 생활 장면 우선) |
| **5** | 체크/관찰 포인트 | 손으로 짚는 동작, 체크리스트 오브젝트 | 공포 유도 | ✅ 보조 레이어 (체크포인트 카드 자리) |
| **6** | 액션/정리/CTA | 통장·가계부 정리, 차분한 마무리 구도 | 투자수익 약속 | ✅ 보조 레이어 (정리/CTA 카드 자리) |

- 그래픽 레이어 허용 scene(2/5/6)에서도 **메인은 리얼 이미지, 그래픽 레이어는 보조**라는 위계를 지킨다.
- 그래픽 레이어가 화면 전체를 덮는 data-card 메인이 되면 실패다.
- 그래픽 레이어 안의 숫자/출처/날짜 텍스트는 **source of truth가 아니며**, 정확한 값은 후속 deterministic overlay에서 확정한다.

> ⚠️ **중요 — 이 표는 "권장 소재 예시"이지 "고정 오브젝트표"가 아니다.**
> 위 "권장 비주얼 소재" 칸을 `Scene 1 = 스마트폰 / Scene 3 = 노트북`처럼 **scene별 고정 오브젝트 매핑으로 읽으면 안 된다.** scene은 **고정 오브젝트가 아니라 전달 역할(role)** 을 가지며, 실제 오브젝트는 §5-A의 Rule Contract(Visual Category Pool / Object Family Pool / Diversity Rules)에서 **다양하게 선택**한다. 자세한 규칙은 **§5-A**와 data-only 계약 파일 `scripts/fixtures/premium-editorial-visual-system.rule-contract.v1.json`를 따른다.

---

## 5-A. Rule Contract 기반 Visual Matrix (고정 오브젝트표 금지)

> source of truth(data-only): `scripts/fixtures/premium-editorial-visual-system.rule-contract.v1.json`
> structure guard: `scripts/check-premium-editorial-visual-system-static.mjs`

### 왜 이 섹션이 추가되었나 (Scene 3~6 v1 실패)
- 최근 Scene 3~6 이미지가 **우드 테이블 / 손 / 스마트폰 / 노트 / 커피 조합으로 수렴**해 6장면이 거의 같은 구도로 보이는 실패가 있었다.
- 원인은 Visual Matrix를 **scene별 고정 오브젝트표**처럼 다뤄, 매 scene이 같은 사물·공간·구도로 굳었기 때문이다.
- 따라서 Visual Matrix를 **고정 오브젝트표가 아니라 반복 생산 가능한 규칙 시스템(Rule Contract)** 으로 재정의한다.
- **최근 Scene 3~6 v1 이미지는 메인 기준(main baseline)으로 사용하지 않는다.** 폐기 대상은 그 실패 방향과 helper의 실패 분기뿐이며, **승인된 Scene 1 fixed + Scene 2 v2 anchor 기준은 유지**한다.

### 나쁜 방식 (금지)
```
Scene 1 = 스마트폰   Scene 2 = 책상   Scene 3 = 노트북
Scene 4 = 장바구니   Scene 5 = 체크리스트   Scene 6 = CTA 카드
```
- scene을 특정 오브젝트에 영구 고정하는 표는 금지된다.

### 올바른 방식 (Rule Contract)
Visual Matrix는 아래 구성요소로 정의한다 (상세 값은 JSON 계약 참조):
1. **Scene Role Contract** — 각 scene은 고정 오브젝트가 아니라 전달 역할을 가진다.
   - Scene 1 = Hook / Scene 2 = Signal / Scene 3 = Context·Why / Scene 4 = Life Impact / Scene 5 = Watch Point / Scene 6 = Action·Closing
   - 각 role은 "항상 무엇을 보여줄지"가 아니라 "무엇을 전달해야 하는지"를 정의한다.
2. **Visual Category Pool** — `personal_finance_moment`, `household_cost_moment`, `institutional_data_macro_signal`, `checklist_decision_moment`, `closing_action_cue` 등 12개 category. 각 category는 `usefulForRoles / avoidWhen / overuseRisk / visualExamples`를 가지며 **특정 scene에 영구 고정하지 않는다.**
3. **Object Family Pool** — 개별 물건이 아니라 family 단위(`payment_objects / household_objects / banking_objects / data_objects / planning_objects / city_economy_objects / document_objects`). family마다 `members / usefulForCategories / repeatLimitGuidance / overuseRisk`.
4. **Diversity Rules** — 같은 공간/카메라 거리/object family 반복 제한, smartphone-centered scene ≤2, wood-table+notebook+coffee+hand 조합 반복 금지, 전체화면 data-card 금지, 6장면 손/테이블/스마트폰 수렴 금지, scene별 category 구분, **이전 scene 사용 이력(previousSceneVisualHistory)을 Prompt Compiler 입력으로 사용.**
5. **Prompt Compiler Contract** — (이번 작업은 구현이 아니라 **계약만 정의**) 입력: Visual Bible / Scene Role Contract / Category Pool / Family Pool / Diversity Rules / 경제 신호 / 생활경제 해석 변수 / previousSceneVisualHistory / forbiddenObjects / forbiddenCompositions / subtitleSafeZone / graphicLayerPolicy. 출력: sceneRole / selectedVisualCategory / selectedObjectFamilies / spaceType / cameraDistance / compositionNotes / graphicLayerPlan / forbiddenRepetitionNotes / promptFixedPart / promptVariablePart / finalPrompt / qaExpectations. **고정 80 / 변수 20** 원칙 유지.
6. **Visual QA Contract** — (실제 이미지 품질 판정기가 아니라 **구조 검증 + 향후 검수 항목**) role 구분 / 인접 scene 유사 / 스마트폰·노트·커피·테이블 반복 / 실사이지만 스톡 아님 / 그래픽 레이어 존재 & 비지배 / 자막 안전영역 / 3D·애니 아님 / 얼굴 중심 아님 / source-of-truth(overlay).
7. **Failure / Regeneration Routing** — `regenerate_same_role_with_new_category` / `regenerate_with_object_family_ban` / `owner_review_required` / `accept_with_overlay_fix` / `reject_as_visual_system_failure`.

### ChatGPT / Veo / data-card 기준 (재확인)
- **ChatGPT 이미지가 기본(main) 엔진.**
- **Veo는 Hook/흐름/전환 등 motion이 꼭 필요한 장면에만 보조 후보** (Owner 승인 전 적용 금지).
- **data-card는 메인 비주얼 아님** — Scene 2/5/6에서 **보조 그래픽 레이어로만** 허용. 전체 화면 지배 시 실패.
- 정확한 숫자/날짜/출처는 이미지 안에 넣지 않고 **deterministic overlay에서만** 확정.

### Static guard 성격 (중요)
- `scripts/check-premium-editorial-visual-system-static.mjs`는 **생성 이미지 품질 판정기가 아니다.**
- 이 guard는 **Rule Contract가 하드코딩/고정 오브젝트표/반복 수렴 실패를 막을 구조를 갖췄는지** 검증하는 **계약 구조 검증기**다.
- 실제 이미지 품질 검수는 다음 샘플 생성 단계에서 별도로 한다.

---

## 6. Prompt Template (ChatGPT 이미지 생성)

**원칙: 고정 80 + 변수 20**
- 프롬프트의 약 80%는 Profile 공통 고정 요소로 일관성을 유지하고, 약 20%만 scene별 변수로 바꾼다.

### 공통 고정 요소 (≈80%)
- vertical 9:16 composition
- premium editorial realistic Korean everyday finance context (not stock photo, not 3D, not animation)
- face-minimized composition (hands / objects / spaces 중심)
- premium but not luxury
- consistent **premium financial graphic layer** integrated into the scene (반투명 패널 / 소스 라벨 chip 자리 / 라인 액센트 / 숫자 UI placeholder) — 보조이며 이미지를 지배하지 않음
- no exaggerated wealth, no fearmongering, no investment promise, no full-screen data card
- subtitle-safe lower area (하단 자막 안전영역 비움)
- consistent lighting / color grade (anchor 기준)
- 이미지 내부 숫자/출처/날짜 텍스트는 source of truth 아님 — 정확값은 후속 deterministic overlay에서 확정

### 변수 요소 (≈20%)
- economic signal (예: 기준금리 유지/확인 포인트)
- scene role (Scene 1~6 중 어떤 역할인지)
- key object (스마트폰, 영수증, 통장 등 §2 오브젝트 풀에서 선택)
- mood (차분함 / 점검 / 정리 등)
- source/value overlay requirement (수치·출처 표기 필요 여부)

### 프롬프트 골격 예시 (구조만 — 실제 실행 금지)
```
[FIXED] vertical 9:16, realistic Korean everyday finance scene,
face-minimized, hands and objects centered, premium not luxury,
no exaggerated wealth, no fearmongering, no investment promise,
keep lower third clear for subtitles, consistent warm-neutral lighting.

[VARIABLE] economic signal: <signal>;
scene role: <scene N — role>;
key object: <object>;
mood: <mood>;
overlay: <value/source overlay needed? yes/no>.
```

---

## 7. Anchor Image Strategy

- 한 에피소드에서 **1~2개 대표(anchor) 이미지를 먼저 생성**하고, 나머지 scene은 anchor를 기준으로 확장한다.
- anchor의 일관성 기준은 **인물 얼굴이 아니라**:
  - 공간 (책상/식탁/카페 등)
  - 오브젝트 (반복 등장하는 핵심 사물)
  - 색감 / 조명 (warm-neutral grade 등)
  - 구도 (face-minimized, object-centered)
- 즉, 얼굴 동일성에 의존하지 않고 **공간·오브젝트·색감·조명·구도 일관성**으로 에피소드 톤을 묶는다.
- 이렇게 하면 얼굴 일관성 문제를 피하면서도 에피소드 전체가 한 시리즈로 보인다.

---

## 8. Subtitle Safe Zone

- 하단 자막 안전영역(대략 하단 1/4~1/3)을 **항상 비워둔다.**
- 핵심 오브젝트 / 핵심 텍스트 / 수치 강조 요소가 하단 자막 영역을 침범하지 않게 구도를 잡는다.
- 프롬프트 공통 고정 요소에 "subtitle-safe lower area"를 항상 포함한다.
- data-card 보조 사용 시에도 자막 영역과 충돌하지 않도록 카드 본문을 상·중단에 배치한다.

---

## 9. Forbidden Visual Patterns

- ❌ data-card 6장면 전체 메인화 (카드는 Scene 2/5/6 보조만)
- ❌ 뉴스룸/차트만 반복하는 딱딱한 금융 브리핑 영상
- ❌ 부자 / 명품 / 현금다발 / 투자수익 과장
- ❌ 공포 / 폭락 / 패닉 유도
- ❌ 얼굴 클로즈업 중심 구성
- ❌ 장면마다 스타일이 완전히 달라지는 독립 생성 (anchor 무시한 scene별 제각각 생성)

---

## 10. Calibration Workflow

1. **현재 단계 = calibration 단계** (이 문서 작성/검토)
2. **다음 단계** = Owner가 이 문서를 확인한 뒤, **1~2 scene 샘플 생성**으로 진행
3. 샘플 승인 후에야 전체 scene 확장으로 넘어간다.
4. **Owner 승인 전 6 scene 확장 금지.**
5. Owner 승인 전 mp4 재생성 / Veo 적용 / 전체 장면 확장 금지.

> 순서: Profile 문서 승인 → 1~2 anchor 샘플 → Owner 승인 → 나머지 scene 확장.

---

## 11. Current ECOS Base Rate Example (적용 예시 — 실행 금지)

현재 기준금리 에피소드(ECOS 722Y001, 2026-05 기준)에 이 Visual Profile을 적용하는 방향만 설명한다. **새 이미지 프롬프트를 실제 실행하지 않는다.**

- **방향:** "기준금리 2.5% 유지 / 확인 포인트" — 인상/인하 단정 금지.
- **Scene 1 (Hook):** 손에 든 스마트폰 은행앱 알림 또는 대출 문자 (실사) + 은은한 금융 그래픽 레이어. 차트 단독·순수 스톡사진 금지.
- **Scene 2 (수치):** 은행앱 금리 화면 실사 + 숫자 자리(placeholder numeric cue) / 출처 라벨 자리 / data chip 보조 레이어. 메인은 리얼 오브젝트. 정확한 "2.5%"는 이미지 안에 신뢰값으로 넣지 않고 후속 deterministic overlay로 확정.
- **Scene 3 (맥락):** 책상 위 가계부/계약서 — "직전월 대비 유지" 흐름을 공간으로 표현.
- **Scene 4 (생활 영향):** 식탁/장바구니/카페 테이블 — 대출자·예금자 일상 접점.
- **Scene 5 (체크):** 손으로 짚는 체크리스트 + 체크포인트 보조 카드 자리 (물가/실제 대출금리 확인).
- **Scene 6 (정리/CTA):** 통장·가계부 정리 구도 + 정리/CTA 보조 카드 자리 (고정비·대출 조건 점검).
- 모든 scene: face-minimized, subtitle-safe lower area, premium-not-luxury, 고정 금융 그래픽 레이어(보조) 유지.
- **사실 기준 분리:** `dataPeriod=202605`(ECOS 월별 데이터 관측 기간)와 `lastPolicyDecisionDate=2025-05-29`(기준금리 2.5% 마지막 변경 정책 결정일)는 서로 다른 개념. 정책 결정일을 이미지 안에 직접 넣지 않는다. `verifiedPublishedDate` 표현 사용 금지.
- 정확한 발표일/기간/수치는 후속 Fact Card / deterministic overlay 단계에서만 확정한다.

---

_이 문서는 calibration draft다. 기본 Visual Profile은 "프리미엄 에디토리얼 생활경제 실사풍 + 고정 금융 그래픽 레이어"로 보정되었으며, Scene 1/2 anchor v2 샘플 Owner 승인 후 확정본(V2)으로 checkpoint된다._
