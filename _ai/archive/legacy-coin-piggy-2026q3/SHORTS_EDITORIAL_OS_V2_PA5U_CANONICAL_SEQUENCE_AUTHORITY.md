# Shorts Editorial OS V2 — PA-5U Canonical Sequence Authority

Status: `IMPLEMENTATION_COMPLETE_AWAITING_CLAUDE_READ_ONLY_REVIEW`  
Date: 2026-08-13 KST  
Project revision context: persisted revision `6`  
Repository decision HEAD: `a12dcf6077635c40858edfee1f0131ab9d623571`

## Decision

`REVISION_6_PERSISTED_CANONICAL_RETAINED`

The Control Tower resolved the post-PA-5T-R1 conflict by retaining the persisted revision-6 approved project artifacts as canonical. The source hierarchy for this decision is:

1. `C:\Users\PC\AppData\Local\ShortsEditorialOSV2\projects\shorts-editorial-os-v2-20-pilot-8e9ba35c13b4\snapshot.json` — `approvedCheckpoints[checkpointId=scene_planning-4109dd3e4abad178].payload.sceneCards`.
2. `_ai/SHORTS_EDITORIAL_OS_V2_PA5B2_EDITORIAL_STORYBOARD_AND_MOTION_BIBLE.md` — Scene 02 at lines 151–188, Scene 03 at lines 190–228, and Scene 04 at lines 231–267.
3. `_ai/SHORTS_EDITORIAL_OS_V2_PA5B3_CHARACTER_ASSET_AND_VISUAL_PROMPT_PACK.md` — Scene 02 at lines 148–158, Scene 03 at lines 160–170, and Scene 04 at lines 172–182.

## Discovered conflict and resolution

PA-5T-R1 stated that Scene 03 should become the `100만 원 → 20만 원 결제 → 80만 원 이월` numerical-understanding scene and that Scene 04 should add the new-usage/fee burden. That order conflicts with every persisted revision-6 source above.

`PA5T_R1_STATUS: SUPERSEDED_BY_PERSISTED_CANONICAL_AUTHORITY`

PA-5T-R1 was a handoff-level interpretation correction only. It neither changed the revision-6 checkpoint nor supplied a replacement approved script identity, evidence identity, or persisted scene-card authority. It must therefore not be promoted into repository canonical state.

## Retained canonical sequence

- Scene 02: `selected-angle:revolving-balance-not-erased:scene:02` — introduce `일부결제금액이월약정`; show a partial payment leaving the remainder to the next billing cycle.
- Scene 03: `selected-angle:revolving-balance-not-erased:scene:03` — the carried balance receives the existing canonical fee/burden layer; avoiding delinquency does not erase the obligation.
- Scene 04: `selected-angle:revolving-balance-not-erased:scene:04` — canonical numerical-understanding scene: `100만 원 → 20만 원 결제 → 80만 원 이월`, followed only by the canonically qualified possible next-month overlap context.

Revision-6, PA5B2, and PA5B3 were inspected as read-only evidence and were not modified by PA-5U.

## Next production gate

PA-5U does not authorize Scene 02 implementation, local rendering, ffmpeg assembly, TTS, external generation, commit, push, deploy, or publish. The next Slice must receive a separate exact PA-5V production allowlist. Its Scene 02 outgoing continuity must enter the retained Scene 03 fee/burden role, not the Scene 04 numeric split.
