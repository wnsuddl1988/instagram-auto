---
name: youtube-token-upload-only-scope
description: YOUTUBE_REFRESH_TOKEN이 업로드 전용 스코프만 가지고 있어 제목수정/공개전환 등 videos.update 계열 작업이 전부 막혀있음 — Claude 실수 아님
metadata:
  type: feedback
  originSessionId: 0616c897-fe63-4f4b-b75e-04be8bd972c3
  modified: 2026-09-22T10:35:40.731Z
---

`.env.local`의 `YOUTUBE_REFRESH_TOKEN`은 `youtube.upload` 스코프만 가진 토큰이다. `owl-youtube-token-health` 진단 결과 "채널 조회 불가(업로드 전용 토큰)"으로 명확히 확인됨(2026-09-22, 금박사 3편 배포 중).

**증상**: `run-owl-youtube-title-update-once.mjs`(제목만 수정) 호출 시 `videos.update` 단계에서 항상 "Request had insufficient authentication scopes" 오류. 공개범위(privacyStatus) 변경도 같은 API를 쓰므로 동일하게 막힘.

**Why**: 업로드(`videos.insert`)는 되지만 수정(`videos.update`)은 `youtube` 또는 `youtube.force-ssl` 스코프가 추가로 필요한데, 현재 토큰 발급 시 그 스코프가 빠져 있다. 업로드 스크립트가 제목에 "#Shorts"를 자동으로 한 번 더 붙이는 결함([[feedback_youtube_shorts_title_duplicate]] 있으면 참고)까지 겹치면, 제목을 고칠 방법이 API로는 없다.

**How to apply**: 앞으로 유튜브 업로드 시
1. `--privacy public`을 반드시 처음부터 지정해서 업로드한다(사후 공개전환 불가).
2. `youtubeTitle` 필드에 "#Shorts"를 미리 넣지 않는다(업로드 스크립트가 자동으로 붙이므로 중복됨) — 이번 3편에서 이 실수로 "#Shorts #Shorts"가 됐고 API로 못 고쳐서 YouTube Studio 수동 수정이 필요했다.
3. 업로드 후 제목/공개범위를 잘못 넣은 게 발견되면 API 재시도하지 말고 즉시 YouTube Studio(studio.youtube.com) 수동 수정으로 안내한다 — 토큰 재발급(OAuth 재인증)은 Owner가 필요하다고 판단할 때만, 별도로 요청받았을 때 진행한다.
