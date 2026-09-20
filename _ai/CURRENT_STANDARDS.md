# Money Shorts OS — 현행 기준 (Single Source of Truth)

이 문서는 **부엉박사(owl3dv5)**와 **금박사(coin3dv1)** 두 캐릭터 쇼츠 제작의 "지금 실제로 써야 하는 기준"만 담는다. 과거 방식은 여기 남기지 않는다 — 바뀐 기준이 생기면 이 문서를 그 자리에서 덮어쓰고, 낡은 내용은 지운다(별도 이력 문서는 두지 않음. 이력이 필요하면 git log/diff로 조회).

**이 문서가 다른 모든 오래된 지침·주석·백업 파일보다 우선한다.** 코드 내 주석이나 `_ai/` 안의 다른 문서와 충돌하면 이 문서를 따른다.

마지막 갱신: 2026-09-21

---

## 0. 두 캐릭터 공통

- 플랫폼: Instagram Reels+카드뉴스+Story, YouTube Shorts. 채널명(카드뉴스 배지 등): "경제번역소"
- 캡션(SNS 게시글) 스타일: 대본 나열 금지, `instagramCaptionHook`(후킹 문장 1개)+`instagramCaptionPoints`(3~4개 압축 포인트)로 작성. 감정·장식 이모지 전면 금지(화살표 👉 정도만 기능적으로 허용). IG/YT 동일 기준.
- 자막 계약: `scripts/_money-shorts-dynamic-captions.mjs`(`money_shorts_dynamic_semantic_caption_v6`)가 정의하는 규칙(폰트 Black Han Sans, 최대 dwell 6.8초, 줄당 목표 12자/최대 15자)을 따른다. **관형사(한/두/세/…/그/이/저/또/몇) 직후 분할 금지.** 단, 실제 구현은 이 파일에 없고 각 실행 스크립트가 `splitCaptionIntoScreenSafeBlocks`/`wrapToLines`/`wrapToLinesForced`를 개별 로컬 함수로 중복 구현한다(확인됨: `run-owl-assemble-shorts-v2.mjs`, `run-owl-cta-fixed-v2-caption-assemble-once.mjs`, `run-owl-opening-retrofit-caption-assemble-once.mjs`에는 관형사 규칙 적용됨 / 옛 `run-owl-cta-final-assemble-once.mjs`에는 미적용, 단 이 스크립트는 폐기됨). **새 자막 스크립트를 만들 때는 관형사 규칙을 직접 옮겨 적어야 한다 — 공용 모듈을 고치는 걸로는 안 된다.**
- 조립 엔진: `scripts/run-owl-assemble-shorts-v2.mjs` — 이름은 `owl`이지만 부엉박사·금박사 공용 범용 스크립트. `--spec-module`/`--spec-export`로 원하는 캐릭터 스펙을 주입해서 쓴다. 산출물 파일명은 캐릭터 무관하게 `owl_shorts_final.mp4`/`owl_timeline_silent.mp4`/`owl_captions.ass`로 고정(이름은 신경 쓰지 말 것 — 이게 정상이다).
- CTA 결합 엔진: `scripts/run-owl-episode-with-fixed-cta-once.mjs` — 이것도 공용. `--assembled`(본편 조립본)+`--scene8-start`(CTA 붙기 직전까지의 길이, 초)+`--cta-clip`(캐릭터별 고정 CTA 경로)+`--spec-module`/`--spec-export`(헤더 제목용)를 받는다.
- 이미지 생성: `scripts/probe-character-consistency-chatgpt-v1.mjs`. **원칙: 참조 이미지 첨부 + 같은 대화 세션에서 연속 생성.** 캐릭터 참조 이미지가 다르면 사고이므로 스크립트가 `--character` 값과 모드 플래그 불일치 시 강제 ABORT하게 되어 있다 — 이 가드를 우회하지 말 것.
- 영상 생성 프롬프트 5요소(항상 전부 포함): ①스타일 유지(캐릭터·의상·배경 고정) ②동작 디테일(씬 의도에 맞는 구체적 제스처) ③정지 요소(소품·그래픽 애니메이션 금지) ④부정 프롬프트(얼굴/비율 변형, 손가락 오류, 텍스트 왜곡 금지) ⑤**입 움직임 필수**("mouth actively opens and closes continuously... never static, never barely-moving, never closed-mouth talking" 문구 그대로 포함, 부정 프롬프트에도 대응 문구 포함).
- 영상 길이 티어: TTS 실측 길이 기준, 올림 없이 최소 여유만. **8초 미만 → 8초 이내 티어(8초로 요청). 8초 이상 → 8~10초 티어(실측값+1초 미만 여유).** 두 티어를 섞지 않는다. 8초 미만 요청 금지.
- 영상 생성기 상한: Gemini Veo(Flash-Lite) 10초까지, Google Flow는 lite 모델 8초 상한(넘으면 장면을 쪼갠다). Flow는 항상 `--model lite`(fast/quality 금지, 크레딧 10). Veo 동시 생성은 계정당 최대 2개(`--max-concurrent 2`).
- 오디오 자음 잘림 방지: TTS 발화 시작 시각을 alignment로 정확히 잡아 그 지점에서 바로 자르면 자음 어택이 잘린다. **오디오 태그 마커(`[confident]` 등) 구간까지 포함해 넉넉히 자른 뒤 `silenceremove`로 무음만 자동 트림**하는 방식을 쓴다. 단순 fade-in은 오히려 어택을 깎아 역효과.
- 캐릭터 등장 영상의 표정 붕괴 주의: 발화 종료 직후 클립 끝부분(특히 8초 이상 클립의 마지막 1초 근처)에서 입을 닫고 눈을 감는 등 이상 동작이 나오는 경우가 있음 — 반드시 끝부분까지 프레임 검수하고, 이상 구간은 정상 구간까지 트림해서 사용.
- 클립 간 전환: 마지막 프레임을 정지시켜 늘리는 방식(`tpad=stop_mode=clone`)은 "얼어붙었다 컷"처럼 부자연스럽다 — **0.4초 크로스디졸브(`xfade`+`acrossfade`)**로 전환한다.
- 화면 안전영역(1080x1920 기준, 오버레이·텍스트 배치 시 피할 것): `y 0~150`, `y 1600~1920`, `x 900~1080`. 여러 스펙 파일이 이 좌표를 참조한다(출처였던 `MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`는 구세대 문서 정리로 `_ai/archive/`로 이동, 이 좌표만 여기로 승계).

---

## 1. 부엉박사(owl3dv5)

### 캐릭터
- 3D 픽사풍 부엉이, 조끼+넥타이+이마에 걸친 선글라스, 웃지 않는 날카로운 표정이 기본(설명 중엔 자연스러운 입 움직임은 당연히 있음)
- 참조 이미지: `assets/character-references/owl3dv5-canonical-reference.png`
- 화면 표시 캐릭터명: "부엉박사"

### TTS
- ElevenLabs voice: **Liam - Energetic, Social Media Creator** (`TX3LPaxmHKxFdv7VOQHJ`), env `ELEVENLABS_VOICE_ID_OWL`/`ELEVENLABS_VOICE_LABEL_OWL`
- baseSpeed 0.95, stability 0.44, globalV3Tag "confident"

### 씬 구조
- 8편부터 오프닝 씬(`s1_opening`, role: "opening") 신설. 고정 템플릿: "안녕, 난 매일 경제 뉴스를 콕 집어 전해주는 부엉박사야! 오늘은 [주제] 얘기해볼게."
- 6~7편은 원래 오프닝 없이 배포됐으나 **2026-09-21 소급 추가 완료** — 6, 7편 모두 이제 오프닝 포함 10씬 구조로 재조립됨. **주의**: 이건 최종 산출 mp4 얘기다. `_owl-ep6/7-assembly-spec.mjs` 스펙 파일 자체는 여전히 9씬(오프닝 없음) 정의만 갖고 있다 — 오프닝 추가는 별도 스크립트(`run-owl-opening-retrofit-caption-assemble-once.mjs`)로 진행되어 스펙에 반영되지 않았다. 이 두 스펙 파일을 그대로 재실행하면 오프닝 없는 9씬 결과가 나온다.
- 스펙 파일 필수 필드: `headerTitle`(배열), `characterDisplayName: "부엉박사"`, `emphasisTerms`(편별 강조 핵심용어 — 없으면 자막 강조색이 전혀 안 걸리니 반드시 채울 것), `instagramCaptionHook`/`instagramCaptionPoints`/`instagramPriorityTags`

### 고정 CTA — 최우선 확인
- **확정 파일: `C:\tmp\owl-cta-fixed-v2\owl_cta_fixed_v2_final_v6.mp4`** (14.958초, 1080x1920)
- 구조: follow(0~8s, 팔로우 유도+좌하단 "팔로우/다음 소식도 먼저 받기" 카드) → 0.4초 크로스디졸브 → teaser(~7.6~14.96s, 다음 편 예고+좌하단 "경제번역소/다음 편도 기대해줘" 카드)
- 배경: 밝은 방송국/뉴스 스튜디오 톤. follow+teaser는 **반드시 같은 ChatGPT 대화 세션에서 연속 생성**해야 배경이 통일된다(따로 생성하면 배경이 어긋남 — 실제로 한 번 발생했던 문제).
- **앞으로 모든 부엉박사 편(과거·미래 전부)에 이 파일 하나만 고정 재사용한다.** 편마다 새로 만들지 않는다.
- 결합 예시:
  ```
  node scripts/run-owl-episode-with-fixed-cta-once.mjs \
    --spec-module ./_owl-ep{N}-assembly-spec.mjs \
    --assembled <본편 조립본 경로> \
    --scene8-start <오프닝 포함 본편 전체 길이, 초> \
    --cta-clip C:/tmp/owl-cta-fixed-v2/owl_cta_fixed_v2_final_v6.mp4 \
    --out-dir <출력 경로>
  ```
- 헤더 제목은 CTA의 follow 구간(첫 8초)에만 얹히고 teaser 구간엔 얹지 않는다(`CTA_FOLLOW_DURATION_SEC=8` 상수로 제어).

### 카드뉴스
- 최신 참고 편: `scripts/_owl-cardnews-ep9-spec.mjs` (4슬라이드: cover/body1/body2/closing)
- **문체: 카피라이팅 재구성**(영상 대본 그대로 재탕 금지, 핵심 수치만 유지) — 8편부터 확정
- **배경: 밝은 톤**(warm off-white/light gray, overlay 25~30% opacity) — **7편부터 확정, 다크 네이비 폐기**
- 배지: 좌상단 큰 노란 배지(#FFD54A, 이미지 폭 약 20%)에 진한 남색(#14213D) "경제번역소" 텍스트. 하단 텍스트 금지. 무브랜드(실제 은행명·로고 노출 금지) 원칙.

### 배포 상태 (2026-09-21 기준)
- **1~5편: Instagram Reels/카드뉴스/Story + YouTube Shorts 배포 완료**
- **6~9편: 제작 완료(오프닝 소급 포함), 미배포** — 최신 산출물:
  - 6편: `C:\tmp\owl-ep6-episode-final-v8\owl_episode_final.mp4`
  - 7편: `C:\tmp\owl-ep7-episode-final-v8\owl_episode_final.mp4`
  - 8편: `C:\tmp\owl-ep8-episode-final-v5\owl_episode_final.mp4`
  - 9편: `C:\tmp\owl-ep9-episode-final-v4\owl_episode_final.mp4`
  - (모두 CTA v6 적용 완료 최종본. 더 높은 버전 번호가 새로 생기면 그게 최신이니 폴더 목록으로 재확인할 것.)

---

## 2. 금박사(coin3dv1)

### 캐릭터
- 3D 픽사풍 순금 원반(동전), 흰 장갑 손, 둥근 금색 발, **무의상**(옷·장신구 없음), 표정은 항상 웃는 친근한 인상이 기본값
- 부엉박사와 결정적 차이: 유기체+정장 vs 무기체+무의상, 날카로운 무표정 vs 웃는 표정
- 참조 이미지: `assets/character-references/coin3dv1-canonical-reference.png`
- 화면 표시 캐릭터명: "금박사"

### TTS
- 전용 env: `ELEVENLABS_VOICE_ID_GEUMBAKSA`/`ELEVENLABS_VOICE_LABEL_GEUMBAKSA` (`--character geumbaksa`로 자동 선택)
- baseSpeed 1.04(부엉박사 0.95보다 빠름 — 실측상 발화가 글자수 추정보다 빠르게 나옴), stability 0.44

### 씬 구조
- 표준 9~11단(소재에 따라 유연). 오프닝 고정 템플릿: "안녕, 어려운 경제·금융 용어를 쉽게 풀어주는 금박사야. 오늘은 [주제] 얘기해볼게."
- 배경은 매 편 겹치지 않게 새로 설계(직전 편들과 다른 공간)

### 파일명 번호 vs 실제 배포 번호 — 반드시 확인할 것
편별 스펙 파일명(`episode` 필드)과 실제 배포 순서(`deployEpisode` 필드/의도)가 다르다. 새 작업 시작 전 반드시 이 표로 확인:

| 스펙 파일(episode) | 소재 | 실제 배포 순서 |
|---|---|---|
| ep4 (`_geumbaksa-ep4-assembly-spec.mjs`) | 환율 | **배포 1편** |
| ep1 (`_geumbaksa-assembly-spec.mjs`) | IRP | 배포 2편 |
| ep2 | ETF | 배포 3편 |
| ep3 | 레버리지 | 배포 4편 |
| ep5 (`_geumbaksa-ep5-assembly-spec.mjs`) | 신용점수 | 배포 5편 |

### 고정 CTA — 최우선 확인 (2026-09-21 수정됨)
- **확정 파일: `C:\tmp\geumbaksa-cta-fixed-clean\geumbaksa_cta_clean_final.mp4`** (8.475초, 1080x1920)
- **주의**: 이전에 쓰던 `C:\tmp\geumbaksa-cta-assembly-v2\owl_shorts_final.mp4`는 **결함 있는 파일이다 — 절대 다시 쓰지 말 것.** 1편(IRP) 전용 헤더 텍스트("IRP 세액공제 넣을수록 돌려받는다?")가 영상 자체에 하드코딩되어 있어서, 다른 편에 재사용하면 그 편의 헤더와 겹쳐서 렌더링된다.
- 새 확정 파일은 헤더 없는 순수 원본(`C:\tmp\geumbaksa-cta-final\geumbaksa_cta_no_captions.mp4`)에 기존 검증된 하단 자막(`C:\tmp\geumbaksa-cta-assembly-v2\owl_captions.ass` — 이 자막 파일 자체는 문제없음, 헤더가 없는 순수 팔로우 유도 멘트만 있음)을 다시 입혀 만들었다.
- 나레이션(고정): "몰랐던 돈 얘기, 금박사가 하나씩 쉽게 풀어줄게. 아는 만큼 챙길 수 있는 게 많아지니까, 팔로우 눌러두고 계속 같이 알아가자."
- 배경: 밝은 거실(부엉박사 CTA의 뉴스 스튜디오 톤과는 다른, 금박사 전용 공간). 부엉박사 CTA를 재사용하지 않는다(캐릭터가 바뀌어 흐름이 끊긴다는 이유로 전용 CTA를 별도 신설했음).
- **CTA 없이 마무리한다는 옛 원칙(1~4편 스펙 주석에 남아있음)은 폐기됨.** 지금은 이 CTA를 모든 금박사 편 끝에 고정 결합한다.
- 결합 예시(5편 실제 적용):
  ```
  node scripts/run-owl-episode-with-fixed-cta-once.mjs \
    --spec-module ./_geumbaksa-ep5-assembly-spec.mjs \
    --spec-export GEUMBAKSA_EP5_ASSEMBLY_SPEC \
    --assembled <9~11씬 조립본 경로> \
    --scene8-start <본편 전체 길이, 초> \
    --cta-clip C:/tmp/geumbaksa-cta-fixed-clean/geumbaksa_cta_clean_final.mp4 \
    --out-dir <출력 경로>
  ```
  `--scene8-start`에는 이름과 무관하게 "CTA 붙기 직전까지, 즉 본편 전체 길이"를 그대로 넣는다(금박사는 부엉이처럼 8번째 장면이 CTA가 아니라 편 전체가 본편이라서 그렇다).

### 카드뉴스
- **문체**: 5편(신용점수)부터 카피라이팅 문체로 전환 완료. 1~4편은 아직 영상 대본을 거의 그대로 쓴 옛 방식(재작업하지 않음, 배포 완료 상태 그대로 유지).
- **배경 톤: 1~5편은 다크 네이비(45~55% opacity)로 이미 제작 완료 — 재작업하지 않는다(Owner 확정 2026-09-21).** **6편부터 부엉박사와 동일한 밝은 톤(warm off-white/light gray, overlay 25~30% opacity)으로 전환한다.** 구현 참고: `scripts/_owl-cardnews-ep9-spec.mjs`의 `BRIGHT_OVERLAY_NOTE` 상수를 그대로 가져와 금박사 프롬프트에 적용할 것.
- 배지 규칙은 부엉박사와 동일(좌상단 노란 배지+"경제번역소").

### 배포 상태
- 배포 순서 기준: 1편=ep4(환율), 2편=ep1(IRP), 3편=ep2(ETF), 4편=ep3(레버리지), 5편=ep5(신용점수)
- 카드뉴스는 별도 배포 없이 해당 영상 배포일에 세트로 함께 게시
- 5편 최신 산출물: `C:\tmp\geumbaksa-ep5-episode-final-v2\owl_episode_final.mp4` (78.57초, CTA 클린 버전 적용 완료)
- 5편 카드뉴스: `C:\tmp\geumbaksa-cardnews-ep5\` (5장, 다크 네이비 배경 — Owner 확정으로 재작업하지 않고 그대로 유지. 밝은 톤은 6편부터 적용)

---

## 3. 다음에 이 문서를 갱신해야 하는 시점

- CTA 자산을 다시 만들거나 교체할 때 (경로가 바뀌면 이 문서의 "확정 파일" 줄만 즉시 고친다)
- 카드뉴스/캡션/자막 스타일 원칙이 또 바뀔 때
- 새 편이 배포되어 "배포 상태" 표가 바뀔 때
- 두 캐릭터 사이에 스타일 격차가 또 발견될 때(발견 즉시 어느 쪽이 최신인지 명시하고 격차 해소 작업을 걸어둘 것)

이 문서를 갱신하지 않고 코드 주석이나 대화로만 기준을 바꾸면, 다음 세션에서 다시 이번과 같은 "기준을 못 찾아 헤매는" 문제가 반복된다.
