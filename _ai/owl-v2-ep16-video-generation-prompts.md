# 부엉박사 16편(퇴직연금 실물이전, v2 재제작) 영상 생성 프롬프트 — 수동 진행용

★ 2026-09-27 **14씬으로 재확정**(경위는 `scripts/_owl-v2-ep16-assembly-spec.mjs`
상단 주석 참고). 1차로 16씬까지 늘어났던 건 9.5초 규칙을 문장 경계에서
기계적으로 적용해 3~5초짜리 씬을 과도하게 쪼갰기 때문이었고, 재사용
확정도 CURRENT_STANDARDS 원문 기준("v1 8초 영상 재사용 시 발화 7초
이내")을 임의로 완화 해석해 잘못 통과시킨 씬이 있었다. 재검증 후 대본을
자연스러운 문장 단위로 다시 묶어 14씬, 재사용은 7초 이내 기준을 실제로
통과한 3개(s3·s5·s6)만 유지한다.

이미지 소스 폴더: `C:/tmp/owl-v2-ep16-images/`
영상 저장 폴더(신규 생성): `C:/tmp/owl-v2-ep16-videos/`

**이 문서는 신규 제작이 필요한 10개 씬만 다룬다.** 나머지 4개 씬(s3, s5,
s6, s10)은 부엉박사 13편(v1) 원본 영상을 그대로 재사용하며
`C:/tmp/owl-v2-ep16-videos/`에 이미 배치 완료했다(재생성 불필요):
- s3 opening ← `owl_v2_ep16_s3_opening_motion.mp4`(v1 s1, 10초 클립, 발화 3.24초)
- s5 situation1 ← `owl_v2_ep16_s5_situation1_motion.mp4`(v1 s2, 8초 클립, 발화 5.387초)
- s6 situation2 ← `owl_v2_ep16_s6_situation2_motion.mp4`(v1 s3, 8초 클립, 발화 6.667초)
- s10 point3_upcoming ← `owl_v2_ep16_s10_point3_upcoming_motion.mp4`(v1 s9, 8초 클립, 발화 7.2초)

**씬 길이 티어는 8초/10초 2단계로만 요청한다(9초 티어 금지,
[[feedback_video_scene_length_tier_smooth_transition]]).** 발화 8초 미만이고
여유 1초 이상이면 8초, 그 외(8초 이상이거나 여유 1초 미만)는 10초.

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 실측 발화(raw) | 요청 티어 | 예상 여유 |
|---|---|---|---|---|---|
| s1 hook_q | `owl_v2_ep16_s1_hook_q.png` | `owl_v2_ep16_s1_hook_q_motion.mp4` | 5.68초 | **8초** | 2.32초 |
| s2 hook_stakes | `owl_v2_ep16_s2_hook_stakes.png` | `owl_v2_ep16_s2_hook_stakes_motion.mp4` | 4.715초 | **8초** | 3.285초 |
| s4 definition | `owl_v2_ep16_s4_definition.png` | `owl_v2_ep16_s4_definition_motion.mp4` | 5.39초 | **8초** | 2.61초 |
| s7 core_q_answer | `owl_v2_ep16_s7_core_q_answer.png` | `owl_v2_ep16_s7_core_q_answer_motion.mp4` | 6.44초 | **8초** | 1.56초 |
| s8 point1_scale(통합) | `owl_v2_ep16_s8_point1_scale.png` | `owl_v2_ep16_s8_point1_scale_motion.mp4` | 8.17초 | **10초** | 1.83초 |
| s9 point2_condition(통합) | `owl_v2_ep16_s9_point2_condition.png` | `owl_v2_ep16_s9_point2_condition_motion.mp4` | 9.38초 | **10초** | 0.62초 |
| s11 caution | `owl_v2_ep16_s11_caution.png` | `owl_v2_ep16_s11_caution_motion.mp4` | 8.16초 | **10초** | 1.84초 |
| s12 summary | `owl_v2_ep16_s12_summary.png` | `owl_v2_ep16_s12_summary_motion.mp4` | 4.4초 | **8초** | 3.6초 |
| s13 checklist | `owl_v2_ep16_s13_checklist.png` | `owl_v2_ep16_s13_checklist_motion.mp4` | 4.923초 | **8초** | 3.077초 |
| s14 bridge(closing) | `owl_v2_ep16_s14_bridge.png` | `owl_v2_ep16_s14_bridge_motion.mp4` | 7.453초 | **10초** | 2.547초 |

★ 영상 생성 절대규칙(87씬 전수조사 확정, `_ai/CURRENT_STANDARDS.md` §0) 전부 반영:
- 소품을 든 손은 **한 지점 고정**("holds steadily at", 이동·반복 왕복 지시 금지)
- **동작은 소품을 안 든 빈 쪽에만** 배정
- 소품·보드는 전부 "frozen photograph layered in front of/beside the character"로 명시
- 텍스트는 CRITICAL TEXT PRESERVATION(HIGHEST PRIORITY) 블록으로 고정
- 나레이션이 있는 영상이므로 "Silent" 문구는 절대 넣지 않는다
- 바닥 거치 소품(없음 — 이번 편은 전부 손에 쥐는 카드)

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작 프레임뿐 아니라 클립 중반·후반 프레임에서도
텍스트·소품·동작 지속 여부, 카메라 줌/크롭, 소품 기울어짐을 확인한다.

================================================================================
# 🟦 8초 티어 (s1, s2, s4, s7, s12, s13)
================================================================================

---

## s1 — hook_q (8초, 카드 감싸쥠) — ★재생성(1차 결과 결함: 7.5초 지점에서 카드가 완전히 사라지고 양팔을 벌린 빈손 자세로 바뀜)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the retirement-pension consultation
lounge background exactly as shown in the reference image — same "퇴직연금
상담" signage, same monitors, same potted plants, same soft warm lighting.
Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "퇴직연금" on the top line and "팔고 또 사?" on the bottom line
— completely rigid, cradled in both wings at chest height for the entire
clip, from frame 1 all the way to the very last frame with NO exception.
The card must still be visibly held in the character's wings at the exact
final frame of the video, identically to how it is held at frame 1. The
card never disappears, is never dropped, is never released, and the wings
never open outward away from the card at any point in the clip, including
the last 1-2 seconds. The card does not tilt, rotate, rise, lower, or
drift at any point. Treat the card as a frozen photograph layered in front
of the character, permanently glued to the character's wings for the
entire 8-second duration.

MOTION DETAIL: the character's expression is curious and intrigued, wide
eyes, beak slightly open, as if posing an intriguing question to the
viewer. Both wings stay wrapped around the card the whole time — they do
not spread open or gesture away from it.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak/mouth movement while speaking. This motion
must come ONLY from the head, eyes, and beak — the wings and the card they
hold must remain completely still and attached for the full clip. No
portion of the clip, especially the back half, should hold a single frozen
pose for more than half a second, but this also must never be achieved by
releasing, dropping, or making the card disappear.

STATIC ELEMENTS: the "퇴직연금 상담" signage, monitors, potted plants, and
lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement, no card disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("퇴직연금", "팔고 또 사?") and the background signage text ("퇴직연금
상담") as locked, non-regenerating image layers for the full 8 seconds,
including the very last frame. Render these exactly as pixels copied from
the reference image, unchanged frame to frame, and still fully visible and
held by the character at the end of the clip.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/talons, no warped, blurred, flickering, or misspelled
text anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, NO CARD MOVEMENT, NO CARD
DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE LAST SECOND, NO
WINGS OPENING OUTWARD OR RELEASING THE CARD, NO EMPTY-HANDED POSE AT ANY
POINT, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING
DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT
ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if curiously posing a
question to the viewer — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds. The card
stays held in both wings throughout, unaffected by the beak movement.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep16-videos/owl_v2_ep16_s1_hook_q_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — **카드가 끝까지 들려 있는지 최우선 확인**, 카메라 줌/크롭 여부 포함
3. 문제 없으면 다음 씬 진행

---

## s2 — hook_stakes (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the retirement-pension consultation
lounge background exactly as shown in the reference image. Do not change
any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "안 팔고" on the top line and "그대로?" with a large red
question mark on the bottom line — completely rigid, cradled in both wings
at chest height for the entire clip. The card does not tilt, rotate, rise,
lower, or drift at any point, including the final 1-2 seconds. Treat the
card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is wide-eyed and surprised,
leaning slightly forward as if raising the stakes of the question.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak/mouth movement while speaking. No portion of
the clip, especially the back half, should hold a single frozen pose for
more than half a second.

STATIC ELEMENTS: the "퇴직연금 상담" signage, monitors, potted plants, and
lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("안
팔고", "그대로?") and the background signage text as locked,
non-regenerating image layers for the full 8 seconds. Render these exactly
as pixels copied from the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/talons, no warped, blurred, flickering, or misspelled
text anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if surprisingly raising
the stakes — never static, never barely-moving, never closed-mouth
talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep16-videos/owl_v2_ep16_s2_hook_stakes_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s4 — definition (8초, 카드 감싸쥠) — ★재생성(1차 결과 결함: 7.5~8초 지점에서 카드가 완전히 사라지고 안경도 흘러내린 채 빈손으로 서 있는 자세로 바뀜, 화질도 저하)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the retirement-pension consultation
lounge background exactly as shown in the reference image. Do not change
any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "실물이전 =" on the top line and "상품 그대로 이전" in red on
the bottom line — completely rigid, cradled in both wings at chest height
for the entire clip, from frame 1 all the way to the very last frame with
NO exception. The card must still be visibly held in the character's wings
at the exact final frame of the video, identically to how it is held at
frame 1. The card never disappears, is never dropped, is never released,
and the wings never open outward away from the card at any point in the
clip, including the last 1-2 seconds. The card does not tilt, rotate,
rise, lower, or drift at any point. The sunglasses stay in their fixed
position on top of the head for the entire clip and never slide down.
Treat the card as a frozen photograph layered in front of the character,
permanently glued to the character's wings for the entire 8-second
duration.

MOTION DETAIL: the character's expression is serious and instructive,
clearly explaining the definition of a term to the viewer. Both wings stay
wrapped around the card the whole time — they do not spread open or
gesture away from it.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak/mouth movement while speaking. This motion
must come ONLY from the head, eyes, and beak — the wings and the card they
hold must remain completely still and attached for the full clip, and the
sunglasses must stay fixed on the head. No portion of the clip, especially
the back half, should hold a single frozen pose for more than half a
second, but this also must never be achieved by releasing, dropping, or
making the card disappear, and never by image quality degrading or
becoming blurry/double-exposed in the final seconds.

STATIC ELEMENTS: the "퇴직연금 상담" signage, monitors, potted plants, and
lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement, no card disappearance, no
sunglasses sliding down.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("실물이전 =", "상품 그대로 이전") and the background signage text as
locked, non-regenerating image layers for the full 8 seconds, including
the very last frame. Render these exactly as pixels copied from the
reference image, unchanged frame to frame, sharp and in full focus (never
blurry or double-exposed), and still fully visible and held by the
character at the end of the clip.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/talons, no warped, blurred, flickering, ghosting,
double-exposed, or misspelled text anywhere in the frame, no image quality
degradation in the second half of the clip, no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal beak
movement, no closed-mouth talking, no frozen expression while speaking, NO
CARD MOVEMENT, NO CARD DISAPPEARING OR BEING DROPPED AT ANY POINT
INCLUDING THE LAST SECOND, NO WINGS OPENING OUTWARD OR RELEASING THE CARD,
NO EMPTY-HANDED POSE AT ANY POINT, no sunglasses sliding down the face, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if clearly explaining a
one-line definition — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds. The card
stays held in both wings throughout, unaffected by the beak movement.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep16-videos/owl_v2_ep16_s4_definition_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — **카드가 끝까지 들려 있는지, 화질이 마지막까지 선명한지 최우선 확인**
3. 문제 없으면 다음 씬 진행

---

## s7 — core_q_answer (8초, 카드 감싸쥠 + 고민하는 표정)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the retirement-pension consultation
lounge background exactly as shown in the reference image. Do not change
any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "나는" with a yellow underline on the top line and "어떻게
해야 할까?" in red on the bottom line — completely rigid in one wing at
chest height for the entire clip. The card does not tilt, rotate, rise,
lower, or drift at any point, including the final 1-2 seconds. The other
wing rests thoughtfully near the character's chin. Treat the card as a
frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is thoughtful and inquisitive,
one eyebrow slightly raised, as if posing the core question of the episode
to the viewer.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak/mouth movement while speaking. No portion of
the clip, especially the back half, should hold a single frozen pose for
more than half a second.

STATIC ELEMENTS: the "퇴직연금 상담" signage, monitors, potted plants, and
office furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("나는",
"어떻게 해야 할까?") and the background signage text as locked,
non-regenerating image layers for the full 8 seconds. Render these exactly
as pixels copied from the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/talons, no warped, blurred, flickering, or misspelled
text anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if thoughtfully posing the
core question and then answering it — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep16-videos/owl_v2_ep16_s7_core_q_answer_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s12 — summary (8초, 카드 감싸쥠 + 확신에 찬 표정)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the retirement-pension consultation
lounge background exactly as shown in the reference image. Do not change
any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "실물이전," on the top line and "이미 가능해" in red with a
yellow underline on the bottom line — completely rigid, held in one wing
at chest height for the entire clip, while the other wing's thumb points
toward the card in a confident "thumbs up"-style gesture at a fixed angle
without waving. The card does not tilt, rotate, rise, lower, or drift at
any point, including the final 1-2 seconds. Treat the card as a frozen
photograph layered in front of the character.

MOTION DETAIL: the character's expression is confident and assured, as if
wrapping up the main point with certainty.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak/mouth movement while speaking. No portion of
the clip, especially the back half, should hold a single frozen pose for
more than half a second.

STATIC ELEMENTS: the "퇴직연금 상담" signage, monitors, potted plants, and
office furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("실물이전,", "이미 가능해") and the background signage text as locked,
non-regenerating image layers for the full 8 seconds. Render these exactly
as pixels copied from the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/talons, no warped, blurred, flickering, or misspelled
text anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no waving
or repeated thumb motion, no full-body freeze at any point, no holding
completely still for more than half a second anywhere in the clip, NO
CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if confidently summarizing
the key point — never static, never barely-moving, never closed-mouth
talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep16-videos/owl_v2_ep16_s12_summary_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s13 — checklist (8초, 보드 바닥 거치)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the retirement-pension consultation
lounge background exactly as shown in the reference image. Do not change
any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): a floor-standing signboard with two checklist
rows — "체크 ❶" with a checkmark icon above "내 계좌 종류" with a yellow
underline, and "체크 ❷" with a checkmark icon above "대상 상품 여부" with a
yellow underline — remains completely rigid, standing upright on the floor
beside the character for the entire clip. The signboard does not tip over,
rotate, slide, or fall at any point, including the final 1-2 seconds. One
wing rests lightly on the top edge of the signboard without pushing or
tilting it; the other wing shows a steady "peace sign" / two-finger
gesture, held at a fixed angle without waving. Treat the signboard as a
frozen photograph layered beside the character, fixed to the floor.

MOTION DETAIL: the character's expression is serious and instructive — not
smiling — summarizing the two things the viewer must check.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak/mouth movement while speaking. No portion of
the clip, especially the back half, should hold a single frozen pose for
more than half a second. This continuous motion must never be achieved by
tipping, sliding, or regenerating the signboard.

STATIC ELEMENTS: the "퇴직연금 상담" signage, monitors, the checklist
signboard (including its full text and its floor position), potted plants
must stay completely fixed — no camera pan or zoom, no background object
movement, no signboard movement or tipping.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the signboard text
("체크 ❶", "내 계좌 종류", "체크 ❷", "대상 상품 여부") and the background
signage text as locked, non-regenerating image layers for the full 8
seconds. Render these exactly as pixels copied from the reference image,
unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/talons, no warped, blurred, flickering, or misspelled
text anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no signboard tipping over,
sliding, or falling at any point, no waving or repeated finger motion, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO SIGNBOARD MOVEMENT AT ANY POINT
INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if clearly summarizing a
two-item checklist — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep16-videos/owl_v2_ep16_s13_checklist_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 보드가 넘어지거나 미끄러지지 않는지 특히 확인
3. 문제 없으면 다음 씬 진행

================================================================================
# 🟨 10초 티어 (s8, s9, s11, s14)
================================================================================

---

## s8 — point1_scale, 규모+흐름 통합 (10초, 카드 감싸쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the retirement-pension consultation
lounge background exactly as shown in the reference image. Do not change
any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "상반기 6.9조 원" in red on the top line and "은행 → 증권사"
with a rightward arrow on the bottom line — completely rigid in one wing
at chest height for the entire clip. The card does not tilt, rotate, rise,
lower, or drift at any point, including the final 1-2 seconds. Treat the
card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is confident and assured, as if
presenting a striking scale figure and then explaining the direction of
money flow.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak/mouth movement while speaking. No portion of
the clip, especially the back half, should hold a single frozen pose for
more than half a second.

STATIC ELEMENTS: the "퇴직연금 상담" signage, monitors, potted plants, and
office furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("상반기 6.9조 원", "은행 → 증권사") and the background signage text as
locked, non-regenerating image layers for the full 10 seconds. Render
these exactly as pixels copied from the reference image, unchanged frame
to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/talons, no warped, blurred, flickering, or misspelled
text anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if confidently presenting
a large scale number and then its flow direction — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep16-videos/owl_v2_ep16_s8_point1_scale_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s9 — point2_condition, 조건 통합 (10초, 카드 감싸쥠 + 진지한 표정)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the retirement-pension consultation
lounge background exactly as shown in the reference image. Do not change
any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with "같은 종류
계좌만" in large text on the top line, and below it a small three-row table
with red arrows reading "DB → DB", "DC → DC", "IRP → IRP" — completely
rigid in one wing at chest height for the entire clip. The card does not
tilt, rotate, rise, lower, or drift at any point, including the final 1-2
seconds. Treat the card as a frozen photograph layered in front of the
character.

MOTION DETAIL: the character's expression is serious — not smiling, brow
slightly furrowed — as if stating an important rule and then listing its
exact conditions.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak/mouth movement while speaking. No portion of
the clip, especially the back half, should hold a single frozen pose for
more than half a second.

STATIC ELEMENTS: the "퇴직연금 상담" signage, monitors, potted plants, and
office furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("같은
종류 계좌만", "DB → DB", "DC → DC", "IRP → IRP") and the background
signage text as locked, non-regenerating image layers for the full 10
seconds. Render these exactly as pixels copied from the reference image,
unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/talons, no warped, blurred, flickering, or misspelled
text anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if seriously stating a
condition and then listing its three exact cases — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep16-videos/owl_v2_ep16_s9_point2_condition_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 특히 표 형태 소문자 텍스트("DB → DB" 등) 3줄이 끝까지 깨지지 않는지 확인
3. 문제 없으면 다음 씬 진행

---

## s11 — caution (10초, 카드 감싸쥠 + 고개 갸웃)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the retirement-pension consultation
lounge background exactly as shown in the reference image. Do not change
any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with a single
large red question mark, completely rigid in one wing at chest height for
the entire clip. The card does not tilt, rotate, rise, lower, or drift at
any point, including the final 1-2 seconds. Treat the card as a frozen
photograph layered in front of the character.

MOTION DETAIL: the character's expression is cautious and thoughtful, head
tilted slightly to one side, the other wing resting near its beak as if
carefully weighing an exception to the rule just stated.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak/mouth movement while speaking. No portion of
the clip, especially the back half, should hold a single frozen pose for
more than half a second.

STATIC ELEMENTS: the "퇴직연금 상담" signage, monitors, potted plants, and
office furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card's question
mark and the background signage text as locked, non-regenerating image
layers for the full 10 seconds. Render these exactly as pixels copied from
the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/talons, no warped, blurred, or flickering surfaces
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if cautiously explaining
an important exception — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep16-videos/owl_v2_ep16_s11_caution_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s14 — bridge / closing (10초, 카드 감싸쥠, 금박사에게 연결)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the retirement-pension consultation
lounge background exactly as shown in the reference image. Do not change
any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "DB형·" on the top line and "DC형?" in red on the bottom line
— completely rigid in one wing at chest height for the entire clip. The
card does not tilt, rotate, rise, lower, or drift at any point, including
the final 1-2 seconds. Treat the card as a frozen photograph layered in
front of the character.

MOTION DETAIL: the character's expression is warm and inviting, beak open
mid-speech, the other wing gently waving beside its head (a natural,
continuous small wave motion, not a static held pose) as if teasing an
upcoming topic for another character to cover.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY, THIS IS THE FINAL
SCENE OF THE EPISODE — DO NOT LET IT GO STATIC): the character must show
visible, continuous motion for the ENTIRE 10 seconds, including the last
2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle head
tilts, gentle continuous waving motion, continuous beak/mouth movement
while speaking. No portion of the clip, especially the back half, should
hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the "퇴직연금 상담" signage, monitors, potted plants, and
office furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("DB형·",
"DC형?") and the background signage text as locked, non-regenerating image
layers for the full 10 seconds. Render these exactly as pixels copied from
the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/talons, no warped, blurred, or flickering surfaces
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, NO
FULL-BODY FREEZE AT ANY POINT, no holding completely still for more than
half a second anywhere in the clip, no rigid locked pose for the second
half of the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING
THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST
SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if warmly handing off an
unanswered term to another character — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep16-videos/owl_v2_ep16_s14_bridge_motion.mp4`로 저장
2. 시작·중반(4~5초)·끝(9~10초) 프레임 전부 확인 — 마지막 씬이므로 후반부 정지 여부 특히 꼼꼼히 확인
3. 10개 신규 씬 전부 완료 후, 재사용 4개 씬(s3, s5, s6, s10)과 합쳐
   본편 조립(`run-owl-assemble-shorts-v2.mjs`, `--spec-module
   ./_owl-v2-ep16-assembly-spec.mjs --spec-export OWL_ASSEMBLY_SPEC`, `--clip-dir
   C:/tmp/owl-v2-ep16-videos`) → 고정 CTA 연결(`run-owl-episode-with-fixed-cta-once.mjs`,
   부엉박사 고정 CTA `owl_cta_fixed_v2_final_v6.mp4`) 진행
