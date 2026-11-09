# 부엉박사 13편(퇴직연금 실물이전) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/owl-ep13-images/`
영상 저장 폴더(신규 생성): `C:/tmp/owl-ep13-videos/`

씬 길이 티어는 TTS 실측(`rawAudioDurationSec`) 기준, CURRENT_STANDARDS.md 원칙(8초 미만→8초, 8초 이상→실측+1초 미만) 그대로 적용.

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 길이 티어 |
|---|---|---|---|
| s1 opening | `owl_ep13_s1_opening.png` | `owl_ep13_s1_opening_motion.mp4` | **10초** (실측 8.97초) |
| s2 background | `owl_ep13_s2_background.png` | `owl_ep13_s2_background_motion.mp4` | 8초 (실측 6.72초) |
| s3 problem | `owl_ep13_s3_problem.png` | `owl_ep13_s3_problem_motion.mp4` | 8초 (실측 6.97초) |
| s4 new_system | `owl_ep13_s4_new_system.png` | `owl_ep13_s4_new_system_motion.mp4` | 8초 (실측 7.06초) |
| s5 scale_flow | `owl_ep13_s5_scale_flow.png` | `owl_ep13_s5_scale_flow_motion.mp4` | 8초 (실측 6.44초) |
| s6 condition | `owl_ep13_s6_condition.png` | `owl_ep13_s6_condition_motion.mp4` | 8초 (실측 5.78초) |
| s7 db_dc_explainer | `owl_ep13_s7_db_dc_explainer.png` | `owl_ep13_s7_db_dc_explainer_motion.mp4` | **10초** (실측 9.41초) |
| s8 exception | `owl_ep13_s8_exception.png` | `owl_ep13_s8_exception_motion.mp4` | 8초 (실측 5.21초) |
| s9 upcoming | `owl_ep13_s9_upcoming.png` | `owl_ep13_s9_upcoming_motion.mp4` | 8초 (실측 6.29초) |
| s10 action | `owl_ep13_s10_action.png` | `owl_ep13_s10_action_motion.mp4` | 8초 (실측 6.08초) |

★ 영상 생성 절대규칙(87씬 전수조사 확정, `_ai/CURRENT_STANDARDS.md` §0) 전부 반영:
- 소품을 든 손은 **한 지점 고정**("holds steadily at", 이동·반복 왕복 지시 금지)
- **동작은 소품을 안 든 빈 쪽에만** 배정
- 소품·보드는 전부 "frozen photograph layered behind/beside the character"로 명시
- 텍스트는 CRITICAL TEXT PRESERVATION(HIGHEST PRIORITY) 블록으로 고정

★ 추가 규칙(2026-09-22, 12편 s10 사고 재발 방지 — `feedback_assembly_script_change_side_effects` /
검증 방법 착오 끝에 실측 확인한 결과, 클립이 시작 후 약 3.5초 지점부터 끝까지 거의 완전히 같은
포즈로 고정되어 있었다): **모든 씬에 "CONTINUOUS MOTION FOR THE FULL CLIP" 블록을 넣어, 클립의
어느 구간도(특히 후반부) 0.5초 이상 완전히 같은 프레임처럼 고정되지 않도록 명시한다.** 입 모양,
눈 깜빡임, 미세한 머리 움직임이 처음부터 끝까지 끊기지 않아야 한다는 걸 별도 문단으로 강조.

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작 프레임뿐 아니라 클립 중반·후반
프레임에서도 텍스트·소품·동작 지속 여부를 확인한다(끝 프레임만 보면 12편 s10처럼 후반부 정지를
놓칠 수 있음).

================================================================================
# 🟩 10초 티어 (2개 씬: s1·s7)
================================================================================

---

## s1 — opening (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design (vest, tie, sunglasses pushed up on forehead,
feather texture) and the bright retirement-pension customer service center
background exactly as shown in the reference image — same "퇴직연금 상담"
wall sign, same "상담" desk plate, same monitor and plants. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character greets the viewer with one wing raised in a
gentle waving gesture at chest height, confident and serious expression —
not smiling. The wing motion is a small, natural greeting gesture (a slight
lift and settle), not a large sweeping wave. The other wing rests calmly by
its side.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 3-4 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This is a confident, ongoing greeting, not a static
portrait.

STATIC ELEMENTS: the background signage ("퇴직연금 상담" wall sign, "상담"
desk plate), monitor, plants, and chairs must stay completely fixed — no
camera pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
10 seconds — this includes the large "퇴직연금 상담" wall sign and the
"상담" desk plate. Render these exactly as pixels copied from the reference
image, unchanged frame to frame — do not let the video model regenerate,
redraw, reinterpret, or reflow any of this text, even slightly, even for one
frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no full-body
freeze at any point, no holding completely still for more than half a
second anywhere in the clip.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly and
confidently greeting the viewer — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep13-videos/owl_ep13_s1_opening_motion.mp4`로 저장
2. 시작 프레임(텍스트), 중반 프레임(5초 지점), 끝 프레임(9초 지점) 전부 확인 — 특히 후반부 정지 여부
3. 문제 없으면 다음 씬 진행

---

## s7 — db_dc_explainer (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright retirement-pension customer
service center background exactly as shown in the reference image — same
"퇴직연금 상담" wall sign, same standing board with "DB형"/"DC형" split
panels (building icon + "회사 운용" on the left, person-with-chart icon +
"내가 운용" on the right). Do not change any colors, text, or object
positions.

MOTION DETAIL: the character stands beside the board, calmly explaining with
one wing gesturing gently toward the board (not touching it, not moving it)
— the board is a fixed standing object on the floor, never held or lifted.
The character's expression is thoughtful and explanatory, occasional gentle
head turn between the board and the viewer.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 3-4 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This is a longer explanatory scene, so sustained
liveliness matters even more than usual.

STATIC ELEMENTS: the background signage ("퇴직연금 상담"), the standing
board (including "DB형", "DC형", "회사 운용", "내가 운용" text and icons),
plants, monitor, and chairs must stay completely fixed — no camera pan or
zoom, no background object movement, no board movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
10 seconds — this includes the board text ("DB형", "DC형", "회사 운용",
"내가 운용"), the large "퇴직연금 상담" wall sign, and the "상담창구" desk
plate. Render these exactly as pixels copied from the reference image,
unchanged frame to frame — do not let the video model regenerate, redraw,
reinterpret, or reflow any of this text, even slightly, even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no board
movement, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if calmly
explaining a comparison — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep13-videos/owl_ep13_s7_db_dc_explainer_motion.mp4`로 저장
2. 시작 프레임(텍스트), 중반 프레임(5초 지점), 끝 프레임(9초 지점) 전부 확인 — 특히 후반부 정지 여부
3. 문제 없으면 다음 씬 진행

================================================================================
# 🟦 8초 티어 (8개 씬: s2·s3·s4·s5·s6·s8·s9·s10)
================================================================================

---

## s2 — background (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright retirement-pension customer
service center background exactly as shown in the reference image — same
"퇴직연금 상담" wall sign, same "상담" desk plate. Do not change any colors,
text, or object positions.

MOTION DETAIL: the character holds the "전량 매도 후 현금 이전" card
steadily in one wing at chest height — the card does not travel or shift
position, treat it as a fixed object the character is simply holding still.
The other wing gestures gently near the card without touching it. Only the
character's head, eyes, and mouth move, showing a serious, explanatory
expression — not smiling.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, plants, chairs, monitor, and the
card (including its "전량 매도 후 현금 이전" text) must stay completely
fixed — no camera pan or zoom, no background object movement, no card
movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("전량 매도 후 현금 이전") and the
large "퇴직연금 상담" wall sign. Render these exactly as pixels copied from
the reference image, unchanged frame to frame — do not let the video model
regenerate, redraw, reinterpret, or reflow any of this text, even slightly,
even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if seriously
explaining a past inconvenience — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep13-videos/owl_ep13_s2_background_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s3 — problem (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright retirement-pension customer
service center background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

MOTION DETAIL: the character holds the "매도·재매수 손실 → 그냥 묶임" card
(with a red downward arrow and chain-link icon) steadily in one wing at
chest height — the card does not travel or shift position. The other wing
gestures gently near the card without touching it. Only the character's
head, eyes, and mouth move, showing a concerned, slightly troubled
expression — not smiling.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, plants, chairs, monitor, and the
card (including its text and icons) must stay completely fixed — no camera
pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("매도·재매수 손실 → 그냥 묶임")
and the large wall sign. Render these exactly as pixels copied from the
reference image, unchanged frame to frame — do not let the video model
regenerate, redraw, reinterpret, or reflow any of this text, even slightly,
even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if explaining
a frustrating consequence — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep13-videos/owl_ep13_s3_problem_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s4 — new_system (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright retirement-pension customer
service center background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

MOTION DETAIL: the character holds the "실물이전 제도" card (with an arrow
icon) steadily in one wing at chest height, showing it toward the camera
with a confident, reassuring expression — not smiling but warm. The card
does not travel or shift position. The other wing gestures gently near the
card without touching it.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, plants, chairs, monitor, and the
card (including its "실물이전 제도" text and arrow icon) must stay
completely fixed — no camera pan or zoom, no background object movement, no
card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("실물이전 제도") and the large
wall sign. Render these exactly as pixels copied from the reference image,
unchanged frame to frame — do not let the video model regenerate, redraw,
reinterpret, or reflow any of this text, even slightly, even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if confidently
introducing a solution — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep13-videos/owl_ep13_s4_new_system_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s5 — scale_flow (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright retirement-pension customer
service center background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

MOTION DETAIL: the character holds the "상반기 6.9조 원 / 은행 → 증권사"
card steadily in one wing at chest height — the card does not travel or
shift position. The other wing gestures gently near the card without
touching it. The character's expression is bright and explanatory, a slight
pleased smile is acceptable here.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, plants, chairs, monitor, and the
card (including its "상반기 6.9조 원", "은행 → 증권사" text) must stay
completely fixed — no camera pan or zoom, no background object movement, no
card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text and the large wall sign. Render
these exactly as pixels copied from the reference image, unchanged frame to
frame — do not let the video model regenerate, redraw, reinterpret, or
reflow any of this text, even slightly, even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
enthusiastically sharing a surprising statistic — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep13-videos/owl_ep13_s5_scale_flow_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s6 — condition (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright retirement-pension customer
service center background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

MOTION DETAIL: the character holds the clipboard-style card showing "DB →
DB", "DC → DC", "IRP → IRP" steadily in one wing at chest height — the card
does not travel or shift position. The other wing gestures gently near the
card without touching it. The character's expression is serious and
precise, explaining a rule — not smiling.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, plants, chairs, monitor, and the
card (including its "DB → DB", "DC → DC", "IRP → IRP" text) must stay
completely fixed — no camera pan or zoom, no background object movement, no
card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("DB → DB", "DC → DC", "IRP →
IRP") and the large wall sign. Render these exactly as pixels copied from
the reference image, unchanged frame to frame — do not let the video model
regenerate, redraw, reinterpret, or reflow any of this text, even slightly,
even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if seriously
stating an important condition — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep13-videos/owl_ep13_s6_condition_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s8 — exception (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright retirement-pension customer
service center background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

MOTION DETAIL: the character holds the card with a large question mark
steadily in one wing at chest height — the card does not travel or shift
position. The other wing gestures gently near the chin/head area (not
touching the card), and the character's head tilts slightly, showing a
thoughtful, cautious expression — not smiling.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, plants, chairs, monitor, and the
card (including the question mark) must stay completely fixed — no camera
pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the large wall sign and any background signage.
Render these exactly as pixels copied from the reference image, unchanged
frame to frame — do not let the video model regenerate, redraw,
reinterpret, or reflow any of this text, even slightly, even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if cautiously
adding an important caveat — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep13-videos/owl_ep13_s8_exception_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s9 — upcoming (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright retirement-pension customer
service center background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

MOTION DETAIL: the character holds the card showing "DC형 → 타사 IRP" with
a red arrow and "확대 추진 중" highlighted in a yellow starred badge,
steadily in one wing at chest height — the card does not travel or shift
position. The other wing gestures gently near the card without touching it.
The character's expression is bright and hopeful, a slight smile is
acceptable here.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, plants, chairs, monitor, and the
card (including its "DC형", "타사 IRP", "확대 추진 중" text and the red
arrow, yellow star badge) must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("DC형", "타사 IRP", "확대 추진
중") and the large wall sign. Render these exactly as pixels copied from
the reference image, unchanged frame to frame — do not let the video model
regenerate, redraw, reinterpret, or reflow any of this text, even slightly,
even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if hopefully
announcing an upcoming improvement — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep13-videos/owl_ep13_s9_upcoming_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s10 — action (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright retirement-pension customer
service center background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

MOTION DETAIL: the character holds the smartphone steadily in one wing at
chest height, showing its screen ("실물이전 가능 여부 확인" with a green
checkmark) toward the camera — the phone does not tilt, rise, lower, or
move at all, the wing keeps it locked in the same position and angle for
the entire clip. The other wing gestures gently toward the phone in a fixed
pose (not sweeping). The character's expression is warm and friendly — a
gentle smile is appropriate here (wrap-up tone, softer than other scenes).

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY, THIS IS THE FINAL
SCENE — DO NOT LET IT GO STATIC): the character must show visible,
continuous motion for the ENTIRE 8 seconds, including the last 2-3 seconds
— natural eye blinks at least every 2-3 seconds, subtle head nods, gentle
breathing motion, continuous mouth movement while speaking. No portion of
the clip, especially the back half, should hold a single frozen pose for
more than half a second. After speech ends (if applicable), the character
keeps breathing/blinking gently rather than freezing into a static held
expression.

STATIC ELEMENTS: the background signage, plants, chairs, and the phone
(including its "실물이전 가능 여부 확인" text and checkmark icon) must stay
completely fixed — no camera pan or zoom, no background object movement, no
phone movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the phone screen text ("실물이전 가능 여부
확인"), the large wall sign, and the "상담창구" desk plate. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame — do not let the video model regenerate, redraw, reinterpret, or
reflow any of this text, even slightly, even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no phone
movement, no phone floating or blurring, NO FULL-BODY FREEZE AT ANY POINT,
no holding completely still for more than half a second anywhere in the
clip, no rigid locked pose for the second half of the clip.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
wrapping up with a helpful reminder — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep13-videos/owl_ep13_s10_action_motion.mp4`로 저장
2. 시작·중반(4초)·끝(7초) 프레임 전부 확인 — **12편 s10과 동일한 사고(후반부 정지) 여부를 특히
   꼼꼼히 확인**. 의심되면 재생성 전 제출.
3. 10개 씬 전부 완료 후 본편 조립 진행
