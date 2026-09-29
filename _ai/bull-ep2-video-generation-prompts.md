# 황소특보 2편(레버리지 ETF 반전 수급) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/money-shorts-os/bull-ep2-images/out/`
영상 저장 폴더(신규 생성): `C:/tmp/money-shorts-os/bull-ep2-videos/`

**씬 길이 티어는 8초/10초 2단계로만 요청한다(9초 티어 금지, 2026-09-23 확정,
[[feedback_video_scene_length_tier_smooth_transition]]).** Gemini Veo는 항상
10초 고정, Flow도 요청값과 다르게 나올 수 있어 "9초 영상"이 실무적으로
존재하지 않는다. 발화 8초 미만 → 8초 요청, 8초 이상 → 10초 요청. 항상 발화
보다 여유 있게 받아서 조립 때 "자르기"만 하고 tpad "늘리기"는 피한다 —
부엉박사 13편 실측(모든 씬 자르기만, 늘리기 0건)이 이 방식의 근거.

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 실측 발화 | 요청 티어 | 예상 여유 |
|---|---|---|---|---|---|
| s1 opening | `bull_ep2_s1.png` | `bull_ep2_s1_motion.mp4` | 7.77초 | **8초** | 0.23초 |
| s2 hook | `bull_ep2_s2.png` | `bull_ep2_s2_motion.mp4` | 8.49초 | **10초** | 1.51초 |
| s3 background | `bull_ep2_s3.png` | `bull_ep2_s3_motion.mp4` | 9.06초 | **10초** | 0.94초 |
| s4 evidence_card | `bull_ep2_s4.png` | `bull_ep2_s4_motion.mp4` | 9.29초 | **10초** | 0.71초 |
| s5 twist | `bull_ep2_s5.png` | `bull_ep2_s5_motion.mp4` | 9.22초 | **10초** | 0.78초 |
| s6 impact | `bull_ep2_s6.png` | `bull_ep2_s6_motion.mp4` | 8.90초 | **10초** | 1.10초 |
| s7 recommendation | `bull_ep2_s7.png` | `bull_ep2_s7_motion.mp4` | 7.21초 | **8초** | 0.79초 |
| s8 action | `bull_ep2_s8.png` | `bull_ep2_s8_motion.mp4` | 8.73초 | **10초** | 1.27초 |
| s9 closing | `bull_ep2_s9.png` | `bull_ep2_s9_motion.mp4` | 8.05초 | **10초** | 1.95초 |

★ 영상 생성 절대규칙(87씬 전수조사 확정, `_ai/CURRENT_STANDARDS.md` §0) 전부 반영:
- 소품을 든 손은 **한 지점 고정**("holds steadily at", 이동·반복 왕복 지시 금지)
- **동작은 소품을 안 든 빈 쪽에만** 배정
- 소품·보드는 전부 "frozen photograph layered behind/beside the character"로 명시
- 텍스트는 CRITICAL TEXT PRESERVATION(HIGHEST PRIORITY) 블록으로 고정
- 나레이션이 있는 영상이므로 "Silent" 문구는 절대 넣지 않는다

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작 프레임뿐 아니라 클립 중반·후반 프레임에서도
텍스트·소품·동작 지속 여부, 카메라 줌/크롭, 소품 기울어짐을 확인한다.

================================================================================
# 🟦 8초 티어 (s1, s7)
================================================================================

---

## s1 — opening (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image — same monitors with
candlestick chart silhouettes, same soft pastel lighting. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character points energetically upward with one hand
raised, the other hand resting on its hip, wide eyes and a big, bright
smile throughout.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, plants, and
lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement.

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
introducing itself and today's topic — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/bull-ep2-videos/bull_ep2_s1_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카메라 줌/크롭 여부 포함
3. 문제 없으면 다음 씬 진행

---

## s7 — recommendation (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "수급
엇갈림 = 방향성 불안정" with a red up arrow and blue down arrow icon,
completely rigid in both hands at chest height for the entire clip — the
card does not tilt, rotate, rise, lower, or drift at any point, including
the final 1-2 seconds. Treat the card as a frozen photograph layered in
front of the character.

MOTION DETAIL: the character's expression is serious and thoughtful,
eyebrows slightly drawn together, calm and measured demeanor.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, the card
(including its full text and icons), plants must stay completely fixed —
no camera pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("수급
엇갈림 = 방향성 불안정") and the monitor chart silhouettes as locked,
non-regenerating image layers for the full 8 seconds. Render these exactly
as pixels copied from the reference image, unchanged frame to frame.

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
explaining what this divided signal means — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/bull-ep2-videos/bull_ep2_s7_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

================================================================================
# 🟨 10초 티어 (s2, s3, s4, s5, s6, s8, s9)
================================================================================

---

## s2 — hook (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with a large
question mark, completely rigid in one hand at chest height for the entire
clip — the card does not tilt, rotate, rise, lower, or drift at any point,
including the final 1-2 seconds. The other hand rests on its hip. Treat
the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is surprised and curious, wide
eyes, mouth slightly open, as if posing an intriguing question.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, the card
(including the question mark), plants must stay completely fixed — no
camera pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card's question
mark and the monitor chart silhouettes as locked, non-regenerating image
layers for the full 10 seconds. Render these exactly as pixels copied from
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
1. 생성된 영상을 `C:/tmp/money-shorts-os/bull-ep2-videos/bull_ep2_s2_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s3 — background (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "개인
순매도 코스콤 집계" with "SK하이닉스 레버리지 1,084억" and "삼성전자
레버리지 606억" below it, completely rigid in one hand at chest height for
the entire clip — the card does not tilt, rotate, rise, lower, or drift at
any point, including the final 1-2 seconds. Treat the card as a frozen
photograph layered in front of the character.

MOTION DETAIL: the character's expression is intrigued and engaged, as if
sharing an interesting statistic.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, the card
(including its full text), plants must stay completely fixed — no camera
pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("개인
순매도", "코스콤 집계", "SK하이닉스 레버리지 1,084억", "삼성전자 레버리지
606억") and the monitor chart silhouettes as locked, non-regenerating image
layers for the full 10 seconds. Render these exactly as pixels copied from
the reference image, unchanged frame to frame.

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
enthusiastically sharing statistics — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/bull-ep2-videos/bull_ep2_s3_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s4 — evidence_card (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds two large cards side by
side — one reading "외국인·기관 순매수" with a green upward bar chart, the
other reading "외국인 최대 684억 매수" with a red upward arrow —
completely rigid with both hands at chest height for the entire clip. The
cards do not tilt, rotate, rise, lower, or drift at any point, including
the final 1-2 seconds. Treat both cards as frozen photographs layered in
front of the character.

MOTION DETAIL: the character's expression is confident and explanatory,
pointing gently toward the cards.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, both cards
(including their full text and charts), plants must stay completely fixed
— no camera pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("외국인·기관 순매수", "외국인 최대 684억 매수") and charts, and the
monitor chart silhouettes, as locked, non-regenerating image layers for
the full 10 seconds. Render these exactly as pixels copied from the
reference image, unchanged frame to frame.

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
confidently revealing who bought the shares — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/bull-ep2-videos/bull_ep2_s4_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s5 — twist (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character points with one hand toward a
large easel-mounted card reading "현물 주식은 반대!" and "외국인
1조4,150억 순매도" above a split diagram showing a red upward arrow
labeled "레버리지형" and a blue downward arrow labeled "현물 주식" — the
easel and card are completely rigid, fixed in place for the entire clip,
never tilting or moving. The pointing hand and pointer stick (if held) stay
at a steady angle throughout.

MOTION DETAIL: the character's expression is dramatically surprised, mouth
open wide, eyes wide, as if revealing a shocking twist.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, the easel and
card (including its full text and diagram), plants must stay completely
fixed — no camera pan or zoom, no background object movement, no easel or
card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("현물
주식은 반대!", "외국인 1조4,150억 순매도", "레버리지형", "현물 주식") and
diagram, and the monitor chart silhouettes, as locked, non-regenerating
image layers for the full 10 seconds. Render these exactly as pixels
copied from the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no easel or card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO EASEL OR CARD TILT AT ANY POINT
INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
dramatically revealing an opposite trend — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/bull-ep2-videos/bull_ep2_s5_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 이젤/카드 흔들림 특히 주의
3. 문제 없으면 다음 씬 진행

---

## s6 — impact (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image, bright tone. Do not
change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "삼성전자
+11.27%" in a blue banner and "SK하이닉스 +8.88%" in a green banner, each
with a red upward arrow, completely rigid in both hands at chest height
for the entire clip — the card does not tilt, rotate, rise, lower, or
drift at any point, including the final 1-2 seconds. Treat the card as a
frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is bright and pleased, a warm
smile, pointing gently toward the card with one hand.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, the card
(including its full text, banners, and arrows), plants must stay
completely fixed — no camera pan or zoom, no background object movement,
no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("삼성전자 +11.27%", "SK하이닉스 +8.88%") and the monitor chart
silhouettes as locked, non-regenerating image layers for the full 10
seconds. Render these exactly as pixels copied from the reference image,
unchanged frame to frame.

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
announcing the stock price gains — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/bull-ep2-videos/bull_ep2_s6_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s8 — action (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a two-part card — a red
section reading "배율 구조 확인" with a small bar chart icon, and a blue
section reading "나눠서 접근" with a pie chart icon — completely rigid in
one hand at chest height for the entire clip, the other hand pointing
toward it. The card does not tilt, rotate, rise, lower, or drift at any
point, including the final 1-2 seconds.

MOTION DETAIL: the character's expression is bright and inviting, guiding
the viewer with a helpful tip.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, the card
(including its full text and icons), plants must stay completely fixed —
no camera pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("배율
구조 확인", "나눠서 접근") and icons, and the monitor chart silhouettes,
as locked, non-regenerating image layers for the full 10 seconds. Render
these exactly as pixels copied from the reference image, unchanged frame
to frame.

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
continuously in natural speech rhythm for the entire clip, as if warmly
giving practical advice — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/bull-ep2-videos/bull_ep2_s8_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s9 — closing (10초, 마지막 씬 — CTA 직전, 리스크고지 자막바 적용)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

MOTION DETAIL: the character's expression is soft, warm, and reflective —
a gentle closing-note smile, not an excited grin. Both hands are open and
relaxed, gently gesturing outward — a quiet, composed wrap-up, not an
energetic goodbye. No props held.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY, THIS IS THE FINAL
SCENE OF THE EPISODE — DO NOT LET IT GO STATIC): the character must show
visible, continuous motion for the ENTIRE 10 seconds, including the last
2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle head
tilts, gentle breathing motion, continuous mouth movement while speaking.
No portion of the clip, especially the back half, should hold a single
frozen pose for more than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, plants must
stay completely fixed — no camera pan or zoom, no background object
movement.

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
pose for the second half of the clip, no big excited waving gesture (this
is a calm, quiet close, not an energetic goodbye), NO CAMERA ZOOM OR
FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
and calmly wrapping up today's story — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/bull-ep2-videos/bull_ep2_s9_motion.mp4`로 저장
2. 시작·중반(5초)·끝(9~10초) 프레임 전부 확인 — 마지막 씬이므로 후반부 정지 여부 특히 꼼꼼히 확인
3. 9개 씬 전부 완료 후 본편 조립 → 고정 CTA(follow+teaser) 연결 진행
