# PROJECT_STATE — upload_002_copier

**갱신:** 2026-06-16

---

## 현재 단계

**자동화 2종 안정화 완료 — checkpoint commit 승인 대기**

- Gemini Veo 공용 core + G2 preflight PASS + PREFLIGHT_STALE 게이트 완료
- ChatGPT 이미지 공용 core + GPT-1 preflight PASS (11s) + s5-kf dry-run PASS (10s)
- 외부 제출 0회, 사용자 브라우저 개입 0회
- Archive 이동 완료, checkpoint commit Owner 승인 대기

---

## 씬별 상태

| 씬 | Veo | 비고 |
|---|---|---|
| S1 | `veo_pass` | G1:9223 |
| S2 | `veo_pass` | G1:9223 |
| S3 | `veo_pass` | G1:9223 |
| S4 | `veo_pass` | G2:9224 |
| S5 | **`veo_regen_lost`** | 특례 1회 소진, 결과 회수 불가, 원본 보존 |

## 편집본 상태

| 항목 | 상태 |
|---|---|
| silent_v1 | `content_fail` (기술PASS·콘텐츠FAIL, 보존) |
| silent_v2 | 미생성 — S5 재생성 PASS 후 진행 |
| TTS | 미진행 |

---

## Veo 예산

- **총 7회 / 사용 6회 / 잔여 1회**
  - S1~S5 각 1회 + S5 특례 1회 = 6회 사용

---

## 자동화 통합 결과 (2026-06-16, `automation_both_pass`)

### Gemini Veo

| 항목 | 결과 |
|---|---|
| `_gemini-veo-core.mjs` | 14개 export ✅ |
| G2 preflight 실행 | PREFLIGHT_PASS 50s ✅ |
| PREFLIGHT_STALE 게이트 | 4/4 케이스 abort ✅ |
| prompt hash | `5dc9438be8727bf936ed9c3e93e43edd` ✅ |
| ref hash | `141b348a370374fbe0750fee67a32770` ✅ |
| 실행 명령 | `ALLOW_VEO=true node scripts/_upload002-s5-final.mjs --profile 2` |

### ChatGPT 이미지

| 항목 | 결과 |
|---|---|
| `_chatgpt-image-core.mjs` | 17개 export ✅ |
| GPT-1 preflight 실행 | PREFLIGHT_PASS 11s ✅ |
| s5-kf dry-run | ALL PASS 10s ✅ |
| ref hash (preflight) | `def65a3b8e499395546c2fcdf3a46362` (S3 v2) ✅ |
| ref hash (s5-kf) | `7efa35b8a681bd23d8dfe37ed32c92a5` (S4) ✅ |
| TOTAL_SEND | 0 ✅ |
| IMAGE_SUBMIT | 0 ✅ |

---

## 프로파일 상태

| 프로파일 | 포트 | 상태 |
|---|---|---|
| GPT-1 | 9222 | ChatGPT 이미지 자동화 ✅ |
| G1 | 9223 | Gemini S1~S3 사용 |
| G2 | 9224 | Gemini S4 사용 / **S5 최종 재도전 권장** |
| G3 | 9225 | S5×2 사용, VideoFX 리셋 — 제외 |
| G4 | — | **영구 금지** |

---

## 오검출 교훈

- 오른쪽 35% crop 단독으로 상사 손 판정 금지
- 반드시 준의 양손 위치를 전체 프레임에서 추적
- 상사 손은 극우 가장자리 바깥 신체와 연결 확인 필수
- 애매한 프레임 → 즉시 FAIL

---

## Codex Review Decision

- automation_both_pass 수용.
- Gemini Veo와 ChatGPT 이미지 자동화는 모두 preflight/dry-run 기준 사용 가능.
- 마지막 Veo 예산 1회 실행 전, 누적 diff가 많으므로 checkpoint 감사 우선 권장.

## Archive 이동 + Checkpoint 준비 (2026-06-16)

### Checkpoint 포함 후보 (핵심 자동화 — Owner 승인 대기)

**재사용 가능 자동화 (16개):**
- `scripts/_gemini-veo-core.mjs`, `_gemini-veo-preflight.mjs`, `_upload002-s5-final.mjs`
- `scripts/_chatgpt-image-core.mjs`, `_chatgpt-image-preflight.mjs`, `_upload002-s5-kf-generate.mjs`
- `scripts/_upload002-s1~s5-veo-generate.mjs` (5개), `_upload002-s4-kf-generate.mjs`
- `scripts/_upload002-s5-edit-from-s4.mjs`, `_upload002-s5-veo-regen.mjs`
- `scripts/_upload002-tts-assemble.mjs`, `_upload002-tts-timing-dryrun.mjs`
- `_ai/` 전체 (12개), tracked 4개 파일, `docs/exec-plans/v033_...md`

**Archive 이동 완료:**
- `scripts/_probe-gemini-profiles.mjs` (일회성 probe)
- `scripts/_probe-s2-new-chat-attach.mjs` (일회성 probe)
- `scripts/_probe-s2-veo-attach-direct.mjs` (일회성 probe)
- `scripts/_upload002-s3-bag-edit.mjs`, `_s3-continuity-fix.mjs`, `_s3-recovery-save.mjs`, `_s3-v2-regen.mjs` (S3 일회성 복구기)

**이미 archive/ 내 파일:** scripts/archive/_temp-* 7개 포함 후보

### 커밋 메시지 후보

```
feat(upload_002): Gemini Veo + ChatGPT 이미지 자동화 안정화
- _gemini-veo-core.mjs + preflight / _chatgpt-image-core.mjs + preflight
- G2 preflight PASS / GPT-1 preflight PASS / PREFLIGHT_STALE 4/4
- S1~S5 Veo 생성기, S4/S5 kf 생성기, TTS 스크립트
- docs LOG/PLAN 현행화, AGENTS/CLAUDE 핸드오프 추가, _ai/ 초기화
```

## 다음 단계

1. **Checkpoint commit** — Owner commit 승인 후 즉시 실행 가능 (staging 준비 완료)
2. **S5 최종 제출** — ALLOW_VEO=true, S5 최종 1회 승인 Owner 결정 후 G2에서 1회 실행
3. **silent_v2 편집** — S5 veo_pass 후 진행
