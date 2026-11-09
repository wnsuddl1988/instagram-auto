---
name: feedback-story-base-structure-absolute-rule-2026-10-11
description: "★★★★스토리형은 11~15편 확정 구조(비트 맵)를 절대규칙 기본 베이스로 — '~~편 주제 찾자'면 이 기준으로 셀렉·설계·대본, 검사기도 이 구조(v4)로 교체(Owner 10/11 밤)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 1d556ea0-6135-4784-9793-c20382605cb4
  modified: 2026-10-11T02:02:00.651Z
---

Owner(2026-10-11 밤): "앞으로 이 구조를 기본 베이스로 대본 작성해. 무조건이야. 절대규칙, 최우선규칙. 내가 ~~편 주제 찾자 하고 셀렉하고 대본 작성해 달라고 하면 이 기준을 베이스로 뽑는 거야. 거기서 좀 더 가미하든 맥락에 맞게 수정하든. 그리고 자꾸 검사기 돌려서 문제 없다고 하는데 검사기 기준 자체를 지금 대본 구조로 다 변경해."

**기준 대본 5편:** 11 포스코 v7·12 디즈니 v5·13 쿠쿠 v7·14 닌텐도 v10·15 한진해운 v8 → repo `_ai/story-base-scripts/`에 보관. 비트 맵·셀렉 절차·금지 목록 = `_ai/templates/story-script-base-structure.md`.

**구조:** 훅(사건·미스터리, 결말 비공개) → 퍼즐 질문 → 맥락·경제 번역 → 장애물·열린 고리 → 선택·결정적 장면 → 전환·반전 → 결과(결말 처음 공개) → 의미 한 줄 + 팔로우. 14~18장면·450~560자·연도 3개 이하·질문 2개+.

**검사기:** `scripts/_story-script-standards.mjs` v4(`checkStoryBaseStructure`) — 훅이 결말을 말함·연도 4개+·질문 0·팔로우 없음 = fix, 열린 고리 없는 6장면 연속·분량 이탈 = warn. 11~15편 확정본은 수정 0, 구버전(11 v6·13 v6·14 v2)은 fix로 걸림을 확인. 설계 파일(TTS 단계)은 11편부터 base-structure 체크 6항목 추가.

**주제 러너(10/11 밤 후속):** `scripts/run-story-topic-scan-once.mjs` v4 — 점수를 증거 신호·한국/생활 접점·baseFit으로 교체(옛 10박자 storyFit은 ×0.5 참고), 보고서에 셀렉 점검표 템플릿 출력, 훅이 결말을 말하면 표시, 증거 없음 −8·숫자 4개 미만 −15. 11~15편 소재는 풀에서 used 표시(풀 사용 15·쓸 수 있음 137, 검사기 PASS). 오프라인 상위: 포니·티코·삼성 vs 애플·박닌·어슈어런스.

**Why:** 매번 대본마다 Owner가 투입해야 했고(한 번에 OK 없음), 검사기는 옛 기준이라 통과해도 규칙 위반이었다.
**How to apply:** 주제 셀렉·설계·대본 모두 이 비트 맵에서 출발, 맥락에 맞게 가감. 검사기 통과는 규칙 준수가 아니며 상식 테스트·숫자별 2출처·열린 고리 표는 사람이 본다. 관련 [[feedback_story_script_rules_top_priority_preflight_every_revision_2026_10_11]]
