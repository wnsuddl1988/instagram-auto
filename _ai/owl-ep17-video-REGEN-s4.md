# 부엉박사 17편 s4 영상 재생성 프롬프트 — 수동 진행용

이미지 소스: `C:/tmp/owl-ep17-images/owl_ep17_s4_definition.png` (이미지는 그대로 사용 — 보드 글자 정상)
저장할 영상: `C:/Users/PC/Downloads/부엉박사 17편/4.mp4` 로 받아 주면 검수 후 `C:/tmp/owl-ep17-videos/owl_ep17_s4_definition_motion.mp4`로 교체한다.

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 실측 발화(raw) | 요청 티어 | 예상 여유 |
|---|---|---|---|---|---|
| s4 definition | `owl_ep17_s4_definition.png` | `owl_ep17_s4_definition_motion.mp4` | 5.30초 | **8초** | 2.70초 |

## 재생성 사유 (2026-09-26 검수)

- 1차 영상: 0~4.0초 정상 → 4.5~5.5초 포인터를 쥔 날개가 오른쪽 "국민주택" 라벨 위를 쓸고 지나감 →
  5.5초 이후 라벨이 **"창팡힐힌"**으로 다시 그려짐. 조립 사용 구간이 6.00초라 완성본 28.4~28.8초에 노출.
- 원인: 이미지에서 포인터를 쥔 날개에 1차 프롬프트가 동작("raises one wing gently toward it")을 줬다.
  §0-1 규칙 2(동작은 소품을 안 든 빈 날개에만, 소품 든 날개는 고정) 위반 패턴.
- 조치: 포인터 쥔 날개는 완전 고정, 동작은 반대쪽 빈 날개에만. 포인터가 라벨을 가리지 않게 명시.

================================================================================
# 🟦 8초 티어 (s4)
================================================================================

## s4 — definition (8초, 보드 바닥 거치 + 포인터 고정)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the housing subscription consultation
counter background exactly as shown in the reference image. Do not change
any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — absolutely no zoom in, no zoom out, no dolly, no
framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): a floor-standing easel board on the left shows
two panels — a blue panel reading "청약예금 부금" with a down arrow to
"민영주택", and a green panel reading "청약저축" with a down arrow to
"국민주택". The board remains completely rigid, standing upright on the
floor for the entire clip — it does not tip over, rotate, slide, or fall at
any point, including the final 1-2 seconds. Treat the board as a frozen
photograph layered beside the character, fixed to the floor. The wooden
pointer stick held in the character's right wing (screen-left side) holds
steadily at exactly its current angle and position for the entire clip —
the pointer and the wing holding it do not move, do not sweep, and never
pass in front of the "국민주택" or "민영주택" labels.

MOTION DETAIL: only the character's other wing (screen-right side, holding
no prop) moves — it lifts slightly and opens outward in a gentle
explanatory gesture, then settles back, staying on the right side of the
body and never crossing in front of the board. The wing holding the
pointer does not move at all.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by
moving the pointer, tipping the board, or regenerating the board text.

STATIC ELEMENTS: the easel board (including its full text, arrows, and
building illustrations, and its floor position), the pointer stick, the
"청약통장 안내" poster, the "주택청약 상담" desk sign, the apartment model,
and the plants must stay completely fixed — no camera pan or zoom, no
background object movement, no board movement or tipping.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text
("청약예금 부금", "민영주택", "청약저축", "국민주택"), the poster text
("청약통장 안내"), and the desk sign ("주택청약 상담") as locked,
non-regenerating image layers for the full 8 seconds. Render these exactly
as pixels copied from the reference image, unchanged frame to frame. No
wing, feather, or pointer may cover any of these labels at any time.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no pointer movement or
sweeping, no wing passing in front of the board, no board tipping over,
sliding, or falling at any point, no full-body freeze at any point, no
holding completely still for more than half a second anywhere in the clip,
NO CAMERA ZOOM OR FRAMING DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO
BOARD OR POINTER MOVEMENT AT ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes
continuously in natural speech rhythm for the entire clip, as if clearly
explaining the difference between the two account types — never static,
never barely-moving, never closed-mouth talking, never frozen even in the
final seconds.
```

## 완료 후 절차
1. `C:/Users/PC/Downloads/부엉박사 17편/4.mp4`로 저장 → Claude가 검수 후 `owl_ep17_s4_definition_motion.mp4`로 교체
2. 시작·중반·끝 프레임 + **0~6.0초 구간의 "국민주택" 라벨**을 0.5초 간격으로 확인
3. 통과 시 조립(§A-7) → CTA 결합(`--alignment`)을 한 번에 재실행해 완성본 교체
