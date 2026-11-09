# Shorts Editorial OS V2 — PA-5B3 Character Asset Architecture + 8-Scene Visual Director Prompt Pack

**Status:** `DESIGN_PROMPT_ASSET_PLANNING_ONLY`
**Execution record:** image generation 0; TTS 0; video/render 0; external paid API 0; publish 0; push 0.

## A. Production Authority

- **Primary authority:** `_ai/SHORTS_EDITORIAL_OS_V2_PA5B2_EDITORIAL_STORYBOARD_AND_MOTION_BIBLE.md`, Owner-approved production direction. This document operationalizes it; it does not reinterpret or replace it.
- **Canonical project / revision:** `shorts-editorial-os-v2-20-pilot-8e9ba35c13b4` / revision 6.
- **Topic:** `카드 리볼빙, 20%만 내면 끝일까?` / `revolving-balance-not-erased`.
- **Creative order:** story and information → strongest visual evidence → character performance → decoration.
- **Character role:** the viewer's proxy: notices, reacts, investigates, compares, understands, and resolves. It is supportive, not the spectacle.
- **Historical boundary:** `moa_archive_sprite` remains immutable comparison-only historical evidence. It is neither the production protagonist nor an input to this pack.
- **Media evidence status:** `INDEX_ONLY` for the Owner-selected master: the identity contract is approved, but no local master-image file is claimed present by this planning document.

## B. Character Master Contract

**Identity ID:** `OWNER_SELECTED_CHARACTER_MASTER`
**Reference role:** `CHARACTER_MASTER_REFERENCE`

| Locked identity | Contract |
| --- | --- |
| Silhouette / proportion | Rounded blue-purple body; preserve the same width-to-height ratio and simple limb scale. |
| Face | Same cyan face-panel geometry; same large-eye size, spacing, location, eyebrow language, and mouth language. |
| Top feature | Exactly three aqua droplet-like tufts. |
| Body details | Same wrist/ankle accents, sneaker-like shoes, front bar-chart motif, and shield/check motif. |
| Finish / style | Clean, friendly, soft matte/plastic 3D cartoon; not photorealistic and not anime. |
| Allowed scene variables | Pose, gaze, expression, hand position, one context-appropriate prop, camera, lighting, and background. |
| Never change | Identity, body geometry, palette, face construction, tuft count, motif placement, footwear silhouette, and base 3D style. |

**PA-5B4 reference strategy:** bind the Owner-selected image as `CHARACTER_MASTER_REFERENCE` before any future request. When the image workflow supports image reference, every character-containing request must include it at high identity strength; text-only prompting is prohibited in that capable workflow. The reference governs identity, while the request governs only approved scene variables. A new master is not generated in PA-5B3 or PA-5B4.

## C. Character Continuity Prompt Block

> Use `CHARACTER_MASTER_REFERENCE` as the identity authority. Preserve exactly the reference character: rounded blue/purple body with its fixed width-height ratio; cyan face panel with identical dimensions; large eyes in the same positions and scale; the same eyebrow and mouth design; exactly three aqua droplet-like top tufts; the same blue/purple body palette and cyan face palette; wrist and ankle accents; sneaker-like shoe silhouette; front bar-chart motif; shield/check motif; and clean friendly soft-matte 3D-cartoon material/rendering. Change only the requested pose, gaze, expression, approved hand gesture, camera, lighting, or single named prop. Keep the character readable and secondary to the information, with clean overlay space. Do not redesign it; add accessories, hats, bags, capes, armor, clothes, antennae, extra robot parts, or extra/fewer tufts; alter its palette, eyes, face panel, proportions, shoes, motifs, or material style; transform it to photorealism or anime; turn it into money, a banknote, or a coin; imitate a benchmark character; include logos, readable text, numbers, charts, watermarks, malformed hands/faces, or extra fingers.

## D. 28-Asset Architecture

`MASTER_REFERENCE_REQUIRED: YES` means the master must be attached when the future asset is generated. `NEEDS_NEW_IMAGE_GENERATION: YES` is a PA-5B4 request only, never an instruction to generate now.

| ASSET_ID | ASSET_NAME | CATEGORY | PURPOSE | VIEW_ANGLE | BODY_ORIENTATION | FACE_EXPRESSION | EYE_DIRECTION | ARM_POSITION | HAND_GESTURE | LEG_POSITION | PROP | PROP_HAND | SCREEN_SPACE_USE | SCENES_USED_IN | CAN_REUSE | NEEDS_NEW_IMAGE_GENERATION | MASTER_REFERENCE_REQUIRED | PRIORITY |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CHAR_MASTER_REF_01 | Owner master reference | A MASTER_REFERENCE | Identity authority | approved reference | reference | neutral/light smile | reference | reference | reference | reference | none | none | all character scenes | 01–08 | YES | NO | NO | P0 |
| CHAR_BASE_LEFT3Q_01 | left three-quarter neutral | B REUSABLE_BASE_ASSET | S1 entry / reusable anchor | left 3/4 | left | light neutral | frame-right | relaxed | open | planted | none | none | 25–45% | 01, 03, 08 | YES | YES | YES | P0 |
| CHAR_BASE_RIGHT3Q_01 | right three-quarter neutral | B REUSABLE_BASE_ASSET | desk / viewer handoff | right 3/4 | right | neutral | frame-left | relaxed | open | planted | none | none | 25–40% | 02, 04, 06, 07 | YES | YES | YES | P0 |
| CHAR_BASE_SIDE_01 | side neutral | B REUSABLE_BASE_ASSET | object inspection | side | right-facing | focused neutral | down/right | close to body | ready | planted | none | none | 20–30% | 02, 04, 06, 08 | YES | YES | YES | P0 |
| CHAR_BASE_BACK_01 | back three-quarter neutral | B REUSABLE_BASE_ASSET | route comparison entrance | back 3/4 | away / slight left | not visible | route-forward | relaxed | none | walking-ready | none | none | 20–30% | 05 | YES | YES | YES | P0 |
| CHAR_EXPR_CURIOUS_01 | curious face state | C REUSABLE_EXPRESSION_VARIANT | mechanism discovery | 3/4 compatible | neutral | curious | tracking object | relaxed | none | planted | none | none | 25–35% | 01, 02 | YES | YES | YES | P0 |
| CHAR_EXPR_SURPRISED_01 | surprised face state | C REUSABLE_EXPRESSION_VARIANT | hook notice | 3/4 compatible | turn-ready | surprised | envelope/calendar | half-raised | pause | planted | none | none | 35–50% | 01 | YES | YES | YES | P0 |
| CHAR_EXPR_WORRIED_01 | worried face state | C REUSABLE_EXPRESSION_VARIANT | fee / repeated path | front 3/4 | neutral | worried | evidence | open | caution | planted | none | none | 25–40% | 03, 05 | YES | YES | YES | P0 |
| CHAR_EXPR_CONFUSED_01 | confused face state | C REUSABLE_EXPRESSION_VARIANT | contrast uncertainty | front 3/4 | centered | confused | alternate routes | one arm raised | small shrug | planted | none | none | 25–35% | 05 | YES | YES | YES | P1 |
| CHAR_EXPR_REALIZATION_01 | realization face state | C REUSABLE_EXPRESSION_VARIANT | evidence / check discovery | right 3/4 | right | realization | overlay center | one arm forward | small point | planted | none | none | 20–30% | 04, 06, 07 | YES | YES | YES | P0 |
| CHAR_EXPR_CONFIDENT_01 | calm confident face state | C REUSABLE_EXPRESSION_VARIANT | practical resolution | front 3/4 | viewer-facing | modest confidence | viewer | open | explain | planted | none | none | 25–40% | 07, 08 | YES | YES | YES | P0 |
| CHAR_POSE_POINT_LEFT_01 | point left | D REUSABLE_POSE_VARIANT | finite-route comparison | front 3/4 | center-left | thoughtful | frame-left | left extended | point | planted | none | none | 20–30% | 05 | YES | YES | YES | P1 |
| CHAR_POSE_POINT_RIGHT_01 | point right | D REUSABLE_POSE_VARIANT | carry / check destination | right 3/4 | right | realization | frame-right | right extended | point | planted | none | none | 20–30% | 02, 06 | YES | YES | YES | P1 |
| CHAR_POSE_OPEN_EXPLAIN_01 | open-hand explain | D REUSABLE_POSE_VARIANT | caution / close | front 3/4 | viewer-facing | clear | viewer/overlay | both open | pause/explain | planted | none | none | 25–40% | 01, 03, 08 | YES | YES | YES | P1 |
| CHAR_POSE_THINK_NUMBER_01 | thinking / look-at-number | D REUSABLE_POSE_VARIANT | official split observation | side 3/4 | evidence-facing | focused | renderer number zone | one near chin | think | planted | none | none | 15–25% | 04, 05 | YES | YES | YES | P1 |
| CHAR_PROP_PHONE_01 | check smartphone | E PROP_INTERACTION_VARIANT | S1 payment notice | left 3/4 | left | light relief | phone | bent | hold phone | planted | blank smartphone | right | 35–45% | 01 | YES | YES | YES | P1 |
| CHAR_PROP_BILL_01 | inspect blank statement | E PROP_INTERACTION_VARIANT | statement verification | side 3/4 | right | focused | statement | bent | trace blank area | planted | unreadable statement | left | 20–30% | 06, 08 | YES | YES | YES | P1 |
| CHAR_PROP_LAPTOP_01 | inspect generic laptop | E PROP_INTERACTION_VARIANT | second verification destination | right 3/4 | right | realization | laptop | one toward laptop | indicate | planted | blank laptop | right | 20–30% | 06 | YES | YES | YES | P1 |
| CHAR_PROP_NOTEBOOK_01 | plan with card put-away | E PROP_INTERACTION_VARIANT | concrete action plan | right/front 3/4 | right | calm confidence | notebook | one lowering card, one open | check | planted | blank notebook/card/tray | right | 25–35% | 07 | YES | YES | YES | P1 |
| RENDER_PLACE_LEFT_01 | left placement | G RENDERER_DERIVED_NO_NEW_IMAGE_REQUIRED | composition | n/a | n/a | inherited | inherited | inherited | inherited | inherited | none | n/a | left 25–40% | 01–08 | YES | NO | NO | P2 |
| RENDER_PLACE_RIGHT_01 | right placement | G RENDERER_DERIVED_NO_NEW_IMAGE_REQUIRED | composition | n/a | n/a | inherited | inherited | inherited | inherited | inherited | none | n/a | right 25–40% | 01–08 | YES | NO | NO | P2 |
| RENDER_SCALE_25_01 | evidence scale | G RENDERER_DERIVED_NO_NEW_IMAGE_REQUIRED | chart-heavy scale | n/a | n/a | inherited | inherited | inherited | inherited | inherited | none | n/a | 15–25% | 04 | YES | NO | NO | P2 |
| RENDER_SCALE_40_01 | narrative scale | G RENDERER_DERIVED_NO_NEW_IMAGE_REQUIRED | normal scale | n/a | n/a | inherited | inherited | inherited | inherited | inherited | none | n/a | 25–40% | 01–08 | YES | NO | NO | P2 |
| RENDER_SCALE_55_01 | reaction scale | G RENDERER_DERIVED_NO_NEW_IMAGE_REQUIRED | hook reaction | n/a | n/a | inherited | inherited | inherited | inherited | inherited | none | n/a | 40–55% | 01 | YES | NO | NO | P2 |
| RENDER_IDLE_BOB_01 | subtle idle bob | G RENDERER_DERIVED_NO_NEW_IMAGE_REQUIRED | alive hold | n/a | n/a | inherited | inherited | inherited | inherited | inherited | none | n/a | any | 01–08 | YES | NO | NO | P2 |
| RENDER_CAMERA_CROP_01 | crop / push | G RENDERER_DERIVED_NO_NEW_IMAGE_REQUIRED | reframe | n/a | n/a | inherited | inherited | inherited | inherited | inherited | none | n/a | any | 01–08 | YES | NO | NO | P2 |
| RENDER_ZORDER_01 | evidence foreground order | G RENDERER_DERIVED_NO_NEW_IMAGE_REQUIRED | evidence priority | n/a | n/a | inherited | inherited | inherited | inherited | inherited | none | n/a | behind graphics | 01–08 | YES | NO | NO | P2 |
| RENDER_SLIDE_MATCH_01 | slide / match transition | G RENDERER_DERIVED_NO_NEW_IMAGE_REQUIRED | continuity | n/a | n/a | inherited | inherited | inherited | inherited | inherited | none | n/a | transition only | 01–08 | YES | NO | NO | P2 |

### PA-5B2 capability-to-ID crosswalk

PA-5B2's `5 + 7 + 8 + 8` is the approved **capability library**, not a requirement that every capability become a separate paid image file. The following is the execution-level crosswalk. It preserves every named PA-5B2 capability while using an approved master reference and renderer composition to avoid duplicate generations; it does not change the character or add a new production direction.

| PA-5B2 family / capability | PA-5B3 executable ID(s) | Coverage rule |
| --- | --- | --- |
| Orientation: front | `CHAR_MASTER_REF_01`, `CHAR_EXPR_CONFIDENT_01` | master reference governs identity; confident front/3/4 frame is the usable direct-to-viewer state. |
| Orientation: left 3/4 / right 3/4 / side / back | `CHAR_BASE_LEFT3Q_01` / `CHAR_BASE_RIGHT3Q_01` / `CHAR_BASE_SIDE_01` / `CHAR_BASE_BACK_01` | direct one-to-one base coverage. |
| Expression: neutral/light smile | `CHAR_MASTER_REF_01`, `CHAR_EXPR_CONFIDENT_01` | reference provides neutral; confident variant supplies light smile. |
| Expression: curious / surprised / worried / confused / realization / confident | matching `CHAR_EXPR_*_01` IDs | direct one-to-one expression coverage. |
| Explanation: point left / point right | `CHAR_POSE_POINT_LEFT_01` / `CHAR_POSE_POINT_RIGHT_01` | direct one-to-one. |
| Explanation: point upward / open explanation / explain chart / final to viewer | `CHAR_POSE_OPEN_EXPLAIN_01`, `CHAR_EXPR_CONFIDENT_01`, `RENDER_ZORDER_01` | one clean open-hand pose is reframed toward the reserved overlay; renderer, not the image, supplies chart/caption direction. |
| Explanation: thinking / look at number | `CHAR_POSE_THINK_NUMBER_01`, `RENDER_SCALE_25_01` | direct thinking gaze; exact numeric area is renderer-controlled. |
| Living economy: check smartphone / bill / receipt / computer | `CHAR_PROP_PHONE_01` / `CHAR_PROP_BILL_01` / `CHAR_PROP_BILL_01` / `CHAR_PROP_LAPTOP_01` | generic bill asset covers blank statement/receipt safely; no readable finance document. |
| Living economy: calculate / react to money leaving / compare choices / relief-solution | `CHAR_POSE_THINK_NUMBER_01` / `CHAR_EXPR_WORRIED_01` + `RENDER_ZORDER_01` / point-left+point-right / `CHAR_EXPR_CONFIDENT_01` | calculation, fee reaction, comparison, and resolution remain distinct narrative states without fake money imagery. |

### Canonical count ledger

| Ledger item | Count | Meaning |
| --- | ---: | --- |
| PA-5B3 architecture deliverables | 28 | 1 master reference + 18 reusable generated-character variants + 9 renderer-derived variants. |
| New character image requests in PA-5B4 | 18 | 4 base + 6 expression + 4 pose + 4 prop-interaction; master excluded because Owner-provided. |
| Scene background/object image requests in PA-5B4 | 4 | one reusable plate for each specified environment group. |
| Initial PA-5B4 request cap | 22 | 18 character + 4 background/object; Batches A/B/C/D are 4 + 10 + 4 + 4. |
| Automatic retry / fallback | 0 / 0 | failed asset must wait for separately Owner-approved bounded regeneration. |

## E. Generation-Minimization Plan

- **TOTAL_PLANNED_CHARACTER_ASSETS:** 28.
- **TOTAL_ACTUAL_IMAGE_GENERATIONS_REQUIRED:** 18 character variants: four base orientations, six expression variants, four pose variants, and four prop-interaction variants. The master reference is Owner-provided and is not generated.
- **TOTAL_RENDERER_DERIVED_VARIANTS:** 9. Placement, scale, idle, camera crop, z-order, and simple match/slide are renderer operations because they do not change silhouette, expression, hand pose, prop interaction, or perspective.
- **SCENE_SPECIFIC_IMAGE_GENERATIONS:** 4 background/object plates, not character assets: `BG_EVENING_DESK_01` (S1–3), `BG_EVIDENCE_WORKTABLE_04` (S4), `BG_TWO_ROUTE_SPACE_05` (S5), `BG_MORNING_DESK_06_08` (S6–8).
- **Reason:** the 28-asset library avoids the false economy of eight unrelated images while avoiding a wasteful one-image-per-placement approach. Exact numbers, captions, charts, source strips, camera pushes, parallax, and basic movement remain deterministic renderer work.

## F. Scene Asset Matrix

| Scene | BACKGROUND | CHARACTER | PROP | EDITORIAL_GRAPHIC | EVIDENCE_VISUAL | FOREGROUND | TRANSITION_ELEMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | `BG_EVENING_DESK_01` — AI_GENERATED | `CHAR_PROP_PHONE_01`, expressions; CHARACTER_LIBRARY | blank phone/envelope/card — AI_GENERATED | hook / carry line — RENDERER | FSC metadata strip — CANONICAL_EVIDENCE | phone parallax — RENDERER | calendar-edge gaze match — RENDERER |
| 02 | `BG_EVENING_DESK_01` — AI_GENERATED | base right/side, curious, point-right — CHARACTER_LIBRARY | blank token/calendar — RENDERER | plain flow / arrow — RENDERER | FSC metadata strip — CANONICAL_EVIDENCE | token — RENDERER | token landing match — RENDERER |
| 03 | `BG_EVENING_DESK_01` cool pass — AI_GENERATED | worried/open explain — CHARACTER_LIBRARY | carried-token layer — RENDERER | two-lane comparison — RENDERER | FSC metadata strip — CANONICAL_EVIDENCE | translucent fee layer — RENDERER | layer becomes split board — RENDERER |
| 04 | `BG_EVIDENCE_WORKTABLE_04` — AI_GENERATED | side/right base, think-number/realization — CHARACTER_LIBRARY | NOT_REQUIRED | 100→20+80 decomposition — RENDERER | official example source metadata — CANONICAL_EVIDENCE | animated split lanes — RENDERER | 80 lane curve — RENDERER |
| 05 | `BG_TWO_ROUTE_SPACE_05` — AI_GENERATED | back/points/think/worried — CHARACTER_LIBRARY | route markers — RENDERER | finite versus recurring route — RENDERER | FSC metadata strip — CANONICAL_EVIDENCE | route nodes — RENDERER | inspection rack-focus — RENDERER |
| 06 | `BG_MORNING_DESK_06_08` — AI_GENERATED | bill/laptop/realization — CHARACTER_LIBRARY | unreadable bill/laptop — AI_GENERATED | two-step check overlay — RENDERER | FSC guidance strip — CANONICAL_EVIDENCE | highlight outlines — RENDERER | magnifier-to-notebook match — RENDERER |
| 07 | `BG_MORNING_DESK_06_08` — AI_GENERATED | notebook/confident/open explain — CHARACTER_LIBRARY | blank notebook/card/tray — AI_GENERATED | three-step checklist — RENDERER | FSC guidance strip — CANONICAL_EVIDENCE | check cards — RENDERER | check-mark carryover — RENDERER |
| 08 | `BG_MORNING_DESK_06_08` — AI_GENERATED | bill/open explain/confident — CHARACTER_LIBRARY | open blank statement/envelope — AI_GENERATED | three callouts/help card — RENDERER | FSC guidance strip — CANONICAL_EVIDENCE | vertical callouts — RENDERER | calm final hold — RENDERER |

## G. Evidence Visual Matrix

| Scene | CLAIM | SOURCE_ID | SOURCE_TYPE / AUTHORITY | VISUALIZATION_TYPE | WHAT_VIEWER_SEES | WHAT_CHARACTER_DOES_WITH_IT |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | `claim:revolving-mechanic` | `fsc-2024-revolving-talk`, `fsc-2022-revolving-policy` | Financial Services Commission notice / policy; authoritative structural evidence | original carryover diagram + metadata strip | remaining-balance route toward next month; no rate | notices envelope and tracks carry direction |
| 02 | `claim:revolving-mechanic` | `fsc-2024-revolving-talk`, `fsc-2022-revolving-policy` | Financial Services Commission notice / policy; authoritative structural evidence | original two-month process diagram | a token moving this month → next month | follows and points at token landing |
| 03 | `claim:revolving-mechanic` | `fsc-2024-revolving-talk`, `fsc-2022-revolving-policy` | Financial Services Commission notice / policy; authoritative structural evidence | original relationship comparison | possible fee layer attached to carried balance; no rate | reacts to layer and cautions viewer |
| 04 | `claim:revolving-example` | `fsc-2024-revolving-talk`, `fsc-2022-revolving-cardnews` | Financial Services Commission example / card news | deterministic number decomposition | 100만 원 bill → 20% → 20만 원 paid + 80만 원 carried; conditional new-use/fee labels only | follows split and recognizes carried lane |
| 05 | `claim:revolving-example` | `fsc-2024-revolving-talk`, `fsc-2022-revolving-cardnews` | Financial Services Commission explanatory material | finite-route versus repeatable-route comparison | period-fixed route versus repeating carry nodes; no invented duration | points at two route outcomes and thinks |
| 06 | `claim:revolving-action` | `fsc-2024-revolving-talk`, `fsc-2022-revolving-policy` | Financial Services Commission consumer guidance | original inspection reconstruction | statement and card-company guidance as check locations | inspects each location |
| 07 | `claim:revolving-action` | `fsc-2024-revolving-talk`, `fsc-2022-revolving-policy` | Financial Services Commission consumer guidance | original action checklist | reduce new spending, review payment ratio, reduce carried balance; no outcome promise | puts card away and forms a plan |
| 08 | `claim:revolving-action` | `fsc-2024-revolving-talk`, `fsc-2022-revolving-policy` | Financial Services Commission consumer guidance | original statement callout / help-route reconstruction | three checks and repayment/cancellation inquiry cue | checks then explains calmly to viewer |

No source screenshot is requested, imitated, or fabricated. Original editorial reconstruction uses only canonical metadata and approved claim data.

## H. Scene 01–08 Visual Director Prompts

### Scene 01
- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:01`; **NARRATIVE_PURPOSE:** hook: relief changes to notice that remaining balance can carry forward.
- **MASTER_CHARACTER_REFERENCE_REQUIRED:** YES; **CHARACTER_ASSET_IDS_USED:** `CHAR_PROP_PHONE_01`, `CHAR_EXPR_SURPRISED_01`, `CHAR_POSE_OPEN_EXPLAIN_01`, renderer placements/scales; **NEW_CHARACTER_ASSET_REQUIRED:** NO after Batch C.
- **BACKGROUND_DESCRIPTION:** low-contrast warm evening apartment desk from `BG_EVENING_DESK_01`, blank envelope and unbranded card; **PROP_DESCRIPTION:** blank phone set beside sealed envelope.
- **CHARACTER_START_ACTION:** holds phone with tentative relief.
- **CHARACTER_MID_ACTION:** lowers phone and notices envelope/calendar edge.
- **CHARACTER_END_ACTION:** makes an open-hand wait gesture to viewer.
- **EXPRESSION_SEQUENCE:** light relief → surprise → curious concern; **GAZE_SEQUENCE:** phone → envelope → frame-right calendar zone → viewer.
- **CAMERA_FRAMING:** medium reaction close-up, then rightward reframe; **LIGHTING:** warm lamp with phone glow; **DEPTH_PLAN:** phone foreground, character middle, envelope/calendar background; **FOREGROUND_PLAN:** renderer-only phone parallax.
- **NEGATIVE_REQUIREMENTS:** no readable phone/document text, numbers, source screenshot, rate, logos, or baked hook graphics; **SAFE_SUBTITLE_ZONE:** lower 18% clear; **OVERLAY_RESERVED_ZONE:** frame-right upper/mid for carry line and frame-top source strip.
- **CONTINUITY_FROM_PREVIOUS:** opening; **CONTINUITY_TO_NEXT:** rightward gaze and calendar edge match the two-month desk.

### Scene 02
- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:02`; **NARRATIVE_PURPOSE:** show partial payment moving to the next cycle.
- **MASTER_CHARACTER_REFERENCE_REQUIRED:** YES; **CHARACTER_ASSET_IDS_USED:** `CHAR_BASE_RIGHT3Q_01`, `CHAR_BASE_SIDE_01`, `CHAR_EXPR_CURIOUS_01`, `CHAR_POSE_POINT_RIGHT_01`; **NEW_CHARACTER_ASSET_REQUIRED:** NO after Batches A–B.
- **BACKGROUND_DESCRIPTION:** same evening desk, opened into two blank calendar pages; **PROP_DESCRIPTION:** generic payment token moved between pages by renderer or a simple physical blank token.
- **CHARACTER_START_ACTION:** enters looking where S1 ended.
- **CHARACTER_MID_ACTION:** follows token left-to-right.
- **CHARACTER_END_ACTION:** points at its next-month landing.
- **EXPRESSION_SEQUENCE:** curious → focused → thoughtful; **GAZE_SEQUENCE:** current month → token center → next month/down.
- **CAMERA_FRAMING:** over-shoulder desk view to top-down landing; **LIGHTING:** continuous warm evening; **DEPTH_PLAN:** calendar plane primary, character secondary; **FOREGROUND_PLAN:** token only.
- **NEGATIVE_REQUIREMENTS:** no formal term, arrow, values, or calendars with readable dates in image; **SAFE_SUBTITLE_ZONE:** lower 18%; **OVERLAY_RESERVED_ZONE:** top/mid route lane.
- **CONTINUITY_FROM_PREVIOUS:** same phone/envelope desk and gaze; **CONTINUITY_TO_NEXT:** landed token is available for the fee layer.

### Scene 03
- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:03`; **NARRATIVE_PURPOSE:** show that avoided delinquency does not erase the carried balance or fee possibility.
- **MASTER_CHARACTER_REFERENCE_REQUIRED:** YES; **CHARACTER_ASSET_IDS_USED:** `CHAR_BASE_LEFT3Q_01`, `CHAR_EXPR_WORRIED_01`, `CHAR_POSE_OPEN_EXPLAIN_01`; **NEW_CHARACTER_ASSET_REQUIRED:** NO after Batches A–B.
- **BACKGROUND_DESCRIPTION:** the same desk with a cooler, lower-contrast pass; **PROP_DESCRIPTION:** carried token remains, fee layer is renderer-only.
- **CHARACTER_START_ACTION:** makes a short relief nod.
- **CHARACTER_MID_ACTION:** leans back noticing a translucent attachment.
- **CHARACTER_END_ACTION:** gives a cautionary open palm.
- **EXPRESSION_SEQUENCE:** relief → worried → clear-eyed caution; **GAZE_SEQUENCE:** relief tag zone → fee layer → delayed path → viewer.
- **CAMERA_FRAMING:** medium desk angle, reaction close-up, pullback for comparison; **LIGHTING:** warm-to-cool emotional shift; **DEPTH_PLAN:** character in middle, comparison graphic primary; **FOREGROUND_PLAN:** fee layer only.
- **NEGATIVE_REQUIREMENTS:** no rate, percent, money number, label, chart, or fake source card in image; **SAFE_SUBTITLE_ZONE:** lower 18%; **OVERLAY_RESERVED_ZONE:** frame-right/mid comparison field.
- **CONTINUITY_FROM_PREVIOUS:** exact landed token persists; **CONTINUITY_TO_NEXT:** attachment dissolves into S4 split lanes.

### Scene 04
- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:04`; **NARRATIVE_PURPOSE:** evidence peak: official 100/20/80 mechanism.
- **MASTER_CHARACTER_REFERENCE_REQUIRED:** YES; **CHARACTER_ASSET_IDS_USED:** `CHAR_BASE_SIDE_01`, `CHAR_BASE_RIGHT3Q_01`, `CHAR_POSE_THINK_NUMBER_01`, `CHAR_EXPR_REALIZATION_01`, `RENDER_SCALE_25_01`; **NEW_CHARACTER_ASSET_REQUIRED:** NO after Batches A–B.
- **BACKGROUND_DESCRIPTION:** clean lower-saturation `BG_EVIDENCE_WORKTABLE_04`; **PROP_DESCRIPTION:** none required; all numbers are renderer elements.
- **CHARACTER_START_ACTION:** tracks the incoming carry lane.
- **CHARACTER_MID_ACTION:** studies the renderer split.
- **CHARACTER_END_ACTION:** gives a recognition nod to the carried lane.
- **EXPRESSION_SEQUENCE:** focused → calculating → realization; **GAZE_SEQUENCE:** 100 origin zone → 20/80 split zone → next-month lane.
- **CAMERA_FRAMING:** evidence-first medium-wide with character 15–25%; **LIGHTING:** neutral focused desk light; **DEPTH_PLAN:** numeric overlay foremost, character behind/right; **FOREGROUND_PLAN:** animated renderer split lanes.
- **NEGATIVE_REQUIREMENTS:** image must contain no text, 100/20/80, currency, fee amount, graph, source screenshot, or labels; **SAFE_SUBTITLE_ZONE:** lower 18%; **OVERLAY_RESERVED_ZONE:** central 55% for exact decomposition.
- **CONTINUITY_FROM_PREVIOUS:** S3 attachment becomes a clean evidence board; **CONTINUITY_TO_NEXT:** 80 carried lane curves into the repeating route.

### Scene 05
- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:05`; **NARRATIVE_PURPOSE:** compare visible ending versus recurring carryover path.
- **MASTER_CHARACTER_REFERENCE_REQUIRED:** YES; **CHARACTER_ASSET_IDS_USED:** `CHAR_BASE_BACK_01`, `CHAR_EXPR_WORRIED_01`, `CHAR_EXPR_CONFUSED_01`, `CHAR_POSE_POINT_LEFT_01`, `CHAR_POSE_POINT_RIGHT_01`, `CHAR_POSE_THINK_NUMBER_01`; **NEW_CHARACTER_ASSET_REQUIRED:** NO after Batches A–B.
- **BACKGROUND_DESCRIPTION:** low-saturation `BG_TWO_ROUTE_SPACE_05`, clear left finite route and right curved recurring route with no printed labels; **PROP_DESCRIPTION:** route nodes renderer-only.
- **CHARACTER_START_ACTION:** follows the S4 carry lane from behind.
- **CHARACTER_MID_ACTION:** points left, then right.
- **CHARACTER_END_ACTION:** pauses in thought between routes.
- **EXPRESSION_SEQUENCE:** concern → comparison focus → thoughtful concern; **GAZE_SEQUENCE:** left ending → right repeated route → viewer.
- **CAMERA_FRAMING:** rear follow to lateral comparison pan to medium close; **LIGHTING:** neutral, left route subtly calmer; **DEPTH_PLAN:** paths lead depth, character mid-ground; **FOREGROUND_PLAN:** renderer nodes.
- **NEGATIVE_REQUIREMENTS:** no repayment time, rate, text, arrows, or financial charts in image; **SAFE_SUBTITLE_ZONE:** lower 18%; **OVERLAY_RESERVED_ZONE:** top route labels and center comparison.
- **CONTINUITY_FROM_PREVIOUS:** carried lane physically continues; **CONTINUITY_TO_NEXT:** thinking state motivates personal inspection.

### Scene 06
- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:06`; **NARRATIVE_PURPOSE:** show the two places where one must verify individual conditions.
- **MASTER_CHARACTER_REFERENCE_REQUIRED:** YES; **CHARACTER_ASSET_IDS_USED:** `CHAR_PROP_BILL_01`, `CHAR_PROP_LAPTOP_01`, `CHAR_EXPR_REALIZATION_01`, `CHAR_POSE_POINT_RIGHT_01`; **NEW_CHARACTER_ASSET_REQUIRED:** NO after Batch C.
- **BACKGROUND_DESCRIPTION:** `BG_MORNING_DESK_06_08`, lower-saturation morning desk; **PROP_DESCRIPTION:** generic unreadable statement and generic blank laptop.
- **CHARACTER_START_ACTION:** focuses on statement.
- **CHARACTER_MID_ACTION:** pivots to laptop.
- **CHARACTER_END_ACTION:** nods and indicates check order.
- **EXPRESSION_SEQUENCE:** thinking → focused → realization; **GAZE_SEQUENCE:** statement down-left → laptop right → overlay center → viewer.
- **CAMERA_FRAMING:** desk detail with rack-focus and clean two-destination end frame; **LIGHTING:** soft morning side light; **DEPTH_PLAN:** statement foreground, character mid, laptop back/right; **FOREGROUND_PLAN:** renderer highlight outlines.
- **NEGATIVE_REQUIREMENTS:** no rates, websites, text, logos, readable statement, screenshot, or chart in image; **SAFE_SUBTITLE_ZONE:** lower 18%; **OVERLAY_RESERVED_ZONE:** center two-step route.
- **CONTINUITY_FROM_PREVIOUS:** S5 thought becomes an inspection task; **CONTINUITY_TO_NEXT:** inspection surface match-cuts to notebook.

### Scene 07
- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:07`; **NARRATIVE_PURPOSE:** turn verified information into a modest, non-promissory plan.
- **MASTER_CHARACTER_REFERENCE_REQUIRED:** YES; **CHARACTER_ASSET_IDS_USED:** `CHAR_PROP_NOTEBOOK_01`, `CHAR_EXPR_CONFIDENT_01`, `CHAR_POSE_OPEN_EXPLAIN_01`; **NEW_CHARACTER_ASSET_REQUIRED:** NO after Batch C.
- **BACKGROUND_DESCRIPTION:** continued `BG_MORNING_DESK_06_08`; **PROP_DESCRIPTION:** blank notebook, card, and side tray/wallet, without text.
- **CHARACTER_START_ACTION:** puts card away.
- **CHARACTER_MID_ACTION:** opens notebook and compares blank columns.
- **CHARACTER_END_ACTION:** makes a modest final check gesture.
- **EXPRESSION_SEQUENCE:** calm realization → concentration → modest confidence; **GAZE_SEQUENCE:** card → notebook → checklist zone → viewer.
- **CAMERA_FRAMING:** card-placement follow to overhead notebook to gentle push; **LIGHTING:** brighter but restrained morning; **DEPTH_PLAN:** notebook primary, character secondary; **FOREGROUND_PLAN:** renderer checklist cards.
- **NEGATIVE_REQUIREMENTS:** no payoff amount, cash stack, guarantee, numeric chart, written checklist, or logo in image; **SAFE_SUBTITLE_ZONE:** lower 18%; **OVERLAY_RESERVED_ZONE:** notebook center/top.
- **CONTINUITY_FROM_PREVIOUS:** verified fields become plan inputs; **CONTINUITY_TO_NEXT:** final check becomes S8 statement check.

### Scene 08
- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:08`; **NARRATIVE_PURPOSE:** close the loop with three statement checks and a safe help route.
- **MASTER_CHARACTER_REFERENCE_REQUIRED:** YES; **CHARACTER_ASSET_IDS_USED:** `CHAR_PROP_BILL_01`, `CHAR_EXPR_CONFIDENT_01`, `CHAR_POSE_OPEN_EXPLAIN_01`; **NEW_CHARACTER_ASSET_REQUIRED:** NO after Batches B–C.
- **BACKGROUND_DESCRIPTION:** same morning desk and window; S1 envelope is now open; **PROP_DESCRIPTION:** blank open statement, envelope, pen.
- **CHARACTER_START_ACTION:** follows three blank statement areas.
- **CHARACTER_MID_ACTION:** sets pen down.
- **CHARACTER_END_ACTION:** turns to viewer with an open-hand conclusion.
- **EXPRESSION_SEQUENCE:** focused calm → satisfied understanding → light confident smile; **GAZE_SEQUENCE:** statement top-to-bottom → help-card zone → viewer.
- **CAMERA_FRAMING:** detail on envelope to vertical progression to slow pullback; **LIGHTING:** clean calm morning; **DEPTH_PLAN:** statement foreground then direct-to-viewer middle; **FOREGROUND_PLAN:** renderer callouts only.
- **NEGATIVE_REQUIREMENTS:** no financial fields, rate, amount, provider logo, screenshot, text, or final CTA baked into image; **SAFE_SUBTITLE_ZONE:** lower 18%; **OVERLAY_RESERVED_ZONE:** upper/mid three-item callouts.
- **CONTINUITY_FROM_PREVIOUS:** plan check becomes real statement check; **CONTINUITY_TO_NEXT:** final hold only; no publish or automatic CTA.

## I. Motion Implementation Matrix

| Scene | IMAGE-BASED MOTION | RENDERER-BASED MOTION |
| --- | --- | --- |
| 01 | phone relief pose → surprised notice → open-hand caution | phone/envelope parallax, carry line, camera push/reframe, subtitle/source strip |
| 02 | curious base → point-right / side observation | token slide, two-month arrow, lateral camera follow, top-down crop |
| 03 | relief-compatible state → worried → open explain | fee-layer attach, two-lane comparison, cool color pass, pullback |
| 04 | thinking-at-number → realization | exact 100/20/80 split, conditional labels, count/trace, evidence z-order |
| 05 | back follow → left/right points → thinking | route-node reveal, lateral pan, route match transition |
| 06 | statement inspection → laptop inspection → recognition point | rack-focus, two-destination outlines, subtitle/source strip |
| 07 | card put-away / notebook plan → modest explanation | checklist progression, neutral balance marker, overhead reframe |
| 08 | statement inspection → direct-to-viewer open explanation | vertical callouts, help card, slow pullback, final hold |

No scene may use unchanged character art plus camera push as its only performance. Use the named pose/expression crosscut, a supported rig tween, or a dissolve while camera/foreground motion continues.

## J. Scene Transition Matrix

| Pair | OUTGOING_CHARACTER_STATE | INCOMING_CHARACTER_STATE | PROP_CARRYOVER | CAMERA_TRANSITION | BACKGROUND_TRANSITION | EDITORIAL_TRANSITION | CONTINUITY_RATIONALE |
| --- | --- | --- | --- | --- | --- | --- |
| 01→02 | surprised gaze right | curious tracking | phone down; envelope/calendar remain | rightward reframe → overhead | same evening desk | calendar edge → two-month pages | notice becomes mechanism |
| 02→03 | token landing focus | tentative relief then worry | token stays in next month | top-down hold → reaction close | same desk, cooler pass | token receives translucent layer | carried amount did not vanish |
| 03→04 | caution toward delayed path | evidence-focused thinking | layer becomes input line | pullback opens board | desk → worktable | attachment → split lanes | concern asks for proof |
| 04→05 | realization following 80 lane | concerned route comparison | 80 lane curves onward | lateral follow | worktable → two routes | split lane → recurring nodes | example becomes life impact |
| 05→06 | thinking between routes | focused inspection | no handheld prop; task carries | close reaction → rack-focus | route space → morning desk | route uncertainty → check outline | uncertainty requires verification |
| 06→07 | recognition point | calm plan start | statement/laptop knowledge → notebook | statement detail → overhead | same morning palette | check outline → checklist | verified fields inform action |
| 07→08 | modest final check | focused statement check | card away; envelope reappears opened | overhead → vertical detail → pullback | same morning desk/window | checklist mark → first callout | plan returns to monitoring |

## K. PA-5B4 Batch Request Plan

| Batch | REQUEST_COUNT_MAX | ASSETS | MASTER_REFERENCE_USE | FAILURE_POLICY | REGEN_POLICY | COST_RISK | QUALITY_GATE |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| A — reusable bases | 4 | four `CHAR_BASE_*` assets | required for every request | stop batch assessment when an identity-critical asset fails | failed asset only; no automatic retry | future ChatGPT+Playwright image request only; amount unknown | master identity / silhouette / 3 tufts / palette PASS |
| B — expression / pose | 10 | six `CHAR_EXPR_*`, four `CHAR_POSE_*` | required for every request | reject only the failed variant | Owner-approved bounded failed-asset regeneration only | same future external boundary | expression/pose readable; no drift; safe space PASS |
| C — prop interaction | 4 | `CHAR_PROP_PHONE_01`, `BILL`, `LAPTOP`, `NOTEBOOK` | required for every request | reject malformed hands, wrong prop hand, identity drift | Owner-approved bounded failed-asset regeneration only | same future external boundary | prop usability / hands / identity PASS |
| D — backgrounds / objects | 4 | `BG_EVENING_DESK_01`, `BG_EVIDENCE_WORKTABLE_04`, `BG_TWO_ROUTE_SPACE_05`, `BG_MORNING_DESK_06_08` | not applicable unless character appears in plate | reject unreadable-overlay conflict or unwanted text | Owner-approved bounded failed-asset regeneration only | same future external boundary | low-contrast background and reserved overlay zones PASS |

**PA-5B4 hard boundary:** 22 initial requests maximum (4 + 10 + 4 + 4); retry 0; no automatic fallback. This is a future approval plan, not authorization to make any request.

## L. Regeneration Policy

1. Regenerate only the individually failed asset; accepted assets are immutable production inputs.
2. **Identity-critical failure:** wrong silhouette/proportion, face panel, eyes, exact three tufts, torso motifs, shoes, palette, or 3D style.
3. **Visual-quality failure:** pose/action unreadable, overlay-safe space unavailable, background distracts from evidence, or scene continuity cannot be maintained.
4. **Malformed failure:** distorted face, extra/missing fingers or limbs, impossible prop grip, warped prop.
5. **Prohibited-drift failure:** extra accessory, hat, bag, cape, armor, clothing, antenna change, money/coin/banknote body, logo, readable text/number/chart, photorealism, anime, or benchmark-character resemblance.
6. No automatic retry loop, substitute asset, batch rerun, or scope expansion. A future Owner must approve a bounded failed-asset regeneration by asset ID and count.

## M. Asset Acceptance Rubric

Every future character image is scored `PASS` or `FAIL` for each item. Any identity-critical `FAIL` excludes it from production.

| Check | PASS condition |
| --- | --- |
| IDENTITY_MATCH | unmistakably same `OWNER_SELECTED_CHARACTER_MASTER` |
| FACE_MATCH | cyan panel, eye geometry, eyebrow/mouth language match |
| BODY_PROPORTION_MATCH | locked rounded silhouette and limb scale match |
| PALETTE_MATCH | blue/purple body and cyan panel remain locked |
| HEAD_TUFT_MATCH | exactly three aqua droplet-like tufts |
| TORSO_SYMBOL_MATCH | bar-chart and shield/check motifs match in placement/style |
| SHOE_MATCH | sneaker silhouette and accents match |
| POSE_READABILITY | requested narrative action is legible without text |
| EXPRESSION_READABILITY | requested emotion is legible and appropriate |
| PROP_CORRECTNESS | correct generic prop, correct hand, no malformed geometry |
| NO_EXTRA_ACCESSORY | no prohibited object, clothing, or identity addition |
| BACKGROUND_USABILITY | low contrast/saturation; no unwanted readable marks |
| OVERLAY_SAFE_SPACE | declared subtitle/graphic zones remain clean |
| STYLE_MATCH | friendly soft-matte 3D cartoon, not photoreal/anime/benchmark copy |

## N. Expected Request Count

| Metric | Count / rule |
| --- | ---: |
| TOTAL_CHARACTER_ASSETS | 28 |
| CHARACTER_MASTER_REFERENCE new generations | 0 |
| ACTUAL_CHARACTER_IMAGE_GENERATIONS_REQUIRED | 18 |
| RENDERER_DERIVED_VARIANTS | 9 |
| SCENE_SPECIFIC_IMAGE_GENERATIONS | 4 |
| TOTAL_PA5B4_MAX_IMAGE_REQUESTS | 22 |
| Automatic retry / fallback | 0 / 0 |
| PA-5B3 external requests | 0 |

PA-5B3 ends at this design artifact. PA-5B4 image execution, any provider/browser call, TTS, rendering, commit, and push require a separately approved Slice.
