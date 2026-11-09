```text
ROLE_MODE: CROSS_REVIEW_MODE
PROJECT: Shorts Editorial OS V2 (instagram-auto)
REPOSITORY: C:\Users\PC\jjy\instagram-auto
MAIN AI: Codex
REVIEWER: Claude Code Sonnet High
REVIEW MODE: strict read-only
CURRENT SLICE: PA-5B4 — character-led visual asset generation and P1 correction re-review

REVIEW PURPOSE:
Independently decide whether the exact PA-5B4 generated visual asset set is ready for Owner visual approval. Review only; do not implement, regenerate, or improve assets.

AUTHORITATIVE SOURCES:
1. _ai/SHORTS_EDITORIAL_OS_V2_PA5B2_EDITORIAL_STORYBOARD_AND_MOTION_BIBLE.md
2. _ai/SHORTS_EDITORIAL_OS_V2_PA5B3_CHARACTER_ASSET_AND_VISUAL_PROMPT_PACK.md
3. assets/editorial-v2/character/SHORTS_EDITORIAL_OS_V2_CHARACTER_MASTER.png
   Required SHA-256: b778c21aec8de04a518c119a206420fddce2e236eb2e04035f2add4ce684bf27
4. assets/editorial-v2/production-assets/pa5b4/PA5B4_ASSET_MANIFEST.md
5. assets/editorial-v2/production-assets/pa5b4/PA5B4_ASSET_HASHES.sha256
6. assets/editorial-v2/production-assets/pa5b4/PA5B4_ASSET_BOARD.html
7. Every exact image file referenced by the manifest and asset board.

BOUNDED EXECUTION HISTORY:
- Initial approved request cap: 22 = 18 character variants + 4 scene plates.
- Two initial scene plates were rejected for photo-like treatment: BG_EVENING_DESK_01 v1 and BG_MORNING_DESK_06_08 v1.
- Owner separately approved one replacement for each rejected plate. Therefore total image-generation requests executed: 24.
- Automatic retries: 0. Fallbacks: 0.
- Accepted production assets: 18 character variants + 4 scene plates.
- Rejected audit assets: 2, stored separately under batch-d/rejected; neither may be treated as a production input.
- CHAR_POSE_OPEN_EXPLAIN_01 is 1370x1148. Other accepted generated assets are 1122x1402. PA-5B2 and PA-5B3 impose no uniform-dimension rule; assess actual render usability and do not invent an unstated dimension defect.
- No ElevenLabs request, external TTS, video generation, render, deploy, publish, commit, or push occurred in PA-5B4.

P1 CORRECTION UNDER REVIEW:
- Prior Claude review found P1 in BG_MORNING_DESK_06_08_v1 for photo-like wood, plant, daylight, laptop, and envelope treatment.
- Owner selected replacement option B.
- The prior asset is now `batch-d/rejected/BG_MORNING_DESK_06_08_style_mismatch_v1.png` and must remain rejected.
- The sole replacement is `batch-d/accepted/BG_MORNING_DESK_06_08_replacement_v2.png`, SHA-256 `5a9ebd2cedc61b835afef97eb9d3a7eff7a859f67d407cf674fe8fb3fe74ac9f`, dimensions 941x1672.

REQUIRED INDEPENDENT CHECKS:
1. Verify the master identity across all 18 accepted character assets: rounded blue/purple body, cyan face panel, large eyes, exactly three aqua top tufts, fixed chest motifs, sneaker-like shoes, and clean soft 3D cartoon style.
2. Verify each assigned pose, expression, and prop is visibly usable in the scenes listed by PA-5B3. Flag only actual malformed hand/face/prop, readable text, logo, number, chart, prohibited drift, or unusable scene fit.
3. Verify the four accepted scene plates preserve the required 3D cartoon direction, have no character substitution or baked financial claim, and retain usable overlay space.
4. Compare the new morning replacement against its rejected v1 and the locked soft-matte 3D cartoon direction. Decide whether the original P1 is resolved without inventing a new criterion.
5. Verify both rejected plates are segregated and not linked as accepted production inputs by the manifest or asset board.
6. Verify manifest/board integrity claims: 18 accepted characters, 4 accepted scene plates, 2 rejected audit assets; every listed local image path exists; checksum list matches its files.
7. Distinguish must-fix P0/P1 from optional P2. Do not request regeneration for a subjective preference or a requirement not present in PA-5B2/PA-5B3.

FORBIDDEN:
- Any file modification or temporary-file creation.
- Any image generation, image editing, browser/Playwright use, network call, TTS, video generation, render, build, test rerun, commit, push, deploy, environment/secret access, or account action.
- Expanding PA-5B4 into final compositing, production render, or publication.

REQUIRED RESPONSE FORMAT:
VERDICT: PASS | NEEDS_FIX | BLOCKED
P0: <count>
P1: <count>
P2: <count>
MUST_FIX: <none or exact asset/path and evidence>
OPTIONAL: <none or concise list>
EVIDENCE: <actual files, visual observations, and integrity checks>
OWNER_VISUAL_APPROVAL_READY: YES | NO

PASS CONDITION:
Only PASS, P0=0, P1=0, and OWNER_VISUAL_APPROVAL_READY: YES allows Codex to request Owner visual approval. A PASS does not authorize TTS, render, publication, deploy, commit, or push.

CODEX EXECUTION NOTE:
Run Claude only in read-only mode after its quota resets. If availability is still limited, do not substitute another model or weaken this gate. Preserve the current asset files and report the availability block.
```
