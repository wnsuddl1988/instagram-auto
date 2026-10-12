---
name: precoding-findings-2026-06-20
description: "2026-06-20 무비용 선행조사 1차 결과 인덱스 — refusal PoC, lint, 벤치마크."
metadata: 
  node_type: memory
  type: reference
  originSessionId: 2049481d-9bb9-47e2-9a2e-80e3f057f0be
---

2026-06-20 Owner 승인 단독 "선행코딩" 세션 결과. 앱 미반영, 외부호출 0회. 전체 상세는 `_ai/PRECODING_FINDINGS.md`.

핵심:
- **refusal-detector-v2 PoC**: `_ai/precoding_poc/refusal-detector-v2.mjs` + test. 거절 패턴 커버리지 8%→100%, 거절 사유 snippet 캡처. 단위 테스트 18/18 PASS. 반영 시 `_gemini-veo-core.mjs`/`_chatgpt-image-core.mjs` 적용 후보. → [[project-veo-refusal-root-cause]]
- **앱 lint 29 error / 104 warning**: tsc 0에러·next build 통과하지만 `npm run lint` 실패. render/route.ts(10E), ReelV2Studio(6E) 등. 자동수정 0개(전부 수동). CI 게이트 도입 시 차단.
- **eslint config 누락**: output/ 폴더가 lint 대상 → 노이즈. ignores 추가 권고.
- **render-v2 turbopack 경고**: `path.join(process.cwd(),...)` 동적경로, 배포 시 잠재 이슈.

2차 심층검증(영역 A~E):
- **유료가드 견고**: paidApiGuard 196 전수조합 fail-open 0. 4 provider 라우트 적용 빠짐없음.
- **check 스크립트 8개 회귀 PASS**: caption(61) emotional-axis(7) ending-dup(6) visual-anchor(31) image-prompt(25) imagen-safe(18) lh3/5/6.
- **⚠️ preflight hash 게이트 silent 우회**: `_ep003-jdm-veo-generate.mjs` checkPreflight가 prompt_checks/ref_checks 필드 부재 또는 hash 빈문자열이면 검사 skip(3건 실증). fail-closed 전환 권고.
- **⚠️ calcQualityScore brittle**: 38개 warning 문구 includes 강결합, 문구 바뀌면 게이트 무력화.
- **⚠️ CLAUDE.md stale**: 2026-05-30 living_tips 단계 멈춤, 실제는 ep003 3D 시트콤. 3D 시트콤/KNOWLEDGE 언급 0.

3차 심층검증(영역 G~K):
- **보안 우수**: 하드코딩키 0, git tracked 시크릿 0, 히스토리 시크릿 0, 로그 값비노출. ✅
- **Python 렌더러 안전**: shell=True/os.system/eval 0, subprocess 리스트인자, 경로 이스케이프 헬퍼. ✅
- **영상 정합성 완벽**: ep003 S1/S2/S3 전부 720×1280/24fps/240f/10s/AAC 동일, 키프레임 941×1672 동일. ✅
- **⚠️ 의존성 취약점 4건(1 high)**: `ws`<8.21.0 = openai@6.38.0 런타임 의존성(DoS). postcss/js-yaml/babel moderate~low. lockfile 승인 필요.
- **refusal PoC 적용경로 확정**: detectQuotaOrRefusal 8곳 중복(코어1+upload002 7). v2를 {type,pattern,snippet,text} 4필드로 보강→무손상. 코어1곳 고치면 ep003계열 자동적용.

Codex 상의 안건 11개(우선순위)는 `_ai/PRECODING_FINDINGS.md` §10. 반영·lockfile 승인은 Codex+Owner. → [[project-real-blocker-content-quality]]
