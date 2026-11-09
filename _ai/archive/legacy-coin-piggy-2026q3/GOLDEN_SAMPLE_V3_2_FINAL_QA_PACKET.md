# GOLDEN SAMPLE V3.2 FINAL QA PACKET

- 대상: `golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4` (md5 `9f5ad22c02cb4f4f813a1ed16fd658b0`)
- Status: `ACCEPTED_AS_GOLDEN_SAMPLE_FINAL_CANDIDATE` · uploadReady=false · automationExpansionReady=false
- 작성: 2026-07-03. 모든 수치는 기존 산출물 read-only 재검증 값 — 이 slice에서 렌더/TTS/API 재실행 없음.

## 1. Story causality

- 9 beat 인과 사슬: hook(월급↑ 통장 그대로) → problem(나만 이런가) → cause_a(인상은 한 번, 오른 고정비는 매달 반복) → cause_b(소액 분산이라 티 안 남) → illusion(오른 월급만 기억, 조용한 기준 상승은 안 보임) → reframe(헤퍼진 게 아니라 자리 상실) → action_a(월급날 자리부터) → action_b(고정비 증가분/생활비 상한/남길 돈) → result(체감은 자리에서 + CTA).
- Script Impact Gate **PASS** (TTS 호출 전 판정, `script_impact_gate_report.v3_2.json`): hook_self_relevance 91 / story_causality 92 / problem_solution_bridge 91 / solution_specificity 92 / save_worthiness 89 / spoken_naturalness 90 — hard fail 7항목 전부 false.
- 구조 게이트: '세 개' 발화 44.93s 시점에 3-slot(진입 39.66/41.18/42.74s) 전부 화면 표시 — 프로그램 + vision 프레임 이중 확인.

## 2. Visual evidence

- 이미지: v3.1 banknote patch 세트 9장, blueprint md5 9/9 일치 (`golden_sample_t1_lifestyle_inflation_story_blueprint.v3_1_banknote_patch.json`).
- scene = beat = phrase 1:1. 씬 경계 = 실제 phrase 발화 온셋 (hard cut 동기).
- 배경 파이프라인: lanczos 업스케일 + zoompan drift + eq — visual-only v3.1과 동일 (지폐 선명도 재렌더 훼손 없음, vision 프레임 확인).

## 3. Korean money context

- 원화풍 지폐(권종 색/기요셰 문양), 월급 봉투/유리병/영수증 벽 등 한국 생활 오브젝트.
- 나레이션 427자: 월급/고정비/자동이체/카드값/구독료/생활비 — 실제 통계·수치 invent 0.

## 4. Typography / caption

- Pillow(Noto Sans KR Black VF, stroke) 렌더 bold info-shorts 카드 — accepted v3.1 overlay elements 내용 무변경 재사용.
- bottom-fixed subtitle bar / karaoke line 없음.
- overlay 29개(word-anchor 27 + scene-entry chip 2): 진입 delta 전부 0~50ms (허용 ±120ms), minDwell 0.99s (flash 없음). 전수 기록: `dynamic_caption_timeline_tts_anchored.v3_2.json`.

## 5. TTS / audio timing

- ElevenLabs one-shot with-timestamps (confident_v3 preset), live 호출 **1회** (Script Impact Gate PASS 후에만 진입, 상한 2회).
- 오디오가 타임라인 주인 — scene별 TTS/padding/atempo/hard-trim/고정 길이 목표 0.
- 실측: 발화 53.36s / 영상 53.97s (tail hold 0.61s) / 시작 무음 0s / first5s 무음 0.35s / silence ratio 0.0682 (≤0.18) / speech active 0.932 (≥0.72) / clipped tail 없음.

## 6. Artifact audit

- ffprobe: 1080x1920 · h264 · 30/1 · AAC audio 1 stream · 53.966667s — 이 slice에서 재확인 완료.
- `post_render_artifact_audit_tts_mux.v3_2.json`: media/audio/captionCard/story 4게이트 + Claude vision QA(프레임 6장 판독, 총 19장 보존) 전부 PASS → `PASS_CANDIDATE_FOR_OWNER_REVIEW` → Owner 청취/시청 후 본 lock으로 승격.
- 증거 폴더: `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\` (narration mp3 md5 `127555a5b8e3f1192554377f6556e988`, alignment raw, timing summary, gate report, caption timeline, audit, story script preview, frames 19장).
- Repo 재현 소스: `a34d703` — `..._tts_first_mux_manifest.v3_2.json`(대본+게이트+앵커 계획) / `run-golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit.mjs`(gate 미통과 시 TTS 전 abort) / `..._visual_render_manifest.v3_2_tts_anchored.json`(실측 타임라인).

## 7. Known limits (accepted ≠ 배포)

- 이 packet은 **품질 기준 후보 lock**이다 — 배포 승인·자동화 확장 승인이 아니다.
- Owner 최종 업로드 승인 전 upload 금지. 자동화 확장 금지.
- 기술 게이트 수치는 technical evidence일 뿐, 향후 영상의 체감 품질 PASS를 자동 보장하지 않는다 (v3.1이 기술 PASS에도 임팩트 부족으로 개정된 선례).
- `C:\tmp` 산출물은 저장소 밖 로컬 파일 — md5로 고정했으나 유실 시 repo 소스(`a34d703`)에서 재생성하면 TTS 비결정성으로 md5가 달라진다 (재생성본은 재QA 필요).

## 8. Reusable production standards

향후 영상 표준 순서 (v3.2가 검증한 파이프라인):

1. 주제 Owner 확정
2. Story causality 설계 (beat = phrase = scene 1:1, 인과 명시)
3. Visual evidence 설계 (스토리 역할별 이미지, 한국 맥락)
4. Image generation (승인된 경로만) + md5 lock
5. Pillow typography render (bold info-shorts, bottom bar 금지)
6. TTS-first timing — Script Impact Gate → one-shot TTS → word/phrase 앵커 reflow → mux → artifact audit
7. Owner 청취/시청 QA → acceptance lock

각 단계의 게이트 기준치는 v3.2 config fixture(`golden_sample_t1_lifestyle_inflation_tts_first_mux_manifest.v3_2.json`)를 기준값으로 재사용한다.
