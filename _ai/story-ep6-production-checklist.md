# 스토리형 6편 제작 체크리스트 — 현대차 10년·10만 마일 보증 (2026-10-08)

> 작성 방식 = `_ai/story-script-rules.md` + 5편 체크리스트 형식. 단계가 끝날 때마다 ✅/⬜와 증거를 적는다. 게시 시점은 Owner 지시 때만.

## A. 소재·대본
- ✅ 소재: 현대자동차 미국 신뢰 위기와 10년·10만 마일 파워트레인 보증(90년대 말), 사실 검증 24/24 원문 대조 `C:/tmp/story-topic-vetting/hyundai-warranty-90s.json`.
- ✅ 대본 Owner 확정(10/8): `C:/tmp/story-ep6-hyundai-warranty/scenes-v9.json` 13장면·504자(끝 문장 "다음 일화는 팔로우하고 기다리면 돼."). 설계 `story-design.json`, 게이트 반드시 수정 0.
- ✅ Owner 승인(10/8): "6편 TTS생성, 배경음악포함 → 이미지생성 → 영상프롬프트생성".

## B. 소리
- ✅ TTS(story_v1, 속도 1.1, ElevenLabs 유료 1회, 래퍼 `owl-tts --character owl --arm`): 13장면 원본 **104.68초**. 낭독 스크립트 `C:/tmp/story-ep6-hyundai-warranty/build-tts-script.mjs`(어절 불일치 0곳) → `C:/tmp/money-shorts-os/story-ep6-tts/story-ep6-tts-script.json`.
- ✅ 정렬 점검: 1·4·5·11번 4곳 보정(-0.2~-0.3초), 나머지 정상. 1번 시작이 0→0.267초로 밀려 템포 도구가 "앞부분 잘림"을 길이에 반영하지 않던 결함을 발견해 `apply-story-tempo-once.mjs`를 고침(첫 장면 시작이 0이 아닐 때 그만큼을 제거량에 넣음, 이전 편은 시작 0이라 영향 없음).
- ✅ 템포 `--factor 1.2 --max-scene-gap 0.25 --keep-gap-scenes 3,11`: 쉼 8.01초 줄임, **80.54초**(요약 80.559초, 차이 0.018초). ★ Owner 청취(10/8): 첫머리 "미국"이 안 들림 → 원인: 정렬 보정이 s1 시작을 0.267초로 밀어 템포 도구가 그만큼(실제 첫 소리 0.055초) 앞을 잘라냄. 템포 도구가 첫 장면을 항상 0초부터 쓰게 고치고 6편만 다시 처리(5·7편은 s1 보정 없음, 영향 없음). 최종 요약 `…/story-ep6-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json`.
- ✅ 배경음(Owner 승인, ElevenLabs Music 유료 1회, 6구간 80.3초 = 놀림과 파격 16.8 / 시작과 틈 13.8 / 딜러와 바닥 16.0 / 약속 6.0 / 판매 상승·품질은 늦게 13.3 / 올라감과 여운 14.5): 원곡 `C:/tmp/money-shorts-os/story-ep6-bgm/output-v1/story-ep6-hyundai.bgm.mp3`(80.379초), 맞춤본 **`…/story-ep6-hyundai.bgm.fit80.mp3`**(80.337초, 끝 1.5초 페이드아웃). 미리 듣기 `…/story-ep6-bgm/preview/story_ep6_voice_bgm_preview.mp3`. ⬜ Owner 청취 확인.
- ⬜ Owner 청취 확인(읽기: 십년·십만 마일·천구백팔십육년·제이디 파워·삼십이위·칠위·삼위).

## C. 이미지·영상 프롬프트
- ✅ 스펙 `scripts/_story-ep6-assembly-spec.mjs`(`STORY_EP6_SEMI_SPEC` 1~12번, `STORY_EP6_END_SPEC` 13번 부엉박사). 실존 인물 오인 방지: 얼굴이 크게 안 나오게 뒷모습·작은 모습·손과 소품 위주(4편 11번 영상 거부 교훈).
- ✅ 이미지 13장 `C:/tmp/story-ep6-images/story_ep6_s{1..13}.png` 모두 1차 생성, 재생성 0회. 연락 시트(1~12번)와 13번 원본 육안 검수: 글자 없음, 얼굴 클로즈업 없음. ⚠ 13번 부엉박사 뒤 자동차 앞 그릴에 아주 작은 둥근 엠블럼이 보임(글자·실제 로고 아님) — 영상 생성 때 거슬리면 알려 주세요.
- ✅ 영상 프롬프트 `_ai/story-ep6-video-generation-prompts.md`: 8초 8개 / 10초 5개.
- ⬜ Owner Veo 영상 `Downloads/스토리 6편/1~13.mp4` → 검수 → 조립 → 워터마크 제거 → 오디오 마감 → QA → 커버 → 압축·콘텐츠 유닛·게이트 → 완성본 Owner 확인 → 게시 지시.
