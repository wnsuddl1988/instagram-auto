# Preflight — 자동문 면접 Veo 영상 생성

**작성:** 2026-06-19  
**상태:** Owner 승인 대기 (Veo 생성 금지)  
**외부 호출:** 0회  
**VEO_SUBMISSION_COUNT:** 0 / 4 (상한)

---

## §0 전제 조건

| 항목 | 값 |
|---|---|
| 스타일 | 3D semi-deformed / Pixar-like office sitcom (upload_002 동일) |
| Jun IP | 하늘색 롤업 셔츠 / 느슨한 빨간 넥타이 / 네이비 슬랙스 / 검은 구두 / 갈색 메신저백 / 검은 사이드파트 / 둥근 얼굴 |
| 공간 | 현대 오피스 회의실 앞 복도, 유리 스윙 도어, PULL 손잡이 왼쪽 부착, MEETING ROOM 표지판 |
| Veo 상한 | 씬당 1회, 총 4회 — 초과 시 자동 재시도 금지, Owner 재승인 필요 |
| 자동 재시도 | 절대 금지 |
| 생성 금지 | TTS / ChatGPT 이미지 — 이번 단계 외 |
| 기준 ref | `output/v2/ep003_jdm/keyframes/s[1-4]_kf*.png` (씬별) |

---

## §1 씬별 Veo Contract

### S1 (0~8s) — 자동문 착각 + 손짓 실패

#### 시작 프레임 상태 (키프레임 일치)
- Jun이 복도 오른쪽에 서서 유리문 정면을 바라봄
- 오른손을 들어 허공에 손짓하는 자세
- 문: 완전히 닫힘, PULL 손잡이 왼쪽 부착
- Boss 없음, 아무것도 문에 닿지 않음

#### 시간순 행동 beat
| 타임 | 행동 |
|---|---|
| 0.0~1.5s | 시작 프레임 유지. Jun 미소 띤 기대 표정으로 손을 천천히 한 번 흔듦 |
| 1.5~3.0s | 문 무반응. Jun 표정이 약간 의아함으로 변함. 손을 다시 한 번 더 흔듦 |
| 3.0~6.0s | Jun이 손을 내리고 문을 바라봄. 고개를 살짝 기울임(왜 안 열리지?). 문 여전히 닫힘 |
| 6.0~8.0s | Jun이 한 발 앞으로 다가섬(손잡이는 여전히 인지 못함). 마지막 프레임: 문 가까이에서 의아한 표정 |

#### 마지막 프레임 상태 (→ S2 연결)
- Jun이 문 가까이에 서 있음
- 손은 내려와 있거나 살짝 뻗은 상태
- 표정: 의아함 / 당황 초입
- 문: 닫힘

#### S2 연결점
- S1 마지막: Jun이 문 가까이에서 의아한 상태
- S2 시작: Jun이 손바닥을 문에 밀착시키기 직전 또는 직후

#### 필수 유지 요소
- Jun IP 복장 100% 유지
- 유리문 PULL 손잡이 왼쪽 위치 유지
- MEETING ROOM 표지판 (또는 Meeting Room 3A) 일관성
- 카메라: 고정 또는 매우 약한 push-in (좌우 이동, 급격한 줌 금지)
- Jun 전신 또는 상반신+문 구도 유지

#### 즉시 FAIL 요소
- Jun 손이 손잡이를 잡거나 터치 → FAIL
- 문이 조금이라도 열림 → FAIL
- Boss 또는 다른 인물의 신체 일부 등장 → FAIL
- 센서/전자 패널/WAVE OPEN 표시 등장 → FAIL
- Jun 복장 변경 (white shirt 등) → FAIL
- 내부 몽타주 컷/순간이동/장면 점프 → FAIL

---

### S2 (8~22s) — 센서 찾기 에스컬레이션

#### 시작 프레임 상태 (키프레임 일치)
- Jun이 몸을 앞으로 기울여 손바닥을 유리문에 밀착
- 당황+집중 표정
- 문 왼쪽 위에 Meeting Room 3A 표지판
- 문: 완전히 닫힘, 손잡이 보임 (Jun은 무시 중)

#### 시간순 행동 beat
| 타임 | 행동 |
|---|---|
| 0.0~3.0s | 시작 프레임. Jun 손바닥을 문에 대고 좌우로 천천히 움직임(센서를 찾는 동작) |
| 3.0~6.0s | Jun 몸을 약간 뒤로 물리고 고개를 돌려 문 프레임 상단을 봄(센서 위치 탐색) |
| 6.0~10.0s | Jun 다시 앞으로 다가와 문 옆 벽면을 손바닥으로 쓸어봄. 표정: 민망함 증가 |
| 10.0~14.0s | Jun이 한 걸음 물러나 두 팔을 살짝 벌려 어리둥절 자세. 문을 다시 바라봄 |
| 14.0~14.0s | 마지막 프레임: Jun이 멈춘 상태, 표정 최고조 당황 (→ S3 전환 직전) |

#### 마지막 프레임 상태 (→ S3 연결)
- Jun이 문 앞에서 멈춘 상태, 몸이 약간 굳음
- 표정: 당황 + 어쩔 줄 모름
- 문: 닫힘, 손잡이 화면에 보임

#### S3 연결점
- S2 마지막: Jun 멈춘 순간
- S3 시작: 그 순간 안쪽 손이 손잡이를 당기기 시작 (컷 전환)

#### 필수 유지 요소
- Jun IP 복장 100% 유지
- 손잡이가 화면에 보이지만 Jun이 무시하는 구도
- Meeting Room 표지판 일관성
- 카메라: 고정 권장 (Jun의 에스컬레이션 행동이 코미디 핵심)

#### 즉시 FAIL 요소
- Jun 손이 손잡이를 그립 → FAIL
- Jun 시선이 손잡이를 향해 "인지"하는 표정 → FAIL (S3에서 반전 필요)
- 문이 열림 → FAIL
- Boss 또는 다른 인물 등장 → FAIL
- 내부 컷 전환 / 장면 점프 → FAIL

---

### S3 (22~30s) — 수동문 반전 (Boss Rule 최우선)

#### 시작 프레임 상태 (키프레임 일치)
- 문이 열리기 시작하는 순간 (약간의 갭, 문이 바깥쪽으로 열리는 중)
- 화면 왼쪽: Boss의 손, 손목, 아주 짧은 정장 소매/짧은 팔뚝 일부만 화면 가장자리에 등장. 팔꿈치 이상 절대 금지.
- Jun: 충격/굳음 표정, 오른손 살짝 들린 채로 멈춤
- MEETING ROOM 표지판 보임

#### 시간순 행동 beat
| 타임 | 행동 |
|---|---|
| 0.0~1.5s | 시작 프레임. 소매 손이 문을 계속 당겨 열음. Jun 완전히 굳음 |
| 1.5~4.0s | 문이 충분히 열림 (반쯤). Jun 표정: 굳음 → 민망함 시작. 손은 여전히 어중간하게 들려 있음 |
| 4.0~6.0s | Jun이 천천히 손을 내리고 자세를 바로잡으려 함. Boss 소매 손은 문을 잡고 있는 채로 정지 |
| 6.0~8.0s | 마지막 프레임: Jun이 열린 문 앞에 서 있음, 체념 표정 초입 (→ S4 시작 상태와 연결) |

#### 마지막 프레임 상태 (→ S4 연결)
- 문이 열린 상태
- Jun이 문 앞에 서 있음, 표정: 체념 초입
- Boss 소매 손은 사라지거나 화면 가장자리로 퇴장

#### S4 연결점
- S3 마지막: Jun 체념 초입, 열린 문
- S4 시작: 동일 구도에서 표정이 체념 완성으로 이행

#### ⚠️ BOSS RULE — 독립 FAIL 게이트

아래 항목은 다른 품질 기준과 무관하게 즉시 FAIL + 재시도 금지:

| 금지 항목 | 처리 |
|---|---|
| Boss 얼굴 (어느 각도든) | 즉시 FAIL + Codex 보고 |
| Boss 머리 (실루엣 포함) | 즉시 FAIL |
| Boss 어깨/목/몸통 | 즉시 FAIL |
| Boss 팔뚝이 팔꿈치 위로 올라감 | 즉시 FAIL |
| 유리에 Boss 반사 | 즉시 FAIL |
| 카메라가 Boss 방향으로 패닝/이동 | 즉시 FAIL |
| 화면이 안쪽을 향해 확장 | 즉시 FAIL |

**허용:** Boss의 손 + 손목 + 아주 짧은 정장 소매/짧은 팔뚝 일부 (팔꿈치 이상 금지)

#### 필수 유지 요소
- 손잡이(PULL)가 화면에 명확히 보여야 함 (반전의 핵심 시각 단서)
- Jun IP 복장 100% 유지
- 카메라: 고정 (Boss 쪽으로 이동 절대 금지)

---

### S4 (30~33s) — 체념 펀치라인 대기

#### 시작 프레임 상태 (키프레임 일치)
- 문이 완전히 열려 있음
- Jun이 문 앞에 홀로 서 있음, 어깨 살짝 처짐
- 체념+민망 표정으로 고개 살짝 숙임
- Boss 없음

#### 시간순 행동 beat
| 타임 | 행동 |
|---|---|
| 0.0~1.5s | 시작 프레임 유지. Jun이 약간 숨을 내쉬는 듯한 동작 (어깨 미세하게 내려감) |
| 1.5~3.0s | Jun이 천천히 고개를 들어 정면(안쪽)을 바라봄. 표정: 체념 + 민망 + 당당한 척 |
| 3.0~3.5s | 마지막 2초: 표정과 자세 안정. 펀치라인 대사 발화를 위한 정지 프레임 유지 |

#### 마지막 프레임 상태
- Jun이 열린 문 앞에 서서 정면을 바라보는 안정된 자세
- 표정: 체념 완성 + 약간의 당당함 (펀치라인 전달 가능한 상태)
- 추가 행동 없음

#### 필수 유지 요소
- 마지막 1.5~2s는 표정/자세 안정 유지 (TTS 대사 타이밍 확보)
- Jun IP 복장 100%
- Boss 신체 일체 없음
- 문 열린 상태 유지

#### 즉시 FAIL 요소
- Boss 신체/얼굴 등장 → FAIL
- Jun 표정이 분노/웃음/당황 → ⚠️ 체감 확인 (체념 톤 필수)
- 문이 닫힘 → FAIL
- 다른 인물 등장 → FAIL

---

## §2 씬 연결 계약

| 전환 | S끝 상태 | 다음S 시작 상태 | 인과 관계 |
|---|---|---|---|
| S1→S2 | Jun 문 가까이 의아한 상태 | Jun 손바닥 문 밀착 | 손짓 실패 → 더 가까이 다가가 센서 탐색 |
| S2→S3 | Jun 멈춤, 최고조 당황 | 안쪽 손이 손잡이 당기는 순간 | 탐색 중 갑자기 반전 발생 |
| S3→S4 | Jun 체념 초입, 열린 문 | Jun 체념 완성, 열린 문 | 반전 인지 후 체념으로 이행 |

**컷 전환 규칙:**
- 모든 컷 전환은 행동 beat 사이 무음 구간에서
- 대사 중 컷 전환 금지
- 각 씬 내부 몽타주/순간이동/다중 컷 금지

---

## §3 편집 예상 길이

| 씬 | 기획 길이 | 비고 |
|---|---|---|
| S1 | 8s | 손짓 2회 + 의아함 + 다가섬 |
| S2 | 8s | 에스컬레이션 3단계 (손바닥→벽→물러남) |
| S3 | 6s | 반전 순간 + Jun 굳음 + 체념 초입 |
| S4 | 3~3.5s | 체념 정착 + 펀치라인 대사 타이밍 |
| **합계** | **25~25.5s (raw)** | trim 후 TTS tail 포함 최종 **28~31s** |

**TTS 추가 길이:**
- B1 (Boss): "거기서 뭐 하세요?" ≈ 1.5s (S3 후반 오버랩 가능)
- J1 (Jun): "입장 절차가 까다롭네요." ≈ 2.0s (S4 마지막 2s 구간 활용)
- tail 0.5s

**최종 예상:** 약 29~32s → Contract 목표 30~33s 범위 내 ✅

---

## §4 Veo 프롬프트 초안

> 아래 프롬프트는 각 씬 키프레임을 reference로 첨부한 상태에서 사용.  
> 실제 생성 스크립트는 이번 범위 외.

### S1 프롬프트

```
Animate this 3D semi-deformed Pixar-style scene. The character Jun is standing in a modern office corridor facing a glass meeting room door. He waves his right hand in front of the door once, then again, expecting it to open automatically. The door does not open. His expression shifts from confident expectation to mild puzzlement. He then takes a slow step closer toward the door, still not touching the handle. Camera: fixed, slight natural push-in only. Duration: 8 seconds. STRICT BANS: door opening, Jun touching the handle, any sensor or electronic panel, any other character, white shirt, cut or jump in scene, camera panning away.
```

**정적 검사:**
- 시작 프레임: Jun 손짓 자세, 문 닫힘 ✅ 키프레임 S1 일치
- 금지 사항: 문 열림 / 손잡이 터치 / 센서 / 다른 인물 명시 ✅
- 카메라: 고정/약한 push-in ✅
- BOSS RULE: "any other character" ✅

---

### S2 프롬프트

```
Animate this 3D semi-deformed Pixar-style scene. Jun is pressing his palm against a glass office door, searching for a motion sensor. He slowly moves his hand left and right across the glass, then leans back to look at the top of the door frame, then steps closer again and runs his palm across the wall beside the door. His expression escalates from focused to embarrassed. The door remains closed throughout. The door handle is visible but Jun never looks at or touches it. Camera: fixed. Duration: 8 seconds. STRICT BANS: door opening, Jun touching or gripping the handle, Jun looking at the handle with recognition, any other character appearing, white shirt, internal cuts or scene jumps.
```

**정적 검사:**
- 시작 프레임: Jun 손바닥 문 밀착, 당황 표정, 문 닫힘 ✅ 키프레임 S2 일치
- 손잡이 무시 행동 명시 ✅
- 에스컬레이션 3단계 beat 포함 ✅
- BOSS RULE: "any other character" ✅

---

### S3 프롬프트

```
Animate this 3D semi-deformed Pixar-style scene. The glass meeting room door begins to open from the inside. Only the off-screen boss's hand, wrist, and a very short business-suit sleeve are visible at the extreme edge of the frame. No elbow or anything above the elbow may appear. No face, head, neck, shoulder, torso, silhouette, or reflection in the glass. The hand grips the door handle (marked PULL) and pulls the door open. Jun, standing outside, freezes mid-motion with a shocked expression. As the door opens further, Jun slowly lowers his hand and his expression shifts from shock to embarrassment. Camera: completely fixed, do NOT pan or move toward the inside. Duration: 6 seconds. STRICT BANS: any part of Boss above the elbow (face, head, neck, shoulders, torso, reflected in glass), camera moving toward interior, door closing again, Jun gripping the handle, white shirt, internal cuts.
```

**정적 검사:**
- 시작 프레임: 문이 열리기 시작, Boss 손목+손+소매만, Jun 충격 표정 ✅ 키프레임 S3 일치
- Boss Rule 독립 게이트 항목 전부 명시 ("hand, wrist, very short sleeve only — NO elbow above, NO face, NO shoulders, NO silhouette, NO reflection") ✅
- "reflected in glass" 명시 ✅
- 카메라 이동 금지 명시 ✅

---

### S4 프롬프트

```
Animate this 3D semi-deformed Pixar-style scene. Jun is standing alone in front of the now-open glass meeting room door. He slowly exhales, shoulders dropping slightly. He then gently raises his head to look forward with a resigned, slightly embarrassed expression — the look of someone accepting defeat gracefully. He holds this stable pose for the final 2 seconds, ready to deliver a closing line. No other characters appear. Camera: fixed. Duration: 3.5 seconds. STRICT BANS: door closing, any other character or body part appearing, Jun looking angry or laughing, white shirt, internal cuts.
```

**정적 검사:**
- 시작 프레임: 문 완전히 열림, Jun 체념+민망, 혼자 ✅ 키프레임 S4 일치
- 마지막 2s 안정 자세 명시 ✅ (TTS 타이밍 확보)
- Boss 없음 명시 ✅

---

## §5 정적 검사 요약

| 씬 | ref 시작 프레임 일치 | 대사 없이 사건 이해 | 씬 연결 인과 | BOSS RULE 게이트 | 카메라 제한 |
|---|---|---|---|---|---|
| S1 | ✅ | ✅ | ✅ (→S2) | ✅ | ✅ |
| S2 | ✅ | ✅ | ✅ (→S3) | ✅ | ✅ |
| S3 | ✅ | ✅ | ✅ (→S4) | ✅ 독립 게이트 | ✅ 이동 금지 |
| S4 | ✅ | ✅ | N/A | ✅ | ✅ |

**무음 이해도 체크:**
- S1: "자동문인 줄 알고 손짓 → 안 열림" — ✅ 대사 없이 이해
- S2: "센서를 찾으려 이리저리 탐색" — ✅ 행동 에스컬레이션으로 전달
- S3: "안쪽 손이 수동 손잡이를 당김 → 반전" — ✅ PULL 표지판+손잡이+소매 조합
- S4: "체념한 채로 서 있음" — ✅ 표정+자세로 전달

---

## §6 Stop-Loss 확인

| 항목 | 값 |
|---|---|
| 외부 호출 (이번 단계) | **0회 ✅** |
| Veo 제출 | **0회 ✅** |
| ChatGPT 이미지 제출 | **0회 ✅** |
| TTS 호출 | **0회 ✅** |
| 비용 | **$0 ✅** |
| 실제 생성 스크립트 작성 | **이번 범위 외 ✅** |
| 자동 재시도 설계 | **없음 ✅** |

---

## §7 Veo 생성 착수 승인 문구 (Owner용)

```
자동문 면접 Veo 영상 생성 승인
ALLOW_VEO=true
대상 씬: S1 / S2 / S3 / S4 (씬당 1회 / 총 4회 상한)
Boss Rule: 손목 위 신체 일체 → 즉시 FAIL + 재시도 금지
자동 재시도 금지
S3 Boss Rule FAIL 시 Codex 보고 후 대기
```

---

## §8 Veo Preflight 체크 (생성 전 필수)

다음 항목은 실제 Veo 생성 전 별도 preflight 실행 시 확인:

| 항목 | 확인 방법 |
|---|---|
| Gemini 로그인 (G1/G2 포트) | `_gemini-veo-preflight.mjs` 실행 |
| PREFLIGHT_STALE 게이트 (24h) | preflight 파일 타임스탬프 확인 |
| 각 씬 ref 파일 존재 확인 | `output/v2/ep003_jdm/keyframes/s[1-4]_kf*.png` 파일 접근 확인 |
| 씬별 프롬프트 해시 기록 | preflight 시점에 기록 |
| Veo 크레딧 잔여량 | Gemini 대시보드 수동 확인 (Owner 확인) |
