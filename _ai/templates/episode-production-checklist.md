# {캐릭터} {표시 N}편 제작 체크리스트 (파일 번호 {F}) — 규칙 23·26·27, 단계가 끝날 때마다 ✅/❌와 증거(명령·결과 파일)를 적는다

> 새 편을 시작하면 이 파일을 `_ai/{char}-ep{N}-production-checklist.md`로 복사한다. ⛔ 표시는 **코드가 막는 게이트**(통과 못 하면 다음 단계 명령이 멈춘다), 👁 표시는 **사람이 눈으로 보고 기록을 남겨야 하는 단계**다. "확인했다"는 말 대신 증거(명령 출력·파일 경로)를 적는다. 못 본 것은 "못 봄"으로 적는다.

## 0. 시작 전 (매 편)
- ⬜ CURRENT_STANDARDS를 **그 세션에서 직접 열어** 읽음: 최우선 규칙(1~27) → A-2 → 캐릭터 섹션(부엉 §1 / 황소 §3) → §7 재고·다음 번호. 요약 메모리로 대신하지 않는다(규칙 26).
- ⬜ 표시 번호 ↔ 파일 번호 확인(§7 표). 같은 파일 번호를 다른 소재가 쓰고 있지 않은지 `ls scripts/_{char}-*ep{F}*`로 확인.

## A. 소재·대본
- ⬜ 소재 탐색: 오케스트레이터 **새로** 실행(규칙 25) — 황소 `node scripts/run-bull-topic-full-scan-once.mjs` / 부엉 `node scripts/run-owl-topic-full-scan-once.mjs`. SCAN_CHECKLIST.md를 보고에 첨부.
- ⬜ 담당 캐릭터(규칙 22)·쏠림 점검(mix-check)·특보 근접도/대상 폭·체감 크기(규칙 11·13).
- ⬜ 팩트: 공식 원문 우선, 출처 2곳 이상, 불일치 수치는 제외 목록에 기록. 정부 제도명 운영 여부 확인.
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
- ⛔ 커버·스토리: 글자 없는 생성 → `run-cover-headline-overlay-once.mjs`(줄당 8자 이하, 140px 미만이면 실패) → `.headline.json` 기록 생성.
- ⬜ 압축(35MB 이하) → 콘텐츠 유닛: `finalMasteredPath`·`qaReportPath`(필수), `youtubeTitle`에 #Shorts 없음.
- ⛔ **배포 전 게이트** `node scripts/run-deploy-preflight-once.mjs --content-unit <…>` — 게시 명령(릴스·스토리·유튜브)이 자동으로 다시 돌린다. 유튜브는 `--privacy public` 없으면, 릴스는 커버 merge 결과가 아니면 막힌다.
- ⬜ 배포는 **Owner 지시 시에만**(§5 순서). 부엉 배포 시점은 Owner가 정한다(제안 금지).
- ⬜ 게시 후: 링크를 §7·메모리에, 장부(`BULL_EPISODE_LEDGER`·`OWL_EPISODE_LEDGER`) 갱신·테스트. 유튜브 썸네일 반영(maxresdefault) 확인.

## 보고 형식(규칙 27)
- 단계별 ✅/❌/⛔통과 여부와 **증거**(명령·결과 파일), **검증한 것 / 못 본 것**을 나눠 적는다.
