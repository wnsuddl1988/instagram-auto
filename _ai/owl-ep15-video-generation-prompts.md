# 부엉박사 15편(재고, 실업급여 22년 만의 개편) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: `C:/tmp/owl-ep15-images/`
영상 저장 폴더(신규 생성): `C:/tmp/owl-ep15-videos/`

씬 길이 티어는 TTS 실측(`rawAudioDurationSec`, `output-v2/elevenlabs-scene-paced-tts-summary.json`) 기준, CURRENT_STANDARDS.md 원칙(8초 미만→8초, 8초 이상→10초) 그대로 적용. **10초 티어는 "여유가 넉넉한 안전한 선택"이지 위험 신호가 아니다 — needed(화면 필요 길이)가 10초를 넘지만 않으면 항상 안전하다.**

**생성 도구 배정(Owner 지정, 2026-09-24): s6·s8·s9·s10은 Gemini(Veo)로 생성 — Gemini는 요청과 무관하게 항상 10초로 나온다.** s6·s8은 발화 길이 기준으로도 10초가 필요/안전한 씬이고, s9·s10은 발화가 짧아 8초로도 충분하지만 Owner가 이 4개를 Gemini 생성 대상으로 임의 지정했다(제가 판정한 8초/10초 티어와 무관한 별도 배정). 나머지 6개(s1~s5, s7)는 다른 도구(Flow 등)로 생성 — 요청 티어대로 나올 가능성이 높지만 Flow는 편차가 있을 수 있다([[feedback_video_scene_length_tier_smooth_transition]] 참고).

| 씬 | 이미지 소스 | 저장할 영상 파일명 | 프롬프트 표기 길이 | 생성 도구 |
|---|---|---|---|---|
| s1 opening | `owl_ep15_s1_opening.png` | `owl_ep15_s1_opening_motion.mp4` | 8초 (실측 6.90초) | Flow 등 |
| s2 hook | `owl_ep15_s2_hook.png` | `owl_ep15_s2_hook_motion.mp4` | 8초 (실측 5.22초) | Flow 등 |
| s3 fact | `owl_ep15_s3_fact.png` | `owl_ep15_s3_fact_motion.mp4` | 8초 (실측 4.89초) | Flow 등 |
| s4 mechanism | `owl_ep15_s4_mechanism.png` | `owl_ep15_s4_mechanism_motion.mp4` | 8초 (실측 5.48초) | Flow 등 |
| s5 twist | `owl_ep15_s5_twist.png` | `owl_ep15_s5_twist_motion.mp4` | 8초 (실측 5.80초) | Flow 등 |
| s6 consequence | `owl_ep15_s6_consequence.png` | `owl_ep15_s6_consequence_motion.mp4` | **10초** (실측 8.65초, 화면 필요 9.72초) | **Gemini(고정 10초)** |
| s7 evidence | `owl_ep15_s7_evidence.png` | `owl_ep15_s7_evidence_motion.mp4` | 8초 (실측 5.93초) | Flow 등 |
| s8 caveat | `owl_ep15_s8_caveat.png` | `owl_ep15_s8_caveat_motion.mp4` | **10초** (실측 7.06초, 여유 0.94초로 빠듯해 안전하게 10초 선택) | **Gemini(고정 10초)** |
| s9 recommendation | `owl_ep15_s9_recommendation.png` | `owl_ep15_s9_recommendation_motion.mp4` | **10초**(실측 5.39초, 여유 매우 충분) | **Gemini(고정 10초)** |
| s10 action | `owl_ep15_s10_action.png` | `owl_ep15_s10_action_motion.mp4` | **10초**(실측 2.66초, 여유 매우 충분) | **Gemini(고정 10초)** |

★ 영상 생성 절대규칙(87씬 전수조사 확정, `_ai/CURRENT_STANDARDS.md` §0) 전부 반영:
- 소품을 든 손은 **한 지점 고정**("holds steadily at", 이동·반복 왕복 지시 금지)
- **동작은 소품을 안 든 빈 쪽에만** 배정
- 소품·보드는 전부 "frozen photograph layered behind/beside the character"로 명시
- 텍스트는 CRITICAL TEXT PRESERVATION(HIGHEST PRIORITY) 블록으로 고정

★ 추가 규칙: **모든 씬에 "CONTINUOUS MOTION FOR THE FULL CLIP" 블록을 넣어, 클립의 어느 구간도
(특히 후반부) 0.5초 이상 완전히 같은 프레임처럼 고정되지 않도록 명시한다.** 입 모양, 눈 깜빡임,
미세한 머리 움직임이 처음부터 끝까지 끊기지 않아야 한다는 걸 별도 문단으로 강조.

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수할 것** — 시작 프레임뿐 아니라 클립 중반·후반
프레임에서도 텍스트·소품·동작 지속 여부를 확인한다.

================================================================================
# 🟩 Gemini 생성, 10초 고정 (4개 씬: s6·s8·s9·s10)
================================================================================

---

## s6 — consequence (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design (vest, tie, sunglasses pushed up on forehead,
feather texture) and the bright employment policy briefing room background
exactly as shown in the reference image — same green/navy banner ("함께
만드는 일하는 내일"), same podium, same silhouette screen graphic. Do not
change any colors, text, or object positions.

MOTION DETAIL: the character holds the "지급 기간 5개월 → 5.8개월" card
(with a calendar-and-clock icon) steadily in one wing at chest height — the
card does not travel or shift position, treat it as a fixed object the
character is simply holding still. The other wing gestures gently near the
card without touching it. Only the character's head, eyes, and mouth move,
showing a calm, explanatory expression — not smiling.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 3-4 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background banner, podium, screen graphic, plants, and
chairs must stay completely fixed — no camera pan or zoom, no background
object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
10 seconds — this includes the card text ("지급 기간", "5개월", "5.8개월")
and the background banner text. Render these exactly as pixels copied from
the reference image, unchanged frame to frame — do not let the video model
regenerate, redraw, reinterpret, or reflow any of this text, even slightly,
even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if calmly
explaining a policy trade-off — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep15-videos/owl_ep15_s6_consequence_motion.mp4`로 저장
2. 시작 프레임(텍스트), 중반 프레임(5초 지점), 끝 프레임(9초 지점) 전부 확인 — 특히 후반부 정지 여부
3. 문제 없으면 다음 씬 진행

---

## s8 — caveat (10초)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright employment policy briefing room
background exactly as shown in the reference image — same "일하는 사람을
위한 내일" banner, same Korean national flag, same "고용·근로 정책 브리핑"
screen with 일자리/근로환경/노동정책 icons, same podium. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds the clipboard-style warning card showing
"국회 통과 전, 아직 정부안" (with a yellow warning triangle) steadily in one
wing at chest height — the card does not travel or shift position. The other
wing gestures gently near the card without touching it. The character's
expression is serious and cautious, occasional slight head tilt — not
smiling.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 3-4 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background banner, Korean flag, screen graphic,
podium, plants, and chairs must stay completely fixed — no camera pan or
zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
10 seconds — this includes the card text ("국회 통과 전", "아직 정부안"),
the background banner text, and the screen text ("고용·근로 정책 브리핑",
"일자리", "근로환경", "노동정책"). Render these exactly as pixels copied
from the reference image, unchanged frame to frame — do not let the video
model regenerate, redraw, reinterpret, or reflow any of this text, even
slightly, even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if seriously
adding an important caveat — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep15-videos/owl_ep15_s8_caveat_motion.mp4`로 저장
2. 시작 프레임(텍스트), 중반 프레임(5초 지점), 끝 프레임(9초 지점) 전부 확인 — 특히 후반부 정지 여부
3. 문제 없으면 다음 씬 진행

---

## s9 — recommendation (10초, Gemini)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright employment policy briefing room
background exactly as shown in the reference image — same "일하는 국민을
위한 더 나은 내일" screen with 고용안정/근로환경/생활지원 icons, same
Korean national flag, same "사람이 중심인 대한민국" podium sign. Do not
change any colors, text, or object positions.

MOTION DETAIL: the character holds the "국회 통과 소식 확인하기" card (with
a small government building icon) steadily in one wing at chest height —
the card does not travel or shift position. The other wing gestures gently
near the card without touching it. The character's expression is serious
but calm, offering practical advice — not smiling.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 10 seconds, including the
last 3-4 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. The character speaks for roughly the first 5-6 seconds;
during the remaining seconds, keep breathing/blinking/subtle head motion
going rather than freezing.

STATIC ELEMENTS: the background screen, Korean flag, podium sign, plants,
and the card (including its "국회 통과 소식 확인하기" text) must stay
completely fixed — no camera pan or zoom, no background object movement, no
card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
10 seconds — this includes the card text and the background screen text
("일하는 국민을 위한 더 나은 내일", "고용 안정", "근로 환경", "생활
지원"). Render these exactly as pixels copied from the reference image,
unchanged frame to frame — do not let the video model regenerate, redraw,
reinterpret, or reflow any of this text, even slightly, even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm while speaking, as if calmly offering
practical advice — never static, never barely-moving, never closed-mouth
talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep15-videos/owl_ep15_s9_recommendation_motion.mp4`로 저장
2. 시작 프레임(텍스트), 중반 프레임(5초 지점), 끝 프레임(9초 지점) 전부 확인 — 특히 후반부 정지 여부
3. 문제 없으면 다음 씬 진행

---

## s10 — action (10초, Gemini, 최종 씬)

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright employment policy briefing room
background exactly as shown in the reference image — same "국민과 함께
만드는 내일" banner, same Korean national flag, same "더 나은 내일 함께
만드는 일자리" screen. Do not change any colors, text, or object positions.

MOTION DETAIL: the character holds the "지금 바로 팔로우" card (with a
person-plus icon and a pointing hand cursor icon) steadily in one wing at
chest height, showing it toward the camera with a warm, friendly smile —
gentle smile is appropriate here (wrap-up tone, softer than other scenes).
The card does not travel or shift position. The other wing gestures gently
near the card without touching it.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY, THIS IS THE FINAL
SCENE — DO NOT LET IT GO STATIC): the character must show visible,
continuous motion for the ENTIRE 10 seconds, including the last 4-5 seconds
— natural eye blinks at least every 2-3 seconds, subtle head nods, gentle
breathing motion, continuous mouth movement while speaking. No portion of
the clip, especially the back half, should hold a single frozen pose for
more than half a second. The character's speech is short (about 2.7
seconds); after speech ends, the character keeps a warm, gently smiling,
breathing/blinking presence for the remaining seconds rather than freezing
into a static held expression.

STATIC ELEMENTS: the background banner, Korean flag, screen graphic,
plants, and the card (including its "지금 바로 팔로우" text and icons) must
stay completely fixed — no camera pan or zoom, no background object
movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY, READ THIS TWICE): treat every
text-bearing surface in this frame as a locked, non-regenerating image
layer for the full 10 seconds. The background screen shows four short
Korean labels under three icons, plus two headline lines above them. Render
ALL of them exactly as pixels copied from the reference image — do not
regenerate, redraw, reinterpret, or reflow a single character, even for one
frame:
- Headline line 1: "더 나은 내일"
- Headline line 2: "함께 만드는 일자리"
- Label under icon 1 (leftmost, people icon): "고용 안정" — this is TWO
  Korean syllable blocks, 고(go) and 용(yong), forming the word "고용"
  meaning "employment", followed by 안정(an-jeong) meaning "stability". Do
  NOT render this as "고응 안정", "고응 안경", or any other variant — the
  first character is 고(consonant ㄱ + vowel ㅗ, NO final consonant/batchim),
  the second character is 용(consonant ㅇ + vowel ㅛ + final consonant
  ㅇ/batchim). This exact two-character word "고용" has been misrendered in
  prior attempts — pay special, deliberate attention to copying these two
  characters pixel-for-pixel from the reference image, more carefully than
  any other text in the scene.
- Label under icon 2 (middle, upward chart icon): "근로 환경"
- Label under icon 3 (rightmost, two-people icon): "생활 지원"
- Also the left-side vertical banner: "국민과 함께 만드는 내일"
- Also the podium sign: "일하는 사람이 행복한 대한민국"
- Also the card text: "지금 바로 팔로우"

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small). SPECIFICALLY FORBIDDEN
MISSPELLINGS to avoid at all cost: do not render "고용" (employment) as
"고응", "고웅", or "고엉" — the label must read "고용 안정", never "고응
안정" or "고응 안경". No regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no static mouth, no minimal lip movement, no closed-mouth
talking, no frozen expression while speaking, no card movement, NO
FULL-BODY FREEZE AT ANY POINT, no holding completely still for more than
half a second anywhere in the clip, no rigid locked pose for the second
half of the clip.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm while speaking, as if warmly wrapping
up with a friendly call to action — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep15-videos/owl_ep15_s10_action_motion.mp4`로 저장
2. 시작 프레임에서 **배경 스크린의 "고용 안정" 텍스트, 특히 "고용" 두 글자를 확대해서 반드시 재확인** — 1차 생성분은 "고응 안경"/"근로 한경"으로, 2차 생성분은 "근로 환경"은 고쳐졌으나 "고용"만 "고응"으로 계속 깨진 사고가 있었음(CURRENT_STANDARDS §0 규칙4: 텍스트 깨짐은 0.1초부터 확정, 시작 프레임 검수로 충분)
3. 중반(5초)·끝(9초) 프레임도 확인 — 발화 종료 후(약 2.7초 이후) 후반부가 정지되지 않는지 확인
4. **3차 시도에도 "고용"이 계속 깨지면**, 영상 재생성을 중단하고 조립 단계에서 ffmpeg로 해당 구간에 "고용 안정" 텍스트를 오버레이해 가리는 방식으로 전환할 것(Owner 승인 필요) — 같은 두 글자가 반복적으로 실패하는 건 CURRENT_STANDARDS §0의 "프롬프트를 더 강하게 써도 한계가 확인됐다" 패턴과 유사할 수 있음
5. Gemini 4개 씬(s6·s8·s9·s10) + Flow 등 6개 씬(s1~s5·s7) 전부 완료 후 본편 조립 진행

================================================================================
# 🟦 Flow 등 생성, 8초 요청 (6개 씬: s1·s2·s3·s4·s5·s7)
================================================================================

---

## s1 — opening (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design (vest, tie, sunglasses pushed up on forehead,
feather texture) and the bright employment policy briefing room background
exactly as shown in the reference image — same "근로 지원" banner, same
"정책 브리핑" podium sign, same "고용 정책" screen graphic with "함께 만드는
더 좋은 일자리" text. Do not change any colors, text, or object positions.

MOTION DETAIL: the character greets the viewer with one wing raised in a
gentle waving gesture at chest height, confident and serious expression —
not smiling. The wing motion is a small, natural greeting gesture (a slight
lift and settle), not a large sweeping wave. The other wing rests calmly by
its side.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second. This is a confident, ongoing greeting, not a static
portrait.

STATIC ELEMENTS: the background signage ("근로 지원" banner, "정책 브리핑"
podium sign, "고용 정책" screen), chairs, and plants must stay completely
fixed — no camera pan or zoom, no background object movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the "근로 지원" banner, the "정책 브리핑" podium
sign, and the "고용 정책" / "함께 만드는 더 좋은 일자리" screen text. Render
these exactly as pixels copied from the reference image, unchanged frame to
frame — do not let the video model regenerate, redraw, reinterpret, or
reflow any of this text, even slightly, even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no full-body
freeze at any point, no holding completely still for more than half a
second anywhere in the clip.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if warmly and
confidently greeting the viewer — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep15-videos/owl_ep15_s1_opening_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s2 — hook (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright employment policy briefing room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds the "줄어든다? 늘어난다?" card (with a
large question mark) steadily in one wing at chest height — the card does
not travel or shift position. The other wing gestures gently near the
chin/head area (not touching the card), and the character's head tilts
slightly, showing a curious, puzzled expression — not smiling.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, chairs, plants, and the card
(including its "줄어든다?", "늘어난다?" text and question mark) must stay
completely fixed — no camera pan or zoom, no background object movement, no
card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("줄어든다?", "늘어난다?") and the
background banner/screen text. Render these exactly as pixels copied from
the reference image, unchanged frame to frame — do not let the video model
regenerate, redraw, reinterpret, or reflow any of this text, even slightly,
even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if curiously
posing a question to the viewer — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep15-videos/owl_ep15_s2_hook_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s3 — fact (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright employment policy briefing room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds the "실업급여 22년 만의 개편" card
steadily in one wing at chest height — the card does not travel or shift
position. The other wing gestures gently near the card without touching it.
The character's expression is calm and matter-of-fact, explaining an
announcement — not smiling.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, chairs, plants, and the card
(including its "실업급여 22년 만의 개편" text) must stay completely fixed —
no camera pan or zoom, no background object movement, no card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text ("실업급여 22년 만의 개편") and the
background banner/screen text. Render these exactly as pixels copied from
the reference image, unchanged frame to frame — do not let the video model
regenerate, redraw, reinterpret, or reflow any of this text, even slightly,
even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if calmly
stating an announcement — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep15-videos/owl_ep15_s3_fact_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s4 — mechanism (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright employment policy briefing room
background exactly as shown in the reference image — same "더 좋은 일자리,
더 밝은 내일" banner, same standing board with "주 7일치" (blue calendar)
and "주 6일치" (green calendar) split panels. Do not change any colors,
text, or object positions.

MOTION DETAIL: the character stands beside the board, calmly explaining with
one wing gesturing gently toward the board (not touching it, not moving it)
— the board is a fixed standing object on the floor, never held or lifted.
The character's expression is thoughtful and explanatory, occasional gentle
head turn between the board and the viewer.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background banner, the standing board (including "주
7일치", "주 6일치" text and calendar icons), podium, plants, and chairs must
stay completely fixed — no camera pan or zoom, no background object
movement, no board movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the board text ("주 7일치", "주 6일치") and the
background banner text ("더 좋은 일자리", "더 밝은 내일"). Render these
exactly as pixels copied from the reference image, unchanged frame to
frame — do not let the video model regenerate, redraw, reinterpret, or
reflow any of this text, even slightly, even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no board
movement, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if calmly
explaining a calculation method change — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep15-videos/owl_ep15_s4_mechanism_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s5 — twist (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright employment policy briefing room
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds the "월 지급액: 198만원 → 176만원 감소"
card (with a blue downward arrow) steadily in one wing at chest height — the
card does not travel or shift position. The other wing gestures gently near
the card without touching it. The character's expression is surprised and
slightly concerned — not smiling.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background signage, chairs, plants, and the card
(including its "월 지급액", "198만원", "176만원", "감소" text) must stay
completely fixed — no camera pan or zoom, no background object movement, no
card movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text and the background banner/screen
text. Render these exactly as pixels copied from the reference image,
unchanged frame to frame — do not let the video model regenerate, redraw,
reinterpret, or reflow any of this text, even slightly, even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if surprised
while revealing a decrease — never static, never barely-moving, never
closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep15-videos/owl_ep15_s5_twist_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 문제 없으면 다음 씬 진행

---

## s7 — evidence (8초)

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the
owl mascot character's design and the bright employment policy briefing room
background exactly as shown in the reference image — same "고용·근로 정책
발표" screen with people/document/briefcase icons. Do not change any
colors, text, or object positions.

MOTION DETAIL: the character holds the "재취업 월소득 300만원 이상 제외"
card (with a red prohibition icon over a person-and-coins symbol) steadily
in one wing at chest height — the card does not travel or shift position.
The other wing gestures gently near the card without touching it. The
character's expression is serious and firm — not smiling.

CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character must
show visible, continuous motion for the ENTIRE 8 seconds, including the
last 2-3 seconds — natural eye blinks at least every 2-3 seconds, subtle
head tilts, continuous mouth movement while speaking. No portion of the
clip, especially the back half, should hold a single frozen pose for more
than half a second.

STATIC ELEMENTS: the background screen ("고용·근로 정책 발표" and its
icons), podium, plants, and the card (including its "재취업 월소득",
"300만원", "이상 제외" text and prohibition icon) must stay completely
fixed — no camera pan or zoom, no background object movement, no card
movement.

CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat every text-bearing
surface in this frame as a locked, non-regenerating image layer for the full
8 seconds — this includes the card text and the background screen text
("고용·근로 정책 발표"). Render these exactly as pixels copied from the
reference image, unchanged frame to frame — do not let the video model
regenerate, redraw, reinterpret, or reflow any of this text, even slightly,
even for one frame.

NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed feathers/fingers, no warped, blurred, flickering, or misspelled
text anywhere in the frame (large or small), no regenerated or
reinterpreted signage, no background changes, no character redesign, no
abrupt cut or freeze mid-motion, no static mouth, no minimal lip movement,
no closed-mouth talking, no frozen expression while speaking, no card
movement, no full-body freeze at any point, no holding completely still for
more than half a second anywhere in the clip.

MOUTH MOVEMENT: the character's beak/mouth actively opens and closes
continuously in natural speech rhythm for the entire clip, as if firmly
citing a tightened rule as evidence — never static, never barely-moving,
never closed-mouth talking, never frozen even in the final seconds.
```

## 완료 후 절차
1. 생성된 영상을 `C:/tmp/owl-ep15-videos/owl_ep15_s7_evidence_motion.mp4`로 저장
2. 시작·중반·끝 프레임 확인
3. 6개 씬(s1~s5, s7) 완료 후, s6·s8·s9·s10(Gemini, 위 10초 섹션) 결과와 합쳐 본편 조립 진행
