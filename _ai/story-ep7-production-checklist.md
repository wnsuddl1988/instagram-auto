# 스토리형 7편 제작 체크리스트 — 배달의민족 (2026-10-08)

> 작성 방식 = `_ai/story-script-rules.md` + 5·6편 체크리스트 형식. 단계가 끝날 때마다 ✅/⬜와 증거를 적는다. 게시 시점은 Owner 지시 때만.

## A. 소재·대본
- ✅ 소재: 배달의민족(우아한형제들)의 시작과 2019 DH 협약·2020 공정위 조건부 승인, 사실 검증 24/24 원문 대조 `C:/tmp/story-topic-vetting/baemin-2019.json`.
- ✅ 대본 Owner 확정(10/8): `C:/tmp/story-ep8-baemin/scenes-v9.json` 14장면·555자(끝 문장 "다음 일화가 궁금하면 팔로우해 둬."). 설계 `story-design.json`, 게이트 반드시 수정 0.
- ✅ Owner 승인(10/8): "6편 완료되면 7편 바로 똑같이 이어서 해줘".

## B. 소리
- ✅ TTS(story_v1, 속도 1.1, ElevenLabs 유료 1회, 래퍼 `owl-tts --character owl --arm`): 14장면 원본 **108.68초**. 낭독 스크립트 `C:/tmp/story-ep8-baemin/build-tts-script.mjs`(어절 불일치 0곳) → `C:/tmp/money-shorts-os/story-ep7-tts/story-ep7-tts-script.json`.
- ✅ 정렬 점검: 4·5·6·8번 4곳 보정(-0.14~-0.26초), 나머지 정상. 1번 시작 변화 없음(첫 소리 잘림 문제 없음).
- ✅ 템포 `--factor 1.2 --max-scene-gap 0.25 --keep-gap-scenes 3,9`: 쉼 6.2초 줄임, **85.39초**(요약 85.403초, 차이 0.018초). 최종 요약 `…/story-ep7-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json`.
- ✅ 배경음(Owner 승인, ElevenLabs Music 유료 1회, 6구간 85.4초 = 전단지 호기심 13.7 / 앱과 규모 19.4 / 큰 인수 발표 11.9 / 값은 번 돈이 아님 14.2 / 공정위 승인 17.9 / 작은 아이디어 여운 8.4): 원곡 `C:/tmp/money-shorts-os/story-ep7-bgm/output-v1/story-ep7-baemin.bgm.mp3`(85.447초), 맞춤본 **`…/story-ep7-baemin.bgm.fit85.mp3`**(85.403초, 끝 1.5초 페이드아웃). 미리 듣기 `…/story-ep7-bgm/preview/story_ep7_voice_bgm_preview.mp3`. ⬜ Owner 청취 확인.
- ⬜ Owner 청취 확인(읽기: 이천십일년·십만여 곳·사십억 달러·사조 칠천오백억 원·오천육백오십사억·삼백육십사억·구십구점이퍼센트·육개월).

## C. 이미지·영상 프롬프트
- ✅ 스펙 `scripts/_story-ep7-assembly-spec.mjs`(`STORY_EP7_SEMI_SPEC` 1~13번, `STORY_EP7_END_SPEC` 14번 부엉박사). 실존 인물 오인 방지: 뒷모습·작은 모습·손과 소품 위주, 앱·회사 색·로고 흉내 없음.
- ✅ 이미지 14장 `C:/tmp/story-ep7-images/story_ep7_s{1..14}.png` 모두 1차 생성, 재생성 0회. 연락 시트(1~13번)와 14번 원본 육안 검수: 글자·로고 없음(분리수거함의 재활용 마크만 있음), 얼굴 클로즈업 없음. 14번 부엉박사 머리 세로 34~55%로 5·6편보다 약간 높음(조립 때 영상 내림으로 확인). ⚠ 12번 원형 차트는 흰 바탕에 빨강 원이라 일본 국기처럼 보일 수 있음(조각 하나만 연한 색, 글자 없음) — 영상 생성 후 어색하면 알려 주세요.
- ✅ 영상 프롬프트 `_ai/story-ep7-video-generation-prompts.md`: 8초 9개 / 10초 5개.
- ⬜ Owner Veo 영상 `Downloads/스토리 7편/1~14.mp4` → 검수 → 조립 → 워터마크 제거 → 오디오 마감 → QA → 커버 → 압축·콘텐츠 유닛·게이트 → 완성본 Owner 확인 → 게시 지시.
