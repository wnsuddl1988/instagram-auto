# AutoShorts AI — 이미지 Provider 운영 전략

> 최종 업데이트: 2026-05-24 (QA-27 실패 사례 반영)

---

## 1. Provider 개요

| Provider | 유료 여부 | 품질 | 일관성 | 속도 | 비고 |
|----------|-----------|------|--------|------|------|
| **Imagen 3** (Google) | ✅ 유료 플랜 필요 | ★★★★★ | ★★★★☆ | ★★★☆☆ | `GEMINI_API_KEY` 필요. Google AI Studio 유료 플랜 활성 필수 |
| **Pollinations** | 무료 | ★★★☆☆ | ★★☆☆☆ | ★★★★★ | 무료 CDN 기반. 세션마다 이미지가 달라질 수 있음. `turbo → flux → flux-realism` 순차 시도 |
| **OpenAI Image** | ✅ 유료 | ★★★★☆ | ★★★☆☆ | ★★★☆☆ | **미구현 (TODO)** — 추후 `OPENAI_IMAGE_MODEL=dall-e-3` 환경변수로 활성화 예정 |

---

## 2. imageMode 옵션 정리

`POST /api/render-v2` body 또는 `IMAGE_PROVIDER_MODE` 환경변수로 제어.

| imageMode | 동작 | 언제 사용 |
|-----------|------|-----------|
| `free-first` **(기본값)** | Pollinations 먼저 → 실패 시 Imagen fallback | 비용 절약 우선. 개발/QA 단계 |
| `imagen-only` | Imagen만 사용. Pollinations 시도 없음 | 품질 우선 렌더. **Imagen 유료 플랜 활성 필수** |
| `pollinations-only` | Pollinations만 사용. Imagen 없음 | 무료 비교 렌더. Imagen 플랜 없을 때 대안 |
| `paid-first` | Imagen 먼저 → 실패/quota 시 Pollinations fallback | 품질+안정성 균형. 권장 운영 모드 |
| `openai-image-only` | **미구현 (not implemented)** | 향후 OpenAI DALL-E 연동 시 사용 예정 |

> ⚠️ **`imagen-only`** 사용 시 Imagen 유료 플랜이 없으면 **전 씬 실패** → Pollinations fallback도 없음. 반드시 플랜 활성 확인 후 사용.

---

## 3. 에러 유형별 대응

### 3-1. `plan_required` — Imagen 유료 플랜 미활성

**에러 메시지 패턴:**
```
"Imagen 3 is only available on paid plans."
"Please upgrade your account at https://ai.dev/projects."
```

**대응:**
- ⛔ **같은 `imageMode='imagen-only'`로 재시도 금지** — 동일 오류 반복
- ✅ `imageMode='pollinations-only'`로 무료 렌더 시도
- ✅ [Google AI Studio](https://ai.dev/projects)에서 Imagen 유료 플랜 활성 후 재시도

**코드 처리 위치:** `app/api/render-v2/route.ts`
- 감지 패턴: `/only available on paid plans|upgrade your account|paid plans/i`
- `errorType: "plan_required"` 설정
- `imagenPlanRequired = true` → 즉시 `imagenDailyQuotaExhausted = true`로 Pollinations 경로 전환
- 422 응답에 `imageProviderBlocked: true, blockReason: "plan_required"` 포함

### 3-2. `quota_exhausted` — Imagen 일일 quota 소진

**대응:**
- `allowProviderFallbackOnQuota: true` (기본값)으로 재시도 → 실패 씬을 Pollinations로 대체
- 내일 quota 리셋 후 재시도

### 3-3. `quota_rate_limit` — Imagen API rate limit (429)

**대응:**
- `retryAfterSeconds` 대기 후 자동 재시도 (최대 3회, 최대 90초)
- 재시도 소진 시 Pollinations fallback

### 3-4. `safety_rejected` — Imagen safety filter 거부

**대응:**
- simplified prompt (첫 절만) 로 재시도 자동 실행
- 계속 실패 시 Pollinations fallback

---

## 4. 비용 안내

| 작업 | 예상 비용 | 승인 필요 |
|------|-----------|-----------|
| Imagen 3 이미지 생성 (1씬) | ~$0.04 | 유료 플랜 활성 후 사용자 확인 필요 |
| Pollinations 이미지 | 무료 | 불필요 |
| OpenAI TTS (sage, gpt-4o-mini-tts) | ~$0.015/1K chars | 렌더 시 자동 사용 — 사용자 고지 필요 |
| OpenAI GPT-4o mini (generate-v2) | ~$0.001~0.003/call | 콘티 생성 시 자동 — 사용자 고지 필요 |

> **사용자 승인 원칙:** 유료 API(Imagen, OpenAI TTS, GPT)는 사용자가 렌더 버튼을 명시적으로 누를 때만 호출. 자동 재시도는 동일 세션 내 동일 provider에 한해 허용.

---

## 5. QA 실패 사례 기록

### QA-27 (2026-05-24) — Imagen plan_required 전 씬 실패

- **설정:** `imageMode: "imagen-only"`
- **에러:** `"Imagen 3 is only available on paid plans. Please upgrade your account at https://ai.dev/projects."`
- **결과:** 전 씬(10/10) 실패. Pollinations fallback 없음 (`imagen-only` 모드)
- **원인:** Google AI Studio Imagen 유료 플랜 미활성
- **교훈:**
  - `imagen-only`는 플랜 활성 확인 전 사용 금지
  - 기본 모드를 `paid-first`(Imagen 우선 + Pollinations fallback)로 운영 권장
  - UI에서 plan_required 시 재시도 버튼 비활성 + 명확한 경고 필요 → QA-27에서 구현 완료

---

## 6. 권장 운영 전략

```
개발/QA 단계: imageMode = "free-first"
  └ Pollinations 먼저 → 품질 확인 후 Imagen 사용 결정

품질 렌더 단계: imageMode = "paid-first" (권장)
  └ Imagen 먼저 (quota 있을 때) → 실패 시 Pollinations fallback
  └ Imagen 유료 플랜 없으면 → 전면 Pollinations로 자동 전환

비용 절약: imageMode = "pollinations-only"
  └ 무료. 품질/일관성 불안정 → 비교 렌더 또는 임시 확인용

품질 최우선: imageMode = "imagen-only"
  └ 반드시 Imagen 유료 플랜 활성 확인 후 사용
  └ 플랜 없으면 전 씬 실패 → 재시도 무의미
```

---

## 7. TODO (미구현)

- [ ] `openai-image-only` 모드 구현 (`OPENAI_IMAGE_MODEL=dall-e-3`)
- [ ] imageMode UI 선택기 (ReelV2Studio 렌더 패널)
- [ ] Imagen 플랜 활성 여부 사전 체크 API (`GET /api/render-v2?checkImagen=true`)
- [ ] OpenAI Image fallback 구현 (Imagen → Pollinations → OpenAI Image 3단계 fallback)
