# 황소특보 17편 제작 체크리스트 — 외국인은 팔기만 한 게 아니다, 끝까지 산 종목들 — 규칙 23·26·27·29

> ⛔ = 코드가 막는 게이트, 👁 = 사람이 눈으로 보고 기록을 남겨야 하는 단계. 증거(명령·파일)를 적고 못 본 것은 "못 봄"으로 적는다. 소재·대본·팩트표·새 독자 읽기 점검 기록은 `_ai/bull-ep16-18-scripts-draft.md`(B절). 배포는 Owner 지시.

## 0. 시작 전
- ✅ CURRENT_STANDARDS를 그 세션에서 직접 열어 읽음(2026-10-03): 규칙 11·13·17·22·26~29, §3 황소 v3·성공 공식·엔딩 5박자.
- ✅ `scripts/_bull-ep17-assembly-spec.mjs` 없음 확인 후 새로 만듦.

## A. 소재·대본
- ✅ 소재 탐색: `run-bull-topic-full-scan-once.mjs` 11단계(`C:/tmp/bull-topic-scan-ep16/`), 후보 25개 → Owner "1~3번 소재로 3개 편" → "1번 진행해, 종목 실명은 허용하고 상폐 편은 원문 확인 후 확정"(2026-10-03) → "2번 외국인편(B) 상폐 편(C) 차례로 이어서".
- ✅ 팩트: 외국인 순매수 종목·화장품 수출·환율·코스피200 이익 전망 — 보도·증권사 자료(2026-10-03). **못 봄: 월별 순매수 원자료(KRX), 코스피200 전망치 증권사 원문, 종목별 금액 재계산.**
- ⛔✅ 대본 검사: v3 **반드시 수정 0**, 16씬·614자 — `C:/tmp/bull-ep16-draft/foreign-nonsemi-scenes-v4.json`.
- ✅ 새 독자 읽기 점검(규칙 29) 통과, Q4 조치 → 초안 문서.
- ✅ **Owner 대본 확정**("1~3번 소재로 3개 편" 후 "차례로 이어서 진행", 2026-10-03). 종목 실명 허용은 Owner 발언, 법적 위험 확인은 Owner 몫.
- ⬜ 장부 `BULL_EPISODE_LEDGER` 17편 추가는 배포 후.

## B. 음성
- ✅ TTS 스크립트 JSON `C:/tmp/money-shorts-os/bull-ep17-tts/bull-ep17-tts-script.json`(빌더 `C:/tmp/bull-ep16-draft/build-bullB-tts.mjs`): 어절 수 일치·세그먼트 ≤8어절·읽기에 숫자 없음 경고 0건, hookType T1, baseSpeed 1.05.
- ⛔✅ owl-tts --character bull --arm: **API 1/1**, 16씬, **123.80초**(+CTA 8.33초≈132초), 씬 최대 8.66초, 정렬 밀림 최대 -0.22초 → 보정 불필요. 못 본 것: TTS 청취(종목명·"오점오퍼센트" 읽기).

## C. 스펙·이미지
- ✅ 스펙 `scripts/_bull-ep17-assembly-spec.mjs`(BULL_EP17_ASSEMBLY_SPEC): 스펙 대사·장면 키가 TTS JSON과 일치(자동 대조), 같은 구역 같은 샷 3연속 없음, 검사기(--spec-module) 반드시 수정 0.
- ✅ 이미지 16장(2026-10-03, `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character bull3dv1 --scene-spec ./_bull-ep17-assembly-spec.mjs --scene-spec-export BULL_EP17_ASSEMBLY_SPEC`): 러너가 완료 감지 timeout으로 s2·s11·s16에서 종료 → `--scene-spec-only`로 이어서 생성(재생성 아님, 실패한 장은 저장되지 않음). 파일 `C:/tmp/bull-ep17-images/bull_ep17_s{1..16}.png`.
- 👁 안전선 시트(`safe-zone-sheet-all.png`) 씬별 판정: s1 카드 '9개월 내내 산 종목들이 있다' ✅ · s2 와이드 인사 ✅ · s3 카드 '신세계·달바글로벌/KCC, 9개월 연속' 글자가 작은 편이나 원본 확대에서 선명 ✅ · s4 카드 '8개월 연속 12곳/셀트리온·에이피알 등' 작은 편 ✅(영상에서 뭉개지면 재생성) · s5 카드 '달바글로벌/5,600억 순매수' ✅ · s6 와이드 ✅ · s7 카드 '화장품 수출/111억 달러 +31%' ✅ · s8 카드 '환율 1,300원대/항공주 매수 강화' ✅ · s9 카드 '코스피200 내년 이익/전망 15% 상향' ✅ · s10 와이드 양손 펼침 ✅ · s11 클로즈 턱 괴기 ✅ · s12 카드 '보장은 없다/실적으로 확인' ✅ · s13 카드 '판 것만이 아니라/끝까지 산 것도' ⚠ 캐릭터가 크고 카드 하단 ≈64%로 자막 영역에 가까움 · s14 카드 '① 3분기 실적/② 환율에도 버팀' ⚠ 하단 ≈62% · s15 카드 '판 종목, 산 종목/같이 봐야 해' ⚠ 하단 ≈63% · s16 와이드 인사 ✅. s13~s15는 조립 후 QA edge-review에서 자막과 카드 글자가 겹치는지 확인(겹치면 해당 씬만 재생성). 캐릭터 일관성 16장 유지, 배경 3구역(소비재 백화점 아트리움·화장품 수출 물류 홀·공항 전망 라운지)에 글자·숫자 없음. **못 봄**: 시트 해상도의 배경 속 작은 글자 유무(s3 원본만 확대 확인).
- ✅ 영상 프롬프트 `_ai/bull-ep17-video-generation-prompts.md`(`build-video-generation-prompts.mjs`, TTS output-v1 기준): **8초 3개(s2·s10·s16) / 10초 13개**. Owner에게 전달함. Owner가 Veo로 생성해 보내줄 예정("황소특보 17편"이라고 알려주기).

## D. 영상 검수(2026-10-03, Owner Veo 영상 16개 수령 — Downloads/황소 17편/1~16.mp4, 숫자=씬 번호)
- ✅ 16개 모두 720x1280·24fps·오디오 포함, 길이 티어 일치(8초 s2·s10·s16 / 10초 나머지), 카드 글자는 끝 프레임까지 보존(카드 씬 11개 전부), 카메라 줌·소품 이동 없음 — `C:/tmp/bull-ep17-videos-review/`(sheet_1~4.png, mouth_1~2.png, probe.json). 영상 파일 `C:/tmp/bull-ep17-videos/bull_ep17_s{N}_motion.mp4`.
- 👁 특이점: s6 씬 길이 10.05초 > 클립 10.00초(조립 로그상 정상 처리, 정지 연장 없음). s2·s16 클립 맨 끝 프레임은 반투명 디졸브처럼 보이나 컷 앞이라 화면에 안 나옴. 일부 클립 시작 0.3초는 눈 감은 깜빡임.
- 👁 입 멈춤(check-clip-speech-timing 15/16 경고는 추정치): 육안 — 닫힘 s3·s4·s8·s12, 경미 s1·s9·s11·s13·s14, **보통(꼬리에 미소로 입 벌어짐) s2·s5·s6·s7·s10·s15·s16**. 16편 선례대로 그대로 진행(Owner에게 보고).

## E. 조립·CTA·마감·QA
- ✅ `run-owl-assemble-shorts-v2.mjs` → `C:/tmp/bull-ep17-assembly-v1/owl_shorts_final.mp4` 123.8초(씬 전환 누적 오차 0, 컷 선행 0.10~0.15초, 자막 67블록).
- ⛔✅ `run-owl-episode-with-fixed-cta-once.mjs --scene8-start 123.809 --alignment …`(황소 CTA bull-cta-fixed-v6): cta-join-report **PASS**(프레임 3167/3167, 화면 131.96초 = 오디오 131.96초), 전환 4프레임 육안 확인(제목 3줄·리스크 고지·CTA 정상).
- ✅ 워터마크 제거(sparkle·veo_text) → 오디오 마감 `C:/tmp/bull-ep17-final/owl_episode_final_mastered.mp4` 132.0초 59.6MB, **-14.2 LUFS / -0.9 dBTP**.
- ⛔✅ `run-episode-qa-once.mjs`: 첫 실행 must-fix 1(카드 씬 11개 edge-review 기록 없음) → edge-review-1~3.png·caption-card-1~3.png를 직접 보고 qa/edge-review.json 기록 → 재실행 **반드시 수정 0**, 확인 권장 5(H4 긴장 단어 위치 2, 월 표기 "9월" 반복, 한 어절 자막 "내려와", 입 멈춤 15). 제목 108px×3줄, 자막 96px 최대 2줄, 자막↔음성 46곳 ok, 워터마크 제거 표식 확인. 보고서 `C:/tmp/bull-ep17-final/qa-report.md`.
- 👁 카드 좌우 끝 판정 11개 모두 ok(스트립에 카드 글자 없음). 자막-카드 겹침: 글자를 가린 씬 없음, **s13 카드 하단 테두리가 자막 윗줄(y≈1257)에 맞닿음**(글자 간격 약 36px — 16편 s10 전례대로 ok·Owner 판단 사항), s14 간격 약 13px·s15 간격 좁고 카드·자막 문구 유사(겹침 없음).
- **못 본 것**: TTS 청취(종목명·"오점오퍼센트" 읽기), 최종본 전체 프레임 재생, 월별 순매수 원자료(KRX)·코스피200 전망치 증권사 원문 재계산.

## F. 커버
- ✅ 스펙 `scripts/_bull-cover-ep17-spec.mjs`(짙은 차콜 틸→피치 코랄, 양쪽에서 들어오는 금빛 원판, 놀람+호기심 표정), 합성기 헤드라인 "외국인 매도 / 산 종목 있다" 글자 높이 **164/155px(≥140 통과)**, 세로 16.4~34.6%(1차 "외국인 팔기만?/끝까지 산 종목" 127/131px·2차 "외국인 순매도" 138px 미달로 문구 단축) → `C:/tmp/bull-cover-ep17/00_bull_ep17_cover_thumb.png`(Owner에게 전송). 뿔 끝이 헤드라인 하단에 근접(16편 수준).

## G-2. ★재배포(2026-10-03, Owner "커버에 '외국인 매도/산 종목있다'라고 적혀있던데 이게 뭐냐, 삭제했으니 다시 만들어서 배포해")
- 원인: 140px 게이트를 맞추려고 문구를 줄이다가 "외국인 매도 / 산 종목 있다"가 됐다 — 영상 내용(팔기만 한 게 아니다)과 어긋나고 어색한 한국어. **게이트는 글자 크기만 보지 의미는 못 본다. 문구를 줄이면 뜻이 변하지 않는지, 어색하지 않은지 내가 따로 봐야 한다.**
- ✅ 새 헤드라인 **"외국인 팔 때 / 산 종목들?"**(155/179px, 세로 16.0~35.0%, 같은 배경 재사용 — 시험한 안: "9개월 내내/산 종목들?"·"외국인 샀다/9개월 내내"·"팔기만 했나?/산 종목 있다") → `C:/tmp/bull-cover-ep17-v2/00_bull_ep17_cover_thumb.png`. 옛 커버 `C:/tmp/bull-cover-ep17/`는 쓰지 않는다.
- ✅ 새 콘텐츠 ID `bull-ep17-foreign-buyers-non-semiconductor-2026-10-03-v2`, 폴더 `C:/tmp/bull-ep17-publish-v2/`(영상·캡션 동일), 게이트 실패 0·경고 0, Blob 3건 UPLOADED → 커버 merge → 릴스(coverUrl `-v2` 경로 확인)·스토리·유튜브 public(썸네일 set).
- **새 링크**: 릴스 https://www.instagram.com/reel/DeBuTfKo3yJ/ (mediaId 17895038355420928) · 스토리 mediaId 18110979184877998 · 유튜브 https://www.youtube.com/shorts/beZeuN-uplc (public). **옛 게시물**(릴스 DeBsvFCAY5J·유튜브 -OmDFEfZgMg)은 Owner가 삭제. 첫 배포 때 올린 옛 스토리(mediaId 17987749158115024)는 API로 삭제 못 하므로 24시간 뒤 자동 만료(앱에서 직접 지우면 즉시).

## G. 배포 완료(2026-10-03, Owner "황소 17편 배포해줘") — 아래 게시물은 위 G-2에서 삭제·교체됨
- ✅ 게시 직전 팩트 재확인(웹 검색): 한국경제 10/1~10/2 보도와 일치 — 9개월 연속 신세계·달바글로벌(순매수 약 5,607억·시총의 약 25%)·KCC, 8개월 이상 15개 종목 중 반도체 밸류체인 없음, 달바 5,600억·신세계 6,291억. 화장품 수출 111억 달러·환율·코스피200 전망은 초안 팩트표(복수 매체) 기준 유지. 못 본 것: KRX 월별 원자료·증권사 원문.
- ✅ 압축 `owl_episode_final_compressed.mp4` 30.6MB(1900k), 콘텐츠 유닛(finalMasteredPath·qaReportPath 포함), ⛔ 배포 전 게이트 **실패 0·경고 0·통과 7**.
- ✅ 업로드 3건(영상·커버·스토리 Blob) UPLOADED → 커버 merge → 릴스 게시(로그 `coverUrl:` 실제 URL 확인) → 스토리 게시 → 유튜브 `--privacy public`(썸네일 set).
- **링크**: 릴스 https://www.instagram.com/reel/DeBsvFCAY5J/ (mediaId 18128262943699293) · 스토리 mediaId 17987749158115024(24시간 만료) · 유튜브 https://www.youtube.com/shorts/-OmDFEfZgMg (public). 폴더 `C:/tmp/bull-ep17-publish/`.
- ✅ 장부 17편은 제작 중 등록돼 있어 주석에 배포 완료 표기.
- ⬜ 확인 대기: 유튜브 썸네일 maxres/oar 반영(수 시간 뒤), 성과 수집. 못 본 것: 게시된 릴스·쇼츠 실제 재생 화면. 로컬 변경은 Owner 커밋 승인 대기.
