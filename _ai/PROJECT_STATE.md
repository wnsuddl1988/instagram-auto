# AutoShorts AI — Project State

Updated: 2026-08-04 KST

## Shorts Editorial OS V2 — Slice 1 FINAL_PASS checkpoint

- Slice 0: `FINAL_PASS`; Owner 최종 판정: `SHORTS_EDITORIAL_OS_V2_SLICE_0_FINAL_PASS`.
- Slice 1: `FINAL_PASS`; Owner 최종 판정: `SHORTS_EDITORIAL_OS_V2_SLICE_1_FINAL_PASS`.
- Slice 1 Cross Review: `PASS` (`P0 0`, `P1 0`, 기술적 `P2` 차단 사유 `0`).
- 통합 설계 Source of Truth: `_ai/SHORTS_EDITORIAL_OS_V2_SLICE_0_BLUEPRINT.md`.
- 시작 baseline: branch `codex/source-first-blueprint-clean`, HEAD `1a52e1f9c0b540d492f25707dc74cf0498752a5e`, upstream `+0/-0`, modified `23`, untracked `4`, staged `0`, status path `27`.
- 보호 manifest: `_ai/SHORTS_EDITORIAL_OS_V2_SLICE_1_BASELINE.json`; 기존 dirty baseline은 `NOT_RECONSTRUCTABLE`이며 상태 문서 2개 외 기존 25개 보호 path SHA-256은 불변이다.
- Slice 1 implementation scope: `contracts`, `isolation`, `inert route skeleton`.
- 구현 세부: V2 namespace/schema, artifact/LLM exchange contracts, lifecycle validator, default-OFF flag, local `notFound()` inert route, storage interface only, deterministic fixtures, targeted checker.
- 자체 검증: `node scripts/check-shorts-editorial-os-v2-slice1.mjs` → `50/50 PASS`; targeted TypeScript diagnostics `0`.
- 기존 `/money-shorts`, V1 component/storage, middleware, `app/layout.tsx`, `next.config.*`, `package.json`, 기존 app tree는 수정하지 않았다.
- V1 실제 데이터, 외부 API, 생성·렌더·게시, OAuth, browser/worker, dev/build, DB/migration, env/secret에는 접근하거나 실행하지 않았다.
- Runtime/external integration: `NOT_STARTED`; product operational capability: `NOT_CLAIMED`.
- Slice 2: `BLOCKED_PENDING_OWNER_EXACT_SCOPE`; automatic continuation: `DISABLED`.
- 공식 전체 진행률: `NOT_CALCULATED`.
- Push: `NOT_AUTHORIZED`; checkpoint commit: `OWNER_AUTHORIZED`.
- 절차 참고: Cross Review 중 저장소 밖 scratchpad probe 파일이 사용됐으나 저장소/V1 데이터 영향은 `0`; 향후 read-only Cross Review는 inline command only.
- 상태: `SHORTS_EDITORIAL_OS_V2_SLICE_0_AND_SLICE_1_FINAL_PASS_CHECKPOINT_AUTHORIZED`.

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
