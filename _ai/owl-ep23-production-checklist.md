# 부엉박사 표시 22편 제작 체크리스트 (파일 번호 23) — 근로장려금, 정기 신청을 놓쳤어도 11/30까지 기한 후 신청 — 규칙 23·26·27·29

> ⛔ = 코드가 막는 게이트, 👁 = 사람이 눈으로 보고 기록을 남겨야 하는 단계. 증거(명령·파일)를 적고 못 본 것은 "못 봄"으로 적는다. **게시 시점은 Owner가 지시**(제안 금지). 표시 22편 = 파일 ep23(표시 21편 대환 금리 역전이 파일 ep22).

## 0. 시작 전
- ✅ CURRENT_STANDARDS를 그 세션에서 직접 열어 읽음(2026-10-05): 최우선 규칙 1~24(규칙 11·13 소재 기준 포함), A-2·A-3, 부엉 §1 씬 구조 v2·표. 규칙 25~29는 스캔·cold-read 템플릿으로 확인.
- ✅ `scripts/_owl-v2-ep23-assembly-spec.mjs` 없음 확인 후 새로 만듦.

## A. 소재·대본
- ✅ 소재: 풀스캔 재실행(`C:/tmp/owl-topic-scan-ep22/`, 부엉 풀 204건·황소 교차 풀 200건 전부 읽음) → 웹 보강으로 원문 확인 → Owner "1번은 진행하는 걸로"(근로장려금), 퇴직연금 DB→DC는 보류 계열이라 제외(Owner 지적).
- ✅ 팩트: 국민일보 원문(국세청 자료)·국세상담센터 Q&A 원문(기한 후 신청 6/2~11/30, 5% 감액)·정책뉴스 2026-04-30(요건·최대액). 12/1·10%는 2020년 옛 수치라 폐기. **못 봄: 국세청 원자료(국회 제출본), 홈택스 화면의 신청 메뉴 이름, 손택스 명칭 공식 문서.**
- ⛔✅ 대본 검사: v5 **반드시 수정 0**, 16씬·약 546자(확인 권장 5: 총 글자<권고 추정치, "165만원" 재사용, "~야" 연속, 기관 발표 패턴·기존 vs 변경 없음 — 대처법형이라 해당 없음). 씬 최대 추정 9.2초(실측 7.92초).
- ✅ 새 독자 읽기 점검(규칙 29) 1회 통과, Q4 7건 중 4건 수정 → `_ai/owl-ep23-cold-read.md`.
- ✅ 장부 `OWL_EPISODE_LEDGER` 22편 등록(deadline_benefit·jobs_income·number, published:false), 장부 테스트 10/10.
- ✅ Owner 대본 확정: "1번 진행해. 이미지까지 생성 후 검수 다 하고 영상 프롬프트까지"(2026-10-05).

## B. 음성
- ✅ TTS 스크립트 JSON `C:/tmp/money-shorts-os/owl-ep23-tts/owl-ep23-tts-script.json`(빌더 `C:/tmp/owl-ep23-draft/build-owl23-tts.mjs`): 어절 수 일치·세그먼트 ≤8어절·읽기에 숫자 없음·강조어 존재 **경고 0건**, `hookType: "T3"`, 읽는 표기("이십사만이야", "이천이백이십억", "구십일만", "십일월 삼십일까지", "이천이백만·삼천이백만·사천사백만", "이억 사천만", "백육십오만·이백팔십오만·삼백삼십만", "오퍼센트가", "백오십육만").
- ❌→✅ 1차(v1 16씬·585자): API 1회, **120.44초**(+CTA≈135초, 115~130초 초과) → 대본 v5로 줄임(1차 스크립트 `owl-ep23-tts-script-v1-16scenes-585chars.json`, 음성 `output-v1` 보관).
- ⛔✅ 2차 `owl-tts --character owl --arm`: 래퍼의 대본 기준 검사 통과 → **API 1/1**, 16씬, 타임라인 **109.56초**(+CTA≈15초≈124.6초), 요약 `output-v2/elevenlabs-scene-paced-tts-summary.json`. **API 호출 총 2회(1차+2차)**.
- ✅ 씬별 최대 **7.92초(s8)**, 전부 9.5초 이내. 정렬 밀림 점검(`fix-tts-alignment-from-audio-once.mjs`): 최대 -0.08초 → **보정할 씬 없음**(원본 정렬·summary 사용). 못 본 것: TTS 청취.

## C. 스펙·이미지
- ✅ 스펙 `scripts/_owl-v2-ep23-assembly-spec.mjs`(OWL_EP23_ASSEMBLY_SPEC): hookType T3, **`openingMotion: "pushin"`**(첫 3초 실험 부엉 첫 적용, 황소 22편은 impact로 번갈아), sceneBackgrounds A 세무서 민원 안내 로비 / B 장려금 지급 창구 홀 / C 신청서 작성 코너(글자·숫자 없음), 16씬 shot(medium 10·wide 5·close 1)·bg·motion(card2 10·open 6), 헤더 "근로장려금, / 아직 신청할 / 수 있어요". 스펙 대사·장면 키가 TTS JSON과 16/16 일치(자동 대조, 불일치 0), 같은 구역 같은 샷 3연속 없음, 검사기(--spec-module) 반드시 수정 0.
- ✅ 샘플 3장 먼저(s1 카드·s2 와이드·s7 긴 카드, 2026-10-05) → 안전선 시트 통과 → 나머지 13장. 명령: `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character owl3dv5 --scene-spec ./_owl-v2-ep23-assembly-spec.mjs --scene-spec-export OWL_EP23_ASSEMBLY_SPEC --out-dir C:/tmp/owl-v2-ep23-images --scene-spec-only …`(CDP 9222). **16장 모두 1차 생성**, 파일 `C:/tmp/owl-v2-ep23-images/owl_ep23_s{1..16}.png`(941x1672).
- ❌→✅ **s3 1장 재생성 1회**: 카드 둘째 줄 "현금을 얹어 줘요"의 "얹" 글자가 "없"처럼 읽혀(뜻 정반대 위험) 카드 문구를 "현금을 보태 줘요"로 바꿔 다시 생성(옛 이미지 `owl_ep23_s3_old_unclear-glyph.png` 보관). 대사는 그대로("얹어 주는").
- 👁 안전선 시트(`C:/tmp/owl-v2-ep23-review/safe-zone-sheet-all.png`)와 카드 확대(`cards-zoom.png`) 씬별 판정: s1 카드 '국가가 주는 돈/놓친 가구 24만' ✅ · s2 와이드 인사 ✅ · s3 카드 '근로장려금은/현금을 보태 줘요' ✅(확대 확인) · s4 카드 '안 받은 돈이/약 2,220억 원' ✅ · s5 와이드 이마 짚기 ✅ · s6 와이드 손짓 ✅ · s7 카드 '가구 소득 합산/혼자는 2,200만 미만' ✅ · s8 카드 '홑벌이 3,200만 원/맞벌이 4,400만 원' ✅ · s9 카드 '혼자 사는 가구/최대 165만 원' ✅ · s10 카드 '홑벌이 최대 285만/맞벌이 최대 330만' ✅ · s11 클로즈 턱 괴고 계산 ✅ · s12 카드 '홈택스, 손택스 앱/장려금 신청 메뉴' ✅ · s13 카드 '이 기간이 끝나면/신청할 수 없어요' ✅ · s14 카드 '아직 신청/할 수 있어요' ✅ · s15·s16 와이드 손짓·인사 ✅. 카드 글자는 모두 좌우 12% 주황선 안. **주의: 카드 하단이 세로 60% 선 근처인 씬(s3·s9·s13·s14) — 자막(y=1360, 약 66~76%)과는 겹치지 않을 것으로 보지만 조립 후 QA 시트(`qa/caption-card-*.png`)로 재확인.**
- 👁 배경 확인(원본 s2·s5·s6): A 안내 로비 안내 데스크 위 작은 검은 모니터 3개(빈 화면), B 지급 창구 카운터 위 작은 회색 단말기·금빛 동전 더미 모형(숫자 없음), C 작성대의 빈 흰 종이·펜·바인더 책등(글자 없음). 읽히는 글자·숫자 없음. **못 봄**: 화면·종이가 영상 변환 때 글자를 만들어 내는지(영상 검수에서 확인), 시트 해상도 밖 아주 작은 글자.
- ✅ 영상 프롬프트 `_ai/owl-ep23-video-generation-prompts.md`(`build-video-generation-prompts.mjs`, TTS output-v2 기준, s3 카드 변경 반영해 재생성): **8초 5개(s2·5·11·15·16) / 10초 11개**, 카드 씬 전부 10초, 입 멈춤 2단계, 금지 표현("glued"·"Silent") 본문에 없음. 영상은 Owner가 Veo로 생성해 보낼 예정(저장명 `Downloads/1~16.mp4`, "부엉박사 22편(파일 ep23)"이라고 알려주기).

## D. 영상 (수령 완료 2026-10-06)
- ✅ Owner 영상 16개 수령(`Downloads/1~16.mp4`) → `C:/tmp/owl-v2-ep23-videos/`에 스펙 파일명으로 복사, 길이 티어 확인, 검수 시트 `C:/tmp/owl-v2-ep23-videos-review/`(sheet_1~4·mouth_1~2·zoom_check). **flag**: s5·s15·s16 부엉이가 카메라 쪽으로 걸어와 커짐(배경 고정).
- ✅(추정) 입 멈춤 `check-clip-speech-timing-once.mjs` + 경고 클립 프레임 확인. 배경 모니터·종이에 글자·숫자가 생겼는지 확인.

## E. 조립·마감(A-7 한 번에) — 영상 수령 후
- ✅(선행) 조립 전 TTS alignment 보정 점검: 최대 -0.08초 → 보정 없음(원본 정렬·summary 사용).
- ✅ 조립 109.6초(`openingMotion: pushin` 적용, 조립 로그의 "씬 전환 싱크 누적 오차 0") → CTA 결합(owl-cta-fixed-v3, `--scene8-start 109.56`, `--alignment output-v2` 정렬) → 워터마크 제거 → 오디오 마감 → QA(`edge-review.json` 씬별 ok/over 기록, 자막-카드 겹침 확인).
- ✅ CTA 결합 PASS(2977/2977) → 워터마크 제거 → 마감 `C:/tmp/owl-v2-ep23-final/owl_episode_final_mastered.mp4` 124.04초 62.2MB −15.0 LUFS/−0.9 dBTP → QA **반드시 수정 0**(edge-review.json 카드 씬 10개 ok·자막 겹침 ok, 재조립 후 재판정).
- ⚠ 교훈(A-7 2-2): `openingMotion` 첫 씬 확대가 워터마크를 고정 좌표 밖으로 밀어 ✦가 남음 → 조립기가 확대 **전에** delogo(`OPENING_WATERMARK_REGIONS`, 제거 도구 좌표와 동기화 필수). 확대 전 처리 후 시트에서 ✦ 소멸 확인.
- ✅ 첫 씬 프레임 확인: 팻말·글자는 주황 안전선 안(edge-review).

## F. 자산·배포 — 영상 이후
- ✅ 커버(2026-10-06, ★규칙 30 첫 적용): `scripts/_owl-cover-ep23-spec.mjs`(에스프레소 브라운→피치 코랄, 윗 55% 비움) → 합성기로 **제목 그대로** "근로장려금,/아직 신청할/수 있어요" 156/164/175px(≥140), 세로 14.5~43.5% → `C:/tmp/owl-cover-ep23/00_owl_ep23_cover_thumb.png`(Owner에게 전송). 3줄이라 17~34% 안전대는 벗어남(상단 13% 이내는 아님).
- ✅ Owner 확정(2026-10-06): 현재본 확정("마음에 들어", s5·15·16 부엉이 접근 유지). 압축본 `C:/tmp/owl-ep23-publish/owl_ep23_compressed.mp4` 30.2MB(≤36.7MB)·124.1초 완료.
- ⬜ (남음) 압축(35MB 이하)·콘텐츠 유닛·배포 전 게이트. **게시 직전 재확인: 기한 후 신청 마감(11/30)·감액 5%가 바뀌지 않았는지, 국세청 공지.** 배포는 Owner 지시 시에만(제안 금지).
- 캡션 초안은 스펙의 `instagramCaptionHook/Points/PriorityTags`(20대 이하 비중·재산 1억 7천만 원 구간·장려금 상담센터 1566-3636 포함).
