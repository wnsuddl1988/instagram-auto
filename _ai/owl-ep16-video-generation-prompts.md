# 부엉박사 16편(2027년 최저임금 확정, 실업급여 하한액 연동) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/owl-ep16-images/`
영상 저장 폴더(신규 생성): `C:/tmp/owl-ep16-videos/`

씬 길이 티어는 TTS 실측(`rawAudioDurationSec`, `output-v1/elevenlabs-scene-paced-tts-summary.json`) 기준 전 씬 8초 이내로 여유 충분(가장 빠듯한 씬도 margin 2.69초). **전부 8초로 요청** — Gemini로 생성해 10초가 나와도 문제없음(여유가 넉넉해 자르기만 하면 됨, [[feedback_gemini_veo_scene_assignment_always_10sec]] 참고. 이번 편은 특정 씬을 Gemini로 지정하지 않음 — 어느 도구를 쓰든 8초 요청 프롬프트 그대로 사용).

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 요청 길이 | 실측 발화(raw) |
|---|---|---|---|---|
| s1 opening | `owl_ep16_s1_opening.png` | `owl_ep16_s1_opening_motion.mp4` | 8초 | 5.24초 |
| s2 hook | `owl_ep16_s2_hook.png` | `owl_ep16_s2_hook_motion.mp4` | 8초 | 3.81초 |
| s3 fact | `owl_ep16_s3_fact.png` | `owl_ep16_s3_fact_motion.mp4` | 8초 | 5.31초 |
| s4 fact | `owl_ep16_s4_fact.png` | `owl_ep16_s4_fact_motion.mp4` | 8초 | 4.49초 |
| s5 twist | `owl_ep16_s5_twist.png` | `owl_ep16_s5_twist_motion.mp4` | 8초 | 2.98초 |
| s6 evidence | `owl_ep16_s6_evidence.png` | `owl_ep16_s6_evidence_motion.mp4` | 8초 | 3.65초 |
| s7 evidence | `owl_ep16_s7_evidence.png` | `owl_ep16_s7_evidence_motion.mp4` | 8초 | 5.31초 |
| s8 consequence | `owl_ep16_s8_consequence.png` | `owl_ep16_s8_consequence_motion.mp4` | 8초 | 4.92초 |
| s9 recommendation | `owl_ep16_s9_recommendation.png` | `owl_ep16_s9_recommendation_motion.mp4` | 8초 | 3.52초 |
| s10 action | `owl_ep16_s10_action.png` | `owl_ep16_s10_action_motion.mp4` | 8초 | 3.96초 |

★ 영상 생성 절대규칙(87씬 전수조사 확정, `_ai/CURRENT_STANDARDS.md` §0) 전부 반영:
- 소품을 든 손은 **한 지점 고정**("holds steadily at", 이동·반복 왕복 지시 금지)
- **동작은 소품을 안 든 빈 쪽에만** 배정
- 소품·보드는 전부 "frozen photograph layered behind/beside the character"로 명시
- 텍스트는 CRITICAL TEXT PRESERVATION(HIGHEST PRIORITY) 블록으로 고정

★ 추가 규칙: **모든 씬에 "CONTINUOUS MOTION FOR THE FULL CLIP" 블록을 넣어, 클립의 어느 구간도
(특히 후반부) 0.5초 이상 완전히 같은 프레임처럼 고정되지 않도록 명시한다.**

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작 프레임뿐 아니라 클립 중반·후반
프레임에서도 텍스트·소품·동작 지속 여부를 확인한다.

---

## s1 — opening (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design (vest, tie, sunglasses pushed up on forehead,
feather texture) and the bright minimum wage committee deliberation room
background exactly as shown in the reference image — same round committee
table, same "위원석" nameplates, same screen with 임금/고용/심의 icons. Do
not change any colors, text, or object positions.

MOTION DETAIL: the character greets the viewer with one wing raised in a
gentle waving gesture at chest height, confident and serious expression —
not smiling. The wing motion is a small, natural greeting gesture (a slight
lift and settle), not a large sweeping wave. The other wing rests calmly by
its side.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage ("위원석" nameplates, screen with
임금/고용/심의 icons), chairs, and plants must stay completely fixed — no
camera pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the
full 8 seconds — this includes the "위원석" nameplates and the "임금",
"고용", "심의" screen labels. Render these exactly as pixels copied from
the reference image, unchanged frame to frame — do not let the video model
regenerate, redraw, reinterpret, or reflow any of this text, even slightly,
even for one frame.

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
1. 생성된 영상을 `C:/tmp/owl-ep16-videos/owl_ep16_s1_opening_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s2 — hook (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright minimum wage committee
deliberation room background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

MOTION DETAIL: the character holds the "난 상관없다?" card (with a question
mark) steadily in one wing at chest height — the card does not travel or
shift position. The other wing gestures gently near the chin/head area (not
touching the card), and the character's head tilts slightly, showing a
curious, puzzled expression — not smiling.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, chairs, plants, and the card
(including its "난 상관없다?" text and question mark) must stay completely
fixed — no camera pan or zoom, no background object movement, no card
movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the
full 8 seconds — this includes the card text ("난 상관없다?") and the
background screen labels. Render these exactly as pixels copied from the
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
continuously in natural speech rhythm for the entire clip, as if curiously
posing a question to the viewer — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep16-videos/owl_ep16_s2_hook_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s3 — fact (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright minimum wage committee
deliberation room background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

MOTION DETAIL: the character holds the "최저임금 10,700원 확정" card (with
an upward arrow icon) steadily in one wing at chest height — the card does
not travel or shift position. The other wing gestures gently near the card
without touching it. The character's expression is calm and matter-of-fact
— not smiling.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, chairs, plants, and the card
(including its "최저임금 10,700원 확정" text and arrow icon) must stay
completely fixed — no camera pan or zoom, no background object movement, no
card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the
full 8 seconds — this includes the card text ("최저임금", "10,700원",
"확정") and the background screen labels. Render these exactly as pixels
copied from the reference image, unchanged frame to frame — do not let the
video model regenerate, redraw, reinterpret, or reflow any of this text,
even slightly, even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if calmly
stating a confirmed fact — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep16-videos/owl_ep16_s3_fact_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s4 — fact (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright minimum wage committee
deliberation room background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

MOTION DETAIL: the character holds the "월 223만 6천원" card (with a
calculator icon) steadily in one wing at chest height — the card does not
travel or shift position. The other wing gestures gently near the card
without touching it. The character's expression is calm and explanatory —
not smiling.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, chairs, plants, and the card
(including its "월 223만 6천원" text and calculator icon) must stay
completely fixed — no camera pan or zoom, no background object movement, no
card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the
full 8 seconds — this includes the card text ("월", "223만", "6천원") and
the background screen labels. Render these exactly as pixels copied from
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
continuously in natural speech rhythm for the entire clip, as if calmly
explaining a calculation — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep16-videos/owl_ep16_s4_fact_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s5 — twist (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright minimum wage committee
deliberation room background exactly as shown in the reference image —
same "최저임금위원회" screen, same "근로자위원"/"위원장"/"사용자위원"
nameplates. Do not change any colors, text, or object positions.

MOTION DETAIL: the character holds the "나만의 얘기가 아니다?" card (with a
question mark) steadily in one wing at chest height — the card does not
travel or shift position. The other wing gestures gently near the card
without touching it. The character's expression is surprised — not
smiling.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background screen ("최저임금위원회"), nameplates
("근로자위원", "위원장", "사용자위원"), chairs, plants, and the card
(including its "나만의 얘기가 아니다?" text) must stay completely fixed —
no camera pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the
full 8 seconds — this includes the card text, the "최저임금위원회" screen
title, and the three nameplates. Render these exactly as pixels copied from
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
continuously in natural speech rhythm for the entire clip, as if surprised
while revealing a twist — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep16-videos/owl_ep16_s5_twist_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s6 — evidence (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright minimum wage committee
deliberation room background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

MOTION DETAIL: a standing board on the floor beside the character shows a
diagram: a blue box labeled "최저임금" with a coins-and-people icon, an
arrow pointing down, and a red box labeled "실업급여 최저 금액" with a
clipboard-and-coins icon. The character stands beside the board, gesturing
toward it with one wing (a pen-like gesture, not touching the board), calm
and explanatory expression — not smiling. The board is a fixed standing
object on the floor, never held or lifted.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, chairs, plants, and the standing
board (including its "최저임금", "실업급여 최저 금액" text and icons) must
stay completely fixed — no camera pan or zoom, no background object
movement, no board movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the
full 8 seconds — this includes the board text ("최저임금", "실업급여 최저
금액") and the background screen labels. Render these exactly as pixels
copied from the reference image, unchanged frame to frame — do not let the
video model regenerate, redraw, reinterpret, or reflow any of this text,
even slightly, even for one frame.

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
presenting evidence — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep16-videos/owl_ep16_s6_evidence_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s7 — evidence (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright minimum wage committee
deliberation room background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

MOTION DETAIL: the character holds the "실업급여 최저 금액도 UP" card (with
a red upward arrow and stacked coins icon) steadily in one wing at chest
height — the card does not travel or shift position. The other wing rests
in a confident, closed pose (do not add extra gesture motion). The
character's expression is confident and assured — not smiling.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, chairs, plants, and the card
(including its "실업급여 최저 금액도", "UP" text and icons) must stay
completely fixed — no camera pan or zoom, no background object movement, no
card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the
full 8 seconds — this includes the card text and the background screen
labels. Render these exactly as pixels copied from the reference image,
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
concluding a point — never static, never barely-moving, never closed-mouth
talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep16-videos/owl_ep16_s7_evidence_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s8 — consequence (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright minimum wage committee
deliberation room background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

MOTION DETAIL: the character holds the "퇴사·실직하면 내 얘기" card (with a
person-and-briefcase icon) steadily in one wing at chest height — the card
does not travel or shift position. The other wing gestures gently near the
card without touching it. The character's expression is serious — not
smiling.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, chairs, plants, and the card
(including its "퇴사·실직하면", "내 얘기" text and icon) must stay
completely fixed — no camera pan or zoom, no background object movement, no
card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the
full 8 seconds — this includes the card text and the background screen
labels. Render these exactly as pixels copied from the reference image,
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
continuously in natural speech rhythm for the entire clip, as if seriously
pointing out a real consequence — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep16-videos/owl_ep16_s8_consequence_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s9 — recommendation (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright minimum wage committee
deliberation room background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

MOTION DETAIL: the character holds the "15편 하한액의 비밀" card (with a
lightbulb icon) steadily in one wing at chest height — the card does not
travel or shift position. The other wing gestures gently near the card
without touching it. The character's expression is bright and pleased, a
gentle smile is appropriate here (a satisfying reveal/callback tone).

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, chairs, plants, and the card
(including its "15편", "하한액의 비밀" text and lightbulb icon) must stay
completely fixed — no camera pan or zoom, no background object movement, no
card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the
full 8 seconds — this includes the card text and the background screen
labels. Render these exactly as pixels copied from the reference image,
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
continuously in natural speech rhythm for the entire clip, as if happily
connecting the dots for the viewer — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep16-videos/owl_ep16_s9_recommendation_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s10 — action (8초, 최종 씬)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright minimum wage committee
deliberation room background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

MOTION DETAIL: the character holds the "알아두면 쓸모있는 정보" card (with
a lightbulb and upward arrow icon) steadily in one wing at chest height,
showing it toward the camera with a warm, friendly smile — gentle smile is
appropriate here (wrap-up tone, softer than other scenes). The card does
not travel or shift position. The other wing gestures gently near the card
without touching it.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY, THIS IS THE FINAL
SCENE — DO NOT LET IT GO STATIC): the character must show visible,
continuous motion for the ENTIRE 8 seconds, including the last 2-3 seconds
— natural eye blinks at least every 2-3 seconds, subtle head nods, gentle
breathing motion, continuous mouth movement while speaking. No portion of
the clip, especially the back half, should hold a single frozen pose for
more than half a second. After speech ends (if applicable), the character
keeps breathing/blinking gently rather than freezing into a static held
expression.

STATIC ELEMENTS: the background signage, chairs, plants, and the card
(including its "알아두면 쓸모있는 정보" text and icons) must stay completely
fixed — no camera pan or zoom, no background object movement, no card
movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the
full 8 seconds — this includes the card text and the background screen
labels. Render these exactly as pixels copied from the reference image,
unchanged frame to frame — do not let the video model regenerate, redraw,
reinterpret, or reflow any of this text, even slightly, even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement, NO FULL-BODY FREEZE AT ANY POINT, no holding completely still for
more than half a second anywhere in the clip, no rigid locked pose for the
second half of the clip.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
wrapping up with a practical takeaway — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep16-videos/owl_ep16_s10_action_motion.mp4`로 저장
2. 시작·중반(4초)·끝(7초) 프레임 전부 확인 — 후반부 정지 여부를 특히 꼼꼼히 확인
3. 10개 씬 전부 완료 후 본편 조립 진행
