# Money Shorts OS Product Direction V1

Status: **ACTIVE PRODUCT DIRECTION — FINAL DIRECTION ALIGNMENT V1.1**

Updated: 2026-06-27

## 0. Interpretation Rule

Use all Owner-provided direction as context, but when directions conflict, **the later Owner instruction wins**.

Current latest emphasis:

- Start as an internal daily shorts production tool, not a complete B2B SaaS.
- The product core is source-first life-economy shorts: economic signals translated into everyday money decisions.
- Money-OS is a CTA/conversion layer and action bridge, not the main content identity.
- The first deliverable is a high-quality shorts content package, not fully automated video generation.
- Brand direction: **경제번역소**.
- Content interpretation tone: **생활경제탐정**. This is an interpretation and staging grammar, not a literal detective character.
- Multimodal consistency is now a product requirement: script, caption, image prompt, voice, screen text, source note, and risk notes must derive from the same Scene Card.

## 0.1 Final Direction Alignment V1.1

Money Shorts OS는 단순 경제지표 설명기가 아니다.

경제 신호를 출처 기반으로 가져와, 사람들이 궁금해할 만한 후킹으로 열고, 현재 상황과 주요 원인 후보를 팩트 기반으로 설명하고, 전문가적 시선으로 지금 무엇을 봐야 하는지 해석한 뒤, 그 신호가 생활비·대출·소비·저축·투자 판단·환전·카드값·여행비·장바구니·고정비/변동비에 어떤 영향을 줄 수 있는지 연결하고, 마지막에는 개인이 지금 할 수 있는 점검 행동을 제시하는 **source-first 생활경제 쇼츠 제작 OS**다.

Confirmed pipeline:

`Fact Card`
→ `Signal Translation Brief`
→ `6 Scene Cards`
→ `script / caption / image prompt / voice / screen text`
→ `risk review / final QA / owner gate`

Layer responsibilities:

- **Fact Card**: facts, numbers, source, period, citation, `allowedClaims`, `blockedClaims`. It must not absorb excessive life interpretation or creative wording.
- **Signal Translation Brief**: translates an economic signal into everyday money-management meaning. It owns `keyReasons`, `expertInterpretation`, `affectedMoneyAreas`, `lifeImpact`, `volatilityWatch`, `scenarioBasedOutlook`, `recommendedActions`, `actionBoundaries`, and `viewerTakeaway`.
- **Scene Card**: the single scene-level source for narration, captions, image prompts, screen text, voice timing, source notes, layout safe zones, and risk notes.

MVP 6-scene format:

1. **Hook** — curiosity, large title, thumbnail/cover role, question/reversal/life-connection style.
2. **Signal** — source-backed economic signal, key value, period, source summary, numbers only from Fact Card.
3. **Why + Expert Interpretation** — key reason candidates, expert interpretation, no causal overclaim, what to watch now.
4. **Life Impact** — connect to living costs, loans, spending, savings, investment judgment, FX, card bills, travel costs, groceries, fixed/variable expenses.
5. **Watch / Scenario Outlook** — scenario-based outlook, not deterministic forecast; rising/falling/stable paths or observation points.
6. **Action + Closing Line** — practical checks a person can do now, no investment recommendation, final viewer takeaway.

Caption System V1 is fixed for 1080x1920 vertical shorts:

- Hook Title: `x 90~990`, `y 300~620`, max 2 lines, `74~88px`.
- Scene Label: `x 80~420`, `y 180~250`, `30~38px`.
- Spoken Caption: `x 90~880`, `y 1180~1480`, `52~64px`, 1-2 lines, derived from narration.
- Source Note: `x 90~760`, `y 1500~1560`, `24~30px`.
- Avoid: `y 0~150`, `y 1600~1920`, and `x 900~1080` platform UI area.
- Font: Pretendard or Noto Sans KR. Hook Title Bold/ExtraBold, Spoken Caption SemiBold/Medium, Source Note Regular.
- Accent: amber/warm yellow as the single primary highlight color. Max 1-2 emphasized words per screen.

Voice / Narration Style V1:

- 기본 음성 컨셉: 30대 남성 중저음, 자연스러운 한국어 발음, AI티가 최소화된 억양.
- 문장 끝이 기계적으로 끊기지 않아야 하며, 차분하지만 지루하지 않은 생활경제 해설자 톤을 지향한다.
- 뉴스 앵커처럼 딱딱하지 않고, 과장된 유튜버 톤이나 광고/판매 느낌을 피한다.
- 첫 문장은 호기심을 유발하고, 중간은 전문가식 해석으로 신뢰감을 주며, 마지막은 행동 지침처럼 부드럽고 단정하게 마무리한다.
- ElevenLabs 후보는 아직 최종 확정하지 않는다. `Hojin Lim`, `Yohan Koo`, `Gihong`을 같은 테스트 대본으로 생성한 뒤 Owner가 직접 청감 비교해 확정한다.
- 테스트 기준: 자연스러운 한국어 발음, 억양, 강약조절, AI티 여부, 후킹감, 신뢰감, 30초 쇼츠 지속 청취감.

Image style is fixed:

- Main style: editorial life-economy report.
- Composition: everyday object + economic signal card + clue-like interpretation staging.
- 생활경제탐정 is expressed through clue cards, connecting lines, check marks, signal cards, and everyday money objects, not a literal detective character.
- Palette: off-white, light gray, charcoal navy, dark navy/charcoal cards, amber/warm yellow accent, optional blue-gray support.
- Forbidden: changing style every time, excessive premium finance ad mood, excessive gold, fear mood, implied investment profit, unrelated abstract graph backgrounds, unverified numbers/text inside generated images.

Legacy/reference-only note:

- `docs/PLAN.md`, `docs/LOG.md`, 3D sitcom docs, living tips docs, old render/upload/generate API surfaces, and `/review`-centered old QA flow are **not active MVP direction**. Keep them as reference/history only unless Owner explicitly re-approves a slice.

## 1. Product Definition

Internal development name: **Money Shorts OS**

Definition:

경제 신호를 출처 기반으로 수집하고, Fact Card로 사실성을 고정한 뒤, Signal Translation Brief와 Scene Card를 통해 생활비·대출·소비·저축·투자 판단·환전·카드값·여행비·장바구니·고정비/변동비에 미치는 의미와 대응 행동까지 번역하는 생활경제 쇼츠 제작 OS.

This is not a generic AI video generator. It is not primarily a money-management shorts generator. Money-OS is a supporting monetization/conversion layer.

Initial posture:

- Build for Owner's own daily production first.
- Expand to creator/SaaS customers only after the workflow proves useful.
- Do not build the full Money-OS product at the start.

## 2. Monetization Direction

1. First product:
   - 금융·경제 쇼츠 생성기
2. Second monetization layer:
   - Money-OS SaaS 결제 유도
3. Expansion:
   - product sales
   - affiliate/partnership revenue
   - paid templates

Core funnel:

`Source-based finance/economy data` → `Fact Card` → `Signal Translation Brief` → `6 Scene Cards` → `Multimodal shorts package` → `risk/final QA` → `Owner gate` → `optional Money-OS CTA when relevant`

## 3. Core Production Philosophy

Do not build:

`topic input → AI script → AI video → download`

This route is too unstable and quality will keep drifting.

Build instead:

`source provider selection`
→ `raw data or disclosure collection`
→ `key number extraction`
→ `previous period / previous release comparison`
→ `Fact Card`
→ `source citation`
→ `Signal Translation Brief`
→ `6 Scene Cards`
→ `script / caption / image prompt / voice / screen text from Scene Cards`
→ `9:16 chart/image generation`
→ `fixed editorial life-economy template assembly`
→ `captions/narration/SFX`
→ `financial expression review`
→ `optional Money-OS CTA insertion`
→ `final shorts package`

The quality should come from premium templates and structured assets, not from asking a video model to invent the whole video every time.

Shorts tone must be **balanced premium finance shorts**:

- easy to understand
- fast to consume
- strong 1-2 second hook
- large key numbers
- short, clear captions
- bright card-like screens where useful
- navy/charcoal/gold premium finance tone where it strengthens trust
- not meme-like, not cheap-looking, not over-heavy securities-report content

Video pipeline stability rule:

`Fact Card` → `Signal Translation Brief` → `Scene Cards` → `script/caption/visual/voice specs` → `asset generation` → `voice timing` → `timeline recalculation` → `assembly` → `multimodal consistency QA`

## 4. MVP Roadmap

### MVP 1 — Source-Based Shorts Content Package Generator

Input: source data, disclosure, economic indicator, or manual Fact Card.

Output:

1. Fact Card
2. source citations
3. shorts topic
4. core message
5. 15s script
6. 30s script
7. 60s script
8. scene storyboard
9. caption lines
10. thumbnail copy
11. YouTube title
12. Instagram Reels copy
13. description
14. hashtags
15. optional Money-OS CTA
16. investment/financial-risk expression warnings
17. 9:16 chart/image brief or lightweight visual card

Goal: validate source-based content quality before video generation.

Core data structures:

- `source_providers`
- `raw_data_snapshots`
- `economic_indicators`
- `disclosure_documents`
- `fact_cards`
- `source_citations`
- `generated_scripts`
- `generated_charts`
- `risk_reviews`
- `video_blueprints`

Do not generate scripts from imagination. Scripts must be grounded in Fact Card values, comparisons, source names, and caution notes.

### MVP 2 — 9:16 Image / Chart Generator

Generate vertical finance visuals:

- 9:16 economic chart
- large number card
- month-over-month change card
- money leakage structure image
- salary allocation structure image
- emergency/spending/investing separation image
- thumbnail image

Candidate data sources:

- 한국은행 ECOS
- KOSIS
- 금융위원회/금융공공데이터
- OpenDART
- FRED, with series-level commercial-use rights check before production use

Goal: validate finance visual quality and source-based content.

### MVP 3 — Template Video Assembly

Create only 3 initial templates:

1. 경제지표 핵심 요약
2. 공시/실적 핵심 숫자
3. Money-OS 연결형 돈관리 보조 템플릿

Render method:

- Prefer Remotion for reusable React video templates.
- Use props for text, images, charts, colors, timing, and CTA.
- Use ffmpeg/local QA for final encoding checks.

Goal: stabilize video quality through fixed premium templates.

### MVP 4 — Money-OS Landing Connection

Connect every shorts package to a relevant Money-OS CTA:

| Shorts Topic | Money-OS Function |
|---|---|
| 월급이 사라지는 이유 | 돈 흐름 진단 |
| 비상금이 계속 깨지는 이유 | 비상금 접근 난이도 설계 |
| 카드값이 줄지 않는 이유 | 소비 통제 구조 |
| 투자금이 안 모이는 이유 | 투자금 자동 분리 |
| 지출 후 후회하는 이유 | 결제 전 마찰 설계 |
| 돈 관리가 실패하는 이유 | Money-OS 전체 구조 설계 |

Goal: validate SaaS conversion, not only views.

### MVP 5 — Payment

Candidate pricing:

- Free: 3 shorts generated
- Creator: 29,000 KRW/month
- Pro: 79,000 KRW/month
- Money-OS Personal: 9,900-19,900 KRW/month
- Money-OS Pro: 29,000-49,000 KRW/month

Payment candidate:

- Toss Payments

Actual integration requires separate Owner approval.

## 5. Template System

Initial template modes:

### Data Shorts Mode

- Default mode for source-based finance/economy shorts.
- Topics: rates, FX, inflation, employment, consumption, economic indicators, disclosures, earnings, ECOS/KOSIS/OpenDART/FRED data.
- Tone: bright, fast, intuitive, card-based, large numbers, short sentences, but still premium.
- Navy/charcoal should be accent or CTA section only, not the whole background.
- Avoid meme-like jokes, cheap AI visuals, and overhyped ad copy.

### Trust Mode

- Optional mode for economic indicators, rates, FX, disclosures, macro interpretation.
- Tone: navy/charcoal/gold finance report style.
- Use when source credibility and interpretation matter more than speed.
- Avoid slow, overly dark, text-heavy securities-report feeling.

Initial template candidates:

1. 오늘 기준금리 핵심 요약
2. 환율이 오른 이유
3. 소비자물가 상승률 변화
4. OpenDART 공시 핵심 요약
5. 이번 주 경제지표 캘린더
6. Money-OS 연결형 돈관리 보조 템플릿

Basic template rhythm:

- opening hook: 2s
- key number/problem: 4s
- chart/metaphor scene: 8s
- interpretation/lesson: 8s
- optional CTA/source/caution close: 5s

The exact runtime can vary, but the structure must remain template-driven.

## 6. Brand / Visual Direction

Use the useful premium finance tone from prior work only as brand language, not as the old Candidate10 production route.

App UI direction:

- dark navy / charcoal background
- gold accent lighting
- premium SaaS feel
- calm finance operations dashboard

Shorts template direction:

- balanced premium finance shorts, not meme content and not heavy report content
- bright card-like backgrounds
- large numbers
- short captions
- direct charts
- quick scene transitions
- restrained gold accents
- money leakage / money structured scenes that can be understood instantly
- navy/charcoal mainly for emphasis sections or ending CTA
- Money Architect world as brand signature
- premium finance desk scene only as occasional brand signature, not every video

Allowed as brand objects:

- premium finance desk
- wallet, card, cash, envelopes, trays
- money leakage / money structured scenes
- "돈은 의지가 아니라 구조다" as a brand philosophy

Avoid:

- meme-like lightweight shorts
- cheap-looking AI video
- overhyped ad feeling
- over-heavy securities-report feeling for Data Shorts Mode
- slow cinematic still-image slideshow as the default shorts format
- repeating premium finance desk shots in every scene

Do not reuse:

- Candidate10 static plate workflow
- old static 8-beat video structure
- old character continuity rules
- old final render candidates

## 7. Financial Expression Review

Must detect and warn on expressions such as:

- 매수하세요
- 무조건 오릅니다
- 수익 보장
- 급등 확정
- 지금 안 사면 늦습니다
- 100% 돈 법니다

Preferred safer alternatives:

- 관찰할 필요가 있습니다
- 변동성이 커질 수 있습니다
- 투자 판단에는 추가 확인이 필요합니다
- 특정 종목 추천이 아닙니다
- 데이터상 주목할 만한 변화입니다

Product posture:

- 출처 기반 금융 콘텐츠 제작 보조
- not automated investment recommendation

Official legal/API confirmation must happen before production release or paid launch.

## 8. Source / Attribution

Every data-backed content package should include source metadata.

Examples:

- 출처: 한국은행 ECOS
- 출처: KOSIS 국가통계포털
- 출처: 금융감독원 DART / OpenDART
- 출처: FRED, only when rights are confirmed for the specific series

In videos:

- small source label

In descriptions:

- clear source note

## 9. Analytics Direction

Initial analytics can be manual input:

- views
- saves
- profile clicks
- Money-OS landing clicks
- free diagnosis starts
- free diagnosis completions
- paid conversions

Important metrics:

- save rate per short
- profile click rate per short
- landing click rate per short
- free diagnosis start rate per short
- free diagnosis completion rate per short
- paid conversions per short
- conversion rate by topic
- conversion rate by CTA
- conversion rate by template mode

Future API candidates:

- YouTube Data / Analytics
- Instagram Platform / insights

Actual integration requires separate Owner approval.

## 10. Recommended App Navigation

User app:

- Dashboard
- 오늘의 쇼츠 아이디어
- 쇼츠 생성기
- 대본 보관함
- 차트/이미지 생성기
- 영상 템플릿
- Money-OS CTA 관리
- 금융표현 검수
- 성과 분석
- 설정

Admin:

- 사용자 관리
- 결제 관리
- API 사용량
- 콘텐츠 생성량
- 금지어/위험표현 관리
- 템플릿 관리
- 데이터 소스 관리

## 11. Candidate Tech Stack

Existing stack direction:

- Next.js
- TypeScript
- Supabase
- Vercel
- Tailwind CSS
- shadcn/ui
- Remotion
- Toss Payments

Candidate infrastructure:

- Vercel Cron for scheduled economic data/topic jobs
- Supabase Edge Functions for server-side API integration, webhooks, and payment handling

Do not add or change dependencies until Owner explicitly approves the implementation step.

## 12. Immediate Next Step

Do not start video rendering or API integration first.

Next product task:

**Design MVP 1: Shorts Content Package Generator**

Deliverable should be a product/technical spec covering:

- input fields
- output schema
- content safety / financial expression review
- Money-OS CTA mapping
- source metadata model
- save/export flow
- minimal UI screens
- acceptance tests
