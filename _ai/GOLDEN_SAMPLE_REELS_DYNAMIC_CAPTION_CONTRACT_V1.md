# Golden Sample Reels Dynamic Caption Contract v1 (2026-07-02)

Task: `creative-v2-flux2-selected-image-set-lock-and-caption-contract-v1`

기계 판독용 원본: `scripts/fixtures/golden_sample_reels_dynamic_caption_contract.v1.json`

## 1. Owner 요청 (원문)

> 요즘은 자막을 밑에 고정시키고 사용하지 않고 아래 링크의 영상처럼 사용한다. 이 방식으로 자막을 나오게 해줘.
> https://www.instagram.com/reel/DaRa298Smpy/?igsh=MTFrZXpyazg3YWdsbA==

위 링크는 **Owner 지정 스타일 reference로만 기록**한다. 이번 slice에서 Instagram/외부 브라우저 자동화는 수행하지 않았으므로 exact visual clone 계약이 아니며, 세부 톤은 Owner 시각 QA에서 보정한다.

## 2. 핵심 원칙

자막은 하단 받아쓰기 띠가 아니라 **음성 리듬의 시각화 레이어**다. 카드 = 정보의 주연(기존 card motion contract), 자막 = 발화의 그림자 — **말이 나올 때만, 말이 있는 곳에서, 짧게** 등장한다.

## 3. 규칙 요약

- **금지**: bottom-fixed subtitle bar / 긴 문장 하단 고정 / karaoke 전체 줄 고정 / full-width caption box / 2줄 이상 상시 노출 / TTS 무관 decorative bounce.
- **단위**: phrase/keyword-level, 1회 블록 1~5단어(어절). 강조 단어 1~2개만 색(앰버)/크기/weight 차별.
- **타이밍**: TTS word/phrase 타임스탬프 기반 — 진입 ±120ms, 강조 highlight ±80ms. 무발화 구간 caption 유지 금지.
- **위치**: active visual focus 근처 또는 lower-middle safe zone. 주제 오브젝트/활성 카드 가림 금지. 하단 15% 상시 점유 = fail.
- **모션**: pop/slide/scale/reveal 계열 0.15~0.35s, ease-out 진입/ease-in 퇴장 (card motion 표준 승계).
- **카드 우선순위**: 대형 카드 임팩트 순간 caption 신규 진입 금지(지배 모션 1개 원칙). checklist pop 구간은 항목 텍스트가 caption 겸임 — 중복 노출 금지.

## 4. Audit 게이트

- 0/2/5/10/15/20/26/30s 프레임 QA에서 caption overlap/타이밍/safe-area 확인.
- 대비비 4.5:1+ (backing 허용, band 형태 금지).
- phrase당 dwell 1.6s 이하 권장, 2.2s 초과는 사유 기록.
- 첫 2s에 hook caption이 dynamic style로 필수 등장.
- caption audit fail 1건 = 해당 render 후보 reject.

## 5. 다른 계약과의 관계

- `golden_sample_card_motion_contract.v1.json`: 검사 결과 **bottom-fixed subtitle 가정 없음 → 무수정 유지**. 본 계약은 caption 레이어 신설이며 카드 규칙 불변.
- `golden_sample_flux2_selected_image_set_lock.v1.json`: 씬별 safeAreaNote가 caption 배치 입력.
- 절대규칙 원문("caption as design element, not bottom subtitle only")과 정합. 충돌 시 절대규칙 > 본 계약 > card motion contract의 자막 표현.

## 6. 상태

`renderReady=false` / `uploadReady=false` 유지 — 이 계약은 설계 문서이며 render/TTS/mux/upload는 별도 Owner 승인 전 금지. 다음 render 단계는 본 계약을 필수 적용한다.
