# Golden Sample Visual Quality & Card Motion Contract v1 (2026-07-02)

Task: `creative-v2-visual-quality-and-card-motion-contract-v1`

기계 판독용 원본:
- `scripts/fixtures/golden_sample_visual_quality_benchmark.v1.json` (benchmark + FLUX2 contract)
- `scripts/fixtures/golden_sample_card_motion_contract.v1.json` (card/motion/TTS 싱크 contract)

## 1. 정확한 진행 순서 (고정)

1. **Visual Quality Benchmark** — OpenAI recommended 3장(`scene-01A`/`scene-02A`/`scene-03A`)을 품질 기준 샘플로 고정. ✅ 이 slice에서 완료
2. **FLUX2 Image Contract** — FLUX2가 benchmark를 따라오도록 prompt/gate 강화 계약. ✅ 이 slice에서 완료
3. **Card-First Motion Design Contract** — 카드/모션/타이포/체크리스트/TTS 싱크 계약. ✅ 이 slice에서 완료
4. **Next Step Gate** — Owner가 이 계약을 검토·승인한 뒤에만 FLUX2 소량 validation(장수/비용 별도 승인). **render/TTS/mux/upload는 계속 금지.**

## 2. OpenAI 3장을 기준 샘플로 삼는 이유

- 실측으로 검증된 유일한 "전 항목 통과" 세트: native 1088x1936 gate PASS + **no-text 위반 0건** + 손/오브젝트 왜곡 0건 + 씬 은유 전달 + overlay safe-area.
- 941x1672 기존 세트가 실패한 지점(해상도·generic·텍스트 위험)을 전부 뒤집은 실물 증거라서, 추상적 기준 문서보다 강한 기준점이 된다.
- 단, **benchmark는 품질 자동 보장이 아니다** — 균일성은 gate + QA + regenerate/skip 정책으로 강제한다(fixture에 명시).

## 3. FLUX2를 운영 후보로 두되 바로 실행하지 않는 이유

- 장점 실측: native 1088x1936 4/4, 질감 최상급, ~20s/장 최속, MP-based 최저가 추정 → **양산 운영에 가장 적합한 프로파일**.
- 실패 실측: no-text 지시를 반복 위반(폰 화면 유사 한글+UI, 지폐 숫자, 영수증 문자열, 봉투 인쇄) → **텍스트 억제 순응도가 OpenAI보다 낮음**.
- 따라서 benchmark 기반으로 강화한 프롬프트 계약(화면 기기 최소화, 오브젝트별 blank 명시, 통화 묘사 금지 등)을 먼저 고정하고, 그 계약으로 소량 validation을 해야 헛 호출·저품질 고착을 막는다.
- Midjourney는 자동화 적용성 낮음으로 제외(Owner 지시). OpenAI 추가 결제 없음(Owner 지시) — OpenAI는 기준 샘플 공급자 역할로 종료.

## 4. 카드/모션이 품질을 떨어뜨리지 않게 하는 조건 (요약)

- **주연 선언**: 카드는 이미지 땜빵이 아니라 정보 전달의 주연 레이어. 이미지=무대, 카드=주연, 모션=TTS 리듬의 시각화.
- **카드 템플릿 7종**: hook / contrast / checklist / number_drop / mini_graph / twist / final_action — 각각 진입 모션·최대 줄수·최대 노출 시간 고정.
- **타이포 리듬**: 1 card = 1 idea, 최대 2줄(체크리스트만 항목 4줄), 강조 1~2단어, 의미 단위 줄바꿈, 폰트 2종.
- **모션 리듬**: punch zoom / slide-in / checklist pop / number count / graph fill / pause-before-impact — easing 표준화, 같은 모션 3연속 금지, 지배 모션 동시 1개.
- **TTS 싱크**: 카드 진입 = phrase 발화 ±120ms, 강조 = 해당 단어 발화 순간, 퇴장 = 다음 phrase 전 완료. 오디오가 타임라인의 주인(패딩 금지).
- **perceptual event 강화**: pan/zoom 단독은 event 아님. **30s 최소 14 events(기존 12에서 강화)** + 이벤트 간 최대 3.0s + 모든 5s 구간 최소 2 events + 첫 2s 최소 2 events.
- **첫 2초 hook**: big hook card + 이미지 맥락 + impact motion 필수. 로고/빌드업/정지화면 금지.
- **readability gate**: 1080x1920, 모바일 safe-area(상180/하340/좌우60px), 본문 54px+/강조 90px+, 대비 4.5:1+, 카드 점유 60% 상한.
- **anti-cheap-PPT**: 기본 fade/wipe 금지, 클립아트/텍스트 벽/무지개 그라데이션 금지, 오디오와 무관한 장식 모션 금지.
- **post-render frame audit**: 0/2/5/10/15/20/26/30s 프레임 QA + silencedetect/duration gap — fail 1건이면 후보 reject. ffprobe 통과는 품질 증거가 아님.

## 5. 상태 및 다음 승인 필요 항목

- `renderReady=false`, `uploadReady=false` — 변경 없음.
- 이 slice에서 provider 호출/이미지 생성/render/TTS/mux/upload 없음.
- **다음 승인 필요 (Owner):**
  1. 이 계약 3종(benchmark/FLUX2 contract/card-motion contract) 승인 여부
  2. 승인 시 FLUX2 소량 validation의 장수·비용 상한·BFL_API_KEY 사용 승인
  3. (별개) scene 4~6 coverage 전략 — FLUX2 validation 결과에 따라 6-scene set 완성 경로 결정
