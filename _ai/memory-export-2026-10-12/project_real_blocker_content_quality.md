---
name: project-real-blocker-content-quality
description: 이 프로젝트의 진짜 블로커는 기술이 아니라 콘텐츠 체감 품질(후킹/감정연기/영상-대사 싱크).
metadata: 
  node_type: memory
  type: project
  originSessionId: 2049481d-9bb9-47e2-9a2e-80e3f057f0be
---

instagram-auto의 반복 실패는 기술 결함이 아니다. tsc 0에러, next build 통과, 자동화 preflight 안정. 그런데도 upload_002는 기술 PASS인 채로 Owner 체감 QA에서 3회(final_v1/v2/v3) 폐기됐다.

**진짜 블로커 2개:**
1. **콘텐츠 체감 품질** — 감정 연기 부재(평온한 낭독), 영상-대사 싱크 약함, 무대사 구간 지루함, 펀치라인 전달 실패. `_ai/QUALITY_GATE.md`의 5계약(Event/Dialogue/Emotion/Sound/Stop-Loss)이 이 교훈의 산물.
2. **Veo 거절 디버깅 불능** — 거절 사유를 한 번도 못 봤음(감지 로직이 사유 미기록). → 2026-06-20 PoC로 해결책 검증(`refusal-detector-v2`, 18/18 PASS).

**Why:** "기술적으로 만들어졌다"는 PASS가 아니다(QUALITY_GATE 명문). 무비용 선행조사의 가치는 코드 버그 잡기보다 이 두 블로커를 푸는 데 있다.

**How to apply:** 새 작업 선택 시 코드 리팩터보다 (a) refusal 사유 가시화, (b) 숏폼 후킹·감정연기 품질 게이트를 우선. 숏폼 벤치마크(2026): 첫 3초가 완주율 80% 좌우, Hook→Problem→Solution→CTA, 큐리오시티 스택킹. 상세 [[project-veo-refusal-root-cause]], `_ai/PRECODING_FINDINGS.md`.
