# Money Shorts OS Product Direction V1

Status: **ACTIVE PRODUCT DIRECTION**

Updated: 2026-06-25

## 0. Interpretation Rule

Use all Owner-provided direction as context, but when directions conflict, **the later Owner instruction wins**.

Current latest emphasis:

- Start as an internal daily shorts production tool, not a complete B2B SaaS.
- The product core is source-based finance/economy shorts, not money-management shorts.
- Money-OS is a CTA/conversion layer, not the main content identity.
- The first deliverable is a high-quality shorts content package, not fully automated video generation.
- Brand image is premium finance, but actual shorts must be balanced: fast and easy to understand without becoming meme-like, cheap, or over-heavy.

## 1. Product Definition

Internal development name: **Money Shorts OS**

Definition:

출처 기반 금융·경제 데이터를 수집하고, 핵심 사실을 추출하고, 쇼츠 대본·자막·차트·이미지·음성·영상으로 변환하며, 금융표현 위험 검수까지 수행하는 금융·경제 쇼츠 제작 OS.

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

`Source-based finance/economy data` → `Fact Card` → `Video Blueprint` → `Shorts package` → `optional Money-OS CTA when relevant`

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
→ `Video Blueprint`
→ `script generation`
→ `scene storyboard`
→ `9:16 chart/image generation`
→ `premium fixed template assembly`
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

`Fact Card` → `Video Blueprint` → `script/caption/visual design` → `asset generation` → `ElevenLabs voice` → `audio duration measurement` → `timeline recalculation` → `ffmpeg assembly` → `QA`

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
