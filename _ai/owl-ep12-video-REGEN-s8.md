# 부엉박사 12편 s8(조건) 영상 재생성 — 수동 진행용

## 재생성 사유(2026-09-22)
s8 원본 영상은 발화 구간(0~5.79초) 이후 남은 약 2초 동안 캐릭터가 날카롭게
째려보는 강한 표정으로 완전히 정지된 채 유지된다. 조립 시 발화 종료~씬
경계 사이 여유 구간(약 0.79초)과 겹치면서, 화면이 부자연스럽게 멈췄다가
갑자기 다음 씬(s9)으로 급전환되는 것처럼 보인다는 지적(Owner, 2026-09-22).
다른 씬들도 비슷한 여유 구간이 있지만 표정 자체가 뻣뻣하게 굳어 있는 건
s8이 유독 심해 재생성한다.

이미지 소스(변경 없음): `C:/tmp/owl-ep12-images/owl_ep12_s8_condition.png`
저장할 영상 파일명(교체): `owl_ep12_s8_condition_motion.mp4` →
`C:/tmp/owl-ep12-videos/owl_ep12_s8_condition_motion.mp4`
길이 티어: 8초(변경 없음, 실측 5.79초)

## 변경 사항
기존 프롬프트와 동일하되, 발화가 끝난 뒤에도 캐릭터가 완전히 얼어붙지
않도록 클립 전체에 걸쳐 미세한 지속 동작(고개 끄덕임, 눈 깜빡임)을
추가했다.

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright real-estate agency office
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds the "무주택 유지 · 입주 후 2년 거주"
card steadily with both wings at chest height — the card does not travel or
shift position, treat it as a fixed object the character is simply holding
still with both wings gripping it. The character's head, eyes, and mouth
move continuously throughout the ENTIRE 8 seconds, showing a serious,
cautionary expression while speaking — not smiling, emphasizing an
important condition. Crucially, even in the seconds after the character
finishes speaking, it keeps subtly alive: a slow, gentle head nod, natural
eye blinks, small breathing motion in the chest — never freezing into a
single static held expression. The expression should soften slightly
toward the end of the clip (from intense to calmly settled), not stay
locked in the same sharp glare for the full 8 seconds.

STATIC ELEMENTS: the background signage, plants, chairs, and the card
(including its "무주택 유지", "입주 후 2년 거주" text) must stay completely
fixed — no camera pan or zoom, no background object movement, no card
movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("무주택 유지", "입주 후 2년
거주"), the large "부동산" wall sign, and the "매물" board. Render these
exactly as pixels copied from the reference image, unchanged frame to frame
— do not let the video model regenerate, redraw, reinterpret, or reflow any
of this text, even slightly, even for one frame. If motion would risk
distorting any text, keep that element completely static instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement, no completely motionless hold after speech ends, no rigid locked
glare for the entire clip.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm while speaking, as if seriously
stating an important condition — never static, never barely-moving, never
closed-mouth talking. After speech ends, the mouth closes naturally and the
character keeps breathing/blinking gently rather than freezing.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep12-videos/owl_ep12_s8_condition_motion.mp4`로 저장(기존 파일 덮어쓰기)
2. 끝부분(5.5~8초 구간) 프레임을 확인해 표정이 자연스럽게 이어지는지 검증
3. 문제 없으면 본편 재조립(대본 수정 반영 TTS도 함께 재생성) → CTA 재결합 → 최종 검수
