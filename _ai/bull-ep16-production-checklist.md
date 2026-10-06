# 황소특보 16편 제작 체크리스트 — 삼성전자 자사주 매입 종료, 진짜 볼 건 실적 — 규칙 23·26·27·29

> ⛔ = 코드가 막는 게이트, 👁 = 사람이 눈으로 보고 기록을 남겨야 하는 단계. 증거(명령·파일)를 적고 못 본 것은 "못 봄"으로 적는다. **게시 기한: 삼성 자사주 종료 10/6 전(10/5까지), 시점은 Owner 지시.** 같은 날 만든 B(외국인 비반도체)·C(상폐) 대본은 `_ai/bull-ep16-18-scripts-draft.md`.

## 0. 시작 전
- ✅ CURRENT_STANDARDS를 그 세션에서 직접 열어 읽음(2026-10-03): 규칙 11·13·17·22·26~29, §3 황소 v3·성공 공식·엔딩 5박자.
- ✅ `scripts/_bull-ep16-assembly-spec.mjs` 없음 확인 후 새로 만듦.

## A. 소재·대본
- ✅ 소재 탐색: `run-bull-topic-full-scan-once.mjs` 11단계 ✅(`C:/tmp/bull-topic-scan-ep16/`), 후보 25개 → Owner 1~3번 확정 → "1번 진행해". 10/2 보관 지시(자사주 종료 먼저 제안) 이행.
- ✅ 팩트: 삼성 공시 보도·파이낸셜뉴스·서울경제·이투데이·시사저널e·아시아경제(10/1~10/3). **못 봄: DART 자기주식 취득 결과·거래소 일별 매입 원문, 삼성 잠정실적 공시일(보도 8일·일정표 10/7 미확정).**
- ⛔✅ 대본 검사: v3 **반드시 수정 0 · 확인 권장 3 · 통과 16**, 16씬·605자 — `C:/tmp/bull-ep16-draft/buyback-scenes-v3.json`.
- ✅ 새 독자 읽기 점검(규칙 29) 2회 통과, Q4 조치(훅 "진짜 볼 건 실적이야", 주식 수·금액 한도, 두 회사 명시, 목적↔수급 연결, 조심할 것 명확화) → 초안 문서 A절.
- ✅ **Owner 대본 확정**("1번 진행해", 2026-10-03).
- ⬜ 장부 `BULL_EPISODE_LEDGER` 16편 추가는 배포 후(규칙: 편 배포 후 끝에 추가).

## B. 음성
- ✅ TTS 스크립트 JSON `C:/tmp/money-shorts-os/bull-ep16-tts/bull-ep16-tts-script.json`(빌더 `C:/tmp/bull-ep16-draft/build-bull16-tts.mjs`): 어절 수 일치·세그먼트 ≤8어절·읽기에 숫자 없음 **경고 0건**, `hookType: "T1"`, baseSpeed 1.05, 읽는 표기("오천삼백이십팔만", "십사조 천오백육십오억", "이삼일", "시월 육일", "십일월 이십일일", "일조 사천팔백팔십육억", "에스케이하이닉스", "구월 초 백십삼조·백구조 원대", "칠십육퍼센트").
- ⛔✅ `owl-tts --character bull --arm`: 래퍼의 대본 기준 검사 통과 → **API 1/1**, 16씬, 타임라인 **113.32초**(+CTA 8.33초≈121.6초), 요약 `output-v1/elevenlabs-scene-paced-tts-summary.json`.
- ✅ 씬별 최대 **7.79초(s15)**, 전부 9.5초 이내. 정렬 밀림 점검: 최대 -0.16초 → **보정할 씬 없음**(원본 정렬·summary 사용). 못 본 것: TTS 청취("에스케이하이닉스", "일조 사천팔백팔십육억" 읽기).

## C. 스펙·이미지
- ✅ 스펙 `scripts/_bull-ep16-assembly-spec.mjs`(BULL_EP16_ASSEMBLY_SPEC): hookType T1, sceneBackgrounds A 주주 환원 금고 로비 / B 수급 저울 광장 / C 실적 발표장(직전 편들과 겹치지 않는 새 공간, 글자·숫자 없음), 16씬 shot(wide 3·medium 12·close 1)·bg·motion(card2 12·open 4), 헤더 "자사주 매입 끝, / 삼성전자 진짜 / 볼 건 실적". 스펙 대사·장면 키가 TTS JSON과 16/16 일치(자동 대조), 같은 구역 같은 샷 3연속 없음(s5 배경 A→B로 수정), 검사기(--spec-module) 반드시 수정 0.
- ✅ 이미지 16장 생성(2026-10-03, `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character bull3dv1 --scene-spec ./_bull-ep16-assembly-spec.mjs --scene-spec-export BULL_EP16_ASSEMBLY_SPEC --out-dir C:/tmp/bull-ep16-images`, CDP 9222): **16장 모두 1차 생성, 재생성 0회**, 파일 `C:/tmp/bull-ep16-images/bull_ep16_s{1..16}.png`.
- 👁 안전선 시트(`safe-zone-sheet-all.png`) 씬별 판정: s1 카드 '자사주 매입 끝/진짜 볼 건 실적' ✅ · s2 와이드 인사 ✅ · s3 카드 '공시한 5,328만 주/이미 다 샀어' ✅ · s4 카드 '쓴 돈/14조 1,565억 원'(원본 확인: 카드 가로 24~76%, 글자 끝 약 73%) ✅ · s5 카드 '종료 10월 6일/당초 11월 21일' ✅ · s6 카드 '10/2 기타법인/1조 4,886억 순매수' ✅ · s7 와이드 양손 펼침 ✅ · s8 카드 '수급은 줄고/실적이 더 중요' ✅ · s9 카드 '자사주 = 회사가/직접 사는 물량' 글자가 상대적으로 작지만 읽힘 ✅(영상에서 뭉개지면 재생성) · s10 클로즈 카드 '공시한 목적/임직원 주식 보상' ✅ · s11 카드 '눈높이 113조에서/109조대로 하향' ✅ · s12 와이드 턱 괴기 ✅ · s13 카드 '수급 하나가 빠지고/빈자리는 실적' ✅ · s14 카드 '① 잠정실적 눈높이/② 하이닉스 종료 뒤' ✅ · s15 카드 '누가·왜 사는지/실적까지 같이' ✅ · s16 와이드 인사 ✅. 캐릭터 일관성(골드 황소·안경·흰 셔츠·붉은 넥타이·남색 바지) 16장 유지. 배경 3구역(주주 환원 금고 로비·수급 저울 광장·실적 발표장)에 글자·숫자 없음(저울 접시 구슬·발표장 파란 원형 막은 무늬만 — 영상 변환 때 글자·숫자가 생기는지 눈여겨볼 것). **못 봄**: 시트 해상도라 배경 속 작은 글자 유무는 s1·s4 원본 확대만 확인.
- ✅ 영상 프롬프트 `_ai/bull-ep16-video-generation-prompts.md`(2026-10-03, `build-video-generation-prompts.mjs`, TTS output-v1 기준): **8초 4개(s2·7·12·16) / 10초 12개**, 카드·소품 씬 전부 10초, 입 멈춤 2단계. Owner가 Veo로 생성해 보내줄 예정(저장명 `Downloads/1~16.mp4`, "황소특보 16편"이라고 알려주기).

## D. 영상 검수(2026-10-03, Owner Veo 영상 16개 수령 — Downloads/1~16.mp4, 파일명 번호가 섞여 있어 길이·내용으로 씬에 매칭)
- ✅ 16개 모두 720x1280·24fps·오디오 포함, 길이 티어 일치(8초 s2·7·12·16 / 10초 나머지), 카드 글자는 끝 프레임까지 보존(카드 씬 전부), 카메라 줌·소품 이동 없음 — `C:/tmp/bull-ep16-videos-review/`(sheet_1~4.png, mouth_1~2.png, probe.json).
- 👁 입 멈춤(check-clip-speech-timing 16/16 경고는 추정치): 육안 판정 — 닫힘 s5·s8·s10·s16(s15 대체로), 경미 s1·s3·s4·s6·s9·s11·s13·s14, **보통(꼬리에 입 벌어짐) s7·s12(와이드 클립)**, s2는 미소 상태 입 벌어짐. 14·15편 선례대로 그대로 진행(Owner에게 보고).
- ✅ 영상 파일 `C:/tmp/bull-ep16-videos/bull_ep16_s{N}_motion.mp4`로 정리.

## E. 조립·CTA·마감·QA
- ✅ `run-owl-assemble-shorts-v2.mjs` → `C:/tmp/bull-ep16-assembly-v1/owl_shorts_final.mp4` 113.3초(씬 전환 누적 오차 0, 컷 선행 0.11~0.14초, 자막 69블록).
- ⛔✅ `run-owl-episode-with-fixed-cta-once.mjs --alignment …`(황소 CTA bull-cta-fixed-v6): cta-join-report.json **PASS**(프레임 2916/2916), 121.5초.
- ✅ 워터마크 제거 _nowm.mp4(마커 확인) → 오디오 마감 `C:/tmp/bull-ep16-final/owl_episode_final_mastered.mp4` 58.5MB, **-14.1 LUFS / -0.9 dBTP**.
- ⛔✅ `run-episode-qa-once.mjs`: 첫 실행 must-fix 3(금지 경계 블록 2 + edge-review 누락) → 스펙에 captionBoundaryExceptions("14조|1,565억", "더|중요해지는") 추가 + qa/edge-review.json 기록 → 재실행 **반드시 수정 0**, 확인 권장 9(H4 훅 긴장 위치, 월 표기 "10월" 반복, "~야" 연속, 0.6초 미만 자막 2, 입 멈춤 16 등). 자막 카드 판정 전부 ok(s10 클로즈업 카드 하단이 자막 상단 y≈1257에 닿음 — 카드 글자는 안 가려짐, Owner에게 보고). 제목 108px×3줄, 자막 96px 최대 2줄, 자막↔음성 41지점 ok. 보고서 `C:/tmp/bull-ep16-final/qa-report.md`.
- **못 본 것**: TTS 청취("에스케이하이닉스", "일조 사천팔백팔십육억"), 최종본 전체 프레임 육안 재생.

## F. 커버
- ✅ 스펙 `scripts/_bull-cover-ep16-spec.mjs`(올리브 포레스트→라임 골드, 금빛 동전 리본), 합성기 헤드라인 "자사주 종료 / 진짜 볼 건?" 글자 높이 **164/169px(≥140 통과)**, 세로 16.0~35.0% → `C:/tmp/bull-cover-ep16/00_bull_ep16_cover_thumb.png`(Owner에게 전송).

## G. 배포(2026-10-03, Owner "16편 배포해줘")
- ✅ 게시 직전 팩트 재확인(웹 검색): 삼성 자사주 매입 진행(10/1 93.46%→10/2 계획 주식 수 100.96% 달성, 금액 한도까지 계속)·SK하이닉스 71%(10/1)→76%(10/2)·잠정실적 "다음 주"(8일 보도, 일정표 7일 미확정)·컨센서스 113조→109.5조 — 대본과 일치, TTS 수정 없음. 못 본 것: DART 원문.
- ✅ 압축 `C:/tmp/bull-ep16-publish/owl_episode_final_compressed.mp4` 28.0MB(1900k), 콘텐츠 유닛 `owl-content-unit.json`(finalMasteredPath·qaReportPath 포함), ⛔ 배포 전 게이트 **실패 0·경고 0·통과 7**.
- ✅ 업로드 3건(영상·커버·스토리 Blob) UPLOADED → 커버 merge → 릴스 게시(커버 URL은 merged 파일에 포함 확인, 로그 출력 줄은 tail에서 잘려 결과 파일로 확인) → 스토리 게시 → 유튜브 `--privacy public`.
- **링크**: 릴스 https://www.instagram.com/reel/DeA5B2dCPA0/ (mediaId 17885404926686301) · 스토리 mediaId 18078682274528937(24시간 만료) · 유튜브 https://www.youtube.com/shorts/i5K_ik3-F8Y (public, 썸네일 set).
- ✅ 장부 `BULL_EPISODE_LEDGER` 16편 반영(17·18편은 제작 중 등록, 규칙 11 쏠림 방지) + 테스트 14/14.
- ⬜ 확인 대기: 유튜브 썸네일 maxres/oar 반영(수 시간 뒤), 성과 수집. 못 본 것: 게시된 릴스·쇼츠 실제 재생 화면(링크만 확인).
