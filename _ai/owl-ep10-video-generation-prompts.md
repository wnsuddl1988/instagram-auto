# 부엉박사 10편 — 영상(모션) 생성 프롬프트

소재: 27년 만에 오르는 국민연금 (보험료율 9%→13%)
이미지 소스 폴더: `C:/tmp/owl-ep10-images-v2/`
씬 길이 티어 기준: [`_ai/CURRENT_STANDARDS.md`](CURRENT_STANDARDS.md) §0 — TTS 실측(`rawAudioDurationSec`, 순수 발화 기준) 8초 미만 → 8초 이내 티어(8초로 요청) / 8초 이상 → 8~10초 티어(실측값+1초 미만 여유)
생성기 상한: Gemini Veo(Flash-Lite) 10초까지 / Google Flow는 `--model lite` 8초 상한(8초 초과 씬은 Veo 사용 권장)
5요소(전 씬 공통 필수): ①스타일 유지(캐릭터·의상·배경 고정) ②동작 디테일(씬 의도에 맞는 구체적 제스처) ③정지 요소(소품·그래픽 애니메이션 금지) ④부정 프롬프트 ⑤입 움직임 필수

---

## 티어 1 — 8초 이내 (실측 8초 미만, 8초로 요청)

### Scene 1 — 오프닝 (실측 7.07초)
이미지: `C:/tmp/owl-ep10-images-v2/owl_ep10_s1_opening.png`
요청 길이: **8초**

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the owl
character's design, outfit (charcoal vest, burgundy tie, sunglasses resting on
forehead), and the pension consultation counter background exactly as shown in
the reference image — no changes to colors, proportions, or setting. MOTION
DETAIL: the owl lifts one wing slightly in a friendly greeting gesture, as if
welcoming the viewer, with a subtle natural sway in its body and feathers as it
speaks. STATIC ELEMENTS: the background signage, the screen showing "연금 조회"
menu, the plants, and all furniture must remain completely still — no animated
text, no flashing graphics, no camera movement or zoom. CRITICAL TEXT
PRESERVATION: every piece of Korean text visible anywhere in the frame —
including the large "연금 상담 창구" banner, the small background signage, the
screen menu, and wall banners — must remain pixel-perfect identical to the
reference image for the entire 8 seconds. Do not let any character shift,
blur, morph, or misspell. If motion would risk distorting any text, keep that
element completely static instead. NEGATIVE PROMPT: no face distortion, no
proportion drift, no extra or malformed fingers/claws, no warped or
misspelled text anywhere in the frame, no background changes, no character
redesign. MOUTH MOVEMENT: the owl's beak actively opens and closes
continuously in natural speech rhythm for the full 8 seconds — never static,
never barely-moving, never closed-mouth talking.
```

### Scene 2 — 훅 (실측 6.17초)
이미지: `C:/tmp/owl-ep10-images-v2/owl_ep10_s2_hook.png`
요청 길이: **8초**

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the owl
character's design, outfit, and the pension consultation counter background
exactly as shown in the reference image. MOTION DETAIL: the owl holds up the
payslip document with one wing, gesturing toward the "국민연금" line item and the
red upward arrow with the other wing, eyes wide with an alert, surprised-but-
confident expression. STATIC ELEMENTS: the background signage, screen menu,
plants, and furniture remain completely still — the payslip paper itself stays
rigid (no paper-flutter animation), no flashing or animated text. CRITICAL
TEXT PRESERVATION: every piece of Korean text visible anywhere in the frame —
including the payslip, the large "연금 상담 창구" banner, the small background
signage, the screen menu, and wall banners — must remain pixel-perfect
identical to the reference image for the entire 8 seconds. Do not let any
character shift, blur, morph, or misspell. If motion would risk distorting
any text, keep that element completely static instead. NEGATIVE PROMPT: no
face distortion, no proportion drift, no extra or malformed fingers/claws, no
warped or misspelled text anywhere in the frame, no background changes, no
character redesign. MOUTH MOVEMENT: the owl's beak actively opens and closes
continuously in natural speech rhythm for the full 8 seconds — never static,
never barely-moving, never closed-mouth talking.
```

### Scene 7 — 임팩트 (실측 7.06초)
이미지: `C:/tmp/owl-ep10-images-v2/owl_ep10_s7_impact.png`
요청 길이: **8초**

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the owl
character's design, outfit, and the pension consultation counter background
exactly as shown in the reference image. MOTION DETAIL: the owl holds the
information card reading "은퇴 전 소득 대비 돌려받는 비율 41.5% → 43%" and "기금
부족해도 국가 책임" with both wings, looking down at it thoughtfully then back up
toward camera with a calm, reassuring expression (slightly softer than the
sharp default look, as this is a reassuring beat). STATIC ELEMENTS: the card
text, background signage, screen menu, and furniture remain completely still —
no animated numbers, no flashing graphics. CRITICAL TEXT PRESERVATION: every
piece of Korean text visible anywhere in the frame — including the
information card, the large "연금 상담 창구" banner, the small background
signage, the screen menu, and wall banners — must remain pixel-perfect
identical to the reference image for the entire 8 seconds. Do not let any
character shift, blur, morph, or misspell. If motion would risk distorting
any text, keep that element completely static instead. NEGATIVE PROMPT: no
face distortion, no proportion drift, no extra or malformed fingers/claws, no
warped or misspelled text anywhere in the frame, no background changes, no
character redesign. MOUTH MOVEMENT: the owl's beak actively opens and closes
continuously in natural speech rhythm for the full 8 seconds — never static,
never barely-moving, never closed-mouth talking.
```

### Scene 9 — 액션A (실측 7.98초)
이미지: `C:/tmp/owl-ep10-images-v2/owl_ep10_s9_action_a.png`
요청 길이: **8초**

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the owl
character's design, outfit, and the pension consultation counter background
exactly as shown in the reference image. MOTION DETAIL: the owl holds one wing
steadily pointed at the "국민연금 공제액 비교" comparison sheet, facing the
camera with a careful, meticulous expression, not smiling. Only the owl's body,
wing, beak, and eyes move — every prop and background element is treated as a
frozen photograph layered behind/beside the character. STATIC ELEMENTS: the
comparison sheet's printed numbers and layout, background signage, screen
menu, and furniture remain completely still — no animated charts, no flashing
text. CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the comparison sheet's small print, the small blue
menu screen in the background reading "국민연금 알아보기 / 예상 연금액 조회 /
가입 내역 확인 / 상담 신청", the large "연금 상담 창구" banner and its subtitle,
the "번호표 발급" and "상담 번호표 발급" signs, and every other wall banner.
Render these exactly as pixels copied from the reference image, unchanged
frame to frame — do not let the video model regenerate, redraw, reinterpret,
or reflow any of this text, even slightly, even for one frame. If achieving
this requires the camera and background to be perfectly locked with zero
parallax or lighting drift, do that. NEGATIVE PROMPT: no face distortion, no
proportion drift, no extra or malformed fingers/claws, no warped, blurred,
flickering, or misspelled text anywhere in the frame (large or small), no
regenerated or reinterpreted signage, no background changes, no character
redesign, no eye or gaze darting between multiple points. MOUTH MOVEMENT: the
owl's beak actively opens and closes continuously in natural speech rhythm for
the full 8 seconds — never static, never barely-moving, never closed-mouth
talking.
```

---

## 티어 2 — 8~10초 (실측값 + 1초 미만 여유)

### Scene 3 — 왜 지금 올리는가 (실측 8.13초)
이미지: `C:/tmp/owl-ep10-images-v2/owl_ep10_s3_why.png`
요청 길이: **9초**

```
Animate this image into a 9-second video clip. STYLE CONSISTENCY: keep the owl
character's design, outfit, and the pension consultation counter background
exactly as shown in the reference image. MOTION DETAIL: the owl holds up the
old-paper card reading "1998년 9%" steadily with one wing, facing the camera
with a serious, slightly worried expression. The chart board beside it does
not move. STATIC ELEMENTS: the chart's bars, arrow, and year labels stay
completely fixed — no animated line-drawing or growing bars, background
signage and furniture remain still. CRITICAL TEXT PRESERVATION: every piece
of Korean text visible anywhere in the frame — including the old-paper card,
the chart board, the large "연금 상담 창구" banner, the small background
signage, the screen menu, and wall banners — must remain pixel-perfect
identical to the reference image for the entire 9 seconds. Do not let any
character shift, blur, morph, or misspell. If motion would risk distorting
any text, keep that element completely static instead. NEGATIVE PROMPT: no
face distortion, no proportion drift, no extra or malformed fingers/claws, no
warped or misspelled text anywhere in the frame, no background changes, no
character redesign, no eye or gaze darting between multiple points. MOUTH
MOVEMENT: the owl's beak actively opens and closes continuously in natural
speech rhythm for the full 9 seconds — never static, never barely-moving,
never closed-mouth talking.
```

### Scene 4 — 근거카드 (실측 9.17초)
이미지: `C:/tmp/owl-ep10-images-v2/owl_ep10_s4_evidence_card.png`
요청 길이: **10초**

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the owl
character's design, outfit, and the pension consultation counter background
exactly as shown in the reference image. MOTION DETAIL: the owl points with one
wing at the information board reading "보험료율 9% → 13%" and "2026~2033년 단계적
인상", nodding slightly with a sharp, analytical expression as if explaining the
schedule step by step. STATIC ELEMENTS: the board's numbers, arrow, and bar
graph stay completely fixed — no animated counting or growing bars, background
signage and furniture remain still. CRITICAL TEXT PRESERVATION: every piece
of Korean text visible anywhere in the frame — including the information
board, the large "연금 상담 창구" banner, the small background signage, the
screen menu, and wall banners — must remain pixel-perfect identical to the
reference image for the entire 10 seconds. Do not let any character shift,
blur, morph, or misspell. If motion would risk distorting any text, keep that
element completely static instead. NEGATIVE PROMPT: no face distortion, no
proportion drift, no extra or malformed fingers/claws, no warped or
misspelled text anywhere in the frame, no background changes, no character
redesign. MOUTH MOVEMENT: the owl's beak actively opens and closes
continuously in natural speech rhythm for the full 10 seconds — never static,
never barely-moving, never closed-mouth talking.
```

### Scene 5 — 배경데이터 (실측 9.49초)
이미지: `C:/tmp/owl-ep10-images-v2/owl_ep10_s5_background.png`
요청 길이: **10초**

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the owl
character's design, outfit, and the pension consultation counter background
exactly as shown in the reference image. MOTION DETAIL: the owl stands calmly
beside the information board, one wing resting near it, with a serious,
matter-of-fact expression facing the camera. The board itself does not move.
STATIC ELEMENTS: the information board and everything printed on it stay
completely fixed exactly as shown in the reference image, background signage
and furniture remain still. CRITICAL TEXT PRESERVATION: every piece of text
visible anywhere in the frame — including the information board, the large
"연금 상담 창구" banner, the small background signage, the screen menu, and
wall banners — must remain pixel-perfect identical to the reference image for
the entire 10 seconds. Do not let any character shift, blur, morph, or
misspell. If motion would risk distorting any text, keep that element
completely static instead. NEGATIVE PROMPT: no face distortion, no
proportion drift, no extra or malformed fingers/claws, no warped or
misspelled text anywhere in the frame, no background changes, no character
redesign, no eye or gaze darting between multiple points. MOUTH MOVEMENT: the
owl's beak actively opens and closes continuously in natural speech rhythm for
the full 10 seconds — never static, never barely-moving, never closed-mouth
talking.
```

**주의(2026-09-21 씬5, 3차 — refusal 회피 유지하며 텍스트 보존 추가)**: 1차
수정(동작 단순화)에도 계속 refusal — 같은 손짓+끄덕임 구조의 씬3/4/6은 정상
통과했다는 걸 Owner가 확인해줘서, 원인이 동작 구조가 아니라 **씬5 고유
콘텐츠**(기금 "소진", 금액 인상 수치 두 개, 상승 화살표 그래프)일 가능성이
높다고 판단해 2차에서 보드 위 구체적 문구·숫자를 다시 타이핑하지 않고 "정보
보드"로만 지칭했다(refusal 재발 방지 목적 유지, 3차에서도 이 부분은 그대로
둠). 다만 10편 전체 재발방지 조치(모든 씬에 CRITICAL TEXT PRESERVATION 공통
적용, [[feedback_video_prompt_text_preservation_must_verify]])에서 씬5만
빠져있던 걸 발견해 3차로 그 블록만 추가했다 — 구체적 수치를 다시 타이핑하지
않았으므로 refusal 재발 위험 없이 텍스트 보존 지시만 강화됨. 이미 통과한
씬이므로 재생성은 필요 없고, 이 문서를 참고용으로 다시 쓸 경우에만 이 버전을
사용한다.

### Scene 6 — 반전 (실측 8.67초)
이미지: `C:/tmp/owl-ep10-images-v2/owl_ep10_s6_twist.png`
요청 길이: **9초**

```
Animate this image into a 9-second video clip. STYLE CONSISTENCY: keep the owl
character's design, outfit, and the pension consultation counter background
exactly as shown in the reference image. MOTION DETAIL: the owl holds up two
cards, one in each wing — "더 낸다" in the left wing and "더 받는다 + 국가 책임"
in the right wing — raising them slightly to show balance/contrast between the
two, with a confident, serious expression, not smiling. STATIC ELEMENTS: both
cards' text and icons stay completely fixed — no card-flip animation, no
flashing text, background signage and furniture remain still. CRITICAL TEXT
PRESERVATION: every piece of Korean text visible anywhere in the frame —
including both cards, the large "연금 상담 창구" banner, the small background
signage, the screen menu, and wall banners — must remain pixel-perfect
identical to the reference image for the entire 9 seconds. Do not let any
character shift, blur, morph, or misspell. If motion would risk distorting
any text, keep that element completely static instead. NEGATIVE PROMPT: no
face distortion, no proportion drift, no extra or malformed fingers/claws, no
warped or misspelled text anywhere in the frame, no background changes, no
character redesign. MOUTH MOVEMENT: the owl's beak actively opens and closes
continuously in natural speech rhythm for the full 9 seconds — never static,
never barely-moving, never closed-mouth talking.
```

### Scene 8 — 대안/액션 (실측 8.42초)
이미지: `C:/tmp/owl-ep10-images-v2/owl_ep10_s8_alternative.png`
요청 길이: **9초**

```
Animate this image into a 9-second video clip. STYLE CONSISTENCY: keep the owl
character's design, outfit, and the pension consultation counter background
exactly as shown in the reference image. MOTION DETAIL: the owl holds up a
smartphone showing the "내 연금 알아보기" app screen with one wing, pointing at
it with the other wing, expression warm and reassuring with a gentle smile
(softer tone is allowed here — this is the helpful-suggestion beat). STATIC
ELEMENTS: the phone screen's text and icons stay completely fixed — no
scrolling or tapping animation, background signage and furniture remain still.
CRITICAL TEXT PRESERVATION: every piece of Korean text visible anywhere in the
frame — including the phone screen, the small background signage, the screen
menu, and wall banners — must remain pixel-perfect identical to the reference
image for the entire 9 seconds. Do not let any character shift, blur, morph,
or misspell. If motion would risk distorting any text, keep that element
completely static instead. NEGATIVE PROMPT: no face distortion, no
proportion drift, no extra or malformed fingers/claws, no warped or
misspelled text anywhere in the frame, no background changes, no character
redesign. MOUTH MOVEMENT: the owl's beak actively opens and closes
continuously in natural speech rhythm for the full 9 seconds — never static,
never barely-moving, never closed-mouth talking.
```

### Scene 10 — 액션B, 마무리 (실측 9.61초)
이미지: `C:/tmp/owl-ep10-images-v2/owl_ep10_s10_action_b.png`
요청 길이: **10초**

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the owl
character's design, outfit, and the pension consultation counter background
exactly as shown in the reference image. MOTION DETAIL: the owl holds a phone
to its ear with one wing while gesturing toward the "국민연금공단 1355" call-to-
action sign with the other wing, expression thoughtful and settling into a
gentle, warm smile toward the end (closing-tone softness is allowed). Only the
owl's body, wing, beak, and eyes move — every prop and background element is
treated as a frozen photograph layered behind/beside the character. STATIC
ELEMENTS: the sign's text and phone icon stay completely fixed — no ringing
animation, no flashing text, background signage and furniture remain still.
CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
10 seconds — this includes the "국민연금공단 1355 / 지금, 전화로 상담하세요!"
call-to-action sign, the large "연금 상담 창구" banner and its subtitle "든든한
노후, 함께 만드는 미래", the small blue menu screen reading "연금 상담 안내 /
연금 조회 / 상담 신청 / 상담 번호표 발급", the "공적 서류 발급" sign, the
"행복한 노후, 함께합니다" wall banner, and every other wall banner. Render
these exactly as pixels copied from the reference image, unchanged frame to
frame — do not let the video model regenerate, redraw, reinterpret, or
reflow any of this text, even slightly, even for one frame. If achieving this
requires the camera and background to be perfectly locked with zero parallax
or lighting drift, do that. NEGATIVE PROMPT: no face distortion, no
proportion drift, no extra or malformed fingers/claws, no warped, blurred,
flickering, or misspelled text anywhere in the frame (large or small), no
regenerated or reinterpreted signage, no background changes, no character
redesign. MOUTH MOVEMENT: the owl's beak actively opens and closes
continuously in natural speech rhythm for the full 10 seconds — never static,
never barely-moving, never closed-mouth talking.
```

---

## 요약 표

| Scene | 이미지 파일 | 실측(초) | 티어 | 요청 길이 |
|---|---|---|---|---|
| 1 오프닝 | owl_ep10_s1_opening.png | 7.07 | 8초 이내 | 8초 |
| 2 훅 | owl_ep10_s2_hook.png | 6.17 | 8초 이내 | 8초 |
| 3 왜 | owl_ep10_s3_why.png | 8.13 | 8~10초 | 9초 |
| 4 근거카드 | owl_ep10_s4_evidence_card.png | 9.17 | 8~10초 | 10초 |
| 5 배경데이터 | owl_ep10_s5_background.png | 9.49 | 8~10초 | 10초 |
| 6 반전 | owl_ep10_s6_twist.png | 8.67 | 8~10초 | 9초 |
| 7 임팩트 | owl_ep10_s7_impact.png | 7.06 | 8초 이내 | 8초 |
| 8 대안/액션 | owl_ep10_s8_alternative.png | 8.42 | 8~10초 | 9초 |
| 9 액션A | owl_ep10_s9_action_a.png | 7.98 | 8초 이내 | 8초 |
| 10 액션B | owl_ep10_s10_action_b.png | 9.61 | 8~10초 | 10초 |

**참고**: Google Flow는 `--model lite` 8초 상한이라 9~10초 요청 씬(3,4,5,6,8,10)은 Gemini Veo(Flash-Lite, 10초까지) 사용 권장. Flow로 하려면 해당 씬은 장면을 쪼개야 함(CURRENT_STANDARDS.md 원칙).
