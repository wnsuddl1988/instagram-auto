# 금박사 7편(예금자보호 한도 1억원) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/geumbaksa-ep7-images/`
영상 저장 폴더(신규 생성, 조립 스펙이 참조하는 파일명 그대로): `C:/tmp/geumbaksa-ep7-videos/`

씬 길이 티어는 TTS 실측(`rawAudioDurationSec`) 기준, CURRENT_STANDARDS.md 원칙(8초 미만→8초 요청, 8초 이상→실측+1초 미만) 그대로 적용.

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 길이 티어 |
|---|---|---|---|
| s1 opening | `geumbaksa_ep7_s1.png` | `ep7_s1_video.mp4` | 8초 |
| s2 hook | `geumbaksa_ep7_s2.png` | `ep7_s2_video.mp4` | 8초 |
| s3 definition | `geumbaksa_ep7_s3.png` | `ep7_s3_video.mp4` | 8초 |
| s4 compare | `geumbaksa_ep7_s4.png` | `ep7_s4_video.mp4` | **10초** (실측 9.62초) |
| s5 myth | `geumbaksa_ep7_s5.png` | `ep7_s5_video.mp4` | 8초 |
| s6 method | `geumbaksa_ep7_s6.png` | `ep7_s6_video.mp4` | **9초** (실측 8.51초) |
| s7 savings_bank | `geumbaksa_ep7_s7.png` | `ep7_s7_video.mp4` | 8초 |
| s8 pension | `geumbaksa_ep7_s8.png` | `ep7_s8_video.mp4` | 8초 |
| s9 not_automatic | `geumbaksa_ep7_s9.png` | `ep7_s9_video.mp4` | 8초 |
| s10 how_to_apply | `geumbaksa_ep7_s10.png` | `ep7_s10_video.mp4` | 8초 |
| s11 closing | `geumbaksa_ep7_s11.png` | `ep7_s11_video.mp4` | 8초 |

★ 영상 생성 절대규칙(2026-09-21, 87씬 전수조사 확정, `_ai/CURRENT_STANDARDS.md` §0) 전부 반영:
- 소품을 든 손은 **한 지점 고정**("holds steadily at", 이동·반복 왕복 지시 금지)
- **동작은 소품을 안 든 빈 쪽에만** 배정
- 소품·보드는 전부 "frozen photograph layered behind/beside the character"로 명시
- 텍스트는 CRITICAL TEXT PRESERVATION(HIGHEST PRIORITY) 블록으로 고정

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작 프레임에서 텍스트, 끝 프레임에서 소품·표정 확인.

================================================================================
# 🟦 8초 티어 (9개 씬: s1·s2·s3·s5·s7·s8·s9·s10·s11)
================================================================================

---

## s1 — opening (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin character's design (bright gold coin body, white gloved hands and
feet, smiling friendly face with rosy cheeks) and the bright bank
consultation desk background exactly as shown in the reference image — same
"예금자보호제도" sign, same "저축" poster, same "상담" sign. Do not change
any colors, text, or object positions.

MOTION DETAIL: the character raises one gloved hand in a warm greeting wave
that continues in a gentle rhythmic motion throughout the clip (not a single
wave then frozen — keep waving softly, on and off), while its whole body
sways slightly side to side with cheerful energy, as if introducing itself
warmly. Eyes stay bright and engaged, cheeks stay rosy, smile stays warm
throughout.

STATIC ELEMENTS: the background signage ("예금자보호제도", "저축", "상담"),
plants, desk, and furniture must remain completely still — no camera pan or
zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the large "예금자보호제도" wall sign, the "저축"
poster, the "상담" sign, and every other wall banner. Render these exactly
as pixels copied from the reference image, unchanged frame to frame — do not
let the video model regenerate, redraw, reinterpret, or reflow any of this
text, even slightly, even for one frame. If motion would risk distorting any
text, keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking.

MOUTH MOVEMENT: the character's mouth actively opens and closes continuously
in natural speech rhythm for the entire clip, as if energetically greeting
and introducing itself — never static, never barely-moving, never
closed-mouth talking, even while smiling.
```

---

## s2 — hook (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin character's design and the bright bank consultation desk
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds the card steadily in one hand at chest
height with a puzzled, curious head tilt — only the character's head, eyes,
eyebrows, and mouth move. The card itself does not shake, wave, or shift
position; treat it as a fixed object the character is simply holding still
while its face shows curiosity/worry (eyebrows lift slightly, eyes widen a
touch). The small question mark icon beside the character is treated as a
frozen photograph layered behind/beside the character — it does not move,
bounce, or spin. Only the character's body and face move; every prop and
the background are treated as a frozen photograph layered behind/beside the
character.

STATIC ELEMENTS: the background signage, plants, desk, furniture, and the
card in the character's hand stay completely fixed — no camera pan or zoom,
no background object movement, no card movement, no icon movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card reading "내 돈은 안전할까?", the large
wall sign, and every other wall banner. Render these exactly as pixels
copied from the reference image, unchanged frame to frame — do not let the
video model regenerate, redraw, reinterpret, or reflow any of this text,
even slightly, even for one frame. If motion would risk distorting any text,
keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement or shaking,
no icon movement.

MOUTH MOVEMENT: the character's mouth actively opens and closes continuously
in natural speech rhythm for the entire clip, as if curiously posing a
question — never static, never barely-moving, never closed-mouth talking.
```

---

## s3 — definition (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin character's design and the bright bank consultation desk
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds the card steadily in one hand at chest
height, its other hand giving a thumbs-up gesture, facing the camera with a
confident expression — not smiling excessively, just assured. The card does
not travel or shift position; treat it as a fixed object the character is
simply holding still. The thumbs-up hand stays in the same fixed position
and pose for the whole clip. Only the character's head, eyes, and mouth
move; every prop and the background are treated as a frozen photograph
layered behind/beside the character.

STATIC ELEMENTS: the background signage, plants, desk, furniture, and the
card (including its "5천만원 → 1억원" text) must stay completely fixed — no
camera pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("5천만원 → 1억원"), the large wall
sign, and every other wall banner. Render these exactly as pixels copied
from the reference image, unchanged frame to frame — do not let the video
model regenerate, redraw, reinterpret, or reflow any of this text or
numbers, even slightly, even for one frame. If motion would risk distorting
any text, keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text or
numbers anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement.

MOUTH MOVEMENT: the character's mouth actively opens and closes continuously
in natural speech rhythm for the entire clip, as if confidently stating a
fact — never static, never barely-moving, never closed-mouth talking.
```

---

## s5 — myth correction (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin character's design and the bright bank consultation desk
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds one hand up in a "stop" gesture at chest
height while the other hand points at the standing board beside it, facing
the camera with a firm, serious expression — not smiling. Both hands stay in
the same fixed position and pose for the whole clip; neither travels or
changes gesture. Only the character's head, eyes, and mouth move; every prop
(including the standing board and its diagram) is treated as a frozen
photograph layered behind/beside the character.

STATIC ELEMENTS: the background signage, plants, desk, furniture, and the
standing board (including its account icons, arrow, and "소용없음" text)
must stay completely fixed — no camera pan or zoom, no background object
movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the board text ("계좌 쪼개도", "소용없음", "한도는
1억원까지"), the large wall sign, and every other wall banner. Render these
exactly as pixels copied from the reference image, unchanged frame to frame
— do not let the video model regenerate, redraw, reinterpret, or reflow any
of this text or the diagram, even slightly, even for one frame. If motion
would risk distorting any text, keep that element completely static
instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage or diagram, no background changes, no character redesign, no abrupt
cut or freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, no hand movement,
no gesture change.

MOUTH MOVEMENT: the character's mouth actively opens and closes continuously
in natural speech rhythm for the entire clip, as if firmly correcting a
misconception — never static, never barely-moving, never closed-mouth
talking.
```

---

## s7 — savings bank note (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin character's design and the bright bank consultation desk
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds the card steadily in one hand at chest
height, pointing at it with the other hand in a confident, explanatory
gesture, facing the camera with an assured expression. The card does not
travel or shift position; treat it as a fixed object the character is
simply holding still while pointing at the same single spot on it. Only the
character's head, eyes, and mouth move; every prop and the background are
treated as a frozen photograph layered behind/beside the character.

STATIC ELEMENTS: the background signage, plants, desk, furniture, and the
card (including its "시중은행 = 저축은행", "한도 동일 1억원" text and bank
icons) must stay completely fixed — no camera pan or zoom, no background
object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("시중은행", "저축은행", "한도
동일", "1억원"), the large wall sign, and every other wall banner. Render
these exactly as pixels copied from the reference image, unchanged frame to
frame — do not let the video model regenerate, redraw, reinterpret, or
reflow any of this text, even slightly, even for one frame. If motion would
risk distorting any text, keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no pointing
hand traveling.

MOUTH MOVEMENT: the character's mouth actively opens and closes continuously
in natural speech rhythm for the entire clip, as if confidently clarifying a
fact — never static, never barely-moving, never closed-mouth talking.
```

---

## s8 — pension separate (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin character's design and the bright bank consultation desk
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds the card steadily in one hand at chest
height, pointing at it with the other hand, facing the camera with a calm,
explanatory expression — not smiling. The card does not travel or shift
position; treat it as a fixed object the character is simply holding still.
The pointing hand stays aimed at the same single spot on the card. Only the
character's head, eyes, and mouth move; every prop and the background are
treated as a frozen photograph layered behind/beside the character.

STATIC ELEMENTS: the background signage, plants, desk, furniture, and the
card (including its "별도 한도로 보호됩니다", "일반 예금 1억원", "퇴직연금·
연금저축 1억원" text and icons) must stay completely fixed — no camera pan
or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("별도 한도로 보호됩니다", "일반
예금", "퇴직연금·연금저축", "1억원" ×2), the large wall sign, and every
other wall banner. Render these exactly as pixels copied from the reference
image, unchanged frame to frame — do not let the video model regenerate,
redraw, reinterpret, or reflow any of this text or numbers, even slightly,
even for one frame. If motion would risk distorting any text, keep that
element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text or
numbers anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement, no pointing hand traveling.

MOUTH MOVEMENT: the character's mouth actively opens and closes continuously
in natural speech rhythm for the entire clip, as if calmly explaining an
additional rule — never static, never barely-moving, never closed-mouth
talking.
```

---

## s9 — not automatic (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin character's design and the bright bank consultation desk
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds the card steadily in one hand at chest
height, its other hand resting on its own chin in a thoughtful/serious
gesture, facing the camera with a concerned expression — not smiling. The
card does not travel or shift position; treat it as a fixed object the
character is simply holding still. The hand at the chin stays in the same
fixed position for the whole clip. Only the character's head, eyes, and
mouth move; every prop and the background are treated as a frozen
photograph layered behind/beside the character.

STATIC ELEMENTS: the background signage, plants, desk, furniture, and the
card (including its passbook icon, "자동 입금 아님", "예금보험공사에 직접
신청" text) must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("통장", "자동 입금", "아님",
"예금보험 공사에", "직접 신청"), the large wall sign, and every other wall
banner. Render these exactly as pixels copied from the reference image,
unchanged frame to frame — do not let the video model regenerate, redraw,
reinterpret, or reflow any of this text, even slightly, even for one frame.
If motion would risk distorting any text, keep that element completely
static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no hand
movement.

MOUTH MOVEMENT: the character's mouth actively opens and closes continuously
in natural speech rhythm for the entire clip, as if seriously delivering an
important warning — never static, never barely-moving, never closed-mouth
talking.
```

---

## s10 — how to apply (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin character's design and the bright bank consultation desk
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds the smartphone steadily in one hand at
chest height, showing its screen toward the camera, facing the camera with
a warm, hopeful expression — gentle smile allowed. The phone does not tilt,
rise, lower, or move at all — the hand keeps it locked in the same position
and angle for the entire clip. The other hand rests calmly by its side.
Only the character's head, eyes, and mouth move; every prop is treated as a
frozen photograph layered behind/beside the character.

STATIC ELEMENTS: the background signage, plants, desk, furniture, and the
phone screen text must stay completely fixed — no camera pan or zoom, no
background object movement, no phone movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the phone screen text ("예금보험공사", "신청"),
the large wall sign, and every other wall banner. Render these exactly as
pixels copied from the reference image, unchanged frame to frame — do not
let the video model regenerate, redraw, reinterpret, or reflow any of this
text, even slightly, even for one frame. If motion would risk distorting
any text, keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no phone movement, no phone
floating or blurring.

MOUTH MOVEMENT: the character's mouth actively opens and closes continuously
in natural speech rhythm for the entire clip, as if warmly explaining a
helpful process — never static, never barely-moving, never closed-mouth
talking.
```

---

## s11 — closing (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin character's design and the bright bank consultation desk
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character raises one gloved hand in a warm greeting wave
that continues in a gentle rhythmic motion throughout the clip (not a single
wave then frozen — keep waving softly, on and off), while its whole body
sways slightly side to side with cheerful energy, as if warmly closing out
the episode. The other hand stays in a relaxed fist at its side. Eyes stay
bright and engaged, cheeks stay rosy, smile stays warm throughout.

STATIC ELEMENTS: the background signage, plants, desk, and furniture must
remain completely still — no camera pan or zoom, no background object
movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the large wall sign and every other wall banner.
Render these exactly as pixels copied from the reference image, unchanged
frame to frame — do not let the video model regenerate, redraw, reinterpret,
or reflow any of this text, even slightly, even for one frame. If motion
would risk distorting any text, keep that element completely static
instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking.

MOUTH MOVEMENT: the character's mouth actively opens and closes continuously
in natural speech rhythm for the entire clip, as if warmly closing out the
episode with a friendly reminder — never static, never barely-moving, never
closed-mouth talking.
```

================================================================================
# 🟩 9~10초 티어 (2개 씬: s4·s6)
================================================================================

---

## s4 — compare (10초, 실측 9.62초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold coin character's design and the bright bank consultation desk
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds the card steadily in one hand at chest
height, pointing at it with the other hand aimed at one fixed spot, facing
the camera with a serious, explanatory expression — not smiling. The card
does not travel or shift position; treat it as a fixed object the character
is simply holding still. The pointing hand does not sweep between the two
comparison boxes on the card — it stays aimed at the same single spot for
the whole clip. Only the character's head, eyes, and mouth move; every prop
and the background are treated as a frozen photograph layered behind/beside
the character.

STATIC ELEMENTS: the background signage, plants, desk, furniture, and the
card (including its "9천만원 → 9천만원 전액 보호" and "1억2천만원 → 1억원만
보호, 2천만원 초과" text, check and X icons) must stay completely fixed — no
camera pan or zoom, no background object movement, no card movement, no
pointing hand sweeping between boxes.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
10 seconds — this includes both comparison boxes' text and numbers
("9천만원", "전액 보호", "1억2천만원", "1억원만 보호", "2천만원 초과"), the
large wall sign, and every other wall banner. Render these exactly as pixels
copied from the reference image, unchanged frame to frame — do not let the
video model regenerate, redraw, reinterpret, or reflow any of this text or
numbers, even slightly, even for one frame. If motion would risk distorting
any text, keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text or
numbers anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement, no pointing hand sweeping or traveling.

MOUTH MOVEMENT: the character's mouth actively opens and closes continuously
in natural speech rhythm for the full 10 seconds, as if clearly explaining a
comparison — never static, never barely-moving, never closed-mouth talking.
```

---

## s6 — real method (9초, 실측 8.51초)

```
Animate this image into a 9-second video clip. STYLE CONSISTENCY: keep the
gold coin character's design and the bright bank consultation desk
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds one hand up in a bright, confident
pointing gesture aimed at one fixed spot on the standing board beside it,
facing the camera with a happy, assured expression. The pointing hand does
not sweep or travel across the board — it stays aimed at the same single
spot for the whole clip. The other hand rests calmly by its side. Only the
character's head, eyes, and mouth move; every prop (including the standing
board and its diagram) is treated as a frozen photograph layered
behind/beside the character.

STATIC ELEMENTS: the background signage, plants, desk, furniture, and the
standing board (including its "은행 분산이 정답입니다!", "A은행", "B은행",
"9천만원 전액 보호" ×2, "총 1억8천만원" text and bank icons) must stay
completely fixed — no camera pan or zoom, no background object movement, no
pointing hand sweeping or traveling.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
9 seconds — this includes all board text and numbers ("은행 분산이
정답입니다!", "A은행", "B은행", "9천만원", "전액 보호", "총 1억8천만원"), the
large wall sign, and every other wall banner. Render these exactly as pixels
copied from the reference image, unchanged frame to frame — do not let the
video model regenerate, redraw, reinterpret, or reflow any of this text or
numbers, even slightly, even for one frame. If motion would risk distorting
any text, keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text or
numbers anywhere in the frame (large or small), no regenerated or
reinterpreted signage or diagram, no background changes, no character
redesign, no abrupt cut or freeze mid-motion, no static mouth, no minimal
lip movement, no closed-mouth talking, no frozen expression while speaking,
no pointing hand sweeping or traveling.

MOUTH MOVEMENT: the character's mouth actively opens and closes continuously
in natural speech rhythm for the full 9 seconds, as if brightly presenting
the real solution — never static, never barely-moving, never closed-mouth
talking.
```
