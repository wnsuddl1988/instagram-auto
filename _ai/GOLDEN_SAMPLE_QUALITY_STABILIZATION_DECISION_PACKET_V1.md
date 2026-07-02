# Golden Sample Quality Stabilization — Decision Packet v1

- 작성일: 2026-07-02
- Task ID: `creative-v2-golden-sample-quality-stabilization-decision-pack-v1`
- 성격: **Owner 판단 자료** — 구현/render/live generation/TTS/mux/upload 아님
- 최우선 source of truth: `_ai/CREATIVE_V2_GOLDEN_SAMPLE_ABSOLUTE_RULES.md` (Owner 절대규칙 원문, 무수정). 이 packet이 원문과 충돌하면 항상 원문이 우선한다.

---

## 1. 목표 재정의

**현재 목표는 "자동화 전 Golden Sample 품질 안정화"다.**

- Golden Sample은 금리동결 주제 하나를 어떻게든 완성하는 작업이 아니다.
- 목적은 자동화 전에 "좋은 쇼츠가 실제로 나오는 생성 구조/품질 문법"을 안정화하는 것이다.
- 품질 문법은 **이미지/대본/TTS/카드/모션/리듬/audit** 전 차원을 함께 다뤄야 한다 (절대규칙 §0의 A~E 실패 원인이 모두 이 차원들이다).
- 이 문법은 이후 경제, 돈, 심리, 성공, 생활 판단, 현금흐름, 성장 서사 주제로 확장 가능해야 한다.
- 대량 자동화 파이프라인(topic list → 후보 생성 → scorer/audit → final render → metadata → upload queue readiness) 방향 자체는 유지하되, **품질 문법이 안정화되기 전에는 자동화 확장으로 가지 않는다** (절대규칙 §12: "먼저 Golden Sample 1개를 살려라. 그 다음에 자동화 확장으로 돌아간다").

## 2. 금리동결의 위치

**금리동결은 고정 주제가 아님.** 현재 샘플/테스트 주제일 뿐이다.

- 절대규칙의 금리동결 30초 구조(§4)는 "품질 문법을 검증하기 위한 예시 시나리오"로 유지 가치가 있다.
- 그러나 "금리동결 하나만 맞추는 좁은 최적화"는 목표가 아니다. 주제가 바뀌어도 재사용되는 구조(hook card, checklist card, twist, TTS-first, perceptual event)가 진짜 산출물이다.

## 3. 살릴 것 (구조/증거로 보존 — 삭제 금지)

| 항목 | 보존 형태 | 이유 |
|------|----------|------|
| card-image hybrid renderer의 **카드/텍스트/모션 레이어** | `render-money-shorts-card-image-hybrid-v1.mjs`의 ASS 카드 렌더(PlayResX/Y=1080x1920), 모션 프리셋(card_punch_zoom/checklist_pop/card_slide_in/freeze_punch) | 주제와 무관하게 재사용되는 품질 문법의 핵심 |
| **perceptual event count 구조** | blueprint phases[].perceptualEvents = single source → manifest → renderer actual report 소비 체계 (planned 18 = actual 18 검증됨) | "planned ≠ perceptual" 실패의 재발 방지 장치 |
| **first 2s hook card 검증** | gate + report 필드 (firstTwoSecondHookCardPresent) | 절대규칙 hard fail 항목 |
| **card presence ratio / full-screen dominance 지표** | perceptual_event_report (실측 1.0 / 0.0) | image-first slide 회귀 방지 지표 |
| **render_manifest / actual_card_timeline / perceptual_event_report 체계** | renderer 산출 3종 + static guard 검증 | audit이 소비하는 구조적 증거 체계 |
| **ChatGPT live path 해상도 한계 evidence** | 941x1672 = 고정 픽셀 예산(~1.57MP)의 9:16 재배분, 5중 증거(기존 7장 + 오늘자 probe + composer 옵션 부재 + srcset 부재 + 명시적 해상도 지시 무효), `output/money-shorts/rate-freeze-golden-sample-regen-v1/` recon/probe summary | 이미지 source 결정의 실측 근거 |
| 기존 **visual-only render 산출물** (`golden_sample_rate_freeze_visual_only.mp4`, 1080x1920/30s/18 events) | **"렌더러/카드 구조/메트릭 검증 evidence"로만** 보존 | **Golden Sample 품질 통과물이 아님** — 배경 이미지가 폐기된 세트이므로 품질 후보 자격 없음 |

## 4. 버릴 것 (폐기된 방향)

1. **기존 selected image set final 사용 금지** — 기존 6장(941x1672)은 generic하고 주제 전달력이 약하다는 것이 원 지시의 실패 진단(§0.D)이다. 해상도 이전에 품질 실패다. final render 입력으로 쓰지 않는다. evidence/reference로만 보존.
2. **probe image final 사용 금지** — one-scene probe 이미지(scene-01-hook.png)는 해상도 한계 실측 증거일 뿐이다.
3. **background-only gate 완화 폐기** — 941x1672를 dim/blur 배경 용도로 허용하던 방향(구 A안)은 폐기됐다. 해상도 우회는 이미지 품질 문제(주제 전달력)를 해결하지 못하며 복구 목표를 위반한다. ※ 현재 repo 미커밋 diff에 이 방향의 fixture/renderer/guard 변경이 남아 있다 — §7 참조.
4. **audit-only / threshold-only / SFX-only / upload queue 선행 금지** — 절대규칙 §3 그대로.
5. **금리동결 하나만 맞추는 좁은 최적화 금지** — §2 참조.
6. (유지 규칙) **좋은 이미지 없으면 render 금지** — 절대규칙 §12 원문 "좋은 이미지가 없으면 렌더하지 않는다"를 그대로 유지한다. placeholder/plain color/local mock/stock-like fallback/단순 upscale-crop 전부 금지 유지.

## 5. 현재 사실 근거 (결정에 필요한 실측 evidence)

1. **이미지 실패는 이중 실패다**: (a) 주제 전달력 — 금리/대출/예금/현금흐름을 이미지가 직접 설명하지 못함(절대규칙 §0.D), (b) 해상도 — 941x1672 < 1080x1920 gate(절대규칙 §1).
2. **ChatGPT live path는 9:16에서 941x1672가 상한** (2026-07-02 실측 확정): 프롬프트/주제를 바꿔도 캔버스 크기는 변하지 않는다. 즉 이 경로 단독으로는 (b)를 해결할 수 없다.
3. **카드/모션/타임라인/메트릭 구조는 검증 완료**: visual-only 렌더가 1080x1920/30.000s/18 perceptual events/hook card ✓/dominance 0.0을 실측 통과 — 단, 이 mp4는 구조 검증 evidence일 뿐 품질 통과물이 아니다.
4. **TTS-first 계약, post-render audit 체계, static guard**는 이미지 source와 독립적으로 유효하다.

## 6. Owner 결정 선택지 — 이미지/비주얼 품질 복구

> 공통 전제: 어떤 선택지든 "새 selected image set이 owner 시각 QA + image quality gate를 통과"하기 전에는 render로 가지 않는다.

### 선택지 1 — 기존 ChatGPT/LLM path 유지 + prompt/visual direction 강화 재설계

이미지 자체의 **주제 전달력**(§0.D 실패)을 우선 개선. 절대규칙 §7의 visual director contract를 더 강하게: 오브젝트 밀도, 금융 정보의 시각적 은유, 질감/입체감, scene별 must_show/must_avoid 구체화.

- **필요 승인**: live ChatGPT 재생성 (ALLOW_CHATGPT_IMAGE + Owner 승인). 추가 비용 없음(기존 브라우저 세션).
- **위험**: ⚠️ **해상도 941x1672 상한은 그대로다.** 주제 전달력이 개선돼도 1080x1920 gate를 통과할 수 없어, 이 선택지 **단독으로는 final render에 도달 불가** (background-only 완화가 폐기됐으므로). 선택지 2와 결합하거나, Owner가 gate 자체를 재판단해야 완결된다.
- **금지사항**: 941x1672 결과물의 upscale/crop-as-fix, gate 완화 재시도.
- **검증 기준**: 재생성 이미지의 owner 시각 QA(주제 전달력/질감/generic 여부) + 해상도 실측. gate 미달 사실은 그대로 보고.

### 선택지 2 — 1080x1920+ 가능한 더 강한 image provider/path 추가 승인

해상도 (b)를 구조적으로 해결할 수 있는 **유일한 선택지**. 예: size 파라미터를 지원하는 유료 이미지 생성 API 등 "LLM 기반 이미지 생성"의 범주를 유지하는 경로 (절대규칙 §1의 required_provider_path는 "chatgpt_or_llm_image_generation"이므로, LLM 기반이면 원문 취지 유지 — 단 경로 변경 자체는 Owner 명시 승인 필요).

- **필요 승인**: 유료 API/신규 의존성/credential/외부 서비스/브라우저 워크플로 각각에 대한 Owner 명시 승인 (env/secret 변경 포함 가능 — 해당 범주 승인 필수).
- **위험**: 비용 발생, provider별 품질 편차(“다른 방식으로 대체하면 이미지 퀄리티가 떨어진다”는 원문 우려 — 반드시 소량 테스트로 검증 후 확정), 통합 작업량.
- **금지사항**: placeholder/stock-like 경로로의 하향 대체, 승인 없는 dependency/env 변경, 테스트 없이 일괄 채택.
- **검증 기준**: 소량 테스트 생성 → 실측 1080x1920+ / 9:16 / 주제 전달력 / no-text / no-watermark → owner 시각 QA → 새 selected image set 확정 → gate 재실행.

### 선택지 3 — topic을 시각적으로 강한 돈/심리/성공/경제 주제로 교체

금리동결은 시각적 은유가 약한 주제일 수 있다(문서/통장/달력 중심). 시각 전달력이 강한 주제(예: 현금흐름의 흐름 시각화, 심리적 소비 함정, 성공 서사의 before/after)로 Golden Sample을 다시 잡으면 이미지 (a) 문제의 난이도가 내려간다.

- **필요 승인**: Golden Sample 주제 변경에 대한 Owner 승인 + 새 주제 확정. (Owner 최신 보정이 이미 "금리동결은 테스트 주제"라 명시했으므로 방향 자체는 열려 있음. 단 절대규칙 §3의 "새 topic 확장 금지"는 대량 확장 금지이며, 단일 Golden Sample 주제 교체는 별개 — 그래도 명시 승인 필요.)
- **위험**: ⚠️ 해상도 상한은 여전히 그대로 — **이 선택지도 단독으로는 (b)를 해결 못 한다** (선택지 2와 결합 필요). 주제 교체 시 script/blueprint/prompt 재작업 필요.
- **금지사항**: 대량 topic 확장으로의 변질, 기존 금리동결 구조 산출물 삭제(문법 검증 evidence로 보존).
- **검증 기준**: 새 주제의 hook 강도/시각 은유 후보를 문서로 먼저 검토 → 이미지 테스트 생성 → owner 시각 QA.

### 선택지 4 — skip_topic

절대규칙 §1이 허용하는 경로(regenerate 불가 시 skip)이지만, **Golden Sample 품질 안정화 목표와 충돌한다** — skip만 반복하면 품질 문법이 검증되지 않고 자동화 전 안정화가 완료되지 않는다. 단독 선택지로 권장하지 않음.

- **필요 승인**: Owner의 명시적 skip 결정.
- **위험**: 안정화 목표 미달성, 복구 단계 장기화.
- **검증 기준**: 해당 없음(작업 중단이므로) — 대신 다음 주제/경로 결정이 반드시 따라와야 함.

## 7. 부수 결정 필요 사항 (Codex/Owner)

- **미커밋 A안 잔재 정리**: 현재 repo 미커밋 diff에 폐기된 방향의 변경이 남아 있다 — `image_generation_contract.json`(background_only_image_gate 섹션), `card_image_hybrid_render_manifest.v1.json`(941x1672 gate), `render-money-shorts-card-image-hybrid-v1.mjs`(gate 문구/필드), `check-money-shorts-golden-sample-recovery-static.mjs`(background gate 체크 24개), `golden_sample_recovery_report.v1.json`/`post_render_artifact_audit.samples.v1.json`(A안 반영 문구). 이 변경들을 (a) revert할지, (b) "폐기된 방향" 표시로 남기고 새 방향으로 재작업할지 Codex 결정 필요. 이번 packet 작업에서는 지시대로 코드/fixture를 수정하지 않았다.
- **blueprint/HANDOFF의 금리동결 고정 문구**: 주제 교체(선택지 3) 채택 시 blueprint 재작성 범위 결정 필요.

## 8. 최종 추천

**"먼저 좋은 이미지/비주얼 source를 확보하는 결정"이 최우선이다. render로 바로 가지 않는다.**

추천 순서:

1. **선택지 2를 주 결정으로 검토** — 1080x1920 gate와 주제 전달력을 동시에 만족할 수 있는 유일한 구조적 해법. 승인 범위(유료 API/의존성/credential)를 Owner가 확정.
2. **선택지 1의 visual director 재설계를 결합** — 어떤 provider를 쓰든 "이미지 자체의 주제 전달력" 프롬프트 강화는 필요하다. 선택지 2 확정 전이라도 문서/프롬프트 재설계는 선행 가능(생성 실행은 승인 후).
3. **선택지 3은 2와 함께 판단** — 시각적으로 강한 주제로의 교체는 품질 문법 검증을 쉽게 만들 수 있으나, 해상도 해법(2) 없이는 단독 완결이 안 된다.
4. skip(선택지 4)은 최후 수단 — 안정화 목표와 충돌.

공통 게이트 (어느 조합이든):

- 새 selected image set: 6/6 실측 1080x1920+ / vertical 9:16 / 주제 전달력 owner 시각 QA / no readable text / no watermark / generic-stock 금지
- 이 세트가 확정되기 전에는 **render 금지** ("좋은 이미지 없으면 render 금지")
- uploadReady는 post-render audit 통과 전 절대 true 금지

## 9. 이 문서가 하지 않는 것

- 구현/코드 수정 없음. 이미지 생성/live API/render/TTS/mux/upload 실행 없음.
- 절대규칙 원문 수정 없음.
- background-only gate 완화나 기존 이미지 재사용을 승인된 방향으로 기술하지 않음 — 둘 다 폐기된 방향이다.
