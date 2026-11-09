# 황소특보 12편 (금리가 뛰는데도 서학개미가 제일 많이 산 건 반도체가 아니었다, 16씬) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/bull-ep12-images/`
영상 저장: **장면 번호로** `C:/Users/PC/Downloads/1.mp4` ~ `16.mp4` (CURRENT_STANDARDS §A-6, "황소특보 12편"이라고 알려주기)

생성기: `scripts/build-video-generation-prompts.mjs` (TTS: `C:/tmp/money-shorts-os/bull-ep12-tts/output-v1/elevenlabs-scene-paced-tts-summary.json`, 타임라인 116.04초)

**★ 2026-09-30 변경 — 입 멈춤 시각(SPEECH TIMING):** 씬마다 "몇 초까지만 말하고 그 뒤엔 입을 다문다"를 넣었다
(표의 '입 멈춤'). 받은 영상에서 입이 그 시각 뒤에도 계속 움직이면 검수에서 표시한다. 눈 깜빡임·호흡은 끝까지 유지.

티어는 8초/10초 두 가지뿐. 발화 8초 미만·여유 1초 이상이면 8초, 그 외 10초, 두 손 카드 씬은 항상 10초.
Gemini(Veo)로 배정하는 씬은 발화와 무관하게 항상 10초(입 멈춤 시각은 그대로).

| 씬 | 이미지 | 저장할 영상 파일명 | 발화(raw) | 입 멈춤 | 티어 | 여유 | 샷 / 배경 | 형태 |
|---|---|---|---|---|---|---|---|---|
| s1 hook | `bull_ep12_s1.png` | `bull_ep12_s1_motion.mp4` | 5.93초 | **6.3초** | **10초** | 4.07초 | medium / A | card2 |
| s2 opening | `bull_ep12_s2.png` | `bull_ep12_s2_motion.mp4` | 5.05초 | **5.2초** | **8초** | 2.95초 | wide / A | open |
| s3 situation_top1 | `bull_ep12_s3.png` | `bull_ep12_s3_motion.mp4` | 7.33초 | **7.4초** | **10초** | 2.67초 | medium / B | board |
| s4 situation_2_3 | `bull_ep12_s4.png` | `bull_ep12_s4_motion.mp4` | 7.57초 | **7.7초** | **10초** | 2.43초 | wide / B | board |
| s5 situation_4_5 | `bull_ep12_s5.png` | `bull_ep12_s5_motion.mp4` | 6.17초 | **6.3초** | **10초** | 3.83초 | medium / B | card2 |
| s6 core_q | `bull_ep12_s6.png` | `bull_ep12_s6_motion.mp4` | 6.66초 | **6.8초** | **10초** | 3.34초 | medium / B | card2 |
| s7 sell_top1 | `bull_ep12_s7.png` | `bull_ep12_s7_motion.mp4` | 6.42초 | **6.5초** | **8초** | 1.58초 | medium / C | board |
| s8 concept_parking | `bull_ep12_s8.png` | `bull_ep12_s8_motion.mp4` | 6.11초 | **6.2초** | **8초** | 1.89초 | wide / C | open |
| s9 link | `bull_ep12_s9.png` | `bull_ep12_s9_motion.mp4` | 5.64초 | **5.7초** | **10초** | 4.36초 | medium / C | card2 |
| s10 evidence1 | `bull_ep12_s10.png` | `bull_ep12_s10_motion.mp4` | 6.34초 | **6.4초** | **8초** | 1.66초 | medium / B | board |
| s11 evidence2 | `bull_ep12_s11.png` | `bull_ep12_s11_motion.mp4` | 6.90초 | **7.0초** | **8초** | 1.10초 | medium / B | board |
| s12 balance | `bull_ep12_s12.png` | `bull_ep12_s12_motion.mp4` | 7.86초 | **8.0초** | **10초** | 2.14초 | close / A | open |
| s13 insight | `bull_ep12_s13.png` | `bull_ep12_s13_motion.mp4` | 4.98초 | **5.1초** | **10초** | 5.02초 | medium / A | card2 |
| s14 check | `bull_ep12_s14.png` | `bull_ep12_s14_motion.mp4` | 6.61초 | **6.7초** | **8초** | 1.39초 | wide / A | board |
| s15 frame | `bull_ep12_s15.png` | `bull_ep12_s15_motion.mp4` | 4.90초 | **5.0초** | **10초** | 5.10초 | medium / C | card2 |
| s16 cta | `bull_ep12_s16.png` | `bull_ep12_s16_motion.mp4` | 6.85초 | **7.0초** | **8초** | 1.15초 | wide / A | open |

★ 영상 생성 절대규칙(`_ai/CURRENT_STANDARDS.md` §0-1): 소품 든 손은 고정·동작은 빈 손에만, 소품은 frozen photograph,
텍스트는 CRITICAL TEXT PRESERVATION, 나레이션 영상이라 "Silent" 금지, "glued" 같은 신체 접착 표현 금지, 바닥 보드 "넘어지지 않음" 이중 명시.

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수** — 시작·중반·끝 프레임의 텍스트·소품·입 멈춤을 확인한다.

================================================================================
# 🟦 8초 티어 (s2, s7, s8, s10, s11, s14, s16)
================================================================================

## s2 — opening (8초, open, 입 멈춤 5.2초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the warm night-view investment lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character keeps one hand raised with the index finger pointing upward in a confident, friendly gesture while the other hand rests on its hip, smiling brightly and warmly at the viewer. No props held.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 5.2s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 5.2s the character finishes the
sentence. From 5.2s until the end of the clip (8s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
5.2s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. No portion of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the large curved glass window with the low-poly night city skyline, the low wooden table, the round armchairs, the large potted plants, and the warm wooden floor
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 5.2s, no camera zoom, crop, or framing drift at any point.

MOOD: warmly greeting the viewer.
```

---

## s7 — background (8초, board, 입 멈춤 6.5초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright lobby overlooking a clean parking lot
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 3 lines of
large text — "순매도 1위" on the first line, "SGOV" on the second line, "91억 원" on the third line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand points toward the board lines without touching it, with a serious, engaged expression, while the other hand rests near its hip. The character does not touch or move the board.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 6.5s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 6.5s the character finishes the
sentence. From 6.5s until the end of the clip (8s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
6.5s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The board stays completely still.

STATIC ELEMENTS: the large window with the low-poly parking lot and a few parked cars, the round potted plants, the low benches, the round rug, and the glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("순매도 1위", "SGOV", "91억 원") as locked, non-regenerating image layers for the full
8 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 6.5s, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: seriously presenting the most sold product.
```

---

## s8 — background (8초, open, 입 멈춤 6.2초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright lobby overlooking a clean parking lot
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character gestures with one hand toward the large window and the parking lot behind it, as if comparing the product to a parking lot, with a bright, friendly explanatory expression while the other hand rests on its hip; no props are held. No props held.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 6.2s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 6.2s the character finishes the
sentence. From 6.2s until the end of the clip (8s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
6.2s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. No portion of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the large window with the low-poly parking lot and a few parked cars, the round potted plants, the low benches, the round rug, and the glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 6.2s, no camera zoom, crop, or framing drift at any point.

MOOD: friendly explaining a parking metaphor.
```

---

## s10 — evidence (8초, board, 입 멈춤 6.4초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the global money-flow situation room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 3 lines of
large text — "쏠림" on the first line, "5곳 중" on the second line, "4곳 기술주" on the third line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand points toward the board lines without touching it, with a clear, informative expression, while the other hand rests near its hip. The character does not touch or move the board.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 6.4s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 6.4s the character finishes the
sentence. From 6.4s until the end of the clip (8s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
6.4s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The board stays completely still.

STATIC ELEMENTS: the large curved screen wall with bold curved flow arrows and small round dots, the round meeting table, the chairs, and the glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("쏠림", "5곳 중", "4곳 기술주") as locked, non-regenerating image layers for the full
8 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 6.4s, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: clearly explaining the concentration.
```

---

## s11 — evidence (8초, board, 입 멈춤 7.0초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the global money-flow situation room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 3 lines of
large text — "KORU" on the first line, "한국 3배" on the second line, "미국 베팅" on the third line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand points toward the board lines without touching it, with a serious, engaged expression, while the other hand rests near its hip. The character does not touch or move the board.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 7.0s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 7.0s the character finishes the
sentence. From 7.0s until the end of the clip (8s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
7.0s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The board stays completely still.

STATIC ELEMENTS: the large curved screen wall with bold curved flow arrows and small round dots, the round meeting table, the chairs, and the glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("KORU", "한국 3배", "미국 베팅") as locked, non-regenerating image layers for the full
8 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 7.0s, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: seriously explaining the Korea bet.
```

---

## s14 — action (8초, board, 입 멈춤 6.7초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the warm night-view investment lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 2 lines of
large text — "① 쏠림 계속?" on the first line, "② 내 종목은?" on the second line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand keeps two fingers raised and gives small emphasizing motions, with a clear, helpful expression, while the other hand rests near its hip. The character does not touch or move the board.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 6.7s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 6.7s the character finishes the
sentence. From 6.7s until the end of the clip (8s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
6.7s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The board stays completely still.

STATIC ELEMENTS: the large curved glass window with the low-poly night city skyline, the low wooden table, the round armchairs, the large potted plants, and the warm wooden floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("① 쏠림 계속?", "② 내 종목은?") as locked, non-regenerating image layers for the full
8 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 6.7s, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: clearly listing two things to check.
```

---

## s16 — save (8초, open, 입 멈춤 7.0초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the warm night-view investment lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character smiles brightly and waves one hand lightly in a friendly goodbye while the other hand hangs naturally relaxed. No props held.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 7.0s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 7.0s the character finishes the
sentence. From 7.0s until the end of the clip (8s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
7.0s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. No portion of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the large curved glass window with the low-poly night city skyline, the low wooden table, the round armchairs, the large potted plants, and the warm wooden floor
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 7.0s, no camera zoom, crop, or framing drift at any point.

MOOD: warmly saying goodbye and inviting comments.
```

---

================================================================================
# 🟨 10초 티어 (s1, s3, s4, s5, s6, s9, s12, s13, s15)
================================================================================

## s1 — hook (10초, card2, 입 멈춤 6.3초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the warm night-view investment lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "서학개미 1위" on the first line, "반도체 아님" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is wide-eyed and puzzled, eyebrows raised, as if asking the viewer what the top pick really was; body and face move gently while the hands holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.2s to 6.3s.
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

STATIC ELEMENTS: the large curved glass window with the low-poly night city skyline, the low wooden table, the round armchairs, the large potted plants, and the warm wooden floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("서학개미 1위", "반도체 아님") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 6.3s, no card tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: posing an intriguing question to the viewer.
```

---

## s3 — background (10초, board, 입 멈춤 7.4초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the global money-flow situation room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 3 lines of
large text — "순매수 1위" on the first line, "메타" on the second line, "517억 원" on the third line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand points toward the board without touching it, with a bright, informative expression, while the other hand rests near its hip. The character does not touch or move the board.

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

STATIC ELEMENTS: the large curved screen wall with bold curved flow arrows and small round dots, the round meeting table, the chairs, and the glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("순매수 1위", "메타", "517억 원") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 7.4s, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: calmly presenting the top figure.
```

---

## s4 — background (10초, board, 입 멈춤 7.7초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the global money-flow situation room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 2 lines of
large text — "2위 샌디스크" on the first line, "3위 KORU" on the second line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand points to the board lines one after another from top to bottom without touching it, explaining with a bright, clear expression, while the other hand rests near its hip. The character does not touch or move the board.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 7.7s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 7.7s the character finishes the
sentence. From 7.7s until the end of the clip (10s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
7.7s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The board stays completely still.

STATIC ELEMENTS: the large curved screen wall with bold curved flow arrows and small round dots, the round meeting table, the chairs, and the glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("2위 샌디스크", "3위 KORU") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 7.7s, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: clearly explaining the next two ranks.
```

---

## s5 — background (10초, card2, 입 멈춤 6.3초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the global money-flow situation room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "4위 알파벳" on the first line, "5위 오라클" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is bright and clear with slight nods; only the face and body move while the hands holding the card stay still.

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

STATIC ELEMENTS: the large curved screen wall with bold curved flow arrows and small round dots, the round meeting table, the chairs, and the glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("4위 알파벳", "5위 오라클") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 6.3s, no card tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: briskly finishing the ranking.
```

---

## s6 — twist (10초, card2, 입 멈춤 6.8초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the global money-flow situation room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "금리 부담보다" on the first line, "AI 기대" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression starts curious with a slight head tilt and turns confident and knowing; only the face and body move while the hands holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 6.8s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 6.8s the character finishes the
sentence. From 6.8s until the end of the clip (10s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
6.8s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large curved screen wall with bold curved flow arrows and small round dots, the round meeting table, the chairs, and the glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("금리 부담보다", "AI 기대") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 6.8s, no card tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: confidently delivering the key answer.
```

---

## s9 — insight (10초, card2, 입 멈춤 5.7초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright lobby overlooking a clean parking lot
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "주차장 돈 줄고" on the first line, "기술주 늘고" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is confident and thoughtful with slight nods; only the face and body move while the hands holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 5.7s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 5.7s the character finishes the
sentence. From 5.7s until the end of the clip (10s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
5.7s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large window with the low-poly parking lot and a few parked cars, the round potted plants, the low benches, the round rug, and the glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("주차장 돈 줄고", "기술주 늘고") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 5.7s, no card tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: thoughtfully connecting the two flows.
```

---

## s12 — counterpoint (10초, open, 입 멈춤 8.0초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the warm night-view investment lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character rests one hand near its chin with a careful, thoughtful expression and slight head tilts while the other hand rests on its hip; no props are held. No props held.

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
gentle head movement. Only the mouth follows the SPEECH TIMING above. No portion of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the large curved glass window with the low-poly night city skyline, the low wooden table, the round armchairs, the large potted plants, and the warm wooden floor
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 8.0s, no camera zoom, crop, or framing drift at any point.

MOOD: carefully noting the caveats.
```

---

## s13 — insight (10초, card2, 입 멈춤 5.1초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the warm night-view investment lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "주차장에서" on the first line, "기술주로" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is confident and knowing with slight nods; only the face and body move while the hands holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 5.1s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 5.1s the character finishes the
sentence. From 5.1s until the end of the clip (10s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
5.1s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large curved glass window with the low-poly night city skyline, the low wooden table, the round armchairs, the large potted plants, and the warm wooden floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("주차장에서", "기술주로") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after 5.1s, no card tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: confidently delivering the one-line summary.
```

---

## s15 — frame (10초, card2, 입 멈춤 5.0초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright lobby overlooking a clean parking lot
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

SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from 0.0s to 5.0s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At 5.0s the character finishes the
sentence. From 5.0s until the end of the clip (10s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
5.0s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large window with the low-poly parking lot and a few parked cars, the round potted plants, the low benches, the round rug, and the glossy floor
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
mid-motion, no talking or lip movement after 5.0s, no card tilt or rotation at any point, no camera zoom, crop, or framing drift at any point.

MOOD: warmly reassuring the viewer.
```

---

## 완료 후 절차
1. `C:/Users/PC/Downloads/1.mp4`~`16.mp4`(파일럿은 `{n}b.mp4`)로 저장하고 "황소특보 12편 영상 검수해줘"라고 알려주기
2. 검수: 길이·시작/중반/끝 프레임·글자 보존·카메라 + `scripts/check-clip-speech-timing-once.mjs`로 입 멈춤 시각 측정
3. 재생성이 필요한 씬은 같은 프롬프트로 다시 뽑는다(프롬프트 강화로 해결 시도 금지)
