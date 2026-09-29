/**
 * 부엉박사 조립 스펙 15편(v2 재제작) — 실업급여 22년 만의 개편, 월 지급액은
 * 줄고 받는 기간은 늘어난다(2026-09-01 고용노동부 발표, 아직 국회 통과 전
 * 정부안 단계).
 *
 * 기준: _ai/CURRENT_STANDARDS.md §1 "씬 구조 v2", §7. 유형: C형(나한테 뭐가
 * 달라지나). 배포 예정 짝: 같은 날 금박사 9편(파일 ep10, 실업급여 계산편).
 * 금박사 대본이 "부엉박사가 실업급여 하한액도 오른다고 했는데"로 시작하므로,
 * 이 편에서 하한액(198만→176만원) 수치를 반드시 명확히 언급한다(§7 표).
 *
 * ★ v1(2026-09-24 작성, `_owl-ep15-assembly-spec.mjs`, 옛 9~10씬 구조)의
 * 팩트는 재확인 결과(2026-09-27) 최신 상태와 정확히 일치해 그대로 재사용한다.
 * v1 작성 당시 이미 "아직 국회 통과 전 정부안" 원칙을 정확히 반영했었다
 * ([[feedback_gov_program_names_must_verify_current_status]]).
 *
 * 출처 재확인(2026-09-27, WebFetch OBSERVED_FULL): 아시아투데이
 * "20년 묵은 고용보험 손본다…구직급여 주 7일→6일·보험료율 2.0%로"
 * (m.news.nate.com/view/20260901n32926, 2026-09-01 17:32, 고용노동부
 * "고용보험 제도개편 방안" 발표 원문 확인):
 * - 구직급여 지급 방식: 무급휴일 포함 "주 7일치" → 무급휴일 제외 "주
 *   6일치"로 변경. 총 지급액·총 지급일수는 동일, 월 지급액만 줄고 지급
 *   "기간"이 늘어나는 구조.
 * - 내년(2027년) 기준 월 지급액: 하한액 수급자 198만원→176만원(약 22만원
 *   차이), 상한액 수급자 204만원→181만원. 150일 수급자 지급기간 5개월→
 *   5.8개월, 270일 수급자 9개월→10.5개월.
 * - 보험료율: 1.8%→2.0%(내년부터), 노사 각각 0.1%p씩 추가 부담.
 * - 상한액 산정 방식: 정액 → 하한액의 103% 연동으로 전환(최저임금 인상 시
 *   하한액이 상한액을 넘는 역전 현상 방지).
 * - 배경: 최저임금 수준 노동자 세후 월소득(193만원) < 구직급여 하한액
 *   수급액(198만원) 역전 현상. 지난해 수급자 172만명 중 하한액 적용자
 *   109만1000명(63.4%).
 * - 조기재취업수당 지급 제외 기준: 재취업 월임금 574만원 이상 → 300만원
 *   이상으로 강화.
 * - 재정 배경: 실업급여 계정 지난해 1.8조원 적자, 실질 적립금 마이너스 6조원.
 * - 시행: "정부는 연내 관련 법률과 하위법령 개정을 목표로 국회 입법 지원에
 *   나설 계획" — 아직 국회 통과 전, 정부 방안 발표 단계. 대본에는 확정처럼
 *   쓰지 않는다.
 *
 * 재사용(v1 = _owl-ep15-assembly-spec.mjs, 영상 C:/tmp/owl-ep15-videos,
 * 이미지 C:/tmp/owl-ep15-images): 6개 클립.
 *   s3 ← v1 s1(오프닝) / s5 ← v1 s3(22년 만의 개편 발표) / s6 ← v1 s4
 *   (주7일치→주6일치 좌우 대비 보드) / s8 ← v1 s5(월 지급액 198만→176만
 *   감소) / s9 ← v1 s6(지급기간 5개월→5.8개월 연장) / s12 ← v1 s8(국회
 *   통과 전, 정부안 경고 클립보드)
 * 새로 만드는 씬: s1, s2, s4, s7, s10, s11, s13, s14(배경은 v1과 같은
 * 고용노동부 정책 브리핑룸, 초록·네이비 톤).
 *
 * 금박사 handoff 용어: "실업급여 계산"(정확한 내 수급액 계산법 — 금박사
 * 9편 소재, 부엉박사 본문에서는 이름만 언급하고 계산법은 설명하지 않음).
 */

export const OWL_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "owl_assembly_spec_v1",
  scriptStructureVersion: "owl_script_structure_v2",
  episode: 15,
  v1SourceSpec: "_owl-ep15-assembly-spec.mjs",
  scriptType: "C_policy_change",
  geumbaksaHandoffTerm: "실업급여 계산",
  sourceCandidate: "candidate-final-sep-unemployment-benefit-reform-v2",
  title: "실업급여 22년 만의 개편, 내년부터 얼마나 달라질까",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  headerTitle: ["실업급여 22년 만의 개편", "얼마나 달라질까"],

  scenesTimeline:
    "s1 hook_q / s2 hook_stakes / s3 opening / s4 definition / s5 situation / s6 before_after / s7 core_q_answer / s8 point1_who / s9 point1_ratio / s10 point2_how_much / s11 point3_why / s12 point4_fee / s13 caution / s14 summary_check / s15 bridge",

  instagramCaptionHook: "실업급여 받아본 적 있거나 곧 퇴사 앞둔 사람, 이거 내년부터 확 바뀌는 거 알고 있었어?",
  instagramCaptionPoints: [
    "고용노동부가 이번 달 1일, 22년 만에 실업급여 지급 방식을 손보겠다고 발표했어",
    "원래는 무급휴일까지 포함해서 주 7일치로 계산했는데, 이제는 주 6일치로만 계산해",
    "하한액 받는 사람 기준으로 월 지급액이 198만 원에서 176만 원으로, 22만 원 줄어",
    "대신 총액은 그대로야, 5개월 받던 걸 5.8개월로 늘려서 맞춰줘",
    "바꾸는 이유는 역전 현상 때문이야, 최저임금 받고 일할 때보다 쉬면서 받는 실업급여가 더 많았거든",
    "보험료율도 1.8%에서 2.0%로 오르고, 재취업 월급 300만 원 넘으면 남은 보너스도 못 받아",
    "근데 이거 아직 확정은 아니야, 국회를 안 거친 정부안 단계라 그대로 안 될 수도 있어",
  ],
  instagramPriorityTags: [
    "실업급여",
    "구직급여",
    "고용보험",
    "퇴사",
    "재취업",
    "노동정책",
    "정부정책",
    "경제공부",
    "재테크",
    "취업준비",
    "생활경제",
    "경제뉴스",
    "경제상식",
    "부엉박사",
  ],

  emphasisTerms: ["실업급여", "구직급여", "고용노동부", "부엉박사"],

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
      video: "owl_v2_ep15_s1_hook_q_motion.mp4",
      narration: "실업급여 받아본 적 있거나 곧 퇴사 앞둔 사람, 이거 내년부터 확 바뀌는 거 알고 있었어?",
      imageBrief:
        "고용노동부 정책 브리핑룸(초록·네이비 톤, 특정 기관 로고 없음) 새 배경. " +
        "부엉이가 궁금하고 날카로운 표정으로 '실업급여' / '바뀐다?' 큰 글자 2줄 " +
        "카드를 한쪽 날개로 감싸 쥐고 보여주는 자세.",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_hook_stakes",
      role: "hook",
      video: "owl_v2_ep15_s2_hook_stakes_motion.mp4",
      narration: "줄어드는 건지 늘어나는 건지 헷갈리는 사람이 많던데, 사실은 둘 다 맞아. 조건이 붙거든.",
      imageBrief:
        "동일 배경. 부엉이가 '줄어든다? 늘어난다?' 물음표 2개가 적힌 카드를 " +
        "한쪽 날개로 감싸 쥐고 고개를 갸웃하는 궁금한 표정.",
      overlays: [],
    },
    {
      scene: 3,
      key: "s3_opening",
      role: "opening",
      video: "owl_v2_ep15_s3_opening_motion.mp4",
      reuseFrom: "owl_ep15_s1_opening_motion.mp4",
      narration: "안녕, 매일 경제 뉴스를 콕 집어 전해주는 부엉박사야.",
      imageBrief: "재사용(v1 s1 오프닝).",
      overlays: [],
    },
    {
      scene: 4,
      key: "s4_definition",
      role: "one_line_definition",
      video: "owl_v2_ep15_s4_definition_motion.mp4",
      narration: "실업급여, 정확히는 구직급여는 퇴사 뒤 재취업할 때까지 나라가 생활비를 지원해주는 제도야.",
      imageBrief:
        "동일 배경. 부엉이가 '구직급여 = 재취업 생활비 지원' 큰 글자 카드를 " +
        "한쪽 날개로 감싸 쥐고 담담하게 설명하는 표정.",
      overlays: [],
    },
    {
      scene: 5,
      key: "s5_situation",
      role: "fact",
      video: "owl_v2_ep15_s5_situation_motion.mp4",
      reuseFrom: "owl_ep15_s3_fact_motion.mp4",
      narration: "고용노동부가 이번 달 1일, 22년 만에 지급 방식을 손보겠다고 발표했어.",
      imageBrief: "재사용(v1 s3 — '실업급여 22년 만의 개편' 카드).",
      overlays: [],
    },
    {
      scene: 6,
      key: "s6_before_after",
      role: "fact",
      video: "owl_v2_ep15_s6_before_after_motion.mp4",
      reuseFrom: "owl_ep15_s4_mechanism_motion.mp4",
      narration: "원래는 무급휴일까지 포함해서 주 7일치로 계산했는데, 이제는 주 6일치로만 계산해.",
      imageBrief: "재사용(v1 s4 — 보드 '주 7일치' vs '주 6일치' 좌우 대비).",
      overlays: [],
    },
    {
      scene: 7,
      key: "s7_core_q_answer",
      role: "core_question",
      video: "owl_v2_ep15_s7_core_q_answer_motion.mp4",
      narration: "그럼 나한테는 뭐가 달라질까? 답부터 말하면, 매달 받는 돈은 줄고, 대신 받는 기간은 늘어나.",
      imageBrief:
        "동일 배경. 부엉이가 '내 월급은' 대신 '내 실업급여는' / '얼마나 줄까?' " +
        "큰 글자 2줄 카드를 한쪽 날개로 감싸 쥐고, 다른 날개는 턱 근처 생각하는 포즈.",
      overlays: [],
    },
    {
      scene: 8,
      key: "s8_point1_who",
      role: "evidence",
      video: "owl_v2_ep15_s8_point1_who_motion.mp4",
      reuseFrom: "owl_ep15_s5_twist_motion.mp4",
      narration: "첫째, 하한액 받는 사람 기준이야. 월 지급액이 198만 원에서 176만 원으로 줄어.",
      imageBrief: "재사용(v1 s5 — 카드 '월 지급액: 198만원 → 176만원 감소').",
      overlays: [],
    },
    {
      scene: 9,
      key: "s9_point1_ratio",
      role: "evidence",
      video: "owl_v2_ep15_s9_point1_ratio_motion.mp4",
      narration: "지난해 실업급여 받은 사람 열 명 중 여섯 명이 이 하한액 기준이었어.",
      imageBrief:
        "동일 배경. 부엉이가 '수급자 10명 중 6명' 큰 글자와 사람 아이콘이 " +
        "적힌 카드를 한쪽 날개로 감싸 쥐고 설명하는 자세.",
      overlays: [],
    },
    {
      scene: 10,
      key: "s10_point2_how_much",
      role: "evidence",
      video: "owl_v2_ep15_s10_point2_how_much_motion.mp4",
      reuseFrom: "owl_ep15_s6_consequence_motion.mp4",
      narration: "둘째, 대신 총액은 그대로야. 5개월 받던 걸 5.8개월로 늘려서 맞춰줘.",
      imageBrief: "재사용(v1 s6 — 카드 '지급 기간 5개월 → 5.8개월').",
      overlays: [],
    },
    {
      scene: 11,
      key: "s11_point3_why",
      role: "evidence",
      video: "owl_v2_ep15_s11_point3_why_motion.mp4",
      narration: "셋째, 바꾸는 이유는 역전 현상 때문이야. 최저임금 받고 일할 때보다 쉬면서 받는 실업급여가 더 많았거든.",
      imageBrief:
        "동일 배경. 부엉이 옆 바닥에 세운 보드에 '일할 때 193만원 < 쉴 때 " +
        "198만원'이 크게 적혀 있고, 빈 날개로 보드를 가리키는 설명 자세.",
      overlays: [],
    },
    {
      scene: 12,
      key: "s12_point4_fee",
      role: "evidence",
      video: "owl_v2_ep15_s12_point4_fee_motion.mp4",
      narration: "넷째, 보험료율도 1.8%에서 2.0%로 올라. 재취업하고 월급 300만 원 넘으면 남은 보너스도 못 받아.",
      imageBrief:
        "동일 배경. 부엉이가 '보험료율 1.8%→2.0%' 큰 글자가 적힌 카드를 한쪽 " +
        "날개로 감싸 쥐고 진지한 표정.",
      overlays: [],
    },
    {
      scene: 13,
      key: "s13_caution",
      role: "condition",
      video: "owl_v2_ep15_s13_caution_motion.mp4",
      reuseFrom: "owl_ep15_s8_caveat_motion.mp4",
      narration: "그렇다고 이게 확정은 아니야. 아직 국회를 안 거친 정부안 단계라 그대로 안 될 수도 있어.",
      imageBrief: "재사용(v1 s8 — 클립보드형 카드 '국회 통과 전, 아직 정부안').",
      overlays: [],
    },
    {
      scene: 14,
      key: "s14_summary_check",
      role: "action",
      video: "owl_v2_ep15_s14_summary_check_motion.mp4",
      narration: "콕 집어 정리하면, 통과되면 내년부터 주 6일 계산이 적용돼. 먼저 확인할 건 두 가지, 내가 하한액 받는지, 그리고 국회 진행 상황이야.",
      imageBrief:
        "동일 배경. 부엉이 옆 바닥에 세운 보드에 '체크 ① 하한액 여부 ② 국회 " +
        "진행 상황'이 두 줄로 크게 적혀 있고, 빈 날개로 손가락 두 개를 세워 " +
        "보이는 자세.",
      overlays: [],
    },
    {
      scene: 15,
      key: "s15_bridge",
      role: "save",
      video: "owl_v2_ep15_s15_bridge_motion.mp4",
      narration: "실업급여 실제로 얼마 받는지 계산이 헷갈리면 금박사가 이어서 풀어줄게. 궁금한 제도는 댓글로 남겨줘.",
      imageBrief:
        "동일 배경. 부엉이가 밝은 미소로 '실업급여 계산?' 큰 글자 카드를 한쪽 " +
        "날개로 감싸 쥐고 마무리하는 자세.",
      overlays: [],
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findScene(key) {
  return OWL_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
