# Cloudflare R2 Provisioning Approval Packet (No-Live)

Task: `r2-primary-provisioning-approval-packet-v1`
Status: no-secret / no-provisioning approval packet. Cloudflare R2 = `media.buildgongjakso.com` sustained media provider **primary** (checkpoint `54b1a3a` accepted).
Scope note: 이 문서는 **provisioning 전 Owner 승인 패킷(no-live)** 이다. 실제 bucket/token 생성 · custom domain/DNS 변경 · env/secret write · deploy · object upload · live liveness check · Instagram `--arm` 업로드는 **전부 이후 별도 Owner 승인** 항목이며 이 slice에서 수행하지 않는다.

관련 계약:
- [`docs/public-media-url-strategy.md`](./public-media-url-strategy.md) — sustained default vs fallback 아키텍처.
- [`docs/media-provider-decision-packet.md`](./media-provider-decision-packet.md) — R2 primary 선택 근거.

---

## 1. 확정 파라미터 (제안)

| 항목 | 값 (제안) | 비고 |
|------|-----------|------|
| provider | `cloudflare_r2` | media-provider-decision-packet에서 primary 확정 |
| sustained host | `media.buildgongjakso.com` | stable-strategy sustained default 불변 |
| proposed bucket name | `buildgongjakso-media` | 보수적 명명. Owner가 다른 이름 선호 시 교체 가능(§4 unknowns) |
| custom domain | `media.buildgongjakso.com` | R2 public bucket custom domain으로 연결 |
| object key prefix/pattern | `<schemaGroup>/<version>/<topicId>/<artifact>.mp4` | stable-strategy 결정론적 key 상속. R2 custom domain은 bucket root를 도메인 root에 매핑하므로 **object key = URL path** |
| 예시 URL | `https://media.buildgongjakso.com/golden-sample/v3-2/t1_lifestyle_inflation/golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4` | object key = `golden-sample/v3-2/t1_lifestyle_inflation/golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4` |

> object key는 무작위 접미사 없이 topic/version에 대해 결정론적이어야 한다. bucket 내부 key와 public URL path가 정확히 일치해 verifier gate가 host+path로 안정 검증되게 한다.

---

## 2. 필요 env 이름 (값 금지)

이후 env/secret configuration slice에서 설정할 변수 **이름만** 기록한다. 값은 이 slice에서 읽거나 쓰지 않으며, report/fixture/log에 절대 기록하지 않는다.

| env name | 역할 |
|----------|------|
| `R2_ACCOUNT_ID` | Cloudflare account ID (R2 endpoint 구성) |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET` | bucket name (`buildgongjakso-media`) |
| `R2_ENDPOINT` | S3-compatible endpoint (`https://<account>.r2.cloudflarestorage.com`) — 업로드용, public read는 custom domain 사용 |
| `PUBLIC_MEDIA_BASE_URL` | public read base (`https://media.buildgongjakso.com`) — uploader가 결정론적 URL 조립에 사용 |

> `R2_ENDPOINT`는 **서버 측 업로드(S3 API)** 전용이고, **public read**는 반드시 `PUBLIC_MEDIA_BASE_URL`(custom domain)을 통한다. r2.dev endpoint는 비-production 용도이므로 sustained 경로로 쓰지 않는다.

---

## 3. R2 setup 순서 (approval-packet 레벨)

각 단계는 이전 단계 완료 + Owner의 해당 게이트 명시 승인 없이는 진행하지 않는다. 이 slice는 어느 단계도 실행하지 않는다.

1. **Cloudflare account/zone 사전 확인** — `buildgongjakso.com`이 R2 bucket과 같은 account의 Cloudflare zone인지 확인(§4 unknown).
2. **bucket 생성** — `buildgongjakso-media`.
3. **public bucket custom domain 연결** — `media.buildgongjakso.com`을 public bucket custom domain으로 추가(DNS record 생성 + status active 전환).
4. **R2 API token 생성** — 최소 권한(해당 bucket object read/write)만.
5. **env/secret 설정** — §2 이름으로만. 값은 별도 승인.
6. **code integration slice** — 렌더 산출물을 결정론적 key로 R2에 업로드하고 `PUBLIC_MEDIA_BASE_URL` 기반 URL을 조립하는 uploader 경로 구현.
7. **deploy** — Vercel deploy.
8. **controlled object upload test** — 승인된 단일 샘플 mp4 1건 업로드 테스트.
9. **public URL verifier check** — HTTPS/allowed host/2xx|206/video content-type/reject text-html/unauth/reject redirect (stable-strategy verifier gate 상속).
10. **Instagram `--arm` 승인** — 검증된 public mp4 URL로 1회 업로드.

---

## 4. Unknowns (Owner/Cloudflare 대시보드 확인 필요)

이 slice는 Cloudflare에 로그인/조회하지 않으므로 아래는 **미확정**이며 provisioning 승인 전에 Owner가 확인해야 한다.

- **U1** — `buildgongjakso.com`이 이미 이 Cloudflare account의 zone인지. (현재 evidence상 도메인은 Vercel org `buildgongjakso-home`에서 서비스 중 → Cloudflare zone 여부 별도 확인 필요.)
- **U2** — 도메인이 Cloudflare 관리가 아니면 **partial(CNAME) setup**이 필요한지.
- **U3** — 최종 Cloudflare **account ID** (R2 endpoint/`R2_ACCOUNT_ID`).
- **U4** — 최종 **bucket name** (Owner가 `buildgongjakso-media` 외 선호 시).
- **U5** — DNS record 추가 위치(현 registrar/DNS provider가 Vercel인지 Cloudflare인지) — custom domain 연결 방식(full zone vs partial CNAME)을 좌우.

> U1/U2/U5는 서로 얽혀 있다. `buildgongjakso.com`이 Cloudflare zone이 아니면 R2 custom domain 연결에 partial setup 또는 DNS provider 조정이 필요할 수 있으며, 이는 DNS/custom domain 승인 게이트에서 다룬다.

---

## 5. Rollback / disable 계획

provisioning 이후 문제 발생 시 아래 순서로 되돌린다. 각 단계는 독립적으로 실행 가능하며, 위쪽일수록 즉시성·저위험이다.

1. **disable domain access** — public bucket의 public access(custom domain)를 비활성화해 노출 즉시 차단.
2. **remove custom domain connection** — `media.buildgongjakso.com` custom domain 연결 제거(DNS record 회수).
3. **revoke token** — R2 API token 폐기(업로드 credential 무효화).
4. **remove env values** — `R2_*` / `PUBLIC_MEDIA_BASE_URL` 값 제거(이름만 남김).
5. **stop uploader path** — code integration의 uploader 경로 비활성화(렌더는 로컬 산출물만 유지).
6. **one-off repo `public/` fallback** — **명시 승인 시에만** 긴급 단발 발행을 위해 repo `public/` + deploy fallback 사용(`*.mp4` gitignore이므로 `git add -f` 필요).

> rollback은 sustained default(R2 object storage) → one-off fallback(repo public/) 전환 시에도 결정론적 key 구조는 불변, URL host/경로만 교체 → runner의 fail-closed verifier gate는 양쪽에 동일 적용.

---

## 6. 이후 Owner 승인 문구 (future approval snippets)

각 게이트는 아래 문구를 Owner가 명시할 때만 진행한다. 문구는 예시이며 Owner/Codex가 수정 가능. **이 slice는 어느 것도 실행하지 않는다.**

- **provisioning 승인**
  `APPROVE_R2_PROVISIONING: buildgongjakso-media bucket 생성 + public bucket custom domain(media.buildgongjakso.com) 연결 + 최소권한 R2 API token 생성을 승인한다. env/secret write, deploy, object upload, live check, Instagram --arm은 아직 별도.`
- **DNS/custom domain 승인**
  `APPROVE_R2_DNS_CUSTOM_DOMAIN: media.buildgongjakso.com을 R2 public bucket custom domain으로 연결하는 DNS record 추가/전환을 승인한다.`
- **env/secret write 승인**
  `APPROVE_R2_ENV_WRITE: R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_BUCKET/R2_ENDPOINT/PUBLIC_MEDIA_BASE_URL 값 설정을 승인한다. 값은 로그/report/fixture에 기록 금지.`
- **code integration 승인**
  `APPROVE_R2_CODE_INTEGRATION: 렌더 산출물을 결정론적 key로 R2에 업로드하고 PUBLIC_MEDIA_BASE_URL 기반 URL을 조립하는 uploader slice를 승인한다.`
- **deploy 승인**
  `APPROVE_R2_DEPLOY: uploader 통합본 Vercel deploy를 승인한다.`
- **object upload / live liveness 승인**
  `APPROVE_R2_UPLOAD_TEST_AND_LIVENESS: 승인된 단일 샘플 mp4 1건을 R2에 업로드하고 media.buildgongjakso.com public URL verifier(2xx+video/*, text/html 거부, 무인증) live check를 승인한다.`
- **Instagram `--arm` 승인**
  `APPROVE_INSTAGRAM_ARM_WITH_R2_URL: 검증된 media.buildgongjakso.com public mp4 URL로 Instagram 1회 업로드(--arm)를 승인한다.`

---

## 7. 금지 (이 slice)

Cloudflare login/account query/mutation · R2 bucket creation · token creation · DNS/custom domain 변경 · env/secret write · secret 값 read/print/write · deploy/Vercel deploy · object upload · public URL liveness check · Instagram upload/`--arm` · Instagram credential/env read · broad `.env.local` parsing · YouTube/Supabase/DB/render/mux/TTS/image/browser side effects · dependency/lockfile/font 변경 · commit/push.

---

## 8. 공식 문서 근거

- Cloudflare R2 public buckets / custom domains: <https://developers.cloudflare.com/r2/buckets/public-buckets/>
  - public bucket은 명시 권한이 있을 때만 인터넷 노출, custom domain(Owner 제어)이 지원 경로, `r2.dev`는 비-production, 도메인은 R2 bucket과 같은 account의 Cloudflare zone이어야 하며 미관리 도메인은 partial CNAME setup 가능, custom domain 연결은 DNS record 추가 후 status 전환으로 active.
- Cloudflare R2 API / authentication / tokens: <https://developers.cloudflare.com/r2/api/tokens/>
  - R2 API token으로 S3-compatible 접근, 최소 권한 scope 권장.
