# 스토리형 3편 (정주영 500원 지폐 — 모래밭 사진으로 은행을 움직인 조선소, 16장면) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/story-ep3-images/`
영상 저장: **장면 번호로** `C:/Users/PC/Downloads/1.mp4` ~ `16.mp4` (스토리형 3편이라고 알려주기)

생성기: `scripts/build-story-video-generation-prompts.mjs` (TTS: `C:/tmp/money-shorts-os/story-ep3-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.tempo1.2-gap0.25-pre.audio-fixed.json`, 최종 타임라인 106.868초 — 편마다 확정한 템포 기준)

**스토리형 재연 장면 규칙:** 16번 외에는 말하는 인물이 없다(말·입 움직임 전부 금지, 카메라 고정, 인물·사물 동작만). 사용 길이가 7초 이하면 8초 클립, 넘으면 10초 클립(조립 때 장면 길이에 맞춰 자른다). Gemini(Veo)로 배정하는 장면은 길이와 무관하게 항상 10초.
**이 편은 모든 장면에서 화면에 글자·숫자·로고가 없어야 한다**, **영상에 새 간판·숫자·로고가 생기면 반려**.
**얼굴 안전 구간(Owner 2026-10-07):** 영상 위 제목이 세로 18~37%에 계속 떠 있으므로, 영상 생성 결과에서도 인물 얼굴이 위쪽(세로 40% 위)으로 올라오거나 카메라가 움직여 얼굴이 위로 이동하면 반려한다(이미지 구도 그대로 유지).

| 장면 | 이미지 | 저장할 영상 파일명 | 사용 길이 | 티어 | 샷 / 배경 | 형태 |
|---|---|---|---|---|---|---|
| s1 hook | `story_ep3_s1.png` | `story_ep3_s1_hook_motion.mp4` | 8.28초 | **10초** | medium / A | 재연(말 없음) |
| s2 ask | `story_ep3_s2.png` | `story_ep3_s2_ask_motion.mp4` | 7.34초 | **10초** | medium / A | 재연(말 없음) |
| s3 refuse | `story_ep3_s3.png` | `story_ep3_s3_refuse_motion.mp4` | 6.79초 | **8초** | medium / A | 재연(말 없음) |
| s4 longbottom | `story_ep3_s4.png` | `story_ep3_s4_longbottom_motion.mp4` | 7.11초 | **10초** | medium / B | 재연(말 없음) |
| s5 banknote | `story_ep3_s5.png` | `story_ep3_s5_banknote_motion.mp4` | 6.12초 | **8초** | close / B | 재연(말 없음) |
| s6 letter | `story_ep3_s6.png` | `story_ep3_s6_letter_motion.mp4` | 4.20초 | **8초** | medium / B | 재연(말 없음) |
| s7 guarantee | `story_ep3_s7.png` | `story_ep3_s7_guarantee_motion.mp4` | 9.31초 | **10초** | medium / C | 재연(말 없음) |
| s8 question | `story_ep3_s8.png` | `story_ep3_s8_question_motion.mp4` | 4.61초 | **8초** | medium / D | 재연(말 없음) |
| s9 order | `story_ep3_s9.png` | `story_ep3_s9_order_motion.mp4` | 8.61초 | **10초** | medium / D | 재연(말 없음) |
| s10 groundbreaking | `story_ep3_s10.png` | `story_ep3_s10_groundbreaking_motion.mp4` | 4.20초 | **8초** | wide / E | 재연(말 없음) |
| s11 twist | `story_ep3_s11.png` | `story_ep3_s11_twist_motion.mp4` | 6.24초 | **8초** | wide / F | 재연(말 없음) |
| s12 method | `story_ep3_s12.png` | `story_ep3_s12_method_motion.mp4` | 8.41초 | **10초** | medium / G | 재연(말 없음) |
| s13 completion | `story_ep3_s13.png` | `story_ep3_s13_completion_motion.mp4` | 4.00초 | **8초** | wide / H | 재연(말 없음) |
| s14 number1 | `story_ep3_s14.png` | `story_ep3_s14_number1_motion.mp4` | 7.09초 | **10초** | wide / I | 재연(말 없음) |
| s15 notone | `story_ep3_s15.png` | `story_ep3_s15_notone_motion.mp4` | 6.63초 | **8초** | close / J | 재연(말 없음) |
| s16 close | `story_ep3_s16.png` | `story_ep3_s16_close_motion.mp4` | 7.94초 | **10초** | medium / M | 말함(부엉박사) |

★ 영상 생성 절대규칙(`_ai/CURRENT_STANDARDS.md` §0-1): 나레이션 영상이라 "Silent" 단어 금지, "glued" 같은 신체 접착 표현 금지. **장면을 몰아서 생성하지 말고 하나씩 즉시 검수** — 시작·중반·끝 프레임의 인물·소품·글자를 확인한다.

================================================================================
# 🟦 8초 티어 (s3, s5, s6, s8, s10, s11, s13, s15)
================================================================================

## s3 — evidence (8초, 재연, 사용 6.8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the dark wood-paneled 1971 British bank meeting room with a grey London view
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the banker slowly shakes his head and pushes the folder back across the table with both hands, the Korean man looks down at it with a tight jaw, the room stays completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the long mahogany table, the leather chairs, the large window with the grey sky and old stone buildings, the brass lamp, and the dark green carpet
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the folder stays plain with no text and slides only slightly across the table; the banker shakes his head slowly and keeps his hands on the folder; the lamp, window and chairs stay fixed; nobody else enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: firm refusal.
```

---

## s5 — evidence (8초, 재연, 사용 6.1초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the warm 1970s British ship-consultancy chairman's office with ship models on the shelves
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the finger taps once beside the turtle-ship picture on the banknote and holds there, the old clasped hands tighten slightly, the lamp light flickers faintly

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the large wooden desk, the green leather chair, the shelf of plain ship models, the window with the river and dock cranes, the typewriter, the brass lamp, and the dark brown carpet
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no face or head ever appears — only the pointing finger, the clasped hands and the sleeves; the banknote lies on the desk and keeps only its plain turtle-ship picture with no text or numbers; the typewriter and brass lamp stay fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: a quiet appeal.
```

---

## s6 — evidence (8초, 재연, 사용 4.2초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the warm 1970s British ship-consultancy chairman's office with ship models on the shelves
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the old chairman finishes the signature, lifts the pen and gives a small satisfied nod, then slides the letter toward the envelope with one hand, the room stays still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the large wooden desk, the green leather chair, the shelf of plain ship models, the window with the river and dock cranes, the typewriter, the brass lamp, and the dark brown carpet
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the letter paper keeps only plain faint lines and a scribble signature with no readable text; the envelope stays beside it; his white hair, gold glasses and brown tweed jacket never change; the ship models and the window stay fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: confident endorsement.
```

---

## s8 — core_question (8초, 재연, 사용 4.6초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the warm 1970s shipowner's office with tanker models on a round table and a harbor view
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the three shipowners shake their heads and fold their arms, one waves a hand dismissively over the photo, the tanker models and the harbor window stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the round wooden table with the two plain tanker models, the shelf of small ship models, the large window with the sea and harbor, and the light beige carpet
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the black-and-white sand-field photo stays lying on the table with no text; the two tanker models stay in place; the three shipowners keep their dark suits and nobody else enters; no logos on anything.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: cold reception.
```

---

## s10 — evidence (8초, 재연, 사용 4.2초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the bright clear-day Ulsan sandy shoreline groundbreaking site with the blue sea behind
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the five officials in white helmets push their shovels into the sand in unison and lift a little sand, a sea breeze stirs the small flags and their jackets, the tent and hills stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the wide sandy field, the blue sea and low hills behind, the plain white tent, and the small plain flags
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the five shovels stay held with both hands in the same line; the plain white tent and the small flags show no text or logos; the sea and hills behind stay fixed; no extra people enter.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: decisive groundbreaking.
```

---

## s11 — core_question (8초, 재연, 사용 6.2초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the wide view of a half-built giant shipyard with cranes and the first hull blocks on a finished part of the dock
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: a crane arm slowly swings a steel hull block down toward the row on the dock while the tiny workers move below, dust drifts in the sunlight, the scaffolding and the sea stay still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the steel scaffolding and cranes, the bare ground, the finished part of the dock with the first tanker hull blocks, the blue sky and sea
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the cranes and scaffolding stay still; the hull blocks stay in the same first row on the finished part of the dock; no company names, logos or text appear anywhere; the workers stay tiny and few.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: building two things at once.
```

---

## s13 — evidence (8초, 재연, 사용 4.0초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the bright clear-day shipyard completion ceremony in front of a giant tanker hull
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the official cuts the red ribbon with both hands and the officials behind him applaud, the flags flutter in the breeze, the giant hull behind stays completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the giant tanker hull behind, the red ribbon across the front, the row of officials in suits, and the plain flags
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the giant hull behind stays fixed with no text or logos; the scissors stay gripped in both hands at the red ribbon; the plain flags show no text; no extra people enter.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: proud completion.
```

---

## s15 — evidence (8초, 재연, 사용 6.6초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the warm-lit wooden tabletop still life with an old banknote, an envelope, a tanker model and a white hard hat
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the warm light slowly brightens across the four objects on the table and a soft shadow drifts over the wood, the banknote, envelope, tanker model and hard hat stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the old banknote with the plain turtle-ship pattern, the plain envelope, the plain tanker model, the white hard hat, and the wooden table
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the four objects stay in the same arrangement on the table for the whole clip; the banknote keeps only its plain turtle-ship pattern and the envelope stays plain with no text; no people or hands ever appear; only the warm light shifts.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: everyone together.
```

---

================================================================================
# 🟨 10초 티어 (s1, s2, s4, s7, s9, s12, s14, s16)
================================================================================

## s1 — hook (10초, 재연, 사용 8.3초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the dark wood-paneled 1971 British bank meeting room with a grey London view
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the man slowly breathes and lifts the banknote a little higher with both hands while looking straight ahead, the table props stay completely still, the window light stays steady

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the long mahogany table, the leather chairs, the large window with the grey sky and old stone buildings, the brass lamp, and the dark green carpet
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the banknote stays held in both hands with only its plain turtle-ship pattern and never gains text or numbers; the black-and-white photo and the rolled blueprint stay lying on the table at the same spot; his short slicked-back black hair and dark navy suit never change; nobody else appears.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: quiet determination.
```

---

## s2 — evidence (10초, 재연, 사용 7.3초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the dark wood-paneled 1971 British bank meeting room with a grey London view
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the Korean man slowly pushes the folder forward with both hands and the banker takes it with both hands and gives a small serious nod, the lamp light and the window stay steady

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the long mahogany table, the leather chairs, the large window with the grey sky and old stone buildings, the brass lamp, and the dark green carpet
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the thick folder stays held by both men's hands between them and its cover stays plain with no text; the brass lamp, the window and the leather chairs stay fixed; both men keep the same clothes and nobody else enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: a big request.
```

---

## s4 — evidence (10초, 재연, 사용 7.1초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the warm 1970s British ship-consultancy chairman's office with ship models on the shelves
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the old chairman slowly shakes his head and spreads one hand palm up in doubt while the Korean man speaks earnestly with the folder on his knees, the ship models and the window stay still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the large wooden desk, the green leather chair, the shelf of plain ship models, the window with the river and dock cranes, the typewriter, the brass lamp, and the dark brown carpet
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the ship models on the shelf stay fixed with no text; the folder stays on the Korean man's knees under both hands; the old chairman keeps his white hair, gold glasses and brown tweed jacket; nobody else enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: polite doubt.
```

---

## s7 — evidence (10초, 재연, 사용 9.3초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the high-ceilinged 1970s British government office with filing cabinets
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the official slowly shakes his head while holding the stamp above the blank form, the Korean man listens with a serious nod, the green lamp light stays steady

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the large wooden desk with the green lamp and the stamp pad, the steel filing cabinets, the tall window with heavy curtains, and the dark gray carpet
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the stamp stays gripped in both hands hovering above the blank form and never presses down; the form shows only plain empty boxes with no text; the green lamp, the stamp pad and the filing cabinets stay fixed; nobody else enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: bureaucratic caution.
```

---

## s9 — evidence (10초, 재연, 사용 8.6초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the warm 1970s shipowner's office with tanker models on a round table and a harbor view
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the two men shake hands firmly and the Greek shipowner laughs warmly while the Korean man gives a relieved smile, the tanker models and the window stay still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the round wooden table with the two plain tanker models, the shelf of small ship models, the large window with the sea and harbor, and the light beige carpet
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the two tanker models stay side by side on the table with no text; the handshake stays firm between the two men for the whole clip; the shelf of ship models and the harbor window stay fixed; nobody else enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: a deal at last.
```

---

## s12 — evidence (10초, 재연, 사용 8.4초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the inside a rising steel tanker hull on a half-finished dock with welding sparks
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the two welders hold their torches against the steel plate and orange sparks fly in a steady shower, the dust glints in the sunlight, the plates and the cranes behind stay still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the giant steel hull plates, the unfinished dock edge, the cranes behind, and the sunlit dust
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): both welders keep their masks on for the whole clip so no face is visible; the steel plates keep plain surfaces with no text or marks; the unfinished dock edge and the cranes behind stay fixed; no extra workers enter.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: relentless work.
```

---

## s14 — evidence (10초, 재연, 사용 7.1초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the golden-hour aerial view of a huge modern shipyard with rows of giant ships and gantry cranes
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the golden light slowly shifts across the rows of giant ships and the sea shimmers, a few birds cross the orange sky, the ships and the cranes stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the rows of giant ships in the docks, the tall gantry cranes, the sea, and the orange sky
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the rows of giant ships and the gantry cranes stay in the same arrangement for the whole clip; no people, flags, logos or text ever appear; only the light and the sea shimmer move.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: grand achievement.
```

---

## s16 — save (10초, 말함, 사용 7.9초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl character's design and the bright shipyard office lobby with a glass wall onto a dock with a giant tanker hull
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held No props held.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.2s to 7.8s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 7.8s to the very last frame (2.2 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 7.8s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 7.8s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the large glass wall with the tanker hull and crane silhouettes, the plain tanker model on the glass display, the smooth light gray stone floor, and the warm afternoon light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the tanker model on the display keeps its plain shape with no text; the glass wall and the dock silhouettes stay fixed; the sunglasses stay on top of the head; no props are held.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking, voice or lip movement after 7.8s, no camera zoom, crop, or framing drift at any point.

MOOD: warm summary and invitation to follow.
```

---

