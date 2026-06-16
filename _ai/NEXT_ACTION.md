# Next Action

## 현재 상태

- upload_002_copier: 에피소드 폐기 확정 (2026-06-16)
- 기존 2편 수습 작업 중단
- 신규 에피소드 기획 단계로 전환

## 다음 atomic task

**"자동문 면접" Contract 5종 Owner 승인 → 생성 착수**

- `_ai/CONTRACT_자동문면접.md` Owner 검토 대기
- 승인 시: 씬 이미지(ChatGPT) → Veo 영상 → TTS → 조립 순서
- 생성 전 각 단계마다 preflight/dry-run 필수
- 승인 전 이미지/Veo/TTS 생성 절대 금지

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
