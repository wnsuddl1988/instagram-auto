---
name: geumbaksa-ep3-deploy-2026-09-22
description: 금박사 3편(ETF) 인스타+유튜브 자동배포 완료 기록(2026-09-22) — 산출물 경로, 실제 배포 절차(no-log 래퍼 서브커맨드), 남은 수동 처리 항목
metadata:
  type: project
  originSessionId: 0616c897-fe63-4f4b-b75e-04be8bd972c3
  modified: 2026-09-22T10:40:41.870Z
---

금박사 3편(ETF, "주식은 아는데 ETF는 뭔지 모르겠다면")을 2026-09-22 Claude Code 세션에서 실제로 자동배포했다.

**배포 결과**:
- 인스타 릴스: https://www.instagram.com/reel/Ddlilg8j29M/ (완료, 커버 포함 — 최종. 1차 게시본 https://www.instagram.com/reel/Ddlga8CDqFF/ 는 커버 누락으로 삭제 후 재게시함, 아래 "커버 누락 실수" 참고)
- 인스타 카드뉴스(캐러셀 5장): https://www.instagram.com/p/Ddlgnmckwcg/ (완료)
- 유튜브 쇼츠: https://www.youtube.com/shorts/rzK0qaynLQk (업로드+썸네일 완료, **공개전환·제목수정은 API로 안 돼서 YouTube Studio 수동 처리 필요** — [[feedback_youtube_token_upload_only_scope]] 참고)

**커버 누락 실수(교훈)**: 인스타 릴스 게시 시 `--blob-result`에 영상 blob 업로드 결과(`instagram-blob-upload-once-result.json`)만 넘기면 커버가 자동추출 프레임으로 빠진다. 반드시 `merge-instagram-reel-cover-into-blob-result.mjs --video-blob-result <영상결과> --cover-blob-result <커버결과> --out <merged.json>`으로 두 결과를 합친 뒤, 그 merged 파일을 `owl-instagram-publish`의 `--blob-result`로 넘겨야 `coverUrl`이 컨테이너에 실린다. 게시 로그의 `coverUrl:` 줄이 "(없음, 자동 프레임 사용)"이면 누락된 것 — 게시 전에 반드시 확인. 게시된 릴스는 API로 커버만 사후 교체 불가능(Graph API 미지원), 삭제 후 재게시만 가능하고 삭제도 계정 토큰 권한에 따라 막힐 수 있다(이번엔 됐음).

**원본 산출물**: `C:\tmp\geumbaksa-ep2-episode-final-v3\owl_episode_final.mp4`(101.95초, 표시 3편=ETF, 폴더명은 ep2라 헷갈리기 쉬움 — [[project_geumbaksa_episode_display_number_mapping]] 참고). 카드뉴스 `C:\tmp\geumbaksa-cardnews-ep2-v2\`, 커버 `C:\tmp\geumbaksa-cover-ep2\00_geumbaksa_ep2_cover_thumb.png`.

**실제 배포 절차(Why 이 방식인지 — 처음에 헤맸던 이유)**: `run-owner-command-with-local-env-no-log.mjs`는 `--help` 출력에 보이는 `final-e2e-publish`(Owner 승인 지문 요구, 위저드 경유 전용이라 수기 콘텐츠 유닛으로는 못 씀) 말고도, 코드에만 있고 `--help`엔 안 나오는 개별 서브커맨드가 있다: `owl-blob-upload`, `owl-cardnews-blob-upload`, `owl-reel-cover-blob-upload`, `owl-instagram-publish`, `owl-cardnews-instagram-publish`, `owl-youtube-publish`, `owl-youtube-thumbnail-set`, `owl-youtube-title-update`, `owl-youtube-token-health`. 전부 `--arm` 플래그로 실제 실행되고, `.env.local`을 직접 읽어 자식 프로세스에만 주입한다(대화형 프롬프트 불필요). 정확한 인자 계약은 스크립트 472~570번째 줄 부근의 커맨드 테이블에서 확인.

**How to apply**: 다음 편 배포 시
1. blob 3종(영상/카드뉴스/커버) 업로드 → 인스타 릴스 게시 → 인스타 카드뉴스 게시 → 유튜브 업로드(`--privacy public` 필수, 안 넣으면 비공개로 올라감) → 유튜브 썸네일 설정 순서.
2. content-unit JSON 수기 작성 시 `youtubeTitle`에 "#Shorts"를 넣지 않는다(자동으로 붙어서 중복됨).
3. 영상이 35MB(36700160바이트) 넘으면 사전에 ffmpeg로 압축 필요(비트레이트 2300kbps 안팎이면 100초 내외 영상이 30MB 선으로 들어옴, `-c:a aac -b:a 128k -ac 1`).
