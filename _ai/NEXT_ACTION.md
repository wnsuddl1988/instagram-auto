# Next Action

## 2026-06-25 현재 — Package Preview UI 완료, Manual Fact Card Form 준비

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
- `bfaf5b9 feat(content-package): assemble source-first package chain`
- `ca3bd36 feat(source-facts): add manual fact card authoring`
- `538d0d1 feat(review-packet): add owner review packet generator`
- `9a6428e feat(owner-decision): add review packet approval gate`
- `07444ad feat(clipboard-payload): add copy workflow payload builder`
- `647f1be feat(package-view): add package library view models`
- `4d264cb feat(package-ui): add local package library route`
- `813a8f6 feat(fact-card-ui): add manual authoring screen`
- Package Preview UI checkpoint: current local safe checkpoint after Codex review
- push: 미실행

최근 완료:

- `money-shorts-os-manual-fact-card-to-package-preview-ui-v1`
- `/fact-cards/manual/package-preview` local Manual Fact Card -> Package Preview UI
- valid manual FactCard -> assembled content package preview
- review packet / owner gate / clipboard payload / package view summary visible
- source/fact/package/QA/risk linkage visible
- mock approval clearly labeled as local preview only
- Codex verification:
  - ESLint `app/fact-cards/manual/package-preview/page.tsx`: PASS
  - targeted TypeScript diagnostics for `app/fact-cards`: 0
  - forbidden pattern search PASS
  - HTTP 200 for `/fact-cards/manual/package-preview`
  - core text rendered: `LOCAL PREVIEW ONLY`, `Package Preview`, `가계부채`, package id, mock approval notice
  - dev server stopped

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

**MVP 1 — Manual Fact Card Draft Form UI**

Task ID:

`money-shorts-os-manual-fact-card-form-v1`

목표:

- Owner가 브라우저에서 출처 기반 Fact Card draft를 직접 입력/수정하고, 로컬 validation 결과를 즉시 볼 수 있는 form UI를 만든다.
- 아직 DB/API/clipboard/render/file export는 하지 않는다.

포함:

- `app/fact-cards/manual/new/` route 추가
- `authorManualFactCard()` 기반 local validation
- valid/invalid 상태 표시
- validation error code/field/message 표시
- source URL/date/citation 필드 표시 및 편집
- valid 상태에서 FactCard summary 표시
- `/fact-cards/manual` 및 `/fact-cards/manual/package-preview` 연결

금지:

- OS clipboard write
- API route 호출 또는 변경
- DB/Supabase read/write/migration
- ffmpeg 실행
- video/audio/image render
- actual media probing 또는 real duration 측정
- ElevenLabs live call
- OpenAI/GPT/Gemini/Veo live call
- ECOS/KOSIS/OpenDART/FRED live API 호출
- API key/env/secret 변경
- dependency/lockfile 변경
- `output/` 변경
- file export/write
- payment/deploy/upload/post/push
- Money-OS 전체 기능 구현
- 이전 영상 후보 개선
