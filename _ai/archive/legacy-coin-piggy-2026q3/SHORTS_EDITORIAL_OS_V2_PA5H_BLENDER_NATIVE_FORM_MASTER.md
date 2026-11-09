# PA-5H Blender-Native Character Form Master

Status: `PA5H_COMPLETE`; `FORM_B_PEBBLE_BUDDY` selected and refined in PA-5H-R1. Refined B is `AWAITING_OWNER_REFINED_FORM_REVIEW`; A and C remain historical form explorations only.

## Shared constraints

- Geometry is restricted to UV spheres, cylinders/capsules, beveled cubes, and simple beveled curves.
- All forms use the same neutral clay material family, studio ground, EEVEE lighting, camera distances, focal length, and three still views.
- No texture maps, sculpting, displacement, booleans, geometry nodes, external meshes, armature, animation, video, AI generation, or paid calls.

## FORM_A_CAPSULE_GUIDE

| Field | Definition |
| --- | --- |
| OBJECT_LIST | `A_BODY_CORE`, `A_FACE_PANEL`, two eyes, two brow curves, mouth curve, three head details, two capsule arms/hands, two capsule legs/shoes |
| PRIMITIVE_TYPE | vertically scaled UV-sphere body; shallow beveled-cube face panel; UV-sphere eyes/hands/shoes; cylinder-plus-sphere capsules; beveled curves |
| RELATIVE_DIMENSIONS | body width `1.00`, height `1.34`; face width `0.70`, height `0.40`; three identity capsules above the body |
| FACE_STRUCTURE | shallow embedded visual panel with direct simple eyes, brows, and smile |
| LIMB_STRUCTURE | mid/lower body capsule attachments, separate mitten hands, short separated legs |
| FUTURE_RIG_NOTES | simplest single-body root; clear shoulder and hip zones; three head details can be limited secondary bones later |
| FUTURE_EXPRESSION_NOTES | stable panel supports eye target, brow, lid, and mouth-shape work |
| EXPECTED_MODELING_COMPLEXITY | Low |
| EXPECTED_RIG_COMPLEXITY | Low-Medium |
| KEY_ADVANTAGE | maximum component simplicity with a dedicated expression surface |
| KEY_RISK | panel can read as a screen if facial materials become too graphic |

## FORM_B_PEBBLE_BUDDY

| Field | Definition |
| --- | --- |
| OBJECT_LIST | `B_BODY_CORE`, direct two eyes, two brow curves, mouth curve, two capsule arms/hands, two capsule legs/feet |
| PRIMITIVE_TYPE | one wide UV-sphere body; UV-sphere face features/hands/feet; cylinder-plus-sphere capsules; beveled curves |
| RELATIVE_DIMENSIONS | body width `1.25`, height `1.00`; no face panel or head detail |
| FACE_STRUCTURE | features sit directly on the rounded body surface |
| LIMB_STRUCTURE | wide low arm attachment, short legs, rounded feet |
| FUTURE_RIG_NOTES | fewest components; straightforward shoulder and hip sockets but limited long-gesture range |
| FUTURE_EXPRESSION_NOTES | direct face surface is simple but has less isolated space for broad mouth/lid variation |
| EXPECTED_MODELING_COMPLEXITY | Lowest |
| EXPECTED_RIG_COMPLEXITY | Low |
| KEY_ADVANTAGE | approachable broad silhouette with minimal deterministic geometry |
| KEY_RISK | low face height may reduce gaze and expression readability in vertical Shorts framing |

## FORM_C_LITTLE_SCOUT

| Field | Definition |
| --- | --- |
| OBJECT_LIST | `C_HEAD`, `C_TORSO`, two eyes, two brow curves, mouth curve, one head nub, two capsule arms/hands, two capsule legs/shoes |
| PRIMITIVE_TYPE | separate UV-sphere head and torso; UV-sphere face features/hands/shoes; cylinder-plus-sphere capsules; beveled curves |
| RELATIVE_DIMENSIONS | head is approximately `53%` of visual height; torso is approximately `67%` of head width |
| FACE_STRUCTURE | direct face on a large separate rounded head |
| LIMB_STRUCTURE | torso-mounted short capsules and separate mittens/shoes |
| FUTURE_RIG_NOTES | separate head and torso make head aim, torso lean, hand sockets, and gaze isolation clear |
| FUTURE_EXPRESSION_NOTES | largest clean facial surface for eyes, brows, lids, gaze, and mouth shapes |
| EXPECTED_MODELING_COMPLEXITY | Low-Medium |
| EXPECTED_RIG_COMPLEXITY | Medium |
| KEY_ADVANTAGE | strongest potential for readable face acting and gaze |
| KEY_RISK | head/body seam needs deliberate material and deformation handling after form selection |

## PA5H_FORM_B_ORIGINAL vs PA5H_R1_FORM_B_REFINED

| Field | Original B | R1 refined B |
| --- | --- | --- |
| BODY_CORE | wide simple UV-sphere ellipsoid | one UV sphere with deterministic proportional vertex scaling only: fuller upper/middle, narrower underside, slight upper-contour asymmetry |
| FACE_STRUCTURE | direct face; no panel | direct face; no panel |
| EYES | shallow dark ellipsoids | larger shallow dark ellipsoids, modestly above face midpoint for gaze readability |
| ARMS / HANDS | short capsules with small spheres | longer capsules attached above body midpoint; readable mitten palm with a single simple thumb mass |
| LEGS / FEET | short capsules and small rounded feet | separated capsules and wider, forward-extending one-piece rounded feet |
| HEAD DETAIL / BRANDING | none | none |
| FUTURE RIG NOTES | low baseline complexity | shoulder clearance, arm raise, pointing, phone hold, two-hand comparison, body lean/turn, weight shift, gaze, blink, and face expression assessed without an armature |
| KEY RISK | generic ball silhouette | avoid further form complexity or a return to a screen/panel identity |

## PA5H_R2_FINAL_B

- `R2_BODY_CORE`: same simple UV-sphere topology, with deterministic proportional edits only; fuller upper/middle, modest lower taper, reduced depth, and restrained upper contour asymmetry.
- Direct face remains panel-free. Eye outer/pupil/highlight are simple shallow ellipsoids created before both clay and color renders.
- Clay and provisional-color geometry fingerprints are identical; color is a non-final channel-fit preview only.
