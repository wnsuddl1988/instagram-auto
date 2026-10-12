# 스토리형 5편 (삼성 화형식 — 500억 원어치 불량품을 직접 불태운 날, 15장면) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/story-ep5-images/`
영상 저장: **장면 번호로** `C:/Users/PC/Downloads/1.mp4` ~ `15.mp4` (스토리형 5편이라고 알려주기)

생성기: `scripts/build-story-video-generation-prompts.mjs` (TTS: `C:/tmp/money-shorts-os/story-ep5-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json`, 최종 타임라인 77.517초 — 편마다 확정한 템포 기준)

**스토리형 재연 장면 규칙:** 15번 외에는 말하는 인물이 없다(말·입 움직임 전부 금지, 카메라 고정, 인물·사물 동작만). 사용 길이가 7초 이하면 8초 클립, 넘으면 10초 클립(조립 때 장면 길이에 맞춰 자른다). Gemini(Veo)로 배정하는 장면은 길이와 무관하게 항상 10초.
**이 편은 모든 장면에서 화면에 글자·숫자·로고가 없어야 한다**, **영상에 새 간판·숫자·로고가 생기면 반려**.
**얼굴 안전 구간(Owner 2026-10-07):** 영상 위 제목이 세로 18~37%에 계속 떠 있으므로, 영상 생성 결과에서도 인물 얼굴이 위쪽(세로 40% 위)으로 올라오거나 카메라가 움직여 얼굴이 위로 이동하면 반려한다(이미지 구도 그대로 유지).

| 장면 | 이미지 | 저장할 영상 파일명 | 사용 길이 | 티어 | 샷 / 배경 | 형태 |
|---|---|---|---|---|---|---|
| s1 hook | `story_ep5_s1.png` | `story_ep5_s1_hook_motion.mp4` | 4.74초 | **8초** | wide / A | 재연(말 없음) |
| s2 scene | `story_ep5_s2.png` | `story_ep5_s2_scene_motion.mp4` | 6.11초 | **8초** | medium / A | 재연(말 없음) |
| s3 mix | `story_ep5_s3.png` | `story_ep5_s3_mix_motion.mp4` | 4.07초 | **8초** | close / C | 재연(말 없음) |
| s4 why | `story_ep5_s4.png` | `story_ep5_s4_why_motion.mp4` | 2.55초 | **8초** | wide / A | 재연(말 없음) |
| s5 defect | `story_ep5_s5.png` | `story_ep5_s5_defect_motion.mp4` | 5.54초 | **8초** | medium / D | 재연(말 없음) |
| s6 market | `story_ep5_s6.png` | `story_ep5_s6_market_motion.mp4` | 1.43초 | **8초** | medium / E | 재연(말 없음) |
| s7 share | `story_ep5_s7.png` | `story_ep5_s7_share_motion.mp4` | 7.81초 | **10초** | medium / F | 재연(말 없음) |
| s8 cause | `story_ep5_s8.png` | `story_ep5_s8_cause_motion.mp4` | 5.00초 | **8초** | medium / G | 재연(말 없음) |
| s9 cost | `story_ep5_s9.png` | `story_ep5_s9_cost_motion.mp4` | 3.42초 | **8초** | wide / H | 재연(말 없음) |
| s10 order | `story_ep5_s10.png` | `story_ep5_s10_order_motion.mp4` | 2.99초 | **8초** | close / I | 재연(말 없음) |
| s11 words | `story_ep5_s11.png` | `story_ep5_s11_words_motion.mp4` | 3.54초 | **8초** | close / I | 재연(말 없음) |
| s12 after_defect | `story_ep5_s12.png` | `story_ep5_s12_after_defect_motion.mp4` | 4.13초 | **8초** | medium / D | 재연(말 없음) |
| s13 after_share | `story_ep5_s13.png` | `story_ep5_s13_after_share_motion.mp4` | 10.48초 | **10초** | medium / J | 재연(말 없음) |
| s14 meaning | `story_ep5_s14.png` | `story_ep5_s14_meaning_motion.mp4` | 6.61초 | **8초** | medium / K | 재연(말 없음) |
| s15 close | `story_ep5_s15.png` | `story_ep5_s15_close_motion.mp4` | 9.10초 | **10초** | medium / O | 말함(부엉박사) |

★ 영상 생성 절대규칙(`_ai/CURRENT_STANDARDS.md` §0-1): 나레이션 영상이라 "Silent" 단어 금지, "glued" 같은 신체 접착 표현 금지. **장면을 몰아서 생성하지 말고 하나씩 즉시 검수** — 시작·중반·끝 프레임의 인물·소품·글자를 확인한다.

================================================================================
# 🟦 8초 티어 (s1, s2, s3, s4, s5, s6, s8, s9, s10, s11, s12, s14)
================================================================================

## s1 — hook (8초, 재연, 사용 4.7초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the dusk 1995 Korean electronics factory yard with a burning pile of plain unmarked devices and workers standing in a wide circle
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: flames roar and rise from the pile and thick smoke drifts across the reddened sky while the tiny workers stand still watching, the factory buildings stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the low gray factory buildings, the chimney, the reddened sky, the wide dirt yard, and the circle of workers in light blue uniforms standing at the edge
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the burning pile keeps plain unmarked beige devices with no logos or text; the low factory buildings and the chimney stay fixed; the workers stay tiny at the edge in the same positions and nobody new enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: shocking sight.
```

---

## s2 — evidence (8초, 재연, 사용 6.1초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the dusk 1995 Korean electronics factory yard with a burning pile of plain unmarked devices and workers standing in a wide circle
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the worker swings the hammer down onto the pile with a heavy blow and pieces split apart, then lifts it again, the watching crowd and the reddened sky stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the low gray factory buildings, the chimney, the reddened sky, the wide dirt yard, and the circle of workers in light blue uniforms standing at the edge
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the hammer stays gripped in both of his hands for the whole clip; the pile keeps plain unmarked devices with no text; the crowd of workers behind keeps the same circle and nobody new enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: a heavy blow.
```

---

## s3 — evidence (8초, 재연, 사용 4.1초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the close view of a mixed pile of beige antenna cordless phones, brick-sized mobile phones and beige fax machines on a dirt yard under a dim evening sky
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: a thin line of smoke drifts across the pile and a loose antenna sways slightly in the wind, the devices and the ground stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the mixed pile of beige antenna phones, brick-size mobile phones and fax machines, the cracked casings, the dirt ground, and the dim evening sky
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the pile keeps the same mix of beige antenna phones, brick-size phones and fax machines with no logos or text; no people or hands ever appear; only the smoke and the light shift.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: the sheer amount.
```

---

## s4 — core_question (8초, 재연, 사용 2.6초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the dusk 1995 Korean electronics factory yard with a burning pile of plain unmarked devices and workers standing in a wide circle
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the workers stand still looking at the fire while one slowly turns his head toward another, the flames flicker on their backs, the factory and the sky stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the low gray factory buildings, the chimney, the reddened sky, the wide dirt yard, and the circle of workers in light blue uniforms standing at the edge
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the workers stay seen only from behind with no faces ever shown; the burning pile keeps plain unmarked devices with no text; the factory buildings stay fixed and nobody new enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: an unanswered question.
```

---

## s5 — evidence (8초, 재연, 사용 5.5초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the 1990s Korean electronics factory inspection bench under bright fluorescent light with a row of ten plain beige mobile phones
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the inspector turns the phone over with a frown and sets it aside with a small shake of her head, the other nine phones and the bench stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the long inspection bench, the row of ten plain beige phones, the shelf with the plain parts boxes, the fluorescent lights, and the light gray floor
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the row of ten beige phones stays in a line with nine staying in place; the one she holds keeps a plain red dot and no text or logos; the bench and the shelf stay fixed; nobody else enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: one in ten fails.
```

---

## s6 — evidence (8초, 재연, 사용 1.4초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the 1990s Korean electronics store with a glass display packed with plain silver phones and only a few beige phones in one corner
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the customer leans over the front display, compares two phones and walks past the beige corner without a glance, the displays and the lights stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the glass display counter, the packed rows of plain silver phones, the few beige phones in the corner, the fluorescent lights, and the light floor
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the packed silver phones and the few beige phones in the corner stay in the same positions with no logos or text; the glass display and the lights stay fixed; the customer keeps looking at the front rows and nobody else enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: being passed over.
```

---

## s8 — evidence (8초, 재연, 사용 5.0초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the 1990s Korean service center counter behind a glass partition with a plain beige phone on the counter
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the customer points at the phone and speaks with a frown while the clerk turns the phone over with an apologetic look, the counter and the shelf stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the glass partition, the counter with the plain beige phone, the shelf with the plain repair boxes, and the fluorescent lights
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the phone on the counter keeps a plain beige body with no text or logos; the glass partition and the repair boxes stay fixed; the customer keeps one hand on the counter and nobody else enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: complaint at the counter.
```

---

## s9 — evidence (8초, 재연, 사용 3.4초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the large logistics warehouse with stacked plain brown boxes on steel pallets, some open to show beige phones, and a parked forklift
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: dust drifts through the shafts of ceiling light over the towering boxes and a top box slides a little as if settling, the pallets and the forklift stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the stacked plain brown boxes, the steel pallets, the opened boxes with beige phones, the parked forklift, the fluorescent light rows, and the gray concrete floor
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the stacked boxes keep plain brown surfaces with no text or logos; the forklift stays parked in the same place; no people ever appear; only the dust in the light shifts.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: the weight of the cost.
```

---

## s10 — core_question (8초, 재연, 사용 3.0초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the dim 1995 Korean executive office at dusk with a large wooden desk, a paper, a fountain pen and a beige phone
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the hand holds the pen steady over the paper, then signs one firm stroke and lifts the pen, the lamp light flickers faintly

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the large wooden desk, the plain paper, the fountain pen, the beige phone, the desk lamp, the big window with the evening city view, and the wooden bookshelf
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no face, head or body ever appears — only the one hand and the dark gray suit sleeve; the fountain pen stays gripped in the hand and the paper keeps plain faint lines with no text; the phone and the lamp stay fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: a firm decision.
```

---

## s11 — evidence (8초, 재연, 사용 3.5초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the dim 1995 Korean executive office at dusk with a large wooden desk, a paper, a fountain pen and a beige phone
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the index finger taps the phone twice firmly and then pushes it slowly away across the desk, the lamp light stays steady

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the large wooden desk, the plain paper, the fountain pen, the beige phone, the desk lamp, the big window with the evening city view, and the wooden bookshelf
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no face, head or body ever appears — only the one hand and the dark gray suit sleeve; the phone keeps a plain beige body with no text or logos; the lamp and the window stay fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: stern reproach.
```

---

## s12 — evidence (8초, 재연, 사용 4.1초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the 1990s Korean electronics factory inspection bench under bright fluorescent light with a row of ten plain beige mobile phones
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the inspector checks the phone, nods with a satisfied look and sets it back in the row, the other phones and the bench stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the long inspection bench, the row of ten plain beige phones, the shelf with the plain parts boxes, the fluorescent lights, and the light gray floor
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the row of ten beige phones stays clean and in a line with no text or logos; the bench and the shelf stay fixed; the inspector keeps holding one phone with both hands and nobody else enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: quality restored.
```

---

## s14 — evidence (8초, 재연, 사용 6.6초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the 1990s Korean electronics store sales counter with a clerk handing a new beige phone to a smiling customer
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the clerk hands over the new phone with both hands and the customer takes it with a bright smile and a small bow, the counter and the shelves stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the sales counter, the plain new box, the display shelves behind, and the fluorescent lights
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the new phone stays in the clerk's and customer's hands during the handover with a plain beige body and no text or logos; the plain box and the display shelves stay fixed; nobody else enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: trust earned.
```

---

================================================================================
# 🟨 10초 티어 (s7, s13, s15)
================================================================================

## s7 — evidence (10초, 재연, 사용 7.8초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the bright showroom with two towers of stacked plain phones, a tall silver one and a beige one less than half as high
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the light slowly sweeps from the tall silver tower to the shorter beige tower, a single phone on top of the silver tower wobbles slightly, both towers stay in place

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the tall silver tower, the beige tower less than half its height, the white floor, and the plain light gray wall
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the tall silver tower and the beige tower less than half its height keep exactly those heights for the whole clip; the phones keep plain surfaces with no logos or text; no people appear; only the soft light shifts.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: less than half.
```

---

## s13 — evidence (10초, 재연, 사용 10.5초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the 1990s Korean electronics store with the front display packed with beige phones and customers crowding to pick them up
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the customers pick up phones and compare them while the clerk gestures toward a display, the displays and the lights stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the glass display counter, the packed rows of beige phones, the fluorescent lights, and the light floor
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the packed beige phones keep plain bodies with no logos or text; the glass display and the lights stay fixed; the customers keep the same positions and nobody new enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: customers choosing.
```

---

## s15 — save (10초, 말함, 사용 9.1초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl character's design and the bright phone service center lobby with a plain reception counter, a glass partition and shelves of plain white boxes
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held No props held.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.2s to 9.1s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 9.1s to the very last frame (0.9 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 9.1s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 9.1s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the plain reception counter, the glass partition, the shelves with the plain white boxes, the waiting chairs, the smooth light gray stone floor, and the warm afternoon light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the plain boxes on the shelves keep no text; the reception counter and the glass partition stay fixed; the sunglasses stay on top of the head; no props are held.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking, voice or lip movement after 9.1s, no camera zoom, crop, or framing drift at any point.

MOOD: warm summary and invitation to follow.
```

---

