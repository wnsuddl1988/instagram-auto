---
name: project-bull-ep3-deploy-2026-09-25
description: "황소특보 3편(반도체 랠리 착시, 외국인 종목별 반대 베팅) 배포 완료 기록 — 대본구조 v2 최초 적용편, 카드뉴스 제외 4종 배포"
metadata:
  type: project
  originSessionId: 96dabe12-0224-46cf-9034-b0b64d75918f
  modified: 2026-09-25T01:11:59.584Z
---

2026-09-25 배포 완료. [[project_bull_script_structure_v2_confirmed]](10씬, 반전 1개+체크리스트 구조)의 최초 실전 적용편이자, [[feedback_cardnews_scope_owl_only_2026_09_25]](카드뉴스는 부엉박사만) 확정 이후 첫 황소특보 배포 — 카드뉴스 없이 4종(영상+커버+스토리+유튜브)만 배포함.

## 배포 결과
- **Instagram Reels**: https://www.instagram.com/reel/DdsPw-Vj6D1/ (mediaId 18014100269752344, coverUrl 정상 지정)
- **Instagram Story**: mediaId 18109955906335281 (24시간 후 만료, 카드뉴스 게시물 아님 — 전용 스토리 스펙으로 9:16 별도 생성)
- **YouTube Shorts**: https://www.youtube.com/shorts/rv9o1EwzA3E (videoId rv9o1EwzA3E, public, 썸네일 set)

## 제작 경위 요약
- 소재: 주간동아·파이낸셜뉴스(2026-09-25 발행) — 외국인이 삼성전자는 3거래일간 2조59억원 순매수, SK하이닉스는 2조2,795억원 순매도로 정반대 베팅.
- 팩트체크로 파이낸셜뉴스의 "간밤 미 국채금리 급등, 3대지수 하락" 서술을 배제(주간동아 반대 보도 + Alpha Vantage 실측과 배치, [[project_bull_ep3_assembly_spec]] 파일 주석 참고).
- 대본 3차 재설계 끝에 확정 — 1·2차 시도는 반전 후 "여러 해석 나열"·"제3자 인용"으로 흘러 Owner 반려, moneyhunter_kr/ggu_tech 벤치마크 분석 후 "확인할 것 2가지" 체크리스트로 완결.
- s6 영상 1차 생성분이 7초 지점부터 카드·의상 붕괴 → 프롬프트에 PROP LOCK/WARDROBE LOCK 강화 문구 추가해 재생성 성공.
- 카드뉴스 스펙 파일을 만들지 않음(방침 확정 이후 최초 편) — 커버·스토리만 신규 작성: `_bull-cover-ep3-spec.mjs`, `_bull-story-ep3-spec.mjs`.

## 산출물 경로
- 최종 영상: `C:/tmp/bull-ep3-episode-final-v1/owl_episode_final.mp4` (91.00초)
- 배포용 압축본: `C:/tmp/bull-ep3-publish/bull_ep3_compressed.mp4` (25.5MB)
- 커버/썸네일: `C:/tmp/bull-ep3-publish/cover/00_bull_ep3_cover_thumb_1080x1920.png`
- 스토리: `C:/tmp/bull-ep3-publish/story/01_bull_ep3_story_cover_1080x1920.png`

관련: [[project_bull_script_structure_v2_confirmed]], [[feedback_cardnews_scope_owl_only_2026_09_25]], [[feedback_deploy_procedure_must_follow_exactly]]
