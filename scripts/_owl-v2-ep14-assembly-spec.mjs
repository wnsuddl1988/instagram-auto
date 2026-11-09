/**
 * 부엉박사 조립 스펙 14편(v2 재제작) — 국민연금 보험료율, 올해 27년 만에 9.5%로
 * 오른 데 이어 2027년 1월 10%로 또 오른다(2033년 13%까지 매년 0.5%p).
 *
 * 기준: _ai/CURRENT_STANDARDS.md §1 "씬 구조 v2", §7. 유형: C형(나한테 뭐가 달라지나).
 * 배포 9/29(가안). 같은 날 금박사 8편(파일 ep6 "소득대체율 43%, 진짜 내 몫은 얼마일까")
 * → 부엉박사는 소득대체율 41.5%→43%를 수치만 언급하고, "진짜 내 몫인지"는 금박사에게 넘긴다.
 *
 * ★ v1(파일 ep10, 2026-09-21 작성)은 "내년부터 오른다", "2026년부터 매년 올려"처럼
 *   개편 시행 전 시점 표현이었다. 실제로는 2026-01-01부터 9.5% 적용 중이므로 v2는
 *   "올해 1월 9.5% → 2027년 1월 10%"로 쓴다.
 *
 * 출처(2026-09-27 재확인): 대한민국 정책브리핑 "국민연금 '보험료율' 9%→13%로 인상"
 * (korea.kr/news/policyNewsView.do?newsId=148933465), 네이트뉴스(연금 9%→9.5%, 2025-12-29).
 * - 1998년 9% 이후 27년 동결 → 2026년 9.5%, 2027년 10%, 매년 0.5%p, 2033년 13%.
 * - 월 소득 309만 원 직장가입자: 한 단계당 월 약 7,700원 증가(회사와 반반), 지역가입자
 *   약 15,400원(전액 본인). 2027년 증가분도 같은 0.25%p라 309만 원 기준 약 7,700원.
 * - 기금 소진 2056년 → 2064년(같은 수익률 4.5% 가정, 개혁 효과 8년 연장). 2071년은 수익률을
 *   5.5%로 올린 정부 발표치라 2056년과 직접 비교하면 안 된다(뉴스핌 2026-05-21, 파이낸셜뉴스
 *   2025-09-30 확인, 2026-09-29 수정). 소득대체율 41.5% → 43%(2026년). 국가 지급 보장 법제화.
 * - 미납·납부예외 기간은 가입기간에서 빠져 연금액이 줄어든다(공단 안내).
 *
 * 수치 중복 금지: 27년 s4만, 9.5%·13%·0.5%p s5만, 2056·2064 s6만, 10% s7만,
 * 309만·7,700·15,400 s8만, 41.5→43% s10만.
 *
 * 재사용(v1 = _owl-ep10-assembly-spec.mjs, 영상 C:/tmp/owl-ep10-motion-final,
 * 이미지 C:/tmp/owl-ep10-images-v2): 9개 클립.
 *   s2 ← v1 s2(8s 급여명세서 국민연금↑) / s3 ← v1 s1(8s 오프닝) / s4 ← v1 s3(10s '1998년 9%'
 *   + 기금 추이) / s5 ← v1 s4(10s '보험료율 9%→13% 2026~2033') / s6 ← 새 이미지+10s 재생성(09-29: '기금 소진
 *   2056 → 2064년') / s9 ← v1 s6(10s '더 낸다' / '더 받는다+국가 책임')
 *   / s10 ← v1 s7(8s '41.5%→43% 국가 책임') / s12 ← v1 s9(8s 공제액 비교 명세서)
 *   / s13 ← v1 s8(10s 폰 '내 연금 알아보기')
 * 새로 만드는 씬: s1, s7, s8, s11, s14(배경은 v1과 같은 연금 상담 창구).
 */

export const OWL_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "owl_assembly_spec_v1",
  scriptStructureVersion: "owl_script_structure_v2",
  episode: 14,
  v1SourceSpec: "_owl-ep10-assembly-spec.mjs",
  scriptType: "C_policy_change",
  geumbaksaHandoffTerm: "소득대체율",
  sourceCandidate: "candidate-final-nps-premium-rate-hike-v2",
  title: "국민연금 보험료, 올해 오른 데 이어 내년 1월에 또 오른다",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  headerTitle: ["국민연금 보험료", "내년 1월 또 오른다"],

  scenesTimeline:
    "s1 hook_q / s2 hook_stakes / s3 opening / s4 definition / s5 situation / s6 why / s7 core_q_answer / s8 point1_calc / s9 point2_receive / s10 point2_rate / s11 caution / s12 summary_check / s13 how_to_check / s14 bridge",

  instagramCaptionHook: "국민연금 보험료, 올해 한 번 오르고 끝난 게 아니야 — 내년 1월에 또 올라",
  instagramCaptionPoints: [
    "1998년부터 27년 동안 9%였던 보험료율이 올해 1월 9.5%로 올랐어",
    "2033년 13%가 될 때까지 매년 0.5%포인트씩 올라서, 내년 1월엔 10%야",
    "월 309만 원 버는 직장인이면 한 번 오를 때마다 월 약 7,700원, 지역가입자는 약 15,400원 더 내",
    "대신 소득대체율이 41.5%에서 43%로 올랐고, 기금이 모자라도 나라가 지급을 책임진다는 조항도 생겼어",
    "부담된다고 안 내고 미루면 그 기간만큼 나중에 받는 연금이 줄어",
    "👉 이번 달 급여명세서 공제액이랑 국민연금공단 앱 '내 연금 알아보기'부터 확인해봐",
  ],
  instagramPriorityTags: [
    "국민연금",
    "보험료율",
    "연금개혁",
    "소득대체율",
    "노후준비",
    "월급",
    "직장인",
    "자영업자",
    "생활경제",
    "재테크",
    "경제공부",
    "경제뉴스",
    "경제상식",
    "금융상식",
    "부엉박사",
  ],

  emphasisTerms: ["국민연금", "보험료율", "소득대체율", "국민연금공단", "부엉박사"],

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
      video: "owl_v2_ep14_s1_hook_q_motion.mp4",
      narration: "월급 받는 사람, 국민연금 보험료가 올해 오른 데 이어 내년 1월에 또 오른다는 거 알고 있었어?",
      imageBrief: "v1과 같은 연금 상담 창구 배경. '국민연금' / '또 오른다?' 큰 글자 2줄 카드를 한쪽 날개로 감싸 쥔 날카롭고 궁금한 표정.",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_hook_stakes",
      role: "hook",
      video: "owl_v2_ep14_s2_hook_stakes_motion.mp4",
      reuseFrom: "owl_ep10_s2_hook_motion.mp4",
      narration: "대부분 한 번 오르고 끝난 줄 아는데, 사실은 해마다 조금씩 오르는 구조야.",
      imageBrief: "재사용(v1 s2 — 급여명세서 '국민연금' 항목 + 위쪽 화살표).",
      overlays: [],
    },
    {
      scene: 3,
      key: "s3_opening",
      role: "opening",
      video: "owl_v2_ep14_s3_opening_motion.mp4",
      reuseFrom: "owl_ep10_s1_opening_motion.mp4",
      narration: "안녕, 매일 경제 뉴스를 콕 집어 전해주는 부엉박사야.",
      imageBrief: "재사용(v1 s1 오프닝).",
      overlays: [],
    },
    {
      scene: 4,
      key: "s4_definition",
      role: "one_line_definition",
      video: "owl_v2_ep14_s4_definition_motion.mp4",
      reuseFrom: "owl_ep10_s3_why_motion.mp4",
      narration: "보험료율은 월급에서 국민연금으로 내는 비율이야. 1998년 9%로 정한 뒤, 27년 동안 그대로였지.",
      imageBrief: "재사용(v1 s3 — '1998년 9%' 서류 + 기금 추이 그래프).",
      overlays: [],
    },
    {
      scene: 5,
      key: "s5_situation",
      role: "fact",
      video: "owl_v2_ep14_s5_situation_motion.mp4",
      reuseFrom: "owl_ep10_s4_evidence_card_motion.mp4",
      narration: "그러다 올해 1월 9.5%로 올랐고, 2033년 13%가 될 때까지 매년 0.5%포인트씩 올라가.",
      imageBrief: "재사용(v1 s4 — 보드 '보험료율 9%→13%, 2026~2033년 단계적 인상').",
      overlays: [],
    },
    {
      scene: 6,
      key: "s6_why",
      role: "fact",
      video: "owl_v2_ep14_s6_why_motion.mp4",
      reuseFrom: "owl_ep10_s5_background_motion.mp4",
      narration: "안 올리면 연금 기금이 2056년에 바닥날 상황이었는데, 이렇게 올리면 2064년까지 버틸 수 있거든.",
      imageBrief: "새 이미지(2026-09-29 팩트 수정): 카드 '기금 소진' / '2056 → 2064년' 큰 글자 2줄. v1의 '2071년으로 연장'은 수익률 가정(4.5%→5.5%)이 달라 개혁 효과로 비교할 수 없어 폐기.",
      overlays: [],
    },
    {
      scene: 7,
      key: "s7_core_q_answer",
      role: "core_question",
      video: "owl_v2_ep14_s7_core_q_answer_motion.mp4",
      narration: "그럼 나한테는 뭐가 달라질까? 답부터 말하면, 내년 1월 10%로 오르면서 월급에서 빠지는 돈이 또 늘어.",
      imageBrief: "동일 배경. '내 월급은' / '또 줄까?' 큰 글자 2줄 카드를 한쪽 날개로 감싸 쥐고, 다른 날개는 턱 근처 생각하는 포즈.",
      overlays: [],
    },
    {
      scene: 8,
      key: "s8_point1_calc",
      role: "evidence",
      video: "owl_v2_ep14_s8_point1_calc_motion.mp4",
      narration: "첫째, 월 309만 원 버는 직장인은 오를 때마다 약 7,700 원씩 더 내. 혼자 다 내는 지역가입자는 약 15,400 원이야.",
      imageBrief: "동일 배경. 바닥 보드 큰 글자 2줄 '직장인 +7,700원' / '지역 +15,400원'. 빈 날개로 가리키는 진지한 표정.",
      overlays: [],
    },
    {
      scene: 9,
      key: "s9_point2_receive",
      role: "evidence",
      video: "owl_v2_ep14_s9_point2_receive_motion.mp4",
      reuseFrom: "owl_ep10_s6_twist_motion.mp4",
      narration: "둘째, 더 내기만 하는 건 아니야. 기금이 모자라도 나라가 지급을 책임진다는 조항이 법에 새로 생겼어.",
      imageBrief: "재사용(v1 s6 — 카드 '더 낸다' / '더 받는다 + 국가 책임').",
      overlays: [],
    },
    {
      scene: 10,
      key: "s10_point2_rate",
      role: "evidence",
      video: "owl_v2_ep14_s10_point2_rate_motion.mp4",
      reuseFrom: "owl_ep10_s7_impact_motion.mp4",
      narration: "대신 돌려받는 소득대체율도 41.5%에서 43%로 올랐어.",
      imageBrief: "재사용(v1 s7 — 서류 '은퇴 전 소득 대비 돌려받는 비율 41.5%→43%' + '국가 책임').",
      overlays: [],
    },
    {
      scene: 11,
      key: "s11_caution",
      role: "condition",
      video: "owl_v2_ep14_s11_caution_motion.mp4",
      narration: "그렇다고 부담된다고 안 내고 미루면 안 돼. 안 낸 기간만큼 나중에 받는 연금이 줄거든.",
      imageBrief: "동일 배경. 경고 아이콘과 '미납하면' / '연금 줄어요' 큰 글자 2줄 카드를 한쪽 날개로 감싸 쥔 진지한 표정.",
      overlays: [],
    },
    {
      scene: 12,
      key: "s12_summary_check",
      role: "action",
      video: "owl_v2_ep14_s12_summary_check_motion.mp4",
      reuseFrom: "owl_ep10_s9_action_a_motion.mp4",
      narration: "콕 집어 정리하면, 보험료는 해마다 또 올라. 먼저 이번 달 명세서 공제액부터 봐.",
      imageBrief: "재사용(v1 s9 — 공제액 비교 명세서 2장).",
      overlays: [],
    },
    {
      scene: 13,
      key: "s13_how_to_check",
      role: "action",
      video: "owl_v2_ep14_s13_how_to_check_motion.mp4",
      reuseFrom: "owl_ep10_s8_alternative_motion.mp4",
      narration: "그리고 내 예상 연금은, 국민연금공단 앱의 '내 연금 알아보기'에서 바로 확인할 수 있어.",
      imageBrief: "재사용(v1 s8 — 폰 화면 '내 연금 알아보기').",
      overlays: [],
    },
    {
      scene: 14,
      key: "s14_bridge",
      role: "save",
      video: "owl_v2_ep14_s14_bridge_motion.mp4",
      narration: "그 소득대체율이 진짜 내 몫인지 궁금하면, 금박사가 이어서 풀어줄게. 궁금한 건 댓글로 남겨줘.",
      imageBrief: "동일 배경. '진짜 내 몫?' 큰 글자 카드를 한쪽 날개로 감싸 쥐고 밝은 미소로 마무리.",
      overlays: [],
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findScene(key) {
  return OWL_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
