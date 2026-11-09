# 금박사 11편 영상 생성 프롬프트 — Gemini 즉시거부 대응판(2026-09-28)

★ 원본 문서(`geumbaksa-ep11-video-generation-prompts.md`)는 Gemini에서 이미지
업로드+프롬프트 입력 후 5초 이내 "I seem to be encountering an error" /
"Sorry, something went wrong"로 전 씬 즉시 거부됨. 같은 이미지·같은 내용으로
Flow는 정상 생성됨 — 콘텐츠 자체가 아니라 **프롬프트 문구가 Gemini 안전
필터에 걸린 것**으로 판단.

## 원인 추정
원본 문서에만 있고, 이전에 성공했던 황소특보 4편·부엉박사 17편 프롬프트에는
없는 표현:
- **"permanently glued to the character's hands"** — 손에 "영구 접착"이라는
  표현이 신체 변형/접합처럼 읽혀 Gemini 안전 필터에 걸렸을 가능성이 가장 높음.
- "white-gloved hands"를 매 씬 반복 — 장갑 자체는 캐릭터 디자인상 정상이지만,
  "손"을 계속 강조하는 문구와 겹쳐 안전 검토를 유발했을 가능성.
- "NO EMPTY-HANDED POSE AT ANY POINT" 같은 극단적 절대 부정 표현 반복.

이 판에서는 위 표현을 전부 제거하고, 기존에 실제로 통과한 적 있는 중립적
표현("holds steadily at", "does not move")으로만 카드 고정을 지시한다. 다른
내용(카드 문구, 동작, 배경, 8초/10초 티어)은 원본과 동일하다.

이미지 소스 폴더: `C:/tmp/geumbaksa-ep11-images-1080/`(1080x1920으로 리사이즈된 버전)
영상 저장 폴더: `C:/tmp/geumbaksa-ep11-videos/`

================================================================================
# 🟦 8초 티어 (s1, s2, s3, s4, s6, s7)
================================================================================

---

## s1 — hook (8초, 카드 감싸쥠, 질문→답 통합)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the HR/labor-contract consultation
desk background exactly as shown in the reference image — same payslip and
labor-contract poster signage, same desk, plants, warm lighting. Do not
change any colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — no zoom, no dolly, no framing drift at any point,
including the final 1-2 seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "안 나가도?" on the top line and "주휴수당" in red on the
bottom line — in both hands at chest height. The card holds steadily at
this position for the entire clip, from frame 1 to the very last frame,
and does not move, tilt, rotate, or drift at any point. Treat the card as a
frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression shifts from curious and puzzled
(wide eyes, slightly tilted head) in the first half to a confident, bright
smile in the second half, as if first posing a question and then
confidently answering it. Both hands stay wrapped around the card the
whole time.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character
shows visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks every 2-3 seconds, subtle body
bounces or tilts, cheeks staying rosy, continuous mouth movement while
speaking. This motion comes from the face and body tilt only — the hands
holding the card stay steady and in place for the full clip.

STATIC ELEMENTS: the payslip poster, labor-contract poster, desk, plants,
calculator, and clipboard stay completely fixed — no camera pan or zoom,
no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("안
나가도?", "주휴수당") and the background poster text ("급여명세서",
"근로계약서") as locked, non-regenerating image layers for the full 8
seconds, including the very last frame. Render these exactly as pixels
copied from the reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card
tilt or rotation at any point, no camera zoom or framing drift at any
point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, transitioning
from a curious tone to a confident, cheerful tone — never static, never
frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep11-videos/geumbaksa_ep11_s1_hook_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s2 — opening (8초, 소품 없음, 인사)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the HR/labor-contract consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — no zoom, no dolly, no framing drift at any
point, including the final 1-2 seconds.

MOTION DETAIL: the character raises one hand in a friendly wave (a
natural, continuous small wave motion, not a static held pose) while the
other arm rests at its side, greeting the viewer with a big warm smile. No
props held.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character
shows visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks every 2-3 seconds, gentle continuous
waving motion, subtle body bounces, continuous mouth movement while
speaking.

STATIC ELEMENTS: the payslip poster, labor-contract poster, desk, plants,
calculator, and clipboard stay completely fixed — no camera pan or zoom,
no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the background poster
text ("급여명세서", "근로계약서") as locked, non-regenerating image layers
for the full 8 seconds. Render these exactly as pixels copied from the
reference image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, or flickering surfaces anywhere in
the frame, no regenerated or reinterpreted signage, no background changes,
no character redesign, no abrupt cut or freeze mid-motion, no static
expression, no frozen pose while speaking, no camera zoom or framing
drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
greeting the viewer — never static, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep11-videos/geumbaksa_ep11_s2_opening_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s3 — target (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the HR/labor-contract consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — no zoom, no dolly, no framing drift at any
point, including the final 1-2 seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "주 15시간 이상" on the top line and "+ 개근" in red on the
bottom line — in both hands at chest height. The card holds steadily at
this position for the entire clip, from frame 1 to the very last frame,
and does not move, tilt, rotate, or drift at any point. Treat the card as
a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is calm and instructive, as if
clearly explaining a qualifying condition to the viewer.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character
shows visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks every 2-3 seconds, subtle body
bounces, continuous mouth movement while speaking. This motion comes from
the face and body only — the hands holding the card stay steady and in
place for the full clip.

STATIC ELEMENTS: the payslip poster, labor-contract poster, desk, plants,
calculator, and clipboard stay completely fixed — no camera pan or zoom,
no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("주
15시간 이상", "+ 개근") and the background poster text as locked,
non-regenerating image layers for the full 8 seconds, including the very
last frame. Render these exactly as pixels copied from the reference
image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card
tilt or rotation at any point, no camera zoom or framing drift at any
point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if calmly
explaining a condition — never static, never frozen even in the final
seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep11-videos/geumbaksa_ep11_s3_target_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s4 — target_detail (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the HR/labor-contract consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — no zoom, no dolly, no framing drift at any
point, including the final 1-2 seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "알바 ="
on the left and "정규직" on the right with an equals-sign icon between
them, in both hands at chest height. The card holds steadily at this
position for the entire clip, from frame 1 to the very last frame, and
does not move, tilt, rotate, or drift at any point. Treat the card as a
frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is bright and cheerful, as if
happily reassuring the viewer that the rule applies broadly.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character
shows visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks every 2-3 seconds, subtle body
bounces, continuous mouth movement while speaking. This motion comes from
the face and body only — the hands holding the card stay steady and in
place for the full clip.

STATIC ELEMENTS: the payslip poster, labor-contract poster, desk, plants,
calculator, and clipboard stay completely fixed — no camera pan or zoom,
no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("알바
=", "정규직") and the background poster text as locked, non-regenerating
image layers for the full 8 seconds, including the very last frame. Render
these exactly as pixels copied from the reference image, unchanged frame
to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card
tilt or rotation at any point, no camera zoom or framing drift at any
point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if brightly
clarifying the rule applies to everyone — never static, never frozen even
in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep11-videos/geumbaksa_ep11_s4_target_detail_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s6 — feel_conversion (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the HR/labor-contract consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — no zoom, no dolly, no framing drift at any
point, including the final 1-2 seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "한 달
약" on the top line and "37만원" in large red text with a small coin icon
on the bottom line, in both hands at chest height. The card holds steadily
at this position for the entire clip, from frame 1 to the very last frame,
and does not move, tilt, rotate, or drift at any point. Treat the card as
a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is warm and pleased, as if
sharing good news about extra money.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character
shows visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks every 2-3 seconds, subtle body
bounces, continuous mouth movement while speaking. This motion comes from
the face and body only — the hands holding the card stay steady and in
place for the full clip.

STATIC ELEMENTS: the payslip poster, labor-contract poster, desk, plants,
calculator, and clipboard stay completely fixed — no camera pan or zoom,
no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("한 달
약", "37만원") and the background poster text as locked, non-regenerating
image layers for the full 8 seconds, including the very last frame. Render
these exactly as pixels copied from the reference image, unchanged frame
to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card
tilt or rotation at any point, no camera zoom or framing drift at any
point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
sharing good news — never static, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep11-videos/geumbaksa_ep11_s6_feel_conversion_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s7 — longterm_simulation (8초, 카드 감싸쥠)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the HR/labor-contract consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 8 seconds — no zoom, no dolly, no framing drift at any
point, including the final 1-2 seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "1년 약"
on the top line and "445만원" in large red text with a small rising-graph
icon on the bottom line, in both hands at chest height. The card holds
steadily at this position for the entire clip, from frame 1 to the very
last frame, and does not move, tilt, rotate, or drift at any point. Treat
the card as a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression is confident and assured, as if
proudly presenting the yearly total.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character
shows visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks every 2-3 seconds, subtle body
bounces, continuous mouth movement while speaking. This motion comes from
the face and body only — the hands holding the card stay steady and in
place for the full clip.

STATIC ELEMENTS: the payslip poster, labor-contract poster, desk, plants,
calculator, and clipboard stay completely fixed — no camera pan or zoom,
no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("1년
약", "445만원") and the background poster text as locked, non-regenerating
image layers for the full 8 seconds, including the very last frame. Render
these exactly as pixels copied from the reference image, unchanged frame
to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card
tilt or rotation at any point, no camera zoom or framing drift at any
point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if
confidently presenting the yearly total — never static, never frozen even
in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep11-videos/geumbaksa_ep11_s7_longterm_simulation_motion.mp4`로 저장
2. 시작·중반·끝(7~8초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

================================================================================
# 🟨 10초 티어 (s5, s8)
================================================================================

---

## s5 — method (10초, 카드 감싸쥠, 계산식+예시 통합)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the HR/labor-contract consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — no zoom, no dolly, no framing drift at any
point, including the final 1-2 seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card with two lines of
large text — "시급 × 8시간" on the top line and "하루 85,600원" in red on
the bottom line — in both hands at chest height. The card holds steadily
at this position for the entire clip, from frame 1 to the very last frame,
and does not move, tilt, rotate, or drift at any point. Treat the card as
a frozen photograph layered in front of the character.

MOTION DETAIL: the character's expression starts clear and instructive
while walking through the formula, then shifts to confident and assured
when revealing the resulting amount.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character
shows visible, continuous motion for the ENTIRE 10 seconds, including the
last 2-3 seconds — natural eye blinks every 2-3 seconds, subtle body
bounces, continuous mouth movement while speaking. This motion comes from
the face and body only — the hands holding the card stay steady and in
place for the full clip.

STATIC ELEMENTS: the payslip poster, labor-contract poster, desk, plants,
calculator, and clipboard stay completely fixed — no camera pan or zoom,
no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("시급
× 8시간", "하루 85,600원") and the background poster text as locked,
non-regenerating image layers for the full 10 seconds, including the very
last frame. Render these exactly as pixels copied from the reference
image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static expression, no frozen pose while speaking, no card
tilt or rotation at any point, no camera zoom or framing drift at any
point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, transitioning
from clearly explaining a formula to confidently revealing the resulting
amount — never static, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep11-videos/geumbaksa_ep11_s5_method_motion.mp4`로 저장
2. 시작·중반·끝(9~10초) 프레임 확인 — 카드가 끝까지 들려 있는지 최우선 확인
3. 문제 없으면 다음 씬 진행

---

## s8 — closing (10초, 카드 감싸쥠+마무리 손짓 통합, 마지막 씬)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
gold coin mascot character's design and the HR/labor-contract consultation
desk background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE 10 seconds — no zoom, no dolly, no framing drift at any
point, including the final 1-2 seconds.

PROP LOCK (HIGHEST PRIORITY): the character holds a card reading "신청
없이" on the top line and "자동 지급" in red on the bottom line in one
hand at chest height. The card holds steadily at this position for the
entire clip, from frame 1 to the very last frame, and does not move,
tilt, rotate, or drift at any point. Treat the card as a frozen photograph
layered in front of the character. The character's other hand (empty)
gently waves beside its head in a natural, continuous small wave motion,
as if warmly wrapping up and reminding the viewer to double-check with
their employer.

MOTION DETAIL: the character's expression is bright, warm, and friendly
throughout, as if delivering reassuring closing advice.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY, THIS IS THE FINAL
SCENE OF THE EPISODE — DO NOT LET IT GO STATIC): the character shows
visible, continuous motion for the ENTIRE 10 seconds, including the last
2-3 seconds — natural eye blinks every 2-3 seconds, gentle continuous
waving motion from the free hand, subtle body bounces, continuous mouth
movement while speaking. The hand holding the card stays steady and in
place for the full clip even while the other hand waves.

STATIC ELEMENTS: the payslip poster, labor-contract poster, desk, plants,
calculator, and clipboard stay completely fixed — no camera pan or zoom,
no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the card text ("신청
없이", "자동 지급") and the background poster text as locked,
non-regenerating image layers for the full 10 seconds, including the very
last frame. Render these exactly as pixels copied from the reference
image, unchanged frame to frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, or flickering surfaces anywhere in
the frame, no regenerated or reinterpreted signage, no background changes,
no character redesign, no abrupt cut or freeze mid-motion, no static
expression, no frozen pose while speaking, no rigid locked pose for the
second half of the clip, no card tilt or rotation at any point, no camera
zoom or framing drift at any point.

MOUTH MOVEMENT: the character's mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly
concluding with practical advice — never static, never frozen even in the
final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/geumbaksa-ep11-videos/geumbaksa_ep11_s8_closing_motion.mp4`로 저장
2. 시작·중반(4~5초)·끝(9~10초) 프레임 전부 확인 — 마지막 씬이므로 후반부 정지 여부, 카드가 끝까지 들려 있는지 특히 꼼꼼히 확인
3. 8개 씬 전부 완료 후 본편 조립(`run-owl-assemble-shorts-v2.mjs`,
   `--spec-module ./_geumbaksa-ep11-assembly-spec.mjs --spec-export
   GEUMBAKSA_ASSEMBLY_SPEC`, `--clip-dir C:/tmp/geumbaksa-ep11-videos`) →
   고정 CTA 연결(`run-owl-episode-with-fixed-cta-once.mjs`, 금박사 고정 CTA
   `C:\tmp\geumbaksa-cta-fixed-clean\geumbaksa_cta_clean_final_v3voice.mp4`,
   `--alignment` 필수)
