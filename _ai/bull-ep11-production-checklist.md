# 황소특보 11편 제작 체크리스트 (규칙 23 — 하나도 빼지 않는다, 단계가 끝날 때마다 ✅ 갱신)

소재: 조선주 "주가는 반토막인데 이익 전망은 올랐다" (2026-09-30 Owner 선택 — 후보 1번)

## A. 소재·대본
- ✅ 소재 탐색 러너 7개 전부 실행 (`C:/tmp/bull-topic-scan-2026-09-30/SCAN_CHECKLIST.md`)
- ✅ 역할 적합도(규칙 22): 투자자 입장 = 황소 담당
- ✅ 쏠림 점검(`run-bull-topic-lane-mix-check-once.mjs`): 경고 없음
- ✅ 팩트 교차 확인(복수 출처, 불일치 수치 "20%→14%" 제외) — `bull-ep11-ship-script-draft.md` 출처 목록
- ✅ 훅 규칙(규칙 17) 검사: mustFix 0·warn 0 (T1)
- ✅ 분량(v3 규칙): 632자, 17씬, 씬당 추정 9초 이내
- ⬜ **대본 Owner 확정**
- ⬜ 스펙 작성 `_bull-ep11-assembly-spec.mjs` (템플릿 `_bull-ep10-assembly-spec.mjs`; 필수: `hookType: "T1"`, `imageCharacter`·`imagePrefix`·`sceneBackgrounds`(소재에 맞는 2~3구역, 직전 편과 다른 공간), 씬별 `shot`·`bg`·`motion`, `emphasisTerms`, `headerTitle` 2줄, 캡션·태그, 오프닝·마지막 씬 `riskDisclosure: true`, `footerChannelBar` 넣지 않음)
## B. 음성
- ⬜ TTS 스크립트 JSON(숫자 읽는 표기·어절 수 일치, 세그먼트 7~8어절, 쉼 220/420ms, baseSpeed 1.05) → `owl-tts --arm` (호출 횟수 보고, 씬당 raw 9.5초 이내)
## C. 이미지
- ⬜ 스펙 기반 이미지 생성(`probe … --scene-spec`) — 샷 와이드/미디엄/클로즈, 글자 안전영역 22~60%·좌우 12%
- ⬜ 안전선 시트(`run-safe-zone-preview-once.mjs --images-dir`) 검수, 벗어난 씬만 `--scene-spec-only` 재생성
## D. 영상
- ⬜ 영상 프롬프트 생성기(`build-video-generation-prompts.mjs`, 입 멈춤 시각 SPEECH TIMING, 8초/10초 묶음) — 입 싱크 A/B 파일럿(`--pilot-dialogue`)은 Owner와 오후 편에서 시험하기로 함
- ⬜ Owner 영상 생성 → 영상 검수(씬별 길이·시작/중반/끝 프레임, `check-clip-speech-timing-once.mjs`)
## E. 조립·마감 (A-7 한 번에)
- ⬜ 조립 `run-owl-assemble-shorts-v2.mjs` (씬 전환 싱크 v3 로그 확인: 누적 오차 0, 컷 리드 0.10초)
- ⬜ CTA 결합 `run-owl-episode-with-fixed-cta-once.mjs --alignment … --cta-clip C:/tmp/bull-cta-fixed-v6/bull_cta_fixed_final_layout_v2.mp4` → `cta-join-report.json` PASS
- ⬜ 워터마크 제거 `run-remove-veo-watermark-once.mjs`
- ⬜ 오디오 마감 `run-audio-finish-once.mjs`(-14 LUFS, 배경음 없음)
- ⬜ 자동 검수 `run-episode-qa-once.mjs` — **반드시 수정 0** (+ 자막 읽는 표기 0건 확인)
## F. 자산·배포
- ⬜ 커버(유튜브 썸네일 겸용)·스토리 이미지(글자 좌우 8% 이상, 카드뉴스 없음)
- ⬜ 배포(Owner 지시 시에만): 35MB 이하 압축 → content unit(`youtubeTitle`에 `#Shorts` 금지) → 플랜 → 업로드 → **커버 merge** → 릴스 게시(coverUrl 확인) → 스토리 → 유튜브 `--privacy public`
- ⬜ 게시 장부 `BULL_EPISODE_LEDGER`에 11편 추가(industrial · cause_explainer · structure · semi 아님 · contrast) + 테스트
- ⬜ 배포 링크를 CURRENT_STANDARDS §7·메모리에 기록
