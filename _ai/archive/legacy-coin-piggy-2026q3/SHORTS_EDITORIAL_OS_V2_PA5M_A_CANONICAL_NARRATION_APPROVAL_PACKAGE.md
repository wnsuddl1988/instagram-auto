# Shorts Editorial OS V2 — PA-5M-A Scene 01 Canonical Narration Approval Package

Status: `OWNER_APPROVAL_REQUIRED_BEFORE_ANY_TTS_SCOPE`

## Scope result

This is a read/trace approval package only. No TTS, audio generation, external or paid call, Blender change, render, mux, caption retime, commit, push, deploy, or publish occurred.

```text
SCENE_ID:
selected-angle:revolving-balance-not-erased:scene:01

SCENE_TOPIC:
카드값 일부 납부 뒤에도 남은 금액은 다음 달로 이월될 수 있으므로, 연체 여부만으로 잔액이 없다고 판단하면 안 된다는 문제 제기.

CANONICAL_NARRATION_STATUS:
FOUND

CANONICAL_NARRATION_TEXT:
카드값 일부만 냈는데 연체가 아니라고요? 안심하기 전에, 다음 달로 넘어간 금액부터 확인해야 합니다.

CANONICAL_SOURCE_FILE:
C:\Users\PC\AppData\Local\ShortsEditorialOSV2\projects\shorts-editorial-os-v2-20-pilot-8e9ba35c13b4\snapshot.json

CANONICAL_SOURCE_LOCATION:
approvedCheckpoints[checkpointId=scene_planning-4109dd3e4abad178].payload.sceneCards[sceneId=selected-angle:revolving-balance-not-erased:scene:01].narration

NARRATION_ID_OR_VERSION:
projectId=shorts-editorial-os-v2-20-pilot-8e9ba35c13b4; projectRevision=6; approvedScriptIdentity=ce8aa83693519f869ef9754daeab5e4d08bdc801e80cbad554bb4f6b12fa58d0; scene-planning approval=2026-08-09T00:46:30.850Z

EVIDENCE / CLAIM PROVENANCE:
claim:revolving-mechanic
- fsc-2024-revolving-talk — 금융위원회, "할부 결제와 달라요! 리볼빙 서비스 이용 주의", 2024-08-27
- fsc-2022-revolving-policy — 금융위원회, "신용카드 결제성 리볼빙 서비스 개선방안", 2022-08-24

CURRENT_VISUAL_DURATION:
6.4s

ESTIMATED_SPOKEN_DURATION:
8.148s (snapshot voice-plan estimate only; no provider call or audio playback)

DURATION_COMPATIBILITY:
LIKELY_TOO_LONG (estimated narration is 1.748s longer than the current 6.4s locked visual)

VOICE_SETTINGS_TO_USE_AFTER_OWNER_APPROVAL:
voice identity: Juno / Yohan Koo
voice ID: 4JJwo477JUAx3HV0T7n7
model: eleven_multilingual_v2
output: mp3_44100_128
preset: korean_confident_director_v2
stability: 0.68
similarity: 0.90
style: 0.22
speaker boost: ON

PROPOSED_DISPLAY_CAPTION_SEGMENTS:
1. 카드값 일부만 냈는데\n연체가 아니라고요?
2. 안심하기 전에,\n다음 달로 넘어간 금액부터
3. 확인해야 합니다.

SUBTITLE_CONSTRAINT:
Maximum two visible lines per event. These are display-only reflows of the canonical narration; no timing or rendering change is authorized in PA-5M-A.

TTS_GENERATION_CALLS:
0

EXTERNAL_PAID_CALLS:
0
```

## Authority resolution

- The persisted current project checkpoint is the authority for the exact text above. Its Scene 01 card carries the same approved script identity as the editorial-intelligence checkpoint.
- `_ai/SHORTS_EDITORIAL_OS_V2_PA5B2_EDITORIAL_STORYBOARD_AND_MOTION_BIBLE.md` independently labels this sentence `VOICEOVER_CURRENT` and labels its alternate sentence as `VOICEOVER_PROPOSED`; the proposed text was not selected.
- Existing visual captions and ASS files were not used to infer the narration.

## Existing-audio prerequisite status

Read-only metadata inspection of the persisted project audio store found one Scene 01 MP3 sidecar (`sceneOrder=1`, `durationMs=6780`) but marks `productionVoiceQualityApproved=false`. It is therefore not an Owner-approved reusable PA-5M audio asset. No audio file was played, copied, changed, or used.

## Stop gate

PA-5M-A ends here. Owner / ChatGPT Control Tower must approve the exact narration and any separate paid-TTS scope before PA-5M can generate, reuse, mux, or retime anything.
