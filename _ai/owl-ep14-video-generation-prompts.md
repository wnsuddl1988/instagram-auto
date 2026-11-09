# 부엉박사 14편(한은 금융안정 경고) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/money-shorts-os/owl-ep14-images/out/`
영상 저장 폴더(신규 생성): `C:/tmp/money-shorts-os/owl-ep14-videos/`

**씬 길이 티어는 8초/10초 2단계로만 요청한다(9초 티어 금지, 2026-09-23 확정,
[[feedback_video_scene_length_tier_smooth_transition]]).** 14편은 TTS 실측
결과 전체 10씬이 8초 미만(최대 7.85초)이라 **전 씬 8초 티어로 통일**한다.
항상 발화보다 여유 있게 받아서 조립 때 "자르기"만 하고 tpad "늘리기"는
피한다 — 부엉박사 13편 실측(모든 씬 자르기만, 늘리기 0건)이 이 방식의 근거.

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 실측 발화 | 요청 티어 | 예상 여유 |
|---|---|---|---|---|---|
| s1 opening | `owl_ep14_s1_opening.png` | `owl_ep14_s1_opening_motion.mp4` | 7.70초 | **8초** | 0.30초 |
| s2 alert | `owl_ep14_s2_alert.png` | `owl_ep14_s2_alert_motion.mp4` | 5.94초 | **8초** | 2.06초 |
| s3 twist_highend | `owl_ep14_s3_twist_highend.png` | `owl_ep14_s3_twist_highend_motion.mp4` | 5.94초 | **8초** | 2.06초 |
| s4 fact_lowend | `owl_ep14_s4_fact_lowend.png` | `owl_ep14_s4_fact_lowend_motion.mp4` | 6.09초 | **8초** | 1.91초 |
| s5 consequence_debt | `owl_ep14_s5_consequence_debt.png` | `owl_ep14_s5_consequence_debt_motion.mp4` | 5.54초 | **8초** | 2.46초 |
| s6 evidence_delinquency | `owl_ep14_s6_evidence_delinquency.png` | `owl_ep14_s6_evidence_delinquency_motion.mp4` | 7.07초 | **8초** | 0.93초 |
| s7 twist_timing | `owl_ep14_s7_twist_timing.png` | `owl_ep14_s7_twist_timing_motion.mp4` | 7.85초 | **8초** | 0.15초 |
| s8 impact_months | `owl_ep14_s8_impact_months.png` | `owl_ep14_s8_impact_months_motion.mp4` | 7.67초 | **8초** | 0.33초 |
| s9 recommendation | `owl_ep14_s9_recommendation.png` | `owl_ep14_s9_recommendation_motion.mp4` | 5.89초 | **8초** | 2.11초 |
| s10 action | `owl_ep14_s10_action.png` | `owl_ep14_s10_action_motion.mp4` | 6.25초 | **8초** | 1.75초 |

★ 영상 생성 절대규칙(87씬 전수조사 확정, `_ai/CURRENT_STANDARDS.md` §0) 전부 반영:
- 소품을 든 발(또는 감싸 쥔 날개)은 **한 지점 고정**("holds steadily at", 이동·반복
  왕복 지시 금지)
- **동작은 소품을 안 든 빈 쪽 날개에만** 배정
- 소품·보드는 전부 "frozen photograph layered behind/beside the character"로 명시
- 텍스트는 CRITICAL TEXT PRESERVATION(HIGHEST PRIORITY) 블록으로 고정
- 나레이션이 있는 영상이므로 "Silent" 문구는 절대 넣지 않는다
- s7 여유가 0.15초로 특히 빠듯하니 다른 씬보다 더 신경 써서 검수할 것

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작 프레임뿐 아니라 클립 중반·후반
프레임에서도 텍스트·소품·동작 지속 여부, 카메라 줌/크롭, 소품 기울어짐을 확인한다.

================================================================================
# 🟦 8초 티어 (전 씬 s1~s10)
================================================================================

---

## s1 — opening (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the financial briefing room
background exactly as shown in the reference image — same podium, same
large screen with faint rising/falling arrow graph silhouettes. Do not
change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character raises one wing in a greeting gesture, sharp
confident expression (not smiling), sunglasses resting on the forehead
stay perfectly still.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the podium, the screen graph silhouettes, the sunglasses
on the forehead, plants and chairs must stay completely fixed — no camera
pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the screen text and
graph silhouettes as locked, non-regenerating image layers for the full 8
seconds. Render these exactly as pixels copied from the reference image,
unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, or flickering surfaces
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static beak, no minimal beak movement, no closed-beak
talking, no frozen expression while speaking, no full-body freeze at any
point, no holding completely still for more than half a second anywhere in
the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST
SECOND.

BEAK MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if confidently
introducing itself and today's topic — never static, never barely-moving,
never closed-beak talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/owl-ep14-videos/owl_ep14_s1_opening_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카메라 줌/크롭 여부 포함
3. 문제 없으면 다음 씬 진행

---

## s2 — alert (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the office background (bookshelf
with globe and trophy) exactly as shown in the reference image. Do not
change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading
"금융불안지수 19.5" and "주의 단계 진입" with a yellow warning-light icon,
completely rigid in one wing at chest height for the entire clip — the
card does not tilt, rotate, rise, lower, or drift at any point, including
the final 1-2 seconds. Treat the card as a frozen photograph layered in
front of the character.

MOTION DETAIL: the character's expression is serious and sharp (not
smiling), the free wing gestures slightly to emphasize the point.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the bookshelf, globe, trophy, plants, and the card
(including its full text and icon) must stay completely fixed — no camera
pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("금융불안지수 19.5", "주의 단계 진입") as a locked, non-regenerating
image layer for the full 8 seconds. Render it exactly as pixels copied
from the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static beak, no minimal beak movement, no closed-beak
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND.

BEAK MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if seriously announcing a
warning — never static, never barely-moving, never closed-beak talking,
never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/owl-ep14-videos/owl_ep14_s2_alert_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s3 — twist_highend (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the office background exactly as
shown in the reference image. Do not change any colors, text, or object
positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "강남
-1.28%" and "서초 -0.94%" with a blue downward arrow, completely rigid in
one wing at chest height for the entire clip — the card does not tilt,
rotate, rise, lower, or drift at any point, including the final 1-2
seconds. The other wing is raised near the face in a surprised gesture.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is surprised, beak slightly
open, eyes wide, as if revealing an unexpected fact.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the bookshelf, globe, trophy, plants, and the card
(including its full text and arrow) must stay completely fixed — no camera
pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("강남
-1.28%", "서초 -0.94%") and arrow as a locked, non-regenerating image
layer for the full 8 seconds. Render it exactly as pixels copied from the
reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static beak, no minimal beak movement, no closed-beak
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND.

BEAK MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if surprisingly revealing
a twist — never static, never barely-moving, never closed-beak talking,
never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/owl-ep14-videos/owl_ep14_s3_twist_highend_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s4 — fact_lowend (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the office background exactly as
shown in the reference image. Do not change any colors, text, or object
positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "중랑
+3.46%", "성북 +3.36%", "강북 +2.92%" with a red upward arrow, completely
rigid in one wing at chest height for the entire clip — the card does not
tilt, rotate, rise, lower, or drift at any point, including the final 1-2
seconds. The other wing points gently toward the card. Treat the card as a
frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is calm and serious (in contrast
to the previous surprised beat), explaining steadily.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the bookshelf, globe, trophy, plants, and the card
(including its full text and arrow) must stay completely fixed — no camera
pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("중랑
+3.46%", "성북 +3.36%", "강북 +2.92%") and arrow as a locked,
non-regenerating image layer for the full 8 seconds. Render it exactly as
pixels copied from the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static beak, no minimal beak movement, no closed-beak
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND.

BEAK MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if calmly explaining the
contrasting data — never static, never barely-moving, never closed-beak
talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/owl-ep14-videos/owl_ep14_s4_fact_lowend_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s5 — consequence_debt (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the financial briefing room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "가계신용
2019.8조 원" and "전년比 +3.6%" with a red upward bar chart icon,
completely rigid in both wings at chest height for the entire clip — the
card does not tilt, rotate, rise, lower, or drift at any point, including
the final 1-2 seconds. Treat the card as a frozen photograph layered in
front of the character.

MOTION DETAIL: the character's expression is worried and concerned,
eyebrows drawn together.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the podium, the screen text and graph, plants, and the
card (including its full text and icon) must stay completely fixed — no
camera pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("가계신용 2019.8조 원", "전년比 +3.6%") and the screen text/graph as
locked, non-regenerating image layers for the full 8 seconds. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static beak, no minimal beak movement, no closed-beak
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND.

BEAK MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if worriedly explaining
the consequence — never static, never barely-moving, never closed-beak
talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/owl-ep14-videos/owl_ep14_s5_consequence_debt_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s6 — evidence_delinquency (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the financial briefing room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "취약
자영업자 연체율" and "12.71%" with a red warning triangle icon and small
rising bar chart, completely rigid in one wing at chest height for the
entire clip — the card does not tilt, rotate, rise, lower, or drift at any
point, including the final 1-2 seconds. Treat the card as a frozen
photograph layered in front of the character.

MOTION DETAIL: the character's expression is grave and serious, sharp
focused eyes.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the podium, the screen text and graph, plants, and the
card (including its full text and icons) must stay completely fixed — no
camera pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("취약
자영업자 연체율", "12.71%") and the screen text as locked, non-regenerating
image layers for the full 8 seconds. Render these exactly as pixels copied
from the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static beak, no minimal beak movement, no closed-beak
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND.

BEAK MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if gravely presenting
evidence — never static, never barely-moving, never closed-beak talking,
never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/owl-ep14-videos/owl_ep14_s6_evidence_delinquency_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s7 — twist_timing (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the financial briefing room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds. NOTE: this scene's spoken audio runs nearly the full 8 seconds, so
camera stability must be flawless from frame 1 to the very last frame.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading a clock
icon and "금리인상 효과," and "취약차주일수록 빠르게" with a small rising
arrow, completely rigid in one wing at chest height for the entire clip —
the card does not tilt, rotate, rise, lower, or drift at any point,
including the final 1-2 seconds. Treat the card as a frozen photograph
layered in front of the character.

MOTION DETAIL: the character's expression is surprised yet serious, beak
open as if revealing an important twist.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the podium, the screen text and graph, plants, and the
card (including its full text and icons) must stay completely fixed — no
camera pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("금리인상 효과, 취약차주일수록 빠르게") and the screen text ("금리와 우리
경제") as locked, non-regenerating image layers for the full 8 seconds.
Render these exactly as pixels copied from the reference image, unchanged
frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static beak, no minimal beak movement, no closed-beak
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND.

BEAK MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if surprisingly pointing
out the real problem — never static, never barely-moving, never
closed-beak talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/owl-ep14-videos/owl_ep14_s7_twist_timing_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — **이 씬은 여유가 0.15초로 가장 빠듯하므로
   특히 꼼꼼히 확인**
3. 문제 없으면 다음 씬 진행

---

## s8 — impact_months (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the financial briefing room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character stands beside a large easel
board split into two halves — left side reading "전체 차주" and "15개월 후
최대 영향" with a blue clock icon, right side reading "취약차주·중소기업"
and "9개월 후 최대 영향" with a red clock icon — the easel and board are
completely rigid, fixed in place for the entire clip, never tilting or
moving. One wing gestures gently toward the board without touching it.

MOTION DETAIL: the character's expression is grave and serious, explaining
the comparison.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the podium, the screen text and graph, plants, and the
easel board (including its full text and icons) must stay completely fixed
— no camera pan or zoom, no background object movement, no easel or board
movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text
("전체 차주", "15개월 후 최대 영향", "취약차주·중소기업", "9개월 후 최대
영향") and the screen text as locked, non-regenerating image layers for
the full 8 seconds. Render these exactly as pixels copied from the
reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static beak, no minimal beak movement, no closed-beak
talking, no frozen expression while speaking, no easel or board movement,
no full-body freeze at any point, no holding completely still for more
than half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT
ANY POINT INCLUDING THE LAST SECOND, NO EASEL OR BOARD TILT AT ANY POINT
INCLUDING THE LAST SECOND.

BEAK MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if gravely comparing the
two timelines — never static, never barely-moving, never closed-beak
talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/owl-ep14-videos/owl_ep14_s8_impact_months_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 이젤/보드 흔들림 특히 주의
3. 문제 없으면 다음 씬 진행

---

## s9 — recommendation (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the financial briefing room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "방심
금지," and "이자부담 증가 가능" with a red warning triangle icon and small
rising bar chart, completely rigid in one wing at chest height for the
entire clip — the card does not tilt, rotate, rise, lower, or drift at any
point, including the final 1-2 seconds. Treat the card as a frozen
photograph layered in front of the character.

MOTION DETAIL: the character's expression is serious but calm, measured
and composed.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the podium, the screen text and graph, plants, and the
card (including its full text and icons) must stay completely fixed — no
camera pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("방심
금지, 이자부담 증가 가능") and the screen text ("경제, 지금이 중요한
시점입니다") as locked, non-regenerating image layers for the full 8
seconds. Render these exactly as pixels copied from the reference image,
unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static beak, no minimal beak movement, no closed-beak
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND.

BEAK MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if calmly but firmly
giving a warning — never static, never barely-moving, never closed-beak
talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/owl-ep14-videos/owl_ep14_s9_recommendation_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s10 — action (8초, 마지막 씬 — CTA 직전)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the financial briefing room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds up a smartphone showing
"상환 계획" and "점검하기" on its screen, securely gripped in one wing the
entire time so the screen never shakes, tilts, or drifts, including the
final 1-2 seconds. The other wing gestures gently outward in a warm,
friendly closing gesture.

MOTION DETAIL: the character's expression is warm and friendly, a gentle
smile to close out the episode — softer than the sharp expressions in
earlier scenes.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY, THIS IS THE FINAL
SCENE OF THE EPISODE — DO NOT LET IT GO STATIC): the character must show
visible, continuous motion for the ENTIRE 8 seconds, including the last
2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle head
tilts, continuous beak movement while speaking. No portion of the clip,
especially the back half, should hold a single frozen pose for more than
half a second.

STATIC ELEMENTS: the podium, the screen graph, plants, and the smartphone
(including its full text) must stay completely fixed — no camera pan or
zoom, no background object movement, no phone shake or drift.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the phone screen text
("상환 계획", "점검하기") as a locked, non-regenerating image layer for the
full 8 seconds. Render it exactly as pixels copied from the reference
image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, or flickering surfaces
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static beak, no minimal beak movement, no closed-beak
talking, no frozen expression while speaking, no phone movement or shake,
NO FULL-BODY FREEZE AT ANY POINT, no holding completely still for more
than half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT
ANY POINT INCLUDING THE LAST SECOND.

BEAK MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if warmly wrapping up
with a practical tip — never static, never barely-moving, never
closed-beak talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/owl-ep14-videos/owl_ep14_s10_action_motion.mp4`로 저장
2. 시작·중반(4초)·끝(7~8초) 프레임 전부 확인 — 마지막 씬이므로 후반부 정지 여부
   특히 꼼꼼히 확인
3. 10개 씬 전부 완료 후 본편 조립 → 고정 CTA(follow+teaser) 연결 진행
