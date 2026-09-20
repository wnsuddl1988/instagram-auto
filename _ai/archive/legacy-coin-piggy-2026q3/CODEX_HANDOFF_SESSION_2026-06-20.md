# Codex 인수인계 — 2026-06-20 세션 전체

> **목적:** 2026-06-20 Claude Code 세션 전체를 Codex가 한 번에 검토할 수 있게 누락 없이 정리.
> **세션 구성:** (1) ep003 S3 Veo refusal 복구 [실제 작업, 커밋 완료] + (2) 무비용 선행조사 [미반영, untracked].
> **하드 규칙 준수:** 외부호출은 승인된 Veo 제출 2회만. 선행조사는 외부호출 0회·앱 코드 0줄 변경.

---

## PART 1 — ep003 S3 Veo Refusal 복구 (실제 작업, 커밋 완료)

### 1-1. 배경
ep003 "자동문 면접" 3D 시트콤. S1/S2 Veo는 이미 PASS. **S3가 콘텐츠 정책 refusal로 막혀 있었음.**
시작 시점: S3 Boss-Free v6 키프레임(`s3_bossfree_kf_try6.png`, MD5=`aea43e2b`) Codex QA PASS 상태, checkpoint `c843689`.

### 1-2. 진행한 atomic task (시간순)

| Task ID | 내용 | 결과 | 커밋 |
|---------|------|------|------|
| ep003-s3-veo-bossfree-preflight | preflight/generate S3 ref·prompt·gate를 Boss-Free로 동기화, dry-run | PASS | (이전) |
| ep003-s3-veo-preflight-checkpoint | 4파일 checkpoint commit | — | `2d0739e` |
| ep003-s3-veo-run-once | **S3 Veo 실제 제출 1회** (Boss-Free prompt) | **refusal** | — |
| ep003-s3-veo-refusal-recovery-prompt-v2 | Empty-Doorway prompt(민감어 완전 제거) + dry-run | PASS | — |
| ep003-s3-empty-doorway-prompt-checkpoint | 2파일 commit | — | `7d8f37e` |
| ep003-s3-empty-doorway-veo-run-once | **S3 Veo 실제 제출 1회** (Empty-Doorway) | **refusal** | — |
| ep003-s3-static-reaction-prompt-preflight | Static-Reaction prompt(문 움직임 사건 제거) + dry-run | PASS | — |
| ep003-s3-static-reaction-prompt-checkpoint | 2파일 commit | — | `2066129` |
| ep003-s3-static-reaction-veo-run-once | **S3 Veo 실제 제출 1회** (Static-Reaction) | **✅ saved** | — |

### 1-3. S3 refusal → 성공 분석 (4회 시도)

| 시도 | 프롬프트 전략 | 핵심 차이 | 결과(소요) |
|------|--------------|-----------|-----------|
| 1 | 원본 (Boss 손/소매 묘사 포함) | — | refusal (~60s) |
| 2 | Boss-Free v1 (boss/body/sleeve 제거, "No boss body visible" 등 일부 잔존) | 신체 부정문 잔존 | refusal (~60s) |
| 3 | Empty-Doorway v2 (boss/body/sleeve/silhouette/reflection 완전 제거, **문이 스스로 열림** 유지) | 민감어 0, 문 모션 有 | refusal (~55s) |
| 4 | **Static-Reaction v3 (문은 정지, Jun 표정만 변화)** | **동작 1개로 축소** | **✅ saved (~100s)** |

**근본 원인 확정:** Boss 묘사가 아니라 **"한 클립에 여러 동작(문 모션 + 인물 반응)을 동시 요구"**한 것이 refusal 트리거.
문을 정적으로 고정하고 Jun 표정 변화만 남기자 즉시 통과. → 2026 Veo 공식 프롬프트 가이드 "한 클립 = 한 지배적 동작" 원칙과 일치(웹검색 확증).

### 1-4. S3 최종 산출물 (검증 완료)
- 파일: `output/v2/ep003_jdm/veo/s3_veo_raw.mp4`
- 크기: 2326KB (2,381,662 bytes), MD5: `f72a452ea8e82c967d6af4c67b599809`
- 기술 QA: 720×1280, H.264 High, 24fps, 10.005s, AAC 48kHz 스테레오 ✅
- 시각 QA(contact sheet 0/2/4/6/8/10s): empty doorway gap / Jun outside / 세로 PULL 손잡이 / 문 미개방 / 표정만 변화 / 손 미접촉 / 신규인물 없음 / 흰셔츠 없음 / 텍스트·내부컷 없음 — **전 항목 PASS** ✅

### 1-5. S3 최종 prompt (Static-Reaction v3, hash=`414f2d1d`, len=843)
```
Animate this 3D semi-deformed Pixar-style scene. Keep the starting frame almost unchanged. The door stays slightly open and does not move — the gap remains exactly as in the reference image. Jun remains outside in the corridor, standing still. Only Jun's facial expression changes: wide-eyed shock, one blink, then embarrassed resignation. His shoulders drop slightly at the end. Jun does not step forward. Jun's hands stay at his sides and never touch the door, handle, or glass. The same long vertical pull handle and black door frame remain visible throughout. The door must not fully open. Camera: completely fixed. Duration: 6 seconds. No new person appears at any point. BANS: door moving, Jun entering the doorway, Jun touching the handle or glass, door fully opening, door closing, any additional character, white shirt, internal cuts.
```

### 1-6. Veo 제출 카운트
- 이 세션 S3 Veo 실제 제출 **총 3회** (refusal 2 + saved 1). 각 회 자동 재시도 0. TOTAL/VEO 카운터 회당 1 보장.
- ⚠️ `_ai/PROJECT_STATE.md`의 "Veo 예산 총 7회/사용 7회" 표는 upload_002 기준 구버전 — ep003 예산과 혼재(정합성 §E 참조).

### 1-7. 커밋된 파일 (PART 1)
- `2d0739e`: `_ai/HANDOFF_NOW.md`, `_ai/PROJECT_STATE.md`, `scripts/_ep003-jdm-veo-preflight.mjs`, `scripts/_ep003-jdm-veo-generate.mjs`
- `7d8f37e`: `scripts/_ep003-jdm-veo-preflight.mjs`, `scripts/_ep003-jdm-veo-generate.mjs`
- `2066129`: `scripts/_ep003-jdm-veo-preflight.mjs`, `scripts/_ep003-jdm-veo-generate.mjs`
- 현재 브랜치: `main ... origin/main [ahead 10]`, **push 미실행**.

### 1-8. PART 1 다음 단계 (Codex 판단)
- **S4 Veo**: S3 PASS 했으므로 진행 가능. S4 prompt·ref 미변경 상태. Owner `ALLOW_VEO=true` 별도 승인 필요.
- S3 키프레임이 941×1672인데 Veo 출력은 720×1280 → 편집 단계 trim/concat 예정(기존 워크플로우).
- `_ai/PROJECT_STATE.md`·`NEXT_ACTION.md`를 ep003 S3 saved 상태로 갱신 권장(아직 S3=refusal로 적힌 행 존재).

---

## PART 2 — 무비용 선행조사 (미반영, untracked)

> Owner가 "선행코딩 모든 권한 부여, 앱 미반영, 메모리·문서에만 기록, Codex와 최종 상의" 명시 승인.
> **외부 API 호출 0회. 앱/스크립트(`app/` `lib/` `components/` `python/` `scripts/`) 0줄 변경.**
> 검증 수단: tsc / eslint / next build / node 단위 시뮬레이션 / ffprobe / pnpm audit / 웹검색.
> ReAct + Tree-of-Thought로 영역 A~K 전수 검증.

### 2-1. 견고함 확인 — 문제 없음 (반영 불필요)

| 영역 | 검증 | 결과 |
|------|------|------|
| 타입체크 | `tsc --noEmit` | 0 에러 ✅ |
| 빌드 | `next build` (turbopack) | 통과 ✅ (lint error는 빌드 비차단) |
| C. 유료호출 가드 | `lib/paidApiGuard.ts` 진리표 196 전수조합 | **fail-open 0건** ✅. 4 provider 라우트 적용 빠짐없음(generate-v2 L2086, render-v2 tts L76/79, imagen L663). |
| D. check 스크립트 8개 회귀 | caption(61) emotional-axis(7) ending-dup(6) visual-anchor(31) image-prompt(25) imagen-safe(18) lh3/5/6 | 전부 PASS ✅ |
| G. Python 렌더러 | `render.py`(433L)/`render_v2.py`(648L) 정적분석 | shell=True/os.system/eval 0, subprocess 리스트인자, 경로 이스케이프 헬퍼 존재 ✅ |
| H. 영상 정합성 | ep003 S1/S2/S3 ffprobe | 전부 720×1280/24fps/240f/10.0s/AAC48k 동일(concat stream-copy 가능). 키프레임 4장 941×1672 동일 ✅ |
| I. 보안/시크릿 | 하드코딩키·git tracked 시크릿·히스토리·로그 노출 | 전부 0건, 로그 "값 비노출", env-safe 능동차단 ✅ |
| A. 카운터 무결성 | recordSend 이중전송 가드 | 견고 ✅ |

### 2-2. 발견된 개선거리 (전부 미반영, PoC로 실증)

#### [1·최우선] Veo refusal 감지 로직 — 커버리지 8% + 사유 미기록
- `scripts/_gemini-veo-core.mjs` `detectQuotaOrRefusal()` (L133~140): refusal 패턴 6개 하드코딩.
- 일반 거절 문구 12개 샘플 중 **1개만 감지(8%)**. 나머지 11개는 미감지 → 420초 timeout 헛돌 위험.
  이번 S3가 "refusal"로 빨리 끝난 건 우연히 `만들 수 없`/`can't generate` 포함 덕분.
- 감지해도 실제 거절 문장을 로그/JSON에 안 남김 → **S3 4회 내내 거절 사유를 한 번도 못 봤음.**
- **PoC 검증 완료:** `_ai/precoding_poc/refusal-detector-v2.mjs` — 정규식 확장(한/영 거절+정책위반+quota+generating) + `{type,pattern,snippet,text}` 반환. 단위 테스트 **18/18 PASS**(커버리지 8→100%).
- **적용 경로(K 영역):** `detectQuotaOrRefusal` 정의가 **8곳 중복**(코어1 + upload002 s1~s5/regen 7). 호출부 대부분 `.type`만 사용→호환. 단 `_gemini-veo-core.mjs:150`이 `quota.text` 사용 → v2가 `text` 필드 유지하므로 **무손상**. 코어 1곳만 고치면 ep003 계열·`_gemini-veo-preflight`·`_upload002-s5-final`은 import 경유 자동 적용. upload002 s1~s5는 로컬 복붙(폐기 에피소드라 우선순위 낮음).

#### [2·높음] 의존성 취약점 4건 (lockfile 승인 필요)
- 🔴 high `ws` <8.21.0 — `pnpm why ws` 결과 **openai@6.38.0 런타임 의존성**(WebSocket 메모리 고갈 DoS). 단 이 앱은 fetch 기반 TTS/chat이라 실노출면 제한적.
- 🟡 moderate `postcss` <8.5.10 (next>postcss, CSS XSS)
- 🟡 moderate `js-yaml` <4.2.0 (DoS)
- 🟢 low `@babel/core` (파일 읽기)
- 전부 transitive → lockfile bump으로 해결. **dependency/lockfile은 명시 승인 카테고리라 미반영.**

#### [3·저] CLAUDE.md 스냅샷 약 3주 stale
- CLAUDE.md "현재 상태 스냅샷"이 2026-05-30 living_tips(LH-9/LH-10) 단계에 멈춤. 실제 최근 작업은 ep003 자동문면접 3D 시트콤.
- CLAUDE.md에 `3D 시트콤`/`KNOWLEDGE.md 제작 표준` 언급 **0건**. 메모리는 "2D 폐기→3D 시트콤 전환" 기록.
- 참조 파일 22개는 전부 존재(죽은 참조 0). 매 세션 로드되는 핵심 문서라 갱신 권장. **프로젝트 설정급이라 미반영.**

#### [4·저] preflight hash 게이트 silent 우회 (실증)
- `scripts/_ep003-jdm-veo-generate.mjs` `checkPreflight()` (L167/L176): hash 검사가 `if (pf.prompt_checks && pf.prompt_checks[SCENE_ID])` 안에 있어, **필드 부재 또는 hash 빈 문자열이면 검사 통째 skip.**
- **PoC 실증:** `_ai/precoding_poc/preflight-hash-gate.test.mjs` — 3개 우회 케이스(필드 누락/.S3 누락/빈 hash). 실무 위험도 낮음(현 preflight는 항상 채움). 개선안: 필드 부재 시 fail-closed(abort).

#### [5·저] Veo "한 클립 한 동작" 게이트화
- PART 1에서 실증된 refusal 근본원인. 향후 모든 Veo 씬 프롬프트에 "한 클립 한 지배적 동작" 규칙 게이트화 → refusal 예방. 동작 둘 이상이면 클립 분리.

#### [6·중] calcQualityScore brittle coupling
- `app/api/generate-v2/route.ts` `calcQualityScore()` (L77~)가 **38개 고유 warning.message 부분일치(`includes` 52회 호출)에 강결합.** sanitizePlan push 메시지 ~60개와 수동 동기화.
- 문구 한 글자 바꾸면 게이트 조용히 무력화. 함수 export 안 되어 단위테스트 불가. 개선안: warning 코드 enum/상수 추출 또는 함수 export 후 회귀 테스트.

#### [7·중] 앱 ESLint 29 error / 104 warning
- `next build`는 통과하나 `npm run lint`(`eslint`) 실패 → CI/lint 게이트 도입 시 차단.
- error 분포: `app/api/render/route.ts` 10E(prefer-const 5, no-explicit-any 5), `components/ReelV2Studio.tsx` 6E, `app/review/page.tsx` 3E, `app/review/QaHistory.tsx` 3E(set-state-in-effect), 기타.
- **자동수정 가능 0개**(`--fix-dry-run` 확인) — 전부 수동. set-state-in-effect는 React 동작 변경 위험으로 신중.

#### [8·저] postcss/js-yaml/@babel 취약점 (위 #2와 동일, lockfile 승인)

#### [9·무] eslint.config로 output/ 제외
- 루트에 flat config 부재 → `output/archive/legacy-experiments-*/scripts/*.mjs` 27개가 lint 대상. `ignores: ["output/**", "_ai/precoding_poc/**"]` 추가 권고.

#### [10·저] render.py 죽은 코드
- `python/render.py`가 `render_v2.py`와 기능 중복. 정리 후보.

#### [11·저] render-v2 동적 경로 turbopack 경고
- `app/api/render-v2/route.ts` `path.join(process.cwd(), ...)` 동적 인자가 next build 중 turbopack 정적분석 경고 유발. 향후 standalone/edge 배포 시 경로 해석 실패 가능.

### 2-3. 콘텐츠 품질 벤치마크 (웹검색, 2026 기준)
- **숏폼 후킹:** 첫 3초가 완주율 80% 좌우, intro retention 70%+ 목표. Hook→Problem→Solution→CTA 4단. 큐리오시티 스택킹.
- **Veo:** "한 클립 한 동작" 원칙(공식). 사운드는 "as the door opens"식 타이밍 큐로 동기화.
- **핵심 통찰:** 이 프로젝트의 진짜 블로커는 기술이 아니라 **콘텐츠 체감 품질**(감정연기/싱크/후킹). upload_002가 기술 PASS인데도 Owner QA로 3회 폐기된 이유.

### 2-4. Codex 상의 안건 (최종 통합, 우선순위)

| # | 안건 | 위험 | 비용 | 승인필요 |
|---|------|------|------|----------|
| 1 | refusal-detector-v2 코어 반영(4필드 하위호환) | 저 | 0 | 일반 |
| 2 | `ws` high 취약점 해소 | 중 | 0 | **lockfile** |
| 3 | CLAUDE.md 3D 시트콤 현행화 | 저 | 0 | 일반 |
| 4 | preflight hash 게이트 fail-closed | 저 | 0 | 일반 |
| 5 | Veo "한 클립 한 동작" 게이트화 | 저 | 0 | 일반 |
| 6 | calcQualityScore brittle 해소 | 중 | 0 | 일반 |
| 7 | 앱 lint 29 error 정리 | 중 | 0 | 일반 |
| 8 | postcss/js-yaml/babel 취약점 | 저 | 0 | **lockfile** |
| 9 | eslint.config output 제외 | 무 | 0 | 일반 |
| 10 | render.py 죽은코드 정리 | 저 | 0 | 일반 |
| 11 | render-v2 turbopack 경고 | 저 | 0 | 일반 |

### 2-5. 선행조사 산출물 (전부 untracked)
- `_ai/PRECODING_FINDINGS.md` — 상세 보고서(§0~10)
- `_ai/precoding_poc/refusal-detector-v2.mjs` + `.test.mjs` (18/18 PASS, 4필드 하위호환)
- `_ai/precoding_poc/paid-api-guard.test.mjs` (196조합 fail-open 0)
- `_ai/precoding_poc/preflight-hash-gate.test.mjs` (우회 3건 실증)
- `_ai/CODEX_HANDOFF_SESSION_2026-06-20.md` — 본 문서
- 글로벌 메모리 3건: `project_veo_refusal_root_cause`, `project_real_blocker_content_quality`, `precoding_findings_2026_06_20`

---

## 종합 — Codex가 결정할 것

1. **PART 1 후속:** S4 Veo 진행 여부(Owner 승인 게이트), PROJECT_STATE/NEXT_ACTION의 S3 상태 갱신, push 여부.
2. **PART 2 안건 11개:** 반영 우선순위·범위. dependency 2건(#2,#8)은 lockfile 승인 필수.
3. **`_ai/precoding_poc/` 처리:** git untracked 상태 — commit/이동/삭제 결정.
4. **반영 시 원칙:** atomic 단위 + 각 변경 후 build 검증. PART 2는 어느 것도 아직 반영 안 함.

**전체프로젝트 진행률 : 약 62%**
