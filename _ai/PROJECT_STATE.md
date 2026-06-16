# PROJECT_STATE — upload_002_copier

**갱신:** 2026-06-16

**전체프로젝트 진행률:** ?% — 신뢰 가능한 전체 프로젝트 퍼센트 기준 확인 필요.

---

## 현재 단계

**upload_002_copier 에피소드 폐기 — 신규 기획 대기**

- final_v3: technical_pass + event_contract_pass, Owner QA FAIL → 에피소드 폐기
- 사유: 영상 사건-대사 구조 충돌, 기존 영상 수습 불가
- 다음: 신규 에피소드 기획안 3개 Owner 승인 대기

- S1~S5 veo_pass 영상 trim + 1080×1920 업스케일 + concat
- 기술 QA PASS (1080×1920, 24fps, H.264, 36.500s, 오디오 없음)
- 씬 경계 흐름 QA PASS (4개 경계 전부 자연스러움)
- 무음 흐름 PASS — 사건 이해 가능, 내부 컷/자막/신규 인물 없음
- final_v1 기술 QA는 PASS였으나 Owner 체감 QA에서 음성 연기·싱크·무대사 구간 몰입 실패로 업로드 불가
- 다음: 추가 유료 호출 전 audio performance/sound redesign 설계

---

## 씬별 상태

| 씬 | Veo | 비고 |
|---|---|---|
| S1 | `veo_pass` | G1:9223 |
| S2 | `veo_pass` | G1:9223 |
| S3 | `veo_pass` | G1:9223 |
| S4 | `veo_pass` | G2:9224 |
| S5 | **`veo_pass`** | 최종 1회 제출, G2:9224, `s5_veo_final.mp4` 1567KB, MD5=739c1fa0 |

## 편집본 상태

| 항목 | 상태 |
|---|---|
| silent_v1 | `content_fail` (기술PASS·콘텐츠FAIL, 보존) |
| silent_v2 | `silent_v2_pass` — 36.500s, 1080×1920, 17.2MB, MD5=`67b0feb6` |
| TTS raw | `tts_raw_pass` — Jun 18.390s + Boss 1.950s, offset v2 PASS |
| **final_v1** | **`owner_fail`** — 기술 QA PASS이나 감정연기/싱크/무대사 몰입 실패, 업로드 불가 |
| **final_v2** | **`owner_fail`** — 기술 QA PASS, 감정연기/SFX 체감 불충분, 업로드 불가 |
| **final_v3** | **`owner_fail` / 에피소드 폐기** — 기술·싱크 PASS, 영상-대사 구조 충돌로 에피소드 자체 폐기 |

---

## Veo 예산

- **총 7회 / 사용 7회 / 잔여 0회**
  - S1~S5 각 1회 + S5 특례 1회 + S5 최종 1회 = 7회 전량 소진

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

## Checkpoint

- Commit: 2739f96
- Message: feat(upload_002): Gemini Veo + ChatGPT 이미지 자동화 안정화
- git status: clean

## TTS Timing Plan v1 (2026-06-16, tts_timing_pass)

| Offset | End | Who | 씬 | 대사 |
|---|---|---|---|---|
| 0.20s | 2.20s | Jun | S1 | 한 장만. 진짜 딱 한 장만. |
| 2.40s | 4.90s | Jun | S1 | 화 안 낼게. 우리 오늘 좋게 끝내자. |
| 6.20s | 7.40s | Jun | S2 | 그래. 그렇지. |
| 8.00s | 9.80s | Jun | S2 | 근데 왜 계속 나오지? |
| 10.20s | 11.20s | Jun | S2 | 한 장이라고. |
| 14.80s | 16.80s | Jun | S3 | 우리 좋게 끝내기로 했잖아. |
| 30.00s | 32.20s | Boss | S5 | 준 씨, 열정이 넘치네요. |
| 33.00s | 35.00s | Jun | S5 | 제 열정 말고, 용지가요. |

- Tail: 1.50s ✅ / S5 Boss+Jun punchline: PASS ✅ / Overlap: 없음 ✅
- S3/S4 무음 13.2s: 시각 코미디 의도적 활용. BGM 추가는 Owner 판단 사항.

## Owner QA 반영 (2026-06-16)

- 화면 행동과 대본 싱크 체감이 약함
- Jun/Boss 모두 감정 표현과 억양이 부족하고 평온한 낭독처럼 들림
- Boss/Theo는 너무 좋은 목소리라 상사/부장님 캐릭터성이 약함
- S3/S4 무대사 구간이 지루함
- 펀치라인은 대본 자체보다 연기·억양·사운드 부재로 전달 실패

## 현재 방향 전환 (2026-06-16)

upload_002 final_v1/final_v2 모두 Owner QA FAIL. 수습 방식 반복은 비효율적.

**새 접근법: 마지막 테스트 전 Quality Gate 선계약**
- `_ai/QUALITY_GATE.md` 기준으로 Event / Dialogue / Emotion / Sound / Stop-Loss Contract 먼저 작성
- 생성 전 계약 잠금 → 내부 품질 필터가 먼저 걸러내는 구조

## scripts 정리 (2026-06-16)

| 파일 | 처리 |
|---|---|
| `scripts/_upload002-tts-generate.mjs` | → `scripts/archive/` 이동 완료 |
| `scripts/_upload002-voice-list.mjs` | → `scripts/archive/` 이동 완료 |
| `scripts/_upload002-tts-generate-v2.mjs` | → `scripts/archive/` 이동 완료 |
| `scripts/_upload002-tts-assemble-v3.mjs` | → `scripts/archive/` 이동 완료 |

## 마지막 테스트 Contract (2026-06-16, event_contract_pass 대기)

콘셉트: "도구가요" — 준이 화이트보드 지우개/마커 없음 → 빈손 → Boss 입장 → 펀치라인  
씬 구성: 3씬 30~33s / 대사 5문장 / 무대사 4s (시계 틱 BGM 필수)  
예상 호출: ElevenLabs 2회 / Veo 0회 / 비용 ~$0

Owner 확인 게이트:
1. Contract 승인 ← 현재
2. TTS 생성 전 음성 방향 확인 (필요 시)
3. final candidate Owner 체감 QA

## 다음 단계

**upload_002_copier 폐기 확정 (2026-06-16)**
- 기존 2편 수습 작업 중단
- 신규 30~40초 에피소드 기획안 3개 → Owner 승인 후 진행
- 소재/대본/씬 구조 Owner 승인 전 생성 금지
