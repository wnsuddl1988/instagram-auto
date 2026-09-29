# 금박사 7편(파일 ep5 신용점수) s4 영상 재생성 프롬프트 — 수동 진행용

## 재생성 사유 (2026-09-26 배포 전 점검)
- 기존 s4 영상(약 1초 이후)에서 동전 몸통에 "PIXAR" 비슷한 글자가 새겨지고, 왼손에 클립보드가 하나 더 생기며, 체크리스트 아이콘이 동전 그림으로 바뀌는 Veo 결함.
- 원본 이미지가 없고 기존 클립 첫 프레임에는 헤더·하단 바가 새겨져 있어, 첫 프레임 구도를 그대로 살린 **깨끗한 기준 이미지를 새로 생성**했다(동전 몸통은 매끈하게 비워 둠).

| 씬 | 기준 이미지 | 카드 문구 | 저장 | 필요 길이 | 요청 |
|---|---|---|---|---|---|
| s4 evaluation_factors | `C:/tmp/geumbaksa-ep5-images/geumbaksa_ep5_s4_fix.png` | 상환 이력 / 부채 수준 / 거래 기간 / 거래 형태 (클립보드) | `Downloads/4.mp4` | 6.38초 | **10초** |

## s4 — evaluation_factors (10초, 체크리스트 클립보드)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design (round gold coin body with a smooth,
blank golden face surface, white gloves, round gold feet, brown eyebrows)
and the bright home-study background exactly as shown in the reference
image. Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the single tall clipboard on the right — a
checklist with four icons and green check marks reading "상환 이력",
"부채 수준", "거래 기간", "거래 형태" — is gripped at the top by the
character's gloved hand on the screen-right side and rests on the desk at
the bottom. It holds steadily at exactly its current position and angle
for the ENTIRE 10 seconds — the clipboard never moves, tilts, slides,
slips, or drops at any point, especially not in the final 2-3 seconds.
Treat the clipboard and the hand gripping it as a frozen photograph glued
in place. There is only ONE clipboard in the scene at all times.

MOTION DETAIL: only the character's other gloved hand (screen-left side,
pointing) moves — it taps gently toward the checklist a couple of times as
if going through the items, always staying just left of the clipboard edge
and never covering any of the text. The hand gripping the clipboard does
not move at all. Friendly, explaining expression with a warm smile.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by moving
the clipboard.

STATIC ELEMENTS: the clipboard (including all four items, icons, and check
marks), the whiteboard with "신용점수", the red-to-green gauge and the
numbers "1" and "1000", the bookshelf and picture frame, the lamp, the
plants, the books, and the desk must stay completely fixed — no camera pan
or zoom, no background object movement. The coin's face surface stays
smooth and blank.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the checklist text
("상환 이력", "부채 수준", "거래 기간", "거래 형태"), the icons and check
marks, and the whiteboard text ("신용점수", "1", "1000") as locked,
non-regenerating image layers for the full 10 seconds. Render these exactly
as pixels copied from the reference image, unchanged frame to frame. Never
add any letters, words, logos, or engravings anywhere on the coin body.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no text or logo appearing on the coin body, no
"PIXAR" or any brand name, no engraved letters, no second clipboard, no
extra props appearing in the other hand, no icons changing into coins, no
regenerated or reinterpreted signage, no background changes, no character
redesign, no abrupt cut or freeze mid-motion, no static mouth, no minimal
mouth movement, no closed-mouth talking, no frozen expression while
speaking, no clipboard dropping, falling, slipping, or tilting at any
point, no hand passing in front of the checklist text, no full-body freeze
at any point, no holding completely still for more than half a second
anywhere in the clip, NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT
INCLUDING THE LAST SECOND, NO CLIPBOARD MOVEMENT AT ANY POINT INCLUDING THE
LAST SECOND.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly
explaining four things one by one — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. `C:/Users/PC/Downloads/4.mp4`로 저장.
2. Claude: 0~6.5초 검수(몸통 글자·클립보드 개수·체크리스트) → `C:/tmp/geumbaksa-ep5-videos-slowfit/ep5_s4_video.mp4` 교체(느리게 재생 불필요) → 재조립 → CTA 결합.
   ※ 새 클립에는 헤더·하단 바가 없고 다른 재사용 클립에는 새겨져 있으나, 조립기가 같은 위치에 헤더·하단 바를 다시 얹으므로 화면상 차이는 없다.
