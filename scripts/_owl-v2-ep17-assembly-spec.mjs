/**
 * 부엉박사 조립 스펙 17편(v2 재제작) — 2027년 최저임금 확정, 실업급여
 * 하한액도 같이 오른다.
 *
 * 기준: _ai/CURRENT_STANDARDS.md §1 "씬 구조 v2", §7. 유형: C형(제도
 * 변경 → 나한테 뭐가 달라지나). 배포 예정 짝: 금박사 신규 11편(파일
 * ep11, 최저임금 받을 때 헷갈리는 "주휴수당" 소재, 아직 제작 전).
 * 부엉박사 본문에서는 "주휴수당" 이름만 언급하고 설명하지 않는다 —
 * 금박사가 이어받는다(§7 표).
 *
 * ★ v1(2026-09-24 작성, `_owl-ep16-assembly-spec.mjs`, 옛 10씬 구조)의
 * 핵심 팩트를 재확인(2026-09-27, WebSearch)한 결과 그대로 유효하다:
 * - 2027년 최저임금 시간급 10,700원(2026년 10,320원 대비 +380원,
 *   +3.7%), 2027-01-01 시행 확정. 고용노동부 2026-08-05 고시
 *   제2026-60호. 출처: 고용노동부 공식 발표(moel.go.kr), KB의 생각.
 * - 월 환산액(주 40시간, 월 209시간 기준, 주휴수당 포함) 223만
 *   6,300원 — v1 표기 "223만 6천 원"은 반올림 표현으로 정확.
 * - 인상률 추이 재확인: 2025년 1.7% → 2026년 2.9% → 2027년 3.7%로
 *   최근 3년 중 가장 높은 인상률(신규 s6에 반영, v1에는 없던 정보).
 * - 실업급여 최저 지급액이 최저임금의 80%×8시간으로 연동 계산되는
 *   구조는 15편에서 이미 확인된 내용과 일치, 그대로 유효.
 *
 * ★ 씬 구조: 처음부터 CURRENT_STANDARDS §1 v2 구조(핵심질문·연결 포함)로
 * 설계했다(16편에서 배운 교훈 — 9.5초 규칙 위반 시 자연스러운 문장
 * 단위로만 나누고, 인위적으로 씬을 잘게 쪼개지 않는다). TTS 1차 실측
 * 결과 전 씬이 3.17~8.21초로 9.5초 규칙을 여유 있게 통과해 씬 재구성이
 * 필요 없었다.
 *
 * 재사용(v1 = _owl-ep16-assembly-spec.mjs, 영상 C:/tmp/owl-ep16-videos,
 * 이미지 C:/tmp/owl-ep16-images), 전부 "발화 7초 이내" 기준(CURRENT_
 * STANDARDS 원문) 통과분만:
 *   s3 ← v1 s1(오프닝, 8초 클립, 발화 3.37초)
 *   s5 ← v1 s3(최저임금 10,700원 확정 카드, 10초 클립, 발화 5.46초)
 *   s7 ← v1 s4(월 223만 6천원 카드, 8초 클립, 발화 4.82초)
 *   s9 ← v1 s6(최저임금→실업급여 최저금액 도식 보드, 8초 클립, 발화 5.053초)
 *   s11 ← v1 s7(실업급여 최저금액도 UP 카드, 8초 클립, 발화 4.555초)
 *   s12 ← v1 s9(15편 하한액의 비밀 카드, 8초 클립, 발화 4.639초)
 *   s13 ← v1 s8(퇴사·실직하면 내 얘기 카드, 8초 클립, 발화 6.08초)
 *   s15 ← v1 s10(알아두면 쓸모있는 정보 카드, 8초 클립, 발화 5.232초)
 * 새로 만드는 씬(배경은 v1과 같은 최저임금위원회 심의장): s1, s2, s4,
 * s6, s8, s10, s14, s16.
 *   - s1·s2는 v1과 훅·오프닝 순서가 바뀌어(v2 구조는 훅이 맨 앞) 신규.
 *   - s4는 정의(v1엔 없던 "최저임금이 뭔지" 한 줄 정의) 신규.
 *   - s6은 인상률 3.7%(최근 3년 최고치) 신규 정보, v1에 없음.
 *   - s8은 핵심질문("나는 상관없나?")+즉답 구조, v1엔 없음.
 *   - s10은 실업급여 최저금액 계산식(최저임금의 80%×8시간) 신규 상세.
 *   - s14는 정리 문구 전면 재구성(카드 문구 자체가 달라져 재사용 불가).
 *   - s16은 금박사(주휴수당) handoff 연결, v1엔 없던 마무리 유형.
 *
 * 금박사 handoff 용어: "주휴수당"(정확한 계산법 설명 — 금박사 신규
 * 11편(파일 ep11) 소재, 부엉박사 본문에서는 이름만 언급하고 계산법은
 * 설명하지 않음).
 */

export const OWL_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "owl_assembly_spec_v1",
  scriptStructureVersion: "owl_script_structure_v2",
  episode: 17,
  v1SourceSpec: "_owl-ep16-assembly-spec.mjs",
  scriptType: "C_policy_change",
  geumbaksaHandoffTerm: "주휴수당",
  sourceCandidate: "candidate-final-sep-minimum-wage-2027-unemployment-benefit-link",
  title: "최저임금 올랐다는데, 나랑 상관없다고?",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  headerTitle: ["2027년 최저임금 확정", "실업급여도 같이 오른다"],

  scenesTimeline:
    "s1 hook_q / s2 hook_stakes / s3 opening / s4 definition / s5 fact_amount / s6 fact_rate / s7 fact_monthly / s8 core_q_answer / s9 point1_link / s10 point1_formula / s11 point1_result / s12 point2_callback / s13 caution / s14 summary / s15 checklist / s16 bridge",

  instagramCaptionHook: "최저임금 또 올랐다는데, 나랑 상관없다고 넘기면 오산이야",
  instagramCaptionPoints: [
    "내년 최저임금이 시간당 10,700원으로 확정됐어, 올해보다 380원 올랐어",
    "인상률로 보면 3.7%인데, 최근 3년 중 가장 높은 수치야",
    "주 40시간 기준으로 환산하면 한 달에 223만 6천 원 정도야",
    "최저임금 안 받는 사람도 상관없는 게 아니야 — 실업급여 최저 금액도 이 최저임금 기준으로 정해지거든",
    "구체적으로는 최저임금의 80%에 하루 8시간을 곱해서 계산해",
    "그래서 최저임금이 오르면, 나중에 내가 받을 실업급여 최저 금액도 같이 올라가는 거야",
    "당장 상관없어 보여도, 퇴사하거나 실직하면 이 숫자가 바로 내 얘기가 돼",
  ],
  instagramPriorityTags: [
    "최저임금",
    "실업급여",
    "고용보험",
    "노동정책",
    "정부정책",
    "재취업",
    "취업준비",
    "경제공부",
    "재테크",
    "경제뉴스",
    "경제상식",
    "부엉박사",
  ],

  emphasisTerms: ["최저임금", "실업급여", "부엉박사"],

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
      video: "owl_v2_ep17_s1_hook_q_motion.mp4",
      narration: "최저임금 올랐다는데, 나랑 상관없다고 넘겼어?",
      imageBrief:
        "최저임금위원회 심의장(둥근 회의 테이블과 위원석 명패, 특정 기관 " +
        "로고 없음) 새 배경. 부엉이가 궁금하고 날카로운 표정으로 " +
        "'최저임금' / '나랑 상관없다?' 큰 글자 2줄 카드를 한쪽 날개로 " +
        "감싸 쥐고 보여주는 자세.",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_hook_stakes",
      role: "hook",
      video: "owl_v2_ep17_s2_hook_stakes_motion.mp4",
      narration: "근데 생각보다 훨씬 많은 사람한테 영향을 주는 얘기야.",
      imageBrief:
        "동일 배경. 부엉이가 '생각보다 많은 사람' 큰 글자와 사람 여럿 " +
        "실루엣 아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 눈이 커진 " +
        "놀란 표정.",
      overlays: [],
    },
    {
      scene: 3,
      key: "s3_opening",
      role: "opening",
      video: "owl_v2_ep17_s3_opening_motion.mp4",
      reuseFrom: "owl_ep16_s1_opening_motion.mp4",
      narration: "안녕, 매일 경제 뉴스를 콕 집어 전해주는 부엉박사야.",
      imageBrief: "재사용(v1 s1 오프닝, 8초 클립, 발화 3.37초로 여유 충분).",
      overlays: [],
    },
    {
      scene: 4,
      key: "s4_definition",
      role: "one_line_definition",
      video: "owl_v2_ep17_s4_definition_motion.mp4",
      narration: "최저임금은 회사가 근로자에게 시간당 반드시 줘야 하는 최소 급여야.",
      imageBrief:
        "동일 배경. 부엉이가 '최저임금 = 시간당 최소 급여' 큰 글자 카드를 " +
        "한쪽 날개로 감싸 쥐고 담담하게 설명하는 표정.",
      overlays: [],
    },
    {
      scene: 5,
      key: "s5_fact_amount",
      role: "fact",
      video: "owl_v2_ep17_s5_fact_amount_motion.mp4",
      reuseFrom: "owl_ep16_s3_fact_motion.mp4",
      narration: "내년 최저임금이 시간당 만 700원으로 확정됐어, 올해보다 380원 올랐어.",
      imageBrief: "재사용(v1 s3 — '최저임금 10,700원 확정' 카드, 10초 클립, 발화 5.46초).",
      overlays: [],
    },
    {
      scene: 6,
      key: "s6_fact_rate",
      role: "fact",
      video: "owl_v2_ep17_s6_fact_rate_motion.mp4",
      narration: "인상률로 보면 3.7퍼센트인데, 최근 3년 중 가장 높은 수치야.",
      imageBrief:
        "동일 배경. 부엉이가 '3.7% 인상' 큰 글자와 '최근 3년 최고치' 작은 " +
        "부제, 상승 화살표 아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 " +
        "확신에 찬 표정으로 보여주는 자세.",
      overlays: [],
    },
    {
      scene: 7,
      key: "s7_fact_monthly",
      role: "fact",
      video: "owl_v2_ep17_s7_fact_monthly_motion.mp4",
      reuseFrom: "owl_ep16_s4_fact_motion.mp4",
      narration: "주 40시간 기준으로 환산하면 한 달에 223만 6천 원 정도야.",
      imageBrief: "재사용(v1 s4 — '월 223만 6천원' 카드, 8초 클립, 발화 4.82초).",
      overlays: [],
    },
    {
      scene: 8,
      key: "s8_core_q_answer",
      role: "core_question",
      video: "owl_v2_ep17_s8_core_q_answer_motion.mp4",
      narration: "그럼 최저임금 안 받는 나는 상관없는 걸까? 답부터 말하면, 그렇지 않아.",
      imageBrief:
        "동일 배경. 부엉이가 '나는' / '상관없을까?' 큰 글자 2줄 카드를 " +
        "한쪽 날개로 감싸 쥐고, 다른 날개는 턱 근처 생각하는 포즈.",
      overlays: [],
    },
    {
      scene: 9,
      key: "s9_point1_link",
      role: "evidence",
      video: "owl_v2_ep17_s9_point1_link_motion.mp4",
      reuseFrom: "owl_ep16_s6_evidence_motion.mp4",
      narration: "실업급여로 받을 수 있는 최저 금액이 바로 이 최저임금 기준으로 정해지거든.",
      imageBrief:
        "재사용(v1 s6 — 바닥에 세운 큰 보드에 '최저임금'과 '실업급여 최저 " +
        "금액' 두 글자 상자를 화살표로 잇는 도식, 8초 클립, 발화 5.053초).",
      overlays: [],
    },
    {
      scene: 10,
      key: "s10_point1_formula",
      role: "evidence",
      video: "owl_v2_ep17_s10_point1_formula_motion.mp4",
      narration: "구체적으로는 최저임금의 80퍼센트에 하루 8시간을 곱해서 계산해.",
      imageBrief:
        "동일 배경. 부엉이가 '최저임금 × 80% × 8시간' 큰 글자 수식 카드를 " +
        "한쪽 날개로 감싸 쥐고 또박또박 설명하는 진지한 표정으로 보여주는 " +
        "자세.",
      overlays: [],
    },
    {
      scene: 11,
      key: "s11_point1_result",
      role: "evidence",
      video: "owl_v2_ep17_s11_point1_result_motion.mp4",
      reuseFrom: "owl_ep16_s7_evidence_motion.mp4",
      narration: "그래서 최저임금이 오르면, 실업급여 최저 금액도 자동으로 같이 올라가.",
      imageBrief: "재사용(v1 s7 — '실업급여 최저 금액도 UP' 카드, 8초 클립, 발화 4.555초).",
      overlays: [],
    },
    {
      scene: 12,
      key: "s12_point2_callback",
      role: "evidence",
      video: "owl_v2_ep17_s12_point2_callback_motion.mp4",
      reuseFrom: "owl_ep16_s9_recommendation_motion.mp4",
      narration: "15편에서 본 실업급여 하한액, 매년 바뀌던 이유가 바로 이거였어.",
      imageBrief: "재사용(v1 s9 — '15편 하한액의 비밀' 카드, 8초 클립, 발화 4.639초).",
      overlays: [],
    },
    {
      scene: 13,
      key: "s13_caution",
      role: "condition",
      video: "owl_v2_ep17_s13_caution_motion.mp4",
      reuseFrom: "owl_ep16_s8_consequence_motion.mp4",
      narration: "당장 최저임금 안 받는 사람도, 퇴사하거나 실직하면 이 숫자가 바로 내 얘기가 돼.",
      imageBrief: "재사용(v1 s8 — '퇴사·실직하면 내 얘기' 카드, 8초 클립, 발화 6.08초).",
      overlays: [],
    },
    {
      scene: 14,
      key: "s14_summary",
      role: "action",
      video: "owl_v2_ep17_s14_summary_motion.mp4",
      narration: "정리하면, 최저임금 인상은 나중에 내가 받을 실업급여 금액까지 함께 올린다는 뜻이야.",
      imageBrief:
        "동일 배경. 부엉이가 '최저임금 UP,' / '실업급여도 UP' 큰 글자 2줄 " +
        "카드를 한쪽 날개로 감싸 쥐고 확신에 찬 표정으로 보여주는 자세.",
      overlays: [],
    },
    {
      scene: 15,
      key: "s15_checklist",
      role: "action",
      video: "owl_v2_ep17_s15_checklist_motion.mp4",
      reuseFrom: "owl_ep16_s10_action_motion.mp4",
      narration: "먼저 확인할 건 한 가지, 내가 받을 실업급여 최저 금액이 지금 얼마인지야.",
      imageBrief: "재사용(v1 s10 — '알아두면 쓸모있는 정보' 카드, 8초 클립, 발화 5.232초).",
      overlays: [],
    },
    {
      scene: 16,
      key: "s16_bridge",
      role: "save",
      video: "owl_v2_ep17_s16_bridge_motion.mp4",
      narration: "최저임금 받을 때 주휴수당까지 제대로 챙기고 있는지 헷갈리면 금박사가 이어서 풀어줄게. 궁금한 제도는 댓글로 남겨줘.",
      imageBrief:
        "동일 배경. 부엉이가 밝은 미소로 '주휴수당은?' 큰 글자 카드를 한쪽 " +
        "날개로 감싸 쥐고 마무리하는 자세.",
      overlays: [],
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findScene(key) {
  return OWL_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
