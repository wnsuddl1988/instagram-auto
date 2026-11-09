---
name: project-bull-ep6-deploy-2026-09-28
description: 황소특보 6편(삼성전자 3분기 배당 마지막 매수일) 수동 배포 완료 — Vercel Blob 스토어 정지로 자동 파이프라인 우회
metadata:
  node_type: memory
  type: project
  modified: 2026-09-28T06:02:08.959Z
  originSessionId: 96dabe12-0224-46cf-9034-b0b64d75918f
---

2026-09-28 배포 완료(Owner 직접 수동 업로드). 소재 시의성 마지노선(오늘이 삼성전자
배당 마지막 매수일)이라 자동 파이프라인 대신 수동으로 처리.

## 배포 결과
- **Instagram Reels**: https://www.instagram.com/reel/Ddz1XhcToBx/
- **YouTube Shorts**: https://youtube.com/shorts/6ZVskG7TYTk

## 배경 — 왜 수동 배포였나
- Vercel Blob 스토어(`instagram-auto-instagram-media-prod`)가 Hobby 플랜 사용량
  한도 초과로 정지(`Vercel Blob: This store has been suspended.`). 47개 파일
  (316MB) 삭제 후에도 정지 유지 확인(용량 확보만으로는 즉시 안 풀림).
- 2026-09-28 08:xx, 09:xx 두 차례 재시도(`owl-blob-upload --arm`)에도 동일 에러 —
  이 시점까지는 스토어가 재개되지 않은 상태였다.
- Owner가 압축본 영상+커버+스토리 이미지를 직접 받아 웹브라우저로 인스타그램·
  유튜브에 수동 업로드. 캡션·제목·설명은 `C:/tmp/bull-ep6-publish/owl-content-unit.json`
  원문 그대로 사용.
- **커버 이미지 크롭 문제(인수인계 문서에 미해결로 기록됐던 것)는 Owner 확인 결과
  이미지 자체는 정상 생성됐고, Owner가 업로드 시 비율 조정을 잘못한 것이 원인이었다
  — 이미지 생성 파이프라인·세이프존 규칙 문제가 아니다.** 다음에 비슷한 크롭 현상이
  보이면 이미지 재생성보다 업로드 시 비율 설정을 먼저 확인할 것.

## 산출물 경로(참고용, 그대로 둠)
- 압축 영상: `C:/tmp/bull-ep6-publish/bull_ep6_compressed.mp4`(32.7MB)
- 커버(=유튜브 썸네일): `C:/tmp/bull-ep6-cover/00_bull_ep6_cover_thumb.png`
- 스토리: `C:/tmp/bull-ep6-story/01_bull_ep6_story_cover.png`
- 콘텐츠 유닛: `C:/tmp/bull-ep6-publish/owl-content-unit.json`

관련: [[project_bull_script_structure_v3_confirmed_2026_09_26]]
