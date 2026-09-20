# C:\tmp 정리 대상 목록 (조사만 완료, 삭제는 아직 안 함)

전체 C:\tmp: 333개 폴더, 13.21GB

## 확실한 삭제 후보 — 총 126개 폴더, 약 5.89GB

| 카테고리 | 개수 | 용량 | 내용 |
|---|---|---|---|
| 부엉박사 편별 구버전(owl-ep5~9 assembly/episode-final) | 33 | 2.39GB | 최신판(v8/v8/v5/v4/v9)만 남기고 이전 버전 전부 |
| 금박사 편별 구버전(geumbaksa-ep1~5 assembly/episode-final) | 15 | 1.23GB | 최신판(v5/v2/v3/v2/v2)만 남기고 이전 버전 전부 |
| CTA 실험 폴더(확정본 제외) | 12 | 0.15GB | `geumbaksa-cta-assembly-v2`(헤더 겹침 버그 있던 그 파일) 포함 |
| PIQ 트레이딩 관련 | 45 | 2.04GB | Money Shorts OS와 완전 무관, 다른 프로젝트 |
| 캐릭터 결정 전 실험(char-probe-*) | 12 | 0.07GB | owl3dv5/coin3dv1 확정 이전 후보들 |
| 다른 프로젝트명(blog-auto-*, home-problem-lab-*) | 9 | 0.0002GB | 용량은 미미 |

## 추가 확인 필요 — 144개 폴더, 약 3.17GB (삭제 후보로 단정 안 함)

- **owl-ep1/ep2 구세대 명명 폴더 11개(약 1.2GB)**: `owl-assembly`, `owl-assembly-v2~v7-final`, `owl-final-v2~v4`, `owl-episode2-final` 등 — 편 번호가 이름에 없어서 1~2편 중 어느 최종본인지 자동 판단 위험. **이게 1~2편의 실제 배포본 원본일 수 있어 확인 필요.**
- **씬/모션 중간산출물 약 40개(1.35GB)**: `owl-ep{N}-{scene수}scene`, `*-motion-final`, `*-veo-motion` 등 — episode-final에 이미 흡수됐을 가능성 높지만 개별 확인 필요
- **카드뉴스/퍼블리시 계열**: `owl-cardnews-ep1~9`, `geumbaksa-cardnews-ep1~4`, `*-publish-*`, `*-story-*` — 오늘 조사 범위에 없었음, 배포 이력 자산이라 보존 판단 필요
- **정체불명 32개**: `ma023c-*`, `invest-desk-*`, `ian-next-1626-*`, `omd-shots`, `demo-video` 등 — 프로젝트 무관 여부 재확인 필요

## 절대 보존(확정)

- `owl-cta-fixed-v2\owl_cta_fixed_v2_final_v6.mp4`, `geumbaksa-cta-fixed-clean\geumbaksa_cta_clean_final.mp4`
- `owl-ep6~9-episode-final-v8/v8/v5/v4`, `geumbaksa-ep5-episode-final-v2`, `geumbaksa-cardnews-ep5`
- `money-shorts-os\` 폴더 전체(TTS 원본 음성 자산 — 절대 통째로 삭제 금지, 필요시 개별 파일 단위로만 추후 검토)

## 다음 결정이 필요한 사항

1. "확실한 삭제 후보"(126개, 5.89GB)부터 먼저 삭제 진행할지
2. "추가 확인 필요" 중 카드뉴스/퍼블리시 계열과 owl-ep1/ep2 구세대 폴더는 별도로 한 번 더 조사해서 확정할지
