# Money Shorts OS — Prompt Compiler V1 Implementation Boundary

> **상태:** boundary/design 단계 — 구현 전 경계 설계
> **갱신:** 2026-06-30
> **다음 단계:** 이 경계 문서 승인 후 실제 Prompt Compiler 구현 진행

---

## ⚠️ 이 문서는 구현이 아니다

이 문서는:

- **구현이 아니다.** — Prompt Compiler 실제 코드를 포함하지 않는다.
- **finalPrompt 생성이 아니다.** — 어떤 형태의 finalPrompt / promptText / generatedPrompt / chatgptPrompt도 생성하지 않는다.
- **이미지 생성이 아니다.** — 이미지를 생성하거나 요청하거나 반환하지 않는다.
- **ChatGPT / Playwright 실행이 아니다.** — 어떤 외부 API, 브라우저 자동화, 네트워크 호출도 포함하지 않는다.

이 문서는 오직 **Prompt Compiler V1의 입력 경계 / 출력 경계 / 금지 책임 / 검증 책임만 정의**한다.

---

## 1. Source of Truth Files

Prompt Compiler V1이 반드시 참조해야 할 source of truth 파일 목록:

| 역할 | 파일 경로 |
|------|-----------|
| Visual System Rule Contract | `scripts/fixtures/premium-editorial-visual-system.rule-contract.v1.json` |
| Prompt Compiler Preflight Fixture | `scripts/fixtures/premium-editorial-prompt-compiler-preflight.v1.json` |
| Visual System 설계 문서 | `_ai/MONEY_SHORTS_OS_VISUAL_SYSTEM_V1.md` |

위 파일들은 Prompt Compiler 구현의 유일한 source of truth다.  
구현 단계에서 이 경계 바깥의 파일을 새로 추가하거나, 위 파일 내용을 구현 중 변경하는 것은 금지된다.

### Schema Version 참조

- Rule Contract: `schemaVersion: "money_shorts_visual_system_rule_contract_v1"`
- Preflight Fixture: `schemaVersion: "money_shorts_prompt_compiler_preflight_v1"`

---

## 2. Compiler Input Boundary

Prompt Compiler V1이 받을 수 있는 입력 필드:

| 필드 | 타입 | 출처 | 설명 |
|------|------|------|------|
| `sceneRoleContract` | object | Rule Contract | 각 scene의 communication role 정의 |
| `visualCategoryPool` | array | Rule Contract | 선택 가능한 visual category 목록 + usefulForRoles |
| `objectFamilyPool` | array | Rule Contract | object family 목록 + members + repeatLimitGuidance |
| `diversityRules` | object | Rule Contract | 동일 category/family 반복 제한 규칙 |
| `previousSceneVisualHistory` | array | Preflight Fixture | 이전 scene에서 선택된 category/family/spaceType/cameraDistance |
| `forbiddenObjects` | array | Preflight Fixture / Rule Contract | 해당 scene에서 금지된 object 태그 |
| `forbiddenCompositions` | array | Preflight Fixture / Rule Contract | 해당 scene에서 금지된 구도 패턴 |
| `sourceOfTruthPolicy` | string | Rule Contract / Preflight Fixture | deterministic overlay 원칙 (예: "deterministic_overlay") |
| `approvedAnchorRefs` | array | Preflight Fixture | Owner 승인 anchor identifier (referenceOnly, 파일 접근 금지) |
| `sceneOrder` | number | Preflight Fixture | 현재 scene 번호 (1~6) |
| `graphicLayerPolicy` | string | Rule Contract sceneRoleContract | 해당 scene의 graphic layer 허용 수준 |

### 입력 경계 원칙

- Compiler는 위 필드 외에 **외부 API 응답 / 네트워크 데이터 / 실시간 환율·금리 데이터를 입력으로 받지 않는다.**
- `approvedAnchorRefs`는 identifier/reference 수준만 허용. 실제 이미지 파일 경로(`C:/tmp/...`) 접근은 금지.
- `previousSceneVisualHistory`는 이전 scene 선택 결과를 담는 누적 입력이며, 최초 scene(order: 1)에서는 null이다.

---

## 3. Compiler Output Boundary

Prompt Compiler V1이 반환할 수 있는 출력 필드:

| 필드 | 타입 | 설명 |
|------|------|------|
| `sceneRole` | string | 해당 scene의 role id (예: "scene_1_hook") |
| `selectedVisualCategory` | string | 선택된 visual category id |
| `selectedObjectFamilies` | array | 선택된 object family id 목록 |
| `spaceType` | string | 선택된 공간 유형 (예: "indoor_personal") |
| `cameraDistance` | string | 선택된 카메라 거리 (예: "close_up") |
| `compositionProfile` | object | primaryFocus / faceFocus / tags / forbidden_combo_tags |
| `graphicLayerMode` | string | 그래픽 레이어 모드 (예: "subtle_supporting_only") |
| `graphicLayerNotes` | string | 그래픽 레이어 사용 가이드라인 메모 |
| `forbiddenObjects` | array | 이 scene에 적용되는 금지 object 태그 |
| `forbiddenCompositions` | array | 이 scene에 적용되는 금지 구도 패턴 |
| `qaExpectationIds` | array | 이 scene에 기대되는 QA 기준 id 목록 |
| `sourceOfTruthPolicyRef` | string | deterministic overlay 원칙 참조 (값 고정) |
| `diversityAuditLog` | object | category/family 반복 여부 감사 로그 |

### 출력 경계 원칙

- 위 필드 외에 **이미지 생성을 유발하는 어떤 필드도 포함하지 않는다.**
- 출력 결과는 **다음 단계 Visual QA와 Owner 게이트에 전달되는 중간 계획 레이어**다.
- 출력 결과를 직접 ChatGPT / API로 전송하는 것은 구현 승인 이후 별도 단계다.

---

## 4. Forbidden Output Fields Before Implementation Approval

다음 필드들은 **구현 승인 전까지 Prompt Compiler 출력에 포함될 수 없다:**

| 금지 필드 | 이유 |
|-----------|------|
| `finalPrompt` | 이미지 생성 API 직접 호출을 유발. 구현 승인 후 별도 단계 |
| `promptText` | finalPrompt의 alias. 동일하게 금지 |
| `generatedPrompt` | finalPrompt의 alias. 동일하게 금지 |
| `chatgptPrompt` | ChatGPT 호출을 직접 유발. 동일하게 금지 |
| `imageUrl` | 이미지 생성 결과 URL. 금지 |
| `generatedImagePath` | 이미지 파일 경로. 금지 |
| `openaiRequestBody` | OpenAI API request body. 금지 |

이 금지 목록은 Prompt Compiler 구현 전 static guard에서 자동 검증된다.

---

## 5. Deterministic Overlay Source-of-Truth Boundary

Prompt Compiler V1은 **deterministic overlay 원칙**을 유지해야 한다.

원칙:
- 정확한 숫자(예: "2.5%", "1,340원") / 날짜 / 출처 텍스트는 **이미지 프롬프트 안에 확정값으로 넣지 않는다.**
- 이미지 안의 텍스트/숫자는 **placeholder 또는 numeric cue 자리만** 허용한다.
- 정확한 값은 **후속 deterministic overlay 단계에서만 확정**된다.
- `exactValuesInImage: false` — 이 값은 Rule Contract와 Preflight Fixture 모두 명시하고 있으며, Compiler 출력도 이 원칙을 계승한다.
- `deterministicOverlayOwnsExactValues: true` — overlay 단계가 정확한 값의 source of truth다.

이 원칙은 Prompt Compiler가 반환하는 `compositionProfile.tags`와 `graphicLayerNotes`에도 반영되어야 한다.

---

## 6. Diversity / History Responsibility

Prompt Compiler V1은 6 scene 전체에 걸쳐 **visual diversity**를 보장할 책임이 있다.

- `objectFamilyPool.families[*].repeatLimitGuidance`를 읽고, 동일 family가 허용 한도를 초과하는지 확인한다.
- `diversityRules.rules[*]` (Rule Contract)의 9가지 다양성 규칙을 따른다 (same_space_repeat_limit / same_camera_distance_repeat_limit / same_object_family_repeat_limit / smartphone_centered_repeat_limit / wood_table_notebook_coffee_hand_combo_limit / fullscreen_data_card_ban / hand_table_smartphone_convergence_ban / scene_category_must_differ / previous_history_as_compiler_input).
- `previousSceneVisualHistory`를 누적 입력으로 받아 이전 scene에서 선택된 category/family를 추적한다.
- 출력의 `diversityAuditLog`에 현재까지 사용된 category/family 목록과 반복 여부를 기록한다.

### Diversity 책임 경계

- Prompt Compiler는 diversity를 **선택 단계에서 제어**한다. 이미지 생성 후 diversity를 사후 판정하지 않는다.
- `smartphone_centered_count`처럼 특정 오브젝트 과도 수렴 위험이 있는 family는 `overuseRisk` 필드를 참조해 조기 경고를 출력에 포함한다.

---

## 7. Visual QA Handoff Responsibility

Prompt Compiler V1의 출력은 **Visual QA 단계로의 handoff 계획**을 포함한다.

- 출력의 `qaExpectationIds` 필드는 Rule Contract의 `visualQaContract.checks[*].id`에서 참조된 id를 담는다 (role_differentiation / adjacent_scene_similarity / smartphone_notebook_coffee_table_repeat / realistic_not_stock / graphic_layer_present / graphic_layer_not_dominant / subtitle_safe_zone / not_3d_animation / not_face_centered / no_uniform_hand_object_pattern / source_of_truth_overlay).
- Visual QA 단계에서 이 id 목록을 기준으로 생성된 이미지를 검증한다.
- Prompt Compiler 자체가 이미지를 판정하지 않는다. 판정은 Visual QA 단계의 책임이다.

### QA Handoff 경계

- `qaExpectationIds`가 포함되어 있어야 다음 Visual QA 단계로 전달 가능하다.
- QA 기준이 없는 scene 출력은 incomplete로 처리되며 진행하지 않는다.

---

## 8. No-Network / No-Runner Boundary

Prompt Compiler V1 구현 파일은 다음을 포함하거나 호출할 수 없다:

| 금지 항목 | 이유 |
|-----------|------|
| `openai` (import/require) | OpenAI API 직접 호출 금지 |
| `ChatGPT` (호출) | ChatGPT 이미지 생성 직접 호출 금지 |
| `Playwright` (import/require) | 브라우저 자동화 금지 |
| `fetch` | 외부 네트워크 요청 금지 |
| `http` / `https` | 외부 네트워크 요청 금지 |
| `child_process` | 외부 프로세스 실행 금지 |
| `node-fetch` | 외부 네트워크 요청 금지 |

이 no-network/no-runner 경계는 Prompt Compiler static guard에서 자동 검증된다.

### 허용 범위

- Node.js built-in (`fs`, `path`, `url` 등) 읽기 전용 사용 허용.
- JSON 파싱 허용.
- 동기적 파일 읽기 허용 (Rule Contract / Preflight Fixture 읽기 전용).

---

## 9. Next Implementation Gate

다음 단계로 진행하기 위한 gate:

1. **이 boundary 문서 존재 확인** — `_ai/MONEY_SHORTS_OS_PROMPT_COMPILER_V1_BOUNDARY.md`
2. **boundary static guard PASS** — `scripts/check-premium-editorial-prompt-compiler-boundary-static.mjs` 40 checks+ PASS
3. **Rule Contract static guard PASS** — `scripts/check-premium-editorial-visual-system-static.mjs`
4. **Preflight static guard PASS** — `scripts/check-premium-editorial-prompt-compiler-preflight-static.mjs`
5. **Codex / Owner 승인** — 이 경계 문서를 Codex가 검토하고 구현 진행을 명시 승인한다.

Gate 통과 후 허용되는 다음 단계:

- `scripts/prompt-compiler-v1.mjs` 신규 작성 (또는 동등한 구현 파일)
- 구현 파일은 이 boundary 문서 § 2 (Input) / § 3 (Output) / § 4 (Forbidden Output) / § 8 (No-Network) 규칙을 모두 준수해야 한다.
- 구현 완료 후 별도 Visual QA static guard 작성 필수.

Gate를 통과하지 않으면 구현을 시작하지 않는다.
