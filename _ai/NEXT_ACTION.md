# Next Action

## Recommended next task

audio recovery C-lite 실행: Jun/Boss TTS 재생성 + SFX/BGM 로컬 설계

## Current status

- final_v1 technical QA: pass
- final_v1 Owner QA: fail
- Root causes: emotionless TTS, Boss tone mismatch, long silence, weak punchline setup
- Existing video assets are usable

## Codex decision

Claude Code suggested B first (Jun only), but Codex recommends C-lite.

Reason:
- Owner explicitly flagged both Jun and Boss performance.
- Boss line is central to the punchline.
- Jun-only regeneration would likely leave the core S5 failure unresolved.
- Harry Kim is not recommended due prior Korean voice rejection in project knowledge.

## Required approval

ALLOW_ELEVENLABS=true, Audio recovery TTS 2회 승인

## Scope after approval

- Jun/Hyun emotional TTS regeneration: 1 call
- Boss/Theo boss-like TTS regeneration: 1 call
- Offset v3: move J6 to S3 around 15.50s
- SFX/BGM plan with local/free sources only
- final_v2 candidate generation

## Forbidden

- Approval before ElevenLabs calls required
- More than 2 TTS calls forbidden
- Gemini/Veo submission forbidden
- ChatGPT image submission forbidden
- paid SFX/BGM purchase forbidden
- push/merge/reset/clean forbidden

## Quality target

- Jun expresses anxiety, relief, confusion, irritation, collapse
- Boss sounds middle-aged, slow, subtly pressuring, not smooth/romantic
- S3/S4 silence filled with comic copier rhythm/SFX
- Boss to Jun punchline lands without needing viewer to read the script separately

