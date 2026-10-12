# 황소특보 23편 제작 체크리스트 (파일 번호 23) — 삼성전자 3분기 잠정실적 (2026-10-08)

> 소재: 22편 CTA 예고("삼성전자 잠정실적이 나오면 제일 먼저 들고 올게")를 지키는 편. Owner 2026-10-08 "이미 주제 정해져 있는 거 아니야?" → 러너 풀스캔 생략(소재 탐색 요청이 아니었음). 쏠림 점검은 반도체 4/5편 경고 표시만(규칙 11 ★★).
> 게시: Owner "게시" 지시 때만. 오전 배포는 Veo 영상 생성 시간 때문에 어렵고 오후 이후가 현실적이라고 보고함.

## A. 소재·대본
- ✅ 사실 원본: DART 연결 영업(잠정)실적 공정공시 2026.10.08(Owner 첨부 zip) → `C:/tmp/bull-ep23-sources/`(원본 html + 디코딩 txt, EUC-KR). 매출 195.00조·영업이익 107.40조·전기 89.49조·전년 12.17조·누계 254.13조, 순이익 항목 없음, 이사회 승인 시점 재공시 예정.
- ✅ 컨센서스(에프앤가이드): 108.13조(머니투데이 10/5)·108.68조(뉴시스 10/8 05:01) 직접 확인, 매출 201.7조(머니투데이)·200조(뉴시스), 9월 중순 114조 안팎(tf뉴스 9/17).
- ⚠ 속보 제목 '기대 충족'은 머니투데이 1곳이라 훅에서 뺌 → 훅 "근데 이 숫자, 증권가 예상과 거의 같았어"(두 컨센서스 대비 -0.7~-1.2%).
- ⚠ 114조 안팎은 tf뉴스 1곳 직접 확인(BNK 9/15 114.7→108.5는 검색 요약만) — 게시 직전 두 번째 출처 확인 권장.
- ✅ 대본 v4: `C:/tmp/bull-ep23-draft/scenes-v4.json` 17씬·579자, 검사기 `check-script-standards.mjs --character bull --hook-type T1` **반드시 수정 0**(확인 권장 3: 579자 분량·H4 긴장 단어 위치·4·5번 "~야" 연속).
- ✅ Owner 대본 확인·진행 승인("확인햇어 2번 진행해", 10/8) — 이후 사실 보강으로 훅·10번·11번 일부 수정(보고함).
- 규칙 29(새 독자 읽기 점검)는 Owner 지시(독자 검수 폐지)에 따라 하지 않음.

## B. 음성
- ✅ TTS 스크립트 `C:/tmp/money-shorts-os/bull-ep23-tts/bull-ep23-tts-script.json`(빌더 `C:/tmp/bull-ep23-draft/build-tts-script.mjs`, 어절 불일치 0곳, 세그먼트 ≤8어절, hookType T1, baseSpeed 1.05).
- ⛔✅ `owl-tts --character bull --arm`: 래퍼의 대본 기준 검사 통과 → **API 1/1**, 17씬, 타임라인 **114.12초(+CTA 8.33초≈122.5초)**, 요약 `output-v1/elevenlabs-scene-paced-tts-summary.json`.
- ✅ 씬별 순수 발화 최대 7.53초(s1), 9.5초 초과 0. 정렬 밀림 점검(`fix-tts-alignment-from-audio-once.mjs`): 최대 -0.1초, **보정할 씬 없음**. ⬜ Owner 청취(읽기: 백칠점사조·백구십오조·팔십구점오조·십이점이조·팔점팔배·이백오십사조·백팔조 원대·백십사조·이천구십팔억).

## C. 스펙·이미지·영상 프롬프트
- ✅ 스펙 `scripts/_bull-ep23-assembly-spec.mjs`(BULL_EP23_ASSEMBLY_SPEC): hookType T1, openingMotion **pushin**(22편 impact와 다르게), 배경 3곳(과녁 홀·막대 기둥 전시관·예보 구름 라운지, 직전 편들과 겹치지 않음), headerTitle 작업 제목 "삼성전자 107조, / 증권가 예상과 / 거의 같았다"(**Owner 제목 확정 필요**, 커버는 규칙 30으로 그대로).
- ✅ 이미지 17장(`ALLOW_CHATGPT_IMAGE=1 … --character bull3dv1 --scene-spec ./_bull-ep23-assembly-spec.mjs --scene-spec-export BULL_EP23_ASSEMBLY_SPEC --out-dir C:/tmp/bull-ep23-images`): 1~15번 연속 생성(16번 전송 버튼 실패로 중단) → `--scene-spec-only 16,17`로 이어서 생성. **재생성 1회: 16번**(처음 본은 황소가 너무 작고 카드 글자가 작아 반려, `C:/tmp/bull-ep23-images-rejected/`).
- 👁 안전선 시트 `C:/tmp/bull-ep23-review/safe-images.png`(1차, 16번 교체 전): 카드 글자 좌우 12% 안·세로 띠 안. 글자 작은 편: s9("9월 중순 114조 안팎")·s15(①②). 16번 재생성본은 황소 세로 약 39%(미디엄 목표 45~50%보다 작음)지만 카드 글자 크고 좌우 안전선 안.
- ✅ 영상 프롬프트 `_ai/bull-ep23-video-generation-prompts.md`(`build-video-generation-prompts.mjs`): **8초 11개 / 10초 6개**. ★ 티어 기준 변경(Owner 10/8): 소품 씬도 사용 길이(발화+쉼) 7.1초 이하면 8초 — 8초 클립은 끝 프레임 글자를 확인하고 사라졌으면 그 씬만 10초로 재생성.
- ✅ 장부 `BULL_EPISODE_LEDGER` 23편 등록(`lib/source-facts/bull-topic-lanes.ts`), `check-source-facts-bull-topic-lanes.mjs` 14/14 통과(시험 기대값을 23편으로 갱신).
- ✅ Owner Veo 영상 17개 수령·검수·조립·CTA·마감·QA 완료(아래 D·E).

## D. 영상 검수 (2026-10-08, Owner Veo 영상 17개 수령 — Downloads/1~17.mp4, 숫자=씬 번호)
- ✅ 17개 모두 720x1280·24fps·오디오 포함, 길이 티어 일치(10초 s1·4·9·11·12·15 / 8초 나머지), 모든 클립이 사용 길이보다 김 — 복사본 `C:/tmp/bull-ep23-videos/bull_ep23_s{N}_motion.mp4`, 검수 자료 `C:/tmp/bull-ep23-review/`(clip-probe.json, 프레임 시트).
- ✅ s8: 지구본(실제 대륙 지도) 배경·카드 "발표 직전 컨센서스" 이미지가 Veo에서 "동영상을 생성할 수 없습니다"로 반복 실패 → 과녁 홀 배경으로 이미지 재생성 후에도 실패 → **카드 글자를 적지 않은 최소 프롬프트(`_ai/bull-ep23-s8-minimal-video-prompt.md`)로 통과**. 최종 s8 클립은 카드 "컨센서스 / 영업이익 108조대"(현재 스펙·이미지 `bull_ep23_s8.png`와 일치). 원인 문장은 미확정(긴 프롬프트의 어느 문구인지 분리 시험 안 함).
- ❌→감수: 8초 카드 클립 8개 중 **s3·s10·s14에서 카드가 사용 구간 안에서 사라짐**(s3 6.3~6.5초, s10 6.0~6.2초, s14 5.0~5.2초; 쓰는 길이 7.01·7.05·5.74초 → 마지막 약 0.5~0.85초 카드 없음·캐릭터 변형). 10초 클립 6개는 끝까지 온전. 티어 기준(사용 7.1초 이하 8초)이 틀려 규칙을 항상 10초로 되돌림. Owner가 "이대로 그냥 해도 되겠는데"(10/8)라고 해 **재생성 없이 조립**(재생성용 10초 프롬프트 `_ai/bull-ep23-regen-10s-prompts.md`는 보관).
- 👁 입 멈춤(`check-clip-speech-timing-once.mjs` 17개 중 16개 경고): 육안(8개 클립, 발화 끝+0.35·+0.8초) — 대부분 입 닫고 미소, 22편과 같은 수준.

## E. 조립·CTA·마감·QA (2026-10-08)
- ✅ 정렬 밀림 점검: 최대 -0.1초, 보정 없음 → 원본 요약·alignment 사용.
- ✅ 조립 `C:/tmp/bull-ep23-assembly-v1/owl_shorts_final.mp4` 114.1초(openingMotion pushin, 누적 오차 0, 컷 리드 0.10~0.13초, 자막 61블록). 1차 육안(caption-card 시트)에서 s1(자막이 카드 아래 모서리에 붙음)·s7(자막이 카드 둘째 줄을 덮음) over → 스펙 `captionYShiftByScene {1:28, 7:28}`로 두 씬만 28px 내려 재조립.
- ⛔✅ CTA 결합(bull-cta-fixed-v6, `--scene8-start 114.126`, `--alignment …31c5ba709213bc.alignment.json`): cta-join-report PASS(프레임 2935/2935, 화면 122.29초 = 오디오 122.29초).
- ✅ 워터마크 제거(sparkle·veo_text) → 오디오 마감(효과음·배경음 없음) `C:/tmp/bull-ep23-final/owl_episode_final_mastered.mp4` 57.4MB, -15.0→**-14.3 LUFS / -1.0 dBTP**. 압축본 `owl_episode_final_mastered_compressed.mp4` 23.8MB(crf 25).
- ⛔✅ QA: 첫 실행 must-fix 1(edge-review 기록 누락) → 시트 육안 후 `qa/edge-review.json` 기록(카드 14씬 좌우 끝·자막 겹침 모두 ok) → 재실행 **반드시 수정 0**, 확인 권장 8(H4 위치 2, 579자, "~야" 연속, 0.38초 "안녕, 투자"·0.55초 "읽혀", 한 어절 "읽혀", 입 멈춤 16). 보고서 `C:/tmp/bull-ep23-final/qa-report.md`.
- **못 본 것**: 완성본 처음부터 끝까지 재생, 클립 안 소리, 첫 3초 pushin이 자연스러운지(프레임 시퀀스 안 봄), TTS 청취.
- ✅ **제목 확정(Owner 10/8 "네가 제목 후킹 있게 지어봐")**: "삼성전자 107조, 근데 왜 안 놀랍지?" — 영상 속 제목 3줄 "삼성전자 107조, / 근데 왜 / 안 놀랍지?"(108px), 제목만 바꿔 재조립·CTA·워터마크·마감·QA 다시(**QA 반드시 수정 0**, edge-review.json 새 완성본 기준 재기록), 압축본 24.2MB 다시 만듦.
- ✅ 커버(규칙 30 제목 그대로): 스펙 `scripts/_bull-cover-ep23-spec.mjs`(흑연 보라→시안 터쿼이즈, 황금 동심원 과녁, 한 눈썹 올린 의문 표정·턱에 손), 글자 없는 배경 `C:/tmp/bull-cover-ep23-raw/`(1차 성공) → 합성기 4줄 "삼성전자 / 107조, / 근데 왜 / 안 놀랍지?" **150/150/150/150px(≥140)**, 세로 13.0~49.1% → `C:/tmp/bull-cover-ep23/00_bull_ep23_cover_thumb.png`(Owner에게 전송). 4줄로 나눈 것은 140px 유지 때문(문구는 그대로).
- ⬜ 콘텐츠 유닛·배포 전 게이트(`run-deploy-preflight-once.mjs`) → **게시는 Owner "게시" 지시 후**(§5: 커버 merge, `--privacy public`, 유튜브 `--publish-at` 인스타 1시간 뒤, 썸네일 Claude가 Studio에서 직접). 게시 직전 재확인: 114조 안팎 두 번째 출처, 12번 "어제 말한" 표현이 배포 시점과 맞는지.
