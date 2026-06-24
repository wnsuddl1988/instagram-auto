# Production Pipeline Reset V1

Status: **ACTIVE OVERRIDE**

Updated: 2026-06-25

## 1. Owner Decision

Owner decided to abandon the previous video production approaches and restart as **Money Shorts OS**.

The project itself remains alive. The old production routes are retired so they do not leak into future prompts, debugging, or planning.

Current active product direction:

- `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`
- `_ai/MONEY_SHORTS_OS_PRD_V1.md`
- `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`
- `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`

## 2. Keep

Reusable automation/infrastructure to keep:

- Script/planning workflow for new topics and scenes.
- GPT image automation, especially reusable ChatGPT image UI/core automation.
- Gemini/Veo automation capability for actual video clips.
- ElevenLabs voice/TTS automation and voice exploration assets.
- Local ffmpeg assembly, muxing, encoding, and contract verification patterns.
- QA automation patterns: source checks, ffprobe gates, contact sheets, preview HTML, manifest/result JSON.
- Git history and historical output evidence for audit only.

## 3. Retire / Do Not Continue

The following are retired and must not be used as future production routes, prompts, visual references, or debugging assumptions:

- Candidate10 / old Money Architect final candidate and all follow-up polishing.
- Static image slideshow as a final video format.
- `8 beat plates + key caption + narration` final-video route.
- Code-GFX scene generation route.
- Premium code-GFX render/fix loops.
- GPT visual plates route when it ends as static plates only.
- 3D character plate route when it ends as static images only.
- Faceless/object-only money visuals from the old Candidate10 loop.
- old Money Architect / money role / money defense pilot as the next topic.
- Lifestyle tips / 생활꿀팁 route.
- EP001 money defense roughcut route.
- Jun / 준 / office sitcom / automatic-door interview / ep003 / upload_002 / copier route.
- Any old `준/Jun/시트콤/복사기/upload_002/ep003/3d_sitcom` assets, references, prompts, or character continuity rules.

These may remain on disk or in git history as historical evidence, but they are **not active project direction**.

## 4. New Baseline Structure

Owner intends the next production structure to start from:

1. Data source selection.
2. Raw data or disclosure collection.
3. Key number extraction.
4. Previous period / previous release comparison.
5. Fact Card generation.
6. Source citation storage.
7. Video Blueprint.
8. Script/caption/chart/image/voice/video package.
9. Financial expression QA.
10. Optional Money-OS CTA only when relevant.

Owner has now provided the new structure details. Future work should follow:

- `_ai/MONEY_SHORTS_OS_PRODUCT_DIRECTION_V1.md`
- `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`
- `_ai/MONEY_SHORTS_OS_IMPLEMENTATION_ORDER_V1.md`

The next safe work unit is `money-shorts-os-source-fact-card-types-v1`: local source/fact-card TypeScript types/schema and mock generator without external API calls.

## 5. Guardrails

- Do not resurrect retired routes because a script, output file, or old handoff exists.
- Do not use old character names, old series assumptions, or old topic plans as defaults.
- Do not physically delete historical output/git evidence unless Owner explicitly asks for deletion.
- No upload/post/push/deploy/env/DB/dependency/lockfile changes without explicit Owner approval.
