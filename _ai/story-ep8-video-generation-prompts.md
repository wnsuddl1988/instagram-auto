# 스토리형 8편 (LG전자 휴대폰 철수 — 쌓인 5조 원이 아니라 앞으로의 손실, 18장면) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/story-ep8-images/`
영상 저장: **장면 번호로** `C:/Users/PC/Downloads/1.mp4` ~ `18.mp4` (스토리형 8편이라고 알려주기)

생성기: `scripts/build-story-video-generation-prompts.mjs` (TTS: `C:/tmp/money-shorts-os/story-ep8-tts/output-v2/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json`, 최종 타임라인 126.013초 — 편마다 확정한 템포 기준)

**스토리형 재연 장면 규칙:** 18번 외에는 말하는 인물이 없다(말·입 움직임 전부 금지, 카메라 고정, 인물·사물 동작만). 사용 길이가 7초 이하면 8초 클립, 넘으면 10초 클립(조립 때 장면 길이에 맞춰 자른다). Gemini(Veo)로 배정하는 장면은 길이와 무관하게 항상 10초.
**이 편은 모든 장면에서 화면에 글자·숫자·로고가 없어야 한다**, **영상에 새 간판·숫자·로고가 생기면 반려**.
**얼굴 안전 구간(Owner 2026-10-07):** 영상 위 제목이 세로 18~37%에 계속 떠 있으므로, 영상 생성 결과에서도 인물 얼굴이 위쪽(세로 40% 위)으로 올라오거나 카메라가 움직여 얼굴이 위로 이동하면 반려한다(이미지 구도 그대로 유지).

| 장면 | 이미지 | 저장할 영상 파일명 | 사용 길이 | 티어 | 샷 / 배경 | 형태 |
|---|---|---|---|---|---|---|
| s1 hook | `story_ep8_s1.png` | `story_ep8_s1_hook_motion.mp4` | 7.74초 | **10초** | medium / A | 재연(말 없음) |
| s2 why | `story_ep8_s2.png` | `story_ep8_s2_why_motion.mp4` | 2.85초 | **8초** | close / B | 재연(말 없음) |
| s3 peak | `story_ep8_s3.png` | `story_ep8_s3_peak_motion.mp4` | 6.93초 | **8초** | medium / C | 재연(말 없음) |
| s4 iphone | `story_ep8_s4.png` | `story_ep8_s4_iphone_motion.mp4` | 7.45초 | **10초** | close / D | 재연(말 없음) |
| s5 squeeze | `story_ep8_s5.png` | `story_ep8_s5_squeeze_motion.mp4` | 7.84초 | **10초** | wide / E | 재연(말 없음) |
| s6 g5 | `story_ep8_s6.png` | `story_ep8_s6_g5_motion.mp4` | 8.81초 | **10초** | close / F | 재연(말 없음) |
| s7 streak | `story_ep8_s7.png` | `story_ep8_s7_streak_motion.mp4` | 7.13초 | **10초** | close / G | 재연(말 없음) |
| s8 loss2020 | `story_ep8_s8.png` | `story_ep8_s8_loss2020_motion.mp4` | 4.98초 | **8초** | close / H | 재연(말 없음) |
| s9 mail | `story_ep8_s9.png` | `story_ep8_s9_mail_motion.mp4` | 8.50초 | **10초** | close / I | 재연(말 없음) |
| s10 sale | `story_ep8_s10.png` | `story_ep8_s10_sale_motion.mp4` | 6.49초 | **8초** | close / J | 재연(말 없음) |
| s11 sunk | `story_ep8_s11.png` | `story_ep8_s11_sunk_motion.mp4` | 7.44초 | **10초** | medium / K | 재연(말 없음) |
| s12 board | `story_ep8_s12.png` | `story_ep8_s12_board_motion.mp4` | 3.71초 | **8초** | close / L | 재연(말 없음) |
| s13 measures | `story_ep8_s13.png` | `story_ep8_s13_measures_motion.mp4` | 8.11초 | **10초** | medium / M | 재연(말 없음) |
| s14 headcount | `story_ep8_s14.png` | `story_ep8_s14_headcount_motion.mp4` | 7.17초 | **10초** | wide / N | 재연(말 없음) |
| s15 reassign | `story_ep8_s15.png` | `story_ep8_s15_reassign_motion.mp4` | 7.70초 | **10초** | wide / O3 | 재연(말 없음) |
| s16 rnd | `story_ep8_s16.png` | `story_ep8_s16_rnd_motion.mp4` | 7.16초 | **10초** | close / P2 | 재연(말 없음) |
| s17 outlook | `story_ep8_s17.png` | `story_ep8_s17_outlook_motion.mp4` | 6.97초 | **8초** | close / Q | 재연(말 없음) |
| s18 close | `story_ep8_s18.png` | `story_ep8_s18_close_motion.mp4` | 9.03초 | **10초** | medium / R | 말함(부엉박사) |

★ 영상 생성 절대규칙(`_ai/CURRENT_STANDARDS.md` §0-1): 나레이션 영상이라 "Silent" 단어 금지, "glued" 같은 신체 접착 표현 금지. **장면을 몰아서 생성하지 말고 하나씩 즉시 검수** — 시작·중반·끝 프레임의 인물·소품·글자를 확인한다.

================================================================================
# 🟦 8초 티어 (s2, s3, s8, s10, s12, s17)
================================================================================

## s2 — evidence (8초, 재연, 사용 2.8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the dark table close view of one hand carefully lifting a plain smartphone under a soft lamp
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the hand lifts the phone, turns it once under the lamp and sets it down, the lamp light stays steady, the table stays completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the dark table and the soft lamp light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no face or body ever appears — only the one hand; the phone keeps no text or logos; the table and the lamp stay fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: a quiet question.
```

---

## s3 — evidence (8초, 재연, 사용 6.9초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the bright exhibition hall with a three-step podium holding plain phone models, a glossy black phone model on the third step under a soft spotlight
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the spotlight settles on the glossy black phone on the third step and glints once, the podium and the other models stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the three-step podium, the plain phone models on the first and second steps, and the soft spotlight
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the podium and the phone models stay in the same arrangement with no text or logos; no people appear; only the spotlight shifts.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: a peak moment.
```

---

## s8 — evidence (8초, 재연, 사용 5.0초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the close view of a large monitor showing a pie chart almost entirely dark gray with one very thin vivid slice and no text, a suited hand resting on the desk in front
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: a soft glow runs along the edge of the chart and stops at the thin vivid slice, the monitor and the hand stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the large monitor, the nearly all-gray pie chart with one thin vivid slice, and the desk
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no face or body appears — only the one hand and the suit sleeve; the pie chart keeps almost all dark gray with one thin vivid slice and no text or numbers; the monitor and the desk stay fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: a sliver left.
```

---

## s10 — evidence (8초, 재연, 사용 6.5초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the meeting room table close view of two suited hands across from each other each pushing a plain folder back toward the other side, both delegations seen from behind
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: each hand pushes its folder back across the table and the folders stop in the middle, the delegations behind stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the meeting table, the two plain folders, the delegations seen from behind, and the large window with the city view
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no face ever appears — only the hands and suit sleeves, and the delegations stay seen from behind; the folders keep plain covers with no text; the table and the window stay fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: no agreement.
```

---

## s12 — evidence (8초, 재연, 사용 3.7초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the close view of a wall calendar of an empty grid with no numbers or text and a suited hand circling one box with a red pen in bright morning light
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the red pen draws one firm circle around a box and lifts away, the morning light stays steady, the calendar stays completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the wall calendar grid and the bright morning light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no face or body appears — only the one hand and the suit sleeve; the calendar keeps only an empty grid with no numbers or text; the light stays fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: a date is set.
```

---

## s17 — evidence (8초, 재연, 사용 7.0초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the close view of a paper with one long thick red bar and no text and a suited hand erasing it from the end with an eraser in warm afternoon light
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the eraser rubs along the red bar and more of it disappears, the warm light stays steady, the paper and the desk stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the paper, the desk, and the warm afternoon light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no face or body appears — only the one hand and the suit sleeve; the paper keeps only the plain red bar with no text or numbers; the desk and the light stay fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: a loss erased.
```

---

================================================================================
# 🟨 10초 티어 (s1, s4, s5, s6, s7, s9, s11, s13, s14, s15, s16, s18)
================================================================================

## s1 — hook (10초, 재연, 사용 7.7초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the night phone showroom with rows of plain smartphones on display shelves and a suited person seen from behind switching off the lights one by one
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the person switches off one more row of lights and the showroom grows darker, the shelves and the phones stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the display shelves with the plain smartphones, the polished floor, and the showroom walls
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the person stays seen from behind with no face ever shown; the phones stay in the same arrangement with no text or logos; nobody else enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: closing a business.
```

---

## s4 — evidence (10초, 재연, 사용 7.4초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the store table with old flip phones pushed to the side and one sleek touchscreen smartphone in the center, a hand sliding one flip phone away
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the hand pushes one more flip phone to the side leaving the sleek smartphone alone in the center, the table and the smartphone stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the store table, the pile of old flip phones, and the sleek smartphone in the center
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no face or body appears — only the one hand; no phone shows any text, logos or brand shapes; the table stays fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: the market shifts.
```

---

## s5 — evidence (10초, 재연, 사용 7.8초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the wide store interior with a glossy premium display on the left holding only two kinds of plain phone models, heaps of plain budget phone boxes on the right floor, and a small table with one phone in the narrow aisle between
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: a soft light slides from the glossy premium display down the narrow aisle and settles on the lone phone on the small table, everything else stays completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the premium display, the heaps of plain boxes, the narrow aisle, and the small table
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the premium display, the heaps of boxes and the small table stay in the same arrangement with no text or logos; no people appear; only the light shifts.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: squeezed between.
```

---

## s6 — evidence (10초, 재연, 사용 8.8초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the bright desk close view of two hands pulling out the bottom module of a plain smartphone like a drawer and sliding in another module
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the hands slide the bottom module out and click another module in, the warm light stays steady, the desk stays completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the desk and the warm light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no face or body appears — only the two hands; the phone and the module keep no text or logos; the desk stays fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: a bold attempt.
```

---

## s7 — evidence (10초, 재연, 사용 7.1초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the night office desk with a tall stack of thick red ledgers with blank covers and a suited hand placing one more on top under a desk lamp
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the hand sets one more red ledger on top and the stack sways slightly then steadies, the lamp light stays steady, the desk stays completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the tall stack of red ledgers, the desk, and the lamp light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no face or body appears — only the one hand and the suit sleeve; the ledgers keep blank red covers with no text or numbers; the desk and the lamp stay fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: losses piling up.
```

---

## s9 — evidence (10초, 재연, 사용 8.5초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the office desk close view of a laptop showing a mail window of only thin lines and a suited hand paused over the keyboard, winter daytime city outside
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the hand hovers over the keyboard and then lowers a finger to press one key, the winter light stays steady, the laptop and the desk stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the laptop with the plain mail window, the desk, and the winter city window
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no face or body appears — only the one hand and the suit sleeve; the laptop screen keeps only thin lines with no text; the desk and the window stay fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: an undecided message.
```

---

## s11 — core_question (10초, 재연, 사용 7.4초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the bright desk with a locked glass case holding a tall gold coin tower on the left and an open box on the right where coins keep falling in from above and drain through a hole
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: coins keep dropping into the open box on the right and draining through the hole, the locked glass case with the tower on the left stays completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the locked glass case with the coin tower, the open box with the drain hole, and the desk
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the locked glass case with the tall coin tower stays completely fixed; the coins keep no text or numbers; no people appear; only the coins on the right keep falling.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: sunk versus future loss.
```

---

## s13 — evidence (10초, 재연, 사용 8.1초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the service center repair counter with a technician in work clothes seen from behind opening a plain smartphone, two pallets of plain packed boxes on the floor behind
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the technician carefully replaces a part and closes the phone, the pallets behind and the counter stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the repair counter, the two pallets of plain packed boxes, and the bright indoor light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the technician stays seen from behind with no face ever shown; the pallets and boxes stay in the same arrangement with no text or logos; nobody else enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: keeping promises.
```

---

## s14 — evidence (10초, 재연, 사용 7.2초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the very wide open-plan office with endless rows of desks and many staff seated and working seen small from behind, even ceiling lights
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the many tiny staff keep typing and a few turn to talk to the person beside them, the desks and the ceiling lights stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the endless rows of desks, the ceiling lights, and the office walls
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the desks keep the same arrangement; the staff stay tiny and seen from behind with no face shown; no text or logos.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: many people at stake.
```

---

## s15 — evidence (10초, 재연, 사용 7.7초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the building lobby splitting into three corridors with staff carrying small boxes seen from behind walking into different corridor doors, colored lights above each door and no text
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the staff carrying small boxes walk into the three corridors one after another, the lobby and the corridor doors stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the lobby, the three corridors, the colored lights above the doors, and the bright lobby light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the staff stay seen from behind with no face ever shown; the corridor signs keep only colored lights with no text; the lobby and the corridors stay fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: moved, not dismissed.
```

---

## s16 — evidence (10초, 재연, 사용 7.2초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the research lab bench close view of a small camera module, a circuit board and antenna prototypes with a gloved hand lifting a part with tweezers under cool white light
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the gloved hand lifts the small part with tweezers and seats it onto the circuit board, the bench and the light stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the lab bench, the circuit board, the prototypes, and the cool white light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no face or body appears — only the one gloved hand; the parts keep no text or logos; the bench and the cool light stay fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: technology carried on.
```

---

## s18 — save (10초, 말함, 사용 9.0초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl character's design and the dusk Korean downtown office plaza with two plain glass towers with windows starting to light up and an empty bench at one side
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held No props held.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.2s to 8.9s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 8.9s to the very last frame (1.1 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 8.9s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 8.9s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the two plain glass towers, the lit windows, the empty bench, the smooth light gray pavement, and the warm evening light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the glass towers and the empty bench stay fixed; the sunglasses stay on top of the head; no props are held.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking, voice or lip movement after 8.9s, no camera zoom, crop, or framing drift at any point.

MOOD: warm summary and invitation to follow.
```

---

