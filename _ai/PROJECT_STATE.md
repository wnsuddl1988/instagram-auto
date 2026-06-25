# PROJECT_STATE — AutoShorts MVP

**갱신:** 2026-06-25

**전체프로젝트 진행률:** 약 70% — source/fact-card foundation, Video Blueprint, script package, 금융표현 risk review, 9:16 chart/number-card, image prompt package, voice profile/TTS script formatter, timeline recalculation 로컬 모듈이 안정화됐다. 다음 단계는 render manifest/ffmpeg command plan 모델이다.

> **현재 품질 게이트:** `MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED`. 이전 영상 제작 방식은 active direction이 아니다. 새 작업은 `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`, `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`, `_ai/MONEY_SHORTS_OS_PRD_V1.md`, `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`, `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`, `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md` 기준으로 진행한다.

---

## 현재 제품 방향

개발명:

- **Money Shorts OS**

제품 정의:

- 한국 경제·금융 콘텐츠를 출처 기반으로 기획한다.
- 쇼츠 대본·차트·썸네일·자막·게시문구를 생성한다.
- Fact Card 기반으로 쇼츠 대본·차트·썸네일·게시문구를 생성한다.
- 단순 AI 영상 생성기나 돈관리 쇼츠 생성기가 아니라 출처 기반 금융·경제 쇼츠 제작 OS다.
- 초기에는 Owner가 매일 쓸 내부 쇼츠 제작 도구로 완성하고, 검증 후 크리에이터용 SaaS로 확장한다.
- Money-OS는 메인 콘텐츠 주제가 아니라 필요한 경우에만 붙는 CTA/전환 레이어다.

최신 제품 기준:

- 콘텐츠 비중: 출처 기반 금융·경제 쇼츠 70%, Money-OS 연결형 돈관리 쇼츠 30%.
- 핵심 카테고리: 금리, 환율, 물가, 고용, 소비, 경기지표, ECOS/KOSIS/금융공공데이터/OpenDART/FRED, 기업 공시/실적/재무정보.
- Fact Card 없이 대본 생성 금지.
- Money-OS CTA는 개인 돈관리와 자연스럽게 연결되는 경우에만 삽입.
- 생성 안정화 기준: `데이터 소스 -> 원본/공시 -> 핵심 숫자 -> 비교값 -> Fact Card -> Video Blueprint -> 대본/차트/영상`.

상세 기준:

- `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`
- `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_PRD_V1.md`
- `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`
- `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`
- `_ai/PRODUCTION_PIPELINE_RESET_V1.md`

---

## 최근 checkpoint

- Commit: `909098b` — `feat(source): establish clean source-first baseline`
- Commit: `35ca73c` — `feat(blueprints): add fact card video blueprint generator`
- Commit: `902e632` — `feat(scripts): add source-linked script package generator`
- Commit: `79faa5b` — `feat(risk): add financial expression scanner`
- Commit: `fa6b5a1` — `feat(chart-cards): add source-linked card props model`
- Commit: `5bb99fd` — `feat(image-prompts): add source-linked prompt package generator`
- Commit: `55f4a9b` — `feat(voice-profiles): add local tts script formatter`
- Branch: `codex/source-first-blueprint-clean`
- Push: 미실행

---

## 최근 완료

Task:

- `money-shorts-os-timeline-recalc-v1`

구현:

- `lib/timeline/types.ts`
- `lib/timeline/calculator.ts`
- `lib/timeline/validation.ts`
- `lib/timeline/fixtures.ts`
- `lib/timeline/index.ts`

검증:

- Timeline module ESLint PASS
- Source-first module-only TypeScript diagnostics: 0
- Full TypeScript check는 기존 `output/` binary `.ts` 오염으로 실패할 수 있지만, `lib/timeline`, `lib/voice-profiles`, `lib/image-prompts`, `lib/chart-cards`, `lib/risk-review`, `lib/scripts`, `lib/blueprints`, `lib/source-facts` 관련 오류는 없다.
- Codex runtime verification PASS:
  - timeline scene sum exact PASS
  - caption timing mirrors scene timing PASS
  - source linkage preserved PASS
  - measured > target accepted PASS
  - invalid duration/non-ordered scene validation fail PASS

주의:

- 전체 `pnpm lint`/전체 `tsc`는 기존 app/archive/output 누적 오류가 있어 별도 정리 전까지 전체 통과 기준으로 보지 않는다.
- `output/`은 commit 대상이 아니다.

---

## 폐기된 active route

- Candidate10 / old Money Architect 후속 개선
- 정적 이미지 8장 + 자막 + 내레이션 조립 방식
- code-GFX 최종 후보 루프
- GPT visual plate만으로 끝나는 영상 방식
- 3D character static plate 방식
- 생활꿀팁/EP001 돈 방어/old Money Architect 기존 주제 흐름
- Jun/준/시트콤/자동문 면접/ep003/upload_002/복사기 계열

과거 output/git history는 역사/증거로만 보존한다.

---

## 다음 단계

다음 safe work unit:

- **MVP 1 — local render manifest and ffmpeg command plan model**

구현 대상:

- render manifest TypeScript types
- planned input/overlay/caption/audio slots
- planned ffmpeg command fragments as data
- source package/video/scene linkage
- placeholder asset paths/ids only
- deterministic helper
- lightweight validation helper
- no external AI/API
- no DB migration
- no video render
- no ElevenLabs/TTS live call or real audio measurement
- no ffmpeg execution
- no payment/deploy/upload/post/push

금지:

- 이전 영상 후보 추가 개선
- 이전 산출물 기반 prompt 재사용
- Jun/준/시트콤/복사기/upload_002/ep003/3d_sitcom reference 사용
- 생활꿀팁/EP001/old Money Architect 기존 주제 재개
- upload/post/push/deploy/env/DB/dependency 변경
