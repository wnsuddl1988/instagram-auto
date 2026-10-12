---
name: feedback-header-center-alignment-unsupported-glyph
description: 상단 제목(headerTitle) 줄이 화면 중앙에서 살짝 벗어나 보이면 폰트가 지원 안 하는 글자(한자 등)가 텍스트에 섞여 있는지부터 확인
metadata:
  node_type: memory
  type: feedback
  originSessionId: 96dabe12-0224-46cf-9034-b0b64d75918f
  modified: 2026-09-28T13:05:51.492Z
---

황소특보 7편에서 상단 제목 둘째 줄("FDA 승인에 상한가")이 화면 정중앙보다
왼쪽으로 치우쳐 보인다는 지적(2026-09-28, Owner가 스크린샷으로 확인)이 있었다.
drawtext 필터의 `x=(w-text_w)/2` 계산 자체는 정확했고(격리 테스트로 확인),
원인은 `_bull-ep7-assembly-spec.mjs`의 `headerTitle: [..., "美 FDA 승인에
상한가"]`에 **한자 "美"**가 섞여 있었던 것 — Black Han Sans 폰트가 이 글자를
지원하지 않아 화면에는 렌더링되지 않지만, ffmpeg의 `text_w`(텍스트 폭 계산)에는
그 글자의 advance width가 그대로 포함되어 중심 계산이 어긋났다.

**진단 방법**: 화면 중앙에 빨간 세로선을 그어(`drawbox=x=540:y=0:w=4:h=1920`)
실제 렌더링된 프레임과 겹쳐보면 어긋남이 육안으로 명확히 보인다. 고립된
ffmpeg 테스트(같은 텍스트를 검은 배경에 단독으로 그려보기)로 재현되면 텍스트
자체의 문제, 재현 안 되면 파이프라인의 다른 단계(스케일링, 필터 순서 등) 문제로
좁힐 수 있다.

**How to apply**: 대본/헤더 문구에 한자·특수문자를 넣기 전에, Black Han Sans가
지원하는 문자셋(한글·영문·숫자·기본 문장부호)인지 확인. 한자가 꼭 필요하면
차라리 한글로 풀어쓰거나(美→미국) 완전히 뺀다. 헤더뿐 아니라 카드 이미지
프롬프트, 자막 등 drawtext로 렌더링되는 모든 텍스트에 동일하게 적용된다.
