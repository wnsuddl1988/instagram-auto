# Dual-Platform Final Publish Orchestrator (No-Live)

task: `dual-platform-final-publish-orchestrator-no-live-v1`

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

runner는 3가지 모드를 지원한다. 이 slice에서 live는 코드 구조만 준비되고 실행은 fail-closed다.

| 모드 | flag | live 실행 | 동작 |
|------|------|-----------|------|
| dry-run | `--dry-run` | ✕ | 기존 no-live. publish plan + metadata gate/duplicate guard 판정만. |
| preflight | `--preflight` | ✕ | no-live 준비 검증. plan + 파일경로 존재여부 + gate + guard + required env key **이름** presence plan. |
| live | `--live` / `--arm` | ✕ (이 slice) | `LIVE_EXECUTION_DISABLED_THIS_SLICE`로 stderr + exit 2. 실제 upload 경로 진입 없음. |

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

### live 모드 fail-closed (`--live` / `--arm`)

- 이 slice에서는 `LIVE_EXECUTION_ENABLED_THIS_SLICE = false` 상수 때문에 항상 차단된다.
- stderr로 `LIVE_EXECUTION_DISABLED_THIS_SLICE` + 필요한 승인 토큰 목록을 출력하고 exit 2로 종료한다.
- stdout에는 publish plan 실행 결과가 나오지 않는다(실제 발행 경로 미진입).
- `lib/instagram.ts#uploadInstagramReel`, `lib/youtube.ts#uploadYouTubeShorts`, `lib/instagram-blob-media.ts#uploadInstagramBlob`는 문자열 참조로만 명문화되며 이 runner가 실제로 import/호출하지 않는다.

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
