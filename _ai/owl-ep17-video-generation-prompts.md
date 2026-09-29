# 부엉박사 17편(청약통장 종합저축 전환 기한 1년 연장) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/owl-ep17-images/`
영상 저장 폴더(신규 생성): `C:/tmp/owl-ep17-videos/`

**씬 길이 티어는 8초/10초 2단계로만 요청한다(9초 티어 금지,
[[feedback_video_scene_length_tier_smooth_transition]]).** Gemini Veo는 항상
10초 고정, Flow도 요청값과 다르게 나올 수 있어 "9초 영상"이 실무적으로
존재하지 않는다. 발화 8초 미만 → 8초 요청, 8초 이상 → 10초 요청.

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 실측 발화 | 요청 티어 | 예상 여유 |
|---|---|---|---|---|---|
| s1 opening | `owl_ep17_s1_opening.png` | `owl_ep17_s1_opening_motion.mp4` | 5.72초 | **8초** | 2.28초 |
| s2 hook | `owl_ep17_s2_hook.png` | `owl_ep17_s2_hook_motion.mp4` | 5.16초 | **8초** | 2.84초 |
| s3 fact | `owl_ep17_s3_fact.png` | `owl_ep17_s3_fact_motion.mp4` | 8.82초 | **10초** | 1.18초 |
| s4 definition | `owl_ep17_s4_definition.png` | `owl_ep17_s4_definition_motion.mp4` | 5.30초 | **8초** | 2.70초 |
| s5 definition | `owl_ep17_s5_definition.png` | `owl_ep17_s5_definition_motion.mp4` | 4.69초 | **8초** | 3.31초 |
| s6 condition | `owl_ep17_s6_condition.png` | `owl_ep17_s6_condition_motion.mp4` | 6.90초 | **8초** | 1.10초 |
| s7 evidence | `owl_ep17_s7_evidence.png` | `owl_ep17_s7_evidence_motion.mp4` | 5.31초 | **8초** | 2.69초 |
| s8 evidence | `owl_ep17_s8_evidence.png` | `owl_ep17_s8_evidence_motion.mp4` | 5.83초 | **8초** | 2.17초 |
| s9 condition | `owl_ep17_s9_condition.png` | `owl_ep17_s9_condition_motion.mp4` | 4.67초 | **8초** | 3.33초 |
| s10 action | `owl_ep17_s10_action.png` | `owl_ep17_s10_action_motion.mp4` | 5.40초 | **8초** | 2.60초 |

★ 영상 생성 절대규칙(87씬 전수조사 확정, `_ai/CURRENT_STANDARDS.md` §0) 반영:
- 이미지 생성 단계에서 이미 검증된 소품 그립(날개로 감싸 쥠, 바닥 거치)을 그대로 유지한다.
- **동작은 소품을 안 든 빈 쪽(반대쪽 날개)에만 배정한다.** 소품을 든 날개는 고정("holds
  steadily")만 지시한다.
- 카드/보드를 "들었다 놨다", "이동" 시키는 지시는 금지 — 프롬프트를 과도하게 강화(FROZEN PROP,
  pixel-perfect 등)해도 텍스트 깨짐을 막지 못한다는 게 이미 확인됐다
  ([[feedback_video_prompt_text_preservation_must_verify]]). 텍스트 보존은 **이미지 생성 단계**에서
  이미 끝난 일이고, 영상 프롬프트는 표준 5요소(스타일 유지·동작 디테일·정지 요소·부정 프롬프트·
  입 움직임 필수)만 담백하게 지킨다.
- 나레이션이 있는 영상이므로 "Silent" 문구는 절대 넣지 않는다.

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작 프레임뿐 아니라 클립 중반·후반
프레임에서도 텍스트·소품·동작 지속 여부, 카메라 줌/크롭, 소품 기울어짐을 확인한다.

================================================================================
# 🟨 8초 티어 (s1, s2, s4, s5, s6, s7, s8, s9, s10)
================================================================================

---

## s1 — opening (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the housing subscription consultation
desk background exactly as shown in the reference image — same "청약통장
안내" poster, same apartment complex model and clipboard props, same warm
lighting. Do not change any colors, text, or object positions.

CAMERA LOCK: the camera is static for the entire 8 seconds — no zoom, no
dolly, no framing drift.

MOTION DETAIL: the character raises one wing slightly in a confident,
friendly greeting gesture, sharp but trustworthy expression, not smiling
broadly.

CONTINUOUS MOTION: natural eye blinks every 2-3 seconds, subtle head tilts,
continuous beak/mouth movement while speaking for the entire clip, including
the final 1-2 seconds.

STATIC ELEMENTS: the poster, apartment model, clipboard, and background
props stay completely fixed — no camera pan or zoom, no background object
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/feathers, no warped or flickering surfaces, no
regenerated or reinterpreted signage text, no background changes, no
character redesign, no abrupt cut or freeze mid-motion, no closed-mouth
talking, no frozen expression while speaking, no full-body freeze at any
point, no camera zoom or framing drift at any point including the last
second.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if confidently introducing
itself and today's topic — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep17-videos/owl_ep17_s1_opening_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카메라 줌/크롭 여부 포함
3. 문제 없으면 다음 씬 진행

---

## s2 — hook (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the housing subscription consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK: the camera is static for the entire 8 seconds — no zoom, no
dolly, no framing drift.

PROP LOCK: the character holds a card reading "이번 주 안에 확인!" with an
exclamation icon steadily with one wing at chest height for the entire
clip — the card does not tilt, rotate, rise, lower, or drift at any point.

MOTION DETAIL: the other wing gestures slightly outward with mild urgency,
sharp but kind expression, as if warning the viewer not to miss this.

CONTINUOUS MOTION: natural eye blinks every 2-3 seconds, subtle head tilts,
continuous beak movement while speaking for the entire clip, including the
final 1-2 seconds.

STATIC ELEMENTS: the poster, apartment model, clipboard, and card text stay
completely fixed — no camera pan or zoom, no card movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/feathers, no warped or flickering surfaces, no
regenerated or reinterpreted card text, no background changes, no character
redesign, no abrupt cut or freeze mid-motion, no closed-mouth talking, no
frozen expression while speaking, no card drift or rotation, no camera zoom
or framing drift at any point including the last second.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 저장: `C:/tmp/owl-ep17-videos/owl_ep17_s2_hook_motion.mp4`
2. 프레임 검수 후 다음 씬 진행

---

================================================================================
# 🟦 10초 티어 (s3)
================================================================================

---

## s3 — fact (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the housing subscription consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK: the camera is static for the entire 10 seconds — no zoom, no
dolly, no framing drift.

PROP LOCK: the character holds a card reading "전환기한 1년 연장" with a
calendar icon steadily with one wing at chest height for the entire clip —
the card does not tilt, rotate, rise, lower, or drift at any point.

MOTION DETAIL: the other wing gestures calmly as if explaining an official
announcement, composed and serious expression.

CONTINUOUS MOTION: natural eye blinks every 2-3 seconds, subtle head tilts,
continuous beak movement while speaking for the entire clip, including the
final 1-2 seconds — this clip is longer than usual, so motion must remain
visible through the full 10 seconds without a mid-clip freeze.

STATIC ELEMENTS: the poster, apartment model, clipboard, and card text stay
completely fixed — no camera pan or zoom, no card movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/feathers, no warped or flickering surfaces, no
regenerated or reinterpreted card text, no background changes, no character
redesign, no abrupt cut or freeze mid-motion, no closed-mouth talking, no
frozen expression while speaking, no card drift or rotation, no camera zoom
or framing drift at any point including the last second, no static hold in
the middle of the clip.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire 10-second clip — never static,
never barely-moving, never closed-mouth talking, never frozen even in the
final seconds.
```

## 완료 후 절차
1. 저장: `C:/tmp/owl-ep17-videos/owl_ep17_s3_fact_motion.mp4`
2. 프레임 검수(특히 중반 5초 지점도 확인) 후 다음 씬 진행

---

================================================================================
# 🟨 8초 티어 (계속)
================================================================================

---

## s4 — definition (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the housing subscription consultation
desk background exactly as shown in the reference image, including the
floor-standing board reading "청약예금·부금 → 민영주택" and "청약저축 →
국민주택". Do not change any colors, text, or object positions.

CAMERA LOCK: the camera is static for the entire 8 seconds — no zoom, no
dolly, no framing drift.

MOTION DETAIL: the character stands beside the floor-standing board and
raises one wing gently toward it in an explaining gesture — the wing does
not touch or move the board, it only gestures near it. The other wing rests
naturally.

CONTINUOUS MOTION: natural eye blinks every 2-3 seconds, subtle head tilts,
continuous beak movement while speaking for the entire clip, including the
final 1-2 seconds.

STATIC ELEMENTS: the board (including its text and icons), poster, and
apartment model stay completely fixed — no camera pan or zoom, no board
movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/feathers, no warped or flickering surfaces, no
regenerated or reinterpreted board text, no background changes, no
character redesign, no abrupt cut or freeze mid-motion, no closed-mouth
talking, no frozen expression while speaking, no board drift or rotation,
no camera zoom or framing drift at any point including the last second.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 저장: `C:/tmp/owl-ep17-videos/owl_ep17_s4_definition_motion.mp4`
2. 프레임 검수 후 다음 씬 진행

---

## s5 — definition (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the housing subscription consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK: the camera is static for the entire 8 seconds — no zoom, no
dolly, no framing drift.

PROP LOCK: the character holds a card reading "국민주택 + 민영주택 둘 다
OK" with checkmark icons steadily with one wing at chest height for the
entire clip — the card does not tilt, rotate, rise, lower, or drift at any
point.

MOTION DETAIL: the other wing gestures brightly, warm reassuring
expression, as if confirming good news.

CONTINUOUS MOTION: natural eye blinks every 2-3 seconds, subtle head tilts,
continuous beak movement while speaking for the entire clip, including the
final 1-2 seconds.

STATIC ELEMENTS: the poster, apartment model, and card text stay completely
fixed — no camera pan or zoom, no card movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/feathers, no warped or flickering surfaces, no
regenerated or reinterpreted card text, no background changes, no character
redesign, no abrupt cut or freeze mid-motion, no closed-mouth talking, no
frozen expression while speaking, no card drift or rotation, no camera zoom
or framing drift at any point including the last second.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 저장: `C:/tmp/owl-ep17-videos/owl_ep17_s5_definition_motion.mp4`
2. 프레임 검수 후 다음 씬 진행

---

## s6 — condition (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the housing subscription consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK: the camera is static for the entire 8 seconds — no zoom, no
dolly, no framing drift.

PROP LOCK: the character holds a card reading "실적은 전환일부터 새로 시작"
with a warning icon steadily with one wing at chest height for the entire
clip — the card does not tilt, rotate, rise, lower, or drift at any point.

MOTION DETAIL: the other wing gestures with a cautionary tone, serious
expression, as if pointing out something the viewer should note carefully.

CONTINUOUS MOTION: natural eye blinks every 2-3 seconds, subtle head tilts,
continuous beak movement while speaking for the entire clip, including the
final 1-2 seconds.

STATIC ELEMENTS: the poster, apartment model, and card text stay completely
fixed — no camera pan or zoom, no card movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/feathers, no warped or flickering surfaces, no
regenerated or reinterpreted card text, no background changes, no character
redesign, no abrupt cut or freeze mid-motion, no closed-mouth talking, no
frozen expression while speaking, no card drift or rotation, no camera zoom
or framing drift at any point including the last second.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 저장: `C:/tmp/owl-ep17-videos/owl_ep17_s6_condition_motion.mp4`
2. 프레임 검수 후 다음 씬 진행

---

## s7 — evidence (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the housing subscription consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK: the camera is static for the entire 8 seconds — no zoom, no
dolly, no framing drift.

PROP LOCK: the character holds a card reading "예전: 가입기간 0부터 다시"
with a reset icon steadily with one wing at chest height for the entire
clip — the card does not tilt, rotate, rise, lower, or drift at any point.

MOTION DETAIL: the other wing rests naturally, slightly regretful
expression, as if recalling an old inconvenient rule.

CONTINUOUS MOTION: natural eye blinks every 2-3 seconds, subtle head tilts,
continuous beak movement while speaking for the entire clip, including the
final 1-2 seconds.

STATIC ELEMENTS: the poster, apartment model, and card text stay completely
fixed — no camera pan or zoom, no card movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/feathers, no warped or flickering surfaces, no
regenerated or reinterpreted card text, no background changes, no character
redesign, no abrupt cut or freeze mid-motion, no closed-mouth talking, no
frozen expression while speaking, no card drift or rotation, no camera zoom
or framing drift at any point including the last second.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 저장: `C:/tmp/owl-ep17-videos/owl_ep17_s7_evidence_motion.mp4`
2. 프레임 검수 후 다음 씬 진행

---

## s8 — evidence (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the housing subscription consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK: the camera is static for the entire 8 seconds — no zoom, no
dolly, no framing drift.

PROP LOCK: the character holds a card reading "연 3.1% 즉시 적용" with an
upward arrow icon steadily with one wing at chest height for the entire
clip — the card does not tilt, rotate, rise, lower, or drift at any point.

MOTION DETAIL: the other wing gestures confidently, bright confident
expression, as if delivering good news.

CONTINUOUS MOTION: natural eye blinks every 2-3 seconds, subtle head tilts,
continuous beak movement while speaking for the entire clip, including the
final 1-2 seconds.

STATIC ELEMENTS: the poster, apartment model, and card text stay completely
fixed — no camera pan or zoom, no card movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/feathers, no warped or flickering surfaces, no
regenerated or reinterpreted card text, no background changes, no character
redesign, no abrupt cut or freeze mid-motion, no closed-mouth talking, no
frozen expression while speaking, no card drift or rotation, no camera zoom
or framing drift at any point including the last second.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 저장: `C:/tmp/owl-ep17-videos/owl_ep17_s8_evidence_motion.mp4`
2. 프레임 검수 후 다음 씬 진행

---

## s9 — condition (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the housing subscription consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK: the camera is static for the entire 8 seconds — no zoom, no
dolly, no framing drift.

PROP LOCK: the character holds a card reading "되돌리기 불가 · 예금자보호
제외" with a warning icon steadily with one wing at chest height for the
entire clip — the card does not tilt, rotate, rise, lower, or drift at any
point.

MOTION DETAIL: the other wing rests naturally, serious cautionary
expression, as if delivering an important warning.

CONTINUOUS MOTION: natural eye blinks every 2-3 seconds, subtle head tilts,
continuous beak movement while speaking for the entire clip, including the
final 1-2 seconds.

STATIC ELEMENTS: the poster, apartment model, and card text stay completely
fixed — no camera pan or zoom, no card movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/feathers, no warped or flickering surfaces, no
regenerated or reinterpreted card text, no background changes, no character
redesign, no abrupt cut or freeze mid-motion, no closed-mouth talking, no
frozen expression while speaking, no card drift or rotation, no camera zoom
or framing drift at any point including the last second.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip — never static, never
barely-moving, never closed-mouth talking, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 저장: `C:/tmp/owl-ep17-videos/owl_ep17_s9_condition_motion.mp4`
2. 프레임 검수 후 다음 씬 진행

---

## s10 — action (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the housing subscription consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK: the camera is static for the entire 8 seconds — no zoom, no
dolly, no framing drift.

PROP LOCK: the character holds a card reading "은행 앱·창구에서 확인"
steadily with one wing at chest height for the entire clip — the card does
not tilt, rotate, rise, lower, or drift at any point.

MOTION DETAIL: the other wing gestures warmly outward as if inviting the
viewer to check for themselves, warm friendly closing smile.

CONTINUOUS MOTION: natural eye blinks every 2-3 seconds, subtle head tilts,
continuous beak movement while speaking for the entire clip, including the
final 1-2 seconds.

STATIC ELEMENTS: the poster, apartment model, and card text stay completely
fixed — no camera pan or zoom, no card movement.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers/feathers, no warped or flickering surfaces, no
regenerated or reinterpreted card text, no background changes, no character
redesign, no abrupt cut or freeze mid-motion, no closed-mouth talking, no
frozen expression while speaking, no card drift or rotation, no camera zoom
or framing drift at any point including the last second.

MOUTH MOVEMENT: the character's beak actively opens and closes continuously
in natural speech rhythm for the entire clip, as if warmly wrapping up the
episode — never static, never barely-moving, never closed-mouth talking,
never frozen even in the final seconds.
```

## 완료 후 절차
1. 저장: `C:/tmp/owl-ep17-videos/owl_ep17_s10_action_motion.mp4`
2. 프레임 검수 후 조립 단계(`run-owl-assemble-shorts-v2.mjs`)로 진행
