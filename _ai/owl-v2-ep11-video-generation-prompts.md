# 부엉박사 11편(v2 재제작 — 청약통장 전환기한 연장 + 금리 인정) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/owl-v2-ep11-images/`
영상 전달: `C:/Users/PC/Downloads/부엉박사 v2 11편/` 에 **장면 번호로** `1.mp4`, `2.mp4`, `7.mp4`, `10.mp4`, `13.mp4` 저장 → Claude가 검수 후 `C:/tmp/owl-v2-ep11-videos/`로 복사.
나머지 9장면(s3·s4·s5·s6·s8·s9·s11·s12·s14)은 17편 v1 영상을 재사용한다(이미 복사 완료).

**씬 길이 티어는 8초/10초 2단계만(9초 금지).** 발화 8초 미만이고 여유 1초 이상 → 8초, 그 외 → 10초. Gemini(Veo)로 만들면 항상 10초.

| 씬 | 이미지 파일 | 저장할 영상 파일명(Claude가 변경) | 실측 발화(raw) | 요청 티어 | 예상 여유 |
|---|---|---|---|---|---|
| s1 hook_q | `owl_v2_ep11_s1_hook_q.png` | `owl_v2_ep11_s1_hook_q_motion.mp4` | 7.61초 | **10초** | 2.39초 |
| s2 hook_stakes | `owl_v2_ep11_s2_hook_stakes.png` | `owl_v2_ep11_s2_hook_stakes_motion.mp4` | 8.23초 | **10초** | 1.77초 |
| s7 core_q_answer | `owl_v2_ep11_s7_core_q_answer.png` | `owl_v2_ep11_s7_core_q_answer_motion.mp4` | 6.34초 | **8초** | 1.66초 |
| s10 calc | `owl_v2_ep11_s10_calc.png` | `owl_v2_ep11_s10_calc_motion.mp4` | 7.80초 | **10초** | 2.20초 |
| s13 summary_check | `owl_v2_ep11_s13_summary_check.png` | `owl_v2_ep11_s13_summary_check_motion.mp4` | 8.85초 | **10초** | 1.15초 |

★ 영상 생성 절대규칙(`_ai/CURRENT_STANDARDS.md` §0-1) 반영:
- 소품(카드)을 든 날개는 **한 지점 고정**("holds steadily"), 이동·왕복 지시 없음
- **동작은 소품을 안 든 빈 날개에만**, 그 날개도 보드·카드 글자를 절대 가리지 않는다
- 바닥 거치 보드(s2·s10·s13)는 "넘어지거나 미끄러지지 않는다"를 STATIC ELEMENTS·NEGATIVE PROMPT에 명시
- 나레이션이 있는 영상이므로 "Silent"는 쓰지 않는다

**하나씩 생성하고 바로 검수** — 시작·중반·끝 프레임에서 글자·소품·동작·카메라를 확인한다.

================================================================================
# 🟦 8초 티어 (s7)
================================================================================

## s7 — core_q_answer (8초, 물음표 카드 감싸 쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright housing subscription
consultation counter background exactly as shown in the reference image.
Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the card showing one large red question mark
is held firmly in the character's left wing (screen-right side) and holds
steadily at exactly its current position and angle for the entire clip —
the card does not move, tilt, slide, or drop at any point, including the
final 1-2 seconds. Treat the card as a frozen photograph layered in front
of the character's wing.

MOTION DETAIL: only the character's other wing (screen-left side, resting
near its chin in a thinking pose) moves — it taps the chin gently once or
twice and then opens slightly outward as if about to give the answer. The
wing holding the card does not move at all.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, a subtle
curious head tilt, continuous beak movement while speaking. No portion of
the clip, especially the back half, should hold a single frozen pose for
more than half a second. This continuous motion must never be achieved by
moving the card.

STATIC ELEMENTS: the question-mark card, the "청약통장 안내" poster, the
"청약 상담" desk sign, the apartment model in the glass case, the chairs,
the plants, and the "청약신청서" clipboard must stay completely fixed — no
camera pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the question mark on
the card and the background signs ("청약통장 안내", "청약 상담",
"청약신청서") as locked, non-regenerating image layers for the full 8
seconds. Render these exactly as pixels copied from the reference image,
unchanged frame to frame. Do not add any new text to the card.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no new letters appearing on the card, no
regenerated or reinterpreted signage, no background changes, no character
redesign, no abrupt cut or freeze mid-motion, no static mouth, no minimal
beak movement, no closed-mouth talking, no frozen expression while
speaking, no card movement, tilting, or dropping, no full-body freeze at
any point, no holding completely still for more than half a second
anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT
INCLUDING THE LAST SECOND, NO CARD MOVEMENT AT ANY POINT INCLUDING THE LAST
SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes
continuously in natural speech rhythm for the entire clip, as if asking a
question and then starting to answer it — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. `Downloads/부엉박사 v2 11편/7.mp4`로 저장
2. 시작·중반·끝 프레임 확인 — 카드가 흔들리거나 새 글자가 생기지 않는지

================================================================================
# 🟨 10초 티어 (s1, s2, s10, s13)
================================================================================

## s1 — hook_q (10초, '9월 30일 마감?' 카드 감싸 쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright housing subscription
consultation counter background exactly as shown in the reference image.
Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the card reading "9월 30일" on the first line
and "마감?" on the second line is held firmly against the character's body
by its right wing (screen-left side) and holds steadily at exactly its
current position and angle for the entire clip — the card does not move,
tilt, slide, or drop at any point, including the final 1-2 seconds. Treat
the card as a frozen photograph layered in front of the character's wing.

MOTION DETAIL: only the character's other wing (screen-right side, hanging
at its side and holding nothing) moves — it lifts slightly outward in a
questioning "did you know?" gesture and settles back. The wing holding the
card does not move at all. Eyebrows rise slightly with a sharp, curious
expression; the character does not smile broadly.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
moving the card.

STATIC ELEMENTS: the card, the "청약통장 안내" poster, the "청약 상담" desk
sign, the apartment model in the glass case, the chairs, the plants, and
the "청약신청서" clipboard with its pen must stay completely fixed — no
camera pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("9월 30일", "마감?") and the background signs ("청약통장 안내", "청약 상담",
"청약신청서") as locked, non-regenerating image layers for the full 10
seconds. Render these exactly as pixels copied from the reference image,
unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, tilting,
or dropping, no wing passing in front of the card, no full-body freeze at
any point, no holding completely still for more than half a second
anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT
INCLUDING THE LAST SECOND, NO CARD MOVEMENT AT ANY POINT INCLUDING THE LAST
SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes
continuously in natural speech rhythm for the entire clip, as if asking
the viewer a pointed question — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. `Downloads/부엉박사 v2 11편/1.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 카드 글자·위치 유지

---

## s2 — hook_stakes (10초, 바닥 거치 보드)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright housing subscription
consultation counter background exactly as shown in the reference image.
Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): a floor-standing easel board on the left
reading "기한만?" on top and "금리도 바뀜" below remains completely rigid,
standing upright on the floor for the entire clip — the easel does not tip
over, rotate, slide, or fall at any point, including the final 1-2
seconds. Treat the board as a frozen photograph layered beside the
character, fixed to the floor.

MOTION DETAIL: the character stands beside the board holding nothing. Its
pointing wing (screen-left side) makes one small pointing motion toward the
lower line of the board and returns, always staying beside the board edge —
it never passes in front of the board text. The other wing rests at its
side with a slight natural sway. Serious, sharp expression; no broad smile.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
tipping, sliding, or regenerating the board.

STATIC ELEMENTS: the easel board (including its full text, highlight
strokes, and floor position), the "청약통장 안내" poster, the "청약 상담" desk
sign, the apartment model, the chairs, the plants, and the "청약신청서"
clipboard must stay completely fixed — no camera pan or zoom, no background
object movement, no easel movement or tipping.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text
("기한만?", "금리도 바뀜") and the background signs ("청약통장 안내",
"청약 상담", "청약신청서") as locked, non-regenerating image layers for the
full 10 seconds. Render these exactly as pixels copied from the reference
image, unchanged frame to frame. No wing or feather may cover the board
text at any time.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no wing passing in front of
the board, no easel tipping over, sliding, or falling at any point, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO EASEL MOVEMENT AT ANY POINT INCLUDING
THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warning
the viewer about something most people miss — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. `Downloads/부엉박사 v2 11편/2.mp4`로 저장
2. 시작·중반·끝 프레임 확인 — 보드 글자 유지, 날개가 글자를 가리지 않는지

---

## s10 — calc (10초, 바닥 거치 보드)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright housing subscription
consultation counter background exactly as shown in the reference image.
Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): a floor-standing easel board on the right
with a yellow upper panel reading "이제" and "31만 원" and a white lower
panel reading "예전" and "23만 원" remains completely rigid, standing
upright on the floor for the entire clip — the easel does not tip over,
rotate, slide, or fall at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character, fixed
to the floor.

MOTION DETAIL: the character stands on the left holding nothing. Its
pointing wing (screen-right side) makes one small pointing motion toward
the yellow upper panel and returns, always staying beside the board edge —
it never passes in front of the board text. The other wing rests at its
side with a slight natural sway. Confident expression with a subtle smile.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
tipping, sliding, or regenerating the board.

STATIC ELEMENTS: the easel board (including all its text, panels, and floor
position), the "청약통장 안내" poster, the framed apartment picture, the
apartment model in the glass case, the counter with its small stands, the
chairs, and the plants must stay completely fixed — no camera pan or zoom,
no background object movement, no easel movement or tipping.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text
("이제", "31만 원", "예전", "23만 원") and the background sign ("청약통장
안내") as locked, non-regenerating image layers for the full 10 seconds.
Render these exactly as pixels copied from the reference image, unchanged
frame to frame — the numbers 31 and 23 must never change. No wing or
feather may cover the board text at any time.

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
walking through a simple calculation — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. `Downloads/부엉박사 v2 11편/10.mp4`로 저장
2. 시작·중반·끝 프레임 확인 — 숫자 31·23 유지, 보드 넘어짐 없음

---

## s13 — summary_check (10초, 바닥 거치 체크 보드)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright housing subscription
consultation counter background exactly as shown in the reference image.
Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): a floor-standing easel board on the right
with a yellow upper panel showing a red check mark and "내 가입기간" and a
white lower panel showing a red check mark and "국민? 민영?" remains
completely rigid, standing upright on the floor for the entire clip — the
easel does not tip over, rotate, slide, or fall at any point, including the
final 1-2 seconds. Treat the board as a frozen photograph layered beside
the character, fixed to the floor.

MOTION DETAIL: the character stands on the left holding nothing. Its
raised wing (screen-right side) moves gently in a small explaining gesture
beside the board and settles, always staying beside the board edge — it
never passes in front of the board text. The other wing rests at its side
with a slight natural sway. Serious but friendly expression.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
tipping, sliding, or regenerating the board.

STATIC ELEMENTS: the easel board (including its check marks, full text, and
floor position), the "청약통장 안내" poster, the framed apartment picture,
the apartment model in the glass case, the counter with its small stands,
the chairs, and the plants must stay completely fixed — no camera pan or
zoom, no background object movement, no easel movement or tipping.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text
("내 가입기간", "국민? 민영?"), the check marks, and the background sign
("청약통장 안내") as locked, non-regenerating image layers for the full 10
seconds. Render these exactly as pixels copied from the reference image,
unchanged frame to frame. No wing or feather may cover the board text at
any time.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no wing passing in front of
the board, no easel tipping over, sliding, or falling at any point, no
full-body freeze at any point, no holding completely still for more than
half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY
POINT INCLUDING THE LAST SECOND, NO EASEL MOVEMENT AT ANY POINT INCLUDING
THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly
summing up and listing two things to check — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. `Downloads/부엉박사 v2 11편/13.mp4`로 저장
2. 시작·중반·끝 프레임 확인 — 체크 보드 글자 유지, 보드 넘어짐 없음
