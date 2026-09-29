# 부엉박사 18편(전세사기 최소보장제, 재제작 7편 이후 첫 신규 소재) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/owl-v2-ep18-images/`
영상 저장 폴더(신규 생성): `C:/tmp/owl-v2-ep18-videos/`

**씬 길이 티어는 8초/10초 2단계로만 요청한다(9초 티어 금지,
[[feedback_video_scene_length_tier_smooth_transition]]).** 발화 8초 미만이고
여유 1초 이상이면 8초, 그 외(8초 이상이거나 여유 1초 미만)는 10초.

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 실측 발화(raw) | 요청 티어 | 예상 여유 |
|---|---|---|---|---|---|
| s1 hook_q | `owl_v2_ep18_s1_hook_q.png` | `owl_v2_ep18_s1_hook_q_motion.mp4` | 4.951초 | **8초** | 3.049초 |
| s2 hook_stakes | `owl_v2_ep18_s2_hook_stakes.png` | `owl_v2_ep18_s2_hook_stakes_motion.mp4` | 3.06초 | **8초** | 4.940초 |
| s3 opening | `owl_v2_ep18_s3_opening.png` | `owl_v2_ep18_s3_opening_motion.mp4` | 3.13초 | **8초** | 4.870초 |
| s4 definition | `owl_v2_ep18_s4_definition.png` | `owl_v2_ep18_s4_definition_motion.mp4` | 6.52초 | **8초** | 1.480초 |
| s5 fact_timing | `owl_v2_ep18_s5_fact_timing.png` | `owl_v2_ep18_s5_fact_timing_motion.mp4` | 4.41초 | **8초** | 3.590초 |
| s6 fact_criteria | `owl_v2_ep18_s6_fact_criteria.png` | `owl_v2_ep18_s6_fact_criteria_motion.mp4` | 6.76초 | **8초** | 1.240초 |
| s7 retroactive | `owl_v2_ep18_s7_retroactive.png` | `owl_v2_ep18_s7_retroactive_motion.mp4` | 6.293초 | **8초** | 1.707초 |
| s8 core_q_answer | `owl_v2_ep18_s8_core_q_answer.png` | `owl_v2_ep18_s8_core_q_answer_motion.mp4` | 8.493초 | **10초** | 1.507초 |
| s9 point1_limit | `owl_v2_ep18_s9_point1_limit.png` | `owl_v2_ep18_s9_point1_limit_motion.mp4` | 7.04초 | **10초** | 2.960초 |
| s10 point2_deadline | `owl_v2_ep18_s10_point2_deadline.png` | `owl_v2_ep18_s10_point2_deadline_motion.mp4` | 7.52초 | **10초** | 2.480초 |
| s11 caution_exclusion | `owl_v2_ep18_s11_caution_exclusion.png` | `owl_v2_ep18_s11_caution_exclusion_motion.mp4` | 5.547초 | **8초** | 2.453초 |
| s12 caution_choice | `owl_v2_ep18_s12_caution_choice.png` | `owl_v2_ep18_s12_caution_choice_motion.mp4` | 3.595초 | **8초** | 4.405초 |
| s13 summary | `owl_v2_ep18_s13_summary.png` | `owl_v2_ep18_s13_summary_motion.mp4` | 6.08초 | **8초** | 1.920초 |
| s14 checklist | `owl_v2_ep18_s14_checklist.png` | `owl_v2_ep18_s14_checklist_motion.mp4` | 5.56초 | **8초** | 2.440초 |
| s15 bridge(closing) | `owl_v2_ep18_s15_bridge.png` | `owl_v2_ep18_s15_bridge_motion.mp4` | 7.893초 | **10초** | 2.107초 |

★ 영상 생성 절대규칙(87씬 전수조사 확정, `_ai/CURRENT_STANDARDS.md` §0) 전부 반영:
- 소품을 든 손(날개)은 **한 지점 고정**("holds steadily at", 이동·반복 왕복 지시 금지)
- **동작은 소품을 안 든 빈 날개에만** 배정
- 카드 소품은 "frozen photograph layered in front of the character"로 명시
- 텍스트는 CRITICAL TEXT PRESERVATION(HIGHEST PRIORITY) 블록으로 고정
- 나레이션이 있는 영상이므로 "Silent" 문구는 절대 넣지 않는다
- **PROP LOCK을 마지막 프레임까지 강하게 명시한다** — "카드는 마지막
  프레임까지 반드시 들려 있어야 한다", "날개가 카드에서 떨어지거나
  벌어지지 않는다", "빈 날개 자세 절대 금지" 문구를 전 씬에 포함
- 소품 고정 지시는 "holds steadily at [위치] ... does not move/tilt/
  rotate/drift"로만 쓴다. "permanently glued to the character's hands"처럼
  신체 접착·변형을 연상시키는 표현은 **절대 쓰지 않는다** — Gemini에서
  이 표현 때문에 프롬프트 제출 직후 정책 위반으로 즉시 거부되는 사고가
  있었다(금박사 11편, [[feedback_gemini_prompt_wording_refusal_2026_09_28]]).
- 배경은 법률·주거 피해구제 상담 창구(둥근 상담 데스크, 계약서·보증금
  보호·주거 지원 아이콘이 그려진 안내판, 특정 기관 로고 없음) — 영상
  생성 단계에서 AI가 임의로 글자·로고를 추가하지 않도록 STATIC
  ELEMENTS에 명시.
- 부엉이는 무표정 기본에 안경(선글라스)을 이마에 걸친 캐릭터이므로,
  말할 때 입 움직임과 눈썹·눈 변화로 감정을 표현한다(웃는 표정 지양,
  s3 오프닝만 예외적으로 담담한 미소).

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작 프레임뿐 아니라
클립 중반·후반 프레임에서도 텍스트·소품·동작 지속 여부, 카메라 줌/크롭,
소품 기울어짐, **특히 카드가 끝까지 선명하게 들려 있는지**를 확인한다.

================================================================================
# 🟦 8초 티어 (s1, s2, s3, s4, s5, s6, s7, s11, s12, s13, s14)
================================================================================

---

## s1 — hook_q (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst character's design and the legal/housing-dispute consultation
desk background exactly as shown in the reference image — same round
consultation desk, same contract/deposit/housing-dispute icon signage, same
warm lighting. Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "보증금" on the top line and "한 푼도?" in red on the bottom
line — completely rigid, held in one wing at chest height for the entire
clip, from frame 1 all the way to the very last frame with NO exception.
The card must still be visibly held at the exact final frame, identically
to how it is held at frame 1. The card never disappears, is never dropped,
is never released, and the wing never opens outward away from the card at
any point, including the last 1-2 seconds. The card does not tilt, rotate,
rise, lower, or drift at any point. Treat the card as a frozen photograph
layered in front of the character, holding steadily in place for the
entire 8-second duration. The other wing rests near the character's chin
in a worried gesture.

MOTION DETAIL: the character's expression shifts subtly between worried
and surprised — eyebrows raised, wide eyes — as if posing an alarming
question to the viewer. The sunglasses stay perched on the forehead
throughout.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces or head tilts, continuous beak movement while speaking. This
motion must come ONLY from the head and body — the wing holding the card
must remain completely still and attached for the full clip. No portion of
the clip, especially the back half, should hold a single frozen pose for
more than half a second, but this also must never be achieved by
releasing, dropping, or making the card disappear.

STATIC ELEMENTS: the consultation desk, contract/deposit/housing-dispute
icon signage, plants, and chairs must stay completely fixed — no camera
pan or zoom, no background object movement, no card movement, no card
disappearance. No new text, logos, or marks appear anywhere in the
background at any point.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("보증금", "한 푼도?") and the background signage text as locked,
non-regenerating image layers for the full 8 seconds, including the very
last frame. Render these exactly as pixels copied from the reference
image, unchanged frame to frame, and still fully visible and held by the
character at the end of the clip.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO CARD
MOVEMENT, NO CARD DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE
LAST SECOND, NO WING OPENING OUTWARD OR RELEASING THE CARD, NO
EMPTY-WINGED POSE AT ANY POINT, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if worriedly posing an
alarming question — never static, never frozen even in the final seconds.
The card stays held in one wing throughout, unaffected by the beak
movement.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep18-videos/owl_v2_ep18_s1_hook_q_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — **카드가 끝까지 들려 있는지 최우선 확인**, 카메라 줌/크롭 여부 포함
3. 문제 없으면 다음 씬 진행

---

## s2 — hook_stakes (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst character's design and the legal/housing-dispute consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "국가가"
on the top line and "채워준다?" in red on the bottom line, with a small
coin icon, completely rigid, held in one wing at chest height for the
entire clip, from frame 1 to the very last frame with NO exception. The
card must still be visibly held at the exact final frame, identically to
frame 1. The card never disappears, is never dropped, is never released,
and the wing never opens outward away from the card at any point,
including the last 1-2 seconds. The card does not tilt, rotate, rise,
lower, or drift at any point. Treat the card as a frozen photograph
layered in front of the character, holding steadily in place for the
entire 8-second duration.

MOTION DETAIL: the character's expression is wide-eyed and surprised, as
if astonished by unexpected good news.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous beak movement while speaking. This motion must
come ONLY from the head and body — the wing holding the card must remain
completely still and attached for the full clip.

STATIC ELEMENTS: the consultation desk, background signage, plants, and
chairs must stay completely fixed — no camera pan or zoom, no background
object movement, no card movement, no card disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("국가가", "채워준다?") as locked, non-regenerating image layers for the
full 8 seconds, including the very last frame. Render these exactly as
pixels copied from the reference image, unchanged frame to frame, still
fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO CARD
MOVEMENT, NO CARD DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE
LAST SECOND, NO WING OPENING OUTWARD OR RELEASING THE CARD, NO
EMPTY-WINGED POSE AT ANY POINT, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if excitedly revealing
surprising news — never static, never frozen even in the final seconds.
The card stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep18-videos/owl_v2_ep18_s2_hook_stakes_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s3 — opening (8초, 소품 없음)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst character's design and the legal/housing-dispute consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

MOTION DETAIL: the character raises one wing in a small friendly wave
while the other wing rests at its side, with a calm, understated smile —
this is the one exception where the character smiles gently, unlike its
usual sharp neutral expression. No props held.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, gentle
continuous waving motion, subtle body bounces, continuous beak movement
while speaking. No portion of the clip, especially the back half, should
hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the consultation desk, background signage, plants, and
chairs must stay completely fixed — no camera pan or zoom, no background
object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the background
signage text as locked, non-regenerating image layers for the full 8
seconds. Render these exactly as pixels copied from the reference image,
unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, or flickering surfaces anywhere in
the frame, no regenerated or reinterpreted signage, no background changes,
no character redesign, no abrupt cut or freeze mid-motion, no static
expression, no frozen pose while speaking, no full-body freeze at any
point, no holding completely still for more than half a second anywhere in
the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST
SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if calmly greeting the
viewer — never static, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep18-videos/owl_v2_ep18_s3_opening_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s4 — definition (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst character's design and the legal/housing-dispute consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "전세사기
최소보장제" in large text, completely rigid, held in one wing at chest
height for the entire clip, from frame 1 to the very last frame with NO
exception. The card must still be visibly held at the exact final frame,
identically to frame 1. The card never disappears, is never dropped, is
never released, and the wing never opens outward away from the card at any
point, including the last 1-2 seconds. The card does not tilt, rotate,
rise, lower, or drift at any point. Treat the card as a frozen photograph
layered in front of the character, holding steadily in place for the
entire 8-second duration.

MOTION DETAIL: the character's expression is calm and instructive, as if
plainly explaining a term to the viewer — no smile, sharp neutral
expression.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous beak movement while speaking. This motion must
come ONLY from the head and body — the wing holding the card must remain
completely still and attached for the full clip.

STATIC ELEMENTS: the consultation desk, background signage, plants, and
chairs must stay completely fixed — no camera pan or zoom, no background
object movement, no card movement, no card disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("전세사기 최소보장제") as a locked, non-regenerating image layer for the
full 8 seconds, including the very last frame. Render it exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO CARD
MOVEMENT, NO CARD DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE
LAST SECOND, NO WING OPENING OUTWARD OR RELEASING THE CARD, NO
EMPTY-WINGED POSE AT ANY POINT, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if plainly explaining a
term — never static, never frozen even in the final seconds. The card
stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep18-videos/owl_v2_ep18_s4_definition_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s5 — fact_timing (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst character's design and the legal/housing-dispute consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "11월
13일 시행" in large text with a small calendar icon, completely rigid,
held in one wing at chest height for the entire clip, from frame 1 to the
very last frame with NO exception. The card must still be visibly held at
the exact final frame, identically to frame 1. The card never disappears,
is never dropped, is never released, and the wing never opens outward away
from the card at any point, including the last 1-2 seconds. The card does
not tilt, rotate, rise, lower, or drift at any point. Treat the card as a
frozen photograph layered in front of the character, holding steadily in
place for the entire 8-second duration.

MOTION DETAIL: the character's expression is confident and assured, as if
stating a confirmed fact.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous beak movement while speaking. This motion must
come ONLY from the head and body — the wing holding the card must remain
completely still and attached for the full clip.

STATIC ELEMENTS: the consultation desk, background signage, plants, and
chairs must stay completely fixed — no camera pan or zoom, no background
object movement, no card movement, no card disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("11월
13일 시행") and the calendar icon as locked, non-regenerating image layers
for the full 8 seconds, including the very last frame. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO CARD
MOVEMENT, NO CARD DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE
LAST SECOND, NO WING OPENING OUTWARD OR RELEASING THE CARD, NO
EMPTY-WINGED POSE AT ANY POINT, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if confidently stating a
fact — never static, never frozen even in the final seconds. The card
stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep18-videos/owl_v2_ep18_s5_fact_timing_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s6 — fact_criteria (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst character's design and the legal/housing-dispute consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "보증금
× 1/3" in large text with a small money-transfer arrow icon below,
completely rigid, held in one wing at chest height for the entire clip,
from frame 1 to the very last frame with NO exception. The card must still
be visibly held at the exact final frame, identically to frame 1. The card
never disappears, is never dropped, is never released, and the wing never
opens outward away from the card at any point, including the last 1-2
seconds. The card does not tilt, rotate, rise, lower, or drift at any
point. Treat the card as a frozen photograph layered in front of the
character, holding steadily in place for the entire 8-second duration.

MOTION DETAIL: the character's expression is serious and instructive, as
if carefully walking through a formula.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous beak movement while speaking. This motion must
come ONLY from the head and body — the wing holding the card must remain
completely still and attached for the full clip.

STATIC ELEMENTS: the consultation desk, background signage, plants, and
chairs must stay completely fixed — no camera pan or zoom, no background
object movement, no card movement, no card disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("보증금 × 1/3") and the arrow icon as locked, non-regenerating image
layers for the full 8 seconds, including the very last frame. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO CARD
MOVEMENT, NO CARD DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE
LAST SECOND, NO WING OPENING OUTWARD OR RELEASING THE CARD, NO
EMPTY-WINGED POSE AT ANY POINT, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if seriously explaining a
formula — never static, never frozen even in the final seconds. The card
stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep18-videos/owl_v2_ep18_s6_fact_criteria_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s7 — retroactive (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst character's design and the legal/housing-dispute consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "이미
끝났어도 OK" in large text with a small circular "undo" arrow icon and a
document icon below, completely rigid, held in one wing at chest height
for the entire clip, from frame 1 to the very last frame with NO
exception. The card must still be visibly held at the exact final frame,
identically to frame 1. The card never disappears, is never dropped, is
never released, and the wing never opens outward away from the card at any
point, including the last 1-2 seconds. The card does not tilt, rotate,
rise, lower, or drift at any point. Treat the card as a frozen photograph
layered in front of the character, holding steadily in place for the
entire 8-second duration.

MOTION DETAIL: the character's expression is calm and reassuring, as if
putting the viewer's mind at ease.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous beak movement while speaking. This motion must
come ONLY from the head and body — the wing holding the card must remain
completely still and attached for the full clip.

STATIC ELEMENTS: the consultation desk, background signage, plants, and
chairs must stay completely fixed — no camera pan or zoom, no background
object movement, no card movement, no card disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("이미
끝났어도 OK") and the icons as locked, non-regenerating image layers for
the full 8 seconds, including the very last frame. Render these exactly as
pixels copied from the reference image, unchanged frame to frame, still
fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO CARD
MOVEMENT, NO CARD DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE
LAST SECOND, NO WING OPENING OUTWARD OR RELEASING THE CARD, NO
EMPTY-WINGED POSE AT ANY POINT, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if calmly reassuring the
viewer — never static, never frozen even in the final seconds. The card
stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep18-videos/owl_v2_ep18_s7_retroactive_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s11 — caution_exclusion (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst character's design and the legal/housing-dispute consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "직접
매수·배당요구 없음" in large text with a red prohibition circle-slash icon
over a money-in-hand symbol, completely rigid, held in one wing at chest
height for the entire clip, from frame 1 to the very last frame with NO
exception. The card must still be visibly held at the exact final frame,
identically to frame 1. The card never disappears, is never dropped, is
never released, and the wing never opens outward away from the card at any
point, including the last 1-2 seconds. The card does not tilt, rotate,
rise, lower, or drift at any point. Treat the card as a frozen photograph
layered in front of the character, holding steadily in place for the
entire 8-second duration.

MOTION DETAIL: the character's expression is firm and serious, as if
clearly stating an important restriction, without exaggerated alarm.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous beak movement while speaking. This motion must
come ONLY from the head and body — the wing holding the card must remain
completely still and attached for the full clip.

STATIC ELEMENTS: the consultation desk, background signage, plants, and
chairs must stay completely fixed — no camera pan or zoom, no background
object movement, no card movement, no card disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("직접
매수·배당요구 없음") and the prohibition icon as locked, non-regenerating
image layers for the full 8 seconds, including the very last frame. Render
these exactly as pixels copied from the reference image, unchanged frame
to frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO CARD
MOVEMENT, NO CARD DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE
LAST SECOND, NO WING OPENING OUTWARD OR RELEASING THE CARD, NO
EMPTY-WINGED POSE AT ANY POINT, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if firmly stating a
restriction — never static, never frozen even in the final seconds. The
card stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep18-videos/owl_v2_ep18_s11_caution_exclusion_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s12 — caution_choice (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst character's design and the legal/housing-dispute consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "현금"
above "or" and "공공임대" below, with a small balance-scale icon
comparing coins and a house, completely rigid, held in one wing at chest
height for the entire clip, from frame 1 to the very last frame with NO
exception. The card must still be visibly held at the exact final frame,
identically to frame 1. The card never disappears, is never dropped, is
never released, and the wing never opens outward away from the card at any
point, including the last 1-2 seconds. The card does not tilt, rotate,
rise, lower, or drift at any point. Treat the card as a frozen photograph
layered in front of the character, holding steadily in place for the
entire 8-second duration.

MOTION DETAIL: the character's expression is thoughtful and careful, as if
weighing two options for the viewer.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous beak movement while speaking. This motion must
come ONLY from the head and body — the wing holding the card must remain
completely still and attached for the full clip.

STATIC ELEMENTS: the consultation desk, background signage, plants, and
chairs must stay completely fixed — no camera pan or zoom, no background
object movement, no card movement, no card disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("현금", "or", "공공임대") and the balance-scale icon as locked,
non-regenerating image layers for the full 8 seconds, including the very
last frame. Render these exactly as pixels copied from the reference
image, unchanged frame to frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO CARD
MOVEMENT, NO CARD DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE
LAST SECOND, NO WING OPENING OUTWARD OR RELEASING THE CARD, NO
EMPTY-WINGED POSE AT ANY POINT, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if thoughtfully weighing
two choices — never static, never frozen even in the final seconds. The
card stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep18-videos/owl_v2_ep18_s12_caution_choice_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s13 — summary (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst character's design and the legal/housing-dispute consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "최소" on the top line and "3분의 1은" in yellow followed by
"국가 보장" in red on the lines below, with a small shield-and-bank icon,
completely rigid, held in one wing at chest height for the entire clip,
from frame 1 to the very last frame with NO exception. The card must still
be visibly held at the exact final frame, identically to frame 1. The card
never disappears, is never dropped, is never released, and the wing never
opens outward away from the card at any point, including the last 1-2
seconds. The card does not tilt, rotate, rise, lower, or drift at any
point. Treat the card as a frozen photograph layered in front of the
character, holding steadily in place for the entire 8-second duration.

MOTION DETAIL: the character's expression is confident and assured, as if
proudly summarizing the key takeaway. One wing may give a small thumbs-up
gesture while the other holds the card steady.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous beak movement while speaking. This motion must
come ONLY from the head, body, and the free wing — the wing holding the
card must remain completely still and attached for the full clip.

STATIC ELEMENTS: the consultation desk, background signage, plants, and
chairs must stay completely fixed — no camera pan or zoom, no background
object movement, no card movement, no card disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("최소",
"3분의 1은", "국가 보장") and the shield-and-bank icon as locked,
non-regenerating image layers for the full 8 seconds, including the very
last frame. Render these exactly as pixels copied from the reference
image, unchanged frame to frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO CARD
MOVEMENT, NO CARD DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE
LAST SECOND, NO WING OPENING OUTWARD OR RELEASING THE CARD, NO
EMPTY-WINGED POSE AT ANY POINT, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if confidently summarizing
the takeaway — never static, never frozen even in the final seconds. The
card stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep18-videos/owl_v2_ep18_s13_summary_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s14 — checklist (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst character's design and the legal/housing-dispute consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "체크" in
a red header bar, followed by "① 피해자 인정 여부" and "② 신청 기한" as
two numbered items with small checkmark and calendar icons, completely
rigid, held in one wing at chest height for the entire clip, from frame 1
to the very last frame with NO exception. The card must still be visibly
held at the exact final frame, identically to frame 1. The card never
disappears, is never dropped, is never released, and the wing never opens
outward away from the card at any point, including the last 1-2 seconds.
The card does not tilt, rotate, rise, lower, or drift at any point. Treat
the card as a frozen photograph layered in front of the character, holding
steadily in place for the entire 8-second duration. The other wing holds
up two claws/fingers in a "two things" gesture near the character's head.

MOTION DETAIL: the character's expression is bright and helpful (within
its usual sharp neutral range), as if clearly listing two things to check.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous beak movement while speaking. This motion must
come ONLY from the head, body, and the free wing — the wing holding the
card must remain completely still and attached for the full clip.

STATIC ELEMENTS: the consultation desk, background signage, plants, and
chairs must stay completely fixed — no camera pan or zoom, no background
object movement, no card movement, no card disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("체크",
"① 피해자 인정 여부", "② 신청 기한") and the icons as locked,
non-regenerating image layers for the full 8 seconds, including the very
last frame. Render these exactly as pixels copied from the reference
image, unchanged frame to frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO CARD
MOVEMENT, NO CARD DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE
LAST SECOND, NO WING OPENING OUTWARD OR RELEASING THE CARD, NO
EMPTY-WINGED POSE AT ANY POINT, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if brightly listing two
things to check — never static, never frozen even in the final seconds.
The card stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep18-videos/owl_v2_ep18_s14_checklist_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 8초 티어 씬 전부 완료 후 10초 티어 씬으로 진행

================================================================================
# 🟨 10초 티어 (s8, s9, s10, s15)
================================================================================

---

## s8 — core_q_answer (10초, 카드 감싸쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl analyst character's design and the legal/housing-dispute consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "아무나?" in red on the top line and "피해자 인정자만" in
navy on the bottom line, completely rigid, held in one wing at chest
height for the entire clip, from frame 1 to the very last frame with NO
exception. The card must still be visibly held at the exact final frame,
identically to frame 1. The card never disappears, is never dropped, is
never released, and the wing never opens outward away from the card at any
point, including the last 1-2 seconds. The card does not tilt, rotate,
rise, lower, or drift at any point. Treat the card as a frozen photograph
layered in front of the character, holding steadily in place for the
entire 10-second duration.

MOTION DETAIL: the character's expression transitions from a questioning,
head-tilted look in the first half to a confident, assured expression in
the second half, as if posing its own question and then confidently
answering it. The free wing points toward the card while explaining.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous beak movement while speaking. This motion must
come ONLY from the head, body, and the free wing — the wing holding the
card must remain completely still and attached for the full clip.

STATIC ELEMENTS: the consultation desk, background signage, plants, and
chairs must stay completely fixed — no camera pan or zoom, no background
object movement, no card movement, no card disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("아무나?", "피해자 인정자만") as locked, non-regenerating image layers
for the full 10 seconds, including the very last frame. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO CARD
MOVEMENT, NO CARD DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE
LAST SECOND, NO WING OPENING OUTWARD OR RELEASING THE CARD, NO
EMPTY-WINGED POSE AT ANY POINT, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, transitioning from a
questioning tone to a confident answer — never static, never frozen even
in the final seconds. The card stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep18-videos/owl_v2_ep18_s8_core_q_answer_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s9 — point1_limit (10초, 카드 감싸쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl analyst character's design and the legal/housing-dispute consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "3억 원 → 5억 원" on the top line and "재량 최대 7억" in red
on the bottom line, completely rigid, held in one wing at chest height for
the entire clip, from frame 1 to the very last frame with NO exception.
The card must still be visibly held at the exact final frame, identically
to frame 1. The card never disappears, is never dropped, is never
released, and the wing never opens outward away from the card at any
point, including the last 1-2 seconds. The card does not tilt, rotate,
rise, lower, or drift at any point. Treat the card as a frozen photograph
layered in front of the character, holding steadily in place for the
entire 10-second duration.

MOTION DETAIL: the character's expression is confident and assured, as if
proudly presenting an increased limit.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous beak movement while speaking. This motion must
come ONLY from the head and body — the wing holding the card must remain
completely still and attached for the full clip.

STATIC ELEMENTS: the consultation desk, background signage, plants, and
chairs must stay completely fixed — no camera pan or zoom, no background
object movement, no card movement, no card disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("3억
원 → 5억 원", "재량 최대 7억") as locked, non-regenerating image layers
for the full 10 seconds, including the very last frame. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO CARD
MOVEMENT, NO CARD DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE
LAST SECOND, NO WING OPENING OUTWARD OR RELEASING THE CARD, NO
EMPTY-WINGED POSE AT ANY POINT, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if confidently presenting
an increased limit — never static, never frozen even in the final seconds.
The card stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep18-videos/owl_v2_ep18_s9_point1_limit_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s10 — point2_deadline (10초, 카드 감싸쥠)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl analyst character's design and the legal/housing-dispute consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "2027.5.31까지" on the top line and "결정일+3년" in red on
the bottom line, completely rigid, held in one wing at chest height for
the entire clip, from frame 1 to the very last frame with NO exception.
The card must still be visibly held at the exact final frame, identically
to frame 1. The card never disappears, is never dropped, is never
released, and the wing never opens outward away from the card at any
point, including the last 1-2 seconds. The card does not tilt, rotate,
rise, lower, or drift at any point. Treat the card as a frozen photograph
layered in front of the character, holding steadily in place for the
entire 10-second duration.

MOTION DETAIL: the character's expression is serious and instructive, as
if carefully walking through two separate deadlines.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous beak movement while speaking. This motion must
come ONLY from the head and body — the wing holding the card must remain
completely still and attached for the full clip.

STATIC ELEMENTS: the consultation desk, background signage, plants, and
chairs must stay completely fixed — no camera pan or zoom, no background
object movement, no card movement, no card disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("2027.5.31까지", "결정일+3년") as locked, non-regenerating image layers
for the full 10 seconds, including the very last frame. Render these
exactly as pixels copied from the reference image, unchanged frame to
frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO CARD
MOVEMENT, NO CARD DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE
LAST SECOND, NO WING OPENING OUTWARD OR RELEASING THE CARD, NO
EMPTY-WINGED POSE AT ANY POINT, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if seriously explaining
two deadlines — never static, never frozen even in the final seconds. The
card stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep18-videos/owl_v2_ep18_s10_point2_deadline_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s15 — bridge (10초, 카드 감싸쥠, 마지막 씬)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl analyst character's design and the legal/housing-dispute consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "경·공매는?"
in large text with a small house-and-gavel icon below, completely rigid,
held in one wing at chest height for the entire clip, from frame 1 to the
very last frame with NO exception. The card must still be visibly held at
the exact final frame, identically to frame 1. The card never disappears,
is never dropped, is never released, and the wing never opens outward away
from the card at any point, including the last 1-2 seconds. The card does
not tilt, rotate, rise, lower, or drift at any point. Treat the card as a
frozen photograph layered in front of the character, holding steadily in
place for the entire 10-second duration.

MOTION DETAIL: the character's expression is bright and friendly (within
its usual sharp neutral range), as if warmly wrapping up and handing off
to a colleague.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY, THIS IS THE FINAL
SCENE OF THE EPISODE — DO NOT LET IT GO STATIC): the character must show
visible, continuous motion for the ENTIRE 10 seconds, including the last
2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle body
bounces, continuous beak movement while speaking. This motion must come
ONLY from the head and body — the wing holding the card must remain
completely still and attached for the full clip.

STATIC ELEMENTS: the consultation desk, background signage, plants, and
chairs must stay completely fixed — no camera pan or zoom, no background
object movement, no card movement, no card disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("경·공매는?") and the icon as locked, non-regenerating image layers for
the full 10 seconds, including the very last frame. Render these exactly
as pixels copied from the reference image, unchanged frame to frame, still
fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO CARD
MOVEMENT, NO CARD DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE
LAST SECOND, NO WING OPENING OUTWARD OR RELEASING THE CARD, NO
EMPTY-WINGED POSE AT ANY POINT, NO FULL-BODY FREEZE AT ANY POINT, no rigid
locked pose for the second half of the clip, no holding completely still
for more than half a second anywhere in the clip, NO CAMERA ZOOM OR
FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD TILT OR
ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if warmly handing off to
the next segment — never static, never frozen even in the final seconds.
The card stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep18-videos/owl_v2_ep18_s15_bridge_motion.mp4`로 저장
2. 시작·중반(4~5초)·끝(9~10초) 프레임 전부 확인 — 마지막 씬이므로 후반부 정지 여부, **카드가 끝까지 들려 있는지** 특히 꼼꼼히 확인
3. 15개 씬 전부 완료 후 본편 조립(`run-owl-assemble-shorts-v2.mjs`,
   `--spec-module ./_owl-v2-ep18-assembly-spec.mjs --spec-export
   OWL_ASSEMBLY_SPEC`, `--clip-dir C:/tmp/owl-v2-ep18-videos`,
   `--audio-summary C:/tmp/money-shorts-os/owl-v2-ep18-tts/output-v5/elevenlabs-scene-paced-tts-summary.json`,
   `--tts-script C:/tmp/money-shorts-os/owl-v2-ep18-tts/owl-v2-ep18-tts-script.json`) →
   고정 CTA 연결(`run-owl-episode-with-fixed-cta-once.mjs --alignment
   C:/tmp/money-shorts-os/owl-v2-ep18-tts/output-v5/elevenlabs-korean-director-*.alignment.json`,
   부엉박사 고정 CTA `C:\tmp\owl-cta-fixed-v2\owl_cta_fixed_v2_final_v6.mp4`)
   진행
