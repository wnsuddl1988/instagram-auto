---
name: project-story-ep1-gold-deployed-2026-10-07
description: "스토리형 1편(금 모으기) 최종 배포 기록(3번째 게시) — 릴스 DeLgYFXjbRA·스토리·유튜브 gLVLqZ4Po_0 예약(14:32 KST), 앞 두 번은 영상 제목 띠가 인스타 피드 크롭에 잘려 Owner가 삭제. 영상 제목 띠 headerTopY 345로 재조립(assembled16)"
metadata:
  node_type: memory
  type: project
  originSessionId: 44079e93-cb91-40d7-a5f2-8a4f2a547778
  modified: 2026-10-07T04:32:42.849Z
---

- **최종(2026-10-07 04:31Z = 13:31 KST) 게시**: 인스타 릴스 https://www.instagram.com/reel/DeLgYFXjbRA/ (AI 라벨 `aiLabelApplied: true`, 커버 v10), 스토리 mediaId 18220089463350131, 유튜브 `gLVLqZ4Po_0` 비공개 예약 `publishAt 05:32Z`(14:32 KST, 인스타 1시간 뒤), 썸네일 v10 set. 영상 = `C:/tmp/story-ep1-assembled16/story_ep1_mastered.mp4`(QA 반드시 수정 0), 게시 폴더 `C:/tmp/story-ep1-publish-v3/`(콘텐츠 유닛 version v3).
- **앞 두 번 게시는 Owner가 삭제**: 1차(04:19Z)·2차(04:25Z) 릴스·스토리·유튜브 `k_jqe18tv3A`. 원인 = **영상 속 상단 제목 띠(headerTopY 232 ≈ 12%)의 첫 줄이 인스타 피드 4:5(위 15% 크롭)·그리드 3:4(위 12.5%)에서 잘림**. 나는 처음 커버 탓으로 오진해 커버만 두 번 고쳤다(Owner 스크린샷은 커버가 아니라 재생 중 영상 프레임이었음). **교훈: "화면에 이렇게 뜬다" 스크린샷은 재생 영상인지 커버인지 먼저 구분하고, 게시 전 영상 프레임(1초·12초 등)을 4:5·3:4로 크롭해 확인한다.**
- 황소·부엉 설명형은 같은 위치 제목인데 Owner가 "문제없었다"고 확인 → 설명형은 그대로(headerTopY 기본 232), **스토리형만 `headerTopY: 345`·`headerScrimHeight: 780`**(스펙 옵션, QA가 story_v1이면 headerTopY ≥ 326 아니면 반드시 수정).
- 금값 재확인: 10/6 온스당 약 $4,170 → 227톤 ≈ 304억 달러. 블롭 업로드 첫 시도 "service not available"는 일시 장애(결과 파일 `.failed-1.json`으로 옮겨 재시도).
- 관련 [[feedback_story_cover_thumbnail_method_2026_10_07]], [[feedback_youtube_scheduled_publish_one_hour_after_instagram_2026_10_07]], [[feedback_caption_tidy_planner_and_story_assembly_checklist_2026_10_07]].
