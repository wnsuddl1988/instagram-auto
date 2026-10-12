---
name: project-bull-ep13-foreign-selling-in-progress-2026-10-01
description: "황소특보 13편 = 외국인 5개월 135조 순매도 × 돌아올 조건 × 삼성전자 잠정실적(후보 4번+1번 결합, Owner \"1번 진행해\"). 대본 v5 초안 검사기 통과, Owner 확정·TTS 대기. 공시 전(10/6~7) 게시 필요"
metadata:
  node_type: memory
  type: project
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-10-01T11:04:23.991Z
---

**★TTS 완료(2026-10-01, Owner "2번 확인후 TTS 생성해"):** 대본 v6(9번 "한 달 새"·"이 두 종목을" 축약, "삼성전자와 SK하이닉스") → `C:/tmp/money-shorts-os/bull-ep13-tts/output-v1/`(API 1회, 121.72초, 씬 최대 8.09초, 정렬 밀림 보정 불필요). 삼성전자 공시일은 5영업일 관행+개천절 대체공휴일 → 10/8 유력(기사 10/7) → 10/6~7 게시. **다음: 스펙 `_bull-ep13-assembly-spec.mjs` → 이미지 샘플 3장.** Owner 청취 확인 대기(읽기: 오개월간·십년물·이티에프·양손투자).

**★13편 배포 완료(2026-10-01):** 릴스 instagram.com/reel/Dd8wVHNiGK_/ · 유튜브 youtube.com/shorts/HGQ1CxGXlIU(public·썸네일 set) · 스토리(커버 1장) 게시. 게이트 7/7, 장부 13편 등록. **남음: 24~48시간 뒤 성과 수집, 삼성전자 잠정실적(10/7~8) 공시 후 후속 편 후보("제일 먼저 들고 올게" 약속).**

**★조립·QA·커버 완료(2026-10-01, Owner "조립하는대로 게시할건데"):** 완성본 `C:/tmp/bull-ep13-final/owl_episode_final_mastered.mp4`(129.9초, -14.0 LUFS), QA 반드시 수정 0, edge-review 12씬 ok(s6 여유 0~2px 최소), 클립 이동 s3 L29·s4 L12·s8 R34, 입 멈춤 수용. 커버 `C:/tmp/bull-cover-ep13/00_bull_ep13_cover_thumb.png`("외국인 135조/돌아올 조건?" 146/148px). **남음: 압축·콘텐츠 유닛(캡션·해시태그·출처)·배포 전 게이트 → Owner "배포해줘"로 게시.** 게시 후 장부 `BULL_EPISODE_LEDGER` 13편 등록.

**★Veo 클립 16개 검수 완료(2026-10-01):** 규격·길이·글자·소품 16/16 통과. 입 멈춤은 측정 경고 14/16(평균 초과 1.8초), 보이는 구간에서 입이 뚜렷이 움직이는 씬 s2·s4·s5·s6·s7·s11·s14, 경미 s1·s9·s15. 프롬프트로는 통제 안 됨(n=2). Owner 결정(재생성 vs 수용) 대기. 클립 `C:/tmp/bull-ep13-videos/`.

**★이미지 16장 완료 + 영상 프롬프트 전달(2026-10-01, Owner "음성확인했고 … 영상생성 프롬프트도"):** 보드 글자 끝 실측(1080 기준 안전 130~950px) — s3 우끝 970(20px 초과, 왼쪽 이동 25~30px)·s4 953(경계, 왼쪽 ~10px)·s6 949 통과·**s8 좌 시작 101(29px 부족, 오른쪽 이동 30~35px, 귀 끝 일부 잘림 감수)**. 3회 재생성 소진→영상 단계 `shift-clips-for-edge-once.mjs`로 교정. 프롬프트 `_ai/bull-ep13-video-generation-prompts.md`(8초 s2·s7·s16 / 10초 13개). **다음: Owner Veo 생성·영상 검수 → 입 멈춤 점검 → 조립(정렬 보정 불필요)·CTA·워터마크·오디오·QA(edge-review 씬별)·커버/스토리.**

**★스펙·샘플 이미지 완료(2026-10-01, Owner "1번 진행해"):** 스펙 `scripts/_bull-ep13-assembly-spec.mjs`(TTS와 16/16 일치, 배경 A 출국·귀환 라운지/B 저울 홀/C 바구니 마켓). 샘플 s1·s7 통과, **s3 보드는 3회 재생성에도 보드 프레임 가로 53~96%(글자 끝 88~89%)** → 3차본 채택, 영상 단계에서 클립 왼쪽 이동 교정 안(Owner 결정 대기). 체크리스트 `_ai/bull-ep13-production-checklist.md`. **다음: Owner 승인 후 나머지 13장 생성.** 보드 씬은 같은 폭 문제 예상.

**상태(2026-10-01, 초안 단계):** 소재 탐색(`C:/tmp/bull-topic-scan-ep13/`, 후보 38개)에서 SNS 성과 분석으로 4번(외국인 순매도)+1번(삼성전자 잠정실적) 결합 선택. 대본 v5(16씬·617자·T1) 검사기 반드시 수정 0 → `_ai/bull-ep13-foreign-selling-script-draft.md`(출처 대조·제외·열어 둔 결정 포함), 대본 JSON `C:/tmp/bull-ep13-draft/scenes-v5.json`.

**다음:** Owner 대본 확정 → TTS(`owl-tts --character bull`, 외부 API라 승인 후) → 스펙 `_bull-ep13-assembly-spec.mjs` 작성(템플릿 `_bull-ep12-assembly-spec.mjs`, 배경 구역·보드/카드 규칙) → 이미지 샘플 3장 → … 장부 `BULL_EPISODE_LEDGER` 13편은 대본 확정 때 등록.

**제약:** 삼성전자 3분기 잠정실적 공시일 미확정(10/8 유력, 기사 10/7 전후) — 영상은 "곧 나올"만 쓰고 공시 전(10/6~7)까지 게시. 외국인·개인 수치는 출처가 달라 비교·합산 금지. 9번 씬 ETF 순자산 기간 재확인 권장. 2·3편과 수급 계열 중복은 "1번 진행해"를 승인으로 해석(Owner 확인 요청).

**Why:** 3번(업종 희비)은 주가/이익 기준 혼재·기저효과로 겉도는 위험이라 접었고(원문 검증), 7·8번은 SNS 성과상 약한 부류. 관련: [[feedback_bull_topic_list_everything_fresh_no_skew_filter_2026_10_01]], [[feedback_bull_topic_ranking_must_use_performance_data_2026_10_01]].
