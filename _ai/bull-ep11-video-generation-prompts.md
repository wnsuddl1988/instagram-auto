# 황소특보 11편 (조선주 반토막 가까이 빠졌는데 이익 전망은 올랐다, 17씬) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/bull-ep11-images/`
영상 저장: **장면 번호로** `C:/Users/PC/Downloads/1.mp4` ~ `17.mp4` (CURRENT_STANDARDS §A-6, "황소특보 11편"이라고 알려주기)

생성기: `scripts/build-video-generation-prompts.mjs` (TTS: `C:/tmp/money-shorts-os/bull-ep11-tts/output-v1/elevenlabs-scene-paced-tts-summary.json`, 타임라인 130.76초)

**★ 2026-09-30 변경 — 입 멈춤 시각(SPEECH TIMING):** 씬마다 "몇 초까지만 말하고 그 뒤엔 입을 다문다"를 넣었다
(표의 '입 멈춤'). 받은 영상에서 입이 그 시각 뒤에도 계속 움직이면 검수에서 표시한다. 눈 깜빡임·호흡은 끝까지 유지.

티어는 8초/10초 두 가지뿐. 발화 8초 미만·여유 1초 이상이면 8초, 그 외 10초, 두 손 카드 씬은 항상 10초.
Gemini(Veo)로 배정하는 씬은 발화와 무관하게 항상 10초(입 멈춤 시각은 그대로).

| 씬 | 이미지 | 저장할 영상 파일명 | 발화(raw) | 입 멈춤 | 티어 | 여유 | 샷 / 배경 | 형태 |
|---|---|---|---|---|---|---|---|---|
| s1 hook | `bull_ep11_s1.png` | `bull_ep11_s1_motion.mp4` | 6.10초 | **6.5초** | **10초** | 3.90초 | medium / A | card2 |
| s2 opening | `bull_ep11_s2.png` | `bull_ep11_s2_motion.mp4` | 5.93초 | **6.0초** | **8초** | 2.07초 | wide / A | open |
| s3 situation_drop | `bull_ep11_s3.png` | `bull_ep11_s3_motion.mp4` | 6.51초 | **6.6초** | **8초** | 1.49초 | medium / A | board |
| s4 situation_profit | `bull_ep11_s4.png` | `bull_ep11_s4_motion.mp4` | 7.49초 | **7.6초** | **10초** | 2.51초 | wide / B | board |
| s5 core_q | `bull_ep11_s5.png` | `bull_ep11_s5_motion.mp4` | 8.83초 | **8.9초** | **10초** | 1.17초 | medium / B | card2 |
| s6 concept_backlog | `bull_ep11_s6.png` | `bull_ep11_s6_motion.mp4` | 7.33초 | **7.4초** | **10초** | 2.67초 | medium / B | board |
| s7 backlog | `bull_ep11_s7.png` | `bull_ep11_s7_motion.mp4` | 8.25초 | **8.4초** | **10초** | 1.75초 | wide / B | board |
| s8 share | `bull_ep11_s8.png` | `bull_ep11_s8_motion.mp4` | 7.93초 | **8.0초** | **10초** | 2.07초 | medium / B | board |
| s9 august | `bull_ep11_s9.png` | `bull_ep11_s9_motion.mp4` | 6.19초 | **6.3초** | **10초** | 3.81초 | medium / C | card2 |
| s10 fx | `bull_ep11_s10.png` | `bull_ep11_s10_motion.mp4` | 8.16초 | **8.3초** | **10초** | 1.84초 | medium / C | board |
| s11 cost | `bull_ep11_s11.png` | `bull_ep11_s11_motion.mp4` | 5.85초 | **5.9초** | **8초** | 2.15초 | close / C | open |
| s12 balance | `bull_ep11_s12.png` | `bull_ep11_s12_motion.mp4` | 6.99초 | **7.1초** | **8초** | 1.01초 | wide / A | board |
| s13 insight | `bull_ep11_s13.png` | `bull_ep11_s13_motion.mp4` | 6.26초 | **6.4초** | **10초** | 3.74초 | medium / A | card2 |
| s14 check | `bull_ep11_s14.png` | `bull_ep11_s14_motion.mp4` | 7.24초 | **7.3초** | **10초** | 2.76초 | medium / A | board |
| s15 frame | `bull_ep11_s15.png` | `bull_ep11_s15_motion.mp4` | 8.34초 | **8.4초** | **10초** | 1.66초 | medium / C | card2 |
| s16 next | `bull_ep11_s16.png` | `bull_ep11_s16_motion.mp4` | 4.60초 | **4.7초** | **8초** | 3.40초 | medium / A | board |
| s17 cta | `bull_ep11_s17.png` | `bull_ep11_s17_motion.mp4` | 5.24초 | **5.3초** | **8초** | 2.76초 | wide / A | open |

★ 영상 생성 절대규칙(`_ai/CURRENT_STANDARDS.md` §0-1): 소품 든 손은 고정·동작은 빈 손에만, 소품은 frozen photograph,
텍스트는 CRITICAL TEXT PRESERVATION, 나레이션 영상이라 "Silent" 금지, "glued" 같은 신체 접착 표현 금지, 바닥 보드 "넘어지지 않음" 이중 명시.

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수** — 시작·중반·끝 프레임의 텍스트·소품·입 멈춤을 확인한다.

================================================================================
# 🟦 8초 티어 (s2, s3, s11, s12, s16, s17)
================================================================================

## s2 — opening (8초, open, 입 멈춤 6.0초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the shipyard overlook deck
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character keeps one hand raised with the index finger pointing upward in a confident, friendly gesture while the other hand rests on its hip, smiling brightly and warmly at the viewer. No props held.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 6.0s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 6.0s the character finishes the
sentence. From 6.0s until the end of the clip (8s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
6.0s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. No portion of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the giant gantry cranes, the ship hull under construction, the wooden deck floor, the glass railings, and the potted plants
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 6.0s, no camera zoom, crop, or framing drift at any point.

MOOD: warmly greeting the viewer.
```

---

## s3 — background (8초, board, 입 멈춤 6.6초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the shipyard overlook deck
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 3 lines of
large text — "고점 대비" on the first line, "44~51%" on the second line, "하락" on the third line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand points toward the board without touching it, with a bright, informative expression, while the other hand rests near its hip. The character does not touch or move the board.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 6.6s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 6.6s the character finishes the
sentence. From 6.6s until the end of the clip (8s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
6.6s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The board stays completely still.

STATIC ELEMENTS: the giant gantry cranes, the ship hull under construction, the wooden deck floor, the glass railings, and the potted plants
must stay completely fixed — no camera pan or zoom, no background object
movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("고점 대비", "44~51%", "하락") as locked, non-regenerating image layers for the full
8 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 6.6s, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: calmly presenting the numbers.
```

---

## s11 — background (8초, open, 입 멈춤 5.9초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright port-view office
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character rests one hand near its chin with a worried, thoughtful expression and slight head tilts while the other hand rests on its hip; no props are held. No props held.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 5.9s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 5.9s the character finishes the
sentence. From 5.9s until the end of the clip (8s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
5.9s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. No portion of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the large window with the container yard and dock cranes, the potted plants, the low bookshelves, the globe, and the rug
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 5.9s, no camera zoom, crop, or framing drift at any point.

MOOD: worriedly considering rising costs.
```

---

## s12 — counterpoint (8초, board, 입 멈춤 7.1초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the shipyard overlook deck
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 2 lines of
large text — "전망은 가정" on the first line, "틀릴 수도" on the second line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand is held open, palm up, and tilts gently in the air as if weighing the forecast, with a careful, balanced expression, while the other hand rests near its hip. The board does not move. The character does not touch or move the board.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 7.1s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 7.1s the character finishes the
sentence. From 7.1s until the end of the clip (8s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
7.1s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The board stays completely still.

STATIC ELEMENTS: the giant gantry cranes, the ship hull under construction, the wooden deck floor, the glass railings, and the potted plants
must stay completely fixed — no camera pan or zoom, no background object
movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("전망은 가정", "틀릴 수도") as locked, non-regenerating image layers for the full
8 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 7.1s, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: carefully noting a caveat.
```

---

## s16 — action (8초, board, 입 멈춤 4.7초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the shipyard overlook deck
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 2 lines of
large text — "다음 신호" on the first line, "9월 수주 통계" on the second line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand points toward the board without touching it, with a bright, encouraging expression, while the other hand rests near its hip. The character does not touch or move the board.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 4.7s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 4.7s the character finishes the
sentence. From 4.7s until the end of the clip (8s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
4.7s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The board stays completely still.

STATIC ELEMENTS: the giant gantry cranes, the ship hull under construction, the wooden deck floor, the glass railings, and the potted plants
must stay completely fixed — no camera pan or zoom, no background object
movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("다음 신호", "9월 수주 통계") as locked, non-regenerating image layers for the full
8 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 4.7s, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: pointing to the next signal.
```

---

## s17 — save (8초, open, 입 멈춤 5.3초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the shipyard overlook deck
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character smiles brightly and waves one hand lightly in a friendly goodbye while the other hand hangs naturally relaxed. No props held.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 5.3s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 5.3s the character finishes the
sentence. From 5.3s until the end of the clip (8s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
5.3s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. No portion of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the giant gantry cranes, the ship hull under construction, the wooden deck floor, the glass railings, and the potted plants
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 5.3s, no camera zoom, crop, or framing drift at any point.

MOOD: warmly saying goodbye and inviting comments.
```

---

================================================================================
# 🟨 10초 티어 (s1, s4, s5, s6, s7, s8, s9, s10, s13, s14, s15)
================================================================================

## s1 — hook (10초, card2, 입 멈춤 6.5초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the shipyard overlook deck
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "조선주 반토막?" on the first line, "이익은 올랐다" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is wide-eyed and puzzled, eyebrows raised, as if asking the viewer why profit forecasts rose while the stock price fell; body and face move gently while the hands holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.3s to 6.5s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 6.5s the character finishes the
sentence. From 6.5s until the end of the clip (10s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
6.5s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the giant gantry cranes, the ship hull under construction, the wooden deck floor, the glass railings, and the potted plants
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("조선주 반토막?", "이익은 올랐다") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 6.5s, no card tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: posing an intriguing question to the viewer.
```

---

## s4 — background (10초, board, 입 멈춤 7.6초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the ship-order situation room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 3 lines of
large text — "조선 3사 이익" on the first line, "올해 9.8조" on the second line, "내년 11.8조" on the third line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand points to the board lines one after another from top to bottom without touching it, explaining with a bright, clear expression, while the other hand rests near its hip. The character does not touch or move the board.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 7.6s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 7.6s the character finishes the
sentence. From 7.6s until the end of the clip (10s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
7.6s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The board stays completely still.

STATIC ELEMENTS: the large curved screen wall with small ship icons and wave stripes, the round meeting table, the chairs, and the glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("조선 3사 이익", "올해 9.8조", "내년 11.8조") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 7.6s, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: clearly explaining a forecast.
```

---

## s5 — twist (10초, card2, 입 멈춤 8.9초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the ship-order situation room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "이익은 과거" on the first line, "주가는 미래" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is confident and knowing, with slight nods; only the face and body move while the hands holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 8.9s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 8.9s the character finishes the
sentence. From 8.9s until the end of the clip (10s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
8.9s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large curved screen wall with small ship icons and wave stripes, the round meeting table, the chairs, and the glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("이익은 과거", "주가는 미래") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 8.9s, no card tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: confidently delivering the key answer.
```

---

## s6 — background (10초, board, 입 멈춤 7.4초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the ship-order situation room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 3 lines of
large text — "수주잔고" on the first line, "= 쌓인 주문서" on the second line, "인도 2~3년" on the third line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand gently taps the air toward each line of the board one after another without touching it, explaining calmly, while the other hand rests near its hip. The character does not touch or move the board.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 7.4s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 7.4s the character finishes the
sentence. From 7.4s until the end of the clip (10s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
7.4s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The board stays completely still.

STATIC ELEMENTS: the large curved screen wall with small ship icons and wave stripes, the round meeting table, the chairs, and the glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("수주잔고", "= 쌓인 주문서", "인도 2~3년") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 7.4s, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: calmly explaining a concept.
```

---

## s7 — background (10초, board, 입 멈춤 8.4초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the ship-order situation room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 2 lines of
large text — "한국 수주잔량" on the first line, "세계 18%" on the second line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand points toward the board without touching it, explaining with a clear, reassuring expression, while the other hand rests near its hip. The character does not touch or move the board.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 8.4s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 8.4s the character finishes the
sentence. From 8.4s until the end of the clip (10s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
8.4s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The board stays completely still.

STATIC ELEMENTS: the large curved screen wall with small ship icons and wave stripes, the round meeting table, the chairs, and the glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("한국 수주잔량", "세계 18%") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 8.4s, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: clearly explaining a backlog figure.
```

---

## s8 — twist (10초, board, 입 멈춤 8.0초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the ship-order situation room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 3 lines of
large text — "수주 점유율" on the first line, "한국 16%" on the second line, "중국 76%" on the third line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand points toward the board lines without touching it, with a serious, engaged expression, while the other hand rests near its hip. The character does not touch or move the board.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 8.0s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 8.0s the character finishes the
sentence. From 8.0s until the end of the clip (10s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
8.0s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The board stays completely still.

STATIC ELEMENTS: the large curved screen wall with small ship icons and wave stripes, the round meeting table, the chairs, and the glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("수주 점유율", "한국 16%", "중국 76%") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 8.0s, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: seriously presenting a market share comparison.
```

---

## s9 — twist (10초, card2, 입 멈춤 6.3초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright port-view office
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "한국 7%" on the first line, "중국 85%" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is serious and concerned, eyebrows slightly furrowed; only the face and body move while the hands holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 6.3s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 6.3s the character finishes the
sentence. From 6.3s until the end of the clip (10s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
6.3s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large window with the container yard and dock cranes, the potted plants, the low bookshelves, the globe, and the rug
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("한국 7%", "중국 85%") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 6.3s, no card tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: gravely delivering a worse number.
```

---

## s10 — background (10초, board, 입 멈춤 8.3초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright port-view office
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 3 lines of
large text — "환율" on the first line, "1,550원대" on the second line, "1,350원대" on the third line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand traces down along the board lines without touching it, explaining with a clear, informative expression, while the other hand rests near its hip. The character does not touch or move the board.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 8.3s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 8.3s the character finishes the
sentence. From 8.3s until the end of the clip (10s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
8.3s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The board stays completely still.

STATIC ELEMENTS: the large window with the container yard and dock cranes, the potted plants, the low bookshelves, the globe, and the rug
must stay completely fixed — no camera pan or zoom, no background object
movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("환율", "1,550원대", "1,350원대") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 8.3s, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: clearly explaining an exchange-rate change.
```

---

## s13 — insight (10초, card2, 입 멈춤 6.4초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the shipyard overlook deck
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "일감 말고" on the first line, "새 주문·환율" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is confident and knowing, with slight nods; only the face and body move while the hands holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 6.4s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 6.4s the character finishes the
sentence. From 6.4s until the end of the clip (10s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
6.4s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the giant gantry cranes, the ship hull under construction, the wooden deck floor, the glass railings, and the potted plants
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("일감 말고", "새 주문·환율") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 6.4s, no card tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: confidently delivering the one-line summary.
```

---

## s14 — action (10초, board, 입 멈춤 7.3초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the shipyard overlook deck
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 2 lines of
large text — "① 점유율" on the first line, "② 환율 1,350원" on the second line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand keeps two fingers raised and gives small emphasizing motions, with a clear, helpful expression, while the other hand rests near its hip. The character does not touch or move the board.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 7.3s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 7.3s the character finishes the
sentence. From 7.3s until the end of the clip (10s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
7.3s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The board stays completely still.

STATIC ELEMENTS: the giant gantry cranes, the ship hull under construction, the wooden deck floor, the glass railings, and the potted plants
must stay completely fixed — no camera pan or zoom, no background object
movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("① 점유율", "② 환율 1,350원") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 7.3s, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: clearly listing two things to check.
```

---

## s15 — frame (10초, card2, 입 멈춤 8.4초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright port-view office
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "쫓지 말고" on the first line, "이유를 읽어" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is warm and calm with a gentle smile; only the face and body move while the hands holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 8.4s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 8.4s the character finishes the
sentence. From 8.4s until the end of the clip (10s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
8.4s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large window with the container yard and dock cranes, the potted plants, the low bookshelves, the globe, and the rug
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("쫓지 말고", "이유를 읽어") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 8.4s, no card tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: warmly reassuring the viewer.
```

---

## 완료 후 절차
1. `C:/Users/PC/Downloads/1.mp4`~`17.mp4`(파일럿은 `{n}b.mp4`)로 저장하고 "황소특보 11편 영상 검수해줘"라고 알려주기
2. 검수: 길이·시작/중반/끝 프레임·글자 보존·카메라 + `scripts/check-clip-speech-timing-once.mjs`로 입 멈춤 시각 측정
3. 재생성이 필요한 씬은 같은 프롬프트로 다시 뽑는다(프롬프트 강화로 해결 시도 금지)
