# Shorts Editorial OS V2 — Production Activation Plan

## 1. Base rebuild milestone status

Slice 0~8과 V2 base rebuild milestone은 `FINAL_PASS`다. PA 단계는 검증된 session-only 편집 흐름을 실제 운영 능력으로 오인하지 않으면서 필요한 기반을 순서대로 추가한다.

## 2. Production Activation 원칙

- 각 PA Slice는 ChatGPT Control Tower와 Owner가 exact scope·allowlist·외부 영향·검증을 승인한 뒤 시작한다.
- 생성 성공, 로컬 저장 성공, private test 성공, public publish 승인은 서로 다른 gate다.
- V1과 V2의 namespace, data root, account identity, publication ledger를 혼합하지 않는다.
- 외부 비용·계정·게시·deploy·push는 별도 exact 승인이 없으면 실행하지 않는다.

## 3. PA-1 approved checkpoint persistence

PA-1은 V2 전용 local-only project registry, 승인 milestone snapshot, atomic save, SHA-256 integrity, last-known-good, revision history, archive, recovery plan과 명시적 Owner 복구 확인을 구현한다. Feature flag 기본값은 OFF다.

## 4. PA-1이 구현하지 않는 full draft autosave

PA-1은 모든 textarea, 입력 중 form state, 선택 직전 상태, 각 Workbench 내부 state를 자동 저장하거나 hydration하지 않는다. 저장 대상은 callback으로 확정된 approved checkpoint뿐이다. Resume는 저장된 승인 단계와 요약을 읽고 새 세션을 그 단계 기준으로 다시 시작하라는 안내다.

## 5. PA-2 full Workbench hydration·autosave

PA-2는 `FINAL_PASS`이며 checkpoint `fc1bdd98aff12425daf31241934de783d3ca9b15`에 저장됐다. Full draft는 local-only non-canonical state로 저장하고 exact approved checkpoint base와 일치할 때만 hydration하며 approval-like state는 재확인 전까지 승격하지 않는다.

## 6. PA-3 Local User-Content Preview Renderer

PA-3는 `IMPLEMENTED_PENDING_CROSS_REVIEW`다. Persisted approved checkpoint만 canonical source로 사용하여 실제 narration/caption/source/number/scene/character 계획을 `540×960` 30fps local preview MP4로 만든다. system ffmpeg/ffprobe와 Playwright를 사용하지만 dependency/config는 변경하지 않는다.

PA-3 output은 silent placeholder audio, estimated subtitle, character motion preview proxy, unresolved external asset placeholder를 명시하며 `productionReady=false`다. 실제 external asset 생성·다운로드, TTS, final 1080 render, retry automation, public output, upload/publish는 범위 밖이다. Same-origin identifier-only API, revision/checkpoint hard stop, HTML/network/path containment, deterministic cache와 cleanup을 검증한다.

## 7. PA-4 후보: external TTS·asset integration

후보 범위일 뿐이다. provider, 비용 한도, voice/visual profile isolation, rights, retry, secret-safe helper와 Owner paid-action gate가 필요하다.

## 8. PA-5 후보: account identity·OAuth

후보 범위일 뿐이다. Instagram/YouTube 계정·채널 식별자, OAuth scope, token lifecycle, wrong-account hard stop과 no-log 운영 절차가 필요하다.

## 9. PA-6 후보: private test publishing

후보 범위일 뿐이다. private/unlisted destination, deterministic version/destination idempotency, remote duplicate read, durable publication ledger, withdraw procedure와 Owner exact approval가 필요하다.

## 10. PA-7 후보: controlled public relaunch

후보 범위일 뿐이다. final brand·handle·rights·policy·production assets·account identity·private smoke·rollback이 모두 PASS이고 Owner가 public publish를 명시 승인해야 한다.

## 11. 각 단계의 Control Tower gates

새 PA Slice, allowlist 확대, persistence architecture 변경, V1 migration, dependency/config/auth, 외부 API·비용·final production render·게시·deploy·push, P0/BLOCKED는 Control Tower 결정 대상이다. PA-3 local preview 완료가 PA-4 external integration 자동 승인을 뜻하지 않는다.

## 12. Rollback 원칙

Atomic write 실패 시 기존 정상 snapshot을 보존한다. Corruption 발견 시 자동 덮어쓰거나 삭제하지 않는다. last-known-good/history 후보, deterministic recovery plan, Owner confirmation, corrupted current 보존을 기본으로 한다.

## 13. V1 cutover 금지 조건

V2가 full draft hydration, actual render, external identity, private publish smoke, durable ledger, 운영 runbook을 검증하기 전에는 V1을 이동·삭제·대체하지 않는다. 실제 `C:\tmp` V1 데이터는 PA-1 범위 밖이며 접근하지 않는다.

## 14. Push·deploy·external cost 승인

PA-3 local checkpoint commit 사전 승인은 Claude 최종 PASS/P0 0/P1 0과 exact 18-path·checker·runtime·TypeScript·Git 검증 조건에만 적용된다. 고정 메시지는 `feat(editorial-v2): checkpoint local user-content preview renderer`다. Push, deploy, paid TTS/asset/final render, account/OAuth, upload/publish/schedule은 각각 Owner의 별도 exact 승인이 필요하다.

## 15. 현재 product operational capability

`product operational capability = NOT_CLAIMED`

PA-1 persistence와 PA-2 draft resume 이후 PA-3 Local User-Content Preview Renderer를 구현했지만, 이는 preview-only 증거다. Cloud backup, encryption at rest, authentication, V1 migration, external TTS/asset, production-quality 1080 render, account identity, durable publication ledger와 public launch 능력을 주장하지 않는다. PA-4는 Control Tower와 Owner의 새 exact 승인 전 `BLOCKED`다.
