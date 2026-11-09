# Public Media URL Strategy (Sustained) — Historical / Superseded for Current Execution

Task: `stable-public-media-url-layer-v1` (superseded by `dual-platform-variant-publish-architecture-no-live-v1`)
Status: 지속 사용에 안정적인 public mp4 URL 경로를 프로젝트에 고정했던 아키텍처 계약. **현재 실행 경로의 active 계약은 [`docs/dual-platform-variant-publish-architecture.md`](./dual-platform-variant-publish-architecture.md)다.**
Scope note: 이 문서는 **설계 고정(no-live)** 이다. 실제 storage 프로비저닝/DNS/deploy/env 설정/live liveness check/Instagram `--arm` 업로드는 별도 Owner 승인이 필요하다.

---

## 0. 현재 Active 경로 (dual-platform 아키텍처로 supersede됨)

이 문서의 `media.buildgongjakso.com` custom media origin 요구는 **현재 실행에서 필수가 아니다.** Owner가 dual-platform 아키텍처로 전환한 이후 active 경로는 다음과 같다.

- **Instagram public URL 경로**: `media.buildgongjakso.com`이 아니라 **Vercel Blob public direct URL**을 사용한다. `video_url`은 Blob이 발급하는 object별 direct HTTPS URL이며, 이 문서의 §4 verifier gate(HTTPS/video content-type/reject html/unauth/verified-only)는 Blob URL에도 그대로 적용된다.
- **YouTube**: 이 public URL layer를 **쓰지 않는다.** YouTube Data API direct file upload로 발행하므로 public 호스팅 URL이 필요 없다.
- **repo `public/` fallback**: 여전히 one-off/manual fallback으로만 유지한다(sustained default 아님, 변경 없음).

아래 §1~§8은 `media.buildgongjakso.com` custom media origin을 sustained default로 두던 **historical 계약**이며, R2/custom domain 관련 세부는 현재 execution path에서 요구되지 않는다.

---

## 1. (Historical) 지속 default 경로 — 현재 execution에서 미요구

생성되는 모든 short mp4의 **지속(sustained) 기본 public URL 경로**로 아래를 고정했었다(historical).

- **Default (historical sustained):** 전용 public media origin
  - Origin: `https://media.buildgongjakso.com/...`
  - Backing: object storage/CDN (Vercel Blob, Cloudflare R2, S3-compatible 등 승인된 object store)
  - 이유: 매 영상 발행이 git commit/deploy에 결합되지 않고, repo가 mp4로 비대해지지 않으며, 안정적인 direct URL을 제공한다.
  - **현재는 이 custom origin host를 요구하지 않는다.** Instagram은 Vercel Blob이 발급하는 direct URL을 그대로 사용한다(별도 custom domain 불필요).

- **Fallback (manual / one-off only):** repo `public/` static mp4 + site deploy
  - URL: `https://www.buildgongjakso.com/...` (repo `public/` 하위 static mp4)
  - 용도: 긴급/수동 샘플 복구에 한함.
  - **지속 운영 경로가 아니다.** 매 영상 발행마다 이 방식을 쓰지 않는다. 이 방식은 매 발행을 git/deploy에 결합시키고 repo를 비대하게 만든다. **현재도 변경 없이 one-off/manual only.**

- **명시적 non-default:** 생성된 모든 mp4를 git repo에 커밋하는 것을 지속 경로로 삼지 않는다.

### Default vs Fallback 요약

| 항목 | Default (sustained) | Fallback (manual/one-off) |
|------|---------------------|---------------------------|
| Origin host | `media.buildgongjakso.com` | `www.buildgongjakso.com` |
| 저장 위치 | object storage/CDN | repo `public/` static |
| 발행 결합 | git/deploy 무관 | 매 발행이 git commit + deploy에 결합 |
| repo 영향 | mp4 커밋 없음 | mp4가 repo에 커밋됨 (bloat) |
| 사용 시점 | 반복 운영 default | 긴급/수동 샘플 복구만 |

---

## 2. 결정론적 media key/path scheme

각 생성 short마다 결정론적 media key를 부여한다.

```
media/<schemaGroup>/<version>/<topicId>/<artifact>.mp4
```

- 예 (sustained default origin):
  `https://media.buildgongjakso.com/golden-sample/v3-2/t1_lifestyle_inflation/golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4`
- 같은 topic/version은 항상 같은 key로 매핑되어야 하며, 무작위 접미사에 의존하지 않는다.
- fallback 경로도 동일 상대 경로 구조를 `public/` 아래에 유지한다:
  `public/golden-sample/v3-2/t1_lifestyle_inflation/golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4`

---

## 3. Provider-neutral 요건 (historical 설계 원칙, 현재도 유효)

이 프로젝트는 특정 storage 벤더에 종속되지 않는다는 원칙 자체는 지금도 유효하다. dual-platform 아키텍처에서 Instagram은 **Vercel Blob**을 채택했고 Cloudflare R2는 suspended다. 아래 요건은 Blob URL 검증에도 그대로 적용된다.

- object별 direct HTTPS URL 제공
- 무인증(public read) 접근 가능한 direct object URL
- `Content-Type: video/mp4` (또는 `video/*`) 응답
- HTTP `2xx` 또는 range 요청 시 `206`
- HTML 랜딩/로그인 리다이렉트로 대체되지 않는 direct object 응답
- 결정론적 key로 안정적 URL 제공

Provider 선택/계정 프로비저닝/버킷 생성은 **§6의 외부 승인 항목**이며 이 slice에서 수행하지 않는다.

---

## 4. Instagram 업로드 전 필수 verifier gate

Instagram `video_url`로 넘기기 전에 **모든** gate를 통과해야 한다. 하나라도 실패하면 fail-closed로 업로드를 중단한다.

1. **HTTPS** — URL protocol이 `https:`.
2. **Allowed host** — hostname이 허용 host 목록에 포함 (default: `media.buildgongjakso.com`; fallback: `www.buildgongjakso.com` / `buildgongjakso.com`).
3. **HTTP 2xx 또는 206** — HEAD(또는 range GET fallback) 응답이 `2xx` 또는 `206`.
4. **video content-type** — `Content-Type`이 `video/`로 시작하거나 정확한 accepted mp4 type.
5. **reject text/html** — `Content-Type`에 `text/html`이 포함되면 거부.
6. **unauthenticated access** — 인증 없이 direct object에 접근 가능.
7. **reject login/HTML redirect** — 로그인/HTML 랜딩으로의 리다이렉트를 거부.

이 gate들은 default origin과 fallback origin 양쪽에 동일하게 적용된다. 검증되지 않은 URL로는 업로드하지 않는다.

---

## 5. 기존 live Instagram runner와의 연결

`scripts/run-golden-sample-v3-2-instagram-upload-once.mjs`는 이미 fail-closed로 위 gate(§4)를 GATE_6에서 강제한다. 이 전략 계약은 그 runner가 **검증된 public mp4 URL만** 소비하도록 명문화한다.

- runner는 ad hoc URL 추측 대신 이 media 전략에서 정의된 결정론적 URL을 사용한다.
- runner의 기존 fail-closed 게이트(cap=1, Instagram-only, credential allowlist, ledger 선기록, secret 보호)는 그대로 유지된다.
- 이 slice에서 runner는 live URL check/env read/upload를 수행하지 않는다 (reference-only).

머신 판독 계약은 `scripts/fixtures/stable_public_media_url_strategy.v1.json`, 정적 가드는 `scripts/check-stable-public-media-url-strategy-static.mjs`.

---

## 6. 외부 Owner 승인이 필요한 항목

아래는 **현재 세션 밖에서 Owner의 명시 승인**이 있어야만 수행한다. 이 slice(no-live 준비)에서는 어느 것도 실행하지 않는다. dual-platform 아키텍처 채택 이후 실제 승인 게이트 이름은 [`docs/dual-platform-variant-publish-architecture.md`](./dual-platform-variant-publish-architecture.md)의 `APPROVE_VERCEL_BLOB_STORE_PROVISIONING` 등을 따른다.

- **DNS / custom domain** — (historical) `media.buildgongjakso.com` 서브도메인 설정/연결. **현재 execution에서는 Instagram Blob URL 경로에 불필요.**
- **storage provider provisioning** — object store(Vercel Blob) 계정/store 생성
- **env/secret configuration** — storage(Blob token)/Instagram credential 등 env 설정
- **deployment** — Vercel deploy 등 사이트 배포
- **live URL liveness check** — 실제 public URL에 대한 네트워크 요청
- **Instagram `--arm` upload** — 실제 1회 업로드 실행
- **YouTube OAuth/API 승인** — YouTube는 이 public URL layer를 쓰지 않으며 별도 direct upload 승인 계열([`docs/dual-platform-variant-publish-architecture.md`](./dual-platform-variant-publish-architecture.md) 참고)을 따른다.

---

## 7. 금지 (이 slice)

- live Instagram 업로드
- credential/env read, broad `.env.local` 파싱
- public URL network/liveness check
- storage provisioning / object upload
- DNS / custom domain 변경
- deploy / Vercel deploy
- DB/Supabase/YouTube/render/mux/TTS/image/browser 실행
- 생성 mp4를 git에 커밋하는 것을 sustained default로 삼기
- secret 값 로깅 또는 이 문서/fixture/report에 secret 기록
- dependency/lockfile/font 변경
- commit/push

---

## 8. 이후 통합 순서 (권장, 각 단계 Owner 승인 필요)

1. object storage provider 선택 + 계정/버킷 프로비저닝 (§6)
2. `media.buildgongjakso.com` DNS/custom domain 연결 (§6)
3. storage/CDN env/secret 설정 (§6)
4. 렌더 산출물을 결정론적 key로 storage에 업로드하는 경로 구현
5. runner가 default origin URL을 소비하도록 배선 (fail-closed gate 유지)
6. Owner 검토 가능한 권한 모드에서 live liveness check → `--arm` 1회 업로드 (§6)
