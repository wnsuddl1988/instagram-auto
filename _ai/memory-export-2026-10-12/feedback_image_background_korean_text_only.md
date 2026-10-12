---
name: feedback-image-prompt-injected-rules
description: "이미지 생성 buildPrompt()에 코드로 강제 주입되는 공통 규칙 2개 — ①배경 글자 전부 한국어(KOREAN_TEXT_ONLY_RULE) ②Veo 영상 안전 3원칙(VEO_SAFE_IMAGE_RULE: 작은글씨금지·소품감싸쥠·빈면금지). 둘 다 제거하거나 우회하지 말 것"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 0616c897-fe63-4f4b-b75e-04be8bd972c3
  modified: 2026-09-21T12:14:25.960Z
---

`scripts/probe-character-consistency-chatgpt-v1.mjs`의 `buildPrompt()`에는
**공통 규칙 상수 2개가 코드로 주입**되어 있다. 둘 다 제거하거나 이 함수를 우회하지
말 것. 아래 §1(한국어 강제)과 §2(Veo 안전)로 나뉜다.

## §2. VEO_SAFE_IMAGE_RULE — 영상 안전 3원칙 (2026-09-21 신설, 가장 중요)

이미지는 그대로 Veo에 들어가 영상이 된다. 87씬 전수조사 결과 **Veo 실패는 영상
프롬프트로 막을 수 없고 이미지 생성 단계에서만 막을 수 있다**는 것이 확정되어,
다음 3원칙을 `VEO_SAFE_IMAGE_RULE` 상수로 전 씬에 강제 주입한다:

1. **글자는 크고 짧게만.** 작은 설명문·부연 캡션·다항목 목록(메뉴 리스트, 표 항목,
   그래프 축 라벨, 보드 하단 안내문)은 이미지에 아예 넣지 않는다. 87씬 중 큰 글자는
   실패 0건, 화면 높이 ~1.5% 이하 소자만 깨졌다.
2. **소품은 감싸 쥐거나 바닥에 세운다.** 손끝으로 옆면만 받치거나 손바닥에 얹은
   불안정한 자세로 그리지 않는다(감싸쥠 11/11 유지 vs 얹기+팔동작 4/5 사고).
3. **크고 빈 면을 남기지 않는다.** Veo가 빈 면을 없던 텍스트로 채운다("PIXAR",
   "CREDIT SSOORE", 가짜 전화번호 "033-990-5000" 등 — 사실과 다른 정보라 게시 불가).

**Why:** 금박사 6편에서 10개 중 5개가 재생성 대상이 되는 사고(2026-09-21). Owner가
"10개 중 5개가 오류라는 게 별거 아닌 것 같냐", "다시는 실수 없도록 절대규칙으로
등록하라"고 강하게 지시. 조사 결과 10편에서도 이미 10개 씬 전부 배경 텍스트가
깨져 있었고(기존 기록은 "8·9·10만"으로 과소 보고), FROZEN PROP 등 프롬프트
강화는 전부 실패한 이력이 있었다.

**How to apply:** 편별 `imageBrief`를 쓸 때부터 이 3원칙에 맞게 쓴다 — `imageBrief`에
"작은 글씨로 설명 넣기", "폰을 손끝으로 받치기" 같은 지시를 쓰면 주입된 규칙과
충돌해 무력화된다. 영상 프롬프트 쪽에는 이 문제 방어 문구를 더 늘리지 말 것(효과
없음이 확인됨). 상세 근거와 실행 규칙:
[[project_veo_text_heavy_background_root_cause]], `_ai/CURRENT_STANDARDS.md` §0
"★ 영상 생성 절대규칙" 규칙 1~5.

## §1. KOREAN_TEXT_ONLY_RULE — 배경 글자 한국어 강제 (2026-09-21 기존)

`scripts/probe-character-consistency-chatgpt-v1.mjs`의 `buildPrompt()`에
`KOREAN_TEXT_ONLY_RULE` 상수를 추가해(2026-09-21) 모든 씬 프롬프트에 공통으로
주입한다. clause에서 명시적으로 적은 한글 문구(예: "급여명세서", "국민연금")는
문제없이 잘 나왔지만, clause가 지정하지 않은 배경 요소(스크린 메뉴, 벽면 간판
등)는 ChatGPT가 기본값으로 영어를 채워 넣었다("Pension Consultation",
"Consultation Desk", "A More Secure Tomorrow" 등).

**Why:** 10편(국민연금) 이미지 생성 중 실제로 발견. 한국 채널(경제번역소) 콘텐츠에
영어 배경 텍스트가 섞이면 부자연스럽고 시청자에게 위화감을 준다. Owner가 발견
즉시 진행 중이던 생성을 중단시키고 지적(2026-09-21).

**How to apply:** 이 수정은 `buildPrompt()` 함수 레벨(공통 조합 지점)에
적용했으므로 캐릭터·편에 관계없이 앞으로 생성되는 모든 이미지에 자동 적용된다.
새로 스크립트를 만들거나 이 함수를 우회해서 프롬프트를 직접 조합하는 경우에는
`KOREAN_TEXT_ONLY_RULE`과 동일한 취지의 문구를 직접 추가해야 한다.
**1~9편(이미 배포/제작 완료분)은 재작업 대상 아님** — 10편부터 적용.
[[feedback_owl_hook_title_and_full_tags]] 계열 — 이미지/자막 등 화면에 보이는
모든 요소는 한국어 채널 정체성에 맞아야 한다는 원칙과 연결.
