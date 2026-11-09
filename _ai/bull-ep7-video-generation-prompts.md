# 황소특보 7편(국내 바이오사 신약 FDA 승인 상한가) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/bull-ep7-images/`
영상 저장 폴더(신규 생성): `C:/tmp/bull-ep7-videos/`

**씬 길이 티어는 8초/10초 2단계로만 요청한다(9초 티어 금지, 2026-09-23 확정,
[[feedback_video_scene_length_tier_smooth_transition]]).** 발화 8초 미만이고
여유 1초 이상이면 8초, 그 외(8초 이상이거나 여유 1초 미만)는 10초. 항상 발화
보다 여유 있게 받아서 조립 때 "자르기"만 하고 tpad "늘리기"는 피한다.

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 실측 발화(raw) | 요청 티어 | 예상 여유 |
|---|---|---|---|---|---|
| s1 hook | `bull_ep7_s1.png` | `bull_ep7_s1_motion.mp4` | 5.53초 | **8초** | 2.47초 |
| s2 hook_stakes | `bull_ep7_s2.png` | `bull_ep7_s2_motion.mp4` | 6.28초 | **8초** | 1.72초 |
| s3 opening | `bull_ep7_s3.png` | `bull_ep7_s3_motion.mp4` | 5.22초 | **8초** | 2.78초 |
| s4 situation1 | `bull_ep7_s4.png` | `bull_ep7_s4_motion.mp4` | 7.21초 | **10초** | 2.79초 |
| s5 situation2 | `bull_ep7_s5.png` | `bull_ep7_s5_motion.mp4` | 6.15초 | **8초** | 1.85초 |
| s6 situation3 | `bull_ep7_s6.png` | `bull_ep7_s6_motion.mp4` | 7.21초 | **10초** | 2.79초 |
| s7 core_q_answer(twist) | `bull_ep7_s7.png` | `bull_ep7_s7_motion.mp4` | 8.25초 | **10초** | 1.75초 |
| s8 reason1_approval | `bull_ep7_s8.png` | `bull_ep7_s8_motion.mp4` | 7.55초 | **10초** | 2.45초 |
| s9 reason1_scale | `bull_ep7_s9.png` | `bull_ep7_s9_motion.mp4` | 8.02초 | **10초** | 1.98초 |
| s10 reason2_history | `bull_ep7_s10.png` | `bull_ep7_s10_motion.mp4` | 8.91초 | **10초** | 1.09초 |
| s11 reason2_meaning | `bull_ep7_s11.png` | `bull_ep7_s11_motion.mp4` | 5.46초 | **8초** | 2.54초 |
| s12 balance_not_advice | `bull_ep7_s12.png` | `bull_ep7_s12_motion.mp4` | 7.47초 | **10초** | 2.53초 |
| s13 summary | `bull_ep7_s13.png` | `bull_ep7_s13_motion.mp4` | 6.36초 | **8초** | 1.64초 |
| s14 checklist | `bull_ep7_s14.png` | `bull_ep7_s14_motion.mp4` | 7.72초 | **10초** | 2.28초 |
| s15 remind | `bull_ep7_s15.png` | `bull_ep7_s15_motion.mp4` | 6.45초 | **8초** | 1.55초 |
| s16 comment_cta(closing) | `bull_ep7_s16.png` | `bull_ep7_s16_motion.mp4` | 4.00초 | **8초** | 4.00초 |

★ 영상 생성 절대규칙(87씬 전수조사 확정, `_ai/CURRENT_STANDARDS.md` §0) 전부 반영:
- 소품을 든 손은 **한 지점 고정**("holds steadily at", 이동·반복 왕복 지시 금지)
- **동작은 소품을 안 든 빈 쪽에만** 배정
- 소품·보드는 전부 "frozen photograph layered in front of/beside the character"로 명시
- 텍스트는 CRITICAL TEXT PRESERVATION(HIGHEST PRIORITY) 블록으로 고정
- 나레이션이 있는 영상이므로 "Silent" 문구는 절대 넣지 않는다
- 소품 고정 지시는 "holds steadily at [위치] ... does not move/tilt/rotate/drift"로만
  쓴다. "permanently glued to the character's hands" 같은 신체 접착 표현은 **절대
  쓰지 않는다** — Gemini에서 이 표현 때문에 프롬프트 제출 직후 정책 위반으로
  즉시 거부되는 사고가 있었다(금박사 11편, [[feedback_gemini_prompt_wording_refusal_2026_09_28]]).
- 바닥 거치 소품(s9·s12 이젤 보드)은 "넘어지지 않는다"는 문구를 STATIC
  ELEMENTS와 NEGATIVE PROMPT에 추가로 명시

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작 프레임뿐 아니라
클립 중반·후반 프레임에서도 텍스트·소품·동작 지속 여부, 카메라 줌/크롭,
소품 기울어짐을 확인한다.

================================================================================
# 🟦 8초 티어 (s1, s2, s3, s5, s11, s13, s15, s16)
================================================================================

---

## s1 — hook (8초, 카드 감싸쥠)

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
"?" question mark in one hand at chest height. The card holds steadily at
this position for the entire clip, from frame 1 to the very last frame, and
does not move, tilt, rotate, or drift at any point. The other hand rests on
its hip. Treat the card as a frozen photograph layered in front of the
character.

MOTION DETAIL: the character's expression is curious and intrigued, wide
eyes, mouth slightly open, as if posing an intriguing question to the
viewer.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. This motion comes
from the face and body only — the hand holding the card stays steady and
in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the "?" symbol on the
card as a locked, non-regenerating image layer for the full 8 seconds,
including the very last frame. Render it exactly as pixels copied from the
reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, or flickering surfaces anywhere in
the frame, no regenerated or reinterpreted signage, no background changes,
no character redesign, no abrupt cut or freeze mid-motion, no static
expression, no frozen pose while speaking, no card tilt or rotation at any
point, no camera zoom or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if curiously
posing a question to the viewer — never static, never frozen even in the
final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep7-videos/bull_ep7_s1_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s2 — hook_stakes (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — no zoom, no dolly, no framing drift at any
point, including the final 1-2 seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with large red
text reading "오늘 +29.95%" in both hands at chest height. The card holds
steadily at this position for the entire clip, from frame 1 to the very
last frame, and does not move, tilt, rotate, or drift at any point. Treat
the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is wide-eyed and surprised, as
if astonished by the number on the card.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion comes
from the face and body only — the hands holding the card stay steady and
in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("오늘
+29.95%") as a locked, non-regenerating image layer for the full 8 seconds,
including the very last frame. Render it exactly as pixels copied from the
reference image, unchanged frame to frame, still fully visible and held at
the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card
tilt or rotation at any point, no camera zoom or framing drift at any
point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
excitedly announcing surprising news — never static, never frozen even in
the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep7-videos/bull_ep7_s2_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s3 — opening (8초, 소품 없음)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — no zoom, no dolly, no framing drift at any
point, including the final 1-2 seconds.

MOTION DETAIL: the character raises one hand and points upward with a
confident, friendly gesture while the other hand rests on its hip, smiling
brightly and warmly at the viewer. No props held.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat any background signage
as locked, non-regenerating image layers for the full 8 seconds. Render
these exactly as pixels copied from the reference image, unchanged frame to
frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, or flickering surfaces anywhere in
the frame, no regenerated or reinterpreted signage, no background changes,
no character redesign, no abrupt cut or freeze mid-motion, no static
expression, no frozen pose while speaking, no full-body freeze at any
point, no camera zoom or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
introducing itself to the viewer — never static, never frozen even in the
final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep7-videos/bull_ep7_s3_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s5 — situation2 (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — no zoom, no dolly, no framing drift at any
point, including the final 1-2 seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with large black
text reading "국내 최초 사례" in both hands at chest height. The card holds
steadily at this position for the entire clip, from frame 1 to the very
last frame, and does not move, tilt, rotate, or drift at any point. Treat
the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is confident and proud, as if
highlighting a historic achievement.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion comes
from the face and body only — the hands holding the card stay steady and
in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("국내
최초 사례") as a locked, non-regenerating image layer for the full 8
seconds, including the very last frame. Render it exactly as pixels copied
from the reference image, unchanged frame to frame, still fully visible
and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card
tilt or rotation at any point, no camera zoom or framing drift at any
point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if proudly
explaining a historic first — never static, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep7-videos/bull_ep7_s5_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s11 — reason2_meaning (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — no zoom, no dolly, no framing drift at any
point, including the final 1-2 seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "7월 →
하한가" with a red downward arrow chart in one hand at chest height. The
card holds steadily at this position for the entire clip, from frame 1 to
the very last frame, and does not move, tilt, rotate, or drift at any
point. Treat the card as a frozen photograph layered in front of the
character.

MOTION DETAIL: the character's expression is serious and thoughtful, as if
nodding while explaining the meaning of this history.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head nods, continuous mouth movement while speaking. This motion comes
from the face and body only — the hand holding the card stays steady and
in place for the full clip; the other empty hand may gently tap near the
card without touching or moving it.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("7월 →
하한가") and the arrow chart as locked, non-regenerating image layers for
the full 8 seconds, including the very last frame. Render these exactly as
pixels copied from the reference image, unchanged frame to frame, still
fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card
tilt or rotation at any point, no camera zoom or framing drift at any
point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if seriously
explaining what this history means — never static, never frozen even in
the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep7-videos/bull_ep7_s11_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s13 — summary (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — no zoom, no dolly, no framing drift at any
point, including the final 1-2 seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "FDA 승인 = 상한가," on the top line and "그만큼 변동성도" on
the bottom line, with a small rising stock chart icon — in both hands at
chest height. The card holds steadily at this position for the entire
clip, from frame 1 to the very last frame, and does not move, tilt,
rotate, or drift at any point. Treat the card as a frozen photograph
layered in front of the character.

MOTION DETAIL: the character's expression is confident and assured, as if
proudly summarizing the key takeaway.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion comes
from the face and body only — the hands holding the card stay steady and
in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("FDA
승인 = 상한가,", "그만큼 변동성도") as locked, non-regenerating image
layers for the full 8 seconds, including the very last frame. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card
tilt or rotation at any point, no camera zoom or framing drift at any
point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
confidently summarizing the takeaway — never static, never frozen even in
the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep7-videos/bull_ep7_s13_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s15 — remind (8초, 소품 없음)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — no zoom, no dolly, no framing drift at any
point, including the final 1-2 seconds.

MOTION DETAIL: the character smiles confidently and gives a gentle wave
with one hand while the other hand rests naturally at its side, as if
warmly wrapping up. No props held.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, gentle
continuous waving motion, subtle body bounces, continuous mouth movement
while speaking. No portion of the clip, especially the back half, should
hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat any background signage
as locked, non-regenerating image layers for the full 8 seconds. Render
these exactly as pixels copied from the reference image, unchanged frame to
frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, or flickering surfaces anywhere in
the frame, no regenerated or reinterpreted signage, no background changes,
no character redesign, no abrupt cut or freeze mid-motion, no static
expression, no frozen pose while speaking, no full-body freeze at any
point, no camera zoom or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
promising to follow up — never static, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep7-videos/bull_ep7_s15_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s16 — comment_cta (8초, 소품 없음, 마지막 씬)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — no zoom, no dolly, no framing drift at any
point, including the final 1-2 seconds.

MOTION DETAIL: the character smiles brightly and gives a friendly wave
with one hand while the other hand rests naturally at its side, inviting
the viewer to leave a comment. No props held.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY, THIS IS THE FINAL
SCENE OF THE EPISODE — DO NOT LET IT GO STATIC): the character must show
visible, continuous motion for the ENTIRE 8 seconds, including the last
2-3 seconds — natural eye blinks at least every 2-3 seconds, gentle
continuous waving motion, subtle body bounces, continuous mouth movement
while speaking. No portion of the clip, especially the back half, should
hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat any background signage
as locked, non-regenerating image layers for the full 8 seconds. Render
these exactly as pixels copied from the reference image, unchanged frame to
frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, or flickering surfaces anywhere in
the frame, no regenerated or reinterpreted signage, no background changes,
no character redesign, no abrupt cut or freeze mid-motion, no static
expression, no frozen pose while speaking, no full-body freeze at any
point, no rigid locked pose for the second half of the clip, no camera
zoom or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
inviting the viewer to comment — never static, never frozen even in the
final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep7-videos/bull_ep7_s16_motion.mp4`로 저장
2. 시작·중반(4초)·끝(7~8초) 프레임 전부 확인 — 마지막 씬이므로 후반부 정지 여부 특히 꼼꼼히 확인
3. 8초 티어 씬 전부 완료 후 10초 티어 씬으로 진행

================================================================================
# 🟨 10초 티어 (s4, s6, s7, s8, s9, s10, s12, s14)
================================================================================

---

## s4 — situation1 (10초, 바닥 거치 보드)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — no zoom, no dolly, no framing drift at any
point, including the final 1-2 seconds.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board reading
"FDA 승인" with a red official approval stamp icon stands beside the
character on the floor. The board holds steadily in its exact position on
the floor for the entire clip, from frame 1 to the very last frame — it
never falls over, slides, tilts, rotates, or drifts at any point,
including the final 1-2 seconds. Treat the board as a frozen photograph
layered beside the character.

MOTION DETAIL: the character's free hand (not holding anything) points at
the board while explaining, with a calm and informative expression. The
character does not touch or move the board.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking, gentle pointing
gesture toward the board.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement, no board falling or
sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("FDA
승인") and the stamp icon as locked, non-regenerating image layers for the
full 10 seconds, including the very last frame. Render these exactly as
pixels copied from the reference image, unchanged frame to frame, still
fully visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO BOARD
FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board
tilt or rotation at any point, no camera zoom or framing drift at any
point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if calmly
explaining the situation — never static, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep7-videos/bull_ep7_s4_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 보드가 끝까지 쓰러지지 않고 서 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s6 — situation3 (10초, 카드 감싸쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — no zoom, no dolly, no framing drift at any
point, including the final 1-2 seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "계열
바이오주 동반 상한가" with a red rising arrow chart in one hand at chest
height. The card holds steadily at this position for the entire clip, from
frame 1 to the very last frame, and does not move, tilt, rotate, or drift
at any point. Treat the card as a frozen photograph layered in front of
the character.

MOTION DETAIL: the character's other empty hand gestures upward as if
tracing a rising trend, while maintaining an excited, energetic
expression. The hand holding the card does not move.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking, gentle upward
gesture from the free hand. The hand holding the card stays steady and in
place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("계열
바이오주 동반 상한가") and the arrow chart as locked, non-regenerating
image layers for the full 10 seconds, including the very last frame.
Render these exactly as pixels copied from the reference image, unchanged
frame to frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card
tilt or rotation at any point, no camera zoom or framing drift at any
point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
excitedly describing a spreading rally — never static, never frozen even
in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep7-videos/bull_ep7_s6_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s7 — core_q_answer / twist (10초, 카드 감싸쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — no zoom, no dolly, no framing drift at any
point, including the final 1-2 seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "신약
하나 = 회사 운명" with a small rising arrow icon in one hand at chest
height. The card holds steadily at this position for the entire clip, from
frame 1 to the very last frame, and does not move, tilt, rotate, or drift
at any point. Treat the card as a frozen photograph layered in front of
the character.

MOTION DETAIL: the character's other empty hand raises its index finger as
if making a confident point, transitioning from a questioning look to a
confident, assured expression as if answering its own question.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. The hand holding
the card stays steady and in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("신약
하나 = 회사 운명") as a locked, non-regenerating image layer for the full
10 seconds, including the very last frame. Render it exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card
tilt or rotation at any point, no camera zoom or framing drift at any
point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, transitioning
from an intriguing question to a confident answer — never static, never
frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep7-videos/bull_ep7_s7_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s8 — reason1_approval (10초, 카드 감싸쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — no zoom, no dolly, no framing drift at any
point, including the final 1-2 seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "4분기
미국 출시 예정" with a small US flag icon and a rising arrow in both hands
at chest height. The card holds steadily at this position for the entire
clip, from frame 1 to the very last frame, and does not move, tilt,
rotate, or drift at any point. Treat the card as a frozen photograph
layered in front of the character.

MOTION DETAIL: the character's expression is clear and informative, as if
methodically explaining the approval details.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion comes
from the face and body only — the hands holding the card stay steady and
in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("4분기
미국 출시 예정") and the flag icon as locked, non-regenerating image
layers for the full 10 seconds, including the very last frame. Render
these exactly as pixels copied from the reference image, unchanged frame
to frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card
tilt or rotation at any point, no camera zoom or framing drift at any
point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly
explaining the approval — never static, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep7-videos/bull_ep7_s8_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s9 — reason1_scale (10초, 바닥 거치 보드)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — no zoom, no dolly, no framing drift at any
point, including the final 1-2 seconds.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board reading
"대상 환자 제한적" with a magnifying-glass-over-people icon stands beside
the character on the floor. The board holds steadily in its exact position
on the floor for the entire clip, from frame 1 to the very last frame — it
never falls over, slides, tilts, rotates, or drifts at any point,
including the final 1-2 seconds. Treat the board as a frozen photograph
layered beside the character.

MOTION DETAIL: the character's free hand points at the board with a
thoughtful, cautious expression, as if carefully clarifying a limitation.
The character does not touch or move the board.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking, gentle pointing
gesture toward the board.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement, no board falling or
sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("대상
환자 제한적") and the icon as locked, non-regenerating image layers for
the full 10 seconds, including the very last frame. Render these exactly
as pixels copied from the reference image, unchanged frame to frame, still
fully visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO BOARD
FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board
tilt or rotation at any point, no camera zoom or framing drift at any
point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
thoughtfully explaining a limitation — never static, never frozen even in
the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep7-videos/bull_ep7_s9_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 보드가 끝까지 쓰러지지 않고 서 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s10 — reason2_history (10초, 카드 감싸쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — no zoom, no dolly, no framing drift at any
point, including the final 1-2 seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "7월 →
하한가" with a red downward arrow chart in one hand at chest height. The
card holds steadily at this position for the entire clip, from frame 1 to
the very last frame, and does not move, tilt, rotate, or drift at any
point. Treat the card as a frozen photograph layered in front of the
character.

MOTION DETAIL: the character's other empty hand gestures downward as if
tracing a falling trend, with a serious, cautionary expression.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking, gentle downward
gesture from the free hand. The hand holding the card stays steady and in
place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("7월 →
하한가") and the arrow chart as locked, non-regenerating image layers for
the full 10 seconds, including the very last frame. Render these exactly
as pixels copied from the reference image, unchanged frame to frame, still
fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card
tilt or rotation at any point, no camera zoom or framing drift at any
point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if seriously
warning about past volatility — never static, never frozen even in the
final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep7-videos/bull_ep7_s10_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s12 — balance_not_advice (10초, 카드 감싸쥠, ★매수추천 아님★)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — no zoom, no dolly, no framing drift at any
point, including the final 1-2 seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "매수
추천 아님" with a red prohibition circle-slash icon in both hands at chest
height. The card holds steadily at this position for the entire clip, from
frame 1 to the very last frame, and does not move, tilt, rotate, or drift
at any point. Treat the card as a frozen photograph layered in front of
the character.

MOTION DETAIL: the character's expression is firm and serious, calmly but
clearly emphasizing an important disclaimer, without exaggerated alarm.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion comes
from the face and body only — the hands holding the card stay steady and
in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("매수
추천 아님") and the prohibition icon as locked, non-regenerating image
layers for the full 10 seconds, including the very last frame. Render
these exactly as pixels copied from the reference image, unchanged frame
to frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card
tilt or rotation at any point, no camera zoom or framing drift at any
point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if firmly
and clearly stating an important disclaimer — never static, never frozen
even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep7-videos/bull_ep7_s12_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인. ★이 씬은 매수추천이 아님을 전달하는 핵심 씬이므로 카드 텍스트가 끝까지 선명한지 특히 꼼꼼히 확인★
3. 문제 없으면 다음 씬 진행

---

## s14 — checklist (10초, 카드 감싸쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — no zoom, no dolly, no framing drift at any
point, including the final 1-2 seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "체크 ① 상업화 진행상황" on the top line and "② 계열주
등락률" on the bottom line, each with a small red checkmark icon — in one
hand at chest height. The card holds steadily at this position for the
entire clip, from frame 1 to the very last frame, and does not move, tilt,
rotate, or drift at any point. Treat the card as a frozen photograph
layered in front of the character.

MOTION DETAIL: the character's other empty hand holds up two fingers in a
peace-sign gesture to emphasize "two things to check," with a bright,
helpful expression.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. The hand holding
the card stays steady and in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("체크
① 상업화 진행상황", "② 계열주 등락률") as locked, non-regenerating image
layers for the full 10 seconds, including the very last frame. Render
these exactly as pixels copied from the reference image, unchanged frame
to frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card
tilt or rotation at any point, no camera zoom or framing drift at any
point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if brightly
listing two things to check — never static, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep7-videos/bull_ep7_s14_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 16개 씬 전부 완료 후 본편 조립(`run-owl-assemble-shorts-v2.mjs`,
   `--spec-module ./_bull-ep7-assembly-spec.mjs --spec-export
   BULL_EP7_ASSEMBLY_SPEC`, `--clip-dir C:/tmp/bull-ep7-videos`,
   `--audio-summary C:/tmp/money-shorts-os/bull-ep7-tts/output-v2/elevenlabs-scene-paced-tts-summary.json`,
   `--tts-script C:/tmp/money-shorts-os/bull-ep7-tts/bull-ep7-tts-script.json`) →
   고정 CTA 연결(`run-owl-episode-with-fixed-cta-once.mjs --alignment
   C:/tmp/money-shorts-os/bull-ep7-tts/output-v2/elevenlabs-korean-director-*.alignment.json`,
   황소특보 고정 CTA `C:\tmp\bull-cta-fixed-v5\bull_cta_fixed_final_with_captions.mp4`)
   진행
