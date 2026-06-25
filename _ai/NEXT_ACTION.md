# Next Action

## 2026-06-25 현재 — Final QA checkpoint 준비 완료

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
- final-qa checkpoint: Codex-reviewed and ready for local commit
- push: 미실행

최근 완료:

- `money-shorts-os-final-qa-model-v1`
- `money-shorts-os-final-qa-model-v1-review-fix`
- `money-shorts-os-final-qa-model-v1-review-fix-2`
- `lib/final-qa/` 로컬 final QA model/checklist runner 구현
- Codex verification:
  - source-first final-qa TypeScript diagnostics: 0
  - ESLint `lib/final-qa`: PASS
  - runtime sample: valid chain PASS, source id mismatch FAIL, render source/fact/citation mismatch FAIL, timeline fact/citation mismatch FAIL, render timeline mismatch FAIL, blocked risk FAIL

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

**MVP 1 — local content package assembler**

Task ID:

`money-shorts-os-content-package-assembler-v1`

목표:

- 기존 source-first 로컬 모듈을 하나의 package object로 묶는다.
- 실제 렌더 없이 Fact Card부터 Final QA까지 연결된 mock package chain을 생성한다.

포함:

- content package TypeScript types
- deterministic assembler helper
- existing module generator/validator orchestration
- source/fact/citation/package id summary
- final QA result 포함
- lightweight fixtures and runtime samples

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
