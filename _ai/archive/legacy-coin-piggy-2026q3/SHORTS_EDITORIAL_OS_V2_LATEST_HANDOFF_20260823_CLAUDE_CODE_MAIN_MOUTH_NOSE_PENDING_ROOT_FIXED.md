# SHORTS EDITORIAL OS V2 / 경제번역소
## LATEST CONTROL TOWER HANDOFF — CLAUDE CODE MAIN / A1 MOUTH+NOSE IDENTITY LOCK PENDING

### 기준 시점
2026-08-23

### 문서 지위
이 문서는 2026-08-20 `SHORTS_EDITORIAL_OS_V2_LATEST_HANDOFF_20260820_A1_IDENTITY_LOCK_PENDING.md` 이후
Owner + ChatGPT + Codex가 실제로 수행한 A-1 Character Lab 작업과 최신 역할 변경을 반영한
**현재 최우선 Control Tower source of truth**다.

우선순위:
1. 이 문서
2. 이 문서 이후 Owner의 명시적 최신 지시
3. 기존 2026-08-20 handoff 중 본 문서에서 supersede하지 않은 영구 규칙
4. 그 외 과거 handoff / `_ai/PROJECT_STATE.md` / 이전 대화 요약 / 오래된 model memory

충돌 시 위 순서를 따른다.

---

# 0. 최신 역할 변경 — Owner 확정

```text
PROJECT:
Shorts Editorial OS V2 / 경제번역소

OWNER:
사용자

CHATGPT:
Control Tower
최종 visual / motion / audio / product gate

CLAUDE CODE:
MAIN TECHNICAL IMPLEMENTATION AI
다음 승인 Slice부터 단독 Main으로 실행

CODEX:
PAUSED AS IMPLEMENTATION AI
Owner 또는 ChatGPT가 명시적으로 요청할 때만
independent read-only cross review

PARALLEL MAIN EDITING:
FORBIDDEN
Claude Code와 Codex가 같은 blend/script를 병렬 수정하면 안 됨
```

Claude Code는 기술 구현 담당일 뿐 visual/product PASS authority가 아니다.
Claude self-report PASS는 Owner + ChatGPT Human Gate를 대체하지 못한다.

---

# 0.1 Main repository / Character Lab workspace distinction — LOCKED

```text
MAIN_PROJECT_ROOT:
C:\Users\PC\jjy\instagram-auto

CLAUDE_CODE_LAUNCH_DIRECTORY:
C:\Users\PC\jjy\instagram-auto

CHARACTER_LAB_WORKSPACE:
C:\Users\PC\jjy\character-lab\A1_ECONOMY_HELPER

CURRENT_SLICE_WRITE_SCOPE:
CHARACTER_LAB_WORKSPACE ONLY

MAIN_REPOSITORY_ACCESS_FOR_CURRENT_SLICE:
READ-ONLY
```

`instagram-auto`가 Shorts Editorial OS V2의 실제 메인 프로젝트 repository다.
`character-lab\A1_ECONOMY_HELPER`는 캐릭터 제작용 별도 로컬 작업공간이며, 독립 메인 프로젝트로 취급하지 않는다.

Claude Code는 `instagram-auto`에서 시작해 다음을 먼저 읽는다:
- repository-level `CLAUDE.md` / `AGENTS.md` 등 적용 가능한 프로젝트 규칙
- `_ai` 아래 최신 handoff / project state
- 현재 Shorts Editorial OS V2 코드베이스 상태

그 후 현재 Slice의 Blender 입력·출력만 `character-lab\A1_ECONOMY_HELPER`에서 수행한다.
현재 Slice에서는 `instagram-auto` 파일을 수정하지 않으며, character-lab을 repository 내부로 이동하거나 새 프로젝트로 재구성하지 않는다.

Claude Code가 외부 Character Lab 경로 접근 권한을 요구하면 Owner가 위 exact path만 추가 허용한다.
Codex와 Claude Code의 병렬 write는 계속 금지다.

---

# 1. 프로젝트 영구 품질 원칙

- 절대 대충 통과시키지 않는다.
- 속도보다 완성도와 실제 시각 검증을 우선한다.
- 기술 수치가 좋아도 실제 A-1처럼 안 보이면 FAIL.
- AI self-report는 참고 자료일 뿐 최종 PASS가 아니다.
- 첫 verdict는 반드시 `PASS / NEEDS_FIX / BLOCKED`.
- 원본 A-1 패널만 유일한 visual authority다.
- A-2/A-3 요소 혼합 금지.
- Coin / AccuRIG / V4 visual 경로 복구 금지.
- commit / push / deploy / publish는 Owner 별도 승인 전 금지.
- 유료 도구 / 유료 크레딧 금지.

---

# 2. 현재 캐릭터 / 기술 authority

```text
ACTIVE_CHARACTER:
A-1 BASIC ECONOMY HELPER / A-1 베이직 경제 도우미

SOLE_VISUAL_AUTHORITY:
C:\Users\PC\jjy\character-lab\A1_ECONOMY_HELPER\00_reference\
A1_VISUAL_REFERENCE.png

NATIVE_BLENDER_RIG:
PASS / LOCKED

V3_SOFT_DEFORMATION_FOUNDATION:
PASS / LOCKED

ACCURIG:
DROPPED / DO NOT RETRY

MIXAMO:
NOT AUTHORIZED

FREEMOCAP:
NOT AUTHORIZED

ACTION_LIBRARY:
NOT AUTHORIZED

FULL_PRODUCTION:
BLOCKED
```

---

# 3. 최신 A-1 Identity 진행 상태

## 3.1 양쪽 눈 — PASS / LOCK

Owner + ChatGPT Human Gate 결과:

```text
LEFT_EYE:
PASS / LOCKED

RIGHT_EYE:
PASS / LOCKED

BOTH_EYE_IDENTITY:
PASS / LOCKED
```

양쪽 눈은 원본 A-1의 각 눈 픽셀을 독립적으로 사용한 source-preserving neutral appearance,
single shallow-convex surface, corrected head-surface placement 구조다.

절대 수정 금지:
- eye geometry
- topology
- transform
- position
- orientation
- depth
- UV
- source RGBA
- alpha
- shader
- scale
- parent
- material assignment

Locked eye digests:

```text
LEFT_EYE_DIGEST:
dde2d9e6318e220600a9f70c09bb51481ac9fc7d3fdf585319c1d64df94a3677

RIGHT_EYE_DIGEST:
46b2580c7b2d1185950682af743498c4b474036ca151029762fafc9762b3ce2d
```

## 3.2 Rig digest — LOCK

```text
RIG_DIGEST:
a155a7e8c9ae4972f0417ec9098948a82f25c83514678973b92d65c6bd430d73
```

## 3.3 Full Face Reconciliation V1 결과

Source / latest completed blend:

```text
C:\Users\PC\jjy\character-lab\A1_ECONOMY_HELPER\01_blender\
A1_ECONOMY_HELPER_FULL_FACE_IDENTITY_RECONCILIATION_V1.blend
```

SHA-256:

```text
28A11BD25BF9A7E608202A16416A13D18134E46B24F64F206AE7634A95BA7BFC
```

Latest verdict:

```text
A1_FULL_FACE_IDENTITY_RECONCILIATION_V1:
NEEDS_FIX / BLOCKED_FULL_FACE_IDENTITY_CONVERGENCE
```

Accepted / locked for the next Slice:
- both eyes
- head base geometry / current front silhouette
- brows
- cheeks
- tuft
- skin material
- camera
- lighting
- body
- armature / rest bones / IK/FK

Current head contour evidence:
- head contour IoU approximately `0.9872`
- width/height ratio delta approximately `0.00146`

Current primary blockers:
1. mouth opening is too large and upper corners read V-shaped
2. nose became too small / visually disappears

The previous attempt to compact the mouth by deforming/compressing the head caused central head pinching.
That method is permanently rejected.

---

# 4. Current milestone / pending execution

```text
CURRENT_MILESTONE:
A1_MOUTH_NOSE_IDENTITY_LOCK_V1

CURRENT_MAIN_AI:
CLAUDE CODE

CURRENT_PENDING_STATUS:
PROMPT PREPARED / NOT YET EXECUTED BY CLAUDE CODE

SOURCE_BLEND:
A1_ECONOMY_HELPER_FULL_FACE_IDENTITY_RECONCILIATION_V1.blend

TARGET_BLEND:
A1_ECONOMY_HELPER_MOUTH_NOSE_IDENTITY_LOCK_V1.blend
```

This Slice may modify ONLY:
- mouth opening / local mouth architecture
- mouth cavity
- tongue
- nose

This Slice must NOT modify:
- left eye
- right eye
- head base geometry / front silhouette
- brows
- cheeks
- tuft
- skin
- camera
- lighting
- body
- armature hierarchy
- rest bone positions
- rest bone lengths
- IK/FK

---

# 5. Required architecture for current Slice

## Mouth

Do not globally deform or compress the head.

Use a local canonical mouth aperture / pocket:

```text
canonical source mouth contour
→ local fitted aperture / patch
→ smooth skin-colored transition
→ true recessed cavity
→ tongue seated inside
```

Requirements:
- smaller / more compact than current mouth
- rounded organic upper corners
- no V-shaped symbol
- no head pinching
- no visible seam
- no flat black sticker
- canonical subtle upper inner light arc only
- no invented large teeth

## Tongue

- smaller
- lower in cavity
- rounded
- warm coral / salmon
- subordinate to cavity

## Nose

- restore canonical small rounded 3D button nose
- clearly present but low contrast
- warm beige / peach
- no dot
- no oversized detached sphere
- surrounding head geometry remains unchanged

---

# 6. Claude Code takeover protocol

Claude Code’s first action is a read-only takeover audit.

Audit:
1. canonical A-1 reference exists and is readable
2. source blend exists
3. source blend SHA matches
4. both eye digests match
5. rig digest matches
6. current camera/light/body/locked objects can be fingerprinted
7. no unrelated project or `ianpapa-content-director` rules are applied

If audit passes:
- do NOT ask Owner for another approval
- automatically continue into `A1_MOUTH_NOSE_IDENTITY_LOCK_V1`
- use script-first / headless Blender
- no intermediate progress response
- maximum Build 1 + correction Build 2
- return only final review package or a genuine blocker

If audit fails:

```text
BLOCKED_CLAUDE_TAKEOVER_STATE_MISMATCH
```

and report exact mismatch evidence.

Session/tool exhaustion is not an architecture blocker.
Use:

```text
EXECUTION_SESSION_LIMIT_REACHED
```

after saving all current work.

---

# 7. Evidence / return requirements

Required outputs:
- new target blend
- deterministic build script
- reference spec
- front render
- canonical comparison
- overlay
- before/after
- full-face context
- mouth closeup
- nose closeup
- mouth contour comparison
- tongue contour comparison
- validation JSON

Required protected-state checks:
- left eye digest before/after equal
- right eye digest before/after equal
- head base geometry digest before/after equal
- rig digest before/after equal
- camera/light/body unchanged
- brows/cheeks/tuft/skin unchanged

Successful technical return begins:

```text
ROUTING_DECISION:
A1_MOUTH_NOSE_IDENTITY_LOCK_V1_AWAITING_OWNER_CHATGPT_REVIEW
```

If Build 2 still fails first-glance A-1 mouth/nose identity:

```text
BLOCKED_MOUTH_NOSE_IDENTITY_CONVERGENCE
```

Claude Code must not self-declare FACE PASS or IDENTITY LOCK.

---

# 8. What remains blocked until Full Face Identity PASS

Do not proceed to:
- body proportion rebuild
- hoodie
- hands
- sneakers
- finger rig
- facial animation rig
- lip sync
- Mixamo
- FreeMoCap
- Action Library
- presenter acting proof
- 20-second proof
- 50–60-second proof
- Scene01–08 rebuild
- commit / push / deploy / publish

After Owner + ChatGPT issue:

```text
FACE_IDENTITY = PASS / LOCK
```

only then may the project move to body / hoodie / hands / sneakers identity.

---

# 9. New ChatGPT Control Tower behavior

A new ChatGPT chat must:
1. use this handoff as current highest source of truth
2. recognize Claude Code as Main technical implementation AI
3. keep Codex paused
4. not replan from scratch
5. not reopen locked eyes
6. recognize current next Slice as `A1_MOUTH_NOSE_IDENTITY_LOCK_V1`
7. review actual uploaded PNG/MP4, not AI self-report
8. begin verdict with `PASS / NEEDS_FIX / BLOCKED`
9. keep body/motion blocked until full face identity PASS
10. preserve Owner’s “절대 대충하지 않음” rule

===== END LATEST HANDOFF =====
