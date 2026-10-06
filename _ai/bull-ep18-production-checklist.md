# 황소특보 18편 제작 체크리스트 — 시가총액 미달 상장폐지, 법원이 제동 건 이유 — 규칙 23·26·27·29

> ⛔ = 코드가 막는 게이트, 👁 = 사람이 눈으로 보고 기록을 남겨야 하는 단계. 증거(명령·파일)를 적고 못 본 것은 "못 봄"으로 적는다. 소재·대본·팩트표·새 독자 읽기 점검 기록은 `_ai/bull-ep16-18-scripts-draft.md`(C절). 배포는 Owner 지시.

## 0. 시작 전
- ✅ CURRENT_STANDARDS를 그 세션에서 직접 열어 읽음(2026-10-03): 규칙 11·13·17·22·26~29, §3 황소 v3·성공 공식·엔딩 5박자.
- ✅ `scripts/_bull-ep18-assembly-spec.mjs` 없음 확인 후 새로 만듦.

## A. 소재·대본
- ✅ 소재 탐색: `run-bull-topic-full-scan-once.mjs` 11단계(`C:/tmp/bull-topic-scan-ep16/`), 후보 25개 → Owner "1~3번 소재로 3개 편" → "1번 진행해, 종목 실명은 허용하고 상폐 편은 원문 확인 후 확정"(2026-10-03) → "2번 외국인편(B) 상폐 편(C) 차례로 이어서".
- ✅ 팩트: 주연테크(코스피 2026카합1541)·케이엠제약(코스닥 2026카합1532) 회사 자율공시 원문 + 법률신문·뉴스핌·서울경제. **못 봄: 결정문 전문, 거래소 항고 여부, 같은 소송(골드앤에스·유틸렉스·핀텔) 결정 현황.**
- ⛔✅ 대본 검사: v3 **반드시 수정 0**, 15씬·551자 — `C:/tmp/bull-ep16-draft/delisting-scenes-v4.json`.
- ✅ 새 독자 읽기 점검(규칙 29) 통과, Q4 조치 → 초안 문서.
- ✅ **Owner 대본 확정**("1~3번 소재로 3개 편" 후 "차례로 이어서 진행", 2026-10-03). 종목 실명 허용은 Owner 발언, 법적 위험 확인은 Owner 몫.
- ⬜ 장부 `BULL_EPISODE_LEDGER` 18편 추가는 배포 후.

## B. 음성
- ✅ TTS 스크립트 JSON `C:/tmp/money-shorts-os/bull-ep18-tts/bull-ep18-tts-script.json`(빌더 `C:/tmp/bull-ep16-draft/build-bullC-tts.mjs`): 어절 수 일치·세그먼트 ≤8어절·읽기에 숫자 없음 경고 0건, hookType T1, baseSpeed 1.05.
- ⛔✅ owl-tts --character bull --arm: **API 1/1**, 15씬, **103.40초**(+CTA 8.33초≈111.7초 — 권고 115~127초보다 짧지만 흐름 우선), 씬 최대 8.36초, 정렬 밀림 최대 -0.14초 → 보정 불필요. 못 본 것: TTS 청취.

## C. 스펙·이미지
- ✅ 스펙 `scripts/_bull-ep18-assembly-spec.mjs`(BULL_EP18_ASSEMBLY_SPEC): 스펙 대사·장면 키가 TTS JSON과 일치(자동 대조), 같은 구역 같은 샷 3연속 없음, 검사기(--spec-module) 반드시 수정 0.
- ✅ 이미지 15장(2026-10-03, `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character bull3dv1 --scene-spec ./_bull-ep18-assembly-spec.mjs --scene-spec-export BULL_EP18_ASSEMBLY_SPEC --out-dir C:/tmp/bull-ep18-images`): **15장 모두 1차 생성, 경고·재생성 0회**, 파일 `C:/tmp/bull-ep18-images/bull_ep18_s{1..15}.png`.
- 👁 안전선 시트(`safe-zone-sheet-all.png`) 씬별 판정: s1 카드 '시총만 모자라도/상장폐지?' ✅ · s2 와이드 인사 ✅ · s3 카드 '10/2 서울남부지법/주연테크·케이엠제약' 원본 확대 선명 ✅ · s4 카드 '시총 퇴출 기준/6개월 앞당긴 규정' ✅ · s5 카드 '소명 기회 없는 퇴출/비례원칙 위반' ✅ · s6 와이드 가리키기 ✅ · s7 카드 '끝난 게 아니야/본안 판결이 남음' ✅ · s8 카드 '본안 확정까지/폐지·정리매매 정지' 작은 편 ✅(영상에서 뭉개지면 재생성) · s9 카드 '같은 소송 신청이/줄을 잇고 있다' ✅ · s10 클로즈 턱 괴기 ✅ · s11 카드 '정리매매 멈춰도/안전해진 건 아님' ✅ · s12 카드 '절차 흠이 있다는/임시 판단' ✅ · s13 카드 '① 시총·관리종목/② 본안·거래소 대응' ✅ · s14 카드 '규정이 흔들려도/공시로 확인' ✅ · s15 와이드 인사 ✅. 캐릭터 일관성 15장 유지. 배경 3구역(원목 심판 홀·상장 심사 사무실·공시 열람 홀)에 글자·숫자 없음(심판 홀 뒷벽에 저울 문양 — 글자 아님, 영상 변환 때 글자가 생기는지 눈여겨볼 것). s1·s9 등 뒤쪽 망치 조형물이 캐릭터 머리 뒤에 걸쳐 보임(소품 아님·배경) — 영상에서 캐릭터 몸에 붙지 않는지 확인. **못 봄**: 시트 해상도의 배경 속 작은 글자 유무(s3 원본만 확대 확인).
- ✅ 영상 프롬프트 `_ai/bull-ep18-video-generation-prompts.md`(`build-video-generation-prompts.mjs`, TTS output-v1 기준): **8초 3개(s2·s6·s10) / 10초 12개**. Owner에게 전달함. Owner가 Veo로 생성해 보내줄 예정("황소특보 18편"이라고 알려주기).

## D. 영상 검수(2026-10-03, Owner Veo 영상 15개 수령 — Downloads/황소 18편/1~15.mp4, 숫자=씬 번호)
- ✅ 15개 모두 720x1280·24fps·오디오 포함, 카드 글자는 끝 프레임까지 보존(카드 씬 11개 전부), 카메라 줌·소품 이동 없음, 배경에 글자 없음 — `C:/tmp/bull-ep18-videos-review/`(sheet_1~4.png, mouth_1~2.png, probe.json). 영상 파일 `C:/tmp/bull-ep18-videos/bull_ep18_s{N}_motion.mp4`.
- ⚠ **s3 클립이 요청한 10초가 아니라 8.00초로 도착**(프롬프트 파일은 s2·s6·s10만 8초). 씬 길이 8.28초보다 0.28초 짧음 → 조립기가 8.0초에서 잘라 정지 연장 없이 처리(s3→s4 컷 선행 0.41초, 나머지 0.10초대). 화면에 문제 없음, 재생성 불필요로 판단(Owner 판단 사항).
- 👁 입 멈춤(check-clip-speech-timing 13/15 경고는 추정치): 육안 — 닫힘 s3·s7·s8·s10·s15, 경미 s1·s4·s5·s9·s12, **보통(꼬리에 미소로 입 벌어짐) s2·s6·s11·s13·s14**. 16·17편 선례대로 그대로 진행. 일부 클립 시작 0.3초는 눈 감은 깜빡임.

## E. 조립·CTA·마감·QA
- ✅ `run-owl-assemble-shorts-v2.mjs` → `C:/tmp/bull-ep18-assembly-v1/owl_shorts_final.mp4` 103.4초(씬 전환 누적 오차 0, 컷 선행 0.10~0.41초, 자막 64블록).
- ⛔✅ `run-owl-episode-with-fixed-cta-once.mjs --scene8-start 103.422 --alignment …`(황소 CTA bull-cta-fixed-v6): cta-join-report **PASS**(프레임 2678/2678, 화면 111.58초 = 오디오 111.58초), 전환 4프레임 육안 확인(제목 3줄·리스크 고지·CTA 정상).
- ✅ 워터마크 제거(sparkle·veo_text, 제거 자리에 약한 블러 자국이 일부 있음 — 이전 편과 같은 방식·수준) → 오디오 마감 `C:/tmp/bull-ep18-final/owl_episode_final_mastered.mp4` 111.6초 48.5MB, **-14.2 LUFS / -0.9 dBTP**.
- ⛔✅ `run-episode-qa-once.mjs`: 첫 실행 must-fix 1(카드 씬 11개 edge-review 기록 없음) → edge-review-1~3.png·caption-card-1~3.png를 직접 보고 qa/edge-review.json 기록 → 재실행 **반드시 수정 0**, 확인 권장 5(H4 긴장 단어 위치 2, 대본 551자<권고 600자, '~야' 연속 11·12번, 입 멈춤 13). 제목 108px×3줄, 자막 96px 최대 2줄, 자막↔음성 44곳 ok. 보고서 `C:/tmp/bull-ep18-final/qa-report.md`.
- 👁 카드 좌우 끝 판정 11개 모두 ok. 자막-카드 겹침 11개 모두 ok(카드 하단과 자막 윗줄 사이 간격 있음 — 17편 s13 같은 맞닿음 없음).
- **못 본 것**: TTS 청취, 최종본 전체 프레임 재생, 거래소 항고 여부·결정문 전문·같은 소송 신청 현황 재확인.

## F. 커버
- ✅ 스펙 `scripts/_bull-cover-ep18-spec.mjs`(짙은 미드나이트 플럼→실버 라벤더, 금빛 원판 소용돌이+금빛 법봉 실루엣, 놀람+손바닥 '멈춤' 포즈). **1차(와인 브라운→로즈 핑크)는 붉은 계열로 읽혀 경고색 금지·7편 빨강과 겹쳐 폐기**(`C:/tmp/bull-cover-ep18-raw/v1_wine_pink_rejected.png`). 합성기 헤드라인 "시총 상폐에 / 법원 제동!" 글자 높이 **164/179px(≥140 통과)**, 세로 15.8~35.3% → `C:/tmp/bull-cover-ep18/00_bull_ep18_cover_thumb.png`(Owner에게 전송). 법봉 장식이 느낌표 뒤쪽에 살짝 걸림(글자는 선명).

## G-1. 배포 완료(2026-10-04, Owner "황소특보 18편 배포하자")
- ✅ 게시 직전 재확인(웹 검색 2건): 서울남부지법 민사51부 10/2 가처분 인용(주연테크·케이엠제약, 본안 확정까지 상장폐지 결정 효력 정지·정리매매 금지, "비례의 원칙에 현저히 어긋나 위법·무효") 그대로, 거래소 항고 보도 없음, 핀텔·메디콕스 등 같은 취지 신청 이어짐 — 대사·캡션과 일치. 못 본 것: 결정문 전문, 거래소 항고 여부(미보도일 뿐 없다고 단정 못 함).
- ✅ 압축 `C:/tmp/bull-ep18-publish/owl_episode_final_compressed.mp4` 27.2MB, 콘텐츠 유닛(finalMasteredPath·qaReportPath 포함), ⛔ 배포 전 게이트 **실패 0·경고 0·통과 7**, 커버 164/179px.
- ✅ 업로드 3건(영상·커버·스토리 Blob) UPLOADED → 커버 merge → 릴스(로그 `coverUrl:` 실제 URL 확인) → 스토리 → 유튜브 `--privacy public`(썸네일 set).
- **링크**: 릴스 https://www.instagram.com/reel/DeDfxdUiObV/ (mediaId 17977776932915024) · 스토리 mediaId 17994978282044802(24시간 만료) · 유튜브 https://www.youtube.com/shorts/6BhhvurEWzU (public). 폴더 `C:/tmp/bull-ep18-publish/`.
- ✅ 장부 18편은 제작 중 등록돼 있어 주석에 배포 완료 표기. 커버 문구 "시총 상폐에/법원 제동!"은 Owner가 "배포하자"로 확정한 것으로 처리(뜻: 시총 미달 상폐 규정에 법원이 제동, 보도 헤드라인 어법).
- ⬜ 확인 대기: 유튜브 썸네일 maxres/oar 반영(수 시간 뒤), 성과 수집. 못 본 것: 게시된 릴스·쇼츠 실제 재생 화면. 종목 실명(주연테크·케이엠제약)의 법적 위험 확인은 Owner 몫. 로컬 변경은 Owner 커밋 승인 대기.

## G. 이후 단계(위 G-1로 배포 완료)
- ⬜ 압축·콘텐츠 유닛(finalMasteredPath·qaReportPath)·배포 전 게이트 → **배포는 Owner 지시**. 게시 직전 재확인: 서울남부지법 가처분 이후 거래소 항고·본안 일정, 주연테크·케이엠제약·같은 소송 신청 현황(바뀌면 대사 수정=TTS 재생성). 종목 실명(주연테크·케이엠제약)의 법적 위험 확인은 Owner 몫. 로컬 변경은 Owner 커밋 승인 대기.
