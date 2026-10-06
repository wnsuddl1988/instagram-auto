# 황소특보 22편 제작 체크리스트 (파일 번호 22) — 규칙 23·26·27, 단계가 끝날 때마다 ✅/❌와 증거(명령·결과 파일)를 적는다

> 소재: **19조 원 반도체 ETF 8일 리밸런싱**(2026-10-06 Owner "1번으로 진행해", 게시 목표 **10/7 저녁 6~7시**). 처음 선택했던 레버리지 ETF 대본(`_ai/bull-ep22-leverage-script-draft.md`)은 보관 — 11월 세부안 때 사용. 첫 3초 실험: 황소 22편 = `openingMotion: impact`. 커버는 규칙 30(제목 그대로).
> 대본: `_ai/bull-ep22-etf-rebalance-script-draft.md`, `C:/tmp/bull-ep22-draft/etf-rebal-scenes-v5.json`(검사기 반드시 수정 0, 새 독자 점검 반려 없음).

> 새 편을 시작하면 이 파일을 `_ai/{char}-ep{N}-production-checklist.md`로 복사한다. ⛔ 표시는 **코드가 막는 게이트**(통과 못 하면 다음 단계 명령이 멈춘다), 👁 표시는 **사람이 눈으로 보고 기록을 남겨야 하는 단계**다. "확인했다"는 말 대신 증거(명령 출력·파일 경로)를 적는다. 못 본 것은 "못 봄"으로 적는다.

## 0. 시작 전 (매 편)
- ⬜ CURRENT_STANDARDS를 **그 세션에서 직접 열어** 읽음: 최우선 규칙(1~27) → A-2 → 캐릭터 섹션(부엉 §1 / 황소 §3) → §7 재고·다음 번호. 요약 메모리로 대신하지 않는다(규칙 26).
- ⬜ 표시 번호 ↔ 파일 번호 확인(§7 표). 같은 파일 번호를 다른 소재가 쓰고 있지 않은지 `ls scripts/_{char}-*ep{F}*`로 확인.

## A. 소재·대본
- ✅ 소재 탐색: `run-bull-topic-full-scan-once.mjs --out-dir C:/tmp/bull-topic-scan-ep22`(11단계 전부 ✅, SCAN_CHECKLIST.md), 후보 40개 보고 → 레버리지 ETF 대본 완성(보관) → 성과 분석 후 소재 교체: Owner "1번으로 진행해" = 반도체 ETF 8일 리밸런싱(삼성 직접성·날짜 이벤트·반전). 23편 = 삼성 잠정실적 결과 후속 슬롯.
- ✅ 담당 캐릭터 황소(투자자 입장), 쏠림 점검 `12-mixcheck.txt`(반도체 쏠림 경고 표시 — 규칙 11 ★★로 후보 제외 사유 아님).
- ✅ 팩트: 서울경제 2건(10/6) 원문 확인, 숫자 전부 삼성증권 추산(단일 매체) → `_ai/bull-ep22-etf-rebalance-script-draft.md` 팩트표. **게시 직전 재확인 필수**.
- ✅ 대본 v5: 17씬·약 644자, 검사기 반드시 수정 0·확인 권장 3, 새 독자 점검(sonnet 1회) 반려 없음·Q4 조치 기록.
- ✅ **Owner 대본 확정 + TTS 승인**("1번 진행해", 2026-10-06 저녁) — 대본 v5 그대로.

## B. 음성 (2026-10-06)
- ✅ TTS 스크립트 JSON `C:/tmp/money-shorts-os/bull-ep22-tts/bull-ep22-tts-script.json`(빌더 `C:/tmp/bull-ep22-draft/build-tts.mjs`): 어절 수 일치·세그먼트 ≤8어절·읽는 표기에 숫자·영문 없음 경고 0건, hookType T1, baseSpeed 1.05. 읽는 표기: 팔일, 이티에프, 십팔조 구천억, 이십육점구팔퍼센트, 이십오퍼센트, 사분의 일, 이천구십팔억, 에스케이하이닉스, 구백억, 이백억, 이십칠점오퍼센트, 삼십칠퍼센트.
- ⛔✅ `owl-tts --character bull --arm`: 래퍼의 대본 기준 검사 통과 → **API 1/1**, 17씬, 타임라인 **120.44초(+CTA 8.33초≈128.8초)**, 요약 `output-v1/elevenlabs-scene-paced-tts-summary.json`.
- ✅ 씬별 순수 발화 최대 **7.87초(s16)**, 9.5초 초과 0. 정렬 밀림 점검(`fix-tts-alignment-from-audio-once.mjs`): 최대 -0.28초(s10)·-0.24초(s11) 포함 전부 "정상(유지)" 판정, 보정 씬 없음(원본 정렬·summary 사용). **주의**: s10·s11 이동량이 임계(0.2초) 근처 — 조립 후 QA의 자막↔음성 검사에서 확인. 못 본 것: TTS 청취(Owner 확인 필요: 이십육점구팔퍼센트·이천구십팔억·사분의 일·이티에프 읽기).

## C. 스펙·이미지
- ✅ 스펙 `scripts/_bull-ep22-assembly-spec.mjs`(BULL_EP22_ASSEMBLY_SPEC): hookType T1, openingMotion **impact**(황소 첫 적용), captionGapBridgeSec 0.3, headerTitle "삼성전자 8일 / 규칙 때문에 / 팔린다"(커버도 규칙 30으로 이 문구 그대로), sceneBackgrounds A 균형 조형물 홀 / B 상자 물류 홀 / C 조각 바닥 원형 홀(직전 편과 안 겹침, 글자·숫자 없음), 17씬 shot·bg·motion, 스펙 대사·장면 키가 TTS JSON과 17/17 일치(`verify-spec.mjs` mismatch 0), 같은 구역 같은 샷 3연속 없음, 검사기(--spec-module) 반드시 수정 0.
- ✅ 이미지 17장(2026-10-06, `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character bull3dv1 --scene-spec ./_bull-ep22-assembly-spec.mjs --scene-spec-export BULL_EP22_ASSEMBLY_SPEC --out-dir C:/tmp/bull-ep22-images`): 백그라운드 30분 제한으로 s5에서 중단 → `--scene-spec-only 6~17`로 이어서 생성(재생성 아님, 17장 모두 1차 생성). 파일 `C:/tmp/bull-ep22-images/bull_ep22_s{1..17}.png`.
- 👁 안전선 시트(`C:/tmp/bull-ep22-review/safe-images.png`) 판정: s1 카드 '삼성전자도/억지로 팔린다' ✅(글자 작은 편) · s2 와이드 인사 ✅ · s3 '반도체 ETF 7개/순자산 약 18.9조' ✅ · s4 '삼성전자 비중/26.98% (상한 25%)' ✅ · s5 '한 종목은/4분의 1까지만' ✅(큼) · s6 '왜 8일일까?/옵션만기일 겹침' 글자·캐릭터가 작은 편이나 읽힘 ✅ · s7 '삼성전자 매도/약 2,098억 원' ✅ · s8 'SK하이닉스 매수/약 900억 원 추산' ✅ · s9 '장비·기판 4곳/각 200억 안팎' ✅ · s10 '거래대금 대비/최대 27.5%' ✅ · s11 '주가 탓이 아닌/비중 탓 매물' ✅ · s12 '잠정실적 8일 예상/공시 전 미확정' 글자 작은 편이나 읽힘 ✅ · s13 턱 괴기(소품 없음) ✅ · s14 '삼성전자 매물은/규칙이 만든 수급' ✅ · s15 '① 8일 장 막판 거래/② 며칠 뒤 주가 흐름' 글자 작은 편이나 읽힘 ✅ · s16 '실적인지/수급인지 먼저' ✅ · s17 와이드 손 흔들기 ✅. 카드 전부 세로 42~60% 안, 좌우 안전선 안, 캐릭터 일관성 유지, 배경 3구역(균형 저울 홀·상자 물류 홀·파이 조각 원형 홀)에 글자·숫자 없음(시트 해상도 기준). **못 봄**: 배경 속 작은 글자·상자 라벨 유무(원본 1:1 확대는 안 함), 영상 변환 때 카드 글자·저울·파이 조각에 숫자가 생기는지. s1·s6·s12·s15는 카드 글자가 작아 영상에서 뭉개지면 재생성.
- ✅ 영상 프롬프트 `_ai/bull-ep22-video-generation-prompts.md`(`build-video-generation-prompts.mjs`, TTS output-v1 기준): **8초 2개(s2·s17) / 10초 15개**, 금지 표현("glued"·"Silent") 본문에 없음. Owner에게 전달함(저장명 `Downloads/1~17.mp4`, "황소특보 22편"이라고 알려주기).
- ⛔ **대본 기준 검사** `node scripts/check-script-standards.mjs --character {owl|bull} --scenes <scenes.json> --hook-type T#` → 반드시 수정 0. 결과 표를 대본 문서와 보고에 붙인다. (통과 못 하면 TTS 게이트가 막는다.)
- 👁 검사기가 못 보는 것 직접 대조 후 기록: 팩트·출처 / 훅 H3(구체 대상) / 매수 암시·종목 실명(황소) / 흐름.
- 👁 **새 독자 읽기 점검(규칙 29, 2026-10-02)**: 검사기 통과 후 Owner에게 보이기 전에 [script-cold-read-prompt.md](script-cold-read-prompt.md) 절차로 대본 전체를 서브에이전트 1개에게 읽히고, Q3 "따로 논다"·Q2 "없음"·Q1 "모르겠음"이면 반려, Q4 목록은 항목마다 수정 또는 사유 기록. 증거: `_ai/{char}-ep{N}-cold-read.md`. (결함 탐지용 — 점수로 합격 판정하지 않는다.)
- ⬜ Owner 대본 확정.

## B. 음성
- ⬜ TTS 스크립트 JSON 작성(A-3: 세그먼트 7~8어절, 읽는 표기, 숫자 고유어 한글, 어절 수 일치). `hookType` 필드도 넣는다.
- ⛔ `owl-tts --arm` — 래퍼가 대본 기준 검사를 먼저 돌린다(미통과면 음성 생성 안 됨). API 호출 횟수를 보고.
- ⬜ 씬별 rawAudioDurationSec 9.5초 이내 확인.

## C. 스펙·이미지
- ⬜ 스펙 `scripts/_{char}-ep{F}-assembly-spec.mjs`(직전 편 복사): hookType·sceneBackgrounds·shot/bg/motion·emphasisTerms·headerTitle. 대본은 TTS 스크립트에서 그대로.
- ⬜ **첫 3초 실험**(CURRENT_STANDARDS A-7 2-2): 스펙 `openingMotion`을 `pushin`/`impact` 중 직전 신작과 다른 값으로 지정하고 여기에 적는다: ______ (황소 22편부터, 21편·완성 재고는 none). 조립 후 첫 씬 프레임(0·0.4·1.5·3초)에서 팻말·글자가 안 잘렸는지 확인.
- ⬜ 보드·카드 구도 예방 문구(A-4·A-6: 카드 씬은 미디엄, 보드는 긴 다리 이젤, 황소+보드 묶음 폭 ≤76%).
- ⬜ **샘플 3장 먼저**(보드·카드·글자 없는 씬) → 안전선 시트 → 통과 후 나머지.
- 👁 안전선 시트(`run-safe-zone-preview-once.mjs`)에서 글자 좌우 끝이 주황선(12%·88%) 안인지 **씬마다** 기록(눈대중 "대부분 괜찮음" 금지).

## D. 영상
- ⬜ 영상 프롬프트 `build-video-generation-prompts.mjs`(8초/10초, 카드 씬 10초).
- ⬜ Owner 영상 생성 → 수령·파일명(숫자=씬 번호) → 해상도·길이 티어 확인.
- ⬜ 입 멈춤 `check-clip-speech-timing-once.mjs` + 경고 클립 프레임 확인.

## E. 조립·마감(A-7 한 번에)
- ⛔ **조립 전 TTS alignment 보정**(연속 TTS는 중간부터 0.6~0.9초 밀릴 수 있음, 12편 사고): `node scripts/fix-tts-alignment-from-audio-once.mjs --tts-summary … --tts-script …` → 보정되면 `…audio-fixed.json`·`…audio-fixed.alignment.json`을 조립·CTA 결합·QA에 사용(CTA `--scene8-start`·`--alignment`도 보정본 기준). 증거: 로그의 씬별 이동량.
- ⬜ 조립 → CTA 결합(`cta-join-report.json` PASS) → 워터마크 제거 → 오디오 마감(-14 LUFS).
- 👁 **자막-카드 겹침**(Owner 2026-10-02): QA가 만든 `qa/caption-card-*.png`(카드 씬마다 두 줄 자막이 뜬 순간)를 열어 `qa/edge-review.json`의 `captionOverlap`에 카드 씬마다 ok/over 기록(over = 자막이 카드 문구를 가리거나 카드 아래 모서리에 붙음). 새 체계 편은 자막 y=1360 고정이라 보통 ok.
- 👁 **제목·자막 크기·줄 수**(Owner 2026-10-02): 제목 문구는 바꾸지 말고 줄을 나눈다(최대 3줄, 줄별 실제 크기 ≥100px), 자막은 최대 2줄·96px(새 체계 편). 증거: QA 정보의 "제목 N줄, 실제 글자 …px" 한 줄 + 프레임 2~3장 육안.
- 👁 QA가 만든 `qa/edge-review-*.png`(원본 1:1)를 보고 `qa/edge-review.json`에 **씬마다** ok/over 기록(over = 주황 안전선 넘음).
- ⛔ **QA** `run-episode-qa-once.mjs` → 반드시 수정 0(대본 기준·훅·자막·싱크·워터마크·음량·edge-review 기록 포함).

## F. 자산·배포
- ⛔ 커버·스토리: 글자 없는 생성 → `run-cover-headline-overlay-once.mjs`(★규칙 30: 문구 = 영상 제목 그대로, 요약·축약 금지 / 140px 미만이면 실패 — 줄이지 말고 Owner에게 보고) → `.headline.json` 기록 생성.
- ⬜ 압축(35MB 이하) → 콘텐츠 유닛: `finalMasteredPath`·`qaReportPath`(필수), `youtubeTitle`에 #Shorts 없음.
- ⛔ **배포 전 게이트** `node scripts/run-deploy-preflight-once.mjs --content-unit <…>` — 게시 명령(릴스·스토리·유튜브)이 자동으로 다시 돌린다. 유튜브는 `--privacy public` 없으면, 릴스는 커버 merge 결과가 아니면 막힌다.
- ⬜ 배포는 **Owner 지시 시에만**(§5 순서). 부엉 배포 시점은 Owner가 정한다(제안 금지).
- ⬜ 게시 후: 링크를 §7·메모리에, 장부(`BULL_EPISODE_LEDGER`·`OWL_EPISODE_LEDGER`) 갱신·테스트. 유튜브 썸네일 반영(maxresdefault) 확인.

## 보고 형식(규칙 27)
- 단계별 ✅/❌/⛔통과 여부와 **증거**(명령·결과 파일), **검증한 것 / 못 본 것**을 나눠 적는다.

## D. 영상 검수 (2026-10-06 밤, Owner Veo 영상 17개 수령 — Downloads/1~17.mp4, 숫자=씬 번호)
- ✅ 17개 모두 720x1280·24fps·오디오 포함, 길이 티어 일치(8초 s2·s17 / 10초 15개), 모든 클립이 씬 길이보다 김, 카드 글자는 끝 프레임까지 보존(카드 씬 14개 전부), 카메라 줌·소품 이탈 없음, 배경 저울·파이 조각·상자에 숫자·글자 없음(시트 해상도 기준) — `C:/tmp/bull-ep22-videos-review/`(sheet_1~5, mouth_1~3, probe.json). 영상 파일 `C:/tmp/bull-ep22-videos/bull_ep22_s{N}_motion.mp4`.
- 👁 입 멈춤(`check-clip-speech-timing-once.mjs` 17개 중 16개 경고 — Veo 음성 길이 기준 추정치): 육안 — 꼬리 구간 대부분 부리 닫힘·경미 미소, s9는 이를 보이는 미소로 입이 벌어진 채 유지(보통), s2·s17 와이드 미소.

## E. 조립·CTA·마감·QA
- ✅ 정렬 밀림 점검: 최대 -0.28초(s10)·-0.24초(s11)이나 도구 판정 정상 → 보정 없음. QA 자막↔음성 대조 44곳 모두 끝까지 표시.
- ✅ 조립 `C:/tmp/bull-ep22-assembly-v1/owl_shorts_final.mp4` 120.5초(openingMotion **impact** 황소 첫 적용, 누적 오차 0, 컷 선행 0.10~0.14초, 자막 71블록).
- ⛔✅ CTA 결합(bull-cta-fixed-v6, `--scene8-start 120.44`, `--alignment elevenlabs-korean-director-fe525dd18e52b8.alignment.json`): cta-join-report **PASS**(프레임 3087/3087, 화면 128.63초 = 오디오 128.63초).
- ✅ 워터마크 제거(sparkle·veo_text) → 오디오 마감 `C:/tmp/bull-ep22-final/owl_episode_final_mastered.mp4` 128.7초 **56.0MB**, -15.1→**-14.2 LUFS / -0.9 dBTP**. `qa/watermark-check.png` 20지점 ✦ 잔여 없음(CTA 꼬리 포함 육안).
- ⛔✅ QA 첫 실행 must-fix 4(금지 경계 분할 3건 + edge-review 기록 누락) → ①자막 표기만 수정(s3 "18조 9천억 원 쯤이야", s7·s8 "원 어치를", 목소리·대본 불변) ②**육안 판정에서 s5·s9 카드(클로즈 샷)가 세로 65% 아래까지 내려와 자막이 둘째 줄을 덮음 발견**(이미지 시트 판정 때 "카드 42~60% 안"이라고 쓴 건 클로즈 샷 s5·s9에 대해 틀렸음) → 조립기에 스펙 옵션 `captionYShiftByScene` 추가(기본 0), 22편 `{5:28, 9:28}`로 두 씬 자막 28px 내림(아래 끝 1499px, QA 한계 1500) → 근접 크롭으로 카드 글자 전부 보임 확인. → edge-review.json 14씬 모두 ok(좌우 끝·자막 겹침) → 재실행 **반드시 수정 0**, 확인 권장 8(H4 긴장 단어 위치 2, 644자, "8일" 반복, 한 어절 0.36초 자막 "쯤이야"·0.45초 "삼성전자", 입 멈춤 16). 제목 108px×3줄, 자막 96px 최대 2줄. 보고서 `C:/tmp/bull-ep22-final/qa-report.md`.
- **못 본 것**: TTS 청취(이티에프·이십육점구팔퍼센트·이천구십팔억·사분의 일 읽기), 최종본 전체 재생, s5·s9 자막이 카드 아래 모서리에 닿는 정도가 화면에서 거슬리는지, 첫 3초 impact 효과가 자연스러운지(프레임 시퀀스는 안 봄).

## F. 커버
- ✅ 스펙 `scripts/_bull-cover-ep22-spec.mjs`(짙은 보틀 블루그린→로즈골드 글로우 요청, 결과는 짙은 청록→금빛 — 20편 포레스트→샴페인 골드와 비슷한 편, 황금 균형 저울 뒤에 두고 놀라 양손을 펴 무게 다는 포즈). 글자 없는 배경 `C:/tmp/bull-cover-ep22-raw/`(1차 성공) → 합성기 **제목 그대로(규칙 30)** "삼성전자 8일 / 규칙 때문에 / 팔린다" 154/165/165px(≥140), 세로 13.9~41.1% → `C:/tmp/bull-cover-ep22/00_bull_ep22_cover_thumb.png`(Owner에게 전송).
- ⬜ 압축·콘텐츠 유닛·배포 전 게이트 → **배포는 Owner 지시(10/7 저녁 6~7시 목표)**. 게시 직전 재확인: 서울경제 숫자(삼성증권 추산: 비중 26.98%·약 2,098억 매도·하이닉스 약 900억 매수·소부장 각 200억·27.5%)가 그대로인지, 삼성 잠정실적 공시 여부(공시됐다면 12·17번 표현 확인).
