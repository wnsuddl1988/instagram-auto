---
name: feedback-owl-instagram-caption-hooking-style
description: "부엉이 쇼츠 Instagram/YouTube 캡션·설명란은 대본 나열이 아니라 후킹형으로 작성, 감정 이모지 금지"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 622d3477-873d-4163-815e-7f07e9df42b5
  modified: 2026-09-18T02:49:29.736Z
---

**Instagram 캡션과 YouTube 설명란 모두 대본을 그대로 옮기지 말고 후킹형으로 쓴다** ("유튜브도 이 기준으로 해", Owner 2026-09-18). 이전까지 `scripts/_owl-publish-metadata.mjs`는 evidence_card/twist/impact/action 씬의 나레이션을 그대로 "· 문장" 형태로 나열했는데, Owner가 "그냥 대본을 쭉 써놨다, 후킹내용으로 써달라"고 명확히 지적함.

**Why:** 대본 원문 나열은 궁금증을 유발하지 못하고 스크롤을 멈추게 하는 힘이 없다. 캡션은 영상 내용을 요약 전달하는 자리가 아니라 클릭/저장을 유도하는 후킹 카피여야 한다.

**How to apply — 새 편마다 반드시 할 일**:
1. `_owl-assembly-spec.mjs`에 `instagramCaptionHook`(궁금증을 증폭하는 한 줄, 대본 훅과 달라도 됨)과 `instagramCaptionPoints`(대본을 그대로 옮기지 않고 핵심 반전/포인트만 3~4개로 짧게 압축한 문장 배열)를 직접 작성해서 채운다. 이 필드가 없으면 `_owl-publish-metadata.mjs`가 대본 나레이션으로 자동 폴백하면서 콘솔에 WARN을 남기므로, 이 경고가 뜨면 반드시 채워야 한다는 신호다.
2. `instagramPriorityTags`도 편마다 채운다 — 자동 해시태그 추출(`topicTagsFrom`)은 나레이션 키워드 매칭이라, 그 편의 실제 주제와 무관한 단어(예: 3편 "전세난" 주제인데 "실거주 유도 규제" 문구 때문에 "대출"류 태그가 앞자리를 차지)가 우선순위를 가로챌 수 있다. 우선순위 태그를 명시하면 그 태그들이 먼저 배치된다.
3. **감정·장식 이모지(😱🔀⚠️✅📌⏱📊📰🦉 등)는 Instagram·YouTube 모두 쓰지 않는다** — "너무 AI티가 난다"는 지적(Owner 2026-09-18), 뒤이어 "유튜브도 이 기준으로 해"로 YouTube 설명란까지 동일 적용 확정. 기능적 화살표(👉, "저장해두고 다음에 또 보기 👉 팔로우"의 CTA 유도용)만 예외적으로 허용, 그 외 전부 뺀다. `_owl-publish-metadata.mjs`의 YouTube 섹션 제목(챕터/이 영상 포인트/영상에 나온 숫자/출처)도 이모지 없는 순수 텍스트로 통일.
4. YouTube 설명란 첫 3줄(접히기 전 지면)도 `igHook`(Instagram과 같은 후킹 문구)을 그대로 쓰고, "이 영상 요약" 섹션도 대본 나레이션이 아니라 `igPoints`(압축 포인트)를 재사용한다 — Instagram과 YouTube가 같은 후킹 소스를 공유하는 구조.

[[project_owl_voice_liam_fixed]]와 마찬가지로 3편(2026-09-18) 게시 준비 과정에서 확정된 표준 — 4편부터도 계속 적용.
