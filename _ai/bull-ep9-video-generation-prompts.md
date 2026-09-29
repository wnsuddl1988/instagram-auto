# 황소특보 9편(오픈AI 출시 취소 × 마이크론 실적 D-1, 16씬) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/bull-ep9-images/`
영상 저장: **장면 번호로** `C:/Users/PC/Downloads/1.mp4` ~ `16.mp4`(CURRENT_STANDARDS §A-6, "황소특보 9편"이라고 알려주기)

**씬 길이 티어는 8초/10초 2단계로만 요청한다.** 발화 8초 미만이고 여유 1초 이상이면 8초, 그 외는 10초.
(Gemini(Veo)로 배정하는 씬은 발화와 무관하게 항상 10초.) 이번 편은 **s3·s8이 8초, 나머지 14개가 10초**다. (s15는 8초로 2번 뽑았으나 둘 다 7.0~7.5초에 카드가 투명해지며 사라져, 10초로 변경 — 2026-09-29)

TTS 기준: `C:/tmp/money-shorts-os/bull-ep9-tts/output-v3/` (3회차·팩트 수정 반영, 16씬 raw 합계 118.6초, 타임라인 132.84초).

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 실측 발화(raw) | 요청 티어 | 예상 여유 |
|---|---|---|---|---|---|
| s1 hook | `bull_ep9_s1.png` | `bull_ep9_s1_motion.mp4` | 7.90초 | **10초** | 2.10초 |
| s2 hook_stakes | `bull_ep9_s2.png` | `bull_ep9_s2_motion.mp4` | 7.57초 | **10초** | 2.43초 |
| s3 opening | `bull_ep9_s3.png` | `bull_ep9_s3_motion.mp4` | 5.30초 | **8초** | 2.70초 |
| s4 situation | `bull_ep9_s4.png` | `bull_ep9_s4_motion.mp4` | 7.49초 | **10초** | 2.51초 |
| s5 core_q_answer | `bull_ep9_s5.png` | `bull_ep9_s5_motion.mp4` | 7.30초 | **10초** | 2.70초 |
| s6 concept_contract | `bull_ep9_s6.png` | `bull_ep9_s6_motion.mp4` | 7.53초 | **10초** | 2.47초 |
| s7 concept_hbm | `bull_ep9_s7.png` | `bull_ep9_s7_motion.mp4` | 8.44초 | **10초** | 1.56초 |
| s8 link_korea | `bull_ep9_s8.png` | `bull_ep9_s8_motion.mp4` | 6.97초 | **8초** | 1.03초 |
| s9 balance | `bull_ep9_s9.png` | `bull_ep9_s9_motion.mp4` | 7.71초 | **10초** | 2.29초 |
| s10 fx | `bull_ep9_s10.png` | `bull_ep9_s10_motion.mp4` | 7.61초 | **10초** | 2.39초 |
| s11 fx_numbers | `bull_ep9_s11.png` | `bull_ep9_s11_motion.mp4` | 8.33초 | **10초** | 1.67초 |
| s12 insight | `bull_ep9_s12.png` | `bull_ep9_s12_motion.mp4` | 7.39초 | **10초** | 2.61초 |
| s13 frame | `bull_ep9_s13.png` | `bull_ep9_s13_motion.mp4` | 7.39초 | **10초** | 2.61초 |
| s14 check | `bull_ep9_s14.png` | `bull_ep9_s14_motion.mp4` | 7.80초 | **10초** | 2.20초 |
| s15 benefit | `bull_ep9_s15.png` | `bull_ep9_s15_motion.mp4` | 6.66초 | **10초** | 3.34초 |
| s16 cta | `bull_ep9_s16.png` | `bull_ep9_s16_motion.mp4` | 7.25초 | **10초** | 2.75초 |

★ 주의할 씬: s8(8초 티어 하한, 여유 1.03초)은 끝 프레임을 특히 확인한다. 카드를 두 손으로 든 씬은 8초 클립 끝에서
카드가 사라지는 사고가 있었으니(s15), 끝 프레임(사용 구간 끝)에서 카드가 남아 있는지 꼭 확인한다.

★ 영상 생성 절대규칙(`_ai/CURRENT_STANDARDS.md` §0-1) 반영: 소품을 든 손은 한 지점 고정, 동작은 빈 쪽에만,
소품·보드는 frozen photograph 명시, 텍스트는 CRITICAL TEXT PRESERVATION 블록, 나레이션 영상이라 "Silent" 금지,
"glued" 같은 신체 접착 표현 금지(Gemini 즉시 거부 사고), 바닥 보드는 "넘어지지 않는다" 이중 명시, CAMERA LOCK에 crop 명시.

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작·중반·끝 프레임에서 텍스트·소품·동작 지속 여부,
카메라 줌/크롭, 소품 기울어짐을 확인한다.

================================================================================
# 🟦 8초 티어 (s3, s8)
================================================================================

## s3 — opening (8초, 소품 없음)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
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

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
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

## s8 — link_korea (8초, 카드 한 손 + 빈 손 앞 가리킴)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "마이크론 먼저" on the first line, "삼성·SK 잣대" on the second line — in one hand at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's other empty hand points forward toward the viewer with small emphasizing motions and a confident expression. The hand holding the card does not move.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion comes from the face and body only — the hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("마이크론 먼저", "삼성·SK 잣대") as locked, non-regenerating image layers for the full
8 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if confidently connecting two things — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

================================================================================
# 🟨 10초 티어 (s1, s2, s4, s5, s6, s7, s9, s10, s11, s12, s13, s14, s15, s16)
================================================================================

## s1 — hook (10초, 카드 두 손으로 감싸쥠)

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

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "오픈AI 출시 취소" on the first line, "마이크론 500억 달러" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is wide-eyed and intrigued, eyebrows raised, as if asking what this signal means; body and face move gently while the hands holding the card stay still.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion comes from the face and body only — the hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("오픈AI 출시 취소", "마이크론 500억 달러") as locked, non-regenerating image layers for the full
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

## s2 — hook_stakes (10초, 카드 두 손으로 감싸쥠)

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

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "10월 1일" on the first line, "새벽 5시 30분" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is tense and wide-eyed, as if counting down to an important early-morning deadline; only the face and body move.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion comes from the face and body only — the hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("10월 1일", "새벽 5시 30분") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warning about a time-critical event — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

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

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 2 lines of
large text — "GPT-6.1 아스트라" on the first line, "출시 취소" on the second line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand (not holding anything) points at the board while explaining, with a bright, informative expression, while the other hand rests near its hip. The character does not touch or move the board.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. The board stays completely still.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("GPT-6.1 아스트라", "출시 취소") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
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

## s5 — core_q_answer (10초, 카드 한 손 + 빈 손 검지)

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

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "답은" on the first line, "계약 장부" on the second line — in one hand at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's other empty hand keeps its index finger raised and gives small emphasizing nods in the air, with a confident, knowing expression, as if delivering the answer to its own question. The hand holding the card does not move.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion comes from the face and body only — the hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("답은", "계약 장부") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if confidently answering a question — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

## s6 — concept_contract (10초, 바닥 거치 보드)

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

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 2 lines of
large text — "5년 장기계약" on the first line, "1000억 달러" on the second line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand gently points toward the board text without touching it, explaining calmly, while the other hand rests near its hip. The character does not touch or move the board.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. The board stays completely still.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("5년 장기계약", "1000억 달러") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if calmly explaining a concept — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

## s7 — concept_hbm (10초, 바닥 거치 보드)

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

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 2 lines of
large text — "HBM 웨이퍼" on the first line, "D램의 3배" on the second line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: one free hand keeps three fingers raised while the other free hand points toward the board without touching it, with an explaining, engaged expression. The character does not touch or move the board.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. The board stays completely still.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("HBM 웨이퍼", "D램의 3배") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if explaining a comparison with a cooking analogy — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

## s9 — balance (10초, 카드 한 손 + 빈 손 짚기)

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

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "계약도 재협상" on the first line, "가능성 주의" on the second line — in one hand at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's other empty hand points toward the card without touching it, and the character gives careful, serious nods. The hand holding the card does not move.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion comes from the face and body only — the hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("계약도 재협상", "가능성 주의") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if carefully raising a caution — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

## s10 — fx (10초, 바닥 거치 보드)

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

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 2 lines of
large text — "환율 -11%" on the first line, "2분기 말 대비" on the second line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand traces downward along the board toward the arrow without touching it, with a serious, concerned expression, while the other hand rests near its hip. The character does not touch or move the board.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. The board stays completely still.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("환율 -11%", "2분기 말 대비") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if seriously explaining a twist — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

## s11 — fx_numbers (10초, 카드 두 손으로 감싸쥠)

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

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "삼성전자 104조" on the first line, "SK하이닉스 70조" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is serious and careful, with slight nods; only the face and body move while the hands holding the card stay still.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion comes from the face and body only — the hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("삼성전자 104조", "SK하이닉스 70조") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if carefully presenting numbers — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

## s12 — insight (10초, 카드 두 손으로 감싸쥠)

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

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "수요가 계약으로" on the first line, "잠겨 있는가" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is confident and knowing, with slight nods; only the face and body move while the hands holding the card stay still.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion comes from the face and body only — the hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("수요가 계약으로", "잠겨 있는가") as locked, non-regenerating image layers for the full
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
gold bull mascot character's design and the securities trading lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 3 lines of
large text — "달러 숫자" on the first line, "다음 전망" on the second line, "환율" on the third line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand points to the boxes one after another from top to bottom without touching the board, while explaining with a bright, clear expression. The character does not touch or move the board.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. The board stays completely still.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("달러 숫자", "다음 전망", "환율") as locked, non-regenerating image layers for the full
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

## s14 — check (10초, 카드 한 손 + 빈 손 두 손가락)

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

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 3 lines of
large text — "체크" on the first line, "① 다음 분기 전망" on the second line, "② 한국은 환율" on the third line — in one hand at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's other empty hand keeps two fingers raised and gives small emphasizing motions, with a clear, helpful expression. The hand holding the card does not move.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion comes from the face and body only — the hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("체크", "① 다음 분기 전망", "② 한국은 환율") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly listing two checkpoints — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

---

## s15 — benefit (10초, 카드 두 손으로 감싸쥠)

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

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "순서대로 읽으면" on the first line, "속보에 안 흔들려" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is warm and calm with a gentle smile; only the face and body move while the hands holding the card stay still.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion comes from the face and body only — the hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("순서대로 읽으면", "속보에 안 흔들려") as locked, non-regenerating image layers for the full
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

## s16 — cta (10초, 소품 없음, 손 흔들기)

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

MOTION DETAIL: the character smiles brightly and waves one hand lightly in a friendly goodbye while the other hand hangs naturally relaxed. No props held.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking, gentle head tilts. No portion of the clip, especially the back half, should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the monitors, candlestick chart silhouettes, city skyline,
and lounge furniture must stay completely fixed — no camera pan or zoom, no
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

## 완료 후 절차
1. 다 만들면 `C:/Users/PC/Downloads/1.mp4`~`16.mp4`로 저장하고 "황소특보 9편 영상 검수해줘"라고 알려주기
2. 제가 길이(요청 티어 대비)·시작/중반/끝 프레임·글자 보존·카메라 줌을 검수하고, 통과하면 조립+CTA 결합 → 커버·스토리까지 이어서 진행
3. 재생성이 필요한 씬은 프롬프트 수정 없이 같은 프롬프트로 다시 뽑는다(프롬프트 강화로 해결 시도 금지)
