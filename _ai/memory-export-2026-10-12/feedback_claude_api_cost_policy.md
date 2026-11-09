---
name: feedback-claude-api-cost-policy
description: Claude API 모델 선택 및 비용 상한 승인 규칙 — Opus 사용 전 반드시 사용자 승인 필요
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 43a1625c-7234-4408-bbfb-75cfc0e275d3
---

Opus 계열(claude-opus-4-8 등)은 사용자 명시 승인 없이 사용 금지. 기본 대본 모델은 Haiku 또는 Sonnet.

**Why:** v3 대본 생성 시 Opus 4.8 사용 → 승인 상한 $0.01~0.03 대비 $0.1346 발생 (약 4배 초과). 사전 보고 없이 사용.

**How to apply:** Claude API 호출 스크립트 작성 전 모델명·예상 비용·호출 횟수를 먼저 보고하고 사용자 승인 후 진행. 승인된 비용 상한 초과 예상 시 호출 중단 후 보고.
