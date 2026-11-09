---
name: feedback-story-image-unified-with-cover-2026-10-01
description: "스토리 이미지는 따로 만들지 않고 커버 1장으로 통일(Owner 2026-10-01, 12편부터) — 커버=유튜브 썸네일=인스타 스토리. 카드뉴스 중단과 같은 맥락"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-09-30T23:54:12.362Z
---

Owner(2026-10-01): "커버 이미지와 썸네일은 동일한데 스토리 이미지도 커버로 통일하자. 카드뉴스를 안 하기로 한 마당에 스토리 이미지를 따로 만들 필요는 없다." → **12편부터 커버 1장이 릴스 커버·유튜브 썸네일·스토리를 겸한다.** 옛 편(부엉 16·17·18편 등)의 별도 스토리는 이미 만든 것이라 그대로 쓴다.

**Why:** 카드뉴스 중단 후 스토리 전용 제작(9:16 스펙·생성·합성)이 중복 작업이라는 판단.

**How to apply:** 새 편은 커버만 만든다(글자 없는 생성 → `run-cover-headline-overlay-once.mjs --max-width-pct 84`, 줄당 7자 이하, 140px 게이트). 스토리 게시는 커버 1장만 든 폴더(`<publish>/story-src/`)를 `plan-instagram-cardnews-blob-upload --images-dir`로 넘긴다. 커버가 스토리 UI에 가리지 않게 글자는 좌우 8% 이상 안쪽·세로 17~34%, **"경제번역소" 배지는 세로 14% 위에 두지 않는다**(그리드 3:4 크롭·스토리 상단 UI 둘 다 가림 — 통합 커버에서 배지 위치는 Owner 확인 대기). 원문: CURRENT_STANDARDS 규칙 7·§A-8·§5. [[feedback-cardnews-stopped-no-bgm-2026-09-30]] [[feedback-cover-headline-overlay-not-model-text-2026-09-30]]
