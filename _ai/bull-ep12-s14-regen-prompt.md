# 황소특보 12편 s14 재생성 프롬프트 (강화판, 10초)

- 이미지: `C:/tmp/bull-ep12-images/bull_ep12_s14.png`
- 저장: `C:/Users/PC/Downloads/14.mp4`로 덮어쓰기 (이전 8초본은 `14_old.mp4`로 바꿔 두기)
- **이번에 바뀐 점**: ① 티어 8초 → **10초**(8초 클립은 끝 0.5~1초에서 글자가 사라짐 — s14 7.3s 흐려짐→7.9s 빈 보드. 10초면 그 구간이 사용 구간 7.56초 밖으로 밀림) ② 글자 보존 문구에 "끝 프레임까지 선명, fade/dissolve/wash-out 금지" 추가 ③ 입 멈춤을 2단계(말하는 구간 / 듣는 구간 입 완전히 닫음·음성 없음)로 강화하고 끝에 FINAL REMINDER 추가
- 나머지 15개 영상은 그대로 쓴다(재생성 없음).
- 확인할 것: 시작·중반·끝(특히 9~10초) 프레임에서 보드 글자가 선명한지, 입이 6.7초 이후 닫혀 있는지.

## s14 — action (10초, board, 입 멈춤 6.7초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold bull mascot character's design and the warm night-view investment lounge
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with 2 lines of
large text — "① 쏠림 계속?" on the first line, "② 내 종목은?" on the second line — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: the character's free hand keeps two fingers raised and gives small emphasizing motions, with a clear, helpful expression, while the other hand rests near its hip. The character does not touch or move the board.

SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from 0.0s to 6.7s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from 6.7s to the very last frame (3.3 seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after 6.7s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at 6.7s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE 10 seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. The board stays completely still.

STATIC ELEMENTS: the large curved glass window with the low-poly night city skyline, the low wooden table, the round armchairs, the large potted plants, and the warm wooden floor
must stay completely fixed — no camera pan or zoom, no background object
movement, no board movement, no board falling or sliding.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the board text ("① 쏠림 계속?", "② 내 종목은?") as locked, non-regenerating image layers for the full
10 seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and standing at the end.
The text must be exactly as dark, sharp and fully readable in the LAST frame as in the FIRST frame.
NO fade-out, NO dissolve, NO cross-fade, NO fade to white, NO washing-out, NO blurring and NO
disappearing of the board or its text at any moment — especially in the final 2 seconds. The clip must
not end with any transition effect; the last frame is a normal frame identical in text to the first.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking, voice, mumbling or lip movement after 6.7s, NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, no fade, dissolve, wash-out or disappearance of the text or props in the final seconds, no camera zoom, crop, or framing drift at any point.

MOOD: clearly listing two things to check.

FINAL REMINDER (read this last): the voice and all mouth movement STOP at 6.7s. The last 3.3 seconds are silent, with the mouth closed, and the board text stays fully visible until the final frame.
```

---
