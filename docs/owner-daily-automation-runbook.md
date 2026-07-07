# Owner Daily Automation Runbook (No-Live)

task: `owner-usable-automation-entrypoint-no-live-v1`

## 이 문서의 목적

Owner가 지금 바로 실행할 수 있는 명령과, 각 명령이 실제로 무엇을 하는지를
간단명료하게 정리한다. 이 slice는 **no-live usability bridge**다 — 새 콘텐츠의
실제 생성/배포(live run)는 아직 하지 않는다.

## 지금 실행할 명령

```
node scripts/run-owner-daily-automation-entrypoint.mjs --status
node scripts/run-owner-daily-automation-entrypoint.mjs --dry-run
node scripts/run-owner-daily-automation-entrypoint.mjs --build-content-unit --summary <dry-run이 만든 summary.json> --out-dir <레포 밖 경로>
node scripts/run-owner-daily-automation-entrypoint.mjs --plan-youtube-letterbox --content-unit <manifest.json> --out-dir <레포 밖 경로>
node scripts/run-owner-daily-automation-entrypoint.mjs --preflight
node scripts/run-owner-daily-automation-entrypoint.mjs --duplicate-guard-check
```

## 각 명령이 하는 일

| 명령 | 하는 일 | 하지 않는 일 |
|------|---------|-------------|
| `--status` | 필요한 스크립트/기본 fixture 존재 여부, 기존 게시 evidence, 다음 단계 안내를 JSON + 사람이 읽기 쉬운 요약으로 출력 | 아무 파일도 만들지 않고, 아무 프로세스도 실행하지 않음 |
| `--dry-run` | 기존 `run-local-money-shorts-from-render-manifest.mjs`를 기본 fixture(`scripts/fixtures/provider-candidate-render-manifest.visual-only.json`)로 실행해 로컬 mp4 dry-run 패킷을 생성 | 실제 업로드/API 호출 없음. TTS는 local_mock(핑크노이즈) — 진짜 음성 아님 |
| `--build-content-unit` | `--dry-run`이 만든 summary JSON(또는 sub-pipeline summary)에서 `dual_platform_content_unit_v1` manifest를 자동 생성 | 새 미디어/ffmpeg 실행 없음, API/네트워크 호출 없음. YouTube source/Blob evidence가 없으면 readiness boolean으로 fail-closed 보고만 함 |
| `--plan-youtube-letterbox` | content unit manifest의 `instagramSourcePath`를 입력으로, deterministic YouTube Shorts letterbox 출력 경로 + render profile + 다음 명령을 `youtube-letterbox-source-plan.json`으로 기록 | ffmpeg 실행 없음, 새 mp4 생성 없음, content unit manifest를 mutate하지 않음(읽기 전용) |
| `--preflight` | 기존 `run-dual-platform-final-publish-orchestrator.mjs --preflight`를 실행해 Instagram/YouTube 게시 준비 상태 + duplicate guard 판정을 요약 | 실제 API 호출/Blob 접근 없음 |
| `--duplicate-guard-check` | preflight로 현재 콘텐츠가 duplicate guard에 의해 양쪽 플랫폼 모두 차단될 것을 **먼저 확인**한 뒤에만 `--live`를 1회 실행해 실제로 안전하게 차단되는지 확인 | duplicate block이 확정되지 않으면 `--live`를 아예 실행하지 않고 즉시 중단(fail-closed). exit 3(`BLOCKED_DUPLICATE_ALREADY_PUBLISHED`)을 게시 성공으로 취급하지 않음 |

`--dry-run`에 `--manifest <path>` / `--out-root <path>`를 추가로 줄 수 있다.
기본 out-root는 레포 밖(`C:\tmp\money-shorts-os\owner-daily-automation-entrypoint-v1`)이다.

## 새 영상(future new video)의 실제 순서: dry-run → manifest → letterbox 계획 → media 생성/첨부 → Blob → preflight/publish

새 영상 하나를 실제로 다루는 practical한 순서는 다음과 같다(이 slice는 1~3단계까지가
자동화되어 있고, 4~6단계는 별도 승인된 후속 작업, 7단계는 이미 존재하는 preflight/publish
gate다):

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
4. **YouTube letterbox source 실제 생성** (별도 승인된 local media 단계): 위 plan의
   `recommendedNextCommand`(`scripts/create-youtube-shorts-letterbox-variant.mjs --input
   <instagramSourcePath> --output <plannedYoutubeSourcePath> --dry-run`)로 먼저 계획을
   재확인한 뒤, 별도 승인 하에 `--run`을 여는 후속 slice에서 실제 letterbox mp4를 생성한다.
5. **YouTube letterbox source manifest에 첨부**: letterbox mp4가 준비되면
   `--youtube-source <plannedYoutubeSourcePath>`를 다시 붙여 manifest를 재생성하거나
   manifest의 `youtubeSourcePath`를 직접 채운다.
6. **Blob liveness evidence 첨부** (승인된 Blob upload/liveness 이후): `--blob-liveness-result
   <json>`으로 manifest에 `blobPublicUrlLivenessEvidence`를 추가한다. 이 slice의 builder는
   네트워크 HEAD/list/readback을 절대 수행하지 않는다 — evidence JSON을 그대로 읽어 shape만
   검증한다.
7. **`--preflight --content-unit <manifest>` 실행**: 전체 readiness gate 결과를 확인한다.

이 slice에서는 1~3단계만 자동화되어 있으며, 업로드/게시/새 외부 미디어 생성은 전혀
수행하지 않는다.

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

**custom content의 live 실행은 이 slice에서 활성화되지 않았다.** custom(non-default)
manifest로 `--live`/`--arm`을 시도하면 metadata/source/blob gate 판정 뒤,
credential resolution/실제 API 호출에 도달하기 **전에**
`CUSTOM_CONTENT_LIVE_NOT_ENABLED_THIS_SLICE`(exit 5)로 fail-closed된다. side effect는 0이다.

owner entrypoint의 `--duplicate-guard-check --content-unit <path>`는 custom manifest면
`--live`를 **아예 호출하지 않는다**(fail-closed). 이 모드는 default evidence 콘텐츠의
duplicate block 확인 전용이다. 샘플 manifest는 source 파일이 아직 없는 템플릿이므로
`--preflight`가 `preflightOk:false`(not ready)를 반환한다 — 실제 새 영상이 렌더되어
source 경로가 채워지면 ready로 바뀐다.

**참고**: custom manifest의 `--preflight` 결과(`preflight.liveExecutionPlan`)에서 차단 사유는
`custom_content_live_not_enabled_this_slice`로 표시된다 — default evidence 콘텐츠의
`duplicate_publish_guard_blocks_current_content`와 다른 값이다. 새(비중복) 콘텐츠가
"중복이라 막힌 것"이 아니라 "이 slice에서 아직 live 실행이 연결되지 않은 것"임을 이 값으로
구분할 수 있다.

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
