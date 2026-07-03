# GOLDEN SAMPLE V3.2 — AUTOMATION IMPLEMENTATION GAP ANALYSIS (v1)

- Task: `golden-sample-v3-2-automation-implementation-gap-analysis-v1` (read-only 조사 + planning only)
- 기준 계약: `_ai/GOLDEN_SAMPLE_V3_2_PRODUCTION_STANDARD.md` / `scripts/fixtures/golden_sample_v3_2_production_standard.v1.json`
- 기계용 계획: `scripts/fixtures/golden_sample_v3_2_automation_implementation_gap_analysis.v1.json`
- Flags: uploadReady=**false** · automationExpansionReady=**false** · implementationApproved=**false**
- 작성: 2026-07-03. 조사 방법: 5개 영역 병렬 read-only 조사 + 부모 세션 직접 재검증(아래 ★ 표시는 부모 세션이 파일을 직접 읽어 확인한 사실).

---

## 1. Executive Summary

**현재 파이프라인은 아직 v3.2-compliant가 아니다.** v3.2를 만족하는 메커니즘은 전부 Golden Sample runner 스크립트(단일 주제 하드코딩, ~445~560줄 클론)에만 존재하고, production 경로(app/api/generate-v2 · app/api/render-v2 · python/render_v2.py)와 Money Shorts OS creative layer는 표준과 정면 상충한다. **구현은 upload가 아니라 gate 이식 순서로 진행해야 한다** — 아래 Slice 1~6.

레포에는 3세대가 병존한다:

1. **Legacy Next.js 라인** (generate-v2/render-v2/render_v2.py, living_tips 계열) — scene별 TTS 기본값★, char-weight 씬 동기화, BlackHanSans/DoHyeon + silent default-font fallback, 하단 고정 sentence caption, tail-trim 교리(CLAUDE.md가 직접 지시). v3.2 재사용 불가(해당 용도로는 replace).
2. **Money Shorts OS 라인** (retention compiler/quality scorer/creative contract) — 30s 고정 listicle(첫째/둘째/셋째) + bottom-safe caption + atempo/apad 계열. **표준이 금지한 문법을 계약 수준에서 하드코딩** — contract v2 승계 없이는 사용 금지.
3. **Golden Sample v3.x 라인** — 표준 준수 메커니즘의 실제 소재지. 단, 전부 runner 내장·주제 하드코딩·7곳 중복(Pillow inline 렌더러)·fixture self-assessment 의존.

**최상위 리스크 (부모 세션 직접 검증★):** 자동화 확장은 현재 **정책으로만 차단되어 있고 구조적으로는 차단되어 있지 않다.**

- ★ `app/api/upload/route.ts` — **인증도 gate도 없는 live 업로드 엔드포인트.** env 자격증명만 있으면 POST 1회로 Instagram publish. uploadReady를 읽는 코드 아님.
- ★ `app/api/auto/route.ts` — categoryId 미지정 시 **Math.random 랜덤 주제로 free-running 생성** (표준 1단계 Owner 주제 확정 위반 구조). n8n cron(`n8n/workflow_autoshorts.json`, active:false)이 이 체인을 3회/일로 묶어둔 상태.
- ★ `automationExpansionReady`는 **코드(ts/tsx/mjs/js/py) 0곳** — 문서/fixture에만 존재. uploadReady도 scripts 계열 하드코딩 false + static guard일 뿐, app 레이어에서 읽는 곳 없음. 즉 두 flag는 현재 순수 문서적 장치다.
- ★ 업로드 인접 preflight 2곳이 **duration 30s±0.5를 하드코딩** (`build-owner-approved-upload-flow-dry-run.mjs:227`, `run-premium-editorial-live-upload-first-run-v1.mjs`) — v3.2 합격작(53.97s 자연 길이)이 오히려 **preflight FAIL** 하는 모순. 업로드 slice 전 반드시 교체.
- 실업로드 이력 1회 존재 (YouTube `eX622q9dNOI` / Instagram `17910778836241106`, --arm gated first-run) — 자격증명이 환경에 존재했거나 존재할 수 있음을 의미.

**두 번째 구조 리스크:** Script Impact Gate의 6점수는 fixture에 **손으로 쓴 self-assessment 숫자**다. v3.2 runner는 임계값 비교·abort는 코드로 강제하지만 점수를 계산하지 않는다 — 자동화에서 점수 생산 주체를 정하지 않으면 gate는 도장 찍기가 된다.

**세 번째 구조 리스크:** CLAUDE.md와 living-tips 문서 자체가 "sceneTts:true 또는 tail trim 필수"를 지시한다 — 프로젝트 지침을 그대로 따르는 에이전트가 표준 위반 산출물을 만든다. 적용 범위(라인 분리 vs 문서 개정)를 Owner가 정해야 한다.

## 2. Existing Assets to Reuse (검증됨)

| 자산 | 위치 | 재사용 형태 |
|------|------|------------|
| ChatGPT+Playwright page-wide 수집 + 1.8s poll + 3-stable save + hard cap + latency 측정 | `run-chatgpt-playwright-fresh-image-set-v3.mjs` / `...korean-banknote-patch-v3-1.mjs` | 로직 그대로, fixture-driven 파라미터화만 필요 |
| 이미지 md5 lock + fail-fast gate | blueprint `selected_image_set` + v3-1 renderer / v3.2 runner의 md5 gate | 그대로 재사용 |
| Pillow overlay 렌더 (Noto Black VF, stroke, overlay-spec JSON 계약) | v3/v3.1/v3.2 runner 내장 (inline PY ×7 중복) | **overlay-spec JSON이 자연스러운 모듈 경계** (v3.2가 v3.1 spec을 무변경 소비한 실적) — 1곳으로 추출 |
| 2-pass ffmpeg (lanczos 2160×3840 supersample → zoompan → EQ → overlay/fade/slide) | 동일 runner들 | 레시피 그대로 추출 |
| one-shot TTS + guard (--allow-live-tts/ALLOW_ELEVENLABS, budget cap, reuse-if-present) | v3.2 runner `stageTts` | production TTS 모듈의 원형 |
| alignment→phrase/word timing (`buildTiming`) + reflow (`buildReflow`, ±120ms, minDwell) | v3.2 runner | 모듈 추출 (실측 delta ≤50ms 실적) |
| 오디오 게이트 (silencedetect -35dB/0.35, 시작/first5s/ratio/active/clipped-tail/tail-hold) | v3.2 runner + fixture 기준치 | 표준 기준치와 값 일치 — 모듈 추출 |
| Script Impact Gate 코드 골격 (임계 비교 + hardFailCheck + TTS fetch 전 abort exit 30 + report) | v3.2 runner lines 377-404 | 재사용 — 점수 생산 주체만 결정 필요 |
| artifact audit (media/audio/captionCard/story 4-gate + frames + vision PENDING + uploadReady:false) | v3.2 runner AUDIT stage | canonical audit로 채택 |
| Owner 승인 gate 패턴 (approval fixture + abort, 결정적 blockerCodes) | `lib/owner-decision/gate.ts`, `run-money-shorts-automation-orchestrator-v1.mjs`(acceptedByOwner/nextJobAutomationApprovedByOwner), `build-owner-approved-upload-flow-dry-run.mjs` | v3.2 승인 fixture 스키마 변형으로 재사용 |
| no-live orchestrator 골격 (live flag 즉시 abort, static guard 동반) | `run-money-shorts-automation-orchestrator-v1.mjs` (+static guard) | stage 모델만 v3.2 11단계로 교체 |
| ★ paid API 가드 | `lib/paidApiGuard.ts` | 재사용. 단 ①PAID_API_ENABLED=true 시 미설정 세부 플래그 전부 허용되는 규칙 주의 ②ALLOW_ELEVENLABS 값 해석이 runner('1'\|'true')와 불일치 — 통일 필요 |
| 6-field visual evidence 선례 | `golden_sample_story_visual_rebuild_contract.v1.json` requiredSceneFields + `golden_sample_blueprint.salary_3days.v2.json` (5/6 필드 구현) | 표준 필드명으로 개명 + per-image reject_reasons 추가 |
| 로컬 dry-run 체이닝 | `run-local-money-shorts-pipeline-dry-run.mjs` (owner-approval fixture가 구조적 입력) | Slice 5 원형 |

## 3. Gap Table

상태: `reuse`(그대로 재사용) / `partial`(존재하나 gate/규칙 미비) / `missing`(없음) / `replace`(표준과 상충 — 교체/우회) / `block`(기능 존재하나 Owner 승인 전 사용 금지)

### 3-A. Pipeline Order / Owner 주제 확정 (§1)

| 요구 | 발견 | 상태 | 조치 | 리스크 |
|---|---|---|---|---|
| step 1 Owner 주제 확정 gate | 문서/fixture 절차만 (`owner_intent_interpretation.v1.md`, `topic_candidate_report.v1.json`, blueprint topic_status). 코드 gate 0. ★generate-v2·/api/auto는 Math.random 주제 | **partial** | 기계판독 owner_topic_confirmation artifact(topicId+승인상태) 정의 + 모든 생성 진입점이 미승인 주제 거부 | 자동화가 Owner가 이미 지적한 실패("주제 재확인 없이 계속 진행")를 재생산 |
| step 순서 자체를 강제하는 오케스트레이터 | v1 orchestrator는 구 ECOS stage 모델, v3.2 11단계 아님. n8n 체인은 QA/render 없이 generate→upload | **missing**(v3.2 stage) / **replace**(n8n) | v3.2 stage 모델 orchestrator를 no-live로 신설(기존 골격 재사용) | 즉흥 체이닝 = gate 생략 (v3-이전 실패 패턴) |

### 3-B. Story Gate (§2)

| 요구 | 발견 | 상태 | 조치 | 리스크 |
|---|---|---|---|---|
| 6점수 90/90/90/90/88/88 + hard fail 6종, TTS 전 code abort | v3.2 runner 단 1곳 (lines 377-404, exit 30). 점수는 fixture self-assessment(손으로 쓴 숫자) — 계산 아님. v3.1 runner에는 gate 없음(클론 드리프트 실증) | **partial** | 재사용 모듈로 추출(`lib/story-gate/` 또는 `check-*-static.mjs` 관례), 임계값은 standard JSON에서 로드, **점수 생산 주체 결정 필수**(Owner 결정 #1) + 점수 provenance 필드 요구 | 어떤 파이프라인이든 fixture에 합격 숫자를 붙여넣으면 통과 — gate가 장부 검사로 전락 |
| Story-Causality 사슬(beat=phrase=scene 1:1, bridge 필수)의 하드 gate | blueprint fixture 데이터 + 계약 문서 텍스트만. 검증 코드 0 (`lib/blueprints/validation.ts`는 구조 검사만, beat 분류 체계도 상이) | **missing** | blueprint 정적 검증기(no-LLM): 사슬 문법·bridge 유무·beat=phrase=scene 수 일치·6필드 존재를 fail-fast | 자동 생성 blueprint가 listicle/bridge-less를 내도 이미지/TTS 지출 전에 아무것도 못 막음 |
| 기존 calcQualityScore와의 관계 | 완전 직교(측정 축 0 겹침) + 충돌(10씬 고정, tail-trim 관행) | **replace**(v3.2 용도로는) | living_tips 전용 legacy QA로 유지, v3.2 gate로 확장 금지 | 두 시스템 모두 "score/pass"를 출력 — 기술 pass를 story gate pass로 오인하는 §8 실패 모드 |
| 대본 생성기 (v3.2 문법) | retention compiler + creative contract v1 = 30s 고정/3-point listicle/bottom caption **하드코딩** (LLM slot은 throw 상태) | **replace** | creative contract v2로 승계(자연 길이·인과 beat·storyGate 축) 후 compiler 재구축; 재사용부(금지어 스캔, source gate, LLM slots)만 이식 | 기존 compiler를 돌리면 거절된 80점 포맷을 대량 생산 |

### 3-C. Visual Evidence 6필드 (§3)

| 요구 | 발견 | 상태 | 조치 | 리스크 |
|---|---|---|---|---|
| 이미지당 claim/must_show/must_not_show/no-card/card역할/reject_reasons | 현행 v3/v3.1 계보: evidence_goal+visual_evidence prose+전역 hard_fails만. 구 T2 계보(`salary_3days.v2` + rebuild contract)가 5/6 필드 구현. **per-image reject_reasons는 레포 어디에도 없음** | **partial** | 신규 blueprint 스키마 v2: salary_3days.v2 필드셋을 표준 필드명으로 개명(what_story_claim_this_scene_proves→claim 등) + reject_reasons 추가 | reject_reasons 없으면 재생성 트리거가 run마다 주관적; no-card 필드 없으면 §3 cardRule이 기계검사 불능 |

### 3-D. ChatGPT+Playwright 이미지 생성 (§4)

| 요구 | 발견 | 상태 | 조치 | 리스크 |
|---|---|---|---|---|
| page-wide 수집(유저 첨부 제외) | v3/v3.1 `collectGenImagesPageWide` 구현 완료. 단 core 모듈에 assistant-scoped `collectLastAssistantImages`가 잔존(v1 runner·anchor helper가 사용) | **reuse** | v3 방식 재사용; assistant-scoped helper는 golden-sample 용도 deprecated 명시 | 새 runner가 v1 계열을 복사하면 DOM 밖 이미지 유실 |
| ~1-2s poll | POLL_INTERVAL_MS=1800 구현. 단 제출 후 25s passive window 선행(v3.2 샘플을 만든 검증된 동작) | **reuse** | 재사용 + 계약에 25s passive 해석 명시(Owner 결정 #9) | 낮음 |
| hard cap 사전 승인 + detect-to-save 30s 진단 | cap은 코드 상수(12/6)로 강제 — fixture와 이중 관리. 30s 초과는 flag+warn만, 원인 진단 자동 캡처 없음 | **partial** | cap을 승인 fixture 단일 소스로; 초과 시 진단 스텁(스크린샷+DOM 요약) 자동 첨부 | 클론 상수 드리프트; 진단이 사람 눈에 의존 |
| 941x1672 기록 + viewer-frame QA | 계약(`chatgpt_playwright_image_generation_contract.v1.json`) + lanczos supersample 체인 구현 완료 | **reuse** | 그대로 | 없음 |
| sidebar scan/구대화 재사용 금지 | v3 계열 준수(새 대화 강제, 현재 페이지만 recover). 단 동일-run 이미지 회수 예외의 준수 구현은 없음(v1의 --recover-latest는 assistant-scoped) | **reuse** | 필요 시 --recover-latest를 v3 base에 이식 | 낮음 |
| md5 lock | blueprint 내장 + 2곳 fail-fast gate 구현 완료 | **reuse** | 재사용. 단 잠긴 원본이 output/·C:\tmp(휘발) — 내구성 정책 필요(Owner 결정 #5) | 원본 유실 시 재생성 md5 상이 → 전면 재QA |
| 유료 fallback 승인 gate | ChatGPT runner는 준수. ★render-v2는 Imagen↔Pollinations **자동** fallback(LEGACY 문서화됨). FLUX2/OpenAI-image 스크립트는 **API 키 존재만으로 실행**(ALLOW_* 가드 없음) | **replace**(render-v2 경로) / **partial**(가드) | v3.2 자동화는 render-v2 이미지 분기 전체 우회; FLUX2/OpenAI-image에 ALLOW_* 가드 추가 검토(Owner 결정 #8) | PAID_API_ENABLED=true 시 미설정 플래그 전부 허용 → 조용한 과금 |
| 파라미터화된 재사용 runner | 없음 — 445줄 클론 ×3 (fixture 경로/cap 상수만 상이) | **missing** | 승인 후 fixture-driven 단일 runner로 추출 (4번째 클론 금지) | 클론 드리프트가 문법 재현성의 최대 위협 |

### 3-E. 한국 화폐 시각 표준 (§5)

| 요구 | 발견 | 상태 | 조치 | 리스크 |
|---|---|---|---|---|
| hard fail 7종/accepted 4종의 기계 표현 | prompt fixture global_rules + blueprint 전역 hard_fails에 부분 존재. per-image 판정 기준 없음. 판정 자체는 수동 vision QA | **partial** | blueprint v2의 per-image reject_reasons에 화폐 hard fail 어휘 수용; vision QA 체크리스트를 audit 스키마에 정식 필드화 | 자동화 시 화폐 QA가 run별 재량이 됨 |
| 라벨/숫자는 renderer 책임 | 준수 (이미지 내 텍스트 금지 규칙 fixture 존재). 단 기존 데이터카드 자산 빌더(`build-ecos-live-yohan-koo-data-card-assets.mjs`)가 **Malgun Gothic SVG** — 금지 룩 | **replace**(데이터카드 자산) | 데이터카드 필요 시 Pillow/Noto Black 모듈로 재렌더 | 기존 자산 재사용 시 금지 폰트 룩 유입 |

### 3-F. 타이포/캡션 (§6)

| 요구 | 발견 | 상태 | 조치 | 리스크 |
|---|---|---|---|---|
| Pillow+Noto Black이 production 경로 | Golden Sample runner 내장 inline PY ×7 중복만. ★production(render_v2.py)은 BlackHanSans/DoHyeon + **silent default-font fallback**. Noto VF는 시스템 폰트 의존(C:/Windows/Fonts, 레포 미포함) | **partial** | 공유 모듈 추출(overlay-spec JSON 경계) + 폰트 vendoring/고정 결정(Owner 결정 #6) + render_v2.py 경로 우회 | 7곳 중복 드리프트; render_v2.py 기반 자동화는 폰트부터 비준수 |
| bottom-fixed bar/karaoke 금지 | **다중 위반 경로 존재**: render.py ASS karaoke(Alignment 2, 현재 단어 옐로우 — 금지 패턴 그 자체), manifest renderer·premium-editorial renderer의 Arial 하단 ASS, render-plan builder의 y=h-120 drawtext, render_v2.py 하단 sentence caption. 심지어 `check-visual-only-render-static.mjs`는 **.ass 사용을 요구**(비준수를 강제하는 가드) | **replace** | v3.2 콘텐츠에서 전 ASS/drawtext 하단 경로 우회·교체; .ass 요구 static guard 버전 교체 | 재사용 즉시 Owner가 거절한 v1/v2 문법 재생산 |
| word-anchor 캡션 (±120ms) | v3.2 runner에만 존재(실측 ≤50ms). ★production은 scene-duration 비례 배분(char-weight) | **partial** | buildTiming/buildReflow 모듈 추출; anchor plan 일반화(indexOf 첫 일치 바인딩은 자동 anchor 선정 시 취약 — 개선 필요) | render-v2 경로는 고정 길이 캡션을 조용히 출하 |
| safe frame(y≤1580/1632) 코드 gate | **실행 가능한 기하 gate 0** — 값은 주석/fixture 데이터로만 존재. 유일 자동 검사는 캡션 12자 제한. (선례는 접근금지 legacy v1 runner 내부에만 — grep 근거) | **missing** | overlay-spec JSON 대상 정적 기하 gate(text bbox y2≤1580, graphic y2≤1632, 줄길이, card 겹침) — spec에 좌표/폰트크기 전부 있어 즉시 구현 가능 | 다중 주제 자동 생성 시 플랫폼 UI 아래 텍스트 출하 (v2에서 실제 발생, 수동 rework로만 발견) |

### 3-G. TTS/오디오/Mux/Audit (§7)

| 요구 | 발견 | 상태 | 조치 | 리스크 |
|---|---|---|---|---|
| one-shot with-timestamps 강제 | runner 3종에만. ★production render-v2는 `sceneTts !== false` — **scene별 TTS가 기본값**(route.ts:991); one-shot fallback도 timestamps 없는 endpoint + OpenAI TTS silent fallback | **replace**(production 경로) | render-v2 TTS 분기 우회/재작성; timestamps 없는 fallback provider는 re-anchor를 깨므로 금지 | 자동화가 render-v2 기본값 호출 시 scene별 유료 호출 N회 + 거절된 v2 케이던스 |
| padding/hard-trim/고정길이 금지 | **위반 광범위**: render_v2.py `_add_audio` -t 하드트림(LH-9 6.85s mismatch 원인), mux-local의 apad/-shortest/30s±0.5 검증, scene-paced 빌더 3종의 apad+atempo+30s 고정, voice formatter 타입 15\|30\|60, **CLAUDE.md·living-tips 문서가 tail-trim을 지시** | **replace** | v3.2 mux 패턴(videoEnd=speechEnd+tailHold, -t/-shortest/apad 없음)만 사용; scene-paced/atempo 계열 및 tail-trim 교리를 pre-v3.2 legacy로 명시 격리(Owner 결정 #2) | 프로젝트 지침 준수가 곧 표준 위반이 되는 문서-코드 충돌 |
| live guard + 호출 상한 | runner guard 완비. ★lib/paidApiGuard 별도 체계(값 해석 불일치: 'true'만 vs '1'\|'true'). **가드 없는 ElevenLabs 빌더 2종**(키 존재=호출), **.env.local을 변조하는 _lh10 스크립트**(crash 시 PAID_API_ENABLED=true 잔류 위험) | **partial** | runner guard 관례로 표준화; 가드 없는 빌더에 guard 추가 또는 폐기; env 변조 패턴 deprecated; ALLOW_ELEVENLABS 해석 통일 | 키만 있으면 유료 호출 발화; env 오염 |
| 오디오 게이트 | v3.2 runner 완비(-35dB/0.35, 표준값 일치). standalone audit는 **다른 검출 설정(-40dB/0.4) + 게이트 3종 누락** — 임계 드리프트 실존 | **partial** | 단일 오디오 게이트 모듈로 통합(-35dB/0.35 canonical, Owner 결정 대상 아님 — acceptance lock 근거) | standalone audit가 runner-FAIL 아티팩트를 PASS시킴 |
| alignment→re-anchor 모듈 | 로직 검증됨, 3곳 중복, anchor miss는 fail-fast(exit 13) | **partial** | (alignment, phrases, anchorPlan)→(scenes, overlays, evidence) 모듈 추출 | 반복어 첫 일치 바인딩 취약성 |
| artifact audit + vision | v3.2 AUDIT stage가 canonical (4-gate+frames+vision PENDING+uploadReady:false) | **reuse** | 재사용. vision QA는 외부 필수 단계로 유지 — **PASS_CANDIDATE_PENDING_VISION_QA를 종결 PASS로 오인 금지** 규칙 명문화 | 자동 루프가 PENDING을 PASS로 처리할 위험 |

### 3-H. 오케스트레이션/업로드 준비 (표준 §1 step 10-11, §8)

| 요구 | 발견 | 상태 | 조치 | 리스크 |
|---|---|---|---|---|
| uploadReady/automationExpansionReady 코드 강제 | ★automationExpansionReady 코드 0곳; uploadReady는 scripts 하드코딩 false+guard만, app 레이어 0곳. **standard JSON을 프로그램적으로 읽는 코드 0** | **partial** | 모든 orchestrator/upload 진입점이 v3.2 계약 JSON flag를 읽고 false면 abort하는 코드 게이트 신설 | flag가 순수 문서 장치 — 종이 위 준수 |
| 업로드 통합 | ★기능 완결 + 이력 1회: lib/instagram.ts(Graph v19 전체 흐름), lib/youtube.ts(insert, **privacyStatus public**), --arm gated live runner. ★/api/upload는 **무인증·무게이트**. UploadPanel.tsx는 orphan(마운트 안 됨) | **block** | Owner 승인 전 전부 비활성 유지. 승인 시 --arm runner 패턴 채택 + **30s preflight를 manifest-driven 길이로 교체**. /api/upload·UploadPanel 하드닝 vs 폐기 결정(Owner 결정 #3) | env 자격증명만으로 POST 1회 publish 가능; v3.2 아티팩트가 기존 preflight에 걸려 시간압박 하의 임기응변 우회 유발 |
| E2E 오케스트레이터 + Owner QA 필수화 | n8n 체인(비준수: QA/render 없음, imageUrl을 video로 업로드하는 버그, 하드코딩 API 키, active:false), v1 orchestrator(no-live+Owner gate 골격 유지, stage 모델 구식), 로컬 dry-run 체인(owner-approval fixture 구조 입력 — 좋은 선례) | **replace**(n8n) / **partial**(orchestrator) | n8n workflow 폐기 또는 전면 교체; v3.2 11단계 orchestrator 신설(기존 골격+Owner gate 재사용); Owner QA(step 10)는 수동 단계이므로 fire-and-forget cron 불가 — queue+승인 모델 필요 | n8n JSON import+active:true 한 번으로 스케줄 비준수 publish |
| 업로드 큐/상태 지속화 | 큐 구현 0 (roadmap Phase 7; 모든 report가 uploadQueueReadinessGenerated=false + static guard가 true 금지). Supabase generations는 상태 enum이 rendered→uploaded 직행(준비 상태 없음) | **missing** | 큐 스키마 신설 시 v3.2 gate 결과(story gate 점수·md5·오디오 게이트·owner_qa_pass·uploadReady) 운반 필수; `money_shorts_owner_upload_approval_v1` fixture가 확장 원형 | generations 스키마 그대로 쓰면 "기술 pass=업로드" 가정을 코드에 재각인 |
| 스케줄러 | n8n workflow 1건(구 루프 대상) 외 없음(vercel cron 0, GH Actions 0) | **replace** | step 11 승인 전 스케줄러 신설 금지 | 낮음 (계정/인스턴스 없으면 비활성) |

## 4. Recommended Implementation Slices (승인 전 착수 금지)

**Slice 1 — Story/Visual-Evidence 계약 + 정적 가드 (low-risk foundation, 권장 1순위)**
- blueprint 스키마 v2: 표준 6필드명 + per-image reject_reasons + beat=phrase=scene 1:1 + bridge_to_next + storyGate 블록(점수 provenance 필드 포함) + owner_topic_confirmation 필드.
- 정적 검증기 신설(no-LLM·no-API·no-write): 인과 사슬 문법, bridge 유무, 수 일치, 6필드 존재, 임계값(standard JSON 로드), 화폐 hard-fail 어휘, safe-frame 기하(overlay-spec 대상), 금지 상태 스캔.
- 산출: fixture + `check-*-static.mjs` 관례의 스크립트. 유료 호출 0, 기존 코드 수정 0 — 이후 모든 슬라이스의 안전망.

**Slice 2 — ChatGPT+Playwright 생성 runner 하드닝**: v3 로직을 fixture-driven 단일 runner로 추출(cap 단일 소스, 진단 자동 캡처, --recover-latest 이식, assistant-scoped helper 격리). live 생성 실행은 별도 승인.

**Slice 3 — Pillow 렌더러 production화**: inline PY 7곳 → 공유 모듈(overlay-spec JSON 경계), safe-frame 정적 gate 연결, 폰트 vendoring, '동등성 검증'(v3.2 lock 아티팩트와 프레임 비교) 방법 정의.

**Slice 4 — TTS-first 타이밍/오디오/audit 통합**: stageTts/buildTiming/buildReflow/오디오 게이트/audit 모듈 추출, guard 체계 통일, standalone audit 임계 통일(-35dB/0.35), Script Impact Gate 모듈화(+점수 생산 프로세스 반영).

**Slice 5 — End-to-end dry-run**: v3.2 11단계 no-live orchestrator(기존 골격 재사용, Owner gate·flag 코드 게이트 포함)로 기존 lock 아티팩트 대상 전 구간 dry-run — 신규 생성/호출 0.

**Slice 6 — Upload readiness (Owner QA 후에만)**: 30s preflight 교체, /api/upload·UploadPanel·n8n 처분 집행, 승인 fixture v3.2 변형 + 큐 스키마 — **실업로드는 여기서도 별도 명시 승인**.

## 5. Explicit Forbidden Next Steps

- **Upload 금지** (플랫폼 불문, /api/upload 호출 포함).
- **live 생성/API 금지** — Owner가 구체 slice를 승인하기 전까지 ChatGPT/Playwright 생성, OpenAI/FLUX2/Gemini/Midjourney, ElevenLabs live TTS, render/mux 재생성 전부.
- **automation queue 생성 금지** (uploadQueueReadinessGenerated는 계속 false).
- n8n workflow 활성화/import 금지. /api/auto·/api/upload 사용 금지. .env/secret/dependency 변경 금지.
- 이 문서와 fixture는 계획이며, **implementationApproved=false** — Slice 1조차 Owner 승인 후 착수.

## 6. Next Owner Decisions Needed

1. **Script Impact Gate 점수 생산 주체** — self-assessment fixture(수동) / LLM-judge 단계 / Codex 판정 단계 중 무엇을 공인하는가 + provenance 필드 의무화 여부.
2. **legacy 라인 적용 범위** — living_tips(generate-v2/render-v2)와 CLAUDE.md tail-trim·sceneTts 지침을 v3.2 표준 밖 별도 제품 라인으로 명시 분리할지, 문서를 개정할지.
3. **/api/upload + UploadPanel + n8n workflow 처분** — 하드닝(인증+readiness gate) vs 폐기.
4. **blueprint 스키마 통일** — salary_3days.v2 필드명→표준 6필드명 매핑 확정; lib/blueprints VideoBlueprint(비호환 beat 분류)와의 관계.
5. **md5-locked 원본 이미지 내구성 정책** — output/·C:\tmp 휘발 대응(백업 위치/규칙).
6. **Noto Sans KR Black VF vendoring** — 시스템 폰트 의존 제거 여부(BlackHanSans의 지위 포함).
7. **계약 이원화 해소** — money-shorts creative contract v2 승계 vs v3.2 standard JSON 단일 계약.
8. **FLUX2/OpenAI-image 스크립트 ALLOW_* 가드 추가** (현재 키 존재=실행 가능).
9. **poll 해석 확정** — 25s passive window(v3.2를 만든 실동작) 인정 vs 제출 즉시 1-2s poll.
