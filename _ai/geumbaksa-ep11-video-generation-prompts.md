# 금박사 11편(신규 제작 — 주휴수당, 오프닝 훅 뒤 재배치 첫 편) 영상 생성 프롬프트 — 수동 진행용

★ 2026-09-27 **11씬 → 8씬으로 재확정**(경위는
`scripts/_geumbaksa-ep11-assembly-spec.mjs` 상단 주석 참고). 처음에 문장
하나하나를 전부 별도 씬으로 나눠 11씬(1.45초짜리 극단적으로 짧은 씬 포함)
까지 늘어났던 것을 Owner가 지적("씬을 늘리려면 정보도 많아야지, 왜
필요없이 씬을 계속 늘리냐"). 합칠 수 있는 문장은 전부 합쳐 6씬으로
재구성한 뒤 TTS 실측 결과 9.5초를 초과한 두 곳(조건 통합, 체감+장기
시뮬레이션 통합)만 원래 문장 경계로 다시 나눠 최종 8씬으로 확정했다.

이미지 소스 폴더: `C:/tmp/geumbaksa-ep11-images-final/`
영상 저장 폴더(신규 생성): `C:/tmp/geumbaksa-ep11-videos/`

금박사는 영상 재사용 관례가 없는 신규 편이라 **8씬 전부 신규 제작**이다.

**씬 길이 티어는 8초/10초 2단계로만 요청한다(9초 티어 금지,
[[feedback_video_scene_length_tier_smooth_transition]]).** 발화 8초 미만이고
여유 1초 이상이면 8초, 그 외(8초 이상이거나 여유 1초 미만)는 10초.

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 실측 발화(raw) | 요청 티어 | 예상 여유 |
|---|---|---|---|---|---|
| s1 hook(통합) | `geumbaksa_ep11_s1_hook.png` | `geumbaksa_ep11_s1_hook_motion.mp4` | 5.22초 | **8초** | 2.78초 |
| s2 opening | `geumbaksa_ep11_s2_opening.png` | `geumbaksa_ep11_s2_opening_motion.mp4` | 3.056초 | **8초** | 4.944초 |
| s3 target | `geumbaksa_ep11_s3_target.png` | `geumbaksa_ep11_s3_target_motion.mp4` | 4.9초 | **8초** | 3.1초 |
| s4 target_detail | `geumbaksa_ep11_s4_target_detail.png` | `geumbaksa_ep11_s4_target_detail_motion.mp4` | 4.85초 | **8초** | 3.15초 |
| s5 method(통합) | `geumbaksa_ep11_s5_method.png` | `geumbaksa_ep11_s5_method_motion.mp4` | 7.77초 | **10초** | 2.23초 |
| s6 feel_conversion | `geumbaksa_ep11_s6_feel_conversion.png` | `geumbaksa_ep11_s6_feel_conversion_motion.mp4` | 4.173초 | **8초** | 3.827초 |
| s7 longterm_simulation | `geumbaksa_ep11_s7_longterm_simulation.png` | `geumbaksa_ep11_s7_longterm_simulation_motion.mp4` | 5.376초 | **8초** | 2.624초 |
| s8 closing(통합) | `geumbaksa_ep11_s8_closing.png` | `geumbaksa_ep11_s8_closing_motion.mp4` | 8.18초 | **10초** | 1.82초 |

★ 영상 생성 절대규칙(87씬 전수조사 확정, `_ai/CURRENT_STANDARDS.md` §0) 전부 반영:
- 소품을 든 손은 **한 지점 고정**("holds steadily at", 이동·반복 왕복 지시 금지)
- **동작은 소품을 안 든 빈 손에만** 배정(금박사는 팔 2개, 카드는 한쪽 손으로만 든다)
- 카드 소품은 "frozen photograph layered in front of the character"로 명시
- 텍스트는 CRITICAL TEXT PRESERVATION(HIGHEST PRIORITY) 블록으로 고정
- 나레이션이 있는 영상이므로 "Silent" 문구는 절대 넣지 않는다
- **PROP LOCK을 마지막 프레임까지 강하게 명시한다**(부엉박사 16편 s1·s4
  재생성 사고 — 후반부에서 카드가 사라지고 빈손 자세로 바뀌는 결함이
  발생했었다. "카드는 마지막 프레임까지 반드시 들려 있어야 한다", "손이
  카드에서 떨어지거나 벌어지지 않는다", "빈손 자세 절대 금지" 문구를 전
  씬에 포함)
- 금박사는 입이 아니라 몸 전체(둥근 동전)로 표정을 짓는 캐릭터이므로
  MOUTH MOVEMENT 대신 표정(눈·입 애니메이션)과 볼 붉어짐 유지, 몸 전체가
  경직되지 않도록 지시한다.

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작 프레임뿐 아니라 클립 중반·후반 프레임에서도
텍스트·소품·동작 지속 여부, 카메라 줌/크롭, 소품 기울어짐, **특히 카드가 끝까지 들려 있는지**를 확인한다.

================================================================================
# 🟦 8초 티어 (s1, s2, s3, s4, s6, s7)
================================================================================

---

## s1 — hook (8초, 카드 감싸쥠, 질문→답 통합)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the HR/labor-contract consultation
desk background exactly as shown in the reference image — same payslip and
labor-contract poster signage, same desk, plants, warm lighting. Do not
change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "안 나가도?" on the top line and "주휴수당" in red on the
bottom line — completely rigid, held in both white-gloved hands at chest
height for the entire clip, from frame 1 all the way to the very last frame
with NO exception. The card must still be visibly held at the exact final
frame, identically to how it is held at frame 1. The card never
disappears, is never dropped, is never released, and the hands never open
outward away from the card at any point in the clip, including the last
1-2 seconds. The card does not tilt, rotate, rise, lower, or drift at any
point. Treat the card as a frozen photograph layered in front of the
character, permanently glued to the character's hands for the entire
8-second duration.

MOTION DETAIL: the character's expression shifts from curious and puzzled
(wide eyes, slightly tilted head) in the first half to a confident, bright
smile in the second half, as if first posing a question and then
confidently answering it. Both hands stay wrapped around the card the
whole time.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces or tilts, cheeks staying rosy, continuous mouth movement while
speaking. This motion must come ONLY from the face and body tilt — the
hands holding the card must remain completely still and attached for the
full clip. No portion of the clip, especially the back half, should hold a
single frozen pose for more than half a second, but this also must never
be achieved by releasing, dropping, or making the card disappear.

STATIC ELEMENTS: the payslip poster, labor-contract poster, desk, plants,
calculator, and clipboard must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement, no card
disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("안
나가도?", "주휴수당") and the background poster text ("급여명세서",
"근로계약서") as locked, non-regenerating image layers for the full 8
seconds, including the very last frame. Render these exactly as pixels
copied from the reference image, unchanged frame to frame, and still fully
visible and held by the character at the end of the clip.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO CARD
MOVEMENT, NO CARD DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE
LAST SECOND, NO HANDS OPENING OUTWARD OR RELEASING THE CARD, NO
EMPTY-HANDED POSE AT ANY POINT, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, transitioning
from a curious tone to a confident, cheerful tone — never static, never
frozen even in the final seconds. The card stays held in both hands
throughout, unaffected by the mouth movement.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep11-videos/geumbaksa_ep11_s1_hook_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — **카드가 끝까지 들려 있는지 최우선 확인**, 카메라 줌/크롭 여부 포함
3. 문제 없으면 다음 씬 진행

---

## s2 — opening (8초, 소품 없음, 인사)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the HR/labor-contract consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

MOTION DETAIL: the character raises one hand in a friendly wave (a
natural, continuous small wave motion, not a static held pose) while the
other arm rests at its side, greeting the viewer with a big warm smile. No
props held.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, gentle
continuous waving motion, subtle body bounces, continuous mouth movement
while speaking. No portion of the clip, especially the back half, should
hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the payslip poster, labor-contract poster, desk, plants,
calculator, and clipboard must stay completely fixed — no camera pan or
zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the background poster
text ("급여명세서", "근로계약서") as locked, non-regenerating image layers
for the full 8 seconds. Render these exactly as pixels copied from the
reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, or flickering surfaces anywhere in
the frame, no regenerated or reinterpreted signage, no background changes,
no character redesign, no abrupt cut or freeze mid-motion, no static
expression, no frozen pose while speaking, no full-body freeze at any
point, no holding completely still for more than half a second anywhere
in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE
LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
greeting the viewer — never static, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep11-videos/geumbaksa_ep11_s2_opening_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s3 — target (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the HR/labor-contract consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "주 15시간 이상" on the top line and "+ 개근" in red on the
bottom line — completely rigid, held in both white-gloved hands at chest
height for the entire clip, from frame 1 to the very last frame with NO
exception. The card must still be visibly held at the exact final frame,
identically to frame 1. The card never disappears, is never dropped, is
never released, and the hands never open outward away from the card at any
point, including the last 1-2 seconds. The card does not tilt, rotate,
rise, lower, or drift at any point. Treat the card as a frozen photograph
layered in front of the character, permanently glued to the character's
hands for the entire 8-second duration.

MOTION DETAIL: the character's expression is calm and instructive, as if
clearly explaining a qualifying condition to the viewer.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion must
come ONLY from the face and body — the hands holding the card must remain
completely still and attached for the full clip. No portion of the clip
should hold a single frozen pose for more than half a second, but never by
releasing or dropping the card.

STATIC ELEMENTS: the payslip poster, labor-contract poster, desk, plants,
calculator, and clipboard must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement, no card
disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("주
15시간 이상", "+ 개근") and the background poster text as locked,
non-regenerating image layers for the full 8 seconds, including the very
last frame. Render these exactly as pixels copied from the reference
image, unchanged frame to frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO CARD
MOVEMENT, NO CARD DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE
LAST SECOND, NO HANDS OPENING OUTWARD OR RELEASING THE CARD, NO
EMPTY-HANDED POSE AT ANY POINT, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if calmly
explaining a condition — never static, never frozen even in the final
seconds. The card stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep11-videos/geumbaksa_ep11_s3_target_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s4 — target_detail (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the HR/labor-contract consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "알바 ="
on the left and "정규직" on the right with an equals-sign icon between
them, completely rigid, held in both white-gloved hands at chest height
for the entire clip, from frame 1 to the very last frame with NO
exception. The card must still be visibly held at the exact final frame,
identically to frame 1. The card never disappears, is never dropped, is
never released, and the hands never open outward away from the card at any
point, including the last 1-2 seconds. The card does not tilt, rotate,
rise, lower, or drift at any point. Treat the card as a frozen photograph
layered in front of the character, permanently glued to the character's
hands for the entire 8-second duration.

MOTION DETAIL: the character's expression is bright and cheerful, as if
happily reassuring the viewer that the rule applies broadly.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion must
come ONLY from the face and body — the hands holding the card must remain
completely still and attached for the full clip. No portion of the clip
should hold a single frozen pose for more than half a second, but never by
releasing or dropping the card.

STATIC ELEMENTS: the payslip poster, labor-contract poster, desk, plants,
calculator, and clipboard must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement, no card
disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("알바
=", "정규직") and the background poster text as locked, non-regenerating
image layers for the full 8 seconds, including the very last frame. Render
these exactly as pixels copied from the reference image, unchanged frame
to frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO CARD
MOVEMENT, NO CARD DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE
LAST SECOND, NO HANDS OPENING OUTWARD OR RELEASING THE CARD, NO
EMPTY-HANDED POSE AT ANY POINT, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if brightly
clarifying the rule applies to everyone — never static, never frozen even
in the final seconds. The card stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep11-videos/geumbaksa_ep11_s4_target_detail_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s6 — feel_conversion (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the HR/labor-contract consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "한 달
약" on the top line and "37만원" in large red text with a small coin icon
on the bottom line, completely rigid, held in both white-gloved hands at
chest height for the entire clip, from frame 1 to the very last frame with
NO exception. The card must still be visibly held at the exact final
frame, identically to frame 1. The card never disappears, is never
dropped, is never released, and the hands never open outward away from the
card at any point, including the last 1-2 seconds. The card does not tilt,
rotate, rise, lower, or drift at any point. Treat the card as a frozen
photograph layered in front of the character, permanently glued to the
character's hands for the entire 8-second duration.

MOTION DETAIL: the character's expression is warm and pleased, as if
sharing good news about extra money.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion must
come ONLY from the face and body — the hands holding the card must remain
completely still and attached for the full clip. No portion of the clip
should hold a single frozen pose for more than half a second, but never by
releasing or dropping the card.

STATIC ELEMENTS: the payslip poster, labor-contract poster, desk, plants,
calculator, and clipboard must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement, no card
disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("한 달
약", "37만원") and the background poster text as locked, non-regenerating
image layers for the full 8 seconds, including the very last frame. Render
these exactly as pixels copied from the reference image, unchanged frame
to frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO CARD
MOVEMENT, NO CARD DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE
LAST SECOND, NO HANDS OPENING OUTWARD OR RELEASING THE CARD, NO
EMPTY-HANDED POSE AT ANY POINT, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
sharing good news — never static, never frozen even in the final seconds.
The card stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep11-videos/geumbaksa_ep11_s6_feel_conversion_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s7 — longterm_simulation (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the HR/labor-contract consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "1년 약"
on the top line and "445만원" in large red text with a small rising-graph
icon on the bottom line, completely rigid, held in both white-gloved hands
at chest height for the entire clip, from frame 1 to the very last frame
with NO exception. The card must still be visibly held at the exact final
frame, identically to frame 1. The card never disappears, is never
dropped, is never released, and the hands never open outward away from the
card at any point, including the last 1-2 seconds. The card does not tilt,
rotate, rise, lower, or drift at any point. Treat the card as a frozen
photograph layered in front of the character, permanently glued to the
character's hands for the entire 8-second duration.

MOTION DETAIL: the character's expression is confident and assured, as if
proudly presenting the yearly total.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion must
come ONLY from the face and body — the hands holding the card must remain
completely still and attached for the full clip. No portion of the clip
should hold a single frozen pose for more than half a second, but never by
releasing or dropping the card.

STATIC ELEMENTS: the payslip poster, labor-contract poster, desk, plants,
calculator, and clipboard must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement, no card
disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("1년
약", "445만원") and the background poster text as locked, non-regenerating
image layers for the full 8 seconds, including the very last frame. Render
these exactly as pixels copied from the reference image, unchanged frame
to frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO CARD
MOVEMENT, NO CARD DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE
LAST SECOND, NO HANDS OPENING OUTWARD OR RELEASING THE CARD, NO
EMPTY-HANDED POSE AT ANY POINT, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
confidently presenting the yearly total — never static, never frozen even
in the final seconds. The card stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep11-videos/geumbaksa_ep11_s7_longterm_simulation_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

================================================================================
# 🟨 10초 티어 (s5, s8)
================================================================================

---

## s5 — method (10초, 카드 감싸쥠, 계산식+예시 통합)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the HR/labor-contract consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "시급 × 8시간" on the top line and "하루 85,600원" in red on
the bottom line — completely rigid, held in both white-gloved hands at
chest height for the entire clip, from frame 1 to the very last frame with
NO exception. The card must still be visibly held at the exact final
frame, identically to frame 1. The card never disappears, is never
dropped, is never released, and the hands never open outward away from the
card at any point, including the last 1-2 seconds. The card does not tilt,
rotate, rise, lower, or drift at any point. Treat the card as a frozen
photograph layered in front of the character, permanently glued to the
character's hands for the entire 10-second duration.

MOTION DETAIL: the character's expression starts clear and instructive
while walking through the formula, then shifts to confident and assured
when revealing the resulting amount.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
body bounces, continuous mouth movement while speaking. This motion must
come ONLY from the face and body — the hands holding the card must remain
completely still and attached for the full clip. No portion of the clip
should hold a single frozen pose for more than half a second, but never by
releasing or dropping the card.

STATIC ELEMENTS: the payslip poster, labor-contract poster, desk, plants,
calculator, and clipboard must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement, no card
disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("시급
× 8시간", "하루 85,600원") and the background poster text as locked,
non-regenerating image layers for the full 10 seconds, including the very
last frame. Render these exactly as pixels copied from the reference
image, unchanged frame to frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, NO CARD
MOVEMENT, NO CARD DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE
LAST SECOND, NO HANDS OPENING OUTWARD OR RELEASING THE CARD, NO
EMPTY-HANDED POSE AT ANY POINT, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
CARD TILT OR ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, transitioning
from clearly explaining a formula to confidently revealing the resulting
amount — never static, never frozen even in the final seconds. The card
stays held throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep11-videos/geumbaksa_ep11_s5_method_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s8 — closing (10초, 카드 감싸쥠+마무리 손짓 통합, 마지막 씬)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the HR/labor-contract consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "신청
없이" on the top line and "자동 지급" in red on the bottom line,
completely rigid, held in ONE white-gloved hand at chest height for the
entire clip, from frame 1 to the very last frame with NO exception. The
card must still be visibly held at the exact final frame, identically to
frame 1. The card never disappears, is never dropped, is never released,
and the hand holding it never opens outward away from the card at any
point, including the last 1-2 seconds. The card does not tilt, rotate,
rise, lower, or drift at any point. Treat the card as a frozen photograph
layered in front of the character, permanently glued to that hand for the
entire 10-second duration. The character's OTHER hand (empty, holding no
prop) gently waves beside its head in a natural, continuous small wave
motion, as if warmly wrapping up and reminding the viewer to double-check
with their employer.

MOTION DETAIL: the character's expression is bright, warm, and friendly
throughout, as if delivering reassuring closing advice.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY, THIS IS THE FINAL
SCENE OF THE EPISODE — DO NOT LET IT GO STATIC): the character must show
visible, continuous motion for the ENTIRE 10 seconds, including the last
2-3 seconds — natural eye blinks at least every 2-3 seconds, gentle
continuous waving motion from the empty hand, subtle body bounces,
continuous mouth movement while speaking. The hand holding the card must
remain completely still and attached for the full clip even while the
other hand waves. No portion of the clip, especially the back half, should
hold a single frozen pose for more than half a second, but never by
releasing or dropping the card.

STATIC ELEMENTS: the payslip poster, labor-contract poster, desk, plants,
calculator, and clipboard must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement, no card
disappearance.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("신청
없이", "자동 지급") and the background poster text as locked,
non-regenerating image layers for the full 10 seconds, including the very
last frame. Render these exactly as pixels copied from the reference
image, unchanged frame to frame, still fully visible and held at the end.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, or flickering surfaces anywhere in
the frame, no regenerated or reinterpreted signage, no background changes,
no character redesign, no abrupt cut or freeze mid-motion, no static
expression, no frozen pose while speaking, NO CARD MOVEMENT, NO CARD
DISAPPEARING OR BEING DROPPED AT ANY POINT INCLUDING THE LAST SECOND, NO
HAND OPENING OUTWARD OR RELEASING THE CARD, NO EMPTY-HANDED POSE ON THE
CARD-HOLDING SIDE AT ANY POINT, NO FULL-BODY FREEZE AT ANY POINT, no
holding completely still for more than half a second anywhere in the clip,
no rigid locked pose for the second half of the clip, NO CAMERA ZOOM OR
FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD TILT OR
ROTATION AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
concluding with practical advice — never static, never frozen even in the
final seconds. The card stays held in one hand throughout.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep11-videos/geumbaksa_ep11_s8_closing_motion.mp4`로 저장
2. 시작·중반(4~5초)·끝(9~10초) 프레임 전부 확인 — 마지막 씬이므로 후반부 정지 여부, **카드가 끝까지 들려 있는지** 특히 꼼꼼히 확인
3. 8개 씬 전부 완료 후 본편 조립(`run-owl-assemble-shorts-v2.mjs`,
   `--spec-module ./_geumbaksa-ep11-assembly-spec.mjs --spec-export
   GEUMBAKSA_ASSEMBLY_SPEC`, `--clip-dir C:/tmp/geumbaksa-ep11-videos`) →
   고정 CTA 연결(`run-owl-episode-with-fixed-cta-once.mjs`, 금박사 고정 CTA
   `C:\tmp\geumbaksa-cta-fixed-clean\geumbaksa_cta_clean_final_v3voice.mp4`)
   진행
