---
name: feedback-no-computer-use
description: 이 프로젝트에서 computer-use MCP를 사용하지 않는다 — CDP + Playwright로 모든 브라우저 작업을 처리한다
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 88ba5aa3-6ccd-4291-93ba-9ce45ce25e7c
---

이 프로젝트에서는 computer-use(스크린샷 클릭/타이핑) MCP를 절대 사용하지 않는다.
화면을 건드리지 않고 Playwright CDP(`chromium.connectOverCDP`)로 모든 브라우저 작업을 처리한다.

**Why:** 사용자가 명시적으로 금지. 이전에도 computer-use 없이 CDP만으로 ChatGPT 이미지 생성·회수를 모두 처리했다.

**How to apply:**
- ChatGPT 이미지 생성/회수 → `scripts/_upload002-*.mjs` 패턴 (CDP + Playwright)
- 이미지 직접 fetch 403 시 → `page.route` intercept + `page.reload()` 방식으로 낚아채기
- computer-use 도구(`mcp__computer-use__*`) 호출 금지. 화면 보기도 금지.
