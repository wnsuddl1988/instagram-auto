---
name: project-bull-cta-final-confirmed
description: "황소특보 고정 CTA 클립 최종 확정(2026-09-23) — 산출물 경로, 확정 나레이션, Veo 프롬프트 실패 원인과 해법"
metadata:
  node_type: memory
  type: project
  originSessionId: 0616c897-fe63-4f4b-b75e-04be8bd972c3
  modified: 2026-09-30T04:47:47.864Z
---

**★2026-09-30 대체됨: 11편부터 `C:\tmp\bull-cta-fixed-v6\bull_cta_fixed_final_layout_v2.mp4` 사용(채널바 없음·자막 y1290) — [[project-cta-layout-v2-remake-2026-09-30]]. 나레이션·Veo 교훈은 여전히 유효.★**

## 확정 산출물

- **최종 파일**: `C:\tmp\bull-cta-fixed-v5\bull_cta_fixed_final_with_captions.mp4` (8.33초, 1080x1920)
- **원본 Veo 클립**: `C:\tmp\bull-cta-fixed-v5\bull_cta_fixed_follow_teaser_motion.mp4` (10초 원본, 조립 시 0.5초 여백만 남기고 트림)
- **배경 정지 이미지**: `C:\tmp\bull-cta-fixed-v2\ref\bull_cta_bg_v2.png` (canonical reference 얼굴/색/비율 유지, 배경만 현대적 트레이딩룸/뉴스룸으로 교체 — [[project_bull_character_design_confirmed]]의 서재+도심야경과는 다른 CTA 전용 배경)
- **TTS 음성**: `C:/tmp/money-shorts-os/bull-cta-tts-v2/out/` (voice: Jeonggi, [[project_bull_voice_confirmed]] 참고)
- **조립 스크립트**: `scripts/run-bull-cta-fixed-assemble-once.mjs` (`--tail-pad-sec` 인자로 나레이션 종료 후 여백 조절 가능, 기본 0.5초)

## 확정 나레이션 (여러 차례 수정 끝에 확정, 임의 변경 금지)

"새로운 투자 소식 나올 때마다, 핵심만 정리해서 가장 먼저 알려줄게. 팔로우해두면 놓치는 일 없어. 황소특보였어."

카드 오버레이: "팔로우"(accent) / "핵심 소식 가장 먼저"(label) — 2026-09-23 Owner 지시로 "실시간" 제거, 나레이션과 톤 통일.

채널명 워터마크: "경제번역소" 고정 — 황소특보는 독립 채널이 아니라 부엉박사·금박사와 같은 경제번역소 채널 안의 세 번째 캐릭터이므로 부엉박사 CTA와 동일 워터마크 사용.

## 문구 확정까지의 시행착오 (다음에 비슷한 CTA 만들 때 참고)

- v1 나레이션("실시간 시황, 놓치면 손해야... 장 열리자마자 가장 먼저")은 "실시간"/"장 열리자마자"가 실제 캐릭터 속성(1~2일 내 소식 전달, 장 개장과 동시가 아님)과 안 맞아 폐기.
- "시장 소식", "시황"만 단독으로 쓰는 대체 표현은 전부 어색하다는 피드백 — 사실관계만 고치려다 톤이 밋밋해지는 실패를 여러 번 반복함.
- 최종 해법은 웹 조사에서 확인한 원칙: 팔로우 유도는 막연한 "놓치면 손해" 위협보다 **팔로우하면 구체적으로 뭘 얻는지(효용)**를 명시하는 게 효과적 — 이 원칙에 맞춰 "핵심만 정리해서 가장 먼저 알려줄게"로 재구성해 확정.
- 교훈: 캐릭터 속성과 안 맞는 표현이 발견되면, 문제된 단어 하나만 다른 단어로 치환 시도하지 말고 **그 단어가 문장에서 수행하던 역할(여기선 "시간적 긴박함")**을 파악해서 그 역할을 사실에 맞는 다른 표현으로 교체해야 함.

## Veo 생성 실패 원인 규명 (중요 — 향후 CTA/영상 프롬프트 작성 시 반드시 참고)

배경을 "현대적 트레이딩룸"으로 교체하는 과정에서 Veo 영상 생성이 **"오디오를 생성할 수 없습니다"** 에러로 두 차례 연속 실패했다. 원인으로 확인된 것:

1. **프롬프트 내 모순 지시**: CAMERA_LOCK에 있던 `"Silent, 9:16 vertical format"`(무음 지정)과, 입 움직임 표준 문구(`"mouth actively opens and closes... clearly synced to active speech"`, 음성 동기화 요구)가 같은 프롬프트 안에 공존 — Veo가 이 모순을 오디오 생성 거부로 반응한 것으로 추정. **"Silent" 제거 후 정상 생성됨.**
2. 배경 텍스트 억제를 위해 넣었던 과도한 반복 부정문구("blurred, out-of-focus, static glow... treat those screens as blurred glowing light panels")도 프롬프트를 불필요하게 복잡하게 만들어 실패 가능성을 높였을 수 있음 — 단순한 "purely abstract chart shapes with zero readable text" 수준으로 되돌리자 정상 작동.
3. **결론**: CTA처럼 나레이션(음성)이 있는 영상의 Veo 프롬프트에는 "Silent"류 무음 지정 문구를 절대 넣지 말 것. 배경 텍스트 억제는 "부드럽게 흐릿하게 처리하라"는 강한 지시보다 "abstract shapes, zero readable text" 정도의 담백한 지시가 더 안정적으로 작동함.
4. 부엉박사 CTA 프롬프트(`_owl-cta-veo-scene-prompt.mjs`)에도 동일한 "Silent" 문구가 있으나 그쪽은 지금까지 문제없이 작동해왔음 — 즉 "Silent" 단독으로는 항상 실패하는 게 아니라, 입 움직임 지시가 추가된 조합에서만 문제가 재현된 것으로 보임. 부엉박사 CTA에도 입 움직임 문구를 나중에 추가할 계획이 있다면 이 조합을 먼저 의심할 것.

## Google Flow 다운로드 자동화 버그 (아직 미수정 상태로 남음)

`scripts/run-owl-flow-motion-execute-once-v1.mjs`의 완료 타일 클릭 로직이 두 가지 실패 모드를 보임:
- `completed_tile_title_unparseable`: 완료된 타일에 제목 텍스트가 전혀 없고 아이콘만 있는 경우 — **이건 이번 세션에서 코드 수정으로 해결함**(타일 자체의 boundingBox로 좌표 폴백 추가, 574번째 줄 근처).
- `result_detail_player_not_opened`: 더블클릭 후에도 상세 플레이어가 안 열린 것으로 판정되는 경우가 있으나, 실제로는 이미 열려있었던 사례 확인(수동으로 Playwright 재연결해서 확인하니 정상 플레이어 화면이었음) — 이건 아직 코드로 못 고침, 발생하면 프로젝트 URL로 직접 재연결해서 다운로드 버튼을 다시 클릭하는 수동 대응이 유일한 방법.
- 타이핑 타임아웃(프롬프트 4000자 이상일 때 60초 고정 타임아웃 초과)도 코드 수정으로 해결함(길이 비례 동적 타임아웃 적용).

## CTA 결합 시 "새로운" 잘림 사고와 근본 수정 (2026-09-24)

`run-owl-episode-with-fixed-cta-once.mjs`(공용 CTA 결합 스크립트)가 `CTA_LEADING_SILENCE_TRIM_SEC = 0.5`로 하드코딩돼 있었다. 이 값은 부엉박사/금박사 CTA(도입부 무음 약 0.9초) 기준인데, 황소특보 CTA(`bull_cta_fixed_final_with_captions.mp4`)는 실측 도입부 무음이 **0.18초뿐**이라 0.5초를 트림하면 발화가 이미 시작된 지 0.32초 지난 지점부터 잘라 **"새로운"의 앞부분이 잘린다.** 1편에서 이미 같은 유형 문제를 "트림 없이 원본 CTA 그대로 사용"으로 해결했다고 기록됐으나, 공용 스크립트의 하드코딩 값 자체는 고쳐지지 않아 2편(`bull-ep2-episode-final`)에서 재발함(Owner 지적, 2026-09-23: "CTA넘어가면 CTA 장면 처음에 '새로운' 이 단어를 또 말하지 않는다").

**수정(2단계)**: 처음엔 `--cta-leading-silence-trim-sec`을 필수 인자로 만들었으나, Owner가 "황소특보 영상조립할 때는 무조건 이 방식으로 할 수 있게 해줘"라고 지시해 **자동화로 한 단계 더 강화**했다. 이제 스크립트 안에 `KNOWN_CTA_LEADING_SILENCE_TRIM_SEC` 맵(CTA 클립 절대경로 → 트림초)이 있어서, `--cta-clip`으로 넘긴 경로가 이 맵에 있으면 `--cta-leading-silence-trim-sec`을 아예 안 줘도 자동으로 정확한 값이 적용된다. 맵에 없는 새 클립이면 여전히 ABORT(사고 재발 방지 안전장치 유지).

등록된 값(2026-09-24 실측):
- 황소특보 `C:/tmp/bull-cta-fixed-v5/bull_cta_fixed_final_with_captions.mp4` → **0.15초** (실측 무음 0.179초, 안전하게 그 직전까지만)
- 부엉박사 `C:/tmp/owl-cta-fixed-v2/owl_cta_fixed_v2_final_v6.mp4` → **0.5초** (실측 무음 0.516초, 기존 하드코딩값과 회귀 없이 일치)
- 금박사 `C:/tmp/geumbaksa-cta-fixed-clean/geumbaksa_cta_clean_final.mp4` → **0.5초** (실측 무음 0.897초, 기존 "약 0.9초" 기록과 일치)

**Why**: 캐릭터마다 CTA 클립의 실제 도입부 무음 길이가 다른데 트림값을 한 캐릭터 기준으로 고정하면 다른 캐릭터에서 발화가 잘리는 사고가 반복된다. "매번 값을 사람이 명시"하는 방식도 깜빡할 여지가 있어, 확정 클립은 코드에 등록해 자동화하고 미확인 클립만 사람이 재측정하게 분리했다.

**How to apply**: 황소특보(또는 부엉박사·금박사) CTA를 결합할 때 `--cta-leading-silence-trim-sec`을 아예 생략해도 된다 — `--cta-clip` 경로만 정확하면 자동으로 맞는 트림값이 적용된다. CTA 클립을 새 버전으로 교체하면 `run-owl-episode-with-fixed-cta-once.mjs`의 `KNOWN_CTA_LEADING_SILENCE_TRIM_SEC` 맵에 새 경로와 실측값을 추가해야 한다 — 안 하면 ABORT로 막히니 누락되면 바로 알 수 있다.

## 남은 작업

- `run-owl-flow-motion-execute-once-v1.mjs`의 `result_detail_player_not_opened` 버그는 미수정.
- 이미 배포된 2편이 "새로운" 잘린 버전이면, 수정본(`C:/tmp/money-shorts-os/bull-ep2-episode-final-cta-fix/owl_episode_final.mp4`)으로 재배포 필요 여부를 Owner에게 확인할 것.
