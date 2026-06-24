# Money Shorts OS Implementation Order V1

Status: **ACTIVE IMPLEMENTATION ORDER**

Updated: 2026-06-25

## Core Principle

처음부터 완전 자동 영상 생성, 자동 업로드, 결제, 대규모 템플릿 확장까지 만들지 않는다.

먼저 목표는 단 하나다.

**출처 기반 금융·경제 데이터에서 고품질 쇼츠 1편이 안정적으로 생성되는 구조**를 만든다.

Money-OS는 메인 콘텐츠 주제가 아니라 CTA/전환 레이어다.

## 0단계 — 전체 설계 고정

바로 코딩하지 않고 먼저 문서화한다.

문서화 대상:

- 데이터 소스/출처 관리 구조
- Fact Card JSON/schema
- 영상 생성 전체 파이프라인
- Video Blueprint JSON 스키마
- 30초 쇼츠 기본 템플릿
- 60초 쇼츠 기본 템플릿
- ElevenLabs 보이스 프로필
- GPT 이미지 프롬프트 규칙
- ffmpeg 조립 구조
- QA 체크리스트
- Supabase 테이블 설계
- Next.js 페이지 구조
- Claude Code 작업 단위

현재 상태:

- 완료 문서: `_ai/MONEY_SHORTS_OS_SOURCE_FIRST_DATA_SPEC_V1.md`
- 완료 문서: `_ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md`
- 보조 문서: `_ai/MONEY_SHORTS_OS_PRD_V1.md`, `_ai/MONEY_SHORTS_OS_MVP1_CONTENT_PACKAGE_SPEC.md`

## 1단계 — 데이터 소스/출처 관리 구조 설계

가장 먼저 금융·경제 데이터의 출처 구조를 만든다.

설계 대상:

- `source_providers`
- 출처명
- 출처 URL
- 발표일
- 데이터 기간
- 수집 방식: manual / api / upload
- API 키 필요 여부
- 사용권/출처 표기 메모

초기에는 live API가 아니라 수동 입력 기반 구조로 시작한다.

## 2단계 — Fact Card 생성 구조 설계

각 쇼츠는 반드시 Fact Card를 먼저 만든 뒤 대본을 생성한다.

Fact Card 필수 요소:

- 데이터 소스
- 출처 링크
- 발표일
- 데이터 기간
- 지표명
- 현재값
- 이전값
- 전월/전년/이전 발표치 비교
- 변화값
- 변화율
- 해석
- 주의 문구
- 허용 가능한 주장
- 금지할 주장

중요:

- AI는 Fact Card에 없는 숫자나 사실을 상상하면 안 된다.

## 3단계 — ECOS/KOSIS/OpenDART/FRED 연동 계획 수립

데이터 API는 후순위가 아니라 핵심 기능이다.

다만 실제 live 연동은 별도 승인 후 진행한다.

계획 대상:

- 한국은행 ECOS
- 통계청/KOSIS
- 금융위원회/금융공공데이터
- OpenDART
- FRED

설계해야 할 것:

- provider별 인증 필요 여부
- 수집 가능한 데이터 유형
- 수집 주기
- 출처 표기 방식
- raw snapshot 저장 방식
- 오류/누락 처리

## 4단계 — 수동 데이터 입력 기반 Fact Card MVP 구현

처음 구현은 API 자동 연동이 아니라 수동 데이터 입력 기반으로 간다.

입력:

- source_provider
- source_name
- source_url
- published_date
- data_period
- indicator_name
- current_value
- previous_value
- comparison_type
- unit
- interpretation
- caution_note

출력:

- 저장 가능한 Fact Card
- source citation
- script generation에 넘길 safe data object

## 5단계 — Fact Card 기반 대본/자막/스토리보드 생성

Fact Card를 기준으로 아래를 생성한다.

- 쇼츠 주제
- 핵심 메시지
- Video Blueprint
- 15초/30초/60초 대본
- 자막 문장
- 장면 설명
- 이미지 프롬프트
- 영상 프롬프트

중요:

- 대본은 Fact Card에 있는 사실만 사용한다.
- 나레이션과 자막을 똑같이 만들지 않는다.

## 6단계 — 금융표현 위험 검수

영상 생성 전에 대본과 제목, 설명, CTA를 검수한다.

위험 표현:

- 매수하세요
- 무조건 오릅니다
- 수익 보장
- 급등 확정
- 지금 안 사면 늦습니다
- 100% 돈 법니다
- 이 종목 사면 됩니다

대체 표현:

- 관찰할 필요가 있습니다
- 변동성이 커질 수 있습니다
- 투자 판단에는 추가 확인이 필요합니다
- 특정 종목 추천이 아닙니다
- 데이터상 주목할 만한 변화입니다

## 7단계 — 9:16 차트/숫자 카드 생성

AI 이미지보다 먼저 안정적인 데이터 시각화 화면을 만든다.

구현할 화면:

- 큰 숫자 카드
- 지표 변화 카드
- 전월/전년/이전 발표치 비교 카드
- 경제지표 차트 카드
- 공시/실적 핵심 숫자 카드
- 출처 표시 카드
- 필요 시 Money-OS CTA 카드

## 8단계 — GPT 이미지 생성

검수된 Fact Card/Blueprint를 기준으로 핵심 장면 이미지를 생성한다.

중요:

- 이미지 안에 글자, 숫자, 자막, 출처를 넣지 않는다.
- 텍스트와 숫자는 차트/카드/ffmpeg 오버레이에서 처리한다.
- live GPT 이미지 생성은 Owner가 해당 단계 진입을 승인한 뒤 진행한다.

## 9단계 — ElevenLabs 음성 생성

음성은 ElevenLabs를 사용한다.

초기에는 브랜드 보이스 1개만 고정한다.

한 줄 정의:

차분하지만 지루하지 않은 30-40대 남성 금융 설계자 목소리.

## 10단계 — 음성 길이 기반 타임라인 재계산

ElevenLabs 음성이 생성되면 실제 음성 길이를 측정한다.

그 후 장면별 시간을 다시 계산한다.

중요:

- 영상 길이를 대본에 맞추지 않는다.
- 실제 음성 길이에 맞춰 영상 타임라인을 조정한다.

## 11단계 — ffmpeg 영상 조립

ffmpeg로 최종 영상을 조립한다.

ffmpeg 역할:

- 9:16 해상도 통일
- 이미지 줌인/패닝
- 카드 화면 삽입
- 음성 삽입
- BGM 삽입
- 자막 오버레이
- 핵심 숫자 오버레이
- 출처/면책 문구 오버레이
- CTA 화면 삽입
- 최종 mp4 렌더링

## 12단계 — 최종 QA

완성된 영상은 자동 QA를 통과해야 저장한다.

검수 항목:

- 출처가 표시되었는가?
- Fact Card 밖의 숫자/사실이 대본에 들어가지 않았는가?
- 영상 길이가 맞는가?
- 9:16 비율인가?
- 음성과 자막 싱크가 맞는가?
- 자막이 화면 밖으로 나가지 않는가?
- BGM이 음성을 덮지 않는가?
- 투자 권유/과장 표현이 없는가?
- 전체 영상이 싸 보이는 AI 쇼츠처럼 보이지 않는가?

## 13단계 — Money-OS CTA 연결

Money-OS CTA는 필요한 경우에만 삽입한다.

삽입 가능한 경우:

- 개인 돈관리와 연결되는 주제
- 소비/저축/비상금/투자금 분리와 연결되는 주제
- 경제지표를 개인 재무관리 관점으로 해석할 수 있는 주제

삽입하지 않는 경우:

- 순수 경제지표 요약
- 공시/실적 핵심 숫자 정리
- 투자 판단으로 오해될 수 있는 콘텐츠

## 14단계 — 성과 기록

초기에는 수동 입력으로 시작한다.

기록할 지표:

- 조회수
- 좋아요
- 저장
- 댓글
- 프로필 클릭
- 랜딩 클릭
- 무료 진단 시작
- 무료 진단 완료
- 유료 전환

중요:

- 조회수보다 Money-OS 전환율을 핵심 지표로 본다.
- 단, 모든 쇼츠가 Money-OS CTA를 갖는 것은 아니다.

## 15단계 — 결제/자동 업로드/외부 판매 기능 확장

초기 MVP에서 우선순위가 아니다:

- 자동 업로드
- 예약 게시
- 결제 기능
- 팀 기능
- 대규모 템플릿 마켓
- Money-OS 전체 기능
- YouTube/Instagram API 연동
- 복잡한 성과 대시보드

## 16단계 — Veo/Gemini 짧은 영상 컷 추가

Veo/Gemini는 MVP 필수 기능이 아니다.

처음에는 아래 조합으로 안정적인 영상을 먼저 만든다.

- 출처 기반 Fact Card
- 9:16 차트/숫자 카드
- GPT 이미지
- ElevenLabs 음성
- ffmpeg 조립

이후에만 Veo/Gemini를 추가한다.

사용 범위:

- 2-4초 오프닝 컷
- 지표 변화 강조 컷
- 돈 흐름/정리 시그니처 컷
- 엔딩 브랜드 컷

금지:

- 30초 전체를 AI 영상으로 생성
- 영상 안에 텍스트/숫자 넣기
- 매 장면마다 다른 스타일 생성

## Current Next Atomic Task

`money-shorts-os-source-fact-card-types-v1`

목표:

- 데이터 소스/Fact Card 타입/스키마/목업 생성기를 구현한다.
- 외부 API, DB migration, 영상 렌더링, TTS 없이 진행한다.
