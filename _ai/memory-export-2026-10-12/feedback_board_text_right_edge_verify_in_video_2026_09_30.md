---
name: feedback-board-text-right-edge-verify-in-video-2026-09-30
description: "보드 글자 오른쪽 끝은 이미지 시트가 아니라 영상 조립 후 오른쪽 25% 확대로 실측(황소 11편 7개 씬 91~94% 초과), 교정은 클립 좌측 이동+mirror, 예방은 황소+보드 묶음 폭 ≤76%"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-09-30T11:07:22.823Z
---

황소 11편에서 이미지 안전선 시트로는 "글자는 안전폭 안"이라 판단했으나(내 오판), 영상 조립 뒤 오른쪽 확대 실측에서 보드 씬 7개(s3·6·8·10·12·14·16)의 글자 끝이 91~94%로 크롭선(90%) 밖이었다.

**Why:** 황소+보드 묶음이 이미지 폭의 92%(황소 2~38%, 보드 50~94%)를 차지하는 구도를 모델이 만들고, 위치·폭 좌표 문구는 무시한다(s4 재생성 3회 실패로 확인). 이미지 시트는 보드 프레임만 보고 글자 끝을 눈대중으로 판단하기 쉽다.

**How to apply:** 영상 검수 때 보드 씬마다 오른쪽 25%를 확대해 x972(빨강)·x950(주황) 선과 겹쳐 본다. 초과 시 해당 클립만 720→1080 확대 → 워터마크 제거 → 왼쪽 이동(fillborders mirror) → 그 폴더로 조립(상세 CURRENT_STANDARDS A-6). smear는 줄무늬 글리치라 쓰지 않는다. 다음 편은 이미지 브리프에서 묶음 폭을 줄이는 방향으로 예방. 카드 씬은 좌우 20~80%로 안전. 관련: [[feedback-video-quality-system-v2-2026-09-30]], [[project-bull-ep11-shipbuilding-in-progress-2026-09-30]].
