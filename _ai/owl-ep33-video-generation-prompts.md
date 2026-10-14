# 부엉박사 표시 32편(파일 ep33) (경찰 경고 문자, 링크 누르기 전에 이것부터, 16씬) 영상 생성 프롬프트 — 수동 진행용

**번호 주의: 이 파일의 "표시 32편" = 파일명·폴더의 ep33.**
이미지 소스 폴더: `C:/tmp/owl-ep33-images/`
영상 저장: **장면 번호로** `C:/Users/PC/Downloads/1.mp4` ~ `16.mp4` (CURRENT_STANDARDS §A-6, "부엉박사 표시 32편(파일 ep33)"이라고 알려주기)

생성기: `scripts/build-video-generation-prompts.mjs` (TTS: `C:/tmp/money-shorts-os/owl-ep33-tts/output-v1/elevenlabs-scene-paced-tts-summary.json`, 타임라인 110.76초)

**★ 2026-09-30 변경 — 입 멈춤 시각(SPEECH TIMING):** 씬마다 "몇 초까지만 말하고 그 뒤엔 입을 다문다"를 넣었다
(표의 '입 멈춤'). 받은 영상에서 입이 그 시각 뒤에도 계속 움직이면 검수에서 표시한다. 눈 깜빡임·호흡은 끝까지 유지.

티어는 8초/10초 두 가지뿐. **소품(카드·보드) 씬은 항상 10초**(2026-10-01 — 8초 클립은 끝에서 글자·소품이 사라짐, 황소 12편 s14. 2026-10-08 황소 23편에서 "사용 길이가 짧으면 8초" 시험 → 8초 소품 씬 8개 중 3개가 사용 구간 안에서 카드가 사라져 되돌림). 소품 없는 씬만 발화 8초 미만·여유 1초 이상이면 8초.
**★ 2026-10-01 강화**: SPEECH TIMING을 "구간 2단계(말하는 구간 / 듣는 구간: 입 완전히 닫음·음성 없음)"로 바꾸고 프롬프트 끝에 FINAL REMINDER를 넣었다. 소품 씬엔 "끝 프레임까지 글자 선명, fade/dissolve 금지"를 더했다. 효과는 이 편 검수 때 12편 기준선(15/16 경고, 평균 초과 약 0.9초)과 비교한다.
Gemini(Veo)로 배정하는 씬은 발화와 무관하게 항상 10초(입 멈춤 시각은 그대로).

| 씬 | 이미지 | 저장할 영상 파일명 | 발화(raw) | 입 멈춤 | 티어 | 여유 | 샷 / 배경 | 형태 |
|---|---|---|---|---|---|---|---|---|
| s1 hook | `owl_ep33_s1.png` | `owl_v2_ep33_s1_hook_motion.mp4` | 5.43초 | **5.7초** | **10초** | 4.57초 | medium / A | card2 |
| s2 opening | `owl_ep33_s2.png` | `owl_v2_ep33_s2_opening_motion.mp4` | 3.21초 | **3.3초** | **8초** | 4.79초 | wide / A | open |
| s3 concept | `owl_ep33_s3.png` | `owl_v2_ep33_s3_concept_motion.mp4` | 4.73초 | **4.8초** | **10초** | 5.27초 | medium / A | card2 |
| s4 police | `owl_ep33_s4.png` | `owl_v2_ep33_s4_police_motion.mp4` | 5.55초 | **5.6초** | **10초** | 4.45초 | medium / B | card2 |
| s5 purpose | `owl_ep33_s5.png` | `owl_v2_ep33_s5_purpose_motion.mp4` | 4.09초 | **4.2초** | **10초** | 5.91초 | medium / B | card2 |
| s6 agency | `owl_ep33_s6.png` | `owl_v2_ep33_s6_agency_motion.mp4` | 6.52초 | **6.6초** | **10초** | 3.48초 | medium / B | card2 |
| s7 timing | `owl_ep33_s7.png` | `owl_v2_ep33_s7_timing_motion.mp4` | 4.18초 | **4.3초** | **10초** | 5.82초 | medium / B | card2 |
| s8 core_q | `owl_ep33_s8.png` | `owl_v2_ep33_s8_core_q_motion.mp4` | 7.45초 | **7.5초** | **10초** | 2.55초 | wide / B | open |
| s9 point1 | `owl_ep33_s9.png` | `owl_v2_ep33_s9_point1_motion.mp4` | 7.14초 | **7.2초** | **10초** | 2.86초 | medium / C | card2 |
| s10 point2 | `owl_ep33_s10.png` | `owl_v2_ep33_s10_point2_motion.mp4` | 6.66초 | **6.8초** | **10초** | 3.34초 | medium / C | card2 |
| s11 point3 | `owl_ep33_s11.png` | `owl_v2_ep33_s11_point3_motion.mp4` | 7.44초 | **7.5초** | **10초** | 2.56초 | medium / C | card2 |
| s12 caution | `owl_ep33_s12.png` | `owl_v2_ep33_s12_caution_motion.mp4` | 6.59초 | **6.7초** | **8초** | 1.41초 | wide / C | open |
| s13 report | `owl_ep33_s13.png` | `owl_v2_ep33_s13_report_motion.mp4` | 6.79초 | **6.9초** | **10초** | 3.21초 | medium / C | card2 |
| s14 summary | `owl_ep33_s14.png` | `owl_v2_ep33_s14_summary_motion.mp4` | 7.52초 | **7.6초** | **10초** | 2.48초 | medium / A | card2 |
| s15 check_two | `owl_ep33_s15.png` | `owl_v2_ep33_s15_check_two_motion.mp4` | 7.00초 | **7.1초** | **8초** | 1.00초 | wide / A | open |
| s16 save | `owl_ep33_s16.png` | `owl_v2_ep33_s16_save_motion.mp4` | 4.90초 | **5.0초** | **8초** | 3.10초 | wide / A | open |

★ 영상 생성 절대규칙(`_ai/CURRENT_STANDARDS.md` §0-1): 소품 든 손은 고정·동작은 빈 손에만, 소품은 frozen photograph,
텍스트는 CRITICAL TEXT PRESERVATION, 나레이션 영상이라 "Silent" 금지, "glued" 같은 신체 접착 표현 금지, 바닥 보드 "넘어지지 않음" 이중 명시.

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수** — 시작·중반·끝 프레임의 텍스트·소품·입 멈춤을 확인한다.

================================================================================
# 🟦 8초 티어 (s2, s12, s15, s16)
================================================================================

## s2 — opening (8초, open, 입 멈춤 3.3초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright alert lounge with large plain bell sculptures and round beacon-light-shaped sculptures
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character raises one wing slightly in a friendly greeting while the other wing hangs naturally, smiling calmly and warmly at the viewer; no props are held. No props held.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 3.3s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 3.3s to the very last frame (4.7 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 3.3s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 3.3s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. No portion of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the large plain bell sculptures, the round beacon-light-shaped sculptures without any marks, the large potted plants, and the light navy glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 3.3s, no camera zoom, crop, or framing drift at any point.

MOOD: warmly greeting the viewer.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 3.3s. The last 4.7 seconds are silent, with the mouth closed.
```

---

## s12 — condition (8초, open, 입 멈춤 6.7초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright defense hall with large plain shield sculptures and round check-mark-shaped pillars
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character's expression is careful and firm, eyebrows slightly furrowed, while one wing lifts in a hold-on gesture as if warning the viewer and the other hangs naturally; no props are held. No props held.

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

STATIC ELEMENTS: the large plain shield sculptures, the round pillars without any marks, the large potted plants, and the glossy light mint floor
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 6.7s, no camera zoom, crop, or framing drift at any point.

MOOD: firmly cautioning the viewer.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 6.7s. The last 1.3 seconds are silent, with the mouth closed.
```

---

## s15 — action (8초, open, 입 멈춤 7.1초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright alert lounge with large plain bell sculptures and round beacon-light-shaped sculptures
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character lifts one wing and ticks off two points one after the other with a clear, friendly explanatory expression while the other wing hangs naturally; no props are held. No props held.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 7.1s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 7.1s to the very last frame (0.9 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 7.1s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 7.1s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. No portion of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the large plain bell sculptures, the round beacon-light-shaped sculptures without any marks, the large potted plants, and the light navy glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 7.1s, no camera zoom, crop, or framing drift at any point.

MOOD: clearly pointing out the two things to check.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 7.1s. The last 0.9 seconds are silent, with the mouth closed.
```

---

## s16 — save (8초, open, 입 멈춤 5.0초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright alert lounge with large plain bell sculptures and round beacon-light-shaped sculptures
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character smiles brightly and waves one wing lightly in a friendly goodbye while the other wing hangs naturally relaxed; no props are held. No props held.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 5.0s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 5.0s to the very last frame (3.0 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 5.0s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 5.0s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 8 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. No portion of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the large plain bell sculptures, the round beacon-light-shaped sculptures without any marks, the large potted plants, and the light navy glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 5.0s, no camera zoom, crop, or framing drift at any point.

MOOD: warmly saying goodbye and inviting comments.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 5.0s. The last 3.0 seconds are silent, with the mouth closed.
```

---

================================================================================
# 🟨 10초 티어 (s1, s3, s4, s5, s6, s7, s8, s9, s10, s11, s13, s14)
================================================================================

## s1 — hook (10초, card2, 입 멈춤 5.7초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright alert lounge with large plain bell sculptures and round beacon-light-shaped sculptures
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "금융권 해킹 뒤" on the first line, "경찰 경고 문자" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: wide-eyed and curious, eyebrows raised, as if revealing a surprising turn; only the face and body move while the wings holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.1s to 5.7s: the character speaks. The mouth actively opens and
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

STATIC ELEMENTS: the large plain bell sculptures, the round beacon-light-shaped sculptures without any marks, the large potted plants, and the light navy glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("금융권 해킹 뒤", "경찰 경고 문자") as locked, non-regenerating image layers for the full
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

MOOD: posing a surprising question to the viewer.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 5.7s. The last 4.3 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s3 — fact (10초, card2, 입 멈춤 4.8초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright alert lounge with large plain bell sculptures and round beacon-light-shaped sculptures
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "스미싱" on the first line, "링크 눌러 정보 탈취" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: clear and friendly with slight nods, as if explaining this point; only the face and body move while the wings holding the card stay still.

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

STATIC ELEMENTS: the large plain bell sculptures, the round beacon-light-shaped sculptures without any marks, the large potted plants, and the light navy glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("스미싱", "링크 눌러 정보 탈취") as locked, non-regenerating image layers for the full
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

MOOD: clearly explaining this point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 4.8s. The last 5.2 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s4 — fact (10초, card2, 입 멈춤 5.6초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright clean gallery with large plain padlock sculptures and round key-shaped pillars
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "경찰청" on the first line, "4,800만 명 발송" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: serious and clear with slight nods, as if reporting these facts; only the face and body move while the wings holding the card stay still.

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

STATIC ELEMENTS: the large plain padlock sculptures with no marks, the round key-shaped pillars, the large potted plants, and the light cream glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("경찰청", "4,800만 명 발송") as locked, non-regenerating image layers for the full
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

MOOD: seriously reporting the facts.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 5.6s. The last 4.4 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s5 — fact (10초, card2, 입 멈춤 4.2초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright clean gallery with large plain padlock sculptures and round key-shaped pillars
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "해킹 악용 사기" on the first line, "2차 피해 예방" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: clear and friendly with slight nods, as if explaining this point; only the face and body move while the wings holding the card stay still.

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

STATIC ELEMENTS: the large plain padlock sculptures with no marks, the round key-shaped pillars, the large potted plants, and the light cream glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("해킹 악용 사기", "2차 피해 예방") as locked, non-regenerating image layers for the full
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

MOOD: clearly explaining this point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 4.2s. The last 5.8 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s6 — fact (10초, card2, 입 멈춤 6.6초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright clean gallery with large plain padlock sculptures and round key-shaped pillars
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "금융당국 소비자경보" on the first line, "주의 단계" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: serious and clear with slight nods, as if reporting these facts; only the face and body move while the wings holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 6.6s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 6.6s to the very last frame (3.4 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 6.6s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 6.6s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large plain padlock sculptures with no marks, the round key-shaped pillars, the large potted plants, and the light cream glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("금융당국 소비자경보", "주의 단계") as locked, non-regenerating image layers for the full
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
mid-motion, no talking, voice, mumbling or lip movement after 6.6s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: seriously reporting the facts.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 6.6s. The last 3.4 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s7 — fact (10초, card2, 입 멈춤 4.3초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright clean gallery with large plain padlock sculptures and round key-shaped pillars
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "발송일은" on the first line, "통신사와 협의 중" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: serious and clear with slight nods, as if reporting these facts; only the face and body move while the wings holding the card stay still.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 4.3s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 4.3s to the very last frame (5.7 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 4.3s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 4.3s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large plain padlock sculptures with no marks, the round key-shaped pillars, the large potted plants, and the light cream glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("발송일은", "통신사와 협의 중") as locked, non-regenerating image layers for the full
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
mid-motion, no talking, voice, mumbling or lip movement after 4.3s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: seriously reporting the facts.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 4.3s. The last 5.7 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s8 — core_question (10초, open, 입 멈춤 7.5초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright clean gallery with large plain padlock sculptures and round key-shaped pillars
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character's expression starts curious with a slight head tilt and turns confident while one wing lifts in an explaining gesture and the other hangs naturally; no props are held. No props held.

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
gentle head movement. Only the mouth follows the SPEECH TIMING above. No portion of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the large plain padlock sculptures with no marks, the round key-shaped pillars, the large potted plants, and the light cream glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 7.5s, no camera zoom, crop, or framing drift at any point.

MOOD: confidently giving the key answer.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 7.5s. The last 2.5 seconds are silent, with the mouth closed.
```

---

## s9 — evidence (10초, card2, 입 멈춤 7.2초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright defense hall with large plain shield sculptures and round check-mark-shaped pillars
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "첫째 링크" on the first line, "누르지도 설치도 X" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: clear and friendly with slight nods, as if explaining this point; only the face and body move while the wings holding the card stay still.

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
gentle head movement. Only the mouth follows the SPEECH TIMING above. The hand(s) holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the large plain shield sculptures, the round pillars without any marks, the large potted plants, and the glossy light mint floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("첫째 링크", "누르지도 설치도 X") as locked, non-regenerating image layers for the full
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
mid-motion, no talking, voice, mumbling or lip movement after 7.2s, no card tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: clearly explaining this point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 7.2s. The last 2.8 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s10 — evidence (10초, card2, 입 멈춤 6.8초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright defense hall with large plain shield sculptures and round check-mark-shaped pillars
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "둘째 정보 요구" on the first line, "일단 의심하기" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: clear and friendly with slight nods, as if explaining this point; only the face and body move while the wings holding the card stay still.

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

STATIC ELEMENTS: the large plain shield sculptures, the round pillars without any marks, the large potted plants, and the glossy light mint floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("둘째 정보 요구", "일단 의심하기") as locked, non-regenerating image layers for the full
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

## s11 — evidence (10초, card2, 입 멈춤 7.5초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright defense hall with large plain shield sculptures and round check-mark-shaped pillars
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "셋째 사칭 수법" on the first line, "금리·대출 조정" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: clear and friendly with slight nods, as if explaining this point; only the face and body move while the wings holding the card stay still.

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

STATIC ELEMENTS: the large plain shield sculptures, the round pillars without any marks, the large potted plants, and the glossy light mint floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("셋째 사칭 수법", "금리·대출 조정") as locked, non-regenerating image layers for the full
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

## s13 — action (10초, card2, 입 멈춤 6.9초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright defense hall with large plain shield sculptures and round check-mark-shaped pillars
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "의심되면" on the first line, "고객센터·112" on the second line — in both hands at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: confident and knowing with slight nods; only the face and body move while the wings holding the card stay still.

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

STATIC ELEMENTS: the large plain shield sculptures, the round pillars without any marks, the large potted plants, and the glossy light mint floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("의심되면", "고객센터·112") as locked, non-regenerating image layers for the full
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

MOOD: confidently delivering the key point.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 6.9s. The last 3.1 seconds are silent, with the mouth closed, and the card text stays fully visible until the final frame.
```

---

## s14 — action (10초, card2, 입 멈춤 7.6초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright alert lounge with large plain bell sculptures and round beacon-light-shaped sculptures
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with 2 lines of
large text — "직접 찾은 경로로" on the first line, "확인하세요" on the second line — in both hands at chest height. The card
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

STATIC ELEMENTS: the large plain bell sculptures, the round beacon-light-shaped sculptures without any marks, the large potted plants, and the light navy glossy floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("직접 찾은 경로로", "확인하세요") as locked, non-regenerating image layers for the full
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

## 완료 후 절차
1. `C:/Users/PC/Downloads/1.mp4`~`16.mp4`(파일럿은 `{n}b.mp4`)로 저장하고 "부엉박사 표시 32편(파일 ep33) 영상 검수해줘"라고 알려주기
2. 검수: 길이·시작/중반/끝 프레임·글자 보존·카메라 + `scripts/check-clip-speech-timing-once.mjs`로 입 멈춤 시각 측정
3. 재생성이 필요한 씬은 같은 프롬프트로 다시 뽑는다. 글자 소실·입 멈춤 불이행은 위 강화 문구가 이미 들어 있으니 더 덧붙이지 말고 결과를 기록한다(효과 측정용)
