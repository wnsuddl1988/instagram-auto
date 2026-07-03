# Golden Sample v3.2 — Owner 결정 패킷 (no-live)

> **이 문서는 live 실행 승인이 아니다.**
> 현재 프로젝트 verdict는 `STANDARDIZED_NO_LIVE_READY`로 유지된다.
> 아래 결정을 고르는 것은 **그 결정의 해소만** 의미하며, live TTS/render/mux/이미지 생성/ChatGPT·Playwright/browser/upload/자동화 확장/env·secret/dependency/DB/deploy를 실행하는 승인이 **아니다**. 각 실행은 별도 명시 승인 + 별도 live slice가 있어야 한다.
> 권장안(recommendedDefault)은 Codex 추천일 뿐 **선택도 승인도 아니다**. Owner가 아래 snippet을 직접 붙여넣어야 해당 결정만 확정된다.

- machine-readable 소스: `scripts/fixtures/golden_sample_v3_2_owner_decision_resolution_packet.v1.json` (recommendation packet, 원본 유지)
- 현재 결정 상태 소스: `scripts/fixtures/golden_sample_v3_2_owner_decision_resolution_state.v1.json` (실제 확정/보류 상태)
- 결정 목록 단일 소스: `scripts/fixtures/golden_sample_v3_2_integrated_production_readiness_contract.v1.json` (`unresolvedOwnerDecisions` 10개)
- 근거: `scripts/fixtures/golden_sample_v3_2_automation_implementation_gap_analysis.v1.json`
- 총 10개 결정 중 **4개 정책 결정 확정, 6개 계속 PENDING**.

---

## Current Owner Decisions (2026-07-04 확정)

> **아래 4개 확정도 live 실행 승인이 아니다.** Owner가 "그래 진행해 다 구현되고 나면 또 얘기해보자"로 이 4개 정책 결정만 확정했다. live TTS/render/mux/이미지 생성/ChatGPT·Playwright/browser/upload/env/secret/dependency/DB/deploy 실행은 여전히 각각 별도 명시 승인이 필요하다.

**확정 4개 (정책 결정만, 실행 아님):**

| # | key | 확정 값 |
|---|-----|---------|
| 1 | script_impact_gate_score_authority | `codex_judge_with_mandatory_provenance` |
| 6 | font_vendoring | `vendor_noto_black_vf_remove_system_dependency` (폰트 파일 추가·dependency 변경 승인 아님) |
| 8 | image_script_allow_guard | `add_allow_guard_to_all_paid_image_scripts` (image API 호출·ChatGPT/Playwright/browser 실행 승인 아님) |
| 9 | poll_25s_passive_window | `accept_25s_passive_window_as_v3_2_behavior` (browser/CDP 실행 승인 아님) |

**계속 PENDING 6개:** `legacy_line_scope`, `upload_endpoint_disposition`, `blueprint_schema_unification`, `md5_locked_image_durability`, `contract_duality_resolution`, `owner_viewing_listening_qa` (Owner 직접 시청/청취 QA — 자동 대체 여전히 불가).

- machine-readable 확정 기록: `scripts/fixtures/golden_sample_v3_2_owner_decision_resolution_state.v1.json`
- verdict는 계속 `STANDARDIZED_NO_LIVE_READY`.

---

## 지금 고르기 쉬운 결정 (decideNow=true, 4개)

코드 실행 없이 정책만으로 확정 가능하고, 미래 live slice의 선행 blocker입니다.

| # | key | 권장안 | 막는 lane |
|---|-----|--------|-----------|
| 1 | script_impact_gate_score_authority | codex_judge_with_mandatory_provenance | live TTS/audio/mux |
| 6 | font_vendoring | vendor_noto_black_vf_remove_system_dependency | render |
| 8 | image_script_allow_guard | add_allow_guard_to_all_paid_image_scripts | live image runner |
| 9 | poll_25s_passive_window | accept_25s_passive_window_as_v3_2_behavior | live image runner |

## 나중에 결정 (decideNow=false, 6개)

artifact/설계가 더 있어야 하거나 당장 lane을 막지 않습니다.

| # | key | 권장안 | 막는 lane | 선행 필요 |
|---|-----|--------|-----------|-----------|
| 2 | legacy_line_scope | isolate_as_pre_v3_2_legacy_documented | (없음) | living_tips 지속 의사 |
| 3 | upload_endpoint_disposition | keep_hard_blocked_until_upload_slice | upload | Owner QA + 큐 설계 |
| 4 | blueprint_schema_unification | adopt_standard_six_field_names_map_v2 | (없음) | VideoBlueprint diff 매핑 |
| 5 | md5_locked_image_durability | define_durable_backup_location_policy | (없음) | lock 원본 경로 목록 |
| 7 | contract_duality_resolution | single_v3_2_standard_json_contract | (없음) | v2↔v3.2 필드 매핑 |
| owner_qa | owner_viewing_listening_qa | keep_manual_owner_qa_mandatory_non_automatable | upload, automation | 큐 스키마 설계 |

---

## Bucket별 상세

### A. live TTS/audio/mux 전에 결정

**#1 script_impact_gate_score_authority** — 점수를 누가 생산? provenance 의무화?
- 선택지: `self_assessment_fixture_with_provenance`(단순·위조 위험) / **`codex_judge_with_mandatory_provenance`(권장, 감사 가능)** / `llm_judge_scored`(자동화 유리·비용/비결정성)
- 왜 지금: fixture 숫자만이면 gate가 장부 검사로 전락. live TTS slice 선행 blocker.

### B. live image runner 전에 결정

**#8 image_script_allow_guard** — FLUX2/OpenAI-image 스크립트에 ALLOW_* 가드?
- 선택지: **`add_allow_guard_to_all_paid_image_scripts`(권장)** / `centralize_via_paid_api_guard_only` / `defer_until_image_runner_slice`
- 왜 지금: 현재 키 존재=실행. 조용한 과금 방지.

**#9 poll_25s_passive_window** — 25s passive window 인정 vs 즉시 1-2s poll?
- 선택지: **`accept_25s_passive_window_as_v3_2_behavior`(권장, 실측 일치)** / `switch_to_immediate_1_2s_poll` / `defer_until_image_runner_slice`
- 왜 지금: 실측 동작 기준으로 정책 확정 가능.

### C. render 전에 결정

**#6 font_vendoring** — Noto Sans KR Black VF vendoring?
- 선택지: **`vendor_noto_black_vf_remove_system_dependency`(권장)** / `keep_blackhansans_as_approved` / `defer_until_render_slice`
- 왜 지금: render_v2.py가 silent default-font fallback. vendoring해야 폰트부터 준수. **라이선스 재배포 가능 여부 확인 필요.**

### D. upload/automation 전에 결정

**#3 upload_endpoint_disposition** — /api/upload + UploadPanel + n8n 하드닝 vs 폐기?
- 선택지: **`keep_hard_blocked_until_upload_slice`(권장, 유일 안전값)** / `harden_with_auth_and_readiness_gate` / `delete_upload_endpoint_and_panel`
- 지금은 Slice 0 hard block 유지가 기본. 실제 처분은 upload slice(high risk)에서.

**#owner_qa owner_viewing_listening_qa** — Owner 직접 시청/청취 QA 처리?
- 선택지: **`keep_manual_owner_qa_mandatory_non_automatable`(권장)** / `queue_plus_owner_approval_model`
- **어떤 자동/기술 pass도 `ownerQaPassed=true` 또는 Owner QA PASS가 될 수 없다.** 이 결정 확정이 곧 QA 통과가 아니다.

### E. 문서/스키마 정리 결정

- **#2 legacy_line_scope** — living_tips + CLAUDE.md tail-trim/sceneTts를 pre-v3.2 legacy로 격리(권장) vs 폐기 vs 연기. 문서-코드 충돌 해소용.
- **#4 blueprint_schema_unification** — 표준 6필드명 채택(권장) vs alias 레이어 vs 연기.
- **#5 md5_locked_image_durability** — 내구성 백업 위치 정책 정의(권장) vs 휘발성 수용 vs 연기.
- **#7 contract_duality_resolution** — v3.2 standard JSON 단일 계약(권장) vs creative contract v2 승계 vs 연기.

---

## 권장 결정 경로 (Codex 추천)

1. **지금 확정 가능한 4개(#1, #6, #8, #9)** 를 먼저 결정 — 각각 live slice 선행 blocker이고 코드 실행 없이 정책만으로 확정 가능. (#6은 폰트 라이선스 확인 후)
2. **문서/스키마 4개(#2, #4, #5, #7)** 를 정합 정리 차원에서 결정 — blocker는 아니지만 자동화 진입 전 충돌 제거.
3. **upload/automation 2개(#3, #owner_qa)** 는 upload slice 착수 시점까지 현행 권장값(하드 블록 유지 / 수동 QA 필수) 유지.

---

## 복사용 승인 snippet (결정 해소 전용, live 실행 승인 아님)

아래는 **각 결정을 권장값으로 확정**하는 문구입니다. 다른 선택지를 원하면 값을 바꿔 붙여넣으세요. **어느 것도 live 실행·upload·render·TTS·이미지 생성 승인이 아닙니다.**

```text
결정 #1 script_impact_gate_score_authority = codex_judge_with_mandatory_provenance 로 확정. provenance 필드 의무화. 이는 정책 결정일 뿐 live TTS/audio/mux 실행 승인이 아니다.

결정 #6 font_vendoring = vendor_noto_black_vf_remove_system_dependency 로 확정. 폰트 정책 결정일 뿐 render/mux 실행 승인이 아니며 폰트 파일 추가는 별도 승인 slice에서 집행한다.

결정 #8 image_script_allow_guard = add_allow_guard_to_all_paid_image_scripts 로 확정. 가드 추가 방침 결정일 뿐 image generation/live runner 실행 승인이 아니며 가드 코드 추가는 별도 승인 slice에서 집행한다.

결정 #9 poll_25s_passive_window = accept_25s_passive_window_as_v3_2_behavior 로 확정. 타이밍 해석 결정일 뿐 ChatGPT/Playwright/browser 실행 승인이 아니다.

결정 #2 legacy_line_scope = isolate_as_pre_v3_2_legacy_documented 로 확정. 문서만 개정하며 코드 실행/수정 승인은 아니다.

결정 #3 upload_endpoint_disposition = keep_hard_blocked_until_upload_slice 로 확정. 업로드는 계속 차단이며 어떤 upload 실행/엔드포인트 활성화 승인도 아니다.

결정 #4 blueprint_schema_unification = adopt_standard_six_field_names_map_v2 로 확정. 스키마/문서 정의만이며 코드 마이그레이션 실행 승인은 아니다.

결정 #5 md5_locked_image_durability = define_durable_backup_location_policy 로 확정. 정책 정의만이며 파일 이동/복사 실행 승인은 아니다.

결정 #7 contract_duality_resolution = single_v3_2_standard_json_contract 로 확정. 계약 소스 정의만이며 compiler 재구축 실행 승인은 아니다.

결정 #owner_qa owner_viewing_listening_qa = keep_manual_owner_qa_mandatory_non_automatable 로 확정. Owner 직접 시청/청취 QA는 자동 대체 불가·필수 유지. ownerQaPassed는 이 결정으로 true가 되지 않는다.
```

> 위 snippet 붙여넣기는 **결정 status 확정**만 트리거합니다. 실제 live TTS/render/mux/image/upload/automation은 그 뒤 별도 live slice + 별도 Owner 승인이 필요하며, Slice 0 upload hard block은 계속 유지됩니다.
