# Media Provider Decision Packet (No-Live)

Task: `media-provider-discovery-decision-packet-v1` (superseded by `dual-platform-variant-publish-architecture-no-live-v1`)
Status: no-secret / no-provisioning discovery. **Active current contract는 이제 [`docs/dual-platform-variant-publish-architecture.md`](./dual-platform-variant-publish-architecture.md)다.**
Scope note: 이 문서는 **provider 선택 결정 패킷(no-live)** 이다. 실제 provider 생성/연결/bucket/token/DNS/env 설정/deploy/object upload/live liveness check/Instagram `--arm` 업로드는 **전부 이후 별도 Owner 승인** 항목이며 이 slice에서 수행하지 않는다.

관련 계약: [`docs/public-media-url-strategy.md`](./public-media-url-strategy.md) — sustained default vs fallback 아키텍처(현재 superseded). [`docs/dual-platform-variant-publish-architecture.md`](./dual-platform-variant-publish-architecture.md) — **현재 active architecture**.

---

## 0. Active Decision (현재 유효, dual-platform architecture로 supersede됨)

| 역할 | 대상 | 상태 |
|------|------|------|
| Instagram public URL provider | **Vercel Blob public direct URL** | **active** |
| YouTube upload mode | **YouTube Data API direct file upload** (Blob 불필요) | **active** |
| Cloudflare / R2 | suspended | **Owner preference로 suspended, 기술 실패 아님** |

> 아래 §1의 "R2 primary" 권장은 **historical/superseded**다. `media.buildgongjakso.com` strict custom media origin을 sustained default로 두던 이전 가정 아래서의 결정이며, Owner가 dual-platform 아키텍처(Instagram=Blob / YouTube=direct upload)로 방향을 바꾼 이후에는 current recommendation이 아니다. 근거/리스크 분석은 historical evidence로 보존한다.

---

## 1. (Historical/Superseded) 이전 권장 결정

**당시 결정 기준: sustained default가 strict custom media origin `media.buildgongjakso.com`인 이상, custom domain 직접 연결 근거가 공식문서에 있는 provider를 primary로 둔다.** — 이 기준 자체가 dual-platform 아키텍처 채택 이후 더 이상 active execution path가 아니다.

| 역할(당시) | Provider | 요약 근거(historical) |
|------------|----------|-----------------------|
| Primary (historical) | **Cloudflare R2** | R2 public buckets 공식문서가 bucket contents를 "내가 제어하는 custom domain"으로 인터넷 노출할 수 있고 production use에 custom domain을 권장 → `media.buildgongjakso.com` **직접 연결 근거가 공식문서에 존재**. S3-compatible API + egress 무료. 단 Cloudflare zone/partial(CNAME) setup + DNS 승인이 필요한 리스크가 있음. **현재는 Owner preference로 suspended.** |
| Fallback (historical, 현재 active) | **Vercel Blob** | 빠른 Vercel 1st-party 통합(이 repo가 이미 Vercel 프로젝트 `instagram-auto`로 링크됨) + object별 public direct blob URL 제공. 당시엔 blob 자체의 custom domain 직접 연결 근거가 미확인이라 fallback이었으나, **dual-platform 아키텍처는 media.buildgongjakso.com strict origin을 요구하지 않으므로 이 제약이 더 이상 적용되지 않는다. 현재 Instagram의 active provider.** |
| 3순위 (historical) | S3-compatible (AWS S3 / MinIO 등) | 가장 범용이나 이 프로젝트엔 계정·IAM·CDN(CloudFront)+ACM custom domain 설정 오버헤드가 커서 후순위. 현재도 채택 안 함. |

---

## 2. 로컬/계정 read-only evidence

이 slice에서 확인한 **비밀 없는(no-secret)** 증거:

- **이미 Vercel 링크됨**: `.vercel/project.json` → `projectName: "instagram-auto"`, org team 존재. `vercel.json`은 `framework: nextjs`, `pnpm build` 사용.
- **도메인이 같은 Vercel org**: `vercel project ls` 결과에 `buildgongjakso-home → https://www.buildgongjakso.com` 존재. 즉 `buildgongjakso.com` 도메인이 이 org에서 이미 서비스 중 → `media.buildgongjakso.com` 서브도메인 추가가 동일 대시보드에서 가능(별도 registrar 위임 재설정 최소화).
- **`instagram-auto` 배포 존재**: `instagram-auto-tau.vercel.app` (47d 전 업데이트) — 이 repo의 배포 타겟이 실재.
- **`*.mp4` gitignore**: `.gitignore` line 47 `*.mp4` → 생성 mp4를 repo에 커밋하는 fallback 경로는 현재 `git add -f` 강제가 필요하고 repo bloat를 유발. 이는 **object storage(sustained default) 채택의 강한 근거**이며 repo `public/` 커밋 방식이 왜 one-off fallback인지 재확인.
- **Vercel CLI 인증 상태**: `vercel whoami` → 로그인된 사용자 존재, 프로비저닝/토큰 프롬프트 없이 read-only listing 성공. (secret 값은 읽지 않음.)
- **`next.config.ts` outputFileTracingExcludes**: `output/`, `python/`, `assets/`를 번들 추적 제외 — 서버가 로컬 파일을 직접 접근하는 렌더 파이프라인. 스토리지 업로드는 이후 렌더 산출물을 object store로 push하는 별도 integration slice에서 배선.

공식 문서 근거(값/비밀 없이 provider 특성만):

- **Cloudflare R2** (primary): R2 public buckets 문서 — bucket contents를 "내가 제어하는 custom domain"으로 인터넷에 노출할 수 있고 production use에 custom domain을 권장. 즉 `media.buildgongjakso.com` 직접 연결 근거가 공식문서에 존재. S3-compatible API, egress 무료. 필요 env(이름만): `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`. ref: <https://developers.cloudflare.com/r2/buckets/public-buckets/>
- **Vercel Blob** (fallback): object별 public direct blob URL(anyone-with-URL read) 제공, Next.js/Vercel 배포와 1st-party 통합, 서버 SDK로 업로드. **단 blob 자체를 custom domain(`media.buildgongjakso.com`)으로 직접 연결하는 근거는 공식문서에서 확인되지 않음** — strict media origin에는 별도 redirect/proxy/도메인 전략 검증 필요. 필요 env(이름만): `BLOB_READ_WRITE_TOKEN`. ref: <https://vercel.com/docs/vercel-blob>
- **S3-compatible**: 표준 S3 API. custom domain은 CloudFront+ACM 등 별도 CDN 설정 필요. 필요 env(이름만): `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`.

> 위 env는 **이름만** 기록한다. 값은 이 slice에서 읽거나 쓰지 않는다. custom domain 직접 연결 근거의 유무(R2 확인 / Vercel Blob 미확인)가 primary/fallback 순서 판단의 핵심 기준이다.

---

## 3. Provider 비교

| 기준 | Cloudflare R2 (primary) | Vercel Blob (fallback) | S3-compatible |
|------|-------------------------|------------------------|---------------|
| **custom domain `media.buildgongjakso.com`** | ✅ **공식문서에 직접 연결 근거** (production 권장) | ⚠️ blob custom domain 직접 연결 근거 미확인 → redirect/proxy/도메인 전략 검증 필요 | CloudFront+ACM 설정 |
| 플랫폼 정합 | 별도 CF 계정/zone 필요 | 이 repo와 동일 Vercel org/배포 | 별도 AWS/IAM 필요 |
| public direct mp4 URL | ✅ (public bucket) | ✅ (public blob URL) | ✅ (public/CDN) |
| egress 비용 | egress 무료 | 사용량 과금 | egress 과금 |
| 설정 오버헤드 | 중간 (zone/partial + DNS) | 낮음 (1st-party) | 높음 |
| provider-neutral 전환 | 계약상 host/경로만 교체, key 구조 불변 | — | — |

---

## 4. (Historical) 이후 실행 시퀀스 — R2 경로 기준, 현재 미사용

> 이 시퀀스는 R2 primary 가정 아래에서의 historical 기록이다. **현재 active 승인 시퀀스는 [`docs/dual-platform-variant-publish-architecture.md`](./dual-platform-variant-publish-architecture.md) §6의 `APPROVE_DUAL_PLATFORM_ARCHITECTURE` ~ `APPROVE_DUAL_PLATFORM_ARM` 10단계를 따른다.**

1. **Owner selects provider** — Cloudflare R2(historical 권장) 또는 Vercel Blob(현재 active) 확정.
2. **Provider provisioning approval** — 계정/버킷/토큰 생성 승인 (R2: bucket + API token).
3. **DNS/custom domain approval** — `media.buildgongjakso.com` 연결 승인 (R2: public bucket custom domain, Cloudflare zone/partial setup 필요). **dual-platform 아키텍처에서는 Instagram Blob 경로에 이 단계가 불필요.**
4. **Env/secret configuration approval** — provider env(§2 이름) 값 설정 승인.
5. **Code integration slice** — 렌더 산출물을 결정론적 key로 object store에 업로드하는 경로 구현(별도 slice).
6. **Deploy approval** — Vercel deploy 승인.
7. **Live URL liveness approval** — 실제 public mp4 URL 네트워크 검증 승인.
8. **Instagram `--arm` approval** — 실제 1회 업로드 실행 승인.

각 단계는 이전 단계 완료 + Owner의 명시 승인 없이는 진행하지 않는다. verifier gate(HTTPS/allowed host/2xx|206/video content-type/reject text-html/unauth/reject redirect)는 §stable-strategy 계약을 그대로 상속하며, dual-platform 아키텍처의 Instagram Blob URL 경로에도 동일하게 적용된다.

---

## 5. 리스크 & 롤백

- **리스크 R1 — Cloudflare R2 zone/partial setup + DNS 승인 필요**: `media.buildgongjakso.com` custom domain 연결은 Cloudflare zone(full 또는 partial CNAME) 설정과 DNS 승인(gate 3)이 선행. 미완이면 live liveness check(gate 7)가 fail-closed로 차단. 롤백: strict media origin 보장 전엔 one-off fallback(repo `public/` + deploy)으로 단발 발행.
- **리스크 R2 — DNS 전파 지연**: `media.buildgongjakso.com` 활성까지 시간 소요. → live liveness check(gate 7)가 fail-closed로 잡음. 롤백: 긴급 시 one-off fallback(repo `public/` + deploy)으로 단발 발행.
- **리스크 R3 — env/secret 오설정**: 잘못된 토큰. → 업로드 경로는 credential presence + verifier gate로 fail-closed. 값은 report/fixture/log에 절대 미기록.
- **리스크 R4 — Vercel Blob custom domain 미확인 (fallback 채택 시)**: blob 자체의 custom domain 직접 연결 근거가 공식문서에 없어, fallback으로 vercel_blob을 쓰려면 strict `media.buildgongjakso.com` origin을 만족할 redirect/proxy(예: media 서브도메인 → blob URL) 또는 도메인 전략을 먼저 검증해야 함.
- **롤백 원칙**: sustained default(object storage) ↔ one-off fallback(repo public/) 사이 전환은 URL host/경로만 바뀌고 결정론적 key 구조는 불변 → runner의 fail-closed verifier gate는 양쪽에 동일 적용. R2↔Vercel Blob provider 전환도 host/경로만 교체.

---

## 6. 금지 (이 slice)

storage provisioning · bucket/token/account creation · provider mutation · DNS/custom domain 변경 · env/secret write · secret 값 read/print/write · deploy/Vercel deploy · object upload · public URL liveness check · Instagram upload/`--arm` · Instagram credential/env read · broad `.env.local` parsing · YouTube/Supabase/DB/render/mux/TTS/image/browser side effects · dependency/lockfile/font 변경 · commit/push.
