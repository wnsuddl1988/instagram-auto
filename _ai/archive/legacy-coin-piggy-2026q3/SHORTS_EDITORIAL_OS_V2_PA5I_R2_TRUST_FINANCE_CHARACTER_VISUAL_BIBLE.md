# Shorts Editorial OS V2 — PA-5I-R2 Trust Finance Character Visual Bible

Status: `LOCKED_PRODUCTION_AUTHORITY`  
Geometry Master: `PA5H_R2_PEBBLE_BUDDY` (immutable)  
Geometry fingerprint: `ad3b346a5c0eab6a6c4308582fb9a42317b2e4253756aa6968252b9d1c53a8dc`

## Permanent visual authority

| Element | Authority |
| --- | --- |
| BODY_MAIN | `#35449B` deep calm indigo; primary body, arms, hands, legs |
| BODY_SECONDARY | `#4858AB` restrained blue-indigo; feet only |
| ACCENT_TEAL | `#4AAEAA`; reserved for information/confirmation/data graphics, not character decoration |
| EYE_OUTER | `#E8ECED` cool off-white |
| EYE_INNER | `#24466A` deep desaturated blue; immutable current eye geometry provides one unified iris/pupil surface |
| PUPIL | `#10182A` designated future color only; no separate pupil surface may be added while geometry is locked |
| CATCHLIGHT | `#DCE3E5`; one existing restrained highlight per eye |
| BROW | `#1B2A49` deep navy |
| MOUTH | `#182541` deep blue-charcoal |

## Material strategy

- Blender-native Principled BSDF only; metallic `0`.
- Body roughness `0.52`; body secondary `0.54`; face materials `0.50–0.54`; ground `0.58`.
- Specular/IOR level is restrained medium-low (`0.16–0.28` where exposed by Blender 4.5), producing soft satin-matte volume without glossy plastic.
- FACE_PANEL remains `NONE`. The face is visually integrated into the body; no mask treatment, texture, gradient, or image texture is authorized.

## Allowed and forbidden use

- Allowed: teal in editorial chart/data/confirmation UI; small scene-appropriate information accents outside the character.
- Forbidden: teal hand/thumb decoration, chest logo/emblem, gold on Character Master V1, finance icons, money symbols, neon blue, bright royal blue, purple toy styling, bright pink/red mouth, anime iris rings, multiple catchlights, metallic body, and glossy toy treatment.

## Shorts screen-scale guidance

- Light editorial background: approximately `25%` frame width; use as a supporting corner/side character beside primary information.
- Dark editorial background: approximately `40%` frame width; retain a clear blue body edge and keep titles/data visually primary.
- Chart-heavy background: approximately `35%` frame width; position away from chart/number zones and use teal for data, not mascot decoration.
- QA checks: face/eye readability, body separation, restrained teal visibility, and content non-interference. These are static layout checks, not video or animation authority.

## Non-authorizations

Rigging, armature, expression implementation, animation, video, TTS, external generation, paid calls, commit, push, and PA-6A remain not authorized. This file becomes the Character Visual Master authority only after explicit Owner lock.
