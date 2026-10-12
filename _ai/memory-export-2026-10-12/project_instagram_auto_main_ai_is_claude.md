---
name: project-instagram-auto-main-ai-is-claude
description: "instagram-auto 프로젝트의 Main AI는 Claude Code다 — CLAUDE.md에 남은 'Main AI는 Codex' 문구는 오래된 설정이며 더 이상 유효하지 않다"
metadata: 
  node_type: memory
  type: project
  originSessionId: 209772ed-9454-43be-8a7d-a56438263799
  modified: 2026-09-26T05:21:12.810Z
---

**Owner 확정(2026-09-17)**: instagram-auto 프로젝트의 Main AI는 Claude Code다. "Codex는 일을 못해서 이제 사용 안 해"(Owner 발언 원문) — Codex 교차검수도 더 이상 필요 없다.

**Why:** 프로젝트 루트 `CLAUDE.md`에는 여전히 "이 프로젝트의 Main AI는 Codex이며, Claude Code는 Owner가 승인한 제한된 보조 작업만 수행한다"는 오래된 문구가 남아 있다. 이는 실제 운영 방침과 어긋난 상태다. 이 세션에서 부엉이 쇼츠(경제번역소) 3편 제작 중 도메인 확장(FRED 커넥터 구현 등) 작업의 승인 주체를 확인하는 과정에서 Owner가 명시적으로 정정했다.

**2026-09-26 갱신**: Owner의 정리 지시에 따라 루트 `AGENTS.md`(폐기된 Shorts Editorial OS V2 규칙 "Claude Code는 항상 read-only" 포함)와 `CLAUDE.md`를 "Main AI = Claude Code"로 고쳤다. 이제 파일과 이 메모리가 일치한다. 전역 `~/.claude/AGENTS.md` §2의 "instagram-auto: Codex Main" 기본 배정은 프로젝트 로컬 기록이 우선하므로 적용되지 않는다(전역 파일은 Owner 소관이라 수정하지 않음).

**How to apply:** instagram-auto에서 앞으로는 "Codex 교차검수 필요" 판단을 하지 않는다. 새 기능군/도메인 확장처럼 기존에 Owner 승인이 필요하다고 판단했던 작업도, Main AI 권한 확인 목적이 아니라 실제 위험도(secret/DB/deploy/외부 API 새 연동 등)만 놓고 판단한다. CLAUDE.md 파일 자체의 문구 정정은 Owner 소관이라 이 메모리가 대신하되, 만약 다음 세션에서 CLAUDE.md가 여전히 "Main AI는 Codex"로 되어 있다면 이 메모리를 우선한다(단, 파일과 실제 지시가 다시 충돌하면 그 시점에 Owner에게 한 번 더 확인).

[[feedback_codex_handoff_format]]과는 별개 — Codex 인수인계 형식 규칙 자체는 다른 프로젝트(Money Shorts OS 등)에서는 여전히 유효할 수 있으니 무조건 폐기하지 않는다. 이 메모리는 instagram-auto 프로젝트 범위에 한정된다.
