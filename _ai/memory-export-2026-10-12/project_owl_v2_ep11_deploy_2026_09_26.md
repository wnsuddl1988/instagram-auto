---
name: project-owl-v2-ep11-deploy-2026-09-26
description: "부엉박사 11편(v2 첫 편, 청약통장 전환기한+금리 3.1%) 배포 완료 2026-09-26 — 링크와 제작 교훈(v1 재사용 영상 끝부분 카드 낙하, 이미지 파일명 혼동)"
metadata:
  node_type: memory
  type: project
  originSessionId: 072a6a2a-7ff7-4a0b-ab74-601eb8f8388a
  modified: 2026-09-26T12:28:10.495Z
---

2026-09-26 배포. 릴스 instagram.com/reel/Ddv6St0AGcE, 카드뉴스 instagram.com/p/Ddv6fTck2bP, 유튜브 youtube.com/shorts/8xPxKhnd9_o, 스토리. 완성본 124.13초(본편 109.6 + CTA), TTS 속도 1.0 첫 적용, 읽는 글자 약 540자.

교훈:
- v1 8초 영상 재사용 시 끝부분(7.4~7.7초)에 카드 낙하가 흔함 → v2는 더 길게 써서 노출. TTS 실측 후 재사용 클립 끝을 0.3초 간격으로 확인하고 결함이면 v1 이미지로 10초 재생성(CURRENT_STANDARDS §7 규칙).
- 재생성 요청 때 v1 이미지 파일명(owl_ep17_s7)과 v2 씬 번호(s8)가 달라 Owner가 다른 이미지를 쓴 적 있음 → 요청 시 카드 문구를 함께 적는다.
- 커버·스토리·카드뉴스는 v1용이 v2 내용과 맞아 재사용.

같은 날 짝 금박사 5편(파일 ep7 예금자보호)도 배포: 릴스 instagram.com/reel/DdwCAo6DtBU, 유튜브 youtube.com/shorts/9qFa3fhYljg. 금박사 6편(ep8)은 재고 조립 시 짧게 잘린 클립 때문에 화면이 대사보다 최대 4.6초 앞서 나가던 결함을 발견해 s2·s5 10초 재생성+풀클립 재조립으로 수정(`geumbaksa-ep8-final-v3std`).

**Why:** v2 재제작 7편의 첫 편이라 12~17편 제작 기준이 된다. **How to apply:** [[project_owl_script_structure_v2_confirmed_2026_09_26]] 참고, 다음은 12편 토지(9/27).
