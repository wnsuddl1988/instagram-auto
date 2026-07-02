# Golden Sample Image-Source Recovery — Decision Packet v1

- 작성일: 2026-07-02
- Task ID: `creative-v2-golden-sample-image-source-recovery-decision-pack-v1`
- 성격: **Owner 판단 자료 — 조사/설계/결정 패킷. 실행 승인이 아니다.** 이번 slice에서 live 생성/API 호출/render/TTS/mux/upload/credential·dependency 변경은 수행하지 않았다.
- 최우선 source of truth: `_ai/CREATIVE_V2_GOLDEN_SAMPLE_ABSOLUTE_RULES.md` (무수정). 선행 판단 자료: `_ai/GOLDEN_SAMPLE_QUALITY_STABILIZATION_DECISION_PACKET_V1.md`.
- 조사 한계 고지: 이 slice는 외부 서비스 호출이 금지되어 provider 세부 사양은 **로컬 repo 증거 + 작성 시점 지식** 기반이다. `⚠️ 공식 문서 확인 필요`로 표시된 항목은 추측을 사실로 확정하지 말고 Owner/Codex가 공식 문서로 검증해야 한다.

---

## 1. 현재 Blocker 요약

1. **ChatGPT live path 941x1672 상한 (실측 확정)**: 기존 7장 + 오늘자 probe(명시적 1080x1920 지시 포함) 전부 941x1672. 941×1672 ≈ 1024×1536 픽셀 예산(~1.57MP)의 9:16 재배분으로, composer에 크기 옵션 없음 + srcset 대형 변형 없음까지 확인됨. **이 경로 단독으로는 1080x1920 gate 충족 불가.**
2. **이미지 실패는 이중 실패**: 해상도 미달만이 아니라, 원 지시(절대규칙 §0.D)의 진단대로 이미지가 generic해서 금리/대출/예금/현금흐름의 **주제 전달력이 약한 품질 실패**를 포함한다. 해상도만 해결해도 품질 문법은 완성되지 않는다.
3. **current selected set / probe image = evidence only**: final render 입력 자격 없음. background-only gate 완화(구 A안)는 폐기됐고 재발 방지 체크가 static guard에 들어가 있다.
4. **render 금지 이유**: 절대규칙 §12 "좋은 이미지가 없으면 렌더하지 않는다". 새 이미지/비주얼 source가 Owner 결정으로 확정되고, 새 selected image set이 1080x1920+/9:16/주제 전달력 QA를 통과하기 전에는 render로 넘어가지 않는다. uploadReady=false 유지.

## 2. Provider/Source 후보 비교

> 공통 전제: 절대규칙 §1의 required_provider_path는 `chatgpt_or_llm_image_generation`이다. 아래 후보는 모두 "LLM/생성형 image generation" 범주이나, **경로 변경 자체는 Owner 명시 승인 필요**. placeholder/stock-like(예: Pexels)는 후보에서 제외(절대규칙 금지). Pollinations(무료 FLUX 프록시)는 2026-05-24부터 402 차단 이력으로 제외.

### 후보 A — Google Imagen 4 상위 옵션 (기존 `lib/imagen.ts` 통합 재사용) ★통합 비용 최소

- **현재 repo 증거**: `lib/imagen.ts`가 이미 Gemini API(`generativelanguage.googleapis.com`)로 `imagen-4.0-fast-generate-001` + `aspectRatio: "9:16"`을 호출하는 통합을 보유. render-v2에 ALLOW_IMAGEN gate/daily quota 처리 존재.
- **1080x1920+ 가능성**: Imagen 4 계열에 상위 모델(standard/ultra)과 출력 크기 옵션(1K/2K 계열)이 존재하는 것으로 알려져 있음. 2K 옵션의 9:16 실제 픽셀이 1080x1920을 넘는지가 관건. `⚠️ 공식 문서 확인 필요 (모델 변형별 9:16 정확 해상도/sampleImageSize 파라미터)`
- **LLM 경로 적합성**: 생성형 image model — 범주 적합. 단 "ChatGPT 기반" 원문과의 정합은 Owner 해석 승인 필요.
- **비용/credential/dependency**: 기존 Google API key 경로 재사용(신규 dependency 불필요, fetch 직접 호출 구조). 장당 비용 존재. `⚠️ 공식 문서 확인 필요 (imagen-4 변형별 단가)`
- **품질 위험**: 과거 QA-27에서 **plan_required** 이력 + daily quota 소진 이력 — 계정/플랜 상태 재확인 필수. 금융 에디토리얼 사실감은 양호한 것으로 알려져 있으나 사람 손/얼굴 safety 필터 민감(repo의 sanitizePromptForImagen 이력).
- **자동화 통합 난이도**: **최저** — 기존 클라이언트에 모델명/사이즈 파라미터만 상향.
- **소량 테스트 설계**: 승인 후 hook 1종 + checklist 1종 프롬프트 × 각 2장(총 4장) → 실측 해상도/9:16/주제 전달력/no-text/no-watermark QA.
- **Owner 승인 범주**: 유료 API 호출(장수/비용 상한), ALLOW_IMAGEN 활성, 플랜 상태 확인.

### 후보 B — OpenAI gpt-image API (기존 OPENAI_API_KEY 재사용)

- **1080x1920+ 가능성**: **낮음(알려진 바)** — 알려진 portrait 최대는 1024x1536(2:3)이고 9:16 네이티브 없음. ChatGPT probe의 941x1672와 같은 픽셀 예산 계열이라 gate 미달 가능성이 높다. 신규 모델/파라미터 존재 여부만 확인 가치. `⚠️ 공식 문서 확인 필요`
- **비용/credential/dependency**: 기존 OPENAI_API_KEY 재사용, dependency 불필요.
- **품질 위험**: ChatGPT path와 동일 계열 → 주제 전달력은 프롬프트 재설계에 의존.
- **자동화 통합 난이도**: 낮음.
- **판단**: gate 충족 근거가 확인되지 않는 한 **소량 테스트 비추천** — 문서 확인만 수행(호출 없이).
- **Owner 승인 범주**: (문서 확인만이면 불필요) 호출 시 유료 API 승인.

### 후보 C — FLUX 계열 공식 API (BFL / fal.ai / Replicate 등) ★해상도 확실성 최고

- **1080x1920+ 가능성**: **높음(알려진 바)** — FLUX Pro 계열은 유연한 출력 해상도(약 2MP, Ultra 계열 ~4MP)를 지원해 1080x1920+ 네이티브 생성이 설계상 가능. `⚠️ 공식 문서 확인 필요 (현행 모델별 최대 해상도/허용 종횡비/단가)`
- **LLM 경로 적합성**: 생성형 diffusion 모델 — 범주 적합(Owner 해석 승인 필요).
- **비용/credential/dependency**: **신규 credential 등록 필요**(BFL/fal/Replicate 중 택1), 장당 과금(대략 수 센트 수준으로 알려짐 — `⚠️ 확인 필요`). HTTP 직접 호출로 구현하면 신규 dependency 없이 가능.
- **품질 위험**: 포토리얼/질감 강점으로 알려짐. 금융 주제 전달력은 프롬프트 품질에 의존(§3 재설계와 결합 필수). stock-like 위험은 낮으나 워터마크/텍스트 억제 프롬프트 필요.
- **자동화 통합 난이도**: 중간 — 신규 API 클라이언트 1개 작성(기존 imagen.ts 패턴 복제 수준).
- **소량 테스트 설계**: A와 동일 프롬프트로 4장 → 동일 QA 기준으로 A/C 직접 비교.
- **Owner 승인 범주**: 신규 외부 서비스 + credential(env/secret 범주) + 유료 호출 승인.

### 후보 D (참고) — Midjourney

- 품질 최상급으로 알려져 있으나 **공식 API 부재(알려진 바)** → Discord/웹 자동화는 ToS 위반 위험이 크고 자동화 파이프라인 목표와 근본 충돌. **비추천, 참고만.** `⚠️ 공식 API 출시 여부 확인 필요`

### 비교 요약

| 축 | A: Imagen 4 상위 | B: OpenAI gpt-image | C: FLUX 공식 API | D: Midjourney |
|---|---|---|---|---|
| 1080x1920+ 네이티브 | 가능성 있음 ⚠️확인 | 낮음(1024x1536 알려짐) | 높음 ⚠️확인 | 가능하나 자동화 불가 |
| 통합 난이도 | **최저(기존 통합)** | 낮음 | 중간(신규 클라이언트) | 부적합 |
| credential/dependency | 기존 재사용 | 기존 재사용 | 신규 credential | — |
| 알려진 리스크 | plan_required/quota 이력 | 해상도 상한 | 신규 계정/비용 | ToS/자동화 |
| 소량 테스트 권장 | **1순위** | 문서 확인만 | **병행 or 2순위** | 제외 |

### 추천 (Owner 결정 대상)

1. **1단계(호출 없음)**: Owner/Codex가 A(Imagen 4 상위 모델·사이즈)와 C(FLUX)의 **9:16 정확 해상도와 단가를 공식 문서로 확인**. B는 이때 함께 확인만.
2. **2단계(승인 후 소량 테스트)**: gate(≥1080x1920) 충족이 문서로 확인된 후보에 한해 소량 테스트 — **A가 충족하면 A 우선**(통합/비용 최소, 기존 credential), 미충족/plan 문제 시 **C**. 예산이 허용되면 A+C 병행 4장씩 비교가 판단 확실성이 가장 높다.
3. 테스트 산출물은 새 selected image set 후보로 owner 시각 QA(주제 전달력 포함) → 통과 시에만 6장 full set → 그 후에야 render slice.

## 3. Visual Director 재설계 요건

목표: "예쁜 이미지"가 아니라 **금융/돈/심리/성공 메시지를 이미지가 직접 설명**하게 만든다 (절대규칙 §0.D 실패 재발 방지).

### 3-1. 공통 요건 (모든 scene)

- **주제 전달력 우선**: 각 scene 프롬프트는 "이 이미지 한 장만 봐도 무엇에 대한 이야기인지 안다"를 기준으로 작성. 장면의 금융 의미를 오브젝트로 물성화(예: 이자 부담 = 대출 명세서 위 눌린 손, 현금흐름 = 지갑에서 빠져나가는 지폐의 방향성).
- **object density**: scene당 의미 오브젝트 2~4개(주연 1 + 조연 1~3). 1개면 generic, 5개+면 산만.
- **metaphor**: scene마다 시각 은유 1개를 명시 필드로 지정(예: "모래시계 = 만기", "빨간 실 = 뉴스와 지갑의 연결"). 은유 없는 단순 정물 금지.
- **texture/depth**: 얕은 심도, 실물 질감(종이 결, 금속 광택, 직물), 시네마틱 조명. 배경으로 dim/blur 처리돼도 질감이 살아남아야 함(절대규칙 §7 "배경으로 써도 질감이 살아 있어야 함").
- **금지**: 이미지 내 읽히는 텍스트/숫자/라벨, 워터마크/로고/UI, 왜곡된 손/기형 손가락, generic 미소 사무직, 가짜/읽을 수 없는 차트, 저품질 스톡 느낌, 공포/과장 톤.

### 3-2. scene별 스키마 (visual_director_prompts v2 요건)

각 scene 프롬프트에 다음 필드를 필수화:

- `must_show`: 명시 오브젝트 목록 (예: hook scene — 뒤집힌 스마트폰, 미개봉 고지서 봉투, 주저하는 손)
- `must_avoid`: scene별 구체 금지 (예: 차트 벽, 태블릿 대시보드, 정면 얼굴, 사무실 스톡 구도)
- `objectDensity`: 2~4 범위 명시
- `visualMetaphor`: 은유 1개 + 의미
- `subjectDeliveryCheck`: "이미지 단독으로 전달돼야 하는 메시지" 1문장 (QA 시 이 문장으로 판정)
- `cameraAndLight`: 심도/거리/조명 지정 (공간·카메라 리듬 변주 — 동일 구도 연속 금지)

### 3-3. 배경/전경 구도 기준 (카드/텍스트/모션 레이어와의 정합)

- **카드 안전 영역**: 중앙 및 하단 1/3, 상단 스트립은 단순/저대비 유지 — 카드/자막이 얹혀도 이미지 주제 오브젝트가 가려지지 않도록 주제 오브젝트는 중앙-상단 1/3 경계 또는 좌우 측면에 배치.
- **주연 교대 원칙**: 이미지가 3초 이상 화면 주연으로 고정되면 reject(절대규칙 §2) — 이미지의 시각 무게는 카드 등장과 교대할 수 있는 구도(비대칭, 여백 확보)로 설계.
- **dim/blur 내성**: 배경 처리 후에도 실루엣/색 대비로 주제가 읽히는 구도(오브젝트 윤곽이 명확한 장면 우선).

### 3-4. 새 selected image set QA 기준 (1080x1920 final gate 전제)

| 축 | 기준 |
|---|---|
| 해상도 | 6/6 실측 ≥1080x1920 (upscale/crop 아님, 네이티브) |
| 종횡비 | vertical 9:16 (0.5625±0.01) |
| 주제 전달력 | scene별 subjectDeliveryCheck 문장을 이미지 단독으로 충족 — owner 시각 QA |
| 텍스트/워터마크 | 읽히는 글자·숫자·로고 0건 |
| generic/stock 판정 | 스톡 포토 느낌·과채도 조명·클리셰 구도 reject |
| 손/인물 | 왜곡 없음, 얼굴 최소화(측면/크롭/원경) |
| 세트 리듬 | 공간/카메라 거리/톤 변주 확인 (동일 구도 3연속 금지) |

## 4. Golden Sample 주제 후보 비교

> 전제: **금리동결은 고정 주제가 아니다** — 테스트 주제일 뿐이며, 품질 문법(hook/이미지/TTS 리듬/카드/모션/audit)의 재사용성이 진짜 산출물이다.

### T1 — 금리동결 유지 (기준점)

- hook 강도: 중 — "아직 안심 금지" 반전형이나 뉴스 시의성 의존(evergreen 아님).
- 이미지화 난이도: **높음** — 금리/예금/반영 시점은 추상 개념이라 문서·통장·달력 중심의 정적 오브젝트로 흐르기 쉬움(기존 실패의 근인).
- TTS 리듬: 기존 blueprint의 7-phase 문장 완성 — 리듬 검증 완료.
- 카드 구조 적합성: 높음 (기존 checklist 3-point 구조 그대로).
- 자동화 확장성: 중 — 금리 사이클 의존.
- 이점: blueprint/prompts/manifest 재사용으로 재작업 최소.

### T2 — "월급이 들어와도 3일이면 사라지는 이유" (현금흐름 × 소비 심리) ★추천 1순위

- hook 강도: **상** — 급여 생활자 보편 공감 + 반전 구조("문제는 월급 크기가 아니라 새는 순서다"). 첫 2초 hook card와 자연 결합("3일 만에 통장이 비었다").
- 이미지화 난이도: **낮음** — 구체 오브젝트가 풍부: 잔고 줄어드는 통장/지갑, 쌓인 결제 알림, 영수증 더미, 달력의 3일, 자동이체 서류. 시각 은유(빠져나가는 물/모래 = 현금 유출)도 명확. §3 재설계 요건과 정합 최고.
- TTS 리듬: 상 — 문제(공감)→원인(고정비/구독/소액결제 3-point)→반전(순서의 문제)→행동(이체 순서 바꾸기) 구조가 30초 one-shot 내레이션에 맞음.
- 카드 구조 적합성: **상** — checklist 3-point(고정비/구독/소액결제) + twist single-sentence("월급은 크기가 아니라 순서다") + action card("월급날 자동이체 순서 확인")가 기존 템플릿에 1:1 대응.
- 자동화 확장성: **상** — 소비 심리/현금흐름 시리즈(구독 함정, 무지출 챌린지, 통장 쪼개기 등)로 evergreen 확장.

### T3 — "구독료 함정: 나도 모르게 새는 돈" (생활 판단 × 고정비)

- hook 강도: 상 — "한 달에 얼마 나가는지 모른다면" 구체 공감형.
- 이미지화 난이도: 낮음~중 — 앱 아이콘 격자/카드 명세서/겹쳐진 카드 등 오브젝트는 구체적이나, 화면·UI 중심으로 흐르면 "읽히는 텍스트 금지" 제약과 충돌 위험(로고/앱 아이콘 처리 주의).
- TTS 리듬: 상 — 목록형 3-point에 적합.
- 카드 구조 적합성: 상.
- 자동화 확장성: 상 — T2와 같은 시리즈 계열.

### 추천

**1순위: T2** — 이유: (1) 이미지 주제 전달력 회복이 이번 복구의 핵심 실패 지점인데, T2는 후보 중 시각 은유가 가장 구체적·물성적이라 §3 재설계 효과를 가장 확실히 검증할 수 있다. (2) hook 보편성이 최고(급여 생활자 전원)이고 시의성 의존이 없어 evergreen. (3) 기존 카드/TTS/perceptual 구조에 재작업 없이 1:1 매핑된다. (4) T3·소비심리 시리즈로의 자동화 확장 축이 된다.
**T1은 기준점으로 병행 유지 가능**(이미 blueprint 존재 — 새 이미지 source 테스트 프롬프트의 대조군으로 활용). T3는 T2 성공 후 2호 후보. **최종 결정은 Owner.**

## 5. 다음 Owner Decision

1. **provider/source 소량 테스트 대상**: A(Imagen 4 상위) / C(FLUX) / A+C 병행 중 선택. (선행: 공식 문서로 9:16 해상도·단가 확인 — 호출 없음)
2. **Golden Sample 주제**: T1 유지 / T2 전환(추천) / T3 / 기타.
3. **필요 승인 범주**:
   - A: 유료 API 호출(장수·비용 상한 명시), ALLOW_IMAGEN 활성, Google 플랜 상태 확인
   - C: 신규 외부 서비스 계약 + credential 등록(env/secret 범주) + 유료 호출
   - 공통: 소량 테스트 장수(권장: 후보당 4장), 결과 QA 후 full 6장 승인은 별도
4. **live 실행 전 필요한 명시 승인 문구 (예시)**:
   > "image source 소량 테스트 승인: provider={A|C}, 모델={...}, 생성 {N}장, 예상 비용 상한 ${...}, credential={기존 재사용|신규 등록}, dependency 변경 없음, render/TTS/mux/upload 없음 — approved"
5. 테스트 통과 기준: §3-4 QA 표 전 항목. 미달 시 render로 넘어가지 않고 재보고.

## 6. 금지/폐기 방향 재확인

- 기존 941x1672 이미지(선택 세트/probe) 재사용 금지 — evidence only.
- background-only gate 완화 금지 — 폐기된 방향, static guard가 재발 방지 체크로 강제 중.
- placeholder/stock-like/local mock/단순 upscale-crop 금지.
- render 직행 금지 — 새 selected image set이 §3-4 QA를 통과하기 전 render 없음.
- uploadReady=false 유지 — post-render audit 통과 전 절대 true 금지.
- audit-only/threshold-only/SFX-only/upload queue 선행 금지.
