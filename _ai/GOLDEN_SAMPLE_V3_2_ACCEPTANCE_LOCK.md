# GOLDEN SAMPLE V3.2 ACCEPTANCE LOCK

- Status: **`ACCEPTED_AS_GOLDEN_SAMPLE_FINAL_CANDIDATE`**
- uploadReady: **false**
- automationExpansionReady: **false**
- Locked at: 2026-07-03
- Task: `golden-sample-chatgpt-playwright-v3-2-acceptance-lock-final-qa-packet`
- Machine-readable lock: `scripts/fixtures/golden_sample_v3_2_acceptance_lock.t1_lifestyle_inflation.json`

## 확정 대상

| 항목 | 값 |
|------|-----|
| Topic | 월급이 올라도 통장이 그대로인 이유 (`t1_lifestyle_inflation`) |
| Final candidate mux | `C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4` |
| mux md5 | `9f5ad22c02cb4f4f813a1ed16fd658b0` (20,294,549 bytes) |
| 사양 | 1080x1920 · h264 · 30fps · AAC audio 1 stream · 53.97s (영상 53.966667s / 오디오 53.359002s) |
| Source method | ChatGPT+Playwright image generation + Pillow bold typography + TTS-first one-shot narration (ElevenLabs) |
| Repo checkpoint | `a34d703 test(automation): add chatgpt playwright v3 tts candidates` |

## Owner 판정

- "v3.2는 처음 버전보다 훨씬 이해하기 쉽고 좋다" — v3.2를 Golden Sample **최종 후보로 잠정 채택**.
- upload / 자동화 확장은 **여전히 금지** (별도 Owner 승인 필요).

## 채택 사유 (이 샘플이 기준이 된 이유)

1. **Story-Causality First** — 문제→원인→착시→재해석→행동→결과 인과 사슬이 9 phrase = 9 scene으로 1:1 유지. Script Impact Gate 6/6 통과 (hook 91 / causality 92 / bridge 91 / specificity 92 / save 89 / naturalness 90).
2. **Korean everyday money context** — 월급/고정비/자동이체/카드값/구독료 등 한국 생활 맥락. 통계 invent 0.
3. **Korean-won-like visual clarity** — v3.1 banknote patch 이미지 세트(9장, md5 고정)의 원화풍 지폐 질감/권종 색/기요셰 문양 선명도 보존.
4. **Bold info-shorts typography** — Pillow(Noto Sans KR Black VF) 렌더 카드/자막, bottom-fixed subtitle bar 없음.
5. **Word/phrase anchored captions** — overlay 29개 전부 실측 word timing 앵커(delta ≤50ms), '세 개' 발화 시각(44.93s)에 3-slot 카드 완성 검증.
6. **Natural duration** — 고정 30s/40s 목표 없이 실제 발화 리듬이 53.97s를 결정. padding/atempo/hard-trim 0.

## 이 lock이 의미하지 않는 것 (known limits)

- **배포 승인이 아니다.** Owner 최종 업로드 승인 전 upload 금지.
- **자동화 확장 승인이 아니다.** 이 샘플 1건의 품질 기준 후보 lock일 뿐, 양산 파이프라인 가동 근거가 아니다.
- 렌더/TTS 재생성 시 md5가 달라지므로, 위 md5의 파일만이 lock 대상이다.

## Upload 전 필요한 것

1. Owner의 명시적 최종 업로드 승인 (별도 slice).
2. 업로드 대상 플랫폼/계정/캡션/해시태그 결정.
3. 자동화 확장은 그 이후 별도 판단.

## Reusable production standards (향후 영상 순서)

주제 Owner 확정 → story causality 설계 → visual evidence 설계 → image generation → Pillow typography render → TTS-first timing (one-shot + word anchor) → Owner QA.

상세 근거는 `_ai/GOLDEN_SAMPLE_V3_2_FINAL_QA_PACKET.md` 참조.
