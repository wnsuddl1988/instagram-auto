/**
 * 부엉이 쇼츠 조립 스펙 — 10장면(오프닝 포함)의 영상·나레이션·오버레이를
 * 한곳에서 정의한다.
 *
 * 9편 출처: 카드론·현금서비스 이용이 신용평가상 위험 신호로 분류되는 구조.
 * 팩트체크 결과(2026-09-20) "카드론 쓰면 몇 점 하락한다"는 공식 수치는
 * NICE·KCB·금융감독원 어디에도 없어 정성적 표현("위험 신호로 평가되어
 * 부정적 영향을 줄 수 있다")으로 처리하고, 확정 수치는 금융감독원 발표
 * 통계(2026년 상반기 카드론 이용액 28조원, 전년 동기 대비 20.9% 증가)만
 * 사용한다. 회복 기간·정확한 하락폭 같은 미검증 수치는 대본에 넣지 않는다.
 *
 * 소재 선정 경위: Owner가 "최근 부동산·투자 쪽에 너무 치우쳤다"고 지적,
 * 소비자/생활경제 분야로 방향 전환. 카드론/현금서비스가 신용점수를 깎는
 * 구조는 정책·제도 로직 기반이라 재고 제작에 적합(시점이 지나도 안 틀림).
 *
 * 현실적 대안 씬 신설(2026-09-20 Owner 요청): "그럼에도 카드론이 필요한
 * 사람이 돈을 급하게 구할 수 있는 현실적인 방안"을 넣어달라는 요청에 따라
 * s8_alternative 장면을 신설(9씬→10씬으로 확장). 특정 대출상품명·금리를
 * 확정 수치로 못박지 않고 "서민금융진흥원 통합 상담(1397)에 먼저 확인해볼
 * 수 있다"는 정성적 안내로 처리해 사실관계 위험을 낮췄다.
 *
 * 씬 길이 압축(2026-09-20): 문자수 기반 사전 추정에서 4개 씬(구 s4, s5, s7,
 * 신설 s8)이 10초를 초과할 것으로 예상되어 대본 확정 전 압축. TTS 실측
 * 결과 전 씬 10초 이내 확인(최장 s1 7.913초, 총 66.28초).
 *
 * 배경: 은행 창구/모바일뱅킹 앱 UI가 크게 뜬 공간 — 1~8편(사무실/거실/
 * 증권사 상담 라운지/홈트레이딩 데스크/증권사 트레이딩룸)과 겹치지 않는
 * 새 배경.
 *
 * closing_disclaimer는 스펙에 넣지 않는다(3편부터 확정) — 마지막 action 장면에서
 * 바로 끝내고 고정 CTA 클립(밝은 톤, follow+teaser)을 조립 단계에서 이어붙인다.
 *
 * 설계 원칙(6~8편에서 확정, 계승):
 *   - narration은 TTS 확정본과 정확히 동일해야 한다 — 대본-음성-자막 불일치 방지.
 *   - 이미지에 정보를 직접 그려 넣는 방식 + 오버레이 병행(화살표·강조 문구).
 *   - 좌표는 1080x1920 기준. 소스가 720x1280이므로 조립 시 업스케일한다.
 *   - 안전영역: _ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md §3.1 — 금지구역
 *     y 0~150, y 1600~1920, x 900~1080.
 */

export const OWL_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "owl_assembly_spec_v1",
  sourceCandidate: "candidate-final-cardloan-credit-score",
  title: "카드론·현금서비스가 신용점수를 깎는 구조",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  headerTitle: ["카드론·현금서비스", "신용점수 위험신호"],

  instagramCaptionHook: "급할 때 쓰는 카드론이랑 현금서비스, 사실 신용점수에 위험 신호로 찍힌다는 거 알아?",
  instagramCaptionPoints: [
    "카드론·현금서비스는 담보 없는 고금리 대출이라 이용 자체가 상환 능력 부족 신호로 평가돼",
    "올해 상반기 카드론 이용액만 28조원, 작년보다 20.9% 늘었어",
    "핵심은 반복해서 자주 쓰는 습관 — 신용평가사 입장에선 물음표가 쌓이는 거야",
    "무작정 참을 필요는 없어, 서민금융진흥원 1397로 먼저 확인해보자",
  ],
  instagramPriorityTags: ["카드론", "신용점수", "현금서비스", "생활경제", "재테크"],

  // 자막 강조색이 적용될 이 편의 핵심 용어·출처 기관명. 배열의 첫 항목
  // (카드론)은 이 편의 대표 주제어로, 조립기가 한 자막 줄의 강조 슬롯이
  // 숫자로 다 찼어도 항상 우선 강조한다.
  emphasisTerms: ["카드론", "현금서비스", "신용점수", "서민금융진흥원", "부엉박사"],

  render: Object.freeze({
    width: 1080,
    height: 1920,
    fps: 24,
    videoCodec: "libx264",
    crf: 18,
    pixFmt: "yuv420p",
    audioCodec: "aac",
    audioBitrate: "192k",
    audioSampleRate: 48000,
    audioChannels: 1,
  }),

  scenes: Object.freeze([
    {
      scene: 1,
      key: "s1_opening",
      role: "opening",
      video: "owl_ep9_s1_opening_motion.mp4",
      narration: "안녕, 난 매일 경제 뉴스를 콕 집어 전해주는 부엉박사야! 오늘은 카드론이 신용점수 깎아먹는 얘기해볼게.",
      imageBrief:
        "부엉이가 정면을 보며 인사하듯 한쪽 날개를 살짝 드는 포즈, 확신에 찬 진지한 " +
        "표정 — 웃지 않되 신뢰감 있는 눈빛. 배경에 대형 모바일뱅킹 앱 화면이나 은행 " +
        "안내 스크린을 배치해 오늘 주제를 예고. 배경: 은행 창구/모바일뱅킹 앱 UI가 " +
        "크게 뜬 공간(1~8편에 없던 새 배경). 특정 은행명·상품명 없음.",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_hook",
      role: "hook",
      video: "owl_ep9_s2_hook_motion.mp4",
      narration: "급할 때 쓰는 카드론이랑 현금서비스, 사실 신용점수에 위험 신호로 찍힌다는 거 알아?",
      imageBrief:
        "부엉이가 스마트폰 화면을 한 날개로 들어 보이며 놀란 듯 확신에 찬 표정으로 " +
        "정면을 응시하는 자세 — 웃지 않음. 화면에는 '카드론', '현금서비스' 아이콘과 " +
        "작은 빨간 경고 아이콘을 명확히 그려 넣는다. 배경: 앞 장면과 동일한 은행 공간.",
      overlays: [],
    },
    {
      scene: 3,
      key: "s3_loss_aversion",
      role: "loss_aversion",
      video: "owl_ep9_s3_loss_aversion_motion.mp4",
      narration: "이걸 모르고 자꾸 쓰면, 나중에 진짜 필요한 대출 받을 때 금리가 더 높게 나올 수 있어.",
      imageBrief:
        "부엉이가 깜빡이는 빨간 경고등 소품을 가리키며 진지하고 걱정스러운 표정 — " +
        "웃지 않음. 경고등 옆에 '금리 상승 위험'이라는 문구를 작게 그려 넣는다. " +
        "배경: 앞 장면과 동일한 은행 공간.",
      overlays: [
        { text: "반복 이용 시 금리 불이익 가능", x: 130, y: 1250, size: 34, kind: "alert" },
      ],
    },
    {
      scene: 4,
      key: "s4_evidence_card",
      role: "evidence_card",
      video: "owl_ep9_s4_evidence_card_motion.mp4",
      narration: "카드론, 현금서비스는 담보 없는 고금리 대출이라 이용 자체가 상환 능력 부족 신호로 평가돼.",
      imageBrief:
        "부엉이 옆에 큼직한 정보 패널 소품을 배치하고 그 안에 '담보 없는 고금리 " +
        "대출', '상환 능력 부족 신호'라는 문구를 명확히 그려 넣는다. 부엉이는 " +
        "패널을 가리키며 진지하고 냉철한 표정 — 웃지 않음.",
      overlays: [
        { text: "담보 없는 고금리 대출", x: 130, y: 1020, size: 32, kind: "label" },
        { text: "상환 능력 부족 신호", x: 130, y: 1100, size: 40, kind: "accent" },
      ],
    },
    {
      scene: 5,
      key: "s5_background",
      role: "background",
      video: "owl_ep9_s5_background_motion.mp4",
      narration: "실제로 올해 상반기 카드론 이용액만 28조원, 작년보다 20.9% 늘었어.",
      imageBrief:
        "부엉이가 앞 장면과 이어지는 정보 패널에 '카드론 이용액 28조원', " +
        "'전년비 +20.9%'라는 문구를 추가로 가리키며 진지한 표정 — 웃지 않음. " +
        "상승하는 막대그래프를 함께 그려 넣는다. 배경: 앞 장면과 동일한 은행 공간.",
      overlays: [
        { text: "카드론 이용액 28조원", x: 130, y: 1190, size: 36, kind: "label" },
        { text: "전년비 +20.9%", x: 130, y: 1270, size: 44, kind: "accent" },
        { text: "금융감독원", x: 130, y: 1340, size: 26, kind: "source" },
      ],
    },
    {
      scene: 6,
      key: "s6_twist",
      role: "twist",
      video: "owl_ep9_s6_twist_motion.mp4",
      narration: "핵심은 카드론 자체가 나쁘다는 게 아니야. 한두 번 쓰는 건 몰라도, 반복해서 자주 쓰는 습관이 문제야.",
      imageBrief:
        "부엉이가 한 손엔 '한두 번'이라고 쓰인 작은 카드를, 다른 손엔 '반복 " +
        "이용'이라고 쓰인 빨간 경고 카드를 나란히 들어 보이며 진지하고 확신에 찬 " +
        "표정 — 웃지 않음. 두 소품의 대비를 시각적으로 보여준다. 배경: 앞 장면과 " +
        "동일한 은행 공간.",
      overlays: [
        { text: "반복 이용 습관이 문제", x: 130, y: 1250, size: 36, kind: "alert" },
      ],
    },
    {
      scene: 7,
      key: "s7_impact",
      role: "impact",
      video: "owl_ep9_s7_impact_motion.mp4",
      narration: "신용평가사 입장에선 '왜 계속 고금리 대출을 찾을까'라는 물음표가 쌓이고, 점수에 그대로 반영돼.",
      imageBrief:
        "부엉이가 물음표가 여러 개 쌓여가는 도식 소품을 심각한 표정으로 내려다보는 " +
        "자세 — 웃지 않음. 도식 옆에 '신용점수 반영'이라는 문구를 명확히 그려 " +
        "넣는다. 배경: 앞 장면과 동일한 은행 공간, 톤은 살짝 어둡게.",
      overlays: [
        { text: "반복 조회·이용 = 물음표 누적", x: 130, y: 1190, size: 32, kind: "label" },
        { text: "신용점수에 반영", x: 130, y: 1270, size: 40, kind: "alert" },
      ],
    },
    {
      scene: 8,
      key: "s8_alternative",
      role: "action",
      video: "owl_ep9_s8_alternative_motion.mp4",
      narration: "무작정 참을 필요는 없어. 서민금융진흥원 1397에 먼저 물어보면 부담 낮은 대출을 안내받을 수 있어.",
      imageBrief:
        "부엉이가 스마트폰으로 전화 상담 화면을 보여주며 밝고 안심시키는 표정 — " +
        "은은한 미소는 허용(대안 제시 톤이라 다른 씬보다 부드러워도 됨). 화면에는 " +
        "'서민금융진흥원 1397'이라는 문구를 명확히 그려 넣는다. 배경: 밝은 톤의 " +
        "은행 공간(앞 장면과 다른 각도, 같은 공간).",
      overlays: [
        { text: "서민금융진흥원 1397", x: 130, y: 1250, size: 38, kind: "label" },
      ],
    },
    {
      scene: 9,
      key: "s9_action_a",
      role: "action",
      video: "owl_ep9_s9_action_a_motion.mp4",
      narration: "카드론이나 현금서비스를 최근에 썼다면, 상환 계획부터 먼저 세워보자.",
      imageBrief:
        "부엉이가 다이어리나 메모장에 상환 계획을 적는 진지하고 꼼꼼한 표정 — " +
        "웃지 않음. 메모장에는 '상환 계획'이라는 문구를 작게 그려 넣는다. 배경: " +
        "앞 장면과 동일한 은행 공간.",
      overlays: [
        { text: "상환 계획 먼저 세우기", x: 130, y: 1250, size: 36, kind: "label" },
      ],
    },
    {
      scene: 10,
      key: "s10_action_b",
      role: "action",
      video: "owl_ep9_s10_action_b_motion.mp4",
      narration: "매달 반복해서 쓰고 있다면, 그게 정말 급한 상황인지 아니면 습관인지 스스로 점검해보자.",
      imageBrief:
        "부엉이가 팔짱을 끼고 신중하게 되돌아보는 표정 — 은은한 미소는 허용(마무리 " +
        "톤이라 다른 씬보다 부드러워도 됨). 옆에 '급한 상황인지 습관인지 점검'이라는 " +
        "문구를 작게 그려 넣는다. 배경: 앞 장면과 동일한 은행 공간.",
      overlays: [
        { text: "급한 상황인지 습관인지 점검", x: 130, y: 1250, size: 34, kind: "label" },
      ],
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findScene(key) {
  return OWL_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
