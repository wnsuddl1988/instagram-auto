---
name: project-owl-episode-display-number-mapping
description: "부엉박사 표시번호-파일명 매핑표 — Owner 메모장 원본 기준 최신화(2026-09-25), 9편 배포 완료 반영"
metadata:
  node_type: memory
  type: project
  modified: 2026-09-30T13:35:09.568Z
  originSessionId: 96dabe12-0224-46cf-9034-b0b64d75918f
---

**★(2026-09-30 밤 최신) 아래 표는 옛 기록이다. 현재 재고 번호는 [[project-owl-ep16-pension-on-hold-2026-09-30]](표시 16=최저임금·17=전세사기·퇴직연금=번호 없는 예비·새 편 18부터)와 CURRENT_STANDARDS §7 8번 표를 따른다.**

Owner가 컴퓨터에 메모장으로 직접 기록해둔 재고 매핑표(2026-09-25 확인). 이 메모장이 source of truth — 매번 여기서 직접 읽어 재확인할 것, 오래된 세션 기억에 의존하지 말 것.

**메모장 위치**: 저장된 파일이 아니라 Windows 11 메모장의 미저장 탭(TabState 캐시)에 있다. 필요시 `%LOCALAPPDATA%\Packages\Microsoft.WindowsNotepad_8wekyb3d8bbwe\LocalState\TabState\*.bin`을 공유읽기모드로 열어 UTF-16 텍스트를 추출해 확인한다(메모장 프로세스가 파일을 잠그고 있어 일반 읽기는 실패함 — `FileShare]::ReadWrite` 옵션 필요).

## 부엉박사 쇼츠 (2026-09-25 기준)
- **9편(집값·한국은행 경고)**: `C:/tmp/owl-ep9-publish/owl_ep9_compressed.mp4` — **배포 완료(2026-09-24)**. 원래 파일ep14로 제작했던 소재를 신선도 문제로 표시 9번으로 앞당겨 배포함(Owner 결정). IG: instagram.com/reel/DdqpPv8ktA7, YT: youtube.com/shorts/QFmM6k5-o-Y. 실제 소스 스펙은 `_owl-ep14-assembly-spec.mjs`(제목: "집값 잡혔다더니, 한은이 다시 경고등을 켰다") — 폴더명/contentId만 `ep9`를 재사용했을 뿐 내용은 ep14 그대로.
- 10편(카드론·신용점수): `C:\tmp\owl-ep9-episode-final-v-cta-std\owl_episode_final.mp4` — **배포 완료(2026-09-25)**, IG릴스 instagram.com/reel/DdsxH4Qj7U7, YT youtube.com/shorts/E-VqBWJSwQM. 상세: [[project_owl_ep10_display_cardloan_deploy_2026_09_25]]
- 11편(국민연금): `C:\tmp\owl-ep10-episode-final-v-cta-std\owl_episode_final.mp4` — 미배포 재고
- 12편(고용률): `C:\tmp\owl-ep11-episode-final-v-cta-std\owl_episode_final.mp4` — 미배포 재고
- 13편(토지거래허가구역): `C:\tmp\owl-ep12-episode-final-v-cta-std\owl_episode_final.mp4` — 미배포 재고
- 14편(퇴직연금): `C:\tmp\owl-ep13-episode-final-v-cta-std\owl_episode_final.mp4` — 미배포 재고
- 15편(실업급여): `C:/tmp/owl-ep15-episode-final-v3/owl_episode_final.mp4` — 미배포 재고
- 16편(최저임금): `C:/tmp/owl-ep16-episode-final-v1/owl_episode_final.mp4` — 미배포 재고

- 17편(청약통장 전환기한 연장, 파일 ep17): 2026-09-26 영상 생성 완료·검수 대기. 옛 구조(오프닝→훅) 유지.

**파일명 rename 안함, 표시번호만 재배정.** 17편부터는 파일 번호 = 표시 번호. ★다음 신규는 18편(파일 ep18) — 오프닝을 훅 뒤로 옮기는 첫 편.★ 현행 원문은 `_ai/CURRENT_STANDARDS.md` §7.

## 황소특보
- 1~4편 배포 완료. 다음 5편(v3 구조).

## 금박사
- 번호·경로는 [[geumbaksa-episode-display-number-mapping]]. 5~9편 배포본은 `-final-v2voice`(새 목소리). Owner 메모장의 `-episode-final-v12`는 옛 여성 목소리본.

## 고정 CTA 경로 (현행)
- 부엉박사: `C:\tmp\owl-cta-fixed-v2\owl_cta_fixed_v2_final_v6.mp4`
- 금박사: `C:\tmp\geumbaksa-cta-fixed-clean\geumbaksa_cta_clean_final_v3voice.mp4` (새 목소리, 5편 이후. 메모장의 `geumbaksa_cta_clean_final.mp4`는 옛 여성 목소리)
- 황소특보: `C:\tmp\bull-cta-fixed-v5\bull_cta_fixed_final_with_captions.mp4`

관련: [[feedback_daily_triple_publish_order_2026_09_25]], [[project_geumbaksa_character_and_operating_principles]]
