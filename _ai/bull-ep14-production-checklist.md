# 황소특보 14편 제작 체크리스트 (파일 번호 14) — 마이크론 역대급 실적인데 주가는 안 움직인 이유 × 삼성전자·SK하이닉스 3분기 —(소재 교체: 증권사 리포트×수출은 Owner '안 와닿는다' 지적으로 폐기, 문서 보관) — — 규칙 23·26·27, 단계가 끝날 때마다 ✅/❌와 증거(명령·결과 파일)를 적는다

> 새 편을 시작하면 이 파일을 `_ai/{char}-ep{N}-production-checklist.md`로 복사한다. ⛔ 표시는 **코드가 막는 게이트**(통과 못 하면 다음 단계 명령이 멈춘다), 👁 표시는 **사람이 눈으로 보고 기록을 남겨야 하는 단계**다. "확인했다"는 말 대신 증거(명령 출력·파일 경로)를 적는다. 못 본 것은 "못 봄"으로 적는다.

## 0. 시작 전 (매 편)
- ✅ (2026-10-02) CURRENT_STANDARDS를 **그 세션에서 직접 열어** 읽음(규칙 11·13·17·22·25·28, A-1~A-3, 황소 §3 구조 v3·성공 공식·소재): 최우선 규칙(1~27) → A-2 → 캐릭터 섹션(부엉 §1 / 황소 §3) → §7 재고·다음 번호. 요약 메모리로 대신하지 않는다(규칙 26).
- ✅ 황소 14편 = 파일 ep14(13편 배포 완료·장부 13편까지). 스펙 파일은 아직 없음. 표시 번호 ↔ 파일 번호 확인(§7 표). 같은 파일 번호를 다른 소재가 쓰고 있지 않은지 `ls scripts/_{char}-*ep{F}*`로 확인.

## A. 소재·대본
- ✅ 소재 탐색(2026-10-02 새벽): 황소 오케스트레이터 **새로** 실행 11단계 전부 ✅ `C:/tmp/bull-topic-scan-ep14/SCAN_CHECKLIST.md`, 후보 42개 추천순위 보고 → Owner가 1+2번 결합 선택 → 대본이 안 와닿는다는 지적 → **Owner '3번 마이크론으로 교체해서 진행해'(9편 후속 승인)**. 오케스트레이터 **새로** 실행(규칙 25) — 황소 `node scripts/run-bull-topic-full-scan-once.mjs` / 부엉 `node scripts/run-owl-topic-full-scan-once.mjs`. SCAN_CHECKLIST.md를 보고에 첨부.
- ✅ 담당 황소(투자자 입장), 특보 근접도 상(9/30 현지 발표·10/1 반응). 마이크론 소재는 9편 후속(9편 마지막 씬이 '결과 나오면 다시 짚어줄게'를 약속)이라 중복이지만 Owner 승인, 반도체 계열 3편째(표시만). 담당 캐릭터(규칙 22)·쏠림 점검(mix-check)·특보 근접도/대상 폭·체감 크기(규칙 11·13).
- ✅ 팩트(`_ai/bull-ep14-micron-script-draft.md` 출처 표): 서울신문·파이낸셜뉴스·이데일리·블록미디어·뉴시스 원문 + 복수 매체. **못 봄: 마이크론 IR 원문, 10/1 미국 정규장 이후 주가, 시간외 등락률은 출처 간 불일치(훅에 숫자 미사용).** 팩트: 공식 원문 우선, 출처 2곳 이상, 불일치 수치는 제외 목록에 기록. 정부 제도명 운영 여부 확인.
- ⛔✅ **대본 기준 검사(마이크론) v3: 반드시 수정 0 · 확인 권장 1 · 통과 16**(617자, 16씬, 최대 9.2초, `C:/tmp/bull-ep14-draft/micron-scenes-v3.json`; v1은 5개 씬 9.5초 초과, v2는 6번 9.8초로 막혀 줄임). **대본 기준 검사** `node scripts/check-script-standards.mjs --character {owl|bull} --scenes <scenes.json> --hook-type T#` → 반드시 수정 0. 결과 표를 대본 문서와 보고에 붙인다. (통과 못 하면 TTS 게이트가 막는다.)
- 👁✅ 직접 대조(대본 문서 '사람이 대조한 것'): H3 주어 '마이크론', 매수 암시·목표가 없음, 시간외 숫자는 출처 불일치라 '거의 안 움직였어'로 표현, 전망치는 '전망'으로 명시. 검사기가 못 보는 것 직접 대조 후 기록: 팩트·출처 / 훅 H3(구체 대상) / 매수 암시·종목 실명(황소) / 흐름.
- ✅ **Owner 대본 확정 + 오프닝 B안**(2026-10-02 "대본확정하고 오프닝 B안으로 진행하자"; 먼저 "어제는 내렸으나 오늘은 2% 이상 올랐어"를 반영해 v6로 개정 — 최종 16씬·591자 반드시 수정 0·확인 권장 2·통과 15, `C:/tmp/bull-ep14-draft/micron-scenes-v6.json`). 검사기 오프닝 규칙을 같은 날 수정(옛·새 문구 둘 다 인정, 자체 테스트 17/17, CURRENT_STANDARDS §3 표·owner-rule-provenance 갱신).

## B. 음성
- ✅ TTS 스크립트 JSON `C:/tmp/money-shorts-os/bull-ep14-tts/bull-ep14-tts-script.json`(빌더 scratchpad `build-bull14-tts.mjs`): 어절 수 일치·세그먼트 ≤8어절·읽기에 숫자 없음 검증 통과, `hookType: "T1"`. (A-3: 세그먼트 7~8어절, 읽는 표기, 숫자 고유어 한글, 어절 수 일치). `hookType` 필드도 넣는다.
- ⛔✅ `owl-tts --character bull --arm` — 래퍼의 대본 기준 검사 통과(반드시 수정 0) → **API 1/1**, 16씬, 타임라인 **119.80초**, 요약 `output-v1/elevenlabs-scene-paced-tts-summary.json`.
- ✅ 씬별 rawAudioDurationSec 최대 **7.85초(s1)**, 전부 9.5초 이내(s1 7.85·s2 3.57·s3 7.44·s4 5.32·s5 6.58·s6 7.39·s7 7.33·s8 7.46·s9 6.37·s10 6.73·s11 5.93·s12 7.36·s13 6.57·s14 6.99·s15 6.51·s16 7.49).
- ⛔✅ **정렬 밀림 점검**(`fix-tts-alignment-from-audio-once.mjs`): s1~s13 정상(이동 -0.24~0.06초), **s14·s15·s16이 +0.58초 밀림 → 보정**(`…d0819fab79faef.audio-fixed.alignment.json`, `…summary.audio-fixed.json`; **조립·CTA 결합은 보정본 사용**). 보정 도구 결함 2건 수정(s15 이동 1.48초·발화끝이 s16 안으로 들어가는 가짜 결과 → 이동량 탐색을 앞 씬 ±0.8초로 제한 + 멀수록 감점). 회귀: 13편 '보정할 씬 없음', 12편 s13~s16 보정 유지. s15 발화끝 111.303초 = 오디오 무음 경계(111.30)와 일치 확인.
- 못 들음: 음성 자연스러움(Owner 청취 전).

## C. 스펙·이미지
- ✅ 스펙 `scripts/_bull-ep14-assembly-spec.mjs`(BULL_EP14_ASSEMBLY_SPEC, 13편 복사): hookType T1, 배경 A AI 데이터센터 복도·B 웨이퍼 클린룸 전시관·C 아침 햇살 식물 라운지(직전 편들과 겹치지 않음, 글자·숫자 없음), 16씬 shot(wide 6·medium 9·close 1)·모션(카드 6·보드 7·open 3), 헤더 3줄 '마이크론 역대급/실적인데 주가/내렸다 올랐다'(줄당 7자), 오프닝 B안. **TTS 스크립트와 16/16 일치, 같은 구역 같은 샷 3연속 없음, 검사기 반드시 수정 0**(`verify-bull14-spec.mjs`). (스펙 규칙: 직전 편 복사): hookType·sceneBackgrounds·shot/bg/motion·emphasisTerms·headerTitle. 대본은 TTS 스크립트에서 그대로.
- ✅ 보드·카드 구도 예방 문구 적용(카드 씬 미디엄, 보드 긴 다리 이젤, 황소+보드 묶음 폭 ≤76%, 보드 글자는 짧게).
- ✅ **샘플 3장 먼저**(s1 카드·s3 보드·s12 글자 없음, `C:/tmp/bull-ep14-images/`): s1·s12 1차 통과, **s3 보드 3회 탈락**(오른쪽 배치 2회: 보드 끝 90%+, 좌우 반전 1회: 글자 시작 10.2%) → **카드 구도로 전환해 통과**(카드 가로 32~66%, 세로 53~61%). 통과 후 나머지 13장 생성(Owner "대본확정하고 오프닝 B안으로 진행하자"의 '진행' 범위로 해석).
- 👁 안전선 시트 `C:/tmp/bull-ep14-images/safe-zone-sheet-all.png` 씬별 판정(1:1 원본 확대는 s3·s8·s11만, 나머지는 시트 눈대중): s1 카드 ✅ · s2 오프닝 글자 없음 ✅ · s3 카드 ✅(카드 글자가 다소 작은 편) · s4 와이드 보드(frame 약 49~87%, 글자 끝 약 85%) ✅ · s5 카드 ✅ · s6 보드(frame 53~87.5%, 글자 끝 약 84%, 글자 작음) ✅ · s7 카드 ✅ · **s8 보드 2회 탈락**(오른쪽 배치: 글자 끝 92%, 좌우 반전: 글자 시작 10.8%) → **카드로 전환해 통과**(카드 25~75%, 글자 30~71%, 세로 47~60%, 황소가 큼 약 67%) · s9 와이드 보드(글자 53~85%, 글자 작음) ✅ · s10 카드 ✅ · **s11 와이드 보드 아슬아슬 통과**(글자 끝 87.5% < 88%, 보드 틀 91%는 크롭선 걸림 — Veo 후 글자 끝 재측정, 필요 시 edgefix) · s12 close 글자 없음 ✅ · s13 카드 ✅ · s14 와이드 보드 ✅(왼쪽 손가락이 크롭선 근처) · s15 카드 ✅ · s16 글자 없음 ✅. 못 본 것: 시트 해상도라 배경 속 작은 글자·숫자 유무, s6·s9 보드 글자가 작아 영상에서 뭉개지는지.

## D. 영상
- ✅ 영상 프롬프트 `_ai/bull-ep14-video-generation-prompts.md`(8초 1개 s2 / 10초 15개, 보정본 TTS 기준 `summary.audio-fixed.json`, 카드·보드 씬 전부 10초).
- ✅ Owner 영상 16개 수령(`C:/Users/PC/Downloads/1~16.mp4` → `C:/tmp/bull-ep14-videos/bull_ep14_s{N}_motion.mp4` 복사): **16개 모두 720x1280·24fps·오디오 있음, 길이 티어 일치**(s2 8.00초, 나머지 10.03초), 전부 TTS 발화보다 길다. 프레임 시트 `C:/tmp/bull-ep14-videos-review/sheet_1~4.png`(씬당 시작·중반·끝): **카드·보드 글자 전부 보존**(s1·3·5·7·8·10·13·15 카드, s4·6·9·11·14 보드), 캐릭터·배경 일관, 구도 이탈 없음. 보드 5개(s4·6·9·11·14)를 3초·6초 프레임으로 안전선 시트 `edge3-sheet.png`·`edge6-sheet.png` 확인: **글자 끝 모두 안전선 안**(s11 약 86%), 보드가 움직이지 않음. Veo 워터마크(✦)가 우하단에 보임 → **조립 단계에서 제거(규칙 18)**.
- 👁✅ 입 멈춤 `check-clip-speech-timing-once.mjs`(보정본 summary 기준): **경고 15개/16개**(Veo 음성이 TTS 발화 끝보다 +0.6~4.4초, s14만 OK) — 추정치라 화면에 보이는 꼬리 구간(발화 끝~씬 컷, 0.28~1.1초) 프레임 `mouth/window_1~4.png`을 눈으로 확인: **입 닫힘 s13·s14**, **살짝 열림·미소(경미) s1·s3·s4·s7·s8·s9·s10·s11·s15·s16**, **보통(입이 크게 열려 말하는 듯) s5(컷 직전 0.3초 활짝)·s6(꼬리 0.9초 내내 열린 미소)·s12(클로즈업, 꼬리 0.7초 열림)**. 판정: 경미 이하는 통과, s5·s6·s12는 Owner 판단(재생성 or 그대로).

## E. 조립·마감(A-7 한 번에)
- ⛔✅ **조립 전 TTS alignment 보정**(2026-10-02, s14~s16 +0.58초 → 보정본 사용, 결함 수정 포함 — B장 기록). **조립 전 TTS alignment 보정**(연속 TTS는 중간부터 0.6~0.9초 밀릴 수 있음, 12편 사고): `node scripts/fix-tts-alignment-from-audio-once.mjs --tts-summary … --tts-script …` → 보정되면 `…audio-fixed.json`·`…audio-fixed.alignment.json`을 조립·CTA 결합·QA에 사용(CTA `--scene8-start`·`--alignment`도 보정본 기준). 증거: 로그의 씬별 이동량.
- ✅ 조립(`C:/tmp/bull-ep14-assembly-v1/owl_shorts_final.mp4`, 보정본 summary, 씬 전환 싱크 누적 오차 0·컷 리드 0.10~0.14초, 119.8초) → CTA 결합(`--scene8-start 119.815`, 보정 alignment, `bull_cta_fixed_final_layout_v2.mp4`; **cta-join-report frameCheck 3071/3071 PASS·avLengthCheck PASS, 127.96초**, 전환 프레임 4장 확인) → 워터마크 제거(sparkle·veo_text 2곳, 5시점 우하단 확인) → 오디오 마감(입력 -15.5 LUFS/-0.4dBTP → **-14.3 LUFS/-0.9dBTP**). 최종 `C:/tmp/bull-ep14-final/owl_episode_final_mastered.mp4`.
- 👁✅ **자막-카드 겹침** 판정 13씬 모두 ok(`qa/caption-card-1~3.png`, 자동 윗줄 최소 y=1257px·아래 끝 최대 y=1471px; s13은 간격이 좁지만 가리지 않음). **자막-카드 겹침**(Owner 2026-10-02): QA가 만든 `qa/caption-card-*.png`(카드 씬마다 두 줄 자막이 뜬 순간)를 열어 `qa/edge-review.json`의 `captionOverlap`에 카드 씬마다 ok/over 기록(over = 자막이 카드 문구를 가리거나 카드 아래 모서리에 붙음). 새 체계 편은 자막 y=1360 고정이라 보통 ok.
- 👁✅ 제목 3줄 실제 글자 108·108·108px, 자막 96px·최대 2줄(QA 정보). **제목·자막 크기·줄 수**(Owner 2026-10-02): 제목 문구는 바꾸지 말고 줄을 나눈다(최대 3줄, 줄별 실제 크기 ≥100px), 자막은 최대 2줄·96px(새 체계 편). 증거: QA 정보의 "제목 N줄, 실제 글자 …px" 한 줄 + 프레임 2~3장 육안.
- 👁✅ `qa/edge-review.json` 13씬(s1·3·4·5·6·7·8·9·10·11·13·14·15) 모두 ok(원본 1:1 시트 4장 + s11 우측 확대 측정: 글자 끝 946px=87.6%, 안전선 950px보다 4px 안쪽, 보드 틀은 약 91%로 크롭선에 걸림).
- ⛔✅ **QA** `run-episode-qa-once.mjs`: 1차 반드시 수정 2(자막 "77조 || 2천억" 분할·edge-review 기록 없음) → 기록 작성 + 스펙 `captionBoundaryExceptions`(사유: "77조 2천억 원이야" 792px가 폭 한도 760px 초과, TTS 재생성 회피)로 이 한 곳만 예외 승인(QA가 경고로 남김, 규칙 자체·회귀 테스트 31/31 유지) → **2차 반드시 수정 0·확인 권장 6**(H4·591자·예외 승인·0.6초 미만 '삼성전자' 0.38s·입 멈춤 경고 15). 음량 -14.3 LUFS, 자막-음성 대조 48곳 모두 끝까지 표시.

## F. 자산·배포
- ⛔✅ 커버(스토리·썸네일 겸용): 스펙 `scripts/_bull-cover-ep14-spec.mjs`(흑연→은빛 화이트+골드, 깜짝 놀란 표정) 글자 없는 배경 생성(`C:/tmp/bull-cover-ep14-src/`) → 합성기 1차 "역대급 실적인데/주가가 내렸다?" 119/127px로 **실패(140px 미만)** → "역대급 실적/주가는 왜?"로 **164/179px 통과**, 세로 15.8~35.3%, `C:/tmp/bull-cover-ep14/00_bull_ep14_cover_thumb.png`(`.headline.json` 생성). 스토리는 커버로 통일. (옛 문구:) 커버·스토리: 글자 없는 생성 → `run-cover-headline-overlay-once.mjs`(줄당 8자 이하, 140px 미만이면 실패) → `.headline.json` 기록 생성.
- ✅ 압축 `C:/tmp/bull-ep14-publish/owl_episode_final_compressed.mp4`(1900k, 29.9MB, 1080x1920·127.96초·오디오) → 콘텐츠 유닛 `C:/tmp/bull-ep14-publish/owl-content-unit.json`(캡션 736자·해시태그 11개, 추천 아님 고지, 시간외 등락률은 출처·시점마다 다름 명시, `youtubeTitle` #Shorts 없음, `finalMasteredPath`·`qaReportPath` 포함). (옛 문구:) 압축(35MB 이하) → 콘텐츠 유닛: `finalMasteredPath`·`qaReportPath`(필수), `youtubeTitle`에 #Shorts 없음.
- ⛔✅ **배포 전 게이트 통과**: 실패 0·경고 0·통과 7(필수 필드 8개, 제목 #Shorts 없음, 캡션 736자·해시태그 11개, 완성본 128.0초·워터마크 표식, QA 반드시 수정 0, 업로드 영상 29.9MB·9:16·오디오, 커버 164/179px). **배포 전 게이트** `node scripts/run-deploy-preflight-once.mjs --content-unit <…>` — 게시 명령(릴스·스토리·유튜브)이 자동으로 다시 돌린다. 유튜브는 `--privacy public` 없으면, 릴스는 커버 merge 결과가 아니면 막힌다.
- ✅ **배포 완료(2026-10-02, Owner "14편 배포해줘")**: Blob 업로드 3건(영상·커버·스토리 이미지) → **커버 merge** → 릴스 게시(로그 `coverUrl:` 실제 URL 확인) `https://www.instagram.com/reel/Dd-AhpPDFh2/`(mediaId 18121683223938411) → 스토리 게시(`--approval` 없이, mediaId 18077006849419850, 24시간 후 만료) → 유튜브 `--privacy public` `https://www.youtube.com/shorts/IWe9UxbyqEc`(썸네일 set, 제목 #Shorts는 업로드 스크립트가 자동 추가). 결과 기록 `C:/tmp/bull-ep14-publish/`. (옛 문구:) 배포는 Owner 지시 시에만(§5 순서).
- ✅ 게시 후: 장부 `BULL_EPISODE_LEDGER` 14편 추가(cause_explainer·event·semiconductor·question) + `check-source-facts-bull-topic-lanes.mjs` 기대값 갱신 14/14 통과. 유튜브 썸네일: maxresdefault 200(140,847B) 반영 확인, `oar1.jpg`는 404(업로드 직후 — 처리 뒤 생성되는지 수 시간 후 재확인). (옛 문구:) 게시 후 장부 갱신·테스트.

## 보고 형식(규칙 27)
- 단계별 ✅/❌/⛔통과 여부와 **증거**(명령·결과 파일), **검증한 것 / 못 본 것**을 나눠 적는다.
