# 황소특보 3편(반도체 랠리 착시, 외국인 종목별 반대 베팅) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/bull-ep3-images/`
영상 저장 폴더(신규 생성): `C:/tmp/bull-ep3-videos/`

**씬 길이 티어는 8초/10초 2단계로만 요청한다(9초 티어 금지, 2026-09-23 확정,
[[feedback_video_scene_length_tier_smooth_transition]]).** Gemini Veo는 항상
10초 고정, Flow도 요청값과 다르게 나올 수 있어 "9초 영상"이 실무적으로
존재하지 않는다. 발화 8초 미만 → 8초 요청, 8초 이상 → 10초 요청. 항상 발화
보다 여유 있게 받아서 조립 때 "자르기"만 하고 tpad "늘리기"는 피한다.

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 실측 발화 | 요청 티어 | 예상 여유 |
|---|---|---|---|---|---|
| s1 opening | `bull_ep3_s1.png` | `bull_ep3_s1_motion.mp4` | 5.85초 | **8초** | 2.15초 |
| s2 hook | `bull_ep3_s2.png` | `bull_ep3_s2_motion.mp4` | 5.89초 | **8초** | 2.11초 |
| s3 situation | `bull_ep3_s3.png` | `bull_ep3_s3_motion.mp4` | 8.25초 | **10초** | 1.75초 |
| s4 situation | `bull_ep3_s4.png` | `bull_ep3_s4_motion.mp4` | 9.24초 | **10초** | 0.76초 |
| s5 psychology(twist) | `bull_ep3_s5.png` | `bull_ep3_s5_motion.mp4` | 8.42초 | **10초** | 1.58초 |
| s6 evidence | `bull_ep3_s6.png` | `bull_ep3_s6_motion.mp4` | 6.36초 | **8초** | 1.64초 |
| s7 background(context) | `bull_ep3_s7.png` | `bull_ep3_s7_motion.mp4` | 7.93초 | **10초**(margin 확보용, 8초로는 빠듯) | 2.07초 |
| s8 recommendation(체크1) | `bull_ep3_s8.png` | `bull_ep3_s8_motion.mp4` | 7.07초 | **8초** | 0.93초 |
| s9 recommendation(체크2) | `bull_ep3_s9.png` | `bull_ep3_s9_motion.mp4` | 8.98초 | **10초** | 1.02초 |
| s10 closing | `bull_ep3_s10.png` | `bull_ep3_s10_motion.mp4` | 6.90초 | **8초** | 1.10초 |

★ 영상 생성 절대규칙(87씬 전수조사 확정, `_ai/CURRENT_STANDARDS.md` §0) 전부 반영:
- 소품을 든 손은 **한 지점 고정**("holds steadily at", 이동·반복 왕복 지시 금지)
- **동작은 소품을 안 든 빈 쪽에만** 배정
- 소품·보드는 전부 "frozen photograph layered behind/beside the character"로 명시
- 텍스트는 CRITICAL TEXT PRESERVATION(HIGHEST PRIORITY) 블록으로 고정
- 나레이션이 있는 영상이므로 "Silent" 문구는 절대 넣지 않는다

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작 프레임뿐 아니라 클립 중반·후반 프레임에서도
텍스트·소품·동작 지속 여부, 카메라 줌/크롭, 소품 기울어짐을 확인한다.

================================================================================
# 🟦 8초 티어 (s1, s2, s6, s8, s10)
================================================================================

---

## s1 — opening (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image — same monitors with
candlestick chart silhouettes, same soft golden lighting. Do not change any
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
1. 생성된 영상을 `C:/tmp/bull-ep3-videos/bull_ep3_s1_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카메라 줌/크롭 여부 포함
3. 문제 없으면 다음 씬 진행

---

## s2 — hook (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with a large
question mark, completely rigid in one hand at chest height for the entire
clip — the card does not tilt, rotate, rise, lower, or drift at any point,
including the final 1-2 seconds. The other hand rests on its hip. Treat
the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is curious and thoughtful, wide
eyes, mouth slightly open, as if posing an intriguing question.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, the card
(including the question mark), plants must stay completely fixed — no
camera pan or zoom, no background object movement, no card movement.

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
1. 생성된 영상을 `C:/tmp/bull-ep3-videos/bull_ep3_s2_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s6 — evidence (8초) — ★재생성판, 1차 시도가 7초 지점부터 카드·의상 붕괴해 폐기★

1차 생성분은 6.5초까지는 정상이었으나 7초부터 카드가 반투명해지며 사라지고
캐릭터 의상(반팔→민소매)·표정까지 붕괴됐다. 후반부(6.5~8초) 안정성 문구를
강화해 재시도한다.

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY, STRICT THROUGH THE VERY LAST FRAME): the
character holds two cards side by side, one in each hand — the left card
reading "삼성전자" with "2조59억" and a red upward arrow with "매수", the
right card reading "하이닉스" with "2조2,795억" and a blue downward arrow
with "매도" — completely rigid at chest height for the entire clip,
including seconds 6 through 8. Neither card tilts, rotates, rises, lowers,
fades, becomes transparent, or drifts at any point, including the final
1-2 seconds. Treat both cards as frozen photographs layered in front of
the character, present and fully opaque in every single frame from 0:00
to 0:08 with no exceptions.

WARDROBE LOCK (HIGHEST PRIORITY): the character's short-sleeve white
dress shirt, burgundy tie, navy pants, and brown shoes must remain
completely unchanged in cut and style for the entire 8 seconds — no
sleeve removal, no wardrobe redesign, no costume change at any point,
including the final 1-2 seconds.

MOTION DETAIL: the character's expression is confident and sharp-eyed, as
if contrasting two opposite facts.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
altering, fading, or regenerating the cards, wardrobe, or face structure —
motion comes only from natural blinking, head tilt, and mouth movement.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, both cards
(including their full text and arrows), plants must stay completely fixed
— no camera pan or zoom, no background object movement, no card movement,
no card fading or disappearing at any point in the 8 seconds.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY, ENTIRE DURATION INCLUDING
SECONDS 6-8): treat the card text ("삼성전자", "2조59억", "매수",
"하이닉스", "2조2,795억", "매도") and the monitor chart silhouettes as
locked, non-regenerating image layers for the full 8 seconds. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame, from the first frame to the last frame with zero exceptions.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, fading, or misspelled
text anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no wardrobe change, no sleeve
removal, no abrupt cut or freeze mid-motion, no static mouth, no minimal
lip movement, no closed-mouth talking, no frozen expression while
speaking, no card movement, no card transparency or disappearance, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND, NO VISUAL DEGRADATION OR SCENE BREAKDOWN IN
SECONDS 6 THROUGH 8.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
confidently pointing out two opposite bets — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep3-videos/bull_ep3_s6_motion.mp4`로 저장(기존 실패본을 덮어씀)
2. **7~8초 구간을 특히 꼼꼼히 확인** — 카드 투명도, 의상(소매), 표정 붕괴 재발 여부
3. 재발 시 이미지 소스(`bull_ep3_s6.png`) 자체는 문제 없었으므로, 다른 생성 엔진(Flow 등)으로 전환하거나 씬을 통째로 다른 구도로 재설계하는 것을 고려
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s8 — recommendation / 체크리스트1 (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a clipboard-style card
reading "체크 1:" in a red banner followed by "외국인 순매수·매도 상위
확인" with a checkmark icon, completely rigid in one hand at chest height
for the entire clip — the card does not tilt, rotate, rise, lower, or
drift at any point, including the final 1-2 seconds. The other hand's
index finger is raised in a steady "number one" gesture, held at a fixed
angle without waving.

MOTION DETAIL: the character's expression is confident and instructive,
guiding the viewer through a checklist item.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, the card
(including its full text and checkmark icon), plants must stay completely
fixed — no camera pan or zoom, no background object movement, no card
movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("체크
1:", "외국인 순매수·매도 상위 확인") and the monitor chart silhouettes as
locked, non-regenerating image layers for the full 8 seconds. Render these
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
instructing the viewer to check something — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep3-videos/bull_ep3_s8_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s10 — closing (8초, 마지막 씬 — CTA 직전, 리스크고지 자막바 적용)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

MOTION DETAIL: the character's expression is confident yet warm and
reflective — a settled closing-note smile, not an excited grin. Both hands
are open and relaxed, gently gesturing outward — a quiet, composed
wrap-up, not an energetic goodbye. No props held.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY, THIS IS THE FINAL
SCENE OF THE EPISODE — DO NOT LET IT GO STATIC): the character must show
visible, continuous motion for the ENTIRE 8 seconds, including the last
2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle head
tilts, gentle breathing motion, continuous mouth movement while speaking.
No portion of the clip, especially the back half, should hold a single
frozen pose for more than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, the golden
bull statue in the background, plants must stay completely fixed — no
camera pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the monitor chart
silhouettes as locked, non-regenerating image layers for the full 8
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
continuously in natural speech rhythm for the entire clip, as if calmly
wrapping up today's story with quiet confidence — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep3-videos/bull_ep3_s10_motion.mp4`로 저장
2. 시작·중반(4초)·끝(7~8초) 프레임 전부 확인 — 마지막 씬이므로 후반부 정지 여부 특히 꼼꼼히 확인
3. 10개 씬 전부 완료 후 본편 조립 → 고정 CTA 연결 진행

================================================================================
# 🟨 10초 티어 (s3, s4, s5, s7, s9)
================================================================================

---

## s3 — situation / 배경1 (10초)

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
one in each hand — the left reading "코스피" with "7080선 회복" and a red
upward arrow, the right reading "삼성전자" with "+3.28%" and a red upward
arrow — completely rigid at chest height for the entire clip. Neither card
tilts, rotates, rises, lowers, or drifts at any point, including the final
1-2 seconds. Treat both cards as frozen photographs layered in front of
the character.

MOTION DETAIL: the character's expression is bright and pleased, sharing
good news.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, both cards
(including their full text and arrows), plants must stay completely fixed
— no camera pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("코스피", "7080선 회복", "삼성전자", "+3.28%") and the monitor chart
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
reporting the market recovery — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep3-videos/bull_ep3_s3_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s4 — situation / 배경2 (10초)

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
reading "24만원대" above an arrow labeled "→ 7거래일 +14%" with a rising
bar chart icon, completely rigid in both hands at chest height for the
entire clip — the card does not tilt, rotate, rise, lower, or drift at any
point, including the final 1-2 seconds. Treat the card as a frozen
photograph layered in front of the character.

MOTION DETAIL: the character's expression is pleasantly surprised, eyes
widened, as if marveling at a sharp rebound.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, the card
(including its full text and chart icon), plants must stay completely
fixed — no camera pan or zoom, no background object movement, no card
movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("24만원대", "→ 7거래일 +14%") and the monitor chart silhouettes as
locked, non-regenerating image layers for the full 10 seconds. Render
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
continuously in natural speech rhythm for the entire clip, as if
excitedly describing a rebound — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep3-videos/bull_ep3_s4_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s5 — psychology / 반전 (10초)

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
reading "외국인" in a yellow banner at the top, with two columns below —
left column "삼성전자" over a red upward arrow labeled "매수", right
column "SK하이닉스" over a blue downward arrow labeled "매도" —
completely rigid in both hands at chest height for the entire clip. The
card does not tilt, rotate, rise, lower, or drift at any point, including
the final 1-2 seconds. Treat the card as a frozen photograph layered in
front of the character.

MOTION DETAIL: the character's expression is dramatically surprised, mouth
open wide, eyes wide, as if revealing a shocking contradiction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, the card
(including its full text, arrows, and banner), plants must stay
completely fixed — no camera pan or zoom, no background object movement,
no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("외국인", "삼성전자", "매수", "SK하이닉스", "매도") and the monitor chart
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
continuously in natural speech rhythm for the entire clip, as if
dramatically revealing an opposite trend — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep3-videos/bull_ep3_s5_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s7 — background / 맥락 (10초, 8초 대비 margin 확보용)

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
reading "개인·외국인" over "매도" in a red banner, "vs" in the middle, and
"자사주 매입" over "매입" in a green banner, with a red arrow and blue
arrow clashing in the center — completely rigid in one hand at chest
height for the entire clip, the other hand pointing toward it. The card
does not tilt, rotate, rise, lower, or drift at any point, including the
final 1-2 seconds. Treat the card as a frozen photograph layered in front
of the character.

MOTION DETAIL: the character's expression is serious and engaged, as if
explaining an important underlying cause.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, the card
(including its full text and arrows), plants must stay completely fixed —
no camera pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("개인·외국인", "매도", "vs", "자사주 매입", "매입") and the monitor chart
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
continuously in natural speech rhythm for the entire clip, as if seriously
explaining what has propped up the market — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep3-videos/bull_ep3_s7_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 실측 발화(7.93초)가 8초 티어에 거의 딱 맞아 10초로 요청함, margin 확보 재확인
3. 문제 없으면 다음 씬 진행

---

## s9 — recommendation / 체크리스트2 (10초)

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
reading "체크 2:" in a red banner followed by "자사주 매입 진행률", with
two gauge bars below — "삼성전자 82%" (blue bar) and "SK하이닉스 64%"
(orange bar) — completely rigid in one hand at chest height for the
entire clip. The card does not tilt, rotate, rise, lower, or drift at any
point, including the final 1-2 seconds. The other hand's fingers are held
in a steady "number two" (peace sign) gesture at a fixed angle without
waving.

MOTION DETAIL: the character's expression is confident and instructive,
guiding the viewer through the second checklist item.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, the card
(including its full text and gauge bars), plants must stay completely
fixed — no camera pan or zoom, no background object movement, no card
movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("체크
2:", "자사주 매입 진행률", "삼성전자 82%", "SK하이닉스 64%") and the
monitor chart silhouettes as locked, non-regenerating image layers for the
full 10 seconds. Render these exactly as pixels copied from the reference
image, unchanged frame to frame.

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
instructing the viewer to check the second item — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep3-videos/bull_ep3_s9_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 10개 씬 전부 완료 후 본편 조립 → 고정 CTA 연결 진행
