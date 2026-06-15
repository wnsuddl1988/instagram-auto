# QUALITY_GATE — Shorts Production

## Purpose

이 문서는 Codex와 Claude Code가 Owner에게 저품질 후보를 반복 노출하지 않기 위한 내부 품질 필터다.

기술적으로 만들어졌다는 이유로 PASS를 부여하지 않는다. Owner가 원하는 업로드 후보 품질에 도달하기 전에는 `candidate` 또는 `fail`만 사용한다.

## Absolute Rule

외부 호출 또는 생성 작업 전 아래 5개 계약이 모두 있어야 한다.

1. Event Contract
2. Dialogue Contract
3. Emotion / Voice Contract
4. Sound Contract
5. Stop-Loss Contract

하나라도 없으면 생성 금지.

## 1. Event Contract

각 씬은 초 단위 화면 사건을 먼저 정의한다.

필수 필드:
- time range
- visible action
- character emotional state
- object/state change
- allowed dialogue after this event
- forbidden dialogue before this event
- required SFX/BGM

FAIL 조건:
- 대사가 화면 사건보다 먼저 나옴
- 대사가 해당 화면 행동의 반응이 아님
- 화면을 보지 않고 대본만 읽어야 의미가 이해됨

## 2. Dialogue Contract

대사는 시간 안에 들어가는 것이 아니라 사건에 반응해야 한다.

필수 규칙:
- 원인 사건 이전의 결과 대사 금지
- 질문/당황/펀치라인은 화면 근거가 있어야 함
- 대사는 짧고 행동 단위로 배치
- 코미디에서는 한 문장 한 감정 원칙

FAIL 조건:
- "근데 왜 계속 나오지?"가 실제 추가 출력 전 나옴
- "한 장이라고."가 복사기가 말을 안 듣는 상황 전 나옴
- Boss 대사가 상사 손 행동 전 나옴
- 펀치라인을 대본 설명 없이 이해할 수 없음

## 3. Emotion / Voice Contract

좋은 목소리보다 역할 연기가 우선이다.

Jun:
- 당황, 초조, 짜증, 안도, 체념이 구간별로 들려야 함
- 단일톤 낭독 금지

Boss:
- 중후하고 느린 부장님 톤
- 웃는 듯하지만 은근히 눈치 주는 말투
- 고막남친/매끈한 좋은 목소리 금지

FAIL 조건:
- 감정 변화가 들리지 않음
- 캐릭터 역할과 음색이 맞지 않음
- 기술적으로 음성이 깨끗해도 연기가 안 되면 FAIL

## 4. Sound Contract

무대사 구간은 사운드 설계가 있어야 한다.

규칙:
- 3초 이상 무대사 구간은 SFX/BGM 또는 강한 화면 사건 필요
- 5초 이상 무대사 구간이 정적이면 FAIL
- SFX는 화면 행동과 동기화
- 대사 구간은 ducking 적용

FAIL 조건:
- 긴 정적 무음 구간
- SFX가 행동과 무관함
- SFX가 대사를 방해함

## 5. Stop-Loss Contract

모든 유료/외부 호출 전 중단 기준을 작성한다.

필수 필드:
- call count
- max cost/credits
- exact success criteria
- fail criteria
- no-auto-retry rule
- next action if failed

FAIL 조건:
- 실패 이유 분석 없이 재시도
- "괜찮아 보임"으로 넘어감
- Claude Code가 warning을 PASS로 둔갑

## QA Labels

사용 가능한 PASS 라벨:
- `technical_pass`: 해상도, 길이, 파일, 오디오 등 기술 조건만 통과
- `automation_pass`: 스크립트/preflight가 안전하게 동작
- `event_contract_pass`: 생성 전 사건-대사-감정-사운드 계약 통과
- `candidate_ready_for_owner`: 내부 필터를 통과해 Owner가 볼 가치 있음
- `owner_pass`: Owner가 최종 승인

금지:
- Owner 확인 전 `final_pass`
- 기술 QA만으로 `video_pass`
- Claude 자체 판단만으로 `quality_pass`

## Error Handling

오류 발생 시 반드시 다음을 보고한다.

1. What failed
2. Expected behavior
3. Actual behavior
4. Likely root cause
5. Evidence file/log/screenshot
6. Why retry will or will not help
7. Next safe action

원인 분석 없이 같은 명령 또는 같은 생성 호출을 반복하지 않는다.

