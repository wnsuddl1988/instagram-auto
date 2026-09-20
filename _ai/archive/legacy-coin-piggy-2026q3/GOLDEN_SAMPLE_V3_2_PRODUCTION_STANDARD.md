# GOLDEN SAMPLE V3.2 PRODUCTION STANDARD (v1)

- 목적: v3.2 Golden Sample(`t1_lifestyle_inflation`, mux md5 `9f5ad22c02cb4f4f813a1ed16fd658b0`)에서 검증된 품질 문법을, 이후 자동화 구현이 추측 없이 재현할 수 있는 표준으로 추출.
- 성격: **문서/계약이지 구현이 아니다.** 이 표준의 존재가 자동화 가동 승인을 의미하지 않는다.
- Flags: uploadReady=**false** (Owner 업로드 승인 전) · automationExpansionReady=**false** (자동화 구현 승인 전).
- 기계용 계약: `scripts/fixtures/golden_sample_v3_2_production_standard.v1.json` (구현 시 이 JSON이 기준).
- 근거: `_ai/GOLDEN_SAMPLE_V3_2_ACCEPTANCE_LOCK.md` / `_ai/GOLDEN_SAMPLE_V3_2_FINAL_QA_PACKET.md` / checkpoint `062eb02`.
- 작성: 2026-07-03.

## 1. Pipeline Order (필수 순서)

1. Owner 주제 확정
2. **Story-Causality First** — problem → cause → illusion → reframe/solution → action → result 인과 사슬 설계 (beat = phrase = scene 1:1)
3. **Visual Evidence Second** — 각 이미지는 주장(claim)의 증거이지 예쁜 배경이 아니다
4. 이미지 생성 (ChatGPT+Playwright 경로, §4)
5. 이미지 QA + **md5 lock**
6. Pillow bold typography render (§6)
7. TTS-first one-shot narration (§7 — Script Impact Gate 선행)
8. Word/phrase anchored dynamic captions (실측 타이밍 re-anchor)
9. Artifact audit (media/audio/caption/story + vision)
10. Owner 시청/청취 QA
11. **그 후에만** upload / automation expansion을 별도 승인으로 진행

순서 건너뛰기 금지. 특히 4 이전에 2·3 없이 이미지부터 만드는 것 금지 (v3 이전 실패 패턴).

## 2. Story Gate (live TTS 전 필수 통과)

| 항목 | 기준 |
|------|------|
| hook_self_relevance | ≥ 90 |
| story_causality | ≥ 90 |
| problem_solution_bridge | ≥ 90 |
| solution_specificity | ≥ 90 |
| save_worthiness | ≥ 88 |
| spoken_naturalness | ≥ 88 |

**Hard fail (하나라도 해당 시 즉시 재작성, TTS 금지):** generic hook · 문제-해결 bridge 부재 · 추상어로만 끝나는 해결책("관리/정리/절약하세요") · "3개/세 가지"를 말하면서 이름·화면 미표시 · 통계/팩트 invent · Owner 승인 없는 주제 변경.

v3.2 통과 예시 점수: 91/92/91/92/89/90. gate는 runner가 코드로 강제한다 (미통과 시 TTS fetch 전 abort — v3.2 runner 선례).

## 3. Visual Evidence Standard

각 scene/image는 다음 6개 필드를 blueprint에 명시해야 한다:

1. **claim** — 이 이미지가 증명하는 주장
2. **must_show** — 반드시 보여야 하는 것
3. **must_not_show** — 나오면 안 되는 것
4. **no-card 이해 가능성** — 카드 없이도 시청자가 뜻을 알 수 있는 이유
5. **card/caption 역할** — 카드가 이미지에 무엇을 더하는지
6. **reject reasons** — 재생성 트리거 조건

원칙: **카드는 이미지를 강화하는 것이지, 무관한 이미지를 구조하는 것이 아니다.** 카드를 지웠을 때 이미지가 스토리와 무관해 보이면 그 이미지는 fail.

## 4. ChatGPT+Playwright Image Generation Standard

- ChatGPT+Playwright는 이 품질 문법의 **preferred Golden Sample image path** (이 샘플 기준 FLUX2/OpenAI 유료 API 아님).
- **941x1672 native 해상도는 알려진 기술 리스크**로 기록하되, viewer-frame(재생 화면) 기준 Owner QA가 수용하면 pass.
- 이미지 개수는 **story-driven** — 4/6/9 고정 금지. 단일 이미지 장기 dwell 회피.
- 재생성 트리거: visual evidence 불충족, 한국 맥락 이탈, money clarity fail (§5).
- **slice별 재생성 hard cap은 생성 시작 전 Owner 승인 필수.**
- **유료 provider fallback은 별도 승인 필수.**

속도/운영 규칙 (v3/v3.1 실측 기반):

- 예상 생성 완료: 통상 30~90s, 느린 상단 밴드 ~110s.
- 제출 후 page-wide image candidate를 **약 1~2s 간격** poll.
- 이미지 등장 감지 후 **30s 내 저장 목표.** detect-to-save 30s 초과 시 보고서에 즉시 원인 진단 기록.
- 완성된 이미지를 3~5분 방치 금지.
- 무관 sidebar conversation scan 금지.
- 이전 대화 재사용 금지 — 단, 같은 승인 run의 known current image 회수 목적만 예외.
- **page-wide estuary/image collection 사용** — 현 ChatGPT UI는 생성 이미지를 assistant-role DOM 밖에 렌더할 수 있음 (user attachment 제외 필수).

## 5. Korean Money/Economy Visual Standard

**Hard fail:** 외화 느낌 · 낡은 아카이브/구시대 금융 질감 · 정체불명 화폐 · 읽히는 척하는 가짜 텍스트/숫자 · 깨진 글리프 · (돈이 선명해야 하는 컷에서) 모자이크/블러 처리된 돈 · 돈인 척하는 빈 종이.

**Accepted:** 원화풍 색 계열(5만원 웜 옐로우골드/1만원 그린티일/1천원 블루) + 기요셰풍 문양 질감 · 위폐 수준 복제 없이 "돈이라는 확신"을 주는 선명함 · 현대 한국 생활금융 맥락(월급봉투/유리병/자동이체 등) · 디테일 가림은 겹침/접힘/손가림/각도로 (블러/모자이크 금지).

**정확한 라벨/팩트/숫자는 renderer(Pillow 카드) 책임이지 이미지 내 텍스트가 아니다.**

## 6. Typography / Caption Standard

- **Pillow renderer** bold info-shorts 타이포 (동등성 검증 전 대체 금지).
- 폰트: **Noto Sans KR Black**(VF) 또는 승인된 bold Korean font. **Malgun Gothic 계열 룩 금지.**
- 두꺼운 검은 stroke + 강한 강조색(옐로우 등) 유지.
- caption은 짧은 phrase/keyword 중심 — 문장 낭독 자막 금지.
- **bottom-fixed subtitle bar 금지. karaoke 고정 하단 라인 금지.**
- 안전 프레임: 텍스트 y≤1580, 그래픽 y≤1632 (1080x1920 기준, v3 계열 실측) + 읽기 가능한 줄 길이 상한 준수.

## 7. TTS-First Standard

- **Script Impact Gate(§2) 통과 전 live TTS 금지** — runner가 코드로 강제.
- **one-shot full narration만.** scene별 TTS 금지.
- padding으로 길이 맞추기 금지 · 30/40/60s 고정 목표 금지 · speech hard trim 금지.
- 최종 길이는 대본의 자연 발화가 결정 (v3.2 = 53.97s).
- **word/phrase timestamp re-anchor 필수** — caption/card는 실제 발화 순간에 진입 (v3.2 허용치: word 앵커 ±120ms, 실측 delta ≤50ms).
- 오디오 품질 게이트 (v3.2 기준치): 시작 무음 ≤0.6s · first5s 무음 ≤0.8s · silence ratio ≤0.18 · speech active ≥0.72 · clipped tail 금지 · tail hold 0.3~0.8s.
- live 호출 상한은 slice별 승인 (v3.2 = 2회, guard: `--allow-live-tts`/`ALLOW_ELEVENLABS` convention, env 수정·secret 출력 금지).
- 구두점 설계: punch 마침표는 임팩트 지점에만 — 과도한 쉼표/마침표는 pause 폭증으로 ratio fail (v3.1 attempt1 선례).

## 8. QA / Readiness Flags

Upload 전 전부 PASS 필요: media audit · story gate · visual evidence · typography/caption · TTS/audio artifact · **Owner 시청/청취 PASS**.

- uploadReady는 Owner의 명시적 업로드 승인 전까지 **false**.
- automationExpansionReady는 별도 자동화 구현 승인 전까지 **false**.
- **Technical pass ≠ Golden Sample pass.** 기술 게이트 전부 통과해도 Owner 체감 QA에서 reject될 수 있다 (v3.1 선례 — 기술 PASS였으나 임팩트 부족으로 개정).

## 변경 통제

- 이 표준의 수정은 Owner 승인 slice로만 가능하다.
- 기준치 출처는 v3.2 실측 lock(`golden_sample_v3_2_acceptance_lock.t1_lifestyle_inflation.json`)이며, 새 샘플이 더 나은 기준을 세우면 새 버전 문서(v2)로 승격한다 — 이 문서를 소급 수정하지 않는다.
