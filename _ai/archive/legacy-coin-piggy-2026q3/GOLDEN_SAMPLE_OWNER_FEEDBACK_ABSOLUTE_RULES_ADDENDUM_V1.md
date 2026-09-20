# GOLDEN SAMPLE OWNER FEEDBACK — ABSOLUTE RULES ADDENDUM V1

- 작성일: 2026-07-02
- Task: `creative-v2-golden-sample-story-causality-visual-evidence-reset-v1`
- 지위: `_ai/CREATIVE_V2_GOLDEN_SAMPLE_ABSOLUTE_RULES.md`(원문, verbatim 보호)와 **같은 우선순위의 addendum**이다. 원문은 수정하지 않으며, 이 addendum은 원문 위에 Owner 최신 피드백(2026-07-02)을 누적 적용한다. 충돌 시 이 addendum의 최신 Owner 결정이 우선한다.
- 원문 절대규칙 파일 무결성 기준값: git blob hash `31c2243afa879d1cc796d5d8ea143f1b72d9244f` (이 addendum 작성 시점).

---

## 1. Reject Lock — 현재 TTS mux 후보

- 대상: `C:\tmp\money-shorts-os\golden-sample-tts-first-mux-audit-v1\golden_sample_t2_salary_3days_tts_mux.mp4` (commit `24ea7d3 feat(automation): add golden sample tts mux audit`)
- Owner 판정: **100점 만점에 약 80점. 화면/모션/대본/음성/자막은 나쁘지 않지만, Golden Sample 기준으로 픽스할 수 없다.**
- 처리: **`REJECT_AS_GOLDEN_SAMPLE / evidence_only`** — 삭제/수정/재생성 금지. 기술 파이프라인(TTS-first reflow, word-anchored caption, post-render audit) evidence로만 보존한다.
- 자동 게이트 전부 PASS였다는 사실이 주는 교훈: **기술 게이트 통과 ≠ Golden Sample 통과.** 스토리 인과 QA가 없으면 80점짜리가 계속 통과한다.

### reject 핵심 원인 (Owner 피드백 verbatim 보존)

- 이미지가 `월급이 3일 만에 사라지는 이유`와 직관적으로 연결되지 않는다. 카드/표/자막이 보완해서 겨우 설득되는 구조다.
- 사진만 봤을 때 월급/고정비/현금흐름/3일 소진의 상황이 바로 떠오르지 않는다.
- `문제는 금액이 아니라 순서입니다`가 앞뒤 설명 없이 갑자기 나와서 맥락이 끊긴다.
- 해결책/대안/효율적인 월급 사용 흐름이 부족하다. 훅은 좋지만 중간 진단에서 행동 제안으로 넘어가는 다리가 없다.
- 짧은 caption flash는 좋지만 일부는 너무 짧다.
- 길이는 반드시 30초일 필요가 없다. 주제와 스토리에 따라 길거나 짧아질 수 있다. (**30초 고정 금지** — v2는 32~45초 허용)

---

## 2. 원칙 전환 — Story-Causality First + Visual Evidence Second

기존 `story-first + visual-source-first`를 다음으로 교체한다:

> **Story-Causality First + Visual Evidence Second**

1. 먼저 스토리 인과를 고정한다.
2. 그다음 각 장면이 증명해야 하는 시각 증거를 정의한다.
3. 그 증거에 맞는 ChatGPT/LLM 이미지 프롬프트를 만든다.
4. 마지막으로 renderer가 카드/자막/모션을 얹는다.
5. **이미지는 먼저가 아니다. 이미지는 스토리의 증거로 따라와야 한다.**

새 Golden Sample v2의 스토리 인과는 다음 5단계가 끊기지 않아야 한다:

> **`문제 → 원인 → 착시 → 해결책 → 행동`**

각 단계 사이에는 "왜 다음 단계로 넘어가는가"를 말하는 bridge 문장이 반드시 존재해야 한다. bridge가 없으면 reject.

### 주제/해결책 방향 (Owner 최신 결정)

- 주제 유지 가능: `월급이 3일 만에 사라지는 이유`
- 핵심 수정: 해결책은 "순서"가 아니라 **"돈의 자리/흐름을 먼저 나누는 구조"**로 구체화한다.
- 레퍼런스 기반 **정보 브리핑형/팩트 전달형 쇼츠** 방향을 허용한다. "오늘 봐야 하는 이유"를 초반에 강하게 제시하고, 시청자가 "내 얘기인데?"라고 느끼는 hook을 쓴다. 레퍼런스는 exact clone하지 않는다.

---

## 3. 새 Story QA fields / Threshold / Hard Fail

Golden Sample은 이제 영상이 예쁜지만 보지 않는다. **스토리 인과를 평가한다.**

```json
{
  "story_causality_score": 0,
  "problem_solution_bridge_score": 0,
  "solution_specificity_score": 0,
  "visual_subject_relevance_score": 0,
  "caption_readability_score": 0,
  "hook_self_relevance_score": 0
}
```

Threshold:

- `story_causality_score >= 85`
- `problem_solution_bridge_score >= 85`
- `solution_specificity_score >= 85`
- `visual_subject_relevance_score >= 80`
- `caption_readability_score >= 85`
- `hook_self_relevance_score >= 85`

Hard fail (하나라도 걸리면 reject):

1. 문제 제기와 해결책 사이에 다리가 없으면 reject
2. 해결책이 추상어로 끝나면 reject
3. 이미지가 주제와 직관적으로 연결되지 않으면 reject
4. "순서", "관리", "정리" 같은 추상어를 설명 없이 쓰면 reject
5. 3개를 정하라고 말하면서 그 3개가 무엇인지 안 보여주면 reject

---

## 4. 이미지 정책 수정 — money-like objects 적극 허용

기존 원문의 `no readable text inside image` 원칙은 **유지**한다. 단, 이것은 `no money-like objects`가 아니다.

**돈처럼 보이는 오브젝트는 적극 허용한다 (money-like objects allowed):**

- 현금 다발
- 돈 봉투 / 월급 봉투
- 지갑
- 카드값/고정비를 상징하는 봉투 더미
- 3칸으로 나뉜 현금/봉투/카드
- 돈이 빠져나가는 흐름을 보여주는 오브젝트

**금지 (no readable AI-generated text 계열):**

- AI가 임의 생성한 브랜드명/워터마크
- 깨진 글자
- 가짜 UI 텍스트
- 가짜 기사 본문
- 읽히는 척하는 차트/신문/계산기/달력 텍스트

**운영 규칙:**

- 중요한 숫자/문구는 이미지 내부가 아니라 renderer 카드/타이포로 정확히 얹는다.
- 이미지 단독으로도 "월급, 빠져나가는 돈, 고정비, 자동이체, 빈 지갑, 분리/배분"의 느낌이 보여야 한다.
- 각 scene 이미지에는 `왜 이 이미지가 caption 없이도 주제를 전달하는가` 근거를 blueprint에 기록한다.

---

## 5. 폰트/자막 방향 수정

- 두꺼운 검정 외곽선 + 강한 강조색(빨강/파랑/초록/노랑) + 쇼츠형 정보 자막.
- 상단 헤더/날짜/채널 느낌의 정보 브리핑 구조는 참고 가능.
- 캐릭터/차트/기사 박스/비교 카드처럼 정보 장면이 자주 바뀌는 리듬 참고.
- 단 자막 방식은 현재 **dynamic caption 계약을 유지**한다(하단 고정 자막 금지, phrase/keyword 단위, TTS word-anchor). 폰트/강조만 더 강하게 가져간다.
- caption flash는 너무 짧지 않게: **caption dwell minimum 0.7s** (기존 0.45s 하한에서 상향 — 80점 후보의 c05 0.49s flash가 reject 사유 중 하나).

---

## 6. 유지되는 원문 절대규칙 (충돌 없음 확인)

- ChatGPT/LLM image generation path 유지, placeholder/stock-like fallback 금지.
- TTS-first: full narration one-shot 우선, padding/apad/atempo/hard-trim 금지.
- perceptual event 기준(planned ≠ perceptual), card-image hybrid, 첫 2s hook card.
- ffprobe 통과 ≠ quality pass. uploadReady=false 유지 (post-render audit + **story causality QA** 통과 전 true 금지).
- `금리 동결`은 test/sample topic이었고, 품질 문법은 주제 mix를 지원해야 한다 — 이번 v2는 `월급이 3일 만에 사라지는 이유`로 진행한다.

## 7. 연결 파일

- 프로세스 계약: `scripts/fixtures/golden_sample_story_visual_rebuild_contract.v1.json`
- v2 blueprint: `scripts/fixtures/golden_sample_blueprint.salary_3days.v2.json`
- 80점 reject evidence: `scripts/fixtures/golden_sample_tts_first_mux_manifest.t2.v1.json`, `scripts/fixtures/golden_sample_visual_render_manifest.t2.v1_2_tts_anchored.json`
