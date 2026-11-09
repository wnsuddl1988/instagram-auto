# 스토리형 3편 제작 체크리스트 — 정주영 500원 지폐 (2026-10-07)

> 작성 방식 = `_ai/story-format-structure-v1.md`(v3 + §2-0-1 경제 번역). 단계가 끝날 때마다 ✅/❌와 증거를 적는다. 게시 시점은 Owner 지시 때만.

## A. 소재·대본
- ✅ 소재: 정주영 500원 지폐 일화(Owner 선택, 2단계 검증 40/40 원문 대조 `C:/tmp/story-topic-vetting/hyundai-500won-1971.json`).
- ✅ 대본 최종 v2: `C:/tmp/story-ep3-hyundai/hyundai-scenes-v1.json` 16장면·676자. 경제 번역 4곳(2·3·7·16번), 이야기 사건 생략 없음. 검사기 `check-script-standards.mjs --format story` **반드시 수정 0**(확인 권장 4: 676자 분량·마지막 질문 없음·1번 55자·사실 20개).
- ✅ Owner 수정 반영(10/7): 11~12번(도크 설명 재배열)·14번(수주량 풀이).
- ✅ Owner 대본 확정 + TTS·이미지 진행 승인: "1번 진행하자. TTS까지 생성하고 이미지생성 바로 진행해"(10/7).
- 새 독자 점검: 최종본 재실행 안 함(상한 2회 후 구조 재구성) — 제가 낭독 점검, 대표님 확인.

## B. 소리
- ✅ TTS(story_v1, 속도 1.1, 유료 1회, ElevenLabs): 16장면 136.2초 → `apply-story-tempo-once.mjs --factor 1.2 --max-scene-gap 0.25 --keep-gap-scenes 8,13` → **106.85초**. 정렬 보정 `fix-tts-alignment-from-audio-once.mjs --threshold 0.1`: 8번 1곳 보정. 요약 `C:/tmp/money-shorts-os/story-ep3-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.tempo1.2-gap0.25-pre.audio-fixed.json`.
- ✅ 배경음(Owner "2번 진행해" 승인, ElevenLabs Music 유료 1회, 7구간 106.9초 = 도입·요청/거절·회의/설득·추천서/보증 기관·질문/주문·승인/동시 건조·준공/세계 1위·여운): 원곡 `C:/tmp/money-shorts-os/story-ep3-bgm/output-v1/story-ep3-hyundai.bgm.mp3`(106.945초), 음성 길이 맞춤본 **`…/story-ep3-hyundai.bgm.fit107.mp3`**(106.868초, atempo 1.0007). 끝 1.5초 페이드아웃 외 무음 없음. 미리 듣기(음성+배경음 -26dB 더킹) `C:/tmp/money-shorts-os/story-ep3-bgm/preview/story_ep3_voice_bgm_preview.mp3`. ⬜ Owner 청취 확인. 구성 계획 `…/story-ep3-bgm/story-ep3-bgm-plan.json`.
- 낭독용 숫자 표기: 천구백칠십일 년·사천삼백만 달러·사 퍼센트·이 년 삼 개월 등(`C:/tmp/story-ep3-hyundai/build-tts-script.mjs`). 조립 때 "칠십삼 세의"류 어절 수 불일치가 없는지 QA 확인(2편 교훈).

## C. 이미지·영상 프롬프트
- ✅ 스펙 `scripts/_story-ep3-assembly-spec.mjs`(`STORY_EP3_SEMI_SPEC` 1~15 반사실 3D, `STORY_EP3_END_SPEC` 16번 부엉박사). 얼굴 안전 구간(FACE_SAFE)·글자 없음 규칙 적용.
- ✅ 이미지 16장 `C:/tmp/story-ep3-images/story_ep3_s{1..16}.png` 육안 검수: 글자·숫자 없음, 인물 얼굴 대부분 세로 40~55%, 주인공 일관.
- ✅ 재생성(10/7): 5번(지폐 그림이 바이킹풍 범선 → 거북선), 15번(같은 이유), 10번·13번(파란·흰 줄무늬 깃발이 그리스 국기처럼 보임 → 무늬 없는 단색 남색 삼각 페넌트). 반려본 `C:/tmp/story-ep3-images-rejected/`. 1번 지폐는 범선풍 그림 그대로(1번 대사가 거북선을 말하지 않아 유지, 변경 원하면 재생성).
- ⚠ 9번 악수 장면 얼굴이 세로 37~45%로 약간 높음(조립 때 영상 230px 내림으로 안전 구간에 들어옴).
- ✅ 영상 프롬프트 `_ai/story-ep3-video-generation-prompts.md`(생성기 `scripts/build-story-video-generation-prompts.mjs`): 8초 8개(3·5·6·8·10·11·13·15번) / 10초 8개(1·2·4·7·9·12·14·16번). 1번 장면이 8.28초로 길어 10초 클립.
- ⬜ Owner Veo 영상 `Downloads/1~16.mp4` → 검수 → 조립(`headerTopY 345`, 영상 230px 내림, 자막 102/Y1385, 템포 1.20 요약) → 워터마크 제거 → 오디오 마감(`--tp -1.5`) → QA → 커버 → 압축·콘텐츠 유닛·게이트 → 완성본 Owner 확인 → 게시 지시.

## D. 게시 전 확인(필수)
- 사실 재확인: 4,300만 달러는 요청액(승인액 아님), 6/28은 준공식(인도일 아님), 4%는 계산값(요청액÷1971년 수출 10억 6,760만 달러), 1999 수주량 1위는 "일본을 제치고"까지만(일본이 직전 1위라는 서술 없음).
- 제목 확정(작업 제목 "정주영 500원 지폐 — 모래밭 사진으로 은행을 움직인 조선소", 커버는 제목 그대로 17~83% 안에서 크롭 시뮬레이션).

## D-0. Veo 클립 검수(2026-10-07 밤, Owner 전달 Downloads/스토리 3편/1~16.mp4)
- ✅ 16개 모두 720x1280·24fps·오디오 포함, 길이가 프롬프트 티어와 일치(10초 1·2·4·7·9·12·14·16번 / 8초 나머지), 모든 클립이 해당 장면 음성 길이보다 김. 프레임 80장(클립당 5장) 육안: 글자·숫자·로고 없음, 지폐 그림은 5·15번에서 거북선이 분명하고 1번은 작은 배 그림, 깃발(10·13번)은 무늬 없는 남색 삼각기, 소품(지폐·사진·도면·서류철·유조선 모형·안전모) 끝까지 유지, 인물 일관(주인공 남색 양복·롱바텀 트위드 재킷).
- ✅ 16번 부엉박사: 20프레임에서 부리가 말하는 리듬으로 열렸다 닫힘(입 멈춤 없음).
- 알려진 사소한 점: 모든 클립에 ✦ 표시(영상 230px 내림으로 잘리고 제거 도구도 돌림), 9번 악수 장면 얼굴 세로 39~45%로 약간 높음(조립 때 영상 내림으로 안전 구간), 7번 공무원이 프롬프트의 도장 없이 손만 모은 채 고개를 저음(의미 동일), 11번 중간 먼지 구름(연기처럼 보임, 사용 길이 6.2초 안에서는 약함). 못 본 것: 클립 안 소리(조립 때 TTS만 사용), 처음부터 끝까지 재생.
- 클립 폴더 사본·조립: 다음 단계(스펙 STORY_EP3_ASSEMBLE_SPEC 추가·제목 3줄 확정 필요).

## E. 조립·마감(2026-10-07 밤, Owner "추천대로 하고 1번 진행해")
- ✅ 제목 확정(Owner 10/7): "500원 지폐로 조선소를? 반만 맞아" — 3줄 "500원 지폐로 / 조선소를? / 반만 맞아". 영상 속 제목·커버 동일, 정주영·현대·울산조선소는 설명란·태그에만.
- ✅ 낭독 숫자 자막 보정: `C:/tmp/story-ep3-hyundai/capfix-ep3.mjs` → `…audio-fixed.capfix.json`·`story-ep3-tts-script.capfix.json`(음성·타이밍 그대로, 낭독용 띄어쓰기만 합침).
- ✅ 조립 `STORY_EP3_ASSEMBLE_SPEC` → `C:/tmp/story-ep3-assembled/owl_shorts_final.mp4`(106.9초, 컷 리드 0.10~0.14초) → 워터마크 제거 → 오디오 마감(BGM fit107, -26dB, `--tp -1.5`) → **`C:/tmp/story-ep3-assembled/story_ep3_mastered.mp4`**(-15.1 LUFS / -1.4 dBTP).
- ✅ QA `qa-report.md`: 반드시 수정 0. 경계 줄바꿈 예외 3곳(4,300만|달러, 1972년|3월, 1974년|6월 — 스펙에 사유 기록). 확인 권장: s1~s3 같은 구역·샷 3연속.
- ✅ 커버 `C:/tmp/story-ep3-cover/story_ep3_cover_v1.png`(글자 144/146/146px, 세로 18.6~43.3%, 4:5 크롭 시뮬 확인).
- 직접 본 것: 프레임 3장(0.5·52·84초)과 커버. 못 본 것: 처음부터 끝까지 재생, 나머지 프레임, 안전선 시트 3장, 3:4 크롭.
- ⬜ Owner 확인 → 게시 지시(10/9 점심 슬롯, 지시 전 게시 금지).
