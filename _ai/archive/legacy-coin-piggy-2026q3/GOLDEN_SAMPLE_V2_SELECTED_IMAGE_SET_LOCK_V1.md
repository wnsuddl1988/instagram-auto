# GOLDEN SAMPLE V2 — SELECTED IMAGE SET LOCK V1

- 작성일: 2026-07-02
- Task: `creative-v2-golden-sample-v2-selected-image-set-lock-v1`
- 주제: `월급이 3일 만에 사라지는 이유` (salary_3days)
- 원칙: Story-Causality First + Visual Evidence Second — 이미지는 스토리의 증거다
- Lock fixture (기계 검증용 canonical): `scripts/fixtures/golden_sample_v2_selected_image_set_lock.salary_3days.v1.json`
- 상태: **LOCKED_AS_RENDER_INPUT_CANDIDATE** — `renderReady=false`, `uploadReady=false` 유지. render/TTS/mux는 별도 Owner 승인 필요.

---

## 1. Lock 무결성 규칙 (다음 render slice 필수)

- 다음 render slice는 **시작 시 6장 전부의 path 실존 + width/height + fileSizeBytes + MD5를 lock fixture와 재검증**해야 한다.
- **하나라도 불일치하면 render를 시작하지 않고 abort**한다.
- 원본 이미지는 read-only 입력으로만 사용한다. 수정/이동/repo 복사 금지.
- s4/s6의 render 조건은 lock의 일부다 — 조건 미충족 render는 lock 위반이며 QA에서 reject된다.

## 2. Locked Image Set (6/6 native 1088x1936 gate PASS)

| scene | candidate | MD5 | risk | lock 형태 |
|---|---|---|---|---|
| s1 problem (빈 지갑) | s1_B | `8F1BBF1298BC672B7FD28268A9DC547A` | 액면 흐릿 잔존 → hook card+dim/blur로 사실상 비가독 | 일반 lock |
| s2 cause (방사형 유출) | s2_A | `BA70F0ED5EDB038F0C252EF746DFDCF4` | 상단 카드 가림, 하단 문양 수준 | 일반 lock |
| s3 illusion (섞인 더미) | s3_A | `2D82FD5F8873A944E01AB58813500D76` | 완전 비가독 (near-clean) | 일반 lock (무조건부) |
| s4 solution (3분할) | s4_A | `88CF9BE76626100C8A4BA6FA2324C180` | 밝은 배경, '100' FAINT~CLEAR 경계 | **조건부 lock** |
| s5 action (나누는 손) | s5_B | `77ADCD1DA5A651278B8A6AE6B4F20382` | 사선+카드 가림으로 흐릿 | 일반 lock |
| s6 result (해소) | **s6_P_A** | `A5B5A602828E1F9C9829AC6A8F5A1A83` | **raw clean 아님 — visible '2' 잔존** | **조건부 lock (card occlusion 필수)** |

- 이미지 경로/실측값/선정 사유/스토리 역할 전체는 lock fixture 참조.
- 파일 크기: s1 604,622 / s2 935,655 / s3 1,069,163 / s4 945,779 / s5 580,863 / s6 515,012 bytes.

## 3. s4 조건부 lock (필수 render 조건)

- **3-slot 카드(고정비/생활비/저축)가 stage cut 직후 즉시 진입해야 한다.**
- **background-only 노출 <= 0.3s.** 카드 없는 구간이 길어지면 우측 봉투 '100'이 CLEAR 경계까지 올라간다.

## 4. s6 조건부 lock (필수 render 조건 — 가장 중요)

- **s6_P_A는 raw clean 이미지가 아니다.** 접힌 최상단 지폐 면에 visible `2`(약 `x430~700, y1100~1230`)가 잔존하며, raw 단독 verdict는 `PATCH_STILL_NEEDED`였다.
- **card occlusion 조건에서만 채택된다** (`PASS_BY_CARD_OCCLUSION_PROBE`, checkpoint `fdc9187`):
  - final/save 카드 좌표: **`x200~880, y1080~1250`** (shiftV1, 텍스트 라인 y1122/fs56 기준)
  - **세로 slide entry 금지** — 이동 경로에서 '2' 노출 순간이 생김
  - **고정 위치 fade/scale-in 또는 동급 entry만 허용**
  - s6 stage cut 직후 카드 즉시 진입 (background-only <= 0.3s), 마지막 hold까지 카드 유지
- 근거: shiftV1에서 패널(76% 불투명)+카드 텍스트 이중 가림으로 2x zoom에서도 숫자 식별 불가, story evidence(3봉투/지갑+접힌 다발/밝은 해소 톤) 유지, 카드 점유 약 8%로 이미지 주연 원칙 훼손 아님. shiftV2(y1096~1236)는 상단 마진 4px로 sliver 위험 → 비채택.

## 5. Rejected alternatives (재사용 금지)

- **구 `s6_B`**: denomination probe에서 지폐 상단 **`5`가 viewer frame 중앙에서 선명히 읽혀 reject** (`PATCH_NEEDED`, checkpoint `3d6122d`).
- **`s6_P_B`**: **hard text/garbled letterforms** — 달러 유사 앞면 + 깨진 유사문자열 + 모서리 액면 (`REJECT_FOR_HARD_TEXT`, checkpoint `65527d9`).
- s1_A (브랜드 유사 문자+대형 액면), s4_B (깨진 글자), s6_A (봉투 실패+인장): 후보 vision QA hard reject.

## 6. Evidence chain

1. `29c7569` — FLUX2 12장 후보 생성 + vision QA (s1_B/s2_A/s3_A/s4_A/s5_B 선정)
2. `3d6122d` — denomination render probe (s6_B PATCH_NEEDED 판정)
3. `65527d9` — s6 FLUX2 패치 2장 (프롬프트 단독 억제 실패 실증, s6_P_A 확보)
4. `fdc9187` — s6 card occlusion reprobe (shiftV1 COVERED_NOT_READABLE, PASS_BY_CARD_OCCLUSION_PROBE)

- QA report 경로 4건은 lock fixture `evidenceReports` 참조.

## 7. 이 slice의 경계

- 이 lock은 이미지 입력 고정이다. **render/TTS/mux/upload 승인이 아니다.**
- FLUX2 실측 교훈 기록: '현금 주연 클로즈업'은 프롬프트만으로 액면 제거를 보장할 수 없다 (2회 연속 지시 무시 + 12장 전량 액면 렌더). 이후 유사 장면은 카드 가림/구도 설계를 처음부터 병행할 것.
