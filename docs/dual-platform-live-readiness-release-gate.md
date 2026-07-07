# Dual-Platform Live Readiness Release Gate (No-Live)

task: `dual-platform-live-readiness-release-gate-no-live-v1`

## 목적

실제 Instagram/YouTube live upload를 여는 승인을 하기 전에, 지금까지 만든
dual-platform automation(orchestrator no-execute wiring + social live client
import-safety)이 release-ready 상태인지 no-live로 종합 확인한다. 이 slice는
실제 업로드/API 호출/env 값 접근을 수행하지 않는다 — 검증 결과와 다음 Owner
승인 순서만 명문화한다.

## 구성 요소

| 파일 | 역할 |
|------|------|
| `scripts/fixtures/dual_platform_live_readiness_release_gate.v1.json` | readiness 조건, evidence command log, live 승인 순서를 담는 계약 fixture. |
| `scripts/check-dual-platform-live-readiness-release-gate-static.mjs` | fixture 구조 + (선택적으로) orchestrator preflight/live 실행 결과를 검증하는 dependency-free 정적 가드. |
| `docs/dual-platform-live-readiness-release-gate.md` | 이 문서. |

## Readiness 조건 (release-ready 판정 기준)

아래 12개 조건이 모두 충족되어야 release-ready로 판정한다. 각 조건의 상세는
fixture의 `readinessConditions`에 있다.

1. **TypeScript 컴파일 통과** — `node node_modules/typescript/bin/tsc --noEmit --pretty false` 오류 0.
2. **social live client import-safe** — `lib/instagram.ts`/`lib/youtube.ts`가 top-level에서 `process.env`를 읽지 않고 explicit credential injection 함수를 제공.
3. **orchestrator `--dry-run` OK** — 기존 no-live 계약 유지.
4. **orchestrator `--preflight` OK** — `preflightOk === true`, env 값 미접근.
5. **orchestrator `--live`/`--arm` fail-closed 유지** — nonzero exit + `LIVE_EXECUTION_DISABLED_THIS_SLICE`.
6. **liveExecutionPlan 모든 step disabled** — `enabled`/`willExecute`/`sideEffectPerformed` 전부 false.
7. **metadata optimization gate 필수** — Instagram/YouTube publish step의 mandatory dependency.
8. **duplicate publish guard 필수** — 두 publish step의 mandatory dependency, `v3_2` 키.
9. **기존 evidence retryForbidden 유지** — Instagram `17916511431199303` / YouTube `r9jhckdpC9w`는 참조만, 재시도 대상 아님.
10. **`.env.local` 직접 접근 금지** — runner/lib 소스 어디에도 없음.
11. **env/secret 값 read/write/print 금지** — key 이름 계약만 존재.
12. **`YOUTUBE_ACCESS_TOKEN` 장기 required env 금지** — short-lived token은 refresh token으로 메모리 발급.
13. **실제 API 호출 0** — Vercel Blob/Instagram/YouTube 어디에도 실제 호출 없음(`sideEffectCounters` 전부 0).

## 이번 세션 검증 근거 (evidence command log)

| command | 결과 |
|---------|------|
| `node node_modules/typescript/bin/tsc --noEmit --pretty false` | PASS (오류 0) |
| `node scripts/check-social-live-client-import-safety-static.mjs` | PASS (23/23) |
| `node scripts/check-dual-platform-final-publish-orchestrator-static.mjs` | PASS (234/234) |
| `node scripts/check-local-pipeline-runner-static.mjs` | PASS (61/61) |
| `node scripts/check-render-manifest-local-runner-static.mjs` | PASS (42/42) |
| `node scripts/check-money-shorts-automation-orchestrator-static.mjs` | PASS (151/151) |
| `node scripts/run-dual-platform-final-publish-orchestrator.mjs --preflight` | PASS (`preflightOk: true`) |
| `node scripts/run-dual-platform-final-publish-orchestrator.mjs --live` | FAIL_CLOSED_AS_EXPECTED (exit 2, `LIVE_EXECUTION_DISABLED_THIS_SLICE`) |

secret 값/토큰/credential은 이 로그 어디에도 기록되지 않는다 — command 문자열과
PASS/FAIL 결과 요약만 담는다.

## Live 승인 순서 (Owner가 실제로 결정할 것)

release gate 통과 후 실제 live upload를 열려면, Owner가 아래 순서를 **하나씩**
명시 승인해야 한다. 각 단계는 이전 단계 승인 없이는 유효하지 않으며, 마지막
단계(`APPROVE_DUAL_PLATFORM_ARM`) 전까지는 실제 게시가 발생하지 않는다.

| order | 승인 토큰 | 목적 |
|-------|-----------|------|
| 1 | `APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST` | Instagram full-frame mp4를 Vercel Blob에 실제로 1회 업로드해 public URL 생성 테스트를 허용한다. |
| 2 | `APPROVE_INSTAGRAM_BLOB_URL_LIVENESS_NO_ARM` (또는 동등한 public URL liveness 승인) | 1단계에서 만든 Blob public URL이 외부에서 실제로 접근 가능한지만 확인한다. **Instagram publish(arm) 자체는 이 단계에 포함되지 않는다** — publish는 4단계 이후에만 열린다. |
| 3 | `APPROVE_YOUTUBE_LIVE_UPLOAD_WIRING` | YouTube direct file upload 경로를 실제 API 호출(OAuth/refresh token 사용 포함)로 연결하는 것을 허용한다. |
| 4 | `APPROVE_DUAL_PLATFORM_ARM` | Instagram publish + YouTube upload + ledger record를 포함한 전체 dual-platform 자동 게시를 활성화한다. 이 전환(`LIVE_EXECUTION_ENABLED_THIS_SLICE`를 true로 바꾸는 코드 변경) 자체도 별도 슬라이스에서 명시 승인 후에만 수행된다. |

이 gate/fixture/guard는 위 순서를 **문서화**할 뿐 코드로 강제하지 않는다.
실제 강제(예: 2단계 승인 없이 3단계로 못 넘어가게 하는 로직)는 향후 live
wiring 승인 슬라이스에서 연결된다.

## 다음 Owner 결정 요약 (한 문단)

이번 slice까지 완료된 것은 dual-platform publish orchestrator의 no-live
구조(dry-run/preflight/fail-closed live), social live client의 import-safe
credential injection, 그리고 이 release gate 검증이다. 아직 실제 API 호출은
어디에도 연결되어 있지 않다. Owner가 다음으로 결정할 것은 "언제 실제 live
wiring을 열지"이며, 그 첫 단계는 위 표의 order 1
(`APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST`)부터 순서대로 하나씩 명시 승인하는
것이다. 각 단계는 별도 세션/슬라이스에서 최소 변경으로 연결되며, 4단계
(`APPROVE_DUAL_PLATFORM_ARM`) 전까지는 실제 게시가 발생하지 않는다.

## 이 slice의 금지 사항 (모두 0회 수행)

- Instagram API 호출 / YouTube API 호출
- Vercel Blob upload/list/delete 등 object mutation
- `.env.local` 또는 다른 secret 파일 직접 read/write
- secret 값/토큰/credential value 출력/로그/문서/fixture 기록
- 새 영상 생성/렌더/ffmpeg/TTS/image/browser 실행
- deploy/DNS/env write/dependency/lockfile 변경
- commit/push
- 이 gate 통과만으로 `--live`/`--arm`이 실제 실행 가능해지는 것(fail-closed 우회)

## 검증

```
node --check scripts/check-dual-platform-live-readiness-release-gate-static.mjs
node scripts/check-dual-platform-live-readiness-release-gate-static.mjs
node scripts/check-social-live-client-import-safety-static.mjs
node scripts/check-dual-platform-final-publish-orchestrator-static.mjs
node scripts/check-local-pipeline-runner-static.mjs
node scripts/check-render-manifest-local-runner-static.mjs
node scripts/check-money-shorts-automation-orchestrator-static.mjs
node node_modules/typescript/bin/tsc --noEmit --pretty false
node scripts/run-dual-platform-final-publish-orchestrator.mjs --preflight
node scripts/run-dual-platform-final-publish-orchestrator.mjs --live
```
