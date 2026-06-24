# CLAUDE_REPORT — Source-First Money Shorts OS

**갱신:** 2026-06-25

## Current Direction

Owner가 제품 중심축을 정정했다.

- Money Shorts OS의 본체는 **출처 기반 금융·경제 쇼츠 제작 OS**다.
- Money-OS는 메인 콘텐츠가 아니라 필요한 경우 붙는 CTA/전환 레이어다.
- 콘텐츠 비중은 출처 기반 금융·경제 쇼츠 70%, Money-OS 연결형 돈관리 쇼츠 30%다.
- 각 쇼츠는 반드시 Fact Card를 먼저 만든 뒤 Video Blueprint와 대본으로 넘어간다.
- AI는 Fact Card에 없는 숫자나 사실을 상상해서 대본을 쓰면 안 된다.

## Latest Local Evidence

- Clean working branch: `codex/source-first-blueprint-clean`
- Source Fact Card foundation copied onto clean `origin/main` base.
- Previous Candidate10 / static plate / 3D character / code-GFX route commits are not part of this branch.

Implemented source foundation:

- `lib/source-facts/types.ts`
- `lib/source-facts/fixtures.ts`
- `lib/source-facts/validation.ts`
- `lib/source-facts/index.ts`

Validation evidence from prior local checkpoint:

- Source module TypeScript strict check: PASS
- Source module ESLint: PASS
- Runtime validation sample: PASS

## Active Next Task

Task ID:

- `money-shorts-os-fact-card-to-blueprint-v1`

Goal:

- Add local Video Blueprint types and deterministic Fact Card -> Video Blueprint helper.
- No external API, AI generation, TTS, video render, ffmpeg, DB, payment, upload, deploy, or push.

## Active Source Of Truth

- `_ai/HANDOFF_NOW.md`
- `_ai/NEXT_ACTION.md`
- `_ai/PROJECT_STATE.md`
- `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`
- `_ai/MONEY_SHORTS_OS_PRD_V1.md`
- `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`
- `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`
- `_ai/PRODUCTION_PIPELINE_RESET_V1.md`

## Retired Active Routes

Do not resume:

- Candidate10 / old Money Architect video improvement
- Static 8-plate image + caption + narration assembly route
- code-GFX final/public candidate loops
- GPT visual plate-only route
- 3D character static plate route
- 생활꿀팁 / EP001 돈 방어 / old Money Architect topic flow
- Jun/준/시트콤/자동문 면접/ep003/upload_002/복사기/3d_sitcom assets or references
