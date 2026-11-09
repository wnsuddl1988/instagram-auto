---
name: project-owl-ep15-rebuilt-no-geumbaksa-2026-09-30
description: "부엉박사 15편(실업급여 개편) 금박사 연결 제거·새 CTA로 재제작 완료(2026-09-30) — 결과 경로, 새 마지막 대사, 16·17편 같은 방식 절차"
metadata:
  node_type: memory
  type: project
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-09-30T06:45:19.808Z
---

**★배포 완료(2026-09-30): 릴스 instagram.com/reel/Dd5lilOFcv7, 유튜브 youtube.com/shorts/qb5n9FOW5Y8. 스토리도 게시 완료(ChatGPT 접속 지연으로 2회 실패 후 재시도 성공). Owner 방침: 훅은 그대로 배포, 재고는 가성비 선에서만 수정하고 이후 만드는 편부터 제대로. 배포본은 Veo 워터마크 제거본.★**

부엉박사 15편을 Owner B안(금박사 예고 제거, 마지막 장면 대사·이미지·영상 새로 제작)으로 재제작 완료.

- 최종본: `C:/tmp/owl-v2-ep15-final-v2/owl_episode_final_mastered.mp4` (119.96초, 61.9MB → 배포 전 압축 필요(35MB 제한, 이전 편은 ~32MB로 압축), -15.0 LUFS). 새 CTA `owl-cta-fixed-v3` 결합, cta-join PASS, 자동 검수 반드시 수정 0.
- 새 마지막 대사: "퇴사 계획 있으면 이 두 가지는 저장해 두고, 국회 결과 나오면 다시 확인해. 궁금한 제도는 댓글로 남겨줘." 카드 '저장해두고 / 국회 결과 확인'. TTS `owl-v2-ep15-tts/output-v2`(API 1회), 클립 `owl_v2_ep15_s15_bridge_v2_motion.mp4`.
- 팩트: 정부안·국회 통과 전 그대로(2026-09-30 재확인, "연내 법 개정 목표").
- 남은 것: 커버·스토리 제작(카드뉴스 없음), 배포는 Owner 지시. 훅은 H4 확인 권장(긴장 단어가 뒤쪽) — 이미 TTS·영상 제작된 재고라 그대로 두었음, Owner 판단 필요.

**★ 16·17·18편 배포 최종본 = `C:/tmp/owl-v2-ep1{6,7,8}-final-v3/owl_episode_final_mastered.mp4`(씬 전환 싱크 v3 재조립, QA 반드시 수정 0). `final-v2`는 옛 조립기본(화면 컷이 발화보다 늦음) — 쓰지 말 것.★** [[feedback-scene-cut-sync-v3-2026-09-30]]

**16~18편 진행(2026-09-30 오후, Owner "미리 수정해놓자"):** 18편 재조립 완료(영상 수정 없음, `C:/tmp/owl-v2-ep18-final-v2/owl_episode_final_mastered.mp4`, QA 반드시 수정 0). 16·17편은 팩트 재확인·새 대사 TTS(16=output-v4, 17=output-v2)·새 이미지(`owl-v2-ep16-images-v2`, `owl-v2-ep17-images-v2`)·영상 프롬프트(각 `_ai/owl-v2-ep1{6,7}-video-generation-prompts.md` 맨 위) 완료 → Owner 영상 2개 수령·**16·17편 완성**(`C:/tmp/owl-v2-ep16-final-v2/owl_episode_final_mastered.mp4` 113.08초, `owl-v2-ep17-final-v2/…mastered.mp4` 101.75초, QA 반드시 수정 0, 새 CTA·워터마크 제거). 16·17·18편 모두 **배포 대기**(16→17→18 하루 한 편, Owner 지시 시). 배포 때 압축 + 커버·스토리는 기존 사용(카드뉴스 없음), 17편 캡션에 "현행 기준" 한 줄 검토. 16편 s9는 장면 10.42초>클립 10.01초라 0.4초 정지(기존과 동일 수준, 그대로).

**16·17편 절차(같은 방식):** 팩트 재대조 → tts-script 복사해 마지막 씬 교체 → `owl-tts`(no-log 래퍼) → probe `--owl-v2-ep{N}-…-only 15`로 s15 이미지(문구 교체) → 영상 프롬프트(15편 문서 "s15 v2" 블록 형식, 입 멈춤 시각은 TTS 실측) → Owner 영상 → 조립 → 새 CTA(v3) → run-audio-finish → run-episode-qa. 관련 [[project-cta-layout-v2-remake-2026-09-30]].
