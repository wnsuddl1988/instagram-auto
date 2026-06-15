# CLAUDE_REPORT — audio recovery 실행 (C-lite: TTS 2회 + SFX)

**작성:** 2026-06-16  
**작업:** final_v1 Owner QA FAIL → final_v2 생성 (C-lite 실행)  
**외부 호출:** ElevenLabs TTS 2회 (Jun v2 1회 + Boss v2 1회)  
**commit/push:** 없음

---

## 1. 실행 결과 요약

| 항목 | 결과 |
|---|---|
| ElevenLabs 호출 | **2회 ✅** (상한 2회, 초과 없음) |
| Jun v2 생성 | `jun_hyun_tts_v2.mp3` — 315,185B, 19.644s, MD5=`79e51ffb127eae48eec28b1381e38fe7` |
| Boss v2 생성 | `boss_theo_tts_v2.mp3` — 37,660B, 2.276s, MD5=`3e31feef2a16b8c88cd81000dc6614c8` |
| SFX 생성 | 4종 ffmpeg lavfi 로컬 생성 (외부 다운로드 없음, 라이선스 없음) |
| final_v2 | `upload_002_copier_final_v2.mp4` — 18,307,289B (17.46 MB), MD5=`5793e45216210b0a82cc100aec46b210` |
| 기술 QA | **PASS ✅** |

---

## 2. TTS 파라미터 변경 (v1 → v2)

| | Jun v1 | Jun v2 | Boss v1 | Boss v2 |
|---|---|---|---|---|
| stability | 0.50 | **0.30** ↓ | 0.60 | **0.75** ↑ |
| similarity | 0.80 | **0.75** ↓ | 0.80 | **0.85** ↑ |
| style | 0.08 | **0.25** ↑ | 0.05 | **0.03** ↓ |
| speed | 0.90 | **0.85** ↓ | 0.92 | **0.82** ↓ |

변경 의도:
- Jun: 감정 변동폭 확대 (당황→안도→의심→짜증→체념)
- Boss: 중후하고 느린 부장님 톤 (고막남친 탈피)

---

## 3. offset v3 (실측 기반 조정)

v2 TTS는 speed가 낮아 v1보다 전체 길이가 길어짐 (Jun: 18.390s → 19.644s).
J2 offset이 겹쳐 실측값 기반으로 재조정.

| | offset | dur | end | gap |
|---|---|---|---|---|
| J1 | 0.20 | 2.871 | 3.071 | +0.20 ✅ |
| J2 | 3.27 | 3.400 | 6.670 | +0.20 ✅ |
| J3 | 6.87 | 1.433 | 8.303 | +0.20 ✅ |
| J4 | 8.50 | 1.262 | 9.762 | +0.20 ✅ |
| J5 | 9.96 | 0.778 | 10.738 | +0.20 ✅ |
| J6 | 15.50 | 1.617 | 17.117 | +4.76 ✅ |
| J7 | 32.55 | 0.986 | 33.536 | +15.43 ✅ |
| Boss | 30.00 | 2.276 | 32.276 | — ✅ |
| Tail | | | | 2.964s ✅ |

★ J6: 23.50s → 15.50s (S3 초반으로 이동 — 재시작 호소와 화면 행동 맞춤)

**주의: 스크립트 싱크 QA에서 J2가 ❌로 표시됨** — J2가 6.670s 종료로 S1 경계(6.0s)를 0.670s 초과하지만, 이는 의도된 배치 (J2 대사 "화 안 낼게. 우리 오늘 좋게 끝내자."가 S1/S2 경계에 걸쳐도 내용상 자연스러움). 실제 오버랩/오버플로우는 없음.

---

## 4. SFX 레이어

| SFX | 시간 | 방식 | 라이선스 |
|---|---|---|---|
| button_click | 0.0s | ffmpeg lavfi sine 1800Hz 0.08s | 없음 |
| error_beep | 2.2s | ffmpeg lavfi sine 600+800Hz 0.3s | 없음 |
| paper_rustle | 6.0~10.0s | ffmpeg lavfi white noise bandpass 4s | 없음 |
| copier_motor | 14.5~29.5s | ffmpeg lavfi sine 80+250Hz tremolo 15s | 없음 |

---

## 5. final_v2 기술 QA

| 항목 | 값 | 판정 |
|---|---|---|
| 해상도 | 1080×1920 | ✅ |
| FPS | 24 | ✅ |
| 코덱 | h264 | ✅ |
| 영상 길이 | 36.500s | ✅ |
| 오디오 길이 | 36.478s | ✅ |
| Loudness | -27.6 LUFS | (참고) |
| Peak | -9.6 dBFS | ✅ (clipping 없음) |
| 파일 크기 | 17.46 MB | ✅ |
| MD5 | `5793e45216210b0a82cc100aec46b210` | ✅ |

기술 QA: **PASS ✅**

---

## 6. 변경/생성 파일

| 파일 | 상태 |
|---|---|
| `scripts/_upload002-tts-generate-v2.mjs` | NEW (TTS 재생성 v2) |
| `scripts/_upload002-tts-assemble-v3.mjs` | NEW (assemble v3, offset v3r, SFX 포함) |
| `output/.../audio/jun_hyun_tts_v2.mp3` | NEW — 19.644s |
| `output/.../audio/boss_theo_tts_v2.mp3` | NEW — 2.276s |
| `output/.../audio/sfx_*.wav` | NEW — 4종 로컬 SFX |
| `output/.../audio/mixed_audio_v3.aac` | NEW |
| `output/.../final/upload_002_copier_final_v2.mp4` | NEW — 17.46 MB |
| `_ai/CLAUDE_REPORT.md` | 갱신 (현재 파일) |
| `_ai/PROJECT_STATE.md` | 갱신 예정 |

기존 v1 파일 보존:
- `jun_hyun_tts_raw.mp3` (v1 그대로)
- `boss_theo_tts_raw.mp3` (v1 그대로)
- `upload_002_copier_final_v1.mp4` (owner_fail 상태로 보존)

---

## 7. 남은 리스크

| 리스크 | 내용 | 심각도 |
|---|---|---|
| Boss 체감 QA | Theo v2가 "중후 부장님" 톤으로 개선됐는지 — 실제 청취 필요 | ★★★ |
| Jun 감정 체감 | stability 0.30/style 0.25가 실제로 당황/짜증/체념을 전달하는지 | ★★★ |
| SFX 체감 | ffmpeg 로컬 생성 SFX가 실제 복사기 환경을 충분히 연출하는지 | ★★ |
| J2 씬 경계 | J2(3.27~6.67s)가 S1/S2 경계에 걸림 — 청각적으로 자연스러운지 | ★ |

---

## 8. 다음 권장 액션

1. **Owner 체감 QA** — `upload_002_copier_final_v2.mp4` 감상
2. 판정 기준: Jun 감정 변화가 들리는지 / Boss가 부장님 톤인지 / S3/S4가 덜 지루한지 / 펀치라인이 대본 없이 통하는지
3. PASS → checkpoint commit 준비 / FAIL → C안 추가 검토 (Boss 대체 목소리 등)
