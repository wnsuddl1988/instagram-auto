# 스토리형 8편 제작 체크리스트 — LG전자 휴대폰 철수 (2026-10-09)

> 작성 방식 = `_ai/story-script-rules.md` + 5~7편 체크리스트 형식. 단계가 끝날 때마다 ✅/⬜와 증거를 적는다. 게시 시점은 Owner 지시 때만.

## A. 소재·대본
- ✅ 소재: LG전자 휴대폰 사업 철수(2021.4.5), 사실 검증 20건 2출처 `C:/tmp/story-topic-vetting/lg-exit-2021.json`.
- ✅ 대본 Owner 확정(10/9): `C:/tmp/story-ep8-lg-exit/scenes-v6.json` 18장면 828자. v4 18번(음성 12.4초, Veo 클립 10초 초과)에서 "지나간 손실이 아니라 앞으로의 손실을 보고," 한 구절만 뺌(Owner 선택). 19장면 분할은 TTS 엔진 상한 18장면으로 불가(ABORT, 호출 없음). 게이트 반드시 수정 0.

## B. 소리
- ✅ TTS(story_v1, 속도 1.1, ElevenLabs 유료): 1차 `output-v1`(19장면 분할 전 18장면 v4, 164.6초, 폐기) → **최종 `output-v2` 18장면 v6 원본 158.76초, 호출 1/1**. 낭독 스크립트 `C:/tmp/story-ep8-lg-exit/build-tts-script.mjs`(어절 불일치 0곳) → `C:/tmp/money-shorts-os/story-ep8-tts/story-ep8-tts-script.json`. 유료 호출 합계 2회(v1 + v2).
- ✅ 정렬 점검 `--threshold 0.1`: 8곳 보정(s5·8·11·12·13·14·15·16, 최대 -0.3초).
- ✅ 템포 `--factor 1.2 --max-scene-gap 0.25 --keep-gap-scenes 2,11`: 쉼 7.54초 줄임, **126.01초**. 요약 `C:/tmp/money-shorts-os/story-ep8-tts/output-v2/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json`. 장면 최대 9.03초(18번), 전부 10초 이내.
- ✅ 배경음(Owner 승인, ElevenLabs Music 유료 1회, 6구간 126.0초 = 호기심 10.6 / 정점과 전환 22.2 / 하락 20.9 / 쌓인 돈 vs 앞으로의 손실 22.4 / 결정과 사람 33.8 / 여운 16.0): 원곡 `C:/tmp/money-shorts-os/story-ep8-bgm/output-v1/story-ep8-lg-exit.bgm.mp3`, 맞춤본 **`…/story-ep8-lg-exit.bgm.fit.mp3`**(126.013초, 끝 1.5초 페이드아웃). 미리 듣기 `…/story-ep8-bgm/preview/story_ep8_voice_bgm_preview.mp3`. ⬜ Owner 청취 확인(읽기: 이천이십일년 사월 오일·이십삼분기·오조 원·팔천억 원·삼천칠백명·지파이브·식스지).

## C. 이미지·영상 프롬프트
- ✅ 스펙 `scripts/_story-ep8-assembly-spec.mjs`(`STORY_EP8_SEMI_SPEC` 1~17번, `STORY_EP8_END_SPEC` 18번 부엉박사). 실제 회사·제품 로고·모양 흉내 없음, 인물은 뒷모습·손 위주.
- ✅ 이미지 18장 `C:/tmp/story-ep8-images/story_ep8_s{1..18}.png` 1차 생성, 재생성 0회. 연락 시트(`_sheets/s1_s9.png`, `s10_s17.png`)와 18번 원본 육안 검수: 글자·숫자·로고 없음, 인물은 뒷모습·손뿐. 18번 부엉박사 머리 세로 46~62%(안전). 못 본 것: 장면별 안전선 시트(조립 때), 영상 생성 후 움직임.
- ✅ 영상 프롬프트 `_ai/story-ep8-video-generation-prompts.md`: 8초 6개 / 10초 12개.
- ⬜ Owner Veo 영상 `Downloads/스토리 8편/1~18.mp4` → 검수 → 조립 → 워터마크 제거 → 오디오 마감 → QA → 커버 → 압축·콘텐츠 유닛·게이트 → 완성본 Owner 확인 → 게시 지시.
