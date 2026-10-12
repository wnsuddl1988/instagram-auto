---
name: project-cta-layout-v2-remake-2026-09-30
description: "황소특보·부엉박사 고정 CTA를 화면 배치 v2로 재제작(2026-09-30) — 새 경로, 바뀐 점, 재생성 명령, 카드 위치를 상단에 못 두는 이유"
metadata:
  node_type: memory
  type: project
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-09-30T04:47:39.707Z
---

Owner 지시(2026-09-30 "CTA 황소·부엉 재제작")로 완료. 영상·음성은 새로 만들지 않고 글자 배치만 다시 입힘.

- 황소특보: `C:\tmp\bull-cta-fixed-v6\bull_cta_fixed_final_layout_v2.mp4` (8.33초, 11편부터). 옛 v5 폐기.
- 부엉박사: `C:\tmp\owl-cta-fixed-v3\owl_cta_fixed_v3_final_layout_v2.mp4` (14.96초, 15편부터). 옛 v6 폐기.
- 재생성: `node scripts/run-cta-layout-v2-rerender-once.mjs --character bull|owl` (원본 mux + 확정 ASS 타이밍 재사용, 부엉은 TTS alignment 기준 블록 재분할 `blockOverrides`).
- 결합 스크립트 `KNOWN_CTA_LEADING_SILENCE_TRIM_SEC`에 등록됨(황소 0.15, 부엉 0.5, 실측 무음이 옛 파일과 동일). 황소10·부엉18 시험 결합 PASS.
- 배치: 하단 채널바 없음, 자막 y1290·폭760·84, 카드는 왼쪽 두 줄 y970~1162.
- **카드를 상단에 두면 안 됨**: 결합 스크립트가 편 제목 헤더(y232~440)를 CTA follow 구간 위에 얹어서 겹침(한 번 겹쳐서 옮김).
- 줄바꿈 규칙에 소유 표현 추가: 내·우리·저희 뒤에서 줄 끊기 금지(`_caption-linebreak-ko.mjs` DETERMINER, 테스트 30개 PASS).

**Why:** 옛 CTA 자막(y1449~1551)과 채널바가 폰 하단 UI(유튜브 제목 y1510+, 인스타 계정명 y1720+)에 가려졌음. **How to apply:** 본편 결합 시 `--cta-clip`에 위 새 경로만 사용. 이전 메모리 [[owl-fixed-cta-v6-confirmed]], [[project_bull_cta_final_confirmed]]는 역사 기록. 원문 CURRENT_STANDARDS §1·§3.
