# 부엉박사 11편(고용률 8월 사상 첫 70% 돌파 vs 청년고용 46개월 연속 감소) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/owl-ep11-images/`
영상 저장 폴더(신규 생성, 조립 스펙이 참조하는 파일명 그대로): `C:/tmp/owl-ep11-videos/`

씬 길이 티어는 TTS 실측(`rawAudioDurationSec`) 기준, CURRENT_STANDARDS.md 원칙(8초 미만→8초 요청, 8초 이상→실측+1초 미만) 그대로 적용.

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 길이 티어 |
|---|---|---|---|
| s1 opening | `owl_ep11_s1_opening.png` | `owl_ep11_s1_opening_motion.mp4` | **9초** (실측 8.25초) |
| s2 hook | `owl_ep11_s2_hook.png` | `owl_ep11_s2_hook_motion.mp4` | 8초 |
| s3 fact | `owl_ep11_s3_fact.png` | `owl_ep11_s3_fact_motion.mp4` | 8초 |
| s4 youth_gap | `owl_ep11_s4_youth_gap.png` | `owl_ep11_s4_youth_gap_motion.mp4` | 8초 |
| s5 why_gap | `owl_ep11_s5_why_gap.png` | `owl_ep11_s5_why_gap_motion.mp4` | 8초 |
| s6 impact | `owl_ep11_s6_impact.png` | `owl_ep11_s6_impact_motion.mp4` | 8초 |
| s7 summary | `owl_ep11_s7_summary.png` | `owl_ep11_s7_summary_motion.mp4` | 8초 |
| s8 action_a | `owl_ep11_s8_action_a.png` | `owl_ep11_s8_action_a_motion.mp4` | 8초 |
| s9 action_b | `owl_ep11_s9_action_b.png` | `owl_ep11_s9_action_b_motion.mp4` | 8초 |
| s10 action_c | `owl_ep11_s10_action_c.png` | `owl_ep11_s10_action_c_motion.mp4` | 8초 |

★ 영상 생성 절대규칙(2026-09-21, 87씬 전수조사 확정, `_ai/CURRENT_STANDARDS.md` §0) 전부 반영:
- 소품을 든 팔은 **한 지점 고정**("holds steadily at", 이동·반복 왕복 지시 금지)
- **동작은 소품을 안 든 빈 쪽에만** 배정
- 소품·보드·화이트보드는 전부 "frozen photograph layered behind/beside the character"로 명시
- 텍스트는 CRITICAL TEXT PRESERVATION(HIGHEST PRIORITY) 블록으로 고정

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작 프레임에서 텍스트, 끝 프레임에서 소품·표정 확인.

================================================================================
# 🟦 8초 티어 (9개 씬: s2·s3·s4·s5·s6·s7·s8·s9·s10)
================================================================================

---

## s2 — hook (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl character's design, outfit (charcoal vest, burgundy tie, sunglasses
resting on forehead), and the bright employment center consultation desk
background exactly as shown in the reference image — same "고용센터" sign,
same "상담" sign, same "내일을 응원합니다" poster. Do not change any colors,
text, or object positions.

MOTION DETAIL: the owl tilts its head slightly and spreads both wings a
little in a puzzled gesture, facing the camera with a questioning expression
(furrowed eyebrows, curious eyes) — not smiling. The wings hold a fixed
puzzled pose and do not travel or repeat a sweeping motion; only the head
tilt and facial expression animate. The small question mark icon beside the
owl is treated as a frozen photograph layered behind/beside the character —
it does not move, bounce, or spin.

STATIC ELEMENTS: the background signage ("고용센터", "상담", "내일을
응원합니다"), plants, chairs, and furniture must remain completely still —
no camera pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the large "고용센터" wall sign, the "상담" sign,
the "내일을 응원합니다" poster text, and every other wall banner. Render
these exactly as pixels copied from the reference image, unchanged frame to
frame — do not let the video model regenerate, redraw, reinterpret, or
reflow any of this text, even slightly, even for one frame. If motion would
risk distorting any text, keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/claws, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no icon movement.

MOUTH MOVEMENT: the owl's beak actively opens and closes continuously in
natural speech rhythm for the full 8 seconds, as if curiously posing a
question — never static, never barely-moving, never closed-mouth talking.
```

---

## s3 — fact (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl character's design, outfit, and the bright employment center
consultation desk background exactly as shown in the reference image — same
"고용센터" sign, same "상담" sign, same "내일을 응원합니다" poster. Do not
change any colors, text, or object positions.

MOTION DETAIL: the owl holds the circular gauge card steadily in one wing,
pointing at it with the other wing in a confident, explanatory gesture,
facing the camera with a confident expression — not smiling. The gauge card
does not travel or shift position; treat it as a fixed object the owl is
simply holding still and pointing at. Only the owl's head, eyes, and beak
move; every prop and the background are treated as a frozen photograph
layered behind/beside the character.

STATIC ELEMENTS: the background signage, plants, chairs, furniture, and the
gauge card (including its needle position and "고용률 70.4%" text) must stay
completely fixed — no camera pan or zoom, no background object movement, no
card movement, no needle movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the gauge card text ("고용률 70.4%"), the large
"고용센터" wall sign, the "상담" sign, the "내일을 응원합니다" poster text,
and every other wall banner. Render these exactly as pixels copied from the
reference image, unchanged frame to frame — do not let the video model
regenerate, redraw, reinterpret, or reflow any of this text or the gauge
needle, even slightly, even for one frame. If motion would risk distorting
any text, keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/claws, no warped, blurred, flickering, or misspelled text
or numbers anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement, no gauge needle movement.

MOUTH MOVEMENT: the owl's beak actively opens and closes continuously in
natural speech rhythm for the full 8 seconds, as if clearly stating a fact —
never static, never barely-moving, never closed-mouth talking.
```

---

## s4 — youth_gap (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl character's design, outfit, and the bright employment center
consultation desk background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

MOTION DETAIL: the owl holds the red-arrow card steadily in one wing at
chest height, pointing at it with the other wing, facing the camera with a
serious, worried expression — not smiling. The card does not travel or
shift position; treat it as a fixed object the owl is simply holding still.
Only the owl's head, eyes, and beak move; every prop and the background are
treated as a frozen photograph layered behind/beside the character.

STATIC ELEMENTS: the background signage, plants, chairs, furniture, and the
card (including its red downward arrow and text) must stay completely fixed
— no camera pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("청년 취업 46개월 연속 감소"), the
large wall sign, and every other wall banner. Render these exactly as pixels
copied from the reference image, unchanged frame to frame — do not let the
video model regenerate, redraw, reinterpret, or reflow any of this text,
even slightly, even for one frame. If motion would risk distorting any text,
keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/claws, no warped, blurred, flickering, or misspelled text
or numbers anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement.

MOUTH MOVEMENT: the owl's beak actively opens and closes continuously in
natural speech rhythm for the full 8 seconds, as if seriously delivering a
contrasting fact — never static, never barely-moving, never closed-mouth
talking.
```

---

## s5 — why_gap (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl character's design, outfit, and the bright employment center
consultation desk background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

MOTION DETAIL: the owl holds a pointer stick steadily aimed at one fixed
spot on the standing board beside it, facing the camera with a calm,
explanatory expression — not smiling. The pointer does not sweep, travel, or
trace along the board — it stays aimed at the same single spot for the whole
clip. Only the owl's head, eyes, and beak move; every prop (including the
board, its diagram, and the pointer) is treated as a frozen photograph
layered behind/beside the character.

STATIC ELEMENTS: the background signage, plants, chairs, furniture, the
standing board (including its "15세~64세 전체 평균" text and the
elderly/youth arrow diagram), and the pointer's position must stay
completely fixed — no camera pan or zoom, no background object movement, no
pointer sweeping or traveling motion, no pointer falling out of the
character's wing.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the board text ("15세~64세 전체 평균", "고령층",
"청년"), the large wall sign, and every other wall banner. Render these
exactly as pixels copied from the reference image, unchanged frame to frame
— do not let the video model regenerate, redraw, reinterpret, or reflow any
of this text or the arrow diagram, even slightly, even for one frame. If
motion would risk distorting any text, keep that element completely static
instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/claws, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage or diagram, no background changes, no character redesign, no abrupt
cut or freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, no pointer
sweeping or traveling motion, no pointer falling.

MOUTH MOVEMENT: the owl's beak actively opens and closes continuously in
natural speech rhythm for the full 8 seconds, as if calmly explaining a
concept — never static, never barely-moving, never closed-mouth talking.
```

---

## s6 — impact (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl character's design, outfit, and the bright employment center
consultation desk background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

MOTION DETAIL: the owl holds the newspaper card steadily in one wing at
chest height, facing the camera with a slightly sad, head-shaking expression
— not smiling. The card does not travel or shift position; treat it as a
fixed object the owl is simply holding still while its head shakes gently in
place. Only the owl's head, eyes, and beak move; every prop and the
background are treated as a frozen photograph layered behind/beside the
character.

STATIC ELEMENTS: the background signage, plants, chairs, furniture, and the
newspaper card (including its "고용률 역대 최고" headline and bar chart)
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

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
talking, no frozen expression while speaking, no card movement.

MOUTH MOVEMENT: the owl's beak actively opens and closes continuously in
natural speech rhythm for the full 8 seconds, as if seriously delivering an
ironic point — never static, never barely-moving, never closed-mouth
talking.
```

---

## s7 — summary (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl character's design, outfit, and the bright employment center
consultation desk background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

MOTION DETAIL: the owl holds one wing raised in a confident, emphasizing
gesture at chest height, facing the camera with a confident, assured
expression — not smiling. The raised wing stays in the same fixed position
and pose for the whole clip; it does not travel, point at different spots,
or change gesture. Only the owl's head, eyes, and beak move; every prop
(including the standing board reading "내 또래는 어떨까?") is treated as a
frozen photograph layered behind/beside the character.

STATIC ELEMENTS: the background signage, plants, chairs, furniture, and the
standing board must stay completely fixed — no camera pan or zoom, no
background object movement, no character displacement out of frame.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the board text ("내 또래는 어떨까?"), the large
wall sign, and every other wall banner. Render these exactly as pixels
copied from the reference image, unchanged frame to frame — do not let the
video model regenerate, redraw, reinterpret, or reflow any of this text,
even slightly, even for one frame. If motion would risk distorting any text,
keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/claws, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no jumping, no hopping, no
character leaving the frame, no camera shake or motion blur.

MOUTH MOVEMENT: the owl's beak actively opens and closes continuously in
natural speech rhythm for the full 8 seconds, as if confidently summarizing
a key takeaway — never static, never barely-moving, never closed-mouth
talking.
```

---

## s8 — action_a (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl character's design, outfit, and the bright employment center
consultation desk background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

MOTION DETAIL: the owl holds both wings steadily out to its sides at chest
height, each wing holding one card ("청년내일채움공제" and
"국민취업지원제도"), facing the camera with a warm, helpful expression —
gentle smile allowed (advice-giving tone). Both cards stay in the same fixed
position for the whole clip; neither travels or changes position. Only the
owl's head, eyes, and beak move; every prop and the background are treated
as a frozen photograph layered behind/beside the character.

STATIC ELEMENTS: the background signage, plants, chairs, furniture, and both
cards (including their text and icons) must stay completely fixed — no
camera pan or zoom, no background object movement, no card movement.

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
talking, no frozen expression while speaking, no card movement.

MOUTH MOVEMENT: the owl's beak actively opens and closes continuously in
natural speech rhythm for the full 8 seconds, as if warmly offering
practical advice — never static, never barely-moving, never closed-mouth
talking.
```

---

## s9 — action_b (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl character's design, outfit, and the bright employment center
consultation desk background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

MOTION DETAIL: the owl holds the smartphone steadily in one wing at chest
height, showing its screen toward the camera, facing the camera with a
calm, informative expression — not smiling. The phone does not tilt, rise,
lower, or move at all — the wing keeps it locked in the same position and
angle for the entire clip. The other wing rests calmly by its side (the
standing sign beside the owl is not touched or gestured at). Only the owl's
head, eyes, and beak move; every prop (including the phone and the standing
sign) is treated as a frozen photograph layered behind/beside the character.

STATIC ELEMENTS: the background signage, plants, chairs, furniture, the
phone screen text, and the standing sign (including its text and icons) must
stay completely fixed — no camera pan or zoom, no background object
movement, no phone movement, no sign movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the phone screen text ("워크넷"), the standing
sign text ("고용복지플러스센터"), the large wall sign, and every other wall
banner. Render these exactly as pixels copied from the reference image,
unchanged frame to frame — do not let the video model regenerate, redraw,
reinterpret, or reflow any of this text, even slightly, even for one frame.
If motion would risk distorting any text, keep that element completely
static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/claws, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no phone movement, no phone
floating or blurring, no sign movement.

MOUTH MOVEMENT: the owl's beak actively opens and closes continuously in
natural speech rhythm for the full 8 seconds, as if calmly informing the
viewer of a resource — never static, never barely-moving, never closed-mouth
talking.
```

---

## s10 — action_c (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl character's design, outfit, and the bright employment center
consultation desk background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

MOTION DETAIL: the owl holds the "구직촉진수당" card steadily in one wing at
chest height while the other wing gives a thumbs-up gesture, facing the
camera with a bright, warm closing smile. Both the card and the thumbs-up
wing stay in the same fixed position for the whole clip; neither travels or
changes pose. Only the owl's head, eyes, and beak move; every prop and the
background are treated as a frozen photograph layered behind/beside the
character.

STATIC ELEMENTS: the background signage, plants, chairs, furniture, and the
card (including its text and icon) must stay completely fixed — no camera
pan or zoom, no background object movement, no card movement.

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
talking, no frozen expression while speaking, no card movement.

MOUTH MOVEMENT: the owl's beak actively opens and closes continuously in
natural speech rhythm for the full 8 seconds, as if warmly closing out the
episode with encouraging information — never static, never barely-moving,
never closed-mouth talking.
```

================================================================================
# 🟩 9초 티어 (1개 씬: s1)
================================================================================

---

## s1 — opening (9초, 실측 8.25초)

```
Animate this image into a 9-second video clip. STYLE CONSISTENCY: keep the
owl character's design (charcoal vest, burgundy tie, sunglasses resting on
forehead), and the bright employment center consultation desk background
exactly as shown in the reference image — same "고용센터" sign, same "상담"
sign, same "내일을 응원합니다" poster. Do not change any colors, text, or
object positions.

MOTION DETAIL: the owl raises one wing slightly in a friendly greeting
gesture that continues in a gentle rhythmic motion throughout the clip (not
a single wave then frozen — keep waving softly, on and off, like a natural
greeting sustained over time), facing the camera with a confident,
trustworthy expression — not smiling, but warm and engaged eyes. The other
wing rests calmly by its side. Only the raised wing sways gently in place;
it does not travel toward any prop or change to a different gesture.

STATIC ELEMENTS: the background signage ("고용센터", "상담", "내일을
응원합니다"), plants, chairs, and furniture must remain completely still —
no camera pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
9 seconds — this includes the large "고용센터" wall sign, the "상담" sign,
the "내일을 응원합니다" poster text, and every other wall banner. Render
these exactly as pixels copied from the reference image, unchanged frame to
frame — do not let the video model regenerate, redraw, reinterpret, or
reflow any of this text, even slightly, even for one frame. If motion would
risk distorting any text, keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/claws, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking.

MOUTH MOVEMENT: the owl's beak actively opens and closes continuously in
natural speech rhythm for the full 9 seconds, as if energetically greeting
and introducing itself — never static, never barely-moving, never
closed-mouth talking.
```
