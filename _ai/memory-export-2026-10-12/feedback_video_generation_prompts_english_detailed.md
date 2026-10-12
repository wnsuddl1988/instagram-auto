---
name: feedback-video-generation-prompts-english-detailed
description: "Gemini/Flow 영상 생성 프롬프트는 항상 영어로, 스타일 유지+동작 디테일+정지 요소 명시를 포함해 상세하게 작성해야 함"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 622d3477-873d-4163-815e-7f07e9df42b5
  modified: 2026-09-18T23:39:30.338Z
---

부엉이/금박사 등 캐릭터 쇼츠의 Gemini·Flow 영상 생성 프롬프트는 **항상 영어로, 충분히 상세하게** 작성한다. 이미지 생성(ChatGPT) 프롬프트가 한글인 것과는 별개 원칙이다.

**Why:** Gemini/Flow 같은 영상 생성 모델은 학습 데이터가 영어 중심이라 동작·카메라·디테일 지시가 영어일 때 더 정확히 반영된다(Owner 지적, 2026-09-19). 또한 짧은 프롬프트("손을 흔드는 동작" 한 줄)만 주면 모델이 스타일을 임의로 바꾸거나(2D 평면화, 다른 렌더링 톤), 이미지 속 고정 텍스트/소품을 변형하거나, 지시 안 한 카메라 워크·추가 동작을 넣는 사고가 날 위험이 크다.

**How to apply:** 씬별 영상 프롬프트를 쓸 때마다 아래 4요소를 빠짐없이 포함한다:
1. **스타일 유지 지시** — "Reference the attached image exactly: same 3D rendering, same lighting, same background, same character design. No style changes, no flattening to 2D, no photorealism."
2. **동작 디테일** — 몇 번 반복하는지, 속도감, 표정이 유지되는지까지 구체적으로("waving slowly 2-3 times", "nodding gently once or twice").
3. **정지 요소 명시** — 이미지 안의 텍스트·소품·아이콘은 절대 안 바뀐다고 각 항목을 나열("All text on the card must remain completely static — no changes to wording, color, or position").
4. **부정 프롬프트** — "Do not introduce any new objects, camera movement, or additional gestures beyond [지정한 동작]"으로 "한 클립 = 한 동작" 원칙을 명시적으로 강제.

한글 이미지 프롬프트 안의 텍스트(카드 문구 등)는 원문 그대로 따옴표로 인용해서 영어 프롬프트에 삽입한다(번역하지 않음) — 모델이 "이 정확한 문자열을 바꾸지 말라"고 인식하게 하기 위함.

이 원칙은 부엉이·금박사 두 트랙 모두에 적용하며, [project_owl_character_consistency_and_fixed_cta](project_owl_character_consistency_and_fixed_cta.md)의 "캐릭터 편차 방지"와 같은 문제의식(모델이 참고 없이 임의로 채워 넣는 것을 막는다)을 영상 생성 단계에도 확장한 것이다.
