# Money Shorts OS — 현행 기준 (Single Source of Truth)

**부엉박사(owl3dv5)·금박사(coin3dv1)·황소특보(bull3dv1)** 세 캐릭터 쇼츠 제작에서 "지금 실제로 써야 하는 기준"만 담는다. 바뀐 기준이 생기면 이 문서를 그 자리에서 덮어쓰고 낡은 내용은 지운다(이력은 git log/diff로 조회).

**이 문서가 다른 모든 지침·메모리·코드 주석·`_ai/` 안의 다른 문서보다 우선한다.** 충돌하면 이 문서를 따르고, 충돌 사실을 Owner에게 보고한다.

마지막 갱신: 2026-09-27 (**모델 권장 기준 추가**, 황소특보 v3 확정, 부엉박사 v2 확정 + 재고 7편 v2 재제작·재배치(새 11편부터), ChatGPT UI 변경 대응, CTA 결합 스크립트 표준화, 오프닝 재배치 적용 시점 확정)

## ★ 모델 권장 기준 (2026-09-27 확정 — Owner 지시: 과도한 Opus 추천 중단)

기본은 **Sonnet**이다. 이 프로젝트(주제 선정·대본·이미지/영상 검수·조립·배포)는 v3(황소특보)·v2(부엉박사) 틀이 이미 정해져 있어 그 틀을 채우는 작업이 대부분이고, 실제 품질은 모델보다 **본 문서의 확인 절차(팩트 재검색, 자막 읽는표기 검사, 재사용 영상 끝부분 점검, 화면·음성 길이 비교 등)를 빠짐없이 따르는지**로 갈린다.

- **Sonnet(medium~high)**: 영상 검수, 조립, CTA 결합, 커버·스토리·카드뉴스 이미지 생성, 배포. 기본값.
- **Sonnet(high)**: 소재 선정, v2/v3 틀에 맞춘 대본 작성, 팩트 확인.
- **Opus로 올리는 경우(예외, 상시 아님)**: ① 대본 구조 자체를 새로 설계하거나 벤치마크를 대량 분석할 때(예: 황소특보 v3, 부엉박사 v2 근거 조사) ② 같은 대본이 2번 넘게 반려될 때 ③ 원인을 못 찾는 문제가 반복될 때.
- 완료 보고의 "다음 추천 작업"에는 이 기준에 따라 모델을 추천한다(임의로 Opus를 기본값처럼 추천하지 않는다).

---

## ★ 최우선 규칙 — 작업 시작 전 반드시 확인 (예외 없음)

1. **작업 전에 이 문서를 먼저 읽는다.** 메모리·대화 기억·옛 문서보다 이 문서가 우선이다. 편 번호·경로는 §7 "재고·다음 번호"에서 확인한다.
2. **대본 구조**
   - 황소특보: **5편부터 영구적으로 v3(§3)**. 옛 v1/v2 구조로 되돌아가지 않는다.
   - 부엉박사: **11편부터 영구적으로 v2(§1)** — 훅→오프닝 한 문장→개념 정의→상황→"나한테 뭐가 달라지나/어떻게 해야 하나"→항목 2~3단→주의→정리+확인→금박사 연결, 전체 115~130초. 옛 구조 재고 7편은 배포하지 않고 v2로 전부 다시 만든다(순서·번호는 §7).
   - 금박사 **11편부터**: 오프닝(자기소개)을 훅 **뒤**로 옮기고 한 문장으로 줄인다(§2). 10편까지와 재고는 옛 구조 그대로.
3. **TTS**: 씬 하나의 순수 발화(`rawAudioDurationSec`)는 **9.5초 이내**로 쓴다(10초 초과 금지). 세그먼트 한 조각은 7~8어절 이내로 끊는다(§A-3).
4. **이미지**: 작은 글씨 금지 · 소품은 감싸 쥐거나 바닥 거치 · 크고 빈 면 금지 · 캐릭터는 화면 세로의 45~50%(§0-1, §A-4). ChatGPT 화면이 바뀌어 자동화가 실패하면 §4 체크리스트를 따른다.
5. **영상 프롬프트**: §A-5 형식 그대로(영어, 5개 HIGHEST PRIORITY 블록). **8초 씬끼리, 10초 씬끼리 묶어서** 전달한다. 9초 요청 금지.
6. **조립 + CTA**: `run-owl-assemble-shorts-v2.mjs` → `run-owl-episode-with-fixed-cta-once.mjs --alignment ...`를 **한 번에 이어서** 실행하고, `cta-join-report.json`이 PASS인지 확인한 뒤 완성본 하나로 검수를 요청한다(§A-7). **xfade 금지, 수동 ffmpeg 결합 금지.**
7. **배포 자산**: 카드뉴스는 **부엉박사만** 만든다. 커버(=유튜브 썸네일 겸용)와 스토리 이미지는 세 캐릭터 모두 편마다 **새로** 만든다. 스토리 이미지는 9:16 전용 스펙으로 만들어 Instagram Story에만 올린다(§A-8).
8. **배포**: §5 절차를 한 단계도 빼지 않는다(커버 merge 필수, `--privacy public` 필수, `youtubeTitle`에 `#Shorts` 넣지 않음).
9. **금박사 5편 이후 재고는 새 목소리(Yohan Koo) 경로만 쓴다**(`geumbaksa-ep{N}-final-v2voice`). `-episode-final-v12`는 옛 여성 목소리본이라 배포하면 안 된다(§7).
10. 외부 게시·유료 API·env/secret·commit/push·삭제는 Owner가 명시적으로 승인할 때만 한다.
11. **★ 황소특보 소재 찾기 (2026-09-30 Owner 확정)**: "N편 주제 찾아보자" 류 요청이 오면 **매번 새로 탐색**한다(미리 쌓아 둔 창고 없음, 재고를 원하면 Owner가 따로 요청). 지시 없이 §3 "소재"의 **자동 적용 규칙**(일정 러너 → 레인 뉴스 검색 → 후보별 쏠림 점검)을 전부 실행한다. 후보는 **7~12개**를 기본으로 내고, **번호 = 추천순위**(1번이 최우선)로 쓴다. 순위는 **중요도(시청자 매매·자산에 직접 닿는가, 특보다운 무게)와 신선도(제작·게시 동안 안 식는가, 기한이 있으면 그 기한)**를 함께 반영하고, 쏠림 경고는 후보를 빼지 않고 표시만 한다. 각 후보에 레인·영역·유형·경고·팩트 확인 상태(확인/제목 수준)를 붙인다.
13. **★ 부엉박사 소재 찾기 (2026-09-30 Owner 확정, 11번과 같은 뼈대)**: "부엉박사 N편 주제 찾아보자" → **매번 새로 탐색**, 후보 **7~12개**, **번호 = 추천순위**, 레인·영역·경고·팩트 상태 표시, 쏠림 경고는 표시만. 부엉박사만 다른 점: ⓐ 순위 기준은 **시청자 행동·자산 영향도 > 팩트 안정성(공식 자료로 확정 가능) > 신선도(시행일 임박·최근 개정·신청 마감 D-N)** — 하루 만에 식는 소재가 아니라서 신선도 비중이 황소특보보다 작다. ⓑ 후보 단계에서 **정부 제도명의 현재 운영 여부를 공식 사이트로 확인**하고(청년내일채움공제 사고), 전망치는 같은 가정끼리만 비교한다. ⓒ 레인(초안): ① 제도 변경·시행 D-N ② 내 돈 계산법(대출·세금·연금) ③ 주거(월세·전세·청약·경매) ④ 소득·일자리 지원 ⑤ 생활물가·공공요금 ⑥ 지표 번역(ECOS/KOSIS) ⑦ 금융사기·피해 예방 ⑧ 신청 마감 임박 혜택. 쏠림 기준: 최근 5편 중 같은 영역 ≤2, 직전 편과 같은 레인·같은 제목 모양 연속 금지, 경제사냥꾼식 "진짜 이유/정체" 제목 금지. ⓓ 18편부터 금박사 연결 폐지이므로 소재는 독립 선정한다. ⓔ **도구**: 부엉박사용 레인 뉴스 검색·게시 장부는 아직 없다(황소특보 전용만 있음) — 부엉박사 소재가 실제로 필요해지는 때(재고 15~18편 소진 전) Claude가 황소특보 도구를 본떠 만든다. 그 전에는 웹 검색 + ECOS/KOSIS 지표로 같은 형식으로 제안한다.
12. **★ 작업 방식이 바뀌면 그때마다 이 최우선 규칙 + 메모리(MEMORY.md 최우선 섹션)에 기록한다.** Owner가 매번 요청하지 않아도 Claude가 먼저 한다(2026-09-30 Owner 확정). 새 규칙은 세션이 바뀌어도 누락되지 않도록 문서와 메모리 양쪽에 남긴다.

---

## 0. 세 캐릭터 공통

- 플랫폼: Instagram Reels·Story(부엉박사는 카드뉴스 포함), YouTube Shorts. 채널명(배지·워터마크): "경제번역소". 세 캐릭터 모두 같은 채널이다.
- **하루 배포 순서(2026-09-25 확정)**: 오전 황소특보 → 점심~이른 오후 부엉박사 → 오후~저녁 금박사. 정확한 시각은 Owner가 그날 정한다. 금박사는 반드시 부엉박사 뒤에 올린다.
- **금박사 소재는 새로 잡지 않는다.** 같은 날 또는 직전 부엉박사 편에서 이름만 나오고 설명 없이 지나간 용어를 이어받아 풀어준다.
- 캡션: 대본을 나열하지 않는다. `instagramCaptionHook`(후킹 문장 1개) + `instagramCaptionPoints`(3~6개 압축 포인트). 장식 이모지 금지(기능용 👉만 허용). IG·YT 같은 기준.
- 제목·훅은 뉴스 제목을 그대로 쓰지 않고 궁금증·반전으로 프레이밍한다. 인스타 태그는 경제·금융·지식 계열로 충분히 채운다.
- 자막: 폰트 Black Han Sans, 최대 dwell 6.8초, 줄당 목표 12자(최대 15자). 관형사(한/두/세/그/이/저/또/몇) 바로 뒤나 부정 부사("못", "안") 뒤에서 줄을 나누지 않는다. 숫자는 자막에 아라비아 숫자로 쓴다.
- **정부 제도명은 대본 확정 전에 최신 운영 여부를 공식 사이트에서 확인한다.** 신규 가입 중단·폐지된 제도를 현재형으로 쓰면 이미지·영상·TTS를 전부 다시 만들어야 한다(부엉박사 11편 청년내일채움공제 사고).
- 소재는 시청자가 "그래서 내가 뭘 하면 되는지"가 있어야 한다. 자극적이어도 행동이 없는 가십성 소재는 쓰지 않는다.
- 화면 안전영역(1080x1920, 오버레이 배치 시 피할 곳): `y 0~150`, `y 1600~1920`, `x 900~1080`.

### 0-1. ★ 영상 생성 절대규칙 (2026-09-21, 87씬 전수조사로 확정)

**전제: Veo 영상 실패는 영상 프롬프트로 못 막는다. 이미지를 만들 때 막아야 한다.** 텍스트 깨짐은 0.1초 첫 프레임에서 이미 생긴다. `FROZEN PROP`, `pixel-perfect` 같은 문구를 더 세게 쓰는 방식은 한계가 확인됐으니 반복하지 않는다.

1. **소품·배경 글자는 "크고 짧게".** 깨지는 건 예외 없이 글자 높이가 화면의 약 1.5% 이하인 작은 글씨다. 설명문·부연 캡션·다항목 목록은 이미지에 그리지 말고 필요하면 조립 단계 자막으로 처리한다. 한 보드에 한글 3줄(줄당 12자 이내)까지는 안전하다.
2. **소품은 감싸 쥐거나 바닥에 세운다.** 손끝·날개 위에 얹은 소품은 팔을 움직이면 떨어진다(5건 중 4건 사고). 바닥 거치(이젤·스탠디·플립보드)는 7/7 무사고. **영상 프롬프트에서 동작은 소품을 들지 않은 손에만 준다.** 소품 든 팔은 "holds steadily / does not move"로 고정하고, 이동·왕복 지시를 쓰지 않는다.
3. **크고 빈 면을 남기지 않는다.** Veo는 빈 면을 없던 글자로 채운다(가짜 전화번호, "PIXAR" 등). 캐릭터 몸통 클로즈업, 빈 게이지·빈 보드를 피한다.
4. **검수**: 텍스트는 시작 프레임 1장을 확대해 판정한다. 소품 이탈·표정 붕괴는 끝 프레임(길이-0.3초)과 중반 프레임도 본다. 한글 오타는 원본 이미지부터 틀린 경우가 많으니 항상 원본 이미지와 대조한다.
5. **코드 강제**: `probe-character-consistency-chatgpt-v1.mjs`의 `VEO_SAFE_IMAGE_RULE`·`KOREAN_TEXT_ONLY_RULE`·캐릭터 화면 비율 규칙이 모든 씬 이미지 프롬프트에 자동으로 들어간다. **이 상수들을 제거하거나 우회하지 않는다.** `imageBrief`도 처음부터 이 규칙에 맞춰 쓴다.

---

## A. 제작 파이프라인 (세 캐릭터 공통 순서)

```
1 소재 확정 → 2 대본 스펙 → 3 TTS → 4 씬 이미지 → 5 영상 프롬프트(Owner가 직접 생성)
→ 6 영상 검수 → 7 조립+CTA 결합(한 번에) → 8 커버·스토리(·카드뉴스) → 9 배포(§5)
```

### A-1. 소재
- 부엉박사: 생활·정책 경제 뉴스(ECOS/KOSIS 지표 포함), 시청자 행동이 있는 것. 신선도 확인.
- 금박사: 부엉박사가 언급만 한 용어를 이어받는다(§0).
- 황소특보: §3 "소재" 참고(러너 5종 + 일정 캘린더, 종목명 허용리스트).

### A-2. 대본 스펙
- 파일: `scripts/_{owl|geumbaksa|bull}-ep{N}-assembly-spec.mjs`. 직전 편 스펙을 복사해 시작한다(최신 템플릿: 황소특보 `_bull-ep4-assembly-spec.mjs`, 부엉박사 v2 첫 편(새 11편)은 `_owl-v2-assembly-spec-template.mjs`(이후는 직전 편), 금박사 `_geumbaksa-ep10-assembly-spec.mjs`).
- 필수 필드: `title`, `headerTitle`(2줄 배열), `characterDisplayName`, `emphasisTerms`(없으면 자막 강조색이 안 걸림), `instagramCaptionHook`/`instagramCaptionPoints`/`instagramPriorityTags`, 씬마다 `scene`·`key`·`role`·`video`(파일명)·`narration`·`imageBrief`·`overlays`. 황소특보는 오프닝 씬과 마지막 씬에 `riskDisclosure: true`.
- 대본은 흐름을 먼저 자연스럽게 쓰고 요건은 나중에 대조한다. 연속 씬의 어미·동사를 반복하지 않는다. 훅이 오프닝을 반복하지 않는다. 같은 수치를 두 번 쓰지 않는다.
- 이미지 생성은 **대본(숫자 포함)이 최종 확정된 뒤에만** 시작한다.

### A-3. TTS (ElevenLabs)
- 대본 JSON: `C:/tmp/money-shorts-os/{char}-ep{N}-tts/{char}-ep{N}-tts-script.json` (형식은 `C:/tmp/money-shorts-os/bull-ep4-tts/bull-ep4-tts-script.json` 참고: `topicSpeechProfile.baseSpeed/baseStability/globalV3Tag`, 씬별 `narration`·`captionDisplayText`·`speechDirection.segments[{text,pauseAfterMs}]`).
- 실행(자격증명 no-log 래퍼, 경로는 반드시 `C:\tmp\money-shorts-os\` 아래):
  ```
  node scripts/run-owner-command-with-local-env-no-log.mjs owl-tts --tts-script <tts-script.json> --out-dir <출력폴더> --character <owl|geumbaksa|bull> --arm
  ```
- 캐릭터별 속도: 부엉박사 0.95(v2 새 11편부터 1.0 시험, §1), 금박사 1.04, 황소특보 1.05(러너가 0.95~1.05로 강제하므로 1.1 불가). 쉼: 문장 중간 220ms, 씬 끝 420ms. 정보 전달 씬은 confident·clearly 태그를 우선한다(seriously·calmly는 느려짐).
- **씬 길이 판정은 `rawAudioDurationSec`(순수 발화) 기준**이다(`normalizedDurationSec`와 혼동 금지). 한 씬 9.5초 이내, 넘으면 문장을 옮기거나 씬을 나눈다(내용 축소가 아니라 재배분).
- **자막 숫자 표기 맞춤(2026-09-26 13편 사고)**: 대본(narration)의 숫자와 세그먼트(읽는 표기)의 읽는 법이 어긋나면 그 씬 자막 전체가 읽는 표기("삼백육십만")로 찍힌다. 예: 대본 "1명당" + 세그먼트 "한 명당" → 실패. 고유어로 읽는 수(한 명, 두 개 등)는 대본에도 한글로 쓴다. **어절 수도 맞춘다** — 읽기가 "칠천칠백 원씩"(2어절)이면 대본도 "7,700 원씩"(2어절)으로 띄운다(14편 사고). 조립 후 `owl_captions.ass`에서 `[일이삼사오육칠팔구십백천](년|월|개월|만|퍼센트)`를 검색해 0건인지 확인한다.
- 세그먼트 한 조각이 9어절 이상이면 자막이 화면 폭을 넘어 잘게 쪼개지므로 7~8어절 이내로 콤마 단위로 끊는다.
- 결과: `…/elevenlabs-scene-paced-tts-summary.json`(씬별 길이), `…/*.alignment.json`(글자별 시각, CTA 결합에 사용).

### A-4. 씬 이미지 (ChatGPT 웹 자동화)
- 스크립트: `scripts/probe-character-consistency-chatgpt-v1.mjs`. **편마다 전용 모드를 이 파일에 추가한다**: 직전 편 블록(예: `BULL_EP4_14SCENE_MODE` / `BULL_EP4_14SCENE_ONLY` / `POSES_BULL_EP4_14SCENE`)을 복사해 `--{char}-ep{N}-{씬수}scene` 플래그와 씬별 `imageBrief` 배열을 만든다. 캐릭터 불일치 시 강제 ABORT 가드가 있으니 우회하지 않는다.
- 실행:
  ```
  ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character <owl3dv5|coin3dv1|bull3dv1> --{char}-ep{N}-{씬수}scene --out-dir C:/tmp/{char}-ep{N}-images
  # 일부 씬만 재생성: --{char}-ep{N}-{씬수}scene-only 3,7
  ```
- 원칙: 실행 1회 = 새 대화 1개(스크립트가 새 채팅을 강제로 연다), 그 안에서 캐릭터 참조 이미지를 첨부하고 씬을 연속 생성한다. 참조 이미지: `assets/character-references/{owl3dv5|coin3dv1|bull3dv1}-canonical-reference.png`.
- 검수 기준: 캐릭터가 화면 세로 45~50%를 넘게 크면 재생성, 글자 오타·작은 글씨·빈 면·불안정 그립이 있으면 재생성. 배경 글자는 한국어만.

### A-5. 영상 생성 프롬프트 (Owner가 Veo/Flow로 직접 생성)
- 문서: `_ai/{char}-ep{N}-video-generation-prompts.md`. **최신 템플릿: `_ai/bull-ep4-video-generation-prompts.md`** — 형식을 줄이거나 요약하지 않고 그대로 따른다.
- 문서 맨 위 표: 씬 / 이미지 파일 / 저장할 영상 파일명 / 실측 발화(raw) / 요청 티어 / 예상 여유 / (생성 도구).
- **티어는 8초·10초 두 가지뿐.** 발화 8초 미만이고 여유가 1초 이상이면 8초, 그 외(8초 이상이거나 여유 1초 미만)는 10초. 10초로 정한 씬은 발화가 10초를 넘지 않는 한 안전하다(다시 줄이지 않는다). **Gemini(Veo)로 배정한 씬은 발화와 무관하게 항상 10초**로 쓴다. 9초 요청 금지.
- **본문은 🟦 8초 티어 묶음 → 🟨 10초 티어 묶음 순서로 나눠 적는다.**
- 씬마다 영어로, 아래 블록을 빠짐없이 쓴다:
  `Animate this image into an N-second video clip.` + STYLE CONSISTENCY → **CAMERA LOCK (HIGHEST PRIORITY)** → **PROP LOCK (HIGHEST PRIORITY)**(카드·보드에 적힌 한글을 정확히 인용) → MOTION DETAIL(동작은 빈 손에만) → **CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY)**(마지막 2~3초까지 눈 깜빡임·고개·입 움직임) → STATIC ELEMENTS → **CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY)** → NEGATIVE PROMPT → MOUTH MOVEMENT("mouth actively opens and closes continuously... never static, never barely-moving, never closed-mouth talking").
- 바닥 거치 소품은 STATIC ELEMENTS와 NEGATIVE PROMPT에 "넘어지거나 미끄러지지 않는다"를 넣는다.
- **나레이션이 있는 영상에는 "Silent"를 절대 쓰지 않는다**(입 움직임 지시와 충돌해 생성이 거부됨).
- **소품 고정 지시는 "holds steadily at [위치] ... does not move/tilt/rotate/drift"로만 쓴다. "permanently glued to the character's hands"처럼 신체 접착·변형을 연상시키는 표현은 절대 쓰지 않는다** — Gemini(제미나이 앱/웹)에서 이미지 업로드는 되는데 프롬프트 제출 직후(5초 이내) 전 씬이 일반 에러로 즉시 거부되는 사고가 이 표현 때문에 났다(금박사 11편, 2026-09-28). 같은 프롬프트가 Flow에서는 정상 생성됐다 — 두 도구가 안전 필터를 다르게 적용하므로, "Flow는 되는데 Gemini만 안 된다"는 신호가 보이면 이미지가 아니라 문구를 의심한다. 상세: [[feedback_gemini_prompt_wording_refusal_2026_09_28]].
- 한 클립 한 동작. 문·물체를 여닫는 식의 두 번째 동작을 넣지 않는다(Veo 거절 원인).
- 생성기 상한: Veo(Flash-Lite 기본) 10초 고정, 계정당 동시 2개. Flow는 항상 `--model lite`.

### A-6. 영상 검수
- Owner가 `C:\Users\PC\Downloads\1.mp4`~`N.mp4`로 전달하면 **숫자가 곧 씬 번호**다(묻지 않는다). `C:/tmp/{char}-ep{N}-videos/{char}_ep{N}_s{번호}_motion.mp4`(스펙의 `video` 필드 이름)로 복사한다.
- 씬마다 ffprobe 길이(요청 티어와 일치, 발화보다 긴지) + 시작·중반·끝 프레임을 확대해서 본다(글자 깨짐, 소품 이탈, 카메라 줌·크롭, 표정 붕괴, 정지).
- Veo 화면에 quota 문구가 떠도 완성된 영상이 있으면 먼저 확인한다(실패로 오판 금지).

### A-7. 조립 + CTA 결합 (★ 항상 한 번에 이어서 실행)
1. 본편 조립:
   ```
   node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_{char}-ep{N}-assembly-spec.mjs --spec-export <SPEC_EXPORT> \
     --clip-dir C:/tmp/{char}-ep{N}-videos --audio-summary <…/elevenlabs-scene-paced-tts-summary.json> \
     --tts-script <…/tts-script.json> --out-dir C:/tmp/{char}-ep{N}-assembly-v1
   ```
   - `--spec-module`은 `scripts/` 기준 상대경로(`./_…mjs`)로 쓴다. 산출물 이름은 캐릭터와 무관하게 `owl_shorts_final.mp4`(정상).
   - 씬 사이는 발화 타이밍에 맞춘 컷이다. 클립이 발화보다 길면 자르기만 하고, 정지 프레임(tpad)으로 늘리지 않는다 → 그래서 영상 요청 티어를 항상 발화보다 여유 있게 잡는다.
2. CTA 결합(본편 오디오 길이를 먼저 확인: `ffprobe -v error -select_streams a:0 -show_entries stream=duration -of default=nw=1:nk=1 <owl_shorts_final.mp4>`):
   ```
   node scripts/run-owl-episode-with-fixed-cta-once.mjs --spec-module ./_{char}-ep{N}-assembly-spec.mjs --spec-export <SPEC_EXPORT> \
     --assembled C:/tmp/{char}-ep{N}-assembly-v1/owl_shorts_final.mp4 --scene8-start <본편 오디오 길이> \
     --cta-clip <캐릭터별 고정 CTA 경로(§1~§3)> --alignment <그 편 TTS *.alignment.json> \
     --out-dir C:/tmp/{char}-ep{N}-final
   ```
   - 스크립트가 표준 절차를 자동으로 수행한다(2026-09-26 내장): 마지막 발화 종료 시각까지 마지막 프레임을 연장 → 본편 끝 0.3초 fade-out → CTA 0.3초 fade-in → 오디오는 겹치지 않게 순차 결합, 발화 사이 무음 최소 0.3초 보장. 상단 헤더 제목은 CTA 앞 8초 구간에 자동으로 얹힌다.
   - `--scene8-start`는 이름과 무관하게 **본편 오디오 전체 길이**다. `--alignment`를 빼면 무음 감지로 추정하므로 항상 넣는다.
   - **결과 확인**: `<out-dir>/cta-join-report.json`의 `frameCheck`·`avLengthCheck`가 PASS여야 한다. `checkFramesAtSec`의 네 시점(발화 종료 직전 / 전환 / 전환 후 / CTA 마지막 프레임)을 프레임으로 뽑아 눈으로 확인한다.
   - **금지**: xfade, 수동 ffmpeg 결합, CTA 클립 새로 만들기, CTA 앞 대기 인트로 추가. 새 CTA 클립으로 바꾸면 스크립트의 `KNOWN_CTA_LEADING_SILENCE_TRIM_SEC`에 실측값을 등록해야 한다(등록 안 하면 ABORT).
3. 완성본(CTA까지 붙은 것) 하나로 Owner에게 검수를 요청한다. "본편 조립했는데 CTA도 붙일까요?"처럼 중간에 끊지 않는다.

### A-8. 커버·스토리·카드뉴스 이미지
- 스크립트(공통): `scripts/run-owl-cardnews-chatgpt-v1.mjs` — 스펙의 `character` 필드(`"bull"`/`"geumbaksa"`, 없으면 부엉박사)로 참조 이미지를 자동 선택한다.
  ```
  ALLOW_CHATGPT_IMAGE=1 node scripts/run-owl-cardnews-chatgpt-v1.mjs --spec-module ./_{char}-{cover|story|cardnews}-ep{N}-spec.mjs --out-dir C:/tmp/{char}-{cover|story|cardnews}-ep{N} [--preflight-only] [--only <slideId>]
  ```
- **커버**(`_{char}-cover-ep{N}-spec.mjs`, 1080x1920): 릴스 커버 + 유튜브 썸네일 겸용. 편마다 새로 설계한다 — 캐릭터 과장 표정 + 선명한 그라디언트 배경(흐릿한 사진톤 금지) + 반전·궁금증 훅 문구 2줄. 핵심 요소(글자+캐릭터 얼굴)는 **세로 중앙 30~75% 안전영역** 안에 둔다(플랫폼별 크롭 대응). 좌상단 "경제번역소" 배지. 최신 템플릿: `_bull-cover-ep4-spec.mjs`.
- **스토리**(`_{char}-story-ep{N}-spec.mjs`, 1080x1920 풀프레임): 커버를 재사용하지 않고 9:16 전용으로 따로 만든다. Instagram Story에만 게시(24시간 소멸). 피드·카드뉴스로 올리지 않는다. 최신 템플릿: `_bull-story-ep4-spec.mjs`.
- **카드뉴스(부엉박사만)**: `_owl-cardnews-ep{N}-spec.mjs`, 4슬라이드(cover/body1/body2/closing). 카피라이팅으로 재구성(대본 재탕 금지, 핵심 수치만 유지), 밝은 배경(warm off-white/light gray, 오버레이 25~30%), 좌상단 노란 배지(#FFD54A, 폭 약 20%)에 남색(#14213D) "경제번역소", 하단 글자 금지, 실제 은행명·로고 금지. 최신 템플릿: `_owl-cardnews-ep16-spec.mjs`.
- 생성 후 반드시 이미지를 직접 열어 오타·배치·캐릭터 일관성을 확인한다.

---

## 1. 부엉박사 (owl3dv5)

- **역할**: 경제·정책 뉴스를 "내 지갑 얘기"로 풀어주는 본편 애널리스트. 하루 1편, 뉴스 기반, 가장 강한 훅.
- 외형: 3D 픽사풍 부엉이, 조끼+넥타이+이마에 걸친 선글라스, 날카롭고 웃지 않는 표정(말할 때 입은 움직임). 참조: `assets/character-references/owl3dv5-canonical-reference.png`.
- TTS: Liam(`TX3LPaxmHKxFdv7VOQHJ`, env `ELEVENLABS_VOICE_ID_OWL`), stability 0.44, globalV3Tag confident. baseSpeed: **배포 완료 1~10편 0.95 / v2(새 11편)부터 1.0 시험**(2026-09-26 Owner 결정 — 새 11편 TTS를 듣고 어색하면 0.95로 되돌린다).
- 옛 씬 구조 v1(배포 완료 1~10편): 오프닝 → 훅 → 사실 → 정의/조건 → 근거 → 주의사항 → 행동 → 고정 CTA. 더 이상 쓰지 않는다. 미배포 v1 재고 7편은 배포하지 않고 v2로 다시 만든다(§7).

### ★ 씬 구조 v2 (2026-09-26 확정 — 새 11편부터 영구 기준, 옛 v1로 되돌아가지 않음)

근거: 경제사냥꾼 정책·제도·거시형 79개 자막 원문 분석([benchmark-moneyhunter-policy-shorts-analysis-2026-09-26.md](benchmark-moneyhunter-policy-shorts-analysis-2026-09-26.md)) + 486개 분석, 세 캐릭터 공통 1~5초 이탈률 약 90%(Owner 인사이트). 템플릿: [`scripts/_owl-v2-assembly-spec-template.mjs`](../scripts/_owl-v2-assembly-spec-template.mjs)(`scriptStructureVersion: "owl_script_structure_v2"`) — **v2 첫 편(새 11편)은 이 파일을 복사해 `_owl-v2-ep11-assembly-spec.mjs`로 시작하고, 이후는 직전 편 스펙을 복사한다.**

- **길이·분량**(Owner 결정): 전체 **115~130초** = 본편 약 100~115초 + 고정 CTA 15초. 11~13씬, 씬당 순수 발화 9.5초 이내. 대본은 숫자를 한글로 읽은 기준 **약 560~640자(추정치 — 새 11편 TTS 실측으로 보정해 이 줄을 고친다)**.
- **황소특보와 역할 분리**: 황소특보 = "왜 올랐나·떨어졌나"(원인형). 부엉박사 = **"나한테 뭐가 달라지나"(제도 변경형)** 또는 **"나는 어떻게 해야 하나"(대처법형)**. 원인 분석 위주의 소재·질문은 쓰지 않는다. 벤치마크 정책형에서 "대처법" 제목이 조회수 가장 높았다(n=6, 참고).
- **정보 공개**: 제도의 답(대상·금액·시점·방법)은 본문에서 전부 알려준다. 정보를 숨기거나 댓글 키워드로 미루지 않는다.
- **금박사 연결(★ 18편부터 폐지, Owner 2026-09-30)**: 금박사 릴스 반응이 세 캐릭터 중 가장 낮고 정의형 소재 위주라, 18편부터 부엉박사 마지막 씬에서 금박사를 언급하지 않는다. 마지막 씬은 "저장해 두고 신청 전 다시 확인 + 댓글 요청"(18편 예: "이 두 가지는 저장해 두고, 신청하기 전에 다시 확인해. 궁금한 제도는 댓글로 남겨줘."). 경·공매처럼 시청자에게 익숙한 용어는 본문에서 풀지 않는다. **15~17편과 짝 금박사 재고(9편 실업급여, 10편 DB/DC)는 이미 연결이 대본에 있으므로 그대로 둔다.** (이전 규칙: 이름만 나오고 설명하지 않은 보조 용어 1개를 마지막 씬에서 금박사에게 넘김.)
- **카드 든 씬은 영상 10초로 요청(2026-09-30)**: 8초 클립은 끝에서 카드가 투명해져 사라지는 사고가 8편 s12, 9편 s15(2회)에서 났다. 소품 없는 오프닝만 8초를 쓴다. 조립은 사용 구간까지만 쓰므로 10초로 받아도 손해가 없다.

| 구간 | 목표 시점(전체 약 121초 기준) | 역할 | 문장 공식(부엉박사 고유 문구) |
|---|---|---|---|
| 훅 | 0~12초 | **대상 호명** + "알고 있었어?"형 질문 + 수치 1개 + "대부분 모르는" 호기심 또는 손해 회피 | `[대상] 있는 사람, [바뀐 것] 알고 있었어? + [숫자] + [모르면 ~/대부분 ~만 알아]` |
| 오프닝 | 12~16초 | 자기소개 한 문장 | `안녕, 매일 경제 뉴스를 콕 집어 전해주는 부엉박사야.` |
| 개념 정의 | 16~24초 | 주제 제도·용어를 한 문장으로 | `[제도]는 ~하는 거야.` |
| 상황 | 24~42초 | 기관·날짜·공식 수치 2~4개, 제도 변경형은 **기존 vs 변경** 대비 | `[기관]이 [날짜] ~ 발표했어. 원래는 ~였는데, 이제는 ~야.` |
| 핵심 질문+즉답 | 약 30~35% 지점 | C형 "나한테 뭐가 달라질까" / D형 "나는 어떻게 해야 할까" 묻고 바로 답 | `그럼 나한테는 뭐가 달라질까? 답부터 말하면, ~야.` |
| 항목 2~3단 | 50~77초 | 첫째 대상(누가) / 둘째 금액·혜택(얼마, **계산 예시 1개**) / (셋째 시점·방법). 항목마다 "쉽게 풀면" 또는 비유 1개 | `첫째, ~. 쉽게 풀면, ~` |
| 주의 | 약 70~75% 지점 | 놓치면 손해 보는 조건·되돌릴 수 없는 점 한 줄 | `그렇다고 무작정 ~하면 안 돼. ~하면 ~가 사라지거든.` |
| 정리+확인 | 끝나기 약 25~35초 전 | 한 문장 결론 + **먼저 확인할 것** 2가지 | `콕 집어 정리하면, ~. 지금 먼저 확인할 건 두 가지야. ~, 그리고 ~.` |
| 연결 | 마지막 씬(→ 고정 CTA) | 확인·신청 경로 → 금박사 연결 → 댓글 요청 | `[경로]에서 바로 확인할 수 있어. [보조 용어]가 헷갈리면 금박사가 이어서 쉽게 풀어줄게. 궁금한 제도는 댓글로 남겨줘.` |

- **쓰지 않는 문구**: 경제사냥꾼("님들", "딱 1분만 집중해봐", "정리할게", "꼭 기억하고", "진짜 부자되자"), 황소특보("다들,", "핵심만 짚어줄게, 끝까지 들어봐", "한 줄로 정리하면", "이것만은 챙겨가"). 고정 CTA 클립에 "팔로우"가 있으므로 마지막 씬에서 팔로우를 말하지 않는다.
- 연속 씬 어미·동사 반복 금지, 같은 수치 두 번 금지, 훅이 오프닝을 반복하지 않음 등 대본 공통 원칙(§A-2)은 그대로.
- **고정 CTA**: `C:\tmp\owl-cta-fixed-v2\owl_cta_fixed_v2_final_v6.mp4`(14.96초, follow 8초 + teaser). 모든 편에 이 파일 하나만 쓴다.
- 배포 자산: 릴스(+커버) · 카드뉴스 4장 · 스토리 · 유튜브(+썸네일=커버).

## 2. 금박사 (coin3dv1)

- **역할**: 부엉박사가 언급한 어려운 경제·금융 용어를 쉽게 풀어주는 보충 해설(투자 상품에 한정하지 않음). 부엉박사와 같은 영상에 나오지 않는다.
- 외형: 3D 픽사풍 순금 동전, 흰 장갑 손, 둥근 금색 발, 옷 없음, 늘 웃는 표정. 참조: `assets/character-references/coin3dv1-canonical-reference.png`.
- TTS: **Yohan Koo**(`4JJwo477JUAx3HV0T7n7`, env `ELEVENLABS_VOICE_ID_GEUMBAKSA`, 2026-09-25 교체), baseSpeed 1.04, stability 0.44. 영어 이름에 KO 표기가 없는 다국어 보이스는 한국어 발음이 어색하니 후보로 쓰지 않는다.
- **씬 구조(9~11씬)**: 체감 상황 → 한 줄 정리("그게 바로 OOO야") → 대상 → 방법 → 핵심 수치(공식 출처 검증) → 체감 환산 → 장기 시뮬레이션 → 마무리(이득 정리, 행동 지시는 부엉박사 몫). 발화가 길면 압축하지 말고 씬을 나눈다.
  - **10편까지(재고 포함)**: s1 오프닝("안녕, 어려운 경제·금융 용어를 쉽게 풀어주는 금박사야. 오늘은 [주제] 얘기해볼게.")으로 시작. 그대로 둔다.
  - **★ 11편부터**: s1 훅(체감 상황을 질문·반전으로, 0초부터) → s2 오프닝 한 문장("안녕, 어려운 경제·금융 용어를 쉽게 풀어주는 금박사야.") → 본문.
- 배경은 매 편 직전 편들과 겹치지 않게 새로 설계한다.
- **고정 CTA(현행)**: `C:\tmp\geumbaksa-cta-fixed-clean\geumbaksa_cta_clean_final_v3voice.mp4`(7.75초, Yohan Koo 목소리, 0초부터 발화). 5편 이후 전부 이것. 옛 `geumbaksa_cta_clean_final.mp4`(여성 목소리)는 표시 1~4편 전용이라 새 편에 쓰지 않는다.
- 배포 자산: 릴스(+커버) · 스토리 · 유튜브(+썸네일=커버). **카드뉴스 없음.**
- **표시 번호 ≠ 파일 번호(주의)**: 1편=파일 ep4(환율), 2편=ep1(IRP, 파일 `_geumbaksa-assembly-spec.mjs`), 3편=ep2(ETF), 4편=ep3(레버리지). **5~10편도 부엉박사 재배치에 따라 어긋난다(§7 표: 5=ep7, 6=ep8, 7=ep5, 8=ep6, 9=ep10, 10=ep9).** 신규 11편부터 파일 번호 = 표시 번호. 파일 이름은 바꾸지 않는다.

## 3. 황소특보 (bull3dv1)

- **역할**: 주식 매매·투자 정보 캐스터. 1~2일 안의 시황·섹터·종목 소식을 "정보 전달 + 궁금증 + 재방문 유도"로 전달한다. 부엉박사·금박사로 들어오는 유입 통로 역할도 한다. 실생활 정보 채널이 아니다.
- 외형: 3D 픽사풍 골드 SD 황소, 큰 뿔, 안경(선글라스 아님), 흰 셔츠+버건디 넥타이+네이비 바지(재킷 없음), 밝고 명랑한 표정. 화면 세로 45~50%. 참조: `assets/character-references/bull3dv1-canonical-reference.png`.
- TTS: Jeonggi(`HCANy6ACvOWyndVWS0gV`, env `ELEVENLABS_VOICE_ID_BULL`), **baseSpeed 1.05**, stability 0.44, globalV3Tag confident.
- **고정 CTA**: `C:\tmp\bull-cta-fixed-v5\bull_cta_fixed_final_with_captions.mp4`(8.33초, 단일 클립). 1편부터 계속 같은 파일이고 대본 구조가 바뀌어도 그대로 쓴다.
- 리스크 고지: 나레이션에 넣지 않는다. 오프닝 씬과 마지막 씬 하단 자막바로만(`riskDisclosure: true`). CTA에는 넣지 않는다.
- 배포 자산: 릴스(+커버) · 스토리 · 유튜브(+썸네일=커버). **카드뉴스 없음.**

### ★ 씬 구조 v3 (2026-09-26 확정 — 5편부터 영구 기준, 최초 실전 적용 = 4편)

근거: 경제사냥꾼 쇼츠 486개 자막 원문 전수분석([benchmark-moneyhunter-shorts-analysis-2026-09-26.md](benchmark-moneyhunter-shorts-analysis-2026-09-26.md)). 실제 적용 예: [`scripts/_bull-ep4-assembly-spec.mjs`](../scripts/_bull-ep4-assembly-spec.mjs)(`scriptStructureVersion: "bull_script_structure_v3"`) — **새 편은 이 파일을 템플릿으로 복사해서 시작한다.**

- **길이·분량**: 본편 약 115~127초 + CTA 8.3초 = 전체 약 125~135초. 대본은 **숫자를 한글로 읽은 기준 약 600~640자**(공백·문장부호 제외, "9.39%"는 "구점삼구퍼센트"로 센다). 12~14씬, 씬당 순수 발화 9.5초(약 50자) 이내. 4편 실측: 643자 → 본편 127.2초.
- **TTS**: 속도 1.05 → 순수 발화 초당 약 5.5자(숫자가 많은 씬은 약 4.8자).
- **제작량**: 씬마다 새 캐릭터 영상. 동작이 같은 씬만 클립 재사용(이미지가 같을 때만). 데이터 카드 정지 이미지 씬은 쓰지 않는다.
- **호칭**: 훅 첫마디는 "다들,". 오프닝(자기소개)은 **훅 뒤에 한 문장**.
- **정보 공개**: 주제의 답(원인·이유)은 본문에서 전부 알려준다. 뒤로 미루는 건 "앞으로 나올 결과(날짜·이벤트)"뿐. 유료 멤버십·댓글 키워드로 정보를 숨기지 않는다.
- **근거가 두 갈래면 축을 나눈다**(4편: 근거1 부품 수급 / 근거2 증설·소부장 실적 차례). 원인을 하나로 단정하지 않는다.
- 반전·근거는 한 주제에 집중, 제3자 코멘트를 나열하지 않음, 매수 암시 금지("미리 주워둬", "담아" 등), 체크리스트로 완결.

| 구간 | 목표 시점 | 역할 | 문장 공식 |
|---|---|---|---|
| 훅 | 0~12초 | 호칭 + 제목 질문 + 수치 판돈 + 손실회피/기회 | `다들, [제목을 질문으로]? + [숫자 대비 1개] + [모르면 ~/알면 ~]` |
| 오프닝 | 12~16초 | 자기소개 한 문장 + 시청 약속(리스크 자막바) | `안녕, 투자 소식을 쉽고 빠르게 정리해주는 황소특보야. 핵심만 짚어줄게, 끝까지 들어봐.` |
| 상황 | 16~35초 | 날짜·가격·% 수치 2~4개(소수점·억 단위까지) | `먼저 숫자부터 보자` + 수치 |
| 핵심 질문 | 전체의 약 25% | 질문하고 **바로 답한다** | `그럼 왜 ~걸까? 한마디로 ~야.` |
| 근거 | 35~95초 | 첫째·둘째(·셋째), 근거마다 용어 풀이나 비유 1개 | `첫째, ~. ~라고, ~인데` |
| 균형 | 약 75% | 반대 시각·리스크 한 줄 | `물론 조심할 것도 있어` |
| 요약+체크 | 끝나기 약 30초 전 | 한 문장 결론 + 확인할 것 2가지 | `한 줄로 정리하면, ~. 확인할 건 두 가지, ~` |
| 당부+CTA | 마지막 씬 | 당부 → 다음 단계 예고 → 댓글 요청 | `이것만은 챙겨가. [날짜/이벤트] ~ 황소특보가 제일 먼저 들고 올게. 짚어줬으면 하는 이슈는 댓글로 남겨줘.` |

**고유 문구(경제사냥꾼 문구 복제 금지)**: "님들"→"다들", "딱 1분만 집중해봐"→"핵심만 짚어줄게, 끝까지 들어봐", "정리할게"→"한 줄로 정리하면", "꼭 기억하고"→"이것만은 챙겨가", "진짜 부자되자"→쓰지 않음(CTA 클립이 마무리).

### ★ 성공 공식과 엔딩 (2026-09-29 Owner 확정, 8편부터 적용)

Owner 실측: 4·5편 반응 좋음 / 6편 괜찮음 / 7편(단일 사건형) 미미. 상세와 이유: 메모리 `feedback_bull_success_formula_and_ending_2026_09_29`.

- **성공 공식 3요소**: ① 반전(대장주와 순위를 뒤집는 대비) ② 개념 학습(새 개념 하나 + 비유) ③ 인과 사슬(외부 이벤트 → 한국 종목의 **연결 고리 문장** 필수). 압축할 때 고리 문장은 지운다.
- **새 엔딩 5박자** (기존 "요약 → 확인 두 가지 → 이것만은 챙겨가 → 들고 올게 → 댓글" 고정 4박자는 여운이 없어 폐기): ① 통찰 한 줄(요약이 아닌 해석) ② 프레임(재사용 가능한 사고틀) ③ 조건형 체크(무엇이 유지/흔들리면 어떻게 읽나) ④ 이득 각인("쫓지 말고 이유를 알아라, 이유를 알아야 다음 신호가 읽힌다") ⑤ 구체 약속 + 댓글. 편마다 전달 메시지를 한 줄로 정하고 엔딩이 그것을 회수한다.
- **씬 수**: 12~14에 묶이지 않는다(자연스러운 흐름·메시지 우선). 다만 극단으로 뛰지 말고 중간안을 낸다(8편: 16씬, 본편 약 121초 + CTA).
- **소재 다양화**: 급등락 사건형은 편수의 약 1/3 이하. 나머지는 일정·제도형, 구조·역설형, 수급·순환형, 사전 가이드형. 하루 2편이면 오전=전날 사건 해설, 저녁=앞으로의 일정·구조 해설.
- **소재 선정 전 확인**: `_bull-ep*-assembly-spec.mjs` 상단의 소재 선정 경위를 전 편 읽어 탈락·채택 이력과 훅 반복을 본다.

### 소재
- **트리거**: 정형 데이터(KIS/Alpha Vantage) 임계치 — 미국 지수 2% 이상, 국내 지수 3% 이상, 대형주 5~6% 이상, 중소형주 10% 이상 + 명확한 이슈(원인 없는 등락은 채택 안 함).
- **러너**(no-log 래퍼, 제목+링크만 보여주고 판단은 사람이 한다):
  - `bull-topic-scan --arm`(지수·허용리스트 대형주 임계치) / `bull-topic-news-search --arm`(중소형주 급등락·공급계약·테마) / `bull-topic-dart-scan --arm`(공급계약·수주 공시, 전체 시장) / `bull-topic-sector-news-search --arm`(섹터·실적 전망) / `bull-topic-risk-awareness-news-search --arm`(레버리지·투자심리·자금이동·시장구조·밸류에이션 교육, `[조건부]`=기관 수급 해석은 팩트만)
  - 일정: `lib/source-facts/bull-event-calendar.ts`의 `findUpcomingBullEvents()`(FOMC·금통위·마이크론·수출입동향·테슬라 인도량 등, 수동 유지보수). 바로 보기: `node scripts/run-bull-topic-calendar-once.mjs [--days 14] [--today YYYY-MM-DD]`(비밀값 없음, `status: tentative`는 "[미확정]" 표시). 날짜는 규칙으로 계산하지 않고 공식 공지·복수 보도로 확인한 것만 넣는다.
- **★ 소재 발굴 레인 8개(2026-09-30 Owner 확정, 경제사냥꾼 제목 1,975개 분석 근거)**: ① 원인 해설 ② 인물·기관 발언 해석 ③ 이벤트 D-N ④ 시장 제도·정책 변경 ⑤ 신테마 입문 ⑥ 매크로 번역 ⑦ 한미 디커플링·수급 구조 ⑧ 주간 체크포인트(주 1회 이하). 소재 제안은 항상 **레인·영역·유형(사건/일정/구조/개념)** 을 표시한다.
  - 뉴스 검색: `bull-topic-lane-news-search --arm`(②④⑤⑥⑦ 키워드를 한 번에 훑음, 제목+링크만).
  - 쏠림 점검: `node scripts/run-bull-topic-lane-mix-check-once.mjs --title "…" --lane … --kind … --domain … --semi yes|no [--shape …]` — 게시 장부(`lib/source-facts/bull-topic-lanes.ts`의 `BULL_EPISODE_LEDGER`, **편 배포 후 끝에 추가**)와 비교한다. 기준: 이번 제안 포함 최근 5편 중 **반도체 계열 ≤2편**, **사건형 ≤2편(약 1/3)**, 직전 편과 **같은 레인·같은 제목 모양 연속 금지**.
  - **`--semi` 판정은 제목이 아니라 "이야기의 실질 주인공"으로 한다(2026-09-30 Owner 지적)**: 지수·수급·자사주처럼 종목명을 안 써도 결국 삼성전자·SK하이닉스 얘기가 되면 `--semi yes`다. 쏠림 점검을 통과하려고 `no`로 표기하지 않는다.
  - **주제명은 경제사냥꾼식 "~진짜 이유"·"~정체" 틀을 쓰지 않고**, 편마다 문장 모양을 바꾼다(대비·인용·카운트다운·질문·선언·비유·숫자). 탐색은 넓게, 이름은 우리 말투로.
  - **★ 자동 적용 규칙(2026-09-30 Owner 확정 — "따로 지시해야만 하는 게 아니라 규칙으로")**: Owner가 "소재 찾자/주제 알아보자" 류로 말하면 **별도 지시 없이 Claude가 아래를 순서대로 직접 실행**하고 결과를 소재 제안에 반영한다. ⓐ `node scripts/run-bull-topic-calendar-once.mjs --days 14`(D-N 일정) ⓑ `node scripts/run-owner-command-with-local-env-no-log.mjs bull-topic-lane-news-search --arm`(약 1~2분, 429 방지 간격 내장; 결과는 `C:/tmp`에 저장해 읽음) ⓒ 기존 러너(`bull-topic-scan` 등)는 필요할 때만 ⓓ 후보마다 `run-bull-topic-lane-mix-check-once.mjs`로 쏠림 점검. 후보 표에는 레인·영역·유형·쏠림 경고 여부를 넣는다. 뉴스 제목은 원재료일 뿐이므로 후보가 정해지면 원문으로 팩트를 따로 확인한다. Owner 승인 범위: 네이버 검색 자격증명은 no-log 래퍼로만 주입(값 읽기 금지).
  - **★ 후보 제시 형식(2026-09-30 Owner 확정)**: 표는 **추천순위 1~n번 순서**로 쓴다. 순위 기준은 (a) 중요도 — 시청자의 매매·자산에 직접 닿는 정도, 특보(속보성 알림)다운 무게 (b) 신선도 — 제작 기간(약 하루) 동안 안 식는 정도, 게시 기한이 있는 일정은 기한 명시. 같은 영역·같은 레인이 겹치면 상위 하나만 앞에 두고 나머지는 뒤로 미룬다고 적는다. 표 뒤에 "왜 이 순서인가"를 짧게 쓴다. 후보 수는 7~12개.
  - 검증: `node scripts/check-source-facts-bull-topic-lanes.mjs`.
- **성과가 좋은 소재 순서**(벤치마크 실측): ① 시청자 매매에 직접 영향 주는 제도·일정 변경 ② 대형주의 역설적 급등락 원인 ③ 환율 ④ 시청자가 실제 겪는 선택을 비교하는 vs형(애널리스트끼리의 의견 대립은 안 됨).
- **피할 소재**: 날짜형 일일 시황 정리, 추상적 테크 주제, 정치 연계, 여러 이슈 묶음, 행동 없는 손실 강조, 전문가 종목 추천형.
- **종목명**: 허용리스트(삼성전자·SK하이닉스·현대차·애플·테슬라·구글)만 실명. 그 외는 "기판주", "반도체 소부장주"처럼 섹터로만. 삼성전자·SK하이닉스 소재 자체는 금지가 아니지만 편중되지 않게 비율을 맞춘다.
- 대본은 자동 생성하지 않는다(소재 확인 후 Claude가 직접 쓴다).

---

## 4. ChatGPT 이미지 자동화 — UI 변경 대응 (2026-09-26)

OpenAI가 ChatGPT 웹 화면을 바꾸면 이미지 자동화가 "어제까지 되던 게 안 된다" 또는 "이미지는 생성됐는데 스크립트가 실패로 처리한다"는 증상으로 깨진다. 2026-09-26에 한꺼번에 바뀐 것과 대응 방식:

| 바뀐 것 | 대응(현재 코드) |
|---|---|
| 입력창 `textarea#prompt-textarea` → `div[contenteditable][data-composer-markdown]` | `_chatgpt-image-core.mjs`의 `PROMPT_COMPOSER_SELECTOR`(신·구 겸용) |
| 전송 버튼 라벨 "메시지 보내기" → "보내기" | 여러 후보 셀렉터로 찾음(`sendPrompt`, 카드뉴스 스크립트의 후보 목록) |
| 첨부 버튼 라벨 → "파일 등 추가" | 여러 후보 셀렉터(`firstVisibleLocatorLocal`) |
| 결과 이미지 DOM → `[data-testid="generated-image-preview"] img`, turn → `data-turn-key` | `collectGeneratedImages`가 이 testid를 1순위로, 옛 URL 패턴을 보조로 찾음. 사용자 첨부 이미지(`group/user-message`)는 제외 |
| 결과 이미지 URL이 `blob:`으로 바뀌어 `cid`가 항상 null | "새 이미지" 판정을 `x.cid` 단독 → **`x.cid \|\| x.src`**로 바꿈(이게 "완성됐는데 감지 못함"의 진짜 원인) |
| 이전 대화에 이어 붙는 문제 | 스크립트 시작 시 `openFreshImageChat`로 새 대화를 강제로 연다 |

**함정**: 공용 코어(`_chatgpt-image-core.mjs`)를 고쳐도, 같은 로직을 파일 안에 따로 복사해 둔 스크립트는 고쳐지지 않는다. 현재 쓰는 두 스크립트(`probe-character-consistency-chatgpt-v1.mjs`, `run-owl-cardnews-chatgpt-v1.mjs`)는 둘 다 고쳤다. 다시 깨지면:
1. 실행하려는 **그 스크립트 파일 자체**에 옛 셀렉터(`#prompt-textarea` 단독, `composer-plus-btn` 단독, `메시지 보내기` 단독)가 하드코딩돼 있는지 검색한다.
2. 새 이미지 판정이 `x.cid` 단독 조건인지 확인한다(`x.cid || x.src`여야 함).
3. `collectGeneratedImages`가 URL 패턴만 보는지 확인한다(testid 기준도 있어야 함).
4. 그래도 안 되면 CDP로 실제 DOM을 확인해 새 셀렉터를 찾고, 신·구 겸용으로 추가한다(옛 것을 지우지 않는다).

`--preflight-only`로 로그인·입력창·도구 활성화까지만 먼저 확인할 수 있다. 브라우저 조작은 CDP+Playwright로만 한다(computer-use 금지).

---

## 5. 배포 절차 (Owner가 "N편 배포해줘"라고 하면 이 순서 그대로)

배포는 외부 게시다. 캡션·자산 요약을 짧게 보여주고 Owner 승인을 받은 뒤 실행한다. 명령은 모두 저장소 루트에서 실행하고, 결과 폴더는 `C:/tmp/{char}-ep{N}-publish/`로 한다.

1. 자산 경로 확인(§7): 최종 영상, 커버, 스토리, (부엉박사) 카드뉴스 폴더.
2. **영상이 35MB(36,700,160바이트)를 넘으면 압축**(보통 넘는다):
   `ffmpeg -y -i <final.mp4> -c:v libx264 -preset medium -b:v 1900k -maxrate 2100k -bufsize 4000k -pix_fmt yuv420p -c:a aac -b:a 128k -ar 48000 -ac 1 -movflags +faststart <compressed.mp4>` — 결과가 35MB 이하인지 확인(130초대 영상은 1900k, 90초대는 2300~2500k).
3. `owl-content-unit.json` 작성(형식: `C:/tmp/bull-ep4-publish/owl-content-unit.json`). **`youtubeTitle`에 `#Shorts`를 넣지 않는다**(업로드 스크립트가 자동으로 붙임). `instagramSourcePath`=압축본, `thumbnailImagePath`=커버.
4. 계획 파일 생성(업로드 없음):
   - `node scripts/plan-instagram-blob-upload-from-content-unit.mjs --content-unit <manifest> --out-dir <publish>`
   - `node scripts/plan-instagram-reel-cover-blob-upload.mjs --cover-image <cover.png> --content-id <contentId> --version v1 --out-dir <publish>`
   - 스토리: `node scripts/plan-instagram-cardnews-blob-upload.mjs --images-dir <스토리 이미지 폴더> --content-id <contentId>-story --version v1 --out-dir <publish>/story`
   - (부엉박사) 카드뉴스: `node scripts/plan-instagram-cardnews-blob-upload.mjs --images-dir <카드뉴스 폴더> --content-id <contentId> --version v1 --out-dir <publish>/cardnews`
5. 업로드(`run-owner-command-with-local-env-no-log.mjs <서브커맨드> … --arm`):
   - `owl-blob-upload --request <publish>/instagram-blob-upload-request.json --out-dir <publish> --arm`
   - `owl-reel-cover-blob-upload --request <publish>/instagram-reel-cover-blob-upload-request.json --out-dir <publish> --arm`
   - `owl-cardnews-blob-upload --request <publish>/story/instagram-cardnews-blob-upload-request.json --out-dir <publish>/story --arm` (카드뉴스도 같은 방식)
6. **커버 merge(필수 — 빠뜨리면 자동 프레임이 커버가 되고 나중에 못 고친다)**:
   `node scripts/merge-instagram-reel-cover-into-blob-result.mjs --video-blob-result <publish>/instagram-blob-upload-once-result.json --cover-blob-result <publish>/instagram-reel-cover-blob-upload-once-result.json --out <publish>/instagram-blob-upload-once-result.merged.json`
7. 릴스 게시: `owl-instagram-publish --content-unit <manifest> --blob-result <publish>/instagram-blob-upload-once-result.merged.json --out-dir <publish> --arm` → 로그의 `coverUrl:`이 실제 URL인지 확인(`없음`이면 즉시 중단).
8. 스토리 게시: `owl-instagram-story-publish --content-unit <manifest> --cardnews-blob-result <publish>/story/instagram-cardnews-blob-upload-once-result.json --out-dir <publish>/story --slide-index 1 --arm` (`--approval` 인자는 넣지 않는다 — 넣으면 즉시 실패).
9. (부엉박사) 카드뉴스 게시: `owl-cardnews-instagram-publish --caption-file <caption.txt> --blob-result <publish>/cardnews/instagram-cardnews-blob-upload-once-result.json --out-dir <publish>/cardnews --arm`
10. 유튜브: `owl-youtube-publish --content-unit <manifest> --out-dir <publish> --privacy public --arm` — **`--privacy public` 필수**(빠뜨리면 비공개로 올라가고 토큰 권한상 나중에 공개로 못 바꾼다). 썸네일은 `thumbnailImagePath`로 업로드 단계에서 자동 지정된다(로그 `썸네일: set` 확인). 안 됐을 때만 `owl-youtube-thumbnail-set --video-id <id> --thumbnail <cover.png> --out-dir <publish> --arm`.

금지: `final-e2e-publish`(위저드 전용, 항상 막힘), 유튜브 제목 수정·공개 전환 API 재시도(토큰이 업로드 전용). 첫 `--arm` 실행이 자동 모드 분류기에 막히면 명령은 맞으니 그대로 다시 시도한다. 배포 후 링크를 메모리/보고에 남긴다.

### 5-1. Vercel Blob 스토어가 정지됐을 때 (2026-09-28)

`instagram-auto-instagram-media-prod` Blob 스토어는 Hobby(무료) 플랜 용량 한도로
자주 정지된다(`owl-blob-upload` 실행 시 `Vercel Blob: This store has been
suspended.` 에러). 이때는:

1. **매일 새벽 4시 자동 정리가 이미 돌고 있다**(스케줄 태스크
   `blob-published-retention-cleanup`) — 게시완료(인스타+유튜브 둘 다 성공) 후
   2일 지난 콘텐츠의 Blob만 매일 자동 삭제해 용량을 확보한다. 그래도 정지 중이면
   한도 자체가 차서가 아니라 리셋 주기 문제일 수 있다.
2. 정지 여부는 읽기 전용으로 확인: `node scripts/run-owner-blob-usage-check-no-log.mjs --out-dir <임시경로>`(list()만, 삭제 없음).
3. 급한 배포(시의성 있는 소재)는 자동 파이프라인을 기다리지 말고 **압축 영상+커버+스토리 이미지를 Owner에게 전달해 수동 업로드**로 우회한다. `owl-content-unit.json`의 캡션·제목·설명을 그대로 복사해서 쓴다.
4. 정지 상태에서도 `list()`(읽기)는 되고 `put()`(업로드)만 막힌다 — 스캔·조회 스크립트는 정상 동작한다.
5. Blob 대량 삭제(정기 자동화 외의 수동 대량 삭제)는 여전히 Owner가 직접 실행해야 한다(Claude Code 세션이 자동 차단). 정기 자동화(2일 경과분)는 예외로 이미 승인됨 — [[feedback_blob_published_retention_cleanup_2026_09_28]] 참고, 판정 기준을 바꾸려면 Owner 확인 필요.

---

## 6. 이 문서를 갱신해야 하는 때

- CTA 클립, 목소리, 참조 이미지 등 고정 자산이 바뀔 때(경로 즉시 수정 + 결합 스크립트 등록표 갱신)
- 대본 구조·자막·카드뉴스·커버 원칙이 바뀔 때
- 편이 배포되거나 재고가 바뀔 때(§7)
- 외부 UI(ChatGPT·Veo·Flow) 변경으로 절차가 바뀔 때(§4)

코드 주석이나 대화로만 기준을 바꾸고 이 문서를 안 고치면, 다음 세션이 또 기준을 못 찾는다.

---

## 7. 재고·다음 번호 (2026-09-26 기준 — 배포 전 Owner 메모장과 대조해 다시 확인)

**부엉박사**
- **14편 배포 완료(2026-09-29): 릴스 instagram.com/reel/Dd2-6U6Csf7, 카드뉴스 instagram.com/p/Dd2_FUsEwhu, 유튜브 youtube.com/shorts/lNJ1E5CM7yA, 스토리 게시.** 12·13편도 Owner 확인으로 배포 완료. 다음 신규 15편(실업급여, 국회 진행 상황·수치 재대조 필수).
- (이력) 완성 12편 `C:/tmp/owl-v2-ep12-final/owl_episode_final.mp4`, 13편 `C:/tmp/owl-v2-ep13-final-v2/owl_episode_final.mp4`, 14편 `C:/tmp/owl-v2-ep14-final-v3/owl_episode_final.mp4`(2026-09-29 s6 "기금 소진 2056→2064년"으로 팩트 수정 후 재조립, TTS `output-v2`, 총 114.75초; v2는 2071년 오류본이라 폐기)(배포 준비 파일 `C:/tmp/owl-v2-ep1{2,3,4}-publish/`).
- 배포 완료: 1~10편 (9~10편은 표시 번호 ≠ 파일 번호, 10편=카드론, 파일 ep9), **11편 청약(v2 첫 편, 2026-09-26): 릴스 instagram.com/reel/Ddv6St0AGcE, 카드뉴스 instagram.com/p/Ddv6fTck2bP, 유튜브 youtube.com/shorts/8xPxKhnd9_o, 스토리 게시**
- **★ 재고 전면 v2 재제작(Owner 결정 2026-09-26)**: 옛 구조 재고 7편(아래 v1 완성본)은 **배포하지 않는다**. 7개 소재를 전부 씬 구조 v2(§1)로 다시 만들고, 시의성 기준으로 순서·표시 번호·배포일을 다시 매긴다.
  - 새 파일 이름: 스펙 `scripts/_owl-v2-ep{N}-assembly-spec.mjs`, 작업 폴더 `C:/tmp/owl-v2-ep{N}-*`(N = 새 표시 번호 — 이제부터 표시 번호 = 파일 번호). 옛 v1 파일은 지우지 않고 **이미지·영상 재사용 원본**으로만 쓴다(v1 영상은 8초라 재사용하는 씬은 발화 7초 이내로 쓴다).
  - **★ v1 영상 재사용 시 끝부분 결함 주의(11편 사고)**: v1 8초 영상은 끝 0.5~1초에 카드 낙하·흔들림이 흔하다(v1은 앞 6초만 써서 안 보였음). v2는 7~8초를 쓰므로 **TTS 실측 후 재사용 클립마다 "새 사용 길이"까지 0.3초 간격으로 프레임을 확인**하고, 결함이 사용 구간 안이면 v1 이미지로 **10초 재생성**한다(조립 전에 판단). v1 검수 기록의 "사용 구간 밖이라 통과"는 v2에선 무효.
  - 매 편 대본 확정 전 팩트를 다시 확인한다(제도 운영 상태·국회 통과 여부·최신 통계). 날짜는 "이번 달/이번 주" 대신 **절대 날짜**로 쓴다(배포일이 바뀌어도 틀리지 않게).

| 새 표시 | 소재 | 배포일(가안, 시각은 Owner) | 시의성 이유 | v1 재사용 원본(스펙 / 이미지·영상 폴더 파일 번호) | 같은 날 금박사(파일) → 금박사 새 표시 | 금박사에게 넘길 용어 |
|---|---|---|---|---|---|---|
| 11 | 청약통장 전환기한 1년 연장 | **9/26** | 원래 기한 9/30 전 | `_owl-ep17-assembly-spec.mjs` / ep17 | 예금자보호(ep7) → **5편** | 예금자보호 한도 |
| 12 | 토지거래허가구역 실거주 유예 연장 | **9/27** | 10/1 시행 전 | `_owl-ep12-…` / ep12 | 토지거래허가구역(ep8) → **6편** | 토지거래허가구역 |
| 13 | 고용률 8월 사상 첫 70% | **9/28** | 9월 고용동향(10월 중순) 전 | `_owl-ep11-…` / ep11 | 신용점수(ep5) → **7편**(짝 편=배포 완료 10편 카드론) | (없음 — 연결 문장 생략) |
| 14 | 국민연금 보험료 인상 | **9/29** | 연내 | `_owl-ep10-…` / ep10 | 소득대체율(ep6) → **8편** | 소득대체율 |
| 15 | 실업급여 22년 만의 개편(정부안) | **9/30** | 국회 진행 상황 재확인 필수 | `_owl-ep15-…` / ep15 | 실업급여 계산(ep10) → **9편** ※ 금박사 대본이 "부엉박사가 실업급여 하한액도 오른다고 했는데"로 시작 → 부엉박사 15편에 **2027 최저임금 연동 하한액 인상을 반드시 언급**, 같은 날 부엉박사 뒤. 금박사 ep10은 지급기준 변경을 확정처럼 말하므로 국회 상황 확인 후 배포 | 실업급여 하한액 |
| 16 | 퇴직연금 실물이전 | **10/1** | 상시 | `_owl-ep13-…` / ep13 | DB형·DC형(ep9) → **10편** | DB형·DC형 |
| 17 | 2027 최저임금 | **10/2** | 1/1 시행 전 | `_owl-ep16-…` / ep16 | **금박사 신규 11편**(파일 ep11, 새로 제작) | 주휴수당 후보 |

  - 배포는 오늘(2026-09-26)부터 부엉박사·금박사 하루 1편씩(Owner 결정). 금박사는 같은 날 부엉박사 뒤.

  - **연결 문장은 짝 금박사 편이 실제로 다루는 내용에 맞춘다** — 대본 쓰기 전에 그 금박사 스펙의 narration을 확인한다(예: 금박사 ep7은 예금자보호 "한도·계산·신청"만 다루고 청약통장 제외 이유는 안 다룸 → 부엉박사 11편은 "예금자보호 한도가 궁금하면"으로 넘김).
  - 금박사 짝 편이 가정하는 내용(예: 14편은 "소득대체율 41.5%→43%"를 이름만 언급, 12편은 토지거래허가구역을 설명하지 않고 넘김, 17편은 DB/DC/IRP를 이름만 언급)은 새 부엉박사 대본에서도 **유지**한다 — 주제 정의(s4)가 넘길 용어를 먼저 설명해 버리지 않게 한다.
  - 옛 v1 완성본(배포 안 함, 재사용 원본 확인용): 국민연금 `owl-ep10-episode-final-v-cta-std`, 고용률 `owl-ep11-…`, 토지 `owl-ep12-…`, 퇴직연금 `owl-ep13-…`, 실업급여 `owl-ep15-episode-final-v3`, 최저임금 `owl-ep16-episode-final-v1`, 청약 `owl-ep17-final-v2`(모두 `C:/tmp/` 아래). 청약 v1용 커버·스토리·카드뉴스(`owl-cover/story/cardnews-ep17`, 2026-09-26 제작·미배포)는 내용이 v2 대본과 맞고(3.1%·2027-09-30 절대 날짜·되돌리기 불가·예금자보호 제외·은행 앱/창구) 커버 문구가 v2 헤더와 같아 **새 11편에 그대로 쓴다**.
- **18편(전세사기 최소보장제, 15씬) 완성·배포 전(2026-09-30)**: 스펙 `scripts/_owl-v2-ep18-assembly-spec.mjs`, TTS `C:/tmp/money-shorts-os/owl-v2-ep18-tts/output-v6`(금박사 연결 제거 반영, 102.7초), 영상 15개 검수 통과, 최종 `C:/tmp/owl-v2-ep18-final/owl_episode_final.mp4`(117.17초, cta-join PASS), 압축본 31.9MB. 팩트 재대조 완료(2026-09-30, 인천일보·헤럴드·한경·국토부 보도 등: 시행 11/13, 3분의 1 기준, 한도 5억·재량 최대 7억, 인정 전 2027.5.31·인정 후 결정일+3년, 신청 제한 3가지, 소급 적용 포함). 커버·스토리·카드뉴스 4장 생성 완료(`C:/tmp/owl-cover-ep18`, `owl-story-ep18`, `owl-cardnews-ep18`, 스펙 `_owl-{cover,story,cardnews}-ep18-spec.mjs`). 남은 일: Owner 검수·음성 청취 → "18편 배포해줘"(10월 중 게시: 대사 "다음 달부터"가 11월 시행을 가리킴).

**금박사**
- 배포 완료: 1~4편(4편 레버리지는 옛 여성 목소리로 배포됨), **5편 예금자보호(파일 ep7, 2026-09-26): 릴스 instagram.com/reel/DdwCAo6DtBU, 유튜브 youtube.com/shorts/9qFa3fhYljg, 스토리 게시**, **7편 신용점수(파일 ep5, 2026-09-28, 수동배포): 릴스 instagram.com/reel/Dd0492RvjIW, 유튜브 youtube.com/shorts/PNPHQhwfsIE**(Vercel Blob 스토어 정지로 자동 파이프라인 우회)
- **재고는 다시 만들지 않고 부엉박사 새 순서에 맞춰 표시 번호만 바꾼다**(Owner 2026-09-26). 파일 이름은 바꾸지 않는다. 경로는 **새 목소리(Yohan Koo)본**:

| 새 표시 | 파일(소재) | 경로 | 같은 날 부엉박사 |
|---|---|---|---|
| 5 (9/26) | ep7 예금자보호 | `C:/tmp/geumbaksa-ep7-final-v3std/owl_episode_final.mp4`(표준 CTA 재결합 PASS) | 11 청약통장 |
| 6 (9/27) | ep8 토지거래허가구역 | `C:/tmp/geumbaksa-ep8-final-v3std/owl_episode_final.mp4`(s2·s5 재생성+풀클립 재조립, 옛 v2voice는 화면·대사 4.6초 어긋나 폐기) | 12 토지 유예 |
| 7 (9/28) ✅배포완료 | ep5 신용점수 | `C:/tmp/geumbaksa-ep5-final-v4std/owl_episode_final.mp4`(짧은 클립 1~7% 느리게 + s4 재생성, 옛 v2voice는 1.2초 어긋남·s4 'PIXAR' 결함으로 폐기) | 13 고용률 |
| 8 (9/29) ✅배포완료 | ep6 소득대체율 | `C:/tmp/geumbaksa-ep6-final-v3std/owl_episode_final.mp4`(풀클립 재조립, 옛 v2voice 폐기). 릴스 instagram.com/reel/Dd3XBXCCvlD, 유튜브 youtube.com/shorts/Ow0w4Vq5aBs, 스토리 게시 | 14 국민연금 |
| 9 (9/30) | ep10 실업급여 계산 | `C:/tmp/geumbaksa-ep10-final/owl_episode_final.mp4` | 15 실업급여 개편(같은 날 필수, 국회 상황 확인) |
| 10 (10/1) | ep9 DB형·DC형 | `C:/tmp/geumbaksa-ep9-final-v2voice/owl_episode_final.mp4` | 16 퇴직연금 |
| 11 (10/2) | **신규 제작**(파일 ep11, 오프닝 훅 뒤 첫 편) | – | 17 최저임금 |
  - ⚠ **재고 배포 전 화면·대사 일치 확인 필수**: `assembly-manifest.json`의 `silentVideoDurationSec`가 `audioDurationSec`보다 1초 넘게 짧으면, 조립기가 대사보다 짧은 클립에서 다음 장면으로 먼저 넘어가 화면이 앞서 나간 것이다(6편 4.6초 사고). 짧게 잘린 클립 대신 원본 풀클립으로 재조립하고, 그래도 모자란 씬은 10초로 재생성한다. 원본 풀클립·이미지가 없으면 모자란 클립만 `setpts`로 **8% 이내** 느리게 해 맞춘다(Owner 승인 2026-09-26, 금박사 7편에서 1.0~7.1% 적용 — 정지 프레임(tpad)은 여전히 금지).
  - ⚠ `geumbaksa-ep{5~9}-episode-final-v12`는 목소리 교체 전(여성) 버전이다(9/23 생성, 길이도 다름). 배포하지 않는다.
- **다음 신규: 11편(파일 ep11) — 오프닝 재배치 적용 첫 편**

**황소특보**
- 배포 완료: 1~4편 (4편: 릴스 instagram.com/reel/DdvNSe9k5_U, 유튜브 youtube.com/shorts/gCCC5Z6nyy0)
- 참고: 4편 배포본은 CTA 결합 스크립트 개선 전 버전이라 전환부에서 마지막 멘트 끝이 CTA 화면 위로 들리고 CTA 첫 프레임이 약 0.8초 정지한다. 개선된 재결합본은 `C:/tmp/bull-ep4-final-v2/owl_episode_final.mp4`(재배포 여부는 Owner 결정).
- **6편(삼성전자 배당, 2026-09-28, 수동배포)**: 릴스 instagram.com/reel/Ddz1XhcToBx, 유튜브 youtube.com/shorts/6ZVskG7TYTk — Vercel Blob 스토어 정지로 자동 파이프라인 우회.
- **7편(국내 바이오사 FDA 승인 상한가, 2026-09-28)**: 릴스 instagram.com/reel/Dd1PBm9DPEB, 유튜브 youtube.com/shorts/RnnV9NaW3BU, 스토리 게시 완료. 최종본은 s12(균형 씬, "매수 추천 아님" 나레이션)를 삭제한 15씬 버전(`scripts/_bull-ep7-assembly-spec.mjs`) — 종목명 언급 없이 매수 불가를 명시하는 게 어색하다는 Owner 지적으로 삭제, s11→s13 직결. 리스크 고지는 오프닝(s3)·마지막(s16) 하단 자막바로만 유지.
- **8편(미국 태양광 최저수입가격 랠리, 16씬) 제작 중**: 대본 확정, TTS 완료(`C:/tmp/money-shorts-os/bull-ep8-tts/output-v3`, 스크립트 `bull-ep8-tts-script-16scene.json`). 스펙 `scripts/_bull-ep8-assembly-spec.mjs` 작성 완료, 씬 이미지 16장 검수 통과(`C:/tmp/bull-ep8-images`), 영상 프롬프트 `_ai/bull-ep8-video-generation-prompts.md` 작성 완료(8초 6개·10초 10개). 영상 16개 검수 통과(s12만 1회 재생성, s14는 끝 0.3초 보드 기울어짐 감수). 조립+CTA 완료(`C:/tmp/bull-ep8-final/owl_episode_final.mp4` 139.08초, cta-join-report PASS, 압축본 `owl_episode_final_compressed.mp4` 32.5MB), 커버 `C:/tmp/bull-ep8-cover`·스토리 `C:/tmp/bull-ep8-story` 생성(스펙 `_bull-cover-ep8-spec.mjs`·`_bull-story-ep8-spec.mjs`). **배포 완료(2026-09-29)**: 릴스 instagram.com/reel/Dd2huJpFRtH, 유튜브 youtube.com/shorts/8a9buzZhz9Q, 스토리 게시. 다음 신규 9편. 팩트 근거 수준은 스펙 파일 상단 참고(회담 문장 한경 단독, 모듈 가격 출처 안자).
- **9편(오픈AI 신모델 출시 취소 × 마이크론 실적 D-1, 16씬) 배포 완료(2026-09-29): 릴스 instagram.com/reel/Dd3mM3gDyAc, 유튜브 youtube.com/shorts/dTZioUmJqaM, 스토리 게시.**: 스펙 `scripts/_bull-ep9-assembly-spec.mjs`, TTS `C:/tmp/money-shorts-os/bull-ep9-tts/output-v5`(5회차, 타임라인 127.96초; s6 "지난 6월 밝힌 규모"·s10 "달러 값이" 문구 수정 반영), 영상 16개 검수 통과(s15는 8초로 2회 카드 소멸 → 10초로 재생성해 통과), 최종 `C:/tmp/bull-ep9-final-v3/owl_episode_final.mp4`(136.17초, cta-join PASS), 압축본 31.6MB, 배포 폴더 `C:/tmp/bull-ep9-publish/`, 커버 `C:/tmp/bull-ep9-cover`·스토리 `C:/tmp/bull-ep9-story`. 카드 두 손 든 씬은 8초 클립 끝에서 카드가 사라지는 경향(8편 s12, 9편 s15) → 카드 씬은 10초로 요청. 조립기 `run-owl-assemble-shorts-v2.mjs`의 자막 치환(`alignWordGroups`)을 고쳐, 어절 수가 같은 불일치 구간을 1:1로 나눔(자막에 발음 표기가 남던 버그).
- **다음 신규: 10편(v3 구조)**
