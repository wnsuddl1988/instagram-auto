# Golden Sample v3.2 — Live TTS/Audio Approval Packet

> ## ⛔ 이것은 LIVE 승인이 아닙니다 (NOT LIVE APPROVAL)
>
> 이 문서는 **다음 Owner 승인에 쓸 준비물(future-use-only)**입니다.
> 이 문서의 존재 자체는 어떤 TTS/audio 실행도 승인하지 않습니다.
> - `approvalGrantedNow = false`
> - `liveTtsAudioApprovedNow = false`
> - `providerSelectedNow = false`
>
> 실제 live TTS/audio 실행은 Owner가 아래 **승인 문구를 명시적으로 발화**할 때에만,
> 그리고 **별도 live TTS/audio slice**에서만 시작됩니다.

- Task ID: `golden-sample-v3-2-existing-image-set-acceptance-and-live-tts-audio-approval-prep-v1`
- 기계판독 fixture: `scripts/fixtures/golden_sample_v3_2_live_tts_audio_approval_packet.t1_lifestyle_inflation.v1.json`
- 정적 가드: `scripts/check-golden-sample-v3-2-live-tts-audio-approval-packet-static.mjs`

---

## 1. Owner 승인 원문 (이번 slice에서 승인된 것)

```
APPROVE_EXISTING_IMAGE_SET_AND_PREPARE_LIVE_TTS_AUDIO: t1_lifestyle_inflation — existing 9 images accepted, no image regeneration, prepare next approval packet for TTS/audio only
```

이 승인의 정확한 범위:
- ✅ 첫 live image/browser slice에서 나온 **기존 9개 이미지 세트를 채택**함.
- ✅ no-live **TTS/audio approval packet(이 문서)을 준비**함.
- ⛔ 이미지 **재생성은 승인되지 않음** (`imageRegenerationApprovedNow = false`).
- ⛔ live TTS/audio **실행은 승인되지 않음**.

---

## 2. 기존 9개 이미지 세트 채택 (accepted, no regeneration)

첫 live image/browser slice(`ff1847f feat(golden-sample): record live image browser run`) 결과:

| 항목 | 값 |
|------|-----|
| provider | `ALLOW_CHATGPT_IMAGE` |
| submitted | `0 / 12` |
| saved | `9 / 9` (전부 `existing_file_skip`) |
| costUsd | `0` |
| autoRetryPerformed | `false` |
| placeholderUsed | `false` |
| 이미지 프로필 | vertical 9:16 (실측 941x1672) |

채택된 9개 이미지 md5 (summary JSON 증거 기준):

| order | imageId | md5 |
|-------|---------|-----|
| 1 | img_31_hook_envelope_vs_empty_jar | `a7a3150aa3a54fba9e8f392bcf3fa136` |
| 2 | img_32_problem_wallet_check_night | `8953f340162d56d27ea78d925545d6a9` |
| 3 | img_33_causeA_orderly_fixed_outflow | `196553d78e229c4514f74afaed4110fd` |
| 4 | img_34_causeB_scattered_lifestyle_spend | `9e197e342098dc4e86356200d8811692` |
| 5 | img_35_illusion_one_bill_vs_receipt_wall | `7b0a355c8494f658e0b7ec485d9737fb` |
| 6 | img_36_reframe_three_empty_jars | `f0f2ff998462126ef66ac395b3e37b2f` |
| 7 | img_37_actionA_dividing_into_jars | `dc7b0c55dfac4f0bcd4fae55e1873a38` |
| 8 | img_38_actionB_three_jars_color_ribbons | `5e6d0112198f104a391af2767cf3a506` |
| 9 | img_39_result_settled_morning_shelf | `93f665f652170a2a3101b8da611f5701` |

증거 경로 (read-only):
- `output/money-shorts/chatgpt-playwright-fresh-image-set-v3/image-generation-summary.v3.json`
- `output/money-shorts/chatgpt-playwright-fresh-image-set-v3/generation-latency-report.v3.json`

**이 9개 세트가 다음 TTS/audio 단계의 시각 입력입니다. 이미지 재생성은 하지 않습니다.**

---

## 3. 미래 TTS/audio 승인에 필요한 항목 (지금은 아무것도 선택/활성화 안 됨)

live TTS/audio 승인이 유효하려면 Owner가 아래를 **전부 명시**해야 합니다:

| 필드 | 현재 상태 | 미래 요건 |
|------|-----------|-----------|
| **provider** | ⛔ 미선택 (`providerSelectedNow = false`) | `ALLOW_OPENAI_TTS` 또는 `ALLOW_ELEVENLABS` 중 Owner 명시 선택 |
| **call cap** | ⛔ 미설정 (`callCapEffectiveNow = false`) | TTS API 호출 상한. 계약 `apiCallBudgetMax = 2` 이내, Script Impact Gate PASS 전 0회 |
| **cost cap** | ⛔ 미설정 (`costCapEffectiveNow = false`) | USD 비용 상한 명시 |
| **stop conditions** | — | provider 오류/cap 초과/Script Impact Gate FAIL/provenance 불일치/audio gate fail 시 중단 |
| **Script Impact Gate provenance** | 계약 참조 | required 6점수 + hard-fail 0 + `codex_judge` provenance 완비 (실패 시 TTS 호출 전 abort) |
| **audio quality gate audit** | 계약 참조 | 6개 서브체크 AND (beginning/first5s/ratio/speechActive/tailHold/notClippedTail) |

계약 참조:
- `scripts/fixtures/golden_sample_v3_2_tts_audio_audit_contract.v1.json`
- `scripts/fixtures/golden_sample_v3_2_tts_audio_audit_sample_plan.t1_lifestyle_inflation.v1.json`

> **provider / call cap / cost cap은 Owner가 명시 승인하기 전까지 선택되지 않습니다.**

---

## 4. 미래 사용 전용 승인 문구 (FUTURE_USE_ONLY — 지금 승인 아님)

아래 문구는 **복사용 준비물**입니다. Owner가 실제로 발화할 때에만 효력이 있습니다.

OpenAI TTS 경로:

```
FUTURE_USE_ONLY_NOT_APPROVED_NOW — APPROVE_LIVE_TTS_AUDIO: t1_lifestyle_inflation — provider ALLOW_OPENAI_TTS, call cap N, cost cap $X, Script Impact Gate PASS 선행, stop on provider error/cap/gate fail
```

ElevenLabs 경로:

```
FUTURE_USE_ONLY_NOT_APPROVED_NOW — APPROVE_LIVE_TTS_AUDIO: t1_lifestyle_inflation — provider ALLOW_ELEVENLABS, call cap N, cost cap $X, Script Impact Gate PASS 선행, stop on provider error/cap/gate fail
```

`N`, `$X`, provider는 Owner가 발화 시 확정합니다.

---

## 5. render / mux / upload은 계속 차단

이 TTS/audio packet은 **render/mux/upload과 무관**합니다. 각각 별도 도메인 승인이 필요하며 순서 규칙을 따릅니다:

```
1. image/browser live approval        ✅ (완료 — 기존 9개 채택)
2. tts/audio live approval             ⛔ (이 packet은 준비물일 뿐, 승인 아님)
3. render/mux approval                 ⛔ 차단
4. Owner direct viewing/listening QA   ⛔ PENDING (자동 대체 불가)
5. upload approval                     ⛔ hard block active (4단계 이후에만 후보)
```

- `renderApprovedNow = false`
- `muxApprovedNow = false`
- `uploadApprovedNow = false` — **upload hard block 계속 active**
- `ownerViewingListeningActualStatus = PENDING_DIRECT_OWNER_REVIEW`

순서 규칙 상세: `scripts/fixtures/golden_sample_v3_2_live_action_approval_packet.v1.json#approvalSequenceRule`

---

## 6. 정적 가드

이 packet이 live 승인으로 오독되지 않도록 fail-closed 가드가 검증합니다:

```
node scripts/check-golden-sample-v3-2-live-tts-audio-approval-packet-static.mjs
```

가드가 fail-closed 하는 mutant: 현재 live TTS 승인 true / provider 선택 / upload·render·mux true / 이미지 재생성 승인 / 채택 이미지 수 불일치 / submitted·cost drift / future-use-only 라벨 누락 / stop 조건 누락 / audit 참조 누락.

---

*이 문서와 fixture는 no-live 준비물입니다. 어떤 실행도 승인하지 않으며, readiness verdict를 `STANDARDIZED_NO_LIVE_READY` 위로 올리지 않습니다.*
