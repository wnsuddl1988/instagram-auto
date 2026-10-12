---
name: feedback-youtube-thumbnail-claude-does-it-via-chrome-2026-10-07
description: "★유튜브 썸네일은 Claude가 직접 올린다(Owner 10/7 \"왜 니가 안 올리고 나를 시키냐\") — API thumbnails.set은 쇼츠에 반영 안 됨, Claude in Chrome file_upload로 Studio 업로더(#file-loader)에 커버 JPEG(2MB 이하, scratchpad에 복사)를 넣고 저장, 로컬서버·Playwright CDP 9222는 안 됨"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 44079e93-cb91-40d7-a5f2-8a4f2a547778
  modified: 2026-10-07T06:05:55.955Z
---

- **Owner 지적(10/7)**: 업로드 자동화가 막히자 내가 썸네일 업로드를 Owner에게 넘겼다 → "왜 니가 안 올리고 나를 시키냐". **막히면 다른 길을 끝까지 시도하고, 정말 불가능할 때만 Owner에게 넘긴다(그때도 이유와 시도한 방법을 먼저 말한다).**
- **안 되는 길**: ① API `thumbnails.set` — "set"이라고 나와도 쇼츠 세로 칸·Studio에 반영 안 됨(공개 영상 `XC2eIiES1kg` Studio에서 영상 프레임이 썸네일로 확인). ② 앱 내 브라우저에서 localhost fetch/img — Studio CSP로 막힘. ③ Playwright CDP Chrome(9222) — 그 Chrome엔 채널 계정 로그인 없음("오류가 발생했습니다"). 만들어 둔 `scripts/set-youtube-studio-thumbnail-once.mjs`는 그래서 쓰지 못함(채널 로그인된 CDP Chrome이 생기면 사용).
- **되는 길(Owner "playwright 안 쓰고 Claude in Chrome으로 해도 된다", 10/7 검증)**: `mcp__claude-in-chrome__*`(ToolSearch로 `tabs_context_mcp,navigate,find,file_upload,computer,tabs_close_mcp` 한 번에 로드) → `tabs_context_mcp{createIfEmpty:true}` → `navigate https://studio.youtube.com/video/<id>/edit` → `find "썸네일 파일 업로드 입력칸"`으로 file input ref → **`file_upload`는 세션이 읽을 수 있는 폴더의 파일만 허용 → 커버를 scratchpad로 복사한 JPEG(2MB 이하; 440KB로 변환)** → `find "저장 버튼"` → 클릭 → 5초 기다려 저장 버튼이 회색으로 돌아오고 미리보기에 커버가 들어갔는지 확인 → 탭 닫기(`tabs_close_mcp`). Studio에 9:16 썸네일(최대 2160x3840) 업로더가 있다.
- **배포 절차에 편입**: 유튜브 예약 업로드 직후(영상 처리 중에도 가능) 위 절차로 썸네일을 올리고 보고에 "썸네일 Studio 반영 확인"을 넣는다. 공개 후 세로 칸(채널 쇼츠 탭·검색) 표시는 따로 확인.
- 1편 `hvkOkqvYw1g`: Owner가 수동 업로드한 뒤 Claude가 같은 커버로 자동 업로드를 재시험해 성공(저장 완료).
- 관련 [[feedback_youtube_scheduled_publish_one_hour_after_instagram_2026_10_07]], [[feedback_story_cover_thumbnail_method_2026_10_07]], [[feedback_no_computer_use]].
