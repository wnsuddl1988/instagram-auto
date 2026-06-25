# Next Action

## 2026-06-25 현재 — Content Package checkpoint 준비 완료

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
- `5bb99fd feat(image-prompts): add source-linked prompt package generator`
- `55f4a9b feat(voice-profiles): add local tts script formatter`
- `14f3c53 feat(timeline): add local timeline recalculation`
- `90fcaa6 feat(render-plan): add local ffmpeg manifest planner`
- `4256173 feat(final-qa): add source-first package readiness checks`
- content-package checkpoint: Codex-reviewed and ready for local commit
- push: 미실행

최근 완료:

- `money-shorts-os-content-package-assembler-v1`
- `money-shorts-os-content-package-assembler-v1-review-fix`
- `money-shorts-os-content-package-assembler-v1-review-fix-2`
- `lib/content-package/` 로컬 content package assembler 구현
- Codex verification:
  - source-first content-package TypeScript diagnostics: 0
  - ESLint `lib/content-package`: PASS
  - runtime sample: explicit videoId package PASS, omitted videoId non-undefined ids PASS, chart Fact Card linkage PASS, summary linkage preserved PASS, Final QA mismatch failures PASS, output not created PASS

Source of truth:

- `_ai/HANDOFF_NOW.md`
- `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`
- `_ai/MONEY_SHORTS_OS_PRD_V1.md`
- `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`
- `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`
- `_ai/PRODUCTION_PIPELINE_RESET_V1.md`

## 다음 safe work unit

**MVP 1 — local manual Fact Card authoring helper**

Task ID:

`money-shorts-os-manual-fact-card-authoring-v1`

목표:

- Owner가 수동으로 제공한 출처/숫자/해석 초안을 외부 호출 없이 validated `FactCard`로 변환한다.
- 향후 DB/UI 전에 로컬 입력 계층을 만든다.

포함:

- manual Fact Card draft/input type
- deterministic draft-to-FactCard helper
- missing source/citation/value validation
- valid/broken fixtures
- existing content package assembler로 연결되는 runtime sample

금지:

- ffmpeg 실행
- video/audio/image render
- actual media probing 또는 real duration 측정
- ElevenLabs live call
- OpenAI/GPT/Gemini/Veo live call
- ECOS/KOSIS/OpenDART/FRED live API 호출
- API key/env/secret 변경
- Supabase migration 적용
- dependency/lockfile 변경
- `output/` 변경
- payment/deploy/upload/post/push
- Money-OS 전체 기능 구현
- 이전 영상 후보 개선
