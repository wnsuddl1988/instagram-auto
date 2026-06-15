# AutoShorts AI — 장기 운영 지식

## Claude API 비용 정책 (2026-06-13 확정)

**규칙:** 모든 Claude API 호출 전 모델, 최대 비용, 호출 횟수를 보고하고 사용자 승인을 받는다.

- **기본 대본 모델:** `claude-haiku-4-5` 또는 `claude-sonnet-4-6` (비용 효율 우선)
- **Opus 계열 (`claude-opus-4-8` 등):** 사용자 명시 승인 없이 사용 금지
- **승인된 예상 비용 상한:** 호출 전 명시. 초과 예상 시 호출 중단 후 보고
- **Why:** v3 대본 생성 시 Opus 4.8 사용 → 예상 $0.01~0.03 대비 실제 $0.1346 발생 (4배 초과)
- **How to apply:** `_psych-claude-script.mjs` 등 Claude API 호출 스크립트 작성 시 모델 고정 + 비용 추정 보고 후 시작

### ⛔ 승인 호출 횟수 초과 금지 + 파싱 실패 시 재호출 금지 (2026-06-14 확정)

- **승인 호출 횟수는 절대 상한이다.** "정확히 1회" 승인 시 1회만 호출한다. 결과가 만족스럽지 않아도 추가 호출 금지.
- **JSON 파싱/검증 실패는 모델 실패가 아니라 구현(프롬프트/스키마/파서) 오류로 간주한다.** 이때 API를 재호출하면 안 된다.
- **필수 구현 패턴:** ① 응답 원문(raw)을 받는 즉시 파일로 저장 ② 파싱 실패 시 저장된 raw에서 **로컬 복구**(인용부호 정규화·정규식 scene 추출·잘림 보정) ③ 복구 불가일 때만 사용자에게 보고하고 **다음 호출은 사용자 재승인 후에만**.
- **Why:** MVP02 v3 대본 압축에서 "정확히 1회" 승인을 받고도 JSON 파싱 실패(① 출력 스키마 과다로 잘림 ② narration 내 큰따옴표로 JSON 깨짐)에 자동 재호출하여 **총 3회 호출**(2차 $0.0100 + 3차 $0.0124 + 1차 추정 ≤$0.0198 = 합 최대 ≈$0.042) → 승인 1회·$0.03 초과. 두 실패 모두 구현 오류였고 원문 보존+로컬 복구로 0회 추가 호출이 가능했다.
- **How to apply:** Claude/OpenAI 등 과금 LLM 호출 스크립트는 raw 저장→로컬 파싱 복구를 기본 탑재. 재호출 라인을 코드에 두지 말 것.

---

## 작업트리 누적 방지 운영 규칙 (2026-06-15 확정)

### 기준
- **untracked 30개 초과** 또는 **diff +3,000줄 초과** 시 새 생성 작업 중단 → 감사 우선
- Atomic task 종료 시 `git status` 확인 필수
- 재사용 코드(스크립트·인프라·문서)는 검증 후 커밋
- 일회성 스크립트·QA 결과는 즉시 `output/archive/YYYYMMDD/` 이동

### 아카이브 위치
- `output/archive/` — `.gitignore`에 포함되어 Git에 노출 안 됨
- manifest: `archive_manifest.json` (이동 파일·날짜·복구 방법 기록)
- 복구: `fs.renameSync(archive경로, 원본경로)`로 언제든 역이동 가능

### Clear/Compact 운영
- **Compact**: 작업 도중 맥락만 커질 때 (작업 계속)
- **Clear**: 완료된 작업에서 새 단계로 넘어갈 때
- `/clear` 전 반드시 PLAN/LOG/KNOWLEDGE 및 최신 인계 동기화 확인

### 커밋 분리 원칙
| 커밋 | 대상 |
|------|------|
| 제품 코드 | 공용 컴포넌트·API·렌더러·env 유틸 |
| 3D 시트콤 자동화 | `_upload002-*`, `chromeProfiles.ts`, 브릿지 API |
| 프로젝트 문서 | PLAN/LOG/KNOWLEDGE/exec-plans |

### 로컬 전용 파일
- `.claude/settings.local.json`, `.claude/launch.json` — `.git/info/exclude` 사용, 커밋 금지

---

## 콘텐츠별 음성(TTS) 풀 (2026-06-13 확정)

| 순위 | Voice | 적합 카테고리 |
|------|-------|-------------|
| 1 | Harry Kim | 인간관계, 남녀심리, 현실 조언 |
| 2 | Hyein | 심리 해석, 관계 신호, 투자심리 |
| 3 | Hana Lee | 가벼운 관계심리, 공감형 |
| 4 | Mono Beige | 내면 독백, 감성심리 |
| 5 | Sola | 성공·마인드, 자존감 |
| 보조 | Mina | 생활꿀팁, 정보형 심리 **전용** |

**Mina 관계심리 콘텐츠 사용 금지** — Why: psychology/emotional_story 콘텐츠에 Mina 사용 시 분위기 불일치

### ⚠️ voiceId 미등록 (2026-06-13 기준)
- 위 음성 풀은 **이름·용도만** 정의됨. 실제 ElevenLabs voiceId는 코드/설정 어디에도 매핑되지 않음.
- `lib/voiceConfig.ts` ElevenLabs 슬롯 5개 전부 `elevenLabsVoiceId: null`.
- `.env.local`의 `ELEVENLABS_VOICE_ID`는 현재 Mina(여성) 1개만 등록 추정.
- **Harry Kim / Hyein / Hana Lee / Mono Beige / Sola TTS를 쓰려면 각 voiceId를 먼저 `voiceConfig.ts` 또는 `.env.local`에 등록해야 함.**
- voiceId 미확인 상태에서는 TTS 호출 금지 (잘못된 보이스로 크레딧 소모 방지).

### ✅ ElevenLabs 콘텐츠별 음성 풀 voiceId 확정 (2026-06-13)
- 사용자가 Voice Library에서 6개를 "My Voices"에 추가 후, `GET /v1/voices` HTTP 200으로 정확 일치 확인 완료.
- voiceId는 **공개 메타데이터** (비밀 아님) → `lib/voiceConfig.ts`의 `CONTENT_VOICE_POOL`에 영구 등록함.

| 콘텐츠 타입 | Voice | voiceId |
|------|-------|---------|
| relationship_advice | Harry Kim - Conversational | `pb3lVZVjdFWbkhPKlelB` |
| psychology_analysis | Hyein - Calm & Professional | `6Vgh4FaCc0SCcWPwcyXa` |
| light_relationship_empathy | Hana Lee - Natural and Cheerful | `QPFsEL6IBxlT15xfiD6C` |
| emotional_inner_monologue | Mono Beige - Calm & Contemporary | `SE9upoSoM2ipDUdAVW8q` |
| success_self_esteem | Sola - Warm, Clear and Rich | `KlstlYt9VVf3zgie2Oht` |
| practical_information | Mina - Clear, calm & Warm | `aiUUgjHa4mpHf6UenZuf` |

- 주의: 계정의 "Harry - Fierce Warrior"는 별개 보이스 (전사 캐릭터). Harry Kim과 혼동 금지.
- 음성 풀은 `CONTENT_VOICE_POOL` 참조용 매핑 — 기존 카테고리 기본 선택을 강제 변경하지 않음.

### ⛔ Harry Kim 한국어 콘텐츠 영구 탈락 (2026-06-13)
- 사용자 청취 평가: **한국어 발음·억양·속도·연기 느낌 문제** → 영구 탈락.
- `voiceConfig.ts` `CONTENT_VOICE_POOL.relationship_advice`에 `deprecated: true` 표기.
- relationship_advice 콘텐츠 대체 보이스는 블라인드 테스트로 재선정 필요.

### 음성 검증 원칙 (2026-06-13 확정)
- **기술 QA만으로 보이스를 최종 합격시키지 않는다.** 이름·태그(category=professional 등)도 신뢰하지 않음.
- 동일 대본·동일 설정의 한국어 블라인드 테스트(A/B/C/D 셔플) + **사용자 실제 청취 평가**를 통과한 보이스만 `validated: true`로 등록.
- 블라인드 비교 스크립트: `scripts/_psych-voice-blind-test.mjs` (loudnorm 정규화 + 셔플 + comparison 합성).
- 1차 블라인드 후보: Hyein / Hana Lee / Mono Beige / Sola (Mina는 정보형 전용으로 비교 제외).
- **1차 결과**: 4개 전부 관계심리 탈락. A(Mono Beige)→불교·명언 콘텐츠 보류, D(Sola)→생활꿀팁 보류, B(Hana Lee)/C(Hyein) 탈락. validated=false 유지.

### Voice Design 전환 (2026-06-13)
- Library 이름·태그 기반 후보 탐색 중단 (5개 연속 실패). **ElevenLabs Voice Design API로 한국어 전용 보이스 직접 설계**로 전환.
- 엔드포인트: `POST /v1/text-to-voice/design` — `voice_description`(필수) + `text`(100~1000자) + `model_id`. 응답 `previews[]`에 `audio_base_64` + `generated_voice_id`.
- model `eleven_ttv_v3` 정상 사용 (HTTP 200, fallback 불필요). 요청 1회로 preview 3개.
- voice_description 핵심: Native Korean / Seoul standard / 자연 대화체 / 느린 호흡·핵심 강조 / 성우·뉴스·광고·명상·외국어 억양 금지.
- 1차 디자인 산출물: `output/v2/paid_qa/psychology_voice_design_v1/` (블라인드 A/B/C). 사용자 청취 평가 대기.
- 합격 시 `generated_voice_id`로 My Voices 저장 → `voiceConfig.ts`에 `validated: true` 등록.

### 역할 기반 운영 음성 풀 `VOICE_POOL` (lib/voiceConfig.ts, 2026-06-13~)
- status: `provisional`(블라인드 통과·실제 영상 검증 전) / `validated`(영상 적용까지 확인) / `deprecated`(탈락). **실제 영상 검증 전 validated 금지.**
- **남성 provisional 등록 완료** (Voice Design male_v1 블라인드 A/B/C, 사용자 역할 확정):
  - male_persuasive_appeal (관계 경고·현실 조언·성공 마인드) = 남성 A `KgY3uQHUKw0hah6g2xjn`
  - male_trusted_information (심리 분석·투자심리·경제) = 남성 B `uIDle50IpRkamKKmsOEc`
  - male_light_emotional (공감형 관계심리·짧은 독백) = 남성 C `Cpod4JhRysPuubCUTcQi`
- **여성 역할 3종 등록 완료** (Voice Design female_roles_v1, 사용자 역할 매칭 확정, My Voices 저장됨, status=provisional):
  - female_information_empathy (심리분석·관계신호·공감·독백) = 여성 A `Vcdpf78zk35fXQIvmObI`
  - female_persuasive_appeal (관계경고·현실조언·자존감·성공) = 여성 B `n64q8n5KTcGLp392p3wn` ← **관계경고 MVP 1순위**
  - female_trusted_information_alt (심리분석·투자·경제) = 여성 C `uP1FVX5bEfq8Dzb1LDTs`
  - 여성 후보 발화속도 6.9~7.5자/초 (목표 7.0 근접, 남성 8.5~9.3보다 자연스러움).
- **여성 B 실전 검증본**: `output/v2/paid_qa/psychology_mvp_01_final_female_b/` (27.67s, gap 0.011s, 흔들림 0). 사용자 청취 통과 시 female_persuasive_appeal을 validated 전환.
- **여성 B MVP02 적용 (2026-06-14)**: 오피스 콘셉트 영상에 ElevenLabs TTS 1회(HTTP 200, ~221자, settings stability 0.48/style 0.2). `output/v2/paid_qa/psychology_mvp_02_final/psychology_mvp_02_final.mp4` (31.93s, gap 0.037s). **TTS 길이 조절 팁: 줄임표+빈 줄 포즈가 과하면 길이 초과(34s 발생). TTS 재호출 대신 `silenceremove stop_duration=0.85s`로 0.85s 초과 포즈만 클램프(발화/톤 불변) → 31.9s 안착. 크레딧 0.** 스크립트 `_psych-mvp02-female-b-tts-final.mjs`(TTS+렌더) + `_psych-mvp02-female-b-trim-render.mjs`(포즈 정돈 재렌더).
- **v3 정보밀도 축소 + 이미지 동기 (2026-06-14)**: 사용자 피드백 "대사 많아 빠르게 느껴짐, 이미지보다 설명이 앞서감". 해결 = 영상 늘리기 아니라 **덜 말하고 제대로 멈추기**. ① 대본 221→163자 압축(Sonnet 1회 $0.0124, 장면당 핵심 1개, 대응문장 2개 유지). ② API 없이 무음 타이밍 plan 먼저 검증(장면별 LEAD 1.0s+발화+TAIL 0.7s, 28~33s 통과해야 TTS 진행). ③ 여성 B TTS 1회(stability 0.55/style 0.12 = 더 느리고 단호). ④ **단일 TTS → silencedetect로 씬 발화 구간 분리 → 각 씬 `adelay`(선두 무음)+`apad`(후미 무음)로 [전환여백+발화+쉼] 재구성 → 씬 duration=씬오디오 길이.** 결과 `output/v2/paid_qa/psychology_mvp_02_final_v3/psychology_mvp_02_final_v3.mp4` (32.27s, gap 0.083s). 스크립트 `_psych-mvp02-compress-script.mjs`/`_psych-mvp02-timing-plan.mjs`/`_psych-mvp02-v3-tts-sync.mjs`.
- **✅✅ v4 = 연속 오디오 + 영상이 음성을 따라가기 (2026-06-14, 최종 설계)**: 음성을 씬별로 절단해 영상에 맞추면(v3 방식) 전환 전후 말 끊김 발생. **올바른 설계: 원본 TTS를 절대 자르지 않고 통째로 입히고(render_v2 `narrationPath`에 연속본 그대로), 이미지 전환점(=씬 duration 누적)만 실제 문장 종결 무음에 배치한다.** 오디오 무절단 → 말 끊김 구조적 0. 속도는 `atempo=0.93`(피치 유지 7% 감속, 0.90~0.95 중 균형점)로 로컬 조정(TTS 재호출 0). 전환 여백은 강제 1s 금지, 경계 무음이 곧 자연 여백. 결과 `output/v2/paid_qa/psychology_mvp_02_final_v4/psychology_mvp_02_final_v4.mp4` (25.97s, 오디오 연속 25.45s, 4경계 -31~-90dB 무음, gap≈0). 스크립트 `_psych-mvp02-v4-continuous.mjs`.
- **captionMode 정책 (2026-06-14 확정, 영상별 1개만)**: `none`(자막 전혀 없음 — 이미지·음성 중심) / `minimal`(Hook 또는 결론에만 1회) / `full_impact`(전 씬 일관된 강한 문구). **일부 씬만 자막 넣는 혼합 금지**(규칙 없이 갑툭튀=어색). 기획 단계에서 콘텐츠 성격에 따라 결정. render_v2에서 caption=""이면 `_draw_caption`이 아무것도 안 그림 → 투명 overlay(잔여 픽셀 0)로 안전하게 none 구현 가능.
- **v4.2 = No Caption (2026-06-14)**: v4.1 plan 재사용 + caption 전부 "" → 이미지·narration·duration·전환 100% 불변(길이차 0.000s), 자막영역 크롭 검증 잔여 0. `psychology_mvp_02_final_v42.mp4`. 스크립트 `_psych-mvp02-v42-nocaption.mjs`.
- **v4.3 = Scene1 분할 방식 (폐기)**: Hook 2.8s를 위해 Scene1을 2세그먼트 분할 → 사용자 불합격(동일 이미지가 두 장면처럼 재시작될 위험 + 설명문 문구). 분할 방식 자체를 폐기.
- **✅✅ render_v2 `scene.captionVisibleSec` 추가 (2026-06-14)**: 자막을 씬 끝이 아니라 지정 초에 fade-out. **Scene 분할 없이 단일 세그먼트 위에서 Hook 시간 제어 가능.** `_render_segment(caption_visible_sec=...)` — 미지정(None)이면 기존 동작(씬 끝까지) 그대로 = 하위호환. plan scene에 `"captionVisibleSec": 2.65` 넣으면 0~2.65s만 표시 후 fade-out, 이미지는 단일 세그먼트라 점프 0(PSNR 67dB 검증).
- **v4.4 = Hook 2.65s 시간제한 (반려)**: captionVisibleSec로 2.65s만 표시 → 사용자가 "Scene1 전체 유지" 의도였음. 시간제한 폐기.
- **✅✅ render_v2 `hook_top` captionStyle 추가 (2026-06-14)**: 상단 안전영역(base_y~240) + 큰 폰트(84) Hook 전용 스타일. caption에 `\n` 있으면 자동 wrap 대신 그 줄바꿈 존중(의미 단위 2줄 고정). `scene.captionStyle`이 plan 전역보다 우선(씬별 override, 미지정 시 기존 동작).
- **✅✅✅ v4.5 = Scene1 상단 Hook 전체유지 확정본 (2026-06-14, MVP02 최종)**: Hook "무례한 사람을 당황하게 만드는 / 한마디"(상단 2줄, 84px)를 **Scene1 전체 시간 유지**(fade-out·captionVisibleSec 미사용), Scene2 전환에 제거. Scene1 단일 세그먼트, S2~5 무자막. 영상·음성·전환·길이 v4.2와 동일(길이차 0.000s). `output/v2/paid_qa/psychology_mvp_02_final_v45/psychology_mvp_02_final_v45.mp4` (27.97s). 스크립트 `_psych-mvp02-v45-hook.mjs`.
- **psychology_one_line 폰트 하한 74→64px 확장 (2026-06-14)**: 긴 Hook(19자 "무례한 사람을…한마디")이 74px에서 2줄 됨 → trial 폰트를 64px까지 축소 허용해 한 줄 유지. 짧은 caption은 80px 첫 trial에서 멈춰 영향 없음.
- **Hook 통과 기준 (2026-06-14)**: 궁금증·손실·구체적 보상 중 **최소 2가지** 충족. 설명문/교과서식/narration 반복 자막 금지. 영상 목적 설명이 아니라 '계속 볼 이유'를 만들어야 함.
- **심리 쇼츠 자막 기본값 = minimal (Hook 1줄)**: 첫 화면에 시청 이유 전달하는 궁금증형 Hook 한 줄만, 이후 이미지·음성 집중. none/full_impact는 콘텐츠 성격에 따라 선택.
- **✅✅✅ v4.1 = 호흡형 전환 (2026-06-14, 최종 권장 설계)**: v3(잘라서 긴 패딩=끊김)과 v4(연속재생=전환 후 급출발)의 중간값. **발화는 절대 안 자르고(문장 종결 무음 한가운데 mid에서만 분리 → piece tail 전부 무음 검증), 각 경계에 0.35~0.55s 호흡 무음 삽입 → 최종 문장 사이 무음 0.6~0.68s 확보.** 화면 전환=추가 무음 중간(mid), 자막 지연=전환 후 (G/2 + 인지 0.2s)≈0.44s로 다음 발화 시작에 정렬. 마지막 여운 0.5s는 **오디오에도 apad로 포함**해야 gap≈0(영상만 늘리면 gap 0.56s 초과). 결과 `output/v2/paid_qa/psychology_mvp_02_final_v41/psychology_mvp_02_final_v41.mp4` (27.97s, gap 0.062s, 발화 절단 0). 스크립트 `_psych-mvp02-v41-breath.mjs`. **이 방식이 음성-영상 동기의 표준.**
- **⚠️ atempo wav는 astats RMS 미출력**: atempo 처리한 wav는 `astats ametadata`가 RMS_level을 안 뱉음. 대신 `volumedetect`를 0.05s 슬라이딩 윈도우로 돌려 max_volume 최저점을 찾아 무음 스냅. 경계 환산(원본×시간배율)은 부정확하니 시드로만 쓰고 감속본에서 직접 재측정.
- **✅ 동기 분리 = RMS 골짜기 스냅이 정답 (2026-06-14)**: `silencedetect`는 임계(d=0.3s)가 짧은 문장 종결 무음(0.2~0.28s)을 놓쳐 인접 씬을 한 구간으로 오검출함(MVP02 v3 S1~S4가 한 구간처럼 보임 → 오진). **해결: `astats`로 0.05s 단위 RMS_level을 직접 추출 → 글자수 비율 목표 경계 산출 → 각 목표 ±0.75s 윈도우 내 최저 RMS 지점(골짜기)에 스냅.** MVP02 v3에서 4개 경계 전부 -67~-91dB 무음에 정확히 스냅(음절 절단 0, gap 0.001s). **윈도우는 넉넉히(±0.7~0.8s) — 좁으면 발화음 위에서 잘림.** 좁은 구간만 보고 "무음 없음"으로 단정 금지(실제 무음을 놓칠 수 있음). 스크립트 `_psych-mvp02-v3-resync.mjs`(API 재호출 0, 기존 mp3 재사용).
- **JSON 출력 대본 생성 시 인용부호 함정 (2026-06-14)**: 모델이 narration 안에 큰따옴표(")로 대사 인용 → JSON 파싱 깨짐. 해결 = 프롬프트에서 "JSON 문자열 값 안 큰따옴표 금지, 인용은 홑낫표 「」 사용" 지시 + 파서에서 「」→"" 복원. raw 응답은 항상 파일 저장(파싱 실패해도 재호출 없이 복구).
- ElevenLabs: 저장된 영구 voice_id == design generated_voice_id (동일). TTS는 voice_id로 호출.

### ChatGPT 웹 이미지 생성 CDP 자동화 (2026-06-13 확립)
- **핵심: 첨부 없는 텍스트 프롬프트는 '이미지 만들기' 도구를 명시 활성화해야 이미지가 나온다.** 안 켜면 텍스트(추론) 응답만 옴 → 이를 "한도/기능없음"으로 오판 금지.
- 활성화 절차: `button[aria-label="파일 추가 및 기타"]` 클릭 → `role=menuitemradio` 중 `이미지 만들기` 클릭 (aria-checked false→true, composer에 칩 표시).
- 프롬프트는 **한 줄로** 전송 (줄바꿈 `\n`은 Enter=조기전송 유발).
- 생성 이미지 src 패턴: **`chatgpt.com/backend-api/estuary/content?id=...`** (구버전 oaiusercontent/blob 아님). naturalWidth>=400 세로 이미지.
- 생성은 30~60초 소요. "생성하고 있습니다" 진행 메시지를 실패로 분류 금지.
- **Scene 1(텍스트→이미지) 자동 생성 성공.**
- **extraction 함정 2가지 (반드시 제외):** ① 새 대화 홈 화면의 프롬프트 갤러리 `oaistatic.com/images-app/*` (888x666 등 41개) ② 첨부 미리보기 `blob:` 이미지. 둘 다 결과 아님. **진짜 결과만 `backend-api/estuary/content?id=` (또는 oaiusercontent), 전송 전 미존재 content-id로 식별.**
- **첨부+편집 방식 = 사건·구도 변화 부족 (사용 중단):** 첨부+편집 1회에서 인물 일관성은 유지됐으나 사건·구도 변화가 부족 → "표정 슬라이드"가 됨. 사용 안 함.
- **✅ 독립 풀 프롬프트 방식 검증 완료 (2026-06-14, MVP02 v2):** 첨부 없이 매 씬 `sharedBiblePromptEN`(인물/의상/장소/조명 고정) + 씬별 `fullPromptEN`(사건/구도 강하게 지정)을 한 줄로 합쳐 '이미지 만들기' 모드로 생성. **5장 모두 1회 성공(한도 0, 거절 0), 씬마다 서로 다른 사건·구도 + 동일 영상 내 인물 일관성 유지 + MVP01과 시각적 중복 없음** 달성. 이게 표준 방식. 스크립트 `_psych-mvp02-v2-gen.mjs`(팩에서 프롬프트 로드 + content-id 신규 식별 + MD5 중복검사, sceneNo 인자로 단일 씬 교정 재생성 지원).
- **콘텐츠 영상마다 새 visualBible 필수:** 이전 영상 인물/의상/장소/구도 재사용 금지. visualBible은 한 영상 내부 일관성용. negativePrompt에 직전 영상 특징(예: cafe, beige knit, low ponytail)을 명시 배제하면 중복 회피 효과 큼.
- 검증 스크립트: `_gpt-image-mode-scene1.mjs`(도구활성+Scene1), `_gpt-scene2-verify.mjs`(결과식별+편집검증), `_gpt-tool-menu-probe.mjs`(메뉴 탐지).
- MVP01 "성공"의 실체: 자동화로 만든 건 Scene 2 1장뿐, Scene 1·3~5는 사용자 수동 생성 (state.json `awaiting_user_generation`).
- Remix API: `POST /v1/text-to-voice/{voice_id}/remix` (영구 voice_id 필요). 저장: `POST /v1/text-to-voice` (voice_name+voice_description+generated_voice_id → voice_id).
- design/remix text는 **100~1000자 필수** (미만이면 호출 전 거부, 크레딧 0 — 짧은 대본은 보강 후 사용).

---

## Gemini 영상 생성(Veo) — 마이크로드라마 포맷 (2026-06-14 확립)

- **포맷 전환 배경**: 정지 이미지 5장 + 내레이션 = "AI 슬롭"으로 보임(사용자 v4.x 전부 반려). 성공하는 AI 릴스는 첫 순간의 시각적 사건·움직임·반응. → AI 마이크로드라마(실제 움직임 영상 클립)로 전환.
- **Gemini 1 프로필에 영상 생성 도구 실재 확인 (화면)**: 입력창 `button[aria-label="업로드 및 도구"]` 클릭 → 메뉴에 **"동영상 — 아이디어 실현하기"**(Gemini Omni/Veo) 항목. "이미지/텍스트/동영상 결합" 지원 = **image-to-video 가능**.
- **진입 절차**: "업로드 및 도구" → "동영상" 클릭 → "동영상 만들기" 안내 다이얼로그 뜨면 **"사용해 보기"** 클릭해 닫음 → 입력창에 `close 동영상` 칩 활성 → `input[type=file]`로 reference 이미지 첨부 → 프롬프트 전송.
- **✅ image-to-video 작동 검증**: scene_01.png 첨부 + 행동 프롬프트 → 10초 영상 생성 성공. 실제 인물 움직임(프레임 PSNR 13.7dB), 얼굴 왜곡 0, 주변 동료 반응 있음, 사건(억지웃음→멈춤) 표현됨.
- **⚠️ 결과 추출 함정**: Veo 영상 src = `contribution.usercontent.google.com/download?c=...` (이미지 estuary와 다름). **`page.evaluate(fetch)`는 CORS/인증으로 TypeError 실패** → 영상 위 **다운로드 버튼**(`button[aria-label*="다운로드"]`)을 playwright `waitForEvent("download")`로 저장해야 함. 생성 성공을 추출 실패로 오판 금지.
- **⚠️ 종횡비 기본 16:9 (가로)**: 프롬프트에 "9:16 vertical" 넣어도 가로(1280×720)로 생성됨. 입력영역 `button[aria-label="가로 모드(16:9)"]` 클릭 → "가로세로 비율" 메뉴 → **"세로 모드(9:16)"** 선택해야 세로. **Veo 생성은 할당량 소모 → 세로 모드 먼저 설정 후 생성**(가로로 만들면 재생성 낭비).
- 산출물: `output/v2/paid_qa/psychology_mvp_02_microdrama_v1/` (scene_01_video.mp4=세로 9:16 합격본 720×1280 10초, audit/probe 스크린샷). 스크립트 `_psych-microdrama-gen.mjs`(세로 생성), `_psych-microdrama-save.mjs`(다운로드 저장), `_psych-gemini-tools.mjs`/`_psych-microdrama-aspect-*.mjs`(도구·종횡비 탐지).
- **⛔⛔ Veo 콘텐츠 정책: 실제 인물 reference에 적대·대립 행동 거부 (2026-06-14, 핵심 차단)**: Scene 1(상황 묘사 "rude remark, faces stiffen, forced smile")은 통과했으나 **Scene 2("snap back" 쏘아붙임 + "rude colleague" 대립)는 "I can't make that type of video"로 거부**. 한도 아님(거부 메시지가 "that type"). **트리거 = 첨부된 실제 인물 이미지 + 적대/갈등 동작(snap back, rude, confront, falter 등) 조합.** 갈등 서사 마이크로드라마를 Veo로 만들 때는 적대 단어를 중립 행동 묘사로 치환 필요(snap back→pause and breathe, rude colleague→the person across). 같은 프롬프트 재시도 금지. **세로 Scene1 1개만 생성 성공, Scene2~5 거부 → 5클립 마이크로드라마 미완성.**
- **⚠️ setInputFiles 파일 대화상자 멈춤**: reference 첨부 시 OS 파일 열기 대화상자가 떠 playwright가 멈추고 Chrome 비정상 종료 발생 가능(Scene2 생성 중 관측). CDP는 살아남으나 OS 대화상자는 CDP/Bash로 못 닫음 → 사용자 수동 닫기 필요.
- **⛔ Scene2 거부 = 적대어 가설 기각 (2026-06-14)**: 중립 프롬프트("AI-generated fictional character, calm, composed", 적대어 0, 텍스트 전용)로도 동일하게 "I can't make that type of video" 거부. → 원인이 적대 행동이 아님. 유력 가설: ① **일일 영상 생성 한도 도달**(Scene1 가로+세로 2개 생성 후 무엇을 보내도 거부) ② "AI-generated character" 문구가 역효과(첫 성공엔 없던 표현) ③ 텍스트→영상의 사람 묘사 정책. **미확정 — 사용자 화면 확인 필요.**
- **⚠️ Chrome 반복 비정상 종료**: CDP playwright 작업 후 Chrome이 반복 크래시("페이지 복원" 배너 반복), 다음 작업 시 CDP ECONNREFUSED. Veo 자동화 신뢰성 낮음.
- **⚠️ 거부 감지 정규식 영어 누락**: gen 스크립트 거부 감지가 한국어 패턴만 있어 영어 "I can't make that type of video"를 못 잡고 백그라운드가 헛돌며 360s 대기. 영어 거부문 패턴 추가 필요(diag/s2-symbolic 스크립트엔 반영됨).
- **✅ 원인 확정: Veo는 '직접적 사회적 대립 행동' 프롬프트를 거부 (2026-06-14, 진단 완료)**: 사람·갈등 없는 안전 영상("커피잔 김")은 **성공** → 한도/세션/도구 기각. **확정 제약 = 프롬프트에 인물 간 대립/무례/갈등(snap back, rude, confront, conflict)이 들어가면 거부.** 인물 영상 자체는 가능(Scene1 상황 묘사, 주인공 단독 행동은 통과). 진단본 `diag_coffee_video.mp4`.
- **✅ 통과 원칙 (2026-06-14)**: ① 상대 인물·무례함·대립·confrontation 언급 금지 ② **주인공 단독 행동·감정 회복만 묘사** ③ 비인물 상징 클로즈업(손/오브젝트)도 통과. Scene2 상징본 `scene_02_symbolic_video.mp4`(720×1280, 손 왜곡 0).
- **마이크로드라마 포맷 운영**: 대립 장면은 직접 묘사 대신 상황 묘사(Scene1식) 또는 주인공 단독 반응으로 표현. 영상 전체는 인물 단독 행동 + 분위기/의상색/공간톤 일관성으로 서사 유지.
- **Gemini 동영상 한도 판정 + 다중 프로필 failover 원칙 (2026-06-14 확정)**:
  - 한도 안내 "동영상 — 한도가 {날짜 시각}에 초기화됩니다"는 **해당 프로필만** cooldown. resetAt을 절대 날짜·KST로 기록하고 now와 비교 → resetAt이 오늘이면 "오늘 불가" 표현 금지(remainingMinutes만).
  - 프로필 상태 = available / cooldown_until / unavailable. **단일 프로필 cooldown 시 다음 allowlisted 프로필로 failover** (Gemini 1→2→3→4, 포트 9223~9226). **전부 unavailable일 때만 blocked 판정.**
  - 한도(명시적 reset/limit 문구) vs 콘텐츠 정책 거부("I can't make that type") 구분 — 화면 실제 문구 읽기 전 추측 확정 금지.
  - 한도 안내가 "업로드 및 도구" 메뉴에 뜨면 입력창을 덮어 클릭 타임아웃 발생 → 한도 신호로 해석(셀렉터 오류 아님). 전송 전 body 텍스트에서 reset 문구 조기 감지.
  - `_psych-microdrama-s345.mjs <3|4|5> --profile <1-4>`로 프로필 선택. 확보 클립: scene_01_video(인물 S1), scene_02_symbolic_video(손/컵 S2).

---

## 최종 대본 생성 분업 원칙 (2026-06-13 확정)

- **초안 보조:** OpenAI (구조/아이디어)
- **최종 대본:** Claude API (심리·관계·성공·마인드 카테고리)
- **확정 전 이미지·TTS 비용 사용 금지** — 대본 사용자 승인 후에만 유료 렌더 진행

---

## render_v2.py 자막 스타일 분리 (2026-06-13)

`_draw_caption(draw, scene, style)` — `referenceStyle`로 자동 분기:

| style | 폰트 | stroke | max_width | base_y | 용도 |
|-------|------|--------|-----------|--------|------|
| `"emotional_story"` | 68 | 4 | 980 | 1680 | 심리/관계 콘텐츠, 얼굴 하단 안전영역 |
| `"default"` | 82 | 6 | 860 | 1300 | living_tips 등 기존 카테고리 |

렌더 호출 시 `plan.referenceStyle == "emotional_story"` 이면 자동 적용. 다른 카테고리는 기존 설정 그대로.

**한 줄 자막 + 카운터 제거 (심리 쇼츠 표준):** plan에 `"captionStyle": "psychology_one_line"`(하단 1550px 안전영역·얼굴 미가림·80→74px 자동 축소로 한 줄 유지) + `"showSceneCounter": false`(1/5 등 카운터 제거, **기본값 True라 명시 안 하면 박힘**) + `topTitle`/`narrationPath` 미지정(상단 텍스트 없음·무음). MVP02 v2 무음 렌더 검증본: `_psych-mvp02-v2-render.mjs`.

---

## ElevenLabs 운영 규칙

- Starter 플랜 결제 완료 (2026-06-13 기준)
- `ALLOW_ELEVENLABS=true` → 호출 → `ALLOW_ELEVENLABS=false` 원복: Claude Code가 전담
- 호출 정확히 1회, 자동 재시도 금지
- 402 응답 시 즉시 중단 보고

---

## env-safe.mjs 플래그 운영 원칙

- `.env.local` 직접 읽기/편집 금지
- `scripts/env-safe.mjs set-flag KEY true|false` 만 허용
- `run-with-env <script>` 로 환경변수 주입 (키 값 출력 없음)
- 유료 API 플래그: 호출 전 true, 성공/실패 무관 finally에서 false 원복

## 3D 시트콤 제작 표준 (Episode 001에서 확립, 2026-06-15)

귀엽고 코믹한 3D 성인 직장인 시트콤. 주인공 "준". 이후 에피소드는 이 규칙을 기본 재사용한다.

### 캐릭터·자산 고정
- 준 외형: 둥근 얼굴·큰 갈색 눈·검은 사이드파트 단발, 하늘색 롤업 셔츠 + 빨간 느슨한 넥타이 + **긴 네이비 슬랙스**(반바지 폐기) + 검은 구두 + 대각선 단일끈 갈색 메신저백. (반바지본은 내부검증용, 게시 1화는 슬랙스본 v031)
- 세트: 사무실 큐비클·책상·모니터·파티션·따뜻한 야간 조명. 시계는 **에피소드 내 시각 고정**(1화 6:00).
- 음성: 준=Hyun, 동료/단역=Onyu(ElevenLabs). voiceId·세팅은 LOG 2026-06-15 참조. Visual Bible: `docs/3d-sitcom-visual-bible.md`.

### 구성·연출 규칙
- 길이 약 20초, **3장면 이하**. 각 장면은 Veo 10s 클립에서 동작 완결 구간 발췌.
- 대사와 행동을 **동시** 진행. 무의미한 무대사 구간 금지.
- 무음 상태에서 행동이 이해돼야 함 → **무음본 전달력 확인 후 TTS 진행**.
- 신규 인물은 **얼굴 없이 손·팔·목소리만** 등장 가능(연속성·생성난이도↓).
- 시계·소품·배경 연속성은 **생성 전 사전 확정**. 불일치 시 키프레임 AI 이미지 편집으로 교정(평면 SVG 오버레이는 3D 각도 불일치로 FAIL).
- 다음 장면 reference로 **인접 성공 키프레임**을 사용(모델시트 첨부는 재생산되어 FAIL 사례 있음).

### 편집·자막·오디오 표준
- 컷은 시간이 아니라 **동작이 끝나는 프레임** 기준.
- 자막: 문장 균등분할 금지. **TTS 원본 silencedetect로 구절 발화 시작/종료 측정 → ±0.1s 동기.** 선표시·잔류 금지. 한 화면 최대 2줄.
- 자막 디자인: **Black Han Sans 76px, 전부 흰색, 검은 외곽선 6px**(내부 비침범), 노란 강조·이탤릭 금지. 하단 안전영역(MarginV~300), 시계·얼굴·소품 비가림.
- 효과음: 실제 행동과 동기, **체감 명확**하게(너무 낮추면 FAIL). 대사 겹침 구간은 sidechain ducking으로 대사 보존. 최종 -1dBTP 이하, 클리핑 금지, 음악 미추가(현 단계). 음원: Pixabay 공식 Download(Chrome CDP, 봇차단 우회 금지).
- **기술 QA(해상도/싱크/클리핑)와 Owner 체감 QA(재미/가독성/효과음 존재감)를 분리**해서 검수.
- Veo 워터마크는 게시 단계 제약으로 보존(제거·가림 금지).
