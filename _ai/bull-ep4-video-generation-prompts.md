# 황소특보 4편(삼성전자보다 더 오른 반도체 부품주, MLCC 품절+증설) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/bull-ep4-images/`
영상 저장 폴더(신규 생성): `C:/tmp/bull-ep4-videos/`

**씬 길이 티어는 8초/10초 2단계로만 요청한다(9초 티어 금지, 2026-09-23 확정,
[[feedback_video_scene_length_tier_smooth_transition]]).** Gemini Veo는 항상
10초 고정, Flow도 요청값과 다르게 나올 수 있어 "9초 영상"이 실무적으로
존재하지 않는다. 발화 8초 미만 → 8초 요청, 8초 이상 → 10초 요청. 항상 발화
보다 여유 있게 받아서 조립 때 "자르기"만 하고 tpad "늘리기"는 피한다.

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 실측 발화(raw) | 요청 티어 | 예상 여유 |
|---|---|---|---|---|---|
| s1 hook_q | `bull_ep4_s1.png` | `bull_ep4_s1_motion.mp4` | 6.57초 | **8초** | 1.43초 |
| s2 hook_stakes | `bull_ep4_s2.png` | `bull_ep4_s2_motion.mp4` | 8.95초 | **10초** | 1.05초 |
| s3 opening | `bull_ep4_s3.png` | `bull_ep4_s3_motion.mp4` | 5.62초 | **8초** | 2.38초 |
| s4 situation1 | `bull_ep4_s4.png` | `bull_ep4_s4_motion.mp4` | 9.28초 | **10초** | 0.72초 |
| s5 situation2 | `bull_ep4_s5.png` | `bull_ep4_s5_motion.mp4` | 8.73초 | **10초** | 1.27초 |
| s6 core_q_answer(twist) | `bull_ep4_s6.png` | `bull_ep4_s6_motion.mp4` | 8.57초 | **10초** | 1.43초 |
| s7 reason1_term | `bull_ep4_s7.png` | `bull_ep4_s7_motion.mp4` | 8.11초 | **10초** | 1.89초 |
| s8 reason1_numbers | `bull_ep4_s8.png` | `bull_ep4_s8_motion.mp4` | 8.44초 | **10초** | 1.56초 |
| s9 reason1_cause | `bull_ep4_s9.png` | `bull_ep4_s9_motion.mp4` | 7.64초 | **8초** | 0.36초 |
| s10 reason2 | `bull_ep4_s10.png` | `bull_ep4_s10_motion.mp4` | 8.90초 | **10초** | 1.10초 |
| s11 reason2_meaning | `bull_ep4_s11.png` | `bull_ep4_s11_motion.mp4` | 8.70초 | **10초** | 1.30초 |
| s12 balance | `bull_ep4_s12.png` | `bull_ep4_s12_motion.mp4` | 9.63초 | **10초** | 0.37초 |
| s13 summary_checklist | `bull_ep4_s13.png` | `bull_ep4_s13_motion.mp4` | 8.97초 | **10초** | 1.03초 |
| s14 remind_next_comment(closing) | `bull_ep4_s14.png` | `bull_ep4_s14_motion.mp4` | 9.25초 | **10초** | 0.75초 |

★ 영상 생성 절대규칙(87씬 전수조사 확정, `_ai/CURRENT_STANDARDS.md` §0) 전부 반영:
- 소품을 든 손은 **한 지점 고정**("holds steadily at", 이동·반복 왕복 지시 금지)
- **동작은 소품을 안 든 빈 쪽에만** 배정
- 소품·보드는 전부 "frozen photograph layered in front of/beside the character"로 명시
- 텍스트는 CRITICAL TEXT PRESERVATION(HIGHEST PRIORITY) 블록으로 고정
- 나레이션이 있는 영상이므로 "Silent" 문구는 절대 넣지 않는다
- 바닥 거치 소품(s5 시상대, s9·s11 이젤 보드)은 "넘어지지 않는다"는 문구를 STATIC ELEMENTS와 NEGATIVE PROMPT에 추가로 명시

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작 프레임뿐 아니라 클립 중반·후반 프레임에서도
텍스트·소품·동작 지속 여부, 카메라 줌/크롭, 소품 기울어짐을 확인한다.

================================================================================
# 🟦 8초 티어 (s1, s3, s9)
================================================================================

---

## s1 — hook_q (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image — same monitors with
candlestick chart silhouettes, same city skyline through windows, same soft
golden lighting. Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a small card with a large
"?" question mark, completely rigid in one hand at chest height for the
entire clip — the card does not tilt, rotate, rise, lower, or drift at any
point, including the final 1-2 seconds. The other hand rests on its hip.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is curious and intrigued, wide
eyes, mouth slightly open, as if posing an intriguing question to the
viewer.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
plants, and lounge furniture must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card's question
mark and the monitor chart silhouettes as locked, non-regenerating image
layers for the full 8 seconds. Render these exactly as pixels copied from
the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, or flickering surfaces anywhere in
the frame, no regenerated or reinterpreted signage, no background changes,
no character redesign, no abrupt cut or freeze mid-motion, no static mouth,
no minimal lip movement, no closed-mouth talking, no frozen expression
while speaking, no card movement, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if curiously
posing a question to the viewer — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep4-videos/bull_ep4_s1_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카메라 줌/크롭 여부 포함
3. 문제 없으면 다음 씬 진행

---

## s3 — opening (8초, 소품 없음)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

MOTION DETAIL: the character points energetically upward with one hand
raised, the other hand resting on its hip, wide eyes and a big, bright,
warm smile throughout — introducing itself cheerfully.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
plants, and lounge furniture must stay completely fixed — no camera pan or
zoom, no background object movement. No props in this scene.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the monitor chart
silhouettes as locked, non-regenerating image layers for the full 8
seconds. Render these exactly as pixels copied from the reference image,
unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, or flickering surfaces anywhere in
the frame, no regenerated or reinterpreted signage, no background changes,
no character redesign, no abrupt cut or freeze mid-motion, no static mouth,
no minimal lip movement, no closed-mouth talking, no frozen expression
while speaking, no full-body freeze at any point, no holding completely
still for more than half a second anywhere in the clip, NO CAMERA ZOOM OR
FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if brightly
introducing itself — never static, never barely-moving, never closed-mouth
talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep4-videos/bull_ep4_s3_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s9 — reason1_cause (8초, 이젤 바닥 거치)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): a floor-standing easel signboard reading
"AI 서버" with a red rightward arrow followed by "공급 부족" remains
completely rigid, standing upright on the floor beside the character for
the entire clip — the easel does not tip over, rotate, slide, or fall at
any point, including the final 1-2 seconds. Treat the signboard as a
frozen photograph layered beside the character, fixed to the floor.

MOTION DETAIL: the character's empty hand (holding no prop) points toward
the signboard with an explanatory, informative expression; the other hand
rests on its hip. Only the pointing arm moves — the easel itself never
shifts position.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
tipping, sliding, or regenerating the easel.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, the easel
signboard (including its full text and arrow, and its floor position),
plants must stay completely fixed — no camera pan or zoom, no background
object movement, no easel movement or tipping.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the signboard text
("AI 서버", "공급 부족") and the monitor chart silhouettes as locked,
non-regenerating image layers for the full 8 seconds. Render these exactly
as pixels copied from the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no easel tipping over,
sliding, or falling at any point, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
EASEL MOVEMENT AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly
explaining the underlying cause — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep4-videos/bull_ep4_s9_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 이젤이 넘어지거나 미끄러지지 않는지 특히 확인
3. 문제 없으면 다음 씬 진행

================================================================================
# 🟨 10초 티어 (s2, s4, s5, s6, s7, s8, s10, s11, s12, s13, s14)
================================================================================

---

## s2 — hook_stakes (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds two cards side by side,
one in each hand — the left card reading "삼성전자" with "+9.39%" in red,
the right card reading "기판주" with "+24%" in red — completely rigid at
chest height for the entire clip. Neither card tilts, rotates, rises,
lowers, or drifts at any point, including the final 1-2 seconds. Treat
both cards as frozen photographs layered in front of the character.

MOTION DETAIL: the character's expression is wide-eyed and surprised,
leaning slightly forward as if contrasting the two numbers.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, both cards
(including their full text), plants must stay completely fixed — no
camera pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("삼성전자", "+9.39%", "기판주", "+24%") and the monitor chart silhouettes
as locked, non-regenerating image layers for the full 10 seconds. Render
these exactly as pixels copied from the reference image, unchanged frame
to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement on either
hand, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING
DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT
ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
excitedly contrasting two surprising numbers — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep4-videos/bull_ep4_s2_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s4 — situation1 (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a single large card
reading "코스피" with "+2.71%" in red and a red upward arrow icon,
completely rigid in both hands at chest height for the entire clip — the
card does not tilt, rotate, rise, lower, or drift at any point, including
the final 1-2 seconds. Treat the card as a frozen photograph layered in
front of the character.

MOTION DETAIL: the character's expression is bright and pleased, sharing
good market news.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, the card
(including its full text and arrow), plants must stay completely fixed —
no camera pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("코스피", "+2.71%") and the monitor chart silhouettes as locked,
non-regenerating image layers for the full 10 seconds. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame.

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
reporting the market index — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep4-videos/bull_ep4_s4_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s5 — situation2 (10초, 시상대 바닥 거치)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): a floor-standing three-tier podium prop
remains completely rigid, resting on the floor beside the character for
the entire clip — the podium does not tip over, rotate, slide, or fall at
any point, including the final 1-2 seconds. The podium blocks read "1위"
with "24%" on the tallest center block, "2위" with "15.7%" on the left
block, and "3위" with "14.66%" on the right block. Treat the podium as a
frozen photograph layered beside the character, fixed to the floor.

MOTION DETAIL: the character's empty hand (holding no prop) points toward
the 1st place block with a proud, delighted expression; the other hand
rests on its hip. Only the pointing arm moves — the podium itself never
shifts position.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
tipping, sliding, or regenerating the podium.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, the podium
(including all three blocks' full text and its floor position), plants
must stay completely fixed — no camera pan or zoom, no background object
movement, no podium movement or tipping.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the podium text
("1위", "24%", "2위", "15.7%", "3위", "14.66%") and the monitor chart
silhouettes as locked, non-regenerating image layers for the full 10
seconds. Render these exactly as pixels copied from the reference image,
unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no podium tipping over,
sliding, or falling at any point, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
PODIUM MOVEMENT AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if proudly
revealing the real ranking — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep4-videos/bull_ep4_s5_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 시상대가 넘어지거나 미끄러지지 않는지 특히 확인
3. 문제 없으면 다음 씬 진행

---

## s6 — core_q_answer / 반전(twist) (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a single large card
reading "칩" followed by a red rightward arrow and "부품", completely
rigid in one hand at chest height for the entire clip — the card does not
tilt, rotate, rise, lower, or drift at any point, including the final 1-2
seconds. The other hand (empty, holding no prop) points toward the arrow
on the card at a fixed angle without waving. Treat the card as a frozen
photograph layered in front of the character.

MOTION DETAIL: the character's expression is insightful and confident, as
if revealing the real answer to a puzzling question.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, the card
(including its full text and arrow), plants must stay completely fixed —
no camera pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("칩",
"부품") and the monitor chart silhouettes as locked, non-regenerating
image layers for the full 10 seconds. Render these exactly as pixels
copied from the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no waving
or repeated finger motion, no full-body freeze at any point, no holding
completely still for more than half a second anywhere in the clip, NO
CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
confidently revealing the answer — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep4-videos/bull_ep4_s6_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s7 — reason1_term (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a single large card
reading "MLCC" above "품절" in red, completely rigid in both hands at
chest height for the entire clip — the card does not tilt, rotate, rise,
lower, or drift at any point, including the final 1-2 seconds. Treat the
card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is serious and informative, as
if explaining an important technical term to the viewer.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, the card
(including its full text), plants must stay completely fixed — no camera
pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("MLCC", "품절") and the monitor chart silhouettes as locked,
non-regenerating image layers for the full 10 seconds. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame.

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
continuously in natural speech rhythm for the entire clip, as if
seriously explaining a technical term — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep4-videos/bull_ep4_s7_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s8 — reason1_numbers (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a single large card
reading "유통가 최대" above "+280%" in red with a small rising arrow icon,
completely rigid in both hands at chest height, thrust slightly forward,
for the entire clip — the card does not tilt, rotate, rise, lower, or
drift at any point, including the final 1-2 seconds. Treat the card as a
frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is confident and assured, eyes
sharp, as if presenting decisive proof.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, the card
(including its full text and arrow icon), plants must stay completely
fixed — no camera pan or zoom, no background object movement, no card
movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("유통가 최대", "+280%") and the monitor chart silhouettes as locked,
non-regenerating image layers for the full 10 seconds. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame.

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
continuously in natural speech rhythm for the entire clip, as if
confidently presenting a striking number — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep4-videos/bull_ep4_s8_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s10 — reason2 (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a single large card
reading "반도체" above "증설 시작", completely rigid in one hand at chest
height for the entire clip — the card does not tilt, rotate, rise, lower,
or drift at any point, including the final 1-2 seconds. The other hand's
index finger is raised in a steady "number one" gesture, held at a fixed
angle without waving. Treat the card as a frozen photograph layered in
front of the character.

MOTION DETAIL: the character's expression is confident and instructive, as
if introducing the second reason.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, the card
(including its full text), plants must stay completely fixed — no camera
pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("반도체", "증설 시작") and the monitor chart silhouettes as locked,
non-regenerating image layers for the full 10 seconds. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no waving
or repeated finger motion, no full-body freeze at any point, no holding
completely still for more than half a second anywhere in the clip, NO
CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly
introducing a second point — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep4-videos/bull_ep4_s10_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s11 — reason2_meaning (10초, 이젤 바닥 거치)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): a floor-standing easel signboard reading
"상반기 대장주" above a red rightward arrow followed by "하반기 부품주"
remains completely rigid, standing upright on the floor beside the
character for the entire clip — the easel does not tip over, rotate,
slide, or fall at any point, including the final 1-2 seconds. Treat the
signboard as a frozen photograph layered beside the character, fixed to
the floor.

MOTION DETAIL: the character's empty hand (holding no prop) points toward
the right side of the arrow on the signboard; the other hand rests on its
hip. Only the pointing arm moves — the easel itself never shifts position.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
tipping, sliding, or regenerating the easel.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, the easel
signboard (including its full text and its floor position), plants must
stay completely fixed — no camera pan or zoom, no background object
movement, no easel movement or tipping.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the signboard text
("상반기 대장주", "하반기 부품주") and the monitor chart silhouettes as
locked, non-regenerating image layers for the full 10 seconds. Render
these exactly as pixels copied from the reference image, unchanged frame
to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no easel tipping over,
sliding, or falling at any point, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
EASEL MOVEMENT AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
thoughtfully explaining what this shift means — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep4-videos/bull_ep4_s11_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 이젤이 넘어지거나 미끄러지지 않는지 특히 확인
3. 문제 없으면 다음 씬 진행

---

## s12 — balance (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a single large card
reading "급등 뒤" above "되돌림 주의" in red, completely rigid in both
hands at chest height for the entire clip — the card does not tilt,
rotate, rise, lower, or drift at any point, including the final 1-2
seconds. Treat the card as a frozen photograph layered in front of the
character.

MOTION DETAIL: the character's expression is cautious and serious —
slightly furrowed brow, no smile — as if warning the viewer to be careful.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, the card
(including its full text), plants must stay completely fixed — no camera
pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("급등 뒤", "되돌림 주의") and the monitor chart silhouettes as locked,
non-regenerating image layers for the full 10 seconds. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame.

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
continuously in natural speech rhythm for the entire clip, as if
seriously cautioning the viewer — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep4-videos/bull_ep4_s12_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s13 — summary_checklist (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a single large card with
two lines of text — "체크 ❶" followed by "부품주 등락률" on the top line,
"체크 ❷" followed by "MLCC 가격" on the bottom line — completely rigid in
one hand at chest height for the entire clip. The card does not tilt,
rotate, rise, lower, or drift at any point, including the final 1-2
seconds. The other hand is raised in a steady "peace sign" / two-finger
gesture, held at a fixed angle without waving. Treat the card as a frozen
photograph layered in front of the character.

MOTION DETAIL: the character's expression is confident and instructive,
summarizing the two things to check.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, the card
(including both lines of text), plants must stay completely fixed — no
camera pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("체크
❶", "부품주 등락률", "체크 ❷", "MLCC 가격") and the monitor chart
silhouettes as locked, non-regenerating image layers for the full 10
seconds. Render these exactly as pixels copied from the reference image,
unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no waving
or repeated finger motion, no full-body freeze at any point, no holding
completely still for more than half a second anywhere in the clip, NO
CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly
summarizing a two-item checklist — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep4-videos/bull_ep4_s13_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s14 — remind_next_comment / closing (10초, 마지막 씬 — CTA 직전, 리스크고지 자막바 적용)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

MOTION DETAIL: the character's expression is confident and warm, gently
waving with one hand (a natural, continuous small wave motion, not a
static held pose) while the other arm relaxes at its side. Slight forward
nod for emphasis. No props held.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY, THIS IS THE FINAL
SCENE OF THE EPISODE — DO NOT LET IT GO STATIC): the character must show
visible, continuous motion for the ENTIRE 10 seconds, including the last
2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle head
tilts, gentle continuous waving motion, continuous mouth movement while
speaking. No portion of the clip, especially the back half, should hold a
single frozen pose for more than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city
skyline, plants must stay completely fixed — no camera pan or zoom, no
background object movement. No props in this scene.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the monitor chart
silhouettes as locked, non-regenerating image layers for the full 10
seconds. Render these exactly as pixels copied from the reference image,
unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, or flickering surfaces anywhere in
the frame, no regenerated or reinterpreted signage, no background changes,
no character redesign, no abrupt cut or freeze mid-motion, no static mouth,
no minimal lip movement, no closed-mouth talking, no frozen expression
while speaking, NO FULL-BODY FREEZE AT ANY POINT, no holding completely
still for more than half a second anywhere in the clip, no rigid locked
pose for the second half of the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT
ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
wrapping up today's story and inviting comments — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep4-videos/bull_ep4_s14_motion.mp4`로 저장
2. 시작·중반(4~5초)·끝(9~10초) 프레임 전부 확인 — 마지막 씬이므로 후반부 정지 여부 특히 꼼꼼히 확인
3. 14개 씬 전부 완료 후 본편 조립(`run-owl-assemble-shorts-v2.mjs`, `--spec-module _bull-ep4-assembly-spec.mjs --spec-export BULL_EP4_ASSEMBLY_SPEC`) → 고정 CTA 연결(`run-owl-episode-with-fixed-cta-once.mjs`, CTA 클립 `C:\tmp\bull-cta-fixed-v5\bull_cta_fixed_final_with_captions.mp4`) 진행
