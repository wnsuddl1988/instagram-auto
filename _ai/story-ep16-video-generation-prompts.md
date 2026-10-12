# 스토리형 16편 (불닭볶음면 — 먹을 수 없다던 라면이 다시 먹고 싶은 맛이 된 일, 17장면) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/story-ep16-images/`
영상 저장: **장면 번호로** `C:/Users/PC/Downloads/1.mp4` ~ `17.mp4` (스토리형 16편이라고 알려주기)

생성기: `scripts/build-story-video-generation-prompts.mjs` (TTS: `C:/tmp/money-shorts-os/story-ep16-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json`, 최종 타임라인 71.365초 — 편마다 확정한 템포 기준)

**스토리형 재연 장면 규칙:** 17번 외에는 말하는 인물이 없다(말·입 움직임 전부 금지, 카메라 고정, 인물·사물 동작만). 사용 길이가 7초 이하면 8초 클립, 넘으면 10초 클립(조립 때 장면 길이에 맞춰 자른다). Gemini(Veo)로 배정하는 장면은 길이와 무관하게 항상 10초.
**이 편은 모든 장면에서 화면에 글자·숫자·로고가 없어야 한다**, **영상에 새 간판·숫자·로고가 생기면 반려**.
**얼굴 안전 구간(Owner 2026-10-07):** 영상 위 제목이 세로 18~37%에 계속 떠 있으므로, 영상 생성 결과에서도 인물 얼굴이 위쪽(세로 40% 위)으로 올라오거나 카메라가 움직여 얼굴이 위로 이동하면 반려한다(이미지 구도 그대로 유지).

| 장면 | 이미지 | 저장할 영상 파일명 | 사용 길이 | 티어 | 샷 / 배경 | 형태 |
|---|---|---|---|---|---|---|
| s1 hook | `story_ep16_s1.png` | `story_ep16_s1_hook_motion.mp4` | 7.67초 | **10초** | close / A | 재연(말 없음) |
| s2 why | `story_ep16_s2.png` | `story_ep16_s2_why_motion.mp4` | 4.00초 | **8초** | medium / B | 재연(말 없음) |
| s3 myeongdong | `story_ep16_s3.png` | `story_ep16_s3_myeongdong_motion.mp4` | 3.49초 | **8초** | wide / C | 재연(말 없음) |
| s4 sweat | `story_ep16_s4.png` | `story_ep16_s4_sweat_motion.mp4` | 4.40초 | **8초** | medium / D | 재연(말 없음) |
| s5 decide | `story_ep16_s5.png` | `story_ep16_s5_decide_motion.mp4` | 2.56초 | **8초** | medium / E | 재연(말 없음) |
| s6 launch | `story_ep16_s6.png` | `story_ep16_s6_launch_motion.mp4` | 2.51초 | **8초** | close / F | 재연(말 없음) |
| s7 unfit | `story_ep16_s7.png` | `story_ep16_s7_unfit_motion.mp4` | 4.36초 | **8초** | close / G | 재연(말 없음) |
| s8 cost | `story_ep16_s8.png` | `story_ep16_s8_cost_motion.mp4` | 4.39초 | **8초** | medium / H | 재연(말 없음) |
| s9 first | `story_ep16_s9.png` | `story_ep16_s9_first_motion.mp4` | 2.55초 | **8초** | close / I | 재연(말 없음) |
| s10 whyagain | `story_ep16_s10.png` | `story_ep16_s10_whyagain_motion.mp4` | 3.22초 | **8초** | medium / J | 재연(말 없음) |
| s11 addict | `story_ep16_s11.png` | `story_ep16_s11_addict_motion.mp4` | 4.31초 | **8초** | medium / K | 재연(말 없음) |
| s12 month30 | `story_ep16_s12.png` | `story_ep16_s12_month30_motion.mp4` | 3.42초 | **8초** | close / L | 재연(말 없음) |
| s13 uk | `story_ep16_s13.png` | `story_ep16_s13_uk_motion.mp4` | 3.61초 | **8초** | medium / M | 재연(말 없음) |
| s14 follow | `story_ep16_s14.png` | `story_ep16_s14_follow_motion.mp4` | 5.64초 | **8초** | wide / N | 재연(말 없음) |
| s15 video | `story_ep16_s15.png` | `story_ep16_s15_video_motion.mp4` | 3.27초 | **8초** | close / O | 재연(말 없음) |
| s16 y2016 | `story_ep16_s16.png` | `story_ep16_s16_y2016_motion.mp4` | 2.94초 | **8초** | close / Q | 재연(말 없음) |
| s17 close | `story_ep16_s17.png` | `story_ep16_s17_close_motion.mp4` | 9.02초 | **10초** | medium / P | 말함(부엉박사) |

★ 영상 생성 절대규칙(`_ai/CURRENT_STANDARDS.md` §0-1): 나레이션 영상이라 "Silent" 단어 금지, "glued" 같은 신체 접착 표현 금지. **장면을 몰아서 생성하지 말고 하나씩 즉시 검수** — 시작·중반·끝 프레임의 인물·소품·글자를 확인한다.

================================================================================
# 🟦 8초 티어 (s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16)
================================================================================

## s2 — core_question (8초, 재연, 사용 4.0초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the a large pot of red sauce simmering in the middle of a kitchen with an empty counter in front, no people, warm lighting
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the red sauce bubbles slowly and steam rises, the pot and the counter stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the pot, the empty counter, and the kitchen walls
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no people appear; the pot keeps no text or logo; the counter stays empty and fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: why so much.
```

---

## s3 — evidence (8초, 재연, 사용 3.5초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the a night alley in Seoul Myeong-dong with a small restaurant entrance glowing red, the signboard holding only a pattern and no text, a few small people seen from behind passing by
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: a few passersby slow down at the red glow and walk on, the alley and the entrance stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the alley, the restaurant entrance, and the red glow
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the people stay small and seen from behind with no face shown; no text or logos; the entrance stays the same.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: where it began.
```

---

## s4 — evidence (8초, 재연, 사용 4.4초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the inside a restaurant a few young people seen from behind seated at a table eating red spicy food and wiping sweat from their foreheads, no text, warm lighting
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: one person wipes their forehead and reaches for another bite, the table and the dishes stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the table, the red dishes, and the restaurant walls
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the people stay seen from behind with no face ever shown; the dishes keep no text; nobody else enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: sweating yet smiling.
```

---

## s5 — evidence (8초, 재연, 사용 2.6초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the a person seen from behind at a restaurant window seat writing in a notebook with no readable text, red light outside, low lighting
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the person writes a few strokes then stops and looks outside, the window and the table stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the window seat, the notebook, and the red glow outside
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the people stay seen from behind with no face ever shown; the notebook keeps no readable text; nobody else enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: an idea forming.
```

---

## s6 — evidence (8초, 재연, 사용 2.5초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the a store shelf with plain red noodle packets with only a flame pattern and no text or logos freshly lined up, no people, bright lighting
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: a soft glint of light sweeps over the lined packets once, the shelf and the packets stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the shelf, the lined-up packets, and the lighting
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no people appear; the packets keep no text or logos; the shelf stays fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: launch day.
```

---

## s7 — evidence (8초, 재연, 사용 4.4초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the close view of a hand setting down chopsticks and another hand quickly grabbing a water glass beside a noodle bowl, hands and bowl only, no face, warm lighting
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the hand grips the glass and lifts it quickly, the table and the bowl stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the table, the bowl, and the lighting
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no face or body appears — only the hands; the bowl and glass keep no text or logos; the table stays fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: too spicy.
```

---

## s8 — evidence (8초, 재연, 사용 4.4초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the a warehouse corner with stacked empty sauce tubs and chicken crates and an empty shelf in front, no people, low lighting, no text
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: dust drifts slowly through a shaft of light, the tubs and the shelf stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the stacked tubs, the crates, the empty shelf, and the lighting
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no people appear; the tubs and crates keep no text or logos; the shelf stays empty.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: cost before sales.
```

---

## s9 — evidence (8초, 재연, 사용 2.6초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the close view of a bar chart model on a desk with one low bar, no text or numbers, no people, soft lighting
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: a soft light slides over the low bar once, the desk and the chart stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the desk, the chart model, and the soft light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no people appear; the chart keeps no text or numbers; the desk stays fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: a small start.
```

---

## s10 — core_question (8초, 재연, 사용 3.2초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the people seen from behind standing again in front of a shelf reaching for red plain packets, no text or logos, bright lighting
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: one person picks up a packet and holds it with both hands, the shelf and the packets stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the shelf, the packets, and the lighting
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the people stay seen from behind with no face ever shown; the packets keep no text or logos; nobody else enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: back for more.
```

---

## s11 — evidence (8초, 재연, 사용 4.3초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the people seen from behind seated around a table sharing spicy noodles and gesturing to each other, no text, warm lighting
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: two people laugh and fan their mouths with their hands, the table and the bowls stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the table, the bowls, and the warm light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the people stay seen from behind with no face ever shown; the bowls keep no text or logos; nobody else enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: addictive heat.
```

---

## s12 — evidence (8초, 재연, 사용 3.4초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the close view of a bar chart model on a desk with a bar almost four times taller than the first, no text or numbers, no people, bright lighting
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: a soft glow travels up the tall bar and fades, the desk and the chart stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the desk, the chart model, and the bright light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no people appear; the chart keeps no text or numbers; the desk stays fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: four times higher.
```

---

## s13 — evidence (8초, 재연, 사용 3.6초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the a tripod camera in front of a bowl of red noodles on a desk with a person seen from behind taking a breath behind it, no text, low lighting
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the person exhales and lifts the chopsticks slowly, the desk and the camera stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the desk, the camera on the tripod, the bowl, and the lighting
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the people stay seen from behind with no face ever shown; the camera and bowl keep no text or logos; nobody else enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: about to try.
```

---

## s14 — evidence (8초, 재연, 사용 5.6초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the three different rooms side by side each with the same red noodle bowl and a camera on the desk, small people seen from behind, no text or logos
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: each person in turn lifts the chopsticks and winces slightly, the rooms and the desks stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the three rooms, the desks, the bowls, and the cameras
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the people stay small and seen from behind with no face shown; no text or logos; the three rooms stay fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: a challenge spreading.
```

---

## s15 — evidence (8초, 재연, 사용 3.3초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the a desk with a monitor showing only rising stacked bars with no text or numbers and a bowl of red noodles in front, no people, low lighting
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the stacked bars on the monitor rise slowly and the glow brightens, the desk and the bowl stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the desk, the monitor, the bowl, and the lighting
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no people appear; the monitor keeps no text or numbers; the desk stays fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: the world watching.
```

---

## s16 — evidence (8초, 재연, 사용 2.9초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the close view of a bar chart model with several bars ending in one very tall bar at the far end, no text or numbers, no people, bright light
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: a gentle glow travels once along the bars to the tallest one and fades, the desk and the chart stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the chart model, the desk, and the bright light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no people appear; the chart keeps no text or numbers; the desk stays fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: over a thousand.
```

---

================================================================================
# 🟨 10초 티어 (s1, s17)
================================================================================

## s1 — hook (10초, 재연, 사용 7.7초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the a test kitchen counter with two large tubs of red sauce and a stack of chicken crates, with one untouched plain red noodle packet with only a flame pattern in front, no people, warm but heavy lighting
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: a thin steam drifts from the sauce tubs while the packet sits untouched, the counter and the crates stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the counter, the sauce tubs, the crates, and the lighting
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no people appear; the packet keeps no text or logo; the tubs and crates stay fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: a big input, a cold reaction.
```

---

## s17 — save (10초, 말함, 사용 9.0초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the a bright afternoon in front of a Korean supermarket food aisle with a display of plain red noodle packets stacked high and two plain white boxes on the ground, smooth light gray floor
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held

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

STATIC ELEMENTS: the stacked display, the two white boxes, the smooth light gray floor, and the warm afternoon light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the display and the boxes stay fixed; the sunglasses stay on top of the head; no props are held.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking, voice or lip movement after 8.9s, no camera zoom, crop, or framing drift at any point.

MOOD: warm summary and invitation to follow.
```

---

