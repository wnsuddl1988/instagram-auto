# Next Action

## 2026-06-25 현재 — Chart-card checkpoint 준비 완료

상태: **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**

Owner 결정:

- 프로젝트 본체는 돈관리 쇼츠 생성기가 아니다.
- 본체는 **출처 기반 금융·경제 쇼츠 제작 OS**다.
- Money-OS는 메인 콘텐츠 주제가 아니라 보조 CTA/전환 레이어다.
- 콘텐츠 비중은 출처 기반 금융·경제 쇼츠 70%, Money-OS 연결형 돈관리 쇼츠 30%.
- 각 쇼츠는 반드시 Fact Card를 먼저 만든 뒤 Video Blueprint와 대본으로 넘어간다.
- AI는 Fact Card에 없는 숫자나 사실을 상상해서 대본을 쓰면 안 된다.

최신 checkpoint:

- `909098b feat(source): establish clean source-first baseline`
- `35ca73c feat(blueprints): add fact card video blueprint generator`
- `902e632 feat(scripts): add source-linked script package generator`
- `79faa5b feat(risk): add financial expression scanner`
- push: 미실행

최근 완료:

- `money-shorts-os-chart-card-model-v1`
- review-fix: `lib/chart-cards/generator.ts`의 optional CTA card push 타입 오류 수정 (`AnyCardProps[]`)
- `lib/chart-cards/` 로컬 9:16 chart/number-card model 구현
- Codex verification:
  - source-first module-only TypeScript diagnostics: 0
  - ESLint `lib/chart-cards`: PASS
  - runtime sample: number/source linkage, blueprint null, CTA 조건부 포함, validation broken/unsupported cases PASS

Source of truth:

- `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`
- `_ai/MONEY_SHORTS_OS_PRD_V1.md`
- `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`
- `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`
- `_ai/PRODUCTION_PIPELINE_RESET_V1.md`

## 다음 safe work unit

**MVP 1 — source-backed image prompt package model**

Task ID:

`money-shorts-os-image-prompt-generator-v1`

목표:

- Fact Card/Video Blueprint/scene 정보를 기반으로 GPT 이미지 생성용 프롬프트 패키지를 로컬에서 만든다.
- 실제 이미지 생성 호출 없이 prompt text, negative rules, scene/source linkage, validation만 만든다.

포함:

- image prompt TypeScript types
- scene-level prompt package
- VideoBlueprint scene linkage
- FactCard/citation linkage where available
- deterministic helper
- negative rules for no text/no numbers/no logos/no labels inside generated images
- lightweight validation helper
- focused TypeScript/ESLint/runtime sample check

금지:

- GPT/OpenAI/Gemini/Veo live call
- canvas/SVG/PNG/image render 생성
- ECOS/KOSIS/OpenDART/FRED live API 호출
- API key/env/secret 변경
- Supabase migration 적용
- dependency/lockfile 변경
- video render
- ffmpeg 실행 파이프라인 구현
- ElevenLabs/TTS
- payment/deploy/upload/post/push
- Money-OS 전체 기능 구현
- 이전 영상 후보 개선
