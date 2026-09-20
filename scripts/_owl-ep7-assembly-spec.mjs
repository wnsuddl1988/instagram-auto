/**
 * 부엉이 쇼츠 조립 스펙 — 9장면의 영상·나레이션·오버레이를 한곳에서 정의한다.
 *
 * 7편 출처: investing 도메인 실시간 수집(2026-09-19, C:/tmp/owl-ep7-investing-topic-v2)
 *           news-21-뉴시스 "3배 ETF에 1.1조 베팅…서학개미, 美주식 다시 샀다" +
 *           news-3-한국경제(압축형 ETF 상품 봇물). 배포 예정: 부엉이 7편.
 *
 * 대본 확정 경위(2026-09-19, Owner와 실시간 협의로 최종 확정):
 *   - 초안은 하드컷/스코어링 통과에만 집중해 문장이 뚝뚝 끊기는 문제가 있었다.
 *     6편과 구조 대조 결과, background 씬의 진짜 역할은 "evidence_card 사실에
 *     대한 흔한 오해"를 제시하고 twist가 그 오해를 "핵심은 ~만이 아니야"로
 *     반박하는 것임을 재확인했다(feedback_script_flow_over_scoring 메모리 참고).
 *   - action도 처음엔 "이미 담고 있다면/관심 있다면/고민 중이라면"처럼 청중을
 *     인위적으로 3그룹으로 쪼갰으나, Owner가 "초등학생도 할 수 있는 말"이라고
 *     지적 — 채널은 투자 여부와 무관하게 누구나 해볼 수 있는 실질적 조언을
 *     주는 곳이므로, "여유자금인지 점검 → 구조 이해 후 접근 → 평소 경제뉴스
 *     습관"이라는 보유 여부 무관 3단계로 재구성했다.
 *   - impact의 "지수 10%↓→3배 ETF 30%↓" 체감 수치는 evidence pack에 없는
 *     예시지만, 이미 근거 있는 배율(뉴스 원문의 "3배")에서 산술적으로 파생된
 *     것이라 Owner 승인으로 HC-08에 예외를 추가해 허용했다
 *     (live-topic-cutline-check.ts 참고).
 *
 * closing_disclaimer는 스펙에 넣지 않는다(3편부터 확정) — 마지막 action 장면에서
 * 바로 끝내고 고정 CTA 클립(밝은 톤, follow+teaser)을 조립 단계에서 이어붙인다.
 *
 * 배경 다양화: 6편이 증권사 상담 라운지였으므로, 7편은 HTS/트레이딩 화면이
 * 있는 개인 홈트레이딩 데스크로 배경을 설계한다 — 1~6편 어디에도 쓰지 않은
 * 공간(레버리지 상품을 다루는 개인 투자자 시점에 어울림).
 *
 * [스펙-산출물 불일치 주의, 2026-09-21] 이 스펙 파일의 scenes 배열은 여전히
 * 9씬(오프닝 없음, scene 1이 s1_hook)이다. 실제 배포용 최종 영상
 * (owl-ep7-episode-final-v8/owl_episode_final.mp4)은 오프닝 씬을 소급 추가한
 * 10씬 구조로 이미 재조립됐지만, 그 오프닝 씬 추가는 별도 스크립트
 * (run-owl-opening-retrofit-caption-assemble-once.mjs)로 진행되어 이 스펙
 * 파일 자체에는 반영돼 있지 않다. 이 스펙을 그대로 다시 실행하면 오프닝 없는
 * 9씬 결과가 나오니 주의 — 최신 배포 상태는 _ai/CURRENT_STANDARDS.md §1을
 * 따른다.
 *
 * 설계 원칙(6편에서 확정, 계승):
 *   - narration은 TTS 확정본(C:/tmp/money-shorts-os/owl-ep7-tts/owl-ep7-tts-script.json)과
 *     정확히 동일해야 한다 — 대본-음성-자막 불일치 방지.
 *   - 이미지에 정보를 직접 그려 넣는 방식 + 오버레이 병행(화살표·강조 문구).
 *   - 좌표는 1080x1920 기준. 소스가 720x1280이므로 조립 시 업스케일한다.
 *   - 안전영역: _ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md §3.1 — 금지구역
 *     y 0~150, y 1600~1920, x 900~1080.
 */

export const OWL_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "owl_assembly_spec_v1",
  sourceCandidate: "candidate-final-leveraged-etf",
  title: "한국예탁결제원 집계, 이달 3배 ETF에 1.1조 다시 몰린 이유",
  channelName: "경제번역소",
  headerTitle: ["3배 레버리지 ETF", "1.1조 다시 몰린 이유"],

  instagramCaptionHook: "이달 3배 레버리지 ETF에 1.1조 다시 몰렸다는 거 알아?",
  instagramCaptionPoints: [
    "한국예탁결제원 집계로 이달 초 반도체 3배 레버리지 ETF에 다시 순매수 자금이 몰렸어",
    "많은 사람들이 짧은 기간에 수익을 3배로 불릴 수 있다는 점만 보고 몰려들어",
    "실제로는 배율만큼 손실도 커져서 원금 이상 손실까지 볼 수 있는 구조야",
    "레버리지에 넣을 자금이 대출이나 급전은 아닌지부터 오늘 점검해보자",
  ],
  instagramPriorityTags: ["레버리지ETF", "ETF", "투자", "리스크관리", "재테크"],

  // 자막 강조색이 적용될 이 편의 핵심 용어·출처 기관명(2026-09-20 구조 개선 —
  // 편마다 조립기 파일의 전역 목록을 직접 수정하지 않고 스펙에서 선언한다).
  emphasisTerms: ["레버리지", "레버리지ETF", "한국예탁결제원", "순매수", "3배", "리스크관리"],

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
      key: "s1_hook",
      role: "hook",
      video: "owl_ep7_s1_hook_motion.mp4",
      narration: "이달 3배 레버리지 ETF에 1.1조 다시 몰렸다는 거 알아?",
      imageBrief:
        "부엉이가 스마트폰 화면을 한 날개로 들어 보이며 놀란 듯 확신에 찬 표정으로 " +
        "정면을 응시하는 자세 — 웃지 않음. 화면에는 'ETF 순매수' 제목과 '1.1조원' " +
        "숫자, 상승 화살표를 명확히 그려 넣는다. 배경: 홈트레이딩 데스크 — 대형 " +
        "모니터에 캔들차트와 호가창이 떠 있는 개인 투자자 공간(1~6편에 없던 새 배경).",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_loss_aversion",
      role: "loss_aversion",
      video: "owl_ep7_s2_loss_aversion_motion.mp4",
      narration: "이 구조를 모르고 접근하면, 반등을 노리다가 원금 이상 손실까지 볼 수 있어.",
      imageBrief:
        "부엉이가 급격히 아래로 꺾이는 빨간 화살표 그래프 소품을 가리키며 진지하고 " +
        "걱정스러운 표정 — 웃지 않음. 화살표 옆에 '원금 이상 손실'이라는 경고성 " +
        "문구를 작게 그려 넣는다. 배경: 앞 장면과 동일한 홈트레이딩 데스크.",
      overlays: [
        { text: "원금 이상 손실 가능", x: 130, y: 1250, size: 36, kind: "alert" },
      ],
    },
    {
      scene: 3,
      key: "s3_evidence_card",
      role: "evidence_card",
      video: "owl_ep7_s3_evidence_card_motion.mp4",
      narration: "한국예탁결제원 집계로, 이달 초 미국 주식을 팔던 투자자들이 반도체 3배 레버리지 ETF로 다시 몰리며 순매수로 돌아섰어.",
      imageBrief:
        "부엉이 옆에 큼직한 정보 패널 소품을 배치하고 그 안에 '한국예탁결제원 집계', " +
        "'반도체 3배 레버리지 ETF', '순매수 전환'이라는 문구와 상승 막대그래프를 " +
        "명확히 그려 넣는다. 부엉이는 패널을 가리키며 진지하고 냉철한 표정 — 웃지 않음.",
      overlays: [
        { text: "반도체 3배 레버리지 ETF", x: 130, y: 1020, size: 34, kind: "label" },
        { text: "순매수 전환", x: 130, y: 1100, size: 48, kind: "accent" },
        { text: "한국예탁결제원", x: 130, y: 1290, size: 28, kind: "source" },
      ],
    },
    {
      scene: 4,
      key: "s4_background",
      role: "background",
      video: "owl_ep7_s4_background_motion.mp4",
      narration: "많은 사람들이 3배 ETF라고 하면 짧은 기간에 수익을 3배로 불릴 수 있다는 점만 보고 몰려들어.",
      imageBrief:
        "부엉이가 상승 화살표와 '수익 3배'라는 문구만 크게 적힌 카드를 흥미롭게 " +
        "바라보는 표정 — 웃지 않되 호기심 어린 눈빛. 카드에는 손실 관련 표기는 " +
        "전혀 없이 상승만 강조돼 있어 '반쪽짜리 정보'라는 톤을 시각화한다. " +
        "배경: 앞 장면과 동일한 홈트레이딩 데스크.",
      overlays: [
        { text: "수익만 보고 몰림", x: 130, y: 1250, size: 36, kind: "label" },
      ],
    },
    {
      scene: 5,
      key: "s5_twist",
      role: "twist",
      video: "owl_ep7_s5_twist_motion.mp4",
      narration: "핵심은 단기 수익만이 아니야. 짧게 보면 분명 유리하지만, 배율만큼 손실도 커지는 구조야.",
      imageBrief:
        "부엉이가 한 손엔 상승 화살표 카드를, 다른 손엔 하락 화살표 카드를 나란히 " +
        "들어 보이며 진지하고 확신에 찬 표정 — 웃지 않음. 두 카드 모두 '3배'라는 " +
        "동일한 배율 표기를 명확히 그려 넣어 양방향으로 배율이 적용됨을 보여준다. " +
        "배경: 앞 장면과 동일한 홈트레이딩 데스크.",
      overlays: [
        { text: "수익도 손실도 3배", x: 130, y: 1190, size: 40, kind: "alert" },
      ],
    },
    {
      scene: 6,
      key: "s6_impact",
      role: "impact",
      video: "owl_ep7_s6_impact_motion.mp4",
      narration: "지수가 10% 빠지면, 3배 ETF는 잔고가 30% 가까이 빠져. 반복되면 원금이 순식간에 사라질 수 있어.",
      imageBrief:
        "부엉이가 계산기와 빠르게 줄어드는 막대그래프 소품을 함께 들고 심각한 " +
        "표정으로 내려다보는 자세 — 웃지 않음. 그래프 옆에 '지수 -10%'와 '잔고 " +
        "-30%'라는 대비되는 두 수치를 명확히 그려 넣는다. 배경: 앞 장면과 동일한 " +
        "홈트레이딩 데스크, 톤은 살짝 어둡게.",
      overlays: [
        { text: "지수 -10% → 잔고 -30%", x: 130, y: 1250, size: 36, kind: "alert" },
      ],
    },
    {
      scene: 7,
      key: "s7_action_a",
      role: "action",
      video: "owl_ep7_s7_action_a_motion.mp4",
      narration: "레버리지에 투자하려는 자금이 대출이나 급전이 아니라, 잃어도 생활에 지장 없는 돈인지부터 오늘 스스로 점검해보자.",
      imageBrief:
        "부엉이가 가계부나 통장 소품을 양 날개로 펼쳐 들고 진지하게 점검하는 표정 " +
        "— 웃지 않음. 통장에는 '여유자금 점검'이라는 문구를 작게 그려 넣는다. " +
        "배경: 밝은 톤의 홈트레이딩 데스크(앞 장면과 다른 각도, 같은 공간).",
      overlays: [
        { text: "여유자금인지 오늘 점검", x: 130, y: 1250, size: 34, kind: "label" },
      ],
    },
    {
      scene: 8,
      key: "s8_action_b",
      role: "action",
      video: "owl_ep7_s8_action_b_motion.mp4",
      narration: "이런 배율 상품은 구조를 제대로 공부하고 확신이 설 때 접근하는 게 먼저야. 아직 잘 모르겠다면 지금은 지켜볼 때야.",
      imageBrief:
        "부엉이가 책이나 상품설명서를 진지하게 읽고 있는 신중한 표정 — 웃지 않음. " +
        "책 표지에 'ETF 상품설명서'라는 문구를 작게 그려 넣는다. 배경: 앞 장면과 " +
        "동일한 홈트레이딩 데스크.",
      overlays: [
        { text: "구조 이해 후 접근", x: 130, y: 1250, size: 36, kind: "label" },
      ],
    },
    {
      scene: 9,
      key: "s9_action_c",
      role: "action",
      video: "owl_ep7_s9_action_c_motion.mp4",
      narration: "오늘처럼 시장을 흔드는 흐름은 앞으로도 계속 나올 테니, 경제 뉴스를 평소에도 꾸준히 챙겨보는 습관부터 들여보자.",
      imageBrief:
        "부엉이가 스마트폰으로 경제 뉴스를 읽으며 고개를 끄덕이는 밝고 신뢰감 있는 " +
        "표정 — 은은한 미소는 허용(마무리 톤이라 다른 씬보다 부드러워도 됨). " +
        "화면에는 '경제 뉴스'라는 제목만 작게 그려 넣는다. 배경: 앞 장면과 동일한 " +
        "홈트레이딩 데스크.",
      overlays: [
        { text: "경제 뉴스 꾸준히 챙기기", x: 130, y: 1250, size: 36, kind: "label" },
      ],
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findScene(key) {
  return OWL_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
