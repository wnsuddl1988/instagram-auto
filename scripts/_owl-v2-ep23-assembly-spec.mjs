/**
 * 부엉박사 조립 스펙 표시 22편(파일 번호 23, v2 + 품질 체계 v2) — 근로장려금, 정기 신청을 놓쳤어도 11/30까지 기한 후 신청.
 *
 * 파일 이름: 표시 22편 = 파일 번호 23(표시 21편 대환 금리 역전이 파일 ep22). 배포: Owner 지시 시점(제안 금지).
 * 기준: _ai/CURRENT_STANDARDS.md §1 부엉 v2, 규칙 14(배경 2~3구역)·15(품질 체계 v2)·17(훅)·26~29. 유형 D형(나는 어떻게 해야 하나).
 * 대본 v5: 16씬·약 546자(검사기 반드시 수정 0). 1차 TTS(585자)가 120.44초라 CTA 포함 135초대 → 20대 비중·최대액 뒤 반복 문장·정리 씬 반복 문장을 줄여 2차 TTS 109.56초(최대 씬 7.92초, 정렬 밀림 최대 -0.08초).
 * 새 독자 읽기 점검 1회(_ai/owl-ep23-cold-read.md). 대본 문서: _ai/owl-ep23-eitc-script-draft.md. 담당 부엉박사(시민 입장, 규칙 22) · 레인 deadline_benefit · 영역 jobs_income · 제목 모양 number.
 *
 * ★ 핵심 팩트(2026-10-05 원문 확인, 2025년 귀속 근로장려금)★
 * - 국민일보 단독 2026-10-04: 정성호 의원실이 국세청에서 제출받은 자료. 2025년 귀속 정기 신청 기간에 신청하지 않은 가구 24만 3천(5월 기준), 예상 수령액 총 약 2,220억 원.
 *   20대 이하 10만 9천 가구, 전체 미신청자 중 비중 2020년 28.0% → 2024년 36.6% → 2025년 44.9%. 이유 1위 "다른 일로 잊어버렸다" 25.2%, "소득요건이 안 맞는다고 생각" 19.2%.
 *   국세청은 기한 후 신청분(6~11월 신청)이 미반영이라 최종 규모는 줄 수 있다고 설명.
 * - 국세청 국세상담센터 Q&A(call.nts.go.kr): 2025년 귀속 기한후신청 2026-06-02~2026-11-30, 5% 감액(결정금액의 95% 지급). (12/1·10%는 2020년 정책뉴스 수치라 폐기)
 * - 정책뉴스 2026-04-30(korea.kr): 소득 상한(부부합산) 단독 2,200만·홑벌이 3,200만·맞벌이 4,400만 원 미만, 재산 2억 4천만 원 미만(1억 7천만 원 이상은 50% 지급),
 *   최대 단독 165만·홑벌이 285만·맞벌이 330만 원, 신청 홈택스(PC·모바일)·자동응답서비스·장려금 상담센터.
 * - 한 가구 평균 약 91만 원 = 2,220억 ÷ 24만 3천(직접 계산), 156만 원 남짓 = 165만 × 0.95(직접 계산).
 */

const CARD_COMPOSITION =
  "구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.";

const card = (look, line1, line2, longSecond = false) =>
  `부엉이가 ${look} '${line1}'와 '${line2}'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. ${CARD_COMPOSITION.replace("굵고 크게 두 줄,", longSecond ? "굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게)," : "굵고 크게 두 줄,")}`;

const cardMotion = (action, mood) => ({
  type: "card2",
  action: `${action}; only the face and body move while the wings holding the card stay still.`,
  mood,
});
const openMotion = (action, mood) => ({
  type: "open",
  action: `${action}; no props are held.`,
  mood,
});

export const OWL_EP23_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "owl_assembly_spec_v1",
  scriptStructureVersion: "owl_script_structure_v2",
  episode: 23,
  displayEpisode: 22,
  scriptType: "D_action_guide",
  geumbaksaHandoffTerm: null,
  sourceCandidate: "candidate-owl-ep23-eitc-late-application-2026-10-05",
  title: "근로장려금, 아직 신청할 수 있어요",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  headerTitle: ["근로장려금,", "아직 신청할", "수 있어요"],

  // ── 이미지·영상 연출 필드(품질 체계 v2, 규칙 15) ──
  hookType: "T3",
  // 첫 3초 시각 변화 실험(Owner 2026-10-05, CURRENT_STANDARDS A-7 2-2): 부엉 첫 적용 편 = pushin(황소 22편은 impact로 번갈아).
  openingMotion: "pushin",
  imageCharacter: "owl3dv5",
  imagePrefix: "owl_ep23",
  // 소재(국가가 주는 현금·신청)에 맞는 공간 3곳. 직전 편들(환승 역사 홀·금리 비교 전시관·서류 도장 사무실·금고 홀·방범 관제실 등)과 겹치지 않는다.
  // 배경에 글자·숫자·눈금·로고·화면 없음, 큰 빈 벽면 없음.
  sceneBackgrounds: Object.freeze({
    A: {
      label: "세무서 민원 안내 로비(도입·정리·마무리)",
      image:
        "햇살이 드는 밝은 민원 안내 로비. 부엉박사 뒤로 둥근 안내 데스크와 둥근 기둥 두세 개(글자 없는 민트색 둥근 표지판 모양만), 양옆에 큼직한 화분과 둥근 대기 의자가 넓게 펼쳐지고, 바닥은 따뜻한 연베이지 타일과 둥근 러그. 큰 빈 벽면 없이 안내 데스크와 기둥, 식물로 채운다. 따뜻한 크림·연노랑 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      videoStyle: "bright civil service guidance lobby",
      videoStatics: "the round guidance desk, the round pillars with plain blank mint round sign shapes, the large potted plants, the round waiting chairs, and the warm light beige tile floor with a round rug",
    },
    B: {
      label: "장려금 지급 창구 홀(금액·자료 설명)",
      image:
        "밝은 지급 창구 홀. 부엉박사 뒤로 둥근 창구 카운터 여러 개(위에 글자 없는 둥근 금빛 동전 더미 모형만, 숫자·글자 없음)와 높이가 다른 둥근 단상 두세 개가 넓게 펼쳐지고, 양옆 둥근 화분, 바닥은 매끈한 연한 청록 광택 바닥. 큰 빈 벽면 없이 카운터와 단상으로 채운다. 은은한 청록·골드 조명, 저폴리곤 단순화. 글자·숫자·눈금·그래프·간판·화면 없음.",
      videoStyle: "bright subsidy payment counter hall",
      videoStatics: "the round counters with plain golden round coin pile models, the round podiums of different heights, the round potted plants, and the glossy light teal floor",
    },
    C: {
      label: "신청서 작성 코너(대상·신청 방법·주의)",
      image:
        "밝은 신청서 작성 코너. 부엉박사 뒤로 둥근 작성대 여러 개(위에 글자 없는 흰 종이와 펜 모형만)와 둥근 서류함 선반, 둥근 상담 부스 두세 개가 넓게 펼쳐지고, 양옆 둥근 화분, 바닥은 따뜻한 원목 마루와 둥근 러그. 큰 빈 벽면 없이 작성대와 선반, 부스로 채운다. 따뜻한 연두·크림 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      videoStyle: "bright application form writing corner",
      videoStatics: "the round writing desks with plain blank white paper and pen models, the round filing shelves, the round consultation booths, the round potted plants, and the warm wooden floor with a round rug",
    },
  }),

  scenesTimeline:
    "s1 훅 / s2 오프닝 / s3 개념(근로장려금) / s4 상황(국세청 자료 2,220억) / s5 상황(가구당 평균 91만·이유 1위) / s6 핵심질문(11/30까지 기한 후 신청) / s7 첫째 대상(가구 소득 합산) / s8 첫째 대상(홑벌이·맞벌이·재산) / s9 둘째 금액(단독 최대) / s10 둘째 금액(홑벌이·맞벌이 최대) / s11 계산 예시(5% 감액) / s12 셋째 신청 방법 / s13 주의(기간 끝나면 신청 불가) / s14 정리 / s15 확인 두 가지 / s16 저장+댓글",

  instagramCaptionHook: "작년에 일했는데 근로장려금을 안 받았다면, 11월 30일까지는 아직 신청할 수 있어",
  instagramCaptionPoints: [
    "국세청이 국회에 낸 자료로, 2025년 귀속 근로장려금 정기 신청 기간에 신청하지 않은 가구가 24만 3천 가구(5월 기준)였고 받을 수 있었던 돈은 약 2,220억 원이야, 가구당 평균으로 계산하면 약 91만 원이야",
    "20대 이하가 44.9%(10만 9천 가구)로 가장 많았고 이 비중은 2020년 28.0%에서 2024년 36.6%, 2025년 44.9%로 늘었어, 신청 안 한 이유 1위는 '다른 일로 잊어버렸다'(25.2%), 다음은 '소득요건이 안 맞는다고 생각해서'(19.2%)였어",
    "2025년 귀속분 기한 후 신청은 2026년 6월 2일부터 11월 30일까지고, 기한 후에 신청하면 결정금액의 5%가 깎여 95%가 지급돼(국세청 국세상담센터 안내 기준)",
    "소득은 부부합산 총소득이 단독가구 2,200만 원, 홑벌이 3,200만 원, 맞벌이 4,400만 원 미만이어야 하고, 재산은 가구 합계 2억 4천만 원 미만이어야 해(1억 7천만 원 이상이면 50%만 지급), 최대 지급액은 단독 165만 원·홑벌이 285만 원·맞벌이 330만 원이야",
    "신청은 홈택스(PC·모바일)나 손택스 앱에서 하고, 대상인지 헷갈리면 장려금 상담센터(1566-3636)에 물어봐",
    "👉 내 소득과 재산이 기준 아래인지 확인하고, 11월 30일 마감 전에 신청해봐",
    "※ 2025년 귀속 기준 안내고 국세청 심사로 지급 여부와 금액이 정해져, 개인별 지급을 보장하는 게 아니야, 기준과 금액은 매년 바뀔 수 있어",
  ],
  instagramPriorityTags: [
    "근로장려금",
    "근로장려금신청",
    "기한후신청",
    "장려금",
    "국세청",
    "홈택스",
    "손택스",
    "정부지원금",
    "청년지원",
    "저소득가구",
    "경제뉴스",
    "부엉박사",
  ],

  emphasisTerms: ["근로장려금", "기한 후", "홈택스", "부엉박사"],

  captionBoundaryExceptions: Object.freeze([]),
  // TTS가 문장 중간에서 0.2~0.3초 쉴 때 자막이 깜빡 꺼지지 않게 같은 씬 안 짧은 공백을 앞 자막으로 이어 붙인다(조립기 옵션).
  captionGapBridgeSec: 0.3,

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
      video: "owl_v2_ep23_s1_hook_motion.mp4",
      narration: "국가가 주는 돈을 놓친 가구가 24만이야. 일은 했는데 소득이 적었다면 너도 그럴 수 있어.",
      imageBrief: card("놀라고 궁금한 표정으로", "국가가 주는 돈", "놓친 가구 24만"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: cardMotion("the character's expression is wide-eyed and curious, eyebrows raised, as if revealing a surprising number to the viewer", "posing a surprising question to the viewer"),
    },
    {
      scene: 2,
      key: "s2_opening",
      role: "opening",
      video: "owl_v2_ep23_s2_opening_motion.mp4",
      narration: "안녕, 매일 경제 뉴스를 콕 집어 전해주는 부엉박사야.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 살짝 들어 인사하고 다른 날개는 자연스럽게 내린 채 담담하게 미소 짓는 포즈, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: openMotion("the character raises one wing slightly in a friendly greeting while the other wing hangs naturally, smiling calmly and warmly at the viewer", "warmly greeting the viewer"),
    },
    {
      scene: 3,
      key: "s3_concept",
      role: "fact",
      video: "owl_v2_ep23_s3_concept_motion.mp4",
      narration: "그 돈은 근로장려금이야. 일은 하는데 소득이 적은 가구에 국가가 현금을 얹어 주는 제도지.",
      imageBrief: card("또렷하고 친근한 표정으로", "근로장려금은", "현금을 보태 줘요"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: cardMotion("the character's expression is clear and friendly with slight nods, as if explaining what the subsidy is", "clearly explaining the concept"),
    },
    {
      scene: 4,
      key: "s4_situation_amount",
      role: "fact",
      video: "owl_v2_ep23_s4_situation_amount_motion.mp4",
      narration: "국세청이 국회에 낸 자료로, 정기 신청을 안 한 그 가구들이 받을 돈이 약 2,220억 원이었어.",
      imageBrief: card("진지하고 또렷한 표정으로", "안 받은 돈이", "약 2,220억 원"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: cardMotion("the character's expression is serious and clear with slight nods, as if revealing how much money was left unclaimed", "seriously revealing the amount"),
    },
    {
      scene: 5,
      key: "s5_situation_detail",
      role: "fact",
      video: "owl_v2_ep23_s5_situation_detail_motion.mp4",
      narration: "한 가구에 평균 91만 원 꼴이야. 안 한 이유 1위는 '잊어버렸다'야.",
      imageBrief: "부엉이가 한쪽 날개를 이마에 살짝 대고 아차 하는 듯 놀란 표정으로 설명하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "B",
      motion: openMotion("the character touches its forehead lightly with one wing in an oops-I-forgot gesture with a surprised expression while the other wing hangs naturally", "surprised that many people simply forgot"),
    },
    {
      scene: 6,
      key: "s6_core_q",
      role: "core_question",
      video: "owl_v2_ep23_s6_core_q_motion.mp4",
      narration: "그럼 나는 어떻게 해야 할까? 답부터 말하면, 정기 신청은 지났어도 11월 30일까지 기한 후 신청을 할 수 있어.",
      imageBrief: "부엉이가 갸웃하다 확신에 찬 표정으로 한쪽 날개를 들어 손짓하며 설명하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "C",
      motion: openMotion("the character's expression starts curious with a slight head tilt and turns confident while one wing lifts in an explaining gesture and the other hangs naturally", "confidently giving the key answer"),
    },
    {
      scene: 7,
      key: "s7_point1_income",
      role: "evidence",
      video: "owl_v2_ep23_s7_point1_income_motion.mp4",
      narration: "첫째, 대상인지 따져봐. 쉽게 풀면, 지난해 가구 소득을 합쳐서 봐. 혼자 사는 가구는 2,200만 원 미만이야.",
      imageBrief: card("또렷하고 친근한 표정으로", "가구 소득 합산", "혼자는 2,200만 미만", true),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: cardMotion("the character's expression is clear and friendly with slight nods, as if explaining the first step", "clearly explaining the first step"),
    },
    {
      scene: 8,
      key: "s8_point1_asset",
      role: "evidence",
      video: "owl_v2_ep23_s8_point1_asset_motion.mp4",
      narration: "홑벌이는 3,200만 원, 맞벌이는 4,400만 원 미만이야. 재산은 가구를 합쳐 2억 4천만 원 미만이야.",
      imageBrief: card("차분하고 또렷한 표정으로", "홑벌이 3,200만 원", "맞벌이 4,400만 원", true),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: cardMotion("the character's expression is calm and clear with slight nods, as if listing the income limits", "calmly listing the limits"),
    },
    {
      scene: 9,
      key: "s9_point2_single",
      role: "evidence",
      video: "owl_v2_ep23_s9_point2_single_motion.mp4",
      narration: "둘째, 얼마를 받는지 봐. 쉽게 풀면, 혼자 사는 가구는 최대 165만 원까지 받아.",
      imageBrief: card("또렷하고 반가운 표정으로", "혼자 사는 가구", "최대 165만 원"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: cardMotion("the character's expression is clear and pleasantly surprised with slight nods, as if revealing the maximum amount", "clearly revealing the maximum"),
    },
    {
      scene: 10,
      key: "s10_point2_others",
      role: "evidence",
      video: "owl_v2_ep23_s10_point2_others_motion.mp4",
      narration: "홑벌이는 최대 285만 원, 맞벌이는 최대 330만 원이야.",
      imageBrief: card("또렷하고 친근한 표정으로", "홑벌이 최대 285만", "맞벌이 최대 330만", true),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: cardMotion("the character's expression is clear and friendly with slight nods, as if adding the other household types", "clearly adding the other amounts"),
    },
    {
      scene: 11,
      key: "s11_point2_example",
      role: "evidence",
      video: "owl_v2_ep23_s11_point2_example_motion.mp4",
      narration: "기한 후에 신청하면 5%가 깎여서, 165만 원 받을 사람은 156만 원 남짓 받는 거야.",
      imageBrief: "부엉이가 눈을 가늘게 뜨고 계산하듯 신중한 표정으로 한쪽 날개를 턱 아래에 대고 생각하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "close",
      bg: "B",
      motion: openMotion("the character narrows its eyes in a thoughtful calculating look while resting one wing under its chin and the other hangs naturally", "thoughtfully working out the reduced amount"),
    },
    {
      scene: 12,
      key: "s12_point3_apply",
      role: "evidence",
      video: "owl_v2_ep23_s12_point3_apply_motion.mp4",
      narration: "셋째, 신청은 홈택스나 손택스 앱에서 해. 쉽게 풀면, 앱의 장려금 신청 메뉴를 누르면 돼.",
      imageBrief: card("또렷하고 친근한 표정으로", "홈택스, 손택스 앱", "장려금 신청 메뉴", true),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: cardMotion("the character's expression is clear and friendly with slight nods, as if explaining where to apply", "clearly explaining where to apply"),
    },
    {
      scene: 13,
      key: "s13_caution",
      role: "condition",
      video: "owl_v2_ep23_s13_caution_motion.mp4",
      narration: "그렇다고 미루면 안 돼. 이 기간이 끝나면 지난해 소득분은 더 신청할 수 없거든.",
      imageBrief: card("신중하고 단호한 표정으로", "이 기간이 끝나면", "신청할 수 없어요"),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: cardMotion("the character's expression is careful and firm, eyebrows slightly furrowed, as if warning that the window will close", "firmly cautioning about the deadline"),
    },
    {
      scene: 14,
      key: "s14_summary",
      role: "action",
      video: "owl_v2_ep23_s14_summary_motion.mp4",
      narration: "콕 집어 정리하면, 아직 신청할 수 있어. 지금 먼저 확인할 건 두 가지야.",
      imageBrief: card("확신에 찬 표정으로", "아직 신청", "할 수 있어요"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: cardMotion("the character's expression is confident and knowing with slight nods, and it briefly raises its head as if counting two things", "confidently delivering the one-line summary"),
    },
    {
      scene: 15,
      key: "s15_check_two",
      role: "action",
      video: "owl_v2_ep23_s15_check_two_motion.mp4",
      narration: "하나는 내 소득과 재산이 기준 아래인지, 다른 하나는 마감 전에 홈택스로 신청하는 거지.",
      imageBrief: "부엉이가 한쪽 날개를 들어 두 가지를 하나씩 짚어 가듯 또렷하고 친근하게 설명하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: openMotion("the character lifts one wing and ticks off two points one after the other with a clear, friendly explanatory expression while the other wing hangs naturally", "clearly pointing out the two things to check"),
    },
    {
      scene: 16,
      key: "s16_save",
      role: "save",
      video: "owl_v2_ep23_s16_save_motion.mp4",
      narration: "이 두 가지는 저장해 두고, 신청하기 전에 다시 확인해. 궁금한 제도는 댓글로 남겨줘.",
      imageBrief: "부엉이가 밝은 미소로 한쪽 날개를 가볍게 흔들고 다른 날개는 자연스럽게 내린 마무리 포즈, 소품 없이 빈 날개.",
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: openMotion("the character smiles brightly and waves one wing lightly in a friendly goodbye while the other wing hangs naturally relaxed", "warmly saying goodbye and inviting comments"),
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findOwlEp23Scene(key) {
  return OWL_EP23_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
