# 금박사 6편(소득대체율 43%) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/geumbaksa-ep6-images/`
영상 저장 폴더(신규 생성, 조립 스펙이 참조하는 파일명 그대로): `C:/tmp/geumbaksa-ep6-videos/`

씬 길이 티어는 TTS 실측(`rawAudioDurationSec`) 기준, CURRENT_STANDARDS.md 원칙(8초 미만→8초 요청, 8초 이상→실측+1초 미만) 그대로 적용.

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 길이 티어 |
|---|---|---|---|
| s1 opening | `geumbaksa_ep6_s1.png` | `ep6_s1_video.mp4` | 8초 |
| s2 hook | `geumbaksa_ep6_s2.png` | `ep6_s2_video.mp4` | 8초 |
| s3 one_line_definition | `geumbaksa_ep6_s3.png` | `ep6_s3_video.mp4` | 8초 |
| s4 formula | `geumbaksa_ep6_s4.png` | `ep6_s4_video.mp4` | **9초** (실측 8.33초) |
| s5 condition | `geumbaksa_ep6_s5.png` | `ep6_s5_video.mp4` | 8초 |
| s6 reality_check | `geumbaksa_ep6_s6.png` | `ep6_s6_video.mp4` | 8초 |
| s7 summary | `geumbaksa_ep6_s7.png` | `ep6_s7_video.mp4` | 8초 |
| s8 action_a | `geumbaksa_ep6_s8.png` | `ep6_s8_video.mp4` | 8초 |
| s9 action_b | `geumbaksa_ep6_s9.png` | `ep6_s9_video.mp4` | 8초 |
| s10 action_c | `geumbaksa_ep6_s10.png` | `ep6_s10_video.mp4` | 8초 |

각 프롬프트는 CURRENT_STANDARDS.md 영상 생성 5요소(스타일유지/동작디테일/정지요소/부정프롬프트/입움직임)를 전부 포함. **씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 특히 배경 텍스트(카드/보드에 적힌 한글 문구)가 왜곡되지 않았는지 프레임 끝까지 확인.

Veo 생성기 사용 시 길이는 프롬프트 서두("Animate this image into an N-second video clip")와 생성기 옵션(`--duration` 등)에 티어값 그대로 넣을 것.

================================================================================
# 🟦 8초 티어 (9개 씬: s1·s2·s3·s5·s6·s7·s8·s9·s10)
================================================================================

---

## s1 — opening (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin character's design (bright gold coin body, white gloved hands and
feet, smiling friendly face with rosy cheeks) and the bright cozy study/living
room background exactly as shown in the reference image — same wooden
bookshelf, same calendar on the wall, same sticky notes, same warm daylight
tone. Do not change any colors, text, or object positions.

MOTION DETAIL: the character raises one gloved hand in a warm greeting wave
that continues in a gentle rhythmic motion throughout the clip (not a single
wave then frozen — keep waving softly, on and off), while its whole body
sways slightly side to side with cheerful energy, as if introducing itself
warmly. Eyes stay bright and engaged, cheeks stay rosy, smile stays warm
throughout.

STATIC ELEMENTS: the background room, bookshelf, calendar, plants, and all
sticky notes must stay completely fixed — no camera pan or zoom, no
background object movement, no drifting.

CRITICAL TEXT PRESERVATION: every piece of Korean text visible anywhere in
the frame — the calendar text, the sticky notes on the shelf and wall — must
remain pixel-perfect identical to the reference image for the entire 8
seconds. Do not let any character shift, blur, morph, duplicate, or misspell.
Treat every visible letter as a fixed, unchangeable pixel pattern. If motion
would risk distorting any text, keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped or misspelled text anywhere in the frame, no
background changes, no character redesign, no abrupt cut or freeze mid-motion,
no static mouth, no minimal lip movement, no closed-mouth talking, no frozen
expression while speaking.

MOUTH MOVEMENT: the character's mouth actively opens and closes continuously
in natural speech rhythm for the entire clip, as if energetically greeting
and introducing itself — never static, never barely-moving, never
closed-mouth talking, even while smiling.
```

---

## s2 — hook (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin character's design and the bright study/living room background
exactly as shown in the reference image — same bookshelf, calendar, sticky
notes, warm daylight tone. The character holds a card reading "소득대체율
43%" in its hand. Do not change any colors, text, or object positions.

MOTION DETAIL: the character holds the card steadily in one place with a
puzzled, curious head tilt — only the character's head, eyes, eyebrows, and
mouth move. The card itself does not shake, wave, or shift position; treat
it as a fixed object the character is simply holding still while its face
shows curiosity/surprise (eyebrows lift slightly, eyes widen a touch), while
remaining warm and friendly, never alarmed. Only the character's body, arms,
and face move — every prop and background element is treated as a frozen
photograph layered behind/beside the character.

STATIC ELEMENTS: the background room, bookshelf, calendar, all sticky notes,
and the card in the character's hand stay completely fixed — no camera pan
or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card reading "소득대체율 43%" and every piece
of Korean text visible in the background (calendar, sticky notes). Render
these exactly as pixels copied from the reference image, unchanged frame to
frame — do not let the video model regenerate, redraw, reinterpret, or
reflow any of this text, even slightly, even for one frame. If motion would
risk distorting any text, keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement or shaking.

MOUTH MOVEMENT: the character's mouth actively opens and closes continuously
in natural speech rhythm for the entire clip, as if curiously posing a
question — never static, never barely-moving, never closed-mouth talking.
```

---

## s3 — one_line_definition (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin character's design and the bright study background exactly as
shown in the reference image — same bookshelf, calendar, "시간의 흐름" graph
board, plants. The character stands beside a small balance scale with two
cards reading "내가 벌던 돈" and "연금으로 받는 돈". Do not change any colors,
text, or object positions.

MOTION DETAIL: the character keeps one open hand held steadily toward the
balance scale, as if presenting it, with small natural body sway and a
steady, composed posture. The hand does not travel back and forth between
points — it stays in one fixed presenting position for the whole clip while
the face explains the concept clearly and confidently. Only the character's
head, eyes, and mouth move; every prop and background element, including the
balance scale and its cards, is treated as a frozen photograph layered
behind/beside the character.

STATIC ELEMENTS: the background room, bookshelf, calendar, graph board, and
the balance scale itself (including its two hanging cards) must stay
completely fixed — no camera pan or zoom, no background object movement, no
scale swinging on its own.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the text on both cards hanging from the scale
("내가 벌던 돈" / "연금으로 받는 돈") and every piece of Korean text in the
background (calendar, graph board, notes). Render these exactly as pixels
copied from the reference image, unchanged frame to frame — do not let the
video model regenerate, redraw, reinterpret, or reflow any of this text,
even slightly, even for one frame. If motion would risk distorting any text,
keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no scale movement, no hand
traveling between points.

MOUTH MOVEMENT: the character's mouth actively opens and closes continuously
in natural speech rhythm for the entire clip, as if clearly explaining a
definition — never static, never barely-moving, never closed-mouth talking.
```

---

## s5 — condition (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin character's design and the bright study background exactly as
shown in the reference image — same bookshelf, calendar, and the whiteboard
reading "20세 → 60세 / 40년 만근" with a timeline diagram. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds a pointer stick steadily aimed at one
fixed spot on the timeline, facing the camera with a slightly more serious,
emphatic expression (without losing warmth), as if stressing an important
condition. The pointer does not sweep or travel along the timeline — it
stays aimed at the same single spot for the whole clip. Only the character's
body, arm, eyes, and mouth move; every prop and background element,
including the pointer and whiteboard, is treated as a frozen photograph
layered behind/beside the character.

STATIC ELEMENTS: the background room, bookshelf, calendar, whiteboard, the
timeline diagram on it, and the pointer stick's position must stay
completely fixed — no camera pan or zoom, no background object movement, no
pointer movement, no pointer falling or dropping.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the whiteboard text ("20세 → 60세", "40년 만근",
"20세 사회생활 시작", "60세 행복한 은퇴") and every piece of Korean text in
the background (calendar, sticky notes). Render these exactly as pixels
copied from the reference image, unchanged frame to frame — do not let the
video model regenerate, redraw, reinterpret, or reflow any of this text,
even slightly, even for one frame. If motion would risk distorting any text,
keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no pointer sweeping or
traveling motion, no pointer falling out of the character's hand.

MOUTH MOVEMENT: the character's mouth actively opens and closes continuously
in natural speech rhythm for the entire clip, as if seriously emphasizing an
important condition — never static, never barely-moving, never closed-mouth
talking.
```

---

## s6 — reality_check (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin character's design and the bright study background exactly as
shown in the reference image — same bookshelf, calendar, and the whiteboard
reading "국민연금 가입기간 비교" with two comparison bars (40년 만근 / 평균
가입기간 20년) and two sticky notes ("평균 가입기간 20년", "소득대체율
21.5%"). The character holds a small sign reading "국민연금 현실 확인" with a
slightly surprised/concerned expression. Do not change any colors, text, or
object positions.

MOTION DETAIL: the character holds the pointer stick steadily pointed at one
fixed spot on the comparison bars, facing the camera with a mild, surprised
expression (raised eyebrows, slightly open mouth beyond speech). The pointer
does not move, sweep, or travel along the chart — it stays aimed at the same
single spot for the whole clip. Only the character's body, arm, eyes, and
mouth move; every prop and background element is treated as a frozen
photograph layered behind/beside the character.

STATIC ELEMENTS: the background room, bookshelf, calendar, whiteboard, the
comparison bar chart, the two sticky notes on it, and the pointer stick's
position must stay completely fixed — no camera pan or zoom, no background
object movement, no pointer movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the whiteboard text ("국민연금 가입기간 비교",
"40년 만근", "평균 가입기간", "20년", "40년"), the two sticky notes ("평균
가입기간 20년", "소득대체율 21.5%"), the sign in the character's hand ("국민
연금 현실 확인"), and every piece of Korean text in the background. Render
these exactly as pixels copied from the reference image, unchanged frame to
frame — do not let the video model regenerate, redraw, reinterpret, or
reflow any of this text or any number on it, even slightly, even for one
frame. If motion would risk distorting any text, keep that element
completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text or
numbers anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no pointer
sweeping or traveling motion, no new numbers or labels appearing.

MOUTH MOVEMENT: the character's mouth actively opens and closes continuously
in natural speech rhythm for the entire clip, as if delivering a slightly
surprising reality check — never static, never barely-moving, never
closed-mouth talking.
```

---

## s7 — summary (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin character's design and the bright study background exactly as
shown in the reference image — same bookshelf, calendar, and the whiteboard
reading "핵심 정리!" with two numbered boxes ("① 43% = 최댓값" and "② 내
가입기간 × 1.075% = 진짜 내 몫"). Do not change any colors, text, or object
positions.

MOTION DETAIL: the character holds a single steady thumbs-up gesture at chest
height with a warm, assured smile, as if confidently wrapping up the
explanation. The hand does not travel, point at different boxes, or change
gesture — it stays in the same fixed position and pose for the whole clip.
Only the character's head, eyes, and mouth move; every prop and background
element, including the whiteboard, is treated as a frozen photograph layered
behind/beside the character. The character's feet stay planted and its body
stays within the same frame position throughout — no jumping, no hopping, no
large body displacement.

STATIC ELEMENTS: the background room, bookshelf, calendar, whiteboard, and
both numbered summary boxes must stay completely fixed — no camera pan or
zoom, no background object movement, no character displacement out of frame.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the whiteboard text ("핵심 정리!", "43% =
최댓값", "아무리 길게 가입해도 43%가 최대예요!", "내 가입기간 × 1.075% =
진짜 내 몫", "내가 실제로 받을 수 있는 연금은 가입한 기간에 따라 계산돼요!",
"지금부터 꼼꼼히 준비해요!") and every piece of Korean text in the
background. Render these exactly as pixels copied from the reference image,
unchanged frame to frame — do not let the video model regenerate, redraw,
reinterpret, or reflow any of this text, even slightly, even for one frame.
If motion would risk distorting any text, keep that element completely
static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no jumping, no hopping, no
character leaving the frame, no camera shake or motion blur.

MOUTH MOVEMENT: the character's mouth actively opens and closes continuously
in natural speech rhythm for the entire clip, as if confidently summarizing
the key takeaway — never static, never barely-moving, never closed-mouth
talking.
```

---

## s8 — action_a (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin character's design and the bright study background exactly as
shown in the reference image — same bookshelf, calendar, and the whiteboard
reading "비어있는 기간도 다시 채울 수 있어요!" with a puzzle-piece diagram
(납부한 기간 / 비어있는 기간 / 납부한 기간) and text "추후납부로 든든한
노후를 준비하세요!". The character holds a sign reading "추후납부 최대
119개월" with a warm, hopeful expression. Do not change any colors, text, or
object positions.

MOTION DETAIL: the character holds the sign steadily in one hand at chest
height with an encouraging, hopeful expression (gentle smile, soft eyes), as
if offering helpful advice. The sign does not move, and the character does
not point toward the whiteboard — it stays in one fixed position for the
whole clip while its face conveys warmth. Only the character's head, eyes,
and mouth move; every prop and background element, including the sign and
whiteboard, is treated as a frozen photograph layered behind/beside the
character.

STATIC ELEMENTS: the background room, bookshelf, calendar, whiteboard, the
puzzle-piece diagram on it, and the sign in the character's hand must stay
completely fixed — no camera pan or zoom, no background object movement, no
sign movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the sign in the character's hand ("추후납부
최대 119개월"), the whiteboard text ("비어있는 기간도 다시 채울 수 있어요!",
"납부한 기간", "비어있는 기간", "추후납부로 든든한 노후를 준비하세요!"), and
every piece of Korean text in the background. Render these exactly as pixels
copied from the reference image, unchanged frame to frame — do not let the
video model regenerate, redraw, reinterpret, or reflow any of this text or
any number on it, even slightly, even for one frame. If motion would risk
distorting any text, keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text or
numbers anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no sign movement, no pointing
gesture toward the whiteboard.

MOUTH MOVEMENT: the character's mouth actively opens and closes continuously
in natural speech rhythm for the entire clip, as if warmly offering practical
advice — never static, never barely-moving, never closed-mouth talking.
```

---

## s9 — action_b (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin character's design and the bright study background exactly as
shown in the reference image — same bookshelf, calendar, and the whiteboard
reading "더 든든한 내일을 위해 가입기간을 이어가세요!" with a timeline arrow
(지금 → 임의계속가입 기간 연장 → 65세 전) and text "지금의 노력이 더 행복한
내일을 만듭니다!". The character holds a sign reading "임의계속가입 65세
전" with a warm, encouraging smile. Do not change any colors, text, or object
positions.

MOTION DETAIL: the character holds the sign steadily in one hand at chest
height with a warm, encouraging smile, its other arm resting calmly by its
side. The character does not point at or trace the timeline arrow on the
whiteboard — it simply stands facing the camera holding the sign still while
its face and mouth express warm encouragement. Only the character's head,
eyes, and mouth move; every prop and background element, including the
whiteboard, is treated as a frozen photograph layered behind/beside the
character.

STATIC ELEMENTS: the background room, bookshelf, calendar, whiteboard, the
timeline arrow diagram on it, and the sign in the character's hand must stay
completely fixed — no camera pan or zoom, no background object movement, no
sign movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the sign in the character's hand ("임의계속가입
65세 전"), the whiteboard text ("더 든든한 내일을 위해 가입기간을
이어가세요!", "지금", "임의계속가입 기간 연장", "65세 전", "지금의 노력이
더 행복한 내일을 만듭니다!"), and every piece of Korean text in the
background. Render these exactly as pixels copied from the reference image,
unchanged frame to frame — do not let the video model regenerate, redraw,
reinterpret, or reflow any of this text, even slightly, even for one frame.
If motion would risk distorting any text, keep that element completely
static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no sign movement, no pointing
gesture, no hand traveling toward the whiteboard.

MOUTH MOVEMENT: the character's mouth actively opens and closes continuously
in natural speech rhythm for the entire clip, as if warmly encouraging the
viewer — never static, never barely-moving, never closed-mouth talking.
```

---

## s10 — action_c (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin character's design and the bright study background exactly as
shown in the reference image — same bookshelf, calendar, and the whiteboard
reading "더 든든한 내일을 위해 지금, 확인해요!" with a checklist ("지금의
꾸준함" / "더 큰 행복" / "함께하는 미래", all checked). The character holds
up a smartphone showing "내 가입기간 조회" with a green checkmark on screen,
smiling brightly. Do not change any colors, text, or object positions.

MOTION DETAIL: the character holds the smartphone steadily in one fixed
position toward the viewer with a bright, warm closing smile. The phone does
not tilt, rise, lower, or move at all — the character's hand keeps it locked
in the same position and angle for the entire clip, as if simply presenting
it to the camera. Only the character's head, eyes, and mouth move; every
prop and background element, including the phone itself, is treated as a
frozen photograph layered behind/beside the character.

STATIC ELEMENTS: the background room, bookshelf, calendar, whiteboard, the
checklist on it, and the smartphone in the character's hand must stay
completely fixed — no camera pan or zoom, no background object movement, no
phone movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the smartphone screen text ("내 가입기간 조회"
with the green checkmark), the whiteboard text ("더 든든한 내일을 위해 지금,
확인해요!", "지금의 꾸준함", "더 큰 행복", "함께하는 미래"), and every piece
of Korean text in the background. Render these exactly as pixels copied from
the reference image, unchanged frame to frame — do not let the video model
regenerate, redraw, reinterpret, or reflow any of this text, and do not let
it add any new checklist items or text that was not in the reference image,
even slightly, even for one frame. If motion would risk distorting any text,
keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated, reinterpreted, or
newly-invented text or checklist items, no background changes, no character
redesign, no abrupt cut or freeze mid-motion, no static mouth, no minimal
lip movement, no closed-mouth talking, no frozen expression while speaking,
no phone movement, no phone floating or blurring, no phone leaving the
character's hand.

MOUTH MOVEMENT: the character's mouth actively opens and closes continuously
in natural speech rhythm for the entire clip, as if warmly closing out the
episode and inviting the viewer to check their own pension info — never
static, never barely-moving, never closed-mouth talking.
```

================================================================================
# 🟩 9초 티어 (1개 씬: s4)
================================================================================

---

## s4 — formula (9초, 실측 8.33초)

```
Animate this image into a 9-second video clip. STYLE CONSISTENCY: keep the
gold coin character's design and the bright study/desk background exactly as
shown in the reference image — same bookshelf, "시간이 만드는 더 큰 미래" bar
chart poster, desk lamp, warm daylight tone. The character holds up a card
reading "가입기간 × 1.075% = 소득대체율" with a small bar chart below it
(10년/20년/30년/40년 with percentages). Do not change any colors, text, or
object positions.

MOTION DETAIL: the character keeps its other hand steadily pointed at one
fixed spot on the card it holds, as if explaining a calculation, with small
natural body sway. The pointing hand does not travel to different parts of
the card — it stays aimed at the same single spot for the whole clip while
the face and mouth do the explaining. Only the character's body, arm, eyes,
and mouth move; every prop and background element, including the card and
bar chart, is treated as a frozen photograph layered behind/beside the
character.

STATIC ELEMENTS: the background room, bookshelf, poster, desk, lamp, and the
card and bar chart held by the character must stay completely fixed — no
camera pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION: the formula text on the card ("가입기간 ×
1.075% = 소득대체율") and the bar chart numbers/labels (10년 10.8%, 20년
21.5%, 30년 32.3%, 40년 43.0%), plus every piece of Korean text in the
background, must remain pixel-perfect identical to the reference image for
the entire 9 seconds. Do not let any character, digit, or percent sign shift,
blur, morph, duplicate, or misspell. Treat every visible letter and number as
a fixed, unchangeable pixel pattern. If motion would risk distorting any
text, keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped or misspelled text or numbers anywhere in the
frame, no background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking.

MOUTH MOVEMENT: the character's mouth actively opens and closes continuously
in natural speech rhythm for the entire clip, as if walking through a
calculation clearly and steadily — never static, never barely-moving, never
closed-mouth talking.
```
