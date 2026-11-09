# 인수인계서 — 임시 계정 세션 → 기존 계정 복귀 시 전달용

작성: 임시 Claude Code 세션(수시간 한정 사용, 기존 계정 아님)
목적: 이 세션이 종료되고 기존 계정으로 돌아갔을 때, 그동안 이 세션에서 한 모든 작업을
빠짐없이 이어받을 수 있도록 계속 갱신한다. **범위는 10편 영상 하나가 아니라 이 세션에서
다루는 모든 작업 전체.** 확인 후 삭제 예정 — 그 전까지 이 세션은 여기 계속 기록한다.

**주의: `_ai/CONTEXT_TRANSFER_CLAUDE.md`(기존 범용 인계 파일)는 건드리지 않는다. 이 문서와
별개로 유지한다.**

---

## 최종 결론 요약 (2026-09-21 세션 종료 시점 — 여기만 읽어도 현재 상태 파악 가능)

**부엉박사 10편 영상(모션) 8·9·10번 씬은 아직 사용 가능한 결과물이 하나도 없다.**

- **8번**: refusal 없음. 텍스트 여전히 미세 깨짐(폰 화면 메뉴 2줄). **미해결.**
- **9번**: 여러 번 refusal("I can't generate that video...") 발생 → 9번-C(급여명세서
  뉘앙스 배제 버전)로 refusal은 해결. 그러나 **표 안 라벨 텍스트는 여전히 프레임마다
  다르게 깨짐 — 미해결.**
- **10번**: refusal 2종 발생(①"real people" ②일반 정책 거부) → 10번-D로 둘 다 해결.
  그러나 **0~5초는 정상이다가 5초 시점부터 사인판이 통째로 다른 디자인으로 바뀌며
  원본에 없던 가짜 전화번호 "033-990-5000"이 생김 — 미해결, 가장 심각.**

**공통 원인 진단(이 세션 결론)**: "FROZEN PROP TREATMENT", "pixel-perfect identical"
같은 프롬프트 지시는 이 생성기(Veo)에서 실효성이 거의 없다. 텍스트/소품이 프레임마다
계속 재생성되는 건 프롬프트 문구로 막을 수 있는 수준을 넘어선 구조적 한계로 보인다.
**프롬프트를 더 강하게 쓰는 시도는 이제 그만하는 게 낫다고 판단.**

**다음 세션(본계정)이 결정할 3가지 방향 (§12에 상세, Owner 승인 필요)**:
1. 텍스트 프롭(폰/표/배너/사인판)을 영상 생성 후 원본 정지 이미지로 후처리 합성
2. 9번처럼 텍스트 밀도 높은 이미지 자체를 다시 만들어 단순화
3. Flow 등 다른 생성기로 교차 테스트

**아래는 여기까지 오는 과정의 시간순 상세 로그(모든 시도·실패·원인 진단 근거).**

---

## 이 세션 진행 로그 (시간순)

### 1. 부엉박사 10편 진행 상태 재확인 (최초 요청)
- `_ai/CONTEXT_TRANSFER_CLAUDE.md`를 읽고 시작 — 해당 문서는 "이미지 생성 중" 단계로
  기록돼 있었으나, 실제 디스크 상태를 직접 확인한 결과 그보다 훨씬 진행된 상태였음
  (오래된 스냅샷이었음).
- 직접 확인한 실제 상태:
  - 대본 확정: `scripts/_owl-ep10-assembly-spec.mjs`
  - TTS 완료: `C:\tmp\money-shorts-os\owl-ep10-tts\output-v2\` (총 90.28초)
  - 이미지 10씬 전부 완료: `C:/tmp/owl-ep10-images-v2/`
  - 영상 프롬프트 문서 작성 완료: `_ai/owl-ep10-video-generation-prompts.md`
  - 영상(모션) 파일 존재 여부는 처음에 `/c/tmp` 안에서 못 찾았다고 잘못 보고함
    (검색 범위 미흡 — 실제로는 Owner 다운로드 폴더에 있었음, 아래 참고)

### 2. Owner가 실제 생성된 영상 10개를 직접 전달
- 파일: `C:\Users\PC\Downloads\1.mp4` ~ `10.mp4` (2026-09-21 08:45~09:20 생성됨)
- Owner 보고: 8, 9, 10번 영상에 배경 글자 오류 있음
- 이 세션이 ffmpeg로 프레임 직접 추출해 확인 완료:
  - **8번**: 폰 화면 메뉴 텍스트 일부 깨짐 (예: "대상 연금혁 요회", "납부 떡혀 좌인")
  - **9번**: "국민연금 공제액 비교" 표 안 한글 라벨 전부 오염 (숫자 열은 정상,
    라벨만 깨짐 — 예: "금폐연택서", "과반빤판 금폐액", "한란매험" 등)
  - **10번**: 배경 대형 배너 "든든한 노후" → "문든한 노후", "연금으로" → "언긍으로"로
    깨짐. 단 우측 CTA 사인판("국민연금공단 1355")은 정상.
  - 1~7번은 Owner 지시로 이 세션에서 재확인하지 않음.

### 3. "최신 규칙대로 프롬프트 다 넣었다"는 이전 세션 답변 검증 → 오답으로 확인
- `_ai/owl-ep10-video-generation-prompts.md` 파일의 파일시스템 타임스탬프
  (Modify/Birth 동일 = 09:38:44, git 미추적 파일이라 git log 이력 없음)를 확인.
- 8~10번 mp4 다운로드 시각(08:45~09:20)이 이 문서 작성 시각(09:38)보다 **더 이르다.**
- 결론: 문서에 있는 `CRITICAL TEXT PRESERVATION` 강화 프롬프트는 8~10번 실패를 확인한
  **뒤에** 사후 작성된 것이며, 실제 8~10번 생성에 쓰인 프롬프트가 아니다. 이전 세션의
  "정확히 반영해서 넣었다"는 답변은 사후 작성본과 실제 사용 프롬프트를 혼동한 오답.
  → **이 문서(`owl-ep10-video-generation-prompts.md`)의 8/9/10번 프롬프트는 아직
  한 번도 실전 검증된 적이 없는 상태.**

### 4. 프롬프트 자체의 결함 재검토 (Owner 지시로 재검증)
- 5요소(스타일/동작/정지/부정/입움직임) 형식은 8·9·10번 전부 충족.
- 그러나 9번(표 형태)은 "printed numbers and layout... stay completely fixed"처럼
  숫자·레이아웃 위주로 정지 지시가 쓰여 있고, 실제로 깨진 건 **한글 라벨**이었음 —
  실패 지점을 정확히 못 겨냥한 형식적 반영이었다고 판단.
- 9번 프롬프트를 "FROZEN PROP TREATMENT"(표 전체를 사진처럼 완전 고정된 오브젝트로
  취급, 텍스트를 프레임마다 재렌더링하지 않도록 명시)로 강화한 버전을 작성함.
  **원본 `_ai/owl-ep10-video-generation-prompts.md` 파일은 편집 후 즉시 원상
  복구했고, grep으로 원본에 변경사항 없음을 재확인함 — 최종적으로 미변경 상태.**

### 5. Playwright 자동화 제안 → Owner가 정정 (중요 실수)
- 이 세션이 8/9/10 재생성을 위해 Playwright로 Chrome/Gemini Veo 웹 UI를 자동
  조작하는 방식(`scripts/run-owl-veo-motion-execute-once-v1.mjs`)을 제안했다가
  Owner에게 정정받음.
- **사실: 부엉박사 영상 생성은 자동화 스크립트가 아니라 Owner가 직접 Flow/Gemini
  UI에 프롬프트를 복사-붙여넣기 하는 수동 방식으로 진행 중.** (5편 스크립트
  주석에도 "이번 편은 Flow를 Owner가 수동으로 실행한다"는 동일 기록 있음.)
- **다음 세션도 자동화 스크립트를 실행하려 시도하지 말 것.** 프롬프트 텍스트를
  Owner에게 전달하고, Owner가 직접 생성한 결과물을 받아 검수하는 방식 유지.

### 6. 인계서 파일 관련 혼선 (이 문서가 만들어진 경위)
- 처음에 `_ai/HANDOFF_OWL_EP10_VIDEO_RETRY.md`라는 10편 한정 인계서를 만들었으나,
  Owner가 "10편에 한정되는 게 아니라 이 세션 전체, 기존 계정으로 넘어갈 때까지
  계속 쓰는 문서"라고 정정 → 그 파일은 삭제 시도했으나 권한 거부로 실패, 이후
  Owner 지시로 그 파일 자체는 그대로 두고 건드리지 않기로 함(범용 파일인
  `_ai/CONTEXT_TRANSFER_CLAUDE.md`를 갱신하려던 것도 Owner가 제지 — 그 파일도
  건드리지 않음).
- 최종적으로 이 문서(`_ai/HANDOFF_SESSION_TEMP_ACCOUNT.md`)를 신규로 만들어
  세션 전체 인계 용도로 유지하기로 확정.

---

## 현재 시점 — 다음에 할 일 (우선순위)

1. **8·9·10번 재생성용 프롬프트를 Owner에게 전달**하고, Owner가 Flow/Gemini UI에서
   수동 생성 → 생성되는 대로 씬 1개씩 즉시 프레임 검수(몰아서 하지 않기).
   - 8번: `_ai/owl-ep10-video-generation-prompts.md` Scene 8 원문 그대로 사용
   - 9번: 이 세션이 강화한 FROZEN PROP 버전 사용(아래 §부록 참고, 원본 문서에는
     반영 안 돼 있음 — 필요시 이 인계서에서 복사)
   - 10번: 원문 문서 사용, 재실패 시 9번과 같은 방식으로 강화 필요할 수 있음
2. 8·9·10번 통과 확인되면 1~7번도 동일 기준(텍스트 왜곡 여부)으로 재검수 필요 여부
   판단 — 이번 세션은 Owner 지시로 스킵함.
3. 전체 통과 후 조립(`scripts/run-owl-assemble-shorts-v2.mjs`) + 고정 CTA 결합
   (`scripts/run-owl-episode-with-fixed-cta-once.mjs`) 단계로 진행.
4. 카드뉴스 작성(6~9편과 밝은 톤 통일 유지).

## 부록 — 9번 강화 프롬프트 (원본 문서에는 미반영, 필요시 여기서 사용)

이미지: `C:/tmp/owl-ep10-images-v2/owl_ep10_s9_action_a.png`
요청 길이: 8초

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

---

### 7. 10번 씬 Veo refusal 발생 (신규)
- Owner가 10번 원문 프롬프트로 첫 시도 → 즉시 거부됨: "I can't make videos of real
  people in situations like that."
- 진단: "the owl holds a phone **to its ear**"(귀에 대고 통화하는 동작) +
  "국민연금공단 1355"(실존 공공기관 전화번호) 조합이 Gemini/Veo 안전필터에
  "실제 인물의 사적 통화 상황"으로 오인됐을 가능성이 높음(애니메이션 캐릭터라도
  "통화 중" 동작 자체가 트리거로 작동한 것으로 추정). `project_veo_refusal_root_cause`
  메모리의 "한 클립 한 동작" 케이스와는 다른 원인 — 이번은 동작 개수가 아니라
  "전화 통화" 상황 자체가 문제로 추정됨(미확정, 검증 필요).
- 대응: 통화 동작("phone to its ear")을 제거하고, 전화기를 손에 들고 CTA 사인을
  가리키는 동작으로 변경한 강화 프롬프트 작성(§부록 10번-B).

### 8. 10번-B 재시도 결과 — 실패 (이 세션의 프롬프트 작성 실수 확인됨)
- Owner가 10번-B로 재시도 → refusal은 해결됨(통화 동작 제거가 유효했던 것으로 보임).
- 그러나 결과물 `Animate_this_image_into_a_s.mp4` 직접 프레임 확인 결과 **새로운
  문제 2건 발견**:
  1. **해상도가 1280x720(16:9 가로형)으로 생성됨.** 다른 씬들은 9:16 세로형인데
     10번-B만 가로로 나와, 세로 숏폼 조립/재생 시 화면을 채우려고 가운데를 확대
     크롭하게 되어 "화면이 확대되는" 것처럼 보임(Owner가 지적한 증상과 일치).
     **원인: 이 세션이 10번-B 프롬프트를 새로 작성하면서 다른 씬들에 있던
     "9:16 vertical format" 같은 세로 비율 고정 문구를 빠뜨림 — 이 세션의 실수.**
  2. **텍스트 왜곡도 여전히 재발.** "예상 연금액 조회" → "영금 언료로자"로 깨짐,
     폰 화면 안 문구도 깨짐. 통화 동작만 제거했을 뿐 텍스트 보존 강도는 원문
     10번과 동일 수준이었는데도 재발 — 9번처럼 FROZEN PROP 수준 강화가 필요할
     수 있음.
- 대응: 10번-C 프롬프트를 세로 비율 고정 문구 추가 + 사인판 텍스트 FROZEN 처리로
  다시 작성함(§부록 10번-C).

### 9. 10번-C 재시도 결과 — 또 다른 종류의 refusal
- Owner가 10번-C로 재시도 → 새로운 refusal 메시지: "I can't generate that video.
  Try describing another idea. You can also get tips for how to write prompts
  and review our video policy guidelines." (이전 "real people" 메시지와 다른
  종류 — 더 일반적인 정책 거부 문구)
- 10번-B(통화 동작만 제거, refusal 없었음— 텍스트/비율 문제만 있었음) 대비
  10번-C에서 새로 추가된 건 ①세로비율 고정 문구 ②FROZEN PROP 블록에서
  "국민연금공단 1355"(실존 기관명+실제 전화번호)를 프롬프트 본문에 다시 명시적
  타이핑한 것, 두 가지뿐. 이 세션의 추정: **전화번호를 프롬프트 텍스트에 직접
  타이핑하는 것 자체**가 "실제 기관 연락 유도"로 재차 필터링됐을 가능성 —
  10번 씬이 이미 한 번 "실제 통화"로 오인된 이력이 있어 민감도가 높은 상태로
  추정(미확정, 검증 필요).
- 대응: 전화번호 텍스트를 프롬프트 본문에서 빼고 "the information sign"으로만
  지칭하는 10번-D 작성함(§부록 10번-D).

### 10. 10번-D 결과 — refusal은 해결, BUT 텍스트 왜곡 재발 + 원치 않는 요소 생성
- Owner가 10번-D로 생성 완료(`Animate_this_image_into_a_s (1).mp4`, 720x1280,
  10:35). 세로 비율 정상, refusal 없음 — 기관명/전화번호 텍스트를 본문에서 뺀
  대응이 refusal 해결에는 유효했던 것으로 보임(가설 강화됨, §8~9와 연결).
- 그러나 이 세션이 직접 프레임 확인한 결과 **텍스트 왜곡 재발 + 신규 문제**:
  - "든든한 노후" 배너 → "문든한 노후"로 여전히 깨짐
  - 원본에 없던 **가짜 전화번호 "033-990-5000"이 사인판에 새로 생성됨**
    (원본 사인판엔 "1355"만 있었는데 그 위에 다른 숫자가 겹쳐 보이고 하단에
    없던 번호가 추가로 나타남 — Veo가 "전화번호처럼 보이는 텍스트"를 자체적으로
    지어낸 것으로 추정)
  - 캐릭터 오른쪽 조끼 사이로 흰 셔츠 팔이 원본과 다르게 비쳐 보임(경미)
  - **→ 10번은 refusal은 해결됐으나 텍스트/디테일 기준으로는 아직 미통과.**
    10번-E가 필요하나 이 세션에서는 아직 작성 안 함 — 9번 refusal 대응이 더
    급해 우선순위 밀림. 다음 세션(또는 이 세션 이어서)이 처리할 것.
- **9번도 동일 refusal 메시지 발생** ("I can't generate that video...").
  9번 프롬프트(부록 §9번, FROZEN PROP 버전)에 "국민연금 공제액 비교"라는
  구체적 한글 표 제목을 본문에 직접 타이핑한 부분이 있음 — 10번의 "국민연금공단
  1355" 재타이핑과 같은 유형(실존 기관명/구체 문구를 프롬프트 본문에 다시
  타이핑)으로 추정, 동일 원인일 가능성이 높음(미확정).
- 대응: 9번도 표 제목·기관명 구체 문구를 본문에서 빼고 "the comparison sheet"로만
  지칭하는 9번-B 작성함(§부록 9번-B).

### 11. 9번-B도 동일 refusal — 원인 재진단
- 9번-B로도 같은 refusal 메시지 재발. 기관명/표 제목 텍스트 재타이핑 가설은
  틀렸거나 부분적 원인일 뿐인 것으로 판단.
- 9번 원본 이미지(`owl_ep10_s9_action_a.png`)를 직접 다시 확인: 표 안 항목이
  "기본급/각종 수당/국민연금 공제액/건강보험/장기요양보험/고용보험/소득세/
  지방소득세/실수령액" + "현재"/"내년 예상" 두 열 — 이건 사실상 **실제
  급여명세서(개인 재정정보 문서) 양식과 거의 동일한 구조**. 프롬프트 문구
  문제가 아니라 **이미지 자체에 이미 "급여명세서" 형태의 문서가 존재**하는 게
  근본 원인일 가능성으로 재진단(Owner도 이 진단에 동의, 이번엔 프롬프트
  일반화로 먼저 재시도해보기로 함 — 안 되면 이미지 자체를 다시 만들어야 함).
- 대응: 9번-C 작성 — "comparison sheet"를 "a printed information card"로
  추상화, "급여명세서"를 연상시킬 수 있는 뉘앙스(개인 재정정보 문서로 보일
  소지)를 프롬프트에서 최대한 배제(§부록 9번-C).

### 12. 8·9·10번 재생성 결과 3건 모두 직접 프레임 검수 완료 — refusal은 해결, 텍스트 왜곡은 미해결
- Owner가 8.mp4(10:21)/9.mp4(10:43, 9번-C 결과)/10.mp4(=10번-D와 동일 파일,
  10:35)를 전달, 이 세션이 각 5프레임씩 추출해 직접 확인.
- 공통 결과: **세 씬 다 세로비율(720x1280) 정상, refusal 없음.** 그러나
  **텍스트 왜곡은 전혀 해결되지 않음**:
  - 8번: 폰 화면 메뉴 리스트 중 2줄 미세 깨짐("메싱 던금혀 모지", "임부 미제
    치인"), 프레임마다 다른 글자로 바뀜(=매 프레임 재렌더링되고 있다는 증거)
  - 9번(9-C 결과): 표 라벨 전부 여전히 깨짐("국민인금 공제액 비교", "금테면택시"
    등), 5프레임 중 2개 비교만으로도 서로 다른 글자로 변함 확인
  - 10번(10-D 결과): "든든한 노후"→"문든한 노후" 배너 깨짐 재확인 + **원본에
    없던 가짜 전화번호 "033-990-5000"이 신규 생성되어 그대로 남아있음** —
    가장 심각한 문제(사실과 다른 정보를 화면에 노출하는 것이므로 게시 불가).
    **정확한 위치·타이밍**: 화면 오른쪽 아래 사인판("국민연금공단 / 1355") —
    0.5fps 간격 20프레임 전수 추출로 재검증. **0~5초까지는 원본과 동일하게
    "지금, 전화로 상담하세요!" 문구가 정상 유지**되다가, **5초 지점부터 사인판
    디자인 자체가 통째로 다른 레이아웃으로 바뀌면서** 그 문구가 사라지고 상담원
    캐릭터 아이콘 + "국민연금공단 1355" 아래 **가짜 지역번호 "033-990-5000"**
    (033=강원도 지역번호, 실존 국민연금공단 번호 아님)이 새로 생겨남. 원본
    정지 이미지(`owl_ep10_s10_action_b.png`)에는 이 번호가 전혀 없었음(직접
    대조 확인). → 단순 텍스트 왜곡이 아니라 **영상 중간에 소품 디자인 자체가
    다른 버전으로 전환되는 패턴**으로, FROZEN PROP 프롬프트 지시가 이 정도
    변형은 전혀 막지 못한 것으로 확인(가장 심각한 사례).
- **판단: FROZEN PROP TREATMENT / "pixel-perfect identical" 같은 프롬프트
  지시는 이 생성기(Veo)에서 실효성이 거의 없는 것으로 재확인됨.** 프레임마다
  텍스트가 계속 다르게 바뀌는 건, 모델이 프롬프트의 "정지시켜라" 지시와
  무관하게 매 프레임 텍스트 영역을 재생성하는 구조적 한계이기 때문으로 추정.
  프롬프트 문구를 더 강하게 쓰는 접근은 한계에 도달한 것으로 판단.
- **다음 세션이 결정해야 할 것 (이 세션은 진행 방향을 Owner에게 질문한 상태,
  아직 답 없음)**:
  1. 텍스트가 있는 프롭(폰 화면, 표, 배너, 사인판)을 영상 생성 후 **후처리로
     원본 정지 이미지를 오버레이/합성**하는 방식으로 전환(모션은 살리되 텍스트
     영역만 원본 스틸 크롭을 얹기) — 프롬프트로 해결 안 되는 근본 한계를
     우회하는 방법
  2. 또는 애초에 이미지 단계에서 텍스트 밀도를 낮춘 새 참조 이미지로 재생성
     (9번 급여명세서 표처럼 텍스트가 많은 프롭 자체를 단순화)
  3. 또는 다른 생성기(Flow 등)로 교차 테스트해서 Veo만의 문제인지 확인
  - 이 중 어느 방향으로 갈지는 Owner 승인 필요 — 특히 1번은 조립 파이프라인에
    후처리 합성 단계를 새로 추가하는 것이라 범위가 커짐.

## 부록 — 10번 재시도 프롬프트 (10번-B, 통화 동작 제거 버전)

이미지: `C:/tmp/owl-ep10-images-v2/owl_ep10_s10_action_b.png`
요청 길이: 10초

```
Animate this image into a 10-second video clip. STYLE CONSISTENCY: keep the owl
character's design, outfit, and the pension consultation counter background
exactly as shown in the reference image. MOTION DETAIL: the owl holds a
smartphone at chest height with one wing, showing its screen toward the
camera, while gesturing with the other wing toward the nearby information
sign, expression thoughtful and settling into a gentle, warm smile toward the
end (closing-tone softness is allowed). This is a stylized 3D-animated cartoon
owl character presenting information, not a real person and not a phone call
or conversation. STATIC ELEMENTS: the sign's text and phone icon stay
completely fixed — no ringing animation, no flashing text, background signage
and furniture remain still. CRITICAL TEXT PRESERVATION: every piece of Korean
text visible anywhere in the frame — including the information sign, the
large "연금 상담 창구" banner, the small background signage, the screen menu,
and wall banners — must remain pixel-perfect identical to the reference image
for the entire 10 seconds. Do not let any character shift, blur, morph, or
misspell. If motion would risk distorting any text, keep that element
completely static instead. NEGATIVE PROMPT: no face distortion, no
proportion drift, no extra or malformed fingers/claws, no warped or
misspelled text anywhere in the frame, no background changes, no character
redesign, no depiction of a real person or real phone call. MOUTH MOVEMENT:
the owl's beak actively opens and closes continuously in natural speech
rhythm for the full 10 seconds — never static, never barely-moving, never
closed-mouth talking.
```

주요 변경점: "phone to its ear"(귀에 대고 통화) 동작 제거 → "phone at chest
height... showing its screen"(가슴 높이에서 화면을 보여주는 동작)으로 대체.
"This is a stylized 3D-animated cartoon owl character... not a real person and
not a phone call or conversation" 문구를 추가해 안전필터가 통화 상황으로
오인하지 않도록 명시. 부정 프롬프트에도 "no depiction of a real person or real
phone call" 추가.

## 부록 — 10번-C 재시도 프롬프트 (세로비율 고정 + 사인판 텍스트 강화)

이미지: `C:/tmp/owl-ep10-images-v2/owl_ep10_s10_action_b.png`
요청 길이: 10초

```
Animate this image into a 10-second video clip. OUTPUT FORMAT: the output must
be a 1080x1920 vertical 9:16 frame, exactly matching the reference image's
aspect ratio and framing — do not output landscape or 16:9, do not change the
crop or zoom level from the reference image. STYLE CONSISTENCY: keep the owl
character's design, outfit, and the pension consultation counter background
exactly as shown in the reference image. MOTION DETAIL: the owl holds a
smartphone at chest height with one wing, showing its screen toward the
camera, while gesturing with the other wing toward the nearby information
sign, expression thoughtful and settling into a gentle, warm smile toward the
end (closing-tone softness is allowed). This is a stylized 3D-animated cartoon
owl character presenting information, not a real person and not a phone call
or conversation. FROZEN PROP TREATMENT: the information sign in the lower
right (reading "국민연금공단 1355") must be treated as a single frozen, rigid,
flat object — its text is never regenerated or redrawn at any frame, it stays
the identical pixel block from the reference image for the full 10 seconds.
The phone screen's content is likewise frozen and not redrawn. STATIC
ELEMENTS: the sign's text and phone icon stay completely fixed — no ringing
animation, no flashing text, background signage and furniture remain still.
CRITICAL TEXT PRESERVATION: every piece of Korean text visible anywhere in the
frame — including the information sign, the phone screen, the large "연금
상담 창구" banner, the small background signage, the screen menu, and wall
banners — must remain pixel-perfect identical to the reference image for the
entire 10 seconds, down to individual character shapes. Do not let any
character shift, blur, morph, or misspell. If motion would risk distorting
any text, keep that element completely static instead — freezing text-heavy
props is strongly preferred over animating them. NEGATIVE PROMPT: no
landscape or horizontal aspect ratio, no aspect ratio change, no zoom-in or
crop change from the reference image, no regenerated or re-rendered Korean
text anywhere, no face distortion, no proportion drift, no extra or malformed
fingers/claws, no warped or misspelled text anywhere in the frame, no
background changes, no character redesign, no depiction of a real person or
real phone call. MOUTH MOVEMENT: the owl's beak actively opens and closes
continuously in natural speech rhythm for the full 10 seconds — never static,
never barely-moving, never closed-mouth talking.
```

주요 변경점(10번-B 대비): ①맨 앞에 "OUTPUT FORMAT: 1080x1920 vertical 9:16"
명시 문구 추가(누락됐던 세로 비율 고정) ②사인판+폰 화면에 FROZEN PROP 처리
추가(9번과 동일 원리로 텍스트 재렌더링 방지) ③부정 프롬프트에 "no landscape",
"no aspect ratio change" 추가.

## 부록 — 10번-D 재시도 프롬프트 (전화번호 텍스트 재타이핑 제거)

이미지: `C:/tmp/owl-ep10-images-v2/owl_ep10_s10_action_b.png`
요청 길이: 10초

```
Animate this image into a 10-second video clip. OUTPUT FORMAT: the output must
be a 1080x1920 vertical 9:16 frame, exactly matching the reference image's
aspect ratio and framing — do not output landscape or 16:9, do not change the
crop or zoom level from the reference image. STYLE CONSISTENCY: keep the owl
character's design, outfit, and the pension consultation counter background
exactly as shown in the reference image. MOTION DETAIL: the owl holds a
smartphone at chest height with one wing, showing its screen toward the
camera, while gesturing with the other wing toward the nearby information
sign, expression thoughtful and settling into a gentle, warm smile toward the
end (closing-tone softness is allowed). This is a stylized 3D-animated cartoon
owl character presenting information, not a real person. FROZEN PROP
TREATMENT: the information sign in the lower right and the phone screen must
each be treated as a single frozen, rigid, flat object — their printed
content is never regenerated or redrawn at any frame, staying the identical
pixel block from the reference image for the full 10 seconds. STATIC
ELEMENTS: the sign and phone icon stay completely fixed — no ringing
animation, no flashing text, background signage and furniture remain still.
CRITICAL TEXT PRESERVATION: every piece of Korean text visible anywhere in the
frame — including the information sign, the phone screen, the large banner,
the small background signage, the screen menu, and wall banners — must remain
pixel-perfect identical to the reference image for the entire 10 seconds, down
to individual character shapes. Do not let any character shift, blur, morph,
or misspell. If motion would risk distorting any text, keep that element
completely static instead — freezing text-heavy props is strongly preferred
over animating them. NEGATIVE PROMPT: no landscape or horizontal aspect
ratio, no aspect ratio change, no zoom-in or crop change from the reference
image, no regenerated or re-rendered text anywhere, no face distortion, no
proportion drift, no extra or malformed fingers/claws, no warped or
misspelled text anywhere in the frame, no background changes, no character
redesign. MOUTH MOVEMENT: the owl's beak actively opens and closes
continuously in natural speech rhythm for the full 10 seconds — never static,
never barely-moving, never closed-mouth talking.
```

주요 변경점(10번-C 대비): ①본문에서 실제 기관명/전화번호("국민연금공단
1355")와 "phone call"/"real phone call" 관련 단어를 전부 제거하고 "the
information sign", "not a real person"으로만 일반화 ②"연금 상담 창구" 배너
문구도 "the large banner"로 일반화(구체적 한글 문자열을 프롬프트 본문에 다시
타이핑하지 않는 방향). 목적: 실제 기관/전화 관련 텍스트를 프롬프트에 반복
타이핑하는 것 자체가 정책 필터를 건드릴 가능성을 최소화.

## 부록 — 9번-B 재시도 프롬프트 (표 제목/기관명 구체 문구 본문 제거)

이미지: `C:/tmp/owl-ep10-images-v2/owl_ep10_s9_action_a.png`
요청 길이: 8초

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
does not catch light differently, does not re-render, and none of its printed
text is regenerated or redrawn at any frame — it is the identical pixel block
from the reference image for the full 8 seconds, only its position may shift
rigidly as the wing holding it moves. STATIC ELEMENTS: the comparison sheet's
printed content and layout, background signage, screen menu, and furniture
remain completely still — no animated charts, no flashing text. CRITICAL TEXT
PRESERVATION: every piece of text visible anywhere in the frame — including
every row label and header on the comparison sheet, the small background
signage, the screen menu, and wall banners — must remain pixel-perfect
identical to the reference image for the entire 8 seconds, down to individual
character shapes. Do not let any character shift, blur, morph, or misspell.
If motion would risk distorting any text, keep that element completely
static instead — freezing the whole sheet is strongly preferred over
animating it in any way. NEGATIVE PROMPT: no regenerated or re-rendered text
anywhere, no substituted or garbled labels, no face distortion, no
proportion drift, no extra or malformed fingers/claws, no warped or
misspelled text anywhere in the frame, no background changes, no character
redesign, no eye or gaze darting between multiple points. MOUTH MOVEMENT: the
owl's beak actively opens and closes continuously in natural speech rhythm for
the full 8 seconds — never static, never barely-moving, never closed-mouth
talking.
```

주요 변경점(9번 원본 대비): 프롬프트 본문에서 "국민연금 공제액 비교"라는 구체적
한글 표 제목 문자열을 제거하고 "the comparison sheet"로만 지칭. "Korean text"→
"text"로 일반화(특정 언어 명시도 제거, 10번-D 대응과 통일). 그 외 FROZEN PROP
구조는 유지.

## 부록 — 9번-C 재시도 프롬프트 (급여명세서 뉘앙스 배제, 더 추상화)

이미지: `C:/tmp/owl-ep10-images-v2/owl_ep10_s9_action_a.png`
요청 길이: 8초

```
Animate this image into an 8-second video clip. This is a stylized 3D-animated
cartoon owl character in an illustrated info-graphic scene, not a real
financial document belonging to any real person. STYLE CONSISTENCY: keep the
owl character's design, outfit, and the pension consultation counter
background exactly as shown in the reference image. MOTION DETAIL: only the
owl's wing, arm, head, and beak may move — lift and hold the wing steadily
holding up a printed information card, facing the camera with a careful,
meticulous expression, not smiling. FROZEN PROP TREATMENT: the entire card —
the whole rectangle including every line of printed content — must be treated
as a single frozen, rigid, flat illustrated graphic glued to the owl's wing,
exactly like a photograph taped onto the scene. It does not bend, does not
catch light differently, does not re-render, and none of its printed content
is regenerated or redrawn at any frame — it is the identical pixel block from
the reference image for the full 8 seconds, only its position may shift
rigidly as the wing holding it moves. STATIC ELEMENTS: the card's printed
content and layout, background signage, screen menu, and furniture remain
completely still — no animated charts, no flashing text. CRITICAL TEXT
PRESERVATION: every piece of text visible anywhere in the frame — including
every line on the card, the small background signage, the screen menu, and
wall banners — must remain pixel-perfect identical to the reference image for
the entire 8 seconds, down to individual character shapes. Do not let any
character shift, blur, morph, or misspell. If motion would risk distorting
any text, keep that element completely static instead — freezing the whole
card is strongly preferred over animating it in any way. NEGATIVE PROMPT: no
regenerated or re-rendered text anywhere, no substituted or garbled labels,
no face distortion, no proportion drift, no extra or malformed
fingers/claws, no warped or misspelled text anywhere in the frame, no
background changes, no character redesign, no eye or gaze darting between
multiple points. MOUTH MOVEMENT: the owl's beak actively opens and closes
continuously in natural speech rhythm for the full 8 seconds — never static,
never barely-moving, never closed-mouth talking.
```

주요 변경점(9번-B 대비): 맨 앞에 "stylized 3D-animated cartoon... not a real
financial document belonging to any real person" 명시 추가. "comparison
sheet"를 "a printed information card"/"the card"로 더 추상화(비교표 뉘앙스
자체를 줄임). "row label", "header" 같은 급여명세서 구조를 연상시키는 표현도
"every line on the card"로 일반화.

**만약 이것도 refusal이면**: 다음 세션은 프롬프트 문구 조정을 그만두고, 9번
이미지 자체를 급여명세서 양식이 아닌 다른 시각화(예: 단순 막대그래프나
아이콘 카드)로 다시 생성하는 방향으로 전환할 것 — Owner도 이 경우 이미지
재작업에 동의함(2026-09-21).

## 건드리지 않은 것 (명시적으로 보호)

- `_ai/CONTEXT_TRANSFER_CLAUDE.md` — 기존 범용 인계 파일, 이 세션이 절대 수정하지 않음
- `_ai/owl-ep10-video-generation-prompts.md` — 원본 프롬프트 문서, 검증 중 잠시 편집했으나
  즉시 원상 복구, 최종 미변경 상태(grep 재확인 완료)
- git commit/push 없음, 승인받은 파일 범위 밖 편집 없음
- Playwright 자동 생성 스크립트 실행 안 함

## 이전에 만들었다 남아있는 관련 없는 파일

- `_ai/HANDOFF_OWL_EP10_VIDEO_RETRY.md` — 이 문서로 대체된 10편 한정 인계서.
  삭제 시도했으나 권한 거부로 실패, 현재 그대로 남아있음. 내용은 이 문서 §4·부록에
  이미 흡수됨 — 기존 계정이 확인 후 필요 없다고 판단되면 그때 삭제 처리.
