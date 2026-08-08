# AutoShorts AI — Project State

Updated: 2026-08-08 KST

## Shorts Editorial OS V2 — Production Activation PA-2 full draft autosave and hydration

- Owner approval: `APPROVE_SHORTS_EDITORIAL_OS_V2_PRODUCTION_ACTIVATION_PA2_FULL_DRAFT_AUTOSAVE_HYDRATION_AND_RESUME_AUTONOMOUS_LOOP`.
- Slice 0~8: `FINAL_PASS`; V2 base rebuild milestone: `FINAL_PASS`; PA-1: `FINAL_PASS`; Governance: `ACTIVE`.
- PA-1 checkpoint: `41d302a9954015ad34a7ca96313f3ccb54a344b2`; PA-2: `IMPLEMENTATION_COMPLETE_AWAITING_CROSS_REVIEW`; PA-2 Cross Review: `NOT_STARTED`; correction cycle: `2`.
- Scope: seven Workbench full draft capture → deterministic snapshot/hash → 1,350ms autosave → optimistic draft/base revision guard → atomic local draft/LKG → safe hydration → approval downgrade → explicit draft recovery → localhost Playwright reload/two-tab proof.
- exact 23-path checkpoint: `PREAUTHORIZED_AFTER_CLAUDE_PASS_P0_0_P1_0`; fixed message: `feat(editorial-v2): checkpoint production activation draft resume`.
- approved checkpoint authority: `CANONICAL`; draft approval authority: `NON_CANONICAL`; Draft Resume는 Approval Resume가 아니다.
- full draft autosave: `IMPLEMENTED_PENDING_REVIEW`; full Workbench hydration: `IMPLEMENTED_PENDING_REVIEW`; optimistic conflict guard: `IMPLEMENTED_PENDING_REVIEW`.
- local draft store: `LOCAL_ONLY_UNENCRYPTED_JSON`; cloud sync: `NOT_IMPLEMENTED`; encryption at rest: `NOT_IMPLEMENTED`; 민감한 secret/API key 저장은 금지 안내한다.
- automatic merge, stale draft force hydration, conflict force overwrite, draft hard delete, automatic approved checkpoint creation: `NOT_IMPLEMENTED`.
- safe hydration은 project/schema/integrity/base revision/approved checkpoint hash가 모두 일치할 때만 허용하고, draft의 approval-like state는 `pending_reconfirmation` 또는 `invalidated`로 내린다.
- Draft API: same-origin GET/PUT/PATCH, feature OFF·invalid ID·body/schema/integrity/revision/origin/recovery confirmation hard stop, DELETE 없음, 실제 data root·stack 비노출.
- Draft recovery: current corruption 자동 덮어쓰기·삭제 없음; valid LKG와 explicit Owner confirmation이 필요하며 approved snapshot을 수정하지 않는다.
- Self-validation: PA-2 checker `1103/1103 PASS`; targeted TypeScript syntactic/semantic diagnostics `0`; full strict pre-emit `PASS`; `git diff --check` PASS; exact 47-path 상태와 보호 mismatch `0`.
- Draft persistence probe: `PASS`; OS temp root에서 seven-stage draft, exact raw string, optimistic revision/base conflict, current 불변, corruption overwrite 차단, explicit Owner LKG recovery, approval downgrade, project/schema/size 차단, approved snapshot 불변, cleanup 및 repository status/hash 불변을 확인했다.
- Local browser runtime proof: final `PASS`; UI project create, Research field/raw exact autosave·reload, same-origin seven-stage full draft, 7 Workbench hydration, approval 비승격, two-tab first-writer save/second-writer 409, conflict autosave pause, external request `0`, page error `0`, server/browser/temp cleanup, repository status/hash 불변을 확인했다.
- Runtime correction: 정상 same-origin host 정규화 false 403과 시간 기반 hydration suppression 경합을 발견해 allowlist 안에서 Host/request URL strict candidate 비교와 mounted-stage callback completion barrier로 수정했다. `Hydrating → Clean` 전환 후 사용자 입력을 받는 probe 동기화까지 correction cycle 2 안에서 완료했다.
- Optional build: `NOT_COMPLETED_ENVIRONMENT_TOOLING`; 정확히 1회 시도했으나 compile 전 pnpm supply-chain wrapper의 `ERR_PNPM_IGNORED_BUILDS`(`sharp`, `unrs-resolver`)로 중단했다. dependency 승인·install·lockfile/config 변경 및 build 재실행은 하지 않았다.
- V1 migration: `NOT_IMPLEMENTED`; V1 data/root: `UNTOUCHED`; external integrations: `NOT_STARTED`.
- External API, OAuth, actual TTS/asset/render, account write, upload/publish/schedule, DB/cloud, deploy, push: `NOT_EXECUTED`.
- product operational capability: `NOT_CLAIMED`; Push: `NOT_AUTHORIZED`; progress: `NOT_CALCULATED`; PA-3: `BLOCKED`.
- 다음 routine 작업은 exact 23-path Claude Code read-only Cross Review다. runtime probe와 build는 Claude가 재실행하지 않는다.

## Shorts Editorial OS V2 — Slice 8 representative sample and relaunch readiness

- Owner approval: `APPROVE_SHORTS_EDITORIAL_OS_V2_SLICE_8_REPRESENTATIVE_SAMPLE_AND_RELAUNCH_READINESS_AUTONOMOUS_LOOP`.
- Slice 0~7: `FINAL_PASS`; Slice 7 checkpoint HEAD: `9a29fd4d2fd3e828a45f31d0c0ee2332465b4a62`; actual parent: `5e0e0e044b3ebea6af07b98e733a3eac6a96aa2c`.
- Governance: `ACTIVE`; Slice 8: `IMPLEMENTATION_COMPLETE_AWAITING_CROSS_REVIEW`; Slice 8 Cross Review: `NOT_STARTED`.
- Scope: approved Publish Integration snapshot → end-to-end provenance → eight-scene representative storyboard → synthetic local sample proof → three relaunch directions → provisional identity/descriptions/SVG drafts/pinned post → launch checklist → Production Activation gaps.
- exact 17-file checkpoint: `PREAUTHORIZED_AFTER_CLAUDE_PASS_P0_0_P1_0`; fixed message: `feat(editorial-v2): checkpoint slice 8 relaunch readiness`.
- representative sample: `SYNTHETIC_ONLY`; user-content production sample: `NOT_IMPLEMENTED`; sample validation: `REPRESENTATIVE_SAMPLE_PRECHECK_ONLY`.
- relaunch identity: `PROVISIONAL_SESSION_ONLY`; final brand: `NOT_APPROVED`; handle availability: `UNVERIFIED`; current platform limits: `UNVERIFIED`.
- profile/cover: `INLINE_SVG_PREVIEW_ONLY`; actual visual assets: `NOT_CREATED`; final typography/color/character name: `NOT_APPROVED`.
- actual account changes: `NOT_EXECUTED`; external TTS: `NOT_CONNECTED`; production render: `NOT_IMPLEMENTED`; OAuth: `NOT_CONNECTED`; actual publish: `NOT_IMPLEMENTED`; durable persistence: `NOT_IMPLEMENTED`.
- Production Activation gaps: `_ai/SHORTS_EDITORIAL_OS_V2_PRODUCTION_ACTIVATION_GAPS.md`; public launch readiness: `FALSE`; Production Activation: `BLOCKED_PENDING_CHATGPT_CONTROL_TOWER_SCOPE`.
- self-check: Slice 8 checker `784/784 PASS`; targeted TypeScript semantic `0`, syntactic `0`; final full `pnpm exec tsc --noEmit` PASS; `git diff --check` PASS; exact 41-path와 보호 mismatch `0`.
- synthetic representative sample probe: `PASS` (정확히 1회); 8 scenes, 1080×1920, 30fps, 24 seconds, video/audio/subtitle streams, output SHA-256 `30f034e968108161da68de0b8d837aad26e3a7ef0a2d32b48ba4682a2c76da9f`, `publicReady=false`, `syntheticOnly=true`, temporary directory removed, repository status unchanged.
- optional build: `PASS` (정확히 1회); Next.js compile·TypeScript·26 routes/pages generation 완료. Build 후 pure provenance/reference hardening은 final full `tsc`와 checker로 재검증했으며 build/probe는 재실행하지 않았다. 기존 `next.config.ts`/`app/api/manual-render/route.ts` NFT dynamic trace warning 1건은 pre-existing이며 Slice 8 경로 밖이다.
- runtime UI: `UNVERIFIED`; product operational capability: `NOT_CLAIMED`; Push: `NOT_AUTHORIZED`; automatic continuation: `DISABLED`; progress: `NOT_CALCULATED`.
- P2 backlog 유지: Slice 3 숫자 표기/금융 정규식, Slice 4 visual-plan 유지보수성, Slice 5 최종 identity, Slice 6 renderer capability/voice locale, Slice 7 deterministic digest 및 manual identity 범위 주석.
- External API/search/URL fetch/DNS, actual TTS/image/video asset generation, actual user-content render, account/OAuth, DB/storage, upload/publish/schedule, deploy, push, env/secret direct read는 Slice 8에서 수행하지 않았다.

## Shorts Editorial OS V2 — Slice 7 publish package, identity, dedupe, and recovery dry-run

- Owner approval: `APPROVE_SHORTS_EDITORIAL_OS_V2_SLICE_7_PUBLISH_PACKAGE_IDENTITY_DEDUPE_AND_RECOVERY_DRY_RUN_AUTONOMOUS_LOOP`.
- Slice 0·1·2·3·4·5·6는 `FINAL_PASS`; Slice 6 checkpoint HEAD는 `5e0e0e044b3ebea6af07b98e733a3eac6a96aa2c`다.
- Governance Source of Truth: `_ai/SHORTS_EDITORIAL_OS_V2_GOVERNANCE.md`; governance: `ACTIVE`; autonomous same-Slice loop, mandatory routing header, and ChatGPT escalation are `ACTIVE`.
- Slice 7: `IMPLEMENTATION_COMPLETE_AWAITING_CROSS_REVIEW`; Slice 7 Cross Review: `NOT_STARTED`.
- Slice 7 scope: approved Render Integration snapshot → platform publish packages → manual destination identity hard stop → internal metadata/source disclosure → immediate/scheduled intent → deterministic session dedupe → attempt journal → failed-platform-only recovery → provider-independent bridge → synthetic no-network dry-run → session approval.
- exact 18-file checkpoint: `PREAUTHORIZED_AFTER_CLAUDE_PASS_P0_0_P1_0_ESCALATION_NO`; fixed message: `feat(editorial-v2): checkpoint slice 7 publish recovery plan`.
- Publish Package: `SESSION_ONLY`; account identity: `MANUAL_UNVERIFIED`; wrong-account hard stop: `STRUCTURAL`; external identity verification: `NOT_PERFORMED`.
- platform metadata: `INTERNAL_PLANNING_POLICY`; source existence: `UNVERIFIED`; cover: `METADATA_ONLY`; schedule: `INTENT_ONLY`; scheduler: `UNAVAILABLE`.
- duplicate prevention: `SESSION_ONLY`; publication ledger: `SESSION_ONLY`; remote duplicate status: `UNKNOWN`; durable ledger: `NOT_IMPLEMENTED`.
- attempt journal: `DRY_RUN_ONLY`; recovery: `PLAN_ONLY`; successful-platform re-execution: `FORBIDDEN`; publish bridge: `executionReady=false`.
- self-check: Slice 7 checker `603/603 PASS`; targeted TypeScript semantic `0`, syntactic `0`; `git diff --check` PASS; exact 42-path와 보호 mismatch `0`.
- synthetic no-network publish dry-run: `PASS` (정확히 1회); Instagram success + YouTube retryable failure → YouTube-only retry success, 성공 key 중복·wrong-account·과거 schedule·Owner 미확인 차단, repository status unchanged를 확인했다. 실제 외부 실행은 `0`이다.
- optional build: `NOT_RUN`; checker·probe·targeted diagnostics가 PASS했고 dependency/config 변경이 없어 이번 Slice에서는 생략했다.
- OAuth: `NOT_CONNECTED`; actual account lookup: `NOT_PERFORMED`; actual upload: `NOT_IMPLEMENTED`; actual publish: `NOT_IMPLEMENTED`; actual schedule: `NOT_IMPLEMENTED`.
- runtime UI: `UNVERIFIED`; product operational capability: `NOT_CLAIMED`; Push: `NOT_AUTHORIZED`; automatic continuation: `DISABLED`; progress: `NOT_CALCULATED`.
- Slice 8: `BLOCKED`; 다음 exact scope는 ChatGPT Control Tower와 Owner 승인 전 정의하거나 시작하지 않는다.
- Slice 3 maintenance backlog: 숫자 표기 동등값의 안전측 과잉 차단 가능성과 금융 안전 정규식 중복은 비차단 P2로 유지한다.
- Slice 4 maintenance backlog: 기본 visual strategy 우선순위 의도 주석과 visual plan field 복제 유지보수성은 비차단 P2로 유지한다.
- Slice 5 maintenance backlog: 최종 캐릭터명·팔레트·브랜드 identity 결정은 계속 범위 밖이다.
- Slice 6 maintenance backlog: `renderer-bridge.ts` ffprobe capability의 declaration-only 명시 검토와 `voice_locale_unverified` blocking 승격 검토는 비차단 P2로 유지하며 Slice 7에서는 수정하지 않았다.
- External TTS/API/search/URL fetch/DNS, OAuth, account API, DB/storage, actual asset/audio/render, upload, publish, schedule, deploy, env/secret direct read는 Slice 7에서 수행하지 않았다.

## Shorts Editorial OS V2 — Slice 2 FINAL_PASS checkpoint

- Slice 0: `FINAL_PASS`; Owner 최종 판정: `SHORTS_EDITORIAL_OS_V2_SLICE_0_FINAL_PASS`.
- Slice 1: `FINAL_PASS`; Owner 최종 판정: `SHORTS_EDITORIAL_OS_V2_SLICE_1_FINAL_PASS`.
- Slice 1 Cross Review: `PASS` (`P0 0`, `P1 0`, 기술적 `P2` 차단 사유 `0`).
- Slice 0·1 checkpoint commit: `795ff8a93b350991c0069cd67f7b6ca58ee7f433`.
- 통합 설계 Source of Truth: `_ai/SHORTS_EDITORIAL_OS_V2_SLICE_0_BLUEPRINT.md`.
- 시작 baseline: branch `codex/source-first-blueprint-clean`, HEAD `1a52e1f9c0b540d492f25707dc74cf0498752a5e`, upstream `+0/-0`, modified `23`, untracked `4`, staged `0`, status path `27`.
- 보호 manifest: `_ai/SHORTS_EDITORIAL_OS_V2_SLICE_1_BASELINE.json`; 기존 dirty baseline은 `NOT_RECONSTRUCTABLE`이며 상태 문서 2개 외 기존 25개 보호 path SHA-256은 불변이다.
- Slice 1 implementation scope: `contracts`, `isolation`, `inert route skeleton`.
- 구현 세부: V2 namespace/schema, artifact/LLM exchange contracts, lifecycle validator, default-OFF flag, local `notFound()` inert route, storage interface only, deterministic fixtures, targeted checker.
- 자체 검증: `node scripts/check-shorts-editorial-os-v2-slice1.mjs` → `50/50 PASS`; targeted TypeScript diagnostics `0`.
- 기존 `/money-shorts`, V1 component/storage, middleware, `app/layout.tsx`, `next.config.*`, `package.json`, 기존 app tree는 수정하지 않았다.
- V1 실제 데이터, 외부 API, 생성·렌더·게시, OAuth, browser/worker, dev/build, DB/migration, env/secret에는 접근하거나 실행하지 않았다.
- Slice 2: `FINAL_PASS`; Owner 최종 판정: `SHORTS_EDITORIAL_OS_V2_SLICE_2_FINAL_PASS`.
- Slice 2 Cross Review: `PASS`; 최초 `NEEDS_FIX` (`P0 0`, `P1 2`) 후 P1 correction targeted re-review `PASS` (`P0 0`, `P1 0`, 비차단 `P2 5`).
- P1 correction: strict `publishedAt` calendar validation과 localhost / IPv4-mapped IPv6 URL validation을 국소 수정했다.
- Slice 2 scope: Prompt Export, session-only Safe LLM Import, deterministic normalization, import validation, field-level repair, session approval.
- 자체 검증: checkpoint-aware Slice 2 checker `182/182 PASS`; targeted TypeScript syntactic/semantic diagnostics 각각 `0`.
- Slice 1 checker는 pre-checkpoint Git 상태 전용이므로 Owner 보정 승인에 따라 재실행하지 않았고 파일도 수정하지 않았다.
- External LLM API: `NOT_CONNECTED`; URL fetch·DNS·source existence verification: `NOT_IMPLEMENTED`.
- Runtime browser UI·clipboard: `UNVERIFIED`; durable persistence: `NOT_IMPLEMENTED`.
- Evidence Pack·Topic Evaluation·Script·Scene Card: `NOT_IMPLEMENTED`; product operational capability: `NOT_CLAIMED`.
- 비차단 P2: 24h UTC calendar-day 설명, valid+malformed JSON 후보 정책, duplicate JSON key, repair leading-zero/missing-key 정책, currency heuristic 한계.
- Slice 3: `BLOCKED_PENDING_OWNER_EXACT_SCOPE`; automatic continuation: `DISABLED`.
- 공식 전체 진행률: `NOT_CALCULATED`.
- Push: `NOT_AUTHORIZED`; Slice 2 checkpoint commit: `58736883c200148e90fe4de44d7e25a1c63f70a2` (`COMPLETED`).
- 절차 참고: Cross Review 중 저장소 밖 scratchpad probe 파일이 사용됐으나 저장소/V1 데이터 영향은 `0`; 향후 read-only Cross Review는 inline command only.
- 상태: `SHORTS_EDITORIAL_OS_V2_SLICE_2_CHECKPOINT_COMMIT_COMPLETE`.

## 현재 운영 기준

- `ROLE_MODE: MAIN_AI_MODE`, Main AI는 Codex다.
- 현재 V1은 **재테크 쇼츠 전용 제작 화면과 제작·검수·게시 경로**다. 비재테크 7개 카테고리는 활성 제품 범위가 아니다.
- 한 주제를 무조건 2편으로 나누지 않는다. `finance-editorial-script-engine`의 의미 게이트가 `single | part-1 | part-2`를 결정하며, UI에는 대본 제안이 아니라 실제 미디어의 최종 제작 전략을 표시한다.
- Phase 0~4 기준 작업은 완료됐다. 이후 기본 상태는 운영 동결이며, 새 주제 제작이나 외부 게시를 자동으로 시작하지 않는다.

## 현재 게시 완료 증거

현재 승인된 한 개의 재테크 콘텐츠 유닛은 2편 모두 Instagram과 YouTube 게시가 완료됐다.

| 편 | Instagram | YouTube | 운영 판정 |
| --- | --- | --- | --- |
| Part 1 | media `17875557156526534` · [게시물](https://www.instagram.com/gyeongjebeonyeokso/reel/Da8mtd3iQ0w/) | video `3pdH6FTbHlg` · [Shorts](https://www.youtube.com/shorts/3pdH6FTbHlg) | `complete` |
| Part 2 | media `17942576889054573` | video `WD0Ayy-1E5M` · [Shorts](https://www.youtube.com/shorts/WD0Ayy-1E5M) | `complete` |

- Part 2 YouTube 복구 실행 결과는 `PART2_YOUTUBE_RECOVERY_OK`이며, result fingerprint는 `fdc6199cef1bff5126f6dd338018c92eea347977bf8dbddf5996ee96fbb69c73`다.
- Part 2 기록 후 publication ledger SHA-256은 `88f37924b8995533d965d0bed6b53482918f64d07e3caec7d7c1060159d987ec`다.
- Part 1 Instagram은 최초 이중 게시 실행이 ledger 기록 전 실패해 활성 ledger 행이 없지만, Owner reconciliation의 canonical media 증거와 Part 1 YouTube ledger를 결합한 recovery overlay가 `complete`로 판정한다. 일반 재업로드 경로는 차단돼 있으며 ledger backfill은 V1 완료에 필요하지 않아 수행하지 않았다.
- 두 편 모두 자동 재시도는 0이고, 같은 콘텐츠를 일반 이중 업로드 경로로 다시 게시하면 안 된다.

## 승인된 산출물 잠금

- Part 1 MP4 SHA-256: `c8ea9b608fd6cb537da54d795b3b525b312ef65f531efd67e289991d54053310`
- Part 2 MP4 SHA-256: `bd9286b24f6463ae4a876e2c6414d49083b350c3759e9e33c60d27e0ca9a9d98`
- Part 1 manifest SHA-256: `92d491cf3d298899f44c1198888faacddde2c3f52233f4bf41ff9387fc663b90`
- Part 2 manifest SHA-256: `f71e8f303cdeb22c06af0f7998a619d91d1b0f24c90a7b9d1c3846144c6bf099`

## V1에 유지할 것

- 재테크 전용 주제 추천, 500-title editorial bank, 대표 주제 품질·신선도 검사
- 의미 기반 `single | part-1 | part-2` 대본·제작 전략
- 대본 품질 게이트, TTS 청취 승인, 이미지 QA, Flow 유료 실행 승인, 최종 영상 해시 검증
- 실제 게시 직전 Owner 확인과 일회성·증거 결합 복구 경로
- Instagram/YouTube publication read model과 중복 게시 차단

## V1에서 동결할 것

- 큐·안전 세션·무인 실행·외부 생성 예산 정책의 추가 확장
- 자동 게시, 자동 재시도, 다계정 fallback, 백그라운드 스케줄러
- 비재테크 8개 카테고리 일반화, n8n 활성화, DB·배포 구조 확대
- 기존 큐·안전 세션 코드는 제거하지 않되 고급 로컬 기능으로 비활성 유지한다. 새 요구가 생기기 전에는 V1 우선순위로 다루지 않는다.

## 최종 검증

- 재테크 전용 Owner UI 정적 계약: `385/385 PASS`
- 대표 3주제 local pipeline smoke: `17/17 PASS`
- Part 1 recovery: `61/61 PASS`
- Part 1 overlay: `15/15 PASS`
- Part 2 overlay: `18/18 PASS`
- Owner reconciliation: `33/33 PASS`
- publication packet: `8/8 PASS`
- partial recovery: `83/83 PASS`
- `pnpm exec tsc --noEmit`: PASS
- `pnpm build`: PASS. `next.config.ts`/`app/api/manual-render/route.ts`의 기존 Turbopack 동적 경로 추적 경고 1건은 남지만 빌드 실패가 아니며 이번 V1 게시 상태와 무관하다.

## Git / 보호 범위

- 브랜치: `codex/source-first-blueprint-clean`
- 마지막 기능 체크포인트: `cc8975d` (`feat(money-shorts): add Part 2 YouTube recovery execution`)
- push는 승인되지 않았고 수행하지 않았다.
- 다음 3개는 Owner 보호 변경이다. 읽기 외 편집·삭제·stage·commit 금지:
  - `scripts/render-golden-sample-visual-only-v1.mjs`
  - `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`
  - `scripts/get-youtube-refresh-token-once.mjs`

## Owner 승인 게이트

- 새 주제의 유료 TTS·이미지·Flow 실행 및 실제 Instagram/YouTube 게시
- push, deploy, env/secret, 계정, DB, 외부 서비스 상태 변경
- 게시 완료 증거의 backfill 또는 기존 publication ledger 변경
