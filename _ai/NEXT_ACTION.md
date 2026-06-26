# Next Action

## 2026-06-26 현재 — acceptance smoke + unchanged copy quality fix 완료, checkpoint 대기

상태: **MONEY_SHORTS_OS_SOURCE_FIRST_CORE_LOCKED**

Owner 결정:

- 프로젝트 본체는 **출처 기반 금융·경제 쇼츠 제작 OS**다.
- Money-OS는 메인 콘텐츠 주제가 아니라 보조 CTA/전환 레이어다.
- 각 쇼츠는 반드시 Fact Card를 먼저 만든 뒤 Video Blueprint와 대본으로 넘어간다.
- AI는 Fact Card에 없는 숫자나 사실을 상상해서 대본을 쓰면 안 된다.

최신 committed checkpoint:

- `f5db4c5 fix(package-preview): keep live draft gate pending` ← **현재 HEAD**
- branch: `codex/source-first-blueprint-clean`
- push: 미실행
- known local extra: `piq_diag_out.txt` untracked, 작업 무관, 제외 유지

최근 완료 (uncommitted):

- `live-latest-draft-owner-acceptance-smoke-v1`: acceptance smoke PASS (코드 변경 없음, docs only)

최근 완료:

- `money-shorts-os-auto-fact-card-candidate-v1`: checkpoint `d85b616`
  - mock ECOS `RawDataSnapshot -> RawSnapshotParser -> ManualFactCardDraft -> authorManualFactCard()` 경로
  - `/fact-cards/manual/package-preview?candidate=base-rate` preview
- `money-shorts-os-ecos-connector-scaffold-v1`: checkpoint `20ab76b`
  - ECOS request spec, mock transport, normalizer, scaffold candidate
- `money-shorts-os-ecos-live-connector-v1`: checkpoint `87caec6`
  - async live transport boundary, secret-safe ECOS live transport, read-only live check script
- `money-shorts-os-ecos-live-truth-alignment-v1`: checkpoint `43fe473`
  - Jan2025/Dec2024 historical smoke fixture aligned to ECOS live truth (`3.0% -> 3.0%`)
  - Jan2025 marked historical smoke fixture, not production default
- `money-shorts-os-ecos-latest-period-resolver-v1`: checkpoint `63d9b10`
  - latest-period window resolver without `Date.now()`
  - live latest found `202605` / previous `202604`, both `2.5연%`
  - blocked without verified source date; no Jan2025 fallback
- `money-shorts-os-ecos-source-date-resolver-v1`: checkpoint `4bc9f0a`
  - BOK official base-rate decision history resolver
  - latest ECOS value `2.5%` matched official latest BOK decision `2025-05-29 2.50%`
  - verifiedPublishedDate `2025-05-29`
  - source date is official BOK decision date, not derived from ECOS period `202605`
- `money-shorts-os-ecos-latest-live-draft-candidate-v1` + review-fix: checkpoint `525e635`
  - latest ECOS rows -> latest period -> BOK source-date -> normalized snapshot -> Fact Card draft candidate
  - `sourceProviderId=provider-ecos-live`, `isMock=false`, `isPublishable=false`
  - BOK source-date provenance를 rawPayload와 citation에 보존
  - candidate validation 실패 시 `draft_ready` 금지 (`blocked_candidate_validation_failed`)

## 최근 완료 (2026-06-26 추가)

`money-shorts-os-package-preview-live-latest-candidate-v1` + review-fix: checkpoint `b11ebb0`

- `/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606` live route 연결
- default/mock route ECOS 호출 없이 기존 동작 유지
- live provenance card 표시: `provider-ecos-live`, `isMock=false`, `isPublishable=false`, `publishedDate=2025-05-29`, `dataPeriod=2026년 5월`
- BOK source-date citation 노출 (`bok.or.kr/portal/singl/baseRate`)
- review-fix: `dataPeriod` `factCard.dataPeriod` 사용으로 보정, `async` 제거

## 최근 완료 (2026-06-26 추가 — dev-server-default-route-alignment-v1)

`dev-server-default-route-alignment-v1`: checkpoint `7d28921`

- `app/page.tsx`: old AutoShorts AI "use client" UI → server `redirect("/money-shorts")` 교체
- `app/layout.tsx`: metadata title/description → Money Shorts OS 기준으로 변경
- `app/money-shorts/page.tsx`: 헤더 subline "외부 API 없음" → "외부 API 없음 (live 경로 제외)" 최소 보정

## 최근 완료 (2026-06-26 추가 — money-shorts-hub-live-latest-entrypoint-v1)

`money-shorts-hub-live-latest-entrypoint-v1`: uncommitted (Codex checkpoint 승인 대기)

- `app/money-shorts/page.tsx`: Live Latest Draft Candidate 섹션 추가 (prefetch={false} link, draft-only 안내)
- live link href: `/fact-cards/manual/package-preview?candidate=ecos-live-latest&endPeriod=202606`

## 최근 완료 (2026-06-26 추가 — ecos-base-rate-unchanged-copy-quality-v1)

`ecos-base-rate-unchanged-copy-quality-v1`: uncommitted (Codex checkpoint 승인 대기)

- `lib/source-facts/candidates.ts`: `ecosBaseRateParser` + `ecosBaseRateLiveParser` 모두 `chg === 0` 분기 추가
- `changeValue === 0`일 때 interpretation: "...동결했다. 직전 발표 대비 변동은 ..." 사용
- `changeValue !== 0`일 때: 기존 "조정했다" 문구 유지
- TS/ESLint 통과

## 다음 safe work unit

Codex 지시 대기. 현재 활성 task 없음.

아직 하지 않을 것:

- GPT/script/video/render/package 생성
- publishable=true 전환

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
- 이전 영상 후보 개선
