# Owner Daily Automation Runbook (No-Live)

task: `owner-usable-automation-entrypoint-no-live-v1`

## 이 문서의 목적

Owner가 지금 바로 실행할 수 있는 명령과, 각 명령이 실제로 무엇을 하는지를
간단명료하게 정리한다. 이 slice는 **no-live usability bridge**다 — 새 콘텐츠의
실제 생성/배포(live run)는 아직 하지 않는다.

## 지금 실행할 명령

```
node scripts/run-owner-daily-automation-entrypoint.mjs --status
node scripts/run-owner-daily-automation-entrypoint.mjs --dry-run
node scripts/run-owner-daily-automation-entrypoint.mjs --preflight
node scripts/run-owner-daily-automation-entrypoint.mjs --duplicate-guard-check
```

## 각 명령이 하는 일

| 명령 | 하는 일 | 하지 않는 일 |
|------|---------|-------------|
| `--status` | 필요한 스크립트/기본 fixture 존재 여부, 기존 게시 evidence, 다음 단계 안내를 JSON + 사람이 읽기 쉬운 요약으로 출력 | 아무 파일도 만들지 않고, 아무 프로세스도 실행하지 않음 |
| `--dry-run` | 기존 `run-local-money-shorts-from-render-manifest.mjs`를 기본 fixture(`scripts/fixtures/provider-candidate-render-manifest.visual-only.json`)로 실행해 로컬 mp4 dry-run 패킷을 생성 | 실제 업로드/API 호출 없음. TTS는 local_mock(핑크노이즈) — 진짜 음성 아님 |
| `--preflight` | 기존 `run-dual-platform-final-publish-orchestrator.mjs --preflight`를 실행해 Instagram/YouTube 게시 준비 상태 + duplicate guard 판정을 요약 | 실제 API 호출/Blob 접근 없음 |
| `--duplicate-guard-check` | preflight로 현재 콘텐츠가 duplicate guard에 의해 양쪽 플랫폼 모두 차단될 것을 **먼저 확인**한 뒤에만 `--live`를 1회 실행해 실제로 안전하게 차단되는지 확인 | duplicate block이 확정되지 않으면 `--live`를 아예 실행하지 않고 즉시 중단(fail-closed). exit 3(`BLOCKED_DUPLICATE_ALREADY_PUBLISHED`)을 게시 성공으로 취급하지 않음 |

`--dry-run`에 `--manifest <path>` / `--out-root <path>`를 추가로 줄 수 있다.
기본 out-root는 레포 밖(`C:\tmp\money-shorts-os\owner-daily-automation-entrypoint-v1`)이다.

## 왜 기존 영상이 재게시되지 않는가

`t1_lifestyle_inflation` / `v3_2` 콘텐츠는 이미 업로드가 완료된 상태다:

| 플랫폼 | 상태 | 식별자 |
|--------|------|--------|
| Instagram | 이미 완료 | media_id `17916511431199303` |
| YouTube | 이미 완료 | videoId `r9jhckdpC9w` / https://www.youtube.com/shorts/r9jhckdpC9w |

dual-platform orchestrator의 **duplicate publish guard**가 이 (contentId, platform,
version) 키를 credential resolution/실제 API 호출 **이전에** 차단한다. `--preflight`와
`--duplicate-guard-check`를 실행하면 이 차단이 실제로 작동하는지 직접 확인할 수 있다 —
실행 결과는 항상 "안전하게 차단됨"이어야 하며, 절대 "새로 게시됨"이 되어서는 안 된다.

## 새 콘텐츠 실제 생성/배포(live run)를 하려면

이 slice는 그 단계로 넘어가지 않는다. 실제 live run을 하려면 최소한 아래가 모두 필요하다:

1. **새 콘텐츠 unit** — 지금과 다른 `contentId`/`version`, 자체 metadata와 source 파일.
2. **Credential resolution 연결** — 현재 orchestrator의 credential 단계(gate 5)는
   이 slice에서 wiring되지 않은 fail-closed stub이다. 실제 Instagram/YouTube
   API 호출 전에 별도 승인된 slice에서 credential resolution을 연결해야 한다.
3. **명시적 Owner 승인** — `APPROVE_DUAL_PLATFORM_ARM`은 gate를 arm 상태로만
   만들 뿐, duplicate guard를 우회하거나 credential resolution을 연결하지 않는다.
   실제 end-to-end live run에는 별도의 명시적 승인이 필요하다.

## `.env.local`에 대해

이 entrypoint와 이 문서 어디에서도 `.env.local`이나 다른 secret 파일을 직접
읽지 않는다. `process.env` 값도 이 스크립트 어디에서도 접근하지 않는다.
실제 credential이 필요한 미래 작업은 승인된 no-log helper나 별도 절차를 통해서만
진행되어야 한다.

## 안전 설계 원칙 (이 entrypoint가 지키는 것)

- 기본 모드는 항상 no-live/fail-closed다.
- `--duplicate-guard-check`는 duplicate block이 preflight로 확정된 경우에만 `--live`를
  실행한다. 신규/비중복 콘텐츠에 대해서는 이 모드가 `--live`를 실행하지 않는다.
- 모든 자식 프로세스는 `spawnSync(process.execPath, [...], { shell: false })`로만 실행한다.
- `--dry-run`이 생성하는 모든 산출물은 레포 바깥의 명시적 out-root 경로에만 저장된다.
- exit 3(`BLOCKED_DUPLICATE_ALREADY_PUBLISHED`)은 항상 "안전 차단"으로만 보고되며,
  게시 성공으로 표시되지 않는다.

## 검증

```
node --check scripts/run-owner-daily-automation-entrypoint.mjs
node --check scripts/check-owner-daily-automation-entrypoint-static.mjs
node scripts/check-owner-daily-automation-entrypoint-static.mjs
node scripts/run-owner-daily-automation-entrypoint.mjs --status
node scripts/run-owner-daily-automation-entrypoint.mjs --preflight
node scripts/run-owner-daily-automation-entrypoint.mjs --duplicate-guard-check
```
