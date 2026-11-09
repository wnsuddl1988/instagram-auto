# 황소특보 11편 제작 체크리스트 (규칙 23 — 하나도 빼지 않는다, 단계가 끝날 때마다 ✅ 갱신)

소재: 조선주 "주가는 반토막인데 이익 전망은 올랐다" (2026-09-30 Owner 선택 — 후보 1번)

## A. 소재·대본
- ✅ 소재 탐색 러너 7개 전부 실행 (`C:/tmp/bull-topic-scan-2026-09-30/SCAN_CHECKLIST.md`)
- ✅ 역할 적합도(규칙 22): 투자자 입장 = 황소 담당
- ✅ 쏠림 점검(`run-bull-topic-lane-mix-check-once.mjs`): 경고 없음
- ✅ 팩트 교차 확인(복수 출처, 불일치 수치 "20%→14%" 제외) — `bull-ep11-ship-script-draft.md` 출처 목록
- ✅ 훅 규칙(규칙 17) 검사: mustFix 0·warn 0 (T1)
- ✅ 분량(v3 규칙): 632자, 17씬, 씬당 추정 9초 이내
- ✅ **대본 Owner 확정**(2026-09-30 Owner 지시 "대본확정 TTS생성", 열어 둔 결정 4개는 초안 그대로 — 17씬 유지·s9 속보 문장 유지·SK증권 인용 유지)
- ✅ 스펙 작성 완료 `scripts/_bull-ep11-assembly-spec.mjs`(2026-09-30, 대사는 TTS 스크립트에서 그대로 생성, 배경 3구역 새로 설계, 샷 close5·medium8·wide4, 같은 구역 같은 샷 3연속 없음, hookType T1, 리스크 고지 s2·s17). 이미지 프롬프트 `--print-prompts` 검토 완료(길이 1,590~2,067자). 아래는 작성 시 요구사항 기록:
  `_bull-ep11-assembly-spec.mjs` (템플릿 `_bull-ep10-assembly-spec.mjs`; 필수: `hookType: "T1"`, `imageCharacter`·`imagePrefix`·`sceneBackgrounds`(소재에 맞는 2~3구역, 직전 편과 다른 공간), 씬별 `shot`·`bg`·`motion`, `emphasisTerms`, `headerTitle` 2줄, 캡션·태그, 오프닝·마지막 씬 `riskDisclosure: true`, `footerChannelBar` 넣지 않음)
## B. 음성
- ✅ TTS 스크립트 JSON(`C:/tmp/money-shorts-os/bull-ep11-tts/bull-ep11-tts-script.json`) — 자동 검증 통과: 17씬·어절 수 일치·세그먼트 ≤8어절·읽는 표기 숫자 0건·숫자 고유어는 한글 표기("이삼 년")
- ✅ `owl-tts --arm` 실행: **API 1회**, output-v1, 총 130.76초, 씬별 raw 4.6~8.83초(9.5초 초과 0개). 음성 `C:/tmp/money-shorts-os/bull-ep11-tts/output-v1/elevenlabs-korean-director-935f19035df873.m4a`
  - 주의: 본편 130.8초는 v3 목표(115~127초)보다 약 4초 길다(CTA 8.3초 합쳐 전체 약 139초 = 8편과 동일). TTS 재생성은 복불복이라 다시 돌리지 않음.
- ⬜ **Owner 음성 청취 확인**(속도·톤·숫자 읽기)
## C. 이미지
- 🔄 스펙 기반 이미지 생성(`probe … --scene-spec`) — 샷 와이드/미디엄/클로즈, 글자 안전영역 22~60%·좌우 12%
  - 1차(2026-09-30): 16장 + s17 재시도 성공 = 17장. 안전선 시트 검수 결과 **14장 탈락**(보드 글자가 화면 오른쪽 93~99%까지, 클로즈 카드 글자가 세로 65~80%로 자막과 겹치고 카드 폭 78%). 통과: s2·s11·s17(글자 없는 open 씬). 1차 원본 백업 `C:/tmp/bull-ep11-images-attempt1`.
  - 3차(샘플 검증, 구조 변경): 위치 좌표만으로는 모델이 따르지 않음(카드 글자 세로 62~72%, 보드 오른쪽 끝 97~100%) → **클로즈 카드는 머리가 위쪽 절반을 차지해 카드가 구조적으로 60% 아래로 내려감** → 카드 씬(1·5·9·13·15) **클로즈→미디엄**, 보드는 **긴 다리 이젤 위로 올려** 글자를 높임, 클로즈는 글자 없는 반응 씬(11)으로, 12씬 와이드(샷 3연속 없음 검증). 샘플 3장(`bull-ep11-sample4`) 안전선 시트 통과 수준(카드 가로 58~60%·글자 세로 54~63%, 보드 글자 47~61%, 잔여 오차: 카드 둘째 줄이 자막 자리 1~2% 걸침·보드 오른쪽 끝 96%). s1·s3·s5는 샘플에서 채택, s2·s17은 1차(글자 없음) 유지, 나머지 12장 생성 중.
  - 3차 전체(2026-09-30): 나머지 12장 생성 완료(17장). 최종 안전선 시트 `C:/tmp/bull-ep11-review/safe-images-final.png` 검수 결과 — 캐릭터 일관성 양호, 카드 폭 58~60%·보드 글자 47~61%. s4(와이드 샷)는 보드가 작고 멀어 재생성 3회 시도했으나 전부 불합격(보드를 키우면 글자·프레임이 오른쪽 크롭선 90%를 넘고 황소가 왼쪽 크롭선을 넘음, 위치 좌표를 써도 모델이 무시) → **기존 s4 채택**(보드 글자 52~77%로 안전, 글자가 작은 것이 단점 — 조립 시 s4는 자막이 글자를 읽어 주므로 수용). 스펙 imageBrief의 "보드 45~83%" 문구는 s4 재생성 시도용이었고 이미지는 기존본(백업 `_v3small`) 그대로. 실패본: `_v4wide_edge`, `_v5bigfail`. 잔여 오차(수용): 카드 둘째 줄이 자막 자리 1~2% 걸침, s3·s8·s12·s14 보드 오른쪽 끝 92~96%(글자는 안전폭 안).
  - 2차(중단·폐기): 스펙 imageBrief에 씬 유형별 위치 좌표 추가(보드: 황소 왼쪽 12~45%, 보드 가로 50~84%·글자 세로 28~58% / 카드: 턱 아래 높이, 카드 세로 40~62%·폭 55% 이하) 후 탈락 14장 재생성. 수정 횟수 규칙: 생성→검증→수정 최대 3회.
- ✅ 안전선 시트(`run-safe-zone-preview-once.mjs --images-dir`) 검수 완료, 벗어난 씬 s4 재생성 3회 후 기존본 채택(위 기록)
## D. 영상
- ✅ 영상 프롬프트 생성 완료(2026-09-30) `_ai/bull-ep11-video-generation-prompts.md` — 8초 6개(s2·3·11·12·16·17), 10초 11개(나머지), 입 멈춤 시각 SPEECH TIMING 포함. 이미지 단계는 s4 기존본 채택으로 ✅. (`build-video-generation-prompts.mjs`, 입 멈춤 시각 SPEECH TIMING, 8초/10초 묶음) — 입 싱크 A/B 파일럿(`--pilot-dialogue`)은 Owner와 오후 편에서 시험하기로 함
- ⬜ Owner 영상 생성 → 영상 검수(씬별 길이·시작/중반/끝 프레임, `check-clip-speech-timing-once.mjs`)
- ✅ 영상 17개 수령·검수(2026-09-30): 해상도 720x1280·길이 8초 6개/10초 11개 모두 티어 일치. 입 멈춤 경고 16개는 프레임 확인 결과 대사 끝 +1초 안에 닫힘(조립 컷이 대사 끝+약 0.85초라 수용). s16 클립 끝에서 보드 글자 깨짐은 조립 컷(5.5초) 이후라 화면에 안 나옴.
## E. 조립·마감 (A-7 한 번에)
- ✅ 완료(2026-09-30) — **최종본 `C:/tmp/bull-ep11-final3/owl_episode_final_mastered.mp4`**(138.92초, -14.1 LUFS, QA 반드시 수정 0). 경과: ① 1차 조립 QA에서 자막이 숫자 중간("9조 ‖ 8천억 원에서")에서 끊김 2건 → `_caption-linebreak-ko.mjs` 시간어(올해·내년 등)+숫자 분리를 금지→벌점 25로 완화 + 회귀 테스트 추가(31 pass) → 재조립 ② 보드 글자 오른쪽 끝 91~94% 7개 씬 → 클립 좌측 이동 교정(CURRENT_STANDARDS A-6 "보드 글자 오른쪽 끝 실측"), 교정 클립 `C:/tmp/bull-ep11-videos-shifted`(※smear로 덮어써져 있음, 최종 final3은 mirror본으로 조립한 것). 잔여: "는다고 봐" 자막 0.48초(권장 경고), 카드 씬은 좌우 20~80%로 안전.
- ⬜ 조립 `run-owl-assemble-shorts-v2.mjs` (씬 전환 싱크 v3 로그 확인: 누적 오차 0, 컷 리드 0.10초)
- ⬜ CTA 결합 `run-owl-episode-with-fixed-cta-once.mjs --alignment … --cta-clip C:/tmp/bull-cta-fixed-v6/bull_cta_fixed_final_layout_v2.mp4` → `cta-join-report.json` PASS
- ⬜ 워터마크 제거 `run-remove-veo-watermark-once.mjs`
- ⬜ 오디오 마감 `run-audio-finish-once.mjs`(-14 LUFS, 배경음 없음)
- ⬜ 자동 검수 `run-episode-qa-once.mjs` — **반드시 수정 0** (+ 자막 읽는 표기 0건 확인)
## F. 자산·배포 — ✅ 전부 완료(2026-09-30, Owner 지시 "확인하고 배포해")
- ✅ 커버(유튜브 썸네일 겸용)·스토리: 글자 없는 배경+캐릭터 생성 후 `run-cover-headline-overlay-once.mjs`로 글자 합성(글자 좌우 여백 13%, 카드뉴스 없음). 커버 1차는 모델이 글자를 안전영역 밖(폭 6~94%·세로 15~28%)에 넣어 불합격 → 방식 변경
- ✅ 배포(§5 전 단계): 압축 34.2MB(1900k) → content unit(youtubeTitle에 #Shorts 없음) → 계획 3종 → 업로드 3종(영상·커버·스토리, 스토리는 최종본만 별도 폴더) → 커버 merge → 릴스 instagram.com/reel/Dd6OQgkimBU(커버 적용 확인) → 스토리 → 유튜브 youtube.com/shorts/-noGZIex5sM(public, 썸네일 API set)
- ✅ 게시 장부 BULL_EPISODE_LEDGER 11편 추가(industrial · cause_explainer · structure · semi 아님 · contrast), 테스트 12 pass
- ✅ 배포 링크를 CURRENT_STANDARDS §7·메모리에 기록
- ⚠ 유튜브 쇼츠 세로 칸 썸네일: API 커버는 16:9 저장본에만 적용, 세로 칸은 자동 프레임(oar1/2) 사용 → 원인·확인법은 CURRENT_STANDARDS §5 step 10
