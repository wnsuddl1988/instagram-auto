# 황소특보 8편(삼성전자가 5% 빠진 날 태양광만 14% 뛴 이유, 16씬) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/bull-ep8-images/`
영상 저장 폴더(신규 생성): `C:/tmp/bull-ep8-videos/`

**씬 길이 티어는 8초/10초 2단계로만 요청한다(9초 티어 금지,
[[feedback_video_scene_length_tier_smooth_transition]]).** 발화 8초 미만이고
여유 1초 이상이면 8초, 그 외(8초 이상이거나 여유 1초 미만)는 10초. 항상 발화
보다 여유 있게 받아서 조립 때 "자르기"만 하고 tpad "늘리기"는 피한다.
(Gemini(Veo)로 배정하는 씬은 발화와 무관하게 항상 10초로 쓴다.)

TTS 기준: `C:/tmp/money-shorts-os/bull-ep8-tts/output-v3/` (3회차, 16씬 raw 합계 120.65초).

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 실측 발화(raw) | 요청 티어 | 예상 여유 |
|---|---|---|---|---|---|
| s1 hook | `bull_ep8_s1.png` | `bull_ep8_s1_motion.mp4` | 7.94초 | **10초** | 2.06초 |
| s2 hook_stakes | `bull_ep8_s2.png` | `bull_ep8_s2_motion.mp4` | 5.70초 | **8초** | 2.30초 |
| s3 opening | `bull_ep8_s3.png` | `bull_ep8_s3_motion.mp4` | 5.21초 | **8초** | 2.79초 |
| s4 situation | `bull_ep8_s4.png` | `bull_ep8_s4_motion.mp4` | 7.73초 | **10초** | 2.27초 |
| s5 core_q_answer(twist) | `bull_ep8_s5.png` | `bull_ep8_s5_motion.mp4` | 9.21초 | **10초** | 0.79초 |
| s6 concept | `bull_ep8_s6.png` | `bull_ep8_s6_motion.mp4` | 9.73초 | **10초** | **0.27초(얇음)** |
| s7 q2 | `bull_ep8_s7.png` | `bull_ep8_s7_motion.mp4` | 6.21초 | **8초** | 1.79초 |
| s8 reason1_summit | `bull_ep8_s8.png` | `bull_ep8_s8_motion.mp4` | 7.51초 | **10초** | 2.49초 |
| s9 reason2_price | `bull_ep8_s9.png` | `bull_ep8_s9_motion.mp4` | 8.34초 | **10초** | 1.66초 |
| s10 reason3_korea | `bull_ep8_s10.png` | `bull_ep8_s10_motion.mp4` | 9.53초 | **10초** | **0.47초(얇음)** |
| s11 balance | `bull_ep8_s11.png` | `bull_ep8_s11_motion.mp4` | 8.34초 | **10초** | 1.66초 |
| s12 insight | `bull_ep8_s12.png` | `bull_ep8_s12_motion.mp4` | 5.94초 | **8초** | 2.06초 |
| s13 frame | `bull_ep8_s13.png` | `bull_ep8_s13_motion.mp4` | 7.57초 | **10초** | 2.43초 |
| s14 check | `bull_ep8_s14.png` | `bull_ep8_s14_motion.mp4` | 6.94초 | **8초** | 1.06초 |
| s15 afterglow | `bull_ep8_s15.png` | `bull_ep8_s15_motion.mp4` | 6.15초 | **8초** | 1.85초 |
| s16 cta(closing) | `bull_ep8_s16.png` | `bull_ep8_s16_motion.mp4` | 8.61초 | **10초** | 1.39초 |

★ s6(0.27초)·s10(0.47초)은 10초 이내지만 여유가 얇다. 이 두 씬은 영상 끝부분(9~10초)
프레임에 카드·보드·표정 붕괴가 없는지 특히 꼼꼼히 본다. s14(1.06초)도 8초 티어의
하한이라 끝 프레임을 확인한다.

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
- 바닥 거치 보드(s4·s6·s9·s13 이젤)는 "넘어지지 않는다"는 문구를 STATIC
  ELEMENTS와 NEGATIVE PROMPT에 추가로 명시
- 이 편 이미지는 캐릭터가 화면을 크게 채운다(7편과 같은 수준). 카메라 줌·크롭이
  생기면 카드 글자가 잘리므로 CAMERA LOCK에 "crop" 문구를 넣었다.

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작 프레임뿐 아니라
클립 중반·후반 프레임에서도 텍스트·소품·동작 지속 여부, 카메라 줌/크롭,
소품 기울어짐을 확인한다.

================================================================================
# 🟦 8초 티어 (s2, s3, s7, s12, s14, s15)
================================================================================

---

## s2 — hook_stakes (8초, 카드 두 손으로 감싸쥠)

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

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "이틀 새" in black on the top line and "+21%" in large red on
the bottom line — in both hands at chest height. The card holds steadily at
this position for the entire clip, from frame 1 to the very last frame, and
does not move, tilt, rotate, or drift at any point. Treat the card as a
frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is wide-eyed and surprised, as if
astonished by the number on the card. The small yellow burst lines beside
its ear stay exactly as they are.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion comes
from the face and body only — the hands holding the card stay steady and
in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("이틀
새", "+21%") as locked, non-regenerating image layers for the full 8
seconds, including the very last frame. Render them exactly as pixels
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
continuously in natural speech rhythm for the entire clip, as if
excitedly revealing a surprising number — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep8-videos/bull_ep8_s2_motion.mp4`로 저장
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
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

MOTION DETAIL: the character keeps one hand raised with the index finger
pointing upward in a confident, friendly gesture while the other hand rests
on its hip, smiling brightly and warmly at the viewer. No props held.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, gentle head tilts, continuous mouth movement while speaking.
No portion of the clip, especially the back half, should hold a single
frozen pose for more than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat any background signage
and chart displays as locked, non-regenerating image layers for the full 8
seconds. Render these exactly as pixels copied from the reference image,
unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, or flickering surfaces anywhere in
the frame, no regenerated or reinterpreted signage, no background changes,
no character redesign, no abrupt cut or freeze mid-motion, no static
expression, no frozen pose while speaking, no full-body freeze at any
point, no camera zoom or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
introducing itself to the viewer — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep8-videos/bull_ep8_s3_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s7 — q2 (8초, 카드 한 손 + 빈 손 턱 짚기)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "8월 규제인데" in red on the top line and "왜 28일?" in navy on
the bottom line — in one hand at chest height. The card holds steadily at
this position for the entire clip, from frame 1 to the very last frame, and
does not move, tilt, rotate, or drift at any point. Treat the card as a
frozen photograph layered in front of the character. The floating yellow
question mark above the character stays exactly where it is.

MOTION DETAIL: the character's other empty hand rests with a fingertip at
its chin in a thinking pose, and the head tilts slightly with a curious,
puzzled expression, as if wondering why this happened on that particular
day. The hand holding the card does not move.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. This motion comes
from the face, head and the free hand only — the hand holding the card
stays steady and in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("8월
규제인데", "왜 28일?") and the question mark icon as locked,
non-regenerating image layers for the full 8 seconds, including the very
last frame. Render these exactly as pixels copied from the reference image,
unchanged frame to frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card
tilt or rotation at any point, no camera zoom or framing drift at any
point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if curiously
posing a question and then starting to answer it — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep8-videos/bull_ep8_s7_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s12 — insight (8초, 카드 두 손으로 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "실적이 아니라" in dark brown on the top line and "시행 기대"
in red on the bottom line — in both hands at chest height. The card holds
steadily at this position for the entire clip, from frame 1 to the very
last frame, and does not move, tilt, rotate, or drift at any point. Treat
the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is confident and assured with a
calm smile, as if delivering the key takeaway.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion comes
from the face and body only — the hands holding the card stay steady and
in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("실적이
아니라", "시행 기대") as locked, non-regenerating image layers for the full
8 seconds, including the very last frame. Render them exactly as pixels
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
continuously in natural speech rhythm for the entire clip, as if
confidently stating the key point — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep8-videos/bull_ep8_s12_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s14 — check (8초, 카드 한 손 + 빈 손 브이)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with a header
"체크" on a yellow highlight and two numbered lines — "① 12월 4일 시행" and
"② 0.38달러 위", each with a red circled number — in one hand at chest
height. The card holds steadily at this position for the entire clip, from
frame 1 to the very last frame, and does not move, tilt, rotate, or drift
at any point. Treat the card as a frozen photograph layered in front of
the character.

MOTION DETAIL: the character's other empty hand holds up two fingers in a
peace-sign gesture to emphasize "two things to check," with a bright,
helpful expression. The hand holding the card does not move.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. The hand holding
the card stays steady and in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("체크",
"① 12월 4일 시행", "② 0.38달러 위") and the red circled numbers as locked,
non-regenerating image layers for the full 8 seconds, including the very
last frame. Render these exactly as pixels copied from the reference image,
unchanged frame to frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card
tilt or rotation at any point, no camera zoom or framing drift at any
point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if brightly
listing two things to check — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep8-videos/bull_ep8_s14_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지, 작은 글자("12월 4일 시행")가 안 깨지는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s15 — afterglow (8초, 카드 두 손으로 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "이유를 알면" in dark brown on the top line and "신호가 읽힌다"
in red on the bottom line — in both hands at chest height. The card holds
steadily at this position for the entire clip, from frame 1 to the very
last frame, and does not move, tilt, rotate, or drift at any point. Treat
the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is warm and calm with a gentle
smile, as if leaving the viewer with a thoughtful parting message.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, gentle head tilts, continuous mouth movement while speaking.
This motion comes from the face and body only — the hands holding the card
stay steady and in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("이유를
알면", "신호가 읽힌다") as locked, non-regenerating image layers for the
full 8 seconds, including the very last frame. Render them exactly as
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
continuously in natural speech rhythm for the entire clip, as if warmly
sharing a closing thought — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep8-videos/bull_ep8_s15_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 8초 티어 씬 전부 완료 후 10초 티어 씬으로 진행

================================================================================
# 🟨 10초 티어 (s1, s4, s5, s6, s8, s9, s10, s11, s13, s16)
================================================================================

---

## s1 — hook (10초, 카드 두 손으로 감싸쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image — same monitors with
candlestick chart silhouettes, same city skyline through windows, same soft
golden lighting. Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "삼성전자 -5%" on the top line and "태양광 +14%" on the bottom
line, with the percentage figures in red — in both hands at chest height.
The card holds steadily at this position for the entire clip, from frame 1
to the very last frame, and does not move, tilt, rotate, or drift at any
point. Treat the card as a frozen photograph layered in front of the
character.

MOTION DETAIL: the character's expression is intrigued and curious, wide
eyes, a lively half-smile, as if posing a surprising question to the
viewer.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, gentle head tilts, continuous mouth movement while speaking.
This motion comes from the face and body only — the hands holding the card
stay steady and in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("삼성전자
-5%", "태양광 +14%") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
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
continuously in natural speech rhythm for the entire clip, as if
curiously posing a question to the viewer — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep8-videos/bull_ep8_s1_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s4 — situation (10초, 바닥 거치 보드)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with two
lines of large text — "대장주 +14.21%" on the top line and "폴리실리콘
+10.92%" on the bottom line — stands beside the character on the floor. The
board holds steadily in its exact position on the floor for the entire clip,
from frame 1 to the very last frame — it never falls over, slides, tilts,
rotates, or drifts at any point, including the final 1-2 seconds. Treat the
board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand (not holding anything) points at
the board while explaining, with a bright, informative expression, while
the other hand rests on its hip. The character does not touch or move the
board.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking, gentle pointing
gesture toward the board.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("대장주
+14.21%", "폴리실리콘 +10.92%") as locked, non-regenerating image layers for
the full 10 seconds, including the very last frame. Render them exactly as
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
continuously in natural speech rhythm for the entire clip, as if
enthusiastically presenting the numbers — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep8-videos/bull_ep8_s4_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 보드가 끝까지 쓰러지지 않고 서 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s5 — core_q_answer / twist (10초, 카드 한 손 + 빈 손 검지)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "미국 규제" in red on the top line and "시행 기대" in navy on
the bottom line — in one hand at chest height. The card holds steadily at
this position for the entire clip, from frame 1 to the very last frame, and
does not move, tilt, rotate, or drift at any point. Treat the card as a
frozen photograph layered in front of the character.

MOTION DETAIL: the character's other empty hand keeps its index finger
raised and gives small emphasizing nods in the air, with a confident,
knowing expression, as if delivering the answer to its own question. The
hand holding the card does not move.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking, gentle emphasis
from the raised finger. The hand holding the card stays steady and in
place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("미국
규제", "시행 기대") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
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
continuously in natural speech rhythm for the entire clip, as if
confidently answering a question — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep8-videos/bull_ep8_s5_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s6 — concept (10초, 바닥 거치 보드, ★여유 0.27초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with large
text — "수입 태양광" and "최저가" in navy on the upper two lines and
"0.38달러" in large red on the bottom line — stands beside the character on
the floor. The board holds steadily in its exact position on the floor for
the entire clip, from frame 1 to the very last frame — it never falls over,
slides, tilts, rotates, or drifts at any point, including the final 1-2
seconds. Treat the board as a frozen photograph layered beside the
character.

MOTION DETAIL: the character's free hand (not holding anything) points at
the board and gives gentle tapping-in-the-air gestures while explaining
calmly, with a friendly, informative expression, while the other hand rests
at its side. The character does not touch or move the board.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking, gentle pointing
gesture toward the board.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("수입
태양광", "최저가", "0.38달러") as locked, non-regenerating image layers for
the full 10 seconds, including the very last frame. Pay special attention
to the "달러" characters — render them exactly as pixels copied from the
reference image, unchanged frame to frame, still fully visible and
standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, smeared, or misspelled
text anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO BOARD
FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board
tilt or rotation at any point, no camera zoom or framing drift at any
point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if calmly
explaining a rule with a simple comparison — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep8-videos/bull_ep8_s6_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 보드가 끝까지 서 있는지, "0.38달러" 글자가 안 번지는지 최우선 확인. 발화가 9.73초라 마지막 0.27초 여유만 있으니 끝 프레임에서 표정 붕괴도 본다
3. 문제 없으면 다음 씬 진행

---

## s8 — reason1_summit (10초, 카드 두 손으로 감싸쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "미중 회담" in red on the top line and "완화는 제외" in navy on
the bottom line — in both hands at chest height. The card holds steadily at
this position for the entire clip, from frame 1 to the very last frame, and
does not move, tilt, rotate, or drift at any point. Treat the card as a
frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is calm and matter-of-fact, as if
reporting what was decided at a meeting, with a subtle nod now and then.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, gentle head tilts, continuous mouth movement while speaking.
This motion comes from the face and body only — the hands holding the card
stay steady and in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("미중
회담", "완화는 제외") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
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
continuously in natural speech rhythm for the entire clip, as if calmly
reporting a meeting outcome — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep8-videos/bull_ep8_s8_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s9 — reason2_price (10초, 바닥 거치 보드)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with two
lines of large text — "모듈 가격 +41%" (with the percentage in red) on the
top line and "최저가와 같아짐" on the bottom line, plus a large red rising
arrow graphic below — stands beside the character on the floor. The board
holds steadily in its exact position on the floor for the entire clip, from
frame 1 to the very last frame — it never falls over, slides, tilts,
rotates, or drifts at any point, including the final 1-2 seconds. Treat the
board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand (not holding anything) points
toward the rising arrow on the board while explaining, with an animated,
engaged expression, while the other hand rests on its hip. The character
does not touch or move the board.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking, gentle pointing
gesture toward the board.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("모듈
가격 +41%", "최저가와 같아짐") and the red arrow graphic as locked,
non-regenerating image layers for the full 10 seconds, including the very
last frame. Render them exactly as pixels copied from the reference image,
unchanged frame to frame, still fully visible and standing at the end.

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
describing a price surge with interest — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep8-videos/bull_ep8_s9_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 보드가 끝까지 서 있는지, "모듈" 글자(듈 획)가 안 무너지는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s10 — reason3_korea (10초, 카드 한 손 + 빈 손 브이, ★여유 0.47초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "미국 현지 생산" in navy on the top line and "중국 밖 공급망"
in red on the bottom line — in one hand at chest height. The card holds
steadily at this position for the entire clip, from frame 1 to the very
last frame, and does not move, tilt, rotate, or drift at any point. Treat
the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's other empty hand holds up two fingers in a
peace-sign gesture to emphasize "two kinds of companies," with a bright,
explanatory expression. The hand holding the card does not move.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. The hand holding
the card stays steady and in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("미국
현지 생산", "중국 밖 공급망") as locked, non-regenerating image layers for
the full 10 seconds, including the very last frame. Render them exactly as
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
continuously in natural speech rhythm for the entire clip, as if
explaining why two kinds of companies benefit — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep8-videos/bull_ep8_s10_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인. 발화가 9.53초라 여유 0.47초뿐이므로 끝 프레임의 표정·카드 상태를 특히 본다
3. 문제 없으면 다음 씬 진행

---

## s11 — balance (10초, 카드 한 손 + 빈 손 카드 가리킴)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "기대 먼저 반영" in black on the top line and "되돌림 주의" in
red on the bottom line — in one hand at chest height. The card holds
steadily at this position for the entire clip, from frame 1 to the very
last frame, and does not move, tilt, rotate, or drift at any point. Treat
the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's other empty hand points its index finger
toward the card and gives small emphasizing nods without touching or
moving the card, while the character nods thoughtfully with a careful,
serious expression, as if gently cautioning the viewer.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head nods, continuous mouth movement while speaking. The hand holding the
card stays steady and in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("기대
먼저 반영", "되돌림 주의") as locked, non-regenerating image layers for the
full 10 seconds, including the very last frame. Render them exactly as
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
continuously in natural speech rhythm for the entire clip, as if carefully
explaining a caution — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep8-videos/bull_ep8_s11_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 카드가 끝까지 들려 있는지, 빈 손이 카드를 건드려 카드가 흔들리지 않는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s13 — frame (10초, 바닥 거치 보드 4칸)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with four
stacked boxes connected by downward arrows — "발표", "기대" (highlighted in
glowing gold), "시행", "실적" from top to bottom — stands beside the
character on the floor. The board holds steadily in its exact position on
the floor for the entire clip, from frame 1 to the very last frame — it
never falls over, slides, tilts, rotates, or drifts at any point, including
the final 1-2 seconds. Treat the board as a frozen photograph layered
beside the character.

MOTION DETAIL: the character's free hand (not holding anything) points at
the highlighted "기대" box while explaining, with a clear, teacher-like
expression, while the other hand rests at its side. The character does not
touch or move the board.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking, gentle pointing
gesture toward the highlighted box.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement, no board falling or sliding.
The four boxes and their arrows do not animate, reorder, or change color.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("발표",
"기대", "시행", "실적"), the arrows, and the gold highlight on "기대" as
locked, non-regenerating image layers for the full 10 seconds, including
the very last frame. Render them exactly as pixels copied from the
reference image, unchanged frame to frame, still fully visible and standing
at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO BOARD
FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board
tilt or rotation at any point, no highlight moving to another box, no
camera zoom or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly
explaining a four-step flow — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep8-videos/bull_ep8_s13_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 보드가 끝까지 서 있는지, 강조 칸이 "기대"에 그대로 남는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s16 — cta closing (10초, 소품 없음, 마지막 씬)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character waves one hand in a friendly, relaxed
side-to-side wave while the other hand hangs naturally at its side,
smiling warmly, as if saying a warm goodbye and inviting the viewer to
comment. No props held.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY, THIS IS THE FINAL
SCENE OF THE EPISODE — DO NOT LET IT GO STATIC): the character must show
visible, continuous motion for the ENTIRE 10 seconds, including the last
2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle body
bounces, gentle head tilts, a continuing friendly wave, continuous mouth
movement while speaking. No portion of the clip, especially the back half,
should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
lounge furniture, and the small decorative items on the shelves must stay
completely fixed — no camera pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat any background signage
and chart displays as locked, non-regenerating image layers for the full 10
seconds. Render these exactly as pixels copied from the reference image,
unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, or flickering surfaces anywhere in
the frame, no regenerated or reinterpreted signage, no background changes,
no character redesign, no abrupt cut or freeze mid-motion, no static
expression, no frozen pose while speaking, NO FULL-BODY FREEZE AT ANY
POINT, no rigid locked pose for the second half of the clip, no holding
completely still for more than half a second anywhere in the clip, no
camera zoom or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
saying goodbye and inviting comments — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep8-videos/bull_ep8_s16_motion.mp4`로 저장
2. 시작·중반(4~5초)·끝(9~10초) 프레임 전부 확인 — 마지막 씬이므로 후반부 정지 여부 특히 꼼꼼히 확인
3. 16개 씬 전부 완료 후 본편 조립(`run-owl-assemble-shorts-v2.mjs`,
   `--spec-module ./_bull-ep8-assembly-spec.mjs --spec-export
   BULL_EP8_ASSEMBLY_SPEC`, `--clip-dir C:/tmp/bull-ep8-videos`,
   `--audio-summary C:/tmp/money-shorts-os/bull-ep8-tts/output-v3/elevenlabs-scene-paced-tts-summary.json`,
   `--tts-script C:/tmp/money-shorts-os/bull-ep8-tts/bull-ep8-tts-script-16scene.json`) →
   고정 CTA 연결(`run-owl-episode-with-fixed-cta-once.mjs --alignment
   C:/tmp/money-shorts-os/bull-ep8-tts/output-v3/elevenlabs-korean-director-*.alignment.json`,
   황소특보 고정 CTA `C:\tmp\bull-cta-fixed-v5\bull_cta_fixed_final_with_captions.mp4`)
   진행 — 조립 후 `cta-join-report.json` PASS 확인, 자막 숫자 표기 검사(`owl_captions.ass`에서
   `[일이삼사오육칠팔구십백천](년|월|개월|만|퍼센트)` 0건) 필수
