---
name: tts-alignment-drift-and-larger-text-2026-10-02
description: "황소 12편 Owner 검수 — TTS alignment 밀림으로 자막이 음성보다 먼저 사라짐 + 제목·자막 글자 작음. 제목 문구는 바꾸지 않고 3줄로 나눠 108px, 자막은 2줄 96px. 보정 도구·QA 게이트로 다음 편부터 자동 적용"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-10-01T01:22:02.622Z
---

황소 12편 Owner 검수(2026-10-02) 3건: ① 제목·자막 글자가 작다 ② 뒤쪽에서 음성이 끝나기 전에 자막이 사라진다 ③ (v2에서 내가 제목 문구를 "서학개미 1위는 / 반도체 아님"으로 임의 변경) "너무 이상하다, 원래 제목이 낫다".

**원인 ②**: eleven_v3 연속 TTS(한 번 호출)의 글자별 alignment가 중간(12편은 s12→s13, 약 88.7초)부터 실제 오디오보다 0.6~0.9초 앞섬. 오디오 파일은 정상. 기존 QA의 "누적 오차 0s"는 조립 내부 정합만 봐서 못 잡았다.
**원인 ①**: 헤더는 줄마다 폭 864px에 맞춰 자동 축소된다. 12자 줄은 기준 크기와 무관하게 77~79px로 그려져, 기준 크기를 키워도 2줄 원래 제목은 작게 보인다.
**Why:** 문구를 바꿔 우회한 것이 잘못이었다(Owner 문구 선호 무시). 해법은 문구 유지 + 줄 수 늘리기.
**How to apply:**
- 제목 문구는 바꾸지 않는다. 줄을 나눠 최대 3줄(줄별 실제 크기 ≥100px), 자막은 최대 2줄·96px(새 체계 편, 옛 편은 92/84 유지). 12편 최종 제목: "서학개미가 / 쓸어 담은 곳 1위는 / 반도체가 아니었다"(108·102·104px). 알려진 단점: 클로즈업 씬에서 3줄이 황소 뿔 끝과 일부 겹침.
- 조립 **전에** `node scripts/fix-tts-alignment-from-audio-once.mjs --tts-summary … --tts-script …` (§A-7 0번). 보정되면 `…audio-fixed.json`/`…audio-fixed.alignment.json`을 조립·CTA 결합(`--scene8-start`·`--alignment`)·QA에 사용.
- `run-episode-qa-once.mjs`가 자동으로 막는 것: 발화 끝 -0.25초에 자막 없음(싱크), 자막 3줄 이상, 새 체계 편 자막 96px 미만, 제목 4줄 이상, 제목 줄별 실제 크기 100px 미만(최소값은 Owner 확정 크기에서 도출한 내 설정 수치). 편마다 체크리스트 템플릿 E절에 증거 칸 있음.
- 관련: [[feedback_gates_over_memory_2026_10_01]], [[feedback_scene_cut_sync_v3_2026_09_30]]
