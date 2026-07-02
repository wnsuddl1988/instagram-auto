# Golden Sample FLUX2 Selected Image Set Lock v1 (2026-07-02)

Task: `creative-v2-flux2-selected-image-set-lock-and-caption-contract-v1`

기계 판독용 원본: `scripts/fixtures/golden_sample_flux2_selected_image_set_lock.v1.json`

## 1. Lock 대상 — T2 "월급이 3일 만에 사라지는 이유" 6-scene set

| Scene | 역할 | 채택 버전 | 파일 | QA |
|-------|------|-----------|------|-----|
| 1 | 월급 도착 hook | v2.3 | `flux2-scene1-v2-3-single-validation/flux2s1v23-scene-01-...jpg` | PASS (플랩 별도 판정 PASS) |
| 2 | 누수 순서 | v1 | `flux2-small-validation-v1/flux2-scene-02-...jpg` | PASS (v1 유일 클린, 전략 원형) |
| 3 | 고정비 압박 | v2 | `flux2-object-whitelist-validation-v2/flux2wl-scene-03-...jpg` | PASS (v2 최고 전달력) |
| 4 | 자동결제 반복 | v2 | `flux2-object-whitelist-validation-v2/flux2wl-scene-04-...jpg` | PASS |
| 5 | 3일 뒤 빈 지갑 | v2.1 | `flux2-object-whitelist-v2-1-wallet-patch-validation/flux2wl21-scene-05-...jpg` | PASS (각인 소멸+공허 성립) |
| 6 | reset/action 엔딩 | set-v1 | `flux2-selected-image-set-completion-v1/flux2set-scene-06-...jpg` | PASS (첫 시도 클린) |

전 파일 MD5/크기가 fixture에 기록됨 — render 입력 시 대조, 불일치면 중단.

## 2. Lock 근거

- **6/6 native 1088x1936** (upscale/crop-as-fix 0건).
- **6/6 no-text strict PASS** — 가독 텍스트/숫자/로고/워터마크/각인/스탬프 0건 (qaGateV2 엄격 기준).
- 서사 전 구간 커버: hook → 누수 → 고정비 → 자동결제 → 빈 지갑 → 행동.
- OpenAI 추가 결제 없이 FLUX2 object-whitelist route(구성/표면/구도 3층 통제)로 확보 — 총 13 create calls, 누적 추정 ~$0.83.

## 3. 유지되는 금지/정책

- 기존 941x1672 ChatGPT set은 evidence/reference only — final render 입력 금지 (Owner correction).
- placeholder/local mock/stock fallback/단순 upscale 금지.
- 향후 자동화에서도 per-shot QA gate + regenerate/skip 필수 (FLUX2 마크는 stochastic prior — lock된 실물 파일 기준으로만 품질 보장).

## 4. 상태와 다음 게이트

- `renderReady=false` / `uploadReady=false` / `requiresOwnerVisualQaBeforeRender=true` / `noFurtherImageGenerationApproved=false`.
- 다음 단계(renderer/TTS/mux)는 각각 별도 Owner 승인 필요.
- render 시 자막은 신규 `golden_sample_reels_dynamic_caption_contract.v1.json` 필수 적용 (하단 고정 자막 금지 — `_ai/GOLDEN_SAMPLE_REELS_DYNAMIC_CAPTION_CONTRACT_V1.md` 참조).
