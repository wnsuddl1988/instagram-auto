# 통합 52편 · 부엉박사 표시 27편(파일 ep28) (잠자는 돈 15.7조, 내 몫 찾는 법, 17씬) 영상 생성 프롬프트 — 수동 진행용

**번호 주의: 이 파일의 "표시 27편" = 파일명·폴더의 ep28.**
이미지 소스 폴더: `C:/tmp/owl-v2-ep28-images/`
영상 저장: **장면 번호로** `C:/Users/PC/Downloads/1.mp4` ~ `17.mp4` (CURRENT_STANDARDS §A-6, "부엉박사 표시 27편(파일 ep28)"이라고 알려주기)

생성기: `scripts/build-video-generation-prompts.mjs` (TTS: `C:/tmp/money-shorts-os/owl-ep28-tts/output-v1/elevenlabs-scene-paced-tts-summary.json`, 타임라인 121.32초)

**★ 2026-09-30 변경 — 입 멈춤 시각(SPEECH TIMING):** 씬마다 "몇 초까지만 말하고 그 뒤엔 입을 다문다"를 넣었다
(표의 '입 멈춤'). 받은 영상에서 입이 그 시각 뒤에도 계속 움직이면 검수에서 표시한다. 눈 깜빡임·호흡은 끝까지 유지.

티어는 8초/10초 두 가지뿐. **소품(카드·보드) 씬은 항상 10초**(2026-10-01 — 8초 클립은 끝에서 글자·소품이 사라짐, 황소 12편 s14. 2026-10-08 황소 23편에서 "사용 길이가 짧으면 8초" 시험 → 8초 소품 씬 8개 중 3개가 사용 구간 안에서 카드가 사라져 되돌림). 소품 없는 씬만 발화 8초 미만·여유 1초 이상이면 8초.
**★ 2026-10-01 강화**: SPEECH TIMING을 "구간 2단계(말하는 구간 / 듣는 구간: 입 완전히 닫음·음성 없음)"로 바꾸고 프롬프트 끝에 FINAL REMINDER를 넣었다. 소품 씬엔 "끝 프레임까지 글자 선명, fade/dissolve 금지"를 더했다. 효과는 이 편 검수 때 12편 기준선(15/16 경고, 평균 초과 약 0.9초)과 비교한다.
Gemini(Veo)로 배정하는 씬은 발화와 무관하게 항상 10초(입 멈춤 시각은 그대로).

| 씬 | 이미지 | 저장할 영상 파일명 | 발화(raw) | 입 멈춤 | 티어 | 여유 | 샷 / 배경 | 형태 |
|---|---|---|---|---|---|---|---|---|
| s1 hook | `owl_ep28_s1.png` | `owl_v2_ep28_s1_hook_motion.mp4` | 6.82초 | **7.1초** | **10초** | 3.18초 | medium / A | card2 |
| s2 opening | `owl_ep28_s2.png` | `owl_v2_ep28_s2_opening_motion.mp4` | 3.66초 | **3.8초** | **8초** | 4.34초 | wide / A | open |
| s3 concept | `owl_ep28_s3.png` | `owl_v2_ep28_s3_concept_motion.mp4` | 4.54초 | **4.6초** | **10초** | 5.46초 | medium / A | card2 |
| s4 concept_terms | `owl_ep28_s4.png` | `owl_v2_ep28_s4_concept_terms_motion.mp4` | 5.54초 | **5.6초** | **10초** | 4.46초 | medium / A | card2 |
| s5 situation_source | `owl_ep28_s5.png` | `owl_v2_ep28_s5_situation_source_motion.mp4` | 5.13초 | **5.2초** | **10초** | 4.87초 | medium / B | card2 |
| s6 situation_split | `owl_ep28_s6.png` | `owl_v2_ep28_s6_situation_split_motion.mp4` | 4.55초 | **4.7초** | **10초** | 5.45초 | medium / B | card2 |
| s7 situation_types | `owl_ep28_s7.png` | `owl_v2_ep28_s7_situation_types_motion.mp4` | 6.25초 | **6.4초** | **10초** | 3.75초 | medium / B | card2 |
| s8 situation_expiry | `owl_ep28_s8.png` | `owl_v2_ep28_s8_situation_expiry_motion.mp4` | 6.81초 | **6.9초** | **10초** | 3.19초 | medium / B | card2 |
| s9 core_q | `owl_ep28_s9.png` | `owl_v2_ep28_s9_core_q_motion.mp4` | 5.13초 | **5.2초** | **8초** | 2.87초 | wide / B | open |
| s10 point1 | `owl_ep28_s10.png` | `owl_v2_ep28_s10_point1_motion.mp4` | 8.91초 | **9.0초** | **10초** | 1.09초 | medium / C | card2 |
| s11 point2 | `owl_ep28_s11.png` | `owl_v2_ep28_s11_point2_motion.mp4` | 7.89초 | **8.0초** | **10초** | 2.11초 | medium / C | card2 |
| s12 point2_apply | `owl_ep28_s12.png` | `owl_v2_ep28_s12_point2_apply_motion.mp4` | 4.46초 | **4.6초** | **10초** | 5.54초 | medium / C | card2 |
| s13 point3 | `owl_ep28_s13.png` | `owl_v2_ep28_s13_point3_motion.mp4` | 7.68초 | **7.8초** | **10초** | 2.32초 | medium / C | card2 |
| s14 caution | `owl_ep28_s14.png` | `owl_v2_ep28_s14_caution_motion.mp4` | 6.35초 | **6.4초** | **8초** | 1.65초 | wide / C | open |
| s15 summary | `owl_ep28_s15.png` | `owl_v2_ep28_s15_summary_motion.mp4` | 7.52초 | **7.6초** | **10초** | 2.48초 | medium / A | card2 |
| s16 check_two | `owl_ep28_s16.png` | `owl_v2_ep28_s16_check_two_motion.mp4` | 8.04초 | **8.1초** | **10초** | 1.96초 | wide / A | open |
| s17 save | `owl_ep28_s17.png` | `owl_v2_ep28_s17_save_motion.mp4` | 6.03초 | **6.1초** | **8초** | 1.97초 | wide / A | open |

★ 영상 생성 절대규칙(`_ai/CURRENT_STANDARDS.md` §0-1): 소품 든 손은 고정·동작은 빈 손에만, 소품은 frozen photograph,
텍스트는 CRITICAL TEXT PRESERVATION, 나레이션 영상이라 "Silent" 금지, "glued" 같은 신체 접착 표현 금지, 바닥 보드 "넘어지지 않음" 이중 명시.

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수** — 시작·중반·끝 프레임의 텍스트·소품·입 멈춤을 확인한다.

================================================================================
# 🟦 8초 티어 (s2, s9, s14, s17)
================================================================================

## s2 — opening (8초, open, 입 멈춤 3.8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright moonlit garden lounge with plain crescent moon and star sculptures and round cushion beds
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character raises one wing slightly in a friendly greeting while the other wing hangs naturally, smiling calmly and warmly at the viewer; no props are held. No props held.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 3.8s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 3.8s to the very last frame (4.2 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 3.8s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 3.8s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. No portion of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the large plain crescent moon and star sculptures, the round cushion beds, the large potted plants, and the glossy light indigo floor
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 3.8s, no camera zoom, crop, or framing drift at any point.

MOOD: warmly greeting the viewer.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 3.8s. The last 4.2 seconds are silent, with the mouth closed.
```

---

## s9 — core_question (8초, open, 입 멈춤 5.2초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright clean gallery with large plain chest-of-drawers sculptures with a few drawers slightly open
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character's expression starts curious with a slight head tilt and turns confident while one wing lifts in an explaining gesture and the other hangs naturally; no props are held. No props held.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 5.2s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 5.2s to the very last frame (2.8 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 5.2s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 5.2s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. No portion of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the large plain chest-of-drawers sculptures with only handles and no labels, the large potted plants, and the light cream glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 5.2s, no camera zoom, crop, or framing drift at any point.

MOOD: confidently giving the key answer.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 5.2s. The last 2.8 seconds are silent, with the mouth closed.
```

---

## s14 — condition (8초, open, 입 멈춤 6.4초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright search hall with large plain magnifying glass sculptures and round lens-shaped pillars
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character's expression is careful and firm, eyebrows slightly furrowed, while one wing lifts in a hold-on gesture as if warning the viewer and the other hangs naturally; no props are held. No props held.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 6.4s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 6.4s to the very last frame (1.6 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 6.4s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 6.4s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. No portion of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the large plain magnifying glass sculptures, the round lens-shaped pillars without any marks, the large potted plants, and the glossy light mint floor
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 6.4s, no camera zoom, crop, or framing drift at any point.

MOOD: firmly cautioning the viewer.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 6.4s. The last 1.6 seconds are silent, with the mouth closed.
```

---

## s17 — save (8초, open, 입 멈춤 6.1초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright moonlit garden lounge with plain crescent moon and star sculptures and round cushion beds
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

STATIC ELEMENTS: the large plain crescent moon and star sculptures, the round cushion beds, the large potted plants, and the glossy light indigo floor
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
# 🟨 10초 티어 (s1, s3, s4, s5, s6, s7, s8, s10, s11, s12, s13, s15, s16)
================================================================================

## s1 — hook (10초, card2, 입 멈춤 7.1초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright moonlit garden lounge with plain crescent moon and star sculptures and round cushion beds
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "잠자는 금융자산" on the first line, "15.7조 원" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: wide-eyed and curious, eyebrows raised, as if revealing a surprising turn; only the face and body move while the wings holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.1s to 7.1s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 7.1s to the very last frame (2.9 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 7.1s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 7.1s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large plain crescent moon and star sculptures, the round cushion beds, the large potted plants, and the glossy light indigo floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("잠자는 금융자산", "15.7조 원") as locked, non-regenerating image layers for the full
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
mid-motion, no talking, voice, mumbling or lip movement after 7.1s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: posing a surprising question to the viewer.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 7.1s. The last 2.9 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s3 — fact (10초, card2, 입 멈춤 4.6초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright moonlit garden lounge with plain crescent moon and star sculptures and round cushion beds
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "잠자는 금융자산" on the first line, "안 쓴 예금·보험금" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: clear and friendly with slight nods, as if explaining this point; only the face and body move while the wings holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 4.6s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 4.6s to the very last frame (5.4 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 4.6s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 4.6s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large plain crescent moon and star sculptures, the round cushion beds, the large potted plants, and the glossy light indigo floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("잠자는 금융자산", "안 쓴 예금·보험금") as locked, non-regenerating image layers for the full
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
mid-motion, no talking, voice, mumbling or lip movement after 4.6s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: clearly explaining this point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 4.6s. The last 5.4 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s4 — fact (10초, card2, 입 멈춤 5.6초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright moonlit garden lounge with plain crescent moon and star sculptures and round cushion beds
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "휴면은 시효 지남" on the first line, "장기미거래 3년 넘음" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: clear and friendly with slight nods, as if explaining this point; only the face and body move while the wings holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 5.6s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 5.6s to the very last frame (4.4 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 5.6s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 5.6s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large plain crescent moon and star sculptures, the round cushion beds, the large potted plants, and the glossy light indigo floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("휴면은 시효 지남", "장기미거래 3년 넘음") as locked, non-regenerating image layers for the full
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
mid-motion, no talking, voice, mumbling or lip movement after 5.6s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: clearly explaining this point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 5.6s. The last 4.4 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s5 — fact (10초, card2, 입 멈춤 5.2초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright clean gallery with large plain chest-of-drawers sculptures with a few drawers slightly open
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "금융위·금감원" on the first line, "9월 28일 발표" on the second line — in both hands at chest height. The card
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

STATIC ELEMENTS: the large plain chest-of-drawers sculptures with only handles and no labels, the large potted plants, and the light cream glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("금융위·금감원", "9월 28일 발표") as locked, non-regenerating image layers for the full
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

## s6 — fact (10초, card2, 입 멈춤 4.7초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright clean gallery with large plain chest-of-drawers sculptures with a few drawers slightly open
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "휴면 1.5조" on the first line, "장기미거래 14.2조" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: serious and clear with slight nods, as if reporting these facts; only the face and body move while the wings holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 4.7s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 4.7s to the very last frame (5.3 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 4.7s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 4.7s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large plain chest-of-drawers sculptures with only handles and no labels, the large potted plants, and the light cream glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("휴면 1.5조", "장기미거래 14.2조") as locked, non-regenerating image layers for the full
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
mid-motion, no talking, voice, mumbling or lip movement after 4.7s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: seriously reporting the facts.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 4.7s. The last 5.3 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s7 — fact (10초, card2, 입 멈춤 6.4초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright clean gallery with large plain chest-of-drawers sculptures with a few drawers slightly open
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "예·적금 7.8조" on the first line, "보험금 5.8조" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: clear and friendly with slight nods, as if explaining this point; only the face and body move while the wings holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 6.4s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 6.4s to the very last frame (3.6 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 6.4s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 6.4s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large plain chest-of-drawers sculptures with only handles and no labels, the large potted plants, and the light cream glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("예·적금 7.8조", "보험금 5.8조") as locked, non-regenerating image layers for the full
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
mid-motion, no talking, voice, mumbling or lip movement after 6.4s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: clearly explaining this point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 6.4s. The last 3.6 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s8 — fact (10초, card2, 입 멈춤 6.9초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright clean gallery with large plain chest-of-drawers sculptures with a few drawers slightly open
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "소멸시효 지나도" on the first line, "돈은 안 사라진다" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: clear and pleasantly surprised with slight nods, as if revealing the amount; only the face and body move while the wings holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 6.9s: the character speaks. The mouth actively opens and
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

STATIC ELEMENTS: the large plain chest-of-drawers sculptures with only handles and no labels, the large potted plants, and the light cream glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("소멸시효 지나도", "돈은 안 사라진다") as locked, non-regenerating image layers for the full
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

MOOD: clearly revealing the amount.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 6.9s. The last 3.1 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s10 — evidence (10초, card2, 입 멈춤 9.0초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright search hall with large plain magnifying glass sculptures and round lens-shaped pillars
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "첫째 어카운트인포" on the first line, "계좌 한 번에 조회" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: clear and friendly with slight nods, as if explaining this point; only the face and body move while the wings holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 9.0s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 9.0s to the very last frame (1.0 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 9.0s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 9.0s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large plain magnifying glass sculptures, the round lens-shaped pillars without any marks, the large potted plants, and the glossy light mint floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("첫째 어카운트인포", "계좌 한 번에 조회") as locked, non-regenerating image layers for the full
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
mid-motion, no talking, voice, mumbling or lip movement after 9.0s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: clearly explaining this point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 9.0s. The last 1.0 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s11 — evidence (10초, card2, 입 멈춤 8.0초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright search hall with large plain magnifying glass sculptures and round lens-shaped pillars
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "둘째 파인" on the first line, "휴면예금·보험금" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: clear and friendly with slight nods, as if explaining this point; only the face and body move while the wings holding the card stay still.

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

STATIC ELEMENTS: the large plain magnifying glass sculptures, the round lens-shaped pillars without any marks, the large potted plants, and the glossy light mint floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("둘째 파인", "휴면예금·보험금") as locked, non-regenerating image layers for the full
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

## s12 — evidence (10초, card2, 입 멈춤 4.6초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright search hall with large plain magnifying glass sculptures and round lens-shaped pillars
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "휴면예금 찾기" on the first line, "지급 신청까지" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: clear and friendly with slight nods, as if explaining this point; only the face and body move while the wings holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 4.6s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 4.6s to the very last frame (5.4 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 4.6s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 4.6s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large plain magnifying glass sculptures, the round lens-shaped pillars without any marks, the large potted plants, and the glossy light mint floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("휴면예금 찾기", "지급 신청까지") as locked, non-regenerating image layers for the full
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
mid-motion, no talking, voice, mumbling or lip movement after 4.6s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: clearly explaining this point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 4.6s. The last 5.4 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s13 — evidence (10초, card2, 입 멈춤 7.8초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright search hall with large plain magnifying glass sculptures and round lens-shaped pillars
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "셋째 가족도" on the first line, "부모님이 직접 인증" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: clear and friendly with slight nods, as if explaining this point; only the face and body move while the wings holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 7.8s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 7.8s to the very last frame (2.2 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 7.8s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 7.8s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large plain magnifying glass sculptures, the round lens-shaped pillars without any marks, the large potted plants, and the glossy light mint floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("셋째 가족도", "부모님이 직접 인증") as locked, non-regenerating image layers for the full
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
mid-motion, no talking, voice, mumbling or lip movement after 7.8s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: clearly explaining this point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 7.8s. The last 2.2 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s15 — action (10초, card2, 입 멈춤 7.6초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright moonlit garden lounge with plain crescent moon and star sculptures and round cushion beds
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "잠자는 돈은" on the first line, "내가 안 찾은 돈" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: confident and knowing with slight nods; only the face and body move while the wings holding the card stay still.

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

STATIC ELEMENTS: the large plain crescent moon and star sculptures, the round cushion beds, the large potted plants, and the glossy light indigo floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("잠자는 돈은", "내가 안 찾은 돈") as locked, non-regenerating image layers for the full
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

MOOD: confidently delivering the key point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 7.6s. The last 2.4 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s16 — action (10초, open, 입 멈춤 8.1초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright moonlit garden lounge with plain crescent moon and star sculptures and round cushion beds
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character lifts one wing and ticks off two points one after the other with a clear, friendly explanatory expression while the other wing hangs naturally; no props are held. No props held.

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
gentle head movement. Only the mouth follows the SPEECH TIMING above. No portion of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the large plain crescent moon and star sculptures, the round cushion beds, the large potted plants, and the glossy light indigo floor
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 8.1s, no camera zoom, crop, or framing drift at any point.

MOOD: clearly pointing out the two things to check.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 8.1s. The last 1.9 seconds are silent, with the mouth closed.
```

---

## 완료 후 절차
1. `C:/Users/PC/Downloads/1.mp4`~`17.mp4`(파일럿은 `{n}b.mp4`)로 저장하고 "부엉박사 표시 27편(파일 ep28) 영상 검수해줘"라고 알려주기
2. 검수: 길이·시작/중반/끝 프레임·글자 보존·카메라 + `scripts/check-clip-speech-timing-once.mjs`로 입 멈춤 시각 측정
3. 재생성이 필요한 씬은 같은 프롬프트로 다시 뽑는다. 글자 소실·입 멈춤 불이행은 위 강화 문구가 이미 들어 있으니 더 덧붙이지 말고 결과를 기록한다(효과 측정용)
