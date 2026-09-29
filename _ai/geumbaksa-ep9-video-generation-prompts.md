# 금박사 9편(퇴직연금 DB형·DC형·IRP) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/geumbaksa-ep9-images/`
영상 저장 폴더(신규 생성): `C:/tmp/geumbaksa-ep9-videos/`

씬 길이 티어는 TTS 실측(`rawAudioDurationSec`) 기준, CURRENT_STANDARDS.md 원칙(8초 미만→8초, 8초 이상→실측+1초 미만) 그대로 적용. 9씬 전부 8초 미만 실측이라 전부 8초 티어.

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 길이 티어 |
|---|---|---|---|
| s1 opening | `geumbaksa_ep9_s1.png` | `geumbaksa_ep9_s1_motion.mp4` | 8초 (실측 7.46초) |
| s2 hook | `geumbaksa_ep9_s2.png` | `geumbaksa_ep9_s2_motion.mp4` | 8초 (실측 7.35초) |
| s3 db_definition | `geumbaksa_ep9_s3.png` | `geumbaksa_ep9_s3_motion.mp4` | 8초 (실측 7.21초) |
| s4 dc_definition | `geumbaksa_ep9_s4.png` | `geumbaksa_ep9_s4_motion.mp4` | 8초 (실측 5.53초) |
| s5 choice_and_switch | `geumbaksa_ep9_s5.png` | `geumbaksa_ep9_s5_motion.mp4` | 8초 (실측 4.83초) |
| s6 irp | `geumbaksa_ep9_s6.png` | `geumbaksa_ep9_s6_motion.mp4` | 8초 (실측 6.88초) |
| s7 same_type_only | `geumbaksa_ep9_s7.png` | `geumbaksa_ep9_s7_motion.mp4` | 8초 (실측 6.91초) |
| s8 how_to_check | `geumbaksa_ep9_s8.png` | `geumbaksa_ep9_s8_motion.mp4` | 8초 (실측 7.64초) |
| s9 upcoming_closing | `geumbaksa_ep9_s9.png` | `geumbaksa_ep9_s9_motion.mp4` | 8초 (실측 7.40초) |

★ 영상 생성 절대규칙(87씬 전수조사 확정, `_ai/CURRENT_STANDARDS.md` §0) 전부 반영:
- 소품을 든 손은 **한 지점 고정**("holds steadily at", 이동·반복 왕복 지시 금지)
- **동작은 소품을 안 든 빈 쪽에만** 배정
- 소품·보드는 전부 "frozen photograph layered behind/beside the character"로 명시
- 텍스트는 CRITICAL TEXT PRESERVATION(HIGHEST PRIORITY) 블록으로 고정

★ 추가 규칙(금박사 8편 s8 사고 재발 방지 — `_ai/geumbaksa-ep8-video-generation-prompts.md` REGEN 이력 참고):
클립 끝부분(특히 8초 근처)에서 카메라 줌인 드리프트나 소품(카드/폰) 기울어짐이 반복 발생했던 전례가 있다.
**모든 씬에 CAMERA LOCK + PROP LOCK(카드를 든 경우) 문단을 넣어, 첫 프레임과 마지막 프레임의
카메라 프레이밍·소품 각도가 완전히 동일해야 한다고 명시한다.** 8편은 8초 티어에서도 문제가 났으므로
이번엔 처음부터 강하게 명시.

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작 프레임뿐 아니라 클립 중반·후반(특히
7~8초 구간) 프레임에서도 텍스트·소품·동작 지속 여부, 카메라 줌/크롭, 소품 기울어짐을 확인한다.

================================================================================
# 🟦 8초 티어 (9개 씬 전체)
================================================================================

---

## s1 — opening (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the bright retirement-pension
consultation office background exactly as shown in the reference image —
same "퇴직연금 상담" wall sign, same "연금설계" binder, same calculator
labeled "계산하기", same piggy bank labeled "노후준비". Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character greets the viewer with one hand raised in a
gentle waving gesture at chest height, warm and friendly expression. The
other hand rests calmly at its side.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage ("퇴직연금 상담" wall sign), the
"연금설계" binder, the calculator labeled "계산하기", the piggy bank
labeled "노후준비", plants, and picture frames must stay completely fixed
— no camera pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the "퇴직연금 상담" wall sign, "연금설계" binder
label, "계산하기" calculator label, and "노후준비" piggy bank text. Render
these exactly as pixels copied from the reference image, unchanged frame to
frame — do not let the video model regenerate, redraw, reinterpret, or
reflow any of this text, even slightly, even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, no full-body
freeze at any point, no holding completely still for more than half a
second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT
INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
introducing itself and today's topic — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep9-videos/geumbaksa_ep9_s1_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카메라 줌/크롭 여부 포함
3. 문제 없으면 다음 씬 진행

---

## s2 — hook (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the bright retirement-pension
consultation office background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds two small cards, one in
each hand — a card with a large question mark, and a card with a stack of
cash icon — both held completely rigid at chest height for the entire clip.
Neither card tilts, rotates, rises, lowers, or drifts at any point,
including the final 1-2 seconds.

MOTION DETAIL: the character shows a surprised, wide-eyed expression, mouth
open in an astonished look, showing both cards toward the camera.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, the two cards (including the
question mark and cash stack icons), plants, and the piggy bank labeled
"노후준비" must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing or
icon-bearing surface in this frame as a locked, non-regenerating image
layer for the full 8 seconds — this includes the "퇴직연금 상담" wall
sign and the "노후준비" piggy bank text. Render these exactly as pixels
copied from the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if excitedly
revealing a surprising fact — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep9-videos/geumbaksa_ep9_s2_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s3 — db_definition (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the bright retirement-pension
consultation office background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds the "DB형·금액 확정"
card (with a building icon) completely rigid in one hand at chest height
for the entire clip — the card does not tilt, rotate, rise, lower, or
drift at any point, including the final 1-2 seconds. The other hand points
gently toward the card in a fixed pose (not touching or moving it).

MOTION DETAIL: the character's expression is calm and informative,
explaining a definition with a composed, steady tone.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, the card (including its "DB형·
금액 확정" text and building icon), the "연금설계" binder, plants, and the
piggy bank must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("DB형·금액 확정"), the "퇴직연금
상담" wall sign, and the "연금설계" binder label. Render these exactly as
pixels copied from the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if calmly
stating a clear definition — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep9-videos/geumbaksa_ep9_s3_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s4 — dc_definition (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the bright retirement-pension
consultation office background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds the "DC형·내가 직접
운용" card (with a person icon and a rising bar chart) completely rigid in
one hand at chest height for the entire clip — the card does not tilt,
rotate, rise, lower, or drift at any point, including the final 1-2
seconds. The other hand points gently toward the card in a fixed pose.

MOTION DETAIL: the character's expression is engaged and explanatory.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, the card (including its "DC형·
내가 직접 운용" text, person icon, and bar chart), the book spines "든든한
오늘"/"행복한 내일", the piggy bank labeled "행복한 노후", and the pen cup
labeled "연금" must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("DC형", "내가 직접 운용"), the
"퇴직연금 상담" wall sign, book spines, piggy bank text, and pen cup text.
Render these exactly as pixels copied from the reference image, unchanged
frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly
explaining how this type works — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep9-videos/geumbaksa_ep9_s4_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s5 — choice_and_switch (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design exactly as shown in the reference
image. Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card showing a balance
scale with "DB형" (a coin stack icon) on one side and "DC형" (a rising bar
chart icon) on the other side, completely rigid in both hands at chest
height for the entire clip — the card does not tilt, rotate, rise, lower,
or drift at any point, including the final 1-2 seconds.

MOTION DETAIL: the character's expression is calm and thoughtful, as if
weighing two options.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, the balance-scale card (including
its "DB형" and "DC형" text and icons), book spines "노후준비"/"안정적인
미래"/"행복한 은퇴", the piggy bank, and office furniture must stay
completely fixed — no camera pan or zoom, no background object movement, no
card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("DB형", "DC형"), the "퇴직연금
상담" wall sign, and the book spines. Render these exactly as pixels
copied from the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if calmly
comparing two choices — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep9-videos/geumbaksa_ep9_s5_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s6 — irp (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the bright retirement-pension
consultation office background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds the "IRP·세액공제" card
(with a wallet icon and coin sparkles) completely rigid in one hand at
chest height for the entire clip — the card does not tilt, rotate, rise,
lower, or drift at any point, including the final 1-2 seconds. The other
hand points gently toward the card in a fixed pose.

MOTION DETAIL: the character's expression is bright and pleased, sharing
useful information.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, the card (including its "IRP·
세액공제" text and wallet icon), book spines "퇴직연금"/"절세혜택"/"미래
준비", the piggy bank, and the clipboard reading "든든한 노후생활" must
stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("IRP", "세액공제"), the "퇴직연금
상담" wall sign, book spines, and clipboard text. Render these exactly as
pixels copied from the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if brightly
sharing a helpful benefit — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep9-videos/geumbaksa_ep9_s6_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s7 — same_type_only (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the bright retirement-pension
consultation office background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card showing two rows,
"DB→DB" (blue) and "DC→DC" (green), completely rigid in both hands at
chest height for the entire clip — the card does not tilt, rotate, rise,
lower, or drift at any point, including the final 1-2 seconds.

MOTION DETAIL: the character's expression is serious and precise, stating
an important rule.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, the card (including its "DB→DB"
and "DC→DC" text), book spines "퇴직연금"/"연금전환"/"든든한 미래", the
piggy bank, and the clipboard reading "안정적인 노후준비" must stay
completely fixed — no camera pan or zoom, no background object movement, no
card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("DB→DB", "DC→DC"), the "퇴직연금
상담" wall sign, book spines, and clipboard text. Render these exactly as
pixels copied from the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if seriously
stating an important restriction — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep9-videos/geumbaksa_ep9_s7_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s8 — how_to_check (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the bright retirement-pension
consultation office background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PHONE LOCK (HIGHEST PRIORITY): the character holds the smartphone showing
"퇴직연금 조회" with a green checkmark and bar chart, completely rigid in
one hand at chest height for the entire clip — as if the hand and phone
were a single fused object welded in place. The phone's tilt angle,
rotation, height, and distance from camera must stay identical from frame 1
to the very last frame. It never rotates, tips, tilts, rises, lowers, or
drifts even slightly, at any point, including the final 1-2 seconds — this
is the exact window where video models most often let a held prop drift.

MOTION DETAIL: the character's expression is warm and friendly, gently
encouraging the viewer to check.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head nods, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, the phone (including its "퇴직연금
조회" text, checkmark, and bar chart), book spines "퇴직연금"/"연금관리"/
"노후설계", the piggy bank, and the notepad reading "오늘도 든든한 노후
준비" must stay completely fixed — no camera pan or zoom, no background
object movement, no phone movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the phone screen text ("퇴직연금 조회"), the
"퇴직연금 상담" wall sign, book spines, and notepad text. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no phone movement, no phone
floating or blurring, NO FULL-BODY FREEZE AT ANY POINT, no holding
completely still for more than half a second anywhere in the clip, NO
CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
PHONE TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
encouraging the viewer to check today — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep9-videos/geumbaksa_ep9_s8_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 전부 확인 — **8편 s8과 동일한 사고(폰 기울어짐, 카메라 줌인)가
   재발하지 않는지 특히 꼼꼼히 확인**. 의심되면 재생성 전 제출.
3. 문제 없으면 다음 씬 진행

---

## s9 — upcoming_closing (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the bright retirement-pension
consultation office background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card showing a small
red "추진 중" badge at top, "DC형" in a blue box, an arrow, and "타사 IRP"
in a green box, completely rigid in one hand at chest height for the entire
clip — the card does not tilt, rotate, rise, lower, or drift at any point,
including the final 1-2 seconds.

MOTION DETAIL: the character's expression is warm and hopeful, a gentle
smile — this is the wrap-up scene, tone matching scene 1.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY, THIS IS THE FINAL
SCENE — DO NOT LET IT GO STATIC): the character must show visible,
continuous motion for the ENTIRE 8 seconds, including the last 2-3 seconds
— natural eye blinks at least every 2-3 seconds, subtle head nods, gentle
breathing motion, continuous mouth movement while speaking. No portion of
the clip, especially the back half, should hold a single frozen pose for
more than half a second. After speech ends (if applicable), the character
keeps breathing/blinking gently rather than freezing into a static held
expression.

STATIC ELEMENTS: the background signage, the card (including its "추진 중",
"DC형", "타사 IRP" text and arrow), book spines "퇴직연금"/"자산관리"/
"노후준비", the pen cup labeled "노후는 오늘부터", and the clipboard
reading "행복한 노후준비" must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("추진 중", "DC형", "타사 IRP"),
the "퇴직연금 상담" wall sign, book spines, pen cup text, and clipboard
text. Render these exactly as pixels copied from the reference image,
unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, NO
FULL-BODY FREEZE AT ANY POINT, no holding completely still for more than
half a second anywhere in the clip, no rigid locked pose for the second
half of the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING
THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST
SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
wrapping up with a hopeful note about an ongoing policy change — never
static, never barely-moving, never closed-mouth talking, never frozen even
in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep9-videos/geumbaksa_ep9_s9_motion.mp4`로 저장
2. 시작·중반(4초)·끝(7초) 프레임 전부 확인 — 마지막 씬이므로 후반부 정지 여부 특히 꼼꼼히 확인
3. 9개 씬 전부 완료 후 본편 조립 진행
