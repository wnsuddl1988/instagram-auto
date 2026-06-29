# PROJECT_STATE — AutoShorts / Money Shorts OS

**갱신:** 2026-06-29

**전체프로젝트 진행률:** 약 85% — source/fact-card foundation부터 package assembly, review/gate/clipboard payload, MVP1 local UI routes, ECOS live/latest draft candidate path, package-preview live latest candidate UI, chart card props/visual preview, owner-decision publishability gate, local publishability controls, local approval ledger, ledger-approved overlay, overlay evaluator extraction, static guard scripts, Owner review guidance panel, v1.1 final direction docs alignment, Voice/Narration Style patch, Signal Translation Brief + fixed 6 Scene Card 타입/fixture/export, Scene Card validation review-fix, deterministic brief/scene card generator, 환율/금리 two-signal fixture validation, package-preview Signal Translation / 6 Scene Cards display-only inspection panel, Caption / Scene QA Coverage panel (structural inspection), Generated Copy Payload Preview (display-only, deterministic helper, no clipboard), inflation_life_economy_v1 template + 물가 fixture (3번째 generator coverage 검증), package-preview에 환율/금리/물가 세 generated package 나란히 표시 (display-only inspection), Signal Translation display-only integration static guard script (35/35 PASS, checkpoint 1a268ba 완료), Scene Package QA helper (deterministic report layer, owner/QA warnings, 13-keyword risk scan, checkpoint 92fdef3 완료), ScenePackageQaReportPanel (display-only QA report panel, buildMoneyShortsScenePackageQaReport 인라인 호출, static guard 48/48, checkpoint eac702c 완료), **Generated Copy Payload에 scenePackageQaReport 필드 추가 (additive, schema version 유지, GeneratedCopyPayloadPreview QA 메타 표시 추가, static guard 50/50, 미commit)**까지 진행됐다. 실제 영상 제작/render/upload/DB/persistence는 아직 금지다.

> **현재 품질 게이트:** `MONEY_SHORTS_OS_FINAL_DIRECTION_ALIGNED`. 이전 영상 제작 방식은 active direction이 아니다. 새 작업은 source-first / Fact Card first 원칙을 유지하면서 Signal Translation Brief와 Scene Card 기반 multimodal consistency layer를 추가하는 방향으로 진행한다.

---

## 현재 제품 방향

개발명:

- **Money Shorts OS**

브랜드/톤:

- 브랜드 방향: **경제번역소**
- 콘텐츠 톤: **생활경제탐정**
- 생활경제탐정은 실제 캐릭터가 아니라 경제 신호의 단서를 찾아 생활 영향으로 번역하는 해석 방식과 연출 문법이다.

제품 정의:

- Money Shorts OS는 단순 경제지표 설명기가 아니다.
- 경제 신호를 출처 기반으로 가져와, 사람들이 궁금해할 만한 후킹으로 열고, 현재 상황과 주요 원인 후보를 팩트 기반으로 설명한다.
- 전문가적 시선으로 지금 무엇을 봐야 하는지 해석한 뒤, 그 신호가 생활비·대출·소비·저축·투자 판단·환전·카드값·여행비·장바구니·고정비/변동비에 어떤 영향을 줄 수 있는지 연결한다.
- 마지막에는 개인이 지금 할 수 있는 점검 행동을 제시한다.
- Money-OS는 메인 콘텐츠 주제가 아니라 필요한 경우에만 붙는 CTA/전환 레이어와 생활 돈관리 행동 연결 장치다.

확정 파이프라인:

`Fact Card`
→ `Signal Translation Brief`
→ `6 Scene Cards`
→ `script / caption / image prompt / voice / screen text`
→ `risk review / final QA / owner gate`

Layer responsibility:

- **Fact Card**: 사실, 수치, 출처, 기간, citation, `allowedClaims`, `blockedClaims`의 근거. 생활 해석과 표현을 과도하게 넣지 않는다.
- **Signal Translation Brief**: 경제 신호를 생활 돈관리 문제로 번역한다. `keyReasons`, `expertInterpretation`, `affectedMoneyAreas`, `lifeImpact`, `volatilityWatch`, `scenarioBasedOutlook`, `recommendedActions`, `actionBoundaries`, `viewerTakeaway`를 담당한다.
- **Scene Card**: 각 장면의 단일 명세서. narration, captionBlocks, image prompt, screen text, voiceTiming, sourceCitationIds, imageTextPolicy, layoutSafeZone, risk notes를 함께 담는다.

확정 6장면:

1. Hook
2. Signal
3. Why + Expert Interpretation
4. Life Impact
5. Watch / Scenario Outlook
6. Action + Closing Line

Caption System V1:

- 1080x1920 vertical.
- Hook Title: `x 90~990`, `y 300~620`, 2줄 이하, `74~88px`.
- Scene Label: `x 80~420`, `y 180~250`, `30~38px`.
- Spoken Caption: `x 90~880`, `y 1180~1480`, `52~64px`, 1~2줄.
- Source Note: `x 90~760`, `y 1500~1560`, `24~30px`.
- Avoid: `y 0~150`, `y 1600~1920`, `x 900~1080`.
- Font: Pretendard 또는 Noto Sans KR.
- Accent: amber/warm yellow 1개 중심.

Image Style V1:

- 에디토리얼 생활경제 리포트 스타일.
- 생활 오브젝트 + 경제 신호 카드 + 탐정식 단서 연출.
- 실제 탐정 캐릭터가 아니라 단서 카드, 연결선, 체크 표시, 신호 카드, 생활 오브젝트 배치로 해석 느낌을 준다.
- 색감: off-white, light gray, charcoal navy, dark navy/charcoal, amber/warm yellow.
- 금지: 매번 다른 화풍, 과한 프리미엄 금융 광고풍, 과한 골드, 공포 분위기, 투자 수익 암시, 대본과 무관한 추상 그래프 배경, 이미지 안 검증되지 않은 숫자/문구 삽입.

상세 기준:

- `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`
- `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_PRD_V1.md`
- `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`
- `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`
- `_ai/PRODUCTION_PIPELINE_RESET_V1.md`

---

## 최근 checkpoint

- Uncommitted: `money-shorts-os-generated-copy-payload-qa-report-v1` (copy payload + preview + static guard) ← **현재 작업**
- Commit: `eac702c` — `feat(package-preview): add scene package QA report panel` ← **마지막 checkpoint**
- Commit: `92fdef3` — `feat(source-facts): add scene package QA helper`
- Commit: `1a268ba` — `test(package-preview): add signal translation display-only static guard`
- Commit: `f288969` — `feat(package-preview): add inflation package to signal translation panel`
- Commit: `012a25c` — `feat(source-facts): add inflation life economy scene fixture`
- Commit: `af84985` — `feat(package-preview): add generated copy payload preview`
- Commit: `19ec7d6` — `feat(package-preview): add caption scene QA coverage`
- Commit: `c34ef6f` — `feat(package-preview): add signal translation preview panel`
- Branch: `codex/source-first-blueprint-clean` (ahead 68)
- Push: 미실행
- Known local extra: `piq_diag_out.txt` untracked, 작업 무관, 제외 유지

---

## 최근 완료

Code/UI:

- source-first Fact Card 기반 package assembly chain.
- package preview route and package library route.
- ECOS live/latest draft candidate path with BOK source-date resolver.
- publishability decision contract, local sandbox controls, local approval ledger.
- ledger-approved overlay with current Fact Card 4-guard revalidation.
- ledger overlay evaluator extraction and static guard scripts.
- Owner review guidance panel.

Docs/current alignment:

- `Money Shorts OS Final Direction & Multimodal Consistency Proposal v1.1` 최종 승인.
- `Money Shorts OS Direction Alignment Docs v1` 문서-only 반영 중.
- `Money Shorts OS Voice / Narration Style Patch v1` 반영.
- source-first / Fact Card first 원칙은 유지.
- Signal Translation Brief와 Scene Card 기반 multimodal consistency layer를 추가하는 방향으로 정렬.

Code/current slice:

- `money-shorts-os-signal-translation-scene-card-types-v1` 완료 및 checkpoint `f05625f`에 포함.
- `money-shorts-os-scene-card-validation-review-fix-v1` 완료 및 checkpoint `f05625f`에 포함.
- `money-shorts-os-brief-scene-card-generator-v1` 완료 및 checkpoint `f05625f`에 포함.
- `money-shorts-os-brief-scene-card-generator-second-fixture-v1` 완료 및 checkpoint `f05625f`에 포함.
- 신규 타입 모듈: `lib/source-facts/signal-translation.ts`.
- 신규 generator 모듈: `lib/source-facts/signal-translation-generator.ts`.
- 신규 fixture 모듈: `lib/source-facts/signal-translation-fixtures.ts`.
- `lib/source-facts/fixtures.ts`에 mock ECOS provider와 mock 기준금리 Fact Card 추가.
- export 연결: `lib/source-facts/index.ts`.
- `validateFixedSixSceneCards()`는 sequence/count 전용으로 유지.
- `validateSceneCardsForGeneration()`으로 필수 문자열과 absolute-timeline captionBlocks timing을 검증.
- `validateSignalTranslationCitationIds()`으로 brief/scene citation id subset을 검증.
- `createMoneyShortsScenePackageFromFactCard()`로 deterministic `{ brief, sceneCards, sceneCardValidation, citationValidation }` 패키지를 생성.
- 환율 계열은 `exchange_rate_life_economy_v1`, 금리 계열은 `interest_rate_life_economy_v1`, 그 외는 `generic_indicator_life_economy_v1` fallback.
- 환율/금리 generated package 모두 scene/citation validation 통과.
- 기존 `FactCard` 타입과 기존 Fact Card fixture 값은 변경하지 않음.

Current UI slice:

- `money-shorts-os-package-preview-signal-translation-panel-v1` 진행.
- `app/fact-cards/manual/package-preview/SignalTranslationPreviewPanel.tsx` 신규.
- package-preview에 환율/금리 generated package의 Signal Translation Brief와 fixed 6 Scene Cards를 display-only로 표시.
- validation summary, viewer takeaway, recommended actions, action boundaries, captionBlocks, voiceTiming, layoutSafeZone, imagePrompt spec를 Owner inspection용으로 노출.
- 기존 gate/ledger/clipboard/publishability/render 흐름은 변경하지 않음.

---

## Legacy / Reference Only

아래는 삭제하지 않고 역사/참고로 보존한다. Active MVP path로 사용하지 않는다.

- `docs/PLAN.md`
- `docs/LOG.md`
- 3D sitcom 관련 문서
- living tips 관련 문서
- old render/upload/generate API surface
- `/review` 중심 old QA flow
- Candidate10 / static slideshow / Jun / upload_002 / ep003 / old Money Architect route

---

## 다음 단계

권장 다음 task:

1. **checkpoint commit** (권장)
   - `safe checkpoint commit authorized` 포함 Codex handoff 필요.
   - 포함: `_ai` 3개 + `lib/source-facts/signal-translation-copy-payload.ts` + `app/fact-cards/manual/package-preview/SignalTranslationPreviewPanel.tsx` + `scripts/check-signal-translation-preview-static.mjs`.

2. **route smoke verification** (선택사항)
   - Owner가 `.money-shorts-local/` 접근을 명시적으로 허용할 때만 진행.

세션 건강 메모:

- Signal Translation preview/QA foundation이 여러 checkpoint로 완료됐고, 다음 독립 task 전 Claude Code `/clear` 또는 새 실행 세션 선택 가능.
- 단, `_ai` 문서가 최신화되었으므로 현재 세션에서 이어도 문제없음.
- HEAD는 `eac702c`, ahead 68, clean working tree (untracked `piq_diag_out.txt` 제외).

금지:

- 이전 영상 후보 추가 개선
- 이전 산출물 기반 prompt 재사용
- Jun/준/시트콤/복사기/upload_002/ep003/3d_sitcom reference를 active path로 사용
- 생활꿀팁/EP001/old Money Architect 기존 주제 재개
- upload/post/push/deploy/env/DB/dependency 변경
- API route 변경
- OS clipboard write
- ffmpeg/render/output 변경
- `piq_diag_out.txt` 접근
- `.money-shorts-local/` 접근
