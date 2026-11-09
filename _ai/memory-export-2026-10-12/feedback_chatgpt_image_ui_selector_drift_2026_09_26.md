---
name: feedback-chatgpt-image-ui-selector-drift-2026-09-26
description: "★★★ChatGPT 이미지생성 자동화가 OpenAI 웹UI 변경으로 4종 연쇄고장(입력창/전송버튼/결과이미지DOM/cid판정) — 황소특보뿐 아니라 부엉박사·금박사 전부 같은 위험, 공용코어 고쳐도 로컬복제 스크립트는 안고쳐짐★★★"
metadata:
  type: feedback
  originSessionId: 96dabe12-0224-46cf-9034-b0b64d75918f
  modified: 2026-09-26T04:36:53.952Z
---

## 무슨 일이 있었나 (2026-09-26, 황소특보 4편 이미지 생성 중)

Owner가 "어제 오후까지만해도 문제없었는데" "1편 완성됐는데 캐치도 못하고 있다"고
두 번 지적할 정도로 이미지 생성 자동화가 계속 실패했다. 원인은 코드 로직 실수가
아니라 **OpenAI가 ChatGPT 웹 UI를 여러 곳에서 동시에 바꿨기 때문**이었다:

1. 입력창 DOM: `<textarea id="prompt-textarea">` → `<div contenteditable="true"
   data-composer-markdown>` 로 교체됨.
2. 전송 버튼 라벨: "메시지 보내기" → "보내기"로 변경(또는 라벨 자체가 없어짐).
3. 결과 이미지 DOM: 예전엔 `[data-message-author-role="assistant"]` 밑에서 찾으면
   됐는데, 지금은 `[data-testid="generated-image-preview"]`로 감싸는 방식으로 바뀜.
4. 대화 turn 컨테이너: `conversation-turn` 클래스 → `data-turn-key` 속성.
5. **가장 결정적인 버그**: 결과 이미지 URL이 이제 `blob:` 체계라 `cid(src)` 함수(URL
   쿼리스트링의 `id=` 파라미터를 파싱)가 항상 `null`을 반환한다. "새로 생성된 이미지"
   판정 필터가 `x.cid && !baselineCids.has(x.cid)` 식으로 `cid` 단독 조건이었기 때문에,
   **실제로는 이미지가 완성됐는데도 필터가 영원히 빈 배열을 반환**해서 스크립트가
   "생성 완료 감지 실패"로 계속 타임아웃 처리했다. Owner가 "1편 완성됐는데 캐치
   못한다"고 지적한 사건의 진짜 원인이 이것이었다.

## 핵심 함정: 공용 코어를 고쳐도 로컬 복제 스크립트는 안 고쳐진다

`_chatgpt-image-core.mjs`(공용 코어, `PROMPT_COMPOSER_SELECTOR` export 등으로
정상 수정됨)와 `probe-character-consistency-chatgpt-v1.mjs`(캐릭터 일관성
연속포즈 생성용, 정상 수정됨)는 먼저 고쳤다. 하지만 **`run-owl-cardnews-chatgpt-v1.mjs`
(카드뉴스/커버/스토리 이미지 생성용)는 같은 로직을 자체적으로 복제 정의**하고
있어서 코어를 고쳐도 전혀 반영되지 않았고, 커버 이미지 생성 시도에서 똑같은
`"composer: #prompt-textarea not visible"` 에러가 그대로 재현됐다.

**Why:** 이 프로젝트의 ChatGPT 이미지 자동화 스크립트가 22개나 `_chatgpt-image-core.mjs`를
import하지만, 그중 일부(`run-owl-cardnews-chatgpt-v1.mjs` 확인됨)는 `collectGeneratedImages`,
`attachReferenceImage`, 전송 버튼 셀렉터, cid 판정 필터를 **import하지 않고 파일
내부에 옛날 버전을 그대로 복제해서** 갖고 있다. OpenAI가 UI를 또 바꿀 때마다
코어만 고치고 "다 됐다"고 안심하면, 로컬 복제본을 가진 스크립트에서 반드시
재발한다 — 부엉박사·금박사 이미지/카드뉴스 생성 스크립트도 예외가 아니다.

## How to apply (다음에 UI 변경 의심 시 반드시 확인할 것)

이미지 생성이 "어제까지 되던 게 안 된다", "생성은 됐는데 스크립트가 실패로
처리한다" 같은 증상을 보이면:

1. 먼저 `_chatgpt-image-core.mjs`가 최신인지 확인 (`PROMPT_COMPOSER_SELECTOR`,
   `sendPrompt`, `checkSendEnabled` 등 export 존재 여부).
2. **캐릭터/채널과 무관하게, 지금 실행하려는 그 스크립트 파일 자체**에
   `#prompt-textarea`, `composer-plus-btn` 등 옛 셀렉터가 하드코딩돼 있는지
   `grep`으로 직접 확인한다 — 코어가 고쳐졌다는 사실이 그 스크립트도 고쳐졌다는
   뜻이 아니다.
3. cid 판정이 남아있는 스크립트는 전부 `x.cid` 단독 조건을 `(x.cid || x.src)`로
   바꿔야 한다(blob URL 체계에서 cid가 항상 null이기 때문).
4. `collectGeneratedImages` 함수가 URL 패턴 매칭(`backend-api/estuary/content|oaiusercontent`)
   방식만 쓰고 있으면 blob URL을 아예 걸러버리므로, `[data-testid="generated-image-preview"] img`
   기준으로도 잡도록 이중화해야 한다.
5. 새 대화를 강제로 열어야 하는 흐름(`openFreshImageChat`)이 실제로 메인 함수에서
   **호출되고 있는지**도 확인 — 함수가 존재하는 것과 호출되는 것은 별개다(4편 s1이
   엉뚱한 기존 대화에 이어붙은 사고 원인이었음).

이번에 실제로 위 패턴을 그대로 갖고 있어서 고친 파일: `run-owl-cardnews-chatgpt-v1.mjs`
(219/221줄 `#prompt-textarea` 하드코딩, 로컬 `attachReferenceImage`의 구식 플러스버튼
셀렉터, 하드코딩된 전송버튼 셀렉터, `collectGeneratedImages`의 URL패턴 전용 필터,
`x.cid` 단독 조건 2곳). 부엉박사(`run-owl-*`)나 금박사(`run-geumbaksa-*`) 계열
스크립트도 카드뉴스/커버/스토리 생성 시 같은 증상이 나면 이 파일과 동일한
패턴(로컬 복제 여부)부터 의심할 것 — 재조사 없이 이 체크리스트 4항목을 순서대로
확인하면 된다.

관련: [[project_bull_script_structure_v3_confirmed_2026_09_26]]
