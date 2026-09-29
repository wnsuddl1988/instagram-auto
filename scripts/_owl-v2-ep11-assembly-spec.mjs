/**
 * 부엉박사 조립 스펙 11편(v2 재제작 첫 편) — 청약예금·부금·저축의 주택청약
 * 종합저축 전환 기한 1년 연장 + 기존 가입기간 금리 인정.
 *
 * 기준: _ai/CURRENT_STANDARDS.md §1 "씬 구조 v2", §7(재고 전면 v2 재제작).
 * 유형: C형(나한테 뭐가 달라지나). 배포 2026-09-26(토), 같은 날 금박사 5편
 * (파일 ep7 예금자보호) — 마지막 씬에서 "예금자보호"를 금박사에게 넘긴다.
 *
 * 출처(2026-09-26 재확인): 국토교통부 2026-09-23 발표. 파이낸셜뉴스
 * (fnnews.com/news/202609231220066257), 아주경제(ajunews.com/view/
 * 20260923162340215), 데일리안(dailian.co.kr/news/view/1694104).
 * - 입주자저축(청약예금·부금·저축) → 주택청약종합저축 전환 기한 2026-09-30
 *   → 2027-09-30 1년 연장(전환제도 2024-10 시행).
 * - 금리: 가입기간에 따라 연 2.3~3.1%, 2년 이상 최고 3.1%. 예전엔 전환 후
 *   종합저축 가입기간만 따져 최고금리까지 2년을 기다려야 했음 → 이번에 종전
 *   가입기간을 합산.
 * - 청약 실적: 기존 청약 가능 주택 유형은 기존 가입기간·납입실적 그대로
 *   인정, 새로 가능해진 유형은 전환 이후분만 반영.
 * - 전환: 가입 은행 영업점이나 모바일 앱.
 * - 되돌리기 불가·예금자보호 제외: v1(_owl-ep17) 조사 내용 유지.
 * - s10 계산 예시: 1,000만 원 × 3.1% = 31만 원, × 2.3% = 23만 원(세전, 단순
 *   계산). "약"으로 표기.
 *
 * 날짜는 절대 날짜로만 쓴다("이번 주/이번 달" 금지 — v1은 배포일이 밀리면
 * 틀려지는 표현이 있었음). v1의 "이번 주 안에 확인 안 하면 손해" 긴급함은
 * 기한 연장 소재와 맞지 않아 쓰지 않는다.
 *
 * 재사용(v1 = _owl-ep17-assembly-spec.mjs, C:/tmp/owl-ep17-videos): 이미지
 * 카드 문구가 새 대본과 맞는 9개 클립을 그대로 쓴다. v1 클립은 8초(s3만
 * 10초)라 재사용 씬 발화는 7초(10초 클립은 9초) 이내.
 *   s3 ← v1 s1_opening / s4 ← v1 s4_definition(재생성본) / s5 ← v1 s5 /
 *   s6 ← v1 s3_fact(10초) / s8 ← v1 s7 / s9 ← v1 s8 / s11 ← v1 s6 /
 *   s12 ← v1 s9 / s14 ← v1 s10_action
 * 새로 만드는 씬: s1, s2, s7, s10, s13(배경은 v1과 같은 주택청약 상담 창구).
 */

export const OWL_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "owl_assembly_spec_v1",
  scriptStructureVersion: "owl_script_structure_v2",
  episode: 11,
  v1SourceSpec: "_owl-ep17-assembly-spec.mjs",
  scriptType: "C_policy_change",
  geumbaksaHandoffTerm: "예금자보호",
  sourceCandidate: "candidate-final-sep-housing-subscription-conversion-extension-v2",
  title: "청약통장 바꾸기만 하면 금리가 3.1%, 이번에 뭐가 달라졌을까",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  headerTitle: ["옛날 청약통장", "바꾸면 금리 3.1%"],

  scenesTimeline:
    "s1 hook_q / s2 hook_stakes / s3 opening / s4 definition / s5 definition2 / s6 situation / s7 core_q_answer / s8 point1_before / s9 point1_now / s10 calc / s11 point2_record / s12 caution / s13 summary_check / s14 bridge",

  instagramCaptionHook: "청약예금이나 청약부금 갖고 있다면, 통장 바꾸는 기한이 늘어난 것보다 더 중요한 게 바뀌었어",
  instagramCaptionPoints: [
    "국토교통부가 9월 23일, 옛날 청약통장을 주택청약종합저축으로 바꾸는 기한을 2027년 9월 30일까지 1년 늘렸어",
    "바꾸면 국민주택이랑 민영주택 둘 다 신청할 수 있어",
    "예전엔 바꾸는 순간 가입기간이 새로 시작됐는데, 이제는 옛날 통장 가입기간까지 합쳐줘서 2년이 넘었으면 바로 최고 연 3.1%야",
    "1,000만 원 기준 1년 이자로 따지면 약 31만 원, 예전 방식이었으면 약 23만 원이야",
    "단, 새로 신청할 수 있게 된 쪽 청약 실적은 바꾼 날부터 다시 쌓이고, 한 번 바꾸면 되돌릴 수 없고 예금자보호 대상에서도 빠져",
    "전환은 가입한 은행 앱이나 창구에서 할 수 있어 👉 먼저 내 가입기간부터 확인해봐",
  ],
  instagramPriorityTags: [
    "청약통장",
    "주택청약",
    "청약예금",
    "청약부금",
    "청약저축",
    "종합저축",
    "내집마련",
    "부동산",
    "재테크",
    "경제공부",
    "경제뉴스",
    "경제상식",
    "금융상식",
    "지식콘텐츠",
    "부엉박사",
  ],

  emphasisTerms: ["청약통장", "종합저축", "국토교통부", "3.1%", "예금자보호", "부엉박사"],

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
      video: "owl_v2_ep11_s1_hook_q_motion.mp4",
      narration: "청약예금이나 청약부금 갖고 있는 사람, 9월 30일이 마감이던 통장 전환, 아직 안 늦은 거 알고 있었어?",
      imageBrief:
        "v1과 같은 주택청약 상담 창구 배경. 부엉이가 큰 벽걸이 달력 앞에 서서, " +
        "'9월 30일 마감?'이라는 큰 글자 2줄 카드를 한쪽 날개로 감싸 쥐고 " +
        "눈썹을 치켜올린 궁금한 표정. 달력은 벽에 고정, 날짜 숫자는 크게 1개만.",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_hook_stakes",
      role: "hook",
      video: "owl_v2_ep11_s2_hook_stakes_motion.mp4",
      narration: "근데 대부분 기한만 늘어난 줄 알아. 이번엔 금리 계산법까지 바뀌어서, 모르고 두면 이자를 덜 받을 수 있어.",
      imageBrief:
        "동일 배경 연속. 바닥에 세운 큰 보드에 '기한만?' 과 '금리도 바뀜' 두 줄을 " +
        "큰 글자로. 부엉이는 보드 옆에서 빈 날개로 보드를 가리키는 진지한 표정.",
      overlays: [],
    },
    {
      scene: 3,
      key: "s3_opening",
      role: "opening",
      video: "owl_v2_ep11_s3_opening_motion.mp4",
      reuseFrom: "owl_ep17_s1_opening_motion.mp4",
      narration: "안녕, 매일 경제 뉴스를 콕 집어 전해주는 부엉박사야.",
      imageBrief: "재사용(v1 s1 오프닝 — 인사 포즈, 소품 없음).",
      overlays: [],
    },
    {
      scene: 4,
      key: "s4_definition",
      role: "one_line_definition",
      video: "owl_v2_ep11_s4_definition_motion.mp4",
      reuseFrom: "owl_ep17_s4_definition_motion.mp4",
      narration: "청약예금·부금은 민영주택만, 청약저축은 국민주택만 신청할 수 있는 옛날 청약통장이야.",
      imageBrief: "재사용(v1 s4 — 바닥 보드 '청약예금·부금 → 민영주택 / 청약저축 → 국민주택', 재생성본).",
      overlays: [],
    },
    {
      scene: 5,
      key: "s5_definition2",
      role: "one_line_definition",
      video: "owl_v2_ep11_s5_definition2_motion.mp4",
      reuseFrom: "owl_ep17_s5_definition_motion.mp4",
      narration: "이걸 주택청약종합저축으로 바꾸면, 국민주택이랑 민영주택 둘 다 신청할 수 있게 되지.",
      imageBrief: "재사용(v1 s5 — 카드 '국민주택 + 민영주택 둘 다 OK').",
      overlays: [],
    },
    {
      scene: 6,
      key: "s6_situation",
      role: "fact",
      video: "owl_v2_ep11_s6_situation_motion.mp4",
      reuseFrom: "owl_ep17_s3_fact_motion.mp4",
      narration: "국토교통부가 9월 23일, 이 전환 기한을 2027년 9월 30일까지 1년 연장했어.",
      imageBrief: "재사용(v1 s3 — 카드 '전환기한 1년 연장', 10초 클립).",
      overlays: [],
    },
    {
      scene: 7,
      key: "s7_core_q_answer",
      role: "core_question",
      video: "owl_v2_ep11_s7_core_q_answer_motion.mp4",
      narration: "그럼 나한테는 뭐가 달라질까? 답부터 말하면, 바꿀 때 손해 보던 금리가 사라졌어.",
      imageBrief:
        "동일 배경 연속. 부엉이가 큰 물음표 하나만 그려진 카드를 한쪽 날개로 " +
        "감싸 쥐고, 빈 날개는 턱 근처에서 생각하는 포즈, 날카로운 눈빛. 카드에 글자 없음.",
      overlays: [],
    },
    {
      scene: 8,
      key: "s8_point1_before",
      role: "evidence",
      video: "owl_v2_ep11_s8_point1_before_motion.mp4",
      reuseFrom: "owl_ep17_s7_evidence_motion.mp4",
      narration: "첫째, 예전엔 바꾸면 가입기간이 0부터 다시 시작돼서, 최고 금리까지 2년을 기다려야 했거든.",
      imageBrief: "재사용(v1 s7 — 카드 '예전: 가입기간 0부터 다시').",
      overlays: [],
    },
    {
      scene: 9,
      key: "s9_point1_now",
      role: "evidence",
      video: "owl_v2_ep11_s9_point1_now_motion.mp4",
      reuseFrom: "owl_ep17_s8_evidence_motion.mp4",
      narration: "이제는 옛날 통장 가입기간까지 합쳐줘서, 2년 넘었으면 바로 최고 연 3.1%야.",
      imageBrief: "재사용(v1 s8 — 카드 '연 3.1% 즉시 적용').",
      overlays: [],
    },
    {
      scene: 10,
      key: "s10_calc",
      role: "evidence",
      video: "owl_v2_ep11_s10_calc_motion.mp4",
      narration: "쉽게 풀면, 1,000만 원 기준 1년 이자가 약 31만 원이야. 예전 방식이면 약 23만 원이었지.",
      imageBrief:
        "동일 배경 연속. 바닥에 세운 큰 보드에 큰 글자 2줄: '이제 31만 원' / " +
        "'예전 23만 원'. 부엉이는 보드 옆에서 빈 날개로 윗줄을 가리키는 확신에 찬 표정.",
      overlays: [],
    },
    {
      scene: 11,
      key: "s11_point2_record",
      role: "condition",
      video: "owl_v2_ep11_s11_point2_record_motion.mp4",
      reuseFrom: "owl_ep17_s6_condition_motion.mp4",
      narration: "둘째, 원래 되던 쪽 실적은 그대로지만, 새로 열린 쪽 실적은 바꾼 날부터 다시 쌓여.",
      imageBrief: "재사용(v1 s6 — 카드 '실적은 전환일부터 새로 시작').",
      overlays: [],
    },
    {
      scene: 12,
      key: "s12_caution",
      role: "condition",
      video: "owl_v2_ep11_s12_caution_motion.mp4",
      reuseFrom: "owl_ep17_s9_condition_motion.mp4",
      narration: "그렇다고 무작정 바꾸면 안 돼. 한 번 바꾸면 되돌릴 수 없고, 예금자보호 대상에서도 빠지거든.",
      imageBrief: "재사용(v1 s9 — 카드 '되돌리기 불가 · 예금자보호 제외').",
      overlays: [],
    },
    {
      scene: 13,
      key: "s13_summary_check",
      role: "action",
      video: "owl_v2_ep11_s13_summary_check_motion.mp4",
      narration: "콕 집어 정리하면, 바꿔도 가입기간은 그대로야. 먼저 볼 건 내 가입기간이랑, 국민주택·민영주택 중 어디를 노리는지야.",
      imageBrief:
        "동일 배경 연속. 바닥에 세운 큰 보드에 체크 표시 2칸, 큰 글자 1줄씩: " +
        "'내 가입기간' / '국민? 민영?'. 부엉이는 보드 옆에서 빈 날개를 가볍게 드는 설명 포즈.",
      overlays: [],
    },
    {
      scene: 14,
      key: "s14_bridge",
      role: "save",
      video: "owl_v2_ep11_s14_bridge_motion.mp4",
      reuseFrom: "owl_ep17_s10_action_motion.mp4",
      // 금박사 5편(파일 ep7)은 예금자보호 일반(한도 1억·은행별 계산·직접 신청)을 다루고
      // 청약통장 제외 이유는 다루지 않는다 → "한도"로 넘겨 내용이 이어지게 한다.
      narration: "전환은 가입한 은행 앱이나 창구에서 바로 돼. 예금자보호 한도가 궁금하면, 금박사가 이어서 풀어줄게.",
      imageBrief: "재사용(v1 s10 — 카드 '은행 앱·창구에서 확인').",
      overlays: [],
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findScene(key) {
  return OWL_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
