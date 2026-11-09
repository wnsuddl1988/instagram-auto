---
name: project-story-format-pilot-gold-2026-10-06
description: "경제번역소 스토리형 시범 1편 금 모으기 — 대본 최종·TTS·배경음·이미지 18장 완료, 화풍=3D 만화풍 확정(10/7), Owner Veo 클립 대기. 러너·검사기·속도 도구 구축 현황(2026-10-07)"
metadata:
  node_type: memory
  type: project
  originSessionId: 44079e93-cb91-40d7-a5f2-8a4f2a547778
  modified: 2026-10-06T21:49:25.734Z
---

**현재 상태(2026-10-07 밤):** 대본·음성·배경음·**반사실 3D 이미지 18장**(`C:/tmp/story-ep1-images-semi/`, 13번은 달리기→회의실 장면으로 교체)·영상 프롬프트 완료 → **Owner Veo 클립 1~18번 대기**(받아 둔 `Downloads/1.mp4`는 만화풍 시험본이라 쓰지 않음, 반사실 3D 1번부터 새로 생성). 다음 = 클립 검수 → 스토리형 조립 스펙(오프닝·고정 CTA 없음, 부엉박사 18번만, 배경음 -26dB) → 조립·워터마크 제거·오디오 마감·QA → 커버 → 압축·유닛·게이트 → Owner 지시 배포. 체크리스트 `_ai/story-ep1-production-checklist.md`.

- **대본 작성 방식 = `_ai/story-format-structure-v1.md`(v3 확정)** — 10박자·금지 10개·작성 절차·벤치마크 매 편 참고. 상세는 [[feedback_story_script_method_v3_confirmed_2026_10_07]]. 최종 대본 `C:/tmp/story-ep1-gold/gold-scenes-final.json` 18장면·543자, 팩트표 `_ai/story-ep1-gold-script-draft.md`(금 모으기는 기증 아닌 매각, "아시아 가장 먼저" 정정).
- **소리:** TTS(story_v1, 속도 1.1) 111.08초 → `scripts/apply-story-tempo-once.mjs --max-scene-gap 0.35 --keep-gap-scenes 4,11,14` → **89.78초**(요약 `C:/tmp/money-shorts-os/story-ep1-tts/output-v1/tempo-1.15-gap0.35/`). 장면 끝 쉼이 합계 15.8초라 균일 1.15배만으론 96.6초였음 → 대본은 **550자 이하**. 배경음 ElevenLabs Music 7구간(래퍼 `story-bgm`, 키에 music_generation 권한을 Owner가 켬) `C:/tmp/money-shorts-os/story-ep1-bgm/output-v1/story-ep1-gold.bgm.mp3`, 믹스 -26dB·더킹.
- **★화풍 최종 확정(Owner 2026-10-07 "진행해") = 반사실 3D(1~17번), 18번 부엉박사는 만화 진행자 컷 그대로, 화면 위쪽에 작게 "AI 재연" 표시.** 아래 "3D 만화풍 확정"은 번복됨 — 근거: 웹 조사(`_ai/story-visual-style-research-2026-10-07.md`)에서 성인 대상 3D 성공 사례(Zack D. Films 구독 2,880만)는 사실적 비율 CG였고 픽사풍 AI 스토리는 어린이·양산형 이미지 + 한국 소규모 채널 전부 조회 미미 + 유튜브 2026 양산형 AI 채널 대량 삭제. 반사실 3D 이미지는 실사 사진과 거의 같은 사실감이나 조명·질감이 더 정돈된 "만든 화면" 느낌(Owner도 같은 인상). 이후 이 결정은 스토리형 3편 + 설명형 비교 데이터가 나오기 전엔 다시 꺼내지 않는다(Owner "말할 때마다 이랬다 저랬다" 지적). 생성: `--character storysemi --scene-spec-export STORY_EP1_SEMI_SPEC --out-dir C:/tmp/story-ep1-images-semi`(구 만화풍 18장 `C:/tmp/story-ep1-images/`는 18번만 사용, 나머지 보관).
- (번복됨) 화풍 결정(Owner 2026-10-07 "그렇게 하자"): 1편은 **3D 만화풍**. 실사풍 비교(이미지 3장·Veo 영상 1개씩)에서 실사도 영상 안정성 문제 없었으나(얼굴·손·소품 10초 유지) 채널 정체성(부엉·황소 3D)과 안 맞고 마지막 부엉이가 튀며 AI 표시 부담 → 스토리형 형식이 통하는지 먼저 본 뒤 실사는 2~3편 시험 또는 새 채널 후보. 비교 자료 `C:/tmp/story-ep1-real-test/`, `C:/tmp/story-ep1-video-compare/`.
- **이미지:** `scripts/_story-ep1-assembly-spec.mjs`(`STORY_EP1_ASSEMBLY_SPEC` 1~17번 `--character story3d`, `STORY_EP1_END_SPEC` 18번 owl3dv5, 실사 시험 `STORY_EP1_REAL_TEST_SPEC`). 주인공 시민 1명(1·5·17번), 6번 추기경은 손만, 글자 없음(11번 달력 '8월'·'23'만). `C:/tmp/story-ep1-images/story_ep1_s{1..18}.png`(12번은 서류철이 일본 국기처럼 보여 재생성 — 반려본 `…_rejected-flag-like-folder.png`). 영상 프롬프트 생성기 `scripts/build-story-video-generation-prompts.mjs`(재연 장면=말 금지·카메라 고정, 장면별 `lock` 고정 지시) → `_ai/story-ep1-video-generation-prompts.md`(8초 16·10초 2).
- **도구:** 스토리 소재 러너 풀 v2(73개, 코인·주식·유튜버 17개 제외·자동 차단, 점수=10박자 적합 storyFit), 스토리형 검사기 `check-script-standards.mjs --format story`(`_story-script-standards.mjs`, TTS 스크립트 `formatProfile: story_v1`이면 TTS 래퍼가 자동 실행).
- **교훈(이미지→영상 변환 위험 점검):** 빈 큰 면(벽 원판·비행기 동체·선체)에 글자가 생길 수 있어 영상 프롬프트에 고정 지시, 손끝으로 집은 소품·두 사람이 같이 잡은 전달 장면은 손 움직임 금지, 작은 군중·반복 무늬·세부 반사는 움직임을 줄임. 이미지 검수는 글자·손가락뿐 아니라 국기처럼 읽히는 도형(흰 바탕+붉은 원)까지 본다.
- **채널 정체성 우려(Owner 2026-10-07 질문):** 스토리형이 경제번역소와 안 어울리지 않나 → 판정 = 형식이 시청자(기존 "내 지갑" 시청자)와 다른 상품이라는 위험을 인정, 스토리형 3편 정도 설명형과 비교(평균 시청·저장·공유·팔로우)해 판단, 경제 원리가 분명한 사건만 소재로. 섞여서 잘 되는 근거는 없음(벤치마크 채널은 전부 이야기 전용).
- **미커밋:** 위 도구·스펙·문서 전부 로컬 변경(커밋은 Owner 승인).

관련: [[feedback_operating_system_v2_one_per_day_claude_recommends_2026_10_06]], [[feedback_audience_ig_2040_youtube_all_ages_common_script_2026_10_07]].
