# 부엉박사 11편 재생성 대상 3개 씬

1차 생성 결과 검수(끝 프레임 기준)에서 발견된 문제와 이번 보강 내용:
- s6: 신문 카드가 끝부분에 흔들리며 텍스트 완전히 안 보임 → 카드 고정 지시를 더 직접적으로 강화
- s8: 두 카드가 끝부분에 완전히 사라짐 → 감싸 쥔 그립을 명시하고 "카드가 사라지지 않는다"를 직접 명시
- s10: 카드가 끝부분에 사라짐 → 동일 보강

| 씬 | 기준 이미지 | 저장 파일명 | 길이 |
|---|---|---|---|
| s6 | `C:/tmp/owl-ep11-images/owl_ep11_s6_impact.png` | `owl_ep11_s6_impact_motion.mp4` | 8초 |
| s8 | `C:/tmp/owl-ep11-images/owl_ep11_s8_action_a.png` | `owl_ep11_s8_action_a_motion.mp4` | 8초 |
| s10 | `C:/tmp/owl-ep11-images/owl_ep11_s10_action_c.png` | `owl_ep11_s10_action_c_motion.mp4` | 8초 |

---

## s6

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl character's design, outfit, and the bright employment center
consultation desk background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

MOTION DETAIL: the owl grips the newspaper card firmly with one wing wrapped
around it at chest height, facing the camera with a slightly sad,
head-shaking expression — not smiling. The card is held in a fixed, rigid
grip and does NOT shake, wobble, flutter, or blur at any point in the clip —
only the owl's head shakes gently side to side while the card itself stays
perfectly still, as if physically glued to the wing. Only the owl's head,
eyes, and beak move; every prop and the background are treated as a frozen
photograph layered behind/beside the character.

STATIC ELEMENTS: the background signage, plants, chairs, furniture, and the
newspaper card (including its "고용률 역대 최고" headline and bar chart,
held in the exact same position and angle) must stay completely fixed for
all 8 seconds — no camera pan or zoom, no background object movement, no
card movement, no card wobble, no card blur.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the newspaper headline ("고용률 역대 최고"), the
large wall sign, and every other wall banner. Render these exactly as pixels
copied from the reference image, unchanged frame to frame — do not let the
video model regenerate, redraw, reinterpret, or reflow any of this text,
even slightly, even for one frame. If motion would risk distorting any text,
keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/claws, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no card
shaking, no card wobbling, no card blurring, no card disappearing.

MOUTH MOVEMENT: the owl's beak actively opens and closes continuously in
natural speech rhythm for the full 8 seconds, as if seriously delivering an
ironic point — never static, never barely-moving, never closed-mouth
talking.
```

---

## s8

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl character's design, outfit, and the bright employment center
consultation desk background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

MOTION DETAIL: the owl grips both cards firmly, one card fully wrapped in
each wing at chest height ("청년내일채움공제" in the left wing,
"국민취업지원제도" in the right wing), facing the camera with a warm,
helpful expression — gentle smile allowed. Both cards stay held firmly and
visibly in the owl's wings for the ENTIRE 8 seconds — they never disappear,
never drop, never get released, and the wings never open or spread away from
the cards. Only the owl's head, eyes, and beak move; every prop and the
background are treated as a frozen photograph layered behind/beside the
character.

STATIC ELEMENTS: the background signage, plants, chairs, furniture, and both
cards (including their text, icons, and position gripped in each wing) must
remain completely fixed and visibly present for all 8 seconds — no camera
pan or zoom, no background object movement, no card movement, no card
disappearing, no wings spreading open or releasing the cards.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes both card texts ("청년내일채움공제",
"국민취업지원제도"), the large wall sign, and every other wall banner.
Render these exactly as pixels copied from the reference image, unchanged
frame to frame — do not let the video model regenerate, redraw, reinterpret,
or reflow any of this text, even slightly, even for one frame. If motion
would risk distorting any text, keep that element completely static
instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/claws, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no card
disappearing, no card dropping, no wings opening or spreading away from the
cards, no empty wings at any frame.

MOUTH MOVEMENT: the owl's beak actively opens and closes continuously in
natural speech rhythm for the full 8 seconds, as if warmly offering
practical advice — never static, never barely-moving, never closed-mouth
talking.
```

---

## s10

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl character's design, outfit, and the bright employment center
consultation desk background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

MOTION DETAIL: the owl grips the "구직촉진수당" card firmly with one wing
wrapped around it at chest height, while the other wing gives a fixed
thumbs-up gesture, facing the camera with a bright, warm closing smile. The
card stays held firmly and visibly in the owl's wing for the ENTIRE 8
seconds — it never disappears, never drops, never gets released. Both the
card and the thumbs-up wing stay in the same fixed position for the whole
clip. Only the owl's head, eyes, and beak move; every prop and the
background are treated as a frozen photograph layered behind/beside the
character.

STATIC ELEMENTS: the background signage, plants, chairs, furniture, and the
card (including its text, icon, and position gripped in the wing) must
remain completely fixed and visibly present for all 8 seconds — no camera
pan or zoom, no background object movement, no card movement, no card
disappearing.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("구직촉진수당"), the large wall
sign, and every other wall banner. Render these exactly as pixels copied
from the reference image, unchanged frame to frame — do not let the video
model regenerate, redraw, reinterpret, or reflow any of this text, even
slightly, even for one frame. If motion would risk distorting any text, keep
that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/claws, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no card
disappearing, no card dropping, no empty wing at any frame.

MOUTH MOVEMENT: the owl's beak actively opens and closes continuously in
natural speech rhythm for the full 8 seconds, as if warmly closing out the
episode with encouraging information — never static, never barely-moving,
never closed-mouth talking.
```
