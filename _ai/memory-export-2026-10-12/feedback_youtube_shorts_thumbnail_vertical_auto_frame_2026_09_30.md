---
name: feedback-youtube-shorts-thumbnail-vertical-auto-frame-2026-09-30
description: "유튜브 thumbnails.set \"set\"인데 쇼츠 세로 칸에 커버가 안 보이는 이유 — 커버는 16:9 저장본에만, 세로 칸은 자동 프레임(oar1/oar2) 사용, 확인법"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-09-30T12:50:31.473Z
---

Owner 지적 "유튜브 썸네일이 자꾸 안 입혀진다"(2026-09-30)를 실측. API `thumbnailStatus: set`은 거짓이 아니다: `i.ytimg.com/vi/<id>/maxresdefault.jpg`(1280x720)에 9:16 커버가 가운데·양옆 흐림으로 저장된다. 그러나 채널 쇼츠 탭·검색 쇼츠 칸은 세로 자동 프레임(`oar1.jpg`·`oar2.jpg` 1080x1920, `frame0`=첫 프레임)을 쓴다(ep10·11 확인, `oardefault` 없음, 업로드 직후 oar는 404).

**Why:** API에는 쇼츠 세로 썸네일/프레임을 고르는 기능이 없고, 스크립트(`run-owl-youtube-publish-once-v1.mjs`)는 이미 1080x1920 리사이즈·set까지 정상 수행한다 — 스크립트 결함이 아니다.

**후속 실측·정정(같은 날 밤):** `oar1~3`은 커버가 아니라 영상 프레임 후보 3장이다. Owner가 인앱 브라우저(오른쪽 패널)에 유튜브 로그인을 해 두면 그 브라우저로 Studio를 조작할 수 있다(Chrome 확장 불필요). 11편에 Studio 업로더(`ytcp-thumbnail-uploader #file-loader`)로 커버 JPEG를 2회 넣고 저장했지만 서버 상태 불변(maxres 135,750B, oar 404, Studio 목록 빈 칸) → 11편 썸네일 처리 미완으로 보이며 Studio 업로드 효과는 미확정, 수 시간~하루 뒤 재확인 필요. 수동 업로드 영상(9/28 이전)은 쇼츠 칸에 커버이고 API 영상(9/29~)은 프레임이지만 나이와 분리 안 됨.

**How to apply:** 배포 후 maxres로 저장 확인, 세로 칸은 oar1/2로 확인(읽기 전용, 브라우저로 ytimg 이미지 열기). 세로 칸에 커버가 필요하면 YouTube Studio에서 Owner 계정으로 해당 쇼츠 썸네일을 직접 지정하는 방법을 시험(미검증). 영상 첫 프레임이 곧 세로 칸 후보이므로 훅 씬(카드+헤더)의 첫 장면을 썸네일로도 쓸 수 있게 설계하는 것이 자동 대응. 원문 CURRENT_STANDARDS §5 step 10. 관련: [[project-bull-ep11-deployed-2026-09-30]].
