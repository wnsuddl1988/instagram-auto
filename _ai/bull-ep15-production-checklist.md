# 황소특보 15편 제작 체크리스트 (파일 번호 15) — 규칙 23·26·27, 단계가 끝날 때마다 ✅/❌와 증거(명령·결과 파일)를 적는다
# 소재: 현대차 미국 신기록 vs 세계 판매 -16% (초안 [bull-ep15-hyundai-script-draft.md](bull-ep15-hyundai-script-draft.md))

> 새 편을 시작하면 이 파일을 `_ai/{char}-ep{N}-production-checklist.md`로 복사한다. ⛔ 표시는 **코드가 막는 게이트**(통과 못 하면 다음 단계 명령이 멈춘다), 👁 표시는 **사람이 눈으로 보고 기록을 남겨야 하는 단계**다. "확인했다"는 말 대신 증거(명령 출력·파일 경로)를 적는다. 못 본 것은 "못 봄"으로 적는다.

## 0. 시작 전 (매 편)
- ✅ CURRENT_STANDARDS를 **그 세션에서 직접 열어** 읽음(2026-10-02): 규칙 11·13·17·25·26·27·28·29, A-1~A-3, 황소 §3(구조 v3·성공 공식·엔딩). 증거: 이 세션 Read 기록.
- ✅ 표시 번호 15 = 파일 번호 15(황소는 표시=파일). 증거: 장부 14편까지 게시, `_bull-ep15-*` 파일 없음(스펙은 확정 후 생성).

## A. 소재·대본
- ✅ 소재 탐색: `run-bull-topic-full-scan-once.mjs --out-dir C:/tmp/bull-topic-scan-ep15` 11단계 전부 ✅(`SCAN_CHECKLIST.md`), 후보 35개 보고, Owner가 후보 3번 선택(2026-10-02).
- ✅ 담당 캐릭터 황소(투자자 입장)·쏠림 점검 8개 후보 실행(3번: 직전 14편과 같은 cause_explainer 레인 연속 경고, 표시만)·특보 근접도 상(24h).
- ✅ 팩트: 팩트표 [bull-ep15-hyundai-script-draft.md](bull-ep15-hyundai-script-draft.md) — 공식 판매 페이지·뉴스핌·파이낸셜뉴스·아시아경제·한국일보 원문, 작년 9월 몰림만 검색 요약(◐). 앞선 후보표의 "+15%"는 +13%로 정정, 기아 숫자·3위 추월·주가는 대본에서 제외.
- ✅ ⛔ **대본 기준 검사** `node scripts/check-script-standards.mjs --character bull --scenes C:/tmp/bull-ep15-draft/scenes-v4.json --hook-type T1` → **반드시 수정 0**·17씬·610자·확인 권장 2(H4 긴장 단어 위치, "9월" 표기 반복=시점). 결과 표는 보고에 첨부.
- ✅ 👁 검사기가 못 보는 것: 팩트·출처(팩트표) / 훅 H3 구체 대상=현대차 / 매수 암시 없음 / 종목 실명=현대차·현대차그룹만(기아·SKT 등 허용리스트 밖은 미사용) / 흐름은 새 독자 점검으로 확인.
- ✅ 👁 **새 독자 읽기 점검(규칙 29)**: 통과(Q3 "하나로 이어짐", Q2 결론 있음), Q4 6건 조치(v3→v4). 증거 [bull-ep15-cold-read.md](bull-ep15-cold-read.md). 결함 탐지용 — 반응 예측 아님.
- ⬜ Owner 대본 확정(각도 변경·훅 A/B·씬 12 — 초안 문서 "Owner 결정 필요").

## B. 음성
- ✅ TTS 스크립트 JSON `C:/tmp/money-shorts-os/bull-ep15-tts/bull-ep15-tts-script.json`(빌더 scratchpad `build-bull15-tts.mjs`): 어절 수 일치·세그먼트 ≤8어절·읽기에 숫자 없음·scenes-v4.json과 17/17 일치 검증 통과, `hookType: "T1"`.
- ✅ ⛔ `owl-tts --character bull --arm` — 래퍼의 대본 기준 검사 통과(반드시 수정 0) → **API 1/1**, 17씬, 타임라인 **118.36초**, 요약 `output-v1/elevenlabs-scene-paced-tts-summary.json`. (1차 시도는 경로의 `\`가 셸에서 사라져 래퍼가 시작 전에 `owl_tts_required_paths_invalid`로 중단 — API 호출 없음, 슬래시 경로로 재실행.)
- ✅ 씬별 rawAudioDurationSec 최대 7.88초(s4), 전부 9.5초 이내. 영상 길이 티어 후보(정규화 길이 8초 초과): s1 8.06·s4 8.80·s6 8.77·s7 8.18·s16 8.66 → 10초 클립, 나머지 8초 이하(카드·보드 씬은 10초 관례 — 영상 프롬프트 단계에서 확정).
- 👁 Owner 청취 확인 필요(`ownerListeningRequired`): "십육퍼센트"·"이십오점칠퍼센트"·"십삼점구퍼센트"·"아이오닉파이브"·"에스유브이"·"일월부터 구월까지" 읽기, 씬 4·9의 문장 길이.

## C. 스펙·이미지
- ✅ 스펙 `scripts/_bull-ep15-assembly-spec.mjs`(BULL_EP15_ASSEMBLY_SPEC, 14편 복사): hookType T1, 배경 A 유리 외벽 자동차 쇼룸·B 친환경차 충전·정비 허브·C 연휴 한낮 공장 아트리움(직전 11~14편과 겹치지 않음, 글자·숫자·로고·번호판 없음), 17씬 shot(medium 11·wide 5·close 1)·모션(카드 11·보드 3·오픈 3)·구역(A7·B5·C5), 헤더 3줄 '현대차 미국/신기록인데/세계는 -16%'(줄당 6·5·8자), 오프닝 B안. **TTS 스크립트와 17/17 일치, 같은 구역 같은 샷 3연속 없음**(`verify-bull15-spec.mjs`), 검사기 `--spec-module` 반드시 수정 0·610자. (s13은 보드 구도 탈락으로 카드로 바꿔 최종 shot medium 12·wide 4·close 1, 모션 카드 12·보드 2(s7·s15)·오픈 3 — C장 샘플 기록 참고.)
- ✅ 보드·카드 구도 예방 문구 적용(카드 씬 미디엄, 보드 긴 다리 이젤, 황소+보드 묶음 폭 ≤76%, 글자는 짧게).
- ✅ **샘플 3장 먼저**(s1 카드·s7 보드·s11 글자 없는 클로즈, `C:/tmp/bull-ep15-images/`, ChatGPT 자동화 `--scene-spec-only 1,7,11`): 안전선 시트 `safe-zone-sheet-samples.png` 통과(s7 글자 끝 약 86% < 88%). s1은 황소가 세로 약 67%(14편 s1 약 51%, 미디엄 기준 45~50% 초과)라 **1회 재생성** → 재생성본도 약 66%로 개선 없음(모델이 크기 지시를 무시, 14편 s8도 67%로 통과한 전례) → 카드가 더 위에 있고 글자가 깨끗한 **1차본 채택**(`bull_ep15_s1_try1.png`=채택본, `_try2`=보관). 통과 후 나머지 14장을 5장씩 3묶음으로 생성(`--scene-spec-only 2,3,4,5,6 / 8,9,10,12,13 / 14,15,16,17`, 한 번에 10분 제한 때문).
- 👁 안전선 시트 `C:/tmp/bull-ep15-images/safe-zone-sheet-all.png` 씬별 판정(1:1 원본 확인은 s1·s6·s7·s11·s13·s14·s15, 나머지는 시트 눈대중): s1 카드 ✅(카드 가로 약 26~74%, 세로 48~62%, 글자 52~60%) · s2 오프닝 글자 없음 ✅ · s3 카드 ✅ · s4 카드 ✅ · s5 카드 ✅ · s6 카드 ✅(글자 끝 약 70%) · s7 와이드 보드 ✅(글자 52~86%, 보드 틀 약 89%는 크롭선 근처) · s8 카드 ✅ · s9 카드 ✅ · s10 카드 ✅ · s11 close 글자 없음 ✅ · s12 카드 ✅ · **s13 와이드 보드 탈락**(글자 끝 약 91% > 크롭선 90%, 보드 틀 약 95%) → **카드로 전환(스펙 s13 수정: card2·medium) 후 재생성 통과**(카드 가로 약 29~68%, 글자 세로 56~63%, 자막 시작 약 71%와 간격 있음, 실패본 `bull_ep15_s13_board_failed.png`) · s14 카드 ✅ · s15 와이드 보드 ✅(글자 끝 약 84%, 보드 틀 약 87%) · s16 카드 ✅ · s17 글자 없음 ✅. 못 본 것: 1:1을 안 본 씬(s2·s3·s4·s5·s8·s9·s10·s12·s16·s17)의 배경 속 작은 글자·숫자·로고 유무, 카드 글자 오타(시트 해상도에서는 모두 맞게 읽힘), 황소 크기가 대체로 세로 약 65%로 미디엄 기준보다 큼(14편과 같은 수준).

## D. 영상
- ✅ 영상 프롬프트 `_ai/bull-ep15-video-generation-prompts.md`(`build-video-generation-prompts.mjs`, 74,323자): **8초 3개(s2·s11·s17, 소품 없는 씬) / 10초 14개(카드·보드 씬 전부)**, 원본 정렬 TTS 요약 기준(`elevenlabs-scene-paced-tts-summary.json`), 입 멈춤 시각·FINAL REMINDER 포함. 금지어 점검: "glued" 없음, 나레이션 영상에 "Silent" 지시 없음(마지막 구간 "silent" 문구는 14편과 같은 표준 블록). 이번 편도 `--pilot-dialogue`는 쓰지 않았다(12~14편과 동일).
- ✅ Owner 영상 17개 수령(`C:/Users/PC/Downloads/1~17.mp4` → `C:/tmp/bull-ep15-videos/bull_ep15_s{N}_motion.mp4` 복사): **17개 모두 720x1280·24fps·오디오 있음, 길이 티어 일치**(s2·s11·s17 8.00초, 나머지 10.01초), 전부 TTS 발화보다 길다. 프레임 시트 `C:/tmp/bull-ep15-videos-review/sheet_1~4.png`(씬당 시작·발화 중반·발화 끝+0.4초·끝 직전 4장): **카드·보드 글자 전부 끝 프레임까지 보존**(카드 s1·3·4·5·6·8·9·10·12·13·14·16, 보드 s7·s15), 소품 이탈·카메라 줌·캐릭터 붕괴·배경 이탈 없음. 보드 s7·s15는 2~7초 프레임 3장씩 오른쪽 50% 확대+안전선(주황 88%·빨강 90%) 겹쳐 확인(`edge_s7.png`·`edge_s15.png`): **글자 끝 s7 약 86%·s15 약 84% — 안전선 안**, 보드 움직임 없음. Veo 워터마크는 조립 단계에서 제거(규칙 18).
- 👁 입 멈춤 `check-clip-speech-timing-once.mjs`: **경고 17개/17개**(Veo 음성이 TTS 발화 끝보다 +0.97~7.25초, 12~14편과 같은 패턴 — 추정치). 화면에 실제로 보이는 꼬리 구간(발화 끝~씬 컷 0.27~1.16초) 얼굴 확대 시트 `mouth_sheet_1~3.png`·`mouth_s17.png` 눈 판정: **입 닫힘 s3·s15·s17** / **경미(꼬리 초반에만 열렸다 닫힘·미소·눈 깜빡임) s1·s2·s4·s5·s7·s8·s10·s12·s13·s16** / **보통(꼬리 상당 구간 입이 열린 미소) s6(0.99초 중 약 0.7초)·s9(1.00초 내내)·s11(클로즈, 1.16초 중 약 0.7초)·s14(꼬리 후반 열림)**. 판정: 경미 이하는 통과, 보통 4개는 Owner 판단(그대로/재생성). 14편은 경미 이하 13·보통 3(s5·s6·s12)이었다. 문구 강화 효과는 이번에도 확인되지 않음(경고 건수 변화 없음).

## E. 조립·마감(A-7 한 번에)
- ✅ ⛔ **조립 전 TTS alignment 점검 결과(2026-10-02)**: `fix-tts-alignment-from-audio-once.mjs` → s1~s17 이동 0~-0.12초 **정상, 보정할 씬 없음 → 원본 정렬 그대로 사용**(보정본 파일 없음, 조립·CTA·QA 모두 원본 summary·alignment 기준). 아래는 절차 원문: **조립 전 TTS alignment 보정**(연속 TTS는 중간부터 0.6~0.9초 밀릴 수 있음, 12편 사고): `node scripts/fix-tts-alignment-from-audio-once.mjs --tts-summary … --tts-script …` → 보정되면 `…audio-fixed.json`·`…audio-fixed.alignment.json`을 조립·CTA 결합·QA에 사용(CTA `--scene8-start`·`--alignment`도 보정본 기준). 증거: 로그의 씬별 이동량.
- ✅ 조립(`C:/tmp/bull-ep15-assembly-v1/owl_shorts_final.mp4`, 원본 summary·alignment, **씬 전환 싱크 누적 오차 0·컷 리드 0.10~0.14초**, 118.4초, 자막 67블록 최대 8어절) → CTA 결합(`--scene8-start 118.375`, 원본 alignment `elevenlabs-korean-director-ca835d3bcbbcce.alignment.json`, `bull_cta_fixed_final_layout_v2.mp4`; **cta-join-report frameCheck 3037/3037 PASS·avLengthCheck PASS, 126.54초**, 전환 프레임 4장 확인 `C:/tmp/bull-ep15-final/cta-check-frames.png`) → 워터마크 제거(sparkle·veo_text 2곳, `qa/watermark-check.png`에서 ✦·"Veo" 없음 확인) → 오디오 마감(입력 -14.5 LUFS/-0.4dBTP → **-14.2 LUFS/-0.9dBTP**). 최종 `C:/tmp/bull-ep15-final/owl_episode_final_mastered.mp4`(126.6초). 보통 판정 4개(s6·s9·s11·s14)는 Owner 의견 요청에 재생성 지시가 없어 **그대로 진행**(14편 전례, 2026-10-02 Owner "1번 진행 후 2번까지"로 해석).
- 👁✅ **자막-카드 겹침** 판정 14씬 모두 ok(`qa/caption-card-1~3.png` 육안, 자동 윗줄 최소 y=1257px·아래 끝 최대 y=1471px; s12·s13은 자막과 카드 아래 모서리 간격이 좁지만 카드 문구를 가리지 않음). 절차 원문: **자막-카드 겹침**(Owner 2026-10-02): QA가 만든 `qa/caption-card-*.png`(카드 씬마다 두 줄 자막이 뜬 순간)를 열어 `qa/edge-review.json`의 `captionOverlap`에 카드 씬마다 ok/over 기록(over = 자막이 카드 문구를 가리거나 카드 아래 모서리에 붙음). 새 체계 편은 자막 y=1360 고정이라 보통 ok.
- 👁✅ 제목 3줄 실제 글자 108·108·108px, 자막 96px·최대 2줄(QA 정보), 완성본 안전선 시트 `qa/safe-video.png` 8시점 육안(헤더 3줄·자막 2줄·마지막 씬 리스크 고지·CTA 구간 정상). 절차 원문: **제목·자막 크기·줄 수**(Owner 2026-10-02): 제목 문구는 바꾸지 말고 줄을 나눈다(최대 3줄, 줄별 실제 크기 ≥100px), 자막은 최대 2줄·96px(새 체계 편). 증거: QA 정보의 "제목 N줄, 실제 글자 …px" 한 줄 + 프레임 2~3장 육안.
- 👁✅ `qa/edge-review.json` 14씬(s1·3·4·5·6·7·8·9·10·12·13·14·15·16) 모두 ok(`edge-review-1~4.png` 원본 1:1 육안: s7 보드 글자 끝이 안전선 앞, s15 보드 글자·틀 모두 안전선 안, 나머지는 가장자리에 글자 없음).
- ⛔✅ **QA** `run-episode-qa-once.mjs`: 1차 반드시 수정 1(보드·카드 14씬 글자 좌우 끝 판정 기록 없음 — 게이트 정상 작동) → `qa/edge-review.json`(씬별 ok·자막 겹침 ok 기록) 작성 후 **2차 반드시 수정 0·확인 권장 4**(H4 긴장 단어 위치 2건·"9월" 표기 반복=시점·입 멈춤 경고 17). 음량 -14.2 LUFS, 자막-음성 대조 35곳 모두 끝까지 표시, 워터마크 제거 표식 확인. 리포트 `C:/tmp/bull-ep15-final/qa-report.md`.

## F. 자산·배포
- ⛔✅ 커버(스토리·썸네일 겸용): 스펙 `scripts/_bull-cover-ep15-spec.mjs`(에스프레소 브라운→앰버 크림+하늘색 상승·하강 리본, 턱을 괴고 놀란 표정, 14편 흑연→은빛 화이트와 겹치지 않음) 글자 없는 배경 생성(`C:/tmp/bull-cover-ep15-src/`, 1차 통과) → 합성기 1차 "미국은 신기록/세계는 -16%"는 출력 폴더 없음 오류와 첫 줄 138px(<140) 예상으로 중단 → "미국 신기록/세계는 -16%"로 **164/146px 통과**, 세로 16.6~34.4%, `C:/tmp/bull-cover-ep15/00_bull_ep15_cover_thumb.png`(`.headline.json` 생성). 스토리는 커버로 통일.
- ✅ 압축 `C:/tmp/bull-ep15-publish/owl_episode_final_compressed.mp4`(1900k, **29.4MB**(30,809,617바이트), 1080x1920, 126.6초, 오디오) → 콘텐츠 유닛 `C:/tmp/bull-ep15-publish/owl-content-unit.json`(캡션 663자·해시태그 11개, 추천 아님 고지·수치 정정 가능·집계 기준 차이 명시, 기아·SKT 등 허용리스트 밖 종목 실명 없음, `youtubeTitle` #Shorts 없음, `finalMasteredPath`·`qaReportPath` 포함).
- ⛔✅ **배포 전 게이트 통과**: 실패 0·경고 0·통과 7(필수 필드 8개, 제목 #Shorts 없음, 캡션 663자·해시태그 11개, 완성본 126.6초·워터마크 표식, QA 반드시 수정 0, 업로드 영상 29.4MB·9:16·오디오, 커버 164/146px). 게시 명령(릴스·스토리·유튜브)이 자동으로 다시 돌린다. 유튜브는 `--privacy public` 없으면, 릴스는 커버 merge 결과가 아니면 막힌다.
- ✅ **배포 완료(2026-10-02, Owner "15편 배포해줘")**: Blob 업로드 3건(영상 30,809,617B·커버·스토리 이미지) → **커버 merge** → 릴스 게시(로그 `coverUrl:` 실제 URL 확인, HTTP 200 image/png) `https://www.instagram.com/reel/Dd_OA9sCSFH/`(mediaId 17988300732063871) → 스토리 게시(`--approval` 없이, mediaId 17956449090081747, 24시간 후 만료) → 유튜브 `--privacy public` `https://www.youtube.com/shorts/Lk0GUQuMhiE`(썸네일 `set`, 제목 #Shorts는 업로드 스크립트가 자동 추가). 결과 기록 `C:/tmp/bull-ep15-publish/`. 장부 15편 추가·테스트 14/14.
- ✅ **유튜브 썸네일 확인(Owner 요청 "잘 체크")**: 로그 `썸네일 설정 완료(1080x1920 리사이즈)` → 저장 직후 `i.ytimg.com/vi/Lk0GUQuMhiE/maxresdefault.jpg` 직접 내려받아 확인(200, 137,161B): **우리 커버가 가운데, 양옆은 흐림으로 정상 저장**. 세로 쇼츠 칸용 `oar1.jpg`는 업로드 직후 **404**(처리 뒤 생김 — 게시 후 재확인). 비교용으로 14편 `oar1.jpg`를 받아 보니 200이지만 **커버가 아니라 영상 프레임(오프닝 씬)**이 자동 선택돼 있음 → "썸네일이 안 들어간다"의 원인은 업로드 실패가 아니라 쇼츠 세로 칸이 커버 대신 영상 프레임을 쓰는 유튜브 구조(API로 못 바꿈, Studio 수동). 이번에도 Studio 조작은 하지 않았다.
- (옛 문구) 배포는 **Owner 지시 시에만**(§5 순서). 게시 전 확인: 포드의 미국 3분기 실제 발표(10/2)가 확정되면 "현대차그룹 미국 3위 첫 추월" 사실 여부 재확인(대본·캡션엔 미포함), 현대차 3분기 실적 발표일. 게시 후: 링크를 §7·메모리에, 장부(`BULL_EPISODE_LEDGER` 15편 추가)·테스트 갱신, 유튜브 썸네일 반영 확인.
- ⬜ 게시 후: 링크를 §7·메모리에, 장부(`BULL_EPISODE_LEDGER`·`OWL_EPISODE_LEDGER`) 갱신·테스트. 유튜브 썸네일 반영(maxresdefault) 확인.

## 보고 형식(규칙 27)
- 단계별 ✅/❌/⛔통과 여부와 **증거**(명령·결과 파일), **검증한 것 / 못 본 것**을 나눠 적는다.
