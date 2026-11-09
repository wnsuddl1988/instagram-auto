# 부엉박사 14편 s6 영상 재생성 프롬프트 (팩트 수정: 기금 소진 2056 → 2064년) — 수동 진행용

**사유(2026-09-29)**: 기존 s6 영상(v1 재사용)의 보드가 "기금 소진 2071년으로 연장"이었는데, 2056년(수익률 4.5% 가정)과 2071년(수익률 5.5% 가정)은 가정이 달라 개혁 효과로 직접 비교할 수 없다(같은 4.5% 기준 개혁 효과는 2064년, 8년 연장). 대사·보드를 "2056년 → 2064년"으로 교체했다.

이미지 소스: `C:/tmp/owl-v2-ep14-images-s6fix/owl_v2_ep14_s6_why.png` (카드 '기금 소진' / '2056년 → 2064년', 글자·배경·캐릭터 크기 검수 통과)
영상 전달: `C:/Users/PC/Downloads/6.mp4` 로 저장("부엉박사 14편 6번"이라고 알려주기). 나머지 13장면은 기존 영상 그대로 쓴다.

| 씬 | 카드 문구 | 새 TTS 발화(raw) | 사용 길이 | 요청 |
|---|---|---|---|---|
| s6 why | 기금 소진 / 2056년 → 2064년 | 7.55초 | 8.42초 | **10초** (8초 티어는 사용 길이 초과) |

★ 카드를 든 날개는 한 지점 고정, 동작은 카드를 가리키는 빈 날개에만(글자를 가리지 않음), "Silent" 금지.

================================================================================
# 🟨 10초 티어 (s6)
================================================================================

## s6 — why (10초, 카드 감싸 쥠 + 빈 날개로 카드 가리킴)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright public pension consultation counter background exactly as shown in
the reference image. Do not change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds.

PROP LOCK (HIGHEST PRIORITY): the card reading "기금 소진" on the first line and "2056년 → 2064년" on the second line is held firmly by the character's
left wing (screen-right side) and holds steadily at exactly its current
position and angle for the ENTIRE 10 seconds — the card never moves, tilts,
slides, slips, or drops at any point, especially not in the final 2-3
seconds. Treat the card as a frozen photograph layered in front of the
character's wing.

MOTION DETAIL: only the character's other wing (screen-left side, already extended toward the card in a pointing pose) moves — it makes small pointing gestures toward the card text as if explaining, then relaxes slightly and points again, never touching or covering the card text. The wing holding the card does not move at all.
Serious, explanatory expression; no broad smile.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous beak movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This continuous motion must never be achieved by moving or dropping the card.

STATIC ELEMENTS: the card, the "연금 상담 창구" wall sign, the blue pension lookup screen, the navy chairs, the counter desks, and the plants must stay completely fixed — no camera
pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text
("기금 소진", "2056년 → 2064년") and the background sign ("연금 상담 창구") as locked, non-regenerating image layers for
the full 10 seconds. Render these exactly as pixels copied from the reference
image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal beak movement, no closed-mouth
talking, no frozen expression while speaking, no card dropping, falling,
slipping, tilting, or motion blur at any point, no wing passing in front of
the card text, no full-body freeze at any point, no holding completely still
for more than half a second anywhere in the clip, NO CAMERA ZOOM OR FRAMING
DRIFT AT ANY POINT INCLUDING THE LAST SECOND, NO CARD MOVEMENT OR DROP AT
ANY POINT INCLUDING THE LAST SECOND.

MOUTH MOVEMENT: the character's beak actively opens and closes
continuously in natural speech rhythm for the entire clip, as if explaining why the pension fund needed the change — never
static, never barely-moving, never closed-mouth talking, never frozen even
in the final seconds.
```

## 완료 후 절차
1. `6.mp4`를 저장하고 "부엉박사 14편 6번"이라고 알려주면 길이·끝부분 프레임·글자 보존을 검수한다.
2. 통과하면 조립 + 고정 CTA 결합(TTS는 `output-v2` 사용) → 커버·스토리는 기존 것 재사용 → 배포 승인 확인.
