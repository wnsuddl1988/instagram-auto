# 스토리형 15편 제작 체크리스트 — 한진해운 (2026-10-11)

> 작성 방식 = `_ai/story-script-rules.md`(기본 베이스 구조·Owner 9원칙) + 10편 체크리스트 형식. 단계가 끝날 때마다 ✅/⬜와 증거를 적는다. 게시 시점은 Owner 지시 때만.

## A. 소재·대본
- ✅ 소재 검증 `C:/tmp/story-topic-vetting/story-ep15-hanjin-shipping-2016.json`(서로 다른 사이트 출처 2곳 원문 자동 대조 통과, 단독 출처 숫자 제외).
- ✅ 대본 `C:/tmp/story-ep15-hanjin/scenes-v8.json` 16장면 519자(Owner 확정). 검사기 v4 기본 베이스 구조 반드시 수정 0. 설계 `C:/tmp/story-ep15-hanjin/story-design.json`.

## B. 소리
- ✅ TTS(story_v1, ElevenLabs 유료 1회): 16장면 원본 **107.24초**, 호출 1/1. 낭독 스크립트 `C:/tmp/story-ep15-hanjin/build-tts-script.mjs`(생성기 `C:/tmp/story-base-gen.mjs`, 어절 불일치 0곳) → `C:/tmp/money-shorts-os/story-ep15-tts/story-ep15-tts-script.json`.
- ✅ 정렬 점검 `--threshold 0.1`.
- ✅ 템포 `--factor 1.2 --max-scene-gap 0.25`: **83.588초**, 장면 최대 14번 9.2초(10초 이내). 요약 `C:/tmp/money-shorts-os/story-ep15-tts/output-v1/tempo-1.2-gap0.25-pre/…tempo1.2-gap0.25-pre.json`.
- ✅ 배경음(ElevenLabs Music 유료 1회, 6구간): 맞춤본 `C:/tmp/money-shorts-os/story-ep15-bgm/output-v1/story-ep15-hanjin.bgm.fit.mp3`(83.588초). 미리 듣기 `…/story-ep15-bgm/preview/story_ep15_voice_bgm_preview.mp3`. ⬜ Owner 청취 확인.

## C. 이미지·영상 프롬프트
- ✅ 스펙 `scripts/_story-ep15-assembly-spec.mjs`(`STORY_EP15_SEMI_SPEC` 1~15번, `STORY_EP15_END_SPEC` 16번 부엉박사). 화면에 글자·숫자·로고 없음, 실존 인물·저작권 캐릭터 미묘사. 제목 `headerTitle`은 ★임시안(Owner 확정 필요).
- ✅ 이미지 16장 `C:/tmp/story-ep15-images/story_ep15_s{1..16}.png`(ChatGPT 컨트롤러, 연락 시트 육안 검수 — 글자·숫자·로고·인물 얼굴 확인): 15장 + 부엉박사 1장, 5·9번 서류에 인쇄된 듯한 글자 무늬가 보여 빈 흰 종이로 재생성 2회. 사본 `Downloads/스토리11~15편_이미지/스토리15편/`.
- ✅ 영상 프롬프트 `_ai/story-ep15-video-generation-prompts.md`.
- ⬜ Owner Veo 영상 `Downloads/스토리 15편/1~16.mp4` → 검수 → 조립 → 워터마크 제거 → 오디오 마감 → QA → 커버 → 압축·콘텐츠 유닛·게이트 → 완성본 Owner 확인 → 게시 지시.
