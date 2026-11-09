# Vercel Blob Dependency + Code Integration (No-Upload / Fail-Closed)

Task: `vercel-blob-dependency-code-integration-no-upload-v1`
Owner approval: `APPROVE_VERCEL_BLOB_DEPENDENCY_AND_CODE_INTEGRATION_NO_UPLOAD`
Status: **dependency 설치 + code integration 완료, no-upload.** 실제 object upload / env·token read·write / public URL live check / Instagram `--arm` / deploy는 이 slice에서 수행하지 않는다.

관련 계약:
- [`docs/vercel-blob-instagram-integration-packet.md`](./vercel-blob-instagram-integration-packet.md) — integration packet (상위 설계).
- [`docs/vercel-blob-store-provisioning-result.md`](./vercel-blob-store-provisioning-result.md) — public store provisioning 결과.

---

## 1. Dependency 설치

- 패키지: **`@vercel/blob` 2.5.0** (`package.json`에 `^2.5.0` 1줄 추가).
- 매니저: **pnpm 11.7.0**. 시스템 PATH의 pnpm(10.33.2)은 v10 store를 요구해 기존 `node_modules`(v11 store 링크)와 충돌하므로, pnpm 11.7.0 바이너리 + base store-dir(`...\pnpm\store`)로 설치했다.
- 명령: `pnpm add @vercel/blob --store-dir "C:\Users\PC\AppData\Local\pnpm\store"` (pnpm 11.7.0 바이너리).
- lockfile: `pnpm-lock.yaml`은 **additive만**(+183 lines, 삭제 0) — `@vercel/blob`와 전이 의존성 추가.
- **이 dependency 외 churn 없음.** pnpm 11이 자동 추가한 `pnpm-workspace.yaml`의 `allowBuilds:` 스텁(sharp/unrs-resolver build 승인 플레이스홀더)은 `@vercel/blob`와 무관하여 되돌렸다.
- `pnpm config set` / global config 변경 / full `pnpm install` / lockfile 손수 수정 없음.

## 2. Code Integration — `lib/instagram-blob-media.ts`

fail-closed reusable 모듈. import 시점에 env/network/credential 접근 없음.

- **deterministic pathname builder**: `instagram/reels/{contentId}/{variantId}/{version}/{sha256_12}.mp4`
- **Instagram-only guard**: platform이 `instagram`이 아니면 blocker.
- **variant guard**: `instagram_reels_full_frame_1080x1920`만 허용.
- **size guard**: 35MB cap, 초과 시 `size_exceeds_cap` fail-closed.
- **extension/content type guard**: `mp4` / `video/mp4`.
- **SDK put 옵션 plan** (`instagramBlobPutOptionPlan()`):
  - `access: "public"`, `addRandomSuffix: false`, `allowOverwrite: false`, `multipart: true`, `contentType: "video/mp4"`
- **no-upload plan builder** (`planInstagramBlobUpload()`): 모든 guard 통과 시 pathname + put 옵션 plan 반환, 실패 시 blockerCodes와 함께 `ok:false`. 실제 업로드 없음.
- **actual upload는 fail-closed** (`uploadInstagramBlob()`): `approvalToken`/`ownerApproved` 입력과 무관하게 항상 `uploaded:false` + `INSTAGRAM_BLOB_UPLOAD_BLOCKED_NO_APPROVAL`을 반환한다. **이 함수에는 `put()`을 호출하는 코드 경로가 존재하지 않는다.** future approval token `APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST` 이후 slice에서만 실제 put 경로를 추가한다.
- `@vercel/blob`는 **`import type`으로만** 참조(`PutBlobResult`, `PutCommandOptions`). 값 import나 `put()` 호출 없음 → SDK credential resolution(explicit token → OIDC → `process.env.BLOB_READ_WRITE_TOKEN`)이 트리거되지 않는다.

## 3. No-Upload Planner — `scripts/plan-vercel-blob-instagram-upload-no-upload.mjs`

approved local Instagram/full-frame mp4를 **read-only**로 읽어 size/sha256/pathname/put 옵션 plan만 만든다.

- input: `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4`
- expected bytes: `20294549`
- 결과 (dry run):
  - `sizeBytes`: 20294549 (expected 일치 ✓)
  - `withinSizeCap`: true (20.3MB < 35MB)
  - `sha256_12`: `54957450ac10`
  - `pathname`: `instagram/reels/t1_lifestyle_inflation/instagram_reels_full_frame_1080x1920/v3_2/54957450ac10.mp4`
  - `status`: `PLANNED_NO_UPLOAD`, `uploadPerformed`: false
- `@vercel/blob` 미참조, upload/list/head/get/delete/copy 0, network/env 0, file write 0. output은 stdout JSON evidence만.

## 4. Blob은 Instagram-only

- Blob 업로드 대상은 `instagram_reels_full_frame_1080x1920` variant 뿐.
- YouTube(`youtube_shorts_letterbox_1080x1920`)는 Blob/public URL을 쓰지 않고 YouTube Data API direct file upload를 사용한다. 이 코드/planner는 YouTube를 라우팅하지 않는다.

## 5. 다음 승인 게이트

이 integration 이후에도 아래는 별도 Owner 승인이 필요하다:
- `APPROVE_VERCEL_BLOB_ENV_TOKEN_WRITE_OR_PULL` — `BLOB_READ_WRITE_TOKEN` env/secret 설정 또는 store project 연결.
- `APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST` — 결정론적 key로 실제 object 1회 업로드(= `uploadInstagramBlob`의 put 경로 활성화).
- `APPROVE_VERCEL_BLOB_PUBLIC_URL_LIVENESS` — public URL verifier gate live check.
- `APPROVE_INSTAGRAM_ARM` — 검증된 Blob URL로 Instagram 실제 1회 발행.
- `APPROVE_VERCEL_BLOB_CLEANUP_RETENTION_JOB` — 발행 성공 후 cleanup/retention.

## 6. 금지 (이 slice)

- `@vercel/blob` `put()`/list/head/get/delete/copy 호출, Blob object upload
- public URL liveness check
- env/secret/token read/write/print/copy, `.env.local` 접근, `vercel env pull`
- Blob store project link, Vercel CLI Blob mutation
- Instagram API/`--arm`, YouTube API/OAuth/upload
- deploy/DNS/domain 변경, render/mux/TTS/image/browser/ffmpeg/media generation
- `@vercel/blob` 외 dependency 추가
- commit/push, secret/token 값 기록

머신 판독 결과는 `scripts/fixtures/vercel_blob_dependency_code_integration_no_upload.v1.json`, 정적 가드는 `scripts/check-vercel-blob-dependency-code-integration-static.mjs`.
