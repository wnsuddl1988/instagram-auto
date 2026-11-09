---
name: project-bull-ep11-deployed-2026-09-30
description: "황소특보 11편(조선주 주가 반토막인데 이익 전망 올랐다) 배포 완료 링크·자체 75점·Owner 지시(내일부터 퀄리티 상승, 꼭 체크)"
metadata:
  node_type: memory
  type: project
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-09-30T15:10:23.835Z
---

황소특보 11편 배포 완료(2026-09-30, Owner "확인하고 배포해"): 릴스 instagram.com/reel/Dd6OQgkimBU(커버 적용 확인), 유튜브 youtube.com/shorts/-noGZIex5sM(public), 스토리 게시. 최종본 `C:/tmp/bull-ep11-final3/owl_episode_final_mastered.mp4`, 배포 폴더 `C:/tmp/bull-ep11-publish/`. 게시 장부에 11편 추가됨.

**Owner 지시(2026-09-30):** 오늘은 변경이 많아 시행착오로 본다, **내일(10/1)부터 퀄리티를 더 올려라, 꼭 체크해라**. 오늘 이미지 생성·영상 조립에 시간이 많이 걸린 것도 개선 요구.

**★내일(10/1) 첫 작업 전 할 일 — Owner 지시 "시간 지나서 될 수 있으면 내일 다시 보고":** 11편(`-noGZIex5sM`) 유튜브 썸네일 재확인 — ① `i.ytimg.com/vi/-noGZIex5sM/oar1~3.jpg` 생성 여부(어제 404) ② Studio 영상 상세·콘텐츠 목록 썸네일 빈 칸 해소 여부 ③ 채널 쇼츠 탭에 커버가 뜨는지. 인앱 브라우저(오른쪽 패널)에 유튜브 로그인이 유지돼 있으면 그쪽으로 Studio 조작 가능(Chrome 확장 불필요), 로그아웃이면 Owner에게 로그인 요청. 결과를 §5 10단계에 확정하고 Owner에게 보고. 안 바뀌었으면 Owner가 Studio 앱에서 직접 지정해 보도록 안내.

**★소급 발견(2026-10-01 게이트 시험):** 배포본 s3 "51%" 끝 약 88.9%(안전선 넘음·크롭선 안), **s7 "수주잔량 18%" 끝 약 90.3%(크롭선도 약 6px 넘음 — 9/30 교정 목록 7씬에서 빠졌던 씬)**. 9/30 보고의 "교정 뒤 모두 안전선 안"은 틀렸다. 재업로드 여부는 Owner 결정. 판정 기록 `C:/tmp/qa-gate-test/qa/edge-review.json`(복사본 기준).

**Why:** 자체 점수 75점을 Owner가 "객관적이라 다행"으로 받아들임. 감점 요인: 보드 글자 오른쪽 초과 교정(클립 좌측 이동), s4 보드 글자 작음, 입이 대사 뒤 ~1초 더 움직임, 이미지 14장 탈락·s4 3회 재생성 실패, 커버 글자 안전영역 이탈.

**How to apply:** 다음 편은 (1) 이미지 브리프에서 황소+보드 묶음 폭 ≤76%로 예방, 샘플 3장 선검수 [[feedback-video-quality-system-v2-2026-09-30]] (2) 영상 검수 때 보드 오른쪽 25% 확대 실측 [[feedback-board-text-right-edge-verify-in-video-2026-09-30]] (3) 커버·스토리는 글자 없는 생성+합성기 `run-cover-headline-overlay-once.mjs` [[feedback-cover-headline-overlay-not-model-text-2026-09-30]] (4) 자막 숫자 덩어리는 `_caption-linebreak-ko.mjs`가 처리(올해/내년+숫자 벌점) (5) 유튜브 쇼츠 세로 썸네일 한계 [[feedback-youtube-shorts-thumbnail-vertical-auto-frame-2026-09-30]]. 시간 단축: 이미지는 샘플 선검수로 재생성 횟수를 줄이고, 조립은 QA 반드시 수정 0을 조립 전 스펙·자막 단계에서 미리 점검.
