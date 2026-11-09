# R2 Provisioning Preflight — DNS / Zone Report (Read-Only)

Task: `r2-provisioning-preflight-dns-zone-check-v1`
Status: **read-only preflight / report only.** 이 slice는 실제 R2 bucket/token/custom domain provisioning, DNS 변경, env/secret write, deploy, object upload, live liveness check, Instagram `--arm`을 **수행하지 않는다.**
Owner 승인 근거: `APPROVE_R2_PROVISIONING` (checkpoint `398456a`) — 단, 실행 전 `buildgongjakso.com`이 Cloudflare zone인지, partial CNAME setup이 필요한지, DNS record 추가 위치가 어디인지 먼저 확인/보고 요구.

관련 계약:
- [`docs/r2-provisioning-approval-packet.md`](./r2-provisioning-approval-packet.md) — R2 provisioning 승인 패킷(§4 unknowns U1/U2/U5가 이 보고서 대상).
- [`docs/media-provider-decision-packet.md`](./media-provider-decision-packet.md) — R2 primary 선택 근거.
- [`docs/public-media-url-strategy.md`](./public-media-url-strategy.md) — sustained default host.

---

## 1. 판정 (Classification)

**`PARTIAL_CNAME_SETUP_LIKELY`**

`buildgongjakso.com`은 **Cloudflare zone이 아니다.** 도메인은 **gabia**(한국 등록/DNS)에 위임되어 있고 현재 웹 트래픽은 **Vercel**로 향한다. 따라서 R2 public bucket custom domain(`media.buildgongjakso.com`)을 붙이려면 Cloudflare 공식 문서가 명시한 **partial (CNAME) setup** 경로가 유력하며, `media` 서브도메인 CNAME record를 현 DNS 관리 지점에 추가해야 한다. 이 record 추가·custom domain 연결은 **다음 별도 승인 게이트(APPROVE_R2_DNS_CUSTOM_DOMAIN)** 에서 수행한다.

---

## 2. Read-Only 증거 요약 (non-secret)

| 대상 | 조회 유형 | 결과 | 해석 |
|------|-----------|------|------|
| `buildgongjakso.com` | NS | `ns1.gabia.co.kr`, `ns.gabia.net`, `ns.gabia.co.kr` | **gabia 위임 — Cloudflare NS 아님** |
| `buildgongjakso.com` | A (apex) | `216.198.79.1` | Vercel 대역(apex → Vercel) |
| `www.buildgongjakso.com` | CNAME | `36c1ec111c10a4f6.vercel-dns-017.com` | **Vercel(vercel-dns-017) 지향** |
| `media.buildgongjakso.com` | CNAME/A | `Non-existent domain` (NXDOMAIN) | **미생성 — 아직 어떤 record도 없음** |
| local `.vercel/project.json` | read | `projectName=instagram-auto`, orgId/projectId(식별자, secret 아님) | Vercel 프로젝트 연결 확인 |
| local `vercel.json` | read | `framework=nextjs`, `pnpm build` | secret 없음 |

> NS가 gabia이고 apex/www가 Vercel을 가리키므로, 도메인 자체는 **Cloudflare에 위임되어 있지 않다.** 이는 R2 custom domain 연결 시 full-zone 이관이 아니라 partial CNAME 방식이 자연스러운 상황임을 의미한다. secret/token 값은 조회하지 않았다.

---

## 3. Owner 질문 4가지에 대한 답

1. **`buildgongjakso.com`이 Cloudflare zone인가?**
   **아니다.** NS = gabia. 현재 Cloudflare에 위임된 zone이 아니다.

2. **`media.buildgongjakso.com`에 Cloudflare partial CNAME setup이 필요한가?**
   **유력하다(likely).** 도메인이 Cloudflare 관리가 아니므로, Cloudflare R2 custom domain 문서상 "도메인이 Cloudflare 관리가 아니면 partial CNAME setup" 경로가 적용될 가능성이 높다. 최종 방식은 R2가 custom domain 연결 시 제시하는 대상 record와 Cloudflare 대시보드 절차로 확정한다.

3. **DNS record는 어디에 추가/변경해야 하는가?**
   현재 DNS 위임 지점은 **gabia**다. 단, R2 custom domain의 partial CNAME은 통상 **Cloudflare에 partial zone을 등록한 뒤 gabia에서 `media` 서브도메인 CNAME을 Cloudflare가 지정하는 대상으로 추가**하는 형태가 된다. 즉 record 추가 지점은 **gabia(현 authoritative DNS)**, 연결 방식은 **Cloudflare partial setup**이다. apex/www의 Vercel 설정은 건드리지 않는다(`media` 서브도메인만 신규).

4. **지금 실제 provisioning으로 넘어가도 되는가?**
   **부분 조건부.** bucket 생성(§관련 승인) 자체는 DNS와 독립적이라 진행 가능하나, **custom domain 연결은 Owner의 Cloudflare 계정 존재 여부 + gabia DNS 접근 확인이 선행**되어야 한다. 아래 unknown이 남아 있어 custom domain 게이트 전에 Owner 확인이 필요하다.

---

## 4. 남은 Unknowns (Owner/대시보드 확인 필요)

- **U-A** — Owner가 **Cloudflare 계정**을 보유했는지(R2 사용 전제). 미보유 시 계정 생성이 provisioning 첫 단계.
- **U-B** — R2 custom domain을 partial로 붙일 때 Cloudflare가 요구하는 정확한 **CNAME 대상 호스트**(연결 시점에 Cloudflare가 발급) — 사전 확정 불가, 연결 UI에서 확인.
- **U-C** — gabia DNS 콘솔에서 `media` CNAME record 추가 권한/접근을 Owner가 갖고 있는지.
- **U-D** — 최종 Cloudflare **account ID**(`R2_ACCOUNT_ID`) — 계정 확정 후 env 게이트에서 사용.

---

## 5. 다음 권장 Owner 승인/액션

권장 순서:

1. **(Owner 확인)** Cloudflare 계정 보유 여부(U-A) + gabia DNS 접근(U-C) 확인.
2. **bucket 생성 승인** — `buildgongjakso-media` bucket 생성(DNS 독립, 저위험). custom domain 연결과 분리해 먼저 진행 가능.
3. **`APPROVE_R2_DNS_CUSTOM_DOMAIN`** — Cloudflare에 `buildgongjakso.com` partial zone 추가 + `media` CNAME을 Cloudflare 지정 대상으로 gabia에 등록 + R2 custom domain 연결.
4. 이후 token → env(값) → code integration → deploy → object upload test → verifier live check → Instagram `--arm`은 각각 별도 승인.

> 이 preflight는 어떤 provisioning/DNS/token/env/deploy/upload/liveness/Instagram 액션도 실행하지 않았다.

---

## 6. 공식 문서 근거

- Cloudflare R2 public buckets / custom domains: <https://developers.cloudflare.com/r2/buckets/public-buckets/>
  - custom domain은 R2 bucket과 같은 account의 Cloudflare zone을 통해 연결하며, **도메인이 Cloudflare 관리가 아니면 partial (CNAME) setup**으로 붙일 수 있다.
- Cloudflare R2 API / tokens: <https://developers.cloudflare.com/r2/api/tokens/>
  - 최소 권한 scope의 R2 API token 권장.
