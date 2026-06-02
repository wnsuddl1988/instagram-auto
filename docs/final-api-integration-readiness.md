# Final API Integration Readiness
> 작성일: 2026-05-30 | QA-LH-10 세션 이후 OpenAI 중심 루프 재정렬 사전 조사

---

## 1. Executive Summary

현재 OpenAI(GPT + TTS) + Pexels + ElevenLabs(코드만, 미사용) 구조로 생활꿀팁 루프 운영 중.
대본 자연스러움 / 음성 품질 한계 → Claude(대본) + CLOVA(음성) + Pixabay(이미지 fallback) + Perplexity(뉴스 리서치) 도입 검토.
이 문서는 호출/구현 없이 코드·환경변수·아키텍처만 조사한 결과다.

---

## 2. Current Existing Integrations

| Provider | 역할 | 상태 |
|----------|------|------|
| OpenAI GPT | 대본/콘티 생성 (`lib/openai.ts`) | ✅ 완전 작동 |
| OpenAI TTS | 음성 생성 (`render-v2/route.ts`) | ✅ 완전 작동 |
| Pexels | 무료 stock 이미지 (`lib/pexels.ts`) | ✅ 완전 작동 |
| Pollinations | 무료 AI 이미지 (`lib/pollinations.ts`) | ⚠️ 402 차단 (2026-05-24~) |
| Google Imagen | 유료 AI 이미지 (`lib/imagen.ts`) | ✅ 코드 완비, 유료 가드 |
| ElevenLabs | 유료 TTS (`render-v2/route.ts` 인라인) | ✅ 코드 완비, 유료 가드 — 미사용 |
| Supabase | DB/Storage (`lib/supabase.ts`) | ✅ 완전 작동 |
| FFmpeg/Python | 로컬 영상 합성 (`python/render_v2.py`) | ✅ 완전 작동 |

---

## 3. Missing Candidate Integrations

| Provider | 목적 | 현재 코드 | env 키 |
|----------|------|-----------|--------|
| Claude (Anthropic) | 한국어 대본 품질 개선 | ❌ 없음 | ❌ 없음 |
| NAVER CLOVA TTS | 한국어 음성 품질 개선 | ❌ 없음 | ❌ 없음 |
| Pixabay | Pexels 실패 시 이미지 fallback | ❌ 없음 | ❌ 없음 |
| Perplexity | 경제뉴스/최신동향 리서치 | ❌ 없음 | ❌ 없음 |

---

## 4. Environment Variable Readiness

### 이미 존재하는 키 (값 비공개)
| 키 이름 | 용도 |
|---------|------|
| `OPENAI_API_KEY` | GPT 대본 생성 + TTS |
| `PEXELS_API_KEY` | Pexels stock 이미지 |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS (코드 완비, 미사용) |
| `PAID_API_ENABLED` | 유료 API 마스터 스위치 |
| `ALLOW_OPENAI_GENERATE` | GPT 생성 개별 가드 |
| `ALLOW_OPENAI_TTS` | OpenAI TTS 개별 가드 |
| `ALLOW_IMAGEN` | Google Imagen 개별 가드 |
| `ALLOW_ELEVENLABS` | ElevenLabs TTS 개별 가드 |

### 없는 키 (추가 필요)
| 키 이름 | 용도 |
|---------|------|
| `ANTHROPIC_API_KEY` | Claude API 인증 |
| `NAVER_CLOVA_CLIENT_ID` | CLOVA TTS 인증 (NCP 콘솔 발급) |
| `NAVER_CLOVA_CLIENT_SECRET` | CLOVA TTS 인증 |
| `PIXABAY_API_KEY` | Pixabay 이미지 검색 |
| `PERPLEXITY_API_KEY` | Perplexity 뉴스 리서치 |
| `ALLOW_CLAUDE_GENERATE` | Claude 대본 유료 가드 (신규) |
| `ALLOW_CLOVA_TTS` | CLOVA TTS 유료 가드 (신규) |
| `ALLOW_PERPLEXITY` | Perplexity 리서치 가드 (신규) |
| `ALLOW_PIXABAY` | Pixabay 이미지 가드 (신규 — 무료이나 가드 구조 통일 권장) |

---

## 5. Claude Script Provider Readiness

### 연동 방식
`lib/openai.ts`의 `generateReelV2Plan()` 함수가 단일 진입점.
내부에서 `openai.chat.completions.create({ model: planModel })` 호출.
Claude API는 `@anthropic-ai/sdk`를 사용하며 인터페이스가 유사해 교체 가능.

### 두 가지 연동 전략

**A. 완전 교체 (Claude가 메인 대본 엔진)**
- `lib/openai.ts` → `lib/scriptProvider.ts` 로 추상화
- `provider: "openai" | "claude"` 파라미터 추가
- Claude 사용 시 `@anthropic-ai/sdk` messages.create() 호출
- 수정 파일: `lib/openai.ts` (또는 신규 `lib/scriptProvider.ts`), `app/api/generate-v2/route.ts`
- 예상 수정 범위: 중간 (200~300줄)

**B. Claude rewrite 단계 추가 (OpenAI 초안 → Claude 보정)**
- generate-v2가 OpenAI로 초안 생성 후, Claude로 narration/caption 품질 보정
- living_tips: 스토리 흐름 보정 / emotional_story: 감정선 강화
- 수정 파일: `app/api/generate-v2/route.ts` (rewrite 단계 추가)
- 예상 수정 범위: 작음 (50~80줄)

### 필요 env
```
ANTHROPIC_API_KEY=...
ALLOW_CLAUDE_GENERATE=true   # paidApiGuard에 신규 case 추가 필요
```

### paidApiGuard 수정 필요
`lib/paidApiGuard.ts` line 80 `providerToEnvKey()` 함수에 `case "claude-generate"` 추가 (5줄)

### OpenAI와 역할 분담 방안
| 역할 | OpenAI | Claude |
|------|--------|--------|
| JSON 구조화 | ✅ 유지 | - |
| 초안 대본 | ✅ 유지 (저비용) | - |
| 한국어 품질 보정 | - | ✅ 신규 |
| 품질 점수화 | ✅ 유지 | - |
| 백업 TTS | ✅ 유지 | - |

---

## 6. CLOVA TTS Provider Readiness

### 연동 방식
`app/api/render-v2/route.ts` line 20:
```typescript
type TtsProvider = "openai" | "elevenlabs";
```
여기에 `"clova"` 추가 후, `createNarration()` 함수에 분기 추가.

CLOVA Voice API: `POST https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts`
- 헤더: `X-NCP-APIGW-API-KEY-ID`, `X-NCP-APIGW-API-KEY`
- 응답: mp3 binary (ElevenLabs와 동일한 방식)
- 한국어 speaker: `nara`, `mijin`, `jinho`, `clara` 등

### 적용 가능성
- `createNarration()` 내 ElevenLabs 분기(line 84~113)와 동일한 패턴으로 추가 가능
- 출력: `narration.mp3` → `python/render_v2.py narrationPath` 그대로 연결
- `sceneTts: true` 모드도 `createSceneNarrationTrack()` 분기 추가로 지원 가능
- 예상 수정 범위: 작음 (60~80줄, ElevenLabs 분기 복사 수준)

### 필요 env
```
NAVER_CLOVA_CLIENT_ID=...
NAVER_CLOVA_CLIENT_SECRET=...
ALLOW_CLOVA_TTS=true   # paidApiGuard 신규 case 추가 필요
```

### 주의
- NAVER CLOVA Voice는 NCP(NAVER Cloud Platform) 콘솔에서 발급
- 상업적 이용 가능 여부 / 월 무료 크레딧 / 초과 요금은 NCP 공식 문서에서 별도 확인 필요
- 무료 플랜: 월 1만 자(한글 기준) 내외 — 하루 2~3개 생산 시 초과 가능

---

## 7. Pixabay Fallback Readiness

### 연동 방식
`lib/pexels.ts`의 `searchStockPhoto()` 함수와 동일한 인터페이스로 `lib/pixabay.ts` 신규 생성.

Pixabay API: `GET https://pixabay.com/api/?key=KEY&q=query&image_type=photo&orientation=vertical`
- 응답 구조: `hits[].webformatURL, hits[].pageURL, hits[].user`
- `StockPhotoResult` 타입 그대로 반환 가능

### render-v2 fallback chain 연결
`app/api/render-v2/route.ts` line 595 `stock-first` 분기:
```typescript
// 현재: Pexels → null
// 변경: Pexels → Pixabay → null
if (!ok && imageMode === "stock-first") {
  const pixabayResult = await searchPixabayPhoto(scene.fallbackSearchQuery);
  // ...
}
```

### 적용 가능성
- `fallbackSearchQuery` 필드 그대로 활용 가능 (영어 쿼리, 오브젝트 중심)
- `imageMode: "stock-first"` fallback chain에 자연스럽게 추가 가능
- 예상 수정 범위: 작음 (신규 `lib/pixabay.ts` 50줄 + render-v2 분기 20줄)

### 필요 env
```
PIXABAY_API_KEY=...   # 무료 플랜 존재, 상업적 이용 가능
```

### 무료/유료 가드
- Pixabay API는 기본 무료 (회원가입 후 발급)
- 유료 가드(`ALLOW_PIXABAY`)는 선택적 — 구조 통일 위해 추가 권장

---

## 8. Perplexity News Research Readiness

### 연동 방식
generate-v2에 직접 붙이는 것보다 **별도 `news-research` 스크립트/route** 권장.
이유: 경제뉴스 → Perplexity 리서치 → research artifact 저장 → 대본 생성 시 context 주입 흐름이 더 안정적.

Perplexity API: `POST https://api.perplexity.ai/chat/completions`
- `model: "sonar-pro"` 또는 `"sonar"` (뉴스 특화)
- OpenAI SDK와 호환 가능한 인터페이스
- 응답에 `citations[]` (출처 URL 배열) 포함

### 권장 아키텍처
```
scripts/research-news-topic.mjs     # 독립 실행 스크립트
  → Perplexity API 호출 (topic + 날짜)
  → output/research/{topic}_{date}.json 저장
  → 포함 필드: summary, keyFacts[], citations[], riskNotes[], generatedAt

app/api/generate-v2/route.ts
  → researchPath 파라미터 받아서 JSON 읽고 GPT/Claude prompt에 주입
```

### 적용 가능성
- 기존 generate-v2 구조 변경 최소화
- research artifact를 `variationContext` 또는 신규 `researchContext` 파라미터로 주입
- 예상 수정 범위: 중간 (신규 스크립트 100줄 + route.ts context 주입 30줄)

### 필요 env
```
PERPLEXITY_API_KEY=...
ALLOW_PERPLEXITY=true   # paidApiGuard 신규 case 추가 필요
```

### 경제뉴스 카테고리 필수 여부
- **필수에 가까운 핵심 후보** — 최신 주가/금리/환율 데이터 없이는 신뢰도 낮은 대본 생성 위험
- Pexels처럼 "정보 수집 레이어"로 분리하면 다른 카테고리에도 재활용 가능

---

## 9. OpenAI 역할 재정의

### 현재 역할 (All-in-One)
- 대본 초안 생성 (GPT-4o)
- JSON 구조화
- 품질 점수화 (calcQualityScore)
- TTS (gpt-4o-mini-tts, nova)

### 재정의 후 역할 (보조)
| 역할 | 변경 |
|------|------|
| 대본 초안 | ✅ 유지 (저비용 gpt-4o-mini) 또는 Claude로 전환 |
| JSON 구조화 | ✅ 유지 (OpenAI가 JSON 모드 안정적) |
| 품질 점수화 | ✅ 유지 (로컬 로직, API 무관) |
| TTS | ⚠️ CLOVA로 메인 교체, OpenAI는 백업 |

### 비용 영향
- GPT-4o → gpt-4o-mini 전환 시 콘티 생성 비용 ~10배 절감
- TTS: OpenAI gpt-4o-mini-tts ≈ $0.004/회 vs CLOVA 무료 구간 활용 가능

---

## 10. Implementation Priority

| 순위 | 항목 | 품질 개선 | 구현 난이도 | 운영비 | 하루 2~3개 루프 적합성 | 권장 이유 |
|------|------|-----------|-------------|--------|----------------------|-----------|
| 1 | **Pixabay fallback** | 보통 | 쉬움 | 무료 | ✅ 최적 | Pexels 결과 없을 때 즉시 대안. 구현 1~2시간, 운영 안정성 직접 기여 |
| 2 | **CLOVA TTS** | 높음 | 쉬움 | 낮음 | ✅ 최적 | ElevenLabs 분기 복사 수준. 한국어 음성 품질 체감 개선 최대 |
| 3 | **Claude rewrite 단계** | 높음 | 중간 | 중간 | ✅ 적합 | OpenAI 초안 유지하면서 한국어 품질만 보정. 비용 예측 가능 |
| 4 | **Perplexity 뉴스 리서치** | 높음 (경제 한정) | 중간 | 중간 | ⚠️ 경제 카테고리 전용 | 경제뉴스 카테고리 시작 전 필수. 생활꿀팁에는 불필요 |
| 5 | **Claude 완전 교체** | 높음 | 어려움 | 높음 | ⚠️ 신중 | 구조 변경 크고 비용 검증 필요. Claude rewrite 먼저 검증 후 검토 |

---

## 11. API Keys Needed From User

### 즉시 필요 (다음 atomic task 진행 시)
| 키 | 용도 | 발급처 |
|----|------|--------|
| `PIXABAY_API_KEY` | Pexels fallback 이미지 | pixabay.com/api (무료 회원가입) |
| `NAVER_CLOVA_CLIENT_ID` | CLOVA TTS | console.ncloud.com |
| `NAVER_CLOVA_CLIENT_SECRET` | CLOVA TTS | console.ncloud.com |

### 경제뉴스 카테고리 시작 시
| 키 | 용도 | 발급처 |
|----|------|--------|
| `PERPLEXITY_API_KEY` | 뉴스 리서치 | perplexity.ai/settings/api |
| `ANTHROPIC_API_KEY` | Claude 대본 보정 | console.anthropic.com |

---

## 12. Cost / Policy Items To Discuss Later

- **CLOVA TTS 상업적 이용**: NCP 이용약관 확인 필요 (인스타그램/유튜브 업로드 시)
- **CLOVA 월 무료 크레딧**: 하루 2~3개 × 30일 = 90개/월 → 글자 수 기준 초과 여부 확인 필요
- **Pixabay 상업적 이용**: 무료 플랜으로 상업적 사용 가능하나 attribution 정책 확인
- **Perplexity sonar-pro 비용**: 쿼리당 $0.005~$0.01 수준 예상, 실제 요금제 확인 필요
- **Claude API 비용**: claude-3-5-haiku 기준 콘티 1회 ≈ $0.001~$0.003 예상, 실측 필요
- **ElevenLabs 유지 여부**: CLOVA 품질 검증 후 비교 → A/B 테스트 후 결정

---

## 13. Next Atomic Tasks

### 즉시 실행 가능 (API 키 불필요)
1. `lib/pixabay.ts` 신규 생성 + `render-v2` fallback chain 연결
2. `lib/paidApiGuard.ts`에 `clova-tts`, `claude-generate`, `perplexity`, `pixabay` case 추가

### API 키 확보 후 실행
3. CLOVA TTS 분기 추가 (`render-v2/route.ts`) + TTS 샘플 A/B 테스트
4. Pixabay 이미지 검색 검증 스크립트 (`scripts/check-pixabay-stock-images.mjs`)
5. Claude rewrite 단계 추가 (`app/api/generate-v2/route.ts`)
6. Perplexity 뉴스 리서치 스크립트 (`scripts/research-news-topic.mjs`)

### LH-10 당장 다음 단계
- OpenAI TTS (LH-9 패턴) or ElevenLabs TTS 중 선택 → TTS 생성 → tail trim → accept
- CLOVA는 키 확보 후 LH-11부터 적용
