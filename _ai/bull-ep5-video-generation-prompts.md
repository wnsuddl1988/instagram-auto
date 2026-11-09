# 황소특보 5편(반도체 기판주 재급등, 메타 '뮤즈' 앱 흥행→미국 CPU 랠리→한국 기판주 전이) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/bull-ep5-images-v3/`
영상 저장 폴더(신규 생성): `C:/tmp/bull-ep5-videos/`

**씬 길이 티어는 8초/10초 2단계로만 요청한다(9초 티어 금지,
[[feedback_video_scene_length_tier_smooth_transition]]).** Gemini Veo는 항상
10초 고정, Flow도 요청값과 다르게 나올 수 있어 "9초 영상"이 실무적으로
존재하지 않는다. 발화 8초 미만+여유 1초 이상 → 8초 요청, 그 외(8초 이상이거나
여유 1초 미만) → 10초 요청. 항상 발화보다 여유 있게 받아서 조립 때 "자르기"만
하고 tpad "늘리기"는 피한다.

★배경 신규 설계(2026-09-27, Owner 지시)★: 1~4편이 재사용해온 트레이딩
라운지 배경 대신, 5편부터 방송 스튜디오/뉴스룸 컨셉(곡면 LED 캔들차트
백월, 방송용 조명, 뉴스 데스크·마이크)을 쓴다. 아래 모든 프롬프트의 STYLE
CONSISTENCY는 이 신규 배경을 기준으로 쓴다.

★씬 확장 경위(2026-09-27, Owner 지시: "내용 압축 대신 자연스러운 흐름
유지")★: TTS 9.5초 규칙을 초과한 문장을 압축하지 않고 원래 문장 경계에서만
나눠 14→17씬으로 확장했다. s9→s10, s11→s12는 각각 원래 한 씬이었던 것을
둘로 나눈 것이라 **같은 카드/보드를 그대로 유지한 채 빈 손 동작만 다르게**
설계했다 — 두 씬을 이어 붙였을 때 카드가 순간이동하지 않고 자연스럽게
이어지도록, 뒤 씬의 STYLE CONSISTENCY에 "앞 장면과 완전히 동일한 카드"를
명시한다.

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 실측 발화(raw) | 요청 티어 | 예상 여유 |
|---|---|---|---|---|---|
| s1 hook_q | `bull_ep5_s1.png` | `bull_ep5_s1_motion.mp4` | 7.88초 | **10초** | 2.12초 |
| s2 hook_stakes | `bull_ep5_s2.png` | `bull_ep5_s2_motion.mp4` | 9.13초 | **10초** | 0.87초 |
| s3 opening | `bull_ep5_s3.png` | `bull_ep5_s3_motion.mp4` | 4.97초 | **8초** | 3.03초 |
| s4 situation1 | `bull_ep5_s4.png` | `bull_ep5_s4_motion.mp4` | 7.88초 | **10초** | 2.12초 |
| s5 situation2 | `bull_ep5_s5.png` | `bull_ep5_s5_motion.mp4` | 6.51초 | **8초** | 1.49초 |
| s6 core_q_answer(twist) | `bull_ep5_s6.png` | `bull_ep5_s6_motion.mp4` | 7.29초 | **10초** | 2.71초 |
| s7 reason1_term | `bull_ep5_s7.png` | `bull_ep5_s7_motion.mp4` | 7.61초 | **10초** | 2.39초 |
| s8 reason1_numbers | `bull_ep5_s8.png` | `bull_ep5_s8_motion.mp4` | 8.41초 | **10초** | 1.59초 |
| s9 reason1_cause(전반부) | `bull_ep5_s9.png` | `bull_ep5_s9_motion.mp4` | 5.68초 | **8초** | 2.32초 |
| s10 reason1_impact(후반부, s9와 같은 카드) | `bull_ep5_s10.png` | `bull_ep5_s10_motion.mp4` | 2.48초 | **8초** | 5.52초 |
| s11 reason2_transfer(전반부) | `bull_ep5_s11.png` | `bull_ep5_s11_motion.mp4` | 7.46초 | **10초** | 2.54초 |
| s12 reason2_impact(후반부, s11과 같은 카드) | `bull_ep5_s12.png` | `bull_ep5_s12_motion.mp4` | 1.94초 | **8초** | 6.06초 |
| s13 reason2_meaning | `bull_ep5_s13.png` | `bull_ep5_s13_motion.mp4` | 7.70초 | **10초** | 2.30초 |
| s14 balance | `bull_ep5_s14.png` | `bull_ep5_s14_motion.mp4` | 6.58초 | **8초** | 1.42초 |
| s15 summary | `bull_ep5_s15.png` | `bull_ep5_s15_motion.mp4` | 7.14초 | **10초** | 2.86초 |
| s16 checklist(action) | `bull_ep5_s16.png` | `bull_ep5_s16_motion.mp4` | 3.88초 | **8초** | 4.12초 |
| s17 remind_next_comment(closing) | `bull_ep5_s17.png` | `bull_ep5_s17_motion.mp4` | 6.57초 | **8초** | 1.43초 |

★ 영상 생성 절대규칙(`_ai/CURRENT_STANDARDS.md` §0) 전부 반영:
- 소품을 든 손은 **한 지점 고정**("holds steadily at", 이동·반복 왕복 지시 금지)
- **동작은 소품을 안 든 빈 쪽에만** 배정
- 소품·보드는 전부 "frozen photograph layered in front of/beside the character"로 명시
- 텍스트는 CRITICAL TEXT PRESERVATION(HIGHEST PRIORITY) 블록으로 고정
- 나레이션이 있는 영상이므로 "Silent" 문구는 절대 넣지 않는다
- 바닥 거치 소품(s4 시상대, s8·s13 이젤 보드)은 "넘어지지 않는다"는 문구를 STATIC ELEMENTS와 NEGATIVE PROMPT에 추가로 명시
- 영문 종목명·약어(Arm, AMD, CPU, DRAM, ETF)는 카드 텍스트에 적힌 원표기 그대로 CRITICAL TEXT PRESERVATION에 명시 — 한글 음차로 바뀌지 않도록 고정

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작 프레임뿐 아니라 클립 중반·후반 프레임에서도
텍스트·소품·동작 지속 여부, 카메라 줌/크롭, 소품 기울어짐을 확인한다.

================================================================================
# 🟦 8초 티어 (s3, s5, s9, s10, s12, s14, s16, s17)
================================================================================

---

## s3 — opening (8초, 소품 없음)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the broadcast news studio
background exactly as shown in the reference image — same curved LED
backwall with candlestick chart silhouettes, same broadcast spotlights,
same news desks and microphone stands. Do not change any colors, text, or
object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

MOTION DETAIL: the character points energetically upward with one hand
raised, the other hand resting on its hip, wide eyes and a big, bright,
warm smile throughout — introducing itself cheerfully.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the LED backwall candlestick chart silhouettes, spotlights,
news desks, and microphone stands must stay completely fixed — no camera
pan or zoom, no background object movement. No props in this scene.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the LED backwall chart
silhouettes as locked, non-regenerating image layers for the full 8
seconds. Render these exactly as pixels copied from the reference image,
unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, or flickering surfaces anywhere in
the frame, no regenerated or reinterpreted signage, no background changes,
no character redesign, no abrupt cut or freeze mid-motion, no static mouth,
no minimal lip movement, no closed-mouth talking, no frozen expression
while speaking, no full-body freeze at any point, no holding completely
still for more than half a second anywhere in the clip, NO CAMERA ZOOM OR
FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if brightly
introducing itself — never static, never barely-moving, never closed-mouth
talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep5-videos/bull_ep5_s3_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s5 — situation2 (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the broadcast news studio
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a single large card
reading "반도체지수 +11.8%" on the top line and "DRAM ETF +9.7%" on the
bottom line, completely rigid in both hands at chest height for the entire
clip — the card does not tilt, rotate, rise, lower, or drift at any point,
including the final 1-2 seconds. Treat the card as a frozen photograph
layered in front of the character.

MOTION DETAIL: the character's expression is bright and nodding, as if
confirming good market news.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head nods, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the LED backwall candlestick chart silhouettes, spotlights,
news desks, microphone stands, and the card (including its full text) must
stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("반도체지수 +11.8%", "DRAM ETF +9.7%" — keep "DRAM" and "ETF" exactly as
these Latin-letter abbreviations, never transliterate them into Korean
phonetic spelling) and the LED backwall chart silhouettes as locked,
non-regenerating image layers for the full 8 seconds. Render these exactly
as pixels copied from the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND, DO NOT TRANSLITERATE "DRAM" OR "ETF" INTO
KOREAN PHONETIC SPELLING.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if brightly
reporting more good numbers — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep5-videos/bull_ep5_s5_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — "DRAM ETF" 영문 표기가 유지되는지 특히 확인
3. 문제 없으면 다음 씬 진행

---

## s9 — reason1_cause, 전반부 (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the broadcast news studio
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a single large card
reading "AMD·인텔·Arm" on the top line and a red upward arrow icon on the
bottom line, completely rigid in one hand at chest height for the entire
clip — the card does not tilt, rotate, rise, lower, or drift at any point,
including the final 1-2 seconds. Treat the card as a frozen photograph
layered in front of the character.

MOTION DETAIL: the character's other hand (empty, holding no prop) has its
index finger raised in a steady emphasis gesture, held at a fixed angle
without waving.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the LED backwall candlestick chart silhouettes, spotlights,
news desks, microphone stands, and the card (including its full text and
arrow) must stay completely fixed — no camera pan or zoom, no background
object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("AMD·인텔·Arm" — keep "AMD" and "Arm" exactly as these Latin-letter
brand names, never transliterate them into Korean phonetic spelling, e.g.
never "에이엠디" or "암") and the LED backwall chart silhouettes as
locked, non-regenerating image layers for the full 8 seconds. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no waving
or repeated finger motion, no full-body freeze at any point, no holding
completely still for more than half a second anywhere in the clip, NO
CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND, DO NOT
TRANSLITERATE "AMD" OR "Arm" INTO KOREAN PHONETIC SPELLING.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly
explaining where the money flowed first — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep5-videos/bull_ep5_s9_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — "AMD·인텔·Arm" 영문 표기가 유지되는지 특히 확인
3. 문제 없으면 다음 씬 진행

---

## s10 — reason1_impact, 후반부 (8초, s9와 완전히 동일한 카드 유지)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the broadcast news studio
background EXACTLY the same as the previous scene (s9) — same card reading
"AMD·인텔·Arm" with the red upward arrow, same studio backdrop, same
lighting. Do not change any colors, text, or object positions. This scene
continues directly from s9, so the framing and character pose must look
like a natural continuation, not a new setup.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds the exact same card
reading "AMD·인텔·Arm" with the red upward arrow icon, completely rigid
in one hand at chest height for the entire clip — the card does not tilt,
rotate, rise, lower, or drift at any point, including the final 1-2
seconds. Treat the card as a frozen photograph layered in front of the
character.

MOTION DETAIL: the character's other hand (empty, holding no prop) taps
the card gently once or twice and then settles, nodding with a confident,
convinced expression — as if driving the point home.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head nods, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the LED backwall candlestick chart silhouettes, spotlights,
news desks, microphone stands, and the card (including its full text and
arrow) must stay completely fixed — no camera pan or zoom, no background
object movement, no card movement other than the light tapping described
above.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("AMD·인텔·Arm" — keep "AMD" and "Arm" exactly as these Latin-letter
brand names, never transliterate them into Korean phonetic spelling) and
the LED backwall chart silhouettes as locked, non-regenerating image
layers for the full 8 seconds. Render these exactly as pixels copied from
the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card tilt or rotation, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, DO NOT TRANSLITERATE "AMD" OR "Arm" INTO
KOREAN PHONETIC SPELLING, DO NOT REDESIGN THE CARD OR CHANGE ITS TEXT FROM
THE PREVIOUS SCENE.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
confidently concluding a point — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep5-videos/bull_ep5_s10_motion.mp4`로 저장
2. 시작 프레임이 s9의 마지막 프레임과 자연스럽게 이어지는지 확인 — 카드 문구·포즈 급변 없는지 특히 확인
3. 문제 없으면 다음 씬 진행

---

## s12 — reason2_impact, 후반부 (8초, s11과 완전히 동일한 카드 유지)

★재시도 경위(2026-09-27)★: 1차 시도는 카드가 통째로 사라지고 손에 정체불명의
막대를 쥔 모습으로 바뀌는 결함, 2차 시도는 카드는 유지됐지만 재생 중 텍스트
일부가 흔들리며 깨지는 결함("기판 대장주"가 중반엔 "대장주", 끝에는 "펀
대장주"로 변형)이 나왔다. 두 실패 모두 카드를 쥔 손이나 다른 손이 움직이는
동작이 원인으로 보여, 3차는 동작을 최소화하고("가리키는 동작"을 제거,
고개만 끄덕임) 텍스트 고정 지시를 문장 여러 곳에서 반복 강조했다.

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the broadcast news studio
background EXACTLY the same as the previous scene (s11) — same card
reading "기판 대장주 +8.57%" / "기판주 +15.7%", same studio backdrop, same
lighting. Do not change any colors, text, or object positions. This scene
continues directly from s11, so the framing and character pose must look
like a natural continuation, not a new setup.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY, ABSOLUTE): the character holds the exact same
card reading "기판 대장주 +8.57%" on the top line and "기판주 +15.7%" on
the bottom line, completely rigid in both hands at chest height for the
ENTIRE clip from frame 1 to the very last frame — the card does not tilt,
rotate, rise, lower, drift, shrink, resize, or move even by one pixel at
any point. Both of the character's hands stay fixed on the card for the
entire 8 seconds — do not let either hand let go, point elsewhere, or move
away from the card at any point. Treat the card as a single frozen
photograph pasted onto the character, glued in place and never
regenerated frame to frame.

MOTION DETAIL: both hands stay firmly on the card without moving away from
it. All motion is limited to the character's head and face only — a
gentle, repeated nod, natural eye blinks, and mouth movement while
speaking, with a surprised and impressed expression. The hands and the
card itself do not move at all, not even slightly.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character's
head and face must show visible, continuous motion for the ENTIRE 8
seconds, including the last 2-3 seconds — natural eye blinks at least
every 2-3 seconds, subtle head nods, continuous mouth movement while
speaking. No portion of the clip, especially the back half, should hold a
single frozen facial expression for more than half a second. This
continuous motion must come ONLY from the head and face — never from the
hands or the card.

STATIC ELEMENTS: the LED backwall candlestick chart silhouettes, spotlights,
news desks, microphone stands, and the card (including its full text, exact
position, and exact size) must stay completely fixed for every single frame
of the clip — no camera pan or zoom, no background object movement, no card
movement, no card resizing, no card text changing even slightly.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY, CHECK EVERY FRAME): the card
text reads exactly "기판 대장주 +8.57%" on the top line and "기판주
+15.7%" on the bottom line. Treat this text as a single locked,
non-regenerating image layer, pixel-identical in every single frame of the
8-second clip — frame 1, the middle frames, and the last frame must all
show the IDENTICAL text with no characters missing, added, swapped, or
distorted. The Korean word "기판" (both instances) must never be partially
cut off, blurred into a different word, or rendered as "펀" or any other
incorrect character — render "기판 대장주" and "기판주" exactly as shown
in the reference image, unchanged, in every frame. The LED backwall chart
silhouettes must also stay locked and unchanged.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame at any point in the clip, no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card tilt,
rotation, resizing, or movement of any kind, no hands releasing or moving
away from the card, no pointing gesture, no full-body freeze at any point,
no holding completely still for more than half a second anywhere in the
clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST
SECOND, DO NOT REDESIGN THE CARD OR CHANGE ITS TEXT FROM THE PREVIOUS
SCENE, DO NOT LET ANY CARD TEXT CHARACTER DRIFT, BLUR, DISAPPEAR, OR CHANGE
AT ANY POINT INCLUDING MID-CLIP FRAMES, NEVER RENDER "기판" AS "펀" OR ANY
OTHER INCORRECT CHARACTER.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
impressed, explaining how the trend crossed over — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds. Only the head and mouth move; the hands and card remain
completely still throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep5-videos/bull_ep5_s12_motion.mp4`로 저장
2. 시작·중반·끝 프레임 전부에서 카드 텍스트("기판 대장주 +8.57%", "기판주 +15.7%")가 한 글자도 깨지지 않고 동일한지 특히 확인 — 이전 2회 시도 모두 이 부분에서 실패했음
3. 문제 없으면 다음 씬 진행

---

## s14 — balance (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the broadcast news studio
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a single large card
reading "급등 뒤" above "되돌림 주의" in red, completely rigid in both
hands at chest height for the entire clip — the card does not tilt,
rotate, rise, lower, or drift at any point, including the final 1-2
seconds. Treat the card as a frozen photograph layered in front of the
character.

MOTION DETAIL: the character's expression is cautious and serious —
slightly furrowed brow, no smile — as if warning the viewer to be careful.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the LED backwall candlestick chart silhouettes, spotlights,
news desks, microphone stands, and the card (including its full text) must
stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("급등 뒤", "되돌림 주의") and the LED backwall chart silhouettes as
locked, non-regenerating image layers for the full 8 seconds. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
seriously cautioning the viewer — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep5-videos/bull_ep5_s14_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s16 — checklist / action (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the broadcast news studio
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a single large card with
two lines of text — "체크 ❶" followed by "뮤즈 앱스토어 순위" on the top
line, "❷" followed by "기판주 등락률" on the bottom line — completely
rigid in one hand at chest height for the entire clip. The card does not
tilt, rotate, rise, lower, or drift at any point, including the final 1-2
seconds. The other hand is raised in a steady "peace sign" / two-finger
gesture, held at a fixed angle without waving. Treat the card as a frozen
photograph layered in front of the character.

MOTION DETAIL: the character's expression is confident and instructive,
summarizing the two things to check.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the LED backwall candlestick chart silhouettes, spotlights,
news desks, microphone stands, and the card (including both lines of text)
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("체크
❶", "뮤즈 앱스토어 순위", "❷", "기판주 등락률") and the LED backwall
chart silhouettes as locked, non-regenerating image layers for the full 8
seconds. Render these exactly as pixels copied from the reference image,
unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no waving
or repeated finger motion, no full-body freeze at any point, no holding
completely still for more than half a second anywhere in the clip, NO
CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly
summarizing a two-item checklist — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep5-videos/bull_ep5_s16_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s17 — remind_next_comment / closing (8초, 마지막 씬 — CTA 직전, 리스크고지 자막바 적용)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the broadcast news studio
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

MOTION DETAIL: the character's expression is confident and warm, gently
waving with one hand (a natural, continuous small wave motion, not a
static held pose) while the other arm relaxes at its side. Slight forward
nod for emphasis. No props held.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY, THIS IS THE FINAL
SCENE OF THE EPISODE — DO NOT LET IT GO STATIC): the character must show
visible, continuous motion for the ENTIRE 8 seconds, including the last
2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle head
tilts, gentle continuous waving motion, continuous mouth movement while
speaking. No portion of the clip, especially the back half, should hold a
single frozen pose for more than half a second.

STATIC ELEMENTS: the LED backwall candlestick chart silhouettes, spotlights,
news desks, microphone stands must stay completely fixed — no camera pan
or zoom, no background object movement. No props in this scene.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the LED backwall
chart silhouettes as locked, non-regenerating image layers for the full 8
seconds. Render these exactly as pixels copied from the reference image,
unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, or flickering surfaces anywhere in
the frame, no regenerated or reinterpreted signage, no background changes,
no character redesign, no abrupt cut or freeze mid-motion, no static mouth,
no minimal lip movement, no closed-mouth talking, no frozen expression
while speaking, NO FULL-BODY FREEZE AT ANY POINT, no holding completely
still for more than half a second anywhere in the clip, no rigid locked
pose for the second half of the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT
ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
wrapping up today's story and inviting comments — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep5-videos/bull_ep5_s17_motion.mp4`로 저장
2. 시작·중반(4초)·끝(7~8초) 프레임 전부 확인 — 마지막 씬이므로 후반부 정지 여부 특히 꼼꼼히 확인
3. 8초 티어 전부 완료 후 10초 티어로 진행

================================================================================
# 🟨 10초 티어 (s1, s2, s4, s6, s7, s8, s11, s13, s15)
================================================================================

---

## s1 — hook_q (10초, 소품: 스마트폰 카드)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the broadcast news studio
background exactly as shown in the reference image — same curved LED
backwall with candlestick chart silhouettes, same broadcast spotlights,
same news desks and microphone stands. Do not change any colors, text, or
object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a smartphone-shaped card
reading "AI 앱" on the top line and "1개" in red on the bottom line,
completely rigid in one hand at chest height for the entire clip — the
card does not tilt, rotate, rise, lower, or drift at any point, including
the final 1-2 seconds. The other hand rests on its hip. Treat the card as
a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is surprised and curious, wide
eyes, mouth slightly open, as if posing an intriguing question to the
viewer.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the LED backwall candlestick chart silhouettes, spotlights,
news desks, microphone stands, and the card must stay completely fixed —
no camera pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("AI
앱", "1개") and the LED backwall chart silhouettes as locked,
non-regenerating image layers for the full 10 seconds. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, or flickering surfaces anywhere in
the frame, no regenerated or reinterpreted signage, no background changes,
no character redesign, no abrupt cut or freeze mid-motion, no static mouth,
no minimal lip movement, no closed-mouth talking, no frozen expression
while speaking, no card movement, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if curiously
posing a question to the viewer — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep5-videos/bull_ep5_s1_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s2 — hook_stakes (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the broadcast news studio
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a single large card
reading "미국 CPU 반도체" on the top line and "+14~24%" in red on the
bottom line, completely rigid in both hands at chest height for the entire
clip — the card does not tilt, rotate, rise, lower, or drift at any point,
including the final 1-2 seconds. Treat the card as a frozen photograph
layered in front of the character.

MOTION DETAIL: the character's expression is wide-eyed and surprised, as
if sharing a striking number.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the LED backwall candlestick chart silhouettes, spotlights,
news desks, microphone stands, and the card (including its full text) must
stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("미국 CPU 반도체" — keep "CPU" exactly as this Latin-letter abbreviation,
never transliterate it into Korean phonetic spelling, e.g. never "씨피유",
"+14~24%") and the LED backwall chart silhouettes as locked,
non-regenerating image layers for the full 10 seconds. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND, DO NOT TRANSLITERATE "CPU" INTO KOREAN PHONETIC
SPELLING.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
excitedly revealing a surprising range of numbers — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep5-videos/bull_ep5_s2_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — "CPU" 영문 표기가 유지되는지 특히 확인
3. 문제 없으면 다음 씬 진행

---

## s4 — situation1 (10초, 시상대 바닥 거치)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the broadcast news studio
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): a floor-standing three-tier podium prop
remains completely rigid, resting on the floor beside the character for
the entire clip — the podium does not tip over, rotate, slide, or fall at
any point, including the final 1-2 seconds. The podium blocks read "1위"
with "Arm" and "+24%" on the tallest center block, "2위" with "AMD" and
"+14%" on the left block, and "3위" with "인텔" and "+13%" on the right
block. Treat the podium as a frozen photograph layered beside the
character, fixed to the floor.

MOTION DETAIL: the character's empty hand (holding no prop) points toward
the 1st place block with a proud, explaining expression; the other hand
rests on its hip. Only the pointing arm moves — the podium itself never
shifts position.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
tipping, sliding, or regenerating the podium.

STATIC ELEMENTS: the LED backwall candlestick chart silhouettes, spotlights,
news desks, microphone stands, the podium (including all three blocks'
full text and its floor position) must stay completely fixed — no camera
pan or zoom, no background object movement, no podium movement or
tipping.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the podium text
("1위", "Arm", "+24%", "2위", "AMD", "+14%", "3위", "인텔", "+13%" —
keep "Arm" and "AMD" exactly as these Latin-letter brand names, never
transliterate them into Korean phonetic spelling) and the LED backwall
chart silhouettes as locked, non-regenerating image layers for the full 10
seconds. Render these exactly as pixels copied from the reference image,
unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no podium tipping over,
sliding, or falling at any point, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
PODIUM MOVEMENT AT ANY POINT INCLUDING THE LAST SECOND, DO NOT
TRANSLITERATE "Arm" OR "AMD" INTO KOREAN PHONETIC SPELLING.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly
walking through the ranking numbers — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep5-videos/bull_ep5_s4_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 시상대가 넘어지거나 미끄러지지 않는지, "Arm"·"AMD" 영문 표기가 유지되는지 특히 확인
3. 문제 없으면 다음 씬 진행

---

## s6 — core_q_answer (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the broadcast news studio
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a single large card
reading "Arm·AMD·인텔" on the top line and "= CPU 회사" on the bottom
line (with "CPU" in red), completely rigid in one hand at chest height for
the entire clip — the card does not tilt, rotate, rise, lower, or drift at
any point, including the final 1-2 seconds. The other hand (empty, holding
no prop) has its index finger raised, pointing upward at a fixed angle
without waving. Treat the card as a frozen photograph layered in front of
the character.

MOTION DETAIL: the character's expression is insightful and confident, as
if revealing the common thread connecting these companies.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the LED backwall candlestick chart silhouettes, spotlights,
news desks, microphone stands, and the card (including its full text) must
stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("Arm·AMD·인텔", "= CPU 회사" — keep "Arm", "AMD", and "CPU" exactly as
these Latin-letter brand names/abbreviations, never transliterate them
into Korean phonetic spelling) and the LED backwall chart silhouettes as
locked, non-regenerating image layers for the full 10 seconds. Render
these exactly as pixels copied from the reference image, unchanged frame
to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no waving
or repeated finger motion, no full-body freeze at any point, no holding
completely still for more than half a second anywhere in the clip, NO
CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND, DO NOT
TRANSLITERATE "Arm", "AMD", OR "CPU" INTO KOREAN PHONETIC SPELLING.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
confidently revealing the answer — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep5-videos/bull_ep5_s6_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — "Arm·AMD·CPU" 영문 표기가 유지되는지 특히 확인
3. 문제 없으면 다음 씬 진행

---

## s7 — reason1_term (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the broadcast news studio
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a single large card
reading "메타 뮤즈" on the top line and "앱스토어 1위" on the bottom line,
completely rigid in both hands at chest height for the entire clip — the
card does not tilt, rotate, rise, lower, or drift at any point, including
the final 1-2 seconds. Treat the card as a frozen photograph layered in
front of the character.

MOTION DETAIL: the character's expression is serious and informative, as
if explaining an important piece of news to the viewer.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the LED backwall candlestick chart silhouettes, spotlights,
news desks, microphone stands, and the card (including its full text) must
stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("메타 뮤즈", "앱스토어 1위") and the LED backwall chart silhouettes as
locked, non-regenerating image layers for the full 10 seconds. Render
these exactly as pixels copied from the reference image, unchanged frame
to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
seriously explaining important news — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep5-videos/bull_ep5_s7_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s8 — reason1_numbers (10초, 이젤 바닥 거치)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the broadcast news studio
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): a floor-standing easel signboard reading
"온디바이스" on the first line, "AI" in blue on the second line, a red
rightward arrow, then "CPU" in red followed by "성능 중요" remains
completely rigid, standing upright on the floor beside the character for
the entire clip — the easel does not tip over, rotate, slide, or fall at
any point, including the final 1-2 seconds. Treat the signboard as a
frozen photograph layered beside the character, fixed to the floor.

MOTION DETAIL: the character's empty hand (holding no prop) points toward
the signboard with an explanatory, informative expression; the other hand
rests on its hip. Only the pointing arm moves — the easel itself never
shifts position.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
tipping, sliding, or regenerating the easel.

STATIC ELEMENTS: the LED backwall candlestick chart silhouettes, spotlights,
news desks, microphone stands, the easel signboard (including its full
text, arrow, and floor position) must stay completely fixed — no camera
pan or zoom, no background object movement, no easel movement or tipping.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the signboard text
("온디바이스", "AI", "CPU", "성능 중요" — keep "AI" and "CPU" exactly as
these Latin-letter abbreviations, never transliterate them into Korean
phonetic spelling) and the LED backwall chart silhouettes as locked,
non-regenerating image layers for the full 10 seconds. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no easel tipping over,
sliding, or falling at any point, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
EASEL MOVEMENT AT ANY POINT INCLUDING THE LAST SECOND, DO NOT TRANSLITERATE
"AI" OR "CPU" INTO KOREAN PHONETIC SPELLING.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly
explaining a technical concept — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep5-videos/bull_ep5_s8_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 이젤이 넘어지거나 미끄러지지 않는지, "AI"·"CPU" 영문 표기가 유지되는지 특히 확인
3. 문제 없으면 다음 씬 진행

---

## s11 — reason2_transfer, 전반부 (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the broadcast news studio
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a single large card
reading "기판 대장주 +8.57%" on the top line and "기판주 +15.7%" on the
bottom line, completely rigid in both hands at chest height, thrust
slightly forward, for the entire clip — the card does not tilt, rotate,
rise, lower, or drift at any point, including the final 1-2 seconds. Treat
the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is surprised and impressed, eyes
widened, as if presenting a striking result.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the LED backwall candlestick chart silhouettes, spotlights,
news desks, microphone stands, and the card (including its full text) must
stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("기판 대장주 +8.57%", "기판주 +15.7%") and the LED backwall chart
silhouettes as locked, non-regenerating image layers for the full 10
seconds. Render these exactly as pixels copied from the reference image,
unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
excitedly presenting a striking result — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep5-videos/bull_ep5_s11_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행 (s12는 이 씬의 카드를 그대로 이어받으므로 s11을 먼저 완료할 것)

---

## s13 — reason2_meaning (10초, 이젤 바닥 거치)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the broadcast news studio
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): a floor-standing easel signboard reading
"소부장주" above "+14.66%" in red remains completely rigid, standing
upright on the floor beside the character for the entire clip — the easel
does not tip over, rotate, slide, or fall at any point, including the
final 1-2 seconds. Treat the signboard as a frozen photograph layered
beside the character, fixed to the floor.

MOTION DETAIL: the character's empty hand (holding no prop) points toward
the right side of the signboard; the other hand rests on its hip. Only the
pointing arm moves — the easel itself never shifts position.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
tipping, sliding, or regenerating the easel.

STATIC ELEMENTS: the LED backwall candlestick chart silhouettes, spotlights,
news desks, microphone stands, the easel signboard (including its full
text and floor position) must stay completely fixed — no camera pan or
zoom, no background object movement, no easel movement or tipping.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the signboard text
("소부장주", "+14.66%") and the LED backwall chart silhouettes as locked,
non-regenerating image layers for the full 10 seconds. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no easel tipping over,
sliding, or falling at any point, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
EASEL MOVEMENT AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
thoughtfully explaining what this shift means — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep5-videos/bull_ep5_s13_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 이젤이 넘어지거나 미끄러지지 않는지 특히 확인
3. 문제 없으면 다음 씬 진행

---

## s15 — summary (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the broadcast news studio
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a single large card
reading "앱 1위" followed by a rightward arrow, then "CPU" in blue followed
by another rightward arrow, then "기판주" in red — all on one line,
completely rigid in both hands at chest height for the entire clip — the
card does not tilt, rotate, rise, lower, or drift at any point, including
the final 1-2 seconds. Treat the card as a frozen photograph layered in
front of the character.

MOTION DETAIL: the character's expression is confident and conclusive, as
if summarizing the whole chain of events in one line.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the LED backwall candlestick chart silhouettes, spotlights,
news desks, microphone stands, and the card (including its full text and
arrows) must stay completely fixed — no camera pan or zoom, no background
object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("앱
1위", "CPU", "기판주" — keep "CPU" exactly as this Latin-letter
abbreviation, never transliterate it into Korean phonetic spelling) and
the LED backwall chart silhouettes as locked, non-regenerating image
layers for the full 10 seconds. Render these exactly as pixels copied from
the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT
INCLUDING THE LAST SECOND, DO NOT TRANSLITERATE "CPU" INTO KOREAN PHONETIC
SPELLING.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
confidently wrapping up the whole story in one line — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/bull-ep5-videos/bull_ep5_s15_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — "CPU" 영문 표기가 유지되는지 특히 확인
3. 17개 씬 전부 완료 후 본편 조립(`run-owl-assemble-shorts-v2.mjs`, `--spec-module _bull-ep5-assembly-spec.mjs --spec-export BULL_EP5_ASSEMBLY_SPEC`) → 고정 CTA 연결(`run-owl-episode-with-fixed-cta-once.mjs`, CTA 클립 `C:\tmp\bull-cta-fixed-v5\bull_cta_fixed_final_with_captions.mp4`) 진행
