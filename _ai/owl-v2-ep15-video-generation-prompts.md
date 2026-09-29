# 부엉박사 15편(v2 재제작 — 실업급여 22년 만의 개편) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/owl-v2-ep15-images/`
영상 전달: `C:/Users/PC/Downloads/`에 **장면 번호로** `1.mp4`, `2.mp4`, `4.mp4`, `7.mp4`, `9.mp4`, `11.mp4`, `12.mp4`, `14.mp4`, `15.mp4` 저장("부엉박사 15편"이라고 알려주기).
나머지 6장면(s3, s5, s6, s8, s10, s13)은 v1(파일 ep15) 영상 재사용(복사 완료, `C:/tmp/owl-v2-ep15-videos/`).

**씬 길이 티어는 8초/10초 2단계로만 요청한다(9초 티어 금지).** 발화 8초 미만+여유 1초 이상 → 8초, 그 외(8초 이상이거나 여유 1초 미만) → 10초.

| 씬 | 이미지 파일 | 카드/보드 문구 | 실측 발화(raw) | 요청 티어 | 예상 여유 |
|---|---|---|---|---|---|
| s1 hook_q | `owl_v2_ep15_s1_hook_q.png` | 실업급여 / 바뀐다? | 5.07초 | **8초** | 2.93초 |
| s2 hook_stakes | `owl_v2_ep15_s2_hook_stakes.png` | 줄어든다? / 늘어난다? | 5.77초 | **8초** | 2.23초 |
| s4 definition | `owl_v2_ep15_s4_definition.png` | 구직급여 = / 재취업 생활비 | 6.23초 | **8초** | 1.77초 |
| s7 core_q_answer | `owl_v2_ep15_s7_core_q_answer.png` | 내 실업급여는 / 얼마나 줄까? | 6.49초 | **8초** | 1.51초 |
| s9 point1_ratio | `owl_v2_ep15_s9_point1_ratio.png` | 수급자 10명 중 / 6명 | 4.28초 | **8초** | 3.72초 |
| s11 point3_why | `owl_v2_ep15_s11_point3_why.png` | 일할 때 193만원 / 쉴 때 198만원(바닥 보드) | 7.04초 | **10초** | 2.96초 |
| s12 point4_fee | `owl_v2_ep15_s12_point4_fee.png` | 보험료율 / 1.8%→2.0% | 8.88초 | **10초** | 1.12초 |
| s14 summary_check | `owl_v2_ep15_s14_summary_check.png` | 체크① 하한액 여부 / 체크② 국회 진행상황(바닥 보드) | 9.60초 | **10초** | 0.40초 |
| s15 bridge | `owl_v2_ep15_s15_bridge.png` | 실업급여 / 계산? | 6.81초 | **8초** | 1.19초 |

★ s14는 발화가 9.6초로 9.5초 규칙을 0.1초 초과하지만(경계선), 10초 여유 클립에는 0.4초 여유가 있어 그대로 진행한다.
★ 카드를 든 날개는 한 지점 고정, 동작은 빈 날개에만(글자를 가리지 않음), 바닥 보드는 넘어지거나 미끄러지지 않음, "Silent" 금지.

================================================================================
# 🟦 8초 티어 (s1, s2, s4, s7, s9, s15)
================================================================================

## s1 — hook_q (8초, 카드 감싸 쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright government employment policy
briefing room background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the card reading "실업급여" on the first line
and "바뀐다?" on the second line is held firmly by the character's right
wing (screen-left side) and holds steadily at exactly its current position
and angle for the ENTIRE 8 seconds — the card never moves, tilts, slides,
slips, or drops at any point, especially not in the final 2-3 seconds.
Treat the card as a frozen photograph layered in front of the character's
wing, glued in place.

MOTION DETAIL: only the character's other wing (screen-right side, holding
nothing) moves — it lifts slightly outward in a questioning "did you know?"
gesture and settles back, never passing in front of the card. The wing
holding the card does not move at all. Sharp, curious expression with
raised eyebrows; no broad smile.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
moving or dropping the card.

STATIC ELEMENTS: the card, the large screen behind with faint employment
policy icon silhouettes, the wooden podium, the navy chairs, and the
plants must stay completely fixed — no camera pan or zoom, no background
object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("실업급여", "바뀐다?") as a locked, non-regenerating image layer for the
full 8 seconds. Render this exactly as pixels copied from the reference
image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no card dropping, falling,
slipping, tilting, or motion blur at any point, no wing passing in front
of the card, no full-body freeze at any point, no holding completely
still for more than half a second anywhere in the clip, NO CAMERA ZOOM OR
FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD MOVEMENT OR
DROP AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes
continuously in natural speech rhythm for the entire clip, as if asking
the viewer a pointed question — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## s2 — hook_stakes (8초, 카드 감싸 쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright government employment policy
briefing room background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the card reading "줄어든다?" on the first
line and "늘어난다?" on the second line, with two question mark icons, is
held firmly by the character's right wing (screen-left side) and holds
steadily at exactly its current position and angle for the ENTIRE 8
seconds — the card never moves, tilts, slides, slips, or drops at any
point, especially not in the final 2-3 seconds. Treat the card as a
frozen photograph layered in front of the character's wing, glued in
place.

MOTION DETAIL: only the character's other wing (screen-right side,
holding nothing) moves — it tilts up near the head in a puzzled gesture
and settles back, never passing in front of the card. The wing holding
the card does not move at all. Puzzled, curious expression with the head
tilted slightly; no broad smile.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
moving or dropping the card.

STATIC ELEMENTS: the card, the large screen behind with faint employment
policy icon silhouettes, the wooden podium, the navy chairs, and the
plants must stay completely fixed — no camera pan or zoom, no background
object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("줄어든다?", "늘어난다?", the two question mark icons) as a locked,
non-regenerating image layer for the full 8 seconds. Render this exactly
as pixels copied from the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no card dropping, falling,
slipping, tilting, or motion blur at any point, no wing passing in front
of the card, no full-body freeze at any point, no holding completely
still for more than half a second anywhere in the clip, NO CAMERA ZOOM OR
FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD MOVEMENT OR
DROP AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes
continuously in natural speech rhythm for the entire clip, as if puzzling
over a confusing question — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## s4 — definition (8초, 카드 감싸 쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright government employment policy
briefing room background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the card reading "구직급여 =" on the first
line and "재취업 생활비" on the second line is held firmly by the
character's right wing (screen-left side) and holds steadily at exactly
its current position and angle for the ENTIRE 8 seconds — the card never
moves, tilts, slides, slips, or drops at any point, especially not in the
final 2-3 seconds. Treat the card as a frozen photograph layered in front
of the character's wing, glued in place.

MOTION DETAIL: only the character's other wing (screen-right side,
holding nothing) moves — it opens slightly outward in a calm explaining
gesture and settles back, never passing in front of the card. The wing
holding the card does not move at all. Calm, informative expression; no
broad smile.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
moving or dropping the card.

STATIC ELEMENTS: the card, the large screen behind with faint employment
policy icon silhouettes, the wooden podium, the navy chairs, and the
plants must stay completely fixed — no camera pan or zoom, no background
object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("구직급여 =", "재취업 생활비") as a locked, non-regenerating image layer
for the full 8 seconds. Render this exactly as pixels copied from the
reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no card dropping, falling,
slipping, tilting, or motion blur at any point, no wing passing in front
of the card, no full-body freeze at any point, no holding completely
still for more than half a second anywhere in the clip, NO CAMERA ZOOM OR
FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD MOVEMENT OR
DROP AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes
continuously in natural speech rhythm for the entire clip, as if calmly
explaining a definition — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## s7 — core_q_answer (8초, 카드 감싸 쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright government employment policy
briefing room background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the card reading "내 실업급여는" on the first
line and "얼마나 줄까?" on the second line is held firmly by the
character's right wing (screen-left side) and holds steadily at exactly
its current position and angle for the ENTIRE 8 seconds — the card never
moves, tilts, slides, slips, or drops at any point, especially not in the
final 2-3 seconds. Treat the card as a frozen photograph layered in front
of the character's wing, glued in place.

MOTION DETAIL: only the character's other wing (screen-right side,
resting near its chin in a thinking pose) moves — it taps the chin once
and then opens slightly outward as if giving the answer, never passing in
front of the card. The wing holding the card does not move at all.
Thoughtful, sharp expression; no broad smile.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
moving or dropping the card.

STATIC ELEMENTS: the card, the large screen behind with faint employment
policy icon silhouettes, the wooden podium, the navy chairs, and the
plants must stay completely fixed — no camera pan or zoom, no background
object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("내 실업급여는", "얼마나 줄까?") as a locked, non-regenerating image
layer for the full 8 seconds. Render this exactly as pixels copied from
the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no card dropping, falling,
slipping, tilting, or motion blur at any point, no wing passing in front
of the card, no full-body freeze at any point, no holding completely
still for more than half a second anywhere in the clip, NO CAMERA ZOOM OR
FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD MOVEMENT OR
DROP AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes
continuously in natural speech rhythm for the entire clip, as if asking a
question and then answering it clearly — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## s9 — point1_ratio (8초, 카드 감싸 쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright government employment policy
briefing room background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the card reading "수급자 10명 중" on the
first line and "6명" on the second line, with a small people icon, is
held firmly by the character's right wing (screen-left side) and holds
steadily at exactly its current position and angle for the ENTIRE 8
seconds — the card never moves, tilts, slides, slips, or drops at any
point, especially not in the final 2-3 seconds. Treat the card as a
frozen photograph layered in front of the character's wing, glued in
place.

MOTION DETAIL: only the character's other wing (screen-right side,
holding nothing) moves — it opens slightly outward in an explaining
gesture and settles back, never passing in front of the card. The wing
holding the card does not move at all. Calm, informative expression; no
broad smile.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
moving or dropping the card.

STATIC ELEMENTS: the card, the large screen behind with faint employment
policy icon silhouettes, the wooden podium, the navy chairs, and the
plants must stay completely fixed — no camera pan or zoom, no background
object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("수급자 10명 중", "6명", the people icon) as a locked, non-regenerating
image layer for the full 8 seconds. Render this exactly as pixels copied
from the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no card dropping, falling,
slipping, tilting, or motion blur at any point, no wing passing in front
of the card, no full-body freeze at any point, no holding completely
still for more than half a second anywhere in the clip, NO CAMERA ZOOM OR
FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD MOVEMENT OR
DROP AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes
continuously in natural speech rhythm for the entire clip, as if calmly
stating a statistic — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## s15 — bridge (8초, 카드 감싸 쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright government employment policy
briefing room background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the card reading "실업급여" on the first
line and "계산?" on the second line is held firmly by the character's
right wing (screen-left side) and holds steadily at exactly its current
position and angle for the ENTIRE 8 seconds — the card never moves,
tilts, slides, slips, or drops at any point, especially not in the final
2-3 seconds. Treat the card as a frozen photograph layered in front of
the character's wing, glued in place.

MOTION DETAIL: only the character's other wing (screen-right side,
raised and holding nothing) makes one small friendly wave and settles,
never passing in front of the card text. The wing holding the card does
not move at all. Bright, friendly closing expression with a gentle smile.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
moving or dropping the card.

STATIC ELEMENTS: the card, the large screen behind with faint employment
policy icon silhouettes, the wooden podium, the navy chairs, and the
plants must stay completely fixed — no camera pan or zoom, no background
object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("실업급여", "계산?") as a locked, non-regenerating image layer for the
full 8 seconds. Render this exactly as pixels copied from the reference
image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no card dropping, falling,
slipping, tilting, or motion blur at any point, no wing passing in front
of the card, no full-body freeze at any point, no holding completely
still for more than half a second anywhere in the clip, NO CAMERA ZOOM OR
FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD MOVEMENT OR
DROP AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
wrapping up and handing over to a friend — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

================================================================================
# 🟨 10초 티어 (s11, s12, s14)
================================================================================

## s11 — point3_why (10초, 바닥 보드 '일할 때 193만원 / 쉴 때 198만원')

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright government employment policy
briefing room background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): a floor-standing easel board on the right
with a navy label "일할 때" above "193만원" and a red-highlighted label
"쉴 때" above "198만원" remains completely rigid, standing upright on the
floor for the entire clip — the easel does not tip over, rotate, slide,
or fall at any point, including the final 1-2 seconds. Treat the board as
a frozen photograph layered beside the character, fixed to the floor.

MOTION DETAIL: the character stands on the left holding nothing. Its
pointing wing (screen-right side) points toward the board, staying beside
the board edge, never passing in front of the board text. The other wing
rests at its side with a slight natural sway. Serious, explaining
expression; no broad smile.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
tipping, sliding, or regenerating the board.

STATIC ELEMENTS: the easel board (including all its text and floor
position), the large screen behind with faint employment policy icon
silhouettes, the wooden podium, the navy chairs, and the plants must stay
completely fixed — no camera pan or zoom, no background object movement,
no easel movement or tipping.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text
("일할 때", "193만원", "쉴 때", "198만원") as locked, non-regenerating
image layers for the full 10 seconds. Render these exactly as pixels
copied from the reference image, unchanged frame to frame — the digits
193 and 198 must never change. No wing or feather may cover the board
text at any time.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no changed digits, no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal beak movement, no
closed-mouth talking, no frozen expression while speaking, no wing
passing in front of the board, no easel tipping over, sliding, or
falling at any point, no full-body freeze at any point, no holding
completely still for more than half a second anywhere in the clip, NO
CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
EASEL MOVEMENT AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly
explaining an ironic contradiction — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## s12 — point4_fee (10초, 카드 감싸 쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright government employment policy
briefing room background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the card reading "보험료율" on the first
line and "1.8%→2.0%" on the second line is held firmly by the character's
right wing (screen-left side) and holds steadily at exactly its current
position and angle for the ENTIRE 10 seconds — the card never moves,
tilts, slides, slips, or drops at any point, especially not in the final
2-3 seconds. Treat the card as a frozen photograph layered in front of
the character's wing, glued in place.

MOTION DETAIL: only the character's other wing (screen-right side,
holding nothing) moves — it opens slightly outward in a serious
explaining gesture and settles back, never passing in front of the card.
The wing holding the card does not move at all. Serious, informative
expression; no broad smile.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
moving or dropping the card.

STATIC ELEMENTS: the card, the large screen behind with faint employment
policy icon silhouettes, the wooden podium, the navy chairs, and the
plants must stay completely fixed — no camera pan or zoom, no background
object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("보험료율", "1.8%→2.0%") as a locked, non-regenerating image layer for
the full 10 seconds. Render this exactly as pixels copied from the
reference image, unchanged frame to frame — the numbers 1.8 and 2.0 must
never change.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no changed digits, no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal beak movement, no
closed-mouth talking, no frozen expression while speaking, no card
dropping, falling, slipping, tilting, or motion blur at any point, no
wing passing in front of the card, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the
clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST
SECOND, NO CARD MOVEMENT OR DROP AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
seriously stating an additional fact — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## s14 — summary_check (10초, 바닥 보드 '체크① 하한액 여부 / 체크② 국회 진행상황')

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright government employment policy
briefing room background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): a floor-standing easel board on the right
with a navy circled "1" label "체크①" above red "하한액 여부" and a navy
circled "2" label "체크②" above red "국회 진행상황" remains completely
rigid, standing upright on the floor for the entire clip — the easel does
not tip over, rotate, slide, or fall at any point, including the final
1-2 seconds. Treat the board as a frozen photograph layered beside the
character, fixed to the floor.

MOTION DETAIL: the character stands on the left holding nothing. Its
free wing (screen-right side) makes a steady "peace sign" / two-finger
gesture near the board, held at a fixed angle without waving, never
passing in front of the board text. The other wing rests at its side.
Confident, instructive expression; no broad smile.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
tipping, sliding, or regenerating the board.

STATIC ELEMENTS: the easel board (including all its text and floor
position), the large screen behind with faint employment policy icon
silhouettes, the wooden podium, the navy chairs, and the plants must stay
completely fixed — no camera pan or zoom, no background object movement,
no easel movement or tipping.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text
("체크①", "하한액 여부", "체크②", "국회 진행상황") as locked,
non-regenerating image layers for the full 10 seconds. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame. No wing or feather may cover the board text at any time.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no waving or repeated
finger motion, no wing passing in front of the board, no easel tipping
over, sliding, or falling at any point, no full-body freeze at any point,
no holding completely still for more than half a second anywhere in the
clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST
SECOND, NO EASEL MOVEMENT AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly
summarizing a two-item checklist — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. `C:/Users/PC/Downloads/1.mp4, 2.mp4, 4.mp4, 7.mp4, 9.mp4, 11.mp4, 12.mp4, 14.mp4, 15.mp4`로 저장(숫자 = 씬 번호, "부엉박사 15편"이라고 알려주기).
2. Claude: 검수 → 조립(`--spec-module ./_owl-v2-ep15-assembly-spec.mjs --spec-export OWL_ASSEMBLY_SPEC --clip-dir C:/tmp/owl-v2-ep15-videos --audio-summary C:/tmp/money-shorts-os/owl-v2-ep15-tts/output-v1/elevenlabs-scene-paced-tts-summary.json --tts-script C:/tmp/money-shorts-os/owl-v2-ep15-tts/owl-v2-ep15-tts-script.json`) → 자막 읽는표기 0건 확인 → dwellPass 확인(s14가 9.6초로 경계선이라 특히 확인) → CTA 결합(`--cta-clip C:/tmp/owl-cta-fixed-v2/owl_cta_fixed_v2_final_v6.mp4 --alignment .../output-v1/elevenlabs-korean-director-*.alignment.json`) → 완성본 검수 요청.
