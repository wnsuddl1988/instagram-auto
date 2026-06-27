# Next Action

## 2026-06-27 현재 — brief scene card generator second fixture v1

상태: **MONEY_SHORTS_OS_TWO_SIGNAL_GENERATOR_READY**

현재 작업:

- `Money Shorts OS Direction Alignment Docs v1`
- 문서-only alignment slice.
- 코드, 타입, 라우트, UI, API, dependency, env, DB, render/output 변경 없음.

Owner 최종 승인 방향:

- Money Shorts OS는 단순 경제지표 설명기가 아니다.
- 경제 신호를 출처 기반으로 가져와, 후킹으로 열고, 현재 상황과 주요 원인 후보를 팩트 기반으로 설명하고, 전문가적 시선으로 지금 무엇을 봐야 하는지 해석한다.
- 그 신호가 생활비·대출·소비·저축·투자 판단·환전·카드값·여행비·장바구니·고정비/변동비에 어떤 영향을 줄 수 있는지 연결한다.
- 마지막에는 개인이 지금 할 수 있는 점검 행동을 제시한다.
- 브랜드 방향: **경제번역소**.
- 콘텐츠 톤: **생활경제탐정**. 실제 캐릭터가 아니라 경제 신호의 단서를 찾아 생활 영향으로 번역하는 해석 방식과 연출 문법이다.

확정 파이프라인:

`Fact Card`
→ `Signal Translation Brief`
→ `6 Scene Cards`
→ `script / caption / image prompt / voice / screen text`
→ `risk review / final QA / owner gate`

Layer responsibility:

- Fact Card: 사실, 수치, 출처, 기간, citation, `allowedClaims`, `blockedClaims`의 근거. 생활 해석/표현을 과도하게 넣지 않는다.
- Signal Translation Brief: `keyReasons`, `expertInterpretation`, `affectedMoneyAreas`, `lifeImpact`, `volatilityWatch`, `scenarioBasedOutlook`, `recommendedActions`, `actionBoundaries`, `viewerTakeaway`.
- Scene Card: narration, captionBlocks, image prompt, screen text, voiceTiming, sourceCitationIds, imageTextPolicy, layoutSafeZone, risk notes의 단일 장면 명세서.

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

최신 HEAD:

- `24ef219 feat(package-preview): add owner review guidance panel` ← 현재 HEAD
- latest QA/test checkpoint: `bd4e745 test(package-preview): guard ledger overlay page integration`
- branch: `codex/source-first-blueprint-clean` (ahead 59)
- push: 미실행
- known local extra: `piq_diag_out.txt` untracked, 작업 무관, 제외 유지

최근 완료 (committed):

- `24ef219`: Owner review guidance panel
- `bd4e745`: ledger overlay page integration static guard
- `c29f4d9`: ledger overlay static guard
- `71f3a9b`: ledger overlay evaluator extraction
- `6d5425d`: riskReview.packageId TS fix
- `abe3d36`: ledger-approved overlay with current Fact Card revalidation
- `91f08a1`: owner publishability local approval ledger

현재 uncommitted 문서 작업:

- v1.1 최종 방향을 `_ai` source-of-truth 문서에 반영.
- `Money Shorts OS Voice / Narration Style Patch v1` 반영.
- ElevenLabs 후보는 `Hojin Lim`, `Yohan Koo`, `Gihong`으로 문서화하되 아직 최종 확정하지 않음.
- voice 후보 비교는 구현 전 별도 non-code validation task로 둠.
- legacy/reference-only 문서 표시.

현재 uncommitted code slice:

- `money-shorts-os-signal-translation-scene-card-types-v1`
- `lib/source-facts/signal-translation.ts` 신규: Signal Translation Brief, fixed 6 Scene Card, Caption System V1, voice timing, image text policy, layout safe zone 타입과 sequence validation helper.
- `lib/source-facts/signal-translation-fixtures.ts` 신규: 기존 `exchangeRateFactCard`를 참조하는 mock Signal Translation Brief + 6 Scene Cards 예시.
- `lib/source-facts/index.ts` export 추가.
- 기존 Fact Card 타입과 기존 fixture 값은 변경하지 않음.

현재 review-fix:

- `money-shorts-os-scene-card-validation-review-fix-v1`
- 기존 `validateFixedSixSceneCards()`는 sequence/count 전용으로 유지.
- 신규 `validateSceneCardsForGeneration()` helper로 필수 문자열 non-empty, duration, captionBlocks absolute timeline 범위를 검증.
- 신규 `validateSignalTranslationCitationIds()` helper로 brief/scene `sourceCitationIds`가 Fact Card citation id 목록 안에 있는지 확인.
- exchange-rate fixture에 generation validation과 citation subset validation 결과 export 추가.

현재 generator slice:

- `money-shorts-os-brief-scene-card-generator-v1`
- 신규 `lib/source-facts/signal-translation-generator.ts`
- `createSignalTranslationBriefFromFactCard()`로 Fact Card에서 deterministic Signal Translation Brief 생성.
- `createFixedSixSceneCardsFromSignalTranslationBrief()`로 fixed 6 Scene Cards 생성.
- `createMoneyShortsScenePackageFromFactCard()`로 `{ brief, sceneCards, sceneCardValidation, citationValidation }` 패키지 생성.
- 환율 계열은 `exchange_rate_life_economy_v1`, 그 외는 `generic_indicator_life_economy_v1` fallback.
- 기존 Fact Card 타입/fixture는 변경하지 않음.

현재 second fixture slice:

- `money-shorts-os-brief-scene-card-generator-second-fixture-v1`
- `lib/source-facts/fixtures.ts`에 mock ECOS provider와 mock 기준금리 Fact Card 추가.
- `resolveSignalTranslationTemplateId()`가 금리/기준금리/대출금리/interest/base rate/policy rate/loan rate 계열을 `interest_rate_life_economy_v1`로 감지.
- 금리 template은 대출 이자 부담, 예금/저축 판단, 소비 여력, 고정비/변동비, 현금흐름 점검을 중심으로 Signal Translation Brief와 fixed 6 Scene Cards를 생성.
- `interestRateGeneratedSignalTranslationPackage` fixture 추가.
- 환율/금리 generated package 모두 scene/citation validation 통과.

## 다음 safe work unit

권장 다음 task:

`money-shorts-os-package-preview-signal-translation-panel-v1`

목표:

- package-preview에서 Signal Translation Brief와 generated 6 Scene Cards를 display-only로 확인할 수 있는 작은 패널을 추가한다.
- 기존 preview gate/ledger/clipboard 동작은 바꾸지 않는다.
- DB/persistence/live API/render/upload는 계속 금지한다.

대안 safe task:

`money-shorts-os-source-facts-generator-checkpoint-v1`

- 현재 누적 diff가 direction docs + voice patch + source-facts type/validation/generator/second fixture까지 커졌으므로, Codex 검토 후 safe local checkpoint commit을 만들 수 있다.
- push는 별도 Owner 승인 전까지 금지.

Voice validation note:

- 실제 ElevenLabs 호출은 이 다음 구현 task의 일부가 아니다.
- 필요 시 별도 Owner 승인 하에 `money-shorts-os-voice-candidate-listening-test-v1` 같은 non-code validation slice로 진행한다.

아직 하지 않을 것:

- 실제 GPT/script/video/render/package 생성
- publishable=true persistence
- DB/Supabase migration
- env/secret/dependency 변경
- render/output/ffmpeg/upload/deploy/push

금지 (계속 유지):

- OS clipboard write
- DB/Supabase read/write/migration
- ffmpeg/render/output 생성
- OpenAI/GPT/Gemini/Veo/ElevenLabs live call
- KOSIS/OpenDART/FRED live API 호출
- API key/env/secret 변경
- dependency/lockfile 변경
- `output/` 변경
- payment/deploy/upload/post/push (Owner 명시 승인 없이)
- `piq_diag_out.txt` 접근
- `.money-shorts-local/` 접근
- 이전 영상 후보 개선
