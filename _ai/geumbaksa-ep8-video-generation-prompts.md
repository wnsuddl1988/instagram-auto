# 금박사 8편(토지거래허가구역) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/geumbaksa-ep8-images/`
영상 저장 폴더(신규 생성): `C:/tmp/geumbaksa-ep8-videos/`

씬 길이 티어는 TTS 실측(`rawAudioDurationSec`) 기준, CURRENT_STANDARDS.md 원칙(8초 미만→8초, 8초 이상→실측+1초 미만) 그대로 적용.

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 길이 티어 |
|---|---|---|---|
| s1 opening | `geumbaksa_ep8_s1.png` | `geumbaksa_ep8_s1_motion.mp4` | 8초 (실측 6.549초) |
| s2 hook | `geumbaksa_ep8_s2.png` | `geumbaksa_ep8_s2_motion.mp4` | 8초 (실측 7.707초) |
| s3 definition | `geumbaksa_ep8_s3.png` | `geumbaksa_ep8_s3_motion.mp4` | 8초 (실측 5.46초) |
| s4 penalty | `geumbaksa_ep8_s4.png` | `geumbaksa_ep8_s4_motion.mp4` | 8초 (실측 5.78초) |
| s5 residence_condition_purpose | `geumbaksa_ep8_s5.png` | `geumbaksa_ep8_s5_motion.mp4` | **10초** (실측 9.22초) |
| s6 grace_period | `geumbaksa_ep8_s6.png` | `geumbaksa_ep8_s6_motion.mp4` | 8초 (실측 4.853초) |
| s7 ministry_power | `geumbaksa_ep8_s7.png` | `geumbaksa_ep8_s7_motion.mp4` | 8초 (실측 5.54초) |
| s8 how_to_check_closing | `geumbaksa_ep8_s8.png` | `geumbaksa_ep8_s8_motion.mp4` | 8초 (실측 7.933초) |

★ 영상 생성 절대규칙(87씬 전수조사 확정, `_ai/CURRENT_STANDARDS.md` §0) 전부 반영:
- 소품을 든 손은 **한 지점 고정**("holds steadily at", 이동·반복 왕복 지시 금지)
- **동작은 소품을 안 든 빈 쪽에만** 배정
- 소품·보드는 전부 "frozen photograph layered behind/beside the character"로 명시
- 텍스트는 CRITICAL TEXT PRESERVATION(HIGHEST PRIORITY) 블록으로 고정

★ 추가 규칙(12편 s10 사고 재발 방지): **모든 씬에 "CONTINUOUS MOTION FOR THE FULL CLIP" 블록을 넣어,
클립의 어느 구간도(특히 후반부) 0.5초 이상 완전히 같은 프레임처럼 고정되지 않도록 명시한다.** 입
모양, 눈 깜빡임, 미세한 머리 움직임이 처음부터 끝까지 끊기지 않아야 한다.

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작 프레임뿐 아니라 클립 중반·후반 프레임에서도
텍스트·소품·동작 지속 여부를 확인한다.

================================================================================
# 🟩 10초 티어 (1개 씬: s5)
================================================================================

---

## s5 — residence_condition_purpose (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design (round gold coin body, white gloves,
gold boots, brown eyebrows) and the bright real-estate consultation office
background exactly as shown in the reference image — same "지역 안내도" map
sign, same "부동산 상담" wall sign, same file binders and desk plate. Do not
change any colors, text, or object positions.

MOTION DETAIL: the character holds the "실거주 2년" card (with a small house
icon at the top and a red-crossed-out rising bar chart below) steadily in
both gloved hands at chest height — the card does not travel, tilt, or shift
position, treat it as a fixed object the character is simply holding still.
Only the character's head, eyebrows, eyes, and mouth move, showing a
serious, slightly stern expression as it explains an important condition —
not smiling.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 3-4 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This is a longer explanatory scene, so sustained
liveliness matters even more than usual.

STATIC ELEMENTS: the background signage ("지역 안내도" map, "부동산 상담"
wall sign), file binders, plants, monitor, and chairs must stay completely
fixed — no camera pan or zoom, no background object movement, no card
movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
10 seconds — this includes the card text ("실거주 2년"), the house icon, the
crossed-out bar chart icon, the "지역 안내도" map sign, and the "부동산
상담" wall sign. Render these exactly as pixels copied from the reference
image, unchanged frame to frame — do not let the video model regenerate,
redraw, reinterpret, or reflow any of this text, even slightly, even for one
frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, no card
movement, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if seriously
explaining an important residence condition and its purpose — never static,
never barely-moving, never closed-mouth talking, never frozen even in the
final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep8-videos/geumbaksa_ep8_s5_motion.mp4`로 저장
2. 시작 프레임(텍스트), 중반 프레임(5초 지점), 끝 프레임(9초 지점) 전부 확인 — 특히 후반부 정지 여부
3. 문제 없으면 다음 씬 진행

================================================================================
# 🟦 8초 티어 (7개 씬: s1·s2·s3·s4·s6·s7·s8)
================================================================================

---

## s1 — opening (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design (round gold coin body, white gloves,
gold boots) and the bright real-estate consultation office background
exactly as shown in the reference image — same "부동산 안내" wall sign,
same "구역도" map poster, same "상담" desk plate, same file binders and
plants. Do not change any colors, text, or object positions.

MOTION DETAIL: the character greets the viewer with both hands held up
near chest height in a friendly open gesture (no card or prop held), warm
and welcoming expression, occasional gentle head tilt.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage ("부동산 안내" wall sign, "구역도"
map poster, "상담" desk plate), file binders, plants, and chairs must stay
completely fixed — no camera pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the "부동산 안내" wall sign, the "구역도" map
poster, and the "상담" desk plate. Render these exactly as pixels copied
from the reference image, unchanged frame to frame — do not let the video
model regenerate, redraw, reinterpret, or reflow any of this text, even
slightly, even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, no full-body
freeze at any point, no holding completely still for more than half a
second anywhere in the clip.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
introducing itself and today's topic — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep8-videos/geumbaksa_ep8_s1_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s2 — hook (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the bright real-estate consultation
office background exactly as shown in the reference image — same "구역도"
map poster with small pins, same file binders and blue folders labeled
"서류"/"접수". Do not change any colors, text, or object positions.

MOTION DETAIL: the character holds a comparison card steadily in both
gloved hands at chest height — showing a small red-highlighted area
(Gangnam 3 districts + Yongsan) beside a much larger blue-highlighted area
(almost all of Seoul). The card does not travel or shift position. The
character's expression is wide-eyed and surprised, mouth slightly open in
an astonished look, small yellow "surprise" spark shapes near its head stay
fixed in place (part of the frozen background/prop layer, not animated
particles).

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, blue folders ("서류", "접수"),
plants, monitor, and the comparison card (including both map highlights)
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the "구역도" map poster, the "서류"/"접수" folder
labels, and the comparison card's map highlights. Render these exactly as
pixels copied from the reference image, unchanged frame to frame — do not
let the video model regenerate, redraw, reinterpret, or reflow any of this
text, even slightly, even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage or maps, no background changes, no character redesign, no abrupt
cut or freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, no card
movement, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if excitedly
revealing a surprising fact — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep8-videos/geumbaksa_ep8_s2_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s3 — definition (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the bright real-estate consultation
office background exactly as shown in the reference image — same "부동산
안내" wall sign, same "구역도" map poster, same "서류"/"접수" blue folders.
Do not change any colors, text, or object positions.

MOTION DETAIL: the character holds the "계약 전 / 구청 허가 필수" card
(with a small house icon) steadily in both gloved hands at chest height —
the card does not travel or shift position. The character's expression is
calm and clear, explaining a definition in a composed, informative manner
— not smiling broadly.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, map poster, folders, plants, and
the card (including its "계약 전", "구청 허가 필수" text and house icon)
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("계약 전", "구청 허가 필수"), the
"부동산 안내" wall sign, and the "구역도" map poster. Render these exactly
as pixels copied from the reference image, unchanged frame to frame — do
not let the video model regenerate, redraw, reinterpret, or reflow any of
this text, even slightly, even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, no card
movement, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if calmly
stating a clear one-line definition — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep8-videos/geumbaksa_ep8_s3_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s4 — penalty (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the bright real-estate consultation
office background exactly as shown in the reference image — same "서울시
구역도" map with Yongsan/Gangnam/Seocho/Songpa highlighted, same "내 집, 더
나은 내일" wall poster, same "부동산 상담" monitor screen. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds one gloved hand up in a "stop" gesture
toward the camera on one side, while the other hand holds the "무효·징역·
벌금" card (with a contract icon crossed out in red) steadily at chest
height on the other side — neither hand travels or shifts position. The
character's expression is serious and stern, eyebrows angled down, not
smiling.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage ("서울시 구역도" map, "내 집, 더
나은 내일" poster, "부동산 상담" monitor screen), plants, chairs, and the
card (including its "무효·징역·벌금" text and crossed-out contract icon)
must stay completely fixed — no camera pan or zoom, no background object
movement, no card movement, no stop-hand movement beyond the fixed raised
pose.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("무효·징역·벌금"), the "서울시
구역도" map labels (용산/강남/송파), the "내 집, 더 나은 내일" poster, and
the "부동산 상담" monitor screen text. Render these exactly as pixels
copied from the reference image, unchanged frame to frame — do not let the
video model regenerate, redraw, reinterpret, or reflow any of this text,
even slightly, even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage or maps, no background changes, no character redesign, no abrupt
cut or freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, no card
movement, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if sternly
warning about a serious penalty — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep8-videos/geumbaksa_ep8_s4_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s6 — grace_period (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the bright real-estate consultation
office background exactly as shown in the reference image — same "부동산
정보 상담" map board with district-color legend, same "행복한 주거생활"
monitor screen, same "주택정책"/"부동산 동향"/"생활정보" book stack. Do not
change any colors, text, or object positions.

MOTION DETAIL: the character holds the "실거주 유예 / 최장 3년 3개월" card
(with a small house icon at the top) steadily in both gloved hands at chest
height — the card does not travel or shift position. The character's
expression is bright and pleased, a gentle smile, as if sharing good news.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage ("부동산 정보 상담" map board,
"행복한 주거생활" monitor screen), book stack, plants, small house model,
and the card (including its "실거주 유예", "최장 3년 3개월" text) must stay
completely fixed — no camera pan or zoom, no background object movement, no
card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("실거주 유예", "최장 3년 3개월"),
the map board legend text, the monitor screen text, and the book spines
("주택정책", "부동산 동향", "생활정보"). Render these exactly as pixels
copied from the reference image, unchanged frame to frame — do not let the
video model regenerate, redraw, reinterpret, or reflow any of this text,
even slightly, even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, no card
movement, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if cheerfully
sharing an updated, more lenient rule — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep8-videos/geumbaksa_ep8_s6_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s7 — ministry_power (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the bright real-estate consultation
office background exactly as shown in the reference image — same "부동산
정보 상담" map board with district-color legend, same "궁금한 부동산 정보"
monitor screen, same book stack. Do not change any colors, text, or object
positions.

MOTION DETAIL: the character holds the "국토부 장관 직접 지정 / 국회
통과·시행 예정" card (with a house icon at the top) steadily in one gloved
hand at chest height, while the other hand points toward the card in a
fixed pose (not touching or moving it) — the card does not travel or shift
position. The character's expression is calm, confident, and informative.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage ("부동산 정보 상담" map board,
"궁금한 부동산 정보" monitor screen), book stack, plants, small house
model, and the card (including its "국토부 장관 직접 지정", "국회 통과·시행
예정" text) must stay completely fixed — no camera pan or zoom, no
background object movement, no card movement, no pointing-hand movement
beyond the fixed pose.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("국토부 장관 직접 지정", "국회
통과·시행 예정"), the map board legend text, and the monitor screen text.
Render these exactly as pixels copied from the reference image, unchanged
frame to frame — do not let the video model regenerate, redraw,
reinterpret, or reflow any of this text, even slightly, even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, no card
movement, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if calmly
explaining an upcoming legal change — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep8-videos/geumbaksa_ep8_s7_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s8 — how_to_check_closing (10초로 확장) — REGEN v4

**REGEN v2, v3 모두 프롬프트 강화만으로는 실패했다(2026-09-22, Owner 지적):
"영상을 9초든 10초든 길게 만들면 문제없어지는거아니가?"** — 정확한 지적이다.
필요한 정상 구간은 8.25초뿐인데 클립이 딱 8초라서, 끝부분 0.3~0.4초 결함
구간을 잘라내면 남는 정상 구간이 오디오보다 짧아져 tpad 정지가 발생했다.
클립을 10초로 만들면 끝부분 결함 구간을 잘라내도 8.25초 이상이 항상 남아
tpad 자체가 필요 없어진다. 카메라/폰 고정 지시는 유지하되(결함 자체를
줄이려는 시도), 근본 해결은 여유 길이 확보다.

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the bright real-estate consultation
office background exactly as shown in the reference image — same "부동산
정보 상담" map board, same "함께 만드는 좋은 주거 미래" monitor screen, same
book stack. Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no
push-in, no framing drift, not even a slow or subtle one. The framing at
frame 1 and the framing at the very last frame (10.0s) must be pixel-for-
pixel identical in scale and crop.

PHONE LOCK (HIGHEST PRIORITY): the smartphone is held completely rigid and
motionless in the character's gloved hand for the ENTIRE 10 seconds — as if
the hand and phone were a single fused object welded in place. The phone's
tilt angle, rotation, height, and distance from camera must stay identical
from frame 1 to the very last frame. It never rotates, tips, tilts forward
or sideways, rises, lowers, or drifts even slightly, at any point.

LAST 2 SECONDS — EXPLICIT CHECK (HIGHEST PRIORITY): pay special attention
to the final 2 seconds of the clip (8.0s-10.0s). This is the exact window
where video models most often let go of a held prop or drift the camera
right before the clip ends. In this window specifically: the phone screen
text "토지이음" and "eum.go.kr" must remain perfectly flat, horizontal, and
readable — not tilted, not rotated, not angled away from camera. The
camera framing must not creep or zoom. Treat the last 2 seconds with the
exact same rigidity as the first frame, not as a moment where the pose is
allowed to relax or drift.

MOTION DETAIL: the character holds the smartphone steadily in one gloved
hand at chest height, showing its screen ("토지이음 eum.go.kr" with a map
pin icon) toward the camera — the phone does not tilt, rise, lower, or move
at all, the hand keeps it locked in the same position and angle for the
entire clip. The other hand points gently toward the phone screen in a
fixed pose (not touching or moving it). The character's expression is warm
and friendly, a gentle smile — this is the wrap-up scene.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY, THIS IS THE FINAL
SCENE — DO NOT LET IT GO STATIC): the character must show visible,
continuous motion for the ENTIRE 10 seconds, including the last 2-3 seconds
— natural eye blinks at least every 2-3 seconds, subtle head nods, gentle
breathing motion, continuous mouth movement while speaking. No portion of
the clip, especially the back half, should hold a single frozen pose for
more than half a second. After speech ends (if applicable), the character
keeps breathing/blinking gently rather than freezing into a static held
expression.

STATIC ELEMENTS: the background signage ("부동산 정보 상담" map board,
including the full district-color legend text on the right edge of the
frame — "주거지역", "상업지역", "녹지지역", "개발예정지" — must remain
fully visible and uncropped for the entire clip), "함께 만드는 좋은 주거
미래" monitor screen, book stack, plants, small house model, and the phone
(including its "토지이음", "eum.go.kr" text and map pin icon) must stay
completely fixed — no camera pan or zoom, no background object movement, no
phone movement, no pointing-hand movement beyond the fixed pose.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
10 seconds — this includes the phone screen text ("토지이음", "eum.go.kr"),
the FULL map board legend text on the right edge of the frame (all four
lines: "주거지역", "상업지역", "녹지지역", "개발예정지" — none of these may
be cropped or pushed out of frame by any zoom drift), and the monitor
screen text. Render these exactly as pixels copied from the reference
image, unchanged frame to frame — do not let the video model regenerate,
redraw, reinterpret, reflow, or crop any of this text, even slightly, even
for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, no phone
movement, no phone floating or blurring, NO FULL-BODY FREEZE AT ANY POINT,
no holding completely still for more than half a second anywhere in the
clip, no rigid locked pose for the second half of the clip, NO CAMERA ZOOM
OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, no cropping of the
right-edge legend text.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
wrapping up with a helpful reminder to check before signing a contract —
never static, never barely-moving, never closed-mouth talking, never frozen
even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep8-videos/geumbaksa_ep8_s8_motion.mp4`로 저장
2. 시작·중반(4초)·**8.0초부터 10.0초까지 0.3초 간격으로** 전부 확인 — 카메라 줌인, 폰
   기울어짐/회전 재발 여부를 끝부분 위주로 꼼꼼히 확인.
3. **결함이 없는 구간까지만(예: 결함이 8.5초부터 시작되면 8.5초로) 트림해서 사용** — 이번엔
   클립이 10초이므로 결함 구간을 잘라내도 필요한 8.25초보다 넉넉히 남아 tpad 정지가 생기지
   않을 가능성이 높다. 트림 후 남는 길이가 8.25초 이상인지 반드시 계산해서 확인.
4. `_geumbaksa-ep8-assembly-spec.mjs`의 s8 `tailPadSec`은 0으로 유지, `ep8_s8_video.mp4`를
   트림된 새 클립으로 교체 후 재조립 → CTA 재결합 진행
