---
name: feedback-manual-video-file-naming-convention
description: "Owner가 수동으로 생성한 영상을 숫자 파일명(1.mp4~N.mp4)으로 전달할 때, 숫자는 곧 씬 번호다 — 매번 묻지 말고 1=씬1, 2=씬2... 로 바로 매칭할 것"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 96dabe12-0224-46cf-9034-b0b64d75918f
  modified: 2026-09-23T14:28:50.347Z
---

## 규칙

Owner가 Veo/Flow 등에서 수동으로 영상을 생성해 `C:\Users\PC\Downloads\1.mp4`, `2.mp4`, ... 처럼 **숫자만으로 된 파일명**을 여러 개 전달하면, 그 숫자는 항상 **씬 번호**를 의미한다. 즉 `1.mp4`=씬1(s1), `2.mp4`=씬2(s2), ..., `10.mp4`=씬10(s10).

**Why**: Owner가 "앞으로 영상 생성 수동으로 해서 내가 전달해줄때 제목은 1→씬1, ~~~, 10→씬10이라고 생각하면 돼. 이것도 묻지말고 기억해놔"라고 명시적으로 지시함(2026-09-24, 부엉박사 15편 영상 10개 전달 시).

## How to apply

- 숫자 파일명 영상들을 받으면 **매핑을 다시 묻지 말고** 바로 파일명=씬번호로 간주해 검수·조립을 진행한다.
- 그 편의 씬 구성(예: `_owl-epN-assembly-spec.mjs`나 영상 생성 프롬프트 문서의 씬 순서)과 대조해 각 숫자 파일을 해당 씬 이름(예: `owl_epN_s6_consequence_motion.mp4`)으로 rename하거나 매핑해서 조립 스크립트에 넘긴다.
- 파일 개수가 그 편의 총 씬 수와 다르면(예: 10씬인데 8개만 옴) 빠진 번호를 확인하고 Owner에게 알린다 — 이 경우는 매핑 규칙이 아니라 누락 여부를 물어야 한다.
