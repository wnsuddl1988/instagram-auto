# 부엉박사 12편 s10(마무리 액션) 영상 재생성 — 수동 진행용

## 재생성 사유(2026-09-22)
s10 원본 영상에서 3초 지점부터 캐릭터 왼쪽 뒤편의 빈 벽면에 없던 한글 텍스트
("운반"으로 보이는 2글자)가 점차 생성되어 8초 끝까지 유지됐다. 87씬 전수조사
규칙3("Veo는 빈 면을 없던 텍스트로 채운다")과 정확히 일치하는 사례 — 원본
이미지 확인 결과 그 자리는 완전히 빈 벽면이었다. 트림으로는 해결 불가(3초
이후 전 구간에 결함이 있어, TTS 실측 7.45초를 커버할 정상 구간이 없음).

이미지 소스: `C:/tmp/owl-ep12-images/owl_ep12_s10_action.png`(기존 이미지
그대로 사용 가능 — 원본 이미지 자체는 정상이었고 영상 생성 단계에서만
발생한 문제이므로, 이미지 재생성 없이 영상만 다시 생성한다)
저장할 영상 파일명(교체): `owl_ep12_s10_action_motion.mp4`
길이 티어: 8초(변경 없음, 실측 7.448초)

## 변경 사항
이전 프롬프트와 동일하되, 캐릭터 왼쪽 뒤편 빈 벽면이 화면에 크게 노출되지
않도록 "정지 요소" 지시에 배경 전체가 프레임 전반에 걸쳐 고정되어 있다는
점을 더 강하게 못박았다(텍스트 재생성 자체는 프롬프트로 막을 수 없다는 게
확정된 원칙이므로, 빈 면 자체를 줄이는 방향이 아니라 "배경은 무조건
정지"라는 지시를 반복 강조하는 정도로만 보강).

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright real-estate agency office
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds the smartphone steadily in one wing at
chest height, showing its screen toward the camera — the phone does not
tilt, rise, lower, or move at all, the wing keeps it locked in the same
position and angle for the entire clip. The other wing gestures gently
toward the phone in a fixed pose (not sweeping). The character's head,
eyes, and mouth move, showing a warm, friendly closing expression — gentle
smile allowed (wrap-up tone, softer than other scenes).

STATIC ELEMENTS (HIGHEST PRIORITY): the ENTIRE background — including the
plain wall area to the character's left, the signage, plants, chairs, and
furniture — must remain a completely frozen, unchanging photograph for the
full 8 seconds. Treat every square inch of the background, including empty
wall space, as a locked static image layer that never regenerates,
redraws, or fills in with any new content. No camera pan or zoom, no
background object movement, no phone movement, no new text, shapes, or
objects appearing anywhere in the frame that were not in the original
reference image.

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
movement, no phone floating or blurring.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
wrapping up with a helpful reminder — never static, never barely-moving,
never closed-mouth talking.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep12-videos/owl_ep12_s10_action_motion.mp4`로 저장
2. 시작 프레임(텍스트)과 끝 프레임(배경 빈 면에 새 텍스트 없는지 특히 확인) 검수
3. 문제 없으면 s3·s6 트림본과 함께 조립 진행
