# CLAUDE_REPORT — 마지막 테스트 Quality Gate Contract

**작성:** 2026-06-16  
**작업:** 마지막 테스트 생성 전 5개 Contract 작성 (외부 호출 0회)  
**외부 호출:** 0회  
**commit/push:** 없음

---

## 콘셉트

**"도구가요" — 준이 회의실 화이트보드를 지우려는데 지우개도 마커도 없고, 빈손으로 서 있는 순간 부장님이 들어오는 이야기**

**씬 구성 (총 30~33s, 기존 silent_v2 재사용 여부 검토 필요):**
- S1 (0~10s): 준, 지우개 없음 → 마커통도 빔
- S2 (10~14s): 서랍/가방 탐색 — 없음
- S3 (14~33s): 빈손으로 보드 앞, Boss 입장, 펀치라인

---

## 1. Event Contract

| time range | visible action | character state | object/state change | allowed dialogue | forbidden dialogue | required SFX |
|---|---|---|---|---|---|---|
| 0.0~2.0s | 준이 지우개 자리 손 뻗음 | 평온→당황 | 지우개 부재 인식 | 없음 | 어떤 대사도 금지 | 옷 스침/발소리 |
| 2.0~5.0s | 지우개 자리 더듬음, 눈 커짐 | 당황 | 지우개 없음 확인 | "어? 지우개가…" | "없네" (확인 전) | 손 더듬 소리 |
| 5.0~10.0s | 마커통 열었더니 빔 | 당황 심화 | 마커 부재 추가 확인 | "마커도 없어?" | 체념 대사 (에스컬레이션 중) | 통 흔들 소리 |
| 10.0~14.0s | 서랍 열고 닫음, 가방 탐색 | 짜증 시작 | 탐색 — 없음 | "잠깐만, 잠깐만." | "다 없네" (확인 중) | 서랍 여닫는 SFX |
| 14.0~18.0s | 멈추고 빈손으로 보드 앞 서 있음 | 탈력 | 준 정지 | 없음 — SFX 필수 | 어떤 대사도 금지 | 정적 0.5s + 시계 틱 BGM |
| 18.0~21.0s | 문 열리는 소리, Boss 발소리 | 긴장 | Boss 예고 | 없음 | "왔다" (아직 안 보임) | 문 SFX + 발소리 |
| 21.0~25.0s | Boss 입장, 보드-준 빈손 시선 이동 | Boss 여유/압박. 준 굳음 | Boss 시선 확인 | Boss: "준 씨, 준비됐어요?" | Boss 대사가 시선 확인 전 나옴 | 배경 오피스 음 |
| 25.0~30.0s | 준 시선 이동 (빈손→Boss→보드) | 체념/탈력 반박 | 시선 이동 완료 | 준: "네. 근데 도구가요." | 준 대사가 시선 이동 전 나옴 | 직전 0.3s 무음 + 코믹 스팅 |
| 30.0~33.0s | Boss 미소, 준 무표정 | 마무리 | 정적 | (선택) Boss: "도구 없이도 준 씨답네요." | 추가 설명 대사 | Fade out BGM |

---

## 2. Dialogue Contract

| ID | 대사 | 화면 근거 | 감정 | 금지 대체 |
|---|---|---|---|---|
| J1 | "어? 지우개가…" | 지우개 더듬은 후 | 당황, 미완성 문장 | "지우개가 없네" (단정 금지) |
| J2 | "마커도 없어?" | 마커통 열고 빈 것 확인 후 | 당황 심화, 의문 상승 | "마커도 없다" (체념 금지) |
| J3 | "잠깐만, 잠깐만." | 서랍 탐색 시작 후 | 짜증 억제, 자기 진정 | "왜 아무것도 없어" (폭발 금지) |
| Boss | "준 씨, 준비됐어요?" | Boss 시선이 보드-빈손 확인 후 | 여유, 은근한 압박 | "준비 안 됐어요?" (직접 지적 금지) |
| J4 | "네. 근데 도구가요." | 준 시선 이동 완료 후 | 체념, 탈력 반박 | "아무것도 없어서요" (설명 금지) |

---

## 3. Emotion / Voice Contract

**Jun (Hyun 70DeQK5Ztp7WmEGGysLT):**

| 대사 | 감정 | 파라미터 | 금지 |
|---|---|---|---|
| J1 | 당황, 미완성 | style 0.30 / stability 0.25 | 완결 억양 |
| J2 | 당황 심화, 의문 상승 | 문장 끝 상승 억양 | 평서문 억양 |
| J3 | 짜증 억제, 빠름 | speed 0.78 | 느린 낭독 |
| J4 | 체념, 탈력 반박 | stability 0.25 / speed 0.82 | 밝은 톤 |

권장 설정:
- stability: 0.25 / similarity: 0.75 / style: 0.30 / speed: 0.82 / speaker_boost: true
- J3만 speed: 0.78 별도 고려

**Boss (Theo CxErO97xpQgQXYmapDKX):**

| 대사 | 감정 | 파라미터 | 금지 |
|---|---|---|---|
| Boss | 여유 압박, 웃는 듯 | stability 0.80 / speed 0.78 | 매끈/친절한 톤 |

권장 설정:
- stability: 0.80 / similarity: 0.85 / style: 0.02 / speed: 0.78 / speaker_boost: true

---

## 4. Sound Contract

| 구간 | SFX/BGM | 볼륨 | 소스 |
|---|---|---|---|
| 0~2s | 옷 스침/발소리 | -18dB | ffmpeg lavfi |
| 2~5s | 손 더듬 (white noise 짧게) | -20dB | ffmpeg lavfi |
| 5~10s | 마커통 흔들 | -16dB | ffmpeg lavfi |
| 10~14s | 서랍 SFX ×2 | -14dB | ffmpeg lavfi |
| 14~18s ★ | 정적 0.5s + 시계 틱 BGM (필수) | -22dB | ffmpeg lavfi |
| 18~21s | 문 SFX + 발소리 | -12dB | ffmpeg lavfi |
| 21~25s | BGM duck | -18dB | — |
| 25~30s | 직전 0.3s 무음 + 코믹 스팅 | -10dB | ffmpeg lavfi |
| 30~33s | Fade out | -20dB | — |

무대사 14~18s: 시계 틱 BGM 필수. 정적만이면 FAIL.

---

## 5. Stop-Loss Contract

| 항목 | 값 |
|---|---|
| 예상 ElevenLabs 호출 | 2회 (Jun 1회 + Boss 1회) |
| 최대 허용 호출 | 2회 — 초과 즉시 ABORT |
| 예상 비용 | ~$0 (구독 쿼터 내) |
| Veo/GPT 이미지 | 0회 |

성공 기준 (모두 충족):
1. Jun J1~J4 감정 변화 청취 확인
2. Boss 중후하고 느린 부장님 톤 확인
3. 기술 QA: 1080×1920 / 24fps / h264 / 30~35s / Peak ≤ -1dBTP
4. 모든 대사가 해당 화면 사건 후 배치
5. 14~18s 구간 SFX 존재

FAIL 기준 (하나라도 해당 시 FAIL):
- Jun 단일톤 → FAIL (Owner 판단 후 재생성)
- Boss 고막남친 → FAIL (Owner 판단 후 재생성)
- 대사가 사건보다 먼저 → FAIL (offset 재설계)
- 14~18s 무음 → FAIL (SFX 추가 후 재mux)
- Peak > -1dBTP → FAIL

자동 재시도 금지. 실패 시 원인 보고 → Owner 판단.

Owner 확인 게이트:
1. 이 Contract 승인 (지금)
2. TTS 생성 전 음성 방향 확인 (필요 시)
3. final candidate Owner 체감 QA

---

## upload_002 대비 차이점

| 항목 | upload_002 | 마지막 테스트 |
|---|---|---|
| 생성 전 계약 | 없음 | 5개 Contract ✅ |
| 무대사 구간 | 12.66s 방치 | 4s → 시계 틱 BGM 필수 ✅ |
| 펀치라인 근거 | 대본만 | 시선 이동 사건 후 ✅ |
| Boss 등장 | 갑작스러운 손 | 발소리 예고 → 입장 ✅ |
| Jun 감정 단계 | 7문장 단일톤 | 4문장 3단계 ✅ |
| 내부 FAIL 기준 | 없음 | Stop-Loss 명시 ✅ |

---

## 변경 파일

- `_ai/CLAUDE_REPORT.md` — 현재 파일
- `_ai/PROJECT_STATE.md` — 갱신 예정

git status: `_ai/HANDOFF_NOW.md`, `_ai/NEXT_ACTION.md` M (Codex 업데이트), `_ai/CLAUDE_REPORT.md` M
