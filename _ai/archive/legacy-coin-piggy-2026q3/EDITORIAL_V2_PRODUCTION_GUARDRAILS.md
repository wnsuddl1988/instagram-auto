# Editorial V2 Production Guardrails v1

## Purpose and scope

This is the durable production baseline for Shorts Editorial OS V2. It applies prospectively to Coin production scenes and does not rewrite approved historical evidence. A scene may provide its own object mapping and normalized safe-frame values in the Blender scene property `EDITORIAL_V2_GUARDRAILS_V1`; those mappings are scene-specific evidence, not global coordinates.

## Rule classes

| Class | Meaning |
| --- | --- |
| GLOBAL RULE | Required production rule across all applicable Editorial V2 scenes. |
| SCENE-SPECIFIC RULE | Local object mapping, timing, or approved composition contract. |
| NON-BLOCKING PREFERENCE | Quality preference; record it in review but do not fail a technical gate by itself. |

## Global rules

| ID | Rule | Class | Enforcement in v1 |
| --- | --- | --- |
| GR-CHAR-001 | The approved Coin identity, silhouette, signature accessories, and established character treatment remain recognizably continuous. | GLOBAL RULE | Visual review |
| GR-MOUTH-001 | Every rendered frame has exactly one valid mouth state visible. Silent scenes use the approved REST_SMILE default unless a separately approved state schedule exists. | GLOBAL RULE | Automated |
| GR-MOUTH-002 | R1-reconstructed mouth geometry is locked. Scene work may not alter its shape, position family, materials, or state construction without a separately authorized mouth slice. | GLOBAL RULE | Source/diff review |
| GR-UI-001 | Visible text and a visible semantic symbol/arrow must have empty projected bounding-box intersection. | GLOBAL RULE | Automated |
| GR-UI-002 | Independently readable visible cards/panels must have empty projected bounding-box intersection. | GLOBAL RULE | Automated |
| GR-UI-003 | Text must retain a reusable internal card-padding baseline: at least `max(2.5% of card width, 24px at 1080px)` on the constrained side, with exceptions documented in the scene mapping. | GLOBAL RULE | Semi-automated + visual review |
| GR-UI-004 | Sequential cards in the same visible stack must preserve a vertical gap of at least `max(2.0% of frame height, 12% of the smaller card height)` unless the composition is explicitly a connected diagram. | GLOBAL RULE | Semi-automated + visual review |
| GR-UI-005 | Place supporting semantic UI in available negative space before moving it toward Coin’s face, hands, or primary line of action. | GLOBAL RULE | Visual review |
| GR-UI-006 | UI remains a supporting narrative device; it must not dominate Coin, the narrative action, or the frame’s primary read. | GLOBAL RULE | Visual review |
| GR-UI-007 | Critical narration or semantic text must not be obscured by the production character or a foreground prop. Any projected intersection between a mapped critical text glyph region and a mapped foreground exclusion region is a failure. | GLOBAL RULE | Automated when mapped + visual review |
| GR-FINAL-001 | The final two frames must show the approved terminal state only: required terminal UI visible, obsolete earlier UI absent, and no accidental keyframe reappearance. | GLOBAL RULE | Automated |
| GR-SCENE-001 | A canonical scene’s approved story/timing, source locks, and owner-approved outputs may be changed only by an explicitly authorized recovery slice. | GLOBAL RULE | Source/diff review |
| GR-TYPE-001 | Text objects sharing one semantic role in a scene/family must use their approved common style tokens: font identity, native weight, size tier, alignment, text material, and card family/padding class. Roles may deliberately differ. | GLOBAL RULE | Semi-automated + visual review |
| GR-TYPE-002 | Every required visible character, including Korean, currency/percentage marks, arrows, and mathematical operators, must resolve in the selected local font before final render. Missing-glyph/replacement-box/tofu output is a failure. | GLOBAL RULE | Deterministic font-cmap preflight + visual review |
| GR-TYPE-003 | Narratively important Data Overlay text must have sufficient visual strength against its local background, not merely non-overlap: approved font/weight, mapped minimum size tier, contrast threshold, and zero mapped character/card collision. Important text must retain a crisp glyph silhouette at phone scale: excessive text extrusion, bevel, and duplicate shadow treatments are prohibited. | GLOBAL RULE | Deterministic mapped token/size/contrast/collision checks where available + visual review |
| GR-SUB-001 | Narrated Shorts scenes require a Narration Subtitle layer unless explicitly waived by Owner. It must be derived from the locked audio’s actual phrase boundaries, directly overlaid on the scene (not a semantic data card), max two lines, safe-frame-contained and no-clipping, and zero overlap with character, hands/foreground, and critical semantic UI. It must use the approved heavy-caption visual family, balanced centered lower composition by default, event-scoped semantic highlight colors (maximum two), and remain visually distinct from Data Overlay roles. A critical financial compound term must not cross a caption-event boundary when term metadata is supplied; a line break within one visible event is allowed. This is SEMI_AUTOMATABLE and remains subject to Owner/ChatGPT review where terminology metadata is incomplete. A final narrated-scene gate requires: source/events, locked-audio timing evidence, Golden token match, executed burn-in, raster subtitle-pixel proof, role separation, safe-area validation, collision validation, and Owner/ChatGPT visual-family review. ASS/source metadata alone is insufficient, and automated checks cannot override visual mismatch. | GLOBAL RULE | Per-frame audio-timed subtitle mapping + direct-overlay/style/safe-region/clipping/character/hand/critical-UI checks + term-integrity check when supplied + raw-vs-burned representative-pixel proof + visual review |
| GR-BG-001 | Across a multi-scene narrated short, environment/background treatment must provide sufficient scene-level variation to avoid repetitive monotony while preserving character identity and readability. A production recovery requires at least two meaningful axes among backdrop structure, contextual props, lighting/depth, or framing; a flat tint/panel/decorative line is insufficient. | GLOBAL RULE | Local required-axis evidence + visual review; escalate `BACKGROUND_AI_ASSET_REQUIRED` if local Blender cannot meet the gate |
| GR-AUDIO-001 | When narration is enabled, delivery must remain perceptually continuous with the approved recurring voice reference; voice identity, wording, and model changes require their own authorization. | GLOBAL RULE | Audio review |
| GR-AUDIO-002 | Core financial/economic narration terms must remain semantically unambiguous when heard without relying on on-screen text. Plausible homophones, pronunciation ambiguity, or ASR/listener interpretations that materially change financial meaning require a wording correction or explicit Owner approval. | GLOBAL RULE | Semi-automated + human audio review |

## Scene configuration contract

The reusable checker reads each scene’s `EDITORIAL_V2_GUARDRAILS_V1` JSON property. It may define mouth-state object groups, UI safe-frame bounds, card pairs, text/symbol pairs, subtitle phrase groups/exclusions, explanatory-emphasis tokens, background-enrichment evidence, and terminal required/obsolete groups. The mapping identifies semantic roles by object name; it must not promote one scene’s coordinates or card dimensions into a global rule.

For any new or recovered scene, the production script must establish this mapping before full render and invoke `scripts/editorial_v2/visual_guardrails.py` against the saved `.blend`.

## Fast Production Loop V1

Future Coin scenes use `FAST_PRODUCTION_LOOP_V1` by default. First establish the canonical package without rendering. Next render only four to six full-resolution representative layout frames (opening, early/middle/late/final beats and an optional collision-risk beat) with final environment, Coin framing, Data Overlay, and future subtitle safe-zone planning. Owner + ChatGPT must approve this layout proof before narration production. After one bounded TTS/final-delivery approval, produce one integrated final AV render containing acting, lip-sync, Data Overlay timing, Golden Subtitle burn-in, and audio mux. A full silent MP4 before layout approval is not the default; only a verified localized regression may receive a later correction render.

Data Overlay quality is SEMI_AUTOMATABLE plus Owner/ChatGPT visual review. A clean bounding-box result alone is insufficient: each beat must use a role-based hierarchy of one primary header, one primary result/action block, and at most one supporting label. Redundant simultaneous slabs are a failure of visual hierarchy even when they do not collide.

## Incident promotion: PA-5AD-R3A

| Observed local failure | Local recovery | Promoted reusable rule | v1 validation |
| --- | --- | --- | --- |
| `남은 결제대금 → 다음 달` had text/arrow collision risk. | Separate the three semantic elements and verify their projected bounding boxes. | GR-UI-001 | Text/symbol projected-BBox check |
| Continuity, carryover-balance, and fee cards read as a cramped stack. | Re-space the three-card group upward into safe negative space. | GR-UI-002, GR-UI-004, GR-UI-005 | Card-BBox check plus visual review |
| A later timing state could regress at the terminal frame. | Compare F179 and F180 required/obsolete UI sets. | GR-FINAL-001 | Automated terminal-frame check |
| A core term was acoustically ambiguous with a materially different financial term. | Replace only the ambiguous wording while retaining sentence meaning and locked voice settings. | GR-AUDIO-002 | Flag critical-term homophone risk where a maintained lexicon or ASR confidence signal supports it; otherwise require human audio review and do not claim deterministic coverage. |
| Critical explanatory copy was partially behind Coin’s foreground silhouette. | Relocate the complete semantic statement into the available right-side negative space, then compare mapped text and foreground projected bounds across the full frame range. | GR-UI-007 | Critical-text / foreground-exclusion projected-BBox check plus visual review. |
| Same-scene UI accumulated unrelated type treatments. | Define roles for formula, result, supporting explanation, mechanism operand, and conclusion; validate each shared token family. | GR-TYPE-001 | Scene typography-role token check plus visual review. |
| A required U+2212 subtraction glyph rendered as tofu in the chosen Korean font. | Use an already-local font with the complete required character map and preflight all visible strings. | GR-TYPE-002 | `glyph_coverage_preflight.py` cmap check plus rendered visual review. |
| A narrated scene omitted direct subtitles or used semantic-card styling, and important explanatory copy read as technically present but weak. | Separate Narration Subtitle from Data Overlay; map audio-timed subtitle phrases and role-based explanatory emphasis rather than relying on non-overlap alone. | GR-SUB-001, GR-TYPE-003 | Direct-overlay/timing/safe-region/collision check; Data Overlay token, size, contrast, and collision thresholds plus visual review. |
| Scene treatment repeated the same sparse environment across narration beats. | Require at least two meaningful local axes (structure, props, lighting/depth, framing) without changing recurring character or reducing readability; escalate only when local Blender proof cannot satisfy the visual gate. | GR-BG-001 | Required local axis evidence plus Owner/ChatGPT visual review. |

## Non-blocking preferences

- Prefer calm, clean 2D/2.5D editorial UI over decorative helper lines, redundant microcopy, or dashboard density.
- Prefer asymmetry and breathing room when they improve the Coin’s read.
- Use a manual visual gate for hierarchy, negative space, and character vitality even after automated checks pass.

## Feedback loop

1. Record the precise visual finding and its affected semantic role.
2. Apply the smallest authorized local correction.
3. Decide whether it is a recurring production failure. If yes, add or refine a GLOBAL RULE; otherwise retain it as a SCENE-SPECIFIC RULE or NON-BLOCKING PREFERENCE.
4. Add deterministic automation only when object-role mapping can make the result reliable; keep composition and identity judgment in the visual gate.
5. Do not let a new guardrail retroactively alter locked scenes without a separate authorization.
