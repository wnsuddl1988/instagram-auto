# Shorts Editorial OS V2 — PA-5B1 Owner Design Packet

**Status:** `REVISED_PROPOSAL_ONLY_AWAITING_OWNER_APPROVAL`
**Scope:** Voice and visual-design realignment only. This packet does not generate an image, call ElevenLabs, alter canonical project data, or replace the current PA-5B technical candidate.

## What this revision corrects

The earlier PA-5B1 packet incorrectly made reconstructed source cards, diagrams, and Moa the dominant visual in nearly every scene. That would reproduce the current generic-card failure.

The approved legacy design is a **card-image hybrid explainer**:

1. Source facts, topic, and narration produce one scene-specific Visual Director Prompt.
2. The existing ChatGPT + Playwright image route creates a high-quality, original 9:16 editorial image for that prompt.
3. Image quality is reviewed and an eight-image selected set is frozen.
4. The renderer uses that image for context, emotion, depth, crop/parallax, and scene change.
5. Exact text, numbers, charts, citations, captions, and checklists are deterministic overlays—not text fabricated inside an AI image.

This is neither an SVG-only video nor an image-first slideshow. A card, number, or comparison changes the meaning of each beat; the image supplies the real scene and editorial texture.

## Preservation and non-execution boundary

- Current PA-5B audio: `PRESERVED_NOT_OVERWRITTEN`
- Current PA-5B video: `PRESERVED_AS_TECHNICAL_PROOF_ONLY`
- ElevenLabs generation: `0`
- ChatGPT/Playwright image generation: `0`
- Other external image/video/stock/provider calls: `0`
- Canonical narration overwrite: `0`
- Production/public readiness: `false / false`

The existing `realSceneImagesCreate` route is the intended future generation route. Its availability does not authorize this packet to issue requests. A future generation approval must still bind the eight prompts, selected scenes, request cap, and no-fallback rule.

## Voice authority and smallest adapter correction plan

| Item | PA-5B1 target |
| --- | --- |
| Voice | 준호 / Yohan Koo |
| Preset | `korean_confident_director_v2` |
| Stability | `0.68` |
| Similarity | `0.90` |
| Style | `0.22` |
| Speaker boost | `ON` |

The older `junho_cashflow` cast record remains `0.48 / 0.86 / style 0`. The values above are the new PA-5B1 target, not a false claim that the old record already uses them. If this packet is accepted, the PA-5B timestamp-TTS adapter must add a typed, fixed `voice_settings` payload; those values must participate in the voice-plan hash so flat-reading cached audio cannot be reused. No TTS regeneration is authorized by this packet.

## Global visual contract

### Image route and quality

- **Provider route:** existing ChatGPT + Playwright scene-image flow, after separate Owner approval.
- **One image intent per scene:** a scene-specific visual, not one generic finance background reused eight times.
- **Style:** premium Korean editorial finance explainer; cinematic, realistic, high-detail, vertical 9:16; tactile lighting and depth.
- **Never generate inside the image:** readable Korean text, exact numbers, charts, logos, official webpage screenshots, watermarks, or a generic smiling office worker.
- **Never substitute:** a plain colour background, placeholder, stock-like local fallback, or the current dark HTML card template.
- **Image quality gate:** selected image set required; image with generic/stock-like appearance, unreadable anatomy, irrelevant finance symbolism, or failed scene intent is regenerated or the scene is held—not silently replaced.

### Layer hierarchy

1. **Context image:** GPT-generated real scene, always different by scene purpose.
2. **Meaning card:** hook, comparison, number, checklist, or warning that changes by beat; not a repeated template.
3. **Fact overlay:** chart or exact number only where the canonical evidence supports it.
4. **Source strip:** small organization/title/date identity, never a fake official screenshot.
5. **Timed subtitles and key caption:** renderer text, matched to the actual voice.
6. **Moa:** optional guide only where it makes a relationship or check location clearer; maximum 10–12% of safe frame and never over data, a source, or a face.

An image may establish a scene, but may not remain an unchanged full-screen hero for more than about three seconds. A meaningful card/image/overlay transition must occur within each beat.

## Scene packet

### Scene 01 — “연체 아님”과 “잔액 없음”은 다르다

- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:01`
- **PURPOSE:** Stop the false relief that no delinquency means no remaining balance.
- **PROPOSED_NARRATION (75 chars):** 카드값 일부만 냈는데 연체가 아니라고요? 그럼 끝난 걸까요. 아닙니다. 남은 금액은 다음 달로 넘어갈 수 있으니, 이월잔액부터 보세요.
- **PRIMARY_IMAGE_INTENT:** Evening kitchen-table close-up: a Korean adult’s hand has put down a credit card beside a partially folded statement envelope; the subject looks at the next-month calendar edge. Financial pressure is visible through composition, not text.
- **IMAGE_MUST_AVOID:** readable statement/card text, bank logos, dramatic debt collectors, generic office pose.
- **MEANING_CARD:** Large hook card: `연체 아님` is crossed away from `잔액 없음`; no claim beyond the narration.
- **FACT/SOURCE:** Small 금융위원회 strip, `할부 결제와 달라요! 리볼빙 서비스 이용 주의` (2024-08-27). No numeric chart.
- **MOTION:** Image focus pulls from card to calendar edge → hook card lands → thin carry-forward line enters → subtitle answer → hard cut.
- **MOA:** Absent. It adds no explanatory value in the hook.
- **ACCEPTANCE:** The viewer can state the correction within two seconds; no generic card-only frame remains.

### Scene 02 — 일부 결제가 다음 달로 넘어가는 구조

- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:02`
- **PURPOSE:** Explain the formal mechanism in plain language.
- **PROPOSED_NARRATION (61 chars):** 리볼빙, 정식 이름은 일부결제금액이월약정입니다. 이번 달 일부만 내면, 남은 금액은 다음 달 결제로 넘어가죠.
- **PRIMARY_IMAGE_INTENT:** Editorial top-down desk scene with a card, an unbranded payment receipt, and two blank calendar pages overlapping from this month into next month; warm directional light makes the handoff tangible.
- **IMAGE_MUST_AVOID:** fake invoice figures, visible company branding, artificial infographic text.
- **MEANING_CARD:** The formal name is a central label card once, followed by a clean two-month “this month → next month” transit overlay.
- **FACT/SOURCE:** Compact source strip using the 2024 금융위원회 document. The timeline is renderer-drawn, with no made-up amount.
- **MOTION:** Top-down image parallax → formal-name card → payment token travels to next-month lane → contrast wipe.
- **MOA:** One brief side pointer at the token handoff only; otherwise absent.
- **ACCEPTANCE:** The term and its mechanism are each readable without turning into a legal-document screen.

### Scene 03 — 연체 회피와 수수료는 동시에 존재한다

- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:03`
- **PURPOSE:** Correct “late payment avoided = cost gone.”
- **PROPOSED_NARRATION (79 chars):** 연체를 피하는 데는 도움이 될 수 있습니다. 하지만 이월된 잔액에는 수수료가 붙어요. 빚이 사라진 게 아니라, 결제 시점이 뒤로 밀린 겁니다.
- **PRIMARY_IMAGE_INTENT:** A realistic editorial scene of a Korean wallet and payment card on a dark desk with two overlapping transparent calendar shadows, suggesting time shifted rather than erased; no person smiling or posing.
- **IMAGE_MUST_AVOID:** debt panic imagery, numbers, fake charts, visible bill text.
- **MEANING_CARD:** Split comparison card: `연체 회피 가능` versus `이월잔액 + 수수료`; the final correction appears as a single converging statement.
- **FACT/SOURCE:** Small evidence strip for 금융위원회 `신용카드 결제성 리볼빙 서비스 개선방안` (2022-08-24). Category comparison only—no invented percentage or axis.
- **MOTION:** Calendar shadows shift → left/right comparison opens → fee node attaches → both routes converge → data snap.
- **MOA:** Brief connector gesture beside the comparison, never centered.
- **ACCEPTANCE:** The visual makes “time moved, debt not erased” clearer than the narration alone.

### Scene 04 — 공식 100 / 20 / 80 예시

- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:04`
- **PURPOSE:** Make the canonical example undeniable.
- **PROPOSED_NARRATION (93 chars):** 공식 예시로 볼게요. 카드값 100만 원에 결제비율이 20%면, 이번 달엔 20만 원을 내고 80만 원은 이월됩니다. 다음 달 새 사용액과 수수료까지 겹칠 수 있어요.
- **PRIMARY_IMAGE_INTENT:** Realistic vertical editorial still life: a card-payment scene with a blank, unbranded statement and a hand separating two coloured paper layers; depth and physical split, but absolutely no readable figures.
- **IMAGE_MUST_AVOID:** numbers inside the image, fake payment app screen, brand logo, stock-photo office worker.
- **MEANING_CARD:** Central number card with a renderer-drawn decomposition: `100만 원 → 20만 원 납부 + 80만 원 이월`.
- **FACT/SOURCE:** Narrow 금융위원회 2024 source strip. The 20% marker, 20만, and 80만 are deterministic chart values; potential next-month new spending/fee are labels only, not invented amounts.
- **MOTION:** Physical-layer image parallax → 100만 card arrives → 20% trigger → precise 20/80 split → next-month layer enters → line-trace close.
- **MOA:** Brief lower-corner trace following the split; removed if it harms numeral readability.
- **ACCEPTANCE:** Every numeric statement comes from the canonical source; the image supplies depth while the chart supplies proof.

### Scene 05 — 할부의 끝과 리볼빙의 반복

- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:05`
- **PURPOSE:** Contrast fixed repayment end with possible repeated carryover.
- **PROPOSED_NARRATION (68 chars):** 할부는 갚는 기간이 정해져 있죠. 반면 리볼빙은 이월이 반복될 수 있습니다. 그래서 언제 잔액이 끝나는지 흐려지기 쉬워요.
- **PRIMARY_IMAGE_INTENT:** Two tactile desk planners side by side: one line of orderly completed check marks on the left, one set of repeated sticky-note folds continuing out of frame on the right. No text is readable.
- **IMAGE_MUST_AVOID:** fabricated month counts, percentage, text, duplicated props that look synthetic.
- **MEANING_CARD:** A compact dual timeline card: `기간 고정` / `반복 가능`; its end marker is visual, not a fabricated duration.
- **FACT/SOURCE:** Small 2024 금융위원회 source strip. No source-card panel.
- **MOTION:** Left planner closes at a clear end point → right planner extends once more → comparison card locks the contrast → soft push.
- **MOA:** Absent; the two visual routes are already legible.
- **ACCEPTANCE:** This cannot read as a generic “good versus bad” card; the physical scene and the deterministic timeline must agree.

### Scene 06 — 내 수수료율은 직접 확인한다

- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:06`
- **PURPOSE:** Give a safe verification action without inventing a universal rate.
- **PROPOSED_NARRATION (56 chars):** 수수료율은 모두 같지 않습니다. 내 비율은 카드 대금명세서나 카드사 홈페이지에서 직접 확인해 보세요.
- **PRIMARY_IMAGE_INTENT:** Close editorial image of a hand reviewing an intentionally blurred, unbranded paper statement beside a laptop with an abstract non-readable page; a desk lamp creates a focused inspection mood.
- **IMAGE_MUST_AVOID:** real bank interface imitation, readable rate, logo, fake official website, exact number.
- **MEANING_CARD:** Two-step verification card: `카드 대금명세서` then `카드사 홈페이지`.
- **FACT/SOURCE:** Slim 금융위원회 consumer-guidance strip. No rate chart.
- **MOTION:** Focus shifts statement → laptop → the two verification cards enter in sequence → correction flip.
- **MOA:** One small magnifier/inspection guide on the statement field; no persistent character.
- **ACCEPTANCE:** The viewer knows where to verify, while the video never implies a representative rate.

### Scene 07 — 잔액을 줄이는 보수적 순서

- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:07`
- **PURPOSE:** Turn risk into a non-promissory action order.
- **PROPOSED_NARRATION (77 chars):** 이미 리볼빙을 쓰고 있다면, 새 결제부터 줄여 보세요. 가능한 범위에서 결제비율을 높이고, 이월잔액을 줄이는 계획을 세우는 게 먼저입니다.
- **PRIMARY_IMAGE_INTENT:** A calm Korean home desk scene: a hand places a payment card back into a wallet while an unbranded notebook has three blank tabs; the visual is deliberate and practical, not a miracle-payoff fantasy.
- **IMAGE_MUST_AVOID:** cash stacks, before/after wealth claims, readable financial entries, green-up profit visuals.
- **MEANING_CARD:** Three descending action cards: `새 결제 줄이기` → `결제비율 검토` → `이월잔액 줄이기`.
- **FACT/SOURCE:** Compact 금융위원회 action-guidance strip; no claim of payoff speed or exact saving.
- **MOTION:** Card returns to wallet → action cards enter one by one → a modest neutral downward balance marker appears → checklist lock.
- **MOA:** Optional single pointer on the third action only.
- **ACCEPTANCE:** Advice remains conditional and practical, with no financial-outcome promise.

### Scene 08 — 오늘 확인할 세 항목

- **SCENE_ID:** `selected-angle:revolving-balance-not-erased:scene:08`
- **PURPOSE:** End with a usable statement check and safe help route.
- **PROPOSED_NARRATION (80 chars):** 오늘 명세서에서 세 가지만 확인하세요. 일부결제금액이월약정, 이월잔액, 적용 수수료율입니다. 헷갈리면 카드사에 상환이나 해지 방법을 물어보세요.
- **PRIMARY_IMAGE_INTENT:** Morning desk by a window: an unbranded sealed statement envelope has been opened beside a pen and card; the composition feels like an immediate, real household task.
- **IMAGE_MUST_AVOID:** readable document fields, brand marks, specific rates, customer-service screenshots.
- **MEANING_CARD:** Central three-item check card: `일부결제금액이월약정` / `이월잔액` / `적용 수수료율`, followed by a smaller “카드사에 상환·해지 방법 문의” help card.
- **FACT/SOURCE:** Small 2024 금융위원회 source strip, only at the opening or close.
- **MOTION:** Envelope image reveals → three-item card steps in → final help card gets focus → signal fade.
- **MOA:** Absent; the closing checklist needs an uncluttered safe frame.
- **ACCEPTANCE:** The end frame gives a concrete next action and does not resemble a generic legal notice.

## Required implementation gates after Owner approval

1. Build the eight Visual Director Prompts from this packet and canonical claim/source IDs. Static only; no image call.
2. Review prompt pack for factual-image separation, distinct scene intent, no readable in-image text, and no generic-stock composition.
3. Receive a separate Owner approval for the bounded ChatGPT + Playwright image-generation run.
4. Generate and quality-select one image per scene. Failed quality may trigger only the pre-approved scene-specific recovery rule; never a local fallback.
5. Only then design the renderer input around the selected image-set hash, voice-plan hash, captions, source strips, and deterministic cards/charts.

## Owner decision gate

No canonical narration, visual plan, TTS, image generation, or final renderer has been executed from this packet.

> 이 8개 Scene의 수정 대본·준호 음성 설정·ChatGPT 이미지 기반 card-image hybrid 화면 설계를 새 제작 기준으로 승인하시겠습니까?
