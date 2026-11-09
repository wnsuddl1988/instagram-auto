# AutoShorts AI — Claude Code 지침

## 🔴🔴🔴 스토리형 쇼츠 대본 규칙 = 어떤 작업보다 먼저 (Owner 2026-10-08 "대본규칙 안 보고는 절대 작성하지 마" · 2026-10-11 "최우선 규칙으로 박아놔, 매회 최신버전으로 수정해")

**스토리형 대본·설계를 쓰거나 고치기 전(한 문장 수정도 포함)에, 쓰는 사람(나 또는 위임받은 에이전트)이 아래를 이 세션에서 직접 연다. 열지 않았으면 쓰지 않는다. 검사기 통과는 규칙 준수의 증거가 아니다(10/11: 검사기를 통과한 판이 규칙 위반투성이였다).**

00. **★★★★ 기본 베이스 구조 = 절대규칙(Owner 2026-10-11 밤 "앞으로 이 구조를 기본 베이스로 대본 작성해, 무조건이야, 최우선 규칙")**: 11~15편 확정 구조(`_ai/story-base-scripts/` 5편 + [`_ai/templates/story-script-base-structure.md`](_ai/templates/story-script-base-structure.md)의 비트 맵)가 스토리형 **주제 셀렉·설계·대본의 기본 베이스**다. Owner가 "~~편 주제 찾자 / 셀렉 / 대본 작성"이라고 하면 이 기준으로 후보를 뽑고(상식 테스트·퍼즐과 그 답 2출처·숫자별 2출처·날짜 3개 이하) 이 구조로 쓴다. 맥락에 맞게 가감하되 벗어나지 않는다. 검사기(`scripts/_story-script-standards.mjs` v4)가 이 구조 기준이지만 **검사기 통과 ≠ 규칙 준수**다.
0. **Owner 9원칙(2026-10-11 밤, 규칙 파일 맨 위에 원문 고정 — 매 작업 첫머리에 다시 읽는다)**: ① 사람들이 관심 있는 주제 ② 감동 실화·흥미·긴장·몰입·반전 ③ 경제번역소 시그널을 엄청 자연스럽게 녹임 ④ **처음부터 결과를 던지고 설명하면 "아~" 하고 넘어간다 — 결말은 끝까지 쥔다** ⑤ **계속 넘어갈 수 없는 이유(열린 고리)를 만들며 긴장을 끌고 간다** ⑥ **Owner가 한 번에 OK한 적이 없다 → 보고 전 Owner 시점으로 2번 읽고 고친다** ⑦ 1~10편 구조·맥락을 분석해서 쓴다 ⑧ 긴장·몰입·맥락으로 시청 시간·이탈 방지 ⑨ 이 부분에 신경 안 쓰는 게 가장 큰 문제. **주제는 바꾸지 않는다 — 대본이 약하면 주제가 아니라 대본을 고친다**(교체는 Owner 요청 또는 설계 단계에서 퍼즐 답이 사료에 없을 때 1회·근거와 함께). 보고에는 **장면별 열린 고리 표**(장면 번호 / 다음이 궁금한 이유 / 결말 노출 여부)를 붙인다. structure-v1의 "결과를 먼저 주고"는 이 원칙 ④가 우선한다.
1. **열기(이 순서)**: ① [`_ai/story-script-rules.md`](_ai/story-script-rules.md) **전체**(맨 위 열기 목록·누적 Owner 피드백 포함) → ② [`_ai/story-format-structure-v1.md`](_ai/story-format-structure-v1.md)의 §2-00·§2-0·§2-0-1·§2-0-2·§4·§9-1 → ③ 기준 편 대본 2개 이상을 실제로 열어 문장 단위 대조 → ④ 해당 편·소재의 메모리 피드백.
2. **열기 증거**: 첫 보고 맨 위에 위 문서에서 *이번 작업에 적용하는 규칙 문장*을 한 줄씩 **원문 그대로** 인용한다. 인용이 없으면 열지 않은 것으로 본다.
3. **순서**: 열기 → **설계 줄**(전달 메시지·채널 적합성·키워드·**훅 후보 2~3개와 점검표 결과**·긴장 지점·**경제 번역 지점 2~4곳**·**날짜 목록(2~3개)**·결정적 장면과 그 출처 2곳)을 Owner에게 먼저 보고 → 승인 후 대본 → Owner와 맞춰 가며 수정. Owner가 "대본부터 보고"라 해도 설계 줄은 대본 위에 반드시 붙인다.
4. **보고 전 자체 점검**: [`_ai/templates/story-script-preflight.md`](_ai/templates/story-script-preflight.md)의 항목을 전부 채워 보고에 붙인다(날짜 개수·단독 출처 숫자·문장 틀·덧붙임·인과 순서 등). 비어 있으면 보여 주지 않는다.
5. **규칙은 매회 최신으로**: Owner가 대본에 대해 지적·확정·새 요구를 할 때마다, **대본을 고치기 전에** `_ai/story-script-rules.md`의 "누적 Owner 피드백"에 날짜·Owner 원문·규칙 문장을 먼저 추가하고 변경 이력에 한 줄 남긴다. 대본을 다시 보고할 때마다 규칙 파일을 다시 열어 최신 상태와 대조한다. 메모리에만 적고 규칙 파일에 안 적는 것은 위반이다.
6. **위임**: 에이전트에 대본을 맡길 때는 규칙 파일 전문(누적 피드백 포함)을 프롬프트에 그대로 붙인다.
7. 독자 검수(소재 읽기 점검·새 독자 점검)는 폐지(하지 않는다), 소재는 러너로 찾는다. Owner가 고친 문장·좋다고 한 구간은 건드리지 않는다. 기준 편 = 1편 `C:/tmp/story-ep1-gold/gold-scenes-final.json`, 2편 `story-ep2-samsung/samsung-scenes-v6.json`, 5편 `story-ep7-anycall/scenes-v9.json`, 6편(현대 보증), 9편 `story-ep9-hanaro/scenes-v3.json`, 10편 `story-ep10-yuhan-kimberly/scenes-v6.json`.

## 🔴 최우선 — 작업 시작 전 반드시 먼저 읽을 것

**[`_ai/CURRENT_STANDARDS.md`](_ai/CURRENT_STANDARDS.md)가 이 프로젝트의 유일한 현행 기준이다.** 맨 위 "★ 최우선 규칙"(현재 1~29)을 먼저 읽고, 해당 작업 단계(§A-1~A-8)와 캐릭터 섹션(§1 부엉박사 / §3 황소특보)을 **그 세션에서 직접 열어** 읽은 뒤 시작한다. **메모리는 색인일 뿐 기준의 원문이 아니다** — 요약 메모리로 구조를 떠올려 대본을 쓰다가 위반 6개가 난 적이 있다(2026-09-30, 규칙 26). 메모리·대화 기억·옛 문서와 충돌하면 그 문서를 따르고, 충돌 사실을 Owner에게 보고한다.

**하드 규칙은 Owner 발언 근거가 있을 때만(규칙 28)** — 내가 선택지·제안에 곁들인 수치(씬 수 등)를 "Owner 결정"으로 기록하지 않는다. 근거표: [`_ai/owner-rule-provenance.md`](_ai/owner-rule-provenance.md).

**실수는 기억이 아니라 게이트로 막는다(규칙 27)** — 아래 명령은 통과 못 하면 다음 단계가 멈춘다. 우회하지 않는다.
- 대본: `node scripts/check-script-standards.mjs --character owl|bull --scenes <json> --hook-type T#` → 반드시 수정 0(TTS 래퍼·QA에도 자동으로 걸려 있음). 결과 표를 보고에 붙인다.
- 완성본: `run-episode-qa-once.mjs` → 반드시 수정 0. 보드·카드 씬은 `qa/edge-review-*.png`를 보고 `qa/edge-review.json`에 씬마다 ok/over 기록.
- 커버: `run-cover-headline-overlay-once.mjs`(140px 미만이면 실패).
- 배포: `run-deploy-preflight-once.mjs --content-unit …`(게시 명령이 자동으로 다시 돌림). 콘텐츠 유닛에 `finalMasteredPath`·`qaReportPath` 필수.
- 새 편은 `_ai/templates/episode-production-checklist.md`를 복사해 단계마다 증거를 적는다. 보고에는 "검증한 것(증거) / 못 본 것"을 나눠 적는다.

세션·계정이 바뀌었으면 [`_ai/CONTEXT_TRANSFER_CLAUDE.md`](_ai/CONTEXT_TRANSFER_CLAUDE.md)에서 진행 중 작업을 이어받는다.

자주 틀렸던 것(반드시 지킬 것):
- 황소특보는 5편부터 **대본 구조 v3만** 쓴다(옛 구조로 되돌아가지 않음). 부엉박사는 새 11편부터 **대본 구조 v2**(미배포 재고 7편도 v2로 다시 만들어 재배치, CURRENT_STANDARDS §1·§7), 금박사는 11편부터 오프닝을 훅 뒤로 옮긴다.
- 이미지: 작은 글씨 금지 / 소품은 감싸 쥐거나 바닥 거치 / 빈 면 금지 / 캐릭터는 화면 세로 45~50%. `VEO_SAFE_IMAGE_RULE` 등 이미지 규칙 상수를 제거하지 않는다.
- 영상 프롬프트는 `_ai/bull-ep4-video-generation-prompts.md` 형식 그대로 쓰고, 8초끼리·10초끼리 묶어서 준다.
- 조립 후 CTA 결합까지 한 번에: `run-owl-episode-with-fixed-cta-once.mjs --alignment …` 실행 후 `cta-join-report.json` PASS를 확인한다. xfade·수동 ffmpeg 결합을 쓰지 않는다.
- 카드뉴스는 **2026-09-30부로 전면 중단**(만들지도 게시하지도 않음). 금박사도 운영 중단. 배포는 CURRENT_STANDARDS §5 순서 그대로(커버 merge, `--privacy public` — 둘 다 게이트가 막는다). 부엉박사 배포 시점은 Owner가 정한다(제안 금지).
- 소재 탐색은 요청할 때마다 오케스트레이터를 새로 전부 실행(규칙 25): 황소 `run-bull-topic-full-scan-once.mjs`, 부엉 `run-owl-topic-full-scan-once.mjs`. 채널 분야 = 경제·금융 전반(규칙 24).
- 금박사 5편 이후 재고는 기본적으로 `geumbaksa-ep{N}-final-v2voice` 경로(새 목소리)를 쓰되, 조립 기록(`assembly-manifest.json`)의 화면 길이가 오디오 길이보다 1초 넘게 짧으면 화면·대사가 어긋난 것이니 재조립본(예: `-v3std`, `-v4std`)을 쓴다 — CURRENT_STANDARDS §7의 최신 경로가 항상 우선(2026-09-27 확인: ep5·ep6·ep8은 재조립본이 최종).
- 모델은 기본 **Sonnet**(주제 선정·대본은 high, 검수·조립·배포는 medium~high)이다. Opus는 대본 구조를 새로 설계하거나, 같은 결과물이 2번 넘게 반려되거나, 원인을 못 찾는 문제가 반복될 때만 예외로 쓴다(CURRENT_STANDARDS 상단 "모델 권장 기준" 참고, 2026-09-27 Owner 확정).

## Main AI

이 프로젝트의 Main AI는 **Claude Code**다(Owner 확정 2026-09-17, Codex 미사용·교차검수 불필요).

## 실행 원칙

- `pnpm`만 사용한다.
- 작업 전 `git status -sb`로 기존 변경을 확인하고, 기존 Owner 변경을 덮어쓰지 않는다.
- 외부 게시, 유료 API, env/secret, DB, 배포, commit, push, 삭제는 Owner의 명시적 승인 없이 실행하지 않는다.
- 자격증명은 `scripts/run-owner-command-with-local-env-no-log.mjs` 래퍼로만 주입한다. `.env.local`을 읽지 않는다.
- 브라우저 자동화는 CDP+Playwright로만 한다(computer-use로 화면을 조작하지 않음).
- 사용자에게 보이는 진행·보고는 한국어로 한다.

## 기술 기준

- Next.js App Router, TypeScript, Node 스크립트(`scripts/`), FFmpeg
- 영상: 1080x1920, 9:16 (길이는 캐릭터별 CURRENT_STANDARDS 기준)
- 플랫폼: Instagram Graph API, YouTube Data API v3
