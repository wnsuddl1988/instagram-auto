# Next Action

## 2026-06-25 현재 — Hub Entry Links 완료, MVP1 Route Smoke 준비

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
- `eb03a26 feat(fact-card-ui): add package preview route`
- `08ff8f0 feat(fact-card-ui): add manual draft form`
- `9e22a59 feat(fact-card-ui): add sample form controls`
- `fca0b73 feat(fact-card-ui): add manual workflow navigation`
- `9d0e187 feat(money-shorts): add workflow hub route`
- Hub Entry Links checkpoint: current local safe checkpoint after Codex review
- push: 미실행

최근 완료:

- `money-shorts-os-workflow-hub-entry-links-v1`
- Existing Money Shorts local screens now link back to `/money-shorts`:
  - `/fact-cards/manual`
  - `/fact-cards/manual/new`
  - `/fact-cards/manual/package-preview`
  - `/packages`
- Existing route content/behavior preserved.
- Codex verification:
  - ESLint changed route files: PASS
  - targeted TypeScript diagnostics for changed routes: 0
  - forbidden pattern search PASS
  - Claude HTTP verification passed

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

**MVP 1 — Local UI Route Smoke Pass**

Task ID:

`money-shorts-os-mvp1-local-ui-smoke-v1`

목표:

- Money Shorts OS MVP1 로컬 UI route 5개가 연결되고 핵심 화면이 유지되는지 smoke 검증한다.

포함:

- `/money-shorts`
- `/fact-cards/manual`
- `/fact-cards/manual/new`
- `/fact-cards/manual/package-preview`
- `/packages`
- HTTP 200 / 핵심 텍스트 / 핵심 href 검증
- 필요 시 작은 blocker fix만 허용

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
