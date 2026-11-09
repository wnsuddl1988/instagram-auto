---
name: project-story-ep8-to-10-production-2026-10-09
description: "스토리 8~10편 제작 1단계(TTS·배경음·이미지·영상 프롬프트) 10/9 완료 — Owner 청취 확인·Veo 영상 생성 대기. 8편은 18번 12.4초 문제로 TTS 2회, TTS 엔진 상한 18장면"
metadata:
  node_type: memory
  type: project
  originSessionId: 1d556ea0-6135-4784-9793-c20382605cb4
  modified: 2026-10-09T06:16:37.348Z
---

스토리 8 LG(18장면 126.0초)·9 하나로통신(15장면 78.3초)·10 유한킴벌리(16장면 79.8초) 제작(Owner 10/9 "TTS·배경음·이미지·영상 프롬프트 순서대로"). 체크리스트 `_ai/story-ep{8,9,10}-production-checklist.md`, 영상 프롬프트 `_ai/story-ep{8,9,10}-video-generation-prompts.md`, 스펙 `scripts/_story-ep{8,9,10}-assembly-spec.mjs`, 이미지 `C:/tmp/story-ep{N}-images/`, 음성·배경음 `C:/tmp/money-shorts-os/story-ep{N}-tts|bgm/`.
- 대본 최종: 8 `scenes-v6`(18번 한 구절 삭제), 9 `scenes-v3`, 10 `scenes-v5`. 8편 TTS는 output-v2가 최종(v1 폐기, 유료 2회).
- **TTS 엔진은 한 번에 4~18장면만 받는다**(19장면 ABORT). 장면 음성이 10초를 넘으면 Veo 클립(최대 10초)을 못 채움 → 대본 쓸 때 장면당 음성 9초 안쪽으로.
- 템포 `--factor 1.2 --max-scene-gap 0.25 --keep-gap-scenes`, 정렬 보정 `--threshold 0.1`. 배경음 맞춤은 `C:/tmp/story-bgm-fit.mjs <n> <label> [output-v2]`.
- 이미지는 ChatGPT 컨트롤러로 장당 약 1.5분, 49장 약 1시간, 재생성 0회. 연락 시트는 ffmpeg `xstack`으로(tile+concat은 마지막 한 장만 나오는 오류).
- 낭독 TTS 스크립트 빌더 `C:/tmp/story-tts-common.mjs` + 편별 `build-tts-script.mjs`(상대 경로 import, Windows ESM 절대경로 오류).
- 남은 일: Owner 배경음 미리듣기 확인, Owner Veo 영상 생성(`Downloads/스토리 8·9·10편/1~N.mp4`), 이후 조립·QA·커버·배포.
