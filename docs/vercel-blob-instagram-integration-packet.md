# Vercel Blob → Instagram Integration Packet (No-Secret / No-Provisioning / No-Live)

Task: `vercel-blob-instagram-integration-packet-v1`
Owner approval: `APPROVE_VERCEL_BLOB_PREPARE_INTEGRATION_PACKET`
Status: **integration approval packet only.** Blob store 생성/token/env/dependency/upload/live URL check/Instagram `--arm`/deploy는 이 slice에서 승인하거나 수행하지 않는다.

관련 계약:
- [`docs/dual-platform-variant-publish-architecture.md`](./dual-platform-variant-publish-architecture.md) — Instagram=Blob / YouTube=direct upload 아키텍처.
- [`docs/public-media-url-strategy.md`](./public-media-url-strategy.md) — public URL verifier gate (상속).
- [`docs/media-provider-decision-packet.md`](./media-provider-decision-packet.md) — provider 결정(R2 suspended, Instagram=Blob active).

---

## 1. 왜 Instagram은 Blob/public URL이 필요하고 YouTube는 아닌가

- **Instagram Graph API**는 영상 발행 시 Meta 서버가 직접 가져갈 수 있는 **public unauthenticated HTTPS `video_url`**을 요구한다. 따라서 렌더 산출 mp4를 인터넷에서 접근 가능한 direct URL로 호스팅해야 하며, 이 프로젝트에서는 그 provider로 **Vercel Blob public direct URL**을 사용한다.
- **YouTube Data API**는 `videos.insert`의 **direct(resumable) media file upload**로 파일 자체를 전송한다. 외부 public 호스팅 URL이 필요 없으므로 YouTube 변형(`youtube_shorts_letterbox_1080x1920`)은 **Blob을 쓰지 않는다.**

즉 Blob에 올라가는 것은 Instagram 변형(`instagram_reels_full_frame_1080x1920`) 뿐이며, Blob storage/transfer 압력의 유일한 원천이다.

## 2. 왜 Blob store는 public이어야 하는가

- Vercel Blob의 **public store read access**는 "URL을 아는 누구나" 접근 가능하고, 전달은 direct blob URL로 이뤄진다. Instagram이 요구하는 무인증 접근과 정확히 일치한다.
- **store access mode는 생성 시점에 결정되고 이후 변경할 수 없다.** 따라서 처음부터 public store로 만들어야 하며, private store는 Instagram video_url 용도에 부적합하다.
- add/remove/write(업로드)는 유효한 토큰(`BLOB_READ_WRITE_TOKEN`)이 필요하다. 즉 **읽기는 public, 쓰기는 토큰 필요**라는 비대칭 구조다.

## 3. 왜 future uploader는 Vercel Function body route가 아니라 local/worker-side SDK 업로드인가

- Vercel Function의 **request body 한계는 4.5MB**다. 이 프로젝트의 Instagram mp4는 20-30MB이므로, 파일 body를 Next.js upload endpoint로 받는 구조는 한계를 초과한다.
- 따라서 future uploader는 **렌더 산출 mp4 경로에서 로컬/워커 측 `@vercel/blob` SDK로 직접 업로드**한다. 제안 호출 형태:

  ```
  put(pathname, body, { access: 'public', addRandomSuffix: false, allowOverwrite: false })
  ```

- 현재 `package.json`에 `@vercel/blob`이 **없다.** SDK 설치는 dependency/lockfile 변경이므로 **별도 승인(`APPROVE_VERCEL_BLOB_DEPENDENCY_AND_CODE_INTEGRATION`)** 이 필요하며 이 slice에서는 수행하지 않는다.

## 4. 결정론적 immutable object key

future object key/path scheme (제안):

```
instagram/reels/{contentId}/{variantId}/{version}/{sha256_12}.mp4
```

- **deterministic**: 같은 `contentId`/`variantId`/`version`/`sha256_12`는 항상 같은 URL로 매핑된다.
- **immutable**: overwrite 금지(`allowOverwrite:false`), random-only suffix URL 금지(`addRandomSuffix:false`).
- `sha256_12`는 mp4 콘텐츠 해시 앞 12자로 무결성/중복 방지에 사용한다.
- **public URL은 Instagram 업로드 전에 반드시 verifier gate로 검증**한 뒤에만 사용한다(§5).

## 5. Public URL verifier gate (상속)

Instagram video_url로 넘기기 전에 Blob public URL도 [`stable-public-media-url-strategy`](./public-media-url-strategy.md)의 verifier gate를 **그대로 상속**한다. 하나라도 실패하면 fail-closed로 업로드를 중단한다.

- HTTPS 전용
- HTTP 2xx 또는 range 요청 시 206
- `Content-Type`이 `video/`로 시작
- `text/html` 거부
- 무인증(unauthenticated) 접근 가능
- 로그인/HTML 리다이렉트 거부
- 검증된 URL만 업로드(`uploadOnlyWithVerifiedUrl`)

## 6. Retention / cleanup 정책

- Meta fetch/retry에 충분한 기간 동안 Blob object 유지 (기본 목표 **1-7일**).
- **publish 성공 확인 + 안전 지연 이후에만** 별도 승인된 cleanup 경로에서 삭제. 발행 실패 시 조기 삭제 금지.
- 기본적으로 **Blob에 장기 영상 아카이브를 두지 않는다.**
- cleanup/retention job은 별도 승인(`APPROVE_VERCEL_BLOB_CLEANUP_RETENTION_JOB`)이 필요하다.

## 7. Size / cost / free-tier guard

- Instagram Blob object 목표 크기 **20-30MB**, 제안 상한 **35MB**. 상한 초과 시 **fail-closed**.
- Hobby 무료 포함 한도 (공식 pricing 근거): storage 1GB/월, simple operations 10,000, advanced operations 2,000, Blob Data Transfer 10GB.
- **Hobby는 한도 내에서 무료지만 한도 초과 시 Blob access가 중단된다(무제한/보장 무료 아님).** 따라서 usage/cost guard가 필수다.
- Blob object 수 = 하루 Instagram 콘텐츠 수(Instagram 변형만 업로드) → 짧은 retention과 결합해 순간 저장량을 작게 유지한다.

## 8. Future approval sequence (각 게이트 별도 Owner 승인)

이 slice는 어느 것도 실행하지 않는다.

1. `APPROVE_VERCEL_BLOB_STORE_PROVISIONING` — public Blob store 생성.
2. `APPROVE_VERCEL_BLOB_DEPENDENCY_AND_CODE_INTEGRATION` — `@vercel/blob` 설치(dependency/lockfile) + uploader 코드 통합.
3. `APPROVE_VERCEL_BLOB_ENV_TOKEN_WRITE_OR_PULL` — `BLOB_READ_WRITE_TOKEN` env/secret 설정 또는 pull.
4. `APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST` — 결정론적 key로 실제 object 1회 업로드 테스트.
5. `APPROVE_VERCEL_BLOB_PUBLIC_URL_LIVENESS` — public URL verifier gate live check.
6. `APPROVE_INSTAGRAM_ARM` — 검증된 Blob URL로 Instagram 실제 1회 발행.
7. `APPROVE_VERCEL_BLOB_CLEANUP_RETENTION_JOB` — 발행 성공 후 안전 지연 뒤 cleanup/retention job.

### Rollback

- store provisioning 전이면 원복할 상태가 없다(이 slice는 순수 문서/계약).
- 이후 각 게이트는 이전 게이트 성공 + Owner 승인 없이 진행하지 않으므로, 어느 단계에서든 다음 게이트를 승인하지 않는 것으로 안전하게 중단할 수 있다.
- store가 이미 생성된 뒤 방향을 바꾸려면 access mode 불변 특성상 **새 store 생성**이 필요하다(기존 store access mode 변경 불가).

## 9. 금지 (이 slice)

- Vercel Blob store 생성/provisioning
- token/env/secret read/write, `.env.local` 접근, `vercel env pull`
- `@vercel/blob` 설치 또는 dependency/lockfile 변경
- object upload, public URL liveness/network check
- Instagram API/`--arm`, YouTube API/OAuth/upload
- deploy/DNS/domain 변경
- render/mux/TTS/image/browser/ffmpeg/media generation
- commit/push
- secret/token 값을 docs/fixture/report에 기록

## 10. 공식 문서 근거 (Codex 확인)

- Vercel Blob overview: <https://vercel.com/docs/vercel-blob>
- Vercel Blob server upload: <https://vercel.com/docs/vercel-blob/server-upload>
- Vercel Blob usage & pricing: <https://vercel.com/docs/vercel-blob/usage-and-pricing>

핵심: Vercel Blob은 모든 plan에서 사용 가능하고 public store는 URL을 아는 누구나 direct blob URL로 읽을 수 있으며 쓰기는 토큰 필요; store access mode는 생성 시 고정되어 이후 변경 불가; 연결 프로젝트에 `BLOB_READ_WRITE_TOKEN`이 생성됨; Vercel Function body 한계는 4.5MB라 20-30MB mp4는 app route body로 라우팅하지 않음; Hobby는 한도 내 무료지만 초과 시 access 중단.

머신 판독 계약은 `scripts/fixtures/vercel_blob_instagram_integration_packet.v1.json`, 정적 가드는 `scripts/check-vercel-blob-instagram-integration-packet-static.mjs`.
