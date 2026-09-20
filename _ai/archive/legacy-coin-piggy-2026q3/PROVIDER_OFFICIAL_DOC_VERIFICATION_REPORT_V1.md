# Provider Official Doc Verification Report v1

- 작성일/확인일: 2026-07-02
- Task ID: `creative-v2-provider-official-doc-verification-v1`
- 성격: **read-only 공식 문서 확인 보고서 — 실행 승인 아님.** Owner가 provider·테스트 장수·비용 상한을 승인하기 위한 자료.

## 1. 확인 범위와 금지 작업 준수

- 수행: 공식 문서/공식 가격/공식 API reference **읽기만** (WebFetch read-only).
- 미수행: API 호출·이미지 생성 0건, browser/ChatGPT/Playwright/CDP 실행 0건, credential/env/secret 읽기·변경 0건, dependency 변경 0건, render/TTS/mux/upload 0건, 코드 수정 0건, commit/push 0건. 절대규칙 파일 무수정.
- 원칙: 공식 문서로 확인 못한 항목은 추측 없이 `미확인`으로 표기.

## 2. 공식 문서 출처 목록 (확인일: 2026-07-02)

| Provider | URL | 확인 항목 |
|---|---|---|
| Google | https://ai.google.dev/gemini-api/docs/imagen | Imagen 4 모델 ID, aspectRatio, 1K/2K, deprecation |
| Google | https://ai.google.dev/gemini-api/docs/pricing | Imagen 4 및 Gemini 이미지 모델 장당 가격 |
| Google | https://ai.google.dev/gemini-api/docs/image-generation | Gemini 이미지 모델(nano banana 계열) ID/비율/사이즈 |
| Google | https://ai.google.dev/api/generate-content | imageConfig 픽셀 표 존재 여부 (부재 확인) |
| OpenAI | https://raw.githubusercontent.com/openai/openai-python/main/src/openai/types/image_generate_params.py (공식 SDK 레포) | size 파라미터 허용값, gpt-image-2 임의 해상도 |
| OpenAI | https://platform.openai.com/docs/guides/image-generation | gpt-image-2 "thousands of valid resolutions" + Cost and latency 섹션의 GPT Image 2 가격표 (1024x1024/1024x1536/1536x1024 × Low/Medium/High) |
| BFL | https://docs.bfl.ai/ + https://docs.bfl.ml/llms.txt | 모델 라인업 인덱스 |
| BFL | https://docs.bfl.ai/quick_start/pricing | 모델별 credits/가격 (MP-based) |
| BFL | https://docs.bfl.ai/flux_2/flux2_text_to_image | FLUX.2 t2i — flexible aspect ratios 명시 |
| BFL | https://docs.bfl.ai/api-reference/models/generate-or-edit-an-image-with-flux2-%5Bpro%5D | FLUX.2 [pro] API body의 `width`/`height` 파라미터 공식 존재 (최소 `x >= 64` 확인) |
| BFL | https://docs.bfl.ml/flux_models/flux_1_1_pro_ultra_raw.md | Ultra aspect_ratio/4MP |

주: OpenAI의 일부 페이지(API reference/pricing 페이지)는 자동화 fetch가 봇 차단으로 실패했으나, 위 공식 Image Generation guide 페이지에서 gpt-image-2 가격표와 resolution 정책이 확인되어 가격 체계 확인은 완료됨.

## 3. A: Google (기존 `lib/imagen.ts` 경로 — Imagen 4 상위 옵션)

- **모델**: `imagen-4.0-generate-001`(standard), `imagen-4.0-ultra-generate-001`, `imagen-4.0-fast-generate-001`(repo 현행).
- **9:16**: 지원 확인 (`"1:1","3:4","4:3","9:16","16:9"`).
- **size**: `sampleImageSize` = `1K`/`2K` — **Standard/Ultra 전용** (fast 미지원 = 현행 repo 모델은 사이즈 옵션 없음).
- **9:16 네이티브 1080x1920+**: 1K/2K의 **정확 픽셀 치수는 공식 문서에 미기재 → `미확인`** (소량 테스트 실측 필요).
- **가격**: fast $0.02 / standard $0.04 / ultra $0.06 per image. 무료 티어 없음.
- **⚠️ 결정적 발견**: **Imagen 4 계열은 deprecated — 2026-08-17 서비스 종료 예정.** Google은 Gemini 이미지 모델로 이전 권고. → **Imagen 4 상위 옵션에 신규 투자하는 A안 원안은 비추천(6주 내 shutdown).**
- **A′ (승계 후보): Gemini 이미지 모델 (nano banana 계열)**
  - 모델: `gemini-3.1-flash-image`(Nano Banana 2, 512px/1K/2K/4K), `gemini-3-pro-image`(Pro, 1K/2K/4K), `gemini-2.5-flash-image`(legacy), `gemini-3.1-flash-lite-image`(1K only).
  - 9:16 지원 확인 (비율 10종에 포함). API 파라미터로 `aspect_ratio`, `image_size: "2K"`, `response_format` 확인됨.
  - 가격(standard): 3.1-flash-image **1K $0.067 / 2K $0.101 / 4K $0.151**, 3-pro-image 1K·2K $0.134 / 4K $0.24. (batch 시 절반 수준)
  - 9:16의 1K/2K/4K **정확 픽셀 치수는 문서 미기재 → `미확인`** (2K/4K 티어가 존재하므로 1080x1920+ 개연성은 높으나 실측 확인 필요).
  - credential: 기존 Google API key 경로(Gemini API) 재사용 가능. dependency 불필요(fetch).
  - **기존 `lib/imagen.ts`와의 차이**: 현행은 Imagen `:predict` 엔드포인트 — Gemini 이미지 모델은 `generateContent` 방식이라 **클라이언트 수정 필요(중간 난이도)**. plan/quota: 계정별 상태 `미확인`(과거 plan_required 이력 있음 — 확인 필요).

## 4. B: OpenAI image generation

- **공식 SDK(openai-python, 공식 레포) size 허용값**: `"auto","1024x1024","1536x1024","1024x1536","256x256","512x512","1792x1024","1024x1792"` — 고정 목록에는 9:16/1080x1920+ 없음.
- **⚠️ 결정적 발견**: 모델 목록에 `gpt-image-2`, `gpt-image-2-2026-04-21` 존재하며, SDK 문서 문자열 기준 **"gpt-image-2는 임의 해상도를 `WIDTHxHEIGHT` 문자열로 지원, 가로·세로 각각 16의 배수"**, 공식 guide도 **"thousands of valid resolutions"** 지원을 명시. → **`1088x1920`(aspect 0.5667, 허용오차 0.01 내) 또는 `1088x1936`(0.5620) 네이티브 생성이 파라미터상 가능 = 후보 중 유일하게 "1080x1920+ 직접 지정"이 공식 소스로 확인됨.**
- **가격 (공식 guide의 Cost and latency 섹션에서 확인됨)**: GPT Image 2 가격표가 1024x1024 / 1024x1536 / 1536x1024 × Low/Medium/High 조합으로 공식 문서에 존재 — 기준 사이즈 1024x1536 High는 **$0.165 수준**. **공식 가격 체계는 확인 완료.** 단 custom size(`1088x1920`/`1088x1936`)의 정확 비용은 output-token calculator/실제 산정이 필요 → 테스트 승인 시 산정 후 상한 내 실행.
- **한계**: 총 픽셀 상한/비율 제한 세부는 문서 문자열에 없음 → 소량 테스트 실측으로 확인.
- credential: **기존 OPENAI_API_KEY 재사용**. dependency 불필요(HTTP 직접 호출).
- **소량 테스트 후보 여부**: **예 — 1순위 후보** (직전 packet의 "낮음" 평가는 gpt-image-1 고정 사이즈 기준이었고, gpt-image-2 임의 해상도 + 공식 가격 체계 확인으로 갱신됨).

## 5. C: FLUX (BFL 공식 API)

- **모델/가격 (BFL 공식 pricing)**: FLUX.2 [klein] from $0.014~0.015 / **FLUX.2 [pro] from $0.03** / [flex] from $0.05 / [max] from $0.07 (MP-based, 해상도에 따라 변동). FLUX1.1 [pro] $0.04 / [pro] Ultra·Raw $0.06 (Ultra "up to 4MP").
- **9:16 / 1080x1920+ (공식 확인 갱신)**: FLUX.2 text-to-image 문서가 **flexible aspect ratios를 공식 명시**하고, FLUX.2 [pro] API Reference의 request body에 **`width`/`height` 파라미터가 공식 존재**(최소 `x >= 64` 확인). → 해상도 지정 메커니즘 자체는 공식 확인 완료. 단 **최대 픽셀/허용 조합 상한과 `1088x1920` 실제 acceptance는 문서만으로 확정 불가 → 테스트 또는 추가 공식 확인 필요.** (FLUX1.1 Ultra의 aspect_ratio 전체 목록은 여전히 예시만 기재 — Ultra 경로는 후순위.)
- credential: **신규 BFL 계정+API key 필요**(env/secret 범주 Owner 승인). REST API 제공 — dependency 없이 HTTP 호출 가능할 것으로 보이나 세부 호출 흐름(폴링 등)은 추가 확인 필요.
- **fal.ai / Replicate**: FLUX 실행 wrapper provider 후보 — **이번 slice에서 공식 문서 미확인**. BFL 공식 API와 별개 계약/과금임을 구분해 둠.
- **판단(뉘앙스 보정)**: **신규 credential을 허용하면 강한 후보** — width/height 공식 존재 + MP-based 가격(from $0.03)으로 1080x1920+ 도달 가능성이 구조적으로 높다. 다만 **credential 변경 없이 즉시 테스트 가능한 경로는 OpenAI가 우선**이므로 이번 소량 테스트 라운드에서는 후순위, acceptance 확인 후 재평가.

## 6. 결론 (T2 "월급이 3일 만에 사라지는 이유" 기준)

- **1순위: B — OpenAI `gpt-image-2` (기존 OPENAI_API_KEY 재사용)**
  - 근거: 후보 중 유일하게 "임의 WIDTHxHEIGHT(16배수)" + "thousands of valid resolutions"가 공식 소스로 확인되어 1080x1920+ 요건을 **파라미터로 직접 충족** 가능. credential/dependency 변경 0. **공식 가격 체계 확인됨**(기준 사이즈 가격표 존재 — 1024x1536 High ≈ $0.165). T2의 구체 오브젝트(통장/지갑/알림/영수증) 포토리얼 전달력은 소량 테스트로 검증.
  - 남은 산정 항목: custom size(`1088x1920`/`1088x1936`)의 정확 비용 — calculator/실측 산정 후 상한 내 실행.
- **2순위/백업: A′ — Google `gemini-3.1-flash-image` 2K**
  - 근거: 9:16 + `image_size: "2K"` 확인, 가격 확정(2K $0.101/장), 기존 Google key 경로. 단 정확 픽셀 `미확인`(실측 필요) + 클라이언트를 generateContent 방식으로 수정 필요 + 과거 plan_required 이력 재확인 필요.
  - 주의: **Imagen 4 원안(A)은 2026-08-17 shutdown으로 비추천.**
- **3순위(이번 라운드)/조건부 강한 후보: C — BFL FLUX.2 [pro]** — `width`/`height` 파라미터 공식 확인 + flexible aspect ratios 명시로 구조적 가능성은 높으나, 신규 credential 필요 + 최대 픽셀/`1088x1920` acceptance 추가 확인 필요. **신규 credential을 Owner가 허용하면 강한 후보로 승격 가능**; credential 변경 없는 즉시 테스트는 OpenAI 우선.
- **소량 테스트 권장**: B+A′ 병행, 후보당 4장(hook 2 + checklist 2, T2 프롬프트) = 총 8장. **비용 상한 제안: $3 유지** — 근거: 공식 가격표상 기준 사이즈 1024x1536 High가 $0.165 수준이고 custom size는 산정 필요하므로, B 4장 + A′ 4장(≈$0.41)에 $3 cap은 보수적 여유를 포함한 상한.
- **Owner 승인 문구 초안**:
  > "image source 소량 테스트 승인: (1) OpenAI gpt-image-2, 기존 OPENAI_API_KEY 재사용, 1088x1920(또는 1088x1936) 4장 — custom size 비용은 실행 전 산정해 상한 내 확인, (2) Google gemini-3.1-flash-image 2K 9:16 4장, 총 8장, 비용 상한 $3, 신규 dependency 없음, render/TTS/mux/upload 없음, 결과는 실측 해상도+주제 전달력 QA 보고 후 중단 — approved"

## 7. 불확실성 (`미확인` 목록)

| 항목 | 상태 | 후속 |
|---|---|---|
| OpenAI gpt-image-2 custom size(1088x1920 등) 정확 비용 | 산정 필요 (공식 가격 체계·기준 사이즈 가격표는 확인 완료) | calculator/실측 산정 후 상한 내 실행 |
| gpt-image-2 임의 해상도의 총픽셀/비율 제한 | 미확인 | 소량 테스트 실측 |
| Gemini 이미지 모델 9:16의 1K/2K/4K 정확 픽셀 | 미확인 (문서 미기재) | 소량 테스트 실측 |
| Google 계정 plan/quota 현황 | 미확인 (과거 plan_required 이력) | Owner 확인 |
| FLUX.2 최대 픽셀/허용 조합 상한·1088x1920 acceptance | 추가 확인 필요 (`width`/`height` 파라미터 존재와 flexible aspect ratios는 공식 확인 완료) | 테스트 또는 추가 공식 확인 |
| fal.ai/Replicate wrapper 조건 | 미확인 (이번 범위 외) | 필요 시 별도 확인 |
| pricing/availability의 계정·지역·플랜별 차이 | 존재 가능 — 위 가격은 공개 문서 기준 | 실행 전 계정 기준 재확인 |
