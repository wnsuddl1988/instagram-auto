# 스토리 11~15편 검수·조립·커버 기록 (2026-10-13)

Owner 지시 "현재 생성된 영상 다 된 스토리는 조립~커버이미지까지 다 생성". 클립은 `Downloads/스토리 {N}편/1~N.mp4`(11·12편 Owner Veo·Gemini, 13~15편 Flow Lite + Gemini 혼합). 모두 **게시 전**, 제목은 임시안(Owner 확정 필요), 배경음은 25편분까지 사용(Owner 10/12: 26편부터 새로 안 만듦).

| 편 | 소재 | 클립 | 길이 | 완성본 | 커버(소스=1번 장면) | 임시 제목 |
|---|---|---|---|---|---|---|
| 11 | 포스코 제철소 | 15 | 80.4초 | `C:/tmp/story-ep11-assembled/story_ep11_mastered.mp4` | `story-ep11-cover/story_ep11_cover_v3.png`(4줄 156/156/165/165) | 빌릴 곳 없자 / 농어업 몫을 돌려 / 지은 제철소 |
| 12 | 디즈니월드 땅 | 16 | 85.3초 | `story-ep12-assembled/story_ep12_mastered.mp4` | `story-ep12-cover/story_ep12_cover_v3.png`(4줄 165×4) | 이름 숨긴 / 디즈니, 근처 / 땅값 650배 |
| 13 | 쿠쿠 | 16 | 66.1초 | `story-ep13-assembled/story_ep13_mastered.mp4` | `story-ep13-cover/story_ep13_cover_v3.png`(4줄 165×4) | 외환위기에 / 20억 건 하청이 / 밥솥 1위로 |
| 14 | 닌텐도 | 18 | 86.2초 | `story-ep14-assembled/story_ep14_mastered.mp4` | `story-ep14-cover/story_ep14_cover_v3.png`(4줄 156/165/165/165) | 즉석밥 팔던 / 화투 회사가 / 닌텐도 됐다 |
| 15 | 한진해운 | 16 | 83.6초 | `story-ep15-assembled/story_ep15_mastered.mp4` | `story-ep15-cover/story_ep15_cover_v3.png`(3줄 156/156/165) | 140억 달러 / 짐이 바다에 / 묶인 이유 |

모두 QA **반드시 수정 0**. 압축(35MB 이하)·콘텐츠 유닛·게이트는 배포 지시 때.

## 검수
- 클립 개수 = 장면 수, 720x1280, 8/10초 티어 일치, 어느 장면도 음성이 클립보다 길지 않음. 프레임 시트(`C:/tmp/story-ep{N}-review/sheet-*.png`) 육안: 글자·로고 없음(빈 간판은 흰색 그대로), 인물·소품 일관.
- **11편 8·9번(종이 표)에 읽히는 가짜 글자**("Bucqoft", "Farm view Stedlors"): 완성본에서 8번 30.3~33.9초 `x70·y820·180x55`, 9번 34.2~37.6초 `x95·y862·325x66` 흐림 처리(`story_ep11_mastered_before_textblur.mp4`가 처리 전). 흐림 상자가 손에 겹치는 순간이 있음.
- 못 본 것: 클립 안 소리, 전체 재생, 14편 s3·s12 등 Flow 재생성분 개별 정밀 재생(시트 4장 샘플만).

## 조립에서 한 일(도구: `C:/tmp/story-review-prep.mjs`·`story-pipeline.mjs`·`story-qa.mjs`)
- 11편: '시기상조'라고 한 어절 816px → `captionWidthExceptions` 추가.
- 12편: 금지 경계 `"그 / 자체로는."` → `captionBoundaryExceptions`(짧은 인용 대사, TTS 재생성 회피).
- 13편: `2015년 / 3분기에는` 경계 예외 + 맨 앞 0.0초 오디오 피크 +3.5dBTP(AAC 시작 과도) → 오디오에 40ms 페이드인(`story_ep13_mastered_prefade.mp4`가 처리 전, 피크 -1.0).
- 14편: 음량 -15.5 LUFS 하한 → 오디오 마감 `--tp -1.0`(-15.2 LUFS/-0.9dBTP).
- 15편: 경계 예외 5개(2016년|8월, 140억|달러어치, 4,700만|달러가, 1조 7,980억|원이었지, 2017년|2월).
- 커버: 제목 3줄은 140px 게이트에 걸려(11~14편) 의미 단위 4줄로 나눔(제목 문구 그대로, 줄바꿈만). 3:4·4:5 중앙 크롭 기준 상단 14.8%를 넘는 위치(16.8%~)라 안 잘림.

## 제목 갱신(10/13, Owner "제목은 니가 정해, 후킹제목으로")
- 위 표의 제목이 후킹 제목(Claude 확정)이다. 영상 속 제목 3줄(108px) 재조립·QA 수정 0, 커버는 같은 문구를 의미 단위 4줄로(165px 안팎). 11편 흐림·13편 페이드인·14편 tp -1.0은 재조립 뒤 다시 적용.


## 12편 제목 교체(10/14, CASE 창 점검 메모 대응)
- 이전 제목 "이름 숨긴 디즈니, 근처 땅값 650배" → **"이름 숨긴 디즈니, 평당 1달러도 안 되게 샀다"**. 이유: 13만 1천 달러·650배는 디즈니 공식 글(2012) **1곳만** 근거이고(`a nearby acre sold at $131,000`), 웹 확인에서 다른 자료는 "약 8만 달러까지 올랐다"고 적어 값이 엇갈림 → 제목 주장으로 쓰면 안 됨. 새 제목은 2출처 사실(평균 매입가 에이커당 200달러 미만 = 디즈니 공식 + Wikipedia 총 510만 달러/27,443에이커)만 사용, 내레이션 4·15번의 "평당 1달러도 안 되는 값"과 일치.
- 영상 속 제목 3줄 106·108·108px, 커버 `story-ep12-cover/story_ep12_cover_v4.png`(4줄 165/165/141/148, 최소 140px 통과). 완성본 `C:/tmp/story-ep12-assembled/story_ep12_mastered.mp4`(85.3초, QA 반드시 수정 0, 기존 경로 유지). 기존 본은 `story-ep12-assembled-prev-title650/`, 기존 커버는 v3.
- **내레이션 14번 교체(Owner 10/14 "1번 네 추천대로" = B안, 유료 녹음 1회)**: 기존 "공식 글에 따르면 … 13만 1천 달러 … 650배가 넘었지"는 1출처인데, 웹 재확인에서 당시 문서 모음(disneydocs.net)은 발표 뒤 근처 땅 값을 에이커당 350~3,000달러로 기록해 값이 크게 달라 **숫자를 쓰지 않는 서술**로 교체 → **"발표가 나자 근처 땅값은 정말로 뛰기 시작했어. 디즈니가 낸 값보다 훨씬 비싼 값에 땅이 팔렸지."**(디즈니 공식 + 문서 모음 둘 다 발표 뒤 값이 매입가 200달러 미만보다 훨씬 높았다고 기록). 대본 `story-ep12-disney-florida/scenes-v6.json`(스토리 검사기 반드시 수정 0), TTS는 14번 장면만 부분 생성(`story-ep12-tts-fix/`, 4장면 mini·14번만 사용)해 기존 연속 음성에 끼워 넣음(도구 `C:/tmp/story-splice-scene-k.mjs`, 결과 `story-ep12-tts/output-v1c`, 총 110.92→108.80초, 이음새 무음) → 정렬 보정 0.1 → 템포 ×1.2·쉼 0.25·유지 5,12(83.45초) → 배경음 새로 맞춤(`bgm.fit.mp3`, 이전본 `.bak-v5-85s`) → 재조립. 완성본 `story-ep12-assembled/story_ep12_mastered.mp4`(83.4초, QA 반드시 수정 0, 음량 -15.2 LUFS, 14번 구간 음량·자막 앞뒤와 일치). 이전본은 `story-ep12-assembled-prev-s14/`(제목만 교체본), `-prev-title650/`(650배 제목본). 전체 대본 파일 `story-ep12-tts-script.json`도 14번 갱신(백업 `.bak-before-s14-1014`).
- 실수 기록: 새 폴더 지정 없이 `story-pipeline.mjs`를 시험 호출해 기존 폴더 중간 파일(조립·워터마크 단계)을 덮어썼으나 확정 완성본 mastered와 QA는 손대지 않음(오디오 마감 단계에서 중단) → 이후 폴더가 새본으로 교체되어 문제 없음.

## 16편 (삼양 불닭, 2026-10-13 추가)
- 클립 17개(Flow Lite + Gemini s1·s17, 클립 위치 C:/tmp/money-shorts-os/story-clips-backup/ep16/), 완성본 C:/tmp/story-ep16-assembled/story_ep16_mastered.mp4(71.4초), 커버 C:/tmp/story-ep16-cover/story_ep16_cover_v1.png(4번 장면 소스, 4줄 156/156/165/165). 제목(Claude 확정, 후킹): 못 먹겠다던 / 라면이 매출 / 1,000억 돌파. QA 첫 시도 반드시 수정 0·확인 권장 0(예외·보정 불필요). 클립 검수: 글자·로고 없음.

## 14편 1번 장면 발음 교정(10/13)
- Owner 검수: 1번 장면 "화투"가 "그투"로 발음됨. 전체 재생성 대신 유료 TTS 1회(1번 장면+짧은 장면 3개, 약 124자)로 1번 장면 음성만 새로 만들고 기존 연속 음성의 1번 장면 구간만 교체(도구 C:/tmp/story-splice-scene1.mjs, 입력 story-ep14-tts-fix/, 결과 story-ep14-tts/output-v1b). 정렬 보정(0.1)·템포(1.2, gap 0.25, 유지 4,8)·배경음 맞춤(story-ep14-nintendo.bgm.fit-v1b.mp3) 후 재조립, QA 수정 0. 총 86.2→85.2초. 이전 완성본 C:/tmp/story-ep14-assembled-before-s1fix.
