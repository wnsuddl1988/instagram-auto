# PROJECT_STATE — AutoShorts MVP

**갱신:** 2026-06-25

**전체프로젝트 진행률:** 약 87% — source/fact-card foundation부터 package assembly, review/gate/clipboard payload, Package Library / Detail view model까지 로컬 source-first workflow가 안정화됐다. 다음 단계는 이 view model을 Owner가 볼 수 있는 `/packages` 로컬 UI로 연결하는 것이다.

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
- MVP1은 완성 영상 자동 생성기가 아니라, Owner가 매일 쓸 수 있는 출처 기반 콘텐츠 패키지/검토/복사 workflow다.
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
- Commit: `14f3c53` — `feat(timeline): add local timeline recalculation`
- Commit: `90fcaa6` — `feat(render-plan): add local ffmpeg manifest planner`
- Commit: `4256173` — `feat(final-qa): add source-first package readiness checks`
- Commit: `bfaf5b9` — `feat(content-package): assemble source-first package chain`
- Commit: `ca3bd36` — `feat(source-facts): add manual fact card authoring`
- Commit: `538d0d1` — `feat(review-packet): add owner review packet generator`
- Commit: `9a6428e` — `feat(owner-decision): add review packet approval gate`
- Commit: `07444ad` — `feat(clipboard-payload): add copy workflow payload builder`
- Package View Model checkpoint: current safe checkpoint after Codex review
- Branch: `codex/source-first-blueprint-clean`
- Push: 미실행

---

## 최근 완료

Task:

- `money-shorts-os-package-view-model-v1`
- `money-shorts-os-package-view-model-v1-review-fix`
- `money-shorts-os-package-view-model-v1-review-fix-2`

구현:

- `lib/package-view/types.ts`
- `lib/package-view/builder.ts`
- `lib/package-view/fixtures.ts`
- `lib/package-view/index.ts`

검증:

- ESLint `lib/package-view/`: PASS
- Targeted TypeScript diagnostics for `lib/package-view/`: 0 errors
- Runtime verification PASS:
  - approved copy action: `copyReady=true`, `blockerLabels=[]`
  - pending gate result: `"결정 미완료"` blocker label
  - rejected gate result: `"반려됨"` blocker label
  - approved-but-blocked: `"QA 미통과"` and `"위험 항목 차단"` labels
  - no-gate/no-clipboard initial state: synthetic `"결정 미완료"` label
  - no-gate workflow/list item remains `gateStatus="pending"`
  - hashtags text preserved from review/clipboard payload data
  - `_verify.ts` absent
- Forbidden-pattern search PASS:
  - no OS clipboard
  - no React UI in package-view
  - no fetch/API/render/ffmpeg/output write
- Full `pnpm exec tsc --noEmit --pretty false` remains blocked only by pre-existing `output/` binary `.ts` files.

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

- **MVP 1 — local Package Library / Detail UI**

구현 대상:

- `/packages` route
- local package list/detail/workflow/copy action UI
- `lib/package-view/fixtures.ts` 기반 approved, pending/no-gate, rejected, blocked states
- source/fact/citation/package id 보존 표시
- risk/QA/owner decision/copyReady status 표시
- social copy/hashtags/source refs verbatim 표시
- responsive dark dashboard layout

금지:

- 이전 영상 후보 추가 개선
- 이전 산출물 기반 prompt 재사용
- Jun/준/시트콤/복사기/upload_002/ep003/3d_sitcom reference 사용
- 생활꿀팁/EP001/old Money Architect 기존 주제 재개
- upload/post/push/deploy/env/DB/dependency 변경
- API route 변경
- OS clipboard write
- ffmpeg/render/output 변경
