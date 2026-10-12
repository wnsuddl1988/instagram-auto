# 스토리형 12편 제작 체크리스트 — 디즈니 비밀 땅 매입 (2026-10-11)

> 작성 방식 = `_ai/story-script-rules.md`(기본 베이스 구조·Owner 9원칙) + 10편 체크리스트 형식. 단계가 끝날 때마다 ✅/⬜와 증거를 적는다. 게시 시점은 Owner 지시 때만.

## A. 소재·대본
- ✅ 소재 검증 `C:/tmp/story-topic-vetting/story-ep12-disney-florida-land.json`(서로 다른 사이트 출처 2곳 원문 자동 대조 통과, 단독 출처 숫자 제외).
- ✅ 대본 `C:/tmp/story-ep12-disney-florida/scenes-v5.json` 16장면 557자(Owner 확정). 검사기 v4 기본 베이스 구조 반드시 수정 0. 설계 `C:/tmp/story-ep12-disney-florida/story-design.json`.

## B. 소리
- ✅ TTS(story_v1, ElevenLabs 유료 1회): 16장면 원본 **110.92초**, 호출 1/1. 낭독 스크립트 `C:/tmp/story-ep12-disney-florida/build-tts-script.mjs`(생성기 `C:/tmp/story-base-gen.mjs`, 어절 불일치 0곳) → `C:/tmp/money-shorts-os/story-ep12-tts/story-ep12-tts-script.json`.
- ✅ 정렬 점검 `--threshold 0.1`.
- ✅ 템포 `--factor 1.2 --max-scene-gap 0.25`: **85.282초**, 장면 최대 최대 7.85초(10초 이내). 요약 `C:/tmp/money-shorts-os/story-ep12-tts/output-v1/tempo-1.2-gap0.25-pre/…tempo1.2-gap0.25-pre.json`.
- ✅ 배경음(ElevenLabs Music 유료 1회, 6구간): 맞춤본 `C:/tmp/money-shorts-os/story-ep12-bgm/output-v1/story-ep12-disney-florida.bgm.fit.mp3`(85.282초). 미리 듣기 `…/story-ep12-bgm/preview/story_ep12_voice_bgm_preview.mp3`. ⬜ Owner 청취 확인.

## C. 이미지·영상 프롬프트
- ✅ 스펙 `scripts/_story-ep12-assembly-spec.mjs`(`STORY_EP12_SEMI_SPEC` 1~15번, `STORY_EP12_END_SPEC` 16번 부엉박사). 화면에 글자·숫자·로고 없음, 실존 인물·저작권 캐릭터 미묘사. 제목 `headerTitle`은 ★임시안(Owner 확정 필요).
- ✅ 이미지 16장 `C:/tmp/story-ep12-images/story_ep12_s{1..16}.png`(ChatGPT 컨트롤러, 연락 시트 육안 검수 — 글자·숫자·로고·인물 얼굴 확인): 15장 + 부엉박사 1장, 16번 성 모양 배경이 보여 재생성 1회(분수대·레일로 교체). 사본 `Downloads/스토리11~15편_이미지/스토리12편/`.
- ✅ 영상 프롬프트 `_ai/story-ep12-video-generation-prompts.md`.
- ⬜ Owner Veo 영상 `Downloads/스토리 12편/1~16.mp4` → 검수 → 조립 → 워터마크 제거 → 오디오 마감 → QA → 커버 → 압축·콘텐츠 유닛·게이트 → 완성본 Owner 확인 → 게시 지시.
