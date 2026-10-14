# (보류 10/13 · 기존 통합 51편) · 황소특보 25편 (이번 달 금리 발표 3개, 결과보다 말투를 읽어라, 16씬) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/bull-ep25-images/`
영상 저장: **장면 번호로** `C:/Users/PC/Downloads/1.mp4` ~ `16.mp4` (CURRENT_STANDARDS §A-6, "황소특보 25편"이라고 알려주기)

생성기: `scripts/build-video-generation-prompts.mjs` (TTS: `C:/tmp/money-shorts-os/bull-ep25-tts/output-v1/elevenlabs-scene-paced-tts-summary.json`, 타임라인 119.48초)

**★ 2026-09-30 변경 — 입 멈춤 시각(SPEECH TIMING):** 씬마다 "몇 초까지만 말하고 그 뒤엔 입을 다문다"를 넣었다
(표의 '입 멈춤'). 받은 영상에서 입이 그 시각 뒤에도 계속 움직이면 검수에서 표시한다. 눈 깜빡임·호흡은 끝까지 유지.

티어는 8초/10초 두 가지뿐. **소품(카드·보드) 씬은 항상 10초**(2026-10-01 — 8초 클립은 끝에서 글자·소품이 사라짐, 황소 12편 s14. 2026-10-08 황소 23편에서 "사용 길이가 짧으면 8초" 시험 → 8초 소품 씬 8개 중 3개가 사용 구간 안에서 카드가 사라져 되돌림). 소품 없는 씬만 발화 8초 미만·여유 1초 이상이면 8초.
**★ 2026-10-01 강화**: SPEECH TIMING을 "구간 2단계(말하는 구간 / 듣는 구간: 입 완전히 닫음·음성 없음)"로 바꾸고 프롬프트 끝에 FINAL REMINDER를 넣었다. 소품 씬엔 "끝 프레임까지 글자 선명, fade/dissolve 금지"를 더했다. 효과는 이 편 검수 때 12편 기준선(15/16 경고, 평균 초과 약 0.9초)과 비교한다.
Gemini(Veo)로 배정하는 씬은 발화와 무관하게 항상 10초(입 멈춤 시각은 그대로).

| 씬 | 이미지 | 저장할 영상 파일명 | 발화(raw) | 입 멈춤 | 티어 | 여유 | 샷 / 배경 | 형태 |
|---|---|---|---|---|---|---|---|---|
| s1 hook | `bull_ep25_s1.png` | `bull_ep25_s1_motion.mp4` | 5.77초 | **6.1초** | **10초** | 4.23초 | medium / A | card2 |
| s2 opening | `bull_ep25_s2.png` | `bull_ep25_s2_motion.mp4` | 3.54초 | **3.6초** | **8초** | 4.46초 | wide / A | open |
| s3 situation_numbers | `bull_ep25_s3.png` | `bull_ep25_s3_motion.mp4` | 8.40초 | **8.5초** | **10초** | 1.60초 | medium / B | card2 |
| s4 event1_warsh | `bull_ep25_s4.png` | `bull_ep25_s4_motion.mp4` | 8.05초 | **8.1초** | **10초** | 1.95초 | medium / B | card2 |
| s5 event2_bok | `bull_ep25_s5.png` | `bull_ep25_s5_motion.mp4` | 6.65초 | **6.8초** | **10초** | 3.35초 | medium / B | card2 |
| s6 event3_fomc | `bull_ep25_s6.png` | `bull_ep25_s6_motion.mp4` | 7.21초 | **7.3초** | **10초** | 2.79초 | medium / B | card2 |
| s7 core_q | `bull_ep25_s7.png` | `bull_ep25_s7_motion.mp4` | 6.58초 | **6.7초** | **10초** | 3.42초 | medium / A | card2 |
| s8 evidence1_concept | `bull_ep25_s8.png` | `bull_ep25_s8_motion.mp4` | 7.94초 | **8.0초** | **10초** | 2.06초 | medium / C | card2 |
| s9 evidence1_reason | `bull_ep25_s9.png` | `bull_ep25_s9_motion.mp4` | 3.95초 | **4.0초** | **10초** | 6.05초 | medium / C | card2 |
| s10 evidence2_us | `bull_ep25_s10.png` | `bull_ep25_s10_motion.mp4` | 6.43초 | **6.5초** | **10초** | 3.57초 | medium / C | card2 |
| s11 evidence2_dotplot | `bull_ep25_s11.png` | `bull_ep25_s11_motion.mp4` | 7.36초 | **7.5초** | **10초** | 2.64초 | medium / C | card2 |
| s12 balance | `bull_ep25_s12.png` | `bull_ep25_s12_motion.mp4` | 5.86초 | **6.0초** | **8초** | 2.14초 | close / A | open |
| s13 insight | `bull_ep25_s13.png` | `bull_ep25_s13_motion.mp4` | 8.01초 | **8.1초** | **10초** | 1.99초 | medium / A | card2 |
| s14 check | `bull_ep25_s14.png` | `bull_ep25_s14_motion.mp4` | 6.71초 | **6.8초** | **10초** | 3.29초 | medium / A | card2 |
| s15 frame | `bull_ep25_s15.png` | `bull_ep25_s15_motion.mp4` | 4.71초 | **4.8초** | **10초** | 5.29초 | medium / A | card2 |
| s16 cta | `bull_ep25_s16.png` | `bull_ep25_s16_motion.mp4` | 5.86초 | **6.0초** | **8초** | 2.14초 | wide / A | open |

★ 영상 생성 절대규칙(`_ai/CURRENT_STANDARDS.md` §0-1): 소품 든 손은 고정·동작은 빈 손에만, 소품은 frozen photograph,
텍스트는 CRITICAL TEXT PRESERVATION, 나레이션 영상이라 "Silent" 금지, "glued" 같은 신체 접착 표현 금지, 바닥 보드 "넘어지지 않음" 이중 명시.

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수** — 시작·중반·끝 프레임의 텍스트·소품·입 멈춤을 확인한다.

================================================================================
# 🟦 8초 티어 (s2, s12, s16)
================================================================================

## s2 — opening (8초, open, 입 멈춤 3.6초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright exhibition hall with three large plain bell sculptures without any marks or text
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character keeps one hand raised with the index finger pointing upward in a confident, friendly gesture while the other hand rests on its hip, smiling brightly and warmly at the viewer. No props held.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 3.6s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 3.6s to the very last frame (4.4 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 3.6s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 3.6s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. No portion of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the three large plain bell sculptures, the large potted plants, and the glossy light beige floor
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 3.6s, no camera zoom, crop, or framing drift at any point.

MOOD: warmly greeting the viewer.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 3.6s. The last 4.4 seconds are silent, with the mouth closed.
```

---

## s12 — counterpoint (8초, open, 입 멈춤 6.0초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright exhibition hall with three large plain bell sculptures without any marks or text
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character rests one hand near its chin with a careful, thoughtful expression and slight head tilts while the other hand rests on its hip. No props held.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 6.0s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 6.0s to the very last frame (2.0 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 6.0s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 6.0s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. No portion of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the three large plain bell sculptures, the large potted plants, and the glossy light beige floor
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 6.0s, no camera zoom, crop, or framing drift at any point.

MOOD: carefully noting a counter-signal.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 6.0s. The last 2.0 seconds are silent, with the mouth closed.
```

---

## s16 — save (8초, open, 입 멈춤 6.0초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright exhibition hall with three large plain bell sculptures without any marks or text
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character smiles brightly and waves one hand lightly in a friendly goodbye while the other hand hangs naturally relaxed. No props held.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 6.0s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 6.0s to the very last frame (2.0 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 6.0s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 6.0s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. No portion of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the three large plain bell sculptures, the large potted plants, and the glossy light beige floor
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 6.0s, no camera zoom, crop, or framing drift at any point.

MOOD: warmly saying goodbye and inviting comments.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 6.0s. The last 2.0 seconds are silent, with the mouth closed.
```

---

================================================================================
# 🟨 10초 티어 (s1, s3, s4, s5, s6, s7, s8, s9, s10, s11, s13, s14, s15)
================================================================================

## s1 — hook (10초, card2, 입 멈춤 6.1초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright exhibition hall with three large plain bell sculptures without any marks or text
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "금리 발표 3개" on the first line, "첫째가 이틀 뒤" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is wide-eyed and curious, eyebrows raised, as if revealing a surprising turn; only the face and body move while the hands holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.2s to 6.1s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 6.1s to the very last frame (3.9 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 6.1s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 6.1s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the three large plain bell sculptures, the large potted plants, and the glossy light beige floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("금리 발표 3개", "첫째가 이틀 뒤") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.
The text must be exactly as dark, sharp and fully readable in the LAST frame as in the FIRST frame.
NO fade-out, NO dissolve, NO cross-fade, NO fade to white, NO washing-out, NO blurring and NO
disappearing of the card or its text at any moment — especially in the final 2 seconds. The clip must
not end with any transition effect; the last frame is a normal frame identical in text to the first.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 6.1s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: posing a surprising question to the viewer.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 6.1s. The last 3.9 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s3 — background (10초, card2, 입 멈춤 8.5초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright stage hall with a low plain round stage and large plain megaphone-shaped sculptures
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "한은 3.00%" on the first line, "연준 3.75~4.00%" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is serious and clear with slight nods, as if reporting these facts; only the face and body move while the hands holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 8.5s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 8.5s to the very last frame (1.5 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 8.5s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 8.5s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the low plain round stage, the large plain megaphone-shaped sculptures without any text, the large potted plants, and the warm light gray glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("한은 3.00%", "연준 3.75~4.00%") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.
The text must be exactly as dark, sharp and fully readable in the LAST frame as in the FIRST frame.
NO fade-out, NO dissolve, NO cross-fade, NO fade to white, NO washing-out, NO blurring and NO
disappearing of the card or its text at any moment — especially in the final 2 seconds. The clip must
not end with any transition effect; the last frame is a normal frame identical in text to the first.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 8.5s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: seriously reporting the facts.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 8.5s. The last 1.5 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s4 — background (10초, card2, 입 멈춤 8.1초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright stage hall with a low plain round stage and large plain megaphone-shaped sculptures
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "① 워시 IMF 대담" on the first line, "16일 낮 12:30경" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is clear and friendly with slight nods, as if explaining this point; only the face and body move while the hands holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 8.1s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 8.1s to the very last frame (1.9 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 8.1s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 8.1s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the low plain round stage, the large plain megaphone-shaped sculptures without any text, the large potted plants, and the warm light gray glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("① 워시 IMF 대담", "16일 낮 12:30경") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.
The text must be exactly as dark, sharp and fully readable in the LAST frame as in the FIRST frame.
NO fade-out, NO dissolve, NO cross-fade, NO fade to white, NO washing-out, NO blurring and NO
disappearing of the card or its text at any moment — especially in the final 2 seconds. The clip must
not end with any transition effect; the last frame is a normal frame identical in text to the first.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 8.1s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: clearly explaining this point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 8.1s. The last 1.9 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s5 — background (10초, card2, 입 멈춤 6.8초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright stage hall with a low plain round stage and large plain megaphone-shaped sculptures
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "② 한은 금통위" on the first line, "22일" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is clear and friendly with slight nods, as if explaining this point; only the face and body move while the hands holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 6.8s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 6.8s to the very last frame (3.2 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 6.8s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 6.8s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the low plain round stage, the large plain megaphone-shaped sculptures without any text, the large potted plants, and the warm light gray glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("② 한은 금통위", "22일") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.
The text must be exactly as dark, sharp and fully readable in the LAST frame as in the FIRST frame.
NO fade-out, NO dissolve, NO cross-fade, NO fade to white, NO washing-out, NO blurring and NO
disappearing of the card or its text at any moment — especially in the final 2 seconds. The clip must
not end with any transition effect; the last frame is a normal frame identical in text to the first.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 6.8s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: clearly explaining this point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 6.8s. The last 3.2 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s6 — background (10초, card2, 입 멈춤 7.3초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright stage hall with a low plain round stage and large plain megaphone-shaped sculptures
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "③ 미국 FOMC" on the first line, "29일 새벽 3시" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is clear and friendly with slight nods, as if explaining this point; only the face and body move while the hands holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 7.3s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 7.3s to the very last frame (2.7 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 7.3s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 7.3s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the low plain round stage, the large plain megaphone-shaped sculptures without any text, the large potted plants, and the warm light gray glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("③ 미국 FOMC", "29일 새벽 3시") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.
The text must be exactly as dark, sharp and fully readable in the LAST frame as in the FIRST frame.
NO fade-out, NO dissolve, NO cross-fade, NO fade to white, NO washing-out, NO blurring and NO
disappearing of the card or its text at any moment — especially in the final 2 seconds. The clip must
not end with any transition effect; the last frame is a normal frame identical in text to the first.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 7.3s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: clearly explaining this point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 7.3s. The last 2.7 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s7 — twist (10초, card2, 입 멈춤 6.7초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright exhibition hall with three large plain bell sculptures without any marks or text
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "안 올려도" on the first line, "말투를 봐야" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is confident and knowing with slight nods; only the face and body move while the hands holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 6.7s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 6.7s to the very last frame (3.3 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 6.7s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 6.7s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the three large plain bell sculptures, the large potted plants, and the glossy light beige floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("안 올려도", "말투를 봐야") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.
The text must be exactly as dark, sharp and fully readable in the LAST frame as in the FIRST frame.
NO fade-out, NO dissolve, NO cross-fade, NO fade to white, NO washing-out, NO blurring and NO
disappearing of the card or its text at any moment — especially in the final 2 seconds. The clip must
not end with any transition effect; the last frame is a normal frame identical in text to the first.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 6.7s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: confidently delivering the key point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 6.7s. The last 3.3 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s8 — evidence (10초, card2, 입 멈춤 8.0초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright garden lounge with large plain pinwheel sculptures and plain weather-vane pillars
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "매파적 동결" on the first line, "올릴 여지는 남김" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is clear and friendly with slight nods, as if explaining this point; only the face and body move while the hands holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 8.0s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 8.0s to the very last frame (2.0 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 8.0s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 8.0s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large plain pinwheel sculptures, the plain weather-vane pillars without any text, the round flower beds, the large potted plants, and the glossy light sky-blue floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("매파적 동결", "올릴 여지는 남김") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.
The text must be exactly as dark, sharp and fully readable in the LAST frame as in the FIRST frame.
NO fade-out, NO dissolve, NO cross-fade, NO fade to white, NO washing-out, NO blurring and NO
disappearing of the card or its text at any moment — especially in the final 2 seconds. The clip must
not end with any transition effect; the last frame is a normal frame identical in text to the first.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 8.0s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: clearly explaining this point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 8.0s. The last 2.0 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s9 — evidence (10초, card2, 입 멈춤 4.0초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright garden lounge with large plain pinwheel sculptures and plain weather-vane pillars
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "한은 7·8월" on the first line, "두 번 인상 관찰" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is serious and clear with slight nods, as if reporting these facts; only the face and body move while the hands holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 4.0s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 4.0s to the very last frame (6.0 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 4.0s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 4.0s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large plain pinwheel sculptures, the plain weather-vane pillars without any text, the round flower beds, the large potted plants, and the glossy light sky-blue floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("한은 7·8월", "두 번 인상 관찰") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.
The text must be exactly as dark, sharp and fully readable in the LAST frame as in the FIRST frame.
NO fade-out, NO dissolve, NO cross-fade, NO fade to white, NO washing-out, NO blurring and NO
disappearing of the card or its text at any moment — especially in the final 2 seconds. The clip must
not end with any transition effect; the last frame is a normal frame identical in text to the first.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 4.0s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: seriously reporting the facts.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 4.0s. The last 6.0 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s10 — evidence (10초, card2, 입 멈춤 6.5초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright garden lounge with large plain pinwheel sculptures and plain weather-vane pillars
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "9월 의사록" on the first line, "추가 인상 가능성" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is serious and clear with slight nods, as if reporting these facts; only the face and body move while the hands holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 6.5s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 6.5s to the very last frame (3.5 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 6.5s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 6.5s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large plain pinwheel sculptures, the plain weather-vane pillars without any text, the round flower beds, the large potted plants, and the glossy light sky-blue floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("9월 의사록", "추가 인상 가능성") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.
The text must be exactly as dark, sharp and fully readable in the LAST frame as in the FIRST frame.
NO fade-out, NO dissolve, NO cross-fade, NO fade to white, NO washing-out, NO blurring and NO
disappearing of the card or its text at any moment — especially in the final 2 seconds. The clip must
not end with any transition effect; the last frame is a normal frame identical in text to the first.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 6.5s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: seriously reporting the facts.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 6.5s. The last 3.5 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s11 — evidence (10초, card2, 입 멈춤 7.5초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright garden lounge with large plain pinwheel sculptures and plain weather-vane pillars
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "10월 FOMC" on the first line, "점도표 없음" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is clear and friendly with slight nods, as if explaining this point; only the face and body move while the hands holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 7.5s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 7.5s to the very last frame (2.5 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 7.5s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 7.5s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large plain pinwheel sculptures, the plain weather-vane pillars without any text, the round flower beds, the large potted plants, and the glossy light sky-blue floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("10월 FOMC", "점도표 없음") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.
The text must be exactly as dark, sharp and fully readable in the LAST frame as in the FIRST frame.
NO fade-out, NO dissolve, NO cross-fade, NO fade to white, NO washing-out, NO blurring and NO
disappearing of the card or its text at any moment — especially in the final 2 seconds. The clip must
not end with any transition effect; the last frame is a normal frame identical in text to the first.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 7.5s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: clearly explaining this point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 7.5s. The last 2.5 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s13 — insight (10초, card2, 입 멈춤 8.1초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright exhibition hall with three large plain bell sculptures without any marks or text
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "이번 달 금리는" on the first line, "결과보다 말투" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is confident and knowing with slight nods; only the face and body move while the hands holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 8.1s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 8.1s to the very last frame (1.9 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 8.1s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 8.1s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the three large plain bell sculptures, the large potted plants, and the glossy light beige floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("이번 달 금리는", "결과보다 말투") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.
The text must be exactly as dark, sharp and fully readable in the LAST frame as in the FIRST frame.
NO fade-out, NO dissolve, NO cross-fade, NO fade to white, NO washing-out, NO blurring and NO
disappearing of the card or its text at any moment — especially in the final 2 seconds. The clip must
not end with any transition effect; the last frame is a normal frame identical in text to the first.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 8.1s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: confidently delivering the key point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 8.1s. The last 1.9 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s14 — action (10초, card2, 입 멈춤 6.8초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright exhibition hall with three large plain bell sculptures without any marks or text
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "① 한은 문구" on the first line, "② FOMC 인상 언급" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is clear and friendly with slight nods, as if explaining this point; only the face and body move while the hands holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 6.8s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 6.8s to the very last frame (3.2 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 6.8s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 6.8s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the three large plain bell sculptures, the large potted plants, and the glossy light beige floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("① 한은 문구", "② FOMC 인상 언급") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.
The text must be exactly as dark, sharp and fully readable in the LAST frame as in the FIRST frame.
NO fade-out, NO dissolve, NO cross-fade, NO fade to white, NO washing-out, NO blurring and NO
disappearing of the card or its text at any moment — especially in the final 2 seconds. The clip must
not end with any transition effect; the last frame is a normal frame identical in text to the first.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 6.8s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: clearly explaining this point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 6.8s. The last 3.2 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s15 — frame (10초, card2, 입 멈춤 4.8초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the bright exhibition hall with three large plain bell sculptures without any marks or text
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "결과만 쫓지 말고" on the first line, "말투를 읽어라" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is warm and calm with a gentle smile; only the face and body move while the hands holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 4.8s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 4.8s to the very last frame (5.2 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 4.8s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 4.8s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the three large plain bell sculptures, the large potted plants, and the glossy light beige floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("결과만 쫓지 말고", "말투를 읽어라") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.
The text must be exactly as dark, sharp and fully readable in the LAST frame as in the FIRST frame.
NO fade-out, NO dissolve, NO cross-fade, NO fade to white, NO washing-out, NO blurring and NO
disappearing of the card or its text at any moment — especially in the final 2 seconds. The clip must
not end with any transition effect; the last frame is a normal frame identical in text to the first.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 4.8s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: warmly reassuring the viewer.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 4.8s. The last 5.2 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## 완료 후 절차
1. `C:/Users/PC/Downloads/1.mp4`~`16.mp4`(파일럿은 `{n}b.mp4`)로 저장하고 "황소특보 25편 영상 검수해줘"라고 알려주기
2. 검수: 길이·시작/중반/끝 프레임·글자 보존·카메라 + `scripts/check-clip-speech-timing-once.mjs`로 입 멈춤 시각 측정
3. 재생성이 필요한 씬은 같은 프롬프트로 다시 뽑는다. 글자 소실·입 멈춤 불이행은 위 강화 문구가 이미 들어 있으니 더 덧붙이지 말고 결과를 기록한다(효과 측정용)
