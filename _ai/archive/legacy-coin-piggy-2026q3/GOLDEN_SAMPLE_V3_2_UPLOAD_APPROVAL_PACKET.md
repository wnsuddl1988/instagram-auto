# Golden Sample v3.2 — Upload Approval Packet (t1_lifestyle_inflation)

> **⚠️ NOT UPLOAD APPROVAL / 준비 문서입니다.**
> 이 문서는 upload 실행 승인이 **아닙니다.** Owner가 최신 mux 후보를 직접 시청/청취하여 QA를 통과했다는 사실을 기록하고, 미래에 upload를 명시 승인할 때 사용할 **future-use-only** 요청서를 준비할 뿐입니다.
> **지금 어떤 upload도 실행되지 않으며, upload hard block은 계속 active입니다.**
> `uploadApprovalGrantedNow: false` · `uploadReady: false` · `productionReady: false` · `uploadHardBlockActive: true`

---

## 1. 현재 상태 요약

| 항목 | 상태 |
|------|------|
| Owner QA actual pass (직접 시청/청취) | ✅ **통과** (approvalSequenceRule 4단계 충족) |
| upload 실행 승인 (5단계) | ❌ **미승인** — 별도 `APPROVE_UPLOAD` + 별도 upload slice 필요 |
| upload hard block | 🔒 **계속 active** (`/api/upload` POST → 403 `UPLOAD_BLOCKED_BY_GOLDEN_SAMPLE_GUARD`) |
| readiness verdict | `STANDARDIZED_NO_LIVE_READY` (불변) |
| `uploadReady` / `productionReady` | `false` / `false` (불변) |

---

## 2. Owner QA Actual Pass 문구 (기록됨)

```
OWNER_QA_ACTUAL_PASS: t1_lifestyle_inflation — latest mux mp4 watched/listened directly by Owner, visual/caption/story/audio accepted, proceed to prepare upload approval packet only; no upload execution yet
```

- **통과 근거**: Owner 직접 시청/청취 (`OWNER_DIRECT_VIEWING_LISTENING`) — 자동/기술 pass 아님.
- **수용 차원**: visual / caption / story / audio.
- **명시 지시**: "proceed to prepare upload approval packet **only**; no upload execution yet."
- **기록 fixture**: `scripts/fixtures/golden_sample_v3_2_owner_qa_actual_pass.t1_lifestyle_inflation.v1.json`

이 QA 통과는 upload 승인의 **선행 조건**일 뿐 upload 승인 **자체가 아닙니다.**

---

## 3. 최신 Upload 대상 후보 (지목만, 실행 안 함)

- **latest mux mp4**:
  `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4`
- **render/mux run plan**: `scripts/fixtures/golden_sample_v3_2_live_render_mux_run_plan.t1_lifestyle_inflation.v1.json`
- **render/mux checkpoint**: `adbcb4b feat(golden-sample): record live render mux run`
- **자동 audit verdict (Owner 리뷰 전)**: `PASS_CANDIDATE_PENDING_VISION_QA` (media/audio/caption-card/story 4-gate PASS)
- **artifact audit JSON**: `...\post_render_artifact_audit_tts_mux.v3_2.json`

> upload 승인 시 이 산출물을 upload 직전 acceptance lock / production standard 대비 **최종 audit**해야 합니다.

---

## 4. Upload은 지금 차단 상태입니다

- `/api/upload` POST는 `evaluateGoldenSampleUploadHardBlock` (lib/upload-hard-block.ts)에 의해 **403** 반환 상태를 유지합니다.
- `uploadInstagramReel` / `uploadYouTubeShorts` / `updateGenerationStatus(..., "uploaded", ...)`는 호출 금지 대상입니다.
- unblock은 **별도 upload-readiness slice + Owner 명시 `APPROVE_UPLOAD`** 전까지 불가합니다.
- 정책 참조: `scripts/fixtures/golden_sample_v3_2_upload_hard_block_policy.v1.json`

---

## 5. 미래 Upload 승인 문구 (FUTURE-USE-ONLY — 지금 승인 아님)

> 아래 문구는 Owner가 **실제로 발화할 때에만** 효력이 있습니다. 이 문서에 존재한다는 사실은 어떤 upload 승인도 의미하지 않습니다.

```
FUTURE_USE_ONLY_NOT_APPROVED_NOW — APPROVE_UPLOAD: t1_lifestyle_inflation — upload target=C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4, upload cap=1, platforms=<Instagram|YouTube|both>, no regeneration, no render/mux/TTS/image/browser, allow upload endpoint/credentials only for selected platforms, stop on upload hard-block mismatch/credential missing/platform error/cap exceeded/unexpected response
```

### 미래 upload 승인 후보가 되기 위한 요건 (별도 upload slice에서만)

1. Owner의 명시 `APPROVE_UPLOAD` 문구 (Owner QA actual pass와 구분되는 upload 실행 승인)
2. upload 대상 mux mp4 경로 (위 latest mux mp4)
3. `upload cap` (nonzero, 미래 slice에서만 유효)
4. 대상 플랫폼 (`Instagram` | `YouTube` | `both`)
5. 선택 플랫폼 자격증명만 read 허용 (그 외 env/secret 금지)
6. stop conditions: upload hard-block mismatch / credential missing / platform error / cap exceeded / unexpected response 즉시 중단
7. upload 직전 acceptance lock / production standard 대비 최종 audit
8. no regeneration, no render/mux/TTS/image/browser 재실행 명시

---

## 6. 참조 (historical prerequisite)

| 아티팩트 | 경로 |
|----------|------|
| Owner QA actual pass fixture | `scripts/fixtures/golden_sample_v3_2_owner_qa_actual_pass.t1_lifestyle_inflation.v1.json` |
| upload approval packet fixture | `scripts/fixtures/golden_sample_v3_2_upload_approval_packet.t1_lifestyle_inflation.v1.json` |
| render/mux run plan | `scripts/fixtures/golden_sample_v3_2_live_render_mux_run_plan.t1_lifestyle_inflation.v1.json` |
| upload hard block policy | `scripts/fixtures/golden_sample_v3_2_upload_hard_block_policy.v1.json` |
| future execution plan gate | `scripts/fixtures/golden_sample_v3_2_future_execution_plan_gate.v1.json` |
| integrated readiness contract | `scripts/fixtures/golden_sample_v3_2_integrated_production_readiness_contract.v1.json` |
| live action approval packet | `scripts/fixtures/golden_sample_v3_2_live_action_approval_packet.v1.json` |
| static guard | `scripts/check-golden-sample-v3-2-upload-approval-packet-static.mjs` |

---

## 7. 절대 금지 (이 준비 문서 범위에서)

- upload 실행, `/api/upload` POST, upload queue, Instagram/YouTube upload client, n8n upload
- `uploadApprovalGrantedNow` / `uploadReady` / `productionReady` 승격, upload hard block 비활성화
- env/secret read, `.env.local` read, 플랫폼 자격증명 접근
- image/TTS/render/mux/browser/CDP 실행 또는 재생성
- dependency/lockfile/font/DB/deploy 변경, commit/push
