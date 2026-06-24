# Next Action

## 2026-06-25 현재 — Fact Card -> Video Blueprint checkpoint 준비 완료

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
- 포함: source-first docs + `lib/source-facts/`
- push: 미실행

최근 완료:

- `money-shorts-os-fact-card-to-blueprint-v1`
- `lib/blueprints/` 로컬 타입/생성/검증 모듈 구현
- review-fix에서 scene timing, deterministic output, template key spec alignment, validation timing invariants 수정 완료
- Codex runtime verification:
  - 15s/30s/60s fixtures: target, estimatedDurationSec, scene duration sum, max end all match
  - broken duration sample: validation fail with expected timing errors

Source of truth:

- `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`
- `_ai/MONEY_SHORTS_OS_PRD_V1.md`
- `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`
- `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`
- `_ai/PRODUCTION_PIPELINE_RESET_V1.md`

핵심 생성 순서:

1. 데이터 소스 선택
2. 원본 데이터 또는 공시 수집
3. 핵심 숫자 추출
4. 전월/전년/이전 발표치 비교
5. Fact Card 생성
6. 출처 링크/출처명 저장
7. 쇼츠 주제 생성
8. Video Blueprint 생성
9. 대본/자막/차트/이미지/음성/영상 패키지 생성
10. 금융표현 위험 검수
11. Money-OS CTA는 필요한 경우에만 삽입

## 다음 safe work unit

**MVP 1 — Fact Card/Blueprint 기반 script/caption/storyboard generator**

Task ID:

`money-shorts-os-fact-card-script-generator-v1`

목표:

- 기존 `FactCard`와 `VideoBlueprint`를 입력으로 받아 외부 API 없이 deterministic script/caption/storyboard package를 만든다.
- Fact Card/Blueprint 밖 숫자나 사실을 생성하지 않는다.

포함:

- generated script package TypeScript types
- 15s/30s/60s script/caption/storyboard helper
- Fact Card / Blueprint / citation linkage
- source note preservation
- lightweight validation helper
- focused TypeScript/ESLint/runtime sample check

금지:

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
