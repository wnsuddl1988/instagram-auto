# Dual-Platform Variant Publish Architecture (No-Live)

Task: `dual-platform-variant-publish-architecture-no-live-v1`
Status: **no-live architecture decision packet.** 이 문서는 설계 고정만 하며, Vercel Blob store 생성/provisioning, token/env write, deploy, object upload, live liveness check, Instagram `--arm`, YouTube upload/OAuth를 **승인하거나 수행하지 않는다.**

관련 계약:
- [`docs/public-media-url-strategy.md`](./public-media-url-strategy.md) — sustained public media URL 전략 + verifier gate.
- [`docs/media-provider-decision-packet.md`](./media-provider-decision-packet.md) — provider 비교(이전 R2 primary, 현재 재정렬).
- [`docs/r2-bucket-provisioning-result.md`](./r2-bucket-provisioning-result.md) — R2 provisioning BLOCKED 결과.

---

## 1. 결정 요약

- **Cloudflare / R2 = suspended** — 기술 실패가 아니라 **Owner preference**로 중단. bucket 미생성, DNS/custom domain/token/env 미변경. R2/wrangler 경로는 이 아키텍처에서 사용하지 않는다.
- **Instagram = Vercel Blob public direct URL** — Instagram Graph API가 요구하는 public unauthenticated HTTPS `video_url`을 **Vercel Blob public object URL**로 공급(free-first).
- **YouTube = YouTube Data API direct file upload** — Blob에 올리지 않고 YouTube variant mp4 파일을 **direct(resumable) media upload**로 발행. YouTube는 지연 대상이 아니라 **first-class publish target**.
- **1 콘텐츠 → 2 렌더 변형 → 2 publish jobs** — 하나의 콘텐츠가 플랫폼별 mp4 2종을 만들고 각각 발행.
- repo `public/` fallback은 **sustained default가 아니라 one-off/manual fallback**으로만 유지.

---

## 2. 콘텐츠 → 변형 → 발행 모델

### 콘텐츠 단위
하나의 생성 콘텐츠 item이 script / audio / captions / scene manifest / metadata / **publish plan**을 소유한다.

### 렌더 변형 2종

| 변형 id | 플랫폼 | 해상도 | 레이아웃 | 배경 | Blob 필요 |
|---------|--------|--------|----------|------|-----------|
| `instagram_reels_full_frame_1080x1920` | Instagram Reels | 1080×1920 | full-frame 세로 | content full-bleed | **예** |
| `youtube_shorts_letterbox_1080x1920` | YouTube Shorts | 1080×1920 | **중앙 배치 + 위/아래 검은 여백** | **검정** | 아니오 |

- **Instagram variant**: 현재/기존 full-frame 세로 스타일 그대로.
- **YouTube variant**: 최종 파일은 1080×1920 세로 mp4 유지. **배경 검정 + 메인 영상 중앙 배치 + 위/아래 검은 여백(letterbox)**. YouTube UI(진행바/제목/버튼) 위험 영역에 중요 자막 배치 회피, 가독성 유지.

### 발행 job 2종

| job | 소스 변형 | 전달 방식 | provider | Blob 업로드 |
|-----|-----------|-----------|----------|-------------|
| `instagram_job` | Instagram variant | public unauthenticated HTTPS `video_url` | Vercel Blob | **예** (1-7일 retention 후 삭제/만료) |
| `youtube_job` | YouTube variant | direct media(resumable) file upload | YouTube Data API | 아니오 (별도 OAuth 승인 필요) |

> Blob에 올라가는 것은 **Instagram variant 뿐**이다. YouTube variant는 Blob에 올리지 않으므로 Blob storage pressure의 원천은 Instagram public URL variant뿐이다.

---

## 3. 하루 발행 수식 (daily capacity)

| 기준 | 콘텐츠 | 렌더 변형 | publish jobs | 구성 |
|------|--------|-----------|--------------|------|
| 1개/일 | 1 | 2 | **2** | Instagram 1 + YouTube 1 |
| 2개/일 | 2 | 4 | **4** | content당 (Instagram 1 + YouTube 1) = 4 |

- content당 publish jobs = **2**.
- **Blob object 수 = 하루 콘텐츠 수**(Instagram variant만 업로드). 즉 2개/일이면 하루 Blob object 2개.

---

## 4. Free-tier 답변 (Vercel Blob)

**가정**: Instagram Blob object당 **20–30 MB**, retention **1–7일**, 하루 Instagram object **1–2개**.

- **결론: Hobby free-tier 운영 plausible.** 짧은 retention 덕에 동시 저장량이 작게 유지된다(예: 2개/일 × 30MB × 7일 ≈ 최대 ~420MB 순간 저장, 발행 후 조기 삭제 시 훨씬 작음).
- **단, 무제한(unlimited)도 보장 무료(guaranteed free)도 아니다.** Vercel Blob은 storage / data transfer / operations 등에 **usage-based 과금 요소**가 있으므로 hard cost/usage guard가 필수다.

### Cost / Quota 가드
- Instagram variant만 Blob 업로드(YouTube variant는 Blob 금지) → 저장/전송량 최소화.
- 성공 ingest 후 또는 1–7일 내 Blob object 삭제/만료 → 누적 storage 억제.
- 장기 mp4 아카이브 금지(별도 승인 없이 long-term 보관 금지).
- 하루 발행 상한(예: 2 contents/day) 초과 시 job 생성 차단.
- Blob usage/청구 임계 도달 시 자동 업로드 중단(fail-closed).
- 결정론적 key로 중복 object 누적 방지.
- retention/삭제는 **성공 확인 이후에만**(발행 실패 시 조기 삭제 금지).

---

## 5. Verifier gate 상속

Instagram Blob public URL도 stable-strategy의 verifier gate를 그대로 상속한다: **HTTPS 전용 / video content-type / text-html 거부 / 무인증 접근 / 검증된 URL만 업로드(fail-closed)**. 하나라도 실패하면 Instagram `video_url` 사용을 중단한다.

---

## 6. 다음 승인 순서 (future approval sequence)

각 게이트는 Owner 명시 승인 시에만 진행한다. **이 slice는 어느 것도 실행하지 않는다.**

1. `APPROVE_DUAL_PLATFORM_ARCHITECTURE` — 본 아키텍처 채택.
2. `APPROVE_YOUTUBE_VARIANT_RENDER_SPEC` — YouTube letterbox(검은 여백/중앙) 렌더 스펙 확정.
3. `APPROVE_VERCEL_BLOB_STORE_PROVISIONING` — Vercel Blob store 생성.
4. `APPROVE_VERCEL_BLOB_ENV_TOKEN_WRITE` — Blob 토큰/env 설정.
5. `APPROVE_BLOB_INSTAGRAM_UPLOAD_CODE_INTEGRATION` — Instagram variant → Blob 업로드 + URL 조립 uploader.
6. `APPROVE_YOUTUBE_OAUTH_AND_UPLOAD_INTEGRATION` — YouTube OAuth/credential + videos.insert 통합.
7. `APPROVE_PLATFORM_VARIANT_RENDER_TEST` — 플랫폼별 변형 렌더 테스트.
8. `APPROVE_INSTAGRAM_BLOB_URL_LIVENESS` — Instagram Blob URL verifier live check.
9. `APPROVE_YOUTUBE_UPLOAD_TEST` — YouTube 업로드 테스트.
10. `APPROVE_DUAL_PLATFORM_ARM` — 양 플랫폼 실제 1회 발행.

---

## 7. 금지 (이 slice)

Cloudflare/R2/wrangler action · Vercel Blob store 생성/provisioning · token/env/secret read/write · `.env.local` 접근/broad env parsing · deploy/domain/DNS 변경 · object upload · public URL liveness check · Instagram upload/`--arm` · YouTube upload/API/OAuth 실행 · render/mux/TTS/image/browser regeneration · dependency/lockfile/font 변경 · secret logging · commit/push · repo `public/` fallback을 sustained default로 승격.

---

## 8. 공식 문서 근거

- Vercel Blob overview: <https://vercel.com/docs/vercel-blob>
- Vercel Blob usage & pricing: <https://vercel.com/docs/vercel-blob/usage-and-pricing>
- Vercel Blob public storage: <https://vercel.com/docs/vercel-blob/public-storage>
- YouTube Data API `videos.insert`: <https://developers.google.com/youtube/v3/docs/videos/insert>
- YouTube Shorts upload help: <https://support.google.com/youtube/answer/12779649>

핵심: Vercel Blob은 public object에 direct HTTPS URL을 제공(public-storage)하되 usage-based 과금(무제한/보장 무료 아님); YouTube Data API `videos.insert`는 mp4를 direct(resumable) media upload로 받아 외부 public URL 호스팅이 불필요; YouTube Shorts는 세로 짧은 영상 포맷.
