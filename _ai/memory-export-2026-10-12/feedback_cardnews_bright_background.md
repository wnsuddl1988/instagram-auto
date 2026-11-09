---
name: feedback-cardnews-bright-background
description: "카드뉴스 배경은 다크 네이비 오버레이로 너무 어둡게 가지 말고 밝은 톤을 기본으로 — Owner 피드백(2026-09-19)"
metadata:
  type: feedback
  originSessionId: 622d3477-873d-4163-815e-7f07e9df42b5
  modified: 2026-09-19T06:42:53.441Z
---

카드뉴스(부엉이·금박사 공통) 배경은 다크 네이비 반투명 오버레이(50~55% opacity)를 기본값으로 써왔는데, Owner가 "컨텐츠는 풍부해 보이는데 배경이 너무 어두울 필요는 없다, 조금 더 밝은 느낌이었으면 좋겠다"고 피드백함(2026-09-19, 1~6편+금박사 1편 총 7세트 게시/완성 직후).

**Why:** 실사 배경 사진 자체는 완성도가 높고 브랜드명 노출 문제도 잘 잡았지만("래미안/힐스테이트" 노출 이후 무브랜드 원칙 추가), 전체 톤이 다크 네이비 일색이라 어둡고 무거운 인상을 준다는 지적.

**How to apply:** 다음 카드뉴스 스펙 작성 시 프롬프트의 오버레이 지시를 다음과 같이 조정한다:
- 오버레이 색상을 `dark navy semi-transparent overlay (about 50~55% opacity)`에서 `light/bright semi-transparent overlay (a soft white or light gray tone, about 35~45% opacity)`로 전환 검토.
- 텍스트 가독성은 여전히 확보해야 하므로, 밝은 배경일 때는 텍스트에 검은색 외곽선(black outline) 대신 흰색 배경 위에서도 잘 보이는 진한 남색(#14213D) 또는 검정 텍스트 색상 조합을 함께 고려.
- 완전히 밝게(흰 배경) 가는 게 아니라 "너무 어둡지 않은" 균형점을 찾는 것이 목표 — 다음 편 시범 제작 후 Owner 확인받고 톤을 확정한다.
- 이미 게시 완료된 1~6편·금박사 1편은 재작업 대상 아님. 신규 편부터 적용.

관련: [영상생성 프롬프트는 영어+상세](feedback_video_generation_prompts_english_detailed.md).
