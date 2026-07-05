# Golden Sample v3.2 — Live/Action Approval Packet (Draft, No-Live)

> ⚠️ **이 문서는 live 승인이 아닙니다 (THIS IS NOT LIVE APPROVAL).**
> 이것은 미래에 Owner가 실제 live/action 실행을 승인할 때 사용할 **승인 요청서(draft)**입니다.
> 현재 상태에서 어떤 이미지/영상/TTS/render/mux/upload/browser 실행도 승인되지 않았고 수행되지 않습니다.
> `approvalGrantedNow = false`. readiness = `STANDARDIZED_NO_LIVE_READY`. 모든 live/approval flag = false.

- Task: `golden-sample-v3-2-live-action-approval-packet-standardization-v1`
- Machine-readable fixture: `scripts/fixtures/golden_sample_v3_2_live_action_approval_packet.v1.json`
- Static guard: `scripts/check-golden-sample-v3-2-live-action-approval-packet-static.mjs`
- 참조 gate: `scripts/fixtures/golden_sample_v3_2_future_execution_plan_gate.v1.json`

---

## 1. 지금 무엇이 차단되어 있는가 (What Remains Blocked)

아래 항목은 **전부 현재 차단(blocked/not approved)** 상태입니다. 정책 결정이 resolved됐다는 것은 실행 승인이 **아닙니다**.

| 도메인 | 현재 상태 | 차단 해제 조건 |
|--------|-----------|----------------|
| 이미지/브라우저 생성 (OpenAI/BFL/Imagen/Gemini-Veo/ChatGPT) | `blocked_not_approved` | Owner 명시 live 승인 + provider ALLOW_* + call/cost cap + stop 조건 + 별도 slice |
| TTS/오디오 (OpenAI TTS / ElevenLabs) | `blocked_not_approved` | Owner 명시 live 승인 + ALLOW_* + cap + stop + 별도 slice |
| Pillow/렌더 | `blocked_not_approved` | Owner 명시 승인 + font vendoring 충족 + overlay-spec audit |
| mux/audit (동영상 합성) | `blocked_not_approved` | Owner 명시 승인 + acceptance lock audit |
| Owner 직접 시청/청취 QA | `pending_manual_owner_review` | **Owner 직접 확인만 가능** (자동/기술 pass로 대체 불가) |
| 업로드 | `blocked_hard_block_active` | **가장 마지막.** Owner QA actual pass 이후 + 별도 upload slice + Owner 명시 승인 |

**핵심 구분 (혼동 금지):**

1. **정책 결정 resolved** (10/0) — 이미 완료. 그러나 실행 승인이 아님.
2. **no-live readiness / plan gate 통과** — 이미 완료. 그러나 실행 승인이 아님.
3. **미래 명시 live/action 승인** — 아직 없음. 이 packet이 그 요청서.
4. **Owner 직접 시청/청취 QA actual pass** — 아직 PENDING. 자동 대체 불가.
5. **upload 승인** — 가장 마지막. 4번(Owner QA actual pass) 선행 필수.

---

## 2. 승인 순서 (Approval Sequence — 순서 고정)

미래 승인은 아래 순서를 따릅니다. **각 단계는 Owner의 별도 명시 승인 문구를 요구하며, 어떤 단계도 지금 승인되지 않았습니다.**

1. 이미지/브라우저 live 승인
2. TTS/오디오 live 승인
3. render/mux 승인
4. **Owner 직접 시청/청취 QA actual pass** (Owner 직접 확인, 자동 불가)
5. **upload 승인** — 반드시 4번 이후, 별도 upload slice에서만

업로드는 **항상 마지막**이며 **Owner QA actual pass가 선행 조건**입니다.

---

## 3. Owner용 미래 승인 문구 (Copy-Ready, Future Use Only)

> 아래 문구는 **미래 사용 전용이며 지금 승인이 아닙니다 (FUTURE USE ONLY / NOT APPROVED NOW).**
> Owner가 실제로 이 문구를 발화할 때에만 효력이 있습니다. 이 문서에 적혀 있다는 사실은 어떤 승인도 의미하지 않습니다.
> 각 도메인은 반드시 별도로 승인해야 하며, 한 문구가 다른 도메인을 승인하지 않습니다.

### 3-1. 이미지/브라우저 live 승인 (future use only / not approved now)

```
FUTURE_USE_ONLY_NOT_APPROVED_NOW — APPROVE_LIVE_IMAGE_BROWSER: t1_lifestyle_inflation
- provider allow flag 명시: (예) ALLOW_CHATGPT_IMAGE=1 또는 ALLOW_OPENAI_IMAGE + PAID_API_ENABLED
- call count cap: N (nonzero 상한)
- cost cap: $X (nonzero 상한)
- stop conditions: provider 거절/오류/cap 초과 시 즉시 중단
- artifact audit: acceptance lock / production standard 대비 overlay-spec/typography/geometry
```

### 3-2. TTS/오디오 live 승인 (future use only / not approved now)

```
FUTURE_USE_ONLY_NOT_APPROVED_NOW — APPROVE_LIVE_TTS_AUDIO: t1_lifestyle_inflation
- provider allow flag: ALLOW_OPENAI_TTS 또는 ALLOW_ELEVENLABS
- call count cap: N / cost cap: $X
- stop conditions: provider 오류/cap 초과/script impact gate 불일치 시 중단
- artifact audit: tts audit contract audio quality gate + script impact provenance(#1)
```

### 3-3. render/mux 승인 (future use only / not approved now)

```
FUTURE_USE_ONLY_NOT_APPROVED_NOW — APPROVE_RENDER + APPROVE_MUX: t1_lifestyle_inflation
- frame/mux count cap 명시
- stop conditions: font vendoring 미충족/overlay-spec 위반/duration gap 초과 시 중단
- artifact audit: pillow renderer contract + acceptance lock / production standard
- 주의: mux md5는 TTS 비결정성으로 재생성 시 달라짐 → 동등성은 overlay-spec/typography/geometry 수준
```

### 3-4. Owner 직접 시청/청취 QA 결과 (future use only / not approved now)

```
FUTURE_USE_ONLY_NOT_APPROVED_NOW — OWNER_QA_ACTUAL_PASS: t1_lifestyle_inflation
- Owner가 직접 최종 영상을 시청하고 오디오를 청취하여 실제 품질 통과를 확인함
- 자동/기술 pass로 대체 불가. 이 확인 없이는 upload 승인 불가.
- 이 문구 발화 시에만 ownerViewingListeningActualStatus가 PASS로 기록됨 (지금은 PENDING).
```

### 3-5. upload 승인 (future use only / not approved now — 가장 마지막)

```
FUTURE_USE_ONLY_NOT_APPROVED_NOW — APPROVE_UPLOAD: t1_lifestyle_inflation
- 선행 조건: 3-4 OWNER_QA_ACTUAL_PASS 확인 완료 (필수)
- 별도 upload slice에서만 실행
- upload hard block 해제는 이 승인 + 별도 upload slice에서만
- stop conditions: Owner QA actual pass 미확인 시 upload 금지
```

---

## 4. 불변 사항 (Invariants — 이 packet이 바꾸지 않는 것)

- readiness = `STANDARDIZED_NO_LIVE_READY` (승격 없음)
- upload hard block = **active** (계속 차단)
- `ownerViewingListeningActualStatus` = `PENDING_DIRECT_OWNER_REVIEW`
- `ownerQaPassed` = false
- `uploadReady` / `productionReady` / render / image / TTS / browser / live flags = **모두 false**
- `approvalGrantedNow` = false

이 packet은 **승인 요청서**일 뿐입니다. 승인 자체는 Owner가 위 문구를 명시적으로 발화하고, 별도 live slice가 그 승인 범위 안에서 실행될 때에만 발생합니다.
