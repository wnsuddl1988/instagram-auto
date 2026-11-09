# 부엉박사 12편(v2 재제작 — 토지거래허가구역 실거주 유예) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/owl-v2-ep12-images/`
영상 전달: `C:/Users/PC/Downloads/`에 **장면 번호로** `1.mp4`, `2.mp4`, `8.mp4`, `13.mp4` 저장 → Claude가 검수 후 `C:/tmp/owl-v2-ep12-videos/`로 복사.
나머지 10장면(s3~s7, s9~s12, s14)은 12편 v1 영상을 재사용한다(복사·끝부분 점검 완료).

**전부 10초로 요청한다.** s1·s2는 발화상 8초 티어지만, 11편에서 8초 영상 끝부분(7.4초~)에 카드 낙하가 있었던 교훈으로 10초를 쓴다(사용 구간 7.3~7.5초가 클립 끝보다 2.5초 앞).

| 씬 | 이미지 파일 | 카드/보드 문구 | 저장할 영상 파일명(Claude가 변경) | 실측 발화(raw) | 사용 길이 | 요청 티어 |
|---|---|---|---|---|---|---|
| s1 hook_q | `owl_v2_ep12_s1_hook_q.png` | 최대 / 3년 3개월 | `owl_v2_ep12_s1_hook_q_motion.mp4` | 6.01초 | 7.26초 | **10초** |
| s2 hook_stakes | `owl_v2_ep12_s2_hook_stakes.png` | 기한만? / 갱신도 인정 | `owl_v2_ep12_s2_hook_stakes_motion.mp4` | 6.10초 | 7.45초 | **10초** |
| s8 core_q_answer | `owl_v2_ep12_s8_core_q_answer.png` | 나한테는 / 뭐가 달라? | `owl_v2_ep12_s8_core_q_answer_motion.mp4` | 8.97초 | 10.07초 | **10초** |
| s13 summary_check | `owl_v2_ep12_s13_summary_check.png` | ✔ 계약 끝나는 날 / ✔ 갱신할까? | `owl_v2_ep12_s13_summary_check_motion.mp4` | 8.16초 | 9.11초 | **10초** |

★ 영상 생성 절대규칙(`_ai/CURRENT_STANDARDS.md` §0-1): 카드를 든 날개는 한 지점 고정, 동작은 빈 날개에만(글자를 가리지 않음), 바닥 보드는 넘어지거나 미끄러지지 않음, "Silent" 금지.

================================================================================
# 🟨 10초 티어 (s1, s2, s8, s13)
================================================================================

## s1 — hook_q (10초, '최대 3년 3개월' 카드 감싸 쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright real-estate consultation
office background exactly as shown in the reference image. Do not change
any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the card reading "최대" on the first line and
"3년 3개월" on the second line is held firmly by the character's right wing
(screen-left side) and holds steadily at exactly its current position and
angle for the ENTIRE 10 seconds — the card never moves, tilts, slides,
slips, or drops at any point, especially not in the final 2-3 seconds.
Treat the card as a frozen photograph layered in front of the character's
wing, glued in place.

MOTION DETAIL: only the character's other wing (screen-right side, hanging
at its side and holding nothing) moves — it lifts slightly outward in a
questioning "did you know?" gesture and settles back, never passing in
front of the card. The wing holding the card does not move at all. Sharp,
curious expression with raised eyebrows; no broad smile.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
moving or dropping the card.

STATIC ELEMENTS: the card, the "부동산" wall sign, the property photo
frames, the desk with its monitor and pen cup, the pendant lamp, the
chairs, and the plants must stay completely fixed — no camera pan or zoom,
no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("최대",
"3년 3개월") and the wall sign ("부동산") as locked, non-regenerating image
layers for the full 10 seconds. Render these exactly as pixels copied from
the reference image, unchanged frame to frame — the digits 3 and 3 must
never change.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no changed digits, no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal beak movement, no
closed-mouth talking, no frozen expression while speaking, no card
dropping, falling, slipping, tilting, or motion blur at any point, no wing
passing in front of the card, no full-body freeze at any point, no holding
completely still for more than half a second anywhere in the clip, NO
CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD MOVEMENT OR DROP AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes
continuously in natural speech rhythm for the entire clip, as if asking
the viewer a pointed question — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## s2 — hook_stakes (10초, 바닥 거치 보드 '기한만? / 갱신도 인정')

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright real-estate consultation
office background exactly as shown in the reference image. Do not change
any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): a floor-standing easel board on the right
with house illustrations, a yellow panel reading "기한만?" and a blue panel
reading "갱신도 인정" remains completely rigid, standing upright on the
floor for the entire clip — the easel does not tip over, rotate, slide, or
fall at any point, including the final 1-2 seconds. Treat the board as a
frozen photograph layered beside the character, fixed to the floor.

MOTION DETAIL: the character stands on the left holding nothing. Its
pointing wing (screen-right side) makes one small pointing motion toward
the lower blue panel and returns, always staying beside the board edge —
it never passes in front of the board text. The other wing rests at its
side with a slight natural sway. Serious, sharp expression; no broad
smile.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
tipping, sliding, or regenerating the board.

STATIC ELEMENTS: the easel board (including its full text, illustrations,
and floor position), the "부동산" wall sign, the property photo frames, the
desk with its monitor, the pendant lamp, the chairs, and the plants must
stay completely fixed — no camera pan or zoom, no background object
movement, no easel movement or tipping.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text
("기한만?", "갱신도 인정") and the wall sign ("부동산") as locked,
non-regenerating image layers for the full 10 seconds. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame. No wing or feather may cover the board text at any time.

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

## s8 — core_q_answer (10초, '나한테는 / 뭐가 달라?' 카드 감싸 쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright real-estate consultation
office background exactly as shown in the reference image. Do not change
any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the card reading "나한테는" on the first line
and "뭐가 달라?" on the second line is held firmly by the character's right
wing (screen-left side) and holds steadily at exactly its current position
and angle for the ENTIRE 10 seconds — the card never moves, tilts, slides,
slips, or drops at any point, especially not in the final 2-3 seconds.
Treat the card as a frozen photograph layered in front of the character's
wing, glued in place.

MOTION DETAIL: only the character's other wing (screen-right side, resting
near its chin in a thinking pose) moves — it taps the chin gently once and
then opens slightly outward as if giving the answer, never passing in
front of the card. The wing holding the card does not move at all.
Thoughtful, sharp expression that turns confident; no broad smile.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
moving or dropping the card.

STATIC ELEMENTS: the card, the "부동산" wall sign, the property photo
frames, the desk with its monitor and pen cup, the pendant lamp, the
chairs, and the plants must stay completely fixed — no camera pan or zoom,
no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("나한테는", "뭐가 달라?") and the wall sign ("부동산") as locked,
non-regenerating image layers for the full 10 seconds. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame.

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
continuously in natural speech rhythm for the entire clip, as if asking a
question and then answering it clearly — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## s13 — summary_check (10초, 바닥 거치 체크 보드)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright real-estate consultation
office background exactly as shown in the reference image. Do not change
any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): a floor-standing easel board on the right
with house illustrations, a yellow panel showing a red check mark and
"계약 끝나는 날", and a blue panel showing a red check mark and "갱신할까?"
remains completely rigid, standing upright on the floor for the entire
clip — the easel does not tip over, rotate, slide, or fall at any point,
including the final 1-2 seconds. Treat the board as a frozen photograph
layered beside the character, fixed to the floor.

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

STATIC ELEMENTS: the easel board (including its check marks, full text,
illustrations, and floor position), the "부동산" wall sign, the property
photo frames, the desk with its monitor, the pendant lamp, the chairs, and
the plants must stay completely fixed — no camera pan or zoom, no
background object movement, no easel movement or tipping.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text
("계약 끝나는 날", "갱신할까?"), the check marks, and the wall sign ("부동산")
as locked, non-regenerating image layers for the full 10 seconds. Render
these exactly as pixels copied from the reference image, unchanged frame
to frame. No wing or feather may cover the board text at any time.

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
1. `C:/Users/PC/Downloads/1.mp4, 2.mp4, 8.mp4, 13.mp4`로 저장(숫자 = 씬 번호). **카드 문구로 이미지를 한 번 더 확인**(11편에서 이미지가 바뀐 사고).
2. Claude가 0~사용 길이 구간 검수 → 조립(`--audio-summary …/output-v3/…`) → CTA 결합(`--alignment …/output-v3/elevenlabs-korean-director-8e65ff1f0d85ab.alignment.json`) → 완성본 검수 요청.
