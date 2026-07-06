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
node scripts/check-dual-platform-final-publish-orchestrator-static.mjs
```
