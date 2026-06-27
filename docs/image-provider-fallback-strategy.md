# AutoShorts AI — 이미지 Provider Fallback 전략

> Status: **LEGACY / FUTURE REFERENCE ONLY** (2026-06-27). Old render-v2/image-provider fallback work is not active MVP direction. Current work must use Scene Card/imageTextPolicy specs and avoid live provider calls without approval.

> 최초 작성: 2026-05-24 (Pollinations 402 차단 대응)
> 관련 파일: `app/api/render-v2/route.ts`, `lib/pexels.ts`, `lib/assetDownloader.ts`

---

## 1. 현재 상황 요약

### Pollinations 402 차단 (2026-05-24 기준)

| 항목 | 상태 |
|------|------|
| turbo | 402 Payment Required |
| flux | 402 Payment Required |
| flux-realism | 402 Payment Required |
| flux-dev | 402 Payment Required |
| flux-schnell | 402 Payment Required |
| 외부 curl 200 확인 | ✅ (IP/헤더/사용량 기반 제한 추정) |
| Node.js fetch 402 | ❌ 차단 |

- QA-LH-4(88점), QA-LH-7(95점) plan 모두 렌더 준비 완료이나 이미지 0/10으로 중단
- 무료 AI 이미지 경로 전체 차단 → 대체 경로 필요

### 현재 render-v2 이미지 분기 구조

```
imageMode 판단
  ├─ "pollinations-only"  → Pollinations만 시도
  ├─ "imagen-only"        → Imagen만 시도
  └─ "free-first"         → Pollinations → (실패 시) Imagen fallback
                                               ↑ ALLOW_IMAGEN=true일 때만

현재 상태:
  Pollinations → 402 차단
  Imagen       → ALLOW_IMAGEN=false 차단
  → 전체 fallback: localImagePath=null → 422 렌더 중단
```

### 기존 stock 관련 코드 현황

| 파일 | 내용 |
|------|------|
| `lib/pexels.ts` | Pexels 사진 검색 클라이언트 (카테고리 기반, `PEXELS_API_KEY` 필요) |
| `app/api/render/route.ts` (v1) | Pexels 비디오 검색 + `videoSearchQuery` 필드 사용 |
| `app/api/render-v2/route.ts` | Pexels 연결 없음 — stock 경로 미구현 |
| `scene.fallbackSearchQuery` | GPT 생성 시 각 scene에 영어 stock 검색어 포함됨 |

**핵심 발견**: `fallbackSearchQuery`는 이미 각 scene에 GPT가 생성해주고 있으나, render-v2에서 이 필드가 전혀 사용되지 않고 있음.

---

## 2. 무료 Stock Photo Provider 후보 비교

> ⚠️ 아래 API 한도/약관은 2026-05-24 기준 공개 문서 기반이며, 변경될 수 있음.  
> **구현 전 반드시 각 provider의 최신 Terms of Service 및 API 요금제 페이지를 직접 확인할 것.**

### 2-1. Pexels

| 항목 | 내용 |
|------|------|
| API key | 필요 (무료 등록) |
| 무료 한도 | 월 200회 / 시간당 200회 (공개 기준, 변동 가능) |
| attribution | 선택 (권장되지만 법적 의무 아님) |
| 상업적 사용 | ✅ 허용 (Pexels License — 수정/영상 삽입 가능) |
| 9:16 portrait | API에서 `orientation=portrait` 파라미터 지원 |
| 한국 생활팁 적합성 | ⭐⭐⭐ — 음식/청소/세탁/주방 사진 풍부 |
| 구현 난이도 | **낮음** — `lib/pexels.ts` 이미 존재 (`fetchCategoryImage` 함수) |
| 기존 사용 | render v1에서 비디오 검색으로 사용 중 |

**장점**: 코드베이스에 이미 클라이언트 존재, `fallbackSearchQuery`와 직접 연결 가능  
**단점**: API key 등록 필요, 월 한도 있음, AI 생성 이미지보다 프롬프트 정합성 낮을 수 있음

### 2-2. Unsplash

| 항목 | 내용 |
|------|------|
| API key | 필요 (무료 등록) |
| 무료 한도 | 시간당 50회 (Demo), 유료 플랜 필요 시 증가 |
| attribution | 필수 (Unsplash License — "Photo by X on Unsplash") |
| 상업적 사용 | ✅ 허용, 단 attribution 필수 |
| 9:16 portrait | orientation=portrait 지원, `w=1080&h=1920` crop 가능 |
| 한국 생활팁 적합성 | ⭐⭐ — 고품질이나 생활용품보다 lifestyle 느낌 강함 |
| 구현 난이도 | **낮음** — REST API, 별도 SDK 불필요 |
| 기존 사용 | 없음 |

**장점**: 이미지 품질 높음  
**단점**: 시간당 50회 Demo 한도로 영상 10씬 × 반복 생성 시 빠르게 소진, attribution 필수가 영상 자막에 부담

### 2-3. Pixabay

| 항목 | 내용 |
|------|------|
| API key | 필요 (무료 등록) |
| 무료 한도 | 시간당 100회, 일 5000회 (공개 기준) |
| attribution | 불필요 (Pixabay License) |
| 상업적 사용 | ✅ 허용 |
| 9:16 portrait | orientation 파라미터 지원 |
| 한국 생활팁 적합성 | ⭐⭐⭐ — 일상 오브젝트 사진 풍부 |
| 구현 난이도 | **낮음** — REST API, attribution 불필요 |
| 기존 사용 | 없음 |

**장점**: attribution 불필요, 한도 Unsplash보다 여유  
**단점**: 이미지 품질 Pexels/Unsplash 대비 일부 낮음

### 2-4. Wikimedia Commons

| 항목 | 내용 |
|------|------|
| API key | 불필요 |
| 무료 한도 | 제한 없음 (로봇 정책 준수 필요) |
| attribution | 라이선스별 상이 (CC BY/CC0 혼재) |
| 상업적 사용 | 라이선스별 상이 — CC0는 OK, CC BY-SA는 조건부 |
| 한국 생활팁 적합성 | ⭐ — 생활용품 사진 부족, 백과사전형 이미지 위주 |
| 구현 난이도 | **높음** — 라이선스 필터링, 이미지 품질 변동 큼 |
| 기존 사용 | 없음 |

**장단점**: API key 불필요가 유일한 장점, 실용성 낮음

---

## 3. 추천 Provider

### 1순위: **Pexels**

**이유**:
1. `lib/pexels.ts`가 이미 존재 — 신규 클라이언트 작성 불필요
2. render v1에서 비디오 검색에 사용 중 — 팀 내 검증된 경로
3. `fallbackSearchQuery`와 1:1 연결 가능 (`orientation=portrait` 지원)
4. attribution 불필요 (법적 부담 없음)
5. 한국 생활팁 오브젝트(음식/청소/세탁/냉장고) 사진 풍부

**필요한 준비물**: `PEXELS_API_KEY` (pexels.com 무료 가입 후 발급)

### 2순위: **Pixabay**

attribution 불필요, 한도 여유 — Pexels API key 발급이 어렵거나 한도 초과 시 대안

---

## 4. 최소 구현 설계

### 4-1. 새 imageMode 추가

| imageMode 값 | 동작 |
|-------------|------|
| `"stock-only"` | Pexels/Pixabay만 사용, AI 생성 없음 |
| `"stock-first"` | Pexels/Pixabay 우선 → 실패 시 Pollinations fallback |
| `"free-first"` (현재) | Pollinations 우선 → 실패 시 Imagen fallback |

living_tips에서 Pollinations 차단 시 `"stock-first"` 권장.

### 4-2. 구현 흐름 (render-v2/route.ts)

```
이미지 분기 확장 (5단계):

1. imageMode === "stock-only" 또는 "stock-first"
   └─ fetchStockPhoto(scene.fallbackSearchQuery, 1080, 1920)
       → Pexels: GET /v1/search?query={query}&orientation=portrait&per_page=5
       → 결과 중 portrait에 가장 가까운 것 선택
       → downloadUrlToFile(photo.src.portrait, imagePath)
       → ok=true → imageProvider = "stock"

2. stock 실패(또는 stock-only가 아닌 경우)
   └─ 기존 Pollinations 분기 (imageMode !== "imagen-only")

3. Pollinations 실패
   └─ 기존 Imagen 분기 (imageMode !== "pollinations-only", ALLOW_IMAGEN=true)

4. 전부 실패
   └─ localImagePath = null → 422 반환 (기존 동작 유지)
```

### 4-3. lib/pexels.ts 확장

기존 `fetchCategoryImage(categoryId)`를 **검색어 기반**으로 확장:

```typescript
// 추가할 함수 (기존 함수는 유지)
export async function searchStockPhoto(
  query: string,
  orientation: "portrait" | "landscape" | "square" = "portrait"
): Promise<PexelsPhoto | null>
```

- `query`: `scene.fallbackSearchQuery` 직접 사용
- orientation: portrait 고정 (9:16)
- 결과에서 `src.portrait` URL 반환 (1080×1920에 가장 가까운 규격)
- API key 없으면 null 반환 (경고 로그)

### 4-4. env 설계

```bash
# .env.local 추가 항목
PEXELS_API_KEY=your_key_here          # Pexels stock 검색 (선택)
PIXABAY_API_KEY=your_key_here         # Pixabay 대안 (선택)
STOCK_IMAGE_PROVIDER=pexels           # "pexels" | "pixabay" | "" (기본 pexels)

# 이미 있는 항목 (변경 없음)
IMAGE_PROVIDER_MODE=stock-first       # 또는 imageMode body param으로 전달
```

### 4-5. paidApiGuard 관계

- stock provider(Pexels/Pixabay)는 **무료 API** → `paidApiGuard`와 무관
- `PEXELS_API_KEY`는 별도 env 변수로 관리
- Imagen fallback은 기존대로 `ALLOW_IMAGEN=true`일 때만 가능

### 4-6. 9:16 크롭 처리

Pexels `src.portrait`는 `600×?` 규격 → Python render 쪽에서 FFmpeg로 9:16 크롭/스케일 처리:

```python
# python/render_v2.py 에서 이미지 전처리 시
# crop to 9:16 (1080x1920), center crop
ffmpeg -i input.jpg -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" output.png
```

render_v2.py가 이미 이 처리를 하는지 확인 필요 (별도 atomic task).

---

## 5. 구현 현황 및 다음 단계

### ✅ Step 1 완료 (2026-05-24): lib/pexels.ts 확장
- `StockPhotoResult` 인터페이스 추가
- `searchStockPhoto(query, options?)` 함수 추가
- PEXELS_API_KEY 없으면 API 호출하지 않고 null 반환
- orientation 기본값 "portrait" (9:16 최적)

### ✅ Step 2 완료 (2026-05-24): render-v2/route.ts stock 분기 추가
- imageMode `"stock-only"` / `"stock-first"` 분기 구현
- `scene.fallbackSearchQuery` → `searchStockPhoto` 연결
- imageProvider 타입에 `"stock"` 추가
- response에 `stockScenesUsed` 필드 추가

### Step 3 (다음 atomic task): 실제 렌더 검증
- PEXELS_API_KEY는 이미 .env.local에 존재함
- imageMode=`stock-first`로 LH-7 plan 렌더 시도
- 10씬 이미지 다운로드 성공 여부 확인
- 영상 출력물 품질 확인 (9:16 크롭 처리 포함)

### Step 4 (선택): python/render_v2.py 크롭 처리 확인
- Pexels `src.portrait`(약 600×900)을 1080×1920으로 업스케일/크롭하는 FFmpeg 명령 확인
- 품질 이슈 있으면 `src.large2x` 사용으로 전환

---

## 6. Pollinations 복구 모니터링

Pollinations 차단이 IP 기반이라면 다음으로 확인:

```bash
# Windows PowerShell (Node.js 환경과 동일 IP)
Invoke-WebRequest -Uri "https://image.pollinations.ai/prompt/test?width=100&height=100&model=turbo" -Method GET | Select-Object StatusCode
```

복구되면:
- imageMode=pollinations-only로 LH-7 plan 렌더 재시도 ($0 비용)
- stock 연동과 병행하여 free-first fallback 구조 완성 가능

---

## 7. 다음 액션 선택지

| 옵션 | 내용 | 비용 | 우선순위 |
|------|------|------|----------|
| **A** | Pexels API key 발급 → Step 1~2 구현 → LH-7 렌더 검증 | $0 | **권장** |
| **B** | Pollinations 복구 확인 → LH-7 plan 무료 렌더 재시도 | $0 | 빠르면 A보다 우선 |
| **C** | Imagen 유료 승인 → LH-7 plan 렌더 (즉시 가능) | ≈$0.41 | 급한 경우 |

**권장**: B(Pollinations 복구) 먼저 확인 → 복구 안 되면 A(Pexels 연동) 진행
