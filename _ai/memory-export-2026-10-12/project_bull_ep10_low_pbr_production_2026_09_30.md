---
name: project-bull-ep10-low-pbr-production-2026-09-30
description: "황소특보 10편(11/2 저PBR 공표 × 10/22 공시 마감) 제작 경위와 교훈, 최종본 위치, 배포 대기 상태"
metadata:
  node_type: memory
  type: project
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-09-30T01:52:27.610Z
---

황소특보 10편 "11월 2일, 저PBR 명단이 내 증권앱에 뜬다" (17씬, 본편 119.8초, 최종 128.0초). 소재는 추천순위 후보 12개 중 1번(외국인 170조 vs 코스피 63%)을 Owner가 "결국 삼성전자 얘기 = 반도체 쏠림"이라고 지적해 접고, 제도 변경형 저PBR 공표로 전환. 2026-09-30 제작 완료 후 **배포 완료: 릴스 instagram.com/reel/Dd5MZRaks2t, 유튜브 youtube.com/shorts/8tSCrplyAVI, 스토리 게시**(배포 폴더 `C:/tmp/bull-ep10-publish/`, 압축본 31.3MB, 커버 merge 확인, 썸네일 set). 최종 `C:/tmp/bull-ep10-final/owl_episode_final.mp4`, 커버 `C:/tmp/bull-ep10-cover`, 스토리 `C:/tmp/bull-ep10-story`, 스펙 `scripts/_bull-ep10-assembly-spec.mjs`.

**Why (교훈):**
1. PBR 설명은 Owner가 정의(주가 ÷ 주당순자산BPS)로 직접 교정 — 비유(가게 지분·몸값) 폐기, 저PBR을 "나쁜 것"으로 프레임 금지(가치주/성장 둔화, 기대/거품 시각차는 양쪽 다 서술). "PBR이 뭘까?"로 정의 질문 후 "저PBR"은 기준 씬에서 등장.
2. `--semi` 판정은 제목이 아니라 실질 주인공(종목명 없어도 삼성전자·SK하이닉스 얘기면 yes) — CURRENT_STANDARDS §3 반영.
3. TTS: 1차 136.4s → 대사 압축 3회차 119.8s. 자수 추정은 6.0자/초(숫자 적은 대본), 씬 간 간격은 씬당 약 1.0~1.2초.
4. 배경은 편마다 소재에 맞게, 한 편 안 3구역(규칙 14). ChatGPT는 구도 규칙을 보드 씬에서만 부분 반영(카드·오프닝 씬은 캐릭터가 60~76%로 나와 Owner 판단으로 수용). 2,700자 넘는 지시문은 생성 감지 timeout 위험.
5. 자동화용 Chrome(9222, AI-GPT-1 프로필)이 응답 없으면 스크립트가 연결 timeout — 자동 종료는 권한 분류기가 막으므로 Owner가 창을 닫아야 함.

**How to apply:** 배포 시 거래소 공시 원문 재대조(11/2, 10/22, 25%/10%, 6년 특례) 후 CURRENT_STANDARDS §5 절차대로. 배포 후 `BULL_EPISODE_LEDGER`에 ep10 추가. 관련: [[feedback-bull-scene-background-vary-per-episode-2026-09-30]], [[feedback-bull-topic-search-procedure-and-ranking-2026-09-30]].
