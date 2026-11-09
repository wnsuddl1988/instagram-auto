# Shorts Editorial OS V2 — PA-5E Blender 3D Character Production Architecture + Local Feasibility Audit

> Status: `IMPLEMENTATION_DESIGN_COMPLETE_AWAITING_CLAUDE_READ_ONLY_REVIEW`  
> Scope: audit and architecture only. No Blender install, download, model creation, image/video generation, paid-provider call, commit, or push was performed.

## A. Local Hardware Audit

| Item | Observed local value | Assessment for this project |
| --- | --- | --- |
| OS | Windows 11 Home, 64-bit, version 10.0.26200 | Suitable |
| CPU | Intel Core i7-14700F, 20 cores / 28 logical processors | Strong local automation and fallback-render CPU |
| GPU | NVIDIA GeForce RTX 5060, driver 591.74 | Suitable for stylized EEVEE production |
| GPU VRAM | 8,151 MiB reported by NVIDIA utility | Enough for a compact mascot scene; keep geometry, textures, and render passes modest |
| System RAM | 16 GB | Workable, but avoid large photoreal environments and simultaneous heavy applications |
| C: free space | about 402 GB | Enough for `.blend`, caches, image sequences, and local previews when outputs are managed |
| FFmpeg | Available: 8.1.1 | Existing local composition/encoding boundary is available |
| Python | `python` 3.10.0; launcher default 3.14.4 | Blender ships its own Python; external Python is only for orchestration/tests |

## B. Blender Availability

- `BLENDER_INSTALLED: NO` — no `blender` CLI on PATH, no executable in the standard Blender Foundation program location, and no Blender uninstall-registration entry was found.
- `BLENDER_CLI_AVAILABLE: NO`.
- This audit does **not** install Blender or download any asset. After a future Owner-approved installation, the installed version, `blender --background --version`, EEVEE/Cycles availability, and NVIDIA device discovery must be checked again before implementation.

## C. Render Strategy

### Renderer decision

**Default: EEVEE.** The objective is a polished stylized mascot, readable acting, reliable alpha passes, and recurring daily production—not photorealism. On the observed RTX 5060, EEVEE is the practical default for 1080×1920 character passes and short previews.

| Path | Feasibility | Intended use |
| --- | --- | --- |
| EEVEE real-time renderer | Practical | Default character performance clips, alpha renders, simple set shadows, rapid review renders |
| Cycles GPU | Conditional | Occasional master/key-art frame or a small hero shot only, after actual Blender/NVIDIA-device validation |
| Cycles CPU | Possible but poor as default | Fallback only; not a daily Shorts renderer |

Initial performance policy:

- Animate and approve in 540×960 or 720×1280 previews; final character pass at 1080×1920 only after approval.
- Use EEVEE at 30 fps. Render only the 3D contribution; do not repeatedly render factual graphics, Korean text, subtitles, charts, or full editorial backgrounds in Blender.
- Cap initial character-pass complexity: one mascot, one phone/statement prop, low-poly stylized geometry, 1–2 shadow-catching planes, modest samples, and no volumetrics.

## D. Character Modeling Architecture

The authoritative reference remains `SHORTS_EDITORIAL_OS_V2_CHARACTER_MASTER.png`. The build recreates that same blue/purple rounded mascot; it does not redesign or substitute it.

| Area | Recommended structure |
| --- | --- |
| Body | One clean rounded main-body mesh with a stable blue/purple material gradient; keep silhouette broad and friendly |
| Head / face panel | Separate cyan face-panel surface so expression work does not deform the body |
| Eyes | Two separate large eye assemblies (white, iris/pupil, highlight, lid) rather than painted eyes |
| Three head tufts | Exactly three separate aqua tuft meshes, parented to the head and given restrained secondary rotation |
| Limbs | Separate simple tapered arm/leg meshes with cyan wrist/ankle accents; no unnecessary fingers or joints |
| Shoes | Separate sneaker-like shoe meshes with a stable silhouette and sole material |
| Torso motifs | Reusable mesh/UV decal planes or material masks for ascending bars and shield/check; never generated text |
| Topology | Low-to-medium density, deformation loops only at shoulder/hip/elbow/knee areas; smooth-shaded bevels for the toy-like 3D surface |

## E. Rig Architecture

Use one compact production armature, not a feature-film rig:

- Root → body/pelvis → upper-body → head hierarchy.
- Two arm and two leg IK chains with visible animator controls for hands and feet.
- One simple spine/body lean control, head aim control, and chest rotation control.
- Wrist/ankle controls; shoe meshes parented to foot bones.
- Three tuft bones, each with limited rotation and optional subtle delayed motion. Their count and color remain locked.
- A phone socket on each hand plus a chest-side temporary attachment socket. Props are constraint-attached, never manually baked into every animation.
- Control names, object names, action names, and exported manifest IDs must be stable and ASCII-safe for headless automation.

## F. Facial / Gaze Architecture

The simplest robust split is **bones/constraints for direction** and **small shape-key sets for expression**.

| Requirement | Implementation |
| --- | --- |
| Look left/right/up/down / look at prop | Eye-target empties plus tracking constraints; a head aim control supplies the supporting head turn |
| Blink | Lid shape keys with staggerable left/right timing; no texture swap |
| Mouth / expression | A small face-panel mouth mesh or shape keys: neutral, relief, curious, surprised, worried, thinking, realization, confident |
| Eye performance | Pupil target movement + eyelid shape keys + optional brow/upper-lid shapes; this provides readable reaction without a complex face rig |
| Phone attention | A named `LOOK_PHONE` target derived from the active phone prop; gaze is constrained, then layered with the selected expression |

Required reusable facial states: `NEUTRAL`, `RELIEF`, `CURIOUS`, `SURPRISED`, `WORRIED`, `THINKING`, `REALIZATION`, `CONFIDENT`. These are composable with blink and gaze; they are not separate full-body animation files.

## G. Motion Library

Start with sixteen reusable Actions, each authored in a neutral timing range and layered through NLA:

1. `IDLE_NEUTRAL`
2. `IDLE_RELIEF`
3. `LEAN_IN`
4. `LOOK_AROUND`
5. `LOOK_PHONE`
6. `HOLD_PHONE`
7. `POINT_LEFT`
8. `POINT_RIGHT`
9. `POINT_UP`
10. `OPEN_HAND_EXPLAIN`
11. `THINK`
12. `READ_STATEMENT`
13. `CHECK_RECEIPT`
14. `COMPARE_CHOICES`
15. `DISCOVERY_REACTION`
16. `WORRY_TO_REALIZATION_TO_VIEWER`

Composable tracks: facial expression, gaze target, blink timing, left/right hand gesture, phone attachment, torso lean, camera push/reframe, and prop visibility. This keeps a daily scene to selected reusable components rather than bespoke animation.

## H. Prop System

- Start with a generic smartphone, blank statement/envelope, blank receipt, calculator, and neutral card. No bank logo, sensitive document, or embedded factual text.
- Each prop has an origin, scale, material, and named attach points.
- Hand contact is handled by a hand socket plus a limited wrist offset; the first prototype deliberately avoids finger-level manipulation.
- Props may cast/receive shadows in Blender, while factual labels and numbers are added only in the deterministic local renderer.

## I. Blender Python Automation

Blender can be run headlessly through its standard background invocation (`blender --background <file> --python <script> -- <manifest>`). PA-5E does not execute it; this is the future contract.

```text
Shorts Editorial OS scene card
  -> Character Performance Plan
  -> versioned Blender Animation Manifest (JSON)
  -> Blender Python validates IDs and composes Actions/NLA/constraints
  -> transparent character clip or frame sequence
  -> local renderer adds controlled editorial layers
  -> final Shorts assembly
```

Minimal manifest shape:

```json
{
  "sceneId": "selected-angle:revolving-balance-not-erased:scene:01",
  "durationSeconds": 6.4,
  "actions": [
    { "from": 0.0, "to": 1.0, "id": "IDLE_RELIEF" },
    { "from": 1.0, "to": 2.4, "id": "LOOK_PHONE" },
    { "from": 2.5, "to": 3.2, "id": "DISCOVERY_REACTION" },
    { "from": 3.2, "to": 4.5, "id": "WORRY_TO_REALIZATION_TO_VIEWER" }
  ],
  "gaze": [{ "from": 1.0, "target": "LOOK_PHONE" }, { "from": 4.5, "target": "LOOK_VIEWER" }],
  "props": [{ "id": "PHONE_01", "attach": "HAND_RIGHT_SOCKET" }],
  "output": { "alpha": true, "fps": 30, "resolution": "1080x1920" }
}
```

The future Node/TypeScript boundary must use `spawn` with argument arrays (not a shell string), validate a closed manifest schema and allowlisted paths, set timeout/output-size limits, capture a sanitized job report, and write only ignored local render outputs. Blender Python must reject unknown action, prop, rig, or camera IDs before rendering.

## J. Renderer Integration

**Default production option: B — Blender renders the character with transparent alpha, then the existing local renderer composites the final Short.**

Why this is the default:

- Korean text, numbers, charts, sources, subtitles, arrows, and timeline claims remain exact and testable.
- Character animation remains reusable across many topics and backgrounds.
- A faulty character pass can be replaced without changing factual graphics.
- The local renderer keeps final pacing, captions, safe zones, and final encoding deterministic.

To avoid a pasted-character look, Blender should additionally emit soft contact-shadow/occlusion support and, when useful, a depth-compatible foreground prop. The compositor can add a matching ground shadow, foreground blur, camera motion, and parallax. Option A (complete character + environment) is reserved for rare establishing or high-emotion shots with a small reusable 3D set.

## K. Background Strategy

Recommended: **hybrid background system**.

| Layer | Default | Purpose |
| --- | --- | --- |
| Reusable 3D set pieces | Desk edge, lamp glow, floor/desk contact plane, simple shelf/card/envelope geometry | Physical depth, shadow, and prop contact |
| 2.5D / approved backgrounds | Existing approved background art on layered planes | Topic and time-of-day variety without modeling every room |
| Deterministic editorial background | Renderer-built color fields, charts, evidence cards, calendars, numbers | Factual control and fast revisions |

The mascot must share perspective, color temperature, contact shadow, foreground occlusion, and camera movement with the selected background. A flat wallpaper directly behind a transparent mascot is not an acceptable default.

## L. 60-Second Production Architecture

Use 6–10 scenes per 60-second Short. Character performance is normally visible for 25–40 seconds; evidence and information layers lead the remaining time.

Suggested rhythm:

1. Character hook/reaction (3–5 s)
2. Situation/prop action (4–6 s)
3. Deterministic evidence or comparison (4–7 s)
4. Character discovers the implication (3–5 s)
5. Information/evidence dominant transition (5–8 s)
6. Character explanation with gesture (4–6 s)
7. Second comparison or consequence (5–8 s)
8. Resolution/action with character or evidence (4–7 s)

Visual progression must occur whenever narratively useful, generally every 1–3 seconds. The system must not become one static 3D room with a mascot speaking for 60 seconds.

## M. Cost Model

| Cost type | Blender architecture | Previous Higgsfield reference |
| --- | --- | --- |
| One-time | High initial modeling, rigging, action-library, automation, and QA effort | No reusable character-motion asset; each usable micro-shot consumes credits |
| Monthly fixed software | Blender baseline: 0 KRW; local FFmpeg already present | Account credits/subscription vary |
| Per-video cloud animation | 0 KRW for local Blender character passes | Seedance 2.5 preflight: 32.5 credits per 5-second test |
| Local compute | Electricity, GPU use, local storage, and render time | Smaller local compute but recurring paid credit exposure |
| Optional assets | Fonts, stock/background art, or specialist modeling only if separately approved | Optional reference/asset costs remain |

The Blender software architecture fits the Owner's 20,000–30,000 KRW/month recurring-software preference **if** the initial character build and local-render maintenance are accepted as the main investment. Labor is not free: quality rigging, expression polish, and first automation integration are the material one-time cost.

## N. Initial Build Complexity

| Milestone | Complexity | Reason |
| --- | --- | --- |
| A. Master-matching 3D character | High | The source mascot must look like the locked reference, not a generic substitute |
| B. Basic rig | Medium | Compact stylized IK rig is bounded |
| C. Face/gaze/expression | Medium–High | This is the primary determinant of perceived liveliness |
| D. Phone interaction | Medium | Requires reliable attachment, gaze, and readable pose rather than finger simulation |
| E. 10+ reusable animations | High | Requires intentional acting quality and clean composability |
| F. Automated Scene 01 render | Medium–High | Manifest validation, NLA composition, headless render, and alpha handoff must be reliable |
| G. Shorts Editorial OS integration | High | Must preserve factual layers, deterministic render boundaries, and existing governed workflow |

## O. Local AI Alternative Feasibility

`LOCAL_GENERATIVE_VIDEO: POSSIBLE_BUT_POOR`.

The observed RTX 5060 with 8 GB VRAM and 16 GB RAM is suitable for a disciplined Blender mascot pipeline. It is not a comfortable foundation for recurring, high-quality local generative-video experimentation with large model weights, high VRAM pressure, installation complexity, inconsistent character identity, and slow iteration. No Wan, ComfyUI, or other local-generative stack is installed or evaluated by execution in PA-5E.

## P. Risks and Mitigations

| Risk | Practical mitigation |
| --- | --- |
| Master mismatch | Milestone A requires side-by-side silhouette/color/tuft/eye/motif QA before rigging expands |
| Rubbery limb deformation | Low-density topology, limited joint ranges, simple sleeves/limbs, pose QA library |
| Flat or dead face | Separate eye targets, staggered blinks, eyelid/mouth shape keys, restrained head lead/follow |
| Phone/hand intersection | Socketed prop, bounded wrist offsets, phone-specific action variants, no finger-level task in v1 |
| Character looks pasted on | Shared camera, contact shadow, foreground occlusion, matching light direction, 2.5D depth planes |
| Automation is brittle | Closed manifest schema, allowlisted IDs, headless smoke render, sanitized reports, no manual UI as production dependency |
| Render time grows | EEVEE default, alpha pass, simple assets, preview-first resolution, Cycles exception-only |
| Scene variety becomes repetitive | Motion/action variants, camera/prop/gaze layers, evidence-led scene alternation |
| Content loses priority | Keep factual numbers/text/evidence/subtitles in the deterministic local renderer |

## Q. Scene 01 Prototype Plan (Design Only)

Prototype only the existing Scene 01 performance; do not execute it in PA-5E.

```text
RELAXED LEFT 3/4
  -> checks held phone; gaze locks to phone
  -> lowers phone and notices information below/right
  -> eyes widen; head/body turn toward evidence
  -> short worried/curious reaction
  -> settles toward viewer while local renderer presents evidence
```

Acceptance criteria for a later Owner-approved prototype:

- The locked mascot identity is continuous: cyan face panel, large friendly eyes, exactly three aqua tufts, blue/purple body/limbs, cyan accents, sneaker-like shoes, both torso motifs.
- The eye/gaze change leads the head and torso subtly; it is not a floating sprite swap.
- Phone, hand, body, shadow, and camera share a coherent 3D space.
- The deterministic local renderer owns the hook, factual text, evidence, subtitles, and final 1080×1920 assembly.
- One Scene 01 proof is enough to judge the architecture before any wider character or episode production.

## R. Final Recommendation

`BLENDER_VIABLE_WITH_CONDITIONS`

Blender is the preferable long-term architecture for a recurring, same-character Shorts system on this PC: it replaces recurring cloud-motion credit exposure with a one-time reusable rig/action investment, supports expressive nonhuman mascot acting, and preserves deterministic control of economic information through the existing local renderer.

Conditions before build work begins:

1. Owner separately approves Blender installation and the exact initial build scope.
2. Installed Blender CLI and RTX rendering device are verified after installation.
3. Milestone A visual-match gate passes before expanding into the full motion library.
4. Scene 01 is the sole first production proof; PA-6A remains blocked.
5. Claude Sonnet High read-only review must return `PASS`, with `P0/P1 = 0/0`, before the Control Tower selects the next build slice.

