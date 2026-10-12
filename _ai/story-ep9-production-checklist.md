# 스토리형 9편 제작 체크리스트 — 하나로통신 ADSL (2026-10-09)

> 작성 방식 = `_ai/story-script-rules.md` + 5~7편 체크리스트 형식. 단계가 끝날 때마다 ✅/⬜와 증거를 적는다. 게시 시점은 Owner 지시 때만.

## A. 소재·대본
- ✅ 소재: 하나로통신 ADSL(1997~2002), Owner가 제일제당 대신 확정. 사실 10건 출처 20곳 원문 대조 20/20 일치 `C:/tmp/story-topic-vetting/hanaro-adsl-1999.json`. 출처 1곳뿐인 영상통화·4월 1일·벨기에·두루넷·한국통신 6월·월 요금 비교는 뺌.
- ✅ 대본 Owner 확정(10/9): `C:/tmp/story-ep9-hanaro/scenes-v3.json` 15장면 520자('1999년 4월.' 단독 장면을 서비스 시작 문장에 합침). 게이트 반드시 수정 0.

## B. 소리
- ✅ TTS(story_v1, 속도 1.1, ElevenLabs 유료 1회): 15장면 원본 **99.32초**, 호출 1/1. 낭독 스크립트 `C:/tmp/story-ep9-hanaro/build-tts-script.mjs`(어절 불일치 0곳) → `C:/tmp/money-shorts-os/story-ep9-tts/story-ep9-tts-script.json`.
- ✅ 정렬 점검 `--threshold 0.1`: 5곳 보정(s2 -0.4초·s3·s7·s10 -0.26초·s11).
- ✅ 템포 `--factor 1.2 --max-scene-gap 0.25 --keep-gap-scenes 2,8`: 쉼 5.41초 줄임, **78.26초**. 요약 `C:/tmp/money-shorts-os/story-ep9-tts/output-v1/tempo-1.2-gap0.25-pre/…audio-fixed.tempo1.2-gap0.25-pre.json`. 장면 최대 8.84초(15번).
- ✅ 배경음(Owner 승인, ElevenLabs Music 유료 1회, 6구간 78.3초 = 호기심 8.9 / 회사와 선택 13.4 / 비싼 베팅 15.6 / 시작과 수요 17.5 / 시장이 커짐 14.1 / 여운 8.8): 맞춤본 **`C:/tmp/money-shorts-os/story-ep9-bgm/output-v1/story-ep9-hanaro.bgm.fit.mp3`**(78.260초, 끝 1.5초 페이드아웃). 미리 듣기 `…/story-ep9-bgm/preview/story_ep9_voice_bgm_preview.mp3`. ⬜ Owner 청취 확인(읽기: 천구백구십구년·육십만 원·에이디에스엘·이십사만 회선·오십팔만 회선·천만·오이씨디).

## C. 이미지·영상 프롬프트
- ✅ 스펙 `scripts/_story-ep9-assembly-spec.mjs`(`STORY_EP9_SEMI_SPEC` 1~14번, `STORY_EP9_END_SPEC` 15번 부엉박사).
- ✅ 이미지 15장 `C:/tmp/story-ep9-images/story_ep9_s{1..15}.png` 1차 생성, 재생성 0회. 1~5번 원본, 6~14번 연락 시트(`_sheets/s6_s14.png`), 15번 원본 육안 검수: 글자·숫자·로고 없음, 인물은 뒷모습. ⚠ 11번 서류 위에 옅은 파란 줄 무늬(글자는 아님) — 영상 생성 후 글자처럼 보이면 알려 주세요. 15번 부엉박사 머리 세로 38~60%로 약간 높음(조립 때 영상 내림 확인).
- ✅ 영상 프롬프트 `_ai/story-ep9-video-generation-prompts.md`: 8초 11개 / 10초 4개.
- ⬜ Owner Veo 영상 `Downloads/스토리 9편/1~15.mp4` → 검수 → 조립 → 워터마크 제거 → 오디오 마감 → QA → 커버 → 압축·콘텐츠 유닛·게이트 → 완성본 Owner 확인 → 게시 지시.
