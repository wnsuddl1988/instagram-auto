# 금박사 7편 s11(마무리) 영상 재생성 — 수동 진행용

## 재생성 사유(2026-09-22)
s11 원본 영상(8초 클립)을 오디오(발화 실제 종료 지점 약 9.3초, alignment 타임스탬프
오류로 82.1~83.16초 구간이 "무음"으로 잘못 인식되어 조립 시 화면이 정지 확장됨)에
맞춰 조립했더니, 발화가 끝나기 전에 화면이 멈추고 그 뒤로도 목소리만 계속 나오는
부자연스러운 결과가 나왔다. 근본 해결을 위해 **클립 길이를 10초로 재생성**한다.

이미지 소스(변경 없음): `C:/tmp/geumbaksa-ep7-images/geumbaksa_ep7_s11.png`
저장할 영상 파일명(교체): `ep7_s11_video.mp4` → `C:/tmp/geumbaksa-ep7-videos/ep7_s11_video.mp4`
길이 티어: **10초** (기존 8초에서 변경, 실제 발화 종료 지점 약 9.3초 커버)

★ 영상 생성 절대규칙(87씬 전수조사 확정, `_ai/CURRENT_STANDARDS.md` §0) 반영:
동작은 빈 손에만, 텍스트/보드 없는 씬이라 해당 규칙은 낮은 리스크. 캐릭터 동작만
자연스럽게 늘려서 10초를 채운다(반복이 아니라 지속적인 웨이브+미세한 바디 스웨이).

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold coin character's design (bright gold coin body, white gloved hands and
feet, smiling friendly face with rosy cheeks) and the bright bank
consultation desk background exactly as shown in the reference image. Do not
change any colors, text, or object positions.

MOTION DETAIL: the character raises one gloved hand in a warm greeting wave
that continues in a gentle rhythmic motion throughout the full 10 seconds
(not a single wave then frozen — keep waving softly, on and off, at a slow
relaxed pace so it reads as sustained rather than repetitive), while its
whole body sways gently side to side with cheerful energy, as if warmly
closing out the episode. The other hand stays in a relaxed fist at its side.
Eyes stay bright and engaged, cheeks stay rosy, smile stays warm throughout
the entire clip — do not let the motion loop obviously or the expression
settle into stillness before the 10 seconds end.

STATIC ELEMENTS: the background signage, plants, desk, and furniture must
remain completely still — no camera pan or zoom, no background object
movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
10 seconds — this includes the large wall sign and every other wall banner.
Render these exactly as pixels copied from the reference image, unchanged
frame to frame — do not let the video model regenerate, redraw, reinterpret,
or reflow any of this text, even slightly, even for one frame. If motion
would risk distorting any text, keep that element completely static
instead.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame (large or small), no regenerated or reinterpreted
signage, no background changes, no character redesign, no abrupt cut or
freeze mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no motion stopping or
settling before the clip ends.

MOUTH MOVEMENT: the character's mouth actively opens and closes continuously
in natural speech rhythm for the full 10 seconds, as if warmly closing out
the episode with a friendly reminder — never static, never barely-moving,
never closed-mouth talking, and never stopping before the clip ends.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep7-videos/ep7_s11_video.mp4`로 저장(기존 파일 덮어쓰기)
2. 시작/끝 프레임 검수(텍스트 없음 씬이라 주로 표정·손 동작 자연스러움 확인)
3. 본편 재조립 → CTA 재결합 → 최종본 재검수
