---
name: project-owl-ep10-display-cardloan-deploy-2026-09-25
description: "부엉박사 표시10편(카드론·현금서비스, 파일ep9) 4종 배포 완료 기록 — 스토리 이미지 신규 생성, 커버 merge 누락 실수 기록"
metadata:
  node_type: memory
  type: project
  modified: 2026-09-25T08:12:22.460Z
  originSessionId: 96dabe12-0224-46cf-9034-b0b64d75918f
---

2026-09-25 배포 완료. [[project_owl_episode_display_number_mapping]] 기준 표시 10편(파일명 ep9, "카드론·현금서비스가 신용점수를 깎는 구조").

## 배포 결과
- **Instagram Reels**: https://www.instagram.com/reel/DdsxH4Qj7U7/ (mediaId 18074681513448850)
- **Instagram 카드뉴스**: https://www.instagram.com/p/Ddsxe-XEzTU/ (mediaId 18242362339315160, 4장)
- **Instagram Story**: mediaId 18355018288301674 (24시간 후 만료)
- **YouTube Shorts**: https://www.youtube.com/shorts/E-VqBWJSwQM (videoId E-VqBWJSwQM, public, 썸네일 set)

## 실수 기록 — 다음 배포 시 반드시 순서 지킬 것
★릴스 커버 merge 단계를 빠뜨림★ — [[feedback_deploy_procedure_must_follow_exactly]]에 명시된 "커버 merge 필수" 원칙을 어기고, `owl-reel-cover-blob-upload`를 실행하지 않은 채 바로 `owl-instagram-publish`를 실행했다. 결과적으로 릴스가 Instagram 자동 프레임 추출 커버로 게시됨(Owner가 편별로 새로 디자인하는 커버를 못 씀).

**사후 조치 확인 완료(2026-09-25)**: Instagram Graph API 공식 문서 확인 결과, 게시 완료된 IG Media(Reels)의 `cover_url`을 사후 수정하는 엔드포인트는 존재하지 않는다(Update 지원 항목은 `comment_enabled`뿐). 재게시하려면 기존 게시물을 삭제하고 처음부터 다시 올려야 하며, 그 경우 기존 좋아요/노출이 초기화된다. **Owner 결정: 이 릴스는 그대로 둔다(재게시하지 않음).** YouTube 쪽은 썸네일이 정상 반영되어 영향 없음.

다음 배포부터는 반드시 순서: ①영상 blob 업로드 ②**reel-cover blob 업로드+merge** ③instagram-publish ④카드뉴스 ⑤스토리 ⑥유튜브.

## 산출물 경로
- 원본 최종 영상: `C:\tmp\owl-ep9-episode-final-v-cta-std\owl_episode_final.mp4` (81.24초, 48MB)
- 배포용 압축본: `C:/tmp/owl-ep10-display-publish/owl_ep10_display_compressed.mp4` (25.5MB, `-b:v 2500k -maxrate 2700k`)
- 카드뉴스: `C:\tmp\owl-cardnews-ep9\`(4장, 기존 자산 재사용)
- 커버 썸네일: `C:\tmp\owl-cover-ep9\00_owl_ep9_cover_thumb_1080x1920.png`(원본 941x1672 → 1080x1920 리사이즈)
- 스토리: 신규 생성 `C:\tmp\owl-story-ep9\01_owl_ep9_story_cover_1080x1920.png` (신규 스펙 파일 `_owl-story-ep9-spec.mjs` 작성)
- 배포 작업 폴더: `C:/tmp/owl-ep10-display-publish/`

## 폴더명 명명 혼선 관련
`C:\tmp\owl-ep9-episode-final-v-cta-std`(파일ep9=카드론)와 `owl-ep9-episode-final-display`(실제로는 파일ep14=한은경고 내용물)이 이름이 겹쳐 혼동을 유발했다. 어제 세션에서 한은경고 편을 표시 9번으로 앞당겨 배포하며 폴더명을 급하게 재사용한 결과. 향후 유사한 순서 조정 시 폴더명에 소재 키워드를 포함해 혼동을 피할 것.

관련: [[project_owl_episode_display_number_mapping]], [[feedback_deploy_procedure_must_follow_exactly]]
