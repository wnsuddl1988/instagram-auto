---
name: project-bull-topic-lane-expansion-analysis-2026-09-30
description: "경제사냥꾼 쇼츠 제목 1,975개 분석으로 본 황소특보 소재 발굴 레인 확장안(반도체 쏠림 해소) — Owner 확정 대기"
metadata:
  node_type: memory
  type: project
  originSessionId: 177f9fb2-bb14-4b83-ac27-f7a121098199
  modified: 2026-09-29T20:59:07.551Z
---

2026-09-30 Owner가 "소재 찾는 범위를 다양화하고 경제사냥꾼 제목을 보고 알고리즘 확장 방법을 분석해달라" 요청. 인스타 @moneyhunter_kr은 로그인 벽으로 프로필 헤더(팔로워 36.7만)만 확인(OBSERVED_PARTIAL). 같은 브랜드 유튜브 채널(UC7usMJDHmtbs_oegmzQKKMA) 쇼츠 **제목·조회수 1,975개 전체**를 innertube browse로 수집·분석(제목만, 자막 미수집).

**핵심 발견:** 제목 형식 분포 — "진짜 이유" 33%, 월가/미국 시선 18%, 인물 발언 17.5%(젠슨황·버핏·빌게이츠·이재용·머스크·파월 등), "정체"(종목 발굴) 13%, 숫자 나열 13%, 상승 기대 12%, 시황 브리핑 11%(조회수 중앙값 최저 6.5만), 폭락·위기 6.7%(9.4만), 다음 수혜주 6.8%, 방법·신호 7.7%, 이벤트 날짜 맞춤 2.2%, 역설형 1.2%(중앙값 9.8만, n 작음). 전체 중앙값 7.3만, 10만+ 639개, 30만+ 56개, 100만+ 1개.
주제 영역(키워드 분류, 중복 허용): 반도체 22%, 증시 시황 16%, 중국·글로벌 8%, 금리·환율 7%, 미국 빅테크 6%, 정책·제도 5.5%; 바이오 1.2%, 부동산 1%, 2차전지 0.9%, 금융 0.5%, 소비 0.3%. 우리 황소특보는 1~9편 중 5~6편이 반도체(약 60%)라 더 쏠려 있다. 영역별 조회수 차이는 작고(중앙값 5~13만, 소수 표본 다수) 표본 편향(오래된 영상일수록 누적 조회수↑)이 있어 "이 영역이 잘 된다"고 단정하지 않는다.

**제안 레인(Owner 확정 2026-09-30, 구현 완료):** ①원인 해설("X만 안 오르는/빠지는 진짜 이유") ②인물·기관 발언 해석 ③이벤트 D-N 카운트다운(상장·회담·시행·실적) ④시장 제도·정책 변경 ⑤신테마 입문(로봇·양자·우주·희토류·AI 원리) ⑥매크로 번역(환율·금리·유가·금) ⑦한미 디커플링 ⑧주간 체크포인트. 가드레일: 최근 5편 중 반도체 ≤2, 사건형 ≤1/3, 같은 훅 반복 금지, 허용리스트 밖 종목 실명·매수 암시("2배 갈 수 있다") 금지 → 종목 발굴형은 산업/테마 구조 해설로 변환.

**Why:** 8편 소재 반려 이력(급등 쏠림, 반도체 쏠림)과 "레인 부족" 진단. **How to apply:** 소재 후보 제안 시 레인·도메인·유형을 표시해 5편 이동 창(window)의 쏠림을 보고하고, Owner가 레인 확정하면 `bull-event-calendar.ts`·러너 확장 착수. 관련: [[project-bull-topic-selection-criteria-confirmed]], [[feedback-bull-topic-fresh-event-pattern-2026-09-29]].

**구현(2026-09-30, 미커밋):** `lib/source-facts/bull-topic-lanes.ts`(레인 8개·게시 장부·쏠림 판정), `bull-event-calendar.ts` 확장(마이크론·수출입동향·테슬라, `status: tentative`), 러너 `run-bull-topic-calendar-once.mjs`·`run-bull-topic-lane-mix-check-once.mjs`(무비밀), `run-bull-topic-lane-news-search-once.mjs`+래퍼 `bull-topic-lane-news-search`, 검사 `check-source-facts-bull-topic-lanes.mjs`(12 PASS). 새 편 배포 때 `BULL_EPISODE_LEDGER`에 한 줄 추가할 것. 주제명은 "~진짜 이유/정체" 틀 금지·문장 모양 순환(Owner 지시).
