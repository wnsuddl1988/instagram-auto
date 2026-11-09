# 황소특보 19편 제작 체크리스트 — S&P500 종목 80%가 내렸는데 AI만 올랐다 — 규칙 23·26·27·29

> ⛔ = 코드가 막는 게이트, 👁 = 사람이 눈으로 보고 기록을 남겨야 하는 단계. 증거(명령·파일)를 적고 못 본 것은 "못 봄"으로 적는다. 게시 예정 **10/4(일) 저녁**(Owner 지시, 배포는 Owner가 "배포해줘"라고 할 때). 소재·대본·팩트표·새 독자 읽기 점검 기록은 `_ai/bull-ep19-21-scripts-draft.md`.

## 0. 시작 전
- ✅ CURRENT_STANDARDS를 그 세션에서 직접 열어 읽음(2026-10-04): 규칙 11·13·17·22·25·26·29, §3 황소 v3·성공 공식·엔딩 5박자, A-2 대본 스펙, A-6·A-7.
- ✅ `scripts/_bull-ep19-assembly-spec.mjs` 없음 확인 후 새로 만듦.

## A. 소재·대본
- ✅ 소재 탐색: `run-bull-topic-full-scan-once.mjs` 11단계(`C:/tmp/bull-topic-scan-ep19/`), 후보 36개 → Owner 12개 압축·슬롯 지정 → Claude 3건 제안 → Owner "3건 확정, 1번 진행해"(2026-10-04).
- ✅ 팩트: 뉴시스 10/3(WSJ 인용)·국민일보 10/3 원문 확인. 못 봄: WSJ 원문, '오른 종목 상당수가 AI 수혜' 문장 원문 재확인.
- ⛔✅ 대본 검사: v3 **반드시 수정 0**, 16씬·610자 — `C:/tmp/bull-ep19-draft/sp500-scenes-v3.json`.
- ✅ 새 독자 읽기 점검(규칙 29) 1회 통과(반려 없음), Q4 조치·미조치 사유 → 초안 문서.
- ✅ **Owner 대본 확정**("3편 대본 확정, 19편부터 TTS 진행해", 2026-10-04).
- ⬜ 장부 `BULL_EPISODE_LEDGER` 19편 추가는 배포 후(18편까지 등록돼 있음).

## B. 음성
- ✅ TTS 스크립트 JSON `C:/tmp/money-shorts-os/bull-ep19-tts/bull-ep19-tts-script.json`(빌더 `C:/tmp/bull-ep19-draft/build-tts.mjs` 19): 어절 수 일치·세그먼트 ≤8어절·읽는 표기에 숫자·영문 없음 **경고 0건**, hookType T1, baseSpeed 1.05.
- ⛔✅ `owl-tts --character bull --arm`: 래퍼의 대본 기준 검사 통과 → **API 1/1**, 16씬, 타임라인 **121.08초(+CTA 8.33초≈129.4초)**, 요약 `output-v1/elevenlabs-scene-paced-tts-summary.json`.
- ✅ 씬별 최대 **8.01초(s15)**, 9.5초 초과 0. 정렬 밀림 점검: 최대 -0.26초 → **보정할 씬 없음**(원본 정렬·summary 사용). 못 본 것: TTS 청취.

## C. 스펙·이미지
- ✅ 스펙 `scripts/_bull-ep19-assembly-spec.mjs`(BULL_EP19_ASSEMBLY_SPEC): hookType T1, sceneBackgrounds A 야경 전망 라운지 / B 데이터센터 서버 복도 / C 계단식 홀(직전 편들과 겹치지 않는 새 공간, 글자·숫자 없음), 16씬 shot·bg·motion, 스펙 대사·장면 키가 TTS JSON과 16/16 일치(자동 대조), 같은 구역 같은 샷 3연속 없음, 검사기(--spec-module) 반드시 수정 0.
- ✅ 이미지 16장(2026-10-04, `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character bull3dv1 --scene-spec ./_bull-ep19-assembly-spec.mjs --scene-spec-export BULL_EP19_ASSEMBLY_SPEC --out-dir C:/tmp/bull-ep19-images`): **16장 모두 1차 생성, 경고·재생성 0회**, 파일 `C:/tmp/bull-ep19-images/bull_ep19_s{1..16}.png`.
- 👁 안전선 시트(`safe-zone-sheet-all.png`) 씬별 판정: s1 카드 '나스닥 사상 최고/열 중 여덟은 하락' ✅ · s2 와이드 인사 ✅ · s3 카드 '9월 나스닥 +3%/종목 80% 하락' ✅ · s4 카드 '11개 업종 중/오른 곳은 2곳뿐' ✅ · s5 카드 '상위 41개 상승/하위 10개 상승' ✅(대사의 "100개 중"은 카드에서 생략, 대사가 보완) · s6 카드 '돈은 AI로 쏠림/나머지는 금리·유가' ✅ · s7 카드 '첫째 쏠림/AI·데이터센터 기업' ✅ · s8 카드 '10년 국채금리/4.7%에서 5.3%' ✅ · s9 카드 '신용 낮은 회사/가산금리 1%p 상승' ✅ · s10 와이드 가리키기 ✅ · s11 카드 '9월 한 달 통계/10/2 고용 부진' ✅ · s12 클로즈 턱 괴기 ✅ · s13 카드 '지수가 최고여도/모두 오른 건 아님' ✅ · s14 카드 '① 종목 확산 여부/② 장기 국채금리' ✅ · s15 카드 '지수보다 중요한 것/내 종목의 위치' 첫 줄이 다른 카드보다 작은 편이나 읽힘 ✅(영상에서 뭉개지면 재생성) · s16 와이드 인사 ✅. 카드 세로 42~60% 안, 캐릭터 일관성 16장 유지, 배경 3구역(야경 전망 라운지·데이터센터 서버 복도·계단식 홀)에 글자·숫자 없음. **못 봄**: 시트 해상도의 배경 속 작은 글자 유무(원본 확대는 하지 않음).
- ✅ 영상 프롬프트 `_ai/bull-ep19-video-generation-prompts.md`(`build-video-generation-prompts.mjs`, TTS output-v1 기준): **8초 3개(s2·s10·s12) / 10초 13개**. Owner에게 전달함. Owner가 Veo로 생성해 보내줄 예정("황소특보 19편"이라고 알려주기).

## D. 영상 검수(2026-10-04, Owner Veo 영상 16개 수령 — Downloads/황소 19편/1~16.mp4, 숫자=씬 번호)
- ✅ 16개 모두 720x1280·24fps·오디오 포함, 길이 티어 일치(8초 s2·s10·s12 / 10초 나머지), 카드 글자는 끝 프레임까지 보존(카드 씬 12개 전부), 카메라 줌·소품 이동 없음 — `C:/tmp/bull-ep19-videos-review/`(sheet_1~4.png, mouth_1~2.png, probe.json). 영상 파일 `C:/tmp/bull-ep19-videos/bull_ep19_s{N}_motion.mp4`.
- 👁 입 멈춤(check-clip-speech-timing 16/16 경고는 추정치): 육안 — 닫힘 s3·s5·s9, 경미 s1·s4·s6·s7·s8·s10·s11·s15·s16, **보통(꼬리에 미소로 입 벌어짐) s2·s12·s13·s14**. 이전 편 선례대로 진행. 일부 클립 시작 0.3초는 눈 감은 깜빡임.

## E. 조립·CTA·마감·QA
- ⚠ **조립 1차 ABORT(자막 계약 captionWidthPass)**: s4 한 어절 "커뮤니케이션서비스"가 864px로 자막 폭 한도(760px)를 넘음(분할 불가). Owner 선택("대본 문구 교체 + TTS 재생성")으로 대본·빌더·스펙을 **"기술주와 통신 업종 두 곳뿐"**으로 교체, 검사기 반드시 수정 0(605자), **TTS 재생성 output-v2(API 1/1, 119.24초)**. 영상 클립은 이전 TTS 기준 Veo 생성이지만 모든 씬 길이(최대 9.17초)가 클립 티어 안, 정렬 밀림 -0.06초(보정 불필요). 이전 `output-v1`(121.08초)은 사용 안 함. 캡션엔 "통신 업종(커뮤니케이션서비스)" 병기.
- ✅ `run-owl-assemble-shorts-v2.mjs`(output-v2 기준) → `C:/tmp/bull-ep19-assembly-v1/owl_shorts_final.mp4` 119.3초(누적 오차 0, 컷 선행 0.11~0.14초, 자막 66블록).
- ⛔✅ `run-owl-episode-with-fixed-cta-once.mjs --scene8-start 119.258 --alignment …88864d4e20c147.alignment.json`(bull-cta-fixed-v6): cta-join-report **PASS**(프레임 3058/3058, 화면 127.42초 = 오디오 127.42초). 못 한 것: 전환 4프레임 이미지 시트(ffmpeg 반복 명령이 권한 거부로 못 돌아 육안 확인 생략, 결합 로그 PASS만 근거).
- ✅ 워터마크 제거 → 오디오 마감 `C:/tmp/bull-ep19-final/owl_episode_final_mastered.mp4` 127.5초 60.0MB, **-14.2 LUFS / -0.9 dBTP**.
- ⛔✅ `run-episode-qa-once.mjs`: 첫 실행 must-fix 1(카드 씬 12개 edge-review 기록 없음) → edge-review-1~3.png·caption-card-1~3.png를 직접 보고 qa/edge-review.json 기록 → 재실행 **반드시 수정 0**, 확인 권장 5(H4 긴장 단어 위치 2, "9월" 반복, 0.6초 미만 자막 "미국 10년" 0.56초, 입 멈춤 16). 제목 108px×3줄, 자막 96px 최대 2줄, 자막↔음성 42곳 ok, 워터마크 제거 표식 확인. 보고서 `C:/tmp/bull-ep19-final/qa-report.md`.
- 👁 카드 좌우 끝 12개 ok, 자막-카드 겹침 12개 ok(맞닿음 없음).
- **못 본 것**: TTS 청취(재생성본 포함: "에스앤피오백", "에스케이하이닉스" 읽기, "통신 업종" 어색함 여부), 최종본 전체 재생, WSJ 원문.

## F. 커버
- ✅ 스펙 `scripts/_bull-cover-ep19-spec.mjs`(로열 블루→아쿠아 민트, 왼쪽 큰 금빛 막대 vs 오른쪽 작은 막대, 한쪽 눈썹·저울 손 포즈). 헤드라인 **"지수는 최고? / 종목은 하락"** 148/164px(≥140), 세로 16.6~34.4% → `C:/tmp/bull-cover-ep19/00_bull_ep19_cover_thumb.png`(Owner에게 전송). **문구 점검(17편 교훈)**: 1차 "종목은 80%↓"는 합성기가 ↓를 못 그려 "종목은 80%"만 남아 뜻이 틀어짐 → 폐기. "종목은 80%하락"은 125px 미달, "80%는 하락"은 무엇의 80%인지 모호 → 폐기. 최종안이 영상 주장(지수 최고, 대부분 종목 하락)과 같은 방향이고 자연스러움.

## G. 이후 단계(Owner 지시 대기)
- ✅ **배포 완료(2026-10-05, Owner "19편 올려줘")** — 10/4 저녁 예정분이 누락돼 20편 배포 뒤 늦게 올림. 폴더 `C:/tmp/bull-ep19-publish/`(contentId `bull-ep19-sp500-80pct-down-ai-only-up-2026-10-05`).
  - 압축 영상 30,983,519바이트, 배포 전 게이트 실패 0·경고 0·통과 7(캡션 638자, 커버 148/164px).
  - 신선도 재확인(10/5): 뉴시스 통계 불변, 10/2 고용 +2.9만·10년물 5.273%·나스닥 +1.19%. 영상은 9월 월간 수치(4.7→5.3%)만 사용해 영향 없음.
  - 인스타 릴스 https://www.instagram.com/reel/DeGI_W5jUQ3/ (mediaId 18099964145324789, `coverUrl:` 실제 URL 확인, 커버 merge 완료)
  - 인스타 스토리 mediaId 17931263028403462 (`--slide-index 1`, `--approval` 없음)
  - 유튜브 https://www.youtube.com/shorts/lefyytPG7N0 (public, 썸네일 set)
  - 못 본 것: 유튜브 세로 칸 썸네일(처리 지연), 영상 전체 재생·TTS 청취.
  - 로컬 변경은 Owner 커밋 승인 대기.

## (이전) D~G. 이후 단계(미착수)
- ⬜ Owner Veo 영상 수령 → 검수 → 조립·CTA·워터마크 제거·오디오 마감·QA → 커버(문구는 의미·자연스러움 직접 점검, 규칙 메모리 2026-10-03) → 압축·콘텐츠 유닛 → 배포 전 게이트 → 배포는 Owner 지시. 게시 직전 재확인: 美 증시 흐름(월요일 한국장 휴장 중 美 개장 결과), 10년물 5% 위 여부.
