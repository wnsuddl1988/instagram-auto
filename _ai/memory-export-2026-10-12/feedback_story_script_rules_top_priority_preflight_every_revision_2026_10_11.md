---
name: feedback-story-script-rules-top-priority-preflight-every-revision-2026-10-11
description: "★★★스토리 대본은 쓰거나 고치기 전 규칙 파일·structure-v1·기준 편을 열어 열기 증거 인용 → 설계 줄 → 점검표(_ai/templates/story-script-preflight.md) 후 보고. 규칙 파일은 지적마다 대본 수정 전에 최신화(Owner 10/11 밤 '최우선 규칙으로 박아놔')"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 1d556ea0-6135-4784-9793-c20382605cb4
  modified: 2026-10-11T00:27:15.475Z
---

Owner(2026-10-11 밤): "대본규칙 보고 만든 거 맞아? 또 니 맘대로 썼어? … 어떻게 하면 최우선으로 확인하고 만들래? 최우선 규칙으로 박아놔. 대본규칙은 매회 대본 다듬을 때마다 최신 버전으로 수정해."

**사실:** 12·14편 v2는 검사기(글자 수·장면 수·문장 틀)만 통과했고 구조 문서를 다시 열지 않아 날짜 5~6개, 출처 1곳 숫자("열 명 중 한 명", 인용 문구 대조 통과를 2출처로 착각), 같은 훅 틀 2편, 덧붙인 장면, 뒤집힌 인과 순서(택시 1960 < 주가 폭락 1964), 설계 줄 미보고였다.

**조치:** 프로젝트 `CLAUDE.md` 최상단을 최우선 규칙(열기 → 열기 증거 인용 → 설계 줄 → 점검표 → 규칙 최신화 → 위임 시 규칙 전문)으로 교체. `_ai/story-script-rules.md`에 10/11 밤 피드백 9개와 변경 이력 추가. 점검표 `_ai/templates/story-script-preflight.md` 신설.

**Why:** 규칙이 메모리·짧은 파일에만 있고 작성 순간에 강제되지 않아 같은 실수가 10/9·10/11 낮·밤 세 번 재발했다.
**How to apply:** 스토리 대본을 쓰거나 한 문장이라도 고치기 전에 규칙 파일 전체와 structure-v1 §2-00·§2-0-1·§2-0-2·§4를 연다. 보고 맨 위에 적용 규칙 문장을 원문 인용하고 설계 줄·점검표를 붙인다. Owner가 지적하면 대본보다 규칙 파일(누적 피드백·변경 이력)을 먼저 고친다. 관련 [[feedback_story_11to15_scripts_rejected_rules_not_opened_2026_10_11]] [[feedback_story_economy_translation_no_teaching_check_standard_first_2026_10_09]]

**(10/11 밤 추가) Owner 9원칙 + 주제 고정:** 사람들이 관심 있는 주제 / 감동 실화·긴장·반전 / 경제번역소 시그널을 자연스럽게 / **결말을 처음에 던지면 "아~" 하고 넘어간다(결말 끝까지 보류)** / **계속 넘어갈 수 없는 이유(열린 고리)** / Owner가 한 번에 OK한 적 없음→보고 전 Owner 시점 2회 읽기 / 1~10편 구조·맥락 분석 / 시청 시간·이탈 방지 / 신경 쓰기. **대본이 약하면 주제가 아니라 대본을 고친다 — 5편에 주제 3번 바꾼 것을 Owner가 질책.** 12편=디즈니 플로리다 땅(`story-ep12-disney-florida/scenes-v3.json`), 14편=닌텐도(`story-ep14-nintendo/scenes-v9.json`)로 고정. 원문은 `_ai/story-script-rules.md` 맨 위와 CLAUDE.md 최상단 0번.
