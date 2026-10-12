# 스토리 6~10편 검수·조립·커버 기록 (2026-10-10)

Owner 지시 "스토리 6편부터 10편까지 검수하고 조립~커버까지 진행해". 클립은 `Downloads/스토리 {N}편…/1~N.mp4`. 모두 **게시 전**, 제목은 임시안(Owner 확정 필요).

| 편 | 소재 | 클립 | 길이 | 완성본(원본 경로) | 커버 | 임시 제목(영상 속=커버) |
|---|---|---|---|---|---|---|
| 6 | 현대차 10년·10만 마일 보증 | 13 | 80.4초 | `C:/tmp/story-ep6-assembled-v2/story_ep6_mastered.mp4` | `story-ep6-cover/story_ep6_cover_v2.png`(9번 이미지, 3줄 144/165/165) | 놀림받던 차가 / 10년 보증을 / 내건 이유 |
| 7 | 배달의민족 전단지→4조 원 | 14 | 85.4초 | `C:/tmp/story-ep7-assembled/story_ep7_mastered.mp4` | `story-ep7-cover/story_ep7_cover_v1.png`(5번, 3줄 141/165/165) | 분리수거함의 / 전단지가 / 4조 원 됐다 |
| 8 | LG 휴대폰 철수 | 18 | 125.9초 | `C:/tmp/story-ep8-assembled-v2/story_ep8_mastered.mp4` | `story-ep8-cover/story_ep8_cover_v2.png`(4번, 3줄 142/165/165) | LG가 휴대폰을 / 26년 만에 / 접은 이유 |
| 9 | 하나로통신 ADSL | 15 | 78.3초 | `C:/tmp/story-ep9-assembled/story_ep9_mastered.mp4` | `story-ep9-cover/story_ep9_cover_v3.png`(7번, 4줄 165×4) | 60만 원 모뎀을 / 먼저 쓴 / 하나로통신 |
| 10 | 유한킴벌리 4조 2교대 | 16 | 79.6초 | `C:/tmp/story-ep10-assembled-v2/story_ep10_mastered.mp4` | `story-ep10-cover/story_ep10_cover_v2.png`(3번, 4줄 165/165/141/165) | 한 명도 안 자른 / 유한킴벌리의 / 4조 2교대 |

게시 전 필요: 35MB 이하 압축(현재 43~58MB), 콘텐츠 유닛·캡션 Owner 확인, 배포 게이트. 커버는 규칙 30대로 제목 단어 그대로 줄바꿈만(140px 게이트 때문에 편에 따라 4줄).

## 검수 결과
- 클립 개수가 장면 수와 일치, 720x1280·24fps, 8초/10초 티어 일치, 어느 장면도 음성이 클립보다 길지 않음. 프레임 시트(클립당 0.2·2.7·5.2·7.7초) 육안: 글자·로고 없음, 인물·소품 일관.
- **6편 9번 번호판에 읽히는 가짜 글자("PRIOSTVC")**: 완성본 51.35~52.6초 구간 번호판 자리를 240x92 흐림 처리(`story_ep6_mastered_before_plateblur.mp4`가 처리 전). 손이 잠깐 가릴 때 흐림 사각이 손 일부에도 겹침(0.3초). 못 본 것: 클립 안 소리, 전체 재생.
- 알려진 사소한 점: 6편 "J.D" 0.3초 한 단어 자막, 6편 1번 하단 절반이 빈 바닥, 8편 6번 폰 하단의 아주 작은 표기, 모든 클립 Veo 표시(제거 도구 처리).

## 맨 앞 태그 소리
- eleven_v3 오디오 태그 `[curious]`가 6·8·10편에서 0.1~0.2초 실제 발음됨(4편 "CURES" 문제와 같은 원인). `apply-story-tempo-once.mjs --first-start`(원본 초) 6편 0.18, 8편 0.165, 10편 0.19로 잘라 재조립. 10편은 태그와 첫 낱말 사이 무음이 없어 알라인먼트 기준으로 잘랐음(첫 음절 잘림 여부는 귀로 확인 못 함).
- 7·9편은 태그 구간 에너지가 발화보다 20dB 이상 낮아 자르지 않음(-30 vs -10dB).
- 배경음은 새 길이로 다시 맞춤: `*.bgm.fit-first.mp3`(6·8·10).

## QA(반드시 수정 0)
- 6: 확인 권장 3(J.D 0.3초·한 어절, "기다리면 돼" 0.53초).
- 7: 폭 예외 2(딜리버리히어로가·공정거래위원회는, 한 어절 8자 816px — `captionWidthExceptions`), 경계 예외 4(2019년|12월, 7,500억|원으로, 364억|원이었어, 2020년|12월), 한 단어 자막 3개.
- 8: 경계 예외 2(2015년|2분기부터, 약|3,700명이었어).
- 9: 폭 예외 1(시내전화만으로는), 경계 예외 1(한|하나로통신은).
- 10: 확인 권장 1("같은 일을" 0.51초).
- 예외는 모두 스펙에 사유와 함께 있음(TTS 재생성 회피). 자막 크기는 전 편 102px 유지.

## 도구·절차 메모
- 스펙: `scripts/_story-ep{6..10}-assembly-spec.mjs`에 `STORY_EP{N}_FULL_SPEC`·`STORY_EP{N}_ASSEMBLE_SPEC` 추가(5편 구성과 동일).
- 이번에 쓴 보조 스크립트(저장소 밖 `C:/tmp`): `story-review-prep.mjs`(클립 복사·길이 점검·프레임 시트), `story-pipeline.mjs`(조립→워터마크→마감→QA), `story-qa.mjs`, `story-head-profile.mjs`(앞 0.5초 음량), `story-bgm-fit2.mjs`.
- 한 어절이 한 줄 한도(760px)를 넘으면 글자를 줄이지 말고 `captionWidthExceptions`로 승인(94px로 줄이면 QA 최소 96px에 걸림, `captionMaxWidthPx`를 늘리면 다른 줄이 한도를 넘어 QA 실패).
