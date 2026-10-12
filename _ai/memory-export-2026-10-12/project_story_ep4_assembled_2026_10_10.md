---
name: project-story-ep4-assembled-2026-10-10
description: "스토리 4편(대우 해체) Veo 16개 검수·조립·커버 완료 — 완성본 92.6초 QA 수정 0, 제목은 임시안(Owner 확정 대기), 게시 전. 4~10편 중 조립본은 4편만 있음"
metadata:
  node_type: memory
  type: project
  originSessionId: 1d556ea0-6135-4784-9793-c20382605cb4
  modified: 2026-10-10T06:05:34.853Z
---

Owner 2026-10-10 "스토리영상 4편 영상생성본이야. 검수하고 문제없으면 조립~커버이미지까지 생성해서 보고해". 클립은 `Downloads/스토리 4편(대우)/1~16.mp4`(5~10편 클립도 Downloads에 도착, 조립은 아직 없음).

**산출물:** 완성본 `C:/tmp/story-ep4-assembled/story_ep4_mastered.mp4`(92.6초, 46.5MB → 게시 전 35MB 이하 압축 필요, QA 반드시 수정 0), 커버 `C:/tmp/story-ep4-cover/story_ep4_cover_v3.png`(소스=15번 장면 원본, 4줄 146px, 세로 18.3~51.7%). Downloads에 `스토리4편_대우_완성본.mp4`·`스토리4편_대우_커버.png` 복사. 체크리스트 `_ai/story-ep4-production-checklist.md`.

**★★폐기(Owner 10/10 오후 "만들고 나니 대우는 소재가 좀 이상한 것 같아, 배포하지 않고 폐기"):** 4편 대우는 배포하지 않는다. 아래 내용은 도구 개선 기록으로만 유효. 소재 풀·편성에서 대우를 사용 불가로 취급하고 다음은 5편(삼성 화형식).

**★재조립(10/10 오후):** Owner "젤앞에 CURES 이런 영어 단어가 들린다" → eleven_v3 `[curious]` 태그가 1.28초 발음된 것. `apply-story-tempo-once.mjs --first-start 1.48`로 잘라 재조립, 새 최종본 = `C:/tmp/story-ep4-assembled-v2/story_ep4_mastered.mp4`(91.3초, 48.2MB, QA 수정 0, 앞 0.2초 무음 확인), Downloads 완성본 교체. 위 92.6초 본은 폐기. **5~10편 조립 때도 첫 장면 시작 직후 소리(태그 발음) 확인할 것**(알라인먼트에서 첫 비-태그 글자 시작이 0.5초 넘으면 의심).

**제목은 임시안:** "은행이 믿은 건 / 돈이 아니라 / 장부였다"(영상 속 3줄, 커버는 140px 게이트 때문에 4줄 줄바꿈) — Owner 확정 필요.

**Why:** 4편은 오늘(10/10) 점심 슬롯이었으나 조립본이 없었다. **How to apply:** 다음은 Owner 완성본·제목 확인 → 압축·콘텐츠 유닛·게이트 → "배포해줘" 때 인스타 바로·유튜브 1시간 뒤 예약(§5). 같은 순서로 5~10편 조립. 이번에 도구 2개를 고쳤다: 조립기 자막 최후 안전망(폭 무시로 944px 줄 → ABORT), QA "이만큼" 오탐.
관련: [[project-story-ep3-deployed-2026-10-09]] · [[feedback-caption-tidy-planner-and-story-assembly-checklist-2026-10-07]]
