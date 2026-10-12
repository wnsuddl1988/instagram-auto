---
name: project-geumbaksa-ep4-display-leverage-deploy-2026-09-25
description: "금박사 표시4편(레버리지, 파일ep3) 4종 배포 완료 기록 — 릴스 커버 merge 정확히 적용해 누락 없이 완료"
metadata:
  node_type: memory
  type: project
  modified: 2026-09-25T09:33:31.796Z
  originSessionId: 96dabe12-0224-46cf-9034-b0b64d75918f
---

2026-09-25 배포 완료. [[project_geumbaksa_episode_display_number_mapping]] 기준 표시 4편(파일명 ep3, "다들 무섭다고만 하는 레버리지, 정확히 뭘까"). [[project_owl_ep10_display_cardloan_deploy_2026_09_25]]에서 놓쳤던 릴스 커버 merge 단계를 이번엔 정확히 포함해 누락 없이 완료.

## 배포 결과
- **Instagram Reels**: https://www.instagram.com/reel/DdtJKNAkuqF/ (mediaId 17903281242352053) — 커버 정상 반영 확인("커버 URL 확인: HTTP 200, image/png" 로그로 확인)
- **Instagram Story**: mediaId 17904849852571562 (24시간 후 만료)
- **YouTube Shorts**: https://www.youtube.com/shorts/uqcA4Hz94V4 (videoId uqcA4Hz94V4, public, 썸네일 set)
- 카드뉴스는 [[feedback_cardnews_scope_owl_only_2026_09_25]] 원칙에 따라 제작·배포하지 않음(금박사는 카드뉴스 중단)

## 정확한 배포 순서(성공 사례로 재확인)
1. `plan-instagram-blob-upload-from-content-unit.mjs` → `owl-blob-upload --arm` (영상)
2. `plan-instagram-reel-cover-blob-upload.mjs` → `owl-reel-cover-blob-upload --arm` (커버)
3. `merge-instagram-reel-cover-into-blob-result.mjs`로 영상+커버 blob 결과 병합 → `.merged.json`
4. `owl-instagram-publish --arm --blob-result <merged.json>` — 이 순서를 지키면 로그에 "커버 URL 확인: HTTP 200"이 뜨고 컨테이너 생성 시 cover_url이 정상 지정됨
5. 스토리: `plan-instagram-cardnews-blob-upload.mjs`(images-dir 방식) → `owl-cardnews-blob-upload --arm` → `owl-instagram-story-publish --arm`
6. `owl-youtube-publish --arm`

## 산출물 경로
- 원본 최종 영상: `C:\tmp\geumbaksa-ep3-episode-final-v4\owl_episode_final.mp4` (98.2초, 38.3MB)
- 배포용 압축본: `C:/tmp/geumbaksa-ep4-display-publish/geumbaksa_ep4_display_compressed.mp4` (29.8MB)
- 커버: `C:\tmp\geumbaksa-cover-ep3\00_geumbaksa_ep3_cover_thumb_1080x1920.png` (원본 941x1672 → 리사이즈)
- 스토리: 신규 생성 `C:\tmp\geumbaksa-story-ep3\01_geumbaksa_ep3_story_cover_1080x1920.png` (신규 스펙 `_geumbaksa-story-ep3-spec.mjs` 작성)
- 배포 작업 폴더: `C:/tmp/geumbaksa-ep4-display-publish/`

## 목소리 관련 참고
이 편(표시4편=파일ep3=레버리지)은 지난 세션에서 원본 이미지/영상 자산이 유실되어 새 목소리(Yohan Koo) 재조립 없이 **기존 여성 목소리(Hana Lee) 그대로 배포**하기로 확정된 편이다([[project_geumbaksa_character_and_operating_principles]] 참고). 5편부터는 새 목소리로 전면 교체됨.

관련: [[project_geumbaksa_episode_display_number_mapping]], [[feedback_deploy_procedure_must_follow_exactly]], [[project_owl_ep10_display_cardloan_deploy_2026_09_25]]
