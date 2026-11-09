---
name: project-owl-character-consistency-and-fixed-cta
description: "부엉이 캐릭터 일관성 문제의 원인과 다음 편부터 적용할 해결 방식, 고정 CTA 클립 도입"
metadata: 
  node_type: memory
  type: project
  originSessionId: 209772ed-9454-43be-8a7d-a56438263799
  modified: 2026-09-18T00:56:55.096Z
---

**고정 CTA 클립 도입 결정(2026-09-17)**: 매 편 8번째 장면(채널 소개+팔로우 유도)은 내용이 사실상 고정이라 매번 새로 생성하지 않고, 최고 퀄리티로 한 번만 만들어 모든 편에 재사용한다. 표준 편은 1~7번 콘텐츠+고정 CTA(8번 자리), 긴 편은 1~8번 콘텐츠+고정 CTA(9번 자리)로 구성. 대본/음성만 나중에 조립 단계에서 언제든 교체 가능한 구조 유지.

**캐릭터 일관성 붕괴의 근본 원인**: `probe-character-consistency-chatgpt-v1.mjs`는 "같은 ChatGPT 대화 세션 안에서 순차로 이어서 요청"해야만 캐릭터 일관성이 확보되는 구조다(1번째만 IDENTITY 전문, 이후는 "같은 캐릭터, 포즈만"). 고정 CTA 이미지를 별도 새 대화(`first: true`, 세션 처음부터)로 생성했더니, IDENTITY 텍스트가 동일해도 색감·눈매·비율이 기준 캐릭터와 눈에 띄게 달라지는 문제가 실제로 발생함(2026-09-17). 2편 8장면 자체도 제작 과정에서 세션이 여러 번 끊겼다 이어지면서 장면마다 미세한 캐릭터 편차가 있었음(Owner가 완성 영상을 연달아 보고 발견).

**Why:** 텍스트 설명만으로는 아무리 정교해도 매번 미묘하게 다른 이미지가 나온다. 대화 세션 연속성이 일관성의 핵심 메커니즘인데, 세션이 끊기면 이 보장이 사라진다.

**How to apply — 다음 편(3편)부터 반드시 적용**: Owner 결정(2026-09-17)은 "기준 이미지를 매번 참조로 첨부 + 기존처럼 한 대화창에서 1~8(9)번을 계속 이어서 생성"하는 이중 방식. 즉:
1. 확정된 캐릭터 기준 이미지 1장을 골라 고정 참조 자산으로 지정한다.
2. 매 장면 생성 시 그 기준 이미지를 파일로 첨부(업로드)한 채로 프롬프트를 보낸다.
3. 동시에 8~9장면을 전부 하나의 대화 세션 안에서 순차로 이어서 요청하는 기존 방식도 유지한다(세션 연속성 + 참조 이미지 첨부의 이중 안전장치).
4. `probe-character-consistency-chatgpt-v1.mjs`에 참조 이미지 첨부 로직(현재 없음 — 순수 텍스트 프롬프트만 지원)을 추가하는 구현 작업이 다음 편 준비 시 선행되어야 함.

**기준 참조 이미지 확정(2026-09-17, v4 최종)**: `assets/character-references/owl3dv5-canonical-reference.png` (저장소 내 영구 보관, `C:/tmp` 임시 폴더 아님). 발전 과정: (1) 1편 오리지널 이미지(`owl_s1_hook.png`)에 캐릭터 기준 왼쪽 다리 발목 금색 링 추가(오리지널에 있었으나 후속 생성에서 누락됐던 디테일 복원, 굵기 중간) + 휴대폰 제거로 중립화 → (2) 배경 구도가 가장 좋았던 CTA 시도(캐릭터 약 28~30%, 배경 소품 최대로 넓게 보임)를 카메라 거리 기준으로 채택 → (3) 그 구도에 캐릭터 확정본(발목 링·미소 표정·손짓)을 합성 → (4) 최종적으로 캐릭터 비율을 50~55%로 재조정(배경은 여전히 넓게 유지). 이 최종 이미지가 지금의 canonical reference — **얼굴형/눈매/색감/발목 링/표정/손짓/카메라 구도/캐릭터 프레임 비율(50~55%)을 전부 포함한 완성형 기준**.

`probe-character-consistency-chatgpt-v1.mjs`의 `OWL3DV5_CANONICAL_REFERENCE` 상수가 이 경로를 가리키며, `owl3dv5` 캐릭터로 생성하는 모든 이미지(콘텐츠 8장면 + 고정 CTA, 3편 이후 전부)에 항상 이 파일이 첨부된다. 추가로 `buildPrompt()`에 `OWL3DV5_FRAME_RATIO_RULE` 텍스트 지침을 넣어, 참조 이미지 첨부만으로는 부족했던 프레임 비율(카메라 거리)까지 텍스트로 재차 강조하도록 함 — `CHARACTER === "owl3dv5"`일 때 모든 후속 포즈(`first: false`) 프롬프트에 자동으로 "캐릭터 50~55%, 배경 넓게" 지침이 붙는다.

[[project_flow_timing_and_completion_detection]], [[feedback_flow_always_lite_model]]과는 별개로 이미지 생성(ChatGPT) 파이프라인에 대한 기록.

**고정 CTA 구현 완료(2026-09-17)**: `scripts/run-owl-cta-final-assemble-once.mjs`로 CTA 영상+음성+자막 최종본 완성(`C:/tmp/owl-cta-final/owl_cta_final_with_captions.mp4`, "팔로우"/"다음 소식도 먼저 받기" 카드와 채널명 바 모두 고정 포함). 편별 조립 시 `scripts/run-owl-episode-with-fixed-cta-once.mjs`로 본편(1~7번)에 이어붙이면서 그 편의 `headerTitle`만 CTA 위에 자동으로 얹는다. `_owl-assembly-spec.mjs`의 8번 장면(`closing_cta`)은 TTS 파이프라인의 4~18장면 가드 때문에 스펙에는 남겨두되, 실제 영상은 쓰지 않고 조립 스크립트가 그 구간을 잘라내 CTA로 교체한다.

**2편 재검수(2026-09-17)에서 발견/수정된 자막 버그 2건, 다음 편에도 반드시 유지**:
1. 자막 강제 2줄 처리 중 화면 폭을 넘는 회귀가 있었음(6번 장면 50초 부근) — `wordTimings`(어절별 실제 발화 타이밍)로 시간축 재분할하는 방식(`splitCaptionIntoScreenSafeBlocks`)으로 해결. 렌더 직전 `captionWidthPass`/`captionLineCountPass` 자동 검증 가드를 `run-owl-assemble-shorts-v2.mjs`와 CTA 스크립트 양쪽에 추가해 위반 시 ABORT하게 만듦 — 이 가드를 절대 제거하지 말 것.
2. 강조색이 노랑(수치)·노랑(개념어)·빨강(위험)으로 실질 2색이었음 — 청록(#52C4E3, `&H00E3C452`)을 신설해 실질 3색 체계로 확정. `EMPHASIS_KEY_TERMS`는 편마다 그 편의 핵심 용어를 추가해야 함(하드코딩된 1편 용어만 있으면 다른 편에서 하나도 안 걸림).

**3편부터(2편 한정 아님, 앞으로 표준) 적용할 원칙(2026-09-17 확정)**:
- **8장면 규격 폐기**: 대본 분량에 맞춰 장면 수를 유동적으로 늘린다. 목표는 정확한 내용 전달+구독자 유입이지 규격 준수가 아님(Owner).
- **정지화면(tpad) 재발 방지**: 나레이션이 클립 길이보다 길어질 것 같으면 스펙 작성 단계에서 미리 장면을 쪼갠다. TTS 실측 결과 target이 클립 길이를 초과하면 대본 압축 또는 장면 분할로 즉시 대응(사후 조립 단계에서 발견하면 비용이 더 큼).
- **Flow는 8초 상한**: Flow가 8초 넘으면 크레딧 소모 급증. Flow UI엔 길이 설정 자체가 없으므로 "8초 넘는 장면을 하나 더 쪼개기"로 대응. Gemini는 10초까지 무리 없음.
- **Gemini/Flow 선택권**: `run-owl-motion-orchestrator-v1.mjs`에 `--on-quota flow|wait` 옵션 추가(기본값 flow=기존 자동전환). `wait`는 Gemini 한도 소진 시 그 자리에서 멈추고 리포트에 `resumeHint` 남김 — 자동 sleep 없이, 한도 풀린 뒤 같은 명령 재실행하면 완료된 장면 건너뛰고 이어감.
- **대본-동작 싱크로율**: 사람이 대본을 직접 보면서 장면별 액션 시퀀스를 세밀하게 씀(수치 나올 때 손가락 제스처, 부정적 결론에서 표정 전환 등). 100% 동기화는 불가능을 서로 인지, 자동 매핑 규칙 대신 시간이 걸려도 수작업 품질을 우선하기로 확정(Owner: "시간은 관계없이 제대로 하는게 더 좋아").
- 상세 절차는 `_ai/OWL_SHORTS_RUNBOOK_V1.md` 6단계(영상), 8단계(조립), 8-1절(고정 CTA)에 전부 반영됨.

**고정 CTA 밝은 톤 교체(2026-09-18, 3편부터 표준)**: 1·2편에 게시된 어두운 네이비 톤 CTA(`owl_cta_final_with_captions.mp4`, follow 1클립·8.6초)는 그대로 두고, **3편부터는 밝은 톤 CTA(follow+teaser 2클립 결합, 16.9초)로 전체 교체**해 매 편 마지막에 고정 재사용한다. 편이 바뀌어도 이 CTA는 다시 만들 필요 없음(대본이 편마다 바뀌지 않는 고정 문구).

- **화면 구성**: follow(8.88초, 마지막 프레임 정지 확장으로 8.87초 음성과 길이 맞춤) = "팔로우"(accent)/"다음 소식도 먼저 받기"(label) 카드 + 하단 채널명. teaser(8.0초, 음성 5.76초는 영상보다 짧게 두고 캐릭터 동작 여운으로 채움) = "경제번역소"(accent)/"다음 편도 기대해줘"(label) 카드 + 하단 채널명. 상단 주제 헤더는 CTA 어디에도 넣지 않음.
- **기준 이미지**: `C:/tmp/owl-cta-bright-v2/owl_cta_bright_follow.png`(팔로우 유도, 팔 대각선 아래로 완전히 뻗어 검지로 가리키기), `owl_cta_bright_teaser.png`(측면에 가까운 구도, 창밖 도시 풍경). 3차 프롬프트 개정 끝에 성공 — 1·2차는 "상대적 지시"(각도 수치만)로는 반영이 약해서, 3차에서 "팔 끝이 프레임 하단 10~15% 지점까지" 같은 과장된 물리적 절대 지시로 바꿔야 원하는 동작이 나옴. `scripts/probe-character-consistency-chatgpt-v1.mjs`의 `--owl-cta-bright-v2`/`--owl-cta-bright-follow-only` 모드로 생성.
- **모션 프롬프트**: `scripts/_owl-cta-veo-scene-prompt.mjs`의 `owl_cta_bright_follow`/`owl_cta_bright_teaser`(기존 어두운 톤 `owl_cta_signature`/`owl_cta_teaser`는 그대로 보존, 삭제 금지).
- **TTS**: follow 대본은 1·2편과 동일 문구("어려운 경제 뉴스를... 팔로우해두면...")를 재사용하되 신규 생성 — `scripts/_build-owl-cta-tts-script-once.mjs`가 `_owl-assembly-spec.mjs`의 `closing_cta` role에 의존했으나 3편 스펙(11장면, closing_cta 없음)으로 바뀌면서 깨져 있었음 → 확정 문구를 스크립트에 직접 하드코딩하는 방식으로 수정 완료. teaser 대본("다음 편엔... 경제번역소였어")은 `scripts/_build-owl-cta-teaser-tts-script-once.mjs`(신규)로 생성.
- **조립**: `scripts/run-owl-ep3-cta-bright-assemble-once.mjs`(신규, `run-owl-cta-final-assemble-once.mjs`는 1·2편 어두운 톤 재현용으로 그대로 보존)가 두 클립을 각각 mux+오버레이+자막 처리 후 concat. **버그 주의**: 오디오가 영상보다 짧을 때(teaser) `-shortest`를 쓰면 영상이 오디오 길이로 잘려버림(첫 시도에서 8초 teaser가 5.76초로 잘리는 회귀 발생) — 오디오가 영상보다 길 때만 `-shortest`, 짧을 때는 `-t <영상길이>`로 영상 길이를 유지해야 함.
- **최종 산출물**: `C:/tmp/owl-ep3-cta-bright/owl_ep3_cta_bright_combined.mp4`(16.9초, 1080x1920) — 이 결합본을 앞으로 모든 편의 본편 콘텐츠 뒤에 그대로 이어붙이면 됨.
