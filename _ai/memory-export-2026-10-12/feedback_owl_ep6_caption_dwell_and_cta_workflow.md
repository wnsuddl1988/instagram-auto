---
name: feedback-owl-ep6-caption-dwell-and-cta-workflow
description: "부엉이 6편에서 확립된 검수 없이 한 번에 승인된 작업 방식 — 자막 dwell 6.8초 제한, 대본-스펙 동기화, CTA 헤더 자동 합성 워크플로"
metadata:
  type: feedback
  originSessionId: 622d3477-873d-4163-815e-7f07e9df42b5
  modified: 2026-09-19T04:46:20.405Z
---

부엉이 6편은 Owner가 "수정할 부분이 없다"고 확인한 첫 편이다(2026-09-19). 이번에 적용한 절차를 다음 편부터도 기본으로 유지한다.

**자막 dwell 6.8초 제한 체크:** `_money-shorts-dynamic-captions.mjs`의 `MAX_CAPTION_DWELL_SEC(6.8초)`는 대본 문장에 쉼표/절 경계가 없으면 초과하기 쉽다(긴 단일 절 문장). 조립 스크립트(`run-owl-assemble-shorts-v2.mjs`)를 돌리기 전에, `buildDynamicCaptionTimeline`을 직접 호출해 `dwellSec > 6.8`인 캡션이 있는지 사전 확인하면 조립 실패로 시간 낭비하는 걸 막을 수 있다. 위반 시 해결책은 코드 수정이 아니라 **대본 문장에 자연스러운 쉼표/전환어를 추가해 TTS 재생성**(Owner 확정 방식, 예: "현행 감독규정상 IRP는" → "현행 감독규정상, IRP는"). `--allow-caption-audit-fail`은 프리뷰 전용이라 최종본에 쓰면 안 된다.

**Why:** 코드의 dwell 제한을 건드리면 벤치마킹 채널 대비 자막이 화면에 너무 오래 머무는 문제가 재발한다. 대본을 짧게 쪼개는 대신 자연스러운 절 경계를 추가하는 편이 의미 손실 없이 재분할 지점을 만든다.

**대본 수정 시 3곳 동기화 필수:** TTS 스크립트(`owl-epN-tts-script.json`)의 narration/captionDisplayText/performanceText/segments.text 4곳 + `_owl-assembly-spec.mjs`의 scene.narration, 총 대본 문구가 등장하는 모든 위치를 동일하게 고쳐야 한다. 하나라도 누락하면 자막과 실제 음성이 어긋난다.

**CTA 헤더 자동 합성 워크플로 확정:** `run-owl-episode-with-fixed-cta-once.mjs`가 `OWL_ASSEMBLY_SPEC.headerTitle`을 자동으로 읽어 CTA follow 구간(0~8초)에만 얹고 teaser 구간(8~16초)에는 얹지 않는다. 순수 CTA 원본(헤더 없음, follow+teaser 16초 결합본)을 매번 새로 확보해야 하는데, 로컬에 기존 편 폴더마다 헤더가 이미 박제된 결과물만 남아있을 수 있으니 주의 — `owl_ep3_cta_bright_follow_final_with_captions.mp4`처럼 이름에 특정 편 번호가 붙어 있어도 실제로는 다른 편(4편)의 헤더가 박혀있을 수 있다. 헤더 없는 순수 원본을 만들려면 `run-owl-cta-final-assemble-once.mjs`를 재실행(단, `owl_cta_muxed.mp4` 원본이 없으면 이전 편의 `*_follow_muxed.mp4`를 복사해서 사용 가능 — 오버레이 합성 전 단계라 편에 무관한 범용 파일)한 뒤 teaser 클립과 concat한다.

**How to apply:** 다음 편(부엉이 7편 이후) 조립 시 이 순서를 그대로 따른다: (1) TTS 생성 전 대본 dwell 사전 체크, (2) 위반 시 쉼표 추가 후 TTS 재생성, (3) 본편 조립, (4) 순수 CTA 원본 확보(헤더 없는 follow+teaser 16초), (5) `run-owl-episode-with-fixed-cta-once.mjs`로 헤더 자동 합성 결합.

관련: [부엉이 캐릭터 일관성 + 고정 CTA](project_owl_character_consistency_and_fixed_cta.md), [영상생성 프롬프트는 영어+상세](feedback_video_generation_prompts_english_detailed.md).
