# AutoShorts AI — Claude Code 지침

## Role
세계 최고의 Next.js 14 / TypeScript / Python 시니어 개발자.
이 프로젝트는 인스타그램 릴스 & 유튜브 쇼츠를 AI로 자동 생성하고 업로드하는 AutoShorts AI다.

---

## 현재 상태 스냅샷 (2026-05-30, 세션 이동 시 갱신)

### 루프 단계 요약
| 단계 | 상태 |
|------|------|
| 기술 루프 (generate → QA → render) | ✅ 안정화 완료 |
| 무료 Pexels 이미지 루프 | ✅ 안정화 완료 |
| TTS 최종본 생성 | ✅ LH-7/LH-8/LH-9 각 1회 완료 |
| **콘텐츠 품질 기준** | ⚠️ **"스토리형"으로 상향 전환** — 정보나열형은 업로드 후보 부적합 |
| Story 구조 코드 반영 | ✅ lib/openai.ts qualityBar 업데이트 완료 (pnpm build 통과) |
| **Story 구조 실제 generate 검증** | ✅ **QA-LH-9 완료** — hook caption 10/10, blocking 0, TTS final + tail trim → accept_trimmed_final |
| Hook caption v1 전략 | ✅ reversal/curiosity/specificity/action/rule 10/10 달성 (LH-9) |
| **LH-9 업로드 후보 확정** | ✅ `lh9_tts_final_trimmed_43s.mp4` — 43.567s, blocking 0, gap 0.415s |

### 완료된 QA 작업
| QA ID | 내용 | 결과 |
|-------|------|------|
| QA-26 | imagePrompt 정합성 + TTS 톤 안정화 | ✅ 완료 |
| QA-27 | Imagen plan_required 처리 + imageMode 전략 | ✅ 완료 |
| QA-분리 | living_tips ↔ emotional_story QA 기준 분리 | ✅ 완료 |
| QA-LH-1 | scene 8~10 후반 정보 밀도 gate 추가 | ✅ 완료 |
| QA-LH-2 | narration 길이 강화 + scene 10 motion 자동 보정 + gate(M) | ✅ 완료 |
| QA-LH-3 | narration 자동 보강 helper (scene 2~10) + breakdown label 버그 수정 | ✅ 완료 |
| QA-LH-4 | food-storage 재생성 → score 88/pass 달성 | ✅ 완료 |
| QA-LH-5 | kitchen-cleaning 소주제 generate → CTA/질문형 보강 개선 | ✅ 완료 |
| QA-LH-6 | scene 8~9 boost "함께 두면" → context-aware 패턴으로 교체 | ✅ 완료 |
| QA-LH-7 | laundry-clothing 재생성 → score 95/pass, capReasons [], caption natural + TTS final 완료 | ✅ 완료 |
| QA-LH-8 | food-storage "냉장고 문칸" → score 95/pass, caption natural + TTS final 완료 (기술 성공) | ✅ 완료 |
| QA-문서화 | living_tips QA 안정화 결과 문서화 + 렌더 재개 조건 정리 | ✅ 완료 |
| Pexels 연동 | lib/pexels.ts searchStockPhoto + render-v2 stock-first 분기 구현 | ✅ 완료 |
| LH-7/LH-8 무음샘플 | Pexels 10/10 + 무음 렌더 + visual fix → accept_silent_sample | ✅ 완료 |
| 파이프라인 문서화 | 생활꿀팁 무료 무음 샘플 파이프라인 운영 절차 문서화 | ✅ 완료 |
| Hook strategy 문서화 | 6가지 훅 패턴 + 고후킹 소재 30개 + qualityBar 강화 | ✅ 완료 |
| Story structure 문서화 | LH-8 실패 분석 + 스토리형 10씬 구조 + 리프레임 3안 | ✅ 완료 |
| **Story structure 코드 반영** | lib/openai.ts qualityBar — STORY STRUCTURE RULES + STORY-ROLE IMAGE STRATEGY | ✅ 완료 |
| QA-LH-9 Human QA Rubric | living-tips-human-qa-rubric.md 생성 — 시각/자막 품질 기준 강화 | ✅ 완료 |
| QA-LH-9 Hook caption v1 | 10씬 전체 hook 자막 재작성 (reversal×2/curiosity×2/specificity×2/action×2/rule×2) | ✅ 완료 |
| QA-LH-9 visual v2 | scene4/5 Pexels 재교체 + BAD_KW slug 단어단위 감지 수정 → blocking 0 | ✅ 완료 |
| QA-LH-9 TTS final | gpt-4o-mini-tts nova 0.92 → narration.mp3 43.15s + 영상 50s (scene 10 무음 5s blocking) | ✅ 완료 |
| QA-LH-9 TTS QA | silencedetect + 프레임 QA → scene 10 전체 무음 blocking 확인 | ✅ 완료 |
| QA-LH-9 tail trim | ffmpeg stream copy -t 43.5 → 43.567s, gap 0.415s, accept_trimmed_final | ✅ 완료 |

### LH-8 사용자 피드백 요약 (콘텐츠 품질 기준 상향 계기)
- "기술적으로는 성공했지만 식상함"
- "이미지 붙여놓고 설명하는 느낌"
- "후킹 부족 — 궁금하지 않음"
- **핵심: 스토리 맥락 부족 — 정보나열형(listicle)은 업로드 후보로 부족**

### 현재 블로커
- **콘텐츠 품질**: 단순 정보나열형(TOP 5 구조)은 업로드 후보 부적합. 다음부터 스토리형 구조 검증 필수 (LH-9로 기준 확립)
- **TTS 싱크 (차기 적용)**: 단일 TTS + scenes 5s 고정 방식은 영상/오디오 길이 mismatch 발생. 다음 소주제(QA-LH-10)부터 sceneTts:true 또는 생성 후 tail trim 적용 필수
- **Pollinations 402**: 무료 AI 이미지 경로 전체 차단 (2026-05-24 기준) — Pexels로 대체 중

### 최신 Best Artifacts
| 소주제 | 파일 | 비고 |
|--------|------|------|
| LH-7 laundry-clothing | `output/v2/paid_qa/lh7_silent_render_fixed/lh7_silent_preview_fixed.mp4` | 무음 QA 기준, 1080×1920, 50s |
| LH-7 TTS final | `output/v2/lh7_tts_final/lh7_tts_final_caption_natural_v1.mp4` | 음성 완성본 |
| LH-8 food-storage | `output/v2/paid_qa/lh8_silent_render_fixed/lh8_silent_preview_fixed.mp4` | 무음 QA 기준, 기술 성공 |
| LH-8 TTS final | `output/v2/lh8_tts_final/lh8_tts_final.mp4` | 음성 완성본 (콘텐츠 스토리 부족) |
| LH-9 냉장고 문칸 (silent v2) | `output/v2/paid_qa/lh9_hook_visual_fixed_v2/lh9_silent_hook_visual_fixed_v2.mp4` | hook caption 10/10, blocking 0, 33.7MB |
| LH-9 TTS final (원본) | `output/v2/lh9_tts_final/lh9_tts_final.mp4` | 34.12MB, 오디오 43.15s/영상 50s — scene 10 무음 5s |
| **LH-9 TTS trimmed (최종 업로드 후보)** | **`output/v2/lh9_tts_final/lh9_tts_final_trimmed_43s.mp4`** | **29.79MB, 43.567s, gap 0.415s, blocking 0, accept_trimmed_final ✅** |

### 다음 권장 액션 (QA-LH-10)
- **QA-LH-9 최종 상태**: accept_trimmed_final ✅ — `lh9_tts_final_trimmed_43s.mp4` 업로드 후보 확정
- **LH-9 총 비용**: OpenAI TTS 1회 ≈$0.00434 + Pexels 무료 + trim 무료
- **다음 소주제 추천 (권장 A)**: "수건 냄새, 세제 더 넣으면 더 심해지는 이유"
  - 반전형 hook 강함 ("세제가 원인이었어요")
  - 실생활 공감도 최고 (누구나 경험)
  - Pexels 이미지 수급 가능성 높음 (수건/세탁기/세제 오브젝트)
  - 스토리 구조: 냄새(문제) → 세제 잔여물(원인) → 적정량+헹굼(해결) → 결과(냄새 없음)
- **추천 B**: "전자레인지 기름때, 바로 닦지 말아야 하는 이유" (반전형)
- **추천 C**: "냉동실 자리 때문에 전기세 더 나오는 이유" (수치형)
- **비용**: OpenAI generate 1회, gpt-4o-mini, ≈$0.003
- **조건**: `ALLOW_OPENAI_GENERATE=true` 명시 승인 필요
- **TTS 싱크 주의**: 단일 TTS 방식은 생성 후 반드시 audio/video duration gap QA + tail trim 적용

### 핵심 파일 목록
| 파일 | 역할 |
|------|------|
| `app/api/generate-v2/route.ts` | 콘티 생성 API + sanitizePlan + calcQualityScore |
| `app/api/render-v2/route.ts` | 렌더링 API + Imagen/Pollinations/TTS + stock-first 분기 |
| `lib/openai.ts` | GPT 프롬프트 생성 — STORY STRUCTURE RULES + STORY-ROLE IMAGE STRATEGY + 6훅패턴 포함 |
| `lib/pexels.ts` | Pexels API 클라이언트 (searchStockPhoto 추가됨) |
| `lib/reelCategories.ts` | 카테고리 정의 (ReferenceStyle, voice, imageMode) |
| `lib/captionSanitizer.ts` | caption 자동 보정 로직 |
| `components/ReelV2Studio.tsx` | 메인 UI 컴포넌트 |
| `scripts/check-lh8-pexels-stock-images.mjs` | LH-8 Pexels 이미지 검색/다운로드 검증 |
| `python/render_v2.py` | 무음/유음 영상 렌더 |
| `docs/living-tips-qa-strategy.md` | living_tips QA 전략 문서 (§1~20) |
| `docs/living-tips-hook-strategy.md` | 6가지 훅 패턴 + 고후킹 소재 30개 (신규) |
| `docs/living-tips-story-structure.md` | LH-8 실패 분석 + 스토리형 10씬 구조 + 리프레임 3안 (신규) |
| `docs/living-tips-free-silent-pipeline.md` | 무료 무음 샘플 파이프라인 운영 절차 |
| `docs/image-provider-fallback-strategy.md` | Pollinations 402 대응 + Pexels stock 연동 설계 |
| `docs/living-tips-human-qa-rubric.md` | 인간 QA 기준 강화 — 씬 역할별 이미지 기준 + caption hook 4요소 체크리스트 |
| `scripts/_lh9-fix-scene45-v2.mjs` | BAD_KW slug 단어단위 감지 수정 (extractSlugWords) + scene4/5 재교체 |
| `scripts/_lh9-tts-final.mjs` | LH-9 TTS 최종본 생성 (OpenAI TTS → render_v2.py) |

### ReferenceStyle 타입
```typescript
type ReferenceStyle = "ai_character_tips" | "wealth_mindset" | "emotional_story" | "living_tips"
```

### 주요 Gate 목록 (calcQualityScore)
| Gate | 조건 | 효과 |
|------|------|------|
| A | 씬 수 심각 불일치 | fail 상한 59 |
| B | critical fail 2건+ | fail 상한 59 |
| L | living_tips 후반 밀도 부족 (scene 8~9 generic 2건+ OR CTA 핵심 요약 누락) | cap 79 |
| M | living_tips narration 짧음 3건+ | cap 79 |

### 자동 보강 로직 (5-a-lt 블록, living_tips 전용)
| 대상 | 조건 | 방식 |
|------|------|------|
| scene 2~7 | 14자 미만 + 직전/다음 scene 위치 단어 | `"${loc}은 ${origNar}"` prefix |
| scene 2~7 | 14자 미만 + 다음 scene 이유 단어 | `"${origNar}, ${reason}가 심해요."` suffix |
| scene 8~9 (food-storage) | 14자 미만 + 직전 scene 명사 + 냉장고/보관 키워드 | `"${obj}를 함께 두면 ${origNar}"` |
| scene 8~9 (비음식) | 14자 미만 + caption 첫 단어 2자+ 단일어 | `"${captionNoun}은/는 ${origNar}"` |
| scene 8~9 (비음식 fallback) | caption 단어 공백 포함 또는 1자 | `"이 방법으로 ${origNar}"` |
| scene 10 | CTA 단독 (regex 또는 14자 미만) | `"${caption} 두세요, 저장해두면 유용해요."` |
- 모두 14~30자(scene 10은 35자) 범위일 때만 적용. 실패 시 원문 + warning 유지.

### living_tips 핵심 규칙
- 씬 수: 10씬 고정 (hook→mistake2~3→solution4~7→bonus8~9→CTA10)
- narration: 16~28자, scenes 2~10은 14자 미만 금지
- scene 8: before/after 효과 (단순 반복 금지)
- scene 9: 추가 주의사항/보너스 팁
- scene 10: 핵심 키워드 2개+ CTA + motion=slow_zoom_out (자동 보정됨)
- voice: nova, 0.92
- imageMode: pollinations-only 또는 free-first 권장

### 절대 금지
- 유료 API 호출 금지 (OpenAI/Imagen/TTS 실제 호출)
- POST /api/generate-v2, POST /api/render-v2 실제 호출 금지
- pnpm build 반드시 통과 확인

---

## Context Control (토큰 절약 - 절대 규칙)
- cat 전체 파일 읽기 절대 금지. grep 또는 특정 줄(StartLine~EndLine)만 읽어라.
- 코드 수정 시 전체 코드 재출력 금지. 변경 Diff만 설명해라.
- 불필요한 디렉토리 탐색 금지.

## Workflow (CoT & Atomic)
- 코딩 전 반드시 3줄 계획 말하고 승인받아라.
- 한 번에 1개(Atomic)만 실행해라.
- 각 Atomic 완료 후 반드시 pnpm build 검증해라.

## Tech Stack
- Next.js 14 (App Router, TypeScript), Tailwind CSS
- Zustand, Supabase, OpenAI API (GPT-4o + TTS)
- Python + FFmpeg (영상 합성)
- Instagram Graph API + YouTube Data API v3
- pnpm 전용 (npm/yarn 절대 금지)

## Video Spec
- 해상도: 1080x1920 (9:16 세로)
- 길이: 15~60초
- 출력: output/ 폴더 (gitignore 필수)
