# 황소특보 21편 제작 체크리스트 — 메모리 가격 상승 둔화, 삼성 잠정실적을 앞두고 — 규칙 23·26·27·29

> ⛔ = 코드가 막는 게이트, 👁 = 사람이 눈으로 보고 기록을 남겨야 하는 단계. 증거(명령·파일)를 적고 못 본 것은 "못 봄"으로 적는다. 게시 예정 **10/5(월) 저녁**(Owner 지시, 배포는 Owner가 "배포해줘"라고 할 때). 소재·대본·팩트표·새 독자 읽기 점검 기록은 `_ai/bull-ep19-21-scripts-draft.md`.

## 0. 시작 전
- ✅ CURRENT_STANDARDS를 그 세션에서 직접 열어 읽음(2026-10-04): 규칙 11·13·17·22·25·26·29, §3 황소 v3·성공 공식·엔딩 5박자, A-2 대본 스펙, A-6·A-7.
- ✅ `scripts/_bull-ep21-assembly-spec.mjs` 없음 확인 후 새로 만듦.

## A. 소재·대본
- ✅ 소재 탐색: `run-bull-topic-full-scan-once.mjs` 11단계(`C:/tmp/bull-topic-scan-ep19/`), 후보 36개 → Owner 12개 압축·슬롯 지정 → Claude 3건 제안 → Owner "3건 확정, 1번 진행해"(2026-10-04).
- ✅ 팩트: 서울경제 10/3 원문 문장 확인(D램·낸드 상승률·트렌드포스·마이크론), 이투데이 10/3. 못 봄: D램익스체인지 원자료. 삼성 컨센서스 수치는 출처마다 달라 미사용.
- ⛔✅ 대본 검사: v3 **반드시 수정 0**, 16씬·608자 — `C:/tmp/bull-ep19-draft/memory-scenes-v3.json`.
- ✅ 새 독자 읽기 점검(규칙 29) 1회 통과(반려 없음), Q4 조치·미조치 사유 → 초안 문서.
- ✅ **Owner 대본 확정**("3편 대본 확정, 19편부터 TTS 진행해", 2026-10-04).
- ⬜ 장부 `BULL_EPISODE_LEDGER` 21편 추가는 배포 후(18편까지 등록돼 있음).

## B. 음성
- ✅ TTS 스크립트 JSON `C:/tmp/money-shorts-os/bull-ep21-tts/bull-ep21-tts-script.json`(빌더 `C:/tmp/bull-ep19-draft/build-tts.mjs` 21): 어절 수 일치·세그먼트 ≤8어절·읽는 표기에 숫자·영문 없음 **경고 0건**, hookType T1, baseSpeed 1.05.
- ⛔✅ `owl-tts --character bull --arm`: 래퍼의 대본 기준 검사 통과 → **API 1/1**, 16씬, 타임라인 **117.80초(+CTA 8.33초≈126.1초)**, 요약 `output-v1/elevenlabs-scene-paced-tts-summary.json`.
- ✅ 씬별 최대 **8.49초(s7)**, 9.5초 초과 0. 정렬 밀림 점검: 최대 -0.06초 → **보정할 씬 없음**(원본 정렬·summary 사용). 못 본 것: TTS 청취.

## C. 스펙·이미지
- ✅ 스펙 `scripts/_bull-ep21-assembly-spec.mjs`(BULL_EP21_ASSEMBLY_SPEC): hookType T1, sceneBackgrounds A 속도 전시관 / B 고속도로 전망 카페 / C 경사로 갤러리(직전 편들과 겹치지 않는 새 공간, 글자·숫자 없음), 16씬 shot·bg·motion, 스펙 대사·장면 키가 TTS JSON과 16/16 일치(자동 대조), 같은 구역 같은 샷 3연속 없음, 검사기(--spec-module) 반드시 수정 0.
- ✅ 이미지 16장(2026-10-04, `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character bull3dv1 --scene-spec ./_bull-ep21-assembly-spec.mjs --scene-spec-export BULL_EP21_ASSEMBLY_SPEC --out-dir C:/tmp/bull-ep21-images`): 러너가 s5에서 완료 감지 timeout으로 4장만 만들고 종료 → `--scene-spec-only 5~16`으로 이어서 생성(실패한 장은 저장되지 않음, 재생성 아님). 파일 `C:/tmp/bull-ep21-images/bull_ep21_s{1..16}.png`.
- 👁 안전선 시트(`safe-zone-sheet-all.png`) 씬별 판정: s1 카드 '메모리 값은/오르는 속도가 꺾임' ✅ · s2 와이드 인사 ✅ · s3 카드 'D램 월 상승률/14.29·4.17·4%' ✅ · s4 카드 '낸드 4월 36.29%/8월 1.42%, 9월 보합' ✅ · s5 카드 '가격은 사상 최고/속도만 둔화' ✅ · s6 카드 '호황이 끝났나?/단정은 일러요' 글자가 작은 편이나 읽힘 ✅(영상에서 뭉개지면 재생성) · s7 카드 '4분기 D램 +10~15%/낸드 +15~20%' 원본 확대에서 선명 ✅ · s8 카드 '마이크론 CEO/27·28년 수요 초과' ✅ · s9 클로즈 턱 괴기 ✅ · s10 와이드 손바닥 ✅ · s11 카드 '삼성전자 3분기/영업이익 전망 하향' ✅ · s12 카드 '잠정실적 예상일/10월 8일(미확정)' ✅ · s13 카드 '신호는 가격보다/속도에서 먼저' ✅ · s14 카드 '① 잠정실적 vs 전망/② 다음 분기 가격' ✅ · s15 카드 '가격 + 속도/같이 보기' ✅ · s16 와이드 인사 ✅. 카드 세로 42~60% 안, 캐릭터 일관성 유지, 배경 3구역(속도 전시관·고속도로 전망 카페·경사로 갤러리)에 글자·숫자 없음(속도계 조형물은 단색 호와 바늘만, 눈금·숫자 없음 — 시트 해상도 기준, 영상 변환 때 숫자가 생기는지 눈여겨볼 것). s6은 캐릭터가 다른 씬보다 작게(와이드에 가깝게) 나왔으나 카드는 읽힘. **못 봄**: 속도계 조형물·배경 속 작은 글자 유무(s7만 원본 확대).
- ✅ 영상 프롬프트 `_ai/bull-ep21-video-generation-prompts.md`(`build-video-generation-prompts.mjs`, TTS output-v1 기준): **8초 2개(s2·s10) / 10초 14개**. Owner에게 전달함. Owner가 Veo로 생성해 보내줄 예정("황소특보 21편"이라고 알려주기).

## D. 영상 검수(2026-10-05, Owner Veo 영상 16개 수령 — Downloads/황소 21편/1~16.mp4, 숫자=씬 번호)
- ✅ 16개 모두 720x1280·24fps·오디오 포함, 길이 티어 일치(8초 s2·s10 / 10초 나머지), 모든 클립이 씬 길이보다 김, 카드 글자는 끝 프레임까지 보존(카드 씬 12개 전부, ① ② 번호 표기 포함), 카메라 줌·소품 이탈 없음, 배경 속도계 조형물에 숫자·글자 없음(눈금 줄무늬만) — `C:/tmp/bull-ep21-videos-review/`(sheet_1~4.png, mouth_1~2.png, probe.json). 영상 파일 `C:/tmp/bull-ep21-videos/bull_ep21_s{N}_motion.mp4`.
- 👁 입 멈춤(`check-clip-speech-timing-once.mjs` 16/16 경고는 Veo 음성 길이 기준 추정치): 육안 — 꼬리 구간 대부분 부리 닫힘·경미, 미소로 입 벌어짐 s10 정도. 일부 클립 시작 0.3초·끝에 눈 감은 깜빡임. s6은 캐릭터가 다른 씬보다 작음(와이드에 가까움), 카드는 읽힘.

## E. 조립·CTA·마감·QA
- ✅ 정렬 밀림 점검(`fix-tts-alignment-from-audio-once.mjs`): 최대 -0.1초 → 보정할 씬 없음(원본 요약·alignment 사용).
- ✅ 스펙에 `captionGapBridgeSec: 0.3`·`openingMotion: "none"`(첫 3초 실험은 22편부터) 선적용. 조립 `C:/tmp/bull-ep21-assembly-v1/owl_shorts_final.mp4` 117.8초 — **조립 1차 성공(자막 폭 ABORT 없음)**, 누적 오차 0, 컷 선행 0.01~0.13초, 자막 66블록.
- ⛔✅ CTA 결합(bull-cta-fixed-v6, `--scene8-start 117.818`, 원본 alignment): cta-join-report **PASS**(프레임 3023/3023, 화면 125.96초 = 오디오 125.96초). 전환 4프레임 육안 확인(제목 3줄·리스크 고지·CTA 정상, 전환 지점은 0.3초 페이드 암전).
- ✅ 워터마크 제거(sparkle·veo_text 2곳) → 오디오 마감 `C:/tmp/bull-ep21-final/owl_episode_final_mastered.mp4` 126.0초 **54.7MB**, -14.3→**-14.1 LUFS / -0.9 dBTP**.
- ⛔✅ QA 첫 실행 must-fix 1(카드 씬 12개 edge-review 기록 없음) → `qa/edge-review-1~3.png`·`caption-card-1~3.png` 직접 확인 후 `qa/edge-review.json` 기록(좌우 끝·자막 겹침 12씬 모두 ok, s1·s3 간격 가장 좁지만 자동 계측 자막 윗줄 최소 y=1257px) → 재실행 **반드시 수정 0**, 확인 권장 5(H4 긴장 단어 위치 2, 월 표기 반복 "8월"·"9월" 3·4번(시점이라 수정 안 함), 0.6초 미만 자막 "삼성전자" 0.59초, 입 멈춤 16). 제목 108px×3줄, 자막 96px 최대 2줄, 자막↔음성 48곳 ok, 워터마크 잔여 없음(`qa/watermark-check.png` 20지점·CTA 꼬리 확인). 보고서 `C:/tmp/bull-ep21-final/qa-report.md`.
- **못 본 것**: TTS 청취(종목명·"D램"·"트렌드포스"·"마이크론" 읽기), 최종본 전체 재생, 자막 "삼성전자" 0.59초가 화면에서 어색하게 깜빡이는지.

## F. 커버
- ✅ 스펙 `scripts/_bull-cover-ep21-spec.mjs`(짙은 잉크 네이비→탠저린 오렌지 글로우, 글자·눈금 없는 반원 속도계 조형물 뒤에 두고 글자 없는 작은 메모리 모듈을 쥔 호기심 표정; 직전 20편 포레스트→샴페인 골드·19편 로열 블루→민트·18편 플럼→라벤더와 안 겹침). 글자 없는 배경 `C:/tmp/bull-cover-ep21-raw/`(1차 성공) → 합성기 헤드라인 **"오르는 속도 / 꺾였다고?"** 164/191px(≥140), 세로 15.5~35.6% → `C:/tmp/bull-cover-ep21/00_bull_ep21_cover_thumb.png`(Owner에게 전송). **문구 점검(17편 교훈)**: 영상 핵심("가격은 사상 최고, 오르는 속도만 둔화")과 같은 뜻 — "메모리 값 꺾였다" 류는 가격 하락으로 오해돼 제외, 1차 "오르는 속도가 / 꺾였다고?"는 첫 줄 138px 게이트 미달이라 조사를 빼 "오르는 속도"로 줄임. 주어 "메모리"는 문구에 없고 손에 든 메모리 모듈 그림과 제목·캡션이 보완.

## G. 이후 단계(Owner 지시 대기)
- ⬜ 압축(**마스터 54.7MB → 1900k로 35MB 이하 확인**)·콘텐츠 유닛(finalMasteredPath·qaReportPath)·배포 전 게이트 → 배포는 Owner 지시(오늘 저녁 예정). **게시 직전 재확인: 삼성 잠정실적 공시일(10/8 예상, 미확정)·이미 공시됐는지(공시되면 후속 편으로 전환), D램·낸드 수치(트렌드포스 4분기 전망) 변경 여부.** 장부 `BULL_EPISODE_LEDGER` 21편은 등록돼 있음(제작 중→게시 후 주석 갱신). 로컬 변경은 Owner 커밋 승인 대기.
- ✅ 커버 v2(2026-10-06, 규칙 30 Owner "새규칙대로 다시 제작"): 같은 글자 없는 배경 재사용 → 헤더 제목 **그대로** "메모리 값 / 오르는 속도가 / 꺾였다" 160/143/160px(≥140, 87% 폭), 세로 14.5~40.6% → `C:/tmp/bull-cover-ep21-v2/00_bull_ep21_cover_thumb.png`(Owner에게 전송, 구버전 `bull-cover-ep21`은 보관). 배포 시 커버 경로는 v2 사용. **주의**: 제목 "메모리 값 … 꺾였다"가 가격 하락으로 읽힐 수 있다는 앞선 우려("사상 최고, 오르는 속도만 둔화")는 Owner 지시대로 제목 그대로 두되 캡션·설명란이 보완.
- ✅ **배포 완료(2026-10-06, Owner "배포해줘"→"진행해")**: 릴스 https://www.instagram.com/reel/DeIebVRG8Lm/ (커버 merge ok) · 스토리(커버 1장) · 유튜브 https://www.youtube.com/shorts/QRdV_DtBySQ (public, 썸네일 set). 폴더 C:/tmp/bull-ep21-publish/. 후속: 10/8 삼성 잠정실적 나오면 후속 편(엔딩 약속).
