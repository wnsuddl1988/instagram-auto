# 금박사 CTA 영상 재생성 프롬프트

이미지 소스: `C:/tmp/geumbaksa-cta/geumbaksa_cta_follow.png` (기존 원본, 재사용)
목표 길이: 9초 (TTS 실측 8.93초 발화 + 약간 여유)
나레이션(참고): "몰랐던 돈 얘기, 금박사가 하나씩 쉽게 풀어줄게. 아는 만큼 챙길 수 있는
게 많아지니까, 팔로우 눌러두고 계속 같이 알아가자."

## 재생성 사유
기존 CTA 영상은 도입부 무음 여유 없이 발화가 시작해 "몰랐던"의 "몰"이 씹혀 들리는
문제가 있었다. 오디오는 이미 새로 생성해 해결했지만(0.45초 무음 리드인 확보),
그 오디오에 맞춰 영상 쪽도 처음부터 다시 만들어 **화면 자체가 자연스럽게 시작
동작을 갖도록** 한다 — 음성만 교체하고 영상 앞에 정지 프레임을 붙이는 임시방편은
캐릭터가 순간 얼어붙는 미세한 끊김이 있었다.

## 프롬프트

```
Animate this image into a 9-second video clip. STYLE CONSISTENCY: keep the gold
coin character's design (bright gold coin body, white gloved hands and feet,
smiling friendly face with rosy cheeks) and the bright cozy living room
background exactly as shown in the reference image — same warm daylight tone,
same plant, same framed art, same lamp and sofa, no changes to colors or
setting.

MOTION DETAIL: for the first 0.4-0.5 seconds, the coin character holds a
calm, settled starting pose with its mouth gently closed, as if taking a
breath before speaking — no waving yet, no abrupt pose change. Then it begins
speaking naturally: the character raises one gloved hand in a warm, friendly
wave that continues in a gentle rhythmic motion throughout the clip (not a
single wave then frozen — keep waving softly, on and off, like a natural
greeting gesture sustained over time), while its whole body sways slightly
side to side with a bouncy, cheerful energy appropriate for a warm invitation
to follow the channel. Eyes stay bright and engaged, cheeks stay rosy, smile
stays warm throughout.

STATIC ELEMENTS: the background room, furniture, plant, and framed art must
stay completely fixed — no camera pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION: if any text or icon appears anywhere in the
frame, it must remain pixel-perfect identical to the reference image for the
entire 9 seconds — do not let any character shift, blur, morph, or misspell.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped or misspelled text anywhere in the frame, no
background changes, no character redesign, no abrupt cut or freeze mid-motion,
no static mouth, no minimal lip movement, no closed-mouth talking, no frozen
expression while speaking.

MOUTH MOVEMENT: after the initial 0.4-0.5 second settled pause, the character's
mouth actively opens and closes continuously in natural speech rhythm for the
remainder of the clip, as if energetically and warmly explaining/inviting —
never static, never barely-moving, never closed-mouth talking, even while
smiling.
```

## 참고
- 이 프롬프트는 CURRENT_STANDARDS.md의 영상 생성 5요소(스타일유지/동작디테일/
  정지요소/부정프롬프트/입움직임)를 전부 포함했다.
- "0.4-0.5초 정지된 시작 포즈"를 명시적으로 요청한 것은, 기존 문제(리드인 없이
  바로 시작)를 영상 생성 단계에서부터 예방하기 위함이다 — 이 여유 구간에 맞춰
  오디오도 무음 리드인이 있으므로 자연스럽게 맞아떨어진다.
- 생성 후 프레임 확인 시 이 초반 구간이 완전한 정지가 아니라 "숨 고르는 듯한
  미세한 움직임"으로 보이는지 확인할 것 — 완전 정지면 이전과 같은 문제가
  재발할 수 있다.
- 생성 완료 후 새 오디오(`C:/tmp/geumbaksa-cta-review/cta_v2_trimmed.m4a`)와
  길이를 맞춰(약 8.93초) mux할 것.
