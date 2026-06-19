# Preflight — 자동문 면접 키프레임 이미지

**작성:** 2026-06-16  
**상태:** Owner 승인 대기 (실제 생성 금지)  
**외부 호출:** 0회  
**IMAGE_SUBMISSION_COUNT:** 0

---

## §0 스타일 / 캐릭터 IP 고정 (Owner 확정, 2026-06-16)

| 항목 | 확정값 |
|---|---|
| 스타일 | 3D semi-deformed / Pixar-like office sitcom style (upload_002 동일) |
| Jun | 둥근 얼굴 / 큰 갈색 눈 / 검은 사이드파트 머리 / 하늘색 롤업 셔츠 / 느슨한 빨간 넥타이 / 긴 네이비 슬랙스 / 검은 구두 / 갈색 크로스바디 메신저백 |
| ref 이미지 (필수) | `output/v2/3d_sitcom_prod_v1/upload_002_copier/keyframes/kf_s3_tapping_relief_v3_bag.png` |
| 보조 ref | `kf_s1_wide_copier_error.png`, `kf_s2_jammed_paper_continuity_fix.png` |
| 실사/리얼 인물 | **즉시 FAIL** |
| white shirt | **즉시 FAIL** |
| ref 미첨부 생성 | **즉시 FAIL** |

---

## 1. 씬별 키프레임 계획

### 캐릭터 연속성 기준 (전 씬 공통)

| 항목 | 기준값 |
|---|---|
| Jun 스타일 | 3D semi-deformed / Pixar-like (upload_002 준 그대로) |
| Jun 복장 | 하늘색 롤업 셔츠 + 느슨한 빨간 넥타이 + 네이비 슬랙스 + 검은 구두 + 갈색 메신저백 |
| Jun 헤어/얼굴 | 검은 사이드파트 머리 / 둥근 얼굴 / 큰 갈색 눈 |
| 공간 | 현대 오피스 회의실 앞 복도, 유리문, 내부 회의 테이블 희미하게 보임 |
| 유리문 | 프레임 금속, 손잡이 명확히 보임 (S1~S2는 손잡이가 있어도 Jun이 인지 못한 것처럼 행동) |
| 조명 | 사무실 형광등/LED, 밝고 평범한 주간 |
| 화면 비율 | 9:16 세로 (1080×1920) |
| 카메라 앵글 | 약간 낮은 시점 (Jun 전신 또는 상반신+문) |
| ref 첨부 | 매 씬 생성 전 `kf_s3_tapping_relief_v3_bag.png` 첨부 필수 |

---

### S1 키프레임

**시간:** 0~8s  
**핵심 사건:** Jun이 회의실 유리문 앞에서 자동문인 줄 알고 손짓. 문 불반응. 당황.

**이미지 프롬프트 (영어):**
```
Draw a new scene in the same style as the attached reference image. Keep Jun's character design exactly: round face, large brown eyes, black side-part hair, light-blue rolled-sleeve shirt, loose red tie, long navy slacks, black dress shoes, brown crossbody messenger bag. New scene: Jun stands in front of a glass meeting room door in a modern office corridor. He is waving his hand in front of the door sensor area as if activating an automatic door. The door is clearly a manual door with a visible metal handle, but he hasn't noticed it. His expression: confident but slightly puzzled. The door is not opening. Cute comedic semi-deformed 3D animated style, office lighting. Vertical 9:16 format. STRICT BANS: white shirt, realistic human photo, Jun touching the handle, door open.
```

**FAIL 조건:**
- Jun 손이 손잡이를 잡으면 FAIL (아직 자동문으로 착각 중)
- 문이 열린 상태이면 FAIL
- Boss 신체 일체 등장 금지

---

### S2 키프레임

**시간:** 8~22s  
**핵심 사건:** Jun이 센서를 찾으려 몸을 좌우로 흔들고, 손바닥을 문에 댄다.

**이미지 프롬프트 (영어):**
```
Draw a new scene in the same style as the attached reference image. Keep Jun's character design exactly: round face, large brown eyes, black side-part hair, light-blue rolled-sleeve shirt, loose red tie, long navy slacks, black dress shoes, brown crossbody messenger bag. New scene: Jun is pressing his palm flat against the glass meeting room door, leaning close, searching for a motion sensor. His body is slightly tilted sideways. Expression: concentrated, slightly embarrassed, almost comedic. The door handle is clearly visible in frame but he is ignoring it entirely. The door remains closed. Cute comedic semi-deformed 3D animated style, office lighting. Vertical 9:16 format. STRICT BANS: white shirt, realistic human photo, Jun touching or gripping the handle, Jun looking at the handle, door open.
```

**FAIL 조건:**
- 손바닥이 손잡이를 잡으면 FAIL
- 문이 열려 있으면 FAIL
- Jun 시선이 손잡이를 향하면 FAIL (아직 인지 전)
- Boss 신체 일체 등장 금지

---

### S3 키프레임

**시간:** 22~30s  
**핵심 사건:** 안쪽 손이 손잡이를 쥐고 문이 딸깍 열리는 순간. Jun 굳음.

**이미지 프롬프트 (영어):**
```
Draw a new scene in the same style as the attached reference image. Keep Jun's character design exactly: round face, large brown eyes, black side-part hair, light-blue rolled-sleeve shirt, loose red tie, long navy slacks, black dress shoes, brown crossbody messenger bag. New scene: glass meeting room door. From the inside, only a business sleeve (suit cuff visible, NO face, NO body above wrist) grips the door handle. The door is beginning to open — a slight gap, door moving outward. On the outside, Jun is frozen mid-motion, his hand still raised slightly, expression: stunned realization. The moment of reversal. Cute comedic semi-deformed 3D animated style. Vertical 9:16 format. STRICT BANS: white shirt, realistic human photo, Boss face/shoulders/body, Jun gripping the handle, door fully open.
```

**FAIL 조건 (최우선):**
- Boss 얼굴 등장 → 즉시 FAIL
- Boss 전신/어깨/몸통 등장 → 즉시 FAIL
- 손잡이가 화면에 불명확하면 FAIL (반전의 핵심 시각 단서)
- 문이 완전히 열린 상태이면 FAIL (열리는 순간이어야 함)
- Jun이 손잡이를 잡고 있으면 FAIL (안쪽 손이어야 함)

---

### S4 키프레임

**시간:** 30~38s  
**핵심 사건:** 열린 문 앞 Jun, 체념+민망 표정. 수동문 반전 완전 인지 후.

**이미지 프롬프트 (영어):**
```
Draw a new scene in the same style as the attached reference image. Keep Jun's character design exactly: round face, large brown eyes, black side-part hair, light-blue rolled-sleeve shirt, loose red tie, long navy slacks, black dress shoes, brown crossbody messenger bag. New scene: the glass door is now open. Jun stands in the doorway, shoulders slightly slumped, expression: resigned and embarrassed — the look of someone who just realized they were obviously wrong. He is not touching the door. His posture is slightly deflated but composed. Background: inside of meeting room softly blurred. No other character's face or body visible. Cute comedic semi-deformed 3D animated style, soft office lighting. Vertical 9:16 format. STRICT BANS: white shirt, realistic human photo, Boss face/body, door closed.
```

**FAIL 조건:**
- Boss 신체/얼굴 일체 등장 금지
- Jun 표정이 당황이 아닌 분노/웃음이면 ⚠️ 체감 확인 필요
- 문이 닫혀 있으면 FAIL (S4는 문 열린 후)

---

## 2. 연속성 기준 요약

| 항목 | S1 | S2 | S3 | S4 |
|---|---|---|---|---|
| 문 상태 | 닫힘 | 닫힘 | 열리는 순간 | 열림 |
| Jun 행동 | 손짓 | 손바닥 대기 | 굳음 | 체념 서 있음 |
| Boss | 없음 | 없음 | 손목+손만 | 없음 |
| 손잡이 가시성 | 있음(무시) | 있음(무시) | 핵심(쥐는 중) | 있음(이미 열림) |

---

## 3. ChatGPT 이미지 Preflight 체크

**완료: 2026-06-16 06:22 (PID=48000)**

| 항목 | 상태 | 비고 |
|---|---|---|
| GPT-1 포트 9222 응답 | ✅ PASS | Chrome 자동 실행됨 (PID=48000) |
| ChatGPT 로그인 여부 | ✅ PASS | `https://chatgpt.com/` 리다이렉트 없음 |
| 중단 조건 감지 | ✅ PASS | rate limit / 사용 한도 없음 |
| 이미지 도구 활성 여부 | ✅ PASS | Image tool 버튼 visible |
| 파일 첨부 버튼 | ✅ PASS | Attach 버튼 visible |
| 텍스트 입력창 | ✅ PASS | #prompt-textarea visible |
| TOTAL_MESSAGE_SEND_COUNT | 0 ✅ | 전송 없음 |
| IMAGE_SUBMISSION_COUNT | 0 ✅ | 이미지 제출 없음 |
| 실제 외부 호출 | 0회 ✅ | |

**→ PREFLIGHT_PASS — 이미지 생성 착수 가능 상태. Owner 승인 대기.**

---

## 4. 예상 호출/비용

| 항목 | 값 |
|---|---|
| 목표 이미지 수 | 4장 (씬당 1장) |
| 씬당 최대 허용 호출 | 2회 |
| 최대 총 호출 | 8회 |
| 예상 비용 (8회 기준) | $0.32 이내 |
| 비용 상한 | $0.40 초과 시 Owner 재승인 |

---

## 5. ABORT 조건

| 조건 | 처리 |
|---|---|
| Boss 얼굴/전신/어깨/몸통 등장 | 즉시 FAIL + 재제출 금지 + Codex 보고 |
| 씬당 2회 초과 시 | ABORT + Owner 승인 없이 추가 생성 금지 |
| 손잡이가 S3에서 불명확 | FAIL + 프롬프트 수정 후 Owner 승인 재요청 |
| 행동 사건이 영상 없이도 불명확 | FAIL |
| 자동 재제출 | 절대 금지 |
| $0.40 초과 | 즉시 중단 + Owner 보고 |

---

## 6. 생성 착수 승인 문구 (Owner용)

아래 문구를 Claude Code에 전달 시 키프레임 이미지 생성 착수:

```
자동문 면접 키프레임 이미지 생성 승인
ALLOW_CHATGPT_IMAGE=true
씬당 최대 2회 / 총 최대 8회 / $0.40 상한
Boss 얼굴/전신/어깨 등장 즉시 ABORT
자동 재제출 금지
```
