---
name: project-bull-ep16-candidates-scan-2026-10-03
description: "황소특보 16편 소재 풀스캔(2026-10-03 토, 휴장 10/3~10/5·개장 10/6 화) 결과 — 1순위 삼성 자사주 15조 매입 10/6 종료(Owner 보관 1번), 2순위 외국인 비반도체 9개월 순매수, 3순위 법원 시총 상폐 위법 가처분, 4순위 삼성 잠정실적 D-5. Owner 선택 대기"
metadata:
  node_type: memory
  type: project
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-10-05T09:22:33.716Z
---

**요청(2026-10-03, Owner "황소특보 다음편 주제 선정하자"):** `run-bull-topic-full-scan-once.mjs` 새로 실행(11단계 전부 성공, 부엉 교차 포함) → `C:/tmp/bull-topic-scan-ep16/`(SCAN_CHECKLIST·CANDIDATE_POOL_bull 188건·owl-cross 185건). 웹 보강으로 최초일·수치 대조. 황소 장부 15편까지 → **다음은 16편**.

**Owner 보관 소재 먼저 제안(10/2 지시 이행):** 자사주 15조 10/6 종료(1번)·삼성 잠정실적×원화 강세(2번). 새 사실: 삼성은 계획 5,328만 5,968주를 100.96%(5,380만 주) 채우고도 15조 한도(누적 약 14.16조)까지 추가 매입, 종료 6일; SK하이닉스는 신고 2,407만 주 중 1,835만 주, 하루 60~65만 주, 10월 중순 종료 전망. 잠정실적은 이투데이 10/3 "8일 예정"(회사 공시 전·일정표 10/7 미확정), 컨센서스 9월 초 113.1조→109.5조(원화 강세).

**추천 순위(내 판단):** ①자사주 종료(기한 10/5까지, 반도체 쏠림 경고 3/5 표시) ②외국인이 반도체 팔면서 9개월째 담은 비반도체(신세계·달바·KCC 9개월, 셀트리온·APR·대한항공 등 8개월, 쏠림 없음, 13편 반대면) ③법원 "시총 미달만으로 상폐 안 돼"(서울남부지법 10/2, 주연테크·케이엠제약 가처분 인용, 시총 300억 기준 조기 적용 2027.1.1→2026.7.1·소명 배제 위법, 쏠림 없음) ④삼성 잠정실적 D-5 ⑤대미투자 2,000억 달러 원전주 시큰둥 ⑥테슬라 3분기 인도 48만 6,532대(-2%, 기대 상회) ⑦앤트로픽 11월 상장 ⑧미 고용 부진→금리 인상 우려 후퇴 ⑨솔리다임 상장설 ⑩외국인 일본 77조.

**제외·주의:** 마이크론(14편)·현대차(15편)·외국인 순매도(13편) 중복, 증권사 리포트(14편 반려 이력), 정치·개인사(최태원·파월·트럼프 발언). 종목 실명은 허용리스트(삼성전자·SK하이닉스·현대차·애플·테슬라·구글)만 — 상폐 기업·신세계·달바는 섹터/일반화로.

**★진행(2026-10-03, Owner "1~3번 소재로 3개 편을 만들자, 오늘 내일 중으로 3개 배포"):** 대본 3종 초안 완성(자사주 16씬 605자·외국인 비반도체 16씬 614자·상폐 15씬 551자, 검사기 반드시 수정 0, 새 독자 점검 통과·Q4 조치) — 문서 `_ai/bull-ep16-18-scripts-draft.md`, 파일 `C:/tmp/bull-ep16-draft/{buyback,foreign-nonsemi,delisting}-scenes-v3.json`. 권장 순서 자사주(기한 10/5)→외국인→상폐. **Owner 결정 대기: 대본 확정·TTS 승인(3회), 외국인 편 종목 실명 허용 여부, 상폐 편은 법률신문 전문·거래소 공시 확인 필요(요약기마다 금액·시점이 달랐음).** 병목은 Owner Veo 생성(황소 3편 + 부엉 20·21편 대기분).

**★진행(2026-10-03 오전, Owner "1번 진행해, 종목 실명은 허용하고 상폐 편은 원문 확인 후 확정"):** **황소 16편 = 자사주 편(A)** 대본 확정·TTS 113.32초(`C:/tmp/money-shorts-os/bull-ep16-tts/output-v1`, 정렬 보정 불필요, 최대 씬 7.79초)·스펙 `scripts/_bull-ep16-assembly-spec.mjs`·이미지 16장(1차 통과)·영상 프롬프트 `_ai/bull-ep16-video-generation-prompts.md`(8초 4·10초 12) 완료, 체크리스트 `_ai/bull-ep16-production-checklist.md`, **Owner Veo 영상 대기**. **종목 실명 허용 → B(외국인) v4에 신세계·달바글로벌·KCC·셀트리온·에이피알·대한항공, C(상폐) v4에 주연테크·케이엠제약 실명 반영**(`foreign-nonsemi-scenes-v4.json`·`delisting-scenes-v4.json`, 검사기 0). **C 원문 확인 완료**: 회사 공시(주연테크 사건 2026카합1541 코스피, 케이엠제약 2026카합1532 코스닥 — "본안판결 확정시까지 상장폐지결정 효력 정지·정리매매 금지, 본안 확정 판결 아님") + 법률신문(코스닥 상장규정 54조 1항 12호·부칙 2조 1항). B·C는 TTS 대기(Owner 지시 전).

**★진행(2026-10-03 낮, Owner "16편 영상 검수→이상 없으면 최종조립+CTA+커버 보여줘, 그리고 2번 외국인(B)·상폐(C) 차례로"):** **16편(자사주)**: Veo 16개 검수(길이 티어 일치·카드 글자 보존·입 꼬리 s7·s12 보통) → 조립·CTA PASS(2916/2916)·워터마크 제거·오디오 마감 -14.1 LUFS·QA 반드시 수정 0(captionBoundaryExceptions 2건 + edge-review.json)·커버 "자사주 종료/진짜 볼 건?" 164px — 최종 `C:/tmp/bull-ep16-final/owl_episode_final_mastered.mp4`(58.5MB), 커버 `C:/tmp/bull-cover-ep16/00_bull_ep16_cover_thumb.png`. 압축·콘텐츠 유닛·배포는 Owner 지시 대기(10/5까지, 게시 직전 매입 종료·잠정실적 날짜 재확인). **번호: 17편=B 외국인 비반도체(TTS 123.80초, 스펙 `scripts/_bull-ep17-assembly-spec.mjs`), 18편=C 상폐(TTS 103.40초, 스펙 `scripts/_bull-ep18-assembly-spec.mjs`)**, 체크리스트 `_ai/bull-ep17·18-production-checklist.md`. 이미지 생성 러너는 한 장이라도 실패하면 종료함 → `--scene-spec-only 2,3,…`로 이어서 생성(ep17 s2 완료 감지 timeout으로 1장만 만들고 종료한 사례). 이후 영상 프롬프트 → Owner Veo 대기.

**★16편 배포 완료(2026-10-03, Owner "16편 배포해줘"):** 릴스 https://www.instagram.com/reel/DeA5B2dCPA0/ , 유튜브 https://www.youtube.com/shorts/i5K_ik3-F8Y (public, 썸네일 set), 스토리 mediaId 18078682274528937. 압축 28.0MB·배포 전 게이트 실패 0·커버 merge·`--privacy public` 절차 그대로. 장부 16편 반영+17·18편 제작 중 등록(테스트 14/14). 폴더 `C:/tmp/bull-ep16-publish/`. 남은 것: 17·18편 Veo 영상 대기, 유튜브 썸네일 maxres 반영 확인, 잠정실적 공시 후 후속 편(약속), 커밋은 Owner 승인 대기.

**★17편(외국인 비반도체) 완성(2026-10-03 저녁, Owner "황소 17편이야, 검수→조립+CTA+QA+커버"):** Veo 16개 검수(길이·카드 글자 정상, 입 꼬리 보통 s2·5·6·7·10·15·16) → 조립 123.8초 → CTA PASS(3167/3167, 132.0초)·워터마크 제거·오디오 마감 -14.2 LUFS·QA 반드시 수정 0(edge-review.json 기록, s13 카드 하단이 자막에 맞닿음=Owner 판단) → 커버 "외국인 매도/산 종목 있다" 164/155px. 최종 `C:/tmp/bull-ep17-final/owl_episode_final_mastered.mp4`(59.6MB), 커버 `C:/tmp/bull-cover-ep17/00_bull_ep17_cover_thumb.png`, 커버 스펙 `scripts/_bull-cover-ep17-spec.mjs`. **배포는 Owner 지시 대기**(게시 직전 수치 재확인). 커버 헤드라인은 공백 포함 6자도 138px로 미달 → 5자+6자(공백 포함)로 단축해 통과. 18편(상폐) Veo 영상 대기.

**★18편(상폐 규정 법원 제동) 완성(2026-10-03 저녁, Owner "18편 영상 생성본, 검수→조립+CTA+QA+커버"):** Veo 15개 검수(카드 글자·배경 정상, **s3만 8초로 도착=요청 10초와 다름, 씬 길이보다 0.28초 짧아 조립기가 8.0초에서 잘라 처리**, 입 꼬리 보통 s2·6·11·13·14) → 조립 103.4초 → CTA PASS(2678/2678, 111.6초)·워터마크 제거·오디오 마감 -14.2 LUFS·QA 반드시 수정 0 → 커버 "시총 상폐에/법원 제동!" 164/179px(1차 와인→핑크는 붉은 계열이라 폐기, 미드나이트 플럼→실버 라벤더로 재생성). 최종 `C:/tmp/bull-ep18-final/owl_episode_final_mastered.mp4`(48.5MB), 커버 `C:/tmp/bull-cover-ep18/00_bull_ep18_cover_thumb.png`, 커버 스펙 `scripts/_bull-cover-ep18-spec.mjs`. **배포는 Owner 지시 대기**(게시 직전 거래소 항고·본안 일정 재확인, 종목 실명 법적 위험은 Owner 몫). 황소 16편 배포 완료·17·18편 완성 상태.

**★17편 배포 → Owner 삭제 → 재배포(2026-10-03):** 1차 배포(릴스 DeBsvFCAY5J·유튜브 -OmDFEfZgMg)는 커버 문구 "외국인 매도/산 종목 있다"가 어색·뜻 어긋남으로 Owner가 삭제. **현재 게시본(재배포)**: 커버 "외국인 팔 때/산 종목들?" 155/179px, 릴스 https://www.instagram.com/reel/DeBuTfKo3yJ/ , 유튜브 https://www.youtube.com/shorts/beZeuN-uplc (public, 썸네일 set), 스토리 mediaId 18110979184877998. 새 contentId `…-2026-10-03-v2`·폴더 `C:/tmp/bull-ep17-publish-v2/`·커버 `C:/tmp/bull-cover-ep17-v2/`. 옛 스토리(17987749158115024)는 24시간 만료. 교훈 [[feedback-cover-headline-must-read-naturally-2026-10-03]]. 남은 것: 18편 배포 지시 대기(게시 직전 거래소 항고·본안 일정 재확인, **18편 커버 "시총 상폐에/법원 제동!"도 뜻·자연스러움 재점검**), 유튜브 썸네일 반영 확인, 커밋은 Owner 승인 대기.

**★18편(상폐 규정 법원 제동) 배포 완료(2026-10-04, Owner "황소특보 18편 배포하자"):** 릴스 https://www.instagram.com/reel/DeDfxdUiObV/ , 유튜브 https://www.youtube.com/shorts/6BhhvurEWzU (public, 썸네일 set), 스토리 mediaId 17994978282044802. 게시 직전 웹 재확인(항고 보도 없음, 대사·캡션 일치), 압축 27.2MB·게이트 실패 0·커버 merge·`coverUrl` 확인·`--privacy public` 절차 그대로. 폴더 `C:/tmp/bull-ep18-publish/`. 황소 16·17·18편 배포 완료 → 19·20·21편 Veo 대기.

**★19편(S&P500 80%↓ AI만↑)·20편(엔비디아 GPU 담보) 배포 완료(2026-10-05):** 20편 릴스 DeGFqelAV4R·유튜브 Q3JJduBB2po. 19편은 10/4 저녁 예정이었으나 누락(Owner도 배포한 줄 알았음) → 20편 뒤 "19편 올려줘"로 늦게 게시: 릴스 https://www.instagram.com/reel/DeGI_W5jUQ3/ , 유튜브 https://www.youtube.com/shorts/lefyytPG7N0 (public, 썸네일 set), 스토리 mediaId 17931263028403462. 폴더 `C:/tmp/bull-ep19-publish/`. **교훈: 배포 직후 장부·체크리스트에 즉시 기록해야 누락을 알아챈다(게시 여부는 publish 폴더·인사이트로 확인).** 남은 것: 황소 21편(Veo 대기).

**★21편(메모리 가격 상승 둔화×삼성 잠정실적) 제작 완료(2026-10-05, Owner Veo 영상 수령 후):** 검수(16개 이상 없음)·조립 1차 성공(117.8초)·CTA PASS(125.96초)·워터마크 제거·마감(54.7MB, -14.1 LUFS)·QA 필수 수정 0(edge-review 기록 후)·커버 "오르는 속도/꺾였다고?" 164/191px(1차 "오르는 속도가"는 138px 게이트 미달). 폴더 `C:/tmp/bull-ep21-final/`, 커버 `C:/tmp/bull-cover-ep21/`. **오늘 저녁 게시 예정(Owner 지시 대기), 게시 직전 삼성 잠정실적 공시 여부(10/8 예상)·D램·낸드 수치 재확인.** 첫 3초 실험은 22편부터(21편 none).

**How to apply:** Owner가 고르면 팩트 원문 재확인(DART 자기주식 취득 결과·거래소 일별 매입, 잠정실적 날짜) → 대본 → 검사기 → 규칙 29 새 독자 점검 → Owner 확정 → TTS(검사기 추정과 실측이 어긋날 수 있으니 560~600자 안팎, [[project_owl_ep20_topic_scan_2026_10_02]] 교훈). 미결: 어느 소재로 갈지, 게시 시점.

관련: [[project_bull_ep15_candidates_hold_samsung_buyback_2026_10_02]], [[feedback_bull_topic_list_everything_fresh_no_skew_filter_2026_10_01]].
