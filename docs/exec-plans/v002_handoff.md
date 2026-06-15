# v002 — AI 3D Character Continuity Pilot · Codex 인계

작성: 2026-06-14 / 실행: Claude Code

## 1. 생성·수정 파일

### 신규 스크립트
- `scripts/_v002-ref-image.mjs` — GPT 웹 기준 이미지 시트 생성(코믹 세미데포르메 3D). content-id 신규 감지, 1회 호출, 자동 재시도 없음.
- `scripts/_v002-veo-scene.mjs` — Gemini Veo 장면 생성. reference 첨부(filechooser 가로채기, OS 선택창 미표시) + 9:16 강제 + 프로필 failover + 한도/거부/셀렉터/첨부/다운로드 실패 구분. 씬당 1회, 자동 재제출 없음. 동영상 안내 팝업("사용해 보기") 선처리 포함.
- `scripts/_v002-qa-contactsheet.mjs` — ffprobe 메타 + 대표 프레임 + contact sheet + 스코어카드(생성 없음).
- `scripts/_v002-veo-diag-attach.mjs` — 첨부 UI 진단 전용(생성 없음).
- `scripts/_v002-veo-recover.mjs` — 이미 생성된 영상 다운로드만(재제출 없음, 한도 미소비).

기존 psychology/investment 스크립트·자산은 미수정. 앱 계약 변경 없음(pnpm build 미실행 — 지시서 §8 준수).

## 2. 호출 횟수 (정확)

### 이미지 (총 2회 — 계정별 별개 한도)
- GPT-1: 1회 — 사실형(8등신) 생성 → **폐기**(`reference/_discarded_realistic/`). 새 스타일 지시 전 생성분.
- GPT-2: 1회 — 코믹 세미데포르메 생성 → **채택**(`ref_selected.png`).

### Veo (제출 정확히 3회 = 한도 내)
| 씬 | 제출 프로필 | 결과 | 비고 |
|----|------------|------|------|
| S1 | Gemini-1 | 제출 안 됨(한도 사전감지) → Gemini-2 재시도 | Gemini-1 한도 reset 6/14 20:10. **제출 미소비** |
| S1 | Gemini-2 | ✅ 저장 | filechooser 첨부 수정 후 성공 |
| S2 | Gemini-3 | ✅ 저장 | 정상 |
| S3 | Gemini-4 | 제출 안 됨(동영상 도구 메뉴에 항목 없음) | **제출 미소비**. Gemini-4 계정은 Omni 동영상 기능 미제공(메뉴=파일업로드/Drive만) |
| S3 | Gemini-2 | 전송 성공 후 **다운로드 실패** | 생성 대기 216s 중 Chrome 창이 닫혀 크래시. 회수 시도했으나 빈 새 대화로 이동돼 회수 실패 |

→ **제출 총 3회 = S1(Gemini-2) + S2(Gemini-3) + S3(Gemini-2)**. 한도 초과 없음. 자동 재시도 없음.

## 3. 계정/프로필 상태 & failover
- Gemini-1: 동영상 한도 도달(reset 6/14 20:10). 사전 감지로 제출 미소비 failover.
- Gemini-2: 정상. S1·S3 제출(동영상 기능 있음).
- Gemini-3: 정상. S2 제출.
- Gemini-4: **동영상(Omni) 기능 메뉴에 없음** — 계정/구독 차이 추정. failover로 우회.
- GPT-1/GPT-2: 정상, 각 1회 이미지 생성.

## 4. 프롬프트 & reference
- reference 프롬프트 원문: `reference/ref_prompt_attempt1.txt` (채택본은 GPT-2 코믹 세미데포르메)
- 채택 reference: `output/v2/continuity_pilot_3d_v1/reference/ref_selected.png`
- 씬 프롬프트·제출 메타: `veo/scene_0N_submission.json`

## 5. 클립 경로 & 기술 메타 (ffprobe)
| 씬 | 경로 | 메타 |
|----|------|------|
| S1 | `veo/scene_01.mp4` | h264, **720×1280(9:16)**, 24fps, 10.0s |
| S2 | `veo/scene_02.mp4` | h264, **720×1280(9:16)**, 24fps, 10.0s |
| S3 | (없음) | 전송됨, 다운로드 실패 |

전체 메타: `qa/ffprobe_report.json`

## 6. Contact sheet & 스코어카드
- `qa/contact_sheet.png` (S1·S2 각 3프레임)
- `qa/scorecard.json` (템플릿)

## 7. 품질 평결: **CONDITIONAL PASS**

확보된 **S1↔S2 2개 장면의 연속성은 우수**:
- 얼굴/헤어/의상색(하늘색 셔츠+빨간 타이)/체형(세미데포르메)/사무실 세트/조명·재질 모두 일관 ✅
- 손가락 정상, 무음 액션 가독성 양호(S1 가방챙김→시계, S2 서류등장→당황) ✅
- 2D/실사 드리프트 없음, 코믹 3D 톤 유지 ✅
- 9:16 세로, 기술 유효 ✅

**conditional 사유**: 3장 중 2장만 확보. 3장 전체에 걸친 완전한 연속성(특히 S3 단호한 거절 payoff)은 미검증. 하지만 reference 기반 image-to-video 방식이 **2장 연속 일관성을 명확히 입증**함.

## 8. 구체적 결함/리스크
- S3 다운로드 유실: 생성 대기 중 브라우저 창이 닫히면 크래시 → 다운로드 실패. **개선책: 생성 대기 중 창 종료 방지 + 회수 스크립트가 사이드바 최근 대화로 정확히 이동하도록 보강 필요.**
- Gemini-4 동영상 기능 부재: 4계정 균등 failover 가정이 깨짐. 가용 동영상 프로필은 사실상 1·2·3.
- 클립 해상도 720×1280: 9:16이지만 1080×1920 미만. 업스케일/고해상 옵션 검토 필요(이번 한도 테스트엔 무관).

## 9. 3D 소프트웨어 구매 없이 진행 가능한가? — **잠정 YES (조건부)**
- 현재 무료 웹 툴 조합(GPT 이미지 reference + Gemini Veo image-to-video)만으로 **귀엽고 코믹한 세미데포르메 3D 캐릭터의 장면 간 연속성이 실제로 유지됨**을 2장으로 확인.
- 즉 Character Creator/iClone/Unreal 구매 없이도 연속성 파일럿은 성립. 다만 ① 3장 완주 재현성 ② 한도 운영(동영상 가용 프로필 3개) ③ 해상도가 남은 검증 과제.

## 10. 권장 다음 액션 (구현 아님 — 권고만)
- S3 1장만 재생성하여 3장 완성 → 3장 contact sheet로 완전 연속성 재판정. (Veo 한도 회복 후, 가용 프로필 2·3, 회수 로직 보강 전제)
- 통과 시: 최종 캐릭터/세트 바이블 확정 + 에피소드 스키마 설계로 진행.

— 인계 끝. TTS/완성본/업로드 미실행(지시서 준수). 다음 작업은 지시 전까지 시작하지 않음.
