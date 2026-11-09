/**
 * 부엉박사 조립 스펙 13편(v2 재제작) — 고용률 8월 사상 첫 70% vs 청년 취업자
 * 46개월 연속 감소, 그래서 취업 준비 중인 나는 뭘 챙겨야 하나.
 *
 * 기준: _ai/CURRENT_STANDARDS.md §1 "씬 구조 v2", §7. 유형: D형(나는 어떻게
 * 해야 하나). 배포 9/28(가안). 같은 날 금박사 7편(파일 ep5 신용점수)은 내용
 * 연결이 없어 마지막 씬에서 금박사를 언급하지 않는다(댓글 요청만).
 *
 * 출처(2026-09-26 재확인):
 * - 통계청 8월 고용동향(2026-09-09): 15~64세 고용률 70.4%(1989년 이래 8월 기준
 *   처음 70% 돌파), 취업자 2,915.1만 명(+18.4만), 청년(15~29세) 취업자 46개월
 *   연속 감소(-14.3만), 청년 고용률 44.1%, 청년 실업률 5.4%(+0.5%p). 한국일보
 *   (hankookilbo.com/news/article/A2026090907360004472), 이데일리, 뉴스핌.
 * - 국민취업지원제도 구직촉진수당: 2026-01-01부터 월 50만→60만 원, 최대 6개월
 *   (360만 원), 부양가족 1인당 월 10만 원 추가(최대 40만 원). 고용노동부
 *   (moel.go.kr 국정성과 20260201211). 1유형은 소득·재산 요건 있음.
 * - 신청: 고용24(work24.go.kr) 또는 고용센터. ★ v1 대본의 "워크넷"은 2024-09-23
 *   고용24로 통합·종료된 서비스라 v2에서 쓰지 않는다(v1 s9 이미지에도 '워크넷'
 *   폰 화면이 있어 재사용 금지).
 * - 중소기업 재직자 우대 저축공제: v1(2026-09-22) 운영 확인, 금액은 말하지 않음.
 *
 * 수치 중복 금지: 훅은 "역대 최고"(숫자 없음), s5에서만 70.4%.
 *
 * 재사용(v1 = _owl-ep11-assembly-spec.mjs, C:/tmp/owl-ep11-videos): 8개 클립.
 *   s2 ← v1 s2 hook(8s, 물음표) / s3 ← v1 s1 opening(10s) / s4 ← v1 s5(8s, 보드
 *   '15~64세 전체 평균') / s5 ← v1 s3(8s, 게이지 '고용률 70.4%') / s6 ← v1 s4(8s,
 *   '청년 취업 46개월 연속 감소') / s7 ← v1 s6(8s, '고용률 역대 최고') / s8 ← v1 s7
 *   (8s, 보드 '내 또래는 어떨까?') / s9 ← v1 s10(8s, '구직촉진수당') / s11 ← v1 s8
 *   (10s, '중소기업 재직자 우대 저축공제' + '국민취업지원제도')
 * 새로 만드는 씬: s1, s10, s12, s13, s14(배경은 v1과 같은 고용센터).
 */

export const OWL_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "owl_assembly_spec_v1",
  scriptStructureVersion: "owl_script_structure_v2",
  episode: 13,
  v1SourceSpec: "_owl-ep11-assembly-spec.mjs",
  scriptType: "D_what_to_do",
  geumbaksaHandoffTerm: null,
  sourceCandidate: "candidate-final-aug-employment-youth-gap-v2",
  title: "고용률 역대 최고인데 취업은 왜 더 어려울까, 지금 챙길 지원금",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  headerTitle: ["고용률 역대 최고인데", "청년은 46개월째 감소"],

  scenesTimeline:
    "s1 hook_q / s2 hook_stakes / s3 opening / s4 definition / s5 situation / s6 youth_gap / s7 why_gap / s8 core_q_answer / s9 point1_allowance / s10 calc / s11 point2_after_job / s12 caution / s13 summary_check / s14 bridge",

  instagramCaptionHook: "고용률이 역대 최고라는데, 취업 준비하는 입장에선 왜 하나도 체감이 안 될까",
  instagramCaptionPoints: [
    "통계청 8월 고용동향에서 15~64세 고용률이 70.4%, 8월 기준으로 처음 70%를 넘었어",
    "근데 청년 취업자는 46개월째 줄었고, 청년 실업률은 5.4%까지 올랐어",
    "고용률은 전체 평균이라, 고령층 취업이 늘면 청년이 힘들어도 좋아 보여",
    "취업 준비 중이라면 국민취업지원제도부터 — 조건이 맞으면 구직촉진수당을 월 60만 원씩 최대 6개월 받아",
    "부양가족이 있으면 1명당 월 10만 원씩 더 붙고, 취업한 뒤엔 중소기업 재직자 우대 저축공제 같은 제도도 있어",
    "소득·재산 기준이 있으니 👉 고용24나 가까운 고용센터에서 대상인지부터 확인해봐",
  ],
  instagramPriorityTags: [
    "고용률",
    "청년취업",
    "취업준비",
    "국민취업지원제도",
    "구직촉진수당",
    "고용24",
    "고용센터",
    "지원금",
    "생활경제",
    "재테크",
    "경제공부",
    "경제뉴스",
    "경제상식",
    "금융상식",
    "부엉박사",
  ],

  emphasisTerms: ["고용률", "국민취업지원제도", "구직촉진수당", "고용24", "부엉박사"],

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
      video: "owl_v2_ep13_s1_hook_q_motion.mp4",
      narration: "취업 준비하는 사람, 고용률이 역대 최고를 찍었다는데 왜 나만 체감이 안 되는지 알고 있었어? 이유가 따로 있어.",
      imageBrief: "v1과 같은 고용센터 배경. '고용률 역대 최고?' 큰 글자 2줄 카드를 한쪽 날개로 감싸 쥐고 날카롭게 궁금한 표정.",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_hook_stakes",
      role: "hook",
      video: "owl_v2_ep13_s2_hook_stakes_motion.mp4",
      reuseFrom: "owl_ep11_s2_hook_motion.mp4",
      narration: "대부분 뉴스 제목만 보고 넘기는데, 숫자를 제대로 뜯어보면 내가 챙길 돈이 보여.",
      imageBrief: "재사용(v1 s2 — 머리 위 물음표, 양 날개 벌린 포즈, 소품 없음).",
      overlays: [],
    },
    {
      scene: 3,
      key: "s3_opening",
      role: "opening",
      video: "owl_v2_ep13_s3_opening_motion.mp4",
      reuseFrom: "owl_ep11_s1_opening_motion.mp4",
      narration: "안녕, 매일 경제 뉴스를 콕 집어 전해주는 부엉박사야.",
      imageBrief: "재사용(v1 s1 오프닝).",
      overlays: [],
    },
    {
      scene: 4,
      key: "s4_definition",
      role: "one_line_definition",
      video: "owl_v2_ep13_s4_definition_motion.mp4",
      reuseFrom: "owl_ep11_s5_why_gap_motion.mp4",
      narration: "고용률은 15세부터 64세까지, 일할 나이인 사람 중에 실제로 일하는 비율이야.",
      imageBrief: "재사용(v1 s5 — 바닥 보드 '15~64세 전체 평균').",
      overlays: [],
    },
    {
      scene: 5,
      key: "s5_situation",
      role: "fact",
      video: "owl_v2_ep13_s5_situation_motion.mp4",
      reuseFrom: "owl_ep11_s3_fact_motion.mp4",
      narration: "통계청 발표로 8월 고용률은 70.4%, 8월 기준으로는 처음 70%를 넘었어.",
      imageBrief: "재사용(v1 s3 — 게이지 '고용률 70.4%').",
      overlays: [],
    },
    {
      scene: 6,
      key: "s6_youth_gap",
      role: "fact",
      video: "owl_v2_ep13_s6_youth_gap_motion.mp4",
      reuseFrom: "owl_ep11_s4_youth_gap_motion.mp4",
      narration: "근데 청년 취업자는 46개월째 줄었고, 청년 실업률은 5.4%로 올랐어.",
      imageBrief: "재사용(v1 s4 — 카드 '청년 취업 46개월 연속 감소').",
      overlays: [],
    },
    {
      scene: 7,
      key: "s7_why_gap",
      role: "evidence",
      video: "owl_v2_ep13_s7_why_gap_motion.mp4",
      reuseFrom: "owl_ep11_s6_impact_motion.mp4",
      narration: "고령층 취업이 크게 늘면, 청년이 힘들어도 전체 평균은 좋아 보이거든. 평균의 함정이지.",
      imageBrief: "재사용(v1 s6 — 카드 '고용률 역대 최고').",
      overlays: [],
    },
    {
      scene: 8,
      key: "s8_core_q_answer",
      role: "core_question",
      video: "owl_v2_ep13_s8_core_q_answer_motion.mp4",
      reuseFrom: "owl_ep11_s7_summary_motion.mp4",
      narration: "그럼 나는 어떻게 해야 할까? 답부터 말하면, 받을 수 있는 지원부터 챙기는 거야.",
      imageBrief: "재사용(v1 s7 — 바닥 보드 '내 또래는 어떨까?').",
      overlays: [],
    },
    {
      scene: 9,
      key: "s9_point1_allowance",
      role: "evidence",
      video: "owl_v2_ep13_s9_point1_allowance_motion.mp4",
      reuseFrom: "owl_ep11_s10_action_c_motion.mp4",
      narration: "첫째, 국민취업지원제도야. 조건이 맞으면 구직촉진수당을 월 60만 원씩 받아.",
      imageBrief: "재사용(v1 s10 — 카드 '구직촉진수당').",
      overlays: [],
    },
    {
      scene: 10,
      key: "s10_calc",
      role: "evidence",
      video: "owl_v2_ep13_s10_calc_motion.mp4",
      narration: "쉽게 풀면, 6개월 다 받으면 최대 360만 원이야. 부양가족이 있으면 한 명당 월 10만 원씩 더 붙고.",
      imageBrief: "동일 배경. 바닥 보드 큰 글자 2줄 '6개월 최대' / '360만 원'. 빈 날개로 가리키는 확신에 찬 표정.",
      overlays: [],
    },
    {
      scene: 11,
      key: "s11_point2_after_job",
      role: "evidence",
      video: "owl_v2_ep13_s11_point2_after_job_motion.mp4",
      reuseFrom: "owl_ep11_s8_action_a_motion.mp4",
      narration: "둘째, 취업한 뒤라면 중소기업 재직자 우대 저축공제처럼, 회사랑 같이 목돈을 모으게 도와주는 제도도 있어.",
      imageBrief: "재사용(v1 s8 재생성본 — 카드 2장 '중소기업 재직자 우대 저축공제' / '국민취업지원제도', 10초).",
      overlays: [],
    },
    {
      scene: 12,
      key: "s12_caution",
      role: "condition",
      video: "owl_v2_ep13_s12_caution_motion.mp4",
      narration: "그렇다고 무작정 신청하면 안 돼. 가구 소득이랑 재산 기준이 있어서, 내가 대상인지부터 봐야 하거든.",
      imageBrief: "동일 배경. '소득 · 재산' / '기준 확인' 큰 글자 2줄 카드를 한쪽 날개로 감싸 쥐고 진지한 표정.",
      overlays: [],
    },
    {
      scene: 13,
      key: "s13_summary_check",
      role: "action",
      video: "owl_v2_ep13_s13_summary_check_motion.mp4",
      narration: "콕 집어 정리하면, 평균보다 내 상황이 중요해. 먼저 볼 건 내가 수당 대상인지랑, 취업하고 나서 받을 수 있는 제도야.",
      imageBrief: "동일 배경. 바닥 보드에 체크 2칸 '✔ 수당 대상?' / '✔ 취업 후 제도'. 빈 날개로 설명 포즈.",
      overlays: [],
    },
    {
      scene: 14,
      key: "s14_bridge",
      role: "save",
      video: "owl_v2_ep13_s14_bridge_motion.mp4",
      narration: "신청은 고용24 홈페이지나 가까운 고용센터에서 할 수 있어. 궁금한 지원 제도가 있으면 댓글로 남겨줘.",
      imageBrief: "동일 배경. '고용24 · 고용센터' 큰 글자 2줄 카드를 한쪽 날개로 감싸 쥐고 밝은 미소로 마무리.",
      overlays: [],
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findScene(key) {
  return OWL_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
