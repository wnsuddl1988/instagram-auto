# 스토리 1~15편 사실 자료·대본 위치표 (CASE 내보내기 준비, 2026-10-14)

목적: 경제번역소 CASE(`C:\Users\PC\jjy\econ-case`)로 내보낼 스토리편 원자료 위치를 한곳에 고정한다. 내보내기 스크립트는 이 표를 기준으로 만든다(형식은 CASE 창 기획서 부록 A가 확정 — 확정 전엔 스크립트 작성 보류).

## 원칙
- **나레이션 원본 = TTS 대본 파일**(`C:/tmp/money-shorts-os/story-ep{N}-tts/story-ep{N}-tts-script.json`, 장면별 `captionDisplayText`). 실제 영상에 나간 문장이다. `C:/tmp/story-*/scenes-v*.json`은 작업본이라 판이 여러 개이고, 조립 스펙 주석의 판 번호가 최종과 어긋난 경우가 있다(10편: 스펙 주석 v5, 실제 최종 v6 — 10/11 TTS 대본과 같은 시각).
- **사실·출처 원본 = 소재 검증 파일**(`C:/tmp/story-topic-vetting/*.json`, `facts[]`에 claim·numeric·economy·status·sources[name,url,quote], `verification`에 원문 대조 결과). 16편 이후는 `_ai/story-pipeline-backup-2026-10-12/facts/facts-ep{N}.json`에도 사본.
- 편 번호 = 게시 번호 = 조립 스펙 번호(`scripts/_story-ep{N}-assembly-spec.mjs`). 작업 폴더 이름의 숫자는 제작 당시 번호라 다를 수 있다(예: 5편 화형식 = `story-ep7-anycall`).
- **게시된 편만 내보낸다**(CASE 미게시편 스포일러 금지). 게시 여부 = `_ai/story-performance-ids.json`.

## 위치표
| 편 | 소재 | 게시 | 작업 대본(최종) | 소재 검증 파일(사실 수) |
|---|---|---|---|---|
| 1 | 금 모으기 | ✅ DeLkk-AgYOC / hvkOkqvYw1g | `story-ep1-gold/gold-scenes-final.json` | **없음** — 검증 체계 도입 전 편. CASE로 만들려면 사실 2출처를 새로 정리해야 함 |
| 2 | 삼성 반도체(도쿄 선언) | ✅ DeOD_hzFM5H / LAve_4Cp0tY | `story-ep2-samsung/samsung-scenes-v6.json` | `samsung-tokyo-declaration-1983.json`(27) |
| 3 | 정주영 500원 | ✅ DeQrlLdiIto / wd1l7PACzag | `story-ep3-hyundai/hyundai-scenes-v1.json` | `hyundai-500won-1971.json`(21) |
| 4 | 대우 해체 | ❌ **미게시**(완성본 `story-ep4-assembled-v2/story_ep4_mastered.mp4` 48.2MB, 게시 전 압축 필요) | `story-ep4-daewoo/daewoo-scenes-v1.json` | `daewoo-breakup-1999.json`(24) |
| 5 | 삼성 애니콜 화형식 | ✅ DeTa6q1lRqD / D8qmSqsvS5Q | `story-ep7-anycall/scenes-v9.json` | `samsung-anycall-burning-1995.json`(19) |
| 6 | 현대 10년 보증 | ✅ DeV85uLiRZM / VFELyLHmMsk | `story-ep6-hyundai-warranty/scenes-v9.json` | `hyundai-warranty-90s.json`(18) |
| 7 | 배달의민족 전단지 | ✅ DeYYsagiP_r / Ae8re-WZ6iU | `story-ep8-baemin/scenes-v9.json` | `baemin-2019.json`(15) |
| 8 | LG 휴대폰 철수 | ✅ Dea29Q_j30b / gtlPZkfsc4w | `story-ep8-lg-exit/scenes-v6.json` | `lg-exit-2021.json`(22) |
| 9 | 하나로통신 ADSL | 미게시(재고) | `story-ep9-hanaro/scenes-v3.json` | `hanaro-adsl-1999.json`(10) |
| 10 | 유한킴벌리 4조 2교대 | 미게시(재고) | `story-ep10-yuhan-kimberly/scenes-v6.json` | `yuhan-kimberly-4jo2gyo.json`(12, 원문 대조 manual 10건) |
| 11 | 포스코 청구권 자금 | 미게시(재고) | `story-ep11-posco/scenes-v7.json` | `story-ep11-posco-claims-fund.json`(10) |
| 12 | 디즈니 플로리다 땅 | 미게시(재고) | `story-ep12-disney-florida/scenes-v5.json` | `story-ep12-disney-florida-land.json`(9) |
| 13 | 쿠쿠 자기 브랜드 | 미게시(재고) | `story-ep13-cuckoo/scenes-v7.json` | `story-ep13-cuckoo-own-brand-1998.json`(9) |
| 14 | 닌텐도 울트라 핸드 | 미게시(재고) | `story-ep14-nintendo/scenes-v10.json` | `story-ep14-nintendo-hanafuda-ultrahand.json`(21) |
| 15 | 한진해운 | 미게시(재고) | `story-ep15-hanjin/scenes-v8.json` | `story-ep15-hanjin-shipping-2016.json`(10) |

(작업 대본 경로는 `C:/tmp/` 기준. 16~25편 검증 파일은 `story-topic-vetting/story-ep{16..25}-*.json`.)

## 확인된 빈칸·주의
1. **1편 금 모으기는 사실 장부가 없다.** CASE 게이트(2출처 미달 숫자 차단)를 통과하려면 사실 정리를 새로 해야 한다. 정리 전에는 1편을 CASE에서 뺀다.
2. **4편 대우는 완성본이 있는데 게시 기록이 없다**(5편부터 게시). 게시 여부·순서는 Owner 결정.
3. 검증 파일의 `facts`는 영상에 안 쓴 사실까지 담고 있다. CASE에는 영상 나레이션과 이어지는 사실만 쓰고, 영상에 없는 사실을 쓸 땐 2출처가 있는 항목만.
4. CASE에 필요한 "당시 알 수 있던 정보·실제 선택·선택지"는 지금 어느 파일에도 정해진 칸이 없다(`decisiveFactId`·`beats`·`story-design.json`이 가장 가까움). 누가 작성·검증할지는 CASE 기획서 부록 A에서 정한다.
5. 위 대본·검증 파일과 TTS 대본은 **지우면 안 되는 원본**이다. 정리 스크립트(`cleanup-deployed-assets.ps1`)의 삭제 대상(A 테스트·B 합성 중간본·C 이전 완성본·D 중간 파일·E Veo 클립·이미지·F 금박사·G 캐시·H·I 옛 렌더)에는 들어 있지 않음을 확인(10/14). 정리 스크립트에 새 범주를 넣을 때 이 파일들을 넣지 않는다. `C:/tmp`는 백업이 없으니 내보내기 스크립트가 생기면 내보낸 사본이 2차 보관 역할도 한다.
