---
name: project-veo-refusal-root-cause
description: "ep003 S3 Veo 거절 근본 원인 — \"한 클립 한 동작\" 위반. 문 움직임 사건 제거하니 통과."
metadata: 
  node_type: memory
  type: project
  originSessionId: 2049481d-9bb9-47e2-9a2e-80e3f057f0be
---

ep003 자동문면접 S3 Veo가 4회 시도 끝에 통과(2026-06-20). 근본 원인은 Boss 신체 묘사가 아니라 **한 클립에 여러 동작을 동시에 요구한 것**이었다.

- 시도1(Boss 손 포함)/시도2(Boss-Free)/시도3(Empty-Doorway, "문이 스스로 열림") → 전부 refusal (55~60s).
- 시도4(Static-Reaction): **"문은 움직이지 않고 Jun의 표정만 변한다"**로 바꾸자 ~100s에 saved. `s3_veo_raw.mp4`, 720×1280/24fps/10s, MD5=f72a452e.

**Why:** Veo 물리엔진은 동시 다발 동작(문 모션 + 인물 표정)에 취약. 이는 우연이 아니라 Google Veo 공식 프롬프트 가이드의 "한 클립 = 한 동작, 여러 동작은 클립 분리" 원칙과 일치(2026-06 웹검색 확증).

**How to apply:** 향후 모든 Veo 씬 프롬프트는 "한 클립 한 지배적 동작" 규칙을 게이트화. 동작이 둘 이상이면 클립을 나눠 시퀀싱. refusal 발생 시 프롬프트 표현 정화보다 "동작 수 축소"를 먼저 시도. 상세: `_ai/PRECODING_FINDINGS.md` §5-2. 관련 [[project-3d-sitcom-direction]].
