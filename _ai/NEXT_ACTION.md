# Next Action

## 현재 상태

- upload_002_copier: 에피소드 폐기 확정 (2026-06-16)
- **자동문 면접 키프레임 4씬 완료 (2026-06-19)**
  - S1/S2/S3/S4 전부 Codex QA PASS
  - 누적 전송 5/8회, 잔여 예산 3회
- 신규 에피소드 Veo 사전설계 단계로 전환

## 다음 atomic task

**자동문 면접 — Veo 영상 생성 사전설계 (Owner 승인 대기)**

- 키프레임 4씬 레퍼런스 확정, 사전 Veo 프롬프트 설계 단계
- Codex/Owner 다음 승인 필요

## 금지

- Any external call (ElevenLabs / Veo / GPT 이미지)
- 새 영상 생성
- 기존 파일 삭제
- commit/push/merge/reset/clean

## 후보 기준 (QUALITY_GATE Episode Rules)

- 대사가 화면 사건보다 먼저 나오는 구조 → FAIL
- 컷 전환 중 핵심 대사가 걸리는 구조 → FAIL
- 대사로 화면을 억지 설명하는 구조 → FAIL
- Boss/제3자 등장은 화면상 진입 근거 없으면 → FAIL
- 영상 없이 대본만 읽어도 의미가 통하는 구조 → FAIL (영상 의존도 필수)

## After Owner approval

Owner가 기획안 중 1개 승인 → Event/Dialogue/Emotion/Sound/Stop-Loss Contract 5종 작성 → 승인 후 생성
