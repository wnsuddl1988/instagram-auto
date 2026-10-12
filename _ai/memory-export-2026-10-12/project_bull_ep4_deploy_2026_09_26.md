---
name: project-bull-ep4-deploy-2026-09-26
description: 황소특보 4편(MLCC 품절+반도체 증설, v3 대본구조 최초 실전편) 배포 완료 기록 — 카드뉴스 제외 3종(릴스+스토리+유튜브) 배포
metadata:
  type: project
  originSessionId: 96dabe12-0224-46cf-9034-b0b64d75918f
  modified: 2026-09-26T05:22:46.598Z
---

2026-09-26 배포 완료. [[project_bull_script_structure_v3_confirmed_2026_09_26]](v3, 14씬·643자·127.2초)의
최초 실전 적용편. [[feedback_cardnews_scope_owl_only_2026_09_25]]에 따라 카드뉴스는 만들지 않고
릴스+스토리+유튜브 3종만 배포.

## 배포 결과
- **Instagram Reels**: https://www.instagram.com/reel/DdvNSe9k5_U/ (mediaId 18629814973058310, coverUrl 정상 지정)
- **Instagram Story**: mediaId 17922928845425824 (24시간 후 만료)
- **YouTube Shorts**: https://www.youtube.com/shorts/gCCC5Z6nyy0 (videoId gCCC5Z6nyy0, public, 썸네일 set)

## 배포 전 처리
- 최종본(`owl_episode_final.mp4`, 135.42초, 54.68MB)이 35MB 한도 초과 → ffmpeg로 압축(`-b:v 1900k -maxrate 2100k`)해 32.9MB로 재인코딩, 표준절차([[feedback_deploy_procedure_must_follow_exactly]]) 그대로 따름.
- 이미지 생성 스크립트 셀렉터 드리프트([[feedback_chatgpt_image_ui_selector_drift_2026_09_26]]) 수정 후 커버·스토리 이미지 정상 생성.

## 산출물 경로
- 배포용 압축 영상: `C:/tmp/bull-ep4-deploy/bull_ep4_final_compressed.mp4` (32.9MB)
- 커버/썸네일: `C:/tmp/bull-cover-ep4/00_bull_ep4_cover_thumb.png`
- 스토리: `C:/tmp/bull-story-ep4/01_bull_ep4_story_cover.png`
- 콘텐츠 유닛/blob 결과/게시 결과 전부: `C:/tmp/bull-ep4-publish/`

## ⚠ 배포본 결함(배포 후 발견, 2026-09-26)
- CTA 결합 스크립트가 당시 하드컷만 해서, 본편 화면이 126.42초에 끝났는데 마지막 멘트("…댓글로 남겨줘")는 126.97초까지 이어져 끝부분이 CTA 화면 위로 들리고, CTA 첫 프레임이 약 0.8초 정지한다.
- 스크립트에 표준 절차를 내장한 뒤 다시 결합한 개선본: `C:/tmp/bull-ep4-final-v2/owl_episode_final.mp4`(135.42초, 프레임·A/V 검증 PASS, 발화 사이 무음 0.30초). 재배포(기존 게시물 삭제·재업로드) 여부는 Owner 결정 대기.

## 절차상 확인 사항
- 유튜브 업로드 스크립트가 이번엔 업로드 단계에서 썸네일까지 자동 설정함(별도 `owl-youtube-thumbnail-set` 불필요했음, 이전 편들과 차이 — 스크립트가 개선됐을 가능성, 다음 편에서도 자동 설정되는지 재확인).
- 스토리 게시는 `owl-instagram-story-publish` 서브커맨드에 `--approval` 플래그가 없음(계약에 없는 인자라 즉시 실패) — 승인 토큰은 스크립트 내부에서 자동 처리되는 구조. 다음엔 바로 `--content-unit/--cardnews-blob-result/--out-dir/--slide-index/--arm`만 넘길 것.

관련: [[project_bull_script_structure_v3_confirmed_2026_09_26]], [[feedback_cardnews_scope_owl_only_2026_09_25]], [[feedback_deploy_procedure_must_follow_exactly]], [[feedback_chatgpt_image_ui_selector_drift_2026_09_26]]
