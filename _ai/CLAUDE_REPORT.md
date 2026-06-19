# CLAUDE_REPORT — 자동문 면접 키프레임 preflight

**작성:** 2026-06-16  
**갱신:** 2026-06-16 06:22 (GPT-1 preflight 완료)  
**작업:** 4씬 키프레임 이미지 계획 + ChatGPT preflight 완료 (외부 호출 0회)  
**외부 호출:** 0회 / TOTAL_MESSAGE_SEND_COUNT=0 / IMAGE_SUBMISSION_COUNT=0  
**commit/push:** 없음

---

## Preflight 결과

| 항목 | 상태 |
|---|---|
| 4씬 키프레임 프롬프트 작성 | ✅ 완료 |
| 연속성 기준 정의 | ✅ 완료 |
| ABORT 조건 정의 | ✅ 완료 |
| GPT-1:9222 Chrome CDP | ✅ PASS (PID=48000, auto-launched) |
| ChatGPT 로그인 | ✅ PASS (https://chatgpt.com/ 리다이렉트 없음) |
| 중단 조건 감지 | ✅ PASS (rate limit 없음) |
| 이미지 도구 버튼 | ✅ PASS (visible) |
| 파일 첨부 버튼 | ✅ PASS (visible) |
| 텍스트 입력창 | ✅ PASS (visible) |
| TOTAL_MESSAGE_SEND_COUNT | 0 ✅ |
| IMAGE_SUBMISSION_COUNT | 0 ✅ |
| 실제 이미지 생성 | 0회 ✅ |

**→ PREFLIGHT_PASS — 이미지 생성 착수 가능 상태. Owner 승인 대기.**

---

## 스타일/캐릭터 IP 고정 (2026-06-16)

| 항목 | 결과 |
|---|---|
| S1 실사 시도 (ref 미첨부) | ❌ FAIL — no_image / 재사용 금지 |
| 스타일 확정 | 3D semi-deformed / upload_002 준 IP 고정 |
| ref 이미지 | `kf_s3_tapping_relief_v3_bag.png` (2836KB) ✅ |
| 프롬프트 수정 | 4씬 전부 3D 스타일 + Jun IP 명세 + STRICT BANS 추가 |
| attachRef() 추가 | `scripts/_ep003-jdm-keyframe-generate.mjs` 수정 완료 |
| 추가 외부 호출 | 0회 ✅ |
| TOTAL_SEND (S1 포함 누적) | 1회 |
| 잔여 예산 | 7회 (8회 상한 기준) |

**→ Owner 재승인 후 재생성 가능**

---

## Guard 수정 + Dry-run 결과 (2026-06-16)

### 수정 내용 (`scripts/_ep003-jdm-keyframe-generate.mjs`)

| 수정 항목 | 내용 |
|---|---|
| `refAttached` boolean 플래그 | false 초기화 → attachRef 성공 시만 true → SAFETY_GATE 차단 |
| ref 실패 시 tries-- + continue | 예산 미소비 재시도 / PER_SCENE 초과 시 fail_ref + break |
| `validateScenePrompt()` | S3 필수 키워드 누락 시 abort_prompt_mismatch |
| intercept route 전송 전 설정 | interceptBufs = new Map → page.route 설정 후 sendBtn 클릭 |
| `collectFromIntercept()` | ref 크기(±10%) 제외 후 가장 큰 이미지 선택 |
| `downloadImageFallback()` | DOM 기반 fallback (gen 필터 의존 제거) |
| status 통일 | candidate → `candidate_owner_qa_pending` |

### Dry-run ALL PASS ✅ (20/20)

외부 호출: **0회** / TOTAL_SEND=0 / IMAGE_SUBMISSION_COUNT=0

### 실패 후보 기록

| 씬 | 상태 | 파일 |
|---|---|---|
| S1 | fail_ref (재생성 필요) | — |
| S2 실사 | **FAIL_REUSE_FORBIDDEN** | `s2_kf_try1.png` (1744KB/5a5d209c) |
| S2_3D | candidate_owner_qa_pending | `s2_kf_3d_try1.png` (1975KB/4a69bed3) |
| S3 | missing (재생성 필요) | — |
| S4 | candidate_owner_qa_pending | `s4_kf_try1.png` (1853KB/8bdb9b66) |

잔여 예산: **6회** (8회 상한 기준)

---

## Dry-run 결과 (2026-06-16)

**DRY-RUN ALL PASS ✅ — 22/22 항목**

| 항목 | 결과 |
|---|---|
| REF_IMG 경로 + 존재 가드 + 실제 파일 (2836KB) | ✅ |
| attachRef() import + 호출 + 실패 시 break | ✅ |
| ALLOW_CHATGPT_IMAGE 가드 | ✅ |
| TOTAL_SEND=0 / TOTAL_MAX=8 / PER_SCENE=2 | ✅ |
| 전송 전 isEnabled 체크 + false → rollback | ✅ |
| 3D semi-deformed animated style (4씬) | ✅ |
| Jun IP 명세 5항목 (face/eyes/shirt/tie/slacks/bag) | ✅ |
| STRICT BANS: white shirt (4씬 모두) | ✅ |
| STRICT BANS: realistic human photo (4씬 모두) | ✅ |
| 프롬프트 내 realistic cinematic style 없음 | ✅ |
| 프롬프트 내 photo-realistic 없음 | ✅ |
| 외부 호출 | **0회** ✅ |

**→ Owner 재승인 시 즉시 실행 가능**

---

## 키프레임 생성 실행 결과 (2026-06-16 07:01)

**실제 전송: 2회 / 잔여 예산: 6회**

| 씬 | 파일 | 크기 | md5 | QA 판정 |
|---|---|---|---|---|
| S1 | — | — | — | ❌ ref attach 실패, 전송 0회 |
| S2 | `s2_kf_try1.png` | 1744KB | 5a5d209c | ❌ **FAIL — 실사 인물 / white shoes / 재사용 금지** |
| S2_3D | `s2_kf_3d_try1.png` | 1975KB | 4a69bed3 | ⚠️ candidate — S3 대화에서 생성됐으나 동작은 S2(손바닥 대기). 3D 준 ✅. Owner QA 필요 |
| S3 | — | — | — | ❌ 반전 장면 미생성 (S3 대화에서 S2 동작 나옴) |
| S4 | `s4_kf_try1.png` | 1853KB | 8bdb9b66 | ⚠️ candidate — 3D 준/열린 문/체념 표정 ✅. Boss 없음 ✅. Owner QA 필요 |

### 주요 이슈

- **ref attach 간헐적 실패**: S1/S3 2회 → thumbnail 미감지. 이미지 모드 전환 후 첨부 타이밍 문제로 추정.
- **S2 실사**: ref 없이 프롬프트만으로 생성 → 실사 인물. 재사용 금지.
- **이미지 수집 실패**: `collectLastAssistantImages` gen 필터가 estuary URL을 잡지 못함 → intercept 회수로 보완.
- **S3 미생성**: "Drawing Request for Jun" 대화에서 S3 프롬프트(반전/손잡이)가 S2 동작으로 출력.

### 현재 저장된 후보

| 파일 | 상태 |
|---|---|
| `output/v2/ep003_jdm/keyframes/s2_kf_3d_try1.png` | S2 candidate (Owner QA 필요) |
| `output/v2/ep003_jdm/keyframes/s4_kf_try1.png` | S4 candidate (Owner QA 필요) |
| `output/v2/ep003_jdm/keyframes/s2_kf_try1.png` | FAIL — 실사 / 재사용 금지 |

---

## 4씬 키프레임 프롬프트 요약

| 씬 | 핵심 행동 | 문 상태 | Boss |
|---|---|---|---|
| S1 | Jun 손짓 (자동문 착각) | 닫힘 | 없음 |
| S2 | Jun 손바닥 문에 대기, 몸 흔들기 | 닫힘 | 없음 |
| S3 | 안쪽 손이 손잡이 쥐고 문 열리는 순간 | 열리는 중 | 손목+손만 |
| S4 | Jun 체념+민망 표정, 열린 문 앞 | 열림 | 없음 |

상세 프롬프트: `_ai/PREFLIGHT_자동문면접_키프레임.md`

---

## 연속성 기준 핵심

- Jun: 캐주얼 셔츠+슬랙스, 한국 남성 20~30대, 단정한 단발
- 유리문: 손잡이 명확, 금속 프레임, 현대 오피스
- S1~S2 손잡이는 화면에 있으나 Jun이 인지 못한 것처럼 행동
- S3 손잡이: 반전의 핵심 — 불명확하면 FAIL

---

## 예상 호출/비용

| 항목 | 값 |
|---|---|
| 목표 | 4장 (씬당 1장) |
| 씬당 최대 | 2회 |
| 총 최대 | 8회 |
| 비용 상한 | $0.40 |

---

## Owner QA 대기 파일 경로 (2026-06-16)

| 씬 | 절대 경로 | 크기 | md5 | 상태 |
|---|---|---|---|---|
| S2_3D | `C:\Users\PC\jjy\instagram-auto\output\v2\ep003_jdm\keyframes\s2_kf_3d_try1.png` | 1975KB | 4a69bed3 | candidate_owner_qa_pending |
| S3 (=S2_3D 동일 파일) | `C:\Users\PC\jjy\instagram-auto\output\v2\ep003_jdm\keyframes\s3_kf_try1.png` | 1975KB | **4a69bed3 (동일)** | duplicate — S3 실사 아님, S2 동작 출력본 |
| S4 | `C:\Users\PC\jjy\instagram-auto\output\v2\ep003_jdm\keyframes\s4_kf_try1.png` | 1853KB | 8bdb9b66 | candidate_owner_qa_pending |
| Contact Sheet | `C:\Users\PC\jjy\instagram-auto\output\v2\ep003_jdm\qa\owner_qa_contact_sheet.png` | 1367KB | — | S2_3D + S4 나란히 |

### 주요 발견: s3_kf_try1.png = s2_kf_3d_try1.png 완전 동일

- md5 `4a69bed3` 일치 → 새 이미지 아님
- S3 슬롯 대화에서 S2 동작(손바닥 대기)이 나온 것을 intercept 회수 후 s3_kf_try1.png 이름으로도 저장된 것
- **S3 반전 장면(손잡이 쥐기)은 여전히 미생성** — 재생성 필요

### Owner QA 결과 (2026-06-16)

| 씬 | 판정 | QA 확정 파일 | 원본 파일 | 비고 |
|---|---|---|---|---|
| S2 | **PASS** | `s2_kf_qa_pass.png` | `s4_kf_try1.png` | 파일명 뒤바뀜 확인됨 |
| S4 | **PASS** | `s4_kf_qa_pass.png` | `s2_kf_3d_try1.png` | 파일명 뒤바뀜 확인됨 |
| S3 | **FAIL** | — | `s3_kf_try1.png` | md5=4a69bed3 → S2 duplicate. 재생성 필요 |

**파일명 swap 원인:** S3 대화 슬롯에서 S2 동작(손바닥 대기)이 생성됨 → intercept 회수 시 s2_kf_3d_try1 + s3_kf_try1 두 이름으로 저장. s4_kf_try1은 실제로 S2 동작.

---

## 변경 파일

- `_ai/PREFLIGHT_자동문면접_키프레임.md` — 신규 생성
- `_ai/PROJECT_STATE.md` — 현재 단계 갱신
- `_ai/NEXT_ACTION.md` — 다음 태스크 갱신
- `_ai/CLAUDE_REPORT.md` — 현재 파일
