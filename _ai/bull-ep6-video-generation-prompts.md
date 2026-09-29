# 황소특보 6편(삼성전자 3분기 배당 마지막 매수일) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/bull-ep6-images/`
영상 저장 폴더(신규 생성): `C:/tmp/bull-ep6-videos/`

**씬 길이 티어는 8초/10초 2단계로만 요청한다(9초 티어 금지,
[[feedback_video_scene_length_tier_smooth_transition]]).** 발화 8초 미만이고
여유 1초 이상이면 8초, 그 외(8초 이상이거나 여유 1초 미만)는 10초.

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 실측 발화(raw) | 요청 티어 | 예상 여유 |
|---|---|---|---|---|---|
| s1 hook | `bull_ep6_s1.png` | `bull_ep6_s1_motion.mp4` | 3.37초 | **8초** | 4.63초 |
| s2 hook_stakes | `bull_ep6_s2.png` | `bull_ep6_s2_motion.mp4` | 5.97초 | **8초** | 2.03초 |
| s3 opening | `bull_ep6_s3.png` | `bull_ep6_s3_motion.mp4` | 5.62초 | **8초** | 2.38초 |
| s4 situation1 | `bull_ep6_s4.png` | `bull_ep6_s4_motion.mp4` | 3.40초 | **8초** | 4.60초 |
| s5 situation2 | `bull_ep6_s5.png` | `bull_ep6_s5_motion.mp4` | 6.28초 | **8초** | 1.72초 |
| s6 situation3 | `bull_ep6_s6.png` | `bull_ep6_s6_motion.mp4` | 5.52초 | **8초** | 2.48초 |
| s7 core_q_answer | `bull_ep6_s7.png` | `bull_ep6_s7_motion.mp4` | 9.37초 | **10초** | 0.63초 |
| s8 reason1_scale | `bull_ep6_s8.png` | `bull_ep6_s8_motion.mp4` | 8.57초 | **10초** | 1.43초 |
| s9 reason1_background | `bull_ep6_s9.png` | `bull_ep6_s9_motion.mp4` | 8.48초 | **10초** | 1.52초 |
| s10 reason2_source | `bull_ep6_s10.png` | `bull_ep6_s10_motion.mp4` | 6.58초 | **8초** | 1.42초 |
| s11 reason2_numbers | `bull_ep6_s11.png` | `bull_ep6_s11_motion.mp4` | 6.15초 | **8초** | 1.85초 |
| s12 reason2_meaning | `bull_ep6_s12.png` | `bull_ep6_s12_motion.mp4` | 4.42초 | **8초** | 3.58초 |
| s13 reason3_feel | `bull_ep6_s13.png` | `bull_ep6_s13_motion.mp4` | 7.44초 | **10초** | 0.56초 |
| s14 balance1 | `bull_ep6_s14.png` | `bull_ep6_s14_motion.mp4` | 5.79초 | **8초** | 2.21초 |
| s15 balance2 | `bull_ep6_s15.png` | `bull_ep6_s15_motion.mp4` | 5.25초 | **8초** | 2.75초 |
| s16 summary | `bull_ep6_s16.png` | `bull_ep6_s16_motion.mp4` | 4.50초 | **8초** | 3.50초 |
| s17 checklist | `bull_ep6_s17.png` | `bull_ep6_s17_motion.mp4` | 5.64초 | **8초** | 2.36초 |
| s18 remind_next_comment(closing) | `bull_ep6_s18.png` | `bull_ep6_s18_motion.mp4` | 8.37초 | **10초** | 1.63초 |

★ 영상 생성 절대규칙(87씬 전수조사 확정, `_ai/CURRENT_STANDARDS.md` §0) 전부 반영:
- 소품을 든 손은 **한 지점 고정**("holds steadily at", 이동·반복 왕복 지시 금지)
- **동작은 소품을 안 든 빈 손에만** 배정
- 카드/보드 소품은 전부 "frozen photograph layered in front of/beside the character"로 명시
- 텍스트는 CRITICAL TEXT PRESERVATION(HIGHEST PRIORITY) 블록으로 고정
- 나레이션이 있는 영상이므로 "Silent" 문구는 절대 넣지 않는다
- **PROP LOCK을 마지막 프레임까지 강하게 명시한다**(부엉박사 16·17편에서
  카드 소실·텍스트 블러 사고가 반복됐다. "카드는 마지막 프레임까지
  반드시 들려 있어야 한다", "손이 카드에서 떨어지거나 벌어지지 않는다",
  "카드 텍스트는 매 프레임 완벽히 선명해야 한다" 문구를 전 씬에 포함)
- 배경은 유리 타워 사옥·광장·화단·깃대로 구성되며, **건물 외벽·정문·깃발에
  어떠한 글자·로고·마크도 없어야 한다**(이미지 자체에 이미 로고 없이
  생성됐으나, 영상 생성 단계에서 AI가 임의로 글자를 추가하지 않도록
  STATIC ELEMENTS에 명시).

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작 프레임뿐 아니라 클립 중반·후반 프레임에서도
텍스트·소품·동작 지속 여부, 카메라 줌/크롭, 소품 기울어짐, **특히 카드가 끝까지 선명하게 들려 있는지**를 확인한다.

================================================================================
# 🟦 8초 티어 (s1, s2, s3, s4, s5, s6, s10, s11, s12, s14, s15, s16, s17)
================================================================================

---

## s1 — hook (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the corporate plaza background
exactly as shown in the reference image — same twin glass office towers,
same plaza with round planters and trees, same flagpoles with plain
unmarked flags. Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with large text
"오늘이" on the top line and "마지막?" in red on the bottom line,
completely rigid in one hand at chest height for the entire clip, from
frame 1 all the way to the very last frame with NO exception. The card must
remain PERFECTLY STILL AND IN SHARP FOCUS at every single frame, including
the final 1-2 seconds — it must never shake, blur, or double-expose. The
card must still be visibly held and clearly readable at the exact final
frame, identically sharp to frame 1. The card never disappears, is never
dropped, is never released, and the hand never opens outward away from the
card at any point, including the last 1-2 seconds. The card does not tilt,
rotate, rise, lower, or drift at any point. The other hand rests on the
character's hip. Treat the card as a frozen, perfectly sharp photograph
layered in front of the character, permanently glued to the character's
hand for the entire 8-second duration.

MOTION DETAIL: the character's expression is urgent yet confident, wide
eyes, mouth open as if delivering breaking news to the viewer.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces or head tilts, continuous mouth movement while speaking. This
motion must come ONLY from the head, eyes, and mouth — the hand holding
the card must remain completely still and attached for the full clip. No
portion of the clip, especially the back half, should hold a single frozen
pose for more than half a second, but this also must never be achieved by
releasing, dropping, or making the card disappear or blur.

STATIC ELEMENTS: the glass office towers, plaza planters, trees, flagpoles,
and stone floor must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement, no card disappearance. No
text, logos, or marks appear anywhere on the towers, flags, or plaza at any
point.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("오늘이",
"마지막?") as a locked, non-regenerating, permanently sharp image layer for
the full 8 seconds, including the very last frame. Render it exactly as
pixels copied from the reference image, unchanged and in crisp focus frame
to frame — the text must be perfectly legible in every single frame with
zero motion blur or ghosting.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, shaking, vibrating, double-exposed,
or misspelled text anywhere in the frame at any point, no regenerated or
reinterpreted signage, no logos or text appearing on the buildings or
flags, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, NO CARD
MOVEMENT, NO CARD SHAKE OR BLUR AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD DISAPPEARING OR BEING DROPPED AT ANY POINT, NO HAND OPENING OUTWARD OR
RELEASING THE CARD, NO EMPTY-HANDED POSE AT ANY POINT, no full-body freeze
at any point, no holding completely still for more than half a second
anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT
INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT INCLUDING
THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if urgently
alerting the viewer — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds. The card
stays held throughout, unaffected by the mouth movement.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep6-videos/bull_ep6_s1_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — **카드 텍스트가 끝까지 선명하게 들려 있는지 최우선 확인**, 카메라 줌/크롭 여부 포함
3. 문제 없으면 다음 씬 진행

---

## s2 — hook_stakes (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the corporate plaza background
exactly as shown in the reference image. Do not change any colors, text,
or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with large text
"배당" on the top line and "30조 원" in red on the bottom line, completely
rigid in both hands at chest height for the entire clip, from frame 1 to
the very last frame with NO exception. The card must remain PERFECTLY
STILL AND IN SHARP FOCUS at every frame, including the final 1-2 seconds.
The card never disappears, is never dropped, is never released, and the
hands never open outward away from the card at any point. The card does
not tilt, rotate, rise, lower, or drift at any point. Treat the card as a
frozen, perfectly sharp photograph layered in front of the character,
permanently glued to the character's hands for the entire 8-second
duration.

MOTION DETAIL: the character's expression is wide-eyed and surprised, as if
revealing an astonishingly large number.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion must
come ONLY from the head, eyes, and mouth — the hands holding the card must
remain completely still and attached for the full clip. No portion of the
clip should hold a single frozen pose for more than half a second, but
never by releasing, dropping, or blurring the card.

STATIC ELEMENTS: the glass office towers, plaza planters, trees,
flagpoles, and stone floor must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement, no card
disappearance. No text, logos, or marks appear anywhere on the towers,
flags, or plaza.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("배당",
"30조 원") as a locked, non-regenerating, permanently sharp image layer for
the full 8 seconds, including the very last frame. Render it exactly as
pixels copied from the reference image, unchanged and in crisp focus frame
to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, shaking, vibrating, double-exposed,
or misspelled text anywhere in the frame at any point, no regenerated or
reinterpreted signage, no logos or text appearing on the buildings or
flags, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, NO CARD
MOVEMENT, NO CARD SHAKE OR BLUR AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD DISAPPEARING OR BEING DROPPED AT ANY POINT, NO HANDS OPENING OUTWARD
OR RELEASING THE CARD, NO EMPTY-HANDED POSE AT ANY POINT, no full-body
freeze at any point, no holding completely still for more than half a
second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT
INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT INCLUDING
THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
excitedly revealing a huge number — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds. The
card stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep6-videos/bull_ep6_s2_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드 텍스트가 끝까지 선명한지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s3 — opening (8초, 소품 없음)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the corporate plaza background
exactly as shown in the reference image. Do not change any colors, text,
or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

MOTION DETAIL: the character points energetically upward with one hand
raised, the other hand resting on its hip, wide eyes and a big, bright,
warm smile throughout — introducing itself cheerfully. No props held.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the glass office towers, plaza planters, trees,
flagpoles, and stone floor must stay completely fixed — no camera pan or
zoom, no background object movement. No text, logos, or marks appear
anywhere on the towers, flags, or plaza. No props in this scene.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, or flickering surfaces anywhere in
the frame, no logos or text appearing on the buildings or flags, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no full-body freeze at any
point, no holding completely still for more than half a second anywhere in
the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST
SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if brightly
introducing itself — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep6-videos/bull_ep6_s3_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s4 — situation1 (8초, 바닥 거치 보드)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the corporate plaza background
exactly as shown in the reference image. Do not change any colors, text,
or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): a floor-standing sandwich-board sign reading
"배당 기준일" on the top line and "9/30" in red on the bottom line remains
completely rigid, standing upright on the floor beside the character for
the entire clip — the sign does not tip over, rotate, slide, or fall at
any point, including the final 1-2 seconds. The sign's text must remain
PERFECTLY SHARP at every frame — it must never shake, blur, or
double-expose. Treat the sign as a frozen, perfectly sharp photograph
layered beside the character, fixed to the floor.

MOTION DETAIL: the character's empty hand (holding no prop) points toward
the sign with an explanatory, informative expression; the other hand rests
on its hip. Only the pointing arm moves — the sign itself never shifts
position.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
tipping, sliding, or regenerating the sign.

STATIC ELEMENTS: the glass office towers, plaza planters, trees,
flagpoles, stone floor, and the sandwich-board sign (including its full
text and floor position) must stay completely fixed — no camera pan or
zoom, no background object movement, no sign movement or tipping. No text,
logos, or marks appear anywhere on the towers, flags, or plaza.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the sign text ("배당
기준일", "9/30") as a locked, non-regenerating, permanently sharp image
layer for the full 8 seconds, including the very last frame. Render it
exactly as pixels copied from the reference image, unchanged and in crisp
focus frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, shaking, vibrating, double-exposed,
or misspelled text anywhere in the frame at any point, no regenerated or
reinterpreted signage, no logos or text appearing on the buildings or
flags, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, no sign tipping
over, sliding, or falling at any point, no full-body freeze at any point,
no holding completely still for more than half a second anywhere in the
clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST
SECOND, NO SIGN MOVEMENT AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly
explaining an important date — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep6-videos/bull_ep6_s4_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 보드가 넘어지거나 미끄러지지 않는지 특히 확인
3. 문제 없으면 다음 씬 진행

---

## s5 — situation2 (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the corporate plaza background
exactly as shown in the reference image. Do not change any colors, text,
or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with large text
"9/28까지" on the top line and "매수" in red on the bottom line, completely
rigid in both hands at chest height for the entire clip, from frame 1 to
the very last frame with NO exception. The card must remain PERFECTLY
STILL AND IN SHARP FOCUS at every frame, including the final 1-2 seconds.
The card never disappears, is never dropped, is never released, and the
hands never open outward away from the card at any point. The card does
not tilt, rotate, rise, lower, or drift at any point. Treat the card as a
frozen, perfectly sharp photograph layered in front of the character,
permanently glued to the character's hands for the entire 8-second
duration.

MOTION DETAIL: the character's expression is serious and urgent, as if
stressing an important deadline to the viewer.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion must
come ONLY from the head, eyes, and mouth — the hands holding the card must
remain completely still and attached for the full clip. No portion of the
clip should hold a single frozen pose for more than half a second, but
never by releasing, dropping, or blurring the card.

STATIC ELEMENTS: the glass office towers, plaza planters, trees,
flagpoles, and stone floor must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement, no card
disappearance. No text, logos, or marks appear anywhere on the towers,
flags, or plaza.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("9/28까지", "매수") as a locked, non-regenerating, permanently sharp image
layer for the full 8 seconds, including the very last frame. Render it
exactly as pixels copied from the reference image, unchanged and in crisp
focus frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, shaking, vibrating, double-exposed,
or misspelled text anywhere in the frame at any point, no regenerated or
reinterpreted signage, no logos or text appearing on the buildings or
flags, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, NO CARD
MOVEMENT, NO CARD SHAKE OR BLUR AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD DISAPPEARING OR BEING DROPPED AT ANY POINT, NO HANDS OPENING OUTWARD
OR RELEASING THE CARD, NO EMPTY-HANDED POSE AT ANY POINT, no full-body
freeze at any point, no holding completely still for more than half a
second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT
INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT INCLUDING
THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if urgently
stressing a deadline — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds. The card
stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep6-videos/bull_ep6_s5_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s6 — situation3 (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the corporate plaza background
exactly as shown in the reference image. Do not change any colors, text,
or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with large text
"9/29" on the top line and "배당락일" in red on the bottom line, completely
rigid in one hand at chest height for the entire clip, from frame 1 to the
very last frame with NO exception. The card must remain PERFECTLY STILL AND
IN SHARP FOCUS at every frame, including the final 1-2 seconds. The card
never disappears, is never dropped, is never released, and the hand never
opens outward away from the card at any point. The card does not tilt,
rotate, rise, lower, or drift at any point. The other hand's index finger
is raised in a steady explanatory gesture, held at a fixed angle without
waving. Treat the card as a frozen, perfectly sharp photograph layered in
front of the character, permanently glued to the character's hand for the
entire 8-second duration.

MOTION DETAIL: the character's expression is clear and instructive, as if
calmly explaining a technical detail to the viewer.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. This motion must
come ONLY from the head, eyes, and mouth — the hand holding the card must
remain completely still and attached for the full clip. No portion of the
clip should hold a single frozen pose for more than half a second, but
never by releasing, dropping, or blurring the card.

STATIC ELEMENTS: the glass office towers, plaza planters, trees,
flagpoles, and stone floor must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement, no card
disappearance. No text, logos, or marks appear anywhere on the towers,
flags, or plaza.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("9/29",
"배당락일") as a locked, non-regenerating, permanently sharp image layer
for the full 8 seconds, including the very last frame. Render it exactly
as pixels copied from the reference image, unchanged and in crisp focus
frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, shaking, vibrating, double-exposed,
or misspelled text anywhere in the frame at any point, no regenerated or
reinterpreted signage, no logos or text appearing on the buildings or
flags, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, no waving or
repeated finger motion, NO CARD MOVEMENT, NO CARD SHAKE OR BLUR AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD DISAPPEARING OR BEING DROPPED AT
ANY POINT, NO HAND OPENING OUTWARD OR RELEASING THE CARD, NO EMPTY-HANDED
POSE AT ANY POINT, no full-body freeze at any point, no holding completely
still for more than half a second anywhere in the clip, NO CAMERA ZOOM OR
FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD TILT OR
ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly
explaining a technical rule — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds. The card
stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep6-videos/bull_ep6_s6_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s10 — reason2_source (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the corporate plaza background
exactly as shown in the reference image. Do not change any colors, text,
or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "AI
메모리 호황" on the top line and "현금 증가" in red on the bottom line with
a rightward arrow between them, completely rigid in both hands at chest
height for the entire clip, from frame 1 to the very last frame with NO
exception. The card must remain PERFECTLY STILL AND IN SHARP FOCUS at
every frame, including the final 1-2 seconds. The card never disappears,
is never dropped, is never released, and the hands never open outward away
from the card at any point. The card does not tilt, rotate, rise, lower,
or drift at any point. Treat the card as a frozen, perfectly sharp
photograph layered in front of the character, permanently glued to the
character's hands for the entire 8-second duration.

MOTION DETAIL: the character's expression is clear and instructive, as if
explaining a cause-and-effect relationship to the viewer.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion must
come ONLY from the head, eyes, and mouth — the hands holding the card must
remain completely still and attached for the full clip. No portion of the
clip should hold a single frozen pose for more than half a second, but
never by releasing, dropping, or blurring the card.

STATIC ELEMENTS: the glass office towers, plaza planters, trees,
flagpoles, and stone floor must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement, no card
disappearance. No text, logos, or marks appear anywhere on the towers,
flags, or plaza.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("AI
메모리 호황", "현금 증가") as a locked, non-regenerating, permanently sharp
image layer for the full 8 seconds, including the very last frame. Render
it exactly as pixels copied from the reference image, unchanged and in
crisp focus frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, shaking, vibrating, double-exposed,
or misspelled text anywhere in the frame at any point, no regenerated or
reinterpreted signage, no logos or text appearing on the buildings or
flags, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, NO CARD
MOVEMENT, NO CARD SHAKE OR BLUR AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD DISAPPEARING OR BEING DROPPED AT ANY POINT, NO HANDS OPENING OUTWARD
OR RELEASING THE CARD, NO EMPTY-HANDED POSE AT ANY POINT, no full-body
freeze at any point, no holding completely still for more than half a
second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT
INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT INCLUDING
THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly
explaining where the money came from — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds. The
card stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep6-videos/bull_ep6_s10_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s11 — reason2_numbers (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the corporate plaza background
exactly as shown in the reference image. Do not change any colors, text,
or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "HBM4"
above "매출" on the top two lines and "3배↑" in red on the bottom line,
completely rigid in one hand at chest height for the entire clip, from
frame 1 to the very last frame with NO exception. The card must remain
PERFECTLY STILL AND IN SHARP FOCUS at every frame, including the final 1-2
seconds. The card never disappears, is never dropped, is never released,
and the hand never opens outward away from the card at any point. The card
does not tilt, rotate, rise, lower, or drift at any point. The other
hand's index finger is raised in a steady emphasizing gesture, held at a
fixed angle without waving. Treat the card as a frozen, perfectly sharp
photograph layered in front of the character, permanently glued to the
character's hand for the entire 8-second duration.

MOTION DETAIL: the character's expression is confident and assured, as if
presenting a striking growth statistic.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. This motion must
come ONLY from the head, eyes, and mouth — the hand holding the card must
remain completely still and attached for the full clip. No portion of the
clip should hold a single frozen pose for more than half a second, but
never by releasing, dropping, or blurring the card.

STATIC ELEMENTS: the glass office towers, plaza planters, trees,
flagpoles, and stone floor must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement, no card
disappearance. No text, logos, or marks appear anywhere on the towers,
flags, or plaza.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("HBM4",
"매출", "3배↑") as a locked, non-regenerating, permanently sharp image
layer for the full 8 seconds, including the very last frame. Render it
exactly as pixels copied from the reference image, unchanged and in crisp
focus frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, shaking, vibrating, double-exposed,
or misspelled text anywhere in the frame at any point, no regenerated or
reinterpreted signage, no logos or text appearing on the buildings or
flags, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, no waving or
repeated finger motion, NO CARD MOVEMENT, NO CARD SHAKE OR BLUR AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD DISAPPEARING OR BEING DROPPED AT
ANY POINT, NO HAND OPENING OUTWARD OR RELEASING THE CARD, NO EMPTY-HANDED
POSE AT ANY POINT, no full-body freeze at any point, no holding completely
still for more than half a second anywhere in the clip, NO CAMERA ZOOM OR
FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD TILT OR
ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
confidently presenting a growth statistic — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds. The card stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep6-videos/bull_ep6_s11_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s12 — reason2_meaning (8초, 카드 감싸쥠 유지 + 강조)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the corporate plaza background
exactly as shown in the reference image. Do not change any colors, text,
or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds the same card reading
"HBM4" above "매출" and "3배↑" from the previous scene, completely rigid in
one hand at chest height for the entire clip, from frame 1 to the very
last frame with NO exception. The card must remain PERFECTLY STILL AND IN
SHARP FOCUS at every frame, including the final 1-2 seconds. The card never
disappears, is never dropped, is never released, and the hand never opens
outward away from the card at any point. The card does not tilt, rotate,
rise, lower, or drift at any point. Treat the card as a frozen, perfectly
sharp photograph layered in front of the character, permanently glued to
the character's hand for the entire 8-second duration.

MOTION DETAIL: the character's other empty hand gently taps the card twice
at a fixed spot (not sliding or dragging across it) while nodding
confidently, as if driving the point home.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head nods, continuous mouth movement while speaking. This motion must come
ONLY from the head, eyes, mouth, and the light tapping of the empty hand —
the hand holding the card must remain completely still and attached for
the full clip. No portion of the clip should hold a single frozen pose for
more than half a second, but never by releasing, dropping, or blurring the
card.

STATIC ELEMENTS: the glass office towers, plaza planters, trees,
flagpoles, and stone floor must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement, no card
disappearance. No text, logos, or marks appear anywhere on the towers,
flags, or plaza.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("HBM4",
"매출", "3배↑") as a locked, non-regenerating, permanently sharp image
layer for the full 8 seconds, including the very last frame. Render it
exactly as pixels copied from the reference image, unchanged and in crisp
focus frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, shaking, vibrating, double-exposed,
or misspelled text anywhere in the frame at any point, no regenerated or
reinterpreted signage, no logos or text appearing on the buildings or
flags, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, no sliding or
dragging tap motion, NO CARD MOVEMENT, NO CARD SHAKE OR BLUR AT ANY POINT
INCLUDING THE LAST SECOND, NO CARD DISAPPEARING OR BEING DROPPED AT ANY
POINT, NO HAND OPENING OUTWARD OR RELEASING THE CARD, NO EMPTY-HANDED POSE
ON THE CARD-HOLDING SIDE AT ANY POINT, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
confidently confirming the conclusion — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds. The
card stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep6-videos/bull_ep6_s12_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s14 — balance1 (8초, 카드 감싸쥠, 진지한 톤)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the corporate plaza background
exactly as shown in the reference image. Do not change any colors, text,
or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "배당락"
on the top line and "이론상 주가 조정" on the bottom line with a rightward
arrow between them, completely rigid in both hands at chest height for the
entire clip, from frame 1 to the very last frame with NO exception. The
card must remain PERFECTLY STILL AND IN SHARP FOCUS at every frame,
including the final 1-2 seconds. The card never disappears, is never
dropped, is never released, and the hands never open outward away from the
card at any point. The card does not tilt, rotate, rise, lower, or drift
at any point. Treat the card as a frozen, perfectly sharp photograph
layered in front of the character, permanently glued to the character's
hands for the entire 8-second duration.

MOTION DETAIL: the character's expression is cautious and serious —
slightly furrowed brow, no bright smile — as if warning the viewer to be
careful.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. This motion must
come ONLY from the head, eyes, and mouth — the hands holding the card must
remain completely still and attached for the full clip. No portion of the
clip should hold a single frozen pose for more than half a second, but
never by releasing, dropping, or blurring the card.

STATIC ELEMENTS: the glass office towers, plaza planters, trees,
flagpoles, and stone floor must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement, no card
disappearance. No text, logos, or marks appear anywhere on the towers,
flags, or plaza.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("배당락", "이론상 주가 조정") as a locked, non-regenerating, permanently
sharp image layer for the full 8 seconds, including the very last frame.
Render it exactly as pixels copied from the reference image, unchanged and
in crisp focus frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, shaking, vibrating, double-exposed,
or misspelled text anywhere in the frame at any point, no regenerated or
reinterpreted signage, no logos or text appearing on the buildings or
flags, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, NO CARD
MOVEMENT, NO CARD SHAKE OR BLUR AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD DISAPPEARING OR BEING DROPPED AT ANY POINT, NO HANDS OPENING OUTWARD
OR RELEASING THE CARD, NO EMPTY-HANDED POSE AT ANY POINT, no full-body
freeze at any point, no holding completely still for more than half a
second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT
INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT INCLUDING
THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if seriously
cautioning the viewer — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds. The card
stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep6-videos/bull_ep6_s14_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s15 — balance2 (8초, 카드 감싸쥠, 차분한 톤)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the corporate plaza background
exactly as shown in the reference image. Do not change any colors, text,
or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "최종
확정은" on the top line and "10월 말" in red on the bottom line, completely
rigid in one hand at chest height for the entire clip, from frame 1 to the
very last frame with NO exception. The card must remain PERFECTLY STILL AND
IN SHARP FOCUS at every frame, including the final 1-2 seconds. The card
never disappears, is never dropped, is never released, and the hand never
opens outward away from the card at any point. The card does not tilt,
rotate, rise, lower, or drift at any point. Treat the card as a frozen,
perfectly sharp photograph layered in front of the character, permanently
glued to the character's hand for the entire 8-second duration.

MOTION DETAIL: the character's expression is calm and measured, no bright
smile, the other hand resting on its hip, as if giving a careful factual
caveat.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. This motion must
come ONLY from the head, eyes, and mouth — the hand holding the card must
remain completely still and attached for the full clip. No portion of the
clip should hold a single frozen pose for more than half a second, but
never by releasing, dropping, or blurring the card.

STATIC ELEMENTS: the glass office towers, plaza planters, trees,
flagpoles, and stone floor must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement, no card
disappearance. No text, logos, or marks appear anywhere on the towers,
flags, or plaza.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("최종
확정은", "10월 말") as a locked, non-regenerating, permanently sharp image
layer for the full 8 seconds, including the very last frame. Render it
exactly as pixels copied from the reference image, unchanged and in crisp
focus frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, shaking, vibrating, double-exposed,
or misspelled text anywhere in the frame at any point, no regenerated or
reinterpreted signage, no logos or text appearing on the buildings or
flags, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, NO CARD
MOVEMENT, NO CARD SHAKE OR BLUR AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD DISAPPEARING OR BEING DROPPED AT ANY POINT, NO HAND OPENING OUTWARD OR
RELEASING THE CARD, NO EMPTY-HANDED POSE AT ANY POINT, no full-body freeze
at any point, no holding completely still for more than half a second
anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT
INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT INCLUDING
THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if calmly
giving a factual caveat — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds. The card
stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep6-videos/bull_ep6_s15_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s16 — summary (8초, 카드 감싸쥠, 확신에 찬 톤)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the corporate plaza background
exactly as shown in the reference image. Do not change any colors, text,
or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "오늘 ="
on the top line and "마지막 매수 기회" in red on the bottom line,
completely rigid in both hands at chest height for the entire clip, from
frame 1 to the very last frame with NO exception. The card must remain
PERFECTLY STILL AND IN SHARP FOCUS at every frame, including the final 1-2
seconds. The card never disappears, is never dropped, is never released,
and the hands never open outward away from the card at any point. The card
does not tilt, rotate, rise, lower, or drift at any point. Treat the card
as a frozen, perfectly sharp photograph layered in front of the character,
permanently glued to the character's hands for the entire 8-second
duration.

MOTION DETAIL: the character's expression is confident and assured, as if
delivering a clear, decisive conclusion.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion must
come ONLY from the head, eyes, and mouth — the hands holding the card must
remain completely still and attached for the full clip. No portion of the
clip should hold a single frozen pose for more than half a second, but
never by releasing, dropping, or blurring the card.

STATIC ELEMENTS: the glass office towers, plaza planters, trees,
flagpoles, and stone floor must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement, no card
disappearance. No text, logos, or marks appear anywhere on the towers,
flags, or plaza.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("오늘
=", "마지막 매수 기회") as a locked, non-regenerating, permanently sharp
image layer for the full 8 seconds, including the very last frame. Render
it exactly as pixels copied from the reference image, unchanged and in
crisp focus frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, shaking, vibrating, double-exposed,
or misspelled text anywhere in the frame at any point, no regenerated or
reinterpreted signage, no logos or text appearing on the buildings or
flags, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, NO CARD
MOVEMENT, NO CARD SHAKE OR BLUR AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD DISAPPEARING OR BEING DROPPED AT ANY POINT, NO HANDS OPENING OUTWARD
OR RELEASING THE CARD, NO EMPTY-HANDED POSE AT ANY POINT, no full-body
freeze at any point, no holding completely still for more than half a
second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT
INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT INCLUDING
THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
confidently delivering a decisive conclusion — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds. The card stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep6-videos/bull_ep6_s16_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s17 — checklist (8초, 카드 감싸쥠 + 브이 사인)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the corporate plaza background
exactly as shown in the reference image. Do not change any colors, text,
or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
text — "체크 ❶ 오늘 장 마감 전 매수" on the top line and "❷ 10월 말 확정
배당금" on the bottom line, completely rigid in one hand at chest height
for the entire clip, from frame 1 to the very last frame with NO
exception. The card must remain PERFECTLY STILL AND IN SHARP FOCUS at every
frame, including the final 1-2 seconds. The card never disappears, is
never dropped, is never released, and the hand never opens outward away
from the card at any point. The card does not tilt, rotate, rise, lower,
or drift at any point. The other hand is raised in a steady "peace sign" /
two-finger gesture, held at a fixed angle without waving. Treat the card
as a frozen, perfectly sharp photograph layered in front of the character,
permanently glued to the character's hand for the entire 8-second
duration.

MOTION DETAIL: the character's expression is confident and instructive,
summarizing the two things to check.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. This motion must
come ONLY from the head, eyes, and mouth — the hand holding the card must
remain completely still and attached for the full clip. No portion of the
clip should hold a single frozen pose for more than half a second, but
never by releasing, dropping, or blurring the card.

STATIC ELEMENTS: the glass office towers, plaza planters, trees,
flagpoles, and stone floor must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement, no card
disappearance. No text, logos, or marks appear anywhere on the towers,
flags, or plaza.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("체크
❶ 오늘 장 마감 전 매수", "❷ 10월 말 확정 배당금") as a locked,
non-regenerating, permanently sharp image layer for the full 8 seconds,
including the very last frame. Render it exactly as pixels copied from the
reference image, unchanged and in crisp focus frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, shaking, vibrating, double-exposed,
or misspelled text anywhere in the frame at any point, no regenerated or
reinterpreted signage, no logos or text appearing on the buildings or
flags, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, no waving or
repeated finger motion, NO CARD MOVEMENT, NO CARD SHAKE OR BLUR AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD DISAPPEARING OR BEING DROPPED AT
ANY POINT, NO HAND OPENING OUTWARD OR RELEASING THE CARD, NO EMPTY-HANDED
POSE AT ANY POINT, no full-body freeze at any point, no holding completely
still for more than half a second anywhere in the clip, NO CAMERA ZOOM OR
FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD TILT OR
ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly
summarizing a two-item checklist — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds. The
card stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep6-videos/bull_ep6_s17_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

================================================================================
# 🟨 10초 티어 (s7, s8, s9, s13, s18)
================================================================================

---

## s7 — core_q_answer (10초, 카드 감싸쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the corporate plaza background
exactly as shown in the reference image. Do not change any colors, text,
or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "정규배당"
on the top line and a plus sign followed by "특별배당" in red on the bottom
line, completely rigid in one hand at chest height for the entire clip,
from frame 1 to the very last frame with NO exception. The card must
remain PERFECTLY STILL AND IN SHARP FOCUS at every frame, including the
final 1-2 seconds. The card never disappears, is never dropped, is never
released, and the hand never opens outward away from the card at any
point. The card does not tilt, rotate, rise, lower, or drift at any point.
The other hand's index finger is raised in a steady confident gesture,
held at a fixed angle without waving. Treat the card as a frozen,
perfectly sharp photograph layered in front of the character, permanently
glued to the character's hand for the entire 10-second duration.

MOTION DETAIL: the character's expression is insightful and confident, as
if revealing the real answer to a puzzling question.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. This motion must
come ONLY from the head, eyes, and mouth — the hand holding the card must
remain completely still and attached for the full clip. No portion of the
clip should hold a single frozen pose for more than half a second, but
never by releasing, dropping, or blurring the card.

STATIC ELEMENTS: the glass office towers, plaza planters, trees,
flagpoles, and stone floor must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement, no card
disappearance. No text, logos, or marks appear anywhere on the towers,
flags, or plaza.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("정규배당", "특별배당") as a locked, non-regenerating, permanently sharp
image layer for the full 10 seconds, including the very last frame. Render
it exactly as pixels copied from the reference image, unchanged and in
crisp focus frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, shaking, vibrating, double-exposed,
or misspelled text anywhere in the frame at any point, no regenerated or
reinterpreted signage, no logos or text appearing on the buildings or
flags, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, no waving or
repeated finger motion, NO CARD MOVEMENT, NO CARD SHAKE OR BLUR AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD DISAPPEARING OR BEING DROPPED AT
ANY POINT, NO HAND OPENING OUTWARD OR RELEASING THE CARD, NO EMPTY-HANDED
POSE AT ANY POINT, no full-body freeze at any point, no holding completely
still for more than half a second anywhere in the clip, NO CAMERA ZOOM OR
FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD TILT OR
ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
confidently revealing the answer — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds. The
card stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep6-videos/bull_ep6_s7_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s8 — reason1_scale (10초, 카드 감싸쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the corporate plaza background
exactly as shown in the reference image. Do not change any colors, text,
or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "2.45조
원" on the top line and "30조 원" in red on the bottom line with a
rightward arrow between them, completely rigid in both hands at chest
height for the entire clip, from frame 1 to the very last frame with NO
exception. The card must remain PERFECTLY STILL AND IN SHARP FOCUS at
every frame, including the final 1-2 seconds. The card never disappears,
is never dropped, is never released, and the hands never open outward away
from the card at any point. The card does not tilt, rotate, rise, lower,
or drift at any point. Treat the card as a frozen, perfectly sharp
photograph layered in front of the character, permanently glued to the
character's hands for the entire 10-second duration.

MOTION DETAIL: the character's expression is surprised and impressed, as
if presenting a dramatic jump in numbers.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion must
come ONLY from the head, eyes, and mouth — the hands holding the card must
remain completely still and attached for the full clip. No portion of the
clip should hold a single frozen pose for more than half a second, but
never by releasing, dropping, or blurring the card.

STATIC ELEMENTS: the glass office towers, plaza planters, trees,
flagpoles, and stone floor must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement, no card
disappearance. No text, logos, or marks appear anywhere on the towers,
flags, or plaza.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("2.45조 원", "30조 원") as a locked, non-regenerating, permanently sharp
image layer for the full 10 seconds, including the very last frame. Render
it exactly as pixels copied from the reference image, unchanged and in
crisp focus frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, shaking, vibrating, double-exposed,
or misspelled text anywhere in the frame at any point, no regenerated or
reinterpreted signage, no logos or text appearing on the buildings or
flags, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, NO CARD
MOVEMENT, NO CARD SHAKE OR BLUR AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD DISAPPEARING OR BEING DROPPED AT ANY POINT, NO HANDS OPENING OUTWARD
OR RELEASING THE CARD, NO EMPTY-HANDED POSE AT ANY POINT, no full-body
freeze at any point, no holding completely still for more than half a
second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT
INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT INCLUDING
THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
excitedly presenting a dramatic jump in scale — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds. The card stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep6-videos/bull_ep6_s8_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s9 — reason1_background (10초, 바닥 거치 보드)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the corporate plaza background
exactly as shown in the reference image. Do not change any colors, text,
or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): a floor-standing sandwich-board sign reading
"주주환원" on the top line and "90~110조 원" in red on the bottom line
remains completely rigid, standing upright on the floor beside the
character for the entire clip — the sign does not tip over, rotate, slide,
or fall at any point, including the final 1-2 seconds. The sign's text
must remain PERFECTLY SHARP at every frame — it must never shake, blur, or
double-expose. Treat the sign as a frozen, perfectly sharp photograph
layered beside the character, fixed to the floor.

MOTION DETAIL: the character's empty hand (holding no prop) points toward
the sign with an explanatory, informative expression; the other hand rests
on its hip. Only the pointing arm moves — the sign itself never shifts
position.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
tipping, sliding, or regenerating the sign.

STATIC ELEMENTS: the glass office towers, plaza planters, trees,
flagpoles, stone floor, and the sandwich-board sign (including its full
text and floor position) must stay completely fixed — no camera pan or
zoom, no background object movement, no sign movement or tipping. No text,
logos, or marks appear anywhere on the towers, flags, or plaza.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the sign text
("주주환원", "90~110조 원") as a locked, non-regenerating, permanently
sharp image layer for the full 10 seconds, including the very last frame.
Render it exactly as pixels copied from the reference image, unchanged and
in crisp focus frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, shaking, vibrating, double-exposed,
or misspelled text anywhere in the frame at any point, no regenerated or
reinterpreted signage, no logos or text appearing on the buildings or
flags, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, no sign tipping
over, sliding, or falling at any point, no full-body freeze at any point,
no holding completely still for more than half a second anywhere in the
clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST
SECOND, NO SIGN MOVEMENT AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly
explaining a broader policy background — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep6-videos/bull_ep6_s9_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 보드가 넘어지거나 미끄러지지 않는지 특히 확인
3. 문제 없으면 다음 씬 진행

---

## s13 — reason3_feel (10초, 카드 감싸쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the corporate plaza background
exactly as shown in the reference image. Do not change any colors, text,
or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "주당 약 4,500원" on the top line and "1000주 = 약 450만 원"
in red on the bottom line, completely rigid in both hands at chest height
for the entire clip, from frame 1 to the very last frame with NO
exception. The card must remain PERFECTLY STILL AND IN SHARP FOCUS at
every frame, including the final 1-2 seconds. The card never disappears,
is never dropped, is never released, and the hands never open outward away
from the card at any point. The card does not tilt, rotate, rise, lower,
or drift at any point. Treat the card as a frozen, perfectly sharp
photograph layered in front of the character, permanently glued to the
character's hands for the entire 10-second duration.

MOTION DETAIL: the character's expression is warm and pleased, as if
sharing good news about a tangible amount of money.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion must
come ONLY from the head, eyes, and mouth — the hands holding the card must
remain completely still and attached for the full clip. No portion of the
clip should hold a single frozen pose for more than half a second, but
never by releasing, dropping, or blurring the card.

STATIC ELEMENTS: the glass office towers, plaza planters, trees,
flagpoles, and stone floor must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement, no card
disappearance. No text, logos, or marks appear anywhere on the towers,
flags, or plaza.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("주당
약 4,500원", "1000주 = 약 450만 원") as a locked, non-regenerating,
permanently sharp image layer for the full 10 seconds, including the very
last frame. Render it exactly as pixels copied from the reference image,
unchanged and in crisp focus frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, shaking, vibrating, double-exposed,
or misspelled text anywhere in the frame at any point, no regenerated or
reinterpreted signage, no logos or text appearing on the buildings or
flags, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, NO CARD
MOVEMENT, NO CARD SHAKE OR BLUR AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD DISAPPEARING OR BEING DROPPED AT ANY POINT, NO HANDS OPENING OUTWARD
OR RELEASING THE CARD, NO EMPTY-HANDED POSE AT ANY POINT, no full-body
freeze at any point, no holding completely still for more than half a
second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT
INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT INCLUDING
THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
sharing tangible good news — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds. The card
stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep6-videos/bull_ep6_s13_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s18 — remind_next_comment / closing (10초, 소품 없음, 마지막 씬)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the corporate plaza background
exactly as shown in the reference image. Do not change any colors, text,
or object positions.

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

STATIC ELEMENTS: the glass office towers, plaza planters, trees,
flagpoles, and stone floor must stay completely fixed — no camera pan or
zoom, no background object movement. No text, logos, or marks appear
anywhere on the towers, flags, or plaza. No props in this scene.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, or flickering surfaces anywhere in
the frame, no logos or text appearing on the buildings or flags, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, NO FULL-BODY FREEZE AT ANY
POINT, no holding completely still for more than half a second anywhere in
the clip, no rigid locked pose for the second half of the clip, NO CAMERA
ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
wrapping up today's story and inviting comments — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep6-videos/bull_ep6_s18_motion.mp4`로 저장
2. 시작·중반(4~5초)·끝(9~10초) 프레임 전부 확인 — 마지막 씬이므로 후반부 정지 여부 특히 꼼꼼히 확인
3. 18개 씬 전부 완료 후 본편 조립(`run-owl-assemble-shorts-v2.mjs`,
   `--spec-module ./_bull-ep6-assembly-spec.mjs --spec-export
   BULL_EP6_ASSEMBLY_SPEC`, `--clip-dir C:/tmp/bull-ep6-videos`) → 고정
   CTA 연결(`run-owl-episode-with-fixed-cta-once.mjs`, 황소특보 고정 CTA
   `C:\tmp\bull-cta-fixed-v5\bull_cta_fixed_final_with_captions.mp4`) 진행
