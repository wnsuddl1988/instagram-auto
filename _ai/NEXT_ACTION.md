# Next Action

## 현재 상태

- upload_002_copier: 에피소드 폐기 확정 (2026-06-16)
- **자동문 면접 키프레임 4씬 완료 (2026-06-19)**
  - S1/S2/S3/S4 전부 Codex QA PASS
  - 누적 전송 5/8회, 잔여 예산 3회
- 신규 에피소드 Veo 사전설계 단계로 전환

## 현재 Veo 생성 상태 (2026-06-19)

| 씬 | 결과 | 비고 |
|----|------|------|
| S1 | ✅ `s1_veo_raw.mp4` | 2541KB, 720×1280, 10s |
| S2 | ✅ `s2_veo_raw.mp4` | 2428KB, 720×1280, 10s |
| S3 | ❌ **Veo 거절** | 콘텐츠 정책 — Boss 손/소매 묘사 추정 |
| S4 | ⏸ 미실행 | S3 해결 후 진행 |

---

## S3 Boss-Free 키프레임 이력

| 버전 | 파일 | md5 | 판정 | 사유 |
|------|------|-----|------|------|
| v1 | `s3_bossfree_kf_try1.png` | `d1affe2e` | ❌ action_fail | S2 동작 반복(손바닥→유리), 문 미열림 — ref 재사용 금지 |
| v2 | `_FAIL_s3_bossfree_clone_md5_d1affe2e.png` | `d1affe2e` | ❌ fail_clone | v1과 완전 동일 — 동일 세션 캐시 고착 추정 |
| v3 | `_FAIL_s3_bossfree_clone_md5_d1affe2e.png` | `d1affe2e` | ❌ fail_clone | 새 채팅 강제+프롬프트 재구성에도 동일 → s2 ref가 원인 |
| v4 | `s3_bossfree_kf_try4.png` | `077ccba0` | ❌ content_clone_fail | S4 전체 장면 ref → 구도·문 개방도·체념 포즈까지 복제. MD5 clone 가드로 perceptual clone 차단 불가 확인. 재사용 금지 |
| v5 | `s3_bossfree_kf_try5.png` | `758148c6` | ❌ continuity_fail | ref=jun_identity_reference.png (identity-only). 가로 레버 손잡이 생성 — S2 세로 PULL 손잡이와 불일치. 캐릭터·반응·Boss-Free는 PASS. 연속성 실패. |
| **v6** | `s3_bossfree_kf_try6.png` | `aea43e2b` | ✅ qa_pass | ref 2개 분리: `jun_identity_reference.png`(캐릭터) + `door_identity_reference.png`(문 구조). 세로 PULL 손잡이·문 프레임 연속성 PASS. Codex QA PASS. |

---

## 다음 atomic task — S3 Veo Refusal 복구

**현황:** S3 Veo 생성 시 Gemini가 콘텐츠 정책으로 거절. S4 미실행.  
**S3 Boss-Free 키프레임 v1 생성 완료 → action_fail (S2 동작 반복). v2 재생성 승인 필요.**

### 옵션 비교 (A/B/C)

| 옵션 | 방법 | 위험 | 권장 |
|------|------|------|------|
| **A** 기존 ref + 프롬프트 완화 | 같은 S3 키프레임 + Boss 손/소매 묘사 표현 약화 | 동일 이미지로 재제출 → 거절 반복 가능성 높음 | ✗ |
| **B** Boss 신체 없이 S3 재설계 | 새 키프레임: 문이 이미 열리기 시작한 상태, Jun 반응 중심 | ChatGPT 이미지 1회 필요, 가장 안전 | **✅ 권장** |
| **C** S3 삭제 + S4 앞당김 | S3 컷 제거, S4를 직접 연결 | 극적 흐름(문 열리는 순간) 소실, 편집 난이도 상승 | ✗ |

### 권장안 B — Boss-Free S3 재설계

**핵심 원칙:** Boss는 영상에 절대 등장하지 않음. 오프스크린 존재는 **문의 움직임**으로만 암시.

#### 새 S3 씬 컨셉
- 자동문이 안쪽에서 이미 열리기 시작한 상태 (문짝이 옆으로 밀리는 모션)
- Jun은 문 밖 로비에 서서 문이 열리는 것을 보고 표정 변화 (놀람 → 당황)
- Boss 손/소매/팔꿈치/실루엣/반사 일체 없음
- 카메라: 문 바깥쪽 고정 미디엄 샷, Jun 상반신 + 유리문 프레임

#### 새 S3 키프레임 조건 (ChatGPT 이미지용)
```
- 유리 자동문이 옆으로 약 30% 열린 상태 (손잡이/문짝 움직임 중)
- Jun: 문 앞에 서서 미간 찌푸리며 유리문 응시, 양손은 몸통 옆 (손 위치 명확)
- 문 너머 사무실 내부: 배경 흐림 처리, 인물 실루엣 없음
- 조명: 밝은 로비, 자연광 또는 형광등
- Jun 복장 유지: 하늘색 롤업 셔츠, 루즈 빨간 넥타이, 네이비 슬랙스
- Boss 관련 신체 일체 프레임 밖
```

#### S4 호환성 확인
- S4 키프레임(`s4_kf_qa_pass.png`): Jun이 문 안쪽으로 들어가는 장면
- B안 적용 시 S3(문 열림)→S4(Jun 진입) 흐름 자연스럽게 유지됨 ✅

#### S3 Veo 프롬프트 (Boss-Free 버전)
```
Vertical 9:16 video, 720×1280. The glass automatic office door slides open from inside — 
no human hands or body parts visible; only the door moving on its own. 
Jun stands just outside in the lobby, watching the door open with a surprised, 
slightly confused expression. He does not move. 
Medium shot from outside, Jun's upper body centered, glass door frame visible. 
No person appears through the glass — interior is blurred. 
Realistic office lobby lighting.
```

---

### Owner 승인 필요 사항

#### S3 ref 이력 요약 (v5 확정)

| 버전 | ref | 결과 | 근본 원인 |
|------|-----|------|-----------|
| v1~v3 | `s2_kf_qa_pass.png` | ❌ d1affe2e 고착 | 전체 장면 ref → 동일 포즈 복제 |
| v4 | `s4_kf_qa_pass.png` | ❌ content_clone_fail | 전체 장면 ref → 구도/포즈/문 개방도 복제 |
| **v5** | **`jun_identity_reference.png`** | **⏸ 대기** | S1/S2 얼굴+복장 crop만 (배경·문 제외) |

**근본 원인 확정:** 전체 장면 키프레임을 ref로 쓰면 ChatGPT가 배경·구도·포즈까지 그대로 복제함. v5는 얼굴+복장 identity-only ref로 전환.

**S3 Boss-Free v6 키프레임 생성 승인 문구 (안)**
```
S3 Boss-Free v6 키프레임 생성 승인
ALLOW_CHATGPT_IMAGE=true
스크립트: scripts/_ep003-jdm-s3-bossfree-kf-v6.mjs
대상: s3_bossfree_kf_try6.png 1회
ref 1 (캐릭터): jun_identity_reference.png (S1 얼굴+복장 identity-only)
ref 2 (문 구조): door_identity_reference.png (S2 세로 PULL 손잡이+프레임, Jun 없음)
SAFETY_GATE: 썸네일 2개 확인 후 전송 / 하나라도 실패 시 ABORT
금지 ref: s1~s4 전체 장면 키프레임 전부 / s3_bossfree_kf_try1~try5 포함
FAIL MD5: d1affe2e / 4a69bed3 / 077ccba0 / 8bdb9b66 / e9f6acf2 / 758148c6
FAIL 기준:
  - 가로 레버·원형 손잡이·푸시바 (S2 세로 PULL 불일치)
  - S4 구도 동일 / 고개 숙임 체념 / 양손 주머니
  - 문 거의 완전 개방 / Boss 신체
생성 후 Owner QA → 통과 시 S3 Veo preflight 갱신 → Veo 재제출 승인 별도
```

**S3 Veo 재제출은 별도 승인 필요 (키프레임 QA PASS 후)**

**S4 Veo는 S3 새 키프레임 QA PASS + S3 Veo PASS 이후 진행. S3 미해결 상태에서 S4 병행 금지.**

## 금지

- Any external call (ElevenLabs / Veo / GPT 이미지)
- 새 영상 생성
- 기존 파일 삭제
- commit/push/merge/reset/clean

## 후보 기준 (QUALITY_GATE Episode Rules)

- 대사가 화면 사건보다 먼저 나오는 구조 → FAIL
- 컷 전환 중 핵심 대사가 걸리는 구조 → FAIL
- 대사로 화면을 억지 설명하는 구조 → FAIL
- Boss/제3자 등장은 화면상 진입 근거 없으면 → FAIL
- 영상 없이 대본만 읽어도 의미가 통하는 구조 → FAIL (영상 의존도 필수)

## After Owner approval

~~Owner가 기획안 중 1개 승인 → Contract 5종 작성~~ (완료 2026-06-16)  
~~키프레임 4씬 생성~~ (완료 2026-06-19)  
~~Veo 생성 승인 대기 → 승인 후 S1~S4 Veo 생성~~ (S1/S2 완료 2026-06-19, S3 refusal 복구 대기)  
**현재: S3 Boss-Free 키프레임 생성 승인 대기 → S3 키프레임 QA → S3 Veo → S4 Veo → TTS → 편집**
