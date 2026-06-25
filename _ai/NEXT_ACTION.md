# Next Action

## 2026-06-25 현재 — Package View Model 완료, Package Library UI 준비

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
- Package View Model checkpoint: current local safe checkpoint after Codex review
- push: 미실행

최근 완료:

- `money-shorts-os-package-view-model-v1`
- `money-shorts-os-package-view-model-v1-review-fix`
- `money-shorts-os-package-view-model-v1-review-fix-2`
- `lib/package-view/` 로컬 package list/detail/workflow/copy-action view model 구현
- no-gate 초기 상태에서 copy action blocker label 합성
- 임시 `_verify.ts` 제거 확인
- Codex verification:
  - ESLint `lib/package-view/`: PASS
  - targeted TypeScript diagnostics for `lib/package-view/`: 0
  - runtime sample PASS: approved, pending, rejected, blocked, no-gate copy action labels
  - forbidden pattern search PASS: no clipboard, React UI, fetch, ffmpeg, output write
  - full `pnpm exec tsc --noEmit --pretty false`는 기존 `output/` binary `.ts` 파일에서만 실패

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

**MVP 1 — local Package Library / Detail UI**

Task ID:

`money-shorts-os-package-library-ui-v1`

목표:

- `lib/package-view/fixtures.ts`의 로컬 view model만 사용해 `/packages` UI를 만든다.
- Owner가 패키지 목록, 상세, QA/risk, owner gate, copy readiness, source/fact/social copy를 한 화면에서 검토할 수 있게 한다.
- 아직 DB/API/clipboard/render/file export는 하지 않는다.

포함:

- `app/packages/` route 추가
- approved, pending/no-gate, rejected, blocked fixture states 표시
- package list/detail/workflow/copy action summary UI
- source/fact/citation/package id 보존 표시
- social copy/hashtags/source refs verbatim 표시
- blocker labels 표시
- responsive dark dashboard layout

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
