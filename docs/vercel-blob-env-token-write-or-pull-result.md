# Vercel Blob Env / Token (Write-or-Pull) Result

Task: `vercel-blob-env-token-write-or-pull-v1`
Owner approval: `APPROVE_VERCEL_BLOB_ENV_TOKEN_WRITE_OR_PULL`
Status: **STORE_LINK_BLOCKED_TOKEN_ABSENT_VERIFIED_REDACTED**
- store→project 연결: **BLOCKED** (기존 store를 기존 project에 연결하는 안전한 CLI 경로 없음).
- `BLOB_READ_WRITE_TOKEN` runtime presence: **redacted로 확인 — 현재 없음(absent)**.
- allowlisted key `BLOB_READ_WRITE_TOKEN`만 presence 확인용으로 읽었고, secret/token 값은 출력하거나 해시/복사/기록하지 않았다.

관련 계약:
- [`docs/vercel-blob-store-provisioning-result.md`](./vercel-blob-store-provisioning-result.md) — public store 생성 결과.
- [`docs/vercel-blob-dependency-code-integration-no-upload.md`](./vercel-blob-dependency-code-integration-no-upload.md) — no-upload code integration.

---

## 1. 결과 요약

| 항목 | 값 |
|------|-----|
| projectLinked | true (`.vercel/project.json` 존재, `instagram-auto`) |
| storeName / storeId | `instagram-auto-instagram-media` / `store_NyZYiaz51y6acaCQ` |
| storeAccess / region | Public / iad1 |
| storeBaseUrl | `nyzyiaz51y6acacq.public.blob.vercel-storage.com` (public read endpoint, secret 아님) |
| storeConnectedToProject | **false** (env 목록/runtime에 Blob 토큰 없음) |
| blobReadWriteTokenPresent | **false** (production runtime, redacted 확인) |
| storeLinkOutcome | **BLOCKED_VERCEL_BLOB_EXISTING_STORE_LINK_METHOD_UNAVAILABLE** |
| externalMutationOccurred | **false** (연결/env write/생성 없음) |

## 2. 왜 store→project 연결이 BLOCKED인가

Vercel CLI 54.5.0에는 **이미 존재하는 Blob store를 이미 존재하는 project에 연결**하는 명확한 전용 subcommand가 없다.

- `vercel blob` subcommand: `list | put | get | del | copy | create-store | delete-store | get-store | list-stores | empty-store` — 기존 store connect 없음.
- `vercel blob create-store --environment <env>`는 **새 store 생성 시점에만** project connect를 수행한다("Create and connect to project in CI"). 기존 `store_NyZYiaz51y6acaCQ`를 재사용하며 연결하는 경로가 아니다.
- `vercel connect [beta]`("Manage connectors")는 Blob native store→project 연결 용도인지 문서상 불명확하고 beta라 오작동 side effect 위험이 있어 사용하지 않았다.
- `vercel link`는 로컬 디렉토리↔project link(이미 완료)이고 store 연결이 아니다.
- `vercel integration`은 Marketplace integration으로 Blob native store 연결이 아니다.

HANDOFF 지침 6에 따라 안전한 connect path가 없으므로 우회하지 않고 **BLOCKED_VERCEL_BLOB_EXISTING_STORE_LINK_METHOD_UNAVAILABLE**로 기록한다. 새 store 생성이나 beta 명령으로 우회하지 않는다.

### 다음 단계 후보 (Codex/Owner 판단, 이 slice 범위 밖)

- (a) Vercel Dashboard에서 store `store_NyZYiaz51y6acaCQ`를 project `instagram-auto`에 수동 connect → connect 시 Vercel이 `BLOB_READ_WRITE_TOKEN`을 자동 생성.
- (b) 기존 standalone store를 폐기하고 `create-store ... --environment production`으로 연결까지 한 번에 하는 새 store 생성(별도 승인 필요, store 2개 방지 위해 기존 삭제 검토).
- (c) `vercel connect [beta]`가 실제로 Blob store connect를 지원하는지 Codex가 문서로 확인 후 별도 승인.

## 3. `BLOB_READ_WRITE_TOKEN` presence (redacted)

- checker: `scripts/check-vercel-blob-token-presence-redacted.mjs` — allowlisted key `process.env.BLOB_READ_WRITE_TOKEN`만 presence 확인용으로 읽고 **boolean presence만** 출력. 값/길이/prefix/suffix/hash 미출력/미기록.
- 로컬 shell 실행: `present:false`.
- production env 주입 실행: `vercel env run -e production -- node scripts/check-vercel-blob-token-presence-redacted.mjs` → `present:false`.
- `vercel env ls` (값은 `Encrypted`로만 표시): Supabase/Pexels/OpenAI 키만 존재, `BLOB_READ_WRITE_TOKEN` 없음.
- 결론: store가 project에 연결되지 않아 토큰이 아직 생성되지 않았다. presence 검증은 store 연결 이후 다시 수행해야 한다.

## 4. Vercel CLI 명령 / 결과 요약 (secret 값 없음)

| 명령 | 결과 |
|------|------|
| `vercel --version` | 54.5.0 |
| `vercel blob get-store store_NyZYiaz51y6acaCQ` | Active, Public, iad1, Blob Count 0, Base URL 확인 |
| `vercel env ls` | 값 `Encrypted` 표시, BLOB_READ_WRITE_TOKEN 없음 |
| `vercel env run -e production -- node scripts/check-vercel-blob-token-presence-redacted.mjs` | `present:false` (redacted) |
| `vercel blob --help` / `create-store --help` / `vercel --help` | 기존 store connect 전용 subcommand 부재 확인 |

- `--rw-token` / `--token` 미사용. `vercel blob put`/get/copy/del/empty/delete-store 미실행. 새 store 생성 없음.
- `vercel env add`/`rm`/broad `vercel env pull` 미실행.
- `vercel env run`은 env를 서브프로세스에만 주입하고 파일에 쓰지 않는다. CLI가 기존 gitignored `.env.local`을 자동으로 읽어 로드했으나(내가 생성/수정한 것 아님), 파일을 열거나 수정하지 않았고 git 추적 상태에도 변화 없다.

## 5. Side effects (확인)

- store→project connection: 0 (BLOCKED)
- env/secret write: 0
- new Blob store 생성: 0
- Blob object upload / put / get / copy / del / empty / delete-store: 0
- public URL liveness check: 0
- token/secret 값 print/hash/copy/record: 0 (allowlisted key presence boolean만)
- `.env.local` 생성/수정: 0 (CLI가 기존 파일 읽기만)
- Instagram API/`--arm`: 0 / YouTube API/upload: 0
- deploy/DNS/domain: 0
- dependency/lockfile/pnpm config: 0
- render/media generation: 0
- commit/push: 0

## 6. 다음 승인 게이트

- (store 연결 해결 후) `APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST` — 결정론적 key로 실제 object 1회 업로드.
- `APPROVE_VERCEL_BLOB_PUBLIC_URL_LIVENESS` — public URL verifier gate live check.
- `APPROVE_INSTAGRAM_ARM` — 검증된 Blob URL로 Instagram 실제 1회 발행.
- `APPROVE_VERCEL_BLOB_CLEANUP_RETENTION_JOB` — 발행 성공 후 cleanup/retention.

머신 판독 결과는 `scripts/fixtures/vercel_blob_env_token_write_or_pull_result.v1.json`, 정적 가드는 `scripts/check-vercel-blob-env-token-write-or-pull-result-static.mjs`.
