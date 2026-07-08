# Owner Daily Automation Runbook (No-Live)

task: `owner-usable-automation-entrypoint-no-live-v1`

## 이 문서의 목적

Owner가 지금 바로 실행할 수 있는 명령과, 각 명령이 실제로 무엇을 하는지를
간단명료하게 정리한다. 이 slice는 **no-live usability bridge**다 — 새 콘텐츠의
실제 생성/배포(live run)는 아직 하지 않는다.

## 기존 golden sample readiness 확인 (재게시 아님)

이미 완료된 golden sample(`t1_lifestyle_inflation`/`v3_2`)의 no-live readiness /
duplicate-safe block만 짧게 확인하고 싶다면 아래 두 명령을 쓰면 된다(긴 fixture
경로를 직접 타이핑할 필요 없음):

```
pnpm owner:ready-preflight
pnpm owner:ready-duplicate-guard-check
```

- `pnpm owner:ready-preflight` — 체크인된 ready fixture로 no-live 게시 준비 상태만 확인한다.
- `pnpm owner:ready-duplicate-guard-check` — duplicate guard가 이 콘텐츠를 안전하게
  차단하는지 확인한다. **재게시가 아니다** — 이미 published인 콘텐츠라 duplicate guard가
  실제 API 호출/credential 해석 이전에 차단하며, 그 안전한 차단(exit 3,
  `BLOCKED_DUPLICATE_ALREADY_PUBLISHED`)을 게시 성공으로 취급하지 않는다.

## 지금 실행할 명령

```
node scripts/run-owner-daily-automation-entrypoint.mjs --status
node scripts/run-owner-daily-automation-entrypoint.mjs --dry-run
node scripts/run-owner-daily-automation-entrypoint.mjs --build-content-unit --summary <dry-run이 만든 summary.json> --out-dir <레포 밖 경로>
node scripts/run-owner-daily-automation-entrypoint.mjs --plan-youtube-letterbox --content-unit <manifest.json> --out-dir <레포 밖 경로>
node scripts/run-owner-daily-automation-entrypoint.mjs --prepare-youtube-letterbox-render --plan <youtube-letterbox-source-plan.json> --out-dir <레포 밖 경로>
node scripts/run-owner-daily-automation-entrypoint.mjs --render-youtube-letterbox-once --approval APPROVE_YOUTUBE_LETTERBOX_LOCAL_RENDER_EXECUTION_ONCE
node scripts/run-owner-daily-automation-entrypoint.mjs --build-content-unit --summary <summary.json> --youtube-render-result <youtube-letterbox-render-result.json> --out-dir <레포 밖 경로>
node scripts/run-owner-daily-automation-entrypoint.mjs --plan-instagram-blob-upload --content-unit <manifest.json> --out-dir <레포 밖 경로>
node scripts/run-owner-daily-automation-entrypoint.mjs --prepare-instagram-blob-upload --request <instagram-blob-upload-request.json> --out-dir <레포 밖 경로>
node scripts/run-owner-daily-automation-entrypoint.mjs --preflight
node scripts/run-owner-daily-automation-entrypoint.mjs --credential-preflight
node scripts/run-owner-daily-automation-entrypoint.mjs --duplicate-guard-check
```

## 각 명령이 하는 일

| 명령 | 하는 일 | 하지 않는 일 |
|------|---------|-------------|
| `--status` | 필요한 스크립트/기본 fixture 존재 여부, 기존 게시 evidence, 다음 단계 안내를 JSON + 사람이 읽기 쉬운 요약으로 출력 | 아무 파일도 만들지 않고, 아무 프로세스도 실행하지 않음 |
| `--dry-run` | 기존 `run-local-money-shorts-from-render-manifest.mjs`를 기본 fixture(`scripts/fixtures/provider-candidate-render-manifest.visual-only.json`)로 실행해 로컬 mp4 dry-run 패킷을 생성 | 실제 업로드/API 호출 없음. TTS는 local_mock(핑크노이즈) — 진짜 음성 아님 |
| `--build-content-unit` | `--dry-run`이 만든 summary JSON(또는 sub-pipeline summary)에서 `dual_platform_content_unit_v1` manifest를 자동 생성. `--youtube-render-result <youtube-letterbox-render-result.json>`을 주면 render result를 fail-closed로 검증(schemaVersion/executed/allVerificationsPass/ffmpegConversionCount/side-effect counters/output 존재+크기)한 뒤 그 `outputPath`를 `youtubeSourcePath`로 자동 채움(수동 mp4 경로 복사 불필요) | 새 미디어/ffmpeg/ffprobe 실행 없음, API/네트워크 호출 없음. `--youtube-source`와 `--youtube-render-result`를 동시에 주고 경로가 다르면 `youtube_source_render_result_mismatch`로 fail-closed. YouTube source/Blob evidence가 없으면 readiness boolean으로 fail-closed 보고만 함 |
| `--plan-youtube-letterbox` | content unit manifest의 `instagramSourcePath`를 입력으로, deterministic YouTube Shorts letterbox 출력 경로 + render profile + 다음 명령을 `youtube-letterbox-source-plan.json`으로 기록 | ffmpeg 실행 없음, 새 mp4 생성 없음, content unit manifest를 mutate하지 않음(읽기 전용) |
| `--prepare-youtube-letterbox-render` | `youtube-letterbox-source-plan.json`을 검증(schemaVersion/willExecuteFfmpeg/출력 경로)하고 실행 직전 render request(`youtube-letterbox-render-request.json`) + 정확한 미래 승인 명령을 기록 | ffmpeg 실행 없음, 새 mp4 생성 없음, plan JSON을 mutate하지 않음(읽기 전용). `--run`은 이 slice에서 항상 fail-closed(`YOUTUBE_LETTERBOX_RENDER_RUN_DISABLED_THIS_SLICE`) |
| `--render-youtube-letterbox-once` | **승인 토큰이 있을 때만** 로컬 ffmpeg를 정확히 1회 실행해 승인된 source mp4에서 YouTube letterbox mp4를 생성하고 read-only ffprobe로 검증. 하위 runner `run-youtube-letterbox-render-from-request-once.mjs`에 위임 | `--approval APPROVE_YOUTUBE_LETTERBOX_LOCAL_RENDER_EXECUTION_ONCE` 없으면 실행 거부. output mp4가 이미 있으면 덮어쓰지 않고 `BLOCKED_OUTPUT_ALREADY_EXISTS_NO_RENDER`로 중단. ffmpeg 2회 실행 없음. API/upload/env/deploy side effect 없음 |
| `--plan-instagram-blob-upload` | content unit manifest의 `instagramSourcePath`를 read-only로 읽어 SHA-256을 계산하고, deterministic Blob pathname + `put()` 옵션 plan을 `instagram-blob-upload-request.json`으로 기록 | `@vercel/blob` 호출 없음, 실제 업로드 없음, 네트워크/env 접근 없음, content unit manifest를 mutate하지 않음(읽기 전용). 실제 업로드는 별도 승인 토큰 `APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST`가 있는 후속 단계에서만 가능 |
| `--prepare-instagram-blob-upload` | `instagram-blob-upload-request.json`을 받아 source mp4가 여전히 request의 size + SHA-256 + deterministic pathname + `put()` 옵션 plan과 일치하는지 read-only로 재검증하고, no-execute `instagram-blob-upload-preflight.json`(모든 검증 통과 시에만 `readyForFutureApprovedUpload:true`)을 기록 | `@vercel/blob` 호출 없음, 실제 업로드 없음, public-URL liveness/HEAD 없음, 네트워크/env 접근 없음, request JSON/source mp4를 mutate하지 않음(읽기 전용). `--run`은 이 slice에서 request 검증/출력 이전에 fail-closed(`INSTAGRAM_BLOB_UPLOAD_RUN_DISABLED_THIS_SLICE`, 부작용 0). 실제 업로드는 별도 승인 slice 필요 |
| `--preflight` | 기존 `run-dual-platform-final-publish-orchestrator.mjs --preflight`를 실행해 Instagram/YouTube 게시 준비 상태 + duplicate guard 판정을 요약 | 실제 API 호출/Blob 접근 없음 |
| `--credential-preflight` | 실제 live publish 직전에 필요한 runtime env key **이름**이 이 프로세스 env에 present인지 **redacted boolean**으로만 확인. orchestrator `--credential-preflight`에 위임하며 platform별/전체 `allPresent`와 `readyForCredentialResolution`을 요약 | credential **값**을 읽거나 출력하지 않음(값/길이/prefix/suffix/hash 미노출). local secret 파일(`.env` 계열)을 읽지 않음, dotenv 미사용, Instagram/YouTube/Blob API 호출 없음. `present:true`/`readyForCredentialResolution:true`/`credentialResolutionWiredThisSlice:true`는 env key 이름 존재 및 코드 경로 wiring 신호일 뿐 실제 publish 활성화가 아님(이 `--credential-preflight` 모드는 `credentialValuesAccessedInThisMode:false`로 값 미접근, `actualApiExecutionEnabledThisSlice:false`로 API 실행 비활성). env key가 없어도 exit 0(status-style diagnostic) |
| `--duplicate-guard-check` | preflight로 현재 콘텐츠가 duplicate guard에 의해 양쪽 플랫폼 모두 차단될 것을 **먼저 확인**한 뒤에만 `--live`를 1회 실행해 실제로 안전하게 차단되는지 확인 | duplicate block이 확정되지 않으면 `--live`를 아예 실행하지 않고 즉시 중단(fail-closed). exit 3(`BLOCKED_DUPLICATE_ALREADY_PUBLISHED`)을 게시 성공으로 취급하지 않음 |

`--dry-run`에 `--manifest <path>` / `--out-root <path>`를 추가로 줄 수 있다.
기본 out-root는 레포 밖(`C:\tmp\money-shorts-os\owner-daily-automation-entrypoint-v1`)이다.

## 새 영상(future new video)의 실제 순서: dry-run → manifest → letterbox 계획 → render 요청 준비 → media 생성/첨부 → Blob upload plan → Blob upload preflight → Blob → preflight/publish

새 영상 하나를 실제로 다루는 practical한 순서는 다음과 같다(이 slice는 1~4단계와 7~8단계(계획
생성 + no-execute upload preflight)까지가 자동화되어 있고, 5~6단계와 9단계(실제 업로드)는 별도
승인된 후속 작업, 10단계는 이미 존재하는 preflight/publish gate다):

1. **local dry-run 실행**: `--dry-run [--manifest <path>] [--out-root <path>]`로 로컬
   generation pipeline을 돌려 Instagram full-frame/tts-mux mp4 + upload metadata를 생성한다.
   완료되면 `render-manifest-local-run-summary.local-mock.json` 경로가 출력된다.
2. **content unit manifest 생성**: `--build-content-unit --summary <위 summary 경로>
   --out-dir <레포 밖 경로>`로 `dual_platform_content_unit_v1` manifest를 자동 생성한다.
   builder는 deterministic metadata enrichment를 적용한다 — caption 원문에서 첫 문장을
   `captionFirstLineHook`으로 추출하고(48자 상한, 문장이 너무 길면 clause 단위로 재시도하며
   그래도 길면 억지로 자르지 않고 fail-closed), 저장/팔로우 유도 문구가 없으면 안전한 기본
   CTA를 채우며, hashtag가 8개 미만이면 기존 태그를 우선 보존한 채 caption 본문 키워드 →
   고정 안전 기본 태그 순으로 8~12개까지 보강한다(외부 API 호출 없음, 무관 유행 태그
   금지). 이를 통해 로컬 caption/hashtag가 충분하면 `metadataReady:true`가 된다.
   다만 `youtubeSourceReady:false`(YouTube letterbox가 아직 없음)는 여전히 정상이다 —
   readiness boolean으로 정확히 보고된다.
3. **YouTube letterbox source 계획 수립**: `--plan-youtube-letterbox --content-unit <위
   manifest 경로> --out-dir <레포 밖 경로>`로 manifest의 `instagramSourcePath`를 입력 삼아
   deterministic한 `plannedYoutubeSourcePath` + render profile(1080x1920 캔버스, black
   background, 864x1536 콘텐츠 박스, 중앙 정렬) + `recommendedNextCommand`를
   `youtube-letterbox-source-plan.json`으로 기록한다. ffmpeg는 실행하지 않고, 새 mp4도
   생성하지 않으며, content unit manifest 자체는 절대 mutate하지 않는다(읽기 전용).
4. **YouTube letterbox render 요청 준비**: `--prepare-youtube-letterbox-render --plan <위
   plan 경로> --out-dir <레포 밖 경로>`로 plan JSON의 schemaVersion/`willExecuteFfmpeg`/
   출력 경로(레포 밖, `.mp4`)를 검증하고, 실행 직전 render request
   (`youtube-letterbox-render-request.json`)와 정확한 미래 승인 명령
   (`scripts/create-youtube-shorts-letterbox-variant.mjs --input <instagramSourcePath>
   --output <plannedYoutubeSourcePath> --dry-run`)을 기록한다. `--run`은 이 slice에서
   항상 fail-closed(`YOUTUBE_LETTERBOX_RENDER_RUN_DISABLED_THIS_SLICE`)이며, ffmpeg 실행/
   새 mp4 생성/plan JSON mutate 전부 없음(읽기 전용).
5. **YouTube letterbox source 실제 생성** (승인 토큰 필요): `--render-youtube-letterbox-once
   --approval APPROVE_YOUTUBE_LETTERBOX_LOCAL_RENDER_EXECUTION_ONCE`로 하위 runner
   `run-youtube-letterbox-render-from-request-once.mjs`에 위임해 로컬 ffmpeg를 **정확히 1회**
   실행한다. runner는 실행 전 승인 source 경로/크기 + output(레포 밖·`.mp4`·미존재)을 검증하고,
   read-only ffprobe로 output(1080x1920·h264·yuv420p·duration delta ≤ 1.0s·audio 보존)을
   확인한 뒤 `youtube-letterbox-render-result.json`에 `ffmpegConversionCount:1`을 기록한다.
   승인 토큰이 없으면 실행을 거부하고, output mp4가 이미 있으면 덮어쓰지 않고
   `BLOCKED_OUTPUT_ALREADY_EXISTS_NO_RENDER`로 중단한다(ffmpeg 0회). API/upload/env/deploy
   side effect 없음.
6. **YouTube letterbox source manifest에 첨부**: letterbox mp4가 준비되면
   `--build-content-unit --summary <summary.json> --youtube-render-result
   <youtube-letterbox-render-result.json> --out-dir <레포 밖 경로>`로 render result JSON을
   직접 넘기는 방법을 우선 사용한다 — Owner가 mp4 경로를 손으로 복사할 필요 없이, builder가
   render result를 fail-closed로 검증(schemaVersion/executed/allVerificationsPass/
   ffmpegConversionCount/side-effect counters/output 존재+크기)한 뒤 그 `outputPath`를
   `youtubeSourcePath`로 자동 채우고 `youtubeSourceDerivedFromRenderResult:true`를 기록한다.
   `--youtube-source <mp4 path>`를 직접 지정하는 방식은 fallback으로만 쓴다(수동 경로 입력;
   render result와 함께 지정하면 두 경로가 반드시 같아야 하며, 다르면
   `youtube_source_render_result_mismatch`로 fail-closed).
7. **Instagram Blob upload 요청 계획 수립**: `--plan-instagram-blob-upload --content-unit <위
   manifest 경로> --out-dir <레포 밖 경로>`로 manifest의 `instagramSourcePath`를 read-only로
   읽어 SHA-256을 계산하고, deterministic Blob pathname
   (`instagram/reels/{contentId}/instagram_reels_full_frame_1080x1920/{version}/{sha256_12}.mp4`)
   + `put()` 옵션 plan(`access:"public"`, `addRandomSuffix:false`, `allowOverwrite:false`,
   `multipart:true`, `contentType:"video/mp4"`)을 `instagram-blob-upload-request.json`으로
   기록한다. `@vercel/blob`을 호출하지 않고, 실제 업로드도 하지 않으며, content unit manifest
   자체는 절대 mutate하지 않는다(읽기 전용). 이 request는 이후 승인된 업로드 단계가 그대로
   쓸 수 있는 deterministic 입력이다.
8. **Instagram Blob upload readiness 재검증 (no-execute)**: `--prepare-instagram-blob-upload
   --request <위 instagram-blob-upload-request.json> --out-dir <레포 밖 경로>`로 request가 여전히
   유효한지 실제 업로드 없이 재검증한다. executor는 request의 계약 필드(schemaVersion/
   requiresApprovalToken/uploadPerformed/willUpload/platform/variantId/contentType/putOptions)를
   확인하고, source mp4를 read-only로 다시 열어 **현재** size + SHA-256이 request에 기록된 값과
   정확히 일치하는지, deterministic pathname이 계약과 일치하는지 재계산·대조한 뒤
   `instagram-blob-upload-preflight.json`을 기록한다(모든 검증 통과 시에만
   `readyForFutureApprovedUpload:true`). `@vercel/blob` 호출/실제 업로드/public-URL liveness/HEAD/
   네트워크/env 접근이 전혀 없고, request JSON/source mp4를 mutate하지 않는다. `--run`은 이 slice에서
   request 검증/출력 이전에 fail-closed(`INSTAGRAM_BLOB_UPLOAD_RUN_DISABLED_THIS_SLICE`, out-dir조차
   생성하지 않음). 이 단계는 실제 업로드 직전에 "request가 여전히 신뢰 가능한가"를 증명하는 게이트다.
9. **Blob 실제 업로드 + liveness evidence 첨부** (Owner 승인 필요): 위 preflight가
   `readyForFutureApprovedUpload:true`이면, approval-gated one-shot runner로 실제 업로드를 수행한다:
   `node scripts/run-instagram-blob-upload-from-request-once.mjs --approval
   APPROVE_INSTAGRAM_BLOB_UPLOAD_FROM_REQUEST_ONCE --request <instagram-blob-upload-request.json>
   --out-dir <레포 밖 경로>`. runner는 동일한 no-execute preflight를 내부에서 재검증한 뒤에만
   `put()`을 **정확히 최대 1회** 시도한다(`allowOverwrite:false` — 이미 존재하면
   `BLOCKED_ALREADY_EXISTS_OR_OVERWRITE_REFUSED`로 안전 차단; 재시도/overwrite/delete/list/head 없음;
   SDK 내부 재시도도 `VERCEL_BLOB_RETRIES=0`으로 차단; 같은 `--out-dir`에 이전 시도 result가 있으면
   재실행 자체를 거부하는 one-shot 게이트 포함). `BLOB_READ_WRITE_TOKEN`은 runtime env에서 SDK가
   직접 소비하며, runner는 값을 읽거나 출력하지 않는다(boolean presence만 확인, `.env.local` 접근
   없음). token이 runtime env에 없으면 `BLOCKED_BLOB_TOKEN_ABSENT_NO_UPLOAD`(업로드 시도 0)로
   종료하면서 gitignored `output/instagram-blob-upload-from-request-once-v1/run-upload-with-token-prompt.ps1`
   (Read-Host SecureString no-log wrapper — token은 화면/로그/transcript에 남지 않고 child node
   process에만 주입 후 finally에서 제거)를 생성한다. Owner가 그 wrapper 한 번 실행으로 업로드를
   완료할 수 있다. 업로드 성공 후 `--blob-liveness-result <json>`으로 manifest에
   `blobPublicUrlLivenessEvidence`를 추가한다. builder는 네트워크 HEAD/list/readback을 절대 수행하지
   않는다 — evidence JSON을 그대로 읽어 shape만 검증한다.
10. **`--preflight --content-unit <manifest>` 실행**: 전체 readiness gate 결과를 확인한다.

이 slice에서는 1~4단계와 7~9단계(Blob upload 요청 계획 + no-execute upload preflight + approval-gated
one-shot 업로드 runner)까지 자동화되어 있으며, 게시(Instagram/YouTube publish)와 새 외부 미디어
생성은 여전히 수행하지 않는다.

## 새 영상(future new video)을 content unit manifest로 다루기

지금까지의 기본 동작은 이미 게시된 evidence 콘텐츠(`t1_lifestyle_inflation/v3_2`)에
고정되어 있었다. 새 영상이 생기면 그 영상을 **content unit manifest**(JSON)로 표현해
`--content-unit <path>`로 넘긴다. 손으로 쓰거나(직접 JSON 작성), `--build-content-unit`으로
로컬 dry-run 산출물에서 자동 생성할 수 있다.

manifest 계약(`schemaVersion: "dual_platform_content_unit_v1"`):

| 필드 | 필수 | 설명 |
|------|------|------|
| `schemaVersion` | ✅ | 항상 `dual_platform_content_unit_v1` |
| `contentId` | ✅ | 새 콘텐츠 식별자(default와 달라야 새 콘텐츠로 취급) |
| `version` | ✅ | 콘텐츠 publish 버전 |
| `instagramSourcePath` | ✅ | Instagram full-frame mp4 로컬 경로 |
| `youtubeSourcePath` | ✅ | YouTube letterbox mp4 로컬 경로 |
| `instagramMetadata` | 선택 | 없으면 default metadata 사용. hashtags 8~12개 + first-line hook + CTA 필요 |
| `youtubeMetadata` | 선택 | 없으면 default metadata 사용. title + tags 필요 |
| `blobPublicUrlLivenessEvidence` | 선택 | 없거나 부정확하면 Instagram publish readiness는 fail-closed |
| `existingPublishedKeys` | 선택 | 이미 게시된 (contentId/platform/version) 키 배열 |

샘플: [`scripts/fixtures/dual_platform_content_unit.sample.v1.json`](../scripts/fixtures/dual_platform_content_unit.sample.v1.json)

명령:

```
node scripts/run-owner-daily-automation-entrypoint.mjs --preflight --content-unit scripts/fixtures/dual_platform_content_unit.sample.v1.json
node scripts/run-dual-platform-final-publish-orchestrator.mjs --preflight --content-unit scripts/fixtures/dual_platform_content_unit.sample.v1.json
node scripts/run-dual-platform-final-publish-orchestrator.mjs --dry-run --content-unit <manifest.json>
```

**custom content의 실제 publish(API 실행)는 이 slice에서 여전히 비활성이다.** (옛
무조건 custom halt `CUSTOM_CONTENT_LIVE_NOT_ENABLED_THIS_SLICE`(gate 4.5, exit 5)는
제거됐다.) 현재 계약은 다음과 같다:

- **default `t1_lifestyle_inflation/v3_2`**: gate 4 duplicate guard가
  `BLOCKED_DUPLICATE_ALREADY_PUBLISHED`(exit 3)로 차단한다 — credential gate 미도달.
- **custom(non-default) content, gate 1~4 통과**: metadata(gate 1)/source(gate 2)/blob
  liveness(gate 3)/duplicate(gate 4)를 모두 통과하면 credential resolution(gate 5)에 **도달**한다.
  이 단계는 이제 wiring됐다 — 승인된 6개 runtime env key만 읽어 in-memory explicit credential 객체를
  조립한다(`credentialResolutionReached:true`, `credentialValuesAccessed:true`; 값은 in-memory로만,
  출력에 미노출). credential이 모두 present면 **gate 6 `actual_api_call` 구조에 도달**해 value-free
  no-execute call plan(`actualApiCallPlan` — Blob/Instagram/YouTube 3개 call spec, 함수 참조 + presence
  boolean만), 그 plan을 소비한 **no-run executor**(`actualApiExecutor` — Blob upload → Instagram publish
  → YouTube upload → ledger record의 4-step ordered/dependsOn 구조, 모든 step 실행 비활성), 그리고 executor를
  소비한 **arm-ready no-run dispatcher**(`actualApiDispatcher` — 같은 4-step 실행 경계를 adapter target/의존/
  입력 readiness로 명문화, 모든 dispatch step 비활성)를 구성하지만, 실제 API 실행이 비활성이라
  `ACTUAL_API_CALL_NOT_ENABLED_THIS_SLICE`(exit 4)로 fail-closed된다
  (`actualApiCallReached:true`, `actualApiExecutorReached:true`, `actualApiDispatcherReached:true`,
  `actualApiCallExecutionEnabledThisSlice:false`, `actualApiExecutorExecutionEnabledThisSlice:false`,
  `actualApiDispatcherEnabledThisSlice:false`, `actualApiCallPerformed:false`,
  `actualApiExecutorPerformed:false`, `actualApiDispatcherPerformed:false`). credential 일부/전부 누락이면
  gate 6 plan/executor/dispatcher에 도달하지 않고 gate 5에서 `CREDENTIAL_KEYS_MISSING_THIS_SLICE`(exit 4,
  누락 key '이름'만 출력)로 fail-closed된다.
- **custom content, readiness 미충족**: gate 1~4 중 하나라도 실패하면 그 gate에서 credential
  **이전에** fail-closed된다 — source 미존재 → `BLOCKED_SOURCE_FILE_MISSING`(gate 2, exit 3),
  blob evidence 부재/부정확 → `BLOCKED_BLOB_LIVENESS_EVIDENCE`(gate 3, exit 3). 이 경우
  `credentialValuesAccessed:false`(credential 미도달).

어느 경로든 actual API 호출/upload/blob/ledger/video/dispatch side effect는 0이다. credential 값은
in-memory로만 다뤄지고 출력에 노출되지 않는다. 실제 API 실행(gate 6 dispatch)을 통한 publish는 별도 승인
slice에서만 wiring된다.

owner entrypoint의 `--duplicate-guard-check --content-unit <path>`는 custom manifest면
`--live`를 **아예 호출하지 않는다**(fail-closed). 이 모드는 default evidence 콘텐츠의
duplicate block 확인 전용이다. 샘플 manifest는 source 파일이 아직 없는 템플릿이므로
`--preflight`가 `preflightOk:false`(not ready)를 반환한다 — 실제 새 영상이 렌더되어
source 경로가 채워지면 ready로 바뀐다.

**참고**: custom manifest의 `--preflight` 결과(`preflight.liveExecutionPlan`)에서 차단 사유는
`actual_api_call_not_enabled_this_slice`로 표시된다 — default evidence 콘텐츠의
`duplicate_publish_guard_blocks_current_content`와 다른 값이다. 새(비중복) 콘텐츠가
"중복이라 막힌 것"이 아니라 "gate 1~4와 credential resolution(gate 5)까지 통과했지만 이 slice에서
아직 actual API 실행(gate 6)이 활성화되지 않은 것"임을 이 값으로 구분할 수 있다.

## 왜 기존 영상이 재게시되지 않는가

`t1_lifestyle_inflation` / `v3_2` 콘텐츠는 이미 업로드가 완료된 상태다:

| 플랫폼 | 상태 | 식별자 |
|--------|------|--------|
| Instagram | 이미 완료 | media_id `17916511431199303` |
| YouTube | 이미 완료 | videoId `r9jhckdpC9w` / https://www.youtube.com/shorts/r9jhckdpC9w |

dual-platform orchestrator의 **duplicate publish guard**가 이 (contentId, platform,
version) 키를 credential resolution/실제 API 호출 **이전에** 차단한다. `--preflight`와
`--duplicate-guard-check`를 실행하면 이 차단이 실제로 작동하는지 직접 확인할 수 있다 —
실행 결과는 항상 "안전하게 차단됨"이어야 하며, 절대 "새로 게시됨"이 되어서는 안 된다.

## 새 콘텐츠 실제 생성/배포(live run)를 하려면

이 slice는 그 단계로 넘어가지 않는다. 실제 live run을 하려면 최소한 아래가 모두 필요하다:

1. **새 콘텐츠 unit** — 지금과 다른 `contentId`/`version`, 자체 metadata와 source 파일.
2. **Credential resolution 연결** — 현재 orchestrator의 credential 단계(gate 5)는
   이 slice에서 wiring되지 않은 fail-closed stub이다. 실제 Instagram/YouTube
   API 호출 전에 별도 승인된 slice에서 credential resolution을 연결해야 한다.
3. **명시적 Owner 승인** — `APPROVE_DUAL_PLATFORM_ARM`은 gate를 arm 상태로만
   만들 뿐, duplicate guard를 우회하거나 credential resolution을 연결하지 않는다.
   실제 end-to-end live run에는 별도의 명시적 승인이 필요하다.

## `.env.local`에 대해

이 entrypoint와 이 문서 어디에서도 `.env.local`이나 다른 secret 파일을 직접
읽지 않는다. `process.env` 값도 이 스크립트 어디에서도 접근하지 않는다.
실제 credential이 필요한 미래 작업은 승인된 no-log helper나 별도 절차를 통해서만
진행되어야 한다.

## 로컬 env no-log wrapper (Owner가 로컬에서 present:true 확인용)

`--credential-preflight`는 **현재 프로세스 env**에 있는 key 이름의 present 여부만 보고한다.
Codex/Claude 셸에는 Owner의 로컬 secret env가 상속되지 않으므로 6개 key가 모두
`present:false`로 나온다. Owner가 **로컬에서** 실제 present 상태를 확인하려면 아래
no-log wrapper를 쓴다. 이 wrapper는 승인된 key 6개만 `.env.local`에서 읽어 자식
프로세스 env로 넘기며, **값을 화면/로그/파일 어디에도 출력하지 않는다**(key 이름 +
present boolean만 보인다).

```powershell
# 기본: 레포 루트의 .env.local에서 승인된 6개 key만 로드해 credential-preflight 실행
pnpm owner:credential-preflight:local
# 또는 직접:
node scripts/run-owner-command-with-local-env-no-log.mjs credential-preflight

# env 파일 경로를 명시하려면 (--env-path, node 예약 옵션 --env-file과 다름):
node scripts/run-owner-command-with-local-env-no-log.mjs credential-preflight --env-path .env.local
```

정상 실행 시 `approved keys present: 6/6`과 함께 각 platform의 `allPresent=true`,
`readyForCredentialResolution=true`가 보인다. 단 이는 key 이름이 present라는 신호일 뿐이다.
credential resolution 코드 경로는 wiring됐지만(`credentialResolutionWiredThisSlice:true`),
이 `--credential-preflight` 모드는 credential 값을 읽지 않으며
(`credentialValuesAccessedInThisMode:false`) 실제 publish는 여전히 비활성이다
(`actualApiExecutionEnabledThisSlice:false`) — `credentialResolutionWiredThisSlice:true`를
publish 활성화로 오인하면 안 된다. 실제 값 접근은 `--live` 실행 경로의 gate 5에서만 발생하며,
그 경우에도 actual API 실행(gate 6)이 비활성이라 실제 publish는 일어나지 않는다.

**wrapper가 지키는 것**:

- 승인된 6개 key(`INSTAGRAM_BUSINESS_ACCOUNT_ID`, `INSTAGRAM_ACCESS_TOKEN`,
  `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`,
  `BLOB_READ_WRITE_TOKEN`)만 로드한다. 그 외 라인의 값은 읽지 않는다.
- credential 값을 출력/로그/파일에 남기지 않고, 값의 길이/prefix/suffix/hash/mask도
  만들지 않는다.
- parent env를 통째로 복사하지 않고(broad spread 금지), child node 실행에 필요한
  최소 non-secret OS 변수만 개별 상속한 뒤 승인된 key만 얹는다.
- 자식은 `spawnSync(process.execPath, [...], { shell: false })`로만 실행한다.
- dotenv 패키지나 `vercel env pull`을 쓰지 않는다.

## 안전 설계 원칙 (이 entrypoint가 지키는 것)

- 기본 모드는 항상 no-live/fail-closed다.
- `--duplicate-guard-check`는 duplicate block이 preflight로 확정된 경우에만 `--live`를
  실행한다. 신규/비중복 콘텐츠에 대해서는 이 모드가 `--live`를 실행하지 않는다.
- 모든 자식 프로세스는 `spawnSync(process.execPath, [...], { shell: false })`로만 실행한다.
- `--dry-run`이 생성하는 모든 산출물은 레포 바깥의 명시적 out-root 경로에만 저장된다.
- exit 3(`BLOCKED_DUPLICATE_ALREADY_PUBLISHED`)은 항상 "안전 차단"으로만 보고되며,
  게시 성공으로 표시되지 않는다.

## 검증

```
node --check scripts/run-owner-daily-automation-entrypoint.mjs
node --check scripts/check-owner-daily-automation-entrypoint-static.mjs
node scripts/check-owner-daily-automation-entrypoint-static.mjs
node scripts/run-owner-daily-automation-entrypoint.mjs --status
node scripts/run-owner-daily-automation-entrypoint.mjs --preflight
node scripts/run-owner-daily-automation-entrypoint.mjs --duplicate-guard-check
```
