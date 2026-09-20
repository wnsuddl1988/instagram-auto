/**
 * 금박사 쇼츠 조립 스펙 5편 — 신용점수(정의/평가항목/실제영향/오해바로잡기/회복구조).
 *
 * 부엉이 9편(카드론·현금서비스가 신용점수를 깎는 구조)을 참고해 Owner가 직접
 * 확정한 소재. 3가지 요소(정의·평가항목, 실제영향, 회복구조)를 복합 편성했다.
 * 씬9에 "액션 팁"(성실납부 기록 제출)을 추가하고, 씬10에서 "평소 관리가
 * 중요하다"는 총정리로 마무리하는 구조로 Owner 승인(2026-09-20).
 *
 * 대본 확정 경위:
 *   - 오프닝은 매 편 고정 멘트 원칙(주제 예고만 교체)을 그대로 유지한다.
 *   - 마지막에 신용회복을 위한 액션 지침이 없어 아쉽다는 지적으로 9번(액션
 *     팁) 신설, 그 뒤 관리의 중요성을 강조하는 10번(총정리)까지 확장해
 *     8씬 구조에서 10씬 구조로 늘렸다.
 *   - "카드론 쓰면 몇 점 하락한다"는 공식 수치는 NICE·KCB·금감원 모두
 *     미발표라 정성적 표현+검증된 통계만 사용(등급제→점수제 전환 연도,
 *     연체 기록 보존 기간, 조회 영향 폐지 연도는 공식 확인된 사실).
 *
 * closing_disclaimer 없음(3편부터 확정 원칙 승계) — 본편 자체는 CTA 없이
 * 여운 있는 정리로 마무리한다. 실제로는 조립 단계에서 고정 CTA 클립
 * (geumbaksa_cta_clean_final.mp4)을 뒤에 결합해 배포했다(2026-09-21,
 * _ai/CURRENT_STANDARDS.md §2 참고).
 */

export const GEUMBAKSA_EP5_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "geumbaksa_assembly_spec_v1",
  episode: 5,
  deployEpisode: 5,
  sourceTopic: "credit-score-basics",
  title: "신용점수, 대체 뭘 보고 매기는 걸까",
  headerTitle: ["신용점수", "뭘 보고 매길까"],
  channelName: "경제번역소",
  character: "coin3dv1",
  characterDisplayName: "금박사",
  track: "geumbaksa",

  instagramCaptionHook: "똑같은 대출인데 누구는 저금리, 누구는 고금리 — 그 차이 신용점수야",
  instagramCaptionPoints: [
    "신용점수는 1점부터 1000점까지, 내 신용을 숫자로 매긴 거야",
    "상환 이력, 부채 수준, 거래 기간, 거래 형태 네 가지로 매겨져",
    "2021년부터 등급제 대신 점수제로 바뀌었어",
    "연체는 갚아도 단기 최대 3년, 장기 최장 5년 기록이 남아",
    "2011년부터는 조회만 해도 점수가 깎인다는 말은 사실이 아니야",
    "통신비·공공요금 성실납부 기록을 제출하면 점수 회복에 도움이 돼",
  ],
  instagramPriorityTags: ["신용점수", "신용관리", "대출금리", "금융상식", "경제상식"],

  // 자막 강조색이 적용될 이 편의 핵심 용어·출처 기관명(2026-09-20 구조 개선 —
  // 편마다 조립기 파일의 전역 목록을 직접 수정하지 않고 스펙에서 선언한다).
  // 배열의 첫 항목(신용점수)은 이 편의 대표 주제어로, 조립기가 한 자막 줄의
  // 강조 슬롯이 숫자로 다 찼어도 항상 우선 강조한다.
  emphasisTerms: ["신용점수", "상환 이력", "부채 수준", "점수제", "성실납부"],

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
      video: "ep5_s1_video.mp4",
      narration: "안녕, 어려운 경제·금융 용어를 쉽게 풀어주는 금박사야. 오늘은 신용점수 얘기해볼게.",
      imageBrief:
        "밝고 캐주얼한 홈오피스·서재풍 배경. 금박사가 정면을 보며 인사하듯 한쪽 팔을 살짝 드는 " +
        "포즈. 배경 화이트보드에 '신용점수' 글자와 점수 게이지 아이콘을 크게 그려 넣어 오늘 " +
        "주제를 예고. 투자 유도 요소 없음.",
    },
    {
      scene: 2,
      key: "s2_relatable_scenario",
      role: "relatable_scenario",
      video: "ep5_s2_video.mp4",
      narration: "똑같은 금액을 대출받는데, 누구는 낮은 금리로 받고 누구는 훨씬 높은 금리로 받아. 왜 이런 차이가 날까?",
      imageBrief:
        "동일 배경 연속. 두 개의 대출 서류 카드를 양손에 들고 비교하는 포즈 — 한 카드엔 낮은 " +
        "금리 숫자, 다른 카드엔 높은 금리 숫자가 표시되어 있고 그 차이를 의아해하는 표정.",
    },
    {
      scene: 3,
      key: "s3_one_line_definition",
      role: "one_line_definition",
      video: "ep5_s3_video.mp4",
      narration: "그 차이를 만드는 게 바로 신용점수야. 1점부터 1000점까지, 내 신용을 숫자로 매긴 거야.",
      imageBrief:
        "동일 배경 연속. 1점부터 1000점까지 눈금이 그려진 커다란 게이지 소품을 자신 있게 " +
        "가리키는 포즈. 게이지 위에 '신용점수' 글자를 큼직하게 함께 배치.",
    },
    {
      scene: 4,
      key: "s4_evaluation_factors",
      role: "evaluation_factors",
      video: "ep5_s4_video.mp4",
      narration: "이 점수는 상환 이력, 부채 수준, 거래 기간, 거래 형태, 이 네 가지를 종합해서 매겨져.",
      imageBrief:
        "정보 카드 소품에 네 개의 항목 — '상환 이력', '부채 수준', '거래 기간', '거래 형태' — " +
        "을 체크리스트 형태로 명확히 그려 넣고, 하나씩 짚어가듯 손으로 가리키는 포즈.",
    },
    {
      scene: 5,
      key: "s5_system_background",
      role: "system_background",
      video: "ep5_s5_video.mp4",
      narration: "원래는 등급으로 나눴는데, 등급 경계의 불합리 때문에 2021년부터 점수제로 바뀌었어.",
      imageBrief:
        "'등급제'라고 쓰인 카드가 흐릿하게 지워지고 그 옆에 '점수제'라고 쓰인 카드가 선명하게 " +
        "나타나는 전환을 손으로 가리키는 포즈. 카드 하단에 작은 글씨로 '2021년' 표기.",
    },
    {
      scene: 6,
      key: "s6_key_figures",
      role: "key_figures",
      video: "ep5_s6_video.mp4",
      narration: "연체하면 끝이 아니야. 단기 연체는 갚아도 최대 3년, 장기 연체는 최장 5년 기록이 남아.",
      imageBrief:
        "큼직한 정보 카드(인포그래픽 패널) 소품에 달력 아이콘과 함께 '단기 연체 최대 3년', " +
        "'장기 연체 최장 5년'이라는 문구를 명확한 숫자 표기로 직접 그려 넣는다.",
    },
    {
      scene: 7,
      key: "s7_real_impact",
      role: "real_impact",
      video: "ep5_s7_video.mp4",
      narration: "이 점수 하나로 대출 한도, 대출 금리, 카드 발급 심사까지 줄줄이 달라져. 숫자 하나가 생각보다 많은 걸 결정해.",
      imageBrief:
        "앞 장면과 이어지는 정보 카드에 '대출 한도', '대출 금리', '카드 발급 심사' 세 갈래로 " +
        "뻗어나가는 화살표 도식을 그려 넣어 신용점수 하나가 여러 결과로 이어짐을 시각화.",
    },
    {
      scene: 8,
      key: "s8_myth_busting",
      role: "myth_busting",
      video: "ep5_s8_video.mp4",
      narration: "근데 '조회만 해도 점수 깎인다'는 말, 이제는 사실이 아니야. 2011년부터 조회는 점수에 영향을 안 줘.",
      imageBrief:
        "'조회하면 점수 깎임?' 이라고 쓰인 카드에 크게 X 표시를 그려 넣고 그 옆에 '2011년부터 " +
        "아님'이라는 문구를 함께 배치. 살짝 장난스럽게 고개를 젓는 듯한 표정.",
    },
    {
      scene: 9,
      key: "s9_action_tip",
      role: "action_tip",
      video: "ep5_s9_video.mp4",
      narration: "신용점수는 나빠져도 끝이 아니야. 통신비·공공요금 성실납부 기록을 제출하면 점수에 반영돼.",
      imageBrief:
        "밝고 희망적인 톤. 통신비·공공요금 고지서 아이콘을 손에 들고 그 옆에 '성실납부 기록 " +
        "제출'이라는 문구와 상승하는 작은 화살표를 그려 넣는다. 따뜻하고 격려하는 표정.",
    },
    {
      scene: 10,
      key: "s10_closing",
      role: "closing",
      video: "ep5_s10_video.mp4",
      narration: "결국 신용점수는 대출 한 번 받을 때만 보는 숫자가 아니라, 평소에 꾸준히 관리해야 하는 내 경제적 신뢰도야.",
      imageBrief:
        "1번 씬과 톤이 이어지는 밝은 마무리 구도. 신용점수 게이지 소품을 품에 안듯 들고 " +
        "따뜻하게 웃는 포즈. 별도 텍스트 없이 여운 있는 정리 이미지로 마무리.",
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findScene(key) {
  return GEUMBAKSA_EP5_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
