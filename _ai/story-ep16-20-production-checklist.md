# 스토리형 16~20편 제작 체크리스트 (2026-10-12) — 게시 시점은 Owner 지시 때만

대본 최종본: [story-script-final-ep16-20-2026-10-12.md](story-script-final-ep16-20-2026-10-12.md) (17~20편 마지막 장면은 아래 B의 문구로 줄임). 생성기 `C:/tmp/story-base-gen.mjs`·`story-spec-gen.mjs`·`story-bgm-plans-16-20.mjs`·`run-images-16-20.mjs`, 원문 대조 도구 `C:/tmp/story-s2/grep-page.mjs`·`qverify.mjs`.

## A. 소재·대본 (5편 모두 ✅)
- ✅ 소재 검증 `C:/tmp/story-topic-vetting/story-ep{16..20}-*.json` — 출처 URL 원문 인용 103곳 일치(접속불가·원문에 없음 0).
- ✅ 설계 `C:/tmp/story-ep{16..20}-*/story-design.json`, 대본 `scenes-v1.json`(= `_ai/story-s2-scripts/`: 16 v1 · 17 v5 · 18 v6 · 19 v5 · 20 v6), 검사기 v4 반드시 수정 0.

## B. 소리 (5편 모두 ✅)
| 편 | TTS(유료) | 원본 | 템포 후 | 가장 긴 장면 | 배경음(유료) | 미리 듣기 |
|---|---|---|---|---|---|---|
| 16 | 1회 | 92.04초 | 71.365초 | s17 9.02초 | 1회 | `story-ep16-bgm/preview/story_ep16_voice_bgm_preview.mp3` |
| 17 | 2회(마지막 문구 축소) | 87.40초 | 66.488초 | s15 6.51초 | 1회 | `story-ep17-bgm/preview/…` |
| 18 | 2회 | 88.84초 | 69.669초 | s16 8.78초 | 1회 | `story-ep18-bgm/preview/…` |
| 19 | 2회 | 93.56초 | 69.704초 | s16 9.37초 | 1회 | `story-ep19-bgm/preview/…` |
| 20 | 2회 | 86.04초 | 67.633초 | s15 9.16초 | 1회 | `story-ep20-bgm/preview/…` |
- 템포 `--factor 1.2 --max-scene-gap 0.25`, 질문 장면 쉼 유지(16: 2,10 · 17: 3,11 · 18: 3,9,14 · 19: 2,12 · 20: 2,8,11). 이전 TTS는 `output-v1-old`에 보관.
- 17~20편 마지막 문구(Owner 승인 10/12 "1번 진행후 2번 연속"): 17 "공짜 옆에 또 다른 공짜가 있으면, 값을 매긴 쪽이 먼저 비게 돼. 프리챌의 다음 이야기가 궁금하면 팔로우해 줘." · 18 "사람들이 산 건 빵이 아니라 기억이었어. 모자란 건 빵이 아니라 그 기억의 개수였지. 포켓몬빵의 다음 이야기가 궁금하면 팔로우해 줘." · 19 "큰 숫자는 그 돈이 누구 주머니로 가는지부터 보면 달라. 280억 원은 협상할 권리의 값이었지. 류현진 이야기의 다음이 궁금하면 팔로우해 줘." · 20 "이름과 빵이 닮은 가게들은 손님도 소문도 같이 나눴어. 너무 빨리 늘어난 곳에선 작은 계기도 크게 번졌지. 이런 가게 이야기가 더 궁금하면 팔로우해 줘."
- ⬜ Owner 청취 확인(미리 듣기 5개).
- 유료 호출 합계: TTS 9회(16편 1 + 17~20편 각 2) · 배경음 5회.

## C. 스펙·프롬프트·이미지
- ✅ 조립 스펙 `scripts/_story-ep{16..20}-assembly-spec.mjs`(`STORY_EP{N}_SEMI_SPEC`·`END_SPEC`·`ASSEMBLE_SPEC`). 제목 `headerTitle`은 **임시안**(Owner 확정 필요).
- ✅ 영상 프롬프트 `_ai/story-ep{16..20}-video-generation-prompts.md`(사본 `Downloads/스토리 N편/스토리N편_영상프롬프트.md`): 16 8초15·10초2 / 17 8초15 / 18 8초15·10초1 / 19 8초15·10초1 / 20 8초14·10초1.
- ✅ 이미지 생성(ChatGPT 컨트롤러, `C:/tmp/run-images-16-20.mjs`, 로그 `C:/tmp/story-images-run-16-20.log` ALL DONE 10/12 14:28): 16편 17장·17편 15장·18편 16장·19편 16장·20편 15장 = 79장, 재생성 0회. 폴더 `C:/tmp/story-ep{N}-images/story_ep{N}_s{1..n}.png`.
- ✅ 연락 시트 육안 검수(글자·숫자·로고·얼굴, 편마다 `contact-ep{N}.png`) 5편 모두 통과 — 화면에 읽히는 글자·로고 없음, 인물은 모두 뒷모습, 소품·구도 규칙 준수. 사본 `Downloads/스토리16~20편_이미지/`(편별 폴더 + `연락시트_스토리N편.png`).
- ⬜ Owner Veo 영상 `Downloads/스토리 N편/1~n.mp4` → 검수 → 조립 → 워터마크 제거 → 오디오 마감 → QA → 커버 → (게시는 Owner 지시 때만).
