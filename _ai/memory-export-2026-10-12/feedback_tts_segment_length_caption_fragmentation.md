---
name: tts-segment-length-caption-fragmentation
description: "TTS speechDirection.segments 한 조각이 너무 길면(약 9어절 이상) 자막이 \"거고\"처럼 1~2글자 조각으로 잘게 쪼개짐 — 세그먼트 작성 시 길이 상한 지킬 것"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 0616c897-fe63-4f4b-b75e-04be8bd972c3
  modified: 2026-09-22T07:08:43.046Z
---

부엉이/금박사 조립기(`run-owl-assemble-shorts-v2.mjs`)의 자막 안전망 로직
(`splitCaptionIntoScreenSafeBlocks`)은 한 자막 블록이 화면 폭(2줄, 줄당 약
15자)에 안 들어가면 조각 수를 2→3→4...로 늘려가며 "모든 조각이 폭 안에
들어가는 최소 조각 수"를 찾는다. 이 루프는 균등 분할(N등분)이라 마지막
조각이 원래 문장 끝의 짧은 어미("거고", "거야" 등)만 남기며 혼자 쪼개지는
걸 막지 못한다.

**Why:** 2026-09-22 부엉박사 13편 s7에서 발견. TTS 세그먼트("참고로 DB형은
회사가 운용해서 퇴직금이 미리 정해져 있는 거고,")가 9어절·28자로, 다른
씬들의 세그먼트(보통 5~8어절)보다 길었다. 이 길이는 괄호 설명("DB형
(확정급여형)")을 덧붙이기 전부터 이미 2줄 폭에 전혀 들어가지 않는 수준이라,
5조각("참고로"/"DB형은"/"회사가 운용해서"/"퇴직금이 미리 정해져 있는"/
"거고")으로 쪼개졌다. `chooseSemanticSplit`(별도 파일
`_money-shorts-dynamic-captions.mjs`)에 최소 글자수 조건을 추가해봤지만
근본 원인이 아니어서 효과 없었고, `splitCaptionIntoScreenSafeBlocks`의 N등분
루프에 최소 조각 크기 조건을 넣었더니 오히려 단어 단위까지 더 잘게
쪼개지는 부작용이 나서 되돌렸다 — 이 루프 자체를 건드리는 건 위험도가
높다.

**How to apply:**
- TTS 스크립트(`owl-epN-tts-script.json`)의 `speechDirection.segments` 각
  조각을 작성할 때, 한 조각이 대략 7~8어절(한글 기준 약 20~24자)을 넘지
  않도록 쪼갠다. 특히 "~는데," "~해서," "~거고," 처럼 뒤에 대구를 이루는
  긴 설명문(DB/DC 비교, 조건 나열 등)은 반드시 콤마 단위로 세그먼트를
  나눠라 — 한 세그먼트로 몰아넣지 말 것.
- 자막에만 쓰이는 `captionDisplayText`에 괄호 설명(예: "(확정급여형)")을
  덧붙일 계획이면, 그만큼 원문이 더 길어져 화면 폭 초과 위험이 커진다는
  걸 감안해 세그먼트를 더 짧게 잡는다.
- 이미 조립된 결과물에서 파편화가 의심되면 `owl_captions.ass`를 직접 열어
  `grep`으로 각 Dialogue 줄의 지속시간(End-Start)이 0.7초 미만인 게 있는지
  확인 — 한 줄짜리 초단시간 블록이 이 패턴의 징후다.
