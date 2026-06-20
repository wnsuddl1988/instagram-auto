# PRECODING_FINDINGS — 선행 조사 결과 (Owner 승인 단독 세션)

**작성:** 2026-06-20
**세션 성격:** Owner 명시 승인 "선행코딩" — 앱 코드 **미반영**, 무비용(외부호출 0회) 조사·검증만.
**기록 원칙:** 핵심은 `memory/`, 상세는 본 파일. `app/` `lib/` `components/` `python/` 미변경.
**검증 범위:** 외부 API 호출 0회. tsc/eslint/next build/node 단위 시뮬레이션/웹검색만.

> **이 문서는 Codex 최종 상의용이다.** 반영 여부는 Codex+Owner가 결정한다. Claude는 반영하지 않았다.

---

## 0. 핵심 진단 요약

| 영역 | 상태 | 우선순위 |
|------|------|----------|
| TypeScript 타입체크 (`tsc --noEmit`) | ✅ 0 에러 | — |
| `next build` (turbopack) | ✅ 통과 (lint error 무시됨) | — |
| `npm run lint` (`eslint`) | ❌ **29 error / 104 warning** | 중 |
| **Veo refusal 감지 로직** | ❌ **커버리지 8% + 사유 미기록** | **최우선** |
| ESLint 대상에 `output/` 포함 | ⚠️ 설정 누락 (lint 노이즈) | 하 |
| render-v2 동적 경로 turbopack 경고 | ⚠️ 배포 시 잠재 이슈 | 하 |
| 콘텐츠 품질(후킹/감정연기) | ⚠️ 진짜 블로커 (벤치마크 확보) | 중 |

**가장 중요한 발견:** 이 프로젝트의 반복 실패는 "기술"이 아니라 **(a) Veo 거절 디버깅 불능, (b) 콘텐츠 체감 품질**이다. (a)는 이번 세션에서 PoC로 해결책 검증 완료.

---

## 1. [최우선] Veo refusal 감지 로직 — 검증 완료된 개선안

### 1-1. 문제 (이번 S3 4회 시도에서 실측)

`scripts/_gemini-veo-core.mjs` `detectQuotaOrRefusal()` (L133~140)의 약점:

1. **패턴 커버리지 8%** — refusal 패턴 6개만 하드코딩.
   일반 거절 문구 12개 샘플 중 **1개만 감지**. 나머지 11개는 미감지 → 420초 timeout까지 헛돌 위험.
   이번 S3가 "refusal"로 빨리 끝난 건 우연히 `만들 수 없`/`can't generate`가 포함됐기 때문.
2. **거절 사유 미기록** — 감지해도 `{ type, text }`의 text는 "매칭된 패턴"이지 "실제 거절 문장"이 아님.
   결과 JSON·로그에 안 남아서, S3 4회 내내 Gemini가 **왜** 거절했는지 한 번도 못 봤다.
3. **generating 신호 없음** — "정상 생성 중"과 "무반응"을 구분 못 해 폴링 루프가 비효율.

### 1-2. 개선안 PoC (검증 완료)

- 파일: `_ai/precoding_poc/refusal-detector-v2.mjs` + `.test.mjs`
- 변경 핵심:
  - 패턴을 정규식 배열로 확장 (한/영 거절 + 정책위반 + quota + generating)
  - `classifyVeoState(bodyText)` → `{ type, pattern, snippet }` 반환 (snippet = 실제 거절 문장 70자 컨텍스트)
  - `generating` 타입 분리
- **검증 결과: 단위 테스트 18/18 PASS** (커버리지 8% → 100%)
  - 실행: `node _ai/precoding_poc/refusal-detector-v2.test.mjs`

### 1-3. 반영 시 영향 범위 (Codex 판단용)

- `scripts/_gemini-veo-core.mjs` export 1개 교체 또는 신규 추가
- 호출처 `scripts/_ep003-jdm-veo-generate.mjs` L320~322 (`detectQuotaOrRefusal` → `classifyVeoState`)
- 결과 JSON에 `refusal_snippet` 필드 추가 → 다음 거절 시 사유 즉시 확인 가능
- **위험:** 낮음. 순수 함수, 외부 의존 없음, 기존 동작 상위호환. ChatGPT 이미지 코어(`_chatgpt-image-core.mjs`)에도 동일 패턴 존재 → 동시 적용 검토.

---

## 2. [중] 앱 코드 ESLint 29 error

`next build`는 통과하지만 `npm run lint`는 실패. CI/lint 게이트 도입 시 차단.

### 2-1. error 분포 (앱 코드만, output/archive 제외 시 28E)

| 파일 | E | 주요 룰 |
|------|---|---------|
| `app/api/render/route.ts` | 10 | prefer-const(5), no-explicit-any(5) |
| `components/ReelV2Studio.tsx` | 6 | — |
| `app/review/page.tsx` | 3 | — |
| `app/review/QaHistory.tsx` | 3 | set-state-in-effect |
| `app/api/generate-v2/route.ts` | 1 | prefer-const |
| 기타 5파일 | 각 1 | — |

- **자동수정 가능: 0개** (`--fix-dry-run` 확인). 전부 수동 수정 필요.
- 대부분 안전한 수정 (`let`→`const`, `any`→구체 타입). 단 `set-state-in-effect`는 React 동작 변경 위험 → 신중.

### 2-2. 권고
- render/route.ts, generate-v2/route.ts의 `prefer-const`·`any`만 우선 정리하면 19→soon error 감소.
- **앱 동작 변경 위험이 있으므로 Codex 검토 후 atomic 단위로.** 이번 세션 미반영.

---

## 3. [하] ESLint 설정 — output/ 폴더 미제외

- 루트에 flat config(`eslint.config.*`) 부재 → `eslint-config-next` 기본만 적용.
- `output/archive/legacy-experiments-*/scripts/*.mjs` 27개가 lint 대상에 포함 → warning 노이즈.
- 권고: `eslint.config.mjs`에 `ignores: ["output/**", "_ai/precoding_poc/**"]` 추가. 위험 없음.

---

## 4. [하] render-v2 동적 경로 turbopack 경고

- `next build` 중 `app/api/render-v2/route.ts`에서 `path.join(process.cwd(), ...)` 동적 인자가
  turbopack 정적 분석 경고 유발 (`next.config.ts` import trace).
- 현재 빌드는 통과하나, 향후 standalone/edge 배포 시 경로 해석 실패 가능.
- 권고: 경로를 정적 prefix로 고정하거나 `/*turbopackIgnore: true*/` 주석. Codex 판단.

---

## 5. [중] 콘텐츠 품질 — 웹 벤치마킹 (2026 기준)

이 프로젝트의 진짜 블로커. upload_002가 기술 PASS인데도 Owner 체감 QA로 3회 폐기됨.

### 5-1. 숏폼 후킹 (검색 결과)
- **첫 3초가 완주율의 80%를 좌우.** 강한 크리에이터는 intro retention 70%+.
- 4단 구조: **Hook → Problem → Solution → CTA** (living_tips 문서와 일치).
- **큐리오시티 스택킹**: 한 궁금증이 풀리기 전 다음 궁금증 제시 → 이탈 방지.
- 3초 단위로 "스킵 가능"하게 느껴지면 즉시 이탈 → 정적 샷 회피, 잦은 시각 변화.

### 5-2. Veo 프롬프트 (검색 결과 — 이번 발견과 일치!)
- **"한 클립 = 한 동작" 원칙**: Veo 물리엔진은 동시 다발 동작에 취약.
  여러 동작 필요 시 **클립을 분리**해 시퀀싱.
- → 이번 S3 refusal 근본 원인과 정확히 일치. "문 움직임 + Jun 표정" 동시 묘사 = 거절,
  "문 정적 + 표정만" = 통과. **우리 경험이 공식 가이드로 확증됨.**
- 사운드는 "as the door opens"식 타이밍 큐로 시각과 동기화.

### 5-3. 권고 (Codex 상의)
- **ep003 S4 및 향후 씬 프롬프트에 "한 클립 한 동작" 규칙을 게이트화** → refusal 예방.
- 숏폼 4단 구조 + 큐리오시티 스택킹을 living_tips/sitcom 양쪽 qualityBar에 명문화.

---

## 6. 2차 심층 검증 (영역 A~E, 전수)

ReAct + Tree-of-Thought로 진단 영역을 A~E로 분기해 빠짐없이 검증. 외부호출 0회.

### A. 자동화 코어 견고성 — ⚠️ 1건 잠재 우회 발견
- **카운터 무결성: PASS** — `recordSend()`가 증가 후 `>1` 즉시 abort, click보다 먼저 호출. 이중 전송 불가. dry-run은 카운터 도달 전 return. `ALLOW_VEO` 미설정 abort, 전송 직전 ref hash 재확인, output 존재 시 abort — 다단계 가드 견고.
- **⚠️ preflight hash 게이트 silent 우회 (실증)**: `scripts/_ep003-jdm-veo-generate.mjs` `checkPreflight()` (L167/L176).
  hash 일치 검사가 `if (pf.prompt_checks && pf.prompt_checks[SCENE_ID])` 안에 있어, **필드 부재 또는 hash 빈 문자열이면 검사를 통째 skip**한다.
  PoC `preflight-hash-gate.test.mjs`로 3개 우회 케이스 실증 (필드 누락 / .S3 누락 / 빈 hash).
  실무 위험도 **낮음**(현 preflight는 항상 채움). 다만 구버전/손상 JSON·타 scene에서 프롬프트 변경을 못 잡고 통과 가능.
  개선안: 필드 부재 시 **fail-closed(abort)**로 전환.

### B. 콘텐츠 생성 게이트 — ⚠️ 구조적 brittle coupling
- `calcQualityScore()`(generate-v2 route L77~)가 **38개 고유 warning.message 부분일치(`includes`)에 강결합**.
  `message.includes()` 호출 52회 / sanitizePlan push 메시지 ~60개. 문구-게이트 매칭이 수동 동기화.
- **위험**: sanitizePlan 메시지 문구를 한 글자 바꾸면 해당 게이트가 조용히 무력화. 이를 잡는 테스트 없음.
  함수가 export 안 되어 단위테스트 작성도 불가.
- 개선안(Codex 판단): warning 코드를 enum/상수로 추출 + 게이트가 상수 참조. 또는 calcQualityScore export 후 회귀 테스트.

### C. 유료호출 차단 가드 — ✅ 견고 (fail-open 0)
- `lib/paidApiGuard.ts` 진리표 **196개 전수 조합에서 fail-open 0건** (PoC `paid-api-guard.test.mjs`).
- 기본 차단(fail-safe), 마스터가 정확히 `true`가 아니면 무조건 차단, 세부 `false`는 마스터 true여도 차단.
- 라우트 적용 빠짐없음: generate-v2(openai-generate), render-v2(openai-tts/elevenlabs/imagen 전부). Imagen은 L663 가드→차단 시 fallback 동선.
- 미세 관찰(무해): `PAID_API_ENABLED=yes`/`1`은 차단됨(안전 방향). 사용자 오타 시 켜지지 않음 = 안전.

### D. 기존 check 스크립트 회귀 — ✅ 8개 전부 PASS
| 스크립트 | 결과 |
|----------|------|
| check-caption-sanitizer | 61/0 ✅ |
| check-emotional-axis | 7/0 ✅ |
| check-ending-dup | 6/0 ✅ |
| check-visual-anchor | 31/0 ✅ |
| check-image-prompt-sanitizer | 25/0 ✅ |
| check-imagen-safe-prompt | 18/0 ✅ |
| check-lh3/lh5/lh6-boost | 통과(lh6 ⚠️2건은 의도된 Gate M 통과) ✅ |
- 검증기 인프라 건강. 회귀 없음.

### E. 문서-코드 정합성 — ⚠️ CLAUDE.md 약 3주 stale
- CLAUDE.md 참조 파일 22개 **전부 존재** (죽은 참조 0) ✅.
- **⚠️ CLAUDE.md "현재 상태 스냅샷"이 2026-05-30 living_tips(LH-9/LH-10) 단계에 멈춤.**
  실제 최근 작업(git log, _ai)은 **ep003 자동문면접 3D 시트콤**. 메모리는 "2D 폐기→3D 시트콤 전환" 기록.
  CLAUDE.md에 `3D 시트콤`/`KNOWLEDGE.md 제작 표준` 언급 **0건**.
- Claude/Codex가 매 세션 로드하는 핵심 문서라 정합성 갭이 실질적. **갱신 결정은 Codex+Owner** (프로젝트 설정급이라 미반영).

---

## 7. Codex 상의 안건 (우선순위 순)

| # | 안건 | 위험 | 비용 | 근거 |
|---|------|------|------|------|
| 1 | **refusal-detector-v2 반영** (Veo/이미지 코어) | 저 | 0 | PoC 18/18, 거절 사유 가시화 |
| 2 | **CLAUDE.md 스냅샷 3D 시트콤으로 현행화** | 저 | 0 | E: 약 3주 stale, 세션마다 로드 |
| 3 | **preflight hash 게이트 fail-closed 전환** | 저 | 0 | A: 3개 우회 실증 |
| 4 | **Veo "한 클립 한 동작" 게이트화** | 저 | 0 | 5-2 + refusal 근본원인 |
| 5 | **calcQualityScore 게이트 brittle 해소** | 중 | 0 | B: 문구 드리프트 시 무력화 |
| 6 | **앱 lint 29 error 정리** (const/any 우선) | 중 | 0 | 2: CI 게이트 도입 시 차단 |
| 7 | **eslint.config로 output/ 제외** | 무 | 0 | 3: lint 노이즈 |
| 8 | **render-v2 동적경로 turbopack 경고 처리** | 저 | 0 | 4: 배포 전 |

**반영 결정은 전부 Codex+Owner.** Claude는 어느 것도 앱에 반영하지 않았다.

---

## 8. 이번 세션 산출물 (앱 미반영)

| 파일 | 성격 | 결과 |
|------|------|------|
| `_ai/PRECODING_FINDINGS.md` | 종합 보고서 | — |
| `_ai/precoding_poc/refusal-detector-v2.mjs` + `.test.mjs` | 거절 감지 개선 PoC | 18/18 PASS |
| `_ai/precoding_poc/paid-api-guard.test.mjs` | 유료가드 진리표 검증 | 196조합 fail-open 0 |
| `_ai/precoding_poc/preflight-hash-gate.test.mjs` | hash 게이트 우회 실증 | 3건 우회 발견 |
| memory: `project_veo_refusal_root_cause` / `project_real_blocker_content_quality` / `precoding_findings_2026_06_20` | 영속 메모리 | — |

**전 과정: 외부 API 호출 0회. 앱/스크립트(`app/` `lib/` `components/` `python/` `scripts/`) 0줄 변경. git tracked 코드 미변경.**
산출물은 전부 `_ai/precoding_poc/`(gitignore 대상 위치 아님 — Codex 검토 후 정리/이동 결정 필요)와 글로벌 메모리에만 존재.

---

## 9. 3차 심층 검증 (영역 G~K, 2026-06-20 추가)

추가 5개 영역을 끝까지 검증. 외부호출 0회.

### G. Python 렌더러 — ✅ 안전
- `python/render.py`(433L) + `render_v2.py`(648L) 정적분석.
- **`shell=True` 0건, `os.system` 0건, `eval/exec` 0건.** subprocess는 전부 리스트 인자(`["ffmpeg", ...]`).
- `render_v2.py`에 필터 경로 이스케이프 헬퍼(`_escape_filter_path`, L309) 존재 — Windows 콜론/백슬래시 처리.
- 자막은 별도 subtitle 파일 방식(drawtext 텍스트 인젝션 면 작음).
- ⚠️ 관찰: `render.py`는 구버전, `render_v2.py`와 기능 중복 — 죽은 코드 가능성(정리 후보, Codex 판단).

### H. 산출물 영상 품질 — ✅ 정합성 완벽, 회귀 0
- ep003 S1/S2/S3 영상 3개 **완전 동일 규격**: 720×1280, 24fps, H.264, 정확히 240프레임/10.0초, AAC 48kHz 스테레오.
  → concat 시 재인코딩 없이 stream copy 가능.
- 4씬 키프레임(s1~s4) 전부 **941×1672 동일** (9:16). 캐릭터/배경 연속성 기반 정합성 확보.
- S3가 10초 출력(계약 6초 의도)은 Veo 기본 출력이며 편집 trim 단계 존재 → 정상.

### I. 보안/시크릿 — ✅ 우수, 문제 0
- **하드코딩 API 키 0건** (sk-/AIza/Bearer/xi-api-key 패턴 스캔).
- **git tracked 시크릿 파일 0건** (.env/key/pem/token/credential).
- **git 히스토리 전체에 .env/secret 추가 이력 0건.**
- `.gitignore`: .env/.env.local/.env*/node_modules/output 전부 무시 확인(`git check-ignore` 실측).
- 모든 로그는 키 **존재 여부만** 출력 + "값 비노출" 명시. `env-safe.mjs`는 시크릿형 키 설정 능동 차단(L117).

### J. 의존성 취약점 — ⚠️ 4건 (1 high)
| 심각도 | 패키지 | 출처 | 내용 |
|--------|--------|------|------|
| 🔴 high | `ws` <8.21.0 | **openai@6.38.0** (런타임!) | WebSocket 메모리 고갈 DoS |
| 🟡 moderate | `postcss` <8.5.10 | next>postcss | CSS XSS |
| 🟡 moderate | `js-yaml` <4.2.0 | (build) | DoS |
| 🟢 low | `@babel/core` | (build) | 파일 읽기 |
- `ws`는 `pnpm why` 결과 **openai SDK 런타임 의존성**(playwright 아님). 단 이 앱은 fetch 기반 TTS/chat이라 ws 실노출면 제한적.
- 전부 transitive → lockfile bump으로 해결. **dependency/lockfile은 명시 승인 카테고리라 미반영.** Codex 안건.

### K. PoC 적용가능성 (코드레벨) — ✅ 적용 경로 확정
- **`detectQuotaOrRefusal` 정의가 8곳 중복**: 코어 1 + upload002 s1~s5 generate/regen 7개 로컬 복붙.
- 호출부 반환값 사용 분석:
  - 대부분 `.type`만 사용 → v2와 **완전 호환**.
  - 단 `_gemini-veo-core.mjs:150`만 `quota.text` 사용 → v2가 `text` 미반환 시 깨짐.
- **조치**: PoC v2를 `{type, pattern, snippet, text}` 4필드 반환으로 보강(text=snippet). 재테스트 18/18 유지. → **무손상 적용 가능.**
- **적용 경로**: 코어 1곳 교체 시 ep003 계열·`_gemini-veo-preflight`·`_upload002-s5-final`은 import 경유 자동 적용. upload002 s1~s5는 로컬 복붙이라 별도(단 upload002는 폐기 에피소드라 우선순위 낮음).

---

## 10. Codex 상의 안건 (최종 통합, 우선순위 순)

| # | 안건 | 위험 | 비용 | 승인필요 | 근거 |
|---|------|------|------|----------|------|
| 1 | **refusal-detector-v2 코어 반영** (4필드 하위호환) | 저 | 0 | 일반 | §1,K: PoC 18/18, 무손상 경로 확정 |
| 2 | **`ws` high 취약점 해소** (openai SDK 런타임) | 중 | 0 | **lockfile** | J: 유일한 high, 런타임 의존성 |
| 3 | **CLAUDE.md 스냅샷 3D 시트콤 현행화** | 저 | 0 | 일반 | E: 약 3주 stale |
| 4 | **preflight hash 게이트 fail-closed** | 저 | 0 | 일반 | A: 3건 우회 실증 |
| 5 | **Veo "한 클립 한 동작" 게이트화** | 저 | 0 | 일반 | 5-2: refusal 근본원인 |
| 6 | **calcQualityScore brittle 해소** | 중 | 0 | 일반 | B: 38문구 강결합 |
| 7 | **앱 lint 29 error 정리** | 중 | 0 | 일반 | 2: CI 게이트 |
| 8 | **postcss/js-yaml/babel 취약점** | 저 | 0 | **lockfile** | J |
| 9 | **eslint.config output 제외** | 무 | 0 | 일반 | 3 |
| 10 | **render.py 죽은코드 정리** | 저 | 0 | 일반 | G |
| 11 | **render-v2 turbopack 경고** | 저 | 0 | 일반 | 4 |

**전부 미반영. 반영·승인은 Codex+Owner.** dependency 항목(#2,#8)은 lockfile 변경 승인 필수.

### 검증으로 "문제 없음" 확정된 영역 (반영 불필요)
- 유료호출 가드(fail-open 0/196), check 스크립트 8개 회귀, Python 렌더러 안전, 보안/시크릿, 영상·키프레임 규격 정합성, 카운터 무결성.
