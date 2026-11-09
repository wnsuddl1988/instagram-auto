---
name: feedback-gemini-prompt-wording-refusal-2026-09-28
description: "★Gemini에서만 프롬프트 제출 직후(5초 내) 전체 씬 즉시거부, Flow는 정상★ — 원인은 콘텐츠가 아니라 문구. \"permanently glued to the character's hands\" 같은 신체 접착 표현이 Gemini 안전필터에 걸림"
metadata:
  type: feedback
  originSessionId: 96dabe12-0224-46cf-9034-b0b64d75918f
  modified: 2026-10-08T05:09:39.656Z
---

## 증상
금박사 11편 8씬 전부, 이미지 업로드는 정상이고 **프롬프트 텍스트를 입력해
제출한 직후 5초 이내**로 "I seem to be encountering an error" / "Sorry,
something went wrong" 거부. quota 메시지도 정책 거부 안내도 아닌 일반
에러 문구였다. **같은 이미지·같은 프롬프트로 Google Flow는 정상 생성됨.**

## 원인
이미지 해상도(941x1672, 요청한 1080x1920 아님)는 원인이 아니었다 —
1080x1920으로 리사이즈해도 동일하게 거부됨(먼저 의심했다가 틀린 것으로
확인). 진짜 원인은 **프롬프트 문구**였다.

11편 프롬프트에만 있고, 이전에 실제로 통과했던 황소특보 4편·부엉박사 17편
프롬프트에는 없던 표현:
- **"permanently glued to the character's hands"**(손에 영구 접착됨) — 가장
  유력한 원인. 신체 변형·접합처럼 읽혀 Gemini 안전 필터가 생성 시도 전에
  즉시 차단하는 것으로 보임.
- "white-gloved hands" 반복 언급, "NO EMPTY-HANDED POSE AT ANY POINT" 같은
  극단적 절대 부정 표현도 같이 순화 대상으로 뺐음(정확히 어느 것이 결정적
  트리거였는지 개별 A/B는 안 함 — 다 같이 빼고 통과 확인).

"glued"를 빼고 이전에 검증됐던 중립 표현 **"holds steadily at [위치]... does
not move, tilt, rotate, or drift"**로만 카드 고정을 지시하도록 8씬 전체를
다시 써서 재시도 → **정상 생성 확인(2026-09-28)**.

## Why
- Gemini(제미나이 앱/웹)와 Google Flow는 같은 Veo 계열이라도 **별도의 안전
  필터/정책 엔진**을 쓴다 — 한쪽에서 막히는 문구가 다른 쪽에서는 통과한다.
  "Flow에선 되는데 Gemini에서만 안 된다"는 관찰이 있으면 콘텐츠 자체보다
  **문구 차이**부터 의심해야 한다.
- 5초 이내(생성 시도도 못 해보고) 거부되는 건 실제 영상 생성 파이프라인이
  아니라 **입력 단계 안전 필터**에서 걸린 신호다. 이미지 문제였다면 이미지
  업로드 시점에 거부되지, 프롬프트 제출 시점에 거부되지 않는다 — 이 시점
  구분으로 원인을 이미지 vs 프롬프트로 빠르게 좁힐 수 있다.

## How to apply
1. "여러 씬이 한꺼번에, 프롬프트 제출 직후 빠르게 거부"되는 증상이 보이면
   먼저 **정확히 어느 시점에 거부되는지**(이미지 업로드 직후 vs 프롬프트
   제출 직후) 확인한다 — 이미지 vs 프롬프트 문제를 구분하는 가장 빠른 방법.
2. 같은 소스로 Flow에서도 시도해본다. Flow는 되는데 Gemini만 안 되면
   프롬프트 문구가 원인일 가능성이 매우 높다(콘텐츠 자체 문제였다면 둘 다
   막혔을 것).
3. 프롬프트에서 신체를 "붙인다/접착한다/고정된다"는 식의 과한 표현
   ("glued", "fused", "welded" 등)을 쓰지 않는다. 소품 고정 지시는 항상
   중립적으로: `holds steadily at [위치] ... does not move/tilt/rotate/drift`.
   이 표현은 이미 여러 편(황소특보 4편 등)에서 실전 검증됐다.
4. 극단적 절대 부정("NO ~ AT ANY POINT" 대문자 반복)을 과하게 쌓지 않는다
   — 카드 유지 지시는 POSITIVE 문장(계속 쥐고 있다)으로 쓰고, NEGATIVE
   PROMPT 섹션에서는 짧고 담백하게(no card tilt/rotation 정도) 마무리한다.
5. 원인 불명의 즉시 거부가 나오면, 새로 추가된 표현부터 의심하고 이전에
   실제 통과한 문서(예: `_ai/bull-ep4-video-generation-prompts.md`)와
   문구를 diff하듯 대조한다 — 이번에도 이 대조로 원인을 찾았다.

## 추가 사례(2026-10-08, 스토리 4편 11번)
- 증상: "유명인의 동영상 생성에 관한 Google 정책을 위반할 가능성" 거부(한 장면만). 장면 내용은 밤 사무실에서 회계 조사원 3명이 장부를 보는 재연. 같은 템플릿으로 다른 15장면은 통과.
- 조치: 프롬프트에서 실제 사건·수사를 떠올리는 말("investigators", "the truth is opened", 'open the ledger'류 MOOD)을 빼고 "세 명의 사무실 직원이 장부를 검토"로 중립화. 스토리형 재연 프롬프트는 **직업명(조사원·수사관·검사)·사건 암시 MOOD 문구를 쓰지 않는다**. 그래도 막히면 이미지 속 얼굴이 실존 인물과 닮았다고 본 것이므로 얼굴을 돌리거나 뒷모습·손 위주로 이미지를 다시 만든다.

## 추가 사례(2026-10-08, 황소 23편 s8·스토리 6편 s9·s12) — 실제로 통과한 방식
- **오류 문구가 둘로 갈린다**: ① "동영상을 생성할 수 없습니다"(황소 23편 s8, 카드 글자·긴 프롬프트·배경 지구본 이미지 후보였으나 원인 미확정) ② "**오디오를 생성할 수 없습니다**"(스토리 6편 s9 열쇠 전달·s12 순위 차트, 둘 다 얼굴 없이 손과 소품만 나오는 장면).
- **통과한 것**: 황소 s8 = 카드 글자를 적지 않은 최소 프롬프트("Animate this image into an 8-second video. The camera stays completely still. … Keep the card text and the background unchanged."). 스토리 6편 s9 = **A안**(소리 금지 부정문을 빼고 "SOUND: 조용한 전시장 룸톤, 열쇠가 건네질 때의 희미한 짤랑임, 책자의 가벼운 부스럭. No speech."처럼 소리를 긍정문으로 지정한 줄인 프롬프트). 스토리 6편 s12 = A안은 실패, **B안(최소 프롬프트 + "Quiet office ambience.")**으로 통과.
- **How to apply**: "오디오를 생성할 수 없습니다"가 나오면 ① 소리 금지 부정문(nobody speaks / no voice, no music / no talking …)을 빼고 나야 할 소리를 긍정문으로 한 줄 적은 A안 ② 그래도 안 되면 최소 프롬프트 B안 순서로 시도한다. 손·소품만 나오는 장면(얼굴 없음)은 처음부터 A안으로 줘도 좋다(통과율 근거는 1건뿐, 일반 규칙화는 보류). 파일: `_ai/story-ep6-s9-s12-retry-prompts.md`, `_ai/bull-ep23-s8-minimal-video-prompt.md`.

## 관련
- 대응판 문서: `_ai/geumbaksa-ep11-video-generation-prompts-gemini-safe.md`
  (원본 `geumbaksa-ep11-video-generation-prompts.md`은 이 문제가 있던 버전으로
  남겨두되, 새 편 작성 시 참고하지 말 것)
- [[feedback_video_prompt_text_preservation_must_verify]](프롬프트 강도를
  올리는 것 자체가 항상 안전하지 않다는 선례 — 이번 건은 "강하게 쓰다가
  오히려 막힌" 정반대 실패 사례로 같이 참고할 것)
