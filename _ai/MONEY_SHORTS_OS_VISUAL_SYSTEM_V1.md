# Money Shorts OS — Visual System V1

> Status: **calibration draft** (샘플 생성 준비 전 단계)
> Owner-approved default Visual Profile: **D 혼합형 — 생활경제 리얼리즘 기반 + 오브젝트 중심 안정화**

---

## 1. Purpose

이 문서는 **반복형 금융·경제 쇼츠 자동화 OS의 기본 비주얼 source of truth**다.

- Money Shorts OS는 매 에피소드마다 새 비주얼 방향을 정하는 도구가 아니라, **최초 승인된 Visual Profile을 반복 적용**하는 자동화 시스템이다.
- 따라서 비주얼 방향은 **에피소드별 결정 사항이 아니라 OS 레벨의 고정 기준**이다.
- 매 영상마다 Owner가 비주얼 톤을 고르지 않는다. Owner는 최초 1회 Visual Profile을 승인하고, 이후 반복 생산은 이 문서를 기준으로 진행한다.
- 이 문서가 갱신되기 전까지, 모든 scene 생성·이미지 프롬프트·anchor 확장은 여기 정의된 기준을 따른다.

---

## 2. Default Visual Profile

- **이름 (EN):** `life-economy realism with object-stabilized composition`
- **한국어명:** `생활경제 리얼리즘 기반 + 오브젝트 중심 안정화`

**한 줄 정의:**

> “경제 신호가 내 생활에 닿는 순간을, 얼굴보다 손·사물·공간 중심의 현실적인 이미지로 보여주는 프리미엄 생활경제 쇼츠 스타일.”

### 메인 톤
- 생활경제 리얼리즘 (life-economy realism)
- 경제 신호 → 내 일상에 닿는 접점을 사실적으로 묘사
- premium but not luxury — 고급스럽되 과시적이지 않음

### 표현 방식
- 얼굴보다 **손 / 사물 / 공간** 중심 (face-minimized composition)
- 핵심 오브젝트를 통해 경제 상황을 은유/구체화
- 핵심 오브젝트 풀: 스마트폰, 은행앱, 영수증, 카드, 장바구니, 대출 문자, 통장, 계약서, 가계부, 식탁, 출근길, 카페 테이블, 사무실 책상

### 금지되는 방향 (요약 — 상세는 §9)
- data-card/chart-card를 6장면 전체 메인 스타일로 사용 금지
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

| Scene | 역할 | 권장 비주얼 소재 | 금지 | data-card |
|-------|------|------------------|------|-----------|
| **1** | Hook | 손에 든 스마트폰·은행앱 알림, 영수증, 대출 문자 등 "내 생활 접점" 오브젝트 | 얼굴 클로즈업, 차트 단독, 패닉 연출 | ❌ (메인은 리얼 이미지) |
| **2** | 핵심 신호/수치 | 핵심 오브젝트 + 수치 강조 구도, 은행앱 화면 | 과장된 부 표현 | ✅ 보조 허용 (핵심 수치 카드) |
| **3** | 원인/맥락 | 책상·계약서·가계부 위 흐름 묘사, 공간 중심 | 뉴스룸 브리핑 톤 메인화 | △ 필요 시 보조만 |
| **4** | 생활 영향 | 식탁·장바구니·카페 테이블·출근길 등 일상 공간 | 명품/현금다발 | ❌ 권장 (리얼 생활 장면 우선) |
| **5** | 체크/관찰 포인트 | 손으로 짚는 동작, 체크리스트 오브젝트 | 공포 유도 | ✅ 보조 허용 (체크포인트 카드) |
| **6** | 액션/정리/CTA | 통장·가계부 정리, 차분한 마무리 구도 | 투자수익 약속 | ✅ 보조 허용 (정리/CTA 카드) |

- data-card 허용 scene(2/5/6)에서도 **메인은 리얼 이미지, 카드는 보조**라는 위계를 지킨다.

---

## 6. Prompt Template (ChatGPT 이미지 생성)

**원칙: 고정 80 + 변수 20**
- 프롬프트의 약 80%는 Profile 공통 고정 요소로 일관성을 유지하고, 약 20%만 scene별 변수로 바꾼다.

### 공통 고정 요소 (≈80%)
- vertical 9:16 composition
- realistic Korean everyday finance context
- face-minimized composition (hands / objects / spaces 중심)
- premium but not luxury
- no exaggerated wealth, no fearmongering, no investment promise
- subtitle-safe lower area (하단 자막 안전영역 비움)
- consistent lighting / color grade (anchor 기준)

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
- **Scene 1 (Hook):** 손에 든 스마트폰 은행앱 알림 또는 대출 문자 (리얼 이미지). 차트 단독 금지.
- **Scene 2 (수치):** 은행앱 금리 화면 + "현재 기준금리 2.5%" 보조 data-card. 메인은 리얼 오브젝트.
- **Scene 3 (맥락):** 책상 위 가계부/계약서 — "직전월 대비 유지" 흐름을 공간으로 표현.
- **Scene 4 (생활 영향):** 식탁/장바구니/카페 테이블 — 대출자·예금자 일상 접점.
- **Scene 5 (체크):** 손으로 짚는 체크리스트 + 체크포인트 보조 카드 (물가/실제 대출금리 확인).
- **Scene 6 (정리/CTA):** 통장·가계부 정리 구도 + 정리/CTA 보조 카드 (고정비·대출 조건 점검).
- 모든 scene: face-minimized, subtitle-safe lower area, premium-not-luxury 유지.
- 수치/출처 표기: ECOS 722Y001, 결정일 2025-05-29 — 작고 명확하게.

---

_이 문서는 calibration draft다. Owner 승인 및 1~2 scene 샘플 검증 후 V2로 갱신될 수 있다._
