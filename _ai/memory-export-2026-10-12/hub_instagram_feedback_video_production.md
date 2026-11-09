---
name: hub-instagram-feedback-video-production
description: 영상 제작·TTS·Veo·조립 규칙(feedback) 색인 — 개별 메모리 10개 목록
metadata:
  node_type: memory
  type: reference
---

영상 제작·TTS·Veo·조립 규칙(feedback)의 개별 메모리 색인이다. 관련 작업 전에 해당 항목 파일을 연다. 개별 파일은 삭제·병합하지 않았다(2026-10-09 인덱스 정리).

- [assembly-script-change-side-effects](feedback_assembly_script_change_side_effects.md) — 조립 스크립트(run-owl-assemble-shorts-v2.mjs 등) 핵심 로직 수정 시 연쇄 부작용 주의 — 오늘(2026-09-22) 화면 컷 균일화 시도 하나가 자막 잔류, CTA 화면 누락, 마지막 씬 정지 3건을 연쇄로 일으킴 (2026-09-22)
- [feedback-daily-triple-publish-order](feedback_daily_triple_publish_order_2026_09_25.md) — ★하루 3편 배포 순서 확정(2026-09-25)★ 오전=황소특보, 점심~이른오후=부엉박사, 오후~저녁=금박사. 정확한 시각은 Owner가 그때그때 정함 (2026-09-25)
- [feedback-gemini-veo-scene-assignment-always-10sec](feedback_gemini_veo_scene_assignment_always_10sec.md) — 특정 씬을 Gemini(Veo)로 생성하기로 정하면 그 씬은 무조건 10초로 나온다 — 8초/10초 티어 판정과 별개로, Gemini 배정 여부를 먼저 확인하고 프롬프트 길이 표기를 거기 맞출 것 (2026-09-23)
- [feedback-header-center-alignment-unsupported-glyph](feedback_header_center_alignment_unsupported_glyph.md) — 상단 제목(headerTitle) 줄이 화면 중앙에서 살짝 벗어나 보이면 폰트가 지원 안 하는 글자(한자 등)가 텍스트에 섞여 있는지부터 확인 (2026-09-28)
- [feedback-manual-video-file-naming-convention](feedback_manual_video_file_naming_convention.md) — Owner가 수동으로 생성한 영상을 숫자 파일명(1.mp4~N.mp4)으로 전달할 때, 숫자는 곧 씬 번호다 — 매번 묻지 말고 1=씬1, 2=씬2... 로 바로 매칭할 것 (2026-09-23)
- [feedback-scene-deletion-requires-audio-alignment-rebuild](feedback_scene_deletion_requires_audio_alignment_rebuild.md) — 완성 영상에서 특정 씬을 삭제할 때 오디오·alignment.json도 함께 재계산해야 한다 — 단순히 씬 배열에서 빼면 안 됨 (2026-09-28)
- [feedback-tts-regeneration-variability-2026-09-29](feedback_tts_regeneration_variability_2026_09_29.md) — ElevenLabs TTS는 같은 대본도 재생성마다 씬 길이가 ±10% 흔들린다 — 재생성은 복불복이므로 생성 전에 대본을 충분히 압축하고, 10초 티어 이내면 다시 줄이지 않는다 (2026-09-29)
- [feedback-veo-quota-message-coexists-with-completed-video](feedback_veo_quota_message_coexists_with_completed_video.md) — Gemini 응답 페이지에서 완성된 영상과 quota 소진 안내가 한 화면에 공존할 수 있음 — 완료 확인이 우선 (2026-09-17)
- [feedback-video-generation-prompts-english-detailed](feedback_video_generation_prompts_english_detailed.md) — Gemini/Flow 영상 생성 프롬프트는 항상 영어로, 스타일 유지+동작 디테일+정지 요소 명시를 포함해 상세하게 작성해야 함 (2026-09-19)
- [feedback-video-scene-length-tier-smooth-transition](feedback_video_scene_length_tier_smooth_transition.md) — 영상 씬 길이는 8초/10초 2단계로만 요청 — 9초 같은 중간 티어 금지, 항상 발화보다 여유 있게 받아서 '자르기'만 하고 'tpad 늘리기'는 피해야 매끄러운 전환이 나온다 (2026-09-23)
