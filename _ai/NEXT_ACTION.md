# Next Action

## 2026-06-25 현재 — MVP1 RC Smoke PASS, React Key Warning 0회 완료

상태: **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**

Owner 결정:

- 프로젝트 본체는 돈관리 쇼츠 생성기가 아니다.
- 본체는 **출처 기반 금융·경제 쇼츠 제작 OS**다.
- Money-OS는 메인 콘텐츠 주제가 아니라 보조 CTA/전환 레이어다.
- 콘텐츠 비중은 출처 기반 금융·경제 쇼츠 70%, Money-OS 연결형 돈관리 쇼츠 30%.
- 각 쇼츠는 반드시 Fact Card를 먼저 만든 뒤 Video Blueprint와 대본으로 넘어간다.
- AI는 Fact Card에 없는 숫자나 사실을 상상해서 대본을 쓰면 안 된다.

최신 checkpoint:

- `de96040 fix(ui): clear package preview key warnings` ← **현재 HEAD**
- (이전: `c66073f test(money-shorts): record mvp1 route smoke pass`)
- (이전: `70eeecb feat(money-shorts): link screens to workflow hub`)
- branch: `codex/source-first-blueprint-clean`
- push: 미실행

최근 완료:

- `money-shorts-os-react-key-warning-isolation-v1` + review-fix + type-cleanup: React key warning 0회 달성
  - root cause: `primaryScript.scenes.map()` `key={sc.sceneId}` — `sceneId` 필드 없음 → `key={undefined}`
  - fix: `key={String(sc.sceneIndex)}`, `sc.durationSec`, `scene.sceneRole`
- `money-shorts-os-mvp1-rc-smoke-and-state-sync-v1`: 5개 route RC smoke PASS
  - `/money-shorts`, `/fact-cards/manual`, `/fact-cards/manual/new`, `/fact-cards/manual/package-preview`, `/packages` — key warning 0회, 링크/텍스트 확인

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

MVP1 RC smoke PASS. React key warning 0회. 다음 슬라이스는 Owner가 결정한다.

후보:

- **A. MVP1 실사용 검증**: Owner가 실제 Fact Card 수치를 `/fact-cards/manual/new`에 입력하고 `/fact-cards/manual/package-preview`에서 전체 pipeline 결과를 수동 확인
- **B. 추가 fixture / 실데이터 연동**: ECOS/KOSIS 실데이터를 `lib/source-facts/`에 연동하는 Fact Card 슬라이스
- **C. origin push**: Owner 명시 승인 시 `codex/source-first-blueprint-clean` → origin push

금지 (계속 유지):

- OS clipboard write
- API route 호출 또는 변경
- DB/Supabase read/write/migration
- ffmpeg/render/output 생성
- OpenAI/GPT/Gemini/Veo/ElevenLabs live call
- ECOS/KOSIS/OpenDART/FRED live API 호출
- API key/env/secret 변경
- dependency/lockfile 변경
- `output/` 변경
- payment/deploy/upload/post/push (Owner 명시 승인 없이)
- 이전 영상 후보 개선
