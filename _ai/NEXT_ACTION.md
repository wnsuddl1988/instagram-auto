# Next Action

## 2026-06-25 현재 — Image prompt checkpoint 준비 완료

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
- `fa6b5a1 feat(chart-cards): add source-linked card props model`
- push: 미실행

최근 완료:

- `money-shorts-os-image-prompt-generator-v1`
- review-fix: `number_card`/`chart_card`/`cta_card` prompt가 카드 표면/CTA/숫자/라벨을 만들지 않도록 safe fallback 처리
- `lib/image-prompts/` 로컬 image prompt package model 구현
- Codex verification:
  - source-first module-only TypeScript diagnostics: 0
  - ESLint `lib/image-prompts`: PASS
  - runtime sample: generated prompt 금지 패턴 0개, valid package PASS, manually injected `Money-OS CTA 카드`/`현재값 숫자 카드` validation fail PASS

Source of truth:

- `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`
- `_ai/MONEY_SHORTS_OS_PRD_V1.md`
- `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`
- `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`
- `_ai/PRODUCTION_PIPELINE_RESET_V1.md`

## 다음 safe work unit

**MVP 1 — local voice profile and TTS script formatter model**

Task ID:

`money-shorts-os-voice-profile-spec-v1`

목표:

- ElevenLabs 호출 없이 로컬 voice profile 타입/설정과 TTS-ready script formatter를 만든다.
- 기존 Blueprint/Script narration만 사용하고 새 사실이나 문장을 임의 생성하지 않는다.

포함:

- voice profile TypeScript types
- local provider/settings model
- default Money Architect voice profile fixture
- GeneratedScriptPackage 또는 VideoBlueprint 기반 TTS script package helper
- scene/package linkage
- lightweight validation helper
- focused TypeScript/ESLint/runtime sample check

금지:

- ElevenLabs live call
- OpenAI/GPT/Gemini/Veo live call
- audio generation 또는 duration 측정
- ECOS/KOSIS/OpenDART/FRED live API 호출
- API key/env/secret 변경
- Supabase migration 적용
- dependency/lockfile 변경
- video render
- ffmpeg 실행 파이프라인 구현
- payment/deploy/upload/post/push
- Money-OS 전체 기능 구현
- 이전 영상 후보 개선
