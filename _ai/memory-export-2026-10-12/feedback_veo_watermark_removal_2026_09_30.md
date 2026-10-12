---
name: feedback-veo-watermark-removal-2026-09-30
description: "화면 하단 채널명 띠를 뺀 배치 v2부터 Veo 클립 우하단 워터마크(✦ 또는 \"Veo\" 글자)가 드러남 — 모든 새 편은 CTA 결합 후 워터마크 제거 필수, QA가 표식 없으면 차단"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-09-30T05:37:46.571Z
---

Owner 지적(2026-09-30): "하단에 채널명(경제번역소) 띠를 안 넣으면 제미나이 워터마크가 보인다. 똑바로 기억하고 놓치지 마." 맞다 — 띠(y1770~1920)가 우하단 워터마크를 가려 주고 있었는데, 화면 배치 v2에서 띠를 뺄 때 이 부수 효과를 점검하지 못했음.

- **워터마크 두 종류**(클립마다 섞임, 황소·부엉 모두 같은 위치, 1080x1920 기준): ✦ 모양 중심 (900,1740) 약 72x80 / "Veo" 글자 x1024~1058 y1881~1899.
- **해결 도구**: `scripts/run-remove-veo-watermark-once.mjs --in <final> --out <final_nowm>` (delogo 2영역, 오디오 복사, 메타데이터 `comment=veo_watermark_removed_v1` 기록).
- **조립 순서(항상)**: CTA 결합 → 워터마크 제거 → run-audio-finish → run-episode-qa → 압축·배포. 배포 영상은 반드시 제거본.
- **놓치지 않는 장치**: `run-episode-qa-once.mjs`가 표식 없으면 "반드시 수정"(배포 금지), 표식이 있어도 `qa/watermark-check.png`(우하단 20지점)로 눈으로 잔여 확인. 시험 완료: 표식 없는 파일 차단·있는 파일 통과.
- **검증(15편)**: 30개 지점 전부 깨끗(CTA 끝까지). 황소 10편 시험본도 같은 위치에 두 종류 확인. 커버·스토리(ChatGPT 생성)는 워터마크 없음.
- 이미 배포한 편(황소 10편 이전·부엉 14편 이전)은 띠가 있던 배치라 영향 없음. 부엉 15편은 제거본으로 배포됨(릴스 Dd5lilOFcv7, 유튜브 qb5n9FOW5Y8).
- 주의: 다른 해상도·다른 위치의 워터마크(예: 새 Veo 버전)가 나오면 이 좌표가 안 맞을 수 있다 — QA 시트에서 잔여가 보이면 좌표를 다시 측정. 스크립트는 1080x1920이 아니면 ABORT.

**Why:** 화면 배치를 바꿀 때 기존 요소가 가려 주던 것이 없는지 함께 점검해야 함. **How to apply:** 새 편 조립 절차에 항상 포함(CURRENT_STANDARDS 최우선 규칙 18·§A-7). 관련 [[feedback-video-quality-system-v2-2026-09-30]].
