# Vercel Blob Store Provisioning Result

Task: `vercel-blob-store-provisioning-v1`
Owner approval: `APPROVE_VERCEL_BLOB_STORE_PROVISIONING`
Status: **PROVISIONED** — public Blob store가 정확히 1회 생성되었고, project에 연결되지 않았다(standalone, env/token write 없음).

관련 계약:
- [`docs/vercel-blob-instagram-integration-packet.md`](./vercel-blob-instagram-integration-packet.md) — integration packet (이 provisioning의 상위 설계).
- [`scripts/fixtures/vercel_blob_instagram_integration_packet.v1.json`](../scripts/fixtures/vercel_blob_instagram_integration_packet.v1.json) — 머신 판독 계약.

---

## 1. 결과 요약

| 항목 | 값 |
|------|-----|
| storeName | `instagram-auto-instagram-media` |
| storeId | `store_NyZYiaz51y6acaCQ` |
| accessMode | `public` |
| region | `iad1` (기본값) |
| status | Active |
| size / files | 0B / 0 (object upload 없음) |
| connectedProjects | 없음 (`–`) — **standalone, link 안 됨** |
| externalMutationOccurred | true (store 1개 생성) |
| storeCreationAttemptCount | 1 |

## 2. 실행한 Vercel CLI 명령 (요약)

read/check (non-mutating):
- `vercel --version` → `Vercel CLI 54.5.0`
- `vercel whoami` → 로그인 확인 (계정 slug만; 토큰 값 미접근)
- `vercel blob list-stores --all` (생성 전) → `No blob stores found`
- `vercel blob create-store --help` → 옵션 확인

mutation (정확히 1회):
- `vercel blob create-store instagram-auto-instagram-media --access public --non-interactive`
  → `Success! Blob store created: instagram-auto-instagram-media (store_NyZYiaz51y6acaCQ) in iad1`, `Access: public`

확인 (생성 후):
- `vercel blob list-stores --all` → store Active, Projects `–`

## 3. link prompt 관찰 (중요)

`--non-interactive`가 store **생성**은 프롬프트 없이 처리했으나, 생성 직후 CLI가 다음 interactive prompt를 표시했다:

```
? Would you like to link this blob store to instagram-auto? (Y/n)
```

이 link 단계는 **project connection + env(`BLOB_READ_WRITE_TOKEN`) write**를 유발하므로 이번 slice에서 금지된 동작이다. 따라서 이 prompt에 **응답하지 않았다**(Y/n 입력 없음). 이후 독립적으로 `vercel blob list-stores --all`을 실행해 store의 `Projects` 컬럼이 `–`(연결 없음)임을 확인했다 — link는 발생하지 않았고 env/token write도 없다.

- `--yes` 미사용, `--environment` 미사용, `--token`/`--rw-token` 미사용.
- store creation은 standalone으로 완료되었고, project 연결/env write는 다음 승인 게이트(`APPROVE_VERCEL_BLOB_ENV_TOKEN_WRITE_OR_PULL` 또는 별도 connection 게이트)로 남는다.

## 4. Side effects (확인)

- externalMutation: public Blob store 1개 생성 (승인 범위).
- blobObjectUpload: 0
- publicUrlLivenessCheck: 0
- envSecretAccess(read/write/print): 0 — `BLOB_READ_WRITE_TOKEN` 값 미접근
- projectConnection/link: 0 (Projects `–`)
- dependency/lockfile change: 0
- deploy/DNS/domain: 0
- Instagram API/`--arm`: 0
- YouTube API/OAuth/upload: 0
- render/mux/TTS/image/browser/ffmpeg/media generation: 0
- commit/push: 0

## 5. 다음 승인 게이트

이 provisioning 이후에도 아래는 별도 Owner 승인이 필요하다:
- `APPROVE_VERCEL_BLOB_DEPENDENCY_AND_CODE_INTEGRATION` — `@vercel/blob` 설치 + uploader 코드.
- `APPROVE_VERCEL_BLOB_ENV_TOKEN_WRITE_OR_PULL` — `BLOB_READ_WRITE_TOKEN` env/secret 설정 또는 pull(= store를 project에 연결하거나 token을 발급/기록).
- `APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST` — 결정론적 key로 실제 object 1회 업로드.
- `APPROVE_VERCEL_BLOB_PUBLIC_URL_LIVENESS` — public URL verifier gate live check.
- `APPROVE_INSTAGRAM_ARM` — 검증된 Blob URL로 Instagram 실제 1회 발행.
- `APPROVE_VERCEL_BLOB_CLEANUP_RETENTION_JOB` — 발행 성공 후 cleanup/retention.

머신 판독 결과는 `scripts/fixtures/vercel_blob_store_provisioning_result.v1.json`, 정적 가드는 `scripts/check-vercel-blob-store-provisioning-result-static.mjs`.
