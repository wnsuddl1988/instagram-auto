---
name: project-owl-voice-liam-fixed
description: 부엉이 쇼츠 TTS 기본 보이스를 Liam으로 고정(2026-09-18 Owner 확정)
metadata: 
  node_type: memory
  type: project
  originSessionId: 622d3477-873d-4163-815e-7f07e9df42b5
  modified: 2026-09-18T02:12:34.850Z
---

**부엉이 쇼츠 TTS 기본 보이스 확정(2026-09-18)**: ElevenLabs 보이스를 기존 `Dhk - Intelligent & Calm`(voice id `I8ap260z0SwXC8TsZGdT`)에서 `Liam - Energetic, Social Media Creator`(voice id `TX3LPaxmHKxFdv7VOQHJ`)로 교체. `.env.local`의 `ELEVENLABS_VOICE_ID`를 Owner가 직접 값 변경(어시스턴트는 `.env.local` 값을 읽거나 쓰지 않음 — 존재 여부만 확인).

**Why:** 기존 보이스가 "너무 묵직하고 울리는" 느낌이라는 피드백. 요구사항은 "설득력 있고 애널리스트다운 전문가 목소리, 정보전달이 명확하고 조금 밝은 톤". 계정 보유 보이스 중 Gihong, Jeonggi는 후보에서 제외됨(톤이 낮고 울림 — Owner 청취 후 기각). 6개 후보(Min, Seojin, Mr.K Pro, Eric, Daniel, Liam)로 1차 샘플, 이후 Mr.K Pro/Eric/Liam 3개로 긴 문장(실제 훅+CTA 조합) 2차 샘플을 만들어 최종 Liam으로 확정.

**How to apply**: 이후 모든 TTS 생성(본편 나레이션, CTA follow/teaser 포함) 시 별도 지시 없이 이 보이스를 기본으로 쓴다 — `.env.local`의 `ELEVENLABS_VOICE_ID`에 이미 고정돼 있으므로 코드 변경 불필요, TTS 러너(`build-elevenlabs-korean-director-tts-from-script.mjs`)가 자동으로 이 값을 읽음. 보이스를 다시 바꾸고 싶다는 요청이 오기 전까지는 이 값을 유지한다.

**보이스 캐스팅 도구 확장(2026-09-18)**: `scripts/build-owl-voice-casting-samples-v1.mjs`에 `--line "<문장>"` 옵션 추가 — 기존엔 `CASTING_LINE` 하드코딩 문장(1편 훅) 하나로만 비교 가능했는데, 짧은 문장으로는 톤 판단이 어렵다는 지적으로 임의 문장 비교 기능을 넣음. `run-owner-command-with-local-env-no-log.mjs`의 `owl-voice-casting` 커맨드도 `--line` 패스스루 허용하도록 같이 수정(길이 300자 제한 가드 포함). 향후 다른 보이스 재검토 시 이 옵션으로 실제 대본 문장을 넣어 비교할 것.

[[project_owl_character_consistency_and_fixed_cta]]와는 별개 — 그쪽은 이미지/영상 캐릭터 일관성, 이쪽은 음성 보이스 정책.
