---
name: project-bull-ep7-deploy-2026-09-28
description: 황소특보 7편(국내 바이오사 FDA 승인 상한가) 배포 완료 — 링크와 제작 경위
metadata:
  node_type: memory
  type: project
  originSessionId: 96dabe12-0224-46cf-9034-b0b64d75918f
  modified: 2026-09-28T13:04:45.050Z
---

황소특보 7편(국내 바이오사 FDA 승인 상한가, 종목명 미표기)을 2026-09-28 배포 완료.

- 인스타 릴스: https://www.instagram.com/reel/Dd1PBm9DPEB/
- 인스타 스토리: 게시 완료(24시간 뒤 자동 만료)
- 유튜브: https://www.youtube.com/shorts/RnnV9NaW3BU

**제작 경위**: 원래 16씬(s1~s16)으로 제작했으나, s12(균형 씬, "매수 추천 아님"을
직접 나레이션하는 씬)가 종목명을 한 번도 언급하지 않은 채 매수 불가를 언급하는 게
어색하다는 Owner 지적으로 최종본에서 삭제. s11→s13으로 직결해도 흐름(변동성 설명
→ 한 줄 요약)이 자연스러움을 Owner가 영상으로 직접 확인 후 승인. 리스크 고지는
오프닝(s3)·마지막(s16) 하단 자막바로만 유지(나레이션 내 명시적 매수불가 언급은
이 편 한정 예외였고 삭제로 종료). 최종 스펙은 `scripts/_bull-ep7-assembly-spec.mjs`
(15씬).

**Why**: 바이오주는 등락폭이 특히 커서 투자경고가 중요한 소재였지만, 씬 흐름상
"무엇에 대한 매수인지" 근거 없이 경고만 튀어나오는 구조적 어색함이 실제 완성
영상에서 드러났다 — 대본 검수 단계가 아니라 **완성 영상을 실제로 본 뒤에만
발견된 문제**였다는 점이 특기할 만함.

**How to apply**: 앞으로 균형/경고 씬을 넣을 때, 나레이션이 앞선 근거 씬(종목명·
수치 등 구체적 대상)과 명확히 연결되는지 완성 영상 리뷰 단계에서 재확인. 씬을
삭제해야 할 때는 아래 [[feedback_scene_deletion_requires_audio_alignment_rebuild]]
절차를 따를 것.
