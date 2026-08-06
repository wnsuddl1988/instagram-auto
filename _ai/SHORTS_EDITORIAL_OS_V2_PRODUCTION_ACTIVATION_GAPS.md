# Shorts Editorial OS V2 — Production Activation Gaps

Status: `PLANNING_ONLY`

This document records what remains after Slice 0–8. It does not authorize external work, production rendering, account changes, upload, publication, scheduling, persistence, deployment, or push.

## 1. 현재 구현된 기능

- Source-first import, intelligence, script, eight-scene planning, character-motion comparison, render integration planning, publish package planning, representative sample planning, and provisional relaunch readiness.
- Provider-independent contracts, deterministic package identities, structural validation, session invalidation, and local synthetic proof harnesses.
- Instagram Reels and YouTube Shorts destination plans remain metadata and identity-planning objects only.

## 2. Session-only 기능

- Import approval, Detailed Script approval, Scene Planning approval, Character Motion approval, Render Integration approval, Publish Integration approval, and Relaunch Readiness approval live only in browser memory.
- Refresh, unmount, upstream change, or reset invalidates downstream session state.
- Session objects are not durable operational records.

## 3. Synthetic proof만 완료된 기능

- Render and representative-sample proofs use deterministic synthetic frames, synthetic tone audio, and synthetic subtitles.
- Synthetic proofs verify local composition and stream shape, not factual quality, real asset quality, voice quality, account access, or publishability.
- A synthetic MP4 is not a user-content or public-ready production video.

## 4. 실제 외부 연결이 필요한 기능

- Official platform policy and current limit verification.
- Approved provider adapters for account identity, TTS or audio, assets, rendering, upload, publication status, cancellation, and scheduling.
- Every connection requires a separate exact scope and least-privilege review.

## 5. 실제 계정·OAuth 요구

- Stable Instagram and YouTube destination identities must be verified read-only before any write.
- OAuth scopes, token storage, rotation, revocation, account mismatch hard stops, and audit evidence are not implemented.
- Manual destination identity is planning evidence only.

## 6. 실제 TTS·audio 요구

- Voice identity, locale, provider, cost, consent, pronunciation, and reuse policy require Owner approval.
- Audio generation, listening approval, loudness, silence, clipping, and duration checks are not implemented for V2 production.
- Subtitle timing remains estimated until aligned to approved final audio.

## 7. 실제 visual asset 요구

- Current visual layers and relaunch profile/cover previews are plans or internal SVG drafts.
- Real charts, source cards, screenshots, generated visuals, stock footage, and direct uploads require source, rights, cost, and visual-QA gates.
- No current SVG draft is a final logo, profile image, banner, or cover asset.

## 8. Renderer production adapter 요구

- A production adapter must resolve logical URIs, render approved assets, preserve evidence priority, align audio/subtitles, verify scene fingerprints, and emit reproducible manifests.
- It must fail closed on missing assets, wrong profile, changed provenance, safe-area violations, and output-hash mismatch.
- Actual user-content production rendering is not implemented.

## 9. Durable persistence 요구

- Persistence architecture, schema, migration, retention, encryption, access control, backup, restore, and deletion policy require Control Tower and Owner approval.
- Browser session objects must not be treated as durable truth.
- No database, filesystem storage adapter, or migration is included in Slice 8.

## 10. Publication ledger 요구

- Durable idempotency keys and publication attempts must survive process and browser restarts.
- The ledger must preserve per-platform success, prevent duplicate retries, record external IDs without secrets, and support reconciliation.
- Slice 7 ledger and recovery are session-only dry-run planning.

## 11. Runtime browser QA 요구

- Responsive layout, keyboard navigation, screen-reader labels, long text, localization, reduced-motion behavior, state invalidation, and approval ergonomics require runtime QA.
- Account, upload, and publish controls must not appear enabled before their production gates exist.
- Browser/Playwright QA was not part of Slice 8 implementation.

## 12. 권리·비용·정책 확인

- Every final visual, audio, font, source screenshot, character export, and platform use must pass rights and originality review.
- Provider pricing and per-video budget require current evidence and Owner approval.
- Platform policy, AI disclosure, financial wording, reused-content rules, and removal obligations require current official verification.

## 13. V1/V2 cutover 조건

- V2 production parity must be demonstrated with an approved representative user-content sample, durable state, account isolation, private/unlisted smoke evidence, operational runbook, and Owner acceptance.
- V1 remains the operational path until an exact cutover approval is recorded.
- Slice 8 completion alone is not a cutover decision.

## 14. V1 rollback 조건

- Roll back to the last approved V1 path on V2 identity mismatch, duplicate risk, provenance loss, unsafe wording, rights failure, render regression, ledger inconsistency, or platform failure.
- Rollback must not overwrite publication evidence or conceal partial external success.
- Reset, destructive cleanup, and unreviewed data migration are not rollback methods.

## 15. Public launch 이전 필수 Owner approvals

- Final brand direction, channel display name, handles, character identity, palette, typography, voice, actual assets, rights, cost, accounts, OAuth scopes, private/unlisted smoke, publication packet, schedule, rollback, deploy, and push.
- Public launch approval must be explicit and distinct from generation or checkpoint approval.
- No automatic publication follows an approval in the current V2 base.

## 16. 권장 Production Activation 단계

1. Control Tower defines an exact, non-public activation scope and allowlist.
2. Verify official platform policy and read-only account identities.
3. Approve final provisional-to-final brand decisions without account writes.
4. Implement durable persistence and publication ledger under reviewed schema and migration gates.
5. Implement actual TTS/assets/renderer adapters with dry-run and cost/rights approvals.
6. Produce one approved user-content sample and complete runtime QA.
7. Run a private or unlisted publish smoke with exact Owner approval.
8. Review evidence, rollback readiness, and V1/V2 cutover separately before any public launch.

## 17. 현재 product operational capability

`product operational capability = NOT_CLAIMED`

Slice 8 may prepare a `Production Activation` scope request, but `publicLaunchReady=false` remains mandatory until the separate activation work, external verification, and Owner approvals are complete.
