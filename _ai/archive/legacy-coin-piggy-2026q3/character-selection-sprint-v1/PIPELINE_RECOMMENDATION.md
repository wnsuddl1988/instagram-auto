# PA-5Y Pipeline Recommendation — HYPOTHESIS_ONLY

## 공통 판단 기준

pipeline은 후보의 concept-art 매력을 실제 출력에서 지킬 수 있어야 한다. 자동화 편의만으로 선택하지 않는다. 모든 후보는 아래를 future proof에서 확인한다.

- 하드락: 실루엣, 눈·눈썹·입 위치, 비율, 팔레트, signature prop의 형태
- 3/4에서도 유지되는 얼굴 읽기와 손·소품 분리
- 9:16 small-size에서 읽히는 외곽선과 제한된 내부 정보
- 표정 교체가 얼굴 정체성을 파괴하지 않는지

## CANDIDATE_COIN

| 방식 | 예상 시각 충실도 | 예상 연기 품질 | 구현·자동화성 | 주요 실패 모드 | concept appeal 생존 판단 |
| --- | --- | --- | --- | --- | --- |
| A. Blender full/mostly-3D | 중간 | 중간 | 중간 | 과도한 금속 PBR과 둥근 limb가 toy look을 만든다. | 불확실; 스타일 제약 없이는 낮아진다. |
| B. Blender NPR/toon | 높음 | 높음 | 중간 | 외곽선·림라이트가 프레임마다 흔들리거나, 옆면 두께가 과장된다. | 유망하다. |
| C. 2D/2.5D rig | 높음 | 높음 | 중간 | 원형 몸체의 회전·손 겹침이 평면적으로 보일 수 있다. | 유망하나 3/4 연기 범위 확인 필요. |
| D. Hybrid 3D + 2D facial/graphic layers | 가장 높음 | 높음 | 중간 | 3D 원형과 2D 얼굴의 perspective 불일치 | 잘 설계되면 가장 잘 유지될 가능성. |

- `PRIMARY_PIPELINE_HYPOTHESIS`: **Hybrid 3D + 2D facial/graphic layers**. 3D는 원형 두께·회전·손 위치에 한정하고, 얼굴·그래프·미세 표정은 2D 레이어로 유지한다.
- `SECONDARY_PIPELINE`: **Blender NPR/toon**. 재질을 매트하고 그래픽적으로 제한하며, 고광택 금속을 피한다.
- `PIPELINES_NOT_RECOMMENDED`: full/mostly-3D PBR. 현재 목표인 2D/2.5D 생동감보다 피규어 인상을 강화할 가능성이 높다.

## CANDIDATE_STATEMENT

| 방식 | 예상 시각 충실도 | 예상 연기 품질 | 구현·자동화성 | 주요 실패 모드 | concept appeal 생존 판단 |
| --- | --- | --- | --- | --- | --- |
| A. Blender full/mostly-3D | 낮음 | 중간 | 낮음 | 종이의 말림·두께·하단 형태가 실제로는 어색하거나 무겁게 보인다. | 낮음. |
| B. Blender NPR/toon | 중간 | 중간 | 낮음 | 종이 form과 line/face가 3/4에서 흔들리고 lookdev 반복비가 커진다. | 조건부. |
| C. 2D/2.5D rig | 가장 높음 | 높음 | 높음 | 과한 skew 변형이 영수증 정체성을 망치고 글자가 깜빡일 수 있다. | 가장 유망하다. |
| D. Hybrid 3D + 2D facial/graphic layers | 높음 | 높음 | 중간 | 얕은 종이 volume과 2D 면의 경계가 부자연스러울 수 있다. | 유망하나 필요 최소화가 중요. |

- `PRIMARY_PIPELINE_HYPOTHESIS`: **2D/2.5D rig**. 종이의 곡률은 제한된 plane deformation으로, 얼굴·팔·소품·항목 아이콘은 독립 파츠로 운용한다.
- `SECONDARY_PIPELINE`: **Hybrid**. 회전이 필요한 경우에만 얕은 3D 종이 곡면을 쓰고, 얼굴·정보 그래픽은 2D로 고정한다.
- `PIPELINES_NOT_RECOMMENDED`: full/mostly-3D 및 NPR 단독. paper-body의 3/4 fidelity 리스크를 정면 돌파할 근거가 아직 없다.

## CANDIDATE_DECODER

| 방식 | 예상 시각 충실도 | 예상 연기 품질 | 구현·자동화성 | 주요 실패 모드 | concept appeal 생존 판단 |
| --- | --- | --- | --- | --- | --- |
| A. Blender full/mostly-3D | 중간 | 중간 | 높음 | 버튼·화면·매끈한 모서리가 앱/토이 인상을 고착시킨다. | 낮음~중간. |
| B. Blender NPR/toon | 중간~높음 | 중간 | 중간 | toon 처리만으로 기기라는 구조적 인상을 해결하지 못한다. | 조건부. |
| C. 2D/2.5D rig | 높음 | 중간~높음 | 높음 | 얕은 원근에서 box body가 납작한 UI 카드처럼 보일 수 있다. | 유망하다. |
| D. Hybrid 3D + 2D facial/graphic layers | 높음 | 높음 | 높음 | UI 레이어가 캐릭터 연기보다 먼저 읽히는 문제 | 재설계가 통과하면 유망하다. |

- `PRIMARY_PIPELINE_HYPOTHESIS`: **Hybrid 3D + 2D facial/graphic layers**. 3D는 모서리·회전의 최소 volume만 담당하고, 눈·입·경제 해석 아이콘은 그래픽 레이어로 통제한다.
- `SECONDARY_PIPELINE`: **2D/2.5D rig**. 3D 실루엣이 토이화될 경우 더 적절한 탈출 경로다.
- `PIPELINES_NOT_RECOMMENDED`: full/mostly-3D PBR. baseline의 약점을 반복할 확률이 높다.

## 구현 전 파츠·rig 요구사항

| 후보 | Blender/NPR을 선택할 때 | 2D/2.5D를 선택할 때 |
| --- | --- | --- |
| COIN | front/3Q 얼굴 보드, 독립 눈·눈썹·입 blend shape, 팔 IK, glove/prop socket, matte toon ramp, 낮은 specular | 앞·3/4 몸체, 눈·눈썹·입 6표정, 팔·손 5포즈, coin rim 분리, dashboard/계산 소품 2종 |
| STATEMENT | 얕은 paper curvature control, 별도 얼굴 plane, 팔 IK, 하단 edge control, tiny text 제거, line 안정화 | body front/3Q 파츠, 상단 curl/하단 tear control, 얼굴 6표정, arm/hand, 항목 아이콘은 가짜 text 대신 pictogram |
| DECODER | body bevel 제한, 화면과 얼굴 분리, 팔 IK, UI emissive 최소화, toon outline, screen-free silhouette test | 본체·화면·얼굴·팔·다리·panel 분리, 6표정, 최소 경제 아이콘, 3/4용 변형 파츠 |

위 선택은 설계 가설이며, Stage 3의 실제 motion proof 전에는 확정 pipeline이 아니다.
