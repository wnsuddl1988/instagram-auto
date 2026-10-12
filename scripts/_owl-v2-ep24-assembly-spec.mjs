/**
 * 부엉박사 조립 스펙 표시 23편(파일 번호 24, v2 + 품질 체계 v2) — 국민연금법 개정: 군복무 크레딧 전체 인정 + 둘째 출산 크레딧 12→15개월.
 *
 * 파일 이름: 표시 23편 = 파일 번호 24(표시 22편 근로장려금이 파일 ep23). 배포: Owner 지시 시점(제안 금지).
 * 기준: _ai/CURRENT_STANDARDS.md §1 부엉 v2, 규칙 14(배경 2~3구역)·15(품질 체계 v2)·17(훅)·26~29·30(커버 제목 그대로). 유형 C형(나한테는 뭐가 달라질까).
 * 대본 v6: 15씬·533자(검사기 반드시 수정 0). 1차 TTS(17씬·590자)가 124.28초라 CTA 포함 139초대 → 해군·공군 금액 씬·평균소득 가정 씬을 빼 2차 TTS 107.72초(최대 씬 9.2초 추정, 정렬 밀림 최대 -0.08초).
 * 새 독자 읽기 점검 1회. 대본 문서: _ai/owl-ep24-pension-credit-script-draft.md. 담당 부엉박사(시민 입장, 규칙 22) · 레인 policy_countdown · 영역 pension · 제목 모양 question.
 *
 * ★ 핵심 팩트(2026-10-06 원문 확인, 국민연금법 개정안)★
 * - 국회 본회의 2026-10-01 통과, 시행 2027-01-01. 군복무 크레딧: 기존 최대 12개월 → 복무 기간 전체(육군·해병대 18개월, 해군 20개월, 공군·사회복무요원 21개월). 2027년 이후 전역자부터 적용.
 * - 복지부 추정: 육군 기준 월 연금 효과 2만 5,740원 → 3만 8,620원(= 1만 2,880원 증가). 평균소득 319만 3,511원·소득대체율 43% 가정(영상에는 "복지부 추정"만 표기, 가정은 캡션에).
 * - 출산 크레딧: 둘째 아이 12개월 → 15개월(2027년 이후 출산·입양). 월 연금 효과 3만 4,330원 → 4만 2,910원.
 * - 이미 전역한 사람은 이번 개정 대상 아님(기존 기준).
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

export const OWL_EP24_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "owl_assembly_spec_v1",
  scriptStructureVersion: "owl_script_structure_v2",
  episode: 24,
  displayEpisode: 23,
  scriptType: "C_personal_impact",
  geumbaksaHandoffTerm: null,
  sourceCandidate: "candidate-owl-ep24-pension-credit-military-birth-2026-10-06",
  title: "군 복무와 출산, 국민연금 더 인정돼요",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  headerTitle: ["군 복무와 출산,", "국민연금", "더 인정돼요"],

  // ── 이미지·영상 연출 필드(품질 체계 v2, 규칙 15) ──
  hookType: "T3",
  // 첫 3초 시각 변화 실험(Owner 2026-10-05, CURRENT_STANDARDS A-7 2-2): 직전 부엉 23편 pushin → 이번 24편 impact로 번갈아.
  openingMotion: "impact",
  imageCharacter: "owl3dv5",
  imagePrefix: "owl_ep24",
  // 소재(연금 가입기간이 시간이 지나며 쌓임·시행일)에 맞는 공간 3곳. 직전 편들(민원 로비·지급 창구 홀·신청서 작성 코너·환승 역사 홀·금리 비교 전시관·서류 도장 사무실·금고 홀·방범 관제실)과 겹치지 않는다.
  // 배경에 글자·숫자·눈금·로고·화면 없음, 큰 빈 벽면 없음.
  sceneBackgrounds: Object.freeze({
    A: {
      label: "유리 온실 안내 홀(도입·개념·정리·마무리)",
      image:
        "햇살이 쏟아지는 밝은 유리 온실 안내 홀. 부엉박사 뒤로 둥근 유리 돔 구조물과 키 큰 둥근 잎 식물 여러 그루, 둥근 나무 벤치 두세 개가 넓게 펼쳐지고, 양옆에 큼직한 화분, 바닥은 연한 하늘색 타일과 둥근 초록 러그. 큰 빈 벽면 없이 유리 돔과 식물, 벤치로 채운다. 따뜻한 연노랑·연초록 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      videoStyle: "bright glass greenhouse guidance hall",
      videoStatics: "the round glass dome structure, the tall round-leaf plants, the round wooden benches, the large potted plants, and the light sky-blue tile floor with a round green rug",
    },
    B: {
      label: "시간의 길 전시관(법 개정·군별 기간·시행일)",
      image:
        "밝은 시간의 길 전시관. 부엉박사 뒤로 둥근 징검돌 길과 큼직한 모래시계 모형(글자·눈금 없음) 두세 개, 둥근 달 모양 조형물이 넓게 펼쳐지고, 양옆 둥근 화분, 바닥은 매끈한 연한 보라빛 광택 바닥. 큰 빈 벽면 없이 모래시계와 조형물, 징검돌로 채운다. 은은한 연보라·골드 조명, 저폴리곤 단순화. 글자·숫자·눈금·그래프·간판·화면 없음.",
      videoStyle: "bright time-path exhibition hall",
      videoStatics: "the round stepping-stone path, the large plain hourglass models without any marks, the round moon-shaped sculptures, the round potted plants, and the glossy light lavender floor",
    },
    C: {
      label: "계단식 열매 정원(핵심 질문·대상·금액·주의)",
      image:
        "밝은 계단식 열매 정원. 부엉박사 뒤로 둥근 계단식 언덕 여러 단과 금빛 열매가 달린 둥근 나무 모형(글자·숫자 없음) 두세 그루, 둥근 꽃밭이 넓게 펼쳐지고, 양옆 둥근 화분, 바닥은 따뜻한 연두 잔디와 둥근 돌길. 큰 빈 벽면 없이 언덕과 나무, 꽃밭으로 채운다. 따뜻한 연두·크림 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      videoStyle: "bright terraced fruit garden",
      videoStatics: "the round terraced hills, the round trees with plain golden round fruit models, the round flower beds, the round potted plants, and the warm light-green lawn with a round stone path",
    },
  }),

  scenesTimeline:
    "s1 훅 / s2 오프닝 / s3 개념(크레딧) / s4 상황(국회 통과·군복무 전체) / s5 상황(군별 18·20·21개월) / s6 상황(시행 2027.1.1) / s7 핵심질문(월 연금 더 늘어남) / s8 첫째 대상(전역일) / s9 둘째 금액(육군 1만 2,880원) / s10 셋째 출산(12→15개월) / s11 출산 월 연금 효과 / s12 주의(이미 전역자 제외) / s13 정리 / s14 확인 두 가지 / s15 저장+댓글",

  instagramCaptionHook: "곧 전역하거나 둘째를 계획 중이라면, 국민연금 인정 기간이 달라지는 걸 알아야 해",
  instagramCaptionPoints: [
    "2026년 10월 1일 국회 본회의에서 국민연금법 개정안이 통과됐어, 군복무 크레딧은 기존 최대 12개월만 인정하던 것을 복무 기간 전체로 늘렸어",
    "복무 기간은 육군·해병대 18개월, 해군 20개월, 공군·사회복무요원 21개월이고, 시행은 2027년 1월 1일이야, 그날 이후 전역하는 사람부터 적용돼",
    "보건복지부 추정으로 육군 기준 월 연금 효과는 2만 5,740원에서 3만 8,620원으로 1만 2,880원 늘어, 평균소득 319만 3,511원·소득대체율 43%를 가정한 추정이라 내 연금은 내 소득 기록에 따라 달라",
    "출산 크레딧은 시행일 이후 둘째 아이를 낳거나 입양하면 인정 기간이 12개월에서 15개월로 늘어, 월 연금 증가 효과는 3만 4,330원에서 4만 2,910원으로 커져(복지부 추정)",
    "이미 전역한 사람이나 시행일 전에 출산한 경우는 이번 개정 대상이 아니라 기존 기준 그대로야",
    "👉 내 전역일과 출산 예정일이 2027년 1월 1일 이후인지 먼저 확인해봐",
    "💬 군 복무와 출산 중 연금에 더 반영되길 바라는 건 어느 쪽이야? 댓글로 알려줘",
    "※ 보건복지부 추정치이며 가입기간과 소득에 따라 실제 연금액은 달라질 수 있어, 개인별 연금액을 보장하는 게 아니야",
  ],
  instagramPriorityTags: [
    "국민연금",
    "국민연금개정",
    "군복무크레딧",
    "출산크레딧",
    "연금개혁",
    "전역",
    "군대",
    "둘째출산",
    "노후준비",
    "연금",
    "경제뉴스",
    "부엉박사",
  ],

  emphasisTerms: ["군복무", "크레딧", "시행일", "부엉박사"],

  // 자막 경계 예외(QA가 경고로 남김, 규칙 자체는 그대로): 폭 한도 760px 안에서 규칙을 지키는 분할이 없고 대사를 바꾸려면 TTS 재생성(유료)이 필요해 이 두 곳만 승인.
  // ① s6 "시행은 2027년 1월 1일이고" — '2027년 1월 1일이고' 854px(한 블록 불가), '시행은 2027년 / 1월 1일이고'(년 / 월)로 나뉨. 날짜라 읽기엔 자연스러움.
  // ② s12 "해당되는 건 아니야" — 826px(한 블록 불가), '해당되는 / 건'·'건 / 아니야' 둘 다 금지 경계라 '모두 해당되는 | 건 아니야'로 나뉨.
  captionBoundaryExceptions: Object.freeze([
    { left: "2027년", right: "1월", reason: "연월일 날짜 '2027년 1월 1일이고'(854px)가 폭 한도 760px 안에 한 블록으로 안 들어감, TTS 재생성 회피(s6, 2026-10-06)" },
    { left: "해당되는", right: "건", reason: "'해당되는 건 아니야'(826px)가 폭 한도 760px 안에 한 블록으로 안 들어가고 대안 줄바꿈도 모두 금지 경계, TTS 재생성 회피(s12, 2026-10-06)" },
  ]),
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
      video: "owl_v2_ep24_s1_hook_motion.mp4",
      narration: "곧 전역할 사람, 군 복무 기간이 국민연금에 전부 인정되는 걸로 바뀐 거 알고 있었어?",
      imageBrief: card("놀라고 궁금한 표정으로", "군 복무 기간", "전부 인정"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: cardMotion("the character's expression is wide-eyed and curious, eyebrows raised, as if revealing a surprising change to the viewer", "posing a surprising question to the viewer"),
    },
    {
      scene: 2,
      key: "s2_opening",
      role: "opening",
      video: "owl_v2_ep24_s2_opening_motion.mp4",
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
      video: "owl_v2_ep24_s3_concept_motion.mp4",
      narration: "크레딧은 보험료를 안 내도 국민연금 가입기간으로 쳐주는 기간이야. 이번엔 군복무와 출산이 늘었어.",
      imageBrief: card("또렷하고 친근한 표정으로", "보험료 안 내도", "가입기간 인정"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: cardMotion("the character's expression is clear and friendly with slight nods, as if explaining what a credit is", "clearly explaining the concept"),
    },
    {
      scene: 4,
      key: "s4_situation_law",
      role: "fact",
      video: "owl_v2_ep24_s4_situation_law_motion.mp4",
      narration: "국회 본회의가 10월 첫날 국민연금법 개정안을 통과시켰어. 군복무는 원래 최대 1년만 쳐줬는데, 이제 전체야.",
      imageBrief: card("진지하고 또렷한 표정으로", "국민연금법", "국회 통과"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: cardMotion("the character's expression is serious and clear with slight nods, as if announcing that the law passed", "seriously announcing the law change"),
    },
    {
      scene: 5,
      key: "s5_situation_service",
      role: "fact",
      video: "owl_v2_ep24_s5_situation_service_motion.mp4",
      narration: "육군과 해병대는 18개월, 해군은 20개월, 공군과 사회복무요원은 21개월까지 인정해 줘.",
      imageBrief: card("또렷하고 친근한 표정으로", "최대 21개월까지", "군별로 인정"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: cardMotion("the character's expression is clear and friendly with slight nods, as if listing how long each service branch is recognized", "clearly listing the recognized periods"),
    },
    {
      scene: 6,
      key: "s6_situation_effective",
      role: "fact",
      video: "owl_v2_ep24_s6_situation_effective_motion.mp4",
      narration: "시행은 2027년 1월 1일이고, 그날 이후 전역하는 사람부터 적용돼.",
      imageBrief: "부엉이가 또렷한 표정으로 한쪽 날개를 앞쪽으로 뻗어 앞날을 가리키듯 설명하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "B",
      motion: openMotion("the character's expression is clear and steady while one wing extends forward as if pointing to a date ahead and the other wing hangs naturally", "clearly stating when it starts"),
    },
    {
      scene: 7,
      key: "s7_core_q",
      role: "core_question",
      video: "owl_v2_ep24_s7_core_q_motion.mp4",
      narration: "그럼 나한테는 뭐가 달라질까? 답부터 말하면, 나중에 받는 월 연금이 조금 더 늘어나.",
      imageBrief: "부엉이가 갸웃하다 확신에 찬 표정으로 한쪽 날개를 들어 손짓하며 설명하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "C",
      motion: openMotion("the character's expression starts curious with a slight head tilt and turns confident while one wing lifts in an explaining gesture and the other hangs naturally", "confidently giving the key answer"),
    },
    {
      scene: 8,
      key: "s8_point1_target",
      role: "evidence",
      video: "owl_v2_ep24_s8_point1_target_motion.mp4",
      narration: "첫째, 대상인지 따져봐. 쉽게 풀면, 전역일이 시행일 이후인지만 보면 돼.",
      imageBrief: card("또렷하고 친근한 표정으로", "전역일이", "시행일 이후면"),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: cardMotion("the character's expression is clear and friendly with slight nods, as if explaining the first check", "clearly explaining the first check"),
    },
    {
      scene: 9,
      key: "s9_point2_amount",
      role: "evidence",
      video: "owl_v2_ep24_s9_point2_amount_motion.mp4",
      narration: "둘째, 얼마나 늘어나는지 봐. 쉽게 풀면, 육군은 복지부 추정으로 월 연금이 1만 2,880원 더 늘어.",
      imageBrief: card("또렷하고 반가운 표정으로", "육군 월 연금", "1만 2,880원 증가", true),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: cardMotion("the character's expression is clear and pleasantly surprised with slight nods, as if revealing the monthly increase", "clearly revealing the increase"),
    },
    {
      scene: 10,
      key: "s10_point3_birth",
      role: "evidence",
      video: "owl_v2_ep24_s10_point3_birth_motion.mp4",
      narration: "셋째, 시행일 이후 두 번째 아이를 낳거나 입양해도 달라져. 쉽게 풀면, 인정 기간이 12개월에서 15개월이야.",
      imageBrief: "부엉이가 따뜻하게 미소 지으며 한쪽 날개를 가슴에 살짝 얹고 설명하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "close",
      bg: "C",
      motion: openMotion("the character smiles warmly with one wing resting lightly on its chest while explaining and the other wing hangs naturally", "warmly explaining the birth credit"),
    },
    {
      scene: 11,
      key: "s11_point3_amount",
      role: "evidence",
      video: "owl_v2_ep24_s11_point3_amount_motion.mp4",
      narration: "그러면 월 연금 증가 효과가 3만 4,330원에서 4만 2,910원으로 커져.",
      imageBrief: card("또렷하고 반가운 표정으로", "월 연금 효과", "4만 2,910원으로", true),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: cardMotion("the character's expression is clear and pleasantly surprised with slight nods, as if revealing the larger monthly effect", "clearly revealing the larger effect"),
    },
    {
      scene: 12,
      key: "s12_caution",
      role: "condition",
      video: "owl_v2_ep24_s12_caution_motion.mp4",
      narration: "그렇다고 모두 해당되는 건 아니야. 이미 전역했다면 이번 개정 대상이 아니라 기존 기준 그대로거든.",
      imageBrief: card("신중하고 단호한 표정으로", "이미 전역했다면", "대상이 아니에요"),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: cardMotion("the character's expression is careful and firm, eyebrows slightly furrowed, as if warning that already-discharged people are excluded", "firmly cautioning about who is excluded"),
    },
    {
      scene: 13,
      key: "s13_summary",
      role: "action",
      video: "owl_v2_ep24_s13_summary_motion.mp4",
      narration: "콕 집어 정리하면, 군복무와 출산이 연금에 더 반영돼. 지금 먼저 확인할 건 두 가지야.",
      imageBrief: card("확신에 찬 표정으로", "군복무와 출산이", "연금에 더 반영", true),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: cardMotion("the character's expression is confident and knowing with slight nods, and it briefly raises its head as if counting two things", "confidently delivering the one-line summary"),
    },
    {
      scene: 14,
      key: "s14_check_two",
      role: "action",
      video: "owl_v2_ep24_s14_check_two_motion.mp4",
      narration: "하나는 내 전역일이 시행일 이후인지 보는 것, 다른 하나는 출산이 시행일 이후인지 보는 거지.",
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
      video: "owl_v2_ep24_s15_save_motion.mp4",
      narration: "이 두 가지는 저장해 두고, 전역이나 출산 전에 다시 확인해. 궁금한 제도는 댓글로 남겨줘.",
      imageBrief: "부엉이가 밝은 미소로 한쪽 날개를 가볍게 흔들고 다른 날개는 자연스럽게 내린 마무리 포즈, 소품 없이 빈 날개.",
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: openMotion("the character smiles brightly and waves one wing lightly in a friendly goodbye while the other wing hangs naturally relaxed", "warmly saying goodbye and inviting comments"),
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findOwlEp24Scene(key) {
  return OWL_EP24_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
