# PROJECT_STATE — AutoShorts MVP

**갱신:** 2026-06-26

**전체프로젝트 진행률:** 약 72% — source/fact-card foundation부터 package assembly, review/gate/clipboard payload, MVP1 local UI routes, RC smoke, React key warning fix, mock raw data 기반 자동 Fact Card 후보 생성, ECOS connector scaffold/mock transport/normalizer, ECOS live transport async boundary, latest available period resolver, BOK source-date resolver, latest live draft Fact Card candidate 경로, package-preview live latest candidate UI 연결, 개발서버 기본 진입점 Money Shorts OS 기준 정렬까지 완료됐다. 실제 영상 제작은 아직 금지이며, 다음 task는 Codex 지시 대기 중이다.

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
- Commit: `647f1be` — `feat(package-view): add package library view models`
- Commit: `4d264cb` — `feat(package-ui): add local package library route`
- Commit: `813a8f6` — `feat(fact-card-ui): add manual authoring screen`
- Commit: `eb03a26` — `feat(fact-card-ui): add package preview route`
- Commit: `08ff8f0` — `feat(fact-card-ui): add manual draft form`
- Commit: `9e22a59` — `feat(fact-card-ui): add sample form controls`
- Commit: `fca0b73` — `feat(fact-card-ui): add manual workflow navigation`
- Commit: `9d0e187` — `feat(money-shorts): add workflow hub route`
- Commit: `70eeecb` — `feat(money-shorts): link screens to workflow hub`
- Commit: `c66073f` — `test(money-shorts): record mvp1 route smoke pass`
- Commit: `de96040` — `fix(ui): clear package preview key warnings`
- Commit: `9978d61` — `test(money-shorts): record mvp1 rc smoke pass`
- Commit: `d85b616` — `feat(source-facts): add auto fact card candidate preview`
- Commit: `20ab76b` — `feat(source-facts): add ecos connector scaffold with mock transport`
- Commit: `87caec6` — `feat(source-facts): add ecos live transport with async connector boundary`
- Commit: `43fe473` — `fix(source-facts): align ecos mock fixtures with live truth`
- Commit: `63d9b10` — `feat(source-facts): add ecos latest-period resolver with source-date gate`
- Commit: `4bc9f0a` — `feat(source-facts): add bok base-rate source-date resolver`
- Commit: `525e635` — `feat(source-facts): connect ecos resolvers into live draft candidate path`
- Commit: `b11ebb0` — `feat(package-preview): expose ecos live latest draft candidate via explicit query`
- Commit: `7d28921` — `fix(app): route root to money shorts os hub`
- Commit: `13ba98b` — `test(app): record dev server root smoke pass`
- Commit: `101c22e` — `feat(money-shorts): add live latest draft entrypoint to hub`
- Branch: `codex/source-first-blueprint-clean`
- Push: 미실행

---

## 최근 완료

Task:

- `money-shorts-os-mvp1-rc-smoke-and-state-sync-v1`
- `money-shorts-os-mvp1-owner-acceptance-prep-v1`
- `money-shorts-os-auto-fact-card-candidate-v1`
- `money-shorts-os-auto-fact-card-candidate-v1-review-fix`
- `money-shorts-os-ecos-connector-scaffold-v1`
- `money-shorts-os-ecos-connector-scaffold-v1-review-fix`
- `money-shorts-os-ecos-live-connector-v1` + review-fix
- `money-shorts-os-ecos-live-check-v1`
- `money-shorts-os-ecos-live-truth-alignment-v1` + review-fix
- `money-shorts-os-ecos-latest-period-resolver-v1`
- `money-shorts-os-ecos-source-date-resolver-v1`
- `money-shorts-os-ecos-latest-live-draft-candidate-v1` + review-fix

구현/확인:

- MVP1 5개 local route RC smoke PASS, React key warning 0회 확인.
- Owner acceptance prep에서 `/fact-cards/manual/package-preview`가 `validHouseholdDebtResult` fixture 기반이며 manual input이 preview로 자동 반영되지 않는 구조임을 확인.
- Owner 결정: 수동 검증을 길게 끌지 않고 자동 Fact Card 후보 생성 구조로 전환.
- `RawDataSnapshot -> RawSnapshotParser -> ManualFactCardDraft -> authorManualFactCard() -> package preview` 경로를 mock ECOS 기준금리 후보로 구현.
- `/fact-cards/manual/package-preview?candidate=base-rate`에서 generated mock candidate를 preview할 수 있게 함.
- review-fix: `ManualFactCardDraft` import 위치 수정, `"3.0%"` source display string 보존, unknown `?candidate=` silent fallback 방지.
- ECOS request spec, mock transport boundary, ECOS-like response fixtures, normalizer를 추가.
- `ECOS request spec -> mock transport response -> normalized RawDataSnapshot -> existing parser -> Fact Card candidate` scaffold 경로를 구현.
- review-fix: known mock 발표일 `2025-01-16`을 request metadata로 명시 전달, human-facing source URL 보존, transport method를 `fetch()`에서 `execute()`로 변경.
- ECOS live transport async boundary 구현 (`EcosAsyncTransport` / `runEcosConnectorAsync` / `createEcosLiveTransport`). fetch + process.env key 격리. secret-safe.
- `node --env-file=.env.local scripts/_ecos-live-check.mjs` 1회 `LIVE_OK`. historical smoke request `202412~202501`: Jan2025 `3.0%`, Dec2024 `3.0%`, change `0.0%p`.
- ⚠️ Jan2025 live check는 historical smoke/fixture 검증용이며 production 최신 데이터 default가 아님. 실제 영상 제작용 Fact Card는 최신 available period를 별도 조회/선택해야 하며, 최신 period를 못 찾으면 old fixture fallback이 아니라 blocked/source refresh 상태로 가야 함.
- mock fixture/candidate를 live ECOS truth에 맞춰 정렬 (`ECOS_BASE_RATE_ROW_DEC2024.DATA_VALUE: "3.25" → "3.00"`).
- latest available ECOS 기준금리 period resolver 구현: live check 기준 latest `202605`, previous `202604`, both `2.5연%`.
- BOK 공식 기준금리 변경 이력 resolver 구현: latest ECOS 값 `2.5%`를 공식 최신 BOK 결정 `2025-05-29 2.50%`에 value matching.
- latest live draft candidate 경로 구현: latest rows -> latest period -> BOK source-date -> normalized snapshot -> Fact Card draft candidate.
- live/latest candidate는 `provider-ecos-live`, `isMock=false`, `isPublishable=false`.
- BOK source-date provenance를 rawPayload와 citation에 보존. `publishedDate=2025-05-29`는 ECOS period `202605`에서 유도하지 않음.

검증:

- targeted ESLint: 통과.
- focused TypeScript source check: 통과.
- full `tsc --project`/`pnpm build`는 기존 `output/` binary `.ts` 오염으로 전체 기준에서 제외.
- forbidden live call/render/output/deploy 패턴: 실제 호출 없음. `fetch`/`process.env`/`Date.now`는 설명 주석에서만 언급.

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

현재 우선순위:

- `dev-server-default-route-alignment-v1`: 개발서버 기본 진입점/홈 라우트/metadata/허브 링크를 Money Shorts OS 기준으로 정렬.
- 이후: Owner가 최신 Fact Card Draft를 보고 승인/수정하는 UX 연결.
- 실제 영상 제작/GPT/TTS/render/upload는 아직 금지이며 별도 Owner 승인 후 진행한다.

금지:

- 이전 영상 후보 추가 개선
- 이전 산출물 기반 prompt 재사용
- Jun/준/시트콤/복사기/upload_002/ep003/3d_sitcom reference 사용
- 생활꿀팁/EP001/old Money Architect 기존 주제 재개
- upload/post/push/deploy/env/DB/dependency 변경
- API route 변경
- OS clipboard write
- ffmpeg/render/output 변경
