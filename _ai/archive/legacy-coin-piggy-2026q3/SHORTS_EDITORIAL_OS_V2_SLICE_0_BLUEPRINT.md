# Shorts Editorial OS V2 — Slice 0 Repository Audit and Blueprint

- Approval ID: `APPROVE_SHORTS_EDITORIAL_OS_V2_SLICE_0_REPOSITORY_AUDIT_AND_BLUEPRINT`
- Role: `MAIN_AI_MODE`
- Main AI: Codex
- Date: 2026-08-03 KST
- Scope: repository audit and V2 blueprint only
- Product implementation: **not performed**
- Owner review of initial draft: `NEEDS_FIX`
- Claude Code read-only Cross Review: `COMPLETED_NEEDS_FIX` (`P0: 0`, `P1: 5`, `P2: 4`)
- Cross Review PASS: `NOT_ACHIEVED`
- Slice 1: `BLOCKED`
- Product implementation: `NOT_STARTED`
- Findings-correction state: `SHORTS_EDITORIAL_OS_V2_SLICE_0_CROSS_REVIEW_FINDINGS_CORRECTION_COMPLETE_AWAITING_TARGETED_REVIEW`

## 1. Executive decision

The current working tree contains a substantial, **statically wired** V1 spine for finance Shorts: topic selection, script compilation, TTS, aligned captions, image generation, optional Flow/Veo motion, ffmpeg assembly, hash-checked preview serving, Owner-triggered dual-platform publishing, file-backed publication evidence, and bounded purpose-specific recovery. Slice 0 did not execute these paths, so this document does not classify them as locally or externally verified. A second, mostly isolated source-first line contains `FactCard`, `SignalTranslationBrief`, six-scene contracts, render planning, and deterministic QA code, but it is not connected to the current Wizard.

V2 should **join and harden these two lines through adapters**, not assume the renderer or publisher is already V2-ready. The primary product gap is the editorial intelligence layer: the active Wizard is not evidence/freshness-bound, while the source-first contracts and screens are not connected to the active creation path. The proposed first implementation slice is limited to contracts, version isolation, an inert route, a storage interface, fixtures, and validators; it does not authorize persistence, a generator, a database, or an external API.

V2's default research and script-intelligence boundary is copy/paste with an external search-capable LLM. Pasted output is untrusted input. No external research API, browser automation, DB migration, dependency change, paid generation, upload, schedule activation, or public post is authorized by Slice 0.

## 2. Audit basis, repository state, and limits

### 2.1 Repository identity

| Item | Observed value |
| --- | --- |
| Repository root | `C:\Users\PC\jjy\instagram-auto` |
| Branch | `codex/source-first-blueprint-clean` |
| HEAD | `1a52e1f9c0b540d492f25707dc74cf0498752a5e` |
| Package manager | `pnpm` (`pnpm-lock.yaml`, `pnpm-workspace.yaml`, `package.json`) |
| Required build command | `pnpm build` |
| Current development command | `pnpm dev` |
| Main product route | `/money-shorts` |
| Root route | `app/page.tsx` redirects to `/money-shorts` |

### 2.2 Working-tree boundary and dirty-baseline separation

Observed branch and HEAD match the supplied report. The supplied Slice 0 start report was `modified 21 / untracked 3`; the current observation is `modified 23 / untracked 4 / staged 0`. Removing the three claimed Slice 0 document paths reconciles those counts exactly. However, no path-level start snapshot or start-time file hashes were preserved. Therefore the historical assertion that no pre-existing dirty product file changed during the initial Slice 0 draft is `NOT_RECONSTRUCTABLE`; count reconciliation is supporting evidence, not proof.

| Path | Current status | Baseline separation | Evidence / protection note |
| --- | --- | --- | --- |
| `_ai/HANDOFF_NOW.md` | modified | `ATTRIBUTION_UNVERIFIED` | Current modified state is observed and it is absent from the Slice 0 claimed change set. Because no Slice 0 start-time path hash exists, current evidence cannot prove whether it was already dirty or changed during Slice 0. Protected from this correction. |
| `components/VideoCreationWizard.tsx` | modified | pre-existing dirty product file | Present in supplied start class; read-only during this revision. |
| `lib/finance-editorial-script-engine.ts` | modified | pre-existing dirty product file | Read-only during this revision. |
| `lib/finance-visual-evidence-engine.ts` | modified | pre-existing dirty product file | Read-only during this revision. |
| `lib/flow-motion-jobs.ts` | modified | pre-existing dirty product file | Read-only during this revision. |
| `lib/owner-web-operator.ts` | modified | pre-existing dirty product file | Read-only during this revision. |
| `lib/veo-scene-selector.ts` | modified | pre-existing dirty product file | Read-only during this revision. |
| `package.json` | modified | pre-existing dirty product file | Read-only; current `dev` script is working-tree evidence, not clean-HEAD evidence. |
| `scripts/_flow-motion-render-input.mjs` | modified | pre-existing dirty product file | Read-only during this revision. |
| `scripts/check-finance-editorial-script-engine-v1.mjs` | modified | pre-existing dirty product file | Read-only during this revision. |
| `scripts/check-finance-v1-multi-topic-local-pipeline-smoke-v1.mjs` | modified | pre-existing dirty product file | Read-only during this revision. |
| `scripts/check-finance-visual-evidence-engine-v1.mjs` | modified | pre-existing dirty product file | Read-only during this revision. |
| `scripts/check-flow-motion-job-state-v1.mjs` | modified | pre-existing dirty product file | Read-only during this revision. |
| `scripts/check-flow-motion-render-input-v1.mjs` | modified | pre-existing dirty product file | Read-only during this revision. |
| `scripts/check-money-shorts-image-modality-diversity-v1.mjs` | modified | pre-existing dirty product file | Read-only during this revision. |
| `scripts/check-owner-one-click-video-creation-ui-static.mjs` | modified | pre-existing dirty product file | Read-only during this revision. |
| `scripts/check-veo-scene-selector-v1.mts` | modified | pre-existing dirty product file | Read-only during this revision. |
| `scripts/render-golden-sample-visual-only-v1.mjs` | modified | pre-existing protected file | Explicit Owner protection; read-only. |
| `scripts/run-money-shorts-500-production-batch.mjs` | modified | pre-existing dirty product file | Read-only during this revision. |
| `scripts/run-owner-real-scene-images-from-wizard-script-once.mjs` | modified | pre-existing dirty product file | Read-only during this revision. |
| `scripts/run-owner-real-video-from-wizard-assets-once.mjs` | modified | pre-existing dirty product file | Read-only during this revision. |
| `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json` | untracked | pre-existing protected file | Explicit Owner protection; read-only. |
| `scripts/get-youtube-refresh-token-once.mjs` | untracked | pre-existing protected file | Explicit Owner protection; contents not needed for this audit. |
| `scripts/run-dev-with-edge.mjs` | untracked | pre-existing dirty product file | Read-only; launcher classification applies only to current working tree. |
| `_ai/SHORTS_EDITORIAL_OS_V2_SLICE_0_BLUEPRINT.md` | untracked | Slice 0 document | New Slice 0 document; entire file is the Slice 0 diff because no HEAD blob exists. |
| `_ai/PROJECT_STATE.md` | modified | Slice 0 document | Initial Slice 0 and this correction are confined to the `Shorts Editorial OS V2 — Slice 0` status block. |
| `_ai/NEXT_ACTION.md` | modified | Slice 0 document | Initial Slice 0 and this correction are confined to the V2 authorization/next-action block. |

Start-time hash/snapshot preservation: `NO`. Reconstruction status: `NOT_RECONSTRUCTABLE`. For audit continuity only, the three documents' SHA-256 values immediately before this correction were Blueprint `975d5bd36aba51ff675a62ea757dad98964b3f05b8ce7c78a9eceebec4e63eed`, Project State `bbc7f497ef9e76c9859fa1ff8fdf276de2dd2b229bb25704a2fca70617b67145`, and Next Action `2e8d457f7dc6c370230139680af0cfc95e54091267c1a58b9b295affa9f475f3`. These are revision-entry hashes, not Slice 0 start hashes.

This correction uses an allowlist of exactly the three document paths above. Confirmation method: record `git status --short` before and after; compare changed-path sets; inspect `git diff -- <allowed files>`; require staged output empty. No reset, clean, stash, checkout, restore, commit, or push is used. Current staged/commit/push created by Slice 0: `0 / 0 / 0`.

Claude Code Cross Review was read-only: at this findings-correction entry, branch/HEAD/status/upstream still matched the prior completion record and the three document hashes were unchanged—Blueprint `f2bdbf06b498b92bd21d5621b5d94f0c4f3394d4bf79743b1187d425bfae1a82`, Project State `2754f27f9a558bbc9654f21320793b5a3be4a9eb1723ba2eda14f62451240692`, Next Action `935b44ef661769f7525404fa49e71f44a50c496bcdec4ed84db4d55f940bbdb3`.

### 2.3 Evidence method and limits

- Inspected `AGENTS.md`, active `_ai` state/handoff documents, package scripts, routes, UI entry points, contracts, runners, QA checks, publish ledgers, recovery paths, and V1 design documents.
- Used targeted source searches and narrow file inspection. Reproducible inventory command `rg --files scripts | Where-Object { $_ -match '^scripts\\check-' }` observed 190 matching check scripts on 2026-08-03 KST; they were inventoried, not executed.
- No full test suite or build was run because Slice 0 is documentation-only and the working tree contains unrelated uncommitted implementation changes.
- No external API, browser session, paid generation, credential value, DB, deployment, account mutation, or publication was touched.
- Historical PASS results in `_ai/PROJECT_STATE.md` are evidence of prior validation, not a fresh Slice 0 rerun.

### 2.4 Classification vocabulary

| Status | Meaning |
| --- | --- |
| `CODE_PRESENT` | Relevant executable code exists, but caller-to-callee reachability was not established. |
| `STATICALLY_WIRED` | A caller-to-callee path was established by source inspection. No runtime success is implied. |
| `LOCAL_RUNTIME_VERIFIED` | The local path was executed successfully in the current audit with recorded command/output. |
| `EXTERNAL_OPERATION_VERIFIED` | The external operation was executed and observed in the current audit. Historical records alone do not qualify. |
| `PARTIAL` | Some implementation exists, but integration, runtime proof, coverage, or a required safety boundary is incomplete. |
| `MOCK` | The observed path is fixture/fake/simulated rather than a live capability. |
| `DOCUMENT_ONLY` | The capability is described but no matching executable path was confirmed. |
| `ABSENT` | Targeted inspection found no matching capability. |
| `UNVERIFIED` | A plausible path exists, but available evidence was insufficient to classify it more strongly. |

## 3. Capability Evidence Matrix

`Runtime verification level` is deliberately `not run in Slice 0` for every row: this documentation correction performed no product test, render, browser session, paid call, or external operation. Historical PASS/publication records are context only.

| Capability | File path | Symbol / route / component | Caller | Callee or external dependency | Current user-flow reachability | Evidence type | Runtime verification level | Current classification | Known limitation | KEEP / EXTEND / REPLACE / DEPRECATE | V2 adapter or migration requirement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| development server | `package.json`; `scripts/run-dev-with-edge.mjs` | `scripts.dev`; top-level launcher | `pnpm dev` | Next CLI `next dev --webpack` | current working-tree entry command | source inspection | not run in Slice 0 | `STATICALLY_WIRED` | launcher file is untracked; clean-HEAD behavior not established | EXTEND | supported launcher contract plus diagnostics; no dependency change |
| browser launcher | `scripts/run-dev-with-edge.mjs` | `openEdgeOnce()` | Next stdout Ready detector | Microsoft Edge executable | reached after detected Ready text | source inspection | not run in Slice 0 | `STATICALLY_WIRED` | Windows/Edge-specific; no readiness HTTP probe | EXTEND | configurable browser/open-once behavior |
| worker launcher | `scripts/run-dev-with-edge.mjs` | none | none | none | unreachable | absence search | not run in Slice 0 | `ABSENT` | only Next child is started | EXTEND | add only if a later Slice proves a worker is necessary |
| current Wizard | `app/money-shorts/page.tsx`; `components/VideoCreationWizard.tsx` | `/money-shorts`; `VideoCreationWizard` | `app/page.tsx` redirect / direct route | `/api/money-shorts/operator` | active Owner route | caller→callee inspection | not run in Slice 0 | `STATICALLY_WIRED` | V1 finance path; no V2 evidence import | KEEP | isolate behind V1 adapter; no behavior change while V2 OFF |
| topic generation | `components/VideoCreationWizard.tsx`; `app/api/money-shorts/operator/route.ts`; `lib/owner-web-operator.ts`; `lib/finance-editorial-topic-bank.ts` | `topicRecommend`; `generateWizardTopicBatchSmart()` | Wizard action | local editorial bank / optional polish boundary | active Wizard step | caller→callee inspection | not run in Slice 0 | `STATICALLY_WIRED` | not a fresh source-backed trend search | REPLACE | V2 PromptPackage/import flow becomes default; V1 stays intact |
| script generation | `app/api/money-shorts/operator/route.ts`; `lib/owner-web-operator.ts`; `lib/finance-editorial-script-engine.ts` | `scriptPreview`; `buildScriptFromGeneratedTopic()`; `buildFinanceEditorialScriptParts()` | Wizard action | local compiler / optional Claude polish | active Wizard step | caller→callee inspection | not run in Slice 0 | `STATICALLY_WIRED` | no mandatory claim-to-source binding | REPLACE | V2 ScriptPackage adapter; replacement means V2 default only |
| Fact Card | `app/money-shorts/page.tsx`; `app/fact-cards/manual/new/ManualFactCardFormClient.tsx`; `app/fact-cards/manual/page.tsx`; `lib/source-facts/manual.ts` | `ADVANCED_TOOLS`; `ManualFactCardFormClient`; `ManualFactCardPage`; `authorManualFactCard()` | `/money-shorts` advanced-tool links → `/fact-cards/manual/new` and `/fact-cards/manual` | manual authoring + FactCard validation | Owner-reachable separate manual tools; no `VideoCreationWizard` Fact Card reference | caller→route→callee inspection | not run in Slice 0 or Cross Review | `PARTIAL` | reachable from the Owner page, but not coupled to the Wizard topic→script→production pipeline | EXTEND | `KEEP_CONCEPT`; integrate citation primitives into EvidencePack through an explicit adapter |
| Signal Brief | `app/money-shorts/page.tsx`; `app/fact-cards/manual/package-preview/page.tsx`; `app/fact-cards/manual/package-preview/SignalTranslationPreviewPanel.tsx`; `lib/render-plan/scene-package-adapter.ts`; `lib/source-facts/provider-candidates.ts` | `ADVANCED_TOOLS`; `PackagePreviewPage`; `SignalTranslationPreviewPanel`; `buildRenderManifestFromScenePackage()`; provider preview package | `/money-shorts` advanced-tool link → `/fact-cards/manual/package-preview` → preview panel | signal-translation generator/QA, provider candidate, render-plan adapter | statically wired on a separate Owner-reachable route; no `VideoCreationWizard` Signal Brief reference | caller→route→component/adapter inspection | not run in Slice 0 or Cross Review | `STATICALLY_WIRED` | does not drive the Wizard's default topic→script→production path; no V2 artifact adapter exists | EXTEND | `KEEP_CONCEPT`; adapt useful translation rules to TrendBrief/SceneCard contracts |
| TTS | `app/api/money-shorts/operator/route.ts`; `scripts/build-elevenlabs-korean-director-tts-from-script.mjs` | `realTtsCreate`; aligned TTS runner | Wizard action | ElevenLabs HTTP API; ffprobe | active after approval gates | caller→callee inspection | not run in Slice 0 | `STATICALLY_WIRED` | paid/external behavior not reverified; V1 artifact shapes | EXTEND | V2 VoiceArtifact/VoicePlan adapter and explicit paid approval |
| TTS cache | `scripts/build-elevenlabs-korean-director-tts-from-script.mjs` | `loadOrRequestAlignedAudio()`; fingerprint cache | TTS runner | local MP3/alignment files | internal to TTS path | source inspection | not run in Slice 0 | `CODE_PRESENT` | cache schema is runner-specific; invalidation not V2-aware | EXTEND | content/profile/provider/version keyed cache adapter |
| subtitle generation | `scripts/_money-shorts-dynamic-captions.mjs`; `scripts/run-owner-real-video-from-wizard-assets-once.mjs` | `createDynamicCaptionTimeline()` / `createDynamicCaptionAss()` | final-video runner | ASS generation | active final-render path | import/call inspection | not run in Slice 0 | `STATICALLY_WIRED` | no V2 claim/source IDs in caption artifact | EXTEND | SceneCard/claim/source references in CaptionArtifact |
| subtitle alignment | `scripts/build-elevenlabs-korean-director-tts-from-script.mjs`; `scripts/run-owner-real-video-from-wizard-assets-once.mjs` | character alignment cache; caption audit | final-video runner | ElevenLabs alignment JSON | active final-render precondition | data-flow inspection | not run in Slice 0 | `STATICALLY_WIRED` | V1 scene timing contract only | EXTEND | bind alignment to SceneCard timing and invalidate on voice changes |
| image generation | `app/api/money-shorts/operator/route.ts`; `scripts/run-owner-real-scene-images-from-wizard-script-once.mjs` | `realSceneImagesCreate`; scene image runner | Wizard action | browser-driven image provider | active after script/TTS gates | caller→callee inspection | not run in Slice 0 | `STATICALLY_WIRED` | browser/provider fragility; AI image is not factual proof | EXTEND | VisualAssetPlan adapter, rights/cost gates, direct upload option |
| Flow/Veo | `app/api/money-shorts/operator/route.ts`; `lib/flow-motion-jobs.ts`; `lib/veo-scene-selector.ts`; `scripts/run-flow-motion-job-playwright-v1.mjs` | `flowMotionGenerate`; job state/selector/runner | Wizard action | browser-driven Flow/Veo | optional Owner-approved scenes | caller→callee inspection | not run in Slice 0 | `PARTIAL` | prior handoff records result-binding/Owner-QA gaps; external behavior unverified | EXTEND | provider adapter, per-scene cost/approval, deterministic fallback |
| ffmpeg composition | `scripts/run-owner-real-video-from-wizard-assets-once.mjs` | `runFfmpeg()`; `ffprobeJson()` | `finalVideoCreate` action via operator | local ffmpeg/ffprobe | active final-render path | caller→callee inspection | not run in Slice 0 | `STATICALLY_WIRED` | consumes V1 script/image/timing contracts | EXTEND | SceneCard/chart/vector inputs and adapter-level V1 regression |
| preview generation | `scripts/run-owner-real-video-from-wizard-assets-once.mjs`; `lib/owner-web-operator.ts` | final MP4 + `readWizardVideoBytes()` | `finalVideoCreate` / preview GET | local file read | active Wizard preview | data-flow inspection | not run in Slice 0 | `STATICALLY_WIRED` | only current final render creates this preview; no low-resolution V2 preview path | EXTEND | separate low-resolution PreviewArtifact from high-resolution FinalArtifact |
| preview hash binding | `components/VideoCreationWizard.tsx`; `app/api/money-shorts/operator/route.ts`; `lib/owner-web-operator.ts` | `video=final&sha256=...`; `readWizardVideoBytes()` | Wizard video element | local final MP4/hash check | active Wizard preview request | request/data-flow inspection | not run in Slice 0 or Cross Review | `STATICALLY_WIRED` | code fails closed unless expected hash is lowercase 64-hex, stored hash equals expected hash, rehashed MP4 bytes equal expected hash, resolved path is under `WIZARD_VIDEO_ALLOWED_PREFIX`, and extension is `.mp4`; runtime remains unverified | EXTEND | immutable PreviewArtifact hash and input-hash binding |
| final render | `app/api/money-shorts/operator/route.ts`; `scripts/run-owner-real-video-from-wizard-assets-once.mjs` | `finalVideoCreate`; `wizard_real_video_summary_v1` | Wizard action | ffmpeg/ffprobe | active after media gates | caller→callee inspection | not run in Slice 0 | `STATICALLY_WIRED` | 1080×1920 validation is code, not fresh runtime proof | EXTEND | V2 RenderPlan adapter; keep V1 runner unchanged initially |
| scene-only rerender | `app/api/money-shorts/operator/route.ts`; `scripts/run-owner-real-scene-images-from-wizard-script-once.mjs` | `realSceneImagesRegenerateSelected` | Wizard action | selected image regeneration | image-only selective path reachable | source inspection | not run in Slice 0 | `PARTIAL` | image regeneration exists; isolated scene video render/remux contract not established | EXTEND | content-addressed scene bundle + partial render/remux adapter |
| Instagram publishing | `app/api/money-shorts/operator/route.ts`; `scripts/run-final-e2e-dual-platform-publish-once.mjs`; `lib/instagram.ts` | `actualUpload`; Graph container/poll/publish | Wizard Owner action | Instagram Graph API | Owner-triggered immediate path | caller→callee inspection + historical state | not run in Slice 0 | `STATICALLY_WIRED` | no current external verification; generic path lacks universal identity proof | EXTEND | immutable PublishPackage + universal profile/account gate |
| YouTube publishing | `app/api/money-shorts/operator/route.ts`; `scripts/run-final-e2e-dual-platform-publish-once.mjs`; `lib/youtube.ts` | `actualUpload`; `videos.insert` | Wizard Owner action | YouTube Data API | Owner-triggered immediate path | caller→callee inspection + historical state | not run in Slice 0 | `STATICALLY_WIRED` | no current external verification; visibility/account contract needs hardening | EXTEND | immutable PublishPackage + verified expected channel |
| OAuth | `lib/youtube.ts`; `lib/youtube-refresh-token-renewal.mjs`; `scripts/run-youtube-refresh-token-renewal-v1.mjs`; `lib/instagram.ts` | YouTube auth/renewal; Instagram credential resolver | Owner CLI for YouTube; none for Instagram enrollment | Google OAuth; existing Instagram credentials | YouTube maintenance only; no unified UI | source inspection | not run in Slice 0 | `PARTIAL` | Instagram OAuth absent; referenced app callback incomplete | EXTEND | separate approved auth/account slice; never part of Slice 1 |
| account identity check | `scripts/run-money-shorts-part2-instagram-identity-readonly-preflight-v1.mjs`; `lib/youtube-refresh-token-renewal.mjs` | expected IG account check; expected YT channel check | purpose-specific Owner runners | Graph/YouTube read APIs | only bounded flows | source inspection | not run in Slice 0 | `PARTIAL` | not universal across all generic publish callers | EXTEND | one pre-mutation identity adapter per platform |
| wrong-account hard stop | same as account identity row; `scripts/run-money-shorts-part2-only-dual-publish-safe-v1.mjs` | expected identity/fingerprint gates | bounded safe/recovery runners | platform identity reads | not universal | source inspection | not run in Slice 0 | `PARTIAL` | cannot claim every publish surface fails closed | EXTEND | mandatory universal gate before any mutation |
| immediate publishing | `app/api/money-shorts/operator/route.ts`; `scripts/run-final-e2e-dual-platform-publish-once.mjs` | `actualUpload`; one-shot runner | explicit Owner action | Instagram + YouTube APIs | reachable only after gates/arming | caller→callee inspection | not run in Slice 0 | `STATICALLY_WIRED` | immediate means Owner-triggered, not autonomous | EXTEND | consume approved immutable PublishPackage only |
| legacy `/api/upload` | `app/api/upload/route.ts`; `components/UploadPanel.tsx`; `n8n/workflow_autoshorts.json` | `POST`; `evaluateGoldenSampleUploadHardBlock()`; `UploadPanel` fetch | orphan `UploadPanel`; inactive n8n HTTP node | guard returns 403 before legacy upload side effects | no current mounted UI path: app-wide `.ts/.tsx` search found `UploadPanel` references only in its own file; inactive n8n/document references exist | route/caller/import search | not run in Slice 0 or Cross Review | `PARTIAL` | route exists and direct callers exist as inactive artifacts, but the route is fail-closed and no mounted UI caller is found; deletion is not approved | KEEP | inactive legacy boundary; any future disposition requires separate caller/replacement audit and Owner approval |
| scheduled publishing | `n8n/workflow_autoshorts.json`; `app/api/upload/route.ts`; `_ai/PROJECT_STATE.md` | schedule trigger; inactive workflow; `/api/upload` HTTP node | no confirmed active n8n execution host | n8n would call `/api/upload`, whose guard currently returns 403 | artifact exists with `active:false`; current execution subject/active scheduler not confirmed | artifact/route/state inspection | not run in Slice 0 or Cross Review | `DOCUMENT_ONLY` | not an operational scheduling capability; target upload route is fail-closed | KEEP | preserve as inactive legacy boundary; do not activate or delete; future scheduler requires a separate approved slice |
| duplicate prevention | `scripts/run-final-e2e-dual-platform-publish-once.mjs`; `lib/publish-ledger.ts`; `lib/publish-ledger-runtime.mjs` | gate 7; `checkPublishLedgerDuplicate()` | one-shot publisher | file-backed ledger | active publish preflight | caller→callee inspection | not run in Slice 0 | `STATICALLY_WIRED` | keys/schema are V1 and universal platform idempotency is not proven | EXTEND | V2 idempotency key includes profile/content version/platform/visibility |
| publication ledger | `lib/owner-web-operator.ts`; `lib/publish-ledger.ts`; `lib/publish-ledger-runtime-write.mjs` | `WIZARD_PUBLISH_LEDGER_PATH`; `readPublishLedger()`; `writePublishLedger()` | Wizard/publisher after both successes | authoritative V1 JSON at `C:\tmp\money-shorts-os\final-e2e-ready-content-unit-and-publish-one-v1\publish-ledger.json`; atomic rename helper | active V1 publish/read-model path | caller→path→callee inspection | not run in Slice 0 or Cross Review | `STATICALLY_WIRED` | current V1 depends on this C:\tmp ledger; local-file durability and dual all-or-nothing write do not model every V2 partial outcome | EXTEND | preserve V1 path/data untouched; later V2 adapter needs platform-granular attempts without implicit migration/backfill |
| partial failure recovery | `lib/money-shorts-publish-recovery.mjs`; `lib/money-shorts-publish-attempt-journal.mjs`; purpose-specific recovery runners | recovery/read-model helpers | Wizard recovery surfaces | local evidence + platform-specific runners | selected known cases | source inspection | not run in Slice 0 | `PARTIAL` | coverage is bounded to known V1 cases; generic durable state machine not established | EXTEND | evidence-pending state and platform-granular recovery adapter |
| failed-platform-only retry | `scripts/run-money-shorts-youtube-only-part1-recovery-v1.mjs`; `scripts/run-money-shorts-part2-youtube-recovery-execution-v1.mjs`; `scripts/run-money-shorts-part2-instagram-recovery-execution-v1.mjs` | purpose-specific recovery entrypoints | explicit Owner commands/Wizard recovery | one platform mutation | reachable only for named evidence-bound cases | source inspection | not run in Slice 0 | `PARTIAL` | not generic across arbitrary projects/platform outcomes; no blind retry allowed | EXTEND | generic retry eligibility derived from immutable attempt evidence |
| cover generation | `lib/finance-editorial-script-engine.ts`; `scripts/run-owner-real-video-from-wizard-assets-once.mjs`; `lib/owner-web-operator.ts` | cover bundle; staged cover render contract | script/final render path | first-scene/caption rendering | active for supported V1 scripts | data-flow inspection | not run in Slice 0 | `PARTIAL` | no unified standalone cover artifact or verified platform cover/thumbnail upload | EXTEND | deterministic CoverArtifact; upload integration is later separately approved work |
| title/description/hashtags/source notice | `lib/owner-web-operator.ts`; `scripts/run-final-e2e-dual-platform-publish-once.mjs`; `lib/youtube.ts`; `lib/instagram.ts` | publish metadata snapshot / platform metadata | Wizard publish builder | platform payloads | active publish path | data-flow inspection | not run in Slice 0 | `PARTIAL` | title/description/tags exist; source notice is not consistently EvidencePack-derived | EXTEND | hash metadata from approved Script/Evidence packages |
| project persistence | `lib/owner-web-operator.ts`; `lib/money-shorts-safe-session-store.mjs`; `lib/money-shorts-automation-queue-store.mjs`; `lib/money-shorts-automation-execution-store.mjs` | `WIZARD_VIDEO_OUT_ROOT`; `WIZARD_INPUTS_ROOT`; `WIZARD_VOICE_OUT_DIR`; topic catalog/history/preferences; safe-session/queue/execution roots | Wizard/operator/session/queue/execution actions | authoritative V1 state under `C:\tmp\money-shorts-os` | active V1 workflow and state stores | symbol/path inspection | not run in Slice 0 or Cross Review | `PARTIAL` | current V1 uses C:\tmp for project/input, session/queue/execution, render/output, and ledger state; no V2 aggregate/schema/migration contract | EXTEND | V2 configurable-root interface is separate; Slice 1 must not move, delete, clean, migrate, or rewrite V1 C:\tmp data/paths |
| resume after interruption | `lib/owner-web-operator.ts`; `lib/money-shorts-resumable-orchestrator.mjs`; `lib/money-shorts-safe-session-store.mjs` | status readers; resumable/safe-session stores | Wizard/operator status and bounded actions | authoritative V1 local state under `C:\tmp\money-shorts-os` plus atomic helpers | some V1 flows | source inspection | not run in Slice 0 or Cross Review | `PARTIAL` | multiple V1 state models; paid/publish recovery not unified | EXTEND | preserve V1 paths; resume V2 from last verified artifact only after separate storage implementation approval |
| V1/V2 data separation | `app/money-shorts/page.tsx`; `lib/owner-web-operator.ts`; `lib/money-shorts-safe-session-store.mjs`; `lib/money-shorts-automation-queue-store.mjs`; `lib/money-shorts-automation-execution-store.mjs` | existing V1 route and authoritative C:\tmp roots; no executable V2 route/store found | current V1 Wizard/state stores only | V1 `C:\tmp\money-shorts-os`; proposed V2 namespace is separate | V2 unreachable | targeted absence search plus V1 path inspection | not run in Slice 0 or Cross Review | `ABSENT` | V1 storage is real/non-disposable; only a target V2 separation contract exists | EXTEND | V2 default-OFF local route gate and namespace contract; zero V1 C:\tmp write/move/delete/path rewrite |

## 4. Current V1 flows

### 4.1 Active creation flow

The current Owner flow in `components/VideoCreationWizard.tsx` is effectively:

1. Finance category and topic recommendation.
2. Topic/editorial decision and `single | part-1 | part-2` strategy.
3. Script compile/polish and finalization.
4. Character/reference review.
5. TTS generation and listening approval.
6. Scene-image generation and QA.
7. Optional paid Flow/Veo motion approval and recovery.
8. Local ffmpeg final render.
9. Exact-file preview and final hash approval.
10. Dual-platform preflight.
11. Owner-triggered actual upload and publication read-model update.

This flow has a broad statically connected path after script finalization and historical validation records, but Slice 0 did not re-run it. The active topic/script stages do not require current-source evidence or claim-to-source linkage.

### 4.2 Isolated source-first flow

`lib/source-facts/**`, `lib/content-package/**`, `lib/render-plan/**`, `lib/final-qa/**`, `app/fact-cards/manual/**`, and `app/packages/page.tsx` establish:

`RawDataSnapshot → FactCard → SignalTranslationBrief → six SceneCards → ContentPackage → RenderPlan → QA`

This line has stronger factual contracts but relies heavily on deterministic/manual/fixture surfaces and does not drive the active Owner media workflow.

### 4.3 Current publish flow

The active publication path is Owner-triggered and evidence-driven:

`final hash approval → preflight → account/content checks → Blob handoff for Instagram → Instagram/YouTube mutation → attempt journal → publication ledger/read-model → platform-specific recovery if required`

Generation completion is not publication permission. A final render may be valid while `PublishPackage` remains blocked.

## 5. KEEP / EXTEND / REPLACE / DEPRECATE decision matrix

| Subsystem | Decision | Reason and V2 action |
| --- | --- | --- |
| Fact Card/citation primitives | `EXTEND` (`KEEP_CONCEPT`) | Preserve the useful source-ID/date/claim vocabulary, but do not claim the disconnected Fact Card implementation is V2-ready. Map the concept through an explicit `EvidencePack` integration adapter. |
| ECOS transport and normalizers | `EXTEND` | Keep as optional structured-provider adapters; do not make ECOS the only research source. |
| Signal Translation Brief | `EXTEND` (`KEEP_CONCEPT`) | Retain life-impact translation and risk boundaries; its current code is isolated from the Wizard and fixed-six-scene assumptions must not become V2 defaults. |
| Content/Render/Final QA packages | `EXTEND` | Reuse separation of contracts, planning, and execution; add V2 schema versions, issue-level repair, and media-evidence checks. |
| Current topic bank | `KEEP` as fallback | Useful for evergreen fallback and regression fixtures, but not the V2 default for recent-interest discovery. |
| Current local/Claude topic-script path | `REPLACE` as default | V2 defaults to copy prompt → paste external search-LLM result → parse/validate → Owner select. Keep local deterministic fallback behind V1. |
| Semantic single/two-part strategy | `EXTEND` | Preserve meaning-based segmentation; decide only after a source-bound Script Package is approved. |
| TTS and cache/alignment | `EXTEND` | Reuse useful content fingerprints and bounded-call behavior only through a V2 `VoicePlan`/artifact adapter keyed by script, voice/profile, provider, policy, and schema versions. |
| Dynamic caption engine | `EXTEND` | Reuse alignment-to-ASS and audit concepts, but add Scene Card timing plus claim/source references and V2 invalidation. |
| Current image generation runner | `EXTEND` | Keep selective re-render and reference hashes; consume `VisualAssetPlan` rather than assuming every scene is a full AI image. |
| Current human finance cast as V2 brand identity | `REPLACE` | Preserve continuity infrastructure, not the current cast identity. V2 needs one original, low-cost vector-native character. |
| Current 3D image-heavy visual default | `REPLACE` | V2 prioritizes text/numbers/charts/official/source/map motion before AI imagery. |
| Flow/Veo optional motion | `EXTEND` | Preserve explicit paid approval and result recovery; use only where deterministic motion cannot prove the point. |
| ffmpeg render/preview/hash checks | `EXTEND` | The V1 caller chain is static evidence, not fresh runtime proof. Add adapters for Scene Cards, charts, vector/character motion, low-resolution previews, and isolated scene render/remux. |
| Local JSON state and resume | `EXTEND` | Keep simple local persistence for initial V2; add versioned aggregate, atomic writes, migration guards, and recovery index. |
| Publication ledger/attempt journal/recovery | `EXTEND` | Reuse key/evidence concepts, but durability, platform granularity, evidence-pending transitions, and arbitrary-project recovery are not established universally. |
| Legacy `/api/upload` route | `KEEP` as inactive legacy boundary | `app/api/upload/route.ts` exists and evaluates `evaluateGoldenSampleUploadHardBlock()` before legacy side effects, returning 403 while blocked. `components/UploadPanel.tsx` calls it, but app-wide `.ts/.tsx` search finds no import/mount outside that component; the n8n HTTP caller is in an inactive artifact. This is not deletion approval. |
| Inactive n8n workflow | `KEEP` as inactive legacy boundary | `n8n/workflow_autoshorts.json` exists, contains a schedule trigger and `/api/upload` call, and has `active:false`; no active execution host was confirmed and the target route is fail-closed. Do not activate or remove it without separate approval. |
| Generic eight-category selector | `DEPRECATE` from active V2 scope | Do not delete. V2 begins with editorial explainers across approved areas, not dormant legacy category claims. |

`REPLACE` always means “replace as the V2 default path.” It never authorizes immediate V1 deletion, migration, route cutover, or removal of legacy files.

## 6. V2 product boundary and content range

### 6.1 Product promise

Shorts Editorial OS V2 targets a workflow that helps one Owner turn current, source-backed developments into clear 15–60 second vertical explainers with reusable branded motion, bounded paid generation, a low-resolution review preview, a separately rendered high-resolution final, and separately approved publication. This is a product target, not a current implementation claim.

It is an editorial operating system, not a stock-prediction channel, high-frequency auto-poster, or autonomous financial adviser.

### 6.2 Initial content range

- Economy and household finance: rates, inflation, FX, wages/work, housing and loan cost, taxes/benefits, consumer prices/card bills, saving, insurance, pension, and financial literacy.
- Behavioral economics and consumer psychology: source-backed choice architecture, spending behavior, pricing, risk perception, and household decision patterns.
- Technology and AI: major releases, platform changes, regulation, labor/consumer impact.
- Society and policy: verified rule changes, deadlines, public programs, safety, education, work, demographic signals.
- Business and markets: company/industry developments when tied to consumer or worker consequences; no price target, buy/sell instruction, or guaranteed outcome.
- TMI/knowledge only when anchored to a current event or a clearly evergreen editorial lane.

Every topic is evaluated for watch reason, freshness, evidence, personal relevance, visual proof, rights, and financial safety. “It might go viral” is not sufficient evidence.

## 7. Target architecture and state machine

### 7.1 Canonical pipeline

`Trend Brief → Evidence Pack → Topic Candidates → Topic Evaluation → Selected Angle → Detailed Script Package → 7–10 Scene Cards → Visual Asset Plan → Voice/Subtitle → Preview Render → Final Render → Publish Package`

The pipeline is a target design for versioned artifacts; it is not implemented by Slice 0. Each artifact has its own status, input hashes, validation report, Owner decision, and provenance. Any material upstream hash change automatically invalidates every dependent downstream approval. No normalized/canonical artifact becomes approved or final until the Owner explicitly accepts that revision.

### 7.2 States and approval boundaries

| State | Produced artifact | Required gate before next state |
| --- | --- | --- |
| `research_prompt_ready` | `PromptPackage` | Owner copies prompt; no side effect. |
| `research_imported` | `ImportedLLMResponse` | Parse succeeds and raw import hash is stored. |
| `evidence_ready` | `EvidencePack` | Freshness, Evidence, and Claim-to-Source gates pass. |
| `topics_ready` | `TopicCandidate[]`, evaluations | Owner selects an angle. |
| `angle_selected` | selected candidate/angle | Script prompt or deterministic compile may begin. |
| `script_imported` | detailed `ScriptPackage` | Script gates pass; Owner approves script finalization. |
| `scenes_ready` | `SceneCard[]` | Visual Proof, Rights, Brand, retention gates pass. |
| `assets_planned` | `VisualAssetPlan`, cost estimate | Owner approves every paid provider/action. |
| `voice_subtitle_ready` | voice/caption artifacts | Listening and timing approval. |
| `preview_ready` | low-cost or draft preview | Owner reviews content, visuals, and rights. |
| `final_render_ready` | exact MP4 and hashes | Publish Readiness report passes. |
| `publish_package_ready` | `PublishPackage` | Separate exact public-post approval. |
| `publication_attempted` | `PublicationAttempt` | Read evidence; recover only missing platform/step. |
| `complete` | immutable publication read model | No automatic repost. |

### 7.3 Suggested module boundaries (proposal only)

- `lib/editorial-v2/contracts/**`: pure versioned types and validators.
- `lib/editorial-v2/import/**`: tolerant parser, normalizer, repair packet compiler, untrusted-input limits.
- `lib/editorial-v2/evaluation/**`: deterministic quality gates and scores with reasons.
- `lib/editorial-v2/project-store/**`: local schema-versioned atomic state, recovery index, and invalidation.
- `lib/editorial-v2/visual/**`: scene/asset/character plans and adapters to existing runners.
- `lib/editorial-v2/render/**`: adapter to existing caption/ffmpeg pipeline.
- `lib/editorial-v2/publish/**`: `PublishPackage` adapter and universal profile/account gate.
- `components/editorial-v2/**`: six simple Owner stages rather than exposing every internal state.

No directories above are created by Slice 0.

## 8. Core data contracts

All identifiers are stable strings; all timestamps are ISO 8601; all contract roots carry `schemaVersion`, `projectId`, `createdAt`, `inputHashes`, and `status`. Unknown fields are retained in import diagnostics but are not trusted as executable instructions.

### 8.1 Research and evidence contracts

```ts
type PromptPackage = {
  schemaVersion: "editorial-prompt-package.v1";
  promptId: string;
  projectId: string;
  promptKind: "trend_research" | "script_research" | "targeted_repair";
  asOf: string;
  researchWindowPreset: "24h" | "7d" | "30d";
  researchWindow: { from: string; to: string; timezone: "Asia/Seoul" };
  locales: string[];
  field: string;
  editorialLanes: string[];
  audience: string;
  targetDurationSec: number;
  sourceRequirements: {
    preferPrimary: true;
    currentClaimNeedsPublishedDate: true;
    numericClaimNeedsUnitAndPeriod: true;
    disputedClaimNeedsCorroboration: true;
  };
  forbiddenOutputs: string[];
  expectedSchema: unknown;
  promptText: string;
};

type ImportedLLMResponse = {
  schemaVersion: "editorial-llm-import.v1";
  importId: string;
  promptId: string;
  providerLabel?: string;
  modelLabel?: string;
  researchCutoff?: string;
  rawText: string;
  rawSha256: string;
  importedAt: string;
  parseStatus: "parsed" | "parsed_with_warnings" | "repair_required" | "rejected";
  parserDiagnostics: Array<{ code: string; jsonPath?: string; message: string }>;
  normalizedPayload?: unknown;
  normalizedSha256?: string;
  priorImportId?: string;
};

type EvidenceItem = {
  evidenceId: string;
  evidenceType: "primary_document" | "official_data" | "report" | "news" | "expert_context";
  publisher: string;
  title: string;
  url: string;
  publishedAt?: string;
  updatedAt?: string;
  eventAt?: string;
  retrievedAt: string;
  dataPeriod?: string;
  excerpt?: string;
  claimIds: string[];
  numericFacts?: Array<{ value: number; unit: string; currency?: string; asOf: string; period?: string; label: string }>;
  rights: { use: "citation_only" | "reconstruct_allowed" | "asset_allowed" | "unknown"; note?: string };
};

type EvidencePack = {
  schemaVersion: "editorial-evidence-pack.v1";
  evidencePackId: string;
  asOf: string;
  trendBrief: {
    whatChanged: string;
    whyNow: string;
    whoIsAffected: string[];
    expectedLifeImpact: string[];
    openQuestions: string[];
  };
  claims: Array<{
    claimId: string;
    text: string;
    claimType: "fact" | "calculation" | "interpretation" | "scenario";
    evidenceIds: string[];
    confidence: "high" | "medium" | "low";
    freshnessClass: "current" | "recent_context" | "evergreen_context";
  }>;
  evidence: EvidenceItem[];
  validation: ValidationReport;
};
```

### 8.2 Editorial decision contracts

```ts
type TopicCandidate = {
  candidateId: string;
  title: string;
  watchReason: string;
  selectedAngleProposal: string;
  audienceConsequence: string;
  claimIds: string[];
  visualProofIdeas: string[];
  risks: string[];
};

type TopicEvaluation = {
  candidateId: string;
  gateResults: ValidationReport;
  scores: {
    watchReason: number;
    freshness: number;
    evidence: number;
    specificity: number;
    visualProof: number;
    retentionPotential: number;
    safety: number;
  };
  recommendation: "select" | "revise" | "reject";
  reason: string;
};

type ScriptPackage = {
  schemaVersion: "editorial-script-package.v1";
  scriptPackageId: string;
  selectedCandidateId: string;
  selectedAngle: string;
  targetDurationSec: number;
  titleOptions: string[];
  openingHook: string;
  narration: string;
  beats: Array<{
    beatId: string;
    purpose: string;
    narration: string;
    onScreenText: string[];
    claimIds: string[];
    evidenceIds: string[];
    estimatedDurationSec: number;
    retentionDevice?: string;
  }>;
  sourceWording: string;
  platformMetadataDraft: { title: string; description: string; hashtags: string[] };
  ownerDecision: "draft" | "approved" | "rejected";
  validation: ValidationReport;
};
```

### 8.3 Scene, visual, render, and publish contracts

```ts
type SceneCard = {
  sceneId: string;
  beatIds: string[];
  role: "hook" | "context" | "mechanism" | "impact" | "scenario" | "action" | "closing";
  narration: string;
  captions: string[];
  claimIds: string[];
  evidenceIds: string[];
  visualProof: string;
  requiredOnScreenFacts: Array<{ text: string; claimId: string }>;
  characterMotion?: CharacterMotionPlan;
  assetPlanIds: string[];
  safeZones: { top: number; right: number; bottom: number; left: number };
  durationSec: number;
  validation: ValidationReport;
};

// Every approved ScriptPackage must produce 7–10 SceneCards. Counts outside
// that range are blocking until the Owner explicitly revises the product contract.

type VisualAssetPlan = {
  assetPlanId: string;
  sceneId: string;
  modality:
    | "deterministic_text_number"
    | "chart"
    | "official_source_reconstruction"
    | "source_card"
    | "map_timeline_network"
    | "character_vector_motion"
    | "ai_image"
    | "ai_video"
    | "licensed_stock";
  evidenceIds: string[];
  rightsStatus: "owned" | "licensed" | "citation_only" | "generated_original" | "blocked" | "unknown";
  provider?: string;
  prompt?: string;
  inputAssetHashes: string[];
  estimatedCost?: { amount: number; currency: string; basis: string };
  paidActionApprovalId?: string;
  fallbackPlan?: string;
};

type CharacterMotionPlan = {
  characterVersion: string;
  identityBoardSha256: string;
  pose: string;
  entrance: string;
  action: string;
  reaction: string;
  exit: string;
  prop?: string;
  expression?: string;
  durationSec: number;
  continuityLocks: string[];
};

type RenderPlan = {
  schemaVersion: "editorial-render-plan.v1";
  renderPlanId: string;
  canvas: { width: 1080; height: 1920; fps: number };
  scenes: Array<{ sceneId: string; assetPlanIds: string[]; voiceArtifactId: string; captionArtifactId: string }>;
  transitionPolicy: string;
  audioPolicy: string;
  outputPath: string;
  inputHashes: Record<string, string>;
  rerenderScope: "all" | { sceneIds: string[] };
  validation: ValidationReport;
};

type ValidationReport = {
  reportId: string;
  validatorVersion: string;
  status: "pass" | "warn" | "fail";
  issues: Array<{
    issueId: string;
    gate: QualityGate;
    severity: "info" | "warning" | "blocking";
    jsonPath?: string;
    message: string;
    repairScope?: string;
  }>;
};

type PublishPackage = {
  schemaVersion: "editorial-publish-package.v1";
  publishPackageId: string;
  contentVersion: string;
  finalMp4Sha256: string;
  metadataSha256: string;
  coverAssetSha256?: string;
  sourceWording: string;
  profileId: string;
  targets: Array<{
    platform: "instagram" | "youtube";
    expectedAccountId: string;
    title: string;
    description: string;
    hashtags: string[];
    visibility?: "private" | "unlisted" | "public";
  }>;
  ownerPublicationApprovalId?: string;
  validation: ValidationReport;
};

type PublicationAttempt = {
  attemptId: string;
  publishPackageId: string;
  platform: "instagram" | "youtube";
  idempotencyKey: string;
  expectedAccountId: string;
  observedAccountId?: string;
  startedAt: string;
  finishedAt?: string;
  state: "planned" | "preflight_passed" | "mutation_started" | "evidence_pending" | "complete" | "failed";
  externalId?: string;
  evidence: Array<{ kind: string; value: string; observedAt: string }>;
  recoverableFrom?: string;
  error?: { category: string; message: string; retryAllowed: boolean };
};
```

`QualityGate` is the closed union defined in the next section. Any additive contract change increments the schema version when semantics change; old artifacts are never silently reinterpreted.

## 9. Copy/paste external LLM import design

### 9.0 Explicit trust boundary (target contract; not implemented)

- Every pasted response is classified as `UNTRUSTED_DATA`. It is never treated as an instruction, executable content, trusted HTML, a filesystem path, or authority to call a tool/network/account.
- The raw response is an immutable append-only artifact. A deterministic parser/normalizer runs before any optional repair workflow; raw and normalized forms have separate SHA-256 hashes and revision IDs.
- Preserve `promptId`/prompt version, provider label, model label, import time, research cutoff, project ID, raw hash, normalized hash, and prior revision link. Provider/model labels are user-supplied metadata, not proof of provenance.
- Enforce configured byte, character, array-length, object-key, and nesting-depth limits before parsing. Oversized/deep input is rejected without partial canonicalization.
- Multiple code fences or multiple JSON blocks are never silently merged. The parser enumerates bounded candidates; the Owner selects exactly one candidate or repastes. Ambiguous roots remain `repair_required`.
- Only `https:` and, where a later contract explicitly permits it, `http:` source URLs are candidates. Block `file:`, `javascript:`, `data:`, embedded credentials, localhost names, loopback, link-local, private IP ranges, and local-network targets.
- URL/network verification does **not** exist today. If added in a later separately approved slice, it must revalidate every redirect target and enforce redirect count, response-size, MIME allowlist, and connect/read/total timeouts. This is a future security contract, not a current capability claim.
- Store source publication/update dates separately from the event/data date. A current claim with no source date cannot pass Freshness. Every numeric claim requires value, unit, currency when applicable, and an as-of date or data period.
- Every factual claim carries source references. Raw-text prompt-injection phrases are quarantined in the raw artifact and diagnostics, never copied into system instructions.
- Repair prompts wrap all untrusted excerpts in explicit non-instruction delimiters and request only listed issue IDs/JSON paths. Repair results use field-level merge and cannot overwrite previously approved fields unless those exact fields are re-opened and re-approved.
- A material upstream artifact/hash change automatically invalidates dependent Script, Scene, Visual, Render, and Publish approvals. No import becomes canonical before Owner approval.

### 9.1 Default Owner flow

1. V2 compiles a `PromptPackage` for recent-topic research.
2. Owner copies the exact prompt into a search-capable external LLM.
3. Owner pastes the complete answer into V2.
4. V2 appends immutable raw text and SHA-256 before parsing; parsing never mutates this artifact.
5. The deterministic parser enumerates bounded JSON candidates, normalizes only approved structural variations, stores a separate normalized hash, and validates the versioned schema.
6. The UI shows parsed topics, sources, missing fields, suspicious dates, duplicate claims, and all blocking issues.
7. Owner may copy a narrowly scoped repair prompt containing issue IDs and the failing JSON paths.
8. A repair import creates a new immutable revision linked to the prior import. It never overwrites the raw answer.
9. Owner selects the topic/angle only after evidence gates pass.
10. The same pattern is used for a source-bound detailed script package.

The Research screen therefore needs an exact prompt-copy button, paste editor, import preview, immutable raw-response view, raw-versus-normalized comparison, validation summary, missing-field repair-prompt button, and field-level repair review. Nothing becomes final until the Owner accepts the normalized revision.

### 9.2 Accepted normalization

- Remove a single Markdown code fence and leading/trailing prose only when exactly one unambiguous JSON root exists. With multiple fences/JSON roots, enumerate candidates and require Owner selection; never merge them.
- Normalize CRLF, Unicode normalization, smart quotes outside JSON strings when unambiguous, and known enum aliases.
- Coerce numeric strings only when the target field is explicitly numeric and unit/period remain present.
- Deduplicate exact sources by canonical URL and preserve all original aliases in diagnostics.
- Sort arrays only where order has no editorial meaning.

### 9.3 Never auto-repair

- Missing or invented URLs, dates, publishers, figures, units, source text, claim mappings, or rights status.
- A current claim whose source date is absent or outside the research window.
- Conflicting numeric facts, impossible dates, unsupported forecasts, investment recommendations, or alleged quotations.
- Text that asks the app to run code, read secrets, change settings, contact accounts, browse elsewhere, or ignore validation.
- HTML/script payloads, filesystem paths, shell commands, remote-image embeds, or oversized input beyond the configured limit.

### 9.4 Error cases and recovery

| Error | Result | Recovery |
| --- | --- | --- |
| Empty/oversized/over-nested paste | `rejected` | Show the violated limit and retain no executable interpretation. |
| No unique JSON root / multiple fences or blocks | `repair_required` | Enumerate bounded candidates; Owner chooses one or repastes; never merge. |
| Syntax-only JSON error | `repair_required` | Offer a local, deterministic structural fix preview; Owner accepts as a new revision. |
| Schema mismatch | `repair_required` | Generate issue-scoped repair prompt. |
| Missing sources/claim mappings | `repair_required` | Request only missing evidence fields; do not fabricate. |
| Stale source | `repair_required` or topic reject | Re-run research with the explicit current window. |
| Script conflicts with Evidence Pack | `repair_required` | Mark the exact claim/beat paths; repair the script or evidence explicitly and revalidate every downstream claim link. |
| Duplicate import | Return existing import | Use `promptId + rawSha256` idempotency key. |
| Partial repair | Merge only paths named by resolved issue IDs | Revalidate the whole resulting artifact and record provenance per field. |
| Conflicting repair | `rejected` | Require Owner to select a source-backed value; preserve both revisions. |

Parsing and repair are target local pure functions; they are not implemented in Slice 0. No pasted text is executed or sent onward without a separate Owner action, and no normalized revision becomes canonical without Owner approval.

## 10. Editorial quality gates

```ts
type QualityGate =
  | "watch_reason"
  | "freshness"
  | "evidence"
  | "claim_to_source"
  | "genericity"
  | "visual_proof"
  | "retention"
  | "financial_safety"
  | "rights"
  | "brand_consistency"
  | "publish_readiness";
```

| Gate | Blocking rule for V2 |
| --- | --- |
| Watch Reason | Must name a concrete change/event/data release, why it matters now, and an audience consequence. Curiosity alone fails. |
| Freshness | Every current claim has an as-of date and published/updated date. Sources outside the requested window are labeled context, not current proof. |
| Evidence | Current or contested claims use authoritative primary material where available; a second independent source corroborates disputed interpretation. Every numeric fact carries unit and period. |
| Claim-to-Source | Every factual beat, on-screen number, chart, title claim, and source wording maps to valid claim/evidence IDs. Orphan claims block. |
| Genericity | If dates, figures, actors, mechanism, and consequence can all be removed without changing the script, it is generic and fails. |
| Visual Proof | Each scene specifies what visible evidence proves the narration. Decorative imagery cannot satisfy a factual scene. |
| Retention | Hook opens a question/tension immediately; each beat advances new information; no duplicated ending; payoff arrives before CTA. |
| Financial Safety | No guaranteed result, price target, individualized recommendation, fear-based trade instruction, or unlabeled forecast. Interpretations and scenarios are labeled. |
| Rights | Every external asset has a use status and source/license record. Unknown/blocked assets cannot enter final render. Character and templates are original. |
| Brand Consistency | Approved character version, palette, typography, motion grammar, voice profile, and profile ID match the project. Mismatch blocks generation. |
| Publish Readiness | All prior gates pass; final bytes/metadata/cover hashes match; exact accounts are observed; duplicate check passes; Owner publication approval exists. |

Scoring helps rank topics but never overrides a blocking gate. Gate output is deterministic and includes issue IDs, evidence paths, and the smallest permissible repair scope.

## 11. Original character and visual system

### 11.1 Character requirements

- Original silhouette and motion grammar; no copying a reference “money character,” mascot, pose library, or distinctive visual identity.
- Vector-native or simple layered 2.5D rig that can be rendered locally and reused without per-scene image-generation cost.
- Character supports editorial explanation, not financial hype or investment recommendation.
- Stable identity board, version, proportions, palette, face/eyes, motion primitives, and SHA-256 locks.
- Scene variables are pose, expression, prop, entrance/action/exit, and camera framing—not core identity.

### 11.2 Three original concepts

| Concept | Form, personality, and role | Default reusable motion | Automation, difficulty, and maintenance | Differentiation from reference channels |
| --- | --- | --- | --- | --- |
| **Loop — the Signal Navigator** | A single folded ribbon loop with one lens-like node. Calm, curious, and precise; it follows, filters, and connects signals. No coin, banknote, chart-arrow body, or human resemblance. | Unfold, scan, circle evidence, turn into bracket/underline/path, pulse at decisions, settle into a logo mark. | Very high automation fit; low rig difficulty; low maintenance because a small SVG primitive set covers most scenes. Abstract personality needs careful sound/eye motion. | Its body is an editorial annotation system rather than an anthropomorphic money mascot. |
| **Pin — the Field Finch** | A compact angular bird with a neutral radar-fan tail. Energetic and observant; it detects “what changed,” points at evidence, and warns of gaps. | Perch, two-step hop, head scan, wing-point, short path flight, land beside a source card. | High automation fit; medium rig difficulty; medium maintenance due to pose and facing variants. | An information-field scout, with no currency body, finance prop, or borrowed mascot silhouette. |
| **Moa — the Archive Sprite** | A stack of offset paper tiles with a small circular index light. Meticulous and warm; it collects, compares, verifies, and archives evidence. | Shuffle cards, reveal source, stamp verified, split comparison, stack timeline, tuck away a rejected claim. | High automation fit; low-to-medium rig difficulty; low maintenance, though playful timing is needed to avoid an office-tool feel. | Embodies source provenance and editorial verification, not wealth, coins, or investing success. |

The compact table above describes the directions; the acceptance comparison below is authoritative for Slice 5.

| Dimension | Loop direction | Pin direction | Moa direction |
| --- | --- | --- | --- |
| Silhouette | One open folded-ribbon path with a small neutral lens node; never round currency/face-shaped. | Compact angular bird/scout with a plain fan tail; no coin eyes, banknote wings, finance props, or copied mascot proportions. | Offset document tiles plus a neutral index light; no money stack, note face, or wealth-icon body. |
| Visual role | Editorial annotation that frames the current signal. | Field scout that detects change and warns about evidence gaps. | Archive assistant that compares, verifies, and records sources. |
| Source-navigation behavior | Travels along claim→source paths; brackets or underlines the exact cited region. | Moves from alert marker to source card and pauses at missing references. | Pulls two source cards into comparison and files rejected/accepted evidence separately. |
| Motion vocabulary | Unfold, scan, trace, circle, bracket, underline, pulse, settle. | Perch, two-step hop, head scan, short path flight, wing-point, land. | Shuffle, reveal, compare, stamp, stack timeline, archive/reject. |
| Implementation complexity | Low SVG-rig complexity; small primitive set; abstract expression needs careful timing. | Medium; facing/flight/perch variants and accessible motion reduction are required. | Low–medium; card overlap/z-order and readable verification motion require discipline. |
| Accessibility | Never encode status by color alone; reduced-motion replaces pulses/traces with static brackets and labels. | Warning/selection includes text/icon labels; reduced-motion removes flight and uses position changes. | Verification uses text/icon plus contrast; reduced-motion uses instant card swaps. |
| Screen occupancy | Target ≤12% of the 1080×1920 safe frame; may expand briefly only in a non-data transition. | Target ≤10%; perches outside chart/source-card data bounds. | Target ≤14%; document tiles may not cover quoted text or numbers. |
| Chart and evidence priority | Annotation remains behind/beside cited values; chart/source card always has z-order and contrast priority. | Points from outside; never lands over axes, legends, dates, or source labels. | Comparison cards are UI framing only; official chart/table/source content remains dominant and unmodified. |
| Rights provenance | New Owner-approved vector geometry, palette, motion files, hashes, and authorship/source log. | New Owner-approved vector geometry/poses, motion files, hashes, and authorship/source log. | New Owner-approved vector geometry/card grammar, motion files, hashes, and authorship/source log. |
| Similarity risk | Medium until comparison; ribbon/lens combination must avoid recognizable logo shapes. | Medium–high because bird mascots are common; silhouette/face/prop/color/motion comparison is mandatory. | Medium because paper/document mascots are common; no reference-specific face, stamp, palette, or movement. |

Loop is the current **comparison recommendation**, not a finalized name or design. Slice 5 must render three short motion samples—Loop, Pin, and Moa—using the **same Scene Card, timing, chart/source evidence, caption safe zones, and reduced-motion condition**. Owner selection is required before any final name, palette, identity board, or production use.

Explicit originality prohibitions:

- Do not replicate a reference channel's money, coin, or banknote face shape.
- Do not replicate a similar silhouette, facial expression system, prop set, color combination, signature pose, or representative motion.
- Do not compose the character over data, citations, chart axes/legends, official-source cards, or on-screen numbers.
- Do not finalize any name, design, palette, or identity board before Owner approval and rights/originality review.

### 11.3 Visual priority

V2 chooses the cheapest truthful modality that proves the scene:

1. Deterministic text and numbers rendered by code.
2. Charts and comparisons generated from cited values.
3. Official-document or source reconstruction with citation.
4. Source cards and quote/context cards.
5. Maps, timelines, networks, and process diagrams.
6. Original character vector motion as guide/annotation.
7. AI-generated still image when a real-world illustrative scene is necessary.
8. Optional AI video for a small, explicitly approved subset.
9. Licensed stock only when rights and source are recorded and it adds proof unavailable above.

Never ask an image model to draw authoritative text, numbers, logos, or charts that code can render exactly. AI output is treated as illustration, not factual evidence.

For every scene, the Owner can approve the proposed visualization, edit an AI-image prompt, regenerate only that image, upload a replacement image, switch to motion graphics, replace the character motion, disable the scene when the script remains coherent, or re-render only that scene. Each action creates a new revision and reruns affected quality gates.

### 11.4 Scene-level partial re-render

- Each scene is a content-addressed bundle of script beat, claims, source IDs, asset plan, voice segment, captions, character version, and renderer version.
- Changing one scene invalidates only that scene and the final mux unless shared voice timing or global style changed.
- A scene re-render receives a new artifact ID; the old artifact remains available for rollback and audit.
- Paid scene regeneration requires a new explicit approval tied to provider, scene, prompt hash, and estimated cost.

## 12. Owner UX, easy launch, persistence, and recovery

### 12.1 Six visible Owner stages

1. **Research** — copy prompt, paste result, inspect sources/errors.
2. **Choose** — compare topic evaluations and select one angle.
3. **Write** — import/refine detailed script and approve final wording.
4. **Plan** — review scenes, visual proof, character, rights, and estimated paid cost.
5. **Make** — generate TTS/assets, preview, selectively repair, final render.
6. **Publish** — verify accounts/metadata/cover, separately approve, inspect result/recovery.

Internal states remain visible in an expandable audit panel, but the primary UI uses one clear next action, one blocking reason list, and one recovery action.

Preview and final render are distinct profiles. The proposed preview profile is a visibly labeled low-resolution 540×960 draft that may use proxy assets; the final profile remains 1080×1920 with full audio/caption/media validation. A preview can never be promoted merely by renaming its file—the final renderer recomputes the exact manifest and hashes.

### 12.2 Easy launch

Current working-tree behavior is `pnpm dev`, which starts Next development and opens Edge on `/money-shorts`. V2 should retain that command while adding a supervised worker only when an implementation slice requires it.

Proposed future launcher responsibilities:

- Validate dependency presence and environment-key **presence only**, never print values.
- Start web and local worker as child processes with separate prefixed logs.
- Detect occupied ports, surface the exact local URL, open the V2 route once ready, and shut both children down on Ctrl+C.
- Recover abandoned `running` jobs to `interrupted` at startup; never silently resume a paid or publish action.
- Keep one supported command. A Windows click-to-run wrapper may be added only by a later approved slice and must call `pnpm`, not npm/yarn.

### 12.3 Persistence proposal

Current V1 fact and future V2 policy are separate:

- **Current V1:** `lib/owner-web-operator.ts` and the session/queue/execution stores use `C:\tmp\money-shorts-os` authoritatively for Wizard inputs/projects, topic catalog/history/preferences, voice/render/output state, safe-session state, automation queue/execution state, and the publication ledger. These files are not disposable fixtures.
- **Future V2:** do not adopt `C:\tmp` as a new authoritative persistence default. Slice 0 implements nothing and Slice 1 may define only a configurable data-root interface. A later approved implementation should prefer an OS application-data location while allowing an explicit Owner-selected root.

Target layout: `<configuredDataRoot>/shorts-editorial-os/v2/projects/<projectId>/`. The contract requires project-specific directories, explicit V1/V2 namespaces, schema versions, secrets/content separation, and append-only retention of every original LLM response. Each canonical pointer write uses a temporary file in the same target directory followed by atomic rename; readers validate schema and hashes before accepting it.

Durability/recovery requirements: corruption detection; a last-known-good pointer backup; migration backup before any transform; migration rollback with the original V1 and V2 artifacts preserved; and a recovery index that never treats a partially written artifact as canonical. DB, migration, and actual authoritative filesystem writes require later exact Owner approval.

V1 isolation invariants: Slice 1 and the V2 flag-OFF path perform no write, move, delete, cleanup, migration, or path rewrite under the existing `C:\tmp\money-shorts-os` V1 roots. A V2 read/validation failure cannot prevent an existing V1 project from opening; V2 secrets/configuration are stored separately from content and are never embedded in artifacts or logs. Any future V1 storage-location change requires its own audit, backup, migration, rollback Slice, and exact Owner approval.

### 12.4 Recovery rules

- On startup, validate project pointers and artifact hashes before enabling “continue.”
- `planned` work may be safely discarded; `running` paid/publish work becomes `interrupted` and requires evidence inspection.
- Never repeat a paid or external mutation solely because the client timed out.
- Resume from the last verified artifact, not from a UI step number.
- Show a recovery packet with last action, inputs, expected outputs, observed files/external IDs, and allowed next actions.

## 13. Publish-package and auto-publish audit design

### 13.1 Required publish package

Before any platform call, V2 produces one immutable package containing:

- Exact final MP4 hash, metadata hash, optional cover hash, duration/dimensions/stream evidence.
- Platform-specific title, description, hashtags, source wording, disclosure/safety wording, visibility, and expected account ID.
- Evidence Pack and validation report references.
- Rights ledger for every non-owned asset.
- Owner final-render approval and a separate Owner publication approval.
- Idempotency keys scoped to profile, content version, platform, and intended visibility.

### 13.2 Platform readiness

| Area | Current finding | V2 requirement |
| --- | --- | --- |
| Instagram auth | Existing credential use; no enrollment OAuth UI. | Keep current credential boundary initially; add enrollment/rotation only as a separately approved account/security slice. |
| Instagram upload | Graph container/poll/publish calls are statically wired; no current external verification was performed. | Require universal profile/account check and exact package hash before container creation. |
| YouTube OAuth | CLI/loopback refresh renewal exists; app callback incomplete. | Standardize one Owner-run renewal flow, no token value in logs, and verify channel before upload. |
| YouTube upload | Real `videos.insert` code exists. | Default future smoke to private/unlisted when supported and separately approved; public remains explicit. |
| Covers | No unified platform cover upload confirmed. | Generate deterministic 1080×1920 cover/first-frame contract; add platform-specific thumbnail/cover support in its own slice. |
| Metadata | Current title/description/hashtags exist. | Derive all claims/source wording from approved Script/Evidence packages and hash them. |
| Scheduling | Inactive legacy n8n artifact only. | No scheduling in initial V2. Future scheduler enqueues approved packages; it may never create or approve content itself. |

### 13.3 Account hard stop, idempotency, and partial recovery

- Resolve the current platform identity immediately before mutation and compare with the immutable expected ID. Missing or mismatched identity is blocking.
- Check the publication ledger and external evidence before every mutation.
- Record `PublicationAttempt` before and after each irreversible boundary.
- A timeout after a platform call enters `evidence_pending`; query/read evidence before deciding whether a retry is allowed.
- If Instagram succeeds and YouTube fails, recovery targets only YouTube with the same package hashes. Never rerun the dual-platform command blindly.
- Public-post success never triggers automatic repost, edit, delete, or ledger backfill.

### 13.4 Scheduling and automatic publication boundary

V2 may eventually support scheduled execution only for an already approved, immutable `PublishPackage`. Topic research, script finalization, paid generation, account selection, and public permission remain outside the scheduler. Schedule creation/update/delete and every production activation require separate Owner approval.

## 14. V1 protection, feature flag, data separation, and rollback

### 14.1 Protection rules

- Do not rewrite or delete the current `/money-shorts` V1 path while V2 is experimental.
- Preserve the known published content IDs and publication ledger; V2 never imports them as unpublished work.
- Do not change V1 artifact semantics in place. Shared adapters consume explicit V1 or V2 contracts.
- Existing Owner changes and protected files remain outside Slice 1 unless explicitly approved.

### 14.2 Feature and routing proposal

- Persist `editorialVersion: "v1" | "v2"` on every project.
- Add a server-controlled V2 availability flag in Slice 1, default off, without changing external env unless separately approved.
- Initial V2 route proposal: `/editorial-v2`; `/money-shorts` remains V1 until the Owner approves cutover.
- A project cannot switch versions after the first downstream artifact is created; clone to a new project instead.

### 14.3 Data separation

- V1 continues using its current authoritative `C:\tmp\money-shorts-os` directories; current project/input, session/queue/execution, render/output, and publication-ledger data are not disposable.
- V2 target storage uses a configurable root plus an explicit `shorts-editorial-os/v2/projects/<projectId>` namespace and V2-prefixed idempotency keys. New V2 authoritative persistence must not default to `C:\tmp`; a later test may use a separately named disposable fixture directory without touching V1 roots.
- An existing project with no `editorialVersion` is interpreted as V1. It is opened through the current compatibility adapter and is never silently upgraded.
- Shared immutable caches are permitted only when content hash, voice/profile version, provider, and policy version all match.
- Publication ledgers may share a read model only through an adapter that preserves original keys and versions.
- With the V2 flag OFF, no existing V1 file/path under `C:\tmp\money-shorts-os` is created, rewritten, moved, deleted, cleaned, migrated, renamed, or reconfigured. A corrupt or incompatible V2 namespace does not block `/money-shorts` or an existing V1 project.

### 14.4 Rollback

- Disable the V2 availability flag and return the Owner to `/money-shorts`; no destructive migration is needed.
- Preserve all V2 artifacts for inspection; do not rewrite them into V1 format.
- Any shared renderer/publisher adapter change must retain V1 contract tests.
- Incompatible data is migrated only after its V2 reader/writer and rollback fixture pass Cross Review; conversion creates a new V2 project and preserves the V1 original.
- Any proposal to change the existing V1 `C:\tmp\money-shorts-os` location requires a separate inventory/hash audit, verified backup, migration plan, rollback rehearsal, and exact Owner approval. Slice 1 may not begin that work.
- V1 removal or route replacement requires a new Owner approval after an accepted V2 operational cohort, compatibility audit, and rollback drill.

## 15. Implementation slices 0–8

### Slice 0 — Repository audit and blueprint (this document)

- **Goal:** establish a source-audited current-state classification, V2 target, risks, and bounded implementation order without runtime/external verification.
- **Input:** repository working tree, `AGENTS.md`, `_ai` source of truth, V1 code/docs.
- **Change:** this integrated blueprint plus minimal project-state pointers.
- **Forbidden:** product code, dependency/lockfile, DB/env, external calls, paid generation, publish, deploy, commit/push.
- **DoD:** requested capabilities classified with real paths; fact/proposal separated; V2 contracts, gates, character concepts, visual system, UX, publishing, migration, rollback, and slices documented.
- **Tests:** path existence, Markdown/diff hygiene, Git-state comparison only.
- **Owner approval:** already granted by the Slice 0 approval ID.
- **Cross Review:** completed with `NEEDS_FIX` (`P0 0 / P1 5 / P2 4`); PASS is not achieved. This correction requires separately authorized targeted review before Slice 1.

### Slice 1 — V2 contracts, version isolation, and local project skeleton

- **Status:** `BLOCKED`; the list below is a proposal, not an approved allowlist. Owner approval and read-only Cross Review PASS are both required first.
- **Goal:** implement only pure TypeScript contracts/validators, V1/V2 namespace contracts, a default-OFF flag, and an inert V2 route shell.
- **Input:** Sections 7–10 and 14 of this blueprint.
- **Proposed allowlist of behavior:** V2 artifact TypeScript contracts; schema-version contracts; V1/V2 namespace separation; default-OFF feature flag; inert `/editorial-v2` route; storage **interface only**; deterministic import fixture; state-transition validator; V1 no-regression checks; feature-flag-OFF direct-route hard stop implemented only inside the new route/page boundary (for example local `notFound()` or an equivalent local response).
- **Forbidden:** external LLM/API; real TTS/image/video generation; actual renderer integration; actual publishing; any current Wizard behavior change; V1 data migration; legacy deletion; dependency/lockfile change; DB addition; authentication change; existing dirty-file cleanup; authoritative persistence anywhere; env/secret access or modification; creation of `middleware.ts`, `middleware.js`, `src/middleware.ts`, or `src/middleware.js`; modification of any existing middleware; modification of `app/layout.tsx`; modification of `next.config.ts`, `next.config.js`, or `next.config.mjs`; any `package.json` change, including dependencies and scripts; existing route-group restructuring; existing app-route move/rename; global middleware, root-layout, redirect, or Next rewrite used to gate `/editorial-v2`; any write/move/delete/cleanup/migration/path rewrite under existing authoritative `C:\tmp\money-shorts-os` V1 data.
- **DoD:** proposed contracts and deterministic fixtures validate; schema/version/state mismatch fails closed; the V2 flag defaults OFF; only `/editorial-v2` fails closed while OFF through its local route/page boundary; `/money-shorts` and every existing route/project-opening path remain unchanged; no middleware file is added; `app/layout.tsx`, `next.config.*`, and `package.json` diffs are zero; existing route groups and route paths change zero; existing `C:\tmp\money-shorts-os` V1 write/move/delete/cleanup/path-change count is zero; the storage interface performs no authoritative write; no side effects are possible.
- **Tests:** pure contract fixtures, deterministic import fixture, version/state mismatch, feature-flag OFF direct-route hard stop, assertion that only `/editorial-v2` is blocked, V1 route/project compatibility, middleware-absence and protected-path diff checks, targeted typecheck/build only if the exact approved Slice 1 scope permits it.
- **Owner approval:** exact file-path allowlist, route/flag naming, storage-interface boundary, test list, and dirty-baseline protection. Nothing in this proposal is pre-approved.
- **Cross Review:** required, read-only, with special focus on hidden V1 coupling and filesystem safety.

### Slice 2 — Copy/paste Prompt Package and import repair loop

- **Goal:** make research/script copy/paste reliable without any external API.
- **Input:** Slice 1 contracts and an approved sample Prompt Package.
- **Change:** local compiler, import parser/normalizer, immutable revisions, issue-scoped repair packets, Research UI stage.
- **Forbidden:** browser automation, remote fetch, executing pasted content, silent evidence fabrication, paid/provider calls.
- **DoD:** valid fenced/prose-wrapped JSON imports; duplicates are idempotent; malformed/missing evidence becomes actionable issues; repair changes only approved issue paths.
- **Tests:** parser corpus, size/security boundaries, duplicate import, partial repair provenance, stale/conflicting evidence.
- **Owner approval:** sample prompt wording, input size limit, allowed normalization rules.
- **Cross Review:** required for untrusted-input and prompt-injection boundaries.

### Slice 3 — Editorial intelligence and evidence gates

- **Goal:** convert imports into ranked topics and a source-bound detailed Script Package.
- **Input:** imported Trend Brief/Evidence Pack and selected editorial lanes.
- **Change:** deterministic evaluations, all editorial quality gates, topic comparison UI, script finalization gate.
- **Forbidden:** choosing a topic automatically, stock predictions, direct public claims without evidence, paid media generation.
- **DoD:** every factual/numeric claim is source-linked; stale/generic/unsafe topics block; Owner angle and script approval are durable.
- **Tests:** fresh/stale, authoritative/conflicting source, orphan claim, financial-safety, genericity, retention fixtures.
- **Owner approval:** gate thresholds, initial content lanes, script duration range and editorial voice.
- **Cross Review:** required for source accuracy, financial safety, and editorial policy.

### Slice 4 — Scene Cards and evidence-first Visual Asset Plan

- **Goal:** translate an approved script into source-linked scenes and low-cost visual proof.
- **Input:** approved Script Package and Evidence Pack.
- **Change:** Scene Card/Visual Asset Plan generation, modality selection, rights ledger, cost estimates, scene invalidation model, UI plan review.
- **Forbidden:** real image/video/TTS generation, provider calls, asset download, final render.
- **DoD:** every scene has visual proof, claims/sources, rights status, captions, timing, and fallback; deterministic modalities win by priority.
- **Tests:** visual-proof orphan, modality priority, rights block, cost aggregation, partial invalidation.
- **Owner approval:** modality policy, cost presentation, first representative scene plans.
- **Cross Review:** recommended for rights and visual-truthfulness.

### Slice 5 — Original character identity and vector motion prototype

- **Goal:** approve one original reusable brand character and integrate deterministic motion planning.
- **Input:** three concepts in Section 11 and accepted visual tokens.
- **Change:** identity board, vector rig, motion primitives, continuity contract, 3–5 offline sample scenes.
- **Forbidden:** copying reference characters/styles, training on unlicensed assets, paid AI generation, replacing V1 cast.
- **DoD:** using the same Scene Card, chart/source evidence, timing, safe zones, and reduced-motion condition, produce short local motion samples for Loop, Pin, and Moa; complete rights/similarity/accessibility comparison; Owner selects one direction; only then create the approved identity/version and hash-locked assets. Final name/design is not fixed before this gate.
- **Tests:** SVG/render integrity, safe zones, identity hashes, motion timing, representative background contrast.
- **Owner approval:** final concept/name/palette/voice role and identity board.
- **Cross Review:** required for originality/rights and brand consistency.

### Slice 6 — V2 media integration, preview, and scene-level re-render

- **Goal:** connect V2 plans to existing TTS, captions, approved asset adapters, ffmpeg, a low-resolution review preview, and a separately hash-verified high-resolution final.
- **Input:** approved scene/asset plans and character version.
- **Change:** adapters to existing TTS/caption/image/Flow/render paths, worker lifecycle if necessary, low-cost preview, partial re-render, final hash report.
- **Forbidden:** automatic paid execution, public upload, V1 contract break, unapproved dependency/env changes.
- **DoD:** one fixture project reaches exact local preview; unchanged scenes/caches are reused; changed scene invalidation is correct; all paid actions remain gated.
- **Tests:** local no-write smoke, cache reuse, one-scene re-render, interrupted job recovery, ffprobe/media checks, V1 regression/build.
- **Owner approval:** each paid provider run separately; any worker/dependency/env change separately.
- **Cross Review:** required before any paid sample run and after integration.

### Slice 7 — Publish Package, account hard stop, and recovery adapter

- **Goal:** connect V2 final output to the statically wired V1 publisher through a safer immutable package after its V2 adapter gates are validated.
- **Input:** exact final hashes, metadata, rights report, expected accounts, publish approval contract.
- **Change:** Publish Package builder, universal identity check, ledger adapter, attempt journal, partial recovery UI; cover support may be separated if large.
- **Forbidden:** real upload, schedule activation, account/token mutation, ledger backfill, automatic retry.
- **DoD:** dry-run proves mismatched account/duplicate/hash/source/rights failures; success plan is platform-idempotent; timeout enters evidence-pending.
- **Tests:** mocked platform boundaries, duplicate/mismatch, partial success, timeout/read-before-retry, V1 ledger regression.
- **Owner approval:** OAuth/account work separately; private/unlisted smoke separately; public upload always separate exact approval.
- **Cross Review:** mandatory due external mutation and account risk.

### Slice 8 — Owner-accepted pilot and operational cutover decision

- **Goal:** produce one representative V2 pilot through local final render, then optionally a separately approved limited platform smoke.
- **Input:** completed Slices 1–7, accepted quality gates/character, approved topic/evidence.
- **Change:** one representative sample video, operator runbook, rollback drill evidence, measured time/cost/repair log, V1/V2 comparison, and a separate channel-rebranding decision packet.
- **Forbidden:** unattended queue, recurring schedule, mass generation, public posting without exact approval, V1 deletion/cutover by implication.
- **DoD:** local pilot passes all gates; recovery drill passes; Owner signs off or records revisions. External smoke/public post is a distinct sub-slice and approval.
- **Tests:** end-to-end local dry run, final media QA, restart recovery, duplicate gate, rollback to V1.
- **Owner approval:** topic, every paid action, external smoke visibility/account, public post, and any V1 cutover independently.
- **Cross Review:** mandatory release/acceptance review.

## 16. Owner decisions required before Slice 1

1. Review this Cross Review findings correction and decide whether to authorize a targeted Claude Code read-only re-review. Do not re-run it automatically.
2. Only after a targeted Cross Review PASS, approve or revise the exact Slice 1 file/behavior allowlist in Section 15; it is currently only proposed and blocked.
3. Confirm that Slice 1 defines a configurable V2 storage interface only, with no new V2 authoritative persistence and no V2 `C:\tmp` default; existing V1 authoritative `C:\tmp\money-shorts-os` data remains untouched.
4. Confirm `/editorial-v2` as the proposed inert experimental route and `/money-shorts` as protected V1.
5. Confirm that the external search-LLM copy/paste workflow is the V2 default and direct research APIs remain out of scope.
6. Decide how the pre-existing `modified 21 / untracked 3` baseline will be protected before implementation. Slice 0 does not authorize a commit.

The character choice, paid provider execution, OAuth/account changes, cover upload, scheduling, DB, deployment, public post, and V1 cutover are intentionally deferred to their named slices.

## 17. Risks, mitigations, and Slice 0 acceptance

### 17.1 Principal risks

| Risk | Mitigation |
| --- | --- |
| Dirty working tree obscures baseline | No edits to existing dirty/protected files; Owner resolves checkpoint strategy before Slice 1. |
| Two parallel architectures continue diverging | V2 contracts explicitly bridge source-first artifacts to the statically wired V1 media/publish spine and require adapter validation. |
| Search-LLM answer invents or stales evidence | Immutable raw import, source/date/claim gates, no fabricated repair, Owner choice. |
| Pasted prompt injection or executable payload | Treat as data; size/schema allowlist; never execute instructions/HTML/paths. |
| Current visual generation remains image-heavy/costly | Deterministic modality priority, vector character, per-scene cost/approval, selective re-render. |
| Character resembles a known money mascot | Original abstract identity, rights review, identity board, no reference copying. |
| Browser-driven providers change UI | Optional adapter, explicit state/evidence, no retry, deterministic fallback. |
| Local JSON is corrupted or lost | Immutable artifacts, atomic writes, hashes, recovery index, backups/runbook; DB deferred consciously. |
| Account mismatch or duplicate public post | Universal identity preflight, package hash, ledger/idempotency, evidence-before-retry. |
| Inactive n8n/legacy route implies false automation readiness | Retain as inactive/fail-closed legacy boundary; no scheduler authority, activation, or deletion until a separate approved slice. |
| YouTube default public visibility raises release risk | Proposal: approved private/unlisted smoke first; public always exact separate approval. |
| Old docs overstate capabilities | This document records current classifications; V1 docs remain historical and are not silently rewritten. |

### 17.2 Slice 0 revision acceptance checklist

- [x] Repository, branch, HEAD, package manager, development route, and path-level dirty-state separation recorded; missing start hashes marked `NOT_RECONSTRUCTABLE`.
- [x] Required capabilities have individual Evidence Matrix rows with caller/callee, reachability, evidence level, normalized status, limitation, decision, and V2 adapter need.
- [x] Current facts separated from proposed V2 modules, routes, storage, and behavior.
- [x] Canonical pipeline, state machine, approval boundaries, and required contracts defined.
- [x] Copy/paste parser, normalization, repair, error, duplicate, partial-repair, prompt-injection, URL/SSRF, size/depth, provenance, and approval boundaries defined as future contracts.
- [x] Eleven quality gates defined, including finance safety, rights, brand, and publish readiness.
- [x] Content boundary, three original character directions, same-Scene comparison gate, originality prohibitions, visual priority, and partial re-render target defined.
- [x] Owner UX, easy launch, configurable storage/rollback, recovery, auth/upload/cover/metadata/schedule audit defined without adopting `C:\tmp` as the new V2 default, while recording current V1 `C:\tmp\money-shorts-os` state as authoritative and protected.
- [x] V1 protection, feature/version flag, data split, and rollback defined.
- [x] Implementation Slices 0–8 are present `9/9`; Slice 1 allowlist and forbidden list are explicit and remain proposed/blocked.
- [x] Editorial quality gates are present `11/11`.
- [x] Owner requirement Traceability Matrix records every supplied item or an explicit `GAP` with a resolution Slice.
- [x] No product implementation, dependency, DB, env, external call, paid action, publication, deploy, commit, or push performed.

## 18. Owner Requirement Traceability Matrix

Every row below is a blueprint target, not a claim of current implementation. `GAP → Slice N` means the repository does not yet satisfy the requirement and the named Slice is the proposed resolution boundary.

| Owner requirement | Blueprint section | Artifact or contract | Implementation Slice | Validation / test | Approval gate |
| --- | --- | --- | --- | --- | --- |
| 24-hour, 7-day, and 30-day research ranges | 8.1, 9, 10 Freshness | `PromptPackage.researchWindowPreset` + explicit dates | GAP → Slice 2–3 | boundary/timezone/fresh-vs-context fixtures | Owner approves window semantics and cutoff |
| Select field, audience, and video length | 8.1, 12.1 | `field`, `audience`, `targetDurationSec` | GAP → Slice 1–2 | enum/range and UI-state fixtures | Owner approves fields/audiences/duration bounds |
| Export prompt for an external search LLM | 8.1, 9.1 | provider-independent `PromptPackage.promptText` | GAP → Slice 2 | deterministic snapshot; no network call | Owner approves prompt wording/version |
| Provider-independent exchange structure | 8.1, 9.0 | versioned Prompt/Import/Evidence schemas; provider/model are labels | GAP → Slice 1–2 | provider-label-agnostic fixtures | Owner approves schema |
| Immutable raw-response preservation | 8.1, 9.0–9.1 | append-only `ImportedLLMResponse.rawText/rawSha256` | GAP → Slice 2 | mutation/append-only/hash tests | Owner approves retention policy |
| Normalize mixed JSON/Markdown/explanation | 9.0–9.4 | deterministic candidate parser/normalizer | GAP → Slice 2 | mixed corpus; ambiguous-root rejection | Owner approves safe normalization list |
| Import preview | 9.1, 12.1 | non-canonical import preview | GAP → Slice 2 | UI fixture; no-write assertion | Owner accepts normalized revision |
| Raw/normalized comparison | 8.1, 9.0–9.1 | separate raw/normalized hashes and diff view | GAP → Slice 2 | hash/diff/provenance fixtures | Owner accepts field changes |
| Validation summary | 8.3, 9.1 | `ValidationReport` with issue IDs/paths | GAP → Slice 1–2 | deterministic issue snapshots | Owner reviews blockers |
| Missing-field supplement prompt | 9.1, 9.4 | targeted repair PromptPackage | GAP → Slice 2 | missing-field fixture; no invention | Owner copies/sends externally |
| Field-level repair | 9.0, 9.4 | issue-scoped merge with approved JSON paths | GAP → Slice 2 | overwrite-block and provenance tests | Owner reopens/accepts exact fields |
| Duplicate-import idempotency | 9.4 | `promptId + rawSha256` key | GAP → Slice 2 | same-paste/different-project tests | automatic return of existing import; no canonical approval |
| No finalization before user approval | 7.2, 9.0–9.1 | Owner decision on every canonical revision | GAP → Slice 1–3 | illegal-transition validator | explicit Owner approval |
| Full Trend Brief→Publish Package artifact flow | 7.1–7.2, 8 | versioned artifact chain | GAP → Slices 1–7 | transition and input-hash graph fixtures | per-artifact gates plus separate publish approval |
| All 11 quality gates | 10 | closed `QualityGate` union `11/11` | GAP → Slice 3–4, 7 | one pass/fail fixture per gate | Owner approves thresholds/policy |
| 7–10 Scene Cards | 7.1, 8.3 | SceneCard count invariant | GAP → Slice 4 | 6/7/10/11 boundary fixtures | Owner approves script/scene plan |
| Claim-to-source linkage | 8.1–8.3, 10 | `claimIds` + `evidenceIds` on beats/scenes/facts | GAP → Slice 3–4 | orphan claim/source tests | Evidence and Script approval |
| Block Evidence Pack/Script conflicts | 9.4, 10 | conflict issues with blocking severity | GAP → Slice 3 | conflicting figure/date fixtures | Owner selects source-backed repair |
| Invalidate downstream approvals on upstream change | 7.1, 9.0, 11.4 | dependency hashes/invalidation graph | GAP → Slices 1, 4, 6 | hash-change transition tests | reapproval of affected artifacts |
| Visual proof | 8.3, 10 Visual Proof | `SceneCard.visualProof` + required on-screen facts | GAP → Slice 4 | visual-proof orphan fixtures | Owner approves scene plan |
| Chart/comparison/official-source-card/map/timeline priority | 8.3, 11.3 | ordered `VisualAssetPlan.modality` policy | GAP → Slice 4 | modality-priority fixtures | Owner approves modality policy |
| Scene disable | 11.3 | revised scene plan with coherence revalidation | GAP → Slice 4 | disable/coherence/downstream invalidation test | Owner approves revised plan |
| Scene-only rerender | 11.4 | content-addressed scene artifact + final remux | GAP → Slice 6 | one-scene change/cache reuse test | Owner approves affected render; paid action separate |
| Direct image upload | 11.3 | replacement-image artifact with hash/rights metadata | GAP → Slice 4/6 | file/MIME/dimension/hash/rights fixture | Owner supplies and approves asset |
| Character-motion replacement | 8.3, 11.3 | revised `CharacterMotionPlan` | GAP → Slice 4/5 | continuity/safe-zone test | Owner approves replacement |
| Paid-generation cost approval | 8.3, 11.4, Slice 6 | estimated cost + provider/scene/prompt hash + approval ID | GAP → Slice 4/6 | missing/mismatched approval hard-stop | separate exact approval per paid action |
| Low-resolution preview | 3 Evidence Matrix, Slice 6 | distinct low-cost `PreviewArtifact` | GAP → Slice 6 | dimensions/bitrate/hash/watermark test | Owner preview approval |
| High-resolution final render | 8.3, Slice 6 | `RenderPlan`/FinalArtifact 1080×1920 target | GAP → Slice 6 | ffprobe/media/hash checks | Owner final-render approval |
| Wrong-account hard stop | 13.2–13.3, Slice 7 | expected vs observed platform identity | GAP → Slice 7 | mismatch/missing/read-error mocks | Owner approves expected IDs and external smoke |
| Duplicate-publishing prevention | 13.1–13.3 | platform/profile/content/visibility idempotency keys | GAP → Slice 7 | duplicate/concurrency/read-failure tests | Owner publish approval never bypasses duplicate gate |
| Publication ledger | 13.1–13.3 | immutable attempts + durable platform-granular read model | GAP → Slice 7 | corruption/atomicity/partial-outcome tests | Owner approves adapter; no backfill by implication |
| Failed-platform-only retry | 13.3 | evidence-pending/failed-platform recovery contract | GAP → Slice 7 | IG-only/YT-only/timeout/read-before-retry tests | exact recovery approval; no blind retry |
| Single launcher | 12.2 | one supported `pnpm` entry contract | GAP → Slice 6 only if worker required | launcher dry-run/process-exit test | Owner approves launcher/worker change |
| Browser auto-open | 12.2; Evidence Matrix | ready-once browser open | current working-tree static path; EXTEND in Slice 6 | readiness/open-once/Edge-missing test | Owner approves any launcher edit |
| Server and worker lifecycle | 12.2 | supervised children and prefixed logs | server static; worker GAP → Slice 6 if needed | start/port/conflict/child-exit tests | Owner approves worker need and file allowlist |
| Environment diagnostics | 12.2 | dependency and key-presence-only diagnostics | GAP → Slice 6 | present/missing/blank test with no values logged | env values remain out of scope; changes need separate approval |
| Graceful shutdown | 12.2 | Ctrl+C child shutdown | server static; multi-child GAP → Slice 6 | SIGINT/SIGTERM/orphan test | Owner approves launcher edit |
| Autosave and resume | 12.3–12.4 | atomic project pointers + verified-artifact resume | GAP → post-Slice-1 storage implementation / Slice 6 | crash/corruption/LKG/interrupted action tests | exact storage implementation approval |
| V2 default OFF | 14.2, Slice 1 | server-controlled default-OFF flag | GAP → Slice 1 | absent/false/direct-route hard-stop tests | exact Slice 1 approval after Cross Review PASS |
| V1/V2 data separation | 12.3, 14.3 | current authoritative `C:\tmp\money-shorts-os` V1 roots + separate configurable V2 root/namespaces/schema version | GAP → Slice 1 contracts; implementation later | protected-path inventory; V1 write/move/delete/cleanup/path-rewrite `0`; middleware/layout/config/package and existing-route diff `0`; namespace/path-traversal tests | Owner approves interface then implementation separately; V1 storage migration is a different Slice |
| Existing V1 project compatibility | 14.1–14.3 | missing version means V1; compatibility adapter | GAP → Slice 1 contract/test | existing fixture opens with flag OFF | no silent upgrade; Owner approves any adapter edit |
| Rollback | 12.3–12.4, 14.4 | flag-off, LKG, migration backup/rollback, original retention; existing V1 C:\tmp roots remain untouched | GAP → implementation slices | corrupt V2 and V1-open tests; verify existing V1 root hashes/paths unchanged; any future V1 move requires separate inventory, backup, migration, and rollback rehearsal | migration/cutover/V1-location change separately approved |
| Three-direction character comparison | 11.2, Slice 5 | Loop/Pin/Moa comparison matrix | GAP → Slice 5 | same-input comparison + rights/accessibility review | Owner selects one direction |
| Short motion-sample comparison | 11.2, Slice 5 DoD | same-Scene-Card three-sample packet | GAP → Slice 5 | timing/safe-zone/reduced-motion/occupancy QA | Owner selects sample; no final name beforehand |
| Rights and originality review | 10 Rights, 11.1–11.3 | provenance/similarity/asset-rights ledger | GAP → Slices 4–5, 8 | source/license/similarity/disclosure checklist | Owner + required read-only Cross Review |
| Slice 8 sample video and channel rebranding | Slice 8 | representative sample video + separate rebranding packet | GAP → Slice 8 | local E2E/media QA/rollback plus branding checklist | paid/external/public/rebranding decisions remain separate |

Traceability result: all supplied requirements are represented. Every product behavior is still a `GAP` unless the Evidence Matrix explicitly identifies a current V1 static path; no V2 implementation is claimed.

## 19. Remaining UNVERIFIED / GAP / BLOCKED

- `UNVERIFIED`: no current product runtime, browser, render, build, paid-provider, OAuth, identity, or publication operation was executed for Slice 0. Historical PASS/publication evidence was not promoted to current runtime verification.
- `GAP`: V2 contracts, parser/normalizer, URL verifier, feature flag, route, storage implementation, 7–10 Scene Cards, character samples, low-resolution preview, scene-only video rerender, universal account hard stop, V2 ledger/recovery, and scheduler do not exist as approved V2 product capabilities.
- `BLOCKED`: the completed read-only Cross Review result is `NEEDS_FIX` (`P0 0 / P1 5 / P2 4`) and PASS is `NOT_ACHIEVED`. Findings correction is complete, but targeted re-review has not been authorized or started. Slice 1 remains blocked and product implementation cannot continue automatically.
- `BLOCKED`: exact restoration of the initial dirty baseline is impossible because start-time path hashes/snapshots were not preserved (`NOT_RECONSTRUCTABLE`). Existing dirty files must not be normalized or cleaned as part of this work.
- Official overall project progress: `NOT_CALCULATED`. Any prior `11%` obtained by dividing Slice counts is non-authoritative and must not be used as delivery progress.

## Final state

`SHORTS_EDITORIAL_OS_V2_SLICE_0_CROSS_REVIEW_FINDINGS_CORRECTION_COMPLETE_AWAITING_TARGETED_REVIEW`
