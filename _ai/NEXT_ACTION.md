# Next Action

## 2026-06-25 현재 — Auto Fact Card Candidate v1 Review-Fix 완료, checkpoint 대기

상태: **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**

Owner 결정:

- 프로젝트 본체는 돈관리 쇼츠 생성기가 아니다.
- 본체는 **출처 기반 금융·경제 쇼츠 제작 OS**다.
- Money-OS는 메인 콘텐츠 주제가 아니라 보조 CTA/전환 레이어다.
- 콘텐츠 비중은 출처 기반 금융·경제 쇼츠 70%, Money-OS 연결형 돈관리 쇼츠 30%.
- 각 쇼츠는 반드시 Fact Card를 먼저 만든 뒤 Video Blueprint와 대본으로 넘어간다.
- AI는 Fact Card에 없는 숫자나 사실을 상상해서 대본을 쓰면 안 된다.

최신 checkpoint:

- `9978d61 test(money-shorts): record mvp1 rc smoke pass` ← **현재 HEAD**
- (이전: `de96040 fix(ui): clear package preview key warnings`)
- (이전: `c66073f test(money-shorts): record mvp1 route smoke pass`)
- branch: `codex/source-first-blueprint-clean`
- push: 미실행

최근 완료:

- `money-shorts-os-react-key-warning-isolation-v1` + review-fix + type-cleanup: React key warning 0회 달성
  - root cause: `primaryScript.scenes.map()` `key={sc.sceneId}` — `sceneId` 필드 없음 → `key={undefined}`
  - fix: `key={String(sc.sceneIndex)}`, `sc.durationSec`, `scene.sceneRole`
- `money-shorts-os-mvp1-rc-smoke-and-state-sync-v1`: 5개 route RC smoke PASS
  - `/money-shorts`, `/fact-cards/manual`, `/fact-cards/manual/new`, `/fact-cards/manual/package-preview`, `/packages` — key warning 0회, 링크/텍스트 확인
- `money-shorts-os-auto-fact-card-candidate-v1` + review-fix:
  - mock ECOS `RawDataSnapshot -> RawSnapshotParser -> ManualFactCardDraft -> authorManualFactCard()` 경로 구현
  - `/fact-cards/manual/package-preview?candidate=base-rate` generated candidate preview 추가
  - `ManualFactCardDraft` import blocker 수정, `"3.0%"` display string 보존, unknown candidate fallback 방지

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

먼저:

- `auto-fact-card-candidate-v1` 누적 diff를 Codex review 후 safe local checkpoint commit.

그 다음:

- ECOS live connector 준비/구현을 첫 실제 API 연결 후보로 진행한다.
- 단, live API 호출, 네트워크 사용, env/API key 변경은 Owner 명시 승인 후 진행한다.
- 아직 GPT, 영상, ElevenLabs, ffmpeg/render로 가지 않는다.

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
