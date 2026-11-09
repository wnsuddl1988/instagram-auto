# 부엉박사 12편(토지거래허가구역 실거주 유예 1년 연장) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/owl-ep12-images/`
영상 저장 폴더(신규 생성): `C:/tmp/owl-ep12-videos/`

씬 길이 티어는 TTS 실측(`rawAudioDurationSec`) 기준, CURRENT_STANDARDS.md 원칙(8초 미만→8초, 8초 이상→실측+1초 미만) 그대로 적용.

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 길이 티어 |
|---|---|---|---|
| s1 opening | `owl_ep12_s1_opening.png` | `owl_ep12_s1_opening_motion.mp4` | **9초** (실측 8.42초) |
| s2 background | `owl_ep12_s2_background.png` | `owl_ep12_s2_background_motion.mp4` | **9초** (실측 8.04초) |
| s3 problem | `owl_ep12_s3_problem.png` | `owl_ep12_s3_problem_motion.mp4` | 8초 |
| s4 existing_relief | `owl_ep12_s4_existing_relief.png` | `owl_ep12_s4_existing_relief_motion.mp4` | 8초 |
| s5 extension | `owl_ep12_s5_extension.png` | `owl_ep12_s5_extension_motion.mp4` | 8초 |
| s6 renewal_included | `owl_ep12_s6_renewal_included.png` | `owl_ep12_s6_renewal_included_motion.mp4` | 8초 |
| s7 impact | `owl_ep12_s7_impact.png` | `owl_ep12_s7_impact_motion.mp4` | 8초 |
| s8 condition | `owl_ep12_s8_condition.png` | `owl_ep12_s8_condition_motion.mp4` | 8초 |
| s9 balance | `owl_ep12_s9_balance.png` | `owl_ep12_s9_balance_motion.mp4` | 8초 |
| s10 action | `owl_ep12_s10_action.png` | `owl_ep12_s10_action_motion.mp4` | 8초 |

★ 영상 생성 절대규칙(87씬 전수조사 확정, `_ai/CURRENT_STANDARDS.md` §0) 전부 반영:
- 소품을 든 손은 **한 지점 고정**("holds steadily at", 이동·반복 왕복 지시 금지)
- **동작은 소품을 안 든 빈 쪽에만** 배정
- 소품·보드는 전부 "frozen photograph layered behind/beside the character"로 명시
- 텍스트는 CRITICAL TEXT PRESERVATION(HIGHEST PRIORITY) 블록으로 고정

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작 프레임에서 텍스트, 끝 프레임에서 소품·표정 확인.

================================================================================
# 🟦 8초 티어 (8개 씬: s3·s4·s5·s6·s7·s8·s9·s10)
================================================================================

---

## s3 — problem (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design (vest, tie, sunglasses pushed up on forehead,
feather texture) and the bright real-estate agency office background exactly
as shown in the reference image — same "부동산" wall sign, same "매물"
property-type board (아파트/빌라/주택/상가), same "상담" desk plate. Do not
change any colors, text, or object positions.

MOTION DETAIL: the character holds the "전월세 물량 감소" (declining
rental-supply) card steadily in one wing at chest height — the card does not
travel or shift position, treat it as a fixed object the character is simply
holding still. The character's other wing rests calmly by its side or
gestures gently near the card without touching it. Only the character's
head, eyes, and mouth move, showing a concerned, slightly worried
expression — not smiling. Every prop and the background are treated as a
frozen photograph layered behind/beside the character.

STATIC ELEMENTS: the background signage ("부동산", "매물" board with its
four property photos, "상담" desk plate), plants, chairs, and the card
(including its "전월세 물량 감소" text and the red downward arrow) must stay
completely fixed — no camera pan or zoom, no background object movement, no
card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("전월세 물량 감소"), the large
"부동산" wall sign, the "매물" board with its four category labels (아파트/
빌라/주택/상가), and the "상담" desk plate. Render these exactly as pixels
copied from the reference image, unchanged frame to frame — do not let the
video model regenerate, redraw, reinterpret, or reflow any of this text,
even slightly, even for one frame. If motion would risk distorting any text,
keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement or shaking.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if seriously
explaining a problem — never static, never barely-moving, never
closed-mouth talking.
```

---

## s4 — existing_relief (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright real-estate agency office
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character points at the standing board beside it with
one wing in a steady, fixed gesture — the pointing wing does not sweep or
travel, it stays aimed at the same single spot on the board for the whole
clip. The other wing rests calmly by its side. The character's head, eyes,
and mouth move, showing a calm, explanatory expression — not smiling. The
standing board and its diagram are treated as a frozen photograph layered
behind/beside the character.

STATIC ELEMENTS: the background signage ("부동산", "매물" board), plants,
chairs, and the standing board (including its "실거주 유예 제도" text and
clock icon) must stay completely fixed — no camera pan or zoom, no
background object movement, no pointing wing sweeping or traveling.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the board text ("실거주 유예 제도"), the clock
icon, the large "부동산" wall sign, and the "매물" board. Render these
exactly as pixels copied from the reference image, unchanged frame to frame
— do not let the video model regenerate, redraw, reinterpret, or reflow any
of this text or the icon, even slightly, even for one frame. If motion
would risk distorting any text, keep that element completely static
instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage or diagram, no background changes, no character
redesign, no abrupt cut or freeze mid-motion, no static mouth, no minimal
lip movement, no closed-mouth talking, no frozen expression while speaking,
no pointing wing sweeping or traveling.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if calmly
explaining an existing system — never static, never barely-moving, never
closed-mouth talking.
```

---

## s5 — extension (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright real-estate agency office
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds the "신청기한 1년 연장" card steadily in
one wing at chest height — the card does not travel or shift position,
treat it as a fixed object the character is simply holding still. The other
wing gestures gently pointing toward the card without touching it, in a
fixed confident pose (not sweeping). The character's head, eyes, and mouth
move, showing a confident, assured expression — not smiling excessively,
just assured.

STATIC ELEMENTS: the background signage, plants, chairs, and the card
(including its "신청기한 1년 연장" text) must stay completely fixed — no
camera pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("신청기한 1년 연장"), the large
"부동산" wall sign, and the "매물" board. Render these exactly as pixels
copied from the reference image, unchanged frame to frame — do not let the
video model regenerate, redraw, reinterpret, or reflow any of this text,
even slightly, even for one frame. If motion would risk distorting any text,
keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement, no gesturing wing sweeping or traveling.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if confidently
stating a fact — never static, never barely-moving, never closed-mouth
talking.
```

---

## s6 — renewal_included (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright real-estate agency office
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds the "갱신 계약도 인정" card steadily in
one wing at chest height — the card does not travel or shift position,
treat it as a fixed object the character is simply holding still. The other
wing stays in a relaxed fixed pose (e.g. thumbs-up or resting near chest),
not sweeping. The character's head, eyes, and mouth move, showing a bright,
explanatory expression — gentle smile allowed here (informative, upbeat
tone).

STATIC ELEMENTS: the background signage, plants, chairs, and the card
(including its "갱신 계약도 인정" text) must stay completely fixed — no
camera pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("갱신 계약도 인정"), the large
"부동산" wall sign, and the "매물" board. Render these exactly as pixels
copied from the reference image, unchanged frame to frame — do not let the
video model regenerate, redraw, reinterpret, or reflow any of this text,
even slightly, even for one frame. If motion would risk distorting any text,
keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if brightly
adding useful extra information — never static, never barely-moving, never
closed-mouth talking.
```

---

## s7 — impact (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright real-estate agency office
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character's wing rests on top of the standing board in a
fixed steady grip — the wing does not travel or sweep, it stays gripping
the same spot on the board frame for the whole clip. The other wing gestures
gently toward the board in a fixed pose (not sweeping). The character's
head, eyes, and mouth move, showing a firm, confident expression — not
smiling, emphasizing the key result.

STATIC ELEMENTS: the background signage, plants, chairs, and the standing
board (including its "최장 2029년 말까지" text) must stay completely fixed
— no camera pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the board text ("최장 2029년 말까지"), the large
"부동산" wall sign, and the "매물" board. Render these exactly as pixels
copied from the reference image, unchanged frame to frame — do not let the
video model regenerate, redraw, reinterpret, or reflow any of this text or
numbers, even slightly, even for one frame. If motion would risk distorting
any text, keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text or numbers anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no board grip
sliding, no gesturing wing sweeping.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if firmly
delivering the key takeaway — never static, never barely-moving, never
closed-mouth talking.
```

---

## s8 — condition (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright real-estate agency office
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds the "무주택 유지 · 입주 후 2년 거주"
card steadily with both wings at chest height — the card does not travel or
shift position, treat it as a fixed object the character is simply holding
still with both wings gripping it. Only the character's head, eyes, and
mouth move, showing a serious, cautionary expression — not smiling,
emphasizing an important condition.

STATIC ELEMENTS: the background signage, plants, chairs, and the card
(including its "무주택 유지", "입주 후 2년 거주" text) must stay completely
fixed — no camera pan or zoom, no background object movement, no card
movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("무주택 유지", "입주 후 2년
거주"), the large "부동산" wall sign, and the "매물" board. Render these
exactly as pixels copied from the reference image, unchanged frame to frame
— do not let the video model regenerate, redraw, reinterpret, or reflow any
of this text, even slightly, even for one frame. If motion would risk
distorting any text, keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if seriously
stating an important condition — never static, never barely-moving, never
closed-mouth talking.
```

---

## s9 — balance (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright real-estate agency office
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds the card with the large question mark
steadily in one wing at chest height — the card does not travel or shift
position, treat it as a fixed object the character is simply holding still.
The other wing rests calmly by its side. The character's head tilts
slightly, eyes narrow thoughtfully, showing a cautious, skeptical
expression — not smiling, a "this deserves scrutiny" look.

STATIC ELEMENTS: the background signage, plants, chairs, and the card
(including its large question mark) must stay completely fixed — no camera
pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the large "부동산" wall sign and the "매물" board.
Render these exactly as pixels copied from the reference image, unchanged
frame to frame — do not let the video model regenerate, redraw,
reinterpret, or reflow any of this text, even slightly, even for one frame.
If motion would risk distorting any text, keep that element completely
static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if raising a
thoughtful concern — never static, never barely-moving, never closed-mouth
talking.
```

---

## s10 — action (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright real-estate agency office
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds the smartphone steadily in one wing at
chest height, showing its screen toward the camera — the phone does not
tilt, rise, lower, or move at all, the wing keeps it locked in the same
position and angle for the entire clip. The other wing gestures gently
toward the phone in a fixed pose (not sweeping). The character's head,
eyes, and mouth move, showing a warm, friendly closing expression — gentle
smile allowed (wrap-up tone, softer than other scenes).

STATIC ELEMENTS: the background signage, plants, chairs, and the phone
screen text must stay completely fixed — no camera pan or zoom, no
background object movement, no phone movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the phone screen text ("관할 구청에 확인"), the
large "부동산" wall sign, and the "매물" board. Render these exactly as
pixels copied from the reference image, unchanged frame to frame — do not
let the video model regenerate, redraw, reinterpret, or reflow any of this
text, even slightly, even for one frame. If motion would risk distorting
any text, keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no phone
movement, no phone floating or blurring.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
wrapping up with a helpful reminder — never static, never barely-moving,
never closed-mouth talking.
```

================================================================================
# 🟩 9초 티어 (2개 씬: s1·s2)
================================================================================

---

## s1 — opening (9초, 실측 8.42초)

```
Animate this image into a 9-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design (vest, tie, sunglasses pushed up on forehead,
feather texture) and the bright real-estate agency office background
exactly as shown in the reference image — same "부동산" wall sign, same
"매물" property-type board (아파트/빌라/주택/상가), same "상담" desk plate.
Do not change any colors, text, or object positions.

MOTION DETAIL: the character raises one wing in a warm greeting gesture
that continues in a gentle rhythmic motion throughout the full 9 seconds
(not a single wave then frozen — keep the wing moving softly, on and off),
while its whole body sways slightly side to side with confident energy, as
if warmly introducing today's topic. The other wing stays in a relaxed
position at its side. Eyes stay bright and focused, expression stays
confident and assured throughout — not smiling excessively, just
trustworthy and engaged.

STATIC ELEMENTS: the background signage ("부동산", "매물" board with its
four property photos, "상담" desk plate), plants, chairs, and furniture
must remain completely still — no camera pan or zoom, no background object
movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the
full 9 seconds — this includes the large "부동산" wall sign, the "매물"
board with its four category labels (아파트/빌라/주택/상가), and the "상담"
desk plate. Render these exactly as pixels copied from the reference
image, unchanged frame to frame — do not let the video model regenerate,
redraw, reinterpret, or reflow any of this text, even slightly, even for
one frame. If motion would risk distorting any text, keep that element
completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the full 9 seconds, as if
energetically introducing today's episode — never static, never
barely-moving, never closed-mouth talking, even while confident.
```

---

## s2 — background (9초, 실측 8.04초)

```
Animate this image into a 9-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright real-estate agency office
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds the "토지거래허가구역" booklet steadily
in one wing at chest height — the booklet does not travel or shift
position, treat it as a fixed object the character is simply holding
still. The other wing gestures gently toward the standing board with
"4개월 내 입주 · 2년 거주" text in a fixed pose (not sweeping, aimed at the
same single spot for the whole clip). The character's head, eyes, and mouth
move, showing a clear, informative expression — not smiling, delivering
background facts.

STATIC ELEMENTS: the background signage, plants, chairs, the booklet
(including its "토지거래허가구역" text), and the standing board (including
its "4개월 내 입주 · 2년 거주" text) must stay completely fixed — no camera
pan or zoom, no background object movement, no booklet movement, no
gesturing wing sweeping or traveling.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the
full 9 seconds — this includes the booklet text ("토지거래허가구역"), the
board text ("4개월 내 입주", "2년 거주"), the large "부동산" wall sign, and
the "매물" board. Render these exactly as pixels copied from the reference
image, unchanged frame to frame — do not let the video model regenerate,
redraw, reinterpret, or reflow any of this text, even slightly, even for
one frame. If motion would risk distorting any text, keep that element
completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no booklet
movement, no gesturing wing sweeping or traveling.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the full 9 seconds, as if clearly
explaining background regulations — never static, never barely-moving,
never closed-mouth talking.
```
