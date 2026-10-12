# 스토리형 5편 제작 체크리스트 — 삼성 화형식 (2026-10-08)

> 작성 방식 = `_ai/story-script-rules.md` + 3·4편 체크리스트 형식. 단계가 끝날 때마다 ✅/⬜와 증거를 적는다. 게시 시점은 Owner 지시 때만.

## A. 소재·대본
- ✅ 소재: 삼성전자 구미 사업장 불량 제품 소각(1995), 사실 검증 24/24 원문 대조 `C:/tmp/story-topic-vetting/samsung-anycall-burning-1995.json`.
- ✅ 대본 Owner 확정(10/8): `C:/tmp/story-ep7-anycall/scenes-v9.json` 15장면·523자. 설계 `story-design.json`, 게이트 반드시 수정 0.
- ✅ Owner 승인(10/8): "2번 5편 TTS 생성 및 이미지생성, 영상프롬프트줘".

## B. 소리
- ✅ TTS(story_v1, 속도 1.1, ElevenLabs 유료 1회, 래퍼 `owl-tts --character owl --arm`): 15장면 원본 **98.52초**. 낭독 스크립트 `C:/tmp/story-ep7-anycall/build-tts-script.mjs`(어절 불일치 0곳) → `C:/tmp/money-shorts-os/story-ep5-tts/story-ep5-tts-script.json`.
- ✅ 정렬 점검 `fix-tts-alignment-from-audio-once.mjs --threshold 0.1`: 12번 1곳(-0.2초)만 보정, 나머지 정상. → `…output-v1/elevenlabs-scene-paced-tts-summary.audio-fixed.json`.
- ✅ 템포 `apply-story-tempo-once.mjs --factor 1.2 --max-scene-gap 0.25 --keep-gap-scenes 4,10`: 쉼 5.5초 줄임, **77.50초**. 최종 요약 `…output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json`.
- ⬜ Owner 청취 확인(읽기: 십일점팔퍼센트·이십오점팔·오십이점오·오십일점오에서오십이퍼센트·이퍼센트대·일위).
- ✅ 배경음(Owner 10/8 "5편 배경음 계획과 생성 진행해" 승인, ElevenLabs Music 유료 1회, 6구간 77.5초 = 불타는 충격 14.9 / 왜·불량 8.1 / 시장 압박 14.2 / 값과 지시 9.9 / 반전 14.6 / 정직한 선택 여운 15.7): 계획 `C:/tmp/story-ep7-anycall/build-bgm-plan.mjs` → `C:/tmp/money-shorts-os/story-ep5-bgm/story-ep5-bgm-plan.json`. 원곡 `…/story-ep5-bgm/output-v1/story-ep5-samsung.bgm.mp3`(77.558초), 음성 길이 맞춤본 **`…/story-ep5-samsung.bgm.fit78.mp3`**(77.517초, atempo 1.0005, 끝 1.5초 페이드아웃). 미리 듣기(음성+배경음 -26dB) `…/story-ep5-bgm/preview/story_ep5_voice_bgm_preview.mp3`. ⬜ Owner 청취 확인.

## C. 이미지·영상 프롬프트
- ✅ 스펙 `scripts/_story-ep5-assembly-spec.mjs`(`STORY_EP5_SEMI_SPEC` 1~14번 반사실 3D, `STORY_EP5_END_SPEC` 15번 부엉박사). 회장은 손·소품만(10·11번), 글자·로고 없음.
- ✅ 이미지 15장 `C:/tmp/story-ep5-images/story_ep5_s{1..15}.png` — 15장 모두 1차 생성, 재생성 0회.
- 직접 본 것: 14장 연락 시트 + 2·6·11·14·15번 원본. 글자·로고 없음, 회장 얼굴 없음, 소각 장면 인물 일관.
- ⚠ 6번 손님 머리 세로 29~41%, 14번 손님 머리 31~45%로 조금 높음 → 3편처럼 조립 때 영상 230px 내림으로 안전 구간(약 41~43% 이상)에 들어오는지 조립 후 확인. 15번 부엉박사는 머리 38~57%(이전 편과 같은 수준).
- ✅ 영상 프롬프트 `_ai/story-ep5-video-generation-prompts.md`: 8초 12개 / 10초 3개(7·13·15번). 생성기 `scripts/build-story-video-generation-prompts.mjs`.
- ⬜ Owner Veo 영상 `Downloads/스토리 5편/1~15.mp4` → 검수 → 조립 → 워터마크 제거 → 오디오 마감 → QA → 커버 → 압축·콘텐츠 유닛·게이트 → 완성본 Owner 확인 → 게시 지시.
- ★ Veo 프롬프트 주의(10/8, 4편 11번 거부 사례): 직업명(조사원·수사관·검사)과 사건 암시 MOOD 문구를 쓰지 않는다.

## D. 영상 검수·조립·커버 (Owner Veo `Downloads/스토리 5편(삼성화형식)/1~15.mp4`, 2026-10-10)
- ✅ 영상 검수: 15개 모두 있음, 720x1280·24fps. 7·13·15번 10초 / 나머지 8초 — 프롬프트 티어와 일치. 프레임 시트 3장(클립당 0.2·2.7·5.2·7.7초) 육안: 글자·로고·회장 얼굴 없음, 소각·불량 검사·매장·점유율 비교 탑·회장 책상 손·부엉박사 일관.
- 알려진 사소한 점: 1번 하단 절반이 빈 운동장(자막이 올라오는 자리), 3번 2.7초 연기 합성 느낌 한 프레임, 10번 서명 종이의 낙서 무늬(글자 아님), 모든 클립 Veo ✦·"Veo" 표시(제거 도구 처리).
- ✅ 맨 앞 태그 소리: 마감본 앞 0.2초 무음(-58dB), 말은 0.2초부터 — 4편의 "[curious]" 발음 문제 없음(`spokenStartSec` 0.23).
- ✅ 스펙: `scripts/_story-ep5-assembly-spec.mjs`에 `STORY_EP5_FULL_SPEC`·`STORY_EP5_ASSEMBLE_SPEC` 추가(4편과 같은 구성). **제목 = 임시안(Owner 확정 필요)** "500억 원어치 / 불량품을 / 직접 불태운 날"(소스 제목에서 '삼성 화형식 —'만 뺌).
- ✅ 조립 `C:/tmp/story-ep5-assembled/`(77.5초, 컷 리드 0.10~0.14초, 누적 오차 0) → 워터마크 제거 → 마감(BGM -26dB, -15.3 LUFS/-1.3 dBTP) → **`story_ep5_mastered.mp4`**(50.5MB, 게시 전 35MB 이하 압축 필요).
- ⚠ 13번 장면은 음성(10.46초)이 클립(10.0초)보다 길어 마지막 프레임을 0.45초 정지로 늘림(허용 범위, 장면 끝).
- ✅ QA `qa-report.md`: **반드시 수정 0**. 경계 줄바꿈 예외 1곳(스펙에 사유): "휴대폰만이 / 아니라"(s3). 확인 권장: 0.6초 미만 자막 2개("합친 수였어" 0.57초, "치러야 해" 0.40초).
- ✅ 커버 `C:/tmp/story-ep5-cover/story_ep5_cover_v5.png`: 소스 1번 이미지를 불더미가 아래로 오게 1.3배 크롭(`s1_crop_fire_low.png`), 4줄 142/165/165/165px(게이트 140 통과), 세로 18.2~53.8%. 3줄은 "직접 불태운 날"이 119px라 게이트 불통 → 4줄.
- ⬜ Owner 완성본 확인·제목 확정 → 압축·콘텐츠 유닛·게이트 → 게시 지시. 못 본 것: 처음부터 끝까지 재생, 소리 청취.
