# Next Action

## 2026-06-25 현재 — Owner Decision Gate 완료, Clipboard Payload 준비

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
- `79faa5b feat(risk): add financial expression scanner`
- `fa6b5a1 feat(chart-cards): add source-linked card props model`
- `5bb99fd feat(image-prompts): add source-linked prompt package generator`
- `55f4a9b feat(voice-profiles): add local tts script formatter`
- `14f3c53 feat(timeline): add local timeline recalculation`
- `90fcaa6 feat(render-plan): add local ffmpeg manifest planner`
- `4256173 feat(final-qa): add source-first package readiness checks`
- `bfaf5b9 feat(content-package): assemble source-first package chain`
- `ca3bd36 feat(source-facts): add manual fact card authoring`
- `538d0d1 feat(review-packet): add owner review packet generator`
- push: 미실행

최근 완료:

- `money-shorts-os-owner-decision-gate-v1`
- `money-shorts-os-owner-decision-gate-v1-review-fix`
- `money-shorts-os-owner-decision-gate-v1-review-fix-2`
- `lib/owner-decision/` 로컬 Owner decision gate 구현
- Codex verification:
  - ESLint `lib/owner-decision`: PASS
  - targeted TypeScript diagnostics for `lib/owner-decision`: 0
  - runtime sample PASS: approved valid gate PASS, pending/revision/rejected FAIL, mismatch FAIL, packet-based default gateResultId PASS, explicit id override PASS, malformed decision FAIL with `unsupported_decision`, QA/risk blocked FAIL, output not created

Source of truth:

- `_ai/HANDOFF_NOW.md`
- `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`
- `_ai/MONEY_SHORTS_OS_PRD_V1.md`
- `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`
- `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`
- `_ai/PRODUCTION_PIPELINE_RESET_V1.md`

## 다음 safe work unit

**MVP 1 — local clipboard payload**

Task ID:

`money-shorts-os-clipboard-payload-v1`

목표:

- approved Review Packet + Owner Decision Gate Result를 기반으로 MVP1 UI/clipboard copy workflow가 사용할 copyable payload를 만든다.
- 실제 OS clipboard 접근, 파일 export, render, upload 없이 데이터 구조만 만든다.

포함:

- clipboard payload TypeScript types
- deterministic review-packet/gate-to-copy-payload helper
- script narration/caption/social copy/source attribution sections
- `copyReady` gate
- blocked/mismatched fixtures
- runtime samples

금지:

- OS clipboard write
- ffmpeg 실행
- video/audio/image render
- actual media probing 또는 real duration 측정
- ElevenLabs live call
- OpenAI/GPT/Gemini/Veo live call
- ECOS/KOSIS/OpenDART/FRED live API 호출
- API key/env/secret 변경
- Supabase migration 적용
- dependency/lockfile 변경
- `output/` 변경
- file export/write
- payment/deploy/upload/post/push
- Money-OS 전체 기능 구현
- 이전 영상 후보 개선
