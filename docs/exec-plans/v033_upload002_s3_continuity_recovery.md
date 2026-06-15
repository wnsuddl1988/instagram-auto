# v033 - Upload 002 S3 Continuity Recovery

## 1. Goal

Recover the Upload 002 S3 keyframe so it preserves the accepted S3 action while matching the S1/S2 copy-room and copier continuity.

## 2. Current State

- Repository: `C:\Users\PC\jjy\instagram-auto`
- S1 anchor PASS:
  `output/v2/3d_sitcom_prod_v1/upload_002_copier/keyframes/kf_s1_wide_copier_error.png`
- S2 continuity PASS and required adjacent reference:
  `output/v2/3d_sitcom_prod_v1/upload_002_copier/keyframes/kf_s2_jammed_paper_continuity_fix.png`
- Existing S3:
  `output/v2/3d_sitcom_prod_v1/upload_002_copier/keyframes/kf_s3_tapping_relief.png`
- Existing S3 action is useful, but continuity FAIL: glass partition/corkboard room and a different copier.
- `docs/LOG.md` is newer than the stale S3 `ok` entries in `docs/PLAN.md`, `CURRENT_CONTRACT.json`, and `generation_log.json`.

## 3. Owner-Approved External Call Boundary

- Model: Claude Code Sonnet.
- GPT web image generation submissions: exactly **1** for S3 only.
- Direct paid API maximum: **USD $0**; GPT web subscription image quota may consume one generation.
- No automatic resubmission or Enter re-entry.
- Do not generate S4/S5, Veo, TTS, or any other external asset.
- On timeout, keep the browser tab open and report `PENDING_RECOVERY`.

## 4. Atomic Task Scope

1. Inspect the relevant existing S2 continuity-fix automation and adapt/reuse it for S3.
2. Attach the S2 continuity PASS image as the baseline/reference.
3. Submit one S3 generation prompt that locks:
   - the same blind-covered window, wooden storage cabinet, bright ceiling light, beige tile floor;
   - the same large gray copier, ADF, control panel, output area, and three drawers;
   - Jun's round face, large brown eyes, black side-part hair, light-blue rolled-sleeve shirt, loose red tie, long navy slacks, black shoes, brown crossbody messenger bag;
   - S3 action: Jun lightly taps the copier side with his palm, the copier is running, one sheet is coming out and a second begins, shoulders relaxing in relief while looking slightly confused.
4. Follow the mandatory image-recovery rules:
   - inspect only the final assistant response;
   - inventory the attached reference as baseline and exclude it;
   - wait until generation spinner is gone and response complete;
   - require candidate content-id and dimensions stable for three consecutive checks and at least 15 seconds;
   - save every new candidate;
   - exclude exact-hash clones;
   - do not mark `PASS` or `ok` before human visual QA.
5. Perform visual QA against S1 and S2. Do not select merely by file size.
6. Only if a candidate passes, promote it to a clearly named S3 continuity-fix file and minimally synchronize stale status records. If none passes, preserve candidates and record S3 as FAIL/recovery pending.
7. Check `git status`; archive disposable diagnostics under `output/archive/`. Do not commit.

## 5. PASS / FAIL

PASS requires all of:

- Same accepted copy-room and copier identity as S1/S2.
- Jun appearance and fixed costume match; white shirt is an immediate FAIL.
- Palm-tap, active printing, and relief/confusion beat are visually readable.
- Vertical 9:16; no text, captions, speech bubbles, logos, or visible deformation.
- Candidate is not an exact-hash clone of the attached reference.

FAIL if any required room/copier identity changes, the action is unclear, costume changes, or visual defects appear.

## 6. Required Verification And Handoff

- Report exact GPT image submission count.
- Report all saved candidate paths and hashes.
- Report visual QA result with specific continuity/action evidence.
- Report modified files and `git status`.
- End with a final handoff to Codex containing:
  - modified files
  - core changes
  - external-call count/cost
  - verification results
  - generated artifacts
  - remaining issues and recommended next atomic task
