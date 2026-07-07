# Dual-Platform Final Publish Orchestrator

task: `dual-platform-arm-wiring-duplicate-guarded-v1`
(base: `dual-platform-final-publish-orchestrator-no-live-v1` — 초기 no-live dry-run 기반에서
단계적으로 preflight/no-execute wiring을 거쳐 최종 arm 상태에 도달했다. 아래 "최종 arm 상태" 참조.)

## 목적

Instagram + YouTube 실사용 업로드 테스트가 각 1회 성공한 뒤, 최종 자동화 프로그램의
"게시 단계"를 no-live/dry-run runner + 계약(fixture)으로 고정한다. 이 slice는 실제
업로드를 다시 수행하지 않으며, 다음 단계에서
`카테고리 선택 → 영상 생성 → Instagram variant → YouTube variant → 2개 플랫폼 게시`
흐름에 연결 가능한 orchestrator 기반만 마련한다.

## 구성 요소

| 파일 | 역할 |
|------|------|
| `scripts/run-dual-platform-final-publish-orchestrator.mjs` | no-live dry-run runner. 콘텐츠 unit 1개 → Instagram job + YouTube job 2개의 publish plan을 생성한다. |
| `scripts/fixtures/dual_platform_final_publish_orchestrator.v1.json` | 계약 고정 fixture. expected job shape, YouTube 기본 metadata, 중복 게시 방지 규칙, side-effect counter 0 목록을 담는다. |
| `scripts/check-dual-platform-final-publish-orchestrator-static.mjs` | fixture + runner 소스 + runner 실제 실행 결과(child_process, dry-run)를 검증하는 정적 가드. |

## Dry-run 동작

```
node scripts/run-dual-platform-final-publish-orchestrator.mjs --dry-run
```

- 기본 콘텐츠 unit(`t1_lifestyle_inflation` / `v3_2`)을 사용해 다음 2개 job을 생성한다:
  - `instagram_job`: variant `instagram_reels_full_frame_1080x1920`, provider `vercel_blob`,
    deliveryMode `public_unauthenticated_https_video_url`, `requiresPublicBlobUrl: true`
  - `youtube_job`: variant `youtube_shorts_letterbox_1080x1920`, provider `youtube_data_api`,
    deliveryMode `direct_media_file_upload`, `requiresPublicBlobUrl: false`
- 두 job 모두 `liveApiCallPerformed: false`이며, 이 slice에는 그 값을 `true`로 만들
  코드 경로가 존재하지 않는다(Instagram/YouTube API 호출, Blob `put()`/`list()`/`del()` 없음).
- `--dry-run` 플래그 유무와 무관하게 이 slice의 runner는 항상 dry-run과 동일하게 동작한다.
  live 경로는 별도 승인(`APPROVE_DUAL_PLATFORM_LIVE_ORCHESTRATOR_WIRING` 등) 이후에만 추가된다.

### version 정합화 (v3_2)

- `defaultContentUnit.version`은 **`v3_2`**다. 실제 live upload evidence(Instagram
  media_id `17916511431199303`, YouTube videoId `r9jhckdpC9w`)가 사용한 source artifact가
  `golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4`이기 때문이다.
- **주의**: YouTube letterbox render 파일명(`golden_sample_t1_lifestyle_inflation_youtube_letterbox_v1.mp4`)의
  `_v1` 접미사는 **letterbox render artifact 자체의 렌더 버전**이며, publish duplicate key가
  사용하는 "콘텐츠 version"(`v3_2`)과는 별개 개념이다. 이 둘을 혼동해 duplicate key에 `v1`을
  쓰면 실제 evidence와 어긋나 중복 게시 차단이 빗나갈 수 있다.

## YouTube 기본 metadata (조회수 친화, live test 재사용)

- title: `월급 올라도 돈이 안 모이는 이유 #Shorts`
- tags: 재테크 / 돈관리 / 월급관리 / 생활비 / 라이프스타일인플레이션 / 저축 / 절약 /
  사회초년생재테크 / 돈모으는법 / Shorts (핵심 키워드 중심, 무관 유행 태그 없음)
- categoryId `22`, defaultLanguage `ko`, privacyStatus `public`, selfDeclaredMadeForKids `false`

## Instagram 기본 metadata (조회수/저장/팔로우 최적화)

- captionFirstLineHook: `월급은 올랐는데 왜 통장은 그대로일까?`
- caption: `월급은 올랐는데 통장은 그대로라면, 생활비가 같이 커지는 라이프스타일 인플레이션을 점검해야 합니다.`
- hashtags(10개, 8~12 범위 준수): 재테크 / 돈관리 / 월급관리 / 생활비절약 /
  라이프스타일인플레이션 / 사회초년생재테크 / 돈모으는법 / 절약습관 / 경제공부 / 릴스
- callToAction: `저장하고 다음에 다시 보기 · 팔로우하면 돈관리 팁 계속 받아보기`
- `forbiddenUnrelatedTrendTags: true` — 과장/낚시/무관 유행 태그 금지

## Publish metadata optimization gate ("영상만 업로드 금지")

Owner 확정 규칙: **영상만 업로드하는 것은 금지**하며, 조회수/구독/팔로우를 위해
플랫폼별 metadata를 반드시 최적화해야 한다.

- Instagram 필수 필드: `captionFirstLineHook`, `caption`, `hashtags`, `callToAction`
- Instagram hashtag 개수: **8~12개** 범위(최소 8, 최대 12)
- YouTube 필수 필드: `titleBase`, `tags`
- 공통: 첫 줄 훅 필수, 저장/팔로우/구독/댓글 유도 CTA 포함, 무관한 유행 태그 금지
- 업로드 전 metadata preview/gate 통과 필수(`metadataOptimizationGate.ok === true`)
- runner는 각 job에 `metadataOptimizationGate: { ok, reasons }`를 계산해 포함시킨다
  (`checkInstagramMetadataGate` / `checkYoutubeMetadataGate`). 이 slice는 no-live이므로
  판정만 하고 실제 발행을 막지는 않는다 — live mode 연결 시 `ok === false`면 발행을 차단하는
  로직이 별도 승인 슬라이스에서 추가되어야 한다.

## 중복 게시 방지 계약

- key shape: `{contentId}/{platform}/{version}`
- 규칙: 같은 (contentId, platform, version)이 이미 `published` evidence를 가지면 **live mode**에서
  새 publish job 생성/발행을 차단한다.
- 이 slice는 dry-run 전용이므로 실제 ledger를 읽거나 쓰지 않는다. runner 내부에는
  in-memory 상수(`EXISTING_PUBLISHED_KEYS`)로 판정 로직만 시연하며, `blockedThisRun`은
  `liveMode === true`일 때만 의미를 갖는다(현재 `liveMode`는 항상 `false`).
- 현재 예시 published 키: `t1_lifestyle_inflation/instagram_reels/v3_2`,
  `t1_lifestyle_inflation/youtube_shorts/v3_2` — 이는 이미 완료된 live upload evidence(v3_2
  source artifact)와 정합한다.

## Live upload evidence (secret 없음)

| 플랫폼 | 상태 | 식별자 |
|--------|------|--------|
| Instagram | already_completed, 재시도 금지 | media_id `17916511431199303` |
| YouTube | already_completed, 재시도 금지 | videoId `r9jhckdpC9w` / https://www.youtube.com/shorts/r9jhckdpC9w |

기록 가능 값은 media_id/videoId/url/public metadata/파일명/크기뿐이다. API key, client
secret, refresh token, access token, account id 등은 이 문서와 fixture 어디에도 기록하지
않는다.

## 이 slice의 금지 사항 (모두 0회 수행)

- Instagram API 호출
- YouTube API 호출
- Vercel Blob upload/list/delete 등 object mutation
- `.env.local` 또는 다른 secret 파일 직접 read/write
- secret 값 출력/로그/문서 기록
- 새 영상 생성/렌더/ffmpeg/TTS/image/browser
- deploy/DNS/env write/dependency/lockfile 변경
- commit/push

## 실행 모드 (dry-run / preflight / live)

task: `dual-platform-live-orchestrator-wiring-preflight-no-live-v1`

runner는 3가지 모드를 지원한다. live gate는 arm 상태지만(아래 "최종 arm 상태" 참조),
current content는 duplicate publish guard가 차단하므로 실제 live API 호출은 0이다.

| 모드 | flag | live 실행 | 동작 |
|------|------|-----------|------|
| dry-run | `--dry-run` | ✕ | 기존 no-live. publish plan + metadata gate/duplicate guard 판정만. |
| preflight | `--preflight` | ✕ | 준비 검증. plan + 파일경로 존재여부 + gate + guard + Blob liveness evidence + arm 상태(`preflight.liveArm`) + required env key **이름** 계약. |
| live | `--live` / `--arm` | armed (duplicate blocked) | 6단계 gate 순서로 fail-closed 평가. current content(v3_2)는 gate 4 duplicate guard가 `BLOCKED_DUPLICATE_ALREADY_PUBLISHED`(stdout JSON + exit 3)로 차단 — credential resolution/actual API call 미도달. |

### preflight 모드 (`--preflight`)

- publish plan 2개 job + 양쪽 `metadataOptimizationGate.ok`를 검증한다.
- source 파일 경로의 **존재 여부(boolean)** 만 `fs.existsSync`로 확인한다 — 파일 내용은 읽지 않는다.
- duplicate publish guard가 `v3_2` 키를 쓰는지, 이미 published인지(reference) 판정한다.
- **required env key 이름(name) presence plan만 출력한다.** `process.env` 값은 절대 읽지 않으며(`envValuesAccessedThisRun: false`), 값/존재여부/길이/hash/prefix/suffix를 출력하지 않는다.
- `.env.local`을 직접 읽지 않는다.
- `sourceFilesReady`(Instagram + YouTube 두 source mp4가 모두 존재)는 `preflightOk`의 필수 조건이다. 둘 중 하나라도 없으면 metadata gate/duplicate guard가 통과해도 `preflightOk`는 `false`다.
- **`preflight.liveExecutionPlan`**(no-execute live wiring plan)을 함께 출력한다. 아래 참조.

### no-execute live execution plan (`preflight.liveExecutionPlan`)

실제 publish 흐름을 **코드 구조상 순서대로 연결**하되, 이번 slice에서는 모든 step이 실행 불가(disabled)다.
`orderedFlow`는 `instagram_blob_upload → instagram_publish_reel → youtube_direct_upload → publish_ledger_record` 순서다.

| order | step | 내용 | provider | 필요 승인 토큰 |
|-------|------|------|----------|----------------|
| 1 | `instagram_blob_upload` | Instagram full-frame mp4 → Vercel Blob public URL(공개 비인증 https 비디오 URL) | `vercel_blob` | `APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST` |
| 2 | `instagram_publish_reel` | Blob public video URL + optimized caption/hashtags/CTA → Instagram Reels publish | `instagram_graph_api` | `APPROVE_DUAL_PLATFORM_ARM` |
| 3 | `youtube_direct_upload` | YouTube letterbox mp4 + optimized title/description/tags → YouTube Shorts direct file upload | `youtube_data_api` | `APPROVE_YOUTUBE_LIVE_UPLOAD_WIRING`, `APPROVE_DUAL_PLATFORM_ARM` |
| 4 | `publish_ledger_record` | `{contentId}/{platform}/{version}` duplicate ledger 기록 (mutation 없음) | `publish_ledger` | `APPROVE_DUAL_PLATFORM_ARM` |

- 모든 step: `enabled:false`, `willExecute:false`, `sideEffectPerformed:false`. plan 레벨에서도 `anyStepEnabled/anyStepWillExecute/anySideEffectPerformed`가 전부 `false`다.
- **metadata optimization gate**는 `instagram_publish_reel` / `youtube_direct_upload` step의 필수 dependency로 연결된다(`mustBeOk:true`).
- **duplicate publish guard**는 두 publish step의 필수 dependency로 연결된다(`key`가 `/v3_2`로 끝나고, 이미 published된 evidence는 `retryForbidden:true` reference로만).
- `instagram_publish_reel`은 `instagram_blob_upload`가 산출한 `instagram_public_video_url`에 의존한다.
- YouTube step의 short-lived credential은 `YOUTUBE_REFRESH_TOKEN`으로 메모리에서 발급하며(`shortLivedCredentialSource: derived_in_memory_from_refresh_token`) 장기 env로 요구하지 않는다.
- plan에는 secret 값/토큰/credential value/URL query token이 담기지 않는다 — 필드 이름, gate 결과 boolean, key shape, pathname 템플릿 같은 계약만 담긴다.
- `functionRef`는 문자열 참조일 뿐이며, runner는 `lib/instagram.ts`/`lib/youtube.ts`/`lib/instagram-blob-media.ts`를 실제로 import/호출하지 않는다.
- Instagram/YouTube publish의 `functionRef`는 import-safe한 explicit credential injection 함수(`uploadInstagramReelWithCredentials` / `uploadYouTubeShortsWithCredentials`)를 가리킨다. 이 함수들은 credential을 인자로만 받고, import 시점에 `process.env`를 읽지 않는다(아래 credential injection 참조).

### live client credential injection (import-safe)

live client(`lib/instagram.ts`, `lib/youtube.ts`)는 import 시점에 secret/env를 읽지 않도록 정리되어 있다(orchestrator가 안전하게 import할 수 있게 하기 위함).

- top-level `process.env` read 없음. env resolution은 **호출 시점**에만 수행한다(`resolveInstagramCredentialsFromEnv` / `resolveYouTubeOAuthCredentialsFromEnv`).
- explicit credential 함수: `uploadInstagramReelWithCredentials({ videoUrl, caption, coverUrl?, credentials })`(credentials: `{ businessAccountId, accessToken }`), `uploadYouTubeShortsWithCredentials({ videoPath, title, description, tags, credentials })`(credentials: `{ clientId, clientSecret, refreshToken, accessToken? }`).
- 기존 호환 wrapper(`uploadInstagramReel` / `uploadYouTubeShorts` / `getYouTubeAuthUrl`)는 유지하되 env resolution을 호출 시점으로만 밀었다. **wrapper는 `app/api/upload/route.ts` 등 기존 호출부 호환용일 뿐, live execution contract(`liveExecutionWiring.livePublishFunctionRefs`, `liveExecutionPlan.steps[].functionRef`)의 primary ref가 아니다** — orchestrator plan은 항상 explicit credential 함수(`...WithCredentials`)를 가리킨다.
- `YOUTUBE_ACCESS_TOKEN`은 장기 required env로 요구하지 않는다. short-lived access token은 `YOUTUBE_REFRESH_TOKEN`으로 메모리에서 발급/갱신한다.
- secret 값은 throw/log에 포함하지 않는다. Instagram 폴링은 access token을 URL query 대신 `Authorization: Bearer` 헤더로 전달해 에러/로그를 통한 token 노출을 막는다.
- 정적 가드: `scripts/check-social-live-client-import-safety-static.mjs`.

### YouTube live upload wiring readiness (`preflight.youtubeLiveUploadWiring`)

task: `youtube-live-upload-wiring-no-execute-v1`

`--preflight` 출력에 YouTube Shorts direct file upload live 경로의 준비 상태를 요약하는
secret-free 블록 `preflight.youtubeLiveUploadWiring`을 추가했다. 이 블록은 어떤 env 값도
읽지 않고, 실제 YouTube upload 함수를 호출하지도 않는다(계약/boolean만).

| 필드 | 값/의미 |
|------|---------|
| `expectedFunctionRef` | `lib/youtube.ts#uploadYouTubeShortsWithCredentials` (explicit credential injection, wrapper-only 아님) |
| `credentialInjection` | `explicit` — credential은 인자로만 주입, import 시점 env read 없음 |
| `requiredEnvKeyNames` | `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` (이름만, 값 미접근) |
| `youtubeAccessTokenIsRequiredEnv` | `false` — `YOUTUBE_ACCESS_TOKEN`은 장기 required env가 아니다 |
| `shortLivedCredentialSource` | `derived_in_memory_from_refresh_token` — refresh token으로 메모리에서 발급 |
| `sourceFileExists` | letterbox mp4 존재 여부(boolean만, 내용 미read) |
| `metadataOptimizationGateOk` | YouTube metadata gate 통과 여부 |
| `duplicatePublishGuard` | key `t1_lifestyle_inflation/youtube_shorts/v3_2`, `usesV3_2`, `retryForbidden:true` |
| `existingVideoEvidence` | videoId `r9jhckdpC9w`, url, `retryForbidden:true` — 재업로드 금지, reference로만 유지 |
| `liveExecutionEnabledThisSlice` | `true` (armed) — 단 current content는 duplicate guard가 차단 |
| `actualUploadCallPerformed` | `false` — 이 slice에서 실제 YouTube upload 호출 0 |
| `requiredApprovalTokens` | `APPROVE_YOUTUBE_LIVE_UPLOAD_WIRING`, `APPROVE_DUAL_PLATFORM_ARM` |

- source 파일은 기존 YouTube letterbox mp4:
  `output/youtube-shorts-letterbox-render-test-v1/golden_sample_t1_lifestyle_inflation_youtube_letterbox_v1.mp4`.
  파일명의 `_v1`은 letterbox render artifact 버전이며, publish duplicate key의 콘텐츠
  version(`v3_2`)과는 별개다.
- fixture(`youtubeLiveUploadWiring`)와 preflight 출력이 정합해야 하며, 정적 가드가 두 쪽을
  모두 검증한다. `youtube.videos.insert`/`googleapis` live upload 실행 패턴이 runner 코드에
  들어가면 가드가 fail한다.

### live 모드 (`--live` / `--arm`) — armed, current content는 duplicate blocked

- `LIVE_EXECUTION_ENABLED_THIS_SLICE = true`(arm, 승인 토큰 `APPROVE_DUAL_PLATFORM_ARM`).
  상수가 `false`로 회귀하면 여전히 `LIVE_EXECUTION_DISABLED_THIS_SLICE`(stderr + exit 2)로
  fail-closed된다(방어적 이중 안전장치).
- armed 상태의 `--live`/`--arm`은 아래 "최종 arm 상태"의 6단계 gate 순서로 평가되며,
  current content(`t1_lifestyle_inflation`/`v3_2`)는 gate 4 duplicate publish guard가
  `BLOCKED_DUPLICATE_ALREADY_PUBLISHED`(stdout JSON + **exit 3**)로 차단한다.
- `lib/instagram.ts#uploadInstagramReelWithCredentials`, `lib/youtube.ts#uploadYouTubeShortsWithCredentials`, `lib/instagram-blob-media.ts#uploadInstagramBlob`는 문자열 참조로만 명문화되며 이 runner가 실제로 import/호출하지 않는다.

## 최종 arm 상태 (dual-platform-arm-wiring-duplicate-guarded-v1)

Owner 승인 `APPROVE_DUAL_PLATFORM_ARM`로 live execution gate가 **arm** 상태다
(`LIVE_EXECUTION_ENABLED_THIS_SLICE = true`). 단, current content
`t1_lifestyle_inflation`/`v3_2`는 이미 게시 완료 evidence(Instagram media_id
`17916511431199303`, YouTube videoId `r9jhckdpC9w`)가 있으므로 duplicate publish
guard가 실제 Instagram/YouTube API 호출 **이전에** 반드시 차단한다.

### 핵심 안전 순서 (6단계 fail-closed gate, 순서 변경 금지)

| order | gate | current content 결과 |
|-------|------|---------------------|
| 1 | `metadata_optimization_gate` | 평가 → ok |
| 2 | `source_file_gate` | 평가 → ok (existsSync boolean만) |
| 3 | `blob_public_url_liveness_evidence_gate` | 평가 → ok (아래 evidence, 네트워크 재검증 없음) |
| 4 | `duplicate_publish_guard` | **평가 → blocked** (양 플랫폼 `/v3_2` 키 이미 published) |
| 5 | `credential_presence_resolution` | **미도달** — credential 값 접근/resolution 0 |
| 6 | `actual_api_call` | **미도달** — Instagram/YouTube API 호출 0 |

- gate 4 `duplicate_publish_guard`는 gate 5 `credential_presence_resolution`보다 **반드시 먼저**
  평가된다(소스 순서를 정적 가드가 검증). current content는 4에서 차단되어 5/6에 도달하지 않는다.
- gate 5는 이 slice에서 wiring되지 않은 fail-closed stub이다
  (`CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE`, exit 4). 비중복 신규 콘텐츠라도 credential
  값을 읽지 않고 여기서 멈춘다 — 실제 credential resolution/API 실행은 별도 승인 slice에서만 연결된다.

### current content `--live`/`--arm` 결과 계약

- status: `BLOCKED_DUPLICATE_ALREADY_PUBLISHED`, stdout JSON, **exit 3** (publish 미수행 신호 — exit 0 아님)
- side-effect counter 전부 0: `instagramApiCallCount`, `youtubeApiCallCount`,
  `youtubeOauthTokenRequestCount`, `youtubeUploadCallCount`, `blobMutationCount`,
  `credentialValuesAccessedCount`, `credentialValuesResolvedCount`,
  `dotEnvLocalDirectAccessCount`, `envSecretValuePrintCount`, `ledgerMutationCount`,
  `newVideoGeneratedCount`
- `credentialResolutionReached: false`, `actualApiCallReached: false`
- 기존 media_id `17916511431199303` / videoId `r9jhckdpC9w`는 `retryForbidden` reference로만 출력
- `wouldHaveCalledFunctionRefs`는 explicit credential injection 함수
  (`uploadInstagramReelWithCredentials` / `uploadYouTubeShortsWithCredentials`)를 가리킨다 —
  wrapper-only 함수로 회귀 금지

### Blob public URL liveness evidence (gate 3, secret 아님)

task: `instagram-blob-url-liveness-no-arm-v1`에서 Owner가 직접 실행해 통과한 evidence다.
이 slice는 네트워크 재검증(HEAD 재요청) 없이 아래 기록과 로컬 result 파일 존재
여부(boolean)만 검증한다.

| 항목 | 값 |
|------|----|
| URL | `https://7iq7vppwlaha2vuo.public.blob.vercel-storage.com/instagram/reels/t1_lifestyle_inflation/instagram_reels_full_frame_1080x1920/v3_2/54957450ac10.mp4` |
| HEAD status | `200` |
| content-type | `video/mp4` |
| content-length | `20294549` |
| result 파일 | `output/instagram-blob-url-liveness-no-arm-v1/result.json` (존재 boolean만 확인) |

이 evidence는 fixture(`liveArm.blobPublicUrlLivenessEvidence`) / preflight 출력
(`preflight.liveArm.blobPublicUrlLivenessEvidence`) / 이 문서 3곳에서 정합해야 하며,
정적 가드가 불일치 시 fail한다.

### metadata optimization gate + duplicate guard (live/preflight 공통 필수)

- **metadata optimization gate**는 live와 preflight 모두에서 필수 조건이다(`영상만 업로드 금지`).
  - Instagram: caption first-line hook, caption, CTA, hashtags 8~12개, 무관 유행 태그 금지.
  - YouTube: title, description, tags, categoryId, language, Shorts 적합성.
  - gate 실패 시 publish 불가.
- **duplicate publish guard**도 live와 preflight 모두에서 필수 조건이다.
  - key shape `{contentId}/{platform}/{version}`, `v3_2` 기준.
  - 이미 published된 evidence(Instagram `17916511431199303`, YouTube `r9jhckdpC9w`)는 reference evidence로만 유지하고 새 실행/재시도로 취급하지 않는다.

### live 실행에 필요한 env key 이름 (값 미기록)

live wiring이 켜지면 아래 env key가 필요하다. 이름만 명문화하며 값은 fixture/runner/docs 어디에도 담지 않는다.

- Instagram: `INSTAGRAM_BUSINESS_ACCOUNT_ID`, `INSTAGRAM_ACCESS_TOKEN`
- YouTube: `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`
- Vercel Blob: `BLOB_READ_WRITE_TOKEN`

YouTube의 short-lived access token(`YOUTUBE_ACCESS_TOKEN`)은 장기 required env key로 요구하지 않는다.
향후 승인된 live 실행 중 refresh token(`YOUTUBE_REFRESH_TOKEN`)으로 메모리에서 발급/갱신해 사용하며,
env로 별도 저장하지 않는다.

## 향후 승인 순서 (future approval sequence)

1. `APPROVE_DUAL_PLATFORM_LIVE_ORCHESTRATOR_WIRING` — dry-run 로직을 실제 live 호출 경로에 연결
2. `APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST` — Instagram job의 Blob 실제 업로드 허용
3. `APPROVE_YOUTUBE_LIVE_UPLOAD_WIRING` — YouTube job의 실제 업로드 재사용/자동화 허용
4. `APPROVE_DUAL_PLATFORM_ARM` — 두 플랫폼 동시 자동 게시 활성화

## 검증

```
node --check scripts/run-dual-platform-final-publish-orchestrator.mjs
node --check scripts/check-dual-platform-final-publish-orchestrator-static.mjs
node scripts/run-dual-platform-final-publish-orchestrator.mjs --dry-run
node scripts/run-dual-platform-final-publish-orchestrator.mjs --preflight
node scripts/check-dual-platform-final-publish-orchestrator-static.mjs
```
