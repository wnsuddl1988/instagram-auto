# 금박사 6편(파일 ep8 토지거래허가구역) s2·s5 영상 재생성 프롬프트 — 수동 진행용

## 재생성 사유 (2026-09-26 배포 전 점검)
- 6편 완성본에서 화면이 대사보다 최대 4.6초 먼저 넘어감. 원인: 조립에 짧게 잘린 클립 사용 + 조립기가 대사보다 짧은 클립은 멈춤 없이 다음 장면으로 넘김.
- 원본 풀클립(`C:/tmp/geumbaksa-ep8-videos-fullclips/`)으로 재조립하면 대부분 해결되지만, s2(8초 < 대사 9.29초)와 s5(10초 < 대사 10.84초)가 여전히 짧음.
- 조치: 기존 이미지 그대로 **둘 다 10초**로 재생성. s2는 완전 해결, s5는 0.83초 남음(마지막 0.8초에 다음 장면이 먼저 보임 — Owner 수용, 2026-09-26).

| 씬 | 이미지(기존 그대로) | 카드 문구 | 저장 | 필요 길이 | 요청 |
|---|---|---|---|---|---|
| s2 hook | `C:/tmp/geumbaksa-ep8-images/geumbaksa_ep8_s2.png` | 강남3구·용산 / 서울 전역 (지도 비교) | `Downloads/2.mp4` | 9.29초 | **10초** |
| s5 residence_condition_purpose | `C:/tmp/geumbaksa-ep8-images/geumbaksa_ep8_s5.png` | 실거주 2년 (집 + 금지 표시 그래프) | `Downloads/5.mp4` | 10.84초 | **10초** |

두 장면 모두 카드를 **양손**으로 들고 있어 손·카드는 완전 고정, 동작은 얼굴(눈·눈썹·입)과 고개에만 준다.

================================================================================
# 🟨 10초 티어 (s2, s5)
================================================================================

## s2 — hook (10초, '강남3구·용산 / 서울 전역' 비교 카드 양손)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design (round gold coin body, white gloves,
round gold feet, brown eyebrows) and the bright real-estate consultation
office background exactly as shown in the reference image. Do not change
any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the comparison card — a red label
"강남3구·용산" above a gray Seoul map with a small red area on the left, and
a blue label "서울 전역" above an all-blue Seoul map on the right — is held
firmly in BOTH gloved hands at chest height and holds steadily at exactly
its current position and angle for the ENTIRE 10 seconds. The card and both
hands never move, tilt, slide, slip, or drop at any point, especially not in
the final 2-3 seconds. Treat the card and both gloved hands as a frozen
photograph layered in front of the character's body, glued in place.

MOTION DETAIL: because both hands hold the card, only the character's face
and upper body move — eyes widen and blink, eyebrows rise in surprise,
a subtle head tilt left and right, and the coin body leans very slightly
forward and back. The small yellow surprise spark shapes near its head stay
fixed in place. Wide-eyed, astonished "you didn't know?" expression.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by moving
the card or the hands.

STATIC ELEMENTS: the comparison card (including both maps and both labels),
the "부동산 안내" wall sign, the "구역도" map poster with its pins, the "상담"
desk plate, the blue binders labeled "서류" and "접수", the monitor, the
chair, and the plants must stay completely fixed — no camera pan or zoom,
no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("강남3구·용산", "서울 전역"), both map shapes and colors, and the background
signs ("부동산 안내", "구역도", "상담", "서류", "접수") as locked,
non-regenerating image layers for the full 10 seconds. Render these exactly
as pixels copied from the reference image, unchanged frame to frame — the
digit 3 must never change.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage or maps, no
map color changes, no background changes, no character redesign, no abrupt
cut or freeze mid-motion, no static mouth, no minimal mouth movement, no
closed-mouth talking, no frozen expression while speaking, no card or hand
movement, no card tilting, slipping, or dropping, no full-body freeze at any
point, no holding completely still for more than half a second anywhere in
the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST
SECOND, NO CARD MOVEMENT OR DROP AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if excitedly
revealing a surprising fact — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## s5 — residence_condition_purpose (10초, '실거주 2년' 카드 양손)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design (round gold coin body, white gloves,
round gold feet, brown eyebrows) and the bright real-estate consultation
office background exactly as shown in the reference image. Do not change
any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the card showing a small house icon at the
top, the red text "실거주 2년" in the middle, and a red-crossed-out rising
bar chart at the bottom is held firmly in BOTH gloved hands at chest height
and holds steadily at exactly its current position and angle for the
ENTIRE 10 seconds. The card and both hands never move, tilt, slide, slip,
or drop at any point, especially not in the final 2-3 seconds. Treat the
card and both gloved hands as a frozen photograph layered in front of the
character's body, glued in place.

MOTION DETAIL: because both hands hold the card, only the character's face
and upper body move — eyes blink, eyebrows knit into a serious, slightly
stern look, a slow nod and a subtle head tilt, and the coin body leans very
slightly forward as if stressing an important rule. Serious, not smiling.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 3-4 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This is a longer explanatory scene, so sustained
liveliness matters even more than usual. This continuous motion must never
be achieved by moving the card or the hands.

STATIC ELEMENTS: the card (house icon, text, crossed-out chart), the
"지역 안내도" map sign with its district labels, the "부동산 상담" wall sign,
the binders labeled "매매", "전세", "청약", the "내 집 마련 함께해요" desk
plate, the monitor, the chair, the miniature house, and the plants must stay
completely fixed — no camera pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("실거주 2년"), the crossed-out chart icon, and the background text
("지역 안내도", "마포", "강남", "서초", "송파", "부동산 상담", "매매",
"전세", "청약", "내 집 마련 함께해요") as locked, non-regenerating image
layers for the full 10 seconds. Render these exactly as pixels copied from
the reference image, unchanged frame to frame — the digit 2 must never
change.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage or map
labels, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal mouth movement, no
closed-mouth talking, no frozen expression while speaking, no card or hand
movement, no card tilting, slipping, or dropping, no full-body freeze at any
point, no holding completely still for more than half a second anywhere in
the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST
SECOND, NO CARD MOVEMENT OR DROP AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if seriously
explaining an important residence condition and why it exists — never
static, never barely-moving, never closed-mouth talking, never frozen even
in the final seconds.
```

## 완료 후 절차
1. `C:/Users/PC/Downloads/2.mp4`, `5.mp4`로 저장(숫자 = 씬 번호). 카드 문구로 이미지 한 번 더 확인.
2. Claude: 0~필요 길이 구간 검수 → `C:/tmp/geumbaksa-ep8-videos-fullclips/ep8_s2_video.mp4`·`ep8_s5_video.mp4` 교체 → 재조립(`--clip-dir …-fullclips`, audio-summary `geumbaksa-ep8-tts/output-v2voice`) → CTA 결합(`--alignment` output-v2voice, `geumbaksa_cta_clean_final_v3voice.mp4`) → 화면·대사 일치 확인.
