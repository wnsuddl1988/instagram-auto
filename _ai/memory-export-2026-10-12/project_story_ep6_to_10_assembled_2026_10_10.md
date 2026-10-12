---
name: project-story-ep6-to-10-assembled-2026-10-10
description: "스토리 6~10편 검수·조립·커버 완료(10/10) — 모두 QA 수정 0, 제목 임시안 Owner 확정 대기, 게시 전, 35MB 압축 필요. 6·8·10편은 맨 앞 [curious] 태그 소리를 잘라 재조립, 6편 번호판 가짜 글자 흐림 처리"
metadata:
  node_type: memory
  type: project
  originSessionId: 1d556ea0-6135-4784-9793-c20382605cb4
  modified: 2026-10-10T07:05:05.520Z
---

Owner 2026-10-10 "스토리 6편부터 10편까지 영상 어디 있는지 다 알지? 검수하고 조립~커버까지 진행해". 상세 기록·경로 표는 `_ai/story-ep6-10-assembly-2026-10-10.md`.

**산출물:** 완성본 6 `C:/tmp/story-ep6-assembled-v2/`, 7 `story-ep7-assembled/`, 8 `story-ep8-assembled-v2/`, 9 `story-ep9-assembled/`, 10 `story-ep10-assembled-v2/` (`story_ep{N}_mastered.mp4`, 길이 80.4/85.4/125.9/78.3/79.6초, 43~58MB → 게시 전 35MB 이하 압축 필요). 커버 `C:/tmp/story-ep{N}-cover/`. Downloads에 `스토리{N}편_{소재}_완성본.mp4`·`_커버.png`.

**제목은 임시안(Owner 확정 필요):** 6 놀림받던 차가/10년 보증을/내건 이유 · 7 분리수거함의/전단지가/4조 원 됐다 · 8 LG가 휴대폰을/26년 만에/접은 이유 · 9 60만 원 모뎀을/먼저 쓴/하나로통신 · 10 한 명도 안 자른/유한킴벌리의/4조 2교대.

**Why:** 4편(대우)은 폐기, 5편은 배포 완료(10/10), 6~10편 순서 제작. **How to apply:** Owner 완성본·제목 확인 → 압축·콘텐츠 유닛·캡션 확인 → "배포해줘" 때 인스타 바로·유튜브 1시간 뒤 예약(§5). 새 스토리 편 조립 시: ①클립 검수 시 번호판·간판 글자 확인(6편 9번 "PRIOSTVC") ②맨 앞 0.5초 음량으로 `[curious]` 태그 발음 확인, 있으면 `apply-story-tempo-once.mjs --first-start`(원본 초)로 자르기 ③한 어절 8자가 760px를 넘으면 `captionWidthExceptions`(글자 줄이지 말 것).
관련: [[project-story-ep5-deployed-2026-10-10]] · [[project-story-ep4-assembled-2026-10-10]]

**★정정(10/11, Owner 6편 확인):** 6·8·10편 맨 앞 "태그 소리" 제거는 오판이었다 — 잘라낸 구간은 태그가 아니라 첫 음절("미국"의 미, "이천"의 이, "외환"의 외)이었다. 알라인먼트 문자 시각은 실제 발음보다 늦게(최대 0.1초) 찍혀 믿을 수 없고, 저/고역 대역 에너지(높은 /i/는 고역 강함)로도 구분이 안 됐다. **앞부분은 자르지 말 것(4편 "CURES"처럼 1초 넘게 발음된 경우만 자른다).** 6편은 자르지 않은 원본 음성으로 재조립, 2번 영상은 이미지 자체가 "팔 없이 손만 있는" 그림이라 사람·손 없는 새 이미지(C:/tmp/story-ep6-images-fix/story_ep6_s2.png)와 Veo 새 영상(Owner 제공 Car_engine_bay_repair_video_20261011005259.mp4)으로 교체, 최종 C:/tmp/story-ep6-assembled-v4/story_ep6_mastered.mp4(번호판 흐림 포함, QA 수정 0). 10편은 uncut 재조립 완료(C:/tmp/story-ep10-assembled), 8편은 uncut + 정렬 보정(threshold 0.05) 재조립을 Owner 지시로 중단(6편에 집중) — 8편 현재 Downloads 파일은 "이"가 잘린 옛 본이므로 사용 금지. Owner가 편별 수정사항을 순서대로 지시하기로 함.

**★10/11 수정 반영:** 8편 최신본 `C:/tmp/story-ep8-assembled-v6/story_ep8_mastered.mp4`(자르지 않은 원본 음성·쉼표 숫자 음영 수정(`[0-9][0-9,.]*명`)·정렬 보정은 threshold 0.1(0.05는 마지막 장면 자막을 뭉개서 쓰지 않음)·BGM -28dB로 QA의 BGM 오탐 회피). 10편 최신본 `C:/tmp/story-ep10-assembled-v5/story_ep10_mastered.mp4` — 대본 8번을 "이번엔 노조가 반대하지 않았어."로 수정(scenes-v6.json), TTS 재생성 output-v2(유료 1회), 강조어에 "정리해고" 추가, 마지막 자막 정렬은 실제 발화 끝(79.05초)에 맞춰 패치. 둘 다 QA 수정 0, Downloads 교체. 교훈: fix-tts-alignment는 같은 이름으로 덮어쓰며, 낮은 threshold가 끝 문장을 뭉갤 수 있으니 결과 마지막 글자 시각을 확인할 것.

**★Owner 확정(10/11): 스토리 6~10편 영상은 현재 최신본으로 확정**(6 `story-ep6-assembled-v4`, 7 `story-ep7-assembled`, 8 `story-ep8-assembled-v6`, 9 `story-ep9-assembled`, 10 `story-ep10-assembled-v5`; Downloads 완성본과 동일). 영상 확정이며 **제목 임시안 확정·게시 순서·시각은 아직 미정** — "배포해줘" 지시 때 §5 절차(압축 35MB 이하·콘텐츠 유닛·캡션 확인·게이트)로 진행.
