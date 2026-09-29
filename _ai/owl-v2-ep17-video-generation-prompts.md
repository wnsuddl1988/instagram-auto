# 부엉박사 17편(2027년 최저임금 확정, v2 재제작) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/owl-v2-ep17-images/`
영상 저장 폴더(신규 생성): `C:/tmp/owl-v2-ep17-videos/`

**이 문서는 신규 제작이 필요한 8개 씬만 다룬다.** 나머지 8개 씬(s3, s5,
s7, s9, s11, s12, s13, s15)은 부엉박사 16편(파일 ep16, 옛 구조) 원본
영상을 그대로 재사용하며 `C:/tmp/owl-v2-ep17-videos/`에 이미 배치
완료했다(재생성 불필요):
- s3 opening ← `owl_v2_ep17_s3_opening_motion.mp4`(v1 s1, 8초 클립, 발화 3.37초)
- s5 fact_amount ← `owl_v2_ep17_s5_fact_amount_motion.mp4`(v1 s3, 10초 클립, 발화 5.46초)
- s7 fact_monthly ← `owl_v2_ep17_s7_fact_monthly_motion.mp4`(v1 s4, 8초 클립, 발화 4.82초)
- s9 point1_link ← `owl_v2_ep17_s9_point1_link_motion.mp4`(v1 s6, 8초 클립, 발화 5.053초)
- s11 point1_result ← `owl_v2_ep17_s11_point1_result_motion.mp4`(v1 s7, 8초 클립, 발화 4.555초)
- s12 point2_callback ← `owl_v2_ep17_s12_point2_callback_motion.mp4`(v1 s9, 8초 클립, 발화 4.639초)
- s13 caution ← `owl_v2_ep17_s13_caution_motion.mp4`(v1 s8, 8초 클립, 발화 6.08초)
- s15 checklist ← `owl_v2_ep17_s15_checklist_motion.mp4`(v1 s10, 8초 클립, 발화 5.232초)

**씬 길이 티어는 8초/10초 2단계로만 요청한다(9초 티어 금지,
[[feedback_video_scene_length_tier_smooth_transition]]).** 신규 8씬 중
7개는 발화 8초 미만이고 여유 1초 이상이라 8초 티어, s16만 발화 8.213초로
8초를 넘어 10초 티어로 확정한다.

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 실측 발화(raw) | 요청 티어 | 예상 여유 |
|---|---|---|---|---|---|
| s1 hook_q | `owl_v2_ep17_s1_hook_q.png` | `owl_v2_ep17_s1_hook_q_motion.mp4` | 3.173초 | **8초** | 4.827초 |
| s2 hook_stakes | `owl_v2_ep17_s2_hook_stakes.png` | `owl_v2_ep17_s2_hook_stakes_motion.mp4` | 3.833초 | **8초** | 4.167초 |
| s4 definition | `owl_v2_ep17_s4_definition.png` | `owl_v2_ep17_s4_definition_motion.mp4` | 4.84초 | **8초** | 3.16초 |
| s6 fact_rate | `owl_v2_ep17_s6_fact_rate.png` | `owl_v2_ep17_s6_fact_rate_motion.mp4` | 4.75초 | **8초** | 3.25초 |
| s8 core_q_answer | `owl_v2_ep17_s8_core_q_answer.png` | `owl_v2_ep17_s8_core_q_answer_motion.mp4` | 5.14초 | **8초** | 2.86초 |
| s10 point1_formula | `owl_v2_ep17_s10_point1_formula.png` | `owl_v2_ep17_s10_point1_formula_motion.mp4` | 4.997초 | **8초** | 3.003초 |
| s14 summary | `owl_v2_ep17_s14_summary.png` | `owl_v2_ep17_s14_summary_motion.mp4` | 6.016초 | **8초** | 1.984초 |
| s16 bridge(closing) | `owl_v2_ep17_s16_bridge.png` | `owl_v2_ep17_s16_bridge_motion.mp4` | 8.213초 | **10초** | 1.787초 |

★ 영상 생성 절대규칙(87씬 전수조사 확정, `_ai/CURRENT_STANDARDS.md` §0) 전부 반영:
- 소품을 든 손은 **한 지점 고정**("holds steadily at", 이동·반복 왕복 지시 금지)
- **동작은 소품을 안 든 빈 쪽에만** 배정
- 소품·보드는 전부 "frozen photograph layered in front of/beside the character"로 명시
- 텍스트는 CRITICAL TEXT PRESERVATION(HIGHEST PRIORITY) 블록으로 고정
- 나레이션이 있는 영상이므로 "Silent" 문구는 절대 넣지 않는다
- **PROP LOCK을 마지막 프레임까지 강하게 명시한다**(16편 s1·s4 재생성 사고
  — 후반부에서 카드가 사라지고 빈손 자세로 바뀌는 결함이 발생했었다.
  "카드는 마지막 프레임까지 반드시 들려 있어야 한다", "날개가 카드에서
  벌어지거나 떨어지지 않는다", "빈손 자세 절대 금지" 문구를 전 씬에 포함)

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작 프레임뿐 아니라 클립 중반·후반 프레임에서도
텍스트·소품·동작 지속 여부, 카메라 줌/크롭, 소품 기울어짐, **특히 카드가 끝까지 들려 있는지**를 확인한다.

================================================================================
# 🟦 8초 티어 (s1, s2, s4, s6, s8, s10, s14)
================================================================================

---

## s1 — hook_q (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the minimum wage council chamber
background exactly as shown in the reference image — same round committee
table, member nameplates, large screen with silhouette icons, potted
plants, warm lighting. Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "최저임금" on the top line and "나랑 상관없다?" on the bottom
line — completely rigid, cradled in both wings at chest height for the
entire clip, from frame 1 all the way to the very last frame with NO
exception. The card must still be visibly held in the character's wings at
the exact final frame of the video, identically to how it is held at frame
1. The card never disappears, is never dropped, is never released, and the
wings never open outward away from the card at any point in the clip,
including the last 1-2 seconds. The card does not tilt, rotate, rise,
lower, or drift at any point. Treat the card as a frozen photograph layered
in front of the character, permanently glued to the character's wings for
the entire 8-second duration.

MOTION DETAIL: the character's expression is curious and intrigued, wide
eyes, beak slightly open, as if posing an intriguing question to the
viewer. Both wings stay wrapped around the card the whole time — they do
not spread open or gesture away from it.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak/mouth movement while speaking. This motion
must come ONLY from the head, eyes, and beak — the wings and the card they
hold must remain completely still and attached for the full clip. No
portion of the clip, especially the back half, should hold a single frozen
pose for more than half a second, but this also must never be achieved by
releasing, dropping, or making the card disappear.

STATIC ELEMENTS: the committee table, member nameplates, screen silhouette
icons, potted plants, and chairs must stay completely fixed — no camera pan
or zoom, no background object movement, no card movement, no card
disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("최저임금", "나랑 상관없다?") and the background nameplate/screen text as
locked, non-regenerating image layers for the full 8 seconds, including the
very last frame. Render these exactly as pixels copied from the reference
image, unchanged frame to frame, and still fully visible and held by the
character at the end of the clip.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/talons, no warped, blurred, flickering, or misspelled
text anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, NO CARD MOVEMENT, NO CARD
DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE LAST SECOND, NO
WINGS OPENING OUTWARD OR RELEASING THE CARD, NO EMPTY-HANDED POSE AT ANY
POINT, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING
DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT
ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if curiously posing a
question to the viewer — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds. The card
stays held in both wings throughout, unaffected by the beak movement.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep17-videos/owl_v2_ep17_s1_hook_q_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — **카드가 끝까지 들려 있는지 최우선 확인**, 카메라 줌/크롭 여부 포함
3. 문제 없으면 다음 씬 진행

---

## s2 — hook_stakes (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the minimum wage council chamber
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "생각보다" on the top line and "많은 사람" on the bottom line,
with small silhouette icons of several people below — completely rigid,
cradled in both wings at chest height for the entire clip, from frame 1 to
the very last frame with NO exception. The card must still be visibly held
at the exact final frame, identically to frame 1. The card never
disappears, is never dropped, is never released, and the wings never open
outward away from the card at any point, including the last 1-2 seconds.
The card does not tilt, rotate, rise, lower, or drift at any point. Treat
the card as a frozen photograph layered in front of the character,
permanently glued to the character's wings for the entire 8-second
duration.

MOTION DETAIL: the character's expression is wide-eyed and surprised,
leaning slightly forward as if revealing an unexpectedly large scale. Both
wings stay wrapped around the card the whole time.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak/mouth movement while speaking. This motion
must come ONLY from the head, eyes, and beak — the wings and the card must
remain completely still and attached for the full clip. No portion of the
clip should hold a single frozen pose for more than half a second, but
never by releasing or dropping the card.

STATIC ELEMENTS: the committee table, member nameplates, screen silhouette
icons, potted plants, and chairs must stay completely fixed — no camera pan
or zoom, no background object movement, no card movement, no card
disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("생각보다", "많은 사람") and the background nameplate/screen text as
locked, non-regenerating image layers for the full 8 seconds, including the
very last frame. Render these exactly as pixels copied from the reference
image, unchanged frame to frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/talons, no warped, blurred, flickering, or misspelled
text anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, NO CARD MOVEMENT, NO CARD
DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE LAST SECOND, NO
WINGS OPENING OUTWARD OR RELEASING THE CARD, NO EMPTY-HANDED POSE AT ANY
POINT, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING
DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT
ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if surprisingly revealing
a larger-than-expected scale — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds. The card
stays held in both wings throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep17-videos/owl_v2_ep17_s2_hook_stakes_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s4 — definition (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the minimum wage council chamber
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "최저임금 =" on the top line and "시간당 최소 급여" on the
bottom line, with small coin and rising-bar-chart icons — completely
rigid, cradled in both wings at chest height for the entire clip, from
frame 1 to the very last frame with NO exception. The card must still be
visibly held at the exact final frame, identically to frame 1. The card
never disappears, is never dropped, is never released, and the wings never
open outward away from the card at any point, including the last 1-2
seconds. The card does not tilt, rotate, rise, lower, or drift at any
point. Treat the card as a frozen photograph layered in front of the
character, permanently glued to the character's wings for the entire
8-second duration.

MOTION DETAIL: the character's expression is calm and instructive, clearly
explaining the definition of a term to the viewer. Both wings stay wrapped
around the card the whole time.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak/mouth movement while speaking. This motion
must come ONLY from the head, eyes, and beak — the wings and the card must
remain completely still and attached for the full clip. No portion of the
clip should hold a single frozen pose for more than half a second, but
never by releasing or dropping the card.

STATIC ELEMENTS: the committee table, member nameplates, screen silhouette
icons, potted plants, and chairs must stay completely fixed — no camera pan
or zoom, no background object movement, no card movement, no card
disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("최저임금 =", "시간당 최소 급여") and the background nameplate/screen text
as locked, non-regenerating image layers for the full 8 seconds, including
the very last frame. Render these exactly as pixels copied from the
reference image, unchanged frame to frame, still fully visible and held at
the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/talons, no warped, blurred, flickering, or misspelled
text anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, NO CARD MOVEMENT, NO CARD
DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE LAST SECOND, NO
WINGS OPENING OUTWARD OR RELEASING THE CARD, NO EMPTY-HANDED POSE AT ANY
POINT, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING
DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT
ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if clearly explaining a
one-line definition — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds. The card
stays held in both wings throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep17-videos/owl_v2_ep17_s4_definition_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s6 — fact_rate (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the minimum wage council chamber
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with "3.7% 인상"
in large red text with an upward arrow icon on the top line, and a small
yellow-highlighted subtitle "최근 3년 최고치" on the bottom line —
completely rigid, cradled in one wing at chest height for the entire clip,
from frame 1 to the very last frame with NO exception. The card must still
be visibly held at the exact final frame, identically to frame 1. The card
never disappears, is never dropped, is never released, and the wing never
opens outward away from the card at any point, including the last 1-2
seconds. The card does not tilt, rotate, rise, lower, or drift at any
point. Treat the card as a frozen photograph layered in front of the
character, permanently glued to the character's wing for the entire
8-second duration.

MOTION DETAIL: the character's expression is confident and assured, as if
presenting a striking statistic as proof. The other wing rests near the
character's side without gesturing away from the card.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak/mouth movement while speaking. This motion
must come ONLY from the head, eyes, and beak — the wing holding the card
must remain completely still and attached for the full clip. No portion of
the clip should hold a single frozen pose for more than half a second, but
never by releasing or dropping the card.

STATIC ELEMENTS: the committee table, member nameplates, screen silhouette
icons, potted plants, and chairs must stay completely fixed — no camera pan
or zoom, no background object movement, no card movement, no card
disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("3.7%
인상", "최근 3년 최고치") and the background nameplate/screen text as
locked, non-regenerating image layers for the full 8 seconds, including the
very last frame. Render these exactly as pixels copied from the reference
image, unchanged frame to frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/talons, no warped, blurred, flickering, or misspelled
text anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, NO CARD MOVEMENT, NO CARD
DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE LAST SECOND, NO
WING OPENING OUTWARD OR RELEASING THE CARD, NO EMPTY-HANDED POSE AT ANY
POINT, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING
DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT
ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if confidently presenting
a record statistic — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds. The card
stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep17-videos/owl_v2_ep17_s6_fact_rate_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s8 — core_q_answer (8초, 카드 감싸쥠 + 고민하는 표정) — ★재생성(1차 결과 결함: 7.5초 지점에서 카드 텍스트 "나는 상관없을까?"가 흔들리며 흐릿하게 겹쳐 보임, 카드 자체는 남아있으나 텍스트 선명도 붕괴)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the minimum wage council chamber
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "나는" on the top line and "상관없을까?" on the bottom line —
completely rigid in one wing at chest height for the entire clip, from
frame 1 to the very last frame with NO exception. The card must remain
PERFECTLY STILL AND IN SHARP FOCUS at every single frame of the clip,
including the final 1-2 seconds — it must never shake, vibrate, blur,
wobble, or double-expose at any point. The card must still be visibly held
AND CLEARLY READABLE at the exact final frame, identically sharp to frame
1. The card never disappears, is never dropped, is never released, and the
wing never opens outward away from the card at any point, including the
last 1-2 seconds. The card does not tilt, rotate, rise, lower, drift, or
shake at any point. The other wing rests thoughtfully near the character's
chin without ever touching or moving the card. Treat the card as a frozen,
perfectly sharp photograph layered in front of the character, permanently
glued to the character's wing and permanently in crisp focus for the
entire 8-second duration — as if it were a rigid physical sign, not a soft
or wobbling material.

MOTION DETAIL: the character's expression is thoughtful and inquisitive,
one eyebrow slightly raised, as if posing the core question of the episode
to the viewer. Any subtle body motion (breathing, weight shift) must not
transmit any shake, jitter, or blur to the card — the card is treated as a
completely rigid object independent of body movement.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak/mouth movement while speaking. This motion
must come ONLY from the head, eyes, and beak — the wing holding the card
and the card itself must remain completely still, sharp, and attached for
the full clip. No portion of the clip should hold a single frozen pose for
more than half a second, but never by releasing or dropping the card, and
never by letting the card blur, shake, or double-expose.

STATIC ELEMENTS: the committee table, member nameplates, screen silhouette
icons, potted plants, and chairs must stay completely fixed — no camera pan
or zoom, no background object movement, no card movement, no card
disappearance, no card blur or shake.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("나는",
"상관없을까?") and the background nameplate/screen text as locked,
non-regenerating, permanently sharp image layers for the full 8 seconds,
including the very last frame. Render these exactly as pixels copied from
the reference image, unchanged and in crisp focus frame to frame — the
text must be perfectly legible in every single frame with zero motion blur
or ghosting, still fully visible, sharp, and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/talons, no warped, blurred, flickering, shaking,
vibrating, double-exposed, ghosted, or misspelled text anywhere in the
frame at any point in the clip, no regenerated or reinterpreted signage,
no background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, NO CARD MOVEMENT, NO CARD
SHAKE OR VIBRATION AT ANY POINT INCLUDING THE LAST 1-2 SECONDS, NO CARD
TEXT BLUR OR DOUBLE-EXPOSURE AT ANY POINT, NO CARD DISAPPEARING OR BEING
DROPPED AT ANY POINT INCLUDING THE LAST SECOND, NO WING OPENING OUTWARD OR
RELEASING THE CARD, NO EMPTY-HANDED POSE AT ANY POINT, no full-body freeze
at any point, no holding completely still for more than half a second
anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT
INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT INCLUDING
THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if thoughtfully posing the
core question and then answering it — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds. The
card stays held, rigid, and perfectly sharp throughout, completely
unaffected by the mouth or head movement.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep17-videos/owl_v2_ep17_s8_core_q_answer_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s10 — point1_formula (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the minimum wage council chamber
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with a three-line
formula in large text — "최저임금 ×" on the first line, "80% ×" in red on
the second line, and "8시간" in dark navy on the third line — completely
rigid in one wing at chest height for the entire clip, from frame 1 to the
very last frame with NO exception. The card must still be visibly held at
the exact final frame, identically to frame 1. The card never disappears,
is never dropped, is never released, and the wing never opens outward away
from the card at any point, including the last 1-2 seconds. The card does
not tilt, rotate, rise, lower, or drift at any point. Treat the card as a
frozen photograph layered in front of the character, permanently glued to
the character's wing for the entire 8-second duration.

MOTION DETAIL: the character's expression is clear and instructive, as if
carefully walking the viewer through a calculation step by step.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak/mouth movement while speaking. This motion
must come ONLY from the head, eyes, and beak — the wing holding the card
must remain completely still and attached for the full clip. No portion of
the clip should hold a single frozen pose for more than half a second, but
never by releasing or dropping the card.

STATIC ELEMENTS: the committee table, member nameplates, screen silhouette
icons, potted plants, and chairs must stay completely fixed — no camera pan
or zoom, no background object movement, no card movement, no card
disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("최저임금 ×", "80% ×", "8시간") and the background nameplate/screen text
as locked, non-regenerating image layers for the full 8 seconds, including
the very last frame. Render these exactly as pixels copied from the
reference image, unchanged frame to frame, still fully visible and held at
the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/talons, no warped, blurred, flickering, or misspelled
text anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, NO CARD MOVEMENT, NO CARD
DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE LAST SECOND, NO
WING OPENING OUTWARD OR RELEASING THE CARD, NO EMPTY-HANDED POSE AT ANY
POINT, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING
DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT
ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if clearly walking through
a calculation formula — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds. The card
stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep17-videos/owl_v2_ep17_s10_point1_formula_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s14 — summary (8초, 카드 감싸쥠 + 확신에 찬 표정)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the minimum wage council chamber
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "최저임금 UP," with a red upward arrow on the top line and
"실업급여도 UP" with another red upward arrow on the bottom line —
completely rigid in one wing at chest height for the entire clip, from
frame 1 to the very last frame with NO exception. The card must still be
visibly held at the exact final frame, identically to frame 1. The card
never disappears, is never dropped, is never released, and the wing never
opens outward away from the card at any point, including the last 1-2
seconds. The card does not tilt, rotate, rise, lower, or drift at any
point. Treat the card as a frozen photograph layered in front of the
character, permanently glued to the character's wing for the entire
8-second duration.

MOTION DETAIL: the character's expression is confident and assured, as if
wrapping up the main point with certainty. The other wing may show a
steady thumbs-up gesture at a fixed angle without waving, never touching
or moving the card.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak/mouth movement while speaking. This motion
must come ONLY from the head, eyes, and beak — the wing holding the card
must remain completely still and attached for the full clip. No portion of
the clip should hold a single frozen pose for more than half a second, but
never by releasing or dropping the card.

STATIC ELEMENTS: the committee table, member nameplates, screen silhouette
icons, potted plants, and chairs must stay completely fixed — no camera pan
or zoom, no background object movement, no card movement, no card
disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("최저임금 UP,", "실업급여도 UP") and the background nameplate/screen text
as locked, non-regenerating image layers for the full 8 seconds, including
the very last frame. Render these exactly as pixels copied from the
reference image, unchanged frame to frame, still fully visible and held at
the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/talons, no warped, blurred, flickering, or misspelled
text anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, NO CARD MOVEMENT, NO CARD
DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE LAST SECOND, NO
WING OPENING OUTWARD OR RELEASING THE CARD, NO EMPTY-HANDED POSE AT ANY
POINT, no waving or repeated thumb motion, no full-body freeze at any
point, no holding completely still for more than half a second anywhere in
the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST
SECOND, NO CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if confidently summarizing
the key point — never static, never barely-moving, never closed-mouth
talking, never frozen even in the final seconds. The card stays held
throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep17-videos/owl_v2_ep17_s14_summary_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

================================================================================
# 🟨 10초 티어 (s16)
================================================================================

---

## s16 — bridge / closing (10초, 카드 감싸쥠, 금박사에게 연결)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl analyst mascot character's design and the minimum wage council chamber
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with large red
text "주휴수당은?" — completely rigid in one wing at chest height for the
entire clip, from frame 1 to the very last frame with NO exception. The
card must still be visibly held at the exact final frame, identically to
frame 1. The card never disappears, is never dropped, is never released,
and the wing never opens outward away from the card at any point,
including the last 1-2 seconds. The card does not tilt, rotate, rise,
lower, or drift at any point. Treat the card as a frozen photograph layered
in front of the character, permanently glued to the character's wing for
the entire 10-second duration.

MOTION DETAIL: the character's expression is warm and inviting, beak open
mid-speech, the other wing gently waving beside its head (a natural,
continuous small wave motion, not a static held pose) as if teasing an
upcoming topic for another character to cover. The waving wing never
touches or moves the card.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY, THIS IS THE FINAL
SCENE OF THE EPISODE — DO NOT LET IT GO STATIC): the character must show
visible, continuous motion for the ENTIRE 10 seconds, including the last
2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle head
tilts, gentle continuous waving motion, continuous beak/mouth movement
while speaking. The wing holding the card must remain completely still and
attached for the full clip even while the other wing waves. No portion of
the clip, especially the back half, should hold a single frozen pose for
more than half a second, but never by releasing or dropping the card.

STATIC ELEMENTS: the committee table, member nameplates, screen silhouette
icons, potted plants, and chairs must stay completely fixed — no camera pan
or zoom, no background object movement, no card movement, no card
disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("주휴수당은?") and the background nameplate/screen text as locked,
non-regenerating image layers for the full 10 seconds, including the very
last frame. Render these exactly as pixels copied from the reference
image, unchanged frame to frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/talons, no warped, blurred, or flickering surfaces
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, NO CARD MOVEMENT, NO CARD
DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE LAST SECOND, NO
WING OPENING OUTWARD OR RELEASING THE CARD, NO EMPTY-HANDED POSE AT ANY
POINT, NO FULL-BODY FREEZE AT ANY POINT, no holding completely still for
more than half a second anywhere in the clip, no rigid locked pose for the
second half of the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT
INCLUDING THE LAST SECOND, NO CARD TILT OR ROTATION AT ANY POINT INCLUDING
THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if warmly handing off an
unanswered term to another character — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds. The
card stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-v2-ep17-videos/owl_v2_ep17_s16_bridge_motion.mp4`로 저장
2. 시작·중반(4~5초)·끝(9~10초) 프레임 전부 확인 — 마지막 씬이므로 후반부 정지 여부, **카드가 끝까지 들려 있는지** 특히 꼼꼼히 확인
3. 8개 신규 씬 전부 완료 후, 재사용 8개 씬(s3, s5, s7, s9, s11, s12, s13,
   s15)과 합쳐 본편 조립(`run-owl-assemble-shorts-v2.mjs`, `--spec-module
   ./_owl-v2-ep17-assembly-spec.mjs --spec-export OWL_ASSEMBLY_SPEC`,
   `--clip-dir C:/tmp/owl-v2-ep17-videos`) → 고정 CTA 연결
   (`run-owl-episode-with-fixed-cta-once.mjs`, 부엉박사 고정 CTA
   `owl_cta_fixed_v2_final_v6.mp4`) 진행
