# 황소특보 10편(11월 2일 저PBR 기업 공표 × 10월 22일 공시 마감, 17씬) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/bull-ep10-images/`
영상 저장: **장면 번호로** `C:/Users/PC/Downloads/1.mp4` ~ `17.mp4`(CURRENT_STANDARDS §A-6, "황소특보 10편"이라고 알려주기)

**씬 길이 티어는 8초/10초 2단계로만 요청한다.** 발화 8초 미만이고 여유 1초 이상이면 8초, 그 외는 10초.
(Gemini(Veo)로 배정하는 씬은 발화와 무관하게 항상 10초.) 이번 편은 8초 티어 s2, s3, s4, s5, s9, s10, s14, s15, s17, 10초 티어 s1, s6, s7, s8, s11, s12, s13, s16다. 두 손 카드 씬(s1·s12·s16)은 카드 소실 사고 때문에 발화가 짧아도 10초로 요청한다.

TTS 기준: `C:/tmp/money-shorts-os/bull-ep10-tts/output-v3/` (3회차, 17씬 raw 합계 105.5초, 타임라인 119.8초).

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 실측 발화(raw) | 요청 티어 | 예상 여유 |
|---|---|---|---|---|---|
| s1 hook | `bull_ep10_s1.png` | `bull_ep10_s1_motion.mp4` | 7.05초 | **10초** | 2.95초 |
| s2 hook_stakes | `bull_ep10_s2.png` | `bull_ep10_s2_motion.mp4` | 5.22초 | **8초** | 2.78초 |
| s3 opening | `bull_ep10_s3.png` | `bull_ep10_s3_motion.mp4` | 5.13초 | **8초** | 2.87초 |
| s4 situation | `bull_ep10_s4.png` | `bull_ep10_s4_motion.mp4` | 4.85초 | **8초** | 3.15초 |
| s5 core_q_answer | `bull_ep10_s5.png` | `bull_ep10_s5_motion.mp4` | 6.73초 | **8초** | 1.27초 |
| s6 concept_example | `bull_ep10_s6.png` | `bull_ep10_s6_motion.mp4` | 7.53초 | **10초** | 2.47초 |
| s7 criteria | `bull_ep10_s7.png` | `bull_ep10_s7_motion.mp4` | 7.54초 | **10초** | 2.46초 |
| s8 company_procedure | `bull_ep10_s8.png` | `bull_ep10_s8_motion.mp4` | 7.56초 | **10초** | 2.44초 |
| s9 exception | `bull_ep10_s9.png` | `bull_ep10_s9_motion.mp4` | 4.53초 | **8초** | 3.47초 |
| s10 link | `bull_ep10_s10.png` | `bull_ep10_s10_motion.mp4` | 6.00초 | **8초** | 2.00초 |
| s11 views | `bull_ep10_s11.png` | `bull_ep10_s11_motion.mp4` | 7.45초 | **10초** | 2.55초 |
| s12 insight | `bull_ep10_s12.png` | `bull_ep10_s12_motion.mp4` | 5.32초 | **10초** | 4.68초 |
| s13 frame | `bull_ep10_s13.png` | `bull_ep10_s13_motion.mp4` | 7.07초 | **10초** | 2.93초 |
| s14 business_flow | `bull_ep10_s14.png` | `bull_ep10_s14_motion.mp4` | 5.88초 | **8초** | 2.12초 |
| s15 check | `bull_ep10_s15.png` | `bull_ep10_s15_motion.mp4` | 6.58초 | **8초** | 1.42초 |
| s16 benefit | `bull_ep10_s16.png` | `bull_ep10_s16_motion.mp4` | 4.34초 | **10초** | 5.66초 |
| s17 cta | `bull_ep10_s17.png` | `bull_ep10_s17_motion.mp4` | 6.76초 | **8초** | 1.24초 |

★ 여유가 얇은 씬: 없음 — 영상 끝부분 프레임에 카드·보드·표정 붕괴가 없는지 특히 꼼꼼히 본다.

★ 영상 생성 절대규칙(`_ai/CURRENT_STANDARDS.md` §0-1) 반영: 소품을 든 손은 한 지점 고정, 동작은 빈 쪽에만,
소품·보드는 frozen photograph 명시, 텍스트는 CRITICAL TEXT PRESERVATION 블록, 나레이션 영상이라 "Silent" 금지,
"glued" 같은 신체 접착 표현 금지(Gemini 즉시 거부 사고), 바닥 보드는 "넘어지지 않는다" 이중 명시, CAMERA LOCK에 crop 명시.

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작·중반·끝 프레임에서 텍스트·소품·동작 지속 여부,
카메라 줌/크롭, 소품 기울어짐을 확인한다.

================================================================================
# 🟦 8초 티어 (s2, s3, s4, s5, s9, s10, s14, s15, s17)
================================================================================

## s2 — hook_stakes (8초, 바닥 거치 보드)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the stock exchange announcement lobby
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 2 lines of
large text — "핵심 날짜" on the first line, "10월 22일" on the second line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand (not holding anything) points toward the board without touching it, with a serious, slightly tense expression, while the other hand rests near its hip. The character does not touch or move the board.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. The board stays completely still.

STATIC ELEMENTS: the large curved chart display wall with candlestick shapes, the glossy lobby floor, the round columns, and the potted plants
must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("핵심 날짜", "10월 22일") as locked, non-regenerating image layers for the full
8 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if emphasizing a key date — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

## s3 — opening (8초, 소품 없음)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the stock exchange announcement lobby
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character keeps one hand raised with the index finger pointing upward in a confident, friendly gesture while the other hand rests on its hip, smiling brightly and warmly at the viewer. No props held.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking, gentle head tilts. No portion of the clip, especially the back half, should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the large curved chart display wall with candlestick shapes, the glossy lobby floor, the round columns, and the potted plants
must stay completely fixed — no camera pan or zoom, no
background object movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly greeting the viewer — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

## s4 — situation (8초, 바닥 거치 보드)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the stock exchange announcement lobby
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 2 lines of
large text — "11월 2일" on the first line, "저PBR 첫 공표" on the second line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand points at the board while explaining, with a bright, informative expression, while the other hand rests near its hip. The character does not touch or move the board.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. The board stays completely still.

STATIC ELEMENTS: the large curved chart display wall with candlestick shapes, the glossy lobby floor, the round columns, and the potted plants
must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("11월 2일", "저PBR 첫 공표") as locked, non-regenerating image layers for the full
8 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if calmly presenting the news — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

## s5 — core_q_answer (8초, 바닥 거치 보드)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright study-like analysis room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 2 lines of
large text — "PBR" on the first line, "주가 ÷ 주당순자산" on the second line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand keeps its index finger raised and gives small emphasizing nods in the air, with a clear, teaching expression, while the other hand rests near its hip. The character does not touch or move the board.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. The board stays completely still.

STATIC ELEMENTS: the large window with the city skyline, the tall bookshelves, the globe, the low sofa, and the rug
must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("PBR", "주가 ÷ 주당순자산") as locked, non-regenerating image layers for the full
8 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly defining a term — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

## s9 — exception (8초, 바닥 거치 보드)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the listed-company disclosure office area
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 2 lines of
large text — "6년 내내 하위권" on the first line, "공시해도 명단 포함" on the second line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand points toward the board without touching it, with a careful, serious expression and small nods, while the other hand rests near its hip. The character does not touch or move the board.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. The board stays completely still.

STATIC ELEMENTS: the glass service counters, the shelves of blank-spined binders, the pendant lights, and the tiled floor
must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("6년 내내 하위권", "공시해도 명단 포함") as locked, non-regenerating image layers for the full
8 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if carefully noting an exception — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

## s10 — link (8초, 바닥 거치 보드 3줄)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the listed-company disclosure office area
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 3 lines of
large text — "자본 효율 계획" on the first line, "유상증자·CB" on the second line, "줄어들 전망" on the third line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand traces along the board lines without touching it, explaining with a confident, informative expression, while the other hand rests near its hip. The character does not touch or move the board.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. The board stays completely still.

STATIC ELEMENTS: the glass service counters, the shelves of blank-spined binders, the pendant lights, and the tiled floor
must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("자본 효율 계획", "유상증자·CB", "줄어들 전망") as locked, non-regenerating image layers for the full
8 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if explaining an expected consequence — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

## s14 — business_flow (8초, 바닥 거치 보드)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the listed-company disclosure office area
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 2 lines of
large text — "실적 늘고 있나" on the first line, "성장 여지는?" on the second line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand keeps two fingers raised and gives small emphasizing motions, with a clear, helpful expression, while the other hand rests near its hip. The character does not touch or move the board.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. The board stays completely still.

STATIC ELEMENTS: the glass service counters, the shelves of blank-spined binders, the pendant lights, and the tiled floor
must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("실적 늘고 있나", "성장 여지는?") as locked, non-regenerating image layers for the full
8 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly listing two things to check — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

## s15 — check (8초, 바닥 거치 보드 3줄)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the listed-company disclosure office area
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 3 lines of
large text — "10월 22일 전" on the first line, "계획 공시?" on the second line, "전자공시 확인" on the third line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand points toward the board lines one after another without touching it, explaining with a clear, practical expression, while the other hand rests near its hip. The character does not touch or move the board.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. The board stays completely still.

STATIC ELEMENTS: the glass service counters, the shelves of blank-spined binders, the pendant lights, and the tiled floor
must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("10월 22일 전", "계획 공시?", "전자공시 확인") as locked, non-regenerating image layers for the full
8 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly explaining what to check — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

## s17 — cta (8초, 소품 없음, 손 흔들기)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the stock exchange announcement lobby
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character smiles brightly and waves one hand lightly in a friendly goodbye while the other hand hangs naturally relaxed. No props held.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking, gentle head tilts. No portion of the clip, especially the back half, should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the large curved chart display wall with candlestick shapes, the glossy lobby floor, the round columns, and the potted plants
must stay completely fixed — no camera pan or zoom, no
background object movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly saying goodbye and inviting comments — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

================================================================================
# 🟨 10초 티어 (s1, s6, s7, s8, s11, s12, s13, s16)
================================================================================

## s1 — hook (10초, 카드 두 손으로 감싸쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the stock exchange announcement lobby
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "저PBR 태그" on the first line, "최대 220곳" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is wide-eyed and curious, eyebrows raised, as if asking whether the viewer's own stock could be on the list; body and face move gently while the hands holding the card stay still.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion comes from the face and body only — the hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large curved chart display wall with candlestick shapes, the glossy lobby floor, the round columns, and the potted plants
must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("저PBR 태그", "최대 220곳") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if posing an intriguing question to the viewer — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

## s6 — concept_example (10초, 바닥 거치 보드 3줄)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright study-like analysis room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 3 lines of
large text — "주가 1만 원" on the first line, "주당순자산 5천 원" on the second line, "PBR 2배" on the third line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand gently taps the air toward each line of the board one after another without touching it, explaining calmly, while the other hand rests near its hip. The character does not touch or move the board.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. The board stays completely still.

STATIC ELEMENTS: the large window with the city skyline, the tall bookshelves, the globe, the low sofa, and the rug
must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("주가 1만 원", "주당순자산 5천 원", "PBR 2배") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if calmly walking through a simple example — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

## s7 — criteria (10초, 바닥 거치 보드 3줄)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright study-like analysis room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 3 lines of
large text — "업종 안 3년 하위" on the first line, "코스피 25%" on the second line, "코스닥 10%" on the third line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: one free hand keeps one finger raised while the other free hand points toward the board without touching it, with an explaining, engaged expression. The character does not touch or move the board.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. The board stays completely still.

STATIC ELEMENTS: the large window with the city skyline, the tall bookshelves, the globe, the low sofa, and the rug
must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("업종 안 3년 하위", "코스피 25%", "코스닥 10%") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if explaining a ranking criterion — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

## s8 — company_procedure (10초, 바닥 거치 보드 3줄)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the listed-company disclosure office area
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 3 lines of
large text — "10월 22일까지" on the first line, "계획 공시하면" on the second line, "1년 명단 제외" on the third line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand points to the board lines one after another from top to bottom without touching it, explaining with a bright, clear expression, while the other hand rests near its hip. The character does not touch or move the board.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. The board stays completely still.

STATIC ELEMENTS: the glass service counters, the shelves of blank-spined binders, the pendant lights, and the tiled floor
must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("10월 22일까지", "계획 공시하면", "1년 명단 제외") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly explaining a procedure — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

## s11 — views (10초, 바닥 거치 보드)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright study-like analysis room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 2 lines of
large text — "낮음 = 가치주? 둔화?" on the first line, "높음 = 기대? 거품?" on the second line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand is held open, palm up, and tilts gently side to side in the air as if weighing two views, with a thoughtful, balanced expression, while the other hand rests near its hip. The board does not move. The character does not touch or move the board.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. The board stays completely still.

STATIC ELEMENTS: the large window with the city skyline, the tall bookshelves, the globe, the low sofa, and the rug
must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("낮음 = 가치주? 둔화?", "높음 = 기대? 거품?") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if thoughtfully presenting two different views — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

## s12 — insight (10초, 카드 두 손으로 감싸쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright study-like analysis room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "태그는 질문" on the first line, "결론이 아니야" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is confident and knowing, with slight nods; only the face and body move while the hands holding the card stay still.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion comes from the face and body only — the hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large window with the city skyline, the tall bookshelves, the globe, the low sofa, and the rug
must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("태그는 질문", "결론이 아니야") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if confidently delivering the key insight — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

## s13 — frame (10초, 바닥 거치 보드 3칸)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the listed-company disclosure office area
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 3 lines of
large text — "① 계획 공시" on the first line, "② 6년 하위권" on the second line, "③ 사업 흐름" on the third line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand points to the lines one after another from top to bottom without touching the board, while explaining with a bright, clear expression. The character does not touch or move the board.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. The board stays completely still.

STATIC ELEMENTS: the glass service counters, the shelves of blank-spined binders, the pendant lights, and the tiled floor
must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("① 계획 공시", "② 6년 하위권", "③ 사업 흐름") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly explaining a three-step order — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

## s16 — benefit (10초, 카드 두 손으로 감싸쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the stock exchange announcement lobby
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "태그 말고" on the first line, "이유를 읽어" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is warm and calm with a gentle smile; only the face and body move while the hands holding the card stay still.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion comes from the face and body only — the hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large curved chart display wall with candlestick shapes, the glossy lobby floor, the round columns, and the potted plants
must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("태그 말고", "이유를 읽어") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly reassuring the viewer — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

## 완료 후 절차
1. 다 만들면 `C:/Users/PC/Downloads/1.mp4`~`17.mp4`로 저장하고 "황소특보 10편 영상 검수해줘"라고 알려주기
2. 제가 길이(요청 티어 대비)·시작/중반/끝 프레임·글자 보존·카메라 줌을 검수하고, 통과하면 조립+CTA 결합 → 커버·스토리까지 이어서 진행
3. 재생성이 필요한 씬은 프롬프트 수정 없이 같은 프롬프트로 다시 뽑는다(프롬프트 강화로 해결 시도 금지)
