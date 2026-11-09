# 인수인계서 — 부엉박사 10편 영상(모션) 8·9·10번 씬 재생성

작성: 임시 세션(Sonnet 5, 수시간 한정) / 2026-09-21
목적: 이 세션 종료 후 원래 계정/세션이 이어받아 확인하고, 확인 끝나면 이 문서는 삭제 예정.

---

## 1. 현재까지 확정된 사실 (직접 파일 확인 완료)

- 부엉박사 10편: 대본 확정 → TTS 완료 → 이미지 10씬 완료(`C:/tmp/owl-ep10-images-v2/`) →
  영상(모션) 10씬 전부 생성 완료 상태였음. Owner가 다운로드한 파일:
  `C:\Users\PC\Downloads\1.mp4` ~ `10.mp4` (2026-09-21 08:45~09:20 생성)
- **8, 9, 10번 mp4를 직접 프레임 추출해서 확인한 결과, 배경/소품 한글 텍스트가 깨져있음**:
  - 8번: 폰 화면 안 메뉴 텍스트 일부 깨짐 (예: "대상 연금혁 요회", "납부 떡혀 좌인")
  - 9번: 종이 카드 "국민연금 공제액 비교" 표 안 한글 라벨 전부 오염
    (숫자 열은 정상, 라벨만 깨짐 — 예: "금폐연택서", "과반빤판 금폐액", "한란매험" 등)
  - 10번: 배경 대형 배너 "든든한 노후" → "문든한 노후", "연금으로" → "언긍으로"로 깨짐.
    단 우측 CTA 사인판("국민연금공단 1355 지금, 전화로 상담하세요!")은 정상.
  - 1~7번은 이번 세션에서 재확인하지 않음(Owner 지시로 스킵).
- 이 사고는 **이미 알려진 재발 패턴**이며 메모리 파일에 기록되어 있음:
  `C:\Users\PC\.claude\projects\C--Users-PC-jjy-instagram-auto\memory\feedback_video_prompt_text_preservation_must_verify.md`
  — "8·9·10번 배경 소형 텍스트가 깨졌다"는 기존 사고 기록과 이번 확인 결과가 일치.

## 2. 중요 — 프롬프트 문서 시점 오류 정정

`_ai/owl-ep10-video-generation-prompts.md`는 파일 생성/수정 시각이 **09:38:44 (git 미추적,
파일시스템 타임스탬프 기준)**로, 8~9~10번 mp4 다운로드 시각(08:45~09:20)보다 **나중**이다.

→ 즉 이 문서에 있는 `CRITICAL TEXT PRESERVATION` 강화 프롬프트는 **8/9/10번 실패를 확인한
후에 사후 작성된 "다음 시도용" 프롬프트**이며, 실제로 실패한 8/9/10번 mp4 생성에 쓰인
프롬프트가 아니다. (이전 세션이 "최신 규칙대로 정확히 프롬프트를 다 넣었다"고 답한 것은
이 사후 작성본과 실제 생성 시 사용된 프롬프트를 혼동한 것으로 보이며, 오답이었다.)

→ **결론: 문서의 8/9/10번 프롬프트는 아직 실전에서 한 번도 검증된 적이 없다.**
그대로 재시도하는 게 절차상 다음 단계이나, 9번(표 형태)은 구조적으로 재실패 위험이 높다고
판단해 이 세션에서 강화안을 별도로 작성해두었다(§4). **원본 `_ai/owl-ep10-video-generation-prompts.md`
파일은 건드리지 않았다** — Owner 지시로 이 신규 문서에만 강화 프롬프트를 둔다.

## 3. 재생성 실행 방식 — 반드시 수동

**이 프로젝트의 부엉박사 영상 생성은 Playwright 자동화가 아니라 Owner가 직접 Flow/Gemini
UI에 프롬프트를 복사-붙여넣기 하는 수동 방식으로 진행 중이다.** (5편 스크립트 주석에도
동일 기록 있음: "이번 편은 Flow를 Owner가 수동으로 실행한다(자동화 스크립트 미사용)".)
이 세션은 이 사실을 처음에 놓치고 Playwright 자동 제출을 제안했다가 Owner에게 정정받음
— **다음 세션도 자동화 스크립트(`run-owl-veo-motion-execute-once-v1.mjs` 등)를 실행하려
시도하지 말 것.** 아래 프롬프트 텍스트를 그대로 Owner에게 전달하고, Owner가 직접 붙여넣어
생성한 결과물을 받아서 프레임 검수하는 방식으로 진행한다.

## 4. 재생성용 프롬프트 (8, 9, 10번)

### 8번 — 원문 그대로 재시도 권장
`_ai/owl-ep10-video-generation-prompts.md`의 Scene 8 프롬프트 원문 그대로 사용.
(텍스트 밀집도가 상대적으로 낮은 씬 — 폰 화면 하나뿐이라 원문 강도로 충분할 가능성 높음.
다만 재시도 결과가 또 깨지면 9번과 동일한 FROZEN PROP 방식으로 강화 필요.)

이미지: `C:/tmp/owl-ep10-images-v2/owl_ep10_s8_alternative.png`
요청 길이: 9초

### 9번 — 강화 버전 (문서 원문 대신 이걸로 시도할 것, 표 형태라 재실패 위험 가장 높음)

이미지: `C:/tmp/owl-ep10-images-v2/owl_ep10_s9_action_a.png`
요청 길이: **8초**

```
Animate this image into an 8-second video clip. STYLE CONSISTENCY: keep the owl
character's design, outfit, and the pension consultation counter background
exactly as shown in the reference image. MOTION DETAIL: only the owl's wing,
arm, head, and beak may move — lift and hold the wing steadily pointed at the
comparison sheet, facing the camera with a careful, meticulous expression, not
smiling. FROZEN PROP TREATMENT: the entire comparison sheet — the whole paper
rectangle including its header row, both columns, every row label, and every
number — must be treated as a single frozen, rigid, flat image glued to the
owl's wing, exactly like a photograph taped onto the scene. It does not bend,
does not catch light differently, does not re-render, and none of its Korean
text is regenerated or redrawn at any frame — it is the identical pixel block
from the reference image for the full 8 seconds, only its position may shift
rigidly as the wing holding it moves. STATIC ELEMENTS: the comparison sheet's
printed numbers and layout, background signage, screen menu, and furniture
remain completely still — no animated charts, no flashing text. CRITICAL TEXT
PRESERVATION: every piece of Korean text visible anywhere in the frame —
including every row label and header on the comparison sheet, the small
background signage, the screen menu, and wall banners — must remain
pixel-perfect identical to the reference image for the entire 8 seconds, down
to individual character shapes. Do not let any character shift, blur, morph,
or misspell. If motion would risk distorting any text, keep that element
completely static instead — freezing the whole sheet is strongly preferred
over animating it in any way. NEGATIVE PROMPT: no regenerated or re-rendered
Korean text on the comparison sheet, no substituted or garbled row labels, no
face distortion, no proportion drift, no extra or malformed fingers/claws, no
warped or misspelled text anywhere in the frame, no background changes, no
character redesign, no eye or gaze darting between multiple points. MOUTH
MOVEMENT: the owl's beak actively opens and closes continuously in natural
speech rhythm for the full 8 seconds — never static, never barely-moving,
never closed-mouth talking.
```

### 10번 — 문서 원문 사용, 단 강화 필요성 재확인할 것

`_ai/owl-ep10-video-generation-prompts.md`의 Scene 10 프롬프트는 이미
CRITICAL TEXT PRESERVATION 블록에 "large 연금 상담 창구 banner, small
background signage, screen menu, wall banners"를 전부 나열하고 있어 커버리지는
맞다. 다만 실패 원인이 배너가 커서(주의를 끌기 쉬워서) 재구성 유혹이 컸을 수
있으므로, 9번과 같은 **FROZEN PROP 방식(배경 배너 전체를 하나의 고정된 배경
텍스처로 취급)**으로 강화가 필요한지는 재시도 결과를 보고 판단할 것 — 이
세션에서는 아직 미작성.

## 5. 다음 단계 (우선순위)

1. 위 8·9·10번 프롬프트를 Owner에게 전달 → Owner가 Flow/Gemini UI에서 수동 생성
2. 생성되는 대로 **씬 1개씩 즉시 프레임 추출·검수** (한꺼번에 몰아서 받지 말 것 —
   `feedback_video_prompt_text_preservation_must_verify.md` 2항 규칙)
3. 9번이 강화 프롬프트로도 또 깨지면: 표 자체를 없애고 구두 설명으로 대체하는 등
   더 근본적인 이미지/구성 변경을 Owner와 논의
4. 8·9·10번 통과 확인되면 1~7번도 동일 기준으로 재검수(이번 세션에서는 미수행)
5. 전체 통과 후 조립(`run-owl-assemble-shorts-v2.mjs`) + 고정 CTA 결합 단계로 진행

## 6. 이 세션이 하지 않은 것 / 주의사항

- git commit/push 없음, 승인받은 파일 편집 없음(신규 인계 문서 1개만 생성)
- `_ai/owl-ep10-video-generation-prompts.md` 원본은 편집 시도 후 원상 복구함 — 최종적으로
  변경 없음
- Playwright 자동 제출 스크립트 실행 시도 안 함(Owner가 자동화 아님을 정정)
- 1~7번 씬 재검수는 Owner 지시로 스킵함(불필요하다고 판단)
