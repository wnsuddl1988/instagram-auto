# Handoff Now

## Task status

final_v1 owner QA fail — audio recovery approval gate

## Task goal

Owner 승인 후 Jun/Boss TTS를 감정 연기 중심으로 재생성하고, SFX/BGM 로컬 레이어를 추가해 final_v2 후보를 만든다.

## Codex decision

B안(Jun만 재생성)은 이번 실패 원인을 충분히 해결하지 못한다. Boss 톤도 핵심 실패였으므로 C-lite를 권장한다.

## Approval gate

실제 ElevenLabs 호출은 Owner가 아래 문구를 명시한 경우에만 가능하다.

ALLOW_ELEVENLABS=true, Audio recovery TTS 2회 승인

## Approved scope after approval

- Jun/Hyun TTS 재생성 1회
- Boss/Theo TTS 재생성 1회
- Offset v3 적용
- 로컬/무료 SFX 또는 BGM 설계 및 mux
- final_v2 생성 및 QA
- _ai/CLAUDE_REPORT.md, _ai/PROJECT_STATE.md 갱신

## Voice direction

### Jun

- 복사기를 달래는 척하지만 초조함
- 안도는 짧고 바로 의심으로 전환
- 짜증, 체념, 탈력 반박이 억양에 드러나야 함
- 단일톤 낭독 금지

Suggested settings:
- stability 0.30
- similarity 0.75
- style 0.25
- speaker_boost true
- speed 0.85

### Boss

- 너무 좋은 목소리/고막남친 톤 금지
- 중후하고 느린 부장님 톤
- 웃고 있지만 은근히 눈치 주는 말투
- 과장된 악역은 금지

Use Theo first:
- voice_id CxErO97xpQgQXYmapDKX
- stability 0.75
- similarity 0.85
- style 0.03
- speaker_boost true
- speed 0.82

Harry Kim is not preferred because previous Korean voice QA rejected it.

## Offset v3

- J1 0.20
- J2 2.63
- J3 6.20
- J4 8.67
- J5 10.13
- J6 15.50
- Boss 30.00
- J7 32.55

## SFX/BGM

- Use local/free sources only
- Button click, error beep, paper rustle, copier motor, output rhythm
- Fill S3/S4 with comic copier rhythm
- Duck SFX/BGM under dialogue by about -8 to -12dB
- Keep Boss line and J7 punchline clear

## Forbidden

- More than 2 ElevenLabs calls forbidden
- Automatic regeneration forbidden
- Gemini/Veo submission forbidden
- ChatGPT image submission forbidden
- paid SFX/BGM purchase forbidden
- push/merge/reset/clean forbidden

## Required final handoff

## Codex에 붙여넣을 인수인계사항

- TTS calls count
- Jun/Boss new files and durations
- SFX/BGM sources and license status
- final_v2 path, MD5, tech QA
- emotion/timing QA
- remaining risks
- changed files
- git status

