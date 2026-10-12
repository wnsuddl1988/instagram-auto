# 스토리형 9편 (하나로통신 — 값이 비싸도 먼저 쓴 ADSL, 15장면) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/story-ep9-images/`
영상 저장: **장면 번호로** `C:/Users/PC/Downloads/1.mp4` ~ `15.mp4` (스토리형 9편이라고 알려주기)

생성기: `scripts/build-story-video-generation-prompts.mjs` (TTS: `C:/tmp/money-shorts-os/story-ep9-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json`, 최종 타임라인 78.26초 — 편마다 확정한 템포 기준)

**스토리형 재연 장면 규칙:** 15번 외에는 말하는 인물이 없다(말·입 움직임 전부 금지, 카메라 고정, 인물·사물 동작만). 사용 길이가 7초 이하면 8초 클립, 넘으면 10초 클립(조립 때 장면 길이에 맞춰 자른다). Gemini(Veo)로 배정하는 장면은 길이와 무관하게 항상 10초.
**이 편은 모든 장면에서 화면에 글자·숫자·로고가 없어야 한다**, **영상에 새 간판·숫자·로고가 생기면 반려**.
**얼굴 안전 구간(Owner 2026-10-07):** 영상 위 제목이 세로 18~37%에 계속 떠 있으므로, 영상 생성 결과에서도 인물 얼굴이 위쪽(세로 40% 위)으로 올라오거나 카메라가 움직여 얼굴이 위로 이동하면 반려한다(이미지 구도 그대로 유지).

| 장면 | 이미지 | 저장할 영상 파일명 | 사용 길이 | 티어 | 샷 / 배경 | 형태 |
|---|---|---|---|---|---|---|
| s1 hook | `story_ep9_s1.png` | `story_ep9_s1_hook_motion.mp4` | 5.88초 | **8초** | medium / A | 재연(말 없음) |
| s2 why | `story_ep9_s2.png` | `story_ep9_s2_why_motion.mp4` | 3.02초 | **8초** | close / B | 재연(말 없음) |
| s3 company | `story_ep9_s3.png` | `story_ep9_s3_company_motion.mp4` | 2.70초 | **8초** | wide / C | 재연(말 없음) |
| s4 landline | `story_ep9_s4.png` | `story_ep9_s4_landline_motion.mp4` | 2.55초 | **8초** | close / D | 재연(말 없음) |
| s5 scout | `story_ep9_s5.png` | `story_ep9_s5_scout_motion.mp4` | 3.82초 | **8초** | wide / E | 재연(말 없음) |
| s6 adsl | `story_ep9_s6.png` | `story_ep9_s6_adsl_motion.mp4` | 4.27초 | **8초** | close / F | 재연(말 없음) |
| s7 modem | `story_ep9_s7.png` | `story_ep9_s7_modem_motion.mp4` | 8.20초 | **10초** | close / G | 재연(말 없음) |
| s8 bet | `story_ep9_s8.png` | `story_ep9_s8_bet_motion.mp4` | 7.42초 | **10초** | medium / H | 재연(말 없음) |
| s9 launch | `story_ep9_s9.png` | `story_ep9_s9_launch_motion.mp4` | 6.76초 | **8초** | wide / I | 재연(말 없음) |
| s10 queue | `story_ep9_s10.png` | `story_ep9_s10_queue_motion.mp4` | 5.66초 | **8초** | medium / J | 재연(말 없음) |
| s11 shortage | `story_ep9_s11.png` | `story_ep9_s11_shortage_motion.mp4` | 5.06초 | **8초** | close / K | 재연(말 없음) |
| s12 kt_supply | `story_ep9_s12.png` | `story_ep9_s12_kt_supply_motion.mp4` | 7.08초 | **10초** | wide / L | 재연(말 없음) |
| s13 ten_million | `story_ep9_s13.png` | `story_ep9_s13_ten_million_motion.mp4` | 3.51초 | **8초** | wide / M | 재연(말 없음) |
| s14 oecd | `story_ep9_s14.png` | `story_ep9_s14_oecd_motion.mp4` | 3.49초 | **8초** | medium / N | 재연(말 없음) |
| s15 close | `story_ep9_s15.png` | `story_ep9_s15_close_motion.mp4` | 8.84초 | **10초** | medium / O | 말함(부엉박사) |

★ 영상 생성 절대규칙(`_ai/CURRENT_STANDARDS.md` §0-1): 나레이션 영상이라 "Silent" 단어 금지, "glued" 같은 신체 접착 표현 금지. **장면을 몰아서 생성하지 말고 하나씩 즉시 검수** — 시작·중반·끝 프레임의 인물·소품·글자를 확인한다.

================================================================================
# 🟦 8초 티어 (s1, s2, s3, s4, s5, s6, s9, s10, s11, s13, s14)
================================================================================

## s1 — hook (8초, 재연, 사용 5.9초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the 1999 Korean meeting room with a small gray modem box at the center of a long table, suited people seen from behind and the side looking down at it, a stack of plain bills beside it
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: one of the suited people leans slightly forward to study the modem box and another folds his arms, the table and the window stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the long table, the small gray modem box, the stack of plain bills, the suited people seen from behind, and the daytime city window
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the people stay seen from behind or the side with no face ever shown; the modem box and the stack of bills stay fixed on the table; the box keeps no text or logos; nobody else enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: a costly device.
```

---

## s2 — evidence (8초, 재연, 사용 3.0초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the close view of one hand carefully lifting a small gray modem box above a desk with a stack of plain bills under a warm lamp
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the hand lifts the modem box a little, turns it over once and sets it down again, the lamp light stays steady, the desk stays completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the desk, the stack of plain bills, and the warm lamp light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no face or body ever appears — only the one hand; the modem box keeps no text or logos; the stack of bills and the lamp stay fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: a hesitant question.
```

---

## s3 — evidence (8초, 재연, 사용 2.7초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the 1997 small new telecom company office wide view with new desks and rows of phones and a few tiny staff working, a glass door with a blank frosted sticker, bright morning light
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: a few tiny staff pick up phones and write at their desks while the morning light brightens, the desks and the door stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the new desks, the rows of phones, the glass door with the blank sticker, and the bright morning light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the desks and phones stay in the same arrangement; the staff stay tiny and seen from behind with no face shown; the glass door keeps only a blank frosted sticker; nobody large enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: a new company opens.
```

---

## s4 — evidence (8초, 재연, 사용 2.6초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the a desk with an old landline phone and a plain two-bar chart, one bar very tall and one very short, a suited hand touching the short bar
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the hand taps the short bar twice and then rests beside it, the afternoon light stays steady, the phone and the chart stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the old landline phone, the plain two-bar chart, the desk, and the calm afternoon light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no face or body appears — only the one hand and the suit sleeve; the chart keeps only two plain bars with no text or numbers; the phone and the desk stay fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: not enough.
```

---

## s5 — evidence (8초, 재연, 사용 3.8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the airport departure hall with suited people carrying briefcases split into two groups walking away toward different gates seen from behind, a plane outside the big window
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the two groups walk away in different directions with their briefcases and the plane outside slowly taxis, the hall and the window stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the departure hall, the gate lights without text, the big window with the plane, and the polished floor
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the people stay seen from behind with no face ever shown; the gates keep only light patterns with no text; the big window and the plane stay fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: scouting abroad.
```

---

## s6 — evidence (8초, 재연, 사용 4.3초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the late 1990s Korean living room desk with a thick CRT monitor and a hand plugging a phone cable into a small gray modem box, monitor showing only a pale blue glow
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the hand pushes the phone cable into the modem until it clicks and the monitor glow brightens a little, the desk and the monitor stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the thick CRT monitor with the pale blue glow, the computer case, the desk, and the warm evening light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): no face or body appears — only the one hand; the monitor keeps only a pale blue glow with no text; the modem box keeps no text or logos; the desk stays fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: the choice is made.
```

---

## s9 — evidence (8초, 재연, 사용 6.8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the 1999 Korean apartment complex at dusk with identical apartment blocks and a technician in work clothes on a ladder seen from behind connecting cables at a utility box, a few windows lighting up
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the technician connects the last cable and a few more apartment windows light up one by one, the blocks and the ladder stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the row of identical apartment blocks, the utility box, the ladder, and the dusk sky
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the technician stays seen from behind with no face shown; the apartment blocks keep the same arrangement with no signs or text; the utility box and the ladder stay fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: the service begins.
```

---

## s10 — evidence (8초, 재연, 사용 5.7초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the telecom service counter with a long line of people seen from behind holding paper application forms, an almost empty shelf behind the counter
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the line shuffles forward one step and people shift their application forms in their hands, the counter and the shelf stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the service counter, the almost empty shelf behind it, the long queue seen from behind, and the bright indoor light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the people stay seen from behind with no face ever shown; the forms keep only plain lines with no text; the almost empty shelf and the counter stay fixed.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: a crowd waiting.
```

---

## s11 — core_question (8초, 재연, 사용 5.1초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the warehouse shelf almost empty with one or two small gray modem boxes left and big piles of plain application forms stacked in front
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the fluorescent light flickers once and settles on the last modem boxes and the tall piles of forms, everything on the shelf stays completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the almost empty shelf, the last gray modem boxes, the piles of plain application forms, and the fluorescent light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the shelf, the last modem boxes and the piles of forms stay in the same arrangement with no text or logos; no people or hands ever appear; only the light flickers.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: more demand than supply.
```

---

## s13 — evidence (8초, 재연, 사용 3.5초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the wide night view of a Korean apartment complex with countless windows glowing with bluish monitor light, quiet roads between the blocks
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: more apartment windows glow with the bluish light one after another across the blocks, the buildings and the sky stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the apartment blocks, the countless lit windows, the quiet roads, and the deep navy night sky
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the apartment blocks keep the same arrangement with no signs or text; no people appear; only the window lights change.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: millions online.
```

---

## s14 — evidence (8초, 재연, 사용 3.5초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the large dark exhibition wall world map with only continent outlines and no text, one small peninsula in East Asia glowing bright gold, an empty podium in front
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the golden glow on the small peninsula pulses gently and brightens, the rest of the map and the podium stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 8
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the dark world map wall, the glowing peninsula, the empty podium, and the dim hall
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the map keeps only continent outlines with no text or labels; only the one small peninsula glows; the empty podium stays fixed; no people appear.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: first place.
```

---

================================================================================
# 🟨 10초 티어 (s7, s8, s12, s15)
================================================================================

## s7 — core_question (10초, 재연, 사용 8.2초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the bright desk close view of one small gray modem box on a tall stack of plain bills with a few more identical modem boxes lined up beside it
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: a soft warm light slides slowly across the row of boxes and pauses on the one resting on the tall stack, the boxes and the bills stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the tall stack of plain bills, the row of gray modem boxes, the desk, and the warm light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the modem boxes and the stack of bills stay in the same arrangement with no text or logos; no people or hands ever appear; only the warm light shifts.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: a heavy cost.
```

---

## s8 — evidence (10초, 재연, 사용 7.4초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the meeting room whiteboard with a thick downward-sloping curve and no text, a suited person seen from behind pointing at it while executives with folded arms sit at the table seen from behind
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the standing person traces the downward curve with a marker and the seated executives shift slightly, the board and the table stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the whiteboard with the downward curve, the meeting table, the executives seen from behind, and the daylight window
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the people stay seen from behind with no face ever shown; the whiteboard keeps only the plain downward curve with no text or numbers; the table and the window stay fixed; nobody else enters.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: persuading with a bet.
```

---

## s12 — evidence (10초, 재연, 사용 7.1초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting) and the wide logistics warehouse floor with two pallets of plain gray modem boxes side by side, the left one low and the right one more than twice as tall, a forklift parked behind
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: a soft light sweeps from the low pallet up to the tall pallet and settles on the top, the pallets and the forklift stay completely still

NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the two pallets, the plain gray boxes, the parked forklift, and the warehouse floor
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the two pallets stay in the same arrangement with the right one much taller; the boxes keep no text or logos; no people appear; the forklift stays parked.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking or lip movement, no camera zoom, crop, or framing drift at any point.

MOOD: supply doubled.
```

---

## s15 — save (10초, 말함, 사용 8.8초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl character's design and the dusk walkway in front of a Korean apartment complex with two or three identical apartment blocks with windows starting to light up and a plain utility pole beside the path
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held No props held.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.2s to 8.7s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 8.7s to the very last frame (1.3 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 8.7s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 8.7s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE 10
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: the identical apartment blocks, the lit windows, the plain utility pole, the smooth light gray pavement, and the warm evening light
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.

SCENE LOCK (HIGHEST PRIORITY): the apartment blocks and the utility pole stay fixed; the sunglasses stay on top of the head; no props are held.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described, no talking, voice or lip movement after 8.7s, no camera zoom, crop, or framing drift at any point.

MOOD: warm summary and invitation to follow.
```

---

