/**
 * 부엉박사 조립 스펙 표시 24편(파일 번호 25, v2 + 품질 체계 v2) — 2027 예산안: 아동수당 월 10만→아동기본수당 월 20만 원(절반은 지역사랑상품권)·아이맞이지원금.
 *
 * 파일 이름: 표시 24편 = 파일 번호 25(표시 23편 국민연금 크레딧이 파일 ep24). 배포: Owner 지시 시점(제안 금지). ★정부안·국회 심의 중 — 게시 직전 국회 결과 재확인 필수.
 * 기준: _ai/CURRENT_STANDARDS.md §1 부엉 v2, 규칙 14(배경 2~3구역)·15(품질 체계 v2)·17(훅)·26~29·30(커버 제목 그대로). 유형 C형(나한테는 뭐가 달라질까).
 * 대본 v4: 15씬·526자(검사기 반드시 수정 0). 1차 17씬(585자)은 TTS 전에 총액 7,500만 원 씬(단일 출처)·상품권 사용 제한 씬을 빼 15씬으로 줄임 → TTS 104.92초(최대 씬 9.4초 추정, 정렬 밀림 최대 -0.2초).
 * 새 독자 읽기 점검 1회. 대본 문서: _ai/owl-ep25-child-allowance-script-draft.md. 담당 부엉박사(시민 입장, 규칙 22) · 레인 money_calc · 영역 other · 제목 모양 contrast.
 *
 * ★ 핵심 팩트(2026-10-06 원문 확인, 2027년 예산안 정부안)★
 * - 정부 국무회의 2026-09-01 2027년 예산안 의결(국회 심의 남음). 시행 2027년 7월.
 * - 아동수당 월 10만 원 → 아동기본수당 월 20만 원, 지급 대상 만 12세까지로 확대. 절반은 지역사랑상품권, 현금은 현행 수준 유지.
 * - 지방우대 지역은 월 30만 원까지. 0·1세를 집에서 직접 돌보면 가정양육 지원이 따로 더해짐.
 * - 아이맞이지원금(출생 때 이용권 + 영아기 부모급여 통합): 2027년 7월 이후 출생 첫 아이 1,000만 원·둘째 1,200만 원·셋째 이상 1,500만 원, 1년간 분할 지급.
 * - 영상에서 뺀 것: 아동 1인당 총액 최대 7,500만 원(정부 계산·단일 출처)은 영상·캡션에 쓰지 않는다.
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

export const OWL_EP25_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "owl_assembly_spec_v1",
  scriptStructureVersion: "owl_script_structure_v2",
  episode: 25,
  displayEpisode: 24,
  scriptType: "C_personal_impact",
  geumbaksaHandoffTerm: null,
  sourceCandidate: "candidate-owl-ep25-child-allowance-2027-budget-2026-10-06",
  title: "아동수당 두 배, 절반은 상품권이에요",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  headerTitle: ["아동수당 두 배,", "절반은", "상품권이에요"],

  // ── 이미지·영상 연출 필드(품질 체계 v2, 규칙 15) ──
  hookType: "T3",
  // 첫 3초 시각 변화 실험(Owner 2026-10-05, CURRENT_STANDARDS A-7 2-2): 직전 부엉 24편 impact → 이번 25편 pushin으로 번갈아.
  openingMotion: "pushin",
  imageCharacter: "owl3dv5",
  imagePrefix: "owl_ep25",
  // 소재(아이 키우는 집·지역 상품권·출생 선물)에 맞는 공간 3곳. 직전 편들(유리 온실 안내 홀·시간의 길 전시관·계단식 열매 정원·민원 로비·지급 창구 홀 등)과 겹치지 않는다.
  // 배경에 글자·숫자·눈금·로고·화면 없음, 큰 빈 벽면 없음.
  sceneBackgrounds: Object.freeze({
    A: {
      label: "햇살 놀이 광장 라운지(도입·개념·정리·마무리)",
      image:
        "햇살이 드는 밝은 놀이 광장 라운지. 부엉박사 뒤로 둥근 쿠션 매트와 큼직한 둥근 블록 모형(글자·숫자 없음) 여러 개, 둥근 미끄럼 조형물이 넓게 펼쳐지고, 양옆 큼직한 화분과 둥근 벤치, 바닥은 연한 분홍·크림 부드러운 바닥과 둥근 러그. 큰 빈 벽면 없이 쿠션 매트와 블록, 조형물로 채운다. 따뜻한 연분홍·크림 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      videoStyle: "bright sunny kids play plaza lounge",
      videoStatics: "the round cushion mats, the large plain round block models without any letters, the round slide sculpture, the large potted plants, the round benches, and the soft light pink and cream floor with a round rug",
    },
    B: {
      label: "지역 장터 광장(예산안·금액 변화·상품권·월 지급액)",
      image:
        "밝은 지역 장터 광장. 부엉박사 뒤로 둥근 파스텔 천막 가판대 여러 개(글자 없는 민트·살구색 둥근 천막, 위에 글자 없는 둥근 과일 모형과 빵 모형만)와 둥근 분수 조형물이 넓게 펼쳐지고, 양옆 둥근 화분, 바닥은 따뜻한 연회색 돌바닥과 둥근 꽃밭. 큰 빈 벽면 없이 가판대와 분수, 꽃밭으로 채운다. 은은한 연민트·살구 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      videoStyle: "bright local market plaza",
      videoStatics: "the round pastel canopy stalls with plain round fruit and bread models, the round fountain sculpture, the round potted plants, and the warm light gray stone floor with round flower beds",
    },
    C: {
      label: "선물 상자 전시 홀(아이맞이지원금·주의)",
      image:
        "밝은 선물 상자 전시 홀. 부엉박사 뒤로 높이가 다른 둥근 단상 여러 개와 그 위의 글자 없는 둥근 리본 선물 상자 모형(크기가 다양), 둥근 풍선 모양 조형물 두세 개가 넓게 펼쳐지고, 양옆 둥근 화분, 바닥은 매끈한 연한 하늘색 광택 바닥. 큰 빈 벽면 없이 단상과 선물 상자, 조형물로 채운다. 은은한 하늘색·연노랑 조명, 저폴리곤 단순화. 글자·숫자·눈금·간판·화면 없음.",
      videoStyle: "bright gift box exhibition hall",
      videoStatics: "the round podiums of different heights, the plain round ribbon gift box models of various sizes, the round balloon-shaped sculptures, the round potted plants, and the glossy light sky-blue floor",
    },
  }),

  scenesTimeline:
    "s1 훅 / s2 오프닝 / s3 개념(아동수당→아동기본수당) / s4 상황(2027 예산안·시행 내년 7월) / s5 상황(월 10만→20만·12세까지) / s6 상황(절반 상품권·현금 그대로) / s7 핵심질문(상품권만큼 늘어남) / s8 첫째 월 지급(지방우대 30만) / s9 첫째 월 지급(0·1세 가정양육) / s10 둘째 아이맞이지원금 / s11 둘째 금액(1,000·1,200·1,500만) / s12 주의(국회 심의) / s13 정리 / s14 확인 두 가지 / s15 저장+댓글",

  instagramCaptionHook: "아이 키우는 집이라면, 내년 아동수당이 두 배가 되는데 절반이 상품권이라는 걸 알아야 해",
  instagramCaptionPoints: [
    "정부가 2026년 9월 1일 국무회의에서 2027년 예산안을 의결했어, 아동수당이 아동기본수당으로 이름이 바뀌고 시행은 2027년 7월로 잡혀 있어, 국회 심의가 남아 있어서 확정은 아니야",
    "월 10만 원이던 금액이 월 20만 원으로 늘고 지급 대상도 만 12세까지로 넓어져, 다만 그중 절반은 지역사랑상품권이고 현금은 지금 수준 그대로야",
    "지방우대 지역은 월 30만 원까지 받을 수 있고, 0세와 1세를 집에서 직접 돌보면 가정양육 지원이 따로 더해져",
    "출생 때 주는 이용권과 영아기 부모급여를 합친 아이맞이지원금이 새로 생겨, 2027년 7월 이후 태어나면 첫 아이 1,000만 원·두 번째 1,200만 원·세 번째부터 1,500만 원을 1년간 나눠 받아",
    "국회 심의에서 시행 시기나 금액이 바뀔 수 있어, 상품권은 쓸 수 있는 지역과 가게가 정해져 있다는 점도 같이 알아둬",
    "👉 우리 지역이 지방우대 지역인지, 아이 출생이 2027년 7월 이후인지 먼저 확인해봐",
    "💬 월 20만 원 중 10만 원이 상품권이라면, 우리 집에선 현금과 상품권 중 어느 쪽이 더 쓸모 있을까? 댓글로 알려줘",
    "※ 2027년 예산안 정부안 기준이며 국회 심의에서 바뀔 수 있어, 개인별 지급액을 보장하는 게 아니야",
  ],
  instagramPriorityTags: [
    "아동수당",
    "아동기본수당",
    "아이맞이지원금",
    "지역사랑상품권",
    "2027예산안",
    "부모급여",
    "육아지원",
    "출산지원금",
    "육아맘",
    "육아대디",
    "경제뉴스",
    "부엉박사",
  ],

  emphasisTerms: ["아동수당", "상품권", "아이맞이지원금", "부엉박사"],

  // 자막 경계 예외(QA가 경고로 남김, 규칙 자체는 그대로): s1 "아이 키우는 집, 내년 || 아동수당이" — '내년|아동수당이'는 금지 경계지만, 대안 분할인
  // '아이 키우는 집,' 단독 블록이 실제 발화 0.267~0.860초 = 0.59초로 0.6초 미만 규칙(+8 벌점)에 0.01초 모자라 조립기 분할이 이 경계를 선택함. 대사 재생성(유료) 회피(2026-10-07).
  captionBoundaryExceptions: Object.freeze([
    { left: "내년", right: "아동수당이", reason: "대안 분할 '아이 키우는 집,' 단독 블록이 발화 0.59초(<0.6초 규칙)라 자동 분할이 이 경계를 선택, TTS 재생성 회피(s1, 2026-10-07)" },
  ]),
  // 자막 폭 예외(2026-10-07, 조립기·QA에 `captionWidthExceptions` 옵션 신설): 한 어절 자체가 폭 한도 760px를 넘어 줄바꿈으로 못 푸는 줄.
  // 대사를 바꾸려면 TTS 재생성(유료·길이 ±10% 변동)이 필요해 사유와 함께 승인. 모두 휴대폰 안전폭 864px 이내, 글자 크기 96px 그대로.
  captionWidthExceptions: Object.freeze([
    { line: "아동기본수당으로", reason: "'아동기본수당으로' 한 어절 8음절 768px(한도 760 대비 +8px), s3 — TTS 재생성 회피(2026-10-07)" },
    { line: "지역사랑상품권이야", reason: "'지역사랑상품권이야' 한 어절 9음절 864px(안전폭 864 이내), s6 — TTS 재생성 회피(2026-10-07)" },
    { line: "아이맞이지원금이", reason: "'아이맞이지원금이' 한 어절 8음절 768px(한도 760 대비 +8px), s10 — TTS 재생성 회피(2026-10-07)" },
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
      video: "owl_v2_ep25_s1_hook_motion.mp4",
      narration: "아이 키우는 집, 내년 아동수당이 두 배로 바뀌는데, 절반이 상품권인 거 알고 있었어?",
      imageBrief: card("놀라고 궁금한 표정으로", "아동수당 두 배", "절반은 상품권"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: cardMotion("the character's expression is wide-eyed and curious, eyebrows raised, as if revealing a surprising change to the viewer", "posing a surprising question to the viewer"),
    },
    {
      scene: 2,
      key: "s2_opening",
      role: "opening",
      video: "owl_v2_ep25_s2_opening_motion.mp4",
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
      video: "owl_v2_ep25_s3_concept_motion.mp4",
      narration: "아동수당은 아이 키우는 집에 매달 주는 돈이야. 내년부터 이름이 아동기본수당으로 바뀌어.",
      imageBrief: card("또렷하고 친근한 표정으로", "아동수당은", "아동기본수당으로", true),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: cardMotion("the character's expression is clear and friendly with slight nods, as if explaining what the allowance is", "clearly explaining the concept"),
    },
    {
      scene: 4,
      key: "s4_situation_budget",
      role: "fact",
      video: "owl_v2_ep25_s4_situation_budget_motion.mp4",
      narration: "정부가 9월 1일 국무회의에서 2027년 예산안을 의결했어. 시행은 내년 7월이고, 국회 심의가 남아 있어.",
      imageBrief: card("진지하고 또렷한 표정으로", "2027년 예산안", "국회 심의 남음"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: cardMotion("the character's expression is serious and clear with slight nods, as if announcing the government budget plan", "seriously announcing the budget plan"),
    },
    {
      scene: 5,
      key: "s5_situation_change",
      role: "fact",
      video: "owl_v2_ep25_s5_situation_change_motion.mp4",
      narration: "원래는 월 10만 원이었는데, 이제는 월 20만 원이 되고 지급 대상도 12세까지로 넓어져.",
      imageBrief: card("또렷하고 반가운 표정으로", "월 10만 원이", "월 20만 원으로"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: cardMotion("the character's expression is clear and pleasantly surprised with slight nods, as if revealing the doubled amount", "clearly revealing the doubled amount"),
    },
    {
      scene: 6,
      key: "s6_situation_voucher",
      role: "fact",
      video: "owl_v2_ep25_s6_situation_voucher_motion.mp4",
      narration: "다만 그 절반은 지역사랑상품권이야. 현금은 지금과 같고, 상품권이 더해지는 거지.",
      imageBrief: "부엉이가 또렷한 표정으로 한쪽 날개를 세워 반을 나누듯 손날 동작으로 설명하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "B",
      motion: openMotion("the character's expression is clear and steady while one wing makes a dividing-in-half chopping gesture as if separating half and the other wing hangs naturally", "clearly explaining that half is a voucher"),
    },
    {
      scene: 7,
      key: "s7_core_q",
      role: "core_question",
      video: "owl_v2_ep25_s7_core_q_motion.mp4",
      narration: "그럼 나한테는 뭐가 달라질까? 답부터 말하면, 현금은 그대로고 상품권만큼 받는 돈이 늘어나.",
      imageBrief: "부엉이가 갸웃하다 확신에 찬 표정으로 한쪽 날개를 들어 손짓하며 설명하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "B",
      motion: openMotion("the character's expression starts curious with a slight head tilt and turns confident while one wing lifts in an explaining gesture and the other hangs naturally", "confidently giving the key answer"),
    },
    {
      scene: 8,
      key: "s8_point1_amount",
      role: "evidence",
      video: "owl_v2_ep25_s8_point1_amount_motion.mp4",
      narration: "첫째, 매달 받는 돈을 봐. 쉽게 풀면, 지방우대 지역은 월 30만 원까지 받아.",
      imageBrief: card("또렷하고 친근한 표정으로", "지방우대 지역은", "월 30만 원까지"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: cardMotion("the character's expression is clear and friendly with slight nods, as if explaining the first check", "clearly explaining the first check"),
    },
    {
      scene: 9,
      key: "s9_point1_extra",
      role: "evidence",
      video: "owl_v2_ep25_s9_point1_extra_motion.mp4",
      narration: "0세와 1세를 집에서 직접 돌보면 그만큼이 따로 더해져.",
      imageBrief: "부엉이가 따뜻하게 미소 지으며 한쪽 날개를 가슴 앞에 부드럽게 모아 아이를 돌보듯 설명하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "close",
      bg: "B",
      motion: openMotion("the character smiles warmly with one wing gently gathered in front of its chest as if caring for a baby while explaining and the other wing hangs naturally", "warmly explaining the extra support"),
    },
    {
      scene: 10,
      key: "s10_point2_welcome",
      role: "evidence",
      video: "owl_v2_ep25_s10_point2_welcome_motion.mp4",
      narration: "둘째, 태어나는 아이 몫을 봐. 쉽게 풀면, 출생 때 주는 이용권과 영아기 부모급여를 합친 아이맞이지원금이 생겨.",
      imageBrief: card("또렷하고 친근한 표정으로", "아이맞이지원금", "출생 때 합쳐 줘요", true),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: cardMotion("the character's expression is clear and friendly with slight nods, as if explaining the second check", "clearly explaining the second check"),
    },
    {
      scene: 11,
      key: "s11_point2_amount",
      role: "evidence",
      video: "owl_v2_ep25_s11_point2_amount_motion.mp4",
      narration: "내년 7월 이후 태어나면 첫 아이는 1,000만 원, 두 번째는 1,200만 원, 세 번째부터는 1,500만 원을 1년간 나눠 받아.",
      imageBrief: card("또렷하고 반가운 표정으로", "첫 아이 1,000만", "셋째부터 1,500만", true),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: cardMotion("the character's expression is clear and pleasantly surprised with slight nods, as if revealing the amounts", "clearly revealing the amounts"),
    },
    {
      scene: 12,
      key: "s12_caution",
      role: "condition",
      video: "owl_v2_ep25_s12_caution_motion.mp4",
      narration: "그렇다고 확정은 아니야. 국회 심의에서 시행 시기나 금액이 바뀔 수 있거든.",
      imageBrief: "부엉이가 신중하고 단호한 표정으로 한쪽 날개를 들어 잠깐 멈추라는 듯 손짓하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "C",
      motion: openMotion("the character's expression is careful and firm, eyebrows slightly furrowed, while one wing lifts in a hold-on gesture as if warning that it is not final and the other hangs naturally", "firmly cautioning that it is not final"),
    },
    {
      scene: 13,
      key: "s13_summary",
      role: "action",
      video: "owl_v2_ep25_s13_summary_motion.mp4",
      narration: "콕 집어 정리하면, 두 배로 오르지만 현금은 그대로고 상품권이 더해져. 지금 먼저 확인할 건 두 가지야.",
      imageBrief: card("확신에 찬 표정으로", "두 배지만", "절반은 상품권"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: cardMotion("the character's expression is confident and knowing with slight nods, and it briefly raises its head as if counting two things", "confidently delivering the one-line summary"),
    },
    {
      scene: 14,
      key: "s14_check_two",
      role: "action",
      video: "owl_v2_ep25_s14_check_two_motion.mp4",
      narration: "하나는 우리 지역이 지방우대 지역인지, 다른 하나는 아이 출생이 내년 7월 이후인지 보는 거지.",
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
      video: "owl_v2_ep25_s15_save_motion.mp4",
      narration: "이 두 가지는 저장해 두고, 국회 결과가 나오면 다시 확인해. 궁금한 제도는 댓글로 남겨줘.",
      imageBrief: "부엉이가 밝은 미소로 한쪽 날개를 가볍게 흔들고 다른 날개는 자연스럽게 내린 마무리 포즈, 소품 없이 빈 날개.",
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: openMotion("the character smiles brightly and waves one wing lightly in a friendly goodbye while the other wing hangs naturally relaxed", "warmly saying goodbye and inviting comments"),
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findOwlEp25Scene(key) {
  return OWL_EP25_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
