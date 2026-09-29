# 금박사 10편 재생성 프롬프트 — s2, s5, s7, s9

1차 생성 검수 결과, 아래 4개 씬에서 카드/폰이 클립 후반부(약 6~8초 구간)에
손에서 놓이거나 사라지는 문제가 확인됨(s2·s5·s7은 카드 완전 소실, s9는 폰
그립 흐트러짐). 재생성 시 **카드를 쥔 팔은 클립 끝까지 움직이지 않는다**는
지시를 더 명확히 하고, 동작은 반대쪽 팔에만 배정한다.

이미지 소스 폴더: `C:/tmp/geumbaksa-ep10-images/`
영상 저장 폴더: `C:/tmp/geumbaksa-ep10-videos/` (기존 파일 덮어쓰기)

| 씬 | 이미지 소스 | 저장 파일명 | 요청 티어 | 1차 실패 지점 |
|---|---|---|---|---|
| s2 hook | `geumbaksa_ep10_s2.png` | `ep10_s2_video.mp4` | 8초 | 7.7초경 카드 소실 |
| s5 twist | `geumbaksa_ep10_s5.png` | `ep10_s5_video.mp4` | 8초 | 7.7초경 카드 소실 + 배경에 없던 텍스트 생성 |
| s7 reassurance | `geumbaksa_ep10_s7.png` | `ep10_s7_video.mp4` | 8초 | 7.7초경 카드 소실 |
| s9 closing_action | `geumbaksa_ep10_s9.png` | `ep10_s9_video.mp4` | 8초 | 7~8초 구간 폰 그립 흐트러짐(경미) |

★ 모든 씬 공통 추가 지시(1차 대비 강화): **"the character's grip on the
card/phone never loosens, opens, or repositions at any point in the clip,
including the final 1-2 seconds — both hands/the holding hand stay in
exactly the same position on the card from the first frame to the last
frame."** 이 문장을 PROP LOCK 섹션에 그대로 추가했다. 텍스트 재생성
방지(pixel-perfect 등)는 이미 실패가 확인된 접근이라 추가하지 않았고,
오직 "그립을 놓지 않는다"는 물리적 동작 지시만 강화했다.

---

## s2 — hook (8초, 재생성)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the unemployment insurance
consultation desk background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

CAMERA LOCK: the camera is static for the entire 8 seconds — no zoom, no
dolly, no framing drift.

PROP LOCK (HIGHEST PRIORITY): the character holds the card reading "마냥
좋은 일?" with both hands at chest height for the entire 8-second clip. The
character's grip on the card never loosens, opens, or repositions at any
point in the clip, including the final 1-2 seconds — both hands stay in
exactly the same position on the card from the first frame to the last
frame. The card does not tilt, rotate, rise, lower, drop, or drift at any
point, and it must still be held in both hands in the very last frame,
identical to the first frame.

MOTION DETAIL: the character's head tilts slightly and the expression shows
curiosity and mild puzzlement, mouth moving as if posing a question. Do not
move the arms or hands away from the card at any point.

CONTINUOUS MOTION: natural eye blinks every 2-3 seconds, subtle head tilts,
continuous mouth movement while speaking for the entire clip, including the
final 1-2 seconds — motion comes from the face and head only, not from the
arms holding the card.

STATIC ELEMENTS: the poster, calculator, clipboard, calendar, and card text
stay completely fixed — no camera pan or zoom, no card movement, no card
drop.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped or flickering surfaces, no regenerated or
reinterpreted card text, no regenerated or reinterpreted background poster
text, no background changes, no character redesign, no abrupt cut or freeze
mid-motion, no closed-mouth talking, no frozen expression while speaking,
no card drift, rotation, or drop, no hands releasing or repositioning on
the card at any point including the last 1-2 seconds, no camera zoom or
framing drift at any point including the last second.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip — never static,
never barely-moving, never closed-mouth talking, never frozen even in the
final seconds.
```

### 완료 후 절차
1. 저장: `C:/tmp/geumbaksa-ep10-videos/ep10_s2_video.mp4` (기존 파일 교체)
2. **끝부분(7~8초) 프레임을 반드시 확인** — 카드가 여전히 양손에 들려 있는지 확인
3. 문제 없으면 다음 씬 진행

---

## s5 — twist (8초, 재생성)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the unemployment insurance
consultation desk background exactly as shown in the reference image,
including the "실업급여 안내" poster with no additional text beyond what is
shown. Do not change any colors, text, or object positions, and do not add
any new text anywhere in the frame.

CAMERA LOCK: the camera is static for the entire 8 seconds — no zoom, no
dolly, no framing drift.

PROP LOCK (HIGHEST PRIORITY): the character holds the card reading "통장은
오히려 줄어든다?" with a downward arrow icon, with both hands at chest
height for the entire 8-second clip. The character's grip on the card never
loosens, opens, or repositions at any point in the clip, including the
final 1-2 seconds — both hands stay in exactly the same position on the
card from the first frame to the last frame. The card does not tilt,
rotate, rise, lower, drop, or drift at any point, and it must still be held
in both hands in the very last frame, identical to the first frame.

MOTION DETAIL: the character's expression shows surprise, eyebrows raised,
mouth open in mild shock, as if revealing an unexpected twist. Do not move
the arms or hands away from the card at any point.

CONTINUOUS MOTION: natural eye blinks every 2-3 seconds, subtle head tilts,
continuous mouth movement while speaking for the entire clip, including the
final 1-2 seconds — motion comes from the face and head only, not from the
arms holding the card.

STATIC ELEMENTS: the poster (with its exact original text and no
additional text), calculator, clipboard, calendar, and card text stay
completely fixed — no camera pan or zoom, no card movement, no card drop,
no new text appearing anywhere in the background.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped or flickering surfaces, no regenerated or
reinterpreted card text, no regenerated or reinterpreted background poster
text, no new text appearing on the poster or anywhere in the background, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no closed-mouth talking, no frozen expression while speaking,
no card drift, rotation, or drop, no hands releasing or repositioning on
the card at any point including the last 1-2 seconds, no camera zoom or
framing drift at any point including the last second.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip — never static,
never barely-moving, never closed-mouth talking, never frozen even in the
final seconds.
```

### 완료 후 절차
1. 저장: `C:/tmp/geumbaksa-ep10-videos/ep10_s5_video.mp4` (기존 파일 교체)
2. **끝부분(7~8초) 프레임을 반드시 확인** — 카드 유지 여부 + 배경 포스터에 새 텍스트가 안 생겼는지 둘 다 확인
3. 문제 없으면 다음 씬 진행

---

## s7 — reassurance (8초, 재생성)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the unemployment insurance
consultation desk background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

CAMERA LOCK: the camera is static for the entire 8 seconds — no zoom, no
dolly, no framing drift.

PROP LOCK (HIGHEST PRIORITY): the character holds the card reading "198만원
→ 176만원" with both hands at chest height for the entire 8-second clip.
The character's grip on the card never loosens, opens, or repositions at
any point in the clip, including the final 1-2 seconds — both hands stay in
exactly the same position on the card from the first frame to the last
frame. The card does not tilt, rotate, rise, lower, drop, or drift at any
point, and it must still be held in both hands in the very last frame,
identical to the first frame.

MOTION DETAIL: the character's expression is serious and focused, as if
carefully explaining a consequence, mouth moving naturally. Do not move the
arms or hands away from the card at any point.

CONTINUOUS MOTION: natural eye blinks every 2-3 seconds, subtle head tilts,
continuous mouth movement while speaking for the entire clip, including the
final 1-2 seconds — motion comes from the face and head only, not from the
arms holding the card.

STATIC ELEMENTS: the poster, calculator, clipboard, calendar, and card text
stay completely fixed — no camera pan or zoom, no card movement, no card
drop.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped or flickering surfaces, no regenerated or
reinterpreted card text, no regenerated or reinterpreted background poster
text, no background changes, no character redesign, no abrupt cut or freeze
mid-motion, no closed-mouth talking, no frozen expression while speaking,
no card drift, rotation, or drop, no hands releasing or repositioning on
the card at any point including the last 1-2 seconds, no camera zoom or
framing drift at any point including the last second.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip — never static,
never barely-moving, never closed-mouth talking, never frozen even in the
final seconds.
```

### 완료 후 절차
1. 저장: `C:/tmp/geumbaksa-ep10-videos/ep10_s7_video.mp4` (기존 파일 교체)
2. **끝부분(7~8초) 프레임을 반드시 확인** — 카드가 여전히 양손에 들려 있는지 확인
3. 문제 없으면 다음 씬 진행

---

## s9 — closing_action (8초, 재생성)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the unemployment insurance
consultation desk background exactly as shown in the reference image. Do
not change any colors, text, or object positions.

CAMERA LOCK: the camera is static for the entire 8 seconds — no zoom, no
dolly, no framing drift.

PROP LOCK (HIGHEST PRIORITY): the character holds the smartphone card
reading "실업급여 모의계산" with a checkmark icon in one hand at chest
height for the entire 8-second clip. That hand's grip on the phone never
loosens, opens, or repositions at any point in the clip, including the
final 1-2 seconds — the holding hand stays in exactly the same position on
the phone from the first frame to the last frame. The phone does not tilt,
rotate, rise, lower, drop, or drift away from the hand at any point, and it
must still be held firmly in that hand in the very last frame, identical to
the first frame.

MOTION DETAIL: the character's other (free) hand gestures warmly outward as
if inviting the viewer to check for themselves, warm closing smile. Only
the free hand moves — the hand holding the phone stays completely fixed on
the phone.

CONTINUOUS MOTION: natural eye blinks every 2-3 seconds, subtle head tilts,
continuous mouth movement while speaking for the entire clip, including the
final 1-2 seconds — motion comes from the face, head, and free hand only,
never from the hand holding the phone.

STATIC ELEMENTS: the poster, calculator, clipboard, calendar, and phone
screen text stay completely fixed — no camera pan or zoom, no phone
movement, no phone drop or drift away from the hand.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped or flickering surfaces, no regenerated or
reinterpreted phone screen text, no background changes, no character
redesign, no abrupt cut or freeze mid-motion, no closed-mouth talking, no
frozen expression while speaking, no phone drift, rotation, or drop, no
hand releasing or repositioning on the phone at any point including the
last 1-2 seconds, no camera zoom or framing drift at any point including
the last second.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
wrapping up the episode — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

### 완료 후 절차
1. 저장: `C:/tmp/geumbaksa-ep10-videos/ep10_s9_video.mp4` (기존 파일 교체)
2. **끝부분(7~8초) 프레임을 반드시 확인** — 폰이 손에서 벌어지지 않고 그대로 잡혀 있는지 확인
3. 4개 씬 모두 완료되면 나머지 5개(s1, s3, s4, s6, s8)와 함께 조립 단계(`run-owl-assemble-shorts-v2.mjs`)로 진행
