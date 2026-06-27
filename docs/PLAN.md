# AutoShorts AI — Current Plan

> Status: **LEGACY / REFERENCE ONLY** (2026-06-27). Active MVP direction is now Money Shorts OS: source-first life-economy shorts via Fact Card → Signal Translation Brief → 6 Scene Cards. Do not treat this plan as the current implementation path unless Owner explicitly re-approves it.

_Last updated: 2026-06-15_

## 프로젝트 현황

- 채널: 인스타그램 릴스 + 유튜브 쇼츠 동시 운영 예정
- 포맷: 반복 캐릭터 3D 시트콤 (준 + 상사)
- 품질 우선: 정지 이미지 슬라이드쇼·배경음 나레이션·일관성 없는 AI 캐릭터 불허

---

## 완료된 작업

| 편 | 상태 | 경로 |
|---|---|---|
| Episode 001 "퇴근 직전 복사기" | ✅ Owner 승인 완료 | `output/v2/3d_sitcom_prod_v1/episode_001/final_candidate_v031/episode_001_candidate_v031.mp4` |
| Episode 002 "혼자 넵!" | ❌ 폐기 실험본 (v050까지 진행 후 콘텐츠 품질 FAIL) | `output/v2/3d_sitcom_prod_v1/episode_002/` — 삭제 금지, 보존만 |

---

## 현재 진행: Upload 002 "복사기와 협상하는 법"

**폴더**: `output/v2/3d_sitcom_prod_v1/upload_002_copier/`
**목표 길이**: 33~37초
**원칙**: 사건이 영상을 끌고, 대사는 웃음을 완성한다

### 생성 현황

| 단계 | S1 | S2 | S3 | S4 | S5 |
|---|---|---|---|---|---|
| 키프레임 | ✅ | ✅ | ✅ continuity_pass | ✅ continuity_pass | ✅ continuity_pass |
| Veo 영상 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 무음 편집 QA | ⬜ | | | | |
| TTS | ⬜ 준 연속 1회 | | | ⬜ Theo 1회 | |
| 최종본 | ⬜ | | | | |

### 다음 Atomic Task

1. **5장 contact sheet Owner 최종 확인** — `output/v2/3d_sitcom_prod_v1/upload_002_copier/qa/s1_s2_s3_s4_s5_contact_sheet.png`
   - S1~S5 전체 연속성 승인 후 Veo 시작 (승인 게이트)
2. **S1~S5 Veo 영상 생성** (최대 7회 총량, Owner `ALLOW_VEO=true` 승인 필요)
3. **무음 편집본 Owner 확인** (TTS 전 승인 게이트)
4. **TTS 2회** — Jun(Hyun) + Boss(Theo), `ALLOW_ELEVENLABS=true` 명시 승인 필요
5. **무음 편집본 Owner 확인**
6. **TTS 2회** (ALLOW_ELEVENLABS=true 승인 필요)
7. **자막+효과음 최종본**

---

## 핵심 제약

- episode_002 장면·대본·영상 재사용 **금지**
- 준 의상 고정: 하늘색 롤업 셔츠, 빨간 느슨한 넥타이, 네이비 슬랙스, 검은 구두, 갈색 메신저백 / **white shirt 금지**
- S1 시계 완전 제외
- S5 상사 얼굴·전신 **금지** — 정장 소매 손만
- Veo 최대 **7회** 총량
- TTS 최대 **2회** (준 연속 1회 + Theo 상사 1회)
- amix duration=first 단독 사용 금지 (무음 베이스 필수 — v049 교훈)
