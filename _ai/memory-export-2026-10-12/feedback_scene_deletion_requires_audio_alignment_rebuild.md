---
name: feedback-scene-deletion-requires-audio-alignment-rebuild
description: 완성 영상에서 특정 씬을 삭제할 때 오디오·alignment.json도 함께 재계산해야 한다 — 단순히 씬 배열에서 빼면 안 됨
metadata:
  node_type: memory
  type: feedback
  originSessionId: 96dabe12-0224-46cf-9034-b0b64d75918f
  modified: 2026-09-28T13:05:11.295Z
---

완성된 편에서 씬 하나(예: 균형/경고 씬)를 통째로 빼야 할 때, `_bull-epN-assembly-spec.mjs`의
`scenes` 배열에서 해당 항목만 지우는 것으로는 부족하다. 이 프로젝트는 TTS를
**전체 대본 한 번에** 연속 오디오로 생성하고(`elevenlabs-korean-director-*.m4a`
하나), 각 씬의 화면 컷 타이밍은 그 연속 오디오의 alignment.json(문자 단위
타임스탬프)에서 역산한다. 따라서 씬을 빼려면:

1. alignment.json에서 삭제할 씬의 나레이션 시작~끝 시각을 정확히 찾는다(그
   앞뒤에 붙는 `[confidently]` 같은 v3AudioTag 지시자까지 포함해서 구간을
   잡아야 한다 — 이 지시자도 문자로 alignment에 들어있다).
2. 오디오(m4a)를 그 구간 전후로 잘라 재인코딩 후 이어붙인다(`-c copy`는 정밀한
   컷을 보장 못 하므로 재인코딩 사용). ffmpeg concat demuxer로 결합.
3. alignment.json을 새로 만든다 — 삭제 구간 이전 문자는 그대로, 이후 문자는
   전부 (구간 길이)만큼 타임스탬프를 앞으로 당긴다. 삭제 구간 안의 문자는
   제거.
4. `elevenlabs-scene-paced-tts-summary.json`(씬별 startSec/endSec/spokenStartSec/
   spokenEndSec 요약)도 같은 방식으로: 삭제한 씬 항목을 빼고, 그 이후 씬들의
   4개 시각 필드를 전부 같은 만큼 당긴다. `audioPath`/`alignmentPath`도 새
   파일 경로로 갱신.
5. `bull-epN-tts-script.json`(캡션 생성용 원본 스크립트)도 삭제한 씬 항목을
   `scenes` 배열에서 제거.
6. 조립 스크립트(`run-owl-assemble-shorts-v2.mjs`)를 새 audio-summary/tts-script로
   재실행 — `--clip-dir`은 원래 이미지·영상 그대로 재사용 가능(스펙에서 씬을
   뺐으니 해당 클립은 애초에 안 쓰임).
7. CTA 결합(`run-owl-episode-with-fixed-cta-once.mjs`)의 `--scene8-start`(본편
   오디오 전체 길이)와 `--alignment`도 새로 만든 값/파일로 교체.

**Why**: 오디오가 씬별로 분리 파일이 아니라 연속 트랙 하나이고, 화면·자막
타이밍이 전부 그 트랙의 alignment 좌표계를 신뢰하는 구조이기 때문. 씬 배열만
지우면 조립 스크립트가 존재하지 않는 오디오 구간을 참조하게 되어 화면·음성이
어긋나거나 조립이 아예 실패한다.

**How to apply**: [[project_bull_ep7_deploy_2026_09_28]]에서 s12를 삭제할 때
이 절차 전체를 적용해 성공(오디오 84.243~93.047초 구간 제거, 15씬으로 재조립,
CTA 재결합까지 검증 PASS). 다른 캐릭터(부엉박사·금박사) 편에서도 같은 구조라
동일하게 적용 가능.
