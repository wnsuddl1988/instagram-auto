# 부엉박사 표시 25편(파일 ep26) (금리가 바뀌는 주담대 165조, 내 대출은?, 17씬) 영상 생성 프롬프트 — 수동 진행용

**번호 주의: 이 파일의 "표시 25편" = 파일명·폴더의 ep26.**
이미지 소스 폴더: `C:/tmp/owl-ep26-images/`
영상 저장: **장면 번호로** `C:/Users/PC/Downloads/1.mp4` ~ `17.mp4` (CURRENT_STANDARDS §A-6, "부엉박사 표시 25편(파일 ep26)"이라고 알려주기)

생성기: `scripts/build-video-generation-prompts.mjs` (TTS: `C:/tmp/money-shorts-os/owl-ep26-tts/output-v2/elevenlabs-scene-paced-tts-summary.audio-fixed.json`, 타임라인 126.2초)

**★ 2026-09-30 변경 — 입 멈춤 시각(SPEECH TIMING):** 씬마다 "몇 초까지만 말하고 그 뒤엔 입을 다문다"를 넣었다
(표의 '입 멈춤'). 받은 영상에서 입이 그 시각 뒤에도 계속 움직이면 검수에서 표시한다. 눈 깜빡임·호흡은 끝까지 유지.

티어는 8초/10초 두 가지뿐. **소품(카드·보드) 씬은 항상 10초**(2026-10-01 — 8초 클립은 끝에서 글자·소품이 사라짐, 황소 12편 s14. 2026-10-08 황소 23편에서 "사용 길이가 짧으면 8초" 시험 → 8초 소품 씬 8개 중 3개가 사용 구간 안에서 카드가 사라져 되돌림). 소품 없는 씬만 발화 8초 미만·여유 1초 이상이면 8초.
**★ 2026-10-01 강화**: SPEECH TIMING을 "구간 2단계(말하는 구간 / 듣는 구간: 입 완전히 닫음·음성 없음)"로 바꾸고 프롬프트 끝에 FINAL REMINDER를 넣었다. 소품 씬엔 "끝 프레임까지 글자 선명, fade/dissolve 금지"를 더했다. 효과는 이 편 검수 때 12편 기준선(15/16 경고, 평균 초과 약 0.9초)과 비교한다.
Gemini(Veo)로 배정하는 씬은 발화와 무관하게 항상 10초(입 멈춤 시각은 그대로).

| 씬 | 이미지 | 저장할 영상 파일명 | 발화(raw) | 입 멈춤 | 티어 | 여유 | 샷 / 배경 | 형태 |
|---|---|---|---|---|---|---|---|---|
| s1 hook | `owl_ep26_s1.png` | `owl_v2_ep26_s1_hook_motion.mp4` | 6.56초 | **6.9초** | **10초** | 3.44초 | medium / A | card2 |
| s2 opening | `owl_ep26_s2.png` | `owl_v2_ep26_s2_opening_motion.mp4` | 3.29초 | **3.4초** | **8초** | 4.71초 | wide / A | open |
| s3 concept | `owl_ep26_s3.png` | `owl_v2_ep26_s3_concept_motion.mp4` | 5.62초 | **5.7초** | **10초** | 4.38초 | medium / A | card2 |
| s4 situation_source | `owl_ep26_s4.png` | `owl_v2_ep26_s4_situation_source_motion.mp4` | 7.53초 | **7.6초** | **10초** | 2.47초 | medium / B | card2 |
| s5 situation_size | `owl_ep26_s5.png` | `owl_v2_ep26_s5_situation_size_motion.mp4` | 5.14초 | **5.2초** | **10초** | 4.86초 | medium / B | card2 |
| s6 situation_before | `owl_ep26_s6.png` | `owl_v2_ep26_s6_situation_before_motion.mp4` | 5.33초 | **5.4초** | **10초** | 4.67초 | medium / B | card2 |
| s7 situation_now | `owl_ep26_s7.png` | `owl_v2_ep26_s7_situation_now_motion.mp4` | 4.11초 | **4.2초** | **10초** | 5.89초 | medium / B | card2 |
| s8 core_q | `owl_ep26_s8.png` | `owl_v2_ep26_s8_core_q_motion.mp4` | 6.65초 | **6.7초** | **8초** | 1.35초 | wide / B | open |
| s9 point1_check | `owl_ep26_s9.png` | `owl_v2_ep26_s9_point1_check_motion.mp4` | 8.30초 | **8.1초** | **10초** | 1.70초 | medium / C | card2 |
| s10 point2_calc | `owl_ep26_s10.png` | `owl_v2_ep26_s10_point2_calc_motion.mp4` | 8.52초 | **8.6초** | **10초** | 1.48초 | medium / C | card2 |
| s11 point2_example | `owl_ep26_s11.png` | `owl_v2_ep26_s11_point2_example_motion.mp4` | 6.24초 | **6.3초** | **10초** | 3.76초 | medium / C | card2 |
| s12 point2_scale | `owl_ep26_s12.png` | `owl_v2_ep26_s12_point2_scale_motion.mp4` | 7.78초 | **7.9초** | **10초** | 2.22초 | medium / C | card2 |
| s13 point3_fixed | `owl_ep26_s13.png` | `owl_v2_ep26_s13_point3_fixed_motion.mp4` | 9.36초 | **9.5초** | **10초** | 0.64초 | medium / C | card2 |
| s14 caution | `owl_ep26_s14.png` | `owl_v2_ep26_s14_caution_motion.mp4` | 6.36초 | **6.5초** | **8초** | 1.64초 | wide / C | open |
| s15 summary | `owl_ep26_s15.png` | `owl_v2_ep26_s15_summary_motion.mp4` | 7.31초 | **7.4초** | **10초** | 2.69초 | medium / A | card2 |
| s16 check_two | `owl_ep26_s16.png` | `owl_v2_ep26_s16_check_two_motion.mp4` | 7.08초 | **7.2초** | **10초** | 2.92초 | wide / A | open |
| s17 save | `owl_ep26_s17.png` | `owl_v2_ep26_s17_save_motion.mp4` | 6.03초 | **6.1초** | **8초** | 1.97초 | wide / A | open |

★ 영상 생성 절대규칙(`_ai/CURRENT_STANDARDS.md` §0-1): 소품 든 손은 고정·동작은 빈 손에만, 소품은 frozen photograph,
텍스트는 CRITICAL TEXT PRESERVATION, 나레이션 영상이라 "Silent" 금지, "glued" 같은 신체 접착 표현 금지, 바닥 보드 "넘어지지 않음" 이중 명시.

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수** — 시작·중반·끝 프레임의 텍스트·소품·입 멈춤을 확인한다.

================================================================================
# 🟦 8초 티어 (s2, s8, s14, s17)
================================================================================

## s2 — opening (8초, open, 입 멈춤 3.4초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright model house exhibition lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character raises one wing slightly in a friendly greeting while the other wing hangs naturally, smiling calmly and warmly at the viewer; no props are held. No props held.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 3.4s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 3.4s to the very last frame (4.6 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 3.4s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 3.4s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. No portion of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the small plain model houses without any letters, the large plain key-shaped sculpture, the large potted plants, and the warm light beige glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 3.4s, no camera zoom, crop, or framing drift at any point.

MOOD: warmly greeting the viewer.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 3.4s. The last 4.6 seconds are silent, with the mouth closed.
```

---

## s8 — core_question (8초, open, 입 멈춤 6.7초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright outdoor plaza with plain round podiums and a round bridge sculpture
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character's expression starts curious with a slight head tilt and turns confident while one wing lifts in an explaining gesture and the other hangs naturally; no props are held. No props held.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 6.7s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 6.7s to the very last frame (1.3 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 6.7s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 6.7s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. No portion of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the plain round podiums of different heights, the round bridge sculpture without any marks, the round potted plants, and the light gray stone floor with round flower beds
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 6.7s, no camera zoom, crop, or framing drift at any point.

MOOD: confidently giving the key answer.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 6.7s. The last 1.3 seconds are silent, with the mouth closed.
```

---

## s14 — condition (8초, open, 입 멈춤 6.5초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright garden gallery with a plain forked-path flower bed sculpture
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character's expression is careful and firm, eyebrows slightly furrowed, while one wing lifts in a hold-on gesture as if warning the viewer and the other hangs naturally; no props are held. No props held.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 6.5s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 6.5s to the very last frame (1.5 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 6.5s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 6.5s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. No portion of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the forked-path flower bed sculpture, the plain signpost-like pillars without any text, the large potted plants, and the glossy light mint floor
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 6.5s, no camera zoom, crop, or framing drift at any point.

MOOD: firmly cautioning the viewer.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 6.5s. The last 1.5 seconds are silent, with the mouth closed.
```

---

## s17 — save (8초, open, 입 멈춤 6.1초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright model house exhibition lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character smiles brightly and waves one wing lightly in a friendly goodbye while the other wing hangs naturally relaxed; no props are held. No props held.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 6.1s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 6.1s to the very last frame (1.9 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 6.1s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 6.1s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. No portion of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the small plain model houses without any letters, the large plain key-shaped sculpture, the large potted plants, and the warm light beige glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 6.1s, no camera zoom, crop, or framing drift at any point.

MOOD: warmly saying goodbye and inviting comments.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 6.1s. The last 1.9 seconds are silent, with the mouth closed.
```

---

================================================================================
# 🟨 10초 티어 (s1, s3, s4, s5, s6, s7, s9, s10, s11, s12, s13, s15, s16)
================================================================================

## s1 — hook (10초, card2, 입 멈춤 6.9초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright model house exhibition lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "금리 바뀌는" on the first line, "주담대 165조" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: wide-eyed and curious, eyebrows raised, as if revealing a surprising turn; only the face and body move while the wings holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.2s to 6.9s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 6.9s to the very last frame (3.1 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 6.9s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 6.9s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the small plain model houses without any letters, the large plain key-shaped sculpture, the large potted plants, and the warm light beige glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("금리 바뀌는", "주담대 165조") as locked, non-regenerating image layers for the full
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
mid-motion, no talking, voice, mumbling or lip movement after 6.9s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: posing a surprising question to the viewer.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 6.9s. The last 3.1 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s3 — fact (10초, card2, 입 멈춤 5.7초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright model house exhibition lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "금리 리셋이란" on the first line, "고정 끝, 새 금리" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: clear and friendly with slight nods, as if explaining this point; only the face and body move while the wings holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 5.7s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 5.7s to the very last frame (4.3 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 5.7s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 5.7s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the small plain model houses without any letters, the large plain key-shaped sculpture, the large potted plants, and the warm light beige glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("금리 리셋이란", "고정 끝, 새 금리") as locked, non-regenerating image layers for the full
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
mid-motion, no talking, voice, mumbling or lip movement after 5.7s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: clearly explaining this point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 5.7s. The last 4.3 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s4 — fact (10초, card2, 입 멈춤 7.6초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright outdoor plaza with plain round podiums and a round bridge sculpture
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "금감원 자료" on the first line, "4분기 금리 변경" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: serious and clear with slight nods, as if reporting these facts; only the face and body move while the wings holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 7.6s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 7.6s to the very last frame (2.4 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 7.6s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 7.6s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the plain round podiums of different heights, the round bridge sculpture without any marks, the round potted plants, and the light gray stone floor with round flower beds
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("금감원 자료", "4분기 금리 변경") as locked, non-regenerating image layers for the full
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
mid-motion, no talking, voice, mumbling or lip movement after 7.6s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: seriously reporting the facts.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 7.6s. The last 2.4 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s5 — fact (10초, card2, 입 멈춤 5.2초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright outdoor plaza with plain round podiums and a round bridge sculpture
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "3분기보다 +21조" on the first line, "내년·내후년보다 큼" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: serious and clear with slight nods, as if reporting these facts; only the face and body move while the wings holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 5.2s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 5.2s to the very last frame (4.8 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 5.2s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 5.2s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the plain round podiums of different heights, the round bridge sculpture without any marks, the round potted plants, and the light gray stone floor with round flower beds
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("3분기보다 +21조", "내년·내후년보다 큼") as locked, non-regenerating image layers for the full
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
mid-motion, no talking, voice, mumbling or lip movement after 5.2s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: seriously reporting the facts.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 5.2s. The last 4.8 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s6 — fact (10초, card2, 입 멈춤 5.4초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright outdoor plaza with plain round podiums and a round bridge sculpture
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "2021년 2분기" on the first line, "평균 2.70%" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: clear and friendly with slight nods, as if explaining this point; only the face and body move while the wings holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 5.4s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 5.4s to the very last frame (4.6 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 5.4s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 5.4s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the plain round podiums of different heights, the round bridge sculpture without any marks, the round potted plants, and the light gray stone floor with round flower beds
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("2021년 2분기", "평균 2.70%") as locked, non-regenerating image layers for the full
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
mid-motion, no talking, voice, mumbling or lip movement after 5.4s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: clearly explaining this point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 5.4s. The last 4.6 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s7 — fact (10초, card2, 입 멈춤 4.2초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright outdoor plaza with plain round podiums and a round bridge sculpture
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "올해 2분기" on the first line, "평균 4.26%" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: serious and clear with slight nods, as if reporting these facts; only the face and body move while the wings holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 4.2s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 4.2s to the very last frame (5.8 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 4.2s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 4.2s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the plain round podiums of different heights, the round bridge sculpture without any marks, the round potted plants, and the light gray stone floor with round flower beds
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("올해 2분기", "평균 4.26%") as locked, non-regenerating image layers for the full
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
mid-motion, no talking, voice, mumbling or lip movement after 4.2s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: seriously reporting the facts.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 4.2s. The last 5.8 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s9 — evidence (10초, card2, 입 멈춤 8.1초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright garden gallery with a plain forked-path flower bed sculpture
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "첫째 내 대출" on the first line, "재산정 날짜 확인" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: clear and friendly with slight nods, as if explaining this point; only the face and body move while the wings holding the card stay still.

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

STATIC ELEMENTS: the forked-path flower bed sculpture, the plain signpost-like pillars without any text, the large potted plants, and the glossy light mint floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("첫째 내 대출", "재산정 날짜 확인") as locked, non-regenerating image layers for the full
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

## s10 — evidence (10초, card2, 입 멈춤 8.6초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright garden gallery with a plain forked-path flower bed sculpture
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "금리 +1.56%p" on the first line, "1억당 월 +8.7만" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: clear and friendly with slight nods, as if explaining this point; only the face and body move while the wings holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 8.6s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 8.6s to the very last frame (1.4 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 8.6s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 8.6s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the forked-path flower bed sculpture, the plain signpost-like pillars without any text, the large potted plants, and the glossy light mint floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("금리 +1.56%p", "1억당 월 +8.7만") as locked, non-regenerating image layers for the full
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
mid-motion, no talking, voice, mumbling or lip movement after 8.6s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: clearly explaining this point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 8.6s. The last 1.4 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s11 — evidence (10초, card2, 입 멈춤 6.3초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright garden gallery with a plain forked-path flower bed sculpture
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "3억 · 30년이면" on the first line, "월 약 26만 원 ↑" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: serious and clear with slight nods, as if reporting these facts; only the face and body move while the wings holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 6.3s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 6.3s to the very last frame (3.7 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 6.3s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 6.3s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the forked-path flower bed sculpture, the plain signpost-like pillars without any text, the large potted plants, and the glossy light mint floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("3억 · 30년이면", "월 약 26만 원 ↑") as locked, non-regenerating image layers for the full
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
mid-motion, no talking, voice, mumbling or lip movement after 6.3s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: seriously reporting the facts.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 6.3s. The last 3.7 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s12 — evidence (10초, card2, 입 멈춤 7.9초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright garden gallery with a plain forked-path flower bed sculpture
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "전부 5년 주기면" on the first line, "연 1.7조 증가" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: serious and clear with slight nods, as if reporting these facts; only the face and body move while the wings holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 7.9s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 7.9s to the very last frame (2.1 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 7.9s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 7.9s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the forked-path flower bed sculpture, the plain signpost-like pillars without any text, the large potted plants, and the glossy light mint floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("전부 5년 주기면", "연 1.7조 증가") as locked, non-regenerating image layers for the full
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
mid-motion, no talking, voice, mumbling or lip movement after 7.9s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: seriously reporting the facts.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 7.9s. The last 2.1 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s13 — evidence (10초, card2, 입 멈춤 9.5초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright garden gallery with a plain forked-path flower bed sculpture
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "고정형 2.83%" on the first line, "변동형 4.10%" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: clear and friendly with slight nods, as if explaining this point; only the face and body move while the wings holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 9.5s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 9.5s to the very last frame (0.5 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 9.5s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 9.5s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the forked-path flower bed sculpture, the plain signpost-like pillars without any text, the large potted plants, and the glossy light mint floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("고정형 2.83%", "변동형 4.10%") as locked, non-regenerating image layers for the full
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
mid-motion, no talking, voice, mumbling or lip movement after 9.5s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: clearly explaining this point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 9.5s. The last 0.5 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s15 — action (10초, card2, 입 멈춤 7.4초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright model house exhibition lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "금리 리셋은" on the first line, "내 대출의 날짜" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: confident and knowing with slight nods; only the face and body move while the wings holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 7.4s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 7.4s to the very last frame (2.6 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 7.4s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 7.4s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the small plain model houses without any letters, the large plain key-shaped sculpture, the large potted plants, and the warm light beige glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("금리 리셋은", "내 대출의 날짜") as locked, non-regenerating image layers for the full
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
mid-motion, no talking, voice, mumbling or lip movement after 7.4s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: confidently delivering the key point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 7.4s. The last 2.6 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s16 — action (10초, open, 입 멈춤 7.2초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright model house exhibition lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character lifts one wing and ticks off two points one after the other with a clear, friendly explanatory expression while the other wing hangs naturally; no props are held. No props held.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 7.2s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 7.2s to the very last frame (2.8 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 7.2s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 7.2s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. No portion of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the small plain model houses without any letters, the large plain key-shaped sculpture, the large potted plants, and the warm light beige glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 7.2s, no camera zoom, crop, or framing drift at any point.

MOOD: clearly pointing out the two things to check.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 7.2s. The last 2.8 seconds are silent, with the mouth closed.
```

---

## 완료 후 절차
1. `C:/Users/PC/Downloads/1.mp4`~`17.mp4`(파일럿은 `{n}b.mp4`)로 저장하고 "부엉박사 표시 25편(파일 ep26) 영상 검수해줘"라고 알려주기
2. 검수: 길이·시작/중반/끝 프레임·글자 보존·카메라 + `scripts/check-clip-speech-timing-once.mjs`로 입 멈춤 시각 측정
3. 재생성이 필요한 씬은 같은 프롬프트로 다시 뽑는다. 글자 소실·입 멈춤 불이행은 위 강화 문구가 이미 들어 있으니 더 덧붙이지 말고 결과를 기록한다(효과 측정용)
