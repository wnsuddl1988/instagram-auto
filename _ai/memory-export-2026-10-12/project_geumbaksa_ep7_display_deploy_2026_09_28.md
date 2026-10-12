---
name: project-geumbaksa-ep7-display-deploy-2026-09-28
description: "금박사 표시7편(신용점수, 파일 ep5) 수동 배포 완료 — 릴스/유튜브 링크"
metadata:
  node_type: memory
  type: project
  originSessionId: 96dabe12-0224-46cf-9034-b0b64d75918f
  modified: 2026-09-28T09:53:37.811Z
---

금박사 **표시 7편**(소재: 신용점수, 실제 파일은 `ep5`, [[project_geumbaksa_episode_display_number_mapping]] §7 매핑)을
2026-09-28 Owner가 수동 배포 완료.

- 인스타 릴스: https://www.instagram.com/reel/Dd0492RvjIW/
- 유튜브: https://youtube.com/shorts/PNPHQhwfsIE

**Why**: Vercel Blob 스토어(`instagram-auto-instagram-media-prod`)가 Hobby 플랜
한도로 정지되어 자동 파이프라인(Blob 업로드→배포)을 쓸 수 없었음. Owner가 Vercel
대시보드 스크린샷으로 정지 상태를 직접 확인시켜줌("Access resumes on 26.9.28"
표시에도 불구하고 실제 리셋 미반영 확인) → 자동 재시도 없이 바로 수동 배포로
진행.

**사용한 자산**(최종본, §7 표 기준):
- 영상 원본: `C:/tmp/geumbaksa-ep5-final-v4std/owl_episode_final.mp4`(36.8MB, CTA
  결합 PASS 확인됨) → 압축본 `C:/tmp/geumbaksa-ep5-publish/geumbaksa_ep5_compressed.mp4`(18MB, 1900k)
- 릴스 커버: `C:/tmp/geumbaksa-cover-ep5/00_geumbaksa_ep5_cover_thumb.png`(941x1672, 원본 그대로 사용)
- 유튜브 썸네일: 원본을 `ffmpeg scale=1080:1920`로 리사이즈한
  `C:/tmp/geumbaksa-ep5-publish/geumbaksa_ep5_cover_1080x1920.jpg`(레터박스 버그 방지)
- 스토리: `C:/tmp/geumbaksa-story-ep5/01_geumbaksa_ep5_story_cover.png`
- 제목/캡션/설명 소스: `C:/tmp/geumbaksa-ep5-publish/owl-content-unit.json`(2026-09-26 작성 초안 그대로 사용)

**How to apply**: 이후 "금박사 N편 배포" 요청 시 §7 표에서 표시번호→파일번호
매핑을 먼저 확인하고, 폴더명에 있는 숫자만으로 소재를 판단하지 말 것(예:
`geumbaksa-cover-ep7-*` 폴더들은 실제로는 표시 5편(예금자보호) 소재였음 —
반드시 이미지를 직접 열어 텍스트 내용으로 확인). 다음 신규는 11편(파일 ep11).
