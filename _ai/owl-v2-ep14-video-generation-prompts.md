# 부엉박사 14편(v2 재제작 — 국민연금 보험료 2027년 10%) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/owl-v2-ep14-images/`
영상 전달: `C:/Users/PC/Downloads/`에 **장면 번호로** `1.mp4`, `7.mp4`, `8.mp4`, `11.mp4`, `14.mp4` 저장("부엉박사 14편"이라고 알려주기).
나머지 9장면은 v1(파일 ep10) 영상 재사용(복사·끝부분 점검 완료).

**전부 10초로 요청한다.** s8은 사용 길이 10.38초라 10초 영상보다 0.37초 길다 → 받은 뒤 3.7% 느리게 맞춘다(8% 이내 규칙).

| 씬 | 이미지 파일 | 카드/보드 문구 | 실측 발화(raw) | 사용 길이 | 요청 |
|---|---|---|---|---|---|
| s1 hook_q | `owl_v2_ep14_s1_hook_q.png` | 국민연금 / 또 오른다? | 6.75초 | 8.26초 | **10초** |
| s7 core_q_answer | `owl_v2_ep14_s7_core_q_answer.png` | 내 월급은 / 또 줄까? | 8.04초 | 8.80초 | **10초** |
| s8 point1_calc | `owl_v2_ep14_s8_point1_calc.png` | 직장인 +7,700원 / 지역 +15,400원 (바닥 보드) | 9.05초 | 10.38초 | **10초** |
| s11 caution | `owl_v2_ep14_s11_caution.png` | ⚠ 미납하면 / 연금 줄어요 | 5.81초 | 7.09초 | **10초** |
| s14 bridge | `owl_v2_ep14_s14_bridge.png` | 진짜 / 내 몫? | 6.94초 | 7.22초 | **10초** |

★ 카드를 든 날개는 한 지점 고정, 동작은 빈 날개에만(글자를 가리지 않음), 바닥 보드는 넘어지거나 미끄러지지 않음, "Silent" 금지.

================================================================================
# 🟨 10초 티어 (s1, s7, s8, s11, s14)
================================================================================

## s1 — hook_q (10초, 카드 감싸 쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright public pension consultation counter background exactly as shown in
the reference image. Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the card reading "국민연금" on the first line and "또 오른다?" on the second line is held firmly by the character's
right wing (screen-left side) and holds steadily at exactly its current
position and angle for the ENTIRE 10 seconds — the card never moves, tilts,
slides, slips, or drops at any point, especially not in the final 2-3
seconds. Treat the card as a frozen photograph layered in front of the
character's wing, glued in place.

MOTION DETAIL: only the character's other wing (screen-right side, holding nothing) moves — it lifts slightly outward in a questioning "did you know?" gesture and settles back, never passing in front of the card. The wing holding the card does not move at all.
Sharp, curious expression with raised eyebrows; no broad smile.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by moving or dropping the card.

STATIC ELEMENTS: the card, the "연금 상담 창구" wall sign, the blue "내 연금 조회"/"연금 조회" screen, the "연금 상담" desk stand, the navy chairs, the desks, and the plants must stay completely fixed — no camera
pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("국민연금", "또 오른다?") and the background signs ("연금 상담 창구", "연금 상담") as locked, non-regenerating image layers for
the full 10 seconds. Render these exactly as pixels copied from the reference
image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no card dropping, falling,
slipping, tilting, or motion blur at any point, no wing passing in front of
the card, no full-body freeze at any point, no holding completely still
for more than half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING
DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD MOVEMENT OR DROP AT
ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes
continuously in natural speech rhythm for the entire clip, as if asking the viewer a pointed question — never
static, never barely-moving, never closed-mouth talking, never frozen even
in the final seconds.
```

## s7 — core_q_answer (10초, 카드 감싸 쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright public pension consultation counter background exactly as shown in
the reference image. Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the card reading "내 월급은" on the first line and "또 줄까?" on the second line is held firmly by the character's
right wing (screen-left side) and holds steadily at exactly its current
position and angle for the ENTIRE 10 seconds — the card never moves, tilts,
slides, slips, or drops at any point, especially not in the final 2-3
seconds. Treat the card as a frozen photograph layered in front of the
character's wing, glued in place.

MOTION DETAIL: only the character's other wing (screen-right side, resting near its chin in a thinking pose) moves — it taps the chin once and then opens slightly outward as if giving the answer, never passing in front of the card. The wing holding the card does not move at all.
Thoughtful, sharp expression that turns confident; no broad smile.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by moving or dropping the card.

STATIC ELEMENTS: the card, the "연금 상담 창구" wall sign, the blue "내 연금 조회"/"연금 조회" screen, the "연금 상담" desk stand, the navy chairs, the desks, and the plants must stay completely fixed — no camera
pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("내 월급은", "또 줄까?") and the background signs ("연금 상담 창구", "연금 상담") as locked, non-regenerating image layers for
the full 10 seconds. Render these exactly as pixels copied from the reference
image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no card dropping, falling,
slipping, tilting, or motion blur at any point, no wing passing in front of
the card, no full-body freeze at any point, no holding completely still
for more than half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING
DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD MOVEMENT OR DROP AT
ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes
continuously in natural speech rhythm for the entire clip, as if asking a question and then answering it clearly — never
static, never barely-moving, never closed-mouth talking, never frozen even
in the final seconds.
```

## s8 — point1_calc (10초, 바닥 보드 '직장인 +7,700원 / 지역 +15,400원')

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright public pension consultation counter background exactly as shown in
the reference image. Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): a floor-standing easel board on the right
with a navy label "직장인" above red "+7,700원" and a navy label "지역" above
red "+15,400원" remains completely rigid, standing upright on the floor for
the entire clip — the easel does not tip over, rotate, slide, or fall at any
point, including the final 1-2 seconds. Treat the board as a frozen
photograph layered beside the character, fixed to the floor.

MOTION DETAIL: the character stands on the left holding nothing. Its
pointing wing (screen-right side) points toward the upper line, then the
lower line, and returns — always staying beside the board edge, never
passing in front of the board text. The other wing rests at its side with a
slight natural sway. Serious, explaining expression; no broad smile.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by tipping, sliding, or regenerating the board.

STATIC ELEMENTS: the easel board (including all its text and floor
position), the "연금 상담 창구" wall sign, the blue "내 연금 조회"/"연금 조회" screen, the "연금 상담" desk stand, the navy chairs, the desks, and the plants must stay completely fixed — no camera pan or zoom, no
background object movement, no easel movement or tipping.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text
("직장인", "+7,700원", "지역", "+15,400원") and the background signs ("연금 상담 창구", "연금 상담") as locked,
non-regenerating image layers for the full 10 seconds. Render these exactly
as pixels copied from the reference image, unchanged frame to frame — the
digits 7,700 and 15,400 must never change. No wing or feather may cover the
board text at any time.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no changed digits, no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal beak movement, no
closed-mouth talking, no frozen expression while speaking, no wing passing
in front of the board, no easel tipping over, sliding, or falling at any
point, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING
DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO EASEL MOVEMENT AT ANY
POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly
walking through two numbers — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## s11 — caution (10초, 카드 감싸 쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright public pension consultation counter background exactly as shown in
the reference image. Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the card with a red warning triangle icon and the text "미납하면" on the first line and "연금 줄어요" on the second line is held firmly by the character's
right wing (screen-left side) and holds steadily at exactly its current
position and angle for the ENTIRE 10 seconds — the card never moves, tilts,
slides, slips, or drops at any point, especially not in the final 2-3
seconds. Treat the card as a frozen photograph layered in front of the
character's wing, glued in place.

MOTION DETAIL: only the character's other wing (screen-right side, pointing toward the card) makes one small cautionary pointing motion near the right edge of the card and settles, never passing in front of the card text. The wing holding the card does not move at all.
Serious, firm expression; not smiling.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by moving or dropping the card.

STATIC ELEMENTS: the card, the "연금 상담 창구" wall sign, the blue "내 연금 조회"/"연금 조회" screen, the "연금 상담" desk stand, the navy chairs, the desks, and the plants must stay completely fixed — no camera
pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("미납하면", "연금 줄어요", the warning icon) and the background signs ("연금 상담 창구", "연금 상담") as locked, non-regenerating image layers for
the full 10 seconds. Render these exactly as pixels copied from the reference
image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no card dropping, falling,
slipping, tilting, or motion blur at any point, no wing passing in front of
the card, no full-body freeze at any point, no holding completely still
for more than half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING
DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD MOVEMENT OR DROP AT
ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes
continuously in natural speech rhythm for the entire clip, as if firmly warning the viewer — never
static, never barely-moving, never closed-mouth talking, never frozen even
in the final seconds.
```

## s14 — bridge (10초, 카드 감싸 쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright public pension consultation counter background exactly as shown in
the reference image. Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the card reading "진짜" on the first line and "내 몫?" on the second line is held firmly by the character's
right wing (screen-left side) and holds steadily at exactly its current
position and angle for the ENTIRE 10 seconds — the card never moves, tilts,
slides, slips, or drops at any point, especially not in the final 2-3
seconds. Treat the card as a frozen photograph layered in front of the
character's wing, glued in place.

MOTION DETAIL: only the character's other wing (screen-right side, raised and holding nothing) makes one small friendly wave and settles, never passing in front of the card text. The wing holding the card does not move at all.
Bright, friendly closing expression with a gentle smile.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by moving or dropping the card.

STATIC ELEMENTS: the card, the "연금 상담 창구" wall sign, the blue "내 연금 조회"/"연금 조회" screen, the "연금 상담" desk stand, the navy chairs, the desks, and the plants must stay completely fixed — no camera
pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("진짜", "내 몫?") and the background signs ("연금 상담 창구", "연금 상담") as locked, non-regenerating image layers for
the full 10 seconds. Render these exactly as pixels copied from the reference
image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no card dropping, falling,
slipping, tilting, or motion blur at any point, no wing passing in front of
the card, no full-body freeze at any point, no holding completely still
for more than half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING
DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD MOVEMENT OR DROP AT
ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly wrapping up and handing over to a friend — never
static, never barely-moving, never closed-mouth talking, never frozen even
in the final seconds.
```

## 완료 후 절차
1. `C:/Users/PC/Downloads/1.mp4, 7.mp4, 8.mp4, 11.mp4, 14.mp4`로 저장(숫자 = 씬 번호, "부엉박사 14편"이라고 알려주기).
2. Claude: 검수 → s8만 3.7% 느리게(setpts) → 조립(`--audio-summary …/owl-v2-ep14-tts/output-v1/…`) → 자막 읽는표기 0건 확인 → CTA 결합(`--alignment …/output-v1/elevenlabs-korean-director-ddae3070f5321c.alignment.json`) → 완성본 검수 요청.
