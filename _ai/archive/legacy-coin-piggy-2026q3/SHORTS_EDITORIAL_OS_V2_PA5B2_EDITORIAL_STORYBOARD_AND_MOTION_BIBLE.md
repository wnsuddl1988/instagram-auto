# Shorts Editorial OS V2 — PA-5B2 Editorial Storyboard & Motion Bible

**Status:** `PROPOSAL_ONLY_AWAITING_OWNER_APPROVAL`
**Scope:** Editorial planning only. No image generation, TTS request, external provider call, final render, publish, commit, or push was executed.

## Owner-readable summary

This is a character-led finance short, not a card slideshow. One fixed character first experiences the confusing payment situation, then notices what is wrong, checks the evidence, follows the 100/20/80 mechanism, and reaches a practical conclusion. The character remains the viewer's proxy; numbers, sources, and captions explain the proof without replacing the story.

The canonical topic is **STRONG**: it changes a household debt decision, corrects a common knowledge gap, has Financial Services Commission sources, contains one clear visual mechanism, and ends in an actionable statement check. The source is structural canonical evidence only; no current individual rate or card-company condition is claimed.

## A. Locked production principles

1. The production is one fixed recurring character + a living-money/economic mechanism + authoritative evidence + scene-specific visual material + natural voice.
2. It is not eight unrelated images, a chart slideshow, a static mascot layer, or a generic explainer template.
3. The protagonist reacts before explaining. It must not begin as an omniscient lecturer.
4. Each normal scene has two to four meaningful character states when the beat needs them. `STATIC_CHARACTER_PLUS_KEN_BURNS_ONLY` is a hard failure.
5. Exact numbers, charts, source identity, captions, and subtitles are renderer graphics. They are never fabricated inside generated imagery.
6. Character use follows content/story → primary evidence → character → decoration. The character may be large for a reaction and smaller while numeric evidence is primary.
7. Canonical revision-6 narration is preserved. Any spoken-language revision below is a proposal requiring Owner approval before TTS regeneration.
8. The prior PA-5B technical candidate remains preserved as a failed editorial proof, not a production reference.

## B. Locked character identity

### `OWNER_SELECTED_CHARACTER_MASTER`

- Rounded blue/purple body; cyan face panel; large expressive eyes.
- Three aqua droplet-like tufts on top; simple limbs; sneaker-like shoes.
- Front bar-chart motif and check/shield motif.
- Clean, friendly 3D cartoon appearance.
- Role: **the viewer's proxy**. It encounters, notices, worries, checks, compares, understands, and then shares the conclusion.

### Hard locks

- No hats, capes, bags, armor, fantasy effects, extra robot parts, silhouette changes, or primary-palette changes.
- No real-person face, third-party logo, readable text, numbers, or chart inside character-generated imagery.
- The character is one consistent 3D master across all scenes. Lighting, pose, camera, props, and facial expression may change; body, face panel, eyes, top tufts, shoes, motifs, and palette may not.
- Exact master-image binding is still pending. This plan uses the approved identity contract and does not claim a master image file already exists.

### Canonical-character provenance and supersession boundary

The revision-6 canonical snapshot contains `character_motion-d0d1cdd8413e9404`, re-used by the `render_integration` checkpoint, with `directionId: moa_archive_sprite` and temporary display name `Moa — Archive Sprite (비교용)`. That checkpoint is a compact, secondary evidence-navigation comparison draft; it records `finalIdentityApproved: false` and `productionAssetCreated: false`. It is preserved as historical planning evidence and is **not** renamed, reused, or treated as the PA-5B2 protagonist.

`OWNER_SELECTED_CHARACTER_MASTER` is a distinct Owner-selected character for the PA-5B2 production direction. It is not a Moa rebrand. If the Owner approves this packet and a later implementation slice binds the master asset, this master supersedes the old `moa_archive_sprite` direction **for the PA-5B2 character-led production path only**. The old checkpoint remains immutable historical evidence; no canonical snapshot, character source module, or production asset is altered by this planning document.

### Screen-space guidance

| Scene role | Character share of safe frame |
| --- | ---: |
| Normal narrative | 25–40% |
| Reaction | 40–55% |
| Evidence / chart-heavy | 15–25% |
| Environment-heavy | 20–30% |

## C. Character asset-library plan — 28 reusable assets

All assets are planned only; generation is `0` in PA-5B2.

| Family | Assets | Reuse rule |
| --- | --- | --- |
| Orientation (5) | front, left 3/4, right 3/4, side, back | Reusable master poses; all scene variants derive from these locks. |
| Expression (7) | neutral/light smile, curious, surprised, worried, confused, realization, confident | Reusable face states; no new facial design per scene. |
| Explanation action (8) | point left, point right, point upward, open-hand explanation, thinking, look-at-number, explain-chart, final-to-viewer | Reusable presenter/action library. |
| Living-economy action (8) | check smartphone, check bill, check receipt, calculate, check computer, react-to-money-leaving, compare choices, relief/solution discovered | Reusable narrative/action library. |

Scene-specific work is limited to background, prop placement, light/camera composition, and the selected combination of the 28 assets. It does not create a new character identity per scene.

### Scene-to-asset reuse matrix

| Scene | Orientation / expression | Reusable action assets | No new character family |
| --- | --- | --- | --- |
| 01 | left 3/4; relief → surprised | smartphone-check, open-hand explanation | YES |
| 02 | right 3/4 / side; curious → thoughtful | compare choices, point-right, thinking | YES |
| 03 | top-down 3/4 / front 3/4; relief → worried | look-at-number, open-hand explanation | YES |
| 04 | side / right 3/4; calculating → realization | calculate, explain-chart, look-at-number | YES |
| 05 | back/side/front 3/4; concerned → thoughtful | point-left, point-right, thinking | YES |
| 06 | side / right 3/4; thinking → realization | check-bill, check-computer, point-right | YES |
| 07 | right/front 3/4; realization → confident | compare choices, calculate, final explanation | YES |
| 08 | side/front; focused → light smile | check-bill, final-to-viewer, open-hand explanation | YES |

## D. Topic-quality review

### Canonical topic

`카드 리볼빙, 20%만 내면 끝일까?` — selected angle `revolving-balance-not-erased`.

| Gate | Finding | Result |
| --- | --- | --- |
| Money impact | Card debt, carried balance, fee exposure, repayment planning, and next-month cash pressure directly affect household money. | PASS |
| Curiosity / gap | “연체가 아니면 끝난 것”이라는 common misread has a specific correction. | PASS |
| Evidence strength | Three Financial Services Commission source records support the mechanism, official example, and consumer action. | PASS with canonical-source boundary |
| Visualizability | Carryover, 100→20+80 split, repeated cycle, statement check, and choice sequence are visually explainable. | PASS |
| Practical connection | Viewer is told what to check: agreement, carried balance, applicable rate, and card-company repayment/cancellation guidance. | PASS |
| Hook potential | The question “일부만 냈는데 연체가 아니면 끝?” creates a genuine misconception hook without clickbait. | PASS |

`TOPIC_QUALITY: STRONG`

Scope caveat: the approved project records source verification as structural-only and uses 2024/2022 authoritative material. The video must not imply a current universal rate, personalised card condition, or a guaranteed repayment outcome.

## E. Evidence map

| Claim | Canonical source / evidence | Visual use |
| --- | --- | --- |
| Some payment can carry a remaining balance into the next billing cycle; carried balance can have a fee. | 금융위원회, `할부 결제와 달라요! 리볼빙 서비스 이용 주의` (2024-08-27); `신용카드 결제성 리볼빙 서비스 개선방안` (2022-08-24) | Scene 1–3: subtle source strip; time-shift and fee relationship overlay. |
| Official example: card bill 100만 원, 20% agreed payment ratio, 20만 원 paid, 80만 원 carried. | 금융위원회, 2024 notice; `리볼빙 서비스, 소비자 친화적으로 개선합니다` (2022-08-26) | Scene 4: renderer-drawn 100→20+80 split. No number is placed in AI imagery. |
| Individual fee conditions may differ; verify statement/card-company guidance and make a repayment plan. | 금융위원회 2024 notice and 2022 policy material | Scene 5–8: comparison, inspection cue, action order, final statement checklist. |

Source strips are supporting overlays only. No official webpage screenshot is generated or imitated.

## F. Eight-scene detailed storyboard

### Scene 01

- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:01`
- **DURATION_TARGET:** 6.4s, revision-6 subtitle-plan target; future provider timestamp is authoritative for final timing.
- **NARRATIVE_FUNCTION:** Hook — the protagonist thinks the problem may be over, then notices it is not.
- **VOICEOVER_CURRENT:** 카드값 일부만 냈는데 연체가 아니라고요? 안심하기 전에, 다음 달로 넘어간 금액부터 확인해야 합니다.
- **VOICEOVER_PROPOSED:** 카드값 일부만 냈는데 연체가 아니라고요? 그럼 끝난 걸까요. 아닙니다. 남은 금액은 다음 달로 넘어갈 수 있으니, 이월잔액부터 보세요.
- **FACT / CLAIM:** No delinquency does not mean carried balance is zero; remaining balance can move to the next cycle.
- **SOURCE / EVIDENCE:** `claim:revolving-mechanic`; FSC 2024/2022. Small source identity strip only.
- **BACKGROUND:** Warm evening apartment desk, smartphone glow, generic card and sealed bill envelope; no readable document surface.
- **PRIMARY_VISUAL:** Character's reaction to an apparently completed payment, then a thin deterministic carry-forward path appears from the envelope toward a next-month calendar tile.
- **SECONDARY_VISUAL:** Big hook overlay: `연체 아님 ≠ 잔액 없음`.
- **CHARACTER_START_POSE:** Left 3/4, holding smartphone close.
- **CHARACTER_START_EXPRESSION:** Light relief.
- **CHARACTER_ACTION_1:** Lowers phone and glances down at the envelope.
- **CHARACTER_ACTION_2:** Eyes widen; torso turns toward the carry-forward calendar direction.
- **CHARACTER_ACTION_3:** Small open-hand “wait” reaction toward the viewer.
- **CHARACTER_END_POSE:** Right 3/4, body turned toward the frame-right carry line.
- **CHARACTER_END_EXPRESSION:** Curious-concerned.
- **GAZE_DIRECTION:** phone → envelope → frame-right calendar → viewer.
- **PROP_INTERACTION:** Smartphone is set beside the envelope; no screen content is visible.
- **CAMERA_START:** Medium reaction close-up.
- **CAMERA_MOVEMENT:** Short push-in with foreground phone parallax.
- **CAMERA_END:** Reframed rightward to reveal calendar edge.
- **OVERLAY_SEQUENCE:** Hook question subtitle → `연체 아님` tag → negation connector → key caption → compact FSC source strip.
- **NUMBER / CHART SEQUENCE:** None; no amount is invented.
- **SUBTITLE_ZONE:** Lower safe caption zone.
- **KEY_CAPTION:** `연체 아님 ≠ 잔액 없음`.
- **TRANSITION_IN:** Smartphone notification-like light reveal.
- **TRANSITION_OUT:** Gaze-driven match cut to Scene 02's calendar pages.
- **CONTINUITY_FROM_PREVIOUS:** Opens the story; no prior scene.
- **CONTINUITY_TO_NEXT:** The character's rightward gaze and calendar edge become Scene 02's two-month mechanism.
- **CHARACTER_ASSETS_REQUIRED:** left 3/4, relief, surprised, open-hand explanation, smartphone-check.
- **BACKGROUND_ASSETS_REQUIRED:** apartment desk, phone glow, generic envelope, next-month tile.
- **PROP_ASSETS_REQUIRED:** blank smartphone, unbranded card, sealed bill envelope.
- **RENDERER_GRAPHICS_REQUIRED:** hook card, carry line, source strip, timed subtitles.
- **SOURCE_VISUAL_REQUIRED:** YES — small metadata strip.
- **GENERATION_REQUIRED:** YES — later character-master binding and background composite only.

### Scene 02

- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:02`
- **DURATION_TARGET:** 7.068s, revision-6 subtitle-plan target.
- **NARRATIVE_FUNCTION:** Setup — the character follows how a partial payment becomes a carryover.
- **VOICEOVER_CURRENT:** 리볼빙의 정식 명칭은 일부결제금액이월약정입니다. 결제대금 일부를 내면 나머지가 다음 달로 넘어가는 방식입니다.
- **VOICEOVER_PROPOSED:** 리볼빙, 정식 이름은 일부결제금액이월약정입니다. 이번 달 일부만 내면, 남은 금액은 다음 달 결제로 넘어가죠.
- **FACT / CLAIM:** Partial payment leaves the remaining payment to the next billing cycle.
- **SOURCE / EVIDENCE:** `claim:revolving-mechanic`; FSC 2024/2022.
- **BACKGROUND:** Same desk, now opened to two unbranded calendar pages connected by the bill envelope; evening light continues.
- **PRIMARY_VISUAL:** Character physically moves a blank payment token from this-month page to next-month page; renderer adds the directional relationship.
- **SECONDARY_VISUAL:** Formal-term label appears once, then collapses to a plain-language `일부 납부 → 다음 달 이월` flow.
- **CHARACTER_START_POSE:** Right 3/4, looking where Scene 01 ended.
- **CHARACTER_START_EXPRESSION:** Curious.
- **CHARACTER_ACTION_1:** Picks up payment token from the current-month page.
- **CHARACTER_ACTION_2:** Carries it across to the next-month page while tracking it with eyes.
- **CHARACTER_ACTION_3:** Points gently at the landing location.
- **CHARACTER_END_POSE:** Side orientation, looking down at the token now in next month.
- **CHARACTER_END_EXPRESSION:** Thoughtful.
- **GAZE_DIRECTION:** current month left → moving token center → next month right/down.
- **PROP_INTERACTION:** Calendar pages, generic card, blank payment token; no fake amount.
- **CAMERA_START:** Over-shoulder desk view.
- **CAMERA_MOVEMENT:** Lateral follow of the token.
- **CAMERA_END:** Top-down close for landing position.
- **OVERLAY_SEQUENCE:** Formal name label → directional arrow → plain-language flow → source strip at close.
- **NUMBER / CHART SEQUENCE:** Two-stage timeline only; no numeric values.
- **SUBTITLE_ZONE:** Lower safe caption zone.
- **KEY_CAPTION:** `일부결제금액이월약정`.
- **TRANSITION_IN:** Calendar match from Scene 01.
- **TRANSITION_OUT:** Top-down token landing becomes the shadow/extra layer in Scene 03.
- **CONTINUITY_FROM_PREVIOUS:** Same prop set and continuous gaze line from Scene 01.
- **CONTINUITY_TO_NEXT:** Token's moved position becomes proof that it did not disappear.
- **CHARACTER_ASSETS_REQUIRED:** right 3/4, curious, thinking, point-right, compare-choice.
- **BACKGROUND_ASSETS_REQUIRED:** continuation desk, two calendar pages, soft lamp.
- **PROP_ASSETS_REQUIRED:** blank payment token, card, calendar pages, envelope.
- **RENDERER_GRAPHICS_REQUIRED:** formal-term label, arrow, simple month flow, subtitles.
- **SOURCE_VISUAL_REQUIRED:** YES — small metadata strip.
- **GENERATION_REQUIRED:** YES — later character-master binding and scene composite.

### Scene 03

- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:03`
- **DURATION_TARGET:** 7.514s, revision-6 subtitle-plan target.
- **NARRATIVE_FUNCTION:** Turn — temporary relief becomes concern when the carried balance gains a fee layer.
- **VOICEOVER_CURRENT:** 연체를 피할 수 있다는 장점은 있지만, 이월된 잔액에는 수수료가 붙습니다. 빚이 없어진 것이 아니라 결제 시점이 미뤄진 겁니다.
- **VOICEOVER_PROPOSED:** 연체를 피하는 데는 도움이 될 수 있습니다. 하지만 이월된 잔액에는 수수료가 붙어요. 빚이 사라진 게 아니라, 결제 시점이 뒤로 밀린 겁니다.
- **FACT / CLAIM:** Avoiding delinquency can coexist with carried-balance fees; the obligation is delayed, not erased.
- **SOURCE / EVIDENCE:** `claim:revolving-mechanic`; FSC 2024/2022. No numerical rate is shown.
- **BACKGROUND:** Same desk shifts cooler; the next-month page now has a second translucent layer beneath it, creating visual weight.
- **PRIMARY_VISUAL:** Character initially nods at “연체 아님,” then notices a fee-layer shadow attaching to the carried token.
- **SECONDARY_VISUAL:** Renderer comparison: `연체 회피 가능` beside `이월잔액 + 수수료`, converging into `결제 시점만 뒤로`.
- **CHARACTER_START_POSE:** Top-down/three-quarter beside the moved token.
- **CHARACTER_START_EXPRESSION:** Tentative relief.
- **CHARACTER_ACTION_1:** Gives a short relieved nod toward the “late-payment avoided” tag.
- **CHARACTER_ACTION_2:** Leans back and tracks the fee layer attaching; expression becomes worried.
- **CHARACTER_ACTION_3:** Looks from the two labels to the viewer with a small “not gone” head shake.
- **CHARACTER_END_POSE:** Front 3/4, open palm toward the delayed-path overlay.
- **CHARACTER_END_EXPRESSION:** Concerned but clear-eyed.
- **GAZE_DIRECTION:** relief tag → fee layer → converged path → viewer.
- **PROP_INTERACTION:** Character does not touch a statement; it watches the carried token acquire a deterministic overlay.
- **CAMERA_START:** Medium desk angle.
- **CAMERA_MOVEMENT:** Reaction close-up on fee attachment.
- **CAMERA_END:** Pull back for comparison graphic.
- **OVERLAY_SEQUENCE:** qualification tag → fee-layer attach → two-lane comparison → one delayed-path conclusion → small source strip.
- **NUMBER / CHART SEQUENCE:** Categorical relationship only; no percent, rate, or fabricated axis.
- **SUBTITLE_ZONE:** Lower safe caption zone.
- **KEY_CAPTION:** `잔액은 다음 달로`.
- **TRANSITION_IN:** The token from Scene 02 remains in next month.
- **TRANSITION_OUT:** Attached layer splits into Scene 04's exact 100/20/80 evidence board.
- **CONTINUITY_FROM_PREVIOUS:** Emotional shift from curiosity to concern.
- **CONTINUITY_TO_NEXT:** Concern motivates the demand for a concrete official example.
- **CHARACTER_ASSETS_REQUIRED:** neutral, relief, worried, head-shake, open-hand explanation, look-at-number.
- **BACKGROUND_ASSETS_REQUIRED:** continuation desk, cool light pass, calendar layers.
- **PROP_ASSETS_REQUIRED:** existing token, page layer.
- **RENDERER_GRAPHICS_REQUIRED:** relationship comparison, fee attachment, source strip, subtitles.
- **SOURCE_VISUAL_REQUIRED:** YES — small evidence strip.
- **GENERATION_REQUIRED:** YES — later character-master binding and background composite.

### Scene 04

- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:04`
- **DURATION_TARGET:** 9.964s, revision-6 subtitle-plan target.
- **NARRATIVE_FUNCTION:** Evidence peak — the character follows the official amount split and sees what carries forward.
- **VOICEOVER_CURRENT:** 공식 예시처럼 카드값이 100만 원이고 약정결제비율이 20%라면, 이번 달 20만 원을 내고 80만 원이 이월됩니다. 여기에 다음 달 새 사용액과 이월 수수료가 겹칠 수 있습니다.
- **VOICEOVER_PROPOSED:** 공식 예시로 볼게요. 카드값 100만 원에 결제비율이 20%면, 이번 달엔 20만 원을 내고 80만 원은 이월됩니다. 다음 달 새 사용액과 수수료까지 겹칠 수 있어요.
- **FACT / CLAIM:** Official 100만 원 bill; 20% agreed ratio; 20만 원 paid; 80만 원 carried. A new use and fee may overlap next month.
- **SOURCE / EVIDENCE:** `claim:revolving-example`, number refs 100만/20%/20만/80만; FSC 2024 and 2022 card news.
- **BACKGROUND:** Abstract but warm 3D finance worktable with physical blank blocks, deliberately uncluttered; no text or amounts in generated material.
- **PRIMARY_VISUAL:** Deterministic central split board: 100만 원 → 20% marker → 20만 원 납부 + 80만 원 이월. Character is smaller at lower edge because evidence has priority.
- **SECONDARY_VISUAL:** The carried 80 lane continues to a next-month container. `새 사용액` and `이월 수수료` may appear only as translucent conditional labels because the canonical narration says they *may* overlap; they do not represent an observed event, an amount, or an accumulated balance fact.
- **CHARACTER_START_POSE:** Lower-left, side orientation beside the evidence board.
- **CHARACTER_START_EXPRESSION:** Focused/calculating.
- **CHARACTER_ACTION_1:** Looks at the 100 block and counts with one hand.
- **CHARACTER_ACTION_2:** Tracks the 20/80 split with a full gaze/torso turn.
- **CHARACTER_ACTION_3:** Reacts with concerned realization as the 80 lane reaches next month.
- **CHARACTER_END_POSE:** Right 3/4, open hand toward the carry lane without overlapping values.
- **CHARACTER_END_EXPRESSION:** Realization.
- **GAZE_DIRECTION:** 100 center → 20 left branch → 80 right branch → next-month container.
- **PROP_INTERACTION:** Character gestures near, but never covers, the renderer-drawn numeric board.
- **CAMERA_START:** Wide evidence composition.
- **CAMERA_MOVEMENT:** Controlled push to 100/20/80 split, then lateral follow of the 80 lane.
- **CAMERA_END:** Pull back to show next-month overlap.
- **OVERLAY_SEQUENCE:** Source strip → 100만 label → 20% decision marker → exact split → possible next-month layer labels → key caption.
- **NUMBER / CHART SEQUENCE:** Exact canonical values only: 100만, 20%, 20만, 80만.
- **SUBTITLE_ZONE:** Lower safe caption zone.
- **KEY_CAPTION:** `100만 원 → 20만 원 납부 · 80만 원 이월`.
- **TRANSITION_IN:** Scene 03's attached layer resolves into a measurable board.
- **TRANSITION_OUT:** The 80 lane curves into the repeating path of Scene 05.
- **CONTINUITY_FROM_PREVIOUS:** Concern becomes proof-driven understanding.
- **CONTINUITY_TO_NEXT:** The carried lane motivates comparison of finite instalments with repeating carryover.
- **CHARACTER_ASSETS_REQUIRED:** side, calculating, look-at-number, realization, explain-chart.
- **BACKGROUND_ASSETS_REQUIRED:** 3D worktable, neutral blocks, depth layers.
- **PROP_ASSETS_REQUIRED:** abstract blank blocks only; numbers are renderer graphics.
- **RENDERER_GRAPHICS_REQUIRED:** split board, 100/20/80 labels, 20% marker, next-month layer, source strip, subtitles.
- **SOURCE_VISUAL_REQUIRED:** YES — source strip and number provenance.
- **GENERATION_REQUIRED:** YES — later character-master binding and 3D environment composite.

### Scene 05

- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:05`
- **DURATION_TARGET:** 7.068s, revision-6 subtitle-plan target.
- **NARRATIVE_FUNCTION:** Comparison — the character contrasts a visible finish with a recurring carry path.
- **VOICEOVER_CURRENT:** 할부는 갚는 기간이 정해져 있지만, 리볼빙은 이월이 반복될 수 있습니다. 그래서 상환 종료 시점이 흐려지기 쉽습니다.
- **VOICEOVER_PROPOSED:** 할부는 갚는 기간이 정해져 있죠. 반면 리볼빙은 이월이 반복될 수 있습니다. 그래서 언제 잔액이 끝나는지 흐려지기 쉬워요.
- **FACT / CLAIM:** Instalments have a set repayment period; revolving carryover can repeat and obscure the end point.
- **SOURCE / EVIDENCE:** `claim:revolving-example`; FSC 2024 and 2022 card news.
- **BACKGROUND:** The Scene 04 worktable opens into two connected floor paths: a short, calm finite route on left and a curved recurring route fading toward frame-right.
- **PRIMARY_VISUAL:** Character steps between the two routes and physically compares their ending behavior.
- **SECONDARY_VISUAL:** Renderer draws a finite end marker on the left and repeating carry nodes on the right; no invented repayment duration.
- **CHARACTER_START_POSE:** Back/side three-quarter, following Scene 04's 80 lane.
- **CHARACTER_START_EXPRESSION:** Concerned.
- **CHARACTER_ACTION_1:** Points left at a visible end marker.
- **CHARACTER_ACTION_2:** Turns right and watches repeated nodes extend once more.
- **CHARACTER_ACTION_3:** Thinking pose, then a worried glance at the viewer.
- **CHARACTER_END_POSE:** Front 3/4 centered between the two paths.
- **CHARACTER_END_EXPRESSION:** Thoughtful-concerned.
- **GAZE_DIRECTION:** left end → right loop → viewer.
- **PROP_INTERACTION:** No hand-held prop; character uses paths as spatial evidence.
- **CAMERA_START:** Follow behind the character.
- **CAMERA_MOVEMENT:** Lateral comparison pan.
- **CAMERA_END:** Medium reaction close-up between routes.
- **OVERLAY_SEQUENCE:** `기간 고정` left label → repeating-node reveal right → concise contrast card → small source strip.
- **NUMBER / CHART SEQUENCE:** Timeline/route only; no duration or rate number.
- **SUBTITLE_ZONE:** Lower safe caption zone.
- **KEY_CAPTION:** `할부는 기간 고정 · 리볼빙은 반복 가능`.
- **TRANSITION_IN:** Carried lane becomes the right route.
- **TRANSITION_OUT:** Character's thinking pose picks up the magnifier in Scene 06.
- **CONTINUITY_FROM_PREVIOUS:** Evidence answer becomes life impact.
- **CONTINUITY_TO_NEXT:** Uncertainty motivates direct personal-condition verification.
- **CHARACTER_ASSETS_REQUIRED:** back, side, point-left, point-right, thinking, worried.
- **BACKGROUND_ASSETS_REQUIRED:** connected two-route environment, finite marker, repeated-node path.
- **PROP_ASSETS_REQUIRED:** none beyond deterministic route markers.
- **RENDERER_GRAPHICS_REQUIRED:** timeline nodes, finite marker, comparison labels, source strip, subtitles.
- **SOURCE_VISUAL_REQUIRED:** YES — compact source strip.
- **GENERATION_REQUIRED:** YES — later character-master binding and environmental composite.

### Scene 06

- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:06`
- **DURATION_TARGET:** 6.512s, revision-6 subtitle-plan target.
- **NARRATIVE_FUNCTION:** Investigation — the character learns that the applicable rate must be checked, not assumed.
- **VOICEOVER_CURRENT:** 수수료율은 사람마다 다릅니다. 내 비율은 카드 대금명세서나 카드사 홈페이지에서 직접 확인해야 합니다.
- **VOICEOVER_PROPOSED:** 수수료율은 모두 같지 않습니다. 내 비율은 카드 대금명세서나 카드사 홈페이지에서 직접 확인해 보세요.
- **FACT / CLAIM:** Individual conditions can differ; statement and card-company guidance are the verification destinations.
- **SOURCE / EVIDENCE:** `claim:revolving-action`; FSC 2024/2022.
- **BACKGROUND:** Same environment returns to the desk; page and laptop are present, but all screens/paper are deliberately unreadable.
- **PRIMARY_VISUAL:** Character uses a magnifier-like inspection pose across statement then laptop, discovering two valid places to check.
- **SECONDARY_VISUAL:** Deterministic two-step overlay: `카드 대금명세서` → `카드사 홈페이지`.
- **CHARACTER_START_POSE:** Side, holding the generic statement from Scene 01.
- **CHARACTER_START_EXPRESSION:** Thinking.
- **CHARACTER_ACTION_1:** Inspects statement field with focused eyes.
- **CHARACTER_ACTION_2:** Pivots to the laptop and checks it.
- **CHARACTER_ACTION_3:** Recognition nod toward the two-step overlay.
- **CHARACTER_END_POSE:** Right 3/4, one finger indicating the check order.
- **CHARACTER_END_EXPRESSION:** Realization.
- **GAZE_DIRECTION:** statement down-left → laptop right → overlay center → viewer.
- **PROP_INTERACTION:** Statement and computer only; no fake rate or website.
- **CAMERA_START:** Close desk detail.
- **CAMERA_MOVEMENT:** Short rack-focus from statement to laptop.
- **CAMERA_END:** Clean two-destination frame.
- **OVERLAY_SEQUENCE:** “conditions differ” caption → statement highlight outline → website highlight outline → source strip.
- **NUMBER / CHART SEQUENCE:** None; rate is intentionally not represented as a number.
- **SUBTITLE_ZONE:** Lower safe caption zone.
- **KEY_CAPTION:** `내 수수료율은 명세서에서`.
- **TRANSITION_IN:** Magnifier is motivated by Scene 05 uncertainty.
- **TRANSITION_OUT:** Magnifier lowers onto Scene 07's written plan.
- **CONTINUITY_FROM_PREVIOUS:** The character moves from concern to investigation.
- **CONTINUITY_TO_NEXT:** Verified information enables a conservative plan.
- **CHARACTER_ASSETS_REQUIRED:** side, thinking, check-bill, check-computer, realization, point-right.
- **BACKGROUND_ASSETS_REQUIRED:** continuous desk, unreadable statement, generic laptop.
- **PROP_ASSETS_REQUIRED:** statement, laptop, optional magnifier motif.
- **RENDERER_GRAPHICS_REQUIRED:** two-step check overlay, source strip, subtitles.
- **SOURCE_VISUAL_REQUIRED:** YES — small guidance strip.
- **GENERATION_REQUIRED:** YES — later character-master binding and desk composite.

### Scene 07

- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:07`
- **DURATION_TARGET:** 6.957s, revision-6 subtitle-plan target.
- **NARRATIVE_FUNCTION:** Action — the character turns verified information into a modest plan, not a miracle outcome.
- **VOICEOVER_CURRENT:** 이미 사용 중이라면 새 결제를 줄이고, 가능한 범위에서 결제비율을 높여 단기간에 잔액을 줄이는 계획부터 세우세요.
- **VOICEOVER_PROPOSED:** 이미 리볼빙을 쓰고 있다면, 새 결제부터 줄여 보세요. 가능한 범위에서 결제비율을 높이고, 이월잔액을 줄이는 계획을 세우는 게 먼저입니다.
- **FACT / CLAIM:** Reduce new spending and make a feasible plan to reduce carried balance; no guaranteed payoff speed.
- **SOURCE / EVIDENCE:** `claim:revolving-action`; FSC 2024/2022.
- **BACKGROUND:** The same desk is brighter morning light. Character has a blank notebook and the card is being put away, linking action to the earlier payment setting.
- **PRIMARY_VISUAL:** Character makes a three-step plan with deliberate hand actions: put card away → consider payment ratio → reduce carried balance.
- **SECONDARY_VISUAL:** Three renderer checklist cards; neutral descending balance indicator with no numeric promise.
- **CHARACTER_START_POSE:** Right 3/4, magnifier lowered from Scene 06.
- **CHARACTER_START_EXPRESSION:** Calm realization.
- **CHARACTER_ACTION_1:** Places card into wallet/side tray.
- **CHARACTER_ACTION_2:** Opens notebook and compares two blank plan columns.
- **CHARACTER_ACTION_3:** Makes a confident, modest check gesture at final task.
- **CHARACTER_END_POSE:** Front 3/4, looking at completed plan.
- **CHARACTER_END_EXPRESSION:** Confident but not celebratory.
- **GAZE_DIRECTION:** card → notebook → checklist → viewer.
- **PROP_INTERACTION:** Card is put away; notebook receives renderer checklist overlay.
- **CAMERA_START:** Follow card placement.
- **CAMERA_MOVEMENT:** Reframe to overhead notebook composition.
- **CAMERA_END:** Modest push to final check.
- **OVERLAY_SEQUENCE:** `새 결제 줄이기` → `결제비율 검토` → `이월잔액 줄이기` → neutral down marker → source strip.
- **NUMBER / CHART SEQUENCE:** Ordered checklist only; no payoff chart, cash stack, or promise.
- **SUBTITLE_ZONE:** Lower safe caption zone.
- **KEY_CAPTION:** `새 결제 줄이고 잔액 낮추기`.
- **TRANSITION_IN:** Scene 06 verification results become notebook inputs.
- **TRANSITION_OUT:** Final checklist mark opens Scene 08's statement check.
- **CONTINUITY_FROM_PREVIOUS:** Investigation turns into agency.
- **CONTINUITY_TO_NEXT:** Action closes by returning to concrete statement fields to monitor.
- **CHARACTER_ASSETS_REQUIRED:** right 3/4, check-bill, compare-choices, calculate, confident, final-explanation.
- **BACKGROUND_ASSETS_REQUIRED:** bright desk continuity, notebook, side tray.
- **PROP_ASSETS_REQUIRED:** card, wallet/tray, blank notebook, pen.
- **RENDERER_GRAPHICS_REQUIRED:** three checklist cards, neutral balance marker, source strip, subtitles.
- **SOURCE_VISUAL_REQUIRED:** YES — compact action guidance strip.
- **GENERATION_REQUIRED:** YES — later character-master binding and desk composite.

### Scene 08

- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:08`
- **DURATION_TARGET:** 8.517s, revision-6 subtitle-plan target.
- **NARRATIVE_FUNCTION:** Resolution — the character turns toward the viewer with the exact three checks and safe help route.
- **VOICEOVER_CURRENT:** 오늘 명세서에서 일부결제금액이월약정, 이월잔액, 적용 수수료율 세 항목을 확인하세요. 모르면 카드사에 해지를 포함한 상환 방법을 문의하세요.
- **VOICEOVER_PROPOSED:** 오늘 명세서에서 세 가지만 확인하세요. 일부결제금액이월약정, 이월잔액, 적용 수수료율입니다. 헷갈리면 카드사에 상환이나 해지 방법을 물어보세요.
- **FACT / CLAIM:** Check formal agreement, carried balance, and applicable fee rate; ask card company about repayment/cancellation when unclear.
- **SOURCE / EVIDENCE:** `claim:revolving-action`; FSC 2024/2022.
- **BACKGROUND:** Same desk at morning window. The envelope from Scene 01 is fully open, creating a closed narrative loop.
- **PRIMARY_VISUAL:** Character checks three deterministic statement callouts, then turns from the document to address the viewer directly.
- **SECONDARY_VISUAL:** Three-item check card followed by a small `상환·해지 방법 문의` help card.
- **CHARACTER_START_POSE:** Over-shoulder/side, looking at open statement.
- **CHARACTER_START_EXPRESSION:** Focused and calm.
- **CHARACTER_ACTION_1:** Marks first and second check locations through gaze/hand movement.
- **CHARACTER_ACTION_2:** Marks the third location, then sets pen down.
- **CHARACTER_ACTION_3:** Turns front 3/4 with open-hand final explanation to viewer.
- **CHARACTER_END_POSE:** Front, eyes to viewer.
- **CHARACTER_END_EXPRESSION:** Calm confidence/light smile.
- **GAZE_DIRECTION:** statement items top-to-bottom → help card → viewer.
- **PROP_INTERACTION:** Same envelope/statement from Scene 01, now opened; no readable financial document content.
- **CAMERA_START:** Detail on open envelope.
- **CAMERA_MOVEMENT:** Vertical check progression.
- **CAMERA_END:** Slow pull back to direct-to-viewer ending frame.
- **OVERLAY_SEQUENCE:** source strip → three statement checks one by one → help card → closing key caption.
- **NUMBER / CHART SEQUENCE:** Three named fields only; no rate or amount is fabricated.
- **SUBTITLE_ZONE:** Lower safe caption zone.
- **KEY_CAPTION:** `명세서 세 항목 확인`.
- **TRANSITION_IN:** Scene 07 check mark becomes the first statement check.
- **TRANSITION_OUT:** Calm final hold; no auto-publish or CTA beyond the canonical safe action.
- **CONTINUITY_FROM_PREVIOUS:** The plan returns to a repeatable real-world monitoring action.
- **CONTINUITY_TO_NEXT:** Story closes with the same envelope, transformed from confusion to informed checking.
- **CHARACTER_ASSETS_REQUIRED:** side, check-bill, final-to-viewer, confident/light smile, open-hand explanation.
- **BACKGROUND_ASSETS_REQUIRED:** morning desk, window light, opened envelope, generic statement.
- **PROP_ASSETS_REQUIRED:** envelope, statement, pen.
- **RENDERER_GRAPHICS_REQUIRED:** three item callouts, help card, source strip, subtitles, closing caption.
- **SOURCE_VISUAL_REQUIRED:** YES — compact source strip.
- **GENERATION_REQUIRED:** YES — later character-master binding and scene composite.

## G. Scene continuity matrix

| Pair | Character / prop carry | Emotional carry | Camera and transition motivation |
| --- | --- | --- | --- |
| 01 → 02 | Phone lowers beside envelope; rightward gaze continues to calendar pages. | Relief becomes curiosity. | Scene 01 calendar edge match-cuts to Scene 02's two-month desk. |
| 02 → 03 | Payment token has landed in next month and receives an extra translucent layer. | Curiosity becomes concern. | Top-down token landing becomes fee-layer attachment. |
| 03 → 04 | Delayed route becomes the exact official split board. | Concern asks for proof. | Pull-back from comparison gives room for 100/20/80 evidence. |
| 04 → 05 | 80 carried lane curves into a repeating path. | Understanding becomes practical worry. | Lateral follow on carry lane opens the two-route comparison. |
| 05 → 06 | Thinking pose picks up the inspection/stated-condition task. | Worry becomes investigation. | Reaction close-up rack-focuses into desk statement/laptop. |
| 06 → 07 | Magnifier lowers; verified fields become inputs to a notebook. | Investigation becomes agency. | Statement close-up match-cuts to notebook planning surface. |
| 07 → 08 | Final plan check becomes first actual statement check; same envelope returns opened. | Agency becomes calm confidence. | Overhead checklist shifts to vertical statement callouts, then direct-to-viewer pullback. |

## H. Character-performance matrix

| Scene | Emotional beat | Meaningful states | Character priority |
| --- | --- | --- | --- |
| 01 | temporary relief → surprise | phone relief, envelope notice, wait gesture | reaction 40–50% |
| 02 | curiosity | carry token, trace movement, point landing | narrative 30–35% |
| 03 | relief crack → concern | nod, fee notice, head shake/open hand | narrative 30–40% |
| 04 | concern → realization | calculate, follow split, explain carry lane | evidence 15–25% |
| 05 | compare / uncertainty | point left, turn right, thinking | narrative 30–35% |
| 06 | investigation → realization | inspect bill, inspect computer, recognition point | narrative 25–35% |
| 07 | agency | put card away, compare plan, modest check | narrative 30–40% |
| 08 | confidence | check three items, turn, explain to viewer | narrative 30–35% |

## I. Camera and motion bible

### Character vocabulary

- subtle idle breathing/bob only while listening or thinking;
- pose cross-cut for a genuine emotional state change;
- gaze shift before a new fact is revealed;
- torso/hand emphasis for a relationship or action, never random bouncing;
- foreground prop interaction for phone, envelope, calendar, token, statement, laptop, notebook, card;
- scale shift only for Scene 01 reaction and Scene 04 evidence de-emphasis.

### Camera vocabulary

- Scene 01: reaction push-in and rightward reframe.
- Scene 02: lateral token follow and top-down landing.
- Scene 03: reaction close-up then pull-back comparison.
- Scene 04: evidence push, branch follow, wide overlap view.
- Scene 05: follow-behind then lateral compare pan.
- Scene 06: rack-focus between statement and laptop.
- Scene 07: hand-follow to overhead plan.
- Scene 08: vertical checklist progression then final pull-back.

### Editorial motion vocabulary

- hook card reveal; carry connector; split reveal; amount transfer; exact number count; stack/overlap; finite/repeating timeline; statement highlight sweep; checklist step-down; source-strip reveal.
- Each scene uses a different primary combination. Repeating `slow zoom + subtitle` is forbidden.

### Pose-transition requirement

Every meaningful character-state change must be realized by one of: an approved discrete pose cross-cut timed to a gaze/prop change; a rig-driven tween only when the later master-asset library explicitly supports that transition; or a short dissolve between two approved poses while camera/foreground motion also changes. A dissolve or camera push over one unchanged character pose does not count as performance. The future renderer must record the chosen transition mechanism per character state change.

### Parallax rule

Background, character, and foreground prop must be separately controllable when the future renderer can support it. Scene 04 evidence board remains on top of the environmental depth stack; character never crosses numeric labels or subtitle safe zone.

## J. Visual asset requirements

| Asset group | Required before generation/render | Status in PA-5B2 |
| --- | --- | --- |
| Character master reference | One approved master image or equivalent locked identity binding; all 28 planned reusable assets derive from it. | `PENDING_OWNER_ASSET_BINDING` |
| Eight scene composites/backgrounds | One scene-specific character/environment/prop composition or controllable layer set per scene. | `PLANNED_NOT_GENERATED` |
| Prop continuity set | Smartphone, generic card, envelope/statement, calendar pages, token, laptop, notebook, pen. | `PLANNED_NOT_GENERATED` |
| Evidence graphics | Source strips; exact 100/20/80 split; routes, comparisons, checklists, highlights. | `RENDERER_REQUIRED_NOT_IMPLEMENTED` |

Generated imagery must not create readable paper, site, card, logo, number, or chart. If a future scene image fails character identity, pose, prop, or quality checks, only that scene is eligible for a separately approved regeneration rule; no local placeholder replacement is allowed.

## K. Renderer-graphics requirements

1. Audio-aligned subtitle layer in lower safe caption zone, updated only from final provider timestamps.
2. Source identity strips for factual scenes; metadata only, no fake screenshot.
3. Exact number/relationship graphic for Scene 04; categorical relationship overlay for Scene 03; comparison/timeline/checklist graphics where specified.
4. Character/evidence z-order policy: charts, numbers, source strips, and subtitles never sit behind or under the character.
5. Scene transitions must preserve the explicit continuity matrix rather than hard-resetting to an unrelated card.
6. New renderer input must bind character-master identity, selected scene asset identity, canonical source/claim identity, narration/voice-plan identity, and graphic plan. This packet does not implement that renderer.

## L. Narration-improvement proposals

| Scene | Canonical voice | Proposed spoken correction | Reason |
| --- | --- | --- | --- |
| 01 | `...안심하기 전에...확인해야 합니다.` | `그럼 끝난 걸까요. 아닙니다...이월잔액부터 보세요.` | Hook question/answer and conversational end. |
| 02 | Formal definition + `방식입니다.` | `정식 이름은...이번 달 일부만 내면...넘어가죠.` | Keeps term, reduces report tone. |
| 03 | `장점은 있지만...붙습니다.` | `도움이 될 수 있습니다. 하지만...붙어요.` | Keeps qualification, varies cadence. |
| 04 | Full official-example sentence | `공식 예시로 볼게요...겹칠 수 있어요.` | Turns numbers into walkthrough; no fact change. |
| 05 | `정해져 있지만...쉽습니다.` | `정해져 있죠. 반면...쉬워요.` | Clear contrast and spoken ending. |
| 06 | `사람마다 다릅니다...확인해야 합니다.` | `모두 같지 않습니다...확인해 보세요.` | Retains individual-condition safety. |
| 07 | `단기간에...세우세요.` | `새 결제부터 줄여 보세요...계획을 세우는 게 먼저입니다.` | Removes implicit speed promise and stays practical. |
| 08 | Long three-field sentence | `세 가지만 확인하세요...물어보세요.` | Easier spoken closure, same safe action. |

These are proposals only. The canonical revision-6 narration remains authoritative until Owner approval.

## M. Future topic-selection gate

**Pass only when all are true:**

1. Material effect on household money, work, debt, savings, consumption, housing, insurance/pension, bills, or a financial decision.
2. A real curiosity/knowledge gap beyond a generic saving tip or news summary.
3. At least one authoritative or primary evidence path for the central claim.
4. A visual mechanism: situation, object interaction, comparison, chart, timeline, process, or decision—not narration alone.
5. A practical “why it matters to me” conclusion without a buy/sell recommendation or success promise.
6. A 1–3 second genuine hook that does not exaggerate or conceal the central fact.

Preferred families: inflation, rates, exchange rates, wages/employment, consumer spending, credit/debt, housing cost, savings/insurance/pension, policy changes, household bills, industry/company structural signals, behavioural economics, consumer psychology, and ordinary-choice economic structures.

Reject or hold: generic saving tips, simple news recaps, obvious/common knowledge, unsupported success advice, stock buy/sell calls, weak-evidence topics, and narration-only topics.

## N. Final quality-acceptance rubric

Every future candidate is reviewed per scene and as a full sequence. Technical MP4 validity is not an editorial pass.

| Gate | Pass condition |
| --- | --- |
| Topic quality | `STRONG` or `ACCEPTABLE`; a weak topic returns to Owner with an improvement proposal. |
| Evidence quality | Every major claim maps to canonical source and appropriate visual use; no fake screenshot/number/rate. |
| Character performance | Protagonist visibly reacts/acts, has meaningful state changes, and never behaves as a pasted sticker. |
| Visual quality | With narration/subtitles muted, the situation remains broadly understandable; distinct scenes do not collapse to card slides. |
| Continuity | Identity, props, gaze, emotion, camera motivation, and transitions match the continuity matrix. |
| Voice quality | 준호/Yohan Koo target settings and approved spoken script; no flat report cadence. |
| Watchability | Hook, causal progression, evidence clarity, visual change density, pacing, subtitle readability, and conclusion all pass. |

### PA-5B2 non-execution record

- ChatGPT image generation: `0`
- Other image/video provider: `0`
- ElevenLabs: `0`
- Final render: `0`
- Publish / push: `0`

## Owner decision gate

No image generation, TTS regeneration, renderer work, or canonical overwrite is authorized by this document alone.

> 이 주제·근거자료·8개 Scene 시각설계·캐릭터 연기·카메라/모션·대본 수정안을 실제 제작 기준으로 승인하시겠습니까?

Owner options: `A. 전체 승인` / `B. 주제 수정` / `C. Scene 일부 수정` / `D. 캐릭터 연기 수정` / `E. 시각자료 수정` / `F. 대본/음성 수정`.
