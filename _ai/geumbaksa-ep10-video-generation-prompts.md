# 금박사 10편(실업급여 최저액 계산법) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/geumbaksa-ep10-images/`
영상 저장 폴더(신규 생성): `C:/tmp/geumbaksa-ep10-videos/`

**씬 길이 티어는 8초/10초 2단계로만 요청한다(9초 티어 금지,
[[feedback_video_scene_length_tier_smooth_transition]]).** TTS 실측 결과
전 씬 8초 미만이므로 전부 **8초 티어**로 요청한다.

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 실측 발화 | 요청 티어 | 예상 여유 |
|---|---|---|---|---|---|
| s1 opening | `geumbaksa_ep10_s1.png` | `ep10_s1_video.mp4` | 5.13초 | **8초** | 2.87초 |
| s2 hook | `geumbaksa_ep10_s2.png` | `ep10_s2_video.mp4` | 4.77초 | **8초** | 3.23초 |
| s3 formula | `geumbaksa_ep10_s3.png` | `ep10_s3_video.mp4` | 4.97초 | **8초** | 3.03초 |
| s4 calculation(condition) | `geumbaksa_ep10_s4.png` | `ep10_s4_video.mp4` | 4.90초 | **8초** | 3.10초 |
| s5 twist | `geumbaksa_ep10_s5.png` | `ep10_s5_video.mp4` | 3.54초 | **8초** | 4.46초 |
| s6 reason(situation) | `geumbaksa_ep10_s6.png` | `ep10_s6_video.mp4` | 4.96초 | **8초** | 3.04초 |
| s7 reassurance(reality_check) | `geumbaksa_ep10_s7.png` | `ep10_s7_video.mp4` | 5.16초 | **8초** | 2.84초 |
| s8 reassurance_continued(summary) | `geumbaksa_ep10_s8.png` | `ep10_s8_video.mp4` | 4.92초 | **8초** | 3.08초 |
| s9 closing_action | `geumbaksa_ep10_s9.png` | `ep10_s9_video.mp4` | 4.67초 | **8초** | 3.33초 |

★ 영상 생성 절대규칙(87씬 전수조사 확정, `_ai/CURRENT_STANDARDS.md` §0) 반영:
- 이미지 생성 단계에서 이미 검증된 소품 그립(양손 감싸 쥠, 바닥 거치)을 그대로 유지한다.
- **동작은 소품을 안 든 빈 쪽에만 배정한다.** 소품을 든 팔은 고정("holds steadily")만 지시한다.
- 카드/보드를 "들었다 놨다", "이동" 시키는 지시는 금지 — 프롬프트를 과도하게 강화(FROZEN PROP,
  pixel-perfect 등)해도 텍스트 깨짐을 막지 못한다는 게 이미 확인됐다
  ([[feedback_video_prompt_text_preservation_must_verify]]). 텍스트 보존은 **이미지 생성 단계**에서
  이미 끝난 일이고, 영상 프롬프트는 표준 5요소(스타일 유지·동작 디테일·정지 요소·부정 프롬프트·
  입 움직임 필수)만 담백하게 지킨다.
- 나레이션이 있는 영상이므로 "Silent" 문구는 절대 넣지 않는다.

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작 프레임뿐 아니라 클립 중반·후반
프레임에서도 텍스트·소품·동작 지속 여부, 카메라 줌/크롭, 소품 기울어짐을 확인한다.

================================================================================
# 🟨 8초 티어 (전체 s1~s9)
================================================================================

---

## s1 — opening (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the unemployment insurance
consultation desk background exactly as shown in the reference image — same
"실업급여 안내" poster, same calculator and clipboard props, same warm
lighting. Do not change any colors, text, or object positions.

CAMERA LOCK: the camera is static for the entire 8 seconds — no zoom, no
dolly, no framing drift.

MOTION DETAIL: the character waves one hand in a friendly greeting gesture,
the other hand resting naturally, warm bright smile throughout.

CONTINUOUS MOTION: natural eye blinks every 2-3 seconds, subtle head tilts,
continuous mouth movement while speaking for the entire clip, including the
final 1-2 seconds.

STATIC ELEMENTS: the poster, calculator, clipboard, and background props
stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped or flickering surfaces, no regenerated or
reinterpreted signage text, no background changes, no character redesign,
no abrupt cut or freeze mid-motion, no closed-mouth talking, no frozen
expression while speaking, no full-body freeze at any point, no camera zoom
or framing drift at any point including the last second.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if brightly
introducing itself and today's topic — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep10-videos/ep10_s1_video.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카메라 줌/크롭 여부 포함
3. 문제 없으면 다음 씬 진행

---

## s2 — hook (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the unemployment insurance
consultation desk background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

CAMERA LOCK: the camera is static for the entire 8 seconds — no zoom, no
dolly, no framing drift.

PROP LOCK: the character holds a card reading "마냥 좋은 일?" with an
upward arrow icon steadily with both hands at chest height for the entire
clip — the card does not tilt, rotate, rise, lower, or drift at any point.

MOTION DETAIL: the character's expression is curious and puzzled, head
tilted slightly, wide eyes, mouth moving as if posing a question.

CONTINUOUS MOTION: natural eye blinks every 2-3 seconds, subtle head tilts,
continuous mouth movement while speaking for the entire clip, including the
final 1-2 seconds.

STATIC ELEMENTS: the poster, calculator, clipboard, and card text stay
completely fixed — no camera pan or zoom, no card movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped or flickering surfaces, no regenerated or
reinterpreted card text, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no closed-mouth talking, no frozen
expression while speaking, no card drift or rotation, no camera zoom or
framing drift at any point including the last second.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip — never static,
never barely-moving, never closed-mouth talking, never frozen even in the
final seconds.
```

## 완료 후 절차
1. 저장: `C:/tmp/geumbaksa-ep10-videos/ep10_s2_video.mp4`
2. 프레임 검수 후 다음 씬 진행

---

## s3 — formula (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the unemployment insurance
consultation desk background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

CAMERA LOCK: the camera is static for the entire 8 seconds — no zoom, no
dolly, no framing drift.

PROP LOCK: the character holds a card reading "최저임금 × 80% × 8시간"
steadily with both hands at chest height for the entire clip — the card
does not tilt, rotate, rise, lower, or drift at any point.

MOTION DETAIL: the character's expression is calm and explanatory, as if
walking through a formula step by step, mouth moving naturally.

CONTINUOUS MOTION: natural eye blinks every 2-3 seconds, subtle head tilts,
continuous mouth movement while speaking for the entire clip, including the
final 1-2 seconds.

STATIC ELEMENTS: the poster, calculator, clipboard, and card text stay
completely fixed — no camera pan or zoom, no card movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped or flickering surfaces, no regenerated or
reinterpreted card text, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no closed-mouth talking, no frozen
expression while speaking, no card drift or rotation, no camera zoom or
framing drift at any point including the last second.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip — never static,
never barely-moving, never closed-mouth talking, never frozen even in the
final seconds.
```

## 완료 후 절차
1. 저장: `C:/tmp/geumbaksa-ep10-videos/ep10_s3_video.mp4`
2. 프레임 검수 후 다음 씬 진행

---

## s4 — calculation (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the unemployment insurance
consultation desk background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

CAMERA LOCK: the camera is static for the entire 8 seconds — no zoom, no
dolly, no framing drift.

PROP LOCK: the character holds a card reading "하루 68,480원" with a coin
stack icon steadily with both hands at chest height for the entire clip —
the card does not tilt, rotate, rise, lower, or drift at any point.

MOTION DETAIL: the character's expression is confident and clear, nodding
slightly as if confirming a definite number, mouth moving naturally.

CONTINUOUS MOTION: natural eye blinks every 2-3 seconds, subtle head tilts,
continuous mouth movement while speaking for the entire clip, including the
final 1-2 seconds.

STATIC ELEMENTS: the poster, calculator, clipboard, and card text stay
completely fixed — no camera pan or zoom, no card movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped or flickering surfaces, no regenerated or
reinterpreted card text, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no closed-mouth talking, no frozen
expression while speaking, no card drift or rotation, no camera zoom or
framing drift at any point including the last second.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip — never static,
never barely-moving, never closed-mouth talking, never frozen even in the
final seconds.
```

## 완료 후 절차
1. 저장: `C:/tmp/geumbaksa-ep10-videos/ep10_s4_video.mp4`
2. 프레임 검수 후 다음 씬 진행

---

## s5 — twist (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the unemployment insurance
consultation desk background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

CAMERA LOCK: the camera is static for the entire 8 seconds — no zoom, no
dolly, no framing drift.

PROP LOCK: the character holds a card reading "통장은 오히려 줄어든다?" with
a downward arrow icon steadily with both hands at chest height for the
entire clip — the card does not tilt, rotate, rise, lower, or drift at any
point.

MOTION DETAIL: the character's expression is surprised, eyebrows raised,
mouth open in mild shock, as if revealing an unexpected twist.

CONTINUOUS MOTION: natural eye blinks every 2-3 seconds, subtle head tilts,
continuous mouth movement while speaking for the entire clip, including the
final 1-2 seconds.

STATIC ELEMENTS: the poster, calculator, clipboard, and card text stay
completely fixed — no camera pan or zoom, no card movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped or flickering surfaces, no regenerated or
reinterpreted card text, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no closed-mouth talking, no frozen
expression while speaking, no card drift or rotation, no camera zoom or
framing drift at any point including the last second.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip — never static,
never barely-moving, never closed-mouth talking, never frozen even in the
final seconds.
```

## 완료 후 절차
1. 저장: `C:/tmp/geumbaksa-ep10-videos/ep10_s5_video.mp4`
2. 프레임 검수 후 다음 씬 진행

---

## s6 — reason (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the unemployment insurance
consultation desk background exactly as shown in the reference image,
including the floor-standing easel board reading "주 7일 → 주 6일". Do not
change any colors, text, or object positions.

CAMERA LOCK: the camera is static for the entire 8 seconds — no zoom, no
dolly, no framing drift.

MOTION DETAIL: the character stands beside the floor-standing board and
raises one hand gently toward it in an explaining gesture — the hand does
not touch or move the board, it only gestures near it. The other hand
rests naturally.

CONTINUOUS MOTION: natural eye blinks every 2-3 seconds, subtle head tilts,
continuous mouth movement while speaking for the entire clip, including the
final 1-2 seconds.

STATIC ELEMENTS: the board (including its text and arrow), poster,
calculator, and clipboard stay completely fixed — no camera pan or zoom, no
board movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped or flickering surfaces, no regenerated or
reinterpreted board text, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no closed-mouth talking, no frozen
expression while speaking, no board drift or rotation, no camera zoom or
framing drift at any point including the last second.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip — never static,
never barely-moving, never closed-mouth talking, never frozen even in the
final seconds.
```

## 완료 후 절차
1. 저장: `C:/tmp/geumbaksa-ep10-videos/ep10_s6_video.mp4`
2. 프레임 검수 후 다음 씬 진행

---

## s7 — reassurance (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the unemployment insurance
consultation desk background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

CAMERA LOCK: the camera is static for the entire 8 seconds — no zoom, no
dolly, no framing drift.

PROP LOCK: the character holds a card reading "198만원 → 176만원" steadily
with both hands at chest height for the entire clip — the card does not
tilt, rotate, rise, lower, or drift at any point.

MOTION DETAIL: the character's expression is serious and focused, as if
carefully explaining a consequence, mouth moving naturally.

CONTINUOUS MOTION: natural eye blinks every 2-3 seconds, subtle head tilts,
continuous mouth movement while speaking for the entire clip, including the
final 1-2 seconds.

STATIC ELEMENTS: the poster, calculator, clipboard, and card text stay
completely fixed — no camera pan or zoom, no card movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped or flickering surfaces, no regenerated or
reinterpreted card text, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no closed-mouth talking, no frozen
expression while speaking, no card drift or rotation, no camera zoom or
framing drift at any point including the last second.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip — never static,
never barely-moving, never closed-mouth talking, never frozen even in the
final seconds.
```

## 완료 후 절차
1. 저장: `C:/tmp/geumbaksa-ep10-videos/ep10_s7_video.mp4`
2. 프레임 검수 후 다음 씬 진행

---

## s8 — reassurance_continued (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the unemployment insurance
consultation desk background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

CAMERA LOCK: the camera is static for the entire 8 seconds — no zoom, no
dolly, no framing drift.

PROP LOCK: the character holds a card reading "총액은 그대로 990만원" with a
checkmark icon steadily with both hands at chest height for the entire
clip — the card does not tilt, rotate, rise, lower, or drift at any point.

MOTION DETAIL: the character's expression is warm and reassuring, bright
smile, as if putting the viewer's mind at ease.

CONTINUOUS MOTION: natural eye blinks every 2-3 seconds, subtle head tilts,
continuous mouth movement while speaking for the entire clip, including the
final 1-2 seconds.

STATIC ELEMENTS: the poster, calculator, clipboard, and card text stay
completely fixed — no camera pan or zoom, no card movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped or flickering surfaces, no regenerated or
reinterpreted card text, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no closed-mouth talking, no frozen
expression while speaking, no card drift or rotation, no camera zoom or
framing drift at any point including the last second.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip — never static,
never barely-moving, never closed-mouth talking, never frozen even in the
final seconds.
```

## 완료 후 절차
1. 저장: `C:/tmp/geumbaksa-ep10-videos/ep10_s8_video.mp4`
2. 프레임 검수 후 다음 씬 진행

---

## s9 — closing_action (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the unemployment insurance
consultation desk background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

CAMERA LOCK: the camera is static for the entire 8 seconds — no zoom, no
dolly, no framing drift.

PROP LOCK: the character holds a smartphone card reading "실업급여 모의계산"
with a checkmark icon steadily with one hand at chest height for the entire
clip — the card does not tilt, rotate, rise, lower, or drift at any point.

MOTION DETAIL: the character's free hand gestures warmly outward as if
inviting the viewer to check for themselves, warm closing smile.

CONTINUOUS MOTION: natural eye blinks every 2-3 seconds, subtle head tilts,
continuous mouth movement while speaking for the entire clip, including the
final 1-2 seconds.

STATIC ELEMENTS: the poster, calculator, clipboard, and card text stay
completely fixed — no camera pan or zoom, no card movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped or flickering surfaces, no regenerated or
reinterpreted card text, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no closed-mouth talking, no frozen
expression while speaking, no card drift or rotation, no camera zoom or
framing drift at any point including the last second.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
wrapping up the episode — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 저장: `C:/tmp/geumbaksa-ep10-videos/ep10_s9_video.mp4`
2. 프레임 검수 후 조립 단계(`run-owl-assemble-shorts-v2.mjs`)로 진행
