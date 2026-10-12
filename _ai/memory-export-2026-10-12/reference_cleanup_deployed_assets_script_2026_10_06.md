---
name: reference-cleanup-deployed-assets-script-2026-10-06
description: "배포 완료 편의 합성·중간 산출물 정리 스크립트(scripts/cleanup-deployed-assets.ps1) — 미리보기 기본, 삭제는 Owner가 -Execute로 직접 실행(Claude는 파일 영구 삭제를 하지 않음)"
metadata:
  node_type: memory
  type: reference
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-10-06T06:43:50.711Z
---

Owner(2026-10-06): "배포해서 정리해도 되는 영상·이미지 합성본 삭제해줘" → Claude는 영구 삭제를 직접 하지 않고 `scripts/cleanup-deployed-assets.ps1`(미리보기 기본, `C:\tmp\cleanup-plan.txt` 저장)을 만들어 Owner가 실행하게 안내.

**범위**: 황소 1~21편·부엉 파일 ep22 이하 배포 완료분만(황소 22편 `bull-ep22*`·부엉 파일 ep23 `owl-v2-ep23*`·고정 CTA·캐릭터 참조는 안전장치로 절대 제외). 기본 A 테스트·감사 / B 합성 중간본(assembly·cta-merge) / D 완성본 폴더 중간 파일 → 약 23.1GB(2026-10-06 측정). 선택: `-OldFinals` 이전 버전 완성본(약 7.8GB, 옛 편은 게시본이 아닌 버전이 남을 수 있음), `-Sources` Veo 원본 클립·이미지(약 4GB), `-Geumbaksa` 금박사(약 8.2GB), `-RepoCache` 저장소 .next(약 2.1GB).

**배포/게시 후 정리 시점이 오면** 이 스크립트를 먼저 미리보기로 돌려 목록·용량을 보고하고 삭제는 Owner에게 맡긴다. 숫자 한계: 황소 22편 게시 뒤엔 스크립트 상단 `$limits`(bull 21 / owl-v2·owl 22)를 올려야 새로 배포한 편도 포함된다. 관련: Blob 자동 삭제는 별개([[feedback_blob_published_retention_cleanup_2026_09_28]]).
