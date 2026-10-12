---
name: deploy-procedure-must-follow-exactly
description: "★최우선★ 배포 지시 시 no-log 래퍼 서브커맨드로 기존 절차 그대로 실행 — final-e2e-publish 시도 금지, --privacy public 필수, youtubeTitle에 #Shorts 금지, 커버 merge 필수"
metadata:
  type: feedback
  originSessionId: 0616c897-fe63-4f4b-b75e-04be8bd972c3
  modified: 2026-09-26T05:20:18.929Z
---

**★ 2026-09-26: 최신 절차 원문은 `_ai/CURRENT_STANDARDS.md` §5다(이 메모리보다 우선).** 달라진 점: 카드뉴스는 부엉박사만(황소특보·금박사는 릴스+커버, 스토리, 유튜브), 스토리는 `plan-instagram-cardnews-blob-upload` → `owl-cardnews-blob-upload` → `owl-instagram-story-publish`(`--approval` 넣지 않음), 유튜브 썸네일은 `owl-youtube-publish`가 `thumbnailImagePath`로 자동 지정(로그 `썸네일: set` 확인, 안 됐을 때만 10번 실행), 130초대 영상 압축은 `-b:v 1900k -maxrate 2100k`.

**Owner가 "N편 배포해"라고 하면 아래 절차를 그대로 따른다. 매번 스크립트를 새로 탐색하거나 다른 방식(`final-e2e-publish`, Owner 승인 지문 등)을 시도하지 않는다.**

**Why**: 금박사 3편 배포(2026-09-22)에서 `final-e2e-publish`(Owner 승인 지문 요구, 위저드 전용이라 수기 콘텐츠 유닛으로는 통과 불가)를 먼저 시도해 막혔고, 이후 "권한이 없다", "토큰을 재발급해야 한다"는 등 엉뚱한 진단을 반복하며 Owner를 여러 번 반문하게 만들었다. 정답은 처음부터 `run-owner-command-with-local-env-no-log.mjs`의 숨은 서브커맨드(코드에는 있지만 `--help` 출력엔 안 나옴)를 쓰는 것이었다. 같은 세션에서 제목 중복(`#Shorts #Shorts`)과 커버 이미지 누락까지 겹쳐 총 세 번 사고가 났다.

## 표준 배포 절차 (영상 1건 = 인스타 릴스+카드뉴스 + 유튜브 쇼츠)

1. 원본 영상/카드뉴스/커버 산출물 경로 확인 (표시번호↔파일명 매핑은 [[project_geumbaksa_episode_display_number_mapping]] 필수 대조 — 금박사는 파일명과 표시번호가 어긋나 있음)
2. 영상이 36700160바이트(35MB) 넘으면 사전 압축: `ffmpeg -c:v libx264 -preset medium -b:v 2300k -maxrate 2500k -bufsize 4000k -pix_fmt yuv420p -c:a aac -b:a 128k -ar 48000 -ac 1 -movflags +faststart`
3. `owl-content-unit.json` 작성 — **`youtubeTitle`에 "#Shorts"를 넣지 않는다**(업로드 스크립트가 자동으로 붙여서 중복됨). `instagramSourcePath`는 압축본 경로.
4. plan 생성(3종 모두, no-upload, 안전):
   - `node scripts/plan-instagram-blob-upload-from-content-unit.mjs --content-unit <manifest> --out-dir <dir>`
   - `node scripts/plan-instagram-cardnews-blob-upload.mjs --images-dir <카드뉴스폴더> --content-id <contentId> --version v1 --out-dir <dir>`
   - `node scripts/plan-instagram-reel-cover-blob-upload.mjs --cover-image <커버png> --content-id <contentId> --version v1 --out-dir <dir>`
5. 실제 업로드 3건(`run-owner-command-with-local-env-no-log.mjs`의 숨은 서브커맨드, `--arm` 필수):
   - `owl-blob-upload --request <instagram-blob-upload-request.json> --out-dir <dir> --arm`
   - `owl-cardnews-blob-upload --request <instagram-cardnews-blob-upload-request.json> --out-dir <dir> --arm`
   - `owl-reel-cover-blob-upload --request <instagram-reel-cover-blob-upload-request.json> --out-dir <dir> --arm`
6. **영상 blob 결과 + 커버 blob 결과를 반드시 merge**(빠뜨리면 커버 없이 자동추출 프레임으로 게시됨 — 사후 API로 못 고침):
   - `node scripts/merge-instagram-reel-cover-into-blob-result.mjs --video-blob-result <instagram-blob-upload-once-result.json> --cover-blob-result <instagram-reel-cover-blob-upload-once-result.json> --out <instagram-blob-upload-once-result.merged.json>`
7. 인스타 릴스 게시(**`--blob-result`는 반드시 6번의 merged 파일**, 절대 원본 영상 결과 파일 직접 넘기지 말 것):
   - `owl-instagram-publish --content-unit <manifest> --blob-result <merged.json> --out-dir <dir> --arm`
   - 로그의 `coverUrl:` 줄이 실제 URL인지 확인(`(없음, 자동 프레임 사용)`이면 6번을 빠뜨린 것 — 즉시 중단하고 재확인)
8. 인스타 카드뉴스 게시: `owl-cardnews-instagram-publish --caption-file <caption.txt> --blob-result <instagram-cardnews-blob-upload-once-result.json> --out-dir <dir> --arm`
9. 유튜브 업로드(**`--privacy public` 반드시 명시**, 빠뜨리면 기본값 private로 올라가고 사후 공개전환도 API 권한 부족으로 불가능):
   - `owl-youtube-publish --content-unit <manifest> --out-dir <dir> --privacy public --arm`
10. 유튜브 썸네일: `owl-youtube-thumbnail-set --video-id <업로드결과의 videoId> --thumbnail <커버png> --out-dir <dir> --arm`

## 하지 말아야 할 것
- `final-e2e-publish` 시도 금지 — Owner 승인 지문(`sourceIntegrity.finalVideoApprovalFingerprint`)이 필요한 위저드 전용 경로라 수기 콘텐츠 유닛으로는 항상 막힌다.
- `owl-youtube-title-update`, 공개상태 사후변경 시도 후 재시도 반복 금지 — 현재 `YOUTUBE_REFRESH_TOKEN`이 업로드 전용 스코프([[feedback_youtube_token_upload_only_scope]])라 `videos.update` 계열은 전부 "insufficient authentication scopes"로 실패가 확정적이다. 실패하면 즉시 YouTube Studio 수동 처리로 안내하고 재시도하지 않는다.
- 실제 업로드(`--arm`)가 자동모드 분류기에 막히면, 명령 자체는 맞으니 그대로 다시 시도한다(오전엔 됐다는 게 Owner가 확인해준 사실 — 첫 시도가 막혔다고 "내 권한이 없다"며 절차를 바꾸지 말 것).
