/**
 * 부엉박사 조립 스펙 18편(v2, 재제작 7편 이후 첫 신규 소재) — 전세사기
 * 특별법 "최소보장제", 2026-11-13 시행.
 *
 * 기준: _ai/CURRENT_STANDARDS.md §1 "씬 구조 v2", §7. 유형: C형(제도
 * 변경 → 나한테 뭐가 달라지나). 금박사 연결은 2026-09-30에 제거했다(금박사
 * 반응 저조, Owner 결정) — 부엉박사 본문에서 경·공매는 이름만 언급하고
 * 설명하지 않으며, 마지막 씬은 "저장해 두고 신청 전 다시 확인 + 댓글"이다.
 *
 * ★ 핵심 팩트(2026-09-28 WebSearch로 원문 직접 확인, OBSERVED_FULL)★:
 * - 전세사기 특별법 개정안이 2026-04-23 국회 본회의 통과, 공포 후
 *   6개월 뒤인 **2026-11-13**부터 "최소보장제" 시행 확정.
 *   출처: 인천일보 "[로펌스토리] 11월 13일 전세사기 최소보장제도
 *   시행…신청 막히는 세 가지 경우", 한경부동산밸류업센터.
 * - 최소보장 기준: 피해자가 경·공매·우선변제권 행사로 회수한 금액 +
 *   특별법 지원금을 합쳐도 임차보증금의 **3분의 1**에 못 미치면, 그
 *   부족분을 국가가 재정으로 지원(선지급 후정산 방식 포함).
 * - 소급 적용: 법 시행 전에 이미 경매·공매가 끝난 피해자에게도
 *   소급 적용된다(서울경제 2026-04-23 속보 확인). 2026년 추경에
 *   최소보장 재원 279억 원 반영.
 * - 보증금 한도: 피해자 인정 요건인 임차보증금 상한이 기존 3억 원에서
 *   5억 원으로 상향, 피해지원위원회 재량으로 최대 2억 원을 추가
 *   인정할 수 있어 실질적으로 최대 7억 원 전세까지 피해자로 인정
 *   가능(edaily 2026-04-23).
 * - 신청 기한: 아직 전세사기피해자 결정을 못 받았다면 **2027-05-31**
 *   까지 결정 신청 필요(2년 연장, 대한민국 정책브리핑). 이미 결정된
 *   피해자는 그 **결정일로부터 3년 이내**에 최소보장금을 신청.
 * - 신청 제외 3가지(인천일보): ① 피해주택을 직접 매수한 경우 ②
 *   경·공매에서 배당요구·배분요구를 하지 않은 경우 ③ 최소보장금의
 *   전부나 일부를 이미 선지급받은 경우.
 * - 제약: 최소보장금(현금)을 받으면 LH 등 공공임대주택 우선공급은
 *   받을 수 없다 — 현금 지원과 공공임대 중 하나만 선택(서울경제).
 *
 * ★ 소재 선정 경위(2026-09-28)★: 14~17편이 이미 국민연금·실업급여·
 * 퇴직연금·최저임금으로 배정된 뒤 다음 신규(18편) 소재를 거시경제·
 * 금융·투자·부동산·정부정책·세금 등 폭넓게 재조사(Explore 서브에이전트
 * 조사). 후보 중 ①전세사기 특별법 최소보장제(11월 시행 예고) ②
 * 고향사랑기부제 20만원 개편 ③월세 세액공제 중, IRP(6편)·연말정산
 * 계열과 안 겹치는 신규 도메인(주거 피해구제)이면서 배포 예정일
 * (10/3 전후) 대비 "다음 달 시행" 시의성이 가장 뚜렷한 ①을 Owner가
 * 확정. 시청자 본인 액션(피해자 결정 신청·최소보장금 신청)이 명확해
 * [[feedback_owl_topic_must_have_viewer_action]] 기준도 충족.
 *
 * ★ 씬 구성 경위★: 1차로 16씬까지 늘렸다가(항목마다 반씩 쪼갠 버전)
 * Owner 지적("뭔가 내용을 크게 바꾸지 않아도 씬을 줄일 수 있을 거
 * 같은데")으로 재검토 — "핵심질문+즉답" 씬과 "대상" 항목이 원래
 * 하나의 흐름("답부터 말하면 ~피해자만 해당되고, ~도 포함이야")이라
 * 자연스럽게 합쳐져 15씬으로 확정.
 *
 * ★ TTS 실측 후 압축 경위★: 1차 TTS에서 s9(한도)가 9.71초, s11(기한)이
 * 9.6초로 9.5초 규칙을 넘었다. Owner 지적("9.5초를 조금 넘는거면 대본을
 * 압축하면 되는거 아니냐")에 따라 씬을 나누는 대신 문장 자체를 압축—
 * s9 "원래 3억 원이었는데 이번에 5억 원까지 올랐고, 위원회 재량으로
 * 최대 7억까지도 인정받을 수 있어"(9.4초 근접) → "3억 원에서 5억 원으로
 * 올랐고, 재량으로 최대 7억까지 인정돼"(예상 6.5초). s11 "아직 피해자
 * 인정 안 받았다면 내년 5월 31일까지, 인정받았다면 결정일부터 3년 안에
 * 신청하면 돼"(9.4초 근접) → "인정 전이면 내년 5월 31일까지, 인정 후면
 * 결정일부터 3년 안에 신청해"(예상 7.3초). 핵심 수치(3억→5억, 재량 7억,
 * 2027.5.31, 결정일+3년)는 전부 그대로 유지, 문장만 간결화. 15씬 그대로
 * 유지.
 */

export const OWL_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "owl_assembly_spec_v1",
  scriptStructureVersion: "owl_script_structure_v2",
  episode: 18,
  scriptType: "C_policy_change",
  // 2026-09-30 Owner 결정: 금박사 반응이 세 캐릭터 중 가장 낮아 18편부터 금박사 연결을
  // 뺀다. 마지막 씬은 저장·댓글 유도로 바꿨고, 경·공매는 부엉박사 본문에서 설명하지 않는다.
  geumbaksaHandoffTerm: null,
  sourceCandidate: "candidate-jeonse-fraud-minimum-guarantee-2026-11-13",
  title: "전세사기 당했는데 한 푼도 못 받았다면, 11월부터 달라진다",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  headerTitle: ["전세사기 최소보장제", "11월 13일부터 시행"],

  scenesTimeline:
    "s1 hook_q / s2 hook_stakes / s3 opening / s4 definition / s5 fact_timing / s6 fact_criteria / s7 retroactive / s8 core_q_answer / s9 point1_limit / s10 point2_deadline / s11 caution_exclusion / s12 caution_choice / s13 summary / s14 checklist / s15 bridge",

  instagramCaptionHook: "전세사기 당했는데 경매 끝나고도 한 푼도 못 받았다면, 11월부터는 달라져",
  instagramCaptionPoints: [
    "전세사기 최소보장제가 11월 13일부터 시행돼",
    "경·공매나 우선변제권으로 회수한 금액이 보증금의 3분의 1에 못 미치면, 그 차액을 국가가 채워줘",
    "이미 경매·공매가 끝난 피해자도 소급 적용돼",
    "피해자 인정 보증금 한도가 3억 원에서 5억 원으로 올랐고, 위원회 재량으로 최대 7억까지도 인정받을 수 있어",
    "아직 피해자 인정을 못 받았다면 2027년 5월 31일까지 신청해야 해",
    "다만 집을 직접 샀거나 배당요구를 안 했다면 신청이 막히고, 현금 지원과 공공임대는 둘 중 하나만 선택할 수 있어",
  ],
  instagramPriorityTags: [
    "전세사기",
    "전세사기특별법",
    "최소보장제",
    "전세보증금",
    "주거안정",
    "부동산정책",
    "정부정책",
    "세입자",
    "경제공부",
    "재테크",
    "경제뉴스",
    "경제상식",
    "부엉박사",
  ],

  emphasisTerms: ["전세사기", "최소보장제", "부엉박사"],

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
      key: "s1_hook_q",
      role: "hook",
      video: "owl_v2_ep18_s1_hook_q_motion.mp4",
      narration: "전세사기 당한 사람, 경매 끝나고도 보증금 한 푼도 못 받을 수 있는 거 알고 있었어?",
      imageBrief:
        "법률·주거 피해구제 상담 창구(둥근 상담 데스크, 계약서·보증금 " +
        "아이콘이 그려진 안내판, 특정 기관 로고 없음) 새 배경(신규 " +
        "제작). 부엉이가 걱정스럽고 놀란 표정으로 '보증금' / '한 푼도?' " +
        "큰 글자 2줄 카드를 한쪽 날개로 감싸 쥐고 보여주는 자세.",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_hook_stakes",
      role: "hook",
      video: "owl_v2_ep18_s2_hook_stakes_motion.mp4",
      narration: "근데 다음 달부터는 최소한은 국가가 채워준대.",
      imageBrief:
        "동일 배경. 부엉이가 '국가가 채워준다?' 큰 글자와 작은 동전 " +
        "아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 눈이 커진 놀란 표정.",
      overlays: [],
    },
    {
      scene: 3,
      key: "s3_opening",
      role: "opening",
      video: "owl_v2_ep18_s3_opening_motion.mp4",
      narration: "안녕, 매일 경제 뉴스를 콕 집어 전해주는 부엉박사야.",
      imageBrief:
        "동일 배경. 부엉이가 한쪽 날개를 살짝 들어 인사하는 자세, 담담한 " +
        "미소(기본 표정 유지). 소품 없음.",
      overlays: [],
    },
    {
      scene: 4,
      key: "s4_definition",
      role: "one_line_definition",
      video: "owl_v2_ep18_s4_definition_motion.mp4",
      narration: "오늘 얘기할 건 전세사기 최소보장제야, 경·공매로도 다 못 받은 보증금을 국가가 채워주는 제도야.",
      imageBrief:
        "동일 배경. 부엉이가 '전세사기 최소보장제' 큰 글자 카드를 한쪽 " +
        "날개로 감싸 쥐고 담담하게 설명하는 표정.",
      overlays: [],
    },
    {
      scene: 5,
      key: "s5_fact_timing",
      role: "fact",
      video: "owl_v2_ep18_s5_fact_timing_motion.mp4",
      narration: "국회가 지난 4월 통과시킨 법인데, 오는 11월 13일부터 시행돼.",
      imageBrief:
        "동일 배경. 부엉이가 '11월 13일 시행' 큰 글자와 달력 아이콘이 " +
        "적힌 카드를 한쪽 날개로 감싸 쥐고 확신에 찬 표정으로 보여주는 " +
        "자세.",
      overlays: [],
    },
    {
      scene: 6,
      key: "s6_fact_criteria",
      role: "fact",
      video: "owl_v2_ep18_s6_fact_criteria_motion.mp4",
      narration: "기준은 임차보증금의 3분의 1이야, 회수한 금액이랑 지원금을 합쳐도 여기 못 미치면 그 차액을 채워줘.",
      imageBrief:
        "동일 배경. 부엉이가 '보증금 × 1/3' 큰 글자 수식과 차액 화살표 " +
        "아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 또박또박 설명하는 " +
        "진지한 표정.",
      overlays: [],
    },
    {
      scene: 7,
      key: "s7_retroactive",
      role: "fact",
      video: "owl_v2_ep18_s7_retroactive_motion.mp4",
      narration: "이미 경매·공매가 끝난 사람도 해당돼, 그때 회수한 돈이 기준보다 적었다면 지금이라도 신청할 수 있어.",
      imageBrief:
        "동일 배경. 부엉이가 '이미 끝났어도 OK' 큰 글자와 되돌리기 " +
        "화살표 아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 안심시키는 " +
        "표정으로 보여주는 자세.",
      overlays: [],
    },
    {
      scene: 8,
      key: "s8_core_q_answer",
      role: "core_question",
      video: "owl_v2_ep18_s8_core_q_answer_motion.mp4",
      narration: "그럼 아무나 다 받을 수 있을까? 답부터 말하면, 전세사기 피해자로 결정된 사람만 해당되고, 신탁사기 피해 임차인도 포함이야.",
      imageBrief:
        "동일 배경. 부엉이가 '아무나?' / '피해자 인정자만' 큰 글자 2줄 " +
        "카드를 한쪽 날개로 감싸 쥐고, 처음엔 갸웃하다 확신에 찬 표정으로 " +
        "바뀌는 자세.",
      overlays: [],
    },
    {
      scene: 9,
      key: "s9_point1_limit",
      role: "evidence",
      video: "owl_v2_ep18_s9_point1_limit_motion.mp4",
      narration: "둘째, 보증금 한도야. 3억 원에서 5억 원으로 올랐고, 위원회 재량으로 최대 7억까지 인정돼.",
      imageBrief:
        "동일 배경. 부엉이가 '3억 원 → 5억 원' 윗줄과 '재량 최대 7억' " +
        "아랫줄로 이어진 큰 글자 2줄 카드를 한쪽 날개로 감싸 쥐고 " +
        "확신에 찬 표정으로 보여주는 자세.",
      overlays: [],
    },
    {
      scene: 10,
      key: "s10_point2_deadline",
      role: "evidence",
      video: "owl_v2_ep18_s10_point2_deadline_motion.mp4",
      narration: "셋째, 신청 기한이야. 피해자 인정 전이면 내년 5월 31일까지, 인정 후면 결정일부터 3년 안이야.",
      imageBrief:
        "동일 배경. 부엉이가 '2027.5.31까지' 윗줄과 '결정일+3년' 아랫줄로 " +
        "이어진 큰 글자 2줄 카드를 한쪽 날개로 감싸 쥐고 또박또박 " +
        "설명하는 진지한 표정.",
      overlays: [],
    },
    {
      scene: 11,
      key: "s11_caution_exclusion",
      role: "condition",
      video: "owl_v2_ep18_s11_caution_exclusion_motion.mp4",
      narration: "그렇다고 다 받는 건 아니야, 직접 집을 샀거나 배당요구를 안 했다면 신청이 막히거든.",
      imageBrief:
        "동일 배경. 부엉이가 '직접 매수·배당요구 없음' 큰 글자와 " +
        "금지 아이콘(사선 원)이 적힌 카드를 한쪽 날개로 감싸 쥐고 " +
        "단호하고 신중한 표정.",
      overlays: [],
    },
    {
      scene: 12,
      key: "s12_caution_choice",
      role: "condition",
      video: "owl_v2_ep18_s12_caution_choice_motion.mp4",
      narration: "그리고 현금 지원이랑 공공임대는 둘 중 하나만 고를 수 있어.",
      imageBrief:
        "동일 배경. 부엉이가 '현금 or 공공임대' 큰 글자와 저울 아이콘이 " +
        "적힌 카드를 한쪽 날개로 감싸 쥐고 신중한 표정으로 보여주는 " +
        "자세.",
      overlays: [],
    },
    {
      scene: 13,
      key: "s13_summary",
      role: "action",
      video: "owl_v2_ep18_s13_summary_motion.mp4",
      narration: "콕 집어 정리하면, 11월 13일부터는 보증금의 3분의 1은 국가가 최소한 보장해준다는 거야.",
      imageBrief:
        "동일 배경. 부엉이가 '최소 3분의 1은 국가 보장' 큰 글자 카드를 " +
        "한쪽 날개로 감싸 쥐고 확신에 찬 표정으로 보여주는 자세.",
      overlays: [],
    },
    {
      scene: 14,
      key: "s14_checklist",
      role: "action",
      video: "owl_v2_ep18_s14_checklist_motion.mp4",
      narration: "먼저 확인할 건 두 가지, 내가 피해자로 인정받았는지, 신청 기한이 언제까지인지야.",
      imageBrief:
        "동일 배경. 부엉이가 '체크 ① 피해자 인정 여부 ② 신청 기한'이라고 " +
        "두 줄로 크게 적힌 카드를 한쪽 날개로 감싸 쥐고, 다른 날개로 " +
        "손가락 두 개를 세워 보이는 자세.",
      overlays: [],
    },
    {
      scene: 15,
      key: "s15_bridge",
      role: "save",
      video: "owl_v2_ep18_s15_bridge_motion.mp4",
      narration: "이 두 가지는 저장해 두고, 신청하기 전에 다시 확인해. 궁금한 제도는 댓글로 남겨줘.",
      imageBrief:
        "동일 배경. 부엉이가 밝은 미소로 '저장해두고 / 신청 전 확인' 두 줄 큰 글자 카드를 " +
        "한쪽 날개로 감싸 쥐고 마무리하는 자세.",
      overlays: [],
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findScene(key) {
  return OWL_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
