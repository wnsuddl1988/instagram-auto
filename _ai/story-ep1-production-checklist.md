# 스토리형 1편(기준 편) 제작 체크리스트 — 금 모으기 (2026-10-07)

> 작성 방식 = `_ai/story-format-structure-v1.md`(v3 확정). 단계가 끝날 때마다 ✅/❌와 증거를 적는다. 게시 시점은 Owner 지시 때만. 짝 편: 설명형 1편(Claude가 추천, 10/7 현재 미정).

## A. 소재·대본
- ✅ 소재: Owner 선택 "금 모으기로 진행"(2026-10-06). 팩트표 `_ai/story-ep1-gold-script-draft.md`(금 모으기는 기증이 아니라 매각, "가장 먼저 갚은 나라" 정정 반영).
- ✅ 대본 최종: `C:/tmp/story-ep1-gold/gold-scenes-final.json` 18장면·543자. 검사기 `check-script-standards.mjs --format story` **반드시 수정 0**. 새 독자 점검 2회(26·38·58세).
- ✅ Owner 대본 확정: "1번 3번 진행해"(TTS·배경음 승인, 2026-10-07).

## B. 소리
- ✅ TTS(story_v1, 속도 1.1, 유료 1회): 18장면 111.08초 → `apply-story-tempo-once.mjs --max-scene-gap 0.35 --keep-gap-scenes 4,11,14` → **89.78초**. 정렬 보정 도구: 18장면 모두 정상(보정 없음). 요약 `C:/tmp/money-shorts-os/story-ep1-tts/output-v1/tempo-1.15-gap0.35/…tempo1.15-gap0.35.json`.
- ✅ 배경음(ElevenLabs Music 1회, 7구간 89.9초) `C:/tmp/money-shorts-os/story-ep1-bgm/output-v1/story-ep1-gold.bgm.mp3`. 미리 듣기 합본(-26dB, 더킹) `…/preview/story_ep1_voice_bgm_preview.mp4`. ⬜ Owner 청취 확인.

## C. 이미지·영상 프롬프트
- ✅ 스펙 `scripts/_story-ep1-assembly-spec.mjs`(`STORY_EP1_SEMI_SPEC` 1~17 반사실 3D, `STORY_EP1_END_SPEC` 18번 부엉박사). 주인공 시민 1명(1·5·17번), 6번 추기경은 손만(얼굴 없음), 글자 없음(11번 달력 '8월'·'23'만).
- ✅ **화풍 확정(Owner 2026-10-07 "진행해") = 반사실 3D**(`--character storysemi`), 18번만 만화 부엉박사 진행자 컷. 이미지 `C:/tmp/story-ep1-images-semi/story_ep1_s{1..18}.png`(18번은 `C:/tmp/story-ep1-images/`의 만화 부엉박사 복사). 구 만화풍 18장은 `C:/tmp/story-ep1-images/`에 보관. 증거: 생성 로그 `C:/tmp/story-ep1-images-semi-gen.log`.
- ✅ 이미지 육안 검수 17장 전부(글자 없음, 11번 '8월 23' 정확, 12번은 서류철이 일본 국기처럼 보여 1차 반려 후 재생성은 만화풍 때, 반사실판은 처음부터 남색 표지). **13번 교체(Owner "달리기 장면 뜬금없다, 흐름에 안 맞다")**: 육상 경기장 은유 → 회의실에서 "벨트로 묶인 빚 더미를 앞에 둔 아시아 관리 넷 vs 서류철만 든 한국 관리"(구 달리기본 `story_ep1_s13_rejected-running-track.png`). 못 본 것: 영상 변환 후 결과.
- ✅ `_ai/story-ep1-video-generation-prompts.md`(생성기 `scripts/build-story-video-generation-prompts.mjs`, 장면별 고정 지시 `SEMI_LOCKS`): 8초 16개 / 10초 2개(s1·s2). 6·7·13·17번은 손·소품 움직임 금지(빛·호흡·고개만).
- ⬜ 화면 위쪽 작은 "AI 재연" 표시는 조립 스펙에서 넣는다(Owner 합의 2026-10-07).

## D-0. Veo 클립 검수(2026-10-07) — Owner 전달 `Downloads/1~18.mp4`
- ✅ 18개 모두 720x1280·24fps, 길이 1·2번 10초 / 나머지 8초, 새 반사실 3D 화풍(1·2번 수정시각이 앞서지만 옛 만화풍 아님). 11번 달력 "8월 23" 끝 프레임까지 선명. 전 클립 ✦·"Veo" 표시 있음 → 워터마크 제거 대상.
- ⚠ 7번(금이 바닥으로 쏟아져 쌓임)·17번(주머니 건넴이 끝나지 않음) 조건부. ❌ 4번(서류가방 내려놓음·행인이 카메라 가림·작은 간판 같은 표시)·13번(서류철이 3.5초 이후 사라짐)·18번(발화 구간 4프레임 모두 부리 닫힘) 재생성 권장이었으나 **Owner가 직접 확인 후 "그냥 써도 문제 없을 것 같다"(10/7) → 그대로 사용**. 못 본 것: 클립 오디오 내용, 움직임 매끄러움.
- 클립 사본 `C:/tmp/story-ep1-clips/`(스펙 video 파일명으로 복사), 조립용 스펙 `STORY_EP1_FULL_SPEC`(1~17+18) 추가.
- ✅ **조립 완료(10/7, A안 — 기존 조립기를 스토리형 옵션으로 확장)**: 조립기에 스펙 옵션 `topLabel`("AI 재연" 위쪽 표시)·`captionLastSceneNoMargin`(마지막 자막이 음성 끝까지)을 추가(기존 편 동작 불변), QA의 설명형 훅 H1~H4는 `formatProfile: story_v1`이면 건너뜀, 스펙 `STORY_EP1_ASSEMBLE_SPEC`(제목 띠·하단 띠 없음, 오프닝·CTA 없음, 자막 경계 예외 2건 사유 기록). 순서: 조립 → `run-remove-veo-watermark-once.mjs`(✦·Veo 글자 2곳) → `run-audio-finish-once.mjs --bgm … --bgm-db -26`(-15.1 LUFS / 피크 -0.8 dBTP) → `run-episode-qa-once.mjs` **반드시 수정 0**(확인 권장 6: "39억" 한 어절·0.6초 미만 자막 3·경계 예외 2). 정렬 보정 요약(`…audio-fixed.json`, 0.1초 기준 s8 발화끝 보정) 사용. **마스터본 `C:/tmp/story-ep1-assembled3/story_ep1_mastered.mp4`**(89.8초), QA `C:/tmp/story-ep1-assembled3/qa-report.md`. 못 본 것: 전체 재생(움직임·자막 흐름 육안).
- ✅ **Owner 검수 반영(10/7)** → 최신 마스터본 **`C:/tmp/story-ep1-assembled5/story_ep1_mastered.mp4`**(QA 반드시 수정 0, 확인 권장 4): ① "AI 재연" 글자 제거 ② 장면 전환에서 자막이 씹힘 → 장면 끝 자막 여유 0.5→0.1초(`captionSceneEndMarginSec`)·자막을 소리보다 0.12초 먼저(`captionLeadSec`), 장면별 "소리끝 vs 마지막 자막끝" 18장면 모두 OK ③ 자막 강조(`emphasisTerms`·`emphasisNumberPatterns`·`captionEmphasisPop`): IMF·돌반지 등 청록, 165톤·10분의·227톤 등 노랑, 강조 단어 팝. 자세한 기준 메모리 `feedback_story_caption_and_ai_label_2026_10_07`. 이전 판 assembled3(구판)·4는 폐기.
- ✅ **Owner 2차 검수 반영(10/7)** → 최신 마스터본 **`C:/tmp/story-ep1-assembled8/story_ep1_mastered.mp4`**(84.1초, QA 반드시 수정 0·확인 권장 9): ① 첫 발화 씹힘 = 소리 자체 원인(alignment가 실제 첫 소리보다 0.06~0.26초 늦어 템포 도구가 쉼을 자를 때 다음 장면 첫 소리 앞부분을 잘라냈음, 17장면 중 15장면) → `apply-story-tempo-once.mjs`가 실제 첫 소리 − 0.12초에서 자르도록 수정 ② 목소리 속도 1.15→1.25배(쉼 상한 0.25초), 배경음은 89.9→84.1초에 맞춰 `atempo` 시간 맞춤(`story-ep1-gold.bgm.fit84.mp3`) ③ 상단 제목 3줄(금 모으기, / 장롱 속 금을 들고 / 줄을 선 나라, 108px, 마지막 줄 노랑) ④ 자막 글자 100px(108·104는 QA 반드시 수정 발생) ⑤ 인스타 게시 도구에 `is_ai_generated=true` 추가. 알려진 사소한 점: 마지막 부엉박사 컷에서 제목 3번째 줄이 부엉이 머리 위에 살짝 걸림. 정렬 요약 `…tempo-1.25-gap0.25-pre/…audio-fixed.json`. 구판 assembled3~7 폐기.
- ✅ **속도 재조정(10/7 Owner "1.25배는 너무 급하다, 조금만 덜 빠르게")** → 템포 **1.20배**(쉼 상한 0.25초, pre-roll 0.12초): 87.6초, 배경음은 `story-ep1-gold.bgm.fit87.mp3`(원곡÷새 길이=atempo 1.0265), QA 반드시 수정 0. 최신 마스터본 **`C:/tmp/story-ep1-assembled9/story_ep1_mastered.mp4`**. 속도 기준: 1.15(옛 판, 느림) < **1.20(채택)** < 1.25(급함). 2편도 1.20으로 시작. 정렬 요약 `…tempo-1.2-gap0.25-pre/…audio-fixed.json`.
- ✅ **자막 정돈(10/7 Owner "한 줄·한 단어·단어 사이 줄바꿈, 맞춤법, 글 키우고 조금 내리기")** → 조립기 자막 계획기(`captionPlanner: "scene_dp_v1"`), 글자 102·`captionY 1385`, QA에 정돈도·맞춤법 점검 추가. 최신 마스터본 **`C:/tmp/story-ep1-assembled15/story_ep1_mastered.mp4`**(QA 반드시 수정 0, 자막 60블록: 2줄 48·한 줄 12·한 단어 2·0.7초 미만 3). 상세·체크리스트는 메모리 `feedback_caption_tidy_planner_and_story_assembly_checklist_2026_10_07`.
- ✅ **커버·압축·콘텐츠 유닛·배포 전 게이트(10/7)**: 커버 `C:/tmp/story-ep1-cover/story_ep1_cover_v5.png`(실제 영상과 같은 반실사 1번 장면 `story-ep1-images-semi/` 원본+제목 그대로 4줄 146px; v1~v4는 만화풍 옛 이미지라 폐기 `story-ep1-cover-rejected/`), 압축본 25MB, `C:/tmp/story-ep1-publish/owl-content-unit.json`(`formatProfile story_v1`·`aiLabel true`), `run-deploy-preflight-once.mjs` 실패 0·경고 0. 방식은 메모리 `feedback_story_cover_thumbnail_method_2026_10_07`. **게시 전 남음: Owner 커버·재생 확인, 금값 재확인, 게시 지시.**
- (옛 메모) 남은 단계였던 것: 커버(제목 그대로·140px 게이트), 압축·콘텐츠 유닛·배포 게이트 — 배포는 Owner 지시 때만. 인스타 AI 라벨 방식은 Owner 확인 필요.
- (조립 시도 기록) 기존 `run-owl-assemble-shorts-v2.mjs`는 `render`·헤더 제목·하단 채널 띠·자막 레이아웃 등 부엉 설명형 스펙 항목을 요구해 스토리 스펙으로 바로 안 돈다(`render.fps` 없음에서 중단). 스토리형 조립(제목 띠 없음·"AI 재연" 라벨·오프닝/CTA 없음) 구현 필요.

## D~G. 이후 단계
- ⬜ Owner Veo(`Downloads/1~18.mp4`) → 검수 → 스토리형 조립 스펙(오프닝·고정 CTA 없음, 부엉박사 18번만, 배경음 -26dB) → 조립 → 워터마크 제거 → 오디오 마감 → QA → 커버 → 압축·유닛·게이트 → Owner 지시 배포.
- 게시 직전 재확인(필수): 금값(온스당 약 4,200달러 — 3,800달러 아래면 15·16번 숫자 조정), 351만 명·227톤·22억 달러 수치.
