---
name: feedback-cover-headline-verbatim-title-rule30-2026-10-06
description: "커버 헤드라인은 영상 제목(headerTitle) 그대로 — 요약·축약 금지(Owner 2026-10-06, 규칙 30). 140px 못 지키면 줄이지 말고 보고"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-10-05T20:55:01.886Z
---

Owner(2026-10-06): "앞으로 커버 이미지 만들 때 원래 영상의 제목을 요약해서 작성하지 말고 제목 그대로 적어서 만들어줘. 제목 자체를 후킹형으로 만드는데 거기서 또 줄이니까 무슨 말인지 못 알아보겠어."

**Why:** 제목은 이미 후킹형으로 다듬은 문구인데, 140px 게이트를 맞추려고 커버에서 또 줄이면 뜻이 흐려진다(황소 17편 사고와 같은 계열).

**How to apply:** 커버 문구 = 스펙 `headerTitle`/`title`을 줄바꿈만 해서 그대로(3줄도 허용). 합성기 `--max-font`·`--max-width-pct`로 ≥140px 유지, 못 지키면 문구를 줄이지 말고 Owner에게 보고. 3줄은 윗 55% 비우고 블록 중심 ~29%(14.5~43.5%). 첫 적용: 부엉 표시 22편 `_owl-cover-ep23-spec.mjs`. CURRENT_STANDARDS 규칙 30. 관련: [[feedback_cover_headline_must_read_naturally_2026_10_03]], [[feedback_cover_headline_overlay_not_model_text_2026_09_30]].
