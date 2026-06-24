# PROJECT_STATE — AutoShorts MVP

**갱신:** 2026-06-25

**전체프로젝트 진행률:** 약 49% — 제품 중심축을 출처 기반 금융·경제 쇼츠 제작 OS로 정정했고, 첫 source/fact-card TypeScript foundation을 local checkpoint로 저장했다. 다음 단계는 Fact Card를 Video Blueprint로 변환하는 로컬 모델/생성 구조다.

> **현재 품질 게이트:** `MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED`. 이전 영상 제작 방식은 active direction이 아니다. 새 작업은 `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`, `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`, `_ai/MONEY_SHORTS_OS_PRD_V1.md`, `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`, `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`, `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md` 기준으로 진행한다.

---

## 현재 제품 방향

개발명:

- **Money Shorts OS**

제품 정의:

- 한국 경제·금융 콘텐츠를 출처 기반으로 기획한다.
- 쇼츠 대본·차트·썸네일·자막·게시문구를 생성한다.
- Fact Card 기반으로 쇼츠 대본·차트·썸네일·자막·게시문구를 생성한다.
- 단순 AI 영상 생성기나 돈관리 쇼츠 생성기가 아니라 출처 기반 금융·경제 쇼츠 제작 OS다.
- 초기에는 Owner가 매일 쓸 내부 쇼츠 제작 도구로 완성하고, 검증 후 크리에이터용 SaaS로 확장한다.
- Money-OS는 메인 콘텐츠 주제가 아니라 필요한 경우에만 붙는 CTA/전환 레이어다.

수익화 구조:

1. 금융·경제 쇼츠 생성기
2. Money-OS SaaS 결제 유도
3. 제품 판매 / 제휴 / 템플릿 판매

상세 기준:

- `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`
- `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_PRD_V1.md`
- `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`
- `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`
- `_ai/PRODUCTION_PIPELINE_RESET_V1.md`

최신 제품 기준:

- 앱 UI: 네이비/차콜/골드 기반의 신뢰감 있는 프리미엄 SaaS 톤.
- 쇼츠 템플릿: 밈형도 무거운 리포트형도 아닌 **균형형 프리미엄 금융 쇼츠** 톤.
- 콘텐츠 비중: 출처 기반 금융·경제 쇼츠 70%, Money-OS 연결형 돈관리 쇼츠 30%.
- 핵심 카테고리: 금리, 환율, 물가, 고용, 소비, 경기지표, ECOS/KOSIS/금융공공데이터/OpenDART/FRED, 기업 공시/실적/재무정보.
- Fact Card 없이 대본 생성 금지.
- Money-OS CTA는 개인 돈관리와 자연스럽게 연결되는 경우에만 삽입.
- 최종 톤: 프리미엄하지만 어렵지 않고, 진지하지만 부담스럽지 않으며, 쇼츠답게 빠르지만 싸 보이지 않는 금융·돈관리 쇼츠.
- 생성 안정화 기준: `데이터 소스 -> 원본/공시 -> 핵심 숫자 -> 비교값 -> Fact Card -> Video Blueprint -> 대본/차트/영상`.
- 구현 순서 기준: `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`. 자동 업로드/결제/대규모 템플릿/완전 자동 Veo/인스타·유튜브 API는 초기 MVP 우선순위가 아니다.

---

## 최근 checkpoint

- Commit: `acbaba9` — `feat(source): add fact card types and validation`
- Branch: `main`
- Remote: `origin/main` 대비 ahead 36
- Push: 미실행

포함:

- `lib/source-facts/types.ts`
- `lib/source-facts/fixtures.ts`
- `lib/source-facts/validation.ts`
- `lib/source-facts/index.ts`

검증:

- 새 모듈 TypeScript strict check PASS
- 새 모듈 ESLint PASS
- runtime validation sample PASS

주의:

- 전체 `pnpm lint`/전체 `tsc`는 기존 앱/archive/output 누적 오류가 있어 별도 정리 전까지 전체 통과 기준으로 보지 않는다.
- `_ai/CONTEXT_TRANSFER_CODEX.md`와 `output/`은 commit 대상이 아니다.

---

## 폐기된 active route

- Candidate10 / old Money Architect 후속 개선
- 정적 이미지 8장 + 자막 + 내레이션 조립 방식
- code-GFX 최종 후보 루프
- GPT visual plate만으로 끝나는 영상 방식
- 3D character static plate 방식
- 생활꿀팁/EP001 돈 방어/old Money Architect 기존 주제 흐름
- Jun/준/시트콤/자동문 면접/ep003/upload_002/복사기 계열

과거 output/git history는 역사/증거로만 보존한다.

---

## 다음 단계

다음 safe work unit:

- **MVP 1 — Fact Card -> Video Blueprint local model/generator**

구현 대상:

- Video Blueprint TypeScript types
- scene model types
- Fact Card -> Video Blueprint deterministic helper
- source citation linkage
- lightweight validation helper
- no external AI/API
- no DB migration
- no video render
- no TTS
- no ffmpeg
- no payment/deploy/upload/post/push

금지:

- 이전 영상 후보 추가 개선
- 이전 산출물 기반 prompt 재사용
- Jun/준/시트콤/복사기/upload_002/ep003/3d_sitcom reference 사용
- 생활꿀팁/EP001/old Money Architect 기존 주제 재개
- upload/post/push/deploy/env/DB/dependency 변경
