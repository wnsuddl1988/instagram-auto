# 황소특보 1편(반도체 섹터 강세, 원인 체인 설명형) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/money-shorts-os/bull-ep1-images/out/`
영상 저장 폴더(신규 생성): `C:/tmp/money-shorts-os/bull-ep1-videos/`

**9씬 재확정(2026-09-23, 2차 수정)** — 처음엔 9번(클로징)을 삭제해 8씬으로 갔으나, s8이 두 문장을
욱여넣어 9.94초 발화가 되면서 영상(8~10초)과 발화(11.5초+) 길이 차이로 CTA 연결부 앞에 정지
구간이 생기는 문제가 발생(Owner 지적: "마지막씬 1분10초부터 영상이 멈추는데"). 해결책으로 원래
s8 문장을 자연스럽게 s8(체크포인트, 압축)+s9(여운 있는 마무리)로 나눠 9씬으로 재확정. TTS 오디오도
9씬 기준으로 재생성 완료(`C:/tmp/money-shorts-os/bull-ep1-tts-v3/out/elevenlabs-korean-director-23b0e3a711d292.m4a`, 78.12초).

씬 길이 티어는 TTS 실측(`rawAudioDurationSec`) 기준, CURRENT_STANDARDS.md 원칙(8초 미만→8초,
8초 이상→실측+1초 미만) 그대로 적용.

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 실측 발화 | 길이 티어 |
|---|---|---|---|---|
| s1 opening | `bull_ep1_s1.png` | `bull_ep1_s1_motion.mp4` | 6.58초 | 8초 |
| s2 hook | `bull_ep1_s2.png` | `bull_ep1_s2_motion.mp4` | 6.98초 | 8초 |
| s3 background | `bull_ep1_s3.png` | `bull_ep1_s3_motion.mp4` | 7.27초 | 8초 |
| s4 evidence_card | `bull_ep1_s4.png` | `bull_ep1_s4_motion.mp4` | 9.41초 | 10초 |
| s5 twist | `bull_ep1_s5.png` | `bull_ep1_s5_motion.mp4` | 9.14초 | 10초 |
| s6 impact | `bull_ep1_s6.png` | `bull_ep1_s6_motion.mp4` | 8.58초 | 9초 |
| s7 recommendation | `bull_ep1_s7.png` | `bull_ep1_s7_motion.mp4` | 8.17초 | 9초 |
| s8 checkpoint(압축) | `bull_ep1_s8.png` | `bull_ep1_s8_motion.mp4` | 6.26초 | 8초 |
| s9 closing(신규) | `bull_ep1_s9.png` | `bull_ep1_s9_motion.mp4` | 9.04초 | 10초 |

**s1~s7은 기존에 이미 검수·승인된 영상을 그대로 재사용한다(재생성 불필요) — s8/s9만 새로
생성한다.** s1~s7 실측 발화가 이전 문서(9씬 최초본) 대비 미세하게 달라진 건 TTS를 통째로
재생성해서(같은 문장이라도 모델이 매번 살짝 다른 길이로 발화) 생긴 오차이며, 기존 영상
클립(8/8/8/10/10/9/9초 티어)과 여전히 호환되는 범위라 재생성하지 않는다.

★ 영상 생성 절대규칙(87씬 전수조사 확정, `_ai/CURRENT_STANDARDS.md` §0) 전부 반영:
- 소품을 든 손은 **한 지점 고정**("holds steadily at", 이동·반복 왕복 지시 금지)
- **동작은 소품을 안 든 빈 쪽에만** 배정
- 소품·보드는 전부 "frozen photograph layered behind/beside the character"로 명시
- 텍스트는 CRITICAL TEXT PRESERVATION(HIGHEST PRIORITY) 블록으로 고정
- 나레이션이 있는 영상이므로 "Silent" 문구는 절대 넣지 않는다([[feedback_video_prompt_text_preservation_must_verify]] — 입움직임 지시와 모순되면 오디오 생성 자체가 거부됨, 실측 확인됨)

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작 프레임뿐 아니라 클립 중반·후반 프레임에서도
텍스트·소품·동작 지속 여부, 카메라 줌/크롭, 소품 기울어짐을 확인한다.

================================================================================
# 🟦 8초 티어 (s1~s3)
================================================================================

---

## s1 — opening (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the semiconductor-factory-front
background exactly as shown in the reference image — same wafer-shaped
rainbow emblem above the entrance, same blue-and-gold flags, same building
facade. Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character points energetically upward with one hand
raised, the other hand resting on its hip, wide eyes and a big, bright
smile throughout.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the building facade, the wafer-shaped rainbow emblem, the
blue-and-gold flags, the trees, and the plaza tiles must stay completely
fixed — no camera pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every detailed surface
in this frame as a locked, non-regenerating image layer for the full 8
seconds — this includes the wafer emblem's grid pattern and the flag
stripes. Render these exactly as pixels copied from the reference image,
unchanged frame to frame — do not let the video model regenerate, redraw,
reinterpret, or reflow any of this, even slightly, even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, or flickering surfaces anywhere in
the frame, no regenerated or reinterpreted building details, no background
changes, no character redesign, no abrupt cut or freeze mid-motion, no
static mouth, no minimal lip movement, no closed-mouth talking, no frozen
expression while speaking, no full-body freeze at any point, no holding
completely still for more than half a second anywhere in the clip, NO
CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if brightly
introducing itself and today's topic — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/bull-ep1-videos/bull_ep1_s1_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카메라 줌/크롭 여부 포함
3. 문제 없으면 다음 씬 진행

---

## s2 — hook (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the semiconductor-factory-front
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a white card showing
three bold green upward arrows, completely rigid in both hands at chest
height for the entire clip — the card does not tilt, rotate, rise, lower,
or drift at any point, including the final 1-2 seconds. Treat the card as a
frozen photograph layered in front of the character.

MOTION DETAIL: the character shows a surprised, wide-eyed expression, mouth
open, eyebrows raised — the only movement is in the face and head, since
both hands are occupied holding the card steady.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the building facade, the wafer-shaped rainbow emblem, the
flags, the card (including the three green arrows), plants must stay
completely fixed — no camera pan or zoom, no background object movement, no
card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card's three green
arrows and the wafer emblem's grid pattern as locked, non-regenerating
image layers for the full 8 seconds. Render these exactly as pixels copied
from the reference image, unchanged frame to frame.

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
continuously in natural speech rhythm for the entire clip, as if excitedly
pointing out a surprising trend — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/bull-ep1-videos/bull_ep1_s2_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s3 — background (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the semiconductor-factory-front
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a white card reading
"간밤 뉴욕증시 반도체 급등" and "필라델피아반도체지수 +2.06%" completely
rigid in both hands at chest height for the entire clip — the card does not
tilt, rotate, rise, lower, or drift at any point, including the final 1-2
seconds. Treat the card as a frozen photograph layered in front of the
character.

MOTION DETAIL: the character's expression is curious and intrigued, head
slightly tilted, as if sharing an interesting fact.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the building facade, the wafer-shaped rainbow emblem, the
flags, the card (including its full text), plants must stay completely
fixed — no camera pan or zoom, no background object movement, no card
movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("간밤
뉴욕증시 반도체 급등", "필라델피아반도체지수 +2.06%") and the wafer
emblem's grid pattern as locked, non-regenerating image layers for the
full 8 seconds. Render these exactly as pixels copied from the reference
image, unchanged frame to frame.

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
continuously in natural speech rhythm for the entire clip, as if curiously
explaining where the trend started — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/bull-ep1-videos/bull_ep1_s3_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

================================================================================
# 🟩 9초 티어 (s7)
================================================================================

---

## s7 — recommendation (9초)

```
Animate this image into a 9-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the semiconductor-factory-front
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 9 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

MOTION DETAIL: the character's expression turns calm and thoughtful,
eyebrows slightly drawn together, both hands held open and empty at chest
height in a gentle, measured gesture emphasizing caution — no props held.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 9 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the building facade, the wafer-shaped rainbow emblem, the
flags, plants must stay completely fixed — no camera pan or zoom, no
background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the wafer emblem's
grid pattern and flag details as locked, non-regenerating image layers for
the full 9 seconds. Render these exactly as pixels copied from the
reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, or flickering surfaces anywhere in
the frame, no regenerated or reinterpreted signage, no background changes,
no character redesign, no abrupt cut or freeze mid-motion, no static mouth,
no minimal lip movement, no closed-mouth talking, no frozen expression
while speaking, no full-body freeze at any point, no holding completely
still for more than half a second anywhere in the clip, NO CAMERA ZOOM OR
FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if calmly
urging the viewer not to jump to conclusions too quickly — never static,
never barely-moving, never closed-mouth talking, never frozen even in the
final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/bull-ep1-videos/bull_ep1_s7_motion.mp4`로 저장
2. 시작·중반·끝(8~9초) 프레임 확인
3. 문제 없으면 다음 씬 진행

================================================================================
# 🟨 10초 티어 (s4~s6, s8)
================================================================================

---

## s4 — evidence_card (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the semiconductor-factory-front
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds two cards, one in each
hand — a round gold-bordered badge card reading "AI 신제품 흥행" in the left
hand, and a red arrow-shaped card reading "AI 반도체 수요 확대 기대" in the
right hand — both completely rigid at chest height for the entire clip.
Neither card tilts, rotates, rises, lowers, or drifts at any point,
including the final 1-2 seconds. Treat both cards as frozen photographs
layered in front of the character.

MOTION DETAIL: the character's expression is confident and assured,
eyebrows raised, as if revealing the real reason behind the trend — only
subtle head and facial motion, since both hands are occupied holding the
cards steady.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the building facade, the wafer-shaped rainbow emblem, the
flags, both cards (including their full text), plants must stay completely
fixed — no camera pan or zoom, no background object movement, no card
movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("AI
신제품 흥행", "AI 반도체 수요 확대 기대") and the wafer emblem's grid
pattern as locked, non-regenerating image layers for the full 10 seconds.
Render these exactly as pixels copied from the reference image, unchanged
frame to frame.

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
continuously in natural speech rhythm for the entire clip, as if confidently
revealing the true cause — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/bull-ep1-videos/bull_ep1_s4_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s5 — twist (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the semiconductor-factory-front
background exactly as shown in the reference image — this scene is a wide
shot showing the full building. Do not change any colors, text, or object
positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a large card reading
"대형주→중소형 장비주까지 확산" with one red arrow branching into several
orange arrows, completely rigid in both hands at chest height for the
entire clip — the card does not tilt, rotate, rise, lower, or drift at any
point, including the final 1-2 seconds. Treat the card as a frozen
photograph layered in front of the character.

MOTION DETAIL: the character's expression is exaggeratedly surprised, mouth
wide open, eyes wide — only facial and head motion, since both hands are
occupied holding the card steady.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the building facade, the wafer-shaped rainbow emblem, the
flags, the card (including its full text and arrow diagram), plants must
stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("대형주→중소형 장비주까지 확산") and arrow diagram, and the wafer emblem's
grid pattern, as locked, non-regenerating image layers for the full 10
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
continuously in natural speech rhythm for the entire clip, as if excitedly
revealing that the trend spread further than expected — never static,
never barely-moving, never closed-mouth talking, never frozen even in the
final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/bull-ep1-videos/bull_ep1_s5_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s6 — impact (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the semiconductor-factory-front
background exactly as shown in the reference image, bright tone. Do not
change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a gold-bordered card
reading "코스피 장 초반 1%대 상승" with a green upward bar-and-arrow graph,
completely rigid in one hand at chest height for the entire clip — the
card does not tilt, rotate, rise, lower, or drift at any point, including
the final 1-2 seconds. The other hand is raised in a triumphant fist at
shoulder height, held steady. Treat the card as a frozen photograph layered
in front of the character.

MOTION DETAIL: the character's expression is triumphant and confident, a
big bright smile — only facial and head motion plus the steady raised fist,
since one hand is occupied holding the card.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the building facade, the wafer-shaped rainbow emblem, the
flags, the card (including its full text and graph), plants must stay
completely fixed — no camera pan or zoom, no background object movement, no
card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("코스피
장 초반 1%대 상승") and graph, and the wafer emblem's grid pattern, as
locked, non-regenerating image layers for the full 10 seconds. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, no raised
fist movement beyond a steady hold, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
triumphantly announcing the index's rise — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/bull-ep1-videos/bull_ep1_s6_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s8 — checkpoint (8초, 압축본 — 더 이상 마지막 씬 아님)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the semiconductor-factory-front
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds an easel-mounted card
showing a round clock face (reading roughly 10 o'clock, with a small
crescent moon icon) above the text "오늘 밤 미국 증시 재개장" with a bold
underline, completely rigid in one hand at chest height for the entire
clip — the card does not tilt, rotate, rise, lower, or drift at any point,
including the final 1-2 seconds. The other hand points gently toward the
card in a fixed pose.

MOTION DETAIL: the character's expression is bright and expectant, eyes
sparkling, as if inviting the viewer to watch for tonight's reopening.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the building facade, the wafer-shaped rainbow emblem, the
flags, the card (including the clock face and full text), plants must stay
completely fixed — no camera pan or zoom, no background object movement, no
card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("오늘
밤 미국 증시 재개장"), the clock face, and the wafer emblem's grid pattern
as locked, non-regenerating image layers for the full 8 seconds. Render
these exactly as pixels copied from the reference image, unchanged frame to
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
continuously in natural speech rhythm for the entire clip, as if brightly
inviting the viewer to watch tonight's reopening — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/bull-ep1-videos/bull_ep1_s8_motion.mp4`로 저장(기존 파일 교체)
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s9 — closing (10초, 신규 — 여운 있는 마무리, CTA 직전)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the semiconductor-factory-front
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

MOTION DETAIL: the character's expression is soft, warm, and reflective —
a gentle closing-note smile, not an excited grin. Both hands rest calmly,
one open at the side and the other relaxed near the waist — no waving
gesture, this is a quiet, composed wrap-up, not an energetic goodbye. No
props held.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY, THIS IS THE FINAL
SCENE OF THE EPISODE — DO NOT LET IT GO STATIC): the character must show
visible, continuous motion for the ENTIRE 10 seconds, including the last
2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle head
tilts, gentle breathing motion, continuous mouth movement while speaking.
No portion of the clip, especially the back half, should hold a single
frozen pose for more than half a second.

STATIC ELEMENTS: the building facade, the wafer-shaped rainbow emblem, the
flags, plants must stay completely fixed — no camera pan or zoom, no
background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the wafer emblem's
grid pattern and flag details as locked, non-regenerating image layers for
the full 10 seconds. Render these exactly as pixels copied from the
reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, or flickering surfaces anywhere in
the frame, no regenerated or reinterpreted signage, no background changes,
no character redesign, no abrupt cut or freeze mid-motion, no static mouth,
no minimal lip movement, no closed-mouth talking, no frozen expression
while speaking, NO FULL-BODY FREEZE AT ANY POINT, no holding completely
still for more than half a second anywhere in the clip, no rigid locked
pose for the second half of the clip, no big excited waving gesture (this
is a calm, quiet close, not an energetic goodbye), NO CAMERA ZOOM OR
FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
and calmly wrapping up today's story — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/money-shorts-os/bull-ep1-videos/bull_ep1_s9_motion.mp4`로 저장
2. 시작·중반(5초)·끝(9~10초) 프레임 전부 확인 — 마지막 씬이므로 후반부 정지 여부 특히 꼼꼼히 확인
3. 9개 씬 전부 완료 후 본편 조립(9씬 TTS 오디오 사용) → 고정 CTA(follow+teaser) 연결 진행
