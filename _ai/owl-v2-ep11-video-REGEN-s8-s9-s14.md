# 부엉박사 11편(v2) s8·s9·s14 영상 재생성 프롬프트 — 수동 진행용

## 재생성 사유 (2026-09-26 검수)
- 세 장면은 17편 v1 영상(8초)을 재사용했다. v1은 앞 6초만 썼지만 v2 대본은 장면이 길어 7.7~8.1초까지 쓴다.
- v1 영상 끝부분에서 카드가 떨어지거나 흔들린다: s8(v1 s7) 7.4초부터 낙하, s9(v1 s8) 7.64초부터 흔들림, s14(v1 s10) 7.7초부터 낙하 → 완성본에 노출.
- 조치: 같은 v1 이미지로 **10초** 다시 생성(사용 구간 7.7~8.1초가 클립 끝보다 2초 앞).

| 씬 | 이미지 소스(v1 그대로) | 저장 | 사용 길이 | 요청 티어 |
|---|---|---|---|---|
| s8 point1_before | `C:/tmp/owl-ep17-images/owl_ep17_s7_evidence.png` | `Downloads/8.mp4` | 8.06초 | **10초** |
| s9 point1_now | `C:/tmp/owl-ep17-images/owl_ep17_s8_evidence.png` | `Downloads/9.mp4` | 7.68초 | **10초** |
| s14 bridge | `C:/tmp/owl-ep17-images/owl_ep17_s10_action.png` | `Downloads/14.mp4` | 7.90초(마지막 씬, CTA 직전) | **10초** |

★ 카드를 든 날개(화면 왼쪽)는 완전 고정. 동작은 반대쪽 빈 날개에만, 그 날개도 카드 글자를 가리지 않는다. 특히 **마지막 2초에 카드가 떨어지지 않는 것**이 핵심.

================================================================================
# 🟨 10초 티어 (s8, s9, s14)
================================================================================

## s8 — point1_before (10초, '예전: 가입기간 0부터 다시' 카드)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright housing subscription
consultation counter background exactly as shown in the reference image.
Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the card reading "예전:" on top, "가입기간" in
the middle, and "0부터 다시" with a circular reset-calendar icon is held
firmly by the character's right wing (screen-left side) and holds steadily
at exactly its current position and angle for the ENTIRE 10 seconds — the
card never moves, tilts, slides, slips, or drops at any point, especially
not in the final 2-3 seconds. Treat the card as a frozen photograph layered
in front of the character's wing, glued in place.

MOTION DETAIL: only the character's other wing (screen-right side, pointing
toward the card) moves — it makes one small pointing gesture near the right
edge of the card and settles back, never passing in front of the card text.
The wing holding the card does not move at all. Slightly regretful,
explaining expression; no broad smile.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
moving or dropping the card.

STATIC ELEMENTS: the card, the "주택청약 상담" and "청약통장 안내" posters,
the apartment models, the counter, the chairs, and the plants must stay
completely fixed — no camera pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("예전:",
"가입기간", "0부터", "다시") and the poster text ("주택청약 상담",
"청약통장 안내") as locked, non-regenerating image layers for the full 10
seconds. Render these exactly as pixels copied from the reference image,
unchanged frame to frame.

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
continuously in natural speech rhythm for the entire clip, as if
explaining how things used to work — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## s9 — point1_now (10초, '연 3.1% 즉시 적용' 카드)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright housing subscription
consultation counter background exactly as shown in the reference image.
Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the card reading "연 3.1%" with a red upward
arrow, apartment and coin icons, and "즉시 적용" on a yellow strip is held
firmly by the character's right wing (screen-left side) and holds steadily
at exactly its current position and angle for the ENTIRE 10 seconds — the
card never moves, tilts, slides, slips, or drops at any point, especially
not in the final 2-3 seconds. Treat the card as a frozen photograph layered
in front of the character's wing, glued in place.

MOTION DETAIL: only the character's other wing (screen-right side, holding
nothing) moves — it opens outward in one confident presenting gesture and
settles back, never passing in front of the card text. The wing holding the
card does not move at all. Confident expression with a subtle smile.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
moving or dropping the card.

STATIC ELEMENTS: the card, the "주택청약 상담" and "청약통장 안내" posters,
the apartment models, the counter, the chairs, and the plants must stay
completely fixed — no camera pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("연",
"3.1%", "즉시 적용") and the poster text ("주택청약 상담", "청약통장 안내")
as locked, non-regenerating image layers for the full 10 seconds. Render
these exactly as pixels copied from the reference image, unchanged frame to
frame — the number 3.1% must never change.

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
continuously in natural speech rhythm for the entire clip, as if
confidently announcing good news — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## s14 — bridge (10초, '은행 앱·창구에서 확인' 카드 — 마지막 씬, CTA 직전)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright housing subscription
consultation counter background exactly as shown in the reference image.
Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the card showing a phone icon and a bank
icon, "은행 앱·창구에서", and "확인" on a yellow highlight is held firmly by
the character's right wing (screen-left side) and holds steadily at exactly
its current position and angle for the ENTIRE 10 seconds — the card never
moves, tilts, slides, slips, or drops at any point, especially not in the
final 2-3 seconds. Treat the card as a frozen photograph layered in front
of the character's wing, glued in place.

MOTION DETAIL: only the character's other wing (screen-right side,
pointing toward the card) moves — it makes one small friendly pointing
gesture near the right edge of the card and then a small wave, never
passing in front of the card text. The wing holding the card does not move
at all. Bright, friendly closing expression with a gentle smile.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
moving or dropping the card.

STATIC ELEMENTS: the card, the "주택청약 상담" and "청약통장 안내" posters,
the apartment models, the counter, the chairs, and the plants must stay
completely fixed — no camera pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("은행 앱·창구에서", "확인") and the poster text ("주택청약 상담",
"청약통장 안내") as locked, non-regenerating image layers for the full 10
seconds. Render these exactly as pixels copied from the reference image,
unchanged frame to frame.

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
continuously in natural speech rhythm for the entire clip, as if warmly
wrapping up and handing over to a friend — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. `C:/Users/PC/Downloads/8.mp4`, `9.mp4`, `14.mp4`로 저장(숫자 = 씬 번호)
2. Claude가 0~8.2초 구간을 0.3초 간격으로 확인(카드 유지) → 교체 → 조립 + CTA 재결합
