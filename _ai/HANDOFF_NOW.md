# HANDOFF_NOW

## Task ID

Latest completed: `money-shorts-os-provider-candidate-to-scene-package-foundation-v1-review-fix-preview-wire`

## Project

`C:\Users\PC\jjy\instagram-auto`

## Current Checkpoint

- Branch: `codex/source-first-blueprint-clean`
- Latest HEAD: `9338645 fix(package-preview): add imagePolicy to qa panel spec note` ← **현재 HEAD**
- Current local status: ahead 77, 5 files modified (미커밋: lib/source-facts/provider-candidates.ts 신규 + lib/source-facts/index.ts 수정 + scripts/check-provider-candidate-scene-package-static.mjs 신규 + app/fact-cards/manual/package-preview/page.tsx 수정 + scripts/check-signal-translation-preview-static.mjs 수정), `?? piq_diag_out.txt`
- Push: 미실행
- Known unrelated untracked file: `piq_diag_out.txt` -- do not read, modify, delete, stage, or commit.
- Local approval data under `.money-shorts-local/` is gitignored local data and must not be read, modified, staged, or committed.

## Latest Completed Work

`money-shorts-os-provider-candidate-to-scene-package-foundation-v1-review-fix-preview-wire` — 미커밋, 검증 완료.

목표 달성: mock 경제 신호 후보 1개(ecosBaseRateTopicCandidate)가 FactCard → ScenePackage로 변환되어 기존 `SignalTranslationPreviewPanel` packages 배열의 4번째 샘플로 연결됨. 코드/fixture/static guard로 증명.

```
ecosBaseRateTopicCandidate → FactCard → ScenePackage → SignalTranslationPreviewPanel packages[3]
```

포함된 변경:
- `lib/source-facts/provider-candidates.ts` 신규 — SourceProviderCatalogEntry, ProviderReadinessStatus, TopicCandidate, TopicCandidatePipelineResult 타입 + 3개 mock provider catalog + 3개 mock snapshot + 3개 mock TopicCandidate + resolveProviderReadiness() + createFactCardDraftFromTopicCandidate() + runTopicCandidatePipeline() + MOCK_TOPIC_CANDIDATE_PIPELINE_RESULTS + `providerCandidateGeneratedSignalTranslationPackage` (preview fixture)
- `lib/source-facts/index.ts` — `./provider-candidates` re-export 추가
- `app/fact-cards/manual/package-preview/page.tsx` — import 추가 + packages 배열에 4번째 패키지 추가
- `scripts/check-provider-candidate-scene-package-static.mjs` 신규 — 39 checks
- `scripts/check-signal-translation-preview-static.mjs` — provider-driven preview wire 체크 3개 추가 → 84 checks

검증 결과:
- TypeScript (`npx tsc --noEmit`, output/ 제외) → 오류 없음
- ESLint (변경 2개 ts/tsx 파일) → 오류 없음
- `node scripts/check-provider-candidate-scene-package-static.mjs` → 39/39 PASS
- `node scripts/check-signal-translation-preview-static.mjs` → 84/84 PASS

## Recent Checkpoints

- `9338645` — `fix(package-preview): add imagePolicy to qa panel spec note`
- `a16bb80` — `feat(source-facts): add image prompt text policy structural qa`
- `34eb070` — `feat(source-facts): add voice narration structural qa`
- `b0acacf` — `docs(state): sync spec docs after scene label safe-zone contract`

## Recommended Next Task

1. **checkpoint commit** — `money-shorts-os-provider-candidate-to-scene-package-foundation-v1` 내용 포함 (3 files)
2. **다음 content slice** — Codex 결정 대기

## Forbidden

- Do not touch `piq_diag_out.txt`.
- Do not read, modify, delete, stage, or commit `.money-shorts-local/` data.
- Do not stage/commit/push unless explicitly approved later.
- Do not add dependencies or edit lockfiles.
- Do not edit `.env*`, secrets, deployment config, DB/Supabase schema, migrations, or API credentials.
- Do not call OpenAI/GPT, Gemini, Veo, ElevenLabs, KOSIS, OpenDART, FRED, ECOS live, or any live API.
- Do not run ffmpeg, render, export, upload, post, deploy, or write to `output/`.
- Do not write to OS clipboard, `localStorage`, or `sessionStorage`.
