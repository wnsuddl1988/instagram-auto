/**
 * 부엉박사 조립 스펙 표시 21편(파일 번호 22, v2 + 품질 체계 v2) — 대출 갈아타기(대환) 금리 역전, 내 조건으로 따져볼 것.
 *
 * 파일 이름: 표시 21편 = 파일 번호 22(표시 20편 은행 정보 유출이 파일 ep21). 배포: Owner 지시 시점(제안 금지).
 * 기준: _ai/CURRENT_STANDARDS.md §1 부엉 v2, 규칙 14(배경 2~3구역)·15(품질 체계 v2)·17(훅)·26~29. 유형 D형(나는 어떻게 해야 하나).
 * 대본 v2: 15씬·553자(검사기 반드시 수정 0, 확인 권장 6). 17씬 초안(638자)은 TTS가 130.36초에 씬 11이 9.7초라 길이·씬 길이 초과 → 정의 씬·계산 예시 씬을 빼고 비용 설명을 두 씬으로 나눠 다시 만들었다(TTS output-v2 107.64초, 최대 씬 7.77초).
 * 새 독자 읽기 점검 3회(_ai/owl-ep22-cold-read.md). 대본 문서: _ai/owl-ep22-refi-script-draft.md. 담당 부엉박사(시민 입장, 규칙 22) · 레인 money_calc · 영역 loans_credit · 제목 모양 contrast.
 *
 * ★ 핵심 팩트(2026-10-02 원문 확인, 올해 7월 기준 자료)★
 * - 금융감독원 자료(국회 정무위 박성훈 의원실 제출), 최초 보도 2026-09-27(뉴데일리 원문 + 아시아투데이·이투데이·SBS Biz·파이낸셜뉴스·한국경제 등).
 * - 주담대: 비교 대상 16개 은행 중 11곳(68.8%)에서 대환(갈아타기) 평균금리가 일반 신규보다 높음. 최대 격차 iM뱅크 신규 4.84% → 대환 7.17%(2.33%p, 대사엔 은행명 비공개).
 * - 5대 은행: 국민 신규 4.36 / 대환 4.32(-0.04), 신한 4.42 / 4.30(-0.12) = 낮음, 우리 4.34 / 4.71(+0.37), 농협 4.25 / 4.49(+0.24), 하나 4.29 / 4.47(+0.18) = 높음 → "세 곳 높고 두 곳 낮음, 격차 작음".
 * - 은행 설명: 차주군(신용도·담보가치·만기·상품 구성) 차이. 신용대출(16곳 중 10곳 역전)은 대사에서 뺌.
 * - 중도상환수수료·인지세·실행 때 새 심사는 갈아타기 일반 안내(◐) — 이번 자료의 사실이 아님.
 * - 은행 실명(iM뱅크·5대 은행)은 비공개: 평균 비교 자료라 은행·차주 구성 차이로 오해될 수 있어(Owner 2026-10-02 "문제될 것 같으면 비공개" 위임).
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

export const OWL_EP22_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "owl_assembly_spec_v1",
  scriptStructureVersion: "owl_script_structure_v2",
  episode: 22,
  displayEpisode: 21,
  scriptType: "D_action_guide",
  geumbaksaHandoffTerm: null,
  sourceCandidate: "candidate-owl-ep22-refinance-rate-reversal-2026-10-06",
  title: "대출 갈아타기, 내 조건으로 따져보세요",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  headerTitle: ["대출 갈아타기,", "내 조건으로", "따져보세요"],

  // ── 이미지·영상 연출 필드(품질 체계 v2, 규칙 15) ──
  hookType: "T3",
  imageCharacter: "owl3dv5",
  imagePrefix: "owl_ep22",
  // 소재(갈아타기=환승·비교·서류 비용)에 맞는 공간 3곳. 직전 편들(금고 홀·방범 관제실·자물쇠 공방·금리 관측소·저울 작업실 등)과 겹치지 않는다.
  // 배경에 글자·숫자·눈금·로고 없음, 큰 빈 벽면 없음.
  sceneBackgrounds: Object.freeze({
    A: {
      label: "환승 역사 홀(도입·정리·마무리)",
      image:
        "밝은 환승 역사 홀. 부엉박사 뒤로 둥근 아치 통로 두세 개와 색색의 둥근 노선 표지 기둥(색 원만 있고 글자·숫자·화살표 없음), 양옆에 큼직한 화분과 둥근 벤치가 넓게 펼쳐지고, 바닥은 따뜻한 베이지 타일과 둥근 러그. 큰 빈 벽면 없이 아치와 기둥, 식물로 채운다. 따뜻한 앰버·크림 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      videoStyle: "bright transfer station hall",
      videoStatics: "the round arched passages, the colorful round line-marker pillars with plain color dots, the large potted plants, the round benches, and the warm beige tile floor with a round rug",
    },
    B: {
      label: "금리 비교 전시관(자료·수치 설명)",
      image:
        "밝은 금리 비교 전시관. 부엉박사 뒤로 둥근 유리 진열대 여러 개(안에 색색의 둥근 막대 모형만, 눈금·글자·숫자 없음)와 높이가 다른 둥근 단상 두세 개가 넓게 펼쳐지고, 양옆 둥근 화분, 바닥은 매끈한 연한 청록 광택 바닥. 큰 빈 벽면 없이 진열대와 단상으로 채운다. 은은한 청록·크림 조명, 저폴리곤 단순화. 글자·숫자·눈금·그래프·간판·화면 없음.",
      videoStyle: "bright interest-rate comparison exhibition hall",
      videoStatics: "the round glass display cases with plain colored round bar models, the round podiums of different heights, the round potted plants, and the glossy light teal floor",
    },
    C: {
      label: "서류 도장 사무실(대처법·비용·주의)",
      image:
        "밝은 서류 도장 사무실. 부엉박사 뒤로 큼직한 둥근 도장 모형과 글자 없는 흰 종이 더미, 둥근 서류함 선반, 둥근 작업 책상이 넓게 펼쳐지고, 양옆 둥근 화분, 바닥은 따뜻한 원목 마루와 둥근 러그. 큰 빈 벽면 없이 선반과 종이 더미, 책상으로 채운다. 따뜻한 골드·민트 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      videoStyle: "bright paperwork stamp office",
      videoStatics: "the large round stamp models, the stacks of plain blank white paper, the round filing shelves, the round work desk, the round potted plants, and the warm wooden floor with a round rug",
    },
  }),

  scenesTimeline:
    "s1 훅 / s2 오프닝 / s3 상황(금감원 7월 자료) / s4 상황(16곳 중 11곳) / s5 상황(최대 격차 4.84→7.17) / s6 상황(5대 은행 격차 작음) / s7 상황(은행 설명·내 조건) / s8 핵심질문 / s9 첫째 조회 금리 비교 / s10 둘째 비용(중도상환수수료) / s11 비용(인지세) / s12 주의(조회 금리는 확정 아님) / s13 정리+확인 / s14 확인 두 가지 / s15 저장+댓글",

  instagramCaptionHook: "대출 갈아타면 이자가 줄 줄 알았는데, 갈아타는 금리가 더 높은 은행이 많아",
  instagramCaptionPoints: [
    "금융감독원이 국회에 낸 자료로 올해 7월 주택담보대출을 비교했더니, 비교 대상 은행 16곳 중 11곳에서 갈아타는(대환) 대출의 평균 금리가 새로 받는 대출보다 높았어",
    "격차가 가장 큰 은행은 새 대출 4.84%, 갈아타는 대출 7.17%였고(2.33%p 차이), 대형 5대 은행은 격차가 0.04~0.37%p로 작았어(세 곳은 높고 두 곳은 낮았어)",
    "은행들은 갈아타는 사람과 새로 받는 사람의 신용도·담보가 달라서 생긴 평균 차이라고 설명해, 평균이라 내 금리와 다를 수 있어",
    "갈아타기 전에는 은행 앱에서 내 조건으로 조회한 금리를 지금 금리와 비교하고, 중도상환수수료(기존 대출을 미리 갚을 때 내는 돈)와 인지세(대출 계약서에 붙는 세금)를 이자 절감액에서 빼서 따져봐",
    "👉 조회된 금리도 실제 신청 때 새로 심사를 받아 달라질 수 있으니 확정으로 보지 마",
    "※ 올해 7월 기준 은행 평균 비교 자료고, 특정 은행·상품 추천이나 갈아타기 권유가 아니야, 금리는 매달 바뀌니 신청 전에 각 은행에서 확인해",
  ],
  instagramPriorityTags: [
    "대환대출",
    "대출갈아타기",
    "주담대금리",
    "주택담보대출",
    "대출금리",
    "중도상환수수료",
    "인지세",
    "금융감독원",
    "이자계산",
    "경제공부",
    "경제뉴스",
    "부엉박사",
  ],

  emphasisTerms: ["갈아타기", "내 조건", "인지세", "부엉박사"],

  captionBoundaryExceptions: Object.freeze([]),
  // TTS가 문장 중간에서 0.2~0.3초 쉴 때 자막이 깜빡 꺼지지 않게 같은 씬 안 짧은 공백을 앞 자막으로 이어 붙인다(조립기 옵션, 황소 20편에서 도입).
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
      video: "owl_v2_ep22_s1_hook_motion.mp4",
      narration: "대출 갈아타려는 사람, 손해 볼 수 있는 거 알고 있었어? 갈아타는 금리가 더 높은 은행이 많거든.",
      imageBrief: card("놀라고 궁금한 표정으로", "대출 갈아타기", "손해 볼 수도"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: cardMotion("the character's expression is wide-eyed and curious, eyebrows raised, as if revealing a surprising catch", "posing a surprising question to the viewer"),
    },
    {
      scene: 2,
      key: "s2_opening",
      role: "opening",
      video: "owl_v2_ep22_s2_opening_motion.mp4",
      narration: "안녕, 매일 경제 뉴스를 콕 집어 전해주는 부엉박사야.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 살짝 들어 인사하고 다른 날개는 자연스럽게 내린 채 담담하게 미소 짓는 포즈, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: openMotion("the character raises one wing slightly in a friendly greeting while the other wing hangs naturally, smiling calmly and warmly at the viewer", "warmly greeting the viewer"),
    },
    {
      scene: 3,
      key: "s3_situation_source",
      role: "fact",
      video: "owl_v2_ep22_s3_situation_source_motion.mp4",
      narration: "금융감독원이 국회에 낸 자료로, 올해 7월 주택담보대출을 비교한 결과가 나왔어.",
      imageBrief: "부엉이가 한쪽 날개를 들어 뒤쪽의 둥근 유리 진열대를 가리키며 또렷하고 차분하게 설명하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "B",
      motion: openMotion("the character points one wing toward the round glass display cases behind it with a clear, calm explanatory expression while the other wing hangs naturally", "calmly presenting the comparison data"),
    },
    {
      scene: 4,
      key: "s4_situation_count",
      role: "fact",
      video: "owl_v2_ep22_s4_situation_count_motion.mp4",
      narration: "비교 대상 은행 16곳 중 11곳에서, 갈아타는 대출의 평균 금리가 새로 받는 대출보다 높았어.",
      imageBrief: card("진지하고 또렷한 표정으로", "은행 16곳 중", "11곳이 더 높음"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: cardMotion("the character's expression is serious and clear with slight nods, as if revealing how many banks were higher", "seriously revealing the count"),
    },
    {
      scene: 5,
      key: "s5_situation_gap",
      role: "fact",
      video: "owl_v2_ep22_s5_situation_gap_motion.mp4",
      narration: "주택담보대출에서 가장 차이가 큰 은행은 새 대출이 4.84%, 갈아타는 대출이 7.17%였어.",
      imageBrief: card("놀랍고 또렷한 표정으로", "새 대출 4.84%", "갈아타기 7.17%", true),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: cardMotion("the character's expression is surprised yet clear with slight nods, as if showing the largest gap", "clearly showing the largest gap"),
    },
    {
      scene: 6,
      key: "s6_situation_big5",
      role: "fact",
      video: "owl_v2_ep22_s6_situation_big5_motion.mp4",
      narration: "다만 대형 5대 은행은 격차가 작았고, 세 곳은 높고 두 곳은 오히려 낮았어.",
      imageBrief: "부엉이가 양쪽 날개를 좌우로 펼쳐 두 가지를 견주듯 보여주며 또렷하고 차분하게 설명하는 자세, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "B",
      motion: openMotion("the character spreads both wings outward to either side, as if weighing two sides against each other, with a clear and calm explanatory expression", "calmly noting the small gap"),
    },
    {
      scene: 7,
      key: "s7_situation_reason",
      role: "fact",
      video: "owl_v2_ep22_s7_situation_reason_motion.mp4",
      narration: "은행들은 갈아타는 사람의 신용도와 담보가 달라서 생긴 평균 차이라고 설명해. 그래서 내 금리는 내 조건으로 봐야 해.",
      imageBrief: card("차분하고 확신에 찬 표정으로", "평균은 평균일 뿐", "내 조건이 기준", true),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: cardMotion("the character's expression is calm and convinced with slight nods, as if concluding that the average is not your own rate", "calmly concluding that your own conditions matter"),
    },
    {
      scene: 8,
      key: "s8_core_q",
      role: "core_question",
      video: "owl_v2_ep22_s8_core_q_motion.mp4",
      narration: "그럼 나는 어떻게 해야 할까? 답부터 말하면, 갈아타기 전에 내 조건으로 나온 금리를 따져보는 거야.",
      imageBrief: "부엉이가 갸웃하다 확신에 찬 표정으로 한쪽 날개를 들어 손짓하며 설명하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "C",
      motion: openMotion("the character's expression starts curious with a slight head tilt and turns confident while one wing lifts in an explaining gesture and the other hangs naturally", "confidently giving the key answer"),
    },
    {
      scene: 9,
      key: "s9_point1_compare",
      role: "evidence",
      video: "owl_v2_ep22_s9_point1_compare_motion.mp4",
      narration: "첫째, 은행 앱에서 조회한 금리를 지금 금리와 비교해. 쉽게 풀면, 평균보다 내 조건 숫자가 정확하거든.",
      imageBrief: card("또렷하고 친근한 표정으로", "앱에서 조회한 금리", "지금 금리와 비교", true),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: cardMotion("the character's expression is clear and friendly with slight nods, as if explaining the first step", "clearly explaining the first step"),
    },
    {
      scene: 10,
      key: "s10_point2_fee",
      role: "evidence",
      video: "owl_v2_ep22_s10_point2_fee_motion.mp4",
      narration: "둘째, 갈아타는 비용을 더해. 쉽게 풀면, 중도상환수수료는 기존 대출을 미리 갚을 때 내는 돈이야.",
      imageBrief: card("신중하고 또렷한 표정으로", "갈아타는 비용", "중도상환수수료"),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: cardMotion("the character's expression is careful and clear with slight nods, as if explaining a cost", "carefully explaining a cost"),
    },
    {
      scene: 11,
      key: "s11_point2_stamp",
      role: "evidence",
      video: "owl_v2_ep22_s11_point2_stamp_motion.mp4",
      narration: "인지세는 대출 계약서에 붙는 세금이야. 두 비용을 이자 절감액에서 빼야 남는 게 보여.",
      imageBrief: "부엉이가 눈을 가늘게 뜨고 계산하듯 신중한 표정으로 한쪽 날개를 턱 아래에 대고 생각하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "close",
      bg: "C",
      motion: openMotion("the character narrows its eyes in a thoughtful calculating look while resting one wing under its chin and the other hangs naturally", "thoughtfully weighing the costs"),
    },
    {
      scene: 12,
      key: "s12_caution",
      role: "condition",
      video: "owl_v2_ep22_s12_caution_motion.mp4",
      narration: "그렇다고 조회된 금리가 확정은 아니야. 실제 신청 때 새로 심사를 받아서 금리가 달라질 수 있거든.",
      imageBrief: card("신중하고 단호한 표정으로", "조회 금리는", "확정이 아니에요"),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: cardMotion("the character's expression is careful and firm, eyebrows slightly furrowed, as if warning that the quoted rate is not final", "firmly cautioning that the rate is not final"),
    },
    {
      scene: 13,
      key: "s13_summary",
      role: "action",
      video: "owl_v2_ep22_s13_summary_motion.mp4",
      narration: "콕 집어 정리하면, 갈아타기는 내 조건으로 따져야 해. 지금 먼저 확인할 건 두 가지야.",
      imageBrief: card("확신에 찬 표정으로", "내 조건으로", "따져 보세요"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: cardMotion("the character's expression is confident and knowing with slight nods, and it briefly raises its head as if counting two things", "confidently delivering the one-line summary"),
    },
    {
      scene: 14,
      key: "s14_check_two",
      role: "action",
      video: "owl_v2_ep22_s14_check_two_motion.mp4",
      narration: "하나는 내 조건으로 조회된 금리와 지금 금리를 비교하는 것, 다른 하나는 수수료와 인지세를 더한 총비용이야.",
      imageBrief: "부엉이가 한쪽 날개를 들어 두 가지를 하나씩 짚어 가듯 또렷하고 친근하게 설명하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: openMotion("the character lifts one wing and ticks off two points one after the other with a clear, friendly explanatory expression while the other wing hangs naturally", "clearly pointing out the two things to check"),
    },
    {
      scene: 15,
      key: "s15_save",
      role: "save",
      video: "owl_v2_ep22_s15_save_motion.mp4",
      narration: "이 두 가지는 저장해 두고, 갈아타기 신청 전에 다시 확인해. 궁금한 경제 뉴스는 댓글로 남겨줘.",
      imageBrief: "부엉이가 밝은 미소로 한쪽 날개를 가볍게 흔들고 다른 날개는 자연스럽게 내린 마무리 포즈, 소품 없이 빈 날개.",
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: openMotion("the character smiles brightly and waves one wing lightly in a friendly goodbye while the other wing hangs naturally relaxed", "warmly saying goodbye and inviting comments"),
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findOwlEp22Scene(key) {
  return OWL_EP22_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
