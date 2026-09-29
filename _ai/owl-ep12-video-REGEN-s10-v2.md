# 부엉박사 12편 s10(마무리 액션) 영상 재생성 v2 — 수동 진행용

## 재생성 사유(2026-09-22)
직전 재생성본(REGEN-s10, v1)이 실제로는 처음부터 끝까지 캐릭터가 거의 완전히
정지된 상태였다(0초 프레임과 6.5초 프레임이 픽셀 단위로 동일, 입 모양도 거의
안 움직임). 원인으로 추정되는 지점: v1 프롬프트의 "STATIC ELEMENTS (HIGHEST
PRIORITY): the ENTIRE background... must remain a completely frozen,
unchanging photograph" 지시가 배경뿐 아니라 캐릭터 동작까지 얼려버린 것으로
보인다(Veo가 "화면 전체를 고정"으로 과잉 해석). 최종 조립본에서 "1:13부터
영상이 멈추고 말만 나온다"는 지적(Owner, 2026-09-22)으로 발견됨.

이번 프롬프트는 배경 고정 지시는 유지하되, 캐릭터 동작(특히 입 움직임)은
별도 섹션으로 분리해 명확히 "계속 움직여야 한다"고 강조한다.

이미지 소스: `C:/tmp/owl-ep12-images/owl_ep12_s10_action.png`(기존 이미지
그대로 사용)
저장할 영상 파일명(교체): `owl_ep12_s10_action_motion.mp4` →
`C:/tmp/owl-ep12-videos/owl_ep12_s10_action_motion.mp4`
길이 티어: 8초(변경 없음, 실측 발화 8.008초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright real-estate agency office
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CHARACTER MOTION (HIGHEST PRIORITY, CONTINUOUS FOR THE FULL 8 SECONDS): the
character is actively speaking and must show continuous, visible motion
throughout the entire clip — the beak/mouth opens and closes in natural
speech rhythm the whole time, the head tilts and nods gently, the eyes
blink naturally at least 3-4 times across the 8 seconds, and the eyebrows
shift slightly with expression. This is a warm, friendly closing line — a
gentle smile is fine, but the face must keep moving, never hold a single
frozen expression for more than half a second. The character holds the
smartphone steadily in one wing at chest height, showing its screen toward
the camera — the phone itself does not tilt, rise, lower, or move, but the
character's head and face keep animating around it. The other wing gestures
gently toward the phone in a fixed pose (not sweeping).

STATIC ELEMENTS: the background — signage, plants, chairs, furniture — and
the phone position stay fixed (no camera pan or zoom, no phone movement, no
new text or objects appearing). This applies to the BACKGROUND and PROPS
only, not to the character's face or head, which must keep moving as
described above.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the phone screen text ("관할 구청에 확인"), the
large "부동산" wall sign, and the "매물" board. Render these exactly as
pixels copied from the reference image, unchanged frame to frame — do not
let the video model regenerate, redraw, reinterpret, or reflow any of this
text, even slightly, even for one frame. If motion would risk distorting
any text, keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no new text or objects
appearing in empty wall space, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no
closed-mouth talking, no frozen expression while speaking, no phone
movement, no phone floating or blurring, NO FULL-BODY FREEZE, no holding
completely still for more than half a second at any point in the clip.

MOUTH MOVEMENT (MANDATORY): the character's beak/mouth actively opens and
closes continuously in natural speech rhythm for the ENTIRE 8-second clip,
as if warmly wrapping up with a helpful reminder — never static, never
barely-moving, never closed-mouth talking, never frozen even for a single
second.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep12-videos/owl_ep12_s10_action_motion.mp4`로 저장(기존 파일 덮어쓰기)
2. 0초, 2초, 4초, 6초, 8초 지점 프레임을 각각 추출해 서로 다른지(실제로 움직였는지) 반드시 비교 검증
3. 배경 빈 면에 새 텍스트가 생기지 않았는지도 함께 확인(87씬 규칙3)
4. 문제 없으면 본편 재조립 → CTA 재결합 → 최종 검수
