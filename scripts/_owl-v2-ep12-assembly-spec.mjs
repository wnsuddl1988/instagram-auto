/**
 * 부엉박사 조립 스펙 12편(v2 재제작) — 토지거래허가구역 실거주 유예 신청 기한
 * 1년 연장 + 세입자 갱신계약 1회 인정.
 *
 * 기준: _ai/CURRENT_STANDARDS.md §1 "씬 구조 v2", §7(재고 전면 v2 재제작).
 * 유형: C형(나한테 뭐가 달라지나). 배포 9/27(가안), 같은 날 금박사 6편(파일 ep8
 * 토지거래허가구역 — "강남3구·용산만인 줄 알았는데 서울 거의 전역", 정의·범위·
 * 토지이음 확인). → 부엉박사는 토허구역의 정의·범위를 설명하지 않고 마지막 씬에서
 * "우리 동네도 해당되는지"로 넘긴다.
 *
 * 출처(2026-09-26 재확인): 국토교통부 2026-09-17 발표 '부동산 거래신고 등에 관한
 * 법률 시행령' 개정, 2026-10-01 시행. MS TODAY(mstoday.co.kr/news/articleView.html
 * ?idxno=102639), 네이트뉴스 연합 종합(m.news.nate.com/view/20260917n26139) 등.
 * - 실거주 유예 신청 기한 2026-12-31 → 2027-12-31(1년 연장), 신청은 10/1부터.
 * - 매수 당시 임대차 잔여기간 + 계약갱신청구권 등 갱신계약 1회(최대 2년) 인정.
 * - 시행일로부터 최대 3년 3개월, 늦어도 2029년 12월 말까지 입주.
 * - 허가 후 4개월 내 취득·등기 요건 유지, 무주택 유지·입주 후 2년 거주 의무 유지
 *   (v1 조사 유지).
 *
 * 수치 중복 금지: 훅은 "3년 3개월", 결과 씬은 "2029년 말". "4개월"·"2년 거주"는 s4 규칙 설명에서만\n * 말하고 s11(조건)·s12(주의)는 수치 없이 쓴다. 1차 TTS(본편 88초)가 목표보다 짧아\n * 재사용 클립 여유 안에서 사실 정보(원래 기한 2026년 말, 발표일, 계약갱신청구권 등)를 보강.
 *
 * 재사용(v1 = _owl-ep12-assembly-spec.mjs, C:/tmp/owl-ep12-videos): 카드 문구가
 * 맞는 10개 클립. 클립 길이(s3 7.42초, s6 7.08초, 8초짜리 4개)에 맞춰 발화를 짧게
 * 썼다. TTS 실측 후 끝부분 결함을 0.3초 간격으로 확인한다(§7 규칙).
 *   s3 ← v1 s1 opening(10s) / s4 ← v1 s2(10s, '토지거래허가구역' 카드+'4개월 내 입주·
 *   2년 거주' 보드) / s5 ← v1 s3(7.42s, '전월세 물량 감소') / s6 ← v1 s4(10s, '실거주
 *   유예 제도') / s7 ← v1 s5(8s, '신청기한 1년 연장') / s9 ← v1 s6(7.08s, '갱신 계약도
 *   인정') / s10 ← v1 s7(10s, '최장 2029년 말까지') / s11 ← v1 s8(8s, '무주택 유지·
 *   입주 후 2년 거주') / s12 ← v1 s9(8s, 물음표) / s14 ← v1 s10(8s, '관할 구청에 확인')
 * 새로 만드는 씬: s1, s2, s8, s13(배경은 v1과 같은 부동산 상담 사무소).
 */

export const OWL_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "owl_assembly_spec_v1",
  scriptStructureVersion: "owl_script_structure_v2",
  episode: 12,
  v1SourceSpec: "_owl-ep12-assembly-spec.mjs",
  scriptType: "C_policy_change",
  geumbaksaHandoffTerm: "토지거래허가구역(적용 범위)",
  sourceCandidate: "candidate-final-sep-land-permit-zone-residence-deferral-v2",
  title: "세입자 있는 집, 이제 입주를 2029년 말까지 미룰 수 있다",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  headerTitle: ["세입자 있는 집", "실거주 유예 1년 더"],

  scenesTimeline:
    "s1 hook_q / s2 hook_stakes / s3 opening / s4 rule / s5 problem / s6 existing_relief / s7 situation / s8 core_q_answer / s9 point1_renewal / s10 point1_result / s11 point2_condition / s12 caution / s13 summary_check / s14 bridge",

  instagramCaptionHook: "세입자 있는 집을 사도, 이제 입주를 최대 3년 3개월까지 미룰 수 있어",
  instagramCaptionPoints: [
    "토지거래허가구역에서 집을 사면 원래 4개월 안에 들어가서 2년을 직접 살아야 해",
    "그래서 세입자 계약이 끝날 때까지 입주를 미뤄주는 실거주 유예 제도가 작년부터 있었어",
    "국토교통부가 9월 17일, 이 유예 신청 기한을 2027년 12월 31일까지 1년 늘렸고 10월 1일부터 시행해",
    "세입자가 계약을 한 번 갱신하면 그 기간(최대 2년)까지 유예로 쳐줘서, 늦어도 2029년 말까지만 들어가면 돼",
    "단 계속 무주택이어야 하고, 들어가면 2년은 직접 살아야 해. 허가 후 4개월 안에 등기까지 끝내야 하는 것도 그대로야",
    "신청은 관할 구청에서 👉 먼저 세입자 계약이 언제 끝나는지부터 확인해봐",
  ],
  instagramPriorityTags: [
    "토지거래허가구역",
    "실거주의무",
    "실거주유예",
    "부동산정책",
    "무주택",
    "주택매매",
    "전월세",
    "세입자",
    "부동산",
    "내집마련",
    "재테크",
    "경제공부",
    "경제뉴스",
    "경제상식",
    "부엉박사",
  ],

  emphasisTerms: ["실거주 유예", "토지거래허가구역", "무주택", "국토교통부", "부엉박사"],

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
      video: "owl_v2_ep12_s1_hook_q_motion.mp4",
      narration: "세입자 있는 집 사려는 사람, 이제 입주를 최대 3년 3개월까지 미룰 수 있게 된 거 알고 있었어?",
      imageBrief:
        "v1과 같은 부동산 상담 사무소 배경. 부엉이가 '최대 3년 3개월'이라는 큰 글자 2줄 " +
        "카드를 한쪽 날개로 감싸 쥐고 눈썹을 치켜올린 날카롭고 궁금한 표정.",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_hook_stakes",
      role: "hook",
      video: "owl_v2_ep12_s2_hook_stakes_motion.mp4",
      narration: "근데 바뀐 건 기한만이 아니야. 이걸 모르면, 세입자 있는 좋은 집을 그냥 지나칠 수도 있어.",
      imageBrief:
        "동일 배경. 바닥에 세운 큰 보드에 큰 글자 2줄 '기한만?' / '갱신도 인정'. 부엉이는 " +
        "보드 옆에서 빈 날개로 보드를 가리키는 진지한 표정.",
      overlays: [],
    },
    {
      scene: 3,
      key: "s3_opening",
      role: "opening",
      video: "owl_v2_ep12_s3_opening_motion.mp4",
      reuseFrom: "owl_ep12_s1_opening_motion.mp4",
      narration: "안녕, 매일 경제 뉴스를 콕 집어 전해주는 부엉박사야.",
      imageBrief: "재사용(v1 s1 오프닝 — 인사 포즈, 소품 없음).",
      overlays: [],
    },
    {
      scene: 4,
      key: "s4_rule",
      role: "one_line_definition",
      video: "owl_v2_ep12_s4_rule_motion.mp4",
      reuseFrom: "owl_ep12_s2_background_motion.mp4",
      narration: "토지거래허가구역에서 집을 사면, 원래는 4개월 안에 들어가서 2년을 직접 살아야 해. 세입자가 살고 있어도 예외가 없었지.",
      imageBrief: "재사용(v1 s2 — '토지거래허가구역' 카드 + 바닥 보드 '4개월 내 입주 · 2년 거주').",
      overlays: [],
    },
    {
      scene: 5,
      key: "s5_problem",
      role: "fact",
      video: "owl_v2_ep12_s5_problem_motion.mp4",
      reuseFrom: "owl_ep12_s3_problem_motion.mp4",
      narration: "그러다 보니 집이 팔릴 때마다 세입자가 이사를 나가야 해서, 전월세 물량이 계속 줄었지.",
      imageBrief: "재사용(v1 s3 — 카드 '전월세 물량 감소', 클립 7.42초).",
      overlays: [],
    },
    {
      scene: 6,
      key: "s6_existing_relief",
      role: "fact",
      video: "owl_v2_ep12_s6_existing_relief_motion.mp4",
      reuseFrom: "owl_ep12_s4_existing_relief_motion.mp4",
      narration: "그래서 작년부터 세입자 계약이 끝날 때까지 입주를 미뤄주는 유예 제도가 생겼는데, 기한이 2026년 말까지였어.",
      imageBrief: "재사용(v1 s4 — 바닥 보드 '실거주 유예 제도' + 시계).",
      overlays: [],
    },
    {
      scene: 7,
      key: "s7_situation",
      role: "fact",
      video: "owl_v2_ep12_s7_situation_motion.mp4",
      reuseFrom: "owl_ep12_s5_extension_motion.mp4",
      narration: "국토교통부가 9월 17일, 이 유예 신청 기한을 2027년 말까지 1년 더 늘렸어.",
      imageBrief: "재사용(v1 s5 — 카드 '신청기한 1년 연장').",
      overlays: [],
    },
    {
      scene: 8,
      key: "s8_core_q_answer",
      role: "core_question",
      video: "owl_v2_ep12_s8_core_q_answer_motion.mp4",
      narration: "그럼 나한테는 뭐가 달라질까? 답부터 말하면, 세입자를 안 내보내도 되는 기간이 확 길어졌어. 집 고를 때 선택지가 넓어진 거지.",
      imageBrief:
        "동일 배경. 부엉이가 '나한테는' / '뭐가 달라?'라는 큰 글자 2줄 카드를 한쪽 날개로 " +
        "감싸 쥐고, 다른 날개는 턱 근처에서 생각하는 포즈. (s12가 v1 물음표 카드라 겹치지 않게 글자 카드.)",
      overlays: [],
    },
    {
      scene: 9,
      key: "s9_point1_renewal",
      role: "evidence",
      video: "owl_v2_ep12_s9_point1_renewal_motion.mp4",
      reuseFrom: "owl_ep12_s6_renewal_included_motion.mp4",
      narration: "첫째, 세입자가 계약갱신청구권으로 한 번 더 계약하면, 그 2년까지 쳐줘.",
      imageBrief: "재사용(v1 s6 — 카드 '갱신 계약도 인정', 클립 7.08초).",
      overlays: [],
    },
    {
      scene: 10,
      key: "s10_point1_result",
      role: "evidence",
      video: "owl_v2_ep12_s10_point1_result_motion.mp4",
      reuseFrom: "owl_ep12_s7_impact_motion.mp4",
      narration: "쉽게 풀면, 10월 1일부터 신청할 수 있고, 세입자가 갱신까지 해도 늦어도 2029년 말까지만 들어가면 되는 거야.",
      imageBrief: "재사용(v1 s7 — 바닥 보드 '최장 2029년 말까지').",
      overlays: [],
    },
    {
      scene: 11,
      key: "s11_point2_condition",
      role: "condition",
      video: "owl_v2_ep12_s11_point2_condition_motion.mp4",
      reuseFrom: "owl_ep12_s8_condition_motion.mp4",
      narration: "둘째, 조건은 그대로야. 들어갈 때까지 무주택이어야 하고, 거주 의무도 똑같이 채워야 해.",
      imageBrief: "재사용(v1 s8 — 바닥 보드 '무주택 유지 · 입주 후 2년 거주').",
      overlays: [],
    },
    {
      scene: 12,
      key: "s12_caution",
      role: "condition",
      video: "owl_v2_ep12_s12_caution_motion.mp4",
      reuseFrom: "owl_ep12_s9_balance_motion.mp4",
      narration: "그렇다고 마냥 느긋하면 안 돼. 허가받은 뒤 정해진 기간 안에 등기까지 끝내야 하는 건 그대로거든.",
      imageBrief: "재사용(v1 s9 — 물음표 카드).",
      overlays: [],
    },
    {
      scene: 13,
      key: "s13_summary_check",
      role: "action",
      video: "owl_v2_ep12_s13_summary_check_motion.mp4",
      narration: "콕 집어 정리하면, 세입자 있는 집도 한결 편하게 살 수 있어. 먼저 볼 건 계약 끝나는 날이랑, 세입자가 갱신할 생각인지야.",
      imageBrief:
        "동일 배경. 바닥에 세운 큰 보드에 체크 표시와 큰 글자 2줄 '✔ 계약 끝나는 날' / " +
        "'✔ 갱신할까?'. 부엉이는 보드 옆에서 빈 날개를 가볍게 드는 설명 포즈.",
      overlays: [],
    },
    {
      scene: 14,
      key: "s14_bridge",
      role: "save",
      video: "owl_v2_ep12_s14_bridge_motion.mp4",
      reuseFrom: "owl_ep12_s10_action_motion.mp4",
      narration: "신청은 관할 구청에서 해. 우리 동네도 토지거래허가구역인지 궁금하면, 금박사가 이어서 풀어줄게.",
      imageBrief: "재사용(v1 s10 — 스마트폰 '관할 구청에 확인').",
      overlays: [],
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findScene(key) {
  return OWL_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
