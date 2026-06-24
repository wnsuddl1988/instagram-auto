# Next Action

## 2026-06-25 현재 — Risk review checkpoint 준비 완료

상태: **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**

Owner 결정:

- 프로젝트 본체는 돈관리 쇼츠 생성기가 아니다.
- 본체는 **출처 기반 금융·경제 쇼츠 제작 OS**다.
- Money-OS는 메인 콘텐츠 주제가 아니라 보조 CTA/전환 레이어다.
- 콘텐츠 비중은 출처 기반 금융·경제 쇼츠 70%, Money-OS 연결형 돈관리 쇼츠 30%.
- 각 쇼츠는 반드시 Fact Card를 먼저 만든 뒤 Video Blueprint와 대본으로 넘어간다.
- AI는 Fact Card에 없는 숫자나 사실을 상상해서 대본을 쓰면 안 된다.

최신 checkpoint:

- `909098b feat(source): establish clean source-first baseline`
- `35ca73c feat(blueprints): add fact card video blueprint generator`
- `902e632 feat(scripts): add source-linked script package generator`
- push: 미실행

최근 완료:

- `money-shorts-os-risk-review-v1`
- `lib/risk-review/` 로컬 금융표현 위험 검수 모듈 구현
- review-fix에서 risky fixtures의 `sourceAttributions` 타입 shape 수정 완료
- Codex verification:
  - source-first module-only TypeScript diagnostics: 0
  - ESLint `lib/risk-review`: PASS
  - safe fixture: `overallRiskLevel="low"`, `isBlocked=false`, findings 0
  - risky blocked fixture: 필수 7개 위험 문구 모두 탐지, `overallRiskLevel="blocked"`
  - risky high fixture: `overallRiskLevel="high"`, `isBlocked=false`

Source of truth:

- `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`
- `_ai/MONEY_SHORTS_OS_PRD_V1.md`
- `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`
- `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`
- `_ai/PRODUCTION_PIPELINE_RESET_V1.md`

## 다음 safe work unit

**MVP 1 — 9:16 chart/number-card source-backed model**

Task ID:

`money-shorts-os-chart-card-model-v1`

목표:

- Fact Card/Blueprint 값을 기반으로 9:16 차트/숫자 카드 props 모델을 만든다.
- 실제 렌더링, 이미지 생성, ffmpeg 실행 없이 데이터 모델과 validation만 만든다.

포함:

- chart/card TypeScript types
- number card / comparison card / source card props
- Fact Card / Blueprint / citation linkage
- deterministic helper
- lightweight validation helper
- focused TypeScript/ESLint/runtime sample check

금지:

- canvas/SVG/PNG/chart render 생성
- ECOS/KOSIS/OpenDART/FRED live API 호출
- GPT/Gemini/Veo/ElevenLabs live call
- API key/env/secret 변경
- Supabase migration 적용
- dependency/lockfile 변경
- video render
- ffmpeg 실행 파이프라인 구현
- payment/deploy/upload/post/push
- Money-OS 전체 기능 구현
- 이전 영상 후보 개선
