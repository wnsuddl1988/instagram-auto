# 스토리형 10편 제작 체크리스트 — 유한킴벌리 4조 2교대 (2026-10-09)

> 작성 방식 = `_ai/story-script-rules.md` + 5~7편 체크리스트 형식. 단계가 끝날 때마다 ✅/⬜와 증거를 적는다. 게시 시점은 Owner 지시 때만.

## A. 소재·대본
- ✅ 소재: 유한킴벌리 4조 2교대(1995~2003), 사실 12건 원문 대조(자동 일치 29·직접 확인 10) `C:/tmp/story-topic-vetting/yuhan-kimberly-4jo2gyo.json`. 단독 출처 사실(1996 30~40%·임금 10% 감소·사장실 점거·파업·반대 이유)은 뺌. "한 명도 해고하지"(명예퇴직 자발 퇴사가 있어 '내보내지'에서 수정).
- ✅ 대본 Owner 확정(10/9): `C:/tmp/story-ep10-yuhan-kimberly/scenes-v5.json` 16장면 525자(7~9번 긴장 다듬음). 게이트 반드시 수정 0.

## B. 소리
- ✅ TTS(story_v1, 속도 1.1, ElevenLabs 유료 1회): 16장면 원본 **103.32초**, 호출 1/1. 낭독 스크립트 `C:/tmp/story-ep10-yuhan-kimberly/build-tts-script.mjs`(어절 불일치 0곳) → `C:/tmp/money-shorts-os/story-ep10-tts/story-ep10-tts-script.json`.
- ✅ 정렬 점검 `--threshold 0.1`: 3곳 보정(s2 -0.64초·s3 -0.38초·s13).
- ✅ 템포 `--factor 1.2 --max-scene-gap 0.25 --keep-gap-scenes 2,7`: 쉼 7.60초 줄임, **79.77초**. 요약 `C:/tmp/money-shorts-os/story-ep10-tts/output-v1/tempo-1.2-gap0.25-pre/…audio-fixed.tempo1.2-gap0.25-pre.json`. 장면 최대 9.32초(16번).
- ✅ 배경음(Owner 승인, ElevenLabs Music 유료 1회, 6구간 79.8초 = 공장 호기심 9.2 / 무산과 위기 18.1 / 노조의 전환 16.7 / 자리 잡음 15.2 / 성과 11.3 / 여운 9.3): 맞춤본 **`C:/tmp/money-shorts-os/story-ep10-bgm/output-v1/story-ep10-yuhan-kimberly.bgm.fit.mp3`**(79.766초). 미리 듣기 `…/story-ep10-bgm/preview/story_ep10_voice_bgm_preview.mp3`. ⬜ Owner 청취 확인(읽기: 천구백구십오년·오십퍼센트대·열두시간씩 나흘·사조 이교대·삼분의 일쯤·사할).

## C. 이미지·영상 프롬프트
- ✅ 스펙 `scripts/_story-ep10-assembly-spec.mjs`(`STORY_EP10_SEMI_SPEC` 1~15번, `STORY_EP10_END_SPEC` 16번 부엉박사). 제품 상자·계기판·게시판에 글자·로고 없음.
- ✅ 이미지 16장 `C:/tmp/story-ep10-images/story_ep10_s{1..16}.png` 1차 생성, 재생성 0회. 연락 시트(`_sheets/s1_s9.png`, `s10_s15.png`)와 16번 원본 육안 검수: 글자·숫자·로고 없음(휴지 상자 무늬 없는 흰색), 인물은 뒷모습. 16번 부엉박사 머리 세로 41~60%. 6번 계기판 바늘은 절반보다 약간 아래(숫자 없음).
- ✅ 영상 프롬프트 `_ai/story-ep10-video-generation-prompts.md`: 8초 13개 / 10초 3개.
- ⬜ Owner Veo 영상 `Downloads/스토리 10편/1~16.mp4` → 검수 → 조립 → 워터마크 제거 → 오디오 마감 → QA → 커버 → 압축·콘텐츠 유닛·게이트 → 완성본 Owner 확인 → 게시 지시.
